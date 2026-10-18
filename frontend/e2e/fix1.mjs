import { launch, check, BASE } from './lib.mjs'
const { browser, page } = await launch({ width: 1440, height: 900 })
await page.goto(BASE); await page.evaluate(() => localStorage.setItem('mb.profile', JSON.stringify({ name: 'Alex Morgan', stage: 'early_career', level: 'beginner', goals: ['investing'], dataSetup: 'demo' })))
await page.goto(BASE + '/dashboard'); await page.getByRole('heading', { name: 'Holdings' }).waitFor(); await page.waitForTimeout(900)
const names = await page.locator('ul[aria-label="Holdings"] li').first().evaluate(() => 0).catch(() => 0)
const info = await page.evaluate(() => {
  const lis = [...document.querySelectorAll('ul[aria-label="Holdings"] li')]
  const card = document.querySelector('ul[aria-label="Holdings"]').closest('section'), total = [...card.querySelectorAll('div')].find((e) => e.textContent.trim().startsWith('Total') && e.className.includes('justify-between'))
  const spans = lis.map((l) => l.querySelector('span.leading-snug'))
  return { full: spans.map((e) => e.textContent), clipped: spans.map((e) => e.scrollWidth > e.clientWidth + 1), lines: spans.map((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight))),
    rowH: lis.map((l) => Math.round(l.getBoundingClientRect().height)), card: card.getBoundingClientRect(), total: total.getBoundingClientRect(), ul: lis.at(-1).getBoundingClientRect() }
})
check('full holding names shown, not truncated', info.full.includes('Demo International ETF') && info.clipped.every((c) => !c), info.full.join(' | '))
check('long name wraps to a second line', info.lines.some((n) => n >= 2), info.lines.join(','))
const gap = info.card.bottom - info.total.bottom
check('no dead space under the total (≤ card padding)', gap <= 26, `${Math.round(gap)}px below total`)
check('rows are taller (stretched)', info.rowH.every((h) => h > 60), info.rowH.join(','))
const hero = await page.locator('section.on-dark').boundingBox(), tile = await page.locator('section', { hasText: 'Total assets' }).filter({ hasText: 'Demo data ·' }).first().boundingBox(), cf = await page.locator('section', { has: page.getByRole('heading', { name: 'Cash flow', exact: true }) }).first().boundingBox()
check('hero trimmed (was 468px)', hero.height < 440, `${Math.round(hero.height)}px; tiles ${Math.round(tile.height)}, cash flow ${Math.round(cf.height)}`)
check('hero stays level with the right column', Math.abs(hero.y + hero.height - (cf.y + cf.height)) < 2)
const ring = await page.locator('section.on-dark svg').first().boundingBox(), heroBox = hero
check('ring fully inside the hero (not cropped)', ring.x >= heroBox.x && ring.x + ring.width <= heroBox.x + heroBox.width && ring.y >= heroBox.y && ring.y + ring.height <= heroBox.y + heroBox.height, `${Math.round(ring.width)}px ring`)
check('100 ticks still rendered', (await page.locator('section.on-dark svg line[stroke-linecap="round"]').count()) === 100)
await page.screenshot({ path: process.env.SHOT }); await browser.close()
