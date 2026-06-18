import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function AnalyzeLoader({ progress, status }) {
  return (
    <div className="analyze-loader">
      <div className="analyze-dial">
        <motion.span
          className="analyze-arc"
          style={{ "--progress": `${progress * 3.6}deg` }}
          animate={{ rotate: [0, 2, 0] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <div className="analyze-center">
          <Sparkles size={23} strokeWidth={1.2} />
          <h2>Analyzing Contract</h2>
          <strong>{progress}<small>%</small></strong>
        </div>
      </div>
      <p>{status}</p>
    </div>
  );
}

