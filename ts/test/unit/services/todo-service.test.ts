import { TodoService } from '../../../src/services/todo-service';
import { TodoStorage } from '../../../src/core/interfaces';
import { Status } from '../../../src/core/types';
import { NotFoundError, ValidationError } from '../../../src/core/errors';
import { createTestTodo } from '../../test-utils';
import { TodoItem, TodoItemUpdates } from '../../../src/core/types';

describe('TodoService', () => {
  let todoService: TodoService;
  let mockStorage: jest.Mocked<TodoStorage>;

  // Shared test data
  const testTitle = 'Test Todo';
  const testDescription = 'This is a test todo item';
  
  beforeEach(() => {
    // Create a mock storage for each test
    mockStorage = {
      createTodo: jest.fn(),
      getTodo: jest.fn(),
      listTodos: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn()
    };
    
    // Create a TodoService instance with the mock storage
    todoService = new TodoService(mockStorage);
  });

  describe('addTodo', () => {
    it('should create a new todo item with the given title and description', async () => {
      // Arrange
      const expectedTodo = {
        id: expect.any(String),
        title: testTitle,
        description: testDescription,
        status: Status.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };
      mockStorage.createTodo.mockResolvedValueOnce(expectedTodo);

      // Act
      const result = await todoService.addTodo(testTitle, testDescription);

      // Assert
      expect(result).toMatchObject(expectedTodo);
      expect(mockStorage.createTodo).toHaveBeenCalledWith(expect.objectContaining({
        title: testTitle,
        description: testDescription,
        status: Status.PENDING
      }));
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
    it('should update a todo item', async () => {
      // Arrange
      const existingTodo = createTestTodo();
      const updates: TodoItemUpdates = {
        title: 'Updated Title',
        description: 'Updated Description',
        status: Status.IN_PROGRESS
      };
      const expectedTodo = { ...existingTodo, ...updates };
      mockStorage.updateTodo.mockResolvedValueOnce(expectedTodo);

      // Act
      const result = await todoService.updateTodo(existingTodo.id, updates);

      // Assert
      expect(result).toEqual(expectedTodo);
      expect(mockStorage.updateTodo).toHaveBeenCalledWith(existingTodo.id, updates);
    });

    it('should throw ValidationError when title is empty', async () => {
      const updates: TodoItemUpdates = {
        title: ''  // Invalid empty title
      };

      await expect(todoService.updateTodo('some-id', updates))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid status', async () => {
      const updates: TodoItemUpdates = {
        status: 'INVALID_STATUS' as Status
      };

      await expect(todoService.updateTodo('some-id', updates))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when todo item does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updates: TodoItemUpdates = {
        status: Status.IN_PROGRESS
      };

      await expect(todoService.updateTodo(nonExistentId, updates))
        .rejects.toThrow(NotFoundError);
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
