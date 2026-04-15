import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../App';

export default function Signup() {
  const [form, setForm]   = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);
  const { login }         = useAuth();
  const navigate          = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    if (!form.username || !form.email || !form.password) return 'All fields are required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))  return 'Invalid email address.';
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(form.password))
      return 'Password: 8+ chars, include letters and numbers.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(); if (err) { setError(err); return; }
    setBusy(true); setError('');
    try {
      const { data } = await authApi.register(form);
      if (data.success) {
        login({ username: data.username, email: form.email });
        navigate('/');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error.');
    } finally { setBusy(false); }
  };

  const fields = [
    { key:'username', label:'Username',       type:'text',     ph:'your_username' },
    { key:'email',    label:'Email Address',  type:'email',    ph:'you@example.com' },
    { key:'password', label:'Password',       type:'password', ph:'Min 8 chars, letters + numbers' },
  ];

  return (
    <div style={S.root}>
      <div style={S.glow1} /><div style={S.glow2} />
      <div style={S.card} className="anim-fade-up">
        <div className="flex items-center gap-12 mb-20">
          <div style={S.logoMark}>⊛</div>
          <div>
            <div style={S.logoName}>Constituency Connect</div>
            <div style={S.logoSub}>Create your account</div>
          </div>
        </div>
        <hr className="divider" />
        <h1 style={S.heading}>Join the platform</h1>
        <p style={S.sub}>Set up your account to start collecting data</p>

        {error && <div className="alert alert-error mb-16">{error}</div>}

        <form onSubmit={handleSubmit} className="flex-col gap-16" style={{ display:'flex' }}>
          {fields.map(f => (
            <div key={f.key} className="field">
              <label className="field-label">{f.label}</label>
              <input className="input" type={f.type} placeholder={f.ph}
                value={form[f.key]} onChange={set(f.key)} required />
            </div>
          ))}
          <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={busy} style={{ marginTop:4 }}>
            {busy ? <span className="spinner" /> : 'Create Account →'}
          </button>
        </form>
        <p style={S.switch}>Already have an account? <Link to="/login" style={S.link}>Sign in</Link></p>
      </div>
    </div>
  );
}

const S = {
  root:    { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden' },
  glow1:   { position:'fixed', top:'-15%', right:'-10%', width:'55%', height:'55%', background:'radial-gradient(ellipse,rgba(34,211,238,0.07) 0%,transparent 70%)', pointerEvents:'none' },
  glow2:   { position:'fixed', bottom:'-15%', left:'-10%', width:'50%', height:'50%', background:'radial-gradient(ellipse,rgba(245,158,11,0.06) 0%,transparent 70%)', pointerEvents:'none' },
  card:    { width:'100%', maxWidth:420, background:'rgba(17,28,52,0.88)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'var(--r-xl)', padding:'36px 32px', backdropFilter:'blur(24px)', boxShadow:'var(--shadow-lg)', position:'relative', zIndex:1 },
  logoMark:{ width:44, height:44, background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#090e1c', fontWeight:900, boxShadow:'0 4px 16px rgba(245,158,11,0.35)', flexShrink:0 },
  logoName:{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, color:'var(--text-1)', lineHeight:1.2 },
  logoSub: { fontSize:11, color:'var(--text-2)', marginTop:2 },
  heading: { fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:'var(--text-1)', marginBottom:6 },
  sub:     { fontSize:14, color:'var(--text-2)', marginBottom:24 },
  switch:  { textAlign:'center', fontSize:14, color:'var(--text-2)', marginTop:22 },
  link:    { color:'var(--gold)', fontWeight:600 },
};
