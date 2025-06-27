import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DocumentService } from '../../lib/DocumentService';
import { validateToken, hasPermission } from '../../lib/auth';
import { createResponse } from '../../lib/common';

const documentService = new DocumentService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate Auth0 token
    const tokenPayload = await validateToken(event);
    if (!tokenPayload) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    const { campaignId, lessonId } = event.queryStringParameters || {};

    // Check permissions - all authenticated users can read documents
    if (!hasPermission(tokenPayload, 'read:documents') && 
        !hasPermission(tokenPayload, 'read:own-documents')) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    let documents;
    
    if (lessonId) {
      documents = await documentService.getDocumentsByLesson(lessonId);
    } else if (campaignId) {
      documents = await documentService.getDocumentsByCampaign(campaignId);
    } else {
      // Admin can see all documents
      if (hasPermission(tokenPayload, 'read:documents')) {
        documents = await documentService.getAllDocuments();
      } else {
        return createResponse(400, { error: 'campaignId or lessonId is required' });
      }
    }
    
    return createResponse(200, { documents });
  } catch (error) {
    console.error('Error getting documents:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 