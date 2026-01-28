from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    Text,
    ForeignKey,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

Base = declarative_base()


class Document(Base):

    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    doc_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    versions = relationship(
        "DocumentVersion", back_populates="document", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Document(id={self.id}, name='{self.doc_name}')>"


class DocumentVersion(Base):

    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String(512), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    file_hash = Column(String(64))
    doc_metadata = Column(Text)
    document = relationship("Document", back_populates="versions")
    chunks = relationship(
        "DocumentChunk", back_populates="version", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<DocumentVersion(doc_id={self.document_id}, v{self.version_number})>"


class DocumentChunk(Base):

    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True)
    version_id = Column(Integer, ForeignKey("document_versions.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    faiss_index = Column(Integer)

    version = relationship("DocumentVersion", back_populates="chunks")

    def __repr__(self):
        return f"<DocumentChunk(id={self.id}, chunk_index={self.chunk_index})>"


def init_db(database_url: str = None):
    if database_url is None:
        database_url = os.getenv("DATABASE_URL", "sqlite:///./rag_system.db")

    engine = create_engine(database_url, echo=False)
    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    return engine, SessionLocal


def get_db_session(database_url: str = None):
    _, SessionLocal = init_db(database_url)
    return SessionLocal()
