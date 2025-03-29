from abc import ABC, abstractmethod
from typing import List
from uuid import UUID

from app.models import TodoItem


class TodoStorage(ABC):
    """TodoStorage interface corresponding to the SysML TodoStorage interface def"""

    @abstractmethod
    async def create_todo(self, item: TodoItem) -> TodoItem:
        """Create a new TodoItem in storage"""
        pass

    @abstractmethod
    async def get_todo(self, id: UUID) -> TodoItem:
        """Get a TodoItem by ID"""
        pass

    @abstractmethod
    async def list_todos(self) -> List[TodoItem]:
        """List all TodoItems"""
        pass

    @abstractmethod
    async def update_todo(self, item: TodoItem) -> TodoItem:
        """Update a TodoItem"""
        pass

    @abstractmethod
    async def delete_todo(self, id: UUID) -> None:
        """Delete a TodoItem by ID"""
        pass
