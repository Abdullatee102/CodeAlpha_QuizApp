import axios from 'axios';
import { storage } from '../utils/mmkvStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

    // Handle expired access token
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;

      console.log(
        '[API] Access token expired/invalid.'
      );
      console.log(
        '[API] Attempting token refresh...'
      );

      try {
        const refreshToken =
          storage.getString('refreshToken');

        console.log(
          '[API] Refresh token exists:',
          !!refreshToken
        );

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          { refreshToken }
        );

        console.log(
          '[API] Refresh response:',
          response.data
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

        console.log(
          '[API] New access token saved.'
        );

        // Retry original request with new access token
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        console.log(
          '[API] Retrying original request...'
        );

        return api(originalRequest);

      } catch (refreshError) {
        console.log(
          '===================================='
        );
        console.log(
          '[API] TOKEN REFRESH FAILED'
        );
        console.log(
          '[API] Refresh error:',
          refreshError?.message
        );
        console.log(
          '[API] Refresh status:',
          refreshError?.response?.status
        );
        console.log(
          '[API] Refresh data:',
          refreshError?.response?.data
        );
        console.log(
          '===================================='
        );

        // Only clear tokens when the refresh token
        // is actually invalid
        if (
          refreshError.response?.status === 401 ||
          refreshError.response?.status === 403
        ) {
          console.log(
            '[API] Clearing invalid tokens...'
          );

          storage.delete('userToken');
          storage.delete('refreshToken');
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;