import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  createTodoHandler, 
  getTodoHandler, 
  listTodosHandler, 
  updateTodoHandler, 
  deleteTodoHandler 
} from '../../src/lambda/handlers';
import { Status } from '../../src/core/types';
import { TodoService } from '../../src/services/todo-service';
import { MemoryStorage } from '../../src/storage/memory-storage';
import * as handlers from '../../src/lambda/handlers';

// Mock the DynamoDB client and storage
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('../../src/storage/dynamo-storage');

// Helper function to create API Gateway events
function createApiGatewayEvent(path: string, method: string, queryParams = {}, body = {}): APIGatewayProxyEvent {
  return {
    path,
    httpMethod: method,
    queryStringParameters: queryParams,
    multiValueQueryStringParameters: null,
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      authorizer: null,
      protocol: 'HTTP/1.1',
      httpMethod: method,
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'jest-test',
        userArn: null
      },
      path,
      stage: 'test',
      requestId: 'test-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource',
      resourcePath: path
    },
    resource: path
  };
}

describe('Lambda Integration Test', () => {
  let storage: MemoryStorage;
  let service: TodoService;

  beforeEach(() => {
    // Create fresh instances for each test
    storage = new MemoryStorage();
    service = new TodoService(storage);
    
    // Replace the service in the handlers module
    const handlersModule = require('../../src/lambda/handlers');
    Object.defineProperty(handlersModule, 'todoService', {
      value: service,
      writable: true,
      configurable: true
    });
  });

  // Shared test data
  const testTitle = 'Lambda Test Todo';
  const testDescription = 'This is a lambda test todo item';
  let createdTodoId: string;
  
  // Helper function to parse the response body
  const parseResponseBody = (response: APIGatewayProxyResult): any => {
    return JSON.parse(response.body);
  };
  
  // Helper to check if status code is a 4xx error
  const isClientError = (statusCode: number) => Math.floor(statusCode / 100) === 4;
  
  beforeAll(() => {
    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.DYNAMODB_TABLE = 'test-todos';
    process.env.AWS_REGION = 'us-east-1';
  });
  
  it('should handle a complete CRUD lifecycle', async () => {
    // 1. Initially, there should be no todo items
    const listEvent = createApiGatewayEvent('/todos', 'GET');
    const initialListResponse = await listTodosHandler(listEvent);
    expect(initialListResponse.statusCode).toBe(200);
    
    const initialListBody = parseResponseBody(initialListResponse);
    expect(initialListBody.success).toBe(true);
    expect(initialListBody.data).toBeInstanceOf(Array);
    
    // 2. Create a new todo item
    const createEvent = createApiGatewayEvent('/todos', 'POST', {}, {
      title: testTitle,
      description: testDescription
    });
    const createResponse = await createTodoHandler(createEvent);
    expect(createResponse.statusCode).toBe(201);
    
    const createBody = parseResponseBody(createResponse);
    expect(createBody.success).toBe(true);
    expect(createBody.data).toBeDefined();
    expect(createBody.data.id).toBeDefined();
    expect(createBody.data.title).toBe(testTitle);
    expect(createBody.data.description).toBe(testDescription);
    expect(createBody.data.status).toBe(Status.PENDING);
    
    // Store the created todo ID for later use
    createdTodoId = createBody.data.id;
    
    // 3. Retrieve the todo item by ID
    const getEvent = createApiGatewayEvent(`/todos/${createdTodoId}`, 'GET', { id: createdTodoId });
    const getResponse = await getTodoHandler(getEvent);
    expect(getResponse.statusCode).toBe(200);
    
    const getBody = parseResponseBody(getResponse);
    expect(getBody.success).toBe(true);
    expect(getBody.data).toBeDefined();
    expect(getBody.data.id).toBe(createdTodoId);
    expect(getBody.data.title).toBe(testTitle);
    expect(getBody.data.description).toBe(testDescription);
    expect(getBody.data.status).toBe(Status.PENDING);
    
    // 4. List all todo items (should include the one we created)
    const listAfterCreateEvent = createApiGatewayEvent('/todos', 'GET');
    const listAfterCreateResponse = await listTodosHandler(listAfterCreateEvent);
    expect(listAfterCreateResponse.statusCode).toBe(200);
    
    const listAfterCreateBody = parseResponseBody(listAfterCreateResponse);
    expect(listAfterCreateBody.success).toBe(true);
    expect(listAfterCreateBody.data).toBeInstanceOf(Array);
    expect(listAfterCreateBody.data.length).toBeGreaterThan(0);
    expect(listAfterCreateBody.data.some((todo: any) => todo.id === createdTodoId)).toBe(true);
    
    // 5. Update the todo item
    const updateEvent = createApiGatewayEvent(`/todos/${createdTodoId}`, 'PUT', { id: createdTodoId }, {
      status: Status.IN_PROGRESS
    });
    const updateResponse = await updateTodoHandler(updateEvent);
    expect(updateResponse.statusCode).toBe(200);
    
    const updateBody = parseResponseBody(updateResponse);
    expect(updateBody.success).toBe(true);
    expect(updateBody.data).toBeDefined();
    expect(updateBody.data.id).toBe(createdTodoId);
    expect(updateBody.data.title).toBe(testTitle);
    expect(updateBody.data.description).toBe(testDescription);
    expect(updateBody.data.status).toBe(Status.IN_PROGRESS);
    
    // 6. Delete the todo item
    const deleteEvent = createApiGatewayEvent(`/todos/${createdTodoId}`, 'DELETE', { id: createdTodoId });
    const deleteResponse = await deleteTodoHandler(deleteEvent);
    expect(deleteResponse.statusCode).toBe(200);
    
    const deleteBody = parseResponseBody(deleteResponse);
    expect(deleteBody.success).toBe(true);
    expect(deleteBody.data).toBeDefined();
    expect(deleteBody.data.message).toContain(createdTodoId);
  });
  
  it('should handle validation errors correctly', async () => {
    // 1. Attempt to create a todo item with an empty title
    const createEmptyTitleEvent = createApiGatewayEvent('/todos', 'POST', {}, {
      title: '',
      description: testDescription
    });
    const createEmptyTitleResponse = await createTodoHandler(createEmptyTitleEvent);
    expect(createEmptyTitleResponse.statusCode).toBe(400);
    
    const createEmptyTitleBody = parseResponseBody(createEmptyTitleResponse);
    expect(createEmptyTitleBody.success).toBe(false);
    expect(createEmptyTitleBody.error).toBeDefined();
    
    // 2. Attempt to create a todo item with an empty description
    const createEmptyDescriptionEvent = createApiGatewayEvent('/todos', 'POST', {}, {
      title: testTitle,
      description: ''
    });
    const createEmptyDescriptionResponse = await createTodoHandler(createEmptyDescriptionEvent);
    expect(createEmptyDescriptionResponse.statusCode).toBe(400);
    
    const createEmptyDescriptionBody = parseResponseBody(createEmptyDescriptionResponse);
    expect(createEmptyDescriptionBody.success).toBe(false);
    expect(createEmptyDescriptionBody.error).toBeDefined();
    
    // 3. Attempt to create a todo item with a title that is too long
    const longTitle = 'A'.repeat(101); // 101 characters
    const createLongTitleEvent = createApiGatewayEvent('/todos', 'POST', {}, {
      title: longTitle,
      description: testDescription
    });
    const createLongTitleResponse = await createTodoHandler(createLongTitleEvent);
    expect(createLongTitleResponse.statusCode).toBe(400);
    
    const createLongTitleBody = parseResponseBody(createLongTitleResponse);
    expect(createLongTitleBody.success).toBe(false);
    expect(createLongTitleBody.error).toBeDefined();
    
    // 4. Attempt to update a todo item with an invalid status
    const invalidStatusEvent = createApiGatewayEvent('/todos/00000000-0000-0000-0000-000000000000', 'PUT', 
      { id: '00000000-0000-0000-0000-000000000000' }, 
      { status: 'INVALID_STATUS' }
    );
    const invalidStatusResponse = await updateTodoHandler(invalidStatusEvent);
    expect(invalidStatusResponse.statusCode).toBe(400);
    
    const invalidStatusBody = parseResponseBody(invalidStatusResponse);
    expect(invalidStatusBody.success).toBe(false);
    expect(invalidStatusBody.error).toBeDefined();
  });
  
  it('should handle not found errors correctly', async () => {
    // Arrange
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    
    // Act
    const getNonExistentEvent = createApiGatewayEvent(`/todos/${nonExistentId}`, 'GET', { id: nonExistentId });
    const getNonExistentResponse = await getTodoHandler(getNonExistentEvent);
    
    // Assert
    expect(isClientError(getNonExistentResponse.statusCode)).toBe(true);
    
    const getNonExistentBody = parseResponseBody(getNonExistentResponse);
    expect(getNonExistentBody.success).toBe(false);
    expect(getNonExistentBody.error).toBeTruthy();
  });
  
  it('should handle missing or invalid request body', async () => {
    // 1. Attempt to create a todo item with a missing request body
    const createNoBodyEvent = createApiGatewayEvent('/todos', 'POST');
    const createNoBodyResponse = await createTodoHandler(createNoBodyEvent);
    expect(createNoBodyResponse.statusCode).toBe(400);
    
    const createNoBodyResponseBody = parseResponseBody(createNoBodyResponse);
    expect(createNoBodyResponseBody.success).toBe(false);
    expect(createNoBodyResponseBody.error).toBeDefined();
    
    // 2. Attempt to update a todo item with a missing request body
    const updateNoBodyEvent = createApiGatewayEvent('/todos/00000000-0000-0000-0000-000000000000', 'PUT', 
      { id: '00000000-0000-0000-0000-000000000000' }
    );
    const updateNoBodyResponse = await updateTodoHandler(updateNoBodyEvent);
    expect(updateNoBodyResponse.statusCode).toBe(400);
    
    const updateNoBodyResponseBody = parseResponseBody(updateNoBodyResponse);
    expect(updateNoBodyResponseBody.success).toBe(false);
    expect(updateNoBodyResponseBody.error).toBeDefined();
  });
});
