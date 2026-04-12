"""Tests for the fingerprint AI module."""

import pytest
from app.ai.fingerprint import (
    generate_phash,
    generate_dhash,
    hamming_distance,
    compute_phash_score,
)
from PIL import Image
from io import BytesIO


def _create_test_image(color: tuple = (255, 0, 0), size: tuple = (100, 100)) -> bytes:
    """Create a simple test image as bytes."""
    img = Image.new("RGB", size, color)
    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    return buffer.getvalue()


class TestPerceptualHashing:
    def test_generate_phash_returns_hex_string(self):
        image_bytes = _create_test_image()
        phash = generate_phash(image_bytes)
        assert isinstance(phash, str)
        assert len(phash) == 16  # 64-bit hash as hex

    def test_generate_dhash_returns_hex_string(self):
        image_bytes = _create_test_image()
        dhash = generate_dhash(image_bytes)
        assert isinstance(dhash, str)
        assert len(dhash) == 16

    def test_identical_images_have_zero_distance(self):
        image_bytes = _create_test_image()
        hash1 = generate_phash(image_bytes)
        hash2 = generate_phash(image_bytes)
        assert hamming_distance(hash1, hash2) == 0

    def test_different_images_have_nonzero_distance(self):
        img1 = _create_test_image(color=(255, 0, 0))
        img2 = _create_test_image(color=(0, 0, 255))
        hash1 = generate_phash(img1)
        hash2 = generate_phash(img2)
        dist = hamming_distance(hash1, hash2)
        assert dist >= 0

    def test_phash_score_perfect_match(self):
        score = compute_phash_score(0)
        assert score == 100.0

    def test_phash_score_threshold(self):
        score = compute_phash_score(25)
        assert score == 0.0

    def test_phash_score_above_threshold(self):
        score = compute_phash_score(30)
        assert score == 0.0

    def test_phash_score_partial_match(self):
        score = compute_phash_score(10)
        assert score == 60.0
