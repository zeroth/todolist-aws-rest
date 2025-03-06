import { post, get, put, del } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../types/todo';

const getAuthHeader = async () => {
  const session = await fetchAuthSession();
  return {
    Authorization: `Bearer ${session.tokens?.accessToken.toString()}`
  };
};

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const todoService = {
  async getTodos(): Promise<Todo[]> {
    const headers = await getAuthHeader();
    console.log('Fetching todos with headers:', headers);
    const responseWrapper = await get({
      apiName: 'todos',
      path: '/todos',
      options: {
        headers
      }
    });
    console.log('Response wrapper:', responseWrapper);
    const response = await responseWrapper.response;
    const jsonResponse = (await response.body.json() as unknown) as ApiResponse<Todo[]>;
    console.log('Actual response:', jsonResponse);
    return jsonResponse.data || [];
  },

  async createTodo(todo: CreateTodoInput): Promise<Todo> {
    const headers = await getAuthHeader();
    const responseWrapper = await post({
      apiName: 'todos',
      path: '/todos',
      options: {
        headers,
        body: todo as Record<string, any>,
      },
    });
    const response = await responseWrapper.response;
    const jsonResponse = (await response.body.json() as unknown) as ApiResponse<Todo>;
    return jsonResponse.data;
  },

  async updateTodo(todoId: string, todo: UpdateTodoInput): Promise<Todo> {
    const headers = await getAuthHeader();
    const responseWrapper = await put({
      apiName: 'todos',
      path: `/todos/${todoId}`,
      options: {
        headers,
        body: todo as Record<string, any>,
      },
    });
    const response = await responseWrapper.response;
    const jsonResponse = (await response.body.json() as unknown) as ApiResponse<Todo>;
    return jsonResponse.data;
  },

  async deleteTodo(todoId: string): Promise<void> {
    const headers = await getAuthHeader();
    const responseWrapper = await del({
      apiName: 'todos',
      path: `/todos/${todoId}`,
      options: {
        headers
      }
    });
    await responseWrapper.response;
  },
}; 