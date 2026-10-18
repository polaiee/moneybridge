import { launch, check, BASE } from './lib.mjs'
const seed = (page) => page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })) })
{ // backend unreachable
  const { browser, page } = await launch(); await page.goto(BASE); await seed(page)
  await page.route('**/api/**', (r) => r.abort())
  await page.goto(BASE + '/dashboard'); await page.getByRole('alert').waitFor()
  const t = await page.getByRole('alert').innerText()
  check('dashboard: friendly backend-down message + Retry', /Can’t reach the MoneyBridge backend/.test(t) && await page.getByRole('button', { name: 'Retry' }).isVisible(), t.replace(/\n/g, ' '))
  await page.unroute('**/api/**'); await page.getByRole('button', { name: 'Retry' }).click(); await page.getByText('Net worth', { exact: true }).first().waitFor()
  check('retry recovers', true)
  await page.goto(BASE + '/marketplace'); await page.getByRole('article').first().waitFor()
  await page.route('**/api/chat', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ detail: 'Backboard 401: invalid key' }) }))
  await page.goto(BASE + '/companion'); await page.getByLabel('Message', { exact: true }).fill('hello'); await page.getByRole('button', { name: 'Send' }).click()
  await page.getByText(/Backboard \(the AI service\)/).waitFor({ timeout: 5000 }); check('companion: Backboard failure shown inline', true)
  await browser.close()
}
{ // keyboard navigation + focus visibility on the Twin
  const { browser, page } = await launch(); await page.goto(BASE); await seed(page)
  await page.goto(BASE + '/twin'); await page.getByText('Hypothetical ending value').waitFor()
  const seen = new Set(); let ringOk = true
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const d = await page.evaluate(() => { const e = document.activeElement; if (e === document.body) return { id: 'body', ring: true }; const cs = getComputedStyle(e); return { id: e.id || e.getAttribute('aria-label') || e.textContent?.trim().slice(0, 30), ring: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' || !!e.closest('[class*=focus-within]') || e.classList.contains('split-range') } })
    seen.add(d.id); if (!d.ring) { ringOk = false; console.log('  no ring on:', String(d.id).slice(0, 40)) }
  }
  check('keyboard reaches inputs, sliders and Run Simulation', ['initial', 'years', 'monthly', 'gross', 'Run Simulation'].every((k) => seen.has(k)) && [...seen].some((x) => /weight/.test(x)), [...seen].join(' | '))
  check('every focused control shows a focus indicator', ringOk)
  await page.keyboard.press('Shift+Tab'); 
  // arrow keys drive a slider and keep the total at 100
  await page.locator('input[aria-label="Demo US Equity ETF weight"]').focus(); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300); check('slider via keyboard keeps 100% total', await page.getByText('100% / 100%').isVisible())
  await browser.close()
}
