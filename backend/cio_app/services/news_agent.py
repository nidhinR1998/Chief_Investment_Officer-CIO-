from GoogleNews import GoogleNews
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class NewsService:
    @staticmethod
    def get_news(ticker: str, limit: int = 5) -> list:
        """
        Fetches news for the given ticker.
        Priority 1: GoogleNews (Scraper)
        Priority 2: Yahoo Finance API (Fallback)
        """
        # Clean ticker for search (remove .NS)
        search_term = ticker.replace(".NS", "").replace(".BO", "") + " stock news india"
        news_items = []
        
        # 1. Try Google News
        try:
            googlenews = GoogleNews(lang='en', region='IN')
            googlenews.search(search_term)
            results = googlenews.result()
            googlenews.clear()
            
            for item in results[:limit]:
                link = item.get("link", "")
                if "&ved=" in link:
                    link = link.split("&ved=")[0]
                
                news_items.append({
                    "title": item.get("title"),
                    "link": link,
                    "date": item.get("date"), 
                    "media": item.get("media")
                })
        except Exception as e:
            logger.warning(f"GoogleNews failed for {ticker}: {e}")

        # 2. Check and Fallback
        if not news_items:
            logger.info(f"GoogleNews empty/failed for {ticker}. Using YFinance fallback.")
            try:
                import yfinance as yf
                stock = yf.Ticker(ticker)
                yf_news = stock.news
                for item in yf_news:
                    # YFinance returns nested structure: item['content']['title']
                    content = item.get('content', {})
                    if not content: continue
                    
                    # Extract fields
                    title = content.get('title', 'No Title')
                    pub_date = content.get('pubDate', '')[:10] # 2026-01-23...
                    summary = content.get('summary', 'News from Chief Investment Officer(CIO)')
                    
                    # Link might be in clickThroughUrl or canonicalUrl
                    link_obj = content.get('clickThroughUrl') or content.get('canonicalUrl')
                    link = link_obj.get('url') if link_obj else '#'
                    
                    # Provider
                    provider = content.get('provider', {}).get('displayName', 'Chief Investment Officer(CIO)')

                    news_items.append({
                        "title": title,
                        "link": link,
                        "date": pub_date,
                        "media": provider,
                        "desc": summary
                    })
            except Exception as yf_e:
                logger.error(f"YFinance News failed for {ticker}: {yf_e}")

        return news_items[:limit]

news_service = NewsService()
