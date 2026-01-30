from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import shutil
import os
from pathlib import Path
import sys
from openai import OpenAI
import json

sys.path.insert(0, str(Path(__file__).parent))

from src.rag_system import IncrementalRAGSystem
from src.database import get_db_session, Document, DocumentVersion


client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1"
)


app = FastAPI(
    title="Incremental RAG API",
    description="API for document Q&A RAG System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://document-qa-rag-system.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_system = IncrementalRAGSystem()

TEMP_UPLOAD_DIR = "./temp_uploads"
Path(TEMP_UPLOAD_DIR).mkdir(exist_ok=True)


class QueryRequest(BaseModel):
    question: str
    version_id: Optional[int] = None
    k: int = 5


class ComparisonRequest(BaseModel):
    question: str
    version_id_1: int
    version_id_2: int
    k: int = 3


@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Document Q&A RAG API is running",
    }


@app.get("/api/stats")
async def get_stats():
    try:
        stats = rag_system.get_stats()
        return JSONResponse(content={"success": True, "data": stats})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...), doc_name: Optional[str] = Form(None)
):
    temp_file_path = None
    try:
        allowed_extensions = {".pdf", ".txt", ".docx"}
        file_ext = Path(file.filename).suffix.lower()

        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, detail=f"File type {file_ext} not supported"
            )

        temp_file_path = Path(TEMP_UPLOAD_DIR) / file.filename
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        if not doc_name:
            doc_name = Path(file.filename).stem

        result = rag_system.add_document(
            file_path=str(temp_file_path), doc_name=doc_name
        )

        temp_file_path.unlink()

        return JSONResponse(
            content={
                "success": True,
                "message": f"Document uploaded as version {result['version_number']}",
                "data": result,
            }
        )

    except Exception as e:
        if temp_file_path and temp_file_path.exists():
            temp_file_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


def build_source_context(results):
    parts = []
    for i, r in enumerate(results, start=1):
        excerpt = r["content"]
        if len(excerpt) > 2000:
            excerpt = excerpt[:2000] + "..."
        parts.append(f"[Source {i}]\n{excerpt}")
    return "\n\n".join(parts)


@app.post("/api/query/generate")
async def query_with_llm(query_request: QueryRequest):
    question = query_request.question.strip()

    if len(question) < 3:
        return {
            "question": question,
            "not_found": True,
            "answer": "",
            "error": "Question too short (minimum 3 characters)",
            "sources": [],
        }

    results = rag_system.query(
        question=question,
        version_id=query_request.version_id,
        k=query_request.k,
    )

    if not results:
        return {
            "question": question,
            "not_found": True,
            "answer": "",
            "reason": "No relevant content found in document",
            "sources": [],
        }

    top_score = results[0]["similarity_score"]

    if top_score < 0.3:
        return {
            "question": question,
            "not_found": True,
            "answer": "",
            "reason": "Question doesn't match document content",
            "suggestion": "Try asking about topics related to the document",
            "top_score": round(top_score, 3),
            "sources": [],
        }

    if top_score > 0.6:
        filtered = [r for r in results if r["similarity_score"] > 0.5][:3]
    elif top_score > 0.45:
        filtered = [r for r in results if r["similarity_score"] > 0.4][:2]
    else:
        filtered = results[:1]  # Use only best match

    context = build_source_context(filtered)
    avg_sim = sum(r["similarity_score"] for r in filtered) / len(filtered)

    system_msg = """You are a helpful document Q&A assistant.

IMPORTANT RULES:
1. Answer using ONLY the provided context
2. If context is relevant, provide an answer even if partial
3. Only return not_found=true if context is COMPLETELY unrelated
4. For general questions (like "policy" or "document"), summarize key points

Response format:
{
  "not_found": false,
  "answer": "Your answer here",
  "confidence": "high|medium|low"
}

Only use not_found=true if truly nothing relevant exists."""

    user_prompt = f"""
Context (avg similarity: {avg_sim:.2f}):
{context}

Question: {question}

Provide a helpful answer based on the context. If the question is general, summarize the main points."""

    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.1,
        max_tokens=800,
    )

    text = resp.choices[0].message.content.strip()

    try:
        j = json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                j = json.loads(text[start : end + 1])
            except:
                j = {
                    "not_found": False,
                    "answer": text,
                    "confidence": "low",
                    "note": "Response format was non-standard",
                }
        else:
            raise HTTPException(status_code=500, detail="LLM response parsing failed")

    j["sources"] = filtered
    j["question"] = question
    j["avg_similarity"] = round(avg_sim, 3)

    if "confidence" not in j:
        if avg_sim > 0.6:
            j["confidence"] = "high"
        elif avg_sim > 0.45:
            j["confidence"] = "medium"
        else:
            j["confidence"] = "low"

    return j


@app.get("/api/documents")
async def list_documents():
    try:
        documents = rag_system.get_all_documents()
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents/{doc_name}/versions")
async def get_document_versions(doc_name: str):
    try:
        versions = rag_system.get_document_versions(doc_name)
        if not versions:
            raise HTTPException(
                status_code=404, detail=f"Document '{doc_name}' not found"
            )
        return versions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents/{doc_name}/versions")
async def get_document_versions(doc_name: str):
    try:
        versions = rag_system.get_document_versions(doc_name)

        if not versions:
            raise HTTPException(
                status_code=404, detail=f"Document '{doc_name}' not found"
            )

        result = [
            {**v, "label": f"{doc_name} - v{v['version_number']}"} for v in versions
        ]

        return JSONResponse(content={"success": True, "data": result})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/compare")
async def compare_versions(comparison: ComparisonRequest):
    try:
        results_v1 = rag_system.query(
            question=comparison.question,
            version_id=comparison.version_id_1,
            k=comparison.k,
        )

        results_v2 = rag_system.query(
            question=comparison.question,
            version_id=comparison.version_id_2,
            k=comparison.k,
        )

        session = get_db_session()
        try:
            v1 = (
                session.query(DocumentVersion)
                .filter_by(id=comparison.version_id_1)
                .first()
            )
            v2 = (
                session.query(DocumentVersion)
                .filter_by(id=comparison.version_id_2)
                .first()
            )

            if not v1 or not v2:
                raise HTTPException(status_code=404, detail="Version not found")

            version_info = {
                "version_1": {
                    "id": v1.id,
                    "number": v1.version_number,
                    "date": v1.upload_date.isoformat(),
                },
                "version_2": {
                    "id": v2.id,
                    "number": v2.version_number,
                    "date": v2.upload_date.isoformat(),
                },
            }
        finally:
            session.close()

        differences = []
        if results_v1 and results_v2:
            top_v1 = results_v1[0]["content"]
            top_v2 = results_v2[0]["content"]

            if top_v1 != top_v2:
                differences.append(
                    {
                        "type": "content_changed",
                        "description": "Content differs between versions",
                    }
                )

        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "question": comparison.question,
                    "version_info": version_info,
                    "results_v1": results_v1,
                    "results_v2": results_v2,
                    "differences": differences,
                },
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server_app:app", host="0.0.0.0", port=8000, reload=True)
