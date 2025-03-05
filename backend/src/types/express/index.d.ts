import { CognitoJwtPayload } from 'aws-jwt-verify/jwt-model';

declare global {
  namespace Express {
    interface Request {
      user?: CognitoJwtPayload;
    }
  }
} 