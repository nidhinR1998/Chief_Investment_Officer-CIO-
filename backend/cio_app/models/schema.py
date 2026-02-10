from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x)),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)

class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# --- ALERT MODEL ---
class AlertDB(MongoBaseModel):
    user_id: str = "default_user"  # Future proofing
    ticker: str
    target_price: float
    condition: str  # ABOVE, BELOW
    active: bool = True
    triggered: bool = False
    triggered_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)

# --- USER MODEL (For Cash Balance) ---
class UserDB(MongoBaseModel):
    user_id: str = "default_user"
    cash: float = 1000000.0
    created_at: datetime = Field(default_factory=datetime.now)

# --- PORTFOLIO MODEL ---
class PortfolioItemDB(MongoBaseModel):
    user_id: str = "default_user"
    ticker: str
    quantity: int
    average_price: float
    sector: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.now)

# --- TRANSACTION MODEL (AUDIT TRAIL) ---
class TransactionDB(MongoBaseModel):
    user_id: str = "default_user"
    ticker: str
    action: str  # BUY, SELL
    quantity: int
    price: float
    total_amount: float
    timestamp: datetime = Field(default_factory=datetime.now)

# --- API Request/Response Models ---
class TradeRequest(BaseModel):
    ticker: str
    action: str
    quantity: int
    price: float

class AlertCreate(BaseModel):
    ticker: str
    target_price: float
    condition: str
