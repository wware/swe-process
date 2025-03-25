# Like vibe-coding, but bulletproof and trustworthy

- [What is this all about?](#what-is-this-all-about)
- [SysML and MBSE](#sysml-and-mbse)
- [Test-driven development](#test-driven-development)
- [Example: a simple web service](#example-a-simple-web-service)
  - [Making UML diagrams](#making-uml-diagrams)
- [Let's try some TDD with this design](#lets-try-some-tdd-with-this-design)
  - [Assume implementation with AWS Lambda and DynamoDB, coded in TypeScript. Please write a comprehensive, well-documented test suite that will facilitate test-driven development.](#assume-implementation-with-aws-lambda-and-dynamodb-coded-in-typescript-please-write-a-comprehensive-well-documented-test-suite-that-will-facilitate-test-driven-development)
- [How can a LLM help me implement this design?](#how-can-a-llm-help-me-implement-this-design)
  - [What are my options for implementing the system described here?](#what-are-my-options-for-implementing-the-system-described-here)
    - [1. REST API Service](#1-rest-api-service)
    - [2. Microservice Architecture](#2-microservice-architecture)
    - [3. Serverless Implementation](#3-serverless-implementation)
    - [4. Desktop/Mobile Application](#4-desktopmobile-application)
    - [5. Database-Centric Implementation](#5-database-centric-implementation)
    - [6. Event-Driven Architecture](#6-event-driven-architecture)
  - [Show me what I might do to implement with AWS Lambda and DynamoDB.](#show-me-what-i-might-do-to-implement-with-aws-lambda-and-dynamodb)
    - [Components](#components)
    - [Deployment Steps](#deployment-steps)
    - [Advantages of This Approach](#advantages-of-this-approach)
    - [Potential Enhancements](#potential-enhancements)

## What is this all about?

As software developers, we have no viable choice but to embrace
AI-assisted software design and development. What follows in my
attempt to come up with a process that produces bulletproof,
trustworthy designs and code.

When one starts using AI assistance, the language model very quickly
produces a large, complex design. A detailed review of the design
would take a long time, much longer than it took to generate the
code. Perhaps it would be possible to write a tool that could
review the design almost as quickly as it was produced.

My first thought was to use a test-driven development (TDD) process.
The AI can help write the tests, and then the code can be written to
pass the tests. Reviewing the tests would hopefully be more intuitive
and straightforward than reviewing the functional design. Passing the
tests would give confidence that the design is correct.

To build further confidence in the design, we can establish a robust
architectural framework that enumerates interfaces and interactions:

- SysML models used to generate code and tests
- mocks or stubs in Python
- mocks or stubs in Rust
- models derived from MBSE tools

and these would need to be complete enough to allow testing the
correctness of the design up to this point.

The overall goal is to produce a design in a way that takes advantage
of the speed of language models, while still being easy for the developer
to understand, modify, and verify correctness.

## SysML and MBSE

SysML is a language for specifying the architecture of a system, while
MBSE (Model-Based Systems Engineering) provides methodologies for using it.
There are open-source tools that support SysML/MBSE development and validation:

- [Eclipse Papyrus](https://www.eclipse.org/papyrus/) - Includes modeling and validation framework
- [Capella](https://www.eclipse.org/capella/) - Focuses on MBSE practices

These tools help ensure designs are both complete and correct through their
built-in validation capabilities.

Validation tools can help us make sure that the design is correct
and complete. Eclipse Papyrus has a validation framework that
can help us validate our SysML models.

## Test-driven development

To make this work well, we want to first sketch out a block diagram
of the design. We can do this in SysML, and in conversation with an
LLM or AI assistant.

Initially the system could be represented as a collection of mocks
or stubs with the interfaces we want, but toy implementations. Against
these we can write a test suite, and then implement the system to pass
the tests.

## Example: a simple web service

Let's say we want to design a simple web service that can be used to
manage a todo list. We can start by sketching out a block diagram of
the system. `todo.sysml` is a simple block diagram of the system in
SysML. This gives us a starting point with:

- Core domain entities
- Basic operations
- Key relationships
- Standard tracking fields

---

<details>
<summary><tt>todo.sysml</tt></summary>

```sysml
package todo {
    part def TodoService {
        operations {
            action addTodo {
                in title: String;
                in description: String;
                out result: TodoItem;
            }
            action getTodo {
                in id: UUID;
                out result: TodoItem;
            }
            action listTodos {
                out result: List;
            }
            action updateTodo {
                in id: UUID;
                in status: Status;
                out result: TodoItem;
            }
            action deleteTodo {
                in id: UUID;
            }
        }
    }

    part def TodoItem {
        attributes {
            id: UUID;
            title: String;
            description: String;
            status: Status;
            createdAt: DateTime;
            updatedAt: DateTime;
        }
    }

    enum Status {
        PENDING;
        IN_PROGRESS;
        COMPLETED;
    }

    association {
        end service: TodoService[1];
        end items: TodoItem[0..*];
    }
}
```

</details>

---


### Making UML diagrams

PlantUML is a tool that can generate diagrams from SysML models. To
get there we need an intermediate representation. The input language
for PlantUML is called [PUML](https://plantuml.com/puml).

The easiest way to get there is to ask Claude.AI to convert the SysML
model to PUML. My prompt was very simple, and I copied the result
into `todo.puml`.

> Please convert this to PlantUML so I can generate UML diagrams.

Alternatively, the AI assistant in Cursor IDE can perform the
conversion for us. We want to ensure that the SysML model is the
only source of truth for the design.

Then we can use `todo.puml` to generate a UML diagram:

```bash
sudo apt install plantuml
plantuml todo.puml > todo.png
```

<img src="todo.png" alt="Todo list web service block diagram" />

## Let's try some TDD with this design

Let's give Claude.AI the SysML model and ask it to generate a test suite.

### Assume implementation with AWS Lambda and DynamoDB, coded in TypeScript. Please write a comprehensive, well-documented test suite that will facilitate test-driven development.

---

<details>
<summary>Todo Service Test Suite</summary>

```typescript
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { TodoService } from '../src/services/TodoService';
import { TodoItem } from '../src/models/TodoItem';
import { Status } from '../src/models/Status';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Mock the DynamoDB client and document client
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('TodoService', () => {
  let todoService: TodoService;
  let mockDynamoDbClient: jest.Mocked<DynamoDBClient>;
  let mockDynamoDbDocumentClient: jest.Mocked<DynamoDBDocumentClient>;
  
  const mockDate = new Date('2023-01-01T00:00:00.000Z');
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Mock Date.now to return consistent timestamp for testing
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
    
    // Setup DynamoDB mocks
    mockDynamoDbClient = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
    mockDynamoDbDocumentClient = DynamoDBDocumentClient.from(mockDynamoDbClient) as jest.Mocked<DynamoDBDocumentClient>;
    
    // Create the TodoService instance with mocked dependencies
    todoService = new TodoService({
      dynamoDbClient: mockDynamoDbDocumentClient,
      tableName: 'TodoItems'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('addTodo', () => {
    it('should create a new todo item with the provided title and description', async () => {
      // Arrange
      const title = 'Test Todo';
      const description = 'This is a test todo item';
      const mockUuid = '123e4567-e89b-12d3-a456-426614174000';
      
      jest.spyOn(uuidv4, 'v4').mockReturnValue(mockUuid);
      
      const expectedTodoItem: TodoItem = {
        id: mockUuid,
        title,
        description,
        status: Status.PENDING,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString()
      };
      
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({});
      
      // Act
      const result = await todoService.addTodo(title, description);
      
      // Assert
      expect(mockDynamoDbDocumentClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TodoItems',
            Item: expectedTodoItem
          }
        })
      );
      expect(result).toEqual(expectedTodoItem);
    });
    
    it('should throw an error if the DynamoDB operation fails', async () => {
      // Arrange
      const title = 'Test Todo';
      const description = 'This is a test todo item';
      const mockError = new Error('DynamoDB error');
      
      mockDynamoDbDocumentClient.send.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(todoService.addTodo(title, description)).rejects.toThrow('Failed to create todo item: DynamoDB error');
    });
  });

  describe('getTodo', () => {
    it('should return a todo item by id', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedTodoItem: TodoItem = {
        id: todoId,
        title: 'Test Todo',
        description: 'This is a test todo item',
        status: Status.PENDING,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString()
      };
      
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({
        Item: expectedTodoItem
      });
      
      // Act
      const result = await todoService.getTodo(todoId);
      
      // Assert
      expect(mockDynamoDbDocumentClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TodoItems',
            Key: {
              id: todoId
            }
          }
        })
      );
      expect(result).toEqual(expectedTodoItem);
    });
    
    it('should throw an error if the todo item is not found', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({});
      
      // Act & Assert
      await expect(todoService.getTodo(todoId)).rejects.toThrow(`Todo item with id ${todoId} not found`);
    });
    
    it('should throw an error if the DynamoDB operation fails', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const mockError = new Error('DynamoDB error');
      
      mockDynamoDbDocumentClient.send.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(todoService.getTodo(todoId)).rejects.toThrow(`Failed to get todo item: DynamoDB error`);
    });
  });

  describe('listTodos', () => {
    it('should return a list of all todo items', async () => {
      // Arrange
      const todoItems: TodoItem[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Todo 1',
          description: 'This is test todo item 1',
          status: Status.PENDING,
          createdAt: mockDate.toISOString(),
          updatedAt: mockDate.toISOString()
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          title: 'Test Todo 2',
          description: 'This is test todo item 2',
          status: Status.IN_PROGRESS,
          createdAt: mockDate.toISOString(),
          updatedAt: mockDate.toISOString()
        }
      ];
      
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({
        Items: todoItems
      });
      
      // Act
      const result = await todoService.listTodos();
      
      // Assert
      expect(mockDynamoDbDocumentClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TodoItems'
          }
        })
      );
      expect(result).toEqual(todoItems);
    });
    
    it('should return an empty array if no todo items exist', async () => {
      // Arrange
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({
        Items: []
      });
      
      // Act
      const result = await todoService.listTodos();
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should throw an error if the DynamoDB operation fails', async () => {
      // Arrange
      const mockError = new Error('DynamoDB error');
      
      mockDynamoDbDocumentClient.send.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(todoService.listTodos()).rejects.toThrow('Failed to list todo items: DynamoDB error');
    });
  });

  describe('updateTodo', () => {
    it('should update the status of a todo item', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = Status.COMPLETED;
      
      const existingTodoItem: TodoItem = {
        id: todoId,
        title: 'Test Todo',
        description: 'This is a test todo item',
        status: Status.IN_PROGRESS,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      
      const updatedTodoItem: TodoItem = {
        ...existingTodoItem,
        status: newStatus,
        updatedAt: mockDate.toISOString()
      };
      
      // Mock the GET command to return the existing item
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({
        Item: existingTodoItem
      });
      
      // Mock the UPDATE command
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({
        Attributes: updatedTodoItem
      });
      
      // Act
      const result = await todoService.updateTodo(todoId, newStatus);
      
      // Assert
      expect(mockDynamoDbDocumentClient.send).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({
          input: {
            TableName: 'TodoItems',
            Key: {
              id: todoId
            }
          }
        })
      );
      
      expect(mockDynamoDbDocumentClient.send).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          input: {
            TableName: 'TodoItems',
            Key: {
              id: todoId
            },
            UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
              '#status': 'status',
              '#updatedAt': 'updatedAt'
            },
            ExpressionAttributeValues: {
              ':status': newStatus,
              ':updatedAt': mockDate.toISOString()
            },
            ReturnValues: 'ALL_NEW'
          }
        })
      );
      
      expect(result).toEqual(updatedTodoItem);
    });
    
    it('should throw an error if the todo item to update is not found', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = Status.COMPLETED;
      
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({});
      
      // Act & Assert
      await expect(todoService.updateTodo(todoId, newStatus)).rejects.toThrow(`Todo item with id ${todoId} not found`);
    });
    
    it('should throw an error if the DynamoDB get operation fails', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = Status.COMPLETED;
      const mockError = new Error('DynamoDB error');
      
      mockDynamoDbDocumentClient.send.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(todoService.updateTodo(todoId, newStatus)).rejects.toThrow('Failed to get todo item: DynamoDB error');
    });
    
    it('should throw an error if the DynamoDB update operation fails', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = Status.COMPLETED;
      const mockError = new Error('DynamoDB error');
      
      const existingTodoItem: TodoItem = {
        id: todoId,
        title: 'Test Todo',
        description: 'This is a test todo item',
        status: Status.IN_PROGRESS,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({
        Item: existingTodoItem
      });
      
      mockDynamoDbDocumentClient.send.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(todoService.updateTodo(todoId, newStatus)).rejects.toThrow('Failed to update todo item: DynamoDB error');
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo item by id', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockDynamoDbDocumentClient.send.mockResolvedValueOnce({});
      
      // Act
      await todoService.deleteTodo(todoId);
      
      // Assert
      expect(mockDynamoDbDocumentClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TodoItems',
            Key: {
              id: todoId
            }
          }
        })
      );
    });
    
    it('should throw an error if the DynamoDB operation fails', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const mockError = new Error('DynamoDB error');
      
      mockDynamoDbDocumentClient.send.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(todoService.deleteTodo(todoId)).rejects.toThrow('Failed to delete todo item: DynamoDB error');
    });
  });

  // Integration tests with AWS Lambda handlers
  describe('Lambda Integration', () => {
    // These tests will verify that the Lambda handlers correctly invoke the TodoService methods
    // and properly transform the request/response

    describe('addTodoHandler', () => {
      it('should properly invoke TodoService.addTodo and return formatted response', async () => {
        // Implementation will depend on your Lambda handler structure
      });
    });

    describe('getTodoHandler', () => {
      it('should properly invoke TodoService.getTodo and return formatted response', async () => {
        // Implementation will depend on your Lambda handler structure
      });
    });

    describe('listTodosHandler', () => {
      it('should properly invoke TodoService.listTodos and return formatted response', async () => {
        // Implementation will depend on your Lambda handler structure
      });
    });

    describe('updateTodoHandler', () => {
      it('should properly invoke TodoService.updateTodo and return formatted response', async () => {
        // Implementation will depend on your Lambda handler structure
      });
    });

    describe('deleteTodoHandler', () => {
      it('should properly invoke TodoService.deleteTodo and return formatted response', async () => {
        // Implementation will depend on your Lambda handler structure
      });
    });
  });
});
```

</details>

---

<details>
<summary>Todo Service Lambda Handlers</summary>

```typescript
import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { 
  addTodoHandler, 
  getTodoHandler, 
  listTodosHandler, 
  updateTodoHandler, 
  deleteTodoHandler 
} from '../src/handlers';
import { TodoService } from '../src/services/TodoService';
import { TodoItem } from '../src/models/TodoItem';
import { Status } from '../src/models/Status';

// Mock the TodoService
jest.mock('../src/services/TodoService');

describe('Lambda Handlers', () => {
  let mockTodoService: jest.Mocked<TodoService>;
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Setup TodoService mock
    mockTodoService = new TodoService({} as any) as jest.Mocked<TodoService>;
    
    // Replace the TodoService instance in the handlers module
    (TodoService as jest.Mock).mockImplementation(() => mockTodoService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('addTodoHandler', () => {
    it('should return 201 status code with todo item when successful', async () => {
      // Arrange
      const mockTodoItem: TodoItem = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Todo',
        description: 'This is a test todo item',
        status: Status.PENDING,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          title: 'Test Todo',
          description: 'This is a test todo item'
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/todos',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.addTodo.mockResolvedValue(mockTodoItem);
      
      // Act
      const result = await addTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(mockTodoItem);
      expect(mockTodoService.addTodo).toHaveBeenCalledWith('Test Todo', 'This is a test todo item');
    });
    
    it('should return 400 status code when request body is invalid', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: 'invalid-json',
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/todos',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      // Act
      const result = await addTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Invalid request body'
      });
    });
    
    it('should return 400 status code when required fields are missing', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          // Missing title and description
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/todos',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      // Act
      const result = await addTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Title and description are required'
      });
    });
    
    it('should return 500 status code when service throws an error', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          title: 'Test Todo',
          description: 'This is a test todo item'
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/todos',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.addTodo.mockRejectedValue(new Error('Service error'));
      
      // Act
      const result = await addTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Error creating todo item'
      });
    });
  });

  describe('getTodoHandler', () => {
    it('should return 200 status code with todo item when successful', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const mockTodoItem: TodoItem = {
        id: todoId,
        title: 'Test Todo',
        description: 'This is a test todo item',
        status: Status.PENDING,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: `/todos/${todoId}`,
        pathParameters: {
          id: todoId
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.getTodo.mockResolvedValue(mockTodoItem);
      
      // Act
      const result = await getTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockTodoItem);
      expect(mockTodoService.getTodo).toHaveBeenCalledWith(todoId);
    });
    
    it('should return 404 status code when todo item is not found', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: `/todos/${todoId}`,
        pathParameters: {
          id: todoId
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.getTodo.mockRejectedValue(new Error(`Todo item with id ${todoId} not found`));
      
      // Act
      const result = await getTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        message: `Todo item with id ${todoId} not found`
      });
    });
    
    it('should return 400 status code when id parameter is missing', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: '/todos/',
        pathParameters: null, // Missing id parameter
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      // Act
      const result = await getTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Todo id is required'
      });
    });
    
    it('should return 500 status code when service throws an unexpected error', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: `/todos/${todoId}`,
        pathParameters: {
          id: todoId
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.getTodo.mockRejectedValue(new Error('Unexpected error'));
      
      // Act
      const result = await getTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Error retrieving todo item'
      });
    });
  });

  describe('listTodosHandler', () => {
    it('should return 200 status code with todo items when successful', async () => {
      // Arrange
      const mockTodoItems: TodoItem[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Todo 1',
          description: 'This is test todo item 1',
          status: Status.PENDING,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          title: 'Test Todo 2',
          description: 'This is test todo item 2',
          status: Status.IN_PROGRESS,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ];
      
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: '/todos',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.listTodos.mockResolvedValue(mockTodoItems);
      
      // Act
      const result = await listTodosHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockTodoItems);
      expect(mockTodoService.listTodos).toHaveBeenCalled();
    });
    
    it('should return 200 status code with empty array when no todo items exist', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: '/todos',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.listTodos.mockResolvedValue([]);
      
      // Act
      const result = await listTodosHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual([]);
    });
    
    it('should return 500 status code when service throws an error', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'GET',
        isBase64Encoded: false,
        path: '/todos',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.listTodos.mockRejectedValue(new Error('Service error'));
      
      // Act
      const result = await listTodosHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Error listing todo items'
      });
    });
  });

  describe('updateTodoHandler', () => {
    it('should return 200 status code with updated todo item when successful', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = Status.COMPLETED;
      
      const mockUpdatedTodoItem: TodoItem = {
        id: todoId,
        title: 'Test Todo',
        description: 'This is a test todo item',
        status: newStatus,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          status: newStatus
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: `/todos/${todoId}`,
        pathParameters: {
          id: todoId
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.updateTodo.mockResolvedValue(mockUpdatedTodoItem);
      
      // Act
      const result = await updateTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(mockUpdatedTodoItem);
      expect(mockTodoService.updateTodo).toHaveBeenCalledWith(todoId, newStatus);
    });
    
    it('should return 400 status code when request body is invalid', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: 'invalid-json',
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/todos/',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      // Act
      const result = await updateTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Invalid request body'
      });
    });
    
    it('should return 400 status code when required fields are missing', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          // Missing status
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: '/todos/',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      // Act
      const result = await updateTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Status is required'
      });
    });
    
    it('should return 404 status code when todo item is not found', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = Status.COMPLETED;
      
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          status: newStatus
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: `/todos/${todoId}`,
        pathParameters: {
          id: todoId
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.updateTodo.mockRejectedValue(new Error(`Todo item with id ${todoId} not found`));
      
      // Act
      const result = await updateTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        message: `Todo item with id ${todoId} not found`
      });
    });
    
    it('should return 500 status code when service throws an error', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = Status.COMPLETED;
      const mockError = new Error('Service error');
      
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          status: newStatus
        }),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'PUT',
        isBase64Encoded: false,
        path: `/todos/${todoId}`,
        pathParameters: {
          id: todoId
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.updateTodo.mockRejectedValue(mockError);
      
      // Act
      const result = await updateTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Error updating todo item'
      });
    });
  });

  describe('deleteTodoHandler', () => {
    it('should return 204 status code when successful', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'DELETE',
        isBase64Encoded: false,
        path: `/todos/${todoId}`,
        pathParameters: {
          id: todoId
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.deleteTodo.mockResolvedValue({});
      
      // Act
      const result = await deleteTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
      expect(mockTodoService.deleteTodo).toHaveBeenCalledWith(todoId);
    });
    
    it('should return 400 status code when id parameter is missing', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'DELETE',
        isBase64Encoded: false,
        path: '/todos/',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      // Act
      const result = await deleteTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Todo id is required'
      });
    });
    
    it('should return 500 status code when service throws an error', async () => {
      // Arrange
      const todoId = '123e4567-e89b-12d3-a456-426614174000';
      const mockError = new Error('Service error');
      
      const event: APIGatewayProxyEvent = {
        body: null,
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'DELETE',
        isBase64Encoded: false,
        path: `/todos/${todoId}`,
        pathParameters: {
          id: todoId
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };
      
      mockTodoService.deleteTodo.mockRejectedValue(mockError);
      
      // Act
      const result = await deleteTodoHandler(event, {} as Context);
      
      // Assert
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Error deleting todo item'
      });
    });
  });
});
```

</details>

---

<details>
<summary>Using this test suite</summary>

To use this test suite for your Todo service, you'll need either a local
Node.js environment or Docker. I recommend using Docker for consistent
environments across all developers, and to avoid having to install all
the dependencies on your laptop.

<div style="margin-left: 20px">
<details>
<summary>Option 1: Using Docker (Recommended)</summary>

1. **Create the necessary configuration files**:

   First, create `package.json`:

<div style="margin-left: 40px">
<details>
<summary><tt>package.json</tt></summary>

   ```json
   {
     "name": "todo-service",
     "version": "1.0.0",
     "description": "Todo Service with AWS Lambda and DynamoDB",
     "main": "dist/handlers.js",
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "build": "tsc",
       "clean": "rm -rf dist"
     },
     "devDependencies": {
       "@types/aws-lambda": "^8.10.130",
       "@types/jest": "^29.5.11",
       "@types/node": "^20.10.5",
       "@types/uuid": "^9.0.7",
       "jest": "^29.7.0",
       "ts-jest": "^29.1.1",
       "typescript": "^5.3.3"
     },
     "dependencies": {
       "@aws-sdk/client-dynamodb": "^3.485.0",
       "@aws-sdk/lib-dynamodb": "^3.485.0",
       "uuid": "^9.0.1"
     }
   }
   ```

</details>
</div>



2. **Create docker-compose.yml**:

<div style="margin-left: 40px">
<details>
<summary><tt>docker-compose.yml</tt></summary>

   ```yaml
   version: '3.8'
   services:
     test:
       image: node:20-slim
       volumes:
         - .:/app
       working_dir: /app
       environment:
         - NODE_ENV=test
         - CI=true
       command: bash -c "npm install && npm test"
   ```

</details>
</div>

3. **Run the test suite**:
   ```bash
   docker-compose run test
   ```
</details>
</div>

<div style="margin-left: 20px">
<details>
<summary>Option 2: Local Node.js Setup</summary>

1. **Set up a Node.js project** (if you don't have one already):
   ```bash
   mkdir todo-service
   cd todo-service
   npm init -y
   ```

2. **Install TypeScript and configure it**:
   ```bash
   npm install typescript --save-dev
   npx tsc --init
   ```

3. **Install the required dependencies**:
   ```bash
   npm install aws-sdk @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
   ```

4. **Install Jest and testing dependencies**:
   ```bash
   npm install --save-dev jest @types/jest ts-jest @types/aws-lambda @types/uuid
   ```

5. **Configure Jest** by creating a `jest.config.js` file:
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/tests'],
     testMatch: ['**/*.test.ts'],
     verbose: true
   };
   ```

6. **Set up your project structure**:
   ```
   src/
     models/
       Status.ts
       TodoItem.ts
     services/
       TodoService.ts
     handlers.ts
   tests/
     todo-service.test.ts
     lambda-handlers.test.ts
   ```

7. **Add scripts to your package.json**:
   ```json
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch",
     "build": "tsc"
   }
   ```

8. **Create the model files** that match the SysML specification:
   - For `Status.ts`, create an enum with PENDING, IN_PROGRESS, and COMPLETED
   - For `TodoItem.ts`, create an interface with the properties defined in your SysML

9. **Create stub implementations** of the TodoService and Lambda handlers so the tests have something to reference

10. **Copy the test files** from the artifacts provided into your test directory

The tests are designed to work with mocked AWS services, so you don't need actual DynamoDB access to run them. As you implement your actual service and handlers, these tests will help guide your development in a test-driven approach.

</details>
</div>

---

</details>

---

## How can a LLM help me implement this design?

Now that we've got a test suite ready, we can move on to implementing
the system.

I handed `todo.sysml` to Claude.AI and asked the following prompts:

### What are my options for implementing the system described here?

Looking at your SysML model for a Todo service, I see you have a
well-structured definition of a basic task management system. Let me outline
several implementation options for you. Your choice would depend on factors
like expected scale, integration requirements, performance needs, and your
team's expertise.

#### 1. REST API Service

You could implement this as a RESTful web service with endpoints that map directly to your operations:
- `POST /todos` for `addTodo`
- `GET /todos/{id}` for `getTodo`
- `GET /todos` for `listTodos`
- `PUT /todos/{id}` for `updateTodo`
- `DELETE /todos/{id}` for `deleteTodo`

This would work well with frameworks like Spring Boot (Java), Express.js (Node.js), Django/Flask (Python), or ASP.NET Core (C#).

#### 2. Microservice Architecture

Your TodoService could be implemented as a standalone microservice, potentially with:
- A separate database for storing TodoItems
- Message queue integration for async operations
- API gateway for client interaction
- Service discovery and configuration management

#### 3. Serverless Implementation

The operations could be mapped to serverless functions (AWS Lambda, Azure Functions, Google Cloud Functions):
- Each action becomes a separate function
- DynamoDB or similar for storing TodoItems
- API Gateway to expose endpoints

#### 4. Desktop/Mobile Application

You could create a standalone desktop or mobile app:
- Local database for TodoItems (SQLite, Realm, etc.)
- GUI components corresponding to each operation
- Local notifications for due dates or status changes

#### 5. Database-Centric Implementation

A database-first approach where:
- TodoItems are stored in a table/collection
- Operations are implemented as stored procedures or ORM methods
- Business logic lives close to the data

#### 6. Event-Driven Architecture

An event-based system where:
- Actions publish events (TodoCreated, TodoUpdated, etc.)
- Services subscribe to relevant events
- Event store maintains history of all changes

### Show me what I might do to implement with AWS Lambda and DynamoDB.

I'll create a blueprint for implementing your Todo service using AWS
Lambda and DynamoDB. This serverless approach will give you scalability
and minimal maintenance overhead.

#### Components

1. **Lambda Functions**: Each operation in your TodoService is implemented as a separate Lambda function:
   - `addTodo` - Creates a new todo item
   - `getTodo` - Retrieves a specific todo item by ID
   - `listTodos` - Lists all todo items
   - `updateTodo` - Updates a todo item's status
   - `deleteTodo` - Deletes a todo item

2. **DynamoDB Table**: A single table stores all todo items with the structure matching your SysML model:
   - Partition key: `id` (UUID)
   - Other attributes: title, description, status, createdAt, updatedAt

3. **API Gateway**: Exposes RESTful endpoints that map to your Lambda functions:
   - `POST /todos` → addTodo
   - `GET /todos` → listTodos
   - `GET /todos/{id}` → getTodo
   - `PUT /todos/{id}` → updateTodo
   - `DELETE /todos/{id}` → deleteTodo

4. **Infrastructure as Code**: Using AWS CDK to define and provision all resources

---

<details>
<summary>AWS Lambda & DynamoDB Todo Service Implementation</summary>

```javascript
// AWS Lambda implementation for Todo Service using TypeScript
// This implementation uses AWS SDK v3 for DynamoDB

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  UpdateCommand, 
  DeleteCommand 
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

// Define the TodoItem interface based on the SysML model
interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

// Initialize DynamoDB clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TODO_TABLE_NAME || 'TodoItems';

// Implement the addTodo operation
export const addTodo = async (event: any) => {
  try {
    const requestBody = JSON.parse(event.body);
    const { title, description } = requestBody;
    
    if (!title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Title is required' })
      };
    }
    
    const timestamp = new Date().toISOString();
    const newTodo: TodoItem = {
      id: uuidv4(),
      title,
      description: description || '',
      status: 'PENDING',
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: newTodo
    }));
    
    return {
      statusCode: 201,
      body: JSON.stringify(newTodo)
    };
  } catch (error) {
    console.error('Error creating todo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating todo item' })
    };
  }
};

// Implement the getTodo operation
export const getTodo = async (event: any) => {
  try {
    const id = event.pathParameters?.id;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'ID is required' })
      };
    }
    
    const result = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id }
    }));
    
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Todo item not found' })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error('Error retrieving todo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error retrieving todo item' })
    };
  }
};

// Implement the listTodos operation
export const listTodos = async () => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || [])
    };
  } catch (error) {
    console.error('Error listing todos:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error listing todo items' })
    };
  }
};

// Implement the updateTodo operation
export const updateTodo = async (event: any) => {
  try {
    const id = event.pathParameters?.id;
    const requestBody = JSON.parse(event.body);
    const { status } = requestBody;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'ID is required' })
      };
    }
    
    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid status value' })
      };
    }
    
    const timestamp = new Date().toISOString();
    
    const result = await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': timestamp
      },
      ReturnValues: 'ALL_NEW'
    }));
    
    if (!result.Attributes) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Todo item not found' })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    console.error('Error updating todo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating todo item' })
    };
  }
};

// Implement the deleteTodo operation
export const deleteTodo = async (event: any) => {
  try {
    const id = event.pathParameters?.id;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'ID is required' })
      };
    }
    
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: { id }
    }));
    
    return {
      statusCode: 204,
      body: ''
    };
  } catch (error) {
    console.error('Error deleting todo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting todo item' })
    };
  }
};
```

</details>

---

<details>
<summary>AWS CDK Infrastructure as Code</summary>

CDK and CloudFormation are related but different AWS tools for infrastructure as code:

**AWS CloudFormation**:
- A declarative templating service that uses JSON or YAML to define AWS resources
- The templates describe the desired end state of your infrastructure
- Has been around longer and is more mature
- Templates can be verbose and difficult to maintain for complex infrastructures

**AWS CDK (Cloud Development Kit)**:
- A higher-level abstraction built on top of CloudFormation
- Allows you to define infrastructure using familiar programming languages (TypeScript, JavaScript, Python, Java, C#, Go)
- Under the hood, CDK synthesizes your code into CloudFormation templates
- Includes constructs (reusable components) that make infrastructure definition more concise
- Enables use of programming language features like loops, conditions, and functions
- Helps catch errors at development time rather than deployment time

In the implementation I provided, I used CDK because it offers more flexibility and better developer experience, especially with TypeScript. The CDK code defines all the AWS resources (Lambda functions, DynamoDB table, API Gateway, IAM roles) in a programmable way.

When you run `cdk deploy`, the CDK code is converted to CloudFormation templates behind the scenes, and those templates are used to create or update your AWS resources.

Think of it this way: CloudFormation is the engine, and CDK is a more developer-friendly interface to that engine.

```typescript
// AWS CDK code for provisioning the infrastructure
// This file defines the DynamoDB table and Lambda functions

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TodoServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const todoTable = new dynamodb.Table(this, 'TodoItems', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOTE: For production, consider RETAIN
      pointInTimeRecovery: true,
    });

    // Create Lambda functions
    const todoLambdaRole = new iam.Role(this, 'TodoLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant the Lambda role read/write access to the DynamoDB table
    todoTable.grantReadWriteData(todoLambdaRole);

    // Common Lambda configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_18_X,
      role: todoLambdaRole,
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    };

    // Create Lambda for each operation
    const addTodoLambda = new lambda.Function(this, 'AddTodoFunction', {
      ...lambdaConfig,
      handler: 'index.addTodo',
      code: lambda.Code.fromAsset('dist'),
    });

    const getTodoLambda = new lambda.Function(this, 'GetTodoFunction', {
      ...lambdaConfig,
      handler: 'index.getTodo',
      code: lambda.Code.fromAsset('dist'),
    });

    const listTodosLambda = new lambda.Function(this, 'ListTodosFunction', {
      ...lambdaConfig,
      handler: 'index.listTodos',
      code: lambda.Code.fromAsset('dist'),
    });

    const updateTodoLambda = new lambda.Function(this, 'UpdateTodoFunction', {
      ...lambdaConfig,
      handler: 'index.updateTodo',
      code: lambda.Code.fromAsset('dist'),
    });

    const deleteTodoLambda = new lambda.Function(this, 'DeleteTodoFunction', {
      ...lambdaConfig,
      handler: 'index.deleteTodo',
      code: lambda.Code.fromAsset('dist'),
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'TodoServiceApi', {
      restApiName: 'Todo Service API',
      description: 'API for managing todo items',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create resources and methods
    const todosResource = api.root.addResource('todos');
    
    // POST /todos - Add a new todo
    todosResource.addMethod('POST', new apigateway.LambdaIntegration(addTodoLambda));
    
    // GET /todos - List all todos
    todosResource.addMethod('GET', new apigateway.LambdaIntegration(listTodosLambda));
    
    // Operations on a specific todo
    const todoResource = todosResource.addResource('{id}');
    
    // GET /todos/{id} - Get a specific todo
    todoResource.addMethod('GET', new apigateway.LambdaIntegration(getTodoLambda));
    
    // PUT /todos/{id} - Update a todo
    todoResource.addMethod('PUT', new apigateway.LambdaIntegration(updateTodoLambda));
    
    // DELETE /todos/{id} - Delete a todo
    todoResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTodoLambda));

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the Todo Service API',
    });
  }
}
```

</details>

---

<details>
<summary>DynamoDB Table Schema</summary>

```typescript
{
  "TableName": "TodoItems",
  "KeySchema": [
    {
      "AttributeName": "id",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "id",
      "AttributeType": "S"
    }
  ],
  "BillingMode": "PAY_PER_REQUEST",
  "DeletionProtectionEnabled": false,
  "PointInTimeRecoverySpecification": {
    "PointInTimeRecoveryEnabled": true
  },
  "StreamSpecification": {
    "StreamEnabled": false
  },
  "SSESpecification": {
    "Enabled": true,
    "SSEType": "KMS"
  },
  "Tags": [
    {
      "Key": "Environment",
      "Value": "Development"
    },
    {
      "Key": "Service",
      "Value": "TodoService"
    }
  ]
}
```

</details>

---

Based on your SysML model, I've created a comprehensive implementation using AWS Lambda and DynamoDB. This serverless architecture provides excellent scalability, low maintenance overhead, and a pay-per-use cost model.

#### Deployment Steps

1. **Set up your development environment**:
   ```bash
   npm install -g aws-cdk
   mkdir todo-service && cd todo-service
   cdk init app --language typescript
   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
   ```

2. **Copy the code from the artifacts**:
   - Lambda implementation (TypeScript)
   - CDK infrastructure code
   - DynamoDB schema

3. **Build and deploy**:
   ```bash
   npm run build
   cdk deploy
   ```

#### Advantages of This Approach

- **Scalability**: Automatically scales with request volume
- **Cost-effective**: Pay only for actual usage
- **Low maintenance**: No servers to manage
- **High availability**: Built on AWS's highly available infrastructure
- **Security**: Fine-grained IAM permissions for each function
- **Easy deployment**: One command to deploy the entire stack

#### Potential Enhancements

1. **Authentication**: Add AWS Cognito or API Gateway authorizers
2. **Pagination**: Implement pagination for the listTodos operation
3. **Advanced filtering**: Add capabilities to filter by status, date range, etc.
4. **Logging and monitoring**: Set up CloudWatch alarms and logs
5. **CI/CD pipeline**: Automate testing and deployment with AWS CodePipeline
