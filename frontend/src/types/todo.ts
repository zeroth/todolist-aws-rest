export interface Todo {
  userId: string;
  todoId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description: string;
  dueDate: string;
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  status?: 'PENDING' | 'COMPLETED';
}
