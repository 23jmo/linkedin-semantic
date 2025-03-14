from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
class Embedding(BaseModel):
    id: uuid.UUID
    profile_id: uuid.UUID
    embedding: list
    embedding_model: str
    created_at: datetime
