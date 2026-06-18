import hashlib
import json
from datetime import datetime, timezone

from app.config import settings


def client_ip_hash(ip: str | None) -> str:
    if not ip:
        ip = "unknown"
    return hashlib.sha256(f"{settings.audit_hash_salt}:{ip}".encode("utf-8")).hexdigest()[:16]


def audit_log(
    event_type: str,
    status: str,
    message: str,
    document_id: str | None = None,
    client_ip: str | None = None,
) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "document_id": document_id,
        "client_ip_hash": client_ip_hash(client_ip),
        "status": status,
        "message": message[:300],
    }
    settings.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
    with settings.audit_log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=True) + "\n")

