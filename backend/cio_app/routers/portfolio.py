from fastapi import APIRouter, HTTPException, Body
from cio_app.models.portfolio import TradeRequest
from datetime import datetime
import logging
import json
import os
import asyncio

router = APIRouter(prefix="/api/v1/portfolio", tags=["portfolio"])
logger = logging.getLogger(__name__)

# Persistence File
DATA_FILE = "backend/data/portfolio.json"
INITIAL_CASH = 1000000.0  # 10 Lakhs

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"cash": INITIAL_CASH, "holdings": {}}
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except:
        return {"cash": INITIAL_CASH, "holdings": {}}

def save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2, default=str)

@router.get("/")
async def get_portfolio():
    """
    Get current user portfolio with live price updates.
    """
    data = load_data()
    holdings = []
    
    # We need to fetch live prices to calculate current value
    # For speed, using yfinance directly here or market_data service
    import yfinance as yf
    
    total_invested = 0
    current_value = 0
    
    # Fetch live prices for all holdings in parallel
    if data["holdings"]:
        import yfinance as yf
        tickers = list(data["holdings"].keys())
        try:
            # Download 1-day data for all tickers to get latest 'Close' or 'Current'
            # interval='1m' allows getting very recent price during market hours
            # period='1d' is sufficient
            live_data = yf.download(tickers, period="5d", interval="1m", progress=False)['Close'].iloc[-1]
            
            # If single ticker, live_data is float, else Series
            is_single = len(tickers) == 1
        except Exception as e:
            logger.error(f"Live price fetch failed: {e}")
            live_data = None

    for ticker, item in data["holdings"].items():
        try:
            current_price = item["average_price"] # Default Fallback
            
            # Try to get live price
            if live_data is not None:
                try:
                    if is_single:
                        price = float(live_data)
                    else:
                        price = float(live_data[ticker])
                    
                    if price > 0:
                        current_price = price
                except:
                    pass # Keep fallback

            holdings.append({
                "ticker": ticker,
                "quantity": item["quantity"],
                "average_price": item["average_price"],
                "current_price": current_price,
                "invested_value": item["quantity"] * item["average_price"],
                "market_value": item["quantity"] * current_price
            })
            
        except Exception as e:
            logger.error(f"Error processing {ticker}: {e}")

    return {
        "cash": data["cash"],
        "holdings": holdings,
        "total_invested": sum(h["invested_value"] for h in holdings),
        "holdings_count": len(holdings)
    }

@router.post("/trade")
async def execute_trade(trade: TradeRequest):
    """
    Execute a Buy or Sell trade.
    """
    data = load_data()
    ticker = trade.ticker.upper()
    trading_value = trade.quantity * trade.price
    
    if trade.action == "BUY":
        if data["cash"] < trading_value:
            raise HTTPException(status_code=400, detail=f"Insufficient Funds. Required: ₹{trading_value}, Available: ₹{data['cash']}")
            
        # Execute Buy
        data["cash"] -= trading_value
        
        current = data["holdings"].get(ticker, {
            "ticker": ticker, 
            "quantity": 0, 
            "average_price": 0.0
        })
        
        # Weighted Average Price
        total_cost = (current["quantity"] * current["average_price"]) + trading_value
        new_qty = current["quantity"] + trade.quantity
        new_avg = total_cost / new_qty
        
        current["quantity"] = new_qty
        current["average_price"] = new_avg
        current["last_price"] = trade.price # Update last seen price
        current["last_updated"] = datetime.now().isoformat()
        
        data["holdings"][ticker] = current

    elif trade.action == "SELL":
        current = data["holdings"].get(ticker)
        if not current or current["quantity"] < trade.quantity:
            raise HTTPException(status_code=400, detail="Insufficient holdings")
            
        # Execute Sell
        data["cash"] += trading_value
        current["quantity"] -= trade.quantity
        current["last_price"] = trade.price
        
        if current["quantity"] == 0:
            del data["holdings"][ticker]
        else:
            data["holdings"][ticker] = current
            
    save_data(data)
    return {"status": "success", "new_cash": data["cash"], "portfolio": data["holdings"].get(ticker)}

@router.post("/reset")
async def reset_portfolio():
    """Debug: Reset portfolio to initial state"""
    data = {"cash": INITIAL_CASH, "holdings": {}}
    save_data(data)
    return data
