from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.agents.drafting_agent import DraftingAgent
from app.agents.legal_qa_agent import LegalQAAgent
from app.config import settings
from app.models.schemas import (
    AnalysisResponse,
    ChatRequest,
    ChatResponse,
    DeleteResponse,
    DraftRequest,
    DraftResponse,
    UploadResponse,
)
from app.rag.indexer import create_index, delete_index
from app.rag.retriever import retrieve
from app.security.access_control import (
    generate_access_token,
    generate_document_id,
    hash_access_token,
    require_document_access,
    safe_document_paths,
)
from app.security.audit_logger import audit_log
from app.security.firebase_auth import enforce_document_owner, firebase_user_id, require_user_auth
from app.security.prompt_guard import detect_prompt_injection
from app.services.cleanup_service import cleanup_expired_documents
from app.services.document_service import extract_document
from app.services.report_service import build_analysis
from app.templates.legal_templates import DOCUMENT_TYPES
from app.utils.file_utils import load_json, save_json, validate_and_save_upload


router = APIRouter(prefix="/api")


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    user: dict = Depends(require_user_auth),
):
    cleanup_expired_documents()
    document_id = generate_document_id()
    access_token = generate_access_token()
    destination = settings.uploads_dir / f"{document_id}{Path(file.filename or '').suffix.lower()}"
    extension, safe_original_name = await validate_and_save_upload(file, destination)
    destination = settings.uploads_dir / f"{document_id}{extension}"
    if destination.name != f"{document_id}{Path(file.filename or '').suffix.lower()}":
        (settings.uploads_dir / f"{document_id}{Path(file.filename or '').suffix.lower()}").rename(destination)

    try:
        extracted = extract_document(destination)
    except Exception:
        destination.unlink(missing_ok=True)
        audit_log("upload", "failed", "Document extraction failed.", document_id=document_id, client_ip=_client_ip(request))
        raise

    injection_findings = detect_prompt_injection(extracted["text"])
    if injection_findings:
        audit_log(
            "security_warning",
            "warning",
            f"Prompt-injection-like text detected: {len(injection_findings)} pattern(s).",
            document_id=document_id,
            client_ip=_client_ip(request),
        )

    metadata = {
        "document_id": document_id,
        "file_name": safe_original_name,
        "stored_file": destination.name,
        "text": extracted["text"],
        "pages": extracted["pages"],
        "ocr_used": extracted["ocr_used"],
        "access_token_hash": hash_access_token(access_token),
        "owner_uid": firebase_user_id(user) if settings.auth_required else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "prompt_injection_flags": injection_findings,
    }
    try:
        save_json(settings.data_dir / f"{document_id}.json", metadata)
        create_index(
            document_id,
            extracted["text"],
            settings.data_dir,
            pages=extracted["pages"],
            source_filename=metadata["file_name"],
        )
    except Exception as exc:
        for path in safe_document_paths(document_id, metadata):
            path.unlink(missing_ok=True)
        audit_log("upload", "failed", "Document indexing failed.", document_id=document_id, client_ip=_client_ip(request))
        raise HTTPException(
            status_code=503,
            detail="Document indexing is unavailable. Please retry after setup is complete.",
        ) from exc
    audit_log("upload", "success", "Document uploaded and indexed.", document_id=document_id, client_ip=_client_ip(request))
    return UploadResponse(
        document_id=document_id,
        access_token=access_token,
        file_name=metadata["file_name"],
        extracted_text_preview=extracted["text"][:500],
        ocr_used=extracted["ocr_used"],
    )


@router.post("/analyze/{document_id}", response_model=AnalysisResponse)
def analyze_document(
    request: Request,
    metadata: dict = Depends(require_document_access),
    user: dict = Depends(require_user_auth),
):
    enforce_document_owner(metadata, user)
    document_id = metadata["document_id"]
    report = build_analysis(document_id, metadata["file_name"], metadata["text"])
    save_json(settings.data_dir / f"{document_id}.report.json", report)
    audit_log("analyze", "success", "Document analysis generated.", document_id=document_id, client_ip=_client_ip(request))
    return report


@router.post("/chat/{document_id}", response_model=ChatResponse)
def chat_with_document(
    request: Request,
    payload: ChatRequest,
    metadata: dict = Depends(require_document_access),
    user: dict = Depends(require_user_auth),
):
    enforce_document_owner(metadata, user)
    document_id = metadata["document_id"]
    contexts = retrieve(document_id, payload.question, settings.data_dir)
    qa = LegalQAAgent().run(payload.question, contexts)
    audit_log("chat", "success", "Document question answered.", document_id=document_id, client_ip=_client_ip(request))
    return ChatResponse(
        answer=qa.answer,
        citations=qa.citations,
        sources=[context["text"] for context in contexts[:2]],
    )


@router.get("/report/{document_id}", response_model=AnalysisResponse)
def get_report(
    request: Request,
    metadata: dict = Depends(require_document_access),
    user: dict = Depends(require_user_auth),
):
    enforce_document_owner(metadata, user)
    document_id = metadata["document_id"]
    report_path = settings.data_dir / f"{document_id}.report.json"
    audit_log("report", "success", "Document report requested.", document_id=document_id, client_ip=_client_ip(request))
    return load_json(report_path)


@router.delete("/documents/{document_id}", response_model=DeleteResponse)
def delete_document(
    request: Request,
    metadata: dict = Depends(require_document_access),
    user: dict = Depends(require_user_auth),
):
    enforce_document_owner(metadata, user)
    document_id = metadata["document_id"]
    for path in safe_document_paths(document_id, metadata):
        path.unlink(missing_ok=True)
    delete_index(settings.data_dir, document_id)
    audit_log("delete", "success", "Document data deleted.", document_id=document_id, client_ip=_client_ip(request))
    return DeleteResponse(document_id=document_id, deleted=True)


@router.get("/draft/types")
def get_draft_types(request: Request, user: dict = Depends(require_user_auth)):
    audit_log("draft", "success", "Draft types requested.", client_ip=_client_ip(request))
    return {"document_types": DOCUMENT_TYPES}


@router.post("/draft", response_model=DraftResponse)
def generate_draft(
    request: Request,
    payload: DraftRequest,
    user: dict = Depends(require_user_auth),
):
    response = DraftingAgent().run(payload).draft
    audit_log("draft", "success", "Draft generated.", client_ip=_client_ip(request))
    return response
