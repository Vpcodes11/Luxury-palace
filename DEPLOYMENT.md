# Publishing OMNIS

The site is ready to build as a static website. `netlify.toml` configures a repository deployment; other hosts can run `npm ci` and `npm run build`, then publish `dist`.

1. Choose the hosting account and connect this repository.
2. Set `SITE_URL` to the final HTTPS origin (for example, your own domain without a path). Netlify's `URL` is also supported. On Vercel, the build automatically falls back to `VERCEL_PROJECT_PRODUCTION_URL`, so metadata uses the permanent production domain rather than a unique deployment address.
3. Build with `npm run build`. The build generates compressed desktop/mobile imagery, the film manifest, canonical/social URLs, robots.txt, and a sitemap when a domain is configured. Original images are excluded from `dist`.
4. Run `npm test` against the built release. Install test browsers with `npx playwright install` the first time.
5. Attach the domain in the hosting dashboard, configure its DNS records, and verify HTTPS plus the social preview on the deployed address.

The repository is connected to Vercel and pushes to `main` create deployments. The confirmed public production address is `https://luxurypalace.vercel.app/`. Keep using this address for public review and verification. No custom-domain DNS change has been made.

OMNIS remains a concept. Exact location, dimensions, room counts and public contact details have not been supplied. The visible number is labeled as dummy and is not linked to a dialer. The 3D model is a procedural architectural interpretation, not a surveyed replica.

The enquiry form remains a local demonstration, as requested. Review privacy.html when connecting a form provider, analytics, or the final host.

Vercel can use its Vite preset with `npm run build` and output directory `dist`. `vercel.json` configures caching for optimized images. The final release includes only Film 02 and section/gallery stills; no film selector is exposed. `SITE_URL` can override the automatic production origin for canonical and social URLs.

Before sharing a release, match the GitHub commit to its successful Vercel deployment and check that exact address. Unique deployment URLs retain their original builds after subsequent pushes; an old deployment URL will not show a newer release. Use the project's assigned production domain for a persistent public address once it is confirmed. Deployment protection may require Vercel login, which must be distinguished from a completed public browser test. See [QA-REPORT.md](QA-REPORT.md) for the latest audit and its limits.

To run the browser suite against the public deployment, set `PLAYWRIGHT_BASE_URL=https://luxurypalace.vercel.app` and run `npm test -- --reporter=list,html`. This skips the local preview server. Without that variable, tests continue to use the local production build. Domain-specific metadata checks run when a production origin is supplied.
