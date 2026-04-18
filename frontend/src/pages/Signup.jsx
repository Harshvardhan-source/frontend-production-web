import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';

// ── Ward list ─────────────────────────────────────────────────────────────────
const WARD_BOOTHS = {
  'PADAVU': [31,32,33,55,56,57,58], 'DEREBAIL SOUTH': [9,11,13,17],
  'DEREBAIL WEST': [1,2,3,5,6,7,8], 'DEREBAIL SOUTH WEST': [4,10,89,90,91,92,94],
  'BOLOOR': [82,83,84,88,93,95,96,97], 'MANNAGUDDA': [12,75,78,79,80,81,85,86,87],
  'KAMBLA': [68,69,71,72,73], 'KODIALBAIL': [14,22,24,25,26,66,67,70],
  'BEJAI': [15,16,18,19,20,21,23], 'KADRI NORTH': [27,28,29,30,63],
  'KADRI SOUTH': [59,61,62,64,65], 'SHIVBHAG': [45,60,134,135,136,139],
  'PADAVU CENTRAL': [34,35,39,40,43,44], 'PADAVU POORVA': [36,37,38,41,42],
  'MAROLI': [48,49,50,51,52,53,54], 'BENDUR': [133,138,140,166,167,171],
  'FALNIR': [162,163,164,165,172,173,174,175], 'COURT': [129,130,131,132,146,147],
  'CENTRAL': [124,125,126,127,128], 'DONGERKERY': [74,76,77,112,115,117,118],
  'KUDROLI': [108,109,110,111,113,114], 'NAVAYATH': [116,119,120,121,122,123],
  'PORT': [148,151,152,153,238,239], 'CANTONMENT': [141,145,149,150],
  'MILAGRIS': [142,143,144,168,169,170], 'VALENCIA': [137,176,177,178,187],
  'KANKANADY': [179,180,181,182,183,184,185,186], 'ALAPE DAKSHINA': [188,189,190,191,192,213,214,215],
  'ALAPE UTTARA': [46,47,193,194,195,196,202], 'KANNUR': [197,198,199,200,201,203,204,205],
  'BAJAL': [206,207,208,209,210,211,212], 'JEPPINAMUGER': [216,217,218,219,220,221,222,223,249],
  'ATTAVARA': [154,155,156,157,226,227,247,248], 'MANGALADEVI': [228,229,231,232,233],
  'HOIGE BAZAR': [235,237,240,244], 'BOLAR': [230,234,236,241,242,243],
  'JEPPU': [158,159,160,161,224,225,245,246], 'BENGRE': [98,99,100,101,102,103,104,105,106,107],
};
const WARDS = Object.keys(WARD_BOOTHS).sort();

const ROLES = [
  { key:'mla',         label:'MLA',          icon:'🏛️', desc:'Full access — all wards & booths',                color:'#f59e0b', needsWard:false, needsBooth:false },
  { key:'pa',          label:'Office P.A',   icon:'📋', desc:'Full admin access on behalf of MLA',             color:'#f59e0b', needsWard:false, needsBooth:false },
  { key:'corporator',  label:'Corporator',   icon:'🏘', desc:'Read/write for your assigned ward only',         color:'#22d3ee', needsWard:true,  needsBooth:false },
  { key:'booth_worker',label:'Booth Worker', icon:'🗳️', desc:'Read/write for your assigned booth only',       color:'#10b981', needsWard:true,  needsBooth:true  },
];

export default function Signup() {
  const navigate = useNavigate();
  const [step,  setStep]  = useState(1);
  const [form,  setForm]  = useState({ username:'', email:'', password:'' });
  const [role,  setRole]  = useState('');
  const [ward,  setWard]  = useState('');
  const [booth, setBooth] = useState('');
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);
  const [done,  setDone]  = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const sel = ROLES.find(r => r.key === role);

  const goNext = e => {
    e.preventDefault(); setError('');
    const { username, email, password } = form;
    if (!username.trim() || !email.trim() || !password.trim()) return setError('All fields are required.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Please enter a valid email address.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      return setError('Password: 8+ characters, include letters and numbers.');
    setStep(2);
  };

  const submit = async () => {
    setError('');
    if (!role) return setError('Please select a role.');
    if (sel?.needsWard  && !ward)  return setError('Please select your ward.');
    if (sel?.needsBooth && !booth) return setError('Please select your booth.');
    setBusy(true);
    try {
      const { data } = await authApi.register({
        username: form.username.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role, ward: sel?.needsWard ? ward : '', booth: sel?.needsBooth ? booth : '',
      });
      if (data.success) setDone(true);
      else setError(data.message || 'Registration failed.');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Server error.');
    } finally { setBusy(false); }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) return (
    <div style={S.root}>
      <div style={S.g1}/><div style={S.g2}/>
      <div style={{ ...S.card, textAlign:'center' }} className="anim-fade-up">
        <div style={{ fontSize:52, marginBottom:14 }}>🎉</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, color:'var(--text-1)', marginBottom:8 }}>Request Submitted!</h2>
        <p style={{ color:'var(--text-2)', fontSize:13, lineHeight:1.6, marginBottom:22 }}>
          Your registration as <strong style={{ color: sel?.color }}>{sel?.label}</strong> is pending admin approval.
          You'll be able to log in once approved.
        </p>
        <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:10, padding:'12px 16px', marginBottom:24, fontSize:12, color:'rgba(255,255,255,0.55)', textAlign:'left' }}>
          <div><strong style={{ color:'var(--text-1)' }}>📧 {form.email}</strong></div>
          <div>Role: <span style={{ color: sel?.color }}>{sel?.label}</span></div>
          {ward  && <div>Ward:  {ward}</div>}
          {booth && <div>Booth: {booth}</div>}
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/login')}>
          Go to Login →
        </button>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <div style={S.g1}/><div style={S.g2}/>
      <div style={S.card} className="anim-fade-up">

        {/* Logo */}
        <div className="flex items-center gap-12 mb-20">
          <div style={S.logo}>⊛</div>
          <div>
            <div style={S.logoName}>Constituency Connect</div>
            <div style={S.logoSub}>Create your account</div>
          </div>
        </div>
        <hr className="divider" />

        {/* Step bar */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:24 }}>
          {['Account Details','Select Role'].map((label, i) => {
            const n = i + 1, active = step === n, past = step > n;
            return (
              <React.Fragment key={label}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, background: active||past ? '#f59e0b':'rgba(255,255,255,0.06)', color: active||past ? '#090e1c':'var(--text-3)', border:`2px solid ${active||past?'#f59e0b':'rgba(255,255,255,0.1)'}` }}>
                    {past ? '✓' : n}
                  </div>
                  <div style={{ fontSize:10, fontWeight:600, color: active?'#f59e0b':'var(--text-3)', whiteSpace:'nowrap' }}>{label}</div>
                </div>
                {i === 0 && <div style={{ flex:1, height:2, background: step>1?'#f59e0b':'rgba(255,255,255,0.06)', margin:'0 10px 18px', transition:'all 0.3s' }} />}
              </React.Fragment>
            );
          })}
        </div>

        {error && <div className="alert alert-error mb-16">{error}</div>}

        {/* STEP 1 — credentials */}
        {step === 1 && (
          <form onSubmit={goNext} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { k:'username', label:'Username',      type:'text',     ph:'your_username' },
              { k:'email',    label:'Email Address', type:'email',    ph:'you@example.com' },
              { k:'password', label:'Password',      type:'password', ph:'Min 8 chars, letters + numbers' },
            ].map(({ k, label, type, ph }) => (
              <div key={k} className="field">
                <label className="field-label">{label}</label>
                <input className="input" type={type} placeholder={ph}
                  value={form[k]} onChange={set(k)} required />
              </div>
            ))}
            <button className="btn btn-primary btn-lg btn-full" type="submit" style={{ marginTop:4 }}>
              Next: Select Role →
            </button>
          </form>
        )}

        {/* STEP 2 — role selection */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'var(--text-1)', marginBottom:4 }}>What is your role?</div>
            <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:16 }}>Select your position. Access will be granted by the admin after review.</div>

            {/* Role cards */}
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:18 }}>
              {ROLES.map(r => (
                <button key={r.key} type="button"
                  onClick={() => { setRole(r.key); setWard(''); setBooth(''); setError(''); }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12, cursor:'pointer', textAlign:'left',
                    background: role===r.key ? `${r.color}14` : 'rgba(255,255,255,0.03)',
                    border: role===r.key ? `2px solid ${r.color}` : '2px solid rgba(255,255,255,0.07)',
                    transition:'all 0.15s' }}>
                  <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17,
                    background: role===r.key ? `${r.color}22` : 'rgba(255,255,255,0.05)',
                    border:`1px solid ${role===r.key?r.color+'44':'rgba(255,255,255,0.07)'}` }}>
                    {r.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color: role===r.key?r.color:'var(--text-1)', marginBottom:1 }}>{r.label}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>{r.desc}</div>
                  </div>
                  <div style={{ width:16, height:16, borderRadius:'50%', flexShrink:0,
                    background: role===r.key?r.color:'transparent',
                    border:`2px solid ${role===r.key?r.color:'rgba(255,255,255,0.18)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {role===r.key && <div style={{ width:5, height:5, borderRadius:'50%', background:'#090e1c' }}/>}
                  </div>
                </button>
              ))}
            </div>

            {/* Ward select */}
            {sel?.needsWard && (
              <div className="field mb-14">
                <label className="field-label">{role==='corporator'?'Your Ward':'Ward (for booth lookup)'}</label>
                <select className="input" value={ward} onChange={e => { setWard(e.target.value); setBooth(''); }} style={{ marginTop:7 }}>
                  <option value="">— Select ward —</option>
                  {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            )}

            {/* Booth select */}
            {sel?.needsBooth && ward && (
              <div className="field mb-14">
                <label className="field-label">Your Booth</label>
                <select className="input" value={booth} onChange={e => setBooth(e.target.value)} style={{ marginTop:7 }}>
                  <option value="">— Select booth —</option>
                  {(WARD_BOOTHS[ward]||[]).map(b => <option key={b} value={b}>Booth {b}</option>)}
                </select>
              </div>
            )}

            {/* Confirmation chip */}
            {role && (
              <div style={{ background:`${sel.color}10`, border:`1px solid ${sel.color}30`, borderRadius:10, padding:'9px 13px', marginBottom:16, fontSize:12 }}>
                <span style={{ color:sel.color, fontWeight:700 }}>{sel.icon} {sel.label}</span>
                {ward  && <span style={{ color:'var(--text-3)' }}> · {ward}</span>}
                {booth && <span style={{ color:'var(--text-3)' }}> · Booth {booth}</span>}
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:3 }}>
                  Admin will review and approve before you can log in.
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={() => { setStep(1); setError(''); }}
                style={{ flexShrink:0, padding:'12px 18px', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text-2)', fontWeight:600, fontSize:13 }}>
                ← Back
              </button>
              <button type="button" onClick={submit} disabled={busy || !role}
                className="btn btn-primary btn-lg" style={{ flex:1, opacity:(!role||busy)?0.6:1 }}>
                {busy ? <span className="spinner"/> : 'Submit Request →'}
              </button>
            </div>
          </div>
        )}

        <p style={S.switchText}>Already have an account? <Link to="/login" style={S.link}>Sign in</Link></p>
      </div>
    </div>
  );
}

const S = {
  root:     { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden' },
  g1:       { position:'fixed', top:'-15%', right:'-10%', width:'55%', height:'55%', background:'radial-gradient(ellipse,rgba(34,211,238,0.07) 0%,transparent 70%)', pointerEvents:'none' },
  g2:       { position:'fixed', bottom:'-15%', left:'-10%', width:'50%', height:'50%', background:'radial-gradient(ellipse,rgba(245,158,11,0.06) 0%,transparent 70%)', pointerEvents:'none' },
  card:     { width:'100%', maxWidth:460, background:'rgba(17,28,52,0.92)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'var(--r-xl)', padding:'36px 32px', backdropFilter:'blur(24px)', boxShadow:'var(--shadow-lg)', position:'relative', zIndex:1 },
  logo:     { width:44, height:44, background:'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#090e1c', fontWeight:900, boxShadow:'0 4px 16px rgba(245,158,11,0.35)', flexShrink:0 },
  logoName: { fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, color:'var(--text-1)', lineHeight:1.2 },
  logoSub:  { fontSize:11, color:'var(--text-2)', marginTop:2 },
  switchText:{ textAlign:'center', fontSize:14, color:'var(--text-2)', marginTop:22 },
  link:     { color:'var(--gold)', fontWeight:600 },
};