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
import { Status } from '../core/types';
import { validateTodoTitle, validateTodoDescription, validateUuid } from '../utils/validation';
import { logger } from '../utils/logging';

// Create a DynamoDB storage instance for production
const dynamoConfig = (config as any).aws?.dynamoDb;
const storage = new DynamoStorage(
  dynamoConfig?.tableName || 'todos',
  (config as any).aws?.region || 'us-east-1'
);

// Create a TodoService instance using the DynamoDB storage
const todoService = new TodoService(storage);

/**
 * Handler for creating a new todo item
 */
export const createTodoHandler = withErrorHandling(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
export const getTodoHandler = withErrorHandling(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Get the todo ID from the path parameters
  const id = getPathParameter(event, 'id');
  
  // Validate the todo ID
  validateUuid(id);
  
  // Get the todo item
  const todoItem = await todoService.getTodo(id);
  
  // Return a success response
  return createSuccessResponse(todoItem);
});

/**
 * Handler for listing all todo items
 */
export const listTodosHandler = withErrorHandling(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // List all todo items
  const todoItems = await todoService.listTodos();
  
  // Return a success response
  return createSuccessResponse(todoItems);
});

/**
 * Handler for updating a todo item
 */
export const updateTodoHandler = withErrorHandling(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Get the todo ID from the path parameters
  const id = getPathParameter(event, 'id');
  
  // Validate the todo ID
  validateUuid(id);
  
  // Parse the request body
  const requestBody = parseRequestBody<{ status: string }>(event);
  
  if (!requestBody) {
    return createErrorResponse(new Error('Missing request body'), 400);
  }
  
  const { status } = requestBody;
  
  // Validate the status
  if (!Object.values(Status).includes(status as Status)) {
    return createErrorResponse(
      new Error(`Invalid status: ${status}. Valid values are: ${Object.values(Status).join(', ')}`), 
      400
    );
  }
  
  // Update the todo item
  const todoItem = await todoService.updateTodo(id, status);
  
  // Return a success response
  return createSuccessResponse(todoItem);
});

/**
 * Handler for deleting a todo item
 */
export const deleteTodoHandler = withErrorHandling(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
export const rootHandler = withErrorHandling(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return createSuccessResponse({ 
    message: 'Todo API is running',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/todos', description: 'List all todo items' },
      { method: 'POST', path: '/todos', description: 'Create a new todo item' },
      { method: 'GET', path: '/todos/{id}', description: 'Get a todo item by ID' },
      { method: 'PUT', path: '/todos/{id}', description: 'Update a todo item' },
      { method: 'DELETE', path: '/todos/{id}', description: 'Delete a todo item' }
    ]
  });
});
