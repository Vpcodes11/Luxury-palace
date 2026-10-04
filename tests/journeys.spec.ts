import { expect, test } from '@playwright/test'

test('primary and footer navigation reach every section and return to the homepage', async ({ page, isMobile }) => {
  await page.goto('/')
  const destinations = [
    ['Residence', 'introduction'], ['Architecture', 'architecture'], ['Spaces', 'spaces'],
    ['3D tour', 'tour'], ['Location', 'location'], ['Enquire', 'enquire'],
  ]
  for (const [label, id] of destinations) {
    if (isMobile) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click()
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: new RegExp(label) }).click()
      await expect(page.getByRole('dialog', { name: 'Navigation menu' })).not.toBeVisible()
      await expect(page.locator('body')).not.toHaveClass(/menu-open/)
    } else if (label === 'Enquire') {
      await page.locator('header').getByRole('button', { name: label, exact: true }).click()
    } else {
      await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: label, exact: true }).click()
    }
    await expect.poll(() => page.locator('#' + id).evaluate(el => Math.abs(el.getBoundingClientRect().top - 84))).toBeLessThan(3)
  }
  for (const [label, id] of destinations.filter(([label]) => label !== 'Enquire')) {
    await page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('button', { name: label, exact: true }).click()
    await expect.poll(() => page.locator('#' + id).evaluate(el => Math.abs(el.getBoundingClientRect().top - 84))).toBeLessThan(3)
  }
  await page.getByRole('button', { name: 'Back to top' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2)
  await expect(page.locator('.hero__canvas')).toHaveAttribute('data-frame', '0')
})

test('menu focus remains reliable across repeated opens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  for (let cycle = 0; cycle < 5; cycle++) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused()
  }
})

test('all galleries load every photograph, wrap around and restore page scrolling', async ({ page }) => {
  const errors: string[] = [], missing: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()) })
  await page.goto('/')
  for (const title of ['The Courtyard', 'The Craft', 'The Water Court']) {
    const opener = page.getByRole('button', { name: `Explore ${title}`, exact: true })
    await opener.click()
    const dialog = page.getByRole('dialog', { name: title, exact: true })
    for (let slide = 1; slide <= 3; slide++) {
      await expect(dialog.locator('figcaption')).toContainText(`${slide} / 3`)
      await expect.poll(() => dialog.getByRole('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
      await dialog.getByRole('button', { name: 'Next image' }).click()
    }
    await expect(dialog.locator('figcaption')).toContainText('1 / 3')
    await dialog.getByRole('button', { name: 'Previous image' }).click()
    await expect(dialog.locator('figcaption')).toContainText('3 / 3')
    await dialog.getByRole('button', { name: 'Close gallery' }).click()
    await expect(opener).toBeFocused()
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
  }
  expect(errors).toEqual([])
  expect(missing).toEqual([])
})

test('enquiry validation guides the user and rejects phone values without digits', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(page.getByLabel('Name', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible()
  await expect(page.getByText('Please share a little more about your enquiry.')).toBeVisible()
  await page.getByLabel('Name', { exact: true }).fill('Test Visitor')
  await page.getByLabel('Email', { exact: true }).fill('visitor@example.com')
  await page.getByLabel('Message', { exact: true }).fill('This is a local test of the enquiry form.')
  for (const phone of ['--------', '       ', '+() ()()', '123']) {
    await page.getByLabel('Phone').fill(phone)
    await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
    await expect(page.getByLabel('Phone')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Please enter a valid phone number.')).toBeVisible()
  }
})

test('valid enquiry clearly confirms a local demo and resets without transmission', async ({ page }) => {
  const transmissions: string[] = []
  page.on('request', request => { if (request.method() !== 'GET') transmissions.push(request.url()) })
  await page.goto('/')
  await expect(page.getByText('Demo form · enquiries are not sent or stored.')).toBeVisible()
  await page.getByLabel('Name', { exact: true }).fill('Test Visitor')
  await page.getByLabel('Email', { exact: true }).fill('visitor@example.com')
  await page.getByLabel('Phone').fill('+1 (202) 555-0123')
  await page.getByLabel('Message', { exact: true }).fill('This is a local test of the enquiry form.')
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Your details passed validation. This demo does not send or store enquiries.')
  await expect(page.getByRole('status')).toBeFocused()
  expect(transmissions).toEqual([])
  await page.getByRole('button', { name: 'Try another enquiry' }).click()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Name', { exact: true })).toBeFocused()
  await page.getByLabel('Name', { exact: true }).fill('Test Visitor')
  await page.getByLabel('Email', { exact: true }).fill('visitor@example.com')
  await page.getByLabel('Message', { exact: true }).fill('The optional phone can be left blank.')
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(page.getByRole('status')).toBeVisible()
  expect(transmissions).toEqual([])
})

test('full page images load without runtime errors or horizontal overflow', async ({ page, isMobile }) => {
  // This walks every section/image and captures the entire tall page. Mobile
  // WebKit automation needs more time for the complete audit, not each check.
  if (isMobile) test.setTimeout(90000)
  const errors: string[] = [], missing: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()) })
  await page.goto('/')
  for (const id of ['introduction', 'architecture', 'residence', 'tour', 'spaces', 'location', 'enquire']) {
    const section = page.locator('#' + id)
    await section.scrollIntoViewIfNeeded()
    for (const image of await section.getByRole('img').all()) {
      await image.scrollIntoViewIfNeeded()
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.screenshot({ path: `test-results/full-page-${test.info().project.name}.png`, fullPage: true, scale: 'css' })
  expect(errors).toEqual([])
  expect(missing).toEqual([])
})

test('privacy link and return link work as a complete journey', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Privacy', exact: true }).click()
  await expect(page).toHaveURL(/\/privacy\.html$/)
  await expect(page.getByRole('heading', { name: 'Privacy', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Return to OMNIS' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.hero__variants, .hero__film-select')).toHaveCount(0)
})

test('3D renders changed viewpoints and page navigation remains usable', async ({ page, browserName, isMobile }) => {
  const chunks: string[] = [], errors: string[] = []
  page.on('request', request => { if (/\/TourScene-.*\.js/.test(request.url())) chunks.push(request.url()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  expect(chunks).toEqual([])
  await page.getByRole('button', { name: 'Explore in 3D' }).click()
  await expect(page.locator('.tour-canvas canvas, .tour-fallback')).toBeVisible({ timeout: 15000 })
  expect(chunks).toHaveLength(1)
  const canvas = page.locator('.tour-canvas canvas')
  if (browserName === 'chromium') await expect(canvas).toBeVisible()
  if (await canvas.count()) {
    await expect(canvas).toHaveAttribute('data-state', 'ready')
    await expect.poll(() => canvas.getAttribute('data-renders').then(Number)).toBeGreaterThan(0)
    const capture = async (name: string) => {
      await page.evaluate(() => window.scrollTo({ top: document.querySelector('.tour-viewer')!.getBoundingClientRect().top + scrollY - 104, behavior: 'instant' }))
      await page.locator('.tour-viewer').screenshot({ path: `test-results/palace-${name}-${test.info().project.name}.png` })
    }
    await capture('estate')
    const estate = await canvas.screenshot({ scale: 'css' })
    for (const name of ['Courtyard', 'Grand salon', 'Sea terrace']) {
      await page.getByRole('button', { name, exact: true }).click()
      await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
      await expect(canvas).toHaveAttribute('data-state', 'ready')
      await expect(canvas).toHaveAttribute('data-view', name)
      expect(Buffer.compare(estate, await canvas.screenshot({ scale: 'css' }))).not.toBe(0)
      await capture(name.toLowerCase().replace(' ', '-'))
    }
    if (isMobile) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click()
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('button', { name: 'Spaces' }).click()
      await expect.poll(() => page.locator('#spaces').evaluate(el => Math.abs(el.getBoundingClientRect().top - 84))).toBeLessThan(3)
    } else {
      await canvas.scrollIntoViewIfNeeded()
      const bounds = await canvas.boundingBox()
      expect(bounds).not.toBeNull()
      const before = await page.evaluate(() => scrollY)
      await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
      await page.mouse.wheel(0, 500)
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100)
    }
  }
  expect(errors).toEqual([])
})
