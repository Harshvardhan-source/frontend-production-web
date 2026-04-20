import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';

// ─── SWOT quadrant config ─────────────────────────────────────────────────────
const QUADRANTS = [
  {
    key: 'S',
    title: 'Strengths',
    subtitle: 'Internal · Positive',
    icon: '💪',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.18)',
    border: 'rgba(16,185,129,0.28)',
    bg: 'rgba(16,185,129,0.05)',
    badgeBg: 'rgba(16,185,129,0.12)',
    description: 'Internal advantages and resources that give your constituency an edge.',
    comingSoon: true,
  },
  {
    key: 'W',
    title: 'Weaknesses',
    subtitle: 'Internal · Negative',
    icon: '⚠',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.18)',
    border: 'rgba(248,113,113,0.28)',
    bg: 'rgba(248,113,113,0.05)',
    badgeBg: 'rgba(248,113,113,0.12)',
    description: 'Internal gaps, vulnerabilities, or areas that need improvement.',
    comingSoon: true,
  },
  {
    key: 'O',
    title: 'Opportunities',
    subtitle: 'External · Positive',
    icon: '🚀',
    color: '#22d3ee',
    glow: 'rgba(34,211,238,0.18)',
    border: 'rgba(34,211,238,0.28)',
    bg: 'rgba(34,211,238,0.05)',
    badgeBg: 'rgba(34,211,238,0.12)',
    description: 'External factors and trends that can be leveraged for political gain.',
    comingSoon: true,
  },
  {
    key: 'T',
    title: 'Threats',
    subtitle: 'External · Negative',
    icon: '🛡',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.18)',
    border: 'rgba(245,158,11,0.28)',
    bg: 'rgba(245,158,11,0.05)',
    badgeBg: 'rgba(245,158,11,0.12)',
    description: 'External risks, opposition tactics, or challenges to watch.',
    comingSoon: true,
  },
];

// ─── Animated particle dots ───────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 38 }, () => ({
      x:   Math.random() * canvas.width,
      y:   Math.random() * canvas.height,
      r:   Math.random() * 1.5 + 0.4,
      vx:  (Math.random() - 0.5) * 0.22,
      vy:  (Math.random() - 0.5) * 0.22,
      a:   Math.random() * 0.4 + 0.08,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,158,11,${d.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
}

// ─── Main SWOT page ───────────────────────────────────────────────────────────
export default function Swot() {
  const [hovered, setHovered] = useState(null);

  return (
    <>
      <style>{`
        .swot-page {
          min-height: 100vh;
          background: #080d1a;
          padding-top: var(--nav-h, 64px);
          padding-bottom: calc(var(--tab-h, 56px) + var(--safe-bottom, 0px) + 24px);
          position: relative;
          overflow: hidden;
        }

        /* Radial mesh background */
        .swot-bg-mesh {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 20%, rgba(16,185,129,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 80% 80%, rgba(34,211,238,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 80% 10%, rgba(245,158,11,0.05) 0%, transparent 70%),
            radial-gradient(ellipse 55% 35% at 10% 85%, rgba(248,113,113,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .swot-inner {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px 32px;
        }

        /* ── Hero banner ── */
        .swot-hero {
          text-align: center;
          margin-bottom: 48px;
          animation: swotFadeUp 0.6s ease both;
        }
        .swot-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: 999px;
          padding: 5px 16px;
          font-size: 11px;
          font-weight: 700;
          color: #f59e0b;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .swot-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #f59e0b;
          animation: swotPulse 2s ease-in-out infinite;
        }
        .swot-title {
          font-size: clamp(32px, 7vw, 52px);
          font-weight: 900;
          color: #f0f4ff;
          letter-spacing: -1.5px;
          line-height: 1.08;
          margin-bottom: 14px;
          font-family: var(--font-display, 'Georgia', serif);
        }
        .swot-title span {
          background: linear-gradient(135deg, #f59e0b, #fcd34d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .swot-subtitle {
          font-size: 15px;
          color: rgba(255,255,255,0.38);
          max-width: 480px;
          margin: 0 auto 28px;
          line-height: 1.6;
        }

        /* Coming soon pill */
        .swot-coming-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(34,211,238,0.08));
          border: 1px solid rgba(245,158,11,0.22);
          border-radius: 14px;
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
        }
        .swot-coming-pill strong {
          color: #f59e0b;
          font-weight: 800;
        }

        /* ── SWOT 2×2 grid ── */
        .swot-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 32px;
        }
        @media (max-width: 520px) {
          .swot-grid { grid-template-columns: 1fr; }
        }

        .swot-card {
          position: relative;
          border-radius: 18px;
          padding: 24px 22px 22px;
          border: 1px solid;
          cursor: default;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          animation: swotFadeUp 0.6s ease both;
        }
        .swot-card:hover {
          transform: translateY(-3px);
        }
        .swot-card-glow {
          position: absolute;
          top: -30px; right: -30px;
          width: 120px; height: 120px;
          border-radius: 50%;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .swot-card-letter {
          font-size: 42px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 10px;
          font-family: var(--font-display, 'Georgia', serif);
          letter-spacing: -2px;
          opacity: 0.9;
        }
        .swot-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .swot-card-title {
          font-size: 16px;
          font-weight: 800;
          color: #e2e8f0;
          line-height: 1.2;
        }
        .swot-card-subtitle {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          opacity: 0.55;
          margin-top: 2px;
        }
        .swot-card-icon {
          font-size: 22px;
          line-height: 1;
          flex-shrink: 0;
        }
        .swot-card-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          line-height: 1.55;
          margin-bottom: 16px;
        }
        .swot-card-soon {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          border-radius: 8px;
          padding: 4px 10px;
          border: 1px solid;
        }
        .swot-card-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 14px 0;
        }
        .swot-card-placeholder {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .swot-placeholder-bar {
          height: 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }
        .swot-placeholder-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          animation: swotShimmer 2s ease infinite;
        }

        /* ── Bottom info strip ── */
        .swot-info-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          animation: swotFadeUp 0.8s ease 0.3s both;
        }
        .swot-info-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .swot-info-icon {
          width: 36px; height: 36px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .swot-info-label {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.7);
          margin-bottom: 3px;
        }
        .swot-info-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          line-height: 1.45;
        }

        /* ── Keyframes ── */
        @keyframes swotFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes swotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes swotShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="swot-page">
        <div className="swot-bg-mesh" />
        <Particles />
        <Navbar />

        <div className="swot-inner">

          {/* ── Hero ── */}
          <div className="swot-hero">
            <div className="swot-badge">
              <span className="swot-badge-dot" />
              Political Intelligence
            </div>
            <h1 className="swot-title">
              <span>SWOT</span> Analysis
            </h1>
            <p className="swot-subtitle">
              Strategic analysis of your constituency — strengths, weaknesses,
              opportunities and threats mapped to real voter data.
            </p>
            <div className="swot-coming-pill">
              <span style={{ fontSize: 18 }}>🔬</span>
              <span><strong>Feature launching soon</strong> — AI-powered analysis is being built</span>
            </div>
          </div>

          {/* ── 2×2 SWOT Grid ── */}
          <div className="swot-grid">
            {QUADRANTS.map((q, idx) => (
              <div
                key={q.key}
                className="swot-card"
                style={{
                  background: hovered === q.key
                    ? `linear-gradient(145deg, ${q.bg}, rgba(10,18,35,0.98))`
                    : 'linear-gradient(145deg, rgba(17,28,52,0.7), rgba(10,18,35,0.95))',
                  borderColor: hovered === q.key ? q.border : 'rgba(255,255,255,0.07)',
                  boxShadow: hovered === q.key
                    ? `0 8px 32px ${q.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  animationDelay: `${idx * 0.08}s`,
                }}
                onMouseEnter={() => setHovered(q.key)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Glow orb */}
                <div
                  className="swot-card-glow"
                  style={{
                    background: `radial-gradient(circle, ${q.color}22 0%, transparent 70%)`,
                    opacity: hovered === q.key ? 1 : 0.4,
                  }}
                />

                {/* Big letter */}
                <div className="swot-card-letter" style={{ color: q.color }}>
                  {q.key}
                </div>

                {/* Header row */}
                <div className="swot-card-header">
                  <div>
                    <div className="swot-card-title">{q.title}</div>
                    <div className="swot-card-subtitle" style={{ color: q.color }}>{q.subtitle}</div>
                  </div>
                  <span className="swot-card-icon">{q.icon}</span>
                </div>

                {/* Description */}
                <p className="swot-card-desc">{q.description}</p>

                {/* Divider + placeholder bars (coming soon state) */}
                <div className="swot-card-divider" />
                <div className="swot-card-placeholder">
                  {[80, 60, 45].map((w, i) => (
                    <div key={i} className="swot-placeholder-bar" style={{ width: `${w}%` }} />
                  ))}
                </div>

                {/* Coming soon badge */}
                <div style={{ marginTop: 14 }}>
                  <span
                    className="swot-card-soon"
                    style={{
                      color: q.color,
                      background: q.badgeBg,
                      borderColor: q.border,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: q.color, display: 'inline-block', animation: 'swotPulse 2s ease-in-out infinite' }} />
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Info strip ── */}
          <div className="swot-info-strip">
            {[
              {
                icon: '🧠', iconBg: 'rgba(139,92,246,0.12)', iconColor: '#a78bfa',
                label: 'AI-Powered Insights',
                desc: 'Automatically generated from voter survey data, SIR scores, and booth performance.',
              },
              {
                icon: '📊', iconBg: 'rgba(34,211,238,0.1)', iconColor: '#22d3ee',
                label: 'Ward-Level Drill Down',
                desc: 'SWOT breakdown for every ward and booth in your constituency.',
              },
              {
                icon: '🗓', iconBg: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b',
                label: 'Election-Ready Reports',
                desc: 'Export strategy briefs for your team ahead of polling day.',
              },
            ].map(item => (
              <div key={item.label} className="swot-info-card">
                <div className="swot-info-icon" style={{ background: item.iconBg }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                </div>
                <div>
                  <div className="swot-info-label" style={{ color: item.iconColor }}>{item.label}</div>
                  <div className="swot-info-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}