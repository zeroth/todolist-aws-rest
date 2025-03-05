import { Router } from 'express';
import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { AppError } from '../utils/AppError';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

const router = Router();
const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const partnerUserPoolId = process.env.PARTNER_COGNITO_USER_POOL_ID;
const partnerClientId = process.env.PARTNER_COGNITO_CLIENT_ID;
const TABLE_NAME = process.env.TODOS_TABLE_NAME;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!partnerUserPoolId || !partnerClientId || !TABLE_NAME || !ADMIN_API_KEY) {
  throw new Error('Missing required configuration');
}

// Admin middleware to protect partner registration
const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== ADMIN_API_KEY) {
    throw new AppError('Unauthorized', 401);
  }
  next();
};

// Get partner access token
router.post('/auth/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partnerId, partnerSecret, refreshToken } = req.body;

    // Handle refresh token flow
    if (refreshToken) {
      const refreshAuthCommand = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: partnerClientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await cognitoClient.send(refreshAuthCommand);

      if (!response.AuthenticationResult) {
        throw new AppError('Token refresh failed', 401);
      }

      return res.json({
        status: 'success',
        data: {
          accessToken: response.AuthenticationResult.AccessToken,
          refreshToken: response.AuthenticationResult.RefreshToken || refreshToken,
          expiresIn: response.AuthenticationResult.ExpiresIn,
        },
      });
    }

    // Handle initial authentication
    if (!partnerId || !partnerSecret) {
      throw new AppError('Missing partner credentials', 400);
    }

    const initiateAuthCommand = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: partnerClientId,
      AuthParameters: {
        USERNAME: partnerId,
        PASSWORD: partnerSecret,
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
        refreshToken: response.AuthenticationResult.RefreshToken,
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

// Register new partner
router.post('/register', adminAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partnerId, email } = req.body;

    if (!partnerId || !email) {
      throw new AppError('Missing required fields: partnerId and email', 400);
    }

    // Generate username from partnerId hash
    const username = crypto.createHash('sha256')
      .update(partnerId)
      .digest('hex')
      .substring(0, 32);

    // Generate secure password
    const password = generateSecureSecret();

    // Create user in Cognito Partner User Pool
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: partnerUserPoolId,
      Username: username,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'custom:partnerId',
          Value: partnerId,
        }
      ],
      MessageAction: 'SUPPRESS' // Suppress welcome email
    });

    await cognitoClient.send(createUserCommand);

    // Set password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: partnerUserPoolId,
      Username: username,
      Password: password,
      Permanent: true
    });

    await cognitoClient.send(setPasswordCommand);

    res.status(201).json({
      status: 'success',
      data: {
        partnerId: username, // This is the username to use for authentication
        partnerSecret: password, // This is the password to use for authentication
        message: 'Store these credentials securely. They won\'t be shown again.'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate secure secret
function generateSecureSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const partnerRouter = router; 