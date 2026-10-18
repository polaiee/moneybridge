import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 1440, height: 900 })
await page.goto(BASE); await page.evaluate(() => { localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
await page.goto(BASE + '/marketplace'); await page.getByRole('article').first().waitFor(); await page.waitForTimeout(600)
const card = page.getByRole('article', { name: 'Rainy Day Savings' })
console.log(JSON.stringify(await card.innerText())); console.log('rows', await card.locator('dl > div').count(), 'details', await card.getByRole('button', { name: 'View Details' }).count(), 'compare', await card.getByRole('button', { name: 'Compare' }).count())
await browser.close()
