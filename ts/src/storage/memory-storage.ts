import { TodoItem } from '../core/types';
import { TodoStorage } from '../core/interfaces';
import { NotFoundError } from '../core/errors';
import { logger } from '../utils/logging';

/**
 * In-memory implementation of the TodoStorage interface
 * This is primarily used for testing and as a fallback
 */
export class MemoryStorage implements TodoStorage {
  private todos: Map<string, TodoItem>;

  constructor() {
    this.todos = new Map<string, TodoItem>();
    logger.info('MemoryStorage initialized');
  }

  /**
   * Creates a new todo item in the storage
   * @param item The todo item to create
   * @returns The created todo item
   */
  async createTodo(item: TodoItem): Promise<TodoItem> {
    // Create a deep copy to avoid unintended mutations
    const todoItem = JSON.parse(JSON.stringify(item)) as TodoItem;
    
    // Convert string dates back to Date objects
    todoItem.createdAt = new Date(todoItem.createdAt);
    todoItem.updatedAt = new Date(todoItem.updatedAt);
    
    // Store the todo item
    this.todos.set(todoItem.id, todoItem);
    
    logger.debug(`Todo created in memory: ${todoItem.id}`);
    return todoItem;
  }

  /**
   * Retrieves a todo item by its ID
   * @param id The ID of the todo item to retrieve
   * @returns The todo item if found, otherwise null
   */
  async getTodo(id: string): Promise<TodoItem | null> {
    const todoItem = this.todos.get(id);
    
    if (!todoItem) {
      logger.debug(`Todo not found in memory: ${id}`);
      return null;
    }
    
    // Return a deep copy to avoid unintended mutations
    const result = JSON.parse(JSON.stringify(todoItem)) as TodoItem;
    
    // Convert string dates back to Date objects
    result.createdAt = new Date(result.createdAt);
    result.updatedAt = new Date(result.updatedAt);
    
    logger.debug(`Todo retrieved from memory: ${id}`);
    return result;
  }

  /**
   * Lists all todo items
   * @returns An array of todo items
   */
  async listTodos(): Promise<TodoItem[]> {
    const todoItems = Array.from(this.todos.values());
    
    // Return deep copies to avoid unintended mutations
    const result = JSON.parse(JSON.stringify(todoItems)) as TodoItem[];
    
    // Convert string dates back to Date objects
    result.forEach(item => {
      item.createdAt = new Date(item.createdAt);
      item.updatedAt = new Date(item.updatedAt);
    });
    
    logger.debug(`Listed ${result.length} todos from memory`);
    return result;
  }

  /**
   * Updates a todo item
   * @param item The todo item to update
   * @returns The updated todo item
   * @throws NotFoundError if the todo item is not found
   */
  async updateTodo(item: TodoItem): Promise<TodoItem> {
    if (!this.todos.has(item.id)) {
      logger.warn(`Cannot update non-existent todo: ${item.id}`);
      throw new NotFoundError('TodoItem', item.id);
    }
    
    // Create a deep copy to avoid unintended mutations
    const todoItem = JSON.parse(JSON.stringify(item)) as TodoItem;
    
    // Convert string dates back to Date objects
    todoItem.createdAt = new Date(todoItem.createdAt);
    todoItem.updatedAt = new Date(todoItem.updatedAt);
    
    // Store the updated todo item
    this.todos.set(todoItem.id, todoItem);
    
    logger.debug(`Todo updated in memory: ${todoItem.id}`);
    return todoItem;
  }

  /**
   * Deletes a todo item by its ID
   * @param id The ID of the todo item to delete
   * @throws NotFoundError if the todo item is not found
   */
  async deleteTodo(id: string): Promise<void> {
    if (!this.todos.has(id)) {
      logger.warn(`Cannot delete non-existent todo: ${id}`);
      throw new NotFoundError('TodoItem', id);
    }
    
    this.todos.delete(id);
    logger.debug(`Todo deleted from memory: ${id}`);
  }

  /**
   * Clears all todo items from the storage
   * This is primarily used for testing
   */
  async clear(): Promise<void> {
    this.todos.clear();
    logger.debug('All todos cleared from memory');
  }
}
