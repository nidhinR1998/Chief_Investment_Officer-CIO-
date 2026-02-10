from fastapi import APIRouter, HTTPException, Query
import yfinance as yf
import pandas as pd
import logging
from typing import Optional

router = APIRouter(prefix="/api/v1/technical", tags=["technical"])
logger = logging.getLogger(__name__)

@router.get("/{ticker}/history")
async def get_price_history(
    ticker: str,
    period: str = Query("1mo", description="Valid periods: 1d,5d,1mo,3mo,6mo,1y,2y,5y,10y,ytd,max")
):
    """
    Get historical price data for charting
    """
    try:
        # Add .NS for Indian stocks if not present
        symbol = ticker if '.NS' in ticker else f"{ticker}.NS"
        
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {ticker}")
        
        # Convert to list of dictionaries
        data = []
        for index, row in hist.iterrows():
            data.append({
                "date": index.strftime('%Y-%m-%d'),
                "open": round(row['Open'], 2),
                "high": round(row['High'], 2),
                "low": round(row['Low'], 2),
                "close": round(row['Close'], 2),
                "volume": int(row['Volume'])
            })
        
        return {
            "ticker": ticker,
            "period": period,
            "data": data
        }
        
    except Exception as e:
        logger.error(f"Technical history error for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/indicators")
async def get_technical_indicators(
    ticker: str,
    period: str = Query("1mo", description="Data period")
):
    """
    Calculate technical indicators (RSI, MACD, Bollinger Bands)
    """
    try:
        symbol = ticker if '.NS' in ticker else f"{ticker}.NS"
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)
        
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {ticker}")
        
        # Calculate RSI (14-period)
        delta = hist['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        # Calculate MACD
        exp1 = hist['Close'].ewm(span=12, adjust=False).mean()
        exp2 = hist['Close'].ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        
        # Calculate Bollinger Bands
        sma = hist['Close'].rolling(window=20).mean()
        std = hist['Close'].rolling(window=20).std()
        upper_band = sma + (std * 2)
        lower_band = sma - (std * 2)
        
        # Get latest values
        latest_rsi = rsi.iloc[-1] if not rsi.empty else None
        latest_macd = macd.iloc[-1] if not macd.empty else None
        latest_signal = signal.iloc[-1] if not signal.empty else None
        latest_upper = upper_band.iloc[-1] if not upper_band.empty else None
        latest_lower = lower_band.iloc[-1] if not lower_band.empty else None
        latest_sma = sma.iloc[-1] if not sma.empty else None
        
        return {
            "ticker": ticker,
            "rsi": round(latest_rsi, 2) if latest_rsi else None,
            "macd": {
                "value": round(latest_macd, 2) if latest_macd else None,
                "signal": round(latest_signal, 2) if latest_signal else None,
                "histogram": round(latest_macd - latest_signal, 2) if latest_macd and latest_signal else None
            },
            "bollingerBands": {
                "upper": round(latest_upper, 2) if latest_upper else None,
                "middle": round(latest_sma, 2) if latest_sma else None,
                "lower": round(latest_lower, 2) if latest_lower else None
            }
        }
        
    except Exception as e:
        logger.error(f"Technical indicators error for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
