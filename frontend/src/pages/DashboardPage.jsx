import { ChevronRight, FileText, Flag, MessageCircle, MoreHorizontal, ScrollText, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import InsightStatItem from "../components/InsightStatItem";
import WorkspaceFrame from "../components/WorkspaceFrame";
import { deleteDocument } from "../services/api";
import { useAnalysis } from "../utils/useAnalysis";

export default function DashboardPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { analysis, loading, error } = useAnalysis(documentId);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const reportPath = `/report/${documentId}`;

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

  if (loading) return <WorkspaceFrame documentId={documentId} active="insights"><div className="quiet-loader">Opening insights...</div></WorkspaceFrame>;
  if (error || !analysis) return <WorkspaceFrame documentId={documentId} active="insights"><div className="quiet-loader">{error || "Analysis not found."}</div></WorkspaceFrame>;

  const stats = [
    { icon: FileText, label: "Contract Summary", to: "#summary" },
    { icon: ScrollText, label: "Key Clauses", count: analysis.key_clauses.length, to: reportPath },
    { icon: Flag, label: "Red Flags", count: analysis.red_flags.length, tone: "red", to: reportPath },
    { icon: ShieldAlert, label: "Missing Protections", count: analysis.missing_protections.length, to: reportPath },
    { icon: FileText, label: "Negotiation Suggestions", count: analysis.negotiation_suggestions.length, tone: "green", to: reportPath },
  ];

  return (
    <WorkspaceFrame documentId={documentId} active="insights">
      <header className="workspace-header">
        <div><h1>{analysis.file_name}</h1><p>{analysis.contract_type} · {analysis.risk_level}</p></div>
        <Link className="bare-icon" to={reportPath} aria-label="Open report" title="Open report"><MoreHorizontal size={18} /></Link>
      </header>
      <div className="insights-stage">
        <div className="score-block">
          <div className="score-dial" style={{ "--score": `${analysis.risk_score * 3.6}deg` }}>
            <div><strong>{analysis.risk_score}</strong><span>/100</span></div>
          </div>
          <b>{analysis.risk_level}</b>
        </div>
        <div className="insight-stats">{stats.map((stat) => <InsightStatItem {...stat} key={stat.label} />)}</div>
      </div>
      <div className="summary-strip" id="summary">
        <span>Plain-English summary</span>
        <p>{analysis.summary}</p>
      </div>
      <div className="workspace-actions">
        <Link className="workspace-cta" to={`/chat/${documentId}`}><MessageCircle size={17} />Chat with Contract<ChevronRight size={16} /></Link>
        <Link className="workspace-cta" to={reportPath}><ScrollText size={17} />View Report<ChevronRight size={16} /></Link>
        <button className="workspace-cta danger" onClick={removeDocument} disabled={deleting} aria-label="Delete this document and its analysis data"><Trash2 size={17} />{deleting ? "Deleting..." : "Delete Document"}<ChevronRight size={16} /></button>
      </div>
      {deleteError && <p className="workspace-delete-error">{deleteError}</p>}
    </WorkspaceFrame>
  );
}
