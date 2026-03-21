import { decodeJWT, refreshToken } from './auth';

// Use VITE_BACKEND_URL for production (Render), fall back to VITE_API_URL for local dev
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response | void> {
  let token = localStorage.getItem('token');
  if (!token) {
    window.dispatchEvent(new Event('auth-error'));
    return;
  }

  const payload = decodeJWT(token);
  const isExpired = !payload || payload.exp * 1000 < Date.now();

  if (isExpired) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      window.dispatchEvent(new Event('auth-error'));
      return;
    }
    token = localStorage.getItem('token')!;
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  try {
    const response = await fetch(fullUrl, { ...options, headers });
    if (response.status === 401) {
      // Token might be invalid or revoked
      window.dispatchEvent(new Event('auth-error'));
    }
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}