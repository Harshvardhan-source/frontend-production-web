import React, { createContext, useContext, useState, useCallback } from 'react';
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
import SIR          from './pages/Sir';  // ← ADD THIS LINE: Import SIR component

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
  }, [user]);

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
          
          {/* ─── ADD THIS ROUTE: SIR Module ──────────────────────────────────── */}
          <Route path="/sir"            element={<Protected><SIR /></Protected>} />
          
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

/**
 * WHAT CHANGED:
 * 
 * 1. Added import at top:
 *    import SIR from './pages/Sir';
 * 
 * 2. Added route in Routes:
 *    <Route path="/sir" element={<Protected><SIR /></Protected>} />
 * 
 * Now when user clicks "Check SIR" in navbar:
 * - Navigates to /sir route
 * - Loads Sir.jsx component
 * - Protected by login requirement
 * - Can fetch SIR data from /api/sir-data/
 * - Can run bulk processing on /api/sir-bulk/
 */