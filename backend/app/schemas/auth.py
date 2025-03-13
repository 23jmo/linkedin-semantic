from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    linkedin_id: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    linkedin_id: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LinkedInAuthResponse(BaseModel):
    access_token: str
    expires_in: int

class LinkedInProfileResponse(BaseModel):
    id: str
    localizedFirstName: str
    localizedLastName: str

class LinkedInEmailResponse(BaseModel):
    elements: List[dict] 