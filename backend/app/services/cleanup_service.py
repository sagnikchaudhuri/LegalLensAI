from datetime import datetime, timedelta, timezone

from app.config import settings
from app.rag.indexer import delete_index
from app.security.access_control import safe_document_paths
from app.security.audit_logger import audit_log
from app.utils.file_utils import load_json


def cleanup_expired_documents() -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.document_auto_expire_hours)
    deleted = 0
    for metadata_path in settings.data_dir.glob("*.json"):
        if metadata_path.name.endswith((".chunks.json", ".report.json")):
            continue
        try:
            metadata = load_json(metadata_path)
            created_at = datetime.fromisoformat(metadata.get("created_at"))
        except Exception:
            continue
        if created_at <= cutoff:
            document_id = metadata.get("document_id", metadata_path.stem)
            for path in safe_document_paths(document_id, metadata):
                path.unlink(missing_ok=True)
            delete_index(settings.data_dir, document_id)
            audit_log("delete", "success", "Expired document deleted by cleanup utility.", document_id=document_id)
            deleted += 1
    return deleted
