from fastapi import APIRouter, HTTPException, Query
from typing import List
from bson import ObjectId
from datetime import datetime
from app.models import (
    StoreCreate, 
    StoreUpdate, 
    StoreResponse, 
    StoreListItem, 
    ModelPositionUpdate,
    WidgetConfig
)
from app.database import get_database

router = APIRouter(prefix="/api", tags=["stores"])

def serialize_store(store) -> dict:
    """Convert MongoDB document to dict with string ID"""
    if store:
        store["_id"] = str(store["_id"])
        return store
    return None

@router.get("/stores", response_model=List[StoreListItem])
async def get_all_stores():
    """Get all stores (basic info only)"""
    db = await get_database()
    stores = await db.stores.find({}, {
        "_id": 1, 
        "name": 1, 
        "imageUrl": 1, 
        "domain": 1
    }).to_list(100)
    
    return [serialize_store(store) for store in stores]

@router.get("/stores/{store_id}", response_model=StoreResponse)
async def get_store(store_id: str):
    """Get specific store by ID with all details"""
    db = await get_database()
    
    try:
        store = await db.stores.find_one({"_id": ObjectId(store_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid store ID format")
    
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return serialize_store(store)

@router.post("/stores", response_model=StoreResponse, status_code=201)
async def create_store(store: StoreCreate):
    """Create a new store"""
    db = await get_database()
    
    # Check if store name already exists
    existing = await db.stores.find_one({"name": store.name})
    if existing:
        raise HTTPException(status_code=400, detail="Store name already exists")
    
    store_dict = store.model_dump()
    store_dict["createdAt"] = datetime.utcnow()
    store_dict["updatedAt"] = datetime.utcnow()
    
    result = await db.stores.insert_one(store_dict)
    created_store = await db.stores.find_one({"_id": result.inserted_id})
    
    return serialize_store(created_store)

@router.patch("/stores/{store_id}", response_model=StoreResponse)
async def update_store_model_position(store_id: str, update_data: ModelPositionUpdate):
    """Update a specific model's position in a store"""
    db = await get_database()
    
    try:
        store = await db.stores.find_one({"_id": ObjectId(store_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid store ID format")
    
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Update the specific model's position
    models = store.get("models", [])
    model_found = False
    
    for model in models:
        if model["id"] == update_data.modelId:
            model["position"] = update_data.position.model_dump()
            model_found = True
            break
    
    if not model_found:
        raise HTTPException(status_code=404, detail="Model not found in store")
    
    # Update the store
    await db.stores.update_one(
        {"_id": ObjectId(store_id)},
        {
            "$set": {
                "models": models,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    updated_store = await db.stores.find_one({"_id": ObjectId(store_id)})
    return serialize_store(updated_store)

@router.put("/stores/{store_id}", response_model=StoreResponse)
async def update_store(store_id: str, store_update: StoreUpdate):
    """Update entire store"""
    db = await get_database()
    
    try:
        store = await db.stores.find_one({"_id": ObjectId(store_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid store ID format")
    
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    update_dict = {k: v for k, v in store_update.model_dump().items() if v is not None}
    update_dict["updatedAt"] = datetime.utcnow()
    
    await db.stores.update_one(
        {"_id": ObjectId(store_id)},
        {"$set": update_dict}
    )
    
    updated_store = await db.stores.find_one({"_id": ObjectId(store_id)})
    return serialize_store(updated_store)

@router.delete("/stores/{store_id}")
async def delete_store(store_id: str):
    """Delete a store"""
    db = await get_database()
    
    try:
        result = await db.stores.delete_one({"_id": ObjectId(store_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid store ID format")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {"message": "Store deleted successfully"}

@router.get("/widget/config", response_model=WidgetConfig)
async def get_widget_config(domain: str = Query(..., description="Domain to lookup widget configuration")):
    """Get widget configuration by domain"""
    db = await get_database()
    
    store = await db.stores.find_one(
        {"domain": domain},
        {"videoUrl": 1, "clickableLink": 1, "name": 1}
    )
    
    if not store:
        raise HTTPException(status_code=404, detail="Store not found for this domain")
    
    return {
        "videoUrl": store.get("videoUrl"),
        "clickableLink": store.get("clickableLink"),
        "storeName": store.get("name")
    }
