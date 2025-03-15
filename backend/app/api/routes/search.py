from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.schemas.search import SearchQuery, SearchResult
from app.services.search import search_profiles

router = APIRouter()

@router.post("/", response_model=List[SearchResult])
async def search_profiles_endpoint(
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

@router.get("/suggestions", response_model=List[str])
async def get_search_suggestions():
    """
    Get search suggestions based on user's network
    """
    # This would be implemented with a query against the database
    # For now, return placeholder suggestions
    return [
        "Software Engineers with experience in AI",
        "Product Managers in fintech",
        "UX Designers who worked at Google",
        "Data Scientists with Python experience",
        "Marketing professionals in healthcare"
    ] 