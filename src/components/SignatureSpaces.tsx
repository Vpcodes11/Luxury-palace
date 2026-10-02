import { useState } from 'react'
import { SpaceGallery } from './SpaceGallery'

const spaces = [
  {
    title: 'The Courtyard',
    meta: 'Dining / Water / Olive',
    description: 'An open room held between carved stone, still water and the quiet rhythm of olive trees.',
    image: '/optimized/campaign/courtyard-signature.webp',
    position: '64% center',
  },
  {
    title: 'The Craft',
    meta: 'Stone / Bronze / Oak',
    description: 'A close study of material, where every junction is designed to be felt before it is seen.',
    image: '/optimized/hero-film-09-craft/frame_108.webp',
    position: 'center',
  },
  {
    title: 'The Water Court',
    meta: 'Reflection / Horizon / Light',
    description: 'A ceremonial threshold where architecture dissolves into reflection, sky and sea.',
    image: '/optimized/variations/variation_034.webp',
    position: 'center 72%',
  },
]

export function SignatureSpaces() {
  const [active, setActive] = useState(0)
  const [gallery, setGallery] = useState<number | null>(null)

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
              onClick={event => { event.currentTarget.focus(); setActive(index); setGallery(index) }}
              onFocus={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
            >
              <img src={space.image} srcSet={`${space.image.replace(".webp", "-mobile.webp")} 800w, ${space.image} 1600w`} sizes="(max-width: 760px) 100vw, 65vw" alt={`${space.title} at OMNIS`} loading="lazy" style={{ objectPosition: space.position }} />
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
      {gallery !== null && <SpaceGallery collection={gallery} onClose={() => setGallery(null)} />}
    </section>
  )
}
