from app.models.schemas import ClauseExplanation, DraftRequest, DraftResponse
from app.services.ai_service import DISCLAIMER


DOCUMENT_TYPES = [
    "NDA",
    "Service Agreement",
    "Freelance Contract",
    "Employment Agreement",
    "Internship Agreement",
    "Legal Notice",
    "Privacy Policy",
    "Terms & Conditions",
]


def generate_template(request: DraftRequest) -> DraftResponse:
    parties = ", ".join(request.party_names)
    payment = request.payment or "Not applicable unless separately agreed in writing."
    duration = request.duration or "The term will continue until the stated purpose is completed or terminated in writing."
    clauses = "\n".join(f"- {clause}" for clause in request.special_clauses) or "- No additional special clauses supplied."
    title = request.document_type.upper()
    draft = f"""
{title}

Parties
This {request.document_type} is entered into by {parties}.

Purpose
The purpose of this document is: {request.purpose}

Term / Duration
{duration}

Payment / Consideration
{payment}

Jurisdiction
This document is governed by the laws of {request.jurisdiction}, unless a competent court determines otherwise.

Responsibilities
Each party will act in good faith, provide accurate information, and perform its obligations within reasonable timelines.

Confidentiality
Each party must protect confidential information received from the other party and use it only for the purpose stated above.

Intellectual Property
Pre-existing intellectual property remains owned by the original owner. Newly created work should be assigned or licensed according to a separately agreed written scope.

Termination
Either party may terminate this document with reasonable written notice unless a different termination process is stated in the special clauses.

Dispute Resolution
The parties should first attempt good-faith negotiation before pursuing formal legal remedies in the stated jurisdiction.

Special Clauses
{clauses}

Legal Notice
This draft is generated for review and customization. It should be reviewed by a qualified lawyer before signing or publication.
""".strip()
    return DraftResponse(
        document_type=request.document_type,
        full_draft=draft,
        clause_explanations=_explanations(request.document_type),
        risk_notes=_risk_notes(request),
        disclaimer=DISCLAIMER,
    )


def _explanations(document_type: str) -> list[ClauseExplanation]:
    return [
        ClauseExplanation(title="Parties", explanation="Identifies who is bound by the document."),
        ClauseExplanation(title="Purpose", explanation="Defines why the document exists and limits its intended use."),
        ClauseExplanation(title="Term", explanation="Sets the duration and expected timeline."),
        ClauseExplanation(title="Jurisdiction", explanation="Names the legal system that governs disputes."),
        ClauseExplanation(title="Special Clauses", explanation=f"Captures custom terms relevant to the {document_type}."),
    ]


def _risk_notes(request: DraftRequest) -> list[str]:
    notes = [
        "Confirm party names, addresses, and signing authority before use.",
        "Review enforceability under the stated jurisdiction.",
    ]
    if not request.payment:
        notes.append("Payment terms are absent or marked not applicable.")
    if not request.duration:
        notes.append("Duration is generic and should be made more precise if timing matters.")
    if not request.special_clauses:
        notes.append("No custom clauses were supplied; consider adding document-specific protections.")
    return notes

