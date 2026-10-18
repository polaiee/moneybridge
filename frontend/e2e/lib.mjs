import { chromium } from 'playwright-core'
export const BASE = process.env.BASE_URL || 'http://localhost:5173'
export async function launch(viewport = { width: 1280, height: 900 }) {
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await (await browser.newContext({ viewport, reducedMotion: 'reduce' })).newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  return { browser, page, errors }
}
export const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`); if (!ok) process.exitCode = 1 }
