"""Tests for the FAISS similarity index."""

import os
import tempfile
import json
import pytest
import numpy as np

from app.ai.similarity import FAISSIndex


class TestFAISSIndex:
    def setup_method(self):
        """Reset singleton and use temp files for each test."""
        FAISSIndex._instance = None
        FAISSIndex._initialized = False if hasattr(FAISSIndex, '_initialized') else None

        self.tmpdir = tempfile.mkdtemp()
        os.environ["FAISS_INDEX_PATH"] = os.path.join(self.tmpdir, "test_index.bin")
        os.environ["FAISS_MAP_PATH"] = os.path.join(self.tmpdir, "test_map.json")

    def test_add_and_search(self):
        idx = FAISSIndex()
        idx.index_path = os.path.join(self.tmpdir, "test_index.bin")
        idx.map_path = os.path.join(self.tmpdir, "test_map.json")

        embedding = np.random.randn(2048).astype(np.float32)
        embedding = embedding / np.linalg.norm(embedding)

        faiss_id = idx.add_to_index("asset-1", embedding)
        assert faiss_id == 0

        results = idx.search_index(embedding, k=1)
        assert len(results) == 1
        assert results[0][0] == "asset-1"
        assert results[0][1] < 0.001  # Nearly identical

    def test_duplicate_add_returns_existing_id(self):
        idx = FAISSIndex()
        idx.index_path = os.path.join(self.tmpdir, "test_index.bin")
        idx.map_path = os.path.join(self.tmpdir, "test_map.json")

        embedding = np.random.randn(2048).astype(np.float32)
        id1 = idx.add_to_index("asset-1", embedding)
        id2 = idx.add_to_index("asset-1", embedding)
        assert id1 == id2

    def test_empty_index_search(self):
        idx = FAISSIndex()
        idx.index_path = os.path.join(self.tmpdir, "test_index.bin")
        idx.map_path = os.path.join(self.tmpdir, "test_map.json")

        query = np.random.randn(2048).astype(np.float32)
        results = idx.search_index(query)
        assert len(results) == 0
