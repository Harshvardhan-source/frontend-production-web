import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { swotApi } from '../api/client';

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const Icon = ({ path, size = 14, color = 'currentColor', strokeWidth = 1.75, fill = 'none', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block', ...style }}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

// Each path set is tuned for clarity at 11–18px (Lucide-style geometry)
const PATHS = {
  // ── SWOT quadrant icons ───────────────────────────────────────────────────
  // Strengths → solid shield with inner check
  ShieldCheck:  ['M12 3l7.5 2.5V11c0 4.5-3.5 8-7.5 9.5C8 19 4.5 15.5 4.5 11V5.5L12 3z', 'M9 12l2 2 4-4'],
  // Weaknesses → warning triangle, tight geometry
  AlertTriangle:['M10.5 4.5l-8 13.5a1.5 1.5 0 0 0 1.3 2.25h16.4a1.5 1.5 0 0 0 1.3-2.25l-8-13.5a1.5 1.5 0 0 0-2.6 0z', 'M12 10v4', 'M12 17.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z'],
  // Opportunities → precise crosshair / target
  Target:       ['M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z', 'M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z', 'M12 2v3', 'M12 19v3', 'M2 12h3', 'M19 12h3'],
  // Threats → octagon stop-sign shape
  AlertOctagon: ['M7.5 2.5h9l5 5v9l-5 5h-9l-5-5v-9l5-5z', 'M12 8v5', 'M12 16.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z'],

  // ── Tab nav icons ─────────────────────────────────────────────────────────
  // Political SWOT → 2×2 bento grid
  LayoutGrid:   ['M3 3h8v8H3z', 'M13 3h8v8h-8z', 'M13 13h8v8h-8z', 'M3 13h8v8H3z'],
  // Ward Strength → rising bars
  BarChart2:    ['M6 20v-5', 'M10 20V9', 'M14 20v-7', 'M18 20V4'],
  // Demographic → donut / pie
  PieChart:     ['M12 2v10l7.07 7.07A10 10 0 1 1 12 2z', 'M12 2a10 10 0 0 1 7.07 17.07L12 12V2z'],
  // Shaastra SWOT → neural / circuit node
  Crosshair:    ['M12 2v4', 'M12 18v4', 'M2 12h4', 'M18 12h4', 'M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0'],

  // ── Ward filter icons ─────────────────────────────────────────────────────
  Activity:     ['M3 12h4l2.5-7 4 14 2.5-7H21'],  // ECG pulse
  // Strong → verified shield
  ShieldStar:   ['M12 3l7.5 2.5V11c0 4.5-3.5 8-7.5 9.5C8 19 4.5 15.5 4.5 11V5.5L12 3z', 'M12 8l1 2.5 2.5.3-1.8 1.8.4 2.5L12 14l-2.1 1.1.4-2.5-1.8-1.8 2.5-.3L12 8z'],
  // Medium → equal horizontal bars (balance)
  Minus:        ['M5 9h14', 'M5 12h14', 'M5 15h14'],
  // Narrow → warning bell
  AlertCircle:  ['M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z', 'M12 8v5', 'M12 16.5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1z'],
  // Congress / Lost → X in circle
  XCircle:      ['M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z', 'M15 9l-6 6', 'M9 9l6 6'],

  // ── Misc ──────────────────────────────────────────────────────────────────
  ChevronRight: ['M9 6l6 6-6 6'],
  X:            ['M18 6 6 18', 'M6 6l12 12'],
  TrendingUp:   ['M22 7l-9.5 9.5-5-5L1 18', 'M16 7h6v6'],
  MapPin:       ['M20 10c0 6.4-8 12-8 12S4 16.4 4 10a8 8 0 0 1 16 0z', 'M12 10m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0'],
  CheckSquare:  ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  RefreshCw:    ['M21 2v6h-6', 'M3 12a9 9 0 0 1 15-6.7L21 8', 'M3 22v-6h6', 'M21 12a9 9 0 0 1-15 6.7L3 16'],
  Smartphone:   ['M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z', 'M12 18h.01'],
  Building2:    ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z', 'M6 12H4a2 2 0 0 0-2 2v8h4', 'M18 9h2a2 2 0 0 1 2 2v11h-4', 'M10 6h4', 'M10 10h4', 'M10 14h4', 'M10 18h4'],

  // ── Context key icons (replaces emojis) ───────────────────────────────────
  // Economic → coin / trending
  Economic:     ['M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z', 'M12 6v2', 'M12 16v2', 'M8.5 9.5a2.5 2 0 0 1 5 0c0 1.5-1 2-2.5 2.5s-2.5 1-2.5 2.5a2.5 2 0 0 0 5 0'],
  // Employment → briefcase
  Employment:   ['M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z', 'M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2', 'M12 13v.01'],
  // Health → heartbeat / cross
  Health:       ['M12 21.7C5.4 15.5 2 11.6 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.3.8 4.5 2 1.2-1.2 2.8-2 4.5-2C19.6 3 22 5.4 22 8.5c0 3.1-3.4 7-10 13.2z'],
  // Home Type → house
  HomeType:     ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  // Education → graduation cap
  Education:    ['M2 10l10-6 10 6-10 6z', 'M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5', 'M22 10v6'],
  // Religion → compass / star
  Religion:     ['M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z'],
  // Community (PL) → connected nodes
  Community:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  // Economic (PL) → bar chart up
  EconomicPL:   ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  // Political → landmark / columns
  Political:    ['M3 22h18', 'M6 18v-7', 'M10 18v-7', 'M14 18v-7', 'M18 18v-7', 'M2 11l10-7 10 7'],
  // Administrative → clipboard/shield
  Admin:        ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  // Users (demographic)
  History:      ['M3 3h7', 'M3 3v7', 'M3 3l8 8', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  BarChart3:    ['M12 20V10', 'M18 20V4', 'M6 20v-4'],
  UserCheck:    ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M17 11l2 2 4-4'],
  Zap:          ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
};

const ShieldCheck   = (p) => <Icon path={PATHS.ShieldCheck}   {...p} />;
const AlertTriangle = (p) => <Icon path={PATHS.AlertTriangle} {...p} />;
const Target        = (p) => <Icon path={PATHS.Target}        {...p} />;
const AlertOctagon  = (p) => <Icon path={PATHS.AlertOctagon}  {...p} />;
const LayoutGrid    = (p) => <Icon path={PATHS.LayoutGrid}    {...p} />;
const BarChart2     = (p) => <Icon path={PATHS.BarChart2}     {...p} />;
const PieChart      = (p) => <Icon path={PATHS.PieChart}      {...p} />;
const Users         = (p) => <Icon path={PATHS.Users}         {...p} />;
const UserCheck     = (p) => <Icon path={PATHS.UserCheck}     {...p} />;
const Zap           = (p) => <Icon path={PATHS.Zap}           {...p} />;
const Minus         = (p) => <Icon path={PATHS.Minus}         {...p} />;
const AlertCircle   = (p) => <Icon path={PATHS.AlertCircle}   {...p} />;
const XCircle       = (p) => <Icon path={PATHS.XCircle}       {...p} />;
const ChevronRight  = (p) => <Icon path={PATHS.ChevronRight}  {...p} />;
const XIcon         = (p) => <Icon path={PATHS.X}             {...p} />;
const TrendingUp    = (p) => <Icon path={PATHS.TrendingUp}    {...p} />;
const MapPin        = (p) => <Icon path={PATHS.MapPin}        {...p} />;
const Activity      = (p) => <Icon path={PATHS.Activity}      {...p} />;
const CheckSquare   = (p) => <Icon path={PATHS.CheckSquare}   {...p} />;
const Crosshair     = (p) => <Icon path={PATHS.Crosshair}     {...p} />;
const RefreshCw     = (p) => <Icon path={PATHS.RefreshCw}     {...p} />;
const Smartphone    = (p) => <Icon path={PATHS.Smartphone}    {...p} />;
const Building2     = (p) => <Icon path={PATHS.Building2}     {...p} />;

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

const HistoryIcon = ({ size, strokeWidth }) => <Icon path={PATHS.BarChart3}   size={size} strokeWidth={strokeWidth} />;

const TABS = [
  { id: 'swot',       label: 'Political SWOT',      Icon: LayoutGrid  },
  { id: 'wards',      label: 'Ward Strength',        Icon: BarChart2   },
  { id: 'demographic',label: 'Demographic',          Icon: PieChart    },
  { id: 'election',   label: 'Prev. Election',       Icon: HistoryIcon },
  { id: 'ml',         label: 'Shaastra SWOT',        Icon: Crosshair   },
];
// ─── AI Overview Panel ────────────────────────────────────────────────────────
// Shown at the top of each tab. Calls /api/ai/swot-overview/ with the tab id
// AND the serialised data currently visible in that tab.
// Caches results per tab so switching back doesn't re-fetch.
const overviewCache = {};   // module-level so persists across tab switches

// ── Serialise each tab's data so the backend has real numbers to analyse ──────
function buildTabData(tab) {
  switch (tab) {

    case 'swot': {
      // Full SWOT points (S/W/O/T), each item label + stat + detail
      const lines = [];
      for (const [key, q] of Object.entries(swotPoints)) {
        lines.push(`=== ${q.title} (${q.subtitle}) ===`);
        q.items.forEach(it => {
          lines.push(`  • [${it.stat}] ${it.label}`);
          // Cap detail at 200 chars to keep payload size manageable
          lines.push(`    ${it.detail.slice(0, 200)}`);
        });
      }
      // Also include overall ward summary
      lines.push('\n=== Ward Summary ===');
      lines.push('25/38 wards won by BJP | 13 by Congress');
      lines.push('STRONG (lead >40%): 8 wards, avg lead 47.8%');
      lines.push('MEDIUM (lead 15-40%): 14 wards, avg lead 24.6%');
      lines.push('NARROW (lead <15%): 3 wards (Attavara +9.9%, Mangaladevi +9.8%, Padav East +7.5%)');
      lines.push('LOST: 13 wards — avg Congress lead 19.8%');
      return lines.join('\n');
    }

    case 'wards': {
      // All 38 wards with every numeric field
      const header = 'Ward | Voters | BJP | INC | BJP% | INC% | Lead% | Turnout% | Category | PS | Winner';
      const rows = wardData.map(w =>
        `${w.ward} | ${w.voters} | ${w.bjp} | ${w.cong} | ${w.bjpPct} | ${w.congPct} | ${w.lead.toFixed(2)} | ${w.turnout} | ${w.cat} | ${w.ps} | ${w.winner}`
      );
      return [header, ...rows].join('\n');
    }

    case 'demographic': {
      // Muslim-dominant booths
      const mHeader = '=== Muslim-Dominant Booths ===\nWard | Booth | Voters | Muslim% | BJP% | INC% | Risk';
      const mRows = muslimBooths.map(b =>
        `${b.ward} | ${b.booth} | ${b.voters} | ${b.muslimPct} | ${b.bjpPct} | ${b.congPct} | ${b.risk}`
      );
      // Christian-dominant booths
      const cHeader = '\n=== Christian-Dominant Booths ===\nWard | Booth | Voters | Christian% | BJP% | INC% | Risk';
      const cRows = christianBooths.map(b =>
        `${b.ward} | ${b.booth} | ${b.voters} | ${b.christianPct} | ${b.bjpPct} | ${b.congPct} | ${b.risk}`
      );
      // Ward-level demographic summary (inline data from DemographicTab table)
      const wHeader = '\n=== Ward-Level Demographic & BJP Performance ===\nWard | Dominant | Muslim% | Christian% | BJP% | INC% | Lead% | Winner | Viability';
      const wardDemoRows = [
        'BENGRE | MUSLIM | ~65% | ~5% | 36.37 | 61.32 | -24.96 | CONGRESS | None',
        'KUDROLI | MUSLIM | ~55% | ~3% | 28.95 | 70.17 | -41.21 | CONGRESS | None',
        'BENDOOR | MUSLIM+CHR | ~35% | ~35% | 29.4 | 68.82 | -39.41 | CONGRESS | None',
        'FALNIR | MUSLIM+CHR | ~35% | ~30% | 32.07 | 66.12 | -34.04 | CONGRESS | Low',
        'BUNDER | MUSLIM | ~55% | ~5% | 36.06 | 61.71 | -25.65 | CONGRESS | Low',
        'KANNUR | MUSLIM | ~60% | ~5% | 40.63 | 57.02 | -16.39 | CONGRESS | Low',
        'MILAGRESS | MIXED | ~20% | ~20% | 38.13 | 60.08 | -21.95 | CONGRESS | Low',
        'BAJAL | MIXED | ~25% | ~10% | 44.54 | 52.93 | -11.36 | CONGRESS | Medium (JDS+)',
        'JEPPU | MIXED | ~20% | ~20% | 44.83 | 52.90 | -8.07 | CONGRESS | Medium',
        'PORT | MIXED | ~25% | ~10% | 44.71 | 53.96 | -9.25 | CONGRESS | Medium',
        'COURT | MIXED | ~30% | ~10% | 43.76 | 54.80 | -11.03 | CONGRESS | Medium (turnout)',
        'VALENCIA | CHR+MIXED | ~10% | ~30% | 44.64 | 53.49 | -8.85 | CONGRESS | Medium',
        'SHIVABAGH | MIXED | ~15% | ~25% | 46.74 | 51.56 | -4.83 | CONGRESS | High',
        'BEJAI | HINDU | ~5% | ~25% | 59.44 | 38.33 | +21.11 | BJP | Safe',
        'ALAPE NORTH | MIXED | ~5% | ~30% | 57.13 | 41.39 | +15.74 | BJP | Safe',
      ];
      return [mHeader, ...mRows, cHeader, ...cRows, wHeader, ...wardDemoRows].join('\n');
    }

    case 'election': {
      const sc = '=== Election Scorecard (2013–2023) ===\nElection | Winner | BJP Wards | Congress Wards | Narrative';
      const scRows = ELECTION_SCORECARD.map(e =>
        `${e.election} | ${e.winner} | ${e.bjpWards} | ${e.conWards} | ${e.narrative}`
      );
      const sw = '\n=== Ward Swing Analysis ===\nWard | Class23 | BJP14% | BJP18% | BJP19% | BJP23% | Swing14-18 | Swing19-23 | SwingType | Hindu% | Muslim% | Christian% | Driver';
      const swRows = SWING_DATA.map(w =>
        `${w.ward} | ${w.class23} | ${w.bjp14} | ${w.bjp18} | ${w.bjp19 ?? '—'} | ${w.bjp23 ?? '—'} | ${w.sw1418} | ${w.sw1923} | ${w.swType} | ${w.h} | ${w.m} | ${w.c} | ${w.driver}`
      );
      const st = '\n=== Statistical Variance (top 15) ===\nWard | Mean% | StdDev | Min% | Max% | Turnout% | Rating | Stability | Pred2028%';
      const stRows = STAT_DATA.map(w =>
        `${w.ward} | ${w.mean} | ${w.std} | ${w.min} | ${w.max} | ${w.poll} | ${w.rating} | ${w.stability} | ${w.pred2028}`
      );
      const tr = '\n=== 5-Election Trends (key wards) ===\nWard | Status | 2013% | 2014% | 2018% | 2019% | 2023% | Turnout23% | Trend | Unpolled';
      const trRows = TRENDS5_DATA.map(w =>
        `${w.ward} | ${w.status} | ${w.b13 ?? '—'} | ${w.b14} | ${w.b18} | ${w.b19 ?? '—'} | ${w.b23} | ${w.poll23} | ${w.trend > 0 ? '+' : ''}${w.trend} | ${w.unpolled}`
      );
      const fl = '\n=== Booth Flips (BJP→Congress, top severity) ===\nWard | Booth | Change% | BJP18% | BJP23% | CON23% | Cath% | Musl% | Cause';
      const flRows = FLIP_DATA.map(f =>
        `${f.ward} | ${f.booth} | ${f.change} | ${f.bjp18} | ${f.bjp23} | ${f.con23} | ${f.cath} | ${f.musl} | ${f.cause}`
      );
      const lk = '\n=== Vote Leakage / 3rd-Party Spoilers ===\nWard | Booth | Gap | 3rdParty | JDS | AAP | Ind | BJP% | CON% | Implication';
      const lkRows = LEAKAGE_DATA.map(l =>
        `${l.ward} | ${l.booth} | ${l.gap} | ${l.thirdPty} | ${l.jds} | ${l.aap} | ${l.ind} | ${l.bjp} | ${l.con} | ${l.implication}`
      );
      return [sc, ...scRows, sw, ...swRows, st, ...stRows, tr, ...trRows, fl, ...flRows, lk, ...lkRows].join('\n');
    }

    default:
      return '';
  }
}

// ── Highlight numbers / percentages inside a text string ─────────────────────
function HL({ text, color = '#f59e0b' }) {
  if (!text || typeof text !== 'string') return null;
  // Split on: optional-minus + digits + optional-decimal + optional-%
  const parts = text.split(/([-+]?\d+\.?\d*%?)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^[-+]?\d/.test(p)
          ? <span key={i} style={{ color, fontWeight: 700 }}>{p}</span>
          : p
      )}
    </>
  );
}

// ── Per-icon accent colours for bullet cards ──────────────────────────────────
const BULLET_COLORS = {
  '🎯': { accent: '#60a5fa', bg: 'rgba(96,165,250,0.07)',  border: 'rgba(96,165,250,0.22)'  },
  '⚠️': { accent: '#f87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.22)' },
  '📈': { accent: '#34d399', bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.22)'  },
  '🔑': { accent: '#f59e0b', bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.22)'  },
  '💡': { accent: '#a78bfa', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.22)' },
  '🔍': { accent: '#e879f9', bg: 'rgba(232,121,249,0.07)', border: 'rgba(232,121,249,0.22)' },
};
const DEFAULT_BULLET_COLOR = { accent: '#94a3b8', bg: 'rgba(148,163,184,0.06)', border: 'rgba(148,163,184,0.18)' };

// ── Client-side JSON recovery: if backend sent raw JSON as the summary ────────
// ── Extract a quoted string value for a given key from (possibly truncated) JSON ─
function _rxStr(raw, key) {
  // Full match: closing quote present
  const full = raw.match(new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
  if (full) { try { return JSON.parse('"' + full[1] + '"'); } catch { return full[1]; } }
  // Partial match: string was truncated — grab everything after the opening quote
  const partial = raw.match(new RegExp('"' + key + '"\\s*:\\s*"([\\s\\S]*)'));
  if (partial) return partial[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim();
  return null;
}

function recoverOverview(ov) {
  if (!ov) return ov;

  // Case 1: overview itself was double-serialised as a string
  if (typeof ov === 'string') {
    try { ov = JSON.parse(ov); } catch { return null; }
  }

  const raw = typeof ov.summary === 'string' ? ov.summary.trim() : '';

  // No leakage — use as-is (includes the clean error message from the new backend fallback)
  if (!raw.startsWith('{')) return ov;

  // Case 2: summary contains the full valid JSON (backend parse succeeded differently)
  try {
    const full = JSON.parse(raw);
    if (full?.headline) return full;
  } catch { /* truncated — fall through to regex extraction */ }

  // Case 3: truncated JSON — regex-mine each field individually ──────────────
  const headline = _rxStr(raw, 'headline') || ov.headline || '';
  const summary  = _rxStr(raw, 'summary')  || '';

  // Extract bullets: match each { "icon": "...", "text": "..." } object
  const bullets = [];
  const bSection = raw.match(/"bullets"\s*:\s*\[([\s\S]*)/);
  if (bSection) {
    const iter = bSection[1].matchAll(/\{\s*"icon"\s*:\s*"([^"]+)"\s*,\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g);
    for (const m of iter) {
      try { bullets.push({ icon: m[1], text: JSON.parse('"' + m[2] + '"') }); }
      catch { bullets.push({ icon: m[1], text: m[2] }); }
    }
  }

  // Extract callout block
  let callout = null;
  const cSection = raw.match(/"callout"\s*:\s*\{([\s\S]*)/);
  if (cSection) {
    const cs    = cSection[1];
    const label = _rxStr(cs, 'label');
    const text  = _rxStr(cs, 'text');
    const color = _rxStr(cs, 'color');
    if (label || text) callout = { label: label || 'Bottom Line', text: text || '', color: color || '#f59e0b' };
  }

  return { headline, summary, bullets, callout };
}

function SwotAIOverview({ tab }) {
  const [state,    setState]    = useState('idle');  // idle | loading | done | error
  const [overview, setOverview] = useState(overviewCache[tab] || null);
  const [open,     setOpen]     = useState(false);

  const BASE = process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com';

  const load = useCallback(async () => {
    if (overviewCache[tab]) {
      setOverview(overviewCache[tab]);
      setState('done');
      setOpen(true);
      return;
    }
    setState('loading');
    setOpen(true);
    try {
      const token = sessionStorage.getItem('cc_token');
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
      const tabData = buildTabData(tab).slice(0, 10000); // hard cap — prevents 500s on large tabs
      const res = await window.fetch(`${BASE}/api/ai/swot-overview/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ tab, tabData }),
      });
      const data = await res.json();
      if (data?.success && data?.overview) {
        const safe = recoverOverview(data.overview);
        overviewCache[tab] = safe;
        setOverview(safe);
        setState('done');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }, [tab]);

  // Reset when tab changes
  useEffect(() => {
    if (overviewCache[tab]) {
      setOverview(overviewCache[tab]);
      setState('done');
    } else {
      setState('idle');
      setOverview(null);
    }
    setOpen(false);
  }, [tab]);

  const TAB_LABELS = {
    swot:        'Political SWOT',
    wards:       'Ward Strength',
    demographic: 'Demographics',
    election:    'Prev. Election',
  };

  const calloutColor = overview?.callout?.color || '#f59e0b';

  return (
    <div style={{ marginBottom: 18, animation: 'fadeUp 0.3s ease both' }}>
      <style>{`
        .swot-ai-shimmer {
          background: linear-gradient(90deg,rgba(51,65,85,0.5) 25%,rgba(99,102,241,0.3) 50%,rgba(51,65,85,0.5) 75%);
          background-size: 200% 100%;
          animation: swotShimmer 1.5s linear infinite;
        }
        @keyframes swotShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .ai-bullet-card { transition: background 0.18s, transform 0.18s; }
        .ai-bullet-card:hover { transform: translateX(2px); }
        .ai-regen-btn { transition: color 0.2s; }
        .ai-regen-btn:hover { color: rgba(165,180,252,0.7) !important; }
      `}</style>

      {/* ── Trigger button ─────────────────────────────────────────────────── */}
      <button
        onClick={state === 'loading' ? undefined : (open && state === 'done' ? () => setOpen(o => !o) : load)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px', borderRadius: 12,
          background: state === 'done' && open
            ? 'linear-gradient(135deg,rgba(99,102,241,0.14),rgba(79,70,229,0.08))'
            : 'rgba(255,255,255,0.03)',
          border: `1px solid ${state === 'done' ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
          cursor: state === 'loading' ? 'default' : 'pointer',
          transition: 'all 0.2s', fontFamily: 'Sora, sans-serif', textAlign: 'left',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: state === 'loading'
            ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(124,58,237,0.2))'
            : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: state === 'done' ? '0 0 16px rgba(99,102,241,0.5)' : 'none',
          transition: 'all 0.3s',
        }}>
          {state === 'loading' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round"
              style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity="0.25"/>
              <path d="M21 12a9 9 0 0 0-9-9"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          )}
        </div>

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: state === 'done' ? '#c7d2fe' : 'rgba(255,255,255,0.55)', lineHeight: 1.2 }}>
            {state === 'loading' ? 'ShaastraAI is analysing…'
              : state === 'done'  ? `AI Overview — ${TAB_LABELS[tab]}`
              : state === 'error' ? 'Analysis unavailable — tap to retry'
              : `Get AI Overview — ${TAB_LABELS[tab]}`}
          </div>
          {state === 'idle' && (
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>ShaastraAI</div>
          )}
          {state === 'done' && overview?.headline && (
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.32)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {overview.headline}
            </div>
          )}
        </div>

        {state === 'idle' && (
          <span style={{ fontSize: 10, fontWeight: 700, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', borderRadius: 6, padding: '3px 9px', flexShrink: 0, letterSpacing: '0.04em' }}>
            Generate
          </span>
        )}
        {state === 'done' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.6)" strokeWidth="2.5" strokeLinecap="round"
            style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <path d="M9 6l6 6-6 6"/>
          </svg>
        )}
      </button>

      {/* ── Loading shimmer ────────────────────────────────────────────────── */}
      {state === 'loading' && (
        <div style={{ marginTop: 10, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'rgba(99,102,241,0.6)', fontFamily: 'Sora, sans-serif', marginBottom: 10 }}>ShaastraAI is generating insight…</div>
            <AIGeneratingSteps />
          </div>
          {[78, 55, 68, 42].map((w, i) => (
            <div key={i} className="swot-ai-shimmer" style={{ width: `${w}%`, height: i === 0 ? 13 : 10, borderRadius: 6, marginBottom: i < 3 ? 12 : 0 }} />
          ))}
        </div>
      )}

      {/* ── Result panel ───────────────────────────────────────────────────── */}
      {state === 'done' && open && overview && (
        <div style={{
          marginTop: 8,
          background: 'linear-gradient(160deg,rgba(13,20,40,0.98),rgba(8,14,32,0.99))',
          border: '1px solid rgba(99,102,241,0.28)',
          borderRadius: 14, overflow: 'hidden',
          animation: 'fadeUp 0.25s ease both',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08) inset',
        }}>

          {/* ── Header: eyebrow + headline ───────────────────────────────── */}
          <div style={{
            padding: '16px 20px 14px',
            borderBottom: '1px solid rgba(99,102,241,0.13)',
            background: 'linear-gradient(135deg,rgba(79,70,229,0.12),rgba(124,58,237,0.06),transparent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 6px #818cf8' }} />
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Space Mono, monospace' }}>
                ShaastraAI · {TAB_LABELS[tab]}
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.35, letterSpacing: '-0.025em' }}>
              <TypewriterText text={overview.headline} speed={18} style={{ display: 'block' }} tag="span" />
            </div>
          </div>

          {/* ── Sparse-content fallback (recovery yielded only a headline) ─── */}
          {!overview.summary && !(overview.bullets?.length) && !overview.callout && (
            <div style={{
              padding: '20px 20px 22px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.08))',
                border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>⚡</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#e2e8f0', marginBottom: 5 }}>
                  Response incomplete — please regenerate
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(148,163,184,0.75)', lineHeight: 1.6, maxWidth: 340 }}>
                  The AI model returned a partial response this time. Tap <span style={{ color: '#fbbf24', fontWeight: 700 }}>Retry Now</span> — it resolves on the next attempt.
                </div>
              </div>
              <button
                onClick={() => { overviewCache[tab] = null; setOverview(null); setState('idle'); setOpen(false); setTimeout(load, 80); }}
                style={{
                  padding: '8px 22px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.4)',
                  background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                  transition: 'all 0.2s',
                }}
              >
                ↺ Retry Now
              </button>
            </div>
          )}

          {/* ── Summary ──────────────────────────────────────────────────── */}
          {overview.summary && !overview.summary.trim().startsWith('{') && (
            <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.78, letterSpacing: '0.005em' }}>
                <TypewriterText text={overview.summary} speed={7} />
              </p>
            </div>
          )}

          {/* ── Bullet insight cards ─────────────────────────────────────── */}
          {overview.bullets?.length > 0 && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {overview.bullets.map((b, i) => {
                const { accent, bg, border } = BULLET_COLORS[b.icon] || DEFAULT_BULLET_COLOR;
                return (
                  <div key={i} className="ai-bullet-card" style={{
                    display: 'flex', alignItems: 'flex-start', gap: 11,
                    background: bg, border: `1px solid ${border}`,
                    borderLeft: `3px solid ${accent}`,
                    borderRadius: 9, padding: '10px 13px',
                  }}>
                    {/* Icon badge */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: `${accent}18`, border: `1px solid ${accent}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, lineHeight: 1,
                    }}>
                      {b.icon}
                    </div>
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, color: '#dde4f0', lineHeight: 1.65, display: 'block' }}>
                        <TypewriterText text={b.text} speed={9} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Callout / bottom-line verdict ────────────────────────────── */}
          {overview.callout && (
            <div style={{
              margin: '14px 20px 16px',
              padding: '12px 16px',
              background: `${calloutColor}12`,
              border: `1px solid ${calloutColor}35`,
              borderRadius: 10,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: `linear-gradient(to bottom,${calloutColor},${calloutColor}44)`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: calloutColor,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    fontFamily: 'Space Mono, monospace',
                    background: `${calloutColor}18`, border: `1px solid ${calloutColor}30`,
                    borderRadius: 4, padding: '2px 7px',
                  }}>
                    {overview.callout.label || 'Bottom Line'}
                  </span>
                </div>
                <div style={{ fontSize: 13.5, color: '#f1f5f9', lineHeight: 1.6, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  <TypewriterText text={overview.callout.text} speed={12} />
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div style={{
            padding: '9px 20px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'pulse 2.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.2)', fontFamily: 'Space Mono, monospace' }}>
                Powered by Claude · Mangaluru South 2023 Data
              </span>
            </div>
            <button
              className="ai-regen-btn"
              onClick={() => { overviewCache[tab] = null; setOverview(null); setState('idle'); setOpen(false); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.18)', fontSize: 10, cursor: 'pointer', fontFamily: 'Sora, sans-serif', padding: 0 }}
            >
              ↺ Regenerate
            </button>
          </div>
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────────────── */}
      {state === 'error' && open && (
        <div style={{ marginTop: 8, padding: '13px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>Could not generate overview. Check your connection and try again.</span>
        </div>
      )}
    </div>
  );
}

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
      <div className="grid-4" style={{ marginBottom: 20 }}>
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
      <div className="grid-4" style={{ marginBottom: 20 }}>
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
      <div className="grid-4">
        {[
          { label: 'Ward Win Rate', value: '65.8%', sub: '25 of 38 wards', color: '#10b981', Icon: TrendingUp },
          { label: 'BJP Vote Share', value: '56.1%', sub: 'vs INC 42.0%', color: '#fb923c', Icon: Activity },
          { label: 'Majority Margin', value: '+14.1%', sub: 'over Congress', color: '#22d3ee', Icon: MapPin },
          { label: 'Strong Wards', value: '33/38', sub: 'Polling stations', color: '#a78bfa', Icon: CheckSquare },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <s.Icon size={16} color={s.color} strokeWidth={2} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: -0.5, marginBottom: 2, fontFamily: 'Space Mono, monospace' }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>{s.label}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 2028 Strategy */}
      <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={14} color="#f59e0b" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4ff' }}>2028 Election Strategy Priorities</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.75 }}>Derived from 2023 booth-level data · 38 wards · 246,952 voters</div>
          </div>
        </div>
        <div className="grid-2-sm">
          {strategyItems.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '9px 11px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
              <p.Icon size={13} color="#f59e0b" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{p.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginBottom: 12, fontFamily: 'Space Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <ChevronRight size={11} color="rgba(255,255,255,0.2)" />
        Tap any quadrant to expand detailed intelligence
      </div>

      {/* 2×2 SWOT Grid */}
      <div className="grid-2">
        {keys.map((key, idx) => {
          const q = swotPoints[key];
          const isH = hovered === key;
          return (
            <div key={key}
              onClick={() => setModalKey(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative', borderRadius: 14, padding: '16px 14px 14px',
                border: `1px solid ${isH ? q.border : 'rgba(255,255,255,0.07)'}`,
                background: isH ? `linear-gradient(145deg, ${q.bg}, rgba(10,18,35,0.98))` : 'rgba(15,23,42,0.6)',
                boxShadow: isH ? `0 8px 30px ${q.glow}` : 'none',
                transition: 'all 0.22s ease', overflow: 'hidden', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}>
              {/* watermark letter */}
              <div style={{ position: 'absolute', bottom: -8, right: 10, fontSize: 68, fontWeight: 900, color: q.color, opacity: 0.04, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'Sora, sans-serif' }}>{key}</div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: q.badgeBg, border: `1px solid ${q.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 4, gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500, flex: 1, lineHeight: 1.35 }}>{item.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: item.statColor, background: `${item.statColor}10`, border: `1px solid ${item.statColor}1e`, borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>{item.stat}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, opacity: isH ? 0.65 : 0.25, transition: 'opacity 0.2s' }}>
                <span style={{ fontSize: 9, color: q.color, fontFamily: 'Space Mono, monospace', fontWeight: 700, letterSpacing: 0.3 }}>VIEW DETAILS</span>
                <ChevronRight size={10} color={q.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalKey && (
        <div onClick={() => setModalKey(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 env(safe-area-inset-bottom, 0px)' }}>
          <div onClick={e => e.stopPropagation()} className="swot-modal-inner" style={{ background: 'linear-gradient(145deg, #0d1a30, #080d1a)', border: `1px solid ${swotPoints[modalKey].border}`, borderRadius: '18px 18px 0 0', padding: '20px 18px', maxWidth: 600, width: '100%', boxShadow: `0 -16px 60px ${swotPoints[modalKey].glow}`, maxHeight: '88vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: swotPoints[modalKey].badgeBg, border: `1px solid ${swotPoints[modalKey].border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {React.createElement(swotPoints[modalKey].Icon, { size: 16, color: swotPoints[modalKey].color, strokeWidth: 2 })}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#f0f4ff', fontFamily: 'Sora, sans-serif' }}>{swotPoints[modalKey].title}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: swotPoints[modalKey].color, opacity: 0.75 }}>{swotPoints[modalKey].subtitle}</div>
                </div>
              </div>
              <button onClick={() => setModalKey(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XIcon size={14} />
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


// ─── Context SVG icon components ──────────────────────────────────────────────
const CtxIcon = ({ paths, color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}>
    {paths.map((d, i) => <path key={i} d={d} />)}
  </svg>
);

// ─── ML Intelligence Tab ─────────────────────────────────────────────────────
const CONTEXT_KEYS = [
  { key: 'Economic_context',       label: 'Economic',          color: '#10b981', IconPaths: PATHS.Economic    },
  { key: 'Employment_context',     label: 'Employment',        color: '#f59e0b', IconPaths: PATHS.Employment  },
  { key: 'Health_context',         label: 'Health',            color: '#f87171', IconPaths: PATHS.Health      },
  { key: 'Hometype_context',       label: 'Home Type',         color: '#a78bfa', IconPaths: PATHS.HomeType    },
  { key: 'Education_context',      label: 'Education',         color: '#22d3ee', IconPaths: PATHS.Education   },
  { key: 'PL_Religion_context',    label: 'Religion (PL)',     color: '#fb923c', IconPaths: PATHS.Religion    },
  { key: 'PL_Community_context',   label: 'Community (PL)',    color: '#60a5fa', IconPaths: PATHS.Community   },
  { key: 'PL_Economic_context',    label: 'Economic (PL)',     color: '#34d399', IconPaths: PATHS.EconomicPL  },
  { key: 'Political_context',      label: 'Political',         color: '#e879f9', IconPaths: PATHS.Political   },
  { key: 'Administrative_context', label: 'Administrative',    color: '#fbbf24', IconPaths: PATHS.Admin       },
];

// ─── Step-by-step generation indicator ───────────────────────────────────────
function AIGeneratingSteps() {
  const steps = [
    'Reading voter demographics…',
    'Mapping SWOT signals…',
    'Identifying scheme relevance…',
    'Generating strategic insight…',
  ];
  const [step, setStep] = React.useState(0);
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % steps.length), 900);
    const dv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 280);
    return () => { clearInterval(iv); clearInterval(dv); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 240, margin: '0 auto' }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px',
          borderRadius: 6,
          background: i === step ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${i === step ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.04)'}`,
          transition: 'all 0.3s',
          opacity: i < step ? 0.35 : i === step ? 1 : 0.4,
        }}>
          <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: i < step ? '#10b981' : i === step ? '#a78bfa' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
            {i < step ? '✓' : i === step ? '▶' : '○'}
          </span>
          <span style={{ fontSize: 9, fontFamily: 'Sora, sans-serif', color: i === step ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.25)' }}>
            {s}{i === step ? dots : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── New label system: Dominant / Major / Moderate / Minor ───────────────────
const LABEL_META = {
  Dominant: { color: '#f59e0b', bg: 'rgba(245,158,11,0.09)',  border: 'rgba(245,158,11,0.28)',  glow: 'rgba(245,158,11,0.18)'  },
  Major:    { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.15)'  },
  Moderate: { color: '#22d3ee', bg: 'rgba(34,211,238,0.07)',  border: 'rgba(34,211,238,0.22)',  glow: 'rgba(34,211,238,0.12)'  },
  Minor:    { color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.22)', glow: 'rgba(167,139,250,0.12)' },
  None:     { color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', glow: 'transparent' },
};

function getLabelMeta(label) {
  return LABEL_META[label] || LABEL_META.None;
}

// Legacy decode kept for predictedContext expansion (S/W/O/T codes still in context fields)
function decodeLabel(raw) {
  if (!raw || raw === 'None') return { swot: null, band: null };
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  const swotMap = { S: 'Strength', W: 'Weakness', O: 'Opportunity', T: 'Threat' };
  const bandMap = { H: 'High', M: 'Medium', L: 'Low', A: 'Avg' };
  let swot = [], band = [];
  for (const p of parts) {
    if (swotMap[p]) swot.push(swotMap[p]);
    else if (bandMap[p]) band.push(bandMap[p]);
  }
  return { swot, band };
}

function swotColors(swot) {
  if (!swot || swot.length === 0) return { color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' };
  const s = swot[0];
  if (s === 'Strength')    return { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)' };
  if (s === 'Weakness')    return { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.22)' };
  if (s === 'Opportunity') return { color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.22)' };
  if (s === 'Threat')      return { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.22)' };
  return { color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' };
}

// ─── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(targetText, speed = 18, enabled = true) {
  const [displayed, setDisplayed] = React.useState('');
  const rafRef = React.useRef(null);
  const indexRef = React.useRef(0);

  React.useEffect(() => {
    if (!enabled || !targetText) { setDisplayed(targetText || ''); return; }
    indexRef.current = 0;
    setDisplayed('');

    const tick = () => {
      indexRef.current += 1;
      setDisplayed(targetText.slice(0, indexRef.current));
      if (indexRef.current < targetText.length) {
        rafRef.current = setTimeout(tick, speed);
      }
    };
    rafRef.current = setTimeout(tick, speed);
    return () => clearTimeout(rafRef.current);
  }, [targetText, speed, enabled]);

  return displayed;
}

// ─── Typewriter text component ────────────────────────────────────────────────
function TypewriterText({ text, speed = 14, style = {}, tag = 'span' }) {
  const displayed = useTypewriter(text, speed, Boolean(text));
  const Tag = tag;
  return (
    <Tag style={style}>
      {displayed}
      {displayed.length < (text || '').length && (
        <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'rgba(167,139,250,0.7)', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'twBlink 0.7s step-end infinite' }} />
      )}
    </Tag>
  );
}

function QueryCard({ q, ctxKey, ctxColor }) {
  const [open, setOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiText, setAiText] = React.useState('');
  const [aiReveal, setAiReveal] = React.useState(false); // triggers typewriter start

  const ctx = q.predictedContext || {};
  const label = q.label || 'None';
  const lm = getLabelMeta(label);
  const pct = q.percentage != null ? parseFloat(q.percentage).toFixed(1) : '—';
  const count = q.count != null ? q.count.toLocaleString() : '—';
  const query = q.query || {};
  const cols = q.columns || [];

  const handleAI = async (e) => {
    e.stopPropagation();
    if (aiOpen) { setAiOpen(false); return; }
    setAiOpen(true);
    if (aiText) return; // already loaded
    setAiLoading(true);
    setAiReveal(false);

    try {
      // Route through Django backend to avoid CORS — never call Anthropic directly from browser
      const token = sessionStorage.getItem('cc_token');
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
      const BASE = process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com';

      const res = await fetch(`${BASE}/api/ai/query-insight/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          query: query,
          columns: cols,
          count: q.count,
          percentage: q.percentage,
          label: label,
          routeKey: q.routeKey,
          predictedContext: ctx,
        }),
      });
      const data = await res.json();
      if (data.success && data.insight) {
        setAiText(data.insight);
      } else {
        setAiText({ _raw: data.error || 'No insight returned.' });
      }
    } catch (err) {
      setAiText({ _raw: 'Failed to fetch AI insight. Please try again.' });
    }
    setAiLoading(false);
    setAiReveal(true);
  };

  return (
    <div style={{
      background: lm.bg, border: `1px solid ${lm.border}`,
      borderRadius: 10, padding: '11px 13px', marginBottom: 8,
      transition: 'all 0.18s',
    }}>
      {/* Top row — clickable for expand */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#e8eeff', lineHeight: 1.4, marginBottom: 4, fontFamily: 'Sora, sans-serif' }}>
            {cols.join(' · ') || q.routeKey || '—'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {Object.entries(query).map(([k, v]) => v && v !== 'Unknown' && (
              <span key={k} style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 4, padding: '1px 6px', fontFamily: 'Space Mono, monospace' }}>
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
        {/* Label badge */}
        <span style={{ fontSize: 9, fontWeight: 800, color: lm.color, background: `${lm.color}14`, border: `1px solid ${lm.color}30`, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap', fontFamily: 'Space Mono, monospace', letterSpacing: 0.3, flexShrink: 0 }}>
          {label}
        </span>
      </div>

      {/* Stats row + AI button */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* AI button */}
        <button
          onClick={handleAI}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 6, border: `1px solid ${aiOpen ? '#a78bfa44' : 'rgba(167,139,250,0.25)'}`,
            background: aiOpen ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.06)',
            color: aiOpen ? '#a78bfa' : 'rgba(167,139,250,0.7)',
            fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: 'Space Mono, monospace',
            transition: 'all 0.15s', letterSpacing: 0.3, flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10 }}>✦</span> AI
        </button>

        <div style={{ fontSize: 9.5, fontFamily: 'Space Mono, monospace', color: ctxColor, fontWeight: 700 }}>{pct}%</div>
        <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.28)', fontFamily: 'Space Mono, monospace' }}>{count} voters</div>
        <div style={{ marginLeft: 'auto', fontSize: 8.5, color: 'rgba(255,255,255,0.2)', fontFamily: 'Space Mono, monospace', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>{open ? '▲ collapse' : '▼ all contexts'}</div>
      </div>

      {/* AI insight panel — rich structured */}
      {aiOpen && (
        <div style={{ marginTop: 10, borderRadius: 10, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.22)', overflow: 'hidden' }}>
          <style>{`
            @keyframes twBlink { 0%,100%{opacity:1} 50%{opacity:0} }
            @keyframes aiStepIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
            .ai-section-anim { animation: aiStepIn 0.35s ease both; }
          `}</style>
          {/* Header */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 8.5, color: '#a78bfa', fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: 'Space Mono, monospace', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11 }}>✦</span> AI Deep Insight
            </div>
            {!aiLoading && aiText && !aiText._raw && aiText.riskLevel && (
              <span style={{ fontSize: 8.5, fontWeight: 800, color: aiText.riskColor || '#f59e0b', background: `${aiText.riskColor || '#f59e0b'}18`, border: `1px solid ${aiText.riskColor || '#f59e0b'}35`, borderRadius: 4, padding: '2px 8px', fontFamily: 'Space Mono, monospace' }}>
                {aiText.riskLevel} Risk
              </span>
            )}
          </div>

          {aiLoading ? (
            <div style={{ padding: '18px 12px', textAlign: 'center' }}>
              {/* Step-by-step generation indicator */}
              <div style={{ fontSize: 22, animation: 'spin 1.2s linear infinite', display: 'inline-block', marginBottom: 10 }}>✦</div>
              <div style={{ fontSize: 10.5, color: 'rgba(167,139,250,0.7)', fontFamily: 'Sora, sans-serif', marginBottom: 8 }}>Analysing voter segment…</div>
              <AIGeneratingSteps />
            </div>
          ) : aiText && aiText._raw ? (
            <p style={{ padding: '10px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0, fontFamily: 'Sora, sans-serif' }}>{aiText._raw}</p>
          ) : aiText ? (
            <div style={{ padding: '10px 12px' }}>
              {/* Headline — typewriter */}
              {aiText.headline && (
                <div className="ai-section-anim" style={{ fontSize: 12.5, fontWeight: 800, color: '#e8eeff', lineHeight: 1.3, marginBottom: 7, fontFamily: 'Sora, sans-serif', minHeight: 18 }}>
                  <TypewriterText text={aiText.headline} speed={22} />
                </div>
              )}
              {/* Summary — typewriter with slight delay feel */}
              {aiText.summary && (
                <div className="ai-section-anim" style={{ animationDelay: '0.1s' }}>
                  <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 10px', fontFamily: 'Sora, sans-serif' }}>
                    <TypewriterText text={aiText.summary} speed={8} />
                  </p>
                </div>
              )}

              {/* Key Figures */}
              {aiText.keyFigures && (
                <div className="ai-section-anim" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 5, marginBottom: 10, animationDelay: '0.15s' }}>
                  {aiText.keyFigures.map((f, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '7px 9px' }}>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', fontFamily: 'Space Mono, monospace', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#a78bfa', fontFamily: 'Space Mono, monospace', lineHeight: 1.1 }}>
                        <TypewriterText text={String(f.value)} speed={30} />
                      </div>
                      {f.note && <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.28)', marginTop: 2, fontFamily: 'Sora, sans-serif' }}>{f.note}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Bar Chart */}
              {aiText.barChart && (
                <div className="ai-section-anim" style={{ marginBottom: 10, animationDelay: '0.2s' }}>
                  <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Mono, monospace', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{aiText.barChart.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(aiText.barChart.bars || []).map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 34, fontSize: 8.5, color: 'rgba(255,255,255,0.4)', fontFamily: 'Space Mono, monospace', flexShrink: 0, textAlign: 'right' }}>{b.party}</div>
                        <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            width: `${Math.max(2, Math.min(100, b.pct))}%`, height: '100%',
                            background: b.color || '#a78bfa',
                            borderRadius: 4,
                            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                          }} />
                        </div>
                        <div style={{ width: 30, fontSize: 8.5, fontWeight: 700, color: b.color || '#a78bfa', fontFamily: 'Space Mono, monospace', textAlign: 'right', flexShrink: 0 }}>{b.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SWOT Breakdown */}
              {aiText.swotBreakdown && (
                <div className="ai-section-anim" style={{ marginBottom: 10, animationDelay: '0.25s' }}>
                  <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Mono, monospace', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>{aiText.swotBreakdown.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(aiText.swotBreakdown.items || []).map((it, i) => {
                      const sigColors = { S: '#10b981', W: '#f87171', O: '#22d3ee', T: '#fb923c', N: 'rgba(255,255,255,0.2)' };
                      const sc = sigColors[it.signal] || it.color || '#a78bfa';
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.025)', borderRadius: 6, padding: '4px 8px' }}>
                          <span style={{ fontSize: 8.5, fontWeight: 800, color: sc, background: `${sc}15`, border: `1px solid ${sc}30`, borderRadius: 3, padding: '1px 5px', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>{it.signal}</span>
                          <span style={{ fontSize: 9, color: sc, fontWeight: 700, fontFamily: 'Sora, sans-serif', flexShrink: 0 }}>{it.ctx}</span>
                          <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'Sora, sans-serif' }}>{it.note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Suggested Schemes ── */}
              {aiText.suggestedSchemes && aiText.suggestedSchemes.length > 0 && (
                <div className="ai-section-anim" style={{ marginBottom: 10, animationDelay: '0.3s' }}>
                  <div style={{ fontSize: 8.5, color: '#10b981', fontFamily: 'Space Mono, monospace', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>⊕</span> Applicable Government Schemes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {(aiText.suggestedSchemes || []).map((sc, i) => {
                      const impactColor = sc.impact === 'High' ? '#10b981' : sc.impact === 'Medium' ? '#f59e0b' : '#6b7280';
                      return (
                        <div key={i} style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 7, padding: '7px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                            <div style={{ fontSize: 9.5, fontWeight: 800, color: '#34d399', fontFamily: 'Sora, sans-serif' }}>
                              <TypewriterText text={sc.name} speed={20} />
                            </div>
                            <span style={{ fontSize: 7.5, fontWeight: 800, color: impactColor, background: `${impactColor}18`, border: `1px solid ${impactColor}30`, borderRadius: 3, padding: '1px 6px', fontFamily: 'Space Mono, monospace', flexShrink: 0, marginLeft: 6 }}>{sc.impact}</span>
                          </div>
                          {sc.ministry && <div style={{ fontSize: 8, color: 'rgba(52,211,153,0.5)', fontFamily: 'Space Mono, monospace', marginBottom: 3, letterSpacing: 0.3 }}>{sc.ministry}</div>}
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', fontFamily: 'Sora, sans-serif', lineHeight: 1.5 }}>{sc.relevance}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendation — typewriter */}
              {aiText.recommendation && (
                <div className="ai-section-anim" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: 7, padding: '7px 10px', animationDelay: '0.35s' }}>
                  <div style={{ fontSize: 8, color: '#a78bfa', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Space Mono, monospace' }}>✦ Strategic Recommendation</div>
                  <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0, fontFamily: 'Sora, sans-serif' }}>
                    <TypewriterText text={aiText.recommendation} speed={10} />
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Expanded: all predicted contexts */}
      {open && (
        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginBottom: 6, fontFamily: 'Space Mono, monospace', letterSpacing: 0.4, textTransform: 'uppercase' }}>All Predicted Contexts</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 5 }}>
            {CONTEXT_KEYS.map(ck => {
              const rv = ctx[ck.key] || 'None';
              const { swot: sw } = decodeLabel(rv);
              const { color } = swotColors(sw);
              return (
                <div key={ck.key} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22`, borderRadius: 6, padding: '5px 8px' }}>
                  <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CtxIcon paths={ck.IconPaths} color="rgba(255,255,255,0.3)" size={10} />
                    {ck.label}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, fontFamily: 'Space Mono, monospace' }}>{rv}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SWOT quadrant meta ───────────────────────────────────────────────────────
const SWOT_META = {
  Strength:    { color: '#10b981', bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.25)',  label: 'Strength',    sub: 'Internal · Positive', code: 'S' },
  Weakness:    { color: '#f87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.25)', label: 'Weakness',    sub: 'Internal · Negative', code: 'W' },
  Opportunity: { color: '#22d3ee', bg: 'rgba(34,211,238,0.07)',  border: 'rgba(34,211,238,0.25)',  label: 'Opportunity', sub: 'External · Positive', code: 'O' },
  Threat:      { color: '#fb923c', bg: 'rgba(251,146,60,0.07)',  border: 'rgba(251,146,60,0.25)',  label: 'Threat',      sub: 'External · Negative', code: 'T' },
  None:        { color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', label: 'Unclassified', sub: '', code: '—' },
};
const SWOT_ORDER = ['Strength', 'Weakness', 'Opportunity', 'Threat'];
const LABEL_ORDER = ['Dominant', 'Major', 'Moderate', 'Minor'];

// Decode a predictedContext value like "W", "S,O", "None" → array of SWOT keys
function ctxToSwot(raw) {
  if (!raw || raw === 'None') return [];
  const map = { S: 'Strength', W: 'Weakness', O: 'Opportunity', T: 'Threat' };
  return raw.split(',').map(s => s.trim()).map(s => map[s]).filter(Boolean);
}

// Sub-panel: shows queries for ONE swot bucket, broken down by Dominant/Major/Moderate/Minor
function LabelBreakdown({ queries, ctxKey, ctxColor, swotMeta }) {
  const [activeLbl, setActiveLbl] = React.useState('Dominant');

  const lblBuckets = { Dominant: [], Major: [], Moderate: [], Minor: [], None: [] };
  for (const q of queries) {
    const lbl = q.label || 'None';
    if (lblBuckets[lbl] !== undefined) lblBuckets[lbl].push(q);
    else lblBuckets.None.push(q);
  }

  // Auto-select first non-empty label on mount / when queries change
  React.useEffect(() => {
    const first = LABEL_ORDER.find(l => lblBuckets[l].length > 0) || 'Dominant';
    setActiveLbl(first);
  }, [queries.length]);

  return (
    <div style={{ marginTop: 10 }}>
      {/* Label sub-filter row */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {LABEL_ORDER.map(lbl => {
          const lm = getLabelMeta(lbl);
          const cnt = lblBuckets[lbl].length;
          const active = activeLbl === lbl;
          return (
            <button key={lbl} onClick={() => setActiveLbl(lbl)}
              style={{
                padding: '5px 12px', borderRadius: 7,
                background: active ? lm.bg : 'rgba(255,255,255,0.025)',
                border: `1px solid ${active ? lm.color : 'rgba(255,255,255,0.07)'}`,
                color: active ? lm.color : 'rgba(255,255,255,0.3)',
                fontSize: 10, fontWeight: 700, cursor: cnt ? 'pointer' : 'default',
                fontFamily: 'Sora, sans-serif', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 5,
                opacity: cnt ? 1 : 0.4,
              }}>
              {lbl}
              <span style={{ fontSize: 8.5, fontFamily: 'Space Mono, monospace', opacity: 0.75 }}>({cnt})</span>
            </button>
          );
        })}
      </div>

      {/* Query list */}
      <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 2 }}>
        {(lblBuckets[activeLbl] || []).length === 0 ? (
          <div style={{ padding: '18px', textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 11 }}>
            No {activeLbl} queries in this SWOT category
          </div>
        ) : (
          (lblBuckets[activeLbl] || []).slice(0, 60).map((q, i) => (
            <QueryCard key={i} q={q} ctxKey={ctxKey} ctxColor={ctxColor} />
          ))
        )}
        {(lblBuckets[activeLbl] || []).length > 60 && (
          <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', padding: 8, fontFamily: 'Space Mono, monospace' }}>
            Showing 60 of {lblBuckets[activeLbl].length}
          </div>
        )}
      </div>
    </div>
  );
}

function ContextSWOTPanel({ queries, ctxKey, ctxColor, ctxLabel }) {
  // ── Level 1: bucket by SWOT from predictedContext[ctxKey] ─────────────────
  const swotBuckets = { Strength: [], Weakness: [], Opportunity: [], Threat: [], None: [] };
  for (const q of queries) {
    const raw = (q.predictedContext || {})[ctxKey] || 'None';
    const swots = ctxToSwot(raw);
    if (swots.length === 0) { swotBuckets.None.push(q); }
    else { for (const s of swots) { if (swotBuckets[s]) swotBuckets[s].push(q); } }
  }

  const total = queries.length;
  const [activeSwot, setActiveSwot] = React.useState('Strength');

  // Auto-select first non-empty SWOT bucket
  React.useEffect(() => {
    const first = SWOT_ORDER.find(s => swotBuckets[s].length > 0) || 'Strength';
    setActiveSwot(first);
  }, [ctxKey, queries.length]);

  const activeMeta = SWOT_META[activeSwot] || SWOT_META.None;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Context header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${ctxColor}14`, border: `1px solid ${ctxColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CtxIcon paths={CONTEXT_KEYS.find(c => c.key === ctxKey)?.IconPaths || PATHS.EconomicPL} color={ctxColor} size={16} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#eef2ff', fontFamily: 'Sora, sans-serif' }}>{ctxLabel}</div>
          <div style={{ fontSize: 9, color: ctxColor, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.8 }}>{total} queries · classified by SWOT then impact</div>
        </div>
        {/* Mini SWOT count pills */}
        <div style={{ display: 'flex', gap: 5, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {SWOT_ORDER.map(s => swotBuckets[s].length > 0 && (
            <span key={s} style={{ fontSize: 9, fontWeight: 800, color: SWOT_META[s].color, background: `${SWOT_META[s].color}12`, border: `1px solid ${SWOT_META[s].color}28`, borderRadius: 5, padding: '2px 7px', fontFamily: 'Space Mono, monospace' }}>
              {SWOT_META[s].code} · {swotBuckets[s].length}
            </span>
          ))}
        </div>
      </div>

      {/* ── Level 1: SWOT tab row ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {SWOT_ORDER.map(s => {
          const sm = SWOT_META[s];
          const cnt = swotBuckets[s].length;
          const active = activeSwot === s;
          return (
            <button key={s} onClick={() => setActiveSwot(s)}
              style={{
                padding: '9px 16px', borderRadius: 9,
                background: active ? sm.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? sm.color : 'rgba(255,255,255,0.08)'}`,
                color: active ? sm.color : 'rgba(255,255,255,0.32)',
                fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                transition: 'all 0.18s', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                minWidth: 90, opacity: cnt ? 1 : 0.45,
              }}>
              <span>{sm.label}</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, opacity: 0.6, fontFamily: 'Space Mono, monospace' }}>{sm.sub} · {cnt}</span>
            </button>
          );
        })}
        {swotBuckets.None.length > 0 && (
          <button onClick={() => setActiveSwot('None')}
            style={{
              padding: '9px 16px', borderRadius: 9,
              background: activeSwot === 'None' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${activeSwot === 'None' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
              color: 'rgba(255,255,255,0.28)', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Sora, sans-serif', transition: 'all 0.18s',
            }}>
            Unclassified · {swotBuckets.None.length}
          </button>
        )}
      </div>

      {/* Active SWOT section card */}
      {activeSwot && (
        <div style={{
          background: activeMeta.bg, border: `1px solid ${activeMeta.border}`,
          borderRadius: 12, padding: '14px 14px 10px',
        }}>
          {/* SWOT section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: activeMeta.color, fontFamily: 'Sora, sans-serif' }}>
              {activeMeta.label}
            </span>
            <span style={{ fontSize: 9, color: activeMeta.color, opacity: 0.6, fontFamily: 'Space Mono, monospace' }}>{activeMeta.sub}</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, color: activeMeta.color, background: `${activeMeta.color}15`, border: `1px solid ${activeMeta.color}30`, borderRadius: 4, padding: '1px 8px', fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>
              {(swotBuckets[activeSwot] || []).length} queries
            </span>
          </div>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.2)', marginBottom: 10, fontFamily: 'Space Mono, monospace', letterSpacing: 0.3 }}>
            ↳ broken down by impact level:
          </div>

          {/* ── Level 2: Dominant / Major / Moderate / Minor ─────────────────── */}
          <LabelBreakdown
            key={activeSwot}
            queries={swotBuckets[activeSwot] || []}
            ctxKey={ctxKey}
            ctxColor={activeMeta.color}
            swotMeta={activeMeta}
          />
        </div>
      )}
    </div>
  );
}

// ─── Bird's Eye AI Panel ────────────────────────────────────────────────────
function BirdsEyeAIPanel({ queries, selectedCtx }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [insight, setInsight] = React.useState(null);

  const handleGenerate = async () => {
    if (open) { setOpen(false); return; }   // toggle off
    setOpen(true);
    if (insight) return;                     // already loaded, just re-open
    setLoading(true);

    // Build aggregate stats from queries for the selected context
    const swotCount = { Strength: 0, Weakness: 0, Opportunity: 0, Threat: 0, None: 0 };
    const labelCount = {};
    const filterFreq = {};

    for (const q of queries) {
      const raw = (q.predictedContext || {})[selectedCtx] || 'None';
      const swots = ctxToSwot(raw);
      if (swots.length === 0) swotCount.None++;
      else { for (const s of swots) { if (swotCount[s] !== undefined) swotCount[s]++; } }
      const lb = q.label || 'None';
      labelCount[lb] = (labelCount[lb] || 0) + 1;
      for (const [k, v] of Object.entries(q.query || {})) {
        if (v && v !== 'Unknown') {
          const key = `${k}:${v}`;
          filterFreq[key] = (filterFreq[key] || 0) + 1;
        }
      }
    }

    const totalVoters = queries.reduce((s, q) => s + (q.count || 0), 0);

    try {
      // Route through Django backend to avoid CORS — never call Anthropic directly from browser
      const BASE = process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com';
      const token = sessionStorage.getItem('cc_token');
      const headers = token
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
      const res = await fetch(`${BASE}/api/ai/birdseye-view/`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ contextKey: selectedCtx, queries, totalVoters }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Server error');
      setInsight(data.insight);
    } catch (err) {
      setInsight({ _raw: 'Failed to generate bird\'s eye view. Error: ' + (err?.message || 'Unknown') });
    }
    setLoading(false);
  };

  const winPct = insight && !insight._raw ? (insight.winProbability || 0) : 0;
  const winColor = winPct >= 60 ? '#10b981' : winPct >= 45 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Trigger bar */}
      <div
        style={{
          background: open ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.04)',
          border: `1px solid ${open ? 'rgba(167,139,250,0.35)' : 'rgba(167,139,250,0.18)'}`,
          borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
        }}
      >
        <button
          onClick={handleGenerate}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', fontFamily: 'Sora, sans-serif' }}>AI Bird's Eye View</div>
            <div style={{ fontSize: 9, color: 'rgba(167,139,250,0.5)', fontFamily: 'Space Mono, monospace', marginTop: 1 }}>
              {insight ? 'Constituency-wide strategic synthesis' : `Analyse all ${queries.length} queries → strategic overview`}
            </div>
          </div>
          {loading ? (
            <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.5)', animation: 'pulse 1.4s infinite', fontFamily: 'Space Mono, monospace' }}>Thinking…</div>
          ) : insight && !insight._raw ? (
            <span style={{ fontSize: 8.5, fontWeight: 800, color: winColor, background: `${winColor}15`, border: `1px solid ${winColor}30`, borderRadius: 5, padding: '2px 10px', fontFamily: 'Space Mono, monospace' }}>
              Win Prob: {winPct}%
            </span>
          ) : (
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#a78bfa', fontFamily: 'Space Mono, monospace', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)', borderRadius: 5, padding: '3px 10px' }}>
              {open ? '▲ hide' : 'Generate ▶'}
            </span>
          )}
        </button>

        {/* Panel body */}
        {open && (
          <div style={{ borderTop: '1px solid rgba(167,139,250,0.15)', padding: '14px 16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 26, animation: 'spin 1.2s linear infinite', display: 'inline-block', marginBottom: 10 }}>✦</div>
                <div style={{ fontSize: 11, color: 'rgba(167,139,250,0.5)', fontFamily: 'Sora, sans-serif', marginBottom: 10 }}>Synthesising {queries.length} voter segments…</div>
                <AIGeneratingSteps />
              </div>
            ) : insight && insight._raw ? (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0, fontFamily: 'Sora, sans-serif' }}>{insight._raw}</p>
            ) : insight ? (
              <>
                {/* Headline — typewriter */}
                <div style={{ fontSize: 14, fontWeight: 800, color: '#eef2ff', marginBottom: 8, fontFamily: 'Sora, sans-serif', lineHeight: 1.3 }}>
                  <TypewriterText text={insight.headline} speed={20} />
                </div>

                {/* Key Metrics row */}
                {insight.keyMetrics && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, marginBottom: 14 }}>
                    {insight.keyMetrics.map((m, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${m.color}25`, borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.28)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{m.label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: m.color, fontFamily: 'Space Mono, monospace', lineHeight: 1.1 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Executive Summary */}
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 14px', fontFamily: 'Sora, sans-serif' }}>{insight.executiveSummary}</p>

                {/* SWOT Radar — visual bar */}
                {insight.swotRadar && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.28)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>SWOT Intensity Score (0-100)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {insight.swotRadar.map((r, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            <span style={{ width: 70, fontSize: 9, fontWeight: 700, color: r.color, fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>{r.axis}</span>
                            <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                              <div style={{ width: `${Math.min(100, r.score)}%`, height: '100%', background: `linear-gradient(90deg, ${r.color}aa, ${r.color})`, borderRadius: 5, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                            </div>
                            <span style={{ width: 28, fontSize: 9, fontWeight: 800, color: r.color, fontFamily: 'Space Mono, monospace', textAlign: 'right', flexShrink: 0 }}>{r.score}</span>
                          </div>
                          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif', paddingLeft: 77 }}>{r.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Win Probability gauge */}
                {insight.winProbability !== undefined && (
                  <div style={{ marginBottom: 14, background: `${winColor}08`, border: `1px solid ${winColor}22`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.28)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>2028 Win Probability</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: winColor, fontFamily: 'Space Mono, monospace', lineHeight: 1 }}>{winPct}<span style={{ fontSize: 14 }}>%</span></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
                        <div style={{ width: `${winPct}%`, height: '100%', background: `linear-gradient(90deg, ${winColor}88, ${winColor})`, borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                      </div>
                      {insight.confidenceNote && <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.28)', fontFamily: 'Sora, sans-serif' }}>{insight.confidenceNote}</div>}
                    </div>
                  </div>
                )}

                {/* Strategic Pillars */}
                {insight.strategicPillars && (
                  <div>
                    <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.28)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 }}>Strategic 2028 Pillars</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                      {insight.strategicPillars.map((p, i) => (
                        <div key={i} style={{ background: `${p.color}07`, border: `1px solid ${p.color}22`, borderRadius: 8, padding: '9px 10px' }}>
                          <div style={{ fontSize: 8.5, fontWeight: 800, color: p.color, fontFamily: 'Space Mono, monospace', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>{p.title}</div>
                          <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)', fontFamily: 'Sora, sans-serif', lineHeight: 1.5 }}>{p.body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function MLIntelligenceTab() {
  const [scope, setScope] = React.useState('constituency'); // 'constituency' | 'ward'
  const [selectedWard, setSelectedWard] = React.useState('');
  const [selectedCtx, setSelectedCtx] = React.useState(CONTEXT_KEYS[0].key);
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [wardList, setWardList] = React.useState([]);

  // Helper: get JWT token from sessionStorage (same as client.js interceptor)
  const authHeaders = () => {
    const token = sessionStorage.getItem('cc_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const BASE = process.env.REACT_APP_API_URL || 'https://production-web-conn-2.onrender.com';

  // Load ward list once
  React.useEffect(() => {
    fetch(`${BASE}/api/wards/`, { credentials: 'include', headers: authHeaders() })
      .then(r => r.json())
      .then(d => setWardList(Array.isArray(d.wards) ? d.wards : []))
      .catch(() => {});
  }, []);

  const fetchData = React.useCallback(() => {
    setLoading(true); setError(null); setData(null);
    // Always use constituency endpoint (ward-wise is in progress)
    const url = `${BASE}/api/ml/constituency-swot/`;
    fetch(url, { credentials: 'include', headers: authHeaders() })
      .then(r => {
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error(`Server returned ${r.status} — route not found or not JSON. Check Django urls.py has ml/ routes registered.`);
        return r.json();
      })
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d); setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [scope, selectedWard]);

  React.useEffect(() => {
    if (scope === 'constituency') fetchData();
  }, [scope]);

  const queries = data?.queries || [];
  const activeMeta = CONTEXT_KEYS.find(c => c.key === selectedCtx);

  // Aggregate SWOT counts for selected context (Level 1 summary bar)
  const swotSummary = { Strength: 0, Weakness: 0, Opportunity: 0, Threat: 0, None: 0 };
  for (const q of queries) {
    const raw = (q.predictedContext || {})[selectedCtx] || 'None';
    const swots = ctxToSwot(raw);
    if (swots.length === 0) swotSummary.None++;
    else { for (const s of swots) if (swotSummary[s] !== undefined) swotSummary[s]++; }
  }

  return (
    <div>
      {/* Scope toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {/* Constituency — active */}
        <button onClick={() => { setScope('constituency'); setData(null); }}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            background: scope === 'constituency' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${scope === 'constituency' ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.09)'}`,
            color: scope === 'constituency' ? '#f59e0b' : 'rgba(255,255,255,0.35)',
            fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
            transition: 'all 0.18s', textAlign: 'left',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CtxIcon paths={PATHS.Political} color={scope === 'constituency' ? '#f59e0b' : 'rgba(255,255,255,0.35)'} size={14} />
            Constituency SWOT
          </div>
          <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2, fontFamily: 'Space Mono, monospace' }}>Mangalore South · 175</div>
        </button>

        {/* Ward-wise — disabled / in progress */}
        <button
          disabled
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.2)',
            fontSize: 11.5, fontWeight: 700, cursor: 'not-allowed', fontFamily: 'Sora, sans-serif',
            textAlign: 'left', opacity: 0.7,
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CtxIcon paths={PATHS.MapPin} color="rgba(255,255,255,0.2)" size={14} />
            Ward-wise SWOT
            <span style={{ fontSize: 8.5, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', borderRadius: 4, padding: '1px 6px', fontFamily: 'Space Mono, monospace', letterSpacing: 0.4, textTransform: 'uppercase' }}>In Progress</span>
          </div>
          <div style={{ fontSize: 9, opacity: 0.45, marginTop: 2, fontFamily: 'Space Mono, monospace' }}>Coming soon</div>
        </button>
      </div>

      {/* Context selector */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
        {CONTEXT_KEYS.map(ck => (
          <button key={ck.key} onClick={() => setSelectedCtx(ck.key)}
            style={{
              padding: '6px 12px', borderRadius: 7,
              background: selectedCtx === ck.key ? `${ck.color}14` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedCtx === ck.key ? ck.color : 'rgba(255,255,255,0.09)'}`,
              color: selectedCtx === ck.key ? ck.color : 'rgba(255,255,255,0.3)',
              fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'Sora, sans-serif', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <CtxIcon paths={ck.IconPaths} color={selectedCtx === ck.key ? ck.color : 'rgba(255,255,255,0.3)'} size={13} />
            {ck.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 10, animation: 'spin 1.2s linear infinite', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CtxIcon paths={PATHS.RefreshCw} color="rgba(245,158,11,0.5)" size={28} />
          </div>
          <div>Loading ML predictions from MongoDB…</div>
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '14px 16px', color: '#f87171', fontSize: 11.5, marginBottom: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Data loaded */}
      {data && !loading && (
        <>
          {/* Summary bar — SWOT counts for selected context */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Mono, monospace', flex: 1, minWidth: 140 }}>
              Mangalore South · {queries.length} queries<br/>
              <span style={{ opacity: 0.55 }}>{activeMeta?.label} context · SWOT breakdown</span>
            </div>
            {[
              { label: 'Strength',    code: 'S', color: '#10b981', count: swotSummary.Strength    },
              { label: 'Weakness',    code: 'W', color: '#f87171', count: swotSummary.Weakness    },
              { label: 'Opportunity', code: 'O', color: '#22d3ee', count: swotSummary.Opportunity },
              { label: 'Threat',      code: 'T', color: '#fb923c', count: swotSummary.Threat      },
            ].map(b => (
              <div key={b.code} style={{ textAlign: 'center', minWidth: 52 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: b.color, fontFamily: 'Space Mono, monospace', lineHeight: 1 }}>{b.count}</div>
                <div style={{ fontSize: 8, color: b.color, opacity: 0.6, marginTop: 2, fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>{b.code} · {b.label}</div>
              </div>
            ))}
          </div>

          {/* Bird's Eye AI View */}
          <BirdsEyeAIPanel queries={queries} selectedCtx={selectedCtx} />

          {/* Main SWOT panel for selected context */}
          <ContextSWOTPanel
            key={selectedCtx}
            queries={queries}
            ctxKey={selectedCtx}
            ctxColor={activeMeta.color}
            ctxLabel={activeMeta.label}
          />
        </>
      )}

      {!data && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          Click Load to view constituency-level ML-predicted SWOT analysis.
        </div>
      )}
    </div>
  );
}

// ─── Previous Election Analysis Tab ───────────────────────────────────────────
// Data extracted from Mangaluru_DEEP_Analytics_v3.xlsx & Mangaluru_RazorSharp_Analytics.xlsx

// ── Election Scorecard (DEEP v3 — Longitudinal) ──────────────────────────────
const ELECTION_SCORECARD = [
  { election:'2013 (ULB)',       winner:'Congress',        bjpWards:'13 wards',      conWards:'25 wards',  narrative:'Congress wave — BJP split (KJP factor)' },
  { election:'2014 (ULB)',       winner:'BJP',             bjpWards:'26 wards',      conWards:'12 wards',  narrative:'Modi wave — BJP surge +15% avg' },
  { election:'2018 (ULB)',       winner:'BJP',             bjpWards:'25 wards',      conWards:'13 wards',  narrative:'Consolidation — BJP holds post-reunification' },
  { election:'2019 (LS)',        winner:'BJP (Lok Sabha)', bjpWards:'Full sweep',    conWards:'—',          narrative:'NDA wave — peak BJP% in every ward' },
  { election:'2023 (MLA)',       winner:'BJP wins seat',   bjpWards:'25 wards',      conWards:'13 wards',  narrative:'Maintained edge — 3 Congress wards flippable' },
];

// ── Ward Swing Analysis (DEEP v3 — Swing sheet, 38 wards) ────────────────────
const SWING_DATA = [
  { ward:'PADAV WEST',         class23:'🟡 NARROW BJP',  bjp14:62.6, bjp18:65.7, bjp19:73.5, bjp23:null,  sw1418:'+3.1%', sw1923:'+nan%', swType:'🟡 CONTESTED',       h:84.4, m:0.9,  c:14.7, driver:'Mixed community — outreach across all segments required' },
  { ward:'DEREBAIL SOUTH',     class23:'🟢 STRONGHOLD',  bjp14:58.1, bjp18:59.8, bjp19:66.1, bjp23:64.6,  sw1418:'+1.7%', sw1923:'-1.5%', swType:'🟢 CONSISTENT BJP',   h:79.5, m:2.8,  c:17.7, driver:'Catholic swing (18%) — 2014 Modi wave; 2023 drifted back' },
  { ward:'DEREBAIL WEST',      class23:'🟢 STRONGHOLD',  bjp14:53.9, bjp18:59.9, bjp19:68.0, bjp23:66.0,  sw1418:'+6.0%', sw1923:'-2.0%', swType:'🟢 CONSISTENT BJP',   h:84.6, m:1.1,  c:14.3, driver:'Mixed community — outreach across all segments required' },
  { ward:'DEREBAIL SW',        class23:'🟢 STRONGHOLD',  bjp14:64.4, bjp18:69.2, bjp19:74.0, bjp23:74.0,  sw1418:'+4.8%', sw1923:'+0.0%', swType:'🟢 CONSISTENT BJP',   h:87.9, m:0.6,  c:11.5, driver:'High Hindu consolidation — structural BJP ward' },
  { ward:'BOLOOR',             class23:'🟢 STRONGHOLD',  bjp14:57.7, bjp18:60.3, bjp19:71.6, bjp23:71.6,  sw1418:'+2.6%', sw1923:'+0.0%', swType:'🟢 CONSISTENT BJP',   h:87.5, m:1.2,  c:11.3, driver:'Strong Bunt/GSB Hindu base — turnout complacency risk' },
  { ward:'MANNAGUDDA',         class23:'🟢 STRONGHOLD',  bjp14:62.9, bjp18:66.1, bjp19:81.0, bjp23:79.3,  sw1418:'+3.2%', sw1923:'-1.7%', swType:'🟢 CONSISTENT BJP',   h:93.7, m:1.1,  c:5.2,  driver:'Highest Hindu % (94%) — anti-complacency critical' },
  { ward:'KAMBLA',             class23:'🟢 STRONGHOLD',  bjp14:74.4, bjp18:78.4, bjp19:80.1, bjp23:80.1,  sw1418:'+4.0%', sw1923:'+0.0%', swType:'🟢 CONSISTENT BJP',   h:92.6, m:1.8,  c:5.6,  driver:'Ironclad stronghold — 5/5 elections, 62% margins' },
  { ward:'KODIALBAIL',         class23:'🟢 STRONGHOLD',  bjp14:57.5, bjp18:60.9, bjp19:72.9, bjp23:72.9,  sw1418:'+3.4%', sw1923:'+0.0%', swType:'🟢 CONSISTENT BJP',   h:80.9, m:1.2,  c:17.9, driver:'Stable Hindu base; Catholic (18%) critical swing factor' },
  { ward:'BEJAI',              class23:'🟢 STRONG',      bjp14:54.7, bjp18:52.7, bjp19:64.5, bjp23:57.0,  sw1418:'-2.0%', sw1923:'-7.5%', swType:'🟡 SOFTENING BJP',    h:68.6, m:4.7,  c:26.7, driver:'Catholic 27% — 2019 voted BJP, 2023 reverted. Key swing group.' },
  { ward:'KADRI NORTH',        class23:'🟢 STRONGHOLD',  bjp14:64.4, bjp18:66.8, bjp19:76.8, bjp23:71.7,  sw1418:'+2.4%', sw1923:'-5.1%', swType:'🟡 SOFTENING BJP',    h:86.8, m:0.7,  c:12.5, driver:'Poll drop post-2019 — complacency in strong Hindu ward' },
  { ward:'KADRI SOUTH',        class23:'🟢 FAVOURABLE',  bjp14:52.5, bjp18:52.1, bjp19:64.7, bjp23:57.4,  sw1418:'-0.4%', sw1923:'-7.3%', swType:'🟡 SOFTENING BJP',    h:63.9, m:5.3,  c:30.8, driver:'Christian 31% — wave elections swing BJP; base elections lean Cong' },
  { ward:'SHIVBHAG',           class23:'🔴 CONGRESS',    bjp14:49.6, bjp18:50.6, bjp19:54.7, bjp23:47.8,  sw1418:'+1.0%', sw1923:'-6.9%', swType:'🔴 FLIPPED →CON',    h:52.2, m:11.7, c:36.1, driver:'Muslim+Christian majority — lost by 183 votes. Priority flip.' },
  { ward:'PADAVU CENTRAL',     class23:'🟢 STRONG',      bjp14:55.0, bjp18:56.5, bjp19:68.9, bjp23:64.7,  sw1418:'+1.5%', sw1923:'-4.2%', swType:'🟡 SOFTENING BJP',    h:68.3, m:4.6,  c:27.1, driver:'Catholic 27% — booth 42 lost by 5 votes (3rd party spoiler)' },
  { ward:'PADAVU POORVA',      class23:'🟢 FAVOURABLE',  bjp14:50.9, bjp18:51.8, bjp19:63.9, bjp23:57.0,  sw1418:'+0.9%', sw1923:'-6.9%', swType:'🟡 SOFTENING BJP',    h:60.2, m:3.9,  c:35.9, driver:'Christian 36% — 2019 BJP peak not sustained in 2023 MLA' },
  { ward:'MAROLI',             class23:'🟢 STRONG',      bjp14:55.5, bjp18:55.4, bjp19:68.2, bjp23:62.1,  sw1418:'-0.1%', sw1923:'-6.1%', swType:'🟡 SOFTENING BJP',    h:68.7, m:0.8,  c:30.5, driver:'Coastal Hindu; BJP drop from 2019 peak — re-engagement needed' },
  { ward:'BENDUR',             class23:'🔴 CONGRESS',    bjp14:38.1, bjp18:36.5, bjp19:43.6, bjp23:32.2,  sw1418:'-1.6%', sw1923:'-11.4%',swType:'🔴 STRUCTURAL CON',  h:32.2, m:25.2, c:42.6, driver:'Muslim+Christian 68% — BJP needs loss reduction only, -35% margin' },
  { ward:'FALNIR',             class23:'🔴 CONGRESS',    bjp14:46.5, bjp18:47.0, bjp19:52.7, bjp23:32.1,  sw1418:'+0.5%', sw1923:'-20.6%',swType:'🔴 COLLAPSED',       h:32.1, m:9.2,  c:58.7, driver:'Christian 59% — major BJP collapse 2023. Church-driven consolidation.' },
  { ward:'COURT',              class23:'🔴 CONGRESS',    bjp14:46.2, bjp18:45.0, bjp19:59.3, bjp23:45.3,  sw1418:'-1.2%', sw1923:'-14.0%',swType:'🔴 FLIPPED →CON',    h:51.0, m:27.7, c:21.4, driver:'Muslim 28% — lost by 352 votes. Turnout drive = flip potential.' },
  { ward:'CENTRAL',            class23:'🟢 STRONGHOLD',  bjp14:38.4, bjp18:33.4, bjp19:80.9, bjp23:78.2,  sw1418:'-5.0%', sw1923:'+44.8%',swType:'🟢 RECOVERED',       h:90.4, m:7.6,  c:2.0,  driver:'2013–2018 Congress; 2019 BJP wave flip — now structural BJP stronghold' },
  { ward:'DONGERKERY',         class23:'🟢 STRONGHOLD',  bjp14:62.4, bjp18:62.9, bjp19:78.6, bjp23:78.2,  sw1418:'+0.5%', sw1923:'-0.4%', swType:'🟢 CONSISTENT BJP',   h:86.2, m:12.0, c:1.8,  driver:'OBC Hindu consolidation — stable but 2019 peak not matched 2023' },
  { ward:'KUDROLI',            class23:'🔴 CONGRESS',    bjp14:52.8, bjp18:55.3, bjp19:28.8, bjp23:28.8,  sw1418:'+2.5%', sw1923:'+0.0%', swType:'🔴 STRUCTURAL CON',  h:28.8, m:68.2, c:3.0,  driver:'Muslim 68% — structural Congress. BJP min damage goal: <70% con.' },
  { ward:'NAVAYATH',           class23:'🔴 CONGRESS',    bjp14:41.3, bjp18:40.0, bjp19:51.3, bjp23:36.9,  sw1418:'-1.3%', sw1923:'-14.4%',swType:'🔴 STRUCTURAL CON',  h:28.0, m:65.0, c:7.0,  driver:'Muslim majority — high 2019 LS peak not real base; loss reduction only' },
  { ward:'PORT',               class23:'🔴 CONGRESS',    bjp14:44.0, bjp18:43.5, bjp19:57.5, bjp23:44.3,  sw1418:'-0.5%', sw1923:'+0.8%', swType:'🔴 FLIPPED →CON',    h:48.0, m:30.0, c:18.0, driver:'Lost by 9.3% — moderate Muslim presence; 2019 LS BJP much higher' },
  { ward:'CANTONMENT',         class23:'🔴 CONGRESS',    bjp14:43.5, bjp18:43.9, bjp19:58.4, bjp23:45.8,  sw1418:'+0.4%', sw1923:'+1.9%', swType:'🟡 BORDERLINE',      h:45.0, m:25.0, c:25.0, driver:'Lost by 8.4% — booth 146 just 3 votes deficit + 8 3rd-party votes!' },
  { ward:'MILAGRIS',           class23:'🔴 CONGRESS',    bjp14:38.0, bjp18:38.5, bjp19:48.9, bjp23:38.0,  sw1418:'+0.5%', sw1923:'-10.9%',swType:'🔴 STRUCTURAL CON',  h:30.0, m:20.0, c:50.0, driver:'Christian majority 50% — structural Congress, loss reduction goal' },
  { ward:'VALENCIA',           class23:'🔴 CONGRESS',    bjp14:44.0, bjp18:44.4, bjp19:58.0, bjp23:45.3,  sw1418:'+0.4%', sw1923:'+0.9%', swType:'🟡 BORDERLINE',      h:42.0, m:18.0, c:35.0, driver:'Lost by 8.8% — demoralized Catholic minority; easiest flip target' },
  { ward:'KANKANADY',          class23:'🟢 STRONGHOLD',  bjp14:55.3, bjp18:56.1, bjp19:69.4, bjp23:66.0,  sw1418:'+0.8%', sw1923:'-3.4%', swType:'🟡 SOFTENING BJP',    h:60.0, m:25.0, c:15.0, driver:'Mixed ward — 2023 dip from 2019 peak; consolidation required' },
  { ward:'ALAPE DAKSHINA',     class23:'🟢 STRONGHOLD',  bjp14:60.2, bjp18:62.0, bjp19:74.5, bjp23:71.6,  sw1418:'+1.8%', sw1923:'-2.9%', swType:'🟡 SOFTENING BJP',    h:78.0, m:8.0,  c:14.0, driver:'Bunt/GSB coastal belt — strong base, small 2023 dip from 2019' },
  { ward:'ALAPE UTTARA',       class23:'🟢 STRONG',      bjp14:58.0, bjp18:60.5, bjp19:72.3, bjp23:66.0,  sw1418:'+2.5%', sw1923:'-6.3%', swType:'🟡 SOFTENING BJP',    h:72.0, m:12.0, c:16.0, driver:'Moderate mixed ward — 2019 surge not replicated in 2023 MLA' },
  { ward:'KANNUR',             class23:'🔴 CONGRESS',    bjp14:38.5, bjp18:38.0, bjp19:49.0, bjp23:36.0,  sw1418:'-0.5%', sw1923:'-13.0%',swType:'🔴 STRUCTURAL CON',  h:35.0, m:45.0, c:20.0, driver:'Muslim-heavy — structural Congress. Loss reduction the only goal.' },
  { ward:'BAJAL',              class23:'🔴 CONGRESS',    bjp14:43.9, bjp18:53.0, bjp19:20.0, bjp23:8.3,   sw1418:'+9.1%', sw1923:'-44.7%',swType:'🔴 COLLAPSED',       h:35.0, m:50.0, c:12.0, driver:'BJP IMPLOSION: -45% from 2018. Anti-incumbency + Muslim majority.' },
  { ward:'JEPPINAMUGER',       class23:'🟢 STRONG',      bjp14:52.5, bjp18:54.0, bjp19:65.8, bjp23:58.7,  sw1418:'+1.5%', sw1923:'-7.1%', swType:'🟡 SOFTENING BJP',    h:65.0, m:20.0, c:15.0, driver:'Coastal mixed — 2023 MLA dip from 2019 LS. Needs re-engagement.' },
  { ward:'ATTAVARA',           class23:'🟢 NARROW BJP',  bjp14:58.2, bjp18:58.4, bjp19:67.8, bjp23:60.3,  sw1418:'+0.2%', sw1923:'-7.5%', swType:'🟡 SOFTENING BJP',    h:72.0, m:5.0,  c:20.0, driver:'Booth 222 lost by 2 votes with 10 3rd-party votes — critical!' },
  { ward:'MANGALADEVI',        class23:'🟢 NARROW BJP',  bjp14:57.5, bjp18:57.8, bjp19:69.0, bjp23:59.2,  sw1418:'+0.3%', sw1923:'-9.8%', swType:'🟡 SOFTENING BJP',    h:68.0, m:12.0, c:18.0, driver:'+9.8% BJP ward; 2023 dip from 2019 — anti-complacency needed' },
  { ward:'HOIGE BAZAR',        class23:'🟢 STRONG',      bjp14:54.0, bjp18:55.2, bjp19:67.4, bjp23:61.0,  sw1418:'+1.2%', sw1923:'-6.4%', swType:'🟡 SOFTENING BJP',    h:62.0, m:18.0, c:18.0, driver:'Muslim 18% — key swing community; coastal trade area dynamics' },
  { ward:'BOLAR',              class23:'🟢 STRONGHOLD',  bjp14:58.6, bjp18:60.1, bjp19:72.8, bjp23:68.5,  sw1418:'+1.5%', sw1923:'-4.3%', swType:'🟡 SOFTENING BJP',    h:70.0, m:12.0, c:16.0, driver:'Coastal stronghold — 2023 MLA dip from 2019 peak manageable' },
  { ward:'JEPPU',              class23:'🔴 CONGRESS',    bjp14:44.0, bjp18:44.8, bjp19:57.3, bjp23:44.5,  sw1418:'+0.8%', sw1923:'-12.8%',swType:'🔴 FLIPPED →CON',    h:48.0, m:30.0, c:20.0, driver:'Lost by 8.1% — moderate Muslim; 2019 BJP peak not sustained' },
  { ward:'BENGRE',             class23:'🔴 CONGRESS',    bjp14:79.5, bjp18:80.1, bjp19:80.1, bjp23:12.2,  sw1418:'+0.6%', sw1923:'-67.9%',swType:'🔴 IMPLODED',        h:78.0, m:8.0,  c:10.0, driver:'EXTREME: -68% from 2018. Booth 98 BJP implosion. Grassroots rebuild.' },
];

// ── Statistical Variance (DEEP v3 — top 15 by 2028 prediction) ───────────────
const STAT_DATA = [
  { ward:'KAMBLA',         mean:76.3, std:5.1,  min:65.5, max:80.1, poll:70.3, rating:'🟢 ELITE STRONGHOLD',   stability:99, pred2028:80 },
  { ward:'MANNAGUDDA',     mean:68.0, std:14.8, min:42.4, max:79.3, poll:69.3, rating:'🟢 RELIABLE BJP',        stability:92, pred2028:78 },
  { ward:'CENTRAL',        mean:61.9, std:21.1, min:33.4, max:80.9, poll:63.6, rating:'🟢 RECOVERED STRONGHOLD',stability:88, pred2028:76 },
  { ward:'PADAV WEST',     mean:67.3, std:5.6,  min:62.6, max:73.5, poll:72.6, rating:'🟢 ELITE STRONGHOLD',   stability:99, pred2028:72 },
  { ward:'DONGERKERY',     mean:68.6, std:9.8,  min:62.4, max:78.6, poll:68.2, rating:'🟢 RELIABLE BJP',        stability:95, pred2028:77 },
  { ward:'BOLOOR',         mean:62.6, std:6.1,  min:57.7, max:71.6, poll:65.5, rating:'🟢 RELIABLE BJP',        stability:96, pred2028:70 },
  { ward:'DEREBAIL SW',    mean:67.0, std:4.2,  min:64.4, max:74.0, poll:67.8, rating:'🟢 ELITE STRONGHOLD',   stability:98, pred2028:73 },
  { ward:'DEREBAIL WEST',  mean:61.9, std:6.4,  min:53.9, max:68.0, poll:71.5, rating:'🟢 RELIABLE BJP',        stability:99, pred2028:65 },
  { ward:'DEREBAIL SOUTH', mean:62.2, std:3.8,  min:58.1, max:66.1, poll:64.8, rating:'🟢 RELIABLE BJP',        stability:95, pred2028:64 },
  { ward:'KODIALBAIL',     mean:65.3, std:6.8,  min:57.5, max:72.9, poll:68.4, rating:'🟢 RELIABLE BJP',        stability:94, pred2028:71 },
  { ward:'SHIVBHAG',       mean:50.2, std:3.1,  min:47.0, max:54.7, poll:56.2, rating:'🟡 CONTESTED',           stability:72, pred2028:48 },
  { ward:'COURT',          mean:48.0, std:6.1,  min:45.0, max:59.3, poll:52.5, rating:'🟡 BORDERLINE',          stability:68, pred2028:50 },
  { ward:'BAJAL',          mean:31.2, std:18.4, min:8.3,  max:53.0, poll:64.2, rating:'🔴 COLLAPSED',           stability:30, pred2028:20 },
  { ward:'BENGRE',         mean:55.0, std:32.5, min:12.2, max:80.1, poll:63.8, rating:'🔴 IMPLODED',            stability:15, pred2028:35 },
  { ward:'FALNIR',         mean:44.6, std:6.3,  min:32.1, max:52.7, poll:62.4, rating:'🔴 STRUCTURAL CON',      stability:40, pred2028:35 },
];

// ── 5-Election Ward Trends (RazorSharp — key wards) ──────────────────────────
const TRENDS5_DATA = [
  { ward:'KAMBLA',        status:'🟢 STRONG', b13:65.5, b14:74.4, b18:78.4, b19:80.1, b23:80.1, poll23:62.1, trend:14.5, unpolled:1927 },
  { ward:'MANNAGUDDA',    status:'🟡 MEDIUM', b13:42.4, b14:62.9, b18:66.1, b19:81.0, b23:79.3, poll23:61.7, trend:36.8, unpolled:2797 },
  { ward:'CENTRAL',       status:'🟢 STRONG', b13:42.5, b14:38.4, b18:33.4, b19:80.9, b23:78.2, poll23:62.9, trend:35.7, unpolled:1939 },
  { ward:'SHIVBHAG',      status:'🔴 WEAK',   b13:null, b14:49.6, b18:50.6, b19:54.7, b23:47.8, poll23:54.2, trend:-1.8, unpolled:1842 },
  { ward:'BENGRE',        status:'🔴 WEAK',   b13:null, b14:79.5, b18:80.1, b19:null,  b23:12.2, poll23:64.1, trend:-67.9,unpolled:3200 },
  { ward:'BAJAL',         status:'🔴 WEAK',   b13:49.4, b14:43.9, b18:53.0, b19:9.5,  b23:8.3,  poll23:65.2, trend:-44.7,unpolled:2800 },
  { ward:'BEJAI',         status:'🟡 MEDIUM', b13:null, b14:54.7, b18:52.7, b19:64.5, b23:57.0, poll23:60.3, trend:2.3,  unpolled:2100 },
  { ward:'COURT',         status:'🔴 WEAK',   b13:null, b14:46.2, b18:45.0, b19:59.3, b23:45.3, poll23:51.2, trend:-0.9, unpolled:2800 },
  { ward:'FALNIR',        status:'🔴 WEAK',   b13:null, b14:46.5, b18:47.0, b19:52.7, b23:32.1, poll23:62.4, trend:-14.9,unpolled:2100 },
  { ward:'ATTAVARA',      status:'🟡 MEDIUM', b13:null, b14:58.2, b18:58.4, b19:67.8, b23:60.3, poll23:59.1, trend:2.1,  unpolled:2800 },
  { ward:'MANGALADEVI',   status:'🟡 MEDIUM', b13:null, b14:57.5, b18:57.8, b19:69.0, b23:59.2, poll23:56.8, trend:1.7,  unpolled:2200 },
  { ward:'VALENCIA',      status:'🔴 WEAK',   b13:null, b14:44.0, b18:44.4, b19:58.0, b23:45.3, poll23:55.1, trend:1.3,  unpolled:1900 },
];

// ── Booth Flips (RazorSharp — BJP→Congress, top severity) ────────────────────
const FLIP_DATA = [
  { ward:'BENGRE',      booth:98,  change:-67.9, bjp18:80.1, bjp23:12.2, con23:84.6, cath:0.9,  musl:0.0,  cause:'BJP IMPLOSION −68%: Grassroots rebellion. Personal revisit by candidate MANDATORY.' },
  { ward:'FALNIR',      booth:159, change:-53.2, bjp18:61.0, bjp23:7.8,  con23:91.2, cath:32.9, musl:0.1,  cause:'CATHOLIC SURGE (33%): Church-driven anti-BJP. Parish meeting + project delivery essential.' },
  { ward:'KUDROLI',     booth:109, change:-53.1, bjp18:55.3, bjp23:2.2,  con23:96.5, cath:0.5,  musl:15.0, cause:'BJP IMPLOSION −53%: Muslim+Congress consolidation. Not winnable without structural work.' },
  { ward:'BAJAL',       booth:201, change:-44.7, bjp18:53.0, bjp23:8.3,  con23:89.8, cath:0.0,  musl:9.5,  cause:'BJP COLLAPSED −45%: Muslim majority + anti-incumbency. Urgent door-to-door recovery.' },
  { ward:'BAJAL',       booth:207, change:-42.1, bjp18:55.0, bjp23:12.9, con23:83.9, cath:0.0,  musl:8.0,  cause:'BJP COLLAPSED: Consistent Muslim consolidation. Loss reduction focus only.' },
  { ward:'BAJAL',       booth:203, change:-41.3, bjp18:66.3, bjp23:24.9, con23:70.9, cath:0.3,  musl:10.6, cause:'BJP COLLAPSE −41%: Was 66% BJP in 2018! Recovery possible with Hindu re-engagement.' },
  { ward:'FALNIR',      booth:164, change:-35.8, bjp18:55.0, bjp23:19.2, con23:80.0, cath:28.0, musl:1.0,  cause:'CATHOLIC SURGE: Church consolidation. Specific ward-level project delivery required.' },
  { ward:'CANTONMENT',  booth:149, change:-28.4, bjp18:52.0, bjp23:23.6, con23:76.0, cath:15.0, musl:18.0, cause:'Mixed community swing. Ward welfare + candidate relationship: key lever.' },
  { ward:'SHIVBHAG',    booth:135, change:-22.0, bjp18:52.0, bjp23:30.0, con23:68.0, cath:22.0, musl:14.0, cause:'Multi-community anti-BJP. Shivabagh lost by 183 votes — 3-booth intensive needed.' },
  { ward:'COURT',       booth:131, change:-19.5, bjp18:50.0, bjp23:30.5, con23:68.0, cath:10.0, musl:30.0, cause:'Muslim consolidation + turnout drive could flip this. High unpolled voters (2,800).' },
];

// ── Vote Leakage / 3rd Party Spoilers (RazorSharp) ────────────────────────────
const LEAKAGE_DATA = [
  { ward:'ATHAVARA',    booth:222, gap:-2,  thirdPty:10, jds:2, aap:5, ind:3, bjp:48.9, con:49.2, implication:'WINNABLE: 2 vote deficit. 10 3rd-party votes. JDS→BJP = flip.' },
  { ward:'CONTONMENT',  booth:146, gap:-3,  thirdPty:8,  jds:3, aap:2, ind:3, bjp:48.9, con:49.3, implication:'WINNABLE: 3 vote deficit. 8 3rd-party votes. Anti-Congress JDS = flip.' },
  { ward:'PADAV CENTRAL',booth:42, gap:-5,  thirdPty:6,  jds:3, aap:3, ind:0, bjp:49.0, con:49.6, implication:'WINNABLE: 5 vote deficit. 6 3rd-party (JDS+AAP) votes available.' },
  { ward:'VALENCIA',    booth:137, gap:-85, thirdPty:12, jds:8, aap:0, ind:4, bjp:47.2, con:49.8, implication:'CLOSE: Large deficit. JDS consolidation + Catholic demoralization = possible flip.' },
  { ward:'SHIVBHAG',    booth:134, gap:-42, thirdPty:9,  jds:5, aap:2, ind:2, bjp:47.0, con:49.5, implication:'ATTACK: High unpolled. 3rd-party + turnout drive = meaningful vote gain.' },
];

// Sub-tabs inside the election tab
const ELEC_SUBTABS = [
  { id:'scorecard', label:'History',       icon:'📅' },
  { id:'swing',     label:'Swing',         icon:'🔀' },
  { id:'trends5',   label:'5-Elec Trends', icon:'📈' },
  { id:'stat',      label:'Variance',      icon:'📊' },
  { id:'flips',     label:'Booth Flips',   icon:'🔄' },
  { id:'leakage',   label:'Vote Leakage',  icon:'⚡' },
];

function PreviousElectionTab() {
  const [sub, setSub] = useState('scorecard');
  const [wardFilter, setWardFilter] = useState('');

  const pct = (v) => v != null ? `${v}%` : '—';
  const clr = (v) => v == null ? '#64748b' : v >= 60 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ef4444';
  const marginClr = (v) => v > 0 ? '#10b981' : '#ef4444';

  const Cell = ({ v, bold, color }) => (
    <td style={{ padding:'7px 8px', fontSize:11.5, color: color || '#94a3b8', fontWeight: bold ? 700 : 400, borderBottom:'1px solid rgba(255,255,255,0.04)', whiteSpace:'nowrap' }}>{v ?? '—'}</td>
  );
  const Th = ({ children, right }) => (
    <th style={{ padding:'8px 8px', fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.35)', textAlign: right ? 'right' : 'left', textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:'1px solid rgba(255,255,255,0.1)', background:'rgba(15,23,42,0.95)', position:'sticky', top:0, whiteSpace:'nowrap' }}>{children}</th>
  );

  const tblWrap = {
    overflowX:'auto', borderRadius:12,
    border:'1px solid rgba(255,255,255,0.07)',
    background:'rgba(10,18,35,0.8)',
    maxHeight:520, overflowY:'auto',
  };

  const filtered = (arr, key='ward') =>
    wardFilter ? arr.filter(r => r[key]?.toLowerCase().includes(wardFilter.toLowerCase())) : arr;

  return (
    <div style={{ animation:'fadeUp 0.3s ease both' }}>

      {/* Header card */}
      <div style={{ background:'linear-gradient(135deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border:'1px solid rgba(245,158,11,0.18)', borderRadius:16, padding:'16px 18px', marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#f59e0b', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          Previous Election Analysis — Mangaluru City South
        </div>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:0, lineHeight:1.6 }}>
          Deep analytics across 5 elections (2013–2023) · 38 wards · 246 booths · Sources: DEEP Analytics v3 &amp; RazorSharp Analytics
        </p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:12 }}>
          {[
            { label:'BJP Wards 2023', val:'25', color:'#f97316' },
            { label:'Congress 2023',  val:'13', color:'#10b981' },
            { label:'Booths Flipped', val:'36', color:'#ef4444' },
            { label:'Avg BJP% 2023',  val:'56%',color:'#22d3ee' },
            { label:'2019 Peak BJP%', val:'68%',color:'#f59e0b' },
            { label:'Vote Gap',       val:'−7.8%', color:'#f87171' },
          ].map(k => (
            <div key={k.label} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${k.color}22`, borderRadius:10, padding:'8px 12px', textAlign:'center', minWidth:90 }}>
              <div style={{ fontSize:18, fontWeight:900, color:k.color, fontFamily:'Space Mono, monospace' }}>{k.val}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:14, overflowX:'auto', padding:'2px 0', scrollbarWidth:'none' }}>
        {ELEC_SUBTABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            style={{
              flexShrink:0, padding:'7px 12px', borderRadius:8, border:'1px solid transparent',
              background: sub===t.id ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: sub===t.id ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.07)',
              color: sub===t.id ? '#f59e0b' : 'rgba(255,255,255,0.45)',
              fontSize:11.5, fontWeight:700, cursor:'pointer', fontFamily:'Sora,sans-serif',
              transition:'all 0.18s', display:'flex', alignItems:'center', gap:5,
            }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Ward search */}
      {sub !== 'scorecard' && (
        <input
          value={wardFilter} onChange={e=>setWardFilter(e.target.value)}
          placeholder="Filter by ward…"
          style={{ width:'100%', boxSizing:'border-box', padding:'9px 14px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'#e2e8f0', fontSize:12, outline:'none', marginBottom:12, fontFamily:'Sora,sans-serif' }}
        />
      )}

      {/* ── SCORECARD ─────────────────────────────────────────────────────── */}
      {sub === 'scorecard' && (
        <div>
          <div style={{ ...tblWrap, maxHeight:'none' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <Th>Election</Th><Th>Winner</Th><Th>BJP Wards</Th><Th>Congress Wards</Th><Th>Key Narrative</Th>
              </tr></thead>
              <tbody>
                {ELECTION_SCORECARD.map((r,i) => (
                  <tr key={i} style={{ background: i%2===0?'rgba(17,27,46,0.7)':'rgba(22,33,58,0.5)' }}>
                    <td style={{ padding:'9px 8px', fontSize:12, fontWeight:800, color:'#f59e0b', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>{r.election}</td>
                    <Cell v={r.winner} color={r.winner.includes('BJP')?'#f97316':r.winner.includes('Congress')?'#10b981':'#94a3b8'} bold />
                    <Cell v={r.bjpWards} color='#f97316' />
                    <Cell v={r.conWards} color='#10b981' />
                    <Cell v={r.narrative} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BJP trend chart visual */}
          <div style={{ marginTop:16, background:'linear-gradient(135deg,rgba(17,28,52,0.9),rgba(10,18,35,0.95))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.7)', marginBottom:12 }}>BJP % Trajectory — Key wards across 5 elections</div>
            {[
              { ward:'KAMBLA',     vals:[65.5,74.4,78.4,80.1,80.1] },
              { ward:'MANNAGUDDA', vals:[42.4,62.9,66.1,81.0,79.3] },
              { ward:'BENGRE',     vals:[null,79.5,80.1,null,12.2]  },
              { ward:'BAJAL',      vals:[49.4,43.9,53.0,9.5,8.3]   },
              { ward:'CENTRAL',    vals:[42.5,38.4,33.4,80.9,78.2]  },
            ].map(({ ward, vals }) => (
              <div key={ward} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#e2e8f0' }}>{ward}</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'Space Mono,monospace' }}>
                    {vals.map((v,i)=><span key={i} style={{ marginLeft:8, color:v==null?'#334155':clr(v) }}>{v??'—'}</span>)}
                  </span>
                </div>
                <div style={{ display:'flex', gap:2, height:6, borderRadius:3, overflow:'hidden' }}>
                  {['2013','2014','2018','2019LS','2023'].map((yr,i) => {
                    const v = vals[i];
                    return <div key={yr} title={`${yr}: ${v??'N/A'}%`} style={{ flex:1, background: v==null?'rgba(255,255,255,0.05)':`linear-gradient(90deg,${clr(v)}88,${clr(v)})`, borderRadius:2 }} />;
                  })}
                </div>
              </div>
            ))}
            <div style={{ display:'flex', gap:12, marginTop:10, flexWrap:'wrap' }}>
              {['2013','2014','2018','2019 LS','2023 MLA'].map((y,i) => (
                <div key={y} style={{ fontSize:10, color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:18, height:4, borderRadius:2, background:['#334155','#3b82f6','#f59e0b','#10b981','#f97316'][i] }} />
                  {y}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SWING TABLE ──────────────────────────────────────────────────── */}
      {sub === 'swing' && (
        <div style={tblWrap}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:760 }}>
            <thead><tr>
              <Th>Ward</Th><Th>Class</Th><Th>BJP '14</Th><Th>BJP '18</Th><Th>BJP '19LS</Th><Th>BJP '23</Th><Th>14→18</Th><Th>19→23</Th><Th>H%</Th><Th>M%</Th><Th>C%</Th><Th>Swing Type</Th>
            </tr></thead>
            <tbody>
              {filtered(SWING_DATA).map((r,i) => (
                <tr key={i} style={{ background: i%2===0?'rgba(17,27,46,0.7)':'rgba(22,33,58,0.5)', cursor:'pointer' }}
                  title={r.driver}>
                  <td style={{ padding:'7px 8px', fontSize:12, fontWeight:800, color:'#e2e8f0', borderBottom:'1px solid rgba(255,255,255,0.04)', whiteSpace:'nowrap' }}>{r.ward}</td>
                  <Cell v={r.class23} color={r.class23.includes('STRONGHOLD')?'#10b981':r.class23.includes('NARROW')?'#f59e0b':'#ef4444'} />
                  <Cell v={pct(r.bjp14)} color={clr(r.bjp14)} bold />
                  <Cell v={pct(r.bjp18)} color={clr(r.bjp18)} bold />
                  <Cell v={pct(r.bjp19)} color={clr(r.bjp19)} />
                  <Cell v={pct(r.bjp23)} color={clr(r.bjp23)} bold />
                  <Cell v={r.sw1418} color={r.sw1418?.startsWith('+')?'#10b981':'#ef4444'} />
                  <Cell v={r.sw1923} color={r.sw1923?.startsWith('+')?'#10b981':'#ef4444'} />
                  <Cell v={`${r.h}%`} color='#f97316' />
                  <Cell v={`${r.m}%`} color='#22d3ee' />
                  <Cell v={`${r.c}%`} color='#8b5cf6' />
                  <Cell v={r.swType} color={r.swType.includes('🟢')?'#10b981':r.swType.includes('🟡')?'#f59e0b':'#ef4444'} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 5-ELECTION TRENDS ────────────────────────────────────────────── */}
      {sub === 'trends5' && (
        <div>
          <div style={tblWrap}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
              <thead><tr>
                <Th>Ward</Th><Th>Status</Th><Th>2013</Th><Th>2014</Th><Th>2018</Th><Th>2019 LS</Th><Th>2023</Th><Th>Poll%</Th><Th>Trend</Th><Th>Unpolled</Th>
              </tr></thead>
              <tbody>
                {filtered(TRENDS5_DATA).map((r,i) => (
                  <tr key={i} style={{ background: i%2===0?'rgba(17,27,46,0.7)':'rgba(22,33,58,0.5)' }}>
                    <td style={{ padding:'7px 8px', fontSize:12, fontWeight:800, color:'#e2e8f0', borderBottom:'1px solid rgba(255,255,255,0.04)', whiteSpace:'nowrap' }}>{r.ward}</td>
                    <Cell v={r.status} color={r.status.includes('STRONG')?'#10b981':r.status.includes('MEDIUM')?'#f59e0b':'#ef4444'} />
                    <Cell v={r.b13!=null?`${r.b13}%`:'—'} color={clr(r.b13)} />
                    <Cell v={r.b14!=null?`${r.b14}%`:'—'} color={clr(r.b14)} bold />
                    <Cell v={r.b18!=null?`${r.b18}%`:'—'} color={clr(r.b18)} bold />
                    <Cell v={r.b19!=null?`${r.b19}%`:'—'} color={clr(r.b19)} />
                    <Cell v={r.b23!=null?`${r.b23}%`:'—'} color={clr(r.b23)} bold />
                    <Cell v={`${r.poll23}%`} color='#22d3ee' />
                    <td style={{ padding:'7px 8px', fontSize:11.5, borderBottom:'1px solid rgba(255,255,255,0.04)', whiteSpace:'nowrap' }}>
                      <span style={{ color:r.trend>=0?'#10b981':'#ef4444', fontWeight:700 }}>{r.trend>=0?'+':''}{r.trend}%</span>
                    </td>
                    <Cell v={r.unpolled?.toLocaleString()} color='#f59e0b' />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
              <strong style={{ color:'#f59e0b' }}>Note:</strong> 2019 LS figures represent Lok Sabha election (national party dynamics — BJP performs ~12–15% higher than MLA). BJP trend = change from best election year. Unpolled = registered voters who did not vote in 2023.
            </span>
          </div>
        </div>
      )}

      {/* ── STATISTICAL VARIANCE ─────────────────────────────────────────── */}
      {sub === 'stat' && (
        <div>
          <div style={tblWrap}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead><tr>
                <Th>Ward</Th><Th>Avg BJP% (14–23)</Th><Th>Std Dev</Th><Th>Min BJP%</Th><Th>Max BJP%</Th><Th>Avg Poll%</Th><Th>Rating</Th><Th>Stability</Th><Th>2028 Pred</Th>
              </tr></thead>
              <tbody>
                {filtered(STAT_DATA).map((r,i) => (
                  <tr key={i} style={{ background: i%2===0?'rgba(17,27,46,0.7)':'rgba(22,33,58,0.5)' }}>
                    <td style={{ padding:'7px 8px', fontSize:12, fontWeight:800, color:'#e2e8f0', borderBottom:'1px solid rgba(255,255,255,0.04)', whiteSpace:'nowrap' }}>{r.ward}</td>
                    <Cell v={`${r.mean}%`} color={clr(r.mean)} bold />
                    <Cell v={`${r.std}%`} color={r.std > 15 ? '#ef4444' : r.std > 8 ? '#f59e0b' : '#10b981'} />
                    <Cell v={`${r.min}%`} color='#f87171' />
                    <Cell v={`${r.max}%`} color='#34d399' />
                    <Cell v={`${r.poll}%`} color='#22d3ee' />
                    <Cell v={r.rating} color={r.rating.includes('ELITE')||r.rating.includes('STRONGHOLD')?'#10b981':r.rating.includes('RELIABLE')?'#22d3ee':r.rating.includes('CONTESTED')||r.rating.includes('BORDER')?'#f59e0b':'#ef4444'} />
                    <td style={{ padding:'7px 8px', fontSize:11.5, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width:60, height:6, borderRadius:3, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                        <div style={{ width:`${r.stability}%`, height:'100%', background:r.stability>=90?'#10b981':r.stability>=70?'#f59e0b':'#ef4444', borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{r.stability}/100</span>
                    </td>
                    <Cell v={`${r.pred2028}%`} color={clr(r.pred2028)} bold />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.15)', borderRadius:10 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
              <strong style={{ color:'#a78bfa' }}>Std Dev</strong> = volatility — low (under 5%) means structural ward, high (above 15%) means swing ward. <strong style={{ color:'#a78bfa' }}>Stability score</strong> is composite of demographic consistency + election consistency. <strong style={{ color:'#a78bfa' }}>2028 prediction</strong> based on demographic stability + trend extrapolation.
            </span>
          </div>
        </div>
      )}

      {/* ── BOOTH FLIPS ──────────────────────────────────────────────────── */}
      {sub === 'flips' && (
        <div>
          <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, marginBottom:12 }}>
            <span style={{ fontSize:11, color:'#fca5a5', lineHeight:1.6 }}>
              <strong>36 booths flipped BJP→Congress (2018→2023).</strong> Most due to Catholic surge or BJP implosion. 3 Congress-winning booths are winnable via 3rd party consolidation. Source: RazorSharp Analytics.
            </span>
          </div>
          <div style={tblWrap}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
              <thead><tr>
                <Th>Ward</Th><Th>Booth</Th><Th>BJP '18</Th><Th>BJP '23</Th><Th>Change</Th><Th>Cong '23</Th><Th>Cath%</Th><Th>Musl%</Th><Th>Root Cause & Recovery</Th>
              </tr></thead>
              <tbody>
                {filtered(FLIP_DATA).map((r,i) => (
                  <tr key={i} style={{ background: i%2===0?'rgba(40,10,10,0.5)':'rgba(30,8,8,0.4)' }}>
                    <td style={{ padding:'7px 8px', fontSize:12, fontWeight:800, color:'#fca5a5', borderBottom:'1px solid rgba(255,255,255,0.04)', whiteSpace:'nowrap' }}>{r.ward}</td>
                    <Cell v={r.booth} color='#94a3b8' />
                    <Cell v={`${r.bjp18}%`} color='#f97316' bold />
                    <Cell v={`${r.bjp23}%`} color='#ef4444' bold />
                    <td style={{ padding:'7px 8px', fontSize:12, fontWeight:800, color:'#f87171', borderBottom:'1px solid rgba(255,255,255,0.04)', whiteSpace:'nowrap' }}>{r.change}%</td>
                    <Cell v={`${r.con23}%`} color='#10b981' />
                    <Cell v={`${r.cath}%`} color='#8b5cf6' />
                    <Cell v={`${r.musl}%`} color='#22d3ee' />
                    <td style={{ padding:'7px 8px', fontSize:11, color:'rgba(255,255,255,0.5)', borderBottom:'1px solid rgba(255,255,255,0.04)', maxWidth:300, lineHeight:1.5 }}>{r.cause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VOTE LEAKAGE ─────────────────────────────────────────────────── */}
      {sub === 'leakage' && (
        <div>
          <div style={{ padding:'10px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, marginBottom:12 }}>
            <span style={{ fontSize:11, color:'#fde68a', lineHeight:1.6 }}>
              <strong>⚡ 3 booths are winnable via 3rd party consolidation</strong> — deficit smaller than 3rd-party votes. JDS avg 1.2% across wards. 18 booths are structural Congress (4/4 wins) — need 6+ month community building.
            </span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered(LEAKAGE_DATA).map((r,i) => (
              <div key={i} style={{ background:'linear-gradient(135deg,rgba(17,28,52,0.95),rgba(10,18,35,0.98))', border:'1px solid rgba(245,158,11,0.18)', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'#e2e8f0' }}>{r.ward}</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.05)', borderRadius:5, padding:'2px 7px' }}>Booth {r.booth}</span>
                  <span style={{ fontSize:12, fontWeight:800, color: r.gap > -10 ? '#10b981':'#f59e0b', marginLeft:'auto' }}>Gap: {r.gap} votes</span>
                </div>
                {/* Vote breakdown */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                  {[
                    { l:'BJP', v:`${r.bjp}%`, c:'#f97316' }, { l:'CON', v:`${r.con}%`, c:'#10b981' },
                    { l:'3rd Party', v:r.thirdPty, c:'#f59e0b' }, { l:'JDS', v:r.jds, c:'#22d3ee' },
                    { l:'AAP', v:r.aap, c:'#8b5cf6' }, { l:'IND', v:r.ind, c:'#94a3b8' },
                  ].map(k => (
                    <div key={k.l} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${k.c}22`, borderRadius:7, padding:'5px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:14, fontWeight:900, color:k.c }}>{k.v}</div>
                      <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.3)' }}>{k.l}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:11.5, color:'#22d3ee', margin:0, lineHeight:1.5, fontWeight:600 }}>⚡ {r.implication}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File sources footer */}
      <div style={{ marginTop:16, padding:'10px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#22d3ee', animation:'pulse 2s ease infinite', flexShrink:0 }} />
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:'Space Mono,monospace', lineHeight:1.6 }}>
          Data: Mangaluru_DEEP_Analytics_v3.xlsx (9 sheets · 600+ rows) · Mangaluru_RazorSharp_Analytics.xlsx (4 sheets · 700+ rows) · Covers 2013–2023 elections
        </span>
      </div>
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
        *, *::before, *::after { box-sizing: border-box; }
        html { -webkit-text-size-adjust: 100%; }
        button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }

        .swot-page {
          min-height: 100vh; min-height: 100dvh;
          background: #070c18;
          padding-top: var(--nav-h, 64px);
          padding-bottom: calc(var(--tab-h, 56px) + env(safe-area-inset-bottom, 0px) + 24px);
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
          padding: 20px 14px 32px;
        }
        .swot-hero { text-align: center; margin-bottom: 20px; animation: fadeUp 0.45s ease both; }
        .swot-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.18);
          border-radius: 999px; padding: 4px 14px;
          font-size: 9.5px; font-weight: 700; color: rgba(245,158,11,0.85);
          letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px;
          font-family: 'Space Mono', monospace;
        }
        .swot-eyebrow-dot { width: 5px; height: 5px; border-radius: 50%; background: #f59e0b; animation: pulse 2.2s ease-in-out infinite; }
        .swot-title { font-size: clamp(22px, 6vw, 38px); font-weight: 900; color: #eef2ff; letter-spacing: -1px; line-height: 1.08; margin-bottom: 8px; }
        .swot-title-accent { background: linear-gradient(135deg, #f59e0b, #fde68a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .swot-subtitle { font-size: 12px; color: rgba(255,255,255,0.28); max-width: 420px; margin: 0 auto; line-height: 1.6; }

        .tab-nav {
          display: flex; gap: 4px; margin-bottom: 18px; padding: 4px;
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; animation: fadeUp 0.45s ease 0.08s both;
        }
        .tab-btn {
          flex: 1; padding: 10px 8px; border-radius: 9px; border: 1px solid transparent;
          background: transparent; cursor: pointer; font-family: 'Sora', sans-serif;
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.36);
          transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;
          min-height: 44px;
        }
        .tab-btn.active { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.24); color: #f59e0b; }
        .tab-btn.active svg { stroke: #f59e0b; }
        .tab-btn:not(.active):hover { color: rgba(255,255,255,0.65); background: rgba(255,255,255,0.04); }
        .tab-btn:not(.active):hover svg { stroke: rgba(255,255,255,0.65); }

        /* Responsive grid helpers */
        .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 18px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-2-sm { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }

        /* Filter button row — scrollable on mobile */
        .filter-row { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 12px; align-items: center; }

        /* Demographic toggle row */
        .demo-toggle { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }

        .swot-source {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 9px 14px; border-radius: 8px; margin-top: 20px;
          background: rgba(255,255,255,0.018); border: 1px solid rgba(255,255,255,0.05);
          font-size: 9px; color: rgba(255,255,255,0.2); font-family: 'Space Mono', monospace;
          text-align: center; line-height: 1.5;
        }
        .source-dot { width: 5px; height: 5px; border-radius: 50%; background: #10b981; animation: pulse 2.5s ease-in-out infinite; flex-shrink: 0; }

        /* Touch-friendly action row (ward search) */
        .ward-controls { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 12px; align-items: center; }
        .ward-search { flex: 1; min-width: 120px; padding: 9px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #f0f4ff; font-size: 12px; outline: none; font-family: 'Sora', sans-serif; min-height: 44px; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.35; transform:scale(0.55); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .swot-inner { padding: 14px 12px 24px; }
          .swot-hero { margin-bottom: 16px; }
          .tab-btn .tab-label { display: none; }
          .tab-btn { min-height: 48px; padding: 10px 6px; }

          .grid-4 { grid-template-columns: repeat(2,1fr); gap: 8px; }
          .grid-4 > div { padding: 12px 8px !important; }
          .grid-2 { grid-template-columns: 1fr; gap: 10px; }
          .grid-2-sm { grid-template-columns: 1fr; gap: 7px; }

          .filter-row { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 6px; scrollbar-width: none; }
          .filter-row::-webkit-scrollbar { display: none; }
          .filter-row .filter-btn { flex-shrink: 0; }

          .demo-toggle { flex-direction: column; }
          .demo-toggle button { width: 100%; justify-content: center; min-height: 44px; }

          .ward-controls { gap: 6px; }

          .swot-modal-inner {
            padding: 16px 14px !important;
            border-radius: 14px !important;
            max-height: 88vh !important;
            margin: 0 4px;
          }
          .swot-source { font-size: 8.5px; }
        }

        /* ── Wider phone landscape / small tablet ── */
        @media (min-width: 601px) and (max-width: 860px) {
          .grid-4 { grid-template-columns: repeat(2,1fr); }
        }
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
            <h1 className="swot-title">SWOT <span className="swot-title-accent">Analysis</span></h1>
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
                <t.Icon size={15} strokeWidth={1.75} />
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </div>

          {/* AI Overview — shown for the 4 data tabs */}
          {['swot','wards','demographic','election'].includes(activeTab) && (
            <SwotAIOverview tab={activeTab} />
          )}

          {/* Tab Content */}
          {activeTab === 'swot' && <SwotTab />}
          {activeTab === 'wards' && <WardStrengthTab />}
          {activeTab === 'demographic' && <DemographicTab />}
          {activeTab === 'election' && <PreviousElectionTab />}
          {activeTab === 'ml' && <MLIntelligenceTab />}

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