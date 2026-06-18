from pydantic import BaseModel

from app.services.ai_service import answer_question


class LegalQAOutput(BaseModel):
    answer: str
    citations: list[dict]


class LegalQAAgent:
    """Answers questions only from retrieved contract context."""

    prompt = (
        "Answer using only retrieved contract excerpts. If the answer is not present, "
        "say the information was not found in the uploaded document."
    )

    def run(self, question: str, contexts: list[dict]) -> LegalQAOutput:
        response = answer_question(question, contexts)
        return LegalQAOutput(answer=response["answer"], citations=response["citations"])

