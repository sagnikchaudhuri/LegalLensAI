# LegalLens AI

![Project Status](https://img.shields.io/badge/status-demo--ready%20MVP-d7a336)
![AI Pipeline](https://img.shields.io/badge/RAG-ChromaDB%20%2B%20MiniLM-0c1116)
![Security](https://img.shields.io/badge/security-token--protected%20documents-0c1116)
![PWA](https://img.shields.io/badge/mobile-responsive%20PWA-d7a336)

LegalLens AI is an AI-powered Contract Intelligence and Drafting Copilot. It lets
users upload legal documents, extract text, run contract analysis, ask grounded
questions with citations, and generate first-draft legal documents from structured
templates.

> LegalLens AI is an educational and portfolio project. It helps users understand
> legal documents faster, but it does not provide legal advice and should not
> replace review by a qualified lawyer.

## Problem Statement

Contracts are difficult to review quickly. Important risks are often buried in
termination, payment, confidentiality, IP, liability, and jurisdiction clauses.
Most AI demos answer legal questions without source grounding or privacy controls.

LegalLens AI solves the demo version of that problem by combining:

- semantic document retrieval
- citation-backed Q&A
- structured contract risk analysis
- drafting templates
- OCR support
- token-protected document access
- safe local deletion and privacy controls

## Key Features

- Upload PDF, DOCX, TXT, PNG, JPG, and JPEG documents.
- Validate uploads by MIME type, file signature, extension, and configured size.
- Extract text from documents and scanned images using PyMuPDF, python-docx, and EasyOCR.
- Generate semantic embeddings with `sentence-transformers/all-MiniLM-L6-v2`.
- Store document chunks and citation metadata in ChromaDB.
- Analyze contracts for summaries, key clauses, red flags, missing protections, and risk scores.
- Ask questions against the uploaded contract with citations.
- Generate legal drafts for NDAs, service agreements, freelance contracts, employment agreements, internship agreements, legal notices, privacy policies, and terms and conditions.
- Protect document routes with bearer access tokens stored only in frontend session storage.
- Delete uploaded files, extracted text, reports, chunks, metadata, and vector entries.
- Install as a responsive PWA on Android Chrome and modern mobile browsers.

## Screenshots

Add screenshots here before publishing the repository:

| Landing | Upload | Insights |
| --- | --- | --- |
| `assets/screenshots/landing.png` | `assets/screenshots/upload.png` | `assets/screenshots/insights.png` |

| Chat with Citations | Drafting Studio | Report |
| --- | --- | --- |
| `assets/screenshots/chat.png` | `assets/screenshots/draft.png` | `assets/screenshots/report.png` |

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Framer Motion, lucide-react, custom CSS |
| Backend | FastAPI, Pydantic, Uvicorn |
| AI / LLM | Gemini API optional, local rule-based fallback |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector Store | ChromaDB |
| OCR | EasyOCR |
| Parsing | PyMuPDF, python-docx, plain text readers |
| Storage | Local uploads, JSON metadata/reports, local Chroma persistence |
| Security | Bearer document tokens, hashed token storage, rate limiting, safe audit logs |
| Mobile / PWA | Web App Manifest, service worker for safe static assets, responsive CSS, iOS safe-area support |

## Architecture

```text
React/Vite frontend
  -> FastAPI API
    -> Security and access-token middleware
    -> File validation and document extraction
    -> OCR for scanned PDFs and images
    -> Semantic chunking and ChromaDB indexing
    -> Lightweight legal agents
    -> Gemini enrichment when GEMINI_API_KEY is configured
    -> Drafting template engine
```

See [docs/architecture_diagram.md](docs/architecture_diagram.md) for Mermaid
diagrams covering the system overview, upload pipeline, RAG pipeline, security
token flow, and drafting pipeline.

## AI Pipeline

1. User uploads a legal document.
2. Backend validates the file and stores it under a random document ID.
3. Text is extracted from PDF, DOCX, TXT, image, or scanned PDF content.
4. Document text is split into page-aware chunks.
5. Chunks are embedded with `sentence-transformers/all-MiniLM-L6-v2`.
6. Chunks are stored in ChromaDB with:
   - `document_id`
   - `chunk_id`
   - `page_number`
   - `source`
7. Analysis agents generate contract summary, risk score, red flags, missing protections, and negotiation suggestions.
8. Chat embeds the question, retrieves relevant chunks, and returns an answer plus citations.
9. Optional Gemini calls receive redacted text when `REDACT_PII_FOR_LLM=true`.

## Security Measures

- MIME type, extension, size, and content-signature validation for uploads.
- Rejection of executables, scripts, archives, and unknown file content.
- Sanitized filenames and secure random document IDs.
- No raw local file paths returned to the frontend.
- Access token generated at upload and stored as a hash in metadata.
- Protected routes require:

```http
Authorization: Bearer <access_token>
```

- Protected routes:
  - `POST /api/analyze/{document_id}`
  - `POST /api/chat/{document_id}`
  - `GET /api/report/{document_id}`
  - `DELETE /api/documents/{document_id}`
- PII redaction before LLM calls for emails, Indian phone numbers, Aadhaar-like numbers, PAN-like numbers, bank account-like numbers, and IFSC-like codes.
- Prompt-injection detector for suspicious document instructions.
- Safe JSON error format with no stack traces or internal paths.
- Basic per-IP rate limiting and request-size validation.
- Audit logging for upload, analyze, chat, report, draft, delete, and security warnings without raw tokens, API keys, full PII, or full document text.
- Chroma product telemetry is disabled through a no-op telemetry client.
- The service worker does not cache API responses, uploaded documents, reports, chat answers, or legal analysis data.

## Mobile and PWA Support

LegalLens AI is configured as a responsive Progressive Web App while keeping the
same lens-centered visual identity.

Supported targets:

- Android Chrome
- iOS Safari
- Mobile browsers at 360px, 390px, and 430px widths
- Tablet screens around 768px
- Desktop browsers

PWA behavior:

- `manifest.webmanifest` provides app name, theme colors, standalone display mode, and LegalLens icon placeholders.
- `sw.js` caches only safe static frontend assets such as scripts, styles, icons, fonts, and the manifest.
- Sensitive legal data is intentionally network-only: uploads, API responses, reports, chat responses, and document metadata are not cached offline.
- Mobile meta tags include viewport-fit support, theme color, Apple web app settings, and Android install compatibility.

Install notes:

- Android Chrome: open the app URL and use `Install app` or `Add to Home screen`.
- iOS Safari: open the app URL, tap Share, then choose `Add to Home Screen`.
- The app still requires the backend to be running for document analysis, chat, drafting, upload, and delete.

## Demo Dataset

Synthetic demo documents live in [docs/demo_documents](docs/demo_documents):

- `sample-nda.txt`
- `sample-freelance-agreement.txt`
- `sample-employment-offer.txt`
- `sample-service-agreement.txt`

These are fictional and safe for demos. They intentionally include ambiguous or
risky clauses so the analysis flow has something meaningful to detect.

## Local Setup

### Setup Checklist

- Python installed.
- Node.js and npm installed.
- Backend dependencies installed.
- Frontend dependencies installed.
- `.env` files copied from examples.
- Optional: `GEMINI_API_KEY` configured.
- First embedding run has internet access so MiniLM can be downloaded and cached.
- For PWA testing, serve the frontend over `localhost`, `127.0.0.1`, or HTTPS.

### Backend

```powershell
cd C:\Users\dell\Documents\LegalLensAI\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Important backend environment variables:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
FRONTEND_URL=http://localhost:5173
MAX_UPLOAD_SIZE_BYTES=15728640
DOCUMENT_AUTO_EXPIRE_HOURS=24
REDACT_PII_FOR_LLM=true
RATE_LIMIT_REQUESTS=120
RATE_LIMIT_WINDOW_SECONDS=60
MAX_REQUEST_SIZE_BYTES=20971520
AUDIT_HASH_SALT=replace-with-a-random-local-secret
```

### Frontend

```powershell
cd C:\Users\dell\Documents\LegalLensAI\frontend
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev -- --host 127.0.0.1
```

Frontend environment:

```dotenv
VITE_API_URL=http://localhost:8000
```

Open:

```text
http://127.0.0.1:5173/
```

## API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `POST` | `/api/upload` | Upload, validate, extract, OCR if needed, chunk, and index |
| `POST` | `/api/analyze/{document_id}` | Generate structured contract intelligence report |
| `POST` | `/api/chat/{document_id}` | Ask grounded questions with citations |
| `GET` | `/api/report/{document_id}` | Retrieve saved report JSON |
| `DELETE` | `/api/documents/{document_id}` | Delete uploaded file, metadata, report, chunks, and vectors |
| `GET` | `/api/draft/types` | List drafting document types |
| `POST` | `/api/draft` | Generate legal document draft |

## Demo Flow

Use [docs/demo_script.md](docs/demo_script.md) for a 3-minute narration.

Recommended live demo:

1. Open the landing page and click the lens.
2. Upload `docs/demo_documents/sample-freelance-agreement.txt`.
3. Let analysis complete.
4. Show the risk score, red flags, missing protections, and summary.
5. Open Chat and ask: `Can the client delay payment without a penalty?`
6. Point out citations below the answer.
7. Open `/draft` and generate an NDA.
8. Return to dashboard or report and delete the uploaded document.

## Tests and Verification

```powershell
cd C:\Users\dell\Documents\LegalLensAI\backend
python -m pytest tests\test_security.py -q
python -m compileall app
```

```powershell
cd C:\Users\dell\Documents\LegalLensAI\frontend
npm.cmd run build
```

Service worker safety check:

```powershell
Select-String -Path C:\Users\dell\Documents\LegalLensAI\frontend\public\sw.js -Pattern "/api|SAFE_DESTINATIONS|caches"
```

The security tests cover invalid uploads, oversized uploads, token-protected
routes, valid-token access, deletion cleanup, failed-indexing cleanup, PII
redaction, and prompt-injection detection.

## Resume Highlights

- AI Engineer Internship: Built an AI-powered contract intelligence platform with semantic RAG, grounded Q&A, citations, OCR, and legal document drafting workflows.
- Full-Stack Internship: Implemented a React + FastAPI product with upload, analysis, chat, report, drafting, protected document access, and local deletion controls.
- Security-Aware AI Product: Designed document privacy controls with MIME validation, hashed access tokens, request-size checks, rate limiting, audit logs, PII redaction, and prompt-injection safeguards.
- RAG / Embeddings / Vector DB: Integrated `sentence-transformers/all-MiniLM-L6-v2` with ChromaDB to retrieve page-aware contract chunks and return citation-backed answers.
- Agentic Legal Workflow: Created lightweight agents for document parsing, risk analysis, compliance checks, legal Q&A, and template-based drafting.

## Interview Talking Points

- Why RAG matters: answers cite retrieved chunks instead of relying on unsupported generation.
- Why security matters: legal documents contain private business and personal data.
- Why token access matters: document IDs alone should not grant report or chat access.
- Why PII redaction matters: local citations preserve original text while LLM prompts can be redacted.
- Why the agent design is lightweight: each agent has a narrow responsibility and typed output without unnecessary orchestration.

## Known Limitations

- No real user accounts or multi-tenant workspace model yet.
- Local files are not encrypted at rest.
- Rate limiting is in memory and not distributed.
- Legal analysis is informational and not a substitute for a lawyer.
- OCR quality depends on image clarity and EasyOCR performance.
- Gemini enrichment is optional; without an API key, the app uses local rule-based analysis.
- PDF/DOCX export services are not fully production-grade yet.
- First MiniLM embedding run may need internet access to download the model.
- iOS install support uses SVG placeholder icons; production should replace them with final PNG Apple touch icons.
- The PWA shell can be installed, but sensitive legal workflows are not available offline by design.

## Future Improvements

- Add authenticated user accounts and organization workspaces.
- Move metadata to Postgres and files to encrypted object storage.
- Add managed vector database deployment or hardened Chroma service.
- Add streaming chat responses and highlighted source previews.
- Add stronger legal evaluation datasets and RAG quality metrics.
- Add jurisdiction-specific drafting packs.
- Add CI, E2E tests, and browser-based demo tests.
- Add production observability, secret management, and deployment hardening.
- Replace placeholder PWA icons with final PNG maskable and Apple touch icon assets.

## Contribution Note

This is currently a portfolio MVP. Contributions should preserve the existing
visual identity, keep legal guidance clearly informational, and avoid adding
features that weaken privacy or source grounding.

## Project Status

Demo-ready MVP. The app runs locally end-to-end with real embeddings, RAG,
citations, drafting, OCR support, document access tokens, deletion controls,
focused security tests, responsive mobile layouts, and static-asset-only PWA
support.
