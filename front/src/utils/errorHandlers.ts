// Define any error properties that might be in the response
export interface ApiErrorLike {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Return a user-friendly message and avoid leaking backend internals
export function handleApiError(error: unknown): string {
  const err = (error || {}) as ApiErrorLike;
  const backendMessage = err.response?.data?.message || err.message || '';

  // Map specific backend messages to friendlier text
  if (/chat not found|access denied/i.test(backendMessage)) {
    return "La conversation n'est plus disponible.";
  }

  if (err.response?.status === 404) {
    return 'Ressource introuvable.';
  }

  if (err.response?.status === 401) {
    return 'Authentification requise.';
  }

  if (backendMessage) {
    return backendMessage;
  }

  return 'Une erreur est survenue. Veuillez réessayer.';
}