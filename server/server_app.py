from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import shutil
import os
from pathlib import Path
import sys
from google.generativeai import configure, GenerativeModel


sys.path.insert(0, str(Path(__file__).parent))

from src.rag_system import IncrementalRAGSystem
from src.database import get_db_session, Document, DocumentVersion


configure(api_key=os.getenv("GEMINI_API_KEY"))
model = GenerativeModel("models/gemini-1.5-flash")

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


@app.post("/api/query/generate")
async def query_with_llm(query_request: QueryRequest):
    results = rag_system.query(
        question=query_request.question, version_id=query_request.version_id, k=5
    )

    if not results:
        return {
            "question": query_request.question,
            "answer": "Not found in the document.",
            "sources": [],
        }

    context = "\n\n".join(
        f"[Source {i+1}]\n{r['content']}" for i, r in enumerate(results)
    )

    prompt = f"""
You are a document Q&A assistant.

Answer ONLY using the provided context.
If the answer is not present, say "Not found in the document."
Do not use external knowledge.

Context:
{context}

Question:
{query_request.question}

Answer:
"""

    response = model.generate_content(prompt)

    return {
        "question": query_request.question,
        "answer": response.text.strip(),
        "sources": results,
    }


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
