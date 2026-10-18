import { launch, BASE } from './lib.mjs'
const [w, h, out, ctx] = [+process.argv[2], +process.argv[3], process.argv[4], process.argv[5]]
const { browser, page } = await launch({ width: w, height: h })
await page.goto(BASE); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing', 'learning_etfs'], dataSetup: 'demo' })) })
if (ctx === 'twin') { await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200); await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'AI Companion' }).click() }
else await page.goto(BASE + '/companion')
await page.getByRole('heading', { name: 'AI Companion' }).waitFor(); await page.waitForTimeout(700)
await page.screenshot({ path: out }); await browser.close()
