import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider = new GoogleAuthProvider();

if (auth) {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // The auth listener still works; users can retry if persistence is blocked.
  });
}

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error("Firebase is not configured. Add the Vite Firebase environment variables.");
  }
  return signInWithPopup(auth, googleProvider);
}

export function subscribeToAuthState(onUser, onError) {
  if (!auth) return undefined;
  return onAuthStateChanged(auth, onUser, onError);
}

export async function logoutFirebaseUser() {
  if (!auth) return;
  await signOut(auth);
}

export async function getFirebaseIdToken() {
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export function friendlyFirebaseAuthError(error) {
  const code = error?.code || "";
  const messages = {
    "auth/popup-blocked": "Google sign-in was blocked by the browser. Allow popups for this site and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished. Please try again when you are ready.",
    "auth/cancelled-popup-request": "Another Google sign-in window was already open. Close it and try again.",
    "auth/network-request-failed": "Google sign-in could not reach Firebase. Check your connection and try again.",
    "auth/unauthorized-domain": "This domain is not authorized in Firebase. Add it under Authentication > Settings > Authorized domains.",
    "auth/operation-not-allowed": "Google sign-in is not enabled for this Firebase project.",
    "auth/invalid-api-key": "Firebase rejected the API key. Check the frontend environment variables.",
  };
  return messages[code] || "Google sign-in failed. Please try again.";
}
