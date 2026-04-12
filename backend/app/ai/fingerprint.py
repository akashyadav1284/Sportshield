"""SportShield AI — Perceptual hashing for image fingerprinting."""

from io import BytesIO

import imagehash
from PIL import Image


def generate_phash(image_bytes: bytes, hash_size: int = 8) -> str:
    """Generate a perceptual hash (pHash) from image bytes.

    Args:
        image_bytes: Raw image bytes.
        hash_size: Hash size (default 8 produces 64-bit hash).

    Returns:
        Hex string of the perceptual hash.
    """
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    h = imagehash.phash(image, hash_size=hash_size)
    return str(h)


def generate_dhash(image_bytes: bytes, hash_size: int = 8) -> str:
    """Generate a difference hash (dHash) from image bytes.

    Args:
        image_bytes: Raw image bytes.
        hash_size: Hash size (default 8 produces 64-bit hash).

    Returns:
        Hex string of the difference hash.
    """
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    h = imagehash.dhash(image, hash_size=hash_size)
    return str(h)


def generate_average_hash(image_bytes: bytes, hash_size: int = 8) -> str:
    """Generate an average hash from image bytes.

    Args:
        image_bytes: Raw image bytes.
        hash_size: Hash size.

    Returns:
        Hex string of the average hash.
    """
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    h = imagehash.average_hash(image, hash_size=hash_size)
    return str(h)


def hamming_distance(hash1: str, hash2: str) -> int:
    """Compute the Hamming distance between two hex hash strings.

    Args:
        hash1: First hash hex string.
        hash2: Second hash hex string.

    Returns:
        Number of differing bits.
    """
    h1 = imagehash.hex_to_hash(hash1)
    h2 = imagehash.hex_to_hash(hash2)
    return h1 - h2


def compute_phash_score(hamming_dist: int) -> float:
    """Convert Hamming distance to a 0-100 score.

    Lower distance = higher score (better match).
    Threshold: ≤ 10 bits = strong match, > 25 = discard.

    Args:
        hamming_dist: Hamming distance between two hashes.

    Returns:
        Float score 0-100.
    """
    return max(0.0, (25 - hamming_dist) / 25) * 100
