import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TodoService } from './services/TodoService';
import { Status } from './models/Status';

export async function addTodoHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  throw new Error("Not implemented");
}

export async function getTodoHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  throw new Error("Not implemented");
}

export async function listTodosHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  throw new Error("Not implemented");
}

export async function updateTodoHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  throw new Error("Not implemented");
}

export async function deleteTodoHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  throw new Error("Not implemented");
} 