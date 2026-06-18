import { Download, FileText, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import WorkspaceFrame from "../components/WorkspaceFrame";
import { deleteDocument } from "../services/api";
import { useAnalysis } from "../utils/useAnalysis";

export default function ReportPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [shared, setShared] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { analysis, loading, error } = useAnalysis(documentId);

  const share = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setShared(true);
    window.setTimeout(() => setShared(false), 1800);
  };

  const removeDocument = async () => {
    if (deleting || !window.confirm("Delete this document and its analysis data?")) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteDocument(documentId);
      navigate("/upload", { replace: true });
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <WorkspaceFrame documentId={documentId} active="report"><div className="quiet-loader">Preparing report...</div></WorkspaceFrame>;
  if (error || !analysis) return <WorkspaceFrame documentId={documentId} active="report"><div className="quiet-loader">{error || "Report not found."}</div></WorkspaceFrame>;

  return (
    <WorkspaceFrame documentId={documentId} active="report">
      <div className="report-ready">
        <div className="report-icon"><FileText size={45} strokeWidth={1} /></div>
        <span className="ready-kicker">{analysis.risk_level}</span>
        <h1>Contract Analysis Report</h1>
        <p>Your comprehensive report for <strong>{analysis.file_name}</strong> is ready.</p>
        <div className="report-mini-summary">
          <span><b>{analysis.risk_score}</b> Risk score</span>
          <span><b>{analysis.key_clauses.length}</b> Key clauses</span>
          <span><b>{analysis.red_flags.length}</b> Red flags</span>
        </div>
        <button className="download-report" onClick={() => window.print()} aria-label="Print or save report as PDF"><Download size={16} />Download PDF</button>
        <button className="share-report" onClick={share} aria-live="polite"><Share2 size={15} />{shared ? "Link copied" : "Share Report"}</button>
        <button className="share-report report-danger" onClick={removeDocument} disabled={deleting} aria-label="Delete this document and its analysis data"><Trash2 size={15} />{deleting ? "Deleting..." : "Delete Document"}</button>
        {deleteError && <p className="workspace-delete-error">{deleteError}</p>}
      </div>
    </WorkspaceFrame>
  );
}
