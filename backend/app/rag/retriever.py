import re
from pathlib import Path

from app.rag.chroma_client import persistent_client
from app.rag.indexer import COLLECTION_NAME, migrate_legacy_index
from app.services.embedding_service import get_embedding_service
from app.utils.file_utils import load_json


STOP_WORDS = {
    "about", "after", "before", "could", "does", "from", "have", "into",
    "that", "the", "their", "there", "these", "this", "what", "when", "where",
    "which", "with", "would", "your",
}


def retrieve(document_id: str, question: str, data_dir: Path, limit: int = 4) -> list[dict]:
    try:
        return _semantic_retrieve(document_id, question, data_dir, limit)
    except Exception:
        chunks = _load_chunks(document_id, data_dir)
        if chunks and isinstance(chunks[0], str):
            chunks = migrate_legacy_index(document_id, data_dir)
        return _keyword_retrieve(chunks, question, limit)


def _semantic_retrieve(document_id: str, question: str, data_dir: Path, limit: int) -> list[dict]:
    client = persistent_client(data_dir / "chroma")
    collection = client.get_collection(name=COLLECTION_NAME)
    result = collection.query(
        query_embeddings=[get_embedding_service().embed_query(question)],
        n_results=limit,
        where={"document_id": document_id},
        include=["documents", "metadatas", "distances"],
    )
    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]
    return [
        {
            "text": document,
            "chunk_id": metadata.get("chunk_id", ""),
            "page_number": None if metadata.get("page_number") == -1 else metadata.get("page_number"),
            "source": metadata.get("source", "uploaded-document"),
            "score": distances[index] if index < len(distances) else None,
        }
        for index, (document, metadata) in enumerate(zip(documents, metadatas))
    ]


def _load_chunks(document_id: str, data_dir: Path) -> list:
    payload = load_json(data_dir / f"{document_id}.chunks.json")
    return payload.get("chunks", [])


def _keyword_retrieve(chunks: list[dict], question: str, limit: int) -> list[dict]:
    terms = {
        word for word in re.findall(r"[a-zA-Z]{3,}", question.lower())
        if word not in STOP_WORDS
    }
    scored = []
    for chunk in chunks:
        text = chunk.get("text", "") if isinstance(chunk, dict) else str(chunk)
        score = sum(text.lower().count(term) for term in terms)
        if score:
            scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {
            "text": chunk.get("text", ""),
            "chunk_id": chunk.get("chunk_id", ""),
            "page_number": chunk.get("page_number"),
            "source": chunk.get("source", "uploaded-document"),
            "score": score,
        }
        for score, chunk in scored[:limit]
        if isinstance(chunk, dict)
    ]
