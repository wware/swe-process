import { TodoItem, TodoItemUpdates } from './types';

/**
 * TodoStorage interface as defined in SysML specification
 * This is an abstract storage interface that can be implemented
 * by different storage mechanisms (in-memory, SQLite, DynamoDB)
 */
export interface TodoStorage {
  /**
   * Creates a new todo item in the storage
   * @param item The todo item to create
   * @returns The created todo item
   */
  createTodo(item: TodoItem): Promise<TodoItem>;
  
  /**
   * Retrieves a todo item by its ID
   * @param id The ID of the todo item to retrieve
   * @returns The todo item if found, otherwise null
   */
  getTodo(id: string): Promise<TodoItem>;
  
  /**
   * Lists all todo items
   * @returns An array of todo items
   */
  listTodos(): Promise<TodoItem[]>;
  
  /**
   * Updates a todo item
   * @param id The ID of the todo item to update
   * @param updates The updates to apply to the todo item
   * @returns The updated todo item
   */
  updateTodo(id: string, updates: TodoItemUpdates): Promise<TodoItem>;
  
  /**
   * Deletes a todo item by its ID
   * @param id The ID of the todo item to delete
   */
  deleteTodo(id: string): Promise<void>;
}

/**
 * TodoService interface as defined in SysML specification
 * This represents the business logic layer of the application
 */
export interface ITodoService {
  /**
   * Adds a new todo item
   * @param title The title of the todo item
   * @param description The description of the todo item
   * @returns The created todo item
   */
  addTodo(title: string, description: string): Promise<TodoItem>;
  
  /**
   * Retrieves a todo item by its ID
   * @param id The ID of the todo item to retrieve
   * @returns The todo item
   * @throws Error if the todo item is not found
   */
  getTodo(id: string): Promise<TodoItem>;
  
  /**
   * Lists all todo items
   * @returns An array of todo items
   */
  listTodos(): Promise<TodoItem[]>;
  
  /**
   * Updates a todo item's status
   * @param id The ID of the todo item to update
   * @param updates The updates to apply to the todo item
   * @returns The updated todo item
   * @throws Error if the todo item is not found
   */
  updateTodo(id: string, updates: TodoItemUpdates): Promise<TodoItem>;
  
  /**
   * Deletes a todo item by its ID
   * @param id The ID of the todo item to delete
   * @throws Error if the todo item is not found
   */
  deleteTodo(id: string): Promise<void>;
}
