from pydantic import BaseModel

from app.models.schemas import DraftRequest, DraftResponse
from app.templates.legal_templates import generate_template


class DraftingOutput(BaseModel):
    draft: DraftResponse


class DraftingAgent:
    """Generates legal document drafts from typed user intent and reusable templates."""

    prompt = (
        "Generate a structured legal draft, clause explanations, and practical risk notes. "
        "Do not claim that the draft is legal advice."
    )

    def run(self, request: DraftRequest) -> DraftingOutput:
        return DraftingOutput(draft=generate_template(request))
