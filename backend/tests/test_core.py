import pytest
from app import simulation as s, marketplace as m, demo_data as d

H = lambda a, b: [s.Holding(name="US", weight_pct=a, expense_ratio_pct=0.05), s.Holding(name="Intl", weight_pct=b, expense_ratio_pct=0.20)]

def test_weights_must_total_100():
    with pytest.raises(ValueError): s.Scenario(initial_investment=1, monthly_contribution=0, years=1, gross_return_pct=5, holdings=H(60, 30))

def test_zero_return_is_just_contributions():
    r = s.project(1000, 100, 2, 0, 0)
    assert r["ending_value"] == 3400 and r["modeled_growth"] == 0

def test_hand_checked_one_month():
    r = s.project(1000, 100, 1, 12, 0)  # monthly 1%, 12 months
    bal = 1000
    for _ in range(12): bal = bal * 1.01 + 100
    assert r["ending_value"] == round(bal, 2)

def test_weighted_fee():
    assert s.weighted_expense_ratio_pct(H(60, 40)) == pytest.approx(0.11)

def test_scenario_ordering_and_fee_cost():
    sc = s.Scenario(initial_investment=12000, monthly_contribution=300, years=10, gross_return_pct=6, holdings=H(60, 40))
    out = s.run(sc)
    rs = out["risk_scenarios"]
    assert rs["downside"]["ending_value"] < rs["base"]["ending_value"] < rs["upside"]["ending_value"]
    assert rs["base"]["ending_value"] == out["hypothetical"]["ending_value"]
    assert out["fee_impact"]["cost_of_fees"] > 0
    assert len(out["hypothetical"]["yearly_values"]) == 11

def test_demo_dataset_consistent():
    x = d.dashboard()
    assert (x["total_assets"], x["total_liabilities"], x["net_worth"]) == (23500, 1500, 22000)
    assert x["cash_flow"]["monthly_surplus"] == 1500
    assert [h["allocation_pct"] for h in x["portfolio"]["holdings"]] == [60.0, 40.0]
    assert x["portfolio"]["total"] == 12000

def test_marketplace_compare_rules():
    assert m.compare("sav-rainy", "sav-flex")["category"] == "savings"
    with pytest.raises(ValueError): m.compare("sav-rainy", "bank-everyday")
    with pytest.raises(ValueError): m.compare("sav-rainy", "sav-rainy")
    assert len(m.goal_recommendations(["emergency_savings", "investing", "credit_building"])) == 2

def test_api_recommendations_and_dotenv():
    from fastapi.testclient import TestClient
    from app.main import app
    c = TestClient(app)
    r = c.get("/api/marketplace/recommendations", params={"goals": "emergency_savings,investing,credit_building"}).json()
    assert [x["category"] for x in r["recommendations"]] == ["savings", "investing"]
    assert c.get("/api/dashboard").json()["net_worth"] == 22000


def test_cors_origins_from_env(monkeypatch):
    from app.main import parse_origins
    assert parse_origins(None) == ["http://localhost:5173"]
    assert parse_origins("") == ["http://localhost:5173"]
    assert parse_origins("https://a.vercel.app/, http://localhost:5173 ,") == ["https://a.vercel.app", "http://localhost:5173"]
