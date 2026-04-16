import axios from 'axios';

// ── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── FastAPI Auth instance ─────────────────────────────────────────────────────
const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── CSRF token helper ────────────────────────────────────────────────────────
let csrfReady = false;

async function ensureCsrf() {
  if (csrfReady) return;
  try {
    await api.get('/api/csrf/');   // sets csrftoken cookie in browser
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

// Attach CSRF token to every state-changing request automatically
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    await ensureCsrf();
    config.headers['X-CSRFToken'] = getCookie('csrftoken');
  }
  return config;
});

// Global error interceptor — attach a friendly message for UI display
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
  register: (data) => authClient.post('/auth/register', data),
  login:    (data) => authClient.post('/auth/login',    data),
  logout:   ()     => authClient.post('/auth/logout'),
  me:       ()     => authClient.get('/auth/me'),
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats:        () => api.get('/api/dashboard/'),
  serialNumber: () => api.get('/api/serial-number/'),
  wardDashboard:(ward) => api.get(`/api/ward-dashboard/?ward=${ward}`),
  houseSearch:  (q)    => api.get(`/api/house-search/?q=${encodeURIComponent(q)}`),
};

// ── Survey ───────────────────────────────────────────────────────────────────
export const surveyApi = {
  serialNumber:   ()     => api.get('/api/serial-number/'),
  save:           (data) => api.post('/api/save-survey/', data),
  saveFutureVoters:(data) => api.post('/api/save-future-voters/', data),
  saveDeceased:   (data) => api.post('/api/save-deceased/', data),
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

export default api;