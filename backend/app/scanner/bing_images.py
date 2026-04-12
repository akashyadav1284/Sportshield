"""SportShield AI — Bing Image Search API v7 scanner."""

from typing import List

import httpx

from app.core.config import settings
from app.scanner.google_images import CandidateResult


async def search_bing_images(query: str, count: int = 20) -> List[CandidateResult]:
    """Search Bing Image Search API v7 for images matching a query.

    Args:
        query: Search query (typically the asset name).
        count: Number of results to request.

    Returns:
        List of CandidateResult objects with image URLs.
    """
    if not settings.BING_API_KEY:
        return []

    url = "https://api.bing.microsoft.com/v7.0/images/search"
    headers = {
        "Ocp-Apim-Subscription-Key": settings.BING_API_KEY,
    }
    params = {
        "q": query,
        "count": count,
        "imageType": "Photo",
    }

    results: List[CandidateResult] = []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

            for item in data.get("value", []):
                content_url = item.get("contentUrl", "")
                thumbnail_url = item.get("thumbnailUrl", content_url)
                if content_url:
                    results.append(
                        CandidateResult(
                            url=content_url,
                            thumbnail_url=thumbnail_url,
                            source="bing",
                        )
                    )
    except (httpx.HTTPError, Exception) as e:
        print(f"Bing Images search error: {e}")

    return results
