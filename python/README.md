# Python Todo App

A FastAPI implementation of a Todo service based on SysML specifications.

## Project Structure

```
todo_app/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application 
│   ├── models.py            # Pydantic models
│   ├── schemas.py           # Database schemas
│   ├── storage/
│   │   ├── __init__.py
│   │   ├── base.py          # TodoStorage interface
│   │   └── sqlite.py        # SQLite implementation
│   └── service.py           # TodoService implementation
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Test fixtures
│   ├── test_models.py       # Model tests
│   ├── test_service.py      # Service tests
│   └── test_api.py          # API tests
├── requirements.txt         # Dependencies
└── README.md                # Project documentation
```

## Setup with Docker

### Prerequisites
- Docker
- Docker Compose

### Build and Run

Build the Docker image:
```bash
make build
```

Run the application:
```bash
make run
```

The API will be available at http://localhost:8000.
Swagger documentation is available at http://localhost:8000/docs.

### Run Tests

Run tests once:
```bash
make test
```

Run tests in watch mode (continuously as files change):
```bash
make test-watch
```

Clean up:
```bash
make clean
```

## Project Structure

- `app/`: Application code
  - `main.py`: FastAPI application
  - `models.py`: Pydantic models
  - `schemas.py`: Database schemas
  - `service.py`: TodoService implementation
  - `storage/`: Storage implementations
- `tests/`: Test code
  - `test_models.py`: Model tests
  - `test_service.py`: Service tests
  - `test_api.py`: API endpoint tests

## API Endpoints

- `POST /todos`: Create a new todo
- `GET /todos`: List all todos
- `GET /todos/{todo_id}`: Get a specific todo
- `PUT /todos/{todo_id}`: Update a todo's status
- `DELETE /todos/{todo_id}`: Delete a todo