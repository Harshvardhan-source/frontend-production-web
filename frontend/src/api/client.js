import axios from 'axios';

// ── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const authClient = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL || 'https://production-web-conn-1-qoya.onrender.com',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

authClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cc_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── CSRF token helper ────────────────────────────────────────────────────────
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

// Endpoints decorated with @csrf_exempt on the backend — skip CSRF for these
const CSRF_EXEMPT_PATHS = [
  '/api/ai/query-insight/',
  '/api/ai/birdseye-view/',
  '/api/ai/export/',
];

api.interceptors.request.use(async (config) => {
  const token = sessionStorage.getItem('cc_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  const isMutation = ['post', 'put', 'patch', 'delete'].includes(config.method);
  const isExempt   = CSRF_EXEMPT_PATHS.some(p => config.url?.includes(p));
  if (isMutation && !isExempt) {
    await ensureCsrf();
    config.headers['X-CSRFToken'] = getCookie('csrftoken');
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      err.userMessage = 'Cannot reach the server. Please try again later.';
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

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register:    (data) => authClient.post('/auth/register',     data),
  login:       (data) => authClient.post('/auth/login',        data),
  logout:      ()     => {
    sessionStorage.removeItem('cc_token');
    return authClient.post('/auth/logout');
  },
  me:          ()     => authClient.get('/auth/me'),
  verifyAdmin: (data) => authClient.post('/auth/verify-admin', data),
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats:        ()            => api.get('/api/dashboard/'),
  serialNumber: ()            => api.get('/api/serial-number/'),
  houseSearch:  (q)           => api.get(`/api/house-search/?q=${encodeURIComponent(q)}`),
  wardStats:    (ward)        => api.get(`/api/ward-dashboard/?ward=${ward}`),
  boothStats:   (ward, booth) => api.get(`/api/booth-dashboard/?ward=${ward}&booth=${booth}`),
};

// ── Survey ───────────────────────────────────────────────────────────────────
export const surveyApi = {
  serialNumber:     ()     => api.get('/api/serial-number/'),
  save:             (data) => api.post('/api/save-survey/',        data),
  saveFutureVoters: (data) => api.post('/api/save-future-voters/', data),
  saveDeceased:     (data) => api.post('/api/save-deceased/',      data),
};

// ── Schemes ──────────────────────────────────────────────────────────────────
export const schemeApi = {
  voterList:  (ward)      => api.post('/api/scheme-voter-list/', { ward }),
  viewScheme: (voterData) => api.post('/api/view-scheme/',       { voterData }),
};

// ── Data ─────────────────────────────────────────────────────────────────────
export const dataApi = {
  view:   (params) => api.get('/api/data/', { params }),

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

// ── Voters ───────────────────────────────────────────────────────────────────
export const voterApi = {
  list:   (limit = 2000) => api.get('/api/voters/', { params: { limit } }),
  search: (q, page = 1)  => api.get('/api/voters/', { params: { q, page } }),
  family: (house)        => api.get('/api/voter-family/', { params: { house } }),
};

// ── Wards ────────────────────────────────────────────────────────────────────
export const wardsApi = {
  list: () => api.get('/api/wards/'),
};

// ── ML Intelligence ───────────────────────────────────────────────────────────
// Note: only constituency-swot exists in urls.py — ward-swot route does not exist
export const mlApi = {
  constituencySwot: () => api.get('/api/ml/constituency-swot/'),
};

// ── AI Insights — routed through Django backend (Anthropic called server-side)
// Backend reads your Excel/CSV files and live DB, then calls Claude.
// Use these instead of calling Anthropic directly from the frontend.
export const aiApi = {
  // Single conversational query — pass history array for multi-turn
  queryInsight: (query, history = []) =>
    api.post('/api/ai/query-insight/', { query, history }),

  // Full constituency overview — no input needed
  birdseyeView: () => api.post('/api/ai/birdseye-view/', {}),
};

// ── Admin — Survey Progress & Location Tracking (MLA / PA only) ──────────────
export const adminApi = {
  surveyProgress: (params = {}) => api.get('/api/admin/survey-progress/', { params }),

  liveLocations:  (email = '')  =>
    api.get('/api/admin/locations/', { params: { mode: 'live', ...(email ? { email } : {}) } }),

  locationHistory: (email, date = '') =>
    api.get('/api/admin/locations/', { params: { mode: 'history', email, ...(date ? { date } : {}) } }),

  locationDates: (email) => api.get('/api/admin/location-dates/', { params: { email } }),

  // User management
  users:      (params = {}) => api.get('/api/admin/users/',        { params }),
  approve:    (email)       => api.post('/api/admin/approve/',      { email }),
  reject:     (email)       => api.post('/api/admin/reject/',       { email }),
  updateRole: (payload)     => api.post('/api/admin/update-role/',  payload),
  disable:    (email)       => api.post('/api/admin/disable/',      { email }),
  enable:     (email)       => api.post('/api/admin/enable/',       { email }),
};

// ── Location Ping — called automatically by useLocationPing() hook ─────────────
export const locationApi = {
  ping: (lat, lng, accuracy) => api.post('/api/location/ping/', { lat, lng, accuracy }),
};

export default api;