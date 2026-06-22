import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
let firebaseModulePromise;

function loadFirebaseModule() {
  if (!firebaseModulePromise) {
    firebaseModulePromise = import("./firebase");
  }
  return firebaseModulePromise;
}

function clearSensitiveSessionData() {
  if (typeof sessionStorage === "undefined") return;
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith("documentToken:") || key.startsWith("analysis:"))
    .forEach((key) => sessionStorage.removeItem(key));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authApi, setAuthApi] = useState(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let isActive = true;
    let unsubscribe;

    loadFirebaseModule()
      .then((module) => {
        if (!isActive) return;
        setAuthApi(module);
        setConfigured(module.isFirebaseConfigured);

        if (!module.auth) {
          setLoading(false);
          return;
        }

        unsubscribe = module.subscribeToAuthState(
          (nextUser) => {
            setUser(nextUser);
            setLoading(false);
            setAuthError("");
          },
          () => {
            setAuthError("Could not restore your login session.");
            setLoading(false);
          },
        );
      })
      .catch(() => {
        if (!isActive) return;
        setConfigured(false);
        setAuthError("Could not initialize Google sign-in. Check the Firebase environment variables.");
        setLoading(false);
      });

    return () => {
      isActive = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    authError,
    isFirebaseConfigured: configured,
    loading,
    user,
    loginWithGoogle: async () => {
      setAuthError("");
      let module;
      try {
        module = authApi || await loadFirebaseModule();
        setConfigured(module.isFirebaseConfigured);
        await module.signInWithGoogle();
      } catch (error) {
        const message = module?.friendlyFirebaseAuthError?.(error)
          || error.message
          || "Google sign-in failed.";
        setAuthError(message);
        throw error;
      }
    },
    logout: async () => {
      clearSensitiveSessionData();
      const module = authApi || await loadFirebaseModule();
      await module.logoutFirebaseUser();
    },
  }), [authApi, authError, configured, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
