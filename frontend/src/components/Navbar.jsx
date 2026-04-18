import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const LINKS = [
  { to: '/',               icon: '⊞', label: 'Dashboard' },
  { to: '/survey',         icon: '✎', label: 'Survey'    },
  { to: '/schemes',        icon: '◈', label: 'Schemes'   },
  { to: '/data',           icon: '⊟', label: 'Data'      },
  { to: '/sir',    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 012-2h11"/>
      </svg>
    ), label: 'Check SIR' },
];

// Admin-only link — shown only to MLA and PA roles
const ADMIN_LINK = { to: '/admin', icon: '⚙', label: 'Admin' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);
  const isAdmin          = ['mla', 'pa'].includes(user?.role);

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────── */}
      <nav className="nav-top">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          
          <img src="/logo.png" alt="Logo" style={{ width:36, height:36, borderRadius:9, objectFit:'contain' }} />
          <span className="nav-logo-text">
            <span className="nav-logo-name">Constituency</span>
            <span className="nav-logo-sub">Connect</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links desktop-only">
          {LINKS.map(l => (
            <Link key={l.to} to={l.to} className={`nav-link ${isActive(l.to) ? 'nav-link-active' : ''}`}>
              <span className="nav-link-icon">{l.icon}</span>
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to={ADMIN_LINK.to} className={`nav-link nav-link-admin ${isActive(ADMIN_LINK.to) ? 'nav-link-active' : ''}`}>
              <span className="nav-link-icon">{ADMIN_LINK.icon}</span>
              {ADMIN_LINK.label}
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="nav-right">
          <div className="nav-user">
            <span className="nav-avatar">{(user?.username || 'U')[0].toUpperCase()}</span>
            <div className="nav-user-info desktop-only">
              <span className="nav-username">{user?.username}</span>
              <span className={`nav-role nav-role-${user?.role}`}>
                {user?.role === 'mla' ? '⚡ ' : ''}{(user?.role || 'booth_worker').replace('_', ' ')}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-sm desktop-only">⏻ Logout</button>
          <button className="hamburger mobile-only" onClick={() => setOpen(p => !p)} aria-label="Menu">
            <span style={{ transform: open ? 'rotate(45deg) translateY(8px)' : 'none' }} />
            <span style={{ opacity: open ? 0 : 1 }} />
            <span style={{ transform: open ? 'rotate(-45deg) translateY(-8px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="nav-drawer">
            {LINKS.map(l => (
              <Link key={l.to} to={l.to} className={`drawer-link ${isActive(l.to) ? 'drawer-link-active' : ''}`}
                onClick={() => setOpen(false)}>
                <span>{l.icon}</span> {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to={ADMIN_LINK.to} className={`drawer-link ${isActive(ADMIN_LINK.to) ? 'drawer-link-active' : ''}`}
                onClick={() => setOpen(false)}
                style={{ color: '#f59e0b' }}>
                <span>{ADMIN_LINK.icon}</span> {ADMIN_LINK.label}
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn-danger" style={{ margin: '8px 0 0', textAlign: 'left' }}>⏻ Logout</button>
          </div>
        )}
      </nav>

      {/* ── Bottom tab bar — mobile only ────────────────── */}
      <nav className="nav-bottom mobile-only">
        {LINKS.map(l => (
          <Link key={l.to} to={l.to} className={`bottom-tab ${isActive(l.to) ? 'bottom-tab-active' : ''}`}>
            <span className="bottom-tab-icon">{l.icon}</span>
            <span className="bottom-tab-label">{l.label}</span>
          </Link>
        ))}
        {isAdmin && (
          <Link to={ADMIN_LINK.to} className={`bottom-tab ${isActive(ADMIN_LINK.to) ? 'bottom-tab-active' : ''}`}>
            <span className="bottom-tab-icon">{ADMIN_LINK.icon}</span>
            <span className="bottom-tab-label">{ADMIN_LINK.label}</span>
          </Link>
        )}
      </nav>

      <style>{`
        /* ── Top nav ──────────────────────────────────── */
        .nav-top {
          position: fixed; top: 0; left: 0; right: 0; z-index: 900;
          height: var(--nav-h);
          background: rgba(8,13,26,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          display: flex; align-items: center;
          padding: 0 20px; gap: 16px;
          flex-wrap: wrap;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-logo-mark {
          width: 36px; height: 36px; border-radius: 9px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 4px 12px rgba(245,158,11,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; color: #090e1c; font-weight: 900;
        }
        .nav-logo-text { display: flex; flex-direction: column; }
        .nav-logo-name { font-family: var(--font-display); font-size: 14px; font-weight: 800; color: var(--text-1); line-height: 1.15; }
        .nav-logo-sub  { font-size: 9px; font-weight: 700; color: var(--gold); letter-spacing: 1.6px; text-transform: uppercase; }

        .nav-links { display: flex; gap: 2px; flex: 1; }
        .nav-link  {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 13px; border-radius: var(--r-sm);
          font-size: 14px; font-weight: 500; color: var(--text-2);
          text-decoration: none; transition: all var(--dur) var(--ease);
        }
        .nav-link:hover      { color: var(--text-1); background: rgba(255,255,255,0.05); }
        .nav-link-active     { color: var(--gold) !important; background: var(--gold-dim) !important; }
        .nav-link-icon       { font-size: 15px; }

        .nav-right     { display: flex; align-items: center; gap: 10px; margin-left: auto; }
        .nav-user      { display: flex; align-items: center; gap: 8px; padding: 5px 10px 5px 5px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: var(--r-full); }
        .nav-avatar    { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), var(--cyan)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #090e1c; flex-shrink: 0; }
        .nav-user-info { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; }
        .nav-username  { font-size: 13px; font-weight: 600; color: var(--text-2); line-height: 1.2; }
        .nav-role      { font-size: 7.5px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; line-height: 1; }
        .nav-role-mla         { color: #f59e0b; }
        .nav-role-pa          { color: #a78bfa; }
        .nav-role-corporator  { color: #22d3ee; }
        .nav-role-booth_worker{ color: #10b981; }

        .hamburger  { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 5px; padding: 4px; }
        .hamburger span { width: 22px; height: 2px; background: var(--text-1); border-radius: 2px; display: block; transition: all 0.28s var(--ease); }

        .nav-drawer {
          position: absolute; top: var(--nav-h); left: 0; right: 0;
          background: rgba(8,13,26,0.98);
          border-bottom: 1px solid var(--border);
          padding: 10px 18px 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .drawer-link { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--r-sm); text-decoration: none; color: var(--text-2); font-size: 15px; font-weight: 500; transition: all var(--dur) var(--ease); }
        .drawer-link:hover       { color: var(--text-1); background: rgba(255,255,255,0.05); }
        .drawer-link-active      { color: var(--gold) !important; background: var(--gold-dim) !important; }
        .nav-link-admin          { border: 1px solid rgba(245,158,11,0.2); }
        .nav-link-admin:hover    { border-color: rgba(245,158,11,0.4); }

        /* ── Bottom tabs ──────────────────────────────── */
        .nav-bottom {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 900;
          height: calc(var(--tab-h) + var(--safe-bottom));
          padding-bottom: var(--safe-bottom);
          background: rgba(8,13,26,0.97);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border);
          display: flex;
        }
        .bottom-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; text-decoration: none; color: var(--text-3); transition: color var(--dur) var(--ease); padding: 6px 2px; }
        .bottom-tab:active       { opacity: 0.7; }
        .bottom-tab-active       { color: var(--gold) !important; }
        .bottom-tab-icon         { font-size: 20px; line-height: 1; }
        .bottom-tab-label        { font-size: 10px; font-weight: 700; letter-spacing: 0.3px; }

        /* ── Responsive helpers ───────────────────────── */
        .desktop-only { display: flex; }
        .mobile-only  { display: none; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only  { display: flex !important; }
          .nav-top      { flex-wrap: wrap; height: auto; min-height: var(--nav-h); }
        }
      `}</style>
    </>
  );
}