import { TodoService } from '../../../src/services/todo-service';
import { MemoryStorage } from '../../../src/storage/memory-storage';
import { Status } from '../../../src/core/types';
import { NotFoundError, ValidationError } from '../../../src/core/errors';

describe('TodoService', () => {
  let todoService: TodoService;
  let memoryStorage: MemoryStorage;

  // Shared test data
  const testTitle = 'Test Todo';
  const testDescription = 'This is a test todo item';
  
  beforeEach(async () => {
    // Create a fresh MemoryStorage instance for each test
    memoryStorage = new MemoryStorage();
    
    // Create a TodoService instance with the MemoryStorage
    todoService = new TodoService(memoryStorage);
  });

  afterEach(async () => {
    // Clear all todos from the storage after each test
    await memoryStorage.clear();
  });

  describe('addTodo', () => {
    it('should create a new todo item with the given title and description', async () => {
      // Act
      const result = await todoService.addTodo(testTitle, testDescription);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toBe(testTitle);
      expect(result.description).toBe(testDescription);
      expect(result.status).toBe(Status.PENDING);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw ValidationError when title is empty', async () => {
      // Act & Assert
      await expect(todoService.addTodo('', testDescription))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when description is empty', async () => {
      // Act & Assert
      await expect(todoService.addTodo(testTitle, ''))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when title is too long', async () => {
      // Arrange
      const longTitle = 'A'.repeat(101); // 101 characters

      // Act & Assert
      await expect(todoService.addTodo(longTitle, testDescription))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when description is too long', async () => {
      // Arrange
      const longDescription = 'A'.repeat(1001); // 1001 characters

      // Act & Assert
      await expect(todoService.addTodo(testTitle, longDescription))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('getTodo', () => {
    it('should return the todo item with the given ID', async () => {
      // Arrange
      const createdTodo = await todoService.addTodo(testTitle, testDescription);

      // Act
      const result = await todoService.getTodo(createdTodo.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(createdTodo.id);
      expect(result.title).toBe(testTitle);
      expect(result.description).toBe(testDescription);
      expect(result.status).toBe(Status.PENDING);
    });

    it('should throw NotFoundError when todo item with the given ID does not exist', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act & Assert
      await expect(todoService.getTodo(nonExistentId))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('listTodos', () => {
    it('should return an empty array when no todo items exist', async () => {
      // Act
      const result = await todoService.listTodos();

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should return all todo items', async () => {
      // Arrange
      const todo1 = await todoService.addTodo('Todo 1', 'Description 1');
      const todo2 = await todoService.addTodo('Todo 2', 'Description 2');
      const todo3 = await todoService.addTodo('Todo 3', 'Description 3');

      // Act
      const result = await todoService.listTodos();

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(result.map(todo => todo.id)).toContain(todo1.id);
      expect(result.map(todo => todo.id)).toContain(todo2.id);
      expect(result.map(todo => todo.id)).toContain(todo3.id);
    });
  });

  describe('updateTodo', () => {
    it('should update the status of the todo item with the given ID', async () => {
      // Arrange
      const createdTodo = await todoService.addTodo(testTitle, testDescription);
      
      // Act
      const result = await todoService.updateTodo(createdTodo.id, Status.IN_PROGRESS);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(createdTodo.id);
      expect(result.title).toBe(testTitle);
      expect(result.description).toBe(testDescription);
      expect(result.status).toBe(Status.IN_PROGRESS);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(createdTodo.updatedAt.getTime());
    });

    it('should throw ValidationError when status is invalid', async () => {
      // Arrange
      const createdTodo = await todoService.addTodo(testTitle, testDescription);
      
      // Act & Assert
      await expect(todoService.updateTodo(createdTodo.id, 'INVALID_STATUS' as Status))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw NotFoundError when todo item with the given ID does not exist', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act & Assert
      await expect(todoService.updateTodo(nonExistentId, Status.IN_PROGRESS))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('deleteTodo', () => {
    it('should delete the todo item with the given ID', async () => {
      // Arrange
      const createdTodo = await todoService.addTodo(testTitle, testDescription);
      
      // Act
      await todoService.deleteTodo(createdTodo.id);

      // Assert
      await expect(todoService.getTodo(createdTodo.id))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw NotFoundError when todo item with the given ID does not exist', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act & Assert
      await expect(todoService.deleteTodo(nonExistentId))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
