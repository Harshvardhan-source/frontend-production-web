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

// ── /auth/me deduplication ───────────────────────────────────────────────────
// main.py FIX-1 revokes the current token on every /auth/me and issues a fresh
// one.  Two concurrent /auth/me calls cause the second to 401 (revoked token).
// We prevent that by coalescing all in-flight /auth/me calls into one promise.
let _meInFlight = null;

export function callAuthMe() {
  if (_meInFlight) return _meInFlight;
  _meInFlight = authClient
    .get('/auth/me')
    .finally(() => { _meInFlight = null; });
  return _meInFlight;
}

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

// authClient: send cc_token as Authorization Bearer header in addition to the
// httponly cookie.  FastAPI's _token_from_request() already prefers the cookie
// but falls back to the header — this means Render cold-start restarts (which
// drop the in-memory cookie) no longer cause a spurious 401 on /auth/me.
authClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('cc_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

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
      const isMeCheck      = url.includes('/auth/me');

      if (isLoginAttempt) {
        // Wrong credentials — let the caller handle the error, no redirect.
        return Promise.reject(err);
      }

      if (isMeCheck) {
        // /auth/me returned 401.
        // If there is NO token in sessionStorage the session is truly gone →
        // clear and redirect to login.
        // If there IS a token, this is likely a Render cold-start cookie loss or
        // a race condition from FIX-1 token rotation.  The request interceptor
        // above already sent the Bearer header, so this 401 means the token itself
        // is invalid — clear it and redirect too, but do it cleanly.
        handleUnauthenticated();
        return Promise.reject(err);
      }

      // All other protected endpoints: standard redirect.
      handleUnauthenticated();
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
  me:          ()     => callAuthMe(),          // deduplicated — see callAuthMe above
  verifyAdmin: (data) => authClient.post('/auth/verify-admin', data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats:        ()            => api.get('/api/dashboard/'),
  serialNumber: ()            => api.get('/api/serial-number/'),
  houseSearch:  (q)           => api.get(`/api/house-search/?q=${encodeURIComponent(q)}`),
  wardStats:    (ward)        => api.get(`/api/ward-dashboard/?ward=${ward}`),
  boothStats:   (ward, booth) => api.get(`/api/booth-dashboard/?ward=${ward}&booth=${booth}`),
  polledBreakdown: (ward, booth = '') =>
    api.get('/api/polled-breakdown/', {
      params: booth ? { ward, booth } : { ward },
    }),
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
   * Returns { success, status, doc_id } — doc_id is the MongoDB _id of the
   * inserted document; pass it to attachForm() to link the scanned form.
   */
  confirmMatch: (record2025, record2002, notFound2025, notFound2002, searchInputs) =>
    api.post('/api/sir/confirm/', {
      record_2025:    record2025,
      record_2002:    record2002,
      not_found_2025: notFound2025,
      not_found_2002: notFound2002,
      search_inputs:  searchInputs,
    }),

  /**
   * Fetch confirmed SIR decisions (matches + not-found), categorised.
   * category: 'ALL' | 'MATCHED' | 'NOT_FOUND_2025' | 'NOT_FOUND_2002' | 'NOT_FOUND_BOTH'
   */
  confirmedList: (category = 'ALL', page = 1, limit = 20) =>
    api.get('/api/sir/confirmed/', { params: { category, page, limit } }),

  /**
   * Attach AI-extracted Annexure-III form data to an existing confirmed record.
   *
   * @param {string} docId          - MongoDB _id returned by confirmMatch
   * @param {object} formExtraction - structured JSON from Claude Vision extraction
   *
   * Response: { success, doc_id, modified }
   */
  attachForm: (docId, formExtraction) =>
    api.post('/api/sir/attach-form/', {
      doc_id:          docId,
      form_extraction: formExtraction,
    }),

  /**
   * Server-side OCR proxy for Annexure-III SIR forms.
   * Sends the base64 image to the backend, which calls the Anthropic API
   * (direct browser→Anthropic calls are blocked by CORS).
   *
   * @param {string} imageBase64 - base64-encoded image bytes
   * @param {string} mimeType    - e.g. 'image/jpeg', 'image/png', 'image/webp'
   *
   * Response: { success: true, data: { personal, electorDetails, relativeDetails, preprinted, meta } }
   */
  formExtract: (imageBase64, mimeType = 'image/jpeg') =>
    api.post('/api/sir/form-extract/', {
      image:    imageBase64,
      mimeType: mimeType,
    }),
};

// ── SWOT Beneficiary List ─────────────────────────────────────────────────────
export const beneficiaryApi = {
  list: (query, page = 1, limit = 50) =>
    api.post('/api/swot/beneficiaries/', { query, page, limit }),
};

// ── Community Records — 2025_caste_comm_hmc ───────────────────────────────────
export const communityApi = {
  /**
   * Fetch paginated voter records from the `2025_caste_comm_hmc` collection.
   */
  records: (community, page = 1, limit = 25, q = '') => {
    const params = { community, page, limit };
    if (q) params.q = q;
    return api.get('/api/community-records/', { params });
  },

  /**
   * Aggregate community counts from `2025_new_mapped_notmapped_hmc`.
   * Used by the Community Classification Panel when a ward/booth is selected.
   *
   * @param {string|number} [ward]   Ward No (omit for constituency-wide)
   * @param {string|number} [booth]  Booth No (requires ward)
   *
   * Response: { success, ward, booth, total, rows: [{community, category, count}] }
   */
  breakdown: (ward = '', booth = '') => {
    const params = {};
    if (ward)  params.ward  = ward;
    if (booth) params.booth = booth;
    return api.get('/api/community-breakdown/', { params });
  },

  /**
   * Fetch paginated voter records from `2025_new_mapped_notmapped_hmc`
   * filtered by community + optional ward/booth.  Used by the Community
   * Records modal when the dashboard is scoped to a ward or booth.
   *
   * @param {string} community  Exact Community value (comma-joined for groups)
   * @param {string} [ward]     Ward No filter
   * @param {string} [booth]    Booth No filter
   * @param {number} [page]     1-based page
   * @param {number} [limit]    Max 100
   * @param {string} [q]        Free-text search
   */
  mappedRecords: (community, ward = '', booth = '', page = 1, limit = 25, q = '') => {
    const params = { community, page, limit };
    if (ward)  params.ward  = ward;
    if (booth) params.booth = booth;
    if (q)     params.q     = q;
    return api.get('/api/mapped-records/', { params });
  },
};

// ── HMC Records (2025_new) ───────────────────────────────────────────────────
export const hmcApi = {
  /**
   * Fetch voter records from 2025_new collection filtered by Religion (H/M/C).
   * @param {string} religion  - 'H' | 'M' | 'C'
   * @param {number} page      - 1-based page
   * @param {number} limit     - max 100
   * @param {string} [q]       - free-text search
   */
  records: (religion, page = 1, limit = 25, q = '') => {
    const params = { religion, page, limit };
    if (q) params.q = q;
    return api.get('/api/hmc-records/', { params });
  },
};

// ── Polled / NotPolled Records (2023_polled_notpolled_caste_comm_hmc) ─────────
export const polledApi = {
  /**
   * Fetch voter records from the 2023 polled/notpolled dataset.
   * @param {string} filterType  - 'religion' | 'category' | 'community'
   * @param {string} value       - filter value (e.g. 'H', 'Hindu - OBC', 'Billava')
   * @param {string} [status]    - 'Polled' | 'NotPolled' | 'All' (default 'All')
   * @param {number} [page]      - 1-based
   * @param {number} [limit]     - max 100
   * @param {string} [q]         - free-text search
   *
   * Response: { success, filter_type, value, status, total_count, total_pages, page, limit, records[] }
   */
  records: (filterType, value, status = 'All', page = 1, limit = 25, q = '') => {
    const params = { filter_type: filterType, value, status, page, limit };
    if (q) params.q = q;
    return api.get('/api/polled-records/', { params });
  },

  /**
   * Aggregated polled/notpolled breakdown for a ward or booth.
   * Returns { hmc, category, community } — each with per-key {polled, notPolled} counts.
   *
   * @param {string|number} ward   - Ward number (required)
   * @param {string|number} [booth] - Booth number (optional; omit for ward-level)
   *
   * Response: {
   *   success,
   *   hmc:       { H:{polled,notPolled,total}, M:{…}, C:{…}, total:{…} },
   *   category:  [ { key, polled, notPolled }, … ],   // sorted by total desc
   *   community: [ { key, polled, notPolled }, … ],
   * }
   */
  breakdown: (ward, booth = '') => {
    const params = booth ? { ward, booth } : { ward };
    return api.get('/api/polled-breakdown/', { params });
  },
};

// ── Social Media Intelligence ─────────────────────────────────────────────────
export const socialMediaApi = {
  overview:   ()             => api.get('/api/social/overview/'),
  feed:       (params = {})  => api.get('/api/social/feed/', { params }),
  post:       (id)           => api.get(`/api/social/post/${id}/`),
  swot:       (perspective)  => api.get('/api/social/swot/', { params: { perspective } }),
  outrage:    ()             => api.get('/api/social/outrage/'),
  report:     ()             => api.get('/api/social/report/'),
  jobsStatus: ()             => api.get('/api/social/jobs/status/'),
  sync:       ()             => api.post('/api/social/sync/'),
  sources:    ()             => api.get('/api/social/sources/'),
};

export default api;