export const DOCUMENT_HISTORY_KEY = "legalLensDocumentHistory";
export const DRAFT_HISTORY_KEY = "legalLensDraftHistory";

const MAX_HISTORY_ITEMS = 12;

function readList(key) {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, items) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
}

function createDraftSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now().toString(36)}`;
}

export function getDocumentHistory() {
  return readList(DOCUMENT_HISTORY_KEY);
}

export function getDraftHistory() {
  return readList(DRAFT_HISTORY_KEY);
}

export function getActivityHistory() {
  return {
    documents: getDocumentHistory(),
    drafts: getDraftHistory(),
  };
}

export function recordDocumentUpload(uploaded) {
  if (!uploaded?.document_id) return;
  const now = new Date().toISOString();
  const current = getDocumentHistory();
  const existing = current.find((item) => item.document_id === uploaded.document_id);
  const updated = {
    document_id: uploaded.document_id,
    filename: uploaded.file_name || existing?.filename || "Uploaded document",
    document_type: existing?.document_type || "",
    uploaded_at: existing?.uploaded_at || now,
    risk_score: existing?.risk_score ?? null,
    last_opened_at: now,
  };
  writeList(DOCUMENT_HISTORY_KEY, [updated, ...current.filter((item) => item.document_id !== uploaded.document_id)]);
}

export function recordDocumentAnalysis(analysis) {
  if (!analysis?.document_id) return;
  const now = new Date().toISOString();
  const current = getDocumentHistory();
  const existing = current.find((item) => item.document_id === analysis.document_id);
  const updated = {
    document_id: analysis.document_id,
    filename: analysis.file_name || existing?.filename || "Analyzed document",
    document_type: analysis.contract_type || existing?.document_type || "",
    uploaded_at: existing?.uploaded_at || now,
    risk_score: typeof analysis.risk_score === "number" ? analysis.risk_score : existing?.risk_score ?? null,
    last_opened_at: now,
  };
  writeList(DOCUMENT_HISTORY_KEY, [updated, ...current.filter((item) => item.document_id !== analysis.document_id)]);
}

export function removeDocumentHistory(documentId) {
  if (!documentId) return;
  writeList(DOCUMENT_HISTORY_KEY, getDocumentHistory().filter((item) => item.document_id !== documentId));
}

export function recordDraftGeneration(draftType) {
  if (!draftType) return;
  const now = new Date().toISOString();
  const current = getDraftHistory();
  const existing = current.find((item) => item.draft_type === draftType);
  const updated = {
    draft_session_id: existing?.draft_session_id || createDraftSessionId(),
    draft_type: draftType,
    latest_version: Number(existing?.latest_version || 0) + 1,
    updated_at: now,
  };
  writeList(DRAFT_HISTORY_KEY, [updated, ...current.filter((item) => item.draft_type !== draftType)]);
}
