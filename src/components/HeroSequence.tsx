import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_FILM } from '../lib/frameManifest.generated'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export function HeroSequence() {
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const track = trackRef.current, section = sectionRef.current, canvas = canvasRef.current, copy = copyRef.current
    if (!track || !section || !canvas || !copy) return
    const mobile = window.matchMedia('(max-width: 760px)').matches
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const staticFilm = reducedMotion || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')
    if (staticFilm) return
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return
    canvas.style.opacity = '0'
    const urls = mobile ? HERO_FILM.mobileUrls : HERO_FILM.urls
    const images: Array<HTMLImageElement | ImageBitmap | undefined> = new Array(urls.length)
    const pending = new Map<number, HTMLImageElement>()
    const failed = new Set<number>()
    let queue: number[] = [], currentIndex = 0, paintedIndex = -1
    let destroyed = false, active = true, warming = false, renderFrame = 0, warmTimer = 0
    let pixelWidth = 1, pixelHeight = 1
    const playhead = { progress: 0 }

    const draw = () => {
      renderFrame = 0
      if (destroyed || !active) return
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
        if (images[index] || pending.has(index) || failed.has(index)) continue
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
      queue = [...new Set(priority)].filter(index => index >= 0 && index < urls.length && !images[index] && !pending.has(index) && !failed.has(index))
      pump()
    }

    // Cache dimensions outside the scroll/draw path.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.25)
      const width = section.clientWidth * dpr, height = section.clientHeight * dpr
      // A larger desktop drawing buffer cannot add detail to the source frames.
      const scale = mobile ? 1 : Math.min(1, HERO_FILM.meta.width / width, HERO_FILM.meta.height / height)
      pixelWidth = Math.max(1, Math.round(width * scale))
      pixelHeight = Math.max(1, Math.round(height * scale))
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth; canvas.height = pixelHeight; paintedIndex = -1
      }
      scheduleDraw()
    }
    resize()
    const sizeObserver = new ResizeObserver(resize)
    sizeObserver.observe(section)
    const visibility = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting
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
        },
      })
    }, track)
    return () => {
      destroyed = true; clearTimeout(warmTimer); cancelAnimationFrame(renderFrame)
      sizeObserver.disconnect(); visibility.disconnect(); gsapContext.revert()
      pending.forEach(image => { image.onload = null; image.onerror = null; image.src = '' })
      pending.clear(); images.forEach(image => { if (image && 'close' in image) image.close() }); images.length = 0
      canvas.style.opacity = '0'
      copy.style.opacity = ''; copy.style.transform = ''
    }
  }, [reducedMotion])

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  const staticFilm = reducedMotion || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')
  return <div id="hero-track" ref={trackRef} className={`hero-track ${staticFilm ? 'hero-track--static' : ''}`}>
    <section id="hero" ref={sectionRef} className={`hero ${staticFilm ? 'hero--static' : ''}`} aria-label="OMNIS cinematic arrival">
      <img className="hero__poster" src={window.matchMedia('(max-width: 760px)').matches ? HERO_FILM.mobileUrls[0] : HERO_FILM.urls[0]} alt="" fetchPriority="high" decoding="async" />
      <canvas ref={canvasRef} className="hero__canvas" aria-label={`${HERO_FILM.meta.count}-frame architectural sequence, Film 02`} />
      <div className="hero__shade" />
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
