from pathlib import Path

from app.config import settings
from app.rag.chroma_client import persistent_client
from app.services.document_service import split_into_chunks, split_pages_into_chunks
from app.services.embedding_service import get_embedding_service
from app.security.prompt_guard import detect_prompt_injection
from app.utils.file_utils import load_json, save_json


COLLECTION_NAME = "legal_lens_contracts_semantic"


def create_index(
    document_id: str,
    text: str,
    data_dir: Path,
    pages: list[dict] | None = None,
    source_filename: str = "uploaded-document",
) -> list[dict]:
    chunks = (
        split_pages_into_chunks(pages, document_id, source_filename)
        if pages
        else _metadata_chunks(document_id, split_into_chunks(text), source_filename)
    )
    for chunk in chunks:
        chunk["security_flags"] = detect_prompt_injection(chunk["text"])
    save_json(data_dir / f"{document_id}.chunks.json", {"version": 2, "chunks": chunks})
    _upsert_chunks(data_dir, chunks, document_id)
    return chunks


def migrate_legacy_index(document_id: str, data_dir: Path) -> list[dict]:
    metadata = load_json(data_dir / f"{document_id}.json")
    source = metadata.get("file_name", "uploaded-document")
    chunk_payload = load_json(data_dir / f"{document_id}.chunks.json")
    raw_chunks = chunk_payload.get("chunks", [])
    if raw_chunks and isinstance(raw_chunks[0], dict):
        chunks = raw_chunks
    else:
        chunks = _metadata_chunks(document_id, raw_chunks, source)
        save_json(data_dir / f"{document_id}.chunks.json", {"version": 2, "chunks": chunks})
    _upsert_chunks(data_dir, chunks, document_id)
    return chunks


def _metadata_chunks(document_id: str, chunks: list[str], source: str) -> list[dict]:
    return [
        {
            "chunk_id": f"{document_id}:{index:04d}",
            "text": chunk,
            "page_number": None,
            "source": source,
        }
        for index, chunk in enumerate(chunks)
    ]


def _upsert_chunks(data_dir: Path, chunks: list[dict], document_id: str) -> None:
    if not chunks:
        return

    embeddings = get_embedding_service().embed_texts([chunk["text"] for chunk in chunks])
    client = persistent_client(data_dir / "chroma")
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"embedding_model": settings.embedding_model_name},
    )
    collection.upsert(
        ids=[chunk["chunk_id"] for chunk in chunks],
        documents=[chunk["text"] for chunk in chunks],
        embeddings=embeddings,
        metadatas=[
            {
                "document_id": document_id,
                "chunk_id": chunk["chunk_id"],
                "page_number": chunk.get("page_number") or -1,
                "source": chunk.get("source", "uploaded-document"),
                "security_flags": ",".join(chunk.get("security_flags", [])),
            }
            for chunk in chunks
        ],
    )


def delete_index(data_dir: Path, document_id: str) -> None:
    try:
        client = persistent_client(data_dir / "chroma")
        collection = client.get_collection(name=COLLECTION_NAME)
        collection.delete(where={"document_id": document_id})
    except Exception:
        pass
