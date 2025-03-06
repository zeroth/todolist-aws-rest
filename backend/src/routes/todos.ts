import { Router } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AppError } from '../utils/AppError';

// if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
//   throw new Error('AWS credentials or region not configured');
// }

const router = Router();

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ''
  }
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Get all todos for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    // Debug logging
    // console.log('AWS Configuration:', {
    //   region: process.env.AWS_REGION,
    //   accessKeyId: process.env.AWS_ACCESS_KEY_ID ? '***' : undefined,
    //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '***' : undefined,
    //   tableName: process.env.TODOS_TABLE_NAME
    // });

    const TABLE_NAME = process.env.TODOS_TABLE_NAME;
    if (!TABLE_NAME) {
      throw new AppError('Missing TODOS_TABLE_NAME environment variable', 500);
    }

    const userId = req.user?.sub;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const result = await docClient.send(queryCommand);
    console.log('todolist result', result);
    res.json({
      status: 'success',
      data: result.Items || [],
    });
  } catch (error) {
    next(error);
  }
});

// Create a new todo
router.post('/', async (req, res, next) => {
  try {
    const TABLE_NAME = process.env.TODOS_TABLE_NAME;
    if (!TABLE_NAME) {
      throw new AppError('Missing TODOS_TABLE_NAME environment variable', 500);
    }

    const userId = req.user?.sub;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { title, description, dueDate } = req.body;
    const todoId = Date.now().toString();

    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        todoId,
        title,
        description,
        dueDate,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(putCommand);

    res.status(201).json({
      status: 'success',
      data: {
        userId,
        todoId,
        title,
        description,
        dueDate,
        status: 'PENDING',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update a todo
router.put('/:todoId', async (req, res, next) => {
  try {
    const TABLE_NAME = process.env.TODOS_TABLE_NAME;
    if (!TABLE_NAME) {
      throw new AppError('Missing TODOS_TABLE_NAME environment variable', 500);
    }

    const userId = req.user?.sub;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { todoId } = req.params;
    const { title, description, dueDate, status } = req.body;

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        todoId,
      },
      UpdateExpression: 'SET #title = :title, #description = :description, #dueDate = :dueDate, #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#description': 'description',
        '#dueDate': 'dueDate',
        '#status': 'status',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':title': title,
        ':description': description,
        ':dueDate': dueDate,
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(updateCommand);

    res.json({
      status: 'success',
      data: result.Attributes,
    });
  } catch (error) {
    next(error);
  }
});

// Delete a todo
router.delete('/:todoId', async (req, res, next) => {
  try {
    const TABLE_NAME = process.env.TODOS_TABLE_NAME;
    if (!TABLE_NAME) {
      throw new AppError('Missing TODOS_TABLE_NAME environment variable', 500);
    }

    const userId = req.user?.sub;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { todoId } = req.params;

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        todoId,
      },
    });

    await docClient.send(deleteCommand);

    res.json({
      status: 'success',
      message: 'Todo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export const todoRouter = router; 