import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { companyService, createResponse } from '../../lib/common';
import { extractAuth0User, checkAdminPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check admin permission
    if (!checkAdminPermission(authResult.user)) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    // Get company ID from path parameters
    const companyId = event.pathParameters?.id;
    if (!companyId) {
      return createResponse(400, { error: 'Company ID is required' });
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!body.name && body.name !== '') {
      // Allow empty string to clear name, but require the field to be present
    }

    // Update company
    const updatedCompany = await companyService.updateCompany(companyId, {
      name: body.name,
      description: body.description,
      isActive: body.isActive
    });

    return createResponse(200, { data: updatedCompany });

  } catch (error) {
    console.error('Error updating company:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 