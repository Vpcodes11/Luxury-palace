import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

const studies = [
  { name: 'Form', image: '/optimized/variations/variation_059.webp', mobile: '/optimized/variations/variation_059-mobile.webp', title: 'A rhythm of arches.', text: 'Repeated arches and measured proportions give the façade its quiet presence. Deep openings draw the eye from the terrace into the rooms beyond.', alt: 'The symmetrical palace façade with tall stone columns and arched bronze-framed doors' },
  { name: 'Material', image: '/optimized/palace-details/detail_000.webp', mobile: '/optimized/palace-details/detail_000-mobile.webp', title: 'Beauty in the substance.', text: 'Warm stone, turned columns and slender bronze frames. A restrained palette lets texture, depth and the meeting of materials carry the detail.', alt: 'The stone colonnade, bronze door frames and paving seen from the shaded arcade' },
  { name: 'Light', image: '/optimized/campaign/tour-palace.webp', mobile: '/optimized/campaign/tour-palace-mobile.webp', title: 'Light is part of the plan.', text: 'Sunlight traces the colonnade, shadows soften the interiors and water catches the changing sky. The same architecture takes on a different mood through the day.', alt: 'Golden light across the palace arcade and reflecting water, with the sea beyond' },
]

export function Architecture() {
  const sectionRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const loaded = useRef(new Set<number>())
  const [active, setActive] = useState(0)
  const [displayed, setDisplayed] = useState(0)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !sectionRef.current) return
    const context = gsap.context(() => {
      gsap.from('.architecture-study__image', {
        opacity: 0, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: '.architecture-study__image', start: 'top 94%', once: true },
      })
    }, sectionRef)
    return () => context.revert()
  }, [reduced])

  function select(index: number) {
    setActive(index)
    if (loaded.current.has(index)) setDisplayed(index)
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % studies.length
      : event.key === 'ArrowLeft' ? (index + studies.length - 1) % studies.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? studies.length - 1 : null
    if (next === null) return
    event.preventDefault()
    select(next)
    tabRefs.current[next]?.focus({ preventScroll: true })
  }

  return (
    <section id="architecture" ref={sectionRef} className="architecture section-dark" aria-labelledby="architecture-heading">
      <div className="chapter-line"><span>02 / The architecture</span><span>A study in restraint</span></div>
      <header className="architecture-heading">
        <h2 id="architecture-heading">Made of stone.<br /><em>Shaped by light.</em></h2>
        <p>Monumental in presence. Intimate in feeling. A dialogue between classical proportions and the ease of contemporary living.</p>
      </header>
      <div className="architecture-gallery">
        <div className="architecture-studies">
          <div className="architecture-tabs" role="tablist" aria-label="Architectural studies">
            {studies.map((study, index) => (
              <button key={study.name} ref={element => { tabRefs.current[index] = element }} id={`architecture-tab-${index}`} role="tab" aria-selected={active === index} aria-controls="architecture-study" tabIndex={active === index ? 0 : -1} onClick={() => select(index)} onKeyDown={event => navigate(event, index)}>
                <span aria-hidden="true">0{index + 1}</span>{study.name}<i aria-hidden="true" />
              </button>
            ))}
          </div>
          <div id="architecture-study" role="tabpanel" aria-labelledby={`architecture-tab-${active}`} aria-busy={active !== displayed} tabIndex={0}>
            <div className="architecture-study__image">
              {studies.map((study, index) => (
                <img key={study.name} src={study.image} srcSet={`${study.mobile} 800w, ${study.image} 1600w`} sizes="(max-width: 760px) 100vw, 63vw" width="1920" height="1080" alt={study.alt} aria-hidden={displayed !== index} className={displayed === index ? 'is-visible' : ''} loading="lazy" decoding="async" onLoad={() => { loaded.current.add(index); if (active === index) setDisplayed(index) }} />
              ))}
            </div>
            <div className="architecture-study__caption" aria-live="polite" aria-atomic="true">
              <span className="architecture-study__number" aria-hidden="true">0{active + 1} / 03</span>
              <div><h3>{studies[active].title}</h3><p>{studies[active].text}</p></div>
            </div>
          </div>
        </div>
        <aside className="architecture-detail">
          <figure>
            <div className="architecture-detail__image"><img src="/optimized/campaign/craft-signature.webp" srcSet="/optimized/campaign/craft-signature-mobile.webp 800w, /optimized/campaign/craft-signature.webp 1600w" sizes="(max-width: 760px) 35vw, 21vw" width="1920" height="1080" alt="Close detail of textured stone meeting wood and bronze" loading="lazy" decoding="async" /></div>
            <figcaption>The material palette<br />Stone / wood / bronze</figcaption>
          </figure>
          <p className="architecture-detail__quote">Considered.<br />To the <em>last detail.</em></p>
          <a className="chapter-link" href="#tour">Experience it in 3D <span aria-hidden="true">↗</span></a>
        </aside>
      </div>
      <div className="architecture-closing"><span>OMNIS</span><p>Presence, without excess.</p><span>Architecture / 02</span></div>
    </section>
  )
}
