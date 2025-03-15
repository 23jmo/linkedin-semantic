from supabase import create_client
import os
from app.schemas.profiles import Profile
import pydantic
from app.schemas.embeddings import Embedding
import uuid
from app.utils.supabase_client import get_supabase_client, get_schema_client

# Get the default client
supabase = get_supabase_client()

def check_user_exists(user_id, schema_name="linkedin_profiles"):
    """
    Check if a user exists in the linkedin_profiles table
    
    Args:
        user_id: The user's ID
        schema_name: Optional schema name (default: " ")
    """
    # Use the specified schema
    client = get_schema_client(schema_name) if schema_name != "public" else supabase
    
    if not client:
        return None
    
    response = client.table("profiles").select("*").eq("user_id", user_id).execute()
    
    return response.data

def store_profile_in_supabase(user_id: str, linkedin_profile: Profile, profile_embedding: Embedding, schema_name="public"):
    """
    Store a LinkedIn profile in Supabase
    Args:
        user_id: The user's ID
        linkedin_profile: Profile object containing LinkedIn profile data (validated by pydantic)
        profile_embedding: Vector embedding of the profile text
        schema_name: Optional schema name (default: "public")
    """
    # Use the specified schema
    client = get_schema_client(schema_name) if schema_name != "public" else supabase
    
    if not client:
        raise ValueError("Supabase client not initialized")
        
    # Validate profile data using pydantic model
    try:
        # Profile model will validate the data
        validated_profile = Profile(
            id=linkedin_profile.id,
            user_id=user_id,
            linkedin_id=linkedin_profile.linkedin_id,
            full_name=linkedin_profile.full_name,
            headline=linkedin_profile.headline,
            industry=linkedin_profile.industry,
            location=linkedin_profile.location,
            profile_url=linkedin_profile.profile_url,
            profile_picture_url=linkedin_profile.profile_picture_url,
            summary=linkedin_profile.summary,
            raw_profile_data=linkedin_profile.raw_profile_data,
            created_at=linkedin_profile.created_at,
            updated_at=linkedin_profile.updated_at
        )
        
        # Convert to dict for Supabase storage
        profile_data = validated_profile.model_dump()
        # Convert UUID and datetime to strings
        profile_data["id"] = str(profile_data["id"])
        profile_data["user_id"] = str(profile_data["user_id"])
        profile_data["created_at"] = profile_data["created_at"].isoformat()
        profile_data["updated_at"] = profile_data["updated_at"].isoformat()
        
        response = client.table("profiles").insert(profile_data).execute()
        
    except pydantic.ValidationError as e:
        raise ValueError(f"Invalid profile data: {str(e)}")
      
    try:
        validated_embedding = Embedding(
            id=uuid.uuid4(),
            profile_id=validated_profile.id,
            embedding=profile_embedding,
            embedding_model="openai"
        )
       
        embedding_data = validated_embedding.model_dump()
        embedding_data["id"] = str(embedding_data["id"])
        embedding_data["profile_id"] = str(embedding_data["profile_id"])
        embedding_data["embedding"] = embedding_data["embedding"]
        embedding_data["embedding_model"] = embedding_data["embedding_model"] 
        
        response = client.table("profile_embeddings").insert(embedding_data).execute()
        
    except pydantic.ValidationError as e:
        raise ValueError(f"Invalid profile data: {str(e)}")
        
        
        
        
