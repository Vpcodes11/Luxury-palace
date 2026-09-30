import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export function Architecture() {
  const sectionRef = useRef<HTMLElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !sectionRef.current || !visualRef.current) return
    const context = gsap.context(() => {
      gsap.fromTo(visualRef.current, { clipPath: 'inset(18% 12% 18% 12%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%', end: 'bottom 70%', scrub: 0.7 },
      })
      gsap.fromTo('.architecture__word', { yPercent: 18 }, {
        yPercent: -7, ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
      })
    }, sectionRef)
    return () => context.revert()
  }, [reduced])

  return (
    <section id="architecture" ref={sectionRef} className="architecture section-dark">
      <div className="architecture__topline"><span>Architecture</span><span>02 / 09</span></div>
      <h2 className="architecture__word">Monumental<br /><em>without excess.</em></h2>
      <div ref={visualRef} className="architecture__visual">
        <img src="/variations/variation_059.jpg" alt="The symmetrical arched façade of OMNIS" loading="lazy" />
      </div>
      <div className="architecture__note">
        <span>01</span>
        <p>Natural stone, deep shadow and carefully framed light define the architectural language of OMNIS.</p>
      </div>
    </section>
  )
}
