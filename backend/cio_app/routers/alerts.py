from fastapi import APIRouter, HTTPException, Depends
from typing import List
from cio_app.models.db import get_db
from cio_app.models.schema import AlertDB, AlertCreate
from bson import ObjectId

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])

@router.get("/", response_model=List[AlertDB])
async def get_alerts(db = Depends(get_db)):
    alerts = await db.alerts.find().to_list(100)
    return alerts

@router.post("/", response_model=AlertDB)
async def create_alert(alert: AlertCreate, db = Depends(get_db)):
    # Normalize ticker
    ticker = alert.ticker
    if not ticker.endswith(".NS") and not ticker.endswith(".BO"):
        ticker = f"{ticker}.NS"
        
    new_alert = AlertDB(
        ticker=ticker, 
        target_price=alert.target_price, 
        condition=alert.condition,
        active=True
    )
    
    result = await db.alerts.insert_one(new_alert.dict(by_alias=True))
    created_alert = await db.alerts.find_one({"_id": result.inserted_id})
    return created_alert

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, db = Depends(get_db)):
    if not ObjectId.is_valid(alert_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    result = await db.alerts.delete_one({"_id": ObjectId(alert_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    return {"status": "deleted"}

# Helper for Scheduler (no Depends)
def load_alerts_sync():
    # This is tricky because motor is async. 
    # The scheduler runs in an async context, so we should allow it to await.
    # We will refactor scheduler to call a DB function instead of importing this.
    pass
