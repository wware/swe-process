import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  createTodoHandler, 
  getTodoHandler, 
  listTodosHandler, 
  updateTodoHandler, 
  deleteTodoHandler 
} from '../../src/lambda/handlers';
import { Status } from '../../src/core/types';

// Mock the DynamoDB client and storage
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('../../src/storage/dynamo-storage');

describe('Lambda Integration Test', () => {
  // Shared test data
  const testTitle = 'Lambda Test Todo';
  const testDescription = 'This is a lambda test todo item';
  let createdTodoId: string;
  
  // Helper function to create API Gateway events
  const createEvent = (
    path: string,
    method: string,
    pathParams: Record<string, string> = {},
    body: any = null
  ): APIGatewayProxyEvent => {
    return {
      path,
      httpMethod: method,
      pathParameters: pathParams,
      queryStringParameters: null,
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      body: body ? JSON.stringify(body) : null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    } as APIGatewayProxyEvent;
  };
  
  // Helper function to parse the response body
  const parseResponseBody = (response: APIGatewayProxyResult): any => {
    return JSON.parse(response.body);
  };
  
  beforeAll(() => {
    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.DYNAMODB_TABLE = 'test-todos';
    process.env.AWS_REGION = 'us-east-1';
  });
  
  it('should handle a complete CRUD lifecycle', async () => {
    // 1. Initially, there should be no todo items
    const listEvent = createEvent('/todos', 'GET');
    const initialListResponse = await listTodosHandler(listEvent);
    expect(initialListResponse.statusCode).toBe(200);
    
    const initialListBody = parseResponseBody(initialListResponse);
    expect(initialListBody.success).toBe(true);
    expect(initialListBody.data).toBeInstanceOf(Array);
    
    // 2. Create a new todo item
    const createEvent = createEvent('/todos', 'POST', {}, {
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
    const getEvent = createEvent(`/todos/${createdTodoId}`, 'GET', { id: createdTodoId });
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
    const listAfterCreateEvent = createEvent('/todos', 'GET');
    const listAfterCreateResponse = await listTodosHandler(listAfterCreateEvent);
    expect(listAfterCreateResponse.statusCode).toBe(200);
    
    const listAfterCreateBody = parseResponseBody(listAfterCreateResponse);
    expect(listAfterCreateBody.success).toBe(true);
    expect(listAfterCreateBody.data).toBeInstanceOf(Array);
    expect(listAfterCreateBody.data.length).toBeGreaterThan(0);
    expect(listAfterCreateBody.data.some((todo: any) => todo.id === createdTodoId)).toBe(true);
    
    // 5. Update the todo item
    const updateEvent = createEvent(`/todos/${createdTodoId}`, 'PUT', { id: createdTodoId }, {
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
    const deleteEvent = createEvent(`/todos/${createdTodoId}`, 'DELETE', { id: createdTodoId });
    const deleteResponse = await deleteTodoHandler(deleteEvent);
    expect(deleteResponse.statusCode).toBe(200);
    
    const deleteBody = parseResponseBody(deleteResponse);
    expect(deleteBody.success).toBe(true);
    expect(deleteBody.data).toBeDefined();
    expect(deleteBody.data.message).toContain(createdTodoId);
  });
  
  it('should handle validation errors correctly', async () => {
    // 1. Attempt to create a todo item with an empty title
    const createEmptyTitleEvent = createEvent('/todos', 'POST', {}, {
      title: '',
      description: testDescription
    });
    const createEmptyTitleResponse = await createTodoHandler(createEmptyTitleEvent);
    expect(createEmptyTitleResponse.statusCode).toBe(400);
    
    const createEmptyTitleBody = parseResponseBody(createEmptyTitleResponse);
    expect(createEmptyTitleBody.success).toBe(false);
    expect(createEmptyTitleBody.error).toBeDefined();
    
    // 2. Attempt to create a todo item with an empty description
    const createEmptyDescriptionEvent = createEvent('/todos', 'POST', {}, {
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
    const createLongTitleEvent = createEvent('/todos', 'POST', {}, {
      title: longTitle,
      description: testDescription
    });
    const createLongTitleResponse = await createTodoHandler(createLongTitleEvent);
    expect(createLongTitleResponse.statusCode).toBe(400);
    
    const createLongTitleBody = parseResponseBody(createLongTitleResponse);
    expect(createLongTitleBody.success).toBe(false);
    expect(createLongTitleBody.error).toBeDefined();
    
    // 4. Attempt to update a todo item with an invalid status
    const invalidStatusEvent = createEvent('/todos/00000000-0000-0000-0000-000000000000', 'PUT', 
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
    // 1. Attempt to retrieve a non-existent todo item
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const getNonExistentEvent = createEvent(`/todos/${nonExistentId}`, 'GET', { id: nonExistentId });
    const getNonExistentResponse = await getTodoHandler(getNonExistentEvent);
    expect(getNonExistentResponse.statusCode).toBe(404);
    
    const getNonExistentBody = parseResponseBody(getNonExistentResponse);
    expect(getNonExistentBody.success).toBe(false);
    expect(getNonExistentBody.error).toBeDefined();
    
    // 2. Attempt to update a non-existent todo item
    const updateNonExistentEvent = createEvent(`/todos/${nonExistentId}`, 'PUT', 
      { id: nonExistentId }, 
      { status: Status.IN_PROGRESS }
    );
    const updateNonExistentResponse = await updateTodoHandler(updateNonExistentEvent);
    expect(updateNonExistentResponse.statusCode).toBe(404);
    
    const updateNonExistentBody = parseResponseBody(updateNonExistentResponse);
    expect(updateNonExistentBody.success).toBe(false);
    expect(updateNonExistentBody.error).toBeDefined();
    
    // 3. Attempt to delete a non-existent todo item
    const deleteNonExistentEvent = createEvent(`/todos/${nonExistentId}`, 'DELETE', { id: nonExistentId });
    const deleteNonExistentResponse = await deleteTodoHandler(deleteNonExistentEvent);
    expect(deleteNonExistentResponse.statusCode).toBe(404);
    
    const deleteNonExistentBody = parseResponseBody(deleteNonExistentResponse);
    expect(deleteNonExistentBody.success).toBe(false);
    expect(deleteNonExistentBody.error).toBeDefined();
  });
  
  it('should handle missing or invalid request body', async () => {
    // 1. Attempt to create a todo item with a missing request body
    const createNoBodyEvent = createEvent('/todos', 'POST');
    const createNoBodyResponse = await createTodoHandler(createNoBodyEvent);
    expect(createNoBodyResponse.statusCode).toBe(400);
    
    const createNoBodyResponseBody = parseResponseBody(createNoBodyResponse);
    expect(createNoBodyResponseBody.success).toBe(false);
    expect(createNoBodyResponseBody.error).toBeDefined();
    
    // 2. Attempt to update a todo item with a missing request body
    const updateNoBodyEvent = createEvent('/todos/00000000-0000-0000-0000-000000000000', 'PUT', 
      { id: '00000000-0000-0000-0000-000000000000' }
    );
    const updateNoBodyResponse = await updateTodoHandler(updateNoBodyEvent);
    expect(updateNoBodyResponse.statusCode).toBe(400);
    
    const updateNoBodyResponseBody = parseResponseBody(updateNoBodyResponse);
    expect(updateNoBodyResponseBody.success).toBe(false);
    expect(updateNoBodyResponseBody.error).toBeDefined();
  });
});
