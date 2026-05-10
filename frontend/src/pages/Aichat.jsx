/**
 * AiChat.jsx — Redesigned AI Chat page
 * • ChatGPT-style layout: chat history in LEFT sidebar
 * • App navbar matching Constituency Connect design
 * • Brain icon animates from center → top-left on first message
 * • Dynamic loading dots with political vocabulary words
 * • Shorter, centered chat input box
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { aiChatApi } from '../api/client';
import { useAuth } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';

// ── colour palette ────────────────────────────────────────────────────────────
const PALETTE = [
  '#f59e0b', '#06b6d4', '#10b981', '#4f46e5',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const FILE_ICONS = {
  xlsx: '📊', xls: '📊', csv: '📋', pdf: '📄',
  docx: '📝', doc: '📝', txt: '📃',
};

const SUGGESTED = [
  'What is the total voter count by ward?',
  'Show religion-wise voter breakdown for all wards',
  'Which wards have the highest Muslim voter %?',
  'Give survey completion status ward-wise',
  'Which schemes have the most beneficiaries?',
  'Compare 2019 vs 2023 polling percentages',
  'Booth-wise voter count for ward 28?',
  'Top 10 wards by total voters as bar chart',
  'What are the strategic priority wards?',
];

// Political words for loading animation
const POLITICAL_WORDS = [
  'Analysing', 'Strategising', 'Computing', 'Mapping', 'Forecasting',
  'Calculating', 'Researching', 'Processing', 'Evaluating', 'Decoding',
];

// ── Nav items ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '⊞' },
  { label: 'Survey',    path: '/survey', icon: '◎' },
  { label: 'Schemes',   path: '/schemes', icon: '◇' },
  { label: 'Data',      path: '/data', icon: '▤' },
  { label: 'SIR',       path: '/sir', icon: '✓' },
  { label: 'SWOT',      path: '/swot', icon: '⊞', highlight: 'swot' },
  { label: 'AI',        path: '/ai', icon: null, highlight: 'ai' },
  { label: 'Admin',     path: '/admin', icon: '⚙' },
];

// ════════════════════════════════════════════════════════════════════════════════
// BRAIN SVG ICON
// ════════════════════════════════════════════════════════════════════════════════
function BrainIcon({ size = 48, color = '#f59e0b', glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={glow ? { filter: `drop-shadow(0 0 12px ${color})` } : {}}>
      <path d="M24 6C19 6 15 10 15 14.5C15 15.2 15.1 15.9 15.3 16.5C13.4 17.4 12 19.3 12 21.5C12 22.5 12.3 23.4 12.8 24.2C11.1 25.1 10 26.9 10 29C10 32.3 12.7 35 16 35C16.7 35 17.4 34.9 18 34.6V36C18 39.3 20.7 42 24 42C27.3 42 30 39.3 30 36V34.6C30.6 34.9 31.3 35 32 35C35.3 35 38 32.3 38 29C38 26.9 36.9 25.1 35.2 24.2C35.7 23.4 36 22.5 36 21.5C36 19.3 34.6 17.4 32.7 16.5C32.9 15.9 33 15.2 33 14.5C33 10 29 6 24 6Z"
        stroke={color} strokeWidth="2" fill="none"/>
      <path d="M24 14V28M18 18L24 22M30 18L24 22M20 30L24 28M28 30L24 28"
        stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="24" cy="22" r="2" fill={color} opacity="0.8"/>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// TOP NAVBAR
// ════════════════════════════════════════════════════════════════════════════════
function Navbar({ hasMessages }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <nav style={navStyles.root}>
      {/* Logo */}
      <div style={navStyles.logo} onClick={() => navigate('/')}>
        <div style={navStyles.logoIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="#f59e0b" strokeWidth="1.5"/>
            <path d="M12 7v10M7 9.5l5 2.5 5-2.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={navStyles.logoText}>Constituency</div>
          <div style={navStyles.logoSub}>CONNECT</div>
        </div>
      </div>

      {/* Nav links */}
      <div style={navStyles.links}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...navStyles.link,
                ...(item.highlight === 'swot' ? navStyles.swotLink : {}),
                ...(item.highlight === 'ai' ? navStyles.aiLink : {}),
                ...(active && item.highlight !== 'swot' && item.highlight !== 'ai'
                  ? navStyles.activeLink : {}),
              }}
            >
              {item.icon && <span style={{ fontSize: 12 }}>{item.icon}</span>}
              {item.label}
            </button>
          );
        })}
      </div>

      {/* User */}
      <div style={navStyles.userArea}>
        <div style={navStyles.avatar}>
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <div style={navStyles.userName}>{user?.username || 'User'}</div>
          <div style={navStyles.userRole}>{user?.role?.toUpperCase() || 'USER'}</div>
        </div>
        <button onClick={logout} style={navStyles.logoutBtn}>
          ⏻ Logout
        </button>
      </div>
    </nav>
  );
}

const navStyles = {
  root: {
    display: 'flex', alignItems: 'center', gap: 0,
    height: 52, flexShrink: 0,
    background: '#0d1117',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 20px',
    zIndex: 100,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: 'pointer', marginRight: 28, flexShrink: 0,
  },
  logoIcon: {
    width: 30, height: 30, borderRadius: 8,
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 13, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 },
  logoSub: { fontSize: 9, color: '#f59e0b', fontWeight: 700, letterSpacing: '0.12em', lineHeight: 1.4 },
  links: { display: 'flex', alignItems: 'center', gap: 2, flex: 1 },
  link: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'transparent', border: 'none',
    color: '#94a3b8', fontSize: 13, fontWeight: 500,
    padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
    transition: 'color 0.15s, background 0.15s',
    whiteSpace: 'nowrap',
  },
  activeLink: { color: '#e2e8f0', background: 'rgba(255,255,255,0.07)' },
  swotLink: {
    background: 'rgba(245,158,11,0.15)',
    border: '1px solid rgba(245,158,11,0.3)',
    color: '#f59e0b', fontWeight: 700,
  },
  aiLink: {
    background: 'rgba(6,182,212,0.12)',
    border: '1px solid rgba(6,182,212,0.3)',
    color: '#06b6d4', fontWeight: 700,
  },
  userArea: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  avatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userName: { color: '#e2e8f0', fontSize: 13, fontWeight: 600, lineHeight: 1 },
  userRole: { color: '#f59e0b', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1.6 },
  logoutBtn: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 6, padding: '5px 12px', color: '#f87171',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
};

// ════════════════════════════════════════════════════════════════════════════════
// TYPING INDICATOR with political words
// ════════════════════════════════════════════════════════════════════════════════
function TypingIndicator() {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setWordIdx(i => (i + 1) % POLITICAL_WORDS.length);
    }, 800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, padding: '0 20px' }}>
      <div style={chatStyles.aiAvatar}>
        <BrainIcon size={20} color="#06b6d4" />
      </div>
      <div style={{ ...chatStyles.aiBubble, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic', minWidth: 100 }}>
          {POLITICAL_WORDS[wordIdx]}…
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <span className="typing-dot" />
          <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
          <span className="typing-dot" style={{ animationDelay: '0.30s' }} />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MARKDOWN RENDERER
// ════════════════════════════════════════════════════════════════════════════════
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^### (.+)/.test(line)) {
      elements.push(<h3 key={i} style={mdStyles.h3}>{line.replace(/^### /, '')}</h3>);
    } else if (/^## (.+)/.test(line)) {
      elements.push(<h2 key={i} style={mdStyles.h2}>{line.replace(/^## /, '')}</h2>);
    } else if (/^# (.+)/.test(line)) {
      elements.push(<h1 key={i} style={mdStyles.h1}>{line.replace(/^# /, '')}</h1>);
    } else if (/^[\-\*] (.+)/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\-\*] (.+)/.test(lines[i])) {
        items.push(<li key={i} style={mdStyles.li}>{inlineFormat(lines[i].replace(/^[\-\*] /, ''))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={mdStyles.ul}>{items}</ul>);
      continue;
    } else if (/^\d+\. (.+)/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. (.+)/.test(lines[i])) {
        items.push(<li key={i} style={mdStyles.li}>{inlineFormat(lines[i].replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={mdStyles.ol}>{items}</ol>);
      continue;
    } else if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      elements.push(<pre key={i} style={mdStyles.pre}><code>{codeLines.join('\n')}</code></pre>);
    } else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={mdStyles.hr} />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
    } else {
      elements.push(<p key={i} style={mdStyles.p}>{inlineFormat(line)}</p>);
    }
    i++;
  }
  return elements;
}

function inlineFormat(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={idx} style={{ color: '#e2e8f0', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={idx} style={mdStyles.inlineCode}>{part.slice(1, -1)}</code>;
    return part;
  });
}

const mdStyles = {
  h1: { fontSize: 19, fontWeight: 800, color: '#e2e8f0', margin: '10px 0 5px', letterSpacing: '-0.02em' },
  h2: { fontSize: 16, fontWeight: 700, color: '#c7d2fe', margin: '8px 0 4px' },
  h3: { fontSize: 13, fontWeight: 700, color: '#06b6d4', margin: '7px 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  p: { margin: '3px 0', color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 },
  ul: { margin: '5px 0', paddingLeft: 18 },
  ol: { margin: '5px 0', paddingLeft: 18 },
  li: { color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 2 },
  pre: { background: 'rgba(15,23,42,0.9)', borderRadius: 8, padding: '10px 14px', overflowX: 'auto', margin: '8px 0', border: '1px solid rgba(51,65,85,0.6)', fontSize: 12, color: '#7dd3fc', fontFamily: 'monospace' },
  inlineCode: { background: 'rgba(6,182,212,0.15)', borderRadius: 4, padding: '1px 5px', color: '#67e8f9', fontSize: '0.9em', fontFamily: 'monospace' },
  hr: { border: 'none', borderTop: '1px solid rgba(51,65,85,0.6)', margin: '10px 0' },
};

// ════════════════════════════════════════════════════════════════════════════════
// CHART RENDERER
// ════════════════════════════════════════════════════════════════════════════════
function ChartRenderer({ spec }) {
  if (!spec) return null;
  const { type, title, labels = [], datasets = [] } = spec;
  const chartData = labels.map((label, i) => {
    const point = { name: label };
    datasets.forEach(ds => { point[ds.label] = ds.data[i] ?? 0; });
    return point;
  });
  const pieData = labels.map((label, i) => ({ name: label, value: (datasets[0]?.data ?? [])[i] ?? 0 }));
  const chartStyle = { background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: '16px 8px 8px', marginTop: 12, border: '1px solid rgba(245,158,11,0.15)' };
  const titleEl = <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>{title}</div>;
  const tooltipStyle = { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }, labelStyle: { color: '#94a3b8' } };

  if (type === 'pie' || type === 'doughnut') return (
    <div style={chartStyle}>{titleEl}
      <ResponsiveContainer width="100%" height={260}>
        <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={type === 'doughnut' ? 60 : 0} outerRadius={95} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent*100).toFixed(1)}%`} labelLine={{ stroke: '#475569' }}>
          {pieData.map((_, idx) => <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />)}
        </Pie><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} /></PieChart>
      </ResponsiveContainer>
    </div>
  );
  if (type === 'line') return (
    <div style={chartStyle}>{titleEl}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} /><YAxis tick={{ fill: '#64748b', fontSize: 11 }} /><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {datasets.map((ds, idx) => <Line key={idx} type="monotone" dataKey={ds.label} stroke={PALETTE[idx % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
  return (
    <div style={chartStyle}>{titleEl}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} barCategoryGap="30%"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} interval={chartData.length > 15 ? 2 : 0} angle={chartData.length > 10 ? -30 : 0} textAnchor={chartData.length > 10 ? 'end' : 'middle'} height={chartData.length > 10 ? 50 : 30} /><YAxis tick={{ fill: '#64748b', fontSize: 11 }} /><Tooltip {...tooltipStyle} /><Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {datasets.map((ds, idx) => <Bar key={idx} dataKey={ds.label} fill={PALETTE[idx % PALETTE.length]} stackId={type === 'stackedBar' ? 'stack' : undefined} radius={type !== 'stackedBar' ? [3,3,0,0] : undefined} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT BAR
// ════════════════════════════════════════════════════════════════════════════════
function ExportBar({ exportSpec }) {
  const [loading, setLoading] = useState(false);
  const download = async (fmt) => {
    setLoading(true);
    try {
      const spec = { ...exportSpec, format: fmt };
      const res = await aiChatApi.export(spec);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = spec.filename || `export.${fmt}`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + (e.userMessage || e.message)); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 10, background: 'rgba(15,23,42,0.6)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(245,158,11,0.2)', flexWrap: 'wrap', gap: 6 }}>
      <span style={{ color: '#94a3b8', fontSize: 12, marginRight: 8 }}>📦 Export:</span>
      {['csv', 'xlsx', 'pdf'].map(fmt => (
        <button key={fmt} disabled={loading} onClick={() => download(fmt)} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#0d1117', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}>
          {fmt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ════════════════════════════════════════════════════════════════════════════════
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 20, padding: '0 20px' }}>
      {!isUser && (
        <div style={chatStyles.aiAvatar}>
          <BrainIcon size={20} color="#06b6d4" />
        </div>
      )}
      <div style={{ maxWidth: '76%', minWidth: 60 }}>
        <div style={isUser ? chatStyles.userBubble : chatStyles.aiBubble}>
          {isUser
            ? <p style={{ margin: 0, color: '#fff', lineHeight: 1.6, fontSize: 14 }}>{msg.content}</p>
            : <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{renderMarkdown(msg.content)}</div>
          }
        </div>
        {msg.chartSpec && <ChartRenderer spec={msg.chartSpec} />}
        {msg.exportSpec && <ExportBar exportSpec={msg.exportSpec} />}
        {msg.filesUsed?.length > 0 && (
          <div style={{ color: '#475569', fontSize: 10, marginTop: 6, background: 'rgba(15,23,42,0.5)', borderRadius: 4, padding: '4px 8px' }}>
            📁 Sources: {msg.filesUsed.join(' · ')}
          </div>
        )}
        <div style={{ color: '#334155', fontSize: 10, marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>{msg.timestamp}</div>
      </div>
      {isUser && (
        <div style={{ ...chatStyles.aiAvatar, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', marginLeft: 10, marginRight: 0, border: 'none' }}>
          <span style={{ fontSize: 13 }}>👤</span>
        </div>
      )}
    </div>
  );
}

const chatStyles = {
  aiAvatar: {
    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
    background: 'rgba(6,182,212,0.1)',
    border: '1px solid rgba(6,182,212,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginRight: 10, alignSelf: 'flex-start', marginTop: 2,
  },
  userBubble: {
    background: 'linear-gradient(135deg,#4338ca,#4f46e5)',
    borderRadius: '16px 16px 4px 16px',
    padding: '12px 16px',
    boxShadow: '0 4px 20px rgba(79,70,229,0.3)',
  },
  aiBubble: {
    background: 'rgba(15,23,42,0.9)',
    border: '1px solid rgba(51,65,85,0.7)',
    borderRadius: '4px 16px 16px 16px',
    padding: '14px 18px',
  },
};

// ════════════════════════════════════════════════════════════════════════════════
// HISTORY SIDEBAR (LEFT)
// ════════════════════════════════════════════════════════════════════════════════
function HistorySidebar({ sessions, activeId, onSelect, onNew, open, onToggle }) {
  return (
    <div style={{
      width: open ? 240 : 0,
      flexShrink: 0,
      background: '#080d14',
      borderRight: open ? '1px solid rgba(255,255,255,0.06)' : 'none',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.25s ease',
    }}>
      {open && (
        <>
          {/* Sidebar header */}
          <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <BrainIcon size={18} color="#06b6d4" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4', letterSpacing: '0.04em' }}>ShaastrAI</span>
            </div>
            <button onClick={onNew} style={{
              width: '100%', padding: '8px 12px',
              background: 'rgba(6,182,212,0.08)', border: '1px dashed rgba(6,182,212,0.25)',
              borderRadius: 8, color: '#94a3b8', fontSize: 12,
              cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 16, color: '#06b6d4' }}>+</span> New conversation
            </button>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
            {sessions.length === 0 && (
              <div style={{ color: '#374151', fontSize: 12, padding: '20px 8px', textAlign: 'center' }}>
                No conversations yet
              </div>
            )}
            {sessions.map(s => (
              <button key={s.id} onClick={() => onSelect(s.id)} style={{
                width: '100%', textAlign: 'left', padding: '9px 10px',
                background: s.id === activeId ? 'rgba(6,182,212,0.1)' : 'transparent',
                border: s.id === activeId ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent',
                borderRadius: 7, marginBottom: 2, cursor: 'pointer',
                transition: 'background 0.15s',
              }}>
                <div style={{ color: s.id === activeId ? '#e2e8f0' : '#64748b', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </div>
                <div style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>{s.date}</div>
              </button>
            ))}
          </div>

          {/* Quick prompts */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 10px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', letterSpacing: '0.07em', marginBottom: 7 }}>QUICK PROMPTS</div>
            {SUGGESTED.slice(0, 4).map((s, i) => (
              <div key={i} style={{ color: '#4b5563', fontSize: 11, padding: '4px 6px', cursor: 'pointer', borderRadius: 5, marginBottom: 2, lineHeight: 1.4 }}
                onClick={() => onSelect('prompt:' + s)}>
                {s}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export default function AiChat() {
  const [sessions, setSessions]       = useState([]);
  const [activeId, setActiveId]       = useState(null);
  const [sessionMap, setSessionMap]   = useState({}); // id -> messages[]
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [includeData, setIncludeData] = useState(true);
  const [brainMoved, setBrainMoved]   = useState(false); // brain icon state

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const messages = activeId ? (sessionMap[activeId] || []) : [];

  // Move brain when first message sent
  useEffect(() => {
    if (messages.length > 0 && !brainMoved) setBrainMoved(true);
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const history = useMemo(() =>
    messages.map(m => ({ role: m.role, content: m.content })),
  [messages]);

  const createSession = useCallback((firstMsg) => {
    const id = 'sess_' + Date.now();
    const title = firstMsg.length > 36 ? firstMsg.slice(0, 36) + '…' : firstMsg;
    const date = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    const session = { id, title, date };
    setSessions(prev => [session, ...prev]);
    setActiveId(id);
    setSessionMap(prev => ({ ...prev, [id]: [] }));
    return id;
  }, []);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    let sid = activeId;
    if (!sid) { sid = createSession(msg); }

    const userMsg = {
      id: Date.now(), role: 'user', content: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSessionMap(prev => ({ ...prev, [sid]: [...(prev[sid] || []), userMsg] }));
    setLoading(true);

    try {
      const { data } = await aiChatApi.send(msg, history, includeData);
      const aiMsg = {
        id: Date.now() + 1, role: 'assistant',
        content: data.reply || '',
        chartSpec: data.chartSpec || null,
        exportSpec: data.exportSpec || null,
        filesUsed: data.filesUsed || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessionMap(prev => ({ ...prev, [sid]: [...(prev[sid] || []), aiMsg] }));
    } catch (e) {
      const errMsg = {
        id: Date.now() + 1, role: 'assistant',
        content: `⚠️ **Error:** ${e.userMessage || e.message || 'Something went wrong.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessionMap(prev => ({ ...prev, [sid]: [...(prev[sid] || []), errMsg] }));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, history, includeData, activeId, createSession]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleSidebarSelect = (id) => {
    if (id.startsWith('prompt:')) {
      send(id.replace('prompt:', ''));
    } else {
      setActiveId(id);
    }
  };

  const handleNew = () => {
    setActiveId(null);
    setBrainMoved(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const hasMessages = messages.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d1117', fontFamily: "'DM Sans', 'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <Navbar hasMessages={hasMessages} />

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR: Chat History ── */}
        <HistorySidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={handleSidebarSelect}
          onNew={handleNew}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(p => !p)}
        />

        {/* ── MAIN CHAT AREA ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Sidebar toggle tab */}
          <button onClick={() => setSidebarOpen(p => !p)} style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: 18, height: 48,
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
            borderLeft: 'none', borderRadius: '0 6px 6px 0',
            color: '#06b6d4', cursor: 'pointer', fontSize: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {sidebarOpen ? '‹' : '›'}
          </button>

          {/* ── EMPTY STATE: Brain in center ── */}
          {!hasMessages && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
              {/* Animated brain */}
              <div style={{ marginBottom: 28, animation: 'brainPulse 2.5s ease-in-out infinite' }}>
                <BrainIcon size={72} color="#06b6d4" glow />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', letterSpacing: '0.18em', marginBottom: 10 }}>SHAASTR AI</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
                Constituency Intelligence
              </h2>
              <p style={{ color: '#4b5563', fontSize: 14, maxWidth: 480, lineHeight: 1.8, marginBottom: 32 }}>
                Ask anything about voters, wards, booth data, schemes, demographics, or election strategy.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 8, maxWidth: 680, width: '100%' }}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} onClick={() => send(s)} style={{
                    background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)',
                    borderRadius: 8, padding: '10px 13px', color: '#64748b',
                    fontSize: 12, cursor: 'pointer', textAlign: 'left', lineHeight: 1.5,
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.15)'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(6,182,212,0.05)'; }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {hasMessages && (
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: 20, scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
              {/* Brain logo top-left when chat active */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: 16 }}>
                <BrainIcon size={22} color="#06b6d4" glow />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4', letterSpacing: '0.1em' }}>SHAASTR AI</span>
                <div style={{ flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={includeData} onChange={e => setIncludeData(e.target.checked)} style={{ accentColor: '#06b6d4', width: 13, height: 13 }} />
                  <span style={{ color: '#4b5563', fontSize: 11 }}>Use data files</span>
                </label>
                <button onClick={handleNew} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', color: '#4b5563', fontSize: 11, cursor: 'pointer' }}>
                  + New
                </button>
              </div>

              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} style={{ height: 20 }} />
            </div>
          )}

          {/* ── INPUT BAR (shorter, centered) ── */}
          <div style={{ flexShrink: 0, padding: '12px 20px 16px', background: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {!hasMessages && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', justifyContent: 'center', marginBottom: 8 }}>
                <input type="checkbox" checked={includeData} onChange={e => setIncludeData(e.target.checked)} style={{ accentColor: '#06b6d4', width: 13, height: 13 }} />
                <span style={{ color: '#4b5563', fontSize: 11 }}>Include constituency data files</span>
              </label>
            )}
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about voters, wards, schemes, strategy…"
                disabled={loading}
                rows={1}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12,
                  padding: '10px 14px', color: '#e2e8f0', fontSize: 14, lineHeight: 1.5,
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  minHeight: 42, maxHeight: 120,
                  scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(6,182,212,0.5)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(6,182,212,0.2)'; }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  width: 42, height: 42, flexShrink: 0,
                  background: loading || !input.trim() ? 'rgba(6,182,212,0.15)' : 'linear-gradient(135deg,#06b6d4,#0891b2)',
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 17, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: loading || !input.trim() ? 'none' : '0 4px 15px rgba(6,182,212,0.35)',
                  transition: 'all 0.2s',
                  opacity: loading || !input.trim() ? 0.4 : 1,
                }}
              >
                {loading ? '⏳' : '➤'}
              </button>
            </div>
            <div style={{ color: '#1e293b', fontSize: 11, marginTop: 6, textAlign: 'center' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontFamily: 'monospace', color: '#374151' }}>Enter</kbd> to send ·{' '}
              <kbd style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontFamily: 'monospace', color: '#374151' }}>Shift+Enter</kbd> for new line
            </div>
          </div>
        </div>
      </div>

      {/* ── GLOBAL CSS ── */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes brainPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        .typing-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #06b6d4; display: inline-block;
          animation: bounce 1.2s infinite;
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
      `}</style>
    </div>
  );
}