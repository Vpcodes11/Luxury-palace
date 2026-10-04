import { chromium, devices } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

// Run against a production preview: node scripts/profile-performance.mjs [url] [label]
const url = process.argv[2] || 'http://127.0.0.1:4175'
const label = process.argv[3] || 'profile'
const cpuRate = Number(process.env.PROFILE_CPU_THROTTLE || 1)
const warmupMs = Number(process.env.PROFILE_WARMUP_MS ?? 10000)
const modes = process.env.PROFILE_MODE ? [process.env.PROFILE_MODE] : ['desktop', 'mobile']
if (modes.some(mode => !['desktop', 'mobile'].includes(mode))) throw new Error('PROFILE_MODE must be desktop or mobile')
const results = []
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
for (const mode of modes) {
  const context = await browser.newContext(mode === 'mobile'
    ? { ...devices['Pixel 7'] }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate })
  // Approximate a 4 Mbps connection, 80 ms latency. CPU throttle is configurable.
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 80, downloadThroughput: 500000, uploadThroughput: 250000,
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    window.__profile = { tasks: [], lcp: 0, draws: [], bitmapSyncMs: [], drawSyncMs: [], maxDecodedHeroFrames: 0 }
    new MutationObserver(records => {
      for (const record of records) {
        const canvas = record.target
        if (canvas.classList?.contains('hero__canvas')) window.__profile.maxDecodedHeroFrames = Math.max(window.__profile.maxDecodedHeroFrames, Number(canvas.dataset.cachedFrames || 0))
        if (record.attributeName === 'data-frame' && canvas.dataset?.renderer === 'worker' && canvas.dataset.frame !== undefined) {
          window.__profile.draws.push({ time: performance.now(), src: `hero-film-worker-frame-${canvas.dataset.frame}` })
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-frame', 'data-cached-frames'] })
    const bitmapSources = new WeakMap()
    let anonymousBitmap = 0
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      const originalBlob = response.blob.bind(response)
      response.blob = async () => {
        const blob = await originalBlob()
        bitmapSources.set(blob, typeof args[0] === 'string' ? args[0] : args[0]?.url)
        return blob
      }
      return response
    }
    if (typeof window.createImageBitmap === 'function') {
      const originalCreateBitmap = window.createImageBitmap.bind(window)
      window.createImageBitmap = async (...args) => {
        const start = performance.now()
        const pending = originalCreateBitmap(...args)
        window.__profile.bitmapSyncMs.push(performance.now() - start)
        const bitmap = await pending
        bitmapSources.set(bitmap, args[0]?.src || bitmapSources.get(args[0]))
        return bitmap
      }
    }
    const originalDraw = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      let src = args[0]?.src || bitmapSources.get(args[0])
      if (!src && this.canvas.classList?.contains('hero__canvas')) {
        src = `hero-film-worker-bitmap-${++anonymousBitmap}`
        bitmapSources.set(args[0], src)
      }
      if (src?.includes('hero-film')) {
        window.__profile.draws.push({ time: performance.now(), src })
      }
      const start = performance.now()
      const result = originalDraw.apply(this, args)
      if (src?.includes('hero-film')) window.__profile.drawSyncMs.push(performance.now() - start)
      return result
    }
    new PerformanceObserver(list => {
      window.__profile.tasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration })))
    }).observe({ type: 'longtask', buffered: true })
    new PerformanceObserver(list => {
      window.__profile.lcp = list.getEntries().at(-1)?.startTime || 0
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  if (warmupMs > 0) await page.waitForTimeout(warmupMs)
  const initial = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource')
    const images = entries.filter(entry => /\.(webp|jpg|png)(\?|$)/.test(entry.name))
    const navigation = performance.getEntriesByType('navigation')[0]
    return {
      lcpMs: Math.round(window.__profile.lcp),
      firstHeroDrawMs: Math.round(window.__profile.draws[0]?.time || 0),
      domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
      documentTtfbMs: Math.round(navigation.responseStart - navigation.requestStart),
      documentDownloadMs: Math.round(navigation.responseEnd - navigation.responseStart),
      startupAfterDocumentMs: Math.round(navigation.domContentLoadedEventEnd - navigation.responseEnd),
      completedImageRequests: images.length,
      completedImageTransferKB: Math.round(images.reduce((sum, item) => sum + item.transferSize, 0) / 1000),
      completedJsTransferKB: Math.round(entries.filter(entry => /\.js(\?|$)/.test(entry.name)).reduce((sum, item) => sum + item.transferSize, 0) / 1000),
      initialLongTasks: window.__profile.tasks.length,
      initialLongTaskMs: Math.round(window.__profile.tasks.reduce((sum, task) => sum + task.duration, 0)),
      maxDecodedHeroFrames: window.__profile.maxDecodedHeroFrames,
    }
  })
  const scroll = await page.evaluate(async () => {
    const durations = []
    const start = performance.now()
    let previous = start
    const endY = Math.min(document.documentElement.scrollHeight - innerHeight, 10000)
    await new Promise(resolve => {
      function tick(now) {
        durations.push(now - previous)
        previous = now
        const progress = Math.min((now - start) / 10000, 1)
        window.scrollTo({ top: endY * progress, behavior: 'instant' })
        if (progress < 1) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    const ordered = durations.slice().sort((a, b) => a - b)
    const tasks = window.__profile.tasks.filter(task => task.start >= start)
    const draws = window.__profile.draws.filter(draw => draw.time >= start)
    const images = performance.getEntriesByType('resource').filter(entry => /\.(webp|jpg|png)(\?|$)/.test(entry.name))
    return {
      sampleSeconds: 10, scrollDistancePx: endY, sampledFrames: durations.length,
      firstHeroDrawMs: Math.round(window.__profile.draws[0]?.time || 0),
      observedLcpMs: Math.round(window.__profile.lcp),
      p95FrameIntervalMs: +ordered[Math.floor(ordered.length * 0.95)].toFixed(1),
      maxFrameIntervalMs: +Math.max(...durations).toFixed(1),
      intervalsAbove33ms: durations.filter(value => value > 33).length,
      intervalsAbove50ms: durations.filter(value => value > 50).length,
      scrollLongTasks: tasks.length,
      scrollLongTaskMs: Math.round(tasks.reduce((sum, task) => sum + task.duration, 0)),
      heroDrawCalls: draws.length,
      distinctHeroFramesDrawn: new Set(draws.map(draw => draw.src)).size,
      totalCompletedImageRequests: images.length,
      totalCompletedImageTransferKB: Math.round(images.reduce((sum, item) => sum + item.transferSize, 0) / 1000),
      maxBitmapSyncMs: Math.round(Math.max(0, ...window.__profile.bitmapSyncMs)),
      maxHeroDrawSyncMs: Math.round(Math.max(0, ...window.__profile.drawSyncMs)),
      maxDecodedHeroFrames: window.__profile.maxDecodedHeroFrames,
    }
  })
  const result = { mode, network: `4 Mbps / 80 ms latency, cold cache, CPU throttle ${cpuRate}x`, warmupMs, initial, scroll, errors }
  results.push(result)
  console.log(JSON.stringify(result))
  await context.close()
}
await browser.close()
await mkdir('performance-results', { recursive: true })
await writeFile(`performance-results/${label}-performance.json`, JSON.stringify({ url, measuredAt: new Date().toISOString(), results }, null, 2))
