# OMNIS — Private Mediterranean Residence

![OMNIS illuminated at blue hour](public/campaign/blue-hour-enquiry.jpg)

OMNIS is a cinematic, editorial website concept for an ultra-luxury Mediterranean residence. The experience combines scroll-controlled architectural films, restrained typography, immersive photography, and responsive storytelling across desktop and mobile.

## Experience

- Scroll-driven canvas hero built from image sequences rather than autoplay video
- Finalized homepage Film 02, without film selectors
- A scroll-controlled daylight-to-blue-hour transition with glowing villa interiors
- On-demand interactive conceptual 3D estate with courtyard, salon and terrace viewpoints
- Accessible photographic galleries for all three signature spaces
- Responsive desktop and mobile compositions
- Animated architectural, interior, signature-space, location, and enquiry chapters
- Accessible navigation, reduced-motion support, semantic content, and keyboard-friendly controls
- A 41-frame Film 02 sequence with preloaded poster, progressive decoding and native sticky scrolling

## Hero films

| Film | Sequence |
| --- | --- |
| 01 | Vertical crane — palace façade to reflecting water |
| 02 | Exterior architecture |
| 03 | Aerial coastal residence |
| 04 | Grand salon |
| 05 | Courtyard dining |
| 06 | Blue-hour exterior |
| 07 | Mediterranean bedroom |
| 08 | Primary suite |
| 09 | Architectural craftsmanship |
| 10 | Mediterranean entrance glide |

The asset library contains ten source films. The finalized homepage exclusively uses Film 02 and has no film selectors. Legacy variant links also render Film 02.

## Technology

- React
- TypeScript
- Vite
- GSAP and ScrollTrigger
- HTML Canvas for frame-sequence rendering
- Three.js for the lazily loaded architectural study
- Sharp for desktop/mobile WebP generation
- Playwright for Chromium, Firefox and mobile WebKit verification

## Local development

Requirements: a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

The development server is available at `http://localhost:5173` by default.

## Production build

```bash
npm run build
npm run preview
```

The build command compresses used assets into responsive WebP images, regenerates the Film 02 manifest, prepares domain metadata, runs the TypeScript compiler, and creates production output in `dist`. Unselected sequences and original image directories are excluded from the release; workspace sources are preserved. The hero uses native sticky positioning, a viewport-specific preloaded poster, 41 compressed frames and two low-priority requests at a time. Decoded ImageBitmaps are retained for reverse scrolling where supported, with HTML images as a fallback. Canvas size is cached on resize, resolution is bounded by the source detail, and device pixel ratio is capped at 1.5. Data-saver, 2G and reduced-motion visitors receive a static poster with ordinary scrolling.

Film 02 begins in daylight, gradually cools into evening and finishes at blue hour with warm interiors. Scrolling back reverses the transition. Nine saved AI lighting references provide the evening illumination, transferred onto the original 1920×1080 source at WebP quality 82. Exposure interpolates in log space with quintic easing between 8% and 86% of the camera sequence, holding the opening daylight and final dusk. Original geometry and texture are preserved; coherent motion alignment and tracked foreground occlusion keep room lighting off passing columns. The relighting happens at build time and adds no live lighting or filter work while scrolling. Visitors load one 41-frame sequence, rather than separate day and night sequences. Reduced-motion and data-saver visitors receive the daylight arrival poster. See assets/hero-dusk-lighting/README.md for the saved references and generation prompt. Portrait phones receive a centered 608×1080 crop, and narrow landscape viewports receive 1280×720 frames. Profile selection updates on rotation and resize; these are responsive versions of the same film. The complete desktop, portrait and narrow landscape sequences weigh approximately 4.10, 1.40 and 2.52 MB respectively; only the active profile is loaded. A worker owns the transferred OffscreenCanvas and both decodes and paints compressed frames there, avoiding large per-frame surface copies on the page. The preloaded HTML poster remains visible until the first canvas frame is painted. Browsers without worker canvas support use HTML images and the regular canvas. The canvas uses inexpensive bilinear scaling; shading fades as the title disappears to reveal the architecture. `scripts/hero-settings.mjs` controls the source, encoding and release namespace. Change the release namespace when modifying frames to avoid serving previously cached imagery. A genuine 4K upgrade requires a higher-resolution master; the existing source is Full HD.

The approved all-evening version is preserved at commit `194228d`. Revert the day-night experiment commit and rebuild to restore that complete treatment, including its poster, preload URLs and checks; no source imagery was removed.

## Verification and deployment

```bash
npx playwright install
npm run build
npm test
```

The browser suite covers the finalized Film 02 homepage and legacy variant links, every navigation destination, all gallery photographs, focus restoration, responsive widths, reduced motion, enquiry validation and demo confirmation, 3D controls, WebGL fallback, privacy and metadata. The public production site is [luxurypalace.vercel.app](https://luxurypalace.vercel.app/). Set `PLAYWRIGHT_BASE_URL` to that origin to test the live site instead of the local preview. See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting and metadata configuration. `SITE_URL` overrides the automatically detected Vercel production domain or Netlify `URL`.

For a reproducible Chromium performance profile, run a production preview and `node scripts/profile-performance.mjs http://localhost:4173 comparison`. Set `PROFILE_CPU_THROTTLE=4` for CPU throttling; the script uses a cold cache, 4 Mbps throughput and 80 ms latency. The default measurement begins after 10 seconds of preparation; set `PROFILE_WARMUP_MS=0` to measure scrolling immediately after the document loads. Reports live in ignored `performance-results`. Emulation measures loading and actual hero drawing but does not replace real-device or deployed-origin testing.

## Asset structure

The repository includes the complete visual library, so no separate asset import is required.

```text
New folder/                 Original source image sequences
public/campaign/            Curated campaign and section imagery
public/optimized/           Generated WebP variants (not committed)
public/hero-film-*/         Browser-ready hero sequences
public/hero-frames-vertical Default Film 01 sequence
public/palace-details/      Architectural detail stills
public/variations/          Additional residence perspectives
```

`scripts/generate-frame-manifest.mjs` scans the configured hero directories and generates `src/lib/frameManifest.generated.ts`. Run `npm run optimize` and then `npm run frames` whenever source images change. Development and production builds do this automatically.

## Project structure

```text
src/components/             Page sections and navigation
src/hooks/                  Shared React hooks
src/lib/                    Generated frame metadata
src/styles/global.css       Visual system and responsive layout
scripts/                    Build-time utilities
public/                     Production-ready visual assets
```

## Notes

- The visual assets are intentionally committed to the repository for a self-contained checkout.
- `node_modules`, `dist`, TypeScript build caches, and local logs are excluded from version control.
- OMNIS is presented as a conceptual luxury-residence experience.
- The 3D model is an illustrative interpretation, not a measured replica. Exact property specifications and location remain unconfirmed.
- The displayed contact number is explicitly dummy. The enquiry form remains a local demonstration and does not send or store submissions.
