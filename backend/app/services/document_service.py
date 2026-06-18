from pathlib import Path

import fitz
from docx import Document
from fastapi import HTTPException

from app.services.ocr_service import ocr_image_path, ocr_pdf_page
from app.utils.file_utils import clean_text


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def extract_document(path: Path) -> dict:
    extension = path.suffix.lower()
    try:
        if extension == ".pdf":
            pages, ocr_used = _extract_pdf_pages(path)
        elif extension == ".docx":
            document = Document(path)
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
            pages, ocr_used = [{"page_number": 1, "text": clean_text(text)}], False
        elif extension == ".txt":
            text = path.read_text(encoding="utf-8", errors="ignore")
            pages, ocr_used = [{"page_number": 1, "text": clean_text(text)}], False
        elif extension in IMAGE_EXTENSIONS:
            pages, ocr_used = [{"page_number": 1, "text": clean_text(ocr_image_path(path))}], True
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail="The document could not be read. It may be corrupted or unsupported.",
        ) from exc

    pages = [page for page in pages if page["text"]]
    text = clean_text("\n\n".join(page["text"] for page in pages))
    if len(text) < 40:
        raise HTTPException(
            status_code=422,
            detail="Not enough readable text was found after text extraction and OCR.",
        )
    return {"text": text, "pages": pages, "ocr_used": ocr_used}


def extract_text(path: Path) -> str:
    return extract_document(path)["text"]


def _extract_pdf_pages(path: Path) -> tuple[list[dict], bool]:
    pages = []
    ocr_used = False
    with fitz.open(path) as document:
        for index, page in enumerate(document, start=1):
            text = clean_text(page.get_text())
            if len(text) < 30:
                ocr_text = clean_text(ocr_pdf_page(page))
                if ocr_text:
                    ocr_used = True
                    text = clean_text(f"{text}\n{ocr_text}")
            pages.append({"page_number": index, "text": text})
    return pages, ocr_used


def split_into_chunks(text: str, chunk_size: int = 1200, overlap: int = 180) -> list[str]:
    return [chunk["text"] for chunk in _split_text(text, chunk_size, overlap)]


def split_pages_into_chunks(
    pages: list[dict],
    document_id: str,
    source_filename: str,
    chunk_size: int = 1200,
    overlap: int = 180,
) -> list[dict]:
    chunks: list[dict] = []
    for page in pages:
        for chunk in _split_text(page["text"], chunk_size, overlap):
            chunk_id = f"{document_id}:{len(chunks):04d}"
            chunks.append(
                {
                    "chunk_id": chunk_id,
                    "text": chunk["text"],
                    "page_number": page.get("page_number"),
                    "source": source_filename,
                }
            )
    return chunks


def _split_text(text: str, chunk_size: int, overlap: int) -> list[dict]:
    chunks: list[dict] = []
    cursor = 0
    text = clean_text(text)
    while cursor < len(text):
        end = min(cursor + chunk_size, len(text))
        if end < len(text):
            paragraph_end = text.rfind("\n", cursor, end)
            sentence_end = text.rfind(". ", cursor, end)
            end = max(paragraph_end, sentence_end + 1, cursor + chunk_size // 2)
        chunk_text = text[cursor:end].strip()
        if chunk_text:
            chunks.append({"text": chunk_text})
        if end >= len(text):
            break
        cursor = max(end - overlap, cursor + 1)
    return chunks
