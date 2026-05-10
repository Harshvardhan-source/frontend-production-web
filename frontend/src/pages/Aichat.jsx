/**
 * AiChat.jsx — ShaastraAI · Mangaluru South Constituency Intelligence
 *
 * Design: ChatGPT-style — centred hero on empty state, input pinned bottom-centre,
 *         SVG circuit-brain logo, full-width chat after first message.
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { aiChatApi } from '../api/client';
import Navbar from '../components/Navbar';

// ── palette ───────────────────────────────────────────────────────────────────
const PALETTE = ['#4f46e5','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

const SUGGESTED = [
  { icon: '🗳️', text: 'Total voter count by ward' },
  { icon: '🕌', text: 'Religion-wise voter breakdown' },
  { icon: '📊', text: 'Ward-wise survey completion' },
  { icon: '🏆', text: 'Top schemes by beneficiaries' },
  { icon: '📈', text: '2019 vs 2023 polling comparison' },
  { icon: '🎯', text: 'Strategic priority wards' },
];

// ════════════════════════════════════════════════════════════════════════════════
// TYPEWRITER HOOK
// Simulates character-by-character streaming from a complete string.
// Speed scales with length so long replies don't drag forever.
// Returns { displayed, done } — render `displayed`, show cursor until `done`.
// ════════════════════════════════════════════════════════════════════════════════
function useTypewriter(fullText, active = true, onTick) {
  const [displayed, setDisplayed] = useState('');
  const [done,      setDone]      = useState(false);
  const rafRef    = useRef(null);
  const indexRef  = useRef(0);

  useEffect(() => {
    if (!active || !fullText) {
      setDisplayed(fullText || '');
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    // Chars-per-frame scales with response length so it always feels snappy
    const cpf = fullText.length > 2000 ? 10
              : fullText.length > 800  ? 6
              : fullText.length > 300  ? 4
              : 2;

    const tick = () => {
      indexRef.current = Math.min(indexRef.current + cpf, fullText.length);
      setDisplayed(fullText.slice(0, indexRef.current));
      onTick?.();
      if (indexRef.current < fullText.length) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [fullText, active]);

  return { displayed, done };
}

// ── SVG Circuit-Brain Logo ─────────────────────────────────────────────────────
function BrainLogo({ size = 72, animated = false }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      style={animated ? { animation: 'brainPulse 3s ease-in-out infinite' } : {}}
    >
      {/* Left hemisphere */}
      <path
        d="M50 15 C35 15 20 22 18 35 C14 38 12 44 14 50 C12 56 14 63 20 67
           C20 78 30 88 42 88 C46 88 50 86 50 86"
        stroke="url(#brainGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
        fill="none"
      />
      {/* Right hemisphere */}
      <path
        d="M50 15 C65 15 80 22 82 35 C86 38 88 44 86 50 C88 56 86 63 80 67
           C80 78 70 88 58 88 C54 88 50 86 50 86"
        stroke="url(#brainGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
        fill="none"
      />
      {/* Centre divider */}
      <line x1="50" y1="15" x2="50" y2="86" stroke="url(#brainGrad)" strokeWidth="3" strokeLinecap="round" />

      {/* Left circuit traces */}
      <path d="M50 38 L36 38 L36 52" stroke="#6366f1" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="52" r="3.5" fill="#4f46e5" />
      <path d="M50 60 L32 60 L32 68" stroke="#6366f1" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="68" r="3.5" fill="#4f46e5" />

      {/* Right circuit traces */}
      <path d="M50 38 L64 38 L64 52" stroke="#818cf8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="64" cy="52" r="3.5" fill="#7c3aed" />
      <path d="M50 60 L68 60 L68 68" stroke="#818cf8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="68" cy="68" r="3.5" fill="#7c3aed" />

      {/* Glow dots on spine */}
      <circle cx="50" cy="30" r="2.5" fill="#a5b4fc" opacity="0.9" />
      <circle cx="50" cy="55" r="2"   fill="#a5b4fc" opacity="0.7" />

      <defs>
        <linearGradient id="brainGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4f46e5" />
          <stop offset="50%"  stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Small avatar version of brain ─────────────────────────────────────────────
function BrainAvatar({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 15 C35 15 20 22 18 35 C14 38 12 44 14 50 C12 56 14 63 20 67 C20 78 30 88 42 88 C46 88 50 86 50 86"
        stroke="#818cf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M50 15 C65 15 80 22 82 35 C86 38 88 44 86 50 C88 56 86 63 80 67 C80 78 70 88 58 88 C54 88 50 86 50 86"
        stroke="#818cf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="50" y1="15" x2="50" y2="86" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 38 L36 38 L36 52" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="52" r="5" fill="#4f46e5" />
      <path d="M50 38 L64 38 L64 52" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="64" cy="52" r="5" fill="#7c3aed" />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// INLINE FORMATTER  (bold, inline-code)
// ════════════════════════════════════════════════════════════════════════════════
function fmt(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} style={{color:'#e2e8f0',fontWeight:700}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={i} style={S.inlineCode}>{p.slice(1,-1)}</code>;
    return p;
  });
}

// ════════════════════════════════════════════════════════════════════════════════
// TABLE RENDERER
// Parses GFM pipe tables:
//   | Col A | Col B |
//   |-------|-------|
//   | val1  | val2  |
// ════════════════════════════════════════════════════════════════════════════════
function isTableRow(line) {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}
function isSeparatorRow(line) {
  return isTableRow(line) && /^\|[\s\-:|]+\|/.test(line.trim()) && /^[\|\s\-:]+$/.test(line.trim());
}
function parseTableCells(line) {
  return line.trim().replace(/^\||\|$/g,'').split('|').map(c => c.trim());
}

function MarkdownTable({ headers, rows }) {
  return (
    <div style={{overflowX:'auto', marginTop:14, marginBottom:6}}>
      <table style={{
        width:'100%', borderCollapse:'collapse',
        fontSize:13, fontFamily:'inherit',
        border:'1px solid rgba(99,102,241,0.2)',
        borderRadius:10, overflow:'hidden',
      }}>
        <thead>
          <tr>
            {headers.map((h, ci) => (
              <th key={ci} style={{
                padding:'9px 14px',
                background:'linear-gradient(135deg,rgba(79,70,229,0.35),rgba(124,58,237,0.25))',
                color:'#c7d2fe', fontWeight:700, fontSize:12,
                textAlign:'left', letterSpacing:'0.04em',
                borderBottom:'1px solid rgba(99,102,241,0.35)',
                borderRight: ci < headers.length-1 ? '1px solid rgba(99,102,241,0.15)' : 'none',
                whiteSpace:'nowrap',
              }}>
                {fmt(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{
              background: ri%2===0 ? 'rgba(17,27,46,0.9)' : 'rgba(22,33,58,0.7)',
              transition:'background 0.15s',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(79,70,229,0.12)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=ri%2===0?'rgba(17,27,46,0.9)':'rgba(22,33,58,0.7)'; }}
            >
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding:'8px 14px',
                  color: ci===0 ? '#e2e8f0' : '#94a3b8',
                  fontWeight: ci===0 ? 600 : 400,
                  borderBottom:'1px solid rgba(51,65,85,0.35)',
                  borderRight: ci < row.length-1 ? '1px solid rgba(51,65,85,0.2)' : 'none',
                  fontSize:13, lineHeight:1.5,
                }}>
                  {fmt(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MARKDOWN RENDERER  (headings, lists, code, tables, hr, paragraphs)
// ════════════════════════════════════════════════════════════════════════════════
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Headings ──────────────────────────────────────────────────────────────
    if (/^### (.+)/.test(line)) {
      elements.push(<h3 key={i} style={S.h3}>{line.replace(/^### /,'')}</h3>);

    } else if (/^## (.+)/.test(line)) {
      elements.push(<h2 key={i} style={S.h2}>{line.replace(/^## /,'')}</h2>);

    } else if (/^# (.+)/.test(line)) {
      elements.push(<h1 key={i} style={S.h1}>{line.replace(/^# /,'')}</h1>);

    // ── Bullet list ───────────────────────────────────────────────────────────
    } else if (/^[\-\*] (.+)/.test(line)) {
      const items = [];
      while (i < lines.length && /^[\-\*] (.+)/.test(lines[i])) {
        items.push(<li key={i} style={S.li}>{fmt(lines[i].replace(/^[\-\*] /,''))}</li>);
        i++;
      }
      elements.push(<ul key={'ul'+i} style={S.ul}>{items}</ul>);
      continue;

    // ── Numbered list ─────────────────────────────────────────────────────────
    } else if (/^\d+\. (.+)/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. (.+)/.test(lines[i])) {
        items.push(<li key={i} style={S.li}>{fmt(lines[i].replace(/^\d+\. /,''))}</li>);
        i++;
      }
      elements.push(<ol key={'ol'+i} style={S.ol}>{items}</ol>);
      continue;

    // ── Fenced code block ─────────────────────────────────────────────────────
    } else if (line.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      elements.push(<pre key={i} style={S.pre}><code>{code.join('\n')}</code></pre>);

    // ── Pipe table ────────────────────────────────────────────────────────────
    // Detect: current line is a table row, next line is a separator row
    } else if (isTableRow(line) && i+1 < lines.length && isSeparatorRow(lines[i+1])) {
      const headers = parseTableCells(line);
      i += 2; // skip header row + separator row
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(parseTableCells(lines[i]));
        i++;
      }
      elements.push(<MarkdownTable key={'tbl'+i} headers={headers} rows={rows} />);
      continue;

    // ── Horizontal rule ───────────────────────────────────────────────────────
    } else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={S.hr} />);

    // ── Empty line ────────────────────────────────────────────────────────────
    } else if (!line.trim()) {
      elements.push(<div key={i} style={{height:8}} />);

    // ── Paragraph ─────────────────────────────────────────────────────────────
    } else {
      elements.push(<p key={i} style={S.p}>{fmt(line)}</p>);
    }

    i++;
  }
  return elements;
}

// ════════════════════════════════════════════════════════════════════════════════
// CHART RENDERER
// ════════════════════════════════════════════════════════════════════════════════
function ChartRenderer({ spec }) {
  if (!spec) return null;
  const { type, title, labels=[], datasets=[] } = spec;
  const chartData = labels.map((l,i) => { const p={name:l}; datasets.forEach(d=>{ p[d.label]=d.data[i]??0; }); return p; });
  const pieData   = labels.map((l,i) => ({ name:l, value:(datasets[0]?.data??[])[i]??0 }));
  const wrap = { background:'rgba(30,41,59,0.6)', borderRadius:12, padding:'16px 8px 8px', marginTop:16, border:'1px solid rgba(99,102,241,0.25)' };
  const ttip = { contentStyle:{background:'#1e293b',border:'1px solid #334155',borderRadius:8,color:'#e2e8f0'}, labelStyle:{color:'#94a3b8'} };
  const titleEl = <div style={{textAlign:'center',color:'#94a3b8',fontSize:13,marginBottom:8,fontWeight:600}}>{title}</div>;

  if (type==='pie'||type==='doughnut') return (
    <div style={wrap}>{titleEl}
      <ResponsiveContainer width="100%" height={280}>
        <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={type==='doughnut'?60:0} outerRadius={100} paddingAngle={2}
          label={({name,percent})=>`${name} ${(percent*100).toFixed(1)}%`} labelLine={{stroke:'#475569'}}>
          {pieData.map((_,idx)=><Cell key={idx} fill={PALETTE[idx%PALETTE.length]}/>)}
        </Pie><Tooltip {...ttip}/><Legend wrapperStyle={{color:'#94a3b8',fontSize:12}}/></PieChart>
      </ResponsiveContainer>
    </div>);

  if (type==='radar') return (
    <div style={wrap}>{titleEl}
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData}><PolarGrid stroke="#334155"/>
          <PolarAngleAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:11}}/>
          {datasets.map((d,i)=><Radar key={i} name={d.label} dataKey={d.label} stroke={PALETTE[i%8]} fill={PALETTE[i%8]} fillOpacity={0.2}/>)}
          <Legend wrapperStyle={{color:'#94a3b8',fontSize:12}}/><Tooltip {...ttip}/>
        </RadarChart>
      </ResponsiveContainer>
    </div>);

  if (type==='line') return (
    <div style={wrap}>{titleEl}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
          <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:11}}/><YAxis tick={{fill:'#64748b',fontSize:11}}/>
          <Tooltip {...ttip}/><Legend wrapperStyle={{color:'#94a3b8',fontSize:12}}/>
          {datasets.map((d,i)=><Line key={i} type="monotone" dataKey={d.label} stroke={PALETTE[i%8]} strokeWidth={2} dot={{r:3}}/>)}
        </LineChart>
      </ResponsiveContainer>
    </div>);

  return (
    <div style={wrap}>{titleEl}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
          <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:10}} interval={chartData.length>15?2:0} angle={chartData.length>10?-30:0} textAnchor={chartData.length>10?'end':'middle'} height={chartData.length>10?50:30}/>
          <YAxis tick={{fill:'#64748b',fontSize:11}}/><Tooltip {...ttip}/><Legend wrapperStyle={{color:'#94a3b8',fontSize:12}}/>
          {datasets.map((d,i)=><Bar key={i} dataKey={d.label} fill={PALETTE[i%8]} stackId={type==='stackedBar'?'stack':undefined} radius={type!=='stackedBar'?[3,3,0,0]:undefined}/>)}
        </BarChart>
      </ResponsiveContainer>
    </div>);
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT BAR
// ════════════════════════════════════════════════════════════════════════════════
function ExportBar({ exportSpec }) {
  const [loading, setLoading] = useState(false);
  const dl = async (fmt) => {
    setLoading(true);
    try {
      const spec={...exportSpec,format:fmt};
      const res=await aiChatApi.export(spec);
      const url=URL.createObjectURL(new Blob([res.data]));
      const a=document.createElement('a'); a.href=url; a.download=spec.filename||`export.${fmt}`; a.click();
      URL.revokeObjectURL(url);
    } catch(e) { alert('Export failed: '+(e.userMessage||e.message)); }
    finally { setLoading(false); }
  };
  return (
    <div style={S.exportBar}>
      <span style={{color:'#94a3b8',fontSize:12,marginRight:8}}>📦 Export:</span>
      {['csv','xlsx','pdf'].map(f=>(
        <button key={f} disabled={loading} onClick={()=>dl(f)} style={S.exportBtn}>{f.toUpperCase()}</button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE  — AI messages stream character-by-character via useTypewriter.
// Charts / exports / sources only appear once the full text is done rendering
// so they don't flash in before the text catches up.
// ════════════════════════════════════════════════════════════════════════════════
function MessageBubble({ msg, onTick }) {
  const isUser = msg.role === 'user';

  // Only animate the newest AI message (isNew flag set in send()).
  // All previous messages and user messages render instantly.
  const { displayed, done } = useTypewriter(
    msg.content,
    !isUser && !!msg.isNew,
    onTick,
  );

  const visibleText = (isUser || !msg.isNew) ? msg.content : displayed;
  const isDone      = isUser || !msg.isNew || done;

  return (
    <div style={{display:'flex',justifyContent:isUser?'flex-end':'flex-start',marginBottom:20}}>
      {!isUser && (
        <div style={S.avatar}>
          <BrainAvatar size={20} />
        </div>
      )}
      <div style={{maxWidth:'75%',minWidth:80}}>
        <div style={isUser ? S.userBubble : S.aiBubble}>
          {isUser ? (
            <p style={{margin:0,color:'#fff',lineHeight:1.6,fontSize:14}}>{msg.content}</p>
          ) : (
            <div style={{color:'#cbd5e1',lineHeight:1.7}}>
              {renderMarkdown(visibleText)}
              {/* Blinking cursor while still typing */}
              {!isDone && (
                <span className="shaastra-cursor" style={{
                  display:'inline-block', width:2, height:'1em',
                  background:'#818cf8', marginLeft:2, verticalAlign:'text-bottom',
                  borderRadius:1,
                }}/>
              )}
            </div>
          )}
        </div>

        {/* Charts, exports, sources only render after typewriter finishes */}
        {isDone && msg.chartSpec  && <ChartRenderer spec={msg.chartSpec}/>}
        {isDone && msg.exportSpec && <ExportBar exportSpec={msg.exportSpec}/>}
        {isDone && msg.filesUsed?.length>0 && (
          <div style={S.filesUsed}>📁 {msg.filesUsed.join(' · ')}</div>
        )}
        {isDone && <div style={S.timestamp}>{msg.timestamp}</div>}
      </div>

      {isUser && (
        <div style={{...S.avatar,background:'linear-gradient(135deg,#4338ca,#4f46e5)',marginLeft:10,marginRight:0}}>
          <span style={{fontSize:12,color:'#fff',fontWeight:700}}>U</span>
        </div>
      )}

      {/* Cursor blink keyframe — injected once, scoped class name */}
      <style>{`
        @keyframes shaastraCursorBlink {
          0%,100% { opacity:1; }
          50%      { opacity:0; }
        }
        .shaastra-cursor { animation: shaastraCursorBlink 0.7s step-start infinite; }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// THINKING INDICATOR
// ════════════════════════════════════════════════════════════════════════════════
function ThinkingIndicator() {
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:20}}>
      <div style={{position:'relative',flexShrink:0}}>
        <div style={S.avatar}><BrainAvatar size={20}/></div>
        <span className="shaastra-pulse-ring"/>
      </div>
      <div style={{...S.aiBubble,padding:'14px 20px',minWidth:180}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',gap:5,alignItems:'center'}}>
            <span className="shaastra-dot d1"/>
            <span className="shaastra-dot d2"/>
            <span className="shaastra-dot d3"/>
          </div>
          <span className="shaastra-think-label" style={{color:'#818cf8',fontSize:12,fontWeight:600,letterSpacing:'0.04em'}}>
            ShaastraAI is thinking…
          </span>
        </div>
        <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:6}}>
          <div className="shaastra-shimmer" style={{width:'88%'}}/>
          <div className="shaastra-shimmer" style={{width:'66%'}}/>
          <div className="shaastra-shimmer" style={{width:'78%'}}/>
        </div>
      </div>
      <style>{`
        .shaastra-pulse-ring {
          position:absolute; top:-5px; left:-5px;
          width:44px; height:44px; border-radius:12px;
          border:2px solid rgba(99,102,241,0.75);
          animation:saaRing 1.5s ease-out infinite;
          pointer-events:none;
        }
        @keyframes saaRing {
          0%  { transform:scale(0.88); opacity:0.9; }
          70% { transform:scale(1.3);  opacity:0;   }
          100%{ transform:scale(1.3);  opacity:0;   }
        }
        .shaastra-dot {
          display:inline-block; width:8px; height:8px; border-radius:50%;
          background:linear-gradient(135deg,#4f46e5,#7c3aed);
          animation:saaDot 1.3s ease-in-out infinite;
          box-shadow:0 0 8px rgba(99,102,241,0.7);
        }
        .d2{animation-delay:0.18s;} .d3{animation-delay:0.36s;}
        @keyframes saaDot {
          0%,80%,100%{ transform:translateY(0) scale(1);    opacity:0.45; }
          40%        { transform:translateY(-8px) scale(1.2);opacity:1;    }
        }
        .shaastra-think-label{ animation:saaFade 2s ease-in-out infinite; }
        @keyframes saaFade{ 0%,100%{opacity:0.45;} 50%{opacity:1;} }
        .shaastra-shimmer{
          height:8px; border-radius:6px;
          background:linear-gradient(90deg,rgba(51,65,85,0.4) 25%,rgba(99,102,241,0.3) 50%,rgba(51,65,85,0.4) 75%);
          background-size:200% 100%;
          animation:saaShimmer 1.6s linear infinite;
        }
        @keyframes saaShimmer{ 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
        @keyframes brainPulse{
          0%,100%{filter:drop-shadow(0 0 8px rgba(99,102,241,0.4));}
          50%    {filter:drop-shadow(0 0 26px rgba(99,102,241,0.9));}
        }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SHARED INPUT BOX
// ════════════════════════════════════════════════════════════════════════════════
function InputBox({ inputRef, input, setInput, loading, send, handleKey, includeData, setIncludeData }) {
  return (
    <div style={{width:'100%',maxWidth:720,margin:'0 auto'}}>
      <div style={{
        display:'flex', alignItems:'flex-end', gap:8,
        background:'rgba(28,38,58,0.97)',
        border:'1.5px solid rgba(99,102,241,0.28)',
        borderRadius:30,
        padding:'8px 8px 8px 22px',
        boxShadow:'0 6px 40px rgba(0,0,0,0.45)',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about voters, wards, schemes, strategy…"
          disabled={loading}
          rows={1}
          style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            color:'#e2e8f0', fontSize:15, lineHeight:1.6, fontFamily:'inherit',
            resize:'none', minHeight:38, maxHeight:140, padding:'4px 0',
            scrollbarWidth:'thin', scrollbarColor:'#334155 transparent',
          }}
          onInput={e=>{ e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,140)+'px'; }}
        />
        <button
          onClick={()=>send()}
          disabled={loading||!input.trim()}
          style={{
            width:42, height:42, borderRadius:21, flexShrink:0,
            background:loading||!input.trim()?'rgba(99,102,241,0.15)':'linear-gradient(135deg,#4f46e5,#7c3aed)',
            border:'none', cursor:loading||!input.trim()?'default':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:17,
            boxShadow:loading||!input.trim()?'none':'0 2px 14px rgba(79,70,229,0.55)',
            transition:'all 0.2s',
          }}
        >➤</button>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:9,padding:'0 6px'}}>
        <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',userSelect:'none'}}>
          <input type="checkbox" checked={includeData} onChange={e=>setIncludeData(e.target.checked)}
            style={{accentColor:'#4f46e5',width:13,height:13}}/>
          <span style={{color:'#475569',fontSize:12}}>Use data files</span>
        </label>
        <span style={{color:'#1e293b',fontSize:11}}>
          <kbd style={S.kbd}>Enter</kbd> send · <kbd style={S.kbd}>Shift+Enter</kbd> new line
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export default function AiChat() {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [includeData, setIncludeData] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const hasMessages = messages.length > 0;

  // scrollTick increments every time a message streams a character,
  // triggering the auto-scroll useEffect so the view follows the typewriter.
  const [scrollTick, setScrollTick] = useState(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading, scrollTick]);

  const history = useMemo(() => messages.map(m=>({role:m.role,content:m.content})), [messages]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev=>[...prev,{
      id:Date.now(), role:'user', content:msg,
      timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
    }]);
    setLoading(true);
    try {
      const { data } = await aiChatApi.send(msg, history, includeData);
      setMessages(prev=>[...prev,{
        id:Date.now()+1, role:'assistant',
        content:    data.reply      || '',
        chartSpec:  data.chartSpec  || null,
        exportSpec: data.exportSpec || null,
        filesUsed:  data.filesUsed  || [],
        isNew:      true,   // ← flag: animate this message
        timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
      }]);
    } catch(e) {
      setMessages(prev=>[...prev,{
        id:Date.now()+1, role:'assistant',
        content:'⚠️ **Error:** '+(e.userMessage||e.message||'Something went wrong.'),
        isNew: true,
        timestamp:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
      }]);
    } finally {
      setLoading(false);
      setTimeout(()=>inputRef.current?.focus(),100);
    }
  }, [input, loading, history, includeData]);

  const handleKey = e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} };

  const inputProps = { inputRef, input, setInput, loading, send, handleKey, includeData, setIncludeData };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <Navbar />

      {/* ── Slim sub-header ── */}
      <div style={S.subHeader}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <div style={S.subHeaderIcon}><BrainAvatar size={17}/></div>
          <span style={S.subHeaderTitle}>ShaastraAI</span>
          <span style={{color:'#1e293b',fontSize:13}}>·</span>
          <span style={S.subHeaderSub}>Mangaluru South Intelligence</span>
        </div>
        <button onClick={()=>setMessages([])} style={S.clearBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Clear
        </button>
      </div>

      {/* ══ EMPTY STATE — ChatGPT-style hero ════════════════════════════════ */}
      {!hasMessages && (
        <div style={S.heroWrap}>
          {/* Animated circuit-brain logo */}
          <div style={S.heroLogoWrap}>
            <BrainLogo size={90} animated />
          </div>

          <h1 style={S.heroTitle}>What's on your mind today?</h1>
          <p style={S.heroSub}>
            Mangaluru South constituency intelligence — voters, wards, schemes &amp; strategy
          </p>

          {/* Suggestion chips */}
          <div style={S.chipRow}>
            {SUGGESTED.map((s,i) => (
              <button key={i} style={S.chip} onClick={()=>send(s.text)}
                onMouseEnter={e=>{
                  e.currentTarget.style.background='rgba(99,102,241,0.14)';
                  e.currentTarget.style.borderColor='rgba(99,102,241,0.5)';
                  e.currentTarget.style.color='#c7d2fe';
                }}
                onMouseLeave={e=>{
                  e.currentTarget.style.background='rgba(28,38,58,0.7)';
                  e.currentTarget.style.borderColor='rgba(51,65,85,0.55)';
                  e.currentTarget.style.color='#94a3b8';
                }}>
                <span style={{fontSize:14,marginRight:8}}>{s.icon}</span>
                {s.text}
              </button>
            ))}
          </div>

          {/* Input box inside hero */}
          <InputBox {...inputProps}/>
        </div>
      )}

      {/* ══ CHAT MODE ════════════════════════════════════════════════════════ */}
      {hasMessages && (
        <>
          <div style={S.chatArea}>
            <div style={S.messagesInner}>
              {messages.map(msg=><MessageBubble key={msg.id} msg={msg} onTick={()=>setScrollTick(t=>t+1)}/>)}
              {loading && <ThinkingIndicator/>}
              <div ref={bottomRef}/>
            </div>
          </div>

          {/* Fixed bottom input */}
          <div style={S.stickyInput}>
            <InputBox {...inputProps}/>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════════
const S = {
  root: {
    display:'flex', flexDirection:'column',
    height:'100vh', background:'#0b1120',
    fontFamily:"'DM Sans','Inter',sans-serif",
    overflow:'hidden',
  },

  // Slim sub-header
  subHeader: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'7px 22px',
    background:'rgba(11,17,32,0.98)',
    borderBottom:'1px solid rgba(99,102,241,0.12)',
    flexShrink:0,
  },
  subHeaderIcon: {
    width:28, height:28, borderRadius:7,
    background:'rgba(79,70,229,0.1)',
    border:'1px solid rgba(99,102,241,0.25)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  subHeaderTitle: { fontSize:14, fontWeight:800, color:'#818cf8', letterSpacing:'-0.01em' },
  subHeaderSub:   { fontSize:12, color:'#334155' },
  clearBtn: {
    display:'flex', alignItems:'center', gap:5,
    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:7, padding:'5px 11px', cursor:'pointer',
    fontSize:12, color:'#475569', transition:'all 0.2s', fontFamily:'inherit',
  },

  // ── HERO ─────────────────────────────────────────────────────────────────
  heroWrap: {
    flex:1, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    padding:'32px 24px 24px',
    overflowY:'auto',
    gap:0,
  },
  heroLogoWrap: {
    marginBottom:20,
    filter:'drop-shadow(0 0 20px rgba(79,70,229,0.4))',
  },
  heroTitle: {
    fontSize:28, fontWeight:700, color:'#e2e8f0',
    margin:'0 0 8px', textAlign:'center', letterSpacing:'-0.03em',
  },
  heroSub: {
    fontSize:13, color:'#475569', textAlign:'center',
    maxWidth:480, lineHeight:1.65, margin:'0 0 26px',
  },
  chipRow: {
    display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center',
    maxWidth:660, marginBottom:28,
  },
  chip: {
    display:'flex', alignItems:'center',
    background:'rgba(28,38,58,0.7)',
    border:'1px solid rgba(51,65,85,0.55)',
    borderRadius:24, padding:'8px 16px',
    color:'#94a3b8', fontSize:13, cursor:'pointer',
    transition:'all 0.2s', fontFamily:'inherit',
    whiteSpace:'nowrap',
  },

  // ── CHAT MODE ──────────────────────────────────────────────────────────
  chatArea: {
    flex:1, overflowY:'auto',
    scrollbarWidth:'thin', scrollbarColor:'#1e293b transparent',
  },
  messagesInner: {
    maxWidth:760, margin:'0 auto',
    padding:'28px 24px 12px',
    boxSizing:'border-box',
  },
  stickyInput: {
    flexShrink:0,
    padding:'10px 24px 18px',
    background:'linear-gradient(to top,#0b1120 72%,transparent)',
    display:'flex', justifyContent:'center',
  },

  // Bubbles
  avatar: {
    width:34, height:34, borderRadius:10, flexShrink:0,
    background:'rgba(17,27,46,1)',
    border:'1px solid rgba(99,102,241,0.22)',
    display:'flex', alignItems:'center', justifyContent:'center',
    marginRight:10, alignSelf:'flex-start', marginTop:2,
  },
  userBubble: {
    background:'linear-gradient(135deg,#3730a3,#4f46e5)',
    borderRadius:'18px 18px 4px 18px',
    padding:'12px 16px',
    boxShadow:'0 4px 20px rgba(79,70,229,0.28)',
  },
  aiBubble: {
    background:'rgba(17,27,46,0.95)',
    border:'1px solid rgba(51,65,85,0.6)',
    borderRadius:'4px 18px 18px 18px',
    padding:'14px 18px',
    backdropFilter:'blur(8px)',
  },
  timestamp:  { color:'#1e293b', fontSize:10, marginTop:4, textAlign:'right' },
  filesUsed:  { color:'#334155', fontSize:10, marginTop:5, background:'rgba(11,17,32,0.6)', borderRadius:4, padding:'3px 8px' },
  exportBar:  { display:'flex', alignItems:'center', marginTop:10, background:'rgba(11,17,32,0.7)', borderRadius:8, padding:'8px 12px', border:'1px solid rgba(99,102,241,0.18)', flexWrap:'wrap', gap:6 },
  exportBtn:  { background:'linear-gradient(135deg,#4f46e5,#7c3aed)', border:'none', borderRadius:6, padding:'4px 10px', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' },

  kbd: { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:4, padding:'1px 5px', fontSize:10, fontFamily:'monospace', color:'#334155' },

  // Markdown
  h1: { fontSize:20, fontWeight:800, color:'#e2e8f0', margin:'12px 0 6px' },
  h2: { fontSize:17, fontWeight:700, color:'#c7d2fe', margin:'10px 0 5px' },
  h3: { fontSize:13, fontWeight:700, color:'#a5b4fc', margin:'8px 0 4px', textTransform:'uppercase', letterSpacing:'0.05em' },
  p:  { margin:'4px 0', color:'#cbd5e1', fontSize:14, lineHeight:1.7 },
  ul: { margin:'6px 0', paddingLeft:20 },
  ol: { margin:'6px 0', paddingLeft:20 },
  li: { color:'#94a3b8', fontSize:13, lineHeight:1.7, marginBottom:2 },
  pre: { background:'rgba(7,12,24,0.9)', borderRadius:8, padding:'10px 14px', overflowX:'auto', margin:'8px 0', border:'1px solid rgba(51,65,85,0.5)', fontSize:12, color:'#7dd3fc', fontFamily:"'JetBrains Mono','Fira Code',monospace" },
  inlineCode: { background:'rgba(99,102,241,0.14)', borderRadius:4, padding:'1px 5px', color:'#a5b4fc', fontSize:'0.9em', fontFamily:'monospace' },
  hr: { border:'none', borderTop:'1px solid rgba(51,65,85,0.45)', margin:'10px 0' },
};