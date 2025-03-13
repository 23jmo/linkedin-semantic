import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    linkedin_id = Column(String, index=True)
    name = Column(String)
    headline = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    location = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    profile_url = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    experiences = Column(JSON, default=list)
    educations = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    languages = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    is_indexed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship with User
    user = relationship("User", back_populates="profiles") 