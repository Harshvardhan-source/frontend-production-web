import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { surveyApi, wardsApi } from '../api/client';
import api from '../api/client';
import DeceasedRow from '../components/DeceasedRow';
import { useAuth } from '../App';

// ─── Aadhaar photo upload helper ──────────────────────────────────────────────
// Compresses an image File to ≤ 800px wide / ≤ 300 KB JPEG before upload.
function compressAadhaarPhoto(file, maxPx = 800, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
          'image/jpeg', quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

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

// ─── Government Schemes — from Excel dataset + widely-known central/state schemes ──
const SCHEMES = [
  // ── Central Government ──────────────────────────────────────────────────────
  { name:'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',           type:'Central', category:'Agriculture' },
  { name:'Pradhan Mantri Fasal Bima Yojana (PMFBY)',               type:'Central', category:'Agriculture' },
  { name:'Pradhan Mantri Matsya Sampada Yojana (PMMSY)',           type:'Central', category:'Agriculture' },
  { name:'Kisan Credit Card (KCC)',                                 type:'Central', category:'Agriculture' },
  { name:'Pradhan Mantri Kisan Maandhan Yojana (PM-KMY)',          type:'Central', category:'Agriculture' },
  { name:'Students READY (Rural Entrepreneurship Awareness)',       type:'Central', category:'Agriculture' },

  { name:'Pradhan Mantri Awas Yojana - Urban (PMAY-U)',            type:'Central', category:'Housing' },
  { name:'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',           type:'Central', category:'Housing' },

  { name:'Atal Pension Yojana (APY)',                               type:'Central', category:'Finance & Insurance' },
  { name:'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)',       type:'Central', category:'Finance & Insurance' },
  { name:'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',            type:'Central', category:'Finance & Insurance' },
  { name:'Pradhan Mantri Jan Dhan Yojana (PMJDY)',                 type:'Central', category:'Finance & Insurance' },
  { name:'Pradhan Mantri Mudra Yojana (PMMY)',                     type:'Central', category:'Finance & Insurance' },
  { name:'Stand-Up India',                                          type:'Central', category:'Finance & Insurance' },
  { name:'National Pension Scheme for Traders & Self Employed',    type:'Central', category:'Finance & Insurance' },
  { name:'Sukanya Samriddhi Yojana',                               type:'Central', category:'Finance & Insurance' },

  { name:'Ayushman Bharat – PM Jan Arogya Yojana (PMJAY)',        type:'Central', category:'Health' },
  { name:'Niramaya Health Insurance Scheme',                        type:'Central', category:'Health' },
  { name:'Pradhan Mantri Matru Vandana Yojana (PMMVY)',            type:'Central', category:'Health' },
  { name:'Indira Gandhi National Widow Pension Scheme',            type:'Central', category:'Social Security' },
  { name:'Indira Gandhi National Disability Pension Scheme',       type:'Central', category:'Social Security' },
  { name:'National Family Benefit Scheme (NFBS)',                  type:'Central', category:'Social Security' },
  { name:'Pradhan Mantri Garib Kalyan Anna Yojana (PM-GKAY)',     type:'Central', category:'Food & PDS' },
  { name:'Antyodaya Anna Yojana (AAY)',                             type:'Central', category:'Food & PDS' },

  { name:'Pradhan Mantri Ujjwala Yojana (PMUY)',                   type:'Central', category:'Energy' },
  { name:'PM Surya Ghar: Muft Bijli Yojana',                       type:'Central', category:'Energy' },
  { name:'Swachh Bharat Mission',                                   type:'Central', category:'Sanitation' },
  { name:'Pradhan Mantri Shram Yogi Maan-Dhan (PM-SYM)',          type:'Central', category:'Labour' },
  { name:'Mahatma Gandhi NREGA (MGNREGS)',                          type:'Central', category:'Labour' },
  { name:'Pradhan Mantri Rozgar Protsahan Yojana (PMRPY)',         type:'Central', category:'Labour' },

  { name:'Prime Minister\'s Employment Generation Programme (PMEGP)',type:'Central', category:'Employment & Skill' },
  { name:'Pradhan Mantri Kaushal Vikas Yojana (PMKVY)',            type:'Central', category:'Employment & Skill' },
  { name:'Entrepreneurship & Skill Development Programme (ESDP)',  type:'Central', category:'Employment & Skill' },
  { name:'PM Vishwakarma',                                          type:'Central', category:'Employment & Skill' },
  { name:'PM Street Vendors AtmaNirbhar Nidhi (PM SVANidhi)',      type:'Central', category:'Employment & Skill' },
  { name:'Deen Dayal Disabled Rehabilitation Scheme (DDRS)',       type:'Central', category:'Employment & Skill' },

  { name:'Beti Bachao Beti Padhao',                                 type:'Central', category:'Women & Child' },
  { name:'One Stop Centre (OSC)',                                   type:'Central', category:'Women & Child' },
  { name:'Scheme for Adolescent Girls (SAG)',                      type:'Central', category:'Women & Child' },
  { name:'Coir Vikas Yojana – Mahila Coir Yojana',                type:'Central', category:'Women & Child' },

  { name:'Post-Matric Scholarship for SC Students',                type:'Central', category:'Education & Scholarship' },
  { name:'Post-Matric Scholarship for OBC Students',               type:'Central', category:'Education & Scholarship' },
  { name:'Pre-Matric Scholarship for SC/ST Students',              type:'Central', category:'Education & Scholarship' },
  { name:'Pre-Matric Scholarship for Students with Disabilities',  type:'Central', category:'Education & Scholarship' },
  { name:'Top Class Education for Students with Disabilities',     type:'Central', category:'Education & Scholarship' },
  { name:'Rajiv Gandhi National Fellowship for SC Candidates',     type:'Central', category:'Education & Scholarship' },
  { name:'Post Graduate Indira Gandhi Scholarship – Single Girl',  type:'Central', category:'Education & Scholarship' },
  { name:'Pragati Scholarship for Girl Students (Diploma)',        type:'Central', category:'Education & Scholarship' },
  { name:'Padho Pardesh',                                           type:'Central', category:'Education & Scholarship' },
  { name:'Savitribai Jyotirao Phule Fellowship – Single Girl',     type:'Central', category:'Education & Scholarship' },
  { name:'Free Coaching Scheme for SC & OBC Students',             type:'Central', category:'Education & Scholarship' },
  { name:'National Scholarship for Post Graduate Studies',         type:'Central', category:'Education & Scholarship' },
  { name:'Education Loan Scheme (NBCFDC)',                         type:'Central', category:'Education & Scholarship' },
  { name:'IASRI Scholarship for M.Sc & Ph.D',                      type:'Central', category:'Education & Scholarship' },
  { name:'NITI Internship Scheme',                                  type:'Central', category:'Education & Scholarship' },
  { name:'National Action Plan – Skill Dev. for PwDs',             type:'Central', category:'Education & Scholarship' },

  // ── Karnataka State ──────────────────────────────────────────────────────────
  { name:'Gruha Jyothi Scheme (200 units free electricity)',        type:'State', category:'Energy' },
  { name:'Gruha Lakshmi Scheme (₹2000/month)',                      type:'State', category:'Women & Child' },
  { name:'Anna Bhagya Scheme (free foodgrains)',                    type:'State', category:'Food & PDS' },
  { name:'Yuva Nidhi Scheme (unemployment allowance)',              type:'State', category:'Employment & Skill' },
  { name:'Shakti Scheme (free bus travel for women)',               type:'State', category:'Transport' },
  { name:'Thayi Bhagya Scheme (maternal healthcare)',               type:'State', category:'Health' },
  { name:'Bhagyalaxmi Scheme (girl child BPL)',                     type:'State', category:'Women & Child' },
  { name:'Ayushman Bharat – Arogya Karnataka (ABSSK)',              type:'State', category:'Health' },
  { name:'Vidyasiri Food & Accommodation Scholarship',              type:'State', category:'Education & Scholarship' },
  { name:'Prabhuddha Overseas Scholarship (SC/ST)',                 type:'State', category:'Education & Scholarship' },
  { name:'Samruddhi Scheme (SC/ST women entrepreneurs)',            type:'State', category:'Employment & Skill' },
  { name:'Udyogini Scheme (women self-employment)',                  type:'State', category:'Employment & Skill' },
  { name:'Unnati Scheme (startup support – minorities)',            type:'State', category:'Employment & Skill' },
  { name:'Airavata Scheme (SC/ST cab entrepreneurs)',               type:'State', category:'Employment & Skill' },
  { name:'Prerana Micro Credit Finance Scheme',                     type:'State', category:'Employment & Skill' },
  { name:'Shrama Shakthi Scheme (minority entrepreneurs)',          type:'State', category:'Employment & Skill' },
  { name:'Self Employment Scheme (minority communities)',           type:'State', category:'Employment & Skill' },
  { name:'Ganga Kalyana Scheme (minority farmers)',                 type:'State', category:'Agriculture' },
  { name:'Krushy Aranya Protsaha Yojane (KAPY)',                    type:'State', category:'Agriculture' },
  { name:'Nekar Samman Yojana (handloom weavers)',                  type:'State', category:'Employment & Skill' },
  { name:'Subsidy – Taxi / Goods Vehicle / Autorickshaw',           type:'State', category:'Transport' },
  { name:'Incentive for SC Widow Remarriage',                       type:'State', category:'Social Security' },
  { name:'Incentive for Simple Marriage (SC)',                      type:'State', category:'Social Security' },
  { name:'Direct Loans for Business Enterprise (KMDC)',             type:'State', category:'Finance & Insurance' },
  { name:'National Overseas Scholarship for ST Students',           type:'State', category:'Education & Scholarship' },
  { name:'Indira Canteen',                                           type:'State', category:'Food & PDS' },
];

function blankForm(serialNo, wardNumber, locked = {}, prefill = {}) {
  // Ward: locked > passed wardNumber > resolve from booth > prefill.wardNumber
  const resolvedWard  = locked.wardNumber || wardNumber
    || (prefill.boothNo ? getWardByBooth(prefill.boothNo) : '')
    || prefill.wardNumber || '';
  // Booth: locked.boothNo takes precedence (set when navigating from SurveyOpt or after 1st save)
  const resolvedBooth = locked.boothNo != null && locked.boothNo !== ''
    ? String(locked.boothNo)
    : (prefill.boothNo ? String(prefill.boothNo) : '');
  return {
    // ── Member-specific (blank each time) ──
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
    // ── House-level (persist within same house session OR from prefill) ──
    wardNumber:   resolvedWard,
    boothNo:      resolvedBooth,
    houseNumber:  locked.houseNumber  || prefill.houseNumber  || '',
    address:      locked.address      || prefill.address      || '',
    areaType:     locked.areaType     || prefill.areaType     || '',
    homeType:     locked.homeType     || prefill.homeType     || '',
    familyIncome: locked.familyIncome || prefill.familyIncome || '',
    // ── 2025 voter roll fields (pre-populated, editable) ──
    relation:          prefill.relation         || '',
    relationName:      prefill.relationName     || '',
    partNo:            prefill.partNo           || '',
    sectionName:       prefill.sectionName      || '',
    pollingStation:    prefill.pollingStation   || '',
    pollingStationAddr:prefill.pollingStationAddr|| '',
    sourcePdfName:     prefill.sourcePdfName    || '',
    pageNoOfCard:      prefill.pageNoOfCard     || '',
    predictedReligion: prefill.predictedReligion|| '',
    religion:          prefill.religion         || '',
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
          <label className="field-label" style={{ fontSize:11 }}>Head of Family Contact No. (10-digit)</label>
          <input className="input" type="tel" inputMode="numeric" placeholder="10-digit mobile"
            maxLength={10}
            value={voter.headContactNumber || ''}
            onChange={e => {
              const digits = e.target.value.replace(/\D/g,'').slice(0,10);
              onChange(index, 'headContactNumber', digits);
            }} />
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
// ─── SchemeSelector — searchable multi-select with custom entry ───────────────
function SchemeSelector({ selected, onChange }) {
  const [query,    setQuery]    = useState('');
  const [custom,   setCustom]   = useState('');
  const [showList, setShowList] = useState(false);
  const wrapRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowList(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q.length < 1
    ? SCHEMES
    : SCHEMES.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      );

  // Group filtered results by category
  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const toggle = (schemeName) => {
    onChange(
      selected.includes(schemeName)
        ? selected.filter(x => x !== schemeName)
        : [...selected, schemeName]
    );
  };

  const addCustom = () => {
    const v = custom.trim();
    if (v && !selected.includes(v)) {
      onChange([...selected, v]);
      setCustom('');
    }
  };

  const TYPE_COLOR = { Central:'#22d3ee', State:'#a78bfa' };

  return (
    <div ref={wrapRef} style={{ gridColumn:'1/-1' }}>
      {/* Search input */}
      <div style={{ position:'relative', marginBottom:8 }}>
        <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', pointerEvents:'none' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          className="input"
          placeholder="Search schemes… (e.g. PM-KISAN, health, Karnataka)"
          value={query}
          style={{ paddingLeft:34 }}
          onChange={e => { setQuery(e.target.value); setShowList(true); }}
          onFocus={() => setShowList(true)}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:16, lineHeight:1, padding:0 }}>×</button>
        )}
      </div>

      {/* Dropdown */}
      {showList && (
        <div style={{ maxHeight:280, overflowY:'auto', background:'rgba(10,18,35,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, marginBottom:10, scrollbarWidth:'thin' }}>
          {Object.entries(grouped).length === 0 && (
            <div style={{ padding:'14px 16px', fontSize:12, color:'rgba(255,255,255,0.3)' }}>No schemes found — use the custom entry below</div>
          )}
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div style={{ padding:'6px 14px 4px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.2)', letterSpacing:'0.6px', textTransform:'uppercase', background:'rgba(0,0,0,0.2)', position:'sticky', top:0 }}>
                {cat}
              </div>
              {items.map(s => {
                const isSelected = selected.includes(s.name);
                return (
                  <div key={s.name}
                    onClick={() => { toggle(s.name); }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', cursor:'pointer',
                      background: isSelected ? 'rgba(16,185,129,0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #10b981' : '3px solid transparent',
                      transition:'background 0.1s' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='transparent'; }}
                  >
                    {/* Checkbox */}
                    <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${isSelected ? '#10b981' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? '#10b981' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                      {isSelected && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ flex:1, fontSize:12, color: isSelected ? '#e2e8f0' : '#94a3b8', lineHeight:1.4 }}>{s.name}</span>
                    <span style={{ fontSize:9, fontWeight:700, color: TYPE_COLOR[s.type] || '#94a3b8', background:`${TYPE_COLOR[s.type] || '#94a3b8'}15`, border:`1px solid ${TYPE_COLOR[s.type] || '#94a3b8'}30`, borderRadius:4, padding:'1px 5px', whiteSpace:'nowrap', flexShrink:0 }}>
                      {s.type}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
          {selected.map(name => {
            const meta = SCHEMES.find(s => s.name === name);
            const col  = meta ? (TYPE_COLOR[meta.type] || '#94a3b8') : '#10b981';
            return (
              <div key={name} style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${col}12`, border:`1px solid ${col}30`, borderRadius:16, padding:'4px 10px 4px 10px', fontSize:12, color: col === '#10b981' ? '#6ee7b7' : '#c4b5fd', maxWidth:'100%' }}>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:220 }}>{name}</span>
                <button onClick={() => toggle(name)}
                  style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:14, lineHeight:1, padding:0, flexShrink:0, marginLeft:2 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual / custom scheme entry */}
      <div style={{ display:'flex', gap:8 }}>
        <input
          className="input"
          placeholder="Or type a scheme name not listed above…"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          style={{ flex:1 }}
        />
        <button type="button" onClick={addCustom} disabled={!custom.trim()}
          style={{ background:'rgba(168,139,250,0.1)', border:'1px solid rgba(168,139,250,0.3)', borderRadius:8, color:'#a78bfa', padding:'0 16px', fontSize:13, fontWeight:600, cursor: custom.trim() ? 'pointer' : 'not-allowed', whiteSpace:'nowrap', opacity: custom.trim() ? 1 : 0.5 }}>
          + Add
        </button>
      </div>

      {selected.length > 0 && (
        <div style={{ marginTop:6, fontSize:11, color:'rgba(255,255,255,0.25)' }}>
          {selected.length} scheme{selected.length !== 1 ? 's' : ''} selected
          <button onClick={() => onChange([])} style={{ marginLeft:8, background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:11, padding:0, textDecoration:'underline' }}>Clear all</button>
        </div>
      )}
    </div>
  );
}

export default function SurveyForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wardNumber = '', serialNo = 1, wardName = '', boothNo = '',
          prefill = {}, returnTo = '', returnQuery = '' } = location.state || {};

  // ── RBAC: derive role constraints ────────────────────────────────────────
  const role        = user?.role || '';
  const isSuperuser = role === 'mla' || role === 'pa' || !role;
  const isCorporator   = role === 'corporator';
  const isBoothWorker  = role === 'booth_worker';

  // The ward a corporator is locked to (upper-cased for consistent comparison)
  const lockedWard  = isCorporator  ? String(user?.ward  || '').toUpperCase() : null;
  // The booth a booth_worker is locked to
  const lockedBooth = isBoothWorker ? String(user?.booth || '') : null;

  // Can the user change the ward field?
  const wardEditable = isSuperuser;
  // Can the user change the booth field?
  const boothEditable = isSuperuser || isCorporator;

  const [step,          setStep]          = useState(0);
  const [busy,          setBusy]          = useState(false);
  const [saveMode,      setSaveMode]      = useState(null);
  const [error,         setError]         = useState('');
  const [savedMembers,  setSavedMembers]  = useState([]);
  const [currentSerial, setCurrentSerial] = useState(serialNo);
  const [flashMsg,      setFlashMsg]      = useState('');

  // ── 2025 voter roll status — updated after each save ─────────────────────
  // null = unknown, true = in roll, false = NOT in roll (saved to NotFoundRecordSurvey)
  const [inVoterRoll,   setInVoterRoll]   = useState(null);
  const [serialSource,  setSerialSource]  = useState(null); // '2025_roll' or 'manual'

  const [totalMembers,  setTotalMembers]  = useState('');
  const [adultCount,    setAdultCount]    = useState('');
  const [childCount,    setChildCount]    = useState('');

  const [futureVoters,  setFutureVoters]  = useState([]);
  const [showFuture,    setShowFuture]    = useState(false);

  const [deceased,      setDeceased]      = useState([]);
  const [showDeceased,  setShowDeceased]  = useState(false);

  // ── Government schemes used by this individual ────────────────────────────
  const [schemes, setSchemes] = useState([]);
  const [showSchemes, setShowSchemes] = useState(false);

  // ── Aadhaar photo ───────────────────────────────────────────────────────────
  const [aadhaarPhoto,    setAadhaarPhoto]    = useState(null);   // File object
  const [aadhaarPreview,  setAadhaarPreview]  = useState(null);   // data-URL for preview
  const [aadhaarUploading, setAadhaarUploading] = useState(false);
  const aadhaarFileRef   = useRef(null);
  const aadhaarCameraRef = useRef(null);

  // ── SIR — manual check + auto-populated from save response ─────────
  const [sirResult,    setSirResult]   = useState(null);   // SIR data from last save / manual check
  const [showSir,      setShowSir]     = useState(false);  // panel visible?
  const [sirMember,    setSirMember]   = useState('');     // name of checked member
  const [sirChecking,  setSirChecking] = useState(false);  // manual check in progress

  // Resolve booth: explicit boothNo from nav state > locked booth (booth_worker) > prefill.boothNo
  const resolvedBooth = boothNo ? String(boothNo)
    : (lockedBooth || (prefill.boothNo ? String(prefill.boothNo) : ''));
  // Resolve ward: explicit wardNumber > locked ward (corporator/booth_worker) > wardName > derive from booth
  const resolvedWard  = wardNumber || lockedWard || wardName
    || (resolvedBooth ? getWardByBooth(resolvedBooth) : '')
    || prefill.wardNumber || '';

  const lockedRef = useRef({ houseNumber:'', address:'', wardNumber: resolvedWard,
    boothNo: resolvedBooth, areaType:'', homeType:'', familyIncome:'' });
  const [form, setForm] = useState(() => blankForm(serialNo, resolvedWard,
    { wardNumber: resolvedWard, boothNo: resolvedBooth }, prefill));

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

  // ── Aadhaar photo handler ──────────────────────────────────────────────────
  const handleAadhaarPhoto = async (file) => {
    if (!file) return;
    setAadhaarUploading(true);
    try {
      const compressed = await compressAadhaarPhoto(file);
      setAadhaarPhoto(compressed);
      const reader = new FileReader();
      reader.onload = (e) => setAadhaarPreview(e.target.result);
      reader.readAsDataURL(compressed);
    } finally {
      setAadhaarUploading(false);
    }
  };
  const clearAadhaarPhoto = () => {
    setAadhaarPhoto(null); setAadhaarPreview(null);
    if (aadhaarFileRef.current)   aadhaarFileRef.current.value   = '';
    if (aadhaarCameraRef.current) aadhaarCameraRef.current.value = '';
  };

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
      const SIR_URL = (process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com') + '/api/sir/check/';
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
      // Use the shared axios `api` client — it carries auth headers/cookies
      // via its interceptors, exactly like save-future-voters and save-deceased.
      // ⚠️ Do NOT use raw fetch() here — it bypasses auth and causes 401.
      // ── Build payload — log it so we can verify values are non-empty ────────
      const payload = { ...form, schemes, serialNo_voterlist: serialNo };
      console.log('[SurveyForm] submitting payload:', JSON.stringify(payload, null, 2));

      let surveyRes;
      if (aadhaarPhoto) {
        // ── Multipart upload via native fetch() ───────────────────────────────────────
        // axios cannot be used here: the api instance has a hard-coded
        // default  Content-Type: application/json  that survives every
        // per-request override (undefined / null / transformRequest) due to
        // axios instance-level header merging. FormData sent via axios becomes
        // '[object FormData]' with JSON content-type → Django request.FILES
        // is empty → GCS upload is skipped → aadhaarPhotoUrl stays null.
        //
        // fetch() fix: omit Content-Type entirely → browser sets
        // multipart/form-data with the correct boundary automatically.
        //
        // Auth: replicate the client.js interceptor exactly —
        //   sessionStorage.getItem('cc_token') → Authorization: Bearer <token>
        const ccToken = sessionStorage.getItem('cc_token') || '';
        const BASE    = process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com';

        console.log('[SurveyForm] multipart fetch | token:', ccToken ? 'found ✓' : 'MISSING ✗');

        const fd = new FormData();
        fd.append('data', JSON.stringify(payload));
        fd.append('aadhaar_photo', aadhaarPhoto, aadhaarPhoto.name);

        const rawRes = await fetch(`${BASE}/api/save-survey/`, {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Authorization': `Bearer ${ccToken}` },
          // ⚠️ NO Content-Type — browser sets multipart/form-data + boundary
          body: fd,
        });

        if (!rawRes.ok) {
          const errText = await rawRes.text();
          throw new Error(`Upload failed (${rawRes.status}): ${errText.slice(0, 300)}`);
        }
        surveyRes = { data: await rawRes.json() };
      } else {
        // JSON path: send plain object — axios serialises + sets Content-Type: application/json.
        surveyRes = await api.post('/api/save-survey/', payload);
      }
      console.log('[SurveyForm] save response:', surveyRes.data);
      const { data } = surveyRes;
      if (!data.success) { setError(data.message || 'Failed to save.'); return; }

      // ── Update voter-roll status from backend response ─────────────────
      if (data.inVoterRoll !== undefined) setInVoterRoll(data.inVoterRoll);
      if (data.serialSource)              setSerialSource(data.serialSource);
      // Backend resolved the real 2025 serial — update our counter to match
      const confirmedSerial = data.serialNumber || currentSerial;

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
      // ⚠️ Must use fetch() NOT axios here — the `api` axios instance has a
      // hardcoded Content-Type: application/json header that overrides multipart/form-data
      // even when sending FormData, causing Django's request.POST / request.FILES to be
      // empty and the view to 500.  fetch() omits Content-Type so the browser sets
      // multipart/form-data with the correct boundary automatically.
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

        const ccToken   = sessionStorage.getItem('cc_token') || '';
        const BASE      = process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com';
        const rawDecRes = await fetch(`${BASE}/api/save-deceased/`, {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Authorization': `Bearer ${ccToken}` },
          // ⚠️ NO Content-Type — browser sets multipart/form-data + boundary
          body: fd,
        });
        if (!rawDecRes.ok) {
          const errText = await rawDecRes.text();
          throw new Error(`save-deceased failed (${rawDecRes.status}): ${errText.slice(0, 300)}`);
        }
        const deceasedData = await rawDecRes.json();
        const uploadedUrls = deceasedData?.certificateUrls || [];
        const withFiles    = validDeceased.filter(d => d.certificateFile).length;
        if (withFiles > 0 && uploadedUrls.length === 0) {
          setError('⚠ Certificate file could not be uploaded to GCS. Check Render env vars: GCS_BUCKET_NAME and GOOGLE_APPLICATION_CREDENTIALS_JSON.');
          return;
        }
      }

      setSavedMembers(prev => [...prev, { ...form, serialNumber: confirmedSerial }]);

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

      const nextSerial = confirmedSerial + 1;
      setCurrentSerial(nextSerial);
      setInVoterRoll(null);    // reset for next member
      setSerialSource(null);
      setStep(1);
      setFutureVoters([]);
      setShowFuture(false);
      setDeceased([]);
      setShowDeceased(false);
      setForm(blankForm(nextSerial, lockedRef.current.wardNumber, lockedRef.current));
      clearAadhaarPhoto();
      setSchemes([]);
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
      <style>{`
        /* Compact inputs for mobile */
        .page-inner .input { padding: 9px 12px !important; font-size: 14px !important; min-height: 44px; }
        .page-inner select.input { min-height: 44px; }
        .page-inner textarea.input { min-height: 80px; }
        .page-inner .field { margin-bottom: 0; }
        .page-inner .field-label { font-size: 11px; margin-bottom: 4px; }
        /* Prevent nav buttons from overflowing */
        .page-inner .btn { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 44px; }
        .page-inner .btn-primary { font-size: 14px; }
        .page-inner .btn-ghost { font-size: 13px; }
      `}</style>
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
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            <span className="badge badge-gold">Serial #{currentSerial}</span>
            {serialSource === '2025_roll' && (
              <span style={{ fontSize:10, fontWeight:700, background:'rgba(34,211,238,0.12)', color:'#22d3ee', border:'1px solid rgba(34,211,238,0.3)', borderRadius:20, padding:'2px 10px' }}>
                📋 From 2025 Voter Roll
              </span>
            )}
            {serialSource === 'manual' && (
              <span style={{ fontSize:10, fontWeight:700, background:'rgba(245,158,11,0.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.25)', borderRadius:20, padding:'2px 10px' }}>
                ✎ Manual Serial
              </span>
            )}
          </div>
          <h1>Survey Registration</h1>
          <p>Ward: {wardName || `#${wardNumber}`}
            {savedMembers.length > 0 && (
              <span style={{ marginLeft:12, fontSize:13, color:'var(--green)', fontWeight:600 }}>
                · {savedMembers.length} member{savedMembers.length > 1 ? 's' : ''} saved this session
              </span>
            )}
          </p>
        </div>

        {/* ── Not in 2025 voter roll warning ── shown after save if voter was not found */}
        {inVoterRoll === false && (
          <div style={{
            display:'flex', alignItems:'flex-start', gap:12, marginBottom:16,
            background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.3)',
            borderRadius:12, padding:'12px 16px',
          }}>
            <span style={{ fontSize:20, flexShrink:0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'#fbbf24', marginBottom:3 }}>
                Voter not found in 2025 Voter Roll
              </div>
              <div style={{ fontSize:12, color:'rgba(251,191,36,0.7)', lineHeight:1.5 }}>
                This record was saved to <strong style={{ color:'#fbbf24' }}>NotFoundRecordSurvey</strong> collection.
                The voter's EPIC ID or name does not match any record in the 2025 voter list.
                Please verify the Voter ID and re-submit if incorrect.
              </div>
            </div>
          </div>
        )}

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
                {wardEditable ? (
                  <select className="input" value={form.wardNumber}
                    onChange={e => setForm(p => ({ ...p, wardNumber: e.target.value, boothNo: '' }))}>
                    <option value="">— Select Ward —</option>
                    {WARD_NAMES.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                ) : (
                  <div style={{
                    display:'flex', alignItems:'center', gap:8, marginTop:4,
                    padding:'9px 12px', borderRadius:8, cursor:'not-allowed',
                    background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.28)',
                  }}>
                    <span style={{ fontSize:15 }}>🏘</span>
                    <span style={{ fontWeight:700, color:'#f59e0b', fontSize:13, flex:1 }}>
                      {form.wardNumber || lockedWard || 'Ward not assigned'}
                    </span>
                    <span style={{ fontSize:9, fontWeight:700, color:'rgba(245,158,11,0.55)',
                      background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)',
                      borderRadius:4, padding:'1px 5px', letterSpacing:'0.05em' }}>LOCKED</span>
                  </div>
                )}
              </Field>
              <Field label="Booth No">
                {boothEditable ? (
                  <>
                    {isCorporator && form.wardNumber && (WARD_BOOTHS[form.wardNumber] || []).length > 0 ? (
                      <select className="input" value={form.boothNo}
                        onChange={e => setForm(p => ({ ...p, boothNo: e.target.value }))}>
                        <option value="">— Select Booth —</option>
                        {(WARD_BOOTHS[form.wardNumber] || []).map(b => (
                          <option key={b} value={b}>Booth {b}</option>
                        ))}
                      </select>
                    ) : (
                      <input className="input" type="text" inputMode="numeric" placeholder="e.g. 44"
                        value={form.boothNo} onChange={e => setForm(p => ({ ...p, boothNo: e.target.value.replace(/\D/g,'') }))} />
                    )}
                    {form.boothNo && (
                      <div style={{ fontSize:11, color:'var(--gold)', marginTop:4 }}>
                        ✓ Booth {form.boothNo}{isCorporator ? '' : ' — pre-filled, editable'}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    display:'flex', alignItems:'center', gap:8, marginTop:4,
                    padding:'9px 12px', borderRadius:8, cursor:'not-allowed',
                    background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.28)',
                  }}>
                    <span style={{ fontSize:15 }}>🗳️</span>
                    <span style={{ fontWeight:700, color:'#22d3ee', fontSize:13, flex:1 }}>
                      Booth {form.boothNo || lockedBooth || 'Not assigned'}
                    </span>
                    <span style={{ fontSize:9, fontWeight:700, color:'rgba(34,211,238,0.55)',
                      background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.2)',
                      borderRadius:4, padding:'1px 5px', letterSpacing:'0.05em' }}>LOCKED</span>
                  </div>
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
              {/* 2025 Roll prefill banner */}
              {(form.voterid || form.relation || form.pollingStation) && (
                <div style={{ gridColumn:'1/-1', background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:4 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#22d3ee', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>📋 Pre-filled from 2025 Voter Roll — verify &amp; complete</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 20px', fontSize:11, color:'var(--text-2)' }}>
                    {form.voterid       && <span>🪪 <b>{form.voterid}</b></span>}
                    {form.relation      && <span>👤 {form.relation}: {form.relationName}</span>}
                    {form.partNo        && <span>📍 Part {form.partNo}</span>}
                    {form.pollingStation&& <span>🏫 {form.pollingStation}</span>}
                    {form.predictedReligion && <span>🕌 Religion: {({'H':'Hindu','M':'Muslim','C':'Christian'})[form.predictedReligion] || form.predictedReligion}</span>}
                    {form.sectionName   && <span>📌 {form.sectionName}</span>}
                  </div>
                </div>
              )}
              <SectionDivider title="Personal Information" />
              <Field label="Head of House?">
                <select className="input" value={form.isHeadOfHouse} onChange={set('isHeadOfHouse')}>
                  <option value="No">No</option>
                  <option value="Yes">Yes — Head of Household</option>
                </select>
              </Field>
              <Field label="First Name *">{I('firstName','text','First name')}</Field>
              <Field label="Middle Name">{I('middleName','text','Middle name')}</Field>
              <Field label="Last Name">{I('lastName','text','Last name')}</Field>

              {/* ── Relation — pre-filled from 2025 voter roll ── */}
              <Field label="Relation (e.g. Father, Husband)">{I('relation','text','e.g. Father')}</Field>
              <Field label="Relation Name">{I('relationName','text','Name of relation')}</Field>

              {/* DOB — mandatory; if blank show Age fallback */}
              <Field label="Date of Birth *">
                <input className="input" type="date" value={form.dob} onChange={set('dob')} />
              </Field>
              {!form.dob && (
                <Field label="Age (if DOB unknown)">
                  <input className="input" type="number" min="1" max="120" placeholder="Enter age"
                    value={form.age || ''} onChange={set('age')} />
                </Field>
              )}

              <Field label="Gender">{S('gender',['Male','Female','Other'])}</Field>
              <Field label="Marital Status">{S('maritalStatus',['Single','Married','Widowed','Divorced'])}</Field>

              {/* Voter ID — 10-char alphanumeric mandatory */}
              <Field label="Voter ID * (10-char)">
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. NUX4000139"
                  value={form.voterid}
                  maxLength={10}
                  onChange={e => {
                    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'');
                    setForm(p => ({ ...p, voterid: v }));
                  }}
                  style={{ letterSpacing: '0.08em' }}
                />
                {form.voterid && form.voterid.length !== 10 && (
                  <div style={{ fontSize:11, color:'#f87171', marginTop:4 }}>
                    ⚠ Voter ID must be exactly 10 characters ({form.voterid.length}/10)
                  </div>
                )}
              </Field>

              {/* Aadhar — 12-digit mandatory */}
              <Field label="Aadhar Number * (12-digit)">
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                  value={form.addharNumber
                    ? form.addharNumber.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 ').trim()
                    : ''}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g,'').slice(0,12);
                    setForm(p => ({ ...p, addharNumber: digits }));
                  }}
                  style={{ letterSpacing: '0.1em' }}
                />
                {form.addharNumber && form.addharNumber.length !== 12 && (
                  <div style={{ fontSize:11, color:'#f87171', marginTop:4 }}>
                    ⚠ Aadhar must be exactly 12 digits ({form.addharNumber.length}/12)
                  </div>
                )}
              </Field>

              {/* ── Aadhaar Photo — upload from gallery or capture with camera ── */}
              <Field label="Aadhaar Card Photo (optional)" full>
                {/* Hidden inputs */}
                <input ref={aadhaarFileRef}   type="file" accept="image/*"           style={{ display:'none' }} onChange={e => handleAadhaarPhoto(e.target.files[0])} />
                <input ref={aadhaarCameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => handleAadhaarPhoto(e.target.files[0])} />

                {/* Button row */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: aadhaarPreview ? 10 : 0 }}>
                  <button type="button"
                    onClick={() => aadhaarCameraRef.current?.click()}
                    disabled={aadhaarUploading}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:8, padding:'8px 14px', color:'#22d3ee', fontSize:13, fontWeight:600, cursor:'pointer', flex:1, justifyContent:'center', minWidth:130 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                    </svg>
                    Capture Photo
                  </button>
                  <button type="button"
                    onClick={() => aadhaarFileRef.current?.click()}
                    disabled={aadhaarUploading}
                    style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(168,139,250,0.08)', border:'1px solid rgba(168,139,250,0.3)', borderRadius:8, padding:'8px 14px', color:'#a78bfa', fontSize:13, fontWeight:600, cursor:'pointer', flex:1, justifyContent:'center', minWidth:130 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload from Gallery
                  </button>
                  {aadhaarPhoto && (
                    <button type="button" onClick={clearAadhaarPhoto}
                      style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:8, padding:'8px 12px', color:'#f87171', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Remove
                    </button>
                  )}
                </div>

                {/* Processing indicator */}
                {aadhaarUploading && (
                  <div style={{ fontSize:12, color:'#22d3ee', display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                    <span style={{ display:'inline-block', width:10, height:10, border:'2px solid #22d3ee', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                    Compressing image…
                  </div>
                )}

                {/* Preview */}
                {aadhaarPreview && (
                  <div style={{ marginTop:6, position:'relative', display:'inline-block', maxWidth:'100%' }}>
                    <img src={aadhaarPreview} alt="Aadhaar preview"
                      style={{ maxWidth:'100%', maxHeight:180, borderRadius:8, border:'1px solid rgba(34,211,238,0.25)', objectFit:'contain', display:'block' }} />
                    <div style={{ marginTop:4, fontSize:11, color:'rgba(255,255,255,0.35)' }}>
                      ✓ {aadhaarPhoto?.name} · {(aadhaarPhoto?.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                )}
              </Field>

              {/* Phone — 10-digit mandatory */}
              <Field label="Contact Number * (10-digit)">
                <input
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={form.contactNumber}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g,'').slice(0,10);
                    setForm(p => ({ ...p, contactNumber: digits }));
                  }}
                />
                {form.contactNumber && form.contactNumber.length !== 10 && (
                  <div style={{ fontSize:11, color:'#f87171', marginTop:4 }}>
                    ⚠ Phone must be exactly 10 digits ({form.contactNumber.length}/10)
                  </div>
                )}
              </Field>

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
                <input className="input" type="text" inputMode="numeric" placeholder="e.g. 44"
                  value={form.boothNo} onChange={e => setForm(p => ({ ...p, boothNo: e.target.value.replace(/\D/g,'') }))} />
                {form.boothNo && (
                  <div style={{ fontSize:11, color:'var(--gold)', marginTop:4 }}>
                    ✓ Booth {form.boothNo} — pre-filled, editable
                  </div>
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

              {/* ── Polling Station — pre-filled from 2025 voter roll ── */}
              <SectionDivider title="Polling Station (from 2025 Voter Roll)" subtitle="Pre-filled automatically — verify if needed" />
              <Field label="Polling Station Name" full>{I('pollingStation','text','Polling station name')}</Field>
              <Field label="Polling Station Address" full>
                <textarea className="input" rows={2} placeholder="Polling station address…"
                  value={form.pollingStationAddr} onChange={set('pollingStationAddr')} style={{ resize:'vertical' }} />
              </Field>
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

          {/* ── Schemes Section — shown on last step ── */}
          {isLastStep && (
            <div style={{ marginTop:16 }}>
              <button
                type="button"
                onClick={() => setShowSchemes(p => !p)}
                style={{
                  display:'flex', alignItems:'center', gap:10, width:'100%',
                  background: showSchemes ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)',
                  border:`1px solid ${showSchemes ? 'rgba(34,211,238,0.35)' : 'var(--border)'}`,
                  borderRadius:10, padding:'12px 16px', cursor:'pointer', textAlign:'left',
                }}
              >
                <span style={{ fontSize:18 }}>🏛️</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color: showSchemes ? 'var(--cyan)' : 'var(--text-1)' }}>
                    Government Schemes Used
                    {schemes.length > 0 && (
                      <span style={{ marginLeft:8, fontSize:11, background:'rgba(34,211,238,0.15)', color:'var(--cyan)', padding:'1px 6px', borderRadius:4 }}>
                        {schemes.length} selected
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                    Select all government schemes this individual currently benefits from
                  </div>
                </div>
                <span style={{ color:'var(--text-3)', fontSize:18 }}>{showSchemes ? '▲' : '▼'}</span>
              </button>

              {showSchemes && (
                <div style={{ marginTop:12, padding:'14px 16px', background:'rgba(34,211,238,0.03)', borderRadius:10, border:'1px solid rgba(34,211,238,0.12)' }}>
                  {/* Category legend */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'#22d3ee', background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.25)', borderRadius:4, padding:'2px 8px' }}>Central</span>
                    <span style={{ fontSize:10, fontWeight:700, color:'#a78bfa', background:'rgba(168,139,250,0.1)', border:'1px solid rgba(168,139,250,0.25)', borderRadius:4, padding:'2px 8px' }}>State (Karnataka)</span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', alignSelf:'center' }}>— {SCHEMES.length} schemes available. Search or scroll to find, or type a custom name.</span>
                  </div>
                  <SchemeSelector selected={schemes} onChange={setSchemes} />
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)' }}>

            {!isLastStep ? (
              /* Non-last steps: Previous on left, Next on right */
              <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
                <button className="btn btn-ghost"
                  style={{ flex:'0 0 auto', minWidth:80, padding:'10px 12px', fontSize:13 }}
                  onClick={() => step > 0 ? setStep(s => s - 1) : (returnTo ? navigate(returnTo, { state: { returnQuery } }) : navigate('/survey'))}>
                  ← {step === 0 ? 'Back' : 'Prev'}
                </button>
                <button className="btn btn-primary"
                  style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 12px', fontSize:13, overflow:'hidden' }}
                  onClick={() => setStep(s => s + 1)}>
                  <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Next: {STEPS[step + 1]}</span> →
                </button>
              </div>
            ) : (
              /* Last step: stacked mobile-friendly layout */
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

                {/* Row 1: Save Survey — full width primary */}
                <button
                  className="btn btn-primary btn-lg btn-full"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, minHeight:50, fontSize:15 }}
                  onClick={() => handleSubmit('done')} disabled={busy}
                >
                  {busy && saveMode === 'done'
                    ? <span className="spinner" />
                    : <><span style={{ fontSize:17 }}>✓</span> {savedMembers.length > 0 ? 'Save & Done' : 'Save Survey'}</>
                  }
                </button>

                {/* Row 2: Previous + Save & Add Next — equal halves */}
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-ghost"
                    style={{ flex:'0 0 auto', minWidth:90, padding:'10px 12px', fontSize:13 }}
                    onClick={() => setStep(s => s - 1)}>
                    ← Prev
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex:1, minWidth:0, border:'1px solid rgba(34,211,238,0.35)', color:'var(--cyan)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 10px', fontSize:13, minHeight:44, overflow:'hidden' }}
                    onClick={() => handleSubmit('next')} disabled={busy}
                  >
                    {busy && saveMode === 'next' ? <span className="spinner" /> : <><span style={{ fontSize:15, flexShrink:0 }}>👤</span><span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>Save &amp; Add Next</span></>}
                  </button>
                </div>

                {/* Row 3: Check SIR + View SIR */}
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={handleCheckSir}
                    disabled={sirChecking || busy || (!form.voterid && !form.firstName)}
                    style={{
                      flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.35)',
                      borderRadius:10, padding:'9px 10px',
                      color:'#fbbf24', fontSize:12, fontWeight:700, cursor:'pointer',
                      opacity: (sirChecking || busy || (!form.voterid && !form.firstName)) ? 0.5 : 1,
                      minHeight: 40,
                    }}>
                    {sirChecking ? <><span className="spinner" /> Checking…</> : '🔎 Check SIR'}
                  </button>
                  {sirResult && (
                    <button onClick={() => setShowSir(p => !p)} style={{
                      flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                      background: showSir ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.08)',
                      border:'1px solid rgba(139,92,246,0.35)',
                      borderRadius:10, padding:'9px 10px',
                      color:'#a78bfa', fontSize:12, fontWeight:700, cursor:'pointer',
                      minHeight: 40,
                    }}>
                      🔍 {showSir ? 'Hide SIR' : 'View SIR'}
                      {sirResult.stored && (
                        <span style={{ fontSize:10, background:'rgba(16,185,129,0.2)',
                          color:'#10b981', borderRadius:4, padding:'1px 5px', marginLeft:4 }}>✓</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Helper text */}
                <div style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', lineHeight:1.5 }}>
                  <strong style={{ color:'var(--cyan)' }}>Save &amp; Add Next</strong> — next member
                  &nbsp;·&nbsp;
                  <strong style={{ color:'var(--green)' }}>Save Survey</strong> — finish &amp; exit
                </div>
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