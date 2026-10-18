import { launch, check, BASE } from './lib.mjs'
const OUT = process.env.OUT
for (const w of [1440, 1024, 390]) {
  const { browser, page, errors } = await launch({ width: w, height: 900 })
  await page.goto(BASE)
  await page.evaluate(() => localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['emergency_savings', 'investing'], dataSetup: 'demo' })))
  for (const route of ['/dashboard', '/twin', '/companion', '/marketplace', '/settings']) {
    await page.goto(BASE + route); await page.waitForTimeout(900)
    if (route === '/marketplace') { await page.getByRole('article').first().getByRole('button', { name: 'View Details' }).click(); await page.waitForTimeout(400) }
    const o = await page.evaluate(() => {
      const W = document.documentElement.clientWidth
      const bad = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 1 && !e.closest('.overflow-x-auto') && getComputedStyle(e).position !== 'fixed' }).slice(0, 3).map((e) => e.tagName + '.' + String(e.className).slice(0, 60))
      return { sw: document.documentElement.scrollWidth, W, bad }
    })
    check(`${w}px ${route}: no horizontal overflow`, o.sw <= o.W + 1 && o.bad.length === 0, JSON.stringify(o))
    if (OUT && (w === 390 || w === 1024)) await page.screenshot({ path: `${OUT}/r${w}${route.replace('/', '-')}.png`, fullPage: route !== '/marketplace' })
  }
  // onboarding
  await page.evaluate(() => localStorage.clear()); await page.goto(BASE + '/onboarding'); await page.waitForTimeout(400)
  const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  check(`${w}px /onboarding: no horizontal overflow`, o <= 1, String(o))
  check(`${w}px no console errors`, errors.length === 0, errors.join('|'))
  await browser.close()
}
