from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import uuid
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.schemas.auth import TokenData, UserResponse

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

# Placeholder for database operations
# This would be implemented with actual database queries
users_db = {}

def verify_password(plain_password, hashed_password):
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Generate a password hash"""
    return pwd_context.hash(password)

def authenticate_user(username: str, password: str):
    """Authenticate a user with username and password"""
    # This would be implemented with a database query
    # For now, return a placeholder user for testing
    if username == "test@example.com" and password == "password":
        return UserResponse(
            id="1",
            email="test@example.com",
            username="testuser",
            full_name="Test User",
            is_active=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt

def get_user_by_email(email: str):
    """Get user by email"""
    for user_id, user_data in users_db.items():
        if user_data["email"] == email:
            return user_data
    
    return None

def get_user_by_linkedin_id(linkedin_id: str):
    """Get user by LinkedIn ID"""
    for user_id, user_data in users_db.items():
        if user_data.get("linkedin_id") == linkedin_id:
            return user_data
    
    return None

def create_or_update_user(user_data: Dict[str, Any]):
    """Create or update user from LinkedIn data"""
    # Check if user exists by LinkedIn ID
    existing_user = None
    if user_data.get("linkedin_id"):
        existing_user = get_user_by_linkedin_id(user_data["linkedin_id"])
    
    # If not found by LinkedIn ID, try email
    if not existing_user and user_data.get("email"):
        existing_user = get_user_by_email(user_data["email"])
    
    if existing_user:
        # Update existing user
        user_id = existing_user["id"]
        users_db[user_id].update({
            "linkedin_id": user_data.get("linkedin_id"),
            "email": user_data.get("email"),
            "username": user_data.get("username"),
            "full_name": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
            "updated_at": datetime.now()
        })
        return UserResponse(**users_db[user_id])
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        
        new_user = {
            "id": user_id,
            "linkedin_id": user_data.get("linkedin_id"),
            "email": user_data.get("email"),
            "username": user_data.get("username"),
            "full_name": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
            "is_active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        users_db[user_id] = new_user
        
        return UserResponse(**new_user)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from the JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # First try to decode with NextAuth secret
        try:
            payload = jwt.decode(token, settings.NEXTAUTH_SECRET, algorithms=["HS256"])
            # Extract user information from the NextAuth token
            user_id = payload.get("sub")
            if not user_id:
                raise JWTError("Missing sub claim")
            
            # Extract additional claims
            linkedin_id = payload.get("linkedinId")
            email = payload.get("email")
            name = payload.get("name")
            
        except JWTError:
            # If NextAuth token validation fails, try with our own secret
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            username = payload.get("sub")
            
            if username is None:
                raise credentials_exception
            
            token_data = TokenData(username=username)
            
            # Check if the user exists in our in-memory database
            for user_id, user_data in users_db.items():
                if user_data["username"] == token_data.username:
                    return UserResponse(**user_data)
            
            # Fallback to test user for development
            if token_data.username == "testuser":
                user = UserResponse(
                    id="1",
                    email="test@example.com",
                    username="testuser",
                    full_name="Test User",
                    is_active=True,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                return user
            
            raise credentials_exception
        
        # For NextAuth tokens, check if user exists or create a new one
        existing_user = None
        if linkedin_id:
            existing_user = get_user_by_linkedin_id(linkedin_id)
        
        if not existing_user and email:
            existing_user = get_user_by_email(email)
        
        if existing_user:
            return UserResponse(**existing_user)
        
        # Create a new user from NextAuth token data
        new_user = {
            "id": user_id,
            "linkedin_id": linkedin_id,
            "email": email,
            "username": f"user_{user_id}",
            "full_name": name or "LinkedIn User",
            "is_active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        users_db[user_id] = new_user
        
        return UserResponse(**new_user)
        
    except JWTError:
        raise credentials_exception 