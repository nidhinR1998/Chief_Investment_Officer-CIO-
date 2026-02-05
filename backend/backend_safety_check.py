
import asyncio
import logging
from cio_app.services.decision_engine import decision_engine
from cio_app.services.market_data import market_data
from cio_app.services.nlp_service import nlp_service

logging.basicConfig(level=logging.INFO)

async def test_backend():
    print("1. Testing NLP Service...")
    q = "I have Buyed the KITEX 12 stoke at 211.40 yesterday"
    res = nlp_service.parse_query(q)
    print(f"NLP Result: {res}")
    if not res.get("valid") or res.get("ticker") != "KITEX.NS":
        print("NLP FAIL")
    
    print("\n2. Testing Market Data (Fundamentals)...")
    fund = await market_data.get_fundamentals("RELIANCE.NS")
    print(f"Fundamentals Keys: {len(fund.keys())}")
    
    print("\n3. Testing Decision Engine (Full Analysis)...")
    # This matches the Router Call
    analysis = await decision_engine.analyze_ticker("RELIANCE.NS", include_fundamentals=True)
    if "error" in analysis:
        print(f"Analysis ERROR: {analysis['error']}")
    else:
        print("Analysis SUCCESS")
        print(f"Price: {analysis.get('price')}")
        print(f"Fundamentals Present: {'fundamentals' in analysis}")

if __name__ == "__main__":
    asyncio.run(test_backend())
