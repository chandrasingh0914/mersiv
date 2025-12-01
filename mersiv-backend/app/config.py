from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002"
    secret_key: str = "your-secret-key"
    port: int = 8000
    max_users_per_store: int = 2  # Maximum concurrent users per store
    allow_all_origins: bool = True  # Set to False in production
    
    class Config:
        env_file = ".env"

settings = Settings()
