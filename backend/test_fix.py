import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from cio_app.services.market_data import market_data

async def test():
    print("Testing get_financials_deep...")
    data = await market_data.get_financials_deep("RELIANCE.NS")
    
    if not data:
        print("No data returned!")
        return

    income = data.get("income_stmt", {})
    if not income:
        print("No income statement data!")
        return
        
    # Check keys of the first metric
    first_metric = list(income.keys())[0]
    years = list(income[first_metric].keys())
    
    print(f"First metric: {first_metric}")
    print(f"Years (keys): {years}")
    print(f"Type of first key: {type(years[0])}")
    
    # Validation
    if isinstance(years[0], str) and len(years[0]) == 10:
        print("SUCCESS: Keys are 10-char strings (YYYY-MM-DD)")
    else:
        print(f"FAILURE: Keys are {type(years[0])} - {years[0]}")

if __name__ == "__main__":
    asyncio.run(test())
