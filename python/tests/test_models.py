import pytest
from uuid import UUID
from datetime import datetime

from app.models import TodoItem, Status


class TestTodoItem:
    def test_create_todo_item(self):
        """Test creation of a TodoItem"""
        todo = TodoItem(
            title="Test Todo",
            description="Test Description"
        )
        
        assert isinstance(todo.id, UUID)
        assert todo.title == "Test Todo"
        assert todo.description == "Test Description"
        assert todo.status == Status.PENDING
        assert isinstance(todo.created_at, datetime)
        assert isinstance(todo.updated_at, datetime)

    def test_todo_item_with_custom_values(self):
        """Test creation of a TodoItem with custom values"""
        todo = TodoItem(
            id=UUID("12345678-1234-5678-1234-567812345678"),
            title="Custom Todo",
            description="Custom Description",
            status=Status.IN_PROGRESS,
            created_at=datetime(2023, 1, 1, 12, 0, 0),
            updated_at=datetime(2023, 1, 1, 12, 0, 0)
        )
        
        assert todo.id == UUID("12345678-1234-5678-1234-567812345678")
        assert todo.title == "Custom Todo"
        assert todo.description == "Custom Description"
        assert todo.status == Status.IN_PROGRESS
        assert todo.created_at == datetime(2023, 1, 1, 12, 0, 0)
        assert todo.updated_at == datetime(2023, 1, 1, 12, 0, 0)

    def test_status_enum(self):
        """Test Status enum values"""
        assert Status.PENDING == "PENDING"
        assert Status.IN_PROGRESS == "IN_PROGRESS"
        assert Status.COMPLETED == "COMPLETED"
