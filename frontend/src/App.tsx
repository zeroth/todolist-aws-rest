import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import { TodoList } from './components/TodoList';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Authenticator>
        {({ signOut, user }) => (
          <div className="App">
            <header className="App-header">
              <h1>Welcome {user?.username}</h1>
              <button onClick={signOut}>Sign Out</button>
            </header>
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
              <TodoList />
            </main>
          </div>
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App;
