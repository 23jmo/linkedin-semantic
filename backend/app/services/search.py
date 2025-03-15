from typing import List, Dict, Any
import os


from app.core.config import settings
from app.schemas.search import SearchResult
from app.schemas.auth import UserResponse
from app.utils.supabase_client import get_supabase_client
from app.services.embeddings import generate_embedding
from app.services.supabase import semantic_search
from app.schemas.profiles import Profile

import logging

# Set up logging
logger = logging.getLogger(__name__)

def search_profiles(query: str) -> List[SearchResult]:
    """Search for LinkedIn profiles using semantic search"""
    # Generate query embedding
    query_embedding = generate_embedding(query)
    
    # Perform semantic search
    results = semantic_search(query_embedding)
    
    results.sort(key=lambda x: x.score, reverse=True)
    
    profiles = []
    
    """TABLE(id uuid, user_id uuid, full_name text, headline text, industry text, location text, profile_picture_url text, summary text, similarity double precision)"""

    for result in results:
        profile = Profile(
            id=result.id,
            user_id=result.user_id,
            linkedin_id=result.linkedin_id,
            full_name=result.full_name,
            headline=result.headline,
            industry=result.industry,
            location=result.location,
            profile_url=result.profile_url,
            profile_picture_url=result.profile_picture_url,
            summary=result.summary,
            raw_profile_data=result.raw_profile_data,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )
        search_result = SearchResult(
            profile=profile,
            score=result.similarity,
        )
        profiles.append(search_result)
        
    return profiles
    # try:
    #     # Simulate vector search
    #     for profile_id, profile_data in profiles_db.items():
    #         if profile_data["user_id"] == current_user.id and profile_data.get("is_indexed", False):
    #             # In a real implementation, this would calculate the cosine similarity
    #             # between the query embedding and the profile embedding
    #             # For now, we'll use a random score
    #             import random
    #             score = random.uniform(0.5, 0.95)
                
    #             result = SearchResult(
    #                 id=profile_data["id"],
    #                 linkedin_id=profile_data["linkedin_id"],
    #                 name=profile_data["name"],
    #                 headline=profile_data.get("headline"),
    #                 summary=profile_data.get("summary"),
    #                 location=profile_data.get("location"),
    #                 industry=profile_data.get("industry"),
    #                 profile_url=profile_data.get("profile_url"),
    #                 profile_image_url=profile_data.get("profile_image_url"),
    #                 score=score,
    #                 highlights=[]
    #             )
                
    #             results.append(result)
        
    #     # Sort results by score
    
    # except Exception as e:
    #     logger.error(f"Error searching profiles: {e}")
    #     return [] 