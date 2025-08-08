import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userService } from '../lib/common';
import { getAuth0ManagementService } from '../lib/auth';
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
      
      // Check if user exists in Auth0
      const auth0Service = getAuth0ManagementService();
      let auth0User = await auth0Service.getUserByEmail(email);
      
      if (!auth0User) {
        // Create user in Auth0 with minimal information
        console.log(`Creating Auth0 user for: ${email}`);
        auth0User = await auth0Service.createUser(email, 'User', ''); // Default name
        
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

    // Generate Auth0 login URL for auto-login
    const auth0Domain = (process.env.AUTH0_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    const clientId = process.env.AUTH0_CLIENT_ID;
    const redirectUri = process.env.FRONTEND_URL || 'http://localhost:9000';
    
    if (!auth0Domain || !clientId) {
      console.error('Auth0 configuration missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Authentication configuration error' })
      };
    }

    // Create authorization URL for passwordless login
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: `${redirectUri}/callback`,
      scope: 'openid profile email',
      audience: 'http://maxence.chat',
      login_hint: email // Pre-fill email in login form
    });

    const auth0LoginUrl = `https://${auth0Domain}/authorize?${authParams.toString()}`;

    const response: EmailCollectionResponse = {
      success: true,
      auth0LoginUrl
    };

    console.log(`Email collection successful for: ${email}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

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