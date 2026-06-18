import re

from pydantic import BaseModel


class ParsedDocument(BaseModel):
    contract_type: str
    parties: list[str]
    summary: str


class DocumentParserAgent:
    """Extracts neutral document metadata before risk or legal reasoning runs."""

    prompt = (
        "Identify the contract type, named parties, and a concise neutral summary. "
        "Do not provide legal advice."
    )

    def run(self, text: str) -> ParsedDocument:
        return ParsedDocument(
            contract_type=self._contract_type(text),
            parties=self._parties(text),
            summary=self._summary(text),
        )

    def _summary(self, text: str) -> str:
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        useful = [sentence.strip() for sentence in sentences if len(sentence.strip()) > 40]
        return " ".join(useful[:3])[:900] or text[:700]

    def _contract_type(self, text: str) -> str:
        lowered = text.lower()
        options = [
            ("Non-Disclosure Agreement", ["non-disclosure agreement", "nda"]),
            ("Employment Agreement", ["employment agreement", "employee"]),
            ("Rental Agreement", ["rental agreement", "lease", "landlord"]),
            ("Service Agreement", ["service agreement", "services"]),
            ("Vendor Agreement", ["vendor agreement", "supplier"]),
            ("Freelance Agreement", ["freelance", "independent contractor"]),
        ]
        for label, keywords in options:
            if any(keyword in lowered for keyword in keywords):
                return label
        return "General Contract"

    def _parties(self, text: str) -> list[str]:
        patterns = [
            r"between\s+(.+?)\s+and\s+(.+?)(?:\.|,|\n)",
            r"by\s+(.+?)\s+and\s+(.+?)(?:\.|,|\n)",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return [self._clean_party(match.group(1)), self._clean_party(match.group(2))]
        return []

    def _clean_party(self, value: str) -> str:
        return re.sub(r"[\"()]", "", value).strip()[:120]

