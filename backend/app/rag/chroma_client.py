from pathlib import Path


def persistent_client(path: Path):
    import chromadb
    from chromadb.config import Settings as ChromaSettings

    return chromadb.PersistentClient(
        path=str(path),
        settings=ChromaSettings(
            anonymized_telemetry=False,
            chroma_product_telemetry_impl="app.rag.chroma_telemetry.NoOpProductTelemetry",
        ),
    )
