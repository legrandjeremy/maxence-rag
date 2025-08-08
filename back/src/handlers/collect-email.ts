import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../lib/common';
import Auth0Service from '../lib/Auth0Service';
import { EmailCollectionRequest, EmailCollectionResponse } from '../models/User';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  try {
    // Handle preflight requests
    if (event.requestContext.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    const request: EmailCollectionRequest = JSON.parse(event.body || '{}');

    // Log environment variables in a sanitized form to aid debugging
    try {
      const redactionPattern = /SECRET|TOKEN|PASSWORD|KEY|PRIVATE|CERT/i;
      const sanitizedEnv: Record<string, string> = {};
      for (const [variableName, variableValue] of Object.entries(process.env)) {
        if (redactionPattern.test(variableName)) {
          const valueAsString = String(variableValue ?? '');
          sanitizedEnv[variableName] = valueAsString
            ? `***${valueAsString.slice(-4)}`
            : '';
        } else {
          sanitizedEnv[variableName] = String(variableValue ?? '');
        }
      }
      console.log('CollectEmail env (sanitized):', sanitizedEnv);
    } catch (envError) {
      console.log('Failed to log environment variables:', envError);
    }

    // Validate email
    if (!request.email || !request.email.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    const email = request.email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    console.log(`Processing email collection for: ${email}`);

    // Check if user already exists in our database
    let existingUser = await userService.getUserByEmail(email);
    
    let auth0UserId: string;
    let shouldCreateLocalUser = false;

    if (existingUser) {
      console.log(`User already exists in database: ${email}`);
      auth0UserId = existingUser.auth0UserId;
    } else {
      console.log(`Creating new user for email: ${email}`);
      
      // Initialize Auth0Service with Management API credentials
      const rawDomain = process.env.AUTH0_DOMAIN || '';
      const normalizedHost = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const managementDomain = normalizedHost ? `https://${normalizedHost}/` : '';
      const managementClientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID || process.env.AUTH0_CLIENT_ID || '';
      const managementClientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET || '';
      const managementAudience = `https://${normalizedHost}/api/v2/`;

      if (!managementDomain || !managementClientId || !managementClientSecret) {
        console.error('Auth0 Management configuration missing');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Auth0 Management configuration missing' })
        };
      }

      const auth0Service = new Auth0Service(
        managementDomain,
        managementClientId,
        managementClientSecret,
        managementAudience
      );

      // Check if user exists in Auth0
      const existingAuth0Users = await auth0Service.getUserByEmail(email);
      let auth0User = Array.isArray(existingAuth0Users) && existingAuth0Users.length > 0
        ? existingAuth0Users[0]
        : null;

      if (!auth0User) {
        // Create user in Auth0 with minimal information for DB connection
        console.log(`Creating Auth0 user for: ${email}`);
        const tempPassword = `Tmp${Math.random().toString(36).slice(-8)}!A9`;
        const emailLocalPart = email.split('@')[0] || 'User';
        const createPayload = {
          email,
          given_name: emailLocalPart,
          family_name: emailLocalPart,
          name: emailLocalPart,
          connection: 'Username-Password-Authentication',
          password: tempPassword,
          email_verified: false,
          verify_email: true
        };
        auth0User = await auth0Service.createUser(createPayload);
        if (!auth0User) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create user in Auth0' })
          };
        }
      }

      auth0UserId = auth0User.user_id || '';
      shouldCreateLocalUser = true;
    }

    // Create local user record if needed
    if (shouldCreateLocalUser && auth0UserId) {
      try {
        const userCreateRequest = {
          email,
          firstName: 'User', // Default, can be updated later
          lastName: '',
          userType: 'user' as const,
        };

        await userService.createUser(userCreateRequest, auth0UserId, 'system');
        console.log(`Created local user record for: ${email}`);
      } catch (error) {
        console.error('Error creating local user:', error);
        // Continue even if local user creation fails
      }
    }

    // M2M flow only: do not build user-facing authorize URL. Just confirm/create and return success.
    const response: EmailCollectionResponse = { success: true } as EmailCollectionResponse;
    console.log(`Email collection successful for: ${email}`);
    return { statusCode: 200, headers, body: JSON.stringify(response) };

  } catch (error) {
    console.error('Error in email collection:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}; 