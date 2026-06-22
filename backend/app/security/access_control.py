import hashlib
import hmac
import re
import secrets
from pathlib import Path

from fastapi import Header, HTTPException

from app.config import settings
from app.utils.file_utils import load_json


DOCUMENT_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{16,128}$")


def generate_document_id() -> str:
    return secrets.token_urlsafe(24)


def generate_access_token() -> str:
    return secrets.token_urlsafe(32)


def hash_access_token(token: str) -> str:
    material = f"{settings.audit_hash_salt}:{token}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def require_document_access(
    document_id: str,
    authorization: str | None = Header(default=None),
    x_document_token: str | None = Header(default=None),
) -> dict:
    if not DOCUMENT_ID_PATTERN.fullmatch(document_id):
        raise HTTPException(status_code=404, detail="Document not found.")

    token = (x_document_token or "").strip()
    if not token and not settings.auth_required and authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(status_code=401, detail="Document access token is required.")

    metadata_path = settings.data_dir / f"{document_id}.json"
    metadata = load_json(metadata_path)
    expected_hash = metadata.get("access_token_hash")
    if not expected_hash or not hmac.compare_digest(hash_access_token(token), expected_hash):
        raise HTTPException(status_code=403, detail="Invalid document access token.")
    return metadata


def safe_document_paths(document_id: str, metadata: dict) -> list[Path]:
    paths = [
        settings.data_dir / f"{document_id}.json",
        settings.data_dir / f"{document_id}.chunks.json",
        settings.data_dir / f"{document_id}.report.json",
    ]
    stored_file = metadata.get("stored_file")
    if stored_file:
        candidate = settings.uploads_dir / Path(stored_file).name
        paths.append(candidate)
    return paths
