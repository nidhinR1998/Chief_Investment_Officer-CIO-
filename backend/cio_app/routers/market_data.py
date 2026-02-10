"""
Market Data Router - Handles currencies, futures, options, and commodities data
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
import yfinance as yf
from datetime import datetime

router = APIRouter(prefix="/api/v1/market", tags=["market"])

# Market data symbol mappings
CURRENCY_PAIRS = {
    'USD/INR': 'INR=X',
    'EUR/INR': 'EURINR=X',
    'GBP/INR': 'GBPINR=X',
    'JPY/INR': 'JPYINR=X',
    'AUD/INR': 'AUDINR=X',
    'CAD/INR': 'CADINR=X',
    'CHF/INR': 'CHFINR=X',
    'CNY/INR': 'CNYINR=X',
}

FUTURES_SYMBOLS = {
    'NIFTY FUT': '^NSEI',
    'BANKNIFTY FUT': '^NSEBANK',
    'RELIANCE FUT': 'RELIANCE.NS',
    'TCS FUT': 'TCS.NS',
    'INFY FUT': 'INFY.NS',
    'HDFC FUT': 'HDFCBANK.NS',
    'CRUDE OIL': 'CL=F',
    'GOLD': 'GC=F',
}

COMMODITIES_SYMBOLS = {
    'GOLD': 'GC=F',
    'SILVER': 'SI=F',
    'CRUDE OIL': 'CL=F',
    'NATURAL GAS': 'NG=F',
    'COPPER': 'HG=F',
    'PLATINUM': 'PL=F',
    'PALLADIUM': 'PA=F',
    'WHEAT': 'ZW=F',
}


def get_ticker_data(symbol: str) -> Dict[str, Any]:
    """Fetch ticker data from Yahoo Finance"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period='1d')
        
        if hist.empty:
            return None
            
        # Convert numpy types to Python native types for JSON serialization
        current_price = float(hist['Close'].iloc[-1])
        previous_close = float(info.get('previousClose', current_price))
        
        change = current_price - previous_close
        pct_change = (change / previous_close * 100) if previous_close != 0 else 0
        
        # Ensure volume is a regular Python int
        volume = info.get('volume', 0)
        if volume is not None:
            volume = int(volume) if volume else 0
        else:
            volume = 0
        
        return {
            'price': round(float(current_price), 2),
            'change': round(float(change), 2),
            'pct_change': round(float(pct_change), 2),
            'volume': volume,
            'name': str(info.get('longName', info.get('shortName', symbol))),
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None


@router.get("/currencies")
async def get_currencies():
    """Get live forex data"""
    result = []
    
    try:
        for display_name, symbol in CURRENCY_PAIRS.items():
            try:
                data = get_ticker_data(symbol)
                if data:
                    result.append({
                        'symbol': display_name,
                        'name': f'{display_name.split("/")[0]} to Indian Rupee',
                        'price': f'₹{data["price"]:.2f}',
                        'change': f'+{data["change"]:.2f}' if data['change'] >= 0 else f'{data["change"]:.2f}',
                        'pct': f'+{data["pct_change"]:.2f}%' if data['pct_change'] >= 0 else f'{data["pct_change"]:.2f}%',
                        'isUp': data['change'] >= 0,
                        'volume': f'{data["volume"]:,}' if data['volume'] else 'N/A',
                    })
                else:
                    print(f"No data returned for {symbol}")
            except Exception as e:
                print(f"Error processing {display_name} ({symbol}): {e}")
                continue
        
        # If no data was fetched, return mock data
        if len(result) == 0:
            print("WARNING: yfinance returned no currency data, using mock data")
            result = [
                {'symbol': 'USD/INR', 'name': 'US Dollar to Indian Rupee', 'price': '₹83.12', 'change': '+0.15', 'pct': '+0.18%', 'isUp': True, 'volume': 'N/A'},
                {'symbol': 'EUR/INR', 'name': 'Euro to Indian Rupee', 'price': '₹90.45', 'change': '+0.22', 'pct': '+0.24%', 'isUp': True, 'volume': 'N/A'},
                {'symbol': 'GBP/INR', 'name': 'British Pound to Indian Rupee', 'price': '₹105.67', 'change': '-0.18', 'pct': '-0.17%', 'isUp': False, 'volume': 'N/A'},
                {'symbol': 'JPY/INR', 'name': 'Japanese Yen to Indian Rupee', 'price': '₹0.56', 'change': '+0.01', 'pct': '+1.82%', 'isUp': True, 'volume': 'N/A'},
            ]
        
        return {'data': result, 'lastUpdated': datetime.now().isoformat()}
    except Exception as e:
        print(f"Critical error in get_currencies: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching currency data: {str(e)}")


@router.get("/futures")
async def get_futures():
    """Get futures data"""
    result = []
    
    for display_name, symbol in FUTURES_SYMBOLS.items():
        data = get_ticker_data(symbol)
        if data:
            # Format price based on symbol
            if 'INR' in display_name or any(x in display_name for x in ['NIFTY', 'BANK', 'RELIANCE', 'TCS', 'INFY', 'HDFC']):
                price_str = f'₹{data["price"]:,.2f}'
            else:
                price_str = f'${data["price"]:,.2f}'
            
            result.append({
                'symbol': display_name,
                'name': data['name'],
                'price': price_str,
                'change': f'+{data["change"]:.2f}' if data['change'] >= 0 else f'{data["change"]:.2f}',
                'pct': f'+{data["pct_change"]:.2f}%' if data['pct_change'] >= 0 else f'{data["pct_change"]:.2f}%',
                'isUp': data['change'] >= 0,
                'volume': f'{data["volume"]:,}' if data['volume'] else 'N/A',
                'expiry': 'Mar 28, 2024',  # Mock expiry - would need options API for real data
            })
    
    return {'data': result, 'lastUpdated': datetime.now().isoformat()}


@router.get("/options")
async def get_options():
    """Get options chain data for popular strikes"""
    # Note: Real options data requires the options API from yfinance
    # This is a simplified version with current underlying prices
    result = []
    
    try:
        # Get NIFTY options data
        nifty = yf.Ticker('^NSEI')
        nifty_price = nifty.history(period='1d')['Close'].iloc[-1]
        
        # Generate mock options around current price
        strikes = [24000, 24200, 24400, 24500]
        
        for strike in strikes:
            # Call option
            result.append({
                'symbol': f'NIFTY {strike} CE',
                'name': f'Nifty {strike} Call',
                'price': f'{max(5, nifty_price - strike):.2f}',
                'change': '+15.20',
                'pct': '+12.5%',
                'isUp': True,
                'volume': '5.2M',
                'oi': '8.5M',
                'expiry': 'Feb 8, 2024',
            })
            
            # Put option
            result.append({
                'symbol': f'NIFTY {strike} PE',
                'name': f'Nifty {strike} Put',
                'price': f'{max(5, strike - nifty_price):.2f}',
                'change': '-8.50',
                'pct': '-5.2%',
                'isUp': False,
                'volume': '4.1M',
                'oi': '6.8M',
                'expiry': 'Feb 8, 2024',
            })
        
        return {'data': result, 'lastUpdated': datetime.now().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching options data: {str(e)}")


@router.get("/commodities")
async def get_commodities():
    """Get commodities spot prices"""
    result = []
    
    for display_name, symbol in COMMODITIES_SYMBOLS.items():
        data = get_ticker_data(symbol)
        if data:
            # Format price based on commodity
            price_str = f'${data["price"]:,.2f}'
            
            # Determine unit
            units = {
                'GOLD': 'per Troy Oz',
                'SILVER': 'per Troy Oz',
                'CRUDE OIL': 'per Barrel',
                'NATURAL GAS': 'per MMBtu',
                'COPPER': 'per Pound',
                'PLATINUM': 'per Troy Oz',
                'PALLADIUM': 'per Troy Oz',
                'WHEAT': 'per Bushel',
            }
            
            result.append({
                'symbol': display_name,
                'name': data['name'],
                'price': price_str,
                'change': f'+{data["change"]:.2f}' if data['change'] >= 0 else f'{data["change"]:.2f}',
                'pct': f'+{data["pct_change"]:.2f}%' if data['pct_change'] >= 0 else f'{data["pct_change"]:.2f}%',
                'isUp': data['change'] >= 0,
                'volume': f'{data["volume"]:,}' if data['volume'] else 'N/A',
                'unit': units.get(display_name, 'per unit'),
            })
    
    return {'data': result, 'lastUpdated': datetime.now().isoformat()}


@router.get("/summary")
async def get_market_summary():
    """Get overall market summary with major indices"""
    indices = {
        '^NSEI': 'NIFTY 50',
        '^BSESN': 'SENSEX',
        '^NSEBANK': 'BANK NIFTY',
        '^GSPC': 'S&P 500',
        '^DJI': 'Dow Jones',
        '^IXIC': 'NASDAQ',
    }
    
    result = []
    for symbol, name in indices.items():
        data = get_ticker_data(symbol)
        if data:
            result.append({
                'symbol': symbol,
                'name': name,
                'price': f'{data["price"]:,.2f}',
                'change': f'+{data["change"]:.2f}' if data['change'] >= 0 else f'{data["change"]:.2f}',
                'pct': f'+{data["pct_change"]:.2f}%' if data['pct_change'] >= 0 else f'{data["pct_change"]:.2f}%',
                'isUp': data['change'] >= 0,
            })
    
    return {'data': result, 'lastUpdated': datetime.now().isoformat()}


@router.get("/trending")
async def get_trending_stocks():
    """
    Get trending stocks (Curated list for Home Page performance).
    Real implementation would query a DB or use a screener.
    """
    # Curated list of heavy weights for "Trending"
    trending_tickers = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", 
        "TATAMOTORS.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS"
    ]
    
    result = []
    for ticker in trending_tickers:
        data = get_ticker_data(ticker)
        if data:
            result.append({
                'symbol': ticker.replace('.NS', ''),
                'name': data['name'],
                'price': f'₹{data["price"]:,.2f}',
                'change': f'+{data["change"]:.2f}' if data['change'] >= 0 else f'{data["change"]:.2f}',
                'pct': f'+{data["pct_change"]:.2f}%' if data['pct_change'] >= 0 else f'{data["pct_change"]:.2f}%',
                'isUp': data['change'] >= 0,
            })
            
    return {'data': result, 'lastUpdated': datetime.now().isoformat()}
