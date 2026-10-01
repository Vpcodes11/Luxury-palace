import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_VARIANTS } from '../lib/frameManifest.generated'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

type IdleWindow = Window & typeof globalThis & { requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number }

const HOMEPAGE_FILM_IDS = new Set(['2', '3', '5', '10'])
const HOMEPAGE_VARIANTS = HERO_VARIANTS.filter((variant) => HOMEPAGE_FILM_IDS.has(variant.id))

export function HeroSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const requestedVariant = new URLSearchParams(window.location.search).get('variant')
  const selectedVariant = HOMEPAGE_VARIANTS.find((variant) => variant.id === requestedVariant) ?? HOMEPAGE_VARIANTS[0]

  useLayoutEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    const copy = copyRef.current
    if (!section || !canvas || !copy) return

    const isMobile = window.matchMedia('(max-width: 600px)').matches
    const sourceUrls = selectedVariant.urls
    const urls = isMobile
      ? sourceUrls.filter((_, index) => index === 0 || index === sourceUrls.length - 1 || index % 2 === 0)
      : [...sourceUrls]
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const images: Array<HTMLImageElement | undefined> = new Array(urls.length)
    const pending = new Set<number>()
    let currentIndex = 0
    let destroyed = false
    let resizeFrame = 0

    const draw = (requested = currentIndex) => {
      if (destroyed) return
      let image = images[requested]
      if (!image) {
        for (let offset = 1; offset < images.length; offset += 1) {
          image = images[requested - offset] ?? images[requested + offset]
          if (image) break
        }
      }
      if (!image?.naturalWidth) return
      const bounds = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2)
      const pixelWidth = Math.max(1, Math.round(bounds.width * dpr))
      const pixelHeight = Math.max(1, Math.round(bounds.height * dpr))
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      const scale = Math.max(pixelWidth / image.naturalWidth, pixelHeight / image.naturalHeight)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.fillStyle = '#171713'
      context.fillRect(0, 0, pixelWidth, pixelHeight)
      context.drawImage(image, (pixelWidth - width) / 2, (pixelHeight - height) / 2, width, height)
    }

    const load = (index: number) => {
      if (index < 0 || index >= urls.length || images[index] || pending.has(index)) return
      pending.add(index)
      const image = new Image()
      image.decoding = 'async'
      image.src = urls[index]
      image.onload = () => {
        if (destroyed) return
        images[index] = image
        pending.delete(index)
        void image.decode?.().catch(() => undefined)
        if (index === 0 || index === currentIndex) draw(currentIndex)
      }
      image.onerror = () => pending.delete(index)
    }

    const loadNearby = (center: number) => {
      for (let offset = 0; offset <= 6; offset += 1) {
        load(center + offset)
        load(center - offset)
      }
    }

    load(0)
    for (let index = 1; index < Math.min(10, urls.length); index += 1) load(index)

    const idleWindow = window as IdleWindow
    const backgroundLoad = () => {
      for (let index = 0; index < urls.length; index += 1) load(index)
    }
    if (idleWindow.requestIdleCallback) idleWindow.requestIdleCallback(backgroundLoad, { timeout: 2200 })
    else window.setTimeout(backgroundLoad, 800)

    const resize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => draw(currentIndex))
    }
    window.addEventListener('resize', resize, { passive: true })

    if (reducedMotion) {
      section.classList.add('hero--static')
      return () => {
        destroyed = true
        window.removeEventListener('resize', resize)
        cancelAnimationFrame(resizeFrame)
      }
    }

    const gsapContext = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * 3}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const sequenceProgress = Math.min(self.progress / 0.88, 1)
          const next = Math.round(sequenceProgress * (urls.length - 1))
          if (next !== currentIndex) {
            currentIndex = next
            loadNearby(next)
            draw(next)
          }
          const fade = gsap.utils.clamp(0, 1, 1 - (self.progress - 0.1) / 0.17)
          copy.style.opacity = String(fade)
          copy.style.transform = `translate3d(0, ${24 * (1 - fade)}px, 0)`
        },
      })
    }, section)

    return () => {
      destroyed = true
      gsapContext.revert()
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(resizeFrame)
    }
  }, [reducedMotion, selectedVariant])

  return (
    <section id="hero" ref={sectionRef} className="hero" aria-label="OMNIS cinematic arrival">
      <canvas ref={canvasRef} className="hero__canvas" aria-label={`${selectedVariant.meta.count}-frame architectural sequence, ${selectedVariant.label}`} />
      <div className="hero__shade" />
      <div ref={copyRef} className="hero__copy">
        <p className="eyebrow eyebrow--light">A private Mediterranean residence</p>
        <h1><span>Where time</span><br /><em>moves differently.</em></h1>
        <p className="hero__support">A private Mediterranean residence shaped by light, stone and sea.</p>
      </div>
      <div className="hero__scroll"><span>Scroll to enter</span><i /></div>
      <nav className="hero__variants" aria-label="Landing page film variations">
        <span>Film</span>
        {HOMEPAGE_VARIANTS.map((variant, index) => (
          <a
            key={variant.id}
            href={index === 0 ? '/' : `/?variant=${variant.id}`}
            aria-current={variant.id === selectedVariant.id ? 'page' : undefined}
            aria-label={`View ${variant.label}`}
          >
            {variant.id.padStart(2, '0')}
          </a>
        ))}
      </nav>
      <div className="hero__index" aria-hidden="true">36° N<br />04° E</div>
    </section>
  )
}
