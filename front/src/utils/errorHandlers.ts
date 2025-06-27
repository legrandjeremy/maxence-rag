// Define any error properties that might be in the response
export interface ApiError extends Error {
  response?: {
    status: number;
    data?: {
      message?: string;
    };
  };
}

export function handleApiError(error: unknown): never {
  console.error('API Error:', error)
  throw error
} 