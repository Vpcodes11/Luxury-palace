# Website test report — 2 October 2026

The production build passed and all **57 browser checks passed**, covering 19 scenarios in desktop Chromium, desktop Firefox, and iPhone 13 WebKit emulation. The final run used no automatic retries. These results apply to the locally served production output built from the code in this audit.

## Confirmed behavior

- Film 02 is the only homepage animation. No desktop film links or mobile film selector exists. All ten legacy `?variant=` values still show Film 02.
- Header and footer navigation reach every destination and return to the top. Mobile navigation closes, releases the scroll lock, traps keyboard focus, and restores focus.
- All three galleries load all nine photographs. Next/previous buttons wrap correctly, keyboard controls work, and closing restores focus and page scrolling.
- The 3D tour loads its separate code only on demand. Viewpoint buttons change the rendered model, rotation works, desktop wheel scrolling remains available, and mobile navigation can leave the active tour. Devices without WebGL receive the photographic fallback.
- Enquiry validation rejects missing/invalid fields and phone values without enough digits. Optional phone omission and formatted numbers work. A valid entry presents a clearly labeled local demonstration, performs no submission, and can be reset.
- Page imagery loads without missing resources or runtime exceptions in the tested journeys. Layout checks pass at 320, 390, 768 and 1440 pixels.
- Reduced motion and data saver use the static poster. Forward/reverse animation scrolling works, with bounded frame downloads.
- Privacy links, the return link, favicon, social image and dummy contact are present.
- Manual browser review covered the desktop homepage, rendered 3D estate, mobile menu, mobile enquiry section and mobile homepage.
- `npm audit --omit=dev` reported zero known vulnerabilities. This is a dependency check, not a penetration test.

## Issues corrected during the audit

1. Mobile Safari intermittently missed focus while the menu panel opened. Focus now avoids scrolling and is restored after the opening transition when necessary. Repeated-opening checks pass.
2. The enquiry form accepted phone values consisting only of punctuation or whitespace. It now requires 7–15 digits when a phone is supplied.
3. The local enquiry demonstration misleadingly claimed a representative would respond. Both the form and confirmation now state that enquiries are not sent or stored. Validation focuses the first invalid field; confirmation and reset also restore useful focus.

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

The previously deployed GitHub commit `c6e20712a3af1082f20fea0a86bb02db46042398` was associated with a successful Vercel deployment at `https://luxury-palace-lo3dpby3v-vnss-projects-dc1cff4f.vercel.app/`. Opening that exact address in the test browser redirects to Vercel login, so this audit cannot claim a completed live-site browser test. GitHub/Vercel deployment success is separate from browser verification of the hosted page.

After this audit is pushed, use the new successful deployment associated with that commit. A unique older Vercel deployment URL continues to serve its original build. Opening it cannot verify the latest changes.

Public enquiry delivery remains intentionally unconnected. No final public domain was supplied, so canonical URLs and sitemap generation still await `SITE_URL`. Physical-device touch gestures, actual iOS Safari, and live-origin loading/caching remain outside these emulation results.

## Reproduce

```sh
npm ci
npm run build
npx playwright install
npm test -- --reporter=list,html
```

For the performance comparison, start the production preview on port 4175, set `PROFILE_CPU_THROTTLE=4`, and run `node scripts/profile-performance.mjs http://127.0.0.1:4175 comparison`. Set `PROFILE_WARMUP_MS=0` for immediate scrolling; omit it for the default 10-second preparation period.
