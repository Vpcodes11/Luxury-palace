import { expect, test } from '@playwright/test'

test('architecture studies change photographs with pointer and keyboard without moving the page', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const tabs = page.getByRole('tablist', { name: 'Architectural studies' })
  await tabs.scrollIntoViewIfNeeded()
  const panel = page.getByRole('tabpanel')
  const visibleImage = panel.locator('img.is-visible')
  for (const [name, heading, source] of [
    ['Material', 'Beauty in the substance.', 'detail_000'],
    ['Light', 'Light is part of the plan.', 'tour-palace'],
    ['Form', 'A rhythm of arches.', 'variation_059'],
  ]) {
    await tabs.getByRole('tab', { name, exact: true }).click()
    const position = await page.evaluate(() => scrollY)
    await expect(panel.getByRole('heading', { name: heading })).toBeVisible()
    await expect(panel).toHaveAttribute('aria-busy', 'false')
    await expect(visibleImage).toHaveAttribute('src', new RegExp(source))
    await expect.poll(() => visibleImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(2)
  }
  await tabs.getByRole('tab', { name: 'Form', exact: true }).focus()
  for (const [key, selected] of [['ArrowRight', 'Material'], ['End', 'Light'], ['ArrowRight', 'Form'], ['ArrowLeft', 'Light'], ['Home', 'Form']]) {
    await page.keyboard.press(key)
    const tab = tabs.getByRole('tab', { name: selected, exact: true })
    await expect(tab).toBeFocused()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.locator('[tabindex="0"]')).toHaveCount(1)
  }
  expect(errors).toEqual([])
})

test('editorial sections fit narrow screens, remain visible with reduced motion and link onward', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const id of ['introduction', 'architecture']) {
      const section = page.locator('#' + id)
      for (const image of await section.getByRole('img').all()) {
        await image.scrollIntoViewIfNeeded()
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
        const bounds = await image.boundingBox()
        expect(bounds!.width).toBeGreaterThan(100)
        expect(bounds!.height).toBeGreaterThan(100)
        expect(await image.evaluate(el => {
          for (let ancestor: Element | null = el; ancestor; ancestor = ancestor.parentElement) {
            if (getComputedStyle(ancestor).opacity === '0') return false
          }
          return true
        })).toBe(true)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
  }
  await page.getByRole('link', { name: 'Discover the architecture' }).click()
  await expect.poll(() => page.locator('#architecture').evaluate(el => Math.abs(el.getBoundingClientRect().top - 84))).toBeLessThan(3)
  await page.getByRole('link', { name: 'Experience it in 3D' }).click()
  await expect.poll(() => page.locator('#tour').evaluate(el => Math.abs(el.getBoundingClientRect().top - 84))).toBeLessThan(3)
  await expect(page.locator('.hero__variants, .hero__film-select')).toHaveCount(0)
})

test('a slow study keeps the previous photograph visible until its replacement is ready', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/optimized/campaign/tour-palace*.webp', async route => {
    await gate
    await route.continue()
  })
  await page.goto('/')
  const tabs = page.getByRole('tablist', { name: 'Architectural studies' })
  await tabs.scrollIntoViewIfNeeded()
  const panel = page.getByRole('tabpanel')
  await expect.poll(() => panel.locator('img.is-visible').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  await tabs.getByRole('tab', { name: 'Light', exact: true }).click()
  await expect(panel).toHaveAttribute('aria-busy', 'true')
  await expect(panel.locator('img.is-visible')).toHaveAttribute('src', /variation_059/)
  await expect(panel.locator('img.is-visible')).toHaveCSS('opacity', '1')
  release()
  await expect(panel).toHaveAttribute('aria-busy', 'false')
  await expect(panel.locator('img.is-visible')).toHaveAttribute('src', /tour-palace/)
  await expect(panel.locator('img.is-visible')).toHaveCSS('opacity', '1')
})
