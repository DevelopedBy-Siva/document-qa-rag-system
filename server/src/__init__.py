"""
Incremental RAG System - A production-ready RAG with document versioning
"""

from .rag_system import IncrementalRAGSystem
from .embeddings import EmbeddingGenerator
from .vector_store import FAISSVectorStore
from .document_processor import DocumentProcessor

__version__ = "1.0.0"
__all__ = [
    "IncrementalRAGSystem",
    "EmbeddingGenerator",
    "FAISSVectorStore",
    "DocumentProcessor",
]
