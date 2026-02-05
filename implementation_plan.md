# Implementation Plan - CIO (Indian Stock Trading AI)

## Goal Description
Build a sophisticated, "beautiful," and agentic AI application for Indian Stock Trading. The app will feature a multi-window desktop-like web interface, real-time data analysis (using `yfinance` for NSE/BSE), offline AI sentiment analysis (Hugging Face), and an automated decision engine.

## User Review Required
> [!IMPORTANT]
> **Data Source Limitation**: We will use `yfinance` which provides *delayed* or *simulated* live data for free. For actual real-time high-frequency trading, a paid broker API (Zerodha, Upstox) would be required. This app will be designed to work with `yfinance` but structured to allow API swaps.

> [!WARNING]
> **Performance**: Running local LLMs/Transformers for sentiment analysis requires decent hardware (GPU preferred). We will implement a **Dynamic Model Selector** that checks available GPU VRAM and defaults to:
> - **Small**: FinBERT (CPU/Low VRAM)
> - **Medium/Big**: Larger Transformer models (High VRAM) mechanism.
> The code will use an **Abstract Provider Pattern** to allow easy swapping to API keys (OpenAI/Anthropic) in the future.

## Proposed Changes

### Tech Stack
- **Backend**: Python 3.10+
    - **Framework**: FastAPI (Async, WebSockets)
    - **Data**: `yfinance` (Stock Data), `GoogleNews` (News)
    - **Analysis**: `pandas-ta` (Technical Indicators), `transformers` (Sentiment), `torch` (Hardware Detection)
    - **Database**: MongoDB (Persisting analysis, user layout, instrument config)
    - **Scheduling**: `APScheduler` (Recurring stock checks)
- **Frontend**: React 18+ (Vite)
    - **Styling**: TailwindCSS, Framer Motion (Animations)
    - **State**: Zustand or React Query
    - **Charts**: `lightweight-charts` (TradingView library) or `Recharts`
    - **Icons**: Lucide React

---

### Backend Components

#### [NEW] [fastapi_app](file:///C:/Users/nidhi/CODING/CIO/backend)
The core backend structure.
- `main.py`: Entry point, WebSocket manager.
- `routers/`: API endpoints for stocks, agents, news.
- `services/`:
    - `market_data.py`: Wrapper for yfinance.
    - `technical_analysis.py`: TA-Lib/Pandas-TA logic.
    - `news_agent.py`: Scraper + Sentiment Model.
    - `ai_engine/`: **[NEW]** Modular AI handling.
        - `provider.py`: Abstract Base Class for AI providers (Local vs API).
        - `model_selector.py`: Logic to check System Resources (GPU/VRAM) and select Small (FinBERT), Medium (Quantized Llama), or Big (Full Precision) models.
    - `decision_engine.py`: The "Brain" that aggregates data and decides.
    - `scheduler.py`: Management of background monitoring threads.
    - `portfolio.py`: **[UPDATED]** Add Cash Balance management and pre-seeded mock user data.

#### [NEW] [models](file:///C:/Users/nidhi/CODING/CIO/backend/models)
- Pydantic models for request/response validation.
- MongoDB schemas.

---

### Frontend Components

#### [NEW] [react_app](file:///C:/Users/nidhi/CODING/CIO/frontend)
- **App.jsx**:
    - **Initialization**: Fetch User Portfolio on startup.
    - **State Management**: `stocks` array = `[...portfolioTickers, ...searchedTickers]`.
    - **Pinning**: distinct visual style or separate section for Portfolio Holdings.
- **StockWindow**: A self-contained component for a single stock.
    - **Tabs**: "Live", "Analysis", "News", "Risk".
    - **Chart**: Interaction candle stick chart.
- **Technical Analysis Engine**: **[UPGRADE]**
    - **Indicators**: EMA (50, 200), MACD, RSI, ATR, Bollinger Bands.
    - **Logic**: 
        - **Golden Cross**: EMA 50 > EMA 200 (Bullish).
        - **Confluence**: Require 2+ signals for entry.
        - **Trend Filter**: Reject Buy signals if Price < EMA 200.
    - **Output**: Detailed reasoning string.
- **PortfolioView**: **[UPDATED]**
    - **Persistence**: Save holdings to `data/portfolio.json` (Mock DB).
    - **Cash**: Display Available Cash/Buying Power.
    - **Visuals**: Allocation Pie Chart.
    - **Actions**: Better Buy/Sell Interface.
- **AlertsView**: **[NEW]**
    - **Persistence**: Save alerts to `data/alerts.json`.
    - **Logic**: Backend check in `scheduler.py` -> WebSocket Notification.
    - **UI**: List, Create, and History of triggered alerts.
- **AgentCanvas**: A notification/interaction center for the AI to ask "Should I buy?".

## Verification Plan

### Automated Tests
- Backend Unit Tests: `pytest` for analysis logic and data fetching.
- API Tests: Test endpoints for stock data retrieval.

### Manual Verification
1. **Startup**: Verify servers start (FastAPI + Vite).
2. **Search**: Enter "RELIANCE" -> Verify window opens.
3. **Data**: Check if candle chart loads with data.
4. **Analysis**: Check if technical indicators (RSI, MACD) are calculated.
5. **News**: Verify news articles are fetched and sentiment is displayed.
6. **Real-time**: Leave window open, wait 1 minute -> Verify data update.
7. **Thread Management**: Type "Close" -> Verify window closes/thread stops.
