from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes.stores import router as stores_router
from app.routes.widget import router as widget_router
from app.socket_manager import sio

# Create FastAPI app
app = FastAPI(
    title="mersiv Backend API",
    description="FastAPI backend for Mersiv 3D Store Viewer",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.allow_all_origins else settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stores_router)
app.include_router(widget_router)

# Database connection events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "mersiv Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Create Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, app)

