from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.schemas.profiles import ProfileCreate, ProfileResponse, ProfileUpdate
from app.services.auth import get_current_user
from app.services.profiles import create_profile, get_profile, get_profiles, update_profile, delete_profile

router = APIRouter()

@router.post("/check-user-exists", response_model=dict, status_code=status.HTTP_200_OK)
async def check_user_exists(
    profile_data: ProfileCreate,
    bearer_token: str = Depends(get_current_user)
):
    return await check_user_exists_service(profile_data, bearer_token)

@router.post("/create-user")
async def create_user(
    profile_data: ProfileCreate,
    bearer_token: str = Depends(get_current_user)
):
    return await create_user_service(profile_data, bearer_token)


async def check_user_exists_service(profile_data: ProfileCreate, bearer_token: str):
    

async def create_user_service(profile_data: ProfileCreate, bearer_token: str):
    return await create_user(profile_data, bearer_token)

