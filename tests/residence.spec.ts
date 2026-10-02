import { expect, test } from '@playwright/test'

test('only approved homepage films are selectable with no missing assets', async ({ page }) => {
  const missing: string[] = [], errors: string[] = []
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()) })
  page.on('pageerror', error => errors.push(error.message))
  for (const film of [2, 3, 5, 10]) {
    await page.goto(`/?variant=${film}`)
    await expect(page.locator('.hero__variants a')).toHaveCount(4)
    await expect(page.locator('.hero__film-select option')).toHaveText(['Film 02', 'Film 03', 'Film 05', 'Film 10'])
    await expect(page.locator('.hero__variants [aria-current="page"]')).toHaveText(String(film).padStart(2, '0'))
    await expect.poll(() => page.locator('.hero__canvas').evaluate((canvas: HTMLCanvasElement) => canvas.width)).toBeGreaterThan(500)
  }
  expect(missing).toEqual([]); expect(errors).toEqual([])
})

test('removed film links fall back to approved Film 02', async ({ page }) => {
  for (const film of [1, 4, 6, 7, 8, 9]) {
    await page.goto(`/?variant=${film}`)
    await expect(page.locator('.hero__variants [aria-current="page"]')).toHaveText('02')
    await expect(page.getByRole('combobox', { name: 'Choose architectural film', includeHidden: true })).toHaveValue('2')
  }
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
    await expect(page.getByRole('combobox', { name: 'Choose architectural film' })).toBeVisible()
    await page.getByRole('combobox', { name: 'Choose architectural film' }).selectOption('10')
    await expect(page).toHaveURL(/variant=10/)
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
  await expect(page.locator('.hero')).toHaveCSS('background-image', /frame_000-mobile.webp/)
  await expect.poll(() => page.locator('.hero__canvas').evaluate((canvas: HTMLCanvasElement) => canvas.width)).toBeGreaterThan(500)
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
  await expect.poll(() => page.locator('.hero__canvas').evaluate((canvas: HTMLCanvasElement) => canvas.width)).toBeGreaterThan(500)
  await page.waitForTimeout(500)
  expect(frames.size).toBeLessThanOrEqual(7)
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, window.innerHeight * 2) })
  await page.waitForTimeout(500)
  expect(frames.size).toBeGreaterThan(7)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  expect(missing).toEqual([])
  await page.locator('#hero').screenshot({ path: `test-results/hero-${test.info().project.name}.png` })
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
