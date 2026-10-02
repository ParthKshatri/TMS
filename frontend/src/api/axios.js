import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If response returns 401, session might have expired
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        // Option to redirect or trigger auth state cleanup
      }
    }
    return Promise.reject(error);
  }
);

export default api;
