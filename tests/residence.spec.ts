import { expect, test } from '@playwright/test'

test('homepage uses only finalized Film 02 without selectors or missing assets', async ({ page }) => {
  const missing: string[] = [], errors: string[] = [], filmRequests: string[] = []
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()) })
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (/optimized\/hero-.*\.webp/.test(request.url())) filmRequests.push(request.url()) })
  for (const query of ['', '?variant=1', '?variant=2', '?variant=3', '?variant=4', '?variant=5', '?variant=6', '?variant=7', '?variant=8', '?variant=9', '?variant=10']) {
    await page.goto('/' + query)
    await expect(page.locator('.hero__variants, .hero__film-select')).toHaveCount(0)
    await expect(page.locator('.hero__canvas')).toHaveAttribute('aria-label', /Film 02/)
    await expect(page.locator('.hero__canvas')).toHaveAttribute('data-frame', /\d+/)
  }
  expect(filmRequests.length).toBeGreaterThan(0)
  expect(filmRequests.every(url => url.includes('/hero-film-02-architecture/'))).toBe(true)
  expect(missing).toEqual([]); expect(errors).toEqual([])
})

test('galleries open, advance, trap focus and return focus', async ({ page }) => {
  await page.goto('/')
  const opener = page.getByRole('button', { name: 'Explore The Courtyard', exact: true })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'The Courtyard' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('img')).toHaveJSProperty('complete', true)
  await dialog.getByRole('button', { name: 'Next image' }).click()
  await expect(dialog.locator('figcaption')).toContainText('2 / 3')
  await page.keyboard.press('ArrowLeft')
  await expect(dialog.locator('figcaption')).toContainText('1 / 3')
  await dialog.getByRole('button', { name: 'Close gallery' }).focus()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Next image' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('navigation is accessible and layout fits narrow screens', async ({ page, isMobile }) => {
  await page.goto('/')
  if (isMobile) {
    const menu = page.getByRole('button', { name: 'Menu', exact: true })
    await menu.click()
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('#mobile-menu nav button').last()).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toBeFocused()
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test('arrival remains visible while film requests are slow', async ({ page }) => {
  await page.route('**/optimized/hero-*/**/*.webp', async route => { await new Promise(resolve => setTimeout(resolve, 250)); await route.continue() })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.hero__poster')).toHaveAttribute('src', /frame_000(-mobile)?.webp/)
  await expect(page.locator('.hero__canvas')).toHaveAttribute('data-frame', /\d+/)
})

test('reduced motion loads one film frame and skips pinning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const frames = new Set<string>()
  page.on('request', request => { if (/optimized\/hero-.*\.webp/.test(request.url())) frames.add(request.url()) })
  await page.goto('/')
  await expect(page.locator('.hero')).toHaveClass(/hero--static/)
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await page.waitForTimeout(800)
  // A mobile poster plus the active desktop frame may both be fetched.
  expect(frames.size).toBeLessThanOrEqual(2)
  await expect(page.locator('.hero__copy')).toHaveCSS('opacity', '1')
})

test('3D loads on demand, supports viewpoint buttons and rotation', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.tour-canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Explore in 3D' }).click()
  await expect(page.locator('.tour-interactive')).toBeVisible()
  await expect(page.locator('.tour-canvas canvas, .tour-fallback')).toBeVisible()
  const canvas = page.locator('.tour-canvas canvas')
  if (await canvas.count()) {
    await expect(canvas).toBeVisible()
    await page.getByRole('button', { name: 'Grand salon', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Grand salon', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Rotate model right' }).click()
    await expect(page.locator('.tour-instructions')).toContainText('Grand salon')
  } else await expect(page.locator('.tour-fallback')).toBeVisible()
  await page.locator('#tour').screenshot({ path: `test-results/tour-${test.info().project.name}.png` })
})

test('film loading stays bounded and works when scrolling forward and back', async ({ page }) => {
  const frames = new Set<string>(), missing: string[] = []
  page.on('request', request => { if (/optimized\/hero-.*\.webp/.test(request.url())) frames.add(request.url()) })
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()) })
  await page.goto('/')
  await expect(page.locator('.hero__canvas')).toHaveAttribute('data-frame', /\d+/)
  await page.waitForTimeout(500)
  expect(frames.size).toBeLessThanOrEqual(41)
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, window.innerHeight * 2) })
  await page.waitForTimeout(500)
  await expect(page.locator('.hero__canvas')).toHaveAttribute('data-frame', /\d+/)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  expect(missing).toEqual([])
  await page.locator('#hero').screenshot({ path: `test-results/hero-${test.info().project.name}.png` })
})

test('decoded film stays ready for reverse scrolling without extra frame downloads', async ({ page }) => {
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /hero-film-02-architecture\/frame_/.test(entry.name)).length), { timeout: 20000 }).toBe(41)
  await page.waitForTimeout(300)
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.locator('.hero')).toHaveCSS('position', 'sticky')
  const buffer = await page.locator('.hero__canvas').evaluate((canvas: HTMLCanvasElement) => ({ width: canvas.width, height: canvas.height, mobile: matchMedia('(max-width: 760px)').matches }))
  if (!buffer.mobile) { expect(buffer.width).toBeLessThanOrEqual(1280); expect(buffer.height).toBeLessThanOrEqual(720) }
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, window.innerHeight * 2) })
  await expect.poll(() => page.locator('.hero__canvas').getAttribute('data-frame')).not.toBe('0')
  const requests = await page.evaluate(() => performance.getEntriesByType('resource').length)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('.hero__canvas')).toHaveAttribute('data-frame', '0')
  const frames = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /hero-film-02-architecture\/frame_/.test(entry.name)).length)
  expect(frames).toBe(41)
  expect(requests).toBeGreaterThan(41)
})

test('data saver uses one static poster and no extended hero scroll', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true, effectiveType: '4g' } }))
  const frames = new Set<string>()
  page.on('request', request => { if (/hero-film-02-architecture\/frame_/.test(request.url())) frames.add(request.url()) })
  await page.goto('/')
  await expect(page.locator('.hero-track')).toHaveClass(/hero-track--static/)
  await page.waitForTimeout(1000)
  expect(frames.size).toBe(1)
})

test('WebGL failure presents a photograph', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type: string, ...args: unknown[]) {
      if (type.includes('webgl')) return null
      return original.apply(this, [type, ...args] as Parameters<typeof original>)
    } as typeof original
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore in 3D' }).click()
  await expect(page.locator('.tour-fallback')).toBeVisible()
})

test('privacy, social metadata and dummy contact are available', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('.footer__contact')).toContainText('Dummy number')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /blue-hour-enquiry.webp/)
  for (const path of ['/favicon.svg', '/privacy.html', '/robots.txt', '/optimized/campaign/blue-hour-enquiry.webp']) expect((await request.get(path)).status()).toBe(200)
  await page.goto('/privacy.html')
  await expect(page.getByRole('heading', { name: 'Privacy', exact: true })).toBeVisible()
})
