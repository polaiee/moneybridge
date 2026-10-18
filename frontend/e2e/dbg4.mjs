import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 1440, height: 900 })
await page.goto(BASE); await page.evaluate(() => { localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
await page.goto(BASE + '/marketplace'); await page.getByRole('article').first().waitFor(); await page.waitForTimeout(600)
await page.evaluate(() => { window.scrollTo(0, 800); window.__log = []; let n = 0; const tick = () => { window.__log.push(`f${n++} scrollY=${Math.round(scrollY)} docH=${document.documentElement.scrollHeight} articles=${document.querySelectorAll('article').length} bar=${!!document.querySelector('[aria-label="Filter bar"]')}`); if (n < 40) requestAnimationFrame(tick) }; window.__tick = tick })
await page.waitForTimeout(400)
await page.evaluate(() => window.__tick()); await page.getByRole('region', { name: 'Filter bar' }).getByRole('button', { name: /Credit/ }).click(); await page.waitForTimeout(900)
const L = await page.evaluate(() => window.__log); console.log(L.filter((x, i) => i === 0 || x.split(' ').slice(1).join(' ') !== L[i - 1].split(' ').slice(1).join(' ')).join('\n'))
await browser.close()
