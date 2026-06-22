from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "LegalLens AI"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    frontend_url: str = "http://localhost:5173"
    cors_allowed_origins: str | None = None
    cors_allow_origin_regex: str | None = r"https://.*\.vercel\.app"
    api_debug: bool = False
    uploads_dir: Path = BASE_DIR / "uploads"
    data_dir: Path = BASE_DIR / "data"
    audit_log_path: Path = BASE_DIR / "data" / "audit.log"
    max_upload_size_bytes: int = 15 * 1024 * 1024
    document_auto_expire_hours: int = 24
    redact_pii_for_llm: bool = True
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60
    max_request_size_bytes: int = 20 * 1024 * 1024
    audit_hash_salt: str = "legal-lens-ai-local-salt"
    firebase_project_id: str | None = None
    firebase_service_account_json: str | None = None
    auth_required: bool = False
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_device: str = "cpu"
    embedding_warmup_on_start: bool = True

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
settings.uploads_dir.mkdir(parents=True, exist_ok=True)
settings.data_dir.mkdir(parents=True, exist_ok=True)
