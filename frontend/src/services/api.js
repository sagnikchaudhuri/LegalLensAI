import { getFirebaseIdToken } from "../auth/firebase";
import { recordDocumentAnalysis, recordDocumentUpload, removeDocumentHistory } from "../utils/historyStorage";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "")).replace(/\/$/, "");
const API_DEBUG = import.meta.env.VITE_API_DEBUG === "true";
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 30000);

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

function summarizeForDebug(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return { type: "array", count: value.length };
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (typeof item === "string") {
        return [key, key === "document_type" ? item : { type: "string", length: item.length }];
      }
      if (Array.isArray(item)) return [key, { type: "array", count: item.length }];
      if (item && typeof item === "object") return [key, { type: "object", keys: Object.keys(item) }];
      return [key, item];
    }),
  );
}

function debugRequest(event, details) {
  if (!API_DEBUG) return;
  // Keep debug output useful without logging document text or draft field values.
  console.debug(`[LegalLens API] ${event}`, details);
}

function requestPayloadForDebug(options) {
  if (!options.body || typeof options.body !== "string") return undefined;
  try {
    return summarizeForDebug(JSON.parse(options.body));
  } catch {
    return { type: "non-json", length: options.body.length };
  }
}

function responseBodyForDebug(payload) {
  if (!payload || typeof payload !== "object") return payload;
  return summarizeForDebug(payload);
}

async function userAuthHeaders(headers = {}) {
  const token = await getFirebaseIdToken();
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured. Set VITE_API_URL for this deployment.");
  }
  const headers = await userAuthHeaders(options.headers || {});
  const method = options.method || "GET";
  const url = `${API_URL}${path}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  debugRequest("request", { method, path, apiUrl: API_URL, payload: requestPayloadForDebug(options) });

  let response;
  let payload = {};
  let rawBody = "";
  try {
    response = await fetch(url, { ...options, headers, signal: controller.signal });
    rawBody = await response.text();
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    if (error?.name === "AbortError") {
      debugRequest("timeout", { method, path, timeoutMs: API_TIMEOUT_MS });
      throw new Error(`Backend request timed out after ${Math.round(API_TIMEOUT_MS / 1000)} seconds. Please retry.`);
    }
    debugRequest("network_error", { method, path, apiUrl: API_URL, message: error?.message });
    throw new Error(`Could not reach the LegalLens backend at ${API_URL}. Check VITE_API_URL, backend uptime, and CORS settings.`);
  } finally {
    window.clearTimeout(timeout);
  }

  debugRequest("response", {
    method,
    path,
    status: response.status,
    ok: response.ok,
    body: responseBodyForDebug(payload),
  });

  if (!response.ok) {
    throw new Error(safeErrorMessage(payload));
  }
  return payload;
}

function documentHeaders(documentId, headers = {}) {
  const token = readSession(tokenKey(documentId));
  if (!token) {
    throw new Error("Document access expired. Please upload the document again.");
  }
  return { ...headers, "X-Document-Token": token };
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
    recordDocumentUpload(uploaded);
    return uploaded;
  });
}

export function analyzeDocument(documentId) {
  return request(`/api/analyze/${documentId}`, {
    method: "POST",
    headers: documentHeaders(documentId),
  }).then((analysis) => {
    recordDocumentAnalysis(analysis);
    return analysis;
  });
}

export function getReport(documentId) {
  return request(`/api/report/${documentId}`, {
    headers: documentHeaders(documentId),
  }).then((analysis) => {
    recordDocumentAnalysis(analysis);
    return analysis;
  });
}

export function askQuestion(documentId, question) {
  return request(`/api/chat/${documentId}`, {
    method: "POST",
    headers: documentHeaders(documentId, { "Content-Type": "application/json" }),
    body: JSON.stringify({ question }),
  });
}

export function deleteDocument(documentId) {
  return request(`/api/documents/${documentId}`, {
    method: "DELETE",
    headers: documentHeaders(documentId),
  }).then((result) => {
    clearDocumentSession(documentId);
    removeDocumentHistory(documentId);
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
