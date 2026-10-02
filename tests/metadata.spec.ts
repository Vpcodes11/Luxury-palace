import { expect, test } from '@playwright/test'

const site = process.env.SITE_URL || process.env.URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') || process.env.PLAYWRIGHT_BASE_URL

test('production metadata uses the permanent origin and publishes a sitemap', async ({ page, request }) => {
  test.skip(!site, 'A production origin is required for domain-specific metadata.')
  const origin = new URL(site!).origin
  await page.goto('/')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}/`)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${origin}/`)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${origin}/optimized/campaign/blue-hour-enquiry.webp`)
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type']).toMatch(/xml/)
  expect(await sitemap.text()).toContain(`<loc>${origin}/</loc>`)
  expect(await sitemap.text()).toContain(`<loc>${origin}/privacy.html</loc>`)
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`)
})
