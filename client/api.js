export function getToken() {
  return localStorage.getItem("token");
}

export function getRole() {
  return localStorage.getItem("role");
}

// Base URL: same-origin. Vercel rewrites /api/* -> Render
const API_BASE = "/api";

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export async function download(path, filename) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch {}
    throw err;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
