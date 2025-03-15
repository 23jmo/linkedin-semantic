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
    return await create_user_service(profile_data)


def check_user_exists_service(profile_data: ProfileExistsRequest):
    user_exists = supabase.check_user_exists(profile_data.user_id)
    if user_exists:
        return {"user_exists": True,
                "linkedin_profile": user_exists}
    else:
        return {"user_exists": False}
    

async def create_user_service(profile_data: ProfileCreateRequest):
    # Use the provided LinkedIn URL instead of guessing it
    print(f"Creating user with data: {profile_data}")
    
    linkedin_url = profile_data.linkedin_url
    
    if not linkedin_url:
        print("LinkedIn URL is missing")
        raise HTTPException(status_code=400, detail="LinkedIn URL is required")
    
    print(f"Fetching LinkedIn profile from URL: {linkedin_url}")
    # fetch profile data from linkedin - proxy curl
    response = fetch_linkedin_profile(linkedin_url)
    
    if response.status_code != 200:
        print(f"Failed to fetch LinkedIn profile: {response.status_code} - {response.text}")
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch LinkedIn profile")
    
    # Verify that the profile data matches the LinkedIn auth data
    auth_data = profile_data.linkedin_auth
    profile_data_from_proxycurl = response.json()
    
    print(f"LinkedIn auth data: {auth_data}")
    print(f"Proxycurl profile data (sample): {str(profile_data_from_proxycurl)[:200]}...")
    
    # Verify that the profile data matches the auth data
    verify_profile_match(auth_data, profile_data_from_proxycurl)

    # Safely build the location string
    location_parts = [
        profile_data_from_proxycurl.get("country_full_name", ""),
        profile_data_from_proxycurl.get("city", ""),
        profile_data_from_proxycurl.get("state", ""),
        profile_data_from_proxycurl.get("postal_code", "")
    ]
    # Filter out empty parts and join with spaces
    location = " ".join([part for part in location_parts if part])

    profile = Profile(
        id=uuid.uuid4(),
        user_id=profile_data.user_id,  # Use the user_id from the request
        linkedin_id="",
        full_name=profile_data_from_proxycurl.get("full_name", ""),
        headline=profile_data_from_proxycurl.get("headline", ""),
        industry=profile_data_from_proxycurl.get("industry", ""),
        location=location,
        profile_url=linkedin_url,
        profile_picture_url=profile_data_from_proxycurl.get("profile_pic_url", ""),
        summary=profile_data_from_proxycurl.get("summary", ""),
        raw_profile_data=profile_data_from_proxycurl,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    # generate an embedding for the profile
    embedding = await generate_embedding(profile)
    # store the profile data in the linkedin_profiles table
    supabase.store_profile_in_supabase(profile_data.user_id, profile, embedding, "linkedin_profiles")
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
    
def verify_profile_match(auth_data: dict, profile_data: dict):
    """
    Verify that the profile data matches the authentication data by comparing emails and names.
    
    Args:
        auth_data: Authentication data from LinkedIn OAuth
        profile_data: Profile data from Proxycurl API
    
    Raises:
        HTTPException: If profile data doesn't match auth data
    """
    # Check if we have auth data and profile data
    if not auth_data or not profile_data:
        print("Missing auth_data or profile_data, skipping verification")
        return
        
    # Compare email addresses if available
    auth_email = auth_data.get('email', '').lower() if auth_data else ''
    profile_email = profile_data.get('email', '').lower() if profile_data else ''
    
    if auth_email and profile_email and auth_email != profile_email:
        print(f"Email mismatch: auth={auth_email}, profile={profile_email}")
        raise HTTPException(status_code=400, detail="LinkedIn profile email does not match authentication email")
    
    # Compare names as fallback
    auth_name = auth_data.get('name', '').lower() if auth_data else ''
    profile_name = profile_data.get('full_name', '').lower() if profile_data else ''
    
    if auth_name and profile_name and auth_name != profile_name:
        print(f"Name mismatch: auth={auth_name}, profile={profile_name}")
        raise HTTPException(status_code=400, detail="LinkedIn profile name does not match authentication name")
    
    print("Profile verification passed!!!")


