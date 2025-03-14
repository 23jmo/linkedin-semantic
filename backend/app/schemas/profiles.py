from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class LinkedInProfileCraete(BaseModel):
    userId: str
    linkedInOAuthProfile: dict

class LinkedInProfileResponse(BaseModel):
    id: str
    user_id: str
    linkedin_id: str
    full_name: str
    headline: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    profile_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    summary: Optional[str] = None
    created_at: datetime
    