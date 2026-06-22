import { ArrowLeft, ChevronRight, Clock, FileText, LogIn, LogOut, MoreVertical, PenLine, Settings, ShieldCheck, Upload, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { hasDocumentAccess } from "../services/api";
import { getActivityHistory } from "../utils/historyStorage";
import Brand from "./Brand";

export default function JourneyFrame({ children, backTo, menu = true, className = "" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");
  const [activePanel, setActivePanel] = useState("");
  const [activityHistory, setActivityHistory] = useState({ documents: [], drafts: [] });
  const menuRef = useRef(null);
  const { authError, loginWithGoogle, logout, user } = useAuth();

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
        setActivePanel("");
        setMenuMessage("");
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setActivePanel("");
        setMenuMessage("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMenuMessage("");
    setActivePanel("");
  };

  const toggleMenu = () => {
    setIsMenuOpen((open) => {
      if (open) {
        setActivePanel("");
        setMenuMessage("");
      }
      return !open;
    });
  };

  const openAccountPanel = () => {
    setActivityHistory(getActivityHistory());
    setActivePanel("account");
    setMenuMessage("");
  };

  const openSettingsPanel = (panel) => {
    setActivePanel(panel);
    setMenuMessage("");
  };

  const handleLogin = async () => {
    setMenuMessage("");
    try {
      await loginWithGoogle();
      closeMenu();
    } catch {
      // AuthContext exposes the user-facing error text.
    }
  };

  const handleLogout = async () => {
    setMenuMessage("");
    await logout();
    closeMenu();
  };

  const displayName = user?.displayName || "LegalLens User";
  const email = user?.email || "Signed in with Google";
  const avatar = user?.photoURL;

  return (
    <motion.main
      className="journey-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.section
        className={`journey-frame ${className}`}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <header className="journey-topbar">
          {backTo ? <Link className="icon-link" to={backTo} aria-label="Go back"><ArrowLeft size={18} /></Link> : <Brand />}
          {menu && (
            <div className="topbar-menu" ref={menuRef}>
              <button
                className="bare-icon"
                type="button"
                aria-label="Open LegalLens user menu"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                title="User menu"
                onClick={toggleMenu}
              >
                <MoreVertical size={18} />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    className="topbar-menu-panel"
                    role="menu"
                    aria-label="LegalLens user menu"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    <section className="menu-section" aria-labelledby="account-menu-heading">
                      <h2 id="account-menu-heading">Account</h2>
                      {user ? (
                        <>
                          <div className="menu-account-card">
                            {avatar ? (
                              <img src={avatar} alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <span aria-hidden="true"><User size={15} /></span>
                            )}
                            <div>
                              <strong>{displayName}</strong>
                              <small>{email}</small>
                            </div>
                          </div>
                          <button type="button" role="menuitem" onClick={openAccountPanel} aria-expanded={activePanel === "account"}>
                            <User size={14} /> View Account
                          </button>
                          <button type="button" role="menuitem" onClick={handleLogout}>
                            <LogOut size={14} /> Logout
                          </button>
                        </>
                      ) : (
                        <button type="button" role="menuitem" onClick={handleLogin}>
                          <LogIn size={14} /> Login with Google
                        </button>
                      )}
                    </section>

                    <section className="menu-section" aria-labelledby="main-menu-heading">
                      <h2 id="main-menu-heading">Main Menu</h2>
                      <Link role="menuitem" to="/upload" onClick={closeMenu}><Upload size={14} /> Upload Document</Link>
                      <Link role="menuitem" to="/draft" onClick={closeMenu}><PenLine size={14} /> Drafting Studio</Link>
                    </section>

                    <section className="menu-section" aria-labelledby="settings-menu-heading">
                      <h2 id="settings-menu-heading">Settings</h2>
                      <button type="button" role="menuitem" onClick={() => openSettingsPanel("theme")} aria-expanded={activePanel === "theme"}>
                        <Settings size={14} /> Theme
                      </button>
                      <button type="button" role="menuitem" onClick={() => openSettingsPanel("privacy")} aria-expanded={activePanel === "privacy"}>
                        <ShieldCheck size={14} /> Privacy Policy
                      </button>
                      <button type="button" role="menuitem" onClick={() => openSettingsPanel("about")} aria-expanded={activePanel === "about"}>
                        <BrandMarkMini /> About LegalLens
                      </button>
                    </section>

                    {activePanel === "account" && (
                      <AccountHistoryPanel
                        avatar={avatar}
                        closeMenu={closeMenu}
                        displayName={displayName}
                        email={email}
                        history={activityHistory}
                        onClose={() => setActivePanel("")}
                      />
                    )}

                    {activePanel && activePanel !== "account" && (
                      <SettingsDetailPanel panel={activePanel} onClose={() => setActivePanel("")} />
                    )}

                    {(menuMessage || authError) && (
                      <p className="menu-status" role="status">{authError || menuMessage}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </header>
        {children}
      </motion.section>
    </motion.main>
  );
}

function BrandMarkMini() {
  return <span className="menu-brand-dot" aria-hidden="true">LL</span>;
}

function AccountHistoryPanel({ avatar, closeMenu, displayName, email, history, onClose }) {
  const documents = history.documents || [];
  const drafts = history.drafts || [];

  return (
    <section className="menu-detail-panel" aria-labelledby="account-history-heading">
      <PanelHeader id="account-history-heading" title="Account History" onClose={onClose} />
      <div className="account-history-card">
        {avatar ? (
          <img src={avatar} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span aria-hidden="true"><User size={15} /></span>
        )}
        <div>
          <strong>{displayName}</strong>
          <small>{email}</small>
        </div>
      </div>

      <HistorySection title="Uploaded Documents" emptyText="No uploaded documents yet.">
        {documents.map((item) => (
          <article className="activity-item" key={item.document_id}>
            <FileText size={15} />
            <div>
              <strong>{item.filename || "Uploaded document"}</strong>
              <small>
                {item.document_type || "Document"}
                {item.uploaded_at ? ` - ${formatMenuDate(item.uploaded_at)}` : ""}
              </small>
              {item.last_opened_at && <em>Last opened {formatMenuDate(item.last_opened_at)}</em>}
            </div>
            {typeof item.risk_score === "number" && <span className="risk-chip">{item.risk_score}</span>}
            {item.document_id && hasDocumentAccess(item.document_id) ? (
              <Link className="activity-action" to={`/dashboard/${item.document_id}`} onClick={closeMenu} aria-label={`Open ${item.filename || "document"}`}>
                <ChevronRight size={14} />
              </Link>
            ) : (
              <span className="activity-muted">Access expired</span>
            )}
          </article>
        ))}
      </HistorySection>

      <HistorySection title="Drafting History" emptyText="No drafting history yet.">
        {drafts.map((item) => (
          <article className="activity-item" key={item.draft_session_id}>
            <PenLine size={15} />
            <div>
              <strong>{item.draft_type || "Legal draft"}</strong>
              <small>Version {item.latest_version || 1}</small>
              {item.updated_at && <em>Updated {formatMenuDate(item.updated_at)}</em>}
            </div>
            <Link className="activity-action" to="/draft" onClick={closeMenu} aria-label={`Open ${item.draft_type || "Drafting Studio"}`}>
              <ChevronRight size={14} />
            </Link>
          </article>
        ))}
      </HistorySection>
    </section>
  );
}

function HistorySection({ children, emptyText, title }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);
  return (
    <div className="history-section">
      <h3>{title}</h3>
      {hasItems ? items : <p className="history-empty">{emptyText}</p>}
    </div>
  );
}

function SettingsDetailPanel({ panel, onClose }) {
  const content = {
    theme: {
      title: "Theme",
      icon: Settings,
      lines: ["Current theme: Dark.", "Theme switching coming soon."],
    },
    privacy: {
      title: "Privacy Policy",
      icon: ShieldCheck,
      lines: [
        "Documents are processed for analysis.",
        "Sensitive files can be deleted anytime.",
        "AI output is informational and not legal advice.",
      ],
    },
    about: {
      title: "About LegalLens",
      icon: Clock,
      lines: [
        "LegalLens AI is a Contract Intelligence & Drafting Copilot.",
        "It helps users review, understand, chat with, and draft legal documents.",
        "It is not a substitute for a lawyer.",
      ],
    },
  }[panel];

  if (!content) return null;
  const Icon = content.icon;
  return (
    <section className="menu-detail-panel settings-detail-panel" aria-labelledby={`${panel}-settings-heading`}>
      <PanelHeader id={`${panel}-settings-heading`} title={content.title} onClose={onClose} />
      <div className="settings-copy">
        <Icon size={18} />
        <div>
          {content.lines.map((line) => <p key={line}>{line}</p>)}
        </div>
      </div>
    </section>
  );
}

function PanelHeader({ id, onClose, title }) {
  return (
    <div className="menu-detail-header">
      <h2 id={id}>{title}</h2>
      <button type="button" className="menu-detail-close" onClick={onClose} aria-label={`Close ${title}`}>
        <X size={13} />
      </button>
    </div>
  );
}

function formatMenuDate(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
