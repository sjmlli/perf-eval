export function getToken() {
  return localStorage.getItem("token");
}

export function getRole() {
  return localStorage.getItem("role");
}

// All client calls should be like: api("/periods") not api("/api/periods")
// But to be robust, we normalize if someone passes "/api/..."
const API_BASE = "/api";

function normalizePath(path) {
  if (!path) return "/";
  // ensure leading slash
  let p = path.startsWith("/") ? path : `/${path}`;
  // if caller mistakenly included /api prefix, strip it
  if (p === "/api") return "/";
  if (p.startsWith("/api/")) p = p.slice(4); // remove "/api"
  return p;
}

export async function api(path, { method = "GET", body } = {}) {
  const p = normalizePath(path);

  const res = await fetch(`${API_BASE}${p}`, {
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

// Download helper (CSV / files) with Authorization header
export async function download(path, filename) {
  const p = normalizePath(path);

  const res = await fetch(`${API_BASE}${p}`, {
    method: "GET",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  if (!res.ok) {
    let err = {};
    try {
      err = await res.json();
    } catch {}
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
