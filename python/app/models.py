from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class Status(str, Enum):
    """Status enum for TodoItem"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class TodoItemBase(BaseModel):
    """Base model for TodoItem"""
    title: str
    description: str


class TodoItemCreate(TodoItemBase):
    """Model for creating TodoItem"""
    pass


class TodoItemUpdate(BaseModel):
    """Model for updating TodoItem"""
    status: Status


class TodoItem(TodoItemBase):
    """TodoItem model corresponding to SysML TodoItem part def"""
    id: UUID = Field(default_factory=uuid4)
    status: Status = Status.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True
