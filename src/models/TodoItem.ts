import { Status } from './Status';

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
} 