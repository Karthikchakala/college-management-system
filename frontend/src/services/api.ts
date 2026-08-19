import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Vite proxy maps this to http://localhost:5000/api
});

// Interceptor to inject Bearer JWT on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global unauthorized rejections
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if on protected route (optional - auth checks handles this)
    }
    return Promise.reject(error);
  }
);

export default api;
