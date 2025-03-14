from supabase import create_client
import os

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)

async def store_profile_in_supabase(user_id, linkedin_profile, profile_embedding):
    """
    Store a LinkedIn profile in Supabase
    """
    
    # first store the profile in the linkedin_profiles table
    
    # then store the embedding in the profile_embeddings table

