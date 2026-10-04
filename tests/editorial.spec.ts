import { expect, test } from '@playwright/test'

test('cinematic chapters keep imagery and overlaid text readable across screen sizes', async ({ page }) => {
  const errors: string[] = [], missing: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const id of ['introduction', 'architecture']) {
      const section = page.locator('#' + id)
      await section.scrollIntoViewIfNeeded()
      for (const image of await section.getByRole('img').all()) {
        await image.scrollIntoViewIfNeeded()
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
      }
      const heading = section.getByRole('heading', { level: 2 })
      await expect(heading).toBeVisible()
      // Check painted text bounds: overflow hidden can conceal an oversized
      // heading even when the document itself reports no horizontal overflow.
      const textBounds = await heading.evaluate(el => {
        const ranges: { left: number; right: number }[] = []
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        let node: Node | null
        while ((node = walker.nextNode())) {
          const range = document.createRange()
          range.selectNodeContents(node)
          for (const rect of Array.from(range.getClientRects())) ranges.push({ left: rect.left, right: rect.right })
        }
        return ranges
      })
      for (const bounds of textBounds) {
        expect(bounds.left).toBeGreaterThanOrEqual(0)
        expect(bounds.right).toBeLessThanOrEqual(width)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    const heading = await page.locator('#architecture-heading').boundingBox()
    const caption = await page.locator('.palace-architecture__facade figcaption').boundingBox()
    const overlap = Math.max(0, Math.min(heading!.x + heading!.width, caption!.x + caption!.width) - Math.max(heading!.x, caption!.x))
      * Math.max(0, Math.min(heading!.y + heading!.height, caption!.y + caption!.height) - Math.max(heading!.y, caption!.y))
    expect(overlap).toBe(0)
  }
  expect(errors).toEqual([])
  expect(missing).toEqual([])
})

test('cinematic chapters link to architecture and the palace tour with ordinary scrolling', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Discover the architecture' }).click()
  await expect.poll(() => page.locator('#architecture').evaluate(el => Math.abs(el.getBoundingClientRect().top - 84))).toBeLessThan(3)
  await page.getByRole('link', { name: 'Step inside in 3D' }).click()
  await expect.poll(() => page.locator('#tour').evaluate(el => Math.abs(el.getBoundingClientRect().top - 84))).toBeLessThan(3)
  await expect(page.getByRole('button', { name: 'Explore in 3D' })).toBeVisible()
  await expect(page.locator('.hero__variants, .hero__film-select')).toHaveCount(0)
})
