import json

from app.config import settings
from app.security.pii_redactor import redact_pii
from app.security.prompt_guard import safe_prompt_header


DISCLAIMER = (
    "LegalLens AI helps users understand legal documents faster. "
    "It does not provide legal advice and should not replace a qualified lawyer."
)


def gemini_enabled() -> bool:
    return bool(settings.gemini_api_key)


def _model():
    from google import genai

    return genai.Client(api_key=settings.gemini_api_key)


def enrich_analysis_with_gemini(text: str, base_analysis: dict) -> dict:
    if not gemini_enabled():
        return base_analysis
    llm_text = redact_pii(text) if settings.redact_pii_for_llm else text
    prompt = f"""
{safe_prompt_header()}

TASK:
Return only valid JSON using the exact keys and shapes already present in the base
analysis. Improve the summary, contract_type, parties, clause summaries, red flags,
missing protections, and negotiation suggestions.

BASE ANALYSIS:
{json.dumps(base_analysis)}

UNTRUSTED DOCUMENT CONTENT:
{llm_text[:30000]}
"""
    try:
        response = _model().models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        enriched = json.loads(response.text)
        enriched["document_id"] = base_analysis["document_id"]
        enriched["file_name"] = base_analysis["file_name"]
        enriched["risk_score"] = base_analysis["risk_score"]
        enriched["risk_level"] = base_analysis["risk_level"]
        enriched["disclaimer"] = DISCLAIMER
        return enriched
    except Exception:
        return base_analysis


def answer_question(question: str, contexts: list[dict]) -> dict:
    citations = _citations(contexts)
    if not contexts:
        return {
            "answer": "I could not find this information in the uploaded document.",
            "citations": [],
        }
    if not gemini_enabled():
        excerpt = " ".join(contexts[0]["text"].split())
        return {
            "answer": f"Based on the uploaded document: {excerpt[:650]}",
            "citations": citations,
        }

    source_contexts = [
        {
            **item,
            "text": redact_pii(item["text"]) if settings.redact_pii_for_llm else item["text"],
        }
        for item in contexts
    ]
    excerpts = "\n\n".join(
        f"[{item['chunk_id']} | page {item.get('page_number') or 'n/a'} | {item.get('source')}]\n{item['text']}"
        for item in source_contexts
    )
    prompt = f"""
{safe_prompt_header()}

TASK:
Answer the user question using only the untrusted contract excerpts below. Be concise
and use plain English. If the excerpts do not contain the answer, respond exactly:
"I could not find this information in the uploaded document."

USER QUESTION:
{question}

UNTRUSTED RETRIEVED DOCUMENT CONTENT:
{excerpts}
"""
    try:
        response = _model().models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        answer = response.text.strip()
    except Exception:
        excerpt = " ".join(contexts[0]["text"].split())
        answer = f"Based on the uploaded document: {excerpt[:650]}"
    return {"answer": answer, "citations": citations}


def _citations(contexts: list[dict]) -> list[dict]:
    seen = set()
    citations = []
    for item in contexts:
        key = item.get("chunk_id")
        if not key or key in seen:
            continue
        seen.add(key)
        citations.append(
            {
                "page": item.get("page_number"),
                "chunk_id": item.get("chunk_id", ""),
                "source": item.get("source", "uploaded-document"),
            }
        )
    return citations
