import { Router } from 'express';

const router = Router();

// No routes needed as authentication and profile fetching 
// are handled directly by Cognito through AWS Amplify

export const authRouter = router; 