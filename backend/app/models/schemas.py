from typing import Literal

from pydantic import BaseModel, Field


class SourceCitation(BaseModel):
    page: int | None = None
    chunk_id: str
    source: str


class UploadResponse(BaseModel):
    document_id: str
    access_token: str
    file_name: str
    extracted_text_preview: str
    ocr_used: bool = False


class ClauseAnalysis(BaseModel):
    type: str
    summary: str
    risk: Literal["Low", "Medium", "High"]
    plain_english: str


class AnalysisResponse(BaseModel):
    document_id: str
    file_name: str
    risk_score: int = Field(ge=0, le=100)
    risk_level: str
    summary: str
    contract_type: str
    parties: list[str]
    key_clauses: list[ClauseAnalysis]
    red_flags: list[str]
    missing_protections: list[str]
    negotiation_suggestions: list[str]
    disclaimer: str


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)


class ChatResponse(BaseModel):
    answer: str
    citations: list[SourceCitation] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)


class DraftRequest(BaseModel):
    document_type: Literal[
        "NDA",
        "Service Agreement",
        "Freelance Contract",
        "Employment Agreement",
        "Internship Agreement",
        "Legal Notice",
        "Privacy Policy",
        "Terms & Conditions",
    ]
    party_names: list[str] = Field(min_length=1, max_length=6)
    purpose: str = Field(min_length=5, max_length=2000)
    payment: str | None = Field(default=None, max_length=1000)
    duration: str | None = Field(default=None, max_length=1000)
    jurisdiction: str = Field(min_length=2, max_length=300)
    special_clauses: list[str] = Field(default_factory=list, max_length=12)


class ClauseExplanation(BaseModel):
    title: str
    explanation: str


class DraftResponse(BaseModel):
    document_type: str
    full_draft: str
    clause_explanations: list[ClauseExplanation]
    risk_notes: list[str]
    disclaimer: str


class DeleteResponse(BaseModel):
    document_id: str
    deleted: bool
