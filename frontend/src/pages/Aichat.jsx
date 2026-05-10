/**
 * AiChat.jsx — ShaastrAI
 * Clean, minimal ChatGPT-style UI.
 * Shared <Navbar /> at top. No data-source display anywhere.
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { aiChatApi } from '../api/client';
import Navbar from '../components/Navbar';

// ── Constants ─────────────────────────────────────────────────────────────────
const PALETTE = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

const LOADING_WORDS = [
  'Analysing voters…','Querying wards…','Scanning booths…',
  'Reading surveys…','Checking schemes…','Crunching numbers…',
  'Processing polls…','Computing stats…',
];

const SUGGESTED = [
  'Total voter count by ward',
  'Religion-wise breakdown all wards',
  'Survey completion status ward-wise',
  'Which schemes have most beneficiaries?',
  'Top 10 wards by voters as bar chart',
  'Strategic priority wards to focus on',
];

const STORAGE_KEY = 'shaastrai_chats_v2';

// ── LocalStorage ──────────────────────────────────────────────────────────────
function loadChats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveChats(chats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 50))); }
  catch {}
}
function makeChat() {
  return { id: Date.now(), title: 'New Chat', messages: [], createdAt: new Date().toISOString() };
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMd(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const els = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if      (/^### .+/.test(ln)) { els.push(<h3 key={i} style={T.h3}>{ln.replace(/^### /, '')}</h3>); }
    else if (/^## .+/.test(ln))  { els.push(<h2 key={i} style={T.h2}>{ln.replace(/^## /, '')}</h2>); }
    else if (/^# .+/.test(ln))   { els.push(<h1 key={i} style={T.h1}>{ln.replace(/^# /, '')}</h1>); }
    else if (/^[-*] .+/.test(ln)) {
      const items = [];
      while (i < lines.length && /^[-*] .+/.test(lines[i])) {
        items.push(<li key={i} style={T.li}>{fmt(lines[i].replace(/^[-*] /, ''))}</li>);
        i++;
      }
      els.push(<ul key={`u${i}`} style={T.ul}>{items}</ul>);
      continue;
    }
    else if (/^\d+\. .+/.test(ln)) {
      const items = [];
      while (i < lines.length && /^\d+\. .+/.test(lines[i])) {
        items.push(<li key={i} style={T.li}>{fmt(lines[i].replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      els.push(<ol key={`o${i}`} style={T.ol}>{items}</ol>);
      continue;
    }
    else if (ln.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      els.push(<pre key={i} style={T.pre}><code>{code.join('\n')}</code></pre>);
    }
    else if (/^---+$/.test(ln.trim())) { els.push(<hr key={i} style={T.hr} />); }
    else if (!ln.trim()) { els.push(<div key={i} style={{ height: 6 }} />); }
    else { els.push(<p key={i} style={T.p}>{fmt(ln)}</p>); }
    i++;
  }
  return els;
}

function fmt(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} style={{ color: '#f1f5f9', fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={i} style={T.inlineCode}>{p.slice(1, -1)}</code>;
    return p;
  });
}

// ── Chart renderer ────────────────────────────────────────────────────────────
function ChartRenderer({ spec }) {
  if (!spec) return null;
  const { type, title, labels = [], datasets = [] } = spec;
  const data = labels.map((name, i) => {
    const o = { name };
    datasets.forEach(d => { o[d.label] = d.data[i] ?? 0; });
    return o;
  });
  const pie = labels.map((name, i) => ({ name, value: (datasets[0]?.data ?? [])[i] ?? 0 }));
  const tt = {
    contentStyle: { background: '#1c1c1e', border: '1px solid #2a2a2e', borderRadius: 8, color: '#e2e8f0' },
    labelStyle: { color: '#888' },
  };
  const wrap = ch => (
    <div style={{ background: '#111113', borderRadius: 12, padding: '14px 8px 8px', marginTop: 12, border: '1px solid #222' }}>
      {title && <div style={{ textAlign: 'center', color: '#666', fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{title}</div>}
      {ch}
    </div>
  );
  if (type === 'pie' || type === 'doughnut') return wrap(
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={type === 'doughnut' ? 55 : 0} outerRadius={85} paddingAngle={2}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
          labelLine={{ stroke: '#444' }}>
          {pie.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip {...tt} /><Legend wrapperStyle={{ color: '#888', fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
  if (type === 'line') return wrap(
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} />
        <YAxis tick={{ fill: '#555', fontSize: 10 }} />
        <Tooltip {...tt} /><Legend wrapperStyle={{ color: '#888', fontSize: 11 }} />
        {datasets.map((d, i) => (
          <Line key={i} type="monotone" dataKey={d.label} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 2 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
  return wrap(
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
        <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }}
          angle={data.length > 10 ? -25 : 0}
          textAnchor={data.length > 10 ? 'end' : 'middle'}
          height={data.length > 10 ? 38 : 20}
          interval={data.length > 15 ? 2 : 0} />
        <YAxis tick={{ fill: '#555', fontSize: 10 }} />
        <Tooltip {...tt} /><Legend wrapperStyle={{ color: '#888', fontSize: 11 }} />
        {datasets.map((d, i) => (
          <Bar key={i} dataKey={d.label} fill={PALETTE[i % PALETTE.length]}
            stackId={type === 'stackedBar' ? 's' : undefined} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Export bar ────────────────────────────────────────────────────────────────
function ExportBar({ exportSpec }) {
  const [busy, setBusy] = useState(false);
  const dl = async (fmt) => {
    setBusy(true);
    try {
      const res = await aiChatApi.export({ ...exportSpec, format: fmt });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = exportSpec.filename || `export.${fmt}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + (e.userMessage || e.message)); }
    finally { setBusy(false); }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
      <span style={{ color: '#555', fontSize: 11 }}>Export:</span>
      {['csv', 'xlsx', 'pdf'].map(f => (
        <button key={f} disabled={busy} onClick={() => dl(f)}
          style={{
            background: '#1a1a1e', border: '1px solid #2a2a2e',
            borderRadius: 6, padding: '3px 10px',
            color: '#aaa', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
          {f.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── Brain icon ────────────────────────────────────────────────────────────────
function BrainIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" /><stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="br2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c7d2fe" /><stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#bg2)" />
      <path d="M24 10C17.37 10 12 15.37 12 22c0 3.1 1.16 5.93 3.06 8.06C16.34 31.53 17 33.2 17 35v1h7V10z" fill="url(#br2)" opacity=".9" />
      <path d="M24 10c6.63 0 12 5.37 12 12 0 3.1-1.16 5.93-3.06 8.06C31.66 31.53 31 33.2 31 35v1h-7V10z" fill="url(#br2)" opacity=".72" />
      <line x1="24" y1="10" x2="24" y2="36" stroke="#6366f1" strokeWidth="1.5" />
      <rect x="19" y="36" width="10" height="3" rx="1.5" fill="url(#br2)" opacity=".65" />
      <circle cx="20" cy="17" r="1.5" fill="#c7d2fe" />
      <circle cx="28" cy="17" r="1.5" fill="#c7d2fe" />
    </svg>
  );
}

// ── Loading dots ──────────────────────────────────────────────────────────────
function LoadingDots() {
  const [wi, setWi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setWi(p => (p + 1) % LOADING_WORDS.length), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', background: '#111113',
      borderRadius: '4px 14px 14px 14px',
      border: '1px solid #1e1e22', maxWidth: 220,
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map(i => (
          <span key={i} className={`sai-dot sai-dot-${i}`}
            style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
        ))}
      </div>
      <span style={{ color: '#555', fontSize: 11, fontStyle: 'italic', whiteSpace: 'nowrap' }}>
        {LOADING_WORDS[wi]}
      </span>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 18, gap: 10, alignItems: 'flex-start',
    }}>
      {!isUser && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <BrainIcon size={28} />
        </div>
      )}
      <div style={{ maxWidth: '72%', minWidth: 60 }}>
        <div style={isUser ? T.userBubble : T.aiBubble}>
          {isUser
            ? <span style={{ color: '#f1f5f9', fontSize: 14, lineHeight: 1.65 }}>{msg.content}</span>
            : <div style={{ color: '#d1d5db', fontSize: 14, lineHeight: 1.8 }}>{renderMd(msg.content)}</div>
          }
        </div>
        {msg.chartSpec  && <ChartRenderer spec={msg.chartSpec} />}
        {msg.exportSpec && <ExportBar exportSpec={msg.exportSpec} />}
        <div style={{ color: '#2a2a2e', fontSize: 10, marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.ts}
        </div>
      </div>
      {isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: '#1a1a1e', border: '1px solid #2a2a2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 2, fontSize: 13,
        }}>👤</div>
      )}
    </div>
  );
}

// ── History drawer ────────────────────────────────────────────────────────────
function HistoryDrawer({ chats, activeChatId, onSelect, onDelete, onNew, onClose }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 256, zIndex: 200,
      background: '#0d0d0f', borderRight: '1px solid #1a1a1e',
      display: 'flex', flexDirection: 'column',
      animation: 'drawerIn .2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 14px 12px' }}>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          History
        </span>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16 }}>
          ✕
        </button>
      </div>

      <div style={{ padding: '0 10px 10px' }}>
        <button onClick={onNew} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          background: '#111113', border: '1px solid #222',
          borderRadius: 8, color: '#888', fontSize: 13, fontWeight: 500,
          padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>+</span> New Chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px' }}>
        {chats.length === 0
          ? <div style={{ color: '#333', fontSize: 12, textAlign: 'center', padding: '24px 8px' }}>No chats yet.</div>
          : chats.map(c => (
            <div key={c.id}
              onClick={() => { onSelect(c.id); onClose(); }}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                background: c.id === activeChatId ? '#1a1a1e' : hovered === c.id ? '#141416' : 'transparent',
                transition: 'background .12s',
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: c.id === activeChatId ? '#e2e8f0' : '#666',
                  fontSize: 12, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {c.title || 'New Chat'}
                </div>
                <div style={{ color: '#333', fontSize: 10, marginTop: 1 }}>
                  {c.messages.length} msg{c.messages.length !== 1 ? 's' : ''}
                </div>
              </div>
              {hovered === c.id && (
                <button onClick={e => onDelete(c.id, e)}
                  style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 12, padding: 2, flexShrink: 0 }}>
                  🗑
                </button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════════
export default function AiChat() {
  const [chats,        setChats]        = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(() => { const c = loadChats(); return c[0]?.id || null; });
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) || null, [chats, activeChatId]);
  const msgs = activeChat?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);
  useEffect(() => { saveChats(chats); }, [chats]);

  const createNewChat = () => {
    const c = makeChat();
    setChats(prev => [c, ...prev]);
    setActiveChatId(c.id);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    setChats(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeChatId === id) setActiveChatId(next[0]?.id || null);
      return next;
    });
  };

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    let chatId = activeChatId;
    if (!chatId) {
      const c = makeChat();
      setChats(prev => [c, ...prev]);
      setActiveChatId(c.id);
      chatId = c.id;
    }

    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now(), role: 'user', content: msg, ts };

    setChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      const nm = [...c.messages, userMsg];
      return { ...c, messages: nm, title: nm.find(m => m.role === 'user')?.content?.slice(0, 40) || c.title };
    }));

    setLoading(true);

    const history = (chats.find(c => c.id === chatId)?.messages || [])
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const { data } = await aiChatApi.send(msg, history, true);
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply || '',
        chartSpec: data.chartSpec || null,
        exportSpec: data.exportSpec || null,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChats(prev => prev.map(c => c.id !== chatId ? c : { ...c, messages: [...c.messages, aiMsg] }));
    } catch (e) {
      const errMsg = {
        id: Date.now() + 1, role: 'assistant',
        content: `⚠️ **Error:** ${e.userMessage || e.message || 'Something went wrong.'}`,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChats(prev => prev.map(c => c.id !== chatId ? c : { ...c, messages: [...c.messages, errMsg] }));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [input, loading, activeChatId, chats]);

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const hasMessages = msgs.length > 0;

  return (
    <>
      <style>{CSS}</style>

      {/* History drawer + backdrop */}
      {drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 190,
            background: 'rgba(0,0,0,0.55)',
          }} />
          <HistoryDrawer
            chats={chats}
            activeChatId={activeChatId}
            onSelect={setActiveChatId}
            onDelete={deleteChat}
            onNew={() => { createNewChat(); setDrawerOpen(false); }}
            onClose={() => setDrawerOpen(false)}
          />
        </>
      )}

      <div style={S.root}>
        {/* Shared navbar — identical to every other page */}
        <Navbar />

        {/* ── PAGE BODY ── */}
        <div style={S.body}>

          {/* History toggle button */}
          <button
            onClick={() => setDrawerOpen(true)}
            title="Chat history"
            style={S.historyBtn}
            className="history-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="15" y2="18" />
            </svg>
          </button>

          {/* ── WELCOME (no messages) ── */}
          {!hasMessages && (
            <div style={S.welcome}>
              <div style={{ marginBottom: 22, animation: 'aiPulse 2.8s ease-in-out infinite' }}>
                <BrainIcon size={52} />
              </div>
              <h1 style={S.welcomeTitle}>Where should we begin?</h1>
              <p style={S.welcomeSub}>Mangaluru South · Constituency Intelligence</p>

              <div style={S.suggestGrid}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} style={S.suggestBtn} onClick={() => send(s)}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#1a1a1e';
                      e.currentTarget.style.borderColor = '#2a2a2e';
                      e.currentTarget.style.color = '#ccc';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#111113';
                      e.currentTarget.style.borderColor = '#1e1e22';
                      e.currentTarget.style.color = '#555';
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {hasMessages && (
            <div style={S.msgList}>
              <div style={S.msgInner}>
                {msgs.map(m => <Bubble key={m.id} msg={m} />)}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <BrainIcon size={28} />
                    <LoadingDots />
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          )}

          {/* ── INPUT BAR ── */}
          <div style={S.inputWrap}>
            <div style={S.inputBox} className="input-box">
              {/* + new chat */}
              <button onClick={createNewChat} title="New chat" style={S.plusBtn} className="plus-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything…"
                disabled={loading}
                rows={1}
                style={S.textarea}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />

              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{ ...S.sendBtn, opacity: (loading || !input.trim()) ? 0.25 : 1 }}
              >
                {loading
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin .8s linear infinite' }}>
                      <path d="M12 2a10 10 0 1 1-7.07 2.93" />
                    </svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                }
              </button>
            </div>

            <p style={S.hint}>
              <kbd style={S.kbd}>Enter</kbd> to send &nbsp;·&nbsp; <kbd style={S.kbd}>Shift+Enter</kbd> for new line
            </p>
          </div>

        </div>
      </div>
    </>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');

  @keyframes sai-bounce {
    0%,80%,100%{ transform:translateY(0); opacity:.28; }
    40%        { transform:translateY(-5px); opacity:1; }
  }
  @keyframes aiPulse {
    0%,100%{ filter:drop-shadow(0 0 8px rgba(99,102,241,.35)); transform:scale(1); }
    50%    { filter:drop-shadow(0 0 20px rgba(99,102,241,.7)); transform:scale(1.05); }
  }
  @keyframes drawerIn {
    from{ transform:translateX(-100%); opacity:0; }
    to  { transform:translateX(0);     opacity:1; }
  }
  @keyframes fadeUp {
    from{ opacity:0; transform:translateY(10px); }
    to  { opacity:1; transform:translateY(0); }
  }
  @keyframes spin {
    from{ transform:rotate(0deg); }
    to  { transform:rotate(360deg); }
  }

  .sai-dot   { animation:sai-bounce 1.3s infinite; }
  .sai-dot-1 { animation-delay:.15s !important; }
  .sai-dot-2 { animation-delay:.30s !important; }

  .history-btn:hover { border-color:#2a2a2e !important; color:#888 !important; }
  .plus-btn:hover    { color:#888 !important; }
  .input-box:focus-within { border-color:#333 !important; }

  ::-webkit-scrollbar       { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#1e1e22; border-radius:4px; }
`;

// ── Layout styles ─────────────────────────────────────────────────────────────
const S = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#0a0a0a',
    fontFamily: "'Sora','system-ui',sans-serif",
    overflow: 'hidden',
  },

  body: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', overflow: 'hidden',
    position: 'relative',
  },

  historyBtn: {
    position: 'absolute', top: 14, left: 16, zIndex: 10,
    background: 'none', border: '1px solid #1a1a1e',
    borderRadius: 8, padding: '7px 9px',
    color: '#333', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    transition: 'color .15s, border-color .15s',
  },

  // Welcome
  welcome: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '0 20px 90px',
    animation: 'fadeUp .4s ease',
    width: '100%', maxWidth: 660,
  },
  welcomeTitle: {
    fontSize: 26, fontWeight: 600, color: '#e2e8f0',
    margin: '0 0 6px', letterSpacing: '-0.02em', textAlign: 'center',
  },
  welcomeSub: {
    color: '#3a3a3e', fontSize: 12, marginBottom: 28,
    fontWeight: 400, textAlign: 'center',
  },
  suggestGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(188px, 1fr))',
    gap: 8, width: '100%',
  },
  suggestBtn: {
    background: '#111113', border: '1px solid #1e1e22',
    borderRadius: 10, padding: '11px 14px',
    color: '#555', fontSize: 12, cursor: 'pointer',
    textAlign: 'left', lineHeight: 1.5,
    transition: 'all .15s', fontFamily: 'inherit',
  },

  // Messages
  msgList: {
    flex: 1, width: '100%', overflowY: 'auto',
    scrollbarWidth: 'thin', scrollbarColor: '#1e1e22 transparent',
  },
  msgInner: {
    maxWidth: 720, margin: '0 auto',
    padding: '28px 20px 16px',
  },

  // Input
  inputWrap: {
    width: '100%', maxWidth: 720,
    padding: '6px 20px 14px',
    flexShrink: 0,
  },
  inputBox: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#111113',
    border: '1px solid #222',
    borderRadius: 14,
    padding: '10px 10px 10px 8px',
    transition: 'border-color .2s',
  },
  plusBtn: {
    background: 'none', border: 'none',
    color: '#333', cursor: 'pointer',
    padding: '4px 6px', borderRadius: 6,
    display: 'flex', alignItems: 'center', flexShrink: 0,
    transition: 'color .15s',
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none', outline: 'none',
    color: '#e2e8f0', fontSize: 14, lineHeight: 1.6,
    resize: 'none', fontFamily: 'inherit',
    minHeight: 24, maxHeight: 120,
    padding: '0',
    scrollbarWidth: 'none',
  },
  sendBtn: {
    background: '#fff',
    border: 'none', borderRadius: 8,
    width: 32, height: 32, flexShrink: 0,
    color: '#0a0a0a', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity .15s',
  },
  hint: {
    color: '#222', fontSize: 10,
    textAlign: 'center', marginTop: 7, marginBottom: 0,
  },
  kbd: {
    background: '#111113', border: '1px solid #1e1e22',
    borderRadius: 3, padding: '1px 5px',
    fontSize: 10, fontFamily: 'monospace', color: '#2a2a2e',
  },
};

// ── Markdown typography ───────────────────────────────────────────────────────
const T = {
  h1: { fontSize: 17, fontWeight: 700, color: '#e2e8f0', margin: '10px 0 6px', letterSpacing: '-0.02em' },
  h2: { fontSize: 15, fontWeight: 600, color: '#c7d2fe', margin: '8px 0 4px' },
  h3: { fontSize: 11, fontWeight: 700, color: '#6366f1', margin: '8px 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  p:  { margin: '4px 0', color: '#9ca3af', fontSize: 14, lineHeight: 1.8 },
  ul: { margin: '5px 0', paddingLeft: 18 },
  ol: { margin: '5px 0', paddingLeft: 18 },
  li: { color: '#9ca3af', fontSize: 13, lineHeight: 1.8, marginBottom: 3 },
  pre: {
    background: '#0d0d0f', borderRadius: 8,
    padding: '10px 14px', overflowX: 'auto',
    margin: '8px 0', border: '1px solid #1a1a1e',
    fontSize: 12, color: '#7dd3fc',
    fontFamily: "'JetBrains Mono',monospace",
  },
  inlineCode: {
    background: '#1a1a1e', borderRadius: 4,
    padding: '1px 5px', color: '#a5b4fc',
    fontSize: '0.88em', fontFamily: 'monospace',
  },
  hr: { border: 'none', borderTop: '1px solid #1a1a1e', margin: '8px 0' },

  // Bubbles
  userBubble: {
    background: '#1a1a1e',
    border: '1px solid #252528',
    borderRadius: '14px 14px 4px 14px',
    padding: '10px 14px',
    display: 'inline-block',
  },
  aiBubble: {
    padding: '2px 0',
  },
};