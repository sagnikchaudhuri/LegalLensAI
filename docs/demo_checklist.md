# LegalLens AI Demo Checklist

Use this checklist before recording or presenting a public demo. The demo should
use only synthetic documents from `docs/demo_documents/`.

## 1. Local Setup

- Backend `.env` exists, copied from `backend/.env.example`.
- Frontend `.env` exists, copied from `frontend/.env.example`.
- `AUDIT_HASH_SALT` is not the default value for any shared deployment.
- `VITE_API_URL` points to the running backend.
- No private or real legal documents are present in `backend/uploads/`.
- No private or real extracted metadata is present in `backend/data/`.

## 2. Start Commands

Backend:

```powershell
cd C:\Users\dell\Documents\LegalLensAI\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd C:\Users\dell\Documents\LegalLensAI\frontend
npm.cmd run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

## 3. Demo Documents

Recommended primary demo document:

- `docs/demo_documents/sample-freelance-agreement.txt`

Backup documents:

- `docs/demo_documents/sample-nda.txt`
- `docs/demo_documents/sample-service-agreement.txt`
- `docs/demo_documents/sample-employment-offer.txt`

## 4. Demo Flow

1. Landing
   - Confirm the lens CTA is centered and visually attached to the lens.
   - Click the lens to open Upload.
   - Open the three-dots menu and confirm it does not navigate to Upload.

2. Upload
   - Upload `sample-freelance-agreement.txt`.
   - Confirm the selected filename appears.
   - Confirm upload state appears while processing.

3. Analyze
   - Wait for the progress animation to complete.
   - Confirm the app navigates to the Dashboard.

4. Dashboard
   - Show risk score.
   - Show key clauses, red flags, missing protections, and suggestions.
   - Mention that output is informational and not legal advice.

5. Chat
   - Ask: `Can the client delay payment without a penalty?`
   - Confirm the answer includes citations.

6. Drafting Studio
   - Open `/draft`.
   - Select `NDA`.
   - Fill party names, purpose, jurisdiction, and optional clauses.
   - Generate a draft and show clause explanations/risk notes.

7. Delete
   - Return to Dashboard or Report.
   - Click `Delete Document`.
   - Confirm the app returns to Upload and document access is removed.

## 5. Mobile Checks

Review these widths before publishing screenshots or videos:

- 360px
- 390px
- 430px
- 768px
- Desktop

Confirm:

- No horizontal scrolling.
- Touch targets are at least 44px.
- Chat input remains usable.
- Dashboard cards stack cleanly.
- Upload and camera buttons remain visible and tappable.
- iPhone safe-area spacing does not cover controls.

## 6. Deployment Checks

Frontend Vercel settings:

- Root Directory: repository root
- Install Command: `cd frontend && npm ci`
- Build Command: `cd frontend && npm run build`
- Output Directory: `frontend/dist`

Required frontend environment variable:

```dotenv
VITE_API_URL=https://your-backend.example.com
```

Backend:

- Deploy separately on a Python host with persistent storage.
- Start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set `FRONTEND_URL` to the deployed Vercel frontend origin.

## 7. Do Not Show

- Real legal documents.
- Real personal information.
- Raw access tokens.
- Backend local file paths.
- API keys or `.env` contents.
- `backend/data/` or `backend/uploads/` contents if they contain private files.

