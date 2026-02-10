from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
import json
import asyncio
from cio_app.services.websocket_manager import manager
from cio_app.services.decision_engine import decision_engine

logger = logging.getLogger(__name__)

class SchedulerService:
    scheduler = AsyncIOScheduler()

    @classmethod
    def start(cls):
        if not cls.scheduler.running:
            cls.scheduler.start()
            logger.info("Background Scheduler Started")

    @classmethod
    def stop(cls):
        cls.scheduler.shutdown()
        logger.info("Background Scheduler Stopped")

    @classmethod
    def add_job(cls, func, trigger, **kwargs):
        """
        Adds a generic job to the scheduler.
        """
        cls.scheduler.add_job(func, trigger, **kwargs)
        logger.info(f"Added background job: {kwargs.get('id', func.__name__)}")

    @classmethod
    def add_stock_job(cls, ticker: str, interval_seconds: int = 5):
        """
        Adds a monitoring job for a specific stock.
        """
        job_id = f"monitor_{ticker}"
        if cls.scheduler.get_job(job_id):
            # If job exists, update it to ensure it's running
            return

        # Note: Actual job function will need to be imported dynamically to avoid circular imports,
        # or we define a generic task execution method here.
        # For now, we will use a dummy print function.
        cls.scheduler.add_job(
            func=cls._monitor_task,
            trigger=IntervalTrigger(seconds=interval_seconds),
            id=job_id,
            args=[ticker],
            replace_existing=True
        )
        logger.info(f"Added monitoring job for {ticker} every {interval_seconds}s")
    @classmethod
    async def remove_stock_job(cls, ticker: str):
        """
        Removes a monitoring job, BUT only if no active alerts exist for it.
        """
        job_id = f"monitor_{ticker}"
        
        # Check for active alerts before removing
        try:
            from cio_app.models.db import MongoDB
            if MongoDB.db is None:
                logger.warning("DB not connected, forcing job removal")
            else:
                # Normalize ticker check
                normalized_ticker = ticker if ticker.endswith(".NS") or ticker.endswith(".BO") else f"{ticker}.NS"
                
                # Check if any active, untriggered alert exists for this ticker
                alert_exists = await MongoDB.db.alerts.find_one({
                    "ticker": normalized_ticker,
                    "active": True,
                    "triggered": False
                })
                
                if alert_exists:
                    logger.info(f"Skipping job removal for {ticker}: Active alerts exist.")
                    return
                
        except Exception as e:
            logger.error(f"Error checking alerts during job removal: {e}")

        if cls.scheduler.get_job(job_id):
            cls.scheduler.remove_job(job_id)
            logger.info(f"Removed monitoring job for {ticker}")

    @staticmethod
    async def _monitor_task(ticker: str):
        """
        Runs periodic analysis and broadcasts result to all connected clients.
        """
        try:
            from cio_app.models.db import MongoDB
            
            logger.info(f"Running monitor job for {ticker}")
            # Perform Analysis (Fast mode, no fundamentals)
            analysis = await decision_engine.analyze_ticker(ticker, include_fundamentals=False)
            
            if "error" in analysis:
                logger.error(f"Monitor failed for {ticker}: {analysis['error']}")
                return

            # Broadcast Update
            message = json.dumps({
                "type": "STOCK_UPDATE",
                "ticker": ticker,
                "data": analysis
            }, default=str) # Handle datetime serialization
            await manager.broadcast(message)

            # Check Alerts (Only if DB is connected)
            if MongoDB.db is not None:
                current_price = analysis.get("price")
                if current_price:
                    normalized_ticker = ticker
                    if not normalized_ticker.endswith(".NS"): normalized_ticker += ".NS"
                    
                    # Find active alerts for this ticker
                    async for alert in MongoDB.db.alerts.find({"ticker": normalized_ticker, "active": True, "triggered": False}):
                        triggered = False
                        if alert["condition"] == "ABOVE" and current_price >= alert["target_price"]:
                            triggered = True
                        elif alert["condition"] == "BELOW" and current_price <= alert["target_price"]:
                            triggered = True
                        
                        if triggered:
                            # Update DB
                            await MongoDB.db.alerts.update_one(
                                {"_id": alert["_id"]},
                                {"$set": {
                                    "triggered": True,
                                    "triggered_at": analysis.get("timestamp")
                                }}
                            )
                            
                            logger.info(f"ALERT TRIGGERED for {ticker}: Price {current_price} is {alert['condition']} {alert['target_price']}")
                            
                            # Send Alert Notification via WS
                            alert['triggered'] = True
                            alert['triggered_at'] = analysis.get("timestamp")
                            alert['_id'] = str(alert['_id']) # Serialize ObjectId
                            
                            alert_msg = json.dumps({
                                "type": "ALERT_TRIGGERED",
                                "data": alert
                            }, default=str)
                            await manager.broadcast(alert_msg)
            
        except Exception as e:
            logger.error(f"Error in monitor task for {ticker}: {e}")

scheduler = SchedulerService()
