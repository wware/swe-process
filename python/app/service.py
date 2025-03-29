from datetime import datetime
from typing import List
from uuid import UUID

from app.models import TodoItem, Status
from app.storage.base import TodoStorage


class TodoService:
    """TodoService implementation corresponding to the SysML TodoService part def"""

    def __init__(self, storage: TodoStorage):
        self.storage = storage

    async def add_todo(self, title: str, description: str) -> TodoItem:
        """Add a new TodoItem"""
        todo_item = TodoItem(
            title=title,
            description=description,
            status=Status.PENDING,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return await self.storage.create_todo(todo_item)

    async def get_todo(self, id: UUID) -> TodoItem:
        """Get a TodoItem by ID"""
        return await self.storage.get_todo(id)

    async def list_todos(self) -> List[TodoItem]:
        """List all TodoItems"""
        return await self.storage.list_todos()

    async def update_todo(self, id: UUID, status: Status) -> TodoItem:
        """Update a TodoItem's status"""
        # First, retrieve the existing item
        todo_item = await self.storage.get_todo(id)
        
        # Update the status and updated_at fields
        todo_item.status = status
        todo_item.updated_at = datetime.utcnow()
        
        # Save the updated item
        return await self.storage.update_todo(todo_item)

    async def delete_todo(self, id: UUID) -> None:
        """Delete a TodoItem by ID"""
        await self.storage.delete_todo(id)
