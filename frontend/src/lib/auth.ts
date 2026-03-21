let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function decodeJWT(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

export async function refreshToken(): Promise<boolean> {
  if (isRefreshing) {
    return refreshPromise!;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const API_BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  })();

  const result = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;
  return result;
}
