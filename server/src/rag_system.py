import os
import shutil
from pathlib import Path
from typing import List, Tuple, Optional
from datetime import datetime

from src.database import (
    init_db,
    get_db_session,
    Document,
    DocumentVersion,
    DocumentChunk,
)
from src.document_processor import DocumentProcessor
from src.embeddings import EmbeddingGenerator
from src.vector_store import FAISSVectorStore


class IncrementalRAGSystem:

    def __init__(
        self,
        database_url: str = None,
        embedding_model: str = None,
        index_path: str = None,
        upload_dir: str = None,
    ):

        print("Initializing Incremental RAG System...")

        self.database_url = database_url or os.getenv(
            "DATABASE_URL", "sqlite:///./rag_system.db"
        )
        init_db(self.database_url)

        self.processor = DocumentProcessor(chunk_size=512, chunk_overlap=50)
        self.embedder = EmbeddingGenerator(model_name=embedding_model)
        self.vector_store = FAISSVectorStore(
            embedding_dim=self.embedder.get_embedding_dim(),
            index_path=index_path or "./data/faiss_index",
        )

        self.upload_dir = upload_dir or "./uploads"
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)

        print("RAG System initialized successfully!")

    def add_document(self, file_path: str, doc_name: str = None) -> dict:

        if not Path(file_path).exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if doc_name is None:
            doc_name = Path(file_path).stem

        print(f"\nProcessing document: {doc_name}")

        full_text, chunks = self.processor.process_document(file_path)
        file_hash = self.processor.compute_file_hash(file_path)

        print(f"  - Extracted {len(chunks)} chunks")

        session = get_db_session(self.database_url)

        try:
            document = session.query(Document).filter_by(doc_name=doc_name).first()

            if document is None:
                document = Document(doc_name=doc_name)
                session.add(document)
                session.flush()
                version_number = 1
                print(f"  - Created new document (ID: {document.id})")
            else:
                max_version = (
                    session.query(DocumentVersion)
                    .filter_by(document_id=document.id)
                    .count()
                )
                version_number = max_version + 1
                print(f"  - Adding version {version_number} to existing document")

            dest_path = (
                Path(self.upload_dir)
                / f"{doc_name}_v{version_number}{Path(file_path).suffix}"
            )
            shutil.copy2(file_path, dest_path)

            version = DocumentVersion(
                document_id=document.id,
                version_number=version_number,
                file_path=str(dest_path),
                file_hash=file_hash,
            )
            session.add(version)
            session.flush()

            print(f"  - Generating embeddings...")
            embeddings = self.embedder.embed_batch(chunks)

            metadata_list = [
                {
                    "document_id": document.id,
                    "version_id": version.id,
                    "chunk_index": i,
                    "doc_name": doc_name,
                    "version_number": version_number,
                    "content": chunk,
                }
                for i, chunk in enumerate(chunks)
            ]

            faiss_ids = self.vector_store.add_embeddings(embeddings, metadata_list)

            for i, (chunk, faiss_id) in enumerate(zip(chunks, faiss_ids)):
                db_chunk = DocumentChunk(
                    version_id=version.id,
                    chunk_index=i,
                    content=chunk,
                    faiss_index=faiss_id,
                )
                session.add(db_chunk)

            session.commit()

            self.vector_store.save()

            print(f"Successfully added {doc_name} v{version_number}")

            return {
                "document_id": document.id,
                "document_name": doc_name,
                "version_id": version.id,
                "version_number": version_number,
                "num_chunks": len(chunks),
                "file_path": str(dest_path),
            }

        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def query(
        self, question: str, version_id: Optional[int] = None, k: int = 5
    ) -> List[dict]:
        print(f"\nQuerying: '{question}'")

        query_embedding = self.embedder.embed_text(question)

        results = self.vector_store.search(
            query_embedding, k=k, version_filter=version_id
        )

        print(f"  - Found {len(results)} relevant chunks")

        formatted_results = []
        for distance, metadata in results:
            formatted_results.append(
                {
                    "content": metadata.get("content", ""),
                    "document_name": metadata.get("doc_name", ""),
                    "version": metadata.get("version_number", ""),
                    "chunk_index": metadata.get("chunk_index", ""),
                    "similarity_score": 1 / (1 + distance),
                }
            )

        return formatted_results

    def get_document_versions(self, doc_name: str) -> List[dict]:
        session = get_db_session(self.database_url)

        try:
            document = session.query(Document).filter_by(doc_name=doc_name).first()

            if not document:
                return []

            versions = (
                session.query(DocumentVersion)
                .filter_by(document_id=document.id)
                .order_by(DocumentVersion.version_number)
                .all()
            )

            return [
                {
                    "version_id": v.id,
                    "version_number": v.version_number,
                    "upload_date": v.upload_date.isoformat(),
                    "file_path": v.file_path,
                    "num_chunks": len(v.chunks),
                }
                for v in versions
            ]
        finally:
            session.close()

    def get_all_documents(self) -> List[dict]:
        session = get_db_session(self.database_url)

        try:
            documents = session.query(Document).all()

            result = []
            for doc in documents:
                result.append(
                    {
                        "document_id": doc.id,
                        "document_name": doc.doc_name,
                        "created_at": doc.created_at.isoformat(),
                        "num_versions": len(doc.versions),
                    }
                )

            return result
        finally:
            session.close()

    def get_stats(self) -> dict:
        session = get_db_session(self.database_url)

        try:
            num_documents = session.query(Document).count()
            num_versions = session.query(DocumentVersion).count()
            num_chunks = session.query(DocumentChunk).count()

            vector_stats = self.vector_store.get_stats()

            return {
                "num_documents": num_documents,
                "num_versions": num_versions,
                "num_chunks": num_chunks,
                "vector_store": vector_stats,
            }
        finally:
            session.close()
