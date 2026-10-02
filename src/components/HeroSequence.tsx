import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_FILM } from '../lib/frameManifest.generated'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

const getProfile = () => window.matchMedia('(max-width: 760px)').matches
  ? window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
  : 'desktop'

export function HeroSequence() {
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const [profile, setProfile] = useState(getProfile)
  const urls = profile === 'portrait' ? HERO_FILM.mobileUrls : profile === 'landscape' ? HERO_FILM.landscapeUrls : HERO_FILM.urls

  useEffect(() => {
    const queries = [window.matchMedia('(max-width: 760px)'), window.matchMedia('(orientation: portrait)')]
    const update = () => setProfile(getProfile())
    queries.forEach(query => query.addEventListener('change', update))
    return () => queries.forEach(query => query.removeEventListener('change', update))
  }, [])

  useLayoutEffect(() => {
    const track = trackRef.current, section = sectionRef.current, canvas = canvasRef.current, copy = copyRef.current, shade = shadeRef.current
    if (!track || !section || !canvas || !copy || !shade) return
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const staticFilm = reducedMotion || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')
    if (staticFilm) return
    let context: CanvasRenderingContext2D | null = null
    canvas.style.opacity = '0'
    const sourceWidth = profile === 'portrait' ? HERO_FILM.meta.mobileWidth : profile === 'landscape' ? HERO_FILM.meta.landscapeWidth : HERO_FILM.meta.width
    const sourceHeight = profile === 'portrait' ? HERO_FILM.meta.mobileHeight : profile === 'landscape' ? HERO_FILM.meta.landscapeHeight : HERO_FILM.meta.height
    const images: Array<HTMLImageElement | ImageBitmap | undefined> = new Array(urls.length)
    const pending = new Map<number, HTMLImageElement | AbortController>()
    const failed = new Set<number>()
    const loaded = new Set<number>()
    let decoder: Worker | undefined
    let workerDrawing = false
    let blobDecodingFailed = false
    let resolveDecoderReady!: (ready: boolean) => void
    const decoderReady = new Promise<boolean>(resolve => { resolveDecoderReady = resolve })
    const decoding = new Map<number, { resolve: () => void; reject: () => void }>()
    const enableFallback = () => {
      try { context = canvas.getContext('2d', { alpha: false, desynchronized: true }) } catch { context = null }
      if (context) { context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'low' }
    }
    try {
      if (typeof canvas.transferControlToOffscreen !== 'function') throw new Error('Worker canvas unavailable')
      decoder = new Worker(new URL('../lib/heroDecoder.worker.ts', import.meta.url), { type: 'module' })
      decoder.onmessage = ({ data }: MessageEvent<{ index: number; loaded?: boolean; failed?: boolean; ready?: boolean; painted?: number }>) => {
        if (destroyed) return
        if (typeof data.ready === 'boolean') {
          if (data.ready) {
            try {
              const offscreen = canvas.transferControlToOffscreen()
              workerDrawing = true; canvas.dataset.renderer = 'worker'
              decoder?.postMessage({ canvas: offscreen, width: pixelWidth, height: pixelHeight, active }, [offscreen])
            } catch { data.ready = false }
          }
          resolveDecoderReady(data.ready)
          if (!data.ready) { blobDecodingFailed = true; decoder?.terminate(); decoder = undefined; enableFallback() }
          return
        }
        if (data.painted !== undefined) {
          canvas.style.opacity = '1'; canvas.dataset.frame = String(data.painted)
          return
        }
        const job = decoding.get(data.index)
        if (job) { decoding.delete(data.index); if (data.loaded) job.resolve(); else job.reject() }
      }
      decoder.onerror = event => {
        event.preventDefault()
        blobDecodingFailed = true
        resolveDecoderReady(false)
        decoding.forEach(job => job.reject()); decoding.clear()
        decoder?.terminate(); decoder = undefined
        enableFallback()
      }
    } catch { blobDecodingFailed = true; resolveDecoderReady(false); enableFallback() }
    const decode = (blob: Blob, index: number) => new Promise<void>((resolve, reject) => {
      if (!decoder) { reject(); return }
      decoding.set(index, { resolve, reject })
      decoder.postMessage({ index, blob })
    })
    let queue: number[] = [], currentIndex = 0, paintedIndex = -1
    let destroyed = false, active = true, warming = false, renderFrame = 0, warmTimer = 0
    let pixelWidth = 1, pixelHeight = 1
    const playhead = { progress: 0 }

    const draw = () => {
      renderFrame = 0
      if (destroyed || !active) return
      if (workerDrawing) { decoder?.postMessage({ frame: currentIndex }); return }
      if (!context) return
      let index = currentIndex
      if (!images[index]) {
        for (let distance = 1; distance < urls.length; distance++) {
          if (images[index - distance]) { index -= distance; break }
          if (images[index + distance]) { index += distance; break }
        }
      }
      const image = images[index]
      if (!image || index === paintedIndex) return
      const imageWidth = 'naturalWidth' in image ? image.naturalWidth : image.width
      const imageHeight = 'naturalHeight' in image ? image.naturalHeight : image.height
      const scale = Math.max(pixelWidth / imageWidth, pixelHeight / imageHeight)
      const width = imageWidth * scale, height = imageHeight * scale
      context.drawImage(image, (pixelWidth - width) / 2, (pixelHeight - height) / 2, width, height)
      canvas.style.opacity = '1'
      paintedIndex = index
      canvas.dataset.frame = String(index)
    }
    const scheduleDraw = () => { if (!renderFrame && !destroyed) renderFrame = requestAnimationFrame(draw) }

    const pump = () => {
      if (destroyed || !active) return
      // Two requests at a time, including decode, with low-priority warmup.
      while (pending.size < 2 && queue.length) {
        const index = queue.shift()!
        if (loaded.has(index) || pending.has(index) || failed.has(index)) continue
        if (decoder && !blobDecodingFailed) {
          const controller = new AbortController()
          pending.set(index, controller)
          // Fetch on the page; prepare pixels in the background worker.
          void (async () => {
            try {
              if (!await decoderReady) throw new Error('Background decoding unavailable')
              const response = await fetch(urls[index], { signal: controller.signal, priority: index === 0 ? 'high' : 'low' } as RequestInit & { priority: string })
              if (!response.ok) throw new Error('Frame unavailable')
              await decode(await response.blob(), index)
              if (destroyed) return
              loaded.add(index)
              pending.delete(index)
              scheduleDraw()
              if (index === 0 && !warmTimer) warmTimer = window.setTimeout(() => { warming = true; enqueue(currentIndex) }, 700)
              pump()
            } catch {
              if (destroyed) return
              // Older browsers retain the HTML-image path if worker decode fails.
              pending.delete(index)
              if (workerDrawing) failed.add(index)
              else { blobDecodingFailed = true; queue.unshift(index) }
              if (index === 0) { warming = true; enqueue(1) }
              pump()
            }
          })()
          continue
        }
        const image = new Image()
        pending.set(index, image)
        image.decoding = 'async'
        image.fetchPriority = index === 0 ? 'high' : 'low'
        image.onload = async () => {
          try { await image.decode() } catch { /* Some browsers decode on load. */ }
          // Image.decode() alone does not retain the browser's decoded pixels.
          // Bitmaps prevent lazy re-decoding during the next scroll commit.
          let decoded: HTMLImageElement | ImageBitmap = image
          if (typeof createImageBitmap === 'function') {
            try { decoded = await createImageBitmap(image) } catch { /* Keep HTML image fallback. */ }
          }
          if (destroyed) { if ('close' in decoded) decoded.close(); return }
          images[index] = decoded
          loaded.add(index)
          pending.delete(index)
          scheduleDraw()
          if (index === 0 && !warmTimer) warmTimer = window.setTimeout(() => { warming = true; enqueue(currentIndex) }, 700)
          pump()
        }
        image.onerror = () => {
          if (destroyed) return
          pending.delete(index); failed.add(index)
          if (index === 0) { warming = true; enqueue(1) }
          pump()
        }
        image.src = urls[index]
      }
    }
    const enqueue = (center: number) => {
      const priority: number[] = [center]
      for (let offset = 1; offset <= 4; offset++) priority.push(center + offset, center - offset)
      if (warming) for (let index = 0; index < urls.length; index++) priority.push(index)
      queue = [...new Set(priority)].filter(index => index >= 0 && index < urls.length && !loaded.has(index) && !pending.has(index) && !failed.has(index))
      pump()
    }

    // Cache dimensions outside the scroll/draw path.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = section.clientWidth * dpr, height = section.clientHeight * dpr
      // A larger desktop drawing buffer cannot add detail to the source frames.
      const scale = Math.min(1, sourceWidth / width, sourceHeight / height)
      pixelWidth = Math.max(1, Math.round(width * scale))
      pixelHeight = Math.max(1, Math.round(height * scale))
      if (workerDrawing) decoder?.postMessage({ width: pixelWidth, height: pixelHeight })
      else if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth; canvas.height = pixelHeight; paintedIndex = -1
      }
      if (context) context.imageSmoothingEnabled = true
      // Bilinear canvas scaling avoids expensive per-frame high-quality filters.
      // Detail comes from the larger source and drawing buffer instead.
      if (context) context.imageSmoothingQuality = 'low'
      scheduleDraw()
    }
    resize()
    const sizeObserver = new ResizeObserver(resize)
    sizeObserver.observe(section)
    const visibility = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting
      if (workerDrawing) decoder?.postMessage({ active })
      if (active) { enqueue(currentIndex); scheduleDraw() }
    })
    visibility.observe(section)
    enqueue(0)
    const gsapContext = gsap.context(() => {
      gsap.to(playhead, {
        progress: 1, ease: 'none',
        scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: .18, invalidateOnRefresh: true },
        onUpdate: () => {
          const next = Math.round(Math.min(playhead.progress / .88, 1) * (urls.length - 1))
          if (next !== currentIndex) { currentIndex = next; enqueue(next); scheduleDraw() }
          const fade = gsap.utils.clamp(0, 1, 1 - (playhead.progress - .1) / .17)
          copy.style.opacity = String(fade)
          copy.style.transform = `translate3d(0, calc(-42% + ${24 * (1 - fade)}px), 0)`
          shade.style.opacity = String(.35 + .65 * fade)
        },
      })
    }, track)
    return () => {
      destroyed = true; clearTimeout(warmTimer); cancelAnimationFrame(renderFrame)
      sizeObserver.disconnect(); visibility.disconnect(); gsapContext.revert()
      pending.forEach(request => {
        if (request instanceof AbortController) request.abort()
        else { request.onload = null; request.onerror = null; request.src = '' }
      })
      pending.clear(); images.forEach(image => { if (image && 'close' in image) image.close() }); images.length = 0
      resolveDecoderReady(false); decoder?.terminate(); decoding.forEach(job => job.reject()); decoding.clear()
      delete canvas.dataset.renderer; delete canvas.dataset.frame
      canvas.style.opacity = '0'
      copy.style.opacity = ''; copy.style.transform = ''
      shade.style.opacity = ''
    }
  }, [reducedMotion, profile])

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  const staticFilm = reducedMotion || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')
  return <div id="hero-track" ref={trackRef} className={`hero-track ${staticFilm ? 'hero-track--static' : ''}`}>
    <section id="hero" ref={sectionRef} className={`hero ${staticFilm ? 'hero--static' : ''}`} aria-label="OMNIS cinematic arrival">
      <img className="hero__poster" src={urls[0]} alt="" fetchPriority="high" decoding="async" />
      <canvas key={`${profile}-${reducedMotion}`} ref={canvasRef} className="hero__canvas" aria-label={`${HERO_FILM.meta.count}-frame architectural sequence, Film 02`} />
      <div ref={shadeRef} className="hero__shade" />
      <div ref={copyRef} className="hero__copy">
        <p className="eyebrow eyebrow--light">A private Mediterranean residence</p>
        <h1><span>Where time</span><br /><em>moves differently.</em></h1>
        <p className="hero__support">A private Mediterranean residence shaped by light, stone and sea.</p>
      </div>
      <div className="hero__scroll"><span>Scroll to enter</span><i /></div>
      <div className="hero__index" aria-hidden="true">OMNIS<br />Concept residence</div>
    </section>
  </div>
}
