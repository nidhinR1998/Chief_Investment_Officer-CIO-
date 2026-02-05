from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CIO - Indian Stock Trading AI"
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "cio_trading_db"
    
    # AI / News API Keys (Future Proofing - Not required for default Scraper)
    # GOOGLE_NEWS_API_KEY: str = "" 
    HUGGINGFACE_API_KEY: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
