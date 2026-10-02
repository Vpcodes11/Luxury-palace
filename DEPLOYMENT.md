# Publishing OMNIS

The site is ready to build as a static website. `netlify.toml` configures a repository deployment; other hosts can run `npm ci` and `npm run build`, then publish `dist`.

1. Choose the hosting account and connect this repository.
2. Set `SITE_URL` to the final HTTPS origin (for example, your own domain without a path). Netlify's `URL` is also supported.
3. Build with `npm run build`. The build generates compressed desktop/mobile imagery, the film manifest, canonical/social URLs, robots.txt, and a sitemap when a domain is configured. Original images are excluded from `dist`.
4. Run `npm test` against the built release. Install test browsers with `npx playwright install` the first time.
5. Attach the domain in the hosting dashboard, configure its DNS records, and verify HTTPS plus the social preview on the deployed address.

The final domain and hosting account have not been supplied, so no public deployment or DNS change has been made. Domain-dependent metadata is generated at build time instead of publishing a dummy address.

OMNIS remains a concept. Exact location, dimensions, room counts and public contact details have not been supplied. The visible number is labeled as dummy and is not linked to a dialer. The 3D model is a procedural architectural interpretation, not a surveyed replica.

The enquiry form remains a local demonstration, as requested. Review privacy.html when connecting a form provider, analytics, or the final host.

Vercel can use its Vite preset with `npm run build` and output directory `dist`. `vercel.json` configures caching for optimized images. The final release includes only Film 02 and section/gallery stills; no film selector is exposed. Set `SITE_URL` to the production HTTPS origin for canonical and social URLs.
