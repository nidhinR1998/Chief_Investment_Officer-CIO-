from motor.motor_asyncio import AsyncIOMotorClient
from cio_app.config import settings
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        try:
            cls.client = AsyncIOMotorClient(settings.MONGO_URL)
            cls.db = cls.client[settings.DB_NAME]
            logger.info(f"Connected to MongoDB at {settings.MONGO_URL}, DB: {settings.DB_NAME}")
        except Exception as e:
            logger.error(f"Could not connect to MongoDB: {e}")
            raise e

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
            logger.info("MongoDB Connection Closed")

# Dependency
async def get_db():
    return MongoDB.db
