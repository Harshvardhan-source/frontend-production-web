import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import Navbar from '../components/Navbar';
import { dataApi } from '../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const VOTER_PER_PAGE  = 100;   // cards per page — loads fast, feels paginated
const SURVEY_PER_PAGE = 100;
const SEARCH_DELAY_MS = 350;   // debounce delay for search input

const AVATAR_COLORS = [
  '#c9a227','#2ec4b6','#6c63ff','#e07c5b',
  '#4caf82','#e05b8a','#0ea5e9','#a855f7',
];

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON CARD — shown while loading
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', padding: '14px 16px',
      animation: 'pulse 1.4s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1 }
          50%      { opacity:0.4 }
        }
      `}</style>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.08)', flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ height:13, background:'rgba(255,255,255,0.08)', borderRadius:6, width:'70%', marginBottom:6 }}/>
          <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:6, width:'45%' }}/>
        </div>
        <div style={{ width:28, height:18, borderRadius:10, background:'rgba(255,255,255,0.06)' }}/>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {[60,45,50,40].map(w => (
          <div key={w} style={{ height:18, width:w, background:'rgba(255,255,255,0.05)', borderRadius:6 }}/>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOTER DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function VoterModal({ voter, onClose }) {
  if (!voter) return null;

  const name    = voter['Name']    || '—';
  const voterId = voter['Epic NO'] || '—';
  const initial = name.trim()[0]?.toUpperCase() || '?';
  const skipKeys = new Set(['Name', 'Epic NO']);
  const details  = Object.entries(voter).filter(([k]) => !skipKeys.has(k) && voter[k] !== '' && voter[k] != null);

  // Close on Escape key
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(5px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-surface)', border:'1px solid var(--border)',
        borderRadius:'var(--r-lg)', width:'100%', maxWidth:500,
        maxHeight:'85vh', overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,0.55)',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', gap:14,
          padding:'18px 22px', borderBottom:'1px solid var(--border)',
          position:'sticky', top:0, background:'var(--bg-surface)', zIndex:2,
        }}>
          <div style={{
            width:46, height:46, borderRadius:13, flexShrink:0,
            background:'var(--gold)', color:'#090e1c',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:19,
          }}>{initial}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:16, color:'var(--text-1)', lineHeight:1.2 }}>{name}</div>
            <div style={{ fontSize:12, color:'var(--gold)', fontFamily:'monospace', marginTop:3 }}>{voterId}</div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.07)', border:'none',
            borderRadius:8, width:32, height:32, cursor:'pointer',
            color:'var(--text-2)', fontSize:20,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>×</button>
        </div>

        {/* Details */}
        <div style={{ padding:'6px 22px 22px' }}>
          {details.map(([k, v]) => (
            <div key={k} style={{
              display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', gap:16,
            }}>
              <span style={{ fontSize:13, color:'var(--text-2)', flexShrink:0 }}>{k}</span>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', textAlign:'right', wordBreak:'break-word' }}>
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOTER CARD — memo so unchanged cards don't re-render on page changes
// ─────────────────────────────────────────────────────────────────────────────
const VoterCard = memo(function VoterCard({ voter, onClick }) {
  const name   = voter['Name']          || '—';
  const epicNo = voter['Epic NO']       || '—';
  const house  = voter['House No']      || '';
  const gender = voter['Gender']        || '';
  const age    = voter['Age']           || '';
  const booth  = voter['Booth No']      || '';
  const ward   = voter['Part No']       || '';
  const rel    = voter['Relation Name'] || '';

  const initial = name.trim()[0]?.toUpperCase() || '?';
  const color   = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const isMale  = gender.toUpperCase() === 'M' || gender.toLowerCase() === 'male';

  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)',
        padding: '13px 15px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:9 }}>
        <div style={{
          width:36, height:36, borderRadius:9, flexShrink:0,
          background:color, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, fontSize:14,
        }}>{initial}</div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontWeight:700, fontSize:13, color:'var(--text-1)',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
          }}>{name}</div>
          <div style={{ fontSize:11, color:'var(--gold)', fontFamily:'monospace', marginTop:2, letterSpacing:'0.3px' }}>
            {epicNo}
          </div>
        </div>

        {gender && (
          <div style={{
            fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:9, flexShrink:0,
            background: isMale ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
            color:      isMale ? '#60a5fa'               : '#f472b6',
            border:     `1px solid ${isMale ? 'rgba(59,130,246,0.3)' : 'rgba(236,72,153,0.3)'}`,
          }}>
            {isMale ? '♂ M' : '♀ F'}
          </div>
        )}
      </div>

      {/* Chips row */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {house && <Chip icon="🏠" label={house}/>}
        {age   && <Chip label={`Age ${age}`}/>}
        {booth && <Chip label={`Booth ${booth}`}/>}
        {ward  && <Chip label={`Ward ${ward}`}/>}
        {rel   && <Chip label={rel} maxW={110}/>}
      </div>
    </div>
  );
});

function Chip({ icon, label, maxW }) {
  return (
    <span style={{
      fontSize:10, color:'var(--text-3)',
      background:'rgba(255,255,255,0.06)',
      padding:'2px 7px', borderRadius:5,
      maxWidth: maxW || 'none',
      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
    }}>
      {icon && `${icon} `}{label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATOR
// ─────────────────────────────────────────────────────────────────────────────
function Paginator({ page, pages, onPage }) {
  if (pages <= 1) return null;

  // Show window of 5 pages around current
  const start = Math.max(1, Math.min(pages - 4, page - 2));
  const nums  = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i).filter(p => p <= pages);

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)',
      gap:8, flexWrap:'wrap',
    }}>
      <button className="btn btn-ghost btn-sm" disabled={page === 1}    onClick={() => onPage(page-1)}>← Prev</button>

      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {start > 1 && <>
          <PgBtn p={1}     cur={page} onPage={onPage}/>
          {start > 2 && <span style={{ color:'var(--text-3)', fontSize:13 }}>…</span>}
        </>}
        {nums.map(p => <PgBtn key={p} p={p} cur={page} onPage={onPage}/>)}
        {start + 4 < pages && <>
          {start + 5 < pages && <span style={{ color:'var(--text-3)', fontSize:13 }}>…</span>}
          <PgBtn p={pages} cur={page} onPage={onPage}/>
        </>}
      </div>

      <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => onPage(page+1)}>Next →</button>
    </div>
  );
}

function PgBtn({ p, cur, onPage }) {
  return (
    <button onClick={() => onPage(p)} style={{
      width:34, height:34, borderRadius:'var(--r-sm)', border:'none',
      cursor:'pointer', fontWeight:600, fontSize:13,
      background: p === cur ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
      color:      p === cur ? '#090e1c'     : 'var(--text-2)',
      transition: 'background 0.15s',
    }}>{p}</button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DataView
// ─────────────────────────────────────────────────────────────────────────────
export default function DataView() {
  const [tab,            setTab]            = useState('voter');
  const [rows,           setRows]           = useState([]);
  const [cols,           setCols]           = useState([]);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(1);
  const [pages,          setPages]          = useState(1);
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(false);
  const [skelCount,      setSkelCount]      = useState(0);  // skeleton cards while loading
  const [error,          setError]          = useState('');
  const [uploading,      setUploading]      = useState(false);
  const [uploadMsg,      setUploadMsg]      = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedVoter,  setSelectedVoter]  = useState(null);
  const [debugInfo,      setDebugInfo]      = useState({});

  const loadRef   = useRef(0);
  const debouncer = useRef(null);
  const gridRef   = useRef(null);

  // ── Core load function ──────────────────────────────────────────────────────
  const load = useCallback((viewType, pg, q) => {
    const callId   = ++loadRef.current;
    const perPage  = viewType === 'voter' ? VOTER_PER_PAGE : SURVEY_PER_PAGE;

    setLoading(true);
    setError('');
    // Show skeleton cards immediately so layout doesn't jump
    setSkelCount(viewType === 'voter' ? VOTER_PER_PAGE : 10);

    dataApi.view({ view: viewType, page: pg, per_page: perPage, search: q })
      .then(r => {
        if (callId !== loadRef.current) return;
        if (r.data.success === false) {
          setError(r.data.message || 'Failed to load data.');
          setRows([]); setCols([]);
        } else {
          setRows(r.data.data    || []);
          setCols(r.data.columns || []);
          setTotal(r.data.total  || 0);
          setPage(r.data.page    || pg);
          setPages(r.data.pages  || 1);
          setDebugInfo({ collection: r.data.collection, search: r.data.search, total: r.data.total });
        }
      })
      .catch(err => {
        if (callId !== loadRef.current) return;
        setError(
          err.userMessage ||
          err.response?.data?.message ||
          'Could not load data. Check Django terminal for errors.'
        );
        setRows([]); setCols([]);
      })
      .finally(() => {
        if (callId === loadRef.current) {
          setLoading(false);
          setSkelCount(0);
        }
      });
  }, []);

  // Reset and load when tab changes
  useEffect(() => {
    setPage(1); setSearch(''); setRows([]); setCols([]);
    load(tab, 1, '');
  }, [tab]); // eslint-disable-line

  // ── Search handlers ─────────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(debouncer.current);
    debouncer.current = setTimeout(() => { setPage(1); load(tab, 1, q); }, SEARCH_DELAY_MS);
  };

  const handleSearch = () => {
    clearTimeout(debouncer.current);
    setPage(1); load(tab, 1, search);
  };

  // ── Page change — scroll grid back to top ───────────────────────────────────
  const handlePage = (p) => {
    setPage(p);
    load(tab, p, search);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setUploadMsg('');
    setUploadProgress(`Reading: ${(file.size / 1024 / 1024).toFixed(1)} MB…`);
    try {
      setUploadProgress('Uploading to MongoDB…');
      const { data } = await dataApi.upload(file);
      setUploadProgress('');
      setUploadMsg(data.message || 'Uploaded successfully.');
      load(tab, 1, '');
    } catch (err) {
      setUploadProgress('');
      setUploadMsg(err.userMessage || err.response?.data?.message || `Upload failed: ${err.message}`);
    } finally { setUploading(false); e.target.value = ''; }
  };

  // ── CSV export (current page only) ─────────────────────────────────────────
  const downloadCSV = () => {
    if (!rows.length) return;
    const header = cols.join(',');
    const body   = rows.map(r =>
      cols.map(c => `"${(r[c] || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${tab}_page${page}.csv`; a.click();
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const showSkeletons = loading && tab === 'voter';
  const from = (page - 1) * VOTER_PER_PAGE + 1;
  const to   = Math.min(page * VOTER_PER_PAGE, total);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <Navbar />
      <VoterModal voter={selectedVoter} onClose={() => setSelectedVoter(null)} />

      <div className="page-inner" style={{ maxWidth: 1400 }}>

        {/* ── Page header ── */}
        <div className="page-header anim-fade-up">
          <span className="badge badge-gold mb-8">Data Explorer</span>
          <h1>View &amp; Export Data</h1>
          <p>Browse survey records and voter list data from MongoDB</p>
        </div>

        {/* ── Controls row ── */}
        <div className="flex items-center gap-12 mb-20 anim-fade-up" style={{ flexWrap:'wrap' }}>

          {/* Tab switcher */}
          <div style={{
            display:'flex', gap:4,
            background:'rgba(255,255,255,0.04)', padding:4,
            borderRadius:'var(--r-md)', border:'1px solid var(--border)',
          }}>
            {['survey','voter'].map(t => (
              <button key={t}
                onClick={() => {
                  if (t === tab) return;
                  setTab(t); setSearch(''); setError('');
                  setUploadMsg(''); setUploadProgress(''); setSelectedVoter(null);
                }}
                style={{
                  padding:'8px 20px', borderRadius:'var(--r-sm)', border:'none',
                  cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:600,
                  fontSize:14, transition:'all 0.2s',
                  background: tab === t ? 'var(--gold)' : 'transparent',
                  color:      tab === t ? '#090e1c'     : 'var(--text-2)',
                }}>
                {t === 'survey' ? '✎ Survey Data' : '◉ Voter List'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="search-bar flex-1" style={{ minWidth:220 }}>
            <span className="search-icon">⌕</span>
            <input
              className="input"
              placeholder={tab === 'voter' ? 'Search by name, EPIC, house no…' : 'Search survey data…'}
              value={search}
              onChange={handleSearchChange}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <button className="btn btn-outline" onClick={handleSearch} disabled={loading}>
            {loading ? <span className="spinner"/> : 'Search'}
          </button>
          <button className="btn btn-outline" onClick={downloadCSV} disabled={!rows.length}>↓ CSV</button>

          {tab === 'voter' && (
            <label className="btn btn-ghost" style={{ cursor: uploading ? 'not-allowed':'pointer', opacity: uploading ? 0.7:1 }}>
              {uploading ? <><span className="spinner" style={{ marginRight:8 }}/>Uploading…</> : '↑ Upload'}
              <input type="file" accept=".csv,.xlsx,.xls" hidden disabled={uploading} onChange={handleUpload}/>
            </label>
          )}
        </div>

        {/* ── Upload feedback ── */}
        {uploadProgress && (
          <div className="alert alert-info mb-12" style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span className="spinner"/>
            <div>
              <div style={{ fontWeight:600, marginBottom:2 }}>{uploadProgress}</div>
              <div style={{ fontSize:12, opacity:0.75 }}>Large files may take 10–30 s. Please wait…</div>
            </div>
          </div>
        )}
        {uploadMsg && (
          <div className={`alert ${uploadMsg.toLowerCase().includes('success') ? 'alert-success':'alert-error'} mb-16`}>
            {uploadMsg.toLowerCase().includes('success') ? '✓ ':'⚠ '}{uploadMsg}
          </div>
        )}

        {/* ── Stats bar ── */}
        {!error && (total > 0 || rows.length > 0) && (
          <div className="flex items-center gap-8 mb-12" style={{ flexWrap:'wrap' }}>
            {total > 0 && <span className="badge badge-gold">{total.toLocaleString()} total</span>}
            {tab === 'voter' && rows.length > 0 && !loading && (
              <span className="badge badge-cyan">
                {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
              </span>
            )}
            {tab === 'survey' && cols.length > 0 && (
              <span className="badge badge-green">{cols.length} columns</span>
            )}
            {search && <span className="badge badge-cyan">Filtered: "{search}"</span>}
            <span style={{ fontSize:13, color:'var(--text-2)' }}>
              {tab === 'voter'
                ? `Page ${page} of ${pages} · ${VOTER_PER_PAGE} cards/page`
                : `Page ${page} of ${pages}`}
            </span>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            VOTER LIST TAB — card grid with skeleton + real pagination
        ════════════════════════════════════════════════════════════════════ */}
        {tab === 'voter' && (
          <div className="card anim-fade-up" style={{ overflow:'hidden' }} ref={gridRef}>

            {/* Error state */}
            {!loading && error && (
              <div style={{ padding:28 }}>
                <div className="alert alert-error mb-16">⚠ {error}</div>
                <button className="btn btn-primary" onClick={() => load('voter', page, search)}>↻ Retry</button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && rows.length === 0 && skelCount === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🗳️</div>
                <h3>{search ? `No results for "${search}"` : 'No voters found'}</h3>
                <p style={{ maxWidth:460, lineHeight:1.7 }}>
                  {search
                    ? `No voter matched "${search}". Try searching by full name, EPIC number (e.g. KA/05/123), or house number.`
                    : 'The SurveyDataBase.2025 collection appears empty. Upload a voter list using the Upload button above.'}
                </p>
                {debugInfo.collection && (
                  <div style={{ marginTop:14, fontSize:12, color:'var(--text-3)', background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 14px', display:'inline-block' }}>
                    Queried: <code style={{ color:'var(--gold)' }}>{debugInfo.collection}</code>
                    {' · '}Total in DB: <code style={{ color:'var(--cyan)' }}>{debugInfo.total ?? 0}</code>
                  </div>
                )}
                {search && (
                  <button className="btn btn-ghost" style={{ marginTop:14 }}
                    onClick={() => { setSearch(''); load('voter', 1, ''); }}>
                    ✕ Clear search — show all voters
                  </button>
                )}
              </div>
            )}

            {/* Card grid — shows skeletons while loading, real cards after */}
            {(showSkeletons || rows.length > 0) && (
              <div style={{ padding:20 }}>
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',
                  gap:12,
                }}>
                  {showSkeletons
                    ? Array.from({ length: Math.min(skelCount, 24) }).map((_, i) => <SkeletonCard key={i}/>)
                    : rows.map((voter, i) => (
                        <VoterCard
                          key={voter['Epic NO'] || i}
                          voter={voter}
                          onClick={() => setSelectedVoter(voter)}
                        />
                      ))
                  }
                </div>

                {!loading && <Paginator page={page} pages={pages} onPage={handlePage}/>}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SURVEY DATA TAB — table with edit column
        ════════════════════════════════════════════════════════════════════ */}
        {tab === 'survey' && (
          <div className="card anim-fade-up" style={{ overflow:'hidden' }}>

            {loading && (
              <div className="loading-center">
                <span className="spinner spinner-lg"/>
                <p>Loading SurveyRecords from MongoDB…</p>
              </div>
            )}

            {!loading && error && (
              <div style={{ padding:28 }}>
                <div className="alert alert-error mb-16">⚠ {error}</div>
                <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', borderRadius:10, fontSize:13, color:'#6b7fa0', lineHeight:1.9 }}>
                  <strong style={{ color:'#8899bb' }}>Common causes:</strong><br/>
                  1. MongoDB URL wrong in <code>backend/telusko/settings.py</code><br/>
                  2. Collection name mismatch — DB must have <code>SurveyRecords</code><br/>
                  3. MongoDB Atlas IP whitelist blocking server — add <code>0.0.0.0/0</code><br/>
                  4. Check Django terminal for the exact Python traceback
                </div>
                <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => load('survey', page, search)}>↻ Retry</button>
              </div>
            )}

            {!loading && !error && rows.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No records found</h3>
                <p>{search ? `No results for "${search}"` : 'The SurveyRecords collection in MongoDB is empty'}</p>
                {search && (
                  <button className="btn btn-ghost" style={{ marginTop:12 }}
                    onClick={() => { setSearch(''); load('survey', 1, ''); }}>Clear search</button>
                )}
              </div>
            )}

            {!loading && !error && rows.length > 0 && (
              <>
                <div className="table-wrap" style={{ maxHeight:'62vh', overflowY:'auto' }}>
                  <table>
                    <thead style={{ position:'sticky', top:0, background:'var(--bg-surface)', zIndex:5 }}>
                      <tr>
                        {cols.map(c => <th key={c}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i}>
                          {cols.map(c => (
                            <td key={c} title={String(row[c] ?? '')}>
                              {row[c] !== undefined && row[c] !== null && row[c] !== ''
                                ? String(row[c]) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)' }}>
                    <Paginator page={page} pages={pages} onPage={handlePage}/>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}