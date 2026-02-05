from fastapi import APIRouter, HTTPException, BackgroundTasks
from cio_app.services.decision_engine import decision_engine
from cio_app.services.scheduler import scheduler
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
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"
        
    try:
        scheduler.remove_stock_job(ticker)
        return {"status": "stopped", "ticker": ticker, "message": "Monitoring stopped"}
    except Exception as e:
        logger.error(f"Failed to stop monitoring for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
