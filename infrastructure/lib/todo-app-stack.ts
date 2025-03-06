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
        userPassword: false,
        userSrp: true,
        adminUserPassword: false,
      },
      oAuth: {
        flows: {
          implicitCodeGrant: true,
          authorizationCodeGrant: true,
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

    // Create Cognito Domain for hosted UI
    const domain = userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: 'todo-app-auth',
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
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: false,
      },
      preventUserExistenceErrors: true,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      enableTokenRevocation: true,
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

    new cdk.CfnOutput(this, 'PartnerUserPoolClientSecret', {
      value: partnerUserPoolClient.userPoolClientSecret.toString(),
    });

    new cdk.CfnOutput(this, 'TodosTableName', {
      value: todosTable.tableName,
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: domain.baseUrl(),
    });

  }
} 