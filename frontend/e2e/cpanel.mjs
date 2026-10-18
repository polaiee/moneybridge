import { launch, BASE } from './lib.mjs'
const [w, h, out, mode] = [+process.argv[2], +process.argv[3], process.argv[4], process.argv[5]]
const { browser, page } = await launch({ width: w, height: h })
await page.goto(BASE); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing'], dataSetup: 'demo' })); localStorage.setItem('mb.shareProfile', 'true') })
await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Marketplace' }).click(); await page.getByRole('article').first().waitFor()
await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: /Savings/ }).click(); await page.waitForTimeout(500)
await page.getByRole('article', { name: 'Rainy Day Savings' }).getByRole('button', { name: 'Compare' }).click(); await page.getByRole('article', { name: 'Flexible Savings' }).getByRole('button', { name: 'Compare' }).click()
await page.getByRole('region', { name: 'Comparison bar' }).getByRole('button', { name: 'Compare' }).click(); await page.getByText('A clearer view, side by side.').waitFor()
await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'AI Companion' }).click(); await page.getByRole('heading', { name: 'AI Companion' }).waitFor(); await page.waitForTimeout(800)
if (mode === 'open-twin') { await page.getByRole('switch', { name: 'Attach Twin results to my messages' }).click(); await page.getByRole('button', { name: /See exactly what/ }).first().click() }
if (mode === 'open-section') { await page.getByRole('switch').count(); await page.getByRole('button', { name: /Context & memory/ }).click() }
await page.waitForTimeout(500); await page.screenshot({ path: out }); await browser.close()
