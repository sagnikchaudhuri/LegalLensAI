import { Scale } from "lucide-react";
import { motion } from "framer-motion";
import { Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import Brand from "../components/Brand";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const location = useLocation();
  const { authError, isFirebaseConfigured, loading, loginWithGoogle, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const from = location.state?.from?.pathname || "/";

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <motion.main
      className="journey-page login-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.24 }}
    >
      <motion.section
        className="journey-frame login-frame"
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <header className="journey-topbar">
          <Brand />
        </header>
        <div className="login-stage">
          <div className="login-mark" aria-hidden="true">
            <span />
            <Scale size={58} strokeWidth={0.85} />
          </div>
          <p className="login-kicker">Private contract intelligence</p>
          <h1>Sign in to LegalLens AI</h1>
          <p className="login-copy">
            Upload, analyze, chat with, and draft legal documents from a protected session.
          </p>
          <button
            className="google-login"
            type="button"
            onClick={submit}
            disabled={submitting || loading || !isFirebaseConfigured}
          >
            <span aria-hidden="true">G</span>
            {submitting ? "Opening Google..." : "Continue with Google"}
          </button>
          {!isFirebaseConfigured && (
            <p className="login-error" role="alert">
              Firebase is not configured. Add the Vite Firebase environment variables.
            </p>
          )}
          {authError && <p className="login-error" role="alert">{authError}</p>}
          <p className="login-disclaimer">
            LegalLens AI provides informational document analysis and is not legal advice.
          </p>
        </div>
      </motion.section>
    </motion.main>
  );
}
