# LegalLens AI Backend on Hugging Face Spaces

This backend is prepared for Hugging Face Spaces using the Docker SDK and the Blank Docker template.

Do not deploy API keys or Firebase service account JSON in source control. Configure them as Hugging Face Space secrets.

## Architecture Summary

- Entrypoint: `app.main:app`
- Runtime server: `uvicorn app.main:app --host 0.0.0.0 --port 7860`
- API framework: FastAPI
- API routes: `app/api/routes.py` under `/api`
- Upload validation: `app/utils/file_utils.py`
- Document extraction: `app/services/document_service.py`
- OCR: EasyOCR via `app/services/ocr_service.py`
- RAG indexing: `app/rag/indexer.py`
- Retrieval: `app/rag/retriever.py`
- Vector store: ChromaDB persistent client in `DATA_DIR/chroma`
- Embeddings: `sentence-transformers/all-MiniLM-L6-v2`
- Drafting: template/agent layer in `app/agents` and `app/templates`
- Auth: Firebase ID token verification when `AUTH_REQUIRED=true`
- Document access: `X-Document-Token` per uploaded document
- LLM: Gemini when `GEMINI_API_KEY` is configured, otherwise local rule-based analysis fallback
- Security: MIME/content validation, PII redaction, prompt-injection detection, rate limiting, safe audit logs

## Health Endpoints

These routes are public and require no Firebase token or document token.

```bash
curl https://YOUR_SPACE.hf.space/
curl https://YOUR_SPACE.hf.space/api/health
```

Expected root response:

```json
{
  "status": "ok",
  "service": "LegalLens AI Backend"
}
```

Expected API health response:

```json
{
  "status": "ok",
  "api": "healthy"
}
```

## Create the Hugging Face Space

1. Open Hugging Face.
2. Create a new Space.
3. Select `Docker` as the SDK.
4. Select `Blank Docker` as the template.
5. Upload the contents of this `backend/` directory so `Dockerfile` is at the Space root.
6. Configure the variables and secrets listed below.
7. Wait for the Docker build to finish.
8. Open `/` and `/api/health` on the Space URL.
9. Update the Vercel frontend `VITE_API_URL` to the Space backend URL.

## Dockerfile Summary

The Dockerfile:

- uses `python:3.11-slim`
- installs OCR/OpenCV runtime libraries
- installs CPU `torch` and `torchvision`
- installs FastAPI, ChromaDB, EasyOCR, PyMuPDF, python-docx, Firebase Admin, Gemini, and sentence-transformers dependencies
- creates `uploads`, `data`, `logs`, and model cache directories
- preloads `sentence-transformers/all-MiniLM-L6-v2` during image build
- runs the API as a non-root `appuser`
- exposes port `7860`
- starts uvicorn on `0.0.0.0:${PORT:-7860}`

## Variables

Set these as Hugging Face Space variables unless they contain secrets.

```env
FRONTEND_URL=https://legal-lensai.vercel.app
CORS_ALLOWED_ORIGINS=https://legal-lensai.vercel.app
CORS_ALLOW_ORIGIN_REGEX=
GEMINI_MODEL=gemini-2.0-flash
AUTH_REQUIRED=true
FIREBASE_PROJECT_ID=legallens-ai-fd05e
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DEVICE=cpu
EMBEDDING_WARMUP_ON_START=true
MAX_UPLOAD_SIZE_BYTES=15728640
DOCUMENT_AUTO_EXPIRE_HOURS=24
REDACT_PII_FOR_LLM=true
RATE_LIMIT_REQUESTS=120
RATE_LIMIT_WINDOW_SECONDS=60
MAX_REQUEST_SIZE_BYTES=20971520
API_DEBUG=false
```

Optional storage override variables:

```env
UPLOADS_DIR=/app/uploads
DATA_DIR=/app/data
AUDIT_LOG_PATH=/app/data/audit.log
```

If Hugging Face persistent storage is enabled for the Space, point these paths at the persistent mount instead.

## Secrets

Set these as Hugging Face Space secrets.

```env
GEMINI_API_KEY=<Gemini API key>
FIREBASE_SERVICE_ACCOUNT_JSON=<full Firebase service account JSON>
AUDIT_HASH_SALT=<long random secret>
```

`GEMINI_API_KEY` is optional for local rule-based fallback, but recommended for the AI-enhanced analysis and chat experience.

## CORS

Allowed frontend origins are exact, not wildcard:

- `https://legal-lensai.vercel.app`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Allowed headers include:

- `Authorization`
- `Content-Type`
- `X-Document-Token`
- `Accept`
- `Origin`

## Storage Review

Current storage is local filesystem based:

- Uploaded files: `UPLOADS_DIR`, default `/app/uploads`
- Metadata/reports/chunks/audit log: `DATA_DIR`, default `/app/data`
- Chroma vector store: `DATA_DIR/chroma`
- Sentence-transformer model cache: `/app/.cache`

Without persistent storage, uploaded documents, reports, audit logs, and Chroma indexes can be lost when the Space is rebuilt or reset. This is acceptable for an MVP demo but should be externalized for production.

Recommended future externalization:

- object storage for uploaded documents
- managed database for metadata, reports, and audit records
- managed vector database for embeddings
- background worker for OCR and indexing

## Model Startup Stability

The Docker build runs:

```bash
python scripts/preload_models.py
```

This downloads and caches `sentence-transformers/all-MiniLM-L6-v2` before runtime. The FastAPI lifespan also schedules a non-fatal warmup and logs whether the model loaded successfully.

If model preload fails during Docker build, check outbound network access and available disk space for the Space.

## Connect Vercel Frontend

After the Space is healthy, set this in Vercel:

```env
VITE_API_URL=https://YOUR_SPACE.hf.space
```

Then redeploy the Vercel frontend.

## Local Verification

From the `backend/` directory:

```bash
python -m compileall app
python -m pytest tests -q
python scripts/preload_models.py --check-only
```

If Docker is installed:

```bash
docker build -t legallens-ai-backend .
docker run --rm -p 7860:7860 --env-file .env legallens-ai-backend
```

Then verify:

```bash
curl http://localhost:7860/
curl http://localhost:7860/api/health
```

## Remaining Deployment Risks

- First Docker build may be slow because CPU torch, EasyOCR dependencies, and MiniLM are large.
- EasyOCR may download its recognition model on first OCR use if not already cached.
- Local filesystem storage is not durable unless persistent Space storage is enabled.
- Firebase backend auth requires a valid service account JSON secret when `AUTH_REQUIRED=true`.
- Gemini calls require `GEMINI_API_KEY`; without it, deterministic fallback logic is used.
