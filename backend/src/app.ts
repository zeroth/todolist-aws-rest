import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import { todoRouter } from './routes/todos';
import { partnerRouter } from './routes/partner';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Debug environment variables
console.log('Environment Variables:', {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? '***' : undefined,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '***' : undefined,
  tableName: process.env.TODOS_TABLE_NAME,
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_CLIENT_ID
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/todos', authMiddleware, todoRouter);
app.use('/api/partner', partnerRouter);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app; 