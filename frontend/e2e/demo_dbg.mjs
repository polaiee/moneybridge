// The demo path, live Backboard, nothing stubbed: Onboarding → Dashboard → Twin → Explain (AI panel) → Companion → Marketplace compare → Explain → Companion.
import { launch, check, BASE } from './lib.mjs'
const OUT = process.env.OUT
const { browser, page, errors } = await launch({ width: 1440, height: 900 })
const nav = (name) => page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name }).click()
const shot = async (n) => { if (OUT) await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true }) }
const overflow = async (label) => { const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); check(`${label}: no horizontal overflow`, o <= 1, String(o)) }
const dollars = (t) => [...t.matchAll(/\$\s?([\d,]+(?:\.\d+)?)/g)].map((m) => Number(m[1].replace(/,/g, '')))
const has = async (label, words) => { const t = (await page.locator('main').innerText()).toLowerCase(); const miss = words.filter((w) => !t.includes(w.toLowerCase())); check(`${label}: labels visible (${words.join(', ')})`, miss.length === 0, 'missing: ' + miss.join(', ')) }

await page.goto(BASE); await page.evaluate(() => localStorage.clear()); await page.goto(BASE)
await page.waitForURL('**/onboarding'); await page.waitForTimeout(500); await shot('1-onboarding-welcome'); await overflow('onboarding')
// the instant start
const skip = page.getByRole('button', { name: /Skip onboarding/i }); check('onboarding: a prominent "Skip onboarding · Use demo profile" button exists', await skip.isVisible())
// walk the full flow once (the long way), then test the skip separately
await page.getByRole('button', { name: 'Continue' }).click(); await page.getByRole('button', { name: 'Verify and continue' }).click(); await shot('1b-onboarding-profile')
await page.getByRole('radio', { name: /Early career/ }).click(); await page.getByRole('radio', { name: /Beginner/ }).click(); await page.getByRole('button', { name: 'Continue' }).click()
await page.getByRole('checkbox', { name: /Emergency savings/ }).click(); await page.getByRole('checkbox', { name: /Investing/ }).click(); await shot('1c-onboarding-goals'); await page.getByRole('button', { name: 'Continue' }).click(); await shot('1d-onboarding-journey')
await page.getByRole('button', { name: 'Go to my dashboard' }).click(); await page.waitForURL('**/dashboard')

await page.getByText('Net worth', { exact: true }).first().waitFor(); await page.waitForTimeout(1200); await shot('2-dashboard'); await overflow('dashboard')
await has('dashboard', ['Demo data'])
check('dashboard: net worth $22,000', (await page.locator('main').innerText()).includes('$22,000'))

await nav('Financial Twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
await page.locator('input.split-range').fill('80'); await page.fill('#monthly', '500'); await page.waitForTimeout(1500); await shot('3-twin'); await overflow('twin')
await has('twin', ['Demo data', 'Hypothetical plan', 'Illustrative estimate', 'Illustrative assumption', 'Fee comparison', 'Illustrative scenarios'])
const truth = await (await fetch('http://127.0.0.1:8000/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ scenario: { initial_investment: 12000, monthly_contribution: 500, years: 10, gross_return_pct: 6, holdings: [{ name: 'Demo US Equity ETF', weight_pct: 80, expense_ratio_pct: 0.05 }, { name: 'Demo International ETF', weight_pct: 20, expense_ratio_pct: 0.2 }] } }) })).json()
const end = truth.hypothetical.ending_value
check('twin: ending value equals the backend ($' + Math.round(end) + ')', (await page.getByRole('region', { name: 'Summary' }).innerText()).includes('$' + Math.round(end).toLocaleString('en-US')))

await page.getByRole('region', { name: 'Summary' }).getByRole('button', { name: 'Explain This Scenario' }).click(); await page.getByRole('dialog').waitFor()
await page.getByTestId('ai-reply').waitFor({ timeout: 90000 }); await page.waitForTimeout(400); await shot('4-twin-ai-panel')
const rep = await page.getByTestId('ai-reply').innerText()
check('AI panel reply quotes the exact backend ending value ($' + end + ')', dollars(rep).includes(end), [...new Set(dollars(rep))].slice(0, 8).join(', '))
console.log('--- PANEL RAW ---\n' + rep.slice(0, 1500))
check('AI panel reply is cleanly formatted (no raw ###, **, or lone bullets)', !/#{2,}|\*\*/.test(rep) && !/^\s*[•\-*]\s*$/m.test(rep))
await page.getByRole('button', { name: 'Continue in AI Companion' }).click(); await page.waitForURL('**/companion'); await page.locator('[data-msg="assistant"]').first().waitFor(); await page.waitForTimeout(600); await shot('5-companion'); await overflow('companion')

await nav('Marketplace'); await page.getByRole('article').first().waitFor(); await page.waitForTimeout(600)
await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: /Savings/ }).click(); await page.waitForTimeout(600)
await page.getByRole('article', { name: 'Rainy Day Savings' }).getByRole('button', { name: 'Compare' }).click(); await page.getByRole('article', { name: 'Flexible Savings' }).getByRole('button', { name: 'Compare' }).click()
await page.getByRole('region', { name: 'Comparison bar' }).getByRole('button', { name: 'Compare' }).click(); await page.getByText('A clearer view, side by side.').waitFor(); await page.waitForTimeout(700); await shot('6-marketplace-compare'); await overflow('marketplace')
await has('marketplace', ['Demo Product', 'Demo catalog', 'Illustrative products and rates', 'All providers are fictional'])
await page.getByRole('button', { name: 'Explain with MoneyBridge AI' }).click(); await page.waitForURL('**/companion')
await page.waitForFunction(() => [...document.querySelectorAll('[data-msg="assistant"]')].some((e) => e.innerText.includes('Marketplace comparison')), null, { timeout: 90000 }); await page.waitForTimeout(500); await shot('7-companion-compare')
const last = await page.locator('[data-msg="assistant"]').last().innerText(); const cmp = await (await fetch('http://127.0.0.1:8000/api/marketplace/compare', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 'sav-rainy', b: 'sav-flex' }) })).json()
const pct = (t) => [...t.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => Number(m[1]))
check('Marketplace reply quotes both exact APYs (4.0% and 3.8%)', cmp.products.every((p) => pct(last).includes(p.apy_pct)), pct(last).join(', '))
console.log('--- MKT RAW ---\n' + last.slice(0, 1500))
check('Marketplace reply is cleanly formatted', !/#{2,}|\*\*/.test(last) && !/^\s*[•\-*]\s*$/m.test(last))
check('reply carries "Marketplace comparison" badge + Back to Marketplace link', last.includes('Marketplace comparison') && (await page.getByRole('link', { name: /Back to Marketplace/ }).count()) >= 1)

// refresh resilience
await page.reload(); await page.getByRole('heading', { name: 'AI Companion' }).waitFor(); await page.waitForTimeout(800)
check('refresh on the Companion keeps the profile, the conversation and the contexts', (await page.locator('[data-msg="assistant"]').count()) >= 2 && !page.url().includes('onboarding') && (await page.getByRole('complementary', { name: 'Context and memory' }).innerText()).includes('Rainy Day Savings vs Flexible Savings'))
await page.getByLabel('Message', { exact: true }).fill('In one sentence, what should I remember about fees?'); await page.getByRole('button', { name: 'Send' }).click()
await page.getByText('Thinking…').waitFor().catch(() => {}); await page.getByText('Thinking…').waitFor({ state: 'detached', timeout: 90000 })
check('Companion still answers after a refresh (same thread)', !(await page.locator('[data-error]').count()))
await page.goto(BASE + '/dashboard'); await page.reload(); await page.getByText('Net worth', { exact: true }).first().waitFor(); check('refresh on the Dashboard keeps the demo state', !page.url().includes('onboarding'))

// Settings
await nav('Settings').catch(async () => { await page.goto(BASE + '/settings') }); await page.waitForTimeout(600); await shot('8-settings'); await overflow('settings')
check('no console errors along the whole path', errors.length === 0, errors.join(' | '))
await browser.close()
