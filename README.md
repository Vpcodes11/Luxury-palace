# OMNIS — Private Mediterranean Residence

![OMNIS illuminated at blue hour](public/campaign/blue-hour-enquiry.jpg)

OMNIS is a cinematic, editorial website concept for an ultra-luxury Mediterranean residence. The experience combines scroll-controlled architectural films, restrained typography, immersive photography, and responsive storytelling across desktop and mobile.

## Experience

- Scroll-driven canvas hero built from image sequences rather than autoplay video
- Finalized homepage Film 02, without film selectors
- A scroll-controlled daylight-to-blue-hour transition with glowing villa interiors
- Interactive reconstruction of Film 02's palace, with stone arcades, furnished interiors, a reflecting pool and daylight/blue-hour controls
- Accessible photographic galleries for all three signature spaces
- Responsive desktop and mobile compositions
- A panoramic Residence chapter using the supplied aerial imagery, cinematic shading and the homepage's uppercase/italic typography
- A dark Architecture composition using the supplied palace arcade and reflecting-water imagery, with responsive crops and a direct link to the 3D tour
- Animated architectural, interior, signature-space, location, and enquiry chapters
- Accessible navigation, reduced-motion support, semantic content, and keyboard-friendly controls
- An 80-frame Film 02 sequence with preloaded poster, bounded decoding and native sticky scrolling

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
- Three.js for the lazily loaded palace tour
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

The build command compresses used assets into responsive WebP images, regenerates the Film 02 manifest, prepares domain metadata, runs the TypeScript compiler, and creates production output in `dist`. Unselected sequences and original image directories are excluded from the release; workspace sources are preserved. The hero uses native sticky positioning, a viewport-specific preloaded poster, all 80 source frames and two low-priority requests at a time. Compressed frames stay available for reversal; only a moving neighborhood of decoded images is retained, with at most two decode jobs in flight. The typical cache holds 13 frames, plus a last-painted frame during large jumps. Worker rendering uses ImageBitmaps; the fallback uses decoded HTML images to avoid additional bitmap copies on Safari. Canvas size is cached on resize, resolution is bounded by the source detail, and device pixel ratio is capped at 1.5. Data-saver, 2G and reduced-motion visitors receive a static poster with ordinary scrolling.

Film 02 begins in daylight, gradually cools into evening and finishes at blue hour with warm interiors. Scrolling back reverses the transition. Nine saved AI lighting references provide the evening illumination, transferred onto the original 1920×1080 source at WebP quality 82. Exposure interpolates in log space with quintic easing between 8% and 86% of the camera sequence, holding the opening daylight and final dusk. Original geometry and texture are preserved; coherent motion alignment and tracked foreground occlusion keep room lighting off passing columns. The relighting happens at build time and adds no live lighting or filter work while scrolling. Visitors load one 80-frame sequence, rather than separate day and night sequences. Reduced-motion and data-saver visitors receive the daylight arrival poster. See assets/hero-dusk-lighting/README.md for the saved references and generation prompt. Portrait phones receive a centered 608×1080 crop, and narrow landscape viewports receive 1280×720 frames. Profile selection updates on rotation and resize; these are responsive versions of the same film. The complete desktop, portrait and narrow landscape sequences weigh approximately 8.00, 2.72 and 4.91 MB respectively; only the active profile is loaded. The additional frames double the temporal detail while preserving source resolution and quality; the complete download is larger. Nearby frames load first, then coarse coverage of the film, then the remaining intermediate positions. Warmup begins 200 ms after the opening frame arrives. The camera follows scroll input with a 0.45-second scrub, softening abrupt wheel input while retaining native page scrolling. A worker owns the transferred OffscreenCanvas and both decodes and paints compressed frames there, coalescing requests into its animation-frame callback and avoiding large per-frame surface copies on the page. The preloaded HTML poster remains visible until the first canvas frame is painted. Browsers without worker canvas support use HTML images and the regular canvas. The canvas uses inexpensive bilinear scaling; shading fades as the title disappears to reveal the architecture. `scripts/hero-settings.mjs` controls the source, encoding and release namespace. Change the release namespace when modifying existing frames to avoid serving previously cached imagery. This release adds intermediate source frames without changing the existing image content. A genuine 4K upgrade requires a higher-resolution master; the existing source is Full HD.

The approved all-evening version is preserved at commit `194228d`. Revert the day-night experiment commit and rebuild to restore that complete treatment, including its poster, preload URLs and checks; no source imagery was removed.

## Interactive palace

The tour reconstructs the visible palace architecture from Film 02: six deep arched bays, turned stone columns, layered cornices, round medallions, a tiled hip roof, bronze-framed open doors and a furnished salon. A real planar reflection mirrors the façade in the pool; olive trees, cypress, terrace steps and the sea complete the setting. The preview photograph is the original final Film 02 frame, copied to `public/campaign/tour-palace.jpg` and optimized during the build.

Estate, Courtyard, Grand salon and Sea terrace viewpoints use eased camera flights. Visitors can drag, rotate with buttons or arrow keys, and smoothly switch between daylight and blue hour. Reduced motion changes views immediately. The geometry follows the image's architectural language; dimensions and unseen rooms are illustrative rather than surveyed plans.

The Three.js module downloads on interaction intent (hover, focus or activation of Explore in 3D); geometry and WebGL initialize only after activation. Static architecture is combined by material, leaves are instanced, shadow maps are cached, reflection resolution is bounded and mobile rendering uses a 1× pixel ratio. The scene renders only on changes and stops drawing offscreen. Loading status remains visible until the first paint; a palace photograph preserves the section if WebGL or the optional module fails.

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
