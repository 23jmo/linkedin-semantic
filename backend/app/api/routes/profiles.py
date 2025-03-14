from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

import pydantic
from app.schemas.profiles import ProfileExistsRequest, ProfileExistsResponse, ProfileCreateRequest, ProfileCreateResponse, Profile
from app.services.embeddings import generate_embedding
import app.services.supabase as supabase
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/check-user-exists", response_model=dict, status_code=status.HTTP_200_OK)
async def check_user_exists(
    profile_data: ProfileExistsRequest,
    bearer_token: str = Depends(lambda request: request.headers.get("Authorization").replace("Bearer ", ""))
):
    print(f"{check_user_exists} profile_data: {profile_data}, bearer_token: {bearer_token}")
    return await check_user_exists_service(profile_data, bearer_token)

@router.post("/create-user")
async def create_user(
    profile_data: ProfileCreateRequest,
    bearer_token: str = Depends(lambda request: request.headers.get("Authorization").replace("Bearer ", ""))
):
    print(f"{create_user} profile_data: {profile_data}, bearer_token: {bearer_token}")
    return await create_user_service(profile_data, bearer_token)


async def check_user_exists_service(profile_data: ProfileExistsRequest, bearer_token: str):
    user_exists = supabase.check_user_exists(profile_data.user_id, bearer_token)
    if user_exists:
        return {"user_exists": True,
                "linkedin_profile": user_exists}
    else:
        return {"user_exists": False}
    

async def create_user_service(profile_data: ProfileCreateRequest, bearer_token: str):
    
    
    # guess the linked in url from the linkedin_auth
    linkedin_url 
    # fetch profile data from linkedin - proxy curl
    response = await fetch_linkedin_profile(profile_data.linkedin_profile)
    # parse the profile data into a LinkedInProfileResponse
    profile = Profile(
        id=uuid.uuid4(),
        user_id="",  # generated from next_auth user-id (i need somehow to have the authenticated user here)
        linkedin_id="",
        full_name="",  # get this from the next-auth as well 
        headline=response.json().get("headline", ""),
        industry=response.json().get("industry", ""),
        location=response.json().get("country_full_name", {}) + " " + response.json().get("city", {}) + " " + response.json().get("state", {}) + response.json().get("postal_code", {}),
        profile_url=f"{linkedin_url}", # need to fix this 
        profile_picture_url=response.json().get("profilePicture", {}).get("displayImage", ""),
        summary=response.json().get("summary", ""),
        raw_profile_data=response.json(),
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    # generate an embedding for the profile
    embedding = await generate_embedding(profile)
    # store the profile data in the linkedin_profiles table
    await supabase.store_profile_in_supabase(profile_data.user_id, profile, embedding)
    # store the embedding in the profile_embeddings table
    await supabase.store_embedding_in_supabase(profile_data.user_id, embedding)
    # return the user data
    return {"user_id": profile_data.user_id,
            "linkedin_profile": profile}

async def fetch_linkedin_profile(linkedin_url: str):
    # proxy curl
    # parse the profile data into a LinkedInProfileResponse
    response = 0
    return response
    


