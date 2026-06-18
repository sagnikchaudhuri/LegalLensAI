import { motion } from "framer-motion";

import SidebarMini from "./SidebarMini";

export default function WorkspaceFrame({ documentId, active, children, className = "" }) {
  return (
    <motion.main
      className="journey-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.section
        className={`workspace-frame ${className}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
      >
        <SidebarMini documentId={documentId} active={active} />
        <div className="workspace-content">
          <p className="mobile-security-note">
            Documents are processed securely. AI output is informational, not legal advice, and documents can be deleted anytime.
          </p>
          {children}
        </div>
      </motion.section>
    </motion.main>
  );
}
