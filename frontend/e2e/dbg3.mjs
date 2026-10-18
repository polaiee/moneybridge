import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 1440, height: 900 })
await page.goto(BASE); await page.evaluate(() => { localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
await page.goto(BASE + '/marketplace'); await page.getByRole('article').first().waitFor(); await page.waitForTimeout(600)
await page.evaluate(() => window.scrollTo(0, 800)); await page.waitForTimeout(500)
const fb = page.getByRole('region', { name: 'Filter bar' })
const snap = async (l) => console.log(l, 'bar=', await fb.count(), 'scrollY=', await page.evaluate(() => Math.round(scrollY)), 'docH=', await page.evaluate(() => document.documentElement.scrollHeight), 'cardsTop=', Math.round((await page.getByRole('group', { name: 'Categories' }).boundingBox()).y), 'articles=', await page.getByRole('article').count())
await snap('before'); await fb.getByRole('button', { name: /Credit/ }).click()
for (const t of [50, 300, 800]) { await page.waitForTimeout(t); await snap('after +' + t) }
await browser.close()
