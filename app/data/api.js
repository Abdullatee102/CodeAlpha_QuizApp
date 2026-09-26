import axios from 'axios';
import { storage } from '../utils/mmkvStorage';
import { queryClient } from './queryClient';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Shared promise to serialize concurrent 401 token refresh attempts
let refreshPromise = null;

console.log('====================================');
console.log('[API] API_URL:', API_URL);
console.log('====================================');

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = storage.getString('userToken');

    console.log('------------------------------------');
    console.log('[API] OUTGOING REQUEST');
    console.log('[API] Method:', config.method?.toUpperCase());
    console.log('[API] Base URL:', config.baseURL);
    console.log('[API] Endpoint:', config.url);
    console.log(
      '[API] Full URL:',
      `${config.baseURL}${config.url}`
    );

    // Log the actual request body
    console.log('[API] Request data:', config.data);

    try {
      console.log(
        '[API] Parsed request data:',
        typeof config.data === 'string'
          ? JSON.parse(config.data)
          : config.data
      );
    } catch (e) {
      console.log(
        '[API] Could not parse request data:',
        config.data
      );
    }

    console.log('[API] Token exists:', !!token);
    console.log('------------------------------------');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.log(
      '[API] REQUEST INTERCEPTOR ERROR:',
      error
    );

    return Promise.reject(error);
  }
);

// Handle expired access tokens
api.interceptors.response.use(
  (response) => {
    console.log('------------------------------------');
    console.log('[API] RESPONSE SUCCESS');
    console.log('[API] Status:', response.status);
    console.log('[API] URL:', response.config?.url);
    console.log('------------------------------------');

    return response;
  },

  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    console.log('====================================');
    console.log('[API] RESPONSE ERROR');
    console.log('[API] Status:', error.response?.status);
    console.log('[API] URL:', requestUrl);
    console.log('[API] Message:', error.message);
    console.log(
      '[API] Response data:',
      error.response?.data
    );
    console.log('====================================');

    // Do not attempt token refresh for auth endpoints
    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/signup') ||
      requestUrl.includes('/auth/send-otp') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/refresh-token')
    ) {
      return Promise.reject(error);
    }

    // Distinguish 401 cases
    if (error.response?.status === 401 && !originalRequest?._retry) {
      const requestUrl = originalRequest?.url || '';

      // Never attempt token refresh on public auth endpoints or refresh-token endpoint itself
      const isPublicOrAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/signup') ||
        requestUrl.includes('/auth/send-otp') ||
        requestUrl.includes('/auth/verify-otp') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/reset-password') ||
        requestUrl.includes('/auth/refresh-token');

      if (isPublicOrAuthEndpoint) {
        return Promise.reject(error);
      }

      const refreshToken = storage.getString('refreshToken');
      const hadAuthHeader = !!originalRequest?.headers?.Authorization;

      // Case B: No active access token/session — do NOT attempt refresh, do NOT throw error storm
      if (!refreshToken || !hadAuthHeader) {
        console.log(
          '[API] 401 received with no active session/tokens. Skipping token refresh.'
        );
        return Promise.reject(error);
      }

      // Case A & C: Authenticated request with expired access token and valid refresh token available
      originalRequest._retry = true;

      console.log(
        '[API] Access token expired. Initiating token rotation...'
      );

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const currentRefreshToken = storage.getString('refreshToken');

            if (!currentRefreshToken) {
              return null;
            }

            const response = await axios.post(
              `${API_URL}/auth/refresh-token`,
              { refreshToken: currentRefreshToken }
            );

            console.log(
              '[API] Refresh successful.'
            );

            const newAccessToken =
              response.data?.tokens?.accessToken;
            const newRefreshToken =
              response.data?.tokens?.refreshToken;

            if (!newAccessToken) {
              throw new Error(
                'No access token returned from refresh'
              );
            }

            // Save new tokens to MMKV
            storage.set(
              'userToken',
              newAccessToken
            );

            if (newRefreshToken) {
              storage.set(
                'refreshToken',
                newRefreshToken
              );
            }

            return newAccessToken;
          } catch (refreshError) {
            console.log(
              '===================================='
            );
            console.log(
              '[API] TOKEN REFRESH FAILED:',
              refreshError?.message
            );
            console.log(
              '===================================='
            );

            // Case D: Refresh token invalid or revoked
            if (
              refreshError.response?.status === 401 ||
              refreshError.response?.status === 403
            ) {
              console.log(
                '[API] Refresh token expired or revoked. Clearing normal session tokens...'
              );

              storage.delete('userToken');
              storage.delete('refreshToken');

              try {
                queryClient.clear();
              } catch (e) {}
            }

            throw refreshError;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      try {
        const newAccessToken = await refreshPromise;

        if (!newAccessToken) {
          return Promise.reject(error);
        }

        // Retry original request with new access token
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        console.log(
          '[API] Retrying original request with rotated token...'
        );

        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;