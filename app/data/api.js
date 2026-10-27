
import axios from 'axios';
import { storage } from '../utils/mmkvStorage';
import { queryClient } from './queryClient';

const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || ''
).replace(/\/+$/, '');

const REQUEST_TIMEOUT = 30000;

// Shared promise serializes concurrent 401 refresh attempts.
let refreshPromise = null;

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/signup',
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/google',
];

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (!API_URL) {
  console.error('[API] EXPO_PUBLIC_API_URL is not configured.');
} else {
  console.log('[API] Base URL:', API_URL);
}

function isAuthEndpoint(url = '') {
  const path = url.split('?')[0];

  return AUTH_ENDPOINTS.some(
    (endpoint) =>
      path === endpoint ||
      path.endsWith(endpoint)
  );
}

function clearSessionTokens() {
  storage.delete('userToken');
  storage.delete('refreshToken');

  try {
    queryClient.clear();
  } catch (error) {
    console.warn('[API] Failed to clear query cache.');
  }
}

// Attach the current access token to requests.
api.interceptors.request.use(
  (config) => {
    const token = storage.getString('userToken');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Never log request bodies or credentials.
    console.log('[API] Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL || ''}${config.url || ''}`,
      hasToken: Boolean(token),
    });

    return config;
  },
  (error) => {
    console.error(
      '[API] Request setup failed:',
      error.message
    );

    return Promise.reject(error);
  }
);

// Handle responses and expired access tokens.
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', {
      status: response.status,
      url: response.config?.url,
    });

    return response;
  },

  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const status = error.response?.status;

    // Log diagnostic metadata only; never log credentials or
    // potentially sensitive request/response bodies.
    console.error('[API] Request failed:', {
      method: originalRequest?.method?.toUpperCase(),
      url: requestUrl,
      status: status ?? null,
      code: error.code ?? null,
      message: error.message,
      hasResponse: Boolean(error.response),
      hasRequest: Boolean(error.request),
    });

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Never refresh or retry authentication entry points.
    if (isAuthEndpoint(requestUrl)) {
      return Promise.reject(error);
    }

    // Only refresh an authenticated request after a 401.
    if (
      status === 401 &&
      !originalRequest._retry
    ) {
      const refreshToken = storage.getString('refreshToken');
      const hadAuthHeader = Boolean(
        originalRequest.headers?.Authorization
      );

      if (!refreshToken || !hadAuthHeader) {
        console.warn(
          '[API] Skipping token refresh: no active refreshable session.'
        );

        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const currentRefreshToken =
              storage.getString('refreshToken');

            if (!currentRefreshToken) {
              return null;
            }

            // Use bare Axios so refresh does not enter the
            // normal API response interceptor recursively.
            const response = await axios.post(
              `${API_URL}/auth/refresh-token`,
              {
                refreshToken: currentRefreshToken,
              },
              {
                timeout: REQUEST_TIMEOUT,
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            const newAccessToken =
              response.data?.tokens?.accessToken;

            const newRefreshToken =
              response.data?.tokens?.refreshToken;

            if (!newAccessToken) {
              throw new Error(
                'No access token returned from refresh.'
              );
            }

            storage.set('userToken', newAccessToken);

            if (newRefreshToken) {
              storage.set(
                'refreshToken',
                newRefreshToken
              );
            }

            console.log('[API] Token refresh succeeded.');

            return newAccessToken;
          } catch (refreshError) {
            const refreshStatus =
              refreshError.response?.status;

            console.error('[API] Token refresh failed:', {
              status: refreshStatus ?? null,
              code: refreshError.code ?? null,
              message: refreshError.message,
            });

            // Clear the session only when the server explicitly
            // rejects the refresh token.
            if (
              refreshStatus === 401 ||
              refreshStatus === 403
            ) {
              clearSessionTokens();
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

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        console.log(
          '[API] Retrying request with refreshed token.'
        );

        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    // Handle account suspension/disablement.
    if (status === 403) {
      const message =
        error.response?.data?.message || '';

      const normalizedMessage =
        message.toLowerCase();

      const isAccountRestricted =
        normalizedMessage.includes('account is') &&
        normalizedMessage.includes('access denied');

      if (isAccountRestricted) {
        console.warn(
          '[API] Account restriction detected.'
        );

        clearSessionTokens();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
