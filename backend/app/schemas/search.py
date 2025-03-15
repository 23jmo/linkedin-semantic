from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.profiles import Profile

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 10
    offset: Optional[int] = 0

class SearchResult(BaseModel):
    profile: Profile
    score: float
    highlights: Optional[List[str]] = []
    
    class Config:
        from_attributes = True 