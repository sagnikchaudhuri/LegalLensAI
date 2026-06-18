import { Download, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import WorkspaceFrame from "../components/WorkspaceFrame";
import { askQuestion } from "../services/api";

const suggestions = [
  "Can they terminate without notice?",
  "What is the payment schedule?",
  "Is there a confidentiality clause?",
  "What happens if either party breaches?",
];

export default function ChatPage() {
  const { documentId } = useParams();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Ask a question about this contract. Answers will include source citations when supporting text is found.", citations: [] },
  ]);

  const send = async (text = question) => {
    if (!text.trim() || loading) return;
    setMessages((current) => [...current, { role: "user", content: text }]);
    setQuestion("");
    setLoading(true);
    try {
      const response = await askQuestion(documentId, text);
      setMessages((current) => [...current, { role: "assistant", content: response.answer, citations: response.citations || [] }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error.message, citations: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkspaceFrame documentId={documentId} active="chat" className="chat-workspace">
      <header className="workspace-header">
        <div><h1>Chat with Contract</h1><p>Answers grounded only in your agreement</p></div>
        <Link className="bare-icon" to={`/report/${documentId}`} aria-label="Open report" title="Open report"><Download size={17} /></Link>
      </header>
      <div className="chat-layout">
        <aside className="chat-history">
          <h2>Suggested Questions</h2>
          {suggestions.map((item, index) => <button className={index === 0 ? "active" : ""} key={item} onClick={() => send(item)} disabled={loading}>{item}</button>)}
          <button className="clear-chat" onClick={() => setMessages([])}><Trash2 size={13} />Clear History</button>
        </aside>
        <section className="focused-chat">
          <div className="focused-messages">
            {messages.map((message, index) => (
              <div className={`focused-message ${message.role}`} key={`${message.role}-${index}`}>
                <p>{message.content}</p>
                {message.citations?.length > 0 && (
                  <div className="citation-list">
                    {message.citations.map((citation) => (
                      <span key={citation.chunk_id}>p. {citation.page || "n/a"} · {citation.source} · {citation.chunk_id}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="focused-message assistant"><p>Reviewing the contract...</p></div>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="focused-input" aria-label="Ask a question about the contract">
            <label className="sr-only" htmlFor="contract-question">Ask a question about the contract</label>
            <input id="contract-question" placeholder="Ask a question about the contract..." value={question} onChange={(event) => setQuestion(event.target.value)} autoComplete="off" />
            <button aria-label="Send question" disabled={loading || !question.trim()}><Send size={17} /></button>
          </form>
        </section>
      </div>
    </WorkspaceFrame>
  );
}
