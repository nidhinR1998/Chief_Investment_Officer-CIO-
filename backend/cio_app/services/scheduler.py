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
    def remove_stock_job(cls, ticker: str):
        """
        Removes a monitoring job, BUT only if no active alerts exist for it.
        """
        job_id = f"monitor_{ticker}"
        
        # Check for active alerts before removing
        try:
            from cio_app.routers.alerts import load_alerts
            alerts = load_alerts()
            # Normalize ticker check
            normalized_ticker = ticker if ticker.endswith(".NS") or ticker.endswith(".BO") else f"{ticker}.NS"
            
            has_active_alert = any(
                a.active and not a.triggered and a.ticker == normalized_ticker 
                for a in alerts
            )
            
            if has_active_alert:
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

            # Check Alerts
            from cio_app.routers.alerts import load_alerts, save_alerts
            current_price = analysis.get("price")
            if current_price:
                alerts = load_alerts()
                alerts_updated = False
                for alert in alerts:
                    if not alert.active or alert.triggered: 
                        continue
                    
                    # Normalize for comparison
                    normalized_ticker = ticker
                    if not normalized_ticker.endswith(".NS"): normalized_ticker += ".NS"
                    
                    if alert.ticker == normalized_ticker:
                        triggered = False
                        if alert.condition == "ABOVE" and current_price >= alert.target_price:
                            triggered = True
                        elif alert.condition == "BELOW" and current_price <= alert.target_price:
                            triggered = True
                        
                        if triggered:
                            alert.triggered = True
                            alert.triggered_at = str(analysis.get("timestamp"))
                            alerts_updated = True
                            logger.info(f"ALERT TRIGGERED for {ticker}: Price {current_price} is {alert.condition} {alert.target_price}")
                            
                            # Send Alert Notification via WS
                            alert_msg = json.dumps({
                                "type": "ALERT_TRIGGERED",
                                "data": alert.dict()
                            }, default=str)
                            await manager.broadcast(alert_msg)
                
                if alerts_updated:
                    save_alerts(alerts)
            
        except Exception as e:
            logger.error(f"Error in monitor task for {ticker}: {e}")

scheduler = SchedulerService()
