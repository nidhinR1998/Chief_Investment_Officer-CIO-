from fastapi import APIRouter, HTTPException, Body, Depends
from cio_app.models.portfolio import TradeRequest
from cio_app.models.db import get_db
from cio_app.models.schema import PortfolioItemDB, TransactionDB, UserDB
from datetime import datetime
import logging
import asyncio

router = APIRouter(prefix="/api/v1/portfolio", tags=["portfolio"])
logger = logging.getLogger(__name__)

DEFAULT_USER_ID = "default_user"

async def get_user_balance(db, user_id=DEFAULT_USER_ID):
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        # Create default user if not exists
        new_user = UserDB(user_id=user_id, cash=1000000.0)
        await db.users.insert_one(new_user.dict(by_alias=True))
        return new_user.cash
    return user["cash"]

async def update_user_balance(db, amount_change, user_id=DEFAULT_USER_ID):
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {"cash": amount_change}}
    )

@router.get("/")
async def get_portfolio(db=Depends(get_db)):
    """Retrieve user's portfolio with current market values"""
    try:
        # Check if database is connected
        if db is None:
            logger.warning("Database not connected, returning empty portfolio")
            return {
                "cash": 10000.0,
                "holdings": [],
                "total_value": 10000.0,
                "total_gain_loss": 0.0,
                "gain_loss_pct": 0.0
            }
        
        # Get cash balance
        cash = await get_user_balance(db)
        
        # Fetch Holdings
        cursor = db.portfolios.find({"user_id": DEFAULT_USER_ID})
        portfolio_items = await cursor.to_list(100)
        
        holdings = []
        tickers = [item["ticker"] for item in portfolio_items]
        
        # Fetch Live Prices
        import yfinance as yf
        live_data = None
        if tickers:
            try:
                live_data = yf.download(tickers, period="5d", interval="1m", progress=False)['Close'].iloc[-1]
            except Exception as e:
                logger.error(f"Live price fetch failed: {e}")

        for item in portfolio_items:
            ticker = item["ticker"]
            avg_price = item["average_price"]
            qty = item["quantity"]
            current_price = avg_price # Fallback
            
            # Parse live price
            if live_data is not None:
                try:
                    if len(tickers) == 1:
                        price = float(live_data)
                    else:
                        price = float(live_data[ticker])
                    
                    if price > 0:
                        current_price = price
                except:
                    pass

            holdings.append({
                "ticker": ticker,
                "quantity": qty,
                "average_price": avg_price,
                "current_price": current_price,
                "invested_value": qty * avg_price,
                "market_value": qty * current_price
            })

        return {
            "cash": cash,
            "holdings": holdings,
            "total_invested": sum(h["invested_value"] for h in holdings),
            "holdings_count": len(holdings)
        }
    except Exception as e:
        logger.error(f"Error fetching portfolio: {e}")
        return {
            "cash": 10000.0,
            "holdings": [],
            "total_invested": 0.0,
            "holdings_count": 0
        }

@router.post("/trade")
async def execute_trade(trade: TradeRequest, db = Depends(get_db)):
    """
    Execute a Buy or Sell trade with DB Persistence.
    """
    ticker = trade.ticker.upper()
    trading_value = trade.quantity * trade.price
    current_cash = await get_user_balance(db)
    
    if trade.action == "BUY":
        if current_cash < trading_value:
            raise HTTPException(status_code=400, detail=f"Insufficient Funds. Required: ₹{trading_value}, Available: ₹{current_cash}")
            
        # 1. Update Cash
        await update_user_balance(db, -trading_value)
        
        # 2. Update/Upsert Portfolio
        existing = await db.portfolios.find_one({"user_id": DEFAULT_USER_ID, "ticker": ticker})
        
        if existing:
            # Weighted Avg Logic
            total_cost = (existing["quantity"] * existing["average_price"]) + trading_value
            new_qty = existing["quantity"] + trade.quantity
            new_avg = total_cost / new_qty
            
            await db.portfolios.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "quantity": new_qty, 
                    "average_price": new_avg,
                    "last_updated": datetime.now()
                }}
            )
        else:
            new_item = PortfolioItemDB(
                ticker=ticker,
                quantity=trade.quantity,
                average_price=trade.price
            )
            await db.portfolios.insert_one(new_item.dict(by_alias=True))
            
    elif trade.action == "SELL":
        existing = await db.portfolios.find_one({"user_id": DEFAULT_USER_ID, "ticker": ticker})
        if not existing or existing["quantity"] < trade.quantity:
            raise HTTPException(status_code=400, detail="Insufficient holdings")
            
        # 1. Update Cash
        await update_user_balance(db, trading_value)
        
        # 2. Update Portfolio
        new_qty = existing["quantity"] - trade.quantity
        if new_qty == 0:
            await db.portfolios.delete_one({"_id": existing["_id"]})
        else:
            await db.portfolios.update_one(
                {"_id": existing["_id"]},
                {"$set": {"quantity": new_qty, "last_updated": datetime.now()}}
            )

    # 3. Log Transaction
    transaction = TransactionDB(
        ticker=ticker,
        action=trade.action,
        quantity=trade.quantity,
        price=trade.price,
        total_amount=trading_value
    )
    await db.transactions.insert_one(transaction.dict(by_alias=True))
            
    return {"status": "success", "new_cash": await get_user_balance(db)}

@router.post("/reset")
async def reset_portfolio(db = Depends(get_db)):
    """Debug: Reset DB portfolio"""
    await db.users.delete_many({})
    await db.portfolios.delete_many({})
    await db.transactions.delete_many({})
    
    # Re-init user
    await get_user_balance(db)
    return {"status": "reset"}
