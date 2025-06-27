import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lessonDocumentService, s3Service, createResponse } from '../../lib/common';
import { extractAuth0User, checkUserPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check permissions - admin, team manager, or user
    if (!checkUserPermission(authResult.user)) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    // Get lesson ID from path parameters
    const lessonId = event.pathParameters?.lessonId;
    if (!lessonId) {
      return createResponse(400, { error: 'Lesson ID is required' });
    }

    // Get lesson documents
    const documents = await lessonDocumentService.getLessonDocuments(lessonId);

    // Generate download URLs for documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (document) => {
        try {
          const downloadUrl = await s3Service.generatePresignedDownloadUrl(document.s3Key);
          return {
            ...document,
            downloadUrl
          };
        } catch (error) {
          console.error(`Error generating download URL for document ${document.id}:`, error);
          return {
            ...document,
            downloadUrl: null
          };
        }
      })
    );

    return createResponse(200, documentsWithUrls);

  } catch (error) {
    console.error('Error getting lesson documents:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 