// Central fetch wrapper: attaches the bearer token, builds query strings,
// and normalizes error handling for every page's JS.

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000"
  : window.location.origin;

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function buildQuery(params) {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    usp.set(key, value);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

async function request(path, { method = "GET", body, params, isForm = false } = {}) {
  const headers = {};
  const token = localStorage.getItem("tutorhub_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    // no JSON body
  }

  if (!response.ok) {
    const message = (data && (data.detail || data.message)) || `Request failed (${response.status})`;
    throw new ApiError(typeof message === "string" ? message : JSON.stringify(message), response.status, data);
  }

  return data;
}

const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body, opts = {}) => request(path, { method: "POST", body, ...opts }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body, params) => request(path, { method: "PATCH", body, params }),
  del: (path) => request(path, { method: "DELETE" }),
  base: API_BASE,
  ApiError,
};

window.api = api;
