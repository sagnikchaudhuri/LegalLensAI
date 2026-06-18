# LegalLens AI Architecture

## Request Flow

1. React uploads a legal document to FastAPI.
2. FastAPI validates file type and size.
3. `document_service` extracts text from PDF, DOCX, TXT, or image files.
4. `ocr_service` runs EasyOCR for image uploads and scanned PDF pages.
5. `indexer` chunks page-aware text and stores metadata-rich chunks locally.
6. `embedding_service` generates semantic vectors with `sentence-transformers/all-MiniLM-L6-v2`.
7. ChromaDB stores chunk vectors in `legal_lens_contracts_semantic`.
8. Analysis agents generate parser, compliance, risk, and report outputs.
9. Chat retrieves semantic chunks and returns answers with citations.
10. Drafting Studio uses reusable template generators through the Drafting Agent.

## RAG Chunk Metadata

Each chunk stores:

- `document_id`
- `chunk_id`
- `page_number`
- `source`
- `text`

This enables grounded answers and citation display in the frontend.

## Agents

- Document Parser Agent: metadata and summary
- Risk Analysis Agent: score and red flags
- Compliance Agent: missing protections
- Legal Q&A Agent: retrieved-context answers
- Drafting Agent: document generation from template inputs

Agents are intentionally lightweight and typed with Pydantic where they return data.

## Storage

- Uploaded files: `backend/uploads/`
- Extracted metadata/reports/chunks: `backend/data/`
- Vectors: `backend/data/chroma/`

This remains a local-development persistence layer. Production should move files to
encrypted object storage, metadata to Postgres, and vectors to a managed vector service
or controlled Chroma deployment.

