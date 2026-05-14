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

// ─── SIR BOOTH DRILL-DOWN DATA (from BOOTH DRILL-DOWN sheet — risk wards only) ─
const SIR_BOOTH_DATA = {"21":[{"booth":31,"totalElectors":1496,"cutoffElectors":987,"bloMapped":577,"totalMapped":577,"bloMappedPct":58.46,"ageCutoff":515,"progeny18":427,"progenyPct":63.42,"totalMappedPct":67.11},{"booth":32,"totalElectors":711,"cutoffElectors":502,"bloMapped":351,"totalMapped":351,"bloMappedPct":69.92,"ageCutoff":205,"progeny18":268,"progenyPct":109.44,"totalMappedPct":87.06},{"booth":33,"totalElectors":803,"cutoffElectors":553,"bloMapped":357,"totalMapped":357,"bloMappedPct":64.56,"ageCutoff":250,"progeny18":229,"progenyPct":64.34,"totalMappedPct":72.98},{"booth":55,"totalElectors":1314,"cutoffElectors":847,"bloMapped":482,"totalMapped":482,"bloMappedPct":56.91,"ageCutoff":469,"progeny18":412,"progenyPct":81.26,"totalMappedPct":68.04},{"booth":56,"totalElectors":1240,"cutoffElectors":767,"bloMapped":416,"totalMapped":416,"bloMappedPct":54.24,"ageCutoff":476,"progeny18":380,"progenyPct":64.2,"totalMappedPct":64.19},{"booth":57,"totalElectors":941,"cutoffElectors":665,"bloMapped":330,"totalMapped":330,"bloMappedPct":49.62,"ageCutoff":275,"progeny18":227,"progenyPct":64.98,"totalMappedPct":59.19},{"booth":58,"totalElectors":1037,"cutoffElectors":724,"bloMapped":461,"totalMapped":461,"bloMappedPct":63.67,"ageCutoff":313,"progeny18":311,"progenyPct":102.04,"totalMappedPct":74.45}],"24":[{"booth":9,"totalElectors":1079,"cutoffElectors":752,"bloMapped":434,"totalMapped":434,"bloMappedPct":57.71,"ageCutoff":329,"progeny18":257,"progenyPct":92.13,"totalMappedPct":62.0},{"booth":11,"totalElectors":1318,"cutoffElectors":932,"bloMapped":481,"totalMapped":481,"bloMappedPct":51.61,"ageCutoff":398,"progeny18":192,"progenyPct":65.87,"totalMappedPct":51.06},{"booth":13,"totalElectors":1036,"cutoffElectors":719,"bloMapped":418,"totalMapped":418,"bloMappedPct":58.14,"ageCutoff":314,"progeny18":279,"progenyPct":66.17,"totalMappedPct":45.07},{"booth":17,"totalElectors":1334,"cutoffElectors":937,"bloMapped":493,"totalMapped":493,"bloMappedPct":52.61,"ageCutoff":397,"progeny18":423,"progenyPct":116.11,"totalMappedPct":68.67}],"27":[{"booth":82,"totalElectors":820,"cutoffElectors":590,"bloMapped":415,"totalMapped":415,"bloMappedPct":70.34,"ageCutoff":231,"progeny18":245,"progenyPct":122.04,"totalMappedPct":80.49},{"booth":83,"totalElectors":444,"cutoffElectors":304,"bloMapped":226,"totalMapped":226,"bloMappedPct":74.34,"ageCutoff":142,"progeny18":140,"progenyPct":84.0,"totalMappedPct":82.43},{"booth":84,"totalElectors":1032,"cutoffElectors":749,"bloMapped":369,"totalMapped":369,"bloMappedPct":49.27,"ageCutoff":285,"progeny18":203,"progenyPct":64.0,"totalMappedPct":55.43},{"booth":88,"totalElectors":973,"cutoffElectors":716,"bloMapped":336,"totalMapped":336,"bloMappedPct":46.93,"ageCutoff":257,"progeny18":192,"progenyPct":68.25,"totalMappedPct":54.27},{"booth":93,"totalElectors":843,"cutoffElectors":606,"bloMapped":398,"totalMapped":398,"bloMappedPct":65.68,"ageCutoff":238,"progeny18":197,"progenyPct":107.09,"totalMappedPct":70.58},{"booth":95,"totalElectors":1193,"cutoffElectors":848,"bloMapped":457,"totalMapped":458,"bloMappedPct":54.01,"ageCutoff":344,"progeny18":292,"progenyPct":112.09,"totalMappedPct":62.78},{"booth":96,"totalElectors":543,"cutoffElectors":356,"bloMapped":239,"totalMapped":239,"bloMappedPct":67.13,"ageCutoff":187,"progeny18":160,"progenyPct":83.42,"totalMappedPct":73.48},{"booth":97,"totalElectors":770,"cutoffElectors":522,"bloMapped":402,"totalMapped":402,"bloMappedPct":77.01,"ageCutoff":249,"progeny18":253,"progenyPct":86.38,"totalMappedPct":85.06}],"28":[{"booth":12,"totalElectors":1106,"cutoffElectors":805,"bloMapped":437,"totalMapped":437,"bloMappedPct":54.29,"ageCutoff":292,"progeny18":237,"progenyPct":73.05,"totalMappedPct":63.02},{"booth":75,"totalElectors":620,"cutoffElectors":427,"bloMapped":263,"totalMapped":263,"bloMappedPct":61.59,"ageCutoff":195,"progeny18":168,"progenyPct":88.44,"totalMappedPct":69.52},{"booth":78,"totalElectors":791,"cutoffElectors":405,"bloMapped":138,"totalMapped":138,"bloMappedPct":34.07,"ageCutoff":386,"progeny18":217,"progenyPct":45.48,"totalMappedPct":44.88},{"booth":79,"totalElectors":726,"cutoffElectors":646,"bloMapped":460,"totalMapped":460,"bloMappedPct":71.21,"ageCutoff":80,"progeny18":73,"progenyPct":117.58,"totalMappedPct":73.42},{"booth":80,"totalElectors":1113,"cutoffElectors":793,"bloMapped":382,"totalMapped":382,"bloMappedPct":48.17,"ageCutoff":319,"progeny18":169,"progenyPct":67.46,"totalMappedPct":49.51},{"booth":81,"totalElectors":1316,"cutoffElectors":976,"bloMapped":534,"totalMapped":534,"bloMappedPct":54.71,"ageCutoff":340,"progeny18":226,"progenyPct":59.67,"totalMappedPct":57.75},{"booth":85,"totalElectors":674,"cutoffElectors":506,"bloMapped":282,"totalMapped":282,"bloMappedPct":55.73,"ageCutoff":167,"progeny18":139,"progenyPct":100.0,"totalMappedPct":62.46},{"booth":86,"totalElectors":1245,"cutoffElectors":885,"bloMapped":432,"totalMapped":432,"bloMappedPct":48.81,"ageCutoff":361,"progeny18":219,"progenyPct":65.34,"totalMappedPct":52.29},{"booth":87,"totalElectors":511,"cutoffElectors":366,"bloMapped":196,"totalMapped":196,"bloMappedPct":53.55,"ageCutoff":149,"progeny18":112,"progenyPct":88.89,"totalMappedPct":60.27}],"29":[{"booth":68,"totalElectors":700,"cutoffElectors":476,"bloMapped":195,"totalMapped":195,"bloMappedPct":40.97,"ageCutoff":224,"progeny18":145,"progenyPct":56.09,"totalMappedPct":48.57},{"booth":69,"totalElectors":928,"cutoffElectors":663,"bloMapped":369,"totalMapped":369,"bloMappedPct":55.66,"ageCutoff":264,"progeny18":176,"progenyPct":64.18,"totalMappedPct":58.73},{"booth":71,"totalElectors":1071,"cutoffElectors":748,"bloMapped":428,"totalMapped":428,"bloMappedPct":57.22,"ageCutoff":324,"progeny18":221,"progenyPct":73.98,"totalMappedPct":60.6},{"booth":72,"totalElectors":582,"cutoffElectors":404,"bloMapped":226,"totalMapped":226,"bloMappedPct":55.94,"ageCutoff":177,"progeny18":151,"progenyPct":70.43,"totalMappedPct":64.78},{"booth":73,"totalElectors":1236,"cutoffElectors":806,"bloMapped":567,"totalMapped":567,"bloMappedPct":70.35,"ageCutoff":428,"progeny18":371,"progenyPct":99.33,"totalMappedPct":75.89}],"31":[{"booth":15,"totalElectors":531,"cutoffElectors":380,"bloMapped":208,"totalMapped":208,"bloMappedPct":54.74,"ageCutoff":151,"progeny18":171,"progenyPct":101.85,"totalMappedPct":71.37},{"booth":16,"totalElectors":1041,"cutoffElectors":740,"bloMapped":388,"totalMapped":388,"bloMappedPct":52.43,"ageCutoff":304,"progeny18":200,"progenyPct":50.79,"totalMappedPct":56.48},{"booth":18,"totalElectors":1196,"cutoffElectors":829,"bloMapped":375,"totalMapped":375,"bloMappedPct":45.24,"ageCutoff":369,"progeny18":265,"progenyPct":73.06,"totalMappedPct":53.51},{"booth":19,"totalElectors":1146,"cutoffElectors":796,"bloMapped":515,"totalMapped":515,"bloMappedPct":64.7,"ageCutoff":352,"progeny18":304,"progenyPct":74.66,"totalMappedPct":71.47},{"booth":20,"totalElectors":1235,"cutoffElectors":856,"bloMapped":516,"totalMapped":516,"bloMappedPct":60.28,"ageCutoff":383,"progeny18":431,"progenyPct":99.75,"totalMappedPct":76.68},{"booth":21,"totalElectors":993,"cutoffElectors":690,"bloMapped":322,"totalMapped":322,"bloMappedPct":46.67,"ageCutoff":294,"progeny18":254,"progenyPct":79.28,"totalMappedPct":58.01},{"booth":23,"totalElectors":1104,"cutoffElectors":772,"bloMapped":336,"totalMapped":336,"bloMappedPct":43.52,"ageCutoff":332,"progeny18":210,"progenyPct":91.44,"totalMappedPct":49.46}],"32":[{"booth":27,"totalElectors":1090,"cutoffElectors":754,"bloMapped":422,"totalMapped":422,"bloMappedPct":55.97,"ageCutoff":338,"progeny18":202,"progenyPct":52.38,"totalMappedPct":57.25},{"booth":28,"totalElectors":895,"cutoffElectors":643,"bloMapped":433,"totalMapped":433,"bloMappedPct":67.34,"ageCutoff":251,"progeny18":282,"progenyPct":90.84,"totalMappedPct":79.89},{"booth":29,"totalElectors":1456,"cutoffElectors":991,"bloMapped":618,"totalMapped":618,"bloMappedPct":62.36,"ageCutoff":471,"progeny18":389,"progenyPct":93.48,"totalMappedPct":69.16},{"booth":30,"totalElectors":1483,"cutoffElectors":1059,"bloMapped":570,"totalMapped":570,"bloMappedPct":53.82,"ageCutoff":434,"progeny18":352,"progenyPct":73.74,"totalMappedPct":62.17},{"booth":63,"totalElectors":1509,"cutoffElectors":1046,"bloMapped":498,"totalMapped":498,"bloMappedPct":47.61,"ageCutoff":464,"progeny18":259,"progenyPct":64.17,"totalMappedPct":50.17}],"34":[{"booth":45,"totalElectors":1115,"cutoffElectors":729,"bloMapped":401,"totalMapped":401,"bloMappedPct":55.01,"ageCutoff":385,"progeny18":282,"progenyPct":101.49,"totalMappedPct":61.26},{"booth":60,"totalElectors":930,"cutoffElectors":658,"bloMapped":427,"totalMapped":427,"bloMappedPct":64.89,"ageCutoff":289,"progeny18":368,"progenyPct":111.0,"totalMappedPct":85.48},{"booth":134,"totalElectors":899,"cutoffElectors":614,"bloMapped":276,"totalMapped":276,"bloMappedPct":44.95,"ageCutoff":289,"progeny18":308,"progenyPct":86.27,"totalMappedPct":64.96},{"booth":135,"totalElectors":722,"cutoffElectors":514,"bloMapped":374,"totalMapped":374,"bloMappedPct":72.76,"ageCutoff":210,"progeny18":262,"progenyPct":103.96,"totalMappedPct":88.09},{"booth":136,"totalElectors":1354,"cutoffElectors":835,"bloMapped":338,"totalMapped":338,"bloMappedPct":40.48,"ageCutoff":511,"progeny18":495,"progenyPct":109.62,"totalMappedPct":61.52},{"booth":139,"totalElectors":1274,"cutoffElectors":936,"bloMapped":472,"totalMapped":472,"bloMappedPct":50.43,"ageCutoff":343,"progeny18":273,"progenyPct":104.67,"totalMappedPct":58.48}],"36":[{"booth":36,"totalElectors":650,"cutoffElectors":447,"bloMapped":274,"totalMapped":274,"bloMappedPct":61.3,"ageCutoff":204,"progeny18":164,"progenyPct":67.76,"totalMappedPct":67.38},{"booth":37,"totalElectors":971,"cutoffElectors":668,"bloMapped":370,"totalMapped":370,"bloMappedPct":55.39,"ageCutoff":302,"progeny18":291,"progenyPct":71.08,"totalMappedPct":68.07},{"booth":38,"totalElectors":1067,"cutoffElectors":729,"bloMapped":419,"totalMapped":419,"bloMappedPct":57.48,"ageCutoff":342,"progeny18":308,"progenyPct":62.57,"totalMappedPct":68.13},{"booth":41,"totalElectors":1063,"cutoffElectors":825,"bloMapped":414,"totalMapped":414,"bloMappedPct":50.18,"ageCutoff":241,"progeny18":139,"progenyPct":58.43,"totalMappedPct":52.02},{"booth":42,"totalElectors":720,"cutoffElectors":408,"bloMapped":148,"totalMapped":148,"bloMappedPct":36.27,"ageCutoff":324,"progeny18":229,"progenyPct":50.46,"totalMappedPct":52.36}],"38":[{"booth":133,"totalElectors":970,"cutoffElectors":699,"bloMapped":698,"totalMapped":698,"bloMappedPct":99.86,"ageCutoff":272,"progeny18":349,"progenyPct":103.89,"totalMappedPct":107.94},{"booth":138,"totalElectors":917,"cutoffElectors":663,"bloMapped":353,"totalMapped":353,"bloMappedPct":53.24,"ageCutoff":285,"progeny18":235,"progenyPct":84.75,"totalMappedPct":64.12},{"booth":140,"totalElectors":1203,"cutoffElectors":853,"bloMapped":390,"totalMapped":390,"bloMappedPct":45.72,"ageCutoff":350,"progeny18":248,"progenyPct":87.3,"totalMappedPct":53.03},{"booth":166,"totalElectors":1181,"cutoffElectors":794,"bloMapped":411,"totalMapped":411,"bloMappedPct":51.76,"ageCutoff":384,"progeny18":283,"progenyPct":84.58,"totalMappedPct":58.76},{"booth":167,"totalElectors":1173,"cutoffElectors":777,"bloMapped":430,"totalMapped":430,"bloMappedPct":55.34,"ageCutoff":399,"progeny18":360,"progenyPct":89.47,"totalMappedPct":67.35},{"booth":171,"totalElectors":852,"cutoffElectors":617,"bloMapped":334,"totalMapped":334,"bloMappedPct":54.13,"ageCutoff":379,"progeny18":286,"progenyPct":90.26,"totalMappedPct":71.6}],"40":[{"booth":129,"totalElectors":945,"cutoffElectors":697,"bloMapped":412,"totalMapped":412,"bloMappedPct":59.11,"ageCutoff":243,"progeny18":319,"progenyPct":144.84,"totalMappedPct":77.35},{"booth":130,"totalElectors":1276,"cutoffElectors":848,"bloMapped":327,"totalMapped":327,"bloMappedPct":38.56,"ageCutoff":451,"progeny18":316,"progenyPct":81.45,"totalMappedPct":50.39},{"booth":131,"totalElectors":1016,"cutoffElectors":709,"bloMapped":238,"totalMapped":238,"bloMappedPct":33.57,"ageCutoff":306,"progeny18":199,"progenyPct":72.48,"totalMappedPct":43.01},{"booth":132,"totalElectors":1093,"cutoffElectors":754,"bloMapped":378,"totalMapped":378,"bloMappedPct":50.13,"ageCutoff":344,"progeny18":425,"progenyPct":98.9,"totalMappedPct":73.47},{"booth":146,"totalElectors":1337,"cutoffElectors":823,"bloMapped":346,"totalMapped":346,"bloMappedPct":42.04,"ageCutoff":529,"progeny18":402,"progenyPct":68.43,"totalMappedPct":55.95},{"booth":147,"totalElectors":313,"cutoffElectors":192,"bloMapped":100,"totalMapped":100,"bloMappedPct":52.08,"ageCutoff":120,"progeny18":100,"progenyPct":97.64,"totalMappedPct":63.9}],"41":[{"booth":124,"totalElectors":728,"cutoffElectors":498,"bloMapped":292,"totalMapped":292,"bloMappedPct":58.63,"ageCutoff":229,"progeny18":173,"progenyPct":97.11,"totalMappedPct":63.87},{"booth":125,"totalElectors":954,"cutoffElectors":678,"bloMapped":473,"totalMapped":473,"bloMappedPct":69.76,"ageCutoff":274,"progeny18":243,"progenyPct":115.72,"totalMappedPct":75.05},{"booth":126,"totalElectors":761,"cutoffElectors":531,"bloMapped":385,"totalMapped":385,"bloMappedPct":72.5,"ageCutoff":230,"progeny18":166,"progenyPct":123.53,"totalMappedPct":72.4},{"booth":127,"totalElectors":1451,"cutoffElectors":1084,"bloMapped":605,"totalMapped":605,"bloMappedPct":55.81,"ageCutoff":366,"progeny18":246,"progenyPct":72.34,"totalMappedPct":58.65},{"booth":128,"totalElectors":988,"cutoffElectors":687,"bloMapped":451,"totalMapped":451,"bloMappedPct":65.65,"ageCutoff":303,"progeny18":218,"progenyPct":67.6,"totalMappedPct":67.71}],"42":[{"booth":74,"totalElectors":1229,"cutoffElectors":891,"bloMapped":506,"totalMapped":506,"bloMappedPct":56.79,"ageCutoff":338,"progeny18":243,"progenyPct":86.7,"totalMappedPct":60.94},{"booth":76,"totalElectors":888,"cutoffElectors":600,"bloMapped":342,"totalMapped":342,"bloMappedPct":57.0,"ageCutoff":294,"progeny18":204,"progenyPct":63.52,"totalMappedPct":61.49},{"booth":77,"totalElectors":1359,"cutoffElectors":953,"bloMapped":542,"totalMapped":542,"bloMappedPct":56.87,"ageCutoff":408,"progeny18":225,"progenyPct":78.84,"totalMappedPct":56.44},{"booth":112,"totalElectors":1250,"cutoffElectors":889,"bloMapped":457,"totalMapped":457,"bloMappedPct":51.41,"ageCutoff":354,"progeny18":229,"progenyPct":63.78,"totalMappedPct":54.88},{"booth":115,"totalElectors":739,"cutoffElectors":495,"bloMapped":319,"totalMapped":319,"bloMappedPct":64.44,"ageCutoff":244,"progeny18":257,"progenyPct":85.77,"totalMappedPct":77.94},{"booth":117,"totalElectors":1348,"cutoffElectors":951,"bloMapped":578,"totalMapped":578,"bloMappedPct":60.78,"ageCutoff":399,"progeny18":258,"progenyPct":85.68,"totalMappedPct":62.02},{"booth":118,"totalElectors":851,"cutoffElectors":565,"bloMapped":326,"totalMapped":326,"bloMappedPct":57.7,"ageCutoff":286,"progeny18":314,"progenyPct":113.5,"totalMappedPct":75.21}],"46":[{"booth":141,"totalElectors":1062,"cutoffElectors":755,"bloMapped":434,"totalMapped":434,"bloMappedPct":57.48,"ageCutoff":311,"progeny18":288,"progenyPct":99.7,"totalMappedPct":67.98},{"booth":145,"totalElectors":613,"cutoffElectors":382,"bloMapped":229,"totalMapped":229,"bloMappedPct":59.95,"ageCutoff":230,"progeny18":177,"progenyPct":62.3,"totalMappedPct":66.23},{"booth":149,"totalElectors":1043,"cutoffElectors":687,"bloMapped":349,"totalMapped":349,"bloMappedPct":50.8,"ageCutoff":359,"progeny18":243,"progenyPct":66.58,"totalMappedPct":56.76},{"booth":150,"totalElectors":1377,"cutoffElectors":935,"bloMapped":540,"totalMapped":540,"bloMappedPct":57.75,"ageCutoff":445,"progeny18":271,"progenyPct":61.47,"totalMappedPct":58.9}],"48":[{"booth":137,"totalElectors":926,"cutoffElectors":547,"bloMapped":304,"totalMapped":304,"bloMappedPct":55.58,"ageCutoff":373,"progeny18":238,"progenyPct":63.94,"totalMappedPct":58.53},{"booth":176,"totalElectors":951,"cutoffElectors":668,"bloMapped":361,"totalMapped":361,"bloMappedPct":54.04,"ageCutoff":231,"progeny18":218,"progenyPct":182.58,"totalMappedPct":96.45},{"booth":177,"totalElectors":584,"cutoffElectors":425,"bloMapped":247,"totalMapped":247,"bloMappedPct":58.12,"ageCutoff":288,"progeny18":275,"progenyPct":73.44,"totalMappedPct":66.88},{"booth":178,"totalElectors":1233,"cutoffElectors":846,"bloMapped":554,"totalMapped":554,"bloMappedPct":65.48,"ageCutoff":164,"progeny18":171,"progenyPct":73.1,"totalMappedPct":71.58},{"booth":187,"totalElectors":1396,"cutoffElectors":976,"bloMapped":538,"totalMapped":538,"bloMappedPct":55.12,"ageCutoff":143,"progeny18":213,"progenyPct":125.16,"totalMappedPct":87.78}],"59":[{"booth":158,"totalElectors":827,"cutoffElectors":589,"bloMapped":297,"totalMapped":297,"bloMappedPct":50.42,"ageCutoff":241,"progeny18":322,"progenyPct":140.45,"totalMappedPct":74.85},{"booth":159,"totalElectors":800,"cutoffElectors":662,"bloMapped":269,"totalMapped":269,"bloMappedPct":40.63,"ageCutoff":128,"progeny18":135,"progenyPct":140.0,"totalMappedPct":50.5},{"booth":160,"totalElectors":1019,"cutoffElectors":749,"bloMapped":402,"totalMapped":402,"bloMappedPct":53.67,"ageCutoff":280,"progeny18":238,"progenyPct":69.7,"totalMappedPct":62.81},{"booth":161,"totalElectors":1127,"cutoffElectors":825,"bloMapped":553,"totalMapped":553,"bloMappedPct":67.03,"ageCutoff":285,"progeny18":254,"progenyPct":121.43,"totalMappedPct":71.61},{"booth":224,"totalElectors":834,"cutoffElectors":608,"bloMapped":394,"totalMapped":394,"bloMappedPct":64.8,"ageCutoff":226,"progeny18":270,"progenyPct":148.21,"totalMappedPct":79.62},{"booth":225,"totalElectors":754,"cutoffElectors":526,"bloMapped":307,"totalMapped":307,"bloMappedPct":58.37,"ageCutoff":227,"progeny18":232,"progenyPct":115.13,"totalMappedPct":71.49},{"booth":245,"totalElectors":1260,"cutoffElectors":792,"bloMapped":469,"totalMapped":469,"bloMappedPct":59.22,"ageCutoff":468,"progeny18":370,"progenyPct":83.94,"totalMappedPct":66.59},{"booth":246,"totalElectors":1090,"cutoffElectors":685,"bloMapped":410,"totalMapped":410,"bloMappedPct":59.85,"ageCutoff":409,"progeny18":375,"progenyPct":85.88,"totalMappedPct":72.02}],"60":[{"booth":98,"totalElectors":824,"cutoffElectors":618,"bloMapped":299,"totalMapped":299,"bloMappedPct":48.38,"ageCutoff":224,"progeny18":334,"progenyPct":99.18,"totalMappedPct":76.82},{"booth":99,"totalElectors":1354,"cutoffElectors":723,"bloMapped":420,"totalMapped":420,"bloMappedPct":58.09,"ageCutoff":624,"progeny18":779,"progenyPct":136.21,"totalMappedPct":88.55}]};

// ─── Community Classification Data (2002 vs 2025) ────────────────────────────
const COMMUNITY_BROAD_DATA = {
  2002: {
    'Unclassified': 114246, 'Minority': 23579, 'GC': 22351, 'OBC': 16809,
    'GC/OBC': 12028, 'Ambiguous': 1227, 'OBC/Minority': 805, 'OBC/GC': 632,
    'GC/Minority': 277, 'ST': 68,
  },
  2025: {
    'Unclassified': 159371, 'Minority': 30583, 'GC': 26819, 'GC/OBC': 16572,
    'OBC': 13539, 'Ambiguous': 1556, 'OBC/SC': 1417, 'OBC/Minority': 947,
    'OBC/GC': 692, 'GC/Minority': 468, 'ST': 29, 'ST/Minority': 3, 'SC': 2,
  },
};
const COMMUNITY_DETAILED_DATA = {
  2002: [
    ['Mangalorean Catholic', 17308, 'Minority'],
    ['GSB', 12447, 'GC'],
    ['Bunt / Billava / Mogaveera', 9018, 'GC/OBC'],
    ['Billava / Devadiga', 5130, 'OBC'],
    ['Muslim', 5000, 'Minority'],
    ['Brahmin / Multi-community', 4232, 'GC'],
    ['Brahmin', 3205, 'GC'],
    ['Mogaveera', 2740, 'OBC'],
    ['Bunt', 2422, 'GC'],
    ['Devadiga', 1916, 'OBC'],
    ['Bunt / GSB', 1784, 'GC/OBC'],
    ['Vishwakarma', 1487, 'OBC'],
    ['Billava / Artisan', 1472, 'OBC'],
    ['Vishwakarma/GSB Ambiguous', 1227, 'Ambiguous'],
    ['Billava / Mogaveera', 1074, 'OBC'],
    ['Havyaka / Bunt / Gauda', 646, 'GC/OBC'],
    ['Vokkaliga', 868, 'OBC'],
    ['Bhandari / Nalke', 844, 'OBC'],
    ['Billava / Muslim title', 805, 'OBC/Minority'],
    ['Goan / Mangalorean Catholic', 732, 'Minority'],
    ['Trading communities', 632, 'OBC/GC'],
    ['Billava', 567, 'OBC'],
    ['Mangalorean Catholic (Da Silva)', 539, 'Minority'],
    ['GSB / Bunt', 517, 'GC/OBC'],
    ['Coastal Tulu communities', 404, 'OBC'],
    ['GSB / Goan Catholic', 277, 'GC/Minority'],
    ['Sapaliga / Mogaveera', 157, 'OBC'],
    ['Devadiga / Billava', 150, 'OBC'],
    ['Koraga', 68, 'ST'],
    ['Bunt / Jain', 64, 'GC'],
    ['Shivalli Brahmin', 43, 'GC'],
  ],
  2025: [
    ['Mangalorean Catholic', 23035, 'Minority'],
    ['GSB', 14325, 'GC'],
    ['Bunt / Billava / Mogaveera', 11700, 'GC/OBC'],
    ['Muslim', 6932, 'Minority'],
    ['Brahmin / Multi-community', 5348, 'GC'],
    ['Bunt', 4058, 'GC'],
    ['Brahmin', 4021, 'GC'],
    ['Mogaveera', 3180, 'OBC'],
    ['Billava / Devadiga', 2236, 'OBC'],
    ['Bunt / GSB', 2221, 'GC/OBC'],
    ['Billava / Artisan', 2039, 'OBC'],
    ['Vishwakarma/GSB Ambiguous', 1556, 'Ambiguous'],
    ['Devadiga', 1552, 'OBC'],
    ['Billava / Namadari / SC overlap', 1417, 'OBC/SC'],
    ['Billava / Mogaveera', 1064, 'OBC'],
    ['Havyaka / Bunt / Gauda', 1010, 'GC/OBC'],
    ['Vokkaliga', 984, 'OBC'],
    ['Vishwakarma', 952, 'OBC'],
    ['Billava / Muslim title', 947, 'OBC/Minority'],
    ['Trading communities', 692, 'OBC/GC'],
    ['Goan / Mangalorean Catholic', 597, 'Minority'],
    ['Coastal Tulu communities', 580, 'OBC'],
    ['GSB / Goan Catholic', 468, 'GC/Minority'],
    ['GSB / Bunt', 404, 'GC/OBC'],
    ['Bhandari / Nalke', 381, 'OBC'],
    ['Kharvi', 218, 'OBC'],
    ['Bunt / Jain', 202, 'GC'],
    ['Sapaliga / Mogaveera', 172, 'OBC'],
    ['Shivalli Brahmin', 100, 'GC'],
    ['Devadiga / Billava', 90, 'OBC'],
    ['Billava', 48, 'OBC'],
    ['Sapaliga', 43, 'OBC'],
    ['Koraga', 29, 'ST'],
    ['Mangalorean Catholic (Da Silva)', 19, 'Minority'],
    ['Siddi', 3, 'ST/Minority'],
    ['Nalike', 2, 'SC'],
    ['GSB / Daivajna', 2, 'GC'],
  ],
};

const BROAD_COLORS = {
  'Unclassified': '#64748b', 'GC': '#f97316', 'OBC': '#8b5cf6',
  'Minority': '#10b981', 'GC/OBC': '#f59e0b', 'Ambiguous': '#6b7280',
  'OBC/Minority': '#06b6d4', 'OBC/GC': '#a78bfa', 'GC/Minority': '#34d399',
  'ST': '#ef4444', 'OBC/SC': '#ec4899', 'ST/Minority': '#f87171', 'SC': '#fbbf24',
};

function CommunityClassificationPanel() {
  const [activeYear, setActiveYear] = React.useState(2025);
  const [showAll, setShowAll] = React.useState(false);

  const total2002 = 192022;
  const total2025 = 251998;
  const totalMap  = { 2002: total2002, 2025: total2025 };

  const broadCategories = Object.keys({ ...COMMUNITY_BROAD_DATA[2002], ...COMMUNITY_BROAD_DATA[2025] });
  const maxBroadVal = Math.max(
    ...broadCategories.map(k => Math.max(COMMUNITY_BROAD_DATA[2002][k] || 0, COMMUNITY_BROAD_DATA[2025][k] || 0))
  );

  const detailedRows = COMMUNITY_DETAILED_DATA[activeYear];
  const displayRows  = showAll ? detailedRows : detailedRows.slice(0, 12);
  const maxDetail    = detailedRows[0]?.[1] || 1;
  const total        = totalMap[activeYear];

  return (
    <div style={{ marginBottom: 20 }}>
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18,
        padding: '20px 18px', marginBottom: 14,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 3 }}>Community Classification</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Voter roll 2002 vs 2025 — broad category counts</div>
          </div>
          {/* Summary pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { year: 2002, total: total2002, color: '#f59e0b' },
              { year: 2025, total: total2025, color: '#22d3ee' },
            ].map(({ year, total: t, color }) => (
              <div key={year} style={{ background: `${color}12`, border: `1px solid ${color}30`, borderRadius: 10, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: `${color}99`, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{year}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>{(t / 1000).toFixed(0)}k</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>voters</div>
              </div>
            ))}
            <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(16,185,129,0.7)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Growth</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-display)' }}>+31%</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>+59,976</div>
            </div>
          </div>
        </div>

        {/* Broad category comparison bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {broadCategories.map(cat => {
            const v02 = COMMUNITY_BROAD_DATA[2002][cat] || 0;
            const v25 = COMMUNITY_BROAD_DATA[2025][cat] || 0;
            const pct02 = ((v02 / maxBroadVal) * 100).toFixed(1);
            const pct25 = ((v25 / maxBroadVal) * 100).toFixed(1);
            const color = BROAD_COLORS[cat] || '#888';
            const diff  = v25 - v02;
            return (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', minWidth: 90 }}>{cat}</span>
                    {v02 > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{v02.toLocaleString()}</span>}
                    <span style={{ fontSize: 9, color: `${color}99` }}>→</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color }}>{v25.toLocaleString()}</span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '2px 7px',
                    background: diff > 0 ? 'rgba(34,211,238,0.1)' : diff < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                    color: diff > 0 ? '#22d3ee' : diff < 0 ? '#ef4444' : 'rgba(255,255,255,0.3)',
                  }}>
                    {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                  </span>
                </div>
                {/* 2002 bar */}
                {v02 > 0 && (
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 2 }}>
                    <div style={{ width: `${pct02}%`, height: '100%', background: `${color}55`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                )}
                {/* 2025 bar */}
                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct25}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ width: 28, height: 5, background: 'rgba(255,255,255,0.3)', borderRadius: 2, opacity: 0.5 }} />
            <span>2002</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ width: 28, height: 5, background: '#22d3ee', borderRadius: 2 }} />
            <span>2025</span>
          </div>
        </div>
      </div>

      {/* ── Detailed community table ── */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18,
        overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        {/* Tab switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 0', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)', marginBottom: 2 }}>Classified Community Breakdown</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{detailedRows.length} communities · sorted by count</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[2025, 2002].map(yr => (
              <button key={yr} onClick={() => { setActiveYear(yr); setShowAll(false); }} style={{
                padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: activeYear === yr ? (yr === 2025 ? 'rgba(34,211,238,0.15)' : 'rgba(245,158,11,0.15)') : 'rgba(255,255,255,0.04)',
                border: activeYear === yr ? `1px solid ${yr === 2025 ? 'rgba(34,211,238,0.4)' : 'rgba(245,158,11,0.4)'}` : '1px solid rgba(255,255,255,0.08)',
                color: activeYear === yr ? (yr === 2025 ? '#22d3ee' : '#f59e0b') : 'rgba(255,255,255,0.4)',
                transition: 'all 0.15s',
              }}>{yr}</button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 80px', gap: 0, padding: '8px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {['Community', 'Category', 'Count', 'Share'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: h === 'Count' || h === 'Share' ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {displayRows.map(([name, count, cat], idx) => {
          const barW = Math.round((count / maxDetail) * 100);
          const pct  = ((count / total) * 100).toFixed(1);
          const color = BROAD_COLORS[cat] || '#888';
          return (
            <div key={name} style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 90px 80px',
              gap: 0, padding: '11px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)',
              alignItems: 'center',
            }}>
              {/* Name + bar */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 4, lineHeight: 1.3 }}>{name}</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', maxWidth: 160 }}>
                  <div style={{ width: `${barW}%`, height: '100%', background: `linear-gradient(90deg,${color}60,${color})`, borderRadius: 2 }} />
                </div>
              </div>
              {/* Category badge */}
              <div>
                <span style={{
                  fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '3px 7px',
                  background: `${color}18`, color, border: `1px solid ${color}30`,
                  whiteSpace: 'nowrap',
                }}>{cat}</span>
              </div>
              {/* Count */}
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {count.toLocaleString()}
              </div>
              {/* Pct */}
              <div style={{ fontSize: 12, fontWeight: 600, color, textAlign: 'right' }}>{pct}%</div>
            </div>
          );
        })}

        {/* Show more / less */}
        {detailedRows.length > 12 && (
          <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <button onClick={() => setShowAll(v => !v)} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '9px 24px', cursor: 'pointer', fontSize: 13,
              fontWeight: 700, color: 'rgba(255,255,255,0.5)', transition: 'all 0.15s',
            }}>
              {showAll ? '▲ Show less' : `▼ Show all ${detailedRows.length} communities`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
// ─── HMC Religion Breakdown Widget ───────────────────────────────────────────
function HMCWidget({ hmc, loading, label = 'Constituency' }) {
  if (loading) {
    return (
      <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 14px' }}>
        <Skeleton w="50%" h={12} style={{ marginBottom:12 }} />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[0,1,2].map(i => <Skeleton key={i} h={72} radius={10} />)}
        </div>
      </div>
    );
  }
  if (!hmc) return null;

  const H = hmc.H || 0, M = hmc.M || 0, C = hmc.C || 0;
  const total = H + M + C || 1;
  const bars = [
    { key:'H', label:'Hindu',     count:H, color:'#f97316', bg:'rgba(249,115,22,0.1)',  border:'rgba(249,115,22,0.25)' },
    { key:'M', label:'Muslim',    count:M, color:'#10b981', bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.25)' },
    { key:'C', label:'Christian', count:C, color:'#8b5cf6', bg:'rgba(139,92,246,0.1)',  border:'rgba(139,92,246,0.25)' },
  ];

  return (
    <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 14px', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:2 }}>H · M · C Breakdown</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{label} · 2025 Voter Roll</div>
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'3px 8px' }}>
          {total.toLocaleString()} total
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
        {bars.map(({ key, label:lbl, count, color, bg, border }) => {
          const pct = ((count/total)*100).toFixed(1);
          return (
            <div key={key} style={{ background:bg, border:`1px solid ${border}`, borderRadius:10, padding:'12px 10px', textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:800, color, letterSpacing:'0.05em', marginBottom:4 }}>{key}</div>
              <div style={{ fontSize:20, fontWeight:900, color, fontFamily:'var(--font-display)', letterSpacing:'-0.5px', lineHeight:1, marginBottom:4 }}>{count.toLocaleString()}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:600, marginBottom:6 }}>{lbl}</div>
              <div style={{ height:3, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${color}80,${color})`, borderRadius:2, transition:'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize:10, fontWeight:700, color, marginTop:4 }}>{pct}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', height:7, borderRadius:4, overflow:'hidden', gap:1 }}>
        {bars.map(({ key, count, color }) => (
          <div key={key} style={{ width:`${(count/total)*100}%`, background:color, minWidth:count>0?4:0, transition:'width 0.6s ease' }} />
        ))}
      </div>
      <div style={{ display:'flex', gap:12, marginTop:8, justifyContent:'center', flexWrap:'wrap' }}>
        {bars.map(({ key, label:lbl, count, color }) => (
          <div key={key} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.5)' }}>
            <div style={{ width:8, height:8, borderRadius:2, background:color, flexShrink:0 }} />
            <span style={{ fontWeight:700, color }}>{key}</span>
            <span>{count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Polled / NotPolled HMC Widget ────────────────────────────────────────────
// Shows 2023 election data: for each religion, how many Polled vs NotPolled
function PolledHMCWidget({ polledHMC, loading, label = 'Constituency' }) {
  if (loading) {
    return (
      <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 14px' }}>
        <Skeleton w="55%" h={12} style={{ marginBottom:12 }} />
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[0,1,2].map(i => <Skeleton key={i} h={52} radius={10} />)}
        </div>
      </div>
    );
  }
  if (!polledHMC) return null;

  const RELIGIONS = [
    { key:'H', label:'Hindu',     color:'#f97316' },
    { key:'M', label:'Muslim',    color:'#10b981' },
    { key:'C', label:'Christian', color:'#8b5cf6' },
  ];

  const totals = polledHMC.total || { polled:0, notPolled:0, total:0 };
  const grandTotal = totals.total || 1;
  const overallPollPct = grandTotal > 0 ? ((totals.polled / grandTotal) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 14px', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:2 }}>Polled vs Not Polled (HMC)</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{label} · 2023 Election Data</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#22d3ee', fontFamily:'var(--font-display)' }}>{overallPollPct}%</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontWeight:600 }}>Overall Turnout</div>
        </div>
      </div>

      {/* Overall combined bar */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', marginBottom:5 }}>
          <div style={{ width:`${overallPollPct}%`, background:'linear-gradient(90deg,#22d3ee80,#22d3ee)', transition:'width 0.6s ease' }} />
          <div style={{ flex:1, background:'rgba(239,68,68,0.3)' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.3)' }}>
          <span style={{ color:'#22d3ee', fontWeight:700 }}>✓ Polled {totals.polled?.toLocaleString()}</span>
          <span style={{ color:'#f87171', fontWeight:700 }}>✗ Not Polled {totals.notPolled?.toLocaleString()}</span>
        </div>
      </div>

      {/* Per-religion rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {RELIGIONS.map(({ key, label:lbl, color }) => {
          const d = polledHMC[key] || { polled:0, notPolled:0, total:0 };
          const rowTotal = d.total || 1;
          const polledPct = ((d.polled / rowTotal) * 100).toFixed(1);
          const notPct    = ((d.notPolled / rowTotal) * 100).toFixed(1);

          return (
            <div key={key} style={{ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:10, padding:'10px 12px' }}>
              {/* Row header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:20, height:20, borderRadius:5, background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color }}>{key}</div>
                  <span style={{ fontSize:12, fontWeight:700, color }}>{lbl}</span>
                </div>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{d.total?.toLocaleString()} total</span>
              </div>

              {/* Polled / NotPolled split bar */}
              <div style={{ display:'flex', height:6, borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                <div style={{ width:`${polledPct}%`, background:color, transition:'width 0.5s ease' }} />
                <div style={{ flex:1, background:'rgba(239,68,68,0.25)' }} />
              </div>

              {/* Stats row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:color, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color, lineHeight:1 }}>{d.polled?.toLocaleString()}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Polled · {polledPct}%</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:'#ef4444', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#f87171', lineHeight:1 }}>{d.notPolled?.toLocaleString()}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Not Polled · {notPct}%</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Static 2023 Polled vs NotPolled: Broad Category ──────────────────────────
const POLLED_BROAD_DATA = [
  { key: 'GC',        label: 'General Category', color: '#22d3ee', polled: 16684, notPolled: 10777 },
  { key: 'OBC',       label: 'OBC',              color: '#10b981', polled:  9011, notPolled:  5281 },
  { key: 'GC/OBC',   label: 'GC / OBC',         color: '#f59e0b', polled: 10167, notPolled:  6279 },
  { key: 'Minority',  label: 'Minority',          color: '#8b5cf6', polled: 44055, notPolled: 42246 },
  { key: 'OBC/SC',   label: 'OBC / SC',          color: '#ec4899', polled:   843, notPolled:    561 },
  { key: 'ST',        label: 'Scheduled Tribe',   color: '#f97316', polled:    47, notPolled:     31 },
  { key: 'Ambiguous', label: 'Ambiguous',         color: '#64748b', polled:  1053, notPolled:    528 },
];

function PolledBroadCategoryWidget({ loading, label = 'Constituency' }) {
  const [showAll, setShowAll] = React.useState(false);
  const data = POLLED_BROAD_DATA;
  const displayed = showAll ? data : data.slice(0, 5);
  const grandPolled    = data.reduce((s, d) => s + d.polled, 0);
  const grandNotPolled = data.reduce((s, d) => s + d.notPolled, 0);
  const grandTotal     = grandPolled + grandNotPolled;
  const overallPct     = grandTotal > 0 ? ((grandPolled / grandTotal) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 14px' }}>
        <Skeleton w="60%" h={12} style={{ marginBottom:12 }} />
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[0,1,2,3].map(i => <Skeleton key={i} h={52} radius={10} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 14px', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:2 }}>Polled vs Not Polled (Caste Category)</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{label} · 2023 Election Data</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#10b981', fontFamily:'var(--font-display)' }}>{overallPct}%</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontWeight:600 }}>Classified Turnout</div>
        </div>
      </div>

      {/* Overall bar */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', marginBottom:5 }}>
          <div style={{ width:`${overallPct}%`, background:'linear-gradient(90deg,#10b98180,#10b981)', transition:'width 0.6s ease' }} />
          <div style={{ flex:1, background:'rgba(239,68,68,0.3)' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.3)' }}>
          <span style={{ color:'#10b981', fontWeight:700 }}>✓ Polled {grandPolled.toLocaleString()}</span>
          <span style={{ color:'#f87171', fontWeight:700 }}>✗ Not Polled {grandNotPolled.toLocaleString()}</span>
        </div>
      </div>

      {/* Per-category rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {displayed.map(({ key, label:lbl, color, polled, notPolled }) => {
          const rowTotal  = polled + notPolled || 1;
          const polledPct = ((polled / rowTotal) * 100).toFixed(1);
          const notPct    = ((notPolled / rowTotal) * 100).toFixed(1);
          return (
            <div key={key} style={{ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:10, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:22, height:20, borderRadius:5, background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color, letterSpacing:'-0.3px', padding:'0 3px' }}>{key}</div>
                  <span style={{ fontSize:12, fontWeight:700, color }}>{lbl}</span>
                </div>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{(polled+notPolled).toLocaleString()} total</span>
              </div>
              <div style={{ display:'flex', height:6, borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                <div style={{ width:`${polledPct}%`, background:color, transition:'width 0.5s ease' }} />
                <div style={{ flex:1, background:'rgba(239,68,68,0.25)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:color, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color, lineHeight:1 }}>{polled.toLocaleString()}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Polled · {polledPct}%</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:'#ef4444', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#f87171', lineHeight:1 }}>{notPolled.toLocaleString()}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Not Polled · {notPct}%</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length > 5 && (
        <button onClick={() => setShowAll(v => !v)} style={{ marginTop:10, width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 0', cursor:'pointer', fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
          {showAll ? '▲ Show less' : `▼ Show all ${data.length} categories`}
        </button>
      )}
    </div>
  );
}

// ─── Static 2023 Polled vs NotPolled: Community ────────────────────────────────
const POLLED_COMMUNITY_DATA = [
  { key: 'Muslim',           label: 'Muslim',                    color: '#10b981', polled: 22359, notPolled: 22510 },
  { key: 'MangCath',         label: 'Mangalorean Catholic',      color: '#8b5cf6', polled: 12234, notPolled: 10394 },
  { key: 'ChristCath',       label: 'Christian / Catholic',      color: '#a78bfa', polled:  9462, notPolled:  9342 },
  { key: 'GSB',              label: 'GSB',                       color: '#22d3ee', polled:  9062, notPolled:  5743 },
  { key: 'BuntBillMog',      label: 'Bunt / Billava / Mogaveera',color: '#f59e0b', polled:  7146, notPolled:  4422 },
  { key: 'BrahmiMulti',      label: 'Brahmin / Multi-community', color: '#f97316', polled:  3155, notPolled:  2292 },
  { key: 'Brahmin',          label: 'Brahmin',                   color: '#fb923c', polled:  2467, notPolled:  1613 },
  { key: 'Bunt',             label: 'Bunt',                      color: '#fbbf24', polled:  2467, notPolled:  1455 },
  { key: 'Mogaveera',        label: 'Mogaveera',                 color: '#34d399', polled:  2008, notPolled:  1201 },
  { key: 'BillDev',          label: 'Billava / Devadiga',        color: '#6ee7b7', polled:  1631, notPolled:   940 },
  { key: 'BillArt',          label: 'Billava / Artisan',         color: '#5eead4', polled:  1411, notPolled:   862 },
  { key: 'BuntGSB',          label: 'Bunt / GSB',                color: '#67e8f9', polled:  1440, notPolled:   805 },
  { key: 'Devadiga',         label: 'Devadiga',                  color: '#4ade80', polled:  1105, notPolled:   501 },
  { key: 'VishwGSB',         label: 'Vishwakarma / GSB',         color: '#64748b', polled:  1053, notPolled:   528 },
  { key: 'BillSCovlap',      label: 'Billava / SC overlap',      color: '#ec4899', polled:   843, notPolled:   561 },
];

function PolledCommunityWidget({ loading, label = 'Constituency' }) {
  const [showAll, setShowAll] = React.useState(false);
  const data = POLLED_COMMUNITY_DATA;
  const displayed = showAll ? data : data.slice(0, 6);
  const grandPolled    = data.reduce((s, d) => s + d.polled, 0);
  const grandNotPolled = data.reduce((s, d) => s + d.notPolled, 0);
  const grandTotal     = grandPolled + grandNotPolled;
  const overallPct     = grandTotal > 0 ? ((grandPolled / grandTotal) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 14px' }}>
        <Skeleton w="60%" h={12} style={{ marginBottom:12 }} />
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[0,1,2,3].map(i => <Skeleton key={i} h={52} radius={10} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 14px', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:2 }}>Polled vs Not Polled (Community)</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{label} · 2023 Election Data</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:18, fontWeight:900, color:'#f59e0b', fontFamily:'var(--font-display)' }}>{overallPct}%</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontWeight:600 }}>Classified Turnout</div>
        </div>
      </div>

      {/* Overall bar */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', marginBottom:5 }}>
          <div style={{ width:`${overallPct}%`, background:'linear-gradient(90deg,#f59e0b80,#f59e0b)', transition:'width 0.6s ease' }} />
          <div style={{ flex:1, background:'rgba(239,68,68,0.3)' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.3)' }}>
          <span style={{ color:'#f59e0b', fontWeight:700 }}>✓ Polled {grandPolled.toLocaleString()}</span>
          <span style={{ color:'#f87171', fontWeight:700 }}>✗ Not Polled {grandNotPolled.toLocaleString()}</span>
        </div>
      </div>

      {/* Per-community rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {displayed.map(({ key, label:lbl, color, polled, notPolled }) => {
          const rowTotal  = polled + notPolled || 1;
          const polledPct = ((polled / rowTotal) * 100).toFixed(1);
          const notPct    = ((notPolled / rowTotal) * 100).toFixed(1);
          const initial   = lbl.charAt(0).toUpperCase();
          return (
            <div key={key} style={{ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:10, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:20, height:20, borderRadius:5, background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color }}>{initial}</div>
                  <span style={{ fontSize:12, fontWeight:700, color }}>{lbl}</span>
                </div>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{(polled+notPolled).toLocaleString()} total</span>
              </div>
              <div style={{ display:'flex', height:6, borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                <div style={{ width:`${polledPct}%`, background:color, transition:'width 0.5s ease' }} />
                <div style={{ flex:1, background:'rgba(239,68,68,0.25)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:color, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color, lineHeight:1 }}>{polled.toLocaleString()}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Polled · {polledPct}%</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:'#ef4444', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#f87171', lineHeight:1 }}>{notPolled.toLocaleString()}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Not Polled · {notPct}%</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length > 6 && (
        <button onClick={() => setShowAll(v => !v)} style={{ marginTop:10, width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 0', cursor:'pointer', fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
          {showAll ? '▲ Show less' : `▼ Show all ${data.length} communities`}
        </button>
      )}
    </div>
  );
}

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
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>0%</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Avg 60.7%</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>100%</span>
              </div>
            </div>
            {pollBelow && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>Below Avg</div>
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
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 700 }}>Margin</div>
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
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</div>
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
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Supervisors ── */}
        {d.supervisors && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>BLO Supervisors · </span>
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
      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {riskWards.map(([wardNum, d]) => {
          const pCfg   = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.NORMAL;
          const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color: '#8899bb', bg: 'rgba(255,255,255,0.05)' };
          const wName  = WARD_NAMES[wardNum] || d.classification;
          const bjpWin = d.margin > 0;
          return (
            <button
              key={wardNum}
              onClick={() => onSelectWard(String(wardNum))}
              className="risk-ward-btn"
              style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${pCfg.border}`,
                borderRadius: 12, padding: '14px', cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
                minHeight: 100,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = pCfg.bg; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 5px', color: 'rgba(255,255,255,0.4)' }}>{wardNum}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{wName}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: pCfg.color }}>{pCfg.label.split(' ')[0]}</span>
              </div>
              {/* Poll rate */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Poll:</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: d.pollRate < 60.7 ? '#f87171' : '#10b981' }}>{d.pollRate}%</span>
                {d.pollRate < 60.7 && <span style={{ fontSize: 11, color: '#f87171' }}>▼ below avg</span>}
              </div>
              {/* Projection mini-bar */}
              <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', height: 5 }}>
                <div style={{ width: `${d.bjpProj}%`, background: '#f97316' }} />
                <div style={{ width: `${d.congProj}%`, background: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#f97316', fontWeight: 700 }}>BJP {d.bjpProj}%</span>
                <span style={{ fontSize: 11, color: bjpWin ? '#f97316' : '#10b981', fontWeight: 700, background: 'rgba(255,255,255,0.05)', borderRadius: 3, padding: '1px 4px' }}>
                  {bjpWin ? '+' : ''}{d.margin}%
                </span>
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>INC {d.congProj}%</span>
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
      background: 'linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98))',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 18, overflow: 'hidden', marginBottom: 20,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }} className="anim-fade-up">

      {/* Header */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>All Wards — SIR Heatmap</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>38 wards · Tap any ward to drill down</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingTop: 2 }}>
          {[
            { label: 'BJP', color: '#f97316' },
            { label: 'Cont.', color: '#a3a3a3' },
            { label: 'INC', color: '#10b981' },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: color, display: 'inline-block', flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0, padding: '8px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Ward &amp; Classification</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'right' }}>Poll / BJP / INC / SIR%</div>
      </div>

      {/* Ward rows - mobile-friendly 2-line cards */}
      <div style={{ maxHeight: showAll ? 'none' : 500, overflow: showAll ? 'visible' : 'hidden' }}>
        {displayed.map(([wardNum, d]) => {
          const pCfg   = PRIORITY_CONFIG[d.priority] || PRIORITY_CONFIG.NORMAL;
          const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color: '#8899bb', bg: 'rgba(255,255,255,0.05)' };
          const wName  = WARD_NAMES[wardNum] || wardNum;
          const bjpWin = d.margin > 0;
          const isRisk = d.priority !== 'NORMAL';
          return (
            <button
              key={wardNum}
              onClick={() => onSelectWard(String(wardNum))}
              className="ward-heatmap-row heatmap-mobile-card"
              style={{
                width: '100%', border: 'none', textAlign: 'left',
                background: isRisk ? pCfg.bg : 'transparent',
              }}
            >
              {/* Row 1: Ward number, name, classification, priority */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.08)', borderRadius: 5, padding: '3px 7px', color: 'rgba(255,255,255,0.45)', flexShrink: 0, minWidth: 28, textAlign: 'center' }}>{wardNum}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wName}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: clsCfg.color, background: clsCfg.bg, borderRadius: 5, padding: '3px 8px', flexShrink: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.classification.replace('STRONGHOLD','STRGHLD').replace('FAVOURABLE','FAV').replace('CONGRESS','INC').replace('CONTESTED','CONT')}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: pCfg.color, flexShrink: 0 }}>{pCfg.label.split(' ')[0]}</span>
              </div>
              {/* Row 2: Stats bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {/* Projection mini bar */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', height: 4 }}>
                    <div style={{ width: `${d.bjpProj}%`, background: '#f97316' }} />
                    <div style={{ width: `${d.congProj}%`, background: '#10b981' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                      Poll: <span style={{ color: d.pollRate < 60.7 ? '#f87171' : '#10b981', fontWeight: 700 }}>{d.pollRate}%</span>
                    </span>
                    <span style={{ fontSize: 11, color: '#f97316', fontWeight: 700 }}>BJP {d.bjpProj}%</span>
                    <span style={{ fontSize: 11, color: bjpWin ? '#f97316' : '#10b981', fontWeight: 800, background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '0 5px' }}>
                      {bjpWin ? '+' : ''}{d.margin}%
                    </span>
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>INC {d.congProj}%</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                      SIR: <span style={{ color: d.totalMapped >= 65 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{d.totalMapped.toFixed(1)}%</span>
                    </span>
                  </div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18, paddingLeft: 12, flexShrink: 0 }}>›</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Show more toggle */}
      {wards.length > 20 && (
        <button onClick={() => setShowAll(s => !s)} className="touch-btn" style={{
          width: '100%', padding: '16px', border: 'none', background: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.06)', color: '#22d3ee',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {showAll ? '▲ Show less' : `▼ Show all ${wards.length} wards`}
        </button>
      )}
    </div>
  );
}

// ─── Booth Detail Card — shown full-width at top when booth is selected ────────
function BoothDetailCard({ wardNum, boothNum, wardStats, boothStats, boothStatsLoading, boothError, onClearBooth, onClearWard }) {
  const boothSIRData = (SIR_BOOTH_DATA[String(wardNum)] || []).find(b => String(b.booth) === String(boothNum));
  const wardName     = wardStats?.wardName || WARD_NAMES[wardNum] || `Ward ${wardNum}`;
  const wardSIR      = SIR_WARD_DATA[Number(wardNum)];
  const clsCfg       = wardSIR ? (CLASSIFICATION_CONFIG[wardSIR.classification] || { color: '#8899bb', bg: 'rgba(255,255,255,0.05)', label: wardSIR.classification }) : null;

  return (
    <div className="anim-fade-up" style={{ marginBottom: 24 }}>

      {/* ── Booth Hero Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,211,238,0.14) 0%, rgba(10,18,35,0.98) 100%)',
        border: '1px solid rgba(34,211,238,0.3)',
        borderRadius: boothStatsLoading || !boothStats ? 18 : '18px 18px 0 0',
        padding: '14px 16px',
      }}>
        {/* Top row: icon + booth name + close button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(34,211,238,0.15)', border: '2px solid rgba(34,211,238,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🗳</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#22d3ee', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              Booth {boothNum}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(34,211,238,0.7)', fontWeight: 600, marginTop: 1 }}>
              {wardName} · Ward {wardNum}
            </div>
          </div>
          {boothStatsLoading && <span className="spinner" style={{ flexShrink: 0 }} />}
          <button
            onClick={onClearWard}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {clsCfg && (
            <span style={{ fontSize: 11, fontWeight: 700, color: clsCfg.color, background: clsCfg.bg, borderRadius: 6, padding: '4px 10px', border: `1px solid ${clsCfg.color}30` }}>
              {clsCfg.label}
            </span>
          )}
          {wardSIR && (
            <span style={{ fontSize: 11, fontWeight: 700, color: wardSIR.margin > 0 ? '#f97316' : '#10b981', background: wardSIR.margin > 0 ? 'rgba(249,115,22,0.12)' : 'rgba(16,185,129,0.12)', borderRadius: 6, padding: '4px 10px' }}>
              {wardSIR.margin > 0 ? '+' : ''}{wardSIR.margin}% {wardSIR.margin > 0 ? 'BJP' : 'INC'} margin
            </span>
          )}
        </div>

        {/* Back to Ward button — full width on mobile */}
        <button
          onClick={onClearBooth}
          style={{ width: '100%', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 42 }}
        >
          ↩ Back to Ward
        </button>
      </div>

      {boothStatsLoading && (
        <div style={{ background: 'rgba(10,18,34,0.97)', border: '1px solid rgba(34,211,238,0.2)', borderTop: 'none', borderRadius: '0 0 18px 18px', padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
          <span className="spinner" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          Loading booth data…
        </div>
      )}

      {!boothStatsLoading && boothStats && (
        <div style={{ background: 'rgba(10,18,34,0.97)', border: '1px solid rgba(34,211,238,0.2)', borderTop: 'none', borderRadius: '0 0 18px 18px', overflow: 'hidden' }}>

          {/* ── SIR Booth Intelligence Banner ── */}
          {boothSIRData && (
            <div style={{ background: 'rgba(34,211,238,0.04)', borderBottom: '1px solid rgba(34,211,238,0.1)', padding: '14px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>SIR Status</span>
              {[
                { label: 'BLO Map', val: boothSIRData.bloMappedPct + '%', ok: boothSIRData.bloMappedPct >= 60, color: '#22d3ee' },
                { label: 'Progeny', val: boothSIRData.progenyPct + '%', ok: boothSIRData.progenyPct >= 80, color: '#a78bfa' },
                { label: 'Mapped',  val: boothSIRData.totalMappedPct + '%', ok: boothSIRData.totalMappedPct >= 65, color: '#f59e0b' },
              ].map(({ label, val, ok, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 8, padding: '6px 12px' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: ok ? color : '#f87171' }}>{val}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                  <span style={{ fontSize: 12, color: ok ? '#10b981' : '#ef4444' }}>{ok ? '✓' : '⚠'}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '20px' }}>

            {/* ── 2026 Voter Roll Data — BIG metric cards ── */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
                2026 Voter Roll · Booth {boothNum} Data
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Electors', value: boothStats.totalElectors,    color: '#22d3ee', icon: '👥' },
                  { label: 'Cutoff Elec',    value: boothStats.cutoffElec,        color: '#f59e0b', icon: '📅' },
                  { label: 'BLO Mapped',     value: boothStats.bloMapped,         color: '#10b981', icon: '✔' },
                  { label: 'Total Mapped',   value: boothStats.totalMapped,       color: '#10b981', icon: '📋' },
                  { label: 'Age ≤ Cutoff',   value: boothStats.ageCutoff,         color: '#8b5cf6', icon: '🎂' },
                  { label: 'Progeny >18',    value: boothStats.progeny18,         color: '#a78bfa', icon: '🌱' },
                  { label: 'Elec Mapped',    value: boothStats.electorsMapped,    color: '#f97316', icon: '🗺' },
                ].filter(x => x.value !== undefined && x.value !== '' && x.value !== 0).map(({ label, value, color, icon }) => {
                  const totalE = boothStats.totalElectors || 1;
                  const pct    = typeof value === 'number' ? Math.round(value / totalE * 100) : null;
                  return (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: 14, padding: '16px 14px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -12, right: -12, width: 50, height: 50, borderRadius: '50%', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)` }} />
                      <div style={{ fontSize: 18, marginBottom: 8 }}>{icon}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', marginBottom: 4 }}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: pct !== null ? 8 : 0 }}>{label}</div>
                      {pct !== null && (
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: `linear-gradient(90deg,${color}80,${color})`, borderRadius: 2, transition: 'width 0.6s ease' }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Percentage tiles */}
                {[
                  { label: '% BLO Mapped',  value: boothStats.pctBloMapped,      color: '#10b981' },
                  { label: '% Progeny',      value: boothStats.pctProgeny,        color: '#a78bfa' },
                  { label: '% Elec Mapped',  value: boothStats.pctElectorsMapped, color: '#f97316' },
                  { label: '% Completed',    value: boothStats.pctTotalCompleted, color: '#22d3ee' },
                ].filter(x => x.value !== undefined && x.value !== '' && x.value !== 0).map(({ label, value, color }) => {
                  const pctVal = typeof value === 'number' ? value : parseFloat(String(value).replace('%', ''));
                  const display = typeof value === 'number' ? value.toFixed(2) + '%' : String(value).replace('%','') + '%';
                  const isLow  = pctVal < 60;
                  return (
                    <div key={label} style={{ background: isLow ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isLow ? 'rgba(239,68,68,0.2)' : color + '22'}`, borderRadius: 14, padding: '16px 14px' }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: isLow ? '#f87171' : color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', marginBottom: 4 }}>
                        {display}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 8 }}>{label}</div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
                        <div style={{ width: `${Math.min(pctVal, 100)}%`, height: '100%', background: isLow ? '#ef4444' : `linear-gradient(90deg,${color}80,${color})`, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Survey Coverage ── */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
                Survey Coverage · Booth {boothNum}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Surveys Done', value: boothStats.totalReg,                 color: '#f59e0b', pct: boothStats.totalElectors ? Math.round(boothStats.totalReg / boothStats.totalElectors * 100) : 0, icon: '📝' },
                  { label: 'Houses',        value: boothStats.houseCount,               color: '#10b981', pct: 100, icon: '🏠' },
                  { label: 'Male',          value: boothStats.regMale,                  color: '#22d3ee', pct: boothStats.totalReg ? Math.round(boothStats.regMale / boothStats.totalReg * 100) : 0, icon: '♂' },
                  { label: 'Female',        value: boothStats.regFemale,                color: '#ec4899', pct: boothStats.totalReg ? Math.round(boothStats.regFemale / boothStats.totalReg * 100) : 0, icon: '♀' },
                  { label: 'Coverage',      value: `${boothStats.coveragePct}%`,        color: '#8b5cf6', pct: Math.min(boothStats.coveragePct, 100), icon: '◈', isHighlight: true },
                ].map(({ label, value, color, pct, icon, isHighlight }) => (
                  <div key={label} style={{ background: isHighlight ? `${color}12` : 'rgba(255,255,255,0.04)', border: `1px solid ${isHighlight ? color + '35' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '18px 16px' }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: isHighlight ? 30 : 26, fontWeight: 900, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', marginBottom: 4, lineHeight: 1 }}>
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 10 }}>{label}</div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${color}70,${color})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, textAlign: 'right', fontWeight: 600 }}>{pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2023 Polled vs Not Polled HMC ── */}
            {boothStats.polledHMC && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, marginTop: 4 }}>
                <PolledHMCWidget
                  polledHMC={boothStats.polledHMC}
                  loading={false}
                  label={`Ward ${wardNum} · Booth ${boothNum}`}
                />
              </div>
            )}
          </div>

        </div>
      )}

      {boothError && (
        <div className="alert alert-error" style={{ marginTop: 8, borderRadius: 12 }}>⚠ {boothError}</div>
      )}
    </div>
  );
}

// ─── Ward-level SIR Booth Drill-Down Table ────────────────────────────────────
function WardBoothDrillDown({ wardNum }) {
  const booths = SIR_BOOTH_DATA[String(wardNum)];
  if (!booths || booths.length === 0) return null;

  const wardTotal = booths.reduce((a, b) => a + b.totalElectors, 0);
  const wardBLO   = booths.reduce((a, b) => a + b.bloMapped, 0);
  const wardProg  = booths.reduce((a, b) => a + b.progeny18, 0);
  const wardMapped= booths.reduce((a, b) => a + b.totalMapped, 0);
  const weakBooths = booths.filter(b => b.totalMappedPct < 60);
  const strongBooths = booths.filter(b => b.totalMappedPct >= 75);

  return (
    <div style={{
      background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))',
      border: '1px solid rgba(34,211,238,0.15)',
      borderRadius: 14, overflow: 'hidden', marginTop: 16,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(34,211,238,0.1),rgba(34,211,238,0.02))',
        borderBottom: '1px solid rgba(34,211,238,0.12)',
        padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📋</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#22d3ee' }}>Booth-Level SIR Drill-Down</div>
            <div style={{ fontSize: 10, color: 'rgba(34,211,238,0.5)', marginTop: 1 }}>{booths.length} booths · {wardTotal.toLocaleString()} total electors</div>
          </div>
        </div>
        {/* Ward totals */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'BLO Mapped', val: ((wardBLO/wardTotal)*100).toFixed(1)+'%', ok: wardBLO/wardTotal >= 0.6, color: '#22d3ee' },
            { label: 'Progeny', val: wardProg.toLocaleString(), ok: true, color: '#a78bfa' },
            { label: 'Weak Booths', val: weakBooths.length, ok: weakBooths.length === 0, color: weakBooths.length > 0 ? '#f87171' : '#10b981' },
          ].map(({ label, val, ok, color }) => (
            <div key={label} style={{ background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 8, padding: '4px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak booths alert */}
      {weakBooths.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.07)', borderBottom: '1px solid rgba(239,68,68,0.12)', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚠</span>
          <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>
            {weakBooths.length} booth{weakBooths.length > 1 ? 's' : ''} below 60% SIR mapping: Booths {weakBooths.map(b => b.booth).join(', ')}
          </span>
        </div>
      )}

      {/* Column headers */}
      <div className="booth-table-row" style={{ cursor: 'default', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {['#', 'Electors', 'BLO%', 'Prg%', 'Map%', 'Status'].map(h => (
          <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
        ))}
      </div>

      {/* Table rows */}
      {booths.map(b => {
        const weak = b.totalMappedPct < 60;
        const good = b.totalMappedPct >= 75;
        const rowColor = weak ? 'rgba(239,68,68,0.05)' : good ? 'rgba(16,185,129,0.04)' : 'transparent';
        return (
          <div key={b.booth} className="booth-table-row" style={{ background: rowColor }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#22d3ee' }}>{b.booth}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{b.totalElectors.toLocaleString()}</div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: b.bloMappedPct >= 60 ? '#10b981' : '#f87171' }}>{b.bloMappedPct}%</span>
              <div style={{ marginTop: 3, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                <div style={{ width: `${Math.min(b.bloMappedPct, 100)}%`, height: '100%', background: b.bloMappedPct >= 60 ? '#10b981' : '#ef4444', borderRadius: 2 }} />
              </div>
            </div>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: b.progenyPct >= 80 ? '#a78bfa' : '#f59e0b' }}>{b.progenyPct}%</span>
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: weak ? '#f87171' : good ? '#10b981' : '#f59e0b' }}>{b.totalMappedPct}%</span>
              <div style={{ marginTop: 3, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                <div style={{ width: `${Math.min(b.totalMappedPct, 100)}%`, height: '100%', background: weak ? '#ef4444' : good ? '#10b981' : '#f59e0b', borderRadius: 2 }} />
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: weak ? '#f87171' : good ? '#10b981' : '#f59e0b', background: weak ? 'rgba(239,68,68,0.12)' : good ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', borderRadius: 6, padding: '4px 8px', display: 'inline-block' }}>
                {weak ? '⚠ LOW' : good ? '✓ GOOD' : '~ OK'}
              </span>
            </div>
          </div>
        );
      })}

      {/* Bar chart summary */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Booth Mapping Distribution</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 52 }}>
          {booths.map(b => {
            const h = Math.round((b.totalMappedPct / 120) * 52);
            const color = b.totalMappedPct < 60 ? '#ef4444' : b.totalMappedPct >= 75 ? '#10b981' : '#f59e0b';
            return (
              <div key={b.booth} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', height: h, background: `${color}cc`, borderRadius: '3px 3px 0 0', minHeight: 4 }} title={`Booth ${b.booth}: ${b.totalMappedPct}%`} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>{b.booth}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Ward Political Snapshot (for selected ward, shown near top) ───────────────
function WardPoliticalSnapshot({ wardNum }) {
  const d = SIR_WARD_DATA[Number(wardNum)];
  if (!d) return null;
  const pCfg   = PRIORITY_CONFIG[d.priority]   || PRIORITY_CONFIG.NORMAL;
  const clsCfg = CLASSIFICATION_CONFIG[d.classification] || { color: '#8899bb', bg: 'rgba(255,255,255,0.05)', label: d.classification };
  const bjpWin = d.margin > 0;
  const isTight = Math.abs(d.margin) < 10;
  const pollBelow = d.pollRate < 60.7;
  const booths = SIR_BOOTH_DATA[String(wardNum)] || [];
  const weakCount = booths.filter(b => b.totalMappedPct < 60).length;

  return (
    <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }} className="anim-fade-up">

      {/* Poll rate card */}
      <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: `1px solid ${pollBelow ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`, borderRadius: 14, padding: '16px' }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Voter Turnout</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: pollBelow ? '#f87171' : '#10b981', fontFamily: 'var(--font-display)' }}>{d.pollRate}%</span>
          <span style={{ fontSize: 12, color: pollBelow ? '#f87171' : '#10b981', fontWeight: 700 }}>{pollBelow ? '▼' : '▲'} {Math.abs((d.pollRate-60.7).toFixed(1))}% vs avg</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '60.7%', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.35)', zIndex: 2 }} />
          <div style={{ width: `${d.pollRate}%`, height: '100%', background: pollBelow ? 'linear-gradient(90deg,#ef444480,#ef4444)' : 'linear-gradient(90deg,#10b98180,#10b981)', borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6, textAlign: 'right' }}>Constituency avg: 60.7%</div>
      </div>

      {/* BJP vs INC card */}
      <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px' }}>
        <div className="section-label" style={{ marginBottom: 10 }}>Political Projection</div>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 24, marginBottom: 10 }}>
          <div style={{ width: `${d.bjpProj}%`, background: 'linear-gradient(90deg,#f97316,#fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {d.bjpProj > 20 && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{d.bjpProj}%</span>}
          </div>
          <div style={{ flex: 1, background: 'linear-gradient(90deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {d.congProj > 20 && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{d.congProj}%</span>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>BJP {d.bjpProj}%</span>
          <div style={{ background: isTight ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isTight ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, padding: '4px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: bjpWin ? '#f97316' : '#10b981' }}>{bjpWin ? '+' : ''}{d.margin}%</div>
            {isTight && <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>⚠ TIGHT</div>}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>INC {d.congProj}%</span>
        </div>
      </div>

      {/* SIR survey card */}
      <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px' }}>
        <div className="section-label" style={{ marginBottom: 12 }}>SIR Survey Status</div>
        {[
          { label: 'BLO Mapped', val: d.bloMapped, threshold: 60, color: '#22d3ee' },
          { label: 'Progeny 18+', val: d.progeny, threshold: 80, color: '#a78bfa' },
          { label: 'Total Mapped', val: d.totalMapped, threshold: 65, color: '#f59e0b' },
        ].map(({ label, val, threshold, color }) => {
          const ok = val >= threshold;
          return (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: ok ? color : '#f87171' }}>{val.toFixed(1)}% {ok ? '✓' : '⚠'}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                <div style={{ width: `${Math.min(val, 100)}%`, height: '100%', background: ok ? color : '#ef4444', borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
        {weakCount > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', fontWeight: 600 }}>⚠ {weakCount} booth{weakCount > 1 ? 's' : ''} below 60%</div>
        )}
      </div>

      {/* Community card */}
      <div style={{ background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px' }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Community Composition</div>
        {[
          { label: 'Hindu', pct: d.hindu, color: '#f97316' },
          { label: 'Muslim', pct: d.muslim, color: '#10b981' },
          { label: 'Christian', pct: d.christian, color: '#8b5cf6' },
        ].map(({ label, pct, color }) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 11, background: clsCfg.bg, color: clsCfg.color, borderRadius: 6, padding: '4px 9px', fontWeight: 700 }}>{clsCfg.label}</span>
          <span style={{ fontSize: 11, background: pCfg.bg, color: pCfg.color, borderRadius: 6, padding: '4px 9px', fontWeight: 700 }}>{pCfg.label}</span>
        </div>
      </div>

    </div>
  );
}

// ─── Ward vs Constituency Comparison Panel ────────────────────────────────────
function WardVsConstituency({ wardNum }) {
  const d = SIR_WARD_DATA[Number(wardNum)];
  if (!d) return null;

  const allWards = Object.values(SIR_WARD_DATA);
  const avgPoll    = (allWards.reduce((s, w) => s + w.pollRate, 0)    / allWards.length).toFixed(1);
  const avgBLO     = (allWards.reduce((s, w) => s + w.bloMapped, 0)   / allWards.length).toFixed(1);
  const avgTotal   = (allWards.reduce((s, w) => s + w.totalMapped, 0) / allWards.length).toFixed(1);
  const avgElectors= Math.round(allWards.reduce((s, w) => s + w.totalElectors, 0) / allWards.length);

  // rank this ward
  const sortedPoll  = [...allWards].sort((a,b) => b.pollRate    - a.pollRate);
  const sortedMapped= [...allWards].sort((a,b) => b.totalMapped - a.totalMapped);
  const sortedBLO   = [...allWards].sort((a,b) => b.bloMapped   - a.bloMapped);

  const rankPoll  = sortedPoll.findIndex(w => w.pollRate    === d.pollRate)    + 1;
  const rankMapped= sortedMapped.findIndex(w => w.totalMapped=== d.totalMapped)+ 1;
  const rankBLO   = sortedBLO.findIndex(w => w.bloMapped   === d.bloMapped)   + 1;
  const total38   = allWards.length;

  const metrics = [
    { label: 'Voter Turnout',  ward: d.pollRate,    avg: parseFloat(avgPoll),    rank: rankPoll,   unit: '%', threshold: 60.7,  color: '#22d3ee' },
    { label: 'BLO Mapped',    ward: d.bloMapped,   avg: parseFloat(avgBLO),     rank: rankBLO,    unit: '%', threshold: 60,    color: '#f59e0b' },
    { label: 'Total Mapped',  ward: d.totalMapped, avg: parseFloat(avgTotal),   rank: rankMapped, unit: '%', threshold: 65,    color: '#10b981' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(145deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '14px', marginTop: 16,
    }} className="anim-fade-up">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Ward vs Constituency Average</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>How Ward {wardNum} compares across {total38} wards</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {metrics.map(({ label, ward, avg, rank, unit, threshold, color }) => {
          const aboveAvg = ward >= avg;
          const aboveThreshold = ward >= threshold;
          const wardW  = Math.min(ward / 1.2, 100);
          const avgW   = Math.min(avg  / 1.2, 100);

          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 7px' }}>Avg {avg}{unit}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: aboveThreshold ? color : '#f87171' }}>{ward}{unit}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 7px' }}>#{rank}</span>
                </div>
              </div>
              {/* Dual bar: ward vs avg */}
              <div style={{ position: 'relative', height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: `${avgW}%`, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.35)', zIndex: 2 }} />
                <div style={{ width: `${wardW}%`, height: '100%', background: aboveThreshold ? `linear-gradient(90deg,${color}80,${color})` : 'linear-gradient(90deg,#ef444480,#ef4444)', borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{aboveAvg ? `▲ ${(ward - avg).toFixed(1)}${unit} above avg` : `▼ ${(avg - ward).toFixed(1)}${unit} below avg`}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Rank {rank} / {total38}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Electors info */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'This Ward', val: d.totalElectors.toLocaleString(), color: '#f59e0b', sub: 'Total Electors' },
          { label: 'Avg Ward',  val: avgElectors.toLocaleString(), color: '#22d3ee', sub: 'Avg Electors' },
          { label: 'Margin',    val: `${d.bjpWin || d.margin > 0 ? '+' : ''}${d.margin}%`, color: d.margin > 0 ? '#f97316' : '#10b981', sub: d.margin > 0 ? 'BJP leads' : 'INC leads' },
        ].map(({ label, val, color, sub }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Constituency-level SIR Summary (shown on overall view) ───────────────────
function ConstituencySIRSummary() {
  const allWards = Object.entries(SIR_WARD_DATA);
  const total    = allWards.length;

  // Classification breakdown
  const clsCounts = {};
  allWards.forEach(([, d]) => {
    const key = d.classification;
    clsCounts[key] = (clsCounts[key] || 0) + 1;
  });

  // Priority distribution
  const priCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, WATCH: 0, NORMAL: 0 };
  allWards.forEach(([, d]) => { priCounts[d.priority] = (priCounts[d.priority] || 0) + 1; });

  // Aggregates
  const avgPoll    = (allWards.reduce((s,[,d]) => s + d.pollRate,    0) / total).toFixed(1);
  const avgMapped  = (allWards.reduce((s,[,d]) => s + d.totalMapped, 0) / total).toFixed(1);
  const avgBLO     = (allWards.reduce((s,[,d]) => s + d.bloMapped,   0) / total).toFixed(1);
  const totalElect = allWards.reduce((s,[,d]) => s + d.totalElectors, 0);

  const bjpWards   = allWards.filter(([,d]) => d.margin > 0).length;
  const congWards  = allWards.filter(([,d]) => d.margin < 0).length;
  const tightWards = allWards.filter(([,d]) => Math.abs(d.margin) < 10).length;

  // Weakest 5 wards by totalMapped
  const weakest5 = [...allWards].sort(([,a],[,b]) => a.totalMapped - b.totalMapped).slice(0, 5);

  return (
    <div style={{
      background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))',
      border: '1px solid rgba(139,92,246,0.22)',
      borderRadius: 18, overflow: 'hidden', marginBottom: 20,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }} className="anim-fade-up">
      {/* Header */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(135deg,rgba(139,92,246,0.1),transparent)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa' }}>📊 Constituency SIR Intelligence</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Mangaluru City South · {total} wards · {totalElect.toLocaleString()} total electors</div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'BJP Wards',    val: bjpWards,           color: '#f97316', sub: 'BJP leading', icon: '🚩' },
            { label: 'INC Wards',    val: congWards,          color: '#10b981', sub: 'Congress leading', icon: '🏳️' },
            { label: 'Tight Races',  val: tightWards,         color: '#f59e0b', sub: 'Margin < 10%', icon: '⚖️' },
            { label: 'Avg Turnout',  val: avgPoll+'%',        color: '#22d3ee', sub: 'Across all wards', icon: '🗳' },
            { label: 'Avg BLO Map',  val: avgBLO+'%',         color: '#f59e0b', sub: 'SIR survey', icon: '📋' },
            { label: 'Avg Mapped',   val: avgMapped+'%',      color: '#10b981', sub: 'Total completion', icon: '◈' },
          ].map(({ label, val, color, sub, icon }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: 12, padding: '14px 12px' }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>{val}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Priority Distribution */}
        <div style={{ marginBottom: 18 }}>
          <div className="section-label">Priority Distribution</div>
          <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden', gap: 1 }}>
            {Object.entries(priCounts).filter(([,v]) => v > 0).map(([p, cnt]) => {
              const cfg = PRIORITY_CONFIG[p];
              const w   = (cnt / total * 100).toFixed(1);
              return (
                <div key={p} style={{ width: `${w}%`, background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: cnt > 0 ? 24 : 0 }} title={`${p}: ${cnt} wards`}>
                  {cnt >= 2 && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{cnt}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            {Object.entries(priCounts).filter(([,v]) => v > 0).map(([p, cnt]) => {
              const cfg = PRIORITY_CONFIG[p];
              return (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                  <div style={{ width: 9, height: 9, borderRadius: 3, background: cfg.color }} />
                  {cfg.label.split(' ').slice(1).join(' ')}: {cnt}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weakest wards */}
        <div>
          <div className="section-label">⚠ Weakest Wards by SIR Mapping</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weakest5.map(([wNum, wd]) => {
              const pCfg = PRIORITY_CONFIG[wd.priority] || PRIORITY_CONFIG.NORMAL;
              const wName = WARD_NAMES[wNum] || wNum;
              return (
                <div key={wNum} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10, minHeight: 52 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.07)', borderRadius: 5, padding: '3px 7px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{wNum}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', flex: 1 }}>{wName}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pCfg.color, flexShrink: 0 }}>{pCfg.label.split(' ')[0]}</span>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>{wd.totalMapped.toFixed(1)}%</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>mapped</div>
                  </div>
                  <div style={{ width: 50, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, flexShrink: 0 }}>
                    <div style={{ width: `${Math.min(wd.totalMapped, 100)}%`, height: '100%', background: '#ef4444', borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// WARD LOCAL PLACES — Add/view clubs, temples, churches, mosques per ward
// Stored in MongoDB 'WardData' collection via /api/ward-places/
// ════════════════════════════════════════════════════════════════════════════════

const PLACE_TYPES = [
  {
    key: 'club',
    label: 'Local Club',
    color: '#f59e0b',
    accent: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: 'temple',
    label: 'Temple',
    color: '#f97316',
    accent: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.25)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7h20L12 2z"/><rect x="4" y="7" width="16" height="13"/><rect x="9" y="12" width="6" height="8"/>
        <line x1="12" y1="7" x2="12" y2="2"/>
      </svg>
    ),
  },
  {
    key: 'church',
    label: 'Church',
    color: '#8b5cf6',
    accent: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.25)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="7"/><line x1="9.5" y1="4.5" x2="14.5" y2="4.5"/>
        <path d="M5 20v-8l7-5 7 5v8H5z"/><rect x="9" y="14" width="6" height="6"/>
      </svg>
    ),
  },
  {
    key: 'mosque',
    label: 'Mosque',
    color: '#10b981',
    accent: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18"/><path d="M5 20V10a7 7 0 0 1 14 0v10"/>
        <path d="M12 3a3 3 0 0 1 3 3"/><path d="M9 6a3 3 0 0 1 3-3"/>
        <rect x="9" y="14" width="6" height="6"/>
      </svg>
    ),
  },
];

function WardLocalPlaces({ wardNum }) {
  const wardName = WARD_NAMES[wardNum] || `Ward ${wardNum}`;
  const [places,        setPlaces]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [activeType,    setActiveType]    = useState('club');
  const [showForm,      setShowForm]      = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [form,          setForm]          = useState({ name: '', address: '' });
  const [formErr,       setFormErr]       = useState('');

  // Load places for this ward
  useEffect(() => {
    setLoading(true); setError('');
    api.get('/api/ward-places/', { params: { ward: wardNum } })
      .then(r => { if (r.data.success) setPlaces(r.data.places || []); else setError(r.data.message || 'Failed to load.'); })
      .catch(e => setError(e.userMessage || 'Network error.'))
      .finally(() => setLoading(false));
  }, [wardNum]);

  const groupedPlaces = PLACE_TYPES.reduce((acc, t) => {
    acc[t.key] = places.filter(p => p.type === t.key);
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!form.name.trim()) { setFormErr('Name is required.'); return; }
    setSaving(true); setFormErr('');
    try {
      const r = await api.post('/api/ward-places/', {
        ward:     wardNum,
        wardName: wardName,
        type:     activeType,
        name:     form.name.trim(),
        address:  form.address.trim(),
      });
      if (r.data.success) {
        setPlaces(prev => [...prev, r.data.place]);
        setForm({ name: '', address: '' });
        setShowForm(false);
      } else {
        setFormErr(r.data.message || 'Save failed.');
      }
    } catch (e) {
      setFormErr(e.userMessage || 'Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (placeId) => {
    setDeletingId(placeId);
    try {
      const r = await api.delete('/api/ward-places/', { data: { id: placeId } });
      if (r.data.success) setPlaces(prev => prev.filter(p => p._id !== placeId));
    } catch {} finally { setDeletingId(null); }
  };

  const activeCfg   = PLACE_TYPES.find(t => t.key === activeType);
  const activePlaces = groupedPlaces[activeType] || [];

  return (
    <div style={{
      background: 'linear-gradient(145deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 18, overflow: 'hidden', marginBottom: 20,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Local Places
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Ward {wardNum} · {wardName}</div>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormErr(''); setForm({ name:'', address:'' }); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: showForm ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.14)',
            border: `1px solid ${showForm ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.35)'}`,
            borderRadius: 10, padding: '7px 14px',
            color: showForm ? '#f87171' : '#a5b4fc',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.18s',
          }}
        >
          {showForm ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Cancel
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Place
            </>
          )}
        </button>
      </div>

      {/* Type selector tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
        {PLACE_TYPES.map(t => {
          const isActive = activeType === t.key;
          const count    = groupedPlaces[t.key]?.length || 0;
          return (
            <button key={t.key}
              onClick={() => { setActiveType(t.key); setShowForm(false); setForm({ name:'', address:'' }); }}
              style={{
                flex: 1, minWidth: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 8px',
                background: isActive ? t.accent : 'transparent',
                borderBottom: isActive ? `2px solid ${t.color}` : '2px solid transparent',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                color: isActive ? t.color : 'rgba(255,255,255,0.35)',
              }}
            >
              <span style={{ color: isActive ? t.color : 'rgba(255,255,255,0.3)', transition: 'color 0.15s' }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.03em' }}>{t.label}</span>
              {count > 0 && (
                <span style={{ fontSize: 9, fontWeight: 800, background: isActive ? t.color : 'rgba(255,255,255,0.08)', color: isActive ? '#0f172a' : 'rgba(255,255,255,0.4)', borderRadius: 10, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add form (inline) */}
      {showForm && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: activeCfg.accent, animation: 'fadeSlideIn 0.2s ease' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: activeCfg.color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: activeCfg.color }}>{activeCfg.icon}</span>
            Add {activeCfg.label} to Ward {wardNum}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Name field */}
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                {activeCfg.label} Name *
              </label>
              <input
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErr(''); }}
                placeholder={`e.g. ${activeType === 'club' ? 'Padavu Youth Club' : activeType === 'temple' ? 'Sri Vinayaka Temple' : activeType === 'church' ? 'St. Joseph Church' : 'Masjid-e-Noor'}`}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(15,23,42,0.8)', border: `1px solid ${formErr ? '#ef4444' : activeCfg.border}`,
                  borderRadius: 10, padding: '10px 14px',
                  color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            {/* Address field */}
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Address <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Street, area or landmark"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(15,23,42,0.8)', border: `1px solid ${activeCfg.border}`,
                  borderRadius: 10, padding: '10px 14px',
                  color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            {formErr && <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>⚠ {formErr}</div>}
            {/* Save button */}
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: saving ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg,${activeCfg.color}cc,${activeCfg.color})`,
                border: 'none', borderRadius: 10, padding: '11px 0',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
                boxShadow: saving ? 'none' : `0 4px 16px ${activeCfg.color}44`,
                transition: 'all 0.18s',
              }}
            >
              {saving ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity="0.3"/><path d="M21 12a9 9 0 0 0-9-9"/></svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Save {activeCfg.label}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Places list */}
      <div style={{ padding: '12px 18px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2].map(i => <div key={i} style={{ height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease infinite' }} />)}
          </div>
        ) : error ? (
          <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center', padding: '16px 0' }}>⚠ {error}</div>
        ) : activePlaces.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ color: activeCfg.color, opacity: 0.3, marginBottom: 8 }}>{activeCfg.icon}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>No {activeCfg.label}s added yet</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Tap "Add Place" to record one</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activePlaces.map((place, idx) => (
              <div key={place._id || idx} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: activeCfg.accent,
                border: `1px solid ${activeCfg.border}`,
                borderRadius: 12, padding: '11px 14px',
                animation: 'fadeSlideIn 0.2s ease',
              }}>
                {/* Icon badge */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${activeCfg.color}18`,
                  border: `1px solid ${activeCfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: activeCfg.color,
                }}>
                  {activeCfg.icon}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {place.name}
                  </div>
                  {place.address && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {place.address}
                    </div>
                  )}
                </div>
                {/* Delete */}
                <button
                  onClick={() => handleDelete(place._id)}
                  disabled={deletingId === place._id}
                  style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                    color: deletingId === place._id ? 'rgba(239,68,68,0.3)' : '#f87171',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {deletingId === place._id ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity="0.3"/><path d="M21 12a9 9 0 0 0-9-9"/></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:0.5;} 50%{opacity:0.9;} }
      `}</style>
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
          voterid:            member.voterid || '',
          gender:             genderFull,
          firstName:          (member.name || '').split(' ')[0]           || '',
          lastName:           (member.name || '').split(' ').slice(-1)[0] || '',
          houseNumber:        hs.houseNumber  || member.house_no || '',
          wardNumber:         resolvedWard,
          boothNo:            boothStr,
          address:            member.address  || hs.address      || '',
          areaType:           hs.areaType     || '',
          homeType:           hs.homeType     || '',
          familyIncome:       hs.familyIncome || '',
          // ── 2025 voter roll fields ─────────────────────────────────────
          relation:           member.relation           || '',
          relationName:       member.relationName       || '',
          partNo:             member.partNo             || member.ward     || '',
          sectionName:        member.sectionName        || '',
          pollingStation:     member.pollingStation     || '',
          pollingStationAddr: member.pollingStationAddr || '',
          sourcePdfName:      member.sourcePdfName      || '',
          pageNoOfCard:       String(member.pageNoOfCard || ''),
          predictedReligion:  member.predictedReligion  || '',
          religion:           member.religion           || '',
        },
      },
    });
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px',
      background: member.surveyed ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${member.surveyed ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12, marginBottom: 8, transition: 'all 0.2s',
      minHeight: 64,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: member.surveyed ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.12)',
        border: `1px solid ${member.surveyed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 800,
        color: member.surveyed ? '#10b981' : '#f59e0b',
      }}>
        {(member.name || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.name || '—'}
          {member.relation && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)', fontWeight: 400 }}>{member.relation}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
          {member.voterid && <span style={{ marginRight: 10 }}>🪪 {member.voterid}</span>}
          {member.gender  && <span style={{ marginRight: 10 }}>{member.gender === 'M' ? '♂' : member.gender === 'F' ? '♀' : '⚧'} {member.gender}</span>}
          {member.age     && <span>Age {member.age}</span>}
        </div>
      </div>
      {member.surveyed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#10b981', flexShrink: 0, minHeight: 40 }}>
          ✓ Done
        </div>
      ) : canSurvey ? (
        <button onClick={handleStartSurvey} style={{
          background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 10,
          padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#090e1c',
          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          boxShadow: '0 2px 10px rgba(245,158,11,0.35)', minHeight: 40,
        }}>✎ Survey</button>
      ) : (
        <div title={user?.role === 'corporator' ? `Ward ${user.ward} only` : user?.role === 'booth_worker' ? `Booth ${user.booth} only` : 'No access'}
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 12px', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.22)', flexShrink:0, cursor:'not-allowed', minHeight: 40, display: 'flex', alignItems: 'center' }}>
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
      background: 'rgba(17,28,52,0.75)',
      border: `1px solid ${pct === 100 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.09)'}`,
      borderRadius: 16, marginBottom: 18, overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
    }}>
      <div onClick={() => setExpanded(p => !p)} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
        cursor: 'pointer', background: 'rgba(255,255,255,0.025)',
        borderBottom: expanded ? '1px solid rgba(255,255,255,0.07)' : 'none',
        minHeight: 72,
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⌂</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>
            House No: {house.house_no}
            {house.ward && <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}>Ward {house.ward} {house.booth ? `· Booth ${house.booth}` : ''}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: statusColor, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, flexShrink: 0 }}>{house.surveyed}/{house.total_members}</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
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
          const relCfg = m.religion === 'H' ? { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)',  label: 'H' }
                       : m.religion === 'M' ? { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  label: 'M' }
                       : m.religion === 'C' ? { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  label: 'C' }
                       : null;
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
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {m.voterid && <span>🪪 {m.voterid}</span>}
                  <span style={{ color: genderColor }}>{genderIcon} {m.gender}</span>
                  {m.age && <span>Age {m.age}</span>}
                  {relCfg && (
                    <span style={{ fontWeight: 800, fontSize: 10, color: relCfg.color, background: relCfg.bg, border: `1px solid ${relCfg.border}`, borderRadius: 5, padding: '1px 6px', letterSpacing: '0.04em' }}>
                      {relCfg.label}
                    </span>
                  )}
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
// ─── Local Places Modal ───────────────────────────────────────────────────────
const PLACE_TYPE_CFG = {
  club:    { label:'Local Club',  color:'#f59e0b', icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  temple:  { label:'Temple',     color:'#f97316', icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7h20L12 2z"/><rect x="4" y="7" width="16" height="13"/><rect x="9" y="12" width="6" height="8"/><line x1="12" y1="7" x2="12" y2="2"/></svg>
  )},
  church:  { label:'Church',     color:'#8b5cf6', icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="7"/><line x1="9.5" y1="4.5" x2="14.5" y2="4.5"/><path d="M5 20v-8l7-5 7 5v8H5z"/><rect x="9" y="14" width="6" height="6"/></svg>
  )},
  mosque:  { label:'Mosque',     color:'#10b981', icon:(
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V10a7 7 0 0 1 14 0v10"/><path d="M12 3a3 3 0 0 1 3 3"/><path d="M9 6a3 3 0 0 1 3-3"/><rect x="9" y="14" width="6" height="6"/></svg>
  )},
};

function LocalPlacesModal({ onClose }) {
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [total,        setTotal]        = useState(0);
  const [counts,       setCounts]       = useState({ club:0, temple:0, church:0, mosque:0 });
  const [byWard,       setByWard]       = useState([]);
  const [search,       setSearch]       = useState('');
  const [activeType,   setActiveType]   = useState('all');
  const [expandedWard, setExpandedWard] = useState(null);

  useEffect(() => {
    api.get('/api/local-places-summary/')
      .then(r => {
        if (r.data.success) {
          setTotal(r.data.total || 0);
          setCounts(r.data.counts || {});
          setByWard(r.data.byWard || []);
          if (r.data.byWard?.length) setExpandedWard(r.data.byWard[0].ward);
        } else { setError(r.data.message || 'Failed to load.'); }
      })
      .catch(e => setError(e.userMessage || 'Network error.'))
      .finally(() => setLoading(false));
  }, []);

  // Filter wards by search + active type
  const filtered = byWard
    .map(w => ({
      ...w,
      places: w.places.filter(p =>
        (activeType === 'all' || p.type === activeType) &&
        (!search || p.name.toLowerCase().includes(search.toLowerCase()) ||
          w.wardName.toLowerCase().includes(search.toLowerCase()) ||
          (p.address || '').toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter(w => w.places.length > 0);

  const PIN_ICON = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px', overflowY:'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:780, background:'linear-gradient(160deg, #0d1b30 0%, #090e1c 100%)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:20, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.65)', display:'flex', flexDirection:'column', maxHeight:'88vh' }}>

        {/* ── Header ── */}
        <div style={{ padding:'20px 24px 16px', background:'rgba(245,158,11,0.05)', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:'#e2e8f0' }}>
                  Local Places
                  {!loading && <span style={{ marginLeft:8, fontSize:12, fontWeight:400, color:'rgba(255,255,255,0.35)' }}>{total} places across {byWard.length} wards</span>}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Clubs · Temples · Churches · Mosques</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:15, color:'rgba(255,255,255,0.45)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>

          {/* Type count badges */}
          {!loading && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[{ key:'all', label:'All', count:total, color:'#94a3b8' },
                ...Object.entries(PLACE_TYPE_CFG).map(([k,v]) => ({ key:k, label:v.label, count:counts[k]||0, color:v.color }))
              ].map(t => (
                <button key={t.key} onClick={() => setActiveType(t.key)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8,
                    background: activeType===t.key ? `${t.color}18` : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${activeType===t.key ? t.color+'44' : 'rgba(255,255,255,0.08)'}`,
                    color: activeType===t.key ? t.color : 'rgba(255,255,255,0.4)',
                    fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit',
                  }}>
                  {t.key !== 'all' && <span style={{ color: activeType===t.key ? t.color : 'rgba(255,255,255,0.3)', display:'flex' }}>{PLACE_TYPE_CFG[t.key].icon}</span>}
                  {t.label}
                  <span style={{ background:`${t.color}18`, color:t.color, borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:800, minWidth:18, textAlign:'center' }}>{t.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Search ── */}
        <div style={{ padding:'10px 24px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'7px 12px' }}>
            <span style={{ color:'rgba(255,255,255,0.28)', fontSize:14 }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter by ward, place name or address…"
              style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:'#fff' }} />
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:12, padding:0 }}>✕</button>}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 24px 24px' }}>
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(i => <div key={i} style={{ height:64, borderRadius:12, background:'rgba(255,255,255,0.04)', animation:'pulse 1.6s ease-in-out infinite' }} />)}
            </div>
          )}
          {error && <div style={{ padding:'20px 0', color:'#f87171', textAlign:'center', fontSize:14 }}>⚠ {error}</div>}
          {!loading && !error && total === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'rgba(255,255,255,0.25)' }}>
              <div style={{ fontSize:34, marginBottom:8 }}>📍</div>
              <div style={{ fontWeight:600 }}>No local places added yet</div>
              <div style={{ fontSize:12, marginTop:6, color:'rgba(255,255,255,0.15)' }}>Add clubs, temples, churches & mosques from the Ward dashboard</div>
            </div>
          )}
          {!loading && total > 0 && filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'rgba(255,255,255,0.25)' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🔍</div>
              <div style={{ fontWeight:600 }}>No results found</div>
            </div>
          )}
          {!loading && filtered.map(ward => {
            const isOpen = expandedWard === ward.ward;
            const typeCounts = Object.entries(PLACE_TYPE_CFG)
              .map(([k,v]) => ({ key:k, ...v, n: ward.places.filter(p=>p.type===k).length }))
              .filter(t => t.n > 0);
            return (
              <div key={ward.ward} style={{ marginBottom:10 }}>
                {/* Ward header row */}
                <div onClick={() => setExpandedWard(isOpen ? null : ward.ward)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px',
                    background: isOpen ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.025)',
                    border:`1px solid ${isOpen ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: isOpen ? '12px 12px 0 0' : 12, cursor:'pointer', transition:'all 0.15s',
                  }}>
                  <div style={{ width:38, height:38, borderRadius:9, flexShrink:0,
                    background: isOpen ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                    border:`1px solid ${isOpen ? 'rgba(245,158,11,0.28)' : 'rgba(255,255,255,0.09)'}`,
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:8, fontWeight:700, color: isOpen ? '#f59e0b' : 'rgba(255,255,255,0.25)', letterSpacing:'0.4px', textTransform:'uppercase' }}>Ward</span>
                    <span style={{ fontSize:13, fontWeight:900, color: isOpen ? '#f59e0b' : 'rgba(255,255,255,0.45)', lineHeight:1 }}>{ward.ward}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: isOpen ? '#e2e8f0' : 'rgba(255,255,255,0.7)' }}>{ward.wardName}</div>
                    <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                      {typeCounts.map(t => (
                        <span key={t.key} style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700,
                          color:t.color, background:`${t.color}14`, border:`1px solid ${t.color}28`, borderRadius:5, padding:'1px 6px' }}>
                          <span style={{ display:'flex', color:t.color }}>{t.icon}</span>
                          {t.n} {t.label}{t.n>1?'s':''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:12, fontWeight:800, color: isOpen ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                      background: isOpen ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                      borderRadius:6, padding:'3px 8px' }}>{ward.places.length} places</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"
                      style={{ flexShrink:0, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>
                      <path d="M9 6l6 6-6 6"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded place list */}
                {isOpen && (
                  <div style={{ background:'rgba(10,18,35,0.6)', border:'1px solid rgba(245,158,11,0.12)', borderTop:'none', borderRadius:'0 0 12px 12px', padding:'8px 12px 12px' }}>
                    {/* Group by type */}
                    {Object.entries(PLACE_TYPE_CFG).map(([typeKey, typeCfg]) => {
                      const places = ward.places.filter(p => p.type === typeKey);
                      if (!places.length) return null;
                      return (
                        <div key={typeKey} style={{ marginTop:8 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, paddingLeft:4 }}>
                            <span style={{ color:typeCfg.color, display:'flex' }}>{typeCfg.icon}</span>
                            <span style={{ fontSize:10, fontWeight:800, color:typeCfg.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>{typeCfg.label}s ({places.length})</span>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            {places.map(p => (
                              <div key={p._id} style={{ display:'flex', alignItems:'center', gap:10,
                                background:`${typeCfg.color}08`, border:`1px solid ${typeCfg.color}18`,
                                borderRadius:9, padding:'8px 12px' }}>
                                <div style={{ width:30, height:30, borderRadius:8, flexShrink:0,
                                  background:`${typeCfg.color}14`, border:`1px solid ${typeCfg.color}25`,
                                  display:'flex', alignItems:'center', justifyContent:'center', color:typeCfg.color }}>
                                  {typeCfg.icon}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                                  {p.address && (
                                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                                      <span style={{ color:'rgba(255,255,255,0.2)' }}>{PIN_ICON}</span>
                                      {p.address}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Large Families Modal ─────────────────────────────────────────────────────
// ─── Risk Wards Modal ─────────────────────────────────────────────────────────
function RiskWardsModal({ onClose, onSelectWard }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'ward' | 'margin' | 'pollRate'

  const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WATCH: 3 };
  const PRIORITY_COLOR = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', WATCH: '#8b5cf6' };
  const PRIORITY_BG    = { CRITICAL: 'rgba(239,68,68,0.12)', HIGH: 'rgba(249,115,22,0.12)', MEDIUM: 'rgba(245,158,11,0.1)', WATCH: 'rgba(139,92,246,0.1)' };

  const riskWards = Object.entries(SIR_WARD_DATA)
    .filter(([, d]) => d.priority !== 'NORMAL')
    .map(([num, d]) => ({ num: Number(num), ...d, wardName: WARD_FULL_DATA[Number(num)]?.name || `Ward ${num}`, booths: WARD_FULL_DATA[Number(num)]?.booths || [] }));

  const filtered = riskWards.filter(w => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.wardName.toLowerCase().includes(q) || String(w.num).includes(q) || w.priority.toLowerCase().includes(q) || w.classification.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    if (sortBy === 'ward')     return a.num - b.num;
    if (sortBy === 'margin')   return Math.abs(b.margin) - Math.abs(a.margin);
    if (sortBy === 'pollRate') return a.pollRate - b.pollRate; // lowest first = most at-risk
    return 0;
  });

  const critCount   = riskWards.filter(w => w.priority === 'CRITICAL').length;
  const highCount   = riskWards.filter(w => w.priority === 'HIGH').length;
  const medCount    = riskWards.filter(w => w.priority === 'MEDIUM').length;
  const watchCount  = riskWards.filter(w => w.priority === 'WATCH').length;

  const modal = (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 820, background: 'linear-gradient(160deg, #0d1b30 0%, #090e1c 100%)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 16px', background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚠</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>Risk Wards — SIR Action Required</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{riskWards.length} wards · Low turnout + incomplete SIR surveys · Click any ward to drill down</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 15, color: 'rgba(255,255,255,0.45)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* ── Priority summary chips ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {[['CRITICAL', critCount], ['HIGH', highCount], ['MEDIUM', medCount], ['WATCH', watchCount]].map(([p, n]) => n > 0 && (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: PRIORITY_BG[p], border: `1px solid ${PRIORITY_COLOR[p]}35` }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLOR[p], flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLOR[p] }}>{p}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{n}</span>
              </div>
            ))}
          </div>

          {/* ── Search + Sort ── */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '7px 12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 14 }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ward name, number, priority…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#fff' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 0 }}>✕</button>}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
              <option value="priority">Sort: Priority</option>
              <option value="ward">Sort: Ward No.</option>
              <option value="pollRate">Sort: Lowest Turnout</option>
              <option value="margin">Sort: Biggest Margin</option>
            </select>
          </div>
        </div>

        {/* ── Ward list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 24px' }}>
          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)' }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>🔍</div>
              <div style={{ fontWeight: 600 }}>No wards match your search</div>
            </div>
          )}
          {sorted.map((w, idx) => {
            const pc = PRIORITY_COLOR[w.priority] || '#64748b';
            const pb = PRIORITY_BG[w.priority]    || 'rgba(100,116,139,0.1)';
            const isBJPRisk  = w.alert?.includes('BJP');
            const isCongRisk = w.alert?.includes('CONG');
            const marginAbs  = Math.abs(w.margin);
            return (
              <div key={w.num}
                onClick={() => onSelectWard(w.num)}
                style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 10, borderRadius: 14, overflow: 'hidden', border: `1px solid ${pc}28`, background: 'rgba(17,28,52,0.7)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = pb; e.currentTarget.style.borderColor = `${pc}50`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(17,28,52,0.7)'; e.currentTarget.style.borderColor = `${pc}28`; }}
              >
                {/* Left accent bar */}
                <div style={{ width: 4, flexShrink: 0, background: pc, opacity: 0.8 }} />

                {/* Main content */}
                <div style={{ flex: 1, padding: '13px 16px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    {/* Ward name + number */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: pb, border: `1px solid ${pc}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: pc, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Ward</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: pc, lineHeight: 1.1 }}>{w.num}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.wardName}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.classification}</div>
                      </div>
                    </div>

                    {/* Priority badge + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: pc, background: pb, border: `1px solid ${pc}35`, borderRadius: 6, padding: '3px 8px', letterSpacing: '0.04em' }}>{w.priority}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {/* Poll rate */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Turnout</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: w.pollRate < 50 ? '#f87171' : w.pollRate < 60 ? '#f59e0b' : '#10b981' }}>{w.pollRate}%</span>
                    </div>
                    {/* Margin */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Margin</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isBJPRisk ? '#22d3ee' : '#f87171' }}>{w.margin > 0 ? '+' : ''}{w.margin}%</span>
                    </div>
                    {/* Hindu% */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>H</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>{w.hindu}%</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>M {w.muslim}%</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>C {w.christian}%</span>
                    </div>
                    {/* Electors */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Electors</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{w.totalElectors.toLocaleString()}</span>
                    </div>
                    {/* Alert badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: isBJPRisk ? 'rgba(34,211,238,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isBJPRisk ? 'rgba(34,211,238,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isBJPRisk ? '#22d3ee' : '#f87171' }}>{w.alert}</span>
                    </div>
                  </div>

                  {/* Booths */}
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>Booths:</span>
                    {w.booths.map(b => (
                      <span key={b} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '1px 6px' }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

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
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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

// ─── Ward Strength Intelligence Panel ────────────────────────────────────────
function WardStrengthIntelligence() {
  const [activeFilter, setActiveFilter] = React.useState('ALL');
  const [activeView,   setActiveView]   = React.useState('cards'); // 'cards' | 'gaps'

  const TIER_CFG = {
    STRONG: { label: 'Strong',           color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  icon: '🛡' },
    MEDIUM: { label: 'Medium',           color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: '⚡' },
    WEAK:   { label: 'Weak / Contested', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   icon: '🔥' },
    OPP:    { label: 'Opposition',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  icon: '⛳' },
  };

  const WARDS = Object.entries(SIR_WARD_DATA).map(([wStr, d]) => {
    const w = Number(wStr);
    const name = WARD_FULL_DATA[w]?.name || '';
    const tier = (() => {
      if (d.classification.includes('STRONGHOLD')) return d.margin >= 60 ? 'STRONG' : 'STRONG';
      if (d.classification.includes('BJP STRONG') && !d.classification.includes('FAVOUR')) return d.margin >= 35 ? 'STRONG' : 'MEDIUM';
      if (d.classification.includes('BJP FAVOUR')) return 'MEDIUM';
      if (d.classification.includes('CONGRESS') || d.classification.includes('Cong')) return 'OPP';
      if (d.classification.includes('CONTESTED')) return d.margin > 0 ? 'WEAK' : 'OPP';
      return 'MEDIUM';
    })();

    // Grassroot gaps
    const gaps = [];
    if (d.bloMapped < 55) gaps.push({ id: 'blo', label: 'BLO mapping gap', detail: `Only ${d.bloMapped.toFixed(0)}% mapped — ${(100 - d.bloMapped).toFixed(0)}% unreached`, severity: 'high' });
    else if (d.bloMapped < 60) gaps.push({ id: 'blo', label: 'BLO partial coverage', detail: `${d.bloMapped.toFixed(0)}% mapped, needs top-up`, severity: 'med' });
    if (d.pollRate < 50) gaps.push({ id: 'poll', label: 'Very low poll turnout', detail: `${d.pollRate.toFixed(0)}% — critical voter apathy`, severity: 'high' });
    else if (d.pollRate < 58) gaps.push({ id: 'poll', label: 'Below-average turnout', detail: `${d.pollRate.toFixed(0)}% — mobilisation needed`, severity: 'med' });
    if (d.progeny < 75) gaps.push({ id: 'prog', label: 'Progeny mapping deficit', detail: `${d.progeny.toFixed(0)}% — young voters not captured`, severity: 'high' });
    if (d.margin > 0 && d.margin < 10) gaps.push({ id: 'margin', label: 'Razor-thin BJP margin', detail: `Only +${d.margin.toFixed(0)}% lead — flip risk`, severity: 'high' });
    if (d.margin < 0 && d.margin > -20) gaps.push({ id: 'margin', label: 'Recoverable deficit', detail: `${d.margin.toFixed(0)}% — needs intensive work`, severity: 'med' });
    if (d.priority === 'CRITICAL') gaps.push({ id: 'priority', label: 'CRITICAL priority ward', detail: 'Flagged for urgent attention', severity: 'high' });
    else if (d.priority === 'HIGH') gaps.push({ id: 'priority', label: 'HIGH priority alert', detail: 'Elevated risk — escalate actions', severity: 'med' });

    // Corrective actions
    const actions = [];
    if (d.bloMapped < 60) actions.push('Deploy additional BLO volunteers immediately');
    if (d.pollRate < 55) actions.push('Launch voter motivation drives & transport arrangements');
    else if (d.pollRate < 60) actions.push('Phone/door-to-door campaign for poll day reminders');
    if (d.progeny < 80) actions.push('Register newly eligible youth voters — progeny outreach');
    if ((tier === 'WEAK' || tier === 'MEDIUM') && d.margin < 15) actions.push('Schedule community meetings with undecided voter pockets');
    if (d.hindu > 70 && d.pollRate < 58) actions.push('Activate temple & cultural network for Hindu voter turnout');
    if (d.margin > 60) actions.push('Focus on preventing vote leakage — anti-complacency messaging');
    if (d.priority === 'CRITICAL') actions.push('⚠ Assign senior supervisor for daily monitoring');
    if (actions.length === 0) actions.push('Maintain current momentum — routine check-ins');

    return { w, name, tier, gaps, actions, ...d };
  });

  const filtered = activeFilter === 'ALL' ? WARDS : WARDS.filter(d => d.tier === activeFilter);

  const tierGroups = ['STRONG', 'MEDIUM', 'WEAK', 'OPP'].map(tier => ({
    tier,
    wards: filtered.filter(d => d.tier === tier),
    cfg: TIER_CFG[tier],
  })).filter(g => g.wards.length > 0);

  const summaryStats = {
    strong: WARDS.filter(d => d.tier === 'STRONG').length,
    medium: WARDS.filter(d => d.tier === 'MEDIUM').length,
    weak:   WARDS.filter(d => d.tier === 'WEAK').length,
    opp:    WARDS.filter(d => d.tier === 'OPP').length,
    critical: WARDS.filter(d => d.priority === 'CRITICAL' || d.priority === 'HIGH').length,
    totalElectors: WARDS.reduce((a, d) => a + d.totalElectors, 0),
  };

  const btnStyle = (active) => ({
    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
    color: active ? '#f59e0b' : 'rgba(255,255,255,0.5)',
    transition: 'all 0.15s',
  });

  const viewBtnStyle = (active) => ({
    padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: 'none',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    color: active ? 'var(--text-1)' : 'rgba(255,255,255,0.4)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(17,28,52,0.97), rgba(10,18,35,0.99))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18,
        padding: '20px 18px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', marginBottom: 3 }}>
              Ward Strength Intelligence
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {WARDS.length} wards · political strength, grassroot gaps & corrective actions
            </div>
          </div>
          {/* View toggle */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '3px', display: 'flex', gap: 2 }}>
            <button style={viewBtnStyle(activeView === 'cards')} onClick={() => setActiveView('cards')}>Ward Cards</button>
            <button style={viewBtnStyle(activeView === 'gaps')}  onClick={() => setActiveView('gaps')}>Gap Report</button>
          </div>
        </div>

        {/* Summary stat pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {[
            { k: 'strong',   label: 'Strong',      val: summaryStats.strong,   color: '#10b981' },
            { k: 'medium',   label: 'Medium',       val: summaryStats.medium,   color: '#f59e0b' },
            { k: 'weak',     label: 'Weak',         val: summaryStats.weak,     color: '#ef4444' },
            { k: 'opp',      label: 'Opposition',   val: summaryStats.opp,      color: '#8b5cf6' },
            { k: 'critical', label: 'High-risk',    val: summaryStats.critical, color: '#f97316' },
          ].map(({ k, label, val, color }) => (
            <div key={k} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color }}>{val}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
            {(summaryStats.totalElectors / 1000).toFixed(0)}K total electors
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { k: 'ALL',    label: 'All Wards' },
            { k: 'STRONG', label: '🛡 Strong' },
            { k: 'MEDIUM', label: '⚡ Medium' },
            { k: 'WEAK',   label: '🔥 Weak' },
            { k: 'OPP',    label: '⛳ Opposition' },
          ].map(({ k, label }) => (
            <button key={k} style={btnStyle(activeFilter === k)} onClick={() => setActiveFilter(k)}>{label}</button>
          ))}
        </div>

        {/* ── CARDS VIEW ─────────────────────────────────────────────── */}
        {activeView === 'cards' && tierGroups.map(({ tier, wards, cfg }) => (
          <div key={tier} style={{ marginBottom: 22 }}>
            {/* Tier header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
              }}>
                {cfg.icon} {cfg.label} — {wards.length} ward{wards.length > 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {wards.reduce((a, d) => a + d.totalElectors, 0).toLocaleString()} electors
              </span>
            </div>
            {/* Ward grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {wards.map(d => {
                const maxM = 90;
                const barW = Math.max(0, Math.min(100, (Math.abs(d.margin) / maxM) * 100));
                const barColor = d.margin >= 0 ? cfg.color : '#8b5cf6';
                return (
                  <div key={d.w} style={{
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '13px 14px',
                  }}>
                    {/* Ward name + priority badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>W{d.w} · {d.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{d.totalElectors.toLocaleString()} electors</div>
                      </div>
                      {d.priority !== 'NORMAL' && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                          background: d.priority === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : d.priority === 'HIGH' ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)',
                          color: d.priority === 'CRITICAL' ? '#ef4444' : d.priority === 'HIGH' ? '#f59e0b' : '#8b5cf6',
                        }}>{d.priority}</span>
                      )}
                    </div>
                    {/* Margin bar */}
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ width: `${barW}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                      Margin: <span style={{ color: d.margin >= 0 ? cfg.color : '#8b5cf6', fontWeight: 700 }}>
                        {d.margin >= 0 ? '+' : ''}{d.margin.toFixed(0)}%
                      </span>
                      <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.25)' }}>Turnout {d.pollRate.toFixed(0)}%</span>
                    </div>
                    {/* Key stats */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                      {[
                        { l: `H ${d.hindu.toFixed(0)}%`,   ok: d.hindu > 65  },
                        { l: `BLO ${d.bloMapped.toFixed(0)}%`, ok: d.bloMapped > 57 },
                        { l: `Map ${d.totalMapped.toFixed(0)}%`, ok: d.totalMapped > 63 },
                      ].map((s, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                          background: s.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: s.ok ? '#10b981' : '#ef4444',
                        }}>{s.l}</span>
                      ))}
                    </div>
                    {/* Gaps */}
                    {d.gaps.length > 0 && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gaps</div>
                        {d.gaps.slice(0, 2).map((g, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 3 }}>
                            <span style={{ color: g.severity === 'high' ? '#ef4444' : '#f59e0b', fontSize: 10, marginTop: 1 }}>●</span>
                            <div>
                              <span style={{ fontSize: 11, color: g.severity === 'high' ? '#fca5a5' : '#fcd34d', fontWeight: 600 }}>{g.label}</span>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{g.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Actions */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Action</div>
                      {d.actions.slice(0, 2).map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 3 }}>
                          <span style={{ color: '#22d3ee', fontSize: 10, marginTop: 1 }}>→</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── GAP REPORT VIEW ──────────────────────────────────────── */}
        {activeView === 'gaps' && (() => {
          const riskWards = filtered
            .filter(d => d.gaps.length > 0)
            .sort((a, b) => {
              const sev = w => w.gaps.filter(g => g.severity === 'high').length;
              return sev(b) - sev(a);
            });

          const allActions = [
            { action: 'Deploy additional BLO volunteers immediately',              wards: filtered.filter(d => d.bloMapped < 60).map(d => `W${d.w}`), severity: 'high' },
            { action: 'Launch voter motivation & transport drives',                 wards: filtered.filter(d => d.pollRate < 55).map(d => `W${d.w}`), severity: 'high' },
            { action: 'Phone/door-to-door poll day reminders',                      wards: filtered.filter(d => d.pollRate >= 55 && d.pollRate < 60).map(d => `W${d.w}`), severity: 'med' },
            { action: 'Youth voter registration — progeny outreach campaign',       wards: filtered.filter(d => d.progeny < 80).map(d => `W${d.w}`), severity: 'high' },
            { action: 'Community meetings for undecided voter pockets',             wards: filtered.filter(d => d.tier === 'WEAK' || (d.tier === 'MEDIUM' && d.margin < 15)).map(d => `W${d.w}`), severity: 'med' },
            { action: 'Temple/cultural network activation for Hindu turnout',       wards: filtered.filter(d => d.hindu > 70 && d.pollRate < 58).map(d => `W${d.w}`), severity: 'med' },
            { action: 'Anti-complacency messaging in stronghold wards',             wards: filtered.filter(d => d.margin > 60).map(d => `W${d.w}`), severity: 'low' },
            { action: 'Assign senior supervisor — daily CRITICAL ward monitoring',  wards: filtered.filter(d => d.priority === 'CRITICAL').map(d => `W${d.w}`), severity: 'high' },
          ].filter(a => a.wards.length > 0);

          return (
            <div>
              {/* Consolidated Action Table */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>Consolidated Corrective Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allActions.map((item, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: '12px 14px',
                      borderLeft: `3px solid ${item.severity === 'high' ? '#ef4444' : item.severity === 'med' ? '#f59e0b' : '#22d3ee'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, marginTop: 2, flexShrink: 0,
                            background: item.severity === 'high' ? 'rgba(239,68,68,0.2)' : item.severity === 'med' ? 'rgba(245,158,11,0.2)' : 'rgba(34,211,238,0.15)',
                            color: item.severity === 'high' ? '#ef4444' : item.severity === 'med' ? '#f59e0b' : '#22d3ee',
                            textTransform: 'uppercase',
                          }}>
                            {item.severity === 'high' ? 'Urgent' : item.severity === 'med' ? 'Priority' : 'Routine'}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{item.action}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{item.wards.length} ward{item.wards.length > 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                        {item.wards.map(wl => (
                          <span key={wl} style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', fontWeight: 600,
                          }}>{wl}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-ward gap table */}
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>
                Ward-Level Gap Details ({riskWards.length} wards with identified gaps)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {riskWards.map(d => {
                  const cfg = TIER_CFG[d.tier];
                  return (
                    <div key={d.w} style={{
                      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 14, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>W{d.w} — {d.name}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 600 }}>
                            {cfg.label}
                          </span>
                          {d.priority !== 'NORMAL' && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                              background: d.priority === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                              color: d.priority === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{d.priority}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                          <span>Margin: <b style={{ color: d.margin >= 0 ? cfg.color : '#8b5cf6' }}>{d.margin >= 0 ? '+' : ''}{d.margin.toFixed(0)}%</b></span>
                          <span>Poll: <b style={{ color: d.pollRate < 55 ? '#ef4444' : 'rgba(255,255,255,0.55)' }}>{d.pollRate.toFixed(0)}%</b></span>
                          <span>BLO: <b style={{ color: d.bloMapped < 56 ? '#ef4444' : d.bloMapped < 60 ? '#f59e0b' : '#10b981' }}>{d.bloMapped.toFixed(0)}%</b></span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Grassroot Gaps</div>
                          {d.gaps.map((g, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 11, color: g.severity === 'high' ? '#ef4444' : '#f59e0b', marginTop: 1, flexShrink: 0 }}>
                                {g.severity === 'high' ? '▲' : '◆'}
                              </span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: g.severity === 'high' ? '#fca5a5' : '#fcd34d' }}>{g.label}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{g.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Corrective Actions</div>
                          {d.actions.map((a, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 12, color: '#22d3ee', marginTop: 1, flexShrink: 0 }}>→</span>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
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
  const [localPlacesOpen,   setLocalPlacesOpen]   = useState(false);
  const [localPlacesTotal,  setLocalPlacesTotal]  = useState(null);
  const [localPlacesCounts, setLocalPlacesCounts] = useState({});

  const [query, setQuery]         = useState('');
  const [searching, setSearching] = useState(false);
  const [searchRes, setSearchRes] = useState(null);
  const [searchErr, setSearchErr] = useState('');
  const [nextSerial, setNextSerial] = useState(1);
  const debounceRef      = useRef(null);
  const searchResultsRef = useRef(null);
  const riskWardsRef     = useRef(null);

  useEffect(() => {
    dashboardApi.stats()
      .then(r => { setStats(r.data); setError(''); })
      .catch(e => setError(e.userMessage || e.response?.data?.message || 'Could not load dashboard data.'))
      .finally(() => setStatsLoading(false));

    dashboardApi.serialNumber()
      .then(r => setNextSerial(r.data.serialNumber || 1))
      .catch(() => {});

    // Local Places — constituency-wide count for stat card
    api.get('/api/local-places-summary/')
      .then(r => {
        if (r.data.success) {
          setLocalPlacesTotal(r.data.total || 0);
          setLocalPlacesCounts(r.data.counts || {});
        }
      })
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
    {
      label: 'Local Places',
      value: localPlacesTotal != null ? localPlacesTotal.toString() : null,
      icon: '📍',
      color: '#f59e0b',
      sub: localPlacesTotal != null
        ? `${localPlacesCounts.temple||0} temples · ${localPlacesCounts.church||0} churches · ${localPlacesCounts.mosque||0} mosques · ${localPlacesCounts.club||0} clubs`
        : 'Clubs, temples, churches, mosques',
      isLocalPlaces: true,
    },
  ];

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
    <style>{`
      * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
      .db-stat-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      @media (min-width: 480px) {
        .db-stat-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (min-width: 820px) {
        .db-stat-grid { grid-template-columns: repeat(6, 1fr); }
      }
      .db-two-col {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      @media (min-width: 700px) {
        .db-two-col { grid-template-columns: 1fr 1fr; }
      }
      .db-header-row {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      @media (min-width: 600px) {
        .db-header-row { flex-direction: row; align-items: flex-start; justify-content: space-between; }
      }
      .ward-heatmap-row:active { background: rgba(255,255,255,0.06) !important; }
      .ward-heatmap-row:hover { background: rgba(255,255,255,0.04) !important; }
      .risk-ward-btn:active { transform: scale(0.97); }
      .touch-btn:active { opacity: 0.8; transform: scale(0.98); }
      .heatmap-mobile-card {
        display: flex;
        flex-direction: column;
        gap: 0;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        padding: 14px 16px;
        cursor: pointer;
        transition: background 0.12s;
      }
      .heatmap-mobile-card:active { background: rgba(255,255,255,0.05) !important; }
      .section-label {
        font-size: 11px;
        font-weight: 700;
        color: rgba(255,255,255,0.25);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 10px;
      }
      .stat-mini-label {
        font-size: 10px;
        color: rgba(255,255,255,0.35);
        font-weight: 500;
      }
      .booth-table-row {
        display: grid;
        grid-template-columns: 42px 1fr 72px 72px 72px 80px;
        gap: 0;
        padding: 13px 16px;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        cursor: pointer;
        transition: background 0.12s;
      }
      .booth-table-row:active { background: rgba(255,255,255,0.06) !important; }
      @media (max-width: 430px) {
        .booth-table-row {
          grid-template-columns: 36px 1fr 60px 60px 60px 70px;
          padding: 12px 12px;
        }
      }
    `}</style>

    <div className="page">
      <Navbar />
      <div className="page-inner">

        {/* ── Search Bar ─────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom: 24 }}>
          <div style={{
            background: 'rgba(17,28,52,0.95)', border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 16, padding: '4px 10px 4px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>⌕</span>
            <input
              value={query} onChange={handleQueryChange}
              placeholder="Search name, Voter ID or House No…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 16, color: 'var(--text-1)', padding: '14px 0', caretColor: '#f59e0b' }}
            />
            {searching && <span className="spinner" style={{ flexShrink: 0 }} />}
            {query && !searching && (
              <button onClick={clearSearch} className="touch-btn" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '0', cursor: 'pointer', fontSize: 16, color: 'var(--text-2)', flexShrink: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            )}
          </div>
          {!query && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {['By name', 'By Voter ID', 'By House No'].map(hint => (
                <span key={hint} style={{ fontSize: 12, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 14px' }}>{hint}</span>
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
                <h1 style={{ fontSize: 'clamp(22px, 5vw, 32px)', marginBottom: 6 }}>{greeting}, {user?.username} 👋</h1>
                <p style={{ fontSize: 14, lineHeight: 1.5 }}>{
                selectedBooth
                  ? <>Viewing <strong style={{ color: '#22d3ee' }}>Booth {selectedBooth}</strong> in <strong style={{ color: '#f59e0b' }}>Ward {selectedWard} — {WARD_NAMES[selectedWard]}</strong></>
                  : selectedWard
                  ? <>Viewing <strong style={{ color: '#f59e0b' }}>Ward {selectedWard} — {WARD_NAMES[selectedWard]}</strong></>
                  : 'Your constituency intelligence overview'
                }</p>
              </div>

              {/* ── Ward + Booth selectors stacked ── */}
              <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Ward selector */}
                <WardSelector value={selectedWard} onChange={(w) => { setSelectedWard(w); setSelectedBooth(''); setBoothStats(null); }} />

                {/* Booth selector — only visible when a ward is selected */}
                {selectedWard && (
                  <div style={{
                    background: 'rgba(34,211,238,0.05)',
                    border: '1px solid rgba(34,211,238,0.2)',
                    borderRadius: 10, padding: '8px 10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>🗳</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(34,211,238,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Select Booth
                        </span>
                        {selectedBooth && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#22d3ee', background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 5, padding: '1px 6px' }}>
                            #{selectedBooth}
                          </span>
                        )}
                      </div>
                      {selectedBooth && (
                        <button
                          onClick={() => { setSelectedBooth(''); setBoothStats(null); }}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}
                        >✕ Clear</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(WARD_NUM_TO_BOOTHS[selectedWard] || []).map(b => {
                        const isActive = selectedBooth === String(b);
                        const boothSIR = (SIR_BOOTH_DATA[String(selectedWard)] || []).find(bd => bd.booth === b);
                        const isWeak   = boothSIR && boothSIR.totalMappedPct < 60;
                        return (
                          <button
                            key={b}
                            onClick={() => setSelectedBooth(isActive ? '' : String(b))}
                            title={boothSIR ? `Mapped: ${boothSIR.totalMappedPct}% · BLO: ${boothSIR.bloMappedPct}%` : `Booth ${b}`}
                            className="touch-btn"
                            style={{
                              padding: '7px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                              cursor: 'pointer', transition: 'all 0.13s', minWidth: 40, minHeight: 36,
                              background: isActive ? '#22d3ee' : isWeak ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.07)',
                              border: isActive ? '1px solid #22d3ee' : isWeak ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.12)',
                              color: isActive ? '#090e1c' : isWeak ? '#f87171' : 'var(--text-2)',
                              position: 'relative',
                            }}
                          >
                            {b}
                            {isWeak && !isActive && (
                              <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1px solid #090e1c' }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selectedBooth && (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(34,211,238,0.6)', fontWeight: 600 }}>
                        ✓ Booth {selectedBooth} detail view shown above
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Ward Info Card — ONLY shown when NO booth is selected ──── */}
          {selectedWard && !selectedBooth && (
            <div className="anim-fade-up" style={{ marginBottom: 20 }}>
              <div style={{
                background: 'linear-gradient(135deg,rgba(245,158,11,0.15) 0%,rgba(245,158,11,0.04) 100%)',
                border: '1px solid rgba(245,158,11,0.32)',
                borderRadius: wardStatsLoading || !wardStats ? 16 : '16px 16px 0 0',
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
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
                <div style={{ background: 'rgba(10,18,34,0.97)', border: '1px solid rgba(245,158,11,0.2)', borderTop: 'none', padding: '0 0 4px' }}>

                  {/* ── Booth chips row ── */}
                  {(wardStats.ward2026?.boothCount > 0 || wardStats.ward2026?.boothList) && (
                    <div style={{ padding: '10px 14px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', flexShrink: 0 }}>Booths</span>
                      {wardStats.ward2026?.boothCount > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#22d3ee', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 20, padding: '2px 10px', flexShrink: 0 }}>
                          {wardStats.ward2026.boothCount} booths
                        </span>
                      )}
                      {wardStats.ward2026?.boothList && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {wardStats.ward2026.boothList}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ══ SECTION 1: ELECTORS AT A GLANCE ══ */}
                  <div style={{ padding: '14px 14px 0' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 10 }}>
                      📋 2026 Voter Roll — Electors at a Glance
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
                      {/* Total Electors — hero number */}
                      <div style={{
                        gridColumn: '1 / -1',
                        background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(34,211,238,0.03))',
                        border: '1px solid rgba(34,211,238,0.2)', borderRadius: 12, padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 16,
                      }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🗳️</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: 'rgba(34,211,238,0.6)', fontWeight: 700, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Registered Electors</div>
                          <div style={{ fontSize: 30, fontWeight: 900, color: '#22d3ee', fontFamily: 'var(--font-display)', letterSpacing: '-1px', lineHeight: 1 }}>
                            {(wardStats.ward2026?.totalElectors || wardStats.totalVoters || 0).toLocaleString()}
                          </div>
                        </div>
                        {wardStats.ward2026?.cutoffElec != null && (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Cutoff eligible</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{wardStats.ward2026.cutoffElec.toLocaleString()}</div>
                          </div>
                        )}
                      </div>

                      {/* Age ≤ Cutoff */}
                      {wardStats.ward2026?.ageCutoff != null && (
                        <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ fontSize: 10, color: 'rgba(139,92,246,0.7)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span>👶</span> Age ≤ Cutoff
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#a78bfa', fontFamily: 'var(--font-display)', marginBottom: 2 }}>
                            {wardStats.ward2026.ageCutoff.toLocaleString()}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Young voters in roll</div>
                        </div>
                      )}

                      {/* Progeny 18+ */}
                      {wardStats.ward2026?.progeny18 != null && (
                        <div style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ fontSize: 10, color: 'rgba(167,139,250,0.7)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span>🌱</span> Progeny 18+
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#c4b5fd', fontFamily: 'var(--font-display)' }}>
                              {wardStats.ward2026.progeny18.toLocaleString()}
                            </div>
                            {wardStats.ward2026?.pctProgeny != null && (
                              <div style={{ fontSize: 13, fontWeight: 800, color: wardStats.ward2026.pctProgeny >= 80 ? '#a78bfa' : '#f59e0b' }}>
                                {wardStats.ward2026.pctProgeny.toFixed(1)}%
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>New-age additions</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ══ SECTION 2: MAPPING STATUS — visual progress cards ══ */}
                  <div style={{ padding: '0 14px 0' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 10 }}>
                      📍 Mapping Coverage Status
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                      {[
                        {
                          label: 'BLO Officer Mapped',
                          desc: 'Voters mapped by Booth Level Officer',
                          count: wardStats.ward2026?.bloMapped,
                          total: wardStats.ward2026?.totalElectors || wardStats.totalVoters,
                          pct: wardStats.ward2026?.pctBloMapped,
                          threshold: 60, color: '#22d3ee', icon: '👮',
                        },
                        {
                          label: 'Total Electors Mapped',
                          desc: 'All mapping methods combined',
                          count: wardStats.ward2026?.electorsMapped ?? wardStats.ward2026?.totalMapped,
                          total: wardStats.ward2026?.totalElectors || wardStats.totalVoters,
                          pct: wardStats.ward2026?.pctTotal,
                          threshold: 65, color: '#f59e0b', icon: '🗺️',
                        },
                      ].filter(m => m.count != null).map(({ label, desc, count, total, pct, threshold, color, icon }) => {
                        const computedPct = pct ?? (total ? Math.round(count / total * 100) : 0);
                        const isGood = computedPct >= threshold;
                        const isGreat = computedPct >= threshold + 15;
                        const statusColor = isGreat ? '#10b981' : isGood ? color : '#f87171';
                        const statusLabel = isGreat ? '✓ EXCELLENT' : isGood ? '✓ ON TRACK' : '⚠ BELOW TARGET';
                        const statusBg    = isGreat ? 'rgba(16,185,129,0.12)' : isGood ? `${color}15` : 'rgba(239,68,68,0.1)';
                        const statusBorder= isGreat ? 'rgba(16,185,129,0.3)' : isGood ? `${color}30` : 'rgba(239,68,68,0.25)';
                        return (
                          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 1 }}>{label}</div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{desc}</div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 22, fontWeight: 900, color: statusColor, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                                  {typeof computedPct === 'number' ? `${computedPct.toFixed(1)}%` : '—'}
                                </div>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                                  {count?.toLocaleString()} / {total?.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            {/* Progress bar with threshold marker */}
                            <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'visible' }}>
                              {/* Target line */}
                              <div style={{ position: 'absolute', left: `${threshold}%`, top: -3, bottom: -3, width: 2, background: 'rgba(255,255,255,0.25)', borderRadius: 1, zIndex: 2 }} title={`Target: ${threshold}%`} />
                              <div style={{ height: '100%', width: `${Math.min(computedPct, 100)}%`, background: `linear-gradient(90deg, ${statusColor}80, ${statusColor})`, borderRadius: 4, transition: 'width 0.8s ease', overflow: 'hidden' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Target: {threshold}%</span>
                              <span style={{ fontSize: 10, fontWeight: 800, color: statusColor, background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: 6, padding: '2px 8px' }}>
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ══ SECTION 3: DEMOGRAPHICS — big visual cards ══ */}
                  <div style={{ padding: '0 14px 14px' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 10 }}>
                      👥 Voter Demographics
                    </div>

                    {/* Gender cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                      {[
                        { label: 'Total Voters', value: wardStats.totalVoters, color: '#22d3ee', icon: '🗳️', pct: 100 },
                        { label: 'Male',         value: wardStats.totalMale,   color: '#60a5fa', icon: '♂',  pct: wardStats.totalVoters ? Math.round(wardStats.totalMale   / wardStats.totalVoters * 100) : 0 },
                        { label: 'Female',       value: wardStats.totalFemale, color: '#f472b6', icon: '♀',  pct: wardStats.totalVoters ? Math.round(wardStats.totalFemale / wardStats.totalVoters * 100) : 0 },
                      ].map(({ label, value, color, icon, pct }) => (
                        <div key={label} style={{ background: `${color}09`, border: `1px solid ${color}22`, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                          <div style={{ fontSize: 10, color: `${color}99`, fontWeight: 700, marginBottom: 4, letterSpacing: '0.3px' }}>{label}</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: 4 }}>
                            {value?.toLocaleString() ?? '—'}
                          </div>
                          {label !== 'Total Voters' && (
                            <>
                              <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 4 }}>{pct}%</div>
                              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${color}80,${color})`, borderRadius: 2, transition: 'width 0.6s ease' }} />
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Religion breakdown — stacked bars with clear labels */}
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Community Composition</div>
                      {/* Stacked visual bar */}
                      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 12, gap: 1 }}>
                        {[
                          { value: wardStats.totalHindu,    color: '#f97316' },
                          { value: wardStats.totalMuslim,   color: '#10b981' },
                          { value: wardStats.totalChristian,color: '#8b5cf6' },
                        ].map((seg, i) => {
                          const pct = wardStats.totalVoters ? (seg.value / wardStats.totalVoters * 100) : 0;
                          return <div key={i} style={{ width: `${pct}%`, background: seg.color, minWidth: pct > 0 ? 3 : 0, transition: 'width 0.6s ease' }} />;
                        })}
                      </div>
                      {/* Religion rows */}
                      {[
                        { label: 'Hindu',     value: wardStats.totalHindu,     color: '#f97316', emoji: '🪔' },
                        { label: 'Muslim',    value: wardStats.totalMuslim,     color: '#10b981', emoji: '☪️' },
                        { label: 'Christian', value: wardStats.totalChristian,  color: '#8b5cf6', emoji: '✝️' },
                      ].map(({ label, value, color, emoji }) => {
                        const pct = wardStats.totalVoters && value ? Math.round(value / wardStats.totalVoters * 100) : 0;
                        return (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' }}>{emoji}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', minWidth: 64 }}>{label}</span>
                            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${color}80,${color})`, borderRadius: 3, transition: 'width 0.6s ease' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 36, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 44, textAlign: 'right', flexShrink: 0 }}>{value?.toLocaleString() ?? '—'}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Supervisors row */}
                    {wardStats.ward2026?.supervisors && (
                      <div style={{ marginTop: 10, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🧑‍💼</span>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(245,158,11,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 3 }}>Ward Supervisors</div>
                          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, lineHeight: 1.5 }}>{wardStats.ward2026.supervisors}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── NEW: Ward SIR Political Intelligence ── */}
              {selectedWard && !wardStatsLoading && (
                <WardSIRPanel wardNum={selectedWard} />
              )}

              {/* ── NEW: Ward Political Snapshot Cards ── */}
              {selectedWard && !wardStatsLoading && (
                <WardPoliticalSnapshot wardNum={selectedWard} />
              )}

              {/* ── NEW: Booth-Level SIR Drill-Down ── */}
              {selectedWard && !wardStatsLoading && SIR_BOOTH_DATA[String(selectedWard)] && (
                <WardBoothDrillDown wardNum={selectedWard} />
              )}

              {/* ── NEW: Ward vs Constituency Comparison ── */}
              {selectedWard && !wardStatsLoading && (
                <WardVsConstituency wardNum={selectedWard} />
              )}

              {/* ── Local Places: Clubs, Temples, Churches, Mosques ── */}
              {selectedWard && !wardStatsLoading && (
                <WardLocalPlaces wardNum={selectedWard} />
              )}

              {/* ── Bottom rounded border on full card ── */}
              {!wardStatsLoading && wardStats && (
                <div style={{ height: 0, border: '1px solid rgba(245,158,11,0.2)', borderTop: 'none', borderRadius: '0 0 14px 14px' }} />
              )}
              {wardError && <div className="alert alert-error" style={{ marginTop: 8 }}>⚠ {wardError}</div>}
            </div>
          )}

          {/* ── Booth Detail Card — shown full-width at TOP when booth is selected ── */}
          {selectedWard && selectedBooth && (
            <BoothDetailCard
              wardNum={selectedWard}
              boothNum={selectedBooth}
              wardStats={wardStats}
              boothStats={boothStats}
              boothStatsLoading={boothStatsLoading}
              boothError={boothError}
              onClearBooth={() => { setSelectedBooth(''); setBoothStats(null); }}
              onClearWard={() => { setSelectedWard(''); setSelectedBooth(''); setBoothStats(null); setWardStats(null); }}
            />
          )}

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

          {/* ── Stat cards (now 6: added Risk Wards) ─────────────────────── */}
          <div className="db-stat-grid stagger mb-24">
            {STAT_CARDS.map(c => (
              activeLoading && c.label !== 'Risk Wards' ? (
                <StatCardSkeleton key={c.label} />
              ) : (
                <div key={c.label}
                  onClick={
                    c.label === 'Large Families' ? () => setLargeFamiliesOpen(true) :
                    c.isLocalPlaces             ? () => setLocalPlacesOpen(true)   :
                    c.label === 'Risk Wards'    ? () => { riskWardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } :
                    undefined
                  }
                  className="touch-btn"
                  style={{
                    background: 'linear-gradient(145deg, rgba(17,28,52,0.95) 0%, rgba(10,18,35,0.98) 100%)',
                    border: `1px solid ${c.color}28`, borderRadius: 16, padding: '16px 14px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: `0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`,
                    cursor: (c.label === 'Large Families' || c.label === 'Risk Wards' || c.isLocalPlaces) ? 'pointer' : 'default',
                    minHeight: 100,
                    ...(c.isLocalPlaces ? { gridColumn: '1 / -1' } : {}),
                  }}
                >
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle, ${c.color}20 0%, transparent 70%)`, pointerEvents: 'none' }} />

                  {c.isLocalPlaces ? (
                    /* ── Full-width horizontal layout for Local Places ── */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      {/* Left: label + count */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c.color}18`, border: `1px solid ${c.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{c.icon}</div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{c.label}</div>
                          <div style={{ fontSize: 28, fontWeight: 900, color: c.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', lineHeight: 1 }}>{c.value ?? '—'}</div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ width: 1, alignSelf: 'stretch', background: `${c.color}18`, flexShrink: 0 }} />

                      {/* Centre: 4 category chips in a row */}
                      <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                        {[
                          { key: 'temple', label: 'Temple',  color: '#f97316', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7h20L12 2z"/><rect x="4" y="7" width="16" height="13"/><rect x="9" y="12" width="6" height="8"/></svg> },
                          { key: 'church', label: 'Church',  color: '#8b5cf6', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="7"/><line x1="9.5" y1="4.5" x2="14.5" y2="4.5"/><path d="M5 20v-8l7-5 7 5v8H5z"/><rect x="9" y="14" width="6" height="6"/></svg> },
                          { key: 'mosque', label: 'Mosque',  color: '#10b981', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18"/><path d="M5 20V10a7 7 0 0 1 14 0v10"/><rect x="9" y="14" width="6" height="6"/></svg> },
                          { key: 'club',   label: 'Club',    color: '#f59e0b', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                        ].map(t => {
                          const n = localPlacesCounts[t.key] || 0;
                          return (
                            <div key={t.key} style={{
                              display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 120,
                              background: n > 0 ? `${t.color}10` : 'rgba(255,255,255,0.025)',
                              border: `1px solid ${n > 0 ? t.color + '30' : 'rgba(255,255,255,0.06)'}`,
                              borderRadius: 10, padding: '10px 14px',
                            }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: n > 0 ? `${t.color}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${n > 0 ? t.color + '25' : 'rgba(255,255,255,0.06)'}`, color: n > 0 ? t.color : 'rgba(255,255,255,0.2)' }}>
                                {t.icon}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: n > 0 ? t.color : 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{t.label}</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: n > 0 ? t.color : 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{n}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: View button */}
                      <span style={{ fontSize: 11, color: `${c.color}95`, background: `${c.color}15`, border: `1px solid ${c.color}28`, borderRadius: 8, padding: '6px 12px', fontWeight: 700, flexShrink: 0, alignSelf: 'center' }}>View ›</span>
                    </div>
                  ) : (
                    /* ── Standard vertical card layout ── */
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', lineHeight: 1.4, maxWidth: '65%' }}>{c.label}</div>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c.color}18`, border: `1px solid ${c.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{c.icon}</div>
                      </div>
                      <div style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 900, color: c.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 7 }}>{c.value ?? '—'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', fontWeight: 500, lineHeight: 1.3 }}>{c.sub}</div>
                        {(c.label === 'Large Families' || c.label === 'Risk Wards') && (
                          <span style={{ fontSize: 10, color: `${c.color}95`, background: `${c.color}15`, border: `1px solid ${c.color}28`, borderRadius: 6, padding: '3px 7px', fontWeight: 700, flexShrink: 0 }}>View ›</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            ))}
          </div>

          {/* ── Coverage bar ──────────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98))',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 18px',
            marginBottom: 20, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            position: 'relative', overflow: 'hidden',
          }} className="anim-fade-up">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, #8b5cf6 0%, #22d3ee ${coverage}%, rgba(255,255,255,0.06) ${coverage}%)`, borderRadius: '18px 18px 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Survey Coverage</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{selectedBooth ? `Booth ${selectedBooth}` : selectedWard ? `Ward ${selectedWard}` : 'All wards'}</div>
              </div>
              {activeLoading ? <Skeleton w={70} h={38} radius={9} /> : (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 900, color: '#8b5cf6', letterSpacing: '-1px', lineHeight: 1 }}>{coverage}%</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>{s.totalReg?.toLocaleString() || 0} / {(selectedBooth ? boothStats?.totalElectors : s.totalVoters)?.toLocaleString() || 0}</div>
                </div>
              )}
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.07)', borderRadius: 5, overflow: 'hidden' }}>
              {!activeLoading && <div style={{ height: '100%', width: `${coverage}%`, background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)', borderRadius: 5, transition: 'width 0.8s ease' }} />}
            </div>
          </div>

          {/* ── Charts ──────────────────────────────────────────────────── */}
          <div className="db-two-col mb-24">
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Ward Coverage</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Top 10 wards by completion %</div>
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
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Voter Demographics</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Religion-wise distribution</div>
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

          {/* ── NEW: Constituency SIR Intelligence Summary (only on overall view) ─── */}
          {!selectedWard && (
            <ConstituencySIRSummary />
          )}

          {/* ── Ward Strength Intelligence: tiers, grassroot gaps & corrective actions ── */}
          {!selectedWard && (
            <WardStrengthIntelligence />
          )}

          {/* ── HMC Religion Breakdown + Polled/NotPolled (constituency / ward / booth) ── */}
          <div style={{ marginBottom: 20 }} className="anim-fade-up">
            {/* Two widgets side by side on wider screens, stacked on mobile */}
            <div className="db-two-col">
              <HMCWidget
                hmc={
                  selectedBooth ? s.boothHMC :
                  selectedWard  ? s.voterHMC || (s.totalHindu || s.totalMuslim || s.totalChristian ? { H: s.totalHindu || 0, M: s.totalMuslim || 0, C: s.totalChristian || 0 } : null) :
                  s.voterHMC
                }
                loading={activeLoading}
                label={
                  selectedBooth ? `Ward ${selectedWard} · Booth ${selectedBooth}` :
                  selectedWard  ? `Ward ${selectedWard} — ${WARD_NAMES[selectedWard] || ''}` :
                  'All Wards (Constituency)'
                }
              />
              <PolledHMCWidget
                polledHMC={s.polledHMC}
                loading={activeLoading}
                label={
                  selectedBooth ? `Ward ${selectedWard} · Booth ${selectedBooth}` :
                  selectedWard  ? `Ward ${selectedWard} — ${WARD_NAMES[selectedWard] || ''}` :
                  'All Wards (Constituency)'
                }
              />
            </div>
          </div>

          {/* ── Caste Category + Community Polled/NotPolled ─────────────── */}
          <div style={{ marginBottom: 20 }} className="anim-fade-up">
            <div className="db-two-col">
              <PolledBroadCategoryWidget
                loading={activeLoading}
                label={
                  selectedBooth ? `Ward ${selectedWard} · Booth ${selectedBooth}` :
                  selectedWard  ? `Ward ${selectedWard} — ${WARD_NAMES[selectedWard] || ''}` :
                  'All Wards (Constituency)'
                }
              />
              <PolledCommunityWidget
                loading={activeLoading}
                label={
                  selectedBooth ? `Ward ${selectedWard} · Booth ${selectedBooth}` :
                  selectedWard  ? `Ward ${selectedWard} — ${WARD_NAMES[selectedWard] || ''}` :
                  'All Wards (Constituency)'
                }
              />
            </div>
          </div>

          {/* ── Community Classification 2002 vs 2025 ─────────────────────── */}
          <CommunityClassificationPanel />

          {/* ── NEW: Risk Wards Overview (only on overall view) ───────────── */}
          {!selectedWard && (
            <div ref={riskWardsRef}>
              <RiskWardsOverview onSelectWard={setSelectedWard} />
            </div>
          )}

          {/* ── NEW: All Wards SIR Heatmap Table (only on overall view) ─── */}
          {!selectedWard && (
            <AllWardsHeatmap onSelectWard={setSelectedWard} />
          )}

          {/* ── Gender + Quick Actions ────────────────────────────────────── */}
          <div className="db-two-col" style={{ marginBottom: 28 }}>
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Gender Breakdown</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  {selectedBooth ? `Booth ${selectedBooth} voter roll` : selectedWard ? `Ward ${selectedWard} voter roll` : 'Constituency voter roll'} &amp; survey
                </div>
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
              ) : (() => {
                // ── Resolve voter gender at all 3 drill-down levels ──────────────
                // HMC level:   voterMale / voterFemale / voterTrans  (2025 pipeline — now fixed: "Male"/"Female")
                // Ward level:  totalMale / totalFemale / totalTrans  (from WardReference)
                // Booth level: totalMale / totalFemale / totalTrans  (from 2025 via booth pipeline — now added)
                const vMale   = s.totalMale   ?? s.voterMale   ?? 0;
                const vFemale = s.totalFemale ?? s.voterFemale ?? 0;
                const vTrans  = s.totalTrans  ?? s.voterTrans  ?? 0;
                const vTotal  = (s.totalVoters ?? (vMale + vFemale + vTrans)) || 0;
                const rMale   = s.regMale   ?? 0;
                const rFemale = s.regFemale ?? 0;
                const rTotal  = s.totalReg  ?? 0;
                const hasData = vMale > 0 || vFemale > 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* ── Summary badge row ── */}
                    {hasData && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[
                          { icon: '♂', label: 'Male',   val: vMale,   color: '#22d3ee' },
                          { icon: '♀', label: 'Female', val: vFemale, color: '#ec4899' },
                          ...(vTrans > 0 ? [{ icon: '⚧', label: 'Other', val: vTrans, color: '#a78bfa' }] : []),
                        ].map(g => (
                          <div key={g.label} style={{
                            flex: 1, textAlign: 'center', padding: '10px 4px',
                            background: `${g.color}10`, border: `1px solid ${g.color}28`, borderRadius: 12,
                          }}>
                            <div style={{ fontSize: 18, marginBottom: 3 }}>{g.icon}</div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: g.color, lineHeight: 1 }}>
                              {(g.val || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: g.color, marginTop: 2, opacity: 0.8 }}>
                              {vTotal ? ((g.val / vTotal) * 100).toFixed(1) : 0}%
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{g.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Bar rows ── */}
                    {[
                      { label: '♂  Male Voters',    val: vMale,   total: vTotal, color: '#22d3ee', dim: false },
                      { label: '♀  Female Voters',   val: vFemale, total: vTotal, color: '#ec4899', dim: false },
                      ...(vTrans > 0 ? [{ label: '⚧  Trans/Other', val: vTrans, total: vTotal, color: '#a78bfa', dim: false }] : []),
                      { label: '♂  Male Surveyed',   val: rMale,   total: rTotal, color: '#22d3ee', dim: true },
                      { label: '♀  Female Surveyed', val: rFemale, total: rTotal, color: '#ec4899', dim: true },
                    ].map(item => {
                      const pct = item.total ? Math.min(100, ((item.val || 0) / item.total * 100)).toFixed(1) : 0;
                      return (
                        <div key={item.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontSize: 11, color: item.dim ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{item.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: item.dim ? `${item.color}88` : item.color }}>
                                {(item.val || 0).toLocaleString()}
                              </span>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', background: `${item.color}12`, borderRadius: 4, padding: '1px 5px' }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${pct}%`,
                              background: item.dim
                                ? `linear-gradient(90deg, ${item.color}40, ${item.color}66)`
                                : `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                              borderRadius: 2, transition: 'width 0.6s ease',
                            }} />
                          </div>
                        </div>
                      );
                    })}

                    {!hasData && (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                        No voter gender data available
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.95), rgba(10,18,35,0.98))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '20px 16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Quick Actions</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Jump to key features</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { to: '/survey',  label: 'Start New Survey',        desc: 'Record constituency data', icon: '✎', color: '#f59e0b' },
                  { to: '/schemes', label: 'Check Scheme Eligibility', desc: 'Find schemes for voters',  icon: '◈', color: '#10b981' },
                  { to: '/voters',  label: 'Search Voters',            desc: 'Browse voter registry',    icon: '◉', color: '#22d3ee' },
                  { to: '/data',    label: 'View All Data',            desc: 'Survey & voter datasets',  icon: '⊟', color: '#8b5cf6' },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '15px 14px',
                    borderRadius: 14, background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    textDecoration: 'none', minHeight: 64,
                    transition: 'background 0.15s',
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}18`, border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{item.desc}</div>
                    </div>
                    <span style={{ color: `${item.color}70`, fontSize: 22, flexShrink: 0 }}>›</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
    {largeFamiliesOpen && <LargeFamiliesModal onClose={() => setLargeFamiliesOpen(false)} />}
    {localPlacesOpen   && <LocalPlacesModal   onClose={() => setLocalPlacesOpen(false)} />}
    </>
  );
}