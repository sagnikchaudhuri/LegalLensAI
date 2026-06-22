import { Copy, FilePenLine, WandSparkles } from "lucide-react";
import { useState } from "react";

import WorkspaceFrame from "../components/WorkspaceFrame";
import { generateDraft } from "../services/api";
import { recordDraftGeneration } from "../utils/historyStorage";

const documentTypes = [
  "NDA",
  "Service Agreement",
  "Freelance Contract",
  "Employment Agreement",
  "Internship Agreement",
  "Legal Notice",
  "Privacy Policy",
  "Terms & Conditions",
];

export default function DraftPage() {
  const [form, setForm] = useState({
    document_type: "NDA",
    party_names: "Client, Contractor",
    purpose: "",
    payment: "",
    duration: "",
    jurisdiction: "",
    special_clauses: "",
  });
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setDraft(null);
    try {
      const payload = {
        ...form,
        party_names: form.party_names.split(",").map((item) => item.trim()).filter(Boolean),
        special_clauses: form.special_clauses.split("\n").map((item) => item.trim()).filter(Boolean),
      };
      const generatedDraft = await generateDraft(payload);
      setDraft(generatedDraft);
      recordDraftGeneration(payload.document_type);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkspaceFrame documentId="draft" active="draft" className="draft-workspace">
      <header className="workspace-header">
        <div><h1>Generate Legal Document</h1><p>Drafting Studio · structured legal templates</p></div>
        <span className="draft-badge"><FilePenLine size={14} /> Draft</span>
      </header>
      <div className="draft-layout">
        <form className="draft-form" onSubmit={submit}>
          <label htmlFor="document-type">Document Type</label>
          <select id="document-type" value={form.document_type} onChange={(event) => update("document_type", event.target.value)}>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select>
          <label htmlFor="party-names">Party Names</label>
          <input id="party-names" value={form.party_names} onChange={(event) => update("party_names", event.target.value)} placeholder="Client, Contractor" />
          <label htmlFor="draft-purpose">Purpose</label>
          <textarea id="draft-purpose" value={form.purpose} onChange={(event) => update("purpose", event.target.value)} placeholder="Explain the purpose of the document..." required />
          <label htmlFor="draft-payment">Payment</label>
          <input id="draft-payment" value={form.payment} onChange={(event) => update("payment", event.target.value)} placeholder="Example: INR 50,000 due within 15 days" />
          <label htmlFor="draft-duration">Duration</label>
          <input id="draft-duration" value={form.duration} onChange={(event) => update("duration", event.target.value)} placeholder="Example: 12 months" />
          <label htmlFor="draft-jurisdiction">Jurisdiction</label>
          <input id="draft-jurisdiction" value={form.jurisdiction} onChange={(event) => update("jurisdiction", event.target.value)} placeholder="Example: India" required />
          <label htmlFor="special-clauses">Special Clauses</label>
          <textarea id="special-clauses" value={form.special_clauses} onChange={(event) => update("special_clauses", event.target.value)} placeholder="One clause per line" />
          {error && <p className="draft-error">{error}</p>}
          <button className="download-report" disabled={loading}><WandSparkles size={16} />{loading ? "Generating..." : "Generate Draft"}</button>
        </form>
        <section className="draft-output">
          {draft ? (
            <>
              <button className="share-report" onClick={() => navigator.clipboard?.writeText(draft.full_draft)} aria-label="Copy generated draft"><Copy size={14} />Copy Draft</button>
              <pre>{draft.full_draft}</pre>
              <div className="draft-notes">
                {draft.clause_explanations.map((item) => <p key={item.title}><b>{item.title}</b>{item.explanation}</p>)}
                {draft.risk_notes.map((note) => <p key={note}><b>Risk</b>{note}</p>)}
              </div>
            </>
          ) : (
            <div className="draft-empty">Select a document type, fill the form, and generate a structured legal draft.</div>
          )}
        </section>
      </div>
    </WorkspaceFrame>
  );
}
