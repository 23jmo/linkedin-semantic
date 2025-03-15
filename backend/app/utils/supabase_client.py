from supabase import create_client
from app.core.config import settings

# Initialize Supabase client
supabase = None

# Only initialize Supabase if URL and key are provided
if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        print(settings.SUPABASE_URL)
        print(settings.SUPABASE_SERVICE_ROLE_KEY)
        print(f"Error initializing Supabase client: {e}")
        print("Continuing without Supabase integration.")

def get_supabase_client():
    """Get Supabase client instance"""
    return supabase 

def get_schema_client(schema_name="public"):
    """
    Get Supabase client with a specific schema
    
    Args:
        schema_name: Name of the schema to use (default: "public")
        
    Returns:
        A Supabase client configured to use the specified schema
    """
    if not supabase:
        return None
        
    # Create a new client that will use the specified schema
    return supabase.schema(schema_name) 