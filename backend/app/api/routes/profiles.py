from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

import pydantic
from app.schemas.profiles import ProfileExistsRequest, ProfileExistsResponse, ProfileCreateRequest, ProfileCreateResponse, Profile
from app.services.embeddings import generate_embedding
import app.services.supabase as supabase
import uuid
from datetime import datetime
import logging
import requests
from app.core.config import settings

router = APIRouter()

@router.post("/check-user-exists", response_model=dict, status_code=status.HTTP_200_OK)
async def check_user_exists(
    profile_data: ProfileExistsRequest,
):
    logging.info(f"Received profile data: {profile_data}")
    print(f"{check_user_exists} profile_data: {profile_data}")
    return check_user_exists_service(profile_data)

@router.post("/create-user")
async def create_user(
    profile_data: ProfileCreateRequest,
):
    print(f"{create_user} profile_data: {profile_data}")
    return create_user_service(profile_data)


def check_user_exists_service(profile_data: ProfileExistsRequest):
    user_exists = supabase.check_user_exists(profile_data.user_id)
    if user_exists:
        return {"user_exists": True,
                "linkedin_profile": user_exists}
    else:
        return {"user_exists": False}
    

def create_user_service(profile_data: ProfileCreateRequest):
    # guess the linked in url from the linkedin_auth
    linkedin_url =   # Initialize with empty string to avoid syntax error
    # fetch profile data from linkedin - proxy curl
    response = fetch_linkedin_profile(profile_data.linkedin_auth)
    # parse the profile data into a LinkedInProfileResponse
    profile = Profile(
        id=uuid.uuid4(),
        user_id=profile_data.user_id,  # Use the user_id from the request
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
    embedding = generate_embedding(profile)
    # store the profile data in the linkedin_profiles table
    supabase.store_profile_in_supabase(profile_data.user_id, profile, embedding)
    # return the user data
    return {"user_id": profile_data.user_id,
            "linkedin_profile": profile}

def fetch_linkedin_profile(linkedin_url: str):
    # Use proxycurl API to fetch LinkedIn profile data
    headers = {
        'Authorization': f'Bearer {settings.PROXYCURL_API_KEY}'
    }
    params = {
        'linkedin_profile_url': linkedin_url
    }
    response = requests.get(
        'https://nubela.co/proxycurl/api/v2/linkedin',
        headers=headers,
        params=params
    )
    return response
    


