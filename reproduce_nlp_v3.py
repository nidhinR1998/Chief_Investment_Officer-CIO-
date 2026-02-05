
import sys
import logging
import os

# Ensure we are running from the root
print(f"CWD: {os.getcwd()}")
sys.path.append("backend")

from cio_app.services.nlp_engine import NLPService, logger

# Configure logger to print to stdout
logging.basicConfig(level=logging.DEBUG)

def test():
    print("MATCHING 'HAVE' IN STOP WORDS?")
    print(f"'HAVE' in STOP_WORDS: {'HAVE' in NLPService.STOP_WORDS}")
    
    q = "I have Buyed the KITEX 12 stoke at 211.40 yesterday. Should I hold it or sell it now?"
    print(f"\nQuery: {q}")
    
    result = NLPService.parse_query(q)
    print(f"Result: {result}")
    
    if result.get("ticker") == "KITEX.NS":
        print("SUCCESS: Logic is correct on disk.")
    else:
        print(f"FAILURE: Logic returned {result.get('ticker')}")

if __name__ == "__main__":
    test()
