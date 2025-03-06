import { useState, useEffect } from 'react';
import { Todo, CreateTodoInput } from '../types/todo';
import { todoService } from '../services/todoService';
import { Button, TextField, Card, CardContent, Typography, Grid, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTodo, setNewTodo] = useState<CreateTodoInput>({
    title: '',
    description: '',
    dueDate: '',
  });
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    console.log('Current todos state:', todos);
    console.log('Loading state:', loading);
  }, [todos, loading]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoService.getTodos();
      console.log('Todos loaded:', data);
      setTodos(data);
    } catch (error) {
      console.error('Error loading todos:', error);
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdTodo = await todoService.createTodo(newTodo);
      setTodos([...todos, createdTodo]);
      setNewTodo({ title: '', description: '', dueDate: '' });
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleUpdateTodo = async (todoId: string, status: 'PENDING' | 'COMPLETED') => {
    try {
      const updatedTodo = await todoService.updateTodo(todoId, { status });
      setTodos(todos.map(todo =>
        todo.todoId === todoId ? updatedTodo : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await todoService.deleteTodo(todoId);
      setTodos(todos.filter(todo => todo.todoId !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleCreateTodo} style={{ marginBottom: '2rem' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Title"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Description"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              value={newTodo.dueDate}
              onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              style={{ height: '100%' }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </form>

      {loading && (
        <Typography>Loading todos...</Typography>
      )}

      {error && (
        <Typography color="error">{error}</Typography>
      )}

      <Grid container spacing={2}>
        {todos.length > 0 ? (
          todos.map((todo) => (
            <Grid item xs={12} key={todo.todoId}>
              <Card>
                <CardContent>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs>
                      <Typography variant="h6" style={{ textDecoration: todo.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                        {todo.title}
                      </Typography>
                      <Typography color="textSecondary">{todo.description}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Due: {todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'No due date'}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <IconButton
                        color={todo.status === 'COMPLETED' ? 'success' : 'default'}
                        onClick={() => handleUpdateTodo(todo.todoId, todo.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteTodo(todo.todoId)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography align="center" color="textSecondary">
              {loading ? 'Loading...' : 'No todos found'}
            </Typography>
          </Grid>
        )}
      </Grid>
    </div>
  );
}; 