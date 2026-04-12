"""SportShield AI — YouTube Data API scraper (Mocked Engine)."""

import asyncio
from typing import List
import random
import uuid

from app.scanner.google_images import CandidateResult
from app.core.config import settings

# Mock configuration flag. For Phase 8 we default to MOCK logic to prevent API quota drain.
MOCK_YOUTUBE_MODE = True

async def search_youtube_videos(query: str, num_results: int = 5) -> List[CandidateResult]:
    """Search YouTube for videos matching a query, returning thumbnail vectors for CNN scans.

    In Mock mode, generates dummy youtube matches to simulate threat signatures
    being discovered on social media.

    Args:
        query: Search query (typically the asset name).
        num_results: Max videos to fetch.

    Returns:
        List of CandidateResult objects pointing to YouTube thumbnails.
    """
    if not settings.GOOGLE_API_KEY and not MOCK_YOUTUBE_MODE:
        return []

    results: List[CandidateResult] = []

    if MOCK_YOUTUBE_MODE:
        # Simulate network latency of scraping the API
        await asyncio.sleep(1.5)
        
        # MOCK DATA GENERATION: Generate authentic-looking YouTube Thumbnails URLs.
        # We use dummy thumbnail images from picsum or placehold for the AI hash to ingest
        mock_video_ids = [str(uuid.uuid4())[:11] for _ in range(num_results)]

        for vid in mock_video_ids:
            # The YouTube URL where the "violation" is hosted
            video_url = f"https://www.youtube.com/watch?v={vid}"
            
            # The candidate image URL representing this video that we scrape for the AI to analyze.
            # Using real placeholder images so PyTorch CNN embeddings don't crash.
            # Actually, to make FAISS find collisions, we need images. 
            # We will use Lorem Picsum to generate varied valid PNGs.
            random_seed = random.randint(100, 1000)
            thumbnail_url = f"https://picsum.photos/seed/{vid}/400/300.jpg"

            results.append(
                CandidateResult(
                    url=thumbnail_url, # The orchestrator downloads the thumbnail for FAISS detection
                    thumbnail_url=thumbnail_url, 
                    source="youtube",
                )
            )
        
        return results

    # TODO: Native Google API Client logic handles here once un-mocked
    # youtube_service = build('youtube', 'v3', developerKey=settings.GOOGLE_API_KEY)
    # request = youtube_service.search().list(...)
    
    return results
