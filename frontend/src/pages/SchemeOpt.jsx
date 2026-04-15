import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { wardsApi } from '../api/client';

const SCHEME_CATS = [
  { icon:'🏛', title:'Central Schemes',   desc:'PM-led national welfare programs' },
  { icon:'🌿', title:'State Schemes',     desc:'Karnataka government benefits' },
  { icon:'💰', title:'Financial Aid',     desc:'Income & livelihood support' },
  { icon:'🏥', title:'Health Schemes',    desc:'Medical & insurance coverage' },
  { icon:'📚', title:'Education Grants',  desc:'Scholarships & student support' },
  { icon:'🏠', title:'Housing Schemes',   desc:'Affordable housing assistance' },
];

export default function SchemeOpt() {
  const [ward, setWard]   = useState('');
  const [wards, setWards] = useState([]);
  const navigate          = useNavigate();

  useEffect(() => { wardsApi.list().then(r => setWards(r.data.wards)).catch(()=>{}); }, []);

  const selected = wards.find(w => w.number === parseInt(ward));

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner" style={{ maxWidth:700 }}>
        <div className="page-header anim-fade-up">
          <span className="badge badge-cyan mb-8">Scheme Module</span>
          <h1>Checkout Schemes</h1>
          <p>Select a ward to view voters and their scheme eligibility</p>
        </div>

        <div className="card card-pad anim-fade-up mb-20">
          <div className="field mb-20">
            <label className="field-label">Select Ward</label>
            <select className="input" value={ward} onChange={e => setWard(e.target.value)} style={{ marginTop:8 }}>
              <option value="">— Choose a ward —</option>
              {wards.map(w => <option key={w.number} value={w.number}>{w.name} (Ward {w.number})</option>)}
            </select>
          </div>

          {selected && (
            <div className="alert alert-info mb-20">
              ✓ Selected: <strong>{selected.name}</strong> — Ward #{selected.number}
            </div>
          )}

          <button className="btn btn-primary btn-lg btn-full" disabled={!ward}
            onClick={() => navigate('/schemes/voters', { state: { ward, wardName: selected?.name } })}>
            View Eligible Voters →
          </button>
        </div>

        <div className="grid-3 stagger">
          {SCHEME_CATS.map(c => (
            <div key={c.title} className="card card-pad">
              <div style={{ fontSize:28, marginBottom:12 }}>{c.icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--text-1)', marginBottom:4 }}>{c.title}</div>
              <div style={{ fontSize:12, color:'var(--text-2)' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
