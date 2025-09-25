import { useAuthStore } from '../stores/authStore';

// WebSocket streaming statuses based on bedrock-chat-3
export enum LunaStreamingStatus {
  START = 'START',
  BODY = 'BODY', 
  END = 'END',
  STREAMING = 'STREAMING',
  REASONING = 'REASONING',
  STREAMING_END = 'STREAMING_END',
  ERROR = 'ERROR'
}

export interface LunaStreamingRequest {
  content: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userEmail: string;
  chatId?: string;
  useReasoning?: boolean;
  enableKnowledge?: boolean;
  customerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    gender: string;
  };
}

export interface LunaStreamingCallbacks {
  onStream: (token: string) => void;
  onReasoning: (reasoning: string) => void;
  onComplete: (result: {
    completion: string;
    stop_reason: string;
    token_count: {
      input: number;
      output: number;
    };
    price: number;
  }) => void;
  onError: (error: string) => void;
}

export class LunaWebSocketService {
  private wsEndpoint: string;
  private ws: WebSocket | null = null;
  private chunkSize = 32 * 1024; // 32KB chunks like bedrock-chat-3
  private currentSessionToken: string | null = null; // 🚀 Store session token for later use

  constructor() {
    // Get WebSocket endpoint from environment or SAM outputs
    this.wsEndpoint = process.env.VITE_LUNA_WS_ENDPOINT || 
                     this.buildWebSocketEndpoint();
    
    console.log('🌙 Luna WebSocket Service initialized:', {
      wsEndpoint: this.wsEndpoint,
      hasEnvVar: !!process.env.VITE_LUNA_WS_ENDPOINT,
      envValue: process.env.VITE_LUNA_WS_ENDPOINT
    });
  }

  private buildWebSocketEndpoint(): string {
    // Build from current domain if not explicitly set
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // For development, use localhost or staging endpoint
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'wss://your-staging-websocket-api-gateway-url/staging';
    }
    
    // For production, construct from domain
    return `${protocol}//${host.replace('front', 'ws')}/prod`;
  }

  async sendStreamingMessage(
    request: LunaStreamingRequest,
    callbacks: LunaStreamingCallbacks
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsEndpoint);
        let completion = '';
        let reasoning = ''; // Used in streaming response handling

        this.ws.onopen = () => {
          // Try to get authentication token, but allow guest access
          const authStore = useAuthStore();
          const token = authStore.token;
          const userEmail = request.userEmail;

          // For guest users, create a minimal token (email optional for initial connection)
          let sessionToken = token;
          if (!token) {
            // Create a simple guest token structure (email can be empty initially)
            sessionToken = btoa(JSON.stringify({
              sub: `guest_${Date.now()}`,
              email: userEmail || 'anonymous', // Allow anonymous initially
              isGuest: true,
              iat: Date.now(),
              exp: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
            }));
          }

          // Always allow connection - email will be validated when saving to database
          if (!sessionToken) {
            callbacks.onError('Failed to establish connection');
            return;
          }

          // 🚀 Store session token for use in sendChunkedRequest
          this.currentSessionToken = sessionToken;
          
          // Start session
          try {
            this.ws!.send(JSON.stringify({
              step: LunaStreamingStatus.START,
              token: sessionToken
            }));
            console.log('✅ Luna WebSocket: Session start message sent');
          } catch (error) {
            callbacks.onError('Failed to start session');
          }
        };

        this.ws.onmessage = (message) => {
          try {
            // Handle simple status messages
            if (message.data === 'Session started.') {
              console.log('🔮 Luna WebSocket: Session started, sending request...');
              this.sendChunkedRequest(request);
              return;
            }

            if (message.data === 'Message part received.') {
              // Chunking progress - could show loading indicator
              return;
            }

            if (message.data === 'Message sent.' || message.data === '') {
              return;
            }

            // Handle timeout from API Gateway
            if (message.data.startsWith('{"message": "Endpoint request timed out"')) {
              return;
            }

            // Parse streaming data
            const data = JSON.parse(message.data);

            if (!data.status) {
              callbacks.onError('Invalid response format from Luna');
              return;
            }

            switch (data.status) {
              case LunaStreamingStatus.STREAMING:
                if (data.completion || data.completion === '') {
                  completion += data.completion;
                  callbacks.onStream(data.completion);
                }
                break;

              case LunaStreamingStatus.REASONING:
                if (data.completion || data.completion === '') {
                  reasoning += data.completion; // Accumulate reasoning text
                  callbacks.onReasoning(data.completion);
                }
                break;

              case LunaStreamingStatus.STREAMING_END:
                callbacks.onComplete({
                  completion,
                  stop_reason: data.stop_reason || 'end_turn',
                  token_count: data.token_count || { input: 0, output: 0 },
                  price: data.price || 0
                });
                this.ws!.close();
                resolve();
                break;

              case LunaStreamingStatus.ERROR:
                console.error('🚨 Luna WebSocket: Server error:', data.reason);
                callbacks.onError(data.reason || 'Unknown server error');
                this.ws!.close();
                reject(new Error(data.reason || 'Unknown server error'));
                break;

              default:
                console.warn('⚠️ Luna WebSocket: Unknown status:', data.status);
                break;
            }

          } catch (error) {
            console.error('🚨 Luna WebSocket: Message parsing error:', error);
            callbacks.onError('Failed to parse response from Luna');
          }
        };

        this.ws.onerror = (error) => {
          console.error('🚨 Luna WebSocket: Connection error:', error);
          console.error('🚨 WebSocket URL:', this.wsEndpoint);
          console.error('🚨 WebSocket ReadyState:', this.ws?.readyState);
          callbacks.onError('Connection error with Luna - check console for details');
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = (event) => {
          console.log('🌙 Luna WebSocket: Connection closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            url: this.wsEndpoint
          });
          
          // 🚀 Clear session token on connection close
          this.currentSessionToken = null;
          
          // Log specific close codes for debugging
          if (event.code === 1006) {
            console.error('🚨 WebSocket closed abnormally - likely server/network issue');
          } else if (event.code === 1011) {
            console.error('🚨 WebSocket closed due to server error');
          } else if (event.code === 1012) {
            console.error('🚨 WebSocket closed due to server restart');
          }
          
          if (!event.wasClean && event.code !== 1000) {
            callbacks.onError(`Connection lost with Luna (code: ${event.code})`);
          }
          
          resolve();
        };

      } catch (error) {
        console.error('🚨 Luna WebSocket: Setup error:', error);
        callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
        reject(error instanceof Error ? error : new Error('WebSocket setup failed'));
      }
    });
  }

  private sendChunkedRequest(request: LunaStreamingRequest): void {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }

    // 🚀 Use stored session token (works for both Auth0 and guest users)
    const token = this.currentSessionToken;
    
    if (!token) {
      throw new Error('No session token available');
    }

    // Prepare full request with token
    const fullRequest = {
      ...request,
      token
    };

    const payloadString = JSON.stringify(fullRequest);
    console.log(`🔮 Luna WebSocket: Sending request (${payloadString.length} bytes)`);

    // Split into chunks
    const chunkedPayloads: string[] = [];
    const chunkCount = Math.ceil(payloadString.length / this.chunkSize);
    
    for (let i = 0; i < chunkCount; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, payloadString.length);
      chunkedPayloads.push(payloadString.substring(start, end));
    }

    console.log(`📦 Luna WebSocket: Sending ${chunkCount} chunks`);

    // Send each chunk
    chunkedPayloads.forEach((chunk, index) => {
      this.ws!.send(JSON.stringify({
        step: LunaStreamingStatus.BODY,
        index,
        part: chunk
      }));
    });

    // Wait for all chunks to be received, then end
    let receivedCount = 0;
    const originalOnMessage = this.ws.onmessage;

    this.ws.onmessage = (event) => {
      if (event.data === 'Message part received.') {
        receivedCount++;
        if (receivedCount === chunkedPayloads.length) {
          console.log('✅ Luna WebSocket: All chunks sent, ending session...');
          this.ws!.send(JSON.stringify({
            step: LunaStreamingStatus.END,
            token
          }));
          
          // Restore original message handler
          this.ws!.onmessage = originalOnMessage;
        }
      } else if (originalOnMessage && this.ws) {
        originalOnMessage.call(this.ws, event);
      }
    };
  }

  async testConnection(userEmail?: string): Promise<{ isConnected: boolean; error?: string }> {
    try {
      console.log('🌙 Luna WebSocket: Testing connection...');
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('✅ Luna WebSocket: Already connected');
        return { isConnected: true };
      }

      return new Promise((resolve) => {
        this.ws = new WebSocket(this.wsEndpoint);
        
        const timeout = setTimeout(() => {
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
          resolve({ isConnected: false, error: 'Connection timeout' });
        }, 5000); // 5 second timeout

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ Luna WebSocket: Test connection successful');
          
          // Try to get authentication token
          const authStore = useAuthStore();
          const token = authStore.token;
          
          // For guest users, create a minimal token with email
          let sessionToken = token;
          if (!token && userEmail) {
            sessionToken = btoa(JSON.stringify({
              sub: `guest_${Date.now()}`,
              email: userEmail,
              isGuest: true,
              iat: Date.now(),
              exp: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
            }));
          }

          if (sessionToken) {
            // 🚀 Store session token for consistency
            this.currentSessionToken = sessionToken;
            
            // Send a test session start to verify full connectivity
            this.ws!.send(JSON.stringify({
              step: 'START',
              token: sessionToken
            }));
          }
          
          resolve({ isConnected: true });
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('🚨 Luna WebSocket: Test connection failed:', error);
          this.currentSessionToken = null; // 🚀 Clear on error
          resolve({ isConnected: false, error: 'Connection failed' });
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          this.currentSessionToken = null; // 🚀 Clear on close
          if (event.code !== 1000) {
            console.error('🚨 Luna WebSocket: Test connection closed unexpectedly:', event.code);
            resolve({ isConnected: false, error: `Connection closed: ${event.code}` });
          }
        };
      });
    } catch (error) {
      console.error('🚨 Luna WebSocket: Test connection error:', error);
      return { isConnected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  disconnect(): void {
    if (this.ws) {
      console.log('🌙 Luna WebSocket: Manually disconnecting...');
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance for the app
export const lunaWebSocketService = new LunaWebSocketService();
