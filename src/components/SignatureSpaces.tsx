const panels = [
  { title: 'The Courtyard', meta: 'Dining / Landscape', image: '/campaign/courtyard-signature.jpg' },
  { title: 'The Craft', meta: 'Stone / Bronze / Oak', image: '/campaign/craft-signature.jpg' },
  { title: 'The Water Court', meta: 'Reflection / Landscape', image: '/variations/variation_034.jpg' },
]

export function SignatureSpaces() {
  return (
    <section id="spaces" className="signature section-sand">
      <header className="signature__header">
        <p className="eyebrow">Signature spaces</p>
        <h2>Three studies<br />in <em>stillness.</em></h2>
        <p>Rooms are conceived as quiet frames—holding light, material and landscape in careful proportion.</p>
      </header>
      <div className="signature__plates">
        {panels.map((panel, index) => (
          <article key={panel.title} className={`plate plate--${index + 1}`} tabIndex={0}>
            <img src={panel.image} alt={`${panel.title} at OMNIS`} loading="lazy" />
            <div className="plate__meta"><span>0{index + 1}</span><h3>{panel.title}</h3><p>{panel.meta}</p></div>
          </article>
        ))}
      </div>
    </section>
  )
}
