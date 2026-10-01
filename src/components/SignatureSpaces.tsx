import { useState } from 'react'

const spaces = [
  {
    title: 'The Courtyard',
    meta: 'Dining / Water / Olive',
    description: 'An open room held between carved stone, still water and the quiet rhythm of olive trees.',
    image: '/campaign/courtyard-signature.jpg',
    position: '64% center',
  },
  {
    title: 'The Craft',
    meta: 'Stone / Bronze / Oak',
    description: 'A close study of material, where every junction is designed to be felt before it is seen.',
    image: '/hero-film-09-craft/frame_108.jpg',
    position: 'center',
  },
  {
    title: 'The Water Court',
    meta: 'Reflection / Horizon / Light',
    description: 'A ceremonial threshold where architecture dissolves into reflection, sky and sea.',
    image: '/variations/variation_034.jpg',
    position: 'center 72%',
  },
]

export function SignatureSpaces() {
  const [active, setActive] = useState(0)

  return (
    <section id="spaces" className="signature section-sand">
      <header className="signature__header">
        <div className="signature__kicker">
          <p className="eyebrow">Signature spaces</p>
          <span>03 / Spatial studies</span>
        </div>
        <h2>Three studies<br />in <em>stillness.</em></h2>
        <p className="signature__intro">Rooms are conceived as quiet frames—holding light, material and landscape in careful proportion.</p>
      </header>

      <div className="signature__atlas" aria-label="Explore the signature spaces">
        {spaces.map((space, index) => (
          <article key={space.title} className={`space-card ${active === index ? 'is-active' : ''}`}>
            <button
              type="button"
              className="space-card__button"
              aria-pressed={active === index}
              aria-label={`Explore ${space.title}`}
              onClick={() => setActive(index)}
              onFocus={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
            >
              <img src={space.image} alt={`${space.title} at OMNIS`} loading="lazy" style={{ objectPosition: space.position }} />
              <span className="space-card__veil" aria-hidden="true" />
              <span className="space-card__topline">
                <span>0{index + 1}</span>
                <span>{space.meta}</span>
              </span>
              <span className="space-card__copy">
                <span className="space-card__title">{space.title}</span>
                <span className="space-card__description">{space.description}</span>
                <span className="space-card__action">Enter the space <i aria-hidden="true">↗</i></span>
              </span>
            </button>
          </article>
        ))}
      </div>

      <div className="signature__footnote" aria-hidden="true">
        <span>Material</span><i /><span>Light</span><i /><span>Landscape</span>
      </div>
    </section>
  )
}
