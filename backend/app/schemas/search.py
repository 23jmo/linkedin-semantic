from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 10
    offset: Optional[int] = 0

class SearchResult(BaseModel):
    id: str
    linkedin_id: str
    name: str
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    profile_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    score: float
    highlights: Optional[List[str]] = []
    
    class Config:
        from_attributes = True 