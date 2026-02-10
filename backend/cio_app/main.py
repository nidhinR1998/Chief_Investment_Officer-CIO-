from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# Update Trigger: v5 (Module Rename)
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CIO-Backend")

from cio_app.services.scheduler import scheduler
from cio_app.services.news_service import NewsService
from cio_app.models.db import MongoDB

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic: Connect DB, Initialize Scheduler
    logger.info("CIO Backend Starting up...")
    await MongoDB.connect()
    
    # Schedule News Sync (Every 1 minute)
    scheduler.add_job(NewsService.fetch_and_store_news, 'interval', minutes=1, id='news_sync')
    scheduler.start()
    
    # Run once immediately on startup (in background)
    import asyncio
    asyncio.create_task(NewsService.fetch_and_store_news())
    
    yield
    # Shutdown logic
    logger.info("CIO Backend Shutting down...")
    scheduler.stop()
    await MongoDB.close()

app = FastAPI(
    title="CIO - Indian Stock Trading AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",  # React Frontend (Vite default)
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from cio_app.services.websocket_manager import manager

@app.get("/")
async def root():
    return {"message": "CIO Trading AI Backend is Running", "status": "active"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open/listen for pong
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Include Routers
from cio_app.routers import stocks, portfolio, news, alerts, market_data, screener, events, technical
app.include_router(stocks.router)
app.include_router(portfolio.router)
app.include_router(news.router)
app.include_router(alerts.router)
app.include_router(market_data.router)
app.include_router(screener.router)
app.include_router(events.router)
app.include_router(technical.router)
