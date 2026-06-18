import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function InsightStatItem({ icon: Icon, label, count, tone = "gold", to }) {
  const content = (
    <>
      <span className="stat-icon"><Icon size={16} strokeWidth={1.5} /></span>
      <span>{label}</span>
      {count !== undefined && <b className={`stat-count ${tone}`}>{count}</b>}
      {count === undefined && <ChevronRight size={15} />}
    </>
  );
  if (!to) return <div className="insight-stat">{content}</div>;
  if (to.startsWith("#")) return <a className="insight-stat" href={to} aria-label={`Open ${label}`}>{content}</a>;
  return <Link className="insight-stat" to={to} aria-label={`Open ${label}`}>{content}</Link>;
}
