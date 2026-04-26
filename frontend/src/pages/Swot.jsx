import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';

// ─── Election Data from 2023 Analysis ─────────────────────────────────────────
const ELECTION_2023 = {
  totalVoters: 246952,
  totalPolled: 159420,
  pollPct: 64.28,
  bjpVotes: 66451,
  congressVotes: 89998,
  bjpPct: 56.13,
  congressPct: 42.04,
  margin: 14.09,
  bjpWardWins: 25,
  congressWardWins: 13,
  strongWins: 8,
  mediumWins: 14,
  narrowWins: 3,
  wardsLost: 13,
  avgPollingStrong: 33,
  avgPollingAvg: 5,
};

// ─── SWOT Data ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'political',
    label: 'Post 2023 Election',
    sublabel: 'Political SWOT Analysis',
    icon: '🗳️',
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.12)',
    accentBorder: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'socioeconomic',
    label: 'Socio-Economic',
    sublabel: 'SWOT Framework',
    icon: '📊',
    accent: '#22d3ee',
    accentDim: 'rgba(34,211,238,0.10)',
    accentBorder: 'rgba(34,211,238,0.22)',
  },
];

const SWOT_DATA = {
  political: {
    S: {
      title: 'Strengths',
      subtitle: 'Internal · Positive',
      icon: '💪',
      color: '#10b981',
      glow: 'rgba(16,185,129,0.18)',
      border: 'rgba(16,185,129,0.28)',
      bg: 'rgba(16,185,129,0.05)',
      badgeBg: 'rgba(16,185,129,0.12)',
      items: [
        { label: 'Dominant Ward Majority', detail: '25 of 38 wards won — 65.8% ward capture rate in 2023 election', stat: '25/38 Wards', statColor: '#10b981' },
        { label: 'Strong Booth Network', detail: '33 polling stations categorized as "STRONG" voter bases with consistent turnout', stat: '33 Strong Booths', statColor: '#10b981' },
        { label: 'Vote Share Lead', detail: 'BJP secured 56.13% of valid votes vs Congress 42.04% — a 14.09% margin', stat: '+14.09% Margin', statColor: '#10b981' },
        { label: 'Consolidated Core Wards', detail: 'Kambala (80%), Mannagudda (79%), Central (78%) show overwhelming BJP loyalty', stat: '8 STRONG Wins', statColor: '#10b981' },
      ],
    },
    W: {
      title: 'Weaknesses',
      subtitle: 'Internal · Negative',
      icon: '⚠️',
      color: '#f87171',
      glow: 'rgba(248,113,113,0.18)',
      border: 'rgba(248,113,113,0.28)',
      bg: 'rgba(248,113,113,0.05)',
      badgeBg: 'rgba(248,113,113,0.12)',
      items: [
        { label: '13 Wards Lost to Congress', detail: 'Kudroli (70.2%), Bendoor (68.8%), Falnir (66.1%) show deep-rooted Congress strongholds', stat: '13 Lost Wards', statColor: '#f87171' },
        { label: 'Low Polling in 5 Avg Booths', detail: '5 polling stations with average-only turnout performance — conversion risk for 2028', stat: '5 Avg Booths', statColor: '#f87171' },
        { label: '3 Narrow Margin Wins at Risk', detail: 'Attavara, Mangaladevi, Padav East won by <10% — highly vulnerable to swing votes', stat: '3 Razor Margins', statColor: '#f87171' },
        { label: 'Minority Concentrated Wards', detail: 'Coastal belt wards with Muslim-majority clusters consistently favour Congress by 20%+', stat: 'High Flip Risk', statColor: '#f87171' },
      ],
    },
    O: {
      title: 'Opportunities',
      subtitle: 'External · Positive',
      icon: '🚀',
      color: '#22d3ee',
      glow: 'rgba(34,211,238,0.18)',
      border: 'rgba(34,211,238,0.28)',
      bg: 'rgba(34,211,238,0.05)',
      badgeBg: 'rgba(34,211,238,0.12)',
      items: [
        { label: '2028 Redistricting Advantage', detail: 'Urban ward reorganization may consolidate BJP strongholds in Kadri, Derebail clusters', stat: 'Boundary Play', statColor: '#22d3ee' },
        { label: 'Youth Voter Mobilization', detail: 'First-time 18–25 voter bloc in Kankanady, Jappimogar, Padav untapped; 12–15% potential uplift', stat: '+15K New Voters', statColor: '#22d3ee' },
        { label: 'Congress Internal Friction', detail: 'Post-2023 leadership disputes in Bajal, Bunder, Bengre could erode Congress margins by 5–8%', stat: 'Rival Fragmentation', statColor: '#22d3ee' },
        { label: 'Infrastructure Narrative', detail: 'Smart City projects, port development, and coastal highway can anchor a development-led campaign', stat: 'Dev Dividend', statColor: '#22d3ee' },
      ],
    },
    T: {
      title: 'Threats',
      subtitle: 'External · Negative',
      icon: '🛡️',
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.18)',
      border: 'rgba(245,158,11,0.28)',
      bg: 'rgba(245,158,11,0.05)',
      badgeBg: 'rgba(245,158,11,0.12)',
      items: [
        { label: 'Congress Consolidation Risk', detail: 'If Congress consolidates the 13 lost wards with AAP + JDS transfers, margin shrinks to <5%', stat: 'Coalition Danger', statColor: '#f59e0b' },
        { label: 'Coastal Demographic Shift', detail: 'Bengre, Bunder, Port wards show rising opposition voter registration — net +8K since 2023', stat: '+8K Opp Voters', statColor: '#f59e0b' },
        { label: 'Anti-Incumbency Wave', detail: 'National-level discontent could spill into local vote share; 5-year cycle effect historically costs 4–6%', stat: 'Incumbency Risk', statColor: '#f59e0b' },
        { label: 'NOTA Bleed in Close Wards', detail: 'NOTA absorbed 1,187 votes in 2023 — concentrated in 3 narrow-win wards that total only 7,000 voters', stat: '1,187 NOTA Votes', statColor: '#f59e0b' },
      ],
    },
  },
  socioeconomic: {
    S: {
      title: 'Strengths',
      subtitle: 'Internal · Positive',
      icon: '💪',
      color: '#10b981',
      glow: 'rgba(16,185,129,0.18)',
      border: 'rgba(16,185,129,0.28)',
      bg: 'rgba(16,185,129,0.05)',
      badgeBg: 'rgba(16,185,129,0.12)',
      items: [
        { label: 'Port-Driven Trade Economy', detail: 'New Mangalore Port handles 40MT+ cargo annually, sustaining thousands of direct and indirect livelihoods', stat: 'Major Port City', statColor: '#10b981' },
        { label: 'High Literacy & Education Base', detail: 'Coastal Karnataka leads state averages in literacy; strong private school and engineering college network', stat: '88%+ Literacy', statColor: '#10b981' },
        { label: 'Remittance-Rich Constituency', detail: 'Gulf NRI diaspora from Tulu-speaking communities pumps ₹8,000Cr+ annually into local real estate & SMEs', stat: '₹8,000Cr NRI Inflow', statColor: '#10b981' },
        { label: 'Resilient SME Sector', detail: 'Cashew, tiles, chemicals, and seafood processing form a diversified industrial base resistant to single-sector shocks', stat: 'Diversified Industry', statColor: '#10b981' },
      ],
    },
    W: {
      title: 'Weaknesses',
      subtitle: 'Internal · Negative',
      icon: '⚠️',
      color: '#f87171',
      glow: 'rgba(248,113,113,0.18)',
      border: 'rgba(248,113,113,0.28)',
      bg: 'rgba(248,113,113,0.05)',
      badgeBg: 'rgba(248,113,113,0.12)',
      items: [
        { label: 'Urban Infrastructure Deficit', detail: 'Chronic flooding, poor last-mile road connectivity, and inadequate stormwater drains in 8 coastal wards', stat: '8 Affected Wards', statColor: '#f87171' },
        { label: 'Informal Labour Vulnerability', detail: 'Large fishing, loading, and construction labour pools lack social security and face seasonal income risk', stat: '40K+ Informal Workers', statColor: '#f87171' },
        { label: 'Healthcare Access Gap', detail: 'Primary health centre density below national average for peripheral wards; overloaded district hospital', stat: 'Healthcare Lag', statColor: '#f87171' },
        { label: 'Youth Unemployment Pressure', detail: 'Engineering graduates face mismatch between local industry needs and graduate skill sets; migration trend rising', stat: 'Rising Brain Drain', statColor: '#f87171' },
      ],
    },
    O: {
      title: 'Opportunities',
      subtitle: 'External · Positive',
      icon: '🚀',
      color: '#22d3ee',
      glow: 'rgba(34,211,238,0.18)',
      border: 'rgba(34,211,238,0.28)',
      bg: 'rgba(34,211,238,0.05)',
      badgeBg: 'rgba(34,211,238,0.12)',
      items: [
        { label: 'Smart City & Urban Renewal', detail: 'AMRUT 2.0 and Smart City Mission funds of ₹1,200Cr available for infrastructure upgrade 2025–2028', stat: '₹1,200Cr Pipeline', statColor: '#22d3ee' },
        { label: 'Digital Economy Expansion', detail: 'IT/BPO corridor potential along NH 66 with proximity to Bangalore; co-working ecosystem embryonic', stat: 'Tech Hub Potential', statColor: '#22d3ee' },
        { label: 'Blue Economy & Fisheries Boost', detail: 'Deep-sea fishing modernisation and PMFBY coverage expansion can double fishing community incomes', stat: '2x Income Target', statColor: '#22d3ee' },
        { label: 'Tourism & Heritage Leveraging', detail: 'Coastal cuisine, Yakshagana, temple circuit, and Arabian Sea beach belt underutilised for tourism GDP', stat: '₹500Cr Tourism Gap', statColor: '#22d3ee' },
      ],
    },
    T: {
      title: 'Threats',
      subtitle: 'External · Negative',
      icon: '🛡️',
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.18)',
      border: 'rgba(245,158,11,0.28)',
      bg: 'rgba(245,158,11,0.05)',
      badgeBg: 'rgba(245,158,11,0.12)',
      items: [
        { label: 'Climate & Coastal Erosion Risk', detail: 'Sea-level rise projections and intensifying monsoons threaten Bengre, Bolar, and Port ward shorelines', stat: '6 Coastal Wards', statColor: '#f59e0b' },
        { label: 'Communal Polarisation Pressure', detail: 'Periodic religious tensions in Bunder, Falnir, Kannur risk economic disruption and social cohesion', stat: 'Stability Risk', statColor: '#f59e0b' },
        { label: 'Competition from Udupi & Hubli', detail: 'Industrial policy incentives attracting investment to rival cities; risk of Mangaluru losing port-adjacent manufacturing', stat: 'Investment Diversion', statColor: '#f59e0b' },
        { label: 'Gulf Recession Sensitivity', detail: 'Any slowdown in GCC economies directly hits remittance flows and the NRI-backed real estate market', stat: 'External Exposure', statColor: '#f59e0b' },
      ],
    },
  },
};

const QUADRANT_KEYS = ['S', 'W', 'O', 'T'];

// ─── Animated particle canvas ─────────────────────────────────────────────────
function Particles({ accent }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const dots = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3, vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.35 + 0.06,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = canvas.width; if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height; if (d.y > canvas.height) d.y = 0;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = accent.replace(')', `,${d.a})`).replace('rgb', 'rgba');
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [accent]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500, lineHeight: 1.4, flex: 1, paddingRight: 10 }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 800, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap', letterSpacing: 0.3 }}>{value}</span>
    </div>
  );
}

// ─── SWOT Card ────────────────────────────────────────────────────────────────
function SwotCard({ quadKey, data, hovered, onHover }) {
  const isHovered = hovered === quadKey;
  return (
    <div
      style={{
        position: 'relative', borderRadius: 20, padding: '22px 20px 20px', border: '1px solid',
        borderColor: isHovered ? data.border : 'rgba(255,255,255,0.07)',
        background: isHovered ? `linear-gradient(145deg, ${data.bg}, rgba(10,18,35,0.98))` : 'linear-gradient(145deg, rgba(17,28,52,0.72), rgba(10,18,35,0.95))',
        boxShadow: isHovered ? `0 10px 40px ${data.glow}, inset 0 1px 0 rgba(255,255,255,0.07)` : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)', overflow: 'hidden', cursor: 'default',
        animation: 'swotFadeUp 0.5s ease both',
      }}
      onMouseEnter={() => onHover(quadKey)}
      onMouseLeave={() => onHover(null)}
    >
      {/* glow orb */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${data.color}22, transparent 70%)`, opacity: isHovered ? 1 : 0.4, transition: 'opacity 0.3s', pointerEvents: 'none' }} />

      {/* Big letter watermark */}
      <div style={{ position: 'absolute', bottom: -10, right: 12, fontSize: 90, fontWeight: 900, color: data.color, opacity: 0.05, lineHeight: 1, fontFamily: 'Georgia, serif', pointerEvents: 'none', userSelect: 'none' }}>{quadKey}</div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: data.badgeBg, border: `1px solid ${data.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{data.icon}</div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff', letterSpacing: -0.3 }}>{data.title}</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: data.color, opacity: 0.8, marginLeft: 36 }}>{data.subtitle}</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: data.color, fontFamily: 'Georgia, serif', opacity: 0.7 }}>{quadKey}</div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${data.color}20, transparent)`, marginBottom: 14 }} />

      {/* Items */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {data.items.map((item, i) => (
          <StatChip key={i} label={item.label} value={item.stat} color={item.statColor} />
        ))}
      </div>
    </div>
  );
}

// ─── Expanded Detail Modal ────────────────────────────────────────────────────
function DetailModal({ quadKey, data, onClose, categoryAccent }) {
  if (!quadKey || !data) return null;
  const q = data[quadKey];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.88)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'modalIn 0.2s ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #0d1a30, #080d1a)', border: `1px solid ${q.border}`, borderRadius: 24, padding: '28px 26px', maxWidth: 560, width: '100%', boxShadow: `0 24px 80px ${q.glow}`, maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: q.badgeBg, border: `1px solid ${q.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{q.icon}</div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff' }}>{q.title}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: q.color, marginLeft: 44 }}>{q.subtitle}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${q.color}30, transparent)`, marginBottom: 20 }} />
        {q.items.map((item, i) => (
          <div key={i} style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e8eeff', lineHeight: 1.3, flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: item.statColor, background: `${item.statColor}15`, border: `1px solid ${item.statColor}28`, borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap', letterSpacing: 0.3 }}>{item.stat}</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6, margin: 0 }}>{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Key Stats Bar ────────────────────────────────────────────────────────────
function KeyStats({ activeCategory }) {
  const stats = activeCategory === 'political'
    ? [
        { label: 'Ward Win Rate', value: '65.8%', sub: '25 of 38 wards', color: '#10b981' },
        { label: 'Vote Share', value: '56.1%', sub: 'BJP 2023', color: '#f59e0b' },
        { label: 'Majority Margin', value: '+14.1%', sub: 'over Congress', color: '#22d3ee' },
        { label: 'Strong Booths', value: '33', sub: 'of 38 polling stations', color: '#a78bfa' },
      ]
    : [
        { label: 'Port Cargo', value: '40MT+', sub: 'annual throughput', color: '#10b981' },
        { label: 'NRI Remittance', value: '₹8K Cr', sub: 'annual inflow', color: '#f59e0b' },
        { label: 'Smart City Fund', value: '₹1,200Cr', sub: 'AMRUT pipeline', color: '#22d3ee' },
        { label: 'Literacy Rate', value: '88%+', sub: 'above state avg', color: '#a78bfa' },
      ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 12px', textAlign: 'center', animation: `swotFadeUp 0.4s ease ${i * 0.07}s both` }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: -0.5, marginBottom: 2 }}>{s.value}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 2 }}>{s.label}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── 2028 Strategy Callout ────────────────────────────────────────────────────
function StrategyCallout() {
  const points = [
    { icon: '🎯', text: 'Defend 3 narrow-margin wins (Attavara, Mangaladevi, Padav East) with targeted voter outreach' },
    { icon: '🔄', text: 'Flip 3 priority Congress wards: Bajal, Jeppu, Shivabagh where BJP-Congress gap < 10%' },
    { icon: '📱', text: 'Mobilise 18–25 youth voters in Kankanady, Jappimogar — lowest registration growth zones' },
    { icon: '🏗️', text: 'Anchor 2028 campaign on smart city deliverables & port infrastructure completions' },
  ];
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(34,211,238,0.05))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 18, padding: '20px 22px', marginBottom: 28, animation: 'swotFadeUp 0.6s ease 0.4s both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚡</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: -0.2 }}>2028 Election Strategy Priorities</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.8 }}>Derived from 2023 Booth Analysis</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{p.icon}</span>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{p.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Swot() {
  const [activeCategory, setActiveCategory] = useState('political');
  const [hovered, setHovered] = useState(null);
  const [modalKey, setModalKey] = useState(null);
  const cat = CATEGORIES.find(c => c.id === activeCategory);
  const swotData = SWOT_DATA[activeCategory];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        
        * { box-sizing: border-box; }

        .swot-page {
          min-height: 100vh;
          background: #060c1a;
          padding-top: var(--nav-h, 64px);
          padding-bottom: calc(var(--tab-h, 56px) + var(--safe-bottom, 0px) + 24px);
          position: relative;
          overflow: hidden;
          font-family: 'Sora', sans-serif;
        }

        .swot-bg-mesh {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 55% 40% at 15% 20%, rgba(16,185,129,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 85% 80%, rgba(34,211,238,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 40% 55% at 80% 10%, rgba(245,158,11,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 60% 30% at 5% 90%, rgba(248,113,113,0.04) 0%, transparent 70%);
        }

        .swot-grid-lines {
          position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
          background-image: linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .swot-inner {
          position: relative; z-index: 1;
          max-width: 920px; margin: 0 auto;
          padding: 32px 18px 32px;
        }

        /* Hero */
        .swot-hero { text-align: center; margin-bottom: 32px; animation: swotFadeUp 0.5s ease both; }
        .swot-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.22);
          border-radius: 999px; padding: 5px 16px;
          font-size: 10px; font-weight: 700; color: #f59e0b;
          letter-spacing: 1.4px; text-transform: uppercase; margin-bottom: 16px;
          font-family: 'Space Mono', monospace;
        }
        .swot-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; animation: swotPulse 2s ease-in-out infinite; }
        .swot-title {
          font-size: clamp(28px, 6vw, 46px); font-weight: 900; color: #eef2ff;
          letter-spacing: -2px; line-height: 1.05; margin-bottom: 10px;
        }
        .swot-title span { background: linear-gradient(135deg, #f59e0b, #fde68a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .swot-subtitle { font-size: 14px; color: rgba(255,255,255,0.35); max-width: 460px; margin: 0 auto; line-height: 1.6; }

        /* Category Tabs */
        .cat-tabs {
          display: flex; gap: 10px; margin-bottom: 24px; padding: 5px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; animation: swotFadeUp 0.5s ease 0.1s both;
        }
        .cat-tab {
          flex: 1; padding: 12px 16px; border-radius: 12px; border: 1px solid transparent;
          background: transparent; cursor: pointer;
          transition: all 0.25s cubic-bezier(.4,0,.2,1);
          display: flex; align-items: center; gap: 10px;
        }
        .cat-tab.active {
          background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07);
        }
        .cat-tab-icon { font-size: 18px; }
        .cat-tab-text { text-align: left; }
        .cat-tab-label { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.85); line-height: 1.2; }
        .cat-tab-sub { font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.35); margin-top: 1px; }
        .cat-tab.active .cat-tab-label { color: #f0f4ff; }

        /* SWOT Grid */
        .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
        @media (max-width: 540px) { .swot-grid { grid-template-columns: 1fr; } .cat-tabs { flex-direction: column; } .key-stats-grid { grid-template-columns: repeat(2,1fr) !important; } .strategy-grid { grid-template-columns: 1fr !important; } }

        /* Expand hint */
        .expand-hint {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 11px; color: rgba(255,255,255,0.25); margin-bottom: 24px;
          font-family: 'Space Mono', monospace;
          animation: swotFadeUp 0.5s ease 0.3s both;
        }

        /* Bottom strip */
        .swot-source-strip {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 18px; border-radius: 12px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          font-size: 10.5px; color: rgba(255,255,255,0.25); font-family: 'Space Mono', monospace;
          animation: swotFadeUp 0.6s ease 0.5s both;
        }
        .source-dot { width: 5px; height: 5px; border-radius: 50%; background: #10b981; animation: swotPulse 2.5s ease-in-out infinite; }

        @keyframes swotFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes swotPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.45; transform:scale(0.65); } }
        @keyframes modalIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      <div className="swot-page">
        <div className="swot-bg-mesh" />
        <div className="swot-grid-lines" />
        <Particles accent="rgba(245,158,11,1)" />
        <Navbar />

        <div className="swot-inner">

          {/* Hero */}
          <div className="swot-hero">
            <div className="swot-badge"><span className="swot-badge-dot" />Political Intelligence · Mangaluru</div>
            <h1 className="swot-title"><span>SWOT</span> Analysis</h1>
            <p className="swot-subtitle">Strategic intelligence for the 2028 election cycle — grounded in 2023 booth-level data across all 38 wards.</p>
          </div>

          {/* Category Tabs */}
          <div className="cat-tabs">
            {CATEGORIES.map(c => (
              <button key={c.id} className={`cat-tab${activeCategory === c.id ? ' active' : ''}`} onClick={() => setActiveCategory(c.id)}
                style={{ '--accent': c.accent }}>
                <span className="cat-tab-icon">{c.icon}</span>
                <div className="cat-tab-text">
                  <div className="cat-tab-label" style={activeCategory === c.id ? { color: c.accent } : {}}>{c.label}</div>
                  <div className="cat-tab-sub">{c.sublabel}</div>
                </div>
                {activeCategory === c.id && <div style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: c.accent, boxShadow: `0 0 8px ${c.accent}` }} />}
              </button>
            ))}
          </div>

          {/* Key Stats */}
          <div className="key-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {(activeCategory === 'political' ? [
              { label: 'Ward Win Rate', value: '65.8%', sub: '25 of 38 wards', color: '#10b981' },
              { label: 'Vote Share', value: '56.1%', sub: 'BJP in 2023', color: '#f59e0b' },
              { label: 'Lead Margin', value: '+14.1%', sub: 'over Congress', color: '#22d3ee' },
              { label: 'Strong Booths', value: '33', sub: 'polling stations', color: '#a78bfa' },
            ] : [
              { label: 'Port Cargo', value: '40MT+', sub: 'annual throughput', color: '#10b981' },
              { label: 'NRI Remittance', value: '₹8K Cr', sub: 'annual inflow', color: '#f59e0b' },
              { label: 'Smart City', value: '₹1,200Cr', sub: 'AMRUT pipeline', color: '#22d3ee' },
              { label: 'Literacy', value: '88%+', sub: 'above state avg', color: '#a78bfa' },
            ]).map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 10px', textAlign: 'center', animation: `swotFadeUp 0.4s ease ${i * 0.07}s both`, transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: -0.5, marginBottom: 2, fontFamily: 'Space Mono, monospace' }}>{s.value}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.62)', marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* 2028 Strategy (only for political) */}
          {activeCategory === 'political' && (
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(34,211,238,0.04))', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 18, padding: '18px 20px', marginBottom: 24, animation: 'swotFadeUp 0.5s ease 0.2s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#f0f4ff' }}>2028 Election Strategy Priorities</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#f59e0b', letterSpacing: 0.6, textTransform: 'uppercase', opacity: 0.8 }}>Derived from 2023 booth-level data</div>
                </div>
              </div>
              <div className="strategy-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon: '🎯', text: 'Defend 3 narrow-margin wins — Attavara, Mangaladevi, Padav East with hyper-local outreach' },
                  { icon: '🔄', text: 'Flip Bajal, Jeppu & Shivabagh — BJP-Congress gap under 10% in all three wards' },
                  { icon: '📱', text: 'Youth mobilisation drive in Kankanady & Jappimogar — lowest 18–25 voter registration' },
                  { icon: '🏗️', text: 'Lead 2028 campaign on Smart City deliverables & port infrastructure completions' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '9px 11px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{p.icon}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Click hint */}
          <div className="expand-hint">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/><path d="M6 4v4M4 6h4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            Click any quadrant to expand details
          </div>

          {/* 2×2 SWOT Grid */}
          <div className="swot-grid">
            {QUADRANT_KEYS.map((key, idx) => {
              const q = swotData[key];
              return (
                <div
                  key={key}
                  onClick={() => setModalKey(key)}
                  style={{
                    position: 'relative', borderRadius: 20, padding: '20px 18px 18px',
                    border: `1px solid ${hovered === key ? q.border : 'rgba(255,255,255,0.07)'}`,
                    background: hovered === key ? `linear-gradient(145deg, ${q.bg}, rgba(10,18,35,0.98))` : 'linear-gradient(145deg, rgba(15,25,50,0.75), rgba(8,13,26,0.95))',
                    boxShadow: hovered === key ? `0 10px 40px ${q.glow}, inset 0 1px 0 rgba(255,255,255,0.07)` : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    transition: 'all 0.28s cubic-bezier(.4,0,.2,1)', overflow: 'hidden',
                    cursor: 'pointer', animation: `swotFadeUp 0.5s ease ${idx * 0.08}s both`,
                  }}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Glow */}
                  <div style={{ position: 'absolute', top: -25, right: -25, width: 110, height: 110, borderRadius: '50%', background: `radial-gradient(circle, ${q.color}1e, transparent 70%)`, opacity: hovered === key ? 1 : 0.35, transition: 'opacity 0.3s', pointerEvents: 'none' }} />
                  {/* BG letter */}
                  <div style={{ position: 'absolute', bottom: -8, right: 10, fontSize: 80, fontWeight: 900, color: q.color, opacity: 0.045, lineHeight: 1, fontFamily: 'Sora, sans-serif', pointerEvents: 'none', userSelect: 'none' }}>{key}</div>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: q.badgeBg, border: `1px solid ${q.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{q.icon}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#eef2ff' }}>{q.title}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: q.color, opacity: 0.75 }}>{q.subtitle}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: q.color, fontFamily: 'Sora, sans-serif', opacity: 0.6 }}>{key}</div>
                  </div>

                  <div style={{ height: 1, background: `linear-gradient(90deg, ${q.color}25, transparent)`, marginBottom: 12 }} />

                  {/* Item pills */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {q.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, flex: 1, paddingRight: 8, lineHeight: 1.35 }}>{item.label}</span>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: item.statColor, background: `${item.statColor}12`, border: `1px solid ${item.statColor}25`, borderRadius: 5, padding: '2px 7px', whiteSpace: 'nowrap', fontFamily: 'Space Mono, monospace' }}>{item.stat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Expand indicator */}
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', opacity: hovered === key ? 0.7 : 0.3, transition: 'opacity 0.2s', position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: 9.5, color: q.color, fontFamily: 'Space Mono, monospace', fontWeight: 700, letterSpacing: 0.5 }}>VIEW DETAILS →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data source */}
          <div className="swot-source-strip">
            <span className="source-dot" />
            <span>Data source: 2023 Karnataka Assembly Election · Mangaluru City Constituency · 38 Wards · 246,952 Registered Voters</span>
          </div>

        </div>
      </div>

      {/* Detail Modal */}
      {modalKey && (
        <div onClick={() => setModalKey(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.88)', backdropFilter: 'blur(14px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'modalIn 0.18s ease both' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #0d1a30, #080d1a)', border: `1px solid ${swotData[modalKey].border}`, borderRadius: 24, padding: '26px 24px', maxWidth: 540, width: '100%', boxShadow: `0 24px 80px ${swotData[modalKey].glow}`, maxHeight: '82vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: swotData[modalKey].badgeBg, border: `1px solid ${swotData[modalKey].border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{swotData[modalKey].icon}</div>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#f0f4ff', fontFamily: 'Sora, sans-serif' }}>{swotData[modalKey].title}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: swotData[modalKey].color, opacity: 0.8, marginLeft: 41 }}>{swotData[modalKey].subtitle}</div>
              </div>
              <button onClick={() => setModalKey(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ height: 1, background: `linear-gradient(90deg, ${swotData[modalKey].color}30, transparent)`, marginBottom: 18 }} />
            {swotData[modalKey].items.map((item, i) => (
              <div key={i} style={{ marginBottom: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e8eeff', lineHeight: 1.3, flex: 1, fontFamily: 'Sora, sans-serif' }}>{item.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: item.statColor, background: `${item.statColor}14`, border: `1px solid ${item.statColor}28`, borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap', letterSpacing: 0.3, fontFamily: 'Space Mono, monospace' }}>{item.stat}</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', lineHeight: 1.62, margin: 0 }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}