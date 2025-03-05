import { Router } from 'express';
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AppError } from '../utils/AppError';

const router = Router();
const cognitoClient = new CognitoIdentityProviderClient({});

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error('Missing required Cognito configuration');
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const signUpCommand = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
      ],
    });

    await cognitoClient.send(signUpCommand);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please check your email for verification code.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/confirm', async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const confirmSignUpCommand = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
    });

    await cognitoClient.send(confirmSignUpCommand);

    res.json({
      status: 'success',
      message: 'Email confirmed successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const initiateAuthCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
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
      },
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router; 