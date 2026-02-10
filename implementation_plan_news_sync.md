# Implementation Plan - Background News Sync & Caching

## Goal Description
Improve News Loading Speed and Fix Missing Images by:
1.  Fetching news in the background every 1 minute.
2.  Scraping high-quality `og:image` tags from article URLs (fixing broken/low-res images).
3.  Storing structured news data in MongoDB.
4.  Serving cached data instantly from the DB to the Frontend.

## User Review Required
> [!NOTE]
> Initial news load might still take a few seconds if the DB is empty on first startup. Subsequent loads will be instant.

## Proposed Changes

### Backend

#### [NEW] [news_service.py](file:///c:/Users/nidhi/CODING/CIO/backend/cio_app/services/news_service.py)
- Create `NewsService` class.
- Method `fetch_and_store_news()`:
    - Parse RSS Feed.
    - Check DB for duplicates (by link).
    - If new:
        - Fetch article HTML.
        - Extract `og:image` meta tag.
        - Insert into `news` collection with timestamp.
- Method `get_latest_news(limit=20)`:
    - Query `news` collection, sort by `pub_date` desc.

#### [MODIFY] [main.py](file:///c:/Users/nidhi/CODING/CIO/backend/cio_app/main.py)
- Initialize `APScheduler`.
- Schedule `NewsService.fetch_and_store_news` to run every 60 seconds.
- Ensure scheduler starts/stops with FastAPI app lifespan.

#### [MODIFY] [routers/news.py](file:///c:/Users/nidhi/CODING/CIO/backend/cio_app/routers/news.py)
- Replace direct RSS parsing with `await NewsService.get_latest_news()`.

## Verification Plan

### Manual Verification
1.  **Startup**: Start backend. Watch logs for "Fetching news..." and "Inserted X new articles".
2.  **DB Check**: Verify data in MongoDB (optional, can use a script).
3.  **Frontend**: Reload Home Page. News should appear *instantly* (sub-100ms).
4.  **Images**: Verify news cards now show high-quality images (scraped from `og:image`) instead of placeholders.
