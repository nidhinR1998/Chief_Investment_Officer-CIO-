from fastapi import APIRouter
import logging
import asyncio

router = APIRouter(prefix="/api/v1/news", tags=["news"])
logger = logging.getLogger(__name__)

@router.get("/global")
async def get_global_news():
    """
    Fetch top market news from MongoDB cache (updated every 1 min).
    """
    from cio_app.services.news_service import NewsService
    try:
        news_items = await NewsService.get_latest_news()
        return news_items
    except Exception as e:
        logger.error(f"Global news fetch failed: {e}")
        return []
