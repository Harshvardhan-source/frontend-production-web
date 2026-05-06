import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import Navbar from '../components/Navbar';
import { dataApi } from '../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const VOTER_PER_PAGE  = 100;
const SURVEY_PER_PAGE = 100;
const SEARCH_DELAY_MS = 350;

const AVATAR_COLORS = [
  '#c9a227','#2ec4b6','#6c63ff','#e07c5b',
  '#4caf82','#e05b8a','#0ea5e9','#a855f7',
];

// Tab config — label, icon, view key, accent colour
const TABS = [
  { key: 'survey',            label: 'Survey Data',      icon: '✎',  color: '#f59e0b' },
  { key: 'voter',             label: 'Voter List',        icon: '◉',  color: '#22d3ee' },
  { key: 'future_voters',     label: 'Future Voters',     icon: '🕐', color: '#10b981' },
  { key: 'deceased',          label: 'Deceased',          icon: '✦',  color: '#a78bfa' },
  { key: 'outstation_voters', label: 'Outstation Voters', icon: '✈',  color: '#f97316' },
  { key: 'bjp_members',       label: 'BJP Members',       icon: '🪷', color: '#f43f5e' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON CARD
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', padding: '14px 16px',
      animation: 'pulse 1.4s ease-in-out infinite',
    }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.08)', flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ height:13, background:'rgba(255,255,255,0.08)', borderRadius:6, width:'70%', marginBottom:6 }}/>
          <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:6, width:'45%' }}/>
        </div>
        <div style={{ width:28, height:18, borderRadius:10, background:'rgba(255,255,255,0.06)' }}/>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {[60,45,50,40].map(w => (
          <div key={w} style={{ height:18, width:w, background:'rgba(255,255,255,0.05)', borderRadius:6 }}/>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOTER DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function VoterModal({ voter, onClose }) {
  if (!voter) return null;
  const name    = voter['Name']    || '—';
  const voterId = voter['Epic NO'] || '—';
  const initial = name.trim()[0]?.toUpperCase() || '?';
  const skipKeys = new Set(['Name', 'Epic NO']);
  const details  = Object.entries(voter).filter(([k]) => !skipKeys.has(k) && voter[k] !== '' && voter[k] != null);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(5px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-surface)', border:'1px solid var(--border)',
        borderRadius:'var(--r-lg)', width:'100%', maxWidth:500,
        maxHeight:'85vh', overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,0.55)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', gap:14,
          padding:'18px 22px', borderBottom:'1px solid var(--border)',
          position:'sticky', top:0, background:'var(--bg-surface)', zIndex:2,
        }}>
          <div style={{
            width:46, height:46, borderRadius:13, flexShrink:0,
            background:'var(--gold)', color:'#090e1c',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:19,
          }}>{initial}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:16, color:'var(--text-1)', lineHeight:1.2 }}>{name}</div>
            <div style={{ fontSize:12, color:'var(--gold)', fontFamily:'monospace', marginTop:3 }}>{voterId}</div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.07)', border:'none',
            borderRadius:8, width:32, height:32, cursor:'pointer',
            color:'var(--text-2)', fontSize:20,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>×</button>
        </div>
        <div style={{ padding:'6px 22px 22px' }}>
          {details.map(([k, v]) => (
            <div key={k} style={{
              display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', gap:16,
            }}>
              <span style={{ fontSize:13, color:'var(--text-2)', flexShrink:0 }}>{k}</span>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', textAlign:'right', wordBreak:'break-word' }}>
                {String(v)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD DETAIL MODAL — generic, used for Future Voters & Deceased
// ─────────────────────────────────────────────────────────────────────────────
function RecordModal({ record, title, accentColor, onClose }) {
  if (!record) return null;
  const entries = Object.entries(record).filter(([k, v]) => k !== '_id' && v !== '' && v != null);
  const nameVal = record.name || record.Name || '';
  const initial = nameVal.trim()[0]?.toUpperCase() || '?';

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(5px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-surface)', border:`1px solid ${accentColor}40`,
        borderRadius:'var(--r-lg)', width:'100%', maxWidth:500,
        maxHeight:'85vh', overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,0.55)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', gap:14,
          padding:'18px 22px', borderBottom:'1px solid var(--border)',
          position:'sticky', top:0, background:'var(--bg-surface)', zIndex:2,
        }}>
          <div style={{
            width:46, height:46, borderRadius:13, flexShrink:0,
            background: accentColor + '22', border:`1px solid ${accentColor}44`,
            color: accentColor,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:19,
          }}>{initial}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:16, color:'var(--text-1)', lineHeight:1.2 }}>{nameVal || '—'}</div>
            <div style={{ fontSize:11, color: accentColor, marginTop:3, textTransform:'uppercase', letterSpacing:'0.5px' }}>{title}</div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.07)', border:'none',
            borderRadius:8, width:32, height:32, cursor:'pointer',
            color:'var(--text-2)', fontSize:20,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>×</button>
        </div>
        <div style={{ padding:'6px 22px 22px' }}>
          {entries.map(([k, v]) => {
            const isUrl   = typeof v === 'string' && v.startsWith('http');
            const isImage = isUrl && (
              /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(v) ||
              v.includes('storage.googleapis.com') ||
              v.includes('storage.cloud.google.com') ||
              v.includes('firebasestorage.googleapis.com')
            );
            const isPdf   = isUrl && isPdfUrl(v);
            const canDl   = isImage || isPdf || isUrl; // allow download for any file URL
            return (
              <div key={k} style={{
                display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', gap:16,
              }}>
                <span style={{ fontSize:13, color:'var(--text-2)', flexShrink:0, textTransform:'capitalize' }}>
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', textAlign:'right', wordBreak:'break-word' }}>
                  {isImage ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                      <a href={v} target="_blank" rel="noreferrer" style={{ display:'inline-block' }}>
                        <img
                          src={v}
                          alt={k}
                          style={{
                            maxWidth: 180, maxHeight: 180,
                            borderRadius: 8,
                            border: `1px solid ${accentColor}44`,
                            objectFit: 'cover',
                            display: 'block',
                            cursor: 'zoom-in',
                          }}
                          onError={e => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'inline';
                          }}
                        />
                        <span style={{ display:'none', color: accentColor }}>View Photo ↗</span>
                      </a>
                      <div style={{ display:'flex', gap:6 }}>
                        <button
                          onClick={() => downloadFile(v, guessFilename(v, k))}
                          style={{
                            fontSize:11, fontWeight:600, cursor:'pointer',
                            padding:'3px 10px', borderRadius:5,
                            background:'rgba(16,185,129,0.15)', color:'#10b981',
                            border:'1px solid rgba(16,185,129,0.3)',
                          }}>⬇ Download</button>
                        <a href={v} target="_blank" rel="noreferrer" style={{
                          fontSize:11, fontWeight:600,
                          padding:'3px 10px', borderRadius:5,
                          background:`${accentColor}15`, color: accentColor,
                          border:`1px solid ${accentColor}30`,
                          textDecoration:'none',
                        }}>↗ Open</a>
                      </div>
                    </div>
                  ) : isUrl ? (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                      <span style={{ fontSize:12, color:'var(--text-3)', fontFamily:'monospace' }}>
                        {isPdf ? '📄 PDF' : '🔗 File'}
                      </span>
                      <div style={{ display:'flex', gap:6 }}>
                        <button
                          onClick={() => downloadFile(v, guessFilename(v, k))}
                          style={{
                            fontSize:11, fontWeight:600, cursor:'pointer',
                            padding:'3px 10px', borderRadius:5,
                            background:'rgba(16,185,129,0.15)', color:'#10b981',
                            border:'1px solid rgba(16,185,129,0.3)',
                          }}>⬇ Download</button>
                        <a href={v} target="_blank" rel="noreferrer" style={{
                          fontSize:11, fontWeight:600,
                          padding:'3px 10px', borderRadius:5,
                          background:`${accentColor}15`, color: accentColor,
                          border:`1px solid ${accentColor}30`,
                          textDecoration:'none',
                        }}>↗ Open</a>
                      </div>
                    </div>
                  ) : (
                    String(v)
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOTER CARD
// ─────────────────────────────────────────────────────────────────────────────
const VoterCard = memo(function VoterCard({ voter, onClick }) {
  const name   = voter['Name']          || '—';
  const epicNo = voter['Epic NO']       || '—';
  const house  = voter['House No']      || '';
  const gender = voter['Gender']        || '';
  const age    = voter['Age']           || '';
  const booth  = voter['Booth No']      || '';
  const ward   = voter['Part No']       || '';
  const rel    = voter['Relation Name'] || '';

  const initial = name.trim()[0]?.toUpperCase() || '?';
  const color   = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const isMale  = gender.toUpperCase() === 'M' || gender.toLowerCase() === 'male';
  const [hov, setHov] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)', padding: '13px 15px', cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.25)' : 'none',
      }}>
      <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:9 }}>
        <div style={{
          width:36, height:36, borderRadius:9, flexShrink:0,
          background:color, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, fontSize:14,
        }}>{initial}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
          <div style={{ fontSize:11, color:'var(--gold)', fontFamily:'monospace', marginTop:2, letterSpacing:'0.3px' }}>{epicNo}</div>
        </div>
        {gender && (
          <div style={{
            fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:9, flexShrink:0,
            background: isMale ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
            color:      isMale ? '#60a5fa'               : '#f472b6',
            border:     `1px solid ${isMale ? 'rgba(59,130,246,0.3)' : 'rgba(236,72,153,0.3)'}`,
          }}>
            {isMale ? '♂ M' : '♀ F'}
          </div>
        )}
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {house && <Chip icon="🏠" label={house}/>}
        {age   && <Chip label={`Age ${age}`}/>}
        {booth && <Chip label={`Booth ${booth}`}/>}
        {ward  && <Chip label={`Ward ${ward}`}/>}
        {rel   && <Chip label={rel} maxW={110}/>}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FUTURE VOTER CARD
// ─────────────────────────────────────────────────────────────────────────────
const FutureVoterCard = memo(function FutureVoterCard({ record, onClick }) {
  const name    = record.name        || '—';
  const dob     = record.dob         || '';
  const gender  = record.gender      || '';
  const house   = record.houseNumber || '';
  const ward    = record.wardNumber  || '';
  const course  = record.classCourse || '';
  const year    = record.yearOfStudy || '';

  const initial = name.trim()[0]?.toUpperCase() || '?';
  const color   = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const isMale  = gender.toLowerCase() === 'male' || gender === 'M';
  const [hov, setHov] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? '#10b981' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)', padding: '13px 15px', cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.25)' : 'none',
      }}>
      <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:9 }}>
        <div style={{
          width:36, height:36, borderRadius:9, flexShrink:0,
          background: color, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, fontSize:14,
        }}>{initial}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
          {dob && <div style={{ fontSize:11, color:'#10b981', marginTop:2 }}>DOB: {dob}</div>}
        </div>
        {/* Future voter badge */}
        <div style={{
          fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:9, flexShrink:0,
          background:'rgba(16,185,129,0.15)', color:'#10b981',
          border:'1px solid rgba(16,185,129,0.3)',
        }}>FUTURE</div>
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {gender && <Chip label={isMale ? '♂ Male' : '♀ Female'}/>}
        {house  && <Chip icon="🏠" label={house}/>}
        {ward   && <Chip label={`Ward: ${ward}`}/>}
        {course && <Chip label={course}/>}
        {year   && <Chip label={`Year ${year}`}/>}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// DECEASED CARD
// ─────────────────────────────────────────────────────────────────────────────
const DeceasedCard = memo(function DeceasedCard({ record, onClick }) {
  const name        = record.name        || '—';
  const voterid     = record.voterid     || '';
  const gender      = record.gender      || '';
  const dod         = record.dateOfDeath || '';
  const age         = record.ageAtDeath  || '';
  const house       = record.houseNumber || '';
  const hasCert     = !!record.certificateFileUrl;

  const initial = name.trim()[0]?.toUpperCase() || '?';
  const isMale  = gender.toLowerCase() === 'male' || gender === 'M';
  const [hov, setHov] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? '#a78bfa' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)', padding: '13px 15px', cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.25)' : 'none',
      }}>
      <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:9 }}>
        <div style={{
          width:36, height:36, borderRadius:9, flexShrink:0,
          background:'rgba(167,139,250,0.18)', color:'#a78bfa',
          border:'1px solid rgba(167,139,250,0.3)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, fontSize:14,
        }}>{initial}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
          {voterid && <div style={{ fontSize:11, color:'#a78bfa', fontFamily:'monospace', marginTop:2 }}>{voterid}</div>}
        </div>
        <div style={{
          fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:9, flexShrink:0,
          background:'rgba(167,139,250,0.15)', color:'#a78bfa',
          border:'1px solid rgba(167,139,250,0.3)',
        }}>DECEASED</div>
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {gender && <Chip label={isMale ? '♂ Male' : '♀ Female'}/>}
        {age    && <Chip label={`Age: ${age}`}/>}
        {dod    && <Chip label={`Died: ${dod}`}/>}
        {house  && <Chip icon="🏠" label={house}/>}
        {hasCert && <Chip label="📄 Certificate"/>}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// OUTSTATION VOTER CARD
// ─────────────────────────────────────────────────────────────────────────────
const OutstationCard = memo(function OutstationCard({ record, onClick }) {
  const firstName = record.firstName || '';
  const lastName  = record.lastName  || '';
  const name      = [firstName, record.middleName, lastName].filter(Boolean).join(' ') || '—';
  const voterid   = record.voterid        || '';
  const city      = record.outstationCity  || '';
  const state     = record.outstationState || '';
  const ward      = record.wardNumber      || '';
  const booth     = record.boothNo         || '';
  const contact   = record.contactNumber   || '';
  const gender    = record.gender          || '';
  const age       = record.age             || '';

  const initial = name.trim()[0]?.toUpperCase() || '?';
  const color   = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const isMale  = gender.toLowerCase() === 'male' || gender === 'M';
  const [hov, setHov] = useState(false);

  const locationLine = [city, state].filter(Boolean).join(', ');

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? '#f97316' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)', padding: '13px 15px', cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 6px 24px rgba(249,115,22,0.18)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}>
      {/* Top accent strip */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:3,
        background:'linear-gradient(90deg,#f97316,#fb923c)',
        borderRadius:'var(--r-md) var(--r-md) 0 0',
      }}/>

      <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:9, marginTop:4 }}>
        <div style={{
          width:38, height:38, borderRadius:10, flexShrink:0,
          background: color, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, fontSize:15,
        }}>{initial}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
          {voterid
            ? <div style={{ fontSize:11, color:'#f97316', fontFamily:'monospace', marginTop:2, letterSpacing:'0.3px' }}>{voterid}</div>
            : <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>No Voter ID</div>
          }
        </div>
        {/* OUTSTATION badge */}
        <div style={{
          fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:9, flexShrink:0,
          background:'rgba(249,115,22,0.15)', color:'#f97316',
          border:'1px solid rgba(249,115,22,0.35)',
          letterSpacing:'0.04em',
        }}>✈ OUTSTATION</div>
      </div>

      {/* Current location highlight */}
      {locationLine && (
        <div style={{
          display:'flex', alignItems:'center', gap:5,
          background:'rgba(249,115,22,0.07)', borderRadius:7,
          padding:'5px 9px', marginBottom:9,
          border:'1px solid rgba(249,115,22,0.2)',
        }}>
          <span style={{ fontSize:12 }}>📍</span>
          <span style={{ fontSize:12, fontWeight:600, color:'#fb923c', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {locationLine}
          </span>
        </div>
      )}

      {/* Chips row */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {gender  && <Chip label={isMale ? '♂ Male' : '♀ Female'}/>}
        {age     && <Chip label={`Age ${age}`}/>}
        {ward    && <Chip label={`Ward: ${ward}`}/>}
        {booth   && <Chip label={`Booth ${booth}`}/>}
        {contact && <Chip icon="📞" label={contact}/>}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// OUTSTATION VOTER DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function OutstationModal({ record, onClose }) {
  if (!record) return null;

  const firstName = record.firstName || '';
  const lastName  = record.lastName  || '';
  const name      = [firstName, record.middleName, lastName].filter(Boolean).join(' ') || '—';
  const initial   = name.trim()[0]?.toUpperCase() || '?';
  const color     = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Organised sections for display
  const ACCENT = '#f97316';

  const Section = ({ title, icon, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        marginBottom:10, paddingBottom:6,
        borderBottom:`1px solid rgba(249,115,22,0.2)`,
      }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <span style={{ fontSize:11, fontWeight:800, color: ACCENT, textTransform:'uppercase', letterSpacing:'0.08em' }}>{title}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value, full, highlight }) => {
    if (!value && value !== 0 && value !== false) return null;
    return (
      <div style={{
        gridColumn: full ? '1 / -1' : 'auto',
        display:'flex', flexDirection:'column', gap:2,
        padding:'7px 10px', borderRadius:8,
        background: highlight ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.03)',
        border: highlight ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
      }}>
        <span style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:600, color: highlight ? '#fb923c' : 'var(--text-1)', wordBreak:'break-word' }}>
          {String(value)}
        </span>
      </div>
    );
  };

  const r = record;
  const fullName  = [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ');
  const regAddr   = [r.houseNumber, r.address].filter(Boolean).join(', ');
  const currAddr  = [r.currentHouseNumber, r.currentAddress, r.outstationCity, r.outstationState].filter(Boolean).join(', ');

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.70)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-surface)',
        border:`1px solid rgba(249,115,22,0.35)`,
        borderRadius:'var(--r-lg)', width:'100%', maxWidth:580,
        maxHeight:'88vh', overflowY:'auto',
        boxShadow:'0 28px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', gap:14,
          padding:'18px 22px', borderBottom:'1px solid var(--border)',
          position:'sticky', top:0, background:'var(--bg-surface)', zIndex:2,
          backgroundImage:'linear-gradient(135deg,rgba(249,115,22,0.06) 0%,transparent 60%)',
        }}>
          <div style={{
            width:48, height:48, borderRadius:14, flexShrink:0,
            background: color, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:20, boxShadow:`0 0 0 3px rgba(249,115,22,0.3)`,
          }}>{initial}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:17, color:'var(--text-1)', lineHeight:1.2 }}>{name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
              {r.voterid && (
                <span style={{ fontSize:11, color: ACCENT, fontFamily:'monospace', fontWeight:600 }}>{r.voterid}</span>
              )}
              <span style={{
                fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:9,
                background:'rgba(249,115,22,0.15)', color: ACCENT,
                border:'1px solid rgba(249,115,22,0.35)', letterSpacing:'0.05em',
              }}>✈ OUTSTATION</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.07)', border:'none',
            borderRadius:8, width:34, height:34, cursor:'pointer',
            color:'var(--text-2)', fontSize:21,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>×</button>
        </div>

        {/* Current location banner */}
        {(r.outstationCity || r.outstationState) && (
          <div style={{
            margin:'16px 22px 0',
            background:'rgba(249,115,22,0.09)',
            border:'1px solid rgba(249,115,22,0.3)',
            borderRadius:10, padding:'10px 14px',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <span style={{ fontSize:22 }}>📍</span>
            <div>
              <div style={{ fontSize:11, color:'rgba(249,115,22,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>Currently residing in</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#fb923c' }}>
                {[r.outstationCity, r.outstationState].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding:'18px 22px 24px' }}>

          <Section title="Personal Details" icon="👤">
            <Row label="Full Name"       value={fullName}           full />
            <Row label="Date of Birth"   value={r.dob} />
            <Row label="Age"             value={r.age} />
            <Row label="Gender"          value={r.gender} />
            <Row label="Marital Status"  value={r.maritalStatus} />
            <Row label="Voter ID"        value={r.voterid} />
            <Row label="Aadhaar"         value={r.addharNumber} />
            <Row label="Contact"         value={r.contactNumber} />
          </Section>

          <Section title="Current / Outstation Address" icon="✈">
            <Row label="City"            value={r.outstationCity}     highlight />
            <Row label="State"           value={r.outstationState}    highlight />
            <Row label="Current Address" value={r.outstationAddress}  full highlight />
            <Row label="Flat / House No" value={r.currentHouseNumber} />
            <Row label="Area Type"       value={r.currentAreaType} />
            <Row label="Home Type"       value={r.currentHomeType} />
            {r.currentAddress && r.currentAddress !== r.outstationAddress && (
              <Row label="Full Current Address" value={r.currentAddress} full />
            )}
          </Section>

          <Section title="Registered Address" icon="🏠">
            <Row label="House Number"  value={r.houseNumber}  full />
            <Row label="Address"       value={r.address}      full />
            <Row label="Ward"          value={r.wardNumber} />
            <Row label="Booth No"      value={r.boothNo} />
            <Row label="Area Type"     value={r.areaType} />
            <Row label="Home Type"     value={r.homeType} />
            {r.pollingStation && <Row label="Polling Station" value={r.pollingStation} full />}
            {r.pollingStationAddr && <Row label="Polling Station Address" value={r.pollingStationAddr} full />}
          </Section>

          <Section title="Demographics" icon="🧬">
            <Row label="Religion"       value={r.religion} />
            <Row label="Community"      value={r.community} />
            <Row label="Sub-Category"   value={r.subcategory} />
            <Row label="Annual Income"  value={r.annualIncome ? `₹${r.annualIncome}` : null} />
            <Row label="Family Income"  value={r.familyIncome ? `₹${r.familyIncome}` : null} />
            <Row label="Economic Status" value={r.economicStatus} />
            <Row label="Education"      value={r.education} />
            <Row label="Education Type" value={r.educationtype} />
            <Row label="Minority"       value={r.minority} />
            <Row label="Student"        value={r.student} />
          </Section>

          <Section title="Employment & Health" icon="💼">
            <Row label="Employment Status" value={r.employmentStatus} />
            <Row label="Employment Type"   value={r.employmentType} />
            <Row label="Health Status"     value={r.healthStatus} />
            {r.healthStatus === 'Diseased' && <>
              <Row label="Disease Type"  value={r.diseaseType} />
              <Row label="Disease Name"  value={r.diseaseName} />
            </>}
            <Row label="Differently Abled" value={r.differentlyAbled} />
          </Section>

          {(r.relation || r.relationName || r.partNo) && (
            <Section title="Voter Roll Details" icon="📋">
              <Row label="Relation"      value={r.relation} />
              <Row label="Relation Name" value={r.relationName} />
              <Row label="Part No"       value={r.partNo} />
              <Row label="Section Name"  value={r.sectionName} />
              <Row label="Serial No"     value={r.serialNumber} />
              <Row label="Source PDF"    value={r.sourcePdfName} />
            </Section>
          )}

          {(r.schemesUsed && r.schemesUsed.length > 0) && (
            <Section title="Government Schemes" icon="🏛">
              <div style={{ gridColumn:'1 / -1' }}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {r.schemesUsed.map((s, i) => (
                    <span key={i} style={{
                      fontSize:11, padding:'3px 9px', borderRadius:12,
                      background:'rgba(249,115,22,0.1)', color:'#fb923c',
                      border:'1px solid rgba(249,115,22,0.25)',
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            </Section>
          )}

          <div style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', marginTop:8 }}>
            Serial #{r.serialNumber} · Surveyed {r.Time_stamp ? new Date(r.Time_stamp).toLocaleDateString('en-IN') : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BJP MEMBER CARD
// ─────────────────────────────────────────────────────────────────────────────
const BJP_ACCENT = '#f43f5e';

const BjpMemberCard = memo(function BjpMemberCard({ record, onClick }) {
  const firstName = record.firstName || '';
  const lastName  = record.lastName  || '';
  const name      = [firstName, record.middleName, lastName].filter(Boolean).join(' ') || '—';
  const initial   = name.trim()[0]?.toUpperCase() || '?';
  const color     = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const voterid   = record.voterid        || '';
  const membershipId = record.partyMembershipId || '';
  const ward      = record.wardNumber     || '';
  const contact   = record.contactNumber  || '';
  const community = record.community      || '';
  const isMale    = (record.gender || '').toLowerCase() === 'male' || record.gender === 'M';
  const [hov, setHov] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? BJP_ACCENT : 'var(--border)'}`,
        borderRadius: 'var(--r-md)', padding: '13px 15px', cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? `0 6px 20px rgba(244,63,94,0.15)` : 'none',
      }}>

      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:9 }}>
        <div style={{
          width:36, height:36, borderRadius:9, flexShrink:0,
          background: color, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, fontSize:14,
          boxShadow: `0 0 0 2px ${BJP_ACCENT}55`,
        }}>{initial}</div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
          {voterid && (
            <div style={{ fontSize:11, color:'var(--gold)', fontFamily:'monospace', marginTop:2, letterSpacing:'0.3px' }}>{voterid}</div>
          )}
        </div>

        {/* BJP badge */}
        <div style={{
          fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:9, flexShrink:0,
          background:'rgba(244,63,94,0.15)', color: BJP_ACCENT,
          border:'1px solid rgba(244,63,94,0.35)', letterSpacing:'0.04em',
        }}>🪷 BJP</div>
      </div>

      {/* Chips row */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {membershipId && <Chip icon="🪪" label={membershipId} maxW={100}/>}
        {ward         && <Chip icon="📍" label={`Ward ${ward}`}/>}
        {community    && <Chip icon="🏘" label={community} maxW={80}/>}
        {contact      && <Chip icon="📞" label={contact}/>}
        {record.gender && (
          <span style={{
            fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:9,
            background: isMale ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
            color:      isMale ? '#60a5fa'               : '#f472b6',
            border:     `1px solid ${isMale ? 'rgba(59,130,246,0.3)' : 'rgba(236,72,153,0.3)'}`,
          }}>{isMale ? '♂ M' : '♀ F'}</span>
        )}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// BJP MEMBER DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function BjpMemberModal({ record, onClose }) {
  if (!record) return null;

  const firstName = record.firstName || '';
  const lastName  = record.lastName  || '';
  const name      = [firstName, record.middleName, lastName].filter(Boolean).join(' ') || '—';
  const initial   = name.trim()[0]?.toUpperCase() || '?';
  const color     = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const Section = ({ title, icon, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:7,
        marginBottom:10, paddingBottom:6,
        borderBottom:`1px solid rgba(244,63,94,0.2)`,
      }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <span style={{ fontSize:11, fontWeight:800, color: BJP_ACCENT, textTransform:'uppercase', letterSpacing:'0.08em' }}>{title}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value, full, highlight }) => {
    if (!value && value !== 0 && value !== false) return null;
    return (
      <div style={{
        gridColumn: full ? '1 / -1' : 'auto',
        display:'flex', flexDirection:'column', gap:2,
        padding:'7px 10px', borderRadius:8,
        background: highlight ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.03)',
        border: highlight ? '1px solid rgba(244,63,94,0.25)' : '1px solid transparent',
      }}>
        <span style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:600, color: highlight ? '#fb7185' : 'var(--text-1)', wordBreak:'break-word' }}>
          {String(value)}
        </span>
      </div>
    );
  };

  const r = record;
  const fullName = [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ');
  const address  = [r.houseNumber, r.address].filter(Boolean).join(', ');

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.70)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg-surface)',
        border:`1px solid rgba(244,63,94,0.35)`,
        borderRadius:'var(--r-lg)', width:'100%', maxWidth:580,
        maxHeight:'88vh', overflowY:'auto',
        boxShadow:'0 28px 64px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center', gap:14,
          padding:'18px 22px', borderBottom:'1px solid var(--border)',
          position:'sticky', top:0, background:'var(--bg-surface)', zIndex:2,
          backgroundImage:'linear-gradient(135deg,rgba(244,63,94,0.07) 0%,transparent 60%)',
        }}>
          <div style={{
            width:48, height:48, borderRadius:14, flexShrink:0,
            background: color, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:800, fontSize:20, boxShadow:`0 0 0 3px rgba(244,63,94,0.35)`,
          }}>{initial}</div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:17, color:'var(--text-1)', lineHeight:1.2 }}>{name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
              {r.voterid && (
                <span style={{ fontSize:11, color:'var(--gold)', fontFamily:'monospace', fontWeight:600 }}>{r.voterid}</span>
              )}
              <span style={{
                fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:9,
                background:'rgba(244,63,94,0.15)', color: BJP_ACCENT,
                border:'1px solid rgba(244,63,94,0.35)', letterSpacing:'0.05em',
              }}>🪷 BJP MEMBER</span>
            </div>
          </div>

          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.07)', border:'none',
            borderRadius:8, width:34, height:34, cursor:'pointer',
            color:'var(--text-2)', fontSize:21,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>×</button>
        </div>

        {/* Membership ID banner */}
        {r.partyMembershipId && (
          <div style={{
            margin:'16px 22px 0',
            background:'rgba(244,63,94,0.09)',
            border:'1px solid rgba(244,63,94,0.3)',
            borderRadius:10, padding:'10px 14px',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <span style={{ fontSize:22 }}>🪪</span>
            <div>
              <div style={{ fontSize:11, color:'rgba(244,63,94,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>BJP Membership ID</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#fb7185', fontFamily:'monospace' }}>{r.partyMembershipId}</div>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding:'18px 22px 24px' }}>

          <Section title="Personal Details" icon="👤">
            <Row label="Full Name"       value={fullName}          full />
            <Row label="Date of Birth"   value={r.dob} />
            <Row label="Age"             value={r.age} />
            <Row label="Gender"          value={r.gender} />
            <Row label="Marital Status"  value={r.maritalStatus} />
            <Row label="Voter ID"        value={r.voterid} />
            <Row label="Aadhaar"         value={r.addharNumber} />
            <Row label="Contact"         value={r.contactNumber} />
          </Section>

          <Section title="BJP Membership" icon="🪷">
            <Row label="Party Member"      value={r.partyMember}        highlight />
            <Row label="Membership ID"     value={r.partyMembershipId}  highlight full />
            <Row label="BJP Verified"      value={r.bjpMember === true ? 'Yes' : r.bjpMember === false ? 'No' : 'Pending'} />
          </Section>

          <Section title="Address" icon="🏠">
            <Row label="House Number"  value={r.houseNumber}  full />
            <Row label="Address"       value={r.address}      full />
            <Row label="Ward"          value={r.wardNumber} />
            <Row label="Booth No"      value={r.boothNo} />
            <Row label="Area Type"     value={r.areaType} />
            <Row label="Home Type"     value={r.homeType} />
            {r.pollingStation && <Row label="Polling Station" value={r.pollingStation} full />}
          </Section>

          <Section title="Demographics" icon="🧬">
            <Row label="Religion"        value={r.religion} />
            <Row label="Community"       value={r.community} />
            <Row label="Sub-Category"    value={r.subcategory} />
            <Row label="Education"       value={r.education} />
            <Row label="Employment"      value={r.employmentStatus} />
            <Row label="Annual Income"   value={r.annualIncome ? `₹${r.annualIncome}` : null} />
            <Row label="Economic Status" value={r.economicStatus} />
          </Section>

          {(r.relation || r.relationName || r.partNo) && (
            <Section title="Voter Roll Details" icon="📋">
              <Row label="Relation"      value={r.relation} />
              <Row label="Relation Name" value={r.relationName} />
              <Row label="Part No"       value={r.partNo} />
              <Row label="Section Name"  value={r.sectionName} />
              <Row label="Serial No"     value={r.serialNumber} />
            </Section>
          )}

          <div style={{ textAlign:'center', fontSize:11, color:'var(--text-3)', marginTop:8 }}>
            Serial #{r.serialNumber} · Surveyed {r.Time_stamp ? new Date(r.Time_stamp).toLocaleDateString('en-IN') : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label, maxW }) {
  return (
    <span style={{
      fontSize:10, color:'var(--text-3)',
      background:'rgba(255,255,255,0.06)',
      padding:'2px 7px', borderRadius:5,
      maxWidth: maxW || 'none',
      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
    }}>
      {icon && `${icon} `}{label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATOR
// ─────────────────────────────────────────────────────────────────────────────
function Paginator({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(pages - 4, page - 2));
  const nums  = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i).filter(p => p <= pages);

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)',
      gap:8, flexWrap:'wrap',
    }}>
      <button className="btn btn-ghost btn-sm" disabled={page === 1}    onClick={() => onPage(page-1)}>← Prev</button>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {start > 1 && <>
          <PgBtn p={1} cur={page} onPage={onPage}/>
          {start > 2 && <span style={{ color:'var(--text-3)', fontSize:13 }}>…</span>}
        </>}
        {nums.map(p => <PgBtn key={p} p={p} cur={page} onPage={onPage}/>)}
        {start + 4 < pages && <>
          {start + 5 < pages && <span style={{ color:'var(--text-3)', fontSize:13 }}>…</span>}
          <PgBtn p={pages} cur={page} onPage={onPage}/>
        </>}
      </div>
      <button className="btn btn-ghost btn-sm" disabled={page === pages} onClick={() => onPage(page+1)}>Next →</button>
    </div>
  );
}

function PgBtn({ p, cur, onPage }) {
  return (
    <button onClick={() => onPage(p)} style={{
      width:34, height:34, borderRadius:'var(--r-sm)', border:'none',
      cursor:'pointer', fontWeight:600, fontSize:13,
      background: p === cur ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
      color:      p === cur ? '#090e1c'     : 'var(--text-2)',
      transition: 'background 0.15s',
    }}>{p}</button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function isGcpImageUrl(v) {
  if (typeof v !== 'string' || !v.startsWith('http')) return false;
  return (
    v.includes('storage.googleapis.com') ||
    v.includes('storage.cloud.google.com') ||
    v.includes('firebasestorage.googleapis.com') ||
    /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(v)
  );
}

function isPdfUrl(v) {
  if (typeof v !== 'string' || !v.startsWith('http')) return false;
  return /\.pdf(\?|$)/i.test(v) || v.includes('%2F') && v.toLowerCase().includes('pdf');
}

function isDownloadableUrl(v) {
  return isGcpImageUrl(v) || isPdfUrl(v);
}

// Guess a filename from URL + field key, fallback to timestamp
function guessFilename(url, label) {
  try {
    const path = new URL(url).pathname;
    const seg  = decodeURIComponent(path.split('/').pop()).split('?')[0];
    if (seg && seg.includes('.')) return seg;
  } catch (_) {}
  const ext = /\.(pdf|jpg|jpeg|png|gif|webp|bmp)/i.exec(url)?.[1] || 'file';
  return `${label || 'download'}.${ext}`;
}

// Fetch-blob download (works for GCS CORS-enabled URLs; falls back to window.open)
async function downloadFile(url, filename) {
  try {
    const res  = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const bUrl = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = bUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(bUrl); a.remove(); }, 1500);
  } catch (_) {
    // CORS blocked — open in new tab so browser can save it
    window.open(url, '_blank', 'noopener');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO LIGHTBOX MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PhotoLightbox({ url, label, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:2000,
      background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        maxWidth:'90vw', maxHeight:'90vh',
        display:'flex', flexDirection:'column', alignItems:'center', gap:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
          <span style={{ color:'#cbd5e1', fontSize:13, fontWeight:600 }}>{label}</span>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => downloadFile(url, guessFilename(url, label))}
              title="Download"
              style={{
                fontSize:12, color:'#10b981', fontWeight:600,
                padding:'4px 12px', borderRadius:6, cursor:'pointer',
                background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)',
              }}>⬇ Download</button>
            <a href={url} target="_blank" rel="noreferrer" style={{
              fontSize:12, color:'#f59e0b', fontWeight:600,
              padding:'4px 12px', borderRadius:6,
              background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)',
              textDecoration:'none',
            }}>Open in new tab ↗</a>
            <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.1)', border:'none',
              borderRadius:8, width:32, height:32, cursor:'pointer',
              color:'#cbd5e1', fontSize:20,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>×</button>
          </div>
        </div>
        <img src={url} alt={label} style={{
          maxWidth:'85vw', maxHeight:'78vh',
          borderRadius:12, objectFit:'contain',
          boxShadow:'0 24px 60px rgba(0,0,0,0.6)',
        }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DataView
// ─────────────────────────────────────────────────────────────────────────────
export default function DataView() {
  const [tab,            setTab]            = useState('survey');
  const [rows,           setRows]           = useState([]);
  const [cols,           setCols]           = useState([]);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(1);
  const [pages,          setPages]          = useState(1);
  const [search,         setSearch]         = useState('');
  const [loading,        setLoading]        = useState(false);
  const [skelCount,      setSkelCount]      = useState(0);
  const [error,          setError]          = useState('');
  const [uploading,      setUploading]      = useState(false);
  const [uploadMsg,      setUploadMsg]      = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedVoter,  setSelectedVoter]  = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedOutstation, setSelectedOutstation] = useState(null);
  const [selectedBjpMember, setSelectedBjpMember]   = useState(null);
  const [debugInfo,      setDebugInfo]      = useState({});
  const [lightboxPhoto,  setLightboxPhoto]  = useState(null); // { url, label }

  const loadRef   = useRef(0);
  const debouncer = useRef(null);
  const gridRef   = useRef(null);

  const isCardTab  = tab === 'voter' || tab === 'future_voters' || tab === 'deceased' || tab === 'outstation_voters' || tab === 'bjp_members';
  const isTableTab = tab === 'survey';

  const tabConfig = TABS.find(t => t.key === tab) || TABS[0];

  // ── Core load ───────────────────────────────────────────────────────────────
  const load = useCallback((viewType, pg, q) => {
    const callId  = ++loadRef.current;
    const perPage = viewType === 'voter' ? VOTER_PER_PAGE : SURVEY_PER_PAGE;

    setLoading(true);
    setError('');
    setSkelCount(isCardTab ? VOTER_PER_PAGE : 10);

    dataApi.view({ view: viewType, page: pg, per_page: perPage, search: q })
      .then(r => {
        if (callId !== loadRef.current) return;
        if (r.data.success === false) {
          setError(r.data.message || 'Failed to load data.');
          setRows([]); setCols([]);
        } else {
          setRows(r.data.data    || []);
          setCols(r.data.columns || []);
          setTotal(r.data.total  || 0);
          setPage(r.data.page    || pg);
          setPages(r.data.pages  || 1);
          setDebugInfo({ collection: r.data.collection, total: r.data.total });
        }
      })
      .catch(err => {
        if (callId !== loadRef.current) return;
        setError(err.userMessage || err.response?.data?.message || 'Could not load data.');
        setRows([]); setCols([]);
      })
      .finally(() => {
        if (callId === loadRef.current) { setLoading(false); setSkelCount(0); }
      });
  }, [isCardTab]);

  useEffect(() => {
    setPage(1); setSearch(''); setRows([]); setCols([]);
    load(tab, 1, '');
  }, [tab]); // eslint-disable-line

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(debouncer.current);
    debouncer.current = setTimeout(() => { setPage(1); load(tab, 1, q); }, SEARCH_DELAY_MS);
  };

  const handleSearch = () => {
    clearTimeout(debouncer.current);
    setPage(1); load(tab, 1, search);
  };

  const handlePage = (p) => {
    setPage(p);
    load(tab, p, search);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setUploadMsg('');
    setUploadProgress(`Reading: ${(file.size / 1024 / 1024).toFixed(1)} MB…`);
    try {
      setUploadProgress('Uploading to MongoDB…');
      const { data } = await dataApi.upload(file);
      setUploadProgress('');
      setUploadMsg(data.message || 'Uploaded successfully.');
      load(tab, 1, '');
    } catch (err) {
      setUploadProgress('');
      setUploadMsg(err.userMessage || err.response?.data?.message || `Upload failed: ${err.message}`);
    } finally { setUploading(false); e.target.value = ''; }
  };

  // ── CSV export ──────────────────────────────────────────────────────────────
  const downloadCSV = () => {
    if (!rows.length) return;
    const effectiveCols = isTableTab
      ? cols
      : Object.keys(rows[0] || {}).filter(k => k !== '_id');
    const header = effectiveCols.join(',');
    const body   = rows.map(r =>
      effectiveCols.map(c => `"${(r[c] || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${tab}_page${page}.csv`;
    a.click();
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const showSkeletons = loading && isCardTab;
  const from = (page - 1) * VOTER_PER_PAGE + 1;
  const to   = Math.min(page * VOTER_PER_PAGE, total);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <Navbar />

      {/* Voter list modal */}
      <VoterModal voter={selectedVoter} onClose={() => setSelectedVoter(null)} />

      {/* Future voter / deceased detail modal */}
      <RecordModal
        record={selectedRecord}
        title={tab === 'future_voters' ? 'Future Voter' : 'Deceased Record'}
        accentColor={tabConfig.color}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Outstation voter detail modal */}
      <OutstationModal
        record={selectedOutstation}
        onClose={() => setSelectedOutstation(null)}
      />

      {/* BJP member detail modal */}
      <BjpMemberModal
        record={selectedBjpMember}
        onClose={() => setSelectedBjpMember(null)}
      />

      {/* Photo lightbox */}
      {lightboxPhoto && (
        <PhotoLightbox
          url={lightboxPhoto.url}
          label={lightboxPhoto.label}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      <div className="page-inner" style={{ maxWidth: 1400 }}>

        {/* ── Page header ── */}
        <div className="page-header anim-fade-up">
          <span className="badge badge-gold mb-8">Data Explorer</span>
          <h1>View &amp; Export Data</h1>
          <p>Browse survey records, voter list, future voters and deceased from MongoDB</p>
        </div>

        {/* ── Controls row ── */}
        <div className="flex items-center gap-12 mb-20 anim-fade-up" style={{ flexWrap:'wrap' }}>

          {/* Tab switcher — 4 tabs */}
          <div style={{
            display:'flex', gap:4,
            background:'rgba(255,255,255,0.04)', padding:4,
            borderRadius:'var(--r-md)', border:'1px solid var(--border)',
            flexWrap:'wrap',
          }}>
            {TABS.map(t => (
              <button key={t.key}
                onClick={() => {
                  if (t.key === tab) return;
                  setTab(t.key); setSearch(''); setError('');
                  setUploadMsg(''); setUploadProgress('');
                  setSelectedVoter(null); setSelectedRecord(null); setSelectedOutstation(null); setSelectedBjpMember(null);
                }}
                style={{
                  padding:'8px 18px', borderRadius:'var(--r-sm)', border:'none',
                  cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:600,
                  fontSize:13, transition:'all 0.2s',
                  background: tab === t.key ? t.color  : 'transparent',
                  color:      tab === t.key ? '#090e1c' : 'var(--text-2)',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="search-bar flex-1" style={{ minWidth:220 }}>
            <span className="search-icon">⌕</span>
            <input
              className="input"
              placeholder={
                tab === 'voter'              ? 'Search by name, EPIC, house no…'    :
                tab === 'future_voters'      ? 'Search by name, house, ward…'        :
                tab === 'deceased'           ? 'Search by name, voter ID, house…'    :
                tab === 'outstation_voters'  ? 'Search by name, city, state, ward…'  :
                tab === 'bjp_members'        ? 'Search by name, membership ID, ward…':
                                               'Search survey data…'
              }
              value={search}
              onChange={handleSearchChange}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <button className="btn btn-outline" onClick={handleSearch} disabled={loading}>
            {loading ? <span className="spinner"/> : 'Search'}
          </button>
          <button className="btn btn-outline" onClick={downloadCSV} disabled={!rows.length}>↓ CSV</button>

          {tab === 'voter' && (
            <label className="btn btn-ghost" style={{ cursor: uploading ? 'not-allowed':'pointer', opacity: uploading ? 0.7:1 }}>
              {uploading ? <><span className="spinner" style={{ marginRight:8 }}/>Uploading…</> : '↑ Upload'}
              <input type="file" accept=".csv,.xlsx,.xls" hidden disabled={uploading} onChange={handleUpload}/>
            </label>
          )}
        </div>

        {/* ── Upload feedback ── */}
        {uploadProgress && (
          <div className="alert alert-info mb-12" style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span className="spinner"/>
            <div>
              <div style={{ fontWeight:600, marginBottom:2 }}>{uploadProgress}</div>
              <div style={{ fontSize:12, opacity:0.75 }}>Large files may take 10–30 s. Please wait…</div>
            </div>
          </div>
        )}
        {uploadMsg && (
          <div className={`alert ${uploadMsg.toLowerCase().includes('success') ? 'alert-success':'alert-error'} mb-16`}>
            {uploadMsg.toLowerCase().includes('success') ? '✓ ':'⚠ '}{uploadMsg}
          </div>
        )}

        {/* ── Stats bar ── */}
        {!error && (total > 0 || rows.length > 0) && (
          <div className="flex items-center gap-8 mb-12" style={{ flexWrap:'wrap' }}>
            {total > 0 && (
              <span className="badge" style={{ background: tabConfig.color + '22', color: tabConfig.color, border:`1px solid ${tabConfig.color}44` }}>
                {total.toLocaleString()} total
              </span>
            )}
            {isCardTab && rows.length > 0 && !loading && (
              <span className="badge badge-cyan">
                {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
              </span>
            )}
            {isTableTab && cols.length > 0 && (
              <span className="badge badge-green">{cols.length} columns</span>
            )}
            {search && <span className="badge badge-cyan">Filtered: "{search}"</span>}
            <span style={{ fontSize:13, color:'var(--text-2)' }}>
              Page {page} of {pages}
              {isCardTab && ` · ${VOTER_PER_PAGE} cards/page`}
            </span>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            CARD TABS — Voter List / Future Voters / Deceased
        ════════════════════════════════════════════════════════════════════ */}
        {isCardTab && (
          <div className="card anim-fade-up" style={{ overflow:'hidden' }} ref={gridRef}>

            {!loading && error && (
              <div style={{ padding:28 }}>
                <div className="alert alert-error mb-16">⚠ {error}</div>
                <button className="btn btn-primary" onClick={() => load(tab, page, search)}>↻ Retry</button>
              </div>
            )}

            {!loading && !error && rows.length === 0 && skelCount === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  {tab === 'future_voters'     ? '🕐' :
                   tab === 'deceased'          ? '✦'  :
                   tab === 'outstation_voters' ? '✈'  : '🗳️'}
                </div>
                <h3>
                  {search
                    ? `No results for "${search}"`
                    : tab === 'future_voters'     ? 'No future voter records found'
                    : tab === 'deceased'          ? 'No deceased records found'
                    : tab === 'outstation_voters' ? 'No outstation voters found'
                    : 'No voters found'}
                </h3>
                <p style={{ maxWidth:460, lineHeight:1.7 }}>
                  {search
                    ? `No record matched "${search}". Try a different name, city, or ID.`
                    : tab === 'future_voters'
                      ? 'Future voter records are added during survey when a household member is below voting age.'
                      : tab === 'deceased'
                        ? 'Deceased records are added during survey. They may include a death certificate upload.'
                        : tab === 'outstation_voters'
                          ? 'Outstation voters are survey respondents who live outside the constituency. They are marked during survey.'
                          : 'No voters in the database. Upload a voter list using the Upload button.'}
                </p>
                {search && (
                  <button className="btn btn-ghost" style={{ marginTop:14 }}
                    onClick={() => { setSearch(''); load(tab, 1, ''); }}>
                    ✕ Clear search
                  </button>
                )}
              </div>
            )}

            {(showSkeletons || rows.length > 0) && (
              <div style={{ padding:20 }}>
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',
                  gap:12,
                }}>
                  {showSkeletons
                    ? Array.from({ length: Math.min(skelCount, 24) }).map((_, i) => <SkeletonCard key={i}/>)
                    : rows.map((record, i) => {
                        if (tab === 'voter') {
                          return (
                            <VoterCard
                              key={record['Epic NO'] || i}
                              voter={record}
                              onClick={() => setSelectedVoter(record)}
                            />
                          );
                        }
                        if (tab === 'future_voters') {
                          return (
                            <FutureVoterCard
                              key={record._id || i}
                              record={record}
                              onClick={() => setSelectedRecord(record)}
                            />
                          );
                        }
                        if (tab === 'deceased') {
                          return (
                            <DeceasedCard
                              key={record._id || i}
                              record={record}
                              onClick={() => setSelectedRecord(record)}
                            />
                          );
                        }
                        if (tab === 'outstation_voters') {
                          return (
                            <OutstationCard
                              key={record._id || i}
                              record={record}
                              onClick={() => setSelectedOutstation(record)}
                            />
                          );
                        }
                        if (tab === 'bjp_members') {
                          return (
                            <BjpMemberCard
                              key={record._id || i}
                              record={record}
                              onClick={() => setSelectedBjpMember(record)}
                            />
                          );
                        }
                        return null;
                      })
                  }
                </div>
                {!loading && <Paginator page={page} pages={pages} onPage={handlePage}/>}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TABLE TAB — Survey Data
        ════════════════════════════════════════════════════════════════════ */}
        {isTableTab && (
          <div className="card anim-fade-up" style={{ overflow:'hidden' }}>

            {loading && (
              <div className="loading-center">
                <span className="spinner spinner-lg"/>
                <p>Loading SurveyRecords from MongoDB…</p>
              </div>
            )}

            {!loading && error && (
              <div style={{ padding:28 }}>
                <div className="alert alert-error mb-16">⚠ {error}</div>
                <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', borderRadius:10, fontSize:13, color:'#6b7fa0', lineHeight:1.9 }}>
                  <strong style={{ color:'#8899bb' }}>Common causes:</strong><br/>
                  1. MongoDB URL wrong in <code>backend/telusko/settings.py</code><br/>
                  2. Collection name mismatch — DB must have <code>SurveyRecords</code><br/>
                  3. MongoDB Atlas IP whitelist blocking server — add <code>0.0.0.0/0</code><br/>
                  4. Check Django terminal for the exact Python traceback
                </div>
                <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => load('survey', page, search)}>↻ Retry</button>
              </div>
            )}

            {!loading && !error && rows.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No records found</h3>
                <p>{search ? `No results for "${search}"` : 'The SurveyRecords collection in MongoDB is empty'}</p>
                {search && (
                  <button className="btn btn-ghost" style={{ marginTop:12 }}
                    onClick={() => { setSearch(''); load('survey', 1, ''); }}>Clear search</button>
                )}
              </div>
            )}

            {!loading && !error && rows.length > 0 && (
              <>
                <div className="table-wrap" style={{ maxHeight:'62vh', overflowY:'auto' }}>
                  <table>
                    <thead style={{ position:'sticky', top:0, background:'var(--bg-surface)', zIndex:5 }}>
                      <tr>
                        {cols.map(c => <th key={c}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i}>
                          {cols.map(c => {
                            const val = row[c];
                            const strVal = val !== undefined && val !== null && val !== '' ? String(val) : null;
                            if (strVal && isGcpImageUrl(strVal)) {
                              return (
                                <td key={c} title={strVal}>
                                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                    <button
                                      onClick={() => setLightboxPhoto({ url: strVal, label: c })}
                                      style={{
                                        background: 'none', border: 'none', padding: 0,
                                        cursor: 'zoom-in', lineHeight: 0, flexShrink: 0,
                                      }}
                                    >
                                      <img
                                        src={strVal}
                                        alt={c}
                                        style={{
                                          width: 36, height: 36,
                                          borderRadius: 6,
                                          objectFit: 'cover',
                                          border: '1px solid rgba(245,158,11,0.4)',
                                          display: 'block',
                                        }}
                                        onError={e => {
                                          e.target.style.display = 'none';
                                          e.target.parentNode.innerHTML = '<span style="color:#f59e0b;font-size:11px">📷</span>';
                                        }}
                                      />
                                    </button>
                                    <button
                                      onClick={() => downloadFile(strVal, guessFilename(strVal, c))}
                                      title="Download"
                                      style={{
                                        background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)',
                                        borderRadius:5, padding:'2px 5px', cursor:'pointer',
                                        color:'#10b981', fontSize:12, lineHeight:1, flexShrink:0,
                                      }}>⬇</button>
                                  </div>
                                </td>
                              );
                            }
                            // Plain file/PDF URL in table
                            if (strVal && strVal.startsWith('http')) {
                              return (
                                <td key={c} title={strVal}>
                                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                    <a href={strVal} target="_blank" rel="noreferrer"
                                      style={{ color:'#a78bfa', fontSize:11, whiteSpace:'nowrap' }}>
                                      {isPdfUrl(strVal) ? '📄 PDF' : '🔗 File'}
                                    </a>
                                    <button
                                      onClick={() => downloadFile(strVal, guessFilename(strVal, c))}
                                      title="Download"
                                      style={{
                                        background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)',
                                        borderRadius:5, padding:'2px 5px', cursor:'pointer',
                                        color:'#10b981', fontSize:12, lineHeight:1, flexShrink:0,
                                      }}>⬇</button>
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={c} title={strVal || ''}>
                                {strVal || '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)' }}>
                    <Paginator page={page} pages={pages} onPage={handlePage}/>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}