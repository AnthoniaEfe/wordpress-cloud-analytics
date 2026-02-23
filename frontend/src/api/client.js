const API_BASE = import.meta.env.VITE_API_URL || "/api";
const STORAGE_KEY = "wp-analytics-anonymous-id";

function getAnonymousId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export async function api(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Anonymous-Id": getAnonymousId(),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const data = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return {};
        }
      })()
    : {};
  if (!res.ok) {
    throw new Error(
      data.error || data.message || res.statusText || "Request failed"
    );
  }
  return data;
}

export default { api, getAnonymousId };
