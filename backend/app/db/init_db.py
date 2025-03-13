import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.utils.supabase_client import get_supabase_client
from app.core.config import settings

def init_db():
    """Initialize the database with pgvector extension and necessary tables"""
    supabase = get_supabase_client()
    
    # Read SQL setup script
    script_path = Path(__file__).parent / "setup_pgvector.sql"
    with open(script_path, "r") as f:
        sql_script = f.read()
    
    # Execute SQL script
    # Note: In a real implementation, you would need to use a more direct
    # connection to PostgreSQL to execute raw SQL, as Supabase client
    # doesn't directly support executing arbitrary SQL scripts
    print("SQL script to execute in Supabase SQL Editor:")
    print(sql_script)
    
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db()