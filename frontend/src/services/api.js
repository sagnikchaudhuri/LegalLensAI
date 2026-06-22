import { getFirebaseIdToken } from "../auth/firebase";
import { recordDocumentAnalysis, recordDocumentUpload, removeDocumentHistory } from "../utils/historyStorage";

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "")).replace(/\/$/, "");
const API_DEBUG = import.meta.env.VITE_API_DEBUG === "true";
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 30000);
const HEALTH_TIMEOUT_MS = 6000;

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

function isLocalApiUrl() {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(API_URL);
}

function isBrowserOnRemoteOrigin() {
  if (typeof window === "undefined") return false;
  return !["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function deploymentUrlMessage() {
  if (!API_URL) return "Backend API URL is not configured. Set VITE_API_URL to your Render backend origin.";
  if (!/^https?:\/\//i.test(API_URL)) return `Backend API URL "${API_URL}" is invalid. VITE_API_URL must start with http:// or https://.`;
  if (isLocalApiUrl() && isBrowserOnRemoteOrigin()) {
    return "This deployed frontend is still pointing to localhost. Set VITE_API_URL to https://legallensai-r17j.onrender.com in Vercel and redeploy.";
  }
  return "";
}

function statusErrorMessage(response, payload, rawBody) {
  const backendMessage = safeErrorMessage(payload);
  if (payload?.error?.message || typeof payload?.detail === "string") {
    return backendMessage;
  }
  if (response.status === 401) return "Authentication is missing or expired. Please sign in again and retry.";
  if (response.status === 403) return "Access was denied. Please re-open this document from your current upload session.";
  if (response.status === 404) return "The backend route was not found. Check that VITE_API_URL points to the Render backend origin, not the frontend URL.";
  if (response.status === 413) return "The request is too large for the backend upload limit.";
  if (response.status === 422) return "The backend rejected the request data. Please check the form fields and retry.";
  if ([502, 503, 504].includes(response.status)) {
    return "The Render backend is unavailable or still waking up. Wait a few seconds and retry.";
  }
  if (response.status >= 500) return "The backend returned a server error. Please retry after a moment.";
  if (rawBody) return `Backend returned HTTP ${response.status}: ${rawBody.slice(0, 140)}`;
  return `Backend returned HTTP ${response.status}.`;
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

async function parseResponseBody(response) {
  const rawBody = await response.text();
  if (!rawBody) return { payload: {}, rawBody: "" };
  try {
    return { payload: JSON.parse(rawBody), rawBody };
  } catch {
    return { payload: {}, rawBody };
  }
}

async function fetchHealthPath(path) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    return { response };
  } catch (error) {
    return { error };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function probeBackendHealth() {
  const urlIssue = deploymentUrlMessage();
  if (urlIssue) return { ok: false, message: urlIssue };

  const primary = await fetchHealthPath("/api/health");
  let result = primary;
  if (primary.response?.status === 404) {
    result = await fetchHealthPath("/");
  }

  if (result.response?.ok) return { ok: true, message: "Backend health check passed." };
  if (result.response && [502, 503, 504].includes(result.response.status)) {
    return { ok: false, message: "The Render backend is waking up or temporarily unavailable. Wait a few seconds and retry." };
  }
  if (result.response) {
    return { ok: false, message: `Backend health check returned HTTP ${result.response.status}. Verify the Render service is healthy.` };
  }
  if (result.error?.name === "AbortError") {
    return { ok: false, message: "The Render backend health check timed out. The service may be sleeping or still starting." };
  }
  return {
    ok: false,
    message: "The browser could not reach the backend health endpoint. Check VITE_API_URL, Render uptime, and CORS for this Vercel origin.",
  };
}

async function userAuthHeaders(headers = {}) {
  const token = await getFirebaseIdToken();
  if (!token) return headers;
  return { ...headers, Authorization: `Bearer ${token}` };
}

async function request(path, options = {}) {
  const urlIssue = deploymentUrlMessage();
  if (urlIssue) throw new Error(urlIssue);

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
  } catch (error) {
    if (error?.name === "AbortError") {
      debugRequest("timeout", { method, path, timeoutMs: API_TIMEOUT_MS });
      throw new Error(`Backend request timed out after ${Math.round(API_TIMEOUT_MS / 1000)} seconds. The Render service may be sleeping or still waking up.`);
    }
    debugRequest("network_error", { method, path, apiUrl: API_URL, message: error?.message });
    const health = await probeBackendHealth();
    if (health.ok) {
      throw new Error("Backend health is reachable, but this request was blocked before a response. Check CORS allowed origin, Authorization, X-Document-Token, and Content-Type headers.");
    }
    throw new Error(health.message);
  } finally {
    window.clearTimeout(timeout);
  }

  ({ payload, rawBody } = await parseResponseBody(response));

  debugRequest("response", {
    method,
    path,
    status: response.status,
    ok: response.ok,
    body: responseBodyForDebug(payload),
  });

  if (!response.ok) {
    throw new Error(statusErrorMessage(response, payload, rawBody));
  }
  if (rawBody && (!payload || typeof payload !== "object" || !Object.keys(payload).length)) {
    throw new Error("Backend returned a non-JSON response. Check that VITE_API_URL points to the FastAPI backend, not the frontend site.");
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

export function getBackendHealth() {
  return request("/api/health");
}
