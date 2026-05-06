import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../App';
import api, { authApi } from '../api/client';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  Users: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  BarChart: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  MapPin: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Clock: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  CheckCircle: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  XCircle: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  Ban: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  Edit: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  AlertTriangle: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  LockClosed: ({ size = 26, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  LockOpen: ({ size = 16, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  ),
  ShieldLock: ({ size = 26, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10 11V9a2 2 0 1 1 4 0v2"/>
    </svg>
  ),
  HardHat: ({ size = 20, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/>
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/>
    </svg>
  ),
  Home: ({ size = 20, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Ballot: ({ size = 20, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  Zap: ({ size = 20, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Clipboard: ({ size = 36, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  Info: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  RefreshCw: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  History: ({ size = 12, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4H1"/><polyline points="1 3 1 7 5 7"/>
    </svg>
  ),
  ArrowLeft: ({ size = 12, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Check: ({ size = 14, style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// ── Role labels ───────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  mla:          'MLA',
  pa:           'Office P.A',
  corporator:   'Corporator',
  booth_worker: 'Booth Worker',
};
const ROLE_COLORS = {
  mla:          '#f59e0b',
  pa:           '#f59e0b',
  corporator:   '#22d3ee',
  booth_worker: '#10b981',
};
const STATUS_COLORS = {
  pending:  '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  disabled: '#6b7280',
};

// ── Top-level tabs ────────────────────────────────────────────────────────────
const TOP_TABS = [
  { key: 'users',    label: 'User Management', Icon: Icons.Users    },
  { key: 'progress', label: 'Survey Progress',  Icon: Icons.BarChart },
  { key: 'location', label: 'Live Location',    Icon: Icons.MapPin   },
];

// ── User sub-tabs ─────────────────────────────────────────────────────────────
const USER_TABS = [
  { key: 'pending',  label: 'Pending',  Icon: Icons.Clock       },
  { key: 'approved', label: 'Approved', Icon: Icons.CheckCircle },
  { key: 'rejected', label: 'Rejected', Icon: Icons.XCircle     },
  { key: 'disabled', label: 'Disabled', Icon: Icons.Ban         },
];

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ color, children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10,
      fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>{children}</span>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = '#10b981', height = 6 }) {
  const clamped = Math.min(100, Math.max(0, pct || 0));
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height, overflow: 'hidden' }}>
      <div style={{
        width: `${clamped}%`, height: '100%', borderRadius: 99,
        background: clamped >= 80 ? '#10b981' : clamped >= 50 ? '#f59e0b' : '#ef4444',
        transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

// ── Confirm modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ action, user, onConfirm, onCancel, loading }) {
  const isApprove = action === 'approve';
  const isReject  = action === 'reject';
  const isDisable = action === 'disable';
  const isEnable  = action === 'enable';
  const [reason, setReason] = useState('');
  const [role,   setRole]   = useState(user?.role || 'booth_worker');
  const [ward,   setWard]   = useState(user?.ward || '');
  const [booth,  setBooth]  = useState(user?.booth || '');

  const TitleIcon = isApprove ? Icons.CheckCircle
                  : isReject  ? Icons.XCircle
                  : isDisable ? Icons.Ban
                  : isEnable  ? Icons.CheckCircle
                  :              Icons.Edit;

  const title = isApprove ? 'Approve User'
              : isReject  ? 'Reject User'
              : isDisable ? 'Disable Access'
              : isEnable  ? 'Re-enable Access'
              :              'Edit Role';

  const confirmBg = isReject  ? '#ef4444'
                  : isDisable ? '#6b7280'
                  : '#10b981';

  const confirmLabel = loading  ? '...'
                     : isApprove ? 'Approve'
                     : isReject  ? 'Reject'
                     : isDisable ? 'Disable'
                     : isEnable  ? 'Re-enable'
                     :              'Save';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 28, maxWidth: 440, width: '90%',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TitleIcon size={16} />{title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
          <strong style={{ color: '#f59e0b' }}>{user?.username}</strong> — {user?.email}
        </div>

        {(isApprove || action === 'edit') && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</label>
              <select value={role} onChange={e => { setRole(e.target.value); setWard(''); setBooth(''); }}
                style={{ width: '100%', marginTop: 6, background: 'var(--bg-3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-1)', fontSize: 13 }}>
                {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {role === 'corporator' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ward Name</label>
                <input value={ward} onChange={e => setWard(e.target.value)} placeholder="e.g. PADAVU"
                  style={{ width: '100%', marginTop: 6, boxSizing: 'border-box', background: 'var(--bg-3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-1)', fontSize: 13 }} />
              </div>
            )}
            {role === 'booth_worker' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Booth Number</label>
                <input value={booth} onChange={e => setBooth(e.target.value)} placeholder="e.g. 31"
                  style={{ width: '100%', marginTop: 6, boxSizing: 'border-box', background: 'var(--bg-3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-1)', fontSize: 13 }} />
              </div>
            )}
          </>
        )}

        {(isReject || isDisable) && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isDisable ? 'Reason for disabling (optional)' : 'Reason (optional)'}
            </label>
            <input value={reason} onChange={e => setReason(e.target.value)}
              placeholder={isDisable ? 'e.g. Misuse of access, temporary suspension…' : 'Reason for rejection...'}
              style={{ width: '100%', marginTop: 6, boxSizing: 'border-box', background: 'var(--bg-3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-1)', fontSize: 13 }} />
          </div>
        )}

        {isDisable && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.3)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Icons.AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> This user will immediately lose all access. They cannot log in until re-enabled by an admin.
          </div>
        )}

        {isEnable && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, fontSize: 12, color: 'rgba(16,185,129,0.8)', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Icons.Check size={14} style={{ flexShrink: 0, marginTop: 1 }} /> This user will regain access with their existing role and permissions.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onCancel} disabled={loading}
            style={{ flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            Cancel
          </button>
          <button disabled={loading}
            onClick={() => onConfirm({ role, ward, booth, reason })}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none',
              background: confirmBg, color: '#fff',
              opacity: loading ? 0.6 : 1,
            }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User card ──────────────────────────────────────────────────────────────────
function UserCard({ user, onApprove, onReject, onEdit, onDisable, onEnable, tab }) {
  const roleColor  = ROLE_COLORS[user.role]  || '#8b5cf6';
  const statColor  = STATUS_COLORS[user.status] || '#8b5cf6';
  const isDisabled = user.status === 'disabled';

  const formattedDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return iso; }
  };

  return (
    <div style={{
      background: isDisabled ? 'rgba(107,114,128,0.06)' : 'rgba(255,255,255,0.02)',
      border: isDisabled ? '1px solid rgba(107,114,128,0.2)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '12px 14px',
      opacity: isDisabled ? 0.75 : 1,
    }}>
      {/* Top: avatar + info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800,
          background: isDisabled ? 'rgba(107,114,128,0.15)' : `${roleColor}22`,
          color: isDisabled ? '#6b7280' : roleColor,
          border: isDisabled ? '1px solid rgba(107,114,128,0.3)' : `1px solid ${roleColor}44`,
        }}>
          {user.username?.[0]?.toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: isDisabled ? 'var(--text-3)' : 'var(--text-1)', fontSize: 14 }}>{user.username}</span>
            <Badge color={roleColor}>{ROLE_LABELS[user.role] || user.role}</Badge>
            <Badge color={statColor}>{user.status}</Badge>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4, wordBreak: 'break-all' }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {user.ward  && <span>Ward: <strong style={{ color: '#22d3ee' }}>{user.ward}</strong></span>}
            {user.booth && <span>Booth: <strong style={{ color: '#10b981' }}>{user.booth}</strong></span>}
            <span>Reg: {formattedDate(user.requestedAt)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons — full width row */}
      <div style={{ display: 'flex', gap: 8 }}>
        {tab === 'pending' && (
          <>
            <button onClick={() => onApprove(user)}
              style={{ flex: 1, padding: '9px 0', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              ✓ Approve
            </button>
            <button onClick={() => onReject(user)}
              style={{ flex: 1, padding: '9px 0', background: 'rgba(239,68,68,0.12)', border: '1px solid #ef444455', borderRadius: 8, color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              ✕ Reject
            </button>
          </>
        )}
        {tab === 'approved' && (
          <>
            <button onClick={() => onEdit(user)}
              style={{ flex: 1, padding: '9px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--text-2)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Edit Role
            </button>
            <button onClick={() => onDisable(user)}
              style={{ flex: 1, padding: '9px 0', background: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.3)', borderRadius: 8, color: '#9ca3af', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Disable
            </button>
          </>
        )}
        {tab === 'disabled' && (
          <button onClick={() => onEnable(user)}
            style={{ flex: 1, padding: '9px 0', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            ✓ Re-enable
          </button>
        )}
        {tab === 'rejected' && (
          <button onClick={() => onEdit(user)}
            style={{ flex: 1, padding: '9px 0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--text-2)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Edit Role
          </button>
        )}
      </div>
    </div>
  );
}

// ── Admin Re-Auth Gate ─────────────────────────────────────────────────────────
function AdminReAuthGate({ onVerified }) {
  const { user: authUser } = useAuth();
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!password.trim()) return setError('Please enter your password.');
    setBusy(true); setError('');
    try {
      const { data } = await authApi.verifyAdmin({
        email:    authUser?.email,
        password: password,
      });
      if (data.success) {
        onVerified();
      } else {
        setError(data.detail || 'Incorrect password.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || '';
      if (err.response?.status === 401) {
        setError('Incorrect password. Please try again.');
      } else if (err.response?.status === 403) {
        setError('You do not have admin privileges.');
      } else {
        setError(msg || 'Verification failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="anim-fade-up" style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(17,28,52,0.95)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 18, padding: '36px 32px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', margin: '0 auto 14px',
              background: 'rgba(245,158,11,0.12)',
              border: '2px solid rgba(245,158,11,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f59e0b',
            }}><Icons.ShieldLock size={26} /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>
              Admin Verification
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Confirm your identity to access the Admin Panel.
            </div>
          </div>

          <div style={{
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 22,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#090e1c',
            }}>
              {(authUser?.username || 'A')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{authUser?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{authUser?.email}</div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.AlertTriangle size={14} /> {error}</div>
          )}

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label className="field-label">Your Password</label>
              <input
                className="input"
                type="password"
                placeholder="Enter your password to continue"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoFocus
                required
              />
            </div>
            <button
              className="btn btn-primary btn-lg btn-full"
              type="submit"
              disabled={busy}
              style={{ marginTop: 4 }}
            >
              {busy ? <span className="spinner" /> : <><Icons.LockOpen size={15} style={{ marginRight: 6 }} />Verify &amp; Enter Admin Panel</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SURVEY PROGRESS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SurveyProgressTab() {
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const [search,  setSearch]    = useState('');
  const [sortBy,  setSortBy]    = useState('booth');

  const fetchProgress = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get('/api/admin/survey-progress/');
      if (r.data.success) setWorkers(r.data.workers || []);
      else setError(r.data.message || 'Failed to load progress.');
    } catch (e) {
      setError(e.userMessage || 'Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  // ── filter + sort ──────────────────────────────────────────────────────────
  const filtered = workers
    .filter(w => {
      const q = search.toLowerCase();
      return !q ||
        w.username?.toLowerCase().includes(q) ||
        w.email?.toLowerCase().includes(q) ||
        w.boothNumber?.includes(q) ||
        w.wardName?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'booth')      return parseInt(a.boothNumber) - parseInt(b.boothNumber);
      if (sortBy === 'houses_pct') return b.housesPct - a.housesPct;
      if (sortBy === 'voters_pct') return b.votersPct - a.votersPct;
      if (sortBy === 'recent')     return new Date(b.lastSurveyAt || 0) - new Date(a.lastSurveyAt || 0);
      return 0;
    });

  const totalHouses  = workers.reduce((s, w) => s + (w.totalHouses  || 0), 0);
  const doneHouses   = workers.reduce((s, w) => s + (w.housesCompleted || 0), 0);
  const totalVoters  = workers.reduce((s, w) => s + (w.totalVoters  || 0), 0);
  const doneVoters   = workers.reduce((s, w) => s + (w.votersSurveyed || 0), 0);
  const overallHPct  = totalHouses ? Math.round(doneHouses  / totalHouses  * 100) : 0;
  const overallVPct  = totalVoters ? Math.round(doneVoters  / totalVoters  * 100) : 0;

  const fmtDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
    catch { return iso; }
  };

  return (
    <div>
      {/* Summary cards — 2x2 on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Booth Workers',   value: workers.length,                                                                                                                                     color: '#10b981', Icon: Icons.HardHat  },
          { label: 'Houses Done',     value: `${doneHouses}/${totalHouses}`,                                                                                                                    color: '#22d3ee', Icon: Icons.Home,     sub: `${overallHPct}%` },
          { label: 'Voters Surveyed', value: `${doneVoters}/${totalVoters}`,                                                                                                                    color: '#a78bfa', Icon: Icons.Ballot,   sub: `${overallVPct}%` },
          { label: 'Active Today',    value: workers.filter(w => w.lastSurveyAt && new Date(w.lastSurveyAt) > new Date(Date.now() - 86400000)).length, color: '#f59e0b', Icon: Icons.Zap         },
        ].map(({ label, value, color, Icon, sub }) => (
          <div key={label} style={{
            background: `${color}11`, border: `1px solid ${color}33`,
            borderRadius: 12, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ color, opacity: 0.8, flexShrink: 0 }}><Icon size={22} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'var(--font-display)', lineHeight: 1, wordBreak: 'break-all' }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color, fontWeight: 700 }}>{sub}</div>}
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall bars — stacked on mobile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Overall House Coverage', pct: overallHPct, color: '#22d3ee' },
          { label: 'Overall Voter Coverage', pct: overallVPct, color: '#a78bfa' },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
            </div>
            <ProgressBar pct={pct} color={color} height={8} />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, booth, ward…"
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-1)', fontSize: 13 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-2)', fontSize: 13 }}>
            <option value="booth">Sort: Booth No</option>
            <option value="houses_pct">Sort: Houses %</option>
            <option value="voters_pct">Sort: Voters %</option>
            <option value="recent">Sort: Recently Active</option>
          </select>
          <button onClick={fetchProgress} disabled={loading}
            style={{ padding: '9px 14px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <Icons.RefreshCw size={13} />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.AlertTriangle size={14} /> {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Loading progress…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No workers found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(w => (
            <div key={w.email} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 18px',
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#10b981', flexShrink: 0,
                }}>
                  {w.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{w.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{w.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge color="#10b981">Booth {w.boothNumber}</Badge>
                  {w.wardName && <Badge color="#22d3ee">{w.wardName}</Badge>}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  Last active: {fmtDate(w.lastSurveyAt)}
                </div>
              </div>

              {/* Progress bars — single column on mobile */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Houses */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icons.Home size={11} /> Houses Surveyed</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#22d3ee' }}>
                      {w.housesCompleted} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/ {w.totalHouses}</span>
                    </span>
                  </div>
                  <ProgressBar pct={w.housesPct} height={8} />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>{w.housesPct}% complete</div>
                </div>

                {/* Voters */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icons.Ballot size={11} /> Voters Surveyed</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa' }}>
                      {w.votersSurveyed} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/ {w.totalVoters}</span>
                    </span>
                  </div>
                  <ProgressBar pct={w.votersPct} height={8} />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>{w.votersPct}% complete</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATION TRACKING TAB
// ═══════════════════════════════════════════════════════════════════════════════
function LocationTab() {
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [selected,    setSelected]    = useState(null);   // email
  const [history,     setHistory]     = useState([]);
  const [dates,       setDates]       = useState([]);
  const [selDate,     setSelDate]     = useState('');
  const [loading,     setLoading]     = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [error,       setError]       = useState('');
  const mapRef   = useRef(null);
  const leafletRef = useRef(null);  // holds { map, markers, polyline }

  // ── Fetch live locations ──────────────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get('/api/admin/locations/?mode=live');
      if (r.data.success) setLiveWorkers(r.data.workers || []);
      else setError(r.data.message || 'Failed to load locations.');
    } catch (e) {
      setError(e.userMessage || 'Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  // ── Auto-refresh live every 60s ──────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => { if (!selected) fetchLive(); }, 60000);
    return () => clearInterval(id);
  }, [selected, fetchLive]);

  // ── Fetch dates for selected worker ──────────────────────────────────────
  const fetchDates = useCallback(async (email) => {
    try {
      const r = await api.get(`/api/admin/location-dates/?email=${encodeURIComponent(email)}`);
      if (r.data.success) {
        setDates(r.data.dates || []);
        if (r.data.dates?.length) setSelDate(r.data.dates[0]);
      }
    } catch {}
  }, []);

  // ── Fetch history for selected worker + date ──────────────────────────────
  const fetchHistory = useCallback(async (email, date) => {
    if (!email) return;
    setHistLoading(true);
    try {
      const params = `?mode=history&email=${encodeURIComponent(email)}${date ? `&date=${date}` : ''}`;
      const r = await api.get(`/api/admin/locations/${params}`);
      if (r.data.success) setHistory(r.data.pings || []);
    } catch {}
    setHistLoading(false);
  }, []);

  useEffect(() => {
    if (selected) {
      fetchDates(selected);
      setHistory([]);
    }
  }, [selected, fetchDates]);

  useEffect(() => {
    if (selected && selDate) fetchHistory(selected, selDate);
  }, [selected, selDate, fetchHistory]);

  // ── Leaflet map initialisation ────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (leafletRef.current) return;  // already initialised

    // Dynamically load Leaflet CSS + JS
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) { resolve(); return; }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      const L = window.L;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([12.87, 74.84], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      leafletRef.current = { map, markers: [], polyline: null };
    });

    return () => {
      if (leafletRef.current?.map) {
        leafletRef.current.map.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  // ── Update map when live data or history changes ──────────────────────────
  useEffect(() => {
    const L = window.L;
    const lf = leafletRef.current;
    if (!L || !lf) return;

    const { map } = lf;

    // Clear existing markers + polyline
    lf.markers.forEach(m => map.removeLayer(m));
    lf.markers = [];
    if (lf.polyline) { map.removeLayer(lf.polyline); lf.polyline = null; }

    if (selected && history.length > 0) {
      // History mode — draw path + markers
      const latlngs = history.map(p => [p.lat, p.lng]);
      lf.polyline = L.polyline(latlngs, { color: '#a78bfa', weight: 3, opacity: 0.8 }).addTo(map);

      history.forEach((p, i) => {
        const isLast  = i === history.length - 1;
        const icon = L.divIcon({
          html: `<div style="width:${isLast?16:10}px;height:${isLast?16:10}px;background:${isLast?'#10b981':'#a78bfa'};border:2px solid #fff;border-radius:50%;"></div>`,
          className: '',
          iconAnchor: [isLast ? 8 : 5, isLast ? 8 : 5],
        });
        const marker = L.marker([p.lat, p.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${isLast ? '&#x25CF; Latest' : `#${i + 1}`}</b><br>${new Date(p.timestamp).toLocaleTimeString('en-IN')}<br>Accuracy: ${p.accuracy ? Math.round(p.accuracy) + 'm' : 'N/A'}`);
        lf.markers.push(marker);
      });

      map.fitBounds(latlngs, { padding: [40, 40] });
    } else if (!selected && liveWorkers.length > 0) {
      // Live mode — one pin per worker
      const validWorkers = liveWorkers.filter(w => w.lat && w.lng);
      validWorkers.forEach(w => {
        const isRecent = w.timestamp && (Date.now() - new Date(w.timestamp)) < 3600000;
        const icon = L.divIcon({
          html: `<div style="background:${isRecent?'#10b981':'#6b7280'};color:#fff;padding:3px 7px;border-radius:8px;font-size:11px;font-weight:700;white-space:nowrap;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">B${w.booth||'?'}</div>`,
          className: '',
          iconAnchor: [20, 14],
        });
        const marker = L.marker([w.lat, w.lng], { icon })
          .addTo(map)
          .bindPopup(`<b>${w.username}</b> (Booth ${w.booth})<br>${w.email}<br>Last seen: ${w.timestamp ? new Date(w.timestamp).toLocaleString('en-IN') : '—'}<br>Accuracy: ${w.accuracy ? Math.round(w.accuracy) + 'm' : 'N/A'}`);
        lf.markers.push(marker);
      });

      if (validWorkers.length > 0) {
        const bounds = validWorkers.map(w => [w.lat, w.lng]);
        if (bounds.length === 1) map.setView(bounds[0], 15);
        else map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [liveWorkers, selected, history]);

  const fmtTime = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
    catch { return iso; }
  };

  const minutesAgo = (iso) => {
    if (!iso) return null;
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.AlertTriangle size={14} /> {error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Left panel — worker list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {selected ? <><Icons.ArrowLeft size={12} />Workers</> : `Live Locations (${liveWorkers.length})`}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {selected && (
                <button onClick={() => { setSelected(null); setHistory([]); setDates([]); }}
                  style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icons.ArrowLeft size={11} /> All Workers
                </button>
              )}
              <button onClick={fetchLive} disabled={loading}
                style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                <Icons.RefreshCw size={12} />
              </button>
            </div>
          </div>

          {/* History date picker (shown when worker selected) */}
          {selected && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location History</div>
              {dates.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No history available.</div>
              ) : (
                <select value={selDate} onChange={e => setSelDate(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: 'var(--text-1)', fontSize: 13 }}>
                  {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
              {histLoading && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Loading history…</div>}
              {!histLoading && history.length > 0 && (
                <div style={{ fontSize: 11, color: '#a78bfa', marginTop: 6 }}>
                  {history.length} pings recorded · path drawn on map
                </div>
              )}
            </div>
          )}

          {/* Worker cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto', maxHeight: 340 }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>Loading…</div>
            ) : liveWorkers.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24, fontSize: 12 }}>
                No location data yet. Workers share location when they open the app.
              </div>
            ) : liveWorkers.map(w => {
              const ago      = minutesAgo(w.timestamp);
              const isRecent = w.timestamp && (Date.now() - new Date(w.timestamp)) < 3600000;
              const isSelected = selected === w.email;

              return (
                <div key={w.email} onClick={() => setSelected(isSelected ? null : w.email)}
                  style={{
                    background: isSelected ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: isRecent ? '#10b981' : '#6b7280',
                      boxShadow: isRecent ? '0 0 6px #10b981' : 'none',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)' }}>{w.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                        Booth {w.booth || '—'} · {ago}
                      </div>
                    </div>
                    {isSelected && <span style={{ color: '#a78bfa', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icons.History size={11} /> History</span>}
                    {!isSelected && w.lat && w.lng && <span style={{ color: '#10b981', fontSize: 12, display: 'inline-flex', alignItems: 'center' }}><Icons.MapPin size={12} /></span>}
                  </div>
                  {w.lat && w.lng && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                      {w.lat.toFixed(5)}, {w.lng.toFixed(5)}
                      {w.accuracy ? ` · ±${Math.round(w.accuracy)}m` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', height: 320 }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {!window.L && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,14,28,0.85)', color: 'var(--text-3)', fontSize: 13 }}>
              Loading map…
            </div>
          )}
          {/* Map legend */}
          <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(9,14,28,0.85)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div><span style={{ color: '#10b981' }}>●</span> Active (last 1h)</div>
            <div><span style={{ color: '#6b7280' }}>●</span> Inactive</div>
            {selected && <div><span style={{ color: '#a78bfa' }}>━</span> Location path</div>}
          </div>
        </div>
      </div>

      {/* Last ping time note */}
      <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icons.Info size={12} /> Location is recorded only when a worker has the app open. Map auto-refreshes every 60 seconds.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT TAB (original functionality)
// ═══════════════════════════════════════════════════════════════════════════════
function UserManagementTab() {
  const [data,    setData]    = useState({ pending: [], approved: [], rejected: [], disabled: [] });
  const [tab,     setTab]     = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState('');
  const [modal,   setModal]   = useState(null);
  const [acting,  setActing]  = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (!sessionStorage.getItem('cc_token')) {
        try {
          const meRes = await authApi.me();
          if (meRes.data?.token) sessionStorage.setItem('cc_token', meRes.data.token);
        } catch {}
      }
      const r = await api.get('/api/admin/users/');
      if (r.data.success) setData(r.data);
      else setError(r.data.message || 'Failed to load users.');
    } catch (e) {
      setError(e.userMessage || 'Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleConfirm = async ({ role, ward, booth, reason }) => {
    if (!modal) return;
    const { action, user } = modal;
    setActing(true);
    try {
      let r;
      if (action === 'approve') {
        r = await api.post('/api/admin/approve/', { email: user.email, role, ward, booth });
      } else if (action === 'edit') {
        r = await api.post('/api/admin/update-role/', { email: user.email, role, ward, booth });
      } else if (action === 'reject') {
        r = await api.post('/api/admin/reject/',  { email: user.email, reason });
      } else if (action === 'disable') {
        r = await api.post('/api/admin/disable/', { email: user.email, reason });
      } else if (action === 'enable') {
        r = await api.post('/api/admin/enable/',  { email: user.email });
      }
      if (r.data.success) {
        showToast(r.data.message);
        setModal(null);
        fetchUsers();
      } else {
        showToast('Warning: ' + (r.data.message || 'Action failed.'));
      }
    } catch (e) {
      showToast('Error: ' + (e.userMessage || 'Network error.'));
    } finally {
      setActing(false);
    }
  };

  const tabData = data[tab] || [];

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, maxWidth: 'calc(100vw - 32px)', width: 'max-content',
          background: '#1a2744', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '12px 18px', fontSize: 13, color: 'var(--text-1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', textAlign: 'center',
        }}>{toast}</div>
      )}

      {modal && (
        <ConfirmModal
          action={modal.action}
          user={modal.user}
          loading={acting}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}>
        {[
          { label: 'Pending',  count: data.pending?.length  || 0, color: '#f59e0b', Icon: Icons.Clock       },
          { label: 'Approved', count: data.approved?.length || 0, color: '#10b981', Icon: Icons.CheckCircle },
          { label: 'Rejected', count: data.rejected?.length || 0, color: '#ef4444', Icon: Icons.XCircle     },
          { label: 'Disabled', count: data.disabled?.length || 0, color: '#6b7280', Icon: Icons.Ban         },
        ].map(({ label, count, color, Icon }) => (
          <div key={label} style={{
            background: `${color}11`, border: `1px solid ${color}33`,
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ color, opacity: 0.7 }}><Icon size={22} /></div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1, fontFamily: 'var(--font-display)' }}>{count}</div>
              <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Tabs + Refresh */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        paddingBottom: 2, alignItems: 'center',
      }}>
        {USER_TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 14px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.15s', flexShrink: 0,
            background: tab === key ? '#f59e0b' : 'rgba(255,255,255,0.05)',
            border: tab === key ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
            color: tab === key ? '#090e1c' : 'var(--text-2)',
            minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 5,
            whiteSpace: 'nowrap',
          }}>
            <Icon size={13} /> {label}
            {data[key]?.length > 0 && (
              <span style={{
                marginLeft: 4,
                background: tab === key ? 'rgba(9,14,28,0.25)' : STATUS_COLORS[key] + '33',
                color: tab === key ? '#090e1c' : STATUS_COLORS[key],
                borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800,
              }}>{data[key].length}</span>
            )}
          </button>
        ))}
        <button onClick={fetchUsers} disabled={loading}
          style={{ marginLeft: 'auto', flexShrink: 0, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: 12, minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icons.RefreshCw size={13} /><span style={{ display: 'none' }}>{loading ? '' : 'Refresh'}</span>
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.AlertTriangle size={14} /> {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Loading users…</div>
      ) : tabData.length === 0 ? (
        <div style={{
          textAlign: 'center', color: 'var(--text-3)', padding: 48,
          background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, display: 'flex', justifyContent: 'center', opacity: 0.35 }}>
            {tab === 'pending' ? <Icons.CheckCircle size={40} /> : tab === 'approved' ? <Icons.Users size={40} /> : <Icons.Clipboard size={40} />}
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {tab === 'pending' ? 'No pending requests' : tab === 'approved' ? 'No approved users' : tab === 'disabled' ? 'No disabled users' : 'No rejected users'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tabData.map(u => (
            <UserCard
              key={u._id || u.email}
              user={u}
              tab={tab}
              onApprove={user => setModal({ action: 'approve', user })}
              onReject={user  => setModal({ action: 'reject',  user })}
              onEdit={user    => setModal({ action: 'edit',    user })}
              onDisable={user => setModal({ action: 'disable', user })}
              onEnable={user  => setModal({ action: 'enable',  user })}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATION PING HOOK — used in the app root / wherever you want to emit pings
// Import and call useLocationPing() inside any component that should be active
// while the worker has the app open.
// ═══════════════════════════════════════════════════════════════════════════════
export function useLocationPing(intervalMs = 45000) {
  const { user } = useAuth();
  const pingRef = useRef(null);

  useEffect(() => {
    if (!user || !['booth_worker', 'corporator'].includes(user.role)) return;
    if (user.status !== 'approved') return;

    const sendPing = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.post('/api/location/ping/', {
            lat:      pos.coords.latitude,
            lng:      pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }).catch(() => {});
        },
        () => {},  // silently ignore denied / unavailable
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
      );
    };

    sendPing();  // immediate first ping on app open
    pingRef.current = setInterval(sendPing, intervalMs);

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [user, intervalMs]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const { user: authUser } = useAuth();
  const [verified, setVerified] = useState(false);
  const [topTab,   setTopTab]   = useState('users');

  // ── Re-auth gate ──────────────────────────────────────────────────────────
  if (!verified) {
    if (authUser && ['mla', 'pa'].includes(authUser.role)) {
      return <AdminReAuthGate onVerified={() => setVerified(true)} />;
    }
  }

  // ── Access guard ──────────────────────────────────────────────────────────
  if (authUser && !['mla', 'pa'].includes(authUser.role)) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-inner" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16, display: 'flex', justifyContent: 'center', color: 'var(--text-3)' }}><Icons.LockClosed size={52} /></div>
          <h2 style={{ color: 'var(--text-1)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-3)' }}>This page is only accessible to MLA and Office P.A accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />

      <div className="page-inner" style={{ maxWidth: 1100, paddingLeft: 'max(14px, env(safe-area-inset-left))', paddingRight: 'max(14px, env(safe-area-inset-right))' }}>
        {/* Header */}
        <div className="page-header anim-fade-up" style={{ marginBottom: 18 }}>
          <span className="badge badge-gold mb-8">Admin Panel</span>
          <h1 style={{ color: 'var(--text-1)' }}>
            {topTab === 'users'    ? 'User Access Management'
           : topTab === 'progress' ? 'Survey Progress Tracker'
           :                        'Live Location Tracking'}
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
            {topTab === 'users'    ? 'Review, approve and manage access for Corporators and Booth Workers'
           : topTab === 'progress' ? 'Monitor how many houses and voters each booth worker has surveyed'
           :                        'View real-time and historical locations of booth workers while app is open'}
          </p>
        </div>

        {/* Top-level navigation tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 4,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {TOP_TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTopTab(key)} style={{
              flex: '1 0 auto',
              padding: '10px 16px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              background: topTab === key ? 'rgba(245,158,11,0.14)' : 'transparent',
              border: topTab === key ? '1px solid rgba(245,158,11,0.35)' : '1px solid transparent',
              color: topTab === key ? '#f59e0b' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              minHeight: 42,
            }}>
              <Icon size={14} />
              <span style={{ display: 'inline' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {topTab === 'users'    && <UserManagementTab />}
        {topTab === 'progress' && <SurveyProgressTab />}
        {topTab === 'location' && <LocationTab />}
      </div>
    </div>
  );
}