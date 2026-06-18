import { Scale } from "lucide-react";
import { Link } from "react-router-dom";

export default function Brand({ compact = false }) {
  return (
    <Link className={`brand ${compact ? "brand-compact" : ""}`} to="/">
      <span className="brand-mark"><Scale size={compact ? 17 : 15} strokeWidth={1.6} /></span>
      {!compact && <span>LegalLens <b>AI</b></span>}
    </Link>
  );
}

