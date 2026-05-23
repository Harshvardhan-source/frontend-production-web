/**
 * App.jsx — pages that are expensive to reload (Dashboard, SIR, Swot) are
 * kept mounted at all times and shown/hidden with CSS.  Every other route
 * still uses normal React Router <Route> so it mounts/unmounts as usual.
 *
 * How it works
 * ─────────────
 * <KeepAlive> renders all "sticky" pages inside a wrapper div that is always
 * in the DOM.  The currently-active page gets display:block; every other page
 * gets display:none.  React never unmounts them so their state, cache hits,
 * and scroll positions are all preserved.
 *
 * Pages that are NOT in the keep-alive list (Login, Signup, Survey, Schemes,
 * Data, VoterSearch, AdminPanel, AiChat) continue to mount/unmount normally
 * via the standard <Routes> block — they are lightweight or intentionally
 * reset on each visit.
 */

import React, {
  createContext, useContext, useState, useCallback, useEffect,
} from 'react';
import {
  BrowserRouter, Routes, Route, Navigate, useLocation,
} from 'react-router-dom';
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
import Swot         from './pages/Swot';
import AiChat       from './pages/Aichat';
import BJPStrategy  from './pages/BJPStrategy';   // ← NEW
 
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
 
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('cc_user')); } catch { return null; }
  });
  const [authReady, setAuthReady] = useState(false);
 
  const _persist = (u) => sessionStorage.setItem('cc_user', JSON.stringify(u));
  const _clear   = () => {
    sessionStorage.removeItem('cc_user');
    sessionStorage.removeItem('cc_token');
  };
 
  const login = useCallback((userData) => { setUser(userData); _persist(userData); }, []);
  const logout = useCallback(async () => {
    try { await authApi.logout({ username: user?.username, email: user?.email }); } catch {}
    setUser(null); _clear();
  }, [user]);
 
  useEffect(() => {
    authApi.me()
      .then(({ data }) => {
        if (data?.token) sessionStorage.setItem('cc_token', data.token);
        if (data?.success) {
          const updated = {
            username: data.username ?? '', email: data.email ?? '',
            role: data.role != null ? data.role : '',
            ward: data.ward != null ? data.ward : '',
            booth: data.booth != null ? data.booth : '',
            status: data.status != null ? data.status : '',
          };
          setUser(updated); _persist(updated);
        } else { setUser(null); _clear(); }
      })
      .catch((err) => { if (err?.response?.status === 401) { setUser(null); _clear(); } })
      .finally(() => setAuthReady(true));
  }, []);
 
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}
 
function Protected({ children }) {
  const { isLoggedIn, authReady } = useAuth();
  if (!authReady) return null;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
 
const KEEP_ALIVE_ROUTES = [
  { path: '/',     Page: Dashboard },
  { path: '/sir',  Page: SIR       },
  { path: '/swot', Page: Swot      },
];
 
function KeepAlive({ isLoggedIn, authReady }) {
  const location = useLocation();
  if (!authReady || !isLoggedIn) return null;
  return (
    <>
      {KEEP_ALIVE_ROUTES.map(({ path, Page }) => {
        const isActive = location.pathname === path;
        return (
          <div key={path} style={{ display: isActive ? 'block' : 'none' }} aria-hidden={!isActive}>
            <Page />
          </div>
        );
      })}
    </>
  );
}
 
function AppShell() {
  const { isLoggedIn, authReady } = useAuth();
  const location = useLocation();
  const keepAlivePaths = new Set(KEEP_ALIVE_ROUTES.map(r => r.path));
  const isKeepAlivePath = keepAlivePaths.has(location.pathname);
 
  return (
    <>
      <KeepAlive isLoggedIn={isLoggedIn} authReady={authReady} />
      {!isKeepAlivePath && (
        <Routes>
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
          <Route path="/survey"         element={<Protected><SurveyOpt /></Protected>} />
          <Route path="/survey/form"    element={<Protected><SurveyForm /></Protected>} />
          <Route path="/schemes"        element={<Protected><SchemeOpt /></Protected>} />
          <Route path="/schemes/voters" element={<Protected><SchemeVoters /></Protected>} />
          <Route path="/data"           element={<Protected><DataView /></Protected>} />
          <Route path="/voters"         element={<Protected><VoterSearch /></Protected>} />
          <Route path="/admin"          element={<Protected><AdminPanel /></Protected>} />
          <Route path="/ai"             element={<Protected><AiChat /></Protected>} />
          <Route path="/bjp"            element={<Protected><BJPStrategy /></Protected>} />  {/* ← NEW */}
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}
 
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
 