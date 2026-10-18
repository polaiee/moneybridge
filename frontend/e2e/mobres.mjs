import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 390, height: 844 })
await page.goto(BASE); await page.evaluate(() => localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })))
await page.goto(BASE + '/twin'); await page.getByRole('heading', { name: 'Allocation comparison' }).waitFor(); await page.waitForTimeout(1200)
await page.getByRole('heading', { name: 'Allocation comparison' }).scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -140)); await page.waitForTimeout(400)
await page.screenshot({ path: process.argv[2] }); await browser.close()
