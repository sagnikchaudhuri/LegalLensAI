# LegalLens AI Auth Test Checklist

Use this checklist before every public demo or deployment.

## Firebase Console Setup

1. Open Firebase Console for the LegalLens AI project.
2. Go to Authentication > Sign-in method.
3. Enable Google as a provider.
4. Go to Authentication > Settings > Authorized domains.
5. Add every frontend domain that will open the Google sign-in popup:
   - `localhost`
   - `127.0.0.1`
   - Your Vercel frontend domain, for example `legallens-ai.vercel.app`
   - Any custom frontend domain, for example `legallens.ai`
6. The Render backend URL does not need to be an authorized auth domain unless it serves a browser login page. It does need Firebase Admin env vars for backend token verification.

## Localhost Test

1. Create `frontend/.env` from `frontend/.env.example`.
2. Fill in the Firebase `VITE_FIREBASE_*` values.
3. Start the backend:
   ```powershell
   cd backend
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
4. Start the frontend:
   ```powershell
   cd frontend
   npm run dev -- --host 127.0.0.1
   ```
5. Visit `http://127.0.0.1:5173/`.
6. Confirm unauthenticated users redirect to `/login`.
7. Click Continue with Google.
8. Confirm the user lands on the LegalLens landing page after login.
9. Refresh the page and confirm the session persists.
10. Open the three-dots menu and click Logout.
11. Confirm protected routes redirect back to `/login`.

## Vercel Test

1. Add the Vercel frontend domain to Firebase authorized domains.
2. Set Vercel environment variables:
   - `VITE_API_URL`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
3. Deploy the frontend.
4. Visit the deployed Vercel URL.
5. Confirm Google sign-in opens without an unauthorized-domain error.
6. Confirm logout works from the three-dots menu.

## Backend Auth Test

1. Set backend `AUTH_REQUIRED=true`.
2. Set `FIREBASE_PROJECT_ID`.
3. Set `FIREBASE_SERVICE_ACCOUNT_JSON`.
4. Confirm upload fails without `Authorization: Bearer <Firebase ID token>`.
5. Confirm upload succeeds when the frontend is logged in.
6. Confirm document routes still require `X-Document-Token`.

## Common Firebase Auth Errors

- `auth/popup-blocked`: Browser blocked the Google popup. Allow popups and retry.
- `auth/popup-closed-by-user`: User closed the popup before sign-in completed.
- `auth/cancelled-popup-request`: A previous sign-in popup is already open.
- `auth/unauthorized-domain`: Add the current frontend domain in Firebase authorized domains.
- `auth/operation-not-allowed`: Enable Google provider in Firebase Authentication.
- `auth/invalid-api-key`: Check Vite Firebase environment variables.
- Network failure: Confirm the browser can reach Firebase and Google OAuth endpoints.
