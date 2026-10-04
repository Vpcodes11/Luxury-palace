export function Introduction() {
  return (
    <section id="introduction" className="introduction residence-panorama" aria-labelledby="residence-heading">
      <img className="residence-panorama__image" src="/optimized/campaign/aerial-estate.webp" srcSet="/optimized/campaign/aerial-estate-mobile.webp 800w, /optimized/campaign/aerial-estate.webp 1600w" sizes="(max-width: 760px) 1600px, 100vw" width="1920" height="1080" alt="The stone coastal residence, gardens and reflecting pools above the Mediterranean" loading="lazy" decoding="async" />
      <div className="residence-panorama__veil" aria-hidden="true" />
      <div className="residence-panorama__top"><span>01 / The residence</span><span>A private Mediterranean world</span></div>
      <header className="residence-panorama__title">
        <p className="eyebrow">Between stone and sea</p>
        <h2 id="residence-heading">Above it all.<br /><em>A world apart.</em></h2>
      </header>
      <div className="residence-panorama__bottom">
        <p className="residence-panorama__signature">A quieter<br /><em>kind of grandeur.</em></p>
        <div className="residence-panorama__copy">
          <p>Open horizons. Sheltered courtyards. A residence that brings the Mediterranean into every moment of the day.</p>
          <a className="palace-chapter-link" href="#architecture">Discover the architecture <span aria-hidden="true">↘</span></a>
        </div>
      </div>
      <div className="residence-panorama__foot"><span>Stone · Water · Horizon</span><span>OMNIS / Residence 01</span></div>
    </section>
  )
}
