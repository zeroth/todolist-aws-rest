import { Router } from 'express';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AppError } from '../utils/AppError';

const router = Router();
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.TODOS_TABLE_NAME;
if (!TABLE_NAME) {
  throw new Error('Missing TODOS_TABLE_NAME environment variable');
}

// Get all todos for the authenticated user
router.get('/', async (req, res, next) => {
  try {
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

    res.json({
      status: 'success',
      data: result.Items,
    });
  } catch (error) {
    next(error);
  }
});

// Create a new todo
router.post('/', async (req, res, next) => {
  try {
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