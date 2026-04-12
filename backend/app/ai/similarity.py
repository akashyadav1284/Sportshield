"""SportShield AI — FAISS vector similarity index."""

import json
import os
import threading
from pathlib import Path
from typing import List, Tuple, Optional

import numpy as np
import faiss

from app.core.config import settings


class FAISSIndex:
    """Thread-safe FAISS index for semantic CLIP embedding similarity search.

    Uses IndexFlatL2 for exact nearest-neighbor search.
    Maintains a parallel ID map from FAISS internal IDs to asset UUIDs.
    """

    _instance: Optional["FAISSIndex"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "FAISSIndex":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._write_lock = threading.Lock()

        self.dimension = 512
        self.index_path = settings.FAISS_INDEX_PATH
        self.map_path = settings.FAISS_MAP_PATH

        # Ensure directories exist
        Path(self.index_path).parent.mkdir(parents=True, exist_ok=True)
        Path(self.map_path).parent.mkdir(parents=True, exist_ok=True)

        # Load or create index
        if os.path.exists(self.index_path) and os.path.exists(self.map_path):
            self.index = faiss.read_index(self.index_path)
            
            # Protection constraint: If upgrading from ResNet (2048) to CLIP (512)
            if self.index.d != self.dimension:
                print(f"⚠️ FAISS dimensional mismatch detected! Found {self.index.d}. Expected {self.dimension}.")
                print("Nuking legacy FAISS binary mappings.")
                os.remove(self.index_path)
                os.remove(self.map_path)
                self.index = faiss.IndexFlatL2(self.dimension)
                self.id_map: List[str] = []
            else:
                with open(self.map_path, "r") as f:
                    self.id_map: List[str] = json.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.id_map: List[str] = []

    def add_to_index(self, asset_id: str, embedding: np.ndarray) -> int:
        """Add an embedding to the FAISS index.

        Args:
            asset_id: UUID string of the asset.
            embedding: 512-d float32 numpy array.

        Returns:
            FAISS internal ID (0-indexed position).
        """
        with self._write_lock:
            # Check if asset already exists
            if asset_id in self.id_map:
                return self.id_map.index(asset_id)

            vector = embedding.reshape(1, -1).astype(np.float32)
            self.index.add(vector)
            faiss_id = len(self.id_map)
            self.id_map.append(asset_id)
            self._save()
            return faiss_id

    def search_index(
        self, query_embedding: np.ndarray, k: int = 20
    ) -> List[Tuple[str, float]]:
        """Search the index for nearest neighbors.

        Args:
            query_embedding: 512-d float32 query vector.
            k: Number of nearest neighbors to return.

        Returns:
            List of (asset_id, L2_distance) tuples sorted by distance.
        """
        if self.index.ntotal == 0:
            return []

        k = min(k, self.index.ntotal)
        vector = query_embedding.reshape(1, -1).astype(np.float32)
        distances, indices = self.index.search(vector, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx >= 0 and idx < len(self.id_map):
                results.append((self.id_map[idx], float(dist)))
        return results

    def remove_from_index(self, asset_id: str) -> None:
        """Remove an asset from the index by rebuilding without it.

        This is expensive but necessary for IndexFlatL2.
        """
        with self._write_lock:
            if asset_id not in self.id_map:
                return

            idx = self.id_map.index(asset_id)
            # Reconstruct all vectors except the one to remove
            if self.index.ntotal > 1:
                vectors = []
                new_map = []
                for i, aid in enumerate(self.id_map):
                    if aid != asset_id:
                        vec = self.index.reconstruct(i)
                        vectors.append(vec)
                        new_map.append(aid)

                self.index = faiss.IndexFlatL2(self.dimension)
                if vectors:
                    self.index.add(np.array(vectors).astype(np.float32))
                self.id_map = new_map
            else:
                self.index = faiss.IndexFlatL2(self.dimension)
                self.id_map = []

            self._save()

    def _save(self) -> None:
        """Persist index and ID map to disk."""
        faiss.write_index(self.index, self.index_path)
        with open(self.map_path, "w") as f:
            json.dump(self.id_map, f)


# Module-level convenience functions
def add_to_index(asset_id: str, embedding: np.ndarray) -> int:
    """Add an embedding to the global FAISS index."""
    return FAISSIndex().add_to_index(asset_id, embedding)


def search_index(
    query_embedding: np.ndarray, k: int = 20
) -> List[Tuple[str, float]]:
    """Search the global FAISS index for nearest neighbors."""
    return FAISSIndex().search_index(query_embedding, k)
