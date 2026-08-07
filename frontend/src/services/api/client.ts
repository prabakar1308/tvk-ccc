export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.split('; ').find(row => row.startsWith('tcc_auth_token='))?.split('=')[1] || null;
}

export function getAuthHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...headers,
  };
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = getAuthHeaders(options.headers);
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof document !== 'undefined') {
        localStorage.removeItem('tcc_active_union_id');
        // Call server-side logout to clear HttpOnly cookie
        fetch('/api/auth/logout', { method: 'POST' }).then(() => {
          window.location.href = '/en/login';
        }).catch(() => {
          window.location.href = '/en/login';
        });
      }
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  
  return response;
}
