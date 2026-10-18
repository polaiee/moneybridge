"""Fictional demo catalog. Every provider, rate and fee is illustrative."""
CATEGORY_FIELDS = {
    "banking": ["monthly_fee", "opening_deposit", "minimum_balance", "waiver"],
    "savings": ["apy_pct", "monthly_fee", "minimum_to_earn", "withdrawal_limits"],
    "credit": ["apr_pct", "annual_fee", "security_deposit", "restrictions"],
    "investing": ["min_investment", "account_fee", "etf_expense_ratio_pct", "services"],
}
PRODUCTS = [
 {"id":"bank-everyday","category":"banking","name":"Everyday Checking","provider":"Northline Demo","monthly_fee":0,"opening_deposit":25,"minimum_balance":0,"waiver":"None needed"},
 {"id":"bank-student","category":"banking","name":"Student Checking","provider":"Campus Demo","monthly_fee":5,"opening_deposit":0,"minimum_balance":0,"waiver":"$500 monthly deposits"},
 {"id":"bank-plus","category":"banking","name":"Plus Checking","provider":"Harbor Demo","monthly_fee":12,"opening_deposit":100,"minimum_balance":1500,"waiver":"$1,500 minimum balance"},
 {"id":"sav-rainy","category":"savings","name":"Rainy Day Savings","provider":"Harbor Demo","apy_pct":4.00,"monthly_fee":0,"minimum_to_earn":100,"withdrawal_limits":"Not provided"},
 {"id":"sav-flex","category":"savings","name":"Flexible Savings","provider":"Cove Demo","apy_pct":3.80,"monthly_fee":0,"minimum_to_earn":0,"withdrawal_limits":"Not provided"},
 {"id":"sav-goal","category":"savings","name":"Goal Vault","provider":"Waypoint Demo","apy_pct":3.50,"monthly_fee":0,"minimum_to_earn":0,"withdrawal_limits":"Up to 6 withdrawals/month"},
 {"id":"cr-secured","category":"credit","name":"Starter Secured Card","provider":"Bridge Demo","apr_pct":24.99,"annual_fee":0,"security_deposit":200,"restrictions":"Deposit subject to account terms"},
 {"id":"cr-student","category":"credit","name":"Campus Student Card","provider":"Campus Demo","apr_pct":22.49,"annual_fee":0,"security_deposit":0,"restrictions":"Enrollment verification"},
 {"id":"inv-index","category":"investing","name":"Simple Index Account","provider":"Waypoint Demo","min_investment":1,"account_fee":0,"etf_expense_ratio_pct":0.05,"services":"Fictional ETFs; no promised returns"},
 {"id":"inv-guided","category":"investing","name":"Guided Portfolio Demo","provider":"Cove Demo","min_investment":100,"account_fee":0.25,"etf_expense_ratio_pct":0.12,"services":"Model portfolios (illustrative)"},
]
for p in PRODUCTS: p["demo"] = True

def list_products(category=None, q=None):
    out = PRODUCTS
    if category: out = [p for p in out if p["category"] == category]
    if q:
        ql = q.lower(); out = [p for p in out if ql in p["name"].lower() or ql in p["provider"].lower() or ql in p["category"]]
    return out

def compare(a_id: str, b_id: str) -> dict:
    by = {p["id"]: p for p in PRODUCTS}
    a, b = by.get(a_id), by.get(b_id)
    if not a or not b: raise KeyError("Unknown product id")
    if a_id == b_id: raise ValueError("Pick two different products")
    if a["category"] != b["category"]: raise ValueError("Compare products from the same category only")
    return {"category": a["category"], "fields": CATEGORY_FIELDS[a["category"]], "products": [a, b]}

GOAL_TO_CATEGORY = {"emergency_savings": "savings", "budgeting": "banking", "credit_building": "credit",
                    "investing": "investing", "learning_etfs": "investing", "retirement": "investing"}
def goal_recommendations(goals: list[str]):
    seen, out = set(), []
    for g in goals:
        c = GOAL_TO_CATEGORY.get(g)
        if c and c not in seen: seen.add(c); out.append({"goal": g, "category": c})
    return out[:2]  # label in UI: "Relevant to Your Goals"
