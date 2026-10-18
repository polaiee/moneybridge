/** Turns raw fetch/HTTP errors into messages a person can act on. */
export function friendlyError(raw: string | null | undefined, what = 'that'): string {
  const m = raw ?? ''
  if (/failed to fetch|networkerror|load failed|ECONNREFUSED|^5(02|03|04)$/i.test(m) && !/backboard/i.test(m))
    return `Can’t reach the MoneyBridge backend. Start it with “uvicorn app.main:app --port 8000” in backend/, then retry.`
  if (/BACKBOARD_API_KEY/i.test(m)) return 'The AI service isn’t configured: BACKBOARD_API_KEY is missing from backend/.env.'
  if (/backboard/i.test(m)) return `Backboard (the AI service) didn’t respond as expected. ${m.replace(/^Backboard \d+:\s*/, '').slice(0, 140)}`
  return `Couldn’t load ${what}${m ? ` (${m})` : ''}.`
}
