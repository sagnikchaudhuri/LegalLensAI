import { FilePenLine, FileText, Home, LogOut, MessageCircle, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";

import Brand from "./Brand";

export default function SidebarMini({ documentId, active }) {
  const hasDocument = documentId && documentId !== "draft";
  const items = [
    { id: "home", label: "Home", icon: Home, to: "/" },
    ...(hasDocument ? [
      { id: "insights", label: "Insights", icon: FileText, to: `/dashboard/${documentId}` },
      { id: "chat", label: "Chat", icon: MessageCircle, to: `/chat/${documentId}` },
      { id: "report", label: "Report", icon: ScrollText, to: `/report/${documentId}` },
    ] : []),
    { id: "draft", label: "Drafting Studio", icon: FilePenLine, to: "/draft" },
  ];
  return (
    <aside className="mini-sidebar">
      <Brand compact />
      <nav>
        {items.map(({ id, label, icon: Icon, to }) => (
          <Link key={id} to={to} className={active === id ? "active" : ""} aria-label={label} title={label}>
            <Icon size={17} strokeWidth={1.5} />
          </Link>
        ))}
      </nav>
      <Link to="/" aria-label="Exit"><LogOut size={17} strokeWidth={1.5} /></Link>
    </aside>
  );
}
