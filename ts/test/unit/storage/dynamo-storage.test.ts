import { 
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoStorage } from '../../../src/storage/dynamo-storage';
import { TodoItem, Status, createTodoItem } from '../../../src/core/types';
import { NotFoundError, StorageError } from '../../../src/core/errors';
import { formatIsoDate } from '../../../src/utils/date-utils';

// Mock the DynamoDBClient
jest.mock('@aws-sdk/client-dynamodb');

describe('DynamoStorage', () => {
  let dynamoStorage: DynamoStorage;
  const testTableName = 'test-todos';
  const testRegion = 'us-east-1';
  
  // Test data
  const createTestTodo = (): TodoItem => {
    return createTodoItem({
      title: 'Test Todo',
      description: 'This is a test todo item'
    });
  };
  
  // Mock implementations
  const mockSend = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockSend.mockReset();
    
    // Setup mock implementation for DynamoDBClient
    (DynamoDBClient as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }));
    
    // Create a fresh DynamoStorage instance for each test
    dynamoStorage = new DynamoStorage(testTableName, testRegion);
  });
  
  describe('constructor', () => {
    it('should create a DynamoDBClient with the provided region', () => {
      // Assert
      expect(DynamoDBClient).toHaveBeenCalledWith({ region: testRegion });
    });
  });
  
  describe('createTodo', () => {
    it('should create a PutItemCommand with the correct parameters and return the todo item', async () => {
      // Arrange
      const todoItem = createTestTodo();
      
      // Setup mock implementation
      mockSend.mockResolvedValueOnce({});
      
      // Act
      const result = await dynamoStorage.createTodo(todoItem);
      
      // Assert
      expect(PutItemCommand).toHaveBeenCalledWith({
        TableName: testTableName,
        Item: expect.any(Object)
      });
      
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutItemCommand));
      
      expect(result).toEqual(todoItem);
    });
    
    it('should throw StorageError if the DynamoDB operation fails', async () => {
      // Arrange
      const todoItem = createTestTodo();
      const mockError = new Error('DynamoDB error');
      
      // Setup mock implementation
      mockSend.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(dynamoStorage.createTodo(todoItem))
        .rejects
        .toThrow(StorageError);
    });
  });
  
  describe('getTodo', () => {
    it('should create a GetItemCommand with the correct parameters and return the todo item if found', async () => {
      // Arrange
      const todoItem = createTestTodo();
      
      // Setup mock implementation
      mockSend.mockResolvedValueOnce({
        Item: marshall({
          id: todoItem.id,
          title: todoItem.title,
          description: todoItem.description,
          status: todoItem.status,
          created_at: formatIsoDate(todoItem.createdAt),
          updated_at: formatIsoDate(todoItem.updatedAt)
        })
      });
      
      // Act
      const result = await dynamoStorage.getTodo(todoItem.id);
      
      // Assert
      expect(GetItemCommand).toHaveBeenCalledWith({
        TableName: testTableName,
        Key: expect.any(Object)
      });
      
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(GetItemCommand));
      
      expect(result).toEqual(expect.objectContaining({
        id: todoItem.id,
        title: todoItem.title,
        description: todoItem.description,
        status: todoItem.status
      }));
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
    
    it('should return null if the todo item is not found', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // Setup mock implementation
      mockSend.mockResolvedValueOnce({});
      
      // Act
      const result = await dynamoStorage.getTodo(nonExistentId);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should throw StorageError if the DynamoDB operation fails', async () => {
      // Arrange
      const todoItem = createTestTodo();
      const mockError = new Error('DynamoDB error');
      
      // Setup mock implementation
      mockSend.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(dynamoStorage.getTodo(todoItem.id))
        .rejects
        .toThrow(StorageError);
    });
  });
  
  describe('listTodos', () => {
    it('should create a ScanCommand with the correct parameters and return all todo items', async () => {
      // Arrange
      const todoItem1 = createTestTodo();
      const todoItem2 = createTestTodo();
      
      // Setup mock implementation
      mockSend.mockResolvedValueOnce({
        Items: [
          marshall({
            id: todoItem1.id,
            title: todoItem1.title,
            description: todoItem1.description,
            status: todoItem1.status,
            created_at: formatIsoDate(todoItem1.createdAt),
            updated_at: formatIsoDate(todoItem1.updatedAt)
          }),
          marshall({
            id: todoItem2.id,
            title: todoItem2.title,
            description: todoItem2.description,
            status: todoItem2.status,
            created_at: formatIsoDate(todoItem2.createdAt),
            updated_at: formatIsoDate(todoItem2.updatedAt)
          })
        ]
      });
      
      // Act
      const result = await dynamoStorage.listTodos();
      
      // Assert
      expect(ScanCommand).toHaveBeenCalledWith({
        TableName: testTableName
      });
      
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(ScanCommand));
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: todoItem1.id,
        title: todoItem1.title,
        description: todoItem1.description,
        status: todoItem1.status
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        id: todoItem2.id,
        title: todoItem2.title,
        description: todoItem2.description,
        status: todoItem2.status
      }));
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
      expect(result[1].createdAt).toBeInstanceOf(Date);
      expect(result[1].updatedAt).toBeInstanceOf(Date);
    });
    
    it('should return an empty array if no todo items are found', async () => {
      // Setup mock implementation
      mockSend.mockResolvedValueOnce({});
      
      // Act
      const result = await dynamoStorage.listTodos();
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should throw StorageError if the DynamoDB operation fails', async () => {
      // Arrange
      const mockError = new Error('DynamoDB error');
      
      // Setup mock implementation
      mockSend.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(dynamoStorage.listTodos())
        .rejects
        .toThrow(StorageError);
    });
  });
  
  describe('updateTodo', () => {
    it('should check if the todo item exists and create an UpdateItemCommand with the correct parameters', async () => {
      // Arrange
      const todoItem = createTestTodo();
      
      // Setup mock implementations
      // First call to getTodo
      mockSend.mockResolvedValueOnce({
        Item: marshall({
          id: todoItem.id,
          title: todoItem.title,
          description: todoItem.description,
          status: todoItem.status,
          created_at: formatIsoDate(todoItem.createdAt),
          updated_at: formatIsoDate(todoItem.updatedAt)
        })
      });
      
      // Second call to updateTodo
      mockSend.mockResolvedValueOnce({});
      
      // Update the todo item
      const updatedItem: TodoItem = {
        ...todoItem,
        title: 'Updated Title',
        status: Status.IN_PROGRESS,
        updatedAt: new Date()
      };
      
      // Act
      const result = await dynamoStorage.updateTodo(updatedItem);
      
      // Assert
      expect(GetItemCommand).toHaveBeenCalledWith({
        TableName: testTableName,
        Key: expect.any(Object)
      });
      
      expect(UpdateItemCommand).toHaveBeenCalledWith({
        TableName: testTableName,
        Key: expect.any(Object),
        UpdateExpression: 'SET title = :title, description = :description, #status = :status, updated_at = :updated_at',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: expect.any(Object),
        ReturnValues: 'ALL_NEW'
      });
      
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(GetItemCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(UpdateItemCommand));
      
      expect(result).toEqual(updatedItem);
    });
    
    it('should throw NotFoundError if the todo item does not exist', async () => {
      // Arrange
      const todoItem = createTestTodo();
      
      // Setup mock implementation
      mockSend.mockResolvedValueOnce({});
      
      // Act & Assert
      await expect(dynamoStorage.updateTodo(todoItem))
        .rejects
        .toThrow(NotFoundError);
    });
    
    it('should throw StorageError if the DynamoDB operation fails', async () => {
      // Arrange
      const todoItem = createTestTodo();
      const mockError = new Error('DynamoDB error');
      
      // Setup mock implementation
      mockSend.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(dynamoStorage.updateTodo(todoItem))
        .rejects
        .toThrow(StorageError);
    });
  });
  
  describe('deleteTodo', () => {
    it('should check if the todo item exists and create a DeleteItemCommand with the correct parameters', async () => {
      // Arrange
      const todoItem = createTestTodo();
      
      // Setup mock implementations
      // First call to getTodo
      mockSend.mockResolvedValueOnce({
        Item: marshall({
          id: todoItem.id,
          title: todoItem.title,
          description: todoItem.description,
          status: todoItem.status,
          created_at: formatIsoDate(todoItem.createdAt),
          updated_at: formatIsoDate(todoItem.updatedAt)
        })
      });
      
      // Second call to deleteTodo
      mockSend.mockResolvedValueOnce({});
      
      // Act
      await dynamoStorage.deleteTodo(todoItem.id);
      
      // Assert
      expect(GetItemCommand).toHaveBeenCalledWith({
        TableName: testTableName,
        Key: expect.any(Object)
      });
      
      expect(DeleteItemCommand).toHaveBeenCalledWith({
        TableName: testTableName,
        Key: expect.any(Object)
      });
      
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.any(GetItemCommand));
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.any(DeleteItemCommand));
    });
    
    it('should throw NotFoundError if the todo item does not exist', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // Setup mock implementation
      mockSend.mockResolvedValueOnce({});
      
      // Act & Assert
      await expect(dynamoStorage.deleteTodo(nonExistentId))
        .rejects
        .toThrow(NotFoundError);
    });
    
    it('should throw StorageError if the DynamoDB operation fails', async () => {
      // Arrange
      const todoItem = createTestTodo();
      const mockError = new Error('DynamoDB error');
      
      // Setup mock implementation
      mockSend.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(dynamoStorage.deleteTodo(todoItem.id))
        .rejects
        .toThrow(StorageError);
    });
  });
});
