import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AppError, NotFoundError, ValidationError } from '../core/errors';
import { logger } from '../utils/logging';

/**
 * Standard API response format
 */
export interface ApiResponse {
  statusCode: number;
  body: string;
  headers: {
    [header: string]: string | number | boolean;
  };
}

/**
 * Creates a success response
 * @param data The data to include in the response
 * @param statusCode The status code to use (default: 200)
 * @returns The API response
 */
export function createSuccessResponse(data: any, statusCode: number = 200): ApiResponse {
  return {
    statusCode,
    body: JSON.stringify({ 
      success: true, 
      data 
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  };
}

/**
 * Creates an error response
 * @param error The error that occurred
 * @param statusCode The status code to use (default: 500)
 * @returns The API response
 */
export function createErrorResponse(error: Error, statusCode: number = 500): ApiResponse {
  // Determine the status code based on the error type
  if (error instanceof NotFoundError) {
    statusCode = 404;
  } else if (error instanceof ValidationError) {
    statusCode = 400;
  }

  return {
    statusCode,
    body: JSON.stringify({ 
      success: false, 
      error: {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  };
}

/**
 * Parses the request body from an API Gateway event
 * @param event The API Gateway event
 * @returns The parsed request body, or undefined if the body is empty
 */
export function parseRequestBody<T>(event: APIGatewayProxyEvent): T | undefined {
  if (!event.body) {
    return undefined;
  }

  try {
    return JSON.parse(event.body) as T;
  } catch (error) {
    throw new ValidationError('Invalid request body: not a valid JSON');
  }
}

/**
 * Gets a path parameter from an API Gateway event
 * @param event The API Gateway event
 * @param paramName The name of the parameter
 * @returns The parameter value
 * @throws ValidationError if the parameter is not present
 */
export function getPathParameter(event: APIGatewayProxyEvent, paramName: string): string {
  const param = event.pathParameters?.[paramName];
  
  if (!param) {
    throw new ValidationError(`Missing path parameter: ${paramName}`);
  }
  
  return param;
}

/**
 * Gets a query parameter from an API Gateway event
 * @param event The API Gateway event
 * @param paramName The name of the parameter
 * @param defaultValue The default value to return if the parameter is not present
 * @returns The parameter value, or the default value if the parameter is not present
 */
export function getQueryParameter(
  event: APIGatewayProxyEvent,
  paramName: string,
  defaultValue?: string
): string | undefined {
  const param = event.queryStringParameters?.[paramName];
  return param !== undefined ? param : defaultValue;
}

/**
 * Wraps a Lambda handler function to handle errors
 * @param handler The handler function to wrap
 * @returns The wrapped handler function
 */
export function withErrorHandling(
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Log the incoming request
      logger.debug('API Gateway event', { 
        path: event.path,
        method: event.httpMethod,
        queryParams: event.queryStringParameters,
        pathParams: event.pathParameters
      });

      // Call the original handler
      return await handler(event);
    } catch (error) {
      // Log the error
      logger.error('Error handling API Gateway event', { error });

      // Return an error response
      if (error instanceof AppError) {
        return createErrorResponse(error);
      } else if (error instanceof Error) {
        return createErrorResponse(error);
      } else {
        return createErrorResponse(new Error('An unknown error occurred'));
      }
    }
  };
}
