import { createApiClient, getStoredToken, handleUnauthorized } from './httpClient';
import { API_BASE_URL } from '@/app/config/appConfig';

/**
 * Public client for endpoints that must not attach tokens.
 * This prevents public auth calls from triggering refresh or redirect loops.
 */
export const publicClient = createApiClient({
  baseURL: API_BASE_URL,
  getToken: () => null,
  getRefreshToken: () => null,
  onUnauthorized: () => {} 
});

/**
 * Main authenticated client.
 * It attaches the access token and handles refresh on protected requests.
 */
export const mainClient = createApiClient({
  baseURL: API_BASE_URL,
  // withCredentials: true,
  getToken: getStoredToken,
  onUnauthorized: handleUnauthorized
})

