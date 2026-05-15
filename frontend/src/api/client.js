import axios from 'axios';

// ── Axios instance ───────────────────────────────────────────────────────────
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

// ── Response interceptors ────────────────────────────────────────────────────

// Helper: clear session and redirect to login
function handleUnauthenticated() {
  sessionStorage.removeItem('cc_token');
  // Only redirect if not already on login/signup to avoid redirect loops
  const { pathname } = window.location;
  if (pathname !== '/login' && pathname !== '/signup') {
    window.location.href = '/login';
  }
}

// Auth client — handles 401 from /auth/me and other auth routes
authClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Not authenticated — clear token and go to login
      // BUT: don't redirect on login/signup calls themselves (they expect 401 on bad creds)
      const url = err.config?.url || '';
      const isLoginAttempt = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isLoginAttempt) {
        handleUnauthenticated();
      }
    }
    return Promise.reject(err);
  }
);

// Main API client — handles 401/403/404/500
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      err.userMessage = 'Cannot reach the server. Please try again later.';
    } else if (err.response.status === 401) {
      // Session expired on Django side — clear and redirect
      handleUnauthenticated();
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
  stats:         ()             => api.get('/api/dashboard/'),
  serialNumber:  ()             => api.get('/api/serial-number/'),
  houseSearch:   (q)            => api.get(`/api/house-search/?q=${encodeURIComponent(q)}`),
  wardStats:     (ward)         => api.get(`/api/ward-dashboard/?ward=${ward}`),
  boothStats:    (ward, booth)  => api.get(`/api/booth-dashboard/?ward=${ward}&booth=${booth}`),
};

// ── Survey ───────────────────────────────────────────────────────────────────
export const surveyApi = {
  serialNumber:    () => api.get('/api/serial-number/'),
  save:            (data) => api.post('/api/save-survey/', data),
  saveFutureVoters:(data) => api.post('/api/save-future-voters/', data),
  saveDeceased:    (data) => api.post('/api/save-deceased/', data),
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
export const mlApi = {
  constituencySwot: () => api.get('/api/ml/constituency-swot/'),
  wardSwot: (wardNumber) => api.get('/api/ml/ward-swot/', { params: { ward: wardNumber } }),
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
  locationHistory:(email, date = '') =>
    api.get('/api/admin/locations/', { params: { mode: 'history', email, ...(date ? { date } : {}) } }),
  locationDates:  (email)       => api.get('/api/admin/location-dates/', { params: { email } }),
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

// ── AI Intel Birds Eye View ──────────────────────────────────────────────────
export const intelApi = {
  birdseye: (tabData) =>
    api.post('/api/ai/intel-birdseye/', { tabData }),
};

// ── SWOT Beneficiary List ─────────────────────────────────────────────────────
export const beneficiaryApi = {
  list: (query, page = 1, limit = 50) =>
    api.post('/api/swot/beneficiaries/', { query, page, limit }),
};

export default api;