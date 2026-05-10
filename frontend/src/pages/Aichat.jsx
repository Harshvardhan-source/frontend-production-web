/**
 * AiChat.jsx — AI Chat page for Mangaluru South Constituency Intelligence
 *
 * Features:
 *  • Multi-turn chat with Anthropic (claude-opus-4-5) backed by constituency data files
 *  • Inline chart rendering (Chart.js via recharts) when AI returns a chartspec block
 *  • One-click export of AI-generated tables to CSV / Excel / PDF
 *  • Data files sidebar showing what documents the AI has access to
 *  • Suggested prompts / quick questions
 *  • Markdown-style rendering (bold, bullets, numbered lists, code blocks)
 *  • Streaming typing indicator
 *
 * Add to App.jsx:
 *   import AiChat from './pages/AiChat';
 *   <Route path="/ai" element={<Protected><AiChat /></Protected>} />
 *
 * Add to your nav wherever the "AI" menu item is.
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

// ── colour palette ────────────────────────────────────────────────────────────
const PALETTE = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const FILE_ICONS = {
  xlsx: '📊', xls: '📊', csv: '📋', pdf: '📄',
  docx: '📝', doc: '📝', txt: '📃',
};

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

    // Heading
    if (/^### (.+)/.test(line)) {
      elements.push(<h3 key={i} style={styles.h3}>{line.replace(/^### /, '')}</h3>);
    } else if (/^## (.+)/.test(line)) {
      elements.push(<h2 key={i} style={styles.h2}>{line.replace(/^## /, '')}</h2>);
    } else if (/^# (.+)/.test(line)) {
      elements.push(<h1 key={i} style={styles.h1}>{line.replace(/^# /, '')}</h1>);
    }
    // Bullet
    else if (/^[\-\*] (.+)/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\-\*] (.+)/.test(lines[i])) {
        items.push(<li key={i} style={styles.li}>{inlineFormat(lines[i].replace(/^[\-\*] /, ''))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={styles.ul}>{items}</ul>);
      continue;
    }
    // Numbered list
    else if (/^\d+\. (.+)/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. (.+)/.test(lines[i])) {
        items.push(<li key={i} style={styles.li}>{inlineFormat(lines[i].replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={styles.ol}>{items}</ol>);
      continue;
    }
    // Code block
    else if (line.startsWith('```')) {
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
    }
    // Horizontal rule
    else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={styles.hr} />);
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />);
    }
    // Paragraph
    else {
      elements.push(<p key={i} style={styles.p}>{inlineFormat(line)}</p>);
    }
    i++;
  }
  return elements;
}

function inlineFormat(text) {
  // bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} style={{ color: '#e2e8f0', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} style={styles.inlineCode}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// CHART RENDERER
// ════════════════════════════════════════════════════════════════════════════════
function ChartRenderer({ spec }) {
  if (!spec) return null;

  const { type, title, labels = [], datasets = [] } = spec;

  // Normalize recharts data format
  const chartData = labels.map((label, i) => {
    const point = { name: label };
    datasets.forEach((ds) => {
      point[ds.label] = ds.data[i] ?? 0;
    });
    return point;
  });

  // For pie/doughnut — single dataset
  const pieData = labels.map((label, i) => ({
    name: label,
    value: (datasets[0]?.data ?? [])[i] ?? 0,
  }));

  const chartStyle = {
    background: 'rgba(30,41,59,0.6)',
    borderRadius: 12,
    padding: '16px 8px 8px',
    marginTop: 16,
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
            <Pie
              data={pieData} dataKey="value" nameKey="name"
              cx="50%" cy="50%"
              innerRadius={type === 'doughnut' ? 60 : 0}
              outerRadius={100}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              labelLine={{ stroke: '#475569' }}
            >
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
              ))}
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

  // Default: bar / stackedBar
  return (
    <div style={chartStyle}>
      {titleEl}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }}
            interval={chartData.length > 15 ? 2 : 0} angle={chartData.length > 10 ? -30 : 0}
            textAnchor={chartData.length > 10 ? 'end' : 'middle'} height={chartData.length > 10 ? 50 : 30} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {datasets.map((ds, idx) => (
            <Bar key={idx} dataKey={ds.label}
              fill={PALETTE[idx % PALETTE.length]}
              stackId={type === 'stackedBar' ? 'stack' : undefined}
              radius={type !== 'stackedBar' ? [3, 3, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT BUTTON
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
      <div style={{ maxWidth: '78%', minWidth: 80 }}>
        <div style={isUser ? styles.userBubble : styles.aiBubble}>
          {isUser
            ? <p style={{ margin: 0, color: '#fff', lineHeight: 1.6 }}>{msg.content}</p>
            : <div style={{ color: '#cbd5e1', lineHeight: 1.7 }}>{renderMarkdown(msg.content)}</div>
          }
        </div>

        {/* Chart if present */}
        {msg.chartSpec && <ChartRenderer spec={msg.chartSpec} />}

        {/* Export bar if present */}
        {msg.exportSpec && <ExportBar exportSpec={msg.exportSpec} />}

        {/* Files used */}
        {msg.filesUsed?.length > 0 && (
          <div style={styles.filesUsed}>
            📁 Sources: {msg.filesUsed.join(' · ')}
          </div>
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
// TYPING INDICATOR
// ════════════════════════════════════════════════════════════════════════════════
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={styles.avatar}><span style={{ fontSize: 16 }}>🤖</span></div>
      <div style={{ ...styles.aiBubble, padding: '12px 18px' }}>
        <div style={styles.typingDots}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// DATA FILES PANEL
// ════════════════════════════════════════════════════════════════════════════════
function DataFilesPanel({ files, loading }) {
  if (loading) return <div style={{ color: '#64748b', fontSize: 12, padding: 12 }}>Loading files…</div>;
  if (!files.length) return (
    <div style={{ color: '#64748b', fontSize: 12, padding: 12 }}>
      No files in <code style={styles.inlineCode}>backend/data/</code> yet.<br />
      Drop .xlsx .csv .pdf .docx files there to give the AI context.
    </div>
  );

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {files.map((f) => (
        <div key={f.name} style={styles.fileItem}>
          <span style={{ fontSize: 18 }}>{FILE_ICONS[f.ext] || '📄'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
            <div style={{ color: '#475569', fontSize: 10 }}>{(f.size / 1024).toFixed(1)} KB · {f.ext.toUpperCase()}</div>
          </div>
        </div>
      ))}
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
  const [dataFiles,   setDataFiles]   = useState([]);
  const [filesLoading,setFilesLoading]= useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [includeData, setIncludeData] = useState(true);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // ── Load data files list ───────────────────────────────────────────────────
  useEffect(() => {
    aiChatApi.dataFiles()
      .then(r => setDataFiles(r.data.files || []))
      .catch(() => {})
      .finally(() => setFilesLoading(false));
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Build history for API ──────────────────────────────────────────────────
  const history = useMemo(() =>
    messages.map(m => ({ role: m.role, content: m.content })),
  [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
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
      const errMsg = {
        id: Date.now() + 1, role: 'assistant',
        content: `⚠️ **Error:** ${e.userMessage || e.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, history, includeData]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => setMessages([]);

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.root}>
      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={styles.headerIcon}>🧠</div>
          <div>
            <div style={styles.headerTitle}>Constituency AI</div>
            <div style={styles.headerSub}>Mangaluru South · Data-Grounded Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Toggle data context */}
          <label style={styles.toggleLabel}>
            <input type="checkbox" checked={includeData} onChange={e => setIncludeData(e.target.checked)}
              style={{ accentColor: '#4f46e5', width: 14, height: 14 }} />
            <span style={{ color: '#94a3b8', fontSize: 12 }}>Use data files</span>
          </label>
          <button onClick={clearChat} style={styles.iconBtn} title="Clear chat">🗑️</button>
          <button onClick={() => setSidebarOpen(p => !p)} style={styles.iconBtn} title="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={styles.body}>
        {/* ── CHAT AREA ── */}
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
              {/* Suggested prompts */}
              <div style={styles.suggestedGrid}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} style={styles.suggestBtn} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ padding: '20px 24px' }}>
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        {sidebarOpen && (
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                📁 DATA SOURCES
              </span>
              <span style={{ color: '#4f46e5', fontSize: 11, fontWeight: 600 }}>
                {dataFiles.length} files
              </span>
            </div>
            <DataFilesPanel files={dataFiles} loading={filesLoading} />

            <div style={styles.sidebarSection}>
              <div style={styles.sidebarSectionTitle}>💡 QUICK PROMPTS</div>
              {SUGGESTED.slice(0, 5).map((s, i) => (
                <button key={i} style={styles.sideQuickBtn} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT BAR ── */}
      <div style={styles.inputBar}>
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
            }}
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
        <div style={styles.inputHint}>
          Press <kbd style={styles.kbd}>Enter</kbd> to send · <kbd style={styles.kbd}>Shift+Enter</kbd> for new line
        </div>
      </div>

      {/* ── TYPING ANIMATION CSS ── */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        .typing-dot { width:7px; height:7px; border-radius:50%; background:#4f46e5; display:inline-block; animation: bounce 1.2s infinite; }
        .typing-dot:nth-child(2) { animation-delay:0.15s; }
        .typing-dot:nth-child(3) { animation-delay:0.30s; }
      `}</style>
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
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 24px',
    background: 'linear-gradient(135deg,#1e1b4b 0%,#1e293b 100%)',
    borderBottom: '1px solid rgba(99,102,241,0.3)',
    flexShrink: 0,
    zIndex: 10,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, flexShrink: 0,
    boxShadow: '0 0 20px rgba(99,102,241,0.4)',
  },
  headerTitle: {
    fontSize: 16, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em',
  },
  headerSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  toggleLabel: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' },
  iconBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: '#94a3b8',
    transition: 'background 0.2s',
  },

  body: {
    display: 'flex', flex: 1, overflow: 'hidden',
  },

  chatArea: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
  },

  sidebar: {
    width: 280, flexShrink: 0,
    background: '#111827',
    borderLeft: '1px solid rgba(99,102,241,0.15)',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
    scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent',
  },
  sidebarHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px 10px',
    borderBottom: '1px solid rgba(99,102,241,0.15)',
    flexShrink: 0,
  },
  fileItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 14px',
    borderBottom: '1px solid rgba(30,41,59,0.8)',
    transition: 'background 0.15s',
    cursor: 'default',
  },
  sidebarSection: {
    borderTop: '1px solid rgba(99,102,241,0.15)',
    padding: '12px 14px',
    flexShrink: 0,
  },
  sidebarSectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', marginBottom: 8,
  },
  sideQuickBtn: {
    display: 'block', width: '100%', textAlign: 'left',
    background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: 6, padding: '7px 10px', marginBottom: 5,
    color: '#94a3b8', fontSize: 11, cursor: 'pointer',
    lineHeight: 1.4, transition: 'background 0.15s, color 0.15s',
  },

  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '40px 32px', textAlign: 'center',
  },
  emptyIcon: { fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))' },
  emptyTitle: { fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: '0 0 10px', letterSpacing: '-0.03em' },
  emptyDesc: { color: '#64748b', fontSize: 14, maxWidth: 480, lineHeight: 1.7, marginBottom: 28 },
  suggestedGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
    gap: 8, maxWidth: 720, width: '100%',
  },
  suggestBtn: {
    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 8, padding: '10px 14px', color: '#94a3b8',
    fontSize: 12, cursor: 'pointer', textAlign: 'left', lineHeight: 1.5,
    transition: 'background 0.2s, color 0.2s, border-color 0.2s',
  },

  avatar: {
    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg,#1e293b,#334155)',
    border: '1px solid rgba(99,102,241,0.3)',
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
    background: 'rgba(30,41,59,0.8)',
    border: '1px solid rgba(51,65,85,0.8)',
    borderRadius: '4px 16px 16px 16px',
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

  typingDots: { display: 'flex', gap: 4, alignItems: 'center', height: 18 },

  inputBar: {
    flexShrink: 0, padding: '14px 24px 18px',
    background: '#0f172a',
    borderTop: '1px solid rgba(99,102,241,0.2)',
  },
  inputWrapper: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  textarea: {
    flex: 1, background: 'rgba(30,41,59,0.9)',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12,
    padding: '12px 16px', color: '#e2e8f0', fontSize: 14, lineHeight: 1.6,
    resize: 'none', outline: 'none', fontFamily: 'inherit',
    minHeight: 46, maxHeight: 140,
    scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent',
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    width: 46, height: 46, flexShrink: 0,
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    border: 'none', borderRadius: 12,
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

  // Markdown styles
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
    color: '#7dd3fc', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  inlineCode: {
    background: 'rgba(99,102,241,0.15)', borderRadius: 4, padding: '1px 5px',
    color: '#a5b4fc', fontSize: '0.9em', fontFamily: 'monospace',
  },
  hr: { border: 'none', borderTop: '1px solid rgba(51,65,85,0.6)', margin: '10px 0' },
};