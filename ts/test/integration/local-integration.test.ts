import path from 'path';
import fs from 'fs';
import { TodoService } from '../../src/services/todo-service';
import { SQLiteStorage } from '../../src/storage/sqlite-storage';
import { TodoItem, Status } from '../../src/core/types';
import { NotFoundError } from '../../src/core/errors';

describe('Local Integration Test', () => {
  let todoService: TodoService;
  let sqliteStorage: SQLiteStorage;
  const testDbPath = path.join(__dirname, 'test-integration.db');
  
  // Shared test data
  const testTitle = 'Integration Test Todo';
  const testDescription = 'This is an integration test todo item';
  
  beforeAll(async () => {
    // Ensure the test database doesn't exist before we start
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Create and initialize the SQLiteStorage
    sqliteStorage = new SQLiteStorage(testDbPath);
    await sqliteStorage.initialize();
    
    // Create the TodoService with the SQLiteStorage
    todoService = new TodoService(sqliteStorage);
  });
  
  afterAll(async () => {
    // Clean up the database
    await sqliteStorage.clear();
    await sqliteStorage.close();
    
    // Delete the test database file
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  // Define a function to verify that a TodoItem matches the expected values
  const verifyTodoItem = (todoItem: TodoItem, title: string, description: string, status: Status): void => {
    expect(todoItem).toBeDefined();
    expect(todoItem.id).toBeDefined();
    expect(todoItem.title).toBe(title);
    expect(todoItem.description).toBe(description);
    expect(todoItem.status).toBe(status);
    expect(todoItem.createdAt).toBeInstanceOf(Date);
    expect(todoItem.updatedAt).toBeInstanceOf(Date);
  };
  
  it('should perform a complete CRUD lifecycle', async () => {
    // 1. Initially, there should be no todo items
    const initialTodos = await todoService.listTodos();
    expect(Array.isArray(initialTodos)).toBe(true);
    expect(initialTodos.length).toBe(0);
    
    // 2. Create a new todo item
    const createdTodo = await todoService.addTodo(testTitle, testDescription);
    verifyTodoItem(createdTodo, testTitle, testDescription, Status.PENDING);
    
    // 3. Retrieve the todo item by ID
    const retrievedTodo = await todoService.getTodo(createdTodo.id);
    verifyTodoItem(retrievedTodo, testTitle, testDescription, Status.PENDING);
    
    // 4. List all todo items (should include the one we created)
    const listedTodos = await todoService.listTodos();
    expect(Array.isArray(listedTodos)).toBe(true);
    expect(listedTodos.length).toBe(1);
    verifyTodoItem(listedTodos[0], testTitle, testDescription, Status.PENDING);
    
    // 5. Update the todo item
    const updatedTodo = await todoService.updateTodo(createdTodo.id, Status.IN_PROGRESS);
    verifyTodoItem(updatedTodo, testTitle, testDescription, Status.IN_PROGRESS);
    
    // 6. Retrieve the updated todo item
    const retrievedUpdatedTodo = await todoService.getTodo(createdTodo.id);
    verifyTodoItem(retrievedUpdatedTodo, testTitle, testDescription, Status.IN_PROGRESS);
    
    // 7. Mark the todo item as completed
    const completedTodo = await todoService.updateTodo(createdTodo.id, Status.COMPLETED);
    verifyTodoItem(completedTodo, testTitle, testDescription, Status.COMPLETED);
    
    // 8. Delete the todo item
    await todoService.deleteTodo(createdTodo.id);
    
    // 9. Verify that the todo item was deleted
    await expect(todoService.getTodo(createdTodo.id))
      .rejects
      .toThrow(NotFoundError);
    
    // 10. Verify that there are no todo items left
    const finalTodos = await todoService.listTodos();
    expect(Array.isArray(finalTodos)).toBe(true);
    expect(finalTodos.length).toBe(0);
  });
  
  it('should handle multiple todo items correctly', async () => {
    // 1. Create multiple todo items
    const todo1 = await todoService.addTodo('Todo 1', 'Description 1');
    const todo2 = await todoService.addTodo('Todo 2', 'Description 2');
    const todo3 = await todoService.addTodo('Todo 3', 'Description 3');
    
    // 2. List all todo items
    const todos = await todoService.listTodos();
    expect(Array.isArray(todos)).toBe(true);
    expect(todos.length).toBe(3);
    
    // 3. Update the status of each todo item
    await todoService.updateTodo(todo1.id, Status.IN_PROGRESS);
    await todoService.updateTodo(todo2.id, Status.COMPLETED);
    // Leave todo3 as PENDING
    
    // 4. Retrieve each todo item and verify its status
    const retrievedTodo1 = await todoService.getTodo(todo1.id);
    expect(retrievedTodo1.status).toBe(Status.IN_PROGRESS);
    
    const retrievedTodo2 = await todoService.getTodo(todo2.id);
    expect(retrievedTodo2.status).toBe(Status.COMPLETED);
    
    const retrievedTodo3 = await todoService.getTodo(todo3.id);
    expect(retrievedTodo3.status).toBe(Status.PENDING);
    
    // 5. Delete each todo item
    await todoService.deleteTodo(todo1.id);
    await todoService.deleteTodo(todo2.id);
    await todoService.deleteTodo(todo3.id);
    
    // 6. Verify that there are no todo items left
    const finalTodos = await todoService.listTodos();
    expect(Array.isArray(finalTodos)).toBe(true);
    expect(finalTodos.length).toBe(0);
  });
  
  it('should handle validation errors correctly', async () => {
    const testTitle = 'Test Todo';
    const testDescription = 'Test Description';

    // 1. Attempt to create a todo item with an empty title
    await expect(todoService.addTodo('', testDescription))
      .rejects
      .toThrow(/title is required/i);
    
    // 2. Attempt to create a todo item with an empty description
    await expect(todoService.addTodo(testTitle, ''))
      .rejects
      .toThrow(/description is required/i);
    
    // 3. Attempt to create a todo item with a title that is too long
    const longTitle = 'A'.repeat(101);
    await expect(todoService.addTodo(longTitle, testDescription))
      .rejects
      .toThrow(/title must be 100 characters or less/i);
    
    // 4. Verify no items were created
    const todos = await todoService.listTodos();
    expect(Array.isArray(todos)).toBe(true);
    expect(todos.length).toBe(0);
  });
  
  it('should handle not found errors correctly', async () => {
    // 1. Attempt to retrieve a non-existent todo item
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    await expect(todoService.getTodo(nonExistentId))
      .rejects
      .toThrow(NotFoundError);
    
    // 2. Attempt to update a non-existent todo item
    await expect(todoService.updateTodo(nonExistentId, Status.IN_PROGRESS))
      .rejects
      .toThrow(NotFoundError);
    
    // 3. Attempt to delete a non-existent todo item
    await expect(todoService.deleteTodo(nonExistentId))
      .rejects
      .toThrow(NotFoundError);
  });
  
  it('should validate status values correctly', async () => {
    // 1. Create a todo item
    const todo = await todoService.addTodo(testTitle, testDescription);
    
    // 2. Attempt to update with an invalid status
    await expect(todoService.updateTodo(todo.id, 'INVALID_STATUS' as Status))
      .rejects
      .toThrow(/invalid status/i);
    
    // 3. Delete the todo item
    await todoService.deleteTodo(todo.id);
  });
});
