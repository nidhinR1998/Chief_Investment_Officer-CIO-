# Implementation Plan - HomeView Real-time Data

## Goal Description
Enable real-time data updates in the `HomeView` dashboard. Currently, it uses simulated random data. We will connect it to the backend to fetch live Market Summary, Trending Stocks, and News.

## User Review Required
> [!IMPORTANT]
> **Performance**: The "Trending" section will initially fetch a fixed list of popular stocks (Reliance, TCS, HDFC, etc.) to ensure low latency. A full market scan for "Top Gainers" across 2000+ stocks is too slow for a real-time home page without a dedicated background worker/database.

## Proposed Changes

### Backend
#### [MODIFY] [market_data.py](file:///c:/Users/nidhi/CODING/CIO/backend/cio_app/routers/market_data.py)
- Add `@router.get("/trending")` endpoint.
- Implementation: Fetch real-time data for a curated list of "Hot" stocks (Reliance, TCS, HDFC Bank, Tata Motors, Infosys).
- Return format: List of objects with `symbol`, `name`, `price`, `change`, `isUp`.

### Frontend
#### [MODIFY] [api.js](file:///c:/Users/nidhi/CODING/CIO/frontend/src/services/api.js)
- Add `getMarketSummary()` calling `/api/v1/market/summary`.
- Add `getTrendingStocks()` calling `/api/v1/market/trending`.
- Add `getLatestNews()` calling `/api/v1/news/global`.

#### [MODIFY] [HomeView.jsx](file:///c:/Users/nidhi/CODING/CIO/frontend/src/components/HomeView.jsx)
- Remove `Math.random()` simulation in `refreshData`.
- Use `Promise.all` to fetch Summary, Trending, and News in parallel.
- Update state with real data.
- Handle loading/error states gracefully (keep existing data if fetch fails).

## Verification Plan

### Automated Tests
- None for this UI integration.

### Manual Verification
1.  **Start Servers**: Ensure Backend (8000) and Frontend (5173) are running.
2.  **Trending**: Open Home Page. Verify "Trending Tickers" shows real prices (compare with Google/Yahoo Finance).
3.  **News**: Verify "Latest News" shows actual headlines from the backend (Economic Times RSS).
4.  **Auto-Refresh**: Wait 30 seconds. Check Network tab (F12) to see new requests to `summary`, `trending`, and `news`. Verify prices update.
