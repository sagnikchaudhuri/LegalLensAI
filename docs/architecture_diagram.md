# LegalLens AI Architecture Diagrams

These diagrams describe the current local MVP architecture.

## System Overview

```mermaid
flowchart LR
  User["User"]
  Frontend["React + Vite Frontend"]
  API["FastAPI Backend"]
  Security["Security Layer"]
  Parser["Document + OCR Services"]
  Agents["Legal Agents"]
  RAG["RAG Services"]
  Drafting["Drafting Templates"]
  Storage["Local JSON + Upload Storage"]
  Chroma["ChromaDB Vector Store"]
  LLM["Gemini API Optional"]

  User --> Frontend
  Frontend --> API
  API --> Security
  API --> Parser
  API --> Agents
  API --> RAG
  API --> Drafting
  Parser --> Storage
  RAG --> Chroma
  Agents --> LLM
  RAG --> LLM
```

## Upload Pipeline

```mermaid
flowchart TD
  A["Upload PDF/DOCX/TXT/PNG/JPG"] --> B["Validate extension, MIME, size, and content signature"]
  B --> C["Sanitize filename"]
  C --> D["Generate random document_id"]
  D --> E["Generate access token"]
  E --> F["Store token hash in metadata"]
  F --> G["Extract text with parser or OCR"]
  G --> H["Detect prompt-injection-like instructions"]
  H --> I["Save metadata without raw token or local path exposure"]
  I --> J["Chunk document"]
  J --> K["Embed chunks"]
  K --> L["Store vectors and citation metadata in ChromaDB"]
```

## RAG Pipeline

```mermaid
flowchart TD
  A["User asks question"] --> B["Frontend sends Authorization bearer token"]
  B --> C["Backend verifies token hash"]
  C --> D["Embed query with all-MiniLM-L6-v2"]
  D --> E["Search ChromaDB by document_id"]
  E --> F["Retrieve top chunks with page, source, chunk_id"]
  F --> G["Redact PII for LLM if enabled"]
  G --> H["Answer with untrusted context separated from system instructions"]
  H --> I["Return answer plus citations"]
  I --> J["Frontend displays grounded answer and citation list"]
```

## Security and Access Token Flow

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as FastAPI
  participant Meta as Metadata Store

  UI->>API: POST /api/upload
  API->>API: Generate document_id and raw access token
  API->>Meta: Store SHA-256 token hash only
  API-->>UI: document_id + raw access token
  UI->>UI: Store token in sessionStorage
  UI->>API: POST /api/analyze/{document_id} with Authorization header
  API->>Meta: Load token hash by document_id
  API->>API: Compare bearer token hash
  API-->>UI: Protected result or safe error JSON
```

## Drafting Pipeline

```mermaid
flowchart TD
  A["User opens /draft"] --> B["Select document type"]
  B --> C["Fill structured fields"]
  C --> D["POST /api/draft"]
  D --> E["Drafting Agent validates request"]
  E --> F["Template generator builds document"]
  F --> G["Return full draft, clause explanations, risk notes, disclaimer"]
  G --> H["Frontend displays copy-ready draft"]
```

