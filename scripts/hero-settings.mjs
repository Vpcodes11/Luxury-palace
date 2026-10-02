// The finalized homepage film stays fixed; profiles only adapt image delivery.
export const HERO_SOURCE = 'hero-film-02-architecture'
// A new directory prevents browsers/CDNs from reusing the older compressed frames.
export const HERO_RELEASE = 'hero-film-02-architecture-dusk-v1'
export const HERO_PROFILES = [
  { suffix: '', width: 1920, quality: 82 },
  { suffix: '-mobile', width: 608, height: 1080, quality: 82 },
  { suffix: '-landscape', width: 1280, quality: 82 },
]
