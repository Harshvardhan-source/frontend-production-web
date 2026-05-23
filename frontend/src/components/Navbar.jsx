import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const LEFT_TABS = [
  { to: '/',       icon: '⊞', label: 'Dashboard' },
  { to: '/survey', icon: '✎', label: 'Survey'    },
];

const RIGHT_TABS = [
  { to: '/schemes', icon: '◈', label: 'Schemes'   },
  { to: '/data',    icon: '⊟', label: 'Data'      },
  { to: '/sir',     icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ), label: 'SIR' },
];

const ALL_NAV_LINKS = [
  ...LEFT_TABS, ...RIGHT_TABS,
  { to: '/swot', icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <rect x="13" y="3" width="8" height="8" rx="1"/>
        <rect x="3" y="13" width="8" height="8" rx="1"/>
        <rect x="13" y="13" width="8" height="8" rx="1"/>
      </svg>
    ), label: 'SWOT' },
  { to: '/bjp', icon: null, label: 'BJP Strategy', isBjp: true },
  { to: '/ai',  icon: null, label: 'AI' },
];

const ADMIN_LINK = { to: '/admin', icon: '⚙', label: 'Admin' };

const AIIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.8 2 8 3.8 8 6v1H7C5.3 7 4 8.3 4 10v2c0 1.7 1.3 3 3 3h1v1c0 2.2 1.8 4 4 4s4-1.8 4-4v-1h1c1.7 0 3-1.3 3-3v-2c0-1.7-1.3-3-3-3h-1V6c0-2.2-1.8-4-4-4z"/>
    <circle cx="9.5" cy="10.5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="14.5" cy="10.5" r="1" fill="currentColor" stroke="none"/>
    <path d="M9 14s.8 1 3 1 3-1 3-1"/>
  </svg>
);

const BJPIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

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
        <Link to="/" className="nav-logo">
          <img src="/logo.png" alt="Logo" style={{ width:32, height:32, borderRadius:8, objectFit:'contain' }} />
          <span className="nav-logo-text">
            <span className="nav-logo-name">Constituency</span>
            <span className="nav-logo-sub">Connect</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links desktop-only">
          {ALL_NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to}
              className={`nav-link ${isActive(l.to) ? 'nav-link-active' : ''} ${l.to === '/ai' ? 'nav-link-ai' : ''} ${l.isBjp ? 'nav-link-bjp' : ''}`}>
              {l.isBjp
                ? <BJPIcon size={13}/>
                : l.icon
                  ? <span className="nav-link-icon">{l.icon}</span>
                  : null
              }
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to={ADMIN_LINK.to}
              className={`nav-link nav-link-admin ${isActive(ADMIN_LINK.to) ? 'nav-link-active' : ''}`}>
              <span className="nav-link-icon">{ADMIN_LINK.icon}</span>
              {ADMIN_LINK.label}
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="nav-right">
          <Link to="/swot"
            className={`swot-pill mobile-only ${isActive('/swot') ? 'swot-pill-active' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="8" height="8" rx="1"/>
              <rect x="13" y="3" width="8" height="8" rx="1"/>
              <rect x="3" y="13" width="8" height="8" rx="1"/>
              <rect x="13" y="13" width="8" height="8" rx="1"/>
            </svg>
            SWOT
          </Link>

          {/* BJP pill — mobile top bar */}
          <Link to="/bjp"
            className={`bjp-pill mobile-only ${isActive('/bjp') ? 'bjp-pill-active' : ''}`}>
            <BJPIcon size={11}/>
            BJP
          </Link>

          <div className="nav-user">
            <span className="nav-avatar">{(user?.username || 'U')[0].toUpperCase()}</span>
            <div className="nav-user-info desktop-only">
              <span className="nav-username">{user?.username}</span>
              <span className={`nav-role nav-role-${user?.role}`}>
                {(user?.role || 'booth_worker').replace('_', ' ')}
              </span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn btn-danger btn-sm desktop-only">⏻ Logout</button>

          {isAdmin && (
            <Link to="/admin"
              className={`admin-topbtn mobile-only ${isActive('/admin') ? 'admin-topbtn-active' : ''}`}
              aria-label="Admin">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </Link>
          )}

          <button className="hamburger mobile-only" onClick={() => setOpen(p => !p)} aria-label="Menu">
            <span style={{ transform: open ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <span style={{ opacity: open ? 0 : 1 }} />
            <span style={{ transform: open ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="nav-drawer">
            {ALL_NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}
                className={`drawer-link ${isActive(l.to) ? 'drawer-link-active' : ''} ${l.to === '/ai' ? 'drawer-link-ai' : ''} ${l.isBjp ? 'drawer-link-bjp' : ''}`}
                onClick={() => setOpen(false)}>
                <span>
                  {l.isBjp ? <BJPIcon size={15}/> : (l.icon ?? <AIIcon size={15}/>)}
                </span>
                {l.label}
                {l.to === '/ai' && <span className="drawer-ai-badge">AI</span>}
                {l.isBjp && <span className="drawer-bjp-badge">INTEL</span>}
              </Link>
            ))}
            {isAdmin && (
              <Link to={ADMIN_LINK.to}
                className={`drawer-link ${isActive(ADMIN_LINK.to) ? 'drawer-link-active' : ''}`}
                onClick={() => setOpen(false)}>
                <span>{ADMIN_LINK.icon}</span>{ADMIN_LINK.label}
              </Link>
            )}
            <div className="drawer-divider"/>
            <button onClick={() => { setOpen(false); handleLogout(); }} className="drawer-logout">
              ⏻ Logout
            </button>
          </div>
        )}
      </nav>

      {/* ── Bottom tabs (mobile) ────────────────────────── */}
      <nav className="nav-bottom mobile-only">
        {LEFT_TABS.map(t => (
          <Link key={t.to} to={t.to}
            className={`bottom-tab ${isActive(t.to) ? 'bottom-tab-active' : ''}`}>
            <span className="bottom-tab-icon">{t.icon}</span>
            <span className="bottom-tab-label">{t.label}</span>
          </Link>
        ))}
        {/* Centre spacer for AI FAB */}
        <div className="bottom-tab-spacer"/>
        {RIGHT_TABS.map(t => (
          <Link key={t.to} to={t.to}
            className={`bottom-tab ${isActive(t.to) ? 'bottom-tab-active' : ''}`}>
            <span className="bottom-tab-icon">{t.icon}</span>
            <span className="bottom-tab-label">{t.label}</span>
          </Link>
        ))}
      </nav>

      {/* ── AI FAB ──────────────────────────────────────── */}
      <Link to="/ai"
        className={`ai-fab ${isActive('/ai') ? 'ai-fab-active' : ''}`}
        aria-label="AI Chat">
        <AIIcon size={20}/>
        <span className="ai-fab-label">AI</span>
      </Link>

      <style>{`
        .nav-top {
          position: sticky; top: 0; z-index: 900;
          height: 54px; padding: 0 18px;
          display: flex; align-items: center; gap: 12px;
          background: rgba(8,13,26,0.97);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-logo-text { display: flex; flex-direction: column; }
        .nav-logo-name { font-family: var(--font-display); font-size: 13px; font-weight: 800; color: var(--text-1); line-height: 1.15; }
        .nav-logo-sub  { font-size: 8px; font-weight: 700; color: var(--gold); letter-spacing: 1.5px; text-transform: uppercase; }

        .nav-links { display: flex; gap: 2px; flex: 1; }
        .nav-link {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 13px; border-radius: var(--r-sm);
          font-size: 13px; font-weight: 500; color: var(--text-2);
          text-decoration: none; transition: all var(--dur) var(--ease);
        }
        .nav-link:hover   { color: var(--text-1); background: rgba(255,255,255,0.05); }
        .nav-link-active  { color: var(--gold) !important; background: var(--gold-dim) !important; }
        .nav-link-icon    { font-size: 15px; }

        /* BJP Strategy link — saffron/red style */
        .nav-link-bjp {
          border: 1px solid rgba(220,38,38,0.3);
          color: #fca5a5 !important;
          background: rgba(220,38,38,0.08);
          font-weight: 700;
        }
        .nav-link-bjp:hover { border-color: rgba(220,38,38,0.5); background: rgba(220,38,38,0.14) !important; }
        .nav-link-bjp.nav-link-active { background: rgba(220,38,38,0.2) !important; border-color: rgba(220,38,38,0.5); color: #fca5a5 !important; }

        .nav-link-ai {
          border: 1px solid rgba(34,211,238,0.25);
          color: #22d3ee !important; background: rgba(34,211,238,0.06);
        }
        .nav-link-ai:hover { border-color: rgba(34,211,238,0.45); background: rgba(34,211,238,0.12) !important; }
        .nav-link-ai.nav-link-active { background: rgba(34,211,238,0.15) !important; border-color: rgba(34,211,238,0.4); }
        .nav-link-admin { border: 1px solid rgba(245,158,11,0.2); }
        .nav-link-admin:hover { border-color: rgba(245,158,11,0.4); }

        /* BJP pill — mobile top bar */
        .bjp-pill {
          display: flex; align-items: center; gap: 4px;
          padding: 5px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.2px;
          color: #fca5a5; text-decoration: none;
          border: 1px solid rgba(220,38,38,0.3);
          background: rgba(220,38,38,0.1);
          white-space: nowrap; flex-shrink: 0;
          transition: all var(--dur) var(--ease);
        }
        .bjp-pill:active { opacity: 0.7; }
        .bjp-pill-active { color: #fff !important; border-color: rgba(220,38,38,0.6) !important; background: rgba(220,38,38,0.25) !important; }

        .swot-pill {
          display: flex; align-items: center; gap: 4px;
          padding: 5px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.2px;
          color: var(--text-2); text-decoration: none;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.05);
          white-space: nowrap; flex-shrink: 0;
          transition: all var(--dur) var(--ease);
        }
        .swot-pill:active { opacity: 0.7; }
        .swot-pill-active { color: var(--gold) !important; border-color: rgba(245,158,11,0.4) !important; background: var(--gold-dim) !important; }

        .nav-right { display: flex; align-items: center; gap: 7px; margin-left: auto; flex-shrink: 0; }
        .nav-user  { display: flex; align-items: center; gap: 7px; padding: 4px 8px 4px 4px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: var(--r-full); }
        .nav-avatar { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), var(--cyan, #22d3ee)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #090e1c; flex-shrink: 0; }
        .nav-user-info { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; }
        .nav-username  { font-size: 13px; font-weight: 600; color: var(--text-2); line-height: 1.2; }
        .nav-role      { font-size: 9px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; line-height: 1; }
        .nav-role-mla         { color: #f59e0b; }
        .nav-role-pa          { color: #a78bfa; }
        .nav-role-corporator  { color: #22d3ee; }
        .nav-role-booth_worker{ color: #10b981; }

        .hamburger { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 5px; padding: 4px; }
        .hamburger span { width: 20px; height: 2px; background: var(--text-1); border-radius: 2px; display: block; transition: all 0.28s var(--ease); }

        .nav-drawer {
          position: absolute; top: 54px; left: 0; right: 0;
          background: rgba(8,13,26,0.98);
          border-bottom: 1px solid var(--border);
          padding: 10px 18px 16px;
          display: flex; flex-direction: column; gap: 4px; z-index: 899;
        }
        .drawer-link { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--r-sm); text-decoration: none; color: var(--text-2); font-size: 15px; font-weight: 500; transition: all var(--dur) var(--ease); }
        .drawer-link:hover  { color: var(--text-1); background: rgba(255,255,255,0.05); }
        .drawer-link-active { color: var(--gold) !important; background: var(--gold-dim) !important; }
        .drawer-link-ai     { color: #22d3ee !important; }
        .drawer-link-ai:hover { background: rgba(34,211,238,0.08) !important; }
        .drawer-link-bjp    { color: #fca5a5 !important; }
        .drawer-link-bjp:hover { background: rgba(220,38,38,0.08) !important; }
        .drawer-ai-badge {
          margin-left: auto; font-size: 9px; font-weight: 800; letter-spacing: 0.8px;
          background: linear-gradient(135deg, #22d3ee, #0ea5e9);
          color: #04101a; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;
        }
        .drawer-bjp-badge {
          margin-left: auto; font-size: 9px; font-weight: 800; letter-spacing: 0.8px;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: #fff; padding: 2px 7px; border-radius: 4px; text-transform: uppercase;
        }
        .drawer-divider { height: 1px; background: var(--border); margin: 8px 0; }
        .drawer-logout { background: none; border: none; cursor: pointer; color: #f87171; font-size: 14px; font-weight: 600; padding: 10px 14px; text-align: left; border-radius: var(--r-sm); transition: background 0.15s; }
        .drawer-logout:hover { background: rgba(239,68,68,0.08); }

        /* ── Bottom tabs ──────────────────────────────── */
        .nav-bottom {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 900;
          height: calc(52px + env(safe-area-inset-bottom, 0px));
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background: rgba(8,13,26,0.97);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border);
          display: grid; grid-template-columns: repeat(6, 1fr);
          align-items: stretch;
        }
        .bottom-tab {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 2px;
          text-decoration: none; color: var(--text-3);
          transition: color var(--dur) var(--ease);
          padding: 5px 2px 3px;
        }
        .bottom-tab:active { opacity: 0.7; }
        .bottom-tab-active { color: var(--gold) !important; }
        .bottom-tab-icon   { font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; }
        .bottom-tab-label  { font-size: 9px; font-weight: 700; letter-spacing: 0.2px; white-space: nowrap; text-align: center; }
        .bottom-tab-spacer { }

        .admin-topbtn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 8px;
          color: var(--text-2); text-decoration: none;
          background: rgba(255,255,255,0.05); border: 1px solid var(--border);
          flex-shrink: 0; transition: all var(--dur) var(--ease);
        }
        .admin-topbtn:active { opacity: 0.7; }
        .admin-topbtn-active { color: #f59e0b !important; border-color: rgba(245,158,11,0.4) !important; background: rgba(245,158,11,0.08) !important; }

        /* ── AI FAB ───────────────────────────────────── */
        .ai-fab {
          position: fixed;
          bottom: calc(52px + env(safe-area-inset-bottom, 0px) - 16px);
          left: calc(100vw * 11 / 12 - 26px);
          z-index: 902; width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(140deg, #67e8f9 0%, #38bdf8 50%, #818cf8 100%);
          box-shadow: 0 4px 18px rgba(34,211,238,0.3), 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.28);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
          text-decoration: none; color: #04111e;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .ai-fab:active { transform: scale(0.91); box-shadow: 0 2px 8px rgba(34,211,238,0.25); }
        .ai-fab-active { box-shadow: 0 0 0 3px rgba(34,211,238,0.2), 0 4px 18px rgba(34,211,238,0.4); }
        .ai-fab-label  { font-size: 8.5px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; line-height: 1; }

        .desktop-only { display: flex; }
        .mobile-only  { display: none !important; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only  { display: flex !important; }
          .nav-bottom.mobile-only { display: grid !important; }
        }
      `}</style>
    </>
  );
}