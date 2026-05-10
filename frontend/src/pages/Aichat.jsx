/**
 * AiChat.jsx — ShaastrAI
 * Uses the shared <Navbar /> component (same as every other page).
 * All data-source / files-used metadata display removed from UI.
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { aiChatApi } from '../api/client';
import Navbar from '../components/Navbar';

// ── Constants ─────────────────────────────────────────────────────────────────
const PALETTE = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

const LOADING_WORDS = [
  'Analysing voters…', 'Querying wards…', 'Scanning booths…',
  'Reading surveys…',  'Checking schemes…', 'Mapping booths…',
  'Crunching numbers…','Fetching records…','Processing polls…',
  'Examining rolls…',  'Computing stats…', 'Reviewing data…',
];

const SUGGESTED = [
  'Total voter count by ward',
  'Religion-wise breakdown all wards',
  'Wards with highest Muslim voter %',
  'Survey completion status ward-wise',
  'Which schemes have most beneficiaries?',
  'Compare 2019 vs 2023 polling %',
  'Booth-wise count for ward 28',
  'Top 10 wards by voters as bar chart',
  'Export ward-wise voter data as CSV',
  'Strategic priority wards to focus on',
];

const STORAGE_KEY = 'shaastrai_chats_v2';

// ── LocalStorage ──────────────────────────────────────────────────────────────
function loadChats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveChats(chats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0,50))); }
  catch {}
}
function makeChat() {
  return { id:Date.now(), title:'New Chat', messages:[], createdAt:new Date().toISOString() };
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMd(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const els   = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if      (/^### .+/.test(ln)) { els.push(<h3 key={i} style={S.h3}>{ln.replace(/^### /,'')}</h3>); }
    else if (/^## .+/.test(ln))  { els.push(<h2 key={i} style={S.h2}>{ln.replace(/^## /,'')}</h2>); }
    else if (/^# .+/.test(ln))   { els.push(<h1 key={i} style={S.h1}>{ln.replace(/^# /,'')}</h1>); }
    else if (/^[-*] .+/.test(ln)) {
      const items = [];
      while (i < lines.length && /^[-*] .+/.test(lines[i])) {
        items.push(<li key={i} style={S.li}>{fmt(lines[i].replace(/^[-*] /,''))}</li>);
        i++;
      }
      els.push(<ul key={`u${i}`} style={S.ul}>{items}</ul>);
      continue;
    }
    else if (/^\d+\. .+/.test(ln)) {
      const items = [];
      while (i < lines.length && /^\d+\. .+/.test(lines[i])) {
        items.push(<li key={i} style={S.li}>{fmt(lines[i].replace(/^\d+\. /,''))}</li>);
        i++;
      }
      els.push(<ol key={`o${i}`} style={S.ol}>{items}</ol>);
      continue;
    }
    else if (ln.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      els.push(<pre key={i} style={S.pre}><code>{code.join('\n')}</code></pre>);
    }
    else if (/^---+$/.test(ln.trim())) { els.push(<hr key={i} style={S.hr}/>); }
    else if (!ln.trim()) { els.push(<div key={i} style={{height:5}}/>); }
    else { els.push(<p key={i} style={S.p}>{fmt(ln)}</p>); }
    i++;
  }
  return els;
}

function fmt(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p,i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={i} style={{color:'#e2e8f0',fontWeight:700}}>{p.slice(2,-2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return <code key={i} style={S.inlineCode}>{p.slice(1,-1)}</code>;
    return p;
  });
}

// ── Chart renderer ────────────────────────────────────────────────────────────
function ChartRenderer({ spec }) {
  if (!spec) return null;
  const { type, title, labels=[], datasets=[] } = spec;
  const data = labels.map((name,i) => {
    const o = { name };
    datasets.forEach(d => { o[d.label] = d.data[i] ?? 0; });
    return o;
  });
  const pie = labels.map((name,i) => ({ name, value:(datasets[0]?.data??[])[i]??0 }));
  const tt  = { contentStyle:{background:'#1e293b',border:'1px solid #334155',borderRadius:8,color:'#e2e8f0'}, labelStyle:{color:'#94a3b8'} };
  const wrap = ch => (
    <div style={{background:'rgba(15,23,42,.7)',borderRadius:10,padding:'12px 4px 4px',marginTop:10,border:'1px solid rgba(99,102,241,.18)'}}>
      {title && <div style={{textAlign:'center',color:'#64748b',fontSize:11,marginBottom:4,fontWeight:600}}>{title}</div>}
      {ch}
    </div>
  );
  if (type==='pie'||type==='doughnut') return wrap(
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={type==='doughnut'?55:0} outerRadius={85} paddingAngle={2}
          label={({name,percent})=>`${name} ${(percent*100).toFixed(1)}%`} labelLine={{stroke:'#475569'}}>
          {pie.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
        </Pie>
        <Tooltip {...tt}/><Legend wrapperStyle={{color:'#94a3b8',fontSize:10}}/>
      </PieChart>
    </ResponsiveContainer>
  );
  if (type==='line') return wrap(
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
        <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:9}}/>
        <YAxis tick={{fill:'#64748b',fontSize:9}}/>
        <Tooltip {...tt}/><Legend wrapperStyle={{color:'#94a3b8',fontSize:10}}/>
        {datasets.map((d,i)=><Line key={i} type="monotone" dataKey={d.label} stroke={PALETTE[i%PALETTE.length]} strokeWidth={2} dot={{r:2}}/>)}
      </LineChart>
    </ResponsiveContainer>
  );
  return wrap(
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
        <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:9}} angle={data.length>10?-25:0} textAnchor={data.length>10?'end':'middle'} height={data.length>10?38:20} interval={data.length>15?2:0}/>
        <YAxis tick={{fill:'#64748b',fontSize:9}}/><Tooltip {...tt}/>
        <Legend wrapperStyle={{color:'#94a3b8',fontSize:10}}/>
        {datasets.map((d,i)=><Bar key={i} dataKey={d.label} fill={PALETTE[i%PALETTE.length]} stackId={type==='stackedBar'?'s':undefined} radius={[3,3,0,0]}/>)}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Export bar ────────────────────────────────────────────────────────────────
function ExportBar({ exportSpec }) {
  const [busy, setBusy] = useState(false);
  const dl = async (fmt) => {
    setBusy(true);
    try {
      const res = await aiChatApi.export({ ...exportSpec, format:fmt });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href = url; a.download = exportSpec.filename||`export.${fmt}`; a.click();
      URL.revokeObjectURL(url);
    } catch(e) { alert('Export failed: '+(e.userMessage||e.message)); }
    finally { setBusy(false); }
  };
  return (
    <div style={{display:'flex',alignItems:'center',gap:5,marginTop:7,padding:'5px 9px',background:'rgba(15,23,42,.7)',borderRadius:7,border:'1px solid rgba(99,102,241,.15)',flexWrap:'wrap'}}>
      <span style={{color:'#475569',fontSize:10}}>📦 Export:</span>
      {['csv','xlsx','pdf'].map(f=>(
        <button key={f} disabled={busy} onClick={()=>dl(f)}
          style={{background:'linear-gradient(135deg,#4f46e5,#7c3aed)',border:'none',borderRadius:4,padding:'2px 8px',color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer'}}>
          {f.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── Brain SVG ─────────────────────────────────────────────────────────────────
function BrainIcon({ size=40, glow=false }) {
  const g = glow ? { filter:'drop-shadow(0 0 14px rgba(99,102,241,.9))' } : {};
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={g}>
      <defs>
        <linearGradient id="sbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5"/><stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="sbr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c7d2fe"/><stop offset="100%" stopColor="#e0e7ff"/>
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#sbg)"/>
      <path d="M24 10C17.37 10 12 15.37 12 22c0 3.1 1.16 5.93 3.06 8.06C16.34 31.53 17 33.2 17 35v1h7V10z" fill="url(#sbr)" opacity=".9"/>
      <path d="M24 10c6.63 0 12 5.37 12 12 0 3.1-1.16 5.93-3.06 8.06C31.66 31.53 31 33.2 31 35v1h-7V10z" fill="url(#sbr)" opacity=".72"/>
      <line x1="24" y1="10" x2="24" y2="36" stroke="#6366f1" strokeWidth="1.5"/>
      <rect x="19" y="36" width="10" height="3" rx="1.5" fill="url(#sbr)" opacity=".65"/>
      <path d="M18 18c-2 0-4 1-4 3" stroke="#818cf8" strokeWidth="1" strokeLinecap="round"/>
      <path d="M16 25c-2 1-3 2-2 4" stroke="#818cf8" strokeWidth="1" strokeLinecap="round"/>
      <path d="M30 18c2 0 4 1 4 3" stroke="#818cf8" strokeWidth="1" strokeLinecap="round"/>
      <path d="M32 25c2 1 3 2 2 4" stroke="#818cf8" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="20" cy="17" r="1.5" fill="#c7d2fe"/>
      <circle cx="28" cy="17" r="1.5" fill="#c7d2fe"/>
      <circle cx="18" cy="24" r="1.2" fill="#a5b4fc"/>
      <circle cx="30" cy="24" r="1.2" fill="#a5b4fc"/>
    </svg>
  );
}

// ── Loading dots ──────────────────────────────────────────────────────────────
function LoadingDots() {
  const [wi, setWi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setWi(p => (p+1) % LOADING_WORDS.length), 850);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 13px',background:'rgba(15,23,42,.9)',borderRadius:'4px 14px 14px 14px',border:'1px solid rgba(30,41,59,.9)',maxWidth:240}}>
      <div style={{display:'flex',gap:3}}>
        {[0,1,2].map(i=>(
          <span key={i} className={`sai-dot sai-dot-${i}`}
            style={{width:5,height:5,borderRadius:'50%',background:'#6366f1',display:'inline-block'}}/>
        ))}
      </div>
      <span style={{color:'#475569',fontSize:10,fontStyle:'italic',whiteSpace:'nowrap'}}>{LOADING_WORDS[wi]}</span>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{display:'flex',justifyContent:isUser?'flex-end':'flex-start',marginBottom:12,gap:7,alignItems:'flex-start'}}>
      {!isUser && (
        <div style={{width:26,height:26,borderRadius:7,flexShrink:0,marginTop:2,overflow:'hidden'}}>
          <BrainIcon size={26}/>
        </div>
      )}
      <div style={{maxWidth:'76%',minWidth:60}}>
        <div style={isUser ? S.userBubble : S.aiBubble}>
          {isUser
            ? <span style={{color:'#fff',fontSize:13,lineHeight:1.6}}>{msg.content}</span>
            : <div style={{color:'#cbd5e1',fontSize:13,lineHeight:1.7}}>{renderMd(msg.content)}</div>
          }
        </div>
        {msg.chartSpec  && <ChartRenderer spec={msg.chartSpec}/>}
        {msg.exportSpec && <ExportBar exportSpec={msg.exportSpec}/>}
        <div style={{color:'#1e293b',fontSize:9,marginTop:2,textAlign:isUser?'right':'left'}}>{msg.ts}</div>
      </div>
      {isUser && (
        <div style={{width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2,fontSize:12}}>👤</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════════
export default function AiChat() {
  const [chats,        setChats]        = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(() => { const c=loadChats(); return c[0]?.id||null; });
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [hoveredChat,  setHoveredChat]  = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const activeChat = useMemo(() => chats.find(c=>c.id===activeChatId)||null, [chats,activeChatId]);
  const msgs       = activeChat?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, loading]);
  useEffect(() => { saveChats(chats); }, [chats]);

  // ── Chat ops ─────────────────────────────────────────────────────────────────
  const createNewChat = () => {
    const c = makeChat();
    setChats(prev => [c, ...prev]);
    setActiveChatId(c.id);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    setChats(prev => {
      const next = prev.filter(c=>c.id!==id);
      if (activeChatId===id) setActiveChatId(next[0]?.id||null);
      return next;
    });
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    const msg = (text||input).trim();
    if (!msg || loading) return;
    setInput('');

    let chatId = activeChatId;
    if (!chatId) {
      const c = makeChat();
      setChats(prev => [c, ...prev]);
      setActiveChatId(c.id);
      chatId = c.id;
    }

    const ts      = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const userMsg = { id:Date.now(), role:'user', content:msg, ts };

    setChats(prev => prev.map(c => {
      if (c.id!==chatId) return c;
      const nm = [...c.messages, userMsg];
      return { ...c, messages:nm, title:nm.find(m=>m.role==='user')?.content?.slice(0,36)||c.title };
    }));

    setLoading(true);

    const history = (chats.find(c=>c.id===chatId)?.messages||[])
      .map(m=>({ role:m.role, content:m.content }));

    try {
      const { data } = await aiChatApi.send(msg, history, true);
      const aiMsg = {
        id:         Date.now()+1,
        role:       'assistant',
        content:    data.reply    || '',
        chartSpec:  data.chartSpec  || null,
        exportSpec: data.exportSpec || null,
        ts:         new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
      };
      setChats(prev => prev.map(c => c.id!==chatId ? c : {...c, messages:[...c.messages, aiMsg]}));
    } catch(e) {
      const errMsg = {
        id:Date.now()+1, role:'assistant',
        content:`⚠️ **Error:** ${e.userMessage||e.message||'Something went wrong.'}`,
        ts: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
      };
      setChats(prev => prev.map(c => c.id!==chatId ? c : {...c, messages:[...c.messages, errMsg]}));
    } finally {
      setLoading(false);
      setTimeout(()=>inputRef.current?.focus(), 80);
    }
  }, [input, loading, activeChatId, chats]);

  const handleKey = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{CSS}</style>
      <div style={S.root}>

        {/* ── SHARED NAVBAR (same as every other page) ── */}
        <Navbar />

        {/* ── BODY ── */}
        <div style={S.body}>

          {/* ── SIDEBAR TOGGLE (when closed) ── */}
          {!sidebarOpen && (
            <button
              onClick={()=>setSidebarOpen(true)}
              title="Open chat history"
              style={S.sidebarToggleBtn}
            >▶</button>
          )}

          {/* ── LEFT SIDEBAR ── */}
          {sidebarOpen && (
            <aside style={S.sidebar}>
              {/* Sidebar header */}
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                <button onClick={createNewChat} style={{...S.newChatBtn,flex:1}}>
                  <span style={{fontSize:16,lineHeight:1}}>+</span> New Chat
                </button>
                <button
                  onClick={()=>setSidebarOpen(false)}
                  title="Collapse"
                  style={S.collapseBtn}
                >◀</button>
              </div>

              <div style={{flex:1,overflowY:'auto',scrollbarWidth:'thin',scrollbarColor:'#0f172a transparent'}}>
                {chats.length===0
                  ? <div style={{color:'#1e293b',fontSize:11,textAlign:'center',padding:'20px 8px'}}>
                      No chats yet.<br/>Start a new conversation.
                    </div>
                  : chats.map(c=>(
                    <div key={c.id}
                      onClick={()=>setActiveChatId(c.id)}
                      onMouseEnter={()=>setHoveredChat(c.id)}
                      onMouseLeave={()=>setHoveredChat(null)}
                      style={{
                        ...S.chatItem,
                        ...(c.id===activeChatId ? S.chatItemActive : {}),
                        ...(hoveredChat===c.id && c.id!==activeChatId ? S.chatItemHover : {}),
                      }}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{
                          color: c.id===activeChatId ? '#e2e8f0' : '#64748b',
                          fontSize:11, fontWeight:600,
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                        }}>
                          {c.title || 'New Chat'}
                        </div>
                        <div style={{color:'#1e293b',fontSize:9,marginTop:1}}>
                          {c.messages.length} msg{c.messages.length!==1?'s':''}
                          {c.messages.length>0 && ` · ${c.messages[c.messages.length-1].ts||''}`}
                        </div>
                      </div>
                      <button onClick={e=>deleteChat(c.id,e)}
                        title="Delete"
                        style={{
                          background:'none',border:'none',color:'#334155',cursor:'pointer',
                          fontSize:11,padding:2,flexShrink:0,
                          opacity: hoveredChat===c.id ? 1 : 0,
                          transition:'opacity .15s',
                        }}>🗑</button>
                    </div>
                ))}
              </div>

              <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 4px 0',borderTop:'1px solid rgba(99,102,241,0.08)',marginTop:8}}>
                <BrainIcon size={16}/>
                <span style={{color:'#1e293b',fontSize:9}}>ShaastrAI</span>
              </div>
            </aside>
          )}

          {/* ── CHAT AREA ── */}
          <div style={S.chatArea}>

            {/* Welcome screen */}
            {msgs.length===0 && (
              <div style={S.welcome}>
                <div style={{animation:'sai-pulse 2.4s ease-in-out infinite', marginBottom:18}}>
                  <BrainIcon size={84} glow/>
                </div>
                <h1 style={S.welcomeTitle}>ShaastrAI</h1>
                <p style={S.welcomeSub}>Constituency Intelligence · Mangaluru South (175)</p>
                <div style={S.grid}>
                  {SUGGESTED.map((s,i)=>(
                    <button key={i} style={S.suggestBtn} onClick={()=>send(s)}
                      onMouseEnter={e=>{ e.currentTarget.style.background='rgba(99,102,241,0.14)'; e.currentTarget.style.color='#a5b4fc'; e.currentTarget.style.borderColor='rgba(99,102,241,0.35)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background='rgba(99,102,241,0.06)'; e.currentTarget.style.color='#475569'; e.currentTarget.style.borderColor='rgba(99,102,241,0.15)'; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {msgs.length>0 && (
              <div style={{padding:'14px 18px',flex:1}}>
                {msgs.map(m=><Bubble key={m.id} msg={m}/>)}
                {loading && (
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
                    <div style={{width:26,height:26,borderRadius:7,flexShrink:0,overflow:'hidden'}}>
                      <BrainIcon size={26}/>
                    </div>
                    <LoadingDots/>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>
            )}
          </div>
        </div>

        {/* ── COMPACT INPUT BAR ── */}
        <div style={S.inputBar}>
          <div style={S.inputRow}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about voters, wards, schemes, election strategy…"
              disabled={loading}
              rows={1}
              style={S.textarea}
              onInput={e=>{
                e.target.style.height='auto';
                e.target.style.height=Math.min(e.target.scrollHeight,96)+'px';
              }}
            />
            <button onClick={()=>send()} disabled={loading||!input.trim()}
              style={{...S.sendBtn, opacity:(loading||!input.trim())?0.35:1}}>
              {loading ? '⏳' : '↑'}
            </button>
          </div>
          <div style={S.hint}>
            <kbd style={S.kbd}>Enter</kbd> send &nbsp;·&nbsp;
            <kbd style={S.kbd}>Shift+Enter</kbd> newline &nbsp;·&nbsp;
            Powered by ShaastrAI
          </div>
        </div>

      </div>
    </>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400&display=swap');

  @keyframes sai-bounce {
    0%,80%,100%{ transform:translateY(0); opacity:.35; }
    40%         { transform:translateY(-5px); opacity:1; }
  }
  @keyframes sai-pulse {
    0%,100%{ transform:scale(1);   filter:drop-shadow(0 0 14px rgba(99,102,241,.55)); }
    50%    { transform:scale(1.06);filter:drop-shadow(0 0 26px rgba(99,102,241,.9)); }
  }
  @keyframes sai-fadein {
    from{ opacity:0; transform:translateY(14px); }
    to  { opacity:1; transform:translateY(0); }
  }

  .sai-dot   { animation: sai-bounce 1.3s infinite; }
  .sai-dot-1 { animation-delay: .15s !important; }
  .sai-dot-2 { animation-delay: .30s !important; }

  ::-webkit-scrollbar       { width:3px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:2px; }
`;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:{
    display:'flex', flexDirection:'column',
    height:'calc(100vh)',
    background:'#07091a',
    fontFamily:"'Sora','system-ui',sans-serif",
    overflow:'hidden',
  },

  // Body
  body:{ display:'flex', flex:1, overflow:'hidden', position:'relative' },

  // Sidebar toggle (collapsed state)
  sidebarToggleBtn:{
    position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
    zIndex:20, background:'rgba(99,102,241,0.12)',
    border:'1px solid rgba(99,102,241,0.2)',
    borderLeft:'none',
    borderRadius:'0 6px 6px 0',
    color:'#818cf8', fontSize:10, fontWeight:700,
    padding:'10px 5px', cursor:'pointer',
    writingMode:'vertical-rl',
  },

  // Sidebar collapse button
  collapseBtn:{
    background:'rgba(255,255,255,0.04)',
    border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:6, padding:'4px 7px',
    cursor:'pointer', fontSize:11, color:'#475569',
    flexShrink:0,
  },

  // Sidebar
  sidebar:{
    width:210, flexShrink:0,
    background:'#090e1f',
    borderRight:'1px solid rgba(99,102,241,0.1)',
    display:'flex', flexDirection:'column',
    padding:'10px 7px',
  },
  newChatBtn:{
    display:'flex', alignItems:'center', gap:6, justifyContent:'center',
    background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)',
    borderRadius:8, color:'#818cf8', fontSize:12, fontWeight:700,
    padding:'7px 10px', cursor:'pointer',
    transition:'background .2s',
  },
  chatItem:{
    display:'flex', alignItems:'center', gap:6,
    padding:'7px 9px', borderRadius:7, cursor:'pointer',
    marginBottom:2, transition:'background .15s',
  },
  chatItemActive:{ background:'rgba(99,102,241,0.1)' },
  chatItemHover:{ background:'rgba(99,102,241,0.05)' },

  // Chat area
  chatArea:{
    flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
    scrollbarWidth:'thin', scrollbarColor:'#0f172a transparent',
  },

  // Welcome
  welcome:{
    flex:1, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    padding:'32px 24px', textAlign:'center',
    animation:'sai-fadein .5s ease',
  },
  welcomeTitle:{
    fontSize:26, fontWeight:800, letterSpacing:'-0.04em', margin:'0 0 6px',
    background:'linear-gradient(135deg,#c7d2fe,#818cf8,#6366f1)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
  },
  welcomeSub:{ color:'#334155', fontSize:12, marginBottom:22 },
  grid:{
    display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',
    gap:5, maxWidth:600, width:'100%',
  },
  suggestBtn:{
    background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)',
    borderRadius:8, padding:'8px 11px', color:'#475569',
    fontSize:11, cursor:'pointer', textAlign:'left', lineHeight:1.5,
    transition:'all .2s',
  },

  // Bubbles
  userBubble:{
    background:'linear-gradient(135deg,#3730a3,#4f46e5)',
    borderRadius:'12px 12px 3px 12px', padding:'9px 13px',
    boxShadow:'0 3px 14px rgba(79,70,229,.2)',
    display:'inline-block',
  },
  aiBubble:{
    background:'rgba(10,16,36,.95)',
    border:'1px solid rgba(20,30,60,.9)',
    borderRadius:'3px 12px 12px 12px', padding:'10px 14px',
  },

  // Input bar
  inputBar:{
    flexShrink:0, padding:'8px 18px 10px',
    background:'#07091a',
    borderTop:'1px solid rgba(99,102,241,0.12)',
  },
  inputRow:{ display:'flex', gap:7, alignItems:'flex-end' },
  textarea:{
    flex:1,
    background:'rgba(10,16,36,.98)',
    border:'1px solid rgba(99,102,241,0.2)', borderRadius:9,
    padding:'8px 12px', color:'#e2e8f0', fontSize:13, lineHeight:1.55,
    resize:'none', outline:'none', fontFamily:'inherit',
    minHeight:36, maxHeight:96,
    scrollbarWidth:'thin', scrollbarColor:'#1e293b transparent',
  },
  sendBtn:{
    width:36, height:36, flexShrink:0,
    background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
    border:'none', borderRadius:9, color:'#fff', fontSize:17,
    cursor:'pointer', fontWeight:700,
    boxShadow:'0 3px 10px rgba(79,70,229,.3)',
    transition:'opacity .2s',
  },
  hint:{ color:'#1e293b', fontSize:9, marginTop:4, textAlign:'center' },
  kbd:{
    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:3, padding:'1px 4px', fontSize:9, fontFamily:'monospace', color:'#1e293b',
  },

  // Markdown
  h1:{ fontSize:16,fontWeight:800,color:'#e2e8f0',margin:'9px 0 5px',letterSpacing:'-0.02em' },
  h2:{ fontSize:14,fontWeight:700,color:'#c7d2fe',margin:'7px 0 3px' },
  h3:{ fontSize:11,fontWeight:700,color:'#818cf8',margin:'6px 0 3px',textTransform:'uppercase',letterSpacing:'0.05em' },
  p:{ margin:'3px 0',color:'#64748b',fontSize:13,lineHeight:1.7 },
  ul:{ margin:'4px 0',paddingLeft:16 },
  ol:{ margin:'4px 0',paddingLeft:16 },
  li:{ color:'#475569',fontSize:12,lineHeight:1.7,marginBottom:2 },
  pre:{ background:'rgba(10,16,36,.95)',borderRadius:7,padding:'7px 11px',overflowX:'auto',margin:'6px 0',border:'1px solid rgba(20,40,80,.7)',fontSize:11,color:'#7dd3fc',fontFamily:"'JetBrains Mono',monospace" },
  inlineCode:{ background:'rgba(99,102,241,.1)',borderRadius:3,padding:'1px 4px',color:'#a5b4fc',fontSize:'0.88em',fontFamily:'monospace' },
  hr:{ border:'none',borderTop:'1px solid rgba(30,41,59,.6)',margin:'7px 0' },
};