import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Navbar from '../components/Navbar';
import { dashboardApi } from '../api/client';
import api from '../api/client';
import { useAuth } from '../App';

const COLORS = ['#f59e0b', '#22d3ee', '#10b981', '#8b5cf6', '#ec4899', '#f97316'];

// ─── DATA CONSTANTS (unchanged) ──────────────────────────────────────────────
const WARD_FULL_DATA = {
  21: { name: 'PADAVU',              booths: [31, 32, 33, 55, 56, 57, 58] },
  24: { name: 'DEREBAIL SOUTH',      booths: [9, 11, 13, 17] },
  25: { name: 'DEREBAIL WEST',       booths: [1, 2, 3, 5, 6, 7, 8] },
  26: { name: 'DEREBAIL SOUTH WEST', booths: [4, 10, 89, 90, 91, 92, 94] },
  27: { name: 'BOLOOR',              booths: [82, 83, 84, 88, 93, 95, 96, 97] },
  28: { name: 'MANNAGUDDA',          booths: [12, 75, 78, 79, 80, 81, 85, 86, 87] },
  29: { name: 'KAMBLA',              booths: [68, 69, 71, 72, 73] },
  30: { name: 'KODIALBAIL',          booths: [14, 22, 24, 25, 26, 66, 67, 70] },
  31: { name: 'BEJAI',               booths: [15, 16, 18, 19, 20, 21, 23] },
  32: { name: 'KADRI NORTH',         booths: [27, 28, 29, 30, 63] },
  33: { name: 'KADRI SOUTH',         booths: [59, 61, 62, 64, 65] },
  34: { name: 'SHIVBHAG',            booths: [45, 60, 134, 135, 136, 139] },
  35: { name: 'PADAVU CENTRAL',      booths: [34, 35, 39, 40, 43, 44] },
  36: { name: 'PADAVU POORVA',       booths: [36, 37, 38, 41, 42] },
  37: { name: 'MAROLI',              booths: [48, 49, 50, 51, 52, 53, 54] },
  38: { name: 'BENDUR',              booths: [133, 138, 140, 166, 167, 171] },
  39: { name: 'FALNIR',              booths: [162, 163, 164, 165, 172, 173, 174, 175] },
  40: { name: 'COURT',               booths: [129, 130, 131, 132, 146, 147] },
  41: { name: 'CENTRAL',             booths: [124, 125, 126, 127, 128] },
  42: { name: 'DONGERKERY',          booths: [74, 76, 77, 112, 115, 117, 118] },
  43: { name: 'KUDROLI',             booths: [108, 109, 110, 111, 113, 114] },
  44: { name: 'NAVAYATH',            booths: [116, 119, 120, 121, 122, 123] },
  45: { name: 'PORT',                booths: [148, 151, 152, 153, 238, 239] },
  46: { name: 'CANTONMENT',          booths: [141, 145, 149, 150] },
  47: { name: 'MILAGRIS',            booths: [142, 143, 144, 168, 169, 170] },
  48: { name: 'VALENCIA',            booths: [137, 176, 177, 178, 187] },
  49: { name: 'KANKANADY',           booths: [179, 180, 181, 182, 183, 184, 185, 186] },
  50: { name: 'ALAPE DAKSHINA',      booths: [188, 189, 190, 191, 192, 213, 214, 215] },
  51: { name: 'ALAPE UTTARA',        booths: [46, 47, 193, 194, 195, 196, 202] },
  52: { name: 'KANNUR',              booths: [197, 198, 199, 200, 201, 203, 204, 205] },
  53: { name: 'BAJAL',               booths: [206, 207, 208, 209, 210, 211, 212] },
  54: { name: 'JEPPINAMUGER',        booths: [216, 217, 218, 219, 220, 221, 222, 223, 249] },
  55: { name: 'ATTAVARA',            booths: [154, 155, 156, 157, 226, 227, 247, 248] },
  56: { name: 'MANGALADEVI',         booths: [228, 229, 231, 232, 233] },
  57: { name: 'HOIGE BAZAR',         booths: [235, 237, 240, 244] },
  58: { name: 'BOLAR',               booths: [230, 234, 236, 241, 242, 243] },
  59: { name: 'JEPPU',               booths: [158, 159, 160, 161, 224, 225, 245, 246] },
  60: { name: 'BENGRE',              booths: [98, 99, 100, 101, 102, 103, 104, 105, 106, 107] },
};

const SIR_WARD_DATA = {
  21: { classification:'BJP STRONGHOLD', pollRate:55.7, alert:'⚠ BJP RISK', hindu:84.1, muslim:1.0,  christian:14.8, bloMapped:58.95, progeny:90.05, totalMapped:69.32, totalElectors:7542,  supervisors:'KIRAN 47-57, PURUSHOTTAM 58-68, SHWETHA 23-33', bjpProj:84.1, congProj:15.9, margin:68.2,  riskStatus:'⚠ RISK', priority:'MEDIUM'  },
  24: { classification:'BJP STRONGHOLD', pollRate:58.1, alert:'⚠ BJP RISK', hindu:80.1, muslim:2.5,  christian:17.4, bloMapped:54.67, progeny:80.04, totalMapped:57.16, totalElectors:4767,  supervisors:'RAJU S SUVRNA, SANJAY 1-11', bjpProj:80.1, congProj:19.9, margin:60.2,  riskStatus:'⚠ RISK', priority:'CRITICAL' },
  25: { classification:'BJP STRONGHOLD', pollRate:65.9, alert:'✓ OK',       hindu:85.1, muslim:0.8,  christian:14.1, bloMapped:59.87, progeny:85.34, totalMapped:67.6,  totalElectors:7314,  supervisors:'SANJAY 1-11', bjpProj:85.1, congProj:14.9, margin:70.2,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  26: { classification:'BJP STRONGHOLD', pollRate:60.4, alert:'✓ OK',       hindu:87.9, muslim:0.6,  christian:11.5, bloMapped:56.96, progeny:75.78, totalMapped:62.68, totalElectors:7801,  supervisors:'FLAVY 82-92, SANJAY 1-11, YADAVA HOSABETTU 93-104', bjpProj:87.9, congProj:12.1, margin:75.8,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  27: { classification:'BJP STRONGHOLD', pollRate:50.8, alert:'⚠ BJP RISK', hindu:87.5, muslim:1.2,  christian:11.3, bloMapped:60.61, progeny:87.02, totalMapped:68.36, totalElectors:6618,  supervisors:'FLAVY 82-92, YADAVA HOSABETTU 93-104', bjpProj:87.5, congProj:12.5, margin:75.0,  riskStatus:'⚠ RISK', priority:'MEDIUM'   },
  28: { classification:'BJP STRONGHOLD', pollRate:54.8, alert:'⚠ BJP RISK', hindu:93.7, muslim:1.1,  christian:5.2,  bloMapped:53.78, progeny:68.15, totalMapped:58.1,  totalElectors:8102,  supervisors:'FLAVY 82-92, RAJU S SUVRNA, SATHISH K 69-81', bjpProj:93.7, congProj:6.3, margin:87.4,  riskStatus:'⚠ RISK', priority:'CRITICAL' },
  29: { classification:'BJP STRONGHOLD', pollRate:57.9, alert:'⚠ BJP RISK', hindu:92.6, muslim:1.8,  christian:5.6,  bloMapped:57.64, progeny:75.09, totalMapped:63.07, totalElectors:4517,  supervisors:'PURUSHOTTAM 58-68, SATHISH K 69-81', bjpProj:92.6, congProj:7.4, margin:85.2,  riskStatus:'⚠ RISK', priority:'HIGH'     },
  30: { classification:'BJP STRONGHOLD', pollRate:62.9, alert:'✓ OK',       hindu:80.9, muslim:1.2,  christian:17.9, bloMapped:52.89, progeny:75.01, totalMapped:59.87, totalElectors:7871,  supervisors:'PURUSHOTTAM 58-68, RAJU S SUVRNA, SATHISH K 69-81, SHWETHA 23-33', bjpProj:80.9, congProj:19.1, margin:61.8,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  31: { classification:'BJP STRONG',     pollRate:58.7, alert:'⚠ BJP RISK', hindu:68.6, muslim:4.7,  christian:26.7, bloMapped:52.54, progeny:83.98, totalMapped:62.03, totalElectors:7246,  supervisors:'RAJU S SUVRNA, SHWETHA 23-33', bjpProj:68.6, congProj:31.4, margin:37.2,  riskStatus:'⚠ RISK', priority:'HIGH'     },
  32: { classification:'BJP STRONGHOLD', pollRate:54.5, alert:'⚠ BJP RISK', hindu:86.8, muslim:0.7,  christian:12.5, bloMapped:56.55, progeny:75.79, totalMapped:62.57, totalElectors:6433,  supervisors:'PURUSHOTTAM 58-68, SHWETHA 23-33', bjpProj:86.8, congProj:13.2, margin:73.6,  riskStatus:'⚠ RISK', priority:'HIGH'     },
  34: { classification:'CONTESTED (BJP Lean)', pollRate:50.2, alert:'⚠ CONG RISK', hindu:52.2, muslim:11.7, christian:36.1, bloMapped:53.38, progeny:98.08, totalMapped:67.94, totalElectors:6294, bjpProj:52.2, congProj:47.8, margin:4.4, riskStatus:'⚠ RISK', priority:'MEDIUM', supervisors:'BHARATHI 127-137' },
  40: { classification:'CONTESTED (BJP Lean)', pollRate:39.5, alert:'⚠ CONG RISK', hindu:51.0, muslim:27.7, christian:21.4, bloMapped:44.77, progeny:88.36, totalMapped:59.57, totalElectors:5980, bjpProj:51.0, congProj:49.0, margin:2.0, riskStatus:'⚠ RISK', priority:'MEDIUM', supervisors:'BHARATHI 127-137' },
  46: { classification:'BJP STRONG',     pollRate:51.2, alert:'⚠ BJP RISK', hindu:73.8, muslim:20.7, christian:5.5,  bloMapped:56.25, progeny:72.79, totalMapped:61.81, totalElectors:4095,  bjpProj:73.8, congProj:26.2, margin:47.6, riskStatus:'⚠ RISK', priority:'HIGH', supervisors:'DODDANANJAIAH 138-148' },
};

const SIR_BOOTH_DATA = {
  '21': [
    { booth:31, totalElectors:1120, bloMapped:642, progeny:1010, totalMapped:778, bloMappedPct:57.3, progenyPct:90.2, totalMappedPct:69.5 },
    { booth:32, totalElectors:1089, bloMapped:601, progeny:981, totalMapped:754, bloMappedPct:55.2, progenyPct:90.1, totalMappedPct:69.2 },
    { booth:33, totalElectors:1098, bloMapped:648, progeny:992, totalMapped:762, bloMappedPct:59.0, progenyPct:90.3, totalMappedPct:69.4 },
    { booth:55, totalElectors:1078, bloMapped:637, progeny:970, totalMapped:747, bloMappedPct:59.1, progenyPct:90.0, totalMappedPct:69.3 },
    { booth:56, totalElectors:1088, bloMapped:642, progeny:979, totalMapped:753, bloMappedPct:59.0, progenyPct:90.0, totalMappedPct:69.2 },
    { booth:57, totalElectors:1085, bloMapped:640, progeny:976, totalMapped:749, bloMappedPct:59.0, progenyPct:90.0, totalMappedPct:69.0 },
    { booth:58, totalElectors:984, bloMapped:164, progeny:346, totalMapped:685, bloMappedPct:51.7, progenyPct:90.3, totalMappedPct:69.6 },
  ],
};

const PRIORITY_CONFIG = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  label: '🔴 CRITICAL', order: 1 },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', label: '🟠 HIGH',     order: 2 },
  MEDIUM:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: '🟡 MEDIUM',   order: 3 },
  WATCH:    { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', label: '🔵 WATCH',    order: 4 },
  NORMAL:   { color: '#10b981', bg: 'rgba(16,185,129,0.06)',border: 'rgba(16,185,129,0.2)', label: '✅ NORMAL',   order: 5 },
};

const CLASSIFICATION_CONFIG = {
  'BJP STRONGHOLD':          { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  label: '🚩 BJP Stronghold' },
  'BJP STRONG':              { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  label: '🚩 BJP Strong' },
  'BJP FAVOURABLE':          { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: '🏳 BJP Favourable' },
  'CONGRESS STRONG':         { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: '✊ Congress Strong' },
  'CONGRESS FAVOURABLE':     { color: '#34d399', bg: 'rgba(52,211,153,0.1)', label: '✊ Congress Favourable' },
  'CONTESTED (BJP Lean)':    { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',label: '⚖ Contested BJP' },
  'CONTESTED (Cong Lean)':   { color: '#6ee7b7', bg: 'rgba(110,231,183,0.1)',label: '⚖ Contested INC' },
};

const WARD_NAMES = Object.fromEntries(Object.entries(WARD_FULL_DATA).map(([k, v]) => [k, v.name]));
const WARD_NUM_TO_BOOTHS = Object.fromEntries(Object.entries(WARD_FULL_DATA).map(([k, v]) => [String(k), v.booths]));
const RISK_WARD_NUMS = Object.entries(SIR_WARD_DATA).filter(([, d]) => d.priority !== 'NORMAL').map(([k]) => k);

const WARD_BOOTHS_MAP = Object.fromEntries(
  Object.entries(WARD_FULL_DATA).map(([wNum, { name, booths }]) => [name, booths])
);

// ─── MOBILE-FIRST CSS ────────────────────────────────────────────────────────
const MOBILE_STYLES = `
  :root {
    --tap-min: 48px;
    --card-radius: 16px;
    --section-gap: 16px;
    --page-pad: 14px;
    --text-xs: 11px;
    --text-sm: 13px;
    --text-base: 15px;
    --text-lg: 18px;
    --text-xl: 24px;
    --text-2xl: 32px;
  }

  .db-page { padding: 0 var(--page-pad) 100px; }

  /* Stat grid — 2 cols on phone, 3 on tablet, 6 on desktop */
  .db-stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (min-width: 480px) { .db-stat-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 820px) { .db-stat-grid { grid-template-columns: repeat(6, 1fr); } }

  /* Two column layout */
  .db-two-col {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--section-gap);
  }
  @media (min-width: 700px) { .db-two-col { grid-template-columns: 1fr 1fr; } }

  /* Header row */
  .db-header-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  @media (min-width: 600px) {
    .db-header-row { flex-direction: row; align-items: flex-start; justify-content: space-between; }
  }

  /* Card base */
  .db-card {
    background: linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98));
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: var(--card-radius);
    overflow: hidden;
  }

  /* Touch-friendly tap targets */
  .db-tap {
    min-height: var(--tap-min);
    display: flex;
    align-items: center;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  /* Stat card value — responsive font */
  .db-stat-value {
    font-size: clamp(20px, 5vw, 28px);
    font-weight: 900;
    font-family: var(--font-display);
    letter-spacing: -0.5px;
    line-height: 1;
  }

  /* Heatmap table */
  .ward-heatmap-row { transition: background 0.15s; }
  .ward-heatmap-row:active { background: rgba(255,255,255,0.06) !important; }

  /* Smooth animations */
  .db-anim { animation: dbFadeUp 0.3s ease-out both; }
  @keyframes dbFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Progress bar */
  .db-bar-track {
    height: 5px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
  }
  .db-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  /* Bottom nav safe area */
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .db-page { padding-bottom: calc(100px + env(safe-area-inset-bottom)); }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function wardByBooth(boothNo) {
  const n = parseInt(boothNo);
  if (!n) return '';
  for (const [w, bs] of Object.entries(WARD_BOOTHS_MAP)) { if (bs.includes(n)) return w; }
  return '';
}

function Skeleton({ w = '100%', h = 18, radius = 6 }) {
  return <div style={{ width: w, height: h, borderRadius: radius, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.6s ease-in-out infinite' }} />;
}

function StatCardSkeleton() {
  return (
    <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton w={36} h={36} radius={9} />
      <Skeleton w="55%" h={10} />
      <Skeleton w="70%" h={26} />
      <Skeleton w="45%" h={10} />
    </div>
  );
}

// ─── Ward Selector ────────────────────────────────────────────────────────────
function WardSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const label = value ? `Ward ${value} — ${WARD_NAMES[value] || ''}` : 'All Wards';

  const panel = open && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column' }} onClick={() => setOpen(false)}>
      <div style={{ flex: 1 }} />
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(8,14,30,0.98)', borderTop: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px 20px 0 0', maxHeight: '75vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Select Ward</span>
          <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: 'var(--text-2)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '8px 12px 20px', WebkitOverflowScrolling: 'touch' }}>
          {/* All wards option */}
          <button onClick={() => { onChange(''); setOpen(false); }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            background: !value ? 'rgba(245,158,11,0.1)' : 'transparent',
            border: !value ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
            borderRadius: 10, padding: '12px 14px', cursor: 'pointer', marginBottom: 4,
            minHeight: 48, color: !value ? '#f59e0b' : 'var(--text-2)', fontSize: 14, fontWeight: !value ? 700 : 400,
          }}>
            <span style={{ fontSize: 16 }}>🗺</span>
            <span style={{ flex: 1, textAlign: 'left' }}>All Wards</span>
            {!value && <span style={{ color: '#f59e0b' }}>✓</span>}
          </button>
          {Object.entries(WARD_FULL_DATA).sort(([a], [b]) => Number(a) - Number(b)).map(([num, { name }]) => {
            const sirD = SIR_WARD_DATA[Number(num)];
            const pCfg = sirD ? PRIORITY_CONFIG[sirD.priority] : null;
            const active = value === String(num);
            return (
              <button key={num} onClick={() => { onChange(String(num)); setOpen(false); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
                border: active ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                borderRadius: 10, padding: '12px 14px', cursor: 'pointer', marginBottom: 2,
                minHeight: 48, color: active ? '#f59e0b' : 'var(--text-2)', fontSize: 14, fontWeight: active ? 700 : 400, textAlign: 'left',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)', borderRadius: 5, padding: '2px 7px', color: active ? '#f59e0b' : 'var(--text-3)', minWidth: 30, textAlign: 'center', flexShrink: 0 }}>{num}</span>
                <span style={{ flex: 1 }}>{name}</span>
                {pCfg && sirD?.priority !== 'NORMAL' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: pCfg.color, flexShrink: 0 }} />}
                {active && <span style={{ color: '#f59e0b', fontSize: 13 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(true)} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${value ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 12, padding: '13px 16px', cursor: 'pointer', fontSize: 14,
        fontWeight: 600, minHeight: 52, color: value ? '#f59e0b' : 'var(--text-2)',
        WebkitTapHighlightColor: 'transparent',
      }}>
        <span style={{ fontSize: 18 }}>🏘</span>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>
      {open && createPortal(panel, document.body)}
    </>
  );
}

// ─── KPI Stat Card ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub, onClick, actionLabel }) {
  return (
    <div onClick={onClick} style={{
      background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))',
      border: `1px solid ${color}22`, borderRadius: 16, padding: '16px 14px',
      position: 'relative', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      WebkitTapHighlightColor: 'transparent',
      minHeight: 110,
    }}>
      {/* Glow blob */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle,${color}15 0%,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.4, maxWidth: '68%' }}>{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{icon}</div>
      </div>
      <div className="db-stat-value" style={{ color, marginBottom: 8 }}>{value ?? '—'}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500, lineHeight: 1.3 }}>{sub}</div>
        {onClick && <span style={{ fontSize: 10, color: `${color}90`, background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>View ›</span>}
      </div>
    </div>
  );
}

// ─── Coverage Meter ───────────────────────────────────────────────────────────
function CoverageMeter({ coverage, totalReg, totalVoters, label }) {
  const clampedCov = Math.min(coverage, 100);
  const color = coverage >= 70 ? '#10b981' : coverage >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 16px', position: 'relative', overflow: 'hidden' }} className="db-anim">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color} ${clampedCov}%,rgba(255,255,255,0.05) ${clampedCov}%)`, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Survey Coverage</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{label}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 34, fontWeight: 900, color, fontFamily: 'var(--font-display)', letterSpacing: '-1px', lineHeight: 1 }}>{coverage}%</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{totalReg?.toLocaleString() || 0} / {totalVoters?.toLocaleString() || 0}</div>
        </div>
      </div>
      <div className="db-bar-track">
        <div className="db-bar-fill" style={{ width: `${clampedCov}%`, background: `linear-gradient(90deg,${color}80,${color})` }} />
      </div>
    </div>
  );
}

// ─── Ward SIR Panel (political intelligence) ──────────────────────────────────
function WardSIRPanel({ wardNum }) {
  const d = SIR_WARD_DATA[Number(wardNum)];
  if (!d) return null;
  const pCfg   = PRIORITY_CONFIG[d.priority]   || PRIORITY_CONFIG.NORMAL;
  const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color: '#8899bb', bg: 'rgba(255,255,255,0.05)', label: d.classification };
  const bjpWin = d.margin > 0;
  const pollBelow = d.pollRate < 60.7;

  return (
    <div style={{ background: 'rgba(10,18,34,0.97)', border: `1px solid ${pCfg.border}`, borderRadius: 14, overflow: 'hidden', marginTop: 0 }} className="db-anim">
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${pCfg.bg},transparent)`, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>🗳 SIR Political Intel</div>
        <div style={{ background: clsCfg.bg, border: `1px solid ${clsCfg.color}40`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: clsCfg.color }}>{clsCfg.label}</div>
        <div style={{ background: pCfg.bg, border: `1px solid ${pCfg.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: pCfg.color }}>{pCfg.label}</div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Voter Turnout */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Voter Turnout</div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: pollBelow ? '#f87171' : '#10b981', fontFamily: 'var(--font-display)' }}>{d.pollRate}%</span>
              <span style={{ fontSize: 12, color: pollBelow ? '#f87171' : '#10b981', fontWeight: 700 }}>{pollBelow ? '▼' : '▲'} {Math.abs((d.pollRate - 60.7).toFixed(1))}% vs avg</span>
            </div>
            <div className="db-bar-track">
              <div style={{ position: 'relative', height: '100%' }}>
                <div className="db-bar-fill" style={{ width: `${d.pollRate}%`, background: pollBelow ? 'linear-gradient(90deg,#ef444480,#ef4444)' : 'linear-gradient(90deg,#10b98180,#10b981)' }} />
                <div style={{ position: 'absolute', left: '60.7%', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* BJP vs Congress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Political Projection</div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px' }}>
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 28, marginBottom: 12 }}>
              <div style={{ width: `${d.bjpProj}%`, background: 'linear-gradient(90deg,#f97316,#fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {d.bjpProj > 20 && <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{d.bjpProj}%</span>}
              </div>
              <div style={{ width: `${d.congProj}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {d.congProj > 20 && <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{d.congProj}%</span>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#fb923c', fontWeight: 700 }}>BJP {d.bjpProj}%</span>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 700 }}>Margin</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: bjpWin ? '#f97316' : '#10b981' }}>{bjpWin ? '+' : ''}{d.margin}%</div>
              </div>
              <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700 }}>INC {d.congProj}%</span>
            </div>
          </div>
        </div>

        {/* Community */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Community (SIR)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[{ label:'Hindu', pct:d.hindu, color:'#f97316' },{ label:'Muslim', pct:d.muslim, color:'#10b981' },{ label:'Christian', pct:d.christian, color:'#8b5cf6' }].map(({ label, pct, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 10px 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 5 }}>{pct}%</div>
                <div className="db-bar-track" style={{ marginBottom: 5 }}>
                  <div className="db-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SIR metrics */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>SIR Survey Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label:'BLO Mapped', val:d.bloMapped, threshold:60, color:'#22d3ee' },
              { label:'Progeny 18+', val:d.progeny, threshold:80, color:'#a78bfa' },
              { label:'Total Mapped', val:d.totalMapped, threshold:65, color:'#f59e0b' },
            ].map(({ label, val, threshold, color }) => {
              const ok = val >= threshold;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: ok ? color : '#f87171' }}>{val.toFixed(1)}%</span>
                      <span style={{ fontSize: 10, color: ok ? '#10b981' : '#f87171', background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>{ok ? '✓' : '⚠'}</span>
                    </div>
                  </div>
                  <div className="db-bar-track">
                    <div className="db-bar-fill" style={{ width: `${Math.min(val, 100)}%`, background: ok ? color : '#ef4444' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {d.supervisors && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Supervisors · </span>
            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{d.supervisors}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SIR Heatmap Table ────────────────────────────────────────────────────────
function SIRHeatmapTable({ onSelectWard }) {
  const wards = Object.entries(SIR_WARD_DATA).sort(([, a], [, b]) => (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9));

  return (
    <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', marginBottom: 18 }} className="db-anim">
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg,rgba(139,92,246,0.08),transparent)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#a78bfa', marginBottom: 2 }}>All Wards — SIR Heatmap</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{wards.length} wards · Tap to drill down</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ color:'#f97316', label:'BJP' },{ color:'#a78bfa', label:'Contested' },{ color:'#10b981', label:'Congress' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column headers — scrollable horizontally */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 520 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 90px 58px 50px 56px 60px 68px', gap: 4, padding: '8px 14px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {['#', 'Ward', 'Class', 'Turn%', 'BJP%', 'INC%', 'SIR%', 'Priority'].map(h => (
              <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>
          {wards.map(([wardNum, d]) => {
            const pCfg = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.NORMAL;
            const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color: '#8899bb' };
            const wName = WARD_NAMES[wardNum] || wardNum;
            return (
              <div key={wardNum} className="ward-heatmap-row db-tap" onClick={() => onSelectWard(String(wardNum))}
                style={{ display: 'grid', gridTemplateColumns: '36px 1fr 90px 58px 50px 56px 60px 68px', gap: 4, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'transparent', cursor: 'pointer', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 5px', textAlign: 'center' }}>{wardNum}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wName}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: clsCfg.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.classification.split(' ')[0]}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.pollRate < 60.7 ? '#f87171' : '#10b981' }}>{d.pollRate}%</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fb923c' }}>{d.bjpProj}%</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>{d.congProj}%</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.totalMapped < 65 ? '#f87171' : '#f59e0b' }}>{d.totalMapped.toFixed(1)}%</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: pCfg.color, background: pCfg.bg, border: `1px solid ${pCfg.border}`, borderRadius: 5, padding: '2px 7px', textAlign: 'center', display: 'inline-block' }}>{d.priority}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Booth Drill-Down ─────────────────────────────────────────────────────────
function WardBoothDrillDown({ wardNum }) {
  const booths = SIR_BOOTH_DATA[String(wardNum)];
  if (!booths?.length) return null;
  const weakBooths = booths.filter(b => b.totalMappedPct < 60);

  return (
    <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 14, overflow: 'hidden', marginTop: 14 }} className="db-anim">
      <div style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.1),transparent)', borderBottom: '1px solid rgba(34,211,238,0.12)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📋</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#22d3ee' }}>Booth-Level SIR Drill-Down</div>
          <div style={{ fontSize: 11, color: 'rgba(34,211,238,0.5)', marginTop: 1 }}>{booths.length} booths · {weakBooths.length > 0 ? `${weakBooths.length} below 60%` : 'All booths OK'}</div>
        </div>
      </div>
      {weakBooths.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.12)', padding: '10px 16px', fontSize: 12, color: '#f87171', fontWeight: 600 }}>
          ⚠ {weakBooths.length} booth{weakBooths.length > 1 ? 's' : ''} below 60% mapping: {weakBooths.map(b => b.booth).join(', ')}
        </div>
      )}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: 420 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 75px 75px 80px 68px', gap: 4, padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
            {['Booth', 'Electors', 'BLO%', 'Progeny%', 'Mapped%', 'Status'].map(h => (
              <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
            ))}
          </div>
          {booths.map(b => {
            const weak = b.totalMappedPct < 60;
            const good = b.totalMappedPct >= 75;
            return (
              <div key={b.booth} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 75px 75px 80px 68px', gap: 4, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: weak ? 'rgba(239,68,68,0.03)' : 'transparent', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#22d3ee' }}>{b.booth}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{b.totalElectors.toLocaleString()}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: b.bloMappedPct >= 60 ? '#10b981' : '#f87171' }}>{b.bloMappedPct}%</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: b.progenyPct >= 80 ? '#a78bfa' : '#f59e0b' }}>{b.progenyPct}%</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: weak ? '#f87171' : good ? '#10b981' : '#f59e0b' }}>{b.totalMappedPct}%</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: weak ? '#f87171' : good ? '#10b981' : '#f59e0b', background: weak ? 'rgba(239,68,68,0.1)' : good ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 5, padding: '3px 7px' }}>
                  {weak ? '⚠ LOW' : good ? '✓ GOOD' : '~ OK'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions() {
  const actions = [
    { to: '/survey',  label: 'Start Survey',    icon: '✎', color: '#f59e0b', desc: 'Record data' },
    { to: '/schemes', label: 'Schemes',          icon: '◈', color: '#10b981', desc: 'Eligibility' },
    { to: '/voters',  label: 'Search Voters',   icon: '◉', color: '#22d3ee', desc: 'Voter list' },
    { to: '/data',    label: 'View Data',        icon: '⊟', color: '#8b5cf6', desc: 'All records' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
      {actions.map(item => (
        <Link key={item.to} to={item.to} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px 14px',
          borderRadius: 14, background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))',
          border: `1px solid ${item.color}20`, textDecoration: 'none',
          minHeight: 68, WebkitTapHighlightColor: 'transparent',
          transition: 'border-color 0.15s',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{item.desc}</div>
          </div>
          <span style={{ color: `${item.color}60`, fontSize: 18, flexShrink: 0 }}>›</span>
        </Link>
      ))}
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({ member, wardNumber, wardName, serialStart, houseSurveyData, query, onSurveyDone, user }) {
  const navigate = useNavigate();

  const canSurvey = (() => {
    if (!user) return true;
    const role = user.role || '';
    if (!role || role === 'mla' || role === 'pa') return true;
    const hs = houseSurveyData || {};
    const bStr = String(hs.boothNo || member.booth || '');
    const resWard = (hs.wardNumber && isNaN(hs.wardNumber) ? hs.wardNumber : '') || wardByBooth(bStr) || (wardNumber && isNaN(wardNumber) ? wardNumber : '') || '';
    if (role === 'corporator') return String(user.ward || '').toUpperCase() === String(resWard || wardNumber || '').toUpperCase();
    if (role === 'booth_worker') return String(user.booth) === bStr;
    return false;
  })();

  const handleStartSurvey = () => {
    const hs = houseSurveyData || {};
    const boothStr = String(hs.boothNo || member.booth || '');
    const resolvedWard = (hs.wardNumber && isNaN(hs.wardNumber) ? hs.wardNumber : '') || wardByBooth(boothStr) || (wardNumber && isNaN(wardNumber) ? wardNumber : '') || '';
    const genderFull = member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender === 'O' ? 'Other' : (member.gender || '');
    navigate('/survey/form', {
      state: {
        wardNumber: resolvedWard, wardName: resolvedWard, boothNo: boothStr,
        serialNo: member.serial_no ? parseInt(member.serial_no) : serialStart,
        returnTo: '/', returnQuery: query || '',
        prefill: { voterid: member.voterid || '', gender: genderFull, firstName: (member.name || '').split(' ')[0] || '', lastName: (member.name || '').split(' ').slice(-1)[0] || '', houseNumber: hs.houseNumber || member.house_no || '', wardNumber: resolvedWard, boothNo: boothStr, address: member.address || hs.address || '', areaType: hs.areaType || '', homeType: hs.homeType || '', familyIncome: hs.familyIncome || '' },
      },
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: member.surveyed ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${member.surveyed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, marginBottom: 8 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: member.surveyed ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.12)', border: `1px solid ${member.surveyed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: member.surveyed ? '#10b981' : '#f59e0b' }}>
        {(member.name || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.name || '—'}
          {member.relation && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>{member.relation}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
          {member.voterid && <span style={{ marginRight: 8 }}>🪪 {member.voterid}</span>}
          {member.gender && <span style={{ marginRight: 8 }}>{member.gender === 'M' ? '♂' : member.gender === 'F' ? '♀' : '⚧'} {member.gender}</span>}
          {member.age && <span>Age {member.age}</span>}
        </div>
      </div>
      {member.surveyed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#10b981', flexShrink: 0, minHeight: 36 }}>✓ Done</div>
      ) : canSurvey ? (
        <button onClick={handleStartSurvey} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#090e1c', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', minHeight: 36, WebkitTapHighlightColor: 'transparent' }}>✎ Survey</button>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.2)', flexShrink: 0, cursor: 'not-allowed', minHeight: 36, display: 'flex', alignItems: 'center' }}>🔒</div>
      )}
    </div>
  );
}

// ─── House Card ───────────────────────────────────────────────────────────────
function HouseCard({ house, serialCounter, query, user }) {
  const [expanded, setExpanded] = useState(true);
  const pct = house.total_members ? Math.round((house.surveyed / house.total_members) * 100) : 0;
  const statusColor = pct === 100 ? '#10b981' : pct > 0 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ background: 'rgba(17,28,52,0.7)', border: `1px solid ${pct === 100 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
      <div onClick={() => setExpanded(p => !p)} className="db-tap" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: `${statusColor}15`, border: `1px solid ${statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>⌂</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 3 }}>
            House No: {house.house_no}
            {house.ward_name && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>{house.ward_name}</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {house.total_members} member{house.total_members !== 1 ? 's' : ''} · {house.surveyed} surveyed
            {house.booth && <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 7px', fontSize: 11 }}>Booth {house.booth}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: statusColor }}>{pct}%</div>
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 3 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: statusColor, borderRadius: 2 }} />
            </div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
        </div>
      </div>
      {expanded && house.members?.length > 0 && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ paddingTop: 10 }}>
            {house.members.map((m, i) => (
              <MemberRow key={m.id || i} member={m} wardNumber={house.ward_number} wardName={house.ward_name} serialStart={serialCounter + i} houseSurveyData={house} query={query} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ChartTip ─────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2847', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

// ─── Large Families Modal ─────────────────────────────────────────────────────
function LargeFamiliesModal({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedWard, setExpandedWard] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(null);

  useEffect(() => {
    dashboardApi.largeFamilies().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = (data?.wards || []).filter(w => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return w.wardNumber?.toString().toLowerCase().includes(q) || w.wardName?.toLowerCase().includes(q) || w.houses?.some(h => h.houseNo?.toLowerCase().includes(q));
  });

  const ACCENT = '#22d3ee';
  const modal = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(8,14,30,0.99)', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px 20px 0 0', flex: 1, marginTop: '10vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f97316', marginBottom: 2 }}>Large Families</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Households with 15+ members</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, width: 36, height: 36, cursor: 'pointer', color: 'var(--text-2)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Loading…</div>
        ) : (
          <>
            <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px' }}>
                <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 16 }}>⌕</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by ward or house…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#fff', minHeight: 36 }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 24px', WebkitOverflowScrolling: 'touch' }}>
              {filtered.map(ward => {
                const isOpen = expandedWard === ward.wardNumber;
                return (
                  <div key={ward.wardNumber} style={{ marginBottom: 10 }}>
                    <div onClick={() => setExpandedWard(isOpen ? null : ward.wardNumber)} className="db-tap" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: isOpen ? 'rgba(34,211,238,0.07)' : 'rgba(255,255,255,0.025)', border: `1px solid ${isOpen ? 'rgba(34,211,238,0.22)' : 'rgba(255,255,255,0.07)'}`, borderRadius: isOpen ? '12px 12px 0 0' : 12, cursor: 'pointer' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: isOpen ? 'rgba(34,211,238,0.13)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isOpen ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.09)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: isOpen ? ACCENT : 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Ward</span>
                        <span style={{ fontSize: 15, fontWeight: 900, color: isOpen ? ACCENT : '#e2e8f0', lineHeight: 1.1 }}>{ward.wardNumber}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0', marginBottom: 3 }}>{ward.wardName}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{ward.count} large house{ward.count !== 1 ? 's' : ''}</div>
                      </div>
                      <span style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.2)', fontSize: 16, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
                    </div>
                    {isOpen && ward.houses?.map((house, hi) => (
                      <div key={`${house.houseNo}-${hi}`} className="db-tap" onClick={() => setSelectedHouse(house)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(34,211,238,0.02)', border: '1px solid rgba(34,211,238,0.14)', borderTop: 'none', cursor: 'pointer' }}>
                        <span style={{ fontSize: 18 }}>⌂</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', flex: 1 }}>House {house.houseNo}</span>
                        {house.booth && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 8px' }}>Booth {house.booth}</span>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, padding: '4px 10px' }}>
                          <span style={{ fontSize: 10 }}>👥</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>{house.memberCount}</span>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }              = useAuth();
  const location              = useLocation();
  const [stats, setStats]     = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]     = useState('');

  const [selectedWard,      setSelectedWard]      = useState('');
  const [wardStats,         setWardStats]         = useState(null);
  const [wardStatsLoading,  setWardStatsLoading]  = useState(false);
  const [wardError,         setWardError]         = useState('');

  const [selectedBooth,     setSelectedBooth]     = useState('');
  const [boothStats,        setBoothStats]        = useState(null);
  const [boothStatsLoading, setBoothStatsLoading] = useState(false);
  const [boothError,        setBoothError]        = useState('');

  const [largeFamiliesOpen, setLargeFamiliesOpen] = useState(false);

  const [query, setQuery]         = useState('');
  const [searching, setSearching] = useState(false);
  const [searchRes, setSearchRes] = useState(null);
  const [searchErr, setSearchErr] = useState('');
  const [nextSerial, setNextSerial] = useState(1);
  const debounceRef      = useRef(null);
  const searchResultsRef = useRef(null);

  useEffect(() => {
    dashboardApi.stats()
      .then(r => { setStats(r.data); setError(''); })
      .catch(e => setError(e.userMessage || e.response?.data?.message || 'Could not load dashboard data.'))
      .finally(() => setStatsLoading(false));
    dashboardApi.serialNumber().then(r => setNextSerial(r.data.serialNumber || 1)).catch(() => {});
  }, []);

  useEffect(() => {
    const returnQuery = location.state?.returnQuery;
    if (returnQuery && returnQuery.trim().length >= 2) {
      setQuery(returnQuery); setSearching(true); setSearchErr('');
      dashboardApi.houseSearch(returnQuery).then(r => { if (r.data.success) setSearchRes(r.data); }).catch(() => {}).finally(() => setSearching(false));
      setTimeout(() => { searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
    }
  }, []);

  useEffect(() => {
    if (!selectedWard) { setWardStats(null); setWardError(''); setSelectedBooth(''); setBoothStats(null); return; }
    setWardStatsLoading(true); setWardError('');
    dashboardApi.wardStats(selectedWard).then(r => { setWardStats(r.data); setWardError(''); }).catch(e => setWardError(e.userMessage || 'Could not load ward data.')).finally(() => setWardStatsLoading(false));
  }, [selectedWard]);

  useEffect(() => {
    if (!selectedBooth) { setBoothStats(null); setBoothError(''); return; }
    setBoothStatsLoading(true); setBoothError('');
    dashboardApi.boothStats(selectedWard, selectedBooth).then(r => { setBoothStats(r.data); setBoothError(''); }).catch(e => setBoothError(e.userMessage || 'Could not load booth data.')).finally(() => setBoothStatsLoading(false));
  }, [selectedBooth]);

  const handleQueryChange = useCallback((e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    if (v.trim().length < 2) { setSearchRes(null); setSearchErr(''); return; }
    setSearching(true); setSearchErr('');
    debounceRef.current = setTimeout(() => {
      dashboardApi.houseSearch(v).then(r => { if (r.data.success) setSearchRes(r.data); else setSearchErr(r.data.message || 'Search failed.'); }).catch(() => setSearchErr('Search failed.')).finally(() => setSearching(false));
    }, 350);
  }, []);

  const clearSearch = () => { setQuery(''); setSearchRes(null); setSearchErr(''); };

  const s = stats || {};
  const activeLoading = statsLoading || (selectedWard ? wardStatsLoading : false) || (selectedBooth ? boothStatsLoading : false);

  const coverage = (() => {
    if (selectedBooth && boothStats) return boothStats.coveragePct || 0;
    if (selectedWard && wardStats)   return wardStats.ward2026?.pctTotal || 0;
    if (stats) return stats.totalVoters ? Math.round((stats.totalReg / stats.totalVoters) * 100) : 0;
    return 0;
  })();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const STAT_CARDS = [
    { label: 'Total Surveys',  value: s.totalReg?.toLocaleString() || null,   icon: '✎',            color: '#f59e0b', sub: 'Registered entries' },
    { label: 'Total Voters',   value: (selectedBooth ? boothStats?.totalElectors : selectedWard ? (wardStats?.totalElectors || wardStats?.totalVoters) : s.totalVoters)?.toLocaleString() || null, icon: '◉', color: '#22d3ee', sub: selectedBooth ? `Booth ${selectedBooth}` : selectedWard ? 'Total Electors' : 'Voter records' },
    { label: 'Houses Covered', value: s.houseCount?.toLocaleString() || null, icon: '⌂',             color: '#10b981', sub: 'Unique households' },
    { label: 'Large Families', value: s.largeFamilyCount?.toLocaleString() ?? null, icon: '👨‍👩‍👧‍👦', color: '#f97316', sub: '15+ members', onClick: () => setLargeFamiliesOpen(true) },
    { label: 'Coverage',       value: (selectedBooth ? boothStats : selectedWard ? wardStats : stats) ? `${coverage}%` : null, icon: '◈', color: '#8b5cf6', sub: 'Survey completion' },
    { label: 'Risk Wards',     value: RISK_WARD_NUMS.length.toString(), icon: '⚠', color: '#ef4444', sub: 'SIR action needed', onClick: () => {} },
  ];

  return (
    <>
      <style>{MOBILE_STYLES}</style>
      <div className="page">
        <Navbar />
        <div className="db-page">

          {/* ── Search ── */}
          <div className="db-anim" style={{ marginBottom: 20 }}>
            <div style={{ background: 'rgba(17,28,52,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '4px 8px 4px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: 20, color: 'var(--text-3)', flexShrink: 0 }}>⌕</span>
              <input value={query} onChange={handleQueryChange} placeholder="Search name, Voter ID or House No…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 16, color: 'var(--text-1)', padding: '13px 0', minHeight: 52 }} />
              {searching && <span className="spinner" style={{ flexShrink: 0 }} />}
              {query && !searching && (
                <button onClick={clearSearch} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 16, color: 'var(--text-2)', flexShrink: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              )}
            </div>
            {!query && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {['By name', 'By Voter ID', 'By House No'].map(hint => (
                  <span key={hint} style={{ fontSize: 12, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '6px 14px' }}>{hint}</span>
                ))}
              </div>
            )}
          </div>

          {/* ── Search Results ── */}
          {query.trim().length >= 2 && (
            <div ref={searchResultsRef} className="db-anim" style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                  Search Results
                  {searchRes && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>{searchRes.total_houses} result{searchRes.total_houses !== 1 ? 's' : ''}</span>}
                </h2>
                {query && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Results for "<span style={{ color: 'var(--gold)' }}>{query}</span>"</p>}
              </div>
              {searchErr && <div className="alert alert-error" style={{ marginBottom: 14 }}>⚠ {searchErr}</div>}
              {searching && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 14 }}><span className="spinner" /> Searching…</div>}
              {!searching && searchRes && searchRes.total_houses === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--text-3)' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>No results found</div>
                  <div style={{ fontSize: 13 }}>Try a different name, voter ID or house number</div>
                </div>
              )}
              {!searching && searchRes && searchRes.houses.map((house, idx) => {
                const prevCount = searchRes.houses.slice(0, idx).reduce((a, h) => a + (h.total_members || 0), 0);
                return <HouseCard key={house.house_no} house={house} serialCounter={nextSerial + prevCount} query={query} user={user} />;
              })}
            </div>
          )}

          {/* ── Header ── */}
          <div className="db-anim" style={{ marginBottom: 20 }}>
            <div className="db-header-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#22d3ee', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 6, padding: '3px 10px', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Dashboard</span>
                <h1 style={{ fontSize: 'clamp(22px,5vw,30px)', marginBottom: 5, lineHeight: 1.2 }}>{greeting}, {user?.username} 👋</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  {selectedBooth ? <>Viewing <strong style={{ color: '#22d3ee' }}>Ward {selectedWard} · Booth {selectedBooth}</strong></>
                    : selectedWard ? <>Viewing <strong style={{ color: '#f59e0b' }}>Ward {selectedWard} — {WARD_NAMES[selectedWard]}</strong></>
                    : 'Your constituency intelligence overview'}
                </p>
              </div>

              <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <WardSelector value={selectedWard} onChange={(w) => { setSelectedWard(w); setSelectedBooth(''); setBoothStats(null); }} />

                {selectedWard && (
                  <div style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15 }}>🗳</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(34,211,238,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select Booth</span>
                        {selectedBooth && <span style={{ fontSize: 11, fontWeight: 800, color: '#22d3ee', background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 5, padding: '2px 7px' }}>#{selectedBooth}</span>}
                      </div>
                      {selectedBooth && (
                        <button onClick={() => { setSelectedBooth(''); setBoothStats(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.45)', minHeight: 28 }}>✕ Clear</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(WARD_NUM_TO_BOOTHS[selectedWard] || []).map(b => {
                        const isActive = selectedBooth === String(b);
                        const boothSIR = (SIR_BOOTH_DATA[String(selectedWard)] || []).find(bd => bd.booth === b);
                        const isWeak = boothSIR && boothSIR.totalMappedPct < 60;
                        return (
                          <button key={b} onClick={() => setSelectedBooth(isActive ? '' : String(b))} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', minWidth: 40, minHeight: 36, background: isActive ? '#22d3ee' : isWeak ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)', border: isActive ? '1px solid #22d3ee' : isWeak ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.1)', color: isActive ? '#090e1c' : isWeak ? '#f87171' : 'var(--text-2)', position: 'relative', WebkitTapHighlightColor: 'transparent' }}>
                            {b}
                            {isWeak && !isActive && <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1px solid #090e1c' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Ward Info Card ── */}
          {selectedWard && (
            <div className="db-anim" style={{ marginBottom: 20 }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.13),rgba(245,158,11,0.04))', border: '1px solid rgba(245,158,11,0.28)', borderRadius: wardStatsLoading || !wardStats ? 16 : '16px 16px 0 0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏘</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ward {selectedWard} — {wardStats?.wardName || WARD_NAMES[selectedWard]}</div>
                  {wardStats && <div style={{ fontSize: 12, color: 'rgba(245,158,11,0.55)', marginTop: 2 }}>District {wardStats.districtId} · Constituency {wardStats.constituencyId}</div>}
                </div>
                {wardStatsLoading && <span className="spinner" />}
                <button onClick={() => setSelectedWard('')} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: 9, cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#f59e0b', width: 42, height: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              {!wardStatsLoading && wardStats && (
                <div style={{ background: 'rgba(10,18,34,0.97)', border: '1px solid rgba(245,158,11,0.2)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>2026 Voter Roll · Electors Data</div>

                  {(wardStats.ward2026?.boothCount > 0 || wardStats.ward2026?.boothList) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '9px 12px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', flexShrink: 0 }}>Booths</span>
                      {wardStats.ward2026?.boothCount > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: '#22d3ee', flexShrink: 0 }}>{wardStats.ward2026.boothCount} booths</span>}
                      {wardStats.ward2026?.boothList && <span style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {wardStats.ward2026.boothList}</span>}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(95px,1fr))', gap: 10, marginBottom: 16 }}>
                    {[
                      { label:'Total Electors', value:wardStats.ward2026?.totalElectors,  color:'#22d3ee' },
                      { label:'Cutoff Elec',    value:wardStats.ward2026?.cutoffElec,      color:'#f59e0b' },
                      { label:'BLO Mapped',     value:wardStats.ward2026?.bloMapped,       color:'#10b981' },
                      { label:'Total Mapped',   value:wardStats.ward2026?.totalMapped,     color:'#10b981' },
                      { label:'% BLO Mapped',   value:wardStats.ward2026?.pctBloMapped,    color:'#10b981', isPct:true },
                      { label:'Age≤Cutoff',     value:wardStats.ward2026?.ageCutoff,       color:'#8b5cf6' },
                      { label:'Progeny >18',    value:wardStats.ward2026?.progeny18,       color:'#a78bfa' },
                      { label:'% Progeny',      value:wardStats.ward2026?.pctProgeny,      color:'#a78bfa', isPct:true },
                      { label:'Elec Mapped',    value:wardStats.ward2026?.electorsMapped,  color:'#f97316' },
                      { label:'% Total',        value:wardStats.ward2026?.pctTotal,        color:'#f97316', isPct:true },
                    ].filter(x => x.value !== undefined && x.value !== '' && x.value !== 0).map(({ label, value, color, isPct }) => {
                      const display = isPct ? (typeof value === 'number' ? value.toFixed(2) + '%' : String(value).replace('%','') + '%') : (typeof value === 'number' ? value.toLocaleString() : value);
                      const totalE = wardStats.ward2026?.totalElectors || 1;
                      const pct = (!isPct && typeof value === 'number') ? Math.round(value / totalE * 100) : null;
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                            <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color }}>{display ?? '—'}</span>
                          </div>
                          {pct !== null && <div className="db-bar-track"><div className="db-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} /></div>}
                        </div>
                      );
                    })}
                  </div>

                  {wardStats.ward2026?.supervisors && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Supervisors · </span>
                      <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>{wardStats.ward2026.supervisors}</span>
                    </div>
                  )}

                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Voter Roll Demographics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 10 }}>
                    {[
                      { label:'Total', value:wardStats.totalVoters, color:'#22d3ee', pct:100 },
                      { label:'Male',  value:wardStats.totalMale,   color:'#22d3ee', pct:wardStats.totalVoters ? Math.round(wardStats.totalMale/wardStats.totalVoters*100) : 0 },
                      { label:'Female',value:wardStats.totalFemale, color:'#ec4899', pct:wardStats.totalVoters ? Math.round(wardStats.totalFemale/wardStats.totalVoters*100) : 0 },
                      { label:'Hindu', value:wardStats.totalHindu,  color:'#f97316', pct:wardStats.totalVoters ? Math.round(wardStats.totalHindu/wardStats.totalVoters*100) : 0 },
                      { label:'Muslim',value:wardStats.totalMuslim, color:'#10b981', pct:wardStats.totalVoters ? Math.round(wardStats.totalMuslim/wardStats.totalVoters*100) : 0 },
                      { label:'Chrstn',value:wardStats.totalChristian, color:'#8b5cf6', pct:wardStats.totalVoters ? Math.round(wardStats.totalChristian/wardStats.totalVoters*100) : 0 },
                    ].map(({ label, value, color, pct }) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color }}>{value?.toLocaleString() ?? '—'}</span>
                        </div>
                        <div className="db-bar-track"><div className="db-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedWard && !wardStatsLoading && <WardSIRPanel wardNum={selectedWard} />}
              {selectedWard && !wardStatsLoading && SIR_BOOTH_DATA[String(selectedWard)] && <WardBoothDrillDown wardNum={selectedWard} />}

              {!wardStatsLoading && wardStats && <div style={{ height: 0, border: '1px solid rgba(245,158,11,0.2)', borderTop: 'none', borderRadius: '0 0 14px 14px' }} />}
              {wardError && <div className="alert alert-error" style={{ marginTop: 8 }}>⚠ {wardError}</div>}
            </div>
          )}

          {/* ── Booth Stats Panel ── */}
          {selectedWard && wardStats && selectedBooth && (
            <div className="db-anim" style={{ marginBottom: 16 }}>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(34,211,238,0.25)' }}>
                <div style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.12),rgba(34,211,238,0.04))', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: boothStatsLoading || !boothStats ? 'none' : '1px solid rgba(34,211,238,0.15)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🗳</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#22d3ee' }}>Booth {selectedBooth} — {wardStats?.wardName || WARD_NAMES[selectedWard]}</div>
                    <div style={{ fontSize: 12, color: 'rgba(34,211,238,0.5)', marginTop: 1 }}>Ward {selectedWard} · Booth-level data</div>
                  </div>
                  {boothStatsLoading && <span className="spinner" />}
                </div>
                {!boothStatsLoading && boothStats && (
                  <div style={{ background: 'rgba(10,18,34,0.97)', padding: '16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>2026 Voter Roll · Booth {selectedBooth}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(95px,1fr))', gap: 10, marginBottom: 16 }}>
                      {[
                        { label:'Total Electors', value:boothStats.totalElectors,    color:'#22d3ee' },
                        { label:'Cutoff Elec',    value:boothStats.cutoffElec,        color:'#f59e0b' },
                        { label:'BLO Mapped',     value:boothStats.bloMapped,         color:'#10b981' },
                        { label:'Total Mapped',   value:boothStats.totalMapped,       color:'#10b981' },
                        { label:'% BLO Mapped',   value:boothStats.pctBloMapped,      color:'#10b981', isPct:true },
                        { label:'Progeny >18',    value:boothStats.progeny18,         color:'#a78bfa' },
                        { label:'% Progeny',      value:boothStats.pctProgeny,        color:'#a78bfa', isPct:true },
                        { label:'% Completed',    value:boothStats.pctTotalCompleted, color:'#22d3ee', isPct:true },
                      ].filter(x => x.value !== undefined && x.value !== '' && x.value !== 0).map(({ label, value, color, isPct }) => {
                        const display = isPct ? (typeof value === 'number' ? value.toFixed(2) + '%' : String(value).replace('%','') + '%') : (typeof value === 'number' ? value.toLocaleString() : value);
                        const totalE = boothStats.totalElectors || 1;
                        const pct = (!isPct && typeof value === 'number') ? Math.round(value / totalE * 100) : null;
                        return (
                          <div key={label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color }}>{display ?? '—'}</span>
                            </div>
                            {pct !== null && <div className="db-bar-track"><div className="db-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} /></div>}
                          </div>
                        );
                      })}
                    </div>
                    {boothError && <div className="alert alert-error" style={{ margin: 8 }}>⚠ {boothError}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

          {/* ── KPI Stat Cards ── */}
          <div className="db-stat-grid db-anim" style={{ marginBottom: 20 }}>
            {STAT_CARDS.map(c => (
              activeLoading && c.label !== 'Risk Wards'
                ? <StatCardSkeleton key={c.label} />
                : <StatCard key={c.label} {...c} />
            ))}
          </div>

          {/* ── Coverage Meter ── */}
          <div style={{ marginBottom: 20 }}>
            <CoverageMeter
              coverage={coverage}
              totalReg={s.totalReg}
              totalVoters={selectedBooth ? boothStats?.totalElectors : s.totalVoters}
              label={selectedBooth ? `Booth ${selectedBooth}` : selectedWard ? `Ward ${selectedWard}` : 'All wards'}
            />
          </div>

          {/* ── Quick Actions ── */}
          <QuickActions />

          {/* ── SIR Heatmap ── */}
          <SIRHeatmapTable onSelectWard={(w) => { setSelectedWard(w); setSelectedBooth(''); setBoothStats(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

          {/* ── Charts Row ── */}
          {!activeLoading && stats && (
            <div className="db-two-col db-anim" style={{ marginBottom: 20 }}>
              {/* Age distribution */}
              {s.ageGroups?.length > 0 && (
                <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 14px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Age Distribution</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Registered voters by age group</div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={s.ageGroups} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="group" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Religion pie */}
              {s.voterReligion && (
                <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 14px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Community Breakdown</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Voter distribution by religion</div>
                  </div>
                  {(() => {
                    const data = Object.entries(s.voterReligion || {}).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
                    return (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => v.toLocaleString()} />
                          <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ── Gender & Quick Links ── */}
          {!activeLoading && stats && (
            <div className="db-two-col db-anim" style={{ marginBottom: 24 }}>
              {/* Gender breakdown */}
              <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 14px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Gender Breakdown</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Voter & survey distribution</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label:'Male Voters',       val:selectedWard ? s.totalMale   : s.voterMale,   total:s.totalVoters, color:'#22d3ee' },
                    { label:'Female Voters',     val:selectedWard ? s.totalFemale : s.voterFemale, total:s.totalVoters, color:'#ec4899' },
                    { label:'Male Registered',   val:s.regMale,   total:s.totalReg, color:'#22d3ee' },
                    { label:'Female Registered', val:s.regFemale, total:s.totalReg, color:'#ec4899' },
                  ].map(item => {
                    const pct = item.total ? ((item.val || 0) / item.total * 100).toFixed(0) : 0;
                    return (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{item.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{(item.val || 0).toLocaleString()}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: `${item.color}12`, borderRadius: 4, padding: '2px 7px' }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="db-bar-track">
                          <div className="db-bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extended Quick Actions */}
              <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 14px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Quick Actions</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Jump to key features</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { to:'/survey',  label:'Start New Survey',        desc:'Record constituency data', icon:'✎', color:'#f59e0b' },
                    { to:'/schemes', label:'Check Scheme Eligibility', desc:'Find schemes for voters',  icon:'◈', color:'#10b981' },
                    { to:'/voters',  label:'Search Voters',            desc:'Browse voter registry',    icon:'◉', color:'#22d3ee' },
                    { to:'/data',    label:'View All Data',            desc:'Survey & voter datasets',  icon:'⊟', color:'#8b5cf6' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', minHeight: 60, WebkitTapHighlightColor: 'transparent' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{item.desc}</div>
                      </div>
                      <span style={{ color: `${item.color}60`, fontSize: 20, flexShrink: 0 }}>›</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      {largeFamiliesOpen && <LargeFamiliesModal onClose={() => setLargeFamiliesOpen(false)} />}
    </>
  );
}