import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

// ─── Ward & SIR data (moved from Dashboard.jsx) ──────────────────────────────
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


// ─── Analytics data from Mangaluru_Master_Analytics_v3.xlsx ──────────────────
// ── Embedded ward data from Mangaluru_Master_Analytics_v3.xlsx ───────────────
const WARD_DATA = [{"ward": "PADAV WEST", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 7, "strongBooths": 4, "mediumBooths": 0, "weakBooths": 3, "pollRate": 56.9, "poll2018": 70.0, "pollTrend": -13.1, "malePoll": 57.5, "femalePoll": 56.4, "hinduPoll": 57.6, "muslimPoll": 55.6, "christianPoll": 54.4, "gsbPoll": 56.6, "buntPoll": 57.6, "billavaPoll": 58.8, "youthPoll": 53.1, "seniorPoll": 63.2, "muslimReg": 1.8, "christianReg": 13.3, "totalUnpolled": 3304, "gsbUnpolled": 501, "buntUnpolled": 490, "billavaUnpolled": 1058, "sirScore": 58.7, "extraVotes": 284, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "WEAK \u2192 MEDIUM with SIR \u2705", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (57%): 5-8% improvement needed | \ud83d\udc65 CASTE: GSB LOW POLL (57%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT ABSTENTION (58% poll, 490 unpolled): Bunt community not turning out \u2014 BJP core base leaking | \ud83d\udc65 CASTE: BILLAVA UNDERPOLLING (59%): Swing co"}, {"ward": "DEREBAIL SOUTH", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 7, "strongBooths": 0, "mediumBooths": 5, "weakBooths": 2, "pollRate": 57.2, "poll2018": 61.7, "pollTrend": -4.5, "malePoll": 55.6, "femalePoll": 58.6, "hinduPoll": 58.1, "muslimPoll": 39.3, "christianPoll": 54.7, "gsbPoll": 58.0, "buntPoll": 60.0, "billavaPoll": 58.3, "youthPoll": 55.2, "seniorPoll": 66.4, "muslimReg": 3.8, "christianReg": 14.5, "totalUnpolled": 3142, "gsbUnpolled": 792, "buntUnpolled": 376, "billavaUnpolled": 707, "sirScore": 56.5, "extraVotes": 250, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "WEAK \u2192 MEDIUM with SIR \u2705", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (57%): 5-8% improvement needed | \ud83d\udc65 CASTE: GSB LOW POLL (58%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (60%): Bunt OC base not fully mobilised | \ud83d\udc65 CASTE: BILLAVA UNDERPOLLING (58%): Swing community not engaged \u2014 Billava Sangha outrea"}, {"ward": "DEREBAIL WEST", "status": "STRONG", "emoji": "\ud83d\udfe2", "booths": 6, "strongBooths": 3, "mediumBooths": 3, "weakBooths": 0, "pollRate": 65.2, "poll2018": 71.0, "pollTrend": -5.8, "malePoll": 65.9, "femalePoll": 64.5, "hinduPoll": 66.6, "muslimPoll": 36.4, "christianPoll": 59.7, "gsbPoll": 63.6, "buntPoll": 66.3, "billavaPoll": 69.4, "youthPoll": 64.7, "seniorPoll": 73.8, "muslimReg": 1.7, "christianReg": 12.4, "totalUnpolled": 2111, "gsbUnpolled": 457, "buntUnpolled": 254, "billavaUnpolled": 632, "sirScore": 54.6, "extraVotes": 68, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "STRONG \u2014 protect gains \ud83d\udee1\ufe0f", "rootCause": "\ud83d\udc74 AGE: SENIOR DOMINANCE (74% 51-70 poll): Senior-driven ward \u2014 welfare & health schemes decisive | \ud83d\udcc9 TREND: Poll declined -6% from 2018: Negative trend \u2014 organisation weakening"}, {"ward": "DEREBAIL NAIRUTHYA", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 8, "strongBooths": 1, "mediumBooths": 4, "weakBooths": 3, "pollRate": 59.7, "poll2018": 70.7, "pollTrend": -11.0, "malePoll": 59.6, "femalePoll": 59.8, "hinduPoll": 60.3, "muslimPoll": 43.0, "christianPoll": 56.0, "gsbPoll": 59.0, "buntPoll": 62.2, "billavaPoll": 61.8, "youthPoll": 60.6, "seniorPoll": 66.4, "muslimReg": 1.4, "christianReg": 6.8, "totalUnpolled": 3346, "gsbUnpolled": 948, "buntUnpolled": 373, "billavaUnpolled": 941, "sirScore": 61.2, "extraVotes": 241, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (60%): 5-8% improvement needed | \ud83d\udc65 CASTE: GSB LOW POLL (59%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (62%): Bunt OC base not fully mobilised | \ud83d\udc65 CASTE: BILLAVA UNDERPOLLING (62%): Swing community not engaged \u2014 Billava Sangha outrea"}, {"ward": "BOLOOR", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 6, "strongBooths": 1, "mediumBooths": 1, "weakBooths": 4, "pollRate": 47.4, "poll2018": 76.9, "pollTrend": -29.5, "malePoll": 49.0, "femalePoll": 45.8, "hinduPoll": 47.4, "muslimPoll": 35.5, "christianPoll": 45.6, "gsbPoll": 48.2, "buntPoll": 47.0, "billavaPoll": 47.8, "youthPoll": 42.3, "seniorPoll": 54.5, "muslimReg": 2.4, "christianReg": 7.0, "totalUnpolled": 2483, "gsbUnpolled": 682, "buntUnpolled": 227, "billavaUnpolled": 875, "sirScore": 67.6, "extraVotes": 464, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\u26a0\ufe0f LOW TURNOUT (47%): Below acceptable threshold \u2014 outreach failure | \ud83d\udc65 CASTE: GSB ABSTENTION (48% poll, 682 unpolled): Core BJP voter not turning out \u2014 HIGHEST PRIORITY | \ud83d\udc65 CASTE: BUNT ABSTENTION (47% poll, 227 unpolled): Bunt community not turning out \u2014 BJP core base leaking | \ud83d\udc65 CASTE: BILLAVA SWI"}, {"ward": "MANNAGUDDA", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 8, "strongBooths": 0, "mediumBooths": 4, "weakBooths": 4, "pollRate": 54.1, "poll2018": 74.9, "pollTrend": -20.8, "malePoll": 55.5, "femalePoll": 53.0, "hinduPoll": 54.5, "muslimPoll": 28.9, "christianPoll": 49.5, "gsbPoll": 55.3, "buntPoll": 55.0, "billavaPoll": 55.2, "youthPoll": 55.7, "seniorPoll": 62.8, "muslimReg": 2.8, "christianReg": 4.7, "totalUnpolled": 3497, "gsbUnpolled": 1155, "buntUnpolled": 378, "billavaUnpolled": 909, "sirScore": 64.8, "extraVotes": 435, "predFullSir": "WEAK", "predIntensive": "MEDIUM", "upgradePath": "WEAK \u2192 MEDIUM with Intensive only \u26a0\ufe0f", "rootCause": "\u26a0\ufe0f LOW TURNOUT (54%): Below acceptable threshold \u2014 outreach failure | \ud83d\udc65 CASTE: GSB LOW POLL (55%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT ABSTENTION (55% poll, 378 unpolled): Bunt community not turning out \u2014 BJP core base leaking | \ud83d\udc65 CASTE: BILLAVA UNDERPOLLIN"}, {"ward": "KAMBALA", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 5, "strongBooths": 1, "mediumBooths": 1, "weakBooths": 3, "pollRate": 57.0, "poll2018": 67.0, "pollTrend": -10.0, "malePoll": 57.6, "femalePoll": 56.6, "hinduPoll": 57.5, "muslimPoll": 63.7, "christianPoll": 51.8, "gsbPoll": 58.5, "buntPoll": 61.9, "billavaPoll": 53.6, "youthPoll": 56.5, "seniorPoll": 65.7, "muslimReg": 2.5, "christianReg": 7.4, "totalUnpolled": 2304, "gsbUnpolled": 878, "buntUnpolled": 368, "billavaUnpolled": 410, "sirScore": 61.8, "extraVotes": 248, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "WEAK \u2192 MEDIUM with SIR \u2705", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (57%): 5-8% improvement needed | \ud83d\udc65 CASTE: GSB LOW POLL (58%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (62%): Bunt OC base not fully mobilised | \ud83d\udc65 CASTE: BILLAVA SWING CRISIS (54% poll, 410 unpolled): Largest OBC community abstaining"}, {"ward": "KODIALBAIL", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 9, "strongBooths": 2, "mediumBooths": 7, "weakBooths": 0, "pollRate": 62.4, "poll2018": 66.9, "pollTrend": -4.5, "malePoll": 60.8, "femalePoll": 63.9, "hinduPoll": 64.1, "muslimPoll": 69.9, "christianPoll": 55.2, "gsbPoll": 62.0, "buntPoll": 68.7, "billavaPoll": 66.0, "youthPoll": 59.1, "seniorPoll": 73.0, "muslimReg": 1.6, "christianReg": 19.2, "totalUnpolled": 3368, "gsbUnpolled": 709, "buntUnpolled": 487, "billavaUnpolled": 667, "sirScore": 51.8, "extraVotes": 130, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (19%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: GSB LOW POLL (62%): BJP Brahmin base underperforming \u2014 community engagement needed | \u26a1 GENDER: Women outpoll men (64% vs 61%): Women vote could be Congress-leaning | \ud83d\udc74 AGE: SENIOR DOM"}, {"ward": "BEJAI", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 7, "strongBooths": 0, "mediumBooths": 4, "weakBooths": 3, "pollRate": 58.4, "poll2018": 65.6, "pollTrend": -7.2, "malePoll": 57.3, "femalePoll": 59.5, "hinduPoll": 60.1, "muslimPoll": 57.3, "christianPoll": 54.2, "gsbPoll": 60.9, "buntPoll": 62.8, "billavaPoll": 59.8, "youthPoll": 53.9, "seniorPoll": 68.7, "muslimReg": 4.6, "christianReg": 23.4, "totalUnpolled": 2982, "gsbUnpolled": 598, "buntUnpolled": 353, "billavaUnpolled": 537, "sirScore": 49.8, "extraVotes": 172, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (58%): 5-8% improvement needed | \u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (23%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: GSB LOW POLL (61%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (63%): Bunt OC base no"}, {"ward": "KADRI NORTH", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 6, "strongBooths": 1, "mediumBooths": 1, "weakBooths": 4, "pollRate": 56.5, "poll2018": 71.0, "pollTrend": -14.5, "malePoll": 57.8, "femalePoll": 55.3, "hinduPoll": 57.4, "muslimPoll": 49.0, "christianPoll": 49.6, "gsbPoll": 57.1, "buntPoll": 55.1, "billavaPoll": 60.3, "youthPoll": 54.3, "seniorPoll": 66.1, "muslimReg": 2.7, "christianReg": 17.1, "totalUnpolled": 3089, "gsbUnpolled": 709, "buntUnpolled": 438, "billavaUnpolled": 852, "sirScore": 56.1, "extraVotes": 294, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "WEAK \u2192 MEDIUM with SIR \u2705", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (56%): 5-8% improvement needed | \u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (17%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: GSB LOW POLL (57%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT ABSTENTION (55% poll, 438 unpol"}, {"ward": "KADRI SOUTH", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 4, "strongBooths": 0, "mediumBooths": 1, "weakBooths": 3, "pollRate": 57.8, "poll2018": 77.5, "pollTrend": -19.7, "malePoll": 57.6, "femalePoll": 58.1, "hinduPoll": 60.8, "muslimPoll": 41.4, "christianPoll": 52.0, "gsbPoll": 61.6, "buntPoll": 61.7, "billavaPoll": 62.8, "youthPoll": 50.5, "seniorPoll": 69.7, "muslimReg": 12.8, "christianReg": 16.9, "totalUnpolled": 2220, "gsbUnpolled": 410, "buntUnpolled": 240, "billavaUnpolled": 320, "sirScore": 48.8, "extraVotes": 121, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "WEAK \u2192 MEDIUM with SIR \u2705", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (58%): 5-8% improvement needed | \u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (17%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: GSB LOW POLL (62%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (62%): Bunt OC base no"}, {"ward": "SHIVABAGH", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 5, "strongBooths": 0, "mediumBooths": 2, "weakBooths": 3, "pollRate": 50.1, "poll2018": 58.7, "pollTrend": -8.7, "malePoll": 48.8, "femalePoll": 51.0, "hinduPoll": 53.6, "muslimPoll": 40.3, "christianPoll": 45.4, "gsbPoll": 53.5, "buntPoll": 55.1, "billavaPoll": 57.3, "youthPoll": 47.2, "seniorPoll": 60.6, "muslimReg": 11.9, "christianReg": 15.3, "totalUnpolled": 2368, "gsbUnpolled": 284, "buntUnpolled": 202, "billavaUnpolled": 296, "sirScore": 54.4, "extraVotes": 183, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\u26a0\ufe0f LOW TURNOUT (50%): Below acceptable threshold \u2014 outreach failure | \u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (15%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: GSB ABSTENTION (53% poll, 284 unpolled): Core BJP voter not turning out \u2014 HIGHEST PRIORITY | \ud83d\udc65 CASTE: BUNT ABSTEN"}, {"ward": "PADAV CENTRAL", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 7, "strongBooths": 3, "mediumBooths": 2, "weakBooths": 2, "pollRate": 64.8, "poll2018": 68.2, "pollTrend": -3.3, "malePoll": 62.7, "femalePoll": 66.8, "hinduPoll": 67.2, "muslimPoll": 52.9, "christianPoll": 59.7, "gsbPoll": 69.3, "buntPoll": 69.8, "billavaPoll": 67.4, "youthPoll": 64.3, "seniorPoll": 71.1, "muslimReg": 5.0, "christianReg": 25.5, "totalUnpolled": 3247, "gsbUnpolled": 363, "buntUnpolled": 331, "billavaUnpolled": 808, "sirScore": 44.5, "extraVotes": 45, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (25%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \u271d\ufe0f RELIGION: HIGH CATHOLIC TURNOUT (61%): Catholics voting heavily \u2014 likely against BJP | \u26a1 GENDER: Women outpoll men (67% vs 63%): Women vote could be Congress-leaning | \ud83d\udc74 AGE: SENIOR DOMINAN"}, {"ward": "PADAV EAST", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 3, "strongBooths": 1, "mediumBooths": 0, "weakBooths": 2, "pollRate": 49.1, "poll2018": 67.6, "pollTrend": -18.5, "malePoll": 49.4, "femalePoll": 48.8, "hinduPoll": 51.2, "muslimPoll": 36.3, "christianPoll": 45.4, "gsbPoll": 46.2, "buntPoll": 50.5, "billavaPoll": 53.9, "youthPoll": 49.5, "seniorPoll": 56.3, "muslimReg": 4.2, "christianReg": 35.4, "totalUnpolled": 2231, "gsbUnpolled": 230, "buntUnpolled": 174, "billavaUnpolled": 575, "sirScore": 48.3, "extraVotes": 207, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\u26a0\ufe0f LOW TURNOUT (49%): Below acceptable threshold \u2014 outreach failure | \u271d\ufe0f RELIGION: CHRISTIAN DOMINANT (35%): Catholic swing against BJP \u2014 parish outreach CRITICAL | \ud83d\udc65 CASTE: GSB ABSTENTION (46% poll, 230 unpolled): Core BJP voter not turning out \u2014 HIGHEST PRIORITY | \ud83d\udc65 CASTE: BUNT LOW POLL (51%): Bun"}, {"ward": "MAROLI", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 7, "strongBooths": 1, "mediumBooths": 4, "weakBooths": 2, "pollRate": 60.1, "poll2018": 69.1, "pollTrend": -9.1, "malePoll": 59.9, "femalePoll": 60.3, "hinduPoll": 62.7, "muslimPoll": 54.8, "christianPoll": 54.5, "gsbPoll": 60.3, "buntPoll": 61.3, "billavaPoll": 63.2, "youthPoll": 58.2, "seniorPoll": 68.8, "muslimReg": 2.0, "christianReg": 23.4, "totalUnpolled": 2630, "gsbUnpolled": 316, "buntUnpolled": 222, "billavaUnpolled": 714, "sirScore": 50.7, "extraVotes": 110, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (23%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: GSB LOW POLL (60%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (61%): Bunt OC base not fully mobilised | \ud83d\udc74 AGE: SENIOR DOMINANCE (69% 51-7"}, {"ward": "BENDOOR", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 6, "strongBooths": 0, "mediumBooths": 1, "weakBooths": 5, "pollRate": 52.4, "poll2018": 69.0, "pollTrend": -16.6, "malePoll": 52.1, "femalePoll": 52.7, "hinduPoll": 57.0, "muslimPoll": 48.9, "christianPoll": 51.6, "gsbPoll": 60.7, "buntPoll": 56.0, "billavaPoll": 54.2, "youthPoll": 50.3, "seniorPoll": 64.0, "muslimReg": 15.6, "christianReg": 37.8, "totalUnpolled": 2839, "gsbUnpolled": 219, "buntUnpolled": 216, "billavaUnpolled": 253, "sirScore": 37.5, "extraVotes": 130, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\u26a0\ufe0f LOW TURNOUT (52%): Below acceptable threshold \u2014 outreach failure | \u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (16%): Minority influence \u2014 requires Hindu counter-mobilisation | \u271d\ufe0f RELIGION: CHRISTIAN DOMINANT (38%): Catholic swing against BJP \u2014 parish outreach CRITICAL | \ud83d\udc65 CASTE: GSB LOW POLL (61%): BJP Brah"}, {"ward": "FALNIR", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 8, "strongBooths": 0, "mediumBooths": 2, "weakBooths": 6, "pollRate": 58.1, "poll2018": 69.8, "pollTrend": -11.7, "malePoll": 55.3, "femalePoll": 60.4, "hinduPoll": 60.4, "muslimPoll": 49.7, "christianPoll": 56.0, "gsbPoll": 62.2, "buntPoll": 65.2, "billavaPoll": 59.4, "youthPoll": 58.5, "seniorPoll": 67.5, "muslimReg": 23.7, "christianReg": 25.4, "totalUnpolled": 2782, "gsbUnpolled": 118, "buntUnpolled": 120, "billavaUnpolled": 422, "sirScore": 36.9, "extraVotes": 58, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (58%): 5-8% improvement needed | \u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (24%): Minority influence \u2014 requires Hindu counter-mobilisation | \u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (25%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: BILLAVA UNDERPOLLING (59%): Swin"}, {"ward": "COURT", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 5, "strongBooths": 0, "mediumBooths": 0, "weakBooths": 5, "pollRate": 39.1, "poll2018": 65.8, "pollTrend": -26.7, "malePoll": 39.5, "femalePoll": 39.1, "hinduPoll": 40.4, "muslimPoll": 37.4, "christianPoll": 40.4, "gsbPoll": 44.8, "buntPoll": 39.6, "billavaPoll": 39.8, "youthPoll": 38.0, "seniorPoll": 47.6, "muslimReg": 15.7, "christianReg": 5.7, "totalUnpolled": 2883, "gsbUnpolled": 471, "buntUnpolled": 277, "billavaUnpolled": 331, "sirScore": 64.5, "extraVotes": 437, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\ud83d\udea8 CRITICALLY LOW TURNOUT (39%): Severe voter apathy \u2014 structural demobilisation | \u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (16%): Minority influence \u2014 requires Hindu counter-mobilisation | \ud83d\udc65 CASTE: GSB ABSTENTION (45% poll, 471 unpolled): Core BJP voter not turning out \u2014 HIGHEST PRIORITY | \ud83d\udc65 CASTE: BUNT ABST"}, {"ward": "CENTRAL", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 5, "strongBooths": 0, "mediumBooths": 1, "weakBooths": 4, "pollRate": 59.8, "poll2018": 59.4, "pollTrend": 0.4, "malePoll": 59.3, "femalePoll": 60.2, "hinduPoll": 60.3, "muslimPoll": 77.3, "christianPoll": 58.0, "gsbPoll": 63.2, "buntPoll": 62.0, "billavaPoll": 56.4, "youthPoll": 60.8, "seniorPoll": 70.3, "muslimReg": 68.7, "christianReg": 0.1, "totalUnpolled": 1958, "gsbUnpolled": 940, "buntUnpolled": 134, "billavaUnpolled": 244, "sirScore": 24.9, "extraVotes": 136, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (60%): 5-8% improvement needed | \u262a\ufe0f RELIGION: MUSLIM MAJORITY (69%): Congress structural advantage \u2014 BJP ceiling very low | \ud83d\udc65 CASTE: BUNT LOW POLL (62%): Bunt OC base not fully mobilised | \ud83d\udc65 CASTE: BILLAVA UNDERPOLLING (56%): Swing community not engaged \u2014 Billava Sangha outreach "}, {"ward": "DONGARAKERY", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 7, "strongBooths": 0, "mediumBooths": 2, "weakBooths": 5, "pollRate": 58.2, "poll2018": 66.2, "pollTrend": -8.0, "malePoll": 58.8, "femalePoll": 57.6, "hinduPoll": 58.1, "muslimPoll": 42.3, "christianPoll": 57.4, "gsbPoll": 57.8, "buntPoll": 61.8, "billavaPoll": 57.8, "youthPoll": 57.7, "seniorPoll": 66.5, "muslimReg": 32.6, "christianReg": 2.2, "totalUnpolled": 3165, "gsbUnpolled": 1205, "buntUnpolled": 312, "billavaUnpolled": 478, "sirScore": 46.2, "extraVotes": 284, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (58%): 5-8% improvement needed | \u262a\ufe0f RELIGION: HEAVY MUSLIM (33%): Bloc voting against BJP \u2014 must compensate with Hindu mobilisation | \ud83d\udc65 CASTE: GSB LOW POLL (58%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (62%): Bunt OC base not fully"}, {"ward": "KUDROLI", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 6, "strongBooths": 1, "mediumBooths": 2, "weakBooths": 3, "pollRate": 62.4, "poll2018": 66.6, "pollTrend": -4.2, "malePoll": 61.0, "femalePoll": 63.8, "hinduPoll": 63.5, "muslimPoll": 59.2, "christianPoll": 56.5, "gsbPoll": 58.1, "buntPoll": 51.2, "billavaPoll": 68.5, "youthPoll": 59.6, "seniorPoll": 68.2, "muslimReg": 47.5, "christianReg": 1.7, "totalUnpolled": 2102, "gsbUnpolled": 121, "buntUnpolled": 46, "billavaUnpolled": 231, "sirScore": 36.1, "extraVotes": 32, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u262a\ufe0f RELIGION: HEAVY MUSLIM (47%): Bloc voting against BJP \u2014 must compensate with Hindu mobilisation | \ud83d\udc65 CASTE: GSB LOW POLL (58%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (51%): Bunt OC base not fully mobilised | \ud83d\udc74 AGE: SENIOR DOMINANCE (68% 51-70 poll)"}, {"ward": "BUNDER", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 9, "strongBooths": 0, "mediumBooths": 4, "weakBooths": 5, "pollRate": 60.1, "poll2018": 56.1, "pollTrend": 4.0, "malePoll": 58.7, "femalePoll": 61.6, "hinduPoll": 60.5, "muslimPoll": 57.1, "christianPoll": 43.0, "gsbPoll": 64.8, "buntPoll": 56.3, "billavaPoll": 62.9, "youthPoll": 62.2, "seniorPoll": 66.9, "muslimReg": 34.7, "christianReg": 2.2, "totalUnpolled": 3124, "gsbUnpolled": 525, "buntUnpolled": 100, "billavaUnpolled": 221, "sirScore": 43.8, "extraVotes": 75, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u262a\ufe0f RELIGION: HEAVY MUSLIM (35%): Bloc voting against BJP \u2014 must compensate with Hindu mobilisation | \ud83d\udc65 CASTE: BUNT LOW POLL (56%): Bunt OC base not fully mobilised"}, {"ward": "PORT", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 4, "strongBooths": 1, "mediumBooths": 2, "weakBooths": 1, "pollRate": 63.7, "poll2018": 64.0, "pollTrend": -0.3, "malePoll": 62.9, "femalePoll": 64.8, "hinduPoll": 68.6, "muslimPoll": 61.4, "christianPoll": 63.6, "gsbPoll": 67.2, "buntPoll": 76.9, "billavaPoll": 69.2, "youthPoll": 60.4, "seniorPoll": 73.0, "muslimReg": 34.7, "christianReg": 8.2, "totalUnpolled": 1553, "gsbUnpolled": 162, "buntUnpolled": 73, "billavaUnpolled": 254, "sirScore": 37.0, "extraVotes": 14, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u262a\ufe0f RELIGION: HEAVY MUSLIM (35%): Bloc voting against BJP \u2014 must compensate with Hindu mobilisation | \ud83d\udc74 AGE: SENIOR DOMINANCE (73% 51-70 poll): Senior-driven ward \u2014 welfare & health schemes decisive"}, {"ward": "CONTONMENT", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 5, "strongBooths": 0, "mediumBooths": 0, "weakBooths": 5, "pollRate": 50.8, "poll2018": 63.1, "pollTrend": -12.3, "malePoll": 49.0, "femalePoll": 52.6, "hinduPoll": 52.1, "muslimPoll": 41.4, "christianPoll": 47.2, "gsbPoll": 51.8, "buntPoll": 51.5, "billavaPoll": 53.7, "youthPoll": 53.8, "seniorPoll": 55.0, "muslimReg": 25.8, "christianReg": 9.9, "totalUnpolled": 2477, "gsbUnpolled": 403, "buntUnpolled": 213, "billavaUnpolled": 650, "sirScore": 49.6, "extraVotes": 233, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\u26a0\ufe0f LOW TURNOUT (51%): Below acceptable threshold \u2014 outreach failure | \u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (26%): Minority influence \u2014 requires Hindu counter-mobilisation | \ud83d\udc65 CASTE: GSB ABSTENTION (52% poll, 403 unpolled): Core BJP voter not turning out \u2014 HIGHEST PRIORITY | \ud83d\udc65 CASTE: BUNT ABSTENTION (52% "}, {"ward": "MILAGRES", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 6, "strongBooths": 0, "mediumBooths": 1, "weakBooths": 5, "pollRate": 55.0, "poll2018": 68.7, "pollTrend": -13.7, "malePoll": 53.1, "femalePoll": 57.0, "hinduPoll": 54.6, "muslimPoll": 53.0, "christianPoll": 54.5, "gsbPoll": 57.4, "buntPoll": 54.3, "billavaPoll": 55.2, "youthPoll": 55.2, "seniorPoll": 64.7, "muslimReg": 20.1, "christianReg": 39.1, "totalUnpolled": 3029, "gsbUnpolled": 315, "buntUnpolled": 186, "billavaUnpolled": 390, "sirScore": 33.4, "extraVotes": 137, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\u26a0\ufe0f LOW TURNOUT (55%): Below acceptable threshold \u2014 outreach failure | \u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (20%): Minority influence \u2014 requires Hindu counter-mobilisation | \u271d\ufe0f RELIGION: CHRISTIAN DOMINANT (39%): Catholic swing against BJP \u2014 parish outreach CRITICAL | \ud83d\udc65 CASTE: GSB LOW POLL (57%): BJP Brah"}, {"ward": "VALANCIA", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 6, "strongBooths": 0, "mediumBooths": 1, "weakBooths": 5, "pollRate": 46.2, "poll2018": 65.0, "pollTrend": -18.8, "malePoll": 46.0, "femalePoll": 46.5, "hinduPoll": 49.0, "muslimPoll": 38.1, "christianPoll": 42.4, "gsbPoll": 47.0, "buntPoll": 49.0, "billavaPoll": 50.9, "youthPoll": 44.9, "seniorPoll": 54.9, "muslimReg": 14.2, "christianReg": 28.2, "totalUnpolled": 3262, "gsbUnpolled": 256, "buntUnpolled": 255, "billavaUnpolled": 732, "sirScore": 47.9, "extraVotes": 303, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\u26a0\ufe0f LOW TURNOUT (46%): Below acceptable threshold \u2014 outreach failure | \u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (28%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: GSB ABSTENTION (47% poll, 256 unpolled): Core BJP voter not turning out \u2014 HIGHEST PRIORITY | \ud83d\udc65 CASTE: BUNT ABSTEN"}, {"ward": "KANKANADY", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 8, "strongBooths": 4, "mediumBooths": 2, "weakBooths": 2, "pollRate": 61.6, "poll2018": 72.1, "pollTrend": -10.5, "malePoll": 61.9, "femalePoll": 61.3, "hinduPoll": 62.2, "muslimPoll": 53.3, "christianPoll": 55.3, "gsbPoll": 62.5, "buntPoll": 64.5, "billavaPoll": 63.8, "youthPoll": 60.4, "seniorPoll": 67.4, "muslimReg": 8.3, "christianReg": 21.9, "totalUnpolled": 2876, "gsbUnpolled": 350, "buntUnpolled": 310, "billavaUnpolled": 879, "sirScore": 46.8, "extraVotes": 104, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (22%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udcc9 TREND: Poll COLLAPSED -10% from 2018: Structural voter apathy \u2014 requires emergency intervention"}, {"ward": "ALAPE SOUTH", "status": "STRONG", "emoji": "\ud83d\udfe2", "booths": 7, "strongBooths": 4, "mediumBooths": 3, "weakBooths": 0, "pollRate": 66.9, "poll2018": 70.5, "pollTrend": -3.6, "malePoll": 66.4, "femalePoll": 67.4, "hinduPoll": 71.0, "muslimPoll": 55.6, "christianPoll": 58.5, "gsbPoll": 71.8, "buntPoll": 71.4, "billavaPoll": 72.4, "youthPoll": 64.8, "seniorPoll": 74.0, "muslimReg": 8.1, "christianReg": 11.0, "totalUnpolled": 1866, "gsbUnpolled": 206, "buntUnpolled": 193, "billavaUnpolled": 523, "sirScore": 50.0, "extraVotes": 12, "predFullSir": "MEDIUM", "predIntensive": "STRONG", "upgradePath": "STRONG \u2014 protect gains \ud83d\udee1\ufe0f", "rootCause": "\ud83d\udc74 AGE: SENIOR DOMINANCE (74% 51-70 poll): Senior-driven ward \u2014 welfare & health schemes decisive | \ud83d\udcc9 TREND: Poll declined -4% from 2018: Negative trend \u2014 organisation weakening"}, {"ward": "ALAPE NORTH", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 7, "strongBooths": 2, "mediumBooths": 3, "weakBooths": 2, "pollRate": 63.7, "poll2018": 72.2, "pollTrend": -8.5, "malePoll": 62.9, "femalePoll": 64.5, "hinduPoll": 65.4, "muslimPoll": 39.4, "christianPoll": 58.4, "gsbPoll": 61.4, "buntPoll": 63.6, "billavaPoll": 68.8, "youthPoll": 63.6, "seniorPoll": 71.2, "muslimReg": 14.0, "christianReg": 12.8, "totalUnpolled": 2641, "gsbUnpolled": 255, "buntUnpolled": 266, "billavaUnpolled": 723, "sirScore": 48.0, "extraVotes": 62, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\ud83d\udc65 CASTE: GSB LOW POLL (61%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (64%): Bunt OC base not fully mobilised | \ud83d\udc74 AGE: SENIOR DOMINANCE (71% 51-70 poll): Senior-driven ward \u2014 welfare & health schemes decisive | \ud83d\udcc9 TREND: Poll COLLAPSED -8% from 2018: Str"}, {"ward": "KANNUR", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 7, "strongBooths": 2, "mediumBooths": 1, "weakBooths": 4, "pollRate": 61.7, "poll2018": 69.8, "pollTrend": -8.1, "malePoll": 62.4, "femalePoll": 60.9, "hinduPoll": 59.3, "muslimPoll": 58.2, "christianPoll": 63.0, "gsbPoll": 57.1, "buntPoll": 68.9, "billavaPoll": 56.9, "youthPoll": 62.6, "seniorPoll": 67.5, "muslimReg": 21.5, "christianReg": 19.1, "totalUnpolled": 2686, "gsbUnpolled": 81, "buntUnpolled": 229, "billavaUnpolled": 361, "sirScore": 41.0, "extraVotes": 55, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (22%): Minority influence \u2014 requires Hindu counter-mobilisation | \u271d\ufe0f RELIGION: NOTABLE CHRISTIAN (19%): Church influence shapes outcome \u2014 targeted Catholic outreach needed | \ud83d\udc65 CASTE: GSB LOW POLL (57%): BJP Brahmin base underperforming \u2014 community engagement needed | "}, {"ward": "BAJAL", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 8, "strongBooths": 0, "mediumBooths": 2, "weakBooths": 6, "pollRate": 55.0, "poll2018": 67.2, "pollTrend": -12.2, "malePoll": 56.2, "femalePoll": 53.9, "hinduPoll": 57.9, "muslimPoll": 54.2, "christianPoll": 48.5, "gsbPoll": 59.2, "buntPoll": 56.4, "billavaPoll": 58.9, "youthPoll": 55.8, "seniorPoll": 60.0, "muslimReg": 65.7, "christianReg": 4.7, "totalUnpolled": 3671, "gsbUnpolled": 233, "buntUnpolled": 292, "billavaUnpolled": 847, "sirScore": 26.2, "extraVotes": 160, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\u26a0\ufe0f LOW TURNOUT (55%): Below acceptable threshold \u2014 outreach failure | \u262a\ufe0f RELIGION: MUSLIM MAJORITY (66%): Congress structural advantage \u2014 BJP ceiling very low | \ud83d\udc65 CASTE: GSB LOW POLL (59%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT ABSTENTION (56% poll, 292 unpol"}, {"ward": "JEPPINAMOGRU", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 9, "strongBooths": 2, "mediumBooths": 6, "weakBooths": 1, "pollRate": 61.4, "poll2018": 68.0, "pollTrend": -6.7, "malePoll": 60.5, "femalePoll": 62.2, "hinduPoll": 60.6, "muslimPoll": 53.7, "christianPoll": 56.5, "gsbPoll": 60.3, "buntPoll": 63.2, "billavaPoll": 61.2, "youthPoll": 62.8, "seniorPoll": 66.2, "muslimReg": 15.0, "christianReg": 13.2, "totalUnpolled": 2812, "gsbUnpolled": 211, "buntUnpolled": 397, "billavaUnpolled": 843, "sirScore": 48.5, "extraVotes": 109, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\ud83d\udc65 CASTE: GSB LOW POLL (60%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (63%): Bunt OC base not fully mobilised | \ud83d\udc65 CASTE: BILLAVA UNDERPOLLING (61%): Swing community not engaged \u2014 Billava Sangha outreach needed | \ud83d\udcc9 TREND: Poll declined -7% from 2018: Neg"}, {"ward": "ATTAVARA", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 7, "strongBooths": 1, "mediumBooths": 4, "weakBooths": 2, "pollRate": 62.5, "poll2018": 55.6, "pollTrend": 6.9, "malePoll": 61.3, "femalePoll": 63.6, "hinduPoll": 66.8, "muslimPoll": 56.5, "christianPoll": 54.5, "gsbPoll": 64.7, "buntPoll": 74.7, "billavaPoll": 66.9, "youthPoll": 62.5, "seniorPoll": 70.0, "muslimReg": 29.0, "christianReg": 8.3, "totalUnpolled": 2488, "gsbUnpolled": 267, "buntUnpolled": 139, "billavaUnpolled": 625, "sirScore": 41.2, "extraVotes": 36, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (29%): Minority influence \u2014 requires Hindu counter-mobilisation | \ud83d\udc74 AGE: SENIOR DOMINANCE (70% 51-70 poll): Senior-driven ward \u2014 welfare & health schemes decisive | \ud83d\udcc8 TREND: Poll improved +7% from 2018: Positive momentum \u2014 sustain and build"}, {"ward": "MANGALADEVI", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 6, "strongBooths": 0, "mediumBooths": 4, "weakBooths": 2, "pollRate": 61.9, "poll2018": 57.9, "pollTrend": 4.0, "malePoll": 61.8, "femalePoll": 62.2, "hinduPoll": 65.9, "muslimPoll": 54.8, "christianPoll": 57.9, "gsbPoll": 64.5, "buntPoll": 67.8, "billavaPoll": 66.7, "youthPoll": 60.8, "seniorPoll": 69.5, "muslimReg": 19.2, "christianReg": 10.4, "totalUnpolled": 2335, "gsbUnpolled": 292, "buntUnpolled": 181, "billavaUnpolled": 497, "sirScore": 46.5, "extraVotes": 50, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (19%): Minority influence \u2014 requires Hindu counter-mobilisation | \ud83d\udc74 AGE: SENIOR DOMINANCE (70% 51-70 poll): Senior-driven ward \u2014 welfare & health schemes decisive"}, {"ward": "HOIGE BAZAR", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 5, "strongBooths": 2, "mediumBooths": 1, "weakBooths": 2, "pollRate": 60.0, "poll2018": 0, "pollTrend": 0, "malePoll": 58.4, "femalePoll": 61.5, "hinduPoll": 61.2, "muslimPoll": 56.6, "christianPoll": 60.2, "gsbPoll": 60.8, "buntPoll": 62.6, "billavaPoll": 62.7, "youthPoll": 59.3, "seniorPoll": 66.7, "muslimReg": 22.0, "christianReg": 6.3, "totalUnpolled": 2430, "gsbUnpolled": 308, "buntUnpolled": 217, "billavaUnpolled": 643, "sirScore": 48.9, "extraVotes": 94, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (22%): Minority influence \u2014 requires Hindu counter-mobilisation | \ud83d\udc65 CASTE: GSB LOW POLL (61%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (63%): Bunt OC base not fully mobilised | \u26a1 GENDER: Women outpoll men (62% vs 58%): W"}, {"ward": "BOLAR", "status": "MEDIUM", "emoji": "\ud83d\udfe1", "booths": 6, "strongBooths": 1, "mediumBooths": 1, "weakBooths": 4, "pollRate": 60.3, "poll2018": 0, "pollTrend": 0, "malePoll": 58.8, "femalePoll": 61.6, "hinduPoll": 63.6, "muslimPoll": 52.3, "christianPoll": 56.9, "gsbPoll": 68.0, "buntPoll": 62.4, "billavaPoll": 63.5, "youthPoll": 59.3, "seniorPoll": 68.3, "muslimReg": 27.4, "christianReg": 13.1, "totalUnpolled": 2458, "gsbUnpolled": 269, "buntUnpolled": 376, "billavaUnpolled": 664, "sirScore": 41.0, "extraVotes": 85, "predFullSir": "MEDIUM", "predIntensive": "MEDIUM", "upgradePath": "MEDIUM \u2192 STAYS MEDIUM \ud83d\udccc", "rootCause": "\u262a\ufe0f RELIGION: SIGNIFICANT MUSLIM (27%): Minority influence \u2014 requires Hindu counter-mobilisation | \ud83d\udc65 CASTE: BUNT LOW POLL (62%): Bunt OC base not fully mobilised | \ud83d\udc74 AGE: SENIOR DOMINANCE (68% 51-70 poll): Senior-driven ward \u2014 welfare & health schemes decisive"}, {"ward": "JEPPU", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 8, "strongBooths": 2, "mediumBooths": 3, "weakBooths": 3, "pollRate": 57.4, "poll2018": 66.1, "pollTrend": -8.7, "malePoll": 56.4, "femalePoll": 58.5, "hinduPoll": 60.7, "muslimPoll": 54.0, "christianPoll": 52.2, "gsbPoll": 59.9, "buntPoll": 59.9, "billavaPoll": 63.4, "youthPoll": 57.2, "seniorPoll": 64.8, "muslimReg": 8.1, "christianReg": 8.2, "totalUnpolled": 3188, "gsbUnpolled": 234, "buntUnpolled": 200, "billavaUnpolled": 709, "sirScore": 57.2, "extraVotes": 116, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (57%): 5-8% improvement needed | \ud83d\udc65 CASTE: GSB LOW POLL (60%): BJP Brahmin base underperforming \u2014 community engagement needed | \ud83d\udc65 CASTE: BUNT LOW POLL (60%): Bunt OC base not fully mobilised | \ud83d\udcc9 TREND: Poll COLLAPSED -9% from 2018: Structural voter apathy \u2014 requires emergency inte"}, {"ward": "BENGRE", "status": "WEAK", "emoji": "\ud83d\udd34", "booths": 8, "strongBooths": 2, "mediumBooths": 2, "weakBooths": 4, "pollRate": 55.0, "poll2018": 68.4, "pollTrend": -13.4, "malePoll": 55.2, "femalePoll": 54.8, "hinduPoll": 76.2, "muslimPoll": 27.7, "christianPoll": 31.6, "gsbPoll": 74.7, "buntPoll": 76.5, "billavaPoll": 44.7, "youthPoll": 57.7, "seniorPoll": 54.9, "muslimReg": 49.0, "christianReg": 4.0, "totalUnpolled": 3730, "gsbUnpolled": 57, "buntUnpolled": 68, "billavaUnpolled": 735, "sirScore": 35.2, "extraVotes": 142, "predFullSir": "WEAK", "predIntensive": "WEAK", "upgradePath": "STAYS WEAK \u2014 structural \u274c", "rootCause": "\ud83d\udcc9 BELOW-AVG TURNOUT (55%): 5-8% improvement needed | \u262a\ufe0f RELIGION: HEAVY MUSLIM (49%): Bloc voting against BJP \u2014 must compensate with Hindu mobilisation | \ud83d\udc65 CASTE: BILLAVA SWING CRISIS (45% poll, 735 unpolled): Largest OBC community abstaining \u2014 key swing lost | \ud83d\udc69 GENDER: FEMALE UNDERPOLLING (55%): W"}];

// ── Constituency-level computed stats ────────────────────────────────────────
const TOTAL_VOTERS    = 251998;
const TOTAL_POLLED    = 141707;
const NON_POLLED      = 105253;
const POLL_RATE_2023  = 58.3;
const TOTAL_WARDS     = 38;
const TOTAL_BOOTHS    = 244;

const COMMUNITY_POLL = [
  { name: 'Hindu OBC',          rate: 62.6, color: '#f59e0b' },
  { name: 'Hindu OC (Bunt)',    rate: 61.1, color: '#f59e0b' },
  { name: 'Hindu Brahmin (GSB)',rate: 60.3, color: '#f59e0b' },
  { name: 'Christian',          rate: 53.4, color: '#60a5fa' },
  { name: 'Muslim',             rate: 50.1, color: '#34d399' },
];

const COMMUNITY_PIE = [
  { name: 'Hindu OBC',    value: 31, color: '#f59e0b' },
  { name: 'Hindu OC',     value: 22, color: '#fbbf24' },
  { name: 'Hindu GSB',    value: 14, color: '#fcd34d' },
  { name: 'Christian',    value: 18, color: '#60a5fa' },
  { name: 'Muslim',       value: 11, color: '#34d399' },
  { name: 'Others',       value: 4,  color: '#94a3b8' },
];

const AGE_POLL = [
  { age: '18-25', rate: 61.3, polled: 13357 },
  { age: '26-35', rate: 49.5, polled: 21484 },
  { age: '36-45', rate: 54.4, polled: 25305 },
  { age: '46-55', rate: 63.5, polled: 30378 },
  { age: '56-65', rate: 66.3, polled: 26702 },
  { age: '65+',   rate: 51.4, polled: 23184 },
];

const POLL_TREND = [
  { year: '2013', rate: 72.1 },
  { year: '2018', rate: 68.4 },
  { year: '2019LS', rate: 72.8 },
  { year: '2023', rate: 58.3 },
];

const TABS = ['Dashboard','Heatmap','Ward Drill','Prediction','Strategy'];

const STATUS_COLOR = {
  STRONG: { bg: '#052e16', border: '#16a34a', text: '#4ade80', badge: '#16a34a', label: 'STRONGHOLD' },
  MEDIUM: { bg: '#1c1917', border: '#ca8a04', text: '#fbbf24', badge: '#ca8a04', label: 'MEDIUM' },
  WEAK:   { bg: '#1c0a0a', border: '#dc2626', text: '#f87171', badge: '#dc2626', label: 'WEAK' },
};

function StatusBadge({ status, small }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.WEAK;
  return (
    <span style={{
      background: c.badge, color: '#fff',
      fontSize: small ? 8 : 10, fontWeight: 800,
      padding: small ? '1px 5px' : '2px 7px',
      borderRadius: 4, letterSpacing: 0.5, textTransform: 'uppercase',
    }}>{c.label}</span>
  );
}

// ── DASHBOARD TAB ─────────────────────────────────────────────────────────────
function DashboardTab() {
  const weak   = WARD_DATA.filter(w => w.status === 'WEAK').length;
  const medium = WARD_DATA.filter(w => w.status === 'MEDIUM').length;
  const strong = WARD_DATA.filter(w => w.status === 'STRONG').length;
  const totalUnpolled = WARD_DATA.reduce((s,w) => s + (w.totalUnpolled||0), 0);
  const avgSir = (WARD_DATA.reduce((s,w) => s + (w.sirScore||0), 0) / WARD_DATA.length).toFixed(1);

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return value > 6 ? (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
            fontSize={10} fontWeight={700}>{value}%</text>
    ) : null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Voters', val: '2,51,998', sub: 'Current voter list', color: '#60a5fa' },
          { label: 'Poll Rate 2023', val: '58.3%', sub: 'Constituency avg', color: '#fbbf24' },
          { label: 'Polled (2023)', val: '1,41,707', sub: 'Actually voted', color: '#4ade80' },
          { label: 'Non-Polled', val: '1,05,253', sub: "Didn't vote — target", color: '#f87171' },
          { label: 'Strong Wards', val: String(strong), sub: 'BJP >70%', color: '#4ade80' },
          { label: 'Weak Wards', val: String(weak), sub: 'Priority intervention', color: '#f87171' },
        ].map(k => (
          <div key={k.label} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.val}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Pie chart */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Community Composition</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={COMMUNITY_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                   dataKey="value" labelLine={false} label={CustomPieLabel}>
                {COMMUNITY_PIE.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`}
                contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, fontSize:11 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4 }}>
            {COMMUNITY_PIE.map(c => (
              <div key={c.name} style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, color:'#94a3b8' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, flexShrink:0 }}/>
                {c.name} {c.value}%
              </div>
            ))}
          </div>
        </div>

        {/* Community poll rate bar */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Poll Rate by Community</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {COMMUNITY_POLL.map(c => (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginBottom: 3 }}>
                  <span>{c.name}</span>
                  <span style={{ fontWeight: 700, color: c.rate > 58 ? '#4ade80' : c.rate > 52 ? '#fbbf24' : '#f87171' }}>{c.rate}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.rate}%`, background: c.color, borderRadius: 4, transition: 'width 0.6s ease' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Age + Gender + Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Age group */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Poll Rate by Age Group</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={AGE_POLL} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="age" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}/>
              <YAxis domain={[45, 70]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, fontSize:11 }} formatter={v=>`${v}%`}/>
              <Bar dataKey="rate" fill="#f59e0b" radius={[4,4,0,0]}
                label={{ position:'top', fontSize:8, fill:'#94a3b8', formatter: v=>`${v}%` }}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:9, color:'#f87171', marginTop:4 }}>⚠ Highest gap: 26–35 age — 50,500 non-pollers</div>
        </div>

        {/* Historical trend */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>Historical Poll Rate Trend</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              <div style={{ fontSize: 9, color: '#64748b' }}>Female polled</div>
              <div style={{ fontWeight: 700, color: '#f0abfc' }}>74,380</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>Rate: 58.6%</div>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              <div style={{ fontSize: 9, color: '#64748b' }}>Male polled</div>
              <div style={{ fontWeight: 700, color: '#60a5fa' }}>67,316</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>Rate: 56.1%</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={POLL_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}/>
              <YAxis domain={[55, 76]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, fontSize:11 }} formatter={v=>`${v}%`}/>
              <Line type="monotone" dataKey="rate" stroke="#60a5fa" strokeWidth={2.5} dot={{ fill:'#60a5fa', r:4 }}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize:9, color:'#f87171', marginTop:4 }}>⚠ Female votes BJP by +2.5% — key swing lever</div>
        </div>
      </div>

      {/* Gender + Summary */}
      <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 10 }}>⚡ KEY INTELLIGENCE SUMMARY</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            `Total unpolled voters: ${NON_POLLED.toLocaleString()} — massive mobilisation opportunity`,
            `26–35 age group is the biggest gap: 49.5% poll rate vs 63%+ seniors`,
            `Female turnout +2.5% over male — Mahila Morcha is a proven lever`,
            `${weak} wards classified WEAK — need immediate SIR intervention`,
            `Muslim poll rate 50.1% — below-avg, low BJP conversion expected`,
            `Billava community (swing): 59.7% poll rate — highest upside potential`,
          ].map((s,i) => (
            <div key={i} style={{ fontSize: 10, color: '#94a3b8', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ color:'#f59e0b', flexShrink:0 }}>→</span>{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HEATMAP TAB (legacy SIR data view) ───────────────────────────────────────
function HeatmapTabLegacy() {
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  const filtered = filter === 'ALL' ? WARD_DATA : WARD_DATA.filter(w => w.status === filter);

  const getPriorityLabel = (w) => {
    if (w.totalUnpolled > 3000) return { label: 'CRITICAL', color: '#ef4444' };
    if (w.totalUnpolled > 2000) return { label: 'HIGH', color: '#f59e0b' };
    if (w.totalUnpolled > 1000) return { label: 'MEDIUM', color: '#60a5fa' };
    return { label: 'NORMAL', color: '#64748b' };
  };

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['ALL','STRONG','MEDIUM','WEAK'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
            background: filter === f
              ? (f === 'STRONG' ? '#16a34a' : f === 'MEDIUM' ? '#ca8a04' : f === 'WEAK' ? '#dc2626' : '#334155')
              : 'rgba(255,255,255,0.05)',
            color: filter === f ? '#fff' : '#64748b',
            transition: 'all 0.2s',
          }}>{f} {f !== 'ALL' && `(${WARD_DATA.filter(w=>w.status===f).length})`}</button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b', alignSelf: 'center' }}>
          {filtered.length} wards · click for detail
        </div>
      </div>

      {/* Ward cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {filtered.map(w => {
          const c = STATUS_COLOR[w.status] || STATUS_COLOR.WEAK;
          const p = getPriorityLabel(w);
          const isSelected = selected?.ward === w.ward;
          return (
            <div key={w.ward} onClick={() => setSelected(isSelected ? null : w)}
              style={{
                background: isSelected ? c.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? c.border : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.text, lineHeight: 1.3 }}>
                  {w.emoji} {w.ward}
                </div>
                <StatusBadge status={w.status} small/>
              </div>

              {/* Mini progress bar */}
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${w.pollRate}%`, background: c.border, borderRadius: 2 }}/>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 9, color: '#64748b' }}>
                  Poll: <span style={{ color: w.pollRate < 58 ? '#f87171' : '#4ade80', fontWeight: 700 }}>{w.pollRate}%</span>
                  &nbsp;|&nbsp;SIR: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{w.sirScore}</span>
                </div>
                <span style={{
                  fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
                  background: p.color + '22', color: p.color,
                }}>{p.label}</span>
              </div>

              {/* Trend */}
              <div style={{ fontSize: 9, color: w.pollTrend < 0 ? '#f87171' : '#4ade80', marginTop: 4 }}>
                {w.pollTrend < 0 ? '↓' : '↑'} {Math.abs(w.pollTrend)}% vs 2018
                &nbsp;·&nbsp;{(w.totalUnpolled||0).toLocaleString()} unpolled
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected ward detail */}
      {selected && (
        <div style={{
          marginTop: 14, background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${STATUS_COLOR[selected.status]?.border || '#334155'}`,
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{selected.emoji} {selected.ward}</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
            {[
              ['Poll Rate', `${selected.pollRate}%`, '#60a5fa'],
              ['2018 Rate', `${selected.poll2018}%`, '#94a3b8'],
              ['Trend', `${selected.pollTrend > 0 ? '+' : ''}${selected.pollTrend}%`, selected.pollTrend < 0 ? '#f87171' : '#4ade80'],
              ['Male Poll', `${selected.malePoll}%`, '#60a5fa'],
              ['Female Poll', `${selected.femalePoll}%`, '#f0abfc'],
              ['SIR Score', selected.sirScore, '#fbbf24'],
              ['Hindu Poll', `${selected.hinduPoll}%`, '#f59e0b'],
              ['Muslim Poll', `${selected.muslimPoll}%`, '#34d399'],
              ['Christian Poll', `${selected.christianPoll}%`, '#60a5fa'],
              ['GSB Unpolled', (selected.gsbUnpolled||0).toLocaleString(), '#fbbf24'],
              ['Bunt Unpolled', (selected.buntUnpolled||0).toLocaleString(), '#fbbf24'],
              ['Billava Unpolled', (selected.billavaUnpolled||0).toLocaleString(), '#fbbf24'],
            ].map(([l,v,c]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          {selected.rootCause && (
            <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, marginBottom: 4, fontSize: 10 }}>ROOT CAUSE ANALYSIS</div>
              {selected.rootCause.split(' | ').map((s,i) => <div key={i} style={{ marginBottom: 3 }}>{s}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── WARD DRILL TAB ────────────────────────────────────────────────────────────
function WardDrillTab() {
  const [sortBy, setSortBy] = useState('totalUnpolled');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    return [...WARD_DATA].sort((a, b) => {
      const va = a[sortBy] ?? 0, vb = b[sortBy] ?? 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [sortBy, sortDir]);

  const cols = [
    { key: 'ward',          label: 'Ward',           w: '130px' },
    { key: 'status',        label: 'Status',         w: '80px'  },
    { key: 'pollRate',      label: 'Poll%',          w: '60px'  },
    { key: 'pollTrend',     label: 'Trend',          w: '55px'  },
    { key: 'hinduPoll',     label: 'Hindu%',         w: '60px'  },
    { key: 'muslimPoll',    label: 'Muslim%',        w: '60px'  },
    { key: 'youthPoll',     label: 'Youth%',         w: '58px'  },
    { key: 'totalUnpolled', label: 'Unpolled',       w: '70px'  },
    { key: 'sirScore',      label: 'SIR',            w: '50px'  },
    { key: 'extraVotes',    label: '+Votes',         w: '60px'  },
  ];

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  return (
    <div>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 10 }}>Click column headers to sort · {WARD_DATA.length} wards</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} onClick={() => toggleSort(c.key)}
                  style={{
                    padding: '8px 10px', textAlign: 'left', cursor: 'pointer',
                    color: sortBy === c.key ? '#fbbf24' : '#64748b',
                    fontWeight: 700, fontSize: 10, letterSpacing: 0.3,
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    whiteSpace: 'nowrap',
                    minWidth: c.w,
                  }}>
                  {c.label} {sortBy === c.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((w, i) => {
              const c = STATUS_COLOR[w.status] || STATUS_COLOR.WEAK;
              return (
                <tr key={w.ward} style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '7px 10px', color: '#e2e8f0', fontWeight: 600, fontSize: 11 }}>{w.ward}</td>
                  <td style={{ padding: '7px 10px' }}><StatusBadge status={w.status} small/></td>
                  <td style={{ padding: '7px 10px', color: w.pollRate < 58 ? '#f87171' : '#4ade80', fontWeight: 700 }}>{w.pollRate}%</td>
                  <td style={{ padding: '7px 10px', color: w.pollTrend < 0 ? '#f87171' : '#4ade80', fontWeight: 600 }}>
                    {w.pollTrend > 0 ? '+' : ''}{w.pollTrend}%
                  </td>
                  <td style={{ padding: '7px 10px', color: '#fbbf24' }}>{w.hinduPoll}%</td>
                  <td style={{ padding: '7px 10px', color: '#34d399' }}>{w.muslimPoll}%</td>
                  <td style={{ padding: '7px 10px', color: '#60a5fa' }}>{w.youthPoll}%</td>
                  <td style={{ padding: '7px 10px', color: '#f87171', fontWeight: 700 }}>{(w.totalUnpolled||0).toLocaleString()}</td>
                  <td style={{ padding: '7px 10px', color: '#fbbf24' }}>{w.sirScore}</td>
                  <td style={{ padding: '7px 10px', color: '#4ade80', fontWeight: 700 }}>+{(w.extraVotes||0).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PREDICTION TAB ────────────────────────────────────────────────────────────
function PredictionTab() {
  const upgradeable = WARD_DATA.filter(w => w.predFullSir && w.predFullSir !== w.status && w.predIntensive);
  const totalExtraVotes = WARD_DATA.reduce((s,w) => s + (w.extraVotes||0), 0);

  const scenarioData = [
    { name: 'No Campaign',  strong: 2, medium: 8, weak: 28 },
    { name: 'Basic',        strong: 5, medium: 14, weak: 19 },
    { name: 'Full SIR',     strong: 12, medium: 18, weak: 8 },
    { name: 'Intensive',    strong: 20, medium: 14, weak: 4 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { l:'Total Extra Votes Possible', v: `+${totalExtraVotes.toLocaleString()}`, c:'#4ade80' },
          { l:'Wards Upgradeable (Full SIR)', v: `${upgradeable.length}`, c:'#fbbf24' },
          { l:'Full SIR Win Probability', v: '74%', c:'#60a5fa' },
        ].map(k => (
          <div key={k.l} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:9, color:'#64748b', marginBottom:4 }}>{k.l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Scenario stacked bar */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:10 }}>Ward Outcome by Campaign Scenario</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={scenarioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
            <XAxis dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:9, fill:'#64748b' }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, fontSize:11 }}/>
            <Legend wrapperStyle={{ fontSize:10, color:'#94a3b8' }}/>
            <Bar dataKey="strong" name="Strong" stackId="a" fill="#16a34a" radius={[0,0,0,0]}/>
            <Bar dataKey="medium" name="Medium" stackId="a" fill="#ca8a04"/>
            <Bar dataKey="weak"   name="Weak"   stackId="a" fill="#dc2626" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upgradeable wards list */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', marginBottom:10 }}>Upgrade Candidates — Full SIR Campaign</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
          {WARD_DATA.filter(w=>w.extraVotes > 200).sort((a,b)=>(b.extraVotes||0)-(a.extraVotes||0)).slice(0,10).map(w => (
            <div key={w.ward} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#e2e8f0' }}>{w.ward}</div>
                <div style={{ fontSize:9, color:'#64748b' }}>{w.upgradePath || `${w.status} → ?`}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#4ade80' }}>+{(w.extraVotes||0).toLocaleString()}</div>
                <div style={{ fontSize:9, color:'#64748b' }}>extra votes</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── STRATEGY TAB ──────────────────────────────────────────────────────────────
function StrategyTab() {
  const priorities = [
    {
      label: 'P1 — FLIP NOW (Weak → Medium)',
      color: '#ef4444',
      wards: WARD_DATA.filter(w => w.status === 'WEAK' && w.extraVotes > 200)
                      .sort((a,b) => (b.extraVotes||0) - (a.extraVotes||0)).slice(0,6),
      actions: ['Booth president appointment in all weak booths','GSB+Bunt+Billava Sangha community head meetings','Door-to-door: contact 2018/2019 BJP voters who did not poll','Voter list audit: register new BJP-friendly voters 18–25'],
    },
    {
      label: 'P2 — STRENGTHEN (Medium → Strong)',
      color: '#f59e0b',
      wards: WARD_DATA.filter(w => w.status === 'MEDIUM')
                      .sort((a,b) => (b.extraVotes||0) - (a.extraVotes||0)).slice(0,6),
      actions: ['Candidate Jan Sampark — personal visit every booth','Billava Sangha community event — candidate interaction','Polling slip distribution + transport for elderly/women','Mock polling day drill — identify booth management gaps'],
    },
    {
      label: 'P3 — DEFEND (Strongholds)',
      color: '#16a34a',
      wards: WARD_DATA.filter(w => w.status === 'STRONG'),
      actions: ['5AM booth agents — no complacency','Vehicle fleet for elderly voters','Hourly poll rate check 9AM 12PM 2PM 4PM','Mahila captains active 8AM–5PM'],
    },
  ];

  const communityActions = [
    { comm: 'GSB (Brahmin)', icon: '🧠', action: 'GSB Mahotsava event + Sangha head personal visit + polling day transport. BJP gets 90%+ GSB votes.' },
    { comm: 'Bunt (OC)', icon: '👑', action: 'Bunt Sangha coordination + OC community pride rally. BJP gets 85%+ Bunt votes.' },
    { comm: 'Billava (Swing)', icon: '⚡', action: 'CRITICAL swing community — Billava Sangha event + candidate personal meetings. BJP gets ~55% Billava votes.' },
    { comm: 'Women', icon: '👩', action: 'Mahila Morcha activation + SHG heads mobilisation. Women poll 2.5% more than men.' },
    { comm: 'Youth 18–35', icon: '🧑', action: 'Social media + youth wing activation. Biggest gap group — 49.5% poll rate vs 63% seniors.' },
    { comm: 'Christian', icon: '✝️', action: 'Catholic BJP local leader as booth agent. 53.4% poll rate — below Hindu avg.' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {priorities.map(p => (
        <div key={p.label} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${p.color}33`, borderRadius:12, padding:14 }}>
          <div style={{ fontSize:12, fontWeight:800, color:p.color, marginBottom:10 }}>{p.label}</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:10 }}>
            {p.wards.map(w => (
              <div key={w.ward} style={{ padding:'5px 10px', background:p.color+'15', border:`1px solid ${p.color}33`, borderRadius:6, fontSize:10, color:'#e2e8f0' }}>
                {w.ward} {w.extraVotes ? <span style={{ color:p.color, fontWeight:700 }}>+{w.extraVotes}</span> : ''}
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6 }}>
            {p.actions.map((a,i) => (
              <div key={i} style={{ fontSize:10, color:'#94a3b8', display:'flex', gap:6 }}>
                <span style={{ color:p.color, flexShrink:0 }}>→</span>{a}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Community actions */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:14 }}>
        <div style={{ fontSize:12, fontWeight:800, color:'#fbbf24', marginBottom:10 }}>Community-Specific Actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {communityActions.map(c => (
            <div key={c.comm} style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#e2e8f0', marginBottom:4 }}>{c.icon} {c.comm}</div>
              <div style={{ fontSize:10, color:'#94a3b8', lineHeight:1.5 }}>{c.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

// ─── Advanced Heatmap with Side Panel ────────────────────────────────────────
function HeatmapTab({ WARDS_FULL, clsCfg, pColor, expandedWard, setExpandedWard }) {
  const [filter, setFilter] = useState('ALL');
  const selected = WARDS_FULL.find(d => d.w === expandedWard) || null;

  const FILTERS = [
    { id:'ALL', label:'All Wards' },
    { id:'STRONGHOLD', label:'Stronghold' },
    { id:'STRONG', label:'Strong' },
    { id:'FAVOURABLE', label:'Favourable' },
    { id:'CONTESTED', label:'Contested' },
    { id:'CONGRESS', label:'Congress' },
  ];

  const clsGroup = (cls) => {
    if (cls.includes('STRONGHOLD')) return 'STRONGHOLD';
    if (cls.includes('BJP STRONG') && !cls.includes('FAVO')) return 'STRONG';
    if (cls.includes('FAVO')) return 'FAVOURABLE';
    if (cls.includes('CONTESTED')) return 'CONTESTED';
    return 'CONGRESS';
  };

  const filtered = WARDS_FULL.filter(d => filter === 'ALL' || clsGroup(d.cls) === filter);

  const getReligionBar = (d) => {
    const total = d.hindu + d.muslim + d.christian;
    return [
      { pct: (d.hindu / total) * 100, color: '#f97316' },
      { pct: (d.muslim / total) * 100, color: '#34d399' },
      { pct: (d.christian / total) * 100, color: '#818cf8' },
    ];
  };

  const cfg = selected ? clsCfg(selected.cls) : null;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

      {/* Left: Filter + Grid */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Filter pills */}
        <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
          {FILTERS.map(f => {
            const isActive = filter === f.id;
            const count = f.id === 'ALL' ? WARDS_FULL.length : WARDS_FULL.filter(d => clsGroup(d.cls) === f.id).length;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding:'5px 12px', borderRadius:20, fontSize:10.5, fontWeight:700,
                cursor:'pointer', border:'none', whiteSpace:'nowrap',
                background: isActive ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.04)',
                color: isActive ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                outline: isActive ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                transition:'all 0.2s',
              }}>
                {f.label} <span style={{opacity:0.6}}>({count})</span>
              </button>
            );
          })}
          <div style={{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.25)' }}>
            {filtered.length} wards · click for intelligence detail
          </div>
        </div>

        {/* Ward cards grid */}
        <div style={{ display:'grid', gridTemplateColumns: selected ? 'repeat(auto-fill,minmax(175px,1fr))' : 'repeat(auto-fill,minmax(188px,1fr))', gap:7 }}>
          {filtered.map(d => {
            const c = clsCfg(d.cls);
            const isOpen = expandedWard === d.w;
            const bars = getReligionBar(d);
            const priorityRisk = d.priority && (d.priority.includes('CRITICAL') || d.priority.includes('HIGH') || d.priority.includes('MEDIUM'));
            const isRisk = d.alert && d.alert.includes('RISK');

            return (
              <div key={d.w}
                onClick={() => setExpandedWard(isOpen ? null : d.w)}
                style={{
                  background: isOpen
                    ? `linear-gradient(135deg,${c.color}18,${c.color}08)`
                    : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isOpen ? c.color + '60' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12,
                  padding: '11px 13px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isOpen ? `0 8px 32px ${c.color}20` : 'none',
                  position: 'relative',
                }}
              >
                {isRisk && (
                  <div style={{
                    position:'absolute', top:10, right:10,
                    width:6, height:6, borderRadius:'50%',
                    background:'#ef4444',
                    boxShadow:'0 0 0 2px rgba(239,68,68,0.3)',
                  }}/>
                )}

                <div style={{ marginBottom:7 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.2px', lineHeight:1.2 }}>
                    W{d.w} · {d.n}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                    <span style={{
                      fontSize:8, fontWeight:800, padding:'1px 5px', borderRadius:3,
                      background: c.bg, color: c.color, border:`1px solid ${c.color}44`,
                      letterSpacing:0.3,
                    }}>{c.label}</span>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{d.totalElectors.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ height:3, borderRadius:2, overflow:'hidden', display:'flex', marginBottom:7 }}>
                  {bars.map((b, i) => (
                    <div key={i} style={{ width:`${b.pct}%`, height:'100%', background:b.color }}/>
                  ))}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:900, color: d.margin >= 0 ? c.color : '#8b5cf6', lineHeight:1 }}>
                      {d.margin >= 0 ? '+' : ''}{d.margin.toFixed(0)}%
                    </div>
                    <div style={{ fontSize:8, color:'rgba(255,255,255,0.25)', marginTop:1 }}>margin</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:900, color: d.poll < 55 ? '#f87171' : d.poll > 62 ? '#4ade80' : '#fbbf24', lineHeight:1 }}>
                      {d.poll.toFixed(0)}%
                    </div>
                    <div style={{ fontSize:8, color:'rgba(255,255,255,0.25)', marginTop:1 }}>turnout</div>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ flex:1, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{
                      width:`${Math.min(100,d.wsi)}%`, height:'100%', borderRadius:2,
                      background: d.wsi >= 70 ? '#10b981' : d.wsi >= 50 ? '#f59e0b' : '#ef4444',
                    }}/>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap' }}>
                    WSI {d.wsi.toFixed(0)}
                  </span>
                </div>

                {priorityRisk && (
                  <div style={{ marginTop:6 }}>
                    <span style={{
                      fontSize:8, fontWeight:800, padding:'2px 6px', borderRadius:3,
                      background: pColor(d.priority) + '18', color: pColor(d.priority),
                      letterSpacing:0.3,
                    }}>{d.priority}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Intelligence Panel */}
      {selected && cfg && (
        <div style={{
          width: 340, flexShrink:0,
          background:'linear-gradient(160deg,#0a1628 0%,#0d1f3c 100%)',
          border:`1px solid ${cfg.color}40`,
          borderRadius:16,
          boxShadow:`0 0 0 1px ${cfg.color}15, 0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)`,
          overflow:'hidden',
          position:'sticky', top:20,
          maxHeight:'85vh', overflowY:'auto',
        }}>
          <div style={{
            background:`linear-gradient(135deg,${cfg.color}22,${cfg.color}08)`,
            borderBottom:`1px solid ${cfg.color}30`,
            padding:'14px 16px',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:15, fontWeight:900, color:'#f1f5f9', letterSpacing:'-0.3px' }}>
                  W{selected.w} · {selected.n}
                </div>
                <div style={{ display:'flex', gap:6, marginTop:5, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{
                    fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:4,
                    background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}50`,
                  }}>{cfg.label}</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{selected.totalElectors.toLocaleString()} electors</span>
                </div>
              </div>
              <button onClick={() => setExpandedWard(null)} style={{
                background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.5)',
                cursor:'pointer', fontSize:16, width:28, height:28, borderRadius:7,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              }}>×</button>
            </div>
            <div style={{
              marginTop:10, padding:'8px 10px', borderRadius:8,
              background:'rgba(0,0,0,0.3)', border:`1px solid ${cfg.color}25`,
            }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:0.6, marginBottom:2 }}>PREDICTION</div>
              <div style={{ fontSize:11, fontWeight:700, color:cfg.color }}>{selected.prediction}</div>
            </div>
          </div>

          <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
              {[
                { l:'Poll', v:`${selected.poll.toFixed(1)}%`, ok:selected.poll>60, icon:'🗳' },
                { l:'BJP%', v:`${selected.hjp.toFixed(0)}%`, ok:selected.hjp>65, icon:'🔶' },
                { l:'WSI', v:selected.wsi.toFixed(0), ok:selected.wsi>60, icon:'📊' },
                { l:'Margin', v:`${selected.margin>=0?'+':''}${selected.margin.toFixed(0)}%`, ok:selected.margin>0, icon:'📈' },
                { l:'BLO', v:`${selected.blo.toFixed(0)}%`, ok:selected.blo>57, icon:'📋' },
                { l:'Progeny', v:`${selected.prog.toFixed(0)}%`, ok:selected.prog<100, icon:'👥' },
              ].map((m,i) => (
                <div key={i} style={{
                  background: m.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.07)',
                  border: `1px solid ${m.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.18)'}`,
                  borderRadius:8, padding:'8px 9px', textAlign:'center',
                }}>
                  <div style={{ fontSize:14, marginBottom:2 }}>{m.icon}</div>
                  <div style={{ fontSize:13, fontWeight:900, color: m.ok ? '#10b981' : '#f87171' }}>{m.v}</div>
                  <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{m.l}</div>
                </div>
              ))}
            </div>

            <div style={{
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:10, padding:'11px 13px',
            }}>
              <div style={{ fontSize:9, fontWeight:800, color:'rgba(255,255,255,0.3)', letterSpacing:0.8, marginBottom:8, textTransform:'uppercase' }}>
                Religion Composition
              </div>
              {[
                { label:'Hindu', val:selected.hindu, color:'#f97316' },
                { label:'Muslim', val:selected.muslim, color:'#34d399' },
                { label:'Christian', val:selected.christian, color:'#818cf8' },
              ].map(r => (
                <div key={r.label} style={{ marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>{r.label}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:r.color }}>{r.val.toFixed(1)}%</span>
                  </div>
                  <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ width:`${r.val}%`, height:'100%', background:r.color, borderRadius:2, opacity:0.85 }}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {[
                { l:`Poll ${selected.poll.toFixed(0)}%`, ok:selected.poll>60 },
                { l:`BJP ${selected.hjp.toFixed(0)}%`, ok:selected.hjp>65 },
                { l:`Hindu ${selected.hindu.toFixed(0)}%`, ok:selected.hindu>65 },
                { l:`BLO ${selected.blo.toFixed(0)}%`, ok:selected.blo>57 },
                { l:`WSI ${selected.wsi.toFixed(0)}`, ok:selected.wsi>60 },
              ].map((s,i) => (
                <span key={i} style={{
                  fontSize:9.5, padding:'3px 8px', borderRadius:5, fontWeight:700,
                  background:s.ok?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.1)',
                  color:s.ok?'#10b981':'#ef4444',
                  border:`1px solid ${s.ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`,
                }}>{s.l}</span>
              ))}
            </div>

            <div style={{
              background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:8, padding:'11px 13px',
            }}>
              <div style={{ fontSize:9, fontWeight:800, color:cfg.color, letterSpacing:0.8, marginBottom:6, textTransform:'uppercase' }}>
                ◆ Why This Classification
              </div>
              <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.65)', lineHeight:1.65 }}>{selected.why}</div>
            </div>

            <div style={{
              background:'rgba(252,211,77,0.04)', border:'1px solid rgba(252,211,77,0.2)',
              borderRadius:8, padding:'11px 13px',
            }}>
              <div style={{ fontSize:9, fontWeight:800, color:'#fcd34d', letterSpacing:0.8, marginBottom:6, textTransform:'uppercase' }}>
                ⚠ Root Cause / Gap
              </div>
              <div style={{ fontSize:11.5, color:'#fde68a', lineHeight:1.65 }}>{selected.gap}</div>
            </div>

            <div style={{
              background:'rgba(110,231,183,0.04)', border:'1px solid rgba(110,231,183,0.2)',
              borderRadius:8, padding:'11px 13px',
            }}>
              <div style={{ fontSize:9, fontWeight:800, color:'#6ee7b7', letterSpacing:0.8, marginBottom:6, textTransform:'uppercase' }}>
                ✅ Corrective Action
              </div>
              <div style={{ fontSize:11.5, color:'#a7f3d0', lineHeight:1.65, marginBottom:10 }}>{selected.action}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', paddingTop:8, borderTop:'1px solid rgba(110,231,183,0.12)' }}>
                {[
                  { l:'BJP Target', v:selected.bjpTarget, c:'#22d3ee' },
                  { l:'Turnout', v:selected.turnoutTarget, c:'#f59e0b' },
                  { l:'SIR', v:selected.sirTarget, c:'#a78bfa' },
                ].map(t => (
                  <div key={t.l} style={{
                    fontSize:10, fontWeight:700, background:t.c+'15', color:t.c,
                    padding:'3px 9px', borderRadius:5, border:`1px solid ${t.c}30`,
                  }}>
                    <div style={{ fontSize:8, opacity:0.65, marginBottom:1 }}>{t.l}</div>
                    {t.v}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display:'flex', gap:8, alignItems:'center',
              padding:'10px 12px', background:'rgba(255,255,255,0.025)',
              border:'1px solid rgba(255,255,255,0.06)', borderRadius:8,
            }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', marginBottom:2 }}>RISK 2025</div>
                <div style={{ fontSize:10.5, fontWeight:700, color: selected.risk2025 && selected.risk2025.includes('NORMAL') ? '#4ade80' : '#fbbf24' }}>
                  {selected.risk2025 || '— NORMAL'}
                </div>
              </div>
              <div style={{ height:28, width:1, background:'rgba(255,255,255,0.08)' }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', marginBottom:2 }}>TREND</div>
                <div style={{ fontSize:10.5, fontWeight:700, color: selected.trend && selected.trend.includes('↓') ? '#f87171' : selected.trend && selected.trend.includes('↑') ? '#4ade80' : '#94a3b8' }}>
                  {selected.trend || '→ Stable'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Why Strong/Medium/Weak — Full-Text Card View ────────────────────────────
function WhyTab({ WARDS_FULL, clsCfg, pColor }) {
  const [expanded, setExpanded] = React.useState(null);
  const [filter, setFilter]     = React.useState('ALL');
  const [search, setSearch]     = React.useState('');

  const FILTERS = ['ALL','STRONGHOLD','STRONG','FAVOURABLE','CONTESTED','CONGRESS'];

  const clsGroup = (cls) => {
    if (cls.includes('STRONGHOLD'))                           return 'STRONGHOLD';
    if (cls.includes('BJP STRONG') && !cls.includes('FAVO')) return 'STRONG';
    if (cls.includes('FAVO'))                                 return 'FAVOURABLE';
    if (cls.includes('CONTESTED'))                            return 'CONTESTED';
    return 'CONGRESS';
  };

  const filtered = WARDS_FULL
    .slice()
    .sort((a, b) => b.hjp - a.hjp)
    .filter(d => filter === 'ALL' || clsGroup(d.cls) === filter)
    .filter(d => !search || d.n.toLowerCase().includes(search.toLowerCase()));

  const trendColor = (t) =>
    t.includes('\u2193') ? '#ef4444' : t.includes('\u2191') ? '#10b981' : '#f59e0b';

  const communityTag = (d) => {
    const icon  = d.hindu > 80 ? '\uD83D\uDFE2' : d.hindu > 65 ? '\uD83D\uDFE2' : d.muslim > 50 ? '\uD83D\uDD34' : d.christian > 35 ? '\u271D\uFE0F' : '\uD83D\uDFE1';
    const label = d.hindu > 80 ? 'Hindu dom' : d.hindu > 65 ? 'Hindu lean' : d.muslim > 50 ? 'Muslim dom' : d.christian > 35 ? 'Chrst dom' : 'Mixed';
    return { icon, label };
  };

  const FILTER_COLORS = {
    ALL:'#94a3b8', STRONGHOLD:'#10b981', STRONG:'#22d3ee',
    FAVOURABLE:'#f59e0b', CONTESTED:'#f97316', CONGRESS:'#a78bfa',
  };

  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flexShrink:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ward..." style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'6px 10px 6px 28px',color:'#e2e8f0',fontSize:11,outline:'none',width:140}}/>
          <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',fontSize:11,opacity:0.4}}>&#128269;</span>
        </div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',fontSize:10,fontWeight:700,letterSpacing:0.4,background:filter===f?FILTER_COLORS[f]+'28':'rgba(255,255,255,0.04)',color:filter===f?FILTER_COLORS[f]:'rgba(255,255,255,0.35)',outline:filter===f?`1px solid ${FILTER_COLORS[f]}55`:'1px solid rgba(255,255,255,0.07)',transition:'all 0.18s'}}>{f}</button>
          ))}
        </div>
        <div style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.25)'}}>{filtered.length} wards · click card to expand</div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filtered.map((d)=>{
          const cfg   = clsCfg(d.cls);
          const isOpen= expanded===d.w;
          const comm  = communityTag(d);
          const pollColor = d.poll<55?'#ef4444':d.poll<60?'#f59e0b':'#10b981';
          const tColor= d.trend.includes('\u2193')?'#ef4444':d.trend.includes('\u2191')?'#10b981':'#f59e0b';

          return (
            <div key={d.w} onClick={()=>setExpanded(isOpen?null:d.w)} style={{background:isOpen?'rgba(255,255,255,0.035)':'rgba(255,255,255,0.018)',border:`1px solid ${isOpen?cfg.color+'55':'rgba(255,255,255,0.07)'}`,borderLeft:`3px solid ${cfg.color}`,borderRadius:10,cursor:'pointer',transition:'all 0.2s ease',overflow:'hidden'}}>

              {/* Header row */}
              <div style={{display:'grid',gridTemplateColumns:'140px 58px 58px 175px 160px 1fr 78px 18px',alignItems:'center',gap:8,padding:'10px 14px'}}>

                <div>
                  <span style={{fontWeight:800,color:cfg.color,fontSize:11}}>W{d.w}</span>
                  <span style={{fontSize:12,color:'#e2e8f0',marginLeft:5,fontWeight:600}}>{d.n}</span>
                </div>

                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:1}}>POLL%</div>
                  <div style={{fontSize:13,fontWeight:800,color:pollColor}}>{d.poll.toFixed(1)}%</div>
                </div>

                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:1}}>BJP%</div>
                  <div style={{fontSize:13,fontWeight:800,color:cfg.color}}>{d.hjp.toFixed(0)}%</div>
                </div>

                <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.05)',borderRadius:6,padding:'3px 7px',lineHeight:1.4}}>
                  {comm.icon} {comm.label} · H:{d.hindu.toFixed(0)} M:{d.muslim.toFixed(0)} C:{d.christian.toFixed(0)}
                </div>

                <div style={{fontSize:11,color:tColor,fontWeight:600}}>{d.trend}</div>

                {!isOpen && (
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{d.why}</div>
                )}
                {isOpen && <div/>}

                <div style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:5,background:pColor(d.priority)+'22',color:pColor(d.priority),whiteSpace:'nowrap',textAlign:'center'}}>
                  {d.priority.replace(/[\uD83D\uDD34\uD83D\uDFE0\uD83D\uDFE1\uD83D\uDFE2\u2014] ?/gu,'')}
                </div>

                <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',transform:isOpen?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s',userSelect:'none',textAlign:'center'}}>&#9662;</div>
              </div>

              {/* Expanded body */}
              {isOpen&&(
                <div style={{padding:'0 14px 16px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>

                  {/* Stat strip */}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'10px 0 14px',borderBottom:'1px solid rgba(255,255,255,0.05)',marginBottom:14}}>
                    {[
                      {l:'BJP Proj',  v:`${d.hjp.toFixed(0)}%`,                          c:cfg.color},
                      {l:'Poll Rate', v:`${d.poll.toFixed(1)}%`,                          c:pollColor},
                      {l:'Margin',    v:`${d.margin>=0?'+':''}${d.margin.toFixed(0)}%`,   c:d.margin>=0?'#10b981':'#ef4444'},
                      {l:'Hindu',     v:`${d.hindu.toFixed(0)}%`,                         c:'#f59e0b'},
                      {l:'Muslim',    v:`${d.muslim.toFixed(0)}%`,                        c:'#34d399'},
                      {l:'Christian', v:`${d.christian.toFixed(0)}%`,                     c:'#60a5fa'},
                      {l:'BLO Map',   v:`${d.blo.toFixed(0)}%`,                          c:'#a78bfa'},
                      {l:'WSI Score', v:d.wsi.toFixed(0),                                c:d.wsi>=70?'#10b981':d.wsi>=50?'#f59e0b':'#ef4444'},
                      {l:'Prediction',v:d.prediction,                                    c:'rgba(255,255,255,0.45)'},
                    ].map(s=>(
                      <div key={s.l} style={{background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'5px 10px',minWidth:60}}>
                        <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:2,letterSpacing:0.3}}>{s.l}</div>
                        <div style={{fontSize:12,fontWeight:700,color:s.c,lineHeight:1.3}}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Three content panels */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>

                    <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderTop:`2px solid ${cfg.color}`,borderRadius:8,padding:'12px 14px'}}>
                      <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,color:cfg.color,marginBottom:10,textTransform:'uppercase'}}>&#128202; Why Strong / Weak</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.72)',lineHeight:1.8}}>{d.why}</div>
                    </div>

                    <div style={{background:'rgba(252,211,77,0.04)',border:'1px solid rgba(252,211,77,0.12)',borderTop:'2px solid #fcd34d',borderRadius:8,padding:'12px 14px'}}>
                      <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,color:'#fcd34d',marginBottom:10,textTransform:'uppercase'}}>&#9888;&#65039; Grassroot Gap Identified</div>
                      <div style={{fontSize:12,color:'#fde68a',lineHeight:1.8}}>{d.gap}</div>
                    </div>

                    <div style={{background:'rgba(110,231,183,0.04)',border:'1px solid rgba(110,231,183,0.12)',borderTop:'2px solid #6ee7b7',borderRadius:8,padding:'12px 14px'}}>
                      <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,color:'#6ee7b7',marginBottom:10,textTransform:'uppercase'}}>&#9989; Corrective Action</div>
                      <div style={{fontSize:12,color:'#a7f3d0',lineHeight:1.8,marginBottom:10}}>{d.action}</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',paddingTop:8,borderTop:'1px solid rgba(110,231,183,0.1)'}}>
                        {[{l:'BJP Target',v:d.bjpTarget,c:'#22d3ee'},{l:'Turnout',v:d.turnoutTarget,c:'#f59e0b'},{l:'SIR',v:d.sirTarget,c:'#a78bfa'}].map(t=>(
                          <div key={t.l} style={{fontSize:10,fontWeight:700,background:t.c+'18',color:t.c,padding:'2px 8px',borderRadius:4,border:`1px solid ${t.c}33`}}>{t.l}: {t.v}</div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Community Tab — Full Card Layout ────────────────────────────────────────
function CommunityTab({ RELIGION_DATA, COMMUNITY_DATA }) {
  const [activeComm, setActiveComm] = React.useState(null);

  const GENDER_DATA = [
    { rel:'Hindu',    male:76513, mPoll:46656, mT:61.0, female:83497, fPoll:50652, fT:60.7,
      gap:'Male > Female by 0.3%',  note:'Hindu WOMEN turnout 60.7% — mobilise further for +5% gain', color:'#f59e0b' },
    { rel:'Muslim',   male:22792, mPoll:11087, mT:48.6, female:22279, fPoll:11398, fT:51.2,
      gap:'Female > Male by 2.6%',  note:'Muslim women vote MORE than men — Congress-aligned; intercept with welfare schemes', color:'#8b5cf6' },
    { rel:'Christian',male:18849, mPoll:9573,  mT:50.8, female:22983, fPoll:12330, fT:53.6,
      gap:'Female > Male by 2.8%',  note:'Christian women are the SWING DRIVER — targeted womens welfare scheme is critical', color:'#60a5fa' },
  ];

  const alignColor = (a) =>
    a.includes('STRONG') || a.includes('MOSTLY') ? '#10b981'
    : a.includes('SWING') || a.includes('OPPOSITION') ? '#ef4444'
    : '#f59e0b';

  const relColor = { Hindu:'#f59e0b', Muslim:'#8b5cf6', Christian:'#60a5fa' };
  const relBg    = { Hindu:'rgba(245,158,11,0.08)', Muslim:'rgba(139,92,246,0.08)', Christian:'rgba(96,165,250,0.08)' };
  const relBorder= { Hindu:'rgba(245,158,11,0.2)',  Muslim:'rgba(139,92,246,0.2)',  Christian:'rgba(96,165,250,0.2)' };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>

      {/* ── Section 1: Religion Snapshot ── */}
      <div>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',marginBottom:12}}>Religion-wise Voter Profile</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {RELIGION_DATA.map(r=>{
            const c  = relColor[r.religion]  || '#94a3b8';
            const bg = relBg[r.religion]     || 'rgba(255,255,255,0.03)';
            const bd = relBorder[r.religion] || 'rgba(255,255,255,0.08)';
            const unpolled = r.total - r.polled;
            const pct = (r.polled / r.total * 100).toFixed(1);
            return (
              <div key={r.religion} style={{background:bg,border:`1px solid ${bd}`,borderTop:`3px solid ${c}`,borderRadius:12,padding:'16px 18px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div style={{fontSize:18,fontWeight:900,color:c}}>{r.religion}</div>
                  <span style={{fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:20,background:c+'22',color:c,letterSpacing:0.6,border:`1px solid ${c}44`,whiteSpace:'nowrap'}}>{r.alignment}</span>
                </div>

                {/* Big turnout number */}
                <div style={{fontSize:36,fontWeight:900,color:c,lineHeight:1,marginBottom:4}}>{r.turnout.toFixed(1)}<span style={{fontSize:18}}>%</span></div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginBottom:12}}>Turnout rate</div>

                {/* Turnout bar */}
                <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden',marginBottom:12}}>
                  <div style={{width:`${r.turnout}%`,height:'100%',background:`linear-gradient(90deg,${c}99,${c})`,borderRadius:3}}/>
                </div>

                {/* Stats row */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                  {[
                    {l:'Total',    v:r.total.toLocaleString()},
                    {l:'Polled',   v:r.polled.toLocaleString()},
                    {l:'Non-Polled',v:unpolled.toLocaleString()},
                  ].map(s=>(
                    <div key={s.l} style={{background:'rgba(255,255,255,0.05)',borderRadius:7,padding:'6px 8px',textAlign:'center'}}>
                      <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',marginBottom:2}}>{s.l}</div>
                      <div style={{fontSize:12,fontWeight:700,color:'#e2e8f0'}}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* BJP note */}
                <div style={{marginTop:10,padding:'8px 10px',background:'rgba(255,255,255,0.04)',borderRadius:7,fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.5}}>
                  <span style={{fontWeight:700,color:c}}>BJP: </span>{r.bjp}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Community Intelligence Cards ── */}
      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,color:'rgba(255,255,255,0.3)',textTransform:'uppercase'}}>Community Turnout Ranking — BJP Relevance</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.25)'}}>{COMMUNITY_DATA.length} communities · click to expand</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
          {COMMUNITY_DATA.map((r,idx)=>{
            const isOpen = activeComm === r.c;
            const tColor = r.turnout>65?'#10b981':r.turnout>58?'#f59e0b':'#ef4444';
            const aColor = alignColor(r.align);
            const catColors = {OBC:'#22d3ee',GC:'#f59e0b',Minority:'#a78bfa'};
            const catC = catColors[r.cat] || '#94a3b8';
            const nonPolled = r.total - r.polled;

            return (
              <div key={r.c}
                onClick={()=>setActiveComm(isOpen?null:r.c)}
                style={{
                  background: isOpen?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.02)',
                  border:`1px solid ${isOpen?aColor+'55':'rgba(255,255,255,0.07)'}`,
                  borderLeft:`3px solid ${aColor}`,
                  borderRadius:10, cursor:'pointer',
                  transition:'all 0.2s ease', overflow:'hidden',
                }}
              >
                {/* Collapsed header */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 70px 70px 70px 110px 18px',alignItems:'center',gap:8,padding:'11px 14px'}}>

                  <div>
                    <span style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>{r.c}</span>
                    <span style={{marginLeft:7,fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:4,background:catC+'22',color:catC,border:`1px solid ${catC}33`}}>{r.cat}</span>
                  </div>

                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:1}}>TOTAL</div>
                    <div style={{fontSize:12,fontWeight:700,color:'#e2e8f0'}}>{r.total.toLocaleString()}</div>
                  </div>

                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:1}}>POLLED</div>
                    <div style={{fontSize:12,fontWeight:700,color:'#22d3ee'}}>{r.polled.toLocaleString()}</div>
                  </div>

                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:1}}>TURNOUT</div>
                    <div style={{fontSize:13,fontWeight:800,color:tColor}}>{r.turnout.toFixed(1)}%</div>
                  </div>

                  <div style={{fontSize:10,fontWeight:700,color:aColor}}>{r.align}</div>

                  <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',transform:isOpen?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s',textAlign:'center'}}>&#9662;</div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{padding:'0 14px 14px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>

                    {/* Mini bar */}
                    <div style={{padding:'10px 0 12px'}}>
                      <div style={{height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden',marginBottom:4}}>
                        <div style={{width:`${r.turnout}%`,height:'100%',background:`linear-gradient(90deg,${tColor}88,${tColor})`,borderRadius:3}}/>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(255,255,255,0.3)'}}>
                        <span>0%</span><span style={{fontWeight:700,color:tColor}}>{r.turnout.toFixed(1)}% voted</span><span>100%</span>
                      </div>
                    </div>

                    {/* Stat cards */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
                      {[
                        {l:'Registered',v:r.total.toLocaleString(),   c:'#e2e8f0'},
                        {l:'Polled',    v:r.polled.toLocaleString(),   c:'#22d3ee'},
                        {l:'Non-Polled',v:nonPolled.toLocaleString(),  c:'#f87171'},
                        {l:'Turnout',   v:`${r.turnout.toFixed(1)}%`,  c:tColor},
                      ].map(s=>(
                        <div key={s.l} style={{background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'7px 10px',textAlign:'center'}}>
                          <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:2}}>{s.l}</div>
                          <div style={{fontSize:13,fontWeight:800,color:s.c}}>{s.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Strategic note — full text */}
                    <div style={{background:`${aColor}0f`,border:`1px solid ${aColor}30`,borderRadius:8,padding:'10px 12px'}}>
                      <div style={{fontSize:9,fontWeight:800,letterSpacing:1,color:aColor,marginBottom:6,textTransform:'uppercase'}}>&#128161; Strategic Intelligence Note</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.72)',lineHeight:1.8}}>{r.note}</div>
                    </div>
                  </div>
                )}

                {/* Note preview when collapsed */}
                {!isOpen && (
                  <div style={{padding:'0 14px 10px'}}>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>{r.note}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Gender Analysis ── */}
      <div>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',marginBottom:12}}>Gender Analysis — The Missing Variable</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {GENDER_DATA.map(g=>(
            <div key={g.rel} style={{background:'rgba(255,255,255,0.025)',border:`1px solid ${g.color}33`,borderTop:`3px solid ${g.color}`,borderRadius:12,padding:'16px 18px'}}>
              <div style={{fontSize:16,fontWeight:800,color:g.color,marginBottom:14}}>{g.rel}</div>

              {/* Gender comparison bars */}
              {[
                {icon:'♂',label:'Male',  voters:g.male,  polled:g.mPoll, rate:g.mT,  color:'#60a5fa'},
                {icon:'♀',label:'Female',voters:g.female,polled:g.fPoll, rate:g.fT,  color:'#f0abfc'},
              ].map(gd=>(
                <div key={gd.label} style={{marginBottom:12}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:12,color:gd.color,fontWeight:700}}>{gd.icon} {gd.label}</span>
                    <span style={{fontSize:13,fontWeight:800,color:gd.color}}>{gd.rate.toFixed(1)}%</span>
                  </div>
                  <div style={{height:6,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden',marginBottom:3}}>
                    <div style={{width:`${gd.rate}%`,height:'100%',background:gd.color,borderRadius:3,opacity:0.85}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'rgba(255,255,255,0.3)'}}>
                    <span>{gd.voters.toLocaleString()} registered</span>
                    <span>{gd.polled.toLocaleString()} polled</span>
                  </div>
                </div>
              ))}

              <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:10,marginTop:4}}>
                <div style={{fontSize:10,fontWeight:700,color:g.color,marginBottom:4}}>{g.gap}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>{g.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}


// ─── History Tab — Full-Text Card Layout ─────────────────────────────────────
function HistoryTab({ HIST_SUMMARY, WARDS_FULL, clsCfg, pColor }) {
  const [expanded, setExpanded] = React.useState(null);
  const [filter,   setFilter]   = React.useState('ALL');
  const [search,   setSearch]   = React.useState('');

  const YEARS = ['2013 BBMP','2014 LS','2018 BBMP','2019 LS','2023 Assem.'];

  // Map HIST_SUMMARY keys to year columns
  const yearVal = (r) => [r.v2013, r.v2014, r.v2018, r.v2019, r.v2023];

  const trendColor = (t) =>
    t.includes('\u2193') ? '#ef4444' : t.includes('\u2191') ? '#10b981' : '#f59e0b';

  // Metric row accent colours
  const metricColor = (m) => {
    if (m.includes('BJP'))        return '#f97316';
    if (m.includes('Non-Voters')) return '#ef4444';
    if (m.includes('Turnout'))    return '#f59e0b';
    if (m.includes('Cong'))       return '#a78bfa';
    if (m.includes('Margin'))     return '#22d3ee';
    return '#94a3b8';
  };

  const FILTER_LIST = ['ALL','STRONGHOLD','STRONG','FAVOURABLE','CONTESTED','CONGRESS'];
  const FILTER_COLORS = {
    ALL:'#94a3b8', STRONGHOLD:'#10b981', STRONG:'#22d3ee',
    FAVOURABLE:'#f59e0b', CONTESTED:'#f97316', CONGRESS:'#a78bfa',
  };

  const clsGroup = (cls) => {
    if (cls.includes('STRONGHOLD'))                           return 'STRONGHOLD';
    if (cls.includes('BJP STRONG') && !cls.includes('FAVO')) return 'STRONG';
    if (cls.includes('FAVO'))                                 return 'FAVOURABLE';
    if (cls.includes('CONTESTED'))                            return 'CONTESTED';
    return 'CONGRESS';
  };

  const filteredWards = WARDS_FULL
    .slice()
    .sort((a,b) => b.hjp - a.hjp)
    .filter(d => filter === 'ALL' || clsGroup(d.cls) === filter)
    .filter(d => !search || d.n.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>

      {/* ── Section 1: Constituency Trend Timeline ── */}
      <div>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',marginBottom:14}}>
          Constituency-Level BJP Trend 2013–2023
        </div>

        {/* Year header strip */}
        <div style={{display:'grid',gridTemplateColumns:'180px repeat(5,1fr) 120px 130px',gap:0,background:'rgba(255,255,255,0.04)',borderRadius:'10px 10px 0 0',padding:'8px 14px',marginBottom:1}}>
          <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',letterSpacing:0.5}}>METRIC</div>
          {YEARS.map(y => (
            <div key={y} style={{fontSize:10,fontWeight:700,color: y.includes('2023')?'#22d3ee':'rgba(255,255,255,0.35)',textAlign:'center',letterSpacing:0.3}}>{y}</div>
          ))}
          <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',textAlign:'center',letterSpacing:0.5}}>TREND</div>
          <div style={{fontSize:10,fontWeight:700,color:'#f59e0b',textAlign:'center',letterSpacing:0.5}}>2025 PROJ.</div>
        </div>

        {/* Metric rows */}
        <div style={{border:'1px solid rgba(255,255,255,0.07)',borderRadius:'0 0 10px 10px',overflow:'hidden'}}>
          {HIST_SUMMARY.map((r,i) => {
            const mc = metricColor(r.metric);
            const vals = yearVal(r);
            return (
              <div key={r.metric} style={{
                display:'grid',
                gridTemplateColumns:'180px repeat(5,1fr) 120px 130px',
                gap:0,
                padding:'11px 14px',
                background: i%2===0?'transparent':'rgba(255,255,255,0.015)',
                borderBottom: i < HIST_SUMMARY.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                alignItems:'center',
              }}>
                {/* Metric label */}
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <div style={{width:3,height:18,background:mc,borderRadius:2,flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:700,color:'#e2e8f0'}}>{r.metric}</span>
                </div>

                {/* Year values */}
                {vals.map((v,vi) => (
                  <div key={vi} style={{textAlign:'center'}}>
                    <span style={{
                      fontSize: vi===4 ? 14 : 12,
                      fontWeight: vi===4 ? 800 : 500,
                      color: vi===4 ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                    }}>{v}</span>
                  </div>
                ))}

                {/* Trend pill */}
                <div style={{textAlign:'center'}}>
                  <span style={{
                    fontSize:11,fontWeight:700,
                    padding:'3px 10px',borderRadius:20,
                    background: trendColor(r.trend)+'1a',
                    color: trendColor(r.trend),
                    border:`1px solid ${trendColor(r.trend)}40`,
                  }}>{r.trend}</span>
                </div>

                {/* 2025 projection */}
                <div style={{textAlign:'center'}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#f59e0b'}}>{r.proj}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Ward Classification Shift ── */}
      <div>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:1.2,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',marginBottom:14}}>
          Ward Classification Shift 2013 → 2023 + 2025 Risk
        </div>

        {/* Filters */}
        <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ward..."
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,padding:'6px 10px 6px 28px',color:'#e2e8f0',fontSize:11,outline:'none',width:140}}/>
            <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',fontSize:11,opacity:0.4}}>&#128269;</span>
          </div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {FILTER_LIST.map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{
                padding:'4px 12px',borderRadius:20,border:'none',cursor:'pointer',
                fontSize:10,fontWeight:700,letterSpacing:0.4,
                background: filter===f ? FILTER_COLORS[f]+'28':'rgba(255,255,255,0.04)',
                color: filter===f ? FILTER_COLORS[f]:'rgba(255,255,255,0.35)',
                outline: filter===f ? `1px solid ${FILTER_COLORS[f]}55`:'1px solid rgba(255,255,255,0.07)',
                transition:'all 0.18s',
              }}>{f}</button>
            ))}
          </div>
          <div style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.25)'}}>{filteredWards.length} wards</div>
        </div>

        {/* Ward cards */}
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          {filteredWards.map((d) => {
            const cfg    = clsCfg(d.cls);
            const isOpen = expanded === d.w;
            const tc     = d.trend.includes('\u2193')?'#ef4444':d.trend.includes('\u2191')?'#10b981':'#f59e0b';
            const rc     = pColor(d.risk2025);

            return (
              <div key={d.w}
                onClick={()=>setExpanded(isOpen?null:d.w)}
                style={{
                  background: isOpen?'rgba(255,255,255,0.035)':'rgba(255,255,255,0.018)',
                  border:`1px solid ${isOpen?cfg.color+'55':'rgba(255,255,255,0.07)'}`,
                  borderLeft:`3px solid ${cfg.color}`,
                  borderRadius:10, cursor:'pointer',
                  transition:'all 0.2s ease', overflow:'hidden',
                }}
              >
                {/* ── Collapsed row ── */}
                <div style={{display:'grid',gridTemplateColumns:'150px 110px 160px 1fr 140px 18px',alignItems:'center',gap:10,padding:'10px 14px'}}>

                  {/* Ward name */}
                  <div>
                    <span style={{fontWeight:800,color:cfg.color,fontSize:11}}>W{d.w}</span>
                    <span style={{fontSize:12,color:'#e2e8f0',marginLeft:5,fontWeight:600}}>{d.n}</span>
                  </div>

                  {/* Classification badge */}
                  <span style={{fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:5,background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.color}44`,letterSpacing:0.4,whiteSpace:'nowrap'}}>
                    {cfg.label}
                  </span>

                  {/* Trend */}
                  <span style={{fontSize:11,fontWeight:700,color:tc}}>{d.trend}</span>

                  {/* Gap preview (collapsed) / spacer (open) */}
                  {!isOpen
                    ? <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{d.gap}</div>
                    : <div/>
                  }

                  {/* Risk badge */}
                  <span style={{fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:5,background:rc+'22',color:rc,border:`1px solid ${rc}33`,whiteSpace:'nowrap',textAlign:'center'}}>
                    {d.risk2025.replace(/[\uD83D\uDD34\uD83D\uDFE0\uD83D\uDFE1\uD83D\uDFE2\u2014] ?/gu,'')}
                  </span>

                  {/* Chevron */}
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',transform:isOpen?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s',textAlign:'center'}}>&#9662;</div>
                </div>

                {/* ── Expanded body ── */}
                {isOpen && (
                  <div style={{padding:'0 14px 16px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>

                    {/* Stat strip */}
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',padding:'10px 0 14px',borderBottom:'1px solid rgba(255,255,255,0.05)',marginBottom:14}}>
                      {[
                        {l:'Classification', v:cfg.label,                                    c:cfg.color},
                        {l:'BJP Projection', v:`${d.hjp.toFixed(0)}%`,                       c:cfg.color},
                        {l:'Poll Rate',      v:`${d.poll.toFixed(1)}%`,                      c:d.poll<55?'#ef4444':d.poll<60?'#f59e0b':'#10b981'},
                        {l:'Margin',         v:`${d.margin>=0?'+':''}${d.margin.toFixed(0)}%`,c:d.margin>=0?'#10b981':'#ef4444'},
                        {l:'Hindu',          v:`${d.hindu.toFixed(0)}%`,                     c:'#f59e0b'},
                        {l:'WSI Score',      v:d.wsi.toFixed(0),                             c:d.wsi>=70?'#10b981':d.wsi>=50?'#f59e0b':'#ef4444'},
                        {l:'2025 Risk',      v:d.risk2025.replace(/[\uD83D\uDD34\uD83D\uDFE0\uD83D\uDFE1\uD83D\uDFE2\u2014] ?/gu,''), c:rc},
                        {l:'Prediction',     v:d.prediction,                                 c:'rgba(255,255,255,0.45)'},
                      ].map(s=>(
                        <div key={s.l} style={{background:'rgba(255,255,255,0.04)',borderRadius:7,padding:'5px 10px',minWidth:60}}>
                          <div style={{fontSize:9,color:'rgba(255,255,255,0.28)',marginBottom:2,letterSpacing:0.3}}>{s.l}</div>
                          <div style={{fontSize:12,fontWeight:700,color:s.c,lineHeight:1.3}}>{s.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Two panels: Root Cause/Gap + Corrective Action */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>

                      <div style={{background:'rgba(252,211,77,0.04)',border:'1px solid rgba(252,211,77,0.15)',borderTop:'2px solid #fcd34d',borderRadius:8,padding:'12px 14px'}}>
                        <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,color:'#fcd34d',marginBottom:10,textTransform:'uppercase'}}>&#9888;&#65039; Root Cause / Gap</div>
                        <div style={{fontSize:12,color:'#fde68a',lineHeight:1.8}}>{d.gap}</div>
                      </div>

                      <div style={{background:'rgba(110,231,183,0.04)',border:'1px solid rgba(110,231,183,0.15)',borderTop:`2px solid ${cfg.color}`,borderRadius:8,padding:'12px 14px'}}>
                        <div style={{fontSize:9,fontWeight:800,letterSpacing:1.2,color:cfg.color,marginBottom:10,textTransform:'uppercase'}}>&#9989; Corrective Action</div>
                        <div style={{fontSize:12,color:'#a7f3d0',lineHeight:1.8,marginBottom:10}}>{d.action}</div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap',paddingTop:8,borderTop:`1px solid ${cfg.color}22`}}>
                          {[
                            {l:'BJP Target',v:d.bjpTarget,    c:'#22d3ee'},
                            {l:'Turnout',   v:d.turnoutTarget,c:'#f59e0b'},
                            {l:'SIR',       v:d.sirTarget,    c:'#a78bfa'},
                          ].map(t=>(
                            <div key={t.l} style={{fontSize:10,fontWeight:700,background:t.c+'18',color:t.c,padding:'2px 8px',borderRadius:4,border:`1px solid ${t.c}33`}}>{t.l}: {t.v}</div>
                          ))}
                        </div>
                      </div>

                    </div>
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

// ─── Political Intelligence Hub (moved from Dashboard.jsx) ───────────────────
function PoliticalIntelligenceHub() {
  const [activeTab, setActiveTab] = React.useState('heatmap');
  const [expandedWard, setExpandedWard] = React.useState(null);

  const WARDS_FULL = [
    { w:28, n:'Mannagudda',   cls:'BJP STRONGHOLD',        poll:54.8,hjp:93.7,hindu:93.7,muslim:1.1, christian:5.2, blo:53.78,prog:68.15,margin:87.4,priority:'🔴 CRITICAL', wsi:70.0, wsiGrade:'A STRONG*',  prediction:'BJP WIN — TURNOUT RISK ⚠',    totalElectors:8102,  why:'HIGHEST Hindu density (93.7%), Bunt-Mogaveera belt solidly behind BJP. Traditional parivar stronghold with MLA visibility.',gap:'LOW TURNOUT (54.8%): ~3,800 BJP voters not reaching booths. No women\'s mobilisation. Youth (18-25) unregistered.',action:'Deploy women\'s shakhas; door-to-door by booth agent 2 weeks before poll; youth voter reg drive',bjpTarget:'🎯 6,800+',turnoutTarget:'🎯 66%',sirTarget:'🎯 75%',trend:'↑ Strong 2013–23',risk2025:'🔴 CRITICAL - LOW TURNOUT'},
    { w:29, n:'Kambala',      cls:'BJP STRONGHOLD',        poll:57.9,hjp:92.6,hindu:92.6,muslim:1.8, christian:5.6, blo:57.64,prog:75.09,margin:85.2,priority:'🟠 HIGH',      wsi:71.3, wsiGrade:'A STRONG*',  prediction:'BJP WIN — TURNOUT CRITICAL ⚠',totalElectors:4517,  why:'High Bunt community density. Cultural connection through RSS/VHP network strong. Uncontested territory.',gap:'57.9% turnout leaves ~1,800 votes on table. Party office inactive between elections.',action:'Activate booth committee with daily log; cultural event calendar; connect with Kambala committee leaders',bjpTarget:'🎯 3,500+',turnoutTarget:'🎯 66%',sirTarget:'🎯 75%',trend:'↑ Dominant 2013',risk2025:'🟠 LOW TURNOUT'},
    { w:41, n:'Central',      cls:'BJP STRONGHOLD',        poll:59.3,hjp:90.4,hindu:90.4,muslim:7.6, christian:2.0, blo:63.43,prog:74.61,margin:80.8,priority:'🟡 MEDIUM',    wsi:73.0, wsiGrade:'A+ STRONG*', prediction:'BJP WIN — COMPLACENCY RISK',   totalElectors:4882,  why:'GSB + Brahmin upper-caste bloc firmly with BJP. Business community ward — economic interest alignment strong.',gap:'BLO coverage only 63%. NRI voters not reachable. 7.6% Muslim vote totally unaddressed.',action:'Set up NRI contact register; connect with business associations; include 1 Muslim face in ward committee',bjpTarget:'🎯 3,700+',turnoutTarget:'🎯 68%',sirTarget:'🎯 80%',trend:'↑ Very strong 2018-23',risk2025:'COMPLACENCY RISK'},
    { w:27, n:'Boloor',       cls:'BJP STRONGHOLD',        poll:50.8,hjp:87.5,hindu:87.5,muslim:1.2, christian:11.3,blo:60.61,prog:87.02,margin:75.0,priority:'🟡 MEDIUM',    wsi:66.5, wsiGrade:'B+ STRONG*', prediction:'BJP WIN — TURNOUT CRITICAL ⚠',totalElectors:6618,  why:'LOWEST turnout in stronghold (50.8%). Christian pocket (11.3%) uncertain. Billava OBC base solid.',gap:'CRITICAL: 50.8% dangerously low. 5,400 potential BJP voters not voting. No neighbourhood-level contact.',action:'URGENT: 2 volunteers per booth; Christian outreach via church events; transport on poll day',bjpTarget:'🎯 5,000+',turnoutTarget:'🎯 64%',sirTarget:'🎯 80%',trend:'↑ Won 2014-23',risk2025:'🟡 TURNOUT RISK'},
    { w:32, n:'Kadri North',  cls:'BJP STRONGHOLD',        poll:54.5,hjp:86.8,hindu:86.8,muslim:0.7, christian:12.5,blo:56.55,prog:75.79,margin:73.6,priority:'🟠 HIGH',      wsi:68.2, wsiGrade:'A- STRONG',  prediction:'BJP WIN — TURNOUT WATCH',      totalElectors:6433,  why:'Temple belt ward — strong Kadri temple footfall. RSS shakha network very active.',gap:'Only 56.5% BLO mapped. Youth 18-22 unregistered. Christian vote (12.5%) going to Congress.',action:'Prioritise first-time voter registration (18-22); Christian youth engagement through sports/social events',bjpTarget:'🎯 5,000+',turnoutTarget:'🎯 66%',sirTarget:'🎯 75%',trend:'→ Stable strong',risk2025:'TURNOUT WATCH'},
    { w:42, n:'Dongerkery',   cls:'BJP STRONGHOLD',        poll:58.4,hjp:86.2,hindu:86.2,muslim:12.0,christian:1.8, blo:57.45,prog:74.47,margin:72.4,priority:'🟠 HIGH',      wsi:68.6, wsiGrade:'A- STRONG',  prediction:'BJP WIN — STABLE',             totalElectors:7664,  why:'Strong OBC Hindutva ward. Muslim 12% votes Congress solidly.',gap:'Muslim anti-incumbency amplified if BJP ward member absent. No youth wing active.',action:'Maintain visible BJP ward presence; address road/drainage; prevent anti-incumbency narrative',bjpTarget:'🎯 5,800+',turnoutTarget:'🎯 67%',sirTarget:'🎯 75%',trend:'↑ Gained 2018-23',risk2025:'STABLE'},
    { w:21, n:'Padav West',   cls:'BJP STRONGHOLD',        poll:55.7,hjp:84.1,hindu:84.1,muslim:1.0, christian:14.8,blo:58.95,prog:90.05,margin:68.2,priority:'🟡 MEDIUM',    wsi:66.7, wsiGrade:'B+ STRONG*', prediction:'BJP WIN — TURNOUT WATCH',      totalElectors:7542,  why:'Classic BJP ward — Hindu plurality, Billava OBC base loyal. 14.8% Christian soft support.',gap:'55.7% turnout — low given 84% Hindu base. Many progeny voters are migrant workers.',action:'Verify migrant voter status; mobilise Christians through local welfare; Padav Dussehra sponsorship',bjpTarget:'🎯 5,600+',turnoutTarget:'🎯 66%',sirTarget:'🎯 82%',trend:'→ Stable 2013-23',risk2025:'TURNOUT WATCH'},
    { w:24, n:'Derebail South',cls:'BJP STRONGHOLD',       poll:58.1,hjp:80.1,hindu:80.1,muslim:2.5, christian:17.4,blo:54.67,prog:80.04,margin:60.2,priority:'🔴 CRITICAL',  wsi:64.3, wsiGrade:'B+ STRONG*', prediction:'BJP WIN — CHRISTIAN EROSION', totalElectors:4767,  why:'Used to be stronger. Christian community (17.4%) swinging to Congress. Low BLO mapping.',gap:'CRITICAL: BLO only 54.67%. Christians (17.4%) courted by Congress. Billava internal factions.',action:'Resolve Billava community issues; deploy parallel survey team; Christian welfare outreach',bjpTarget:'🎯 3,400+',turnoutTarget:'🎯 67%',sirTarget:'🎯 75%',trend:'↓ Eroding 2018-23',risk2025:'🔴 CHRISTIAN EROSION'},
    { w:31, n:'Bejai',        cls:'BJP STRONG',            poll:58.7,hjp:68.6,hindu:68.6,muslim:4.7, christian:26.7,blo:52.54,prog:83.98,margin:37.2,priority:'🟠 HIGH',      wsi:61.3, wsiGrade:'B MEDIUM',   prediction:'BJP WIN — CHRISTIAN SWING',   totalElectors:7246,  why:'Christian vote (26.7%) is decisive swing. When Christians vote BJP wins big.',gap:'Christian community alienated post-2018. Women turnout lower than men.',action:'Dedicate Christian community liaison; female BJP worker per booth',bjpTarget:'🎯 4,500+',turnoutTarget:'🎯 65%',sirTarget:'🎯 72%',trend:'→ Fluctuating',risk2025:'🟠 CHRISTIAN SWING'},
    { w:46, n:'Cantonment',   cls:'BJP STRONG',            poll:51.2,hjp:73.8,hindu:73.8,muslim:20.7,christian:5.5, blo:56.25,prog:72.79,margin:47.6,priority:'🟠 HIGH',      wsi:60.5, wsiGrade:'B MEDIUM',   prediction:'BJP WIN — TURNOUT WATCH',      totalElectors:4095,  why:'Army/government servants — split vote. 20.7% Muslim votes Congress. Lowest turnout in strong wards.',gap:'Military community often not on rolls. Only 56.25% BLO coverage.',action:'Voter registration drive for military; engage Muslim moderates on development; increase BLO',bjpTarget:'🎯 2,800+',turnoutTarget:'🎯 64%',sirTarget:'🎯 75%',trend:'→ Stable narrow',risk2025:'TURNOUT WATCH'},
    { w:25, n:'Derebail West', cls:'BJP STRONGHOLD',       poll:65.9,hjp:85.1,hindu:85.1,muslim:0.8, christian:14.1,blo:59.87,prog:85.34,margin:70.2,priority:'— NORMAL',    wsi:75.3, wsiGrade:'A+ STRONG',  prediction:'BJP WIN — COMFORTABLE',        totalElectors:7314,  why:'Highest turnout of BJP stronghold (65.9%). Billava OBC community highly organised. BJP\'s model ward.',gap:'BLO coverage 59.87% despite good turnout — risk of voter deletion.',action:'Maintain momentum; use as model for other wards',bjpTarget:'🎯 5,800+',turnoutTarget:'🎯 70%',sirTarget:'🎯 75%',trend:'↑ Consistently strong',risk2025:'— NORMAL'},
    { w:26, n:'Derebail SW',   cls:'BJP STRONGHOLD',       poll:60.4,hjp:87.9,hindu:87.9,muslim:0.6, christian:11.5,blo:56.96,prog:75.78,margin:75.8,priority:'— NORMAL',    wsi:74.5, wsiGrade:'A+ STRONG',  prediction:'BJP WIN — COMFORTABLE',        totalElectors:7801,  why:'Strong Billava/Devadiga base. Low minority presence. RSS/VHP network highly active.',gap:'Progeny only 75.78% — some uncovered. NRI families not reachable.',action:'Youth wing activation; connect with diaspora network for NRI votes',bjpTarget:'🎯 6,400+',turnoutTarget:'🎯 68%',sirTarget:'🎯 75%',trend:'↑ Very consistent',risk2025:'— NORMAL'},
    { w:30, n:'Kodialbail',    cls:'BJP STRONGHOLD',       poll:62.9,hjp:80.9,hindu:80.9,muslim:1.2, christian:17.9,blo:52.89,prog:75.01,margin:61.8,priority:'— NORMAL',    wsi:70.4, wsiGrade:'A STRONG',   prediction:'BJP WIN — SAFE',               totalElectors:7871,  why:'BJP stronghold with stable Hindu majority and rising turnout.',gap:'BLO only 52.89%, progeny 75% — gaps in mapping.',action:'BLO completion drive; Christian community welfare schemes',bjpTarget:'🎯 5,900+',turnoutTarget:'🎯 68%',sirTarget:'🎯 75%',trend:'→ Stable',risk2025:'— NORMAL'},
    { w:51, n:'Alape North',   cls:'BJP STRONG',           poll:63.0,hjp:68.5,hindu:68.5,muslim:1.4, christian:30.0,blo:57.28,prog:106.1,margin:37.0,priority:'— NORMAL',    wsi:64.6, wsiGrade:'B+ STRONG',  prediction:'BJP WIN — STABLE',             totalElectors:7200,  why:'Billava+GSB coastal ward; stable BJP base.',gap:'Christian 30% needs engagement. Progeny 106% — audit ghost entries.',action:'Audit progeny list; Protestant Christian outreach',bjpTarget:'🎯 4,600+',turnoutTarget:'🎯 68%',sirTarget:'🎯 75%',trend:'↑→ Stable',risk2025:'— NORMAL'},
    { w:35, n:'Padav Central', cls:'BJP STRONG',           poll:64.9,hjp:68.3,hindu:68.3,muslim:4.6, christian:27.1,blo:56.32,prog:78.03,margin:36.6,priority:'— NORMAL',    wsi:64.3, wsiGrade:'B+ STRONG',  prediction:'BJP WIN — STABLE',             totalElectors:8462,  why:'Christian+Hindu mix; BJP holds with good candidate.',gap:'Christian 27% unpredictable. Progeny 78% needs uplift.',action:'Protestant outreach; maintain booth committee structure',bjpTarget:'🎯 5,400+',turnoutTarget:'🎯 70%',sirTarget:'🎯 72%',trend:'↑→ Stable',risk2025:'— NORMAL'},
    { w:37, n:'Maroli',        cls:'BJP STRONG',           poll:61.6,hjp:68.7,hindu:68.7,muslim:0.8, christian:30.5,blo:64.16,prog:102.16,margin:37.4,priority:'— NORMAL',   wsi:65.0, wsiGrade:'B+ STRONG',  prediction:'BJP WIN — STABLE',             totalElectors:6718,  why:'BJP strong with high Hindu base and great BLO coverage.',gap:'Christian 30.5% needs Protestant outreach. Progeny 102% — audit entries.',action:'Protestant Christian engagement; verify progeny list',bjpTarget:'🎯 4,400+',turnoutTarget:'🎯 68%',sirTarget:'🎯 80%',trend:'→ Stable',risk2025:'— NORMAL'},
    { w:54, n:'Jappimogar',    cls:'BJP STRONG',           poll:61.1,hjp:71.6,hindu:71.6,muslim:7.4, christian:20.9,blo:64.09,prog:94.69,margin:43.2,priority:'— NORMAL',    wsi:66.0, wsiGrade:'B+ STRONG',  prediction:'BJP WIN — STABLE',             totalElectors:7266,  why:'BJP strong coastal ward with good BLO coverage.',gap:'Christian 20.9% and Muslim 7.4% need development messaging.',action:'Maintain BLO lead; Muslim moderate development outreach',bjpTarget:'🎯 4,900+',turnoutTarget:'🎯 68%',sirTarget:'🎯 80%',trend:'→ Stable',risk2025:'— NORMAL'},
    { w:58, n:'Bolar',         cls:'BJP STRONG',           poll:60.9,hjp:71.8,hindu:71.8,muslim:19.6,christian:8.6, blo:53.2, prog:79.37,margin:43.6,priority:'— NORMAL',    wsi:64.5, wsiGrade:'B+ STRONG',  prediction:'BJP WIN — STABLE',             totalElectors:7107,  why:'BJP strong with Kharvi community support. Coastal merchant community pro-BJP.',gap:'BLO 53.2% — below average. Muslim 19.6% consolidated against.',action:'Kharvi Sangha engagement; BLO completion; merchant association linkage',bjpTarget:'🎯 4,600+',turnoutTarget:'🎯 68%',sirTarget:'🎯 72%',trend:'→ Stable',risk2025:'— NORMAL'},
    { w:49, n:'Kankanady',     cls:'BJP STRONG',           poll:61.4,hjp:76.1,hindu:76.1,muslim:10.8,christian:13.1,blo:57.73,prog:96.22,margin:52.2,priority:'— NORMAL',    wsi:67.8, wsiGrade:'B+ STRONG',  prediction:'BJP WIN — STABLE',             totalElectors:7527,  why:'Vokkaliga retention + Billava base. Strong BJP hold.',gap:'Muslim 10.8% needs development narrative.',action:'Vokkaliga BJP program; maintain BLO coverage',bjpTarget:'🎯 5,300+',turnoutTarget:'🎯 68%',sirTarget:'🎯 80%',trend:'→ Stable',risk2025:'— NORMAL'},
    { w:57, n:'Hoige Bazar',   cls:'BJP STRONG',           poll:59.1,hjp:65.1,hindu:65.1,muslim:30.1,christian:4.8, blo:65.88,prog:101.37,margin:30.2,priority:'— NORMAL',   wsi:62.6, wsiGrade:'B STRONG',   prediction:'BJP WIN — MUSLIM WATCH',       totalElectors:4320,  why:'Muslim 30.1% is swing factor. Kharvi community highest turnout OBC. Merchant community pro-BJP.',gap:'Muslim 30% could flip if consolidated. Merchant community not fully engaged.',action:'Merchant association engagement; Kharvi community fest; Muslim moderate business outreach',bjpTarget:'🎯 2,700+',turnoutTarget:'🎯 66%',sirTarget:'🎯 80%',trend:'→ BJP holds',risk2025:'MUSLIM WATCH'},
    { w:50, n:'Alape South',   cls:'BJP STRONG',           poll:67.3,hjp:76.1,hindu:76.1,muslim:8.9, christian:15.0,blo:56.48,prog:109.84,margin:52.2,priority:'— NORMAL',   wsi:69.9, wsiGrade:'A STRONG',   prediction:'BJP WIN — COMFORTABLE',        totalElectors:6284,  why:'Billava+GSB coastal ward; stable with highest turnout among strong wards.',gap:'Progeny 109.84% — audit ghost entries.',action:'Audit progeny; maintain Billava-GSB alliance; BLO top-up',bjpTarget:'🎯 4,500+',turnoutTarget:'🎯 72%',sirTarget:'🎯 75%',trend:'↑→ Stable',risk2025:'— NORMAL'},
    { w:33, n:'Kadri South',   cls:'BJP FAVOURABLE',       poll:57.2,hjp:63.9,hindu:63.9,muslim:5.3, christian:30.8,blo:51.09,prog:75.37,margin:27.8,priority:'— NORMAL',    wsi:58.4, wsiGrade:'B- MEDIUM',  prediction:'BJP HOLDS — UNCERTAIN',        totalElectors:5843,  why:'Christian 30.8% is swing. BJP holds when Hindu vote consolidates.',gap:'BLO 51.09% — critically low. No BJP presence in Christian pockets.',action:'BLO completion urgently; Christian engagement through social service',bjpTarget:'🎯 3,500+',turnoutTarget:'🎯 65%',sirTarget:'🎯 72%',trend:'→ Moderate',risk2025:'— NORMAL'},
    { w:55, n:'Athavara',      cls:'BJP FAVOURABLE',       poll:62.5,hjp:62.9,hindu:62.9,muslim:24.0,christian:13.1,blo:60.02,prog:99.92,margin:25.8,priority:'— NORMAL',    wsi:60.4, wsiGrade:'B MEDIUM',   prediction:'BJP WIN — MODERATE',           totalElectors:7856,  why:'BJP favourable with good turnout. Muslim 24% consolidated against.',gap:'Muslim 24% needs development narrative.',action:'Maintain Hindu consolidation; Muslim development outreach for 8-10% split',bjpTarget:'🎯 4,500+',turnoutTarget:'🎯 68%',sirTarget:'🎯 80%',trend:'→ Moderate',risk2025:'— NORMAL'},
    { w:56, n:'Mangaladevi',   cls:'BJP FAVOURABLE',       poll:61.8,hjp:62.8,hindu:62.8,muslim:26.8,christian:10.5,blo:57.1, prog:83.28,margin:25.6,priority:'— NORMAL',    wsi:59.5, wsiGrade:'B- MEDIUM',  prediction:'BJP WIN — NARROW',             totalElectors:5358,  why:'BJP favourable with Muslim 26.8% opposition bloc.',gap:'Muslim consolidation risk. BLO 57% needs improvement.',action:'Hindu voter turnout focus; BLO completion; prevent Muslim bloc expansion',bjpTarget:'🎯 3,100+',turnoutTarget:'🎯 68%',sirTarget:'🎯 75%',trend:'→ Moderate',risk2025:'— NORMAL'},
    { w:36, n:'Padav East',    cls:'BJP FAVOURABLE',       poll:46.9,hjp:60.2,hindu:60.2,muslim:3.9, christian:35.9,blo:52.81,prog:80.04,margin:20.4,priority:'🟡 MEDIUM',    wsi:52.7, wsiGrade:'C WEAK',     prediction:'BJP HOLDS — FRAGILE',          totalElectors:4471,  why:'Highest Christian population (35.9%). Swing ward — 2019 voted BJP; 2023 swung back.',gap:'46.9% LOWEST turnout. Christian 36% unpredictable. No BJP permanent presence in Christian pockets.',action:'Establish permanent community service centre in Christian pocket; welfare scheme targeting',bjpTarget:'🎯 2,800+',turnoutTarget:'🎯 62%',sirTarget:'🎯 75%',trend:'↓ Declining',risk2025:'🟡 CHRISTIAN BARRIER'},
    { w:40, n:'Court',         cls:'CONTESTED (BJP Lean)',  poll:39.5,hjp:51.0,hindu:51.0,muslim:27.7,christian:21.4,blo:44.77,prog:88.36,margin:2.0, priority:'🟡 MEDIUM',    wsi:46.5, wsiGrade:'C- WEAK',    prediction:'TOSS-UP — TURNOUT DECISIVE',  totalElectors:5980,  why:'Very low turnout (39.5%). Highest Muslim share in contested ward (27.7%). BJP barely holds.',gap:'39.5% catastrophically low. Muslim+Christian > Hindu. Split Congress vote.',action:'Hyper-focus on Hindu voter mobilisation; deploy 3 volunteers per booth',bjpTarget:'🎯 3,100+',turnoutTarget:'🎯 60%',sirTarget:'🎯 72%',trend:'↓ Declining',risk2025:'🟡 HIGH VOLATILITY'},
    { w:34, n:'Shivabagh',     cls:'CONTESTED (BJP Lean)',  poll:50.2,hjp:52.2,hindu:52.2,muslim:11.7,christian:36.1,blo:53.38,prog:98.08,margin:4.4, priority:'🟡 MEDIUM',    wsi:50.2, wsiGrade:'C WEAK',     prediction:'TOSS-UP — CHRISTIAN FACTOR',  totalElectors:6294,  why:'Christian majority ward becoming Congress stronghold. Catholic church mobilises against BJP.',gap:'98% progeny but only 53% BLO — ghost voters. Catholic church mobilises against BJP.',action:'Find respected Catholic BJP supporter; develop Christian welfare narrative',bjpTarget:'🎯 3,400+',turnoutTarget:'🎯 65%',sirTarget:'🎯 80%',trend:'↓ 2018→2023 loss',risk2025:'🟡 CHRISTIAN BARRIER'},
    { w:59, n:'Jeppu',         cls:'CONTESTED (BJP Lean)',  poll:57.3,hjp:52.4,hindu:52.4,muslim:18.7,christian:29.0,blo:57.05,prog:97.0, margin:4.8, priority:'🟡 MEDIUM',    wsi:52.8, wsiGrade:'C WEAK',     prediction:'TOSS-UP — CANDIDATE KEY',     totalElectors:7711,  why:'Three-religion ward. BJP wins only when Hindu vote consolidates AND some Christians cross-vote.',gap:'97% progeny — many duplicates/ghost entries. Muslim+Christian = 47.7% near majority.',action:'Audit progeny list; field cross-community candidate; visible development work',bjpTarget:'🎯 4,200+',turnoutTarget:'🎯 67%',sirTarget:'🎯 80%',trend:'→ Marginal',risk2025:'CANDIDATE DEPENDENT'},
    { w:48, n:'Valencia',      cls:'CONTESTED (BJP Lean)',  poll:49.2,hjp:53.6,hindu:53.6,muslim:11.5,christian:34.9,blo:57.89,prog:92.99,margin:7.2, priority:'🟡 MEDIUM',    wsi:49.3, wsiGrade:'C- WEAK',    prediction:'TOSS-UP — FRAGILE',           totalElectors:5090,  why:'Christian 35% + Muslim 11.5% = 46.4% opposition bloc. BJP holds due to Hindu plurality.',gap:'49.2% turnout — if turnout rises, BJP loses. Christian community organisationally strong.',action:'Ensure BJP Hindu voters turnout >65%; ward-specific welfare for Christians',bjpTarget:'🎯 2,900+',turnoutTarget:'🎯 65%',sirTarget:'🎯 72%',trend:'↓ Eroding',risk2025:'CANDIDATE DEPENDENT'},
    { w:53, n:'Bajal',         cls:'CONTESTED (Cong Lean)', poll:55.1,hjp:47.8,hindu:47.8,muslim:45.2,christian:7.1, blo:59.3, prog:91.89,margin:-4.4,priority:'— NORMAL',    wsi:48.2, wsiGrade:'C- WEAK',    prediction:'CONGRESS LEAN — OPPORTUNITY', totalElectors:7805,  why:'Muslim 45% but JDS/BJP splitting Congress. BJP gaining slowly.',gap:'Muslim 45.2% near majority. BJP needs 8-10% Muslim split via development narrative.',action:'Muslim moderate outreach on development; audit progeny; maintain Hindu base',bjpTarget:'🎯 3,700+',turnoutTarget:'🎯 65%',sirTarget:'🎯 80%',trend:'→↑ Improving',risk2025:'🟡 OPPORTUNITY'},
    { w:45, n:'Port',          cls:'CONTESTED (Cong Lean)', poll:63.8,hjp:47.6,hindu:47.6,muslim:40.9,christian:11.4,blo:62.19,prog:93.55,margin:-4.8,priority:'— NORMAL',    wsi:51.0, wsiGrade:'C WEAK',     prediction:'CONGRESS LEAN — BJP GAINING', totalElectors:7153,  why:'Port area development narrative working for BJP.',gap:'Muslim+Christian = 52.3% opposition bloc.',action:'Port modernisation narrative; Muslim moderate development outreach',bjpTarget:'🎯 3,400+',turnoutTarget:'🎯 70%',sirTarget:'🎯 80%',trend:'→↑ Improving',risk2025:'🟡 OPPORTUNITY'},
    { w:52, n:'Kannur',        cls:'CONGRESS FAVOURABLE',   poll:61.2,hjp:40.1,hindu:40.1,muslim:56.9,christian:3.0, blo:58.83,prog:91.81,margin:-19.8,priority:'— NORMAL',   wsi:45.4, wsiGrade:'D CONGRESS', prediction:'CONGRESS WIN — FIGHT FOR 2ND', totalElectors:7045,  why:'Muslim majority stable Congress vote.',gap:'Muslim 56.9% near total Congress. No BJP presence.',action:'Limit damage; identify Hindu community leaders; long-term only',bjpTarget:'🎯 2,800+',turnoutTarget:'🎯 68%',sirTarget:'🎯 80%',trend:'→ Congress',risk2025:'— NORMAL'},
    { w:47, n:'Milagress',     cls:'CONGRESS FAVOURABLE',   poll:55.0,hjp:43.5,hindu:43.5,muslim:34.8,christian:21.8,blo:54.15,prog:71.6, margin:-13.0,priority:'— NORMAL',   wsi:44.2, wsiGrade:'D CONGRESS', prediction:'CONGRESS WIN — REDUCE MARGIN', totalElectors:7210,  why:'Muslim+Christian = 56.6% opposition bloc.',gap:'Hindu 43.5% unorganised. BLO coverage 54.15% — low.',action:'Limit damage; Hindu community welfare; reduce loss margin <20%',bjpTarget:'🎯 3,100+',turnoutTarget:'🎯 62%',sirTarget:'🎯 75%',trend:'→ Congress',risk2025:'— NORMAL'},
    { w:38, n:'Bendur',        cls:'CONGRESS STRONG',        poll:52.1,hjp:32.2,hindu:32.2,muslim:25.2,christian:42.6,blo:59.41,prog:85.11,margin:-35.6,priority:'🟢 WATCH',   wsi:38.6, wsiGrade:'D CONGRESS', prediction:'CONGRESS WIN — WATCH',         totalElectors:6296,  why:'Catholic + Muslim supermajority. Congress territory.',gap:'Zero BJP ward committee active. Even Hindu voters (32%) not mobilised.',action:'Damage limitation; field credible local candidate; reduce loss margin <25%',bjpTarget:'🎯 2,200+',turnoutTarget:'🎯 60%',sirTarget:'🎯 80%',trend:'→ Stable Cong',risk2025:'ACCEPT LOSS — MINIMIZE'},
    { w:60, n:'Bengre',        cls:'CONGRESS STRONG',        poll:41.6,hjp:30.9,hindu:30.9,muslim:68.3,christian:0.8, blo:60.39,prog:127.86,margin:-38.2,priority:'🟢 WATCH',  wsi:38.4, wsiGrade:'D CONGRESS', prediction:'CONGRESS WIN — WATCH',         totalElectors:10897, why:'Muslim supermajority (68.3%). BJP winning here requires sea change.',gap:'Lowest turnout (41.6%). BJP presence effectively zero. Hindu 30.9% unorganised.',action:'Long-term: cultivate Hindu community leaders; accept ward as loss, minimise margin',bjpTarget:'🎯 3,400+',turnoutTarget:'🎯 55%',sirTarget:'🎯 90%',trend:'→ Cong fortress',risk2025:'LONG TERM STRATEGY'},
    { w:44, n:'Bunder',        cls:'CONGRESS STRONG',        poll:58.0,hjp:34.6,hindu:34.6,muslim:65.1,christian:0.3, blo:54.6, prog:81.31,margin:-30.8,priority:'— NORMAL',   wsi:39.6, wsiGrade:'D CONGRESS', prediction:'CONGRESS WIN',                 totalElectors:5871,  why:'Muslim majority Congress ward.',gap:'Muslim 65.1% near total Congress dominance.',action:'Limit damage; Muslim business development loans; Hindu community welfare',bjpTarget:'🎯 2,000+',turnoutTarget:'🎯 65%',sirTarget:'🎯 75%',trend:'→ Congress',risk2025:'— NORMAL'},
    { w:39, n:'Falnir',        cls:'CONGRESS STRONG',        poll:56.3,hjp:32.1,hindu:32.1,muslim:9.2, christian:58.7,blo:60.47,prog:96.65,margin:-35.8,priority:'— NORMAL',   wsi:38.3, wsiGrade:'D CONGRESS', prediction:'CONGRESS WIN',                 totalElectors:6526,  why:'Christian majority (58.7%) strongly Congress.',gap:'Christian 58.7% highly organised for Congress. No BJP footing.',action:'Limit damage; Christian welfare narrative',bjpTarget:'🎯 2,200+',turnoutTarget:'🎯 63%',sirTarget:'🎯 80%',trend:'→ Congress',risk2025:'— NORMAL'},
    { w:43, n:'Kudroli',       cls:'CONGRESS STRONG',        poll:62.1,hjp:28.8,hindu:28.8,muslim:68.2,christian:3.0, blo:53.24,prog:74.07,margin:-42.4,priority:'— NORMAL',   wsi:36.3, wsiGrade:'D CONGRESS', prediction:'CONGRESS WIN',                 totalElectors:5765,  why:'Muslim supermajority. Lowest BJP projection in all wards.',gap:'Muslim 68.2% total Congress. BLO 53.24% — even low in loss ward.',action:'Limit damage; minimum resources; focus elsewhere',bjpTarget:'🎯 1,700+',turnoutTarget:'🎯 68%',sirTarget:'🎯 75%',trend:'→ Congress',risk2025:'— NORMAL'},
  ];

  const RELIGION_DATA = [
    { religion:'Hindu',     total:160051, polled:97317,  turnout:60.8, alignment:'🔴 DECISIVE — BJP BASE',    bjp:'85–90% strong wards' },
    { religion:'Muslim',    total:45074,  polled:22487,  turnout:49.9, alignment:'🟡 OPPOSITION BLOC',         bjp:'2–5% swing possible' },
    { religion:'Christian', total:41835,  polled:21903,  turnout:52.4, alignment:'🟡 KEY SWING COMMUNITY',    bjp:'Varies 30–70%' },
  ];
  const COMMUNITY_DATA = [
    { c:'Kharvi',                 total:584,   polled:455,  turnout:77.9, cat:'OBC',     align:'🟢 STRONG BJP',  note:'Highest turnout OBC — engage Kharvi Sangha leaders' },
    { c:'Devadiga',               total:4018,  polled:2652, turnout:66.0, cat:'OBC',     align:'🟢 STRONG BJP',  note:'VHP/RSS network strong; activate for booth duty' },
    { c:'GSB',                    total:40581, polled:24492,turnout:60.4, cat:'GC',      align:'🟢 STRONG BJP',  note:'Largest GC community; brahmin-GSB alliance critical' },
    { c:'Bunt + Mogaveera',       total:31935, polled:19734,turnout:61.8, cat:'OBC',     align:'🟢 STRONG BJP',  note:'Bunt+Mogaveera OBC belt — 31,935 voters; must win 75%+' },
    { c:'Billava + Devadiga',     total:61564, polled:38602,turnout:62.7, cat:'OBC',     align:'🟢 STRONG BJP',  note:'LARGEST OBC community — 61,564 voters; Derebail+Kodialbail belt stronghold' },
    { c:'Brahmin/Multi-community',total:43882, polled:27029,turnout:61.6, cat:'GC',      align:'🟢 STRONG BJP',  note:'BJP traditional base; risk of staying home if no energy' },
    { c:'Vokkaliga',              total:1639,  polled:920,  turnout:56.1, cat:'OBC',     align:'🟡 SPLIT',       note:'JDS+BJP; must prevent Congress poaching' },
    { c:'Mogaveera',              total:7084,  polled:4464, turnout:63.0, cat:'OBC',     align:'🟢 MOSTLY BJP',  note:'Fishing community; welfare scheme sensitive' },
    { c:'Mangalorean Catholic',   total:29755, polled:16062,turnout:54.0, cat:'Minority',align:'🔴 SWING',       note:'~30,000 voters — if 40% vote BJP, +12,000 votes DECISIVE SWING' },
    { c:'Muslim',                 total:49830, polled:24936,turnout:50.0, cat:'Minority',align:'🔴 OPPOSITION',  note:'Target moderate Muslims on development narrative' },
  ];
  const HIST_SUMMARY = [
    { metric:'Total Voters',      v2013:'229K', v2014:'235K', v2018:'238K', v2019:'238K', v2023:'247K', trend:'↑ Growing',   proj:'~252K' },
    { metric:'Turnout %',         v2013:'~65%', v2014:'~70%', v2018:'67.3%',v2019:'70.5%',v2023:'64.6%',trend:'↓ Declining',proj:'Target 68%' },
    { metric:'BJP Vote Share %',  v2013:'~52%', v2014:'~55%', v2018:'55.4%',v2019:'57.4%',v2023:'56.0%',trend:'→ Stable',   proj:'Target 58%' },
    { metric:'Cong Vote Share %', v2013:'~45%', v2014:'~38%', v2018:'42.1%',v2019:'39.5%',v2023:'42.2%',trend:'→ Stable',   proj:'~40%' },
    { metric:'Win Margin (avg)',  v2013:'—',    v2014:'—',    v2018:'14.7%',v2019:'17.8%',v2023:'12.4%',trend:'↓ Narrowing',proj:'Need >15%' },
    { metric:'Non-Voters (BJP)',  v2013:'~70K', v2014:'~65K', v2018:'~78K', v2019:'~70K', v2023:'~105K',trend:'↑ CRITICAL', proj:'Reduce to 85K' },
  ];
  const SCENARIOS = [
    { s:'A — Status Quo',    prob:0.58, desc:'BJP wins by narrow margin. Risk of loss if turnout drops 3%.', color:'#f59e0b' },
    { s:'B — Full Mobilise', prob:0.74, desc:'+8,500 votes from turnout + Christian swing + SIR.',           color:'#10b981' },
    { s:'C — Perfect Exec.', prob:0.86, desc:'Full OBC + Christian 45% + turnout 67%.',                      color:'#22d3ee' },
  ];
  const STRATEGY = [
    { pillar:'P1 — Mobilise',    color:'#f59e0b', items:[
      {code:'P1-01',action:'Booth Activation Blitz',    desc:'3 booth agents per booth. Raise turnout in strongholds 55%→66%. Personal contact with 50 BJP households each.',target:'All 10 Strongholds',priority:'HIGH'},
      {code:'P1-02',action:'Transport & Last-Mile',     desc:'Book vehicles per booth. Priority: elderly, women, migrant workers. Historical data: 3–4% turnout gap from transport.',target:'Boloor, Padav West, Kadri North',priority:'CRITICAL'},
      {code:'P1-03',action:'Youth Voter Registration',  desc:'18–22 age group severely underregistered. Camps at colleges. Target: 5,000 new BJP-leaning youth voters.',target:'All BJP wards',priority:'HIGH'},
      {code:'P1-04',action:'NRI Voter Contact',         desc:'WhatsApp groups per ward. Video messages from NRI community leaders urging family members to vote.',target:'Derebail, Kodialbail, Boloor',priority:'MEDIUM'},
      {code:'P1-05',action:"Women's Mobilisation",      desc:"'Har Ghar BJP'. Target women turnout 64%+. Christian women (53.6% turnout) are key swing.",target:'All wards',priority:'HIGH'},
    ]},
    { pillar:'P2 — Consolidate', color:'#8b5cf6', items:[
      {code:'P2-01',action:'Billava-Devadiga Alliance', desc:'61,564 combined voters. Organise Billava Sangha rally; announce Billava welfare scheme.',target:'Derebail wards, Kodialbail',priority:'CRITICAL'},
      {code:'P2-02',action:'Bunt-Mogaveera Convention', desc:'31,935 combined voters. Organise united convention with BJP MLA+candidate.',target:'Mannagudda, Kambala, Boloor',priority:'HIGH'},
      {code:'P2-03',action:'GSB Brahmin Engagement',    desc:'40,000+ GC voters. Cultural events, GSB Sabha, temple programmes.',target:'Central, Kadri North, Derebail NW',priority:'MEDIUM'},
      {code:'P2-04',action:'Kharvi Community Outreach', desc:'Highest turnout (77.9%) OBC. Fisheries welfare + Kharvi Sangha linkage.',target:'Bolar, Hoige Bazar',priority:'MEDIUM'},
    ]},
    { pillar:'P3 — Penetrate',   color:'#22d3ee', items:[
      {code:'P3-01',action:'Christian Liaison Program', desc:'1 BJP worker per Christian-majority pocket. Focus on DEVELOPMENT — not Hindutva.',target:'Shivabagh, Valencia, Bejai, Falnir',priority:'CRITICAL'},
      {code:'P3-02',action:'Christian Welfare Scheme',  desc:"'Coastal Christian Fishermen Welfare Fund' and 'St. Aloysius Education Support'.",target:'Padav East, Bendur, Valencia',priority:'HIGH'},
      {code:'P3-03',action:'Catholic Youth Engagement', desc:'Sports tournaments, skill dev. Build non-political relationships first.',target:'Shivabagh, Bejai, Court',priority:'HIGH'},
      {code:'P3-05',action:'Candidate Selection Rule',  desc:'In wards >25% Christian, candidate must have cross-community appeal.',target:'Padav East, Valencia, Shivabagh',priority:'CRITICAL'},
    ]},
    { pillar:'P4 — Insulate',    color:'#ef4444', items:[
      {code:'P4-01',action:'Anti-Defection Vigil',       desc:'Assign senior mentor per booth. Daily check-in 30 days before election.',target:'All wards',priority:'HIGH'},
      {code:'P4-02',action:'Counter-Narrative Response', desc:'Ward-specific development catalogue to counter Congress failure narrative.',target:'All 38 wards',priority:'HIGH'},
      {code:'P4-03',action:'Muslim Moderate Outreach',   desc:'Target 8–10% Muslim vote in Bajal, Port, Hoige Bazar. Development narrative.',target:'Bajal, Port, Hoige Bazar',priority:'MEDIUM'},
      {code:'P4-05',action:'Eve-of-Election Intel',      desc:'48-hour rapid reporting network. Real-time on Congress voter mobilisation.',target:'All wards',priority:'CRITICAL'},
    ]},
    { pillar:'P5 — Dominate',    color:'#10b981', items:[
      {code:'P5-01',action:"'Mangaluru Model' Narrative", desc:"Position Mangaluru as Karnataka's development capital under BJP. Port, IT Hub, Safety.",target:'Constituency-wide',priority:'CRITICAL'},
      {code:'P5-02',action:'Ward Micro-Manifesto',        desc:"1-page 'Ward Promise Letter' with 5 specific deliverables. Door-to-door.",target:'All 38 wards',priority:'HIGH'},
      {code:'P5-04',action:'Social Media Saturation',     desc:'WhatsApp per booth. YouTube ward videos. Target 50,000+ digital touchpoints.',target:'All demographics',priority:'MEDIUM'},
    ]},
  ];
  const POLICIES = [
    {code:'INFRA-01', cat:'Infrastructure',item:'Mangaluru Coastal Road — Bengre-Bolar promenade & road widening.',target:'Bengre, Port, Bolar',impact:'🏗 HIGH'},
    {code:'INFRA-03', cat:'Infrastructure',item:'Mangaluru Tech Hub — IT/startup zone in Derebail/Padav. Youth employment.',target:'Derebail West/NW',impact:'💼 HIGH'},
    {code:'INFRA-04', cat:'Infrastructure',item:'Port Modernisation — Central BJP investment. Jobs for Kharvi, Mogaveera.',target:'Bolar, Hoige Bazar, Port',impact:'🚢 HIGH'},
    {code:'WELFARE-01',cat:'Welfare',      item:'Billava-Devadiga Skill Development Fund — ₹5000 scholarship/year.',target:'All Derebail wards',impact:'💰 CRITICAL'},
    {code:'WELFARE-02',cat:'Welfare',      item:'Coastal Fisherfolk Welfare — Blue ration card, boat insurance, Kharvi-Mogaveera marketing.',target:'Hoige Bazar, Bolar',impact:'🎣 HIGH'},
    {code:'WELFARE-03',cat:'Welfare',      item:'Christian Education Grant — merit scholarships for Christian students.',target:'Bejai, Shivabagh, Valencia',impact:'📚 HIGH'},
    {code:'WELFARE-05',cat:'Welfare',      item:'Senior Citizen Health Scheme — free health camps + Ayushman for 60+ all communities.',target:'All BJP wards',impact:'🏥 HIGH'},
    {code:'CULTURE-01',cat:'Cultural',     item:'Heritage Conservation — Kadri temple corridor beautification.',target:'Kadri, Kudroli area',impact:'🛕 HIGH'},
    {code:'CULTURE-03',cat:'Cultural',     item:"Zero-Tolerance Safety — 'Safe Mangaluru' report. Counter Congress riots narrative.",target:'Constituency-wide',impact:'🛡 CRITICAL'},
    {code:'GRASS-01',  cat:'Grassroots',   item:'Ward-Level Janata Darbar — MLA holds monthly open grievance in each ward.',target:'All 38 wards',impact:'👥 CRITICAL'},
    {code:'GRASS-02',  cat:'Grassroots',   item:'SIR Survey Completion — 100% BLO mapping. Currently ~60%. Win the unmapped 40%.',target:'All wards',impact:'📋 CRITICAL'},
    {code:'GRASS-03',  cat:'Grassroots',   item:'Booth Sahayogi Network — 1 trained volunteer per 100 voters. Year-round help desk.',target:'Priority: risk wards',impact:'🤝 HIGH'},
  ];
  const CALENDAR = [
    {phase:'T-12: Foundation',  color:'#8b5cf6',items:[
      {n:1,act:'Data Audit',            desc:'Complete SIR survey all 38 wards. 85% BLO mapping target.',           owner:'Ward committees',p:'High'},
      {n:2,act:'Youth Registration',    desc:'First-time voter camps at colleges. Target 5,000 new voters.',         owner:'Yuva Morcha',    p:'Critical'},
      {n:3,act:'Community Mapping',     desc:'Map caste/community leaders in every ward.',                           owner:'Org team',       p:'High'},
      {n:4,act:'Ward Committee Setup',  desc:'Reconstitute booth committees in all 266 booths.',                    owner:'Mandal president',p:'Critical'},
    ]},
    {phase:'T-9: Consolidation', color:'#f59e0b',items:[
      {n:5,act:'OBC Alliance Convention',desc:'Grand Billava-Devadiga-Mogaveera-Bunt convention. Welfare scheme.',  owner:'OBC Morcha',    p:'Critical'},
      {n:6,act:'Welfare Scheme Launch',  desc:'BJP-branded welfare schemes: Kharvi Fund, Billava Skill, Education.', owner:'Policy team',  p:'High'},
      {n:7,act:'Christian Outreach',     desc:'Relationship-building with Christian leaders. Service focus only.',   owner:'Party liaison', p:'Critical'},
      {n:8,act:'MLA Ward Visits R1',     desc:'MLA visits all 38 wards for Jan Sampark. Collect + resolve issues.',  owner:'MLA office',   p:'High'},
    ]},
    {phase:'T-6: Momentum',      color:'#22d3ee',items:[
      {n:9, act:'Padayatra',              desc:'Week-long foot march all 38 wards. Focus swing wards.',              owner:'Candidate',    p:'Critical'},
      {n:10,act:'Social Media Offensive', desc:'Ward-specific WhatsApp groups. 50,000 digital touchpoints target.', owner:'Digital cell', p:'High'},
      {n:11,act:'Anti-Corruption Campaign',desc:'Ward-level corruption report cards for Congress incumbents.',      owner:'Media cell',   p:'High'},
    ]},
    {phase:'T-3: Final Push',    color:'#ef4444',items:[
      {n:13,act:'Micro-Manifesto Release',    desc:'Ward-specific 1-page promise letters. Door-to-door distribution.',          owner:'Candidate',        p:'Critical'},
      {n:14,act:"Women's Mobilisation Drive", desc:"'Har Ghar BJP'. Christian women in swing wards focus.",                     owner:'Mahila Morcha',    p:'Critical'},
      {n:15,act:'Candidate Finalisation',     desc:'Finalise candidate: cross-community appeal required. Bunt/GSB preferred.',  owner:'Election committee',p:'Critical'},
    ]},
    {phase:'T-1: Sprint',        color:'#10b981',items:[
      {n:17,act:'Transport Booking',   desc:'Book vehicles every booth. Priority: elderly, women, migrants.', owner:'Booth committees',p:'Critical'},
      {n:18,act:'Final Voter Check',   desc:'Verify all BJP voter names on roll. Flag deleted names.',        owner:'Booth agents',    p:'Critical'},
      {n:20,act:'Polling Day Protocol',desc:'5AM booth agent. Every 2hrs contact push. 5PM: Final push.',    owner:'All booth agents', p:'Critical'},
    ]},
  ];
  const INSIGHTS = [
    {n:1, sev:'🔴',title:"Low Turnout = BJP's #1 Enemy",          msg:'In 8 strongholds turnout <58%. At 66%, BJP gains +8,500 votes — more than winning margin.',                action:'MOBILISE: Transport, booth agents, 72-hour voter contact'},
    {n:2, sev:'🟠',title:'Christian Vote is Swing Decider',       msg:'41,835 Christians. BJP gets ~38%. At 45% in 6 swing wards: +2,800 votes — flips 3 wards.',              action:'PENETRATE: Year-round service, welfare scheme, credible candidate'},
    {n:3, sev:'🔴',title:'105,000 Non-Voters — Biggest Base',     msg:'105,253 did not vote 2023. At 56% BJP share = 59,000 potential votes LEFT HOME.',                       action:'MOBILISE: SIR completion, transport, booth activation'},
    {n:4, sev:'🟡',title:'OBC Consolidation Partially Complete',  msg:'Billava+Devadiga+Mogaveera+Bunt = ~93,000. Need 72%+. 10-point OBC gain = +4,200 votes.',              action:'CONSOLIDATE: Community conventions, welfare schemes'},
    {n:5, sev:'🔴',title:'Boloor — Most Critical, 50.8% Turnout', msg:'87.5% BJP projection but 50.8% turnout. ~5,400 BJP voters at home. Could FLIP.',                       action:'URGENT: Emergency mobilisation in Boloor — top priority'},
    {n:6, sev:'🟠',title:'SIR Mapping — 33% Electorate Invisible',msg:'Avg BLO 60%, progeny 82%. Combined reach ~67%. 33% of electorate INVISIBLE to party machinery.',        action:'DATA: Complete all SIR surveys; prioritise Boloor, Derebail South, Bejai'},
    {n:7, sev:'🟡',title:'Muslim Vote Cannot Win — Only Split',    msg:'49,830 Muslims 50.0% turnout. 95%+ Congress. BUT 8-10% in Bajal/Port/Hoige Bazar = decisive.',         action:'MICRO-PENETRATE: Business development loans, development narrative'},
    {n:8, sev:'🟡',title:'Women Voters = Underutilised Asset',    msg:'83,497 women Hindu voters. Turnout 60.7% — near equal to men. Mahila Morcha can close gap.',            action:'MOBILISE: Mahila Morcha Har Ghar; women-specific welfare'},
    {n:9, sev:'🟠',title:'Court Ward — Lowest Turnout = Opportunity',msg:'39.5% turnout. Every 1% rise = 60 new votes. Most elastic ward in constituency.',                    action:'HYPER-FOCUS: 3 volunteers per booth, transport, last-mile'},
    {n:10,sev:'🟠',title:'Candidate is a Multiplier',             msg:'In contested wards (>25% Christian/Muslim), candidate cross-community appeal adds 3–8% swing.',         action:'SELECTION: Candidate must have cross-community network in target wards'},
  ];

  const IC = (path, vb='0 0 24 24') => (
    <svg width="14" height="14" viewBox={vb} fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {path}
    </svg>
  );

  const TABS = [
    {id:'heatmap',  label:'Heatmap',    icon: IC(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>) },
    {id:'why',      label:'Why S/M/W',  icon: IC(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>) },
    {id:'wsi',      label:'WSI Scores', icon: IC(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>) },
    {id:'community',label:'Community',  icon: IC(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>) },
    {id:'history',  label:'History',    icon: IC(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>) },
    {id:'math',     label:'Math',       icon: IC(<><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="14" y2="18"/><line x1="19" y1="15" x2="19" y2="21"/><line x1="16" y1="18" x2="22" y2="18"/></>) },
    {id:'strategy', label:'Strategy',   icon: IC(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>) },
    {id:'policy',   label:'Policy',     icon: IC(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>) },
    {id:'tracker',  label:'Tracker',    icon: IC(<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>) },
    {id:'calendar', label:'Calendar',   icon: IC(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>) },
    {id:'insights', label:'Insights',   icon: IC(<><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>) },
    {id:'aidash',   label:'AI Overview',icon: IC(<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>) },
    {id:'simulator',label:'Simulator',  icon: IC(<><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></>) },
    {id:'budget',   label:'Budget',     icon: IC(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>) },
  ];

  const clsCfg = (cls) => {
    if(cls.includes('STRONGHOLD'))                             return {color:'#10b981',bg:'rgba(16,185,129,0.15)',label:'STRONGHOLD'};
    if(cls.includes('BJP STRONG')&&!cls.includes('FAVOUR'))   return {color:'#22d3ee',bg:'rgba(34,211,238,0.12)',label:'STRONG'};
    if(cls.includes('BJP FAVOUR'))                            return {color:'#f59e0b',bg:'rgba(245,158,11,0.13)',label:'FAVOURABLE'};
    if(cls.includes('CONTESTED'))                             return {color:'#f97316',bg:'rgba(249,115,22,0.13)',label:'CONTESTED'};
    if(cls.includes('CONG FAVO')||cls.includes('CONGRESS FAVO')) return {color:'#a78bfa',bg:'rgba(167,139,250,0.13)',label:'CONG FVBL'};
    return {color:'#8b5cf6',bg:'rgba(139,92,246,0.15)',label:'CONG STRONG'};
  };
  const pColor = (p) => p&&p.includes('CRITICAL')?'#ef4444':p&&p.includes('HIGH')?'#f59e0b':p&&p.includes('MEDIUM')?'#a78bfa':p&&p.includes('WATCH')?'#10b981':'rgba(255,255,255,0.3)';
  const C = (bold=false,color='rgba(255,255,255,0.7)') => ({padding:'7px 10px',fontSize:12,color,fontWeight:bold?700:400,borderBottom:'1px solid rgba(255,255,255,0.05)'});
  const tabBtn = (id) => ({
    padding:'6px 13px', borderRadius:20, fontSize:11.5, fontWeight:600,
    cursor:'pointer', border:'none', whiteSpace:'nowrap', flexShrink:0,
    background: activeTab===id ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.02)',
    color: activeTab===id ? '#fbbf24' : 'rgba(255,255,255,0.4)',
    outline: activeTab===id ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.06)',
    transition:'all 0.2s ease',
  });

  return (
    <div style={{marginBottom:24}}>
      <div style={{
        background:'linear-gradient(160deg,#07101f 0%,#0d1b38 100%)',
        border:'1px solid rgba(255,255,255,0.07)',
        borderRadius:20,
        boxShadow:'0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        overflow:'hidden',
      }}>

        {/* Header */}
        <div style={{padding:'20px 22px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:12}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:5}}>
                <span style={{
                  background:'linear-gradient(135deg,#dc2626,#7f1d1d)',
                  color:'#fff', fontSize:9, fontWeight:900, letterSpacing:1.5,
                  padding:'3px 8px', borderRadius:5, textTransform:'uppercase',
                }}>BJP</span>
                <span style={{fontSize:17,fontWeight:800,color:'#f1f5f9',letterSpacing:'-0.5px'}}>Political Intelligence System</span>
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.28)',letterSpacing:0.2}}>
                Mangaluru City South · 38 wards · 246,960 electors · Decadal analysis 2013–2025
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[{v:18,l:'BJP wards',c:'#10b981'},{v:5,l:'Contested',c:'#f97316'},{v:9,l:'Cong wards',c:'#8b5cf6'},{v:'58%',l:'Win probability',c:'#f59e0b'}].map(s=>(
                <div key={s.l} style={{
                  background:`linear-gradient(135deg,${s.c}18,${s.c}06)`,
                  border:`1px solid ${s.c}30`,
                  borderRadius:12, padding:'8px 14px', textAlign:'center',
                  minWidth:62,
                }}>
                  <div style={{fontSize:20,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:9,color:'rgba(255,255,255,0.32)',marginTop:3,letterSpacing:0.3}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pill tab bar */}
          <div style={{
            display:'flex', gap:3, overflowX:'auto', paddingBottom:12,
            scrollbarWidth:'none', msOverflowStyle:'none',
          }}>
            {TABS.map(t=>(
              <button key={t.id} style={tabBtn(t.id)} onClick={()=>setActiveTab(t.id)}>
                <span style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{opacity:activeTab===t.id?1:0.45,display:'flex'}}>{t.icon}</span>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:'20px 22px'}}>

          {/* HEATMAP */}
          {activeTab==='heatmap'&&(
            <HeatmapTab WARDS_FULL={WARDS_FULL} clsCfg={clsCfg} pColor={pColor} expandedWard={expandedWard} setExpandedWard={setExpandedWard}/>
          )}

          {/* WHY S/M/W */}
          {activeTab==='why'&&(
            <WhyTab WARDS_FULL={WARDS_FULL} clsCfg={clsCfg} pColor={pColor}/>
          )}

          {/* WSI SCORES */}
          {activeTab==='wsi'&&(
            <div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:14}}>WSI = (BJP%×35) + (Turnout%×25) + (Hindu%×20) + (SIR%×15) + (Trend×5) · &gt;70=Strong · 50-70=Medium · &lt;50=Weak</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
                {WARDS_FULL.slice().sort((a,b)=>b.wsi-a.wsi).map(d=>{
                  const cfg=clsCfg(d.cls); const wc=d.wsi>=70?'#10b981':d.wsi>=50?'#f59e0b':'#ef4444';
                  return (
                    <div key={d.w} style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'12px 14px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                        <div style={{fontSize:12,fontWeight:700,color:'var(--text-1)'}}>W{d.w} · {d.n}</div>
                        <div style={{fontSize:22,fontWeight:900,color:wc}}>{d.wsi.toFixed(0)}</div>
                      </div>
                      <div style={{height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden',marginBottom:6}}>
                        <div style={{width:`${Math.min(100,d.wsi)}%`,height:'100%',background:wc,borderRadius:3}}/>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:4}}>
                        <span style={{background:cfg.bg,color:cfg.color,padding:'1px 6px',borderRadius:4,fontWeight:700}}>{d.wsiGrade}</span>
                        <span style={{color:'rgba(255,255,255,0.35)'}}>Margin {d.margin>=0?'+':''}{d.margin.toFixed(0)}%</span>
                      </div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',lineHeight:1.4}}>{d.prediction}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMMUNITY */}
          {activeTab==='community'&&(
            <CommunityTab RELIGION_DATA={RELIGION_DATA} COMMUNITY_DATA={COMMUNITY_DATA}/>
          )}

          {/* HISTORY */}
          {activeTab==='history'&&(
            <HistoryTab HIST_SUMMARY={HIST_SUMMARY} WARDS_FULL={WARDS_FULL} clsCfg={clsCfg} pColor={pColor}/>
          )}

          {/* MATH */}
          {activeTab==='math'&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:12}}>BJP Victory Equation — Scientific Formulae</div>
              <div style={{background:'rgba(34,211,238,0.07)',border:'1px solid rgba(34,211,238,0.2)',borderRadius:12,padding:'14px',marginBottom:16}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginBottom:4}}>MASTER VICTORY EQUATION</div>
                <div style={{fontSize:13,color:'#22d3ee',fontWeight:700,fontFamily:'monospace'}}>WIN = (H_TURNOUT × H_BJP%) + (C_TURNOUT × C_SWING%) + (M_SPLIT%) &gt; 50% Valid Votes</div>
                <div style={{marginTop:8,fontSize:11,color:'rgba(255,255,255,0.45)'}}>2023: (97,317×0.63) + (21,903×0.38) + (22,487×0.04) = 70,521 BJP vs ~67,200 Congress</div>
                <div style={{fontSize:11,color:'#10b981',marginTop:3}}>2025 target: (102K×0.67) + (22.5K×0.42) + (23K×0.05) = 78,940+ BJP votes for safe margin</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:8,marginBottom:18}}>
                {SCENARIOS.map(s=>(
                  <div key={s.s} style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${s.color}33`,borderRadius:12,padding:'14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <div style={{fontSize:12,fontWeight:700,color:'var(--text-1)'}}>{s.s}</div>
                      <div style={{fontSize:22,fontWeight:900,color:s.color}}>{(s.prob*100).toFixed(0)}%</div>
                    </div>
                    <div style={{height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
                      <div style={{width:`${s.prob*100}%`,height:'100%',background:s.color,borderRadius:3}}/>
                    </div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{s.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:8}}>
                {[
                  {label:'Latent BJP votes (non-voters)',formula:'NON_VOTERS × AVG_BJP_SHARE',result:'62,734 × 0.63 = 39,522 LATENT BJP VOTES never captured',color:'#f59e0b'},
                  {label:'Turnout lift value',           formula:'ΔTURNOUT% × WARD_VOTERS × BJP_SHARE',result:'Each 1% gain in Hindu wards adds ~850 BJP votes',color:'#22d3ee'},
                  {label:'Christian swing formula',       formula:'CHRISTIAN_VOTERS × ΔSWING% × TURNOUT',result:'38%→45% in swing wards: +2,800 votes',color:'#a78bfa'},
                  {label:'OBC consolidation impact',      formula:'TOTAL_OBC × (TARGET% - CURRENT%) × T%',result:'62%→70% OBC: +4,200 votes',color:'#10b981'},
                  {label:'WSI formula',                   formula:'(BJP×0.35)+(T%×0.25)+(H%×0.20)+(SIR×0.15)+(Trend×0.05)',result:'>70=Strong · 50-70=Medium · <50=Weak',color:'#ef4444'},
                  {label:'Win probability (logistic)',    formula:'P = 1/(1+e^(-score))',result:'P>0.65 = confident win. Status quo: P=0.58 (uncertain)',color:'#f97316'},
                ].map(f=>(
                  <div key={f.label} style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px'}}>
                    <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:4}}>{f.label}</div>
                    <div style={{fontFamily:'monospace',fontSize:10,color:f.color,marginBottom:4}}>{f.formula}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{f.result}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STRATEGY */}
          {activeTab==='strategy'&&(
            <div>
              {/* 5-pillar header */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16,flexWrap:'wrap'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',letterSpacing:0.5}}>5-PILLAR VICTORY STRATEGY</div>
                {['MOBILISE','CONSOLIDATE','PENETRATE','INSULATE','DOMINATE'].map((p,i)=>(
                  <span key={p} style={{
                    fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:20,letterSpacing:0.8,
                    background:['rgba(239,68,68,0.15)','rgba(16,185,129,0.12)','rgba(245,158,11,0.12)','rgba(34,211,238,0.12)','rgba(167,139,250,0.12)'][i],
                    color:['#f87171','#34d399','#fbbf24','#67e8f9','#c4b5fd'][i],
                    border:`1px solid ${'rgba(239,68,68,0.3) rgba(16,185,129,0.25) rgba(245,158,11,0.25) rgba(34,211,238,0.25) rgba(167,139,250,0.25)'.split(' ')[i]}`,
                  }}>{p}</span>
                ))}
              </div>

              {STRATEGY.map(pillar=>(
                <div key={pillar.pillar} style={{marginBottom:20}}>
                  <div style={{
                    fontSize:12,fontWeight:800,color:pillar.color,marginBottom:10,
                    display:'flex',alignItems:'center',gap:8,
                  }}>
                    <div style={{width:3,height:18,background:pillar.color,borderRadius:2,flexShrink:0}}/>
                    {pillar.pillar}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:8}}>
                    {pillar.items.map(item=>(
                      <div key={item.code} style={{
                        background:'rgba(255,255,255,0.022)',
                        border:'1px solid rgba(255,255,255,0.06)',
                        borderRadius:12,padding:'12px 14px',
                        borderLeft:`3px solid ${item.priority==='CRITICAL'?'#ef4444':item.priority==='HIGH'?'#f59e0b':'#22d3ee'}`,
                        transition:'all 0.2s',
                      }}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                          <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.25)',letterSpacing:0.5}}>{item.code}</span>
                          <span style={{
                            fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:4,letterSpacing:0.5,
                            background:item.priority==='CRITICAL'?'rgba(239,68,68,0.18)':item.priority==='HIGH'?'rgba(245,158,11,0.18)':'rgba(34,211,238,0.12)',
                            color:item.priority==='CRITICAL'?'#f87171':item.priority==='HIGH'?'#fbbf24':'#67e8f9',
                          }}>{item.priority}</span>
                        </div>
                        <div style={{fontSize:12,fontWeight:700,color:'#f1f5f9',marginBottom:5,lineHeight:1.4}}>{item.action}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:6,lineHeight:1.55}}>{item.desc}</div>
                        <div style={{fontSize:10,color:pillar.color,fontWeight:600}}>↗ {item.target}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* ── Field Playbook — Do's & Don'ts ──────────────────────────────── */}
              <div style={{marginTop:24,borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20}}>
                <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.4)',marginBottom:14,letterSpacing:0.5}}>
                  FIELD PLAYBOOK — QUICK REFERENCE
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

                  {/* Do's */}
                  <div style={{background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:14,padding:'14px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#4ade80',fontWeight:800,flexShrink:0}}>✓</div>
                      <span style={{fontSize:11,fontWeight:800,color:'#4ade80',letterSpacing:0.3}}>DO — High-Impact Actions</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px 10px'}}>
                      {[
                        "WhatsApp booth location to non-pollers 48 hrs before poll",
                        "Prioritise 46–65 age group — highest polling rate segment",
                        "Assign female workers to female voters — 2.5% turnout edge",
                        "Complete SIR in risk wards — every unregistered Hindu = lost BJP vote",
                        "Deploy vehicles for elderly + outstation voters on poll day",
                        "Run Tulu/Konkani community meetings to cut voter apathy",
                        "Track real-time booth data; send agents to low-turnout booths",
                        "Announce local development works visible before polls",
                        "Use Confidence-HIGH voter list for targeted outreach",
                        "Maintain NRI contact list — Valencia, Bejai, Padav diaspora votes",
                      ].map((d,i)=>(
                        <div key={i} style={{display:'flex',gap:6,alignItems:'flex-start',padding:'5px 0',borderBottom:'1px solid rgba(16,185,129,0.06)'}}>
                          <span style={{color:'#4ade80',flexShrink:0,fontSize:9,marginTop:2,fontWeight:900}}>✓</span>
                          <span style={{fontSize:10,color:'rgba(255,255,255,0.6)',lineHeight:1.45}}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Don'ts */}
                  <div style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:14,padding:'14px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(239,68,68,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#f87171',fontWeight:800,flexShrink:0}}>✕</div>
                      <span style={{fontSize:11,fontWeight:800,color:'#f87171',letterSpacing:0.3}}>DON'T — Avoid These Mistakes</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px 10px'}}>
                      {[
                        "No divisive messaging in mixed wards (Court, Shivabagh, Jeppu)",
                        "Don't over-promise in Cong-strong wards — hurts swing ward credibility",
                        "Don't neglect 26–35 age group — 50,000+ non-voters, reachable digitally",
                        "SIR completion ≠ mobilisation — BLO mapping is just step one",
                        "Don't spend on posters/hoardings — lowest ROI per vote",
                        "Zero tolerance for poll-day worker absenteeism — costs 3–5% turnout",
                        "Don't ignore Unclassified voters (37.86%) — likely BJP-leaning OBCs",
                        "Don't confront Muslim workers in sensitive wards — causes backlash",
                        "Don't rely only on historical winning booths — low-poll strongholds = highest swing",
                        "No generic state-level digital content — only hyper-local Mangaluru issues work",
                      ].map((d,i)=>(
                        <div key={i} style={{display:'flex',gap:6,alignItems:'flex-start',padding:'5px 0',borderBottom:'1px solid rgba(239,68,68,0.06)'}}>
                          <span style={{color:'#f87171',flexShrink:0,fontSize:9,marginTop:2,fontWeight:900}}>✕</span>
                          <span style={{fontSize:10,color:'rgba(255,255,255,0.6)',lineHeight:1.45}}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* POLICY */}
          {activeTab==='policy'&&(
            <div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:14}}>Evidence-Based Policy Mandate & Community Promises</div>
              {['Infrastructure','Welfare','Cultural','Grassroots'].map(cat=>{
                const items=POLICIES.filter(p=>p.cat===cat);
                const cc={Infrastructure:'#22d3ee',Welfare:'#10b981',Cultural:'#f59e0b',Grassroots:'#a78bfa'}[cat];
                return (
                  <div key={cat} style={{marginBottom:16}}>
                    <div style={{fontSize:12,fontWeight:800,color:cc,marginBottom:8,padding:'4px 10px',background:`${cc}15`,borderRadius:6,display:'inline-block'}}>{cat}</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:8}}>
                      {items.map(p=>(
                        <div key={p.code} style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 14px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                            <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>{p.code}</span>
                            <span style={{fontSize:11,fontWeight:700,color:cc}}>{p.impact}</span>
                          </div>
                          <div style={{fontSize:12,color:'rgba(255,255,255,0.75)',lineHeight:1.5,marginBottom:6}}>{p.item}</div>
                          <div style={{fontSize:10,color:cc}}>Target: {p.target}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TRACKER */}
          {activeTab==='tracker'&&(
            <div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:12}}>Ward Operational Action Tracker — update status monthly · 🟢 On Track · 🟡 At Risk · 🔴 Off Track</div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:950}}>
                  <thead><tr style={{background:'rgba(255,255,255,0.04)'}}>
                    {['Ward','Class','Booths','Voters','BJP Target','Turnout Target','SIR Target','Booth Cmte','Christian','Status'].map(h=><th key={h} style={{...C(true,'rgba(255,255,255,0.5)'),textAlign:'left',fontSize:10,whiteSpace:'nowrap'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{WARDS_FULL.map((d,i)=>{
                    const cfg=clsCfg(d.cls);
                    const boothCount=WARD_FULL_DATA[d.w]?.booths?.length||'—';
                    return (
                      <tr key={d.w} style={{background:i%2===0?'transparent':'rgba(255,255,255,0.015)'}}>
                        <td style={{...C(),whiteSpace:'nowrap',fontWeight:700,color:cfg.color}}>W{d.w} {d.n}</td>
                        <td style={{...C(),fontSize:10,color:cfg.color}}>{cfg.label}</td>
                        <td style={C()}>{boothCount}</td>
                        <td style={C()}>{d.totalElectors.toLocaleString()}</td>
                        <td style={{...C(),color:'#22d3ee',fontWeight:600,fontSize:11}}>{d.bjpTarget}</td>
                        <td style={{...C(),color:'#f59e0b',fontWeight:600,fontSize:11}}>{d.turnoutTarget}</td>
                        <td style={{...C(),color:'#a78bfa',fontWeight:600,fontSize:11}}>{d.sirTarget}</td>
                        <td style={{...C(),fontSize:10,color:'rgba(255,255,255,0.4)'}}>[ ] YES [ ] NO</td>
                        <td style={{...C(),fontSize:10,color:d.christian>15?'#f59e0b':'rgba(255,255,255,0.3)'}}>{d.christian>25?'[ ] CRITICAL':d.christian>15?'[ ] NEEDED':'[ ] MONITOR'}</td>
                        <td style={{...C(),color:pColor(d.priority),fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{d.priority.includes('CRITICAL')||d.priority.includes('HIGH')?'FILL 🔴':d.priority.includes('WATCH')?'WATCH 🟢':d.margin>50?'NORMAL ✅':'FILL STATUS'}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* CALENDAR */}
          {activeTab==='calendar'&&(
            <div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:14}}>12-Month Campaign Preparation Timeline — T-12 to T-0 Months</div>
              {CALENDAR.map(phase=>(
                <div key={phase.phase} style={{marginBottom:20}}>
                  <div style={{fontSize:13,fontWeight:800,color:phase.color,marginBottom:10,padding:'5px 14px',background:`${phase.color}15`,borderRadius:8,display:'inline-block'}}>{phase.phase}</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:8}}>
                    {phase.items.map(item=>(
                      <div key={item.n} style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 14px',borderLeft:`3px solid ${item.p==='Critical'?'#ef4444':'#f59e0b'}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                          <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>#{item.n}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,background:item.p==='Critical'?'rgba(239,68,68,0.2)':'rgba(245,158,11,0.2)',color:item.p==='Critical'?'#ef4444':'#f59e0b'}}>{item.p}</span>
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:'var(--text-1)',marginBottom:5}}>{item.act}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.5,marginBottom:5}}>{item.desc}</div>
                        <div style={{fontSize:10,color:phase.color}}>Owner: {item.owner}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* INSIGHTS */}
          {activeTab==='insights'&&(
            <div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:14}}>Top 10 Actionable Intelligence Insights — Final Summary</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {INSIGHTS.map(ins=>(
                  <div key={ins.n} style={{background:'rgba(255,255,255,0.022)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'15px 18px',display:'flex',gap:14,alignItems:'flex-start',boxShadow:'0 2px 12px rgba(0,0,0,0.2)',transition:'all 0.2s'}}>
                    <div style={{fontSize:22,fontWeight:900,color:ins.sev==='🔴'?'#ef4444':ins.sev==='🟠'?'#f97316':'#f59e0b',minWidth:32,textAlign:'center'}}>{ins.n}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:800,color:'var(--text-1)',marginBottom:5}}>{ins.title}</div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',marginBottom:8,lineHeight:1.6}}>{ins.msg}</div>
                      <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,padding:'4px 12px'}}>
                        <span style={{fontSize:11,color:'#10b981'}}>→</span>
                        <span style={{fontSize:11,fontWeight:600,color:'#6ee7b7'}}>{ins.action}</span>
                      </div>
                    </div>
                    <div style={{fontSize:18,flexShrink:0}}>{ins.sev}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab==='aidash'    && <AIOverviewTab/>}
          {activeTab==='simulator' && <SimulatorTab/>}
          {activeTab==='budget'    && <BudgetTab/>}
        </div>
      </div>
    </div>
  );
}

// ─── AI Overview Tab ─────────────────────────────────────────────────────────
function AIOverviewTab() {
  const COMMUNITY_POLL = [
    { name:'Hindu OBC',          rate:62.6, color:'#f59e0b' },
    { name:'Hindu OC (Bunt)',    rate:61.1, color:'#f59e0b' },
    { name:'Hindu Brahmin (GSB)',rate:60.3, color:'#fbbf24' },
    { name:'Christian',          rate:53.4, color:'#60a5fa' },
    { name:'Muslim',             rate:50.1, color:'#f87171' },
  ];
  const COMMUNITY_PIE = [
    { name:'Hindu OBC', val:33.8, color:'#f59e0b' },
    { name:'Muslim',    val:18.9, color:'#34d399' },
    { name:'Christian', val:14.9, color:'#60a5fa' },
    { name:'Hindu GSB', val:8.4,  color:'#fbbf24' },
    { name:'Hindu OC',  val:6.5,  color:'#a78bfa' },
    { name:'Others',    val:17.5, color:'#475569' },
  ];
  const AGE_DATA = [
    { ag:'18–25', rate:'61.3%', polled:'13,357', type:'ok'   },
    { ag:'26–35', rate:'49.5%', polled:'21,484', type:'bad'  },
    { ag:'36–45', rate:'54.4%', polled:'25,305', type:'ok'   },
    { ag:'46–55', rate:'63.5%', polled:'30,378', type:'good' },
    { ag:'56–65', rate:'66.3%', polled:'26,702', type:'good' },
    { ag:'65+',   rate:'51.4%', polled:'23,184', type:'ok'   },
  ];
  const CRITICAL_WARDS = [
    { n:'Mannagudda',    cls:'BJP Stronghold',    poll:54.8, H:93.7, M:1.1,  C:5.2,  bjp:93.7, margin:'+87.4', sir:'Critical' },
    { n:'Derebail South',cls:'BJP Stronghold',    poll:58.1, H:80.1, M:2.5,  C:17.4, bjp:80.1, margin:'+60.2', sir:'Critical' },
    { n:'Kadri North',   cls:'BJP Stronghold',    poll:54.5, H:86.8, M:0.7,  C:12.5, bjp:86.8, margin:'+73.6', sir:'High'     },
    { n:'Dongarakeri',   cls:'BJP Stronghold',    poll:58.4, H:86.2, M:12.0, C:1.8,  bjp:86.2, margin:'+72.4', sir:'High'     },
    { n:'Kambala',       cls:'BJP Stronghold',    poll:57.9, H:92.6, M:1.8,  C:5.6,  bjp:92.6, margin:'+85.2', sir:'High'     },
    { n:'Bejai',         cls:'BJP Strong',        poll:58.7, H:68.6, M:4.7,  C:26.7, bjp:68.6, margin:'+37.2', sir:'High'     },
    { n:'Cantonment',    cls:'BJP Strong',        poll:51.2, H:73.8, M:20.7, C:5.5,  bjp:73.8, margin:'+47.6', sir:'High'     },
    { n:'Court',         cls:'Contested',         poll:39.5, H:51.0, M:27.7, C:21.4, bjp:51.0, margin:'+2.0',  sir:'Medium'   },
    { n:'Shivabagh',     cls:'Contested',         poll:50.2, H:52.2, M:11.7, C:36.1, bjp:52.2, margin:'+4.4',  sir:'Medium'   },
    { n:'Padav East',    cls:'BJP Fav.',          poll:46.9, H:60.2, M:3.9,  C:35.9, bjp:60.2, margin:'+20.4', sir:'Medium'   },
  ];
  const sirColor = s => s==='Critical'?'#ef4444':s==='High'?'#f59e0b':'#fbbf24';
  const clsColor = c => c.includes('Stronghold')?'#3b82f6':c.includes('Strong')&&!c.includes('Fav')?'#60a5fa':c.includes('Fav')?'#4ade80':'#94a3b8';

  // Build SVG donut
  const buildDonut = (slices) => {
    let start = 0;
    return slices.map(s => {
      const pct = s.val / 100;
      const large = pct > 0.5 ? 1 : 0;
      const x1 = 50 + 42*Math.cos(2*Math.PI*start - Math.PI/2);
      const y1 = 50 + 42*Math.sin(2*Math.PI*start - Math.PI/2);
      start += pct;
      const x2 = 50 + 42*Math.cos(2*Math.PI*start - Math.PI/2);
      const y2 = 50 + 42*Math.sin(2*Math.PI*start - Math.PI/2);
      return { d:`M50,50 L${x1.toFixed(2)},${y1.toFixed(2)} A42,42 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`, color:s.color, name:s.name, val:s.val };
    });
  };
  const donutSlices = buildDonut(COMMUNITY_PIE);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[
          {l:'Total Registered Voters', v:'2,51,998',  c:'#60a5fa', sub:'Current voter list'},
          {l:'Avg Poll Rate (2023)',     v:'58.3%',     c:'#e2e8f0', sub:'Constituency average'},
          {l:'Polled (2023)',            v:'1,41,707',  c:'#4ade80', sub:'Actually voted'},
          {l:'Non-Polled Voters',       v:'1,05,253',  c:'#f87171', sub:"Didn't vote — target pool"},
          {l:'BJP Stronghold Wards',    v:'8',          c:'#e2e8f0', sub:'BJP proj >80%'},
          {l:'SIR Critical Wards',      v:'2',          c:'#f87171', sub:'Immediate action needed'},
        ].map(k => (
          <div key={k.l} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'12px 14px'}}>
            <div style={{fontSize:10,color:'#64748b',marginBottom:4}}>{k.l}</div>
            <div style={{fontSize:22,fontWeight:600,color:k.c,lineHeight:1}}>{k.v}</div>
            <div style={{fontSize:10,color:'#64748b',marginTop:3}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Pie + community poll rate */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:10}}>Community Composition (classified voters)</div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <svg viewBox="0 0 100 100" width={120} height={120} style={{flexShrink:0}}>
              {donutSlices.map((s,i) => <path key={i} d={s.d} fill={s.color} stroke="#080d1a" strokeWidth="1.5"/>)}
              <circle cx="50" cy="50" r="24" fill="#080d1a"/>
              <text x="50" y="48" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="600">38</text>
              <text x="50" y="57" textAnchor="middle" fill="#64748b" fontSize="6">wards</text>
            </svg>
            <div style={{display:'flex',flexDirection:'column',gap:5,flex:1}}>
              {COMMUNITY_PIE.map(c => (
                <div key={c.name} style={{display:'flex',alignItems:'center',gap:6,fontSize:10,color:'#94a3b8'}}>
                  <span style={{width:8,height:8,borderRadius:'50%',background:c.color,flexShrink:0,display:'inline-block'}}/>
                  <span style={{flex:1}}>{c.name}</span>
                  <span style={{fontWeight:700,color:'#e2e8f0'}}>{c.val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:12}}>Polling Rate by Community (2023 actual)</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {COMMUNITY_POLL.map(c => (
              <div key={c.name}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#cbd5e1',marginBottom:4}}>
                  <span>{c.name}</span>
                  <span style={{fontWeight:700,color:c.rate>=60?'#4ade80':c.rate>=55?'#fbbf24':'#f87171'}}>{c.rate}%</span>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${c.rate}%`,background:c.color,borderRadius:3,transition:'width 0.5s'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Age grid + Gender */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:10}}>Polling Rate by Age Group (2023)</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {AGE_DATA.map(a => (
              <div key={a.ag} style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'8px',textAlign:'center'}}>
                <div style={{fontSize:10,color:'#64748b'}}>{a.ag}</div>
                <div style={{fontSize:16,fontWeight:600,margin:'3px 0',color:a.type==='bad'?'#f87171':a.type==='good'?'#4ade80':'#e2e8f0'}}>{a.rate}</div>
                <div style={{fontSize:9,color:'#64748b'}}>{a.polled}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:'#f87171',marginTop:8}}>⚠ Highest gap: 26–35 age group — 50,500 non-pollers</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:10}}>Gender Polling Analysis</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginBottom:12}}>
            <thead><tr>{['Gender','Polled','Not Polled','Rate'].map(h=>(
              <th key={h} style={{textAlign:'left',padding:'6px 8px',fontSize:10,color:'#64748b',borderBottom:'1px solid rgba(255,255,255,0.08)',fontWeight:600}}>{h}</th>
            ))}</tr></thead>
            <tbody>
              <tr>
                <td style={{padding:'7px 8px',color:'#f0abfc'}}>Female</td>
                <td style={{padding:'7px 8px',color:'#e2e8f0'}}>74,380</td>
                <td style={{padding:'7px 8px',color:'#64748b'}}>52,604</td>
                <td style={{padding:'7px 8px',fontWeight:700,color:'#4ade80'}}>58.6%</td>
              </tr>
              <tr>
                <td style={{padding:'7px 8px',color:'#93c5fd'}}>Male</td>
                <td style={{padding:'7px 8px',color:'#e2e8f0'}}>67,316</td>
                <td style={{padding:'7px 8px',color:'#64748b'}}>52,649</td>
                <td style={{padding:'7px 8px',fontWeight:700,color:'#f59e0b'}}>56.1%</td>
              </tr>
              <tr><td colSpan={4} style={{padding:'8px',fontSize:10,color:'#64748b',fontStyle:'italic'}}>Female lead +2.5% — a key swing lever</td></tr>
            </tbody>
          </table>
          <div style={{fontSize:10,fontWeight:600,color:'#94a3b8',marginBottom:6}}>Historical Poll Rate Trend</div>
          {[{y:'2013',r:72},{y:'2014',r:68},{y:'2018',r:65},{y:'2019',r:73},{y:'2023',r:58}].map(t=>(
            <div key={t.y} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <span style={{fontSize:9,color:'#64748b',width:30}}>{t.y}</span>
              <div style={{flex:1,height:6,background:'rgba(255,255,255,0.06)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(t.r/80)*100}%`,background:t.r>=70?'#4ade80':t.r>=65?'#60a5fa':'#f87171',borderRadius:3}}/>
              </div>
              <span style={{fontSize:9,fontWeight:700,color:'#94a3b8',width:28}}>{t.r}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Critical wards table */}
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
        <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:10}}>Top 10 Critical Wards Requiring Immediate Attention</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr>{['#','Ward','Classification','Poll Rate','Hindu%','Muslim%','Christian%','BJP Proj','Margin','SIR Status'].map(h=>(
              <th key={h} style={{textAlign:'left',padding:'7px 10px',fontSize:10,color:'#64748b',borderBottom:'1px solid rgba(255,255,255,0.08)',fontWeight:600,whiteSpace:'nowrap'}}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {CRITICAL_WARDS.map((w,i)=>(
                <tr key={w.n} style={{background:i%2===0?'transparent':'rgba(255,255,255,0.02)'}}>
                  <td style={{padding:'6px 10px',color:'#64748b',fontWeight:700}}>{i+1}</td>
                  <td style={{padding:'6px 10px',color:'#e2e8f0',fontWeight:600,whiteSpace:'nowrap'}}>{w.n}</td>
                  <td style={{padding:'6px 10px'}}>
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:4,background:clsColor(w.cls)+'22',color:clsColor(w.cls)}}>{w.cls}</span>
                  </td>
                  <td style={{padding:'6px 10px',fontWeight:700,color:w.poll<55?'#f87171':w.poll<60?'#f59e0b':'#4ade80'}}>{w.poll}%</td>
                  <td style={{padding:'6px 10px',color:'#fbbf24'}}>{w.H}</td>
                  <td style={{padding:'6px 10px',color:'#34d399'}}>{w.M}</td>
                  <td style={{padding:'6px 10px',color:'#60a5fa'}}>{w.C}</td>
                  <td style={{padding:'6px 10px',color:'#e2e8f0',fontWeight:700}}>{w.bjp}%</td>
                  <td style={{padding:'6px 10px',color:'#4ade80',fontWeight:700}}>{w.margin}</td>
                  <td style={{padding:'6px 10px'}}>
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:4,background:sirColor(w.sir)+'22',color:sirColor(w.sir)}}>{w.sir}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Simulator Tab ───────────────────────────────────────────────────────────
function SimulatorTab() {
  const W = [
    {n:'Mannagudda',    H:93.7,M:1.1, C:5.2, e:8102},  {n:'Kambala',       H:92.6,M:1.8, C:5.6, e:4517},
    {n:'Central',       H:90.4,M:7.6, C:2.0, e:4882},  {n:'Boloor',        H:87.5,M:1.2, C:11.3,e:6618},
    {n:'Kadri North',   H:86.8,M:0.7, C:12.5,e:6433},  {n:'Dongarakeri',   H:86.2,M:12.0,C:1.8, e:7664},
    {n:'Padav West',    H:84.1,M:1.0, C:14.8,e:7542},  {n:'Derebail South',H:80.1,M:2.5, C:17.4,e:4767},
    {n:'Kodialbail',    H:80.9,M:1.2, C:17.9,e:7871},  {n:'Derebail West', H:85.1,M:0.8, C:14.1,e:7314},
    {n:'Derebail SW',   H:87.9,M:0.6, C:11.5,e:7801},  {n:'Bejai',         H:68.6,M:4.7, C:26.7,e:7246},
    {n:'Cantonment',    H:73.8,M:20.7,C:5.5, e:4095},  {n:'Padav Central', H:68.3,M:4.6, C:27.1,e:8462},
    {n:'Maroli',        H:68.7,M:0.8, C:30.5,e:6718},  {n:'Jappimogar',    H:71.6,M:7.4, C:20.9,e:7266},
    {n:'Kankanady',     H:76.1,M:10.8,C:13.1,e:7527},  {n:'Alape South',   H:76.1,M:8.9, C:15.0,e:6284},
    {n:'Alape North',   H:68.5,M:1.4, C:30.0,e:7200},  {n:'Hoige Bazar',   H:65.1,M:30.1,C:4.8, e:4320},
    {n:'Bolar',         H:71.8,M:19.6,C:8.6, e:7107},  {n:'Padav East',    H:60.2,M:3.9, C:35.9,e:4471},
    {n:'Kadri South',   H:63.9,M:5.3, C:30.8,e:5843},  {n:'Athavara',      H:62.9,M:24.0,C:13.1,e:7856},
    {n:'Mangaladevi',   H:62.8,M:26.8,C:10.5,e:5358},  {n:'Court',         H:51.0,M:27.7,C:21.4,e:5980},
    {n:'Shivabagh',     H:52.2,M:11.7,C:36.1,e:6294},  {n:'Jeppu',         H:52.4,M:18.7,C:29.0,e:7711},
    {n:'Valencia',      H:53.6,M:11.5,C:34.9,e:5090},  {n:'Bajal',         H:47.8,M:45.2,C:7.1, e:7805},
    {n:'Port',          H:47.6,M:40.9,C:11.4,e:7153},  {n:'Bendoor',       H:32.2,M:25.2,C:42.6,e:6296},
    {n:'Bengre',        H:30.9,M:68.3,C:0.8, e:10897}, {n:'Kudroli',       H:28.8,M:68.2,C:3.0, e:5765},
    {n:'Bunder',        H:34.6,M:65.1,C:0.3, e:5871},  {n:'Falnir',        H:32.1,M:9.2, C:58.7,e:6526},
    {n:'Kannur',        H:40.1,M:56.9,C:3.0, e:7045},  {n:'Milagress',     H:43.5,M:34.8,C:21.8,e:7210},
  ];
  const [sel, setSel] = React.useState(()=>new Set(W.map(w=>w.n)));
  const [hr, setHr] = React.useState(62);
  const [mr, setMr] = React.useState(50);
  const [cr, setCr] = React.useState(53);
  const [hb, setHb] = React.useState(92);
  const [mb, setMb] = React.useState(6);
  const [cb, setCb] = React.useState(30);

  const sw = W.filter(w=>sel.has(w.n));
  const res = React.useMemo(()=>{
    let bjp=0,inc=0,p=0,t=0;
    sw.forEach(w=>{
      const hv=w.e*(w.H/100),mv=w.e*(w.M/100),cv=w.e*(w.C/100);
      const hp=hv*(hr/100),mp=mv*(mr/100),cp=cv*(cr/100);
      bjp+=hp*(hb/100)+mp*(mb/100)+cp*(cb/100);
      inc+=hp*(1-hb/100)+mp*(1-mb/100)+cp*(1-cb/100);
      p+=hp+mp+cp; t+=w.e;
    });
    const tot=bjp+inc;
    const bp=tot>0?bjp/tot*100:50;
    return {bjp,inc,bp,ip:100-bp,margin:bjp-inc,t,p};
  },[sel,hr,mr,cr,hb,mb,cb]);

  const verdict = res.bp>55?{t:'BJP comfortable win',c:'#4ade80'}
                : res.bp>51?{t:'BJP narrow win',c:'#60a5fa'}
                : res.bp>49?{t:'Too close to call',c:'#fbbf24'}
                : res.bp>45?{t:'INC narrow win',c:'#f59e0b'}
                :            {t:'INC comfortable win',c:'#f87171'};

  const Sl = ({lbl,val,min,max,color,set}) => (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
        <span style={{color:'#94a3b8'}}>{lbl}</span>
        <span style={{fontWeight:700,color}}>{val}%</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={val} onChange={e=>set(+e.target.value)} style={{width:'100%',accentColor:color}}/>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{fontSize:11,color:'#64748b'}}>Select wards, adjust community polling rates and partisan lean to predict election outcomes.</div>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
        <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:8}}>Step 1 — Select Wards</div>
        <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
          {[['All',()=>setSel(new Set(W.map(w=>w.n)))],['Clear',()=>setSel(new Set())],
            ['Risk wards',()=>setSel(new Set(['Mannagudda','Derebail South','Kadri North','Dongarakeri','Kambala','Bejai','Cantonment','Court','Shivabagh','Jeppu','Padav East','Central','Boloor','Padav West','Valencia','Bendoor','Bengre']))],
          ].map(([l,fn])=>(
            <button key={l} onClick={fn} style={{fontSize:10,padding:'4px 10px',borderRadius:6,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.05)',color:'#cbd5e1',cursor:'pointer'}}>{l}</button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:3,maxHeight:140,overflowY:'auto',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:8}}>
          {W.map(w=>(
            <label key={w.n} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:sel.has(w.n)?'#e2e8f0':'#475569',cursor:'pointer'}}>
              <input type="checkbox" checked={sel.has(w.n)} onChange={e=>{const s=new Set(sel);e.target.checked?s.add(w.n):s.delete(w.n);setSel(s);}}/>{w.n}
            </label>
          ))}
        </div>
        <div style={{fontSize:10,color:'#64748b',marginTop:6}}>{sel.size} wards · {sw.reduce((a,w)=>a+w.e,0).toLocaleString()} total voters</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:12}}>Step 2 — Community Poll Rates (%)</div>
          <Sl lbl="Hindu (all)" val={hr} min={30} max={95} color="#f59e0b" set={setHr}/>
          <Sl lbl="Muslim" val={mr} min={20} max={90} color="#34d399" set={setMr}/>
          <Sl lbl="Christian" val={cr} min={20} max={90} color="#60a5fa" set={setCr}/>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:12}}>Step 3 — Partisan Vote Lean</div>
          <Sl lbl="% Hindu → BJP" val={hb} min={60} max={99} color="#f59e0b" set={setHb}/>
          <Sl lbl="% Muslim → BJP" val={mb} min={1} max={30} color="#34d399" set={setMb}/>
          <Sl lbl="% Christian → BJP" val={cb} min={10} max={60} color="#60a5fa" set={setCb}/>
        </div>
      </div>
      <div style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${verdict.c}44`,borderRadius:12,padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>Predicted Outcome</div>
          <span style={{fontSize:11,fontWeight:800,padding:'4px 12px',borderRadius:6,background:verdict.c+'20',color:verdict.c}}>{verdict.t}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
          <div><div style={{fontSize:10,color:'#64748b',marginBottom:3}}>BJP projected votes</div>
            <div style={{fontSize:26,fontWeight:700,color:'#60a5fa'}}>{Math.round(res.bjp).toLocaleString()}</div>
            <div style={{fontSize:11,color:'#64748b'}}>{res.bp.toFixed(1)}% of valid votes</div>
          </div>
          <div><div style={{fontSize:10,color:'#64748b',marginBottom:3}}>INC projected votes</div>
            <div style={{fontSize:26,fontWeight:700,color:'#f87171'}}>{Math.round(res.inc).toLocaleString()}</div>
            <div style={{fontSize:11,color:'#64748b'}}>{res.ip.toFixed(1)}% of valid votes</div>
          </div>
        </div>
        <div style={{height:28,borderRadius:6,background:'rgba(255,255,255,0.06)',position:'relative',overflow:'hidden',marginBottom:12}}>
          <div style={{position:'absolute',left:0,top:0,height:'100%',width:`${res.bp}%`,background:'linear-gradient(90deg,#1e40af,#3b82f6)',transition:'width 0.4s'}}/>
          <div style={{position:'absolute',right:0,top:0,height:'100%',width:`${res.ip}%`,background:'linear-gradient(90deg,#991b1b,#dc2626)',transition:'width 0.4s'}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[{l:'Total voters',v:res.t.toLocaleString()},{l:'Est. polled',v:Math.round(res.p).toLocaleString()},{l:'Margin',v:`${res.margin>0?'+':''}${Math.round(res.margin).toLocaleString()}`}].map(k=>(
            <div key={k.l} style={{textAlign:'center',padding:'8px',background:'rgba(255,255,255,0.03)',borderRadius:8}}>
              <div style={{fontSize:9,color:'#64748b'}}>{k.l}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Budget Tab ───────────────────────────────────────────────────────────────
function BudgetTab() {
  const [booths, setBooths] = React.useState(249);
  const [days,   setDays]   = React.useState(30);
  const [wpb,    setWpb]    = React.useState(4);
  const [da,     setDa]     = React.useState(600);
  const [veh,    setVeh]    = React.useState(50);
  const c1=booths*wpb*days*da, c2=booths*1200*2, c3=100000+days*3000,
        c4=booths*500, c5=veh*2500+booths*150, c6=booths*800*days*0.1;
  const sub=c1+c2+c3+c4+c5+c6, c7=sub*0.1, total=sub+c7;
  const inr = v => '₹'+Math.round(v).toLocaleString('en-IN');
  const Sl = ({lbl,val,min,max,step,set}) => (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
        <span style={{color:'#94a3b8'}}>{lbl}</span>
        <span style={{fontWeight:700,color:'#fbbf24'}}>{val>=1000?'₹'+val.toLocaleString('en-IN'):val}</span>
      </div>
      <input type="range" min={min} max={max} step={step||1} value={val} onChange={e=>set(+e.target.value)} style={{width:'100%',accentColor:'#f59e0b'}}/>
    </div>
  );
  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:12}}>Adjust Parameters</div>
          <Sl lbl="Active booths targeted" val={booths} min={50} max={249} set={setBooths}/>
          <Sl lbl="Campaign days (field)" val={days} min={7} max={90} set={setDays}/>
          <Sl lbl="Workers per booth" val={wpb} min={1} max={10} set={setWpb}/>
          <Sl lbl="Daily worker allowance (₹)" val={da} min={200} max={2000} step={50} set={setDa}/>
          <Sl lbl="Vehicles for polling day" val={veh} min={10} max={200} step={5} set={setVeh}/>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:12}}>Budget Breakdown</div>
          {[['Worker field allowances',c1],['Print (pamphlets, banners, flags)',c2],['Digital / SMS / WhatsApp',c3],['Community events & meetings',c4],['Polling day logistics',c5],['SIR / BLO support',c6],['Contingency (10%)',c7]].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:11}}>
              <span style={{color:'#94a3b8'}}>{l}</span><span style={{fontWeight:700,color:'#e2e8f0'}}>{inr(v)}</span>
            </div>
          ))}
          <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0 0',fontSize:14,fontWeight:700}}>
            <span style={{color:'#e2e8f0'}}>Total Budget</span><span style={{color:'#4ade80'}}>{inr(total)}</span>
          </div>
        </div>
      </div>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:14}}>
        <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:10}}>Priority ROI — Highest Polling Lift per ₹1L Spent</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr>{['Rank','Activity','Target','Vote Gain/₹1L','Priority'].map(h=>(
            <th key={h} style={{textAlign:'left',padding:'6px 10px',fontSize:10,color:'#64748b',borderBottom:'1px solid rgba(255,255,255,0.08)',fontWeight:600}}>{h}</th>
          ))}</tr></thead>
          <tbody>{[
            {r:1,a:'Polling-day transport',t:'65+, women','g':'~180–250',p:'Highest',c:'#ef4444'},
            {r:2,a:'Door-to-door mobilisation',t:'26–35 non-pollers','g':'~120–180',p:'High',c:'#f59e0b'},
            {r:3,a:'WhatsApp / SMS blasts',t:'18–35 smartphone users','g':'~80–120',p:'High',c:'#f59e0b'},
            {r:4,a:'Community leader engagement',t:'OBC / GSB associations','g':'~60–100',p:'Medium',c:'#fbbf24'},
            {r:5,a:'Pamphlets + cable ads',t:'General awareness','g':'~20–50',p:'Low',c:'#64748b'},
          ].map(row=>(
            <tr key={row.r} style={{background:row.r%2===0?'rgba(255,255,255,0.015)':'transparent'}}>
              <td style={{padding:'6px 10px',color:'#64748b',fontWeight:700}}>{row.r}</td>
              <td style={{padding:'6px 10px',color:'#e2e8f0'}}>{row.a}</td>
              <td style={{padding:'6px 10px',color:'#94a3b8'}}>{row.t}</td>
              <td style={{padding:'6px 10px',color:'#4ade80',fontWeight:600}}>{row.g} votes</td>
              <td style={{padding:'6px 10px'}}><span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:4,background:row.c+'20',color:row.c}}>{row.p}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}



// ─── Main page ────────────────────────────────────────────────────────────────
export default function BJPStrategy() {
  return (
    <>
      <Navbar />
      <PoliticalIntelligenceHub />
    </>
  );
}