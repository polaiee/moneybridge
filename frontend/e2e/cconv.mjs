import { launch, BASE } from './lib.mjs'
const REPLY = '### Investment Setup\n\n•\nInitial Investment: You start with **$12,000**.\n•\nDuration: 10 years at a 6% gross return.\n\n### Risk Scenarios\n\n1.\nDownside (2% return): **$54,086.97**\n2.\nBase (6% return): $70,466.5\n3.\nUpside (9% return): $86,791.49\n\nThese are hypothetical illustrations, not predictions.'
const { browser, page } = await launch({ width: +process.argv[2], height: +process.argv[3] })
await page.goto(BASE); await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
await page.route('**/api/chat', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: REPLY, thread_id: 't', assistant_id: 'a', context_used: ['financial_twin_results'] }) }))
await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1200)
await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'AI Companion' }).click(); await page.locator('[data-suggestion="twin"]').click(); await page.locator('[data-msg="assistant"]').first().waitFor()
await page.getByLabel('Message', { exact: true }).fill('Which scenario is the riskiest?'); await page.getByLabel('Message', { exact: true }).press('Enter'); await page.waitForTimeout(900)
await page.getByRole('group', { name: 'Attached context' }).getByRole('button', { name: 'Attach Twin results' }).click()
await page.screenshot({ path: process.argv[4] }); await browser.close()
