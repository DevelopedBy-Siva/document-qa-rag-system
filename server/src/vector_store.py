import faiss
import numpy as np
import pickle
from pathlib import Path
from typing import List, Tuple, Optional


class FAISSVectorStore:

    def __init__(self, embedding_dim: int, index_path: str = None):

        self.embedding_dim = embedding_dim
        self.index_path = index_path or "./data/faiss_index"
        self.index = None
        self.id_to_metadata = {}  # Map FAISS ID to metadata
        self.current_id = 0

        Path(self.index_path).parent.mkdir(parents=True, exist_ok=True)

        if Path(f"{self.index_path}.faiss").exists():
            self.load()
        else:
            self._create_new_index()

    def _create_new_index(self):
        self.index = faiss.IndexFlatL2(self.embedding_dim)
        self.id_to_metadata = {}
        self.current_id = 0
        print(f"Created new FAISS index with dimension {self.embedding_dim}")

    def add_embeddings(self, embeddings: np.ndarray, metadata: List[dict]) -> List[int]:

        if embeddings.shape[1] != self.embedding_dim:
            raise ValueError(
                f"Embedding dimension mismatch: expected {self.embedding_dim}, "
                f"got {embeddings.shape[1]}"
            )

        embeddings = embeddings.astype("float32")

        num_vectors = embeddings.shape[0]
        ids = list(range(self.current_id, self.current_id + num_vectors))

        self.index.add(embeddings)

        for i, meta in zip(ids, metadata):
            self.id_to_metadata[i] = meta

        self.current_id += num_vectors

        print(f"Added {num_vectors} vectors. Total: {self.index.ntotal}")
        return ids

    def search(
        self,
        query_embedding: np.ndarray,
        k: int = 5,
        version_filter: Optional[int] = None,
    ) -> List[Tuple[float, dict]]:

        if self.index.ntotal == 0:
            return []

        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        query_embedding = query_embedding.astype("float32")

        search_k = k * 10 if version_filter else k
        distances, indices = self.index.search(
            query_embedding, min(search_k, self.index.ntotal)
        )

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue

            metadata = self.id_to_metadata.get(int(idx), {})

            if version_filter is not None:
                if metadata.get("version_id") != version_filter:
                    continue

            results.append((float(dist), metadata))

            if len(results) >= k:
                break

        return results

    def save(self):
        faiss.write_index(self.index, f"{self.index_path}.faiss")

        with open(f"{self.index_path}.meta", "wb") as f:
            pickle.dump(
                {
                    "id_to_metadata": self.id_to_metadata,
                    "current_id": self.current_id,
                    "embedding_dim": self.embedding_dim,
                },
                f,
            )

        print(f"Saved index to {self.index_path}")

    def load(self):
        try:
            self.index = faiss.read_index(f"{self.index_path}.faiss")

            with open(f"{self.index_path}.meta", "rb") as f:
                data = pickle.load(f)
                self.id_to_metadata = data["id_to_metadata"]
                self.current_id = data["current_id"]
                self.embedding_dim = data["embedding_dim"]

            print(f"Loaded index from {self.index_path} ({self.index.ntotal} vectors)")
        except Exception as e:
            print(f"Error loading index: {e}")
            self._create_new_index()

    def get_stats(self) -> dict:
        return {
            "total_vectors": self.index.ntotal if self.index else 0,
            "embedding_dim": self.embedding_dim,
            "index_path": self.index_path,
        }
