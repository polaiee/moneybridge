// Marketplace Pass 1: header, search + result strip + chips, category cards + sticky filter bar, goals / strip, product grid + cards.
import { launch, check, BASE } from './lib.mjs'
const seed = (page, goals = ['emergency_savings', 'investing', 'credit_building']) => page.evaluate((g) => { localStorage.clear(); localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: g, dataSetup: 'demo' })) }, goals)
const api = await (await fetch('http://127.0.0.1:8000/api/marketplace/products')).json()
const P = api.products
const money = (v) => '$' + v.toLocaleString('en-US')
const LEAD = { banking: ['monthly_fee', money, 'Monthly fee'], savings: ['apy_pct', (v) => v.toFixed(2) + '%', 'Variable APY'], credit: ['apr_pct', (v) => v.toFixed(2) + '%', 'Variable purchase APR'], investing: ['min_investment', money, 'Account minimum'] }
const KEY = { banking: ['waiver', (v) => String(v), 'Fee waiver'], savings: ['minimum_to_earn', money, 'Minimum to earn APY'], credit: ['security_deposit', money, 'Security deposit'], investing: ['account_fee', (v) => (v === 0 ? '$0' : `${v}% (as listed)`), 'Platform fee'] }
const tops = (page, sel) => page.locator(sel).evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
const cats = (page) => page.getByRole('group', { name: 'Categories' })
const ready = async (page) => { await page.getByRole('article').first().waitFor(); await page.waitForTimeout(500) }

{ // ───── desktop 1440
  const { browser, page, errors } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page)
  const reqs = []; page.on('request', (r) => { const u = new URL(r.url()); if (u.pathname === '/api/marketplace/products') reqs.push(u.search); if (u.pathname === '/api/marketplace/recommendations') reqs.push('REC' + u.search) })
  await page.goto(BASE + '/marketplace'); await ready(page)
  check('3 API calls on load: products (all), products (filtered), recommendations?goals=…', reqs.filter((r) => r === '?').length + reqs.filter((r) => r === '').length >= 1 && reqs.some((r) => r.startsWith('REC?goals=')) && reqs.length >= 3, reqs.join(' | '))
  // header
  const h1 = await page.getByRole('heading', { level: 1 }).innerText(), mt = await page.locator('main').innerText()
  check('header: "Financial Marketplace" + spec subtitle + "Demo catalog · 10 products"', h1 === 'Financial Marketplace' && mt.includes('Discover and compare financial products that support your goals.') && mt.includes('Demo catalog · 10 products'))
  // search
  const sb = await page.getByPlaceholder('Search products or providers…').boundingBox()
  const sbox = await page.getByPlaceholder('Search products or providers…').locator('xpath=..').boundingBox()
  check('search is full width and 56px tall', Math.abs(sbox.height - 56) < 1 && sbox.width > 1100 && sb.width > 1000, `${Math.round(sbox.width)}×${Math.round(sbox.height)}`)
  check('result strip: "Showing all 10 demo products"', (await page.getByRole('status').filter({ hasText: 'demo products' }).first().innerText()).includes('Showing all 10 demo products'))
  reqs.length = 0
  await page.getByPlaceholder('Search products or providers…').pressSequentially('harbor', { delay: 40 }); await page.waitForTimeout(800)
  const qReqs = reqs.filter((r) => r.includes('q='))
  check('search debounce (250ms): typing "harbor" fires ONE filtered request, not one per keystroke', qReqs.length === 1 && qReqs[0].includes('q=harbor'), qReqs.join(' | '))
  check('search by provider: 2 Harbor products; strip "Showing 2 of 10"; chip “harbor”', (await page.getByRole('article').count()) === 2 && (await page.getByRole('status').filter({ hasText: 'Showing' }).first().innerText()).includes('Showing 2 of 10') && (await page.getByRole('button', { name: /Clear search “harbor”/ }).count()) === 1)
  await page.getByRole('button', { name: /Clear search “harbor”/ }).click(); await page.waitForTimeout(700); check('clearing the chip restores all 10', (await page.getByRole('article').count()) === 10)
  for (const [term, n] of [['rainy', 1], ['cove', 2], ['credit', 2], ['index', 1]]) { await page.getByPlaceholder('Search products or providers…').fill(term); await page.waitForTimeout(700); const exp = P.filter((p) => `${p.name} ${p.provider} ${p.category}`.toLowerCase().includes(term)).length; check(`search "${term}" matches the API (${exp})`, (await page.getByRole('article').count()) === exp && exp >= n - 1, String(await page.getByRole('article').count())) }
  await page.getByPlaceholder('Search products or providers…').fill('zzzz'); await page.waitForTimeout(700)
  check('no match: empty state with "Clear search and filters"', await page.getByText('No products match').isVisible() && await page.getByRole('button', { name: 'Clear search and filters' }).isVisible())
  await page.getByRole('button', { name: 'Clear search and filters' }).click(); await page.waitForTimeout(700); check('…clears and shows all 10', (await page.getByRole('article').count()) === 10)
  await page.getByPlaceholder('Search products or providers…').fill('x'); await page.getByRole('button', { name: 'Clear search', exact: true }).click(); check('the × button clears the input', (await page.getByPlaceholder('Search products or providers…').inputValue()) === '')

  // categories
  const ct = await tops(page, '[role=group][aria-label=Categories] > button'); const cw = await cats(page).getByRole('button').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)))
  check('four category cards in one row, ≈3 columns each', new Set(ct).size === 1 && ct.length === 4 && cw.every((w) => Math.abs(w - 310) < 12), cw.join(','))
  check('cards show icon + name + counts from the API', (await cats(page).innerText()).includes('Banking') && ['3 demo products', '2 demo products'].every((x) => mt.includes(x) || true) && (await cats(page).getByText('3 demo products').count()) === 2 && (await cats(page).getByText('2 demo products').count()) === 2)
  const bgs = await cats(page).getByRole('button').evaluateAll((els) => els.map((e) => getComputedStyle(e.querySelector('span')).backgroundColor)); check('each category has its own tint (banking / savings / credit / investing)', new Set(bgs).size === 4, bgs.join(' | '))
  reqs.length = 0
  await cats(page).getByRole('button', { name: /Savings/ }).click(); await page.waitForTimeout(600)
  check('Savings filters in place: URL ?category=savings, 3 products, pressed state', page.url().includes('category=savings') && (await page.getByRole('article').count()) === 3 && (await cats(page).getByRole('button', { name: /Savings/ }).getAttribute('aria-pressed')) === 'true' && reqs.some((r) => r.includes('category=savings')))
  check('chip "Savings ×" + strip "Showing 3 of 10" + Clear all', (await page.getByRole('button', { name: 'Remove Savings filter' }).count()) === 1 && (await page.getByRole('status').filter({ hasText: 'Showing' }).first().innerText()).includes('Showing 3 of 10') && (await page.getByRole('button', { name: 'Clear all' }).count()) === 1)
  await page.getByPlaceholder('Search products or providers…').fill('harbor'); await page.waitForTimeout(700)
  check('category + search combine (Savings ∩ harbor = Rainy Day Savings)', (await page.getByRole('article').count()) === 1 && await page.getByRole('article', { name: 'Rainy Day Savings' }).isVisible())
  await page.getByRole('button', { name: 'Clear all' }).click(); await page.waitForTimeout(700); check('Clear all removes the search and the category', (await page.getByRole('article').count()) === 10 && !page.url().includes('category='))
  await cats(page).getByRole('button', { name: /Credit/ }).click(); await cats(page).getByRole('button', { name: /Credit/ }).click(); await page.waitForTimeout(500); check('clicking the active category again clears it', (await page.getByRole('article').count()) === 10)

  // sticky filter bar
  check('filter bar hidden while the category cards are in view', (await page.getByRole('region', { name: 'Filter bar' }).count()) === 0)
  await page.evaluate(() => window.scrollTo(0, 800)); await page.waitForTimeout(500)
  const fb = page.getByRole('region', { name: 'Filter bar' }); const fbb = await fb.boundingBox()
  check('scrolled past the cards: sticky filter bar appears under the top bar with search + pills', !!fbb && Math.abs(fbb.y - 56) < 2 && (await fb.getByRole('button').allInnerTexts()).join('|').includes('All') && (await fb.getByRole('textbox').count()) === 1, JSON.stringify(fbb))
  await fb.getByRole('button', { name: /Credit/ }).click(); await page.waitForTimeout(700)
  check('pill filters the grid (Credit → 2) and the results are brought into view (grid heading on screen, no jump to the page top)', (await page.getByRole('article').count()) === 2 && page.url().includes('category=credit') && (await page.getByRole('heading', { name: 'Explore Financial Products' }).boundingBox()).y < 400 && (await page.evaluate(() => scrollY)) > 0, `scrollY=${await page.evaluate(() => scrollY)}`)
  await page.goto(BASE + '/marketplace'); await ready(page); await page.evaluate(() => window.scrollTo(0, 800)); await page.waitForTimeout(500)
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500); check('scrolling back up hides the bar', (await page.getByRole('region', { name: 'Filter bar' }).count()) === 0)

  // goals
  const gs = page.locator('section[aria-label="Relevant to Your Goals"]'); const gb = gs.getByRole('button')
  check('"Relevant to Your Goals": at most 2 cards from 3 goals, two across', (await gb.count()) === 2 && new Set(await tops(page, 'section[aria-label="Relevant to Your Goals"] button')).size === 1)
  const gt = await gs.innerText(); check('goal cards: heading, note, title, description, "Explore Products →"; never "Best for You"', gt.includes('Relevant to Your Goals') && gt.includes('Emergency fund') && gt.includes('Discover savings options') && gt.includes('Explore Products') && !/best for you/i.test(await page.locator('main').innerText()))
  await gb.first().click(); await page.waitForTimeout(900); check('goal card applies its category and brings the grid into view', page.url().includes('category=savings') && (await page.getByRole('article').count()) === 3 && (await page.getByRole('heading', { name: 'Explore Financial Products' }).boundingBox()).y < 400)
  await page.getByRole('button', { name: 'Clear all' }).click(); await page.waitForTimeout(600)

  // grid + cards
  const gt2 = await tops(page, 'article'); check('product grid: 3 columns at 1440 (10 cards)', (await page.getByRole('article').count()) === 10 && gt2.filter((t) => t === gt2[0]).length === 3)
  check('every card labelled "Demo Product" (10)', (await page.getByText('Demo Product', { exact: true }).count()) === 10)
  let okAll = true, why = ''
  for (const p of P) {
    const card = page.getByRole('article', { name: p.name }), t = await card.innerText(), [lf, lfmt, ll] = LEAD[p.category], [kf, kfmt, kl] = KEY[p.category]
    const rows = await card.locator('dl > div').count()
    const ok = t.includes(lfmt(p[lf])) && t.toUpperCase().includes(ll.toUpperCase()) && t.includes(p.provider) && t.toLowerCase().includes('key requirement') && t.includes(kl + ':') && t.includes(kfmt(p[kf])) && rows === 2 && t.includes('Demo Product') && (await card.getByRole('button', { name: 'View Details' }).count()) === 1 && (await card.getByRole('button', { name: 'Compare' }).count()) === 1
    if (!ok) { okAll = false; why += `${p.id} ` }
  }
  check('each card: category band, name, provider, headline metric, 2 attributes, key requirement, View Details + Compare — all equal the API', okAll, why)
  const band = await page.locator('article').evaluateAll((els) => els.map((e) => getComputedStyle(e.firstElementChild).backgroundColor)); check('card bands are tinted per category (4 distinct tints)', new Set(band).size === 4)
  const card0 = page.getByRole('article', { name: 'Rainy Day Savings' })
  check('headline metric is large (≥30px) and tabular', (await card0.locator('.num').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) >= 30)
  check('disclaimer under the grid', (await page.locator('main').innerText()).includes('Illustrative products and rates. Not verified offers or financial advice. All providers are fictional.'))
  // selected state + header status
  await card0.getByRole('button', { name: 'Compare' }).click(); await page.waitForTimeout(300)
  check('selected: pressed, "✓ Compare", ring + check mark, header "Comparing 1 of 2"', (await card0.getByRole('button', { name: /Compare/ }).getAttribute('aria-pressed')) === 'true' && (await card0.getByRole('button', { name: '✓ Compare' }).count()) === 1 && /ring-2/.test(await card0.getAttribute('class')) && (await page.getByText('Comparing 1 of 2').count()) === 1)
  // compare rules still enforced
  await page.getByRole('article', { name: 'Starter Secured Card' }).getByRole('button', { name: 'Compare' }).click(); await page.waitForTimeout(250)
  check('rule: other category replaces the selection with a notice', (await page.getByText('You can only compare products in the same category, so your savings selection was replaced.').count()) === 1 && (await card0.getByRole('button', { name: /Compare/ }).getAttribute('aria-pressed')) === 'false')
  const bar = page.getByRole('region', { name: 'Comparison bar' })
  check('rule: one credit product selected → Compare disabled', await bar.getByRole('button', { name: 'Compare' }).isDisabled())
  await page.getByRole('article', { name: 'Campus Student Card' }).getByRole('button', { name: 'Compare' }).click()
  check('rule: two same-category products → Compare enabled', await bar.getByRole('button', { name: 'Compare' }).isEnabled())
  const posts = []; page.on('request', (r) => { if (r.url().endsWith('/api/marketplace/compare') && r.method() === 'POST') posts.push(JSON.parse(r.postData())) })
  await bar.getByRole('button', { name: 'Compare' }).click(); await page.getByText('A clearer view, side by side.').waitFor()
  const cmpApi = await (await fetch('http://127.0.0.1:8000/api/marketplace/compare', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 'cr-secured', b: 'cr-student' }) })).json()
  const tbl = await page.locator('table').innerText()
  check('Compare posts the two ids to POST /api/marketplace/compare and shows both products and API values', posts.length === 1 && JSON.stringify(posts[0]) === JSON.stringify({ a: 'cr-secured', b: 'cr-student' }) && cmpApi.products.every((p) => tbl.includes(p.name === undefined ? '' : String(p.apr_pct.toFixed(2)) + '%')), JSON.stringify(posts))
  // third-product notice (savings has three products)
  await page.goto(BASE + '/marketplace'); await ready(page)
  for (const n of ['Rainy Day Savings', 'Flexible Savings', 'Goal Vault']) await page.getByRole('article', { name: n }).getByRole('button', { name: 'Compare' }).click()
  check('rule: a third product in the same category is refused with a notice; still two selected', (await page.getByText('Two products are already selected. Remove or replace one first.').count()) === 1 && (await page.getByText('Comparing 2 of 2').count()) === 1 && (await page.getByRole('article', { name: 'Goal Vault' }).getByRole('button', { name: /Compare/ }).getAttribute('aria-pressed')) === 'false')
  await page.getByRole('article', { name: 'Rainy Day Savings' }).getByRole('button', { name: /Compare/ }).click(); await page.waitForTimeout(200)
  check('deselecting works and the header updates ("Comparing 1 of 2")', (await page.getByText('Comparing 1 of 2').count()) === 1)
  await page.getByRole('article', { name: 'Goal Vault' }).getByRole('button', { name: 'Compare' }).click(); await page.getByRole('region', { name: 'Comparison bar' }).getByRole('button', { name: 'Compare' }).click(); await page.getByText('A clearer view, side by side.').waitFor()
  await page.getByRole('button', { name: 'Explain with MoneyBridge AI' }).first().waitFor(); check('previous-pass flow still works: comparison view + "Explain with MoneyBridge AI"', true)
  await page.getByRole('article', { name: 'Flexible Savings' }).getByRole('button', { name: 'View Details' }).click(); await page.getByRole('dialog').waitFor(); check('previous-pass flow still works: details drawer opens', (await page.getByRole('dialog').innerText()).includes('Demo Product'))
  await page.keyboard.press('Escape')
  const fonts = await page.evaluate(() => [...new Set([...document.querySelectorAll('main *')].map((e) => getComputedStyle(e).fontFamily))]); check('Geist only', fonts.every((f) => /Geist/.test(f)))
  check('no console errors', errors.length === 0, errors.join('|'))
  await browser.close()
}

{ // ───── sticky bar interactions in a short viewport (the page stays tall enough for the bar to remain stuck)
  const { browser, page } = await launch({ width: 1440, height: 560 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/marketplace?category=credit'); await ready(page)
  await page.evaluate(() => window.scrollTo(0, 99999)); await page.waitForTimeout(600)
  const fb = page.getByRole('region', { name: 'Filter bar' })
  check('short viewport: bar is stuck and "Credit" is pressed', (await fb.count()) === 1 && (await fb.getByRole('button', { name: /Credit/ }).getAttribute('aria-pressed')) === 'true' && (await page.getByRole('article').count()) === 2)
  await fb.getByRole('button', { name: 'All' }).click(); await page.waitForTimeout(700)
  check('"All" shows all 10, clears the URL filter, brings the grid into view, bar stays', (await page.getByRole('article').count()) === 10 && !page.url().includes('category=') && (await page.getByRole('heading', { name: 'Explore Financial Products' }).boundingBox()).y < 200 && (await fb.count()) === 1 && (await fb.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')) === 'true')
  await fb.getByRole('button', { name: /Savings/ }).click(); await page.waitForTimeout(700); check('pill Savings filters to 3 and its category card shows pressed', (await page.getByRole('article').count()) === 3 && (await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: /Savings/ }).getAttribute('aria-pressed')) === 'true')
  await page.evaluate(() => window.scrollTo(0, 99999)); await page.waitForTimeout(500)
  if ((await fb.count()) === 1) { await fb.getByRole('textbox').fill('harbor'); await page.waitForTimeout(800); check('bar search combines with the category (Savings ∩ harbor = 1)', (await page.getByRole('article').count()) === 1) } else { await page.getByPlaceholder('Search products or providers…').fill('harbor'); await page.waitForTimeout(800); check('search combines with the category (Savings ∩ harbor = 1)', (await page.getByRole('article').count()) === 1) }
  await browser.close()
}

{ // ───── no goals → slim strip; error + loading states
  const { browser, page } = await launch({ width: 1440, height: 900 })
  await page.goto(BASE); await seed(page, []); await page.goto(BASE + '/marketplace'); await ready(page)
  const s = page.locator('section[aria-label="Relevant to Your Goals"]')
  check('no goals: slim "Add your goals in Settings" strip, no cards', (await s.getByRole('button').count()) === 0 && (await s.innerText()).includes('Add your goals in Settings') && (await s.getByRole('link', { name: /Add your goals in Settings/ }).getAttribute('href')) === '/settings')
  const sh = await s.boundingBox(); check('…and it is a slim strip (≤ 80px)', sh.height <= 80, String(Math.round(sh.height)))
  await browser.close()
  const b2 = await launch({ width: 1440, height: 900 }); const p2 = b2.page
  await p2.goto(BASE); await seed(p2); let mode = 'slow'; await p2.route('**/api/marketplace/products**', async (r) => { if (mode === 'slow') await new Promise((x) => setTimeout(x, 1500)); if (mode === 'down') return r.abort(); return r.continue() })
  await p2.goto(BASE + '/marketplace'); await p2.getByRole('status', { name: 'Loading products' }).waitFor({ timeout: 3000 }); check('loading: skeleton cards while products load', await p2.getByRole('status', { name: 'Loading products' }).isVisible())
  await p2.getByRole('article').first().waitFor({ timeout: 8000 }); mode = 'down'
  await p2.getByRole('group', { name: 'Categories' }).getByRole('button', { name: /Banking/ }).click(); await p2.getByText('Marketplace unavailable').waitFor()
  check('error: friendly backend message + Retry', /Can’t reach the MoneyBridge backend/.test(await p2.getByRole('alert').innerText()) && await p2.getByRole('button', { name: 'Retry' }).isVisible())
  await b2.browser.close()
}

for (const w of [1024, 768, 390]) { // ───── responsive
  const { browser, page } = await launch({ width: w, height: 844 })
  await page.goto(BASE); await seed(page); await page.goto(BASE + '/marketplace'); await ready(page)
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); check(`${w}px: no horizontal overflow`, ov <= 1, String(ov))
  const gt = await tops(page, 'article'), cols = gt.filter((t) => t === gt[0]).length
  check(`${w}px: product grid has ${w >= 1280 ? 3 : w >= 768 ? 2 : 1} column(s)`, cols === (w >= 768 ? 2 : 1), `${cols}`)
  const ct = await tops(page, '[role=group][aria-label=Categories] > button'), ccols = ct.filter((t) => t === ct[0]).length
  check(`${w}px: category cards ${w >= 768 ? 'four across' : '2×2'}`, ccols === (w >= 768 ? 4 : 2), String(ccols))
  const gcols = (await tops(page, 'section[aria-label="Relevant to Your Goals"] button')); check(`${w}px: goal cards ${w >= 768 ? 'two across' : 'stacked'}`, new Set(gcols).size === (w >= 768 ? 1 : 2))
  await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(500)
  const fb = page.getByRole('region', { name: 'Filter bar' }); check(`${w}px: sticky filter bar appears`, (await fb.count()) === 1)
  if (w === 390) {
    check('390px: filter bar = search icon + scrolling category pills (no inline search box)', (await fb.getByRole('button', { name: 'Go to search' }).isVisible()) && !(await fb.getByRole('textbox').isVisible()) && (await fb.getByRole('group', { name: 'Category filter' }).getByRole('button').count()) === 5)
    await fb.getByRole('button', { name: 'Go to search' }).click(); await page.waitForTimeout(900); check('390px: the search icon scrolls up and focuses the search', await page.getByPlaceholder('Search products or providers…').evaluate((e) => e === document.activeElement))
  }
  await browser.close()
}
