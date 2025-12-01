from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ModelPosition(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0

class Model3D(BaseModel):
    id: str
    url: str
    position: ModelPosition
    size: float = 1.0

class StoreBase(BaseModel):
    name: str
    imageUrl: str
    domain: Optional[str] = None
    videoUrl: Optional[str] = None
    clickableLink: Optional[str] = None
    models: List[Model3D] = []

class StoreCreate(StoreBase):
    pass

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    imageUrl: Optional[str] = None
    domain: Optional[str] = None
    videoUrl: Optional[str] = None
    clickableLink: Optional[str] = None
    models: Optional[List[Model3D]] = None

class StoreResponse(StoreBase):
    id: str = Field(alias="_id")
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    
    class Config:
        populate_by_name = True

class StoreListItem(BaseModel):
    id: str = Field(alias="_id")
    name: str
    imageUrl: str
    domain: Optional[str] = None
    
    class Config:
        populate_by_name = True

class ModelPositionUpdate(BaseModel):
    modelId: str
    position: ModelPosition

class WidgetConfig(BaseModel):
    videoUrl: Optional[str]
    clickableLink: Optional[str]
    storeName: str
