// Regression: position:fixed overlays must be positioned against the viewport even when the page is scrolled.
import { launch, check, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 1440, height: 900 })
await page.goto(BASE); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
const inView = (b) => b && b.y >= -1 && b.y + b.height <= 900 + 1
// Marketplace: filter bar, compare bar, drawer after scrolling
await page.goto(BASE + '/marketplace'); await page.getByRole('article').first().waitFor(); await page.waitForTimeout(500)
await page.getByRole('article', { name: 'Everyday Checking' }).getByRole('button', { name: 'Compare' }).click()
await page.evaluate(() => window.scrollTo(0, 700)); await page.waitForTimeout(500)
const fb = await page.getByRole('region', { name: 'Filter bar' }).boundingBox(), cb = await page.getByRole('region', { name: 'Comparison bar' }).boundingBox()
check('scrolled: sticky filter bar sits right under the top bar (y≈56)', fb && Math.abs(fb.y - 56) < 2, JSON.stringify(fb))
check('scrolled: comparison bar is docked at the viewport bottom', cb && Math.abs(cb.y + cb.height - 900) < 2, JSON.stringify(cb))
await page.getByRole('article').nth(4).getByRole('button', { name: 'View Details' }).click(); await page.waitForTimeout(400)
const dlg = await page.getByRole('dialog').locator('aside').boundingBox()
check('scrolled: details drawer fills the viewport height on the right', dlg && Math.abs(dlg.y) < 2 && Math.abs(dlg.height - 900) < 2 && dlg.x + dlg.width >= 1439, JSON.stringify(dlg))
await page.keyboard.press('Escape')
// Twin AI panel after scrolling
await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
await page.route('**/api/chat', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'ok', thread_id: 't', assistant_id: 'a', context_used: [] }) }))
await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(400)
await page.getByRole('region', { name: 'Summary' }).getByRole('button', { name: 'Explain This Scenario' }).click(); await page.getByRole('dialog').waitFor(); await page.waitForTimeout(400)
const ai = await page.getByRole('dialog').locator('> div').nth(1).boundingBox(); check('scrolled: Twin AI panel is a full-height right slide-over', ai && Math.abs(ai.y) < 2 && Math.abs(ai.height - 900) < 2 && ai.x + ai.width >= 1439, JSON.stringify(ai))
await browser.close()
