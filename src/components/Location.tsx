export function Location() {
  return (
    <section id="location" className="location section-dark">
      <img className="location__backdrop" src="/palace-details/detail_072.jpg" alt="OMNIS opening toward the Mediterranean horizon" loading="lazy" />
      <div className="location__veil" />
      <div className="location__coordinates"><span>36° North</span><span>04° East</span></div>
      <div className="location__content">
        <p className="eyebrow eyebrow--light">Mediterranean location</p>
        <h2>The<br /><em>Mediterranean</em></h2>
        <p>Between stone and sea, OMNIS belongs to a landscape defined by light, horizon and stillness.</p>
      </div>
      <dl className="location__metadata">
        <div><dt>Coastline</dt><dd>Mediterranean</dd></div>
        <div><dt>Setting</dt><dd>Private coastal residence</dd></div>
        <div><dt>Light</dt><dd>South-west orientation</dd></div>
      </dl>
    </section>
  )
}
