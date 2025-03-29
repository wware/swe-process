import asyncio
import os
import pytest
import uuid
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app, get_todo_service, storage
from app.models import TodoItem, Status
from app.schemas import Base
from app.service import TodoService
from app.storage.sqlite import SQLiteTodoStorage


# Create a unique database file for each test session
@pytest.fixture(scope="session")
def db_file():
    file_name = f"test_todo_{uuid.uuid4()}.db"
    yield file_name
    # Clean up the file after tests
    if os.path.exists(file_name):
        os.unlink(file_name)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def sqlite_storage(db_file):
    """Create a clean SQLiteTodoStorage for each test"""
    db_url = f"sqlite+aiosqlite:///./{db_file}"
    todo_storage = SQLiteTodoStorage(db_url)
    
    # Create tables
    await todo_storage.initialize()
    
    yield todo_storage
    
    # Clean up database after test
    engine = create_async_engine(db_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def todo_service(sqlite_storage):
    """Create a TodoService with clean storage for each test"""
    return TodoService(sqlite_storage)


@pytest.fixture
async def test_client():
    """Create a TestClient for FastAPI"""
    with TestClient(app) as client:
        yield client


@pytest.fixture
async def async_client(sqlite_storage):
    """Create an AsyncClient for FastAPI"""
    # Override the storage dependency
    app.dependency_overrides[get_todo_service] = lambda: TodoService(sqlite_storage)
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    # Clean up the dependency override
    app.dependency_overrides.clear()


@pytest.fixture
async def test_todo(todo_service):
    """Create a test TodoItem"""
    todo = await todo_service.add_todo(
        title="Test Todo",
        description="This is a test todo item"
    )
    return todo
