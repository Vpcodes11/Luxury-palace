// The finalized homepage film stays fixed; profiles only adapt image delivery.
export const HERO_SOURCE = 'hero-film-02-architecture'
// A new directory prevents browsers/CDNs from reusing the older compressed frames.
export const HERO_RELEASE = 'hero-film-02-architecture-day-night-v1'
// Set this to 'dusk' and restore the dusk-v1 namespace/preloads to recover the
// approved all-evening treatment. The source film and lighting references stay.
export const HERO_LIGHTING = 'day-night'

export function nightAmount(frame) {
  if (HERO_LIGHTING === 'dusk') return 1
  // Hold daylight at arrival, ease into evening, then linger at full blue hour.
  // Quintic easing has zero first/second derivatives at both boundaries.
  const progress = Math.max(0, Math.min(1, (frame / 79 - .08) / .78))
  return progress ** 3 * (progress * (progress * 6 - 15) + 10)
}
export const HERO_PROFILES = [
  { suffix: '', width: 1920, quality: 82 },
  { suffix: '-mobile', width: 608, height: 1080, quality: 82 },
  { suffix: '-landscape', width: 1280, quality: 82 },
]
