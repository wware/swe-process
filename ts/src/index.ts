import express from 'express';
import { TodoService } from './services/todo-service';
import { SQLiteStorage } from './storage/sqlite-storage';
import { config } from './config/config';
import { logger } from './utils/logging';
import { NotFoundError, ValidationError, AppError } from './core/errors';
import { Status } from './core/types';
import { validateTodoTitle, validateTodoDescription, validateUuid } from './utils/validation';

// Create an Express application
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Set up CORS headers
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Handle OPTIONS requests
app.options('*', (_req, res) => {
  res.sendStatus(200);
});

// Create a SQLite storage instance for local development
const sqliteConfig = (config as any).sqlite;
const storage = new SQLiteStorage(sqliteConfig?.dbPath || './data/todos.db');

// Create a TodoService instance using the SQLite storage
const todoService = new TodoService(storage);

// Define routes
app.get('/', (_req, res) => {
  res.json({
    message: 'Todo API is running',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/todos', description: 'List all todo items' },
      { method: 'POST', path: '/todos', description: 'Create a new todo item' },
      { method: 'GET', path: '/todos/:id', description: 'Get a todo item by ID' },
      { method: 'PUT', path: '/todos/:id', description: 'Update a todo item' },
      { method: 'DELETE', path: '/todos/:id', description: 'Delete a todo item' }
    ]
  });
});

// List all todo items
app.get('/todos', async (_req, res, next) => {
  try {
    const todoItems = await todoService.listTodos();
    res.json(todoItems);
  } catch (error) {
    next(error);
  }
});

// Create a new todo item
app.post('/todos', async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validate request body
    validateTodoTitle(title);
    validateTodoDescription(description);

    const todoItem = await todoService.addTodo(title, description);
    res.status(201).json(todoItem);
  } catch (error) {
    next(error);
  }
});

// Get a todo item by ID
app.get('/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    validateUuid(id);

    const todoItem = await todoService.getTodo(id);
    res.json(todoItem);
  } catch (error) {
    next(error);
  }
});

// Update a todo item
app.put('/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    validateUuid(id);

    // Validate status
    if (!Object.values(Status).includes(status as Status)) {
      throw new ValidationError(
        `Invalid status: ${status}. Valid values are: ${Object.values(Status).join(', ')}`
      );
    }

    const todoItem = await todoService.updateTodo(id, status);
    res.json(todoItem);
  } catch (error) {
    next(error);
  }
});

// Delete a todo item
app.delete('/todos/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    validateUuid(id);

    await todoService.deleteTodo(id);
    res.json({ message: `Todo with id ${id} deleted successfully` });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Error handling request', { error: err });

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: {
        message: err.message,
        name: err.name
      }
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message,
        name: err.name
      }
    });
  }

  if (err instanceof AppError) {
    return res.status(500).json({
      success: false,
      error: {
        message: err.message,
        name: err.name
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      name: 'InternalServerError'
    }
  });
});

// Start the server
async function startServer(): Promise<void> {
  try {
    // Initialize the SQLite database
    await storage.initialize();

    // Start listening for requests
    app.listen(port, () => {
      logger.info(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle server shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');

  try {
    // Close the SQLite database connection
    await storage.close();
    logger.info('Server shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during server shutdown', { error });
    process.exit(1);
  }
});

// Start the server
startServer();
