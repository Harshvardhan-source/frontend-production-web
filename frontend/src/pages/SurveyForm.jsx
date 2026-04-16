import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { surveyApi, wardsApi } from '../api/client';
import api from '../api/client';
import DeceasedRow from '../components/DeceasedRow';

const RELIGIONS   = ['Hindu','Muslim','Christian','Jain','Buddhist','Sikh'];
const COMMUNITIES = { Hindu:['General','OBC','SC','ST'], Muslim:['General','OBC'], Christian:['General','OBC','SC','ST'], Jain:['General'], Buddhist:['SC','ST','General'], Sikh:['General','OBC'] };
const SUBCATS     = { SC:['Adi Karnataka','Adi Dravida','Holeya','Madiga','Banjara'], ST:['Gond','Kuruba','Siddi','Soliga'], OBC:['Ediga','Idiga','Kuruba','Mudaliar','Vokkaligas'], General:['—'] };
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

function blankForm(serialNo, wardNumber, locked = {}, prefill = {}) {
  // Ward: locked > passed wardNumber > resolve from booth > prefill.wardNumber
  const resolvedWard  = locked.wardNumber || wardNumber
    || (prefill.boothNo ? getWardByBooth(prefill.boothNo) : '')
    || prefill.wardNumber || '';
  const resolvedBooth = locked.boothNo
    || (prefill.boothNo ? String(prefill.boothNo) : '') || '';
  return {
    // ── Member-specific (blank each time) ──
    firstName: prefill.firstName || '', middleName:'', lastName: prefill.lastName || '',
    addharNumber:'', contactNumber:'',
    serialNumber: serialNo, dob:'',
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
    // ── House-level (persist within same house session OR from prefill) ──
    wardNumber:   resolvedWard,
    boothNo:      resolvedBooth,
    houseNumber:  locked.houseNumber  || prefill.houseNumber  || '',
    address:      locked.address      || prefill.address      || '',
    areaType:     locked.areaType     || prefill.areaType     || '',
    homeType:     locked.homeType     || prefill.homeType     || '',
    familyIncome: locked.familyIncome || prefill.familyIncome || '',
  };
}

function Field({ label, children, full }) {
  return (
    <div className="field" style={full ? { gridColumn:'1/-1' } : {}}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function SectionDivider({ title, subtitle, color = 'linear-gradient(#f59e0b,#22d3ee)' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, gridColumn:'1/-1' }}>
      <div style={{ width:3, height:20, background:color, borderRadius:2 }} />
      <div>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text-1)', margin:0 }}>{title}</h3>
        {subtitle && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function SavedChip({ member, index }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.25)',
      borderRadius:10, padding:'8px 14px',
    }}>
      <div style={{
        width:30, height:30, borderRadius:8, flexShrink:0,
        background:'rgba(16,185,129,0.18)', border:'1px solid rgba(16,185,129,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-display)', fontWeight:800, fontSize:13, color:'var(--green)',
      }}>
        {index + 1}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:13, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {member.firstName} {member.middleName} {member.lastName}
          {member.isHeadOfHouse === 'Yes' && (
            <span style={{ marginLeft:6, fontSize:10, background:'rgba(249,168,37,0.2)', color:'var(--gold)', padding:'1px 6px', borderRadius:4, fontWeight:700 }}>HEAD</span>
          )}
        </div>
        <div style={{ fontSize:11, color:'var(--text-3)' }}>
          #{member.serialNumber} · {member.gender || '—'} · {member.voterid || 'No Voter ID'}
          {member.outstationResident === 'Yes' && (
            <span style={{ marginLeft:6, color:'var(--gold)', fontSize:10, fontWeight:700 }}>OUTSTATION</span>
          )}
        </div>
      </div>
      <div style={{ fontSize:16, color:'var(--green)' }}>✓</div>
    </div>
  );
}

// ── Future Voter Row ──────────────────────────────────────────────────────────
function FutureVoterRow({ voter, index, onChange, onRemove, defaultHouseNumber, defaultAddress }) {
  return (
    <div style={{
      background:'rgba(249,168,37,0.03)', border:'1px solid rgba(249,168,37,0.15)',
      borderRadius:10, padding:14, marginBottom:10,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'var(--gold)' }}>Future Voter #{index + 1}</span>
        <button onClick={() => onRemove(index)}
          style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)',
            color:'#f87171', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>
          Remove
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10 }}>

        <div>
          <label className="field-label" style={{ fontSize:11 }}>Full Name *</label>
          <input className="input" placeholder="Full name" value={voter.name}
            onChange={e => onChange(index, 'name', e.target.value)} />
        </div>

        <div>
          <label className="field-label" style={{ fontSize:11 }}>Date of Birth *</label>
          <input className="input" type="date" value={voter.dob}
            onChange={e => onChange(index, 'dob', e.target.value)} />
        </div>

        <div>
          <label className="field-label" style={{ fontSize:11 }}>Gender *</label>
          <select className="input" value={voter.gender} onChange={e => onChange(index, 'gender', e.target.value)}>
            <option value="">— Select —</option>
            {['Male','Female','Other'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="field-label" style={{ fontSize:11 }}>Class / Course</label>
          <input className="input" placeholder="e.g. Class 11, B.Tech 1st Year"
            value={voter.classCourse || ''}
            onChange={e => onChange(index, 'classCourse', e.target.value)} />
        </div>

        <div>
          <label className="field-label" style={{ fontSize:11 }}>Year of Study</label>
          <input className="input" placeholder="e.g. 2nd Year, Class 12"
            value={voter.yearOfStudy || ''}
            onChange={e => onChange(index, 'yearOfStudy', e.target.value)} />
        </div>

        <div>
          <label className="field-label" style={{ fontSize:11 }}>Head of Family Contact No.</label>
          <input className="input" type="tel" placeholder="10-digit mobile"
            value={voter.headContactNumber || ''}
            onChange={e => onChange(index, 'headContactNumber', e.target.value)} />
        </div>

        <div>
          <label className="field-label" style={{ fontSize:11 }}>House No.</label>
          <input className="input" placeholder="House no."
            value={voter.houseNumber !== undefined ? voter.houseNumber : defaultHouseNumber}
            onChange={e => onChange(index, 'houseNumber', e.target.value)} />
        </div>

        <div style={{ gridColumn:'1/-1' }}>
          <label className="field-label" style={{ fontSize:11 }}>Address</label>
          <input className="input" placeholder="Address"
            value={voter.address !== undefined ? voter.address : defaultAddress}
            onChange={e => onChange(index, 'address', e.target.value)} />
        </div>

      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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

  const [totalMembers,  setTotalMembers]  = useState('');
  const [adultCount,    setAdultCount]    = useState('');
  const [childCount,    setChildCount]    = useState('');

  const [futureVoters,  setFutureVoters]  = useState([]);
  const [showFuture,    setShowFuture]    = useState(false);

  const [deceased,      setDeceased]      = useState([]);
  const [showDeceased,  setShowDeceased]  = useState(false);

  // ── SIR — manual check + auto-populated from save response ─────────
  const [sirResult,    setSirResult]   = useState(null);   // SIR data from last save / manual check
  const [showSir,      setShowSir]     = useState(false);  // panel visible?
  const [sirMember,    setSirMember]   = useState('');     // name of checked member
  const [sirChecking,  setSirChecking] = useState(false);  // manual check in progress

  const lockedRef = useRef({ houseNumber:'', address:'', wardNumber,
    boothNo: boothNo || prefill.boothNo || '', areaType:'', homeType:'', familyIncome:'' });
  const [form, setForm] = useState(() => blankForm(serialNo, wardNumber, {}, prefill));

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

  const I = (k, type = 'text', ph = '') => (
    <input className="input" type={type} placeholder={ph} value={form[k]} onChange={set(k)} />
  );
  const S = (k, opts, ph = 'Select') => (
    <select className="input" value={form[k]} onChange={set(k)}>
      <option value="">— {ph} —</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const flash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 2500); };

  const currentHouse   = lockedRef.current.houseNumber || form.houseNumber;
  const currentAddr    = lockedRef.current.address     || form.address;

  // ── Future voter helpers ──────────────────────────────────────────────────
  const addFutureVoter    = () => setFutureVoters(p => [...p, {
    name:'', dob:'', gender:'', classCourse:'', yearOfStudy:'', headContactNumber:'',
    houseNumber: currentHouse, address: currentAddr,
  }]);
  const updateFutureVoter = (i, k, v) => setFutureVoters(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeFutureVoter = (i)        => setFutureVoters(p => p.filter((_, idx) => idx !== i));

  // ── Deceased helpers ──────────────────────────────────────────────────────
  const addDeceased    = () => setDeceased(p => [...p, {
    name:'', voterid:'', gender:'', ageAtDeath:'', dob:'', dateOfDeath:'',
    deathCertificate:'', certificateFile: null,
    houseNumber: currentHouse, address: currentAddr,
  }]);
  const updateDeceased = (i, k, v) => setDeceased(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeDeceased = (i)        => setDeceased(p => p.filter((_, idx) => idx !== i));

  // ── Manual SIR Check ─────────────────────────────────────────────────────
  const handleCheckSir = async () => {
    setSirChecking(true); setError('');
    try {
      const payload = {
        voterid:      form.voterid?.trim()    || '',
        firstName:    form.firstName?.trim()  || '',
        lastName:     form.lastName?.trim()   || '',
        houseNumber:  form.houseNumber?.trim()|| '',
        wardNumber:   form.wardNumber         || '',
        boothNo:      form.boothNo            || '',
        serialNumber: form.serialNumber       || '',
      };
      const SIR_URL = (process.env.REACT_APP_API_URL || 'https://production-web-conn.onrender.com') + '/api/sir/check/';
      const res = await fetch(SIR_URL, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSirResult(data);
        setSirMember(`${form.firstName} ${form.lastName}`.trim() || form.voterid || 'Voter');
        setShowSir(true);
      } else {
        setError(data.message || 'SIR check failed.');
      }
    } catch (e) {
      setError('SIR check failed — network error.');
    } finally {
      setSirChecking(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (mode) => {
    setBusy(true); setSaveMode(mode); setError('');
    try {
      const { data } = await surveyApi.save(form);
      if (!data.success) { setError(data.message || 'Failed to save.'); return; }

      if (savedMembers.length === 0) {
        lockedRef.current = {
          houseNumber:  form.houseNumber,
          address:      form.address,
          wardNumber:   form.wardNumber,
          boothNo:      form.boothNo,
          areaType:     form.areaType,
          homeType:     form.homeType,
          familyIncome: form.familyIncome,
        };
      }

      // Save future voters
      const validFuture = futureVoters.filter(v => v.name.trim());
      if (validFuture.length > 0) {
        await api.post('/api/save-future-voters/', {
          futureVoters: validFuture,
          houseNumber:  lockedRef.current.houseNumber || form.houseNumber,
          wardNumber:   lockedRef.current.wardNumber  || form.wardNumber,
          address:      lockedRef.current.address     || form.address,
        });
      }

      // Save deceased with optional file upload
      const validDeceased = deceased.filter(d => d.name.trim());
      if (validDeceased.length > 0) {
        const fd = new FormData();
        const deceasedMeta = validDeceased.map((d, i) => {
          if (d.certificateFile) fd.append(`cert_${i}`, d.certificateFile, d.certificateFile.name);
          // eslint-disable-next-line no-unused-vars
          const { certificateFile, ...rest } = d;
          return { ...rest, fileIndex: d.certificateFile ? i : null };
        });
        fd.append('deceased', JSON.stringify(deceasedMeta));
        await api.post('/api/save-deceased/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSavedMembers(prev => [...prev, { ...form }]);

      // ── SIR result comes back from the same save call ────────────────
      if (data.sir && (data.sir.results?.length || data.sir.suspicious?.length)) {
        setSirResult(data.sir);
        setSirMember(`${form.firstName} ${form.lastName}`.trim());
        setShowSir(true);
      }

      if (mode === 'done') {
        flash('All members saved! ✓');
        setTimeout(() => {
          returnTo ? navigate(returnTo, { state: { returnQuery } }) : navigate('/survey');
        }, 1400);
        return;
      }

      const nextSerial = currentSerial + 1;
      setCurrentSerial(nextSerial);
      setStep(1);
      setFutureVoters([]);
      setShowFuture(false);
      setDeceased([]);
      setShowDeceased(false);
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
      <Navbar />
      <div className="page-inner" style={{ maxWidth: 900 }}>

        {returnTo && (
          <button onClick={() => navigate(returnTo, { state: { returnQuery } })}
            style={{ display:'flex', alignItems:'center', gap:8,
              background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)',
              borderRadius:10, padding:'9px 16px', cursor:'pointer',
              color:'var(--gold)', fontSize:13, fontWeight:600,
              marginBottom:18, width:'fit-content' }}>
            ← Back to search results
            {returnQuery && <span style={{ fontSize:11, color:'var(--text-3)', fontWeight:400, marginLeft:4 }}>"{ returnQuery}"</span>}
          </button>
        )}

        <div className="page-header anim-fade-up">
          <span className="badge badge-gold mb-8">Serial #{currentSerial}</span>
          <h1>Survey Registration</h1>
          <p>Ward: {wardName || `#${wardNumber}`}
            {savedMembers.length > 0 && (
              <span style={{ marginLeft:12, fontSize:13, color:'var(--green)', fontWeight:600 }}>
                · {savedMembers.length} member{savedMembers.length > 1 ? 's' : ''} saved this session
              </span>
            )}
          </p>
        </div>

        {savedMembers.length > 0 && (
          <div className="anim-fade-up" style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', marginBottom:8 }}>Saved this house</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {savedMembers.map((m, i) => <SavedChip key={i} member={m} index={i} />)}
            </div>
          </div>
        )}

        {flashMsg && (
          <div className="alert" style={{
            background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)',
            color:'var(--green)', borderRadius:10, padding:'10px 16px', marginBottom:14, fontSize:13, fontWeight:600,
          }}>✓ {flashMsg}</div>
        )}

        <div className="steps anim-fade-up mb-28">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="step" style={{ cursor: i <= step ? 'pointer' : 'default' }} onClick={() => i <= step && setStep(i)}>
                <div className="step-circle" style={{
                  background: i < step ? 'var(--green)' : i === step ? 'var(--gold)' : 'rgba(255,255,255,0.07)',
                  color: i <= step ? '#090e1c' : 'var(--text-2)', fontSize:13,
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div className="step-label" style={{
                  color: i === step ? 'var(--gold)' : i < step ? 'var(--green)' : 'var(--text-3)',
                  fontWeight: i === step ? 700 : 400, fontSize:11,
                }}>{s}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex:1, height:2, background: i < step ? 'var(--green)' : 'rgba(255,255,255,0.06)', marginTop:15, transition:'background 0.4s' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="card card-pad-lg anim-fade-up">
          {error && <div className="alert alert-error mb-20">{error}</div>}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:18 }}>

            {/* ── Step 0: House & Members ── */}
            {step === 0 && <>
              <SectionDivider title="House Details" subtitle="Enter the house information first" />
              <Field label="House Number *">
                <input className="input" type="text" placeholder="e.g. 23, 4B, 12/3"
                  value={form.houseNumber} onChange={set('houseNumber')} />
              </Field>
              <Field label="Ward">
                <select className="input" value={form.wardNumber}
                  onChange={e => setForm(p => ({ ...p, wardNumber: e.target.value, boothNo: '' }))}>
                  <option value="">— Select Ward —</option>
                  {WARD_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="Booth No">
                {form.wardNumber && WARD_BOOTHS[form.wardNumber] ? (
                  <select className="input" value={String(form.boothNo)} onChange={set('boothNo')}>
                    <option value="">— Select Booth —</option>
                    {WARD_BOOTHS[form.wardNumber].map(b => (
                      <option key={b} value={String(b)}>Booth {b}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input" type="text" placeholder="Select ward first"
                    value={form.boothNo} onChange={set('boothNo')} disabled={!form.wardNumber} />
                )}
              </Field>
              <Field label="Area Type">{S('areaType', ['Urban','Rural','Semi-Urban'])}</Field>
              <Field label="Home Type">{S('homeType', ['Own','Rent','Government Quarters','Shared'])}</Field>
              <Field label="Full Address" full>
                <textarea className="input" rows={3} placeholder="Street, locality, landmark…"
                  value={form.address} onChange={set('address')} style={{ resize:'vertical' }} />
              </Field>
              <SectionDivider title="Household Members Count" subtitle="How many people live in this house?" color="linear-gradient(#22d3ee,#6c63ff)" />
              <Field label="Total Members in House">
                <input className="input" type="number" min="1" placeholder="e.g. 4" value={totalMembers} onChange={e => setTotalMembers(e.target.value)} />
              </Field>
              <Field label="Adults (18+)">
                <input className="input" type="number" min="0" placeholder="e.g. 2" value={adultCount} onChange={e => setAdultCount(e.target.value)} />
              </Field>
              <Field label="Children (below 18)">
                <input className="input" type="number" min="0" placeholder="e.g. 2" value={childCount} onChange={e => setChildCount(e.target.value)} />
              </Field>
              <Field label="Family Annual Income (₹)">
                <input className="input" type="number" placeholder="Total family income" value={form.familyIncome} onChange={set('familyIncome')} />
              </Field>
            </>}

            {/* ── Step 1: Personal ── */}
            {step === 1 && <>
              <SectionDivider title="Personal Information" />
              <Field label="Head of House?">
                <select className="input" value={form.isHeadOfHouse} onChange={set('isHeadOfHouse')}>
                  <option value="No">No</option>
                  <option value="Yes">Yes — Head of Household</option>
                </select>
              </Field>
              <Field label="First Name">{I('firstName','text','First name')}</Field>
              <Field label="Middle Name">{I('middleName','text','Middle name')}</Field>
              <Field label="Last Name">{I('lastName','text','Last name')}</Field>
              <Field label="Date of Birth">{I('dob','date')}</Field>
              <Field label="Gender">{S('gender',['Male','Female','Other'])}</Field>
              <Field label="Marital Status">{S('maritalStatus',['Single','Married','Widowed','Divorced'])}</Field>
              <Field label="Aadhar Number">{I('addharNumber','text','12-digit Aadhar')}</Field>
              <Field label="Contact Number">{I('contactNumber','tel','10-digit mobile')}</Field>
              <Field label="Voter ID">{I('voterid','text','Voter ID')}</Field>
              <SectionDivider title="Outstation Resident" subtitle="Voter registered here but currently residing elsewhere" color="linear-gradient(#f59e0b,#f97316)" />
              <Field label="Outstation Resident?">
                <select className="input" value={form.outstationResident} onChange={set('outstationResident')}>
                  <option value="No">No — resides in constituency</option>
                  <option value="Yes">Yes — resides outside constituency</option>
                </select>
              </Field>
              {form.outstationResident === 'Yes' && <>
                <Field label="Current City / Town">{I('outstationCity','text','e.g. Bengaluru')}</Field>
                <Field label="Current State">{I('outstationState','text','e.g. Karnataka')}</Field>
                <Field label="Flat / House No.">{I('currentHouseNumber','text','e.g. 4B, 12/3')}</Field>
                <Field label="Area Type">
                  <select className="input" value={form.currentAreaType} onChange={set('currentAreaType')}>
                    <option value="">— Select —</option>
                    {['Urban','Rural','Semi-Urban'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Home Type">
                  <select className="input" value={form.currentHomeType} onChange={set('currentHomeType')}>
                    <option value="">— Select —</option>
                    {['Own','Rent','Government Quarters','Shared'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Current Address" full>
                  <textarea className="input" rows={2} placeholder="Street, area, pin code…"
                    value={form.outstationAddress} onChange={set('outstationAddress')} style={{ resize:'vertical' }} />
                </Field>
              </>}
            </>}

            {/* ── Step 2: Address ── */}
            {step === 2 && <>
              <SectionDivider title="Address Details" subtitle={savedMembers.length > 0 ? "Pre-filled from first member — editable" : "Enter address"} />
              <Field label="House Number">
                <input className="input" type="text" placeholder="House/Flat No." value={form.houseNumber} onChange={set('houseNumber')} />
              </Field>
              <Field label="Ward">
                <select className="input" value={form.wardNumber}
                  onChange={e => setForm(p => ({ ...p, wardNumber: e.target.value, boothNo: '' }))}>
                  <option value="">— Select Ward —</option>
                  {WARD_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="Booth No">
                {form.wardNumber && WARD_BOOTHS[form.wardNumber] ? (
                  <select className="input" value={String(form.boothNo)} onChange={set('boothNo')}>
                    <option value="">— Select Booth —</option>
                    {WARD_BOOTHS[form.wardNumber].map(b => (
                      <option key={b} value={String(b)}>Booth {b}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input" type="text" placeholder="Select ward first"
                    value={form.boothNo} onChange={set('boothNo')} disabled={!form.wardNumber} />
                )}
              </Field>
              <Field label="Area Type">
                <select className="input" value={form.areaType} onChange={set('areaType')}>
                  <option value="">— Select —</option>
                  {['Urban','Rural','Semi-Urban'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Home Type">
                <select className="input" value={form.homeType} onChange={set('homeType')}>
                  <option value="">— Select —</option>
                  {['Own','Rent','Government Quarters','Shared'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Full Address" full>
                <textarea className="input" rows={3} placeholder="Street, locality, landmark…"
                  value={form.address} onChange={set('address')} style={{ resize:'vertical' }} />
              </Field>
              {savedMembers.length > 0 && (
                <div style={{ gridColumn:'1/-1', fontSize:11, color:'var(--gold)', marginTop:-8 }}>
                  ℹ️ Pre-filled from first member's entry. You may edit if different.
                </div>
              )}
            </>}

            {/* ── Step 3: Demographics ── */}
            {step === 3 && <>
              <SectionDivider title="Demographics" />
              <Field label="Religion">{S('religion', RELIGIONS)}</Field>
              <Field label="Community">
                <select className="input" value={form.community} onChange={set('community')}>
                  <option value="">— Select Community —</option>
                  {(COMMUNITIES[form.religion] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Sub-Category">
                <select className="input" value={form.subcategory} onChange={set('subcategory')}>
                  <option value="">— Select Sub-Category —</option>
                  {(SUBCATS[form.community] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Annual Income (₹)">{I('annualIncome','number','Personal annual income')}</Field>
              <Field label="Family Income (₹)">
                <input className="input" type="number" placeholder="Total family income" value={form.familyIncome} onChange={set('familyIncome')} />
              </Field>
              <Field label="Economic Status">{S('economicStatus',['APL','BPL','EWS'])}</Field>
              <Field label="Education">{S('education',['Educated','Uneducated'])}</Field>
              {form.education === 'Educated' && <Field label="Education Type">{S('educationtype', EDU_TYPES)}</Field>}
              <Field label="Minority?">{S('minority',['No','Yes'])}</Field>
              <Field label="Student?">{S('student',['No','Yes'])}</Field>
            </>}

            {/* ── Step 4: Employment & Health ── */}
            {step === 4 && <>
              <SectionDivider title="Employment & Health" />
              <Field label="Employment Status">{S('employmentStatus',['Employed','UnEmployed','Minor','Retired'])}</Field>
              {form.employmentStatus === 'Employed' && <Field label="Employment Type">{S('employmentType', EMP_TYPES)}</Field>}
              <Field label="Health Status">{S('healthStatus',['Healthy','Diseased'])}</Field>
              {form.healthStatus === 'Diseased' && <>
                <Field label="Disease Type">{S('diseaseType', DISEASES)}</Field>
                <Field label="Disease Name">{I('diseaseName','text','Specific name')}</Field>
              </>}
              <Field label="Differently Abled?">{S('differentlyAbled',['No','Yes'])}</Field>
            </>}
          </div>

          {/* ── Future Voters Section ── */}
          {isLastStep && (
            <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)' }}>
              <button
                onClick={() => { setShowFuture(p => !p); if (!showFuture && futureVoters.length === 0) addFutureVoter(); }}
                style={{
                  display:'flex', alignItems:'center', gap:10, width:'100%',
                  background: showFuture ? 'rgba(249,168,37,0.08)' : 'rgba(255,255,255,0.03)',
                  border:`1px solid ${showFuture ? 'rgba(249,168,37,0.4)' : 'var(--border)'}`,
                  borderRadius:10, padding:'12px 16px', cursor:'pointer', textAlign:'left',
                }}
              >
                <span style={{ fontSize:18 }}>🗳️</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color: showFuture ? 'var(--gold)' : 'var(--text-1)' }}>
                    First-Time Voters by 2028
                    {futureVoters.filter(v => v.name.trim()).length > 0 && (
                      <span style={{ marginLeft:8, fontSize:11, background:'rgba(249,168,37,0.2)', color:'var(--gold)', padding:'1px 6px', borderRadius:4 }}>
                        {futureVoters.filter(v => v.name.trim()).length} added
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                    Indicate if any household member will become a first-time voter by 2028
                  </div>
                </div>
                <span style={{ color:'var(--text-3)', fontSize:18 }}>{showFuture ? '▲' : '▼'}</span>
              </button>

              {showFuture && (
                <div style={{ marginTop:14, padding:'14px 16px', background:'rgba(249,168,37,0.04)', borderRadius:10, border:'1px solid rgba(249,168,37,0.15)' }}>
                  {futureVoters.map((v, i) => (
                    <FutureVoterRow
                      key={i} voter={v} index={i}
                      onChange={updateFutureVoter} onRemove={removeFutureVoter}
                      defaultHouseNumber={currentHouse}
                      defaultAddress={currentAddr}
                    />
                  ))}
                  <button onClick={addFutureVoter}
                    style={{ marginTop:6, background:'transparent', border:'1px dashed rgba(249,168,37,0.4)',
                      color:'var(--gold)', borderRadius:8, padding:'7px 16px', cursor:'pointer', fontSize:13 }}>
                    + Add another
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Deceased Section ── */}
          {isLastStep && (
            <div style={{ marginTop:16 }}>
              <button
                onClick={() => { setShowDeceased(p => !p); if (!showDeceased && deceased.length === 0) addDeceased(); }}
                style={{
                  display:'flex', alignItems:'center', gap:10, width:'100%',
                  background: showDeceased ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                  border:`1px solid ${showDeceased ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
                  borderRadius:10, padding:'12px 16px', cursor:'pointer', textAlign:'left',
                }}
              >
                <span style={{ fontSize:18 }}>📋</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color: showDeceased ? '#f87171' : 'var(--text-1)' }}>
                    Deceased Household Members
                    {deceased.filter(d => d.name.trim()).length > 0 && (
                      <span style={{ marginLeft:8, fontSize:11, background:'rgba(239,68,68,0.15)', color:'#f87171', padding:'1px 6px', borderRadius:4 }}>
                        {deceased.filter(d => d.name.trim()).length} added
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                    Record details of any member who has passed away (name, voter ID, death certificate)
                  </div>
                </div>
                <span style={{ color:'var(--text-3)', fontSize:18 }}>{showDeceased ? '▲' : '▼'}</span>
              </button>

              {showDeceased && (
                <div style={{ marginTop:14 }}>
                  {deceased.map((d, i) => (
                    <DeceasedRow key={i} rec={d} index={i} onChange={updateDeceased} onRemove={removeDeceased} />
                  ))}
                  <button onClick={addDeceased}
                    style={{ marginTop:4, background:'transparent', border:'1px dashed rgba(239,68,68,0.4)',
                      color:'#f87171', borderRadius:8, padding:'7px 16px', cursor:'pointer', fontSize:13 }}>
                    + Add another deceased member
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)' }}>
            <div className="flex justify-between" style={{ alignItems:'center' }}>
              <button className="btn btn-ghost"
                onClick={() => step > 0 ? setStep(s => s - 1) : (returnTo ? navigate(returnTo, { state: { returnQuery } }) : navigate('/survey'))}>
                ← {step === 0 ? 'Back' : 'Previous'}
              </button>
              {!isLastStep ? (
                <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                  Next: {STEPS[step + 1]} →
                </button>
              ) : (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'flex-end' }}>
                  {/* Check SIR — manual pre-save check */}
                  <button
                    onClick={handleCheckSir}
                    disabled={sirChecking || busy || (!form.voterid && !form.firstName)}
                    style={{
                      display:'flex', alignItems:'center', gap:7,
                      background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.4)',
                      borderRadius:10, padding:'10px 18px',
                      color:'#fbbf24', fontSize:13, fontWeight:700, cursor:'pointer',
                      opacity: (sirChecking || busy || (!form.voterid && !form.firstName)) ? 0.5 : 1,
                    }}>
                    {sirChecking ? <><span className="spinner" /> Checking…</> : '🔎 Check SIR'}
                  </button>
                  {/* SIR toggle — shows after a member is saved or manual check */}
                  {sirResult && (
                    <button onClick={() => setShowSir(p => !p)} style={{
                      display:'flex', alignItems:'center', gap:7,
                      background: showSir ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.08)',
                      border:'1px solid rgba(139,92,246,0.4)',
                      borderRadius:10, padding:'10px 18px',
                      color:'#a78bfa', fontSize:13, fontWeight:700, cursor:'pointer',
                    }}>
                      🔍 {showSir ? 'Hide SIR' : 'View SIR'}
                      {sirResult.stored && (
                        <span style={{ fontSize:10, background:'rgba(16,185,129,0.2)',
                          color:'#10b981', borderRadius:4, padding:'1px 6px' }}>Stored</span>
                      )}
                    </button>
                  )}
                  <button
                    className="btn btn-ghost"
                    style={{ border:'1px solid rgba(34,211,238,0.35)', color:'var(--cyan)', display:'flex', alignItems:'center', gap:8, padding:'10px 20px' }}
                    onClick={() => handleSubmit('next')} disabled={busy}
                  >
                    {busy && saveMode === 'next' ? <span className="spinner" /> : <><span style={{ fontSize:16 }}>👤</span> Save &amp; Add Next Member</>}
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px' }}
                    onClick={() => handleSubmit('done')} disabled={busy}
                  >
                    {busy && saveMode === 'done' ? <span className="spinner" /> : <><span style={{ fontSize:15 }}>✓</span> {savedMembers.length > 0 ? 'Save & Done' : 'Save Survey'}</>}
                  </button>
                </div>
              )}
            </div>
            {isLastStep && (
              <div style={{ marginTop:12, textAlign:'right', fontSize:11, color:'var(--text-3)' }}>
                <strong style={{ color:'var(--cyan)' }}>Save &amp; Add Next Member</strong> — saves and opens next member form
                &nbsp;·&nbsp;
                <strong style={{ color:'var(--green)' }}>Save &amp; Done</strong> — saves and returns to survey list
              </div>
            )}

            {/* ── SIR Panel — auto-shown after save ── */}
            {showSir && sirResult && (
              <div style={{ marginTop:20, borderRadius:12, overflow:'hidden',
                border:'1px solid rgba(139,92,246,0.3)',
                background:'rgba(139,92,246,0.04)' }}>

                {/* Panel header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 16px', background:'rgba(139,92,246,0.1)',
                  borderBottom:'1px solid rgba(139,92,246,0.2)' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700,
                    fontSize:14, color:'#a78bfa' }}>
                    🔍 SIR Analysis — {sirMember}
                    {sirResult.stored && (
                      <span style={{ marginLeft:8, fontSize:10, fontWeight:700,
                        background:'rgba(16,185,129,0.2)', color:'#10b981',
                        borderRadius:6, padding:'2px 8px' }}>✓ Stored in DB</span>
                    )}
                  </div>
                  <button onClick={() => setShowSir(false)}
                    style={{ background:'none', border:'none',
                      color:'var(--text-3)', cursor:'pointer', fontSize:16 }}>✕</button>
                </div>

                <div style={{ padding:'14px 16px' }}>
                  {/* Roll presence badges */}
                  <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                    <span style={{
                      background: sirResult.in_2025 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${sirResult.in_2025 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700,
                      color: sirResult.in_2025 ? '#10b981' : '#f87171',
                    }}>
                      {sirResult.in_2025 ? '✓' : '✗'} 2025 Roll
                    </span>
                    <span style={{
                      background: sirResult.in_2002 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${sirResult.in_2002 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700,
                      color: sirResult.in_2002 ? '#10b981' : '#f87171',
                    }}>
                      {sirResult.in_2002 ? '✓' : '✗'} 2002 Roll
                    </span>
                  </div>

                  {/* Classification results */}
                  {(sirResult.results || []).map((r, i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'flex-start', gap:12, marginBottom:10,
                      padding:'12px 14px', borderRadius:10,
                      background:`${r.color}0d`, border:`1px solid ${r.color}30`,
                    }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{r.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13,
                          color:r.color, marginBottom:3 }}>{r.label}</div>
                        <div style={{ fontSize:12, color:'var(--text-2)',
                          lineHeight:1.5 }}>{r.detail}</div>
                        {/* Modification diff */}
                        {(r.changes || []).map((c, ci) => (
                          <div key={ci} style={{ marginTop:6, fontSize:11,
                            fontFamily:'monospace', background:'rgba(0,0,0,0.2)',
                            borderRadius:6, padding:'4px 8px', color:'var(--text-1)' }}>
                            <span style={{ color:'#f87171' }}>{c.field}</span>:
                            <span style={{ color:'var(--text-3)' }}> "{c.from}"</span>
                            <span style={{ color:'var(--text-2)' }}> → </span>
                            <span style={{ color:'#86efac' }}>"{c.to}"</span>
                            {c.note && <span style={{ color:'#fbbf24', marginLeft:6 }}>({c.note})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Suspicious flags */}
                  {(sirResult.suspicious || []).length > 0 && (
                    <>
                      <div style={{ fontSize:11, fontWeight:700, color:'#fbbf24',
                        textTransform:'uppercase', letterSpacing:'.06em',
                        marginBottom:6, marginTop:4 }}>⚠ Suspicious Flags</div>
                      {sirResult.suspicious.map((s, i) => (
                        <div key={i} style={{
                          display:'flex', alignItems:'flex-start', gap:10, marginBottom:6,
                          padding:'10px 12px', borderRadius:8,
                          background:'rgba(251,191,36,0.06)',
                          border:'1px solid rgba(251,191,36,0.25)',
                        }}>
                          <span style={{ fontSize:16, flexShrink:0 }}>⚠</span>
                          <div>
                            <div style={{ fontWeight:700, fontSize:12,
                              color:'#fbbf24' }}>{s.label}</div>
                            <div style={{ fontSize:11, color:'var(--text-2)',
                              marginTop:2 }}>{s.detail}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}