from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

import uuid
class Profile(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    linkedin_id: Optional[str] = None
    full_name: str
    headline: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    profile_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    summary: Optional[str] = None
    raw_profile_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class ProfileExistsRequest(BaseModel):
    user_id: str
    linkedin_auth: dict

class ProfileExistsResponse(BaseModel):
    user_exists: bool
    linkedin_profile: Optional[Profile] = None

class ProfileCreateRequest(BaseModel):
    user_id: str
    linkedin_auth: dict

class ProfileCreateResponse(BaseModel):
    userId: str
    linkedin_profile: Profile