export const usd = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits })
export const pct = (n: number, digits = 2) => `${n.toFixed(digits)}%`
