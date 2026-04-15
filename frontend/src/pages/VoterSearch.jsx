import React, { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { voterApi } from '../api/client';

const TABS = ['Basic Details','Family Members'];
const BASIC_KEYS = [['House_No','House No'],['Booth_No','Booth No'],['Gender','Gender'],['Age','Age'],['Religion','Religion'],['Relation_Name','Relation']];

export default function VoterSearch() {
  const [query, setQuery]     = useState('');
  const [voters, setVoters]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [modal, setModal]     = useState(null);
  const [family, setFamily]   = useState([]);
  const [famLoading, setFamLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const doSearch = useCallback(async (q, pg=1) => {
    if (!q.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const { data } = await voterApi.search(q, pg);
      setVoters(data.voters || []);
      setTotal(data.total || 0);
      setPage(pg);
    } catch { setVoters([]); }
    finally { setLoading(false); }
  }, []);

  const openModal = async (voter) => {
    setModal(voter); setActiveTab(0); setFamily([]); setFamLoading(true);
    const houseNo = voter.House_No || voter['House No'] || '';
    if (houseNo) {
      try {
        const { data } = await voterApi.family(houseNo);
        setFamily(data.family || []);
      } catch { setFamily([]); }
    }
    setFamLoading(false);
  };

  const genderColor = (g) => (g==='M'||g==='Male') ? 'var(--cyan)' : 'var(--gold)';
  const genderLabel = (g) => g==='M'?'Male':g==='F'?'Female':g||'—';

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner" style={{ maxWidth:1100 }}>
        <div className="page-header anim-fade-up">
          <span className="badge badge-green mb-8">Voter Registry</span>
          <h1>Search Voters</h1>
          <p>Find voters by name, voter ID, or house number</p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-12 mb-28 anim-fade-up">
          <div className="search-bar flex-1">
            <span className="search-icon">⌕</span>
            <input className="input" style={{ fontSize:16 }} placeholder="Search name, voter ID, house number…"
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key==='Enter' && doSearch(query)} />
          </div>
          <button className="btn btn-primary" style={{ padding:'12px 28px' }}
            onClick={() => doSearch(query)} disabled={loading || !query.trim()}>
            {loading ? <span className="spinner" /> : 'Search'}
          </button>
        </div>

        {/* Results */}
        {!searched ? (
          <div className="empty-state anim-fade-up">
            <div className="empty-state-icon" style={{ fontSize:64 }}>◉</div>
            <h3>Search the voter registry</h3>
            <p>Type a name, voter ID, or house number and press Search</p>
          </div>
        ) : loading ? (
          <div className="loading-center"><span className="spinner spinner-lg" /><p>Searching…</p></div>
        ) : voters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No voters found</h3>
            <p>Try a different search term</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-8 mb-16">
              <span className="badge badge-green">{total.toLocaleString()} results found</span>
            </div>
            <div className="grid-auto stagger">
              {voters.map((voter, i) => (
                <div key={voter.VoterID||i} className="card voter-card" onClick={() => openModal(voter)}>
                  <div className="voter-avatar" style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(34,211,238,0.15))', border:'1px solid rgba(16,185,129,0.25)', color:'var(--green)' }}>
                    {(voter.Voter_Name||'?')[0]}
                  </div>
                  <div className="voter-info">
                    <div className="voter-name">{voter.Voter_Name}</div>
                    <div className="voter-id">{voter.VoterID}</div>
                    <div className="voter-meta">House: {voter.House_No||'—'} · {voter.Religion||'—'}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                    <span className="badge" style={{ background:`${genderColor(voter.Gender)}18`, color:genderColor(voter.Gender), border:`1px solid ${genderColor(voter.Gender)}28`, fontSize:10 }}>{genderLabel(voter.Gender)}</span>
                    <span className="voter-arrow">›</span>
                  </div>
                </div>
              ))}
            </div>

            {total > voters.length && (
              <div style={{ textAlign:'center', marginTop:24 }}>
                <button className="btn btn-ghost" onClick={() => doSearch(query, page+1)}>Load More</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-16">
                <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,var(--green),var(--cyan))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:900, fontSize:23, color:'#090e1c', flexShrink:0 }}>
                  {(modal.Voter_Name||'?')[0]}
                </div>
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800 }}>{modal.Voter_Name}</h2>
                  <div style={{ fontSize:14, color:'var(--cyan)', marginTop:2 }}>{modal.VoterID}</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ padding:'0 26px' }}>
              {TABS.map((t,i) => (
                <button key={t} className={`tab-btn ${activeTab===i?'active':''}`} onClick={() => setActiveTab(i)}>{t}</button>
              ))}
            </div>

            <div className="modal-body">
              {activeTab===0 && (
                <div className="detail-grid">
                  {BASIC_KEYS.map(([k,label]) => (
                    <div key={k} className="detail-item">
                      <div className="detail-key">{label}</div>
                      <div className="detail-val">{modal[k]||modal[k.replace('_',' ')]||'—'}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab===1 && (
                famLoading ? (
                  <div className="loading-center" style={{ padding:24 }}><span className="spinner" /></div>
                ) : family.length===0 ? (
                  <div className="alert alert-info">No family members linked to this voter's house number.</div>
                ) : (
                  <div className="flex-col gap-10" style={{ display:'flex' }}>
                    {family.map((m,i) => (
                      <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:'var(--r-md)', padding:'14px 16px', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:'var(--gold-dim)', border:'1px solid var(--gold-glow)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:800, color:'var(--gold)', flexShrink:0 }}>
                          {(m['Voter_Name']||m['Voter Name']||'?')[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, color:'var(--text-1)', fontSize:14 }}>{m['Voter_Name']||m['Voter Name']||'—'}</div>
                          <div style={{ fontSize:12, color:'var(--text-2)' }}>{m['VoterID']||m['Voter ID']||'—'} · {genderLabel(m.Gender)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setModal(null); window.location.href='/survey'; }}>
                Start Survey →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
