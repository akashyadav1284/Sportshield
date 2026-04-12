"""SportShield AI — Google Custom Search image scanner."""

from dataclasses import dataclass
from typing import List

import httpx

from app.core.config import settings


@dataclass
class CandidateResult:
    """A potential match found by a search engine."""
    url: str
    thumbnail_url: str
    source: str


async def search_google_images(query: str, num_results: int = 10) -> List[CandidateResult]:
    """Search Google Custom Search JSON API for images matching a query.

    Args:
        query: Search query (typically the asset name).
        num_results: Number of results to request (max 10 per call).

    Returns:
        List of CandidateResult objects with image URLs.
    """
    if not settings.GOOGLE_API_KEY or not settings.GOOGLE_CSE_ID:
        return []

    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": settings.GOOGLE_API_KEY,
        "cx": settings.GOOGLE_CSE_ID,
        "searchType": "image",
        "q": query,
        "num": min(num_results, 10),
    }

    results: List[CandidateResult] = []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            for item in data.get("items", []):
                image_url = item.get("link", "")
                thumbnail = item.get("image", {}).get("thumbnailLink", image_url)
                if image_url:
                    results.append(
                        CandidateResult(
                            url=image_url,
                            thumbnail_url=thumbnail,
                            source="google",
                        )
                    )
    except (httpx.HTTPError, Exception) as e:
        print(f"Google Images search error: {e}")

    return results
