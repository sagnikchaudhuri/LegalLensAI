"""Download and cache LegalLens AI runtime models before deployment.

Run from the backend directory:
    python scripts/preload_models.py

Use --check-only in CI when you only want to validate configuration and imports.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def main() -> int:
    parser = argparse.ArgumentParser(description="Preload LegalLens AI embedding models.")
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Validate script wiring without downloading the model.",
    )
    args = parser.parse_args()

    from app.config import settings

    print(f"Embedding model: {settings.embedding_model_name}")
    print(f"Embedding device: {settings.embedding_device}")

    if args.check_only:
        print("Check-only mode complete. No model download attempted.")
        return 0

    from app.services.embedding_service import get_embedding_service

    service = get_embedding_service()
    vectors = service.embed_texts(["LegalLens model preload check."])
    print(f"Model cached and ready. Vector dimensions: {len(vectors[0]) if vectors else 0}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
