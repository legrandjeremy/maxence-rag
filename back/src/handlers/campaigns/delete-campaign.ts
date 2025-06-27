import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { campaignService } from '../../lib/common';
import { extractAuth0User, checkAdminPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
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

    // Get campaign ID from path parameters
    const campaignId = event.pathParameters?.id;
    if (!campaignId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Campaign ID is required' })
      };
    }

    // Check if campaign exists
    const existingCampaign = await campaignService.getCampaignById(campaignId);
    if (!existingCampaign) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Campaign not found' })
      };
    }

    // Delete campaign
    await campaignService.deleteCampaign(campaignId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Campaign deleted successfully' })
    };

  } catch (error) {
    console.error('Error deleting campaign:', error);
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