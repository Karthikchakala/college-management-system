import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { refreshCognitoSession } from './cognito';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Track if a refresh token request is currently in flight
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor to inject Bearer JWT on every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle unauthorized rejections and auto-refresh session
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');

      // If we have a refresh token and aren't already refreshing
      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              if (originalRequest.headers) {
                if (typeof originalRequest.headers.set === 'function') {
                  originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
                } else {
                  originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                }
              }
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.info('[API Interceptor] 401 encountered, refreshing Cognito access token...');
          const newTokens = await refreshCognitoSession(refreshToken);
          localStorage.setItem('token', newTokens.access_token);
          if (newTokens.id_token) {
            localStorage.setItem('id_token', newTokens.id_token);
          }
          if (newTokens.refresh_token) {
            localStorage.setItem('refresh_token', newTokens.refresh_token);
          }

          if (originalRequest.headers) {
            if (typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${newTokens.access_token}`);
            } else {
              originalRequest.headers['Authorization'] = `Bearer ${newTokens.access_token}`;
            }
          }

          processQueue(null, newTokens.access_token);
          return api(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr as Error, null);
          localStorage.removeItem('token');
          localStorage.removeItem('id_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
