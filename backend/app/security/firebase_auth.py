import json
from functools import lru_cache

from fastapi import Header, HTTPException

from app.config import settings


@lru_cache(maxsize=1)
def _firebase_auth():
    try:
        import firebase_admin
        from firebase_admin import auth, credentials
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Firebase authentication is not installed on this backend.",
        ) from exc

    if not settings.firebase_project_id and not settings.firebase_service_account_json:
        raise HTTPException(
            status_code=500,
            detail="Firebase authentication is not configured on this backend.",
        )

    if not firebase_admin._apps:
        options = {}
        if settings.firebase_project_id:
            options["projectId"] = settings.firebase_project_id

        if settings.firebase_service_account_json:
            try:
                service_account = json.loads(settings.firebase_service_account_json)
            except json.JSONDecodeError as exc:
                raise HTTPException(
                    status_code=500,
                    detail="Firebase service account JSON is invalid.",
                ) from exc
            firebase_admin.initialize_app(credentials.Certificate(service_account), options)
        else:
            firebase_admin.initialize_app(options=options)

    return auth


def _verify_id_token(token: str) -> dict:
    try:
        return _firebase_auth().verify_id_token(token, check_revoked=False)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired login session.") from exc


def require_user_auth(authorization: str | None = Header(default=None)) -> dict:
    if not settings.auth_required:
        return {"uid": "local-dev", "auth_disabled": True}

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="User login is required.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="User login is required.")

    decoded = _verify_id_token(token)
    uid = decoded.get("uid") or decoded.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid login session.")
    return decoded


def firebase_user_id(user: dict) -> str | None:
    return user.get("uid") or user.get("sub")


def enforce_document_owner(metadata: dict, user: dict) -> None:
    if not settings.auth_required:
        return

    owner_uid = metadata.get("owner_uid")
    current_uid = firebase_user_id(user)
    if owner_uid and current_uid and owner_uid != current_uid:
        raise HTTPException(status_code=403, detail="You do not have access to this document.")
