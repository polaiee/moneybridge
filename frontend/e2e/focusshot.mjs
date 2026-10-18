import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 1440, height: 900 })
await page.goto(BASE); await page.evaluate(() => localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })))
await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(800)
const sheetHasRule = await page.evaluate(() => [...document.styleSheets].some((s) => [...s.cssRules].some((r) => /split-range:focus-visible::-webkit-slider-thumb/.test(r.cssText))))
console.log('focus rule present:', sheetHasRule)
await page.locator('input.split-range').focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(200)
const f = page.locator('fieldset').first(); await f.scrollIntoViewIfNeeded(); await f.screenshot({ path: process.argv[2] }); await browser.close()
