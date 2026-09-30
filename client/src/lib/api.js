import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aaro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    err.message = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(err);
  }
);

export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
export const post = (url, data) => api.post(url, data).then((r) => r.data);
export const put = (url, data) => api.put(url, data).then((r) => r.data);

export function imgUrl(ref, w) {
  if (!ref) return '';
  const url = typeof ref === 'string' ? ref : ref.url;
  if (!url) return '';
  if (/^(data:|https?:)/.test(url)) return url;
  return `${API_BASE}${url}${w ? `?w=${w}` : ''}`;
}

export default api;
