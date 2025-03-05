# Cognito-Protected Todo List Application

A full-stack todo list application with user authentication and partner API integration using AWS Cognito.

## Features

- User authentication with AWS Cognito
- Partner API integration with OAuth refresh token flow
- RESTful API backend
- React-based frontend
- Infrastructure as Code using AWS CDK

## Project Structure

```
.
├── backend/           # Node.js Express backend
├── frontend/         # React TypeScript frontend
├── infrastructure/   # AWS CDK infrastructure code
└── docs/            # Project documentation
```

## Prerequisites

- Node.js (v18 or later)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI
- Git

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install

   # Install infrastructure dependencies
   cd ../infrastructure
   npm install
   ```

3. Set up AWS Cognito:
   - Deploy the infrastructure using AWS CDK
   - Configure Cognito User Pools and App Clients

4. Configure environment variables:
   - Copy `.env.example` to `.env` in both backend and frontend directories
   - Update the variables with your AWS Cognito configuration

5. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm start
   ```

## API Documentation

### User Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Todo Endpoints

- `GET /api/todos` - Get all todos for authenticated user
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo

### Partner API Endpoints

- `POST /api/partner/auth/token` - Get partner access token
- `POST /api/partner/todos` - Create a todo on behalf of a partner

## Security

- User authentication is handled by AWS Cognito User Pool
- Partner API authentication uses OAuth refresh token flow
- All API endpoints are protected with appropriate authentication
- Infrastructure is managed using AWS CDK for consistent deployment

## License

MIT 