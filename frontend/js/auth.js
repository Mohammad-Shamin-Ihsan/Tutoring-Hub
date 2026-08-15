// Session helpers shared by every page. Token + user are kept in
// localStorage and sent as an Authorization: Bearer header (see api.js).

const AUTH_TOKEN_KEY = "tutorhub_token";
const AUTH_USER_KEY = "tutorhub_user";

const auth = {
  saveSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  getUser() {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  isAuthenticated() {
    return Boolean(this.getToken());
  },
  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "/login.html";
  },
  async login(email, password) {
    const data = await window.api.post("/api/auth/login", { email, password });
    this.saveSession(data.access_token, data.user);
    return data.user;
  },
  async register(payload) {
    const data = await window.api.post("/api/auth/register", payload);
    this.saveSession(data.access_token, data.user);
    return data.user;
  },
  /** Redirects to login if not authenticated, or to home if wrong role. Call at top of protected pages. */
  requireRole(role) {
    const user = this.getUser();
    if (!this.isAuthenticated() || !user) {
      window.location.href = "/login.html";
      return null;
    }
    if (role && user.role !== role) {
      window.location.href = "/index.html";
      return null;
    }
    return user;
  },
};

window.auth = auth;
