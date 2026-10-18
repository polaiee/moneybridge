import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 390, height: 844 })
await page.goto(BASE); await page.evaluate(() => localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })))
await page.goto(BASE + '/dashboard'); await page.getByRole('heading', { name: 'Allocation' }).waitFor(); await page.waitForTimeout(900)
await page.getByRole('heading', { name: 'Allocation' }).scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -20)); await page.waitForTimeout(300)
await page.screenshot({ path: process.argv[2] }); await browser.close()
