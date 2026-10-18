"""Negated mentions of risk-free / guaranteed are explanations, not promises, and must not be replaced."""
import pytest
from app.ai_safety import sanitize_ai_output, FALLBACK


@pytest.mark.parametrize("reply", [
    "Rainy Day Savings offers 4.0% APY and Flexible Savings 3.8%. Neither is risk-free and rates can change.",
    "Neither account has guaranteed returns; the APY is variable.",
    "Nor is any of this guaranteed income, so treat it as an illustration.",
    "None of these options is risk-free.",
])
def test_negated_claims_are_kept(reply):
    out = sanitize_ai_output(reply, "compare these")
    assert out["flags"].count("risky_financial_claim") == 0 and out["text"].startswith(reply[:30])


@pytest.mark.parametrize("reply", [
    "This fund is risk-free.",
    "You will get guaranteed returns every year.",
    "It is a sure thing and you can't lose.",
])
def test_real_promises_are_still_replaced(reply):
    out = sanitize_ai_output(reply, "")
    assert out["text"] == FALLBACK and "risky_financial_claim" in out["flags"]


def test_figures_survive():
    r = "The ending value is $103,244.55 and the downside is $80,626.76. Neither is guaranteed returns."
    assert "$103,244.55" in sanitize_ai_output(r)["text"]
