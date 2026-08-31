import React, { useCallback, useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { socialMediaApi } from '../api/client';
import usePolling from '../hooks/usePolling';

// ── Colors — reuse the same palette Swot.jsx/global.css already use ──────────
const RISK_COLOR = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const SENTIMENT_COLOR = { positive: '#10b981', neutral: '#9badc8', negative: '#ef4444' };
const QUADRANT_COLOR = { strength: '#10b981', weakness: '#ef4444', opportunity: '#22d3ee', threat: '#f59e0b' };
const PLATFORM_LABEL = { youtube: 'YouTube', news: 'News', x: 'X', instagram: 'Instagram', facebook: 'Facebook' };
const BIG_ACCOUNT_THRESHOLD = 10000;

const CATEGORY_OPTIONS = ['political_statement', 'project_statement', 'protest', 'administrative', 'single_statement', 'other'];
const SENTIMENT_OPTIONS = ['positive', 'neutral', 'negative'];
const RISK_OPTIONS = ['low', 'medium', 'high'];
const PLATFORM_OPTIONS = ['youtube', 'news', 'x', 'instagram', 'facebook'];

function timeAgo(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return '—';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Pill({ children, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
      color, background: bg || `${color}22`, border: `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function SectionCard({ title, subtitle, right, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: 18, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ── KPI strip ─────────────────────────────────────────────────────────────────

function KpiStrip({ overview, onSync, syncing, lastSynced }) {
  const sentimentData = overview
    ? Object.entries(overview.sentiment_split || {}).map(([key, value]) => ({
        name: key, value, color: SENTIMENT_COLOR[key] || '#9badc8',
      }))
    : [];

  const stat = (label, value, color) => (
    <div style={{ flex: '1 1 120px', minWidth: 110 }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || 'var(--text-1)' }}>{value}</div>
    </div>
  );

  return (
    <SectionCard
      title="Social Media Intelligence"
      subtitle={`Mangalore South constituency · last synced ${timeAgo(lastSynced)}`}
      right={
        <button
          onClick={onSync}
          disabled={syncing}
          className="btn btn-sm"
          style={{
            background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--border-active)',
            borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: syncing ? 'default' : 'pointer',
            opacity: syncing ? 0.6 : 1,
          }}
        >
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      }
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
        {stat('Posts monitored', overview?.total_posts ?? '—')}
        {stat('Outrage alerts', overview?.outrage_alerts ?? '—', RISK_COLOR.high)}
        {stat('Transcribing…', overview?.pending_transcription_jobs ?? '—', '#22d3ee')}
        {sentimentData.length > 0 && (
          <div style={{ width: 90, height: 90 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={26} outerRadius={40} paddingAngle={2}>
                  {sentimentData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ── Data-source transparency panel ────────────────────────────────────────────

function SourcesPanel({ sources }) {
  if (!sources?.length) return null;
  return (
    <SectionCard title="Data sources" subtitle="Public content only — mock/demo data is always clearly labeled">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {sources.map((s) => {
          const isLive = s.source_type === 'live';
          const isMock = s.source_type === 'mock';
          const color = isLive ? '#10b981' : isMock ? '#9badc8' : '#f59e0b';
          const label = isLive ? 'LIVE' : isMock ? 'DEMO' : 'NOT CONFIGURED';
          return (
            <div key={s.platform} title={s.note} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-surface)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
                {PLATFORM_LABEL[s.platform] || s.platform}
              </span>
              <Pill color={color}>{label}</Pill>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── SWOT board ────────────────────────────────────────────────────────────────

function SwotBoard({ swot, perspective, setPerspective, loading }) {
  const quadrants = ['strength', 'weakness', 'opportunity', 'threat'];
  return (
    <SectionCard
      title="AI-assessed SWOT board"
      subtitle="Synthesized from recent public posts — a triage signal, not a factual judgement about any person"
      right={
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', borderRadius: 999, padding: 3 }}>
          {['political', 'administrative'].map((p) => (
            <button key={p} onClick={() => setPerspective(p)}
              style={{
                border: 'none', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                background: perspective === p ? 'var(--gold-dim)' : 'transparent',
                color: perspective === p ? 'var(--gold)' : 'var(--text-3)',
              }}>
              {p === 'political' ? 'Political' : 'Administrative'}
            </button>
          ))}
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {quadrants.map((q) => {
          const color = QUADRANT_COLOR[q];
          const items = swot?.board?.[q] || [];
          return (
            <div key={q} style={{
              border: `1px solid ${color}33`, background: `${color}0d`, borderRadius: 12, padding: 12, minHeight: 110,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color, marginBottom: 8 }}>
                {q}
              </div>
              {loading ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Generating…</div>
              ) : items.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No signal yet.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((text, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4 }}>{text}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── Outrage / trending panel ───────────────────────────────────────────────────

function OutragePanel({ outrage }) {
  const series = outrage?.volume_series || [];
  return (
    <SectionCard title="Outrage & trending" subtitle="Ranked by AI-assessed outrage score — highest reach/anger signal first">
      {series.length > 1 && (
        <div style={{ height: 90, marginBottom: 14 }}>
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(outrage?.top_posts || []).slice(0, 8).map((p) => (
          <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${RISK_COLOR[p.risk_level] || '#9badc8'}22`, color: RISK_COLOR[p.risk_level] || '#9badc8',
              fontWeight: 800, fontSize: 12,
            }}>
              {p.outrage_score}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.summary || p.text}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                {PLATFORM_LABEL[p.platform] || p.platform} · @{p.account_handle}
              </div>
            </div>
          </div>
        ))}
        {(!outrage?.top_posts || outrage.top_posts.length === 0) && (
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Nothing trending yet.</div>
        )}
      </div>
    </SectionCard>
  );
}

// ── Feed ──────────────────────────────────────────────────────────────────────

function FeedFilters({ filters, setFilters }) {
  const selectStyle = {
    background: 'var(--bg-surface)', color: 'var(--text-2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '6px 10px', fontSize: 12,
  };
  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      <input
        placeholder="Search text…"
        value={filters.q}
        onChange={update('q')}
        style={{ ...selectStyle, flex: '1 1 160px', minWidth: 140 }}
      />
      <select style={selectStyle} value={filters.platform} onChange={update('platform')}>
        <option value="">All platforms</option>
        {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
      </select>
      <select style={selectStyle} value={filters.category} onChange={update('category')}>
        <option value="">All categories</option>
        {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
      </select>
      <select style={selectStyle} value={filters.sentiment} onChange={update('sentiment')}>
        <option value="">All sentiment</option>
        {SENTIMENT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select style={selectStyle} value={filters.risk_level} onChange={update('risk_level')}>
        <option value="">All risk levels</option>
        {RISK_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  );
}

function FeedCard({ post }) {
  const [expanded, setExpanded] = useState(false);
  const risk = RISK_COLOR[post.risk_level] || '#9badc8';
  const isBigAccount = (post.account_followers || 0) >= BIG_ACCOUNT_THRESHOLD;
  const isMock = post.source_type === 'mock';
  const isVideo = post.post_type === 'video';
  const transcribing = isVideo && ['pending', 'processing'].includes(post.transcript_status);

  return (
    <div style={{
      borderLeft: `3px solid ${risk}`, background: 'var(--bg-surface)', borderRadius: 10,
      padding: 12, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)' }}>@{post.account_handle}</span>
        <Pill color="#9badc8">{PLATFORM_LABEL[post.platform] || post.platform}</Pill>
        {isMock && <Pill color="#9badc8" bg="rgba(255,255,255,0.06)">DEMO</Pill>}
        {post.category && <Pill color="#22d3ee">{post.category.replace('_', ' ')}</Pill>}
        <Pill color={risk}>{post.risk_level} risk</Pill>
        {isBigAccount && <Pill color="#a78bfa">tagged by big account</Pill>}
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-3)' }}>{timeAgo(post.posted_at)}</span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
        {post.summary || (post.text || '').slice(0, 160)}
      </div>

      {isVideo && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          {transcribing ? (
            <span style={{ color: '#22d3ee', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="social-shimmer-dot" /> Transcribing…
            </span>
          ) : post.transcript_status === 'failed' ? (
            <span style={{ color: RISK_COLOR.high }}>Transcription failed.</span>
          ) : post.transcript ? (
            <button onClick={() => setExpanded((v) => !v)} style={{
              background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 700,
            }}>
              {expanded ? 'Hide transcript' : 'Show transcript'}
            </button>
          ) : null}
          {expanded && post.transcript && (
            <div style={{ marginTop: 6, padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, color: 'var(--text-3)', fontSize: 12 }}>
              {post.transcript}
            </div>
          )}
        </div>
      )}

      {post.media_url && (
        <a href={post.media_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, display: 'inline-block' }}>
          View original ↗
        </a>
      )}

      <style>{`
        .social-shimmer-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #22d3ee; display: inline-block;
          animation: social-pulse 1s ease-in-out infinite;
        }
        @keyframes social-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

function Feed({ items, loading, hasMore, onLoadMore, filters, setFilters }) {
  return (
    <SectionCard title="Priority feed" subtitle="Flagged public statements, pinned by risk">
      <FeedFilters filters={filters} setFilters={setFilters} />
      {loading && items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Loading feed…</div>
      ) : items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No posts match these filters.</div>
      ) : (
        items.map((p) => <FeedCard key={p._id} post={p} />)
      )}
      {hasMore && (
        <button onClick={onLoadMore} style={{
          width: '100%', marginTop: 4, padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--bg-card)', color: 'var(--text-2)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Load more
        </button>
      )}
    </SectionCard>
  );
}

// ── Background job corner widget ──────────────────────────────────────────────

function JobIndicator({ active }) {
  if (!active) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 70, right: 16, zIndex: 950,
      background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 999,
      padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: 'var(--shadow-md)', fontSize: 12, fontWeight: 700, color: 'var(--gold)',
    }}>
      <span className="social-shimmer-dot" style={{ background: 'var(--gold)' }} />
      Analyzing {active} post{active === 1 ? '' : 's'}…
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SocialIntel() {
  const [overview, setOverview] = useState(null);
  const [sources, setSources] = useState([]);
  const [swot, setSwot] = useState(null);
  const [swotLoading, setSwotLoading] = useState(false);
  const [perspective, setPerspective] = useState('political');
  const [outrage, setOutrage] = useState(null);
  const [jobsActive, setJobsActive] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const [feedItems, setFeedItems] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotal, setFeedTotal] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [filters, setFilters] = useState({ q: '', platform: '', category: '', sentiment: '', risk_level: '' });

  const loadOverview = useCallback(() => {
    socialMediaApi.overview().then(({ data }) => setOverview(data)).catch(() => {});
  }, []);
  const loadSources = useCallback(() => {
    socialMediaApi.sources().then(({ data }) => setSources(data.sources || [])).catch(() => {});
  }, []);
  const loadOutrage = useCallback(() => {
    socialMediaApi.outrage().then(({ data }) => setOutrage(data)).catch(() => {});
  }, []);
  const loadJobsStatus = useCallback(() => {
    socialMediaApi.jobsStatus().then(({ data }) => setJobsActive(data.active || 0)).catch(() => {});
  }, []);

  const loadSwot = useCallback((p) => {
    setSwotLoading(true);
    socialMediaApi.swot(p).then(({ data }) => setSwot(data)).catch(() => {}).finally(() => setSwotLoading(false));
  }, []);

  const loadFeed = useCallback((page, activeFilters) => {
    setFeedLoading(true);
    const params = { page, limit: 20 };
    Object.entries(activeFilters).forEach(([k, v]) => { if (v) params[k] = v; });
    socialMediaApi.feed(params)
      .then(({ data }) => {
        setFeedItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]));
        setFeedTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, []);

  useEffect(() => { loadOverview(); loadSources(); loadOutrage(); }, [loadOverview, loadSources, loadOutrage]);
  useEffect(() => { loadSwot(perspective); }, [perspective, loadSwot]);
  useEffect(() => { setFeedPage(1); loadFeed(1, filters); }, [filters, loadFeed]);

  usePolling(loadJobsStatus, 5000, true);
  usePolling(loadOverview, 30000, true);
  usePolling(loadOutrage, 30000, true);

  const handleSync = () => {
    setSyncing(true);
    socialMediaApi.sync()
      .then(() => {
        setTimeout(() => { loadOverview(); loadFeed(1, filters); loadOutrage(); }, 4000);
      })
      .finally(() => setTimeout(() => setSyncing(false), 2000));
  };

  const lastSyncedTimes = Object.values(overview?.last_synced || {}).filter(Boolean).sort().reverse();

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '16px 14px 90px' }}>
      <KpiStrip overview={overview} onSync={handleSync} syncing={syncing} lastSynced={lastSyncedTimes[0]} />
      <SourcesPanel sources={sources} />
      <SwotBoard swot={swot} perspective={perspective} setPerspective={setPerspective} loading={swotLoading} />
      <OutragePanel outrage={outrage} />
      <Feed
        items={feedItems}
        loading={feedLoading}
        hasMore={feedItems.length < feedTotal}
        onLoadMore={() => { const next = feedPage + 1; setFeedPage(next); loadFeed(next, filters); }}
        filters={filters}
        setFilters={setFilters}
      />
      <JobIndicator active={jobsActive} />
    </div>
  );
}
