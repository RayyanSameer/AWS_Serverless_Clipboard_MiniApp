import { test, expect } from '@playwright/test'

test.describe('ClipShare E2E', () => {

  test('page loads with send mode by default', async ({ page }) => {
    await page.goto('/')

    // Title is visible
    await expect(page.getByRole('heading', { name: 'ClipShare', exact: true })).toBeVisible()

    // Textarea is visible
    await expect(page.getByPlaceholder('Paste your text here...')).toBeVisible()

    // Session code is NOT shown yet — user hasn't sent anything
    await expect(page.getByText('Your session code:')).not.toBeVisible()
  })

  test('sender encrypts and gets a session code', async ({ page }) => {
    await page.goto('/')

    // Type a message
    await page.getByPlaceholder('Paste your text here...').fill('hello from test')

    // Click send
    await page.getByText('Encrypt and Send').click()

    // Wait for status to show Sent
    await expect(page.getByText('Sent.')).toBeVisible({ timeout: 10000 })

    // Session code should appear
    await expect(page.getByText('Your session code:')).toBeVisible()

    // Code should be 8 characters matching allowed set
    const codeEl = await page.locator('strong').first()
    const code = await codeEl.textContent()
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/)
  })

  test('recipient decrypts message with correct code', async ({ browser }) => {
    // Open two tabs — sender and recipient
    const senderPage = await browser.newPage()
    const recipientPage = await browser.newPage()

    // SENDER — send a message
    await senderPage.goto('/')
    await senderPage.getByPlaceholder('Paste your text here...').fill('e2e test message')
    await senderPage.getByText('Encrypt and Send').click()
    await expect(senderPage.getByText('Sent.')).toBeVisible({ timeout: 10000 })

    // Get the session code from sender's page
    const code = await senderPage.locator('strong').first().textContent()

    // RECIPIENT — switch to receive mode and enter code
    await recipientPage.goto('/')
    await recipientPage.getByText('Receive').click()
    await recipientPage.getByPlaceholder('Enter session code').fill(code)
    await recipientPage.getByText('Get Message').click()

    // Wait for decrypted message to appear
    await expect(
      recipientPage.locator('textarea').filter({ hasText: 'e2e test message' })
    ).toBeVisible({ timeout: 10000 })

    await senderPage.close()
    await recipientPage.close()
  })

  test('wrong session code shows error', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Receive').click()
    await page.getByPlaceholder('Enter session code').fill('FAKECODE')
    await page.getByText('Get Message').click()

    await expect(page.getByText(/Error/)).toBeVisible({ timeout: 10000 })
  })

  test('empty text shows validation message', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Encrypt and Send').click()
    await expect(page.getByText('Nothing to send.')).toBeVisible()
  })

})