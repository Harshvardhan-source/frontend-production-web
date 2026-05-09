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
import Navbar from '../components/Navbar';
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
      <Navbar />
      <style>{`
        @keyframes aiPulse {
          0%,100% { transform:translateY(0); opacity:.35; }
          50%      { transform:translateY(-4px); opacity:1; }
        }
        @keyframes msgIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes logoGlow {
          0%,100% { box-shadow: 0 0 24px rgba(99,102,241,0.25); }
          50%      { box-shadow: 0 0 44px rgba(99,102,241,0.5); }
        }
        .ai-msg  { animation: msgIn 0.22s ease forwards; }
        .ai-chip {
          transition: all .18s ease; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07) !important;
          background: rgba(255,255,255,0.03) !important;
        }
        .ai-chip:hover {
          background: rgba(99,102,241,0.1) !important;
          border-color: rgba(99,102,241,0.35) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.12) !important;
        }
        .ai-scroll::-webkit-scrollbar { width: 3px; }
        .ai-scroll::-webkit-scrollbar-track { background: transparent; }
        .ai-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .ai-send { transition: all .14s ease; }
        .ai-send:hover:not(:disabled) { filter: brightness(1.18); transform: scale(1.06); }
        textarea.ai-ta { resize: none; }
        textarea.ai-ta:focus { outline: none; }
        .shaastra-landing { animation: fadeUp 0.45s ease forwards; }
        .shaastra-title { animation: fadeUp 0.45s 0.08s ease both; }
        .shaastra-chips  { animation: fadeUp 0.45s 0.18s ease both; }
        .shaastra-input-wrap:focus-within .shaastra-input-inner {
          border-color: rgba(99,102,241,0.5) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }
        .clear-btn { transition: all .14s; }
        .clear-btn:hover { background: rgba(239,68,68,0.12) !important; border-color: rgba(239,68,68,0.35) !important; }
      `}</style>

      {/* ── Full page container — sits below app navbar (60px) ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 54px)',
        marginTop: 54,
        background: C.bg,
        fontFamily: "'DM Sans','SF Pro Display',-apple-system,sans-serif",
        color: C.textPri,
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Subtle radial glow background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }} />

        {/* ══ MESSAGES AREA ═════════════════════════════════════════════ */}
        <div className="ai-scroll" style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>

          {isEmpty ? (
            /* ── LANDING STATE — ChatGPT style ── */
            <div className="shaastra-landing" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: '100%',
              padding: '40px 24px 24px', textAlign: 'center',
            }}>

              {/* Logo mark */}
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', marginBottom: 12,
                animation: 'logoGlow 3s ease-in-out infinite',
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.66z"/>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.66z"/>
                </svg>
              </div>

              {/* ShaastraAI wordmark */}
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#a5b4fc', letterSpacing: '-0.3px' }}>Shaastra</span>
                <span style={{
                  fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>AI</span>
              </div>

              {/* Headline */}
              <div className="shaastra-title">
                <h1 style={{
                  margin: '0 0 10px',
                  fontSize: 28, fontWeight: 700,
                  color: C.textPri,
                  letterSpacing: '-0.5px',
                }}>
                  Where should we begin?
                </h1>
                <p style={{
                  margin: '0 0 36px',
                  fontSize: 13.5, color: C.textSec,
                  lineHeight: 1.6, maxWidth: 380,
                }}>
                  Ask <strong style={{ color: '#a5b4fc' }}>ShaastraAI</strong> anything about your constituency — ward strategies, caste analysis, turnout patterns, or survey coverage.
                </p>
              </div>

              {/* Suggestion chips — 2×3 grid */}
              <div className="shaastra-chips" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 10, maxWidth: 680, width: '100%',
              }}>
                {CHIPS.map((p, i) => (
                  <button
                    key={i}
                    className="ai-chip"
                    onClick={() => sendMessage(p.q)}
                    style={{
                      borderRadius: 12, padding: '12px 14px',
                      color: C.textSec, fontSize: 12.5,
                      textAlign: 'left', display: 'flex',
                      gap: 10, alignItems: 'flex-start',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ flexShrink: 0, marginTop: 1, color: C.accent, opacity: 0.85 }}><p.Icon /></span>
                    <div>
                      <div style={{ fontSize: 9, color: C.textMut, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{p.label}</div>
                      <div style={{ lineHeight: 1.45, color: C.textSec }}>{p.q}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── MESSAGES ── */
            <div style={{ padding: '20px 28px 0', maxWidth: 780, margin: '0 auto', width: '100%' }}>
              {messages.map(msg => (
                <div key={msg.id} className="ai-msg">
                  <AiMessage msg={msg} username={user?.username} />
                </div>
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} style={{ height: 20 }} />
            </div>
          )}
        </div>

        {/* ══ INPUT BAR ═════════════════════════════════════════════════ */}
        <div className="shaastra-input-wrap" style={{
          padding: '12px 24px 16px',
          background: C.bg,
          borderTop: isEmpty ? 'none' : `1px solid ${C.border}`,
          position: 'relative', zIndex: 1, flexShrink: 0,
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
            <div
              className="shaastra-input-inner"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 999,
                padding: '10px 10px 10px 20px',
                transition: 'border-color .18s, box-shadow .18s',
              }}
            >
              <textarea
                ref={inputRef}
                className="ai-ta"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything…"
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: C.textPri, fontSize: 14, lineHeight: 1.5,
                  fontFamily: 'inherit', maxHeight: 90, overflowY: 'auto',
                  paddingTop: 1,
                }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px'; }}
              />

              {/* Clear button — only when there are messages */}
              {messages.length > 0 && (
                <button
                  className="clear-btn"
                  onClick={() => setMessages([])}
                  style={{
                    padding: '5px 10px', borderRadius: 20,
                    border: '1px solid rgba(239,68,68,0.18)',
                    background: 'rgba(239,68,68,0.05)',
                    color: '#fca5a5', fontSize: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  <Icon.Trash /> Clear
                </button>
              )}

              {/* Send button */}
              <button
                className="ai-send"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : 'rgba(255,255,255,0.06)',
                  color: input.trim() && !loading ? '#fff' : C.textMut,
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: input.trim() && !loading ? '0 0 14px rgba(99,102,241,0.35)' : 'none',
                  transition: 'all .14s',
                }}
              >
                <Icon.Send />
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}