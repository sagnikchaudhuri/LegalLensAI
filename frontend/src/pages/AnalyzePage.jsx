import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import AnalyzeLoader from "../components/AnalyzeLoader";
import JourneyFrame from "../components/JourneyFrame";
import { analyzeDocument } from "../services/api";

const stages = [
  "Extracting text from your contract...",
  "Identifying clauses and obligations...",
  "Scoring risk and missing protections...",
  "Generating clear, actionable insights...",
];

export default function AnalyzePage() {
  const { documentId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(stages[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((current) => Math.min(current + 2, 92));
    }, 90);
    analyzeDocument(documentId)
      .then((analysis) => {
        sessionStorage.setItem(`analysis:${documentId}`, JSON.stringify(analysis));
        setProgress(100);
        setStatus("Analysis complete. Opening insights...");
        window.setTimeout(() => navigate(`/dashboard/${documentId}`), 650);
      })
      .catch((err) => {
        setError(err.message);
        setStatus(err.message);
      })
      .finally(() => clearInterval(timer));
    return () => clearInterval(timer);
  }, [documentId, navigate]);

  useEffect(() => {
    if (error) return;
    setStatus(stages[Math.min(Math.floor(progress / 25), 3)]);
  }, [error, progress]);

  return (
    <JourneyFrame backTo="/upload" menu={false} className="analyze-frame">
      <div className="analyze-stage">
        <AnalyzeLoader progress={progress} status={status} />
        <span className="analyze-file">{state?.fileName || "Uploaded contract"}</span>
      </div>
    </JourneyFrame>
  );
}
