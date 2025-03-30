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
