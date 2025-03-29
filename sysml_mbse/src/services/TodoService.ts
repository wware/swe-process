import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TodoItem } from "../models/TodoItem";
import { Status } from "../models/Status";

export class TodoService {
  private dynamoDbClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(config: { dynamoDbClient: DynamoDBDocumentClient; tableName: string }) {
    this.dynamoDbClient = config.dynamoDbClient;
    this.tableName = config.tableName;
  }

  async addTodo(title: string, description: string): Promise<TodoItem> {
    throw new Error("Not implemented");
  }

  async getTodo(id: string): Promise<TodoItem> {
    throw new Error("Not implemented");
  }

  async listTodos(): Promise<TodoItem[]> {
    throw new Error("Not implemented");
  }

  async updateTodo(id: string, status: Status): Promise<TodoItem> {
    throw new Error("Not implemented");
  }

  async deleteTodo(id: string): Promise<void> {
    throw new Error("Not implemented");
  }
} 