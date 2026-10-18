import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 390, height: 844 })
await page.goto(BASE); await page.evaluate(() => localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })))
await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
console.log(JSON.stringify(await page.evaluate(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('main *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 1 && !e.closest('.overflow-x-auto') }).slice(0, 6).map((e) => `${e.tagName}.${String(e.className).slice(0, 70)} right=${Math.round(e.getBoundingClientRect().right)}`) }), null, 1))
await browser.close()
