import { ArrowLeft, Home, LogIn, LogOut, MoreVertical, PenLine, Settings, ShieldCheck, Upload, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import Brand from "./Brand";

export default function JourneyFrame({ children, backTo, menu = true, className = "" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");
  const menuRef = useRef(null);
  const { authError, loginWithGoogle, logout, user } = useAuth();

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
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
                onClick={() => setIsMenuOpen((open) => !open)}
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
                          <button type="button" role="menuitem" onClick={() => setMenuMessage("Your account details are shown above.")}>
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
                      <Link role="menuitem" to="/" onClick={closeMenu}><Home size={14} /> Home</Link>
                      <Link role="menuitem" to="/upload" onClick={closeMenu}><Upload size={14} /> Upload Document</Link>
                      <Link role="menuitem" to="/draft" onClick={closeMenu}><PenLine size={14} /> Drafting Studio</Link>
                    </section>

                    <section className="menu-section" aria-labelledby="settings-menu-heading">
                      <h2 id="settings-menu-heading">Settings</h2>
                      <button type="button" role="menuitem" onClick={() => setMenuMessage("Theme switching is coming soon. LegalLens is currently optimized for the dark premium theme.")}>
                        <Settings size={14} /> Theme
                      </button>
                      <button type="button" role="menuitem" onClick={() => setMenuMessage("Privacy & Security: documents use protected access tokens and can be deleted anytime.")}>
                        <ShieldCheck size={14} /> Privacy &amp; Security
                      </button>
                      <button type="button" role="menuitem" onClick={() => setMenuMessage("LegalLens AI provides informational contract intelligence and drafting support, not legal advice.")}>
                        <BrandMarkMini /> About LegalLens
                      </button>
                    </section>

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
