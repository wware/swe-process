import json
import pytest
from uuid import UUID
from app.main import app  # Make sure we import the app


class TestTodoAPI:
    @pytest.mark.asyncio
    async def test_create_todo(self, async_client):
        """Test creating a todo via API"""
        response = await async_client.post(
            app.url_path_for("create_todo"),  # Use URL path generation if you have named routes
            # or just use the direct path if you prefer
            # "/todos",
            json={"title": "API Test Todo", "description": "Created via API test"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "API Test Todo"
        assert data["description"] == "Created via API test"
        assert data["status"] == "PENDING"
        assert "id" in data
        
        # Make sure UUID is valid
        UUID(data["id"])

    @pytest.mark.asyncio
    async def test_get_todo(self, async_client, todo_service):
        """Test getting a todo via API"""
        # Create a todo to fetch
        todo = await todo_service.add_todo(
            title="Todo to Fetch",
            description="This todo will be fetched via API"
        )
        
        response = await async_client.get(f"/todos/{todo.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(todo.id)
        assert data["title"] == "Todo to Fetch"
        assert data["description"] == "This todo will be fetched via API"
        assert data["status"] == "PENDING"

    @pytest.mark.asyncio
    async def test_get_todo_not_found(self, async_client):
        """Test getting a non-existent todo via API"""
        non_existent_id = "00000000-0000-0000-0000-000000000000"
        response = await async_client.get(f"/todos/{non_existent_id}")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Todo item not found"

    @pytest.mark.asyncio
    async def test_list_todos(self, async_client, todo_service):
        """Test listing todos via API"""
        # Add some todos
        await todo_service.add_todo("API List Todo 1", "First todo for list test")
        await todo_service.add_todo("API List Todo 2", "Second todo for list test")
        
        response = await async_client.get("/todos")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check if our test todos are in the list
        titles = [todo["title"] for todo in data]
        assert "API List Todo 1" in titles
        assert "API List Todo 2" in titles

    @pytest.mark.asyncio
    async def test_update_todo(self, async_client, todo_service):
        """Test updating a todo via API"""
        # Create a todo to update
        todo = await todo_service.add_todo(
            title="Todo to Update",
            description="This todo will be updated via API"
        )
        
        # Update the todo status
        response = await async_client.put(
            f"/todos/{todo.id}",
            json={"status": "IN_PROGRESS"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(todo.id)
        assert data["title"] == "Todo to Update"
        assert data["description"] == "This todo will be updated via API"
        assert data["status"] == "IN_PROGRESS"
        
        # Verify the change persisted by getting it again
        response = await async_client.get(f"/todos/{todo.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "IN_PROGRESS"

    @pytest.mark.asyncio
    async def test_update_todo_not_found(self, async_client):
        """Test updating a non-existent todo via API"""
        non_existent_id = "00000000-0000-0000-0000-000000000000"
        response = await async_client.put(
            f"/todos/{non_existent_id}",
            json={"status": "COMPLETED"}
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Todo item not found"

    @pytest.mark.asyncio
    async def test_delete_todo(self, async_client, todo_service):
        """Test deleting a todo via API"""
        # Create a todo to delete
        todo = await todo_service.add_todo(
            title="Todo to Delete",
            description="This todo will be deleted via API"
        )
        
        # Delete the todo
        response = await async_client.delete(f"/todos/{todo.id}")
        assert response.status_code == 204
        
        # Verify it's gone
        response = await async_client.get(f"/todos/{todo.id}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_todo_not_found(self, async_client):
        """Test deleting a non-existent todo via API"""
        non_existent_id = "00000000-0000-0000-0000-000000000000"
        response = await async_client.delete(f"/todos/{non_existent_id}")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Todo item not found"

    @pytest.mark.asyncio
    async def test_create_todo_with_empty_title(self, async_client):
        """Test creating a todo with an empty title"""
        response = await async_client.post(
            "/todos",
            json={"title": "", "description": "Todo with empty title"}
        )
        
        # Pydantic validation should catch this
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_todo_with_missing_fields(self, async_client):
        """Test creating a todo with missing required fields"""
        response = await async_client.post(
            "/todos",
            json={"title": "Incomplete Todo"}  # Missing description
        )
        
        # Pydantic validation should catch this
        assert response.status_code == 422
