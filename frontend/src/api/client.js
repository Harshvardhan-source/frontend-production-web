import axios from 'axios';

// ── Axios instances ───────────────────────────────────────────────────────────
//
// Architecture: two separate Render services on different subdomains.
//   authClient → FastAPI  (production-web-conn-1-e8bq.onrender.com)
//   api        → Django   (production-web-conn-bzpt.onrender.com)
//
// Auth token flow:
//   1. FastAPI login/me returns { token: "..." } in the response body.
//   2. authClient response interceptor saves it to sessionStorage as 'cc_token'.
//   3. api request interceptor reads it from sessionStorage and sends it as
//      Authorization: Bearer <token> on every Django API call.
//
// Why not rely on the httponly cookie alone?
//   The cookie is set on the FastAPI domain. The browser will NOT forward it to
//   Django's different subdomain even with withCredentials:true — that only works
//   for same-domain or same-site origins.  sessionStorage + Bearer header is the
//   correct pattern for a cross-subdomain microservice setup.

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://production-web-conn-bzpt.onrender.com',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const authClient = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL || 'https://production-web-conn-1-e8bq.onrender.com',
  withCredentials: true,
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

// authClient: cookie is sent automatically to same-domain FastAPI via withCredentials.
// No manual header needed for /auth/* calls.
authClient.interceptors.request.use((config) => config);

// api (Django): must send token as Authorization header because the cc_token
// cookie was set on FastAPI's domain and won't be forwarded cross-subdomain.
api.interceptors.request.use(async (config) => {
  const token = sessionStorage.getItem('cc_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    await ensureCsrf();
    config.headers['X-CSRFToken'] = getCookie('csrftoken');
  }
  return config;
});

// ── Response interceptors ─────────────────────────────────────────────────────

function handleUnauthenticated() {
  sessionStorage.removeItem('cc_token');
  const { pathname } = window.location;
  if (pathname !== '/login' && pathname !== '/signup') {
    window.location.href = '/login';
  }
}

// authClient: save token from login/me responses into sessionStorage so Django
// calls can use it via the Authorization header (cross-subdomain requirement).
authClient.interceptors.response.use(
  (res) => {
    // Persist token whenever FastAPI returns one (login, /auth/me rotation)
    if (res.data?.token) {
      sessionStorage.setItem('cc_token', res.data.token);
    }
    return res;
  },
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
      // skipAuthRedirect: true — caller opts out of the auto-redirect.
      // Use this for background/optional requests that should fail silently.
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
    sessionStorage.removeItem('cc_token');
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

// ── Local Places — skipAuthRedirect so a 401 never kicks the user out ─────────
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

// ── SIR Confirm Match ─────────────────────────────────────────────────────────
export const sirApi = {
  /**
   * Persist the user's confirmation decision from the SimilarRecordsPanel.
   * @param {Object|null} record2025   - ticked 2025 row (null = not found)
   * @param {Object|null} record2002   - ticked 2002 row (null = not found)
   * @param {boolean}     notFound2025 - user marked "not in 2025 roll"
   * @param {boolean}     notFound2002 - user marked "not in 2002 roll"
   * @param {Object}      searchInputs - { name, epic, house, relation }
   */
  confirmMatch: (record2025, record2002, notFound2025, notFound2002, searchInputs) =>
    api.post('/api/sir/confirm/', {
      record_2025:    record2025,
      record_2002:    record2002,
      not_found_2025: notFound2025,
      not_found_2002: notFound2002,
      search_inputs:  searchInputs,
    }),
};

// ── SWOT Beneficiary List ─────────────────────────────────────────────────────
export const beneficiaryApi = {
  list: (query, page = 1, limit = 50) =>
    api.post('/api/swot/beneficiaries/', { query, page, limit }),
};

export default api;