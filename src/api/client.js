import axios from 'axios';

// In production (Render), VITE_API_URL points to the backend service URL.
// In dev, we use a relative path (proxied by Vite to localhost:3001).
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('tt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tt_token');
      localStorage.removeItem('tt_user');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
