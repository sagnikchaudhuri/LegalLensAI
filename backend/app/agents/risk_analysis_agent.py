from pydantic import BaseModel, Field

from app.services.risk_service import calculate_risk, negotiation_suggestions, risk_level


class RiskAnalysisOutput(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    risk_level: str
    red_flags: list[str]
    negotiation_suggestions: list[str]


class RiskAnalysisAgent:
    """Owns quantitative and qualitative risk scoring."""

    prompt = (
        "Evaluate the contract for measurable legal and commercial risk. "
        "Return risk score, risk level, red flags, and negotiation suggestions."
    )

    def run(self, text: str, clause_types: set[str], missing_protections: list[str]) -> RiskAnalysisOutput:
        score, red_flags, missing = calculate_risk(text, clause_types)
        merged_missing = list(dict.fromkeys([*missing_protections, *missing]))
        return RiskAnalysisOutput(
            risk_score=score,
            risk_level=risk_level(score),
            red_flags=red_flags,
            negotiation_suggestions=negotiation_suggestions(red_flags, merged_missing),
        )

