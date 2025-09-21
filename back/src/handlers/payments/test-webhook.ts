import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../../lib/common';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('🧪 Test Webhook: Received event', {
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body
  });

  return createResponse(200, { 
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    event: {
      httpMethod: event.httpMethod,
      path: event.path,
      headers: Object.keys(event.headers || {}),
      bodyLength: event.body?.length || 0
    }
  });
};
