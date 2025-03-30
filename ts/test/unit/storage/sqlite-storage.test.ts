import * as fs from 'fs';
import * as path from 'path';
import { SQLiteStorage } from '../../../src/storage/sqlite-storage';
import { TodoItem, Status, createTodoItem } from '../../../src/core/types';
import { NotFoundError, StorageError } from '../../../src/core/errors';

describe('SQLiteStorage', () => {
  let sqliteStorage: SQLiteStorage;
  // Use in-memory database for tests
  const testDbPath = ':memory:';
  
  // Test data
  const createTestTodo = (): TodoItem => {
    return createTodoItem({
      title: 'Test Todo',
      description: 'This is a test todo item'
    });
  };
  
  beforeEach(async () => {
    // Create and initialize a fresh SQLiteStorage instance for each test
    sqliteStorage = new SQLiteStorage(testDbPath);
    await sqliteStorage.initialize();
  });
  
  afterEach(async () => {
    // Close the database connection after each test
    await sqliteStorage.clear();
    await sqliteStorage.close();
  });
  
  describe('initialize', () => {
    it('should create the database and the todos table', async () => {
      // Arrange
      await sqliteStorage.close();
      // Delete the database file to ensure we're testing creation
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      
      // Act
      await sqliteStorage.initialize();
      
      // Assert - if no error was thrown, the initialization was successful
      // We can validate by adding and retrieving a todo
      const todoItem = createTestTodo();
      await sqliteStorage.createTodo(todoItem);
      const retrievedTodo = await sqliteStorage.getTodo(todoItem.id);
      expect(retrievedTodo).toBeDefined();
      expect(retrievedTodo?.id).toBe(todoItem.id);
    });
  });
  
  describe('createTodo', () => {
    it('should add a todo item to the database and return it', async () => {
      // Arrange
      const todoItem = createTestTodo();
      
      // Act
      const result = await sqliteStorage.createTodo(todoItem);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(todoItem.id);
      expect(result.title).toBe(todoItem.title);
      expect(result.description).toBe(todoItem.description);
      expect(result.status).toBe(todoItem.status);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      
      // Verify that the item is in the database
      const retrievedTodo = await sqliteStorage.getTodo(todoItem.id);
      expect(retrievedTodo).toBeDefined();
      expect(retrievedTodo?.id).toBe(todoItem.id);
    });
  });
  
  describe('getTodo', () => {
    it('should return the todo item with the given ID', async () => {
      // Arrange
      const todoItem = createTestTodo();
      await sqliteStorage.createTodo(todoItem);
      
      // Act
      const result = await sqliteStorage.getTodo(todoItem.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(todoItem.id);
      expect(result?.title).toBe(todoItem.title);
      expect(result?.description).toBe(todoItem.description);
      expect(result?.status).toBe(todoItem.status);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });
    
    it('should return null if no todo item with the given ID exists', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // Act
      const result = await sqliteStorage.getTodo(nonExistentId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('listTodos', () => {
    it('should return an empty array when no todo items exist', async () => {
      // Act
      const result = await sqliteStorage.listTodos();
      
      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    
    it('should return all todo items', async () => {
      // Arrange
      const todo1 = createTestTodo();
      const todo2 = createTestTodo();
      const todo3 = createTestTodo();
      
      await sqliteStorage.createTodo(todo1);
      await sqliteStorage.createTodo(todo2);
      await sqliteStorage.createTodo(todo3);
      
      // Act
      const result = await sqliteStorage.listTodos();
      
      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result.map(todo => todo.id)).toContain(todo1.id);
      expect(result.map(todo => todo.id)).toContain(todo2.id);
      expect(result.map(todo => todo.id)).toContain(todo3.id);
    });
  });
  
  describe('updateTodo', () => {
    it('should update the todo item and return it', async () => {
      // Arrange
      const todoItem = createTestTodo();
      await sqliteStorage.createTodo(todoItem);
      
      // Update the todo item
      const updatedItem: TodoItem = {
        ...todoItem,
        title: 'Updated Title',
        status: Status.IN_PROGRESS,
        updatedAt: new Date()
      };
      
      // Act
      const result = await sqliteStorage.updateTodo(updatedItem);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(todoItem.id);
      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe(Status.IN_PROGRESS);
      
      // Verify that the item was updated in the database
      const retrievedTodo = await sqliteStorage.getTodo(todoItem.id);
      expect(retrievedTodo?.title).toBe('Updated Title');
      expect(retrievedTodo?.status).toBe(Status.IN_PROGRESS);
    });
    
    it('should throw NotFoundError if no todo item with the given ID exists', async () => {
      // Arrange
      const nonExistentTodo: TodoItem = {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Non-existent Todo',
        description: 'This todo does not exist',
        status: Status.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Act & Assert
      await expect(sqliteStorage.updateTodo(nonExistentTodo))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('deleteTodo', () => {
    it('should delete the todo item with the given ID', async () => {
      // Arrange
      const todoItem = createTestTodo();
      await sqliteStorage.createTodo(todoItem);
      
      // Act
      await sqliteStorage.deleteTodo(todoItem.id);
      
      // Assert
      const result = await sqliteStorage.getTodo(todoItem.id);
      expect(result).toBeNull();
    });
    
    it('should throw NotFoundError if no todo item with the given ID exists', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // Act & Assert
      await expect(sqliteStorage.deleteTodo(nonExistentId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('clear', () => {
    it('should remove all todo items from the database', async () => {
      // Arrange
      const todo1 = createTestTodo();
      const todo2 = createTestTodo();
      const todo3 = createTestTodo();
      
      await sqliteStorage.createTodo(todo1);
      await sqliteStorage.createTodo(todo2);
      await sqliteStorage.createTodo(todo3);
      
      // Confirm that the todos were added
      const beforeClear = await sqliteStorage.listTodos();
      expect(beforeClear.length).toBe(3);
      
      // Act
      await sqliteStorage.clear();
      
      // Assert
      const afterClear = await sqliteStorage.listTodos();
      expect(afterClear.length).toBe(0);
    });
  });
  
  describe('close', () => {
    it('should close the database connection gracefully', async () => {
      // Skip the afterEach cleanup for this test
      jest.spyOn(sqliteStorage, 'clear').mockResolvedValue();
      
      // Act
      await sqliteStorage.close();
      
      // Assert - if no error was thrown, the close was successful
      // We can validate by trying to perform an operation, which should fail
      await expect(sqliteStorage.listTodos())
        .rejects
        .toThrow(StorageError);
    });
  });
});
