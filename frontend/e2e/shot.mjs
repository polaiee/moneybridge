// usage: node shot.mjs <path> <out.png> [width] [height] [full]
import { launch, BASE } from './lib.mjs'
const [path, out, w = '1440', h = '900', full] = process.argv.slice(2)
const { browser, page } = await launch({ width: +w, height: +h })
await page.goto(BASE)
await page.evaluate(() => { localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing'], dataSetup: 'demo' })) })
await page.goto(BASE + path); await page.waitForTimeout(1200)
if (path === '/twin') { await page.fill('#monthly', '600'); await page.locator('input[aria-label="Demo US Equity ETF weight"]').fill('80'); await page.waitForTimeout(1200) }
await page.screenshot({ path: out, fullPage: !!full })
await browser.close()
