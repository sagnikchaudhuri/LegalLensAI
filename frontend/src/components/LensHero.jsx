import { Scale } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LensHero() {
  const navigate = useNavigate();
  return (
    <motion.button
      className="lens-trigger"
      aria-label="Analyze a contract"
      onClick={() => navigate("/upload")}
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="lens-visual">
        <span className="lens-corners" />
        <span className="lens-orbit" />
        <span className="lens-core"><Scale size={72} strokeWidth={0.8} /></span>
        <span className="lens-label">Click to analyze</span>
      </span>
    </motion.button>
  );
}
