// Production-shaped check: static build on one origin, API on another (VITE_API_URL), deep links, no proxy.
import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome' }); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage()
const errs = [], apiCalls = []; page.on('console', (m) => m.type() === 'error' && errs.push(m.text())); page.on('pageerror', (e) => errs.push(e.message)); page.on('request', (r) => { if (r.url().includes('/api/')) apiCalls.push(new URL(r.url()).origin) })
const ok = (n, c, x = '') => console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`)
await page.goto('http://localhost:4173/'); await page.evaluate(() => localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing'], dataSetup: 'demo' })))
for (const [path, marker] of [['/dashboard', 'Net worth'], ['/twin', 'Hypothetical ending value'], ['/marketplace', 'Financial Marketplace'], ['/companion', 'AI Companion'], ['/settings', 'Settings']]) {
  await page.goto('http://localhost:4173' + path); await page.getByText(marker, { exact: false }).first().waitFor({ timeout: 15000 }).catch(() => {})
  const t = (await page.locator('body').innerText()).toLowerCase(); ok(`deep link ${path} loads directly and its content renders`, t.includes(marker.toLowerCase()) && !/unavailable|\(404\)|Can’t reach/.test(t))
}
await page.goto('http://localhost:4173/dashboard'); await page.getByText('$22,000').first().waitFor({ timeout: 15000 }).catch(() => {})
ok('Dashboard shows the backend number ($22,000) fetched cross-origin', (await page.locator('main').innerText()).includes('$22,000'))
ok('every API call went to the backend origin, none to the static host', apiCalls.length > 0 && apiCalls.every((o) => o === 'http://localhost:8000'), [...new Set(apiCalls)].join(','))
ok('no console errors (CORS would show here)', errs.length === 0, errs.join(' | ').slice(0, 200))
await b.close()
