import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';

const API = (process.env.REACT_APP_API_URL || 'https://production-web-conn-bzpt.onrender.com') + '/api';

// ─── SIR Ward Data (Political Intelligence) ───────────────────────────────────
const WARD_NAMES = {
  '21':'Padavu','24':'Derebail South','25':'Derebail West','26':'Derebail SW',
  '27':'Boloor','28':'Mannagudda','29':'Kambla','30':'Kodialbail',
  '31':'Bejai','32':'Kadri North','33':'Kadri South','34':'Shivbhag',
  '35':'Padavu Central','36':'Padavu Poorva','37':'Maroli','38':'Bendur',
  '39':'Falnir','40':'Court','41':'Central','42':'Dongerkery',
  '43':'Kudroli','44':'Navayath','45':'Port','46':'Cantonment',
  '47':'Milagris','48':'Valencia','49':'Kankanady','50':'Alape South',
  '51':'Alape North','52':'Kannur','53':'Bajal','54':'Jeppinamuger',
  '55':'Attavara','56':'Mangaladevi','57':'Hoige Bazar','58':'Bolar',
  '59':'Jeppu','60':'Bengre',
};

const PRIORITY_CONFIG = {
  CRITICAL:{ color:'#ef4444', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.3)',  label:'🔴 CRITICAL', order:0 },
  HIGH:    { color:'#f97316', bg:'rgba(249,115,22,0.12)', border:'rgba(249,115,22,0.3)', label:'🟠 HIGH',     order:1 },
  MEDIUM:  { color:'#f59e0b', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.3)', label:'🟡 MEDIUM',   order:2 },
  WATCH:   { color:'#22d3ee', bg:'rgba(34,211,238,0.12)', border:'rgba(34,211,238,0.3)', label:'🟢 WATCH',    order:3 },
  NORMAL:  { color:'#10b981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.2)', label:'— NORMAL',    order:4 },
};

const CLASSIFICATION_CONFIG = {
  'BJP STRONGHOLD':        { color:'#f97316', bg:'rgba(249,115,22,0.15)',  label:'🚩 BJP Stronghold' },
  'BJP STRONG':            { color:'#fb923c', bg:'rgba(251,146,60,0.12)',  label:'🚩 BJP Strong' },
  'BJP FAVOURABLE':        { color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  label:'📌 BJP Favourable' },
  'CONTESTED (BJP Lean)':  { color:'#a3a3a3', bg:'rgba(163,163,163,0.1)', label:'⚖️ Contested (BJP Lean)' },
  'CONTESTED (Cong Lean)': { color:'#a3a3a3', bg:'rgba(163,163,163,0.1)', label:'⚖️ Contested (Cong Lean)' },
  'CONGRESS FAVOURABLE':   { color:'#34d399', bg:'rgba(52,211,153,0.1)',   label:'🏳️ Congress Favourable' },
  'CONGRESS STRONG':       { color:'#10b981', bg:'rgba(16,185,129,0.12)', label:'🏳️ Congress Strong' },
  'CONGRESS STRONGHOLD':   { color:'#059669', bg:'rgba(5,150,105,0.15)',   label:'🏳️ Congress Stronghold' },
};

const SIR_WARD_DATA = {
  21:{ classification:'BJP STRONGHOLD', pollRate:55.7, hindu:84.1, muslim:1.0,  christian:14.8, bloMapped:58.95, progeny:90.05, totalMapped:69.32, totalElectors:7542,  bjpProj:84.1, congProj:15.9, margin:68.2,  priority:'MEDIUM'  },
  24:{ classification:'BJP STRONGHOLD', pollRate:58.1, hindu:80.1, muslim:2.5,  christian:17.4, bloMapped:54.67, progeny:80.04, totalMapped:57.16, totalElectors:4767,  bjpProj:80.1, congProj:19.9, margin:60.2,  priority:'CRITICAL'},
  25:{ classification:'BJP STRONGHOLD', pollRate:65.9, hindu:85.1, muslim:0.8,  christian:14.1, bloMapped:59.87, progeny:85.34, totalMapped:67.6,  totalElectors:7314,  bjpProj:85.1, congProj:14.9, margin:70.2,  priority:'NORMAL'  },
  26:{ classification:'BJP STRONGHOLD', pollRate:60.4, hindu:87.9, muslim:0.6,  christian:11.5, bloMapped:56.96, progeny:75.78, totalMapped:62.68, totalElectors:7801,  bjpProj:87.9, congProj:12.1, margin:75.8,  priority:'NORMAL'  },
  27:{ classification:'BJP STRONGHOLD', pollRate:50.8, hindu:87.5, muslim:1.2,  christian:11.3, bloMapped:60.61, progeny:87.02, totalMapped:68.36, totalElectors:6618,  bjpProj:87.5, congProj:12.5, margin:75.0,  priority:'MEDIUM'  },
  28:{ classification:'BJP STRONGHOLD', pollRate:54.8, hindu:93.7, muslim:1.1,  christian:5.2,  bloMapped:53.78, progeny:68.15, totalMapped:58.1,  totalElectors:8102,  bjpProj:93.7, congProj:6.3,  margin:87.4,  priority:'CRITICAL'},
  29:{ classification:'BJP STRONGHOLD', pollRate:57.9, hindu:92.6, muslim:1.8,  christian:5.6,  bloMapped:57.64, progeny:75.09, totalMapped:63.07, totalElectors:4517,  bjpProj:92.6, congProj:7.4,  margin:85.2,  priority:'HIGH'    },
  30:{ classification:'BJP STRONGHOLD', pollRate:62.9, hindu:80.9, muslim:1.2,  christian:17.9, bloMapped:52.89, progeny:75.01, totalMapped:59.87, totalElectors:7871,  bjpProj:80.9, congProj:19.1, margin:61.8,  priority:'NORMAL'  },
  31:{ classification:'BJP STRONG',     pollRate:58.7, hindu:68.6, muslim:4.7,  christian:26.7, bloMapped:52.54, progeny:83.98, totalMapped:62.03, totalElectors:7246,  bjpProj:68.6, congProj:31.4, margin:37.2,  priority:'HIGH'    },
  32:{ classification:'BJP STRONGHOLD', pollRate:54.5, hindu:86.8, muslim:0.7,  christian:12.5, bloMapped:56.55, progeny:75.79, totalMapped:62.57, totalElectors:6433,  bjpProj:86.8, congProj:13.2, margin:73.6,  priority:'HIGH'    },
  33:{ classification:'BJP FAVOURABLE', pollRate:57.2, hindu:63.9, muslim:5.3,  christian:30.8, bloMapped:51.09, progeny:75.37, totalMapped:57.69, totalElectors:5843,  bjpProj:63.9, congProj:36.1, margin:27.8,  priority:'NORMAL'  },
  34:{ classification:'CONTESTED (BJP Lean)', pollRate:50.2, hindu:52.2, muslim:11.7, christian:36.1, bloMapped:53.38, progeny:98.08, totalMapped:67.94, totalElectors:6294, bjpProj:52.2, congProj:47.8, margin:4.4,  priority:'MEDIUM'  },
  35:{ classification:'BJP STRONG',     pollRate:64.9, hindu:68.3, muslim:4.6,  christian:27.1, bloMapped:56.32, progeny:78.03, totalMapped:63.6,  totalElectors:8462,  bjpProj:68.3, congProj:31.7, margin:36.6,  priority:'NORMAL'  },
  36:{ classification:'BJP FAVOURABLE', pollRate:46.9, hindu:60.2, muslim:3.9,  christian:35.9, bloMapped:52.81, progeny:80.04, totalMapped:61.64, totalElectors:4471,  bjpProj:60.2, congProj:39.8, margin:20.4,  priority:'MEDIUM'  },
  37:{ classification:'BJP STRONG',     pollRate:61.6, hindu:68.7, muslim:0.8,  christian:30.5, bloMapped:64.16, progeny:102.16,totalMapped:76.42, totalElectors:6718,  bjpProj:68.7, congProj:31.3, margin:37.4,  priority:'NORMAL'  },
  38:{ classification:'CONGRESS STRONG',pollRate:52.1, hindu:32.2, muslim:25.2, christian:42.6, bloMapped:59.41, progeny:85.11, totalMapped:75.21, totalElectors:6296,  bjpProj:32.2, congProj:67.8, margin:-35.6, priority:'WATCH'   },
  39:{ classification:'CONGRESS STRONG',pollRate:56.3, hindu:32.1, muslim:9.2,  christian:58.7, bloMapped:60.47, progeny:96.65, totalMapped:71.08, totalElectors:6526,  bjpProj:32.1, congProj:67.9, margin:-35.8, priority:'NORMAL'  },
  40:{ classification:'CONTESTED (BJP Lean)', pollRate:39.5, hindu:51.0, muslim:27.7, christian:21.4, bloMapped:44.77, progeny:88.36, totalMapped:59.57, totalElectors:5980, bjpProj:51.0, congProj:49.0, margin:2.0,  priority:'MEDIUM'  },
  41:{ classification:'BJP STRONGHOLD', pollRate:59.3, hindu:90.4, muslim:7.6,  christian:2.0,  bloMapped:63.43, progeny:74.61, totalMapped:66.61, totalElectors:4882,  bjpProj:90.4, congProj:9.6,  margin:80.8,  priority:'MEDIUM'  },
  42:{ classification:'BJP STRONGHOLD', pollRate:58.4, hindu:86.2, muslim:12.0, christian:1.8,  bloMapped:57.45, progeny:74.47, totalMapped:62.63, totalElectors:7664,  bjpProj:86.2, congProj:13.8, margin:72.4,  priority:'HIGH'    },
  43:{ classification:'CONGRESS STRONG',pollRate:62.1, hindu:28.8, muslim:68.2, christian:3.0,  bloMapped:53.24, progeny:74.07, totalMapped:61.14, totalElectors:5765,  bjpProj:28.8, congProj:71.2, margin:-42.4, priority:'NORMAL'  },
  44:{ classification:'CONGRESS STRONG',pollRate:58.0, hindu:34.6, muslim:65.1, christian:0.3,  bloMapped:54.6,  progeny:81.31, totalMapped:64.37, totalElectors:5871,  bjpProj:34.6, congProj:65.4, margin:-30.8, priority:'NORMAL'  },
  45:{ classification:'CONTESTED (Cong Lean)', pollRate:63.8, hindu:47.6, muslim:40.9, christian:11.4, bloMapped:62.19, progeny:93.55, totalMapped:74.23, totalElectors:7153, bjpProj:47.6, congProj:52.4, margin:-4.8, priority:'NORMAL'  },
  46:{ classification:'BJP STRONG',     pollRate:51.2, hindu:73.8, muslim:20.7, christian:5.5,  bloMapped:56.25, progeny:72.79, totalMapped:61.81, totalElectors:4095,  bjpProj:73.8, congProj:26.2, margin:47.6,  priority:'HIGH'    },
  47:{ classification:'CONGRESS FAVOURABLE', pollRate:55.0, hindu:43.5, muslim:34.8, christian:21.8, bloMapped:54.15, progeny:71.6, totalMapped:60.39, totalElectors:7210, bjpProj:43.5, congProj:56.5, margin:-13.0, priority:'NORMAL'  },
  48:{ classification:'CONTESTED (BJP Lean)', pollRate:49.2, hindu:53.6, muslim:11.5, christian:34.9, bloMapped:57.89, progeny:92.99, totalMapped:54.79, totalElectors:5090, bjpProj:53.6, congProj:46.4, margin:7.2,  priority:'MEDIUM'  },
  49:{ classification:'BJP STRONG',     pollRate:61.4, hindu:76.1, muslim:10.8, christian:13.1, bloMapped:57.73, progeny:96.22, totalMapped:75.65, totalElectors:7527,  bjpProj:76.1, congProj:23.9, margin:52.2,  priority:'NORMAL'  },
  50:{ classification:'BJP STRONG',     pollRate:67.3, hindu:76.1, muslim:8.9,  christian:15.0, bloMapped:56.48, progeny:109.84,totalMapped:77.72, totalElectors:6284,  bjpProj:76.1, congProj:23.9, margin:52.2,  priority:'NORMAL'  },
  51:{ classification:'BJP STRONG',     pollRate:63.0, hindu:68.5, muslim:1.4,  christian:30.0, bloMapped:57.28, progeny:106.1, totalMapped:71.61, totalElectors:7200,  bjpProj:68.5, congProj:31.5, margin:37.0,  priority:'NORMAL'  },
  52:{ classification:'CONGRESS FAVOURABLE', pollRate:61.2, hindu:40.1, muslim:56.9, christian:3.0, bloMapped:58.83, progeny:91.81, totalMapped:74.52, totalElectors:7045, bjpProj:40.1, congProj:59.9, margin:-19.8, priority:'NORMAL'  },
  53:{ classification:'CONTESTED (Cong Lean)', pollRate:55.1, hindu:47.8, muslim:45.2, christian:7.1, bloMapped:59.3, progeny:91.89, totalMapped:71.92, totalElectors:7805, bjpProj:47.8, congProj:52.2, margin:-4.4, priority:'NORMAL'  },
  54:{ classification:'BJP STRONG',     pollRate:61.1, hindu:71.6, muslim:7.4,  christian:20.9, bloMapped:64.09, progeny:94.69, totalMapped:73.73, totalElectors:7266,  bjpProj:71.6, congProj:28.4, margin:43.2,  priority:'NORMAL'  },
  55:{ classification:'BJP FAVOURABLE', pollRate:62.5, hindu:62.9, muslim:24.0, christian:13.1, bloMapped:60.02, progeny:99.92, totalMapped:73.51, totalElectors:7856,  bjpProj:62.9, congProj:37.1, margin:25.8,  priority:'NORMAL'  },
  56:{ classification:'BJP FAVOURABLE', pollRate:61.8, hindu:62.8, muslim:26.8, christian:10.5, bloMapped:57.1,  progeny:83.28, totalMapped:65.88, totalElectors:5358,  bjpProj:62.8, congProj:37.2, margin:25.6,  priority:'NORMAL'  },
  57:{ classification:'BJP STRONG',     pollRate:59.1, hindu:65.1, muslim:30.1, christian:4.8,  bloMapped:65.88, progeny:101.37,totalMapped:76.64, totalElectors:4320,  bjpProj:65.1, congProj:34.9, margin:30.2,  priority:'NORMAL'  },
  58:{ classification:'BJP STRONG',     pollRate:60.9, hindu:71.8, muslim:19.6, christian:8.6,  bloMapped:53.2,  progeny:79.37, totalMapped:61.97, totalElectors:7107,  bjpProj:71.8, congProj:28.2, margin:43.6,  priority:'NORMAL'  },
  59:{ classification:'CONTESTED (BJP Lean)', pollRate:57.3, hindu:52.4, muslim:18.7, christian:29.0, bloMapped:57.05, progeny:97.0, totalMapped:68.69, totalElectors:7711, bjpProj:52.4, congProj:47.6, margin:4.8,  priority:'MEDIUM'  },
  60:{ classification:'CONGRESS STRONG',pollRate:41.6, hindu:30.9, muslim:68.3, christian:0.8,  bloMapped:60.39, progeny:127.86,totalMapped:90.09, totalElectors:10897, bjpProj:30.9, congProj:69.1, margin:-38.2, priority:'WATCH'   },
};

// ─── Risk Wards Card Grid ─────────────────────────────────────────────────────
function RiskWardsOverview({ onWardClick }) {
  const riskWards = Object.entries(SIR_WARD_DATA)
    .filter(([, d]) => d.priority !== 'NORMAL')
    .sort(([, a], [, b]) => (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9));

  const critCount = riskWards.filter(([,d]) => d.priority === 'CRITICAL').length;
  const highCount = riskWards.filter(([,d]) => d.priority === 'HIGH').length;

  return (
    <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(239,68,68,0.2)', borderRadius:16, overflow:'hidden', marginBottom:18 }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.03))', borderBottom:'1px solid rgba(239,68,68,0.15)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>⚠️</div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:'#f87171' }}>SIR Risk Wards — Immediate Action Required</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{riskWards.length} wards identified · Low voter turnout + incomplete SIR surveys</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <div style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:700, color:'#f87171' }}>🔴 {critCount} Critical</div>
          <div style={{ background:'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:700, color:'#fb923c' }}>🟠 {highCount} High</div>
        </div>
      </div>

      {/* Ward grid */}
      <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
        {riskWards.map(([wardNum, d]) => {
          const pCfg  = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.NORMAL;
          const wName = WARD_NAMES[wardNum] || `Ward ${wardNum}`;
          const bjpWin = d.margin > 0;
          return (
            <button key={wardNum} onClick={() => onWardClick && onWardClick(wardNum)} style={{ display:'flex', flexDirection:'column', gap:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${pCfg.border}`, borderRadius:12, padding:14, cursor:'pointer', textAlign:'left', transition:'all 0.15s', minHeight:100 }}
              onMouseEnter={e => { e.currentTarget.style.background = pCfg.bg; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.07)', borderRadius:4, padding:'2px 5px', color:'rgba(255,255,255,0.4)' }}>{wardNum}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#e2e8f0' }}>{wName}</span>
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:pCfg.color }}>{pCfg.label.split(' ')[0]}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>Poll:</span>
                <span style={{ fontSize:11, fontWeight:700, color:d.pollRate < 60.7 ? '#f87171' : '#10b981' }}>{d.pollRate}%</span>
                {d.pollRate < 60.7 && <span style={{ fontSize:11, color:'#f87171' }}>▼ below avg</span>}
              </div>
              <div style={{ display:'flex', borderRadius:3, overflow:'hidden', height:5 }}>
                <div style={{ width:`${d.bjpProj}%`, background:'#f97316' }} />
                <div style={{ width:`${d.congProj}%`, background:'#10b981' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'#f97316', fontWeight:700 }}>BJP {d.bjpProj}%</span>
                <span style={{ fontSize:11, color:bjpWin ? '#f97316' : '#10b981', fontWeight:700, background:'rgba(255,255,255,0.05)', borderRadius:3, padding:'1px 4px' }}>{bjpWin?'+':''}{d.margin}%</span>
                <span style={{ fontSize:11, color:'#10b981', fontWeight:700 }}>INC {d.congProj}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── All Wards SIR Heatmap ────────────────────────────────────────────────────
function AllWardsHeatmap({ onWardClick }) {
  const [showAll, setShowAll] = useState(false);
  const wards = Object.entries(SIR_WARD_DATA)
    .sort(([, a], [, b]) => (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9));
  const displayed = showAll ? wards : wards.slice(0, 20);

  return (
    <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, overflow:'hidden', marginBottom:20, boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:'#e2e8f0', marginBottom:4 }}>All Wards — SIR Heatmap</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>38 wards · Tap any ward to drill down</div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0, paddingTop:2 }}>
          {[{label:'BJP',color:'#f97316'},{label:'Cont.',color:'#a3a3a3'},{label:'INC',color:'#10b981'}].map(({label,color}) => (
            <span key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
              <span style={{ width:9, height:9, borderRadius:3, background:color, display:'inline-block' }} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:0, padding:'8px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.6px' }}>Ward &amp; Classification</div>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.6px', textAlign:'right' }}>Poll / BJP / INC / SIR%</div>
      </div>

      {/* Ward rows */}
      <div style={{ maxHeight:showAll ? 'none' : 500, overflow:showAll ? 'visible' : 'hidden' }}>
        {displayed.map(([wardNum, d]) => {
          const pCfg   = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.NORMAL;
          const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color:'#8899bb', bg:'rgba(255,255,255,0.05)' };
          const wName  = WARD_NAMES[wardNum] || wardNum;
          const bjpWin = d.margin > 0;
          const isRisk = d.priority !== 'NORMAL';
          return (
            <button key={wardNum} onClick={() => onWardClick && onWardClick(wardNum)}
              style={{ width:'100%', border:'none', textAlign:'left', background:isRisk ? pCfg.bg : 'transparent', padding:'14px 18px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'block' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isRisk ? pCfg.bg : 'transparent'; }}>
              {/* Row 1 */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.08)', borderRadius:5, padding:'3px 7px', color:'rgba(255,255,255,0.45)', flexShrink:0, minWidth:28, textAlign:'center' }}>{wardNum}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wName}</span>
                <span style={{ fontSize:10, fontWeight:700, color:clsCfg.color, background:clsCfg.bg, borderRadius:5, padding:'3px 8px', flexShrink:0, whiteSpace:'nowrap' }}>
                  {d.classification.replace('STRONGHOLD','STRGHLD').replace('FAVOURABLE','FAV').replace('CONGRESS','INC').replace('CONTESTED','CONT')}
                </span>
                <span style={{ fontSize:11, fontWeight:700, color:pCfg.color, flexShrink:0 }}>{pCfg.label.split(' ')[0]}</span>
              </div>
              {/* Row 2: bar + stats */}
              <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ display:'flex', borderRadius:3, overflow:'hidden', height:4 }}>
                    <div style={{ width:`${d.bjpProj}%`, background:'#f97316' }} />
                    <div style={{ width:`${d.congProj}%`, background:'#10b981' }} />
                  </div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Poll: <span style={{ color:d.pollRate < 60.7 ? '#f87171' : '#10b981', fontWeight:700 }}>{d.pollRate}%</span></span>
                    <span style={{ fontSize:11, color:'#f97316', fontWeight:700 }}>BJP {d.bjpProj}%</span>
                    <span style={{ fontSize:11, color:bjpWin?'#f97316':'#10b981', fontWeight:800, background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'0 5px' }}>{bjpWin?'+':''}{d.margin}%</span>
                    <span style={{ fontSize:11, color:'#10b981', fontWeight:700 }}>INC {d.congProj}%</span>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>SIR: <span style={{ color:d.totalMapped >= 65 ? '#10b981' : '#f59e0b', fontWeight:700 }}>{d.totalMapped.toFixed(1)}%</span></span>
                  </div>
                </div>
                <span style={{ color:'rgba(255,255,255,0.25)', paddingLeft:8, fontSize:16 }}>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Show more */}
      {wards.length > 20 && (
        <button onClick={() => setShowAll(s => !s)} style={{ width:'100%', padding:16, border:'none', background:'rgba(255,255,255,0.03)', borderTop:'1px solid rgba(255,255,255,0.06)', color:'#22d3ee', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          {showAll ? '▲ Show less' : `▼ Show all ${wards.length} wards`}
        </button>
      )}
    </div>
  );
}



// ─── SVG Icon library — no emoji, no AI-generated icons ──────────────────────
const Icon = {
  User: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3"/>
      <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
    </svg>
  ),
  ID: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="2"/>
      <circle cx="5.5" cy="8" r="1.5"/>
      <path d="M9 6.5h3.5M9 9.5h2"/>
    </svg>
  ),
  House: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7.5L8 2l6 5.5"/>
      <path d="M3.5 6.5V14h3.5v-3.5h2V14H13V6.5"/>
    </svg>
  ),
  Family: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="4.5" r="2"/>
      <circle cx="11" cy="4.5" r="2"/>
      <path d="M1 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/>
      <path d="M8 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5"/>
      <path d="M10.5 10.5L14 14"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M5 8.5l2 2 4-4"/>
    </svg>
  ),
  XCircle: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/>
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 5v6M5 8h6"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4h11M6 4V2.5h4V4M5.5 4l.5 9.5h4l.5-9.5"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 2.5l3 3L5 14H2v-3L10.5 2.5z"/>
    </svg>
  ),
  Warning: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L1 14.5h14L8 1.5z"/>
      <path d="M8 6v4M8 11.5v.5"/>
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5L2 4v4.5c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z"/>
      <path d="M5.5 8.5l2 2 3-3.5"/>
    </svg>
  ),
  List: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h10M3 8h10M3 12h7"/>
    </svg>
  ),
  Chart: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13V7h3v6M7 13V4h3v9M12 13V9h2v4"/>
      <path d="M1 13h14"/>
    </svg>
  ),
  Lightning: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 1.5L4 9h4.5L6.5 14.5 13 7H8.5L9.5 1.5z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 4.5V8l2.5 2"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4"/>
    </svg>
  ),
  SIR: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
      <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"/>
    </svg>
  ),
  Diff: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2" width="5.5" height="12" rx="1"/>
      <rect x="9.5" y="2" width="5.5" height="12" rx="1"/>
      <path d="M7 8h2"/>
    </svg>
  ),
  Flag: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 1.5v13"/>
      <path d="M3 2.5h9l-2.5 4 2.5 4H3"/>
    </svg>
  ),
  X: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13"/>
    </svg>
  ),
  Undo: () => (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V3.5L1 5.5"/>
      <path d="M3 3.5C5 1 9 1 11.5 3.5s2.5 6.5 0 9"/>
    </svg>
  ),
  // Info circle — new
  Info: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 7v4"/>
      <circle cx="8" cy="5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  ),
  // Select radio circle — for row selection
  Radio: ({ checked, color }) => checked ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" fill={color || '#10b981'} fillOpacity="0.18" stroke={color || '#10b981'} strokeWidth="1.8"/>
      <circle cx="8" cy="8" r="3.8" fill={color || '#10b981'}/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" strokeWidth="1.5">
      <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.45)" strokeDasharray="none"/>
    </svg>
  ),
  // Save / floppy
  Save: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 13H3a1 1 0 01-1-1V4l3-3h7a1 1 0 011 1v10a1 1 0 01-1 1z"/>
      <path d="M5 2v4h6V2"/>
      <rect x="4" y="9" width="8" height="4" rx="0.5"/>
    </svg>
  ),
  // Not found / ghost
  Ghost: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14V7a5 5 0 0110 0v7l-2-1.5-2 1.5-2-1.5L5 14z"/>
      <circle cx="6" cy="8" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="8" r="0.8" fill="currentColor" stroke="none"/>
    </svg>
  ),
  // Booth / location pin — new
  Booth: () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.485-2.015-4.5-4.5-4.5z"/>
      <circle cx="8" cy="6" r="1.5"/>
    </svg>
  ),
};

// ─── Category meta ─────────────────────────────────────────────────────────────
const CAT_META = {
  ALL:         { color:'#94a3b8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)',  Icon: Icon.List,    label:'All Records'       },
  NEW:         { color:'#22d3ee', bg:'rgba(34,211,238,0.08)',  border:'rgba(34,211,238,0.25)',  Icon: Icon.Plus,    label:'New Addition'      },
  DELETED:     { color:'#f87171', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.25)',   Icon: Icon.Trash,   label:'Removed from Roll' },
  MODIFIED:    { color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.25)',  Icon: Icon.Edit,    label:'Record Changed'    },
  SUSPICIOUS:  { color:'#ef4444', bg:'rgba(239,68,68,0.10)',  border:'rgba(239,68,68,0.35)',   Icon: Icon.Warning, label:'Suspicious Entry'  },
  RETAINED:    { color:'#10b981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.25)',  Icon: Icon.Shield,  label:'Long-term Voter'   },
  NOT_FOUND:   { color:'#94a3b8', bg:'rgba(148,163,184,0.06)', border:'rgba(148,163,184,0.2)', Icon: Icon.List,    label:'Unregistered'      },
  NAME_SEARCH: { color:'#6366f1', bg:'rgba(99,102,241,0.08)', border:'rgba(99,102,241,0.25)',  Icon: Icon.Search,  label:'Name Search'       },
};

const CAT_STATUS_MAP = {
  NEW_ADDITION: 'NEW', DELETION: 'DELETED', MODIFICATION: 'MODIFIED',
  RETAINED: 'RETAINED', NOT_FOUND: 'NOT_FOUND', SUSPICIOUS: 'SUSPICIOUS',
  NAME_SEARCH: 'NAME_SEARCH',
};
const TABS = ['ALL','NEW','DELETED','MODIFIED','SUSPICIOUS','RETAINED','NOT_FOUND'];

// ─── SIRBadge ─────────────────────────────────────────────────────────────────
function SIRBadge({ category }) {
  const key = CAT_STATUS_MAP[category] || category;
  const m   = CAT_META[key] || CAT_META.ALL;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:m.bg, border:`1px solid ${m.border}`,
      color:m.color, borderRadius:20, padding:'2px 10px',
      fontSize:11, fontWeight:700,
    }}>
      <m.Icon />
      {m.label || category}
    </span>
  );
}

// ─── InputBox ─────────────────────────────────────────────────────────────────
// Detect mobile/Android for conditional behaviour
const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function InputBox({ label, placeholder, value, onChange, IconComp, mono, note, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.6px', display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ color:'rgba(255,255,255,0.3)' }}><IconComp /></span>
        {label}
        {note && <span style={{ marginLeft:4, fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>{note}</span>}
      </label>
      <input
        autoFocus={isMobile ? false : autoFocus}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.25)',
          border: `1px solid ${focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 9,
          padding: '12px 13px',
          fontSize: 16, /* 16px prevents iOS/Android zoom-on-focus */
          color: 'var(--text-1)',
          outline: 'none',
          transition: 'border-color 0.2s, background 0.2s',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ color, dot, children }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.04)', border:`1px solid ${color}40`, borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, color }}>
      {dot === 'pulse' && <span style={{ width:6, height:6, borderRadius:'50%', background:color, animation:'pulse 1.5s infinite', flexShrink:0 }} />}
      {dot === 'spin'  && <span style={{ width:10, height:10, border:`2px solid ${color}30`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }} />}
      {dot === 'solid' && <span style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />}
      {children}
    </div>
  );
}

// ─── RollBadge ────────────────────────────────────────────────────────────────
function RollBadge({ label, found }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 16px', background:'rgba(0,0,0,0.2)', borderRadius:10, border:`1px solid ${found ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}` }}>
      <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.5px' }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color: found ? '#10b981' : '#f87171' }}>
        {found ? <Icon.Check /> : <Icon.XCircle />}
        {found ? 'Found' : 'Absent'}
      </div>
    </div>
  );
}

// ─── VOTER INFO MODAL ─────────────────────────────────────────────────────────
function VoterInfoModal({ record, roll, onClose }) {
  if (!record) return null;

  const accentColor = roll === '2025' ? '#22d3ee' : '#f59e0b';
  const accentBg    = roll === '2025' ? 'rgba(34,211,238,0.08)'  : 'rgba(245,158,11,0.08)';
  const accentBdr   = roll === '2025' ? 'rgba(34,211,238,0.25)'  : 'rgba(245,158,11,0.25)';

  const fields = [
    { label: 'Name',          value: record.name,                    mono: false },
    { label: 'Relation',      value: record.relation,                mono: false },
    { label: 'House / Flat',  value: record.house,                   mono: true  },
    { label: 'Voter ID/EPIC', value: record.voterid,                 mono: true  },
    { label: 'Gender',        value: record.gender,                  mono: false },
    { label: 'Age',           value: record.age,                     mono: false },
    { label: 'Booth No',      value: record.booth || record.part,    mono: false },
    ...(record.serial ? [{ label: 'Serial No', value: record.serial, mono: false }] : []),
    ...(record.score  ? [{ label: 'Match Score', value: `${record.score}%`, mono: false }] : []),
  ].filter(f => f.value);

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'linear-gradient(145deg,rgba(17,28,52,0.99),rgba(10,18,35,0.99))',
          border:`1px solid ${accentBdr}`,
          borderRadius:18, padding:'22px 24px',
          width:'100%', maxWidth:420,
          maxHeight:'90dvh', overflowY:'auto',
          boxShadow:'0 28px 64px rgba(0,0,0,0.65)',
          animation:'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#e2e8f0', marginBottom:5 }}>
              Voter Details
            </div>
            <span style={{
              fontSize:11, fontWeight:700, color:accentColor,
              background:accentBg, border:`1px solid ${accentBdr}`,
              borderRadius:20, padding:'2px 10px',
            }}>
              {roll} ROLL
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:8, color:'rgba(255,255,255,0.5)', width:32, height:32,
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            <Icon.X />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {fields.map(({ label, value, mono }) => (
            <div
              key={label}
              style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 12px',
                background:'rgba(255,255,255,0.03)',
                borderRadius:8, border:'1px solid rgba(255,255,255,0.06)',
                gap:12,
              }}
            >
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>
                {label}
              </span>
              <span style={{
                fontSize:13, fontWeight:600, color:'#e2e8f0',
                textAlign:'right', wordBreak:'break-all',
                fontFamily: mono ? 'ui-monospace,monospace' : 'inherit',
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop:18, textAlign:'center' }}>
          <button
            onClick={onClose}
            style={{
              background:`${accentBg}`, border:`1px solid ${accentBdr}`,
              borderRadius:10, color:accentColor, padding:'9px 32px',
              cursor:'pointer', fontSize:13, fontWeight:700,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── SIR FORM UPLOADER ─────────────────────────────────────────────────────────
// OCR extraction is routed through /api/sir/form-extract/ (server-side).

const SIR_FORM_SECTIONS = {
  personal:      { label: 'Personal',        icon: '👤', color: '#60a5fa', fields: { dateOfBirth:'Date of Birth', aadhaarNo:'Aadhaar No.', mobileNo:'Mobile No.', fathersGuardianName:"Father's / Guardian's Name", fathersGuardianEpicNo:"Father's EPIC No.", mothersName:"Mother's Name", mothersEpicNo:"Mother's EPIC No.", spouseName:"Spouse's Name", spouseEpicNo:"Spouse's EPIC No." } },
  electorDetails:{ label: 'Elector (Last SIR)', icon: '🗳', color: '#34d399', fields: { electorName:'Elector Name', epicNo:'EPIC No.', relativeName:"Relative's Name", relationship:'Relationship', district:'District', state:'State', acName:'AC Name', acNumber:'AC Number', partNo:'Part No.', srNo:'Sr No.' } },
  relativeDetails:{ label: 'Relative (Last SIR)', icon: '👪', color: '#f59e0b', fields: { name:'Name', epicNo:'EPIC No.', relativeName:"Relative's Name", relationship:'Relationship', district:'District', state:'State', acName:'AC Name', acNumber:'AC Number', partNo:'Part No.', srNo:'Sr No.' } },
  preprinted:    { label: 'Pre-printed',      icon: '📋', color: '#a78bfa', fields: { serialNo:'Serial No.', partNo:'Part No.', acPcName:'AC/PC Name', state:'State', electorName:'Elector Name', epicNo:'EPIC No.', address:'Address' } },
};

// ── Highlight key fields for the summary strip ────────────────────────────────
const KEY_FIELDS = [
  { sec:'electorDetails',  key:'electorName',           label:'Name'         },
  { sec:'electorDetails',  key:'epicNo',                label:'EPIC'         },
  { sec:'personal',        key:'dateOfBirth',           label:'DOB'          },
  { sec:'personal',        key:'mobileNo',              label:'Mobile'       },
  { sec:'personal',        key:'aadhaarNo',             label:'Aadhaar'      },
  { sec:'personal',        key:'fathersGuardianName',   label:'Father/Guard' },
  { sec:'electorDetails',  key:'partNo',                label:'Part No.'     },
  { sec:'preprinted',      key:'address',               label:'Address'      },
];

function ExtractedInfoDisplay({ extracted, name, voterid }) {
  const conf    = extracted?.meta?.confidence || 'low';
  const confCfg = {
    high:   { c:'#22c55e', bg:'rgba(34,197,94,0.10)',  border:'rgba(34,197,94,0.25)',  label:'High Confidence'   },
    medium: { c:'#f59e0b', bg:'rgba(245,158,11,0.10)', border:'rgba(245,158,11,0.25)', label:'Medium Confidence' },
    low:    { c:'#ef4444', bg:'rgba(239,68,68,0.10)',  border:'rgba(239,68,68,0.25)',  label:'Low Confidence'    },
  }[conf] || { c:'#94a3b8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)', label:'Unknown' };

  // Count filled fields across all sections
  const totalFields = Object.values(SIR_FORM_SECTIONS).reduce((s, sec) => s + Object.keys(sec.fields).length, 0);
  const filledFields = Object.values(SIR_FORM_SECTIONS).reduce((s, sec) => {
    const data = extracted?.[Object.keys(SIR_FORM_SECTIONS).find(k => SIR_FORM_SECTIONS[k] === sec)] || {};
    return s + Object.keys(sec.fields).filter(k => data[k]?.trim()).length;
  }, 0);

  // Key highlights strip
  const highlights = KEY_FIELDS
    .map(({ sec, key, label }) => ({ label, value: extracted?.[sec]?.[key] }))
    .filter(h => h.value?.trim());

  return (
    <div style={{ marginTop:12, animation:'fadeIn 0.25s ease' }}>

      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
        padding:'10px 14px',
        background:'linear-gradient(135deg, rgba(15,20,40,0.98), rgba(10,15,30,0.98))',
        border:'1px solid rgba(255,255,255,0.09)',
        borderBottom:'none',
        borderRadius:'12px 12px 0 0',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <span style={{ fontSize:15 }}>📄</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', lineHeight:1.2 }}>Extracted Form Data</div>
            {(name || voterid) && (
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:1 }}>
                {name && <span style={{ color:'#94a3b8', fontWeight:600 }}>{name}</span>}
                {voterid && <span style={{ color:'#64748b' }}> · {voterid}</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          {/* Confidence badge */}
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:confCfg.bg, border:`1px solid ${confCfg.border}`, color:confCfg.c, display:'inline-flex', alignItems:'center', gap:5 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:confCfg.c }} />
            {confCfg.label}
          </span>
          {/* Fill rate */}
          <span style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.05)', padding:'3px 9px', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)' }}>
            {filledFields}/{totalFields} fields
          </span>
        </div>
      </div>

      {/* ── Key highlights strip ────────────────────────────────────────────── */}
      {highlights.length > 0 && (
        <div style={{
          display:'flex', flexWrap:'wrap', gap:6, padding:'10px 14px',
          background:'rgba(255,255,255,0.025)',
          border:'1px solid rgba(255,255,255,0.07)',
          borderTop:'1px solid rgba(99,102,241,0.25)',
          borderBottom:'none',
        }}>
          {highlights.map(({ label, value }) => (
            <div key={label} style={{
              display:'inline-flex', alignItems:'baseline', gap:5,
              background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:8, padding:'4px 10px', fontSize:11,
            }}>
              <span style={{ color:'rgba(255,255,255,0.35)', fontWeight:600, fontSize:9, textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>{label}</span>
              <span style={{ color:'#e2e8f0', fontWeight:700, fontFamily: label==='EPIC' || label==='Part No.' ? 'ui-monospace,monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Section cards ───────────────────────────────────────────────────── */}
      <div style={{
        border:'1px solid rgba(255,255,255,0.07)',
        borderRadius:'0 0 12px 12px',
        overflow:'hidden',
        background:'rgba(8,12,24,0.9)',
      }}>
        {Object.entries(SIR_FORM_SECTIONS).map(([skey, cfg], si) => {
          const data   = extracted?.[skey] || {};
          const filled = Object.keys(cfg.fields).filter(k => data[k]?.trim()).length;
          const total  = Object.keys(cfg.fields).length;
          const pct    = Math.round((filled / total) * 100);

          return (
            <div key={skey} style={{ borderTop: si > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              {/* Section header */}
              <div style={{
                display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
                background:`linear-gradient(90deg, ${cfg.color}10, transparent)`,
                borderLeft:`3px solid ${cfg.color}`,
              }}>
                <span style={{ fontSize:13 }}>{cfg.icon}</span>
                <span style={{ fontSize:11, fontWeight:700, color:cfg.color, flex:1 }}>{cfg.label}</span>
                {/* Fill progress */}
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:48, height:3, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:cfg.color, borderRadius:3, transition:'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontWeight:600, minWidth:28, textAlign:'right' }}>{filled}/{total}</span>
                </div>
              </div>

              {/* Fields grid */}
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                {Object.entries(cfg.fields).map(([k, lbl], fi) => {
                  const val   = data[k];
                  const empty = !val?.trim();
                  return (
                    <div
                      key={k}
                      style={{
                        display:'flex', gap:8, alignItems:'flex-start',
                        padding:'6px 14px',
                        borderBottom:'1px solid rgba(255,255,255,0.03)',
                        borderRight: !isMobile && fi % 2 === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: empty ? 'transparent' : 'rgba(255,255,255,0.015)',
                      }}
                    >
                      <span style={{
                        fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.25)',
                        textTransform:'uppercase', letterSpacing:'0.4px',
                        minWidth:90, flexShrink:0, paddingTop:1, lineHeight:1.4,
                      }}>
                        {lbl}
                      </span>
                      <span style={{
                        fontSize:11, fontWeight: empty ? 400 : 600,
                        color: empty ? 'rgba(255,255,255,0.12)' : '#cbd5e1',
                        fontStyle: empty ? 'italic' : 'normal',
                        wordBreak:'break-word', lineHeight:1.4,
                      }}>
                        {empty ? '—' : val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI notes */}
      {extracted?.meta?.notes && (
        <div style={{ marginTop:8, display:'flex', gap:7, alignItems:'flex-start', padding:'8px 12px', background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:8, fontSize:11, color:'#94a3b8', lineHeight:1.5 }}>
          <span style={{ color:'#818cf8', flexShrink:0, marginTop:1 }}><Icon.Info /></span>
          <span>{extracted.meta.notes}</span>
        </div>
      )}
      {extracted?.meta?.missingFields?.length > 0 && (
        <div style={{ marginTop:6, display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', padding:'6px 10px', background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.12)', borderRadius:8 }}>
          <span style={{ fontSize:9, fontWeight:700, color:'rgba(239,68,68,0.6)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Blank fields:</span>
          {extracted.meta.missingFields.slice(0,8).map(f => (
            <span key={f} style={{ fontSize:9, color:'#f87171', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:5, padding:'1px 6px', fontWeight:600 }}>{f}</span>
          ))}
          {extracted.meta.missingFields.length > 8 && (
            <span style={{ fontSize:9, color:'rgba(239,68,68,0.4)' }}>+{extracted.meta.missingFields.length - 8} more</span>
          )}
        </div>
      )}
    </div>
  );
}

function SIRFormUploader({ docId, name, voterid, pendingImage, onPendingImageChange, onExtractedChange }) {
  // pendingImage / onPendingImageChange allow the parent (ConfirmBar) to
  // pre-attach a photo before saving — so both happen in one "Confirm & Save" click.
  // onExtractedChange: called with the extracted JSON (or null on reset) so the
  // parent can store it and attach it once the record doc_id is known.
  const [phase,       setPhase]       = React.useState('idle');
  const [imageData,   setImageData]   = React.useState(pendingImage || null);
  const [extracted,   setExtracted]   = React.useState(null);
  const [attachErr,   setAttachErr]   = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);
  const fileRef    = useRef();
  const cameraRef  = useRef();

  // Keep parent in sync when imageData changes (pre-save flow)
  React.useEffect(() => {
    if (onPendingImageChange) onPendingImageChange(imageData);
  }, [imageData]);

  // Keep parent in sync when extracted data changes (pre-save flow).
  // This is the key hook that lets ConfirmAndSaveBar store the extracted
  // JSON and attach it to the document once savedDocId is available.
  React.useEffect(() => {
    if (onExtractedChange) onExtractedChange(extracted);
  }, [extracted]);

  // If docId arrives (parent just saved), auto-attach any extracted data
  React.useEffect(() => {
    if (docId && extracted && phase === 'review') {
      handleAttach();
    }
  }, [docId]);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setImageData({ base64, mimeType: file.type, previewUrl: e.target.result });
      setPhase('preview');
      setExtracted(null);  // clears local + triggers onExtractedChange(null) via useEffect
      setAttachErr('');
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!imageData) return;
    setPhase('extracting');
    try {
      const token = sessionStorage.getItem('cc_token');
      const hdrs  = { 'Content-Type': 'application/json' };
      if (token) hdrs['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/sir/form-extract/`, {
        method: 'POST', credentials: 'include', headers: hdrs,
        body: JSON.stringify({ image: imageData.base64, mimeType: imageData.mimeType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Server error');
      setExtracted(json.data);
      setPhase('review');
    } catch (err) {
      setAttachErr('Extraction failed: ' + (err.message || 'unknown'));
      setPhase('error');
    }
  };

  const handleAttach = async () => {
    if (!extracted || !docId) {
      if (!docId) { setAttachErr('No document ID — will auto-attach when record is saved.'); return; }
      setAttachErr('No extracted data.'); setPhase('error'); return;
    }
    setPhase('attaching');
    try {
      const token = sessionStorage.getItem('cc_token');
      const hdrs  = { 'Content-Type': 'application/json' };
      if (token) hdrs['Authorization'] = `Bearer ${token}`;
      const payload = {
        doc_id:          docId,
        form_extraction: extracted,
        // Send the original image so the backend uploads it to GCS
        // and stores a public URL — not raw base64 — in MongoDB.
        ...(imageData ? {
          form_image_b64:  imageData.base64,
          image_mime_type: imageData.mimeType,
        } : {}),
      };
      const res  = await fetch(`${API}/sir/attach-form/`, {
        method: 'POST', credentials: 'include', headers: hdrs,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        // Store returned GCS URL so it can be displayed in the success panel
        if (data.form_image_url && imageData) {
          setImageData(prev => ({ ...prev, gcpUrl: data.form_image_url }));
        }
        setPhase('attached');
      }
      else { setAttachErr(data.message || 'Attach failed'); setPhase('error'); }
    } catch (err) { setAttachErr(err.message || 'Network error'); setPhase('error'); }
  };

  // ── Standalone mode (docId already exists — record already saved) ─────────
  if (docId && phase === 'idle') {
    return (
      <div style={{ width:'100%', marginTop:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#10b981', fontWeight:700, fontSize:13 }}>
            <Icon.Check /> Saved to database
          </div>
          <span style={{ color:'rgba(255,255,255,0.15)', fontSize:12 }}>·</span>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:8, padding:'7px 14px', cursor:'pointer', color:'#818cf8', fontSize:12, fontWeight:700 }}>
              📎 Attach SIR Form
            </button>
            <button onClick={() => cameraRef.current?.click()}
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:8, padding:'7px 14px', cursor:'pointer', color:'#22d3ee', fontSize:12, fontWeight:700 }}>
              📷 Capture Photo
            </button>
          </div>
          <input ref={fileRef}   type="file" accept="image/*"           style={{ display:'none' }} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); e.target.value=''; }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); e.target.value=''; }} />
        </div>
      </div>
    );
  }

  // ── Pre-save mode: image attached but not yet saved ───────────────────────
  const isPreSave = !docId;

  return (
    <div style={{ width:'100%' }}>

      {/* ── Image source buttons (idle / no image yet) ─────────────────────── */}
      {phase === 'idle' && (
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:9, padding:'9px 16px', cursor:'pointer', color:'#818cf8', fontSize:12, fontWeight:700 }}>
            📁 Upload Form Image
          </button>
          <button onClick={() => cameraRef.current?.click()}
            style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:9, padding:'9px 16px', cursor:'pointer', color:'#22d3ee', fontSize:12, fontWeight:700 }}>
            📷 Take Photo
          </button>
          <input ref={fileRef}   type="file" accept="image/*"           style={{ display:'none' }} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); e.target.value=''; }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); e.target.value=''; }} />
        </div>
      )}

      {/* ── Preview: image selected, awaiting Extract ──────────────────────── */}
      {(phase === 'preview') && imageData && (
        <div style={{ background:'rgba(10,15,30,0.8)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px' }}>
            <img src={imageData.previewUrl} alt="SIR form" onClick={() => setShowPreview(true)}
              style={{ width:54, height:54, objectFit:'cover', borderRadius:8, cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#e2e8f0' }}>
                {isPreSave ? '📎 Form image attached — will extract on save' : 'Form image ready'}
              </div>
              <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>
                {isPreSave ? 'Click "Confirm & Save" to save the record and extract form data in one step' : 'Click image to preview · Claude will read all fields'}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              {!isPreSave && (
                <button onClick={handleExtract}
                  style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#3b82f6,#6366f1)', border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700 }}>
                  ⚡ Extract Now
                </button>
              )}
              <button onClick={() => { setPhase('idle'); setImageData(null); }}
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 10px', cursor:'pointer', color:'#f87171', fontSize:12 }}>✕</button>
            </div>
          </div>
          {isPreSave && (
            <div style={{ padding:'0 14px 10px', display:'flex', gap:6 }}>
              <button onClick={handleExtract}
                style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:8, padding:'7px 14px', cursor:'pointer', color:'#818cf8', fontSize:11, fontWeight:700 }}>
                ⚡ Preview Extraction
              </button>
              <button onClick={() => { if (fileRef.current) fileRef.current.click(); }}
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'7px 12px', cursor:'pointer', color:'#64748b', fontSize:11 }}>
                Change Image
              </button>
              <button onClick={() => { if (cameraRef.current) cameraRef.current.click(); }}
                style={{ background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.15)', borderRadius:8, padding:'7px 12px', cursor:'pointer', color:'#22d3ee', fontSize:11 }}>
                📷 Retake
              </button>
              <input ref={fileRef}   type="file" accept="image/*"           style={{ display:'none' }} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); e.target.value=''; }} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); e.target.value=''; }} />
            </div>
          )}
        </div>
      )}

      {/* ── Extracting spinner ─────────────────────────────────────────────── */}
      {phase === 'extracting' && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, marginTop:6 }}>
          <span style={{ display:'inline-block', animation:'spin 0.9s linear infinite', fontSize:18 }}>⟳</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#818cf8' }}>Extracting form fields…</div>
            <div style={{ fontSize:10, color:'#475569', marginTop:1 }}>Claude Vision is reading the Annexure-III form</div>
          </div>
        </div>
      )}

      {/* ── Review: show extracted info display ───────────────────────────── */}
      {phase === 'review' && extracted && (
        <div>
          <ExtractedInfoDisplay extracted={extracted} name={name} voterid={voterid} />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:10 }}>
            {!isPreSave && (
              <button onClick={handleAttach}
                style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.35)', borderRadius:9, padding:'9px 18px', cursor:'pointer', color:'#10b981', fontSize:13, fontWeight:700 }}>
                <Icon.Save /> Save to Record
              </button>
            )}
            {isPreSave && (
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:9, fontSize:11, color:'#6ee7b7', fontWeight:600 }}>
                <Icon.Check /> Extraction preview — will be saved with the record
              </div>
            )}
            <button onClick={() => { setPhase('preview'); setExtracted(null); }}
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'9px 14px', cursor:'pointer', color:'#64748b', fontSize:12 }}>Re-extract</button>
            <button onClick={() => { setPhase('idle'); setImageData(null); setExtracted(null); }}
              style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:9, padding:'9px 14px', cursor:'pointer', color:'#f87171', fontSize:12 }}>Remove</button>
          </div>
        </div>
      )}

      {/* ── Attaching ─────────────────────────────────────────────────────── */}
      {phase === 'attaching' && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8, color:'#6366f1', fontSize:12, fontWeight:600 }}>
          <span style={{ display:'inline-block', animation:'spin 0.9s linear infinite' }}>⟳</span> Saving form data…
        </div>
      )}

      {/* ── Attached success ──────────────────────────────────────────────── */}
      {phase === 'attached' && (
        <div style={{ marginTop:8, padding:'12px 14px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#10b981', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
            <Icon.Check /> Form data saved to database
          </div>
          {/* GCS image URL badge — shown when backend returned a public URL */}
          {imageData?.gcpUrl && (
            <div style={{ marginBottom:8, display:'flex', alignItems:'center', gap:6, padding:'6px 10px', background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.18)', borderRadius:7 }}>
              <span style={{ fontSize:11, color:'#22d3ee', fontWeight:700, flexShrink:0 }}>📸 Stored:</span>
              <a href={imageData.gcpUrl} target="_blank" rel="noreferrer"
                style={{ color:'#7dd3fc', textDecoration:'none', fontSize:10, wordBreak:'break-all' }}>
                {imageData.gcpUrl}
              </a>
            </div>
          )}
          {extracted && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {KEY_FIELDS.map(({ sec, key, label }) => {
                const val = extracted?.[sec]?.[key];
                if (!val) return null;
                return (
                  <span key={label} style={{ fontSize:10, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:6, padding:'2px 8px', color:'#6ee7b7' }}>
                    <span style={{ color:'#10b981', fontWeight:700 }}>{label}: </span>{val}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {phase === 'error' && (
        <div style={{ marginTop:8, padding:'10px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, fontSize:12, color:'#fca5a5', display:'flex', alignItems:'center', gap:8 }}>
          <span>⚠ {attachErr || 'Something went wrong.'}</span>
          <button onClick={() => { setPhase(extracted ? 'review' : 'preview'); setAttachErr(''); }}
            style={{ background:'none', border:'none', color:'#60a5fa', cursor:'pointer', fontSize:12, fontWeight:600, padding:0, marginLeft:4 }}>Retry</button>
        </div>
      )}

      {/* ── Full image preview modal ──────────────────────────────────────── */}
      {showPreview && imageData && (
        <div onClick={() => setShowPreview(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16, cursor:'zoom-out' }}>
          <img src={imageData.previewUrl} alt="form" style={{ maxWidth:'92vw', maxHeight:'92vh', objectFit:'contain', borderRadius:8 }} />
        </div>
      )}
    </div>
  );
}

// ─── CONFIRM AND SAVE BAR ─────────────────────────────────────────────────────
// Integrates the form uploader BEFORE the save so one click does everything.
function ConfirmAndSaveBar({ decided25, decided02, selected25, selected02, notFound25, notFound02, canConfirm, confirmStatus, savedDocId, handleConfirm, voterName, voterId }) {
  const [pendingImage,   setPendingImage]   = useState(null);
  const [pendingExtract, setPendingExtract] = useState(null);
  const [showFormPanel,  setShowFormPanel]  = useState(false);
  const uploaderRef = useRef();

  // When saved: auto-attach extracted data if we have it.
  // Dependency array includes pendingExtract so this re-fires if the
  // extraction result arrives just after the save completes.
  React.useEffect(() => {
    if (confirmStatus === 'saved' && savedDocId && pendingExtract) {
      (async () => {
        try {
          const token = sessionStorage.getItem('cc_token');
          const hdrs  = { 'Content-Type': 'application/json' };
          if (token) hdrs['Authorization'] = `Bearer ${token}`;
          await fetch(`${API}/sir/attach-form/`, {
            method: 'POST', credentials: 'include', headers: hdrs,
            body: JSON.stringify({
              doc_id:          savedDocId,
              form_extraction: pendingExtract,
              // ── include the captured/uploaded photo so the backend
              //    uploads it to GCS and stores the public URL in MongoDB ──
              ...(pendingImage ? {
                form_image_b64:  pendingImage.base64,
                image_mime_type: pendingImage.mimeType,
              } : {}),
            }),
          });
        } catch { /**/ }
      })();
    }
  }, [confirmStatus, savedDocId, pendingExtract, pendingImage]);

  const hasPendingForm = !!(pendingImage || pendingExtract);

  if (confirmStatus === 'saved') {
    return (
      <div style={{ marginTop:12, borderRadius:12, border:'1px solid rgba(16,185,129,0.2)', background:'rgba(16,185,129,0.04)', padding:'14px 16px' }}>
        <SIRFormUploader
          docId={savedDocId}
          name={voterName}
          voterid={voterId}
        />
      </div>
    );
  }

  if (confirmStatus === 'error') {
    return (
      <div style={{ marginTop:12, borderRadius:12, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.04)', padding:'12px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ color:'#f87171', fontWeight:700, fontSize:12, flex:1 }}>Save failed — please retry</span>
        <button onClick={handleConfirm} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#f87171', fontSize:12, padding:'7px 14px', cursor:'pointer', fontWeight:600 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop:12, borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(0,0,0,0.25)', overflow:'hidden' }}>

      {/* ── Step status row ────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', padding:'12px 16px', borderBottom: showFormPanel ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        {/* Roll selections */}
        <div style={{ display:'flex', gap:8, flex:1, flexWrap:'wrap' }}>
          {[
            { year:'2025', decided: decided25, sel: selected25, notF: notFound25, color:'#22d3ee' },
            { year:'2002', decided: decided02, sel: selected02, notF: notFound02, color:'#f59e0b' },
          ].map(({ year, decided, sel, notF, color }) => (
            <div key={year} style={{
              display:'flex', alignItems:'center', gap:6, fontSize:11, padding:'5px 10px',
              borderRadius:8,
              background: decided ? `${color}14` : 'rgba(255,255,255,0.04)',
              border:`1px solid ${decided ? color + '40' : 'rgba(255,255,255,0.07)'}`,
            }}>
              {decided
                ? <span style={{ color }}><Icon.Check /></span>
                : <span style={{ width:10, height:10, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.2)', display:'inline-block' }} />}
              <span style={{ color: decided ? color : 'rgba(255,255,255,0.3)', fontWeight: decided ? 700 : 400 }}>
                {year}: {notF ? 'Absent' : sel ? (sel.name || sel.voterid || 'Selected') : 'Pick a row'}
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          {/* Attach form toggle */}
          <button
            onClick={() => setShowFormPanel(p => !p)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              background: hasPendingForm ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              border:`1px solid ${hasPendingForm ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:9, padding:'8px 14px',
              cursor:'pointer',
              color: hasPendingForm ? '#818cf8' : 'rgba(255,255,255,0.4)',
              fontSize:12, fontWeight:700,
              transition:'all 0.2s',
            }}
          >
            {hasPendingForm ? <><Icon.Check /> Form Ready</> : <>📎 + Add Form</>}
          </button>

          {/* Confirm & Save */}
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || confirmStatus === 'saving'}
            style={{
              display:'flex', alignItems:'center', gap:8,
              background: canConfirm
                ? hasPendingForm
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(99,102,241,0.15))'
                  : 'rgba(16,185,129,0.12)'
                : 'rgba(255,255,255,0.04)',
              border:`1px solid ${canConfirm ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:10, padding:'10px 20px',
              cursor: canConfirm ? 'pointer' : 'default',
              color: canConfirm ? '#10b981' : 'rgba(255,255,255,0.25)',
              fontWeight:700, fontSize:13,
              transition:'all 0.2s',
              opacity: canConfirm ? 1 : 0.6,
              minHeight:42,
              boxShadow: canConfirm ? '0 0 0 0 rgba(16,185,129,0)' : 'none',
            }}
            onMouseEnter={e => { if (canConfirm) e.currentTarget.style.boxShadow = '0 0 16px rgba(16,185,129,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            {confirmStatus === 'saving'
              ? <><span style={{ display:'inline-block', animation:'spin 0.7s linear infinite', fontSize:14 }}>⟳</span> Saving…</>
              : <><Icon.Save /> Confirm &amp; Save{hasPendingForm ? ' + Form' : ''}</>
            }
          </button>
        </div>
      </div>

      {/* ── Form attach panel (collapsible) ───────────────────────────────── */}
      {showFormPanel && (
        <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.15)', animation:'fadeIn 0.2s ease' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ color:'#818cf8' }}><Icon.SIR /></span>
            Attach SIR Form — saved together when you click Confirm &amp; Save
          </div>
          <SIRFormUploader
            docId={null}
            name={voterName}
            voterid={voterId}
            onPendingImageChange={(img) => setPendingImage(img)}
            onExtractedChange={(ext) => setPendingExtract(ext)}
          />
        </div>
      )}
    </div>
  );
}

// ─── SIMILAR RECORDS PANEL ────────────────────────────────────────────────────
function SimilarRecordsPanel({ similar2025, similar2002, record2025, record2002, in2025, in2002, inputFieldCount = 0, searchName = '', searchRelation = '', searchEpic = '', searchInputs = {}, confirmedVoterIds = new Set() }) {
  const [infoRecord,     setInfoRecord]     = useState(null);
  // ── Confirmation selection state ──────────────────────────────────────────
  // selected25 / selected02 = the row object the user ticked, or null
  // notFound25 / notFound02 = true when user explicitly says "not in this roll"
  const [selected25,    setSelected25]    = useState(null);
  const [selected02,    setSelected02]    = useState(null);
  const [notFound25,    setNotFound25]    = useState(false);
  const [notFound02,    setNotFound02]    = useState(false);
  const [confirmStatus, setConfirmStatus] = useState('idle'); // idle | saving | saved | error
  const [savedDocId,    setSavedDocId]    = useState(null);   // MongoDB _id returned after save
  // Local set of voter IDs saved this session (merges with prop)
  const [localSavedIds, setLocalSavedIds] = useState(new Set());
  const allSavedIds = new Set([...confirmedVoterIds, ...localSavedIds]);

  const decided25  = selected25 !== null || notFound25;
  const decided02  = selected02 !== null || notFound02;
  const canConfirm = decided25 && decided02;

  const handleSelect25 = (row) => {
    setSelected25(prev => (prev?.voterid === row.voterid && prev?.name === row.name ? null : row));
    setNotFound25(false);
    setConfirmStatus('idle');
  };
  const handleSelect02 = (row) => {
    setSelected02(prev => (prev?.voterid === row.voterid && prev?.name === row.name ? null : row));
    setNotFound02(false);
    setConfirmStatus('idle');
  };
  const handleNotFound25 = () => { setSelected25(null); setNotFound25(p => !p); setConfirmStatus('idle'); };
  const handleNotFound02 = () => { setSelected02(null); setNotFound02(p => !p); setConfirmStatus('idle'); };

  const handleConfirm = async () => {
    setConfirmStatus('saving');
    try {
      const token = sessionStorage.getItem('cc_token');
      const hdrs = { 'Content-Type': 'application/json' };
      if (token) hdrs['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/sir/confirm/`, {
        method: 'POST',
        credentials: 'include',
        headers: hdrs,
        body: JSON.stringify({
          record_2025:    notFound25 ? null : selected25,
          record_2002:    notFound02 ? null : selected02,
          not_found_2025: notFound25,
          not_found_2002: notFound02,
          search_inputs:  searchInputs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmStatus('saved');
        setSavedDocId(data.doc_id || null);
        setLocalSavedIds(prev => {
          const next = new Set(prev);
          if (selected25?.voterid) next.add(selected25.voterid);
          if (selected02?.voterid) next.add(selected02.voterid);
          return next;
        });
      } else {
        setConfirmStatus('error');
      }
    } catch {
      setConfirmStatus('error');
    }
  };

  // ── Validate whether a "confirmed" record is truly an exact/close match ──────
  // The backend's Tier-1/Tier-2 lookup can return a fuzzy match that doesn't
  // actually satisfy the search inputs (e.g. relation "HECH SHINA" when the user
  // typed "sheela").  We do a lightweight sanity check here so we don't mislead
  // the user with a green "Confirmed Match" badge on a clearly wrong record.
  const _normalize = s => (s || '').trim().toUpperCase();
  const _nameMatch = (rec) => {
    if (!searchName) return true;
    const n = _normalize(rec?.name || '');
    const q = _normalize(searchName);
    return q.split(/\s+/).filter(Boolean).every(tok => n.includes(tok));
  };
  const _relMatch = (rec) => {
    if (!searchRelation) return true;
    const r = _normalize(rec?.relation || '');
    const q = _normalize(searchRelation);
    const tokens = q.split(/\s+/).filter(t => t.length >= 2);
    if (!tokens.length) return true;
    // Single-token query: just check presence.
    if (tokens.length === 1) return r.includes(tokens[0]);
    // Multi-token query: strictly more than half the tokens must appear in the
    // candidate relation.  For a 2-token query ("MADHAVARAYA KAMATH") this
    // means BOTH must match — preventing a shared surname ("KAMATH") from
    // confirming a completely different person ("VAMANA KAMATH").
    // For 3 tokens: 2 of 3 must match; for 4: 3 of 4; etc.
    const matched = tokens.filter(tok => r.includes(tok)).length;
    return matched / tokens.length > 0.5;
  };
  // When the user typed an EPIC, the confirmed record MUST have that exact EPIC.
  // A record that only shares the name/relation but has a different EPIC is NOT confirmed.
  const _epicMatch = (rec) => {
    if (!searchEpic) return true;
    return _normalize(rec?.voterid || '') === _normalize(searchEpic);
  };
  const _isExactConfirmed = (rec) => _nameMatch(rec) && _relMatch(rec) && _epicMatch(rec);

  // ── Sanitize matched_by — strip fields the backend claims matched but that
  // don't actually satisfy the current search inputs.  This prevents labels like
  // "Voter Name + Relation matched" when only the relation token was found.
  const _sanitizeMatchedBy = (rec, rawMatchedBy) => {
    if (!rawMatchedBy || rawMatchedBy.length === 0) return [];
    return rawMatchedBy.filter(field => {
      if (field === 'name') {
        if (!searchName) return false;           // user didn't search by name
        const n = _normalize(rec?.name || '');
        const q = _normalize(searchName);
        // At least one search token must appear in the record name
        return q.split(/\s+/).filter(Boolean).some(tok => n.includes(tok));
      }
      if (field === 'relation') {
        if (!searchRelation) return false;
        const r = _normalize(rec?.relation || '');
        const q = _normalize(searchRelation);
        const tokens = q.split(/\s+/).filter(t => t.length >= 2);
        if (!tokens.length) return false;
        if (tokens.length === 1) return r.includes(tokens[0]);
        // Same coverage rule as _relMatch: >50% of tokens must be present.
        const matched = tokens.filter(tok => r.includes(tok)).length;
        return matched / tokens.length > 0.5;
      }
      if (field === 'voterid') {
        if (!searchEpic) return false;
        return _normalize(rec?.voterid || '') === _normalize(searchEpic);
      }
      // house / partial / other fields — trust the backend
      return true;
    });
  };

  // Build merged rows for each roll
  const rows25 = [];
  if (in2025 && record2025?.name) {
    const exact = _isExactConfirmed(record2025);
    rows25.push({ ...record2025, _matched: exact, _notExact: !exact, matched_by: exact ? ['confirmed'] : (record2025.matched_by || []) });
  }
  (similar2025 || []).forEach(r => {
    if (!rows25.find(x => x.voterid && x.voterid === r.voterid)) {
      rows25.push({ ...r, matched_by: _sanitizeMatchedBy(r, r.matched_by) });
    }
  });

  const rows02 = [];
  if (in2002 && record2002?.name) {
    const exact = _isExactConfirmed(record2002);
    rows02.push({ ...record2002, _matched: exact, _notExact: !exact, matched_by: exact ? ['confirmed'] : (record2002.matched_by || []) });
  }
  (similar2002 || []).forEach(r => {
    if (!rows02.find(x => x.voterid && x.voterid === r.voterid)) {
      rows02.push({ ...r, matched_by: _sanitizeMatchedBy(r, r.matched_by) });
    }
  });

  if (!rows25.length && !rows02.length) return null;

  // ── Field metadata ───────────────────────────────────────────────────────────
  const FIELD_META = {
    voterid:   { label: 'Voter ID',           color: '#10b981' },
    name:      { label: 'Voter Name',         color: '#22d3ee' },
    house:     { label: 'House No',           color: '#a78bfa' },
    relation:  { label: 'Relation',           color: '#f59e0b' },
    confirmed: { label: '✓ Confirmed',        color: '#10b981' },
    not_exact: { label: '✗ No Exact Match',   color: '#f87171' },
    partial:   { label: 'Partial Name',       color: '#6366f1' },
  };

  // ── Group rows by match strength + "Almost matched" labelling ────────────────
  // "Almost matched" = user entered N fields and this record matched exactly N-1
  const groupRows = (rows) => {
    const bucket = {};
    rows.forEach(r => {
      const mb = r.matched_by || [];
      let key, label, priority, color, isAlmost = false;

      if (r._matched) {
        key = 'confirmed'; label = 'Confirmed Match'; priority = 0; color = '#10b981';
      } else if (r._notExact) {
        // Backend returned a "confirmed" record but it doesn't satisfy the search
        // inputs (e.g. relation given name clearly differs).  Show it below the
        // proper matched groups so the right candidates surface first.
        key = 'not_exact'; label = 'Near Match — relation differs'; priority = 4; color = '#f87171';
      } else if (mb.length >= 4) {
        key = 'all4'; label = 'All 4 fields matched'; priority = 1; color = '#10b981';
      } else if (mb.length === 3) {
        const sorted = [...mb].sort();
        key = 'f3_' + sorted.join('+');
        // "Almost matched" when 3/4 fields filled and these 3 match
        isAlmost = inputFieldCount === 4;
        label = isAlmost
          ? 'Almost matched — ' + sorted.map(f => FIELD_META[f]?.label || f).join(' + ')
          : sorted.map(f => FIELD_META[f]?.label || f).join(' + ') + ' matched';
        priority = 2; color = isAlmost ? '#f59e0b' : '#22d3ee';
      } else if (mb.length === 2) {
        const sorted = [...mb].sort();
        key = 'f2_' + sorted.join('+');
        // "Almost matched" when 3 fields filled and 2 match, OR 2 fields filled and 2 match (perfect)
        isAlmost = inputFieldCount === 3;
        label = isAlmost
          ? 'Almost matched — ' + sorted.map(f => FIELD_META[f]?.label || f).join(' + ')
          : sorted.map(f => FIELD_META[f]?.label || f).join(' + ') + ' matched';
        priority = 3; color = isAlmost ? '#f59e0b' : '#6366f1';
      } else if (mb.length === 1) {
        const fieldLabels = { name: 'Voter Name', house: 'House No', relation: 'Relation', voterid: 'Voter ID', partial: 'Partial Name' };
        key = 'f1_' + mb[0];
        isAlmost = mb[0] === 'partial' ? false : inputFieldCount === 2;
        priority = mb[0] === 'partial' ? 5 : 4;
        label = isAlmost
          ? 'Almost matched — ' + (fieldLabels[mb[0]] || mb[0])
          : (fieldLabels[mb[0]] || mb[0]) + ' matched';
        color = isAlmost ? '#f59e0b' : (FIELD_META[mb[0]]?.color || '#94a3b8');
      } else {
        key = 'other'; label = 'Other records'; priority = 5; color = '#475569';
      }

      if (!bucket[key]) bucket[key] = { key, label, priority, color, isAlmost, rows: [] };
      bucket[key].rows.push(r);
    });
    return Object.values(bucket).sort((a, b) => a.priority - b.priority);
  };

  // ── Shared sub-components ────────────────────────────────────────────────────
  const ColHeader = ({ children }) => (
    <th style={{ padding:'6px 10px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1px solid rgba(255,255,255,0.06)', whiteSpace:'nowrap' }}>
      {children}
    </th>
  );

  const MatchTag = ({ field }) => {
    const m = FIELD_META[field] || { label: field, color: '#94a3b8' };
    return (
      <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4, background:`${m.color}18`, color:m.color, border:`1px solid ${m.color}30`, whiteSpace:'nowrap', display:'inline-block' }}>
        {m.label}
      </span>
    );
  };

  // ── HighlightText — only the tokens that appear in the query get highlighted ──
  // e.g. query="vedavyas", text="VEDAVYAS KAMATH" → "VEDAVYAS" highlighted, "KAMATH" dim.
  // e.g. query="vaman kamath", text="VAMANA KAMATH" → both tokens highlighted.
  const HighlightText = ({ text, query, highlightColor, baseColor, bold }) => {
    if (!text) return <span style={{ color: baseColor }}>—</span>;
    if (!query || !query.trim()) return <span style={{ color: baseColor, fontWeight: bold ? 600 : 400 }}>{text}</span>;

    const tokens = query.trim().toUpperCase().split(/\s+/).filter(Boolean);
    // Build a regex that matches any of the query tokens (case-insensitive)
    const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let parts;
    try {
      const rx = new RegExp(`(${escaped.join('|')})`, 'gi');
      parts = text.split(rx);
    } catch {
      return <span style={{ color: baseColor, fontWeight: bold ? 600 : 400 }}>{text}</span>;
    }

    return (
      <span>
        {parts.map((part, idx) => {
          const isMatch = tokens.some(t => part.toUpperCase() === t || part.toUpperCase().includes(t));
          return isMatch ? (
            <span key={idx} style={{
              color: highlightColor,
              fontWeight: 700,
              background: `${highlightColor}18`,
              borderRadius: 3,
              padding: '0 2px',
            }}>{part}</span>
          ) : (
            <span key={idx} style={{ color: baseColor, fontWeight: bold ? 500 : 400 }}>{part}</span>
          );
        })}
      </span>
    );
  };

  // ── Per-roll section — collapsible header + scrollable body ──────────────────
  const RollSection = ({ rows, year, accentColor, borderColor, selectedRow, onSelectRow, notFoundChecked, onMarkNotFound, confirmedVoterIds = new Set() }) => {
    const groups = groupRows(rows);
    const total  = rows.length;
    const [open, setOpen] = useState(true);
    const isSelected = (r) => selectedRow && selectedRow.voterid === r.voterid && selectedRow.name === r.name;
    const isSavedSIR = (r) => r.voterid && confirmedVoterIds.has(r.voterid);

    return (
      <div style={{ flex:1, minWidth:0, background:'rgba(0,0,0,0.18)', borderRadius:10, border:`1px solid ${borderColor}`, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div onClick={() => rows.length > 0 && setOpen(o => !o)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 12px', borderBottom: open && rows.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', background:'rgba(0,0,0,0.15)', cursor: rows.length > 0 ? 'pointer' : 'default', userSelect:'none', flexShrink:0 }}>
          <span style={{ fontSize:10, fontWeight:800, color:accentColor, letterSpacing:'0.8px', textTransform:'uppercase' }}>{year} Roll</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'1px 7px', fontWeight:600 }}>
            {total} record{total !== 1 ? 's' : ''}{total >= 300 ? ' (top 300)' : ''}
          </span>
          {open && groups.map(g => (
            <span key={g.key} style={{ fontSize:9, fontWeight:700, color: g.isAlmost ? '#f59e0b' : g.color, background:`${g.isAlmost ? '#f59e0b' : g.color}14`, border:`1px solid ${g.isAlmost ? '#f59e0b' : g.color}28`, borderRadius:6, padding:'1px 6px', display:'inline-flex', alignItems:'center', gap:3 }}>
              {g.isAlmost && <span style={{ fontSize:8 }}>⚡</span>}
              <span style={{ width:5, height:5, borderRadius:'50%', background: g.isAlmost ? '#f59e0b' : g.color, flexShrink:0 }} />
              {g.rows.length}
            </span>
          ))}
          {rows.length > 0 && (
            <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.2)', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition:'transform 0.2s', display:'inline-flex' }}>
              <Icon.ChevronDown />
            </span>
          )}
        </div>

        {/* Empty state */}
        {rows.length === 0 && (
          <div style={{ padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:0.35 }}>
            <Icon.XCircle />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', textAlign:'center' }}>
              No matching records in {year} roll
            </span>
          </div>
        )}

        {/* Scrollable body — max 460px, thin scrollbar */}
        {open && (
          <div className="sir-scroll" style={{ overflowY:'auto', maxHeight: isMobile ? 320 : 460, scrollbarWidth:'thin', scrollbarColor:`${accentColor}50 transparent` }}>
            {groups.map((group, gi) => (
              <div key={group.key}>
                {/* Group label */}
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px 4px', background: group.isAlmost ? 'rgba(245,158,11,0.07)' : group.key === 'not_exact' ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.10)', borderTop: gi > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  {group.isAlmost
                    ? <span style={{ fontSize:11 }}>⚡</span>
                    : group.key === 'not_exact'
                      ? <span style={{ display:'inline-flex', color:'#f87171' }}><Icon.XCircle /></span>
                      : <span style={{ width:6, height:6, borderRadius:'50%', background:group.color, flexShrink:0 }} />
                  }
                  <span style={{ fontSize:10, fontWeight:700, color: group.isAlmost ? '#f59e0b' : group.color, letterSpacing:'0.3px' }}>
                    {group.label}
                  </span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.15)' }}>({group.rows.length})</span>
                </div>
                {/* Table */}
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:420 }}>
                    <thead>
                      <tr>
                        <th style={{ padding:'6px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)', width:34, textAlign:'center', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Pick</th>
                        {year === '2025' && <ColHeader>Status</ColHeader>}
                        <ColHeader>House No</ColHeader>
                        <ColHeader>Name</ColHeader>
                        <ColHeader>Relation</ColHeader>
                        <ColHeader>Matched</ColHeader>
                        <ColHeader>Booth</ColHeader>
                        <ColHeader>EPIC</ColHeader>
                        <th style={{ padding:'6px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)', width:36 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((r, i) => {
                        const saved = isSavedSIR(r);
                        return (
                        <tr
                          key={i}
                          onClick={() => !saved && onSelectRow(r)}
                          className={saved ? undefined : "sir-selectable-row"}
                          style={{
                            background: saved
                              ? 'rgba(16,185,129,0.06)'
                              : isSelected(r)
                              ? `${accentColor}28`
                              : r._matched ? `${accentColor}12`
                              : r._notExact ? 'rgba(239,68,68,0.07)'
                              : group.isAlmost ? 'rgba(245,158,11,0.04)'
                              : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                            borderBottom: saved
                              ? '1px solid rgba(16,185,129,0.12)'
                              : isSelected(r)
                              ? `1px solid ${accentColor}55`
                              : '1px solid rgba(255,255,255,0.03)',
                            cursor: saved ? 'not-allowed' : 'pointer',
                            outline: 'none',
                            transition: 'background 0.1s',
                            opacity: saved ? 0.65 : 1,
                          }}
                        >
                          {/* Select */}
                          <td style={{ padding:'7px 10px', textAlign:'center', verticalAlign:'middle' }}>
                            {saved
                              ? <span style={{ display:'inline-flex', color:'#10b981' }}><Icon.Check /></span>
                              : <Icon.Radio checked={isSelected(r)} color={accentColor} />
                            }
                          </td>
                          {/* Mapping Status (2025 only) — leftmost data cell */}
                          {year === '2025' && (
                            <td style={{ padding:'7px 8px', whiteSpace:'nowrap', verticalAlign:'middle' }}>
                              {r.mapping_status
                                ? r.mapping_status.toLowerCase() === 'mapped'
                                  ? <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.3)', display:'inline-flex', alignItems:'center', gap:3 }}>✓ Mapped</span>
                                  : <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'rgba(249,115,22,0.12)', color:'#fb923c', border:'1px solid rgba(249,115,22,0.3)', display:'inline-flex', alignItems:'center', gap:3 }}>✗ Not Mapped</span>
                                : <span style={{ color:'rgba(255,255,255,0.2)', fontSize:11 }}>—</span>
                              }
                            </td>
                          )}
                          {/* House */}
                          <td style={{ padding:'7px 10px', fontSize:12, color: saved ? '#10b981' : r._matched ? accentColor : r._notExact ? '#f87171' : group.isAlmost ? '#fcd34d' : '#94a3b8', fontWeight: saved || r._matched || r._notExact || group.isAlmost ? 700 : 400, fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap' }}>
                            {saved && <span style={{ display:'inline-flex', marginRight:5, color:'#10b981' }}><Icon.Check /></span>}
                            {!saved && r._matched && <span style={{ display:'inline-flex', marginRight:5, color:accentColor }}><Icon.Check /></span>}
                            {!saved && r._notExact && <span style={{ display:'inline-flex', marginRight:5, color:'#f87171' }}><Icon.XCircle /></span>}
                            {r.house || '—'}
                          </td>
                          {/* Name */}
                          <td style={{ padding:'7px 10px', fontSize:12, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            <HighlightText
                              text={r.name || '—'}
                              query={searchName}
                              highlightColor={r._matched ? accentColor : r._notExact ? '#fca5a5' : group.isAlmost ? '#fde68a' : '#22d3ee'}
                              baseColor={r._matched ? '#e2e8f0' : r._notExact ? '#fca5a5' : group.isAlmost ? '#fde68a' : '#cbd5e1'}
                              bold={r._matched || r._notExact || group.isAlmost}
                            />
                          </td>
                          {/* Relation */}
                          <td style={{ padding:'7px 10px', fontSize:11, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            <HighlightText
                              text={r.relation || '—'}
                              query={searchRelation}
                              highlightColor={r._matched ? '#f59e0b' : group.isAlmost ? '#fcd34d' : '#f59e0b'}
                              baseColor={r._matched ? 'rgba(255,255,255,0.6)' : group.isAlmost ? 'rgba(253,230,138,0.7)' : 'rgba(255,255,255,0.4)'}
                              bold={r._matched}
                            />
                          </td>
                          {/* Matched-by tags */}
                          <td style={{ padding:'7px 10px', whiteSpace:'nowrap' }}>
                            {saved ? (
                              <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:6, background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.3)', display:'inline-flex', alignItems:'center', gap:4 }}>
                                <Icon.Shield /> SIR Completed
                              </span>
                            ) : (
                              <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                {(r.matched_by || []).map(f => <MatchTag key={f} field={f} />)}
                              </div>
                            )}
                          </td>
                          {/* Booth */}
                          <td style={{ padding:'7px 10px', fontSize:11, whiteSpace:'nowrap' }}>
                            {r.booth ? (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:accentColor, fontWeight:700, background:`${accentColor}12`, border:`1px solid ${accentColor}28`, borderRadius:6, padding:'2px 7px' }}>
                                <Icon.Booth />{r.booth}
                              </span>
                            ) : <span style={{ color:'rgba(255,255,255,0.2)' }}>—</span>}
                          </td>
                          {/* EPIC */}
                          <td style={{ padding:'7px 10px', fontSize:11, fontFamily:'ui-monospace,monospace', whiteSpace:'nowrap' }}>
                            <HighlightText
                              text={r.voterid || '—'}
                              query={searchEpic}
                              highlightColor='#10b981'
                              baseColor='rgba(255,255,255,0.3)'
                              bold={false}
                            />
                          </td>
                          <td style={{ padding:'7px 8px', textAlign:'center' }}>
                            {r.score != null ? (
                              <span style={{ fontSize:10, fontWeight:700, borderRadius:6, padding:'1px 5px', background:'rgba(0,0,0,0.2)', color: r.score>=80?'#10b981':r.score>=60?'#f59e0b':'#94a3b8' }}>{r.score}</span>
                            ) : null}
                          </td>
                          {/* Info */}
                          <td style={{ padding:'7px 8px', textAlign:'center' }}>
                            <button onClick={() => setInfoRecord({ record: r, roll: year })} title="View full voter details"
                              style={{ background:`${accentColor}12`, border:`1px solid ${accentColor}28`, borderRadius:6, color:accentColor, width: isMobile ? 36 : 26, height: isMobile ? 36 : 26, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s', touchAction:'manipulation' }}
                              onMouseEnter={e => e.currentTarget.style.background = `${accentColor}25`}
                              onMouseLeave={e => e.currentTarget.style.background = `${accentColor}12`}
                            >
                              <Icon.Info />
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Not-found toggle */}
        <div
          onClick={onMarkNotFound}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', background: notFoundChecked ? 'rgba(239,68,68,0.08)' : 'transparent', cursor:'pointer', transition:'background 0.15s', userSelect:'none' }}
        >
          <Icon.Radio checked={notFoundChecked} color="#f87171" />
          <span style={{ fontSize:11, fontWeight:600, color: notFoundChecked ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
            Not found in {year} roll
          </span>
          {notFoundChecked && (
            <span style={{ fontSize:10, color:'#f87171', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, padding:'1px 7px', marginLeft:'auto' }}>
              Marked absent
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ marginTop:14, animation:'fadeIn 0.25s ease' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap' }}>
          <span style={{ color:'rgba(255,255,255,0.2)' }}><Icon.Family /></span>
          <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.6px' }}>
            Similar Records Found
          </span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.15)' }}>grouped by matching fields</span>
          {/* Legend */}
          <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:9, color:'#f59e0b', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:4, padding:'1px 6px', fontWeight:700 }}>⚡ Almost matched</span>
            {[['voterid','Voter ID'],['name','Voter Name'],['house','House No'],['relation','Relation'],['partial','Partial']].map(([f, lbl]) => (
              <span key={f} style={{ fontSize:9, color:FIELD_META[f].color, background:`${FIELD_META[f].color}14`, border:`1px solid ${FIELD_META[f].color}28`, borderRadius:4, padding:'1px 6px', fontWeight:700 }}>{lbl}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
          <RollSection
            rows={rows25} year="2025" accentColor="#22d3ee" borderColor="rgba(34,211,238,0.15)"
            selectedRow={selected25} onSelectRow={handleSelect25}
            notFoundChecked={notFound25} onMarkNotFound={handleNotFound25}
            confirmedVoterIds={allSavedIds}
          />
          <RollSection
            rows={rows02} year="2002" accentColor="#f59e0b" borderColor="rgba(245,158,11,0.15)"
            selectedRow={selected02} onSelectRow={handleSelect02}
            notFoundChecked={notFound02} onMarkNotFound={handleNotFound02}
            confirmedVoterIds={allSavedIds}
          />
        </div>

        {/* ── Confirm & Save bar ────────────────────────────────────────── */}
        <ConfirmAndSaveBar
          decided25={decided25} decided02={decided02}
          selected25={selected25} selected02={selected02}
          notFound25={notFound25} notFound02={notFound02}
          canConfirm={canConfirm}
          confirmStatus={confirmStatus}
          savedDocId={savedDocId}
          handleConfirm={handleConfirm}
          voterName={(selected25 || selected02)?.name || ''}
          voterId={(selected25 || selected02)?.voterid || ''}
        />
      </div>
      {infoRecord && <VoterInfoModal record={infoRecord.record} roll={infoRecord.roll} onClose={() => setInfoRecord(null)} />}
    </>
  );
}

// ─── LIVE CHECK PANEL ─────────────────────────────────────────────────────────
function LiveCheckPanel() {
  const [form, setForm]     = useState({ name:'', epic:'', relation:'', house:'' });
  const [state, setState]   = useState('idle');
  const [result, setResult] = useState(null);
  const debounceRef         = useRef(null);
  const abortRef            = useRef(null);
  const retryRef            = useRef(null);
  const [confirmedRec, setConfirmedRec] = useState(null);
  const [confirmedVoterIds, setConfirmedVoterIds] = useState(new Set());

  // Fetch all confirmed voter IDs once on mount so we can mark saved rows
  useEffect(() => {
    (async () => {
      try {
        const token = sessionStorage.getItem('cc_token');
        if (!token) return;
        const res  = await fetch(`${API}/sir/confirmed/?category=ALL&page=1&limit=200`, { credentials:'include', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` } });
        const json = await res.json();
        if (json.success && json.records) {
          const ids = new Set();
          json.records.forEach(doc => {
            if (doc.record_2025?.voterid) ids.add(doc.record_2025.voterid);
            if (doc.record_2002?.voterid) ids.add(doc.record_2002.voterid);
          });
          setConfirmedVoterIds(ids);
        }
      } catch { /**/ }
    })();
  }, []);

  const hasInput = form.name.trim() || form.epic.trim() || form.house.trim() || form.relation.trim();

  // Auto-retry once on error after a short delay
  React.useEffect(() => {
    if (state === 'error' && hasInput) {
      retryRef.current = setTimeout(() => {
        doCheck(form);
      }, 2000);
    }
    return () => clearTimeout(retryRef.current);
  }, [state]);

  const doCheck = useCallback(async (f) => {
    const name     = f.name.trim();
    const epic     = f.epic.trim().toUpperCase();
    const relation = f.relation.trim();
    const house    = f.house.trim().toUpperCase();
    if (!name && !epic && !house && !relation) { setState('idle'); setResult(null); return; }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setState('checking');

    const timeoutId = setTimeout(() => abortRef.current?.abort(), 55000);

    try {
      const res  = await fetch(`${API}/sir/check/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, voterid: epic, relationName: relation, houseNumber: house, wardNumber:'', boothNo:'', serialNumber:'', store:false }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (data.success) { setResult(data); setState('result'); }
      else setState('error');
    } catch (err) {
      if (err.name === 'AbortError') {
        if (name || epic || house) setState('error');
      } else {
        setState('error');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const handleChange = (key) => (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, [key]: val }));
    setState('typing');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doCheck({ ...form, [key]: val }), 500);
  };

  const handleClear = () => {
    setForm({ name:'', epic:'', relation:'', house:'' });
    setState('idle'); setResult(null); setConfirmedRec(null);
    clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  };

  React.useEffect(() => { setConfirmedRec(null); }, [result]);

  const primary         = result?.results?.[0];
  const suspicious      = result?.suspicious || [];
  const changes         = result?.changes || primary?.changes || [];
  const suggestions2002 = result?.suggestions_2002 || [];
  const rec02           = confirmedRec || result?.record_2002 || {};
  const rec25           = result?.record_2025 || {};
  const found_2002      = result?.in_2002 || !!confirmedRec;
  const showSuggestions = !result?.in_2002 && suggestions2002.length > 0 && !confirmedRec && !result?.epic_only;

  const effectivePrimary = confirmedRec
    ? (['NEW_ADDITION','NOT_FOUND'].includes(primary?.category)
        ? { ...primary, category:'RETAINED', label:'Long-term Voter',
            detail:'2002 record confirmed manually — voter verified in both rolls.' }
        : primary)
    : primary;

  const catKey  = CAT_STATUS_MAP[effectivePrimary?.category] || 'ALL';
  const catMeta = CAT_META[catKey] || CAT_META.ALL;

  const statusLine = () => {
    if (state === 'idle')     return null;
    if (state === 'typing')   return <StatusPill color="#6b7280" dot="pulse">Waiting…</StatusPill>;
    if (state === 'checking') return <StatusPill color="#6366f1" dot="spin">Checking rolls… (may take up to 30s on first load)</StatusPill>;
    if (state === 'error')    return <StatusPill color="#6366f1" dot="spin">Retrying…</StatusPill>;
    if (state === 'result' && effectivePrimary) return <StatusPill color={catMeta.color} dot="solid">{effectivePrimary.label}</StatusPill>;
    return null;
  };

  return (
    <div className="sir-live-panel" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding: isMobile ? 16 : 24, marginBottom:8 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <span style={{ color:'#6366f1' }}><Icon.Search /></span>
            <span style={{ fontSize:16, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.2px' }}>Instant SIR Check</span>
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', paddingLeft:22 }}>
            Cross-reference a voter across 2002 &amp; 2025 rolls in real-time
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {statusLine()}
          {hasInput && (
            <button onClick={handleClear} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 11px', fontSize:12, color:'rgba(255,255,255,0.45)', cursor:'pointer', fontWeight:500 }}>
              <Icon.X /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Input grid */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap:14 }}>
        <InputBox label="Voter Name"      placeholder="Enter full name…"         value={form.name}     onChange={handleChange('name')}     IconComp={Icon.User}   autoFocus />
        <InputBox label="EPIC / Voter ID" placeholder="e.g. NUX4001234"         value={form.epic}     onChange={handleChange('epic')}     IconComp={Icon.ID}     mono />
        <InputBox label="House / Flat No" placeholder="e.g. 7-1-42 or 2-14-1223" value={form.house}  onChange={handleChange('house')}    IconComp={Icon.House}  mono note="Narrows search — partial match supported" />
        <InputBox label="Relative Name"   placeholder="Father / Husband name"   value={form.relation} onChange={handleChange('relation')} IconComp={Icon.Family} note="Search standalone or as fallback" />
      </div>

      {/* EPIC-only: not found in either roll — show clear "Not Found" block */}
      {state === 'result' && result?.epic_only && !result?.in_2025 && !result?.in_2002 && (
        <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:10, animation:'fadeIn 0.3s ease' }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
            {[{ year:'2025', color:'#22d3ee' }, { year:'2002', color:'#f59e0b' }].map(({ year, color }) => (
              <div key={year} style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:12, padding:'18px 20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase' }}>{year} Voter Roll</span>
                <div style={{ display:'flex', alignItems:'center', gap:7, color:'#f87171', fontWeight:700, fontSize:13 }}>
                  <Icon.XCircle /> Not found in {year} roll
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center', lineHeight:1.5 }}>
                  EPIC <span style={{ fontFamily:'ui-monospace,monospace', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{form.epic.trim().toUpperCase()}</span> does not exist in this roll
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.2)', paddingTop:4 }}>
            Verify the EPIC number and try again, or search by Voter Name instead.
          </div>
        </div>
      )}

      {/* Similar records panel — hidden for EPIC-only searches */}
      {state === 'result' && !result?.epic_only && (
        <SimilarRecordsPanel
          similar2025={result?.similar_2025 || []}
          similar2002={result?.suggestions_2002 || []}
          record2025={result?.record_2025}
          record2002={result?.record_2002}
          in2025={result?.in_2025}
          in2002={result?.in_2002}
          inputFieldCount={[form.name, form.epic, form.house, form.relation].filter(v => v.trim()).length}
          searchName={form.name.trim()}
          searchRelation={form.relation.trim()}
          searchEpic={form.epic.trim().toUpperCase()}
          searchInputs={{ name: form.name.trim(), epic: form.epic.trim().toUpperCase(), house: form.house.trim(), relation: form.relation.trim() }}
          confirmedVoterIds={confirmedVoterIds}
        />
      )}

      {/* Checking skeleton */}
      {state === 'checking' && (
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} style={{ height:13, borderRadius:7, width:`${w}%`, background:'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />
          ))}
        </div>
      )}

      {/* Result panel */}
      {state === 'result' && effectivePrimary && (
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:12, animation:'fadeIn 0.3s ease' }}>

          {/* 2002 vs 2025 record comparison */}
          {(found_2002 || result.in_2025) && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10 }}>
              {[
                { year:'2002', found: found_2002, rec: rec02 },
                { year:'2025', found: result.in_2025, rec: rec25 },
              ].map(({ year, found, rec }) => (
                <div key={year} style={{ background:'rgba(0,0,0,0.2)', borderRadius:12, border:`1px solid ${found ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.18)'}`, padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'1px', textTransform:'uppercase' }}>{year} Voter Roll</span>
                    {year === '2002' && confirmedRec && (
                      <span style={{ fontSize:9, background:'rgba(16,185,129,0.18)', color:'#10b981', padding:'1px 7px', borderRadius:8, fontWeight:700 }}>Confirmed</span>
                    )}
                  </div>
                  {found ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      {[
                        ['Name',     rec.name],
                        ['Relation', rec.relation],
                        ['House',    rec.house],
                        ['Gender',   rec.gender],
                        ['Age',      rec.age],
                        ['EPIC',     rec.voterid],
                        ...(year === '2025' ? [['Ward', rec.ward], ['Booth', rec.booth]] : []),
                      ].map(([lbl,val]) => val ? (
                        <div key={lbl} style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', minWidth:52, fontWeight:600 }}>{lbl}</span>
                          <span style={{ fontSize:12, color:'#e2e8f0', fontFamily: lbl === 'EPIC' ? 'ui-monospace,monospace' : 'inherit' }}>{val}</span>
                        </div>
                      ) : null)}
                      {year === '2025' && (
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:2 }}>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', minWidth:52, fontWeight:600 }}>Status</span>
                          {rec.mapping_status
                            ? rec.mapping_status.toLowerCase() === 'mapped'
                              ? <span style={{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.35)' }}>✓ Mapped</span>
                              : <span style={{ fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, background:'rgba(249,115,22,0.12)', color:'#fb923c', border:'1px solid rgba(249,115,22,0.3)' }}>✗ Not Mapped</span>
                            : <span style={{ fontSize:11, color:'rgba(255,255,255,0.2)' }}>—</span>
                          }
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:6, color:'#f87171', fontSize:13, fontWeight:600 }}>
                      <Icon.XCircle /> Not found in {year} roll
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}


          {/* Confirmed 2002 banner */}
          {confirmedRec && !result?.in_2002 && (
            <div style={{ background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ color:'#10b981', flexShrink:0 }}><Icon.Check /></span>
              <div style={{ flex:1, fontSize:12, color:'#10b981', fontWeight:600 }}>
                2002 record confirmed: <span style={{ fontFamily:'ui-monospace,monospace', marginLeft:4 }}>{confirmedRec.name}</span>
                {confirmedRec.booth && <span style={{ marginLeft:8, opacity:0.7 }}>· Booth {confirmedRec.booth}</span>}
              </div>
              <button onClick={() => setConfirmedRec(null)} style={{ background:'none', border:'1px solid rgba(16,185,129,0.25)', borderRadius:6, color:'#10b981', fontSize:11, padding:'3px 9px', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                <Icon.Undo /> Undo
              </button>
            </div>
          )}

          {/* Field changes table */}
          {primary.category === 'MODIFICATION' && changes.length > 0 && (
            <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:12, border:'1px solid rgba(245,158,11,0.15)', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px 7px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color:'rgba(245,158,11,0.6)' }}><Icon.Diff /></span>
                <span style={{ fontSize:11, fontWeight:700, color:'rgba(245,158,11,0.6)', textTransform:'uppercase', letterSpacing:'0.6px' }}>Field Changes Detected</span>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    {['Field','2002 Value','2025 Value'].map(h => (
                      <th key={h} style={{ padding:'7px 12px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.6px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {changes.map((ch, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', background: i%2===0?'rgba(245,158,11,0.025)':'transparent' }}>
                      <td style={{ padding:'7px 12px', fontSize:12, color:'rgba(255,255,255,0.45)' }}>{ch.field}</td>
                      <td style={{ padding:'7px 12px', fontSize:12, color:'#e2e8f0', fontFamily:'ui-monospace,monospace' }}>{ch.from}</td>
                      <td style={{ padding:'7px 12px', fontSize:12, color:'#f59e0b', fontFamily:'ui-monospace,monospace' }}>
                        <span style={{ marginRight:5, opacity:0.5 }}><Icon.ArrowRight /></span>{ch.to}
                        {ch.note && <div style={{ fontSize:10, color:'rgba(245,158,11,0.5)', marginTop:2 }}>{ch.note}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Suspicious flags */}
          {suspicious.length > 0 && (
            <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:12, padding:'12px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <span style={{ color:'#f87171' }}><Icon.Flag /></span>
                <span style={{ fontSize:12, fontWeight:700, color:'#f87171' }}>Anomaly Flags ({suspicious.length})</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {suspicious.map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, color:'#f87171' }}>
                      <Icon.Warning />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#fca5a5' }}>{s.label}</div>
                      <div style={{ fontSize:11, color:'rgba(252,165,165,0.6)', marginTop:2 }}>{s.detail}</div>
                    </div>
                    {s.value !== undefined && (
                      <div style={{ fontSize:11, fontFamily:'ui-monospace,monospace', color:'#f87171', background:'rgba(239,68,68,0.1)', padding:'3px 8px', borderRadius:6, flexShrink:0 }}>
                        {s.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      )}

      {/* Idle hint */}
      {state === 'idle' && (
        <div style={{ marginTop:24, textAlign:'center', padding:'18px 0 6px' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:8, opacity:0.2, color:'var(--text-1)' }}>
            <Icon.Search />
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>
            Start typing a name or EPIC number — results appear automatically
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RecordCard ───────────────────────────────────────────────────────────────
function RecordCard({ rec }) {
  const [open, setOpen] = useState(false);
  const key = CAT_STATUS_MAP[rec.category] || rec.category;
  const m   = CAT_META[key] || CAT_META.ALL;

  return (
    <div style={{ background:'rgba(17,28,52,0.65)', border:`1px solid ${m.border}`, borderRadius:12, marginBottom:8, overflow:'hidden', transition:'border-color 0.2s' }}>
      <div onClick={() => setOpen(p => !p)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>
        <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, background:m.bg, border:`1px solid ${m.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:m.color }}>
          <m.Icon />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:13, color:'var(--text-1)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {rec.name || rec.voterid || '—'}
            <SIRBadge category={rec.category} />
            {rec.flags?.length > 0 && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, background:'rgba(239,68,68,0.12)', color:'#f87171', borderRadius:4, padding:'1px 7px' }}>
                <Icon.Flag /> {rec.flags.length} flag{rec.flags.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:3, display:'flex', gap:12, flexWrap:'wrap' }}>
            {rec.voterid     && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon.ID />{rec.voterid}</span>}
            {rec.house_no    && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon.House />House {rec.house_no}</span>}
            {rec.ward_number && <span>Ward {rec.ward_number}</span>}
            {rec.booth_no    && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Icon.Booth />Booth {rec.booth_no}</span>}
          </div>
        </div>
        <span style={{ color:'var(--text-3)', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink:0 }}>
          <Icon.ChevronDown />
        </span>
      </div>

      {open && (
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:10 }}>{rec.details}</div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { year:'2002', found:rec.found_2002, name:rec.name_2002, age:rec.age_2002, house:rec.house_2002 },
              { year:'2025', found:rec.found_2025, name:rec.name_2025, age:rec.age_2025, house:rec.house_2025 },
            ].map(r => (
              <div key={r.year} style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>{r.year} Roll</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, color: r.found ? '#10b981' : '#f87171', fontWeight:700, fontSize:12, marginBottom: r.found ? 6 : 0 }}>
                  {r.found ? <Icon.Check /> : <Icon.XCircle />}
                  {r.found ? 'Found' : 'Not found'}
                </div>
                {r.name  && <div style={{ fontSize:11, color:'var(--text-2)', marginTop:3 }}>Name: {r.name}</div>}
                {r.age   && <div style={{ fontSize:11, color:'var(--text-3)' }}>Age: {r.age}</div>}
                {r.house && <div style={{ fontSize:11, color:'var(--text-3)' }}>House: {r.house}</div>}
              </div>
            ))}
          </div>
          {rec.flags?.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'#f87171', marginBottom:5 }}>
                <Icon.Flag /> Anomaly Flags
              </div>
              {rec.flags.map((f, i) => (
                <div key={i} style={{ fontSize:11, color:'#fca5a5', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, padding:'4px 9px', marginBottom:3, display:'flex', alignItems:'center', gap:6 }}>
                  <Icon.Warning /> {f}
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--text-3)', marginTop:6 }}>
            <Icon.Clock /> {rec.Time_stamp?.slice(0,19).replace('T',' ') || '—'}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONFIRMED MATCHES PANEL ─────────────────────────────────────────────────

// Ward → booth mapping (booth numbers are on records; ward/name are not)
const WARD_FULL_DATA = {
  21: { name:'PADAVU',              booths:[31,32,33,55,56,57,58] },
  24: { name:'DEREBAIL SOUTH',      booths:[9,11,13,17] },
  25: { name:'DEREBAIL WEST',       booths:[1,2,3,5,6,7,8] },
  26: { name:'DEREBAIL SOUTH WEST', booths:[4,10,89,90,91,92,94] },
  27: { name:'BOLOOR',              booths:[82,83,84,88,93,95,96,97] },
  28: { name:'MANNAGUDDA',          booths:[12,75,78,79,80,81,85,86,87] },
  29: { name:'KAMBLA',              booths:[68,69,71,72,73] },
  30: { name:'KODIALBAIL',          booths:[14,22,24,25,26,66,67,70] },
  31: { name:'BEJAI',               booths:[15,16,18,19,20,21,23] },
  32: { name:'KADRI NORTH',         booths:[27,28,29,30,63] },
  33: { name:'KADRI SOUTH',         booths:[59,61,62,64,65] },
  34: { name:'SHIVBHAG',            booths:[45,60,134,135,136,139] },
  35: { name:'PADAVU CENTRAL',      booths:[34,35,39,40,43,44] },
  36: { name:'PADAVU POORVA',       booths:[36,37,38,41,42] },
  37: { name:'MAROLI',              booths:[48,49,50,51,52,53,54] },
  38: { name:'BENDUR',              booths:[133,138,140,166,167,171] },
  39: { name:'FALNIR',              booths:[162,163,164,165,172,173,174,175] },
  40: { name:'COURT',               booths:[129,130,131,132,146,147] },
  41: { name:'CENTRAL',             booths:[124,125,126,127,128] },
  42: { name:'DONGERKERY',          booths:[74,76,77,112,115,117,118] },
  43: { name:'KUDROLI',             booths:[108,109,110,111,113,114] },
  44: { name:'NAVAYATH',            booths:[116,119,120,121,122,123] },
  45: { name:'PORT',                booths:[148,151,152,153,238,239] },
  46: { name:'CANTONMENT',          booths:[141,145,149,150] },
  47: { name:'MILAGRIS',            booths:[142,143,144,168,169,170] },
  48: { name:'VALENCIA',            booths:[137,176,177,178,187] },
  49: { name:'KANKANADY',           booths:[179,180,181,182,183,184,185,186] },
  50: { name:'ALAPE DAKSHINA',      booths:[188,189,190,191,192,213,214,215] },
  51: { name:'ALAPE UTTARA',        booths:[46,47,193,194,195,196,202] },
  52: { name:'KANNUR',              booths:[197,198,199,200,201,203,204,205] },
  53: { name:'BAJAL',               booths:[206,207,208,209,210,211,212] },
  54: { name:'JEPPINAMUGER',        booths:[216,217,218,219,220,221,222,223,249] },
  55: { name:'ATTAVARA',            booths:[154,155,156,157,226,227,247,248] },
  56: { name:'MANGALADEVI',         booths:[228,229,231,232,233] },
  57: { name:'HOIGE BAZAR',         booths:[235,237,240,244] },
  58: { name:'BOLAR',               booths:[230,234,236,241,242,243] },
  59: { name:'JEPPU',               booths:[158,159,160,161,224,225,245,246] },
  60: { name:'BENGRE',              booths:[98,99,100,101,102,103,104,105,106,107] },
};

// Build a reverse map: booth number → ward number
const BOOTH_TO_WARD = {};
Object.entries(WARD_FULL_DATA).forEach(([ward, { booths }]) => {
  booths.forEach(b => { BOOTH_TO_WARD[b] = Number(ward); });
});

// Given a confirmed doc, extract the best booth number (from either record)
function getDocBooth(doc) {
  const b = doc.record_2025?.booth ?? doc.record_2002?.booth ?? doc.booth ?? null;
  if (b == null) return null;
  return Number(b);
}

const CONFIRMED_CATS = [
  { key:'ALL',            label:'All',              color:'#94a3b8', bg:'rgba(148,163,184,0.08)', border:'rgba(148,163,184,0.2)',  icon: Icon.List    },
  { key:'MATCHED',        label:'Found in Both',    color:'#10b981', bg:'rgba(16,185,129,0.08)',  border:'rgba(16,185,129,0.25)',  icon: Icon.Check   },
  { key:'NOT_FOUND_2025', label:'Absent in 2025',   color:'#22d3ee', bg:'rgba(34,211,238,0.08)',  border:'rgba(34,211,238,0.25)',  icon: Icon.XCircle },
  { key:'NOT_FOUND_2002', label:'Absent in 2002',   color:'#f59e0b', bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.25)',  icon: Icon.XCircle },
  { key:'NOT_FOUND_BOTH', label:'Absent in Both',   color:'#f87171', bg:'rgba(239,68,68,0.08)',   border:'rgba(239,68,68,0.25)',   icon: Icon.Ghost   },
];

function ConfirmedRecordRow({ doc }) {
  const [open, setOpen] = useState(false);
  const cat   = CONFIRMED_CATS.find(c => c.key === doc.status) || CONFIRMED_CATS[0];
  const CatIcon = cat.icon;
  const ts    = doc.confirmed_at ? new Date(doc.confirmed_at).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${open ? cat.border : 'rgba(255,255,255,0.06)'}`, borderRadius:10, marginBottom:6, overflow:'hidden', transition:'border-color 0.2s' }}>
      <div onClick={() => setOpen(p => !p)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', touchAction:'manipulation', WebkitTapHighlightColor:'transparent' }}>
        {/* Category badge */}
        <div style={{ width:30, height:30, borderRadius:7, flexShrink:0, background:cat.bg, border:`1px solid ${cat.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:cat.color }}>
          <CatIcon />
        </div>
        {/* Name + meta */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:13, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {doc.name || '—'}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2, display:'flex', gap:10, flexWrap:'wrap' }}>
            {doc.voterid && <span style={{ fontFamily:'ui-monospace,monospace' }}>{doc.voterid}</span>}
            {doc.house   && <span><Icon.House /> {doc.house}</span>}
          </div>
        </div>
        {/* Status pill + timestamp */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0 }}>
          <span style={{ fontSize:10, fontWeight:700, color:cat.color, background:cat.bg, border:`1px solid ${cat.border}`, borderRadius:20, padding:'2px 8px', whiteSpace:'nowrap' }}>
            {cat.label}
          </span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', gap:4 }}>
            <Icon.Clock />{ts}
          </span>
        </div>
        <span style={{ color:'rgba(255,255,255,0.2)', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink:0 }}>
          <Icon.ChevronDown />
        </span>
      </div>

      {open && (
        <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:8 }}>
            {[
              { year:'2002', rec: doc.record_2002, absent: doc.not_found_2002, color:'#f59e0b' },
              { year:'2025', rec: doc.record_2025, absent: doc.not_found_2025, color:'#22d3ee' },
            ].map(({ year, rec, absent, color }) => {
              const hasRec = rec && rec.name;
              return (
                <div key={year} style={{ background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'10px 12px', border:`1px solid ${hasRec ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.15)'}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:6 }}>{year} Roll</div>
                  {hasRec ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {[
                        ['Name',     rec.name],
                        ['Relation', rec.relation],
                        ['House',    rec.house],
                        ['EPIC',     rec.voterid],
                        ['Age',      rec.age],
                        ['Gender',   rec.gender],
                        ['Booth',    rec.booth],
                      ].filter(([,v]) => v).map(([lbl, val]) => (
                        <div key={lbl} style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                          <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', minWidth:50, fontWeight:600 }}>{lbl}</span>
                          <span style={{ fontSize:12, color:'#e2e8f0', fontFamily: lbl === 'EPIC' ? 'ui-monospace,monospace' : 'inherit', wordBreak:'break-all' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:6, color:'#f87171', fontSize:12, fontWeight:600 }}>
                      <Icon.XCircle /> {absent ? 'Marked absent' : 'No record'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmedMatchesPanel() {
  const [activeCat,  setActiveCat]  = useState('ALL');
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  // Ward-wise view state
  const [viewMode,   setViewMode]   = useState('category'); // 'category' | 'ward'
  const [activeWard, setActiveWard] = useState(null);       // ward number or null = show picker

  const waitForToken = () => new Promise((resolve) => {
    const token = sessionStorage.getItem('cc_token');
    if (token) { resolve(token); return; }
    let attempts = 0;
    const id = setInterval(() => {
      const t = sessionStorage.getItem('cc_token');
      if (t || ++attempts >= 12) { clearInterval(id); resolve(t || null); }
    }, 250);
  });

  const fetchConfirmed = useCallback(async (cat, pg) => {
    setLoading(true);
    try {
      const token   = await waitForToken();
      if (!token) { setLoading(false); return; }
      const params  = new URLSearchParams({ category: cat, page: pg, limit: 20 });
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const res  = await fetch(`${API}/sir/confirmed/?${params}`, { credentials:'include', headers });
      const json = await res.json();
      if (json.success) setData(json);
    } catch { /**/ }
    finally { setLoading(false); }
  }, []);

  // Fetch all records (high limit) for ward view
  const [allRecords, setAllRecords] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const fetchAll = useCallback(async () => {
    setAllLoading(true);
    try {
      const token = await waitForToken();
      if (!token) { setAllLoading(false); return; }
      const params  = new URLSearchParams({ category: 'ALL', page: 1, limit: 1000 });
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const res  = await fetch(`${API}/sir/confirmed/?${params}`, { credentials:'include', headers });
      const json = await res.json();
      if (json.success) setAllRecords(json.records || []);
    } catch { /**/ }
    finally { setAllLoading(false); }
  }, []);

  useEffect(() => { fetchConfirmed(activeCat, page); }, [activeCat, page, fetchConfirmed]);
  useEffect(() => { if (viewMode === 'ward') fetchAll(); }, [viewMode, fetchAll]);

  const handleCat  = (cat)  => { setActiveCat(cat); setPage(1); };
  const handleWard = (ward) => { setActiveWard(ward); };

  const counts  = data?.counts  || {};
  const records = data?.records || [];
  const total   = data?.total   || 0;

  // Build per-ward booth Sets for fast lookup
  const WARD_TO_BOOTHS = Object.fromEntries(
    Object.entries(WARD_FULL_DATA).map(([w, { booths }]) => [Number(w), new Set(booths)])
  );

  // Ward-filtered records: match booth field from either nested record
  const wardRecords = activeWard
    ? allRecords.filter(doc => {
        const booth = getDocBooth(doc);
        return booth != null && WARD_TO_BOOTHS[activeWard]?.has(booth);
      })
    : [];

  // Build ward summary counts from allRecords
  const wardCounts = {};
  allRecords.forEach(doc => {
    const booth = getDocBooth(doc);
    if (booth == null) return;
    const ward = BOOTH_TO_WARD[booth];
    if (ward == null) return;
    wardCounts[ward] = (wardCounts[ward] || 0) + 1;
  });

  if (!loading && counts.TOTAL === 0) return null;

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding: isMobile ? 14 : 20, marginTop:10, marginBottom:8 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <span style={{ color:'#10b981' }}><Icon.Check /></span>
        <span style={{ fontSize:15, fontWeight:700, color:'var(--text-1)' }}>Confirmed Records</span>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>— saved SIR decisions</span>
        {counts.TOTAL > 0 && (
          <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:'#10b981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:20, padding:'2px 10px' }}>
            {counts.TOTAL} total
          </span>
        )}
      </div>

      {/* ── View mode toggle ────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        <button
          onClick={() => { setViewMode('category'); setActiveWard(null); }}
          style={{ display:'flex', alignItems:'center', gap:5, background: viewMode === 'category' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.025)', border:`1px solid ${viewMode === 'category' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius:8, padding:'6px 13px', cursor:'pointer', color: viewMode === 'category' ? '#818cf8' : 'rgba(255,255,255,0.35)', fontWeight: viewMode === 'category' ? 700 : 400, fontSize:12, transition:'all 0.15s' }}>
          <Icon.List /> Category View
        </button>
        <button
          onClick={() => { setViewMode('ward'); setActiveWard(null); }}
          style={{ display:'flex', alignItems:'center', gap:5, background: viewMode === 'ward' ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.025)', border:`1px solid ${viewMode === 'ward' ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius:8, padding:'6px 13px', cursor:'pointer', color: viewMode === 'ward' ? '#22d3ee' : 'rgba(255,255,255,0.35)', fontWeight: viewMode === 'ward' ? 700 : 400, fontSize:12, transition:'all 0.15s' }}>
          <Icon.Booth /> Ward View
        </button>
      </div>

      {/* ══ CATEGORY VIEW ════════════════════════════════════════════════════ */}
      {viewMode === 'category' && (<>
        {/* Category tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
          {CONFIRMED_CATS.map(({ key, label, color, bg, border, icon: TabIcon }) => {
            const active = activeCat === key;
            const count  = key === 'ALL' ? counts.TOTAL : counts[key];
            return (
              <button key={key} onClick={() => handleCat(key)} style={{ display:'flex', alignItems:'center', gap:5, background: active ? bg : 'rgba(255,255,255,0.025)', border:`1px solid ${active ? border : 'rgba(255,255,255,0.07)'}`, borderRadius:8, padding:'7px 12px', cursor:'pointer', color: active ? color : 'rgba(255,255,255,0.4)', fontWeight: active ? 700 : 400, fontSize:12, transition:'all 0.15s', touchAction:'manipulation', WebkitTapHighlightColor:'transparent', minHeight:36 }}>
                <TabIcon />
                {label}
                {count != null && (
                  <span style={{ fontSize:10, background:'rgba(0,0,0,0.25)', borderRadius:10, padding:'1px 6px', marginLeft:1 }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Records */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[0.8, 0.6, 0.9].map((w, i) => (
              <div key={i} style={{ height:48, borderRadius:10, width:`${w*100}%`, background:'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign:'center', padding:'28px 16px', color:'rgba(255,255,255,0.2)', fontSize:13 }}>
            No records in this category yet.
          </div>
        ) : (
          <>
            {records.map((doc, i) => (
              <ConfirmedRecordRow key={doc._id || i} doc={doc} />
            ))}
            {total > 20 && (
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:12 }}>
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:12 }}>← Prev</button>
                <span style={{ padding:'6px 14px', color:'var(--text-2)', fontSize:12 }}>Page {page}</span>
                <button onClick={() => setPage(p => p+1)} disabled={records.length < 20} className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:12 }}>Next →</button>
              </div>
            )}
          </>
        )}
      </>)}

      {/* ══ WARD VIEW ════════════════════════════════════════════════════════ */}
      {viewMode === 'ward' && (<>
        {!activeWard ? (
          /* Ward picker grid */
          allLoading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[0.8, 0.6, 0.9].map((w, i) => (
                <div key={i} style={{ height:40, borderRadius:10, width:`${w*100}%`, background:'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:8 }}>
              {Object.entries(WARD_FULL_DATA).sort((a,b) => Number(a[0]) - Number(b[0])).map(([wardNum, { name, booths }]) => {
                const wn    = Number(wardNum);
                const count = wardCounts[wn] || 0;
                return (
                  <button
                    key={wn}
                    onClick={() => handleWard(wn)}
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3,
                      background: count > 0 ? 'rgba(34,211,238,0.05)' : 'rgba(255,255,255,0.02)',
                      border:`1px solid ${count > 0 ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius:10, padding:'10px 12px', cursor:'pointer',
                      transition:'all 0.15s', textAlign:'left',
                      opacity: count === 0 ? 0.45 : 1,
                    }}
                    onMouseEnter={e => { if (count > 0) e.currentTarget.style.background = 'rgba(34,211,238,0.10)'; }}
                    onMouseLeave={e => { if (count > 0) e.currentTarget.style.background = 'rgba(34,211,238,0.05)'; }}
                  >
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
                      <span style={{ fontSize:10, fontWeight:800, color: count > 0 ? '#22d3ee' : 'rgba(255,255,255,0.25)', letterSpacing:'0.4px' }}>Ward {wn}</span>
                      {count > 0 && (
                        <span style={{ fontSize:10, fontWeight:700, background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.3)', borderRadius:10, padding:'1px 7px' }}>{count}</span>
                      )}
                    </div>
                    <span style={{ fontSize:11, fontWeight:600, color: count > 0 ? 'var(--text-1)' : 'rgba(255,255,255,0.25)', lineHeight:1.3 }}>{name}</span>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.2)' }}>{booths.length} booth{booths.length !== 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          /* Ward detail view */
          <>
            {/* Back + Ward header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <button
                onClick={() => setActiveWard(null)}
                style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 12px', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600 }}>
                ← Back
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:800, color:'#22d3ee' }}>Ward {activeWard}</span>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>— {WARD_FULL_DATA[activeWard]?.name}</span>
              </div>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'2px 10px' }}>
                Booths: {WARD_FULL_DATA[activeWard]?.booths.join(', ')}
              </span>
              {wardRecords.length > 0 && (
                <span style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:'#10b981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:20, padding:'2px 10px' }}>
                  {wardRecords.length} record{wardRecords.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {allLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[0.8, 0.6, 0.9].map((w, i) => (
                  <div key={i} style={{ height:48, borderRadius:10, width:`${w*100}%`, background:'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />
                ))}
              </div>
            ) : wardRecords.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 16px', color:'rgba(255,255,255,0.2)', fontSize:13 }}>
                No confirmed records found for this ward yet.<br />
                <span style={{ fontSize:11, marginTop:4, display:'block' }}>Records are matched by booth number ({WARD_FULL_DATA[activeWard]?.booths.join(', ')}).</span>
              </div>
            ) : (
              /* Group by booth within ward */
              (() => {
                const byBooth = {};
                wardRecords.forEach(doc => {
                  const b = getDocBooth(doc);
                  const key = b ?? 'unknown';
                  if (!byBooth[key]) byBooth[key] = [];
                  byBooth[key].push(doc);
                });
                return Object.entries(byBooth).sort((a,b) => Number(a[0]) - Number(b[0])).map(([booth, docs]) => (
                  <div key={booth} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700, color:'#22d3ee' }}>
                        <Icon.Booth /> Booth {booth}
                      </span>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'1px 7px' }}>{docs.length} record{docs.length !== 1 ? 's' : ''}</span>
                    </div>
                    {docs.map((doc, i) => (
                      <ConfirmedRecordRow key={doc._id || i} doc={doc} />
                    ))}
                  </div>
                ));
              })()
            )}
          </>
        )}
      </>)}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
function SIRFilterBar({ ward, booth, onWardChange, onBoothChange }) {
  return (
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'8px 12px', flex:'1 1 140px', maxWidth: isMobile ? '100%' : 200 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)', flexShrink:0 }}>Ward</span>
        <input value={ward} onChange={e => onWardChange(e.target.value)} placeholder="e.g. 21" style={{ flex:1, background:'none', border:'none', outline:'none', fontSize: isMobile ? 16 : 13, color:'var(--text-1)', minWidth:0, WebkitAppearance:'none' }} autoCorrect="off" autoCapitalize="off" />
        {ward && <button onClick={() => onWardChange('')} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:16,padding:'4px',flexShrink:0,touchAction:'manipulation' }}>✕</button>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'8px 12px', flex:'1 1 140px', maxWidth: isMobile ? '100%' : 200 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.3)', flexShrink:0 }}>Booth</span>
        <input value={booth} onChange={e => onBoothChange(e.target.value)} placeholder="e.g. 31" style={{ flex:1, background:'none', border:'none', outline:'none', fontSize: isMobile ? 16 : 13, color:'var(--text-1)', minWidth:0, WebkitAppearance:'none' }} autoCorrect="off" autoCapitalize="off" />
        {booth && <button onClick={() => onBoothChange('')} style={{ background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:16,padding:'4px',flexShrink:0,touchAction:'manipulation' }}>✕</button>}
      </div>
      {(ward || booth) && (
        <span style={{ fontSize:11, color:'#22d3ee', background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:20, padding:'4px 10px', fontWeight:600 }}>
          Filtered: {[ward && `Ward ${ward}`, booth && `Booth ${booth}`].filter(Boolean).join(' · ')}
        </span>
      )}
    </div>
  );
}

const CAT_INFO = {
  NEW:        { emoji:'➕', why:'Present in 2025 but absent from 2002 — new generation voter or migrant' },
  DELETED:    { emoji:'🗑', why:'Was in 2002 but removed from 2025 — death, migration out, or data cleanup' },
  MODIFIED:   { emoji:'✏️', why:'Present in both rolls but details changed — name spelling, address, age correction' },
  SUSPICIOUS: { emoji:'⚠️', why:'Inconsistent patterns — duplicate EPIC, out-of-state ID, house overcrowding' },
  RETAINED:   { emoji:'🛡', why:'Same voter in both 2002 and 2025 rolls — stable, long-term resident' },
  NOT_FOUND:  { emoji:'❓', why:'Not traced in either roll — unregistered, OCR error, or data gap' },
};

export default function SIR() {
  return (
    <div className="page">
      <Navbar />
      <div className="page-inner">

        {/* Page header */}
        <div className="page-header anim-fade-up">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700, color:'var(--gold)' }}>
              <Icon.SIR /> SIR Module
            </span>
          </div>
          <h1>Special Intensive Revision</h1>
          <p>Voter roll comparison · 2002 vs 2025 · Anomaly detection · Classification</p>
        </div>

        {/* Live check panel — Instant SIR Check */}
        <LiveCheckPanel />

        {/* Confirmed matches / not-found panel */}
        <ConfirmedMatchesPanel />

        {/* SIR Risk Wards — Political Intelligence */}
        <RiskWardsOverview />

        {/* All Wards Heatmap */}
        <AllWardsHeatmap />

      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        *, *::before, *::after { box-sizing: border-box; }
        input, button, select, textarea { -webkit-tap-highlight-color: transparent; }
        .sir-scroll { -webkit-overflow-scrolling: touch; overflow-scrolling: touch; }
        .sir-selectable-row:hover { filter: brightness(1.15); }
        .sir-selectable-row:active { filter: brightness(1.25); }
        @media (max-width: 480px) {
          .sir-live-panel { padding: 16px !important; }
          .sir-header-wrap { flex-direction: column !important; align-items: flex-start !important; }
          .sir-status-line { margin-top: 8px; }
          .sir-filter-bar { flex-direction: column !important; }
          .sir-filter-input { max-width: 100% !important; }
          .sir-bulk-wrap { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
    </div>
  );
}