
import sys
import logging
# Add backend to path to allow imports
sys.path.append("backend")

from cio_app.services.nlp_service import NLPService

# Setup logging to see debug output
logging.basicConfig(level=logging.DEBUG)

def test():
    print("Testing NLP Service Logic from File...")
    q = "I have Buyed the KITEX 12 stoke at 211.40 yesterday. Should I hold it or sell it now?"
    print(f"Query: {q}")
    
    result = NLPService.parse_query(q)
    print(f"Result: {result}")
    
    if result.get("ticker") == "KITEX.NS":
        print("SUCCESS: Logic is correct on disk.")
    else:
        print(f"FAILURE: Logic returned {result.get('ticker')}")

if __name__ == "__main__":
    test()
