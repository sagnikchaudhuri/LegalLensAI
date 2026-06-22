import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

const AnalyzePage = lazy(() => import("./pages/AnalyzePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DraftPage = lazy(() => import("./pages/DraftPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));

function protectedPage(page) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

function RouteFallback() {
  return (
    <main className="journey-page">
      <section className="journey-frame auth-loading">
        <div>Loading LegalLens...</div>
      </section>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <main>
        <AnimatePresence mode="wait" initial={false}>
          <Suspense fallback={<RouteFallback />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={protectedPage(<LandingPage />)} />
              <Route path="/upload" element={protectedPage(<UploadPage />)} />
              <Route path="/analyze/:documentId" element={protectedPage(<AnalyzePage />)} />
              <Route path="/dashboard/:documentId" element={protectedPage(<DashboardPage />)} />
              <Route path="/chat/:documentId" element={protectedPage(<ChatPage />)} />
              <Route path="/report/:documentId" element={protectedPage(<ReportPage />)} />
              <Route path="/draft" element={protectedPage(<DraftPage />)} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
    </div>
  );
}
