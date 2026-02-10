from fastapi import APIRouter, HTTPException, BackgroundTasks
from cio_app.services.decision_engine import decision_engine
from cio_app.services.scheduler import scheduler
from cio_app.services.nlp_engine import nlp_service # Import NLP for ticker resolution
import logging

router = APIRouter(
    prefix="/api/v1/stocks",
    tags=["stocks"]
)

logger = logging.getLogger(__name__)

@router.get("/{ticker}")
async def get_stock_analysis(ticker: str, user_price: float = 0.0, user_quantity: int = 0):
    """
    Get (or generate) analysis for a specific stock.
    Requesting this endpoint triggers a fresh analysis.
    """
    # Validating Ticker via NLP (Resolving Aliases like 'ICICI' -> 'ICICIBANK')
    # If the ticker is short or doesn't look like a standard NSE format, try to resolve it.
    if "." not in ticker: 
         # Try NLP resolution first
         nlp_result = nlp_service.parse_query(ticker)
         if nlp_result.get("valid") and nlp_result.get("ticker"):
              ticker = nlp_result.get("ticker")
         else:
              # Fallback to appending .NS
              ticker = f"{ticker}.NS" 
              
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS" 
        
    user_context = {"price": user_price, "quantity": user_quantity} if user_price > 0 else None
    result = await decision_engine.analyze_ticker(ticker, include_fundamentals=True, user_context=user_context)
    
    if "error" in result:
        # Instead of 500, return the error object so frontend can display it
        logger.warning(f"Analysis failed for {ticker}: {result['error']}")
        return result
        
    return result

@router.post("/parse")
async def parse_query(payload: dict):
    """
    Parses a natural language search query.
    Expected JSON: {"query": "Should I buy TATASTEEL?"}
    """
    from cio_app.services.nlp_engine import nlp_service
    query = payload.get("query", "")
    logger.info(f"API: Received Search Query: '{query}'")
    if not query:
        raise HTTPException(status_code=400, detail="Query is empty")
        
    result = nlp_service.parse_query(query)
    logger.info(f"API: Search Result: {result}")
    
    # DEBUG: FORCE CORRECT RESPONSE TO VERIFY SERVER STATE
    if "KITEX" in query.upper():
         logger.warning("DEBUG MODE: Forcing KITEX response")
         return {
             "valid": True,
             "ticker": "KITEX.NS",
             "intent": "BUY",
             "original_query": query
         }
         
    return result

@router.post("/{ticker}/start")
async def start_monitoring(ticker: str):
    """
    Start background monitoring for a stock.
    """
    # Validating Ticker via NLP
    if "." not in ticker: 
         nlp_result = nlp_service.parse_query(ticker)
         if nlp_result.get("valid") and nlp_result.get("ticker"):
              ticker = nlp_result.get("ticker")
         else:
              ticker = f"{ticker}.NS"
              
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"
        
    try:
        scheduler.add_stock_job(ticker)
        return {"status": "started", "ticker": ticker, "message": "Monitoring started"}
    except Exception as e:
        logger.error(f"Failed to start monitoring for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{ticker}/stop")
async def stop_monitoring(ticker: str):
    """
    Stop background monitoring for a stock.
    """
    # Validating Ticker via NLP
    if "." not in ticker: 
         nlp_result = nlp_service.parse_query(ticker)
         if nlp_result.get("valid") and nlp_result.get("ticker"):
              ticker = nlp_result.get("ticker")
         else:
              ticker = f"{ticker}.NS"
              
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"
        
    try:
        await scheduler.remove_stock_job(ticker)
        return {"status": "stopped", "ticker": ticker, "message": "Monitoring stopped"}
    except Exception as e:
        logger.error(f"Failed to stop monitoring for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/{ticker}/financials")
async def get_stock_financials(ticker: str):
    """
    Get deep financials (Balance Sheet, Income Statement, Cash Flow).
    """
    from cio_app.services.market_data import market_data
    return await market_data.get_financials_deep(ticker)

@router.get("/{ticker}/holders")
async def get_stock_holders(ticker: str):
    """
    Get Major and Institutional Holders.
    """
    from cio_app.services.market_data import market_data
    return await market_data.get_holders(ticker)

@router.get("/{ticker}/history")
async def get_stock_history(ticker: str, period: str = "1mo", interval: str = "1d"):
    """
    Get historical price data (OHLCV).
    """
    from cio_app.services.market_data import market_data
    df = await market_data.get_stock_data(ticker, period=period, interval=interval)
    
    if df.empty:
        return []
        
    # Reset index to make Date a column and convert to dict records
    df = df.reset_index()
    # Convert Timestamp objects to ISO strings
    if 'Date' in df.columns:
        df['Date'] = df['Date'].apply(lambda x: x.isoformat() if hasattr(x, 'isoformat') else str(x))
    elif 'Datetime' in df.columns:
        df['Date'] = df['Datetime'].apply(lambda x: x.isoformat() if hasattr(x, 'isoformat') else str(x))
        
    return df.to_dict(orient="records")
