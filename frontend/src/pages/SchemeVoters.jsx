import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { schemeApi } from '../api/client';

const VOTER_KEYS = ['VoterID','House_No','MobileNumber','DOB','AGE','Gender','Religion','Community','EconomicStatus','EmploymentStatus','HealthStatus','HomeType'];

export default function SchemeVoters() {
  const { state }   = useLocation();
  const navigate    = useNavigate();
  const ward        = state?.ward;
  const wardName    = state?.wardName || `Ward ${ward}`;

  const [voters, setVoters]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]  = useState('');
  const [modal, setModal]    = useState(null);    // selected voter
  const [schemes, setSchemes] = useState([]);
  const [schemeBusy, setSchemeBusy] = useState(false);

  useEffect(() => {
    if (!ward) { navigate('/schemes'); return; }
    schemeApi.voterList(ward)
      .then(r => setVoters(r.data.voters || []))
      .catch(() => setVoters([]))
      .finally(() => setLoading(false));
  }, [ward, navigate]);

  const filtered = voters.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (v.Voter_Name||'').toLowerCase().includes(q)
      || (v.VoterID||'').toLowerCase().includes(q)
      || (v.House_No||'').toLowerCase().includes(q);
  });

  const openVoter = useCallback(async (voter) => {
    setModal(voter); setSchemes([]); setSchemeBusy(true);
    try {
      const { data } = await schemeApi.viewScheme(voter);
      setSchemes(data.schemes || []);
    } catch { setSchemes([]); }
    finally { setSchemeBusy(false); }
  }, []);

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner" style={{ maxWidth:1100 }}>
        <div className="page-header anim-fade-up">
          <button onClick={() => navigate('/schemes')}
            style={{ background:'none', border:'none', color:'var(--text-2)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            ← Back to Schemes
          </button>
          <span className="badge badge-cyan mb-8">Scheme Eligibility</span>
          <h1>Voters in {wardName}</h1>
          <p>{voters.length} voters loaded · Click any card to view scheme eligibility</p>
        </div>

        {/* Search */}
        <div className="search-bar mb-20 anim-fade-up">
          <span className="search-icon">⌕</span>
          <input className="input" placeholder="Search by name, voter ID or house number…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner spinner-lg" /><p>Loading voters…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◉</div>
            <h3>{search ? 'No matching voters' : 'No voters found'}</h3>
            <p>{search ? 'Try a different search term' : `No voter data for ward ${wardName}`}</p>
          </div>
        ) : (
          <div className="grid-auto stagger">
            {filtered.map((voter, i) => (
              <div key={voter.VoterID||i} className="card voter-card" onClick={() => openVoter(voter)}>
                <div className="voter-avatar" style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(34,211,238,0.2))', border:'1px solid rgba(245,158,11,0.2)', color:'var(--gold)' }}>
                  {(voter.Voter_Name||'?')[0]}
                </div>
                <div className="voter-info">
                  <div className="voter-name">{voter.Voter_Name}</div>
                  <div className="voter-id">{voter.VoterID}</div>
                  <div className="voter-meta">{voter.Religion} · {voter.EconomicStatus} · {voter.Gender}</div>
                </div>
                <span className="voter-arrow">›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-16">
                <div style={{ width:50, height:50, borderRadius:14, background:'linear-gradient(135deg,var(--gold),var(--cyan))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:900, fontSize:22, color:'#090e1c', flexShrink:0 }}>
                  {(modal.Voter_Name||'?')[0]}
                </div>
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800 }}>{modal.Voter_Name}</h2>
                  <div style={{ fontSize:14, color:'var(--cyan)' }}>{modal.VoterID}</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>

            <div className="modal-body">
              {/* Voter details */}
              <div className="detail-grid mb-20">
                {VOTER_KEYS.filter(k => modal[k]).map(k => (
                  <div key={k} className="detail-item">
                    <div className="detail-key">{k.replace(/_/g,' ')}</div>
                    <div className="detail-val">{modal[k]||'—'}</div>
                  </div>
                ))}
              </div>

              <hr className="divider" />
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:14 }}>Eligible Schemes</h3>

              {schemeBusy ? (
                <div className="loading-center" style={{ padding:30 }}><span className="spinner" /></div>
              ) : schemes.length === 0 ? (
                <div className="alert alert-info">No eligible schemes found for this voter's profile.</div>
              ) : (
                <div className="flex-col gap-12" style={{ display:'flex' }}>
                  {schemes.map((s,i) => (
                    <div key={i} className="scheme-card">
                      <div className="flex justify-between items-center mb-8">
                        <h4>{s.Name}</h4>
                        <span className="badge badge-cyan">{s.Type}</span>
                      </div>
                      <div className="ministry">Ministry: {s.Ministry}</div>
                      <div className="desc">{s.Description}</div>
                      {s.Link && (
                        <button className="btn btn-outline btn-sm" style={{ marginTop:12 }}
                          onClick={() => window.open(s.Link,'_blank')}>
                          Know More →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
