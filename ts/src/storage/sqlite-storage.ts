import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { TodoItem, Status } from '../core/types';
import { TodoStorage } from '../core/interfaces';
import { NotFoundError, StorageError } from '../core/errors';
import { logger } from '../utils/logging';
import { formatIsoDate, parseIsoDate } from '../utils/date-utils';

/**
 * SQLite implementation of the TodoStorage interface
 * This is used for local development
 */
export class SQLiteStorage implements TodoStorage {
  private db: Database | null = null;
  private readonly dbPath: string;

  /**
   * Creates a new SQLiteStorage
   * @param dbPath The path to the SQLite database file
   */
  constructor(dbPath: string) {
    this.dbPath = dbPath;
    logger.info(`SQLiteStorage initialized with database at: ${dbPath}`);
  }

  /**
   * Initializes the database connection and schema
   */
  async initialize(): Promise<void> {
    try {
      // Open the database connection
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Create the todos table if it doesn't exist
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      logger.info('SQLite database initialized');
    } catch (error) {
      logger.error('Failed to initialize SQLite database', { error });
      throw new StorageError('Failed to initialize SQLite database', error as Error);
    }
  }

  /**
   * Closes the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      logger.info('SQLite database connection closed');
    }
  }

  /**
   * Ensures that the database connection is open
   * @throws StorageError if the database connection is not open
   */
  private ensureConnection(): Database {
    if (!this.db) {
      throw new StorageError('Database connection is not initialized');
    }
    return this.db;
  }

  /**
   * Converts a row from the database to a TodoItem
   * @param row The row from the database
   * @returns The TodoItem
   */
  private rowToTodoItem(row: any): TodoItem {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as Status,
      createdAt: parseIsoDate(row.created_at),
      updatedAt: parseIsoDate(row.updated_at)
    };
  }

  /**
   * Creates a new todo item in the storage
   * @param item The todo item to create
   * @returns The created todo item
   */
  async createTodo(item: TodoItem): Promise<TodoItem> {
    const db = this.ensureConnection();
    
    try {
      await db.run(
        `INSERT INTO todos (id, title, description, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        item.id,
        item.title,
        item.description,
        item.status,
        formatIsoDate(item.createdAt),
        formatIsoDate(item.updatedAt)
      );
      
      logger.debug(`Todo created in SQLite: ${item.id}`);
      return item;
    } catch (error) {
      logger.error(`Failed to create todo in SQLite: ${item.id}`, { error });
      throw new StorageError('Failed to create todo in SQLite', error as Error);
    }
  }

  /**
   * Retrieves a todo item by its ID
   * @param id The ID of the todo item to retrieve
   * @returns The todo item if found, otherwise null
   */
  async getTodo(id: string): Promise<TodoItem | null> {
    const db = this.ensureConnection();
    
    try {
      const row = await db.get(
        `SELECT id, title, description, status, created_at, updated_at
         FROM todos
         WHERE id = ?`,
        id
      );
      
      if (!row) {
        logger.debug(`Todo not found in SQLite: ${id}`);
        return null;
      }
      
      const todoItem = this.rowToTodoItem(row);
      logger.debug(`Todo retrieved from SQLite: ${id}`);
      return todoItem;
    } catch (error) {
      logger.error(`Failed to get todo from SQLite: ${id}`, { error });
      throw new StorageError('Failed to get todo from SQLite', error as Error);
    }
  }

  /**
   * Lists all todo items
   * @returns An array of todo items
   */
  async listTodos(): Promise<TodoItem[]> {
    const db = this.ensureConnection();
    
    try {
      const rows = await db.all(
        `SELECT id, title, description, status, created_at, updated_at
         FROM todos
         ORDER BY created_at DESC`
      );
      
      const todoItems = rows.map(row => this.rowToTodoItem(row));
      logger.debug(`Listed ${todoItems.length} todos from SQLite`);
      return todoItems;
    } catch (error) {
      logger.error('Failed to list todos from SQLite', { error });
      throw new StorageError('Failed to list todos from SQLite', error as Error);
    }
  }

  /**
   * Updates a todo item
   * @param item The todo item to update
   * @returns The updated todo item
   * @throws NotFoundError if the todo item is not found
   */
  async updateTodo(item: TodoItem): Promise<TodoItem> {
    const db = this.ensureConnection();
    
    try {
      const result = await db.run(
        `UPDATE todos
         SET title = ?, description = ?, status = ?, updated_at = ?
         WHERE id = ?`,
        item.title,
        item.description,
        item.status,
        formatIsoDate(item.updatedAt),
        item.id
      );
      
      if (result.changes === 0) {
        logger.warn(`Cannot update non-existent todo in SQLite: ${item.id}`);
        throw new NotFoundError('TodoItem', item.id);
      }
      
      logger.debug(`Todo updated in SQLite: ${item.id}`);
      return item;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error(`Failed to update todo in SQLite: ${item.id}`, { error });
      throw new StorageError('Failed to update todo in SQLite', error as Error);
    }
  }

  /**
   * Deletes a todo item by its ID
   * @param id The ID of the todo item to delete
   * @throws NotFoundError if the todo item is not found
   */
  async deleteTodo(id: string): Promise<void> {
    const db = this.ensureConnection();
    
    try {
      const result = await db.run(
        `DELETE FROM todos
         WHERE id = ?`,
        id
      );
      
      if (result.changes === 0) {
        logger.warn(`Cannot delete non-existent todo in SQLite: ${id}`);
        throw new NotFoundError('TodoItem', id);
      }
      
      logger.debug(`Todo deleted from SQLite: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      logger.error(`Failed to delete todo from SQLite: ${id}`, { error });
      throw new StorageError('Failed to delete todo from SQLite', error as Error);
    }
  }

  /**
   * Clears all todo items from the storage
   * This is primarily used for testing
   */
  async clear(): Promise<void> {
    const db = this.ensureConnection();
    
    try {
      await db.exec('DELETE FROM todos');
      logger.debug('All todos cleared from SQLite');
    } catch (error) {
      logger.error('Failed to clear todos from SQLite', { error });
      throw new StorageError('Failed to clear todos from SQLite', error as Error);
    }
  }
}
