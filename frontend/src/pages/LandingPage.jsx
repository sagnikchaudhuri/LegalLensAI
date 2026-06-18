import { motion } from "framer-motion";

import FooterDisclaimer from "../components/FooterDisclaimer";
import JourneyFrame from "../components/JourneyFrame";
import LensHero from "../components/LensHero";

export default function LandingPage() {
  return (
    <JourneyFrame className="landing-frame">
      <div className="landing-stage">
        <motion.div
          className="landing-copy"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
        >
          <h1>Understand<br />contracts <em>before</em><br />you sign.</h1>
          <p>Upload any legal document and get AI-powered insights, risk analysis, and plain-English explanations in seconds.</p>
        </motion.div>
        <LensHero />
      </div>
      <FooterDisclaimer />
    </JourneyFrame>
  );
}

