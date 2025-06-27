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

    // Check if company exists
    const company = await companyService.getCompanyById(companyId);
    if (!company) {
      return createResponse(404, { error: 'Company not found' });
    }

    // Delete company
    await companyService.deleteCompany(companyId);

    return createResponse(200, { message: 'Company deleted successfully' });

  } catch (error) {
    console.error('Error deleting company:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 