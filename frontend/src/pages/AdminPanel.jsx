import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../App';
import api, { authApi } from '../api/client';

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
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'pending',  label: 'Pending',  icon: '⏳' },
  { key: 'approved', label: 'Approved', icon: '✅' },
  { key: 'rejected', label: 'Rejected', icon: '❌' },
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

// ── Confirm modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ action, user, onConfirm, onCancel, loading }) {
  const isApprove = action === 'approve';
  const isReject  = action === 'reject';
  const [reason, setReason] = useState('');
  const [role,   setRole]   = useState(user?.role || 'booth_worker');
  const [ward,   setWard]   = useState(user?.ward || '');
  const [booth,  setBooth]  = useState(user?.booth || '');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: 'var(--bg-2)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 28, maxWidth: 440, width: '90%',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>
          {isApprove ? '✅ Approve User' : isReject ? '❌ Reject User' : '✏️ Edit Role'}
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

        {isReject && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reason (optional)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection..."
              style={{ width: '100%', marginTop: 6, boxSizing: 'border-box', background: 'var(--bg-3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-1)', fontSize: 13 }} />
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
              background: isReject ? '#ef4444' : '#10b981', color: '#fff',
              opacity: loading ? 0.6 : 1,
            }}>
            {loading ? '...' : isApprove ? 'Approve' : isReject ? 'Reject' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User card ──────────────────────────────────────────────────────────────────
function UserCard({ user, onApprove, onReject, onEdit, tab }) {
  const roleColor  = ROLE_COLORS[user.role]  || '#8b5cf6';
  const statColor  = STATUS_COLORS[user.status] || '#8b5cf6';

  const formattedDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return iso; }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800,
        background: `${roleColor}22`, color: roleColor, border: `1px solid ${roleColor}44`,
      }}>
        {user.username?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{user.username}</span>
          <Badge color={roleColor}>{ROLE_LABELS[user.role] || user.role}</Badge>
          <Badge color={statColor}>{user.status}</Badge>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 3 }}>{user.email}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          {user.ward  && <span>Ward: <strong style={{ color: '#22d3ee' }}>{user.ward}</strong></span>}
          {user.booth && <span>Booth: <strong style={{ color: '#10b981' }}>{user.booth}</strong></span>}
          <span>Registered: {formattedDate(user.requestedAt)}</span>
          {user.approvedBy && <span>By: {user.approvedBy}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {tab === 'pending' && (
          <>
            <button onClick={() => onApprove(user)}
              style={{ padding: '7px 14px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Approve
            </button>
            <button onClick={() => onReject(user)}
              style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef444466', borderRadius: 8, color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Reject
            </button>
          </>
        )}
        {tab !== 'pending' && (
          <button onClick={() => onEdit(user)}
            style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--text-2)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
            Edit Role
          </button>
        )}
      </div>
    </div>
  );
}


// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user: authUser } = useAuth();
  const [data,    setData]    = useState({ pending: [], approved: [], rejected: [] });
  const [tab,     setTab]     = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState('');
  const [modal,   setModal]   = useState(null);   // { action, user }
  const [acting,  setActing]  = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // ── Ensure Django has a valid token via Authorization header ─────────
      // The cc_token cookie is set on FastAPI's domain, not Django's domain.
      // So we call authApi.me() (FastAPI) first to get a fresh JWT, then
      // store it so client.js interceptor can add Authorization: Bearer.
      if (!sessionStorage.getItem('cc_token')) {
        try {
          const meRes = await authApi.me();
          if (meRes.data?.token) {
            sessionStorage.setItem('cc_token', meRes.data.token);
          }
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
      } else if (action === 'reject') {
        r = await api.post('/api/admin/reject/',  { email: user.email, reason });
      } else {
        r = await api.post('/api/admin/update-role/', { email: user.email, role, ward, booth });
      }
      if (r.data.success) {
        showToast(r.data.message);
        setModal(null);
        fetchUsers();
      } else {
        showToast('⚠ ' + (r.data.message || 'Action failed.'));
      }
    } catch (e) {
      showToast('⚠ ' + (e.userMessage || 'Network error.'));
    } finally {
      setActing(false);
    }
  };

  // Access guard
  if (authUser && !['mla', 'pa'].includes(authUser.role)) {
    return (
      <div className="page">
        <Navbar />
        <div className="page-inner" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: 'var(--text-1)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-3)' }}>This page is only accessible to MLA and Office P.A accounts.</p>
        </div>
      </div>
    );
  }

  const tabData = data[tab] || [];

  return (
    <div className="page">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#1a2744', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '12px 18px', fontSize: 13, color: 'var(--text-1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
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

      <div className="page-inner" style={{ maxWidth: 860 }}>
        {/* Header */}
        <div className="page-header anim-fade-up" style={{ marginBottom: 28 }}>
          <span className="badge badge-gold mb-8">Admin Panel</span>
          <h1 style={{ color: 'var(--text-1)' }}>User Access Management</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
            Review, approve and manage access for Corporators and Booth Workers
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pending',  count: data.pending?.length  || 0, color: '#f59e0b' },
            { label: 'Approved', count: data.approved?.length || 0, color: '#10b981' },
            { label: 'Rejected', count: data.rejected?.length || 0, color: '#ef4444' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{
              background: `${color}11`, border: `1px solid ${color}33`,
              borderRadius: 12, padding: '14px 18px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'var(--font-display)' }}>{count}</div>
              <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              transition: 'all 0.15s',
              background: tab === key ? '#f59e0b' : 'rgba(255,255,255,0.05)',
              border: tab === key ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
              color: tab === key ? '#090e1c' : 'var(--text-2)',
              minHeight: 40,
            }}>
              {icon} {label}
              {data[key]?.length > 0 && (
                <span style={{
                  marginLeft: 6, background: tab === key ? '#090e1c' : STATUS_COLORS[key] + '33',
                  color: tab === key ? '#090e1c' : STATUS_COLORS[key],
                  borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 800,
                }}>{data[key].length}</span>
              )}
            </button>
          ))}
          <button onClick={fetchUsers} disabled={loading}
            style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2)', fontSize: 13, minHeight: 40 }}>
            {loading ? '⟳' : '↻ Refresh'}
          </button>
        </div>

        {/* User list */}
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Loading users…</div>
        ) : tabData.length === 0 ? (
          <div style={{
            textAlign: 'center', color: 'var(--text-3)', padding: 48,
            background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {tab === 'pending' ? '✅' : tab === 'approved' ? '👥' : '📋'}
            </div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {tab === 'pending' ? 'No pending requests' : tab === 'approved' ? 'No approved users' : 'No rejected users'}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}