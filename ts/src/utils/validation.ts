import { ValidationError } from '../core/errors';

/**
 * Validates a todo item title
 * @param title The title to validate
 * @throws ValidationError if the title is invalid
 */
export function validateTodoTitle(title: string): void {
  if (!title) {
    throw new ValidationError('Title is required');
  }
  
  if (typeof title !== 'string') {
    throw new ValidationError('Title must be a string');
  }
  
  if (title.trim().length === 0) {
    throw new ValidationError('Title cannot be empty');
  }
  
  if (title.length > 100) {
    throw new ValidationError('Title cannot be longer than 100 characters');
  }
}

/**
 * Validates a todo item description
 * @param description The description to validate
 * @throws ValidationError if the description is invalid
 */
export function validateTodoDescription(description: string): void {
  if (!description) {
    throw new ValidationError('Description is required');
  }
  
  if (typeof description !== 'string') {
    throw new ValidationError('Description must be a string');
  }
  
  if (description.length > 1000) {
    throw new ValidationError('Description cannot be longer than 1000 characters');
  }
}

/**
 * Validates a UUID
 * @param id The UUID to validate
 * @throws ValidationError if the UUID is invalid
 */
export function validateUuid(id: string): void {
  if (!id) {
    throw new ValidationError('ID is required');
  }
  
  if (typeof id !== 'string') {
    throw new ValidationError('ID must be a string');
  }
  
  // Basic UUID format validation (not perfect but good enough for most cases)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError('Invalid UUID format');
  }
}
