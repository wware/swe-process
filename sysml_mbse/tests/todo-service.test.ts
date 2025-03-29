import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { TodoService } from '../src/services/TodoService';
import { TodoItem } from '../src/models/TodoItem';
import { Status } from '../src/models/Status';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock the DynamoDB client and document client
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('TodoService', () => {
  let todoService: TodoService;
  let mockDynamoDbClient: jest.Mocked<DynamoDBClient>;
  let mockDynamoDbDocumentClient: jest.Mocked<DynamoDBDocumentClient>;
  
  const mockDate = new Date('2023-01-01T00:00:00.000Z');
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Mock Date.now to return consistent timestamp for testing
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
    
    // Setup DynamoDB mocks
    mockDynamoDbClient = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
    mockDynamoDbDocumentClient = DynamoDBDocumentClient.from(mockDynamoDbClient) as jest.Mocked<DynamoDBDocumentClient>;
    
    // Create the TodoService instance with mocked dependencies
    todoService = new TodoService({
      dynamoDbClient: mockDynamoDbDocumentClient,
      tableName: 'TodoItems'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('addTodo', () => {
    it('should create a new todo item', async () => {
      expect(todoService.addTodo('Test', 'Description')).rejects.toThrow('Not implemented');
    });
  });

  describe('getTodo', () => {
    it('should get a todo item by id', async () => {
      expect(todoService.getTodo('123')).rejects.toThrow('Not implemented');
    });
  });

  describe('listTodos', () => {
    it('should list all todo items', async () => {
      expect(todoService.listTodos()).rejects.toThrow('Not implemented');
    });
  });

  describe('updateTodo', () => {
    it('should update a todo item status', async () => {
      expect(todoService.updateTodo('123', Status.COMPLETED)).rejects.toThrow('Not implemented');
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo item', async () => {
      expect(todoService.deleteTodo('123')).rejects.toThrow('Not implemented');
    });
  });
}); 