# Chat with Docs

A **RAG (Retrieval-Augmented Generation)** application that lets users upload documents and ask questions, receiving answers grounded in the content of those documents. Built with Spring Boot 3 + Spring AI, using OpenAI for generation and PostgreSQL/pgvector as the vector store.

## Key Features

### 1. Document Upload (ingestion)

Users send a file to `POST /api/documents`. The system uses **Apache Tika** to auto-detect the format (PDF, DOCX, TXT…) from the filename.

- **PDFs** are read page-by-page with `PagePdfDocumentReader`, so each chunk retains its `page_number` in **metadata** for later citation.
- Other formats are read via `TikaDocumentReader` (no page information available).

### 2. Smart Ingest (chunking + filtering + embedding)

After reading, the text is split with **`TokenTextSplitter`** into **chunks**, then filtered and indexed:

- A heuristic filter (`isMeaningful`) drops boilerplate chunks such as **table-of-contents** pages (dot-leaders, low letter-ratio) and **index** pages (dense with page numbers) so they don't pollute citations.
- Valid chunks are passed through the **embedding model** (`text-embedding-3-small`, 1536-d) and stored in **pgvector** with an **HNSW** index and **cosine distance**.

### 3. Cited Q&A (RAG with citations)

For each question, the system performs **retrieval** followed by **grounded generation**:

- Runs a **similarity search** for the **top-K = 6** most relevant chunks, filtered by a **similarity threshold of 0.3** to drop unrelated passages.
- The chunks are numbered and injected into the **system prompt**; the model (`gpt-4o-mini`) is instructed to answer **only from the provided sources** and to say it doesn't know when the information isn't in the documents.
- Answers include **inline citations** like `[1]`, `[2][3]` right after each claim; every **source reference** returned carries the **file name** and **page number** for easy verification.

### 4. Streaming (SSE) and Multilingual

`POST /api/chat/stream` streams the answer over **Server-Sent Events (SSE)** in real time:

- Emits a **`sources`** event first (the list of sources), then one **`token`** event per chunk of the answer, and a final **`done`** event.
- Each token is wrapped in JSON so leading spaces and newlines survive SSE encoding.
- The system prompt instructs the model to **answer in the same language as the question** (multilingual).

### 5. Built-in Web UI

Static pages under `src/main/resources/static` provide a UI to **upload** documents and **chat** directly, with no external tools required.

## Tech Stack

| Component        | Technology                                |
|------------------|-------------------------------------------|
| Backend          | Spring Boot 3.5, Java 21                   |
| AI framework     | Spring AI 1.1                             |
| Chat model       | OpenAI `gpt-4o-mini`                       |
| Embedding        | OpenAI `text-embedding-3-small` (1536-d)   |
| Vector store     | PostgreSQL + pgvector (HNSW, cosine)       |
| Document readers | Spring AI Tika / PDF document reader       |

## API

| Method | Endpoint             | Description                                  |
|--------|----------------------|----------------------------------------------|
| POST   | `/api/documents`     | Upload and index a document                  |
| POST   | `/api/chat`          | Ask a question, return full answer + sources |
| POST   | `/api/chat/stream`   | Ask a question, stream the answer (SSE)      |

## Getting Started

```bash
# 1. Start PostgreSQL + pgvector
docker compose up -d

# 2. Set the OPENAI_API_KEY environment variable (see .env.example)

# 3. Run the application
./mvnw spring-boot:run
```

Open `http://localhost:8080` in your browser to upload documents and start chatting.
