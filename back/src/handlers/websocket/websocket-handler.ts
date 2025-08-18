import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { verify } from 'jsonwebtoken';
import { LunaStreamingService } from '../../lib/LunaStreamingService';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface MessagePart {
  step: string;
  index?: number;
  part?: string;
  token?: string;
}

interface LunaRequest {
  content: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userEmail: string;
  chatId?: string;
  useReasoning?: boolean;
  enableKnowledge?: boolean;
}

export class WebSocketHandler {
  private connectionId: string;
  private domainName: string;
  private stage: string;
  private apiClient: ApiGatewayManagementApiClient;
  private lunaService: LunaStreamingService;

  constructor(event: APIGatewayProxyEvent) {
    this.connectionId = event.requestContext.connectionId!;
    this.domainName = event.requestContext.domainName!;
    this.stage = event.requestContext.stage!;
    
    const endpoint = `https://${this.domainName}/${this.stage}`;
    this.apiClient = new ApiGatewayManagementApiClient({
      endpoint,
      region: process.env.AWS_REGION
    });

    this.lunaService = new LunaStreamingService({
      onStream: this.onStream.bind(this),
      onReasoning: this.onReasoning.bind(this),
      onStop: this.onStop.bind(this),
      onError: this.onError.bind(this)
    });
  }

  async handleConnection(routeKey: string, body?: string): Promise<APIGatewayProxyResult> {
    console.log(`WebSocket ${routeKey} for connection ${this.connectionId}`);

    try {
      switch (routeKey) {
        case '$connect':
          return this.handleConnect();
        
        case '$disconnect':
          return this.handleDisconnect();
        
        case '$default':
          return await this.handleMessage(body);
        
        default:
          return { statusCode: 400, body: 'Unknown route' };
      }
    } catch (error) {
      console.error('WebSocket handler error:', error);
      await this.sendErrorToClient(error instanceof Error ? error.message : 'Unknown error');
      return { statusCode: 500, body: 'Internal server error' };
    }
  }

  private handleConnect(): APIGatewayProxyResult {
    console.log(`Connection established: ${this.connectionId}`);
    return { statusCode: 200, body: 'Connected' };
  }

  private async handleDisconnect(): Promise<APIGatewayProxyResult> {
    console.log(`Connection disconnected: ${this.connectionId}`);
    
    // Clean up session data
    try {
      await this.cleanupSession();
    } catch (error) {
      console.error('Error cleaning up session:', error);
    }
    
    return { statusCode: 200, body: 'Disconnected' };
  }

  private async handleMessage(body?: string): Promise<APIGatewayProxyResult> {
    if (!body) {
      return { statusCode: 400, body: 'Missing message body' };
    }

    const message: MessagePart = JSON.parse(body);
    const { step } = message;

    switch (step) {
      case 'START':
        return await this.handleSessionStart(message);
      
      case 'BODY':
        return await this.handleMessagePart(message);
      
      case 'END':
        return await this.handleSessionEnd(message);
      
      default:
        return { statusCode: 400, body: 'Unknown step' };
    }
  }

  private async handleSessionStart(message: MessagePart): Promise<APIGatewayProxyResult> {
    try {
      // Verify token and extract user info (support both Auth0 JWT and guest tokens)
      const { token } = message;
      if (!token) {
        throw new Error('Missing authentication token');
      }

      let decoded: any;
      let userId: string;
      let userEmail: string;

      try {
        // Try Auth0 JWT verification first
        decoded = verify(token, process.env.AUTH0_SECRET!) as any;
        userId = decoded.sub;
        userEmail = decoded.email;
        console.log(`🔐 Session started for Auth0 user: ${userEmail}`);
      } catch (jwtError) {
        // If JWT verification fails, try guest token format
        try {
          const guestData = JSON.parse(atob(token));
          
          // Validate guest token structure
          if (guestData.isGuest && guestData.email && guestData.sub) {
            // Check if token is not expired
            if (Date.now() > guestData.exp) {
              throw new Error('Guest token expired');
            }
            
            userId = guestData.sub;
            userEmail = guestData.email;
            console.log(`🎭 Session started for guest user: ${userEmail}`);
          } else {
            throw new Error('Invalid guest token structure');
          }
        } catch (guestError) {
          console.error('Token validation failed:', { jwtError, guestError });
          throw new Error('Invalid token format');
        }
      }

      // Store session info
      const expire = Math.floor(Date.now() / 1000) + (2 * 60); // 2 minutes from now
      
      await docClient.send(new PutCommand({
        TableName: process.env.WEBSOCKET_SESSION_TABLE!,
        Item: {
          connectionId: this.connectionId,
          messagePartId: 0,
          userId,
          userEmail,
          expire
        }
      }));

      // 🚀 FIXED: Send "Session started." message back to WebSocket client
      await this.sendRawToClient('Session started.');
      console.log(`📤 Sent "Session started." to client ${this.connectionId}`);

      return { statusCode: 200, body: 'OK' };
    } catch (error) {
      console.error('Session start error:', error);
      return {
        statusCode: 403,
        body: JSON.stringify({
          status: 'ERROR',
          reason: 'Invalid token'
        })
      };
    }
  }

  private async handleMessagePart(message: MessagePart): Promise<APIGatewayProxyResult> {
    const { index, part } = message;
    
    if (index === undefined || !part) {
      return { statusCode: 400, body: 'Missing index or part' };
    }

    const expire = Math.floor(Date.now() / 1000) + (2 * 60);
    
    await docClient.send(new PutCommand({
      TableName: process.env.WEBSOCKET_SESSION_TABLE!,
      Item: {
        connectionId: this.connectionId,
        messagePartId: index + 1, // Zero is reserved for user info
        messagePart: part,
        expire
      }
    }));

    // 🚀 FIXED: Send "Message part received." back to WebSocket client
    await this.sendRawToClient('Message part received.');
    console.log(`📤 Sent "Message part received." to client ${this.connectionId}`);

    return { statusCode: 200, body: 'OK' };
  }

  private async handleSessionEnd(message: MessagePart): Promise<APIGatewayProxyResult> {
    try {
      // Verify token again for security (support both Auth0 JWT and guest tokens)
      const { token } = message;
      if (!token) {
        throw new Error('Missing authentication token');
      }

      let userEmail: string;

      try {
        // Try Auth0 JWT verification first
        const decoded = verify(token, process.env.AUTH0_SECRET!) as any;
        userEmail = decoded.email;
      } catch (jwtError) {
        // If JWT verification fails, try guest token format
        try {
          const guestData = JSON.parse(atob(token));
          
          if (guestData.isGuest && guestData.email && guestData.sub) {
            if (Date.now() > guestData.exp) {
              throw new Error('Guest token expired');
            }
            userEmail = guestData.email;
          } else {
            throw new Error('Invalid guest token structure');
          }
        } catch (guestError) {
          console.error('Token validation failed in session end:', { jwtError, guestError });
          throw new Error('Invalid token format');
        }
      }

      // Retrieve and assemble message parts
      const fullMessage = await this.assembleMessage();
      const lunaRequest: LunaRequest = JSON.parse(fullMessage);

      console.log(`Processing Luna request for: ${userEmail}`);
      console.log(`Request:`, { 
        content: lunaRequest.content?.substring(0, 100) + '...', 
        hasHistory: lunaRequest.conversationHistory?.length > 0,
        useReasoning: lunaRequest.useReasoning,
        enableKnowledge: lunaRequest.enableKnowledge
      });

      // Process with Luna streaming service
      await this.lunaService.processLunaRequest({
        ...lunaRequest,
        userEmail
      });

      return { statusCode: 200, body: 'Message processed.' };
    } catch (error) {
      console.error('Session end error:', error);
      await this.sendErrorToClient(error instanceof Error ? error.message : 'Processing error');
      return { statusCode: 500, body: 'Processing failed' };
    }
  }

  private async assembleMessage(): Promise<string> {
    const parts: Array<{ messagePartId: number; messagePart: string }> = [];
    let lastEvaluatedKey: any = undefined;

    // Query all message parts for this connection
    do {
      const params: any = {
        TableName: process.env.WEBSOCKET_SESSION_TABLE!,
        KeyConditionExpression: 'connectionId = :connectionId AND messagePartId >= :minPartId',
        ExpressionAttributeValues: {
          ':connectionId': this.connectionId,
          ':minPartId': 1 // Skip user info at index 0
        }
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await docClient.send(new QueryCommand(params));
      
      if (result.Items) {
        parts.push(...result.Items.map(item => ({
          messagePartId: item.messagePartId,
          messagePart: item.messagePart
        })));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Sort by part ID and concatenate
    parts.sort((a, b) => a.messagePartId - b.messagePartId);
    const fullMessage = parts.map(part => part.messagePart).join('');

    console.log(`Assembled message from ${parts.length} parts, total length: ${fullMessage.length}`);
    
    return fullMessage;
  }

  private async cleanupSession(): Promise<void> {
    // Delete all session data for this connection
    const parts: Array<{ connectionId: string; messagePartId: number }> = [];
    let lastEvaluatedKey: any = undefined;

    do {
      const params: any = {
        TableName: process.env.WEBSOCKET_SESSION_TABLE!,
        KeyConditionExpression: 'connectionId = :connectionId',
        ExpressionAttributeValues: {
          ':connectionId': this.connectionId
        }
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const result = await docClient.send(new QueryCommand(params));
      
      if (result.Items) {
        parts.push(...result.Items.map(item => ({
          connectionId: item.connectionId,
          messagePartId: item.messagePartId
        })));
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Delete all parts
    for (const part of parts) {
      await docClient.send(new DeleteCommand({
        TableName: process.env.WEBSOCKET_SESSION_TABLE!,
        Key: {
          connectionId: part.connectionId,
          messagePartId: part.messagePartId
        }
      }));
    }

    console.log(`Cleaned up ${parts.length} session parts`);
  }

  // Streaming callbacks for Luna
  private async onStream(token: string): Promise<void> {
    await this.sendToClient({
      status: 'STREAMING',
      completion: token
    });
  }

  private async onReasoning(token: string): Promise<void> {
    await this.sendToClient({
      status: 'REASONING',
      completion: token
    });
  }

  private async onStop(result: any): Promise<void> {
    await this.sendToClient({
      status: 'STREAMING_END',
      completion: '',
      stop_reason: result.stop_reason,
      token_count: {
        input: result.input_token_count,
        output: result.output_token_count
      },
      price: result.price
    });
  }

  private async onError(error: string): Promise<void> {
    await this.sendErrorToClient(error);
  }

  private async sendToClient(data: any): Promise<void> {
    try {
      await this.apiClient.send(new PostToConnectionCommand({
        ConnectionId: this.connectionId,
        Data: JSON.stringify(data)
      }));
    } catch (error) {
      console.error('Error sending to client:', error);
      // Connection might be closed, which is expected
    }
  }

  private async sendRawToClient(message: string): Promise<void> {
    try {
      await this.apiClient.send(new PostToConnectionCommand({
        ConnectionId: this.connectionId,
        Data: message
      }));
    } catch (error) {
      console.error('Error sending raw message to client:', error);
      // Connection might be closed, which is expected
    }
  }

  private async sendErrorToClient(reason: string): Promise<void> {
    await this.sendToClient({
      status: 'ERROR',
      reason
    });
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const websocketHandler = new WebSocketHandler(event);
  const routeKey = event.requestContext.routeKey!;
  const body = event.body;

  return await websocketHandler.handleConnection(routeKey, body || undefined);
};
