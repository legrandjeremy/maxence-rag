import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateToken, hasPermission } from '../../lib/auth';
import { createResponse, campaignService, companyService, userService } from '../../lib/common';
import { Company } from '../../models/Company';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate Auth0 token
    const tokenPayload = await validateToken(event);
    if (!tokenPayload) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    const { companyId } = event.queryStringParameters || {};

    // Check permissions based on user role
    if (hasPermission(tokenPayload, 'maijin-defi-challenge:admin')) {
      // Admin can see all campaigns or filter by company
      const campaigns = companyId 
        ? await campaignService.getCampaignsByCompany(companyId)
        : await campaignService.getAllCampaigns();
      
      return createResponse(200, { campaigns });
    } else if (hasPermission(tokenPayload, 'maijin-defi-challenge:team-manager') && companyId) {
      
      // Try to find user by email
      const currentUser = await userService.getUserByEmail(tokenPayload.user['https//defi.maijin/email']);

      if (!currentUser) {
        return createResponse(404, { error: 'User not found in system' });
      }
      const companyIds = await companyService.getCompaniesByTeamManager(currentUser.id);

      if (!companyIds.some((company: Company) => company.id === companyId)) {
        return createResponse(403, { error: 'Insufficient permissions' });
      }

      const campaigns = await campaignService.getCampaignsByCompany(companyId);

      return createResponse(200, { campaigns });
    } else {
      return createResponse(403, { error: 'Insufficient permissions' });
    }
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 