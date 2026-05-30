import { auth } from './firebase';

/**
 * Get ID token for authenticated API requests
 */
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Search across all suppliers
 */
export async function searchSuppliers(query: string) {
  return apiRequest('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

/**
 * Get arbitrage analysis from AI
 */
export async function getArbitrageAnalysis(suppliers: any[]) {
  return apiRequest('/api/ai/arbitrage', {
    method: 'POST',
    body: JSON.stringify({ suppliers }),
  });
}

/**
 * Generate negotiation email
 */
export async function generateNegotiationEmail(supplier: any, product: string) {
  return apiRequest('/api/ai/email', {
    method: 'POST',
    body: JSON.stringify({ supplier, product }),
  });
}

/**
 * Get price prediction
 */
export async function getPricePrediction(product: string, historical: any[]) {
  return apiRequest('/api/ai/predict', {
    method: 'POST',
    body: JSON.stringify({ product, historical }),
  });
}

/**
 * Watchlist operations
 */
export async function getWatchlist() {
  return apiRequest('/api/watchlist', { method: 'GET' });
}

export async function addToWatchlist(product: string) {
  return apiRequest('/api/watchlist', {
    method: 'POST',
    body: JSON.stringify({ product }),
  });
}

export async function removeFromWatchlist(id: string) {
  return apiRequest(`/api/watchlist?id=${id}`, { method: 'DELETE' });
}

/**
 * Price history operations
 */
export async function getPriceHistory(product: string) {
  return apiRequest(`/api/history?product=${encodeURIComponent(product)}`, {
    method: 'GET',
  });
}

export async function savePricePoint(product: string, price: number, source: string) {
  return apiRequest('/api/history', {
    method: 'POST',
    body: JSON.stringify({ product, price, source }),
  });
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
