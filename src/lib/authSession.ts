const TOKEN_KEY = 'giurom_access_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const t = sessionStorage.getItem(TOKEN_KEY)?.trim();
    return t || null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (!token) {
    sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  setAccessToken(null);
}
