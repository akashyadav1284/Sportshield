"""SportShield AI — CNN feature extraction using ResNet-50."""

import threading
from io import BytesIO
from typing import Optional

import numpy as np
from PIL import Image
try:
    import torch
    from transformers import CLIPProcessor, CLIPModel
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False


class EmbeddingExtractor:
    """Singleton OpenAI CLIP feature extractor.

    Loads the CLIP ViT-B/32 semantic backbone recursively 
    for fast deep learning inferences across the platform.
    """

    _instance: Optional["EmbeddingExtractor"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "EmbeddingExtractor":
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

        if not ML_AVAILABLE:
            print("EmbeddingExtractor initialized without ML capabilities (Free Tier).")
            return

        # Load pretrained ResNet-50 and remove classification head
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model_id = "openai/clip-vit-base-patch32"
        self.model = CLIPModel.from_pretrained(model_id).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_id)
        self.model.eval()

    def extract(self, image_bytes: bytes) -> np.ndarray:
        """Extract a 512-d semantic feature vector from image bytes via CLIP.

        Args:
            image_bytes: Raw image bytes (JPEG, PNG, etc.)

        Returns:
            L2-normalized 512-d float32 numpy array.
        """
        if not ML_AVAILABLE:
            # Return dummy feature vector for free tier demo fallback
            return np.zeros(512, dtype=np.float32)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)

        with torch.no_grad():
            features = self.model.get_image_features(**inputs)

        # Convert to numpy and L2-normalize
        embedding = features.cpu().numpy().flatten().astype(np.float32)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        return embedding


def extract_embedding(image_bytes: bytes) -> np.ndarray:
    """Public interface for CNN embedding extraction.

    Uses a cached singleton model instance.

    Args:
        image_bytes: Raw image bytes.

    Returns:
        L2-normalized 512-d float32 numpy array.
    """
    extractor = EmbeddingExtractor()
    return extractor.extract(image_bytes)


def cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Compute cosine similarity between two L2-normalized embeddings.

    Args:
        embedding1: First embedding vector.
        embedding2: Second embedding vector.

    Returns:
        Cosine similarity score (0.0 to 1.0).
    """
    return float(np.dot(embedding1, embedding2))
