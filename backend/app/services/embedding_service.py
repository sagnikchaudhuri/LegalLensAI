from functools import lru_cache

from fastapi import HTTPException


EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingService:
    """Semantic embedding wrapper for LegalLens RAG.

    The model is loaded lazily so the API can still start quickly. Upload/index and
    retrieval endpoints fail with a clear message if the dependency/model is missing.
    """

    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME):
        self.model_name = model_name
        try:
            from sentence_transformers import SentenceTransformer
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Semantic embeddings are not available. Install sentence-transformers "
                    "and ensure the all-MiniLM-L6-v2 model can be loaded."
                ),
            ) from exc
        self.model = SentenceTransformer(model_name)

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        vectors = self.model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return [vector.tolist() for vector in vectors]

    def embed_query(self, query: str) -> list[float]:
        return self.embed_texts([query])[0]


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()

