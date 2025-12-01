from fastapi import APIRouter, HTTPException, Query
from app.database import get_database

router = APIRouter(prefix="/api/widget", tags=["widget"])

@router.get("/config")
async def get_widget_config(domain: str = Query(..., description="Domain of the website where widget is embedded")):
    """
    Get widget configuration (videoUrl and clickableLink) based on domain.
    The domain is matched against stores in the database.
    """
    try:
        db = await get_database()
        
        # Find store by domain
        store = await db.stores.find_one({"domain": domain})
        
        if not store:
            # Fallback: return first store if no domain match
            store = await db.stores.find_one()
            
        if not store:
            raise HTTPException(status_code=404, detail=f"No store configuration found for domain: {domain}")
        
        # Return widget configuration
        return {
            "domain": store.get("domain", domain),
            "videoUrl": store.get("videoUrl", ""),
            "clickableLink": store.get("clickableLink", ""),
            "storeName": store.get("name", ""),
            "storeId": str(store.get("_id", ""))
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching widget config: {str(e)}")
