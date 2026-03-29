import logging
import re

import httpx

logger = logging.getLogger(__name__)

APIFY_ACTOR_ID = "A3cAPGpwBEG8RJwse"
APIFY_BASE_URL = "https://api.apify.com/v2"


async def scrape_public_profile(linkedin_url: str) -> dict:
    """Scrape basic profile info from a public LinkedIn page via meta tags."""
    headline = ""
    summary = ""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                str(linkedin_url),
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    )
                },
            )
            if response.status_code == 200:
                text = response.text
                title_match = re.search(
                    r'<meta[^>]*property="og:title"[^>]*content="([^"]*)"',
                    text,
                )
                desc_match = re.search(
                    r'<meta[^>]*property="og:description"[^>]*content="([^"]*)"',
                    text,
                )
                if title_match:
                    headline = title_match.group(1)
                if desc_match:
                    summary = desc_match.group(1)
    except Exception:
        logger.warning(
            "Failed to scrape LinkedIn public profile for %s", linkedin_url
        )

    return {"headline": headline, "summary": summary}


async def scrape_posts_via_apify(
    linkedin_url: str, api_token: str
) -> list[dict]:
    """Scrape LinkedIn posts using the Apify harvestapi/linkedin-profile-posts actor."""
    if not api_token:
        logger.warning("No Apify API token provided, returning mock data")
        return get_mock_linkedin_data()["posts"]

    try:
        actor_input = {
            "targetUrls": [str(linkedin_url)],
            "maxPosts": 10,
            "includeReposts": False,
            "scrapeReactions": False,
            "scrapeComments": False,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            # Start the actor run
            run_response = await client.post(
                f"{APIFY_BASE_URL}/acts/{APIFY_ACTOR_ID}/runs",
                params={"token": api_token},
                json=actor_input,
            )
            if run_response.status_code not in (200, 201):
                logger.warning(
                    "Apify actor start failed: %s", run_response.status_code
                )
                return get_mock_linkedin_data()["posts"]

            run_data = run_response.json().get("data", {})
            run_id = run_data.get("id")
            if not run_id:
                logger.warning("No run ID returned from Apify")
                return get_mock_linkedin_data()["posts"]

            # Wait for the run to finish
            dataset_id = None
            for _ in range(60):
                import asyncio

                await asyncio.sleep(2)

                status_response = await client.get(
                    f"{APIFY_BASE_URL}/actor-runs/{run_id}",
                    params={"token": api_token},
                )
                if status_response.status_code != 200:
                    continue

                status_data = status_response.json().get("data", {})
                run_status = status_data.get("status")

                if run_status == "SUCCEEDED":
                    dataset_id = status_data.get("defaultDatasetId")
                    break
                elif run_status in ("FAILED", "ABORTED", "TIMED-OUT"):
                    logger.warning("Apify run ended with status: %s", run_status)
                    return get_mock_linkedin_data()["posts"]

            if not dataset_id:
                logger.warning("Apify run did not complete in time")
                return get_mock_linkedin_data()["posts"]

            # Get dataset items
            items_response = await client.get(
                f"{APIFY_BASE_URL}/datasets/{dataset_id}/items",
                params={"token": api_token, "format": "json"},
            )
            if items_response.status_code != 200:
                logger.warning("Failed to fetch Apify dataset items")
                return get_mock_linkedin_data()["posts"]

            items = items_response.json()
            if not items:
                logger.info("Apify returned empty dataset, using mock data")
                return get_mock_linkedin_data()["posts"]

            posts = []
            for item in items:
                post = {
                    "text": item.get("text", item.get("postText", "")),
                    "likes": item.get("likesCount", item.get("numLikes", 0)),
                    "comments": item.get("commentsCount", item.get("numComments", 0)),
                }
                posts.append(post)

            return posts if posts else get_mock_linkedin_data()["posts"]

    except Exception:
        logger.exception("Apify scraping failed for %s", linkedin_url)
        return get_mock_linkedin_data()["posts"]


def get_mock_linkedin_data() -> dict:
    """Return mock LinkedIn data for development and fallback."""
    return {
        "headline": "Senior Software Engineer | Building scalable systems",
        "summary": (
            "Passionate about building high-quality software with a focus "
            "on distributed systems and cloud architecture. Over 8 years "
            "of experience leading engineering teams."
        ),
        "posts": [
            {
                "text": (
                    "Excited to share my latest article on building "
                    "resilient microservices. Key takeaways: circuit breakers, "
                    "retry patterns, and graceful degradation are essential."
                ),
                "likes": 142,
                "comments": 23,
            },
            {
                "text": (
                    "Three things I learned about leadership this year: "
                    "1) Listen more than you speak. "
                    "2) Give credit publicly. "
                    "3) Take responsibility privately."
                ),
                "likes": 287,
                "comments": 45,
            },
            {
                "text": (
                    "Hot take: the best documentation is the one that "
                    "actually gets maintained. Invest in doc-as-code "
                    "practices and automate what you can."
                ),
                "likes": 98,
                "comments": 17,
            },
        ],
    }
