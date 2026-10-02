# Website test report — 2 October 2026

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
