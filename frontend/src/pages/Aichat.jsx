import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ── Colour palette (matches dark theme in screenshot) ─────────────────────────
const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

const SUGGESTED_PROMPTS = [
  { icon: '🗳️', text: 'Which wards have the lowest voter turnout and why?' },
  { icon: '🏘️', text: 'Show me caste-wise voter distribution across all wards' },
  { icon: '📊', text: 'What is the survey coverage gap and which booths need priority?' },
  { icon: '🎯', text: 'Give me a winning strategy for the top 5 risk wards' },
  { icon: '👨‍👩‍👧‍👦', text: 'Analyse large family households and their political significance' },
  { icon: '🔮', text: 'Predict swing wards based on current data trends' },
];

// ── Render chart from AI structured response ──────────────────────────────────
function SmartChart({ chart }) {
  if (!chart || !chart.data || !chart.data.length) return null;
  const { type, data, xKey, yKeys, title } = chart;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '16px',
      marginTop: 12,
    }}>
      {title && (
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        {type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey={yKeys[0]} nameKey={xKey} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
          </PieChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
            {yKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey={xKey} tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
            {yKeys.map((k, i) => <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />)}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ── Render a single metric card ───────────────────────────────────────────────
function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '14px 16px',
      flex: '1 1 140px',
      minWidth: 130,
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: color || '#f59e0b' }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{sub}</p>}
    </div>
  );
}

// ── Strategy bullet renderer ──────────────────────────────────────────────────
function StrategyList({ items }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          padding: '8px 0',
          borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          <span style={{
            minWidth: 22, height: 22, borderRadius: '50%',
            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{i + 1}</span>
          <p style={{ margin: 0, fontSize: 14, color: '#d1d5db', lineHeight: 1.6 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

// ── AI message bubble ─────────────────────────────────────────────────────────
function AiMessage({ msg }) {
  const isUser = msg.role === 'user';
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{
          maxWidth: '75%', background: 'rgba(99,102,241,0.2)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: '18px 18px 4px 18px',
          padding: '10px 16px', fontSize: 14, color: '#e0e7ff', lineHeight: 1.6,
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  // AI message — can contain structured data
  const { text, metrics, chart, strategies, error } = msg.content || {};

  if (error) {
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>⚠️</div>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px 18px 18px 18px', padding: '10px 16px', fontSize: 14, color: '#fca5a5' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 14, fontWeight: 700, color: '#fff',
      }}>AI</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Metric cards */}
        {metrics && metrics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
          </div>
        )}
        {/* Main text */}
        {text && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px 18px 18px 18px',
            padding: '12px 16px',
            fontSize: 14, color: '#d1d5db', lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}>
            {text}
          </div>
        )}
        {/* Chart */}
        <SmartChart chart={chart} />
        {/* Strategies */}
        {strategies && strategies.length > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 12, padding: '12px 16px', marginTop: 12,
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🎯 Recommended Strategies
            </p>
            <StrategyList items={strategies} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>AI</div>
      <div style={{ display: 'flex', gap: 5, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 18px 18px 18px' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#6366f1',
            display: 'inline-block',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Main AiChat page ──────────────────────────────────────────────────────────
export default function AiChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dashData, setDashData] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com';

  // Fetch dashboard context on mount
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

  const buildSystemPrompt = useCallback(() => {
    const ctx = dashData ? `
LIVE CONSTITUENCY DATA SNAPSHOT:
- Total Voters: ${dashData.total_voters ?? 'N/A'}
- Total Surveys Completed: ${dashData.total_surveys ?? 'N/A'}
- Houses Covered: ${dashData.houses_covered ?? 'N/A'}
- Survey Coverage: ${dashData.coverage_pct ?? 0}%
- Large Families (15+ members): ${dashData.large_families ?? 'N/A'}
- Risk Wards (SIR action required): ${dashData.risk_wards ?? 'N/A'}
- Ward Coverage Data: ${JSON.stringify(dashData.ward_coverage ?? [])}
- Religion Distribution: ${JSON.stringify(dashData.religion_distribution ?? [])}
` : 'Live data unavailable — use general political strategy knowledge.';

    return `You are the AI Political Intelligence Assistant for Constituency Connect, a platform used by ${user?.username || 'an MLA'} (${user?.role || 'MLA'}) to manage their Mangaluru constituency.

Your job is to analyse voter data, give strategic election insights, explain patterns, and recommend targeted campaign actions.

${ctx}

RESPONSE FORMAT — ALWAYS return a valid JSON object with this exact schema:
{
  "text": "Main analysis paragraph (2-5 sentences, plain text, no markdown)",
  "metrics": [
    { "label": "Metric Name", "value": "123", "sub": "context", "color": "#f59e0b" }
  ],
  "chart": {
    "type": "bar|line|pie",
    "title": "Chart title",
    "data": [...],
    "xKey": "fieldName",
    "yKeys": ["fieldName1", "fieldName2"]
  },
  "strategies": [
    "Specific actionable strategy 1",
    "Specific actionable strategy 2"
  ]
}

RULES:
- "metrics" array: 0-4 items. Only include when numbers add value.
- "chart": null if no chart is needed. Only include ONE chart per response.
- "strategies": 0-5 items. Include when actionable recommendations are warranted.
- Use REAL numbers from the live data snapshot when available.
- Be specific to Mangaluru, Karnataka, and Indian electoral context.
- Always respond ONLY with valid JSON. No preamble, no markdown fences.`;
  }, [dashData, user]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build conversation history for multi-turn
    const history = messages
      .slice(-10) // last 10 for context window
      .map(m => ({
        role: m.role,
        content: m.role === 'user'
          ? m.content
          : JSON.stringify(m.content),
      }));

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: [
            ...history,
            { role: 'user', content: text.trim() },
          ],
        }),
      });

      const data = await response.json();
      const raw = data.content?.find(b => b.type === 'text')?.text || '{}';

      let parsed;
      try {
        // Strip any accidental fences
        const clean = raw.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch {
        parsed = { text: raw };
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: parsed }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: { error: 'Failed to get AI response. Please check your connection and try again.' },
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, loading, buildSystemPrompt]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: '#0d0f1a',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#f9fafb',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        textarea:focus { outline: none; }
        textarea { resize: none; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(13,15,26,0.95)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>🤖</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>
            Constituency AI
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#6366f1' }}>
            Powered by Claude · Connected to live voter data
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: dashData ? '#10b981' : '#6b7280',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 12, color: dashData ? '#10b981' : '#6b7280' }}>
            {dashData ? `${(dashData.total_voters || 0).toLocaleString()} voters loaded` : 'Loading data…'}
          </span>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0' }}>

        {/* Empty state */}
        {isEmpty && (
          <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#f9fafb' }}>
              Hello, {user?.username?.split(' ')[0] || 'MLA'}
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: 14, color: '#6b7280', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              Ask me anything about your constituency — voter trends, ward analysis, caste data, survey gaps, or winning strategies.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 10, maxWidth: 720, margin: '0 auto',
            }}>
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p.text)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px 14px',
                    color: '#d1d5db', fontSize: 13, cursor: 'pointer',
                    textAlign: 'left', display: 'flex', gap: 8, alignItems: 'flex-start',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(msg =>
          msg.role === 'user'
            ? <AiMessage key={msg.id} msg={msg} />
            : <AiMessage key={msg.id} msg={msg} />
        )}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} style={{ height: 24 }} />
      </div>

      {/* ── Input bar ── */}
      <div style={{
        padding: '16px 24px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(13,15,26,0.98)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14, padding: '8px 8px 8px 16px',
          transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about voter turnout, ward analysis, strategies…"
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#f9fafb', fontSize: 14, lineHeight: 1.6,
              fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto',
              paddingTop: 4,
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: input.trim() && !loading ? '#6366f1' : 'rgba(255,255,255,0.08)',
              color: input.trim() && !loading ? '#fff' : '#6b7280',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.15s ease', flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#4b5563', textAlign: 'center' }}>
          Answers are based on your live constituency data · Press Enter to send
        </p>
      </div>
    </div>
  );
}