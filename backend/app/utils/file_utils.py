import json
import re
import zipfile
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import settings


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {
    ".pdf": {"application/pdf"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".txt": {"text/plain", "application/octet-stream"},
    ".png": {"image/png"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
}
DANGEROUS_EXTENSIONS = {
    ".exe", ".dll", ".bat", ".cmd", ".ps1", ".sh", ".js", ".vbs",
    ".scr", ".msi", ".zip", ".rar", ".7z", ".tar", ".gz",
}


def sanitize_filename(filename: str | None) -> str:
    name = Path(filename or "document").name
    stem = re.sub(r"[^A-Za-z0-9._ -]", "_", Path(name).stem).strip(" ._")
    extension = Path(name).suffix.lower()
    stem = stem[:80] or "document"
    return f"{stem}{extension}"


async def validate_and_save_upload(file: UploadFile, destination: Path) -> tuple[str, str]:
    original_name = sanitize_filename(file.filename)
    extension = Path(original_name).suffix.lower()
    if extension in DANGEROUS_EXTENSIONS or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported or unsafe file type.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail="File size exceeds the configured upload limit.")

    detected_extension = _detect_extension(content, extension)
    if detected_extension != extension:
        raise HTTPException(status_code=400, detail="File type does not match the uploaded file content.")

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES[extension]:
        if not (extension == ".txt" and content_type.startswith("text/")):
            raise HTTPException(status_code=400, detail="Unsupported file MIME type.")

    destination.write_bytes(content)
    return extension, original_name


def validate_upload(file: UploadFile) -> str:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported or unsafe file type.")
    return extension


async def save_upload(file: UploadFile, destination: Path) -> None:
    await validate_and_save_upload(file, destination)


def _detect_extension(content: bytes, claimed_extension: str) -> str:
    if content.startswith(b"%PDF"):
        return ".pdf"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg" if claimed_extension == ".jpg" else ".jpeg"
    if content.startswith(b"MZ") or content.startswith(b"#!"):
        raise HTTPException(status_code=400, detail="Executable or script files are not allowed.")
    if zipfile.is_zipfile(BytesIO(content)):
        return ".docx" if _is_docx(content) else _reject_archive()
    if claimed_extension == ".txt" and _looks_like_text(content):
        return ".txt"
    raise HTTPException(status_code=400, detail="Unknown or unsupported file content.")


def _is_docx(content: bytes) -> bool:
    try:
        with zipfile.ZipFile(BytesIO(content)) as archive:
            names = set(archive.namelist())
        return "[Content_Types].xml" in names and "word/document.xml" in names
    except Exception:
        return False


def _reject_archive() -> str:
    raise HTTPException(status_code=400, detail="Archive files are not allowed.")


def _looks_like_text(content: bytes) -> bool:
    sample = content[:4096]
    if b"\x00" in sample:
        return False
    try:
        sample.decode("utf-8")
        return True
    except UnicodeDecodeError:
        try:
            sample.decode("utf-16")
            return True
        except UnicodeDecodeError:
            return False


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def save_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")


def load_json(path: Path) -> dict:
    if not path.exists():
        raise HTTPException(status_code=404, detail="Document not found.")
    return json.loads(path.read_text(encoding="utf-8"))
