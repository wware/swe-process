from typing import List
from uuid import UUID

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.models import TodoItem, TodoItemUpdate
from app.service import TodoService
from app.storage.sqlite import SQLiteTodoStorage
from .schemas import TodoCreate, TodoUpdate, TodoResponse


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


@app.post("/todos", response_model=TodoResponse, status_code=201)
async def create_todo(todo: TodoCreate):
    return await todo_service.add_todo(todo.title, todo.description)


@app.get("/todos", response_model=list[TodoResponse])
async def list_todos():
    return await todo_service.list_todos()


@app.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: UUID):
    try:
        return await todo_service.get_todo(todo_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.patch("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: UUID, updates: TodoUpdate):
    try:
        return await todo_service.update_todo(todo_id, TodoItemUpdates(**updates.dict(exclude_unset=True)))
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: UUID):
    try:
        await todo_service.delete_todo(todo_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
