"""SportShield AI — SerpApi reverse image search (Google Lens)."""

from typing import List

import httpx

from app.core.config import settings
from app.scanner.google_images import CandidateResult


async def search_serpapi(image_url: str) -> List[CandidateResult]:
    """Perform a reverse image search via SerpApi Google Lens.

    Args:
        image_url: Public URL of the original asset image.

    Returns:
        List of CandidateResult objects with visually similar URLs.
    """
    if not settings.SERPAPI_KEY:
        return []

    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_lens",
        "api_key": settings.SERPAPI_KEY,
        "url": image_url,
    }

    results: List[CandidateResult] = []

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            for match in data.get("visual_matches", []):
                link = match.get("link", "")
                thumbnail = match.get("thumbnail", link)
                if link:
                    results.append(
                        CandidateResult(
                            url=link,
                            thumbnail_url=thumbnail,
                            source="serpapi",
                        )
                    )
    except (httpx.HTTPError, Exception) as e:
        print(f"SerpApi search error: {e}")

    return results
