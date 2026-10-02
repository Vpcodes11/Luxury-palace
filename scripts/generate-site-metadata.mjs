import { writeFile, rm } from 'node:fs/promises'

const raw = process.env.SITE_URL || process.env.URL
if (!raw) {
  await rm('public/sitemap.xml', { force: true })
  await writeFile('public/robots.txt', 'User-agent: *\nAllow: /\n')
  console.log('Final domain unset: sitemap and canonical await SITE_URL.')
} else {
  const parsed = new URL(raw)
  if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash) throw new Error('SITE_URL must be an HTTPS origin, e.g. https://your-domain.com')
  const origin = parsed.origin
  await writeFile('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${origin}/privacy.html</loc></url></urlset>`)
  await writeFile('public/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
  console.log(`Site metadata prepared for ${origin}`)
}
