import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TodoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for todos
    const todosTable = new dynamodb.Table(this, 'TodosTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'todoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      pointInTimeRecovery: true,
    });

    // Create Cognito User Pool for regular users
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'todo-app-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // Create Cognito App Client for regular users
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'todo-app-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ['http://localhost:3000'],
        logoutUrls: ['http://localhost:3000'],
      },
    });

    // Create Cognito User Pool for partner API
    const partnerUserPool = new cognito.UserPool(this, 'PartnerUserPool', {
      userPoolName: 'todo-app-partner-pool',
      selfSignUpEnabled: false,
      signInAliases: {
        email: false,
        username: false,
      },
      standardAttributes: {
        email: {
          required: false,
          mutable: false,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.NONE,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // Create Cognito App Client for partner API
    const partnerUserPoolClient = new cognito.UserPoolClient(this, 'PartnerUserPoolClient', {
      userPool: partnerUserPool,
      userPoolClientName: 'todo-app-partner-client',
      authFlows: {
        userPassword: false,
        userSrp: true,
      },
      oAuth: {
        flows: {
          clientCredentials: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
        ],
      },
    });

    // Create IAM role for the backend Lambda function
    const backendRole = new iam.Role(this, 'BackendRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // Grant DynamoDB permissions to the backend role
    todosTable.grantReadWriteData(backendRole);

    // Grant Cognito permissions to the backend role
    userPool.grant(backendRole, 'cognito-idp:AdminInitiateAuth');
    userPool.grant(backendRole, 'cognito-idp:AdminCreateUser');
    userPool.grant(backendRole, 'cognito-idp:AdminConfirmSignUp');
    partnerUserPool.grant(backendRole, 'cognito-idp:AdminInitiateAuth');

    // Output the important values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'PartnerUserPoolId', {
      value: partnerUserPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'PartnerUserPoolClientId', {
      value: partnerUserPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'TodosTableName', {
      value: todosTable.tableName,
    });
  }
} 