import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../App';
import api, { authApi } from '../api/client';
import { canAccessAdmin, isSuperuser, ROLE_LABELS, ROLE_COLORS } from '../utils/permissions';

// ── Role labels / colours ─────────────────────────────────────────────────────
const STATUS_COLORS = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444' };

const TABS = [
  { key:'pending',  label:'Pending',  icon:'⏳' },
  { key:'approved', label:'Approved', icon:'✅' },
  { key:'rejected', label:'Rejected', icon:'❌' },
];

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ color, children }) {
  return (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:10,
      fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase',
      background:`${color}22`, color, border:`1px solid ${color}44` }}>
      {children}
    </span>
  );
}

// ── Confirm / Edit modal ──────────────────────────────────────────────────────
function ConfirmModal({ action, user, onConfirm, onCancel, loading }) {
  const isApprove = action === 'approve';
  const isReject  = action === 'reject';
  const [reason, setReason] = useState('');
  const [role,   setRole]   = useState(user?.role || 'booth_worker');
  const [ward,   setWard]   = useState(user?.ward  || '');
  const [booth,  setBooth]  = useState(user?.booth || '');

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'var(--bg-2)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:28, maxWidth:440, width:'90%' }}>
        <div style={{ fontSize:15, fontWeight:800, color:'var(--text-1)', marginBottom:6 }}>
          {isApprove ? '✅ Approve User' : isReject ? '❌ Reject User' : '✏️ Edit Role'}
        </div>
        <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:20 }}>
          <strong style={{ color:'#f59e0b' }}>{user?.username}</strong> — {user?.email}
        </div>

        {(isApprove || action === 'edit') && (
          <>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Role</label>
              <select value={role} onChange={e => { setRole(e.target.value); setWard(''); setBooth(''); }}
                style={{ width:'100%', marginTop:6, background:'var(--bg-3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'var(--text-1)', fontSize:13 }}>
                {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            {/* Role scope info */}
            <div style={{ marginBottom:12, padding:'8px 12px', borderRadius:8, fontSize:11, color:'rgba(255,255,255,0.5)',
              background: role==='mla'||role==='pa' ? 'rgba(245,158,11,0.06)' : role==='corporator' ? 'rgba(34,211,238,0.06)' : 'rgba(16,185,129,0.06)',
              border: `1px solid ${role==='mla'||role==='pa'?'rgba(245,158,11,0.15)':role==='corporator'?'rgba(34,211,238,0.15)':'rgba(16,185,129,0.15)'}`,
            }}>
              {role==='mla' && '⚡ SuperUser — full read/write + Admin Panel access'}
              {role==='pa'  && '⚡ SuperUser — full read/write + Admin Panel access (Office P.A)'}
              {role==='corporator'    && '🏘 Write access to assigned ward only · Read-only all other wards'}
              {role==='booth_worker'  && '🗳 Write access to assigned booth only · Read-only all other booths'}
            </div>
            {role === 'corporator' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Ward Name</label>
                <input value={ward} onChange={e => setWard(e.target.value)} placeholder="e.g. PADAVU"
                  style={{ width:'100%', marginTop:6, boxSizing:'border-box', background:'var(--bg-3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'var(--text-1)', fontSize:13 }} />
              </div>
            )}
            {role === 'booth_worker' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Booth Number</label>
                <input value={booth} onChange={e => setBooth(e.target.value)} placeholder="e.g. 31"
                  style={{ width:'100%', marginTop:6, boxSizing:'border-box', background:'var(--bg-3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'var(--text-1)', fontSize:13 }} />
              </div>
            )}
          </>
        )}

        {isReject && (
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Reason (optional)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection..."
              style={{ width:'100%', marginTop:6, boxSizing:'border-box', background:'var(--bg-3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'var(--text-1)', fontSize:13 }} />
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <button onClick={onCancel} disabled={loading}
            style={{ flex:1, padding:'10px 0', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:'var(--text-2)', cursor:'pointer', fontWeight:600, fontSize:13 }}>
            Cancel
          </button>
          <button disabled={loading} onClick={() => onConfirm({ role, ward, booth, reason })}
            style={{ flex:1, padding:'10px 0', borderRadius:9, fontWeight:700, fontSize:13, cursor:'pointer', border:'none',
              background:isReject ? '#ef4444' : '#10b981', color:'#fff', opacity:loading ? 0.6 : 1 }}>
            {loading ? '...' : isApprove ? 'Approve' : isReject ? 'Reject' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User card ──────────────────────────────────────────────────────────────────
function UserCard({ user, onApprove, onReject, onEdit, tab }) {
  const roleColor = ROLE_COLORS[user.role]    || '#8b5cf6';
  const statColor = STATUS_COLORS[user.status] || '#8b5cf6';
  const isSuper   = user.role === 'mla' || user.role === 'pa';

  const formattedDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return iso; }
  };

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, background:`${roleColor}22`, color:roleColor, border:`1px solid ${roleColor}44` }}>
        {user.username?.[0]?.toUpperCase() || '?'}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
          <span style={{ fontWeight:700, color:'var(--text-1)', fontSize:14 }}>{user.username}</span>
          <Badge color={roleColor}>{isSuper && '⚡ '}{ROLE_LABELS[user.role] || user.role}</Badge>
          <Badge color={statColor}>{user.status}</Badge>
        </div>
        <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:3 }}>{user.email}</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:11, color:'rgba(255,255,255,0.3)' }}>
          {isSuper && <span style={{ color:'#f59e0b', fontWeight:600 }}>⚡ Full access — Admin Panel</span>}
          {user.ward  && <span>Ward: <strong style={{ color:'#22d3ee' }}>{user.ward}</strong></span>}
          {user.booth && <span>Booth: <strong style={{ color:'#10b981' }}>{user.booth}</strong></span>}
          <span>Registered: {formattedDate(user.requestedAt)}</span>
          {user.approvedBy && <span>By: {user.approvedBy}</span>}
        </div>
        {/* Access scope line */}
        <div style={{ marginTop:5, fontSize:10, color:'rgba(255,255,255,0.2)', fontStyle:'italic' }}>
          {user.role==='mla'          && 'Read/write all wards & booths · Admin Panel access'}
          {user.role==='pa'           && 'Read/write all wards & booths · Admin Panel access'}
          {user.role==='corporator'   && `Write: Ward ${user.ward||'(unset)'} only · Read-only: all other wards`}
          {user.role==='booth_worker' && `Write: Booth ${user.booth||'(unset)'} only · Read-only: all other booths`}
        </div>
      </div>

      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        {tab === 'pending' && (
          <>
            <button onClick={() => onApprove(user)}
              style={{ padding:'7px 14px', background:'#10b981', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
              Approve
            </button>
            <button onClick={() => onReject(user)}
              style={{ padding:'7px 14px', background:'rgba(239,68,68,0.15)', border:'1px solid #ef444466', borderRadius:8, color:'#ef4444', fontWeight:700, fontSize:12, cursor:'pointer' }}>
              Reject
            </button>
          </>
        )}
        {tab !== 'pending' && (
          <button onClick={() => onEdit(user)}
            style={{ padding:'7px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'var(--text-2)', fontWeight:600, fontSize:12, cursor:'pointer' }}>
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
      const { data } = await authApi.verifyAdmin({ email: authUser?.email, password });
      if (data.success) { onVerified(); }
      else { setError(data.detail || 'Incorrect password.'); }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || '';
      if (err.response?.status === 401) setError('Incorrect password. Please try again.');
      else if (err.response?.status === 403) setError('You do not have admin privileges.');
      else setError(msg || 'Verification failed. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh' }}>
        <div className="anim-fade-up" style={{ width:'100%', maxWidth:400, background:'rgba(17,28,52,0.95)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:18, padding:'36px 32px', backdropFilter:'blur(24px)', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ width:60, height:60, borderRadius:'50%', margin:'0 auto 14px', background:'rgba(245,158,11,0.12)', border:'2px solid rgba(245,158,11,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>🔐</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:19, fontWeight:800, color:'var(--text-1)', marginBottom:6 }}>Admin Verification</div>
            <div style={{ fontSize:12, color:'var(--text-3)', lineHeight:1.6 }}>Confirm your identity to access the Admin Panel.</div>
          </div>
          <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:10, padding:'10px 14px', marginBottom:22, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#090e1c' }}>
              {(authUser?.username||'A')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)' }}>{authUser?.username}</div>
              <div style={{ fontSize:11, color:'var(--text-3)' }}>{authUser?.email} · {ROLE_LABELS[authUser?.role]}</div>
            </div>
          </div>
          {error && <div className="alert alert-error" style={{ marginBottom:16, fontSize:13 }}>⚠ {error}</div>}
          <form onSubmit={handleVerify} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="field">
              <label className="field-label">Your Password</label>
              <input className="input" type="password" placeholder="Enter your password to continue"
                value={password} onChange={e => { setPassword(e.target.value); setError(''); }} autoFocus required />
            </div>
            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={busy} style={{ marginTop:4 }}>
              {busy ? <span className="spinner"/> : '🔓 Verify & Enter Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Access Denied screen ──────────────────────────────────────────────────────
function AccessDenied({ user }) {
  const roleColor = ROLE_COLORS[user?.role] || '#8b5cf6';
  return (
    <div className="page">
      <Navbar />
      <div className="page-inner" style={{ textAlign:'center', paddingTop:80 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>🔒</div>
        <h2 style={{ color:'var(--text-1)', marginBottom:8 }}>Access Denied</h2>
        <p style={{ color:'var(--text-3)', marginBottom:20, fontSize:14 }}>
          The Admin Panel is only accessible to <strong style={{ color:'#f59e0b' }}>MLA</strong> and <strong style={{ color:'#f59e0b' }}>Office P.A</strong> accounts.
        </p>
        {user && (
          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'16px 24px', marginBottom:24 }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Your current role</div>
            <span style={{ background:`${roleColor}18`, color:roleColor, border:`1px solid ${roleColor}35`, borderRadius:6, padding:'4px 12px', fontSize:13, fontWeight:700 }}>
              {ROLE_LABELS[user.role] || user.role}
            </span>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
              {user.role==='corporator'   && `Your access: Write Ward ${user.ward} · Read all wards`}
              {user.role==='booth_worker' && `Your access: Write Booth ${user.booth} · Read all booths`}
            </div>
          </div>
        )}
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.25)' }}>
          Contact your MLA or Office P.A if you need elevated access.
        </p>
      </div>
    </div>
  );
}

// ── Main AdminPanel component ─────────────────────────────────────────────────
export default function AdminPanel() {
  const { user: authUser } = useAuth();
  const [verified, setVerified] = useState(false);
  const [data,    setData]    = useState({ pending:[], approved:[], rejected:[] });
  const [tab,     setTab]     = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState('');
  const [modal,   setModal]   = useState(null);
  const [acting,  setActing]  = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── HARD GUARD: non-superusers are immediately blocked, no re-auth gate ──
  if (authUser && !canAccessAdmin(authUser)) {
    return <AccessDenied user={authUser} />;
  }

  // ── Re-auth gate for verified superusers ──────────────────────────────────
  if (!verified && authUser && canAccessAdmin(authUser)) {
    return <AdminReAuthGate onVerified={() => setVerified(true)} />;
  }

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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (verified) fetchUsers(); }, [fetchUsers, verified]);

  const handleConfirm = async ({ role, ward, booth, reason }) => {
    if (!modal) return;
    const { action, user } = modal;
    setActing(true);
    try {
      let r;
      if (action === 'approve')      r = await api.post('/api/admin/approve/',     { email:user.email, role, ward, booth });
      else if (action === 'reject')  r = await api.post('/api/admin/reject/',      { email:user.email, reason });
      else                           r = await api.post('/api/admin/update-role/', { email:user.email, role, ward, booth });
      if (r.data.success) { showToast(r.data.message); setModal(null); fetchUsers(); }
      else showToast('⚠ ' + (r.data.message || 'Action failed.'));
    } catch (e) { showToast('⚠ ' + (e.userMessage || 'Network error.')); }
    finally { setActing(false); }
  };

  const tabData = data[tab] || [];

  return (
    <div className="page">
      <Navbar />

      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#1a2744', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, padding:'12px 18px', fontSize:13, color:'var(--text-1)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
      {modal && (
        <ConfirmModal action={modal.action} user={modal.user} loading={acting}
          onConfirm={handleConfirm} onCancel={() => setModal(null)} />
      )}

      <div className="page-inner" style={{ maxWidth:860 }}>
        <div className="page-header anim-fade-up" style={{ marginBottom:28 }}>
          <span className="badge badge-gold mb-8">Admin Panel</span>
          <h1 style={{ color:'var(--text-1)' }}>User Access Management</h1>
          <p style={{ color:'var(--text-3)', fontSize:13 }}>
            Review, approve and manage access for Corporators and Booth Workers
          </p>
          {/* Superuser badge */}
          <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'6px 12px', fontSize:12 }}>
            <span>⚡</span>
            <span style={{ color:'#f59e0b', fontWeight:700 }}>{ROLE_LABELS[authUser?.role]}</span>
            <span style={{ color:'rgba(255,255,255,0.3)' }}>— Superuser access</span>
          </div>
        </div>

        {/* Role permissions reference */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 16px', marginBottom:24 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Role Permission Reference</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:8 }}>
            {[
              { role:'mla',          icon:'⚡', desc:'Full read/write + Admin Panel', color:'#f59e0b' },
              { role:'pa',           icon:'⚡', desc:'Full read/write + Admin Panel', color:'#f59e0b' },
              { role:'corporator',   icon:'🏘', desc:'Write: own ward · Read: all wards', color:'#22d3ee' },
              { role:'booth_worker', icon:'🗳', desc:'Write: own booth · Read: all booths', color:'#10b981' },
            ].map(({ role, icon, desc, color }) => (
              <div key={role} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:`${color}08`, border:`1px solid ${color}18`, borderRadius:8 }}>
                <span style={{ fontSize:14 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color }}>{ROLE_LABELS[role]}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Pending',  count:data.pending?.length  || 0, color:'#f59e0b' },
            { label:'Approved', count:data.approved?.length || 0, color:'#10b981' },
            { label:'Rejected', count:data.rejected?.length || 0, color:'#ef4444' },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ background:`${color}11`, border:`1px solid ${color}33`, borderRadius:12, padding:'14px 18px', textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900, color, fontFamily:'var(--font-display)' }}>{count}</div>
              <div style={{ fontSize:11, color, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:'8px 18px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.15s',
              background:tab===key ? '#f59e0b' : 'rgba(255,255,255,0.05)',
              border:tab===key ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
              color:tab===key ? '#090e1c' : 'var(--text-2)', minHeight:40,
            }}>
              {icon} {label}
              {data[key]?.length > 0 && (
                <span style={{ marginLeft:6, background:tab===key?'#090e1c':STATUS_COLORS[key]+'33', color:tab===key?'#090e1c':STATUS_COLORS[key], borderRadius:10, padding:'1px 6px', fontSize:11, fontWeight:800 }}>
                  {data[key].length}
                </span>
              )}
            </button>
          ))}
          <button onClick={fetchUsers} disabled={loading}
            style={{ marginLeft:'auto', padding:'8px 14px', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-2)', fontSize:13, minHeight:40 }}>
            {loading ? '⟳' : '↻ Refresh'}
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom:16 }}>⚠ {error}</div>}

        {loading ? (
          <div style={{ textAlign:'center', color:'var(--text-3)', padding:40 }}>Loading users…</div>
        ) : tabData.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--text-3)', padding:48, background:'rgba(255,255,255,0.02)', borderRadius:14, border:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>
              {tab==='pending' ? '✅' : tab==='approved' ? '👥' : '📋'}
            </div>
            <div style={{ fontWeight:700, marginBottom:6 }}>
              {tab==='pending' ? 'No pending requests' : tab==='approved' ? 'No approved users' : 'No rejected users'}
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {tabData.map(u => (
              <UserCard key={u._id||u.email} user={u} tab={tab}
                onApprove={user => setModal({ action:'approve', user })}
                onReject={user  => setModal({ action:'reject',  user })}
                onEdit={user    => setModal({ action:'edit',    user })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}