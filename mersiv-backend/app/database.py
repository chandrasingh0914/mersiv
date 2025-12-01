from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    
database = Database()

async def get_database():
    return database.client.mersiv

async def connect_to_mongo():
    database.client = AsyncIOMotorClient(settings.mongodb_uri)
    print("Connected to MongoDB")

async def close_mongo_connection():
    database.client.close()
    print("Closed MongoDB connection")

