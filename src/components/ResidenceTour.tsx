import { lazy, Suspense, useState } from 'react'

const TourScene = lazy(() => import('./TourScene'))

export function ResidenceTour() {
  const [started, setStarted] = useState(false)
  return <section id="tour" className="residence-tour section-dark">
    <div className="tour-heading"><p className="eyebrow">An architectural study</p><h2>A new<br /><em>perspective.</em></h2><p>Explore a three-dimensional interpretation of the residence. Rotate the estate, step into the courtyard, or look out from the salon.</p><p className="tour-note">Concept model · an interpretation of the visual collection, with illustrative proportions.</p></div>
    <div className="tour-stage">
      {started ? <Suspense fallback={<div className="tour-placeholder" role="status">Preparing your architectural tour…</div>}><TourScene /></Suspense> : <div className="tour-preview"><img src="/optimized/campaign/aerial-estate.webp" srcSet="/optimized/campaign/aerial-estate-mobile.webp 800w, /optimized/campaign/aerial-estate.webp 1600w" sizes="(max-width: 760px) 100vw, 80vw" alt="Coastal residence, preview of the architectural tour" loading="lazy" /><button className="tour-start" onClick={() => setStarted(true)}>Explore in 3D <span>↗</span></button></div>}
    </div>
  </section>
}
