import { useEffect, useState } from "react";

import { getAnalysisCacheKey, getReport, hasDocumentAccess } from "../services/api";

export function useAnalysis(documentId) {
  const [analysis, setAnalysis] = useState(() => {
    if (!documentId || !hasDocumentAccess(documentId)) return null;
    const cached = sessionStorage.getItem(getAnalysisCacheKey(documentId));
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!analysis);
  const [error, setError] = useState("");

  useEffect(() => {
    if (analysis || !documentId) return;
    if (!hasDocumentAccess(documentId)) {
      setError("Document access expired. Please upload the document again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    getReport(documentId)
      .then((data) => {
        setAnalysis(data);
        sessionStorage.setItem(getAnalysisCacheKey(documentId), JSON.stringify(data));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [analysis, documentId]);

  return { analysis, loading, error };
}
