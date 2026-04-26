import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Target, AlertOctagon,
  LayoutGrid, BarChart2, PieChart,
  Users, UserCheck,
  Zap, Minus, AlertCircle, XCircle,
  ChevronRight, X,
  TrendingUp, MapPin, Activity, CheckSquare,
  Crosshair, RefreshCw, Smartphone, Building2,
} from 'lucide-react';
import Navbar from '../components/Navbar';

// ─── Ward Data (all 38 wards) ──────────────────────────────────────────────────
const wardData = [
  { ward: 'ATTAVARA', voters: 6626, bjp: 2279, cong: 1907, bjpPct: 54.29, congPct: 44.35, lead: 9.94, cat: 'NARROW', ps: 'STRONG', winner: 'BJP', turnout: 64.23 },
  { ward: 'ALAPE SOUTH', voters: 5712, bjp: 2746, cong: 1194, bjpPct: 67.05, congPct: 31.02, lead: 36.03, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 69.99 },
  { ward: 'ALAPE NORTH', voters: 7133, bjp: 2739, cong: 1952, bjpPct: 57.13, congPct: 41.39, lead: 15.74, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 67.10 },
  { ward: 'BAJAL', voters: 8173, bjp: 2406, cong: 3162, bjpPct: 44.54, congPct: 52.93, lead: -11.36, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 69.53 },
  { ward: 'BEJAI', voters: 7216, bjp: 2652, cong: 1690, bjpPct: 59.44, congPct: 38.33, lead: 21.11, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 61.49 },
  { ward: 'BENDOOR', voters: 5932, bjp: 999, cong: 2306, bjpPct: 29.40, congPct: 68.82, lead: -39.41, cat: 'LOST', ps: 'AVG', winner: 'CONGRESS', turnout: 56.89 },
  { ward: 'BENGRE', voters: 10686, bjp: 2693, cong: 4694, bjpPct: 36.37, congPct: 61.32, lead: -24.96, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 71.56 },
  { ward: 'BOLAR', voters: 6289, bjp: 2642, cong: 1460, bjpPct: 62.42, congPct: 36.21, lead: 26.21, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 65.41 },
  { ward: 'BOLOOR', voters: 5050, bjp: 2575, cong: 946, bjpPct: 71.31, congPct: 26.88, lead: 44.43, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 72.98 },
  { ward: 'BUNDER', voters: 5630, bjp: 1150, cong: 2329, bjpPct: 36.06, congPct: 61.71, lead: -25.65, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 63.30 },
  { ward: 'CENTRAL', voters: 4808, bjp: 2426, cong: 538, bjpPct: 78.22, congPct: 19.61, lead: 58.61, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 62.86 },
  { ward: 'CONTONMENT', voters: 5070, bjp: 1917, cong: 1112, bjpPct: 63.82, congPct: 34.71, lead: 29.11, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 60.11 },
  { ward: 'COURT', voters: 4766, bjp: 986, cong: 1313, bjpPct: 43.76, congPct: 54.80, lead: -11.03, cat: 'LOST', ps: 'AVG', winner: 'CONGRESS', turnout: 48.76 },
  { ward: 'DEREBAIL NAIRUTHYA', voters: 8457, bjp: 3946, cong: 1429, bjpPct: 71.76, congPct: 26.32, lead: 45.44, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 64.47 },
  { ward: 'DEREBAIL SOUTH', voters: 7504, bjp: 2923, cong: 1546, bjpPct: 64.63, congPct: 32.98, lead: 31.64, cat: 'MEDIUM', ps: 'AVG', winner: 'BJP', turnout: 59.98 },
  { ward: 'DEREBAIL WEST', voters: 6198, bjp: 2769, cong: 1370, bjpPct: 65.97, congPct: 32.31, lead: 33.66, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 67.36 },
  { ward: 'DONGARAKERY', voters: 7613, bjp: 3555, cong: 1068, bjpPct: 71.26, congPct: 26.82, lead: 44.44, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 62.20 },
  { ward: 'FALNIR', voters: 6373, bjp: 1116, cong: 2452, bjpPct: 32.07, congPct: 66.12, lead: -34.04, cat: 'LOST', ps: 'AVG', winner: 'CONGRESS', turnout: 58.84 },
  { ward: 'HOIGE BAZAR', voters: 5937, bjp: 2200, cong: 1583, bjpPct: 58.16, congPct: 40.69, lead: 17.47, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 65.03 },
  { ward: 'JEPPINAMOGAR', voters: 7227, bjp: 3038, cong: 1856, bjpPct: 60.47, congPct: 38.09, lead: 22.38, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 69.29 },
  { ward: 'JEPPU', voters: 7458, bjp: 2075, cong: 2362, bjpPct: 44.83, congPct: 52.90, lead: -8.07, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 60.31 },
  { ward: 'KADRI NORTH', voters: 6796, bjp: 3196, cong: 1165, bjpPct: 71.97, congPct: 26.13, lead: 45.84, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 65.50 },
  { ward: 'KADRI SOUTH', voters: 5183, bjp: 1851, cong: 1234, bjpPct: 59.17, congPct: 38.91, lead: 20.26, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 61.19 },
  { ward: 'KANKANADY', voters: 7452, bjp: 3289, cong: 1959, bjpPct: 61.71, congPct: 36.51, lead: 25.19, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 71.52 },
  { ward: 'KAMBALA', voters: 5471, bjp: 2768, cong: 573, bjpPct: 80.08, congPct: 17.58, lead: 62.49, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 62.06 },
  { ward: 'KANNUR', voters: 6929, bjp: 1807, cong: 2768, bjpPct: 40.63, congPct: 57.02, lead: -16.39, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 67.78 },
  { ward: 'KODIALBAIL', voters: 5908, bjp: 2543, cong: 1188, bjpPct: 66.41, congPct: 31.64, lead: 34.77, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 65.12 },
  { ward: 'KUDROLI', voters: 5552, bjp: 1024, cong: 2669, bjpPct: 28.95, congPct: 70.17, lead: -41.21, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 67.22 },
  { ward: 'MANGALADEVI', voters: 6107, bjp: 2180, cong: 1722, bjpPct: 54.08, congPct: 44.33, lead: 9.75, cat: 'NARROW', ps: 'STRONG', winner: 'BJP', turnout: 65.08 },
  { ward: 'MANNAGUDDA', voters: 7740, bjp: 3839, cong: 889, bjpPct: 79.25, congPct: 18.71, lead: 60.54, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 61.75 },
  { ward: 'MAROLI', voters: 6847, bjp: 2864, cong: 1597, bjpPct: 62.02, congPct: 36.42, lead: 25.60, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 64.84 },
  { ward: 'MILAGRESS', voters: 6738, bjp: 1467, cong: 2200, bjpPct: 38.13, congPct: 60.08, lead: -21.95, cat: 'LOST', ps: 'AVG', winner: 'CONGRESS', turnout: 55.36 },
  { ward: 'PADAV CENTRAL', voters: 9255, bjp: 3799, cong: 2498, bjpPct: 59.01, congPct: 39.54, lead: 19.47, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 68.85 },
  { ward: 'PADAV EAST', voters: 4204, bjp: 1388, cong: 1247, bjpPct: 52.50, congPct: 44.98, lead: 7.53, cat: 'NARROW', ps: 'STRONG', winner: 'BJP', turnout: 64.98 },
  { ward: 'PADAV WEST', voters: 7450, bjp: 3668, cong: 1496, bjpPct: 69.80, congPct: 28.26, lead: 41.53, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 70.94 },
  { ward: 'PORT', voters: 4295, bjp: 1254, cong: 1557, bjpPct: 44.71, congPct: 53.96, lead: -9.25, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 66.15 },
  { ward: 'SHIVABAGH', voters: 4751, bjp: 1400, cong: 1486, bjpPct: 46.74, congPct: 51.56, lead: -4.83, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 62.38 },
  { ward: 'VALENCIA', voters: 6416, bjp: 1829, cong: 1934, bjpPct: 44.64, congPct: 53.49, lead: -8.85, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 60.10 },
];

const muslimBooths = [
  { ward: 'BENGRE', booth: 99, voters: 1399, muslimPct: 99.9, bjpPct: 5.3, congPct: 91.8, risk: 'Unwinnable' },
  { ward: 'BENGRE', booth: 97, voters: 777, muslimPct: 100, bjpPct: 4.6, congPct: 92.5, risk: 'Unwinnable' },
  { ward: 'BENGRE', booth: 100, voters: 1285, muslimPct: 100, bjpPct: 7.9, congPct: 87.8, risk: 'Unwinnable' },
  { ward: 'BENGRE', booth: 98, voters: 1230, muslimPct: 100, bjpPct: 12.2, congPct: 84.6, risk: 'Unwinnable' },
  { ward: 'BUNDER', booth: 119, voters: 1080, muslimPct: 99.6, bjpPct: 0.9, congPct: 95.9, risk: 'Unwinnable' },
  { ward: 'BUNDER', booth: 118, voters: 883, muslimPct: 86.8, bjpPct: 17.2, congPct: 81.4, risk: 'Very High' },
  { ward: 'BUNDER', booth: 112, voters: 628, muslimPct: 58.1, bjpPct: 87.3, congPct: 10.8, risk: 'High' },
  { ward: 'COURT', booth: 142, voters: 1160, muslimPct: 56.4, bjpPct: 23.6, congPct: 75.7, risk: 'High' },
  { ward: 'DONGARAKERI', booth: 111, voters: 731, muslimPct: 58.1, bjpPct: 31.3, congPct: 67.9, risk: 'High' },
  { ward: 'DONGARAKERI', booth: 108, voters: 1257, muslimPct: 55.3, bjpPct: 85.3, congPct: 12.6, risk: 'High' },
  { ward: 'JEPPU', booth: 241, voters: 1070, muslimPct: 55.5, bjpPct: 30.2, congPct: 68.3, risk: 'High' },
  { ward: 'KANNUR', booth: 199, voters: 737, muslimPct: 92.7, bjpPct: 6.3, congPct: 91.0, risk: 'Unwinnable' },
  { ward: 'KANNUR', booth: 196, voters: 1546, muslimPct: 94.9, bjpPct: 5.8, congPct: 92.6, risk: 'Unwinnable' },
  { ward: 'KUDROLI', booth: 105, voters: 1120, muslimPct: 79.7, bjpPct: 19.3, congPct: 80.1, risk: 'Very High' },
  { ward: 'MILAGRESS', booth: 165, voters: 1271, muslimPct: 51.7, bjpPct: 30.5, congPct: 67.2, risk: 'High' },
];

const christianBooths = [
  { ward: 'FALNIR', booth: 158, voters: 515, christianPct: 96.1, bjpPct: 12.5, congPct: 85.7, risk: 'Unwinnable' },
  { ward: 'JEPPINAMOGAR', booth: 244, voters: 752, christianPct: 96.0, bjpPct: 14.7, congPct: 85.1, risk: 'Unwinnable' },
  { ward: 'BENDOOR', booth: 129, voters: 922, christianPct: 53.7, bjpPct: 32.3, congPct: 65.9, risk: 'Very High' },
  { ward: 'BENDOOR', booth: 167, voters: 836, christianPct: 45.4, bjpPct: 24.1, congPct: 74.6, risk: 'Very High' },
  { ward: 'BENDOOR', booth: 136, voters: 1154, christianPct: 46.7, bjpPct: 40.0, congPct: 58.5, risk: 'High' },
  { ward: 'PADAV CENTRAL', booth: 41, voters: 1319, christianPct: 56.4, bjpPct: 34.7, congPct: 63.8, risk: 'Very High' },
  { ward: 'JEPPU', booth: 156, voters: 948, christianPct: 38.9, bjpPct: 39.8, congPct: 58.6, risk: 'High' },
  { ward: 'JEPPU', booth: 155, voters: 757, christianPct: 54.3, bjpPct: 47.4, congPct: 45.2, risk: 'High' },
  { ward: 'JEPPU', booth: 154, voters: 785, christianPct: 43.5, bjpPct: 39.5, congPct: 59.3, risk: 'High' },
  { ward: 'KADRI SOUTH', booth: 57, voters: 1386, christianPct: 41.3, bjpPct: 41.6, congPct: 56.8, risk: 'High' },
  { ward: 'SHIVABAGH', booth: 135, voters: 1241, christianPct: 43.3, bjpPct: 46.7, congPct: 52.1, risk: 'High' },
  { ward: 'FALNIR', booth: 168, voters: 874, christianPct: 54.8, bjpPct: 36.5, congPct: 60.9, risk: 'Very High' },
  { ward: 'FALNIR', booth: 169, voters: 673, christianPct: 40.4, bjpPct: 49.3, congPct: 48.1, risk: 'High' },
  { ward: 'VALENCIA', booth: 133, voters: 972, christianPct: 43.4, bjpPct: 23.4, congPct: 73.5, risk: 'Very High' },
  { ward: 'VALENCIA', booth: 174, voters: 1329, christianPct: 31.8, bjpPct: 57.3, congPct: 41.6, risk: 'High' },
  { ward: 'MILAGRESS', booth: 166, voters: 1143, christianPct: 33.3, bjpPct: 29.8, congPct: 68.7, risk: 'High' },
  { ward: 'ALAPE NORTH', booth: 192, voters: 1034, christianPct: 39.8, bjpPct: 49.7, congPct: 48.7, risk: 'High' },
  { ward: 'BEJAI', booth: 21, voters: 896, christianPct: 33.0, bjpPct: 54.3, congPct: 42.4, risk: 'High' },
  { ward: 'BAJAL', booth: 208, voters: 500, christianPct: 31.7, bjpPct: 55.9, congPct: 43.5, risk: 'High' },
  { ward: 'PADAV CENTRAL', booth: 42, voters: 1330, christianPct: 42.0, bjpPct: 49.0, congPct: 49.6, risk: 'High' },
  { ward: 'DEREBAIL WEST', booth: 3, voters: 806, christianPct: 33.0, bjpPct: 58.2, congPct: 40.0, risk: 'High' },
  { ward: 'KODIALBAIL', booth: 24, voters: 980, christianPct: 34.1, bjpPct: 55.3, congPct: 43.3, risk: 'High' },
  { ward: 'MAROLI', booth: 50, voters: 1135, christianPct: 36.0, bjpPct: 60.7, congPct: 37.3, risk: 'High' },
];

// ─── SWOT points ───────────────────────────────────────────────────────────────
const swotPoints = {
  S: {
    title: 'Strengths', subtitle: 'Internal · Positive',
    Icon: ShieldCheck,
    color: '#10b981', glow: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.28)',
    bg: 'rgba(16,185,129,0.05)', badgeBg: 'rgba(16,185,129,0.12)',
    items: [
      { label: 'Dominant Ward Majority — 25/38 Wards Won (65.8%)', stat: '25/38 Wards', statColor: '#10b981', detail: 'BJP won 25 of 38 wards. Congress won only 13. BJP commands majority across all 4 geographic zones — North Derebail, South Padav, Central, and Eastern clusters. Congress wins confined to minority-belt wards.' },
      { label: '8 STRONG Wins — BJP Lead >40% Each Ward', stat: 'Avg Lead 47.8%', statColor: '#10b981', detail: 'Kambala 80.1% (+62.5%) · Mannagudda 79.3% (+60.5%) · Central 78.2% (+58.6%) · Kadri North 72.0% (+45.8%) · Derebail Nairuthya 71.8% (+45.4%) · Dongarakery 71.3% (+44.4%) · Boloor 71.3% (+44.4%) · Padav West 69.8% (+41.5%)' },
      { label: '14 MEDIUM Wins — BJP Lead 15–40%', stat: 'Avg Lead 24.6%', statColor: '#10b981', detail: 'Alape South +36.0% · Derebail West +33.7% · Kodialbail +34.8% · Derebail South +31.6% · Contonment +29.1% · Bolar +26.2% · Kankanady +25.2% · Maroli +25.6% · Jeppinamogar +22.4% · Bejai +21.1% · Kadri South +20.3% · Padav Central +19.5% · Hoige Bazar +17.5% · Alape North +15.7%' },
      { label: 'Strong Booth Infrastructure — 33/38 Polling Stations', stat: '33 Strong PS', statColor: '#10b981', detail: '87% of wards have STRONG polling station status — indicating disciplined party worker presence, booth committees, and voter mobilization networks. Only 5 wards rated AVG: Bendoor, Court, Falnir, Derebail South, Milagress.' },
      { label: 'Hindu-Belt Sweep — Avg 67.2% in Hindu-Dominant Wards', stat: 'Zero Losses', statColor: '#10b981', detail: 'Derebail cluster (4 wards avg 68.3%) · Padav cluster (3 wards avg 65.2%) · Kadri cluster (2 wards avg 67.5%) · Bolar-Boloor corridor (avg 66.9%). BJP lost zero seats in any Hindu-majority ward. Total BJP votes in Hindu belt: ~48,000.' },
      { label: 'High Turnout in Strongholds — 69–73%', stat: 'Top Turnout', statColor: '#10b981', detail: 'Boloor 72.98% (BJP 71.3%) · Padav West 70.94% (BJP 69.8%) · Bengre 71.56% (BJP lost — Congress mobilises too) · Alape South 69.99% (BJP 67.1%) · Kankanady 71.52% (BJP 61.7%). Strong BJP wards sustain above-city-avg turnout of 64.3%.' },
      { label: 'Vote Efficiency — 25 Wards Won on 66,451 Votes', stat: 'Efficient', statColor: '#10b981', detail: 'Congress total: 89,998 votes yet only 13 wards. BJP total: 66,451 votes but 25 wards. Congress surplus of +23,547 votes is concentrated and wasted in minority-heavy wards (Kudroli INC 70.2%, Bendoor 68.8%). BJP vote distribution is geographically efficient.' },
    ],
  },
  W: {
    title: 'Weaknesses', subtitle: 'Internal · Negative',
    Icon: AlertTriangle,
    color: '#f87171', glow: 'rgba(248,113,113,0.18)', border: 'rgba(248,113,113,0.28)',
    bg: 'rgba(248,113,113,0.05)', badgeBg: 'rgba(248,113,113,0.12)',
    items: [
      { label: '13 Wards Lost — Deficits from −4.8% to −41.2%', stat: '13 Lost', statColor: '#f87171', detail: 'Kudroli −41.2% · Bendoor −39.4% · Falnir −34.0% · Bunder −25.7% · Bengre −25.0% · Milagress −22.0% · Kannur −16.4% · Bajal −11.4% · Court −11.0% · Port −9.3% · Valencia −8.9% · Jeppu −8.1% · Shivabagh −4.8%.' },
      { label: 'Zero Traction in Muslim-Majority Areas — Avg BJP ~33%', stat: 'Unwinnable', statColor: '#f87171', detail: 'Kudroli (~55% Muslim): BJP 28.9% · Bengre (~65% Muslim): BJP 36.4% · Bunder (~55% Muslim): BJP 36.1% · Kannur (~60% Muslim): BJP 40.6%. Congress captures 85–95% of Muslim votes. BJP has no structural path to win these wards without demographic change.' },
      { label: 'Christian-Dominant Booths — BJP Below 30%', stat: '4 Booths <30%', statColor: '#f87171', detail: 'Falnir Booth 158 (96% Christian): BJP 12.5% · Jeppinamogar Booth 244 (96% Christian): BJP 14.7% · Bendoor Booth 167 (45% Christian): BJP 24.1% · Valencia Booth 133 (43% Christian): BJP 23.4%. Congress leads by 60–85% in all four booths.' },
      { label: '3 Narrow Wins — High Flip Risk at <10% Lead', stat: 'Flip Risk', statColor: '#f87171', detail: 'Attavara: BJP 54.3% vs INC 44.4% — lead +9.9%, margin only ~415 votes · Mangaladevi: BJP 54.1% vs INC 44.3% — lead +9.8%, margin ~370 votes · Padav East: BJP 52.5% vs INC 45.0% — lead +7.5%, margin ~265 votes. A 5% anti-incumbency swing flips all three.' },
      { label: '5 AVG-Polling Wards — Untapped BJP Votes', stat: '5 Weak Booths', statColor: '#f87171', detail: 'Court: 48.8% turnout (city-lowest), BJP lost by −11.0% (~327 vote deficit). Bendoor: 56.9% turnout, BJP lost −39.4%. Falnir: 58.8% turnout, BJP lost −34.0%. Derebail South: 59.98% turnout (BJP wins but underperforms vs potential). Milagress: AVG status, BJP lost −21.9%.' },
      { label: 'Congress Raw Vote Surplus — +23,547 Votes Over BJP', stat: '+23.5K Surplus', statColor: '#f87171', detail: "Congress total: 89,998 votes · BJP: 66,451 votes. Congress holds 35.4% more raw votes. If ward boundaries are reorganised or reservation rearrangements occur, BJP's current 25-ward advantage becomes structurally fragile." },
    ],
  },
  O: {
    title: 'Opportunities', subtitle: 'External · Positive',
    Icon: Target,
    color: '#22d3ee', glow: 'rgba(34,211,238,0.18)', border: 'rgba(34,211,238,0.28)',
    bg: 'rgba(34,211,238,0.05)', badgeBg: 'rgba(34,211,238,0.12)',
    items: [
      { label: 'Court Ward — Lowest Turnout = +352 Recoverable BJP Votes', stat: '+352 Net Votes', statColor: '#22d3ee', detail: "Court: 48.8% turnout (city lowest, vs avg 64.3%). BJP lost by only ~327 votes. If turnout rises to 65%, ~800 new voters enter. At BJP's 44% share of new votes = +352 net BJP gain → near-certain BJP win. Highest priority flip target." },
      { label: 'JDS Alliance — Could Flip Bajal & Jeppu', stat: '2 Wards Flippable', statColor: '#22d3ee', detail: "Bajal: BJP 44.5% + JDS 1.7% = 46.2% (INC 52.9%, gap narrows to 6.7%) · Jeppu: BJP 44.8% + JDS 0.3% = 45.1% (INC 52.9%, gap 7.8%). JDS alliance alone isn't sufficient but combined with Hindu voter mobilisation makes both wards winnable." },
      { label: 'Shivabagh — 183-Vote Swing Needed to Flip', stat: '183 Votes Gap', statColor: '#22d3ee', detail: 'Shivabagh: INC 51.6% vs BJP 46.7% — margin just 4.8%, total voters 3,808 → only ~183 vote swing needed. Ward has significant Hindu population. With targeted outreach to 500 uncommitted Hindu voters (65% conversion), BJP flips this seat.' },
      { label: 'Derebail South Turnout Push — +242 Potential BJP Votes', stat: '+242 Net Votes', statColor: '#22d3ee', detail: "BJP wins Derebail South at 64.6% but AVG polling = 59.98% turnout vs 64.3% city avg. Ward has 7,504 registered voters. Raising turnout to 65% adds ~375 voters. At BJP's 64.6% share → +242 net BJP votes, converting AVG → STRONG polling status." },
      { label: 'Youth Voter Drive in 3 Narrow Wards', stat: '+120 Votes/Ward', statColor: '#22d3ee', detail: "Attavara (BJP +9.9%, 6,626 voters) · Mangaladevi (+9.8%) · Padav East (+7.5%) — all have estimated 15–20% Hindu youth non-participation. Every 1% turnout gain = ~60–70 new voters. At BJP's avg Hindu ward share (~65%), 3% increase = +120 net votes per ward — enough to comfortably defend all 3 narrow wins." },
      { label: 'Valencia — 465-Vote Gap Closeable via Hindu Mobilisation', stat: '465 Votes Gap', statColor: '#22d3ee', detail: "Valencia: INC 53.5% vs BJP 44.6% — margin 8.9%, total 5,220 voters → ~465 vote swing needed. Ward has 30%+ Christian population (largely INC-leaning) but 60%+ Hindu voters. BJP currently captures only ~60% of Hindu vote here vs 70%+ citywide. Closing this gap flips Valencia." },
    ],
  },
  T: {
    title: 'Threats', subtitle: 'External · Negative',
    Icon: AlertOctagon,
    color: '#f59e0b', glow: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.28)',
    bg: 'rgba(245,158,11,0.05)', badgeBg: 'rgba(245,158,11,0.12)',
    items: [
      { label: 'Consolidated Minority Block — ~28% of Electorate', stat: '~28% Block', statColor: '#f59e0b', detail: 'Est. Muslim voters: ~18% citywide · Christian voters: ~10% citywide. In Muslim-majority booths Congress captures 85–95% of votes. If minority turnout rises from ~67% to 80%, Congress gains ~8,000–10,000 net votes citywide — enough to flip 4–6 marginal wards.' },
      { label: 'Congress Organised in 5 High-Turnout Lost Wards', stat: '5 Organised', statColor: '#f59e0b', detail: 'Bengre 71.6% turnout (BJP lost −25%) · Bajal 69.5% (BJP lost −11.4%) · Kannur 64.5% (BJP lost −16.4%) · Jeppu 65.7% (BJP lost −8.1%) · Bunder 63.3% (BJP lost −25.7%). All 5 are STRONG polling status — Congress is already well-mobilised. Further consolidation increases their margins.' },
      { label: '3 Narrow Wins Exposed to 5% Anti-Incumbency Swing', stat: '~350 Vote Risk', statColor: '#f59e0b', detail: 'Attavara (+9.9%) — BJP by only ~415 votes · Mangaladevi (+9.8%) — BJP by ~370 votes · Padav East (+7.5%) — BJP by ~265 votes. A 5% anti-incumbency swing = ~200–330 vote shift per ward — enough to flip all three. Must be treated as HIGH PRIORITY retention seats.' },
      { label: 'Bengre — 10,686 Voters, BJP Stuck at 36.4%', stat: '+2,001 INC Gap', statColor: '#f59e0b', detail: 'Bengre has the highest voter count in MCC (10,686). BJP total: 2,693 votes. Congress: 4,694 votes (INC surplus 2,001 votes). Muslim population ~65%. If Muslim turnout rises further, Congress gains 400–600 net votes here alone, adding significantly to their citywide total.' },
      { label: 'Congress Booth Gains in Mixed Wards', stat: 'Erosion Signal', statColor: '#f59e0b', detail: 'Jeppu: BJP won 5 booths, lost 2 (Booths 160, 162 — Muslim-majority) · Kannur: BJP won 5, lost 2 · Port: BJP won 4, lost 3. Each lost booth = ~200–350 Congress net votes. Trend, if unchecked, pushes these wards from LOST to UNWINNABLE category.' },
      { label: 'NOTA + JDS Bleed in Narrow-Win Wards', stat: '1,187 NOTA', statColor: '#f59e0b', detail: 'NOTA absorbed 1,187 votes in 2023. In 3 narrow-win wards totalling only ~7,000 total voters, even 200–300 NOTA votes can swing outcomes. Bajal: JDS polled 94 votes (BJP+JDS = 45.9% — still behind INC 52.9%). NOTA + JDS leakage represents ~2–3% structural bleed.' },
    ],
  },
};

// ─── Tab Config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'swot', label: 'Political SWOT', Icon: LayoutGrid },
  { id: 'wards', label: 'Ward Strength', Icon: BarChart2 },
  { id: 'demographic', label: 'Demographic', Icon: PieChart },
];

// ─── Ward Strength Tab ─────────────────────────────────────────────────────────
function WardStrengthTab() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = wardData.filter(w => {
    const matchF = filter === 'all' || w.cat.toLowerCase() === filter;
    const matchS = w.ward.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const catMeta = {
    STRONG: { color: '#10b981', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.28)', desc: 'Lead >40%' },
    MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.28)', desc: 'Lead 15–40%' },
    NARROW: { color: '#fde68a', bg: 'rgba(253,230,138,0.11)', border: 'rgba(253,230,138,0.28)', desc: 'Lead <15%' },
    LOST: { color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.28)', desc: 'Congress Won' },
  };

  const filterBtns = [
    { key: 'all', label: 'All (38)', Icon: Activity, color: '#94a3b8' },
    { key: 'strong', label: 'Strong (8)', Icon: ShieldCheck, color: '#10b981' },
    { key: 'medium', label: 'Medium (14)', Icon: Minus, color: '#f59e0b' },
    { key: 'narrow', label: 'Narrow (3)', Icon: AlertCircle, color: '#fde68a' },
    { key: 'lost', label: 'Congress (13)', Icon: XCircle, color: '#f87171' },
  ];

  const whyText = (w) => {
    if (w.cat === 'STRONG') return `Lead ${w.lead.toFixed(1)}% exceeds 40% threshold — Hindu-dominant, full BJP mobilisation`;
    if (w.cat === 'MEDIUM') return `Lead ${w.lead.toFixed(1)}% (15–40%) — Solid base, growth potential remains`;
    if (w.cat === 'NARROW') return `Lead only ${w.lead.toFixed(1)}% — Mixed demography, vulnerable to 5% swing (~${Math.abs(Math.round(w.voters * w.lead / 200))} vote gap)`;
    return `Congress lead ${Math.abs(w.lead).toFixed(1)}% — Minority-dominant; BJP vote base structurally insufficient`;
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'STRONG', count: 8, avg: '47.8%', extra: 'All Hindu-belt' },
          { key: 'MEDIUM', count: 14, avg: '24.6%', extra: 'Solid BJP base' },
          { key: 'NARROW', count: 3, avg: '9.1%', extra: 'Flip risk: 5% swing' },
          { key: 'LOST', count: 13, avg: '−19.8%', extra: 'Minority-heavy' },
        ].map(c => {
          const m = catMeta[c.key];
          return (
            <div key={c.key} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700, color: m.color, letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>{c.key}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginBottom: 6 }}>{m.desc}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: m.color, lineHeight: 1, marginBottom: 4 }}>{c.count}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: m.color, marginBottom: 2 }}>Avg {c.avg}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.extra}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        {filterBtns.map(b => (
          <button key={b.key} onClick={() => setFilter(b.key)} style={{
            padding: '6px 13px', borderRadius: 8, border: `1px solid ${b.color}`,
            background: filter === b.key ? `${b.color}20` : 'transparent',
            color: b.color, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.18s', fontFamily: 'Sora, sans-serif',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <b.Icon size={11} />
            {b.label}
          </button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search ward…"
          style={{ marginLeft: 'auto', padding: '6px 13px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#f0f4ff', fontSize: 11, outline: 'none', fontFamily: 'Sora, sans-serif', minWidth: 140 }}
        />
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['#', 'Ward', 'Voters', 'BJP', 'INC', 'BJP %', 'INC %', 'Lead', 'Turnout', 'Category', 'Analysis', 'PS'].map(h => (
                <th key={h} style={{ background: 'rgba(245,158,11,0.08)', color: 'rgba(245,158,11,0.8)', fontFamily: 'Space Mono, monospace', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, padding: '10px 11px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w, i) => {
              const m = catMeta[w.cat];
              const lc = w.lead >= 0 ? '#10b981' : '#f87171';
              const ls = w.lead >= 0 ? `+${w.lead.toFixed(1)}%` : `${w.lead.toFixed(1)}%`;
              return (
                <tr key={w.ward} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '9px 11px', color: 'rgba(255,255,255,0.28)', fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{i + 1}</td>
                  <td style={{ padding: '9px 11px', fontWeight: 700, color: '#eef2ff', whiteSpace: 'nowrap', fontSize: 11.5 }}>{w.ward}</td>
                  <td style={{ padding: '9px 11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>{w.voters.toLocaleString()}</td>
                  <td style={{ padding: '9px 11px', color: '#fb923c', fontWeight: 700, fontFamily: 'Space Mono, monospace', fontSize: 11 }}>{w.bjp.toLocaleString()}</td>
                  <td style={{ padding: '9px 11px', color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>{w.cong.toLocaleString()}</td>
                  <td style={{ padding: '9px 11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ width: `${Math.min(w.bjpPct, 100)}%`, height: '100%', borderRadius: 2, background: '#f59e0b' }} />
                      </div>
                      <span style={{ color: '#fb923c', fontWeight: 700, fontFamily: 'Space Mono, monospace', fontSize: 10.5 }}>{w.bjpPct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ width: `${Math.min(w.congPct, 100)}%`, height: '100%', borderRadius: 2, background: '#ef4444' }} />
                      </div>
                      <span style={{ color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: 10.5 }}>{w.congPct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '9px 11px', color: lc, fontWeight: 700, fontFamily: 'Space Mono, monospace', whiteSpace: 'nowrap', fontSize: 11 }}>{ls}</td>
                  <td style={{ padding: '9px 11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Mono, monospace', fontSize: 10.5 }}>{w.turnout}%</td>
                  <td style={{ padding: '9px 11px' }}>
                    <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, fontFamily: 'Space Mono, monospace' }}>{w.cat}</span>
                  </td>
                  <td style={{ padding: '9px 11px', fontSize: 10, color: 'rgba(255,255,255,0.35)', maxWidth: 220, whiteSpace: 'normal', lineHeight: 1.5 }}>{whyText(w)}</td>
                  <td style={{ padding: '9px 11px', fontSize: 10, color: w.ps === 'STRONG' ? '#10b981' : '#f59e0b', fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>{w.ps}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Demographic Tab ───────────────────────────────────────────────────────────
function DemographicTab() {
  const [demoFilter, setDemoFilter] = useState('muslim');
  const riskColor = (r) => r === 'Unwinnable' ? '#f87171' : r === 'Very High' ? '#fb923c' : '#fde68a';

  const renderBooth = (b, type) => {
    const pct = type === 'muslim' ? b.muslimPct : b.christianPct;
    const pctColor = type === 'muslim' ? '#60a5fa' : '#c084fc';
    const deficit = (b.bjpPct - b.congPct).toFixed(1);
    const defColor = deficit >= 0 ? '#10b981' : '#f87171';
    const defStr = deficit >= 0 ? `+${deficit}%` : `${deficit}%`;
    const estBjp = Math.round(b.voters * 0.65 * b.bjpPct / 100);
    const estInc = Math.round(b.voters * 0.65 * b.congPct / 100);
    return (
      <div key={`${b.ward}-${b.booth}`} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 0.8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{b.ward}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#eef2ff', fontFamily: 'Space Mono, monospace' }}>Booth #{b.booth}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: riskColor(b.risk), fontWeight: 700, marginBottom: 2 }}>{b.risk}</div>
            <div style={{ fontSize: 10.5, color: defColor, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{defStr} BJP vs INC</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
          {[
            { val: `${pct.toFixed(0)}%`, label: type === 'muslim' ? 'MUSLIM' : 'CHRISTIAN', bg: type === 'muslim' ? 'rgba(96,165,250,0.1)' : 'rgba(192,132,252,0.1)', color: pctColor },
            { val: `${b.bjpPct.toFixed(1)}%`, label: 'BJP', bg: 'rgba(245,158,11,0.1)', color: '#fb923c' },
            { val: `${b.congPct.toFixed(1)}%`, label: 'INC', bg: 'rgba(239,68,68,0.1)', color: '#f87171' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: s.color, fontFamily: 'Space Mono, monospace', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.36)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'rgba(255,255,255,0.28)', marginBottom: 5, fontFamily: 'Space Mono, monospace' }}>
          <span>{b.voters.toLocaleString()} voters</span>
          <span>Est. BJP ~{estBjp} · INC ~{estInc}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex' }}>
          <div style={{ width: `${b.bjpPct}%`, background: '#f59e0b', height: '100%' }} />
          <div style={{ width: `${b.congPct}%`, background: '#ef4444', height: '100%' }} />
        </div>
      </div>
    );
  };

  const booths = demoFilter === 'muslim' ? muslimBooths : christianBooths;
  const summaryColor = demoFilter === 'muslim' ? '#60a5fa' : '#c084fc';
  const totalUnwinnable = booths.filter(b => b.risk === 'Unwinnable').length;
  const totalVH = booths.filter(b => b.risk === 'Very High').length;
  const totalHigh = booths.filter(b => b.risk === 'High').length;
  const avgBJP = (booths.reduce((a, b) => a + b.bjpPct, 0) / booths.length).toFixed(1);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { val: booths.length, label: demoFilter === 'muslim' ? 'Muslim-Dominant Booths' : 'Christian-Dominant Booths', color: summaryColor },
          { val: `${avgBJP}%`, label: 'Avg BJP % in these booths', color: '#fb923c' },
          { val: totalUnwinnable, label: 'Unwinnable (BJP <20%)', color: '#f87171' },
          { val: totalVH + totalHigh, label: 'High / Very High Risk', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: 'Space Mono, monospace', lineHeight: 1, marginBottom: 6 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { key: 'muslim', label: 'Muslim-Dominant Booths', Icon: Users, color: '#60a5fa' },
          { key: 'christian', label: 'Christian-Dominant Booths', Icon: UserCheck, color: '#c084fc' },
        ].map(b => (
          <button key={b.key} onClick={() => setDemoFilter(b.key)} style={{
            padding: '8px 16px', borderRadius: 8, border: `1px solid ${b.color}`,
            background: demoFilter === b.key ? `${b.color}18` : 'transparent',
            color: b.color, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.18s', fontFamily: 'Sora, sans-serif',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <b.Icon size={13} />
            {b.label} ({b.key === 'muslim' ? muslimBooths.length : christianBooths.length})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 14, fontSize: 11, alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'Unwinnable', color: '#f87171' },
          { label: 'Very High Risk', color: '#fb923c' },
          { label: 'High Risk', color: '#fde68a' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} />
            <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10 }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10, maxHeight: 580, overflowY: 'auto', paddingRight: 2 }}>
        {booths.map(b => renderBooth(b, demoFilter))}
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#eef2ff', marginBottom: 14, letterSpacing: -0.2 }}>Ward-Level Demographic & BJP Performance</div>
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr>
                {['Ward', 'Dominant', 'Muslim %', 'Christian %', 'BJP %', 'INC %', 'Lead', 'Winner', 'Viability'].map(h => (
                  <th key={h} style={{ background: 'rgba(245,158,11,0.07)', color: 'rgba(245,158,11,0.75)', fontFamily: 'Space Mono, monospace', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, padding: '9px 11px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { ward: 'BENGRE', dominant: 'MUSLIM', muslim: '~65%', christian: '~5%', bjp: 36.37, inc: 61.32, lead: -24.96, winner: 'CONGRESS', viability: 'None' },
                { ward: 'KUDROLI', dominant: 'MUSLIM', muslim: '~55%', christian: '~3%', bjp: 28.95, inc: 70.17, lead: -41.21, winner: 'CONGRESS', viability: 'None' },
                { ward: 'BENDOOR', dominant: 'MUSLIM+CHR', muslim: '~35%', christian: '~35%', bjp: 29.4, inc: 68.82, lead: -39.41, winner: 'CONGRESS', viability: 'None' },
                { ward: 'FALNIR', dominant: 'MUSLIM+CHR', muslim: '~35%', christian: '~30%', bjp: 32.07, inc: 66.12, lead: -34.04, winner: 'CONGRESS', viability: 'Low' },
                { ward: 'BUNDER', dominant: 'MUSLIM', muslim: '~55%', christian: '~5%', bjp: 36.06, inc: 61.71, lead: -25.65, winner: 'CONGRESS', viability: 'Low' },
                { ward: 'KANNUR', dominant: 'MUSLIM', muslim: '~60%', christian: '~5%', bjp: 40.63, inc: 57.02, lead: -16.39, winner: 'CONGRESS', viability: 'Low' },
                { ward: 'MILAGRESS', dominant: 'MIXED', muslim: '~20%', christian: '~20%', bjp: 38.13, inc: 60.08, lead: -21.95, winner: 'CONGRESS', viability: 'Low' },
                { ward: 'BAJAL', dominant: 'MIXED', muslim: '~25%', christian: '~10%', bjp: 44.54, inc: 52.93, lead: -11.36, winner: 'CONGRESS', viability: 'Medium (JDS+)' },
                { ward: 'JEPPU', dominant: 'MIXED', muslim: '~20%', christian: '~20%', bjp: 44.83, inc: 52.90, lead: -8.07, winner: 'CONGRESS', viability: 'Medium' },
                { ward: 'PORT', dominant: 'MIXED', muslim: '~25%', christian: '~10%', bjp: 44.71, inc: 53.96, lead: -9.25, winner: 'CONGRESS', viability: 'Medium' },
                { ward: 'COURT', dominant: 'MIXED', muslim: '~30%', christian: '~10%', bjp: 43.76, inc: 54.80, lead: -11.03, winner: 'CONGRESS', viability: 'Medium (turnout)' },
                { ward: 'VALENCIA', dominant: 'CHR+MIXED', muslim: '~10%', christian: '~30%', bjp: 44.64, inc: 53.49, lead: -8.85, winner: 'CONGRESS', viability: 'Medium' },
                { ward: 'SHIVABAGH', dominant: 'MIXED', muslim: '~15%', christian: '~25%', bjp: 46.74, inc: 51.56, lead: -4.83, winner: 'CONGRESS', viability: 'High' },
                { ward: 'BEJAI', dominant: 'HINDU', muslim: '~5%', christian: '~25%', bjp: 59.44, inc: 38.33, lead: 21.11, winner: 'BJP', viability: 'Safe' },
                { ward: 'ALAPE NORTH', dominant: 'MIXED', muslim: '~5%', christian: '~30%', bjp: 57.13, inc: 41.39, lead: 15.74, winner: 'BJP', viability: 'Safe' },
              ].map((w, i) => {
                const lc = w.lead >= 0 ? '#10b981' : '#f87171';
                const ls = w.lead >= 0 ? `+${w.lead.toFixed(1)}%` : `${w.lead.toFixed(1)}%`;
                const wc = w.winner === 'BJP' ? '#fb923c' : '#f87171';
                const vc = w.viability === 'None' ? '#f87171' : w.viability === 'Low' ? '#fb923c' : w.viability.startsWith('Med') ? '#fde68a' : w.viability === 'High' ? '#86efac' : '#10b981';
                const dc = w.dominant.includes('MUSLIM') ? '#60a5fa' : w.dominant.includes('CHR') ? '#c084fc' : w.dominant === 'HINDU' ? '#fb923c' : '#a0aec0';
                return (
                  <tr key={w.ward} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 11px', fontWeight: 700, color: '#eef2ff', whiteSpace: 'nowrap' }}>{w.ward}</td>
                    <td style={{ padding: '8px 11px' }}><span style={{ color: dc, background: `${dc}14`, border: `1px solid ${dc}28`, borderRadius: 6, padding: '2px 7px', fontSize: 9.5, fontWeight: 700 }}>{w.dominant}</span></td>
                    <td style={{ padding: '8px 11px', color: '#60a5fa', fontFamily: 'Space Mono, monospace', fontSize: 10.5 }}>{w.muslim}</td>
                    <td style={{ padding: '8px 11px', color: '#c084fc', fontFamily: 'Space Mono, monospace', fontSize: 10.5 }}>{w.christian}</td>
                    <td style={{ padding: '8px 11px', color: '#fb923c', fontWeight: 700, fontFamily: 'Space Mono, monospace', fontSize: 10.5 }}>{w.bjp}%</td>
                    <td style={{ padding: '8px 11px', color: '#f87171', fontFamily: 'Space Mono, monospace', fontSize: 10.5 }}>{w.inc}%</td>
                    <td style={{ padding: '8px 11px', color: lc, fontWeight: 700, fontFamily: 'Space Mono, monospace', fontSize: 10.5 }}>{ls}</td>
                    <td style={{ padding: '8px 11px', fontWeight: 700, color: wc, fontSize: 10.5 }}>{w.winner}</td>
                    <td style={{ padding: '8px 11px', color: vc, fontSize: 10.5, fontWeight: 700 }}>{w.viability}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SWOT Tab ─────────────────────────────────────────────────────────────────
function SwotTab() {
  const [hovered, setHovered] = useState(null);
  const [modalKey, setModalKey] = useState(null);
  const keys = ['S', 'W', 'O', 'T'];

  const strategyItems = [
    { Icon: Crosshair, text: 'Defend Attavara (+9.9%), Mangaladevi (+9.8%), Padav East (+7.5%) — combined margin only ~1,050 votes' },
    { Icon: RefreshCw, text: 'Priority flips: Shivabagh (183 votes gap), Court (+352 via turnout), Bajal (JDS+Hindu drive)' },
    { Icon: Smartphone, text: 'Youth mobilisation in 3 narrow wards — 3% turnout gain = +120 net votes each ward' },
    { Icon: Building2, text: 'Lead 2028 on Smart City deliverables — anchor coastal Hindu voters in Padav, Bolar, Boloor clusters' },
  ];

  return (
    <div>
      {/* Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Ward Win Rate', value: '65.8%', sub: '25 of 38 wards', color: '#10b981', Icon: TrendingUp },
          { label: 'BJP Vote Share', value: '56.1%', sub: 'vs INC 42.0%', color: '#fb923c', Icon: Activity },
          { label: 'Majority Margin', value: '+14.1%', sub: 'over Congress', color: '#22d3ee', Icon: MapPin },
          { label: 'Strong Booths', value: '33/38', sub: 'Polling stations', color: '#a78bfa', Icon: CheckSquare },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <s.Icon size={16} color={s.color} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: -0.5, marginBottom: 2, fontFamily: 'Space Mono, monospace' }}>{s.value}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>{s.label}</div>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.22)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 2028 Strategy */}
      <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="#f59e0b" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4ff' }}>2028 Election Strategy Priorities</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.75 }}>Derived from 2023 booth-level data · 38 wards · 246,952 voters</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {strategyItems.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '9px 11px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
              <p.Icon size={13} color="#f59e0b" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{p.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginBottom: 14, fontFamily: 'Space Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <ChevronRight size={11} color="rgba(255,255,255,0.2)" />
        Click any quadrant to expand detailed intelligence
      </div>

      {/* 2×2 SWOT Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {keys.map((key, idx) => {
          const q = swotPoints[key];
          const isH = hovered === key;
          return (
            <div key={key}
              onClick={() => setModalKey(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative', borderRadius: 14, padding: '16px 15px 14px',
                border: `1px solid ${isH ? q.border : 'rgba(255,255,255,0.07)'}`,
                background: isH ? `linear-gradient(145deg, ${q.bg}, rgba(10,18,35,0.98))` : 'rgba(15,23,42,0.6)',
                boxShadow: isH ? `0 8px 30px ${q.glow}` : 'none',
                transition: 'all 0.22s ease', overflow: 'hidden', cursor: 'pointer',
              }}>
              {/* watermark letter */}
              <div style={{ position: 'absolute', bottom: -8, right: 10, fontSize: 68, fontWeight: 900, color: q.color, opacity: 0.04, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'Sora, sans-serif' }}>{key}</div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: q.badgeBg, border: `1px solid ${q.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <q.Icon size={14} color={q.color} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#eef2ff' }}>{q.title}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: q.color, opacity: 0.7 }}>{q.subtitle}</div>
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: q.color, opacity: 0.4, fontFamily: 'Sora, sans-serif' }}>{key}</div>
              </div>

              <div style={{ height: 1, background: `linear-gradient(90deg, ${q.color}20, transparent)`, marginBottom: 10 }} />

              {/* Items */}
              <div>
                {q.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500, flex: 1, paddingRight: 7, lineHeight: 1.3 }}>{item.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: item.statColor, background: `${item.statColor}10`, border: `1px solid ${item.statColor}1e`, borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap', fontFamily: 'Space Mono, monospace' }}>{item.stat}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, opacity: isH ? 0.65 : 0.2, transition: 'opacity 0.2s' }}>
                <span style={{ fontSize: 9, color: q.color, fontFamily: 'Space Mono, monospace', fontWeight: 700, letterSpacing: 0.3 }}>VIEW DETAILS</span>
                <ChevronRight size={10} color={q.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalKey && (
        <div onClick={() => setModalKey(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.88)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #0d1a30, #080d1a)', border: `1px solid ${swotPoints[modalKey].border}`, borderRadius: 18, padding: '22px 20px', maxWidth: 540, width: '100%', boxShadow: `0 20px 70px ${swotPoints[modalKey].glow}`, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: swotPoints[modalKey].badgeBg, border: `1px solid ${swotPoints[modalKey].border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.createElement(swotPoints[modalKey].Icon, { size: 16, color: swotPoints[modalKey].color, strokeWidth: 2 })}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#f0f4ff', fontFamily: 'Sora, sans-serif' }}>{swotPoints[modalKey].title}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: swotPoints[modalKey].color, opacity: 0.75 }}>{swotPoints[modalKey].subtitle}</div>
                </div>
              </div>
              <button onClick={() => setModalKey(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${swotPoints[modalKey].color}22, transparent)`, marginBottom: 14 }} />
            {swotPoints[modalKey].items.map((item, i) => (
              <div key={i} style={{ marginBottom: 10, padding: '12px 13px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#e8eeff', lineHeight: 1.3, flex: 1, fontFamily: 'Sora, sans-serif' }}>{item.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: item.statColor, background: `${item.statColor}12`, border: `1px solid ${item.statColor}24`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap', fontFamily: 'Space Mono, monospace' }}>{item.stat}</span>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6, margin: 0 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Swot() {
  const [activeTab, setActiveTab] = useState('swot');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        .swot-page {
          min-height: 100vh;
          background: #070c18;
          padding-top: var(--nav-h, 64px);
          padding-bottom: calc(var(--tab-h, 56px) + var(--safe-bottom, 0px) + 24px);
          position: relative;
          font-family: 'Sora', sans-serif;
        }
        .swot-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 50% 35% at 10% 15%, rgba(16,185,129,0.05) 0%, transparent 65%),
            radial-gradient(ellipse 45% 40% at 90% 85%, rgba(34,211,238,0.04) 0%, transparent 65%),
            radial-gradient(ellipse 35% 50% at 85% 8%, rgba(245,158,11,0.03) 0%, transparent 65%);
        }
        .swot-inner {
          position: relative; z-index: 1;
          max-width: 1000px; margin: 0 auto;
          padding: 24px 16px 32px;
        }
        .swot-hero {
          text-align: center; margin-bottom: 24px;
          animation: fadeUp 0.45s ease both;
        }
        .swot-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.18);
          border-radius: 999px; padding: 4px 14px;
          font-size: 9.5px; font-weight: 700; color: rgba(245,158,11,0.85);
          letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px;
          font-family: 'Space Mono', monospace;
        }
        .swot-eyebrow-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #f59e0b;
          animation: pulse 2.2s ease-in-out infinite;
        }
        .swot-title {
          font-size: clamp(24px, 4.5vw, 38px); font-weight: 900; color: #eef2ff;
          letter-spacing: -1.2px; line-height: 1.06; margin-bottom: 8px;
        }
        .swot-title-accent {
          background: linear-gradient(135deg, #f59e0b, #fde68a);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .swot-subtitle {
          font-size: 12.5px; color: rgba(255,255,255,0.28);
          max-width: 420px; margin: 0 auto; line-height: 1.6;
        }
        .tab-nav {
          display: flex; gap: 5px; margin-bottom: 22px; padding: 4px;
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; animation: fadeUp 0.45s ease 0.08s both;
        }
        .tab-btn {
          flex: 1; padding: 9px 12px; border-radius: 9px; border: 1px solid transparent;
          background: transparent; cursor: pointer; font-family: 'Sora', sans-serif;
          font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,0.36);
          transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .tab-btn.active {
          background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.24);
          color: #f59e0b;
        }
        .tab-btn:not(.active):hover { color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.04); }
        .swot-source {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 9px 14px; border-radius: 8px; margin-top: 22px;
          background: rgba(255,255,255,0.018); border: 1px solid rgba(255,255,255,0.05);
          font-size: 9.5px; color: rgba(255,255,255,0.2); font-family: 'Space Mono', monospace;
        }
        .source-dot { width: 5px; height: 5px; border-radius: 50%; background: #10b981; animation: pulse 2.5s ease-in-out infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.35; transform:scale(0.55); } }
        @media (max-width: 600px) { .tab-btn .tab-label { display: none; } }
      `}</style>

      <div className="swot-page">
        <div className="swot-bg" />
        <Navbar />

        <div className="swot-inner">
          {/* Hero */}
          <div className="swot-hero">
            <div className="swot-eyebrow">
              <span className="swot-eyebrow-dot" />
              Political Intelligence · Mangaluru MCC · 38 Wards
            </div>
            <h1 className="swot-title">BJP <span className="swot-title-accent">Political SWOT</span></h1>
            <p className="swot-subtitle">Booth-level intelligence for the 2028 cycle — grounded in 2023 election data across all 38 wards · 2,46,952 registered voters.</p>
          </div>

          {/* Tab Nav */}
          <div className="tab-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <t.Icon size={13} strokeWidth={2} />
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'swot' && <SwotTab />}
          {activeTab === 'wards' && <WardStrengthTab />}
          {activeTab === 'demographic' && <DemographicTab />}

          {/* Source strip */}
          <div className="swot-source">
            <span className="source-dot" />
            <span>Source: 2023 Karnataka Assembly Elections · Mangaluru City Constituency · 38 Wards · 2,46,952 Registered Voters · Booth-Level Data</span>
          </div>
        </div>
      </div>
    </>
  );
}