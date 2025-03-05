import { Router } from 'express';
import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { AppError } from '../utils/AppError';

const router = Router();
const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const partnerUserPoolId = process.env.PARTNER_COGNITO_USER_POOL_ID;
const partnerClientId = process.env.PARTNER_COGNITO_CLIENT_ID;
const TABLE_NAME = process.env.TODOS_TABLE_NAME;

if (!partnerUserPoolId || !partnerClientId || !TABLE_NAME) {
  throw new Error('Missing required configuration');
}

// Get partner access token
router.post('/auth/token', async (req, res, next) => {
  try {
    const { partnerId, partnerSecret } = req.body;

    if (!partnerId || !partnerSecret) {
      throw new AppError('Missing partner credentials', 400);
    }

    // In a real application, you would validate the partner credentials against your database
    // and ensure the partner is authorized to use the API

    const initiateAuthCommand = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_SRP_AUTH,
      ClientId: partnerClientId,
      AuthParameters: {
        CLIENT_ID: partnerId,
        CLIENT_SECRET: partnerSecret,
      },
    });

    const response = await cognitoClient.send(initiateAuthCommand);

    if (!response.AuthenticationResult) {
      throw new AppError('Authentication failed', 401);
    }

    res.json({
      status: 'success',
      data: {
        accessToken: response.AuthenticationResult.AccessToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create a todo on behalf of a partner
router.post('/todos', async (req, res, next) => {
  try {
    const { userId, title, description, dueDate } = req.body;

    if (!userId || !title) {
      throw new AppError('Missing required fields', 400);
    }

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
        createdBy: 'PARTNER',
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

export const partnerRouter = router; 