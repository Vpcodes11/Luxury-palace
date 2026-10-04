import { Component, lazy, Suspense, useState, type ReactNode } from 'react'

const loadTour = () => import('./TourScene')
const TourScene = lazy(loadTour)

class TourBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <div className="tour-fallback"><img src="/optimized/campaign/tour-palace.webp" alt="The palace arcade and reflecting pool" /><p>The 3D view could not open. Explore the photographic galleries below.</p></div>
    return this.props.children
  }
}

export function ResidenceTour() {
  const [started, setStarted] = useState(false)
  return <section id="tour" className="residence-tour section-dark">
    <div className="tour-heading"><p className="eyebrow">Beyond the photograph</p><h2>Step<br /><em>inside.</em></h2><p>Move through the palace’s stone arcade, enter the grand salon and follow the light out to the sea. Discover the residence in daylight or at blue hour.</p><p className="tour-note">Reconstructed from the palace imagery. Dimensions and unseen spaces are illustrative.</p></div>
    <div className="tour-stage">
      {started ? <TourBoundary><Suspense fallback={<div className="tour-placeholder" role="status">Preparing your architectural tour…</div>}><TourScene /></Suspense></TourBoundary> : <div className="tour-preview"><img src="/optimized/campaign/tour-palace.webp" srcSet="/optimized/campaign/tour-palace-mobile.webp 800w, /optimized/campaign/tour-palace.webp 1600w" sizes="(max-width: 760px) 100vw, 80vw" alt="Stone arcade and reflecting pool of the palace, preview of the architectural tour" loading="lazy" /><div className="tour-preview-caption"><span>THE ARCADE / THE SALON / THE SEA</span><p>Every perspective,<br /><em>a different light.</em></p></div><button className="tour-start" onPointerEnter={() => { void loadTour().catch(() => {}) }} onFocus={() => { void loadTour().catch(() => {}) }} onClick={() => setStarted(true)}>Explore in 3D <span>↗</span></button></div>}
    </div>
  </section>
}
