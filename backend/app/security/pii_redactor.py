import re


PII_PATTERNS = [
    (re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE), "[REDACTED_EMAIL]"),
    (re.compile(r"(?<!\d)(?:\+91[-\s]?)?[6-9]\d{9}(?!\d)"), "[REDACTED_PHONE]"),
    (re.compile(r"(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)"), "[REDACTED_AADHAAR]"),
    (re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b", re.IGNORECASE), "[REDACTED_PAN]"),
    (re.compile(r"\b\d{9,18}\b"), "[REDACTED_BANK_ACCOUNT]"),
    (re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b", re.IGNORECASE), "[REDACTED_IFSC]"),
]


def redact_pii(text: str) -> str:
    redacted = text
    for pattern, replacement in PII_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted

