export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

export function apiUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path}`;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  return fetch(url, init);
}

