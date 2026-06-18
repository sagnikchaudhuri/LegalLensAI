import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";

import AnalyzePage from "./pages/AnalyzePage";
import ChatPage from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import DraftPage from "./pages/DraftPage";
import LandingPage from "./pages/LandingPage";
import ReportPage from "./pages/ReportPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  const location = useLocation();
  return (
    <div className="app-shell">
      <main>
        <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/analyze/:documentId" element={<AnalyzePage />} />
          <Route path="/dashboard/:documentId" element={<DashboardPage />} />
          <Route path="/chat/:documentId" element={<ChatPage />} />
          <Route path="/report/:documentId" element={<ReportPage />} />
          <Route path="/draft" element={<DraftPage />} />
        </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}
