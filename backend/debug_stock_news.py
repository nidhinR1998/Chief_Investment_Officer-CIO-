def test_stock_news():
    import yfinance as yf
    import json
    ticker = "TATASTEEL.NS"
    print(f"Fetching raw YF news for {ticker}...")
    stock = yf.Ticker(ticker)
    news = stock.news
    
    if news:
        print("Raw First Item:")
        print(json.dumps(news[0], indent=2, default=str))
    else:
        print("No news found via YF")
        
if __name__ == "__main__":
    test_stock_news()
