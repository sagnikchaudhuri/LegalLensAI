import { ShieldCheck } from "lucide-react";

export default function FooterDisclaimer() {
  return (
    <div className="footer-disclaimer">
      <ShieldCheck size={23} strokeWidth={1.3} />
      <p>LegalLens AI helps you understand legal documents faster.<br />It does not provide legal advice.</p>
    </div>
  );
}

