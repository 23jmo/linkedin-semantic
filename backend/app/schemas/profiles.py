from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProfileBase(BaseModel):
    linkedin_id: str
    name: str
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    profile_url: Optional[str] = None
    profile_image_url: Optional[str] = None

class ProfileCreate(ProfileBase):
    experiences: Optional[List[Dict[str, Any]]] = []
    educations: Optional[List[Dict[str, Any]]] = []
    skills: Optional[List[str]] = []
    certifications: Optional[List[Dict[str, Any]]] = []
    languages: Optional[List[Dict[str, Any]]] = []
    recommendations: Optional[List[Dict[str, Any]]] = []

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    profile_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    experiences: Optional[List[Dict[str, Any]]] = None
    educations: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    languages: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None

class ProfileResponse(ProfileBase):
    id: str
    user_id: str
    experiences: List[Dict[str, Any]] = []
    educations: List[Dict[str, Any]] = []
    skills: List[str] = []
    certifications: List[Dict[str, Any]] = []
    languages: List[Dict[str, Any]] = []
    recommendations: List[Dict[str, Any]] = []
    is_indexed: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True 