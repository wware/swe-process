from datetime import datetime
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker

from app.models import TodoItem, Status
from app.schemas import TodoItemSchema, Base
from app.storage.base import TodoStorage


class SQLiteTodoStorage(TodoStorage):
    """SQLite implementation of TodoStorage"""

    def __init__(self, database_url: str):
        self.engine = create_async_engine(database_url)
        self.async_session = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )

    async def initialize(self):
        """Initialize the database by creating tables"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def create_todo(self, item: TodoItem) -> TodoItem:
        """Create a new TodoItem in storage"""
        db_item = TodoItemSchema(
            id=str(item.id),
            title=item.title,
            description=item.description,
            status=item.status.value,
            created_at=item.created_at,
            updated_at=item.updated_at
        )

        async with self.async_session() as session:
            session.add(db_item)
            await session.commit()
            await session.refresh(db_item)

        return self._schema_to_model(db_item)

    async def get_todo(self, id: UUID) -> TodoItem:
        """Get a TodoItem by ID"""
        async with self.async_session() as session:
            result = await session.execute(
                select(TodoItemSchema).where(TodoItemSchema.id == str(id))
            )
            db_item = result.scalars().first()
            if db_item is None:
                raise KeyError(f"TodoItem with ID {id} not found")

        return self._schema_to_model(db_item)

    async def list_todos(self) -> List[TodoItem]:
        """List all TodoItems"""
        async with self.async_session() as session:
            result = await session.execute(select(TodoItemSchema))
            db_items = result.scalars().all()

        return [self._schema_to_model(db_item) for db_item in db_items]

    async def update_todo(self, item: TodoItem) -> TodoItem:
        """Update a TodoItem"""
        async with self.async_session() as session:
            result = await session.execute(
                select(TodoItemSchema).where(TodoItemSchema.id == str(item.id))
            )
            db_item = result.scalars().first()
            if db_item is None:
                raise KeyError(f"TodoItem with ID {item.id} not found")

            # Update fields
            db_item.status = item.status.value
            db_item.updated_at = datetime.utcnow()

            await session.commit()
            await session.refresh(db_item)

        return self._schema_to_model(db_item)

    async def delete_todo(self, id: UUID) -> None:
        """Delete a TodoItem by ID"""
        async with self.async_session() as session:
            result = await session.execute(
                select(TodoItemSchema).where(TodoItemSchema.id == str(id))
            )
            db_item = result.scalars().first()
            if db_item is None:
                raise KeyError(f"TodoItem with ID {id} not found")

            await session.delete(db_item)
            await session.commit()

    @staticmethod
    def _schema_to_model(schema: TodoItemSchema) -> TodoItem:
        """Convert TodoItemSchema to TodoItem"""
        return TodoItem(
            id=UUID(schema.id),
            title=schema.title,
            description=schema.description,
            status=Status(schema.status),
            created_at=schema.created_at,
            updated_at=schema.updated_at
        )
