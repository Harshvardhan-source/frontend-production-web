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

const WARD_NAMES = {
  '21':'Padav West','24':'Derebail South','25':'Derebail North',
  '26':'Derebail Nairuthya','27':'Boloor','28':'Mannagudda',
  '29':'Kambala','30':'Kodialbail','31':'Bejai',
  '32':'Kadri North','33':'Kadri South','34':'Shivabagh',
  '35':'Padav Central','36':'Padav East','37':'Maroli',
  '38':'Bendoor','39':'Falnir','40':'Court',
  '41':'Central','42':'Dongarakery','43':'Kudroli',
  '44':'Bunder','45':'Port','46':'Contonment',
  '47':'Millagres','48':'Valancia','49':'Kankanady',
  '50':'Alape South','51':'Alape North','52':'Kannur',
  '53':'Bajal','54':'Jappimogaru','55':'Attavara',
  '56':'Mangaladevi','57':'Hoige Bazar','58':'Bolar',
  '59':'Jeppu','60':'Bengre',
};

// ─── Ward Selector Dropdown ───────────────────────────────────────────────────
// Uses createPortal so the panel renders in document.body — completely outside
// any overflow:hidden or stacking context that would cause it to overlap content.
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
    // Only close on scroll if the scroll happened OUTSIDE the dropdown panel
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
            {active && <span style={{ color: '#f59e0b', fontSize: 13, flexShrink: 0 }}>✓</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <button ref={btnRef} onClick={openDropdown} style={{
        display: 'flex', alignItems: 'center', gap: 8, minWidth: 210, flexShrink: 0,
        background: value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${value ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
        fontSize: 13, fontWeight: 600,
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

const WARD_BOOTHS_MAP = {
  "ALAPE NORTH":[44,189,191,190,192,197,45],"ALAPE SOUTH":[188,187,186,185,184,209,210],
  "ATHAVARA":[152,151,242,243,221,222,153],"BAJAL":[202,201,203,204,206,205,207,208],
  "BEJAI":[15,16,18,19,23,21,20],"BENDOOR":[162,163,134,136,129,167],
  "BENGRE":[94,95,96,99,97,100,98,101,103,102],"BOLAR":[237,238,236,230,231,225],
  "BOLOOR":[93,92,91,82,79,78],"BUNDER":[115,116,117,118,112,119],
  "CENTRAL":[120,121,124,123,122],"CONTONMENT":[150,137,145,146,141],
  "COURT":[143,127,126,125,142],"DEREBAIL NAIRUTHYA":[4,90,89,86,85,87,88,10],
  "DEREBAIL SOUTH":[17,11,12,8,9,14,13],"DEREBAIL WEST":[5,1,2,3,7,6],
  "DONGARAKERY":[114,73,74,111,108,113,71],"FALNIR":[159,161,160,158,168,169,171,170],
  "HOIGE BAZAR":[239,235,232,229,233],"JAPPIMOGAR":[213,217,214,218,212,211,215,216,244],
  "JEPPU":[240,219,220,241,156,157,155,154],"KADRI NORTH":[62,63,30,27,28,29],
  "KADRI SOUTH":[59,61,60,57],"KAMBALA":[69,68,67,66,70],
  "KANKANADY":[176,175,182,181,177,178,179,180],"KANNUR":[193,198,195,199,196,200,194],
  "KODIALBAIL":[65,64,26,24,25,22],"KUDROLI":[107,106,109,110,104,105],
  "MANGALADEVI":[147,228,227,226,223,224],"MANNAGDDA":[77,76,80,81,83,84,72,75],
  "MAROLI":[46,47,48,50,52,49,51],"MILAGRESS":[140,138,139,164,165,166],
  "PADAV CENTRAL":[35,34,38,41,39,43,42],"PADAV-EAST":[37,36,40],
  "PADAV-WEST":[33,32,56,53,54,31,55],"PORT":[148,149,144,234],
  "SHIVABAGH":[128,130,58,135,131],"VALENCIA":[173,172,183,174,132,133],
};

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

// ─── Member Row ───────────────────────────────────────────────────────────────
function MemberRow({ member, wardNumber, wardName, serialStart, houseSurveyData, query, onSurveyDone }) {
  const navigate = useNavigate();

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
        serialNo:    serialStart,  returnTo: '/',          returnQuery: query || '',
        prefill: {
          voterid:      member.voterid || '',
          gender:       genderFull,
          firstName:    (member.name || '').split(' ')[0]           || '',
          lastName:     (member.name || '').split(' ').slice(-1)[0] || '',
          houseNumber:  hs.houseNumber  || member.house_no || '',
          wardNumber:   resolvedWard,
          boothNo:      boothStr,
          address:      hs.address      || '',
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
      ) : (
        <button onClick={handleStartSurvey} style={{
          background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 8,
          padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#090e1c',
          cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
        }}>✎ Survey</button>
      )}
    </div>
  );
}

// ─── House Card ───────────────────────────────────────────────────────────────
function HouseCard({ house, serialCounter, query }) {
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
          // find the exact house by houseNo
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
      {/* Panel header */}
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

      {/* Members list */}
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
              {/* Serial */}
              <div style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
              }}>{i + 1}</div>

              {/* Avatar initial */}
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: m.surveyed ? 'rgba(16,185,129,0.15)' : `${genderColor}18`,
                border: `1px solid ${m.surveyed ? 'rgba(16,185,129,0.3)' : `${genderColor}30`}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                color: m.surveyed ? '#10b981' : genderColor,
              }}>{(m.name || '?')[0].toUpperCase()}</div>

              {/* Info */}
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

              {/* Surveyed badge */}
              {m.surveyed ? (
                <div style={{
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: '#10b981', flexShrink: 0,
                }}>✓ Done</div>
              ) : (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: '#f87171', flexShrink: 0,
                }}>Pending</div>
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
  const [selectedHouse, setSelectedHouse] = useState(null); // drill-down

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

  // accent colour: teal
  const ACCENT = '#22d3ee';

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 760,
          background: 'linear-gradient(160deg, #0d1b30 0%, #090e1c 100%)',
          border: '1px solid rgba(34,211,238,0.18)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '88vh',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          background: 'rgba(34,211,238,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>👨‍👩‍👧‍👦</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>
                Large Families
                {!loading && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>{total} houses · 15+ members</span>}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                {selectedHouse ? 'Member records' : 'Ward-wise breakdown · click any house to view members'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
            fontSize: 15, color: 'rgba(255,255,255,0.45)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* ── Drill-down: member panel ── */}
        {selectedHouse ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <HouseMembersPanel house={selectedHouse} onBack={() => setSelectedHouse(null)} />
          </div>
        ) : (
          <>
            {/* ── Search ── */}
            <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 9, padding: '7px 12px',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 14 }}>⌕</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter by ward, house number or booth…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#fff' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 0 }}>✕</button>
                )}
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px 24px' }}>
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ height: 64, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.6s ease-in-out infinite' }} />
                  ))}
                </div>
              )}

              {error && <div style={{ padding: '20px 0', color: '#f87171', textAlign: 'center', fontSize: 14 }}>⚠ {error}</div>}

              {!loading && !error && filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)' }}>
                  <div style={{ fontSize: 34, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontWeight: 600 }}>No results found</div>
                </div>
              )}

              {!loading && filtered.map(ward => {
                const isOpen = expandedWard === ward.wardNumber;
                const barMax = filtered[0]?.count || 1;
                return (
                  <div key={ward.wardNumber} style={{ marginBottom: 10 }}>
                    {/* Ward row */}
                    <div
                      onClick={() => setExpandedWard(isOpen ? null : ward.wardNumber)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        background: isOpen ? 'rgba(34,211,238,0.07)' : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${isOpen ? 'rgba(34,211,238,0.22)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: isOpen ? '12px 12px 0 0' : 12,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                    >
                      {/* Ward badge */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: isOpen ? 'rgba(34,211,238,0.13)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isOpen ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.09)'}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: isOpen ? ACCENT : 'rgba(255,255,255,0.25)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Ward</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: isOpen ? ACCENT : '#e2e8f0', lineHeight: 1.1 }}>{ward.wardNumber}</span>
                      </div>

                      {/* Name + bar */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ward.wardName}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>{ward.count} house{ward.count !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.round((ward.count / barMax) * 100)}%`,
                            background: isOpen ? `linear-gradient(90deg, ${ACCENT}, #67e8f9)` : 'rgba(34,211,238,0.35)',
                            borderRadius: 2, transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>

                      <span style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.2)', fontSize: 15, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>⌄</span>
                    </div>

                    {/* House list (simple rows) */}
                    {isOpen && (
                      <div style={{
                        border: '1px solid rgba(34,211,238,0.14)', borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        background: 'rgba(34,211,238,0.02)',
                        padding: '10px 12px 12px',
                      }}>
                        {ward.houses.map((house, hi) => {
                          const big = house.memberCount >= 25;
                          return (
                            <div
                              key={`${house.houseNo}-${hi}`}
                              onClick={() => setSelectedHouse(house)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '9px 14px', marginBottom: 6,
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(34,211,238,0.06)';
                                e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                              }}
                            >
                              <span style={{ fontSize: 16, flexShrink: 0 }}>⌂</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', flex: 1 }}>
                                House No: {house.houseNo}
                              </span>
                              {house.booth && (
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>
                                  Booth {house.booth}
                                </span>
                              )}
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: big ? 'rgba(239,68,68,0.1)' : 'rgba(34,211,238,0.1)',
                                border: `1px solid ${big ? 'rgba(239,68,68,0.25)' : 'rgba(34,211,238,0.25)'}`,
                                borderRadius: 16, padding: '3px 10px', flexShrink: 0,
                              }}>
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
  const [stats, setStats]     = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]     = useState('');

  // ── Ward filter state ─────────────────────────────────────────────────────
  const [selectedWard,      setSelectedWard]      = useState('');
  const [wardStats,         setWardStats]         = useState(null);
  const [wardStatsLoading,  setWardStatsLoading]  = useState(false);
  const [wardError,         setWardError]         = useState('');

  const [largeFamiliesOpen, setLargeFamiliesOpen] = useState(false);

  const [query, setQuery]         = useState('');
  const [searching, setSearching] = useState(false);
  const [searchRes, setSearchRes] = useState(null);
  const [searchErr, setSearchErr] = useState('');
  const [nextSerial, setNextSerial] = useState(1);
  const debounceRef      = useRef(null);
  const searchResultsRef = useRef(null);

  // ── Load stats in background — page renders immediately ──────────────────
  useEffect(() => {
    dashboardApi.stats()
      .then(r => { setStats(r.data); setError(''); })
      .catch(e => setError(e.userMessage || e.response?.data?.message || 'Could not load dashboard data.'))
      .finally(() => setStatsLoading(false));

    dashboardApi.serialNumber()
      .then(r => setNextSerial(r.data.serialNumber || 1))
      .catch(() => {});
  }, []);

  // ── Load ward stats when ward changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedWard) { setWardStats(null); setWardError(''); return; }
    setWardStatsLoading(true);
    setWardError('');
    dashboardApi.wardStats(selectedWard)
      .then(r => { if (r.data.success) setWardStats(r.data); else setWardError(r.data.message || 'Failed to load ward data.'); })
      .catch(e => setWardError(e.userMessage || 'Network error loading ward data.'))
      .finally(() => setWardStatsLoading(false));
  }, [selectedWard]);

  // ── Search ────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setSearchRes(null); setSearchErr(''); return; }
    setSearching(true); setSearchErr('');
    try {
      const r = await dashboardApi.houseSearch(q);
      if (r.data.success) setSearchRes(r.data);
      else setSearchErr('Search failed.');
    } catch {
      setSearchErr('Network error. Please try again later.');
    } finally { setSearching(false); }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 200);
  };

  const clearSearch = () => { setQuery(''); setSearchRes(null); setSearchErr(''); };

  const activeLoading = selectedWard ? wardStatsLoading : statsLoading;
  const s             = (selectedWard ? wardStats : stats) || {};
  const coverage      = s.totalVoters ? Math.min(100, ((s.totalReg / s.totalVoters) * 100).toFixed(1)) : 0;

  const wardData = Object.entries(s.wardCoverage || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, val]) => ({ name: name.length > 11 ? name.slice(0, 11) + '…' : name, value: +val.toFixed(1) }));

  const religionPie = Object.entries(s.voterReligion || {})
    .filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const STAT_CARDS = [
    { label: 'Total Surveys',    value: s.totalReg?.toLocaleString()          || null, icon: '✎', color: '#f59e0b', sub: 'Registered entries' },
    { label: 'Total Voters',     value: s.totalVoters?.toLocaleString()        || null, icon: '◉', color: '#22d3ee', sub: selectedWard ? `Ward ${selectedWard} voters` : 'Voter list records' },
    { label: 'Houses Covered',   value: s.houseCount?.toLocaleString()         || null, icon: '⌂', color: '#10b981', sub: 'Unique households' },
    { label: 'Large Families',   value: s.largeFamilyCount?.toLocaleString()   ?? null, icon: '👨‍👩‍👧‍👦', color: '#f97316', sub: 'Houses with 15+ members' },
    { label: 'Coverage',         value: (selectedWard ? wardStats : stats) ? `${coverage}%` : null, icon: '◈', color: '#8b5cf6', sub: 'Survey completion' },
  ];

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
    <div className="page">
      <Navbar />
      <div className="page-inner">

        {/* ── Search Bar ──────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom: 28 }}>
          <div style={{
            position: 'relative', background: 'rgba(17,28,52,0.8)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
            padding: '4px 6px 4px 16px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)',
          }}>
            <span style={{ fontSize: 18, color: 'var(--text-3)', flexShrink: 0 }}>⌕</span>
            <input
              value={query} onChange={handleQueryChange}
              placeholder="Search by Voter Name, Voter ID, House No or Relation Name…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-1)', padding: '10px 0' }}
            />
            {searching && <span className="spinner" style={{ flexShrink: 0 }} />}
            {query && !searching && (
              <button onClick={clearSearch} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                fontSize: 12, color: 'var(--text-2)', flexShrink: 0,
              }}>✕ Clear</button>
            )}
          </div>
          {!query && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {['Search by name', 'Search by Voter ID', 'Search by House No'].map(hint => (
                <span key={hint} style={{ fontSize: 11, color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '3px 10px' }}>{hint}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── Search Results ──────────────────────────────────────────────── */}
        {(query || searchRes) && (
          <div ref={searchResultsRef} className="anim-fade-up" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                  Search Results
                  {searchRes && <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>{searchRes.total_houses} house{searchRes.total_houses !== 1 ? 's' : ''} found</span>}
                </h2>
                {query && <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Showing results for "<span style={{ color: 'var(--gold)' }}>{query}</span>"</p>}
              </div>
            </div>
            {searchErr && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {searchErr}</div>}
            {searching && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 14 }}><span className="spinner" /> Searching…</div>}
            {!searching && searchRes && searchRes.total_houses === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--text-3)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No results found</div>
                <div style={{ fontSize: 13 }}>Try a different name, voter ID or house number</div>
              </div>
            )}
            {!searching && searchRes && searchRes.houses.map((house, idx) => {
              const prevCount = searchRes.houses.slice(0, idx).reduce((a, h) => a + (h.total_members || 0), 0);
              return <HouseCard key={house.house_no} house={house} serialCounter={nextSerial + prevCount} query={query} />;
            })}
          </div>
        )}

        {/* ── Dashboard content — renders immediately, stats fill in ─────── */}
        <>
          {/* Header */}
          <div className="page-header anim-fade-up">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="badge badge-cyan mb-8">Dashboard</span>
                <h1>{greeting}, {user?.username} 👋</h1>
                <p>{selectedWard ? <>Viewing <strong style={{ color: '#f59e0b' }}>Ward {selectedWard} — {WARD_NAMES[selectedWard]}</strong></> : 'Your constituency intelligence overview'}</p>
              </div>
              <div style={{ paddingTop: 4 }}>
                <WardSelector value={selectedWard} onChange={setSelectedWard} />
              </div>
            </div>
          </div>

          {/* Ward Info Card — demographic data only, no duplicate stats */}
          {selectedWard && (
            <div className="anim-fade-up" style={{ marginBottom: 24 }}>
              <div style={{
                background: 'linear-gradient(135deg,rgba(245,158,11,0.13) 0%,rgba(245,158,11,0.04) 100%)',
                border: '1px solid rgba(245,158,11,0.28)',
                borderRadius: wardStatsLoading || !wardStats ? 14 : '14px 14px 0 0',
                padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏘</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>
                      Ward {selectedWard} — {wardStats?.wardName || WARD_NAMES[selectedWard]}
                    </div>
                    {wardStats && (
                      <div style={{ fontSize: 12, color: 'rgba(245,158,11,0.55)', marginTop: 2 }}>
                        District {wardStats.districtId} · Constituency {wardStats.constituencyId}
                      </div>
                    )}
                  </div>
                  {wardStatsLoading && <span className="spinner" />}
                </div>
                <button onClick={() => setSelectedWard('')} style={{
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#f59e0b',
                }}>✕ Clear</button>
              </div>

              {!wardStatsLoading && wardStats && (
                <div style={{
                  background: 'rgba(10,18,34,0.97)',
                  border: '1px solid rgba(245,158,11,0.2)', borderTop: 'none',
                  borderRadius: '0 0 14px 14px', padding: '18px 20px',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>Voter Roll Demographics</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
                    {[
                      { label: 'Total Voters', value: wardStats.totalVoters, color: '#22d3ee', pct: 100 },
                      { label: 'Male',         value: wardStats.totalMale,   color: '#22d3ee', pct: wardStats.totalVoters ? Math.round(wardStats.totalMale / wardStats.totalVoters * 100) : 0 },
                      { label: 'Female',       value: wardStats.totalFemale, color: '#ec4899', pct: wardStats.totalVoters ? Math.round(wardStats.totalFemale / wardStats.totalVoters * 100) : 0 },
                      { label: 'Hindu',        value: wardStats.totalHindu,  color: '#f97316', pct: wardStats.totalVoters ? Math.round(wardStats.totalHindu / wardStats.totalVoters * 100) : 0 },
                      { label: 'Muslim',       value: wardStats.totalMuslim, color: '#10b981', pct: wardStats.totalVoters ? Math.round(wardStats.totalMuslim / wardStats.totalVoters * 100) : 0 },
                      { label: 'Christian',    value: wardStats.totalChristian, color: '#8b5cf6', pct: wardStats.totalVoters ? Math.round(wardStats.totalChristian / wardStats.totalVoters * 100) : 0 },
                    ].map(({ label, value, color, pct }) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
                          <div>
                            <span style={{ fontSize: 15, fontWeight: 800, color }}>{value?.toLocaleString() ?? '—'}</span>
                            {pct !== 100 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>{pct}%</span>}
                          </div>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${color}99,${color})`, borderRadius: 2, transition: 'width 0.7s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wardError && <div className="alert alert-error" style={{ marginTop: 8 }}>⚠ {wardError}</div>}
            </div>
          )}

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

          {/* Stat cards */}
          <div className="stagger mb-24" style={{ display: 'grid', gridTemplateColumns: `repeat(${STAT_CARDS.length}, 1fr)`, gap: 12 }}>
            {STAT_CARDS.map(c => (
              activeLoading ? (
                <StatCardSkeleton key={c.label} />
              ) : (
                <div key={c.label}
                  onClick={c.label === 'Large Families' ? () => setLargeFamiliesOpen(true) : undefined}
                  style={{
                    background: 'linear-gradient(145deg, rgba(17,28,52,0.9) 0%, rgba(10,18,35,0.95) 100%)',
                    border: `1px solid ${c.color}22`, borderRadius: 14, padding: '16px 18px',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: c.label === 'Large Families' ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${c.color}33, inset 0 1px 0 rgba(255,255,255,0.05)`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)`;
                  }}
                >
                  <div style={{ position: 'absolute', top: -25, right: -25, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${c.color}16 0%, transparent 70%)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{c.label}</div>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${c.color}15`, border: `1px solid ${c.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{c.icon}</div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: c.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 5 }}>{c.value ?? '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{c.sub}</div>
                    {c.label === 'Large Families' && (
                      <span style={{ fontSize: 10, color: `${c.color}90`, background: `${c.color}12`, border: `1px solid ${c.color}25`, borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>View ›</span>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Coverage bar */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px 26px',
            marginBottom: 24, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative', overflow: 'hidden',
          }} className="anim-fade-up">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, #8b5cf6 0%, #22d3ee ${coverage}%, rgba(255,255,255,0.06) ${coverage}%)`, borderRadius: '16px 16px 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Survey Coverage</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{selectedWard ? `Ward ${selectedWard} — ${WARD_NAMES[selectedWard]}` : 'Completion across all wards'}</div>
              </div>
              {activeLoading ? <Skeleton w={80} h={40} radius={10} /> : (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 900, color: '#8b5cf6', letterSpacing: '-1.5px', lineHeight: 1 }}>{coverage}%</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{s.totalReg?.toLocaleString() || 0} of {s.totalVoters?.toLocaleString() || 0}</div>
                </div>
              )}
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              {!activeLoading && <div style={{ height: '100%', width: `${coverage}%`, background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)', borderRadius: 4, transition: 'width 0.8s ease' }} />}
            </div>
          </div>

          {/* Charts */}
          <div className="grid-2 mb-24 gap-20">
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Ward Coverage</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Survey completion % — top 10 wards</div>
              </div>
              {activeLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h={22} radius={4} style={{ width: `${80 - i * 8}%` }} />)}
                </div>
              ) : wardData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)' }}><div style={{ fontSize: 32, marginBottom: 8 }}>📊</div><div style={{ fontSize: 13 }}>No ward data yet</div></div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={wardData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8899bb', fontSize: 11 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#8899bb', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {wardData.map((e, i) => <Cell key={i} fill={e.value >= 70 ? '#10b981' : e.value >= 45 ? '#f59e0b' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Voter Demographics</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Religion-wise distribution</div>
              </div>
              {activeLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 230 }}><Skeleton w={160} h={160} radius={80} /></div>
              ) : religionPie.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)' }}><div style={{ fontSize: 32, marginBottom: 8 }}>🥧</div><div style={{ fontSize: 13 }}>No data yet</div></div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={religionPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {religionPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => v.toLocaleString()} contentStyle={{ background: '#0c1526', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f0f4ff', fontSize: 13 }} />
                    <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, color: '#8899bb' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Gender + Quick Actions */}
          <div className="grid-2 gap-20">
            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Gender Breakdown</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Voter & survey distribution</div>
              </div>
              {activeLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton w="45%" h={12} />
                        <Skeleton w="20%" h={12} />
                      </div>
                      <Skeleton h={5} radius={3} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{item.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{(item.val || 0).toLocaleString()}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: `${item.color}12`, borderRadius: 4, padding: '1px 6px' }}>{pct}%</span>
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

            <div style={{ background: 'linear-gradient(145deg, rgba(17,28,52,0.9), rgba(10,18,35,0.95))', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Quick Actions</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Jump to key features</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { to: '/survey',  label: 'Start New Survey',        desc: 'Record constituency data', icon: '✎', color: '#f59e0b' },
                  { to: '/schemes', label: 'Check Scheme Eligibility', desc: 'Find schemes for voters',  icon: '◈', color: '#10b981' },
                  { to: '/voters',  label: 'Search Voters',            desc: 'Browse voter registry',    icon: '◉', color: '#22d3ee' },
                  { to: '/data',    label: 'View All Data',            desc: 'Survey & voter datasets',  icon: '⊟', color: '#8b5cf6' },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `${item.color}0d`;
                      e.currentTarget.style.borderColor = `${item.color}30`;
                      e.currentTarget.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.transform = 'none';
                    }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{item.desc}</div>
                    </div>
                    <span style={{ color: `${item.color}60`, fontSize: 18, flexShrink: 0 }}>›</span>
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