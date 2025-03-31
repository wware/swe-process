import { v4 as uuidv4 } from 'uuid';

/**
 * Status enum as defined in SysML specification
 */
export enum Status {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

/**
 * TodoItem entity as defined in SysML specification
 */
export interface TodoItem {
  id: string; // Using string for UUID
  title: string;
  description: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a new TodoItem
 */
export interface CreateTodoDto {
  title: string;
  description: string;
}

/**
 * DTO for updating a TodoItem
 */
export interface UpdateTodoDto {
  id: string;
  status: Status;
}

/**
 * Factory function to create a new TodoItem
 */
export function createTodoItem(dto: CreateTodoDto): TodoItem {
  if (!dto.title) throw new ValidationError('Title is required');
  if (!dto.description) throw new ValidationError('Description is required');
  
  const now = new Date();
  return {
    id: uuidv4(),
    title: dto.title,
    description: dto.description,
    status: Status.PENDING, // Default status
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Function to update a TodoItem
 */
export function updateTodoItem(item: TodoItem, dto: UpdateTodoDto): TodoItem {
  return {
    ...item,
    status: dto.status,
    updatedAt: new Date()
  };
}

export function isValidStatus(status: string): status is Status {
  return Object.values(Status).includes(status as Status);
}

export abstract class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class StorageError extends AppError {
  constructor(
    message: string, 
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message, 'STORAGE_ERROR');
  }
}

export interface ListTodosOptions {
  limit?: number;
  offset?: number;
  status?: Status;
}

export interface ListTodosResult {
  items: TodoItem[];
  total: number;
  hasMore: boolean;
}

export interface TodoStorage {
  // ... other methods ...
  listTodos(options?: ListTodosOptions): Promise<ListTodosResult>;
  createTodos(items: TodoItem[]): Promise<TodoItem[]>;
  deleteTodos(ids: string[]): Promise<void>;
}
