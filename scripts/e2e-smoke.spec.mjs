import { expect, test } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5199'
const channel = process.env.PLAYWRIGHT_CHANNEL || 'chrome'

test.use({ channel })
test.setTimeout(60000)

test('desktop core flow is reachable', async ({ page }) => {
  await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('今日学习闭环')).toBeVisible()
  await expect(page.getByText('双端同步体检')).toBeVisible()
  await expect(page.getByText(/云同步/)).toBeVisible()

  await page.getByRole('button', { name: '立即体检' }).click()
  await expect(page.getByText('云同步 · 已同步')).toBeVisible()

  await page.goto(`${baseURL}/practice/speaking?tab=grammar`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('tab', { name: /语法/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('练习中心').first()).toBeVisible()

  await page.goto(`${baseURL}/practice/speaking?tab=shadowing`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('tab', { name: /跟读/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(/先听原句，再模仿节奏录音/)).toBeVisible()

  await page.goto(`${baseURL}/teacher`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByPlaceholder(/问 Emma/)).toBeVisible()
})

test('mobile viewport has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('今日学习闭环')).toBeVisible()

  const overflow = await page.evaluate(() => (
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
  ))
  expect(overflow).toBeLessThanOrEqual(1)

  await page.goto(`${baseURL}/teacher`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByPlaceholder(/问 Emma/)).toBeVisible()
  const teacherOverflow = await page.evaluate(() => (
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
  ))
  expect(teacherOverflow).toBeLessThanOrEqual(1)

  await page.goto(`${baseURL}/practice/speaking?tab=shadowing`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/先听原句，再模仿节奏录音/)).toBeVisible()
  const shadowingOverflow = await page.evaluate(() => (
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth
  ))
  expect(shadowingOverflow).toBeLessThanOrEqual(1)
})
