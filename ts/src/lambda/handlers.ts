import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TodoService } from '../services/todo-service';
import { DynamoStorage } from '../storage/dynamo-storage';
import { config } from '../config/config';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  parseRequestBody, 
  getPathParameter, 
  withErrorHandling
} from './api-gateway';
import { Status, TodoItemUpdates } from '../core/types';
import { validateTodoTitle, validateTodoDescription, validateUuid } from '../utils/validation';
import { logger } from '../utils/logging';
import { NotFoundError, ValidationError } from '../core/errors';
import { MemoryStorage } from '../storage/memory-storage';

// Create a DynamoDB storage instance for production
const dynamoConfig = (config as any).aws?.dynamoDb;
const storage = new DynamoStorage(
  dynamoConfig?.tableName || 'todos',
  (config as any).aws?.region || 'us-east-1'
);

// Create a TodoService instance using the DynamoDB storage
const todoService = new TodoService(storage);

// Initialize the service with a storage implementation
export let todoServiceMemory = new TodoService(new MemoryStorage());

// Error handling wrapper with debugging
const errorHandler = (handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const result = await handler(event);
      console.log('Handler result:', result);
      return result;
    } catch (err) {
      // Type guard for Error objects
      const error = err as Error;
      console.error('Error handling request:', error);
      console.error('Stack trace:', error.stack);

      if (error instanceof NotFoundError) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            error: error.message
          })
        };
      }

      if (error instanceof ValidationError) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: error.message
          })
        };
      }

      // Default error response with more details in development
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? {
            message: error.message,
            stack: error.stack
          } : undefined
        })
      };
    }
  };
};

/**
 * Handler for creating a new todo item
 */
export const createTodoHandler = errorHandler(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Parse the request body
  const requestBody = parseRequestBody<{ title: string; description: string }>(event);
  
  if (!requestBody) {
    return createErrorResponse(new Error('Missing request body'), 400);
  }
  
  const { title, description } = requestBody;
  
  // Validate the request body
  validateTodoTitle(title);
  validateTodoDescription(description);
  
  // Create the todo item
  const todoItem = await todoService.addTodo(title, description);
  
  // Return a success response
  return createSuccessResponse(todoItem, 201);
});

/**
 * Handler for retrieving a todo item by its ID
 */
export const getTodoHandler = errorHandler(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  if (!id) {
    throw new ValidationError('Todo ID is required');
  }

  const todo = await todoService.getTodo(id);
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: todo
    })
  };
});

/**
 * Handler for listing all todo items
 */
export const listTodosHandler = errorHandler(async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Listing todos...');
  console.log('Storage state:', storage); // Debug log
  const todos = await todoService.listTodos();
  console.log('Got todos:', todos);
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: todos
    })
  };
});

/**
 * Handler for updating a todo item
 */
export const updateTodoHandler = errorHandler(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = getPathParameter(event, 'id');
  validateUuid(id);
  
  const updates = parseRequestBody<TodoItemUpdates>(event);
  if (!updates) {
    throw new ValidationError('Missing request body');
  }
  
  // Validate updates if present
  if (updates.title) {
    validateTodoTitle(updates.title);
  }
  if (updates.description) {
    validateTodoDescription(updates.description);
  }
  if (updates.status && !Object.values(Status).includes(updates.status)) {
    throw new ValidationError(
      `Invalid status: ${updates.status}. Valid values are: ${Object.values(Status).join(', ')}`
    );
  }
  
  const todoItem = await todoService.updateTodo(id, updates);
  return createSuccessResponse(todoItem);
});

/**
 * Handler for deleting a todo item
 */
export const deleteTodoHandler = errorHandler(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Get the todo ID from the path parameters
  const id = getPathParameter(event, 'id');
  
  // Validate the todo ID
  validateUuid(id);
  
  // Delete the todo item
  await todoService.deleteTodo(id);
  
  // Return a success response
  return createSuccessResponse({ message: `Todo with id ${id} deleted successfully` });
});

/**
 * Handler for the root path
 */
export const rootHandler = errorHandler(async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Todo API is running' })
  };
});
