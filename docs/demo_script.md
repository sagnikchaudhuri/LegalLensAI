# LegalLens AI 3-Minute Demo Script

This script uses only synthetic demo documents from `docs/demo_documents/`.

## 0:00-0:20 - Landing Page

"This is LegalLens AI, an AI-powered contract intelligence and drafting copilot.
The goal is simple: help someone understand a legal document before they sign
it. The interface stays intentionally focused around the lens metaphor: upload a
contract, analyze it, ask questions, and generate draft documents."

Action: Open the landing page and click the lens to start.

## 0:20-0:45 - Upload Document

"For the demo I am using a fully synthetic freelance agreement. The backend does
real file validation, generates a random document ID, stores a hashed access
token, and never exposes local file paths to the frontend."

Action: Upload `docs/demo_documents/sample-freelance-agreement.txt`.

## 0:45-1:15 - AI Analysis

"After upload, the document is extracted, chunked, embedded with
`sentence-transformers/all-MiniLM-L6-v2`, and indexed in ChromaDB. The analysis
agents classify the contract, identify clauses, score risk, and flag missing or
ambiguous protections."

Action: Let the analyzing screen complete and open the insights page.

## 1:15-1:40 - Risk Score and Report

"The dashboard gives a recruiter-friendly summary: risk score, key clauses, red
flags, missing protections, and negotiation suggestions. This is not a legal
opinion; it is an informational review that makes the document easier to inspect."

Action: Open the report page and point out risk score, clauses, and red flags.

## 1:40-2:10 - Citations and Chat Q&A

"The chat is grounded in retrieved document chunks. When I ask a question like
'Can the client delay payment?', the answer is backed by source citations, so the
user can see where the answer came from instead of trusting a generic model
response."

Action: Open Chat and ask:

```text
Can the client delay payment without a penalty?
```

Then show the citation metadata beneath the answer.

## 2:10-2:40 - Drafting Studio

"LegalLens also includes a drafting studio. It uses structured templates and a
Drafting Agent to generate documents like NDAs, service agreements, employment
agreements, privacy policies, and terms and conditions."

Action: Open `/draft`, choose `NDA`, fill party names, purpose, jurisdiction, and
special clauses, then generate the draft.

## 2:40-3:00 - Security and Delete

"Because legal documents are sensitive, this MVP includes practical security
controls: MIME validation, token-protected document access, safe audit logs, PII
redaction before LLM calls, prompt-injection safeguards, and a delete control to
remove uploaded files, metadata, reports, chunks, and vector entries."

Action: Return to the report or dashboard and click `Delete Document`.

Closing line:

"The important engineering story is that this is not just a mock UI. It is a
working AI document pipeline with retrieval, citations, drafting, OCR support,
and a security-aware local architecture."

