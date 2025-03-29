from typing import List
from uuid import UUID

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.models import TodoItem, TodoItemUpdate
from app.service import TodoService
from app.storage.sqlite import SQLiteTodoStorage
from .schemas import TodoCreate


# Create FastAPI app
app = FastAPI(title="Todo API", description="A simple Todo API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database URL
DATABASE_URL = "sqlite+aiosqlite:///./todo.db"

# Create a TodoStorage instance
storage = SQLiteTodoStorage(DATABASE_URL)

# Create a TodoService instance
todo_service = TodoService(storage)


# Dependency to get the TodoService
async def get_todo_service():
    return todo_service


@app.on_event("startup")
async def startup():
    """Initialize the database on startup"""
    await storage.initialize()


@app.post("/todos", response_model=TodoItem, status_code=201)
async def create_todo(
    todo: TodoCreate, 
    service: TodoService = Depends(get_todo_service)
):
    """Create a new todo item"""
    return await service.add_todo(todo.title, todo.description)


@app.get("/todos", response_model=List[TodoItem])
async def list_todos(service: TodoService = Depends(get_todo_service)):
    """List all todo items"""
    return await service.list_todos()


@app.get("/todos/{todo_id}", response_model=TodoItem)
async def get_todo(todo_id: UUID, service: TodoService = Depends(get_todo_service)):
    """Get a todo item by ID"""
    try:
        return await service.get_todo(todo_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Todo item not found")


@app.put("/todos/{todo_id}", response_model=TodoItem)
async def update_todo(
    todo_id: UUID,
    todo_update: TodoItemUpdate,
    service: TodoService = Depends(get_todo_service),
):
    """Update a todo item's status"""
    try:
        return await service.update_todo(todo_id, todo_update.status)
    except KeyError:
        raise HTTPException(status_code=404, detail="Todo item not found")


@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: UUID, service: TodoService = Depends(get_todo_service)):
    """Delete a todo item"""
    try:
        await service.delete_todo(todo_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Todo item not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
