import { decodeJWT, refreshToken } from './auth';

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

  try {
    const response = await fetch(url, { ...options, headers });
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