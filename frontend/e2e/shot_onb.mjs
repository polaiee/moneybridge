import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: +process.argv[3], height: 900 })
await page.goto(BASE + '/onboarding'); await page.getByRole('button', { name: 'Continue' }).click(); await page.getByRole('button', { name: 'Verify and continue' }).click(); await page.waitForTimeout(500)
await page.screenshot({ path: process.argv[2] }); await browser.close()
