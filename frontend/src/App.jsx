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
  // ── FIX 1: localStorage instead of sessionStorage for cc_user.
  //    sessionStorage is TAB-SCOPED — it is wiped the moment the user navigates
  //    to another website and comes back, or opens a new tab. This caused the
  //    role to vanish or flip on every reload from another site.
  //    localStorage persists across tabs, reloads, and browser restarts.
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_user')); } catch { return null; }
  });

  // ── FIX 2: authReady — wait for /auth/me to finish before Protected routes
  //    decide to redirect. Without this, Protected briefly sees user=null while
  //    the async /auth/me is in-flight and incorrectly redirects to /login.
  const [authReady, setAuthReady] = useState(false);

  const _persist = (userData) => localStorage.setItem('cc_user', JSON.stringify(userData));
  const _clear   = () => { localStorage.removeItem('cc_user'); sessionStorage.removeItem('cc_token'); };

  const login = useCallback((userData) => {
    setUser(userData);
    _persist(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout({ username: user?.username, email: user?.email }); } catch {}
    setUser(null);
    _clear();
  }, [user]);

  // ── On every mount: call /auth/me to get a fresh JWT and re-read the role
  //    directly from UserReg — the SINGLE source of truth.
  //    The FastAPI httpOnly cookie survives navigation between sites, so this
  //    correctly re-hydrates the session even after localStorage was wiped.
  //    We no longer skip this when user===null — the cookie may still be valid.
  useEffect(() => {
    authApi.me()
      .then(({ data }) => {
        if (data?.token) sessionStorage.setItem('cc_token', data.token);

        if (data?.success) {
          // ── FIX 3: != null instead of || when merging DB values.
          //    data.role is "" for mla/pa (no ward/booth assigned), and || treats
          //    "" as falsy — silently falling back to the stale localStorage value
          //    and causing the role to flip randomly between reloads.
          const prev = user || {};
          const updated = {
            ...prev,
            username: data.username ?? prev.username ?? '',
            email:    data.email    ?? prev.email    ?? '',
            role:     data.role   != null ? data.role   : (prev.role   ?? ''),
            ward:     data.ward   != null ? data.ward   : (prev.ward   ?? ''),
            booth:    data.booth  != null ? data.booth  : (prev.booth  ?? ''),
            status:   data.status != null ? data.status : (prev.status ?? ''),
          };
          setUser(updated);
          _persist(updated);
        } else {
          setUser(null);
          _clear();
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          // Token expired — force re-login
          setUser(null);
          _clear();
        }
        // Network / 5xx: keep localStorage state, user stays logged in
      })
      .finally(() => setAuthReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────
// Render nothing until authReady — prevents the flash-redirect-to-login on reload.
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