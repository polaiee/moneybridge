import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 390, height: 844 })
await page.goto(BASE); await page.evaluate(() => localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })))
await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
await page.evaluate(() => window.scrollTo(0, 500)); await page.waitForTimeout(300)
console.log('summary height at 390:', Math.round((await page.getByRole('region', { name: 'Summary' }).boundingBox()).height))
await page.screenshot({ path: process.argv[2] }); await browser.close()
