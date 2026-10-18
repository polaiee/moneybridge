// Companion Pass 1: header, welcome + suggestion cards, thread/messages, composer + context chips, full-height layout.
// /api/chat is stubbed here (request shapes + rendering); the live Backboard hand-off is checked at the end and in cp4.
import { launch, check, BASE } from './lib.mjs'
const seed = (page, goals = ['emergency_savings', 'investing', 'learning_etfs']) => page.evaluate((g) => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: g, dataSetup: 'demo' })) }, goals)
const REPLY = '### Quick answer\n\n•\nFirst point with **bold**.\n•\nSecond point.\n\nA closing sentence.'
const stub = async (page, state = { fail: 0 }) => { const bodies = []; await page.route('**/api/chat', async (r) => { bodies.push(JSON.parse(r.request().postData())); if (state.fail > 0) { state.fail--; return r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ detail: 'Backboard 500: boom' }) }) } await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: REPLY, thread_id: 't-1', assistant_id: 'a-1', context_used: bodies.at(-1).scenario_results ? ['financial_twin_results'] : bodies.at(-1).compare ? ['marketplace_comparison'] : [] }) }) }); return bodies }
const nav = (page, name) => page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name }).click()
const toTwin = async (page) => { await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200) }
const apiTwin = await (await fetch('http://127.0.0.1:8000/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: { initial_investment: 12000, monthly_contribution: 300, years: 10, gross_return_pct: 6, holdings: [{ name: 'Demo US Equity ETF', weight_pct: 60, expense_ratio_pct: 0.05 }, { name: 'Demo International ETF', weight_pct: 40, expense_ratio_pct: 0.2 }] } }) })).json()
const $ = (n) => '$' + Math.round(n).toLocaleString('en-US')

{ // ───── welcome state + layout (1440)
  const { browser, page, errors } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); const bodies = await stub(page)
  await page.goto(BASE + '/companion'); await page.getByRole('heading', { name: 'AI Companion' }).waitFor(); await page.waitForTimeout(600)
  check('h1 "AI Companion" with "via Backboard"; one New conversation control; no History control', (await page.getByRole('heading', { level: 1 }).innerText()) === 'AI Companion' && await page.getByText('via Backboard').isVisible() && (await page.getByRole('button', { name: 'New conversation' }).count()) === 1 && (await page.getByRole('button', { name: /history/i }).count()) === 0)
  const t = await page.locator('main').innerText()
  check('timeless greeting "Hi, Alex" + "How can I help you today?" + promise line', t.includes('Hi, Alex') && /How can I\s+help\s+you today\?/.test(t) && t.includes('I don’t calculate, predict or give advice'))
  check('"help" is lilac', (await page.getByText('help', { exact: true }).first().evaluate((e) => getComputedStyle(e).color)) === 'rgb(107, 85, 181)')
  const cards = page.locator('[data-suggestion]'), links = page.locator('[data-suggestion-link]')
  check('suggestion cards: goal starters from the profile (emergency fund, diversification, ETF expense ratio)', ['What is an emergency fund', 'What does diversification mean?', 'What is an ETF expense ratio'].every((x) => t.includes(x)))
  check('no Twin card or Marketplace card without that context; dashed "go run one" cards shown instead', (await page.locator('[data-suggestion="twin"]').count()) === 0 && (await page.locator('[data-suggestion="compare"]').count()) === 0 && (await links.count()) === 2)
  check('at most six cards in total, 3 across in the 720px column', (await cards.count()) + (await links.count()) <= 6)
  const tops = await page.locator('ul[aria-label="Suggestions"] > li').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top))); check('grid is 3 columns × 2 rows', new Set(tops).size === 2 && tops.filter((x) => x === tops[0]).length === 3, tops.join(','))
  // layout: page doesn't scroll, composer docked, centered 720
  const m = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight }))
  check('desktop page does not scroll (full-height app screen)', m.sh <= m.ch + 1, JSON.stringify(m))
  const chat = await page.locator('section', { has: page.getByRole('heading', { name: 'AI Companion' }) }).first().boundingBox(), comp = await page.getByLabel('Message', { exact: true }).locator('xpath=ancestor::div[contains(@class,"max-w-[720px]")][1]').boundingBox(), panel = await page.getByRole('complementary', { name: 'Context and memory' }).boundingBox()
  check('chat column cols 1–8 (≈ 848px), panel to its right', Math.abs(chat.width - 848) < 14 && panel.x > chat.x + chat.width, `${Math.round(chat.width)}px`)
  check('composer is docked at the bottom of the chat card and 720px wide', comp.width <= 722 && Math.abs((chat.y + chat.height) - (comp.y + comp.height)) < 40 && Math.abs((comp.x + comp.width / 2) - (chat.x + chat.width / 2)) < 2, `${Math.round(comp.width)}px, bottom gap ${Math.round(chat.y + chat.height - comp.y - comp.height)}`)
  // clicking a goal card sends the starter with no app context
  await page.locator('[data-suggestion="g-investing"]').click(); await page.locator('[data-msg="assistant"]').first().waitFor()
  check('goal card posts the starter with NO scenario_results / compare', bodies.length === 1 && bodies[0].message.startsWith('What does diversification mean?') && !bodies[0].scenario_results && !bodies[0].compare, JSON.stringify(Object.keys(bodies[0])))
  check('welcome is replaced by the thread after sending', (await page.locator('[data-suggestion]').count()) === 0 && (await page.getByRole('log', { name: 'Conversation' }).isVisible()))
  check('no console errors', errors.length === 0, errors.join('|'))
  await browser.close()
}

{ // ───── messages: differentiation, Rich, Used: badges, links back, Copy, Regenerate, Retry, composer
  const { browser, page } = await launch({ width: 1440, height: 900 })
  await page.addInitScript(() => { window.__copied = null; Object.defineProperty(navigator, 'clipboard', { value: { writeText: (t) => { window.__copied = t; return Promise.resolve() } }, configurable: true }) })
  await page.goto(BASE); await seed(page); const state = { fail: 0 }; const bodies = await stub(page, state)
  await toTwin(page); await nav(page, 'AI Companion'); await page.getByRole('heading', { name: 'AI Companion' }).waitFor()
  // Twin card appears now and carries the stored backend number + the calculated label
  const twinCard = page.locator('[data-suggestion="twin"]'); const tc = await twinCard.innerText()
  check('Twin card appears (preview = backend ending value) with "Calculated by MoneyBridge"', tc.includes('Ending value ' + $(apiTwin.hypothetical.ending_value)) && tc.includes('Calculated by MoneyBridge') && tc.includes('10 years'), tc.replace(/\n/g, ' | '))
  check('Twin card replaces its dashed link card', (await page.locator('[data-suggestion-link="/twin"]').count()) === 0 && (await page.locator('[data-suggestion-link="/marketplace"]').count()) === 1)
  await twinCard.click(); await page.locator('[data-msg="assistant"]').first().waitFor()
  check('Twin card attaches scenario_results for that one message (inputs + results from the backend)', !!bodies[0].scenario_results?.results && bodies[0].scenario_results.results.hypothetical.ending_value === apiTwin.hypothetical.ending_value && /Explain this Financial Twin scenario/.test(bodies[0].message), JSON.stringify(Object.keys(bodies[0])))
  const u = page.locator('[data-msg="user"]').first(), a = page.locator('[data-msg="assistant"]').first()
  const [ub, ab, thread] = [await u.boundingBox(), await a.boundingBox(), await page.getByRole('log').boundingBox()]
  const uBg = await u.locator('> div').evaluate((e) => getComputedStyle(e).backgroundColor), aBg = await a.locator('> div').first().evaluate((e) => getComputedStyle(e).backgroundColor)
  check('user = forest bubble on the right; assistant = lilac surface on the left', uBg === 'rgb(23, 59, 55)' && aBg === 'rgb(245, 242, 252)' && ub.x + ub.width > thread.x + thread.width / 2 && ab.x < thread.x + thread.width / 2, `${uBg} / ${aBg}`)
  const at = await a.innerText()
  check('Rich: heading + one-line list items (marker merged with text)', (await a.locator('h4').innerText()) === 'Quick answer' && (await a.locator('li').count()) === 2 && (await a.locator('li').first().innerText()).replace(/\s+/g, ' ').startsWith('• First point'))
  check('"Used:" badge + Back to Twin link + advice disclaimer', at.includes('Used:') && at.includes('Financial Twin results') && (await a.getByRole('link', { name: /Back to Twin/ }).count()) === 1 && at.includes('Educational explanation, not financial advice.'))
  await a.getByRole('link', { name: /Back to Twin/ }).click(); await page.waitForURL('**/twin'); check('"Back to Twin" navigates to the Twin', true)
  await nav(page, 'AI Companion'); await page.getByRole('log').waitFor()
  await page.getByRole('button', { name: 'Copy answer' }).click(); await page.waitForTimeout(200)
  check('Copy puts the reply text on the clipboard and confirms', (await page.evaluate(() => window.__copied)) === REPLY && (await page.getByRole('button', { name: 'Copied' }).count()) === 1)
  const n0 = bodies.length; await page.getByRole('button', { name: 'Regenerate answer' }).click(); await page.waitForFunction(() => document.querySelectorAll('[data-msg="assistant"]').length === 2)
  check('Regenerate re-sends the same question the same way (scenario attached again)', bodies.length === n0 + 1 && bodies.at(-1).message === bodies[0].message && !!bodies.at(-1).scenario_results)
  // composer: chips, Enter / Shift+Enter, general question has no context
  const chips = page.getByRole('group', { name: 'Attached context' })
  check('composer chips: Profile (off), Twin results (off, default OFF), no Marketplace chip', (await chips.getByRole('button', { name: 'Attach Share profile' }).count()) + (await chips.getByRole('button').count()) >= 2 && (await chips.getByRole('button', { name: 'Attach Twin results' }).getAttribute('aria-pressed')) === 'false' && (await chips.getByText('Marketplace comparison').count()) === 0)
  const ta = page.getByLabel('Message', { exact: true }); await ta.fill('What is APR?'); await ta.press('Shift+Enter'); await ta.type('Second line'); const v = await ta.inputValue()
  check('Shift+Enter inserts a newline (does not send)', v === 'What is APR?\nSecond line' && bodies.length === n0 + 1)
  const h1 = (await ta.boundingBox()).height; await ta.fill('a\nb\nc\nd'); check('textarea auto-grows', (await ta.boundingBox()).height > h1)
  await ta.fill('What is APR?'); await ta.press('Enter'); await page.waitForFunction(() => document.querySelectorAll('[data-msg="assistant"]').length === 3)
  check('Enter sends; ordinary question carries NO Twin context (switch default OFF)', !bodies.at(-1).scenario_results && !bodies.at(-1).compare && (await ta.inputValue()) === '')
  const asst3 = page.locator('[data-msg="assistant"]').last(); check('answer without context says "No app data attached"', (await asst3.innerText()).includes('No app data attached to this answer'))
  await chips.getByRole('button', { name: 'Attach Twin results' }).click(); check('chip toggles the attach flag on', (await chips.getByRole('button', { name: /Twin results: attached/ }).getAttribute('aria-pressed')) === 'true')
  await ta.fill('Follow up on my scenario'); await page.getByRole('button', { name: 'Send' }).click(); await page.waitForFunction(() => document.querySelectorAll('[data-msg="assistant"]').length === 4)
  check('with the Twin chip ON, the next ordinary message carries scenario_results', !!bodies.at(-1).scenario_results?.results)
  await chips.getByRole('button', { name: /Share profile|Profile/ }).first().click(); await ta.fill('And my profile?'); await ta.press('Enter'); await page.waitForFunction(() => document.querySelectorAll('[data-msg="assistant"]').length === 5)
  check('Profile chip shares goals/level (and toggles the real setting)', /User-approved profile/.test(bodies.at(-1).message) && (await page.evaluate(() => localStorage.getItem('mb.shareProfile'))) === 'true')
  check('Send disabled when empty', await page.getByRole('button', { name: 'Send' }).isDisabled())
  // error + Retry
  state.fail = 1; await ta.fill('This one fails'); await ta.press('Enter'); await page.locator('[data-error]').waitFor()
  const et = await page.locator('[data-error]').innerText(); check('error bubble: friendly Backboard message + Retry', /Backboard \(the AI service\)/.test(et) && (await page.getByRole('button', { name: 'Retry' }).count()) === 1, et.replace(/\n/g, ' ').slice(0, 90))
  const nBefore = await page.locator('[data-msg="user"]').count(); await page.getByRole('button', { name: 'Retry' }).click(); await page.waitForFunction((n) => document.querySelectorAll('[data-msg="assistant"][data-error]').length === 0 && document.querySelectorAll('[data-msg="user"]').length === n, nBefore)
  check('Retry replaces the failed turn (no duplicate question) and the answer arrives', (await page.locator('[data-msg="user"]').count()) === nBefore && (await page.locator('[data-error]').count()) === 0 && bodies.at(-1).message.startsWith('This one fails'))
  // New conversation
  await page.getByRole('button', { name: 'New conversation' }).click(); await page.waitForTimeout(300)
  check('New conversation clears the thread and shows the welcome state', (await page.locator('[data-msg]').count()) === 0 && (await page.locator('[data-suggestion]').count()) > 0 && (await page.evaluate(() => localStorage.getItem('mb.thread'))) === 'null')
  await browser.close()
}

{ // ───── Marketplace comparison card + chip; /api/memory + privacy labels still work (temporary panel)
  const { browser, page } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); const bodies = await stub(page)
  await page.goto(BASE + '/marketplace'); await page.getByRole('article').first().waitFor()
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: /Savings/ }).click(); await page.waitForTimeout(500)
  await page.getByRole('article', { name: 'Rainy Day Savings' }).getByRole('button', { name: 'Compare' }).click(); await page.getByRole('article', { name: 'Flexible Savings' }).getByRole('button', { name: 'Compare' }).click()
  await page.getByRole('region', { name: 'Comparison bar' }).getByRole('button', { name: 'Compare' }).click(); await page.getByText('A clearer view, side by side.').waitFor()
  await nav(page, 'AI Companion'); await page.getByRole('heading', { name: 'AI Companion' }).waitFor()
  const mc = page.locator('[data-suggestion="compare"]'); check('Marketplace card appears with the comparison and a "Demo products" tag', (await mc.innerText()).includes('Rainy Day Savings vs Flexible Savings') && (await mc.innerText()).includes('Demo products'))
  await mc.click(); await page.locator('[data-msg="assistant"]').first().waitFor()
  check('Marketplace card posts compare ids (a, b) and no scenario', JSON.stringify(bodies[0].compare) === JSON.stringify({ a: 'sav-rainy', b: 'sav-flex' }) && !bodies[0].scenario_results)
  const a = page.locator('[data-msg="assistant"]').first(); check('answer has "Marketplace comparison" badge and a Back to Marketplace link', (await a.innerText()).includes('Marketplace comparison') && (await a.getByRole('link', { name: /Back to Marketplace/ }).count()) === 1)
  const aside = page.getByRole('complementary', { name: 'Context and memory' }), at = (await aside.innerText()).toLowerCase()
  const wanted = ['Active context', 'Balances and account data are never sent', 'Share my goals and experience level', 'Let Backboard remember learning context', 'Retained memories', 'Refresh']
  check('privacy labels + memory controls still present (temporary panel)', wanted.every((x) => at.includes(x.toLowerCase())), 'missing: ' + wanted.filter((x) => !at.includes(x.toLowerCase())).join(', '))
  const mem = await (await fetch('http://127.0.0.1:8000/api/memory')).json(); check('GET /api/memory responds', Array.isArray(mem.memories))
  await aside.getByRole('button', { name: 'Refresh' }).click(); check('Refresh works (no error shown)', (await aside.getByText('Memory unavailable').count()) === 0)
  await browser.close()
}

for (const w of [1024, 390]) { // ───── responsive
  const { browser, page } = await launch({ width: w, height: 844 })
  await page.goto(BASE); await seed(page); await stub(page); await page.goto(BASE + '/companion'); await page.getByRole('heading', { name: 'AI Companion' }).waitFor(); await page.waitForTimeout(600)
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); check(`${w}px: no horizontal overflow`, ov <= 1, String(ov))
  const chat = await page.locator('section', { has: page.getByRole('heading', { name: 'AI Companion' }) }).first().boundingBox()
  if (w === 1024) {
    const panel = await page.getByRole('complementary', { name: 'Context and memory' }).boundingBox()
    check('1024px: chat cols 1–7 (≈ 511px) beside the panel (≈ 360px)', Math.abs(chat.width - 511) < 16 && panel.x > chat.x + chat.width - 1 && Math.abs(panel.width - 360) < 16, `${Math.round(chat.width)} / ${Math.round(panel.width)}`)
  } else {
    const cols = await page.locator('ul[aria-label="Suggestions"] > li').evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().left))).size)
    check('390px: chat first, composer docked inside the viewport above the tab bar', chat.y < 120 && (await page.getByLabel('Message', { exact: true }).boundingBox()).y + 60 < 844 - 64, `chat top ${Math.round(chat.y)}`)
    check('390px: suggestion cards 2 across', cols === 2, String(cols))
    check('390px: header title on one line + compact "New" button', (await page.getByRole('heading', { level: 1 }).evaluate((e) => e.getBoundingClientRect().height)) < 30 && (await page.getByRole('button', { name: 'New conversation' }).innerText()) === 'New')
    check('390px: the right panel is replaced by the collapsible "Context & memory" section inside the chat card', !(await page.getByRole('complementary', { name: 'Context and memory' }).isVisible()) && await page.getByTestId('context-section').isVisible())
  }
  await browser.close()
}
{ // ───── typography
  const { browser, page } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await stub(page); await page.goto(BASE + '/companion'); await page.getByLabel('Message', { exact: true }).fill('hello'); await page.getByLabel('Message', { exact: true }).press('Enter'); await page.locator('[data-msg="assistant"]').first().waitFor()
  const fonts = await page.evaluate(() => [...new Set([...document.querySelectorAll('main *')].map((e) => getComputedStyle(e).fontFamily))]); check('Geist only on the Companion', fonts.every((f) => /Geist/.test(f)), fonts.length + ' families')
  await browser.close()
}

{ // ───── LIVE Backboard: Twin → Companion hand-off, reply quotes the exact backend ending value
  const { browser, page } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await toTwin(page)
  let body = null; page.on('request', (r) => { if (r.url().endsWith('/api/chat') && r.method() === 'POST') body = JSON.parse(r.postData()) })
  await nav(page, 'AI Companion'); await page.locator('[data-suggestion="twin"]').click()
  await page.locator('[data-msg="assistant"]').first().waitFor({ timeout: 90000 })
  const rep = await page.locator('[data-msg="assistant"]').first().innerText(), end = body.scenario_results.results.hypothetical.ending_value
  const dollars = [...rep.matchAll(/\$\s?([\d,]+(?:\.\d+)?)/g)].map((m) => Number(m[1].replace(/,/g, '')))
  check('LIVE: Twin card → /api/chat carried the backend result', end === apiTwin.hypothetical.ending_value, String(end))
  check('LIVE: Companion reply quotes the exact backend ending value ($' + end + ')', dollars.includes(end), 'amounts: ' + [...new Set(dollars)].slice(0, 8).join(', '))
  check('LIVE: reply is labeled with Financial Twin results + Back to Twin link', rep.includes('Financial Twin results') && (await page.getByRole('link', { name: /Back to Twin/ }).count()) === 1)
  await browser.close()
}
