from datetime import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.sqlite import BLOB
import sqlite3
import uuid
from pydantic import BaseModel, Field

Base = declarative_base()


class TodoItemSchema(Base):
    """SQLAlchemy schema for TodoItem"""
    __tablename__ = "todo_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False, default="PENDING")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# Register UUID type adapter for SQLite
def _uuid_adapter(uuid_obj):
    return str(uuid_obj)


def _uuid_converter(uuid_str):
    return uuid.UUID(uuid_str)


sqlite3.register_adapter(uuid.UUID, _uuid_adapter)
sqlite3.register_converter("UUID", _uuid_converter)


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1)  # Requires non-empty string
    description: str = Field(...)  # Makes description required (no default value)
