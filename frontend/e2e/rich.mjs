// Rich renderer: headings, one-line list items, merged lone markers. Stubbed replies, in the Twin AI panel and in the Companion.
import { launch, check, BASE } from './lib.mjs'
const REPLY = [
  '### Investment Setup', '', '•', 'Initial Investment: You start with **$12,000**.', '•', 'Duration: 10 years.', '',
  '## Risk Scenarios', '', '1.', 'Downside (2% Return): **$54,086.97**', '2.', 'Base (6% Return): $70,466.5', '- Plain dash item on one line', '* Star item on one line', '',
  '#### Fourth-level heading', 'A normal paragraph with **bold** text.', '<script>window.__x=1</script> not html',
].join('\n')
const stub = (page) => page.route('**/api/chat', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: REPLY, thread_id: 't', assistant_id: 'a', context_used: ['financial_twin_results'] }) }))
const seed = (page) => page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })

async function verify(page, scope, label) {
  const heads = await scope.locator('h4').allInnerTexts()
  check(`${label}: ###/##/#### become subheadings (no raw #)`, heads.join('|') === 'Investment Setup|Risk Scenarios|Fourth-level heading', heads.join('|'))
  const t = await scope.innerText()
  check(`${label}: no raw "###" or "**" left`, !/#{2,}/.test(t) && !t.includes('**'))
  check(`${label}: bullets are real <ul><li> (3 groups of items: 2 + 2 dash/star)`, (await scope.locator('ul > li').count()) === 4 && (await scope.locator('ol > li').count()) === 2)
  const fw = await scope.evaluate((root) => [...root.querySelectorAll('li')].map((li) => { const [m, c] = li.querySelectorAll(':scope > span'); const a = m.getBoundingClientRect(), b = c.getBoundingClientRect(); return { sameLine: Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)) < b.height, text: li.innerText.replace(/\s+/g, ' ').trim() } }))
  check(`${label}: marker and text sit on one line in every item`, fw.length === 6 && fw.every((x) => x.sameLine), fw.map((x) => x.text).join(' || '))
  check(`${label}: items read "• Initial Investment: …" and "1. Downside …"`, fw[0].text.startsWith('• Initial Investment') && fw[2].text.startsWith('1. Downside') && fw[3].text.startsWith('2. Base'))
  check(`${label}: **bold** rendered as <strong>`, (await scope.locator('strong').allInnerTexts()).join('|').includes('$12,000') && (await scope.locator('strong').allInnerTexts()).join('|').includes('$54,086.97'))
  check(`${label}: HTML in the reply is shown as text, not executed`, (await scope.innerText()).includes('<script>') && (await scope.page().evaluate(() => window.__x)) === undefined)
}

{
  const { browser, page, errors } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await stub(page)
  await page.goto(BASE + '/twin'); await page.getByRole('region', { name: 'Summary' }).waitFor(); await page.waitForTimeout(1000)
  await page.getByRole('region', { name: 'Summary' }).getByRole('button', { name: 'Explain This Scenario' }).click(); await page.getByTestId('ai-reply').waitFor()
  await verify(page, page.getByTestId('ai-reply'), 'AI panel')
  await page.getByRole('button', { name: 'Continue in AI Companion' }).click(); await page.waitForURL('**/companion'); await page.getByText('Investment Setup').first().waitFor()
  const bubble = page.locator('div.bg-slate-100').last()
  await verify(page, bubble, 'Companion')
  await page.screenshot({ path: process.env.SHOT })
  check('no console errors', errors.length === 0, errors.join('|'))
  await browser.close()
}
{ // narrow screen: still one line per item, no overflow
  const { browser, page } = await launch({ width: 390, height: 844 })
  await page.goto(BASE); await seed(page); await stub(page); await page.goto(BASE + '/companion'); await page.getByLabel('Message').fill('hi'); await page.getByRole('button', { name: 'Send' }).click(); await page.getByText('Investment Setup').first().waitFor()
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); check('390px Companion: no horizontal overflow with lists', ov <= 1, String(ov))
  await browser.close()
}
