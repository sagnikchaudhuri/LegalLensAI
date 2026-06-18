from pydantic import BaseModel


RECOMMENDED_PROTECTIONS = {
    "Payment": "Payment terms are not clearly stated.",
    "Termination": "No clear termination process was found.",
    "Dispute Resolution": "The agreement does not explain how disputes will be resolved.",
    "Confidentiality": "Confidentiality protections appear to be missing.",
    "Intellectual Property": "Intellectual property ownership is unclear.",
    "Governing Law": "Governing law or jurisdiction is not clearly stated.",
}


class ComplianceOutput(BaseModel):
    missing_protections: list[str]
    compliance_notes: list[str]


class ComplianceAgent:
    """Checks for foundational protections expected in common commercial contracts."""

    prompt = (
        "Review the detected clause map for missing baseline protections and compliance notes. "
        "Keep output practical and non-advisory."
    )

    def run(self, clause_types: set[str]) -> ComplianceOutput:
        missing = [
            message for clause, message in RECOMMENDED_PROTECTIONS.items()
            if clause not in clause_types
        ]
        notes = []
        if "Data Privacy" not in clause_types:
            notes.append("Add data privacy terms if personal or confidential data is exchanged.")
        return ComplianceOutput(missing_protections=missing, compliance_notes=notes)

