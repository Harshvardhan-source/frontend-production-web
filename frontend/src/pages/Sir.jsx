import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';

const API = (process.env.REACT_APP_API_URL || 'https://production-web-conn.onrender.com') + '/api';

// ─── SVG Icon library — no emoji, no AI-generated icons ──────────────────────
const Icon = {
  // User silhouette
  User: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3"/>
      <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
    </svg>
  ),
  // ID card
  ID: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="2"/>
      <circle cx="5.5" cy="8" r="1.5"/>
      <path d="M9 6.5h3.5M9 9.5h2"/>
    </svg>
  ),
  // House
  House: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7.5L8 2l6 5.5"/>
      <path d="M3.5 6.5V14h3.5v-3.5h2V14H13V6.5"/>
    </svg>
  ),
  // Family / relation
  Family: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="4.5" r="2"/>
      <circle cx="11" cy="4.5" r="2"/>
      <path d="M1 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/>
      <path d="M8 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/>
    </svg>
  ),
  // Search / magnifier
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5"/>
      <path d="M10.5 10.5L14 14"/>
    </svg>
  ),
  // Check mark circle
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M5 8.5l2 2 4-4"/>
    </svg>
  ),
  // X circle
  XCircle: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/>
    </svg>
  ),
  // Plus / new
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 5v6M5 8h6"/>
    </svg>
  ),
  // Trash / delete
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4h11M6 4V2.5h4V4M5.5 4l.5 9.5h4l.5-9.5"/>
    </svg>
  ),
  // Edit / pen
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2.5l3 3L5 14H2v-3L10.5 2.5z"/>
    </svg>
  ),
  // Warning triangle
  Warning: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L1 14.5h14L8 1.5z"/>
      <path d="M8 6v4M8 11.5v.5"/>
    </svg>
  ),
  // Shield / retained
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L2 4v4.5c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z"/>
      <path d="M5.5 8.5l2 2 3-3.5"/>
    </svg>
  ),
  // List / all
  List: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h10M3 8h10M3 12h7"/>
    </svg>
  ),
  // Bar chart
  Chart: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13V7h3v6M7 13V4h3v9M12 13V9h2v4"/>
      <path d="M1 13h14"/>
    </svg>
  ),
  // Lightning / run bulk
  Lightning: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 1.5L4 9h4.5L6.5 14.5 13 7H8.5L9.5 1.5z"/>
    </svg>
  ),
  // Clock
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 4.5V8l2.5 2"/>
    </svg>
  ),
  // Arrow right
  ArrowRight: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4"/>
    </svg>
  ),
  // Chevron down
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4"/>
    </svg>
  ),
  // SIR module badge
  SIR: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"/>
    </svg>
  ),
  // Comparison / diff
  Diff: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="5.5" height="12" rx="1"/>
      <rect x="9.5" y="2" width="5.5" height="12" rx="1"/>
      <path d="M7 8h2"/>
    </svg>
  ),
  // Flag
  Flag: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 1.5v13"/>
      <path d="M3 2.5h9l-2.5 4 2.5 4H3"/>
    </svg>
  ),
  // X (close)
  X: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13"/>
    </svg>
  ),
  // Undo
  Undo: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V3.5L1 5.5"/>
      <path d="M3 3.5C5 1 9 1 11.5 3.5s2.5 6.5 0 9"/>
    </svg>
  ),
};

// ─── Category meta — SVG icons only ──────────────────────────────────────────
const CAT_META = {
  ALL:        { color:'#94a3b8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)',  Icon: Icon.List,    label:'All Records'       },
  NEW:        { color:'#22d3ee', bg:'rgba(34,211,238,0.08)',  border:'rgba(34,211,238,0.25)',  Icon: Icon.Plus,    label:'New Addition'      },
  DELETED:    { color:'#f87171', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.25)',   Icon: Icon.Trash,   label:'Removed from Roll' },
  MODIFIED:   { color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.25)',  Icon: Icon.Edit,    label:'Record Changed'    },
  SUSPICIOUS: { color:'#ef4444', bg:'rgba(239,68,68,0.10)',  border:'rgba(239,68,68,0.35)',   Icon: Icon.Warning, label:'Suspicious Entry'  },
  RETAINED:   { color:'#10b981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.25)',  Icon: Icon.Shield,  label:'Long-term Voter'   },
  NOT_FOUND:  { color:'#94a3b8', bg:'rgba(148,163,184,0.06)', border:'rgba(148,163,184,0.2)', Icon: Icon.List,    label:'Unregistered'      },
};

const CAT_STATUS_MAP = {
  NEW_ADDITION: 'NEW', DELETION: 'DELETED', MODIFICATION: 'MODIFIED',
  RETAINED: 'RETAINED', NOT_FOUND: 'NOT_FOUND', SUSPICIOUS: 'SUSPICIOUS',
};
const TABS = ['ALL','NEW','DELETED','MODIFIED','SUSPICIOUS','RETAINED','NOT_FOUND'];

// ─── SIRBadge ─────────────────────────────────────────────────────────────────
function SIRBadge({ category }) {
  const key = CAT_STATUS_MAP[category] || category;
  const m   = CAT_META[key] || CAT_META.ALL;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:m.bg, border:`1px solid ${m.border}`,
      color:m.color, borderRadius:20, padding:'2px 10px',
      fontSize:11, fontWeight:700,
    }}>
      <m.Icon />
      {m.label || category}
    </span>
  );
}

// ─── InputBox ─────────────────────────────────────────────────────────────────
function InputBox({ label, placeholder, value, onChange, IconComp, mono, note, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.6px', display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ color:'rgba(255,255,255,0.3)' }}><IconComp /></span>
        {label}
        {note && <span style={{ marginLeft:4, fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>{note}</span>}
      </label>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.25)',
          border: `1px solid ${focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 9,
          padding: '10px 13px',
          fontSize: 13,
          color: 'var(--text-1)',
          outline: 'none',
          transition: 'border-color 0.2s, background 0.2s',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
        }}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ color, dot, children }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.04)', border:`1px solid ${color}40`, borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, color }}>
      {dot === 'pulse' && <span style={{ width:6, height:6, borderRadius:'50%', background:color, animation:'pulse 1.5s infinite', flexShrink:0 }} />}
      {dot === 'spin'  && <span style={{ width:10, height:10, border:`2px solid ${color}30`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }} />}
      {dot === 'solid' && <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />}
      {children}
    </div>
  );
}

// ─── RollBadge ────────────────────────────────────────────────────────────────
function RollBadge({ label, found }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 16px', background:'rgba(0,0,0,0.2)', borderRadius:10, border:`1px solid ${found ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}` }}>
      <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.5px' }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color: found ? '#10b981' : '#f87171' }}>
        {found ? <Icon.Check /> : <Icon.XCircle />}
        {found ? 'Found' : 'Absent'}
      </div>
    </div>
  );
}

// ─── SIMILAR RECORDS PANEL ────────────────────────────────────────────────────
// Shows House No · Name · Relation from both rolls whenever input is entered
function SimilarRecordsPanel({ similar2025, similar2002, record2025, record2002, in2025, in2002 }) {
  // Merge: confirmed matched record goes first, then other suggestions
  const rows25 = [];
  if (in2025 && record2025?.name) {
    rows25.push({ ...record2025, _matched: true });
  }
  (similar2025 || []).forEach(r => {
    if (!rows25.find(x => x.voterid && x.voterid === r.voterid)) rows25.push(r);
  });

  const rows02 = [];
  if (in2002 && record2002?.name) {
    rows02.push({ ...record2002, _matched: true });
  }
  (similar2002 || []).forEach(r => {
    if (!rows02.find(x => x.voterid && x.voterid === r.voterid)) rows02.push(r);
  });

  if (!rows25.length && !rows02.length) return null;

  const ColHeader = ({ children }) => (
    <th style={{ padding:'6px 10px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)',
      textAlign:'left', textTransform:'uppercase', letterSpacing:'0.6px',
      borderBottom:'1px solid rgba(255,255,255,0.06)', whiteSpace:'nowrap' }}>
      {children}
    </th>
  );

  const RollTable = ({ rows, year, accentColor, borderColor }) => (
    <div style={{ flex:1, minWidth:0, background:'rgba(0,0,0,0.18)', borderRadius:10,
      border:`1px solid ${borderColor}`, overflow:'hidden' }}>
      {/* Roll header */}
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px',
        borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.15)' }}>
        <span style={{ fontSize:10, fontWeight:800, color:accentColor, letterSpacing:'0.8px',
          textTransform:'uppercase' }}>{year} Roll</span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)',
          borderRadius:8, padding:'1px 7px', fontWeight:600 }}>{rows.length} record{rows.length!==1?'s':''}</span>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:320 }}>
          <thead>
            <tr>
              <ColHeader>House No</ColHeader>
              <ColHeader>Name</ColHeader>
              <ColHeader>Relation</ColHeader>
              <ColHeader>EPIC</ColHeader>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{
                background: r._matched
                  ? `${accentColor}12`
                  : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                borderBottom:'1px solid rgba(255,255,255,0.03)',
              }}>
                <td style={{ padding:'7px 10px', fontSize:12, color: r._matched ? accentColor : '#94a3b8',
                  fontWeight: r._matched ? 700 : 400, fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap' }}>
                  {r._matched && (
                    <span style={{ display:'inline-flex', marginRight:5, color:accentColor }}><Icon.Check /></span>
                  )}
                  {r.house || '—'}
                </td>
                <td style={{ padding:'7px 10px', fontSize:12, color: r._matched ? '#e2e8f0' : '#cbd5e1',
                  fontWeight: r._matched ? 600 : 400, maxWidth:160, overflow:'hidden',
                  textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.name || '—'}
                </td>
                <td style={{ padding:'7px 10px', fontSize:11, color:'rgba(255,255,255,0.45)',
                  maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.relation || '—'}
                </td>
                <td style={{ padding:'7px 10px', fontSize:11, color:'rgba(255,255,255,0.3)',
                  fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap' }}>
                  {r.voterid || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop:14, animation:'fadeIn 0.25s ease' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <span style={{ color:'rgba(255,255,255,0.2)' }}><Icon.Family /></span>
        <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)',
          textTransform:'uppercase', letterSpacing:'0.6px' }}>
          Similar Records Found
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:10 }}>
        {rows25.length > 0 && (
          <RollTable rows={rows25} year="2025" accentColor="#22d3ee" borderColor="rgba(34,211,238,0.15)" />
        )}
        {rows02.length > 0 && (
          <RollTable rows={rows02} year="2002" accentColor="#f59e0b" borderColor="rgba(245,158,11,0.15)" />
        )}
      </div>
    </div>
  );
}

// ─── LIVE CHECK PANEL ─────────────────────────────────────────────────────────
function LiveCheckPanel() {
  const [form, setForm]     = useState({ name:'', epic:'', relation:'', house:'' });
  const [state, setState]   = useState('idle');
  const [result, setResult] = useState(null);
  const debounceRef         = useRef(null);
  const abortRef            = useRef(null);
  const [confirmedRec, setConfirmedRec] = useState(null);

  const hasInput = form.name.trim() || form.epic.trim() || form.house.trim();

  const doCheck = useCallback(async (f) => {
    const name     = f.name.trim();
    const epic     = f.epic.trim().toUpperCase();
    const relation = f.relation.trim();
    const house    = f.house.trim().toUpperCase();
    if (!name && !epic && !house) { setState('idle'); setResult(null); return; }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setState('checking');

    // 55s timeout — covers Render free-tier cold start (~30-50s)
    const timeoutId = setTimeout(() => abortRef.current?.abort(), 55000);

    try {
      const res  = await fetch(`${API}/sir/check/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, voterid: epic, relationName: relation, houseNumber: house, wardNumber:'', boothNo:'', serialNumber:'', store:false }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (data.success) { setResult(data); setState('result'); }
      else setState('error');
    } catch (err) {
      if (err.name === 'AbortError') {
        // Could be user-initiated clear OR our 55s timeout
        // Only show error if input still has values (i.e. not a user clear)
        if (name || epic || house) setState('error');
      } else {
        setState('error');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const handleChange = (key) => (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, [key]: val }));
    setState('typing');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doCheck({ ...form, [key]: val }), 500);
  };

  const handleClear = () => {
    setForm({ name:'', epic:'', relation:'', house:'' });
    setState('idle'); setResult(null); setConfirmedRec(null);
    clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  };

  React.useEffect(() => { setConfirmedRec(null); }, [result]);

  const primary         = result?.results?.[0];
  const suspicious      = result?.suspicious || [];
  const changes         = result?.changes || primary?.changes || [];
  const suggestions2002 = result?.suggestions_2002 || [];
  const rec02           = confirmedRec || result?.record_2002 || {};
  const rec25           = result?.record_2025 || {};
  // found_2002: true when backend confirmed it OR user manually confirmed a suggestion
  const found_2002      = result?.in_2002 || !!confirmedRec;
  const showSuggestions = !result?.in_2002 && suggestions2002.length > 0 && !confirmedRec;

  // When user confirms a 2002 suggestion, the category upgrades:
  // NEW_ADDITION → RETAINED (voter now verified in both rolls)
  // NOT_FOUND    → RETAINED (same logic)
  // Any other    → category unchanged but found_2002 becomes true
  const effectivePrimary = confirmedRec
    ? (primary?.category === 'NEW_ADDITION' || primary?.category === 'NOT_FOUND')
      ? { ...primary, category:'RETAINED', label:'Long-term Voter',
          detail:'2002 record confirmed manually — voter verified in both rolls.' }
      : { ...primary }
    : primary;

  const catKey  = CAT_STATUS_MAP[effectivePrimary?.category] || 'ALL';
  const catMeta = CAT_META[catKey] || CAT_META.ALL;

  const statusLine = () => {
    if (state === 'idle')     return null;
    if (state === 'typing')   return <StatusPill color="#6b7280" dot="pulse">Waiting…</StatusPill>;
    if (state === 'checking') return <StatusPill color="#6366f1" dot="spin">Checking rolls… (may take up to 30s on first load)</StatusPill>;
    if (state === 'error')    return <StatusPill color="#ef4444" dot="">Error — try again</StatusPill>;
    if (state === 'result' && effectivePrimary) return <StatusPill color={catMeta.color} dot="solid">{effectivePrimary.label}</StatusPill>;
    return null;
  };

  return (
    <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:8 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <span style={{ color:'#6366f1' }}><Icon.Search /></span>
            <span style={{ fontSize:16, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.2px' }}>Instant SIR Check</span>
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', paddingLeft:22 }}>
            Cross-reference a voter across 2002 &amp; 2025 rolls in real-time
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {statusLine()}
          {hasInput && (
            <button onClick={handleClear} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 11px', fontSize:12, color:'rgba(255,255,255,0.45)', cursor:'pointer', fontWeight:500 }}>
              <Icon.X /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Input grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14 }}>
        <InputBox label="Voter Name"    placeholder="Enter full name…"       value={form.name}     onChange={handleChange('name')}     IconComp={Icon.User}   autoFocus />
        <InputBox label="EPIC / Voter ID" placeholder="e.g. NUX4001234"     value={form.epic}     onChange={handleChange('epic')}     IconComp={Icon.ID}     mono />
        <InputBox label="House / Flat No" placeholder="e.g. 7-1-42"         value={form.house}    onChange={handleChange('house')}    IconComp={Icon.House}  mono note="Narrows search to exact house" />
        <InputBox label="Relative Name"   placeholder="Father / Husband name" value={form.relation} onChange={handleChange('relation')} IconComp={Icon.Family} note="Fallback if name unmatched" />
      </div>

      {/* Similar records — shown as soon as any result arrives */}
      {state === 'result' && (
        <SimilarRecordsPanel
          similar2025={result?.similar_2025 || []}
          similar2002={result?.suggestions_2002 || []}
          record2025={result?.record_2025}
          record2002={result?.record_2002}
          in2025={result?.in_2025}
          in2002={result?.in_2002}
        />
      )}

      {/* Checking skeleton */}
      {state === 'checking' && (
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} style={{ height:13, borderRadius:7, width:`${w}%`, background:'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />
          ))}
        </div>
      )}

      {/* Result panel */}
      {state === 'result' && effectivePrimary && (
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:12, animation:'fadeIn 0.3s ease' }}>

          {/* Status banner */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'14px 18px', borderRadius:12, border:`1px solid ${catMeta.border}`, background:catMeta.bg, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:10, border:`1px solid ${catMeta.border}`, background:catMeta.bg, display:'flex', alignItems:'center', justifyContent:'center', color:catMeta.color, flexShrink:0 }}>
                <catMeta.Icon />
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:catMeta.color, display:'flex', alignItems:'center', gap:8 }}>
                  {effectivePrimary?.label}
                  {confirmedRec && primary?.category !== effectivePrimary?.category && (
                    <span style={{ fontSize:10, background:'rgba(16,185,129,0.15)', color:'#10b981', padding:'2px 8px', borderRadius:10, fontWeight:700, border:'1px solid rgba(16,185,129,0.3)' }}>
                      ↑ upgraded
                    </span>
                  )}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:2 }}>{effectivePrimary?.detail}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <RollBadge label="2002" found={found_2002} />
              <RollBadge label="2025" found={result.in_2025} />
            </div>
          </div>

          {/* 2002 vs 2025 record comparison */}
          {(found_2002 || result.in_2025) && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { year:'2002', found: found_2002, rec: rec02 },
                { year:'2025', found: result.in_2025, rec: rec25 },
              ].map(({ year, found, rec }) => (
                <div key={year} style={{ background:'rgba(0,0,0,0.2)', borderRadius:12, border:`1px solid ${found ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.18)'}`, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase' }}>{year} Voter Roll</span>
                    {year === '2002' && confirmedRec && (
                      <span style={{ fontSize:9, background:'rgba(16,185,129,0.18)', color:'#10b981', padding:'1px 7px', borderRadius:8, fontWeight:700 }}>Confirmed</span>
                    )}
                  </div>
                  {found ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      {[['Name',rec.name],['Relation',rec.relation],['House',rec.house],['Gender',rec.gender],['Age',rec.age],['EPIC',rec.voterid],...(year==='2025'?[['Ward',rec.ward],['Booth',rec.booth]]:[])].map(([lbl,val]) => val ? (
                        <div key={lbl} style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', minWidth:52, fontWeight:600 }}>{lbl}</span>
                          <span style={{ fontSize:12, color:'#e2e8f0', fontFamily: lbl==='EPIC' ? 'ui-monospace,monospace' : 'inherit' }}>{val}</span>
                        </div>
                      ) : null)}
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:6, color:'#f87171', fontSize:13, fontWeight:600 }}>
                      <Icon.XCircle /> Not found in {year} roll
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 2002 fuzzy suggestions */}
          {showSuggestions && (
            <div style={{ background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <span style={{ color:'#f59e0b' }}><Icon.Search /></span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f59e0b' }}>2002 Record Not Found Automatically</div>
                  <div style={{ fontSize:11, color:'rgba(245,158,11,0.5)', marginTop:2 }}>
                    {suggestions2002.length} similar record{suggestions2002.length > 1 ? 's' : ''} found — select the correct one
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {suggestions2002.map((s, i) => (
                  <div key={i} style={{ background:'rgba(0,0,0,0.25)', borderRadius:10, border:`1px solid ${i===0 ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.06)'}`, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:12 }}>
                    {/* Score ring */}
                    <div style={{ width:42, height:42, borderRadius:'50%', flexShrink:0, background: s.score>=85?'rgba(16,185,129,0.12)':s.score>=65?'rgba(245,158,11,0.12)':'rgba(239,68,68,0.08)', border:`2px solid ${s.score>=85?'#10b981':s.score>=65?'#f59e0b':'#ef4444'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color: s.score>=85?'#10b981':s.score>=65?'#f59e0b':'#ef4444' }}>
                      {s.score}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:5, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        {s.name || '—'}
                        {i===0 && <span style={{ fontSize:10, background:'rgba(245,158,11,0.18)', color:'#f59e0b', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>Best match</span>}
                      </div>
                      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                        {[['House',s.house],['Relation',s.relation],['Gender',s.gender],['Age',s.age],['EPIC',s.voterid]].map(([lbl,val]) => val ? (
                          <div key={lbl} style={{ fontSize:11 }}>
                            <span style={{ color:'rgba(255,255,255,0.3)', marginRight:4 }}>{lbl}</span>
                            <span style={{ color:'#e2e8f0', fontFamily:lbl==='EPIC'?'ui-monospace,monospace':'inherit' }}>{val}</span>
                          </div>
                        ) : null)}
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:7, flexWrap:'wrap' }}>
                        {Object.entries(s.field_scores||{}).map(([field,score]) => (
                          <div key={field} style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{field.replace('Voter ','')}</span>
                            <div style={{ width:36, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ width:`${score}%`, height:'100%', background: score>=85?'#10b981':score>=60?'#f59e0b':'#ef4444' }} />
                            </div>
                            <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setConfirmedRec({ name:s.name, relation:s.relation, house:s.house, gender:s.gender, age:s.age, voterid:s.voterid })} style={{ flexShrink:0, padding:'7px 13px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.35)', borderRadius:8, cursor:'pointer', color:'#10b981', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
                      <Icon.Check /> Confirm
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed 2002 banner */}
          {confirmedRec && !result?.in_2002 && (
            <div style={{ background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:'#10b981', flexShrink:0 }}><Icon.Check /></span>
              <div style={{ flex:1, fontSize:12, color:'#10b981', fontWeight:600 }}>
                2002 record confirmed: <span style={{ fontFamily:'ui-monospace,monospace', marginLeft:4 }}>{confirmedRec.name}</span>
              </div>
              <button onClick={() => setConfirmedRec(null)} style={{ background:'none', border:'1px solid rgba(16,185,129,0.25)', borderRadius:6, color:'#10b981', fontSize:11, padding:'3px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                <Icon.Undo /> Undo
              </button>
            </div>
          )}

          {/* Field changes table */}
          {primary.category === 'MODIFICATION' && changes.length > 0 && (
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:12, border:'1px solid rgba(245,158,11,0.15)', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px 7px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color:'rgba(245,158,11,0.6)' }}><Icon.Diff /></span>
                <span style={{ fontSize:11, fontWeight:700, color:'rgba(245,158,11,0.6)', textTransform:'uppercase', letterSpacing:'0.6px' }}>Field Changes Detected</span>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    {['Field','2002 Value','2025 Value'].map(h => (
                      <th key={h} style={{ padding:'7px 12px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.6px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {changes.map((ch, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: i%2===0?'rgba(245,158,11,0.025)':'transparent' }}>
                      <td style={{ padding:'7px 12px', fontSize:12, color:'rgba(255,255,255,0.45)' }}>{ch.field}</td>
                      <td style={{ padding:'7px 12px', fontSize:12, color:'#e2e8f0', fontFamily:'ui-monospace,monospace' }}>{ch.from}</td>
                      <td style={{ padding:'7px 12px', fontSize:12, color:'#f59e0b', fontFamily:'ui-monospace,monospace' }}>
                        <span style={{ marginRight:5, opacity:0.5 }}><Icon.ArrowRight /></span>{ch.to}
                        {ch.note && <div style={{ fontSize:10, color:'rgba(245,158,11,0.5)', marginTop:2 }}>{ch.note}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Suspicious flags */}
          {suspicious.length > 0 && (
            <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:12, padding:'12px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <span style={{ color:'#f87171' }}><Icon.Flag /></span>
                <span style={{ fontSize:12, fontWeight:700, color:'#f87171' }}>Anomaly Flags ({suspicious.length})</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {suspicious.map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, color:'#f87171' }}>
                      <Icon.Warning />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#fca5a5' }}>{s.label}</div>
                      <div style={{ fontSize:11, color:'rgba(252,165,165,0.6)', marginTop:2 }}>{s.detail}</div>
                    </div>
                    {s.value !== undefined && (
                      <div style={{ fontSize:11, fontFamily:'ui-monospace,monospace', color:'#f87171', background:'rgba(239,68,68,0.1)', padding:'3px 8px', borderRadius:6, flexShrink:0 }}>
                        {s.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relative name echo */}
          {form.relation.trim() && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>Relative entered</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontFamily:'ui-monospace,monospace' }}>{form.relation}</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.18)', marginLeft:'auto' }}>For reference only</span>
            </div>
          )}
        </div>
      )}

      {/* Idle hint */}
      {state === 'idle' && (
        <div style={{ marginTop:24, textAlign:'center', padding:'18px 0 6px' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:8, opacity:0.2, color:'var(--text-1)' }}>
            <Icon.Search />
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>
            Start typing a name or EPIC number — results appear automatically
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RecordCard ───────────────────────────────────────────────────────────────
function RecordCard({ rec }) {
  const [open, setOpen] = useState(false);
  const key = CAT_STATUS_MAP[rec.category] || rec.category;
  const m   = CAT_META[key] || CAT_META.ALL;

  return (
    <div style={{ background:'rgba(17,28,52,0.65)', border:`1px solid ${m.border}`, borderRadius:12, marginBottom:8, overflow:'hidden', transition:'border-color 0.2s' }}>
      <div onClick={() => setOpen(p => !p)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer' }}>
        <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:m.bg, border:`1px solid ${m.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:m.color }}>
          <m.Icon />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:13, color:'var(--text-1)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {rec.name || rec.voterid || '—'}
            <SIRBadge category={rec.category} />
            {rec.flags?.length > 0 && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, background:'rgba(239,68,68,0.12)', color:'#f87171', borderRadius:4, padding:'1px 7px' }}>
                <Icon.Flag /> {rec.flags.length} flag{rec.flags.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:3, display:'flex', gap:12, flexWrap:'wrap' }}>
            {rec.voterid    && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon.ID />{rec.voterid}</span>}
            {rec.house_no   && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon.House />House {rec.house_no}</span>}
            {rec.ward_number && <span>Ward {rec.ward_number}</span>}
            {rec.booth_no   && <span>Booth {rec.booth_no}</span>}
          </div>
        </div>
        <span style={{ color:'var(--text-3)', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink:0 }}>
          <Icon.ChevronDown />
        </span>
      </div>

      {open && (
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:10 }}>{rec.details}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { year:'2002', found:rec.found_2002, name:rec.name_2002, age:rec.age_2002, house:rec.house_2002 },
              { year:'2025', found:rec.found_2025, name:rec.name_2025, age:rec.age_2025, house:rec.house_2025 },
            ].map(r => (
              <div key={r.year} style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>{r.year} Roll</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, color: r.found ? '#10b981' : '#f87171', fontWeight:700, fontSize:12, marginBottom: r.found ? 6 : 0 }}>
                  {r.found ? <Icon.Check /> : <Icon.XCircle />}
                  {r.found ? 'Found' : 'Not found'}
                </div>
                {r.name  && <div style={{ fontSize:11, color:'var(--text-2)', marginTop:3 }}>Name: {r.name}</div>}
                {r.age   && <div style={{ fontSize:11, color:'var(--text-3)' }}>Age: {r.age}</div>}
                {r.house && <div style={{ fontSize:11, color:'var(--text-3)' }}>House: {r.house}</div>}
              </div>
            ))}
          </div>
          {rec.flags?.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'#f87171', marginBottom:5 }}>
                <Icon.Flag /> Anomaly Flags
              </div>
              {rec.flags.map((f, i) => (
                <div key={i} style={{ fontSize:11, color:'#fca5a5', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, padding:'4px 9px', marginBottom:3, display:'flex', alignItems:'center', gap:6 }}>
                  <Icon.Warning /> {f}
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--text-3)', marginTop:6 }}>
            <Icon.Clock /> {rec.Time_stamp?.slice(0,19).replace('T',' ') || '—'}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SIR() {
  const [activeTab,   setActiveTab]   = useState('ALL');
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkMsg,     setBulkMsg]     = useState('');

  const fetchData = useCallback(async (tab, pg) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/sir-data/?category=${tab}&page=${pg}`, { credentials:'include' });
      const json = await res.json();
      if (json.success) setData(json);
    } catch { /**/ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(activeTab, page); }, [activeTab, page, fetchData]);

  const handleTab = (tab) => { setActiveTab(tab); setPage(1); };

  const runBulk = async () => {
    if (!window.confirm('Process ALL voters through SIR? This may take several minutes.')) return;
    setBulkRunning(true); setBulkMsg('');
    try {
      const res  = await fetch(`${API}/sir-bulk/`, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' } });
      const json = await res.json();
      setBulkMsg(json.success
        ? `Done — ${json.processed?.toLocaleString()} voters processed`
        : json.message || 'Error');
      if (json.success) fetchData(activeTab, 1);
    } catch { setBulkMsg('Network error'); }
    finally { setBulkRunning(false); }
  };

  const s       = data?.summary || {};
  const records = data?.records || [];

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner">

        {/* Page header */}
        <div className="page-header anim-fade-up">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700, color:'var(--gold)' }}>
              <Icon.SIR /> SIR Module
            </span>
          </div>
          <h1>Special Intensive Revision</h1>
          <p>Voter roll comparison · 2002 vs 2025 · Anomaly detection · Classification</p>
        </div>

        {/* Live check panel */}
        <LiveCheckPanel />

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0 20px' }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.2)', letterSpacing:'1.2px', textTransform:'uppercase' }}>Bulk Records</span>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Summary stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:20 }}>
          {['NEW','DELETED','MODIFIED','SUSPICIOUS','RETAINED','NOT_FOUND'].map(cat => {
            const m      = CAT_META[cat];
            const active = activeTab === cat;
            return (
              <div key={cat} onClick={() => handleTab(cat)} style={{ background: active ? m.bg : 'rgba(255,255,255,0.025)', border:`1px solid ${active ? m.border : 'rgba(255,255,255,0.06)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.18s' }}>
                <div style={{ color: m.color, marginBottom:8 }}><m.Icon /></div>
                <div style={{ fontSize:22, fontWeight:800, color:m.color, fontFamily:'var(--font-display)' }}>{(s[cat]||0).toLocaleString()}</div>
                <div style={{ fontSize:11, color:'var(--text-3)', marginTop:3, fontWeight:500 }}>{m.label}</div>
              </div>
            );
          })}
          <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ color:'var(--text-3)', marginBottom:8 }}><Icon.Chart /></div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text-1)', fontFamily:'var(--font-display)' }}>{(s.TOTAL||0).toLocaleString()}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:3, fontWeight:500 }}>Total Checked</div>
          </div>
        </div>

        {/* Bulk run */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <button onClick={runBulk} disabled={bulkRunning} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.35)', borderRadius:10, padding:'10px 18px', cursor:'pointer', color:'#a5b4fc', fontWeight:600, fontSize:13, transition:'all 0.2s' }}>
            {bulkRunning
              ? <><span className="spinner" /> Running SIR…</>
              : <><Icon.Lightning /> Run Bulk SIR</>
            }
          </button>
          {bulkMsg && (
            <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color: bulkMsg.startsWith('Done') || bulkMsg.startsWith('✓') ? '#10b981' : '#f87171', fontWeight:600 }}>
              {bulkMsg.startsWith('Done') || bulkMsg.startsWith('✓') ? <Icon.Check /> : <Icon.XCircle />}
              {bulkMsg}
            </span>
          )}
          <span style={{ fontSize:12, color:'var(--text-3)', marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
            <Icon.Clock /> Auto-runs when surveys are saved
          </span>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {TABS.map(tab => {
            const m      = CAT_META[tab];
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => handleTab(tab)} style={{ display:'flex', alignItems:'center', gap:6, background: active ? m.bg : 'rgba(255,255,255,0.025)', border:`1px solid ${active ? m.border : 'rgba(255,255,255,0.06)'}`, borderRadius:8, padding:'6px 13px', cursor:'pointer', color: active ? m.color : 'var(--text-2)', fontWeight: active ? 700 : 400, fontSize:12, transition:'all 0.15s' }}>
                <m.Icon />
                {m.label}
                {tab !== 'ALL' && s[tab] !== undefined && (
                  <span style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:'1px 6px', fontSize:10 }}>{s[tab]}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Records list */}
        {loading ? (
          <div style={{ display:'flex', gap:10, alignItems:'center', padding:'40px 0', color:'var(--text-3)', fontSize:13 }}>
            <span className="spinner" /> Loading SIR records…
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign:'center', padding:'56px 20px', background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.07)', borderRadius:14, color:'var(--text-3)' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12, opacity:0.3, color:'var(--text-1)' }}>
              <Icon.Search />
            </div>
            <div style={{ fontWeight:600, marginBottom:4 }}>No records in this category</div>
            <div style={{ fontSize:13 }}>Run Bulk SIR above, or check individual voters using the panel above.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:12 }}>
              Showing {records.length} of {(data?.total||0).toLocaleString()} records
            </div>
            {records.map((rec, i) => (
              <RecordCard key={`${rec.voterid||i}-${rec.category}`} rec={rec} />
            ))}
            {data?.total > 50 && (
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:20 }}>
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn btn-ghost" style={{ padding:'7px 16px' }}>← Prev</button>
                <span style={{ padding:'7px 16px', color:'var(--text-2)', fontSize:13 }}>Page {page}</span>
                <button onClick={() => setPage(p => p+1)} disabled={records.length < 50} className="btn btn-ghost" style={{ padding:'7px 16px' }}>Next →</button>
              </div>
            )}
          </>
        )}

      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
      `}</style>
    </div>
  );
}