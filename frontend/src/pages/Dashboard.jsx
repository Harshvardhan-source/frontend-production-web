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

// ─── SINGLE SOURCE OF TRUTH — mirrors WARD_FULL_DATA in views.py exactly ─────
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

// ─── SIR HEATMAP + POLITICAL DATA (from SIR_Heatmap_Combined_Report) ──────────
// Keys match ward numbers from WARD_FULL_DATA above
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
  33: { classification:'BJP FAVOURABLE', pollRate:57.2, alert:'✓ OK',       hindu:63.9, muslim:5.3,  christian:30.8, bloMapped:51.09, progeny:75.37, totalMapped:57.69, totalElectors:5843,  supervisors:'PURUSHOTTAM 58-68', bjpProj:63.9, congProj:36.1, margin:27.8,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  34: { classification:'CONTESTED (BJP Lean)', pollRate:50.2, alert:'⚠ CONG RISK', hindu:52.2, muslim:11.7, christian:36.1, bloMapped:53.38, progeny:98.08, totalMapped:67.94, totalElectors:6294,  supervisors:'BHARATHI 127-137, DODDANANJAIAH 138-148, PURUSHOTTAM 58-68, RAVINDRA 34-46', bjpProj:52.2, congProj:47.8, margin:4.4,   riskStatus:'⚠ RISK', priority:'MEDIUM'   },
  35: { classification:'BJP STRONG',     pollRate:64.9, alert:'✓ OK',       hindu:68.3, muslim:4.6,  christian:27.1, bloMapped:56.32, progeny:78.03, totalMapped:63.6,  totalElectors:8462,  supervisors:'RAVINDRA 34-46', bjpProj:68.3, congProj:31.7, margin:36.6,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  36: { classification:'BJP FAVOURABLE', pollRate:46.9, alert:'⚠ BJP RISK', hindu:60.2, muslim:3.9,  christian:35.9, bloMapped:52.81, progeny:80.04, totalMapped:61.64, totalElectors:4471,  supervisors:'RAVINDRA 34-46', bjpProj:60.2, congProj:39.8, margin:20.4,  riskStatus:'⚠ RISK', priority:'MEDIUM'   },
  37: { classification:'BJP STRONG',     pollRate:61.6, alert:'✓ OK',       hindu:68.7, muslim:0.8,  christian:30.5, bloMapped:64.16, progeny:102.16,totalMapped:76.42, totalElectors:6718,  supervisors:'KIRAN 47-57', bjpProj:68.7, congProj:31.3, margin:37.4,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  38: { classification:'CONGRESS STRONG',pollRate:52.1, alert:'⚠ CONG RISK',hindu:32.2, muslim:25.2, christian:42.6, bloMapped:59.41, progeny:85.11, totalMapped:75.21, totalElectors:6296,  supervisors:'BHARATHI 127-137, DEEPAK 160-170, DODDANANJAIAH 138-148', bjpProj:32.2, congProj:67.8, margin:-35.6, riskStatus:'⚠ RISK', priority:'WATCH'    },
  39: { classification:'CONGRESS STRONG',pollRate:56.3, alert:'✓ OK',       hindu:32.1, muslim:9.2,  christian:58.7, bloMapped:60.47, progeny:96.65, totalMapped:71.08, totalElectors:6526,  supervisors:'DEEPAK 160-170, RAJA 171-181', bjpProj:32.1, congProj:67.9, margin:-35.8, riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  40: { classification:'CONTESTED (BJP Lean)', pollRate:39.5, alert:'⚠ CONG RISK', hindu:51.0, muslim:27.7, christian:21.4, bloMapped:44.77, progeny:88.36, totalMapped:59.57, totalElectors:5980,  supervisors:'BHARATHI 127-137, DODDANANJAIAH 138-148', bjpProj:51.0, congProj:49.0, margin:2.0,   riskStatus:'⚠ RISK', priority:'MEDIUM'   },
  41: { classification:'BJP STRONGHOLD', pollRate:59.3, alert:'⚠ BJP RISK', hindu:90.4, muslim:7.6,  christian:2.0,  bloMapped:63.43, progeny:74.61, totalMapped:66.61, totalElectors:4882,  supervisors:'BHARATHI 127-137, SUMITHRA 116-126', bjpProj:90.4, congProj:9.6, margin:80.8,  riskStatus:'⚠ RISK', priority:'MEDIUM'   },
  42: { classification:'BJP STRONGHOLD', pollRate:58.4, alert:'⚠ BJP RISK', hindu:86.2, muslim:12.0, christian:1.8,  bloMapped:57.45, progeny:74.47, totalMapped:62.63, totalElectors:7664,  supervisors:'SATHISH K 69-81, SIDDARAJU 105-115, SUMITHRA 116-126', bjpProj:86.2, congProj:13.8, margin:72.4,  riskStatus:'⚠ RISK', priority:'HIGH'     },
  43: { classification:'CONGRESS STRONG',pollRate:62.1, alert:'✓ OK',       hindu:28.8, muslim:68.2, christian:3.0,  bloMapped:53.24, progeny:74.07, totalMapped:61.14, totalElectors:5765,  supervisors:'SIDDARAJU 105-115', bjpProj:28.8, congProj:71.2, margin:-42.4, riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  44: { classification:'CONGRESS STRONG',pollRate:58.0, alert:'✓ OK',       hindu:34.6, muslim:65.1, christian:0.3,  bloMapped:54.6,  progeny:81.31, totalMapped:64.37, totalElectors:5871,  supervisors:'SUMITHRA 116-126', bjpProj:34.6, congProj:65.4, margin:-30.8, riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  45: { classification:'CONTESTED (Cong Lean)', pollRate:63.8, alert:'✓ OK',hindu:47.6, muslim:40.9, christian:11.4, bloMapped:62.19, progeny:93.55, totalMapped:74.23, totalElectors:7153,  supervisors:'ARUN 239-249, DODDANANJAIAH 138-148, PREMANAND 149-159, RAKESH SHETTY 228-238', bjpProj:47.6, congProj:52.4, margin:-4.8,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  46: { classification:'BJP STRONG',     pollRate:51.2, alert:'⚠ BJP RISK', hindu:73.8, muslim:20.7, christian:5.5,  bloMapped:56.25, progeny:72.79, totalMapped:61.81, totalElectors:4095,  supervisors:'DODDANANJAIAH 138-148, PREMANAND 149-159', bjpProj:73.8, congProj:26.2, margin:47.6,  riskStatus:'⚠ RISK', priority:'HIGH'     },
  47: { classification:'CONGRESS FAVOURABLE', pollRate:55.0, alert:'✓ OK',  hindu:43.5, muslim:34.8, christian:21.8, bloMapped:54.15, progeny:71.6,  totalMapped:60.39, totalElectors:7210,  supervisors:'DEEPAK 160-170, DODDANANJAIAH 138-148', bjpProj:43.5, congProj:56.5, margin:-13.0, riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  48: { classification:'CONTESTED (BJP Lean)', pollRate:49.2, alert:'⚠ CONG RISK', hindu:53.6, muslim:11.5, christian:34.9, bloMapped:57.89, progeny:92.99, totalMapped:54.79, totalElectors:5090,  supervisors:'ANAND THOLE 182-192, BHARATHI 127-137, RAJA 171-181', bjpProj:53.6, congProj:46.4, margin:7.2,   riskStatus:'⚠ RISK', priority:'MEDIUM'   },
  49: { classification:'BJP STRONG',     pollRate:61.4, alert:'✓ OK',       hindu:76.1, muslim:10.8, christian:13.1, bloMapped:57.73, progeny:96.22, totalMapped:75.65, totalElectors:7527,  supervisors:'ANAND THOLE 182-192, RAJA 171-181', bjpProj:76.1, congProj:23.9, margin:52.2,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  50: { classification:'BJP STRONG',     pollRate:67.3, alert:'✓ OK',       hindu:76.1, muslim:8.9,  christian:15.0, bloMapped:56.48, progeny:109.84,totalMapped:77.72, totalElectors:6284,  supervisors:'AKSHATH 206-216, ANAND THOLE 182-192', bjpProj:76.1, congProj:23.9, margin:52.2,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  51: { classification:'BJP STRONG',     pollRate:63.0, alert:'✓ OK',       hindu:68.5, muslim:1.4,  christian:30.0, bloMapped:57.28, progeny:106.1, totalMapped:71.61, totalElectors:7200,  supervisors:'KIRAN 47-57, RAVINDRA 34-46, THARANATH 193-205', bjpProj:68.5, congProj:31.5, margin:37.0,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  52: { classification:'CONGRESS FAVOURABLE', pollRate:61.2, alert:'✓ OK',  hindu:40.1, muslim:56.9, christian:3.0,  bloMapped:58.83, progeny:91.81, totalMapped:74.52, totalElectors:7045,  supervisors:'THARANATH 193-205', bjpProj:40.1, congProj:59.9, margin:-19.8, riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  53: { classification:'CONTESTED (Cong Lean)', pollRate:55.1, alert:'✓ OK',hindu:47.8, muslim:45.2, christian:7.1,  bloMapped:59.3,  progeny:91.89, totalMapped:71.92, totalElectors:7805,  supervisors:'AKSHATH 206-216', bjpProj:47.8, congProj:52.2, margin:-4.4,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  54: { classification:'BJP STRONG',     pollRate:61.1, alert:'✓ OK',       hindu:71.6, muslim:7.4,  christian:20.9, bloMapped:64.09, progeny:94.69, totalMapped:73.73, totalElectors:7266,  supervisors:'AKSHATH 206-216, ARUN 239-249, VIJAYKUMAR 217-227', bjpProj:71.6, congProj:28.4, margin:43.2,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  55: { classification:'BJP FAVOURABLE', pollRate:62.5, alert:'✓ OK',       hindu:62.9, muslim:24.0, christian:13.1, bloMapped:60.02, progeny:99.92, totalMapped:73.51, totalElectors:7856,  supervisors:'ARUN 239-249, PREMANAND 149-159, VIJAYKUMAR 217-227', bjpProj:62.9, congProj:37.1, margin:25.8,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  56: { classification:'BJP FAVOURABLE', pollRate:61.8, alert:'✓ OK',       hindu:62.8, muslim:26.8, christian:10.5, bloMapped:57.1,  progeny:83.28, totalMapped:65.88, totalElectors:5358,  supervisors:'RAKESH SHETTY 228-238', bjpProj:62.8, congProj:37.2, margin:25.6,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  57: { classification:'BJP STRONG',     pollRate:59.1, alert:'✓ OK',       hindu:65.1, muslim:30.1, christian:4.8,  bloMapped:65.88, progeny:101.37,totalMapped:76.64, totalElectors:4320,  supervisors:'ARUN 239-249, RAKESH SHETTY 228-238', bjpProj:65.1, congProj:34.9, margin:30.2,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  58: { classification:'BJP STRONG',     pollRate:60.9, alert:'✓ OK',       hindu:71.8, muslim:19.6, christian:8.6,  bloMapped:53.2,  progeny:79.37, totalMapped:61.97, totalElectors:7107,  supervisors:'ARUN 239-249, RAKESH SHETTY 228-238', bjpProj:71.8, congProj:28.2, margin:43.6,  riskStatus:'✓ NORMAL', priority:'NORMAL'   },
  59: { classification:'CONTESTED (BJP Lean)', pollRate:57.3, alert:'⚠ CONG RISK', hindu:52.4, muslim:18.7, christian:29.0, bloMapped:57.05, progeny:97.0,  totalMapped:68.69, totalElectors:7711,  supervisors:'ARUN 239-249, DEEPAK 160-170, PREMANAND 149-159, VIJAYKUMAR 217-227', bjpProj:52.4, congProj:47.6, margin:4.8,   riskStatus:'⚠ RISK', priority:'MEDIUM'   },
  60: { classification:'CONGRESS STRONG',pollRate:41.6, alert:'⚠ CONG RISK',hindu:30.9, muslim:68.3, christian:0.8,  bloMapped:60.39, progeny:127.86,totalMapped:90.09, totalElectors:10897, supervisors:'SIDDARAJU 105-115, YADAVA HOSABETTU 93-104', bjpProj:30.9, congProj:69.1, margin:-38.2, riskStatus:'⚠ RISK', priority:'WATCH'    },
};

// ─── Priority helpers ─────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)',  label: '🔴 CRITICAL', order: 0 },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', label: '🟠 HIGH',     order: 1 },
  MEDIUM:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: '🟡 MEDIUM',   order: 2 },
  WATCH:    { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.3)', label: '🟢 WATCH',    order: 3 },
  NORMAL:   { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', label: '— NORMAL',    order: 4 },
};

const CLASSIFICATION_CONFIG = {
  'BJP STRONGHOLD':         { color: '#f97316', bg: 'rgba(249,115,22,0.15)',  label: '🚩 BJP Stronghold' },
  'BJP STRONG':             { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: '🚩 BJP Strong' },
  'BJP FAVOURABLE':         { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  label: '📌 BJP Favourable' },
  'CONTESTED (BJP Lean)':   { color: '#a3a3a3', bg: 'rgba(163,163,163,0.1)', label: '⚖️ Contested (BJP Lean)' },
  'CONTESTED (Cong Lean)':  { color: '#a3a3a3', bg: 'rgba(163,163,163,0.1)', label: '⚖️ Contested (Cong Lean)' },
  'CONGRESS FAVOURABLE':    { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   label: '🏳️ Congress Favourable' },
  'CONGRESS STRONG':        { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '🏳️ Congress Strong' },
  'CONGRESS STRONGHOLD':    { color: '#059669', bg: 'rgba(5,150,105,0.15)',   label: '🏳️ Congress Stronghold' },
};

// Derived lookups
const WARD_NAMES = Object.fromEntries(
  Object.entries(WARD_FULL_DATA).map(([num, { name }]) => [
    String(num),
    name.charAt(0) + name.slice(1).toLowerCase(),
  ])
);
const WARD_BOOTHS_MAP = Object.fromEntries(
  Object.values(WARD_FULL_DATA).map(({ name, booths }) => [name, booths])
);
const WARD_NUM_TO_BOOTHS = Object.fromEntries(
  Object.entries(WARD_FULL_DATA).map(([num, { booths }]) => [String(num), [...booths].sort((a,b) => a-b)])
);

// Count risk wards (not NORMAL, not WATCH)
const RISK_WARD_NUMS = Object.entries(SIR_WARD_DATA)
  .filter(([, d]) => d.priority !== 'NORMAL')
  .map(([n]) => Number(n));

// ─── Ward Selector Dropdown ───────────────────────────────────────────────────
function WardSelector({ value, onChange }) {
  const [open, setOpen]       = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef  = useRef(null);
  const panelRef = useRef(null);

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          btnRef.current  && !btnRef.current.contains(e.target)) setOpen(false);
    };
    const onScroll = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const entries = [['', 'All Wards'], ...Object.entries(WARD_NAMES).sort((a,b) => +a[0] - +b[0])];
  const label   = value ? `Ward ${value} — ${WARD_NAMES[value]}` : 'All Wards';

  const panel = (
    <div ref={panelRef} style={{
      position: 'fixed', top: dropPos.top, right: dropPos.right, zIndex: 2147483647,
      width: 252, maxHeight: 400, overflowY: 'scroll',
      background: '#0c1526', border: '1px solid rgba(255,255,255,0.13)',
      borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.75)', padding: 5,
      isolation: 'isolate',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.2) transparent',
    }}
      onWheel={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
    >
      {entries.map(([num, name]) => {
        const active = value === num;
        const sirD   = num ? SIR_WARD_DATA[Number(num)] : null;
        const pCfg   = sirD ? (PRIORITY_CONFIG[sirD.priority] || PRIORITY_CONFIG.NORMAL) : null;
        return (
          <button key={num} onClick={() => { onChange(num); setOpen(false); }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
            color: active ? '#f59e0b' : 'var(--text-2)',
            fontSize: 13, fontWeight: active ? 700 : 400, textAlign: 'left',
            transition: 'background 0.12s',
          }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            {num
              ? <span style={{ fontSize: 10, fontWeight: 700, background: active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 6px', color: active ? '#f59e0b' : 'var(--text-3)', minWidth: 26, textAlign: 'center', flexShrink: 0 }}>{num}</span>
              : <span style={{ fontSize: 14, flexShrink: 0 }}>🗺</span>
            }
            <span style={{ flex: 1 }}>{name}</span>
            {pCfg && sirD?.priority !== 'NORMAL' && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: pCfg.color, flexShrink: 0, boxShadow: `0 0 4px ${pCfg.color}` }} />
            )}
            {active && <span style={{ color: '#f59e0b', fontSize: 13, flexShrink: 0 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <button ref={btnRef} onClick={openDropdown} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%',
        background: value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${value ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
        fontSize: 14, fontWeight: 600, minHeight: 48,
        color: value ? '#f59e0b' : 'var(--text-2)', transition: 'all 0.18s',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 16 }}>🏘</span>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>
      {open && createPortal(panel, document.body)}
    </>
  );
}

function wardByBooth(boothNo) {
  const n = parseInt(boothNo);
  if (!n) return '';
  for (const [w, bs] of Object.entries(WARD_BOOTHS_MAP)) { if (bs.includes(n)) return w; }
  return '';
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 18, radius = 6, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'rgba(255,255,255,0.06)',
      animation: 'pulse 1.6s ease-in-out infinite',
      ...style,
    }} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="card stat-card" style={{ gap: 10 }}>
      <Skeleton w={40} h={40} radius={10} />
      <Skeleton w="55%" h={11} />
      <Skeleton w="70%" h={28} />
      <Skeleton w="45%" h={11} />
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2847', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: '#8899bb', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

// ─── NEW: Ward SIR Political Intelligence Panel ───────────────────────────────
function WardSIRPanel({ wardNum }) {
  const d = SIR_WARD_DATA[Number(wardNum)];
  if (!d) return null;

  const pCfg   = PRIORITY_CONFIG[d.priority]   || PRIORITY_CONFIG.NORMAL;
  const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color: '#8899bb', bg: 'rgba(255,255,255,0.05)', label: d.classification };
  const isRisk = d.riskStatus.includes('RISK');
  const bjpWin = d.margin > 0;
  const isTight = Math.abs(d.margin) < 10;
  const avgPollRate = 60.7;
  const pollDiff = (d.pollRate - avgPollRate).toFixed(1);
  const pollBelow = d.pollRate < avgPollRate;

  return (
    <div style={{
      background: 'rgba(10,18,34,0.97)',
      border: `1px solid ${pCfg.border}`,
      borderRadius: 14, overflow: 'hidden',
      marginTop: 0,
    }}>
      {/* ── SIR Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${pCfg.bg}, rgba(0,0,0,0))`,
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase', marginRight: 4 }}>
          🗳 SIR Political Intelligence
        </div>
        {/* Political classification badge */}
        <div style={{ background: clsCfg.bg, border: `1px solid ${clsCfg.color}40`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: clsCfg.color, flexShrink: 0 }}>
          {clsCfg.label}
        </div>
        {/* Priority badge */}
        <div style={{ background: pCfg.bg, border: `1px solid ${pCfg.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: pCfg.color, flexShrink: 0 }}>
          {pCfg.label}
        </div>
        {isRisk && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#f87171', flexShrink: 0 }}>
            {d.alert}
          </div>
        )}
      </div>

      <div style={{ padding: '14px' }}>

        {/* ── Poll Rate ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            Voter Turnout Analysis
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: pollBelow ? '#f87171' : '#10b981', fontFamily: 'var(--font-display)' }}>{d.pollRate}%</span>
                <span style={{ fontSize: 11, color: pollBelow ? '#f87171' : '#10b981', fontWeight: 700 }}>
                  {pollBelow ? '▼' : '▲'} {Math.abs(pollDiff)}% vs 60.7% avg
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                {/* Avg line marker */}
                <div style={{ position: 'absolute', left: `${avgPollRate}%`, top: 0, bottom: 0, width: 1.5, background: 'rgba(255,255,255,0.3)', zIndex: 2 }} />
                <div style={{ width: `${d.pollRate}%`, height: '100%', background: pollBelow ? 'linear-gradient(90deg,#ef444499,#ef4444)' : 'linear-gradient(90deg,#10b98199,#10b981)', borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>0%</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Avg 60.7%</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>100%</span>
              </div>
            </div>
            {pollBelow && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>Below Avg</div>
                <div style={{ fontSize: 10, color: 'rgba(239,68,68,0.6)', marginTop: 1 }}>Action Needed</div>
              </div>
            )}
          </div>
        </div>

        {/* ── BJP vs Congress Projection ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            Political Projection
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px' }}>
            {/* Head-to-head bar */}
            <div style={{ display: 'flex', marginBottom: 10, borderRadius: 6, overflow: 'hidden', height: 24 }}>
              <div style={{ width: `${d.bjpProj}%`, background: 'linear-gradient(90deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {d.bjpProj > 15 && <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{d.bjpProj}%</span>}
              </div>
              <div style={{ width: `${d.congProj}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {d.congProj > 15 && <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{d.congProj}%</span>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f97316' }} />
                <span style={{ fontSize: 12, color: '#fb923c', fontWeight: 700 }}>BJP {d.bjpProj}%</span>
              </div>
              {/* Margin */}
              <div style={{
                background: Math.abs(d.margin) > 20 ? (bjpWin ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)') : 'rgba(255,255,255,0.05)',
                border: `1px solid ${Math.abs(d.margin) > 20 ? (bjpWin ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.3)') : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6, padding: '3px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 700 }}>Margin</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: bjpWin ? '#f97316' : '#10b981', fontFamily: 'var(--font-display)' }}>
                  {bjpWin ? '+' : ''}{d.margin}%
                </div>
                {isTight && <div style={{ fontSize: 8, color: '#f59e0b', fontWeight: 700 }}>⚠ TIGHT RACE</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>INC {d.congProj}%</span>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Religion Demographics from SIR ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            Community Breakdown (SIR Data)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Hindu',     pct: d.hindu,    color: '#f97316' },
              { label: 'Muslim',    pct: d.muslim,   color: '#10b981' },
              { label: 'Christian', pct: d.christian,color: '#8b5cf6' },
            ].map(({ label, pct, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 4 }}>{pct}%</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 4 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${color}80,${color})`, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SIR Survey Metrics ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
            SIR Survey Completion
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'BLO Mapped',    val: d.bloMapped,   color: '#22d3ee', threshold: 60 },
              { label: 'Progeny 18+',   val: d.progeny,     color: '#a78bfa', threshold: 80 },
              { label: 'Total Mapped',  val: d.totalMapped, color: '#f59e0b', threshold: 65 },
            ].map(({ label, val, color, threshold }) => {
              const ok = val >= threshold;
              return (
                <div key={label} style={{ background: ok ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.05)', border: `1px solid ${ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: ok ? color : '#f87171' }}>{val.toFixed(1)}%</span>
                    <span style={{ fontSize: 8, color: ok ? '#10b981' : '#f87171' }}>{ok ? '✓' : '⚠'}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 4 }}>
                    <div style={{ width: `${Math.min(val, 100)}%`, height: '100%', background: ok ? `linear-gradient(90deg,${color}80,${color})` : 'linear-gradient(90deg,#ef444480,#ef4444)', borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Supervisors ── */}
        {d.supervisors && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>BLO Supervisors · </span>
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{d.supervisors}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NEW: Risk Wards Overview Grid ────────────────────────────────────────────
function RiskWardsOverview({ onSelectWard }) {
  const riskWards = Object.entries(SIR_WARD_DATA)
    .filter(([, d]) => d.priority !== 'NORMAL')
    .sort(([, a], [, b]) => (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9));

  const critCount = riskWards.filter(([,d]) => d.priority === 'CRITICAL').length;
  const highCount = riskWards.filter(([,d]) => d.priority === 'HIGH').length;

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 16, overflow: 'hidden', marginBottom: 18,
    }} className="anim-fade-up">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03))',
        borderBottom: '1px solid rgba(239,68,68,0.15)',
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚠</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>SIR Risk Wards — Immediate Action Required</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
              {riskWards.length} wards identified · Low voter turnout + incomplete SIR surveys
            </div>
          </div>
        </div>
        {/* Summary badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#f87171' }}>🔴 {critCount} Critical</div>
          <div style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#fb923c' }}>🟠 {highCount} High</div>
        </div>
      </div>

      {/* Ward grid */}
      <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {riskWards.map(([wardNum, d]) => {
          const pCfg   = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.NORMAL;
          const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color: '#8899bb', bg: 'rgba(255,255,255,0.05)' };
          const wName  = WARD_NAMES[wardNum] || d.classification;
          const bjpWin = d.margin > 0;
          return (
            <button
              key={wardNum}
              onClick={() => onSelectWard(String(wardNum))}
              style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${pCfg.border}`,
                borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = pCfg.bg; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 5px', color: 'rgba(255,255,255,0.4)' }}>{wardNum}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{wName}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: pCfg.color }}>{pCfg.label.split(' ')[0]}</span>
              </div>
              {/* Poll rate */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Poll:</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: d.pollRate < 60.7 ? '#f87171' : '#10b981' }}>{d.pollRate}%</span>
                {d.pollRate < 60.7 && <span style={{ fontSize: 9, color: '#f87171' }}>▼ below avg</span>}
              </div>
              {/* Projection mini-bar */}
              <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', height: 5 }}>
                <div style={{ width: `${d.bjpProj}%`, background: '#f97316' }} />
                <div style={{ width: `${d.congProj}%`, background: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: '#f97316', fontWeight: 700 }}>BJP {d.bjpProj}%</span>
                <span style={{ fontSize: 9, color: bjpWin ? '#f97316' : '#10b981', fontWeight: 700, background: 'rgba(255,255,255,0.05)', borderRadius: 3, padding: '1px 4px' }}>
                  {bjpWin ? '+' : ''}{d.margin}%
                </span>
                <span style={{ fontSize: 9, color: '#10b981', fontWeight: 700 }}>INC {d.congProj}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── NEW: All Wards Heatmap Table ─────────────────────────────────────────────
function AllWardsHeatmap({ onSelectWard }) {
  const [showAll, setShowAll] = useState(false);
  const wards = Object.entries(SIR_WARD_DATA)
    .sort(([, a], [, b]) => (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9));
  const displayed = showAll ? wards : wards.slice(0, 20);

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, overflow: 'hidden', marginBottom: 18,
    }} className="anim-fade-up">
      <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>All Wards — SIR Heatmap</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>38 wards · Click any ward to drill down</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'BJP', color: '#f97316' },
            { label: 'Contested', color: '#a3a3a3' },
            { label: 'Congress', color: '#10b981' },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr 1fr', gap: 0, padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {['Ward', 'Classification', 'Poll%', 'BJP%', 'INC%', 'SIR Total%', 'Priority'].map(h => (
          <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
        ))}
      </div>

      {/* Table rows */}
      <div style={{ maxHeight: showAll ? 'none' : 420, overflow: showAll ? 'visible' : 'hidden' }}>
        {displayed.map(([wardNum, d]) => {
          const pCfg   = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.NORMAL;
          const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color: '#8899bb', bg: 'rgba(255,255,255,0.05)' };
          const wName  = WARD_NAMES[wardNum] || wardNum;
          const bjpWin = d.margin > 0;
          const isRisk = d.priority !== 'NORMAL';
          return (
            <button key={wardNum} onClick={() => onSelectWard(String(wardNum))} style={{
              display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1fr 1fr',
              gap: 0, width: '100%', padding: '8px 14px',
              background: isRisk ? `${pCfg.bg}` : 'transparent',
              border: 'none', borderBottom: '1px solid rgba(255,255,255,0.035)',
              cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
              alignItems: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = isRisk ? pCfg.bg : 'transparent'; }}
            >
              {/* Ward */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.06)', borderRadius: 3, padding: '1px 5px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{wardNum}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wName}</span>
              </div>
              {/* Classification */}
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: clsCfg.color, background: clsCfg.bg, borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '95%' }}>
                  {d.classification.replace('(BJP Lean)', '').replace('(Cong Lean)', '').trim()}
                </span>
              </div>
              {/* Poll rate */}
              <div style={{ fontSize: 12, fontWeight: 700, color: d.pollRate < 60.7 ? '#f87171' : '#10b981' }}>{d.pollRate}%</div>
              {/* BJP */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316' }}>{d.bjpProj}%</div>
              {/* Congress */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{d.congProj}%</div>
              {/* SIR Total */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: d.totalMapped >= 65 ? '#10b981' : '#f87171' }}>{d.totalMapped.toFixed(1)}%</span>
              </div>
              {/* Priority */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: pCfg.color, background: pCfg.bg, border: `1px solid ${pCfg.border}`, borderRadius: 5, padding: '2px 6px', whiteSpace: 'nowrap' }}>{pCfg.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {wards.length > 20 && (
        <button onClick={() => setShowAll(v => !v)} style={{
          width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)',
          border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer', color: '#22d3ee', fontSize: 12, fontWeight: 600,
        }}>
          {showAll ? '▲ Show Less' : `▼ Show All ${wards.length} Wards`}
        </button>
      )}
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
    const hs       = houseSurveyData || {};
    const bStr     = String(hs.boothNo || member.booth || '');
    const resWard  = (hs.wardNumber && isNaN(hs.wardNumber) ? hs.wardNumber : '')
                   || wardByBooth(bStr)
                   || (wardNumber && isNaN(wardNumber) ? wardNumber : '') || '';
    if (role === 'corporator')
      return String(user.ward || '').toUpperCase() === String(resWard || wardNumber || '').toUpperCase();
    if (role === 'booth_worker')
      return String(user.booth) === bStr;
    return false;
  })();

  const handleStartSurvey = () => {
    const hs       = houseSurveyData || {};
    const boothStr = String(hs.boothNo || member.booth || '');
    const resolvedWard = (hs.wardNumber && isNaN(hs.wardNumber) ? hs.wardNumber : '')
      || wardByBooth(boothStr)
      || (wardNumber && isNaN(wardNumber) ? wardNumber : '')
      || '';
    const genderFull = member.gender === 'M' ? 'Male'
      : member.gender === 'F' ? 'Female'
      : member.gender === 'O' ? 'Other' : (member.gender || '');

    navigate('/survey/form', {
      state: {
        wardNumber:  resolvedWard, wardName: resolvedWard, boothNo: boothStr,
        serialNo:    member.serial_no ? parseInt(member.serial_no) : serialStart,
        returnTo: '/', returnQuery: query || '',
        prefill: {
          voterid:      member.voterid || '',
          gender:       genderFull,
          firstName:    (member.name || '').split(' ')[0]           || '',
          lastName:     (member.name || '').split(' ').slice(-1)[0] || '',
          houseNumber:  hs.houseNumber  || member.house_no || '',
          wardNumber:   resolvedWard,
          boothNo:      boothStr,
          address:      member.address  || hs.address      || '',
          areaType:     hs.areaType     || '',
          homeType:     hs.homeType     || '',
          familyIncome: hs.familyIncome || '',
        },
      },
    });
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      background: member.surveyed ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${member.surveyed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 10, marginBottom: 6, transition: 'all 0.2s',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: member.surveyed ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.12)',
        border: `1px solid ${member.surveyed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800,
        color: member.surveyed ? '#10b981' : '#f59e0b',
      }}>
        {(member.name || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.name || '—'}
          {member.relation && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-3)', fontWeight: 400 }}>{member.relation}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {member.voterid && <span style={{ marginRight: 8 }}>🪪 {member.voterid}</span>}
          {member.gender  && <span style={{ marginRight: 8 }}>{member.gender === 'M' ? '♂' : member.gender === 'F' ? '♀' : '⚧'} {member.gender}</span>}
          {member.age     && <span>Age {member.age}</span>}
        </div>
      </div>
      {member.surveyed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>
          ✓ Done
        </div>
      ) : canSurvey ? (
        <button onClick={handleStartSurvey} style={{
          background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 8,
          padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#090e1c',
          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
        }}>✎ Survey</button>
      ) : (
        <div title={user?.role === 'corporator' ? `Ward ${user.ward} only` : user?.role === 'booth_worker' ? `Booth ${user.booth} only` : 'No access'}
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 10px', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.2)', flexShrink:0, cursor:'not-allowed' }}>
          🔒 No Access
        </div>
      )}
    </div>
  );
}

// ─── House Card ───────────────────────────────────────────────────────────────
function HouseCard({ house, serialCounter, query, user }) {
  const [expanded, setExpanded] = useState(true);
  const pct         = house.total_members ? Math.round((house.surveyed / house.total_members) * 100) : 0;
  const statusColor = pct === 100 ? '#10b981' : pct > 0 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: 'rgba(17,28,52,0.7)',
      border: `1px solid ${pct === 100 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, marginBottom: 16, overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    }}>
      <div onClick={() => setExpanded(p => !p)} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
        cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
        borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⌂</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>
            House No: {house.house_no}
            {house.ward && <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>Ward {house.ward} {house.booth ? `· Booth ${house.booth}` : ''}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: statusColor, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, flexShrink: 0 }}>{house.surveyed}/{house.total_members}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {pct === 100 ? (
            <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✓ Complete</span>
          ) : house.remaining > 0 ? (
            <span style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{house.remaining} pending</span>
          ) : null}
          <span style={{ color: 'var(--text-3)', fontSize: 16, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>⌄</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '12px 16px' }}>
          {house.members.map((m, i) => (
            <MemberRow
              key={`${house.house_no}-${m.voterid || 'noid'}-${i}`}
              member={m} wardNumber={house.ward} wardName={`Ward ${house.ward}`}
              serialStart={serialCounter + i} houseSurveyData={house.house_survey_data} query={query}
              user={user}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Large Families · Member Detail Panel ────────────────────────────────────
function HouseMembersPanel({ house, onBack }) {
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    api.get('/api/house-search/', { params: { q: String(house.houseNo) } })
      .then(r => {
        if (r.data.success) {
          const match = r.data.houses.find(h => String(h.house_no) === String(house.houseNo))
                     || r.data.houses[0];
          setMembers(match?.members || []);
        } else { setError('Failed to load members.'); }
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, [house.houseNo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '18px 22px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
          fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 5,
        }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>
            House No: <span style={{ color: '#22d3ee' }}>{house.houseNo}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {house.booth && `Booth ${house.booth} · `}{house.memberCount} registered voters
          </div>
        </div>
        <div style={{
          background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)',
          borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#22d3ee',
        }}>👥 {house.memberCount}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 22px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
        )}
        {error && <div style={{ color: '#f87171', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>⚠ {error}</div>}
        {!loading && !error && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
            <div>No member records found</div>
          </div>
        )}
        {!loading && members.map((m, i) => {
          const genderColor = m.gender === 'M' ? '#22d3ee' : m.gender === 'F' ? '#ec4899' : '#a78bfa';
          const genderIcon  = m.gender === 'M' ? '♂' : m.gender === 'F' ? '♀' : '⚧';
          return (
            <div key={`${m.voterid || 'noid'}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', marginBottom: 7,
              background: m.surveyed ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${m.surveyed ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 10,
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{i + 1}</div>
              <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: m.surveyed ? 'rgba(16,185,129,0.15)' : `${genderColor}18`, border: `1px solid ${m.surveyed ? 'rgba(16,185,129,0.3)' : `${genderColor}30`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: m.surveyed ? '#10b981' : genderColor }}>{(m.name || '?')[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.name || '—'}
                  {m.relation && <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>{m.relation}</span>}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {m.voterid && <span>🪪 {m.voterid}</span>}
                  <span style={{ color: genderColor }}>{genderIcon} {m.gender}</span>
                  {m.age && <span>Age {m.age}</span>}
                </div>
              </div>
              {m.surveyed ? (
                <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>✓ Done</div>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#f87171', flexShrink: 0 }}>Pending</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Large Families Modal ─────────────────────────────────────────────────────
function LargeFamiliesModal({ onClose }) {
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [data, setData]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [expandedWard, setExpandedWard] = useState(null);
  const [search, setSearch]           = useState('');
  const [selectedHouse, setSelectedHouse] = useState(null);

  useEffect(() => {
    api.get('/api/large-families/')
      .then(r => {
        if (r.data.success) {
          setData(r.data.byWard || []);
          setTotal(r.data.total || 0);
          if (r.data.byWard?.length) setExpandedWard(r.data.byWard[0].wardNumber);
        } else { setError('Failed to load data.'); }
      })
      .catch(e => setError(e.userMessage || 'Network error.'))
      .finally(() => setLoading(false));
  }, []);

  const lowerSearch = search.toLowerCase();
  const filtered = data
    .map(ward => ({
      ...ward,
      houses: search
        ? ward.houses.filter(h =>
            String(h.houseNo).toLowerCase().includes(lowerSearch) ||
            String(h.booth).includes(lowerSearch))
        : ward.houses,
    }))
    .filter(ward => !search || ward.wardName.toLowerCase().includes(lowerSearch) || ward.houses.length > 0);

  const ACCENT = '#22d3ee';

  const modal = (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: 'linear-gradient(160deg, #0d1b30 0%, #090e1c 100%)', border: '1px solid rgba(34,211,238,0.18)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', maxHeight: '88vh' }}>
        <div style={{ padding: '20px 24px 16px', background: 'rgba(34,211,238,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👨‍👩‍👧‍👦</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>Large Families{!loading && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>{total} houses · 15+ members</span>}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{selectedHouse ? 'Member records' : 'Ward-wise breakdown · click any house to view members'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 15, color: 'rgba(255,255,255,0.45)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {selectedHouse ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <HouseMembersPanel house={selectedHouse} onBack={() => setSelectedHouse(null)} />
          </div>
        ) : (
          <>
            <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '7px 12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 14 }}>⌕</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by ward, house number or booth…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#fff' }} />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 0 }}>✕</button>}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px 24px' }}>
              {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} style={{ height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.6s ease-in-out infinite' }} />)}</div>}
              {error && <div style={{ padding: '20px 0', color: '#f87171', textAlign: 'center', fontSize: 14 }}>⚠ {error}</div>}
              {!loading && !error && filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)' }}><div style={{ fontSize: 34, marginBottom: 8 }}>🔍</div><div style={{ fontWeight: 600 }}>No results found</div></div>
              )}
              {!loading && filtered.map(ward => {
                const isOpen = expandedWard === ward.wardNumber;
                const barMax = filtered[0]?.count || 1;
                return (
                  <div key={ward.wardNumber} style={{ marginBottom: 10 }}>
                    <div onClick={() => setExpandedWard(isOpen ? null : ward.wardNumber)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isOpen ? 'rgba(34,211,238,0.07)' : 'rgba(255,255,255,0.025)', border: `1px solid ${isOpen ? 'rgba(34,211,238,0.22)' : 'rgba(255,255,255,0.07)'}`, borderRadius: isOpen ? '12px 12px 0 0' : 12, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: isOpen ? 'rgba(34,211,238,0.13)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isOpen ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.09)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: isOpen ? ACCENT : 'rgba(255,255,255,0.25)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Ward</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: isOpen ? ACCENT : '#e2e8f0', lineHeight: 1.1 }}>{ward.wardNumber}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ward.wardName}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>{ward.count} house{ward.count !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${Math.round((ward.count / barMax) * 100)}%`, background: isOpen ? `linear-gradient(90deg, ${ACCENT}, #67e8f9)` : 'rgba(34,211,238,0.35)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                      <span style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.2)', fontSize: 15, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>⌄</span>
                    </div>
                    {isOpen && (
                      <div style={{ border: '1px solid rgba(34,211,238,0.14)', borderTop: 'none', borderRadius: '0 0 12px 12px', background: 'rgba(34,211,238,0.02)', padding: '10px 12px 12px' }}>
                        {ward.houses.map((house, hi) => {
                          const big = house.memberCount >= 25;
                          return (
                            <div key={`${house.houseNo}-${hi}`} onClick={() => setSelectedHouse(house)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', marginBottom: 6, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                              <span style={{ fontSize: 16, flexShrink: 0 }}>⌂</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', flex: 1 }}>House No: {house.houseNo}</span>
                              {house.booth && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>Booth {house.booth}</span>}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: big ? 'rgba(239,68,68,0.1)' : 'rgba(34,211,238,0.1)', border: `1px solid ${big ? 'rgba(239,68,68,0.25)' : 'rgba(34,211,238,0.25)'}`, borderRadius: 16, padding: '3px 10px', flexShrink: 0 }}>
                                <span style={{ fontSize: 10 }}>👥</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: big ? '#f87171' : ACCENT }}>{house.memberCount}</span>
                              </div>
                              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, flexShrink: 0 }}>›</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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

    dashboardApi.serialNumber()
      .then(r => setNextSerial(r.data.serialNumber || 1))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const returnQuery = location.state?.returnQuery;
    if (returnQuery && returnQuery.trim().length >= 2) {
      setQuery(returnQuery);
      setSearching(true); setSearchErr('');
      dashboardApi.houseSearch(returnQuery)
        .then(r => { if (r.data.success) setSearchRes(r.data); })
        .catch(() => {})
        .finally(() => setSearching(false));
      setTimeout(() => {
        searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, []);

  useEffect(() => {
    if (!selectedWard) { setWardStats(null); setWardError(''); setSelectedBooth(''); setBoothStats(null); return; }
    setWardStatsLoading(true); setWardError('');
    setSelectedBooth(''); setBoothStats(null);
    dashboardApi.wardStats(selectedWard)
      .then(r => { if (r.data.success) setWardStats(r.data); else setWardError(r.data.message || 'Failed to load ward data.'); })
      .catch(e => setWardError(e.userMessage || 'Network error loading ward data.'))
      .finally(() => setWardStatsLoading(false));
  }, [selectedWard]);

  useEffect(() => {
    if (!selectedWard || !selectedBooth) { setBoothStats(null); setBoothError(''); return; }
    setBoothStatsLoading(true); setBoothError('');
    dashboardApi.boothStats(selectedWard, selectedBooth)
      .then(r => { if (r.data.success) setBoothStats(r.data); else setBoothError(r.data.message || 'Failed to load booth data.'); })
      .catch(e => setBoothError(e.userMessage || 'Network error loading booth data.'))
      .finally(() => setBoothStatsLoading(false));
  }, [selectedWard, selectedBooth]);

  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setSearchRes(null); setSearchErr(''); return; }
    setSearching(true); setSearchErr('');
    try {
      const r = await dashboardApi.houseSearch(q);
      if (r.data.success) setSearchRes(r.data);
      else setSearchErr('Search failed.');
    } catch { setSearchErr('Network error. Please try again later.'); }
    finally { setSearching(false); }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) { setSearchRes(null); setSearchErr(''); }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 200);
  };

  const clearSearch = () => { setQuery(''); setSearchRes(null); setSearchErr(''); };

  const activeLoading = selectedBooth ? boothStatsLoading : (selectedWard ? wardStatsLoading : statsLoading);
  const s             = (selectedBooth ? boothStats : selectedWard ? wardStats : stats) || {};
  const coverage      = s.totalElectors
    ? Math.min(100, ((s.totalReg / s.totalElectors) * 100).toFixed(1))
    : (s.totalVoters ? Math.min(100, ((s.totalReg / s.totalVoters) * 100).toFixed(1)) : 0);

  const wardData = Object.entries(s.wardCoverage || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, val]) => ({ name: name.length > 11 ? name.slice(0, 11) + '…' : name, value: +val.toFixed(1) }));

  const religionPie = Object.entries(s.voterReligion || {})
    .filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const STAT_CARDS = [
    { label: 'Total Surveys',  value: s.totalReg?.toLocaleString() || null, icon: '✎', color: '#f59e0b', sub: 'Registered entries' },
    {
      label: 'Total Voters',
      value: (selectedBooth ? boothStats?.totalElectors : selectedWard ? (wardStats?.totalElectors || wardStats?.totalVoters) : s.totalVoters)?.toLocaleString() || null,
      icon: '◉', color: '#22d3ee',
      sub: selectedBooth ? `Booth ${selectedBooth} Electors` : selectedWard ? '2026 Total Electors' : 'Voter list records',
    },
    { label: 'Houses Covered', value: s.houseCount?.toLocaleString() || null, icon: '⌂', color: '#10b981', sub: 'Unique households' },
    { label: 'Large Families', value: s.largeFamilyCount?.toLocaleString() ?? null, icon: '👨‍👩‍👧‍👦', color: '#f97316', sub: 'Houses with 15+ members' },
    {
      label: 'Coverage',
      value: (selectedBooth ? boothStats : selectedWard ? wardStats : stats) ? `${coverage}%` : null,
      icon: '◈', color: '#8b5cf6',
      sub: selectedBooth ? `Booth ${selectedBooth} completion`
        : selectedWard ? `${wardStats?.ward2026?.pctTotal || ''}` || 'Survey completion'
        : 'Survey completion',
    },
    {
      label: 'Risk Wards',
      value: RISK_WARD_NUMS.length.toString(),
      icon: '⚠', color: '#ef4444', sub: 'SIR action required',
      isRisk: true,
    },
  ];

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
    <style>{`
      .db-stat-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      @media (min-width: 500px) {
        .db-stat-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (min-width: 820px) {
        .db-stat-grid { grid-template-columns: repeat(6, 1fr); }
      }
      .db-two-col {
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
      }
      @media (min-width: 700px) {
        .db-two-col { grid-template-columns: 1fr 1fr; }
      }
      .db-header-row {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      @media (min-width: 600px) {
        .db-header-row { flex-direction: row; align-items: flex-start; justify-content: space-between; }
      }
      .ward-heatmap-row:hover {
        background: rgba(255,255,255,0.04) !important;
      }
    `}</style>

    <div className="page">
      <Navbar />
      <div className="page-inner">

        {/* ── Search Bar ─────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom: 20 }}>
          <div style={{
            background: 'rgba(17,28,52,0.9)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, padding: '4px 8px 4px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}>
            <span style={{ fontSize: 18, color: 'var(--text-3)', flexShrink: 0 }}>⌕</span>
            <input
              value={query} onChange={handleQueryChange}
              placeholder="Search name, Voter ID or House No…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 16, color: 'var(--text-1)', padding: '12px 0' }}
            />
            {searching && <span className="spinner" style={{ flexShrink: 0 }} />}
            {query && !searching && (
              <button onClick={clearSearch} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0', cursor: 'pointer', fontSize: 16, color: 'var(--text-2)', flexShrink: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            )}
          </div>
          {!query && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {['By name', 'By Voter ID', 'By House No'].map(hint => (
                <span key={hint} style={{ fontSize: 12, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '5px 12px' }}>{hint}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── Search Results ─────────────────────────────────────────────── */}
        {(query.trim().length >= 2) && (
          <div ref={searchResultsRef} className="anim-fade-up" style={{ marginBottom: 28 }}>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                Search Results
                {searchRes && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>{searchRes.total_houses} house{searchRes.total_houses !== 1 ? 's' : ''} found</span>}
              </h2>
              {query && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Results for "<span style={{ color: 'var(--gold)' }}>{query}</span>"</p>}
            </div>
            {searchErr && <div className="alert alert-error" style={{ marginBottom: 14 }}>⚠ {searchErr}</div>}
            {searching && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 14 }}><span className="spinner" /> Searching…</div>}
            {!searching && searchRes && searchRes.total_houses === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--text-3)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
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

        <>
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="page-header anim-fade-up">
            <div className="db-header-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="badge badge-cyan mb-8">Dashboard</span>
                <h1 style={{ fontSize: 'clamp(20px, 5vw, 30px)', marginBottom: 4 }}>{greeting}, {user?.username} 👋</h1>
                <p style={{ fontSize: 13 }}>{
                selectedBooth
                  ? <>Viewing <strong style={{ color: '#22d3ee' }}>Ward {selectedWard} · Booth {selectedBooth}</strong></>
                  : selectedWard
                  ? <>Viewing <strong style={{ color: '#f59e0b' }}>Ward {selectedWard} — {WARD_NAMES[selectedWard]}</strong></>
                  : 'Your constituency intelligence overview'
                }</p>
              </div>
              <div style={{ width: '100%', maxWidth: 280 }}>
                <WardSelector value={selectedWard} onChange={setSelectedWard} />
              </div>
            </div>
          </div>

          {/* ── Ward Info Card ─────────────────────────────────────────────── */}
          {selectedWard && (
            <div className="anim-fade-up" style={{ marginBottom: 20 }}>
              <div style={{
                background: 'linear-gradient(135deg,rgba(245,158,11,0.13) 0%,rgba(245,158,11,0.04) 100%)',
                border: '1px solid rgba(245,158,11,0.28)',
                borderRadius: wardStatsLoading || !wardStats ? 14 : '14px 14px 0 0',
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🏘</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Ward {selectedWard} — {wardStats?.wardName || WARD_NAMES[selectedWard]}
                    </div>
                    {wardStats && <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.55)', marginTop: 1 }}>District {wardStats.districtId} · Constituency {wardStats.constituencyId}</div>}
                  </div>
                  {wardStatsLoading && <span className="spinner" />}
                </div>
                <button onClick={() => setSelectedWard('')} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: 8, padding: '0', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#f59e0b', width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              {!wardStatsLoading && wardStats && (
                <div style={{ background: 'rgba(10,18,34,0.97)', border: '1px solid rgba(245,158,11,0.2)', borderTop: 'none', borderRadius: '0 0 0 0', padding: '14px' }}>

                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                    2026 Voter Roll · Electors Data
                  </div>

                  {(wardStats.ward2026?.boothCount > 0 || wardStats.ward2026?.boothList) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '7px 10px' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', flexShrink: 0 }}>Booths</span>
                      {wardStats.ward2026?.boothCount > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#22d3ee', flexShrink: 0 }}>{wardStats.ward2026.boothCount} booths</span>}
                      {wardStats.ward2026?.boothList && <span style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {wardStats.ward2026.boothList}</span>}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, marginBottom: 14 }}>
                    {[
                      { label: 'Total Electors', value: wardStats.ward2026?.totalElectors,  color: '#22d3ee' },
                      { label: 'Cutoff Elec',    value: wardStats.ward2026?.cutoffElec,      color: '#f59e0b' },
                      { label: 'BLO Mapped',     value: wardStats.ward2026?.bloMapped,       color: '#10b981' },
                      { label: 'Total Mapped',   value: wardStats.ward2026?.totalMapped,     color: '#10b981' },
                      { label: '% BLO Mapped',   value: wardStats.ward2026?.pctBloMapped,    color: '#10b981', isPct: true },
                      { label: 'Age≤Cutoff',     value: wardStats.ward2026?.ageCutoff,       color: '#8b5cf6' },
                      { label: 'Progeny >18',    value: wardStats.ward2026?.progeny18,       color: '#a78bfa' },
                      { label: '% Progeny',      value: wardStats.ward2026?.pctProgeny,      color: '#a78bfa', isPct: true },
                      { label: 'Electors Mapped',value: wardStats.ward2026?.electorsMapped,  color: '#f97316' },
                      { label: '% Total',        value: wardStats.ward2026?.pctTotal,        color: '#f97316', isPct: true },
                    ].filter(x => x.value !== undefined && x.value !== '' && x.value !== 0).map(({ label, value, color, isPct }) => {
                      const display = isPct
                        ? (typeof value === 'number' ? value.toFixed(2) + '%' : String(value).replace('%','') + '%')
                        : (typeof value === 'number' ? value.toLocaleString() : value);
                      const totalE  = wardStats.ward2026?.totalElectors || 1;
                      const pct     = (!isPct && typeof value === 'number') ? Math.round(value / totalE * 100) : null;
                      return (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color }}>{display ?? '—'}</span>
                          </div>
                          {pct !== null && (
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                              <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: `linear-gradient(90deg,${color}99,${color})`, borderRadius: 2 }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {wardStats.ward2026?.supervisors && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px', marginBottom: 14 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Supervisors · </span>
                      <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{wardStats.ward2026.supervisors}</span>
                    </div>
                  )}

                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>Voter Roll Demographics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
                    {[
                      { label: 'Total', value: wardStats.totalVoters, color: '#22d3ee', pct: 100 },
                      { label: 'Male',  value: wardStats.totalMale,   color: '#22d3ee', pct: wardStats.totalVoters ? Math.round(wardStats.totalMale / wardStats.totalVoters * 100) : 0 },
                      { label: 'Female',value: wardStats.totalFemale, color: '#ec4899', pct: wardStats.totalVoters ? Math.round(wardStats.totalFemale / wardStats.totalVoters * 100) : 0 },
                      { label: 'Hindu', value: wardStats.totalHindu,  color: '#f97316', pct: wardStats.totalVoters ? Math.round(wardStats.totalHindu / wardStats.totalVoters * 100) : 0 },
                      { label: 'Muslim',value: wardStats.totalMuslim, color: '#10b981', pct: wardStats.totalVoters ? Math.round(wardStats.totalMuslim / wardStats.totalVoters * 100) : 0 },
                      { label: 'Chrstn',value: wardStats.totalChristian, color: '#8b5cf6', pct: wardStats.totalVoters ? Math.round(wardStats.totalChristian / wardStats.totalVoters * 100) : 0 },
                    ].map(({ label, value, color, pct }) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color }}>{value?.toLocaleString() ?? '—'}</span>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${color}99,${color})`, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── NEW: Ward SIR Political Intelligence ── */}
              {selectedWard && !wardStatsLoading && (
                <WardSIRPanel wardNum={selectedWard} />
              )}

              {/* ── Bottom rounded border on full card ── */}
              {!wardStatsLoading && wardStats && (
                <div style={{ height: 0, border: '1px solid rgba(245,158,11,0.2)', borderTop: 'none', borderRadius: '0 0 14px 14px' }} />
              )}
              {wardError && <div className="alert alert-error" style={{ marginTop: 8 }}>⚠ {wardError}</div>}
            </div>
          )}

          {/* ── Booth Selector ── */}
          {selectedWard && wardStats && (
            <div className="anim-fade-up" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Select Booth</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  {(WARD_NUM_TO_BOOTHS[selectedWard] || []).map(b => (
                    <button key={b} onClick={() => setSelectedBooth(selectedBooth === String(b) ? '' : String(b))} style={{
                      padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: selectedBooth === String(b) ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                      border: selectedBooth === String(b) ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                      color: selectedBooth === String(b) ? '#090e1c' : 'var(--text-2)',
                      minWidth: 38, minHeight: 36,
                    }}>{b}</button>
                  ))}
                </div>
                {selectedBooth && (
                  <button onClick={() => { setSelectedBooth(''); setBoothStats(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--text-2)', flexShrink: 0, minHeight: 36 }}>✕ Clear</button>
                )}
              </div>

              {selectedBooth && (
                <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(34,211,238,0.25)' }}>
                  <div style={{ background: 'linear-gradient(135deg,rgba(34,211,238,0.12) 0%,rgba(34,211,238,0.04) 100%)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: boothStatsLoading || !boothStats ? 'none' : '1px solid rgba(34,211,238,0.15)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗳</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#22d3ee' }}>Booth {selectedBooth} — {wardStats?.wardName || WARD_NAMES[selectedWard]}</div>
                      <div style={{ fontSize: 11, color: 'rgba(34,211,238,0.5)', marginTop: 1 }}>Ward {selectedWard} · Booth-level electors data</div>
                    </div>
                    {boothStatsLoading && <span className="spinner" />}
                  </div>

                  {!boothStatsLoading && boothStats && (
                    <div style={{ background: 'rgba(10,18,34,0.97)', padding: '14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>2026 Voter Roll · Booth {selectedBooth} Data</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, marginBottom: 14 }}>
                        {[
                          { label: 'Total Electors', value: boothStats.totalElectors,     color: '#22d3ee' },
                          { label: 'Cutoff Elec',    value: boothStats.cutoffElec,         color: '#f59e0b' },
                          { label: 'BLO Mapped',     value: boothStats.bloMapped,          color: '#10b981' },
                          { label: 'Total Mapped',   value: boothStats.totalMapped,        color: '#10b981' },
                          { label: '% BLO Mapped',   value: boothStats.pctBloMapped,       color: '#10b981', isPct: true },
                          { label: 'Age≤Cutoff',     value: boothStats.ageCutoff,          color: '#8b5cf6' },
                          { label: 'Progeny >18',    value: boothStats.progeny18,          color: '#a78bfa' },
                          { label: '% Progeny',      value: boothStats.pctProgeny,         color: '#a78bfa', isPct: true },
                          { label: 'Elec Mapped',    value: boothStats.electorsMapped,     color: '#f97316' },
                          { label: '% Elec Mapped',  value: boothStats.pctElectorsMapped,  color: '#f97316', isPct: true },
                          { label: '% Completed',    value: boothStats.pctTotalCompleted,  color: '#22d3ee', isPct: true },
                        ].filter(x => x.value !== undefined && x.value !== '' && x.value !== 0).map(({ label, value, color, isPct }) => {
                          const display = isPct
                            ? (typeof value === 'number' ? value.toFixed(2) + '%' : String(value).replace('%','') + '%')
                            : (typeof value === 'number' ? value.toLocaleString() : value);
                          const totalE = boothStats.totalElectors || 1;
                          const pct    = (!isPct && typeof value === 'number') ? Math.round(value / totalE * 100) : null;
                          return (
                            <div key={label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color }}>{display ?? '—'}</span>
                              </div>
                              {pct !== null && (
                                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                  <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: `linear-gradient(90deg,${color}99,${color})`, borderRadius: 2 }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>Survey Coverage · Booth {selectedBooth}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                        {[
                          { label: 'Surveys Done', value: boothStats.totalReg,   color: '#f59e0b', pct: boothStats.totalElectors ? Math.round(boothStats.totalReg / boothStats.totalElectors * 100) : 0 },
                          { label: 'Houses',        value: boothStats.houseCount, color: '#10b981', pct: 100 },
                          { label: 'Male',          value: boothStats.regMale,    color: '#22d3ee', pct: boothStats.totalReg ? Math.round(boothStats.regMale / boothStats.totalReg * 100) : 0 },
                          { label: 'Female',        value: boothStats.regFemale,  color: '#ec4899', pct: boothStats.totalReg ? Math.round(boothStats.regFemale / boothStats.totalReg * 100) : 0 },
                          { label: 'Coverage',      value: `${boothStats.coveragePct}%`, color: '#8b5cf6', pct: Math.min(boothStats.coveragePct, 100) },
                        ].map(({ label, value, color, pct }) => (
                          <div key={label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color }}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
                            </div>
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${color}99,${color})`, borderRadius: 2 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {boothError && <div className="alert alert-error" style={{ margin: 8 }}>⚠ {boothError}</div>}
                </div>
              )}
            </div>
          )}

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

          {/* ── Stat cards (now 6: added Risk Wards) ─────────────────────── */}
          <div className="db-stat-grid stagger mb-24">
            {STAT_CARDS.map(c => (
              activeLoading && c.label !== 'Risk Wards' ? (
                <StatCardSkeleton key={c.label} />
              ) : (
                <div key={c.label}
                  onClick={c.label === 'Large Families' ? () => setLargeFamiliesOpen(true) : undefined}
                  style={{
                    background: 'linear-gradient(145deg, rgba(17,28,52,0.9) 0%, rgba(10,18,35,0.95) 100%)',
                    border: `1px solid ${c.color}22`, borderRadius: 14, padding: '14px 12px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: `0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    cursor: (c.label === 'Large Families' || c.label === 'Risk Wards') ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ position: 'absolute', top: -18, right: -18, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(circle, ${c.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.4, maxWidth: '65%' }}>{c.label}</div>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${c.color}15`, border: `1px solid ${c.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{c.icon}</div>
                  </div>
                  <div style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: c.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 5 }}>{c.value ?? '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500, lineHeight: 1.3 }}>{c.sub}</div>
                    {(c.label === 'Large Families' || c.label === 'Risk Wards') && (
                      <span style={{ fontSize: 9, color: `${c.color}90`, background: `${c.color}12`, border: `1px solid ${c.color}25`, borderRadius: 5, padding: '2px 5px', fontWeight: 700 }}>View ›</span>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* ── Coverage bar ──────────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 16px',
            marginBottom: 18, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden',
          }} className="anim-fade-up">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, #8b5cf6 0%, #22d3ee ${coverage}%, rgba(255,255,255,0.06) ${coverage}%)`, borderRadius: '16px 16px 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Survey Coverage</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{selectedBooth ? `Booth ${selectedBooth}` : selectedWard ? `Ward ${selectedWard}` : 'All wards'}</div>
              </div>
              {activeLoading ? <Skeleton w={70} h={36} radius={9} /> : (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: '#8b5cf6', letterSpacing: '-1px', lineHeight: 1 }}>{coverage}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{s.totalReg?.toLocaleString() || 0} / {(selectedBooth ? boothStats?.totalElectors : s.totalVoters)?.toLocaleString() || 0}</div>
                </div>
              )}
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              {!activeLoading && <div style={{ height: '100%', width: `${coverage}%`, background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)', borderRadius: 4, transition: 'width 0.8s ease' }} />}
            </div>
          </div>

          {/* ── Charts ──────────────────────────────────────────────────── */}
          <div className="db-two-col mb-24">
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 14px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Ward Coverage</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Top 10 wards by completion %</div>
              </div>
              {activeLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={20} radius={4} style={{ width: `${80 - i * 8}%` }} />)}
                </div>
              ) : wardData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.2)' }}><div style={{ fontSize: 28, marginBottom: 6 }}>📊</div><div style={{ fontSize: 12 }}>No ward data yet</div></div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={wardData} layout="vertical" margin={{ left: 0, right: 14 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8899bb', fontSize: 10 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={82} tick={{ fill: '#8899bb', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                      {wardData.map((e, i) => <Cell key={i} fill={e.value >= 70 ? '#10b981' : e.value >= 45 ? '#f59e0b' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 14px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Voter Demographics</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Religion-wise distribution</div>
              </div>
              {activeLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 210 }}><Skeleton w={140} h={140} radius={70} /></div>
              ) : religionPie.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.2)' }}><div style={{ fontSize: 28, marginBottom: 6 }}>🥧</div><div style={{ fontSize: 12 }}>No data yet</div></div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={religionPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {religionPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => v.toLocaleString()} contentStyle={{ background: '#0c1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f0f4ff', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#8899bb' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── NEW: Risk Wards Overview (only on overall view) ───────────── */}
          {!selectedWard && (
            <RiskWardsOverview onSelectWard={setSelectedWard} />
          )}

          {/* ── NEW: All Wards SIR Heatmap Table (only on overall view) ─── */}
          {!selectedWard && (
            <AllWardsHeatmap onSelectWard={setSelectedWard} />
          )}

          {/* ── Gender + Quick Actions ────────────────────────────────────── */}
          <div className="db-two-col" style={{ marginBottom: 24 }}>
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 14px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Gender Breakdown</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Voter & survey distribution</div>
              </div>
              {activeLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><Skeleton w="45%" h={12} /><Skeleton w="20%" h={12} /></div>
                      <Skeleton h={5} radius={3} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Male Voters',       val: selectedWard ? s.totalMale   : s.voterMale,   total: s.totalVoters, color: '#22d3ee' },
                    { label: 'Female Voters',     val: selectedWard ? s.totalFemale : s.voterFemale, total: s.totalVoters, color: '#ec4899' },
                    ...(((selectedWard ? s.totalTrans : s.voterTrans) || 0) > 0
                      ? [{ label: 'Trans Voters', val: selectedWard ? s.totalTrans : s.voterTrans, total: s.totalVoters, color: '#a78bfa' }]
                      : []),
                    { label: 'Male Registered',   val: s.regMale,   total: s.totalReg, color: '#22d3ee' },
                    { label: 'Female Registered', val: s.regFemale, total: s.totalReg, color: '#ec4899' },
                  ].map(item => {
                    const pct = item.total ? ((item.val || 0) / item.total * 100).toFixed(0) : 0;
                    return (
                      <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{item.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{(item.val || 0).toLocaleString()}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: `${item.color}12`, borderRadius: 4, padding: '1px 5px' }}>{pct}%</span>
                          </div>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${item.color}99, ${item.color})`, borderRadius: 2, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 14px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Quick Actions</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Jump to key features</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { to: '/survey',  label: 'Start New Survey',        desc: 'Record constituency data', icon: '✎', color: '#f59e0b' },
                  { to: '/schemes', label: 'Check Scheme Eligibility', desc: 'Find schemes for voters',  icon: '◈', color: '#10b981' },
                  { to: '/voters',  label: 'Search Voters',            desc: 'Browse voter registry',    icon: '◉', color: '#22d3ee' },
                  { to: '/data',    label: 'View All Data',            desc: 'Survey & voter datasets',  icon: '⊟', color: '#8b5cf6' },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px',
                    borderRadius: 12, background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    textDecoration: 'none', minHeight: 58,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{item.desc}</div>
                    </div>
                    <span style={{ color: `${item.color}60`, fontSize: 20, flexShrink: 0 }}>›</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
    {largeFamiliesOpen && <LargeFamiliesModal onClose={() => setLargeFamiliesOpen(false)} />}
    </>
  );
}