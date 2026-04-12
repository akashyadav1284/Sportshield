"""SportShield AI — Scan orchestrator: aggregate, dedup, evaluate candidates."""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from urllib.parse import urlparse, urlunparse

import httpx
import numpy as np
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import MediaAsset
from app.models.violation import Violation
from app.ai.fingerprint import generate_phash, hamming_distance, compute_phash_score
from app.ai.embeddings import extract_embedding, cosine_similarity
from app.scanner.google_images import CandidateResult, search_google_images
from app.scanner.bing_images import search_bing_images
from app.scanner.serpapi import search_serpapi
from app.scanner.youtube import search_youtube_videos


def normalize_url(url: str) -> str:
    """Normalize a URL for deduplication by stripping fragments and trailing slashes."""
    parsed = urlparse(url)
    normalized = urlunparse(
        (parsed.scheme.lower(), parsed.netloc.lower(), parsed.path.rstrip("/"),
         parsed.params, parsed.query, "")
    )
    return normalized


def detect_platform(url: str) -> str:
    """Detect the platform from a URL's domain."""
    domain = urlparse(url).netloc.lower()
    if "google" in domain:
        return "google"
    if "bing" in domain:
        return "bing"
    if "twitter" in domain or "x.com" in domain:
        return "twitter"
    if "youtube" in domain or "youtu.be" in domain:
        return "youtube"
    if "facebook" in domain or "fb.com" in domain:
        return "web"
    if "instagram" in domain:
        return "web"
    return "web"


def compute_confidence_score(phash_dist: Optional[int], cnn_sim: Optional[float]) -> float:
    """Compute final confidence score from pHash distance and CNN similarity.

    Formula: final_score = (0.4 × phash_score) + (0.6 × cnn_score), normalized to 0–100.

    Args:
        phash_dist: Hamming distance between perceptual hashes.
        cnn_sim: Cosine similarity between CNN embeddings.

    Returns:
        Confidence score 0-100.
    """
    phash_score = compute_phash_score(phash_dist) if phash_dist is not None else 0.0
    cnn_score = (cnn_sim * 100) if cnn_sim is not None else 0.0
    return (0.4 * phash_score) + (0.6 * cnn_score)


def determine_severity(confidence_score: float) -> Optional[str]:
    """Determine severity tier from confidence score.

    ≥ 90 → HIGH; 75–89 → MEDIUM; 60–74 → LOW; < 60 → discard (None).
    """
    if confidence_score >= 90:
        return "high"
    elif confidence_score >= 75:
        return "medium"
    elif confidence_score >= 60:
        return "low"
    return None


async def download_image(url: str, timeout: float = 5.0) -> Optional[bytes]:
    """Download image bytes from a URL with timeout."""
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            content_type = response.headers.get("content-type", "")
            if "image" not in content_type and "octet-stream" not in content_type:
                return None
            return response.content
    except Exception:
        return None


async def check_duplicate_violation(
    db: AsyncSession, asset_id, detected_url: str
) -> bool:
    """Check if a violation already exists for this URL + asset in the last 24 hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    stmt = select(Violation).where(
        and_(
            Violation.asset_id == asset_id,
            Violation.detected_url == detected_url,
            Violation.detected_at >= cutoff,
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def run_scan_for_asset(asset: MediaAsset, db: AsyncSession) -> dict:
    """Execute a full scan cycle for one asset.

    1. Fetch asset's phash and embedding from DB
    2. Concurrently call all 3 scanners
    3. Deduplicate candidates by URL
    4. For each unique candidate: download, pHash stage 1, CNN stage 2
    5. Create Violation records for matches ≥ 60
    6. Return scan results summary

    Args:
        asset: MediaAsset ORM object with phash and embedding.
        db: Async database session.

    Returns:
        Dict with candidates_found and violations_created counts.
    """
    asset_phash = asset.phash
    asset_storage_url = asset.storage_url

    # Load asset embedding from FAISS if available
    asset_embedding: Optional[np.ndarray] = None
    if asset.faiss_index_id is not None:
        try:
            from app.ai.similarity import FAISSIndex
            faiss_index = FAISSIndex()
            idx = asset.faiss_index_id
            if idx < faiss_index.index.ntotal:
                asset_embedding = faiss_index.index.reconstruct(int(idx))
        except Exception:
            pass

    # If no embedding from FAISS, try to regenerate from storage
    if asset_embedding is None:
        try:
            from app.core.storage import storage
            file_bytes = await storage.download(asset.storage_key)
            asset_embedding = extract_embedding(file_bytes)
        except Exception:
            pass

    # Concurrently run all scanners
    scanner_results = await asyncio.gather(
        search_google_images(asset.name),
        search_bing_images(asset.name),
        search_youtube_videos(asset.name),
        search_serpapi(asset_storage_url) if asset_storage_url.startswith("http") else asyncio.coroutine(lambda: [])(),
        return_exceptions=True,
    )

    # Collect all candidates
    all_candidates: List[CandidateResult] = []
    for result in scanner_results:
        if isinstance(result, list):
            all_candidates.extend(result)

    # Deduplicate by normalized URL
    seen_urls = set()
    unique_candidates: List[CandidateResult] = []
    for candidate in all_candidates:
        norm = normalize_url(candidate.url)
        if norm not in seen_urls:
            seen_urls.add(norm)
            unique_candidates.append(candidate)

    candidates_found = len(unique_candidates)
    violations_created = 0

    for candidate in unique_candidates:
        # Check for duplicate violations
        is_dup = await check_duplicate_violation(db, asset.id, candidate.url)
        if is_dup:
            continue

        # Download candidate image
        image_bytes = await download_image(candidate.url)
        if image_bytes is None:
            continue

        # Stage 1: pHash comparison
        phash_dist = None
        if asset_phash:
            try:
                candidate_phash = generate_phash(image_bytes)
                phash_dist = hamming_distance(asset_phash, candidate_phash)
                if phash_dist > 25:
                    continue  # Too different, skip
            except Exception:
                continue

        # Stage 2: CNN embedding comparison
        cnn_sim = None
        if asset_embedding is not None:
            try:
                candidate_embedding = extract_embedding(image_bytes)
                cnn_sim = cosine_similarity(asset_embedding, candidate_embedding)
            except Exception:
                pass

        # Compute final confidence score
        confidence = compute_confidence_score(phash_dist, cnn_sim)
        severity = determine_severity(confidence)

        if severity is None:
            continue  # Below threshold

        # Create violation record
        platform = detect_platform(candidate.url)
        violation = Violation(
            org_id=asset.org_id,
            asset_id=asset.id,
            detected_url=candidate.url,
            platform=platform,
            thumbnail_url=candidate.thumbnail_url,
            phash_distance=phash_dist,
            cnn_similarity=cnn_sim,
            confidence_score=confidence,
            severity=severity,
            status="new",
        )
        db.add(violation)
        violations_created += 1

        # Dispatch alert for HIGH severity
        if severity == "high":
            try:
                await db.flush()  # Get the violation ID
                from app.tasks.alert_task import send_violation_alert
                send_violation_alert.delay(str(violation.id))
            except Exception:
                pass

    # Update asset metadata
    asset.last_scan_at = datetime.now(timezone.utc)
    asset.scan_count = (asset.scan_count or 0) + 1
    asset.violation_count = (asset.violation_count or 0) + violations_created

    await db.commit()

    return {
        "candidates_found": candidates_found,
        "violations_created": violations_created,
    }
