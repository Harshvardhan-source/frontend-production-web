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

  // On startup: fetch fresh token from FastAPI and store it for Django requests.
  // Django lives on a different domain so it never receives the FastAPI cookie —
  // we bridge this by sending the token as Authorization: Bearer in client.js.
  useEffect(() => {
    if (!user) return;
    authApi.me()
      .then(({ data }) => {
        if (data?.token) sessionStorage.setItem('cc_token', data.token);
        // Refresh role/ward/booth from DB in case admin updated them
        if (data?.success) {
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
      .catch(() => {}); // silent — don't log out on me() failure
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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