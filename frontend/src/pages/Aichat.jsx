/**
 * AiChat.jsx — AI Chat page for Mangaluru South Constituency Intelligence
 * Updated:
 *  • Uses shared <Navbar /> component (same as other pages)
 *  • Removed right-side sidebar (no data sources / quick prompts panel)
 *  • Narrower, rounded chat input box
 *  • Enhanced AI "thinking" animation while loading
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
import Navbar from '../components/Navbar';

// ── colour palette ────────────────────────────────────────────────────────────
const PALETTE = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const SUGGESTED = [
  'What is the total voter count by ward?',
  'Show me religion-wise voter breakdown for all wards',
  'Which wards have the highest Muslim voter percentage?',
  'Give me a survey completion status ward-wise',
  'Which schemes have the most beneficiaries?',
  'Compare 2019 vs 2023 polling percentages',
  'What is the booth-wise voter count for ward 28?',
  'List top 10 wards by total voters as a bar chart',
  'Export ward-wise voter data as CSV',
  'What are the strategic priority wards to focus on?',
];

// ════════════════════════════════════════════════════════════════════════════════
// MARKDOWN-LITE RENDERER
// ════════════════════════════════════════════════════════════════════════════════
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^### (.+)/.test(line)) {
      elements.push(<h3 key={i} style={styles.h3}>{line.replace(/^### /, '')}</h3>);
    } else if (/^## (.+)/.test(line)) {
      elements.push(<h2 key={i} style={styles.h2}>{line.replace(/^## /, '')}</h2>);
    } else if (/^# (.+)/.test(line)) {
      elements.push(<h1 key={i} style={styles.h1}>{line.replace(/^# /, '')}</h1>);
    } else if (/^[\-\*] (.+)/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\-\*] (.+)/.test(lines[i])) {
        items.push(<li key={i} style={styles.li}>{inlineFormat(lines[i].replace(/^[\-\*] /, ''))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={styles.ul}>{items}</ul>);
      continue;
    } else if (/^\d+\. (.+)/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. (.+)/.test(lines[i])) {
        items.push(<li key={i} style={styles.li}>{inlineFormat(lines[i].replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={styles.ol}>{items}</ol>);
      continue;
    } else if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={styles.pre}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={styles.hr} />);
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      elements.push(<p key={i} style={styles.p}>{inlineFormat(line)}</p>);
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
      return <code key={idx} style={styles.inlineCode}>{part.slice(1, -1)}</code>;
    return part;
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// CHART RENDERER
// ════════════════════════════════════════════════════════════════════════════════
function ChartRenderer({ spec }) {
  if (!spec) return null;
  const { type, title, labels = [], datasets = [] } = spec;

  const chartData = labels.map((label, i) => {
    const point = { name: label };
    datasets.forEach((ds) => { point[ds.label] = ds.data[i] ?? 0; });
    return point;
  });

  const pieData = labels.map((label, i) => ({
    name: label, value: (datasets[0]?.data ?? [])[i] ?? 0,
  }));

  const chartStyle = {
    background: 'rgba(30,41,59,0.6)', borderRadius: 12,
    padding: '16px 8px 8px', marginTop: 16,
    border: '1px solid rgba(99,102,241,0.25)',
  };

  const titleEl = (
    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
      {title}
    </div>
  );

  const tooltipStyle = {
    contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' },
    labelStyle: { color: '#94a3b8' },
  };

  if (type === 'pie' || type === 'doughnut') {
    return (
      <div style={chartStyle}>
        {titleEl}
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name"
              cx="50%" cy="50%"
              innerRadius={type === 'doughnut' ? 60 : 0} outerRadius={100} paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              labelLine={{ stroke: '#475569' }}>
              {pieData.map((_, idx) => <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'radar') {
    return (
      <div style={chartStyle}>
        {titleEl}
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            {datasets.map((ds, idx) => (
              <Radar key={idx} name={ds.label} dataKey={ds.label}
                stroke={PALETTE[idx % PALETTE.length]}
                fill={PALETTE[idx % PALETTE.length]} fillOpacity={0.2} />
            ))}
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Tooltip {...tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div style={chartStyle}>
        {titleEl}
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            {datasets.map((ds, idx) => (
              <Line key={idx} type="monotone" dataKey={ds.label}
                stroke={PALETTE[idx % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={chartStyle}>
      {titleEl}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }}
            interval={chartData.length > 15 ? 2 : 0}
            angle={chartData.length > 10 ? -30 : 0}
            textAnchor={chartData.length > 10 ? 'end' : 'middle'}
            height={chartData.length > 10 ? 50 : 30} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {datasets.map((ds, idx) => (
            <Bar key={idx} dataKey={ds.label} fill={PALETTE[idx % PALETTE.length]}
              stackId={type === 'stackedBar' ? 'stack' : undefined}
              radius={type !== 'stackedBar' ? [3, 3, 0, 0] : undefined} />
          ))}
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
      const res  = await aiChatApi.export(spec);
      const url  = URL.createObjectURL(new Blob([res.data]));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = spec.filename || `export.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + (e.userMessage || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.exportBar}>
      <span style={{ color: '#94a3b8', fontSize: 12, marginRight: 8 }}>📦 Export data:</span>
      {['csv', 'xlsx', 'pdf'].map((fmt) => (
        <button key={fmt} disabled={loading} onClick={() => download(fmt)} style={styles.exportBtn}>
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
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 18 }}>
      {!isUser && (
        <div style={styles.avatar}>
          <span style={{ fontSize: 16 }}>🤖</span>
        </div>
      )}
      <div style={{ maxWidth: '72%', minWidth: 80 }}>
        <div style={isUser ? styles.userBubble : styles.aiBubble}>
          {isUser
            ? <p style={{ margin: 0, color: '#fff', lineHeight: 1.6 }}>{msg.content}</p>
            : <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{renderMarkdown(msg.content)}</div>
          }
        </div>
        {msg.chartSpec  && <ChartRenderer spec={msg.chartSpec} />}
        {msg.exportSpec && <ExportBar exportSpec={msg.exportSpec} />}
        {msg.filesUsed?.length > 0 && (
          <div style={styles.filesUsed}>📁 Sources: {msg.filesUsed.join(' · ')}</div>
        )}
        <div style={styles.timestamp}>{msg.timestamp}</div>
      </div>
      {isUser && (
        <div style={{ ...styles.avatar, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', marginLeft: 10, marginRight: 0 }}>
          <span style={{ fontSize: 14 }}>👤</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// AI THINKING INDICATOR — orbiting dots + pulsing brain
// ════════════════════════════════════════════════════════════════════════════════
function ThinkingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
      {/* Avatar with pulse ring */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={styles.avatar}>
          <span style={{ fontSize: 16 }}>🤖</span>
        </div>
        <span className="pulse-ring" />
      </div>

      {/* Thinking bubble */}
      <div style={{ ...styles.aiBubble, padding: '14px 20px', minWidth: 160 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Orbiting dot row */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span className="think-dot td1" />
            <span className="think-dot td2" />
            <span className="think-dot td3" />
          </div>
          <span style={{ color: '#6366f1', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}
            className="think-label">
            AI is thinking…
          </span>
        </div>

        {/* Animated shimmer bar */}
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="shimmer-bar" style={{ width: '85%' }} />
          <div className="shimmer-bar" style={{ width: '65%' }} />
          <div className="shimmer-bar" style={{ width: '75%' }} />
        </div>
      </div>

      <style>{`
        /* Pulse ring around avatar */
        .pulse-ring {
          position: absolute;
          top: -4px; left: -4px;
          width: 42px; height: 42px;
          border-radius: 14px;
          border: 2px solid rgba(99,102,241,0.7);
          animation: pulseRing 1.4s ease-out infinite;
          pointer-events: none;
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.9); opacity: 0.8; }
          70%  { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        /* Bouncing dots */
        .think-dot {
          display: inline-block;
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg,#4f46e5,#7c3aed);
          animation: thinkBounce 1.3s ease-in-out infinite;
          box-shadow: 0 0 6px rgba(99,102,241,0.6);
        }
        .td2 { animation-delay: 0.18s; }
        .td3 { animation-delay: 0.36s; }
        @keyframes thinkBounce {
          0%, 80%, 100% { transform: translateY(0) scale(1);   opacity: 0.5; }
          40%            { transform: translateY(-8px) scale(1.15); opacity: 1; }
        }

        /* Fading "AI is thinking…" text */
        .think-label {
          animation: thinkFade 2s ease-in-out infinite;
        }
        @keyframes thinkFade {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }

        /* Shimmer skeleton bars */
        .shimmer-bar {
          height: 8px; border-radius: 6px;
          background: linear-gradient(90deg,
            rgba(51,65,85,0.4) 25%,
            rgba(99,102,241,0.25) 50%,
            rgba(51,65,85,0.4) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.6s linear infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export default function AiChat() {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [includeData, setIncludeData] = useState(true);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const history = useMemo(() =>
    messages.map(m => ({ role: m.role, content: m.content })),
  [messages]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = {
      id: Date.now(), role: 'user', content: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await aiChatApi.send(msg, history, includeData);
      const aiMsg = {
        id:         Date.now() + 1,
        role:       'assistant',
        content:    data.reply    || '',
        chartSpec:  data.chartSpec  || null,
        exportSpec: data.exportSpec || null,
        filesUsed:  data.filesUsed  || [],
        timestamp:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: `⚠️ **Error:** ${e.userMessage || e.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, history, includeData]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.root}>
      {/* ── Shared Navbar (same as all other pages) ── */}
      <Navbar />

      {/* ── Sub-header bar ── */}
      <div style={styles.subHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={styles.headerIcon}>🧠</div>
          <div>
            <div style={styles.headerTitle}>Constituency AI</div>
            <div style={styles.headerSub}>Mangaluru South · Data-Grounded Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={styles.toggleLabel}>
            <input type="checkbox" checked={includeData} onChange={e => setIncludeData(e.target.checked)}
              style={{ accentColor: '#4f46e5', width: 14, height: 14 }} />
            <span style={{ color: '#94a3b8', fontSize: 12 }}>Use data files</span>
          </label>
          <button onClick={() => setMessages([])} style={styles.iconBtn} title="Clear chat">🗑️ Clear</button>
        </div>
      </div>

      {/* ── BODY: full-width chat, no sidebar ── */}
      <div style={styles.body}>
        <div style={styles.chatArea}>

          {/* Welcome / empty state */}
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🏛️</div>
              <h2 style={styles.emptyTitle}>Constituency Intelligence Assistant</h2>
              <p style={styles.emptyDesc}>
                Ask anything about voters, wards, booth data, schemes, demographics, or election strategy.
                The AI has access to your constituency data files.
              </p>
              <div style={styles.suggestedGrid}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} style={styles.suggestBtn} onClick={() => send(s)}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; e.currentTarget.style.color = '#c7d2fe'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={styles.messagesInner}>
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {loading && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* ── INPUT BAR — narrower, curved ── */}
      <div style={styles.inputBar}>
        <div style={styles.inputOuter}>
          <div style={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about voters, wards, schemes, demographics, election strategy…"
              disabled={loading}
              rows={1}
              style={styles.textarea}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
              }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.4 : 1,
                transform: loading || !input.trim() ? 'none' : 'scale(1)',
              }}
            >
              ➤
            </button>
          </div>
          <div style={styles.inputHint}>
            Press <kbd style={styles.kbd}>Enter</kbd> to send · <kbd style={styles.kbd}>Shift+Enter</kbd> for new line
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════════
const styles = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#0f172a',
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    overflow: 'hidden',
  },

  // Sub-header (below Navbar, above chat)
  subHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 28px',
    background: 'linear-gradient(135deg,#1e1b4b 0%,#1e293b 100%)',
    borderBottom: '1px solid rgba(99,102,241,0.25)',
    flexShrink: 0,
  },
  headerIcon: {
    width: 36, height: 36, borderRadius: 9,
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
    boxShadow: '0 0 16px rgba(99,102,241,0.4)',
  },
  headerTitle: { fontSize: 15, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' },
  headerSub:   { fontSize: 11, color: '#64748b', marginTop: 1 },
  toggleLabel: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' },
  iconBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#94a3b8',
    transition: 'background 0.2s',
  },

  // Body — full width, no sidebar
  body: { display: 'flex', flex: 1, overflow: 'hidden' },

  chatArea: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
  },

  messagesInner: {
    padding: '24px 0',
    // Centre content with max-width for readability
    width: '100%',
    maxWidth: 820,
    margin: '0 auto',
    paddingLeft: 24,
    paddingRight: 24,
    boxSizing: 'border-box',
  },

  // Empty / welcome state
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 32px', textAlign: 'center',
  },
  emptyIcon:  { fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))' },
  emptyTitle: { fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: '0 0 10px', letterSpacing: '-0.03em' },
  emptyDesc:  { color: '#64748b', fontSize: 14, maxWidth: 500, lineHeight: 1.7, marginBottom: 28 },
  suggestedGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
    gap: 8, maxWidth: 720, width: '100%',
  },
  suggestBtn: {
    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 10, padding: '10px 14px', color: '#94a3b8',
    fontSize: 12, cursor: 'pointer', textAlign: 'left', lineHeight: 1.5,
    transition: 'background 0.2s, color 0.2s, border-color 0.2s',
  },

  // Message bubbles
  avatar: {
    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg,#1e293b,#334155)',
    border: '1px solid rgba(99,102,241,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginRight: 10, alignSelf: 'flex-start', marginTop: 2,
  },
  userBubble: {
    background: 'linear-gradient(135deg,#4338ca,#4f46e5)',
    borderRadius: '18px 18px 4px 18px',
    padding: '12px 16px',
    boxShadow: '0 4px 20px rgba(79,70,229,0.3)',
  },
  aiBubble: {
    background: 'rgba(30,41,59,0.85)',
    border: '1px solid rgba(51,65,85,0.8)',
    borderRadius: '4px 18px 18px 18px',
    padding: '14px 18px',
    backdropFilter: 'blur(8px)',
  },
  timestamp: { color: '#334155', fontSize: 10, marginTop: 4, textAlign: 'right' },
  filesUsed: {
    color: '#475569', fontSize: 10, marginTop: 6,
    background: 'rgba(15,23,42,0.5)', borderRadius: 4, padding: '4px 8px',
  },
  exportBar: {
    display: 'flex', alignItems: 'center', marginTop: 10,
    background: 'rgba(15,23,42,0.6)', borderRadius: 8,
    padding: '8px 12px', border: '1px solid rgba(99,102,241,0.2)',
    flexWrap: 'wrap', gap: 6,
  },
  exportBtn: {
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    border: 'none', borderRadius: 6, padding: '4px 10px',
    color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.05em',
  },

  // Input bar — narrower, centred, more curved
  inputBar: {
    flexShrink: 0, padding: '14px 24px 18px',
    background: '#0f172a',
    borderTop: '1px solid rgba(99,102,241,0.15)',
    display: 'flex', justifyContent: 'center',
  },
  inputOuter: {
    width: '100%', maxWidth: 780,   // ← narrower than full width
  },
  inputWrapper: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  textarea: {
    flex: 1, background: 'rgba(30,41,59,0.95)',
    border: '1.5px solid rgba(99,102,241,0.35)', borderRadius: 20, // ← curved corners
    padding: '12px 20px', color: '#e2e8f0', fontSize: 14, lineHeight: 1.6,
    resize: 'none', outline: 'none', fontFamily: 'inherit',
    minHeight: 48, maxHeight: 140,
    scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 0 0 0 transparent',
  },
  sendBtn: {
    width: 48, height: 48, flexShrink: 0,
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    border: 'none', borderRadius: 14,  // ← also curved
    color: '#fff', fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(79,70,229,0.4)',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  inputHint: { color: '#334155', fontSize: 11, marginTop: 8, textAlign: 'center' },
  kbd: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: 'monospace', color: '#64748b',
  },

  // Markdown
  h1: { fontSize: 20, fontWeight: 800, color: '#e2e8f0', margin: '12px 0 6px', letterSpacing: '-0.02em' },
  h2: { fontSize: 17, fontWeight: 700, color: '#c7d2fe', margin: '10px 0 5px' },
  h3: { fontSize: 14, fontWeight: 700, color: '#a5b4fc', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  p:  { margin: '4px 0', color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 },
  ul: { margin: '6px 0', paddingLeft: 20 },
  ol: { margin: '6px 0', paddingLeft: 20 },
  li: { color: '#94a3b8', fontSize: 13, lineHeight: 1.7, marginBottom: 2 },
  pre: {
    background: 'rgba(15,23,42,0.8)', borderRadius: 8, padding: '10px 14px',
    overflowX: 'auto', margin: '8px 0',
    border: '1px solid rgba(51,65,85,0.6)', fontSize: 12,
    color: '#7dd3fc', fontFamily: "'JetBrains Mono','Fira Code',monospace",
  },
  inlineCode: {
    background: 'rgba(99,102,241,0.15)', borderRadius: 4, padding: '1px 5px',
    color: '#a5b4fc', fontSize: '0.9em', fontFamily: 'monospace',
  },
  hr: { border: 'none', borderTop: '1px solid rgba(51,65,85,0.6)', margin: '10px 0' },
};