"""Deterministic Financial Twin math. No AI involved.

Conventions (shown to the user in the UI):
- net annual rate = gross annual return - weighted expense ratio
- monthly rate    = net annual rate / 12   (simple division, matches UI formula)
- contributions are made at the END of each month (ordinary annuity)
- balance_m = balance_{m-1} * (1 + r) + contribution
- taxes and inflation excluded; results rounded to whole cents at output only
"""
from pydantic import BaseModel, Field, model_validator

class Holding(BaseModel):
    name: str
    weight_pct: float = Field(ge=0, le=100)
    expense_ratio_pct: float = Field(ge=0, le=5)

class Scenario(BaseModel):
    initial_investment: float = Field(ge=0)
    monthly_contribution: float = Field(ge=0)
    years: int = Field(ge=1, le=50)
    gross_return_pct: float = Field(ge=-20, le=30)
    holdings: list[Holding]

    @model_validator(mode="after")
    def weights_total_100(self):
        total = round(sum(h.weight_pct for h in self.holdings), 6)
        if abs(total - 100) > 1e-6:
            raise ValueError(f"Allocation must total 100% (got {total}%)")
        return self

def weighted_expense_ratio_pct(holdings: list[Holding]) -> float:
    return sum(h.weight_pct * h.expense_ratio_pct for h in holdings) / 100

def project(initial: float, monthly: float, years: int, gross_pct: float, fee_pct: float) -> dict:
    r = (gross_pct - fee_pct) / 100 / 12
    bal, yearly = initial, [round(initial, 2)]
    for m in range(1, years * 12 + 1):
        bal = bal * (1 + r) + monthly
        if m % 12 == 0:
            yearly.append(round(bal, 2))
    contributed = initial + monthly * years * 12
    return {
        "ending_value": round(bal, 2),
        "total_contributions": round(contributed, 2),
        "modeled_growth": round(bal - contributed, 2),
        "yearly_values": yearly,
    }

def run(s: Scenario, baseline: Scenario | None = None,
        downside_pct: float = 2.0, upside_pct: float = 9.0) -> dict:
    fee = weighted_expense_ratio_pct(s.holdings)
    out = {"weighted_expense_ratio_pct": round(fee, 4),
           "hypothetical": project(s.initial_investment, s.monthly_contribution, s.years, s.gross_return_pct, fee)}
    if baseline:
        bfee = weighted_expense_ratio_pct(baseline.holdings)
        b = project(baseline.initial_investment, baseline.monthly_contribution, baseline.years, baseline.gross_return_pct, bfee)
        out["baseline"] = b
        out["baseline_expense_ratio_pct"] = round(bfee, 4)
        out["difference_at_end"] = round(out["hypothetical"]["ending_value"] - b["ending_value"], 2)
    # Fee impact: same inputs, zero-fee vs actual fee
    nofee = project(s.initial_investment, s.monthly_contribution, s.years, s.gross_return_pct, 0)
    out["fee_impact"] = {"cost_of_fees": round(nofee["ending_value"] - out["hypothetical"]["ending_value"], 2)}
    out["risk_scenarios"] = {
        name: project(s.initial_investment, s.monthly_contribution, s.years, g, fee)
        | {"gross_return_pct": g}
        for name, g in (("downside", downside_pct), ("base", s.gross_return_pct), ("upside", upside_pct))
    }
    out["assumptions"] = {
        "monthly_rate": "(gross return - weighted expense ratio) / 12",
        "contribution_timing": "end of month", "excluded": ["taxes", "inflation"],
        "disclaimer": "Hypothetical illustration. Not a forecast or advice. Capital can be lost.",
    }
    return out
