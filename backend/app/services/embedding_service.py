from functools import lru_cache

from fastapi import HTTPException

from app.config import settings

EMBEDDING_MODEL_NAME = settings.embedding_model_name


class EmbeddingService:
    """Semantic embedding wrapper for LegalLens RAG.

    The model is loaded lazily so the API can still start quickly. Upload/index and
    retrieval endpoints fail with a clear message if the dependency/model is missing.
    """

    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME, device: str | None = None):
        self.model_name = model_name
        self.device = device or settings.embedding_device
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
        try:
            self.model = SentenceTransformer(model_name, device=self.device)
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Semantic embedding model '{model_name}' could not be loaded on "
                    f"device '{self.device}'. Preload the model cache or allow outbound "
                    "access to Hugging Face during backend setup."
                ),
            ) from exc

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
    return EmbeddingService(settings.embedding_model_name, settings.embedding_device)


def warmup_embedding_model() -> tuple[bool, str]:
    """Load and lightly exercise the embedding model for deployment diagnostics."""
    try:
        service = get_embedding_service()
        service.embed_texts(["LegalLens embedding warmup."])
    except HTTPException as exc:
        return False, str(exc.detail)
    except Exception as exc:
        return False, f"Unexpected embedding warmup failure: {exc}"
    return True, f"Embedding model ready: {settings.embedding_model_name} on {settings.embedding_device}."
