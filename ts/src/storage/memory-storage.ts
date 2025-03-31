import { TodoItem } from '../core/types';
import { TodoStorage } from '../core/interfaces';
import { NotFoundError } from '../core/errors';
import { logger } from '../utils/logging';

/**
 * In-memory implementation of the TodoStorage interface
 * This is primarily used for testing and as a fallback
 */
export class MemoryStorage implements TodoStorage {
  private todos: TodoItem[] = [];

  constructor() {
    this.todos = [];
    logger.info('MemoryStorage initialized');
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Creates a new todo item in the storage
   * @param item The todo item to create
   * @returns The created todo item
   */
  async createTodo(item: TodoItem): Promise<TodoItem> {
    const clonedItem = this.deepClone(item);
    this.todos.push(clonedItem);
    return this.deepClone(clonedItem);
  }

  /**
   * Retrieves a todo item by its ID
   * @param id The ID of the todo item to retrieve
   * @returns The todo item if found, otherwise null
   */
  async getTodo(id: string): Promise<TodoItem> {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) {
      throw new NotFoundError(`Todo with id ${id} not found`);
    }
    return this.deepClone(todo);
  }

  /**
   * Lists all todo items
   * @returns An array of todo items
   */
  async listTodos(): Promise<TodoItem[]> {
    return this.deepClone(this.todos);
  }

  /**
   * Updates a todo item
   * @param item The todo item to update
   * @returns The updated todo item
   * @throws NotFoundError if the todo item is not found
   */
  async updateTodo(id: string, item: Partial<TodoItem>): Promise<TodoItem> {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) {
      throw new NotFoundError(`Todo with id ${id} not found`);
    }
    
    const updatedTodo = {
      ...this.todos[index],
      ...this.deepClone(item)
    };
    
    this.todos[index] = updatedTodo;
    return this.deepClone(updatedTodo);
  }

  /**
   * Deletes a todo item by its ID
   * @param id The ID of the todo item to delete
   * @throws NotFoundError if the todo item is not found
   */
  async deleteTodo(id: string): Promise<void> {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) {
      throw new NotFoundError(`Todo with id ${id} not found`);
    }
    this.todos.splice(index, 1);
    logger.debug(`Todo deleted from memory: ${id}`);
  }

  /**
   * Clears all todo items from the storage
   * This is primarily used for testing
   */
  async clear(): Promise<void> {
    this.todos.length = 0;
    logger.debug('All todos cleared from memory');
  }
}
