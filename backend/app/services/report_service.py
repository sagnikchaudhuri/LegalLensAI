from app.agents.compliance_agent import ComplianceAgent
from app.agents.document_parser_agent import DocumentParserAgent
from app.agents.risk_analysis_agent import RiskAnalysisAgent
from app.services.ai_service import DISCLAIMER, enrich_analysis_with_gemini
from app.services.clause_service import detect_clauses


def build_analysis(document_id: str, file_name: str, text: str) -> dict:
    clauses = detect_clauses(text)
    clause_types = {item["type"] for item in clauses}
    parser_output = DocumentParserAgent().run(text)
    compliance_output = ComplianceAgent().run(clause_types)
    risk_output = RiskAnalysisAgent().run(text, clause_types, compliance_output.missing_protections)
    analysis = {
        "document_id": document_id,
        "file_name": file_name,
        "risk_score": risk_output.risk_score,
        "risk_level": risk_output.risk_level,
        "summary": parser_output.summary,
        "contract_type": parser_output.contract_type,
        "parties": parser_output.parties,
        "key_clauses": clauses,
        "red_flags": risk_output.red_flags,
        "missing_protections": compliance_output.missing_protections,
        "negotiation_suggestions": risk_output.negotiation_suggestions,
        "disclaimer": DISCLAIMER,
    }
    return enrich_analysis_with_gemini(text, analysis)
