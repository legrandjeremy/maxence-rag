import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lessonDocumentService, s3Service, createResponse } from '../../lib/common';
import { LessonDocumentCreateRequest } from '../../models/LessonDocument';
import { extractAuth0User, checkAdminPermission } from '../../lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check admin permissions
    if (!checkAdminPermission(authResult.user)) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    // Parse request body
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const request: LessonDocumentCreateRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.lessonId?.trim()) {
      return createResponse(400, { error: 'Lesson ID is required' });
    }

    if (!request.name?.trim()) {
      return createResponse(400, { error: 'Document name is required' });
    }

    if (!request.fileName?.trim()) {
      return createResponse(400, { error: 'File name is required' });
    }

    if (!request.mimeType?.trim()) {
      return createResponse(400, { error: 'MIME type is required' });
    }

    if (typeof request.fileSize !== 'number' || request.fileSize <= 0) {
      return createResponse(400, { error: 'Valid file size is required' });
    }

    if (typeof request.order !== 'number' || request.order < 0) {
      return createResponse(400, { error: 'Valid order is required' });
    }

    // Generate S3 key for the document
    const fileExtension = request.fileName.split('.').pop() || '';
    const s3Key = `lesson-documents/${request.lessonId}/${uuidv4()}.${fileExtension}`;

    // Create lesson document record
    const lessonDocument = await lessonDocumentService.createLessonDocument(
      request,
      s3Key,
      authResult.user.sub
    );

    // Generate presigned URL for file upload
    const uploadUrl = await s3Service.generatePresignedUrl(s3Key, request.mimeType);

    return createResponse(201, {
      document: lessonDocument,
      uploadUrl
    });

  } catch (error) {
    console.error('Error creating lesson document:', error);
    
    if (error instanceof SyntaxError) {
      return createResponse(400, { error: 'Invalid JSON in request body' });
    }

    return createResponse(500, { error: 'Internal server error' });
  }
}; 