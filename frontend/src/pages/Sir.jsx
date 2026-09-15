import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import {
  SIR_DISCREPANCY_SUMMARY, SIR_DISCREPANCY_WARDS,
  SIR_BY_BOOTH_CATEGORY, SIR_BY_TURNOUT, SIR_BY_PARTY_WON,
} from './sirDiscrepancyData';
import {
  SIR_STRATEGY_SUMMARY, SIR_RISK_RANKING, SIR_RISK_RANKING_NOTES,
  SIR_CRITICAL_WARDS, SIR_BOOTH_TARGETING, SIR_WARD_DEMOGRAPHIC_PROFILE,
  SIR_WARD_PRIORITIZATION, SIR_WARD_PRIORITIZATION_ACTION_PLAN,
  SIR_COMMUNITY_POPULATION, SIR_POPULATION_GROWTH_PCT,
  SIR_VOTE_BANK_CONGRESS, SIR_VOTE_BANK_CONGRESS_TOTAL,
  SIR_VOTE_BANK_BJP, SIR_VOTE_BANK_BJP_TOTAL,
  SIR_VOTE_POOL_MODEL, SIR_VOTE_POOL_GAP_NOTE, SIR_HEADLINE_FINDINGS,
  SIR_STRATEGY_ASSUMPTIONS, SIR_STRATEGY_CAVEATS,
} from './sirStrategyData';

const API = (process.env.REACT_APP_API_URL || 'https://production-web-conn-bzpt.onrender.com') + '/api';

// ─── SIR form photo helpers ────────────────────────────────────────────────────
// compressSIRPhoto: canvas-resize to ≤1200 px / 0.80 JPEG quality.
//   A raw phone photo (5–8 MB, base64 ~7–11 MB) becomes ~250–400 KB.
//   Without this, the JSON body to /api/sir/form-extract/ exceeds Render's
//   request-size limit → nginx returns 502 *before* Django adds CORS headers
//   → browser reports "No Access-Control-Allow-Origin" (CORS error).
function compressSIRPhoto(file, maxPx = 1200, quality = 0.80) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale  = Math.min(1, maxPx / Math.max(img.width, img.height));
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

// Convert a base64 string (no data-URL prefix) back to a File.
// Used in ConfirmAndSaveBar when only base64 is stored in state.
function base64ToFile(base64, mimeType, filename = 'sir_form.jpg') {
  const bytes = atob(base64);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr.buffer], filename, { type: mimeType });
}

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

// ─── SIR AI Overview ──────────────────────────────────────────────────────────
// Mirrors the SwotAIOverview pattern from Swot.jsx.
// Fetches live stats from /api/sir/stats/ + ward/booth data from SIR_WARD_DATA,
// sends to /api/sir/ai-overview/, renders a structured insight panel.
// ──────────────────────────────────────────────────────────────────────────────

const _sirOverviewCache = {};  // module-level — survives re-renders

// Serialise all available SIR data so the AI has real numbers
function buildSIRData(liveStats) {
  const lines = [];
  lines.push('=== SIR Ward Classification + BLO Mapping Progress ===');
  lines.push('Ward | Name | Classification | Poll Rate | Hindu% | Muslim% | Christian% | BLO Mapped% | Total Mapped% | Priority | BJP Proj | Margin');
  Object.entries(SIR_WARD_DATA).forEach(([num, d]) => {
    const name = WARD_NAMES[num] || `Ward ${num}`;
    lines.push(
      `${num} | ${name} | ${d.classification} | ${d.pollRate}% | ` +
      `${d.hindu}% | ${d.muslim}% | ${d.christian}% | ` +
      `${d.bloMapped}% | ${d.totalMapped}% | ${d.priority} | BJP ${d.bjpProj}% | ${d.margin > 0 ? '+' : ''}${d.margin}%`
    );
  });

  if (liveStats) {
    lines.push('');
    lines.push('=== Live SIR Database Counts ===');
    lines.push(`New Additions: ${(liveStats.new_additions || 0).toLocaleString()}`);
    lines.push(`Retained:      ${(liveStats.retained     || 0).toLocaleString()}`);
    lines.push(`Modified:      ${(liveStats.modifications|| 0).toLocaleString()}`);
    lines.push(`Deleted:       ${(liveStats.deletions    || 0).toLocaleString()}`);
    lines.push(`Suspicious:    ${(liveStats.suspicious   || 0).toLocaleString()}`);
    lines.push(`Not Found:     ${(liveStats.not_found    || 0).toLocaleString()}`);
    lines.push(`2002 Roll:     ${(liveStats.voters_2002  || 0).toLocaleString()}`);
    lines.push(`2025 Roll:     ${(liveStats.voters_2025  || 0).toLocaleString()}`);
    const delta = (liveStats.voters_2025 || 0) - (liveStats.voters_2002 || 0);
    lines.push(`Net Change:    ${delta > 0 ? '+' : ''}${delta.toLocaleString()}`);
  }

  // Risk wards summary
  lines.push('');
  lines.push('=== Priority Wards (non-NORMAL) ===');
  Object.entries(SIR_WARD_DATA)
    .filter(([, d]) => d.priority !== 'NORMAL')
    .sort(([, a], [, b]) => (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9))
    .forEach(([num, d]) => {
      const name = WARD_NAMES[num] || `Ward ${num}`;
      lines.push(`${d.priority} | ${name} (${num}) | ${d.classification} | Poll ${d.pollRate}% | BJP ${d.bjpProj}% | Margin ${d.margin > 0 ? '+' : ''}${d.margin}%`);
    });

  return lines.join('\n').slice(0, 5000);
}

// ── Highlight numbers inside text ────────────────────────────────────────────
function SIR_HL({ text }) {
  if (!text || typeof text !== 'string') return null;
  const parts = text.split(/([-+]?\d+\.?\d*%?)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^[-+]?\d/.test(p)
          ? <span key={i} style={{ color: '#f59e0b', fontWeight: 700 }}>{p}</span>
          : p
      )}
    </>
  );
}

function SIRAIOverview() {
  const [state,    setState]    = useState(_sirOverviewCache.data ? 'done' : 'idle');
  const [overview, setOverview] = useState(_sirOverviewCache.data || null);
  const [open,     setOpen]     = useState(false);
  const [liveStats,setLiveStats]= useState(null);

  // Fetch sir/stats on mount so we can send live counts to the AI
  useEffect(() => {
    const token = sessionStorage.getItem('cc_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    fetch(`${API}/sir/stats/`, { credentials: 'include', headers })
      .then(r => r.json())
      .then(j => { if (j.success) setLiveStats(j); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (_sirOverviewCache.data) {
      setOverview(_sirOverviewCache.data);
      setState('done');
      setOpen(true);
      return;
    }
    setState('loading');
    setOpen(true);
    try {
      const token = sessionStorage.getItem('cc_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const sirData = buildSIRData(liveStats);
      const res  = await fetch(`${API}/sir/ai-overview/`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ sirData }),
      });
      const data = await res.json();
      if (data?.success && data?.overview) {
        _sirOverviewCache.data = data.overview;
        setOverview(data.overview);
        setState('done');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [liveStats]);

  const totalSIR = liveStats
    ? (liveStats.new_additions || 0) + (liveStats.retained || 0) + (liveStats.modifications || 0) +
      (liveStats.deletions || 0) + (liveStats.suspicious || 0) + (liveStats.not_found || 0)
    : null;

  const BULLET_COLORS_SIR = {
    '📊': { bg: 'rgba(96,165,250,0.07)',  border: 'rgba(96,165,250,0.22)'  },
    '✅': { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.28)'  },
    '🏘️': { bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.22)'  },
    '🕌': { bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.22)'  },
    '⚠️': { bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.22)' },
    '🎯': { bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.22)' },
  };
  const DEFAULT_COLOR = { bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.18)' };

  return (
    <div style={{ marginBottom: 18 }}>
      <style>{`
        .sir-ai-shimmer {
          background: linear-gradient(90deg,rgba(51,65,85,0.5) 25%,rgba(245,158,11,0.2) 50%,rgba(51,65,85,0.5) 75%);
          background-size: 200% 100%;
          animation: sirShimmer 1.5s linear infinite;
        }
        @keyframes sirShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes sirSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .sir-ai-bullet:hover { transform: translateX(2px); }
      `}</style>

      {/* ── Trigger button ──────────────────────────────────────────────────── */}
      <button
        onClick={state === 'loading' ? undefined : (open && state === 'done' ? () => setOpen(o => !o) : load)}
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:10,
          padding:'11px 16px', borderRadius:12,
          background: state === 'done' && open
            ? 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(217,119,6,0.06))'
            : 'rgba(255,255,255,0.03)',
          border: `1px solid ${state === 'done' ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
          cursor: state === 'loading' ? 'default' : 'pointer',
          transition: 'all 0.2s', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        {/* Icon */}
        <div style={{
          width:32, height:32, borderRadius:9, flexShrink:0,
          background: state === 'loading'
            ? 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.2))'
            : 'linear-gradient(135deg,#d97706,#f59e0b)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: state === 'done' ? '0 0 16px rgba(245,158,11,0.45)' : 'none',
          transition:'all 0.3s',
        }}>
          {state === 'loading' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fde68a" strokeWidth="2" strokeLinecap="round"
              style={{ animation:'sirSpin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity="0.25"/>
              <path d="M21 12a9 9 0 0 0-9-9"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff8e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          )}
        </div>

        {/* Label */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:800, color: state === 'done' ? '#fde68a' : 'rgba(255,255,255,0.55)', lineHeight:1.2 }}>
            {state === 'loading' ? 'ShaastraAI is analysing SIR data…'
              : state === 'done'  ? 'AI Overview — SIR Intelligence'
              : state === 'error' ? 'Analysis unavailable — tap to retry'
              : 'Get AI Overview — SIR Intelligence'}
          </div>
          {state === 'idle' && (
            <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.25)', marginTop:2 }}>
              ShaastraAI · {totalSIR !== null ? `${totalSIR.toLocaleString()} records · ` : ''}Ward + Religion + Booth analysis
            </div>
          )}
          {state === 'done' && overview?.headline && (
            <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.32)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {overview.headline}
            </div>
          )}
        </div>

        {state === 'idle' && (
          <span style={{ fontSize:10, fontWeight:700, background:'linear-gradient(135deg,#d97706,#f59e0b)', color:'#fff', borderRadius:6, padding:'3px 9px', flexShrink:0, letterSpacing:'0.04em' }}>
            Generate
          </span>
        )}
        {state === 'done' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(253,230,138,0.6)" strokeWidth="2.5" strokeLinecap="round"
            style={{ flexShrink:0, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>
            <path d="M9 6l6 6-6 6"/>
          </svg>
        )}
      </button>

      {/* ── Loading shimmer ─────────────────────────────────────────────────── */}
      {state === 'loading' && (
        <div style={{ marginTop:10, background:'rgba(15,23,42,0.8)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, padding:'18px 20px' }}>
          <div style={{ textAlign:'center', marginBottom:14 }}>
            <div style={{ fontSize:11, color:'rgba(245,158,11,0.6)', marginBottom:10 }}>ShaastraAI is analysing ward · booth · religion data…</div>
            <div style={{ display:'flex', justifyContent:'center', gap:6 }}>
              {['Counting records', 'Mapping wards', 'Religion analysis', 'Booth breakdown', 'Generating insight'].map((s, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9.5, color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.04)', borderRadius:4, padding:'3px 7px' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(245,158,11,0.4)', animation:'sirSpin 1.5s linear infinite', animationDelay:`${i * 0.2}s` }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
          {[72, 55, 68, 42].map((w, i) => (
            <div key={i} className="sir-ai-shimmer" style={{ width:`${w}%`, height: i === 0 ? 13 : 10, borderRadius:6, marginBottom: i < 3 ? 12 : 0 }} />
          ))}
        </div>
      )}

      {/* ── Result panel ────────────────────────────────────────────────────── */}
      {state === 'done' && open && overview && (
        <div style={{
          marginTop:8,
          background:'linear-gradient(160deg,rgba(13,20,40,0.98),rgba(8,14,32,0.99))',
          border:'1px solid rgba(245,158,11,0.28)',
          borderRadius:16, overflow:'hidden',
          boxShadow:'0 12px 40px rgba(0,0,0,0.5)',
        }}>

          {/* ── Header band ─────────────────────────────────────────────────── */}
          <div style={{
            padding:'14px 18px 12px',
            borderBottom:'1px solid rgba(245,158,11,0.13)',
            background:'linear-gradient(135deg,rgba(217,119,6,0.1),rgba(245,158,11,0.04),transparent)',
            display:'flex', alignItems:'flex-start', gap:12,
          }}>
            {/* Gold icon */}
            <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:'linear-gradient(135deg,#d97706,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px rgba(245,158,11,0.4)', marginTop:2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff8e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 6px #f59e0b', flexShrink:0 }} />
                <span style={{ fontSize:9.5, fontWeight:800, color:'#f59e0b', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'Space Mono, monospace' }}>
                  ShaastraAI · SIR Intelligence
                </span>
                <button
                  onClick={() => { _sirOverviewCache.data = null; setState('idle'); setOverview(null); setOpen(false); }}
                  style={{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, cursor:'pointer', padding:'2px 8px', fontFamily:'inherit' }}
                >↺ Regenerate</button>
              </div>
              <div style={{ fontSize:17, fontWeight:800, color:'#f1f5f9', lineHeight:1.3, letterSpacing:'-0.025em' }}>
                {overview.headline}
              </div>
            </div>
          </div>

          {/* ── Summary block ───────────────────────────────────────────────── */}
          {overview.summary && (
            <div style={{ padding:'14px 18px 0 18px' }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.7, background:'rgba(255,255,255,0.025)', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.06)' }}>
                <SIR_HL text={overview.summary} />
              </div>
            </div>
          )}

          {/* ── Bullets ─────────────────────────────────────────────────────── */}
          {overview.bullets?.length > 0 && (
            <div style={{ padding:'12px 18px', display:'flex', flexDirection:'column', gap:7 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Key Findings</div>
              {overview.bullets.map((b, i) => {
                const icon   = b.icon || '•';
                const colors = BULLET_COLORS_SIR[icon] || DEFAULT_COLOR;
                return (
                  <div key={i} className="sir-ai-bullet"
                    style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 13px', borderRadius:10, background:colors.bg, border:`1px solid ${colors.border}`, transition:'transform 0.15s', cursor:'default' }}>
                    <span style={{ fontSize:17, flexShrink:0, lineHeight:1.1, marginTop:0 }}>{icon}</span>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.85)', lineHeight:1.6 }}>
                      <SIR_HL text={b.text} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Callout / Bottom Line ───────────────────────────────────────── */}
          {overview.callout && (
            <div style={{ margin:'0 18px 18px', padding:'13px 16px', borderRadius:11, background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.28)', display:'flex', gap:10, alignItems:'flex-start' }}>
              <div style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🎖️</div>
              <div>
                <div style={{ fontSize:9.5, fontWeight:800, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>
                  {overview.callout.label || 'SIR Bottom Line'}
                </div>
                <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.8)', lineHeight:1.55, fontWeight:500 }}>
                  <SIR_HL text={overview.callout.text} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
    { label: 'Name',                      value: record.name,                          mono: false },
    { label: 'Relation',                  value: record.relation,                      mono: false },
    { label: 'House / Flat',              value: record.house,                         mono: true  },
    { label: 'Voter ID/EPIC',             value: record.voterid,                       mono: true  },
    { label: 'Gender',                    value: record.gender,                        mono: false },
    { label: 'Age',                       value: record.age,                           mono: false },
    { label: 'Booth No',                  value: record.booth,                         mono: false },
    { label: 'Ward No',                   value: record.ward || record.part,           mono: false },
    { label: 'Ward Name',                 value: record.ward_name,                     mono: false },
    { label: 'Serial No',                 value: record.serial,                        mono: false },
    { label: 'Mapping Status',            value: record.mapping_status,                mono: false },
    { label: 'Community',                 value: record.community,                     mono: false },
    { label: 'Category',                  value: record.category,                      mono: false },
    { label: 'Ward Classification',       value: record.ward_classification,           mono: false },
    { label: 'Risk Status',               value: record.risk_status,                   mono: false },
    { label: 'Action Priority',           value: record.action_priority,               mono: false },
    { label: 'Poll Status 2023',          value: record.poll_status_2023,              mono: false },
    { label: 'Religion',                  value: record.religion,                      mono: false },
    { label: 'Section Name',              value: record.section_name,                  mono: false },
    { label: 'Polling Station Name',      value: record.polling_station_name,          mono: false },
    { label: 'Polling Station Address',   value: record.polling_station_address,       mono: false },
    { label: 'Voter Address',             value: record.voter_address,                 mono: false },
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
          width:'100%', maxWidth:480,
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
                textAlign:'right', wordBreak:'break-word',
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
  const [imageFile,   setImageFile]   = React.useState(pendingImage?.file || null); // original File for multipart
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
  React.useEffect(() => {
    if (onExtractedChange) onExtractedChange(extracted);
  }, [extracted]);

  // If docId arrives (parent just saved), auto-attach any extracted data
  React.useEffect(() => {
    if (docId && extracted && phase === 'review') {
      handleAttach();
    }
  }, [docId]);

  // When post-save uploader is mounted with carry-over image (pendingImage passed
  // from ConfirmAndSaveBar), jump to 'preview' so the image + Extract button shows
  // instead of the idle standalone buttons. The ConfirmAndSaveBar.useEffect handles
  // the actual auto-extract+attach; this is the visible fallback.
  React.useEffect(() => {
    if (docId && pendingImage && !extracted) {
      setPhase('preview');
    }
  }, []); // mount-only

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);  // keep original File for multipart upload
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      const imgObj = { base64, mimeType: file.type, previewUrl: e.target.result, file };
      setImageData(imgObj);
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

      // ── Compress before sending ──────────────────────────────────────────────
      // Raw phone photos (5–8 MB) as base64 JSON exceed Render's request limit.
      // Render's nginx returns 502/504 *before* Django sets CORS headers
      // → browser sees "No Access-Control-Allow-Origin" (CORS error).
      // Compressing to ≤1200 px keeps the payload ~300–400 KB.
      let sendBase64  = imageData.base64;
      let sendMime    = imageData.mimeType;
      if (imageFile) {
        try {
          const compressed = await compressSIRPhoto(imageFile);
          sendBase64 = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload  = (e) => res(e.target.result.split(',')[1]);
            r.onerror = rej;
            r.readAsDataURL(compressed);
          });
          sendMime = 'image/jpeg';
        } catch { /* compression failed — fall back to original */ }
      }

      const res = await fetch(`${API}/sir/form-extract/`, {
        method: 'POST', credentials: 'include', headers: hdrs,
        body: JSON.stringify({ image: sendBase64, mimeType: sendMime }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(`Server ${res.status}: ${txt.slice(0, 120)}`);
      }
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

      // ── Send as multipart/form-data (same as SurveyForm Aadhaar upload) ────
      // ⚠️ Do NOT set Content-Type — browser auto-sets multipart/form-data + boundary.
      // axios cannot be used here (it forces Content-Type: application/json).
      const fd = new FormData();
      fd.append('doc_id',          docId);
      fd.append('form_extraction', JSON.stringify(extracted));

      if (imageFile) {
        // Compress with same helper used by SurveyForm for Aadhaar photos
        let uploadFile = imageFile;
        try { uploadFile = await compressSIRPhoto(imageFile); } catch { /* use original */ }
        fd.append('form_image', uploadFile, uploadFile.name);
      }

      const hdrs = {};
      if (token) hdrs['Authorization'] = `Bearer ${token}`;
      // ⚠️ NO Content-Type header — required for multipart boundary to work

      const res  = await fetch(`${API}/sir/attach-form/`, {
        method: 'POST', credentials: 'include', headers: hdrs, body: fd,
      });
      const data = await res.json();
      if (data.success) {
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
function ConfirmAndSaveBar({ decided25, decided02, selected25, selected02, notFound25, notFound02, canConfirm, confirmStatus, savedDocId, handleConfirm, savedWithImage, savedFormImageUrl, savedFormImageErr, voterName, voterId }) {
  const [pendingImage,   setPendingImage]   = useState(null);
  const [pendingExtract, setPendingExtract] = useState(null);
  const [showFormPanel,  setShowFormPanel]  = useState(false);
  const [autoAttachErr,  setAutoAttachErr]  = useState('');
  const uploaderRef = useRef();

  // ── Post-save patch no longer needed ─────────────────────────────────────
  // handleConfirm now auto-extracts + uploads to GCS in a single call.
  // savedWithImage is always set to true after confirm, so this is a no-op.
  // Kept as a safety fallback in case the page is loaded with an existing savedDocId
  // that was saved before this change.
  React.useEffect(() => {
    if (confirmStatus !== 'saved' || !savedDocId || savedWithImage) return;
    // Nothing to do — everything was handled in handleConfirm
  }, [confirmStatus, savedDocId, savedWithImage]);

  const hasPendingForm = !!(pendingImage || pendingExtract);

  if (confirmStatus === 'saved') {
    return (
      <div style={{ marginTop:12, borderRadius:12, border:'1px solid rgba(16,185,129,0.2)', background:'rgba(16,185,129,0.04)', padding:'14px 16px' }}>
        {/* GCS error from the confirm call — shown when form_image_url was not stored */}
        {savedFormImageErr && !savedFormImageUrl && (
          <div style={{ marginBottom:10, padding:'9px 12px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, fontSize:12, color:'#fca5a5' }}>
            <div style={{ fontWeight:700, marginBottom:3 }}>⚠ Photo not uploaded to GCS</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:4, wordBreak:'break-word' }}>{savedFormImageErr}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>
              Check Render env vars:{' '}
              <code style={{ background:'rgba(255,255,255,0.07)', padding:'1px 5px', borderRadius:3 }}>GCS_BUCKET_NAME</code>{' '}
              and{' '}
              <code style={{ background:'rgba(255,255,255,0.07)', padding:'1px 5px', borderRadius:3 }}>GOOGLE_APPLICATION_CREDENTIALS_JSON</code>
            </div>
          </div>
        )}
        {autoAttachErr && (
          <div style={{ marginBottom:10, padding:'8px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, fontSize:12, color:'#fca5a5', display:'flex', alignItems:'center', gap:8 }}>
            <span>⚠ {autoAttachErr}</span>
            <button onClick={() => setAutoAttachErr('')} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:11, padding:0, marginLeft:'auto' }}>✕</button>
          </div>
        )}
        {/* Show URL from confirm call if already embedded */}
        {savedFormImageUrl && (
          <div style={{ marginBottom:10, display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#22d3ee', flexShrink:0 }}>📸 form_image_url</span>
            <a href={savedFormImageUrl} target="_blank" rel="noreferrer"
              style={{ color:'#7dd3fc', textDecoration:'none', fontSize:10, wordBreak:'break-all', flex:1 }}>
              {savedFormImageUrl}
            </a>
            <button onClick={() => navigator.clipboard?.writeText(savedFormImageUrl)}
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:5, color:'#94a3b8', fontSize:10, padding:'2px 7px', cursor:'pointer', flexShrink:0 }}>Copy</button>
          </div>
        )}
        <SIRFormUploader
          docId={savedDocId}
          name={voterName}
          voterid={voterId}
          pendingImage={pendingImage}
        />
      </div>
    );
  }

  if (confirmStatus === 'error') {
    return (
      <div style={{ marginTop:12, borderRadius:12, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.04)', padding:'12px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ color:'#f87171', fontWeight:700, fontSize:12, flex:1 }}>Save failed — please retry</span>
        <button onClick={() => handleConfirm(pendingImage, pendingExtract)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#f87171', fontSize:12, padding:'7px 14px', cursor:'pointer', fontWeight:600 }}>
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
            onClick={() => handleConfirm(pendingImage, pendingExtract)}
            disabled={!canConfirm || confirmStatus === 'saving' || confirmStatus === 'extracting'}
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
            {confirmStatus === 'extracting'
              ? <><span style={{ display:'inline-block', animation:'spin 0.7s linear infinite', fontSize:14 }}>⟳</span> Extracting form…</>
              : confirmStatus === 'saving'
              ? <><span style={{ display:'inline-block', animation:'spin 0.7s linear infinite', fontSize:14 }}>⟳</span> Saving…</>
              : <><Icon.Save /> Confirm &amp; Save{pendingImage ? ' + Extract' : ''}</>
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
  const [confirmStatus, setConfirmStatus] = useState('idle'); // idle | extracting | saving | saved | error
  const [savedDocId,    setSavedDocId]    = useState(null);
  const [savedWithImage,    setSavedWithImage]    = useState(false);
  const [savedFormImageUrl, setSavedFormImageUrl] = useState(null);
  const [savedFormImageErr, setSavedFormImageErr] = useState(null); // GCS error from confirm call
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

  // ── Single-click flow ──────────────────────────────────────────────────────
  // Capture photo → click "Confirm & Save" →
  //   1. auto-compress + extract from photo  (form-extract/)
  //   2. send confirm as multipart           (sir/confirm/) with image + extraction
  //   3. backend: GCS upload + MongoDB insert — one document, complete from the start
  const handleConfirm = async (pendingImg = null, pendingExt = null) => {
    const token   = sessionStorage.getItem('cc_token');
    const authHdr = token ? { 'Authorization': `Bearer ${token}` } : {};

    const sirPayload = {
      record_2025:    notFound25 ? null : selected25,
      record_2002:    notFound02 ? null : selected02,
      not_found_2025: notFound25,
      not_found_2002: notFound02,
      search_inputs:  searchInputs,
    };

    let resolvedExt = pendingExt;

    // ── Step 1: auto-extract if image present but extraction not done yet ───────
    if (pendingImg && !resolvedExt) {
      setConfirmStatus('extracting');
      try {
        let sendBase64 = pendingImg.base64;
        let sendMime   = pendingImg.mimeType;
        if (pendingImg.file) {
          try {
            const compressed = await compressSIRPhoto(pendingImg.file);
            sendBase64 = await new Promise((res, rej) => {
              const r = new FileReader();
              r.onload = e => res(e.target.result.split(',')[1]);
              r.onerror = rej;
              r.readAsDataURL(compressed);
            });
            sendMime = 'image/jpeg';
          } catch { /* use original */ }
        }
        const r = await fetch(`${API}/sir/form-extract/`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...authHdr },
          body: JSON.stringify({ image: sendBase64, mimeType: sendMime }),
        });
        const j = await r.json();
        if (j.success && j.data) resolvedExt = j.data;
      } catch { /* continue without extraction — image still uploaded */ }
    }

    // ── Step 2: confirm with everything in one multipart call ──────────────────
    setConfirmStatus('saving');
    try {
      let res;
      if (pendingImg || resolvedExt) {
        const fd = new FormData();
        fd.append('sir_data', JSON.stringify(sirPayload));
        if (resolvedExt) fd.append('form_extraction', JSON.stringify(resolvedExt));
        if (pendingImg) {
          let imgFile = pendingImg.file || base64ToFile(pendingImg.base64, pendingImg.mimeType);
          try { imgFile = await compressSIRPhoto(imgFile); } catch { /* use original */ }
          fd.append('form_image', imgFile, imgFile.name);
        }
        res = await fetch(`${API}/sir/confirm/`, {
          method: 'POST', credentials: 'include', headers: authHdr, body: fd,
        });
      } else {
        res = await fetch(`${API}/sir/confirm/`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...authHdr },
          body: JSON.stringify(sirPayload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setConfirmStatus('saved');
        setSavedDocId(data.doc_id || null);
        setSavedWithImage(true);  // everything sent in this single call
        setSavedFormImageUrl(data.form_image_url || null);
        setSavedFormImageErr(data.form_image_error || null);
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
                                ? (r.mapping_status.toUpperCase() === 'MAPPED' || r.mapping_status.toLowerCase() === 'mapped')
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
          savedWithImage={savedWithImage}
          savedFormImageUrl={savedFormImageUrl}
          savedFormImageErr={savedFormImageErr}
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
                            ? (rec.mapping_status.toUpperCase() === 'MAPPED' || rec.mapping_status.toLowerCase() === 'mapped')
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

// ─── PROGENY ANALYSIS DASHBOARD ─────────────────────────────────────────────
// Embedded intelligence from Mangaluru_Progeny_Family_Tree_Report_2002_2025.xlsx
// Data: 1,92,023 ancestral voters → 83,997 progeny across 19,727 matched houses

const PROGENY_WARD_DATA = [
  { ward: 21, name: 'PADAVU',              total: 7569,  base2002: 858,  strong: 188, medium: 669,  weak: 1581, notMappedPct: 0.2296, progenyLinkedPct: 0.3221, status: 'MOD GAP'  },
  { ward: 24, name: 'Derebail South',      total: 5665,  base2002: 509,  strong: 157, medium: 493,  weak: 678,  notMappedPct: 0.338,  progenyLinkedPct: 0.2344, status: 'HIGH GAP' },
  { ward: 25, name: 'Derebail West',       total: 7345,  base2002: 780,  strong: 206, medium: 710,  weak: 1063, notMappedPct: 0.2442, progenyLinkedPct: 0.2694, status: 'MOD GAP'  },
  { ward: 26, name: 'Derebail SW',         total: 7777,  base2002: 632,  strong: 180, medium: 759,  weak: 1126, notMappedPct: 0.3302, progenyLinkedPct: 0.2655, status: 'HIGH GAP' },
  { ward: 27, name: 'BOLOOR',              total: 6725,  base2002: 816,  strong: 231, medium: 610,  weak: 871,  notMappedPct: 0.2413, progenyLinkedPct: 0.2546, status: 'MOD GAP'  },
  { ward: 28, name: 'MANNAGUDDA',          total: 7928,  base2002: 583,  strong: 207, medium: 821,  weak: 746,  notMappedPct: 0.3691, progenyLinkedPct: 0.2238, status: 'HIGH GAP' },
  { ward: 29, name: 'KAMBLA',              total: 5720,  base2002: 437,  strong: 173, medium: 633,  weak: 549,  notMappedPct: 0.3365, progenyLinkedPct: 0.2369, status: 'HIGH GAP' },
  { ward: 30, name: 'KODIALBAIL',          total: 6022,  base2002: 587,  strong: 158, medium: 620,  weak: 657,  notMappedPct: 0.2846, progenyLinkedPct: 0.2383, status: 'MOD GAP'  },
  { ward: 31, name: 'BEJAI',               total: 7332,  base2002: 513,  strong: 142, medium: 674,  weak: 768,  notMappedPct: 0.3217, progenyLinkedPct: 0.2160, status: 'HIGH GAP' },
  { ward: 32, name: 'KADRI North',         total: 5754,  base2002: 627,  strong: 159, medium: 594,  weak: 887,  notMappedPct: 0.2782, progenyLinkedPct: 0.2850, status: 'MOD GAP'  },
  { ward: 33, name: 'KADRI SOUTH',         total: 6594,  base2002: 381,  strong: 112, medium: 582,  weak: 690,  notMappedPct: 0.3623, progenyLinkedPct: 0.2099, status: 'HIGH GAP' },
  { ward: 34, name: 'SHIVBHAG',            total: 6314,  base2002: 411,  strong: 112, medium: 515,  weak: 713,  notMappedPct: 0.2781, progenyLinkedPct: 0.2122, status: 'MOD GAP'  },
  { ward: 35, name: 'PADAVU CENTRAL',      total: 8451,  base2002: 674,  strong: 150, medium: 725,  weak: 1373, notMappedPct: 0.2580, progenyLinkedPct: 0.2660, status: 'MOD GAP'  },
  { ward: 36, name: 'PADAVU POORVA',       total: 4447,  base2002: 440,  strong: 166, medium: 334,  weak: 677,  notMappedPct: 0.338,  progenyLinkedPct: 0.2647, status: 'HIGH GAP' },
  { ward: 37, name: 'MAROLI',              total: 6884,  base2002: 627,  strong: 156, medium: 647,  weak: 1157, notMappedPct: 0.1944, progenyLinkedPct: 0.2847, status: 'LOW GAP'  },
  { ward: 38, name: 'BENDUR',              total: 6095,  base2002: 167,  strong: 61,  medium: 394,  weak: 397,  notMappedPct: 0.2871, progenyLinkedPct: 0.1398, status: 'MOD GAP'  },
  { ward: 39, name: 'FALNIR',              total: 6512,  base2002: 287,  strong: 62,  medium: 430,  weak: 717,  notMappedPct: 0.2432, progenyLinkedPct: 0.1857, status: 'MOD GAP'  },
  { ward: 40, name: 'COURT',               total: 6003,  base2002: 237,  strong: 81,  medium: 447,  weak: 458,  notMappedPct: 0.3153, progenyLinkedPct: 0.1643, status: 'HIGH GAP' },
  { ward: 41, name: 'CENTRAL',             total: 4915,  base2002: 463,  strong: 144, medium: 507,  weak: 458,  notMappedPct: 0.2777, progenyLinkedPct: 0.2256, status: 'MOD GAP'  },
  { ward: 42, name: 'DONGERKERY',          total: 6709,  base2002: 528,  strong: 172, medium: 691,  weak: 677,  notMappedPct: 0.3123, progenyLinkedPct: 0.2295, status: 'HIGH GAP' },
  { ward: 43, name: 'KUDROLI',             total: 5710,  base2002: 384,  strong: 145, medium: 392,  weak: 697,  notMappedPct: 0.310,  progenyLinkedPct: 0.2161, status: 'HIGH GAP' },
  { ward: 44, name: 'NAVAYATH',            total: 5802,  base2002: 483,  strong: 153, medium: 453,  weak: 624,  notMappedPct: 0.2964, progenyLinkedPct: 0.2120, status: 'MOD GAP'  },
  { ward: 45, name: 'PORT',                total: 7045,  base2002: 490,  strong: 160, medium: 514,  weak: 824,  notMappedPct: 0.2346, progenyLinkedPct: 0.2126, status: 'MOD GAP'  },
  { ward: 46, name: 'CANTONMENT',          total: 4149,  base2002: 313,  strong: 63,  medium: 360,  weak: 573,  notMappedPct: 0.3717, progenyLinkedPct: 0.2401, status: 'HIGH GAP' },
  { ward: 47, name: 'MILAGRIS',            total: 6993,  base2002: 295,  strong: 80,  medium: 497,  weak: 602,  notMappedPct: 0.3439, progenyLinkedPct: 0.1686, status: 'HIGH GAP' },
  { ward: 48, name: 'VALENCIA',            total: 5296,  base2002: 363,  strong: 77,  medium: 460,  weak: 786,  notMappedPct: 0.2321, progenyLinkedPct: 0.2498, status: 'MOD GAP'  },
  { ward: 49, name: 'KANKANADY',           total: 7547,  base2002: 784,  strong: 188, medium: 687,  weak: 1464, notMappedPct: 0.2308, progenyLinkedPct: 0.3099, status: 'MOD GAP'  },
  { ward: 50, name: 'ALAPE DAKSHINA',      total: 6338,  base2002: 616,  strong: 150, medium: 602,  weak: 1173, notMappedPct: 0.2032, progenyLinkedPct: 0.3037, status: 'MOD GAP'  },
  { ward: 51, name: 'ALAPE UTTARA',        total: 7171,  base2002: 493,  strong: 77,  medium: 635,  weak: 1211, notMappedPct: 0.2129, progenyLinkedPct: 0.2682, status: 'MOD GAP'  },
  { ward: 52, name: 'KANNUR',              total: 7084,  base2002: 680,  strong: 177, medium: 540,  weak: 1374, notMappedPct: 0.2053, progenyLinkedPct: 0.2952, status: 'MOD GAP'  },
  { ward: 53, name: 'BAJAL',               total: 7823,  base2002: 891,  strong: 297, medium: 619,  weak: 1861, notMappedPct: 0.2223, progenyLinkedPct: 0.3550, status: 'MOD GAP'  },
  { ward: 54, name: 'JEPPINAMUGER',        total: 7162,  base2002: 565,  strong: 87,  medium: 715,  weak: 1433, notMappedPct: 0.2019, progenyLinkedPct: 0.3121, status: 'MOD GAP'  },
  { ward: 55, name: 'ATTAVARA',            total: 7603,  base2002: 471,  strong: 90,  medium: 658,  weak: 1174, notMappedPct: 0.2321, progenyLinkedPct: 0.2528, status: 'MOD GAP'  },
  { ward: 56, name: 'MANGALADEVI',         total: 5274,  base2002: 266,  strong: 27,  medium: 461,  weak: 858,  notMappedPct: 0.2594, progenyLinkedPct: 0.2552, status: 'MOD GAP'  },
  { ward: 57, name: 'HOIGE BAZAR',         total: 7128,  base2002: 521,  strong: 96,  medium: 663,  weak: 1268, notMappedPct: 0.2647, progenyLinkedPct: 0.2844, status: 'MOD GAP'  },
  { ward: 58, name: 'BOLAR',               total: 4263,  base2002: 360,  strong: 89,  medium: 409,  weak: 632,  notMappedPct: 0.2648, progenyLinkedPct: 0.2651, status: 'MOD GAP'  },
  { ward: 59, name: 'JEPPU',               total: 7802,  base2002: 407,  strong: 3,   medium: 674,  weak: 1312, notMappedPct: 0.2452, progenyLinkedPct: 0.2549, status: 'MOD GAP'  },
  { ward: 60, name: 'BENGRE',              total: 9743,  base2002: 752,  strong: 272, medium: 836,  weak: 1931, notMappedPct: 0.0772, progenyLinkedPct: 0.3119, status: 'LOW GAP'  },
];

const GENERATION_DATA = [
  { gen: 'GEN-1/2 (30-44)', count: 31038, pct: 36.95, desc: 'Late children / early grandchildren (boundary cohort)', color: '#f59e0b' },
  { gen: 'GEN-1 (45-59)',   count: 21393, pct: 25.47, desc: 'Core progeny — direct children of 2002 adults',         color: '#22d3ee' },
  { gen: 'GEN-1 (60+)',     count: 16706, pct: 19.89, desc: 'Children of elderly 2002 voters (age 70+)',             color: '#a78bfa' },
  { gen: 'GEN-2 (18-29)',   count: 14860, pct: 17.69, desc: 'Grandchildren — new voters enrolled since 2014',        color: '#10b981' },
];

// Summary KPIs
const PROGENY_KPIs = {
  ancestralVoters:  192023,
  progenyVoters:    83997,
  matchedHouses:    19727,
  totalVoters2025:  251480,
  totalWards:       39,
  highGapWards:     13,
  lowGapWards:      2,
};

// ─── Progeny Voter List Modal (Ancestor-primary redesign) ─────────────────────
// Each row shows the ANCESTOR (2023 roll) as the primary identity.
// The 2025 voter record is displayed as a linked child beneath it.
// Layout: ancestor card (left accent) → 2025 row (indented, teal border)
function ProgenyVoterListModal({ onClose }) {
  const [records, setRecords]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [wardF, setWardF]         = useState('');
  const [boothF, setBoothF]       = useState('');
  const [expanded, setExpanded]   = useState({});   // _id → true/false for detail expansion
  const searchDebounce            = useRef(null);

  const fetchVoters = useCallback(async (pg = 1, q = search, w = wardF, b = boothF) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: pg, limit: 20 });
      if (q) params.set('search', q);
      if (w) params.set('ward', w);
      if (b) params.set('booth', b);
      const token = sessionStorage.getItem('cc_token') || '';
      const res = await fetch(`${API}/progeny/voters/?${params}`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        setTotal(data.total);
        setPages(data.pages);
        setPage(pg);
        setExpanded({});
      } else {
        setError(data.message || 'Failed to load voters');
      }
    } catch (e) {
      setError('Network error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [search, wardF, boothF]);

  useEffect(() => { fetchVoters(1); }, []); // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchVoters(1, val, wardF, boothF), 400);
  };

  const handleWard  = (val) => { setWardF(val);  fetchVoters(1, search, val, boothF); };
  const handleBooth = (val) => { setBoothF(val); fetchVoters(1, search, wardF, val);  };
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // ── Ancestor-primary card ───────────────────────────────────────────────────
  const AncestorRow = ({ r, idx }) => {
    const id      = r._id || idx;
    const isOpen  = !!expanded[id];
    const polled  = (r['Polled 2023?'] || '').toLowerCase() === 'polled';
    const in2025  = (r['In 2025?'] || '').toUpperCase() === 'YES';
    const gender  = r['Gender'] || '';
    const relType = r['Relation Type'] || r['relationType'] || '';
    const gColor  = gender === 'M' ? '#60a5fa' : gender === 'F' ? '#f472b6' : '#a3a3a3';
    const polledColor = polled ? '#10b981' : '#ef4444';
    const in2025Color = in2025 ? '#22d3ee' : '#f87171';

    // Relation label mapping
    const REL_MAP = { F:'Father', M:'Mother', H:'Husband', W:'Wife', S:'Son', D:'Daughter', O:'Other', C:'Child' };
    const relLabel = REL_MAP[relType] || relType || 'Relative';

    return (
      <div style={{
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `3px solid rgba(245,158,11,0.6)`,
        background: idx % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.15)',
        marginBottom: 8,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}>

        {/* ── ANCESTOR primary row ─────────────────────────────────────────── */}
        <div
          onClick={() => toggleExpand(id)}
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr auto'
              : '260px 130px 72px 52px 90px 90px 1fr auto',
            alignItems: 'center',
            gap: isMobile ? 8 : 0,
            padding: isMobile ? '12px 14px' : '10px 14px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Name + EPIC + House */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              {/* Generation avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))`,
                border: '1px solid rgba(245,158,11,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 12,
              }}>
                {gender === 'M' ? '♂' : gender === 'F' ? '♀' : '?'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
                  {r['Voter Name'] || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontFamily: 'ui-monospace,monospace', color: '#f59e0b' }}>
                    {r['Epic / Voter ID'] || '—'}
                  </span>
                  {r['House No'] && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                      · {r['House No']}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ancestor of (relation) */}
          {!isMobile && (
            <div style={{ padding: '0 10px' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                Ancestor of
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                {r['Relative Name'] || '—'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{relLabel}</div>
            </div>
          )}

          {/* Gender + Age */}
          {!isMobile && (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: gColor, background: gColor + '22', borderRadius: 5, padding: '2px 7px', display: 'inline-block', marginBottom: 3 }}>
                {gender || '—'}
              </span>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Age {r['Age (2023)'] ?? '—'}</div>
            </div>
          )}

          {/* Ward / Booth */}
          {!isMobile && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>W{r['Ward'] ?? '—'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>B{r['Booth'] ?? '—'}</div>
            </div>
          )}

          {/* 2023 polled status */}
          {!isMobile && (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: polledColor, background: polledColor + '1a', borderRadius: 5, padding: '2px 7px' }}>
                {polled ? 'Polled' : 'Not Polled'}
              </span>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>2023</div>
            </div>
          )}

          {/* 2025 status */}
          {!isMobile && (
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: in2025Color, background: in2025Color + '1a', borderRadius: 5, padding: '2px 7px' }}>
                {in2025 ? 'In 2025' : 'Not in 2025'}
              </span>
              {r['Name in 2025'] && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r['Name in 2025']}</div>
              )}
            </div>
          )}

          {/* Community */}
          {!isMobile && (
            <div style={{ paddingLeft: 8 }}>
              {r['Community'] && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.06)', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                  {r['Community']}
                </span>
              )}
              {r['Category'] && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{r['Category']}</div>
              )}
            </div>
          )}

          {/* Mobile badges */}
          {isMobile && (
            <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: polledColor, background: polledColor + '1a', borderRadius: 5, padding: '1px 6px' }}>
                {polled ? 'Polled' : 'Not Polled'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: in2025Color, background: in2025Color + '1a', borderRadius: 5, padding: '1px 6px' }}>
                {in2025 ? '2025 ✓' : '2025 ✗'}
              </span>
            </div>
          )}

          {/* Expand toggle */}
          <div style={{ color: 'rgba(255,255,255,0.25)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0, marginLeft: 4 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </div>
        </div>

        {/* ── EXPANDED DETAIL PANEL ───────────────────────────────────────── */}
        {isOpen && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 16px',
            background: 'rgba(0,0,0,0.18)',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 12,
          }}>

            {/* Ancestor (2023 Roll) detail */}
            <div style={{
              borderRadius: 10,
              border: '1px solid rgba(245,158,11,0.2)',
              borderLeft: '3px solid #f59e0b',
              background: 'rgba(245,158,11,0.04)',
              padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.5px' }}>ANCESTOR — 2023 VOTER ROLL</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                {[
                  ['Name',      r['Voter Name']],
                  ['EPIC ID',   r['Epic / Voter ID']],
                  ['House No',  r['House No']],
                  ['Gender',    r['Gender']],
                  ['Age (2023)',r['Age (2023)']],
                  ['Relation',  `${(r['Relation Type'] || '')} of ${r['Relative Name'] || '—'}`],
                  ['Ward',      r['Ward']],
                  ['Booth',     r['Booth']],
                  ['Polled',    r['Polled 2023?']],
                  ['Community', r['Community']],
                  ['Category',  r['Category']],
                ].filter(([, v]) => v != null && v !== '').map(([lbl, val]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 1 }}>{lbl}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: lbl === 'Polled' ? ((val||'').toLowerCase() === 'polled' ? '#10b981' : '#f87171') : '#e2e8f0', fontFamily: lbl === 'EPIC ID' ? 'ui-monospace,monospace' : 'inherit' }}>
                      {String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2025 Roll record */}
            <div style={{
              borderRadius: 10,
              border: `1px solid ${in2025 ? 'rgba(34,211,238,0.25)' : 'rgba(239,68,68,0.18)'}`,
              borderLeft: `3px solid ${in2025 ? '#22d3ee' : '#ef4444'}`,
              background: in2025 ? 'rgba(34,211,238,0.04)' : 'rgba(239,68,68,0.03)',
              padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={in2025 ? '#22d3ee' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {in2025
                    ? <><polyline points="3 8 6 11 13 4"/><circle cx="8" cy="8" r="6.5"/></>
                    : <><circle cx="8" cy="8" r="6.5"/><line x1="5" y1="5" x2="11" y2="11"/><line x1="11" y1="5" x2="5" y2="11"/></>
                  }
                </svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: in2025 ? '#22d3ee' : '#f87171', letterSpacing: '0.5px' }}>
                  {in2025 ? 'CURRENT — 2025 VOTER ROLL' : 'NOT FOUND IN 2025 ROLL'}
                </span>
              </div>
              {in2025 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                  {[
                    ['Name (2025)',   r['Name in 2025']],
                    ['Age (2025)',    r['Age in 2025']],
                    ['Ward',         r['Ward']],
                    ['Booth',        r['Booth']],
                  ].filter(([, v]) => v != null && v !== '').map(([lbl, val]) => (
                    <div key={lbl}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 1 }}>{lbl}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{String(val)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  This voter was on the 2023 roll but does not appear in the 2025 voter list.
                  They may have been deleted, migrated, or not yet enrolled.
                </div>
              )}
            </div>

            {/* ── 2002 Ancestors in House ─────────────────────────────────────── */}
            {r['2002 Ancestors in House'] && (() => {
              const ancestors = String(r['2002 Ancestors in House']).split('|').map(n => n.trim()).filter(Boolean);
              return (
                <div style={{
                  gridColumn: isMobile ? '1' : '1 / -1',
                  borderRadius: 10,
                  border: '1px solid rgba(167,139,250,0.2)',
                  borderLeft: '3px solid #a78bfa',
                  background: 'rgba(167,139,250,0.04)',
                  padding: '12px 14px',
                  marginTop: 4,
                }}>
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 7.5L8 2l6 5.5"/><path d="M3.5 6.5V14h3.5v-3.5h2V14H13V6.5"/>
                      </svg>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', letterSpacing: '0.5px' }}>
                        2002 ANCESTORS IN HOUSE
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>· {ancestors.length} voters listed</span>
                    </div>
                    {r['2002 Family Size'] != null && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 20, padding: '2px 10px' }}>
                        {r['2002 Family Size']} in household
                      </span>
                    )}
                  </div>

                  {/* Voter name rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {ancestors.map((name, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '5px 10px',
                        borderRadius: 6,
                        background: i % 2 === 0 ? 'rgba(167,139,250,0.05)' : 'transparent',
                        border: '1px solid rgba(167,139,250,0.08)',
                      }}>
                        {/* Row number */}
                        <span style={{
                          fontSize: 9, fontWeight: 700,
                          color: 'rgba(167,139,250,0.45)',
                          minWidth: 20, textAlign: 'right',
                          flexShrink: 0,
                          fontFamily: 'ui-monospace,monospace',
                        }}>
                          {i + 1}
                        </span>
                        {/* Person icon */}
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
                        </svg>
                        {/* Name */}
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: '#e2e8f0',
                          letterSpacing: '0.1px',
                        }}>
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  // ── keep the old FIELDS def below but we only use it for the legacy desktop table (now replaced) ──
  const FIELDS = [
    { key: 'House No',        label: 'House No'   },
    { key: 'Voter Name',      label: 'Name'       },
    { key: 'Epic / Voter ID', label: 'EPIC / ID'  },
    { key: 'Gender',          label: 'Gender'     },
    { key: 'Age (2023)',      label: 'Age'        },
    { key: 'Relation Type',   label: 'Relation'   },
    { key: 'Relative Name',   label: 'Relative'   },
    { key: 'Ward',            label: 'Ward'       },
    { key: 'Booth',           label: 'Booth'      },
    { key: 'Polled 2023?',    label: 'Polled'     },
    { key: 'In 2025?',        label: '2025?'      },
    { key: 'Name in 2025',    label: '2025 Name'  },
    { key: 'Age in 2025',     label: '2025 Age'   },
    { key: 'Community',       label: 'Community'  },
    { key: 'Category',        label: 'Category'   },
  ];

  const GenderBadge = ({ g }) => {
    const col = g === 'M' ? '#60a5fa' : g === 'F' ? '#f472b6' : '#a3a3a3';
    return <span style={{ fontSize: 10, fontWeight: 700, color: col, background: col + '22', borderRadius: 4, padding: '1px 6px' }}>{g || '—'}</span>;
  };

  const PolledBadge = ({ val }) => {
    const polled = (val || '').toLowerCase() === 'polled';
    const col    = polled ? '#10b981' : '#ef4444';
    return <span style={{ fontSize: 10, fontWeight: 700, color: col, background: col + '22', borderRadius: 4, padding: '1px 6px' }}>{val || '—'}</span>;
  };

  const In2025Badge = ({ val }) => {
    const yes = (val || '').toUpperCase() === 'YES';
    const col = yes ? '#22d3ee' : '#f87171';
    return <span style={{ fontSize: 10, fontWeight: 700, color: col, background: col + '22', borderRadius: 4, padding: '1px 6px' }}>{val || '—'}</span>;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: isMobile ? '8px 4px' : '32px 16px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#0f1117', border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 16, width: '100%', maxWidth: 960, minHeight: 480,
        display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(245,158,11,0.06)', flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="4.5" r="2"/><circle cx="11" cy="4.5" r="2"/>
                <path d="M1 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/>
                <path d="M8 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/>
              </svg>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>Progeny Voter List</span>
              {total > 0 && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>
                  {total.toLocaleString()} records
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>progeny collection · SurveyDataBase</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
            fontSize: 16, lineHeight: 1, transition: 'all 0.15s',
          }}>✕</button>
        </div>

        {/* Search + Filter Bar */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0,
          background: 'rgba(0,0,0,0.2)',
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 9, padding: '7px 12px', flex: '1 1 220px',
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/>
            </svg>
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search name, EPIC ID, house, relative…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: isMobile ? 16 : 13, color: '#fff', minWidth: 0 }}
              autoCorrect="off" autoCapitalize="off"
            />
            {search && (
              <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 15, padding: '2px' }}>✕</button>
            )}
          </div>

          {/* Ward filter */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 9, padding: '7px 12px', flex: '0 1 110px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>WARD</span>
            <input
              value={wardF} onChange={e => handleWard(e.target.value)}
              placeholder="e.g. 21" type="number"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: isMobile ? 16 : 13, color: '#fff', minWidth: 0, width: 56 }}
            />
            {wardF && <button onClick={() => handleWard('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 15, padding: '2px' }}>✕</button>}
          </div>

          {/* Booth filter */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 9, padding: '7px 12px', flex: '0 1 110px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>BOOTH</span>
            <input
              value={boothF} onChange={e => handleBooth(e.target.value)}
              placeholder="e.g. 53" type="number"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: isMobile ? 16 : 13, color: '#fff', minWidth: 0, width: 56 }}
            />
            {boothF && <button onClick={() => handleBooth('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 15, padding: '2px' }}>✕</button>}
          </div>

          {(search || wardF || boothF) && (
            <button onClick={() => { setSearch(''); setWardF(''); setBoothF(''); fetchVoters(1, '', '', ''); }}
              style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontWeight: 700 }}>
              Clear All
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 }}>
              <div style={{ width: 18, height: 18, border: '2px solid rgba(245,158,11,0.2)', borderTop: '2px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading voters…</span>
            </div>
          )}

          {error && !loading && (
            <div style={{ margin: 20, padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              No voters found{(search || wardF || boothF) ? ' matching current filters' : ''}.
            </div>
          )}

          {!loading && records.length > 0 && (
            <div style={{ padding: isMobile ? '10px 10px' : '12px 16px' }}>

              {/* ── Column header (desktop only) ─────────────────────────── */}
              {!isMobile && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '260px 130px 72px 52px 90px 90px 1fr auto',
                  padding: '0 14px 8px',
                  gap: 0,
                  marginBottom: 4,
                }}>
                  {[
                    { label: 'Ancestor (2023 Roll)', sub: 'name · epic · house' },
                    { label: 'Ancestor of',          sub: 'relative · relation' },
                    { label: 'Gender / Age',         sub: '' },
                    { label: 'Ward',                 sub: 'Booth' },
                    { label: '2023 Poll',            sub: 'voted?' },
                    { label: '2025 Roll',            sub: 'present?' },
                    { label: 'Community',            sub: 'category' },
                    { label: '',                     sub: '' },
                  ].map((col, ci) => (
                    <div key={ci} style={{ padding: ci === 0 ? 0 : '0 10px' }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.55px' }}>{col.label}</div>
                      {col.sub && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginTop: 1 }}>{col.sub}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Ancestor rows ─────────────────────────────────────────── */}
              {records.map((r, i) => (
                <AncestorRow key={r._id || i} r={r} idx={i} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {pages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.2)', flexShrink: 0, flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              Page {page} of {pages} · {total.toLocaleString()} total
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => fetchVoters(page - 1)}
                disabled={page <= 1 || loading}
                style={{
                  padding: '5px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
                  background: page <= 1 ? 'transparent' : 'rgba(255,255,255,0.05)',
                  color: page <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                  cursor: page <= 1 ? 'default' : 'pointer', fontSize: 12, fontWeight: 600,
                }}>← Prev</button>
              {/* Page number pills */}
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const half  = 2;
                let start   = Math.max(1, page - half);
                const end   = Math.min(pages, start + 4);
                start       = Math.max(1, end - 4);
                return start + i;
              }).map(pg => (
                <button key={pg} onClick={() => fetchVoters(pg)}
                  style={{
                    padding: '5px 10px', borderRadius: 7, border: '1px solid',
                    borderColor: pg === page ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                    background: pg === page ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                    color: pg === page ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', fontSize: 12, fontWeight: pg === page ? 700 : 500,
                    minWidth: 32,
                  }}>{pg}</button>
              ))}
              <button
                onClick={() => fetchVoters(page + 1)}
                disabled={page >= pages || loading}
                style={{
                  padding: '5px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
                  background: page >= pages ? 'transparent' : 'rgba(255,255,255,0.05)',
                  color: page >= pages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                  cursor: page >= pages ? 'default' : 'pointer', fontSize: 12, fontWeight: 600,
                }}>Next →</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Progeny Analysis Dashboard ───────────────────────────────────────────────
function ProgenyAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | wards | generations
  const [sortKey, setSortKey] = useState('notMappedPct');
  const [sortDir, setSortDir] = useState('desc');
  const [wardFilter, setWardFilter] = useState('ALL'); // ALL | HIGH GAP | MOD GAP | LOW GAP
  const [showVoterList, setShowVoterList] = useState(false);

  const statusConfig = {
    'HIGH GAP': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)',  label: 'HIGH GAP'  },
    'MOD GAP':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', label: 'MOD GAP'  },
    'LOW GAP':  { color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', label: 'LOW GAP'  },
  };

  const filteredWards = PROGENY_WARD_DATA
    .filter(w => wardFilter === 'ALL' || w.status === wardFilter)
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortArrow = ({ col }) => (
    <span style={{ fontSize: 9, marginLeft: 3, opacity: sortKey === col ? 1 : 0.3 }}>
      {sortKey === col ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
    </span>
  );

  const totalProgeny = PROGENY_WARD_DATA.reduce((s, w) => s + w.strong + w.medium + w.weak, 0);

  const TAB_ICONS = {
    overview: () => (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="8" width="3" height="6" rx="0.5"/>
        <rect x="6" y="5" width="3" height="9" rx="0.5"/>
        <rect x="11" y="2" width="3" height="12" rx="0.5"/>
        <path d="M1 13h14" strokeWidth="1"/>
      </svg>
    ),
    wards: () => (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13L6 3l4 6 2-3 2 7"/>
        <path d="M1 13h14"/>
      </svg>
    ),
    generations: () => (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="4" r="1.8"/>
        <circle cx="11" cy="4" r="1.8"/>
        <path d="M2 11c0-1.657 1.343-3 3-3s3 1.343 3 3"/>
        <path d="M8 11c0-1.657 1.343-3 3-3s3 1.343 3 3"/>
      </svg>
    ),
  };

  const TABS = [
    { key: 'overview',     label: 'Overview'      },
    { key: 'wards',        label: 'Ward Analysis'  },
    { key: 'generations',  label: 'Generations'    },
  ];

  return (
    <>
    <div style={{
      background: 'linear-gradient(145deg,rgba(12,18,42,0.97),rgba(8,12,28,0.99))',
      border: '1px solid rgba(245,158,11,0.18)',
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 20,
      boxShadow: '0 6px 32px rgba(0,0,0,0.4)',
    }}>
      {/* ── Panel Header ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(245,158,11,0.09),rgba(99,102,241,0.06))',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        padding: '16px 20px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 14V8"/>
                  <path d="M8 8C8 8 4 7 4 4a4 4 0 018 0c0 3-4 4-4 4z"/>
                  <path d="M8 11C8 11 5 10.5 5 8.5"/>
                  <path d="M8 11C8 11 11 10.5 11 8.5"/>
                  <path d="M6 14h4"/>
                </svg>
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.3px' }}>
                Progeny Family Tree
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '2px 9px' }}>
                2002 → 2025
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', paddingLeft: 26 }}>
              Voter genealogy analysis · 19,727 matched households · Mangaluru City Corporation
            </div>
          </div>
          {/* Top-level KPIs strip */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { val: '1,92,023', lbl: 'Ancestors 2002', color: '#f59e0b'  },
              { val: '83,997',   lbl: 'Progeny 2025',   color: '#22d3ee'  },
              { val: '19,727',   lbl: 'Matched Houses', color: '#10b981'  },
              { val: '39',       lbl: 'Wards',          color: '#a78bfa'  },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.25)', border: `1px solid ${color}28`, borderRadius: 10, padding: '6px 13px', minWidth: 80 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Row ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(({ key, label }) => {
          const TabIcon = TAB_ICONS[key];
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              flex: '0 0 auto',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px',
              border: 'none',
              borderBottom: `2px solid ${active ? '#f59e0b' : 'transparent'}`,
              background: active ? 'rgba(245,158,11,0.06)' : 'transparent',
              color: active ? '#fbbf24' : 'rgba(255,255,255,0.35)',
              fontSize: 12, fontWeight: active ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {TabIcon && <TabIcon />}
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '18px 20px' }}>

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Coverage metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: 'Progeny Coverage',   value: `${((PROGENY_KPIs.progenyVoters / PROGENY_KPIs.totalVoters2025)*100).toFixed(1)}%`, sub: 'of 2025 total roll',   color: '#22d3ee', icon: () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 11L6 7l3 3 5-6"/><path d="M12 4h3v3"/></svg> },
                { label: 'High Gap Wards',      value: `${PROGENY_KPIs.highGapWards} / ${PROGENY_KPIs.totalWards}`, sub: 'need urgent SIR action', color: '#ef4444', icon: () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5L1 14.5h14L8 1.5z"/><path d="M8 6v4M8 11.5v.5"/></svg> },
                { label: 'Total Progeny Voters', value: '83,997', sub: 'classified by generation', color: '#f59e0b', icon: () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="4.5" r="2"/><circle cx="11" cy="4.5" r="2"/><path d="M1 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/><path d="M8 13c0-2.209 1.791-4 4-4s4 1.791 4 4"/></svg> },
                { label: 'Low Gap Wards',       value: `${PROGENY_KPIs.lowGapWards}`,           sub: 'Maroli & Bengre leading', color: '#10b981', icon: () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5L2 4v4.5c0 3 2.5 5.5 6 6 3.5-.5 6-3 6-6V4L8 1.5z"/><path d="M5.5 8.5l2 2 3-3.5"/></svg> },
              ].map(({ label, value, sub, color, icon: IconComp }) => (
                <div key={label} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}22`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ color, marginBottom: 6 }}><IconComp /></div>
                  <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.5px', marginBottom: 2 }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', lineHeight: 1.4 }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3 }}>{sub}</div>
                  {label === 'Total Progeny Voters' && (
                    <button
                      onClick={() => setShowVoterList(true)}
                      style={{
                        marginTop: 10, alignSelf: 'flex-start',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
                        borderRadius: 7, padding: '4px 10px', cursor: 'pointer',
                        fontSize: 11, fontWeight: 700, color: '#f59e0b',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.25)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="8" cy="8" r="3"/><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
                      </svg>
                      View Voters
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Progeny link quality bar */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Ancestor Link Quality — 83,997 Progeny Voters
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'STRONG link',  count: PROGENY_WARD_DATA.reduce((s,w)=>s+w.strong,0), color: '#10b981', desc: 'Direct ancestor found at same address — HIGH confidence' },
                  { label: 'MEDIUM link', count: PROGENY_WARD_DATA.reduce((s,w)=>s+w.medium,0), color: '#f59e0b', desc: 'Rare name, ≤3 occurrences — MEDIUM confidence, verify' },
                  { label: 'WEAK link',   count: PROGENY_WARD_DATA.reduce((s,w)=>s+w.weak,0),   color: '#f87171', desc: 'Common name, 4–50 occurrences — flag for BLO field check' },
                ].map(({ label, count, color, desc }) => {
                  const pct = ((count / totalProgeny) * 100).toFixed(1);
                  return (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 90 }}>{label}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{desc}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color }}>{count.toLocaleString()}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 5 wards needing immediate action */}
            <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span style={{ color: '#f87171' }}><Icon.Warning /></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Highest Unmapped Wards — Immediate SIR Action Required
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...PROGENY_WARD_DATA]
                  .sort((a,b) => b.notMappedPct - a.notMappedPct)
                  .slice(0, 6)
                  .map((w, i) => {
                    const sCfg = statusConfig[w.status] || statusConfig['MOD GAP'];
                    return (
                      <div key={w.ward} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', minWidth: 16, textAlign: 'right' }}>#{i+1}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 6px', minWidth: 30, textAlign: 'center' }}>
                          {w.ward}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                        <div style={{ flex: 2, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ width: `${(w.notMappedPct*100).toFixed(1)}%`, height: '100%', background: w.notMappedPct > 0.35 ? '#ef4444' : '#f59e0b', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: w.notMappedPct > 0.35 ? '#f87171' : '#fbbf24', minWidth: 40, textAlign: 'right' }}>
                          {(w.notMappedPct*100).toFixed(1)}%
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: sCfg.color, background: sCfg.bg, border: `1px solid ${sCfg.border}`, borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>
                          {sCfg.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Best performers */}
            <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span style={{ color: '#10b981' }}><Icon.Shield /></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Best Progeny Mapping — Model Wards
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[...PROGENY_WARD_DATA]
                  .sort((a,b) => b.progenyLinkedPct - a.progenyLinkedPct)
                  .slice(0, 4)
                  .map((w, i) => (
                    <div key={w.ward} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', minWidth: 16, textAlign: 'right' }}>#{i+1}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 6px', minWidth: 30, textAlign: 'center' }}>{w.ward}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                      <div style={{ flex: 2, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ width: `${(w.progenyLinkedPct*100).toFixed(1)}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', minWidth: 40, textAlign: 'right' }}>
                        {(w.progenyLinkedPct*100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ WARD ANALYSIS TAB ════════════════════════════════════════════════ */}
        {activeTab === 'wards' && (
          <div>
            {/* Filter + sort controls */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {['ALL','HIGH GAP','MOD GAP','LOW GAP'].map(f => {
                const active = wardFilter === f;
                const cfg = statusConfig[f] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' };
                return (
                  <button key={f} onClick={() => setWardFilter(f)} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer',
                    background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                    color: active ? cfg.color : 'rgba(255,255,255,0.4)', transition: 'all 0.15s',
                  }}>
                    {f === 'ALL' ? `All (${PROGENY_WARD_DATA.length})` : `${statusConfig[f]?.label} (${PROGENY_WARD_DATA.filter(w=>w.status===f).length})`}
                  </button>
                );
              })}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                Click column headers to sort
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {[
                      { key: 'ward',            label: 'Ward'              },
                      { key: 'total',           label: 'Total 2025'        },
                      { key: 'base2002',        label: '2002 Base'         },
                      { key: 'strong',          label: 'Strong'            },
                      { key: 'medium',          label: 'Medium'            },
                      { key: 'weak',            label: 'Weak'              },
                      { key: 'notMappedPct',    label: 'Unmapped %'        },
                      { key: 'progenyLinkedPct',label: 'Progeny Linked %'  },
                      { key: 'status',          label: 'Status', noSort: true },
                    ].map(({ key, label, noSort }) => (
                      <th key={key} onClick={() => !noSort && handleSort(key)}
                        style={{ padding: '8px 10px', textAlign: key === 'ward' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: sortKey === key ? '#fbbf24' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: noSort ? 'default' : 'pointer', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)', userSelect: 'none' }}>
                        {label}{!noSort && <SortArrow col={key} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWards.map((w, i) => {
                    const sCfg = statusConfig[w.status] || statusConfig['MOD GAP'];
                    return (
                      <tr key={w.ward} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px', minWidth: 24, textAlign: 'center' }}>{w.ward}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{w.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{w.total.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#a78bfa' }}>{w.base2002.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{w.strong.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f59e0b' }}>{w.medium.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f87171' }}>{w.weak.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{ color: w.notMappedPct > 0.35 ? '#f87171' : w.notMappedPct > 0.28 ? '#fbbf24' : '#10b981', fontWeight: 700 }}>
                            {(w.notMappedPct*100).toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{ color: w.progenyLinkedPct > 0.30 ? '#10b981' : w.progenyLinkedPct > 0.22 ? '#fbbf24' : '#f87171', fontWeight: 700 }}>
                            {(w.progenyLinkedPct*100).toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: sCfg.color, background: sCfg.bg, border: `1px solid ${sCfg.border}`, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                            {sCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ GENERATIONS TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'generations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
              83,997 progeny voters classified by age band into estimated genealogical generation
            </div>

            {/* Generation bars */}
            {GENERATION_DATA.map((g, i) => (
              <div key={g.gen} style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${g.color}22`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: g.color, marginBottom: 3 }}>{g.gen}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{g.desc}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: g.color }}>{g.count.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{g.pct.toFixed(1)}% of progeny</div>
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${g.pct}%`, height: '100%', background: g.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}

            {/* Sample family trees */}
            <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Representative Family Snapshots — from 5-Household Sample
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'KAMATH Family',       community: 'GSB', ward: 41, house: '11-10-993', ancestors: 10, originals: 7, progeny: 4, total: 21 },
                  { name: 'SHENOY Family',        community: 'GSB', ward: 27, house: '7-2-159',   ancestors: 12, originals: 6, progeny: 5, total: 23 },
                  { name: 'B.HASANABBA Family',   community: 'Muslim', ward: 57, house: '21-4-385', ancestors: 11, originals: 7, progeny: 19, total: 37 },
                ].map(f => (
                  <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#a78bfa', display: 'inline-flex' }}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 7.5L8 2l6 5.5"/>
                            <path d="M3.5 6.5V14h3.5v-3.5h2V14H13V6.5"/>
                          </svg>
                        </span>
                        {f.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                        {f.community} · House {f.house} · Ward {f.ward}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { val: f.ancestors, lbl: 'Ancestors', color: '#f59e0b' },
                        { val: f.originals, lbl: 'Originals', color: '#22d3ee' },
                        { val: f.progeny,   lbl: 'Progeny',   color: '#10b981' },
                        { val: f.total,     lbl: 'Total',     color: '#a78bfa' },
                      ].map(({ val, lbl, color }) => (
                        <div key={lbl} style={{ textAlign: 'center', minWidth: 46 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color }}>{val}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


      </div>
    </div>

    {/* Progeny Voter List Modal */}
    {showVoterList && <ProgenyVoterListModal onClose={() => setShowVoterList(false)} />}
    </>
  );
}

// ─── DK SIR Verification — external redirect button ───────────────────────────
// Replaces the in-app "Instant SIR Check" tool with a button that sends the
// user to the external DK SIR verification site.
function DKSIRVerificationButton() {
  return (
    <div style={{
      background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:16, padding: isMobile ? 20 : 28, marginBottom:8,
      display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:14,
    }}>
      <div style={{
        width:48, height:48, borderRadius:12, flexShrink:0,
        background:'linear-gradient(135deg,#d97706,#f59e0b)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 20px rgba(245,158,11,0.35)', color:'#fff8e1',
      }}>
        <Icon.SIR />
      </div>
      <div>
        <div style={{ fontSize:16, fontWeight:800, color:'var(--text-1)', marginBottom:4, letterSpacing:'-0.2px' }}>
          Instant SIR Check
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', maxWidth:420, lineHeight:1.6 }}>
          Cross-reference a voter across the 2002 &amp; 2025 rolls using the DK SIR verification tool
        </div>
      </div>
      <a
        href="https://sir-dk-api-nbb2.onrender.com/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'linear-gradient(135deg,#d97706,#f59e0b)',
          color:'#fff', fontWeight:700, fontSize:13,
          borderRadius:10, padding:'11px 24px',
          textDecoration:'none', boxShadow:'0 4px 18px rgba(245,158,11,0.3)',
          transition:'transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
      >
        Open DK SIR Verification
        <Icon.ArrowRight />
      </a>
    </div>
  );
}

// ─── Voter-record drill-down dialog — shared by the SIR discrepancy dashboards ─
// Clicking a PU/PM/UM/UU cell opens this and fetches the real voter rows
// behind that number from /api/sir/discrepancy-records/ (backed by the
// 'Wardwise Priority Mapped Voter Lists' import). Follows this file's own
// established fetch pattern (raw fetch + cc_token bearer header) rather than
// client.js's sirApi, matching every other call already in Sir.jsx.
const CATEGORY_LABELS = { PM: 'Polled & Mapped', PU: 'Polled & Unmapped', UM: 'Unpolled & Mapped', UU: 'Unpolled & Unmapped' };

function RecordsDialog({ drill, onClose }) {
  const [records, setRecords] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 25;

  useEffect(() => { setPage(1); }, [drill?.ward, drill?.category]);

  useEffect(() => {
    if (!drill) return;
    setLoading(true);
    const token = sessionStorage.getItem('cc_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const params = new URLSearchParams({ page, limit });
    if (drill.ward != null) params.set('ward', drill.ward);
    if (drill.category) params.set('category', drill.category);
    fetch(`${API}/sir/discrepancy-records/?${params}`, { credentials: 'include', headers })
      .then(r => r.json())
      .then(j => { if (j.success) { setRecords(j.records || []); setTotal(j.total || 0); } })
      .catch(() => { setRecords([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [drill, page]);

  if (!drill) return null;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#0d1528', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, maxWidth: 980, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>
              {drill.wardName}{drill.category ? ` — ${CATEGORY_LABELS[drill.category]}` : ' — All categories'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{total.toLocaleString()} voter{total === 1 ? '' : 's'}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 28, height: 28, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
          ) : records.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No records found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: '#0d1528' }}>
                  {['Booth', 'EPIC', 'Elector Name', 'Age', 'Gender', 'House / Address', 'Relation', 'Relative Name', 'Reason', '2023 Poll', 'SIR Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{r['Booth No']}</td>
                    <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{r['EPIC Number']}</td>
                    <td style={{ padding: '7px 10px', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>{r['Elector Name']}</td>
                    <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{r['Age']}</td>
                    <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{r['Gender']}</td>
                    <td style={{ padding: '7px 10px', color: 'rgba(255,255,255,0.4)', maxWidth: 160 }}>{r['House No / Address']}</td>
                    <td style={{ padding: '7px 10px', color: 'rgba(255,255,255,0.4)' }}>{r['Relation']}</td>
                    <td style={{ padding: '7px 10px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{r['Relative Name']}</td>
                    <td style={{ padding: '7px 10px', color: '#fbbf24', fontSize: 10, whiteSpace: 'nowrap' }}>{r['Reason for Discrepancy']}</td>
                    <td style={{ padding: '7px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{r['2023 Poll Status']}</td>
                    <td style={{ padding: '7px 10px', color: r['SIR Mapping Status'] === 'MAPPED' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>{r['SIR Mapping Status']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: page <= 1 ? 'rgba(255,255,255,0.2)' : '#e2e8f0', cursor: page <= 1 ? 'default' : 'pointer' }}>← Prev</button>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: page >= totalPages ? 'rgba(255,255,255,0.2)' : '#e2e8f0', cursor: page >= totalPages ? 'default' : 'pointer' }}>Next →</button>
        </div>
      </div>
    </div>
  );
}

// ─── SIR 2026 Discrepancy Analysis — from 3 uploaded Excel reports ────────────
function SIRDiscrepancyDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | wards | political
  const [sortKey, setSortKey] = useState('totalDiscrepancy');
  const [sortDir, setSortDir] = useState('desc');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [drill, setDrill] = useState(null); // { ward, wardName, category } | null — opens RecordsDialog

  const comboToCategory = { 'Polled & Mapped': 'PM', 'Polled & Unmapped': 'PU', 'Unpolled & Mapped': 'UM', 'Unpolled & Unmapped': 'UU' };
  const openDrill = (ward, wardName, comboLabel) => setDrill({ ward, wardName, category: comboLabel ? comboToCategory[comboLabel] : null });

  const comboColor = {
    'Polled & Mapped':     { color: '#10b981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)'  },
    'Polled & Unmapped':   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'    },
    'Unpolled & Mapped':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)'  },
    'Unpolled & Unmapped': { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)'  },
  };

  const BOOTH_CATEGORIES = ['ALL', ...SIR_BY_BOOTH_CATEGORY.map(c => c.category)];

  const filteredWards = SIR_DISCREPANCY_WARDS
    .filter(w => categoryFilter === 'ALL' || w.boothCategory === categoryFilter)
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortArrow = ({ col }) => (
    <span style={{ fontSize: 9, marginLeft: 3, opacity: sortKey === col ? 1 : 0.3 }}>
      {sortKey === col ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
    </span>
  );

  const TABS = [
    { key: 'overview',  label: 'Overview'              },
    { key: 'wards',     label: 'Ward Breakdown'        },
    { key: 'political', label: 'Political Correlation' },
  ];

  const overall = SIR_DISCREPANCY_SUMMARY.overall;
  const overallTotal = overall.polledMapped + overall.polledUnmapped + overall.unpolledMapped + overall.unpolledUnmapped;

  const RollupTable = ({ rows, keyField, keyLabel }) => (
    <div style={{ overflowX: 'auto', marginBottom: 18 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[keyLabel, 'Wards', 'BJP Poll %', 'Cong Poll %', 'Total Disc.', 'Polled&Mapped %', 'Polled&Unmapped %', 'Unpolled&Mapped %', 'Unpolled&Unmapped %'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: h === keyLabel ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[keyField]} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#e2e8f0' }}>{r[keyField]}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.wardCount}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fb923c' }}>{r.bjpPollingPct}%</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#60a5fa' }}>{r.congressPollingPct}%</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.totalDiscrepancy.toLocaleString()}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: comboColor['Polled & Mapped'].color, fontWeight: r.dominantCombo === 'Polled & Mapped' ? 800 : 400 }}>{r.polledMappedPct}%</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: comboColor['Polled & Unmapped'].color, fontWeight: r.dominantCombo === 'Polled & Unmapped' ? 800 : 400 }}>{r.polledUnmappedPct}%</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: comboColor['Unpolled & Mapped'].color, fontWeight: r.dominantCombo === 'Unpolled & Mapped' ? 800 : 400 }}>{r.unpolledMappedPct}%</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: comboColor['Unpolled & Unmapped'].color, fontWeight: r.dominantCombo === 'Unpolled & Unmapped' ? 800 : 400 }}>{r.unpolledUnmappedPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(145deg,rgba(12,18,42,0.97),rgba(8,12,28,0.99))',
      border: '1px solid rgba(245,158,11,0.18)',
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 20,
      boxShadow: '0 6px 32px rgba(0,0,0,0.4)',
    }}>
      {/* ── Panel Header ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(245,158,11,0.09),rgba(99,102,241,0.06))',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        padding: '16px 20px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 13L6 3l4 6 2-3 2 7"/>
                  <path d="M1 13h14"/>
                </svg>
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.3px' }}>
                SIR 2026 Discrepancy Analysis
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '2px 9px' }}>
                2023 → SIR 2026
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', paddingLeft: 26 }}>
              AC 203 Mangalore City South · voters matched against 2025 master list, cross-referenced with 2023 poll status
            </div>
          </div>
          {/* Top-level KPIs strip */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { val: SIR_DISCREPANCY_SUMMARY.totalDiscrepancy.toLocaleString(), lbl: 'Discrepancy Records', color: '#f59e0b'  },
              { val: SIR_DISCREPANCY_SUMMARY.matchedToWard.toLocaleString(),    lbl: 'Matched to Ward',     color: '#22d3ee'  },
              { val: SIR_DISCREPANCY_SUMMARY.notFoundInMaster.toLocaleString(), lbl: 'Not in Master List',  color: '#ef4444'  },
              { val: SIR_DISCREPANCY_SUMMARY.distinctWards,                    lbl: 'Wards Covered',       color: '#a78bfa'  },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.25)', border: `1px solid ${color}28`, borderRadius: 10, padding: '6px 13px', minWidth: 90 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Row ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', background: active ? 'rgba(245,158,11,0.08)' : 'transparent',
              border: 'none', borderBottom: active ? '2px solid #fbbf24' : '2px solid transparent',
              color: active ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: active ? 700 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 18 }}>
        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
              Overall category breakdown across {overallTotal.toLocaleString()} matched voters (2023 poll status × SIR mapping status)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Polled & Mapped',     n: overall.polledMapped,     note: 'Voted in 2023, correctly retained' },
                { label: 'Polled & Unmapped',   n: overall.polledUnmapped,   note: 'Voted in 2023, NOT mapped to 2025 list' },
                { label: 'Unpolled & Mapped',   n: overall.unpolledMapped,   note: 'Mapped, but did not vote in 2023' },
                { label: 'Unpolled & Unmapped', n: overall.unpolledUnmapped, note: 'Neither polled nor mapped' },
              ].map(({ label, n, note }) => {
                const cfg = comboColor[label];
                const pct = ((n / overallTotal) * 100).toFixed(1);
                return (
                  <div key={label} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: cfg.color, margin: '4px 0' }}>{n.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>({pct}%)</span></div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>{note}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              "Polled & Unmapped" — voters with a 2023 polling record who did not cleanly map onto the 2025 master list —
              is the dominant category in 36 of 38 wards. This is an AI-assisted data-quality signal, not a determination
              about any individual voter's eligibility.
            </div>
          </div>
        )}

        {/* ══ WARD BREAKDOWN TAB ═══════════════════════════════════════════════ */}
        {activeTab === 'wards' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {BOOTH_CATEGORIES.map(c => {
                const active = categoryFilter === c;
                const count = c === 'ALL' ? SIR_DISCREPANCY_WARDS.length : SIR_DISCREPANCY_WARDS.filter(w => w.boothCategory === c).length;
                return (
                  <button key={c} onClick={() => setCategoryFilter(c)} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer',
                    background: active ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? '#fbbf24' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s',
                  }}>
                    {c} ({count})
                  </button>
                );
              })}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                Click column headers to sort · click Total/% cells to view voter records
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {[
                      { key: 'ward',                 label: 'Ward'          },
                      { key: 'boothCategory',        label: 'Category', noSort: true },
                      { key: 'totalDiscrepancy',     label: 'Total Disc.'  },
                      { key: 'polledMappedPct',      label: 'Polled & Mapped %'    },
                      { key: 'polledUnmappedPct',    label: 'Polled & Unmapped %'  },
                      { key: 'unpolledMappedPct',    label: 'Unpolled & Mapped %'  },
                      { key: 'unpolledUnmappedPct',  label: 'Unpolled & Unmapped %'},
                      { key: 'dominantCombo',        label: 'Dominant', noSort: true },
                    ].map(({ key, label, noSort }) => (
                      <th key={key} onClick={() => !noSort && handleSort(key)}
                        style={{ padding: '8px 10px', textAlign: key === 'ward' || key === 'boothCategory' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: sortKey === key ? '#fbbf24' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: noSort ? 'default' : 'pointer', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)', userSelect: 'none' }}>
                        {label}{!noSort && <SortArrow col={key} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWards.map((w, i) => {
                    const dCfg = comboColor[w.dominantCombo] || comboColor['Unpolled & Unmapped'];
                    return (
                      <tr key={w.ward} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px', minWidth: 24, textAlign: 'center' }}>{w.ward}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{w.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 10.5, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{w.boothCategory}</td>
                        <td onClick={() => openDrill(w.ward, w.name, null)} title="View all voter records for this ward" style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{w.totalDiscrepancy.toLocaleString()}</td>
                        <td onClick={() => openDrill(w.ward, w.name, 'Polled & Mapped')} title="View Polled & Mapped voter records" style={{ padding: '8px 10px', textAlign: 'right', color: comboColor['Polled & Mapped'].color, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{w.polledMappedPct}%</td>
                        <td onClick={() => openDrill(w.ward, w.name, 'Polled & Unmapped')} title="View Polled & Unmapped voter records" style={{ padding: '8px 10px', textAlign: 'right', color: comboColor['Polled & Unmapped'].color, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{w.polledUnmappedPct}%</td>
                        <td onClick={() => openDrill(w.ward, w.name, 'Unpolled & Mapped')} title="View Unpolled & Mapped voter records" style={{ padding: '8px 10px', textAlign: 'right', color: comboColor['Unpolled & Mapped'].color, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{w.unpolledMappedPct}%</td>
                        <td onClick={() => openDrill(w.ward, w.name, 'Unpolled & Unmapped')} title="View Unpolled & Unmapped voter records" style={{ padding: '8px 10px', textAlign: 'right', color: comboColor['Unpolled & Unmapped'].color, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{w.unpolledUnmappedPct}%</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: dCfg.color, background: dCfg.bg, border: `1px solid ${dCfg.border}`, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                            {w.dominantCombo}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ POLITICAL CORRELATION TAB ═════════════════════════════════════════ */}
        {activeTab === 'political' && (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
              2023 poll/mapping status rolled up by ward political context — AI-assisted data-quality analytics, not a
              targeting instruction.
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '14px 0 6px' }}>By 2023 booth categorization</div>
            <RollupTable rows={SIR_BY_BOOTH_CATEGORY} keyField="category" keyLabel="Category" />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '14px 0 6px' }}>By 2023 turnout tier</div>
            <RollupTable rows={SIR_BY_TURNOUT} keyField="turnoutTier" keyLabel="Turnout Tier" />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '14px 0 6px' }}>By 2023 winning party</div>
            <RollupTable rows={SIR_BY_PARTY_WON} keyField="partyWon" keyLabel="Party Won" />
          </div>
        )}
      </div>
      <RecordsDialog drill={drill} onClose={() => setDrill(null)} />
    </div>
  );
}

// ─── Strategic Risk, Booth Targeting & Vote-Bank Model — from uploaded workbooks ─
function SIRStrategyDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | ranking | critical | demographic | votebank
  const [sortKey, setSortKey] = useState('rank');
  const [sortDir, setSortDir] = useState('asc');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [drill, setDrill] = useState(null); // { ward, wardName, category } | null — opens RecordsDialog

  const tierColor = {
    1: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
    2: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
    3: { color: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' },
    4: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)' },
  };
  const riskTierColor = {
    'EXTREME/HIGH': '#ef4444', 'MODERATE': '#f59e0b', 'LOWER RISK': '#10b981',
  };
  const popTierColor = {
    EXCELLENT: '#a78bfa', STRONG: '#818cf8', AVG: '#60a5fa', WEAK: '#94a3b8', VLOW: 'rgba(255,255,255,0.25)',
  };

  const sortedRanking = [...SIR_RISK_RANKING]
    .filter(w => tierFilter === 'ALL' || w.tier === tierFilter)
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'string') return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const SortArrow = ({ col }) => (
    <span style={{ fontSize: 9, marginLeft: 3, opacity: sortKey === col ? 1 : 0.3 }}>
      {sortKey === col ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
    </span>
  );

  const TABS = [
    { key: 'overview',     label: 'Overview' },
    { key: 'ranking',      label: 'Ward Priority Ranking' },
    { key: 'critical',     label: 'Critical Wards & Booths' },
    { key: 'demographic',  label: 'Demographic Profile' },
    { key: 'votebank',     label: 'Vote-Bank Model' },
  ];

  const CaveatsPanel = () => (
    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 12, marginTop: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
        Assumptions &amp; caveats — read before acting on any figure below
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SIR_STRATEGY_CAVEATS.map((c, i) => (
          <li key={i} style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{c}</li>
        ))}
      </ul>
    </div>
  );

  const VoteBankTable = ({ rows, total, label }) => (
    <div style={{ overflowX: 'auto', marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '10px 0 6px' }}>{label}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['Community', '2023 Pop.', 'Low (2023)', 'Mid (2023)', 'High (2023)', 'Composition % (Mid)', 'Mid (2028 proj.)'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Community' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.community} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#e2e8f0' }}>{r.community}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.pop2023.toLocaleString()}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.low2023.toLocaleString()}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 700 }}>{r.mid2023.toLocaleString()}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.high2023.toLocaleString()}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#22d3ee' }}>{r.compositionPctMid}%</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.mid2028.toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '8px 10px', fontWeight: 800, color: '#fbbf24' }}>Total pool</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 800 }}>{total.pop2023.toLocaleString()}</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 800 }}>{total.low2023.toLocaleString()}</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 800 }}>{total.mid2023.toLocaleString()}</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 800 }}>{total.high2023.toLocaleString()}</td>
            <td />
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 800 }}>{total.mid2028.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(145deg,rgba(12,18,42,0.97),rgba(8,12,28,0.99))',
      border: '1px solid rgba(99,102,241,0.18)',
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 20,
      boxShadow: '0 6px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg,rgba(99,102,241,0.09),rgba(245,158,11,0.06))',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        padding: '16px 20px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5"/>
                  <path d="M8 4.5v4l2.5 1.5"/>
                </svg>
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#a5b4fc', letterSpacing: '-0.3px' }}>
                Strategic Risk &amp; Vote-Bank Model
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '2px 9px' }}>
                PLANNING ANALYTICS
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', paddingLeft: 26 }}>
              SIR mapping status × 2018→2023 swing × booth targeting × demographic profile, all 38 wards
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { val: SIR_STRATEGY_SUMMARY.bjpHeldWardsAnalysed,          lbl: 'BJP Wards Scored',   color: '#a5b4fc' },
              { val: SIR_STRATEGY_SUMMARY.totalPolledUnmappedAtRisk.toLocaleString(), lbl: 'PU Pool (BJP wards)', color: '#f59e0b' },
              { val: SIR_STRATEGY_SUMMARY.estimatedVotesAtRisk.toLocaleString(), lbl: 'Est. Votes at Risk', color: '#ef4444' },
              { val: SIR_STRATEGY_SUMMARY.criticalWardCount,             lbl: 'Critical Wards',     color: '#ef4444' },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.25)', border: `1px solid ${color}28`, borderRadius: 10, padding: '6px 13px', minWidth: 90 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 1 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', background: active ? 'rgba(99,102,241,0.08)' : 'transparent',
              border: 'none', borderBottom: active ? '2px solid #a5b4fc' : '2px solid transparent',
              color: active ? '#a5b4fc' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: active ? 700 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 18 }}>
        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 4 }}>
              All 38 wards were screened by SIR-mapping/poll status; the 25 BJP-held wards were additionally scored by
              risk ratio and 2018→2023 swing. A separate demographic profile (Hindu/minority population tier) was then
              cross-checked against those same wards — see the headline findings below for where that pattern does,
              and does not, actually hold.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
              {SIR_HEADLINE_FINDINGS.map((f, i) => (
                <div key={i} style={{ background: 'rgba(165,180,252,0.06)', border: '1px solid rgba(165,180,252,0.18)', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#a5b4fc', marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{f.body}</div>
                </div>
              ))}
            </div>
            <CaveatsPanel />
          </div>
        )}

        {/* ══ WARD PRIORITY RANKING ═════════════════════════════════════════════ */}
        {activeTab === 'ranking' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {[1, 2, 3, 4].map(t => {
                const active = tierFilter === t;
                const cfg = tierColor[t];
                const count = SIR_RISK_RANKING.filter(w => w.tier === t).length;
                return (
                  <button key={t} onClick={() => setTierFilter(active ? 'ALL' : t)} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer',
                    background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                    color: active ? cfg.color : 'rgba(255,255,255,0.4)',
                  }}>
                    TIER {t} ({count})
                  </button>
                );
              })}
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Click column headers to sort</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {[
                      { key: 'rank',                  label: '#' },
                      { key: 'ward',                  label: 'Ward' },
                      { key: 'total',                 label: 'Total' },
                      { key: 'polledUnmapped',        label: 'PU' },
                      { key: 'puPct',                 label: 'PU %' },
                      { key: 'margin2023',            label: '2023 Margin (votes)' },
                      { key: 'swing20182023',         label: '2018→23 Swing (pp)' },
                      { key: 'riskRatio',             label: 'Risk Ratio' },
                      { key: 'tierLabel',             label: 'Priority Tier', noSort: true },
                    ].map(({ key, label, noSort }) => (
                      <th key={key} onClick={() => !noSort && handleSort(key)}
                        style={{ padding: '8px 10px', textAlign: ['ward'].includes(key) ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: sortKey === key ? '#a5b4fc' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: noSort ? 'default' : 'pointer', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)', userSelect: 'none' }}>
                        {label}{!noSort && <SortArrow col={key} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRanking.map((w, i) => {
                    const cfg = tierColor[w.tier];
                    return (
                      <tr key={w.ward} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.3)' }}>{w.rank}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px', minWidth: 24, textAlign: 'center' }}>{w.ward}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{w.name}</span>
                          </div>
                        </td>
                        <td onClick={() => setDrill({ ward: w.ward, wardName: w.name, category: null })} title="View all voter records for this ward" style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{w.total.toLocaleString()}</td>
                        <td onClick={() => setDrill({ ward: w.ward, wardName: w.name, category: 'PU' })} title="View Polled & Unmapped voter records" style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{w.polledUnmapped.toLocaleString()}</td>
                        <td onClick={() => setDrill({ ward: w.ward, wardName: w.name, category: 'PU' })} title="View Polled & Unmapped voter records" style={{ padding: '8px 10px', textAlign: 'right', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>{w.puPct}%</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{w.margin2023 !== null ? w.margin2023.toLocaleString() : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: w.swing20182023 === null ? 'rgba(255,255,255,0.2)' : w.swing20182023 < 0 ? '#ef4444' : '#10b981' }}>{w.swing20182023 !== null ? `${w.swing20182023 > 0 ? '+' : ''}${w.swing20182023}` : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: cfg.color, fontWeight: w.riskRatio !== null ? 700 : 400 }}>{w.riskRatio !== null ? w.riskRatio.toFixed(2) : '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>{w.tierLabel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {SIR_RISK_RANKING_NOTES.map((n, i) => (
                <div key={i} style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{n}</div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CRITICAL WARDS & BOOTHS ═══════════════════════════════════════════ */}
        {activeTab === 'critical' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              The 5 critical wards — BJP defense pool vs. Congress votes needed to flip, with risk-type split out
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {SIR_CRITICAL_WARDS.map(w => (
                <div key={w.name} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#e2e8f0' }}>{w.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: popTierColor[w.minorityTier], background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 7px' }}>Minority: {w.minorityTier}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, borderRadius: 5, padding: '2px 7px',
                      color: w.riskType.startsWith('Non-demographic') ? '#fbbf24' : '#a5b4fc',
                      background: w.riskType.startsWith('Non-demographic') ? 'rgba(245,158,11,0.1)' : 'rgba(165,180,252,0.1)',
                    }}>{w.riskType}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'rgba(255,255,255,0.3)' }}>
                      Margin {w.margin2023Pct} ({w.margin2023Votes} votes) · Swing {w.swing20182023 > 0 ? '+' : ''}{w.swing20182023}pp
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>BJP defense: </span>{w.bjpAction}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>Congress opportunity: </span>{w.congressNote}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              Ward prioritization matrix — defense (SIR risk) + offense (fragmentation), consolidated
            </div>
            <div style={{ overflowX: 'auto', marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Ward', 'SIR Risk', 'At-Risk Pool (PU)', 'Frag.-Secured Booths', 'Genuine-Target Booths', 'Recommendation'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Ward' || h === 'Recommendation' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIR_WARD_PRIORITIZATION.map((w, i) => (
                    <tr key={w.ward} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>{w.ward}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 5, padding: '2px 7px' }}>{w.sirRiskFlag}</span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{w.atRiskPoolPU}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10b981' }}>{w.fragmentationSecuredBooths}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: w.genuineTargetBooths > 0 ? '#fbbf24' : '#94a3b8' }}>{w.genuineTargetBooths}</td>
                      <td style={{ padding: '8px 10px', fontSize: 10, color: 'rgba(255,255,255,0.4)', maxWidth: 260 }}>{w.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
              {SIR_WARD_PRIORITIZATION_ACTION_PLAN.map((a, i) => (
                <div key={i} style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{i + 1}. </span>{a}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              Booth-level targeting inside those wards ({SIR_BOOTH_TARGETING.length} booths) — Congress-leaning booths
              carry the community vote-bank overlay from the source model; BJP-heavy booths do not.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Ward', 'Booth', 'Voters', 'BJP %', 'Congress %', 'Margin (pp)', 'Priority', 'Congress Risk Tier', 'Flips At', 'BJP Resource Guidance', 'Extra Votes Needed'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: ['Ward'].includes(h) ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIR_BOOTH_TARGETING.map((b, i) => {
                    const isLeaning = b.priority === 'Congress-leaning';
                    const tc = riskTierColor[b.congressRiskTier];
                    return (
                      <tr key={`${b.ward}-${b.booth}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{b.ward}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#e2e8f0', fontWeight: 600 }}>{b.booth}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{b.totalVoters.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fb923c' }}>{b.bjpPct}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#60a5fa' }}>{b.congressPct}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: b.marginPp < 0 ? '#60a5fa' : '#fb923c' }}>{b.marginPp > 0 ? '+' : ''}{b.marginPp}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: isLeaning ? '#60a5fa' : '#fb923c', background: isLeaning ? 'rgba(96,165,250,0.1)' : 'rgba(251,146,60,0.08)', borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap' }}>
                            {b.priority}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: tc || 'rgba(255,255,255,0.2)', fontWeight: tc ? 700 : 400, whiteSpace: 'nowrap' }}>
                          {b.congressRiskTier || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.4)', maxWidth: 180, whiteSpace: 'nowrap' }}>
                          {b.flipsAt || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.4)', maxWidth: 220 }}>
                          {b.bjpResourceGuidance || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: b.bjpExtraVotesNeeded > 0 ? '#fbbf24' : 'rgba(255,255,255,0.2)', fontWeight: b.bjpExtraVotesNeeded > 0 ? 700 : 400 }}>
                          {b.bjpExtraVotesNeeded !== undefined ? b.bjpExtraVotesNeeded : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <CaveatsPanel />
          </div>
        )}

        {/* ══ DEMOGRAPHIC PROFILE ═══════════════════════════════════════════════ */}
        {activeTab === 'demographic' && (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 12 }}>
              All 38 wards' Hindu/minority population tier, cross-referenced with 2023 political status and SIR risk.
              Qualitative tiers (EXCELLENT/STRONG/AVG/WEAK/VLOW) come from the constituency's existing community-
              composition data — not a new count. Use the notes column to see where the demographic pattern actually
              explains a ward's result and where it doesn't (e.g. Bengre, Kadri South).
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Ward', 'Hindu Tier', 'Minority Tier', 'Category', 'Party Won', 'Margin %', 'Swing (pp)', 'PU', 'Note'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Ward' || h === 'Note' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIR_WARD_DEMOGRAPHIC_PROFILE.map((w, i) => (
                    <tr key={w.ward} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px', minWidth: 24, textAlign: 'center' }}>{w.ward}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{w.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: popTierColor[w.hinduTier], fontWeight: 700 }}>{w.hinduTier}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: popTierColor[w.minorityTier], fontWeight: 700 }}>{w.minorityTier}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{w.category}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: w.partyWon === 'BJP' ? '#fb923c' : '#60a5fa', fontWeight: 700 }}>{w.partyWon}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: w.margin2023Pct.startsWith('-') ? '#60a5fa' : '#fb923c' }}>{w.margin2023Pct}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: w.swing20182023 < 0 ? '#ef4444' : '#10b981' }}>{w.swing20182023 > 0 ? '+' : ''}{w.swing20182023}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{w.pu}</td>
                      <td style={{ padding: '8px 10px', fontSize: 10, color: 'rgba(255,255,255,0.35)', maxWidth: 220 }}>{w.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CaveatsPanel />
          </div>
        )}

        {/* ══ VOTE-BANK MODEL ═══════════════════════════════════════════════════ */}
        {activeTab === 'votebank' && (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 4 }}>
              Constituency-wide population by community (user-supplied), and the resulting modelled vote pool for each
              party under the voting-behaviour assumptions below. Population grows ~{SIR_POPULATION_GROWTH_PCT}% uniformly
              across all three communities in the 2023→2028 projection, so community <em>share</em> of the pool does not
              shift on its own — only the absolute pool size grows.
            </div>

            <div style={{ overflowX: 'auto', margin: '14px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, maxWidth: 480 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Community', '2023 Population', '2028 Projected'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Community' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', background: 'rgba(0,0,0,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIR_COMMUNITY_POPULATION.map(p => (
                    <tr key={p.community} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#e2e8f0' }}>{p.community}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{p.pop2023.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{p.pop2028.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <VoteBankTable rows={SIR_VOTE_BANK_CONGRESS} total={SIR_VOTE_BANK_CONGRESS_TOTAL} label="Estimated Congress vote pool" />
            <VoteBankTable rows={SIR_VOTE_BANK_BJP} total={SIR_VOTE_BANK_BJP_TOTAL} label="Estimated BJP vote pool" />

            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '18px 0 6px' }}>
              Modelled vote pools, reality-checked against the actual 2023 result
            </div>
            <div style={{ overflowX: 'auto', marginBottom: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Party / Pool', '2023 Raw Potential', '2023 Turnout-Adj.', '2023 ACTUAL', '2028 Raw Potential', '2028 Turnout-Adj.', 'Growth (turnout-adj.)'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Party / Pool' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIR_VOTE_POOL_MODEL.map(r => (
                    <tr key={r.pool} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#e2e8f0' }}>{r.pool}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.raw2023.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.turnoutAdj2023.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 700 }}>{r.actual2023 !== null ? r.actual2023.toLocaleString() : 'n/a (not separately contested)'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.raw2028.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{r.turnoutAdj2028.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#22d3ee', fontWeight: 700 }}>+{r.growth.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(239,68,68,0.7)', lineHeight: 1.55, marginBottom: 14 }}>
              GAP CHECK: {SIR_VOTE_POOL_GAP_NOTE}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '14px 0 6px' }}>Voting-behaviour assumptions used above</div>
            <div style={{ overflowX: 'auto', marginBottom: 4 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Community', 'Splits To', 'Low %', 'Mid %', 'High %', 'Basis'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: ['Low %', 'Mid %', 'High %'].includes(h) ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIR_STRATEGY_ASSUMPTIONS.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#e2e8f0' }}>{a.community}</td>
                      <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{a.splitsTo}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{a.low}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 700 }}>{a.mid}%</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{a.high}%</td>
                      <td style={{ padding: '8px 10px', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{a.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CaveatsPanel />
          </div>
        )}
      </div>
      <RecordsDialog drill={drill} onClose={() => setDrill(null)} />
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

        {/* AI Overview — SIR Intelligence (ShaastraAI) */}
        <SIRAIOverview />

        {/* DK SIR verification — redirects out to the external checker */}
        <DKSIRVerificationButton />

        {/* Confirmed matches / not-found panel */}
        <ConfirmedMatchesPanel />

        {/* SIR Risk Wards — Political Intelligence */}
        <RiskWardsOverview />

        {/* All Wards Heatmap */}
        <AllWardsHeatmap />

        {/* Progeny Family Tree Intelligence — from Excel report */}
        <ProgenyAnalysisDashboard />

        {/* SIR 2026 Discrepancy Analysis — from 3 uploaded Excel reports */}
        <SIRDiscrepancyDashboard />

        {/* Strategic Risk, Booth Targeting & Vote-Bank Model — from 3 uploaded workbooks */}
        <SIRStrategyDashboard />

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
        .sim-slider { -webkit-appearance: none; appearance: none; }
        .sim-slider::-webkit-slider-runnable-track { -webkit-appearance: none; background: transparent; height: 8px; }
        .sim-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 22px; height: 22px; border-radius: 50%;
          background: #fff; border: 3px solid #6366f1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45), 0 0 0 4px rgba(99,102,241,0.18);
          cursor: pointer; margin-top: -7px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .sim-slider::-webkit-slider-thumb:hover,
        .sim-slider::-webkit-slider-thumb:active { transform: scale(1.18); box-shadow: 0 2px 10px rgba(0,0,0,0.5), 0 0 0 6px rgba(99,102,241,0.22); }
        .sim-slider::-moz-range-track { background: transparent; height: 8px; border: none; }
        .sim-slider::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: #fff; border: 3px solid #6366f1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
          cursor: pointer; transition: transform 0.15s ease;
        }
        .sim-slider::-moz-range-thumb:hover { transform: scale(1.18); }
        .sim-slider:focus { outline: none; }
        .sim-slider:focus::-webkit-slider-thumb { box-shadow: 0 2px 8px rgba(0,0,0,0.45), 0 0 0 6px rgba(99,102,241,0.3); }
      `}</style>
    </div>
  );
}