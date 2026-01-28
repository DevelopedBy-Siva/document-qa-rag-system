from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
import os


class EmbeddingGenerator:

    def __init__(self, model_name: str = None):
        self.model_name = model_name or os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        print(f"Loading embedding model: {self.model_name}")
        self.model = SentenceTransformer(self.model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        print(f"Model loaded. Embedding dimension: {self.embedding_dim}")

    def embed_text(self, text: str) -> np.ndarray:
        return self.model.encode(text, convert_to_numpy=True)

    def embed_batch(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        if not texts:
            return np.array([])

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            show_progress_bar=len(texts) > 10,
        )

        return embeddings

    def get_embedding_dim(self) -> int:
        return self.embedding_dim
