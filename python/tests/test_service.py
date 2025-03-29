import pytest
import uuid
from uuid import UUID

from app.models import Status


class TestTodoService:
    @pytest.mark.asyncio
    async def test_add_todo(self, todo_service):
        """Test adding a new todo item"""
        todo = await todo_service.add_todo(
            title="Test Todo",
            description="This is a test"
        )
        
        assert isinstance(todo.id, UUID)
        assert todo.title == "Test Todo"
        assert todo.description == "This is a test"
        assert todo.status == Status.PENDING

    @pytest.mark.asyncio
    async def test_get_todo(self, todo_service, test_todo):
        """Test getting a todo by ID"""
        retrieved_todo = await todo_service.get_todo(test_todo.id)
        
        assert retrieved_todo.id == test_todo.id
        assert retrieved_todo.title == test_todo.title
        assert retrieved_todo.description == test_todo.description
        assert retrieved_todo.status == test_todo.status

    @pytest.mark.asyncio
    async def test_get_todo_not_found(self, todo_service):
        """Test getting a todo with non-existent ID"""
        non_existent_id = UUID("00000000-0000-0000-0000-000000000000")
        
        with pytest.raises(KeyError):
            await todo_service.get_todo(non_existent_id)

    @pytest.mark.asyncio
    async def test_list_todos(self, todo_service):
        """Test listing all todos"""
        # Add a few todo items
        await todo_service.add_todo("First Todo", "First description")
        await todo_service.add_todo("Second Todo", "Second description")
        
        todos = await todo_service.list_todos()
        
        assert isinstance(todos, list)
        assert len(todos) >= 2  # There could be more from other tests
        
        titles = [todo.title for todo in todos]
        assert "First Todo" in titles
        assert "Second Todo" in titles

    @pytest.mark.asyncio
    async def test_update_todo(self, todo_service, test_todo):
        """Test updating a todo's status"""
        # Update the todo status
        updated_todo = await todo_service.update_todo(
            test_todo.id, Status.IN_PROGRESS
        )
        
        assert updated_todo.id == test_todo.id
        assert updated_todo.status == Status.IN_PROGRESS
        
        # Verify the change persists by getting it again
        retrieved_todo = await todo_service.get_todo(test_todo.id)
        assert retrieved_todo.status == Status.IN_PROGRESS

    @pytest.mark.asyncio
    async def test_update_todo_not_found(self, todo_service):
        """Test updating a todo with non-existent ID"""
        non_existent_id = UUID("00000000-0000-0000-0000-000000000000")
        
        with pytest.raises(KeyError):
            await todo_service.update_todo(non_existent_id, Status.COMPLETED)

    @pytest.mark.asyncio
    async def test_delete_todo(self, todo_service):
        """Test deleting a todo"""
        # Create a todo to delete
        todo = await todo_service.add_todo(
            title="Todo to Delete",
            description="This todo will be deleted"
        )
        
        # Verify it exists
        retrieved_todo = await todo_service.get_todo(todo.id)
        assert retrieved_todo.id == todo.id
        
        # Delete it
        await todo_service.delete_todo(todo.id)
        
        # Verify it's gone
        with pytest.raises(KeyError):
            await todo_service.get_todo(todo.id)

    @pytest.mark.asyncio
    async def test_delete_todo_not_found(self, todo_service):
        """Test deleting a todo with non-existent ID"""
        non_existent_id = UUID("00000000-0000-0000-0000-000000000000")
        
        with pytest.raises(KeyError):
            await todo_service.delete_todo(non_existent_id)
