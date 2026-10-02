import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_VARIANTS } from '../lib/frameManifest.generated'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)
const HOMEPAGE_FILM = HERO_VARIANTS.find(variant => variant.id === '2')!

export function HeroSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const selectedVariant = HOMEPAGE_FILM

  useLayoutEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    const copy = copyRef.current
    if (!section || !canvas || !copy) return

    const isMobile = window.matchMedia('(max-width: 600px)').matches
    const sourceUrls = isMobile ? selectedVariant.mobileUrls : selectedVariant.urls
    const urls = isMobile
      ? sourceUrls.filter((_, index) => index === 0 || index === sourceUrls.length - 1 || index % 2 === 0)
      : [...sourceUrls]
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const images: Array<HTMLImageElement | undefined> = new Array(urls.length)
    const pending = new Set<number>()
    const failed = new Set<number>()
    const queue: number[] = []
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

    const pump = () => {
      if (destroyed) return
      while (pending.size < (isMobile ? 2 : 3) && queue.length) {
        const index = queue.shift()!
        if (images[index] || pending.has(index) || failed.has(index)) continue
        pending.add(index)
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => {
          if (destroyed) return
          images[index] = image
          pending.delete(index)
          // Keep decoded image memory bounded even after the entire film is scrolled.
          images.forEach((_, loadedIndex) => {
            if (loadedIndex !== 0 && Math.abs(loadedIndex - currentIndex) > 12) images[loadedIndex] = undefined
          })
          void image.decode?.().catch(() => undefined)
          draw(currentIndex)
          pump()
        }
        image.onerror = () => {
          pending.delete(index)
          failed.add(index)
          // A damaged first frame should not leave the arrival empty.
          if (index === 0 && !images.some(Boolean) && urls.length > 1) load(1)
          pump()
        }
        image.src = urls[index]
      }
    }
    const load = (index: number) => {
      if (index < 0 || index >= urls.length || images[index] || pending.has(index) || failed.has(index) || queue.includes(index)) return
      queue.push(index)
      pump()
    }

    const loadNearby = (center: number) => {
      queue.length = 0
      for (let offset = 0; offset <= 4; offset += 1) {
        load(center + offset)
        load(center - offset)
      }
    }

    load(0)
    if (!reducedMotion) loadNearby(0)

    const resize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => draw(currentIndex))
    }
    window.addEventListener('resize', resize, { passive: true })
    copy.style.opacity = '1'
    copy.style.transform = ''

    if (reducedMotion) {
      section.classList.add('hero--static')
      return () => {
        destroyed = true
        window.removeEventListener('resize', resize)
        cancelAnimationFrame(resizeFrame)
      }
    }
    section.classList.remove('hero--static')

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
    <section id="hero" ref={sectionRef} className="hero" aria-label="OMNIS cinematic arrival" style={{ backgroundImage: `url(${selectedVariant.mobileUrls[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <canvas ref={canvasRef} className="hero__canvas" aria-label={`${selectedVariant.meta.count}-frame architectural sequence, ${selectedVariant.label}`} />
      <div className="hero__shade" />
      <div ref={copyRef} className="hero__copy">
        <p className="eyebrow eyebrow--light">A private Mediterranean residence</p>
        <h1><span>Where time</span><br /><em>moves differently.</em></h1>
        <p className="hero__support">A private Mediterranean residence shaped by light, stone and sea.</p>
      </div>
      <div className="hero__scroll"><span>Scroll to enter</span><i /></div>
      <div className="hero__index" aria-hidden="true">OMNIS<br />Concept residence</div>
    </section>
  )
}
