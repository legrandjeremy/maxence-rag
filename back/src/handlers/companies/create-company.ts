import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { companyService } from '../../lib/common';
import { CompanyCreateRequest } from '../../models/Company';
import { extractAuth0User, checkAdminPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Extract and validate user
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return {
        statusCode: authResult.statusCode || 401,
        headers,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const auth0User = authResult.user;

    // Check if user has admin permissions
    if (!checkAdminPermission(auth0User)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions. Admin access required.' })
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const request: CompanyCreateRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required field: name' 
        })
      };
    }

    // Create company
    const createdCompany = await companyService.createCompany(request, auth0User.sub);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(createdCompany)
    };

  } catch (error) {
    console.error('Error creating company:', error);
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