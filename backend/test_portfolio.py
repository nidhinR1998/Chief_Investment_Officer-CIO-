import requests
import json

BASE_URL = "http://localhost:8000/api/v1/portfolio"

def test_portfolio():
    # 1. Reset
    print("Resetting Portfolio...")
    requests.post(f"{BASE_URL}/reset")
    
    # 2. Get Initial State
    res = requests.get(BASE_URL).json()
    print(f"Initial Cash: {res['cash']}")
    
    # 3. Buy Stock
    print("Buying 10 TATASTEEL @ 150...")
    res = requests.post(f"{BASE_URL}/trade", json={
        "ticker": "TATASTEEL.NS",
        "action": "BUY",
        "quantity": 10,
        "price": 150.0
    })
    if res.status_code == 200:
        print("Trade Success:", res.json())
    else:
        print("Trade Failed:", res.text)
        
    # 4. Verify Persistence
    res = requests.get(BASE_URL).json()
    print(f"New Cash: {res['cash']}")
    print(f"Holdings: {json.dumps(res['holdings'], indent=2)}")

if __name__ == "__main__":
    test_portfolio()
