import { toast } from "@/components/ui/use-toast";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

function decodeJWT(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

async function refreshToken(): Promise<boolean> {
  if (isRefreshing) {
    return refreshPromise!;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch('/api/auth/refresh', {
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

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response | void> {
  let token = localStorage.getItem('token');
  if (!token) {
    toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
    window.location.href = '/auth';
    return;
  }

  const payload = decodeJWT(token);
  const isExpired = !payload || payload.exp * 1000 < Date.now();

  if (isExpired) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      localStorage.removeItem('token');
      toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
      window.location.href = '/auth';
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
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}