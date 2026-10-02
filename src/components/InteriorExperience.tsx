const spaces = [
  {
    number: '01',
    name: 'The Grand Salon',
    description: 'A monumental living room framed by carved stone, warm light and an uninterrupted horizon.',
    detail: 'Limestone / Oak / Sea light',
    image: '/optimized/campaign/grand-salon.webp',
    alt: 'The limestone grand salon overlooking the sea',
  },
  {
    number: '02',
    name: 'The Primary Suite',
    description: 'Quiet materials, generous proportions and a private outlook across the Mediterranean.',
    detail: 'Linen / Travertine / Horizon',
    image: '/optimized/campaign/primary-suite.webp',
    alt: 'The primary suite opening to an arched sea view',
  },
  {
    number: '03',
    name: 'Courtyard Dining',
    description: 'An open-air dining room held between olive trees, arcades and still water.',
    detail: 'Stone / Water / Olive',
    image: '/optimized/campaign/courtyard-dining.webp',
    alt: 'The courtyard dining terrace beside the reflecting pool',
  },
]

export function InteriorExperience() {
  return (
    <section id="residence" className="interiors section-light">
      <div className="interiors__intro">
        <div className="interiors__kicker">
          <p className="eyebrow">Interior experience</p>
          <span>01—03 / Private rooms</span>
        </div>
        <h2>Life, composed<br /><em>from within.</em></h2>
        <p className="interiors__lede">A sequence of rooms shaped around ritual, repose and the changing Mediterranean light.</p>
      </div>

      <div className="interiors__folios">
        {spaces.map((space, index) => (
          <article key={space.name} className={`interior-folio interior-folio--${index + 1}`}>
            <div className="interior-folio__image">
              <img src={space.image} srcSet={`${space.image.replace(".webp", "-mobile.webp")} 800w, ${space.image} 1600w`} sizes="(max-width: 760px) 100vw, 65vw" alt={space.alt} loading="lazy" decoding="async" />
              <span className="interior-folio__frame" aria-hidden="true" />
              <span className="interior-folio__position">OMNIS / {space.number}</span>
            </div>
            <div className="interior-folio__copy">
              <div className="interior-folio__index" aria-hidden="true">{space.number}</div>
              <p className="eyebrow">Room {space.number} of 03</p>
              <h3>{space.name}</h3>
              <p>{space.description}</p>
              <div className="interior-folio__detail"><span>{space.detail}</span><i /></div>
            </div>
          </article>
        ))}
      </div>

      <div className="interiors__closing"><span>From private room</span><i /><span>to open landscape</span></div>
    </section>
  )
}
