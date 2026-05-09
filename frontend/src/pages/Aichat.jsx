import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { aiApi } from '../api/client';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#07090f',
  surface:   '#0b0e1a',
  surfaceUp: '#10142a',
  border:    'rgba(255,255,255,0.06)',
  borderFoc: 'rgba(99,102,241,0.55)',
  accent:    '#6366f1',
  accentSft: 'rgba(99,102,241,0.1)',
  gold:      '#f59e0b',
  green:     '#10b981',
  red:       '#ef4444',
  blue:      '#3b82f6',
  teal:      '#14b8a6',
  pink:      '#ec4899',
  orange:    '#f97316',
  textPri:   '#eef2ff',
  textSec:   '#8892b0',
  textMut:   '#3d4a6b',
};

const CHT = [C.gold, C.green, C.accent, C.red, C.blue, C.pink, C.teal, C.orange];

// ─── Inline SVG icons (no external dependency) ─────────────────────────────────
const Ico = {
  Menu: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Send: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Bot:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  Cpu:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  Users: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Activity: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  PieChart: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  Alert: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Target: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  TrendUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Map: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  Home: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Bar: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  ErrCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

// ─── Prompt chips ───────────────────────────────────────────────────────────────
const CHIPS = [
  { Ic: Ico.Bar,     label: 'Turnout Analysis',    q: 'Which wards have the lowest voter turnout and what is driving it?' },
  { Ic: Ico.Users,   label: 'Caste Distribution',  q: 'Show me caste-wise voter distribution across all wards' },
  { Ic: Ico.Activity,label: 'Survey Coverage',     q: 'What is the survey coverage gap and which booths need priority?' },
  { Ic: Ico.Target,  label: 'Ward Strategy',       q: 'Give me a winning strategy for the top 5 risk wards' },
  { Ic: Ico.Home,    label: 'Family Analysis',     q: 'Analyse large family households and their political significance' },
  { Ic: Ico.TrendUp, label: 'Swing Prediction',    q: 'Predict swing wards based on current survey data trends' },
];

// ─── Chart component ────────────────────────────────────────────────────────────
function SmartChart({ chart }) {
  if (!chart?.data?.length) return null;
  const { type, data, xKey, yKeys, title } = chart;
  const tt = { background: '#0d1021', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: C.textPri, fontSize: 11.5 };
  return (
    <div style={{ background: 'rgba(255,255,255,0.018)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginTop: 10 }}>
      {title && <p style={{ margin: '0 0 11px', fontSize: 9.5, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</p>}
      <ResponsiveContainer width="100%" height={190}>
        {type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey={yKeys[0]} nameKey={xKey} cx="50%" cy="50%" outerRadius={70} innerRadius={32}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {data.map((_, i) => <Cell key={i} fill={CHT[i % CHT.length]} />)}
            </Pie>
            <Tooltip contentStyle={tt} />
          </PieChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey={xKey} tick={{ fill: C.textMut, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMut, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: 11, color: C.textSec }} />
            {yKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={CHT[i % CHT.length]} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />)}
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fill: C.textMut, fontSize: 10 }} angle={-20} textAnchor="end" height={36} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMut, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: C.textSec }} />
            {yKeys.map((k, i) => <Bar key={k} dataKey={k} fill={CHT[i % CHT.length]} radius={[2, 2, 0, 0]} maxBarSize={28} />)}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ─── Metric card ────────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 9, padding: '10px 13px', flex: '1 1 115px', minWidth: 105, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1.5px', background: `linear-gradient(90deg,${color || C.gold}90,transparent)` }} />
      <p style={{ margin: '3px 0 3px', fontSize: 9.5, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700, color: color || C.gold, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 10, color: C.textMut }}>{sub}</p>}
    </div>
  );
}

// ─── Strategy list ──────────────────────────────────────────────────────────────
function StrategyList({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <span style={{ minWidth: 18, height: 18, borderRadius: 5, background: 'rgba(245,158,11,0.12)', color: C.gold, fontSize: 9, fontWeight: 800, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
          <p style={{ margin: 0, fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Avatars ────────────────────────────────────────────────────────────────────
function AiAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px rgba(99,102,241,0.35)', color: '#fff' }}>
      <Ico.Cpu />
    </div>
  );
}

function UserAvatar({ initial }) {
  return (
    <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#a5b4fc' }}>
      {initial}
    </div>
  );
}

// ─── Message bubble ─────────────────────────────────────────────────────────────
function AiMessage({ msg, username }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 8, alignItems: 'flex-end' }}>
        <div style={{ maxWidth: '70%', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px 12px 2px 12px', padding: '9px 14px', fontSize: 13.5, color: '#dde4ff', lineHeight: 1.65, letterSpacing: '0.01em' }}>
          {msg.content}
        </div>
        <UserAvatar initial={(username || 'U')[0].toUpperCase()} />
      </div>
    );
  }

  const { text, metrics, chart, strategies, error } = msg.content || {};

  if (error) {
    return (
      <div style={{ display: 'flex', gap: 9, marginBottom: 10, alignItems: 'flex-start' }}>
        <AiAvatar />
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.16)', borderRadius: '2px 12px 12px 12px', padding: '9px 14px', fontSize: 13, color: '#fca5a5', lineHeight: 1.6, maxWidth: '80%', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <span style={{ color: C.red, marginTop: 1, flexShrink: 0 }}><Ico.ErrCircle /></span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 9, marginBottom: 20, alignItems: 'flex-start' }}>
      <AiAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        {metrics?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
          </div>
        )}
        {text && (
          <div style={{ background: 'rgba(255,255,255,0.022)', border: `1px solid ${C.border}`, borderRadius: '2px 12px 12px 12px', padding: '11px 15px', fontSize: 13.5, color: C.textSec, lineHeight: 1.8, whiteSpace: 'pre-wrap', letterSpacing: '0.01em' }}>
            {text}
          </div>
        )}
        <SmartChart chart={chart} />
        {strategies?.length > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 10, padding: '11px 14px', marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
              <span style={{ color: C.gold }}><Ico.Target /></span>
              <p style={{ margin: 0, fontSize: 9.5, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recommended Actions</p>
            </div>
            <StrategyList items={strategies} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 9, marginBottom: 10, alignItems: 'center' }}>
      <AiAvatar />
      <div style={{ display: 'flex', gap: 5, padding: '10px 14px', background: 'rgba(255,255,255,0.022)', border: `1px solid ${C.border}`, borderRadius: '2px 12px 12px 12px' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, display: 'inline-block', animation: 'aiPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar stat row ───────────────────────────────────────────────────────────
function StatRow({ icon, label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: color || C.textMut, flexShrink: 0, opacity: 0.8 }}>{icon}</span>
      <span style={{ fontSize: 11.5, color: C.textSec, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: color || C.textPri, letterSpacing: '-0.01em' }}>{value}</span>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function AiChat() {
  const { user }                = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [dashData, setDashData] = useState(null);
  const [sideOpen, setSideOpen] = useState(true);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);
  const API_URL                 = process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com';

  // Fetch dashboard stats for sidebar display
  // The actual AI context is injected server-side in views.py
  useEffect(() => {
    const token = sessionStorage.getItem('cc_token');
    fetch(`${API_URL}/api/dashboard/`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.ok ? r.json() : null).then(d => setDashData(d)).catch(() => {});
  }, [API_URL]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text.trim() }]);
    setInput('');
    setLoading(true);

    const history = messages.slice(-10).map(m => ({
      role:    m.role,
      content: m.role === 'user' ? m.content : JSON.stringify(m.content),
    }));

    try {
      const res    = await aiApi.queryInsight(text.trim(), history);
      const parsed = res.data?.result || res.data?.insight || { text: JSON.stringify(res.data) };
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: parsed }]);
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.message || 'Server error. Please try again.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: { error: errMsg } }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [messages, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isEmpty      = messages.length === 0;
  const totalVoters  = dashData?.totalVoters  || dashData?.total_voters  || 0;
  const totalSurveyed= dashData?.totalReg     || dashData?.total_surveys  || 0;
  const coverage     = dashData?.coveragePct  ?? dashData?.coverage_pct  ?? 0;
  const riskWards    = dashData?.risk_wards   ?? null;

  const wardEntries = dashData?.wardCoverage
    ? Object.entries(dashData.wardCoverage).sort((a, b) => a[1] - b[1]).slice(0, 7)
    : [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <style>{`
        @keyframes aiPulse { 0%,100%{opacity:.25;transform:scale(1)} 50%{opacity:1;transform:scale(1.25)} }
        @keyframes msgIn   { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .ai-msg  { animation: msgIn .18s ease forwards; }
        .ai-chip { transition: background .13s, border-color .13s, transform .13s; cursor:pointer; }
        .ai-chip:hover { background:rgba(99,102,241,0.09) !important; border-color:rgba(99,102,241,0.32) !important; transform:translateY(-1px); }
        .ai-scroll::-webkit-scrollbar { width:2px; }
        .ai-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.06); border-radius:2px; }
        .ai-send { transition:opacity .12s,transform .12s; }
        .ai-send:hover:not(:disabled) { opacity:.82; transform:scale(1.06); }
        .ai-tog  { transition:background .13s,color .13s; }
        .ai-tog:hover { background:rgba(255,255,255,0.04) !important; }
        .ai-clr  { transition:border-color .13s,color .13s; }
        .ai-clr:hover { border-color:rgba(239,68,68,0.4) !important; color:#fca5a5 !important; }
        textarea.ai-ta { resize:none; caret-color:${C.accent}; }
        textarea.ai-ta:focus { outline:none; }
        textarea.ai-ta::placeholder { color:${C.textMut}; }
      `}</style>

      {/*
        height: calc(100vh - 60px)
        Fills the area BELOW the existing navbar (~60px tall).
        Adjust 60 if your navbar height differs.
      */}
      <div style={{ display:'flex', height:'calc(100vh - 60px)', background:C.bg, fontFamily:"'Inter','SF Pro Text',-apple-system,sans-serif", color:C.textPri, overflow:'hidden' }}>

        {/* ══ SIDEBAR ═══════════════════════════════════════════════════════ */}
        <aside style={{
          width: sideOpen ? 218 : 0, minWidth: sideOpen ? 218 : 0,
          background: C.surface, borderRight: `1px solid ${C.border}`,
          transition: 'width .2s ease, min-width .2s ease',
          overflow: 'hidden', flexShrink: 0,
        }}>
          <div className="ai-scroll" style={{ opacity: sideOpen ? 1 : 0, transition: 'opacity .12s', padding: '20px 14px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>

            {/* Live stats */}
            <p style={{ margin: '0 0 10px', fontSize: 9, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Live Data</p>
            <StatRow icon={<Ico.Users />}    label="Total Voters" value={totalVoters.toLocaleString()}   color={C.blue}  />
            <StatRow icon={<Ico.Activity />} label="Surveyed"     value={totalSurveyed.toLocaleString()} color={C.green} />
            <StatRow icon={<Ico.Bar />}      label="Coverage"     value={`${coverage}%`}                 color={coverage < 30 ? C.red : coverage < 60 ? C.gold : C.green} />
            {riskWards !== null && (
              <StatRow icon={<Ico.Alert />} label="Risk Wards" value={String(riskWards)} color={C.red} />
            )}

            {/* Ward coverage bars */}
            {wardEntries.length > 0 && (
              <>
                <p style={{ margin: '20px 0 10px', fontSize: 9, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Lowest Coverage</p>
                {wardEntries.map(([ward, pct]) => (
                  <div key={ward} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 10.5, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{ward}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: pct < 30 ? C.red : pct < 60 ? C.gold : C.green, letterSpacing: '-0.01em' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <div style={{ height: '100%', borderRadius: 1, width: `${Math.min(pct, 100)}%`, background: pct < 30 ? C.red : pct < 60 ? C.gold : C.green, transition: 'width .5s ease' }} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Clear */}
            {messages.length > 0 && (
              <button className="ai-clr" onClick={() => setMessages([])}
                style={{ marginTop: 20, width: '100%', background: 'transparent', border: `1px solid rgba(239,68,68,0.18)`, borderRadius: 7, padding: '7px 10px', color: 'rgba(252,165,165,0.6)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ico.Trash /> Clear conversation
              </button>
            )}
          </div>
        </aside>

        {/* ══ MAIN CHAT ══════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header bar */}
          <header style={{ padding: '0 18px', height: 52, borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

            <button className="ai-tog" onClick={() => setSideOpen(o => !o)}
              style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: sideOpen ? C.accentSft : 'transparent', color: sideOpen ? C.accent : C.textMut, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ico.Menu />
            </button>

            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 4px 12px rgba(99,102,241,0.18)' }}>
              <Ico.Cpu />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.textPri, letterSpacing: '-0.01em' }}>Constituency Intelligence</span>
                <span style={{ fontSize: 9.5, color: C.textMut, background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 6px', letterSpacing: '0.05em', fontWeight: 600 }}>MNG · 175</span>
              </div>
              <p style={{ margin: 0, fontSize: 10.5, color: 'rgba(99,102,241,0.65)', letterSpacing: '0.01em' }}>
                Claude Sonnet · Backend-routed · Live MongoDB
              </p>
            </div>

            {/* Connection status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dashData ? C.green : C.textMut, display: 'inline-block', boxShadow: dashData ? `0 0 0 2px rgba(16,185,129,0.18)` : 'none' }} />
              <span style={{ fontSize: 11, color: dashData ? C.green : C.textMut, fontWeight: 500 }}>
                {dashData ? `${totalVoters.toLocaleString()} voters` : 'Connecting…'}
              </span>
            </div>

            {messages.length > 0 && !sideOpen && (
              <button className="ai-clr" onClick={() => setMessages([])}
                style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid rgba(239,68,68,0.18)`, background: 'transparent', color: 'rgba(252,165,165,0.6)', fontSize: 10.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Ico.Trash /> Clear
              </button>
            )}
          </header>

          {/* Messages */}
          <div className="ai-scroll" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 0' }}>

            {/* Empty / welcome state */}
            {isEmpty && (
              <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 20 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg,#4338ca,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff', boxShadow: '0 0 0 1px rgba(99,102,241,0.35), 0 8px 24px rgba(99,102,241,0.16)' }}>
                    <Ico.Cpu />
                  </div>
                  <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600, color: C.textPri, letterSpacing: '-0.02em' }}>
                    {greeting}, {user?.username?.split(' ')[0] || 'MLA'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: C.textSec, lineHeight: 1.65, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
                    Ask me anything about your constituency — voter trends, ward analysis, election strategy, or demographic insights.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(192px,1fr))', gap: 6 }}>
                  {CHIPS.map(({ Ic, label, q }, i) => (
                    <button key={i} className="ai-chip" onClick={() => sendMessage(q)}
                      style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 9, padding: '10px 12px', textAlign: 'left', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <span style={{ color: C.accent, marginTop: 2, flexShrink: 0 }}><Ic /></span>
                      <div>
                        <div style={{ fontSize: 9.5, color: C.textMut, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.45 }}>{q}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thread */}
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {messages.map(msg => (
                <div key={msg.id} className="ai-msg">
                  <AiMessage msg={msg} username={user?.username} />
                </div>
              ))}
              {loading && <TypingIndicator />}
            </div>

            <div ref={bottomRef} style={{ height: 20 }} />
          </div>

          {/* Input footer */}
          <footer style={{ padding: '12px 20px 16px', borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div
                style={{ display:'flex', gap:8, alignItems:'flex-end', background:C.surfaceUp, border:`1px solid ${C.border}`, borderRadius:11, padding:'8px 8px 8px 15px', transition:'border-color .15s' }}
                onFocusCapture={e => e.currentTarget.style.borderColor = C.borderFoc}
                onBlurCapture={e  => e.currentTarget.style.borderColor = C.border}
              >
                <textarea
                  ref={inputRef}
                  className="ai-ta"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about voter data, ward strategy, caste distribution, election trends…"
                  rows={1}
                  style={{ flex:1, background:'transparent', border:'none', color:C.textPri, fontSize:13.5, lineHeight:1.6, fontFamily:'inherit', maxHeight:100, overflowY:'auto', paddingTop:1, letterSpacing:'0.01em' }}
                  onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,100)+'px'; }}
                />
                <button
                  className="ai-send"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  style={{ width:32, height:32, borderRadius:7, border:'none', flexShrink:0, background: input.trim() && !loading ? C.accent : 'rgba(255,255,255,0.05)', color: input.trim() && !loading ? '#fff' : C.textMut, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: input.trim() && !loading ? '0 0 12px rgba(99,102,241,0.28)' : 'none' }}>
                  <Ico.Send />
                </button>
              </div>
              <p style={{ margin:'5px 0 0', fontSize:10, color:C.textMut, textAlign:'center', letterSpacing:'0.02em' }}>
                ↵ Enter · Shift+Enter for new line · All responses use live MongoDB + election data
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}