import { post, get, put, del } from 'aws-amplify/api';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo';

export const todoService = {
  async getTodos(): Promise<Todo[]> {
    const response = await get({
      apiName: 'todos',
      path: '/todos',
    });
    return response as unknown as Todo[];
  },

  async createTodo(todo: CreateTodoInput): Promise<Todo> {
    const response = await post({
      apiName: 'todos',
      path: '/todos',
      options: {
        body: JSON.stringify(todo),
      },
    });
    return response as unknown as Todo;
  },

  async updateTodo(todoId: string, todo: UpdateTodoInput): Promise<Todo> {
    const response = await put({
      apiName: 'todos',
      path: `/todos/${todoId}`,
      options: {
        body: JSON.stringify(todo),
      },
    });
    return response as unknown as Todo;
  },

  async deleteTodo(todoId: string): Promise<void> {
    await del({
      apiName: 'todos',
      path: `/todos/${todoId}`,
    });
  },
}; 