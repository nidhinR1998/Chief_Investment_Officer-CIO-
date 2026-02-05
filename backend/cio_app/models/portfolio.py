from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PortfolioItem(BaseModel):
    ticker: str
    quantity: int
    average_price: float
    current_price: Optional[float] = 0.0
    last_updated: datetime = Field(default_factory=datetime.now)

class TradeRequest(BaseModel):
    ticker: str
    action: str # BUY or SELL
    quantity: int
    price: float
