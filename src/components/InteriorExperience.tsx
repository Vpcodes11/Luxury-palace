import { useEffect, useRef, useState } from 'react'

const spaces = [
  { number: '01', name: 'The Grand Salon', description: 'A monumental living room framed by carved stone, warm light and an uninterrupted horizon.', image: '/campaign/grand-salon.jpg', alt: 'The limestone grand salon overlooking the sea' },
  { number: '02', name: 'The Primary Suite', description: 'Quiet materials, generous proportions and a private outlook across the Mediterranean.', image: '/campaign/primary-suite.jpg', alt: 'The primary suite opening to an arched sea view' },
  { number: '03', name: 'Courtyard Dining', description: 'An open-air dining room held between olive trees, arcades and still water.', image: '/campaign/courtyard-dining.jpg', alt: 'The courtyard dining terrace beside the reflecting pool' },
]

export function InteriorExperience() {
  const [active, setActive] = useState(0)
  const itemRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.index))
    }, { threshold: [0.45, 0.7], rootMargin: '-18% 0px -18% 0px' })
    itemRefs.current.forEach((item) => item && observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="residence" className="interiors section-light">
      <div className="interiors__intro">
        <p className="eyebrow">Interior experience</p>
        <h2>Life, composed<br /><em>from within.</em></h2>
      </div>
      <div className="interiors__story">
        <div className="interiors__visual" aria-live="polite">
          {spaces.map((space, index) => (
            <img key={space.name} className={index === active ? 'is-active' : ''} src={space.image} alt={space.alt} loading={index ? 'lazy' : 'eager'} />
          ))}
          <span className="interiors__counter">{spaces[active].number} / 03</span>
        </div>
        <div className="interiors__chapters">
          {spaces.map((space, index) => (
            <article key={space.name} data-index={index} ref={(element) => { itemRefs.current[index] = element }}>
              <span>{space.number}</span>
              <h3>{space.name}</h3>
              <p>{space.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
