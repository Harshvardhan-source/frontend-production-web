import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../App';

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);
  const { login }         = useAuth();
  const navigate          = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('All fields are required.'); return; }
    setBusy(true); setError('');
    try {
      const { data } = await authApi.login(form);
      if (data.success) {
        login({ username: data.username, email: form.email, role: data.role, ward: data.ward, booth: data.booth });
        navigate('/');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || '';
      if (err.response?.status === 403 && msg.toLowerCase().includes('pending')) {
        setError('⏳ Your account is pending admin approval. Please wait.');
      } else if (err.response?.status === 403 && msg.toLowerCase().includes('rejected')) {
        setError('❌ Your registration was rejected. Please contact the admin.');
      } else {
        setError(msg || 'Server error. Please try again.');
      }
    } finally { setBusy(false); }
  };

  return (
    <div style={S.root}>
      <div style={S.glow1} />
      <div style={S.glow2} />
      <div style={S.card} className="anim-fade-up">
        {/* Logo */}
        <div className="flex items-center gap-12 mb-20">
          <div style={S.logoMark}>⊛</div>
          <div>
            <div style={S.logoName}>Constituency Connect</div>
            <div style={S.logoSub}>Governance Intelligence Platform</div>
          </div>
        </div>
        <hr className="divider" />
        <h1 style={S.heading}>Welcome back</h1>
        <p style={S.sub}>Sign in to your account to continue</p>

        {error && <div className="alert alert-error mb-16">{error}</div>}

        <form onSubmit={handleSubmit} className="flex-col gap-16" style={{ display:'flex' }}>
          <div className="field">
            <label className="field-label">Email Address</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password} onChange={set('password')} required autoComplete="current-password" />
          </div>
          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={busy} style={{ marginTop: 4 }}>
            {busy ? <span className="spinner" /> : 'Sign In →'}
          </button>
        </form>

        <p style={S.switchText}>
          Don't have an account? <Link to="/signup" style={S.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const S = {
  root:    { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden' },
  glow1:   { position:'fixed', top:'-15%', left:'-10%', width:'55%', height:'55%', background:'radial-gradient(ellipse, rgba(245,158,11,0.09) 0%, transparent 70%)', pointerEvents:'none' },
  glow2:   { position:'fixed', bottom:'-15%', right:'-10%', width:'50%', height:'50%', background:'radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 70%)', pointerEvents:'none' },
  card:    { width:'100%', maxWidth:420, background:'rgba(17,28,52,0.88)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'var(--r-xl)', padding:'36px 32px', backdropFilter:'blur(24px)', boxShadow:'var(--shadow-lg)', position:'relative', zIndex:1 },
  logoMark:{ width:44, height:44, background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#090e1c', fontWeight:900, boxShadow:'0 4px 16px rgba(245,158,11,0.35)', flexShrink:0 },
  logoName:{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, color:'var(--text-1)', lineHeight:1.2 },
  logoSub: { fontSize:11, color:'var(--text-2)', marginTop:2 },
  heading: { fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:'var(--text-1)', marginBottom:6 },
  sub:     { fontSize:14, color:'var(--text-2)', marginBottom:24 },
  switchText: { textAlign:'center', fontSize:14, color:'var(--text-2)', marginTop:22 },
  link:    { color:'var(--gold)', fontWeight:600 },
};

