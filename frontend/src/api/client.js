import axios from 'axios';

// ── Axios instances ───────────────────────────────────────────────────────────
//
// SEC-4 (main.py): The JWT is stored in an httponly cookie named "cc_token".
// It is NEVER accessible via JavaScript / sessionStorage.
// Both instances set withCredentials: true so the browser attaches the cookie
// automatically on every cross-origin request — no manual token injection needed.
//
// DO NOT add sessionStorage.getItem('cc_token') back to request interceptors.
// The cookie is httponly; sessionStorage will always be empty for this key.

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://production-web-conn-bzpt.onrender.com',
  withCredentials: true,                    // sends cc_token cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

const authClient = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL || 'https://production-web-conn-1-e8bq.onrender.com',
  withCredentials: true,                    // sends cc_token cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

// ── CSRF token helper ─────────────────────────────────────────────────────────
let csrfReady = false;

async function ensureCsrf() {
  if (csrfReady) return;
  try {
    await api.get('/api/csrf/');
  } catch (e) {
    console.warn('CSRF fetch failed:', e.message);
  }
  csrfReady = true;
}

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
  );
  return match ? decodeURIComponent(match[2]) : '';
}

// ── Request interceptors ──────────────────────────────────────────────────────
//
// authClient: no manual token header — cookie is sent automatically.

authClient.interceptors.request.use((config) => {
  // Cookie is httponly and attached automatically via withCredentials.
  // No sessionStorage read needed or possible.
  return config;
});

// api (Django): attach CSRF header for mutating methods only.
api.interceptors.request.use(async (config) => {
  // Cookie is httponly and attached automatically via withCredentials.
  // No sessionStorage read needed or possible.
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    await ensureCsrf();
    config.headers['X-CSRFToken'] = getCookie('csrftoken');
  }
  return config;
});

// ── Response interceptors ─────────────────────────────────────────────────────

// Helper: clear any residual client-side state and redirect to login.
// This should only be called for primary / session-critical requests.
// Background / optional requests must set config.skipAuthRedirect = true
// to opt out (see localPlacesApi below for an example).
function handleUnauthenticated() {
  // Nothing to remove from sessionStorage — token lives in httponly cookie.
  // The server clears the cookie on logout; we just redirect.
  const { pathname } = window.location;
  if (pathname !== '/login' && pathname !== '/signup') {
    window.location.href = '/login';
  }
}

// authClient response interceptor
authClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const isLoginAttempt = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isLoginAttempt) {
        handleUnauthenticated();
      }
    }
    return Promise.reject(err);
  }
);

// Main API (Django) response interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      err.userMessage = 'Cannot reach the server. Please try again later.';

    } else if (err.response.status === 401) {
      // ── skipAuthRedirect ────────────────────────────────────────────────────
      // Some background/optional requests (e.g. local-places-summary on the
      // Dashboard) must NOT redirect to login on 401 — the main session is still
      // valid and the failure is a soft one.  Callers set this flag to opt out:
      //
      //   api.get('/api/some-optional/', { skipAuthRedirect: true })
      //
      // Without this flag, a single background 401 would wipe the user's session
      // and redirect them to login even though dashboard/ returned 200 moments
      // before — which is exactly the bug that was seen in the network tab.
      if (!err.config?.skipAuthRedirect) {
        handleUnauthenticated();
      }
      err.userMessage = 'Session expired. Please log in again.';

    } else if (err.response.status === 403) {
      err.userMessage = 'Session expired or CSRF error. Please refresh the page.';

    } else if (err.response.status === 404) {
      err.userMessage =
        `API route not found (${err.config?.url}). ` +
        'Check that the URL exists in calc/urls.py.';

    } else if (err.response.status >= 500) {
      err.userMessage =
        'Django returned a server error. Check the terminal for the Python traceback.';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register:    (data) => authClient.post('/auth/register',     data),
  login:       (data) => authClient.post('/auth/login',        data),
  logout:      ()     => {
    // Token lives in an httponly cookie — nothing to clear from sessionStorage.
    // The FastAPI /auth/logout endpoint clears the cookie server-side.
    return authClient.post('/auth/logout');
  },
  me:          ()     => authClient.get('/auth/me'),
  verifyAdmin: (data) => authClient.post('/auth/verify-admin', data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats:        ()            => api.get('/api/dashboard/'),
  serialNumber: ()            => api.get('/api/serial-number/'),
  houseSearch:  (q)           => api.get(`/api/house-search/?q=${encodeURIComponent(q)}`),
  wardStats:    (ward)        => api.get(`/api/ward-dashboard/?ward=${ward}`),
  boothStats:   (ward, booth) => api.get(`/api/booth-dashboard/?ward=${ward}&booth=${booth}`),
};

// ── Local Places — uses skipAuthRedirect so a 401 never kicks the user out ────
//
// This is the endpoint that was causing the login-redirect bug.
// The Dashboard fires this as a background stat-card request at mount time.
// If the server returns 401 (e.g. cookie not yet propagated after a fast
// redirect from login), the component's .catch(() => {}) should absorb it
// silently — but only if the interceptor doesn't redirect first.
// skipAuthRedirect: true prevents the redirect; the .catch runs normally.
export const localPlacesApi = {
  summary: () =>
    api.get('/api/local-places-summary/', { skipAuthRedirect: true }),
  ward: (ward) =>
    api.get(`/api/ward-places/?ward=${ward}`, { skipAuthRedirect: true }),
};

// ── Survey ────────────────────────────────────────────────────────────────────
export const surveyApi = {
  serialNumber:     ()     => api.get('/api/serial-number/'),
  save:             (data) => api.post('/api/save-survey/',        data),
  saveFutureVoters: (data) => api.post('/api/save-future-voters/', data),
  saveDeceased:     (data) => api.post('/api/save-deceased/',      data),
};

// ── Schemes ───────────────────────────────────────────────────────────────────
export const schemeApi = {
  voterList:  (ward)      => api.post('/api/scheme-voter-list/', { ward }),
  viewScheme: (voterData) => api.post('/api/view-scheme/',       { voterData }),
};

// ── Data ──────────────────────────────────────────────────────────────────────
export const dataApi = {
  view: (params) => api.get('/api/data/', { params }),

  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/upload-voter-list/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateVoter:  (payload) => api.post('/api/update-voter/',  payload),
  updateSurvey: (payload) => api.post('/api/update-survey/', payload),
};

// ── Voters ────────────────────────────────────────────────────────────────────
export const voterApi = {
  list:   (limit = 2000) => api.get('/api/voters/', { params: { limit } }),
  search: (q, page = 1)  => api.get('/api/voters/', { params: { q, page } }),
  family: (house)        => api.get('/api/voter-family/', { params: { house } }),
};

// ── Wards ─────────────────────────────────────────────────────────────────────
export const wardsApi = {
  list: () => api.get('/api/wards/'),
};

// ── ML Intelligence ───────────────────────────────────────────────────────────
export const mlApi = {
  constituencySwot: ()           => api.get('/api/ml/constituency-swot/'),
  wardSwot:         (wardNumber) => api.get('/api/ml/ward-swot/', { params: { ward: wardNumber } }),
};

// ── AI Insights ───────────────────────────────────────────────────────────────
export const aiApi = {
  queryInsight: (payload) => api.post('/api/ai/query-insight/', payload),
  birdseyeView: (payload) => api.post('/api/ai/birdseye-view/', payload),
};

// ── SWOT Page AI Overview ─────────────────────────────────────────────────────
export const swotApi = {
  overview: (tab) => api.post('/api/ai/swot-overview/', { tab }),
};

// ── Admin — Survey Progress & Location Tracking (MLA / PA only) ──────────────
export const adminApi = {
  surveyProgress: (params = {}) => api.get('/api/admin/survey-progress/', { params }),
  liveLocations:  (email = '')  =>
    api.get('/api/admin/locations/', { params: { mode: 'live', ...(email ? { email } : {}) } }),
  locationHistory: (email, date = '') =>
    api.get('/api/admin/locations/', { params: { mode: 'history', email, ...(date ? { date } : {}) } }),
  locationDates: (email) => api.get('/api/admin/location-dates/', { params: { email } }),
};

// ── Location Ping ─────────────────────────────────────────────────────────────
export const locationApi = {
  ping: (lat, lng, accuracy) => api.post('/api/location/ping/', { lat, lng, accuracy }),
};

// ── AI Chat ───────────────────────────────────────────────────────────────────
export const aiChatApi = {
  send: (message, history = [], includeData = true) =>
    api.post('/api/ai/chat/', { message, history, includeData }),
  export: (exportSpec) =>
    api.post('/api/ai/chat/export/', { exportSpec }, { responseType: 'blob' }),
  dataFiles: () => api.get('/api/ai/data-files/'),
};

// ── SWOT Beneficiary List ─────────────────────────────────────────────────────
export const beneficiaryApi = {
  list: (query, page = 1, limit = 50) =>
    api.post('/api/swot/beneficiaries/', { query, page, limit }),
};

export default api;