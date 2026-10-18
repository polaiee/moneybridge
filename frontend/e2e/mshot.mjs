import { launch, BASE } from './lib.mjs'
const [w, h, out, mode] = [+process.argv[2], +process.argv[3], process.argv[4], process.argv[5]]
const { browser, page } = await launch({ width: w, height: h })
await page.goto(BASE); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing'], dataSetup: 'demo' })) })
await page.goto(BASE + '/marketplace'); await page.getByRole('article').first().waitFor(); await page.waitForTimeout(800)
if (mode === 'sticky') { await page.evaluate(() => window.scrollTo(0, 650)); await page.waitForTimeout(600) }
if (mode === 'filtered') { await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: /Savings/ }).click(); await page.getByPlaceholder('Search products or providers…').fill('harbor'); await page.waitForTimeout(900); await page.getByRole('article', { name: 'Rainy Day Savings' }).getByRole('button', { name: 'Compare' }).click(); await page.waitForTimeout(300) }
await page.screenshot({ path: out, fullPage: mode === 'full' }); await browser.close()
