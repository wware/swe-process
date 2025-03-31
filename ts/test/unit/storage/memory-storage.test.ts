import { MemoryStorage } from '../../../src/storage/memory-storage';
import { TodoItem, Status, createTodoItem } from '../../../src/core/types';
import { NotFoundError } from '../../../src/core/errors';
import { createTestTodo } from '../../test-utils';

describe('MemoryStorage', () => {
  let memoryStorage: MemoryStorage;
  
  // Test data
  const createTestTodo = (): TodoItem => {
    return createTodoItem({
      title: 'Test Todo',
      description: 'This is a test todo item'
    });
  };
  
  beforeEach(() => {
    // Create a fresh MemoryStorage instance for each test
    memoryStorage = new MemoryStorage();
  });
  
  afterEach(async () => {
    // Clear all todos from the storage after each test
    await memoryStorage.clear();
  });
  
  describe('createTodo', () => {
    it('should add a todo item to the storage and return it', async () => {
      // Arrange
      const todoItem = createTestTodo();
      
      // Act
      const result = await memoryStorage.createTodo(todoItem);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(todoItem.id);
      expect(result.title).toBe(todoItem.title);
      expect(result.description).toBe(todoItem.description);
      expect(result.status).toBe(todoItem.status);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
    
    it('should create a deep copy of the todo item to avoid unintended mutations', async () => {
      // Arrange
      const todoItem = createTestTodo();
      
      // Act
      const result = await memoryStorage.createTodo(todoItem);
      
      // Modify the original todo item
      todoItem.title = 'Modified Title';
      
      // Assert that the stored item was not affected
      const storedItem = await memoryStorage.getTodo(todoItem.id);
      expect(storedItem?.title).not.toBe(todoItem.title);
      expect(storedItem?.title).toBe('Test Todo');
    });
  });
  
  describe('getTodo', () => {
    it('should return the todo item with the given ID', async () => {
      // Arrange
      const todoItem = createTestTodo();
      await memoryStorage.createTodo(todoItem);
      
      // Act
      const result = await memoryStorage.getTodo(todoItem.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(todoItem.id);
      expect(result?.title).toBe(todoItem.title);
      expect(result?.description).toBe(todoItem.description);
      expect(result?.status).toBe(todoItem.status);
    });
    
    it('should return null if no todo item with the given ID exists', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // Act
      const result = await memoryStorage.getTodo(nonExistentId);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should return a deep copy of the todo item to avoid unintended mutations', async () => {
      // Arrange
      const todoItem = createTestTodo();
      await memoryStorage.createTodo(todoItem);
      
      // Act
      const result = await memoryStorage.getTodo(todoItem.id);
      
      // Modify the returned item
      if (result) {
        result.title = 'Modified Title';
      }
      
      // Assert that the stored item was not affected
      const storedItem = await memoryStorage.getTodo(todoItem.id);
      expect(storedItem?.title).not.toBe('Modified Title');
      expect(storedItem?.title).toBe('Test Todo');
    });
  });
  
  describe('listTodos', () => {
    it('should return an empty array when no todo items exist', async () => {
      // Act
      const result = await memoryStorage.listTodos();
      
      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
    
    it('should return all todo items', async () => {
      // Arrange
      const todo1 = createTestTodo();
      const todo2 = createTestTodo();
      const todo3 = createTestTodo();
      
      await memoryStorage.createTodo(todo1);
      await memoryStorage.createTodo(todo2);
      await memoryStorage.createTodo(todo3);
      
      // Act
      const result = await memoryStorage.listTodos();
      
      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(result.map(todo => todo.id)).toContain(todo1.id);
      expect(result.map(todo => todo.id)).toContain(todo2.id);
      expect(result.map(todo => todo.id)).toContain(todo3.id);
    });
    
    it('should return deep copies of the todo items to avoid unintended mutations', async () => {
      // Arrange
      const todoItem = createTestTodo();
      await memoryStorage.createTodo(todoItem);
      
      // Act
      const result = await memoryStorage.listTodos();
      
      // Modify the returned item
      if (result.length > 0) {
        result[0].title = 'Modified Title';
      }
      
      // Assert that the stored item was not affected
      const storedItem = await memoryStorage.getTodo(todoItem.id);
      expect(storedItem?.title).not.toBe('Modified Title');
      expect(storedItem?.title).toBe('Test Todo');
    });
  });
  
  describe('updateTodo', () => {
    it('should update a todo item', async () => {
      const todoItem = createTestTodo();
      await memoryStorage.createTodo(todoItem);

      const updates: TodoItemUpdates = {
        title: 'Updated Title',
        description: 'Updated Description',
        status: Status.IN_PROGRESS
      };

      const result = await memoryStorage.updateTodo(todoItem.id, updates);
      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated Description');
      expect(result.status).toBe(Status.IN_PROGRESS);
    });

    it('should throw NotFoundError for non-existent todo', async () => {
      const nonExistentId = 'non-existent-id';
      const updates: TodoItemUpdates = { title: 'New Title' };
      
      await expect(memoryStorage.updateTodo(nonExistentId, updates))
        .rejects.toThrow(NotFoundError);
    });

    it('should handle partial updates', async () => {
      const todoItem = createTestTodo();
      await memoryStorage.createTodo(todoItem);

      const updates: TodoItemUpdates = {
        title: 'Updated Title'
      };

      const result = await memoryStorage.updateTodo(todoItem.id, updates);
      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe(todoItem.description);
      expect(result.status).toBe(todoItem.status);
    });
  });
  
  describe('deleteTodo', () => {
    it('should delete the todo item with the given ID', async () => {
      // Arrange
      const todoItem = createTestTodo();
      await memoryStorage.createTodo(todoItem);
      
      // Act
      await memoryStorage.deleteTodo(todoItem.id);
      
      // Assert
      const result = await memoryStorage.getTodo(todoItem.id);
      expect(result).toBeNull();
    });
    
    it('should throw NotFoundError if no todo item with the given ID exists', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      // Act & Assert
      await expect(memoryStorage.deleteTodo(nonExistentId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
  
  describe('clear', () => {
    it('should remove all todo items from the storage', async () => {
      // Arrange
      const todo1 = createTestTodo();
      const todo2 = createTestTodo();
      const todo3 = createTestTodo();
      
      await memoryStorage.createTodo(todo1);
      await memoryStorage.createTodo(todo2);
      await memoryStorage.createTodo(todo3);
      
      // Confirm that the todos were added
      const beforeClear = await memoryStorage.listTodos();
      expect(beforeClear.length).toBe(3);
      
      // Act
      await memoryStorage.clear();
      
      // Assert
      const afterClear = await memoryStorage.listTodos();
      expect(afterClear.length).toBe(0);
    });
  });
});
