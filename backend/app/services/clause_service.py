import re


CLAUSE_PATTERNS = {
    "Termination": ["termination", "terminate", "notice period"],
    "Payment": ["payment", "fees", "invoice", "compensation"],
    "Confidentiality": ["confidential", "non-disclosure", "proprietary information"],
    "Non-compete": ["non-compete", "noncompete", "restrictive covenant"],
    "Liability": ["liability", "liable", "limitation of liability"],
    "Indemnity": ["indemnif", "hold harmless"],
    "Intellectual Property": ["intellectual property", "work product", "copyright"],
    "Dispute Resolution": ["arbitration", "dispute resolution", "mediation"],
    "Governing Law": ["governing law", "jurisdiction"],
    "Renewal": ["renewal", "automatically renew", "auto-renew"],
    "Data Privacy": ["personal data", "data privacy", "data protection"],
    "Penalty": ["penalty", "liquidated damages", "late fee"],
    "Refund": ["refund", "reimburse"],
    "Scope of Work": ["scope of work", "services", "statement of work"],
    "Deliverables": ["deliverables", "milestone", "delivery date"],
}


def _context_for_keyword(text: str, keyword: str) -> str:
    match = re.search(re.escape(keyword), text, re.IGNORECASE)
    if not match:
        return ""
    start = max(0, text.rfind(".", 0, match.start()) + 1)
    end = text.find(".", match.end())
    end = len(text) if end == -1 else end + 1
    return " ".join(text[start:end].strip().split())[:420]


def detect_clauses(text: str) -> list[dict]:
    lowered = text.lower()
    clauses = []
    for clause_type, keywords in CLAUSE_PATTERNS.items():
        matched = next((word for word in keywords if word in lowered), None)
        if not matched:
            continue
        context = _context_for_keyword(text, matched)
        risk = _clause_risk(clause_type, context)
        clauses.append(
            {
                "type": clause_type,
                "summary": context or f"The document includes terms related to {clause_type.lower()}.",
                "risk": risk,
                "plain_english": _plain_english(clause_type),
            }
        )
    return clauses


def _clause_risk(clause_type: str, context: str) -> str:
    risky_terms = ["sole discretion", "unlimited", "irrevocable", "without notice", "immediately"]
    if any(term in context.lower() for term in risky_terms):
        return "High"
    if clause_type in {"Non-compete", "Liability", "Indemnity", "Penalty"}:
        return "Medium"
    return "Low"


def _plain_english(clause_type: str) -> str:
    explanations = {
        "Termination": "Explains when and how either side can end the agreement.",
        "Payment": "Sets out how much is paid, when it is due, and any payment conditions.",
        "Confidentiality": "Controls how private business information may be used or shared.",
        "Non-compete": "May limit where or for whom a party can work after the agreement.",
        "Liability": "Defines who pays if something goes wrong and whether damages are capped.",
        "Indemnity": "Requires one party to cover certain losses or legal claims.",
        "Intellectual Property": "Determines who owns work, inventions, or materials created.",
        "Dispute Resolution": "Explains the process for resolving disagreements.",
        "Governing Law": "Names the laws and courts that apply to the agreement.",
        "Renewal": "Explains whether and how the agreement continues after its initial term.",
        "Data Privacy": "Sets obligations for handling personal or sensitive data.",
        "Penalty": "Imposes a charge or consequence for certain failures.",
        "Refund": "Explains when payments may be returned.",
        "Scope of Work": "Defines the services or work expected under the agreement.",
        "Deliverables": "Lists the items or outcomes that must be provided.",
    }
    return explanations.get(clause_type, f"Explains the agreement's {clause_type.lower()} terms.")

