import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aaro_admin_token');
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

export const del = (url) => api.delete(url).then((r) => r.data);
export const patch = (url, data) => api.patch(url, data).then((r) => r.data);

// Uploads images; the server converts to WebP, resizes and stores them as base64.
export async function uploadImages(files, preset = 'default', onProgress) {
  const fd = new FormData();
  for (const f of files) fd.append('images', await downscale(f));
  const r = await api.post(`/images?preset=${preset}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
  return r.data;
}

// Shrinks very large photos in the browser first so uploads are fast (server does the final resize/compress)
async function downscale(file, max = 2400) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 6 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9));
    return blob ? new File([blob], file.name, { type: blob.type }) : file;
  } catch {
    return file;
  }
}
