/**
 * Base class for application-specific errors
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error thrown when there's an issue with the storage
 */
export class StorageError extends AppError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
  }
}

/**
 * Error thrown when an operation is not supported
 */
export class UnsupportedOperationError extends AppError {
  constructor(operation: string) {
    super(`Operation not supported: ${operation}`);
  }
}
