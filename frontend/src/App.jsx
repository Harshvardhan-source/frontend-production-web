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
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('cc_user')); } catch { return null; }
  });

  const login = useCallback((userData) => {
    setUser(userData);
    sessionStorage.setItem('cc_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout({ username: user?.username, email: user?.email }); } catch {}
    setUser(null);
    sessionStorage.removeItem('cc_user');
    sessionStorage.removeItem('cc_token');
  }, [user]);

  // ── On startup: call /auth/me to get fresh JWT and store it for Django ────
  // This fixes cross-domain auth: FastAPI sets cookie on its domain, but Django
  // needs the token via Authorization header. /auth/me returns a fresh token
  // so existing sessions don't need to log out.
  useEffect(() => {
    if (!user) return;
    authApi.me()
      .then(({ data }) => {
        if (data.token) {
          sessionStorage.setItem('cc_token', data.token);
        }
        // Refresh role/ward/booth in case admin changed them
        if (data.success) {
          const updated = {
            ...user,
            role:   data.role   || user.role   || '',
            ward:   data.ward   || user.ward   || '',
            booth:  data.booth  || user.booth  || '',
            status: data.status || user.status || '',
          };
          setUser(updated);
          sessionStorage.setItem('cc_user', JSON.stringify(updated));
        }
      })
      .catch(() => {
        // Token expired or invalid — clear session
        setUser(null);
        sessionStorage.removeItem('cc_user');
        sessionStorage.removeItem('cc_token');
      });
  }, []); // run once on mount

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────
function Protected({ children }) {
  const { isLoggedIn } = useAuth();
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