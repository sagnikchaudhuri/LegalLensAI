# LegalLens AI Backend Deployment

Recommended host: Render Web Service.

The backend should be deployed separately from the Vercel frontend because it uses large AI/OCR/vector dependencies: `sentence-transformers`, `torch`, `easyocr`, and persistent ChromaDB storage.

## Render Settings

- Root Directory: `backend`
- Build Command:
  ```bash
  python -m pip install -r requirements.txt
  python scripts/preload_models.py
  ```
- Start Command:
  ```bash
  python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- Health Check Path: `/api/health` or `/`

If model download during build is too slow for your Render plan, remove the preload command and let startup warmup load the model. The first upload may be slower.

## Environment Variables

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
FRONTEND_URL=https://legal-lensai.vercel.app
CORS_ALLOWED_ORIGINS=https://legal-lensai.vercel.app
CORS_ALLOW_ORIGIN_REGEX=
API_DEBUG=false
MAX_UPLOAD_SIZE_BYTES=15728640
DOCUMENT_AUTO_EXPIRE_HOURS=24
REDACT_PII_FOR_LLM=true
RATE_LIMIT_REQUESTS=120
RATE_LIMIT_WINDOW_SECONDS=60
MAX_REQUEST_SIZE_BYTES=20971520
AUDIT_HASH_SALT=replace-with-a-long-random-secret
AUTH_REQUIRED=true
FIREBASE_PROJECT_ID=legallens-ai-fd05e
FIREBASE_SERVICE_ACCOUNT_JSON=
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DEVICE=cpu
EMBEDDING_WARMUP_ON_START=true
```

`FIREBASE_SERVICE_ACCOUNT_JSON` should be the full Firebase Admin service account JSON stored as an environment variable. Do not commit it.

Set `FRONTEND_URL` to the main Vercel production origin. Use `CORS_ALLOWED_ORIGINS` for extra comma-separated custom domains. CORS is exact-origin by default and explicitly allows `Authorization`, `X-Document-Token`, and `Content-Type`. Temporarily set `API_DEBUG=true` to log safe draft/request diagnostics on Render.

## Persistent Disk

Attach a persistent disk for runtime document data:

- `backend/uploads`
- `backend/data`
- `backend/data/chroma`

Without persistent storage, uploaded documents, generated reports, and Chroma vector indexes may be lost across restarts.

If Render mounts the disk outside the repository, set:

```env
UPLOADS_DIR=/var/data/uploads
DATA_DIR=/var/data/data
AUDIT_LOG_PATH=/var/data/audit.log
```

## Model Preload

Run this from the backend directory to download/cache MiniLM:

```bash
python scripts/preload_models.py
```

Use this to validate script wiring without downloading:

```bash
python scripts/preload_models.py --check-only
```

The API also schedules a non-fatal startup warmup. If Hugging Face access fails, the backend remains up and logs a warning; upload/indexing returns a safe `503` until the model is available.

## Firebase Backend Auth

When `AUTH_REQUIRED=true`, protected routes require:

```http
Authorization: Bearer <Firebase ID token>
```

Document-specific routes also require:

```http
X-Document-Token: <document access token>
```

## Smoke Test

```bash
curl https://your-render-backend.onrender.com/
curl https://your-render-backend.onrender.com/api/health
```

Expected response includes:

```json
{
  "status": "ok",
  "service": "LegalLens AI Backend"
}
```
