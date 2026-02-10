from fastapi import APIRouter, HTTPException, Query
import yfinance as yf
import pandas as pd
import logging
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/v1/events", tags=["events"])
logger = logging.getLogger(__name__)

# List of popular Indian stocks for calendar
CALENDAR_STOCKS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS",
    "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "BAJFINANCE.NS",
    "ITC.NS", "WIPRO.NS", "ASIANPAINT.NS", "AXISBANK.NS", "LT.NS"
]

@router.get("/earnings")
async def get_earnings_calendar(
    days_ahead: int = Query(30, description="Number of days to look ahead")
):
    """
    Get upcoming earnings dates for stocks
   """
    try:
        earnings_events = []
        
        for ticker in CALENDAR_STOCKS:
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                
                # Get earnings date if available
                earnings_dates = info.get('earningsTimestamp')
                if earnings_dates:
                    earnings_date = datetime.fromtimestamp(earnings_dates)
                    
                    # Check if within the specified range
                    if datetime.now() <= earnings_date <= datetime.now() + timedelta(days=days_ahead):
                        earnings_events.append({
                            "ticker": ticker.replace('.NS', ''),
                            "company": info.get('longName', ticker),
                            "date": earnings_date.strftime('%Y-%m-%d'),
                            "time": earnings_date.strftime('%H:%M'),
                            "estimatedEPS": info.get('trailingEps'),
                            "sector": info.get('sector', 'Unknown')
                        })
                
            except Exception as e:
                logger.warning(f"Failed to fetch earnings for {ticker}: {e}")
                continue
        
        # Sort by date
        earnings_events.sort(key=lambda x: x['date'])
        
        return {
            "count": len(earnings_events),
            "events": earnings_events
        }
        
    except Exception as e:
        logger.error(f"Earnings calendar error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dividends")
async def get_dividend_calendar(
    days_ahead: int = Query(90, description="Number of days to look ahead")
):
    """
    Get upcoming dividend dates for stocks
    """
    try:
        dividend_events = []
        
        for ticker in CALENDAR_STOCKS:
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                
                # Get dividend info
                dividend_date = info.get('exDividendDate')
                dividend_rate = info.get('dividendRate')
                dividend_yield = info.get('dividendYield')
                
                if dividend_date and dividend_rate:
                    ex_date = datetime.fromtimestamp(dividend_date)
                    
                    # Check if within the specified range
                    if datetime.now() <= ex_date <= datetime.now() + timedelta(days=days_ahead):
                        dividend_events.append({
                            "ticker": ticker.replace('.NS', ''),
                            "company": info.get('longName', ticker),
                            "exDate": ex_date.strftime('%Y-%m-%d'),
                            "dividendAmount": dividend_rate,
                            "dividendYield": (dividend_yield * 100) if dividend_yield else 0,
                            "paymentDate": "TBA",
                            "sector": info.get('sector', 'Unknown')
                        })
                
            except Exception as e:
                logger.warning(f"Failed to fetch dividends for {ticker}: {e}")
                continue
        
        # Sort by ex-dividend date
        dividend_events.sort(key=lambda x: x['exDate'])
        
        return {
            "count": len(dividend_events),
            "events": dividend_events
        }
        
    except Exception as e:
        logger.error(f"Dividend calendar error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/splits")
async def get_stock_splits(
    days_back: int = Query(30, description="Number of days to look back"),
    days_ahead: int = Query(30, description="Number of days to look ahead")
):
    """
    Get recent and upcoming stock splits
    """
    try:
        split_events = []
        
        for ticker in CALENDAR_STOCKS:
            try:
                stock = yf.Ticker(ticker)
                
                # Get stock splits from history
                start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
                end_date = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
                
                splits = stock.splits
                if not splits.empty:
                    for date, ratio in splits.items():
                        if pd.Timestamp(start_date) <= date <= pd.Timestamp(end_date):
                            split_events.append({
                                "ticker": ticker.replace('.NS', ''),
                                "company": stock.info.get('longName', ticker),
                                "date": date.strftime('%Y-%m-%d'),
                                "ratio": f"{int(ratio)}:1" if ratio >= 1 else  f"1:{int(1/ratio)}",
                                "type": "Forward" if ratio >= 1 else "Reverse"
                            })
                
            except Exception as e:
                logger.warning(f"Failed to fetch splits for {ticker}: {e}")
                continue
        
        # Sort by date
        split_events.sort(key=lambda x: x['date'], reverse=True)
        
        return {
            "count": len(split_events),
            "events": split_events
        }
        
    except Exception as e:
        logger.error(f"Stock splits calendar error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
