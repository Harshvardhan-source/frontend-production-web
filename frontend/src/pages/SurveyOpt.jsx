import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { surveyApi } from '../api/client';

const WARD_BOOTHS = {
  "ALAPE NORTH":        [44,189,191,190,192,197,45],
  "ALAPE SOUTH":        [188,187,186,185,184,209,210],
  "ATHAVARA":           [152,151,242,243,221,222,153],
  "BAJAL":              [202,201,203,204,206,205,207,208],
  "BEJAI":              [15,16,18,19,23,21,20],
  "BENDOOR":            [162,163,134,136,129,167],
  "BENGRE":             [94,95,96,99,97,100,98,101,103,102],
  "BOLAR":              [237,238,236,230,231,225],
  "BOLOOR":             [93,92,91,82,79,78],
  "BUNDER":             [115,116,117,118,112,119],
  "CENTRAL":            [120,121,124,123,122],
  "CONTONMENT":         [150,137,145,146,141],
  "COURT":              [143,127,126,125,142],
  "DEREBAIL NAIRUTHYA": [4,90,89,86,85,87,88,10],
  "DEREBAIL SOUTH":     [17,11,12,8,9,14,13],
  "DEREBAIL WEST":      [5,1,2,3,7,6],
  "DONGARAKERY":        [114,73,74,111,108,113,71],
  "FALNIR":             [159,161,160,158,168,169,171,170],
  "HOIGE BAZAR":        [239,235,232,229,233],
  "JAPPIMOGAR":         [213,217,214,218,212,211,215,216,244],
  "JEPPU":              [240,219,220,241,156,157,155,154],
  "KADRI NORTH":        [62,63,30,27,28,29],
  "KADRI SOUTH":        [59,61,60,57],
  "KAMBALA":            [69,68,67,66,70],
  "KANKANADY":          [176,175,182,181,177,178,179,180],
  "KANNUR":             [193,198,195,199,196,200,194],
  "KODIALBAIL":         [65,64,26,24,25,22],
  "KUDROLI":            [107,106,109,110,104,105],
  "MANGALADEVI":        [147,228,227,226,223,224],
  "MANNAGUDDA":          [77,76,80,81,83,84,72,75],
  "MAROLI":             [46,47,48,50,52,49,51],
  "MILAGRESS":          [140,138,139,164,165,166],
  "PADAV CENTRAL":      [35,34,38,41,39,43,42],
  "PADAV-EAST":         [37,36,40],
  "PADAV-WEST":         [33,32,56,53,54,31,55],
  "PORT":               [148,149,144,234],
  "SHIVABAGH":          [128,130,58,135,131],
  "VALENCIA":           [173,172,183,174,132,133],
};
const WARD_NAMES = Object.keys(WARD_BOOTHS).sort();

export default function SurveyOpt() {
  const [ward,   setWard]   = useState('');
  const [booth,  setBooth]  = useState('');
  const [serial, setSerial] = useState('');
  const navigate            = useNavigate();

  useEffect(() => {
    surveyApi.serialNumber().then(r => setSerial(r.data.serialNumber)).catch(() => setSerial(1));
  }, []);

  const booths = ward ? WARD_BOOTHS[ward] || [] : [];

  // Reset booth when ward changes
  const handleWardChange = (e) => { setWard(e.target.value); setBooth(''); };

  const canContinue = ward && booth;

  return (
    <div className="page">
      <Navbar />
      <div className="page-inner" style={{ maxWidth:640 }}>
        <div className="page-header anim-fade-up">
          <span className="badge badge-gold mb-8">Survey Module</span>
          <h1>Start a New Survey</h1>
          <p>Select a ward and booth to begin collecting constituency data</p>
        </div>

        {/* Serial number chip */}
        {serial && (
          <div className="card card-pad anim-fade-up mb-20" style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:46, height:46, background:'var(--gold-dim)', border:'1px solid var(--gold-glow)', borderRadius:'var(--r-md)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📋</div>
            <div>
              <div className="field-label mb-4">Next Serial Number</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--gold)' }}>#{serial}</div>
            </div>
          </div>
        )}

        <div className="card card-pad anim-fade-up">
          {/* Ward select */}
          <div className="field mb-16">
            <label className="field-label">Select Ward</label>
            <select className="input" value={ward} onChange={handleWardChange} style={{ marginTop:8 }}>
              <option value="">— Choose a ward —</option>
              {WARD_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          {/* Booth select — appears after ward chosen */}
          {ward && (
            <div className="field mb-20">
              <label className="field-label">Select Booth</label>
              <select className="input" value={booth} onChange={e => setBooth(e.target.value)} style={{ marginTop:8 }}>
                <option value="">— Choose a booth —</option>
                {booths.map(b => <option key={b} value={b}>Booth {b}</option>)}
              </select>
            </div>
          )}

          {/* Confirmation badge */}
          {canContinue && (
            <div className="alert alert-info mb-20">
              ✓ <strong>{ward}</strong> — Booth <strong>{booth}</strong>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg btn-full"
            disabled={!canContinue}
            onClick={() => navigate('/survey/form', {
              state: {
                wardNumber: ward,
                wardName:   ward,
                boothNo:    booth,
                serialNo:   serial,
              }
            })}>
            Continue to Survey Form →
          </button>
        </div>

        {/* Step preview */}
        <div className="steps anim-fade-up" style={{ marginTop:28 }}>
          {['Select Ward & Booth','Fill Details','Submit'].map((step,i) => (
            <React.Fragment key={step}>
              <div className="step">
                <div className="step-circle" style={{ background:i===0?'var(--gold)':' rgba(255,255,255,0.07)', color:i===0?'#090e1c':'var(--text-2)', fontSize:13 }}>{i+1}</div>
                <div className="step-label" style={{ color:i===0?'var(--gold)':'var(--text-2)', fontWeight:i===0?700:400 }}>{step}</div>
              </div>
              {i < 2 && <div className="step-line" style={{ height:2, background:'rgba(255,255,255,0.06)', marginTop:15, flex:1 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}