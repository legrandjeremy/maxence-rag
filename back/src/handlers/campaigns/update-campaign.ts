import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { campaignService } from '../../lib/common';
import { CampaignUpdateRequest } from '../../models/Campaign';
import { extractAuth0User, checkAdminPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
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

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const request: CampaignUpdateRequest = JSON.parse(event.body);

    // Validate date format if provided
    if (request.startDate && isNaN(Date.parse(request.startDate))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid startDate format' })
      };
    }

    if (request.endDate && isNaN(Date.parse(request.endDate))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid endDate format' })
      };
    }

    // Validate status if provided
    if (request.status && !['draft', 'active', 'completed', 'archived'].includes(request.status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid status. Must be one of: draft, active, completed, archived' })
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

    // Update campaign
    const updatedCampaign = await campaignService.updateCampaign(campaignId, request);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedCampaign)
    };

  } catch (error) {
    console.error('Error updating campaign:', error);
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