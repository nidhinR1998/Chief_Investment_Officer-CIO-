from fastapi import APIRouter
import logging
import asyncio

router = APIRouter(prefix="/api/v1/news", tags=["news"])
logger = logging.getLogger(__name__)

@router.get("/global")
async def get_global_news():
    """
    Fetch top market news for India from multiple topics.
    """
    try:
        # Fallback to RSS Feed (Reliable, no 429s)
        # Economic Times Market News RSS
        rss_url = "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
        
        # Simple RSS Parser using builtin XML
        import requests
        import xml.etree.ElementTree as ET
        
        resp = await asyncio.to_thread(requests.get, rss_url)
        root = ET.fromstring(resp.content)
        
        news_items = []
        for item in root.findall('.//item'):
            title = item.find('title')
            link = item.find('link')
            desc = item.find('description')
            pub_date = item.find('pubDate')
            
            # Safe extraction
            title_text = title.text if title is not None else "No Title"
            link_text = link.text if link is not None else "#"
            desc_text = desc.text if desc is not None else ""
            date_text = pub_date.text[:16] if pub_date is not None else "" # Simplify date string

            # Clean Desc (remove images often in RSS)
            if desc_text and '<img' in desc_text:
                if '</a>' in desc_text:
                    desc_text = desc_text.split('</a>')[1]
                else:
                    desc_text = "Click to read more..."
            
            news_items.append({
                "title": title_text,
                "link": link_text,
                "date": date_text, 
                "media": "Economic Times",
                "desc": desc_text or "Latest Market News"
            })
            
        return news_items[:20]

    except Exception as e:
        logger.error(f"Global news fetch failed: {e}")
        return []
