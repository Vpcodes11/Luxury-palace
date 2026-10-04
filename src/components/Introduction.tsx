import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

export function Introduction() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !sectionRef.current) return
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-residence-reveal]').forEach(element => {
        gsap.from(element, {
          y: 24, opacity: 0, duration: 1, ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 94%', once: true },
        })
      })
    }, sectionRef)
    return () => context.revert()
  }, [reduced])

  return (
    <section id="introduction" ref={sectionRef} className="introduction section-light" aria-labelledby="residence-heading">
      <div className="chapter-line"><span>01 / The residence</span><span>OMNIS · Mediterranean living</span></div>
      <header className="residence-heading" data-residence-reveal>
        <p className="residence-heading__aside">A private world.<br />An open horizon.</p>
        <h2 id="residence-heading">A world<br /><em>of its own.</em></h2>
        <div className="residence-heading__copy">
          <p>Above the sea, a quieter way of living. Stone courtyards, shaded terraces and rooms that open to the horizon.</p>
          <a className="chapter-link" href="#architecture">Discover the architecture <span aria-hidden="true">↗</span></a>
        </div>
      </header>
      <div className="residence-composition">
        <figure className="residence-estate" data-residence-reveal>
          <div className="residence-estate__image">
            <img src="/optimized/campaign/aerial-estate.webp" srcSet="/optimized/campaign/aerial-estate-mobile.webp 800w, /optimized/campaign/aerial-estate.webp 1600w" sizes="(max-width: 760px) 100vw, 59vw" width="1920" height="1080" alt="The coastal estate, its courtyards and pools beside the Mediterranean" loading="lazy" decoding="async" />
          </div>
          <figcaption><span>The estate & its horizon</span><span>Fig. 01</span></figcaption>
          <p className="residence-estate__statement">Space to retreat.<br /><em>Room to breathe.</em></p>
        </figure>
        <div className="residence-detail" data-residence-reveal>
          <figure>
            <div className="residence-detail__image">
              <img src="/optimized/palace-details/detail_000.webp" srcSet="/optimized/palace-details/detail_000-mobile.webp 800w, /optimized/palace-details/detail_000.webp 1600w" sizes="(max-width: 760px) 65vw, 25vw" width="1920" height="1080" alt="Sunlit stone columns framing the palace arcade and reflecting pool" loading="lazy" decoding="async" />
            </div>
            <figcaption><span>A moment in the arcade</span><span>Fig. 02</span></figcaption>
          </figure>
          <p>Between the stillness of stone and the openness of the sea.</p>
        </div>
      </div>
      <div className="residence-values"><span>Stone & shadow</span><span>Courtyard & garden</span><span>Sea & sky</span></div>
    </section>
  )
}
