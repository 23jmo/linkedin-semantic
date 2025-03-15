from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.schemas.search import SearchQuery, SearchResult
from app.services.search import search_profiles

router = APIRouter()

@router.post("/semantic-search", response_model=List[SearchResult])
async def semantic_search_endpoint(
    query: SearchQuery,
):
    """
    Search for LinkedIn profiles using semantic search
    """
    # Check if user's profiles are indexed
    # This would be implemented with a check against the database
    # For now, assume profiles are indexed
    
    results = search_profiles(query.query)
    return results
