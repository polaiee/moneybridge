// Twin Pass 2: allocation comparison, fee impact, risk tiles, assumptions strip + accordion, quiz. Numbers checked against /api/simulate.
import { existsSync } from 'node:fs'
import { launch, check, BASE } from './lib.mjs'
const seed = (page) => page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
const sim = async (scenario, baseline) => (await fetch('http://127.0.0.1:8000/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario, baseline }) })).json()
const H = (a, b) => [{ name: 'Demo US Equity ETF', weight_pct: a, expense_ratio_pct: 0.05 }, { name: 'Demo International ETF', weight_pct: b, expense_ratio_pct: 0.2 }]
const $ = (n) => '$' + Math.round(n).toLocaleString('en-US')
const dash = await (await fetch('http://127.0.0.1:8000/api/dashboard')).json()
const baseH = dash.portfolio.holdings.map((h) => ({ name: h.name, weight_pct: h.allocation_pct, expense_ratio_pct: h.expense_ratio_pct }))
const sec = (page, t) => page.locator('section', { has: page.getByRole('heading', { name: t, exact: true }) }).first()
const split = (page) => page.locator('input.split-range')
const opacity = (loc) => loc.evaluate((e) => Number(getComputedStyle(e).opacity))

check('twin/Legacy.tsx is deleted', !existsSync('src/pages/twin/Legacy.tsx'))
{
  const { browser, page, errors } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/twin'); await page.getByRole('heading', { name: 'Allocation comparison' }).waitFor(); await page.waitForTimeout(900)
  const T = () => page.locator('main').innerText()

  // scenario under test: 12k, $600/mo, 80/20, 10y, 6%; baseline $300/mo current allocation
  await page.fill('#monthly', '600'); await split(page).fill('80'); await page.waitForTimeout(1400)
  const sc = { initial_investment: 12000, monthly_contribution: 600, years: 10, gross_return_pct: 6, holdings: H(80, 20) }
  const bl = { initial_investment: 12000, monthly_contribution: 300, years: 10, gross_return_pct: 6, holdings: baseH }
  const truth = await sim(sc, bl), baseT = await sim(bl)

  // ───── allocation comparison
  const ac = sec(page, 'Allocation comparison'), fee = sec(page, 'ETF fee impact')
  const hs = async (t) => [(await page.locator(`[data-seg="${t}-0"]`).boundingBox()).height, (await page.locator(`[data-seg="${t}-1"]`).boundingBox()).height]
  const [c0, c1] = await hs('Current'), [h0, h1] = await hs('Hypothetical')
  check('tall stacked bars sized by weight: current 60/40, hypothetical 80/20', Math.abs(c0 / (c0 + c1) - 0.6) < 0.02 && Math.abs(h0 / (h0 + h1) - 0.8) < 0.02, `current ${(c0 / (c0 + c1)).toFixed(2)}, hyp ${(h0 / (h0 + h1)).toFixed(2)}`)
  const cb = await page.locator('[data-seg="Current-0"]').boundingBox(), hb = await page.locator('[data-seg="Hypothetical-0"]').boundingBox(), d0 = await page.locator('[data-delta="0"]').boundingBox()
  check('side by side, with the delta chips between the bars', hb.x > cb.x + cb.width && d0.x > cb.x + cb.width - 2 && d0.x + d0.width < hb.x + 2)
  check('delta chips: "+20 pts" and "−20 pts"', (await page.locator('[data-delta="0"]').innerText()) === '+20 pts' && (await page.locator('[data-delta="1"]').innerText()) === '−20 pts')
  const act = await ac.innerText()
  check('weight chips + legend show 60%→80% and 40%→20%; Hypothetical badge kept', act.includes('60% → 80%') && act.includes('40% → 20%') && act.includes('Hypothetical') && act.includes('Demo International ETF'))
  await page.locator('[data-seg="Current-1"]').hover(); await page.waitForTimeout(250)
  check('hover a bar segment → same fund stays lit in the other bar, other fund dims', (await opacity(page.locator('[data-seg="Hypothetical-1"]'))) === 1 && (await opacity(page.locator('[data-seg="Hypothetical-0"]'))) < 0.6 && (await opacity(page.locator('[data-seg="Current-0"]'))) < 0.6)
  check('hover a bar segment → the panel’s fund row highlights', (await page.locator('[data-fund-row="1"]').evaluate((e) => getComputedStyle(e).backgroundColor)) !== 'rgba(0, 0, 0, 0)' && (await page.locator('[data-fund-row="0"]').evaluate((e) => getComputedStyle(e).backgroundColor)) === 'rgba(0, 0, 0, 0)')
  await page.mouse.move(5, 5); await page.locator('[data-fund-row="0"]').hover(); await page.waitForTimeout(250)
  check('hover a panel fund row → both bars highlight that fund', (await opacity(page.locator('[data-seg="Current-0"]'))) === 1 && (await opacity(page.locator('[data-seg="Hypothetical-0"]'))) === 1 && (await opacity(page.locator('[data-seg="Hypothetical-1"]'))) < 0.6)
  await page.mouse.move(5, 5); await page.waitForTimeout(250)

  // ───── fee impact
  const ft = await fee.innerText()
  check('fee cards: weighted fees + modeled costs equal /api/simulate', ft.includes('weighted fee ' + truth.baseline_expense_ratio_pct.toFixed(2) + '%') && ft.includes('weighted fee ' + truth.weighted_expense_ratio_pct.toFixed(2) + '%') && ft.includes($(baseT.fee_impact.cost_of_fees)) && ft.includes($(truth.fee_impact.cost_of_fees)), `${$(baseT.fee_impact.cost_of_fees)} vs ${$(truth.fee_impact.cost_of_fees)}`)
  const diff = truth.fee_impact.cost_of_fees - baseT.fee_impact.cost_of_fees
  check('fee difference line equals the API difference and says more/less', ft.includes($(Math.abs(diff))) && ft.includes(diff <= 0 ? 'less' : 'more'), $(Math.abs(diff)))
  const bars = await fee.locator('[data-fee-bar]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width / e.parentElement.getBoundingClientRect().width))
  const expect = [baseT.fee_impact.cost_of_fees, truth.fee_impact.cost_of_fees].map((c) => c / Math.max(baseT.fee_impact.cost_of_fees, truth.fee_impact.cost_of_fees))
  check('fee bars are scaled against the larger cost', Math.abs(bars[0] - expect[0]) < 0.02 && Math.abs(bars[1] - expect[1]) < 0.02, `${bars.map((b) => b.toFixed(2))} vs ${expect.map((b) => b.toFixed(2))}`)
  const ab = await ac.boundingBox(), fb = await fee.boundingBox()
  check('allocation (left) and fee impact (right) share a row, same height', fb.x > ab.x + ab.width - 1 && Math.abs(ab.y - fb.y) < 3 && Math.abs(ab.height - fb.height) < 3, `${Math.round(ab.height)} vs ${Math.round(fb.height)}`)
  check('"Fee comparison" label kept + Tip on weighted fee', ft.includes('Fee comparison') && (await fee.getByRole('button', { name: /What does this mean/ }).count()) === 1)

  // ───── risk tiles
  const rk = sec(page, 'Risk scenarios'), rt = await rk.innerText()
  for (const k of ['downside', 'base', 'upside']) {
    const tile = page.locator(`[data-risk="${k}"]`), tt = await tile.innerText(), r = truth.risk_scenarios[k]
    check(`risk tile "${k}" equals /api/simulate (${$(r.ending_value)}, ${r.gross_return_pct}% gross) and has a mini line`, tt.includes($(r.ending_value)) && tt.includes(r.gross_return_pct + '% gross return') && (await tile.locator('svg[data-mini] path').count()) === 2)
  }
  const tints = await page.locator('[data-risk]').evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor))
  check('tiles are tinted (coral / forest / lime) and base is ringed', tints.length === 3 && new Set(tints).size === 3 && (await page.locator('[data-risk="base"]').evaluate((e) => /ring/.test(e.className))))
  check('the big three-line risk chart is removed', (await page.locator('[aria-label^="Line chart of downside"]').count()) === 0 && (await rk.locator('.recharts-wrapper').count()) === 0)
  check('risk labels kept: Illustrative scenarios, not forecasts, capital can be lost, "your chosen assumption"', ['Illustrative scenarios', 'not forecasts', 'capital can be lost', 'your chosen assumption'].every((x) => rt.includes(x)))
  const tb = await page.locator('[data-risk]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top)); check('three tiles in one row on desktop', new Set(tb.map(Math.round)).size === 1)

  // ───── assumptions: strip visible, accordion closed
  const strip = page.getByRole('note', { name: 'Calculation assumptions' }), st = await strip.innerText(), sb = await strip.boundingBox()
  check('assumptions strip is visible and shows the backend text', await strip.isVisible() && st.includes(truth.assumptions.monthly_rate) && st.includes(truth.assumptions.contribution_timing) && st.includes('taxes') && st.includes('Capital can be lost'))
  check('strip is compact (≤ 2 lines)', sb.height <= 70, String(Math.round(sb.height)))
  const acc = page.getByRole('button', { name: /How it’s calculated/ })
  check('accordion is closed by default', (await acc.getAttribute('aria-expanded')) === 'false' && (await page.locator('#assumptions-detail').count()) === 0)
  await acc.click(); const det = await page.locator('#assumptions-detail').innerText()
  check('opening the accordion shows the full assumptions', (await acc.getAttribute('aria-expanded')) === 'true' && det.includes('Rounding') && det.includes('cents') && det.includes('Hypothetical') && det.includes(truth.assumptions.disclaimer))
  await acc.click(); check('…and it closes again', (await page.locator('#assumptions-detail').count()) === 0)

  // ───── quiz + bottom row
  const quiz = sec(page, 'Knowledge check'), qb = await quiz.boundingBox(), accb = await page.locator('section', { has: page.getByRole('button', { name: /How it’s calculated/ }) }).first().boundingBox()
  check('bottom row: accordion (left) and quiz (right) side by side', qb.x > accb.x + accb.width - 1 && Math.abs(qb.y - accb.y) < 4)
  await quiz.getByRole('radio', { name: 'Fund A (lower fee)' }).click(); check('quiz answers with feedback', await quiz.getByText('Correct.').isVisible())
  await quiz.getByRole('button', { name: 'Next question' }).click(); check('quiz moves to question 2', (await quiz.innerText()).includes('Question 2 of 2'))

  // ───── numbers vs API, second scenario (incl. decreasing allocation + lower contribution)
  await page.fill('#initial', '8000'); await page.fill('#monthly', '100'); await page.fill('#years', '20'); await page.fill('#gross', '7.5'); await page.fill('#baseMonthly', '250'); await split(page).fill('35'); await page.waitForTimeout(1600)
  const sc2 = { initial_investment: 8000, monthly_contribution: 100, years: 20, gross_return_pct: 7.5, holdings: H(35, 65) }, bl2 = { initial_investment: 12000, monthly_contribution: 250, years: 20, gross_return_pct: 7.5, holdings: baseH }
  const t2 = await sim(sc2, bl2), b2 = await sim(bl2), body = await T()
  const okAll = [t2.fee_impact.cost_of_fees, b2.fee_impact.cost_of_fees, t2.risk_scenarios.downside.ending_value, t2.risk_scenarios.base.ending_value, t2.risk_scenarios.upside.ending_value].every((n) => body.includes($(n)))
  check('scenario 2: fee costs + all three risk values equal /api/simulate', okAll, [t2.fee_impact.cost_of_fees, b2.fee_impact.cost_of_fees, t2.risk_scenarios.downside.ending_value, t2.risk_scenarios.upside.ending_value].map($).join(' '))
  check('scenario 2: delta chips +/− and weights 60→35 / 40→65', (await page.locator('[data-delta="0"]').innerText()) === '−25 pts' && (await page.locator('[data-delta="1"]').innerText()) === '+25 pts')
  // invalid allocation is reflected, not hidden
  await page.locator('#w1').fill('90'); await page.waitForTimeout(300)
  check('invalid weights: comparison flags that the total is not 100%', (await ac.innerText()).includes('total 125%, not 100%'))
  await page.getByRole('button', { name: /Set last fund/ }).click()

  const fonts = await page.evaluate(() => [...new Set([...document.querySelectorAll('main *')].map((e) => getComputedStyle(e).fontFamily))]); check('Geist only', fonts.every((f) => /Geist/.test(f)), fonts.length + ' families')
  check('no console errors', errors.length === 0, errors.join('|'))
  await browser.close()
}
for (const w of [1024, 390]) {
  const { browser, page } = await launch({ width: w, height: 844 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/twin'); await page.getByRole('heading', { name: 'Allocation comparison' }).waitFor(); await page.waitForTimeout(1200)
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); check(`${w}px: no horizontal overflow`, ov <= 1, String(ov))
  if (w === 390) {
    const row = await page.locator('[data-risk="base"]').evaluate((e) => ({ sw: e.parentElement.scrollWidth, cw: e.parentElement.clientWidth })); check('390px: risk tiles are a scroll-snap row inside their card', row.sw > row.cw, JSON.stringify(row))
    const bars = await page.locator('[data-seg$="-0"]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width))); check('390px: both allocation bars stay side by side and usable', bars.length === 2 && bars.every((x) => x >= 50), bars.join(','))
    const a = await sec(page, 'Allocation comparison').boundingBox(), f = await sec(page, 'ETF fee impact').boundingBox(); check('390px: allocation and fee cards stack', f.y > a.y + a.height - 1)
  } else {
    const a = await sec(page, 'Allocation comparison').boundingBox(), f = await sec(page, 'ETF fee impact').boundingBox(); check('1024px: allocation and fee keep their side-by-side row', f.x > a.x + a.width - 1 && Math.abs(a.y - f.y) < 3)
    const tb = await page.locator('[data-risk]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top))); check('1024px: risk tiles stay 3-up', new Set(tb).size === 1)
  }
  await browser.close()
}
