// Twin Pass 1: control panel, split-bar allocation, sticky summary bar, dual-line projection, AI panel. Numbers checked against /api/simulate.
import { launch, check, BASE } from './lib.mjs'
const seed = (page) => page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
const sim = async (scenario, baseline) => (await fetch('http://127.0.0.1:8000/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario, baseline }) })).json()
const H = (a, b) => [{ name: 'Demo US Equity ETF', weight_pct: a, expense_ratio_pct: 0.05 }, { name: 'Demo International ETF', weight_pct: b, expense_ratio_pct: 0.2 }]
const $ = (n) => '$' + Math.round(n).toLocaleString('en-US')
const dash = await (await fetch('http://127.0.0.1:8000/api/dashboard')).json()
const baseH = dash.portfolio.holdings.map((h) => ({ name: h.name, weight_pct: h.allocation_pct, expense_ratio_pct: h.expense_ratio_pct }))
const waitNum = (page, txt) => page.waitForFunction((t) => document.querySelector('[aria-label="Summary"]')?.innerText.includes(t), txt, { timeout: 8000 }).catch(() => {})
const split = (page) => page.locator('input.split-range')

{
  const { browser, page, errors } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(900)
  const T = () => page.locator('main').innerText()

  // ── hard requirement: reference case
  await page.fill('#initial', '10000'); await page.fill('#baseMonthly', '300'); await page.fill('#monthly', '300'); await page.fill('#gross', '6'); await page.fill('#years', '10')
  await split(page).fill('100'); await waitNum(page, '$67,134')
  const ref = await sim({ initial_investment: 10000, monthly_contribution: 300, years: 10, gross_return_pct: 6, holdings: H(100, 0) })
  check('reference case: backend says $67,134', Math.round(ref.hypothetical.ending_value) === 67134, String(ref.hypothetical.ending_value))
  check('reference case: summary bar shows $67,134', (await page.getByRole('region', { name: 'Summary' }).innerText()).includes('$67,134'))
  const t0 = await T(); check('reference case: projection stats $67,134 / $46,000 / $21,134', t0.includes('$67,134') && t0.includes('$46,000') && t0.includes('$21,134'))

  // ── every number equals a direct /api/simulate call (3 scenarios)
  for (const [name, init, mo, yrs, gr, w, base] of [['default 12k/600/80-20', 12000, 600, 10, 6, 80, 300], ['20y/450/35-65 @7.5%', 15000, 450, 20, 7.5, 35, 250], ['5y/0 monthly/50-50 @3%', 8000, 0, 5, 3, 50, 100]]) {
    await page.fill('#initial', String(init)); await page.fill('#monthly', String(mo)); await page.fill('#years', String(yrs)); await page.fill('#gross', String(gr)); await page.fill('#baseMonthly', String(base)); await split(page).fill(String(w))
    const sc = { initial_investment: init, monthly_contribution: mo, years: yrs, gross_return_pct: gr, holdings: H(w, 100 - w) }
    const bl = { initial_investment: dash.portfolio.total, monthly_contribution: base, years: yrs, gross_return_pct: gr, holdings: baseH }
    const truth = await sim(sc, bl), baseT = await sim(bl)
    await waitNum(page, $(truth.hypothetical.ending_value)); await page.waitForTimeout(1200)
    const sum = await page.getByRole('region', { name: 'Summary' }).innerText(), body = await T()
    const sign = truth.difference_at_end >= 0 ? '+' : '−'
    const ok = sum.includes($(truth.hypothetical.ending_value)) && sum.includes(sign + $(Math.abs(truth.difference_at_end))) && sum.includes(truth.weighted_expense_ratio_pct.toFixed(2) + '%')
      && body.includes($(truth.hypothetical.total_contributions)) && body.includes($(truth.hypothetical.modeled_growth)) && body.includes($(truth.fee_impact.cost_of_fees)) && body.includes($(truth.baseline.ending_value))
    check(`every displayed number equals /api/simulate: ${name}`, ok, `end ${$(truth.hypothetical.ending_value)} Δ ${sign}${$(Math.abs(truth.difference_at_end))} contrib ${$(truth.hypothetical.total_contributions)} growth ${$(truth.hypothetical.modeled_growth)} fees ${$(truth.fee_impact.cost_of_fees)}`)
  }

  // ── layout: sticky panel + results; summary bar sticky
  await page.fill('#years', '10'); await page.fill('#monthly', '600'); await split(page).fill('80'); await page.waitForTimeout(900)
  const panel = await page.getByRole('region', { name: 'Simulation controls' }).locator('xpath=ancestor::section[1]').boundingBox(), sumB = await page.getByRole('region', { name: 'Summary' }).boundingBox()
  check('panel on the left (cols 1–4 ≈ 416px at 1440), results on the right', sumB.x > panel.x + panel.width && Math.abs(panel.width - 416) < 12, `${Math.round(panel.width)}px`)
  await page.evaluate(() => window.scrollTo(0, 700)); await page.waitForTimeout(300)
  const sumS = await page.getByRole('region', { name: 'Summary' }).boundingBox(), panS = await page.getByRole('region', { name: 'Simulation controls' }).locator('xpath=ancestor::section[1]').boundingBox()
  check('summary bar stays stuck 56px from the top while scrolling', Math.abs(sumS.y - 56) < 2, String(sumS.y))
  check('control panel stays sticky (≈72px from the top)', Math.abs(panS.y - 72) < 3, String(panS.y))
  await page.evaluate(() => window.scrollTo(0, 0))

  // ── split bar enforces 100%
  const total = () => page.getByRole('status').filter({ hasText: '/ 100%' }).first().innerText()
  await split(page).fill('35'); check('dragging the divider rebalances; total stays 100% (35/65)', (await total()).includes('100% / 100%') && (await page.locator('#w0').inputValue()) === '35' && (await page.locator('#w1').inputValue()) === '65')
  await split(page).focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150)
  check('keyboard arrows move the divider by 1 point and keep 100%', (await page.locator('#w0').inputValue()) === '37' && (await page.locator('#w1').inputValue()) === '63' && (await total()).includes('100% / 100%'))
  check('range input has an accessible name and value text', (await split(page).getAttribute('aria-label')) === 'Demo US Equity ETF weight' && /Demo US Equity ETF 37 percent/.test(await split(page).getAttribute('aria-valuetext')))
  // invalid state
  await page.locator('#w1').fill('90')
  check('invalid: badge turns to 127% / 100% and exact message shows', (await total()).includes('127% / 100%') && await page.getByText('Allocation must total 100% (currently 127%)').isVisible())
  check('invalid: Run Simulation disabled + "Inputs need attention" notice', await page.getByRole('button', { name: 'Run Simulation' }).isDisabled() && await page.getByText('Inputs need attention').isVisible())
  const hatch = await page.evaluate(() => [...document.querySelectorAll('fieldset div')].some((e) => /repeating-linear-gradient/.test(e.style.background)))
  check('invalid: bar shows hatched coral overflow', hatch)
  await page.getByRole('button', { name: /Set last fund/ }).click(); await page.waitForTimeout(200)
  check('"Set last fund to the remaining %" restores 100%', (await total()).includes('100% / 100%') && (await page.locator('#w1').inputValue()) === '63' && await page.getByRole('button', { name: 'Run Simulation' }).isEnabled())
  await page.locator('#w1').fill('40'); check('under-allocation: 77% / 100% (hatched remainder) + message', (await total()).includes('77% / 100%') && await page.getByText('Allocation must total 100% (currently 77%)').isVisible())
  await page.getByRole('button', { name: /Set last fund/ }).click()
  // other validation messages preserved
  await page.fill('#years', '0'); check('validation: "Duration must be between 1 and 50"', await page.getByText('Duration must be between 1 and 50').isVisible())
  await page.fill('#years', '2.5'); check('validation: "Duration must be a whole number"', await page.getByText('Duration must be a whole number').isVisible())
  await page.fill('#gross', ''); check('validation: "Gross return is required"', await page.getByText('Gross return is required').isVisible())
  await page.fill('#gross', '45'); check('validation: "Gross return must be between -20 and 30"', await page.getByText('Gross return must be between -20 and 30').isVisible())
  await page.fill('#years', '10'); await page.fill('#gross', '6'); await page.waitForTimeout(600)

  // ── dual-line chart: lines, shaded gap, crosshair, direct labels, tooltip
  const chart = page.locator('[aria-label^="Line chart of baseline"]')
  const paths = await chart.evaluate((e) => ({ lines: e.querySelectorAll('path.recharts-line-curve').length, areas: e.querySelectorAll('.recharts-area-area').length, labels: [...e.querySelectorAll('text')].map((t) => t.textContent).filter((t) => /Hypothetical|Current plan/.test(t)) }))
  check('chart: two lines + shaded gap area + direct end labels (no legend)', paths.lines === 2 && paths.areas >= 1 && paths.labels.includes('Hypothetical') && paths.labels.includes('Current plan') && (await chart.locator('.recharts-legend-wrapper').count()) === 0, JSON.stringify(paths))
  const cb = await chart.boundingBox(); await page.mouse.move(cb.x + cb.width * 0.55, cb.y + cb.height * 0.5); await page.waitForTimeout(300)
  check('chart: hover shows crosshair + tooltip with Year, both lines and the Gap', (await chart.locator('.recharts-tooltip-cursor').count()) === 1 && /Year \d+/.test(await page.locator('.recharts-tooltip-wrapper', { hasText: 'Year' }).innerText()) && (await page.locator('.recharts-tooltip-wrapper', { hasText: 'Year' }).innerText()).includes('Gap'))
  const gapFill = await chart.locator('.recharts-area-area').nth(1).getAttribute('fill'); check('chart: gap is lime when hypothetical beats current', /#c8ea54/i.test(gapFill), gapFill)

  // ── labels
  const body = await T()
  check('labels kept: Demo data, Hypothetical plan, Illustrative estimate, Illustrative assumption', ['Demo data', 'Hypothetical plan', 'Illustrative estimate', 'Illustrative assumption', 'Fee comparison', 'Illustrative scenarios', 'not forecasts', 'capital can be lost'].every((x) => body.includes(x)))
  check('footer: lilac Explain + secondary Run Simulation + live status', await page.getByRole('button', { name: 'Explain This Scenario' }).first().isVisible() && await page.getByRole('button', { name: 'Run Simulation' }).isVisible() && body.includes('Live: updates as you type'))
  const bgE = await page.getByRole('button', { name: 'Explain This Scenario' }).first().evaluate((e) => getComputedStyle(e).backgroundColor); check('Explain is lilac', bgE === 'rgb(182, 165, 228)', bgE)
  // ── typography
  const fonts = await page.evaluate(() => [...new Set([...document.querySelectorAll('main *')].map((e) => getComputedStyle(e).fontFamily))]); check('Geist only on the Twin (no serif)', fonts.every((f) => /Geist/.test(f)), fonts.join(' | '))
  check('no console errors', errors.length === 0, errors.join('|'))
  await browser.close()
}

// ── AI panel (request shape checked here; live Backboard reply checked in cp4)
{
  const { browser, page } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
  let body = null
  await page.route('**/api/chat', async (route) => { body = JSON.parse(route.request().postData()); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Stub reply for request-shape test.', thread_id: 't1', assistant_id: 'a1', context_used: ['financial_twin_results'] }) }) })
  const trigger = page.getByRole('region', { name: 'Summary' }).getByRole('button', { name: 'Explain This Scenario' })
  await trigger.focus(); await trigger.click(); await page.getByRole('dialog').waitFor(); await page.getByTestId('ai-reply').waitFor()
  const cur = await sim({ initial_investment: 12000, monthly_contribution: 300, years: 10, gross_return_pct: 6, holdings: baseH }, { initial_investment: 12000, monthly_contribution: 300, years: 10, gross_return_pct: 6, holdings: baseH })
  check('AI panel opens in-page (no navigation) and posts scenario_results', page.url().endsWith('/twin') && !!body?.scenario_results && body.scenario_results.results.hypothetical.ending_value === cur.hypothetical.ending_value, body ? Object.keys(body).join(',') : 'no request')
  check('request carries inputs + results, memory flag, thread', !!body.scenario_results.inputs && typeof body.memory_enabled === 'boolean' && /Explain this Financial Twin scenario/.test(body.message))
  await page.getByRole('button', { name: /What I’m sending/ }).click(); const ctx = await page.getByRole('dialog').innerText()
  check('"What I’m sending" lists the exact figures + "not by the AI" badge', ctx.includes(cur.hypothetical.ending_value.toLocaleString('en-US', { minimumFractionDigits: 2 })) && ctx.includes('Calculated by MoneyBridge, not by the AI'))
  await page.keyboard.press('Escape'); await page.waitForTimeout(250)
  check('Esc closes the panel and focus returns to the trigger', (await page.getByRole('dialog').count()) === 0 && (await trigger.evaluate((e) => e === document.activeElement)))
  await page.getByRole('region', { name: 'Simulation controls' }).locator('xpath=ancestor::section[1]').getByRole('button', { name: 'Explain This Scenario' }).click(); await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: 'Continue in AI Companion' }).click(); await page.waitForURL('**/companion'); await page.locator('[data-msg="assistant"]').first().waitFor()
  check('"Continue in AI Companion" shows the same conversation', (await page.locator('main').innerText()).includes('Stub reply for request-shape test.'))
  await browser.close()
}

// ── <1024: stacked layout, summary first and sticky; no horizontal overflow
for (const w of [1024, 390]) {
  const { browser, page } = await launch({ width: w, height: 844 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); check(`${w}px: no horizontal overflow`, ov <= 1, String(ov))
  const sumB = await page.getByRole('region', { name: 'Summary' }).boundingBox(), pan = await page.getByRole('region', { name: 'Simulation controls' }).locator('xpath=ancestor::section[1]').boundingBox(), proj = await page.getByRole('heading', { name: 'Investment projection' }).boundingBox()
  if (w === 390) {
    check('390px: stacked order summary → controls → projection (no bottom sheet)', sumB.y < pan.y && pan.y + pan.height <= proj.y + 1 && (await page.getByRole('dialog').count()) === 0)
    await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(300)
    const s2 = await page.getByRole('region', { name: 'Summary' }).boundingBox(); check('390px: summary bar stays sticky while scrolling the controls', Math.abs(s2.y - 56) < 2, String(s2.y))
    const pb = await page.getByRole('region', { name: 'Simulation controls' }).locator('xpath=ancestor::section[1]').evaluate((e) => getComputedStyle(e).position); check('390px: controls panel is not sticky', pb !== 'sticky', pb)
    await page.evaluate(() => window.scrollTo(0, 0)); const handle = await split(page).boundingBox(); check('390px: split-bar touch target ≥ 40px tall', handle.height >= 40, String(handle.height))
  } else check('1024px: panel left (cols 1–5), results right', sumB.x > pan.x + pan.width - 1 && Math.abs(pan.width - 360) < 20, `${Math.round(pan.width)}px`)
  await browser.close()
}
