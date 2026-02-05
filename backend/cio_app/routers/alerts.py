from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json
import os
import logging

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])
logger = logging.getLogger(__name__)

class Alert(BaseModel):
    id: int
    ticker: str
    target_price: float
    condition: str # ABOVE, BELOW
    active: bool = True
    triggered: bool = False
    triggered_at: str = None

DATA_FILE = "backend/data/alerts.json"

def load_alerts():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            return [Alert(**item) for item in data]
    except Exception as e:
        logger.error(f"Failed to load alerts: {str(e)}")
        return []

def save_alerts(alerts: List[Alert]):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump([a.dict() for a in alerts], f, indent=2, default=str)

@router.get("/", response_model=List[Alert])
async def get_alerts():
    return load_alerts()

@router.post("/")
async def create_alert(alert: Alert):
    alerts = load_alerts()
    # Generate ID
    new_id = 1
    if alerts:
        new_id = max(a.id for a in alerts) + 1
    
    alert.id = new_id
    # Normalize ticker
    if not alert.ticker.endswith(".NS") and not alert.ticker.endswith(".BO"):
        alert.ticker = f"{alert.ticker}.NS"
        
    alerts.append(alert)
    save_alerts(alerts)
    return alert

@router.delete("/{alert_id}")
async def delete_alert(alert_id: int):
    alerts = load_alerts()
    alerts = [a for a in alerts if a.id != alert_id]
    save_alerts(alerts)
    return {"status": "deleted"}
