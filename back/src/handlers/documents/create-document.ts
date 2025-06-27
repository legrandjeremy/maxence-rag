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

    // Check if user has admin permissions
    if (!hasPermission(tokenPayload, 'create:documents')) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const documentData = JSON.parse(event.body);
    
    // Validate required fields
    if (!documentData.title || !documentData.fileName || !documentData.fileType) {
      return createResponse(400, { 
        error: 'Missing required fields: title, fileName, fileType' 
      });
    }

    const document = await documentService.createDocument(documentData);
    
    return createResponse(201, { document });
  } catch (error) {
    console.error('Error creating document:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 