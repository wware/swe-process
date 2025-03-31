from uuid import UUID, uuid4
from datetime import datetime
from typing import List

from .models import TodoItem, TodoItemUpdates, Status
from .storage.base import TodoStorage


class TodoService:
    """TodoService implementation corresponding to the SysML TodoService part def"""

    def __init__(self, storage: TodoStorage):
        self.storage = storage

    async def add_todo(self, title: str, description: str) -> TodoItem:
        """Add a new TodoItem"""
        todo = TodoItem(
            id=uuid4(),
            title=title,
            description=description,
            status=Status.PENDING,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return await self.storage.create_todo(todo)

    async def get_todo(self, id: UUID) -> TodoItem:
        """Get a TodoItem by ID"""
        return await self.storage.get_todo(id)

    async def list_todos(self) -> List[TodoItem]:
        """List all TodoItems"""
        return await self.storage.list_todos()

    async def update_todo(self, id: UUID, updates: TodoItemUpdates) -> TodoItem:
        """Update a TodoItem's status"""
        return await self.storage.update_todo(id, updates)

    async def delete_todo(self, id: UUID) -> None:
        """Delete a TodoItem by ID"""
        await self.storage.delete_todo(id)
