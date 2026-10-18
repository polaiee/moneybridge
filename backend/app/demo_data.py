"""Single synthetic persona used by Dashboard, Twin and AI. All values are DEMO data."""
ACCOUNTS = [
    {"id": "chk", "name": "Everyday Checking", "type": "checking", "balance": 3500, "source": "demo"},
    {"id": "sav", "name": "Savings", "type": "savings", "balance": 8000, "source": "demo"},
    {"id": "inv", "name": "Brokerage (demo)", "type": "investment", "balance": 12000, "source": "demo"},
    {"id": "cc", "name": "Credit card", "type": "liability", "balance": 1500, "source": "demo"},
]
HOLDINGS = [  # fictional ETFs
    {"name": "Demo US Equity ETF", "value": 7200, "expense_ratio_pct": 0.05},
    {"name": "Demo International ETF", "value": 4800, "expense_ratio_pct": 0.20},
]
CASH_FLOW = {"monthly_income": 4500, "monthly_expenses": 3000}

def dashboard(accounts=None) -> dict:
    accounts = accounts or ACCOUNTS
    assets = sum(a["balance"] for a in accounts if a["type"] != "liability")
    liabilities = sum(a["balance"] for a in accounts if a["type"] == "liability")
    inv = sum(h["value"] for h in HOLDINGS)
    return {
        "data_source": "demo", "accounts": accounts,
        "total_assets": assets, "total_liabilities": liabilities, "net_worth": assets - liabilities,
        "cash_flow": {**CASH_FLOW, "monthly_surplus": CASH_FLOW["monthly_income"] - CASH_FLOW["monthly_expenses"]},
        "portfolio": {"total": inv, "holdings": [{**h, "allocation_pct": round(h["value"] / inv * 100, 1)} for h in HOLDINGS]},
    }
