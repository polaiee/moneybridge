// Pass 2: cash flow, allocation treemap + holdings, accounts, roadmap stepper, insights strip.
import { launch, check, BASE } from './lib.mjs'
const seed = (page) => page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing', 'credit_building'], dataSetup: 'demo' })) })
const api = await (await fetch('http://127.0.0.1:8000/api/dashboard')).json()
const $ = (n) => '$' + n.toLocaleString('en-US')
const sec = (page, title) => page.locator('section', { has: page.getByRole('heading', { name: title, exact: true }) }).first()

{
  const { browser, page, errors } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/dashboard'); await page.getByRole('heading', { name: 'Allocation' }).waitFor()
  // ── cash flow
  const cf = sec(page, 'Cash flow'); const cfb = await cf.boundingBox(); const hero = await page.locator('section.on-dark').boundingBox()
  check('cash flow sits in cols 7–12 beside the hero and is compact (≤280px)', cfb.x > hero.x + hero.width && cfb.height <= 280, `${Math.round(cfb.width)}×${Math.round(cfb.height)}`)
  const cft = await cf.innerText()
  check('cash flow shows income/expenses/surplus + callout + Demo label', [$(api.cash_flow.monthly_income), $(api.cash_flow.monthly_expenses), $(api.cash_flow.monthly_surplus), '33% of income', 'Demo data'].every((x) => cft.includes(x)))
  check('cash flow: old stats grid is gone', !cft.includes('Savings rate'))
  // ── allocation
  const tiles = page.locator('[data-tile]'); check('treemap has one tile per holding', (await tiles.count()) === api.portfolio.holdings.length)
  const [t0, t1] = [await tiles.nth(0).boundingBox(), await tiles.nth(1).boundingBox()]
  check('treemap tiles are sized by weight (60/40)', Math.abs((t0.width / (t0.width + t1.width)) - 0.6) < 0.02, `${Math.round(t0.width)} vs ${Math.round(t1.width)}`)
  const tm = await sec(page, 'Allocation').boundingBox(), ho = await sec(page, 'Holdings').boundingBox(), tmw = tm.width / (tm.width + ho.width)
  check('treemap (cols 1–7) left, holdings table (cols 8–12) right', ho.x > tm.x + tm.width - 1 && tmw > 0.55 && tmw < 0.62, tmw.toFixed(2))
  const ht = await sec(page, 'Holdings').innerText()
  check('holdings table: names, values, weights, fees, total', api.portfolio.holdings.every((h) => ht.includes(h.name) && ht.includes($(h.value)) && ht.includes(h.allocation_pct.toFixed(0) + '%') && ht.includes(h.expense_ratio_pct.toFixed(2) + '%')) && ht.includes($(api.portfolio.total)))
  await tiles.nth(1).hover(); await page.waitForTimeout(250)
  const row1 = page.locator('ul[aria-label="Holdings"] li').nth(1)
  check('hover a tile → matching table row highlights', (await row1.evaluate((e) => getComputedStyle(e).backgroundColor)) !== 'rgba(0, 0, 0, 0)')
  await page.mouse.move(5, 5); await page.locator('ul[aria-label="Holdings"] li').nth(0).hover(); await page.waitForTimeout(250)
  const op = await tiles.nth(1).evaluate((e) => getComputedStyle(e).opacity)
  check('hover a row → the other tile dims', Number(op) < 0.6, op)
  check('allocation labelled Demo data / fictional', (await sec(page, 'Allocation').innerText()).includes('Demo data') && (await sec(page, 'Allocation').innerText()).includes('fictional'))
  // ── accounts
  const ac = sec(page, 'Accounts'); const act = await ac.innerText()
  check('accounts grouped with subtotals', ['Cash', 'Investments', 'Liabilities'].every((g) => act.includes(g)) && act.includes('$11,500') && act.includes('$12,000'))
  check('4 accounts, each with a visible Demo data label', (await ac.locator('[data-account]').count()) === 4 && (await ac.getByText('Demo data', { exact: true }).count()) === 4)
  check('liability shown as negative', act.includes('−$1,500'))
  const acb = await ac.boundingBox(), rm = sec(page, 'Goals & roadmap'), rmb = await rm.boundingBox()
  check('accounts (cols 1–5) left of roadmap (cols 6–12)', rmb.x > acb.x + acb.width - 1 && Math.abs(acb.y - rmb.y) < 4)
  // ── roadmap stepper
  const items = rm.locator('ol[aria-label="Roadmap steps"]').first().locator('> li'); const n = await items.count()
  const ys = await items.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
  check(`desktop stepper is horizontal (${n} steps on one line)`, n === 3 && new Set(ys).size === 1, ys.join(','))
  check('goals strip: chip per goal with "No progress data"', (await rm.locator('ul[aria-label="Goals"] li').count()) === 3 && (await rm.getByText('No progress data').count()) === 3)
  const vis = rm.locator('ol:visible')
  check('first step is Current, others Up next', (await vis.getByText('Current', { exact: true }).count()) === 1 && (await vis.getByText('Up next', { exact: true }).count()) === 2)
  await rm.locator('ol:visible').getByRole('button', { name: /Mark done: Explore savings products/ }).click()
  check('clicking a node marks it Done and advances Current', (await vis.getByText('Done', { exact: true }).count()) === 1 && (await vis.getByText('Current', { exact: true }).count()) === 1)
  check('done state persists in localStorage', (await page.evaluate(() => localStorage.getItem('mb.roadmapDone'))).includes('Explore savings products'))
  await page.reload(); await page.getByRole('heading', { name: 'Goals & roadmap' }).waitFor(); check('done state survives reload', (await sec(page, 'Goals & roadmap').locator('ol:visible').getByText('Done', { exact: true }).count()) === 1)
  await sec(page, 'Goals & roadmap').getByRole('link', { name: /Open Financial Twin/ }).first().waitFor(); check('step links present', true)
  // ── insights strip
  const link = page.getByRole('link', { name: /Explore in Financial Twin/ }); const strip = page.locator('section', { has: link }).first(); const sb = await strip.boundingBox(), st = await strip.innerText()
  check('insights is a single short strip (≤90px, full width)', sb.height <= 90 && sb.width > 1100, `${Math.round(sb.width)}×${Math.round(sb.height)}`)
  check('insights keep numbers + Demo label + not-advice note', st.includes($(api.cash_flow.monthly_surplus)) && st.includes('33%') && st.includes('51%') && st.includes('Demo data') && st.includes('Not advice'))
  await link.click(); await page.waitForURL('**/twin'); check('CTA opens the Financial Twin', true)
  // ── typography: sans-serif only
  await page.goto(BASE + '/dashboard'); await page.getByRole('heading', { name: 'Allocation' }).waitFor()
  const fonts = await page.evaluate(() => [...new Set([...document.querySelectorAll('body, h1, h2, h3, .num, button')].map((e) => getComputedStyle(e).fontFamily))])
  check('only Geist is used (no serif)', fonts.every((f) => /Geist/.test(f) && !/serif|Georgia|Instrument/i.test(f.replace(/sans-serif/gi, ''))), fonts.join(' | '))
  check('no console errors', errors.length === 0, errors.join('|'))
  await browser.close()
}
for (const w of [1024, 390]) {
  const { browser, page } = await launch({ width: w, height: 844 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/dashboard'); await page.getByRole('heading', { name: 'Allocation' }).waitFor()
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  check(`${w}px: no horizontal overflow`, ov <= 1, String(ov))
  const rm = sec(page, 'Goals & roadmap')
  if (w === 390) {
    const ys = await rm.locator('ol:visible > li').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
    check('390px: stepper is vertical', ys.length === 3 && new Set(ys).size === 3, ys.join(','))
    const a = await sec(page, 'Allocation').boundingBox(), h = await sec(page, 'Holdings').boundingBox(); check('390px: treemap then holdings stacked', h.y > a.y + a.height - 1)
    const tiles = await page.locator('[data-tile]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height))); const clip = await page.locator('[data-tile]').evaluateAll((els) => els.every((e) => [...e.querySelectorAll('span')].every((c) => c.getBoundingClientRect().right <= e.getBoundingClientRect().right + 0.5))); check('390px: treemap tile content stays inside its tile', clip)
    const mob = await sec(page, 'Holdings').innerText(); check('390px: holdings is a card list with every value visible', mob.includes('Expense ratio') && mob.includes('$12,000') && !(await page.locator('ul[aria-label="Holdings"]').isVisible()))
    check('390px: treemap tiles have usable height', tiles.every((x) => x > 80), tiles.join(','))
  } else { const a = await sec(page, 'Accounts').boundingBox(), r = await rm.boundingBox(); check('1024px: accounts + roadmap side by side', r.x > a.x + a.width - 1) }
  await browser.close()
}
