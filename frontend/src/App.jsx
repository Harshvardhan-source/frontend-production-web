import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authApi } from './api/client';

import Login        from './pages/Login';
import Signup       from './pages/Signup';
import Dashboard    from './pages/Dashboard';
import SurveyOpt    from './pages/SurveyOpt';
import SurveyForm   from './pages/SurveyForm';
import SchemeOpt    from './pages/SchemeOpt';
import SchemeVoters from './pages/SchemeVoters';
import DataView     from './pages/DataView';
import VoterSearch  from './pages/VoterSearch';
import SIR          from './pages/Sir';
import AdminPanel   from './pages/AdminPanel';

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  // sessionStorage is intentionally TAB-SCOPED.
  // Two different users can be logged in on two separate tabs without
  // contaminating each other. localStorage is SHARED across all tabs of the
  // same domain — switching it to localStorage caused Tab 2's login to
  // overwrite Tab 1's cc_user, making the name and role flip on reload.
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('cc_user')); } catch { return null; }
  });

  // authReady: true once /auth/me has resolved (success or failure).
  // Protected routes render null (not redirect) until this is set,
  // preventing the flash-to-login on page reload.
  const [authReady, setAuthReady] = useState(false);

  const _persist = (u) => sessionStorage.setItem('cc_user', JSON.stringify(u));
  const _clear   = () => {
    sessionStorage.removeItem('cc_user');
    sessionStorage.removeItem('cc_token');
  };

  const login = useCallback((userData) => {
    setUser(userData);
    _persist(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout({ username: user?.username, email: user?.email }); } catch {}
    setUser(null);
    _clear();
  }, [user]);

  // On every mount, ALWAYS call /auth/me — even if sessionStorage is empty.
  // The FastAPI httpOnly cookie (cc_token) is domain-scoped and survives:
  //   • navigating to another site and coming back
  //   • manual page reload (F5 / Ctrl+R)
  //   • closing and reopening the tab (cookie persists, sessionStorage does not)
  // /auth/me reads role/ward/booth fresh from UserReg every time, so the DB
  // is always the single source of truth regardless of what sessionStorage had.
  useEffect(() => {
    authApi.me()
      .then(({ data }) => {
        if (data?.token) sessionStorage.setItem('cc_token', data.token);

        if (data?.success) {
          // Use != null (not ||) so a legitimate empty string (e.g. mla has
          // ward:"" and booth:"") is kept as-is and never replaced by a stale
          // sessionStorage fallback.
          const updated = {
            username: data.username ?? '',
            email:    data.email    ?? '',
            role:     data.role     != null ? data.role   : '',
            ward:     data.ward     != null ? data.ward   : '',
            booth:    data.booth    != null ? data.booth  : '',
            status:   data.status   != null ? data.status : '',
          };
          setUser(updated);
          _persist(updated);
        } else {
          // /auth/me returned success:false — not authenticated
          setUser(null);
          _clear();
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          // Cookie expired or revoked — force re-login
          setUser(null);
          _clear();
        }
        // Network / 5xx errors: keep whatever sessionStorage had
      })
      .finally(() => setAuthReady(true));
  }, []); // run once on mount

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────
// Wait for authReady before deciding — prevents redirect-to-login during the
// async /auth/me call that happens on every page load.
function Protected({ children }) {
  const { isLoggedIn, authReady } = useAuth();
  if (!authReady) return null;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
          <Route path="/"               element={<Protected><Dashboard /></Protected>} />
          <Route path="/survey"         element={<Protected><SurveyOpt /></Protected>} />
          <Route path="/survey/form"    element={<Protected><SurveyForm /></Protected>} />
          <Route path="/schemes"        element={<Protected><SchemeOpt /></Protected>} />
          <Route path="/schemes/voters" element={<Protected><SchemeVoters /></Protected>} />
          <Route path="/data"           element={<Protected><DataView /></Protected>} />
          <Route path="/voters"         element={<Protected><VoterSearch /></Protected>} />
          <Route path="/sir"            element={<Protected><SIR /></Protected>} />
          <Route path="/admin"          element={<Protected><AdminPanel /></Protected>} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}