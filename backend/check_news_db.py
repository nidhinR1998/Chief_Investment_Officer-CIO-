from cio_app.models.db import MongoDB
import asyncio
from cio_app.config import settings

async def check_images():
    await MongoDB.connect()
    
    count = await MongoDB.db.news.count_documents({})
    print(f"Total News Cached: {count}")
    
    missing_images = await MongoDB.db.news.count_documents({"image": None})
    print(f"Missing Images: {missing_images}")
    
    # Optional: Clear if most are missing images to force refresh
    if missing_images > 0:
        print("Clearing cache to force refresh...")
        await MongoDB.db.news.delete_many({})
        print("Cache cleared.")
        
    await MongoDB.close()

if __name__ == "__main__":
    asyncio.run(check_images())
