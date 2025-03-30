import { 
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
  UpdateItemCommand,
  DeleteItemCommand
} from '@aws-sdk/client-dynamodb';
import { 
  marshall, 
  unmarshall
} from '@aws-sdk/util-dynamodb';
import { TodoItem, Status } from '../core/types';
import { TodoStorage } from '../core/interfaces';
import { NotFoundError, StorageError } from '../core/errors';
import { logger } from '../utils/logging';
import { formatIsoDate, parseIsoDate } from '../utils/date-utils';

/**
 * DynamoDB implementation of the TodoStorage interface
 * This is used for production
 */
export class DynamoStorage implements TodoStorage {
  private readonly client: DynamoDBClient;
  private readonly tableName: string;

  /**
   * Creates a new DynamoStorage
   * @param tableName The name of the DynamoDB table to use
   * @param region The AWS region to use
   */
  constructor(tableName: string, region: string = 'us-east-1') {
    this.client = new DynamoDBClient({ region });
    this.tableName = tableName;
    logger.info(`DynamoStorage initialized with table: ${tableName}, region: ${region}`);
  }

  /**
   * Creates a new todo item in the storage
   * @param item The todo item to create
   * @returns The created todo item
   */
  async createTodo(item: TodoItem): Promise<TodoItem> {
    try {
      // Transform the item for DynamoDB
      const dynamoItem = {
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        created_at: formatIsoDate(item.createdAt),
        updated_at: formatIsoDate(item.updatedAt)
      };

      // Create a PutItem command
      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(dynamoItem)
      });

      // Execute the command
      await this.client.send(command);

      logger.debug(`Todo created in DynamoDB: ${item.id}`);
      return item;
    } catch (error) {
      logger.error(`Failed to create todo in DynamoDB: ${item.id}`, { error });
      throw new StorageError('Failed to create todo in DynamoDB', error as Error);
    }
  }

  /**
   * Retrieves a todo item by its ID
   * @param id The ID of the todo item to retrieve
   * @returns The todo item if found, otherwise null
   */
  async getTodo(id: string): Promise<TodoItem | null> {
    try {
      // Create a GetItem command
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ id })
      });

      // Execute the command
      const response = await this.client.send(command);

      // If no item was found, return null
      if (!response.Item) {
        logger.debug(`Todo not found in DynamoDB: ${id}`);
        return null;
      }

      // Convert the DynamoDB item to a TodoItem
      const dynamoItem = unmarshall(response.Item);
      const todoItem: TodoItem = {
        id: dynamoItem.id,
        title: dynamoItem.title,
        description: dynamoItem.description,
        status: dynamoItem.status as Status,
        createdAt: parseIsoDate(dynamoItem.created_at),
        updatedAt: parseIsoDate(dynamoItem.updated_at)
      };

      logger.debug(`Todo retrieved from DynamoDB: ${id}`);
      return todoItem;
    } catch (error) {
      logger.error(`Failed to get todo from DynamoDB: ${id}`, { error });
      throw new StorageError('Failed to get todo from DynamoDB', error as Error);
    }
  }

  /**
   * Lists all todo items
   * @returns An array of todo items
   */
  async listTodos(): Promise<TodoItem[]> {
    try {
      // Create a Scan command
      const command = new ScanCommand({
        TableName: this.tableName
      });

      // Execute the command
      const response = await this.client.send(command);

      // If no items were found, return an empty array
      if (!response.Items || response.Items.length === 0) {
        logger.debug('No todos found in DynamoDB');
        return [];
      }

      // Convert the DynamoDB items to TodoItems
      const todoItems: TodoItem[] = response.Items.map(item => {
        const dynamoItem = unmarshall(item);
        return {
          id: dynamoItem.id,
          title: dynamoItem.title,
          description: dynamoItem.description,
          status: dynamoItem.status as Status,
          createdAt: parseIsoDate(dynamoItem.created_at),
          updatedAt: parseIsoDate(dynamoItem.updated_at)
        };
      });

      logger.debug(`Listed ${todoItems.length} todos from DynamoDB`);
      return todoItems;
    } catch (error) {
      logger.error('Failed to list todos from DynamoDB', { error });
      throw new StorageError('Failed to list todos from DynamoDB', error as Error);
    }
  }

  /**
   * Updates a todo item
   * @param item The todo item to update
   * @returns The updated todo item
   * @throws NotFoundError if the todo item is not found
   */
  async updateTodo(item: TodoItem): Promise<TodoItem> {
    try {
      // Check if the item exists
      const existingItem = await this.getTodo(item.id);
      if (!existingItem) {
        logger.warn(`Cannot update non-existent todo in DynamoDB: ${item.id}`);
        throw new NotFoundError('TodoItem', item.id);
      }

      // Create an UpdateItem command
      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ id: item.id }),
        UpdateExpression: 'SET title = :title, description = :description, #status = :status, updated_at = :updated_at',
        ExpressionAttributeNames: {
          '#status': 'status' // 'status' is a reserved word in DynamoDB
        },
        ExpressionAttributeValues: marshall({
          ':title': item.title,
          ':description': item.description,
          ':status': item.status,
          ':updated_at': formatIsoDate(item.updatedAt)
        }),
        ReturnValues: 'ALL_NEW'
      });

      // Execute the command
      await this.client.send(command);

      logger.debug(`Todo updated in DynamoDB: ${item.id}`);
      return item;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(`Failed to update todo in DynamoDB: ${item.id}`, { error });
      throw new StorageError('Failed to update todo in DynamoDB', error as Error);
    }
  }

  /**
   * Deletes a todo item by its ID
   * @param id The ID of the todo item to delete
   * @throws NotFoundError if the todo item is not found
   */
  async deleteTodo(id: string): Promise<void> {
    try {
      // Check if the item exists
      const existingItem = await this.getTodo(id);
      if (!existingItem) {
        logger.warn(`Cannot delete non-existent todo in DynamoDB: ${id}`);
        throw new NotFoundError('TodoItem', id);
      }

      // Create a DeleteItem command
      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({ id })
      });

      // Execute the command
      await this.client.send(command);

      logger.debug(`Todo deleted from DynamoDB: ${id}`);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(`Failed to delete todo from DynamoDB: ${id}`, { error });
      throw new StorageError('Failed to delete todo from DynamoDB', error as Error);
    }
  }
}
