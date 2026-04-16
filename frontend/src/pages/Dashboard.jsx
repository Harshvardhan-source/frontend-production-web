import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Navbar from '../components/Navbar';
import { dashboardApi } from '../api/client';
import { useAuth } from '../App';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const COLORS = ['#f59e0b', '#22d3ee', '#10b981', '#8b5cf6', '#ec4899', '#f97316'];

const WARD_BOOTHS_MAP = {
  "ALAPE NORTH":[44,189,191,190,192,197,45],"ALAPE SOUTH":[188,187,186,185,184,209,210],
  "ATHAVARA":[152,151,242,243,221,222,153],"BAJAL":[202,201,203,204,206,205,207,208],
  "BEJAI":[15,16,18,19,23,21,20],"BENDOOR":[162,163,134,136,129,167],
  "BENGRE":[94,95,96,99,97,100,98,101,103,102],"BOLAR":[237,238,236,230,231,225],
  "BOLOOR":[93,92,91,82,79,78],"BUNDER":[115,116,117,118,112,119],
  "CENTRAL":[120,121,124,123,122],"CONTONMENT":[150,137,145,146,141],
  "COURT":[143,127,126,125,142],"DEREBAIL NAIRUTHYA":[4,90,89,86,85,87,88,10],
  "DEREBAIL SOUTH":[17,11,12,8,9,14,13],"DEREBAIL WEST":[5,1,2,3,7,6],
  "DONGARAKERY":[114,73,74,111,108,113,71],"FALNIR":[159,161,160,158,168,169,171,170],
  "HOIGE BAZAR":[239,235,232,229,233],"JAPPIMOGAR":[213,217,214,218,212,211,215,216,244],
  "JEPPU":[240,219,220,241,156,157,155,154],"KADRI NORTH":[62,63,30,27,28,29],
  "KADRI SOUTH":[59,61,60,57],"KAMBALA":[69,68,67,66,70],
  "KANKANADY":[176,175,182,181,177,178,179,180],"KANNUR":[193,198,195,199,196,200,194],
  "KODIALBAIL":[65,64,26,24,25,22],"KUDROLI":[107,106,109,110,104,105],
  "MANGALADEVI":[147,228,227,226,223,224],"MANNAGDDA":[77,76,80,81,83,84,72,75],
  "MAROLI":[46,47,48,50,52,49,51],"MILAGRESS":[140,138,139,164,165,166],
  "PADAV CENTRAL":[35,34,38,41,39,43,42],"PADAV-EAST":[37,36,40],
  "PADAV-WEST":[33,32,56,53,54,31,55],"PORT":[148,149,144,234],
  "SHIVABAGH":[128,130,58,135,131],"VALENCIA":[173,172,183,174,132,133],
};

function wardByBooth(boothNo) {
  const n = parseInt(boothNo);
  if (!n) return '';
  for (const [w, bs] of Object.entries(WARD_BOOTHS_MAP)) { if (bs.includes(n)) return w; }
  return '';
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 18, radius = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'rgba(255,255,255,0.06)',
      animation: 'pulse 1.6s ease-in-out infinite',
      ...style,
    }} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="card stat-card" style={{ gap: 10 }}>
      <Skeleton w={40} h={40} radius={10} />
      <Skeleton w="55%" h={11} />
      <Skeleton w="70%" h={28} />
      <Skeleton w="45%" h={11} />
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2847', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({ member, wardNumber, wardName, serialStart, houseSurveyData, query, onSurveyDone }) {
  const navigate = useNavigate();

  const handleStartSurvey = () => {
    const hs       = houseSurveyData || {};
    const boothStr = String(hs.boothNo || member.booth || '');
    const resolvedWard = (hs.wardNumber && isNaN(hs.wardNumber) ? hs.wardNumber : '')
      || wardByBooth(boothStr)
      || (wardNumber && isNaN(wardNumber) ? wardNumber : '')
      || '';
    const genderFull = member.gender === 'M' ? 'Male'
      : member.gender === 'F' ? 'Female'
      : member.gender === 'O' ? 'Other' : (member.gender || '');

    navigate('/survey/form', {
      state: {
        wardNumber:  resolvedWard, wardName: resolvedWard, boothNo: boothStr,
        serialNo:    serialStart,  returnTo: '/',          returnQuery: query || '',
        prefill: {
          voterid:      member.voterid || '',
          gender:       genderFull,
          firstName:    (member.name || '').split(' ')[0]           || '',
          lastName:     (member.name || '').split(' ').slice(-1)[0] || '',
          houseNumber:  hs.houseNumber  || member.house_no || '',
          wardNumber:   resolvedWard,
          boothNo:      boothStr,
          address:      hs.address      || '',
          areaType:     hs.areaType     || '',
          homeType:     hs.homeType     || '',
          familyIncome: hs.familyIncome || '',
        },
      },
    });
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      background: member.surveyed ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${member.surveyed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 10, marginBottom: 6, transition: 'all 0.2s',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: member.surveyed ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.12)',
        border: `1px solid ${member.surveyed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800,
        color: member.surveyed ? '#10b981' : '#f59e0b',
      }}>
        {(member.name || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.name || '—'}
          {member.relation && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>{member.relation}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {member.voterid && <span style={{ marginRight: 8 }}>🪪 {member.voterid}</span>}
          {member.gender  && <span style={{ marginRight: 8 }}>{member.gender === 'M' ? '♂' : member.gender === 'F' ? '♀' : '⚧'} {member.gender}</span>}
          {member.age     && <span>Age {member.age}</span>}
        </div>
      </div>
      {member.surveyed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>
          ✓ Done
        </div>
      ) : (
        <button onClick={handleStartSurvey} style={{
          background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 8,
          padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#090e1c',
          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
        }}>✎ Survey</button>
      )}
    </div>
  );
}

// ─── House Card ───────────────────────────────────────────────────────────────
function HouseCard({ house, serialCounter, query }) {
  const [expanded, setExpanded] = useState(true);
  const pct         = house.total_members ? Math.round((house.surveyed / house.total_members) * 100) : 0;
  const statusColor = pct === 100 ? '#10b981' : pct > 0 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: 'rgba(17,28,52,0.7)',
      border: `1px solid ${pct === 100 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, marginBottom: 16, overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    }}>
      <div onClick={() => setExpanded(p => !p)} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
        borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⌂</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>
            House No: {house.house_no}
            {house.ward && <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>Ward {house.ward} {house.booth ? `· Booth ${house.booth}` : ''}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: statusColor, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, flexShrink: 0 }}>{house.surveyed}/{house.total_members}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {pct === 100 ? (
            <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✓ Complete</span>
          ) : house.remaining > 0 ? (
            <span style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{house.remaining} pending</span>
          ) : null}
          <span style={{ color: 'var(--text-3)', fontSize: 16, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '12px 16px' }}>
          {house.members.map((m, i) => (
            <MemberRow
              key={`${house.house_no}-${m.voterid || 'noid'}-${i}`}
              member={m} wardNumber={house.ward} wardName={`Ward ${house.ward}`}
              serialStart={serialCounter + i} houseSurveyData={house.house_survey_data} query={query}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }              = useAuth();
  // stats starts as null — UI renders immediately with skeletons, fills in as data arrives
  const [stats, setStats]     = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]     = useState('');

  const [query, setQuery]         = useState('');
  const [searching, setSearching] = useState(false);
  const [searchRes, setSearchRes] = useState(null);
  const [searchErr, setSearchErr] = useState('');
  const [nextSerial, setNextSerial] = useState(1);
  const debounceRef      = useRef(null);
  const searchResultsRef = useRef(null);

  // ── Load stats in background — page renders immediately ──────────────────
  useEffect(() => {
    dashboardApi.stats()
      .then(r => { setStats(r.data); setError(''); })
      .catch(e => setError(e.userMessage || e.response?.data?.message || 'Could not load dashboard data.'))
      .finally(() => setStatsLoading(false));

    fetch(`${API}/serial-number/`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setNextSerial(d.serialNumber || 1))
      .catch(() => {});
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setSearchRes(null); setSearchErr(''); return; }
    setSearching(true); setSearchErr('');
    try {
      const res  = await fetch(`${API}/house-search/?q=${encodeURIComponent(q)}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setSearchRes(data);
      else setSearchErr('Search failed.');
    } catch {
      setSearchErr('Network error. Make sure Django is running.');
    } finally { setSearching(false); }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 200);
  };

  const clearSearch = () => { setQuery(''); setSearchRes(null); setSearchErr(''); };

  const s        = stats || {};
  const coverage = s.totalVoters ? Math.min(100, ((s.totalReg / s.totalVoters) * 100).toFixed(1)) : 0;

  const wardData = Object.entries(s.wardCoverage || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, val]) => ({ name: name.length > 11 ? name.slice(0, 11) + '…' : name, value: +val.toFixed(1) }));

  const religionPie = Object.entries(s.voterReligion || {})
    .filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const STAT_CARDS = [
    { label: 'Total Surveys',  value: s.totalReg?.toLocaleString()   || null, icon: '✎', color: '#f59e0b', sub: 'Registered entries' },
    { label: 'Total Voters',   value: s.totalVoters?.toLocaleString() || null, icon: '◉', color: '#22d3ee', sub: 'Voter list records' },
    { label: 'Houses Covered', value: s.houseCount?.toLocaleString()  || null, icon: '⌂', color: '#10b981', sub: 'Unique households' },
    { label: 'Coverage',       value: stats ? `${coverage}%` : null,           icon: '◈', color: '#8b5cf6', sub: 'Survey completion' },
  ];

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner">

        {/* ── Search Bar ──────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom: 28 }}>
          <div style={{
            position: 'relative', background: 'rgba(17,28,52,0.8)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
            padding: '4px 6px 4px 16px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)',
          }}>
            <span style={{ fontSize: 18, color: 'var(--text-3)', flexShrink: 0 }}>⌕</span>
            <input
              value={query} onChange={handleQueryChange}
              placeholder="Search by Voter Name, Voter ID, House No or Relation Name…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-1)', padding: '10px 0' }}
            />
            {searching && <span className="spinner" style={{ flexShrink: 0 }} />}
            {query && !searching && (
              <button onClick={clearSearch} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                fontSize: 12, color: 'var(--text-2)', flexShrink: 0,
              }}>✕ Clear</button>
            )}
          </div>
          {!query && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {['Search by name', 'Search by Voter ID', 'Search by House No'].map(hint => (
                <span key={hint} style={{ fontSize: 11, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '3px 10px' }}>{hint}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── Search Results ──────────────────────────────────────────────── */}
        {(query || searchRes) && (
          <div ref={searchResultsRef} className="anim-fade-up" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                  Search Results
                  {searchRes && <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>{searchRes.total_houses} house{searchRes.total_houses !== 1 ? 's' : ''} found</span>}
                </h2>
                {query && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Showing results for "<span style={{ color: 'var(--gold)' }}>{query}</span>"</p>}
              </div>
            </div>
            {searchErr && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {searchErr}</div>}
            {searching && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 14 }}><span className="spinner" /> Searching…</div>}
            {!searching && searchRes && searchRes.total_houses === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--text-3)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No results found</div>
                <div style={{ fontSize: 13 }}>Try a different name, voter ID or house number</div>
              </div>
            )}
            {!searching && searchRes && searchRes.houses.map((house, idx) => {
              const prevCount = searchRes.houses.slice(0, idx).reduce((a, h) => a + (h.total_members || 0), 0);
              return <HouseCard key={house.house_no} house={house} serialCounter={nextSerial + prevCount} query={query} />;
            })}
          </div>
        )}

        {/* ── Dashboard content — renders immediately, stats fill in ─────── */}
        <>
          {/* Header */}
          <div className="page-header anim-fade-up">
            <span className="badge badge-cyan mb-8">Dashboard</span>
            <h1>{greeting}, {user?.username} 👋</h1>
            <p>Your constituency intelligence overview</p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

          {/* Stat cards — skeleton while loading, real values when ready */}
          <div className="grid-4 stagger mb-24">
            {STAT_CARDS.map(c => (
              statsLoading ? (
                <StatCardSkeleton key={c.label} />
              ) : (
                <div key={c.label} className="card stat-card">
                  <div className="stat-icon" style={{ background: `${c.color}18`, border: `1px solid ${c.color}28` }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                  </div>
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-value" style={{ color: c.color }}>{c.value ?? '—'}</div>
                  <div className="stat-sub">{c.sub}</div>
                </div>
              )
            ))}
          </div>

          {/* Coverage bar */}
          <div className="card card-pad mb-24 anim-fade-up">
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>Overall Survey Coverage</h2>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>Completion progress across all wards</p>
              </div>
              {statsLoading
                ? <Skeleton w={60} h={36} radius={8} />
                : <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--gold)' }}>{coverage}%</div>
              }
            </div>
            <div className="progress-track" style={{ height: 10 }}>
              {!statsLoading && <div className="progress-fill" style={{ width: `${coverage}%` }} />}
            </div>
            {!statsLoading && (
              <div className="flex justify-between mt-8">
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.totalReg?.toLocaleString()} surveyed</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.totalVoters?.toLocaleString()} total voters</span>
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="grid-2 mb-24 gap-20">
            <div className="card card-pad">
              <div className="section-head"><h2>Ward Coverage</h2><p>Survey completion % — top 10 wards</p></div>
              {statsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0' }}>
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={22} radius={4} style={{ width: `${80 - i * 8}%` }} />)}
                </div>
              ) : wardData.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><div className="empty-state-icon">📊</div><p>No ward data yet</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={wardData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8899bb', fontSize: 11 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#8899bb', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {wardData.map((e, i) => <Cell key={i} fill={e.value >= 70 ? '#10b981' : e.value >= 45 ? '#f59e0b' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card card-pad">
              <div className="section-head"><h2>Voter Demographics</h2><p>Religion-wise voter distribution</p></div>
              {statsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 230 }}>
                  <Skeleton w={160} h={160} radius={80} />
                </div>
              ) : religionPie.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><div className="empty-state-icon">🥧</div><p>No religion data yet</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={religionPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {religionPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => v.toLocaleString()} contentStyle={{ background: '#1a2847', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f0f4ff' }} />
                    <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, color: '#8899bb' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gender + Quick Actions */}
          <div className="grid-2 gap-20">
            <div className="card card-pad">
              <div className="section-head"><h2>Gender Breakdown</h2></div>
              {statsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton w="45%" h={12} />
                        <Skeleton w="20%" h={12} />
                      </div>
                      <Skeleton h={5} radius={3} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-col gap-16" style={{ display: 'flex' }}>
                  {[
                    { label: 'Male Voters',       val: s.voterMale,   total: s.totalVoters, color: '#22d3ee' },
                    { label: 'Female Voters',     val: s.voterFemale, total: s.totalVoters, color: '#ec4899' },
                    { label: 'Male Registered',   val: s.regMale,     total: s.totalReg,    color: '#22d3ee' },
                    { label: 'Female Registered', val: s.regFemale,   total: s.totalReg,    color: '#ec4899' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-4">
                        <span style={{ fontSize: 13, color: '#c0cce8', fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{(item.val || 0).toLocaleString()}</span>
                      </div>
                      <div className="progress-track" style={{ height: 5 }}>
                        <div className="progress-fill" style={{ width: item.total ? `${((item.val || 0) / item.total * 100).toFixed(0)}%` : '0%', background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card card-pad">
              <div className="section-head"><h2>Quick Actions</h2></div>
              <div className="flex-col gap-10" style={{ display: 'flex' }}>
                {[
                  { to: '/survey',  label: 'Start New Survey',         desc: 'Record constituency data', icon: '✎', color: '#f59e0b' },
                  { to: '/schemes', label: 'Check Scheme Eligibility',  desc: 'Find schemes for voters',  icon: '◈', color: '#10b981' },
                  { to: '/voters',  label: 'Search Voters',             desc: 'Browse voter registry',    icon: '◉', color: '#22d3ee' },
                  { to: '/data',    label: 'View All Data',             desc: 'Survey & voter datasets',  icon: '⊟', color: '#8b5cf6' },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                    borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)', textDecoration: 'none', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = `${item.color}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}18`, border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{item.desc}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 18 }}>›</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}