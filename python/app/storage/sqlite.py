from datetime import datetime
from typing import List
from uuid import UUID
import aiosqlite

from app.models import TodoItem, Status, TodoItemUpdates
from app.schemas import TodoItemSchema, Base
from app.storage.base import TodoStorage


class SqliteStorage(TodoStorage):
    """SQLite implementation of TodoStorage"""

    def __init__(self, db_path: str):
        self.db_path = db_path

    async def create_todo(self, item: TodoItem) -> TodoItem:
        """Create a new TodoItem in storage"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO todos (id, title, description, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (str(item.id), item.title, item.description, item.status.value,
                 item.created_at.isoformat(), item.updated_at.isoformat())
            )
            await db.commit()
            return item

    async def get_todo(self, id: UUID) -> TodoItem:
        """Get a TodoItem by ID"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                "SELECT * FROM todos WHERE id = ?", (str(id),)
            ) as cursor:
                row = await cursor.fetchone()
                if row is None:
                    raise KeyError(f"Todo with id {id} not found")
                return self._row_to_todo(row)

    async def list_todos(self) -> List[TodoItem]:
        """List all TodoItems"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT * FROM todos") as cursor:
                rows = await cursor.fetchall()
                return [self._row_to_todo(row) for row in rows]

    async def update_todo(self, id: UUID, updates: TodoItemUpdates) -> TodoItem:
        """Update a TodoItem"""
        async with aiosqlite.connect(self.db_path) as db:
            # First get the existing todo
            todo = await self.get_todo(id)
            
            # Apply updates
            if updates.title is not None:
                todo.title = updates.title
            if updates.description is not None:
                todo.description = updates.description
            if updates.status is not None:
                todo.status = updates.status
            
            todo.updated_at = datetime.utcnow()

            # Save updates
            await db.execute(
                """
                UPDATE todos 
                SET title = ?, description = ?, status = ?, updated_at = ?
                WHERE id = ?
                """,
                (todo.title, todo.description, todo.status.value,
                 todo.updated_at.isoformat(), str(id))
            )
            await db.commit()
            return todo

    async def delete_todo(self, id: UUID) -> None:
        """Delete a TodoItem by ID"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM todos WHERE id = ?", (str(id),))
            await db.commit()

    def _row_to_todo(self, row) -> TodoItem:
        """Convert row to TodoItem"""
        return TodoItem(
            id=UUID(row[0]),
            title=row[1],
            description=row[2],
            status=Status(row[3]),
            created_at=datetime.fromisoformat(row[4]),
            updated_at=datetime.fromisoformat(row[5])
        )
