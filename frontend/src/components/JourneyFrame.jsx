import { ArrowLeft, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import Brand from "./Brand";

export default function JourneyFrame({ children, backTo, menu = true, className = "" }) {
  const navigate = useNavigate();
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
          {menu && <button className="bare-icon" aria-label="Start new analysis" title="Start new analysis" onClick={() => navigate("/upload")}><MoreVertical size={18} /></button>}
        </header>
        {children}
      </motion.section>
    </motion.main>
  );
}
