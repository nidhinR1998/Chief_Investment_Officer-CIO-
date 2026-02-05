import yfinance as yf
import pandas as pd
import asyncio
from datetime import datetime, time
import pytz
import logging

logger = logging.getLogger(__name__)

IST = pytz.timezone('Asia/Kolkata')

class MarketDataService:
    
    @staticmethod
    def is_market_open() -> bool:
        """
        Checks if Indian Stock Market (NSE) is currently open.
        Time: 09:15 to 15:30 IST.
        Days: Monday to Friday.
        """
        now = datetime.now(IST)
        # Check Weekend
        if now.weekday() >= 5: # 5=Sat, 6=Sun
            return False
            
        current_time = now.time()
        market_start = time(9, 15)
        market_end = time(15, 30)
        
        return market_start <= current_time <= market_end

    @staticmethod
    async def get_stock_data(ticker: str, period: str = "1d", interval: str = "1m") -> pd.DataFrame:
        """
        Fetches historical data for a ticker.
        """
        # Ensure we add .NS for NSE if not present (simple heuristic)
        if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
            ticker = f"{ticker}.NS"
            
        try:
            stock = yf.Ticker(ticker)
            # Run blocking I/O in thread
            df = await asyncio.to_thread(stock.history, period=period, interval=interval)
            
            if df.empty:
                logger.warning(f"No data found for {ticker}")
                return pd.DataFrame()
                
            return df
        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {e}")
            return pd.DataFrame()

    @staticmethod
    async def get_fundamentals(ticker: str) -> dict:
        """
        Fetches full company profile (slow, do not call in loops).
        """
        if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
            ticker = f"{ticker}.NS"
        try:
            stock = yf.Ticker(ticker)
            info = await asyncio.to_thread(lambda: stock.info)
            return info
        except Exception as e:
            logger.error(f"Error fetching fundamentals for {ticker}: {e}")
            return {}

    @staticmethod
    async def get_live_price(ticker: str) -> dict:
        """
        Get the latest price snapshot (optimized for speed).
        """
        if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
            ticker = f"{ticker}.NS"
            
        try:
            stock = yf.Ticker(ticker)
            # Fast fetch for monitoring
            df = await asyncio.to_thread(stock.history, period="1d", interval="1m")
            if not df.empty:
                latest = df.iloc[-1]
                return {
                    "symbol": ticker,
                    "price": float(latest["Close"]),
                    "open": float(latest["Open"]),
                    "high": float(latest["High"]),
                    "low": float(latest["Low"]),
                    "volume": int(latest["Volume"]),
                    "timestamp": latest.name.isoformat()
                }
            return None
        except Exception as e:
            logger.error(f"Error getting live price for {ticker}: {e}")
            return None

market_data = MarketDataService()
