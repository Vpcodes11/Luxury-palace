# Website test report — 2 October 2026

The sections below record successive releases. The latest release and its validation are recorded at the end; earlier counts and measurements apply to their stated versions.

The production build passed. The local audit passed **57 browser checks**, and the subsequent public production audit passed **all 60 checks** at `https://luxurypalace.vercel.app/`, covering 20 scenarios in desktop Chromium, desktop Firefox, and iPhone 13 WebKit emulation. Both final runs used no automatic retries. The live run tested the production release from commit `5ad2acca56e3a8cc7c131dd3390060fed3b460ca`.

## Confirmed behavior

- Film 02 is the only homepage animation. No desktop film links or mobile film selector exists. All ten legacy `?variant=` values still show Film 02.
- Header and footer navigation reach every destination and return to the top. Mobile navigation closes, releases the scroll lock, traps keyboard focus, and restores focus.
- All three galleries load all nine photographs. Next/previous buttons wrap correctly, keyboard controls work, and closing restores focus and page scrolling.
- The 3D tour loads its separate code only on demand. Viewpoint buttons change the rendered model, rotation works, desktop wheel scrolling remains available, and mobile navigation can leave the active tour. Devices without WebGL receive the photographic fallback.
- Enquiry validation rejects missing/invalid fields and phone values without enough digits. Optional phone omission and formatted numbers work. A valid entry presents a clearly labeled local demonstration, performs no submission, and can be reset.
- Page imagery loads without missing resources or runtime exceptions in the tested journeys. Layout checks pass at 320, 390, 768 and 1440 pixels.
- Reduced motion and data saver use the static poster. Forward/reverse animation scrolling works, with bounded frame downloads.
- Privacy links, the return link, favicon, social image and dummy contact are present.
- The public production origin is canonical, the social image has an absolute production URL, and robots.txt links to the published sitemap. These checks pass in all three browser projects.
- Manual browser review covered the desktop homepage, rendered 3D estate, mobile menu, mobile enquiry section and mobile homepage.
- `npm audit --omit=dev` reported zero known vulnerabilities. This is a dependency check, not a penetration test.

## Issues corrected during the audit

1. Mobile Safari intermittently missed focus while the menu panel opened. Focus now avoids scrolling and is restored after the opening transition when necessary. Repeated-opening checks pass.
2. The enquiry form accepted phone values consisting only of punctuation or whitespace. It now requires 7–15 digits when a phone is supplied.
3. The local enquiry demonstration misleadingly claimed a representative would respond. Both the form and confirmation now state that enquiries are not sent or stored. Validation focuses the first invalid field; confirmation and reset also restore useful focus.
4. The public production domain lacked canonical URLs and a sitemap. The build now detects Vercel's permanent production domain and generates the canonical/social URLs, sitemap and robots.txt correctly. Hosted metadata checks pass.

The test suite also corrected screenshot scaling for the long mobile page and replaced an unsupported mobile-WebKit mouse-wheel simulation with a mobile navigation check. Desktop wheel behavior remains tested. A slow-load WebKit check failed once in an earlier concurrent run; its isolated repeats and the final complete run passed. This timing behavior should remain covered in future runs.

## Scrolling measurements

Chromium emulation, cold cache, approximately 4 Mbps throughput, 80 ms latency and 4× CPU slowdown. Each scroll sample lasted 10 seconds across 10,000 pixels. The prepared measurement started after 10 seconds of loading; the immediate measurement started at document readiness.

| Scenario | 95th-percentile frame interval | Longest interval | Long tasks during scroll | Distinct hero frames drawn |
| --- | --- | --- | --- | --- |
| Desktop, prepared | 16.7 ms | 33.3 ms | 0 | 40 |
| Mobile, prepared | 16.8 ms | 33.4 ms | 0 | 40 |
| Desktop, immediate | 16.8 ms | 83.4 ms | 13 | 21 |
| Mobile, immediate | 16.8 ms | 50.1 ms | 0 | 28 |

The first animated frame appeared approximately 1.0–1.2 seconds after navigation. Both profiles recorded no runtime errors. Prepared scrolling is smooth in this environment; immediate scrolling can hitch or skip film frames while images load and decode, especially on the simulated slower desktop. These are browser scheduling measurements, not proof of frame rate on physical devices.

Raw measurements: `performance-results/qa-warm-performance.json` and `performance-results/qa-immediate-performance.json`. Browser screenshots and failure traces are written to `test-results/`; the latest successful HTML report is in `playwright-report/`. These generated artifacts remain local.

## Deployment verification and limits

The confirmed public production address is **https://luxurypalace.vercel.app/**. It opens without Vercel login and serves the latest tested application. Unique deployment links encountered earlier required login; that blocker is resolved by using the permanent public domain.

The first hosted run completed 56 checks before two overlapping test processes conflicted while writing trace artifacts. This was a test-runner filesystem conflict. The final sequential full run completed **60/60 checks successfully in 2.7 minutes**, including all domain-metadata checks. Future browser runs should not share an output directory concurrently.

The Vercel metadata fix uses `VERCEL_PROJECT_PRODUCTION_URL` when `SITE_URL` or Netlify's `URL` is absent. Hosted HTML, the canonical and social URLs, sitemap and robots.txt were independently inspected after deployment. The application JavaScript bundle remained `index-eO_WVyUq.js`; the domain fix changed generated metadata. Optimized image responses return HTTP 200 with `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` and a Vercel cache hit.

Use the permanent domain for future review. A unique older deployment URL continues to serve its original build, regardless of later GitHub pushes.

Public enquiry delivery remains intentionally unconnected, and the contact number remains clearly dummy. The site is suitable as a public concept/demo; real enquiries require a contact destination and backend. Physical-device touch gestures and actual iOS Safari remain outside these emulation results.

## Live-origin performance follow-up

The same 4 Mbps / 80 ms latency / 4× CPU slowdown profile was repeated on the public domain. After 10 seconds of preparation, desktop and mobile both recorded a 16.7 ms 95th-percentile frame interval, zero long tasks during the 10-second scroll, and 40 distinct hero frames drawn. Maximum intervals were 33.4 ms on desktop and 16.8 ms on mobile. The first animated frame appeared at approximately 1.6 seconds on desktop and 1.9 seconds on mobile. Both runs recorded no runtime errors.

Starting the hosted scroll immediately at document readiness recorded a 16.8 ms 95th-percentile interval on both devices, but the longest desktop interval reached 100 ms with 14 long tasks and 21 distinct film frames drawn. Mobile reached 50 ms, with zero long tasks and 27 distinct frames. Both immediate runs recorded no runtime errors. Brief initial loading/decoding hitches remain under this stress profile; prepared results do not imply hitch-free scrolling immediately on arrival.

Raw hosted measurements are in `performance-results/qa-live-warm-performance.json` and `performance-results/qa-live-immediate-performance.json`.

## Reproduce

```sh
npm ci
npm run build
npx playwright install
npm test -- --reporter=list,html
```

For public production tests, set `PLAYWRIGHT_BASE_URL=https://luxurypalace.vercel.app`, then run `npm test -- --reporter=list,html --output=test-results/live-final`. The preview server is skipped. Unset that variable to return to local testing.

For the performance comparison, start the production preview on port 4175, set `PROFILE_CPU_THROTTLE=4`, and run `node scripts/profile-performance.mjs http://127.0.0.1:4175 comparison`. Set `PROFILE_WARMUP_MS=0` for immediate scrolling; omit it for the default 10-second preparation period.

## Film 02 quality upgrade — 2026-10-02

The earlier hero profiles reduced a 1920×1080 original to 1280×720 at WebP quality 68 on desktop and 768×432 at quality 64 on phones. The quality release retains the full desktop source at quality 82, uses a centered 608×1080 portrait crop for phones, and supplies 1280×720 for narrow landscape viewports. These are responsive encodings of the same finalized Film 02; no film selectors or alternate sequences were added. Profile selection follows orientation and viewport changes. The new `hero-film-02-architecture-hq` URL namespace avoids reuse of previously cached low-resolution frames.

All profiles retain 41 frames. Complete compressed sequences weigh 4.710 MB desktop, 1.632 MB portrait, and 2.907 MB narrow landscape. The first posters weigh 88.6, 29.1 and 56.1 KB respectively. Only the active profile loads on arrival. The canvas buffer is bounded by source dimensions and a maximum 1.5 device pixel ratio. Shading is lighter and fades further after the title disappears.

The initial full-resolution implementation regressed desktop scrolling. Moving only decoding into a worker did not consistently remove large per-frame image-surface copies during browser graphics commits: the hosted desktop stress test still reached a 50 ms 95th-percentile interval and 31 long tasks. The final implementation keeps both decoding and painting in a worker that owns the transferred OffscreenCanvas, with two requests/decode jobs in flight. A tested HTML-image fallback remains for browsers without worker canvas support. Bilinear canvas scaling avoids expensive filters on every draw. Previously decoded frames remain available for reverse scrolling.

Final local production-preview measurements used Chromium, cold cache, approximately 4 Mbps, 80 ms latency and 4× CPU slowdown. Each scroll lasted 10 seconds over 10,000 pixels; prepared measurements began after 10 seconds of loading.

| Scenario | 95th-percentile interval | Longest interval | Scroll long tasks | Distinct film frames drawn |
| --- | --- | --- | --- | --- |
| Desktop, prepared | 16.7 ms | 33.4 ms | 0 | 40 |
| Phone, prepared | 16.7 ms | 16.8 ms | 0 | 40 |
| Desktop, immediate | 16.8 ms | 33.3 ms | 0 | 11 |
| Phone, immediate | 16.7 ms | 16.8 ms | 0 | 23 |

First animated draws appeared approximately 1.9 seconds after navigation on desktop and 1.3 seconds on phones in these final prepared runs. Both profiles recorded no runtime errors. The desktop sequence is larger than the previous release; immediate scrolling can skip animation frames while images download. Retaining full-resolution decoded frames also increases memory use; emulation does not establish performance on every physical device. Genuine 4K detail requires a higher-resolution master rather than enlarging the existing Full HD images.

Raw final measurements are `performance-results/quality-offscreen-warm-performance.json` and `performance-results/quality-offscreen-immediate-performance.json`. The profiler tracks worker-reported painted frames through the canvas's data-frame attribute; fallback rendering is still tracked through drawImage. The poster and worker can read the same initial URL through separate resource entries, so reverse-scroll tests verify all 41 unique frames are available and that the request count does not increase when reversing. New browser checks cover actual poster dimensions, sharper canvas buffers, the brighter architectural reveal, portrait/landscape/desktop transitions, continued Film 02-only behavior and worker failure.

The local browser run completed 68 of 69 checks successfully and exposed missing OffscreenCanvas support inside this emulated WebKit worker. A startup capability handshake now selects HTML-image loading before requesting extra compressed blobs. All nine affected profile-switching, worker-failure and reverse-scroll checks then passed across Chromium, Firefox and mobile WebKit. The earlier detail test also corrected its viewport assumption: a 720-pixel-tall canvas should not be expected to exceed the viewport at 1× pixel ratio.

The first full hosted quality suite passed **69/69 checks in 3.9 minutes**, without retries, on https://luxurypalace.vercel.app/ for `f36a5ede052b2165c7eb58e58b85093594a6da4e` and `index-DlhBQ0Ti.js`. It included quality and compatibility checks, navigation, galleries, the 3D tour and fallback, local demo enquiries, privacy, metadata and missing resources. The subsequent performance audit prompted the worker-owned canvas correction described above. The source remains Film 02 alone.

After moving the complete canvas rendering into the worker, **30/30 affected browser checks passed locally** across Chromium, Firefox and mobile WebKit in 1.2 minutes, including navigation back into the hero. A development-mode Chromium check also verified React StrictMode's repeated effect setup, forward scrolling and a desktop-to-phone resize without runtime errors.

The corrected rendering release `1359f9e6fc080bdb13357d037046d5ac2e5422bd` deployed successfully with `index-CkwSwQRz.js`. Its final full hosted suite passed **69/69 checks in 2.2 minutes**, without retries. Manual live scrolling confirmed that the actual architectural image advances and that the shading fades after the title disappears. A small, localized navigation gradient and text shadow keep white links readable against the newly brighter sky, without darkening the main architecture.

The navigation refinement deployed as `f93e8637a8702d5a1112e7771803eab1c0f99e6f`, serving `index-D_TkIebq.js` and `index-Do8K7nPx.css`. Final deployed Chromium measurements repeated the 4 Mbps / 80 ms / cold browser cache / 4× CPU profile. Desktop and phone both recorded a **16.7 ms 95th-percentile scroll interval, a 16.8 ms maximum, zero scroll long tasks and 40 distinct painted film frames** in the confirmation run. The initial desktop attempt also maintained responsive scrolling but drew 37 frames and had a 6.1-second first animated draw; the repeat drew the first animated frame at 2.0 seconds, with a 51 ms document time to first byte. Phone first draws were 1.3–1.4 seconds. Both attempts recorded no runtime errors. These variable arrival results do not establish a universal load-time guarantee or eliminate skipped animation frames when scrolling before downloads finish.

Raw final hosted reports are `performance-results/quality-release-live-warm-performance.json` and `performance-results/quality-release-live-confirm-performance.json`. The profiler now records document response and startup timings to distinguish future delivery delays from browser initialization. The worker owns the displayed canvas in these measurements; painting is verified through its frame reports and browser screenshots.

After the navigation-only styling refinement, all three hosted forward/reverse-scroll checks passed again in 8.3 seconds and refreshed desktop and phone screenshots. The temporary local preview and development servers used for this audit were stopped.

## Film 02 dusk atmosphere — 2026-10-02

The homepage now uses a blue-hour treatment with cool exterior stone, warm amber rooms, soft light spill and subdued pool reflections. Nine saved AI-generated lighting references establish the appearance at original frames 0, 10, 20, 30, 40, 50, 60, 70 and 79. The asset build transfers only low-frequency illumination onto the original full-resolution frames, using coherent camera-motion alignment and explicit close-column occlusion. The original geometry, fine texture and 41-frame camera sequence remain intact. Reference assets and their prompt are recorded in `assets/hero-dusk-lighting/README.md`.

Initial dense motion matching produced mottled illumination on plain stone. The final build uses coherent translation derived from textured doorway edges and tracked foreground occlusion, avoiding those distortions. Manual inspection covered the opening, intermediate and final frames and browser scrolling. The initial poster, reduced-motion/data-saver poster and all portrait/landscape profiles receive the same baked treatment. Ivory hero lettering and reduced overlay shading keep the dark exterior readable and retain the interior glow.

Runtime lighting work is unchanged: the browser receives completed WebP images, with no live color filters, blur, light masks or additional scene layers. The new `hero-film-02-architecture-dusk-v1` URLs prevent reuse of the daylight sequence. Complete desktop, portrait and landscape sequences weigh **3.700 MB, 1.329 MB and 2.260 MB**, compared with 4.710 MB, 1.632 MB and 2.907 MB for the preceding daylight release. All desktop frames remain 1920×1080; portrait remains 608×1080; landscape remains 1280×720. Release pruning includes only Film 02 and the existing Film 09 still photograph, with no selectors or alternate hero sequences.

New checks verify actual delivered image colors (blue sky, neutral/cool exterior stone, brighter amber interior) and that the poster/canvas use no live filter. The first test incorrectly required the exterior stone's blue channel to exceed its red channel; the treatment intentionally keeps that stone nearly neutral. The corrected check distinguishes it from the warm daylight source and explicitly checks the blue sky. A concurrent diagnostic test run also cleared a running suite's trace directory, causing one teardown failure; subsequent suite runs are sequential.

The final sequential suite passed **72/72 checks in 4.0 minutes** against the production build across Chromium, Firefox and mobile WebKit, including metadata, all legacy film links, navigation, galleries, enquiry demo, 3D controls/fallback, profile changes and reverse scrolling. The cold-cache 4 Mbps / 80 ms / 4× CPU profile after 10 seconds preparation recorded **16.8 ms desktop and 16.7 ms phone p95 scroll intervals, zero scroll long tasks and 40 distinct painted frames** on each viewport. Maximum intervals were 33.4 ms desktop and 50.1 ms phone. First animated draws were 3.447 and 2.691 seconds, with initial LCP at 2.948 and 2.444 seconds; initialization still varies with device and delivery. No runtime errors occurred. Raw results are in the ignored `performance-results/dusk-local-warm-performance.json`. Emulation is not a guarantee for every physical device.

## Film 02 day-to-night experiment — 2026-10-02

The arrival begins in the original daylight. Exposure eases into the approved cool exterior and warm interior illumination from 8% to 86% of the camera sequence, then holds at full blue hour. Log-space exposure interpolation and quintic easing avoid sudden starts or stops in the lighting curve. Lighting is baked into the same 41 frames, with original geometry, tracked foreground-column occlusion and all three responsive profiles retained. There is no second film download, extra runtime layer or live image filter. Scrolling backward restores daylight; reduced-motion and data-saver visitors receive the daylight arrival poster.

The new `hero-film-02-architecture-day-night-v1` namespace prevents reuse of cached all-evening images. Full desktop, portrait and landscape sequences weigh **4.103 MB, 1.398 MB and 2.515 MB** respectively. Manual browser inspection covered daylight arrival, intermediate evening, full night and reversal to daylight. New browser checks verify the delivered daylight/night colors and exact forward/reverse frame progression. Film 02 remains the only homepage animation, including all ten legacy query values.

The initial two-worker run encountered Firefox and mobile navigation timing failures and a Firefox frame-preparation timeout. The computer had approximately 0.9 GB free physical memory while multiple test browsers and the manual preview were open. That run was stopped, the manual preview closed, and a one-worker run started without changing application code or weakening checks; work was interrupted before that run's final result.

Release validation on **4 October 2026** rebuilt the production output successfully and completed the one-worker suite with **74 passing checks in 6.9 minutes**. The mobile full-page image audit exhausted its 45-second total budget while walking into the final enquiry section; the trace shows progress through the earlier image/layout checks. Only that long mobile audit now has a 90-second total budget, with its original assertions unchanged. Its targeted repeat passed in **27.8 seconds**, completing successful coverage of all **75 browser scenarios** across Chromium, Firefox and mobile WebKit. This is a complete run plus a corrected targeted repeat, rather than an uninterrupted 75/75 result. Emulation does not establish physical-device Safari performance.

The 4 Mbps / 80 ms latency / 4× CPU Chromium profile, after 10 seconds of preparation, painted 40 distinct frames on both viewports with no runtime errors. Desktop recorded a **33.3 ms p95 interval**, a 100 ms maximum and two scroll long tasks totaling 123 ms; phone recorded **16.8 ms p95**, a 33.4 ms maximum and zero scroll long tasks. First animated draws appeared at 3.034 seconds desktop and 1.831 seconds phone. This stressed desktop result is slower than the earlier dusk measurement; it does not support claiming universal hitch-free scrolling. The day-night desktop payload is also larger than dusk-only. Runtime rendering code is unchanged, and these browser measurements can vary with host load and image preparation. Raw results remain in `performance-results/day-night-release-local-performance.json`.

The approved all-evening version remains at commit **`194228d`**. Reverting this experiment's commit and rebuilding restores its original appearance, poster, preloads and checks. The original daylight sources and saved dusk lighting references remain intact.

## Palace 3D reconstruction — 2026-10-04

The former primitive estate model has been replaced with a procedural reconstruction of the visible Film 02 palace. It includes six deep stone arcades, turned columns, medallions, layered cornices, a tiled hip roof, open bronze-framed doors, furnished rooms, terrace steps, branching olive trees and a reflecting pool. The new preview is the unmodified final Film 02 photograph. Unseen spaces and dimensions remain explicitly illustrative; this is not a surveyed or photorealistic replica.

Four eased camera viewpoints reveal the Estate, Courtyard, Grand salon and Sea terrace. Daylight and Blue hour controls animate sky, exterior illumination and warm interior light. Reduced-motion visitors switch immediately. Keyboard arrows, rotation buttons, visible focus and ordinary vertical scrolling remain available. Camera limits preserve an eye-level viewpoint and keep the camera above the paving.

Static architecture is merged by material and foliage uses instancing. Mobile resolution is capped at 1×, pool reflections use a 384-pixel render target (768 on desktop), and shadows are cached. The tour downloads on button intent and initializes only after activation. Tests verify fewer than 100,000 scene triangles, actual different pixels for viewpoints and lighting, no additional renders while idle or offscreen, and no Three.js/WebGL/shader errors. Loading status remains until the first rendered frame. Failed module downloads and WebGL creation preserve a palace photograph and usable galleries/navigation.

The production build passes TypeScript and Vite. The complete one-worker run across Chromium, Firefox and emulated mobile WebKit passed **83 of 84 checks in 7.0 minutes**. Its only failure was a test selector requesting the exact mobile menu name "Architecture" when the actual accessible label is "02 Architecture". The corrected selector retains the navigation and offscreen-render assertions. After the eye-level camera correction, **18/18 affected 3D, lighting, reduced-motion and fallback checks passed in 2.3 minutes**. This is a complete run plus corrected affected checks, not an uninterrupted 84/84 run. The finalized Film 02 hero, day-night animation, enquiry demo and dummy contact behavior remain unchanged.

Manual screenshot review covered all four viewpoints, daylight, pool reflections and the furnished salon. Generated captures remain in the ignored `test-results/` directory. Browser emulation and the triangle/render budgets do not establish a guaranteed frame rate or behavior on every physical phone.

A final salon camera refinement removes the foreground lamp from the main sightline. The production build was regenerated, and all **6/6 affected viewpoint/navigation and reduced-motion checks passed in 1.1 minutes** across the same three browsers. Its bundles are `index-CYgRgWT0.js`, `TourScene-D0y1vABk.js` and `index-BwIKaZRE.css`; the homepage worker and film namespace are unchanged.

## Hero motion refinement — 2026-10-04

The hero now uses all 80 original Film 02 camera positions instead of sampling 41. This adds genuine intermediate source frames, preserving the 1920×1080 quality-82 desktop treatment, responsive crops and approved baked daylight-to-blue-hour appearance. The full desktop, portrait and landscape downloads are approximately **8.00, 2.72 and 4.91 MB**. Only the active profile loads. The increase in temporal detail doubles the total sequence payload; slower connections can still skip camera positions before preparation finishes.

Both render paths now retain compressed frames and decode a moving neighborhood around the current camera position. The normal window is 13 images; the last-painted frame can remain during a jump. At most two decode jobs and two low-priority network requests run independently. Older decoded surfaces are released and decoded again from retained compressed bytes when reversing, without another network download. The theoretical RGBA storage for 14 Full HD images is approximately 116 MB, versus 340 MB for the previous 41-image cache; these estimates exclude browser overhead and the drawing surface. Rendering pauses offscreen. The worker coalesces requested positions into its animation-frame callback instead of drawing on every message. Safari's fallback uses decoded HTML images without an additional bitmap copy. Warmup starts after 200 ms, and the camera scrub is 0.45 seconds, softening abrupt scroll input while preserving native scrolling and immediate static-poster behavior for reduced motion/data saver.

New tests observe actual painted camera indices during 6.5-second forward and reverse journeys, require more than 60 distinct positions, verify the exact day/night endpoints, cap the observed decoded cache at 16, and assert no additional film requests on reversal. Both the worker-selected and forced fallback paths are covered. Initial mobile runs with continuous Playwright trace screenshots recorded only 35–45 browser animation ticks over the entire 13-second journey. Disabling screen recording while preserving trace events/DOM snapshots removed this measurement interference: the same mobile renderer painted 77–78 distinct positions and retained at most 13 decoded images. The assertions were retained. Direct blob decoding and an additional fallback bitmap copy were also evaluated; the final fallback uses the browser image loader and retains its decoded HTML image.

Sequential Chromium profiling used cold cache, 4 Mbps/80 ms network conditions, 4× CPU slowdown, and a 10-second page scroll after 10 seconds of preparation. The preceding build recorded desktop **33.4 ms p95**, a 66.6 ms maximum and one 51 ms scroll long task. The new implementation recorded desktop **16.7 ms p95**, a 33.3 ms maximum and zero scroll long tasks. Mobile changed from **16.8 ms p95 / 33.4 ms maximum** to **16.7 ms / 16.8 ms**, with zero scroll long tasks in both runs. Both final profiles reported no runtime errors. Desktop painted 40 distinct positions while the larger sequence was still downloading; mobile painted 79. With 20 seconds of preparation, desktop painted **79 distinct positions**, with **16.7 ms p95, 16.8 ms maximum and zero scroll long tasks**. This does not establish performance on every device or hitch-free movement before frames arrive. Raw reports are `performance-results/scroll-before-performance.json`, `scroll-after-performance.json` and `scroll-after-prepared-performance.json`. The prepared report's distinct-position count is valid; its draw-call count included duplicate attribute notifications, corrected in the profiler afterward.

The complete production-preview suite passed **89 of 90 checks in 7.2 minutes** across Chromium, Firefox and mobile WebKit, including the new 3D tour. Motion tests painted all **80 distinct positions on desktop and 78 on mobile**, with a maximum cache of **13**, exact night/day endpoints and no further film downloads. The sole failure exposed same-origin WebKit request errors during rapid full-document reloads through the legacy variant links. React does not unmount on full navigation, and visibility callbacks could restart the old document's request queue. The final correction suspends the queue before unload, cancels requests on page hide, blocks visibility-triggered restarts while suspended, and resumes on page show. Aborted requests are not marked as missing frames. The original zero-error assertions remain intact; the mobile legacy-link check then passed. The production build was regenerated successfully with `index-hcf4acEw.js` and `heroDecoder.worker-D5YWzN9Q.js`.

The final regenerated build passed **30/30 affected checks in 3.6 minutes** across all three browsers: actual intermediate-frame motion and bounded memory, native section navigation, privacy-page return, exact forward/reverse day-night endpoints, all legacy film links, image detail, responsive profile switching, worker failure and reversal without further frame downloads. This completes coverage of all 90 scenarios through a complete run plus corrected affected checks, rather than an uninterrupted 90/90 run. The 3D tour, dummy contact and local-only enquiry behavior remain unchanged.

## Residence and Architecture redesign — 2026-10-04

Residence now uses a warm ivory composition, sentence-case serif typography, an asymmetrical estate/arcade photograph pairing, visible captions and an onward architecture link. Architecture is a charcoal photographic gallery with Form, Material and Light studies, a separate material detail and a link to the 3D tour. These three studies belong to the Architecture chapter; Film 02 remains the sole homepage film. No hero, film generation or palace tour implementation files changed.

The gallery supports click/touch, arrow keys with wraparound, Home/End and a single active tab stop. Photographs crossfade after loading; a delayed replacement keeps the previous photograph visible. Image frames reserve their dimensions, captions remain outside cropped frames, and interactive gallery controls stay stationary. The previous continuous clip-path and text parallax effects were removed. Brief entrance reveals run once and are skipped for reduced motion.

The production build passed TypeScript and Vite. Manual screenshot review covered 320, 390, 768 and 1440 pixels. The nine new checks passed across Chromium, Firefox and emulated mobile WebKit, covering keyboard/pointer study selection, stable page position, slow-image replacement, responsive imagery, reduced motion and onward links. Early checks caught image-loading layout changes and movement of controls during the gallery reveal; the final implementation reserves image dimensions and animates the photograph only.

The complete one-worker regression run passed **95/99 checks in 12.1 minutes**. Three metadata checks expected localhost because the test invocation omitted SITE_URL; the build correctly contained the permanent production domain. With SITE_URL supplied, all three metadata checks passed, alongside all four desktop motion checks. The remaining mobile intermediate-frame threshold is variable in Windows WebKit emulation: the full run painted 59 positions on the automatic path, while its fallback passed; a later repeat painted 42/32. No hero implementation changed or assertion was weakened. A direct sequential comparison without tracing measured the previous live release at 59 positions/80 browser animation ticks and this preview at 54 positions/70 ticks. Both reached frame 79, returned to frame 0 and retained at most 13 decoded images. This comparison also falls below the threshold on the existing live release; it does not establish smoothness on physical Safari devices. This release therefore has successful coverage of all functional journeys and metadata, with the mobile motion threshold remaining a documented measurement limitation rather than an uninterrupted 99/99 pass.

Prepared scrolling through the redesigned Residence and Architecture chapters, with **4× CPU slowdown in Chromium**, recorded desktop **16.8 ms p95 / 16.8 ms maximum** and phone **16.7 ms p95 / 16.8 ms maximum**, with **zero long tasks** in both eight-second samples. Images were loaded before these samples; these figures do not describe cold-image downloads or physical-device Safari performance. Raw reports are `performance-results/redesign-scroll-performance.json` and `performance-results/redesign-mobile-comparison.json`.
