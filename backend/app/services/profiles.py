from typing import List, Optional
from datetime import datetime
import uuid

from app.schemas.profiles import ProfileCreate, ProfileUpdate, ProfileResponse
from app.schemas.auth import UserResponse
# Remove the circular import
# from app.services.search import index_profile

# Placeholder for database operations
# This would be implemented with actual database queries
profiles_db = {}

def create_profile(profile: ProfileCreate, current_user: UserResponse) -> ProfileResponse:
    """Create a new LinkedIn profile"""
    profile_id = str(uuid.uuid4())
    
    profile_data = profile.dict()
    profile_data.update({
        "id": profile_id,
        "user_id": current_user.id,
        "is_indexed": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    })
    
    profiles_db[profile_id] = profile_data
    
    # Import here to avoid circular import
    from app.services.search import index_profile
    # Index the profile (generate and store embedding)
    index_profile(profile_id, profile_data)
    
    return ProfileResponse(**profile_data)

def get_profiles(skip: int = 0, limit: int = 100, current_user: UserResponse = None) -> List[ProfileResponse]:
    """Get all LinkedIn profiles for a user"""
    # Filter profiles by user_id
    user_profiles = [
        ProfileResponse(**profile_data)
        for profile_id, profile_data in profiles_db.items()
        if profile_data["user_id"] == current_user.id
    ]
    
    return user_profiles[skip : skip + limit]

def get_profile(profile_id: str, current_user: UserResponse = None) -> Optional[ProfileResponse]:
    """Get a specific LinkedIn profile by ID"""
    profile_data = profiles_db.get(profile_id)
    
    if not profile_data or profile_data["user_id"] != current_user.id:
        return None
    
    return ProfileResponse(**profile_data)

def update_profile(profile_id: str, profile: ProfileUpdate, current_user: UserResponse = None) -> Optional[ProfileResponse]:
    """Update a LinkedIn profile"""
    profile_data = profiles_db.get(profile_id)
    
    if not profile_data or profile_data["user_id"] != current_user.id:
        return None
    
    update_data = profile.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        profile_data[field] = value
    
    profile_data["updated_at"] = datetime.now()
    profiles_db[profile_id] = profile_data
    
    return ProfileResponse(**profile_data)

def delete_profile(profile_id: str, current_user: UserResponse = None) -> bool:
    """Delete a LinkedIn profile"""
    profile_data = profiles_db.get(profile_id)
    
    if not profile_data or profile_data["user_id"] != current_user.id:
        return False
    
    del profiles_db[profile_id]
    
    return True 