import { expect, test } from '@playwright/test'

// Continuous trace screenshots stall WebKit's software renderer during motion.
// Keep event/DOM traces, but measure playback without the screen recorder.
test.use({ trace: { mode: 'retain-on-failure', screenshots: false } })

for (const fallback of [false, true]) {
  test(`hero paints intermediate camera positions with bounded decoded memory (${fallback ? 'fallback' : 'automatic'})`, async ({ page }) => {
    test.setTimeout(60000)
    if (fallback) await page.addInitScript(() => {
      window.Worker = class { constructor() { throw new Error('Worker unavailable') } } as unknown as typeof Worker
    })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/')
    const canvas = page.locator('.hero__canvas')
    const requests = () => page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /hero-film-02-architecture-day-night-v1\/frame_/.test(entry.name)).length)
    await expect.poll(() => page.evaluate(() => new Set(performance.getEntriesByType('resource').filter(entry => /hero-film-02-architecture-day-night-v1\/frame_/.test(entry.name)).map(entry => entry.name)).size), { timeout: 25000 }).toBe(80)
    await expect(canvas).toHaveAttribute('data-frame', '0')
    const preparedRequests = await requests()
    const movement = await page.evaluate(async () => {
      const canvas = document.querySelector<HTMLCanvasElement>('.hero__canvas')!
      const track = document.querySelector('#hero-track')!, hero = document.querySelector('#hero')!
      const end = (track.getBoundingClientRect().height - hero.getBoundingClientRect().height) * .88
      const frames = new Set<number>([Number(canvas.dataset.frame)])
      let maximumCache = 0, sampledTicks = 0
      const observer = new MutationObserver(() => {
        frames.add(Number(canvas.dataset.frame))
        maximumCache = Math.max(maximumCache, Number(canvas.dataset.cachedFrames ?? 0))
      })
      observer.observe(canvas, { attributes: true, attributeFilter: ['data-frame', 'data-cached-frames'] })
      const travel = (reverse: boolean) => new Promise<void>(resolve => {
        const start = performance.now()
        function tick(now: number) {
          sampledTicks++
          const progress = Math.min((now - start) / 6500, 1)
          window.scrollTo({ top: end * (reverse ? 1 - progress : progress), behavior: 'instant' })
          if (progress < 1) requestAnimationFrame(tick)
          else resolve()
        }
        requestAnimationFrame(tick)
      })
      await travel(false)
      await new Promise(resolve => setTimeout(resolve, 650))
      const reachedNight = Number(canvas.dataset.frame)
      await travel(true)
      await new Promise(resolve => setTimeout(resolve, 650))
      observer.disconnect()
      return { distinctPositions: frames.size, sampledTicks, maximumCache, reachedNight, returnedDay: Number(canvas.dataset.frame) }
    })
    await test.info().attach('Hero motion and decoded cache', { body: JSON.stringify(movement), contentType: 'application/json' })
    expect(movement.distinctPositions).toBeGreaterThan(60)
    expect(movement.maximumCache).toBeGreaterThan(0)
    expect(movement.maximumCache).toBeLessThanOrEqual(16)
    expect(movement.reachedNight).toBe(79)
    expect(movement.returnedDay).toBe(0)
    expect(await requests()).toBe(preparedRequests)
    expect(errors).toEqual([])
  })
}
