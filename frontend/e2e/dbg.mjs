import { launch, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 1440, height: 900 })
await page.goto(BASE); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
await page.route('**/api/chat', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Stub reply for request-shape test.', thread_id: 't1', assistant_id: 'a1', context_used: ['financial_twin_results'] }) }))
await page.getByRole('region', { name: 'Summary' }).getByRole('button', { name: 'Explain This Scenario' }).click(); await page.getByTestId('ai-reply').waitFor()
await page.keyboard.press('Escape'); await page.waitForTimeout(250)
await page.getByRole('region', { name: 'Simulation controls' }).locator('xpath=ancestor::section[1]').getByRole('button', { name: 'Explain This Scenario' }).click(); await page.getByRole('dialog').waitFor()
console.log('reply visible in panel after reopen:', await page.getByTestId('ai-reply').count())
await page.getByRole('button', { name: 'Continue in AI Companion' }).click(); await page.waitForURL('**/companion')
for (const ms of [0, 300, 1000]) { await page.waitForTimeout(ms); console.log(ms, 'msgs=', await page.locator('[data-msg]').count(), 'welcome=', await page.locator('[data-suggestion]').count(), 'hasStub=', (await page.locator('main').innerText()).includes('Stub reply for request-shape test.')) }
console.log('chat in LS:', (await page.evaluate(() => localStorage.getItem('mb.chat'))).slice(0, 200))
await browser.close()
