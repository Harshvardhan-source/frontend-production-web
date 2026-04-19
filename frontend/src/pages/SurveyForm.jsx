import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { surveyApi, wardsApi } from '../api/client';
import api from '../api/client';
import DeceasedRow from '../components/DeceasedRow';

const RELIGIONS   = ['Hindu','Muslim','Christian','Jain','Buddhist','Sikh'];
const COMMUNITIES = { Hindu:['General','OBC','SC','ST'], Muslim:['General','OBC'], Christian:['General','OBC','SC','ST'], Jain:['General'], Buddhist:['SC','ST','General'], Sikh:['General','OBC'] };
const SUBCATS     = {
  OBC:     ['I','II A','II B','III A','III B'],
  SC:      ['SC (Left)','SC (Right)','SC (Touchables)','Others (Minor SC groups)'],
  ST:      ['Nayaka / Naikda','Soliga','Jenu Kuruba','Betta Kuruba','Gond','Koli Dhor','Siddi','Yerava','Kattunayakan'],
  General: ['—'],
};
const DISEASES    = ['Dengue','Cancer','Malaria','Liver disease','Lung disease','Heart disease','Kidney disease','Diabetes','Pneumonia','Mental disorder','Bird flu virus','Respiratory infection'];
const EMP_TYPES   = ['Government','Private','Self-Employed','Daily Wage','Business'];
const EDU_TYPES   = ['Primary','Secondary','Higher Secondary','Graduation','Post Graduation','Doctorate'];

const WARD_BOOTHS = {
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
  "MANGALADEVI":[147,228,227,226,223,224],"MANNAGUDDA":[77,76,80,81,83,84,72,75],
  "MAROLI":[46,47,48,50,52,49,51],"MILAGRESS":[140,138,139,164,165,166],
  "PADAV CENTRAL":[35,34,38,41,39,43,42],"PADAV-EAST":[37,36,40],
  "PADAV-WEST":[33,32,56,53,54,31,55],"PORT":[148,149,144,234],
  "SHIVABAGH":[128,130,58,135,131],"VALENCIA":[173,172,183,174,132,133],
};
const WARD_NAMES = Object.keys(WARD_BOOTHS).sort();
function getWardByBooth(boothNo) {
  const n = parseInt(boothNo);
  if (!n) return '';
  for (const [ward, booths] of Object.entries(WARD_BOOTHS)) { if (booths.includes(n)) return ward; }
  return '';
}

const STEPS = ['House & Members', 'Personal', 'Address', 'Demographics', 'Employment & Health'];

// ─── MOBILE-FIRST STYLES ─────────────────────────────────────────────────────
const SF_STYLES = `
  :root {
    --sf-radius: 14px;
    --sf-input-h: 52px;
    --sf-gap: 14px;
    --sf-page-pad: 16px;
  }

  /* Step indicator — horizontal scroll on small phones */
  .sf-steps {
    display: flex;
    align-items: flex-start;
    gap: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;
    margin-bottom: 20px;
  }
  .sf-steps::-webkit-scrollbar { display: none; }

  .sf-step-item { display: flex; align-items: center; flex-shrink: 0; }

  .sf-step-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 2px;
    -webkit-tap-highlight-color: transparent;
  }

  .sf-step-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .sf-step-label {
    font-size: 10px;
    font-weight: 500;
    text-align: center;
    max-width: 62px;
    line-height: 1.3;
    white-space: nowrap;
  }

  .sf-connector {
    height: 2px;
    width: 28px;
    flex-shrink: 0;
    margin-top: 17px;
  }

  /* Card — main form container */
  .sf-card {
    background: linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98));
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: var(--sf-radius);
    padding: 20px 16px;
    margin-bottom: 16px;
  }

  /* Field grid */
  .sf-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--sf-gap);
  }
  @media (min-width: 480px) {
    .sf-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* Full-width field */
  .sf-full { grid-column: 1 / -1 !important; }

  /* Field wrapper */
  .sf-field { display: flex; flex-direction: column; gap: 6px; }

  /* Label */
  .sf-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* Input / Select */
  .sf-input {
    width: 100%;
    min-height: var(--sf-input-h);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0 14px;
    font-size: 15px;
    color: var(--text-1);
    outline: none;
    box-sizing: border-box;
    font-family: var(--font-body);
    transition: border-color 0.15s, background 0.15s;
    -webkit-tap-highlight-color: transparent;
    appearance: none;
    -webkit-appearance: none;
  }
  .sf-input:focus {
    border-color: rgba(245,158,11,0.5);
    background: rgba(245,158,11,0.04);
  }
  .sf-input::placeholder { color: rgba(255,255,255,0.22); }

  textarea.sf-input {
    min-height: 90px;
    padding: 12px 14px;
    resize: vertical;
    line-height: 1.5;
  }

  select.sf-input {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 38px;
    cursor: pointer;
  }

  /* Input hint */
  .sf-hint { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }
  .sf-hint-warn { font-size: 11px; color: #f87171; margin-top: 2px; }
  .sf-hint-ok   { font-size: 11px; color: #10b981; margin-top: 2px; }

  /* Section divider */
  .sf-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0 16px;
    grid-column: 1 / -1;
  }
  .sf-section-bar { width: 3px; height: 22px; border-radius: 2px; flex-shrink: 0; }
  .sf-section-title { font-size: 15px; font-weight: 700; color: var(--text-1); }
  .sf-section-sub { font-size: 11px; color: var(--text-3); margin-top: 1px; }

  /* Bottom nav bar — fixed to bottom */
  .sf-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(8,14,28,0.97);
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    backdrop-filter: blur(16px);
  }
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .sf-nav { padding-bottom: calc(10px + env(safe-area-inset-bottom)); }
  }

  /* Buttons */
  .sf-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 50px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.15s, transform 0.1s;
  }
  .sf-btn:active { transform: scale(0.98); }
  .sf-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .sf-btn-primary {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #090e1c;
  }
  .sf-btn-cyan {
    background: transparent;
    border: 1px solid rgba(34,211,238,0.4) !important;
    color: #22d3ee;
  }
  .sf-btn-ghost {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1) !important;
    color: var(--text-2);
    flex: 1;
  }
  .sf-btn-danger-outline {
    background: transparent;
    border: 1px solid rgba(239,68,68,0.35) !important;
    color: #f87171;
    font-size: 13px;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 8px;
  }

  /* Check SIR floating button */
  .sf-sir-fab {
    position: fixed;
    right: 16px;
    bottom: 140px;
    z-index: 101;
    background: rgba(17,28,52,0.95);
    border: 1px solid rgba(245,158,11,0.4);
    border-radius: 24px;
    padding: 10px 18px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: #f59e0b;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.1s;
  }
  .sf-sir-fab:active { transform: scale(0.96); }

  /* Saved member chip */
  .sf-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(16,185,129,0.07);
    border: 1px solid rgba(16,185,129,0.25);
    border-radius: 12px;
    padding: 12px 14px;
  }

  /* Page bottom padding to clear fixed nav */
  .sf-page-bottom { padding-bottom: 180px; }

  /* Collapsible section toggle */
  .sf-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 14px 16px;
    cursor: pointer;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
    min-height: 60px;
  }

  /* Voter roll banner */
  .sf-roll-banner {
    background: rgba(34,211,238,0.06);
    border: 1px solid rgba(34,211,238,0.2);
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 4px;
  }

  /* Flash message */
  .sf-flash {
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.3);
    color: var(--green);
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 14px;
    font-size: 13px;
    font-weight: 600;
    animation: sfFlash 0.3s ease-out;
  }
  @keyframes sfFlash { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
`;

function blankForm(serialNo, wardNumber, locked = {}, prefill = {}) {
  const resolvedWard  = locked.wardNumber || wardNumber || (prefill.boothNo ? getWardByBooth(prefill.boothNo) : '') || prefill.wardNumber || '';
  const resolvedBooth = locked.boothNo != null && locked.boothNo !== '' ? String(locked.boothNo) : (prefill.boothNo ? String(prefill.boothNo) : '');
  return {
    firstName: prefill.firstName || '', middleName:'', lastName: prefill.lastName || '',
    addharNumber:'', contactNumber:'',
    serialNumber: serialNo, dob:'', age:'',
    gender:      prefill.gender       || '',
    voterid:     prefill.voterid      || '',
    maritalStatus:'', annualIncome:'',
    employmentStatus:'', employmentType:'',
    healthStatus:'Healthy', diseaseType:'', diseaseName:'',
    differentlyAbled:'No', religion:'', community:'', subcategory:'',
    education:'', educationtype:'', minority:'No', student:'No',
    economicStatus:'',
    outstationResident:'No', outstationAddress:'', outstationCity:'', outstationState:'',
    currentHouseNumber:'', currentAddress:'', currentAreaType:'', currentHomeType:'',
    isHeadOfHouse: 'No',
    wardNumber:   resolvedWard,
    boothNo:      resolvedBooth,
    houseNumber:  locked.houseNumber  || prefill.houseNumber  || '',
    address:      locked.address      || prefill.address      || '',
    areaType:     locked.areaType     || prefill.areaType     || '',
    homeType:     locked.homeType     || prefill.homeType     || '',
    familyIncome: locked.familyIncome || prefill.familyIncome || '',
    relation:          prefill.relation         || '',
    relationName:      prefill.relationName     || '',
    partNo:            prefill.partNo           || '',
    sectionName:       prefill.sectionName      || '',
    pollingStation:    prefill.pollingStation   || '',
    pollingStationAddr:prefill.pollingStationAddr|| '',
    sourcePdfName:     prefill.sourcePdfName    || '',
    pageNoOfCard:      prefill.pageNoOfCard     || '',
    predictedReligion: prefill.predictedReligion|| '',
  };
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Field({ label, children, full, hint, hintType = 'default' }) {
  return (
    <div className={`sf-field${full ? ' sf-full' : ''}`}>
      {label && <label className="sf-label">{label}</label>}
      {children}
      {hint && <div className={hintType === 'warn' ? 'sf-hint-warn' : hintType === 'ok' ? 'sf-hint-ok' : 'sf-hint'}>{hint}</div>}
    </div>
  );
}

function SectionDivider({ title, subtitle, color = 'linear-gradient(#f59e0b,#22d3ee)' }) {
  return (
    <div className="sf-section">
      <div className="sf-section-bar" style={{ background: color }} />
      <div>
        <div className="sf-section-title">{title}</div>
        {subtitle && <div className="sf-section-sub">{subtitle}</div>}
      </div>
    </div>
  );
}

function SavedChip({ member, index }) {
  return (
    <div className="sf-chip">
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: 'var(--green)' }}>
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.firstName} {member.middleName} {member.lastName}
          {member.isHeadOfHouse === 'Yes' && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(249,168,37,0.2)', color: 'var(--gold)', padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>HEAD</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
          #{member.serialNumber} · {member.gender || '—'} · {member.voterid || 'No Voter ID'}
          {member.outstationResident === 'Yes' && <span style={{ marginLeft: 6, color: 'var(--gold)', fontSize: 11, fontWeight: 700 }}>OUTSTATION</span>}
        </div>
      </div>
      <div style={{ fontSize: 18, color: 'var(--green)', flexShrink: 0 }}>✓</div>
    </div>
  );
}

function FutureVoterRow({ voter, index, onChange, onRemove, defaultHouseNumber, defaultAddress }) {
  return (
    <div style={{ background: 'rgba(249,168,37,0.03)', border: '1px solid rgba(249,168,37,0.15)', borderRadius: 12, padding: '14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>Future Voter #{index + 1}</span>
        <button onClick={() => onRemove(index)} className="sf-btn sf-btn-danger-outline">Remove</button>
      </div>
      <div className="sf-grid">
        <Field label="Full Name *"><input className="sf-input" placeholder="Full name" value={voter.name} onChange={e => onChange(index, 'name', e.target.value)} /></Field>
        <Field label="Date of Birth *"><input className="sf-input" type="date" value={voter.dob} onChange={e => onChange(index, 'dob', e.target.value)} /></Field>
        <Field label="Gender *">
          <select className="sf-input" value={voter.gender} onChange={e => onChange(index, 'gender', e.target.value)}>
            <option value="">— Select —</option>
            {['Male','Female','Other'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Class / Course"><input className="sf-input" placeholder="e.g. Class 11, B.Tech 1st Year" value={voter.classCourse || ''} onChange={e => onChange(index, 'classCourse', e.target.value)} /></Field>
        <Field label="Contact No. (10-digit)">
          <input className="sf-input" type="tel" inputMode="numeric" placeholder="10-digit mobile" maxLength={10} value={voter.headContactNumber || ''} onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,10); onChange(index, 'headContactNumber', d); }} />
        </Field>
        <Field label="House No."><input className="sf-input" placeholder="House no." value={voter.houseNumber !== undefined ? voter.houseNumber : defaultHouseNumber} onChange={e => onChange(index, 'houseNumber', e.target.value)} /></Field>
        <Field label="Address" full><input className="sf-input" placeholder="Address" value={voter.address !== undefined ? voter.address : defaultAddress} onChange={e => onChange(index, 'address', e.target.value)} /></Field>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SurveyForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { wardNumber = '', serialNo = 1, wardName = '', boothNo = '',
          prefill = {}, returnTo = '', returnQuery = '' } = location.state || {};

  const [step,          setStep]          = useState(0);
  const [busy,          setBusy]          = useState(false);
  const [saveMode,      setSaveMode]      = useState(null);
  const [error,         setError]         = useState('');
  const [savedMembers,  setSavedMembers]  = useState([]);
  const [currentSerial, setCurrentSerial] = useState(serialNo);
  const [flashMsg,      setFlashMsg]      = useState('');

  const [inVoterRoll,   setInVoterRoll]   = useState(null);
  const [serialSource,  setSerialSource]  = useState(null);

  const [totalMembers,  setTotalMembers]  = useState('');
  const [adultCount,    setAdultCount]    = useState('');
  const [childCount,    setChildCount]    = useState('');

  const [futureVoters,  setFutureVoters]  = useState([]);
  const [showFuture,    setShowFuture]    = useState(false);

  const [deceased,      setDeceased]      = useState([]);
  const [showDeceased,  setShowDeceased]  = useState(false);

  const [sirResult,    setSirResult]   = useState(null);
  const [showSir,      setShowSir]     = useState(false);
  const [sirMember,    setSirMember]   = useState('');
  const [sirChecking,  setSirChecking] = useState(false);

  const resolvedBooth = boothNo ? String(boothNo) : (prefill.boothNo ? String(prefill.boothNo) : '');
  const resolvedWard  = wardNumber || wardName || (resolvedBooth ? getWardByBooth(resolvedBooth) : '') || prefill.wardNumber || '';

  const lockedRef = useRef({ houseNumber:'', address:'', wardNumber: resolvedWard, boothNo: resolvedBooth, areaType:'', homeType:'', familyIncome:'' });
  const [form, setForm] = useState(() => blankForm(serialNo, resolvedWard, { wardNumber: resolvedWard, boothNo: resolvedBooth }, prefill));

  const set = (k) => (e) => {
    const val = e.target?.value ?? e;
    setForm(p => {
      const next = { ...p, [k]: val };
      if (k === 'religion')  { next.community = ''; next.subcategory = ''; }
      if (k === 'community') { next.subcategory = ''; }
      if (k === 'outstationResident' && val === 'No') {
        next.outstationCity = ''; next.outstationState = ''; next.outstationAddress = '';
        next.currentHouseNumber = ''; next.currentAreaType = ''; next.currentHomeType = ''; next.currentAddress = '';
      }
      return next;
    });
  };

  const I = (k, type = 'text', ph = '') => <input className="sf-input" type={type} placeholder={ph} value={form[k]} onChange={set(k)} />;
  const S = (k, opts, ph = 'Select') => (
    <select className="sf-input" value={form[k]} onChange={set(k)}>
      <option value="">— {ph} —</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const flash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 2500); };

  const currentHouse = lockedRef.current.houseNumber || form.houseNumber;
  const currentAddr  = lockedRef.current.address     || form.address;

  const addFutureVoter    = () => setFutureVoters(p => [...p, { name:'', dob:'', gender:'', classCourse:'', yearOfStudy:'', headContactNumber:'', houseNumber: currentHouse, address: currentAddr }]);
  const updateFutureVoter = (i, k, v) => setFutureVoters(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeFutureVoter = (i)        => setFutureVoters(p => p.filter((_, idx) => idx !== i));

  const addDeceased    = () => setDeceased(p => [...p, { name:'', voterid:'', gender:'', ageAtDeath:'', dob:'', dateOfDeath:'', deathCertificate:'', certificateFile: null, houseNumber: currentHouse, address: currentAddr }]);
  const updateDeceased = (i, k, v) => setDeceased(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeDeceased = (i)        => setDeceased(p => p.filter((_, idx) => idx !== i));

  const handleCheckSir = async () => {
    setSirChecking(true); setError('');
    try {
      const payload = { voterid: form.voterid?.trim() || '', firstName: form.firstName?.trim() || '', lastName: form.lastName?.trim() || '', houseNumber: form.houseNumber?.trim() || '', wardNumber: form.wardNumber || '', boothNo: form.boothNo || '', serialNumber: form.serialNumber || '' };
      const SIR_URL = (process.env.REACT_APP_API_URL || 'https://production-web-conn.onrender.com') + '/api/sir/check/';
      const res = await fetch(SIR_URL, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { setSirResult(data); setSirMember(`${form.firstName} ${form.lastName}`.trim() || form.voterid || 'Voter'); setShowSir(true); }
      else { setError(data.message || 'SIR check failed.'); }
    } catch (e) {
      setError('SIR check failed — network error.');
    } finally {
      setSirChecking(false);
    }
  };

  const handleSubmit = async (mode) => {
    setBusy(true); setSaveMode(mode); setError('');
    try {
      const { data } = await surveyApi.save(form);
      if (!data.success) { setError(data.message || 'Failed to save.'); return; }
      if (data.inVoterRoll !== undefined) setInVoterRoll(data.inVoterRoll);
      if (data.serialSource)              setSerialSource(data.serialSource);
      const confirmedSerial = data.serialNumber || currentSerial;

      // auto-show SIR
      if (data.sirData) { setSirResult(data.sirData); setSirMember(`${form.firstName} ${form.lastName}`.trim() || form.voterid || 'Voter'); setShowSir(true); }

      if (savedMembers.length === 0) {
        lockedRef.current = { houseNumber: form.houseNumber, address: form.address, wardNumber: form.wardNumber, boothNo: form.boothNo, areaType: form.areaType, homeType: form.homeType, familyIncome: form.familyIncome };
      }
      const validFuture = futureVoters.filter(v => v.name.trim());
      if (validFuture.length > 0) {
        await api.post('/api/save-future-voters/', { futureVoters: validFuture, houseNumber: lockedRef.current.houseNumber || form.houseNumber, wardNumber: lockedRef.current.wardNumber || form.wardNumber, address: lockedRef.current.address || form.address });
      }
      const validDeceased = deceased.filter(d => d.name.trim());
      for (const dec of validDeceased) {
        const fd = new FormData();
        Object.entries({ ...dec, houseNumber: lockedRef.current.houseNumber || form.houseNumber, wardNumber: lockedRef.current.wardNumber || form.wardNumber }).forEach(([k, v]) => { if (k !== 'certificateFile') fd.append(k, v || ''); });
        if (dec.certificateFile) fd.append('certificateFile', dec.certificateFile);
        await api.post('/api/save-deceased/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      const updatedMembers = [...savedMembers, { ...form, serialNumber: confirmedSerial }];
      setSavedMembers(updatedMembers);

      if (mode === 'done') {
        flash('All members saved! ✓');
        setTimeout(() => { returnTo ? navigate(returnTo, { state: { returnQuery } }) : navigate('/survey'); }, 1400);
        return;
      }
      const nextSerial = confirmedSerial + 1;
      setCurrentSerial(nextSerial);
      setInVoterRoll(null); setSerialSource(null);
      setStep(1);
      setFutureVoters([]); setShowFuture(false);
      setDeceased([]); setShowDeceased(false);
      setForm(blankForm(nextSerial, lockedRef.current.wardNumber, lockedRef.current));
      flash(`Member ${savedMembers.length + 1} saved — enter next person ✓`);
    } catch (e) {
      setError(e.response?.data?.message || 'Network error.');
    } finally {
      setBusy(false); setSaveMode(null);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="page">
      <style>{SF_STYLES}</style>
      <Navbar />
      <div className="page-inner sf-page-bottom" style={{ maxWidth: 900, padding: '0 var(--sf-page-pad)' }}>

        {/* ── Back button ── */}
        {returnTo && (
          <button onClick={() => navigate(returnTo, { state: { returnQuery } })} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', color: 'var(--gold)', fontSize: 13, fontWeight: 600, marginBottom: 18, WebkitTapHighlightColor: 'transparent' }}>
            ← Back to search results
            {returnQuery && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>"{returnQuery}"</span>}
          </button>
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '3px 10px', letterSpacing: '0.06em' }}>SERIAL #{currentSerial}</span>
            {serialSource === '2025_roll' && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(34,211,238,0.12)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 20, padding: '3px 10px' }}>📋 From 2025 Voter Roll</span>}
            {serialSource === 'manual'    && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '3px 10px' }}>✎ Manual Serial</span>}
          </div>
          <h1 style={{ fontSize: 'clamp(20px,5vw,26px)', marginBottom: 4 }}>Survey Registration</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Ward: {wardName || `#${wardNumber}`}
            {savedMembers.length > 0 && <span style={{ marginLeft: 12, color: 'var(--green)', fontWeight: 600 }}>· {savedMembers.length} member{savedMembers.length > 1 ? 's' : ''} saved</span>}
          </p>
        </div>

        {/* ── Not in voter roll warning ── */}
        {inVoterRoll === false && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '14px 16px' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#fbbf24', marginBottom: 4 }}>Voter not found in 2025 Voter Roll</div>
              <div style={{ fontSize: 13, color: 'rgba(251,191,36,0.7)', lineHeight: 1.5 }}>
                Saved to <strong style={{ color: '#fbbf24' }}>NotFoundRecordSurvey</strong>. Please verify the Voter ID and re-submit if incorrect.
              </div>
            </div>
          </div>
        )}

        {/* ── Flash message ── */}
        {flashMsg && <div className="sf-flash">✓ {flashMsg}</div>}

        {/* ── Saved members list ── */}
        {savedMembers.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 10 }}>Saved this house</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {savedMembers.map((m, i) => <SavedChip key={i} member={m} index={i} />)}
            </div>
          </div>
        )}

        {/* ── Step Indicator ── */}
        <div className="sf-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="sf-step-item">
                <button className="sf-step-btn" onClick={() => i <= step && setStep(i)} disabled={i > step}>
                  <div className="sf-step-circle" style={{ background: i < step ? 'var(--green)' : i === step ? '#f59e0b' : 'rgba(255,255,255,0.07)', color: i <= step ? '#090e1c' : 'var(--text-2)' }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div className="sf-step-label" style={{ color: i === step ? '#f59e0b' : i < step ? 'var(--green)' : 'rgba(255,255,255,0.3)', fontWeight: i === step ? 700 : 400 }}>{s}</div>
                </button>
              </div>
              {i < STEPS.length - 1 && (
                <div className="sf-connector" style={{ background: i < step ? 'var(--green)' : 'rgba(255,255,255,0.06)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Form Card ── */}
        <div className="sf-card">
          {error && <div className="alert alert-error" style={{ marginBottom: 18 }}>{error}</div>}

          {/* 2025 roll prefill banner — step 1 */}
          {step === 1 && (form.voterid || form.relation || form.pollingStation) && (
            <div className="sf-roll-banner" style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📋 Pre-filled from 2025 Voter Roll — verify &amp; complete</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, color: 'var(--text-2)' }}>
                {form.voterid        && <span>🪪 <b>{form.voterid}</b></span>}
                {form.relation       && <span>👤 {form.relation}: {form.relationName}</span>}
                {form.partNo         && <span>📍 Part {form.partNo}</span>}
                {form.pollingStation && <span>🏫 {form.pollingStation}</span>}
              </div>
            </div>
          )}

          <div className="sf-grid">

            {/* ── STEP 0: House & Members ── */}
            {step === 0 && <>
              <SectionDivider title="House Details" subtitle="Enter the house information first" />
              <Field label="House Number *">
                <input className="sf-input" type="text" placeholder="e.g. 23, 4B, 12/3" value={form.houseNumber} onChange={set('houseNumber')} />
              </Field>
              <Field label="Ward">
                <select className="sf-input" value={form.wardNumber} onChange={e => setForm(p => ({ ...p, wardNumber: e.target.value, boothNo: '' }))}>
                  <option value="">— Select Ward —</option>
                  {WARD_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="Booth No" hint={form.boothNo ? `✓ Booth ${form.boothNo} — pre-filled, editable` : ''} hintType={form.boothNo ? 'ok' : 'default'}>
                <input className="sf-input" type="text" inputMode="numeric" placeholder="e.g. 44" value={form.boothNo} onChange={e => setForm(p => ({ ...p, boothNo: e.target.value.replace(/\D/g,'') }))} />
              </Field>
              <Field label="Area Type">{S('areaType', ['Urban','Rural','Semi-Urban'])}</Field>
              <Field label="Home Type">{S('homeType', ['Own','Rent','Government Quarters','Shared'])}</Field>
              <Field label="Full Address" full>
                <textarea className="sf-input" rows={3} placeholder="Street, locality, landmark…" value={form.address} onChange={set('address')} />
              </Field>

              <SectionDivider title="Household Members Count" subtitle="How many people live in this house?" color="linear-gradient(#22d3ee,#6c63ff)" />
              <Field label="Total Members"><input className="sf-input" type="number" min="1" placeholder="e.g. 4" value={totalMembers} onChange={e => setTotalMembers(e.target.value)} /></Field>
              <Field label="Adults (18+)"><input className="sf-input" type="number" min="0" placeholder="e.g. 2" value={adultCount} onChange={e => setAdultCount(e.target.value)} /></Field>
              <Field label="Children (under 18)"><input className="sf-input" type="number" min="0" placeholder="e.g. 2" value={childCount} onChange={e => setChildCount(e.target.value)} /></Field>
              <Field label="Family Annual Income (₹)"><input className="sf-input" type="number" placeholder="Total family income" value={form.familyIncome} onChange={set('familyIncome')} /></Field>
            </>}

            {/* ── STEP 1: Personal ── */}
            {step === 1 && <>
              <SectionDivider title="Personal Information" />
              <Field label="Head of House?">
                <select className="sf-input" value={form.isHeadOfHouse} onChange={set('isHeadOfHouse')}>
                  <option value="No">No</option>
                  <option value="Yes">Yes — Head of Household</option>
                </select>
              </Field>
              <Field label="First Name *">{I('firstName','text','First name')}</Field>
              <Field label="Middle Name">{I('middleName','text','Middle name')}</Field>
              <Field label="Last Name">{I('lastName','text','Last name')}</Field>
              <Field label="Date of Birth *"><input className="sf-input" type="date" value={form.dob} onChange={set('dob')} /></Field>
              {!form.dob && (
                <Field label="Age (if DOB unknown)"><input className="sf-input" type="number" min="0" max="120" placeholder="Age in years" value={form.age} onChange={set('age')} /></Field>
              )}
              <Field label="Gender *">{S('gender',['Male','Female','Other'])}</Field>
              <Field label="Marital Status">{S('maritalStatus',['Single','Married','Widowed','Divorced'])}</Field>
              <Field
                label="Voter ID (EPIC)"
                hint={form.voterid && form.voterid.length !== 10 ? `⚠ Must be 10 characters (${form.voterid.length}/10)` : form.voterid ? '✓ Valid length' : ''}
                hintType={form.voterid && form.voterid.length !== 10 ? 'warn' : 'ok'}
              >
                <input className="sf-input" type="text" placeholder="e.g. KA/01/123456" maxLength={10} value={form.voterid} onChange={e => setForm(p => ({ ...p, voterid: e.target.value.toUpperCase() }))} style={{ letterSpacing: '0.06em' }} />
              </Field>
              <Field
                label="Aadhar Number * (12-digit)"
                hint={form.addharNumber && form.addharNumber.length !== 12 ? `⚠ Must be 12 digits (${form.addharNumber.length}/12)` : ''}
                hintType="warn"
              >
                <input className="sf-input" type="text" inputMode="numeric" placeholder="XXXX XXXX XXXX" maxLength={14} value={form.addharNumber ? form.addharNumber.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 ').trim() : ''} onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,12); setForm(p => ({ ...p, addharNumber: d })); }} style={{ letterSpacing: '0.1em' }} />
              </Field>
              <Field
                label="Contact Number * (10-digit)"
                hint={form.contactNumber && form.contactNumber.length !== 10 ? `⚠ Must be 10 digits (${form.contactNumber.length}/10)` : ''}
                hintType="warn"
              >
                <input className="sf-input" type="tel" inputMode="numeric" placeholder="10-digit mobile" maxLength={10} value={form.contactNumber} onChange={e => { const d = e.target.value.replace(/\D/g,'').slice(0,10); setForm(p => ({ ...p, contactNumber: d })); }} />
              </Field>

              <SectionDivider title="Outstation Resident" subtitle="Voter registered here but living elsewhere" color="linear-gradient(#f59e0b,#f97316)" />
              <Field label="Outstation Resident?">
                <select className="sf-input" value={form.outstationResident} onChange={set('outstationResident')}>
                  <option value="No">No — resides in constituency</option>
                  <option value="Yes">Yes — resides outside</option>
                </select>
              </Field>
              {form.outstationResident === 'Yes' && <>
                <Field label="Current City / Town">{I('outstationCity','text','e.g. Bengaluru')}</Field>
                <Field label="Current State">{I('outstationState','text','e.g. Karnataka')}</Field>
                <Field label="Flat / House No.">{I('currentHouseNumber','text','e.g. 4B')}</Field>
                <Field label="Area Type">{S('currentAreaType',['Urban','Rural','Semi-Urban'])}</Field>
                <Field label="Home Type">{S('currentHomeType',['Own','Rent','Government Quarters','Shared'])}</Field>
                <Field label="Current Address" full><textarea className="sf-input" rows={2} placeholder="Street, area, pin code…" value={form.outstationAddress} onChange={set('outstationAddress')} /></Field>
              </>}
            </>}

            {/* ── STEP 2: Address ── */}
            {step === 2 && <>
              <SectionDivider title="Address Details" subtitle={savedMembers.length > 0 ? "Pre-filled from first member — editable" : "Enter address"} />
              <Field label="House Number"><input className="sf-input" type="text" placeholder="House/Flat No." value={form.houseNumber} onChange={set('houseNumber')} /></Field>
              <Field label="Ward">
                <select className="sf-input" value={form.wardNumber} onChange={e => setForm(p => ({ ...p, wardNumber: e.target.value, boothNo: '' }))}>
                  <option value="">— Select Ward —</option>
                  {WARD_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="Booth No" hint={form.boothNo ? `✓ Booth ${form.boothNo}` : ''} hintType="ok">
                <input className="sf-input" type="text" inputMode="numeric" placeholder="e.g. 44" value={form.boothNo} onChange={e => setForm(p => ({ ...p, boothNo: e.target.value.replace(/\D/g,'') }))} />
              </Field>
              <Field label="Area Type">{S('areaType',['Urban','Rural','Semi-Urban'])}</Field>
              <Field label="Home Type">{S('homeType',['Own','Rent','Government Quarters','Shared'])}</Field>
              <Field label="Full Address" full><textarea className="sf-input" rows={3} placeholder="Street, locality, landmark…" value={form.address} onChange={set('address')} /></Field>
              {savedMembers.length > 0 && (
                <div style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--gold)', marginTop: -4 }}>ℹ️ Pre-filled from first member's entry. You may edit if different.</div>
              )}
            </>}

            {/* ── STEP 3: Demographics ── */}
            {step === 3 && <>
              <SectionDivider title="Demographics" />
              <Field label="Religion">{S('religion', RELIGIONS)}</Field>
              <Field label="Community">
                <select className="sf-input" value={form.community} onChange={set('community')}>
                  <option value="">— Select Community —</option>
                  {(COMMUNITIES[form.religion] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sub-Category">
                <select className="sf-input" value={form.subcategory} onChange={set('subcategory')}>
                  <option value="">— Select Sub-Category —</option>
                  {(SUBCATS[form.community] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Annual Income (₹)">{I('annualIncome','number','Personal annual income')}</Field>
              <Field label="Family Income (₹)"><input className="sf-input" type="number" placeholder="Total family income" value={form.familyIncome} onChange={set('familyIncome')} /></Field>
              <Field label="Economic Status">{S('economicStatus',['APL','BPL','EWS'])}</Field>
              <Field label="Education">{S('education',['Educated','Uneducated'])}</Field>
              {form.education === 'Educated' && <Field label="Education Type">{S('educationtype', EDU_TYPES)}</Field>}
              <Field label="Minority?">{S('minority',['No','Yes'])}</Field>
              <Field label="Student?">{S('student',['No','Yes'])}</Field>
            </>}

            {/* ── STEP 4: Employment & Health ── */}
            {step === 4 && <>
              <SectionDivider title="Employment & Health" />
              <Field label="Employment Status">{S('employmentStatus',['None','Employed','UnEmployed','Minor','Retired'])}</Field>
              {form.employmentStatus === 'Employed' && <Field label="Employment Type">{S('employmentType', EMP_TYPES)}</Field>}
              <Field label="Health Status">{S('healthStatus',['Healthy','Diseased'])}</Field>
              {form.healthStatus === 'Diseased' && <>
                <Field label="Disease Type">{S('diseaseType', DISEASES)}</Field>
                <Field label="Disease Name">{I('diseaseName','text','Specific name')}</Field>
              </>}
              <Field label="Differently Abled?">{S('differentlyAbled',['No','Yes'])}</Field>
            </>}

          </div>

          {/* ── Future Voters (last step) ── */}
          {isLastStep && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button className="sf-toggle" style={{ borderColor: showFuture ? 'rgba(249,168,37,0.4)' : 'rgba(255,255,255,0.08)', background: showFuture ? 'rgba(249,168,37,0.06)' : 'rgba(255,255,255,0.03)' }}
                onClick={() => { setShowFuture(p => !p); if (!showFuture && futureVoters.length === 0) addFutureVoter(); }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: showFuture ? 'rgba(249,168,37,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🗳️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: showFuture ? 'var(--gold)' : 'var(--text-1)' }}>
                    First-Time Voters by 2028
                    {futureVoters.filter(v => v.name.trim()).length > 0 && <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(249,168,37,0.2)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 5 }}>{futureVoters.filter(v => v.name.trim()).length} added</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Indicate if any household member will become a first-time voter by 2028</div>
                </div>
                <span style={{ color: 'var(--text-3)', fontSize: 18 }}>{showFuture ? '▲' : '▼'}</span>
              </button>
              {showFuture && (
                <div style={{ marginTop: 12, padding: '16px', background: 'rgba(249,168,37,0.04)', borderRadius: 12, border: '1px solid rgba(249,168,37,0.15)' }}>
                  {futureVoters.map((v, i) => <FutureVoterRow key={i} voter={v} index={i} onChange={updateFutureVoter} onRemove={removeFutureVoter} defaultHouseNumber={currentHouse} defaultAddress={currentAddr} />)}
                  <button onClick={addFutureVoter} style={{ background: 'transparent', border: '1px dashed rgba(249,168,37,0.4)', color: 'var(--gold)', borderRadius: 9, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', marginTop: 4 }}>+ Add another future voter</button>
                </div>
              )}
            </div>
          )}

          {/* ── Deceased (last step) ── */}
          {isLastStep && (
            <div style={{ marginTop: 14 }}>
              <button className="sf-toggle" style={{ borderColor: showDeceased ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)', background: showDeceased ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)' }}
                onClick={() => { setShowDeceased(p => !p); if (!showDeceased && deceased.length === 0) addDeceased(); }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: showDeceased ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: showDeceased ? '#f87171' : 'var(--text-1)' }}>
                    Deceased Household Members
                    {deceased.filter(d => d.name.trim()).length > 0 && <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 8px', borderRadius: 5 }}>{deceased.filter(d => d.name.trim()).length} added</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Record details of any member who has passed away</div>
                </div>
                <span style={{ color: 'var(--text-3)', fontSize: 18 }}>{showDeceased ? '▲' : '▼'}</span>
              </button>
              {showDeceased && (
                <div style={{ marginTop: 12 }}>
                  {deceased.map((d, i) => <DeceasedRow key={i} rec={d} index={i} onChange={updateDeceased} onRemove={removeDeceased} />)}
                  <button onClick={addDeceased} style={{ background: 'transparent', border: '1px dashed rgba(239,68,68,0.4)', color: '#f87171', borderRadius: 9, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%', marginTop: 8 }}>+ Add another deceased member</button>
                </div>
              )}
            </div>
          )}

          {/* ── SIR Result Panel ── */}
          {showSir && sirResult && (
            <div style={{ marginTop: 20, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>
                  🔍 SIR Analysis — {sirMember}
                  {sirResult.stored && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: 6, padding: '2px 8px' }}>✓ Stored</span>}
                </div>
                <button onClick={() => setShowSir(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}>✕</button>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {[{ key:'in_2025', label:'2025 Roll' },{ key:'in_2002', label:'2002 Roll' }].map(({ key, label }) => (
                    <span key={key} style={{ background: sirResult[key] ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${sirResult[key] ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: sirResult[key] ? '#10b981' : '#f87171' }}>
                      {sirResult[key] ? '✓' : '✗'} {label}
                    </span>
                  ))}
                </div>
                {(sirResult.results || []).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10, padding: '12px 14px', borderRadius: 12, background: `${r.color}0d`, border: `1px solid ${r.color}30` }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{r.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: r.color, marginBottom: 3 }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.detail}</div>
                      {(r.changes || []).map((c, ci) => (
                        <div key={ci} style={{ marginTop: 6, fontSize: 11, fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-1)' }}>
                          <span style={{ color: '#f87171' }}>{c.field}</span>: <span style={{ color: 'var(--text-3)' }}>"{c.from}"</span> <span style={{ color: 'var(--text-2)' }}>→</span> <span style={{ color: '#86efac' }}>"{c.to}"</span>
                          {c.note && <span style={{ color: '#fbbf24', marginLeft: 6 }}>({c.note})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(sirResult.suspicious || []).length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>⚠ Suspicious Flags</div>
                    {sirResult.suspicious.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)' }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                        <div><div style={{ fontWeight: 700, fontSize: 12, color: '#fbbf24' }}>{s.label}</div><div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{s.detail}</div></div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

        </div>{/* end sf-card */}

      </div>{/* end page-inner */}

      {/* ── Check SIR floating button (last step only) ── */}
      {isLastStep && (
        <button className="sf-sir-fab" onClick={handleCheckSir} disabled={sirChecking || busy || (!form.voterid && !form.firstName)}>
          {sirChecking ? <span className="spinner" /> : '🔍'}
          {sirChecking ? 'Checking…' : 'Check SIR'}
        </button>
      )}

      {/* ── Fixed Bottom Navigation ── */}
      <div className="sf-nav">
        {isLastStep ? (
          <>
            {/* Save Survey — primary large button */}
            <button className="sf-btn sf-btn-primary" onClick={() => handleSubmit('done')} disabled={busy} style={{ width: '100%' }}>
              {busy && saveMode === 'done' ? <span className="spinner" /> : <><span style={{ fontSize: 17 }}>✓</span> {savedMembers.length > 0 ? 'Save Survey' : 'Save Survey'}</>}
            </button>
            {/* Row: Prev + Save & Add Next Member */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="sf-btn sf-btn-ghost" onClick={() => setStep(s => s - 1)} style={{ flex: '0 0 90px' }}>
                ← Prev
              </button>
              <button className="sf-btn sf-btn-cyan" onClick={() => handleSubmit('next')} disabled={busy} style={{ flex: 1 }}>
                {busy && saveMode === 'next' ? <span className="spinner" /> : <><span style={{ fontSize: 17 }}>👤</span> Save &amp; Add Next Member</>}
              </button>
            </div>
            {/* Helper text */}
            <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              <strong style={{ color: '#22d3ee' }}>Save &amp; Add Next Member</strong> — continue adding · <strong style={{ color: '#10b981' }}>Save Survey</strong> — done
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="sf-btn sf-btn-ghost" onClick={() => step > 0 ? setStep(s => s - 1) : (returnTo ? navigate(returnTo, { state: { returnQuery } }) : navigate('/survey'))} style={{ flex: '0 0 90px' }}>
              ← {step === 0 ? 'Back' : 'Prev'}
            </button>
            <button className="sf-btn sf-btn-primary" onClick={() => setStep(s => s + 1)} style={{ flex: 1 }}>
              Next: {STEPS[step + 1]} →
            </button>
          </div>
        )}
      </div>

    </div>
  );
}