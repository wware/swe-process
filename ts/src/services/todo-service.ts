import { TodoItem, Status, createTodoItem, updateTodoItem } from '../core/types';
import { ITodoService, TodoStorage } from '../core/interfaces';
import { NotFoundError, ValidationError } from '../core/errors';
import { validateTodoTitle, validateTodoDescription } from '../utils/validation';
import { logger } from '../utils/logging';

/**
 * Implementation of the TodoService as defined in the SysML specification
 * This service uses a TodoStorage implementation to persist and retrieve data
 */
export class TodoService implements ITodoService {
  /**
   * Creates a new TodoService
   * @param storage The storage implementation to use
   */
  constructor(private readonly storage: TodoStorage) {}

  /**
   * Adds a new todo item
   * @param title The title of the todo item
   * @param description The description of the todo item
   * @returns The created todo item
   * @throws ValidationError if the input is invalid
   */
  async addTodo(title: string, description: string): Promise<TodoItem> {
    logger.info(`Adding todo with title: ${title}`);
    
    // Validate input
    validateTodoTitle(title);
    validateTodoDescription(description);
    
    // Create a new todo item
    const todoItem = createTodoItem({ title, description });
    
    // Persist the todo item
    const result = await this.storage.createTodo(todoItem);
    
    logger.info(`Todo added with id: ${result.id}`);
    return result;
  }

  /**
   * Retrieves a todo item by its ID
   * @param id The ID of the todo item to retrieve
   * @returns The todo item
   * @throws NotFoundError if the todo item is not found
   */
  async getTodo(id: string): Promise<TodoItem> {
    logger.info(`Getting todo with id: ${id}`);
    
    const todoItem = await this.storage.getTodo(id);
    if (!todoItem) {
      logger.warn(`Todo with id ${id} not found`);
      throw new NotFoundError('TodoItem', id);
    }
    
    return todoItem;
  }

  /**
   * Lists all todo items
   * @returns An array of todo items
   */
  async listTodos(): Promise<TodoItem[]> {
    logger.info('Listing all todos');
    
    const todoItems = await this.storage.listTodos();
    
    logger.info(`Found ${todoItems.length} todos`);
    return todoItems;
  }

  /**
   * Updates a todo item's status
   * @param id The ID of the todo item to update
   * @param status The new status
   * @returns The updated todo item
   * @throws NotFoundError if the todo item is not found
   * @throws ValidationError if the status is invalid
   */
  async updateTodo(id: string, status: string): Promise<TodoItem> {
    logger.info(`Updating todo with id: ${id}, status: ${status}`);
    
    // Validate status
    if (!Object.values(Status).includes(status as Status)) {
      throw new ValidationError(`Invalid status: ${status}. Valid values are: ${Object.values(Status).join(', ')}`);
    }
    
    // Get the existing todo item
    const existingItem = await this.getTodo(id);
    
    // Update the todo item
    const updatedItem = updateTodoItem(existingItem, { 
      id, 
      status: status as Status 
    });
    
    // Persist the updated todo item
    const result = await this.storage.updateTodo(updatedItem);
    
    logger.info(`Todo with id ${id} updated to status: ${status}`);
    return result;
  }

  /**
   * Deletes a todo item by its ID
   * @param id The ID of the todo item to delete
   * @throws NotFoundError if the todo item is not found
   */
  async deleteTodo(id: string): Promise<void> {
    logger.info(`Deleting todo with id: ${id}`);
    
    // Check if the todo item exists
    await this.getTodo(id);
    
    // Delete the todo item
    await this.storage.deleteTodo(id);
    
    logger.info(`Todo with id ${id} deleted`);
  }
}
