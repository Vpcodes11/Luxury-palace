import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export function Introduction() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !sectionRef.current || !imageRef.current) return
    const context = gsap.context(() => {
      gsap.fromTo(imageRef.current, { width: '70%' }, {
        width: '88%', duration: 1.5, ease: 'power3.out',
        scrollTrigger: { trigger: imageRef.current, start: 'top 88%', toggleActions: 'play none none reverse' },
      })
    }, sectionRef)
    return () => context.revert()
  }, [reduced])

  return (
    <section id="introduction" ref={sectionRef} className="introduction section-light">
      <div className="intro__header">
        <p className="eyebrow">OMNIS — Residence 01</p>
        <div className="intro__title-row">
          <h2>A private residence<br />shaped by stone,<br />light and the<br /><em>Mediterranean.</em></h2>
          <p>Designed as a quiet sanctuary above the sea, OMNIS brings monumental architecture together with restrained contemporary living.</p>
        </div>
      </div>
      <div ref={imageRef} className="intro__image image-frame">
        <img src="/campaign/aerial-estate.jpg" alt="OMNIS set above the Mediterranean coastline" loading="lazy" />
        <span className="image-caption">Coastal estate / Mediterranean setting</span>
      </div>
    </section>
  )
}
