const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const tokenKey = (documentId) => `documentToken:${documentId}`;
const analysisKey = (documentId) => `analysis:${documentId}`;

function readSession(key) {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(key);
}

function writeSession(key, value) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(key, value);
}

function removeSession(key) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(key);
}

function safeErrorMessage(payload) {
  if (payload?.error?.message) return payload.error.message;
  if (typeof payload?.detail === "string") return payload.detail;
  return "Something went wrong. Please try again.";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(safeErrorMessage(payload));
  }
  return response.json();
}

function authHeaders(documentId, headers = {}) {
  const token = readSession(tokenKey(documentId));
  if (!token) {
    throw new Error("Document access expired. Please upload the document again.");
  }
  return { ...headers, Authorization: `Bearer ${token}` };
}

export function getAnalysisCacheKey(documentId) {
  return analysisKey(documentId);
}

export function hasDocumentAccess(documentId) {
  return Boolean(readSession(tokenKey(documentId)));
}

export function clearDocumentSession(documentId) {
  removeSession(tokenKey(documentId));
  removeSession(analysisKey(documentId));
}

export function uploadDocument(file) {
  const body = new FormData();
  body.append("file", file);
  return request("/api/upload", { method: "POST", body }).then((uploaded) => {
    writeSession(tokenKey(uploaded.document_id), uploaded.access_token);
    return uploaded;
  });
}

export function analyzeDocument(documentId) {
  return request(`/api/analyze/${documentId}`, {
    method: "POST",
    headers: authHeaders(documentId),
  });
}

export function getReport(documentId) {
  return request(`/api/report/${documentId}`, {
    headers: authHeaders(documentId),
  });
}

export function askQuestion(documentId, question) {
  return request(`/api/chat/${documentId}`, {
    method: "POST",
    headers: authHeaders(documentId, { "Content-Type": "application/json" }),
    body: JSON.stringify({ question }),
  });
}

export function deleteDocument(documentId) {
  return request(`/api/documents/${documentId}`, {
    method: "DELETE",
    headers: authHeaders(documentId),
  }).then((result) => {
    clearDocumentSession(documentId);
    return result;
  });
}

export function getDraftTypes() {
  return request("/api/draft/types");
}

export function generateDraft(payload) {
  return request("/api/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
