// Companion Pass 2: Active context card, Memory card, collapsible "Context & memory" section below 1024px.
// /api/chat and /api/memory are stubbed (request shapes, states); the live Backboard checks are in companion1 + cp4.
import { launch, check, BASE } from './lib.mjs'
const seed = (page, extra = {}) => page.evaluate((x) => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing'], dataSetup: 'demo' })); for (const [k, v] of Object.entries(x)) localStorage.setItem(k, v) }, extra)
const usd2 = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const nav = (page, name) => page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name }).click()
const stubChat = async (page) => { const bodies = []; await page.route('**/api/chat', async (r) => { bodies.push(JSON.parse(r.request().postData())); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Stub reply.', thread_id: 't', assistant_id: 'a', context_used: [] }) }) }); return bodies }
async function withContexts(page) { // Twin result + Marketplace comparison, reached by in-app navigation so the in-memory contexts survive
  await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
  await nav(page, 'Marketplace'); await page.getByRole('article').first().waitFor()
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: /Savings/ }).click(); await page.waitForTimeout(500)
  await page.getByRole('article', { name: 'Rainy Day Savings' }).getByRole('button', { name: 'Compare' }).click(); await page.getByRole('article', { name: 'Flexible Savings' }).getByRole('button', { name: 'Compare' }).click()
  await page.getByRole('region', { name: 'Comparison bar' }).getByRole('button', { name: 'Compare' }).click(); await page.getByText('A clearer view, side by side.').waitFor()
  await nav(page, 'AI Companion'); await page.getByRole('heading', { name: 'AI Companion' }).waitFor(); await page.waitForTimeout(600)
}
const sim = await (await fetch('http://127.0.0.1:8000/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: { initial_investment: 12000, monthly_contribution: 300, years: 10, gross_return_pct: 6, holdings: [{ name: 'Demo US Equity ETF', weight_pct: 60, expense_ratio_pct: 0.05 }, { name: 'Demo International ETF', weight_pct: 40, expense_ratio_pct: 0.2 }] } }) })).json()
const cmpApi = await (await fetch('http://127.0.0.1:8000/api/marketplace/compare', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 'sav-rainy', b: 'sav-flex' }) })).json()
const CALC = 'Calculated by MoneyBridge, not by the AI'

{ // ───── empty state, desktop
  const { browser, page, errors } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await stubChat(page); await page.goto(BASE + '/companion'); await page.getByRole('heading', { name: 'AI Companion' }).waitFor(); await page.waitForTimeout(600)
  const aside = page.getByRole('complementary', { name: 'Context and memory' }), t = await aside.innerText()
  check('panel visible; section "Context & memory" is not shown on desktop', await aside.isVisible() && (await page.getByTestId('context-section').isVisible()) === false)
  check('itemised: Your profile, Financial Twin results, Marketplace comparison + Memory card', ['Your profile', 'Financial Twin results', 'Marketplace comparison', 'Memory'].every((x) => t.includes(x)))
  check('empty states with links back: "No scenario yet" → /twin, "No comparison yet" → /marketplace', t.includes('No scenario yet') && t.includes('No comparison yet') && (await aside.getByRole('link', { name: /Open Financial Twin/ }).getAttribute('href')) === '/twin' && (await aside.getByRole('link', { name: /Open Marketplace/ }).getAttribute('href')) === '/marketplace')
  check('no Twin/Marketplace attach switches or "Calculated" labels without that context', (await aside.getByRole('switch', { name: /Attach/ }).count()) === 0 && !t.includes(CALC))
  check('status line says "No app data" (profile not shared yet)', (await page.locator('[data-testid=next-includes]:visible').innerText()).includes('Next message will include: No app data'))
  check('privacy wording kept', ['Balances and account data are never sent', 'Share my goals and experience level', 'Let Backboard remember learning context across conversations', 'Only preferences and learning context you approve are retained'].every((x) => t.includes(x)))
  const chips = page.getByRole('group', { name: 'Attached context' })
  // profile switch ↔ composer chip ↔ localStorage (real setting)
  const ps = aside.getByRole('switch', { name: 'Share my goals and experience level' })
  check('profile switch starts off, shows the "Your choices, shared by you" label', (await ps.getAttribute('aria-checked')) === 'false' && t.includes('Your choices, shared by you'))
  await ps.click(); await page.waitForTimeout(150)
  check('profile switch on → setting saved, composer chip pressed, preview shows goals/level/stage', (await page.evaluate(() => localStorage.getItem('mb.shareProfile'))) === 'true' && (await chips.getByRole('button', { name: /Profile/ }).getAttribute('aria-pressed')) === 'true' && (await aside.innerText()).includes('Goals: Emergency savings, Investing · Level: Beginner · Stage: Early career'))
  check('status line now includes Profile', (await page.locator('[data-testid=next-includes]:visible').innerText()).includes('Next message will include: Profile'))
  await chips.getByRole('button', { name: /Profile/ }).click(); await page.waitForTimeout(150)
  check('…and the composer chip drives the same switch (two-way sync)', (await ps.getAttribute('aria-checked')) === 'false' && (await page.evaluate(() => localStorage.getItem('mb.shareProfile'))) === 'false')
  // keyboard
  await ps.focus(); await page.keyboard.press('Space'); await page.waitForTimeout(100); check('switch toggles with the keyboard (Space)', (await ps.getAttribute('aria-checked')) === 'true')
  await page.keyboard.press('Space')
  const fonts = await page.evaluate(() => [...new Set([...document.querySelectorAll('aside *')].map((e) => getComputedStyle(e).fontFamily))]); check('Geist only in the panel', fonts.every((f) => /Geist/.test(f)))
  check('no console errors', errors.length === 0, errors.join('|'))
  await browser.close()
}

{ // ───── contexts present: labels, switches (default OFF), sync with chips, payloads, "what's sent", Clear
  const { browser, page } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); const bodies = await stubChat(page); await withContexts(page)
  const aside = page.getByRole('complementary', { name: 'Context and memory' }), chips = page.getByRole('group', { name: 'Attached context' })
  const tw = aside.getByRole('switch', { name: 'Attach Twin results to my messages' }), mk = aside.getByRole('switch', { name: 'Attach Marketplace comparison to my messages' })
  const at = await aside.innerText()
  check('each Twin/Marketplace item carries "' + CALC + '" (2 labels) + "Demo products" badge + comparison names', (at.split(CALC).length - 1) === 2 && at.includes('Rainy Day Savings vs Flexible Savings') && at.includes('Demo data') && at.includes('Ending value ' + '$' + Math.round(sim.hypothetical.ending_value).toLocaleString('en-US')))
  check('attach switches default OFF and say so', (await tw.getAttribute('aria-checked')) === 'false' && (await mk.getAttribute('aria-checked')) === 'false' && at.includes('Attach to my messages · off'))
  check('each item has See exactly what’s sent, Clear and a link back', (await aside.getByRole('button', { name: /See exactly what/ }).count()) === 2 && (await aside.getByRole('button', { name: /^Clear/ }).count()) === 2 && (await aside.getByRole('link', { name: /Open Financial Twin/ }).count()) === 1 && (await aside.getByRole('link', { name: /Open Marketplace/ }).count()) === 1)
  // ordinary message with switches off → no context; one-shot card still attaches
  const ta = page.getByLabel('Message', { exact: true }); await ta.fill('What is APR?'); await ta.press('Enter'); await page.waitForFunction(() => document.querySelectorAll('[data-msg="assistant"]').length === 1)
  check('switches OFF: an ordinary question carries no scenario_results / compare', !bodies[0].scenario_results && !bodies[0].compare)
  // switch ↔ chip, both directions; payload follows
  await tw.click(); await page.waitForTimeout(120)
  check('Twin switch ON → composer chip pressed, text "on", status line lists Twin results', (await chips.getByRole('button', { name: /Twin results/ }).getAttribute('aria-pressed')) === 'true' && (await aside.innerText()).includes('Attach to my messages · on') && (await page.locator('[data-testid=next-includes]:visible').innerText()).includes('Twin results'))
  await ta.fill('Tell me about my scenario'); await ta.press('Enter'); await page.waitForFunction(() => document.querySelectorAll('[data-msg="assistant"]').length === 2)
  check('Twin switch ON → ordinary question carries scenario_results (backend ending value)', bodies[1].scenario_results?.results?.hypothetical?.ending_value === sim.hypothetical.ending_value && !bodies[1].compare)
  await chips.getByRole('button', { name: /Twin results/ }).click(); await page.waitForTimeout(120); check('chip OFF → switch OFF (two-way)', (await tw.getAttribute('aria-checked')) === 'false')
  await mk.click(); await ta.fill('Compare them'); await ta.press('Enter'); await page.waitForFunction(() => document.querySelectorAll('[data-msg="assistant"]').length === 3)
  check('Marketplace switch ON → carries compare ids, no scenario', JSON.stringify(bodies[2].compare) === JSON.stringify({ a: 'sav-rainy', b: 'sav-flex' }) && !bodies[2].scenario_results)
  await tw.click(); const st = await page.locator('[data-testid=next-includes]:visible').innerText(); check('status line with both: "Twin results, Marketplace comparison"', st.includes('Twin results, Marketplace comparison'), st)
  await tw.click(); await mk.click()
  // what's sent
  await aside.getByRole('button', { name: /See exactly what/ }).first().click()
  const sent = await aside.locator('#sent-twin').innerText()
  check('Twin "See exactly what’s sent" lists the exact backend figures (ending value, contributions, fees, risk values)', [usd2(sim.hypothetical.ending_value), usd2(sim.hypothetical.total_contributions), usd2(sim.hypothetical.modeled_growth), usd2(sim.fee_impact.cost_of_fees), usd2(sim.risk_scenarios.downside.ending_value), usd2(sim.risk_scenarios.upside.ending_value), '10 years'].every((x) => sent.includes(x)), sent.replace(/\n/g, ' ').slice(0, 120))
  await aside.getByRole('button', { name: /See exactly what/ }).last().click(); await aside.locator('#sent-compare table, #sent-compare dl').first().waitFor()
  const sc = await aside.locator('#sent-compare').innerText()
  check('Marketplace "See exactly what’s sent" shows the ids and the API comparison values (4.00% vs 3.80%)', sc.includes('sav-rainy') && sc.includes('sav-flex') && cmpApi.products.every((p) => sc.includes(p.apy_pct.toFixed(2) + '%')) && sc.includes('Variable APY'), sc.replace(/\n/g, ' ').slice(0, 140))
  // Clear
  await aside.getByRole('button', { name: 'Clear Twin results' }).click(); await page.waitForTimeout(200)
  check('Clear Twin results → item becomes the empty state; switch + composer chip disappear; flag off', (await aside.innerText()).includes('No scenario yet') && (await aside.getByRole('switch', { name: /Attach Twin/ }).count()) === 0 && (await chips.getByRole('button', { name: /Twin results/ }).count()) === 0)
  await page.getByRole('button', { name: 'New conversation' }).click(); await page.waitForTimeout(250)
  check('…and the welcome Twin card is gone, the dashed "run a scenario" card is back', (await page.locator('[data-suggestion="twin"]').count()) === 0 && (await page.locator('[data-suggestion-link="/twin"]').count()) === 1)
  await aside.getByRole('button', { name: 'Clear Marketplace comparison' }).click(); await page.waitForTimeout(200)
  check('Clear Marketplace comparison → empty state, chip and card gone', (await aside.innerText()).includes('No comparison yet') && (await chips.getByRole('button', { name: /Marketplace comparison/ }).count()) === 0 && (await page.locator('[data-suggestion="compare"]').count()) === 0)
  check('status line back to "No app data" (profile not shared)', (await page.locator('[data-testid=next-includes]:visible').innerText()).includes('No app data'))
  await aside.getByRole('link', { name: /Open Financial Twin/ }).click(); await page.waitForURL('**/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1600)
  await nav(page, 'AI Companion'); await page.getByRole('heading', { name: 'AI Companion' }).waitFor()
  check('link back to the Twin works and the Twin result returns once it recalculates', (await page.getByRole('complementary', { name: 'Context and memory' }).innerText()).includes('Ending value'))
  await browser.close()
}

{ // ───── Memory card (stubbed): switch, count, Delete, Refresh, loading / error / empty
  const { browser, page } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await stubChat(page)
  let list = [{ id: 'm1', content: 'User is in the early-career life stage.' }, { id: 'm2', content: 'User’s goal is investing.' }, { id: 'm3', content: 'Prefers short explanations.' }], gets = 0, deleted = [], delay = 1200, mode = 'ok'
  await page.route('**/api/memory', async (r) => { gets++; if (delay) await new Promise((x) => setTimeout(x, delay)); if (mode === 'down') return r.abort(); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ memories: list }) }) })
  await page.route('**/api/memory/*', async (r) => { deleted.push(decodeURIComponent(r.request().url().split('/').pop())); list = list.filter((m) => m.id !== deleted.at(-1)); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ deleted: true }) }) })
  await page.goto(BASE + '/companion'); const aside = page.getByRole('complementary', { name: 'Context and memory' })
  await aside.getByTestId('memory-loading').waitFor({ timeout: 3000 }); check('loading: skeleton rows while /api/memory is pending', await aside.getByTestId('memory-loading').isVisible())
  await aside.getByTestId('memory-count').waitFor({ timeout: 5000 }); delay = 0
  check('count badge = number of retained memories (3) and all rows listed', (await aside.getByTestId('memory-count').innerText()) === '3' && (await aside.locator('ul[aria-label="Retained memories"] li').count()) === 3 && (await aside.innerText()).includes('Prefers short explanations.'))
  const ms = aside.getByRole('switch', { name: 'Let Backboard remember learning context across conversations' })
  check('master switch reflects the saved setting (off by default)', (await ms.getAttribute('aria-checked')) === 'false'); await ms.click(); check('master switch on → saved (mb.memory)', (await page.evaluate(() => localStorage.getItem('mb.memory'))) === 'true' && (await ms.getAttribute('aria-checked')) === 'true'); await ms.click()
  await aside.getByRole('button', { name: 'Delete memory' }).nth(1).click(); await page.waitForFunction(() => document.querySelector('[data-testid=memory-count]')?.textContent === '2')
  check('per-memory Delete calls DELETE /api/memory/{id} and the count drops to 2', deleted.join() === 'm2' && !(await aside.innerText()).includes('goal is investing'), deleted.join())
  list.push({ id: 'm4', content: 'Added elsewhere.' }); const g0 = gets; await aside.getByRole('button', { name: 'Refresh' }).click(); await page.waitForFunction(() => document.querySelector('[data-testid=memory-count]')?.textContent === '3')
  check('Refresh re-fetches /api/memory and shows the new memory', gets === g0 + 1 && (await aside.innerText()).includes('Added elsewhere.'))
  mode = 'down'; await aside.getByRole('button', { name: 'Refresh' }).click(); await aside.getByText('Memory unavailable').waitFor()
  const et = await aside.innerText(); check('error: "Memory unavailable" with a friendly message + Retry', et.includes('Memory unavailable') && /Can’t reach the MoneyBridge backend/.test(et) && (await aside.getByRole('button', { name: 'Retry' }).count()) === 1)
  mode = 'ok'; await aside.getByRole('button', { name: 'Retry' }).click(); await aside.getByTestId('memory-count').waitFor(); check('Retry recovers', (await aside.getByTestId('memory-count').innerText()) === '3')
  list = []; await aside.getByRole('button', { name: 'Refresh' }).click(); await aside.getByText('Memory is off').waitFor(); check('empty + memory OFF: "Memory is off … Nothing is retained now."', (await aside.innerText()).includes('Nothing is retained now.') && (await aside.getByTestId('memory-count').innerText()) === '0')
  await ms.click(); await aside.getByText('Nothing retained yet').waitFor(); check('empty + memory ON: "Nothing retained yet"', true)
  await browser.close()
}

for (const w of [1024, 768, 390]) { // ───── responsive: panel ≥1024; collapsible section below
  const { browser, page } = await launch({ width: w, height: 844 })
  await page.goto(BASE); await seed(page); const bodies = await stubChat(page); await withContexts(page)
  const ov = async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  check(`${w}px: no horizontal overflow`, (await ov()) <= 1)
  if (w >= 1024) {
    check('1024px: right panel visible, collapsible section hidden', await page.getByRole('complementary', { name: 'Context and memory' }).isVisible() && !(await page.getByTestId('context-section').isVisible()))
  } else {
    const sec = page.getByTestId('context-section'), toggle = sec.getByRole('button', { name: /Context & memory/ })
    check(`${w}px: right panel hidden; "Context & memory" section visible under the header`, !(await page.getByRole('complementary', { name: 'Context and memory' }).isVisible()) && await sec.isVisible() && await toggle.isVisible())
    const hb = await page.getByRole('heading', { level: 1 }).boundingBox(), sb = await sec.boundingBox(); check(`${w}px: section sits directly under the chat header`, sb.y > hb.y && sb.y - (hb.y + hb.height) < 30)
    check(`${w}px: closed by default (aria-expanded=false), body not rendered`, (await toggle.getAttribute('aria-expanded')) === 'false' && (await page.locator('#context-section-body').count()) === 0)
    check(`${w}px: chip strip visible and says "No app data"`, (await sec.getByRole('list', { name: 'In use' }).innerText()).includes('No app data'))
    await page.getByRole('group', { name: 'Attached context' }).getByRole('button', { name: /Profile/ }).click(); await page.getByRole('group', { name: 'Attached context' }).getByRole('button', { name: /Twin results/ }).click(); await page.waitForTimeout(150)
    const strip = await sec.getByRole('list', { name: 'In use' }).innerText(); check(`${w}px: chip strip updates live ("Profile", "Twin results")`, strip.includes('Profile') && strip.includes('Twin results') && !strip.includes('No app data'), strip.replace(/\n/g, ' | '))
    await page.getByRole('switch', { name: /Memory/ }).count()
    const tBefore = (await page.getByRole('heading', { name: /How can I/ }).boundingBox()).height + (await page.locator('ul[aria-label="Suggestions"]').boundingBox()).y
    await toggle.click(); await page.waitForTimeout(250)
    const body = page.locator('#context-section-body'), bt = await body.innerText()
    check(`${w}px: opening shows itemised context, labels, switches, status line and Memory inline (no dialog)`, (await toggle.getAttribute('aria-expanded')) === 'true' && ['Your profile', 'Financial Twin results', CALC, 'Next message will include: Profile, Twin results', 'Retained memories', 'Balances and account data are never sent'].every((x) => bt.includes(x)) && (await page.getByRole('dialog').count()) === 0)
    check(`${w}px: switches inside the section are bound to the same flags (Twin switch is ON because the chip was)`, (await body.getByRole('switch', { name: 'Attach Twin results to my messages' }).getAttribute('aria-checked')) === 'true')
    const open = await sec.boundingBox(); check(`${w}px: section scrolls inside itself and leaves room for the composer`, open.height < 844 * 0.5 && (await page.getByLabel('Message', { exact: true }).isVisible()), String(Math.round(open.height)))
    await body.getByRole('switch', { name: 'Attach Twin results to my messages' }).click(); await page.waitForTimeout(150)
    check(`${w}px: toggling inside the section updates the chip strip and composer chip`, !(await sec.getByRole('list', { name: 'In use' }).innerText()).includes('Twin results') && (await page.getByRole('group', { name: 'Attached context' }).getByRole('button', { name: /Twin results/ }).getAttribute('aria-pressed')) === 'false')
    check(`${w}px: no horizontal overflow with the section open`, (await ov()) <= 1)
    await toggle.click(); await page.waitForTimeout(200); check(`${w}px: closing hides the body again`, (await page.locator('#context-section-body').count()) === 0)
    await toggle.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(150); check(`${w}px: section toggles from the keyboard`, (await toggle.getAttribute('aria-expanded')) === 'true')
  }
  await browser.close()
}
