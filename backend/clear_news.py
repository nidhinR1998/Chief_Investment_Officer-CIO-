from cio_app.models.db import MongoDB
import asyncio

async def clear_news():
    await MongoDB.connect()
    
    logger = MongoDB.client.get_database("cio_trading_db")
    result = await MongoDB.db.news.delete_many({})
    print(f"Deleted {result.deleted_count} news items.")
    
    await MongoDB.close()

if __name__ == "__main__":
    asyncio.run(clear_news())
