// Pass 1: app shell (rail, top bar, bottom tabs), hero card, KPI tiles.
import { launch, check, BASE } from './lib.mjs'
const seed = (page) => page.evaluate(() => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing'], dataSetup: 'demo' })) })
const api = await (await fetch('http://127.0.0.1:8000/api/dashboard')).json()
const $ = (n) => '$' + n.toLocaleString('en-US')

// ───── desktop 1440
{
  const { browser, page, errors } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/dashboard'); await page.getByText('Net worth', { exact: true }).first().waitFor()
  const rail = await page.locator('aside').first().boundingBox()
  check('rail is 72px wide', Math.round(rail.width) === 72, String(rail.width))
  const nav = page.getByRole('navigation', { name: 'Primary' })
  for (const [short, full] of [['Dashboard', 'Dashboard'], ['Twin', 'Financial Twin'], ['AI', 'AI Companion'], ['Market', 'Marketplace']])
    check(`rail item "${short}" (aria "${full}")`, await nav.getByRole('link', { name: full }).getByText(short, { exact: true }).isVisible())
  const bg = await nav.getByRole('link', { name: 'Dashboard' }).locator('span').first().evaluate((e) => getComputedStyle(e).backgroundColor)
  check('active item is a lime pill', bg === 'rgb(200, 234, 84)', bg)
  check('no profile card / New conversation / banner in shell', (await page.getByRole('button', { name: 'New conversation' }).count()) === 0 && (await page.locator('aside').first().getByText('Demo persona').count()) === 0)
  check('bottom tab bar hidden on desktop', !(await page.locator('nav[aria-label="Primary"]').last().isVisible().catch(() => false)) || (await page.locator('nav[aria-label="Primary"]').count()) === 2)
  check('Demo-mode pill visible', await page.getByText('Demo mode', { exact: true }).first().isVisible())
  // search
  await page.keyboard.press('/'); await page.waitForTimeout(100); check('"/" focuses search', await page.getByRole('combobox').evaluate((e) => e === document.activeElement))
  await page.getByRole('combobox').fill('rainy'); await page.getByRole('option', { name: /Rainy Day Savings/ }).waitFor()
  await page.keyboard.press('Enter'); await page.waitForURL('**/marketplace?category=savings')
  check('search jumps to the product category', true)
  await page.goto(BASE + '/dashboard'); await page.getByText('Net worth', { exact: true }).first().waitFor()
  await page.getByRole('combobox').fill('brokerage'); await page.getByRole('option', { name: /Brokerage/ }).waitFor({ timeout: 5000 }); check('search finds a demo account', await page.getByRole('option', { name: /Brokerage/ }).isVisible()); await page.keyboard.press('Escape')
  // period
  await page.getByRole('button', { name: /Period:/ }).click()
  const opts = page.getByRole('option')
  check('period menu: one selectable + disabled others with reason', (await opts.filter({ hasText: 'No history in demo data' }).count()) === 3 && (await page.locator('[aria-disabled="true"]').count()) === 3)
  await page.keyboard.press('Escape')
  // hero + tiles
  const t = await page.locator('main').innerText()
  check('hero: net worth $22,000 + Demo data badge', t.includes($(api.net_worth)) && (await page.getByText('Demo data', { exact: true }).first().isVisible()))
  check('hero: Assets / Liabilities / Cash row', t.includes($(api.total_assets)) && t.includes($(api.total_liabilities)) && t.includes('$11,500'))
  check('hero: no sparkline placeholder', !t.includes('balance history will chart'))
  const ticks = await page.locator('section.on-dark svg line[stroke-linecap="round"]').count(); check('composition ring has 100 ticks', ticks === 100, String(ticks))
  await page.locator('section.on-dark svg line[stroke-linecap="round"]').nth(2).hover({ force: true }); await page.waitForTimeout(250)
  check('hovering the ring isolates a segment (center shows it)', (await page.locator('main').innerText()).toLowerCase().includes('of gross'))
  for (const [label, v] of [['Total assets', api.total_assets], ['Liabilities', api.total_liabilities], ['Monthly surplus', api.cash_flow.monthly_surplus]]) {
    const tile = page.locator('section', { has: page.getByText(label, { exact: true }) }).filter({ hasText: 'Demo data ·' }).first()
    const tt = await tile.innerText().catch(() => '')
    check(`KPI tile "${label}" shows ${$(v)} and a visible "Demo data" caption`, tt.includes($(v)) && tt.includes('Demo data'))
  }
  const hero = await page.locator('section.on-dark').boundingBox(), tile = await page.locator('section', { hasText: 'Total assets' }).filter({ hasText: 'Demo data ·' }).first().boundingBox()
  check('hero is cols 1–6 and taller than a tile; tiles sit to its right', tile.x > hero.x + hero.width && hero.height > tile.height * 2, `hero ${Math.round(hero.width)}×${Math.round(hero.height)} tile ${Math.round(tile.width)}×${Math.round(tile.height)}`)
  check('no console errors', errors.length === 0, errors.join('|'))
  await browser.close()
}
// ───── tablet 1024 + mobile 390
for (const w of [1024, 390]) {
  const { browser, page } = await launch({ width: w, height: 844 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/dashboard'); await page.getByText('Net worth', { exact: true }).first().waitFor()
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  check(`${w}px: no horizontal overflow`, ov <= 1, String(ov))
  check(`${w}px: Demo pill visible`, await page.getByText(w < 480 ? 'Demo' : 'Demo mode', { exact: true }).first().isVisible())
  const railVisible = await page.locator('aside').first().isVisible()
  if (w === 390) {
    check('390px: rail hidden, bottom tab bar shown', !railVisible && await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Financial Twin' }).isVisible())
    const bar = await page.getByRole('navigation', { name: 'Primary' }).boundingBox(); check('390px: tab bar is 64px tall at the bottom', Math.round(bar.height) === 64 && Math.round(bar.y + bar.height) === 844, JSON.stringify(bar))
    check('390px: More → Settings', await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Settings' }).getByText('More').isVisible())
    const row = await page.locator('div.snap-x').evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth })); check('390px: KPI tiles scroll inside their own row', row.sw > row.cw, JSON.stringify(row))
    await page.getByRole('button', { name: 'Search' }).click(); check('390px: search opens full-width', await page.getByRole('combobox').isVisible())
  } else check('1024px: rail shown', railVisible)
  await browser.close()
}
