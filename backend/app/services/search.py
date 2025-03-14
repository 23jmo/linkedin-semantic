from typing import List, Dict, Any
import os
from openai import OpenAI

from app.core.config import settings
from app.schemas.search import SearchResult
from app.schemas.auth import UserResponse
from app.utils.supabase_client import get_supabase_client
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Initialize OpenAI client
if not settings.OPENAI_API_KEY:
    print("OPENAI_API_KEY is not set")
    
client = OpenAI(api_key=settings.OPENAI_API_KEY)

def get_embedding(text: str) -> List[float]:
    """Get embedding for text using OpenAI API"""
    # Check if OpenAI API key is set
    if not settings.OPENAI_API_KEY:
        # Return dummy embedding for testing
        return [0.0] * settings.EMBEDDING_DIMENSION
    
    response = client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=text
    )
    
    return response.data[0].embedding

def index_profile(profile_id: str, profile_data: Dict[str, Any]) -> bool:
    """Index a profile by generating and storing its embedding"""
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Create text to embed (combine relevant profile fields)
    text_to_embed = f"{profile_data.get('name', '')} {profile_data.get('headline', '')} {profile_data.get('summary', '')}"
    
    # Generate embedding
    embedding = get_embedding(text_to_embed)
    
    try:
        # Update profile with embedding and set is_indexed to true
        # In a real implementation, this would use Supabase to update the profile
        # For now, we'll just update the in-memory dictionary
        profile_data["embedding"] = embedding
        profile_data["is_indexed"] = True
        profiles_db[profile_id] = profile_data
        
        # If Supabase is available, store the embedding there as well
        if supabase:
            # This would be implemented with actual Supabase queries
            logger.info(f"Storing embedding in Supabase for profile {profile_id}")
            pass
            
        return True
    except Exception as e:
        logger.error(f"Error indexing profile: {e}")
        return False

def search_profiles(query: str, current_user: UserResponse) -> List[SearchResult]:
    """Search for LinkedIn profiles using semantic search"""
    # Generate query embedding
    query_embedding = get_embedding(query)
    
    # In a real implementation, this would use Supabase to perform the search
    # For now, we'll simulate the search with the in-memory dictionary
    results = []
    
    try:
        # Simulate vector search
        for profile_id, profile_data in profiles_db.items():
            if profile_data["user_id"] == current_user.id and profile_data.get("is_indexed", False):
                # In a real implementation, this would calculate the cosine similarity
                # between the query embedding and the profile embedding
                # For now, we'll use a random score
                import random
                score = random.uniform(0.5, 0.95)
                
                result = SearchResult(
                    id=profile_data["id"],
                    linkedin_id=profile_data["linkedin_id"],
                    name=profile_data["name"],
                    headline=profile_data.get("headline"),
                    summary=profile_data.get("summary"),
                    location=profile_data.get("location"),
                    industry=profile_data.get("industry"),
                    profile_url=profile_data.get("profile_url"),
                    profile_image_url=profile_data.get("profile_image_url"),
                    score=score,
                    highlights=[]
                )
                
                results.append(result)
        
        # Sort results by score
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results
    except Exception as e:
        logger.error(f"Error searching profiles: {e}")
        return [] 