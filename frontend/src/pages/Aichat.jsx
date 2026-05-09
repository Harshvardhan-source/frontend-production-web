/**
 * AiChat.jsx
 *
 * ALL AI calls go through the Django backend:
 *   POST /api/ai/query-insight/
 *
 * The backend (_get_chat_db_stats + _load_chat_data_context) injects:
 *   • Live MongoDB data  (2025 voter roll, SurveyRecords, SIR collections)
 *   • All Excel/CSV files in backend/data/ folder
 *     (2023p.xlsx, 2025 voter list.xlsx, Caste_Voter_Turnout_Report.xlsx,
 *      Mangaluru_Election_Strategy_Report.xlsx, Mangaluru_FULLSCALE_Analysis_v2.xlsx,
 *      NEW_2002.xlsx, nonpolled-hmc-caste-updated-2023.xlsx,
 *      polled-hmc-caste-updated-2023.xlsx)
 *
 * The frontend NEVER calls api.anthropic.com directly.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { aiApi } from '../api/client';

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:        '#080b14',
  surface:   '#0e1220',
  surfaceUp: '#131829',
  border:    'rgba(255,255,255,0.07)',
  accent:    '#6366f1',
  accentSft: 'rgba(99,102,241,0.12)',
  gold:      '#f59e0b',
  green:     '#10b981',
  red:       '#ef4444',
  blue:      '#3b82f6',
  pink:      '#ec4899',
  textPri:   '#f1f5f9',
  textSec:   '#94a3b8',
  textMut:   '#475569',
};
const CHT = [C.gold, C.green, C.accent, C.red, C.blue, C.pink, '#14b8a6', '#f97316'];

// SVG icon components for professional UI
const Icon = {
  Turnout: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Caste: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Coverage: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
    </svg>
  ),
  Strategy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Families: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Swing: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  Menu: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Brain: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.66z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.66z"/>
    </svg>
  ),
  Signal: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>
    </svg>
  ),
  Warning: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Target: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Map: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  ),
};

const CHIPS = [
  { Icon: Icon.Turnout,  label: 'Turnout',   q: 'Which wards have the lowest voter turnout and what is driving it?' },
  { Icon: Icon.Caste,    label: 'Caste',     q: 'Show me caste-wise voter distribution across all wards' },
  { Icon: Icon.Coverage, label: 'Coverage',  q: 'What is the survey coverage gap and which booths need priority?' },
  { Icon: Icon.Strategy, label: 'Strategy',  q: 'Give me a winning strategy for the top 5 risk wards' },
  { Icon: Icon.Families, label: 'Families',  q: 'Analyse large family households and their political significance' },
  { Icon: Icon.Swing,    label: 'Swing',     q: 'Predict swing wards based on current survey data trends' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SmartChart({ chart }) {
  if (!chart?.data?.length) return null;
  const { type, data, xKey, yKeys, title } = chart;
  const tt = {
    background: '#1a2035',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 8, color: C.textPri, fontSize: 12,
  };
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', marginTop: 10 }}>
      {title && <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{title}</p>}
      <ResponsiveContainer width="100%" height={195}>
        {type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey={yKeys[0]} nameKey={xKey} cx="50%" cy="50%" outerRadius={72} innerRadius={28} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {data.map((_, i) => <Cell key={i} fill={CHT[i % CHT.length]} />)}
            </Pie>
            <Tooltip contentStyle={tt} />
          </PieChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={xKey} tick={{ fill: C.textMut, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMut, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} />
            <Legend wrapperStyle={{ fontSize: 11, color: C.textSec }} />
            {yKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={CHT[i % CHT.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
          </LineChart>
        ) : (
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fill: C.textMut, fontSize: 10 }} angle={-25} textAnchor="end" height={38} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.textMut, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: C.textSec }} />
            {yKeys.map((k, i) => <Bar key={k} dataKey={k} fill={CHT[i % CHT.length]} radius={[3, 3, 0, 0]} maxBarSize={30} />)}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', flex: '1 1 120px', minWidth: 110, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color || C.gold},transparent)` }} />
      <p style={{ margin: '3px 0 2px', fontSize: 10, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
      <p style={{ margin: '0 0 2px', fontSize: 19, fontWeight: 700, color: color || C.gold, lineHeight: 1.2 }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 10.5, color: C.textMut }}>{sub}</p>}
    </div>
  );
}

function StrategyList({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <span style={{ minWidth: 19, height: 19, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', color: C.gold, fontSize: 9.5, fontWeight: 800, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
          <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.65 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

function AiAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 10px rgba(99,102,241,0.3)' }}>
      <Icon.Brain />
    </div>
  );
}

function AiMessage({ msg, username }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 7, alignItems: 'flex-end' }}>
        <div style={{ maxWidth: '72%', background: 'linear-gradient(135deg,rgba(99,102,241,0.22),rgba(139,92,246,0.17))', border: '1px solid rgba(99,102,241,0.28)', borderRadius: '15px 15px 3px 15px', padding: '9px 14px', fontSize: 13.5, color: '#e0e7ff', lineHeight: 1.65 }}>
          {msg.content}
        </div>
        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#a5b4fc' }}>
          {(username || 'U')[0].toUpperCase()}
        </div>
      </div>
    );
  }

  const { text, metrics, chart, strategies, error } = msg.content || {};

  if (error) {
    return (
      <div style={{ display: 'flex', gap: 9, marginBottom: 12, alignItems: 'flex-start' }}>
        <AiAvatar />
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '3px 15px 15px 15px', padding: '9px 14px', fontSize: 13, color: '#fca5a5', lineHeight: 1.6, maxWidth: '80%', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <span style={{ color: '#fca5a5', flexShrink: 0, marginTop: 2 }}><Icon.AlertCircle /></span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 9, marginBottom: 18, alignItems: 'flex-start' }}>
      <AiAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        {metrics?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
            {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
          </div>
        )}
        {text && (
          <div style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: '3px 15px 15px 15px', padding: '11px 15px', fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {text}
          </div>
        )}
        <SmartChart chart={chart} />
        {strategies?.length > 0 && (
          <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.14)', borderRadius: 11, padding: '11px 15px', marginTop: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
              <span style={{ color: C.gold }}><Icon.Target /></span>
              <p style={{ margin: 0, fontSize: 9.5, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Recommended Strategies</p>
            </div>
            <StrategyList items={strategies} />
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 9, marginBottom: 12, alignItems: 'center' }}>
      <AiAvatar />
      <div style={{ display: 'flex', gap: 4, padding: '9px 14px', background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: '3px 15px 15px 15px' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, display: 'inline-block', animation: 'aiPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
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

  // ── Load dashboard stats for sidebar display only (not for AI context)
  // The AI context is injected server-side by _get_chat_db_stats() in views.py
  useEffect(() => {
    const token = sessionStorage.getItem('cc_token');
    fetch(`${API_URL}/api/dashboard/`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setDashData(d))
      .catch(() => {});
  }, [API_URL]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Send message ─────────────────────────────────────────────────────────────
  // Routes through: frontend → Django /api/ai/query-insight/ → Anthropic
  // Django injects: MongoDB live data + 8 Excel/CSV files from backend/data/
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
      // ✅ BACKEND CALL — no direct Anthropic call from frontend
      const res    = await aiApi.queryInsight(text.trim(), history);
      const parsed = res.data?.result || res.data?.insight || { text: JSON.stringify(res.data) };
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: parsed }]);
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.message || 'Something went wrong. Check server logs.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: { error: errMsg } }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [messages, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isEmpty = messages.length === 0;

  // Sidebar display stats (just for UI, actual AI uses server-side data)
  const liveStats = dashData ? [
    { label: 'Total Voters', value: (dashData.totalVoters  || dashData.total_voters  || 0).toLocaleString(), color: C.blue  },
    { label: 'Surveyed',     value: (dashData.totalReg     || dashData.total_surveys  || 0).toLocaleString(), color: C.green },
    { label: 'Coverage',     value: `${dashData.coveragePct ?? dashData.coverage_pct ?? 0}%`,                 color: C.gold  },
    { label: 'Risk Wards',   value: String(dashData.risk_wards ?? '—'),                                       color: C.red   },
  ] : [];

  const wardEntries = dashData?.wardCoverage
    ? Object.entries(dashData.wardCoverage).sort((a, b) => a[1] - b[1]).slice(0, 8)
    : [];

  // Data files loaded in backend
  const DATA_FILES = [
    '2023p.xlsx', '2025 voter list.xlsx', 'Caste_Voter_Turnout_Report.xlsx',
    'Mangaluru_Election_Strategy_Report.xlsx', 'Mangaluru_FULLSCALE_Analysis_v2.xlsx',
    'NEW_2002.xlsx', 'nonpolled-hmc-caste-updated-2023.xlsx', 'polled-hmc-caste-updated-2023.xlsx',
  ];

  return (
    <>
      <style>{`
        @keyframes aiPulse {
          0%,100% { transform:translateY(0); opacity:.35; }
          50%      { transform:translateY(-4px); opacity:1; }
        }
        @keyframes msgIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .ai-msg  { animation: msgIn 0.2s ease forwards; }
        .ai-chip { transition: all .15s ease; cursor: pointer; }
        .ai-chip:hover {
          background: rgba(99,102,241,0.14) !important;
          border-color: rgba(99,102,241,0.38) !important;
          transform: translateY(-1px);
        }
        .ai-scroll::-webkit-scrollbar { width: 3px; }
        .ai-scroll::-webkit-scrollbar-track { background: transparent; }
        .ai-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }
        .ai-send { transition: all .14s ease; }
        .ai-send:hover:not(:disabled) { filter: brightness(1.15); transform: scale(1.06); }
        .ai-tog  { transition: background .15s ease; }
        .ai-tog:hover { background: rgba(99,102,241,0.1) !important; }
        textarea.ai-ta { resize: none; }
        textarea.ai-ta:focus { outline: none; }
      `}</style>

      {/*
        ╔══════════════════════════════════════════════════════╗
        ║  height: calc(100vh - 60px)                         ║
        ║  Fills the area BELOW your existing navbar (60px).  ║
        ║  Change 60 to match your actual navbar height.      ║
        ╚══════════════════════════════════════════════════════╝
      */}
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: C.bg, fontFamily: "'DM Sans','SF Pro Display',-apple-system,sans-serif", color: C.textPri, overflow: 'hidden' }}>

        {/* ══ SIDEBAR ═══════════════════════════════════════════════════ */}
        <aside style={{
          width: sideOpen ? 224 : 0, minWidth: sideOpen ? 224 : 0,
          background: C.surface, borderRight: `1px solid ${C.border}`,
          transition: 'width .22s ease, min-width .22s ease',
          overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column',
        }}>
          <div className="ai-scroll" style={{ opacity: sideOpen ? 1 : 0, transition: 'opacity .15s ease', padding: '16px 13px', flex: 1, overflowY: 'auto' }}>

            {/* Live stats */}
            <p style={{ margin: '0 0 9px', fontSize: 9.5, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: C.green }}><Icon.Signal /></span> Live MongoDB</p>
            {liveStats.length > 0 ? liveStats.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < liveStats.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontSize: 11.5, color: C.textSec }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            )) : (
              <p style={{ fontSize: 11, color: C.textMut, margin: '4px 0 0' }}>Connecting…</p>
            )}

            {/* Ward progress bars */}
            {wardEntries.length > 0 && (
              <>
                <p style={{ margin: '16px 0 9px', fontSize: 9.5, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: C.gold }}><Icon.Warning /></span> Lowest Coverage</p>
                {wardEntries.map(([ward, pct]) => (
                  <div key={ward} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 10.5, color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{ward}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: pct < 30 ? C.red : pct < 60 ? C.gold : C.green }}>{pct}%</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(pct, 100)}%`, background: pct < 30 ? C.red : pct < 60 ? C.gold : C.green, transition: 'width .5s ease' }} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Clear button */}
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} style={{ marginTop: 16, width: '100%', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '7px', color: '#fca5a5', fontSize: 11.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon.Trash /> Clear chat
              </button>
            )}
          </div>
        </aside>

        {/* ══ MAIN CHAT ══════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <header style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button className="ai-tog" onClick={() => setSideOpen(o => !o)} style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: sideOpen ? C.accentSft : 'transparent', color: sideOpen ? C.accent : C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Toggle data panel">
              <Icon.Menu />
            </button>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 0 12px rgba(99,102,241,0.28)' }}>
              <Icon.Map />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: C.textPri }}>Constituency AI</span>
                <span style={{ fontSize: 10, color: C.textMut, background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 5px' }}>Mangalore South 175</span>
              </div>
              <p style={{ margin: 0, fontSize: 10.5, color: '#7c78e8' }}>
                Claude · Backend-routed · MongoDB + {DATA_FILES.length} data files
              </p>
            </div>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dashData ? C.green : C.textMut, display: 'inline-block', boxShadow: dashData ? `0 0 6px ${C.green}` : 'none' }} />
              <span style={{ fontSize: 11, color: dashData ? C.green : C.textMut, fontWeight: 500 }}>
                {dashData ? `${(dashData.totalVoters || dashData.total_voters || 0).toLocaleString()} voters` : 'Connecting…'}
              </span>
            </div>
            {messages.length > 0 && !sideOpen && (
              <button onClick={() => setMessages([])} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.05)', color: '#fca5a5', fontSize: 10.5, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}><Icon.Trash /> Clear</button>
            )}
          </header>

          {/* Messages */}
          <div className="ai-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 0' }}>

            {isEmpty && (
              <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
                <div style={{ width: 58, height: 58, borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 14px', boxShadow: '0 0 28px rgba(99,102,241,0.22)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                  </svg>
                </div>
                <h2 style={{ margin: '0 0 5px', fontSize: 18, fontWeight: 700, color: C.textPri }}>Hello, {user?.username?.split(' ')[0] || 'MLA'}</h2>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: C.textSec, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                  Ask me anything about your constituency.
                </p>
                <p style={{ margin: '0 0 24px', fontSize: 11, color: C.textMut }}>
                  Powered by MongoDB live data + {DATA_FILES.length} Excel files from <code style={{ background: C.surfaceUp, padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>backend/data/</code>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(205px,1fr))', gap: 7, maxWidth: 640, margin: '0 auto' }}>
                  {CHIPS.map((p, i) => (
                    <button key={i} className="ai-chip" onClick={() => sendMessage(p.q)} style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 12px', color: C.textSec, fontSize: 12, textAlign: 'left', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, marginTop: 1, color: C.accent }}><p.Icon /></span>
                      <div>
                        <div style={{ fontSize: 9.5, color: C.textMut, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{p.label}</div>
                        <div style={{ lineHeight: 1.4 }}>{p.q}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className="ai-msg">
                <AiMessage msg={msg} username={user?.username} />
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} style={{ height: 18 }} />
          </div>

          {/* Input */}
          <footer style={{ padding: '11px 18px 14px', borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
            <div
              style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 13, padding: '7px 7px 7px 15px', transition: 'border-color .18s' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.48)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = C.border}
            >
              <textarea
                ref={inputRef}
                className="ai-ta"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about voter data, ward strategies, caste analysis…"
                rows={1}
                style={{ flex: 1, background: 'transparent', border: 'none', color: C.textPri, fontSize: 13.5, lineHeight: 1.6, fontFamily: 'inherit', maxHeight: 105, overflowY: 'auto', paddingTop: 2 }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 105) + 'px'; }}
              />
              <button
                className="ai-send"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 33, height: 33, borderRadius: 8, border: 'none', flexShrink: 0,
                  background: input.trim() && !loading ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)',
                  color: input.trim() && !loading ? '#fff' : C.textMut,
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  boxShadow: input.trim() && !loading ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                <Icon.Send />
              </button>
            </div>
            <p style={{ margin: '5px 0 0', fontSize: 10, color: C.textMut, textAlign: 'center' }}>
              Routed through backend · MongoDB + data files context ·&nbsp;
              <kbd style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 3, padding: '0 3px', fontSize: 9.5 }}>Enter</kbd> send &nbsp;
              <kbd style={{ background: C.surfaceUp, border: `1px solid ${C.border}`, borderRadius: 3, padding: '0 3px', fontSize: 9.5 }}>Shift+Enter</kbd> newline
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}