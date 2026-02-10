from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import yfinance as yf
import logging

router = APIRouter(prefix="/api/v1/screener", tags=["screener"])
logger = logging.getLogger(__name__)

# Popular Indian stocks list for screening
INDIAN_STOCKS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS",
    "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "BAJFINANCE.NS",
    "ITC.NS", "WIPRO.NS", "ASIANPAINT.NS", "AXISBANK.NS", "LT.NS",
    "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS", "ULTRACEMCO.NS", "NESTLEIND.NS",
    "TECHM.NS", "HCLTECH.NS", "POWERGRID.NS", "NTPC.NS", "ONGC.NS",
    "M&M.NS", "TATAMOTORS.NS", "TATASTEEL.NS", "BAJAJFINSV.NS", "ADANIGREEN.NS"
]

@router.get("/stocks")
async def screen_stocks(
    min_market_cap: Optional[float] = Query(None, description="Minimum market cap in billions"),
    max_market_cap: Optional[float] = Query(None, description="Maximum market cap in billions"),
    min_pe: Optional[float] = Query(None, description="Minimum P/E ratio"),
    max_pe: Optional[float] = Query(None, description="Maximum P/E ratio"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    sector: Optional[str] = Query(None, description="Sector filter"),
):
    """
    Screen stocks based on various criteria using Yahoo Finance data
    """
    try:
        results = []
        
        for ticker in INDIAN_STOCKS:
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                
                # Extract key metrics
                market_cap = info.get('marketCap', 0) / 1_000_000_000  # Convert to billions
                pe_ratio = info.get('trailingPE', 0)
                price = info.get('currentPrice') or info.get('regularMarketPrice', 0)
                stock_sector = info.get('sector', 'Unknown')
                
                # Apply filters
                if min_market_cap and market_cap < min_market_cap:
                    continue
                if max_market_cap and market_cap > max_market_cap:
                    continue
                if min_pe and pe_ratio < min_pe:
                    continue
                if max_pe and pe_ratio > max_pe:
                    continue
                if min_price and price < min_price:
                    continue
                if max_price and price > max_price:
                    continue
                if sector and stock_sector.lower() != sector.lower():
                    continue
                
                # Add to results
                results.append({
                    "ticker": ticker.replace('.NS', ''),
                    "name": info.get('longName', ticker),
                    "price": price,
                    "marketCap": market_cap,
                    "peRatio": pe_ratio,
                    "sector": stock_sector,
                    "change": info.get('regularMarketChange', 0),
                    "changePct": info.get('regularMarketChangePercent', 0),
                    "volume": info.get('volume', 0),
                    "avgVolume": info.get('averageVolume', 0)
                })
                
            except Exception as e:
                logger.warning(f"Failed to fetch data for {ticker}: {e}")
                continue
        
        # Sort by market cap descending
        results.sort(key=lambda x: x['marketCap'], reverse=True)
        
        return {
            "count": len(results),
            "stocks": results
        }
        
    except Exception as e:
        logger.error(f"Screener error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sectors")
async def get_sectors():
    """Get list of available sectors"""
    sectors = set()
    
    for ticker in INDIAN_STOCKS[:10]:  # Sample from first 10 to get sectors quickly
        try:
            stock = yf.Ticker(ticker)
            sector = stock.info.get('sector')
            if sector:
                sectors.add(sector)
        except:
            continue
    
    return {"sectors": sorted(list(sectors))}
