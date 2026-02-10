from datetime import datetime
import logging
import asyncio
import xml.etree.ElementTree as ET
import requests
from bs4 import BeautifulSoup
from cio_app.models.db import get_db

logger = logging.getLogger(__name__)

class NewsService:
    RSS_URL = "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    @classmethod
    async def fetch_and_store_news(cls):
        """
        Background task to fetch RSS, scrape images, and store in MongoDB.
        """
        logger.info("Starting background news sync...")
        try:
            db = await get_db()
            if db is None:
                logger.warning("Database not connected yet, skipping news sync.")
                return

            # 1. Fetch RSS Feed
            logger.info(f"Fetching RSS from {cls.RSS_URL}...")
            try:
                resp = await asyncio.to_thread(requests.get, cls.RSS_URL, headers=cls.HEADERS, timeout=15)
            except Exception as e:
                logger.error(f"RSS fetch threw exception: {e}")
                return

            logger.info(f"RSS Fetch Status: {resp.status_code}")
            if resp.status_code != 200:
                logger.error(f"Failed to fetch RSS feed: {resp.status_code}")
                return

            root = ET.fromstring(resp.content)
            items = root.findall('.//item')
            logger.info(f"Found {len(items)} items in RSS feed")
            
            new_count = 0
            
            for i, item in enumerate(items[:20]):
                title = item.find('title')
                link = item.find('link')
                desc = item.find('description')
                pub_date = item.find('pubDate')
                
                if link is None or not link.text:
                    continue

                link_text = link.text.strip()
                
                # 2. Check cancellation/existence
                existing = await db.news.find_one({'link': link_text})
                if existing:
                    continue

                # 3. New Article - Prepare Object
                title_text = title.text.strip() if title is not None and title.text else "No Title"
                desc_text = desc.text.strip() if desc is not None and desc.text else ""
                
                # Clean HTML from desc
                soup_desc = BeautifulSoup(desc_text, 'html.parser')
                clean_desc = soup_desc.get_text()
                
                # 4. Scrape OG Image (The "Magic" Step)
                image_url = None
                try:
                    logger.info(f"Scraping image for: {title_text[:30]}...")
                    article_resp = await asyncio.to_thread(requests.get, link_text, headers=cls.HEADERS, timeout=10)
                    if article_resp.status_code == 200:
                        article_soup = BeautifulSoup(article_resp.content, 'html.parser')
                        og_image = article_soup.find("meta", property="og:image")
                        if og_image and og_image.get("content"):
                            image_url = og_image["content"]
                except Exception as e:
                    logger.warning(f"Failed to scrape image for {link_text}: {e}")

                # 5. Insert into DB
                news_item = {
                    'title': title_text,
                    'link': link_text,
                    'desc': clean_desc[:200] + "..." if len(clean_desc) > 200 else clean_desc,
                    'date': pub_date.text[:16] if pub_date is not None and pub_date.text else datetime.now().strftime("%a, %d %b %Y"),
                    'media': 'Economic Times',
                    'image': image_url,
                    'created_at': datetime.now()
                }
                
                await db.news.insert_one(news_item)
                new_count += 1
            
            logger.info(f"News sync complete. Inserted {new_count} new articles.")

        except Exception as e:
            logger.error(f"Error in news sync: {e}")

    @classmethod
    async def get_latest_news(cls, limit=20):
        """
        Retrieve news from MongoDB, sorted by insertion time.
        """
        db = await get_db()
        if db is None:
            return []
            
        cursor = db.news.find({}, {'_id': 0}).sort('created_at', -1).limit(limit)
        return await cursor.to_list(length=limit)
