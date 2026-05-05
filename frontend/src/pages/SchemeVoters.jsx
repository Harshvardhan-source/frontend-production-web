import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { schemeApi } from '../api/client';

// Keys shown in the voter detail grid inside the modal.
// PhysicalStatus is kept for display; DifferentlyAbled is sent to backend for matching.
const VOTER_KEYS = [
  'VoterID', 'House_No', 'MobileNumber', 'DOB', 'AGE', 'Gender',
  'Religion', 'Community', 'SubCategory', 'EconomicStatus',
  'EmploymentStatus', 'EmploymentType', 'HealthStatus', 'PhysicalStatus',
  'HomeType', 'MaritalStatus', 'Education', 'EducationType',
  'AnnualIncome', 'WardNumber', 'BoothNo',
];

// Keys sent to the backend for scheme eligibility matching.
// Community is sent raw (e.g. "General"); the backend maps it to "GC".
// PhysicalStatus is renamed to DifferentlyAbled by the backend normalizer.
const SCHEME_MATCH_KEYS = [
  'Gender', 'MaritalStatus', 'EconomicStatus', 'EmploymentStatus',
  'EmploymentType', 'Religion', 'Community', 'SubCategory', 'Education',
  'EducationType', 'PhysicalStatus', 'HealthStatus', 'HomeType', 'AGE',
];

export default function SchemeVoters() {
  const { state }   = useLocation();
  const navigate    = useNavigate();
  const ward        = state?.ward;
  const wardName    = state?.wardName || `Ward ${ward}`;

  const [voters,     setVoters]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(null);   // selected voter
  const [schemes,    setSchemes]    = useState([]);
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
    return (v.Voter_Name || '').toLowerCase().includes(q)
      || (v.VoterID     || '').toLowerCase().includes(q)
      || (v.House_No    || '').toLowerCase().includes(q);
  });

  const openVoter = useCallback(async (voter) => {
    setModal(voter);
    setSchemes([]);
    setSchemeBusy(true);
    try {
      // Send only the matching keys; backend normalizes community + field names
      const voterData = {};
      SCHEME_MATCH_KEYS.forEach(k => { if (voter[k] !== undefined) voterData[k] = voter[k]; });
      // 2705 CRITICAL FIX: wrap under voterData key — backend does body.get("voterData", {})
      console.log("[SchemeVoters] sending voterData:", voterData);
      const { data } = await schemeApi.viewScheme({ voterData });
      console.log("[SchemeVoters] schemes received:", data.schemes?.length ?? 0);
      setSchemes(data.schemes || []);
    } catch {
      setSchemes([]);
    } finally {
      setSchemeBusy(false);
    }
  }, []);

  // ── label helper: camelCase/PascalCase → readable label ─────────────────────
  const label = key => key.replace(/_/g, ' ');

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div className="page-header anim-fade-up">
          <button
            onClick={() => navigate('/schemes')}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}
          >
            ← Back to Schemes
          </button>
          <span className="badge badge-cyan mb-8">Scheme Eligibility</span>
          <h1>Voters in {wardName}</h1>
          <p>{voters.length} voters loaded · Click any card to view scheme eligibility</p>
        </div>

        {/* Search */}
        <div className="search-bar mb-20 anim-fade-up">
          <span className="search-icon">⌕</span>
          <input
            className="input"
            placeholder="Search by name, voter ID or house number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-center">
            <span className="spinner spinner-lg" />
            <p>Loading voters…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◉</div>
            <h3>{search ? 'No matching voters' : 'No voters found'}</h3>
            <p>{search ? 'Try a different search term' : `No voter data for ward ${wardName}`}</p>
          </div>
        ) : (
          <div className="grid-auto stagger">
            {filtered.map((voter, i) => (
              <div
                key={voter.VoterID || i}
                className="card voter-card"
                onClick={() => openVoter(voter)}
              >
                <div
                  className="voter-avatar"
                  style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(34,211,238,0.2))', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--gold)' }}
                >
                  {(voter.Voter_Name || '?')[0]}
                </div>
                <div className="voter-info">
                  <div className="voter-name">{voter.Voter_Name}</div>
                  <div className="voter-id">{voter.VoterID}</div>
                  <div className="voter-meta">
                    {voter.Religion} · {voter.EconomicStatus} · {voter.Gender} · Age {voter.AGE}
                  </div>
                </div>
                <span className="voter-arrow">›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal">

            {/* Modal header */}
            <div className="modal-header">
              <div className="flex items-center gap-16">
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg,var(--gold),var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22, color: '#090e1c', flexShrink: 0 }}>
                  {(modal.Voter_Name || '?')[0]}
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>
                    {modal.Voter_Name}
                  </h2>
                  <div style={{ fontSize: 14, color: 'var(--cyan)' }}>{modal.VoterID}</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>

            <div className="modal-body">

              {/* Voter detail grid */}
              <div className="detail-grid mb-20">
                {VOTER_KEYS.filter(k => modal[k] && modal[k] !== '').map(k => (
                  <div key={k} className="detail-item">
                    <div className="detail-key">{label(k)}</div>
                    <div className="detail-val">{modal[k]}</div>
                  </div>
                ))}
              </div>

              {/* Schemes already used */}
              {Array.isArray(modal.SchemesUsed) && modal.SchemesUsed.length > 0 && (
                <>
                  <hr className="divider" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
                    Schemes Already Used
                  </h3>
                  <div className="flex-col gap-8" style={{ display: 'flex', marginBottom: 16 }}>
                    {modal.SchemesUsed.map((s, i) => (
                      <div key={i} className="alert alert-info" style={{ padding: '6px 12px', fontSize: 13 }}>
                        ✓ {s}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <hr className="divider" />

              {/* Eligible schemes */}
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                Eligible Schemes
              </h3>

              {schemeBusy ? (
                <div className="loading-center" style={{ padding: 30 }}>
                  <span className="spinner" />
                </div>
              ) : schemes.length === 0 ? (
                <div className="alert alert-info">
                  No eligible schemes found for this voter's profile.
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
                    {schemes.length} scheme{schemes.length !== 1 ? 's' : ''} found
                  </p>
                  <div className="flex-col gap-12" style={{ display: 'flex' }}>
                    {schemes.map((s, i) => (
                      <div key={i} className="scheme-card">
                        <div className="flex justify-between items-center mb-8">
                          <h4>{s.Name}</h4>
                          <span className="badge badge-cyan">{s.Type}</span>
                        </div>
                        <div className="ministry">Ministry: {s.Ministry}</div>
                        <div className="desc">{s.Description}</div>
                        {s.Link && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ marginTop: 12 }}
                            onClick={() => window.open(s.Link, '_blank')}
                          >
                            Know More →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
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