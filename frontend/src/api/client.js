import axios from 'axios';

// ── Axios instance ───────────────────────────────────────────────────────────
// baseURL is empty so every path like /api/... goes through CRA proxy.
// Add  "proxy": "http://localhost:8000"  to package.json and restart npm start.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── FastAPI Auth instance ─────────────────────────────────────────────────────
const authClient = axios.create({
  baseURL: process.env.REACT_APP_AUTH_URL || '',
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
      err.userMessage =
        'Cannot reach the server. Please try again later.' +
        'and "proxy": "http://localhost:8000" is set in package.json.';
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
  stats: () => api.get('/api/dashboard/'),
};

// ── Survey ───────────────────────────────────────────────────────────────────
export const surveyApi = {
  // Get next serial number
  serialNumber: () => api.get('/api/serial-number/'),

  // Save a single survey record (main household member form)
  save: (data) => api.post('/api/save-survey/', data),

  // Save first-time voters who will be eligible by 2028
  // payload: { futureVoters: [{name, dob, gender}], houseNumber, wardNumber, address }
  saveFutureVoters: (data) => api.post('/api/save-future-voters/', data),

  // Save deceased household members
  // payload: { deceased: [{name, voterid, gender, ageAtDeath, deathCertificate, houseNumber, address}] }
  saveDeceased: (data) => api.post('/api/save-deceased/', data),
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

  // Update a voter record in MongoDB (MainB.CollDB)
  // payload: { voter_id: "ABC123", "Voter Name": "New Name", "Age": "30", ... }
  updateVoter: (payload) => api.post('/api/update-voter/', payload),

  // Update a survey record in MongoDB (SurveyDataBase.SurveyRecords)
  // payload: { record_id: "64a1b2...", firstName: "Ravi", wardNumber: "5", ... }
  updateSurvey: (payload) => api.post('/api/update-survey/', payload),
};

// ── Voters ───────────────────────────────────────────────────────────────────
export const voterApi = {
  // Load full alphabetical list on page mount (up to 2 000 voters)
  list:   (limit = 2000) => api.get('/api/voters/', { params: { limit } }),
  // Keyword search
  search: (q, page = 1)  => api.get('/api/voters/', { params: { q, page } }),
  // Family members by house number
  family: (house)        => api.get('/api/voter-family/', { params: { house } }),
};

// ── Wards ────────────────────────────────────────────────────────────────────
export const wardsApi = {
  list: () => api.get('/api/wards/'),
};

export default api;