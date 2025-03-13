from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.schemas.profiles import ProfileCreate, ProfileResponse, ProfileUpdate
from app.services.auth import get_current_user
from app.services.profiles import create_profile, get_profile, get_profiles, update_profile, delete_profile

router = APIRouter()

@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile_endpoint(
    profile: ProfileCreate,
    current_user = Depends(get_current_user)
):
    """
    Create a new LinkedIn profile
    """
    return create_profile(profile, current_user)

@router.get("/", response_model=List[ProfileResponse])
async def get_profiles_endpoint(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user)
):
    """
    Get all LinkedIn profiles for the current user
    """
    return get_profiles(skip, limit, current_user)

@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile_endpoint(
    profile_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get a specific LinkedIn profile by ID
    """
    profile = get_profile(profile_id, current_user)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile_endpoint(
    profile_id: str,
    profile: ProfileUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update a LinkedIn profile
    """
    updated_profile = update_profile(profile_id, profile, current_user)
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return updated_profile

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile_endpoint(
    profile_id: str,
    current_user = Depends(get_current_user)
):
    """
    Delete a LinkedIn profile
    """
    success = delete_profile(profile_id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return None

@router.post("/index", status_code=status.HTTP_202_ACCEPTED)
async def index_profiles(
    current_user = Depends(get_current_user)
):
    """
    Index all LinkedIn profiles for the current user
    This is an asynchronous operation that will run in the background
    """
    # This would trigger the background task to index profiles
    # For now, return a placeholder
    return {"message": "Profile indexing started"} 