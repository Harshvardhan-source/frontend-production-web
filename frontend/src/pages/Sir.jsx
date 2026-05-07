import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';

const API = (process.env.REACT_APP_API_URL || 'https://production-web-conn-0tsi.onrender.com') + '/api';

// ─── SVG Icon library — no emoji, no AI-generated icons ──────────────────────
const Icon = {
  User: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3"/>
      <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
    </svg>
  ),
  ID: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="2"/>
      <circle cx="5.5" cy="8" r="1.5"/>
      <path d="M9 6.5h3.5M9 9.5h2"/>
    </svg>
  ),
  House: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7.5L8 2l6 5.5"/>
      <path d="M3.5 6.5V14h3.5v-3.5h2V14H13V6.5"/>
    </svg>
  ),
  Family: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="4.5" r="2"/>
      <circle cx="11" cy="4.5" r="2"/>
      <path d="M1 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/>
      <path d="M8 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5"/>
      <path d="M10.5 10.5L14 14"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M5 8.5l2 2 4-4"/>
    </svg>
  ),
  XCircle: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/>
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 5v6M5 8h6"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4h11M6 4V2.5h4V4M5.5 4l.5 9.5h4l.5-9.5"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2.5l3 3L5 14H2v-3L10.5 2.5z"/>
    </svg>
  ),
  Warning: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L1 14.5h14L8 1.5z"/>
      <path d="M8 6v4M8 11.5v.5"/>
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L2 4v4.5c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z"/>
      <path d="M5.5 8.5l2 2 3-3.5"/>
    </svg>
  ),
  List: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h10M3 8h10M3 12h7"/>
    </svg>
  ),
  Chart: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13V7h3v6M7 13V4h3v9M12 13V9h2v4"/>
      <path d="M1 13h14"/>
    </svg>
  ),
  Lightning: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 1.5L4 9h4.5L6.5 14.5 13 7H8.5L9.5 1.5z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 4.5V8l2.5 2"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4"/>
    </svg>
  ),
  SIR: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"/>
    </svg>
  ),
  Diff: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="5.5" height="12" rx="1"/>
      <rect x="9.5" y="2" width="5.5" height="12" rx="1"/>
      <path d="M7 8h2"/>
    </svg>
  ),
  Flag: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 1.5v13"/>
      <path d="M3 2.5h9l-2.5 4 2.5 4H3"/>
    </svg>
  ),
  X: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13"/>
    </svg>
  ),
  Undo: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V3.5L1 5.5"/>
      <path d="M3 3.5C5 1 9 1 11.5 3.5s2.5 6.5 0 9"/>
    </svg>
  ),
  // Info circle — new
  Info: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 7v4"/>
      <circle cx="8" cy="5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  ),
  // Booth / location pin — new
  Booth: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.485-2.015-4.5-4.5-4.5z"/>
      <circle cx="8" cy="6" r="1.5"/>
    </svg>
  ),
};

// ─── Category meta ─────────────────────────────────────────────────────────────
const CAT_META = {
  ALL:         { color:'#94a3b8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)',  Icon: Icon.List,    label:'All Records'       },
  NEW:         { color:'#22d3ee', bg:'rgba(34,211,238,0.08)',  border:'rgba(34,211,238,0.25)',  Icon: Icon.Plus,    label:'New Addition'      },
  DELETED:     { color:'#f87171', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.25)',   Icon: Icon.Trash,   label:'Removed from Roll' },
  MODIFIED:    { color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.25)',  Icon: Icon.Edit,    label:'Record Changed'    },
  SUSPICIOUS:  { color:'#ef4444', bg:'rgba(239,68,68,0.10)',  border:'rgba(239,68,68,0.35)',   Icon: Icon.Warning, label:'Suspicious Entry'  },
  RETAINED:    { color:'#10b981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.25)',  Icon: Icon.Shield,  label:'Long-term Voter'   },
  NOT_FOUND:   { color:'#94a3b8', bg:'rgba(148,163,184,0.06)', border:'rgba(148,163,184,0.2)', Icon: Icon.List,    label:'Unregistered'      },
  NAME_SEARCH: { color:'#6366f1', bg:'rgba(99,102,241,0.08)', border:'rgba(99,102,241,0.25)',  Icon: Icon.Search,  label:'Name Search'       },
};

const CAT_STATUS_MAP = {
  NEW_ADDITION: 'NEW', DELETION: 'DELETED', MODIFICATION: 'MODIFIED',
  RETAINED: 'RETAINED', NOT_FOUND: 'NOT_FOUND', SUSPICIOUS: 'SUSPICIOUS',
  NAME_SEARCH: 'NAME_SEARCH',
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
// Detect mobile/Android for conditional behaviour
const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

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
        autoFocus={isMobile ? false : autoFocus}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.25)',
          border: `1px solid ${focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 9,
          padding: '12px 13px',
          fontSize: 16, /* 16px prevents iOS/Android zoom-on-focus */
          color: 'var(--text-1)',
          outline: 'none',
          transition: 'border-color 0.2s, background 0.2s',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
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

// ─── VOTER INFO MODAL ─────────────────────────────────────────────────────────
function VoterInfoModal({ record, roll, onClose }) {
  if (!record) return null;

  const accentColor = roll === '2025' ? '#22d3ee' : '#f59e0b';
  const accentBg    = roll === '2025' ? 'rgba(34,211,238,0.08)'  : 'rgba(245,158,11,0.08)';
  const accentBdr   = roll === '2025' ? 'rgba(34,211,238,0.25)'  : 'rgba(245,158,11,0.25)';

  const fields = [
    { label: 'Name',          value: record.name,                    mono: false },
    { label: 'Relation',      value: record.relation,                mono: false },
    { label: 'House / Flat',  value: record.house,                   mono: true  },
    { label: 'Voter ID/EPIC', value: record.voterid,                 mono: true  },
    { label: 'Gender',        value: record.gender,                  mono: false },
    { label: 'Age',           value: record.age,                     mono: false },
    { label: 'Booth No',      value: record.booth || record.part,    mono: false },
    ...(record.serial ? [{ label: 'Serial No', value: record.serial, mono: false }] : []),
    ...(record.score  ? [{ label: 'Match Score', value: `${record.score}%`, mono: false }] : []),
  ].filter(f => f.value);

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'linear-gradient(145deg,rgba(17,28,52,0.99),rgba(10,18,35,0.99))',
          border:`1px solid ${accentBdr}`,
          borderRadius:18, padding:'22px 24px',
          width:'100%', maxWidth:420,
          maxHeight:'90dvh', overflowY:'auto',
          boxShadow:'0 28px 64px rgba(0,0,0,0.65)',
          animation:'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#e2e8f0', marginBottom:5 }}>
              Voter Details
            </div>
            <span style={{
              fontSize:11, fontWeight:700, color:accentColor,
              background:accentBg, border:`1px solid ${accentBdr}`,
              borderRadius:20, padding:'2px 10px',
            }}>
              {roll} ROLL
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:8, color:'rgba(255,255,255,0.5)', width:32, height:32,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <Icon.X />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {fields.map(({ label, value, mono }) => (
            <div
              key={label}
              style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 12px',
                background:'rgba(255,255,255,0.03)',
                borderRadius:8, border:'1px solid rgba(255,255,255,0.06)',
                gap:12,
              }}
            >
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>
                {label}
              </span>
              <span style={{
                fontSize:13, fontWeight:600, color:'#e2e8f0',
                textAlign:'right', wordBreak:'break-all',
                fontFamily: mono ? 'ui-monospace,monospace' : 'inherit',
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop:18, textAlign:'center' }}>
          <button
            onClick={onClose}
            style={{
              background:`${accentBg}`, border:`1px solid ${accentBdr}`,
              borderRadius:10, color:accentColor, padding:'9px 32px',
              cursor:'pointer', fontSize:13, fontWeight:700,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SIMILAR RECORDS PANEL ────────────────────────────────────────────────────
function SimilarRecordsPanel({ similar2025, similar2002, record2025, record2002, in2025, in2002, inputFieldCount = 0 }) {
  const [infoRecord, setInfoRecord] = useState(null);

  // Build merged rows for each roll
  const rows25 = [];
  if (in2025 && record2025?.name) rows25.push({ ...record2025, _matched: true, matched_by: ['confirmed'] });
  (similar2025 || []).forEach(r => {
    if (!rows25.find(x => x.voterid && x.voterid === r.voterid)) rows25.push(r);
  });

  const rows02 = [];
  if (in2002 && record2002?.name) rows02.push({ ...record2002, _matched: true, matched_by: ['confirmed'] });
  (similar2002 || []).forEach(r => {
    if (!rows02.find(x => x.voterid && x.voterid === r.voterid)) rows02.push(r);
  });

  if (!rows25.length && !rows02.length) return null;

  // ── Field metadata ───────────────────────────────────────────────────────────
  const FIELD_META = {
    voterid:   { label: 'Voter ID',     color: '#10b981' },
    name:      { label: 'Voter Name',   color: '#22d3ee' },
    house:     { label: 'House No',     color: '#a78bfa' },
    relation:  { label: 'Relation',     color: '#f59e0b' },
    confirmed: { label: '✓ Confirmed',  color: '#10b981' },
    partial:   { label: 'Partial Name',   color: '#6366f1' },
  };

  // ── Group rows by match strength + "Almost matched" labelling ────────────────
  // "Almost matched" = user entered N fields and this record matched exactly N-1
  const groupRows = (rows) => {
    const bucket = {};
    rows.forEach(r => {
      const mb = r.matched_by || [];
      let key, label, priority, color, isAlmost = false;

      if (r._matched) {
        key = 'confirmed'; label = 'Confirmed Match'; priority = 0; color = '#10b981';
      } else if (mb.length >= 4) {
        key = 'all4'; label = 'All 4 fields matched'; priority = 1; color = '#10b981';
      } else if (mb.length === 3) {
        const sorted = [...mb].sort();
        key = 'f3_' + sorted.join('+');
        // "Almost matched" when 3/4 fields filled and these 3 match
        isAlmost = inputFieldCount === 4;
        label = isAlmost
          ? 'Almost matched — ' + sorted.map(f => FIELD_META[f]?.label || f).join(' + ')
          : sorted.map(f => FIELD_META[f]?.label || f).join(' + ') + ' matched';
        priority = 2; color = isAlmost ? '#f59e0b' : '#22d3ee';
      } else if (mb.length === 2) {
        const sorted = [...mb].sort();
        key = 'f2_' + sorted.join('+');
        // "Almost matched" when 3 fields filled and 2 match, OR 2 fields filled and 2 match (perfect)
        isAlmost = inputFieldCount === 3;
        label = isAlmost
          ? 'Almost matched — ' + sorted.map(f => FIELD_META[f]?.label || f).join(' + ')
          : sorted.map(f => FIELD_META[f]?.label || f).join(' + ') + ' matched';
        priority = 3; color = isAlmost ? '#f59e0b' : '#6366f1';
      } else if (mb.length === 1) {
        const fieldLabels = { name: 'Voter Name', house: 'House No', relation: 'Relation', voterid: 'Voter ID', partial: 'Partial Name' };
        key = 'f1_' + mb[0];
        isAlmost = mb[0] === 'partial' ? false : inputFieldCount === 2;
        priority = mb[0] === 'partial' ? 5 : 4;
        label = isAlmost
          ? 'Almost matched — ' + (fieldLabels[mb[0]] || mb[0])
          : (fieldLabels[mb[0]] || mb[0]) + ' matched';
        color = isAlmost ? '#f59e0b' : (FIELD_META[mb[0]]?.color || '#94a3b8');
      } else {
        key = 'other'; label = 'Other records'; priority = 5; color = '#475569';
      }

      if (!bucket[key]) bucket[key] = { key, label, priority, color, isAlmost, rows: [] };
      bucket[key].rows.push(r);
    });
    return Object.values(bucket).sort((a, b) => a.priority - b.priority);
  };

  // ── Shared sub-components ────────────────────────────────────────────────────
  const ColHeader = ({ children }) => (
    <th style={{ padding:'6px 10px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1px solid rgba(255,255,255,0.06)', whiteSpace:'nowrap' }}>
      {children}
    </th>
  );

  const MatchTag = ({ field }) => {
    const m = FIELD_META[field] || { label: field, color: '#94a3b8' };
    return (
      <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4, background:`${m.color}18`, color:m.color, border:`1px solid ${m.color}30`, whiteSpace:'nowrap', display:'inline-block' }}>
        {m.label}
      </span>
    );
  };

  // ── Per-roll section — collapsible header + scrollable body ──────────────────
  const RollSection = ({ rows, year, accentColor, borderColor }) => {
    const groups = groupRows(rows);
    const total  = rows.length;
    const [open, setOpen] = useState(true);

    return (
      <div style={{ flex:1, minWidth:0, background:'rgba(0,0,0,0.18)', borderRadius:10, border:`1px solid ${borderColor}`, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div onClick={() => rows.length > 0 && setOpen(o => !o)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderBottom: open && rows.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', background:'rgba(0,0,0,0.15)', cursor: rows.length > 0 ? 'pointer' : 'default', userSelect:'none', flexShrink:0 }}>
          <span style={{ fontSize:10, fontWeight:800, color:accentColor, letterSpacing:'0.8px', textTransform:'uppercase' }}>{year} Roll</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'1px 7px', fontWeight:600 }}>
            {total} record{total !== 1 ? 's' : ''}{total >= 100 ? ' (top 100)' : ''}
          </span>
          {open && groups.map(g => (
            <span key={g.key} style={{ fontSize:9, fontWeight:700, color: g.isAlmost ? '#f59e0b' : g.color, background:`${g.isAlmost ? '#f59e0b' : g.color}14`, border:`1px solid ${g.isAlmost ? '#f59e0b' : g.color}28`, borderRadius:6, padding:'1px 6px', display:'inline-flex', alignItems:'center', gap:3 }}>
              {g.isAlmost && <span style={{ fontSize:8 }}>⚡</span>}
              <span style={{ width:5, height:5, borderRadius:'50%', background: g.isAlmost ? '#f59e0b' : g.color, flexShrink:0 }} />
              {g.rows.length}
            </span>
          ))}
          {rows.length > 0 && (
            <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.2)', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition:'transform 0.2s', display:'inline-flex' }}>
              <Icon.ChevronDown />
            </span>
          )}
        </div>

        {/* Empty state */}
        {rows.length === 0 && (
          <div style={{ padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:0.35 }}>
            <Icon.XCircle />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', textAlign:'center' }}>
              No matching records in {year} roll
            </span>
          </div>
        )}

        {/* Scrollable body — max 460px, thin scrollbar */}
        {open && (
          <div className="sir-scroll" style={{ overflowY:'auto', maxHeight: isMobile ? 320 : 460, scrollbarWidth:'thin', scrollbarColor:`${accentColor}50 transparent` }}>
            {groups.map((group, gi) => (
              <div key={group.key}>
                {/* Group label */}
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px 4px', background: group.isAlmost ? 'rgba(245,158,11,0.07)' : 'rgba(0,0,0,0.10)', borderTop: gi > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  {group.isAlmost
                    ? <span style={{ fontSize:11 }}>⚡</span>
                    : <span style={{ width:6, height:6, borderRadius:'50%', background:group.color, flexShrink:0 }} />
                  }
                  <span style={{ fontSize:10, fontWeight:700, color: group.isAlmost ? '#f59e0b' : group.color, letterSpacing:'0.3px' }}>
                    {group.label}
                  </span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.15)' }}>({group.rows.length})</span>
                </div>
                {/* Table */}
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:420 }}>
                    <thead>
                      <tr>
                        <ColHeader>House No</ColHeader>
                        <ColHeader>Name</ColHeader>
                        <ColHeader>Relation</ColHeader>
                        <ColHeader>Matched</ColHeader>
                        <ColHeader>Booth</ColHeader>
                        <ColHeader>EPIC</ColHeader>
                        <th style={{ padding:'6px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)', width:36 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((r, i) => (
                        <tr key={i} style={{ background: r._matched ? `${accentColor}12` : group.isAlmost ? 'rgba(245,158,11,0.04)' : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                          {/* House */}
                          <td style={{ padding:'7px 10px', fontSize:12, color: r._matched ? accentColor : group.isAlmost ? '#fcd34d' : '#94a3b8', fontWeight: r._matched || group.isAlmost ? 700 : 400, fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap' }}>
                            {r._matched && <span style={{ display:'inline-flex', marginRight:5, color:accentColor }}><Icon.Check /></span>}
                            {r.house || '—'}
                          </td>
                          {/* Name */}
                          <td style={{ padding:'7px 10px', fontSize:12, color: r._matched ? '#e2e8f0' : group.isAlmost ? '#fde68a' : '#cbd5e1', fontWeight: r._matched || group.isAlmost ? 600 : 400, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.name || '—'}
                          </td>
                          {/* Relation */}
                          <td style={{ padding:'7px 10px', fontSize:11, color: group.isAlmost ? 'rgba(253,230,138,0.7)' : 'rgba(255,255,255,0.45)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {r.relation || '—'}
                          </td>
                          {/* Matched-by tags */}
                          <td style={{ padding:'7px 10px', whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                              {(r.matched_by || []).map(f => <MatchTag key={f} field={f} />)}
                            </div>
                          </td>
                          {/* Booth */}
                          <td style={{ padding:'7px 10px', fontSize:11, whiteSpace:'nowrap' }}>
                            {r.booth ? (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:accentColor, fontWeight:700, background:`${accentColor}12`, border:`1px solid ${accentColor}28`, borderRadius:6, padding:'2px 7px' }}>
                                <Icon.Booth />{r.booth}
                              </span>
                            ) : <span style={{ color:'rgba(255,255,255,0.2)' }}>—</span>}
                          </td>
                          {/* EPIC */}
                          <td style={{ padding:'7px 10px', fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap' }}>
                            {r.voterid || '—'}
                          </td>
                          <td style={{ padding:'7px 8px', textAlign:'center' }}>
                            {r.score != null ? (
                              <span style={{ fontSize:10, fontWeight:700, borderRadius:6, padding:'1px 5px', background:'rgba(0,0,0,0.2)', color: r.score>=80?'#10b981':r.score>=60?'#f59e0b':'#94a3b8' }}>{r.score}</span>
                            ) : null}
                          </td>
                          {/* Info */}
                          <td style={{ padding:'7px 8px', textAlign:'center' }}>
                            <button onClick={() => setInfoRecord({ record: r, roll: year })} title="View full voter details"
                              style={{ background:`${accentColor}12`, border:`1px solid ${accentColor}28`, borderRadius:6, color:accentColor, width: isMobile ? 36 : 26, height: isMobile ? 36 : 26, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s', touchAction:'manipulation' }}
                              onMouseEnter={e => e.currentTarget.style.background = `${accentColor}25`}
                              onMouseLeave={e => e.currentTarget.style.background = `${accentColor}12`}
                            >
                              <Icon.Info />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{ marginTop:14, animation:'fadeIn 0.25s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap' }}>
          <span style={{ color:'rgba(255,255,255,0.2)' }}><Icon.Family /></span>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.6px' }}>
            Similar Records Found
          </span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.15)' }}>grouped by matching fields</span>
          {/* Legend */}
          <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:9, color:'#f59e0b', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:4, padding:'1px 6px', fontWeight:700 }}>⚡ Almost matched</span>
            {[['voterid','Voter ID'],['name','Voter Name'],['house','House No'],['relation','Relation'],['partial','Partial']].map(([f, lbl]) => (
              <span key={f} style={{ fontSize:9, color:FIELD_META[f].color, background:`${FIELD_META[f].color}14`, border:`1px solid ${FIELD_META[f].color}28`, borderRadius:4, padding:'1px 6px', fontWeight:700 }}>{lbl}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
          <RollSection rows={rows25} year="2025" accentColor="#22d3ee" borderColor="rgba(34,211,238,0.15)" />
          <RollSection rows={rows02} year="2002" accentColor="#f59e0b" borderColor="rgba(245,158,11,0.15)" />
        </div>
      </div>
      {infoRecord && <VoterInfoModal record={infoRecord.record} roll={infoRecord.roll} onClose={() => setInfoRecord(null)} />}
    </>
  );
}

// ─── LIVE CHECK PANEL ─────────────────────────────────────────────────────────
function LiveCheckPanel() {
  const [form, setForm]     = useState({ name:'', epic:'', relation:'', house:'' });
  const [state, setState]   = useState('idle');
  const [result, setResult] = useState(null);
  const debounceRef         = useRef(null);
  const abortRef            = useRef(null);
  const retryRef            = useRef(null);
  const [confirmedRec, setConfirmedRec] = useState(null);

  const hasInput = form.name.trim() || form.epic.trim() || form.house.trim() || form.relation.trim();

  // Auto-retry once on error after a short delay
  React.useEffect(() => {
    if (state === 'error' && hasInput) {
      retryRef.current = setTimeout(() => {
        doCheck(form);
      }, 2000);
    }
    return () => clearTimeout(retryRef.current);
  }, [state]);

  const doCheck = useCallback(async (f) => {
    const name     = f.name.trim();
    const epic     = f.epic.trim().toUpperCase();
    const relation = f.relation.trim();
    const house    = f.house.trim().toUpperCase();
    if (!name && !epic && !house && !relation) { setState('idle'); setResult(null); return; }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setState('checking');

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
  const found_2002      = result?.in_2002 || !!confirmedRec;
  const showSuggestions = !result?.in_2002 && suggestions2002.length > 0 && !confirmedRec;

  const effectivePrimary = confirmedRec
    ? (['NEW_ADDITION','NOT_FOUND'].includes(primary?.category)
        ? { ...primary, category:'RETAINED', label:'Long-term Voter',
            detail:'2002 record confirmed manually — voter verified in both rolls.' }
        : primary)
    : primary;

  const catKey  = CAT_STATUS_MAP[effectivePrimary?.category] || 'ALL';
  const catMeta = CAT_META[catKey] || CAT_META.ALL;

  const statusLine = () => {
    if (state === 'idle')     return null;
    if (state === 'typing')   return <StatusPill color="#6b7280" dot="pulse">Waiting…</StatusPill>;
    if (state === 'checking') return <StatusPill color="#6366f1" dot="spin">Checking rolls… (may take up to 30s on first load)</StatusPill>;
    if (state === 'error')    return <StatusPill color="#6366f1" dot="spin"><span className="spinner" style={{ width:12, height:12, marginRight:6, display:'inline-block' }} />Retrying…</StatusPill>;
    if (state === 'result' && effectivePrimary) return <StatusPill color={catMeta.color} dot="solid">{effectivePrimary.label}</StatusPill>;
    return null;
  };

  return (
    <div className="sir-live-panel" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding: isMobile ? 16 : 24, marginBottom:8 }}>

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
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap:14 }}>
        <InputBox label="Voter Name"      placeholder="Enter full name…"         value={form.name}     onChange={handleChange('name')}     IconComp={Icon.User}   autoFocus />
        <InputBox label="EPIC / Voter ID" placeholder="e.g. NUX4001234"         value={form.epic}     onChange={handleChange('epic')}     IconComp={Icon.ID}     mono />
        <InputBox label="House / Flat No" placeholder="e.g. 7-1-42 or 2-14-1223" value={form.house}  onChange={handleChange('house')}    IconComp={Icon.House}  mono note="Narrows search — partial match supported" />
        <InputBox label="Relative Name"   placeholder="Father / Husband name"   value={form.relation} onChange={handleChange('relation')} IconComp={Icon.Family} note="Search standalone or as fallback" />
      </div>

      {/* Similar records panel — shown as soon as any result arrives */}
      {state === 'result' && (
        <SimilarRecordsPanel
          similar2025={result?.similar_2025 || []}
          similar2002={result?.suggestions_2002 || []}
          record2025={result?.record_2025}
          record2002={result?.record_2002}
          in2025={result?.in_2025}
          in2002={result?.in_2002}
          inputFieldCount={[form.name, form.epic, form.house, form.relation].filter(v => v.trim()).length}
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
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
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
                      {[
                        ['Name',     rec.name],
                        ['Relation', rec.relation],
                        ['House',    rec.house],
                        ['Gender',   rec.gender],
                        ['Age',      rec.age],
                        ['EPIC',     rec.voterid],
                        ...(year === '2025' ? [['Ward', rec.ward], ['Booth', rec.booth]] : []),
                      ].map(([lbl,val]) => val ? (
                        <div key={lbl} style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', minWidth:52, fontWeight:600 }}>{lbl}</span>
                          <span style={{ fontSize:12, color:'#e2e8f0', fontFamily: lbl === 'EPIC' ? 'ui-monospace,monospace' : 'inherit' }}>{val}</span>
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
                        {i === 0 && <span style={{ fontSize:10, background:'rgba(245,158,11,0.18)', color:'#f59e0b', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>Best match</span>}
                      </div>
                      {/* ── Fields row — now includes Booth ── */}
                      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                        {[
                          ['House',    s.house],
                          ['Relation', s.relation],
                          ['Booth',    s.booth],
                          ['Gender',   s.gender],
                          ['Age',      s.age],
                          ['EPIC',     s.voterid],
                        ].map(([lbl, val]) => val ? (
                          <div key={lbl} style={{ fontSize:11 }}>
                            <span style={{ color:'rgba(255,255,255,0.3)', marginRight:4 }}>{lbl}</span>
                            <span style={{
                              color: lbl === 'Booth' ? '#f59e0b' : '#e2e8f0',
                              fontWeight: lbl === 'Booth' ? 700 : 400,
                              fontFamily: lbl === 'EPIC' ? 'ui-monospace,monospace' : 'inherit',
                            }}>{val}</span>
                          </div>
                        ) : null)}
                      </div>
                      {/* Match score bars */}
                      <div style={{ display:'flex', gap:8, marginTop:7, flexWrap:'wrap' }}>
                        {Object.entries(s.field_scores || {}).map(([field, score]) => (
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
                    {/* Action buttons — Confirm + Info */}
                    <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                      <button
                        onClick={() => setConfirmedRec({ name:s.name, relation:s.relation, house:s.house, gender:s.gender, age:s.age, voterid:s.voterid, booth:s.booth })}
                        style={{ padding:'7px 13px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.35)', borderRadius:8, cursor:'pointer', color:'#10b981', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}
                      >
                        <Icon.Check /> Confirm
                      </button>
                    </div>
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
                {confirmedRec.booth && <span style={{ marginLeft:8, opacity:0.7 }}>· Booth {confirmedRec.booth}</span>}
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
      <div onClick={() => setOpen(p => !p)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>
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
            {rec.voterid     && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon.ID />{rec.voterid}</span>}
            {rec.house_no    && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon.House />House {rec.house_no}</span>}
            {rec.ward_number && <span>Ward {rec.ward_number}</span>}
            {rec.booth_no    && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon.Booth />Booth {rec.booth_no}</span>}
          </div>
        </div>
        <span style={{ color:'var(--text-3)', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink:0 }}>
          <Icon.ChevronDown />
        </span>
      </div>

      {open && (
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:10 }}>{rec.details}</div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8, marginBottom:10 }}>
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
function SIRFilterBar({ ward, booth, onWardChange, onBoothChange }) {
  return (
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'8px 12px', flex:'1 1 140px', maxWidth: isMobile ? '100%' : 200 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)', flexShrink:0 }}>Ward</span>
        <input value={ward} onChange={e => onWardChange(e.target.value)} placeholder="e.g. 21" style={{ flex:1, background:'none', border:'none', outline:'none', fontSize: isMobile ? 16 : 13, color:'var(--text-1)', minWidth:0, WebkitAppearance:'none' }} autoCorrect="off" autoCapitalize="off" />
        {ward && <button onClick={() => onWardChange('')} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:16,padding:'4px',flexShrink:0,touchAction:'manipulation' }}>✕</button>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'8px 12px', flex:'1 1 140px', maxWidth: isMobile ? '100%' : 200 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)', flexShrink:0 }}>Booth</span>
        <input value={booth} onChange={e => onBoothChange(e.target.value)} placeholder="e.g. 31" style={{ flex:1, background:'none', border:'none', outline:'none', fontSize: isMobile ? 16 : 13, color:'var(--text-1)', minWidth:0, WebkitAppearance:'none' }} autoCorrect="off" autoCapitalize="off" />
        {booth && <button onClick={() => onBoothChange('')} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:16,padding:'4px',flexShrink:0,touchAction:'manipulation' }}>✕</button>}
      </div>
      {(ward || booth) && (
        <span style={{ fontSize:11, color:'#22d3ee', background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:20, padding:'4px 10px', fontWeight:600 }}>
          Filtered: {[ward && `Ward ${ward}`, booth && `Booth ${booth}`].filter(Boolean).join(' · ')}
        </span>
      )}
    </div>
  );
}

const CAT_INFO = {
  NEW:        { emoji:'➕', why:'Present in 2025 but absent from 2002 — new generation voter or migrant' },
  DELETED:    { emoji:'🗑', why:'Was in 2002 but removed from 2025 — death, migration out, or data cleanup' },
  MODIFIED:   { emoji:'✏️', why:'Present in both rolls but details changed — name spelling, address, age correction' },
  SUSPICIOUS: { emoji:'⚠️', why:'Inconsistent patterns — duplicate EPIC, out-of-state ID, house overcrowding' },
  RETAINED:   { emoji:'🛡', why:'Same voter in both 2002 and 2025 rolls — stable, long-term resident' },
  NOT_FOUND:  { emoji:'❓', why:'Not traced in either roll — unregistered, OCR error, or data gap' },
};

export default function SIR() {
  const [activeTab,   setActiveTab]   = useState('ALL');
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkMsg,     setBulkMsg]     = useState('');
  const [filterWard,  setFilterWard]  = useState('');
  const [filterBooth, setFilterBooth] = useState('');

  const fetchData = useCallback(async (tab, pg, ward, booth) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category: tab, page: pg });
      if (ward)  params.set('ward',  ward);
      if (booth) params.set('booth', booth);
      const res  = await fetch(`${API}/sir-data/?${params}`, { credentials:'include' });
      const json = await res.json();
      if (json.success) setData(json);
    } catch { /**/ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(activeTab, page, filterWard, filterBooth); }, [activeTab, page, filterWard, filterBooth, fetchData]);

  const handleTab         = (tab) => { setActiveTab(tab); setPage(1); };
  const handleWardFilter  = (v)   => { setFilterWard(v);  setPage(1); };
  const handleBoothFilter = (v)   => { setFilterBooth(v); setPage(1); };

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

        {/* Ward/Booth filter */}
        <SIRFilterBar
          ward={filterWard} booth={filterBooth}
          onWardChange={handleWardFilter} onBoothChange={handleBoothFilter}
        />

        {/* Summary stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(130px,100%),1fr))', gap:10, marginBottom:20 }}>
          {['NEW','DELETED','MODIFIED','SUSPICIOUS','RETAINED','NOT_FOUND'].map(cat => {
            const m      = CAT_META[cat];
            const info   = CAT_INFO[cat] || {};
            const active = activeTab === cat;
            return (
              <div key={cat} onClick={() => handleTab(cat)} title={info.why}
                style={{ background: active ? m.bg : 'rgba(255,255,255,0.025)', border:`1px solid ${active ? m.border : 'rgba(255,255,255,0.06)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.18s', position:'relative', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ color: m.color }}><m.Icon /></div>
                  {info.emoji && <span style={{ fontSize:14, opacity:0.7 }}>{info.emoji}</span>}
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:m.color, fontFamily:'var(--font-display)' }}>{(s[cat]||0).toLocaleString()}</div>
                <div style={{ fontSize:11, color:'var(--text-3)', marginTop:3, fontWeight:500 }}>{m.label}</div>
                {info.why && (
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:4, lineHeight:1.4 }}>
                    {info.why.split('—')[0].trim()}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ color:'var(--text-3)', marginBottom:8 }}><Icon.Chart /></div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text-1)', fontFamily:'var(--font-display)' }}>{(s.TOTAL||0).toLocaleString()}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:3, fontWeight:500 }}>Total Checked</div>
            {(filterWard || filterBooth) && (
              <div style={{ fontSize:10, color:'#22d3ee', marginTop:4 }}>Filtered view</div>
            )}
          </div>
        </div>

        {/* Bulk run */}
        <div style={{ display:'flex', alignItems: isMobile ? 'flex-start' : 'center', gap:12, marginBottom:20, flexWrap:'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <button onClick={runBulk} disabled={bulkRunning} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.35)', borderRadius:10, padding:'10px 18px', cursor:'pointer', color:'#a5b4fc', fontWeight:600, fontSize:13, transition:'all 0.2s', touchAction:'manipulation', WebkitTapHighlightColor:'transparent', minHeight:44 }}>
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
              <button key={tab} onClick={() => handleTab(tab)} style={{ display:'flex', alignItems:'center', gap:6, background: active ? m.bg : 'rgba(255,255,255,0.025)', border:`1px solid ${active ? m.border : 'rgba(255,255,255,0.06)'}`, borderRadius:8, padding:'8px 13px', cursor:'pointer', color: active ? m.color : 'var(--text-2)', fontWeight: active ? 700 : 400, fontSize:12, transition:'all 0.15s', touchAction:'manipulation', WebkitTapHighlightColor:'transparent', minHeight:40 }}>
                <m.Icon />
                {m.label}
                {tab !== 'ALL' && s[tab] !== undefined && (
                  <span style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:'1px 6px', fontSize:10 }}>{s[tab]}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category legend — expandable */}
        {activeTab === 'ALL' && (
          <details style={{ marginBottom:16, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden' }}>
            <summary style={{ padding:'12px 16px', cursor:'pointer', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.5)', listStyle:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                <Icon.SIR /> Category Reference Guide
              </span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>tap to expand</span>
            </summary>
            <div style={{ padding:'0 16px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap:8 }}>
              {Object.entries(CAT_INFO).map(([cat, info]) => {
                const m = CAT_META[cat];
                return (
                  <div key={cat} style={{ background:m.bg, border:`1px solid ${m.border}`, borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ fontSize:16 }}>{info.emoji}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:m.color }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>{info.why}</div>
                  </div>
                );
              })}
            </div>
          </details>
        )}

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
            <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:12, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <span>Showing {records.length} of {(data?.total||0).toLocaleString()} records</span>
              {(filterWard || filterBooth) && (
                <span style={{ color:'#22d3ee', background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:12, padding:'2px 9px', fontSize:11, fontWeight:600 }}>
                  {[filterWard && `Ward ${filterWard}`, filterBooth && `Booth ${filterBooth}`].filter(Boolean).join(' · ')}
                </span>
              )}
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
        *, *::before, *::after { box-sizing: border-box; }
        input, button, select, textarea { -webkit-tap-highlight-color: transparent; }
        .sir-scroll { -webkit-overflow-scrolling: touch; overflow-scrolling: touch; }
        @media (max-width: 480px) {
          .sir-live-panel { padding: 16px !important; }
          .sir-header-wrap { flex-direction: column !important; align-items: flex-start !important; }
          .sir-status-line { margin-top: 8px; }
          .sir-filter-bar { flex-direction: column !important; }
          .sir-filter-input { max-width: 100% !important; }
          .sir-bulk-wrap { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  );
}