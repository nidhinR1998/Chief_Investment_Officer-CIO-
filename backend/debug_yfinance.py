import yfinance as yf
import json

def test_ticker(ticker):
    print(f"Testing {ticker}...")
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        print("Keys found:", list(info.keys())[:10])
        print("Market Cap:", info.get("marketCap"))
        print("PE:", info.get("trailingPE"))
        print("Sector:", info.get("sector"))
        print("Website:", info.get("website"))
        
        # Check specific fundamentals used in UI
        required_keys = [
            'marketCap', 'enterpriseValue', 'trailingPE', 'forwardPE', 'pegRatio', 'priceToBook',
            'profitMargins', 'operatingMargins', 'returnOnAssets', 'returnOnEquity',
            'debtToEquity', 'currentRatio', 'dividendYield', 'dividendRate', 'payoutRatio',
            'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'beta',
            'targetMeanPrice', 'targetLowPrice', 'targetHighPrice', 'recommendationKey'
        ]
        
        missing = [k for k in required_keys if k not in info]
        if missing:
            print(f"MISSING KEYS: {missing}")
        else:
            print("All keys present!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ticker("RELIANCE.NS")
    test_ticker("TCS.NS")
