from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID


class Status(str, Enum):
    """Status enum for TodoItem"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


@dataclass
class TodoItem:
    """TodoItem model corresponding to SysML TodoItem part def"""
    id: UUID
    title: str
    description: str
    status: Status
    created_at: datetime
    updated_at: datetime


@dataclass
class TodoItemUpdates:
    """Model for updating TodoItem"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Status] = None
