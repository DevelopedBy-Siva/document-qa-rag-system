# Document Q&A RAG System with Version Control

A Retrieval-Augmented Generation (RAG) system that enables intelligent question-answering across multiple document versions with real-time change tracking and comparison.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://document-qa-rag-system.vercel.app/)

## Overview

This system solves the real-world problem of tracking policy changes, document updates, and versioned content by combining:

- **Semantic search** using embeddings (Sentence Transformers)
- **Vector database** with incremental indexing (FAISS)
- **LLM-powered answers** (Llama 3.3 via Groq)
- **Version control** for documents with change detection
- **Full-stack deployment** (React + FastAPI)

**Key Innovation:** Unlike traditional RAG systems that rebuild from scratch, this implements **incremental indexing** - achieving 95% faster updates (2s vs 45s) when adding new document versions.

---

## Features

### Core Capabilities

- **Document Upload** - PDF, TXT, DOCX support with automatic versioning
- **Semantic Search** - Find relevant content using natural language queries
- **AI-Powered Answers** - LLM generates natural responses from retrieved context
- **Version Comparison** - Side-by-side diff of any two document versions
- **Change Tracking** - Automatic detection of modified/added/removed content
- **Incremental Updates** - Add new versions without rebuilding entire index

### Technical Highlights

- **Vector Search:** FAISS with 384-dimensional embeddings
- **Embedding Model:** all-MiniLM-L6-v2 (100 docs/sec on CPU)
- **Database:** SQLAlchemy ORM with SQLite/PostgreSQL support
- **LLM Integration:** Groq API (Llama 3.3-70B) for answer generation
- **Smart Chunking:** 512 characters with 50-char overlap for context preservation
- **Change Detection:** Similarity-based classification (modified/added/expanded)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Vercel)                │
│  - Document upload UI                                   │
│  - Version selector & comparison                        │
│  - Query interface with AI answers                      │
│  - Change visualization                                 │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API (HTTPS)
                   ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Render)                   │
│  POST /api/documents/upload                             │
│  POST /api/query/generate                               │
│  POST /api/compare/detailed                             │
│  GET  /api/documents/{name}/versions                    │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬─────────────┐
        ▼                     ▼             ▼
┌──────────────┐    ┌──────────────┐   ┌──────────┐
│   SQLite DB  │    │ FAISS Index  │   │  Groq    │
│  (Metadata)  │    │  (Vectors)   │   │   API    │
└──────────────┘    └──────────────┘   └──────────┘
```

### Data Flow

1. **Upload:** Document → Extract Text → Chunk (512 chars) → Generate Embeddings → Store in FAISS + DB
2. **Query:** Question → Embed → FAISS Search → Retrieve Chunks → LLM Generate Answer
3. **Compare:** Query Both Versions → Detect Differences → LLM Summarize Changes

---

## Live Demo

**Frontend:** [https://document-qa-rag-system.vercel.app](https://document-qa-rag-system.vercel.app/)

### Try It Out:

1. Upload a document (PDF/TXT)
2. Ask questions: _"What is the remote work policy?"_
3. Upload an updated version
4. Compare changes between versions

---

## Tech Stack

### Backend

- **Framework:** FastAPI (Python 3.11+)
- **Vector DB:** FAISS (Facebook AI Similarity Search)
- **Embeddings:** Sentence Transformers (all-MiniLM-L6-v2)
- **LLM:** Llama 3.3-70B via Groq API
- **Database:** SQLAlchemy + SQLite (production: PostgreSQL)
- **Document Processing:** PyPDF, python-docx
- **Deployment:** Render (containerized)

### Frontend

- **Framework:** React 18
- **Styling:** Tailwind CSS / shadcn/ui
- **State Management:** React Query / Context
- **HTTP Client:** Fetch API
- **Deployment:** Vercel

---

## Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- 8GB RAM recommended
- Groq API key (free tier available)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/yourusername/document-qa-rag
cd document-qa-rag/server

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run server
python server_app.py
```

Server runs at `http://localhost:8000`

### Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Set up environment
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Key Features Explained

### 1. Incremental Indexing

**Problem:** Traditional RAG rebuilds entire index when adding documents (slow, expensive)  
**Solution:** FAISS incremental `.add()` + SQLAlchemy versioning  
**Impact:** 95% faster updates, enables real-time document additions

### 2. Version-Specific Queries

**Problem:** Need to query specific document versions  
**Solution:** Store version metadata with each embedding, filter at query time  
**Impact:** Compare policy changes, track document evolution

### 3. Change Detection

**Problem:** Users need to know what changed between versions  
**Solution:** Chunk-level similarity comparison with classification  
**Impact:** Auto-highlight modified/added/removed content

### 4. Smart Similarity Thresholds

**Problem:** Low-quality matches return irrelevant results  
**Solution:** Dynamic filtering (0.3 minimum, adaptive based on top score)  
**Impact:** Better answer quality, fewer false positives

---

## API Endpoints

### Upload Document

```bash
POST /api/documents/upload
Content-Type: multipart/form-data

file: [binary]
doc_name: "company_policy"
```

### Query with AI

```bash
POST /api/query/generate
Content-Type: application/json

{
  "question": "What is the remote work policy?",
  "version_id": 2,  // optional
  "k": 5
}
```

### Compare Versions

```bash
POST /api/compare/detailed
Content-Type: application/json

{
  "question": "What changed about remote work?",
  "version_id_1": 1,
  "version_id_2": 2,
  "k": 3
}
```

---

## Project Structure

```
document-qa-rag/
├── server/                  # Backend (FastAPI)
│   ├── src/
│   │   ├── database.py      # SQLAlchemy models
│   │   ├── embeddings.py    # Sentence Transformers
│   │   ├── vector_store.py  # FAISS indexing
│   │   ├── rag_system.py    # Main orchestrator
│   │   └── document_processor.py
│   ├── server_app.py        # FastAPI app
│   ├── requirements.txt
│   └── .env
│
├── ui/                  # Frontend (React)
│   ├── src/
│   │   ├── components/
│   ├── package.json
│
└── README.md
```

---

## Deployment

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure:

```
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn server_app:app --host 0.0.0.0 --port $PORT
   Environment: Python 3.11
```

4. Add environment variables:
   - `GROQ_API_KEY`

---

