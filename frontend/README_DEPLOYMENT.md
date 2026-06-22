# LegalLens AI Frontend Deployment

Recommended host: Vercel static frontend deployment.

The frontend should point to the separately deployed FastAPI backend on Render.

## Vercel Settings

- Root Directory: `frontend`
- Install Command:
  ```bash
  npm ci
  ```
- Build Command:
  ```bash
  npm run build
  ```
- Output Directory: `dist`

If deploying from the repository root instead, the root `vercel.json` is frontend-only and builds `frontend/dist`.

## Environment Variables

```env
VITE_API_URL=https://your-render-backend.onrender.com
VITE_API_TIMEOUT_MS=30000
VITE_API_DEBUG=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=legallens-ai-fd05e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=legallens-ai-fd05e
VITE_FIREBASE_APP_ID=
```

Do not commit `frontend/.env`.

## Firebase Console Checklist

After deployment:

1. Open Firebase Console > Authentication > Settings > Authorized domains.
2. Add the Vercel frontend domain, for example `your-project.vercel.app`.
3. Add any custom frontend domain.
4. Keep `localhost` and `127.0.0.1` for local testing.
5. Enable Google under Authentication > Sign-in method.

The Render backend URL does not need to be listed as an authorized domain unless it serves browser login pages. The backend verifies Firebase tokens with Firebase Admin instead.

## Backend CORS Pairing

Set the Render backend environment variable:

```env
FRONTEND_URL=https://your-vercel-frontend.vercel.app
```

This allows the Vercel frontend to call the FastAPI backend.

If Drafting Studio shows a backend/CORS error, confirm `VITE_API_URL` is the Render backend origin and not `localhost`. Temporarily set `VITE_API_DEBUG=true` in Vercel to log safe request/response summaries in the browser console.

## Verification

```bash
npm ci
npm run build
```

Then test:

1. Visit the Vercel URL.
2. Confirm unauthenticated users see `/login`.
3. Sign in with Google.
4. Upload a demo document.
5. Analyze, chat, generate a draft, delete the document, and logout.
