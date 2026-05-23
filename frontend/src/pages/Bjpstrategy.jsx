import React, { useState, useMemo, useCallback } from "react";

// ─── CORRECTED DATA from BJP_Political_Intelligence_System_CORRECTED.xlsx ────
// Key corrections applied:
// GSB: 19,817 → 40,581 | Bunt: 5,640 → 24,851 | Billava+Devadiga: 25,127 → 61,564
// Brahmin/Multi: 18,018 → 43,882 | Muslim community: 39,289 → 49,830
// Mangalorean Catholic: 34,005 → 29,755 | Christian turnout: 47.6% → 52.4%

const COMMUNITY_DATA_CORRECTED = [
  { c: "Kharvi",                total: 584,   polled: 455,   turnout: 77.9, cat: "OBC",     align: "STRONG BJP",  color: "#f59e0b" },
  { c: "Devadiga",              total: 4018,  polled: 2652,  turnout: 66.0, cat: "OBC",     align: "STRONG BJP",  color: "#f59e0b" },
  { c: "Billava+Devadiga",      total: 61564, polled: 38602, turnout: 62.7, cat: "OBC",     align: "STRONG BJP",  color: "#f59e0b", corrected: true, note: "WAS 25,127 — 2.45× undercounted" },
  { c: "GSB",                   total: 40581, polled: 24492, turnout: 60.4, cat: "GC",      align: "STRONG BJP",  color: "#fbbf24", corrected: true, note: "WAS 19,817 — 2× undercounted" },
  { c: "Brahmin/Multi-comm",    total: 43882, polled: 27029, turnout: 61.6, cat: "GC",      align: "STRONG BJP",  color: "#fbbf24", corrected: true, note: "WAS 18,018 — 2.4× undercounted" },
  { c: "Bunt+Mogaveera",        total: 31935, polled: 19734, turnout: 61.8, cat: "OBC",     align: "STRONG BJP",  color: "#f59e0b", corrected: true, note: "WAS 24,826 — label error fixed" },
  { c: "Bunt",                  total: 24851, polled: 15263, turnout: 61.4, cat: "GC",      align: "STRONG BJP",  color: "#fbbf24", corrected: true, note: "WAS 5,640 — 4.4× undercounted" },
  { c: "Mogaveera",             total: 7084,  polled: 4464,  turnout: 63.0, cat: "OBC",     align: "MOSTLY BJP",  color: "#f59e0b", corrected: true, note: "WAS 11,837 — overstated" },
  { c: "Vishwakarma/GSB",       total: 4148,  polled: 2656,  turnout: 64.0, cat: "OBC",     align: "MOSTLY BJP",  color: "#fbbf24", corrected: true, note: "WAS 2,671 — 55% larger" },
  { c: "Vokkaliga",             total: 1639,  polled: 920,   turnout: 56.1, cat: "OBC",     align: "SPLIT",       color: "#94a3b8", corrected: true, note: "WAS 2,976 — overstated" },
  { c: "Mangalorean Catholic",  total: 29755, polled: 16062, turnout: 54.0, cat: "Minority",align: "SWING",       color: "#60a5fa", corrected: true, note: "WAS 34,005 — overstated; turnout 53.4%→54%" },
  { c: "Muslim",                total: 49830, polled: 24936, turnout: 50.0, cat: "Minority",align: "OPPOSITION",  color: "#34d399", corrected: true, note: "WAS 39,289 — 10,541 missed" },
  { c: "Unclassified",          total: 12518, polled: 6522,  turnout: 52.1, cat: "Unknown", align: "UNKNOWN",     color: "#64748b", corrected: true, note: "WAS 25,254 — overstated" },
];

const RELIGION_DATA = [
  { religion: "Hindu",    total: 160051, polled: 97317, turnout: 60.8, bjp: "85–90% strong wards", note: "DECISIVE — BJP BASE", color: "#f59e0b" },
  { religion: "Muslim",   total: 45074,  polled: 22487, turnout: 49.9, bjp: "2–5% swing possible",  note: "OPPOSITION BLOC",   color: "#34d399" },
  { religion: "Christian",total: 41835,  polled: 21903, turnout: 52.4, bjp: "Varies 30–70%",         note: "KEY SWING — CORRECTED 47.6%→52.4%", color: "#60a5fa", corrected: true },
];

const WARDS = [
  { w:28, n:"Mannagudda",      cls:"BJP STRONGHOLD",       poll:54.8,bjp:93.7,hindu:93.7,muslim:1.1, chr:5.2,  blo:53.78,wsi:70.0,margin:87.4,  priority:"CRITICAL", trend:"↑ Strong",   electors:8102,  prediction:"BJP WIN — TURNOUT RISK",    why:"Highest Hindu density (93.7%), Bunt-Mogaveera belt solidly behind BJP.",          gap:"54.8% turnout — ~3,800 BJP voters not reaching booths.",                       action:"Deploy women's shakhas; door-to-door 2 weeks before; youth voter reg drive" },
  { w:29, n:"Kambala",         cls:"BJP STRONGHOLD",       poll:57.9,bjp:92.6,hindu:92.6,muslim:1.8, chr:5.6,  blo:57.64,wsi:71.3,margin:85.2,  priority:"HIGH",     trend:"↑ Dominant", electors:4517,  prediction:"BJP WIN — TURNOUT CRITICAL", why:"High Bunt density. RSS/VHP network strong. Uncontested territory.",               gap:"57.9% leaves ~1,800 votes on table. Office inactive between elections.",        action:"Activate booth committee daily log; cultural event calendar" },
  { w:41, n:"Central",         cls:"BJP STRONGHOLD",       poll:59.3,bjp:90.4,hindu:90.4,muslim:7.6, chr:2.0,  blo:63.43,wsi:73.0,margin:80.8,  priority:"MEDIUM",   trend:"↑ Very strong",electors:4882, prediction:"BJP WIN — COMPLACENCY RISK", why:"GSB+Brahmin upper-caste bloc. Business community economic alignment.",            gap:"BLO only 63%. NRI voters unreachable. 7.6% Muslim unaddressed.",               action:"NRI contact register; business associations; include 1 Muslim face" },
  { w:27, n:"Boloor",          cls:"BJP STRONGHOLD",       poll:50.8,bjp:87.5,hindu:87.5,muslim:1.2, chr:11.3, blo:60.61,wsi:66.5,margin:75.0,  priority:"MEDIUM",   trend:"↑ Gained",   electors:6618,  prediction:"BJP WIN — TURNOUT CRITICAL", why:"Lowest turnout in stronghold (50.8%). Billava OBC community solid.",              gap:"CRITICAL: 50.8% is dangerously low. ~5,400 BJP voters at home.",               action:"URGENT: 2 volunteers/booth; Christian outreach; transport on poll day" },
  { w:32, n:"Kadri North",     cls:"BJP STRONGHOLD",       poll:54.5,bjp:86.8,hindu:86.8,muslim:0.7, chr:12.5, blo:56.55,wsi:68.2,margin:73.6,  priority:"HIGH",     trend:"→ Stable",   electors:6433,  prediction:"BJP WIN — TURNOUT WATCH",    why:"Temple belt ward. RSS shakha very active. 12.5% Christian uncaptured.",          gap:"Only 56.5% BLO mapped. Youth 18-22 unregistered.",                             action:"First-time voter reg (18-22); Christian youth sports/social events" },
  { w:42, n:"Dongarkery",      cls:"BJP STRONGHOLD",       poll:58.4,bjp:86.2,hindu:86.2,muslim:12.0,chr:1.8,  blo:57.45,wsi:68.6,margin:72.4,  priority:"HIGH",     trend:"↑ Gained",   electors:7664,  prediction:"BJP WIN — STABLE",           why:"Strong OBC Hindutva ward. Muslim 12% votes Congress solidly.",                    gap:"Muslim anti-incumbency if BJP ward member absent. No youth wing.",              action:"Visible BJP ward presence; address road/drainage; prevent narrative" },
  { w:21, n:"Padav West",      cls:"BJP STRONGHOLD",       poll:55.7,bjp:84.1,hindu:84.1,muslim:1.0, chr:14.8, blo:58.95,wsi:66.7,margin:68.2,  priority:"MEDIUM",   trend:"→ Stable",   electors:7542,  prediction:"BJP WIN — TURNOUT WATCH",    why:"Classic BJP ward. Billava OBC base loyal. 14.8% Christian soft support.",        gap:"55.7% — low given 84% Hindu base. Many progeny migrant workers.",              action:"Verify migrant status; mobilise Christians; Padav Dussehra sponsorship" },
  { w:24, n:"Derebail South",  cls:"BJP STRONGHOLD",       poll:58.1,bjp:80.1,hindu:80.1,muslim:2.5, chr:17.4, blo:54.67,wsi:64.3,margin:60.2,  priority:"CRITICAL", trend:"↓ Eroding",  electors:4767,  prediction:"BJP WIN — CHRISTIAN EROSION",why:"Christian community (17.4%) swinging to Congress. Low BLO mapping.",             gap:"BLO only 54.67%. Christians courted by Congress. Billava factions.",           action:"Resolve Billava issues; parallel survey; Christian welfare outreach" },
  { w:31, n:"Bejai",           cls:"BJP STRONG",           poll:58.7,bjp:68.6,hindu:68.6,muslim:4.7, chr:26.7, blo:52.54,wsi:61.3,margin:37.2,  priority:"HIGH",     trend:"→ Fluctuating",electors:7246, prediction:"BJP WIN — CHRISTIAN SWING",  why:"Christian vote (26.7%) is decisive swing. When Christians vote BJP wins big.",   gap:"Christian community alienated post-2018. Women turnout lower.",                action:"Christian community liaison; identify specific grievance; female worker/booth" },
  { w:46, n:"Cantonment",      cls:"BJP STRONG",           poll:51.2,bjp:73.8,hindu:73.8,muslim:20.7,chr:5.5,  blo:56.25,wsi:60.5,margin:47.6,  priority:"HIGH",     trend:"→ Stable",   electors:4095,  prediction:"BJP WIN — TURNOUT WATCH",    why:"Army/govt servants — split vote. 20.7% Muslim votes Congress solidly.",         gap:"Military community often not on rolls. Only 56.25% BLO coverage.",            action:"Military voter reg drive; engage Muslim moderates; increase BLO" },
  { w:25, n:"Derebail West",   cls:"BJP STRONGHOLD",       poll:65.9,bjp:85.1,hindu:85.1,muslim:0.8, chr:14.1, blo:59.87,wsi:75.3,margin:70.2,  priority:"NORMAL",   trend:"↑ Consistent",electors:7314, prediction:"BJP WIN — COMFORTABLE",      why:"Highest turnout stronghold (65.9%). Billava OBC highly organised. Model ward.", gap:"BLO 59.87% despite good turnout — voter deletion risk.",                       action:"Maintain momentum; use as model for other wards" },
  { w:26, n:"Derebail Nairuthya",cls:"BJP STRONGHOLD",     poll:60.4,bjp:87.9,hindu:87.9,muslim:0.6, chr:11.5, blo:56.96,wsi:74.5,margin:75.8,  priority:"NORMAL",   trend:"↑ Consistent",electors:7801, prediction:"BJP WIN — COMFORTABLE",      why:"Strong Billava/Devadiga base. Low minority presence. RSS/VHP highly active.",   gap:"Progeny only 75.78%. NRI families unreachable.",                               action:"Youth wing activation; connect with diaspora network" },
  { w:30, n:"Kodialbail",      cls:"BJP STRONGHOLD",       poll:62.9,bjp:80.9,hindu:80.9,muslim:1.2, chr:17.9, blo:52.89,wsi:70.4,margin:61.8,  priority:"NORMAL",   trend:"→ Stable",   electors:7871,  prediction:"BJP WIN — SAFE",             why:"Stable Hindu majority and rising turnout.",                                       gap:"BLO only 52.89%, progeny 75%.",                                               action:"BLO completion drive; Christian community welfare schemes" },
  { w:51, n:"Alape North",     cls:"BJP STRONG",           poll:63.0,bjp:68.5,hindu:68.5,muslim:1.4, chr:30.0, blo:57.28,wsi:64.6,margin:37.0,  priority:"NORMAL",   trend:"↑→ Stable",  electors:7200,  prediction:"BJP WIN — STABLE",           why:"Billava+GSB coastal ward; stable BJP base.",                                      gap:"Christian 30% needs engagement. Progeny 106% — audit ghost entries.",          action:"Audit progeny list; Protestant Christian outreach" },
  { w:35, n:"Padav Central",   cls:"BJP STRONG",           poll:64.9,bjp:68.3,hindu:68.3,muslim:4.6, chr:27.1, blo:56.32,wsi:64.3,margin:36.6,  priority:"NORMAL",   trend:"↑→ Stable",  electors:8462,  prediction:"BJP WIN — STABLE",           why:"Christian+Hindu mix; BJP holds with good candidate.",                             gap:"Christian 27% unpredictable.",                                                action:"Protestant outreach; maintain booth committee structure" },
  { w:37, n:"Maroli",          cls:"BJP STRONG",           poll:61.6,bjp:68.7,hindu:68.7,muslim:0.8, chr:30.5, blo:64.16,wsi:65.0,margin:37.4,  priority:"NORMAL",   trend:"→ Stable",   electors:6718,  prediction:"BJP WIN — STABLE",           why:"BJP strong with high Hindu base and great BLO coverage.",                        gap:"Christian 30.5% needs Protestant outreach.",                                  action:"Protestant Christian engagement; verify progeny list" },
  { w:54, n:"Jeppinamogaru",   cls:"BJP STRONG",           poll:61.1,bjp:71.6,hindu:71.6,muslim:7.4, chr:20.9, blo:64.09,wsi:66.0,margin:43.2,  priority:"NORMAL",   trend:"→ Stable",   electors:7266,  prediction:"BJP WIN — STABLE",           why:"BJP strong coastal ward with good BLO coverage.",                                gap:"Christian 20.9% and Muslim 7.4% need development messaging.",                 action:"Maintain BLO lead; Muslim moderate development outreach" },
  { w:58, n:"Bolar",           cls:"BJP STRONG",           poll:60.9,bjp:71.8,hindu:71.8,muslim:19.6,chr:8.6,  blo:53.20,wsi:64.5,margin:43.6,  priority:"NORMAL",   trend:"→ Stable",   electors:7107,  prediction:"BJP WIN — STABLE",           why:"BJP strong with Kharvi community support. Coastal merchant community pro-BJP.", gap:"BLO 53.2%. Muslim 19.6% consolidated against.",                               action:"Kharvi Sangha; BLO completion; merchant association linkage" },
  { w:49, n:"Kankanady",       cls:"BJP STRONG",           poll:61.4,bjp:76.1,hindu:76.1,muslim:10.8,chr:13.1, blo:57.73,wsi:67.8,margin:52.2,  priority:"NORMAL",   trend:"→ Stable",   electors:7527,  prediction:"BJP WIN — STABLE",           why:"Vokkaliga retention + Billava base. Strong BJP hold.",                            gap:"Muslim 10.8% needs development narrative.",                                   action:"Vokkaliga BJP program; maintain BLO coverage" },
  { w:57, n:"Hoige Bazar",     cls:"BJP STRONG",           poll:59.1,bjp:65.1,hindu:65.1,muslim:30.1,chr:4.8,  blo:65.88,wsi:62.6,margin:30.2,  priority:"NORMAL",   trend:"→ Holds",    electors:4320,  prediction:"BJP WIN — MUSLIM WATCH",     why:"Muslim 30.1% significant swing. Kharvi highest turnout OBC.",                    gap:"30% Muslim could flip if consolidated.",                                       action:"Merchant association; Kharvi fest; Muslim moderate outreach" },
  { w:50, n:"Alape South",     cls:"BJP STRONG",           poll:67.3,bjp:76.1,hindu:76.1,muslim:8.9, chr:15.0, blo:56.48,wsi:69.9,margin:52.2,  priority:"NORMAL",   trend:"↑→ Stable",  electors:6284,  prediction:"BJP WIN — COMFORTABLE",      why:"Billava+GSB coastal ward; stable with highest turnout.",                          gap:"Progeny 109.84% — audit ghost entries.",                                      action:"Audit progeny; maintain Billava-GSB alliance" },
  { w:33, n:"Kadri South",     cls:"BJP FAVOURABLE",       poll:57.2,bjp:63.9,hindu:63.9,muslim:5.3, chr:30.8, blo:51.09,wsi:58.4,margin:27.8,  priority:"NORMAL",   trend:"→ Moderate", electors:5843,  prediction:"BJP HOLDS — UNCERTAIN",      why:"Christian 30.8% is swing. BJP holds when Hindu vote consolidates.",              gap:"BLO 51.09% — critically low.",                                                action:"BLO completion urgently; Christian social service engagement" },
  { w:55, n:"Attavara",        cls:"BJP FAVOURABLE",       poll:62.5,bjp:62.9,hindu:62.9,muslim:24.0,chr:13.1, blo:60.02,wsi:60.4,margin:25.8,  priority:"NORMAL",   trend:"→ Moderate", electors:7856,  prediction:"BJP WIN — MODERATE",         why:"BJP favourable with good turnout.",                                               gap:"Muslim 24% needs development narrative.",                                     action:"Hindu consolidation; Muslim development outreach for 8-10% split" },
  { w:56, n:"Mangaladevi",     cls:"BJP FAVOURABLE",       poll:61.8,bjp:62.8,hindu:62.8,muslim:26.8,chr:10.5, blo:57.10,wsi:59.5,margin:25.6,  priority:"NORMAL",   trend:"→ Moderate", electors:5358,  prediction:"BJP WIN — NARROW",           why:"BJP favourable with Muslim 26.8% opposition bloc.",                              gap:"Muslim consolidation risk. BLO 57% needs improvement.",                       action:"Hindu voter turnout focus; BLO completion" },
  { w:36, n:"Padav East",      cls:"BJP FAVOURABLE",       poll:46.9,bjp:60.2,hindu:60.2,muslim:3.9, chr:35.9, blo:52.81,wsi:52.7,margin:20.4,  priority:"MEDIUM",   trend:"↓ Declining",electors:4471,  prediction:"BJP HOLDS — FRAGILE",        why:"Highest Christian population (35.9%) of any BJP ward. Swing ward.",              gap:"46.9% LOWEST turnout. No BJP presence in Christian pockets.",                 action:"Permanent community service in Christian pocket; welfare scheme" },
  { w:40, n:"Court",           cls:"CONTESTED (BJP Lean)", poll:39.5,bjp:51.0,hindu:51.0,muslim:27.7,chr:21.4, blo:44.77,wsi:46.5,margin:2.0,   priority:"MEDIUM",   trend:"↓ Declining",electors:5980,  prediction:"TOSS-UP — TURNOUT DECISIVE", why:"Very low turnout (39.5%). Muslim+Christian nearly outnumber Hindu.",              gap:"39.5% catastrophically low. Muslim+Christian > Hindu.",                        action:"Hyper-focus Hindu mobilisation; 3 volunteers/booth" },
  { w:34, n:"Shivabagh",       cls:"CONTESTED (BJP Lean)", poll:50.2,bjp:52.2,hindu:52.2,muslim:11.7,chr:36.1, blo:53.38,wsi:50.2,margin:4.4,   priority:"MEDIUM",   trend:"↓ Lost 2023",electors:6294,  prediction:"TOSS-UP — CHRISTIAN FACTOR", why:"Christian majority ward. Catholic church mobilises against BJP.",                 gap:"98% progeny but only 53% BLO — ghost voters.",                               action:"Find respected Catholic BJP supporter; Christian welfare narrative" },
  { w:59, n:"Jeppu",           cls:"CONTESTED (BJP Lean)", poll:57.3,bjp:52.4,hindu:52.4,muslim:18.7,chr:29.0, blo:57.05,wsi:52.8,margin:4.8,   priority:"MEDIUM",   trend:"→ Marginal", electors:7711,  prediction:"TOSS-UP — CANDIDATE KEY",    why:"Three-religion ward. BJP wins only when Hindu consolidates AND Christians cross-vote.", gap:"97% progeny — many duplicates. Muslim+Christian = 47.7%.",             action:"Audit progeny; cross-community candidate; visible development" },
  { w:48, n:"Valencia",        cls:"CONTESTED (BJP Lean)", poll:49.2,bjp:53.6,hindu:53.6,muslim:11.5,chr:34.9, blo:57.89,wsi:49.3,margin:7.2,   priority:"MEDIUM",   trend:"↓ Eroding",  electors:5090,  prediction:"TOSS-UP — FRAGILE",          why:"Christian 35% + Muslim 11.5% = 46.4% opposition bloc.",                         gap:"49.2% — if turnout rises, BJP loses.",                                        action:"Ensure Hindu voters turnout >65%; ward-specific welfare for Christians" },
  { w:53, n:"Bajal",           cls:"CONTESTED (Cong Lean)",poll:55.1,bjp:47.8,hindu:47.8,muslim:45.2,chr:7.1,  blo:59.30,wsi:48.2,margin:-4.4,  priority:"NORMAL",   trend:"→↑ Improving",electors:7805, prediction:"CONGRESS LEAN — OPPORTUNITY",why:"Muslim 45% but JDS/BJP splitting Congress. BJP gaining.",                        gap:"Muslim 45.2% near majority.",                                                 action:"Muslim moderate outreach on development; maintain Hindu base" },
  { w:45, n:"Port",            cls:"CONTESTED (Cong Lean)",poll:63.8,bjp:47.6,hindu:47.6,muslim:40.9,chr:11.4, blo:62.19,wsi:51.0,margin:-4.8,  priority:"NORMAL",   trend:"→↑ Improving",electors:7153, prediction:"CONGRESS LEAN — BJP GAINING",why:"Port area development narrative working for BJP.",                               gap:"Muslim+Christian = 52.3% opposition bloc.",                                   action:"Port modernisation; Muslim moderate development outreach" },
  { w:52, n:"Kannur",          cls:"CONGRESS FAVOURABLE",  poll:61.2,bjp:40.1,hindu:40.1,muslim:56.9,chr:3.0,  blo:58.83,wsi:45.4,margin:-19.8, priority:"NORMAL",   trend:"→ Congress", electors:7045,  prediction:"CONGRESS WIN — FIGHT FOR 2ND",why:"Muslim majority stable Congress vote.",                                          gap:"Muslim 56.9% near total Congress. No BJP presence.",                          action:"Limit damage; cultivate Hindu community leaders" },
  { w:47, n:"Milagress",       cls:"CONGRESS FAVOURABLE",  poll:55.0,bjp:43.5,hindu:43.5,muslim:34.8,chr:21.8, blo:54.15,wsi:44.2,margin:-13.0, priority:"NORMAL",   trend:"→ Congress", electors:7210,  prediction:"CONGRESS WIN — REDUCE MARGIN",why:"Muslim+Christian = 56.6% opposition bloc.",                                     gap:"Hindu 43.5% unorganised. BLO 54.15%.",                                        action:"Limit damage; Hindu community welfare; reduce loss margin <20%" },
  { w:38, n:"Bendoor",         cls:"CONGRESS STRONG",      poll:52.1,bjp:32.2,hindu:32.2,muslim:25.2,chr:42.6, blo:59.41,wsi:38.6,margin:-35.6, priority:"WATCH",    trend:"→ Cong",     electors:6296,  prediction:"CONGRESS WIN — WATCH",        why:"Catholic + Muslim supermajority. Congress territory.",                            gap:"Zero BJP ward committee. Party workers demoralised.",                         action:"Damage limitation; credible local candidate; reduce margin <25%" },
  { w:60, n:"Bengre",          cls:"CONGRESS STRONG",      poll:41.6,bjp:30.9,hindu:30.9,muslim:68.3,chr:0.8,  blo:60.39,wsi:38.4,margin:-38.2, priority:"WATCH",    trend:"→ Cong fort", electors:10897, prediction:"CONGRESS WIN — WATCH",       why:"Muslim supermajority (68.3%). IUML territory.",                                  gap:"Lowest turnout (41.6%). BJP presence zero.",                                  action:"Long-term: cultivate Hindu leaders; accept loss, minimise margin" },
  { w:44, n:"Bunder",          cls:"CONGRESS STRONG",      poll:58.0,bjp:34.6,hindu:34.6,muslim:65.1,chr:0.3,  blo:54.60,wsi:39.6,margin:-30.8, priority:"NORMAL",   trend:"→ Congress", electors:5871,  prediction:"CONGRESS WIN",               why:"Muslim majority Congress ward.",                                                  gap:"Muslim 65.1% near total Congress dominance.",                                action:"Limit damage; Muslim business development; Hindu community welfare" },
  { w:39, n:"Falnir",          cls:"CONGRESS STRONG",      poll:56.3,bjp:32.1,hindu:32.1,muslim:9.2, chr:58.7, blo:60.47,wsi:38.3,margin:-35.8, priority:"NORMAL",   trend:"→ Congress", electors:6526,  prediction:"CONGRESS WIN",               why:"Christian majority (58.7%) strongly Congress.",                                  gap:"Christian 58.7% highly organised for Congress.",                             action:"Limit damage; Christian welfare narrative" },
  { w:43, n:"Kudroli",         cls:"CONGRESS STRONG",      poll:62.1,bjp:28.8,hindu:28.8,muslim:68.2,chr:3.0,  blo:53.24,wsi:36.3,margin:-42.4, priority:"NORMAL",   trend:"→ Congress", electors:5765,  prediction:"CONGRESS WIN",               why:"Muslim supermajority. Lowest BJP projection.",                                    gap:"Muslim 68.2% total Congress.",                                                action:"Limit damage; minimum resources; focus elsewhere" },
];

const CORRECTION_LOG = [
  { field:"Christian Turnout%",    old:"47.6%",  new:"52.4%",  impact:"Christians more active — BJP must INTERCEPT, not just mobilise" },
  { field:"GSB Total Voters",      old:"19,817", new:"40,581", impact:"CRITICAL: GSB is 2× larger — biggest GC community fix" },
  { field:"Billava+Devadiga Total",old:"25,127", new:"61,564", impact:"CRITICAL: Most impactful — 60% undercounted. Billava alone=59,339" },
  { field:"Bunt Total Voters",     old:"5,640",  new:"24,851", impact:"CRITICAL: Bunt 4.4× understated — leadership community massively undercounted" },
  { field:"Muslim Community",      old:"39,289", new:"49,830", impact:"Muslim undercounted by 10,541 — opposition base larger than assumed" },
  { field:"Brahmin/Multi-comm",    old:"18,018", new:"43,882", impact:"BJP Brahmin base 2.4× larger than modelled" },
  { field:"Mangalorean Catholic",  old:"34,005", new:"29,755", impact:"Catholic overstated — swing pool = 13,693 not 15,863" },
  { field:"Vokkaliga Total",       old:"2,976",  new:"1,639",  impact:"Vokkaliga overstated — minor JDS swing adjustment" },
  { field:"Mogaveera Total",       old:"11,837", new:"7,084",  impact:"Overstated — fishing community strategy needs recalibration" },
  { field:"M4 Muslim Formula",     old:"45,74 × 0.08", new:"45,074 × 0.08 = 3,606", impact:"Comma error overstated Muslim penetration base by 26×" },
];

const SCENARIOS = [
  { label:"A — Status Quo",    prob:58, color:"#f59e0b", desc:"BJP wins by narrow margin. Risk of loss if turnout drops 3%." },
  { label:"B — Full Mobilise", prob:74, color:"#10b981", desc:"+8,500 votes from turnout + Christian swing + SIR completion." },
  { label:"C — Perfect Exec.", prob:86, color:"#22d3ee", desc:"Full OBC + Christian 45% + turnout 67%. Dominant win." },
];

const INSIGHTS = [
  { n:1, sev:"CRITICAL", title:"Low Turnout = BJP's #1 Enemy", msg:"In 8 BJP strongholds, turnout below 58%. At 66%, BJP gains +8,500 votes — more than winning margin.", action:"MOBILISE: Transport, booth agents, 72-hr voter contact", color:"#ef4444" },
  { n:2, sev:"HIGH",     title:"Christian Vote is the Swing Decider", msg:"41,835 Christians at 52.4% turnout (corrected). BJP gets ~38%. At 45% in 6 swing wards: +2,800 votes — flips 3 wards.", action:"PENETRATE: Year-round service, welfare scheme, credible candidate", color:"#f97316" },
  { n:3, sev:"CRITICAL", title:"105,000 Non-Voters — Largest Untapped Base", msg:"105,253 didn't vote in 2023. At BJP's 56% share = 59,000 potential votes LEFT HOME.", action:"MOBILISE: SIR completion, transport, booth committee activation", color:"#ef4444" },
  { n:4, sev:"HIGH",     title:"Billava+Devadiga: 2.4× Larger Than Modelled", msg:"CORRECTED: 25,127 → 61,564 voters. This is BJP's most critical OBC base. Previous strategy severely underplanned.", action:"CONSOLIDATE: Emergency Billava Sangha convention + welfare scheme", color:"#f97316" },
  { n:5, sev:"HIGH",     title:"GSB Voters 2× Larger: 19K → 40K", msg:"CORRECTED: GSB base is 40,581 — previously halved. 16,089 GSB non-voters. Biggest GC mobilisation potential.", action:"CONSOLIDATE: GSB Sabha cultural events; temple programmes", color:"#f97316" },
  { n:6, sev:"CRITICAL", title:"Boloor — Most Critical, 50.8% Turnout", msg:"87.5% BJP projection but only 50.8% turnout. ~5,400 BJP voters at home. This stronghold could FLIP.", action:"URGENT: Emergency mobilisation in Boloor — top priority", color:"#ef4444" },
  { n:7, sev:"MEDIUM",   title:"Muslim Base Larger: 39K → 49K", msg:"CORRECTED: Muslim community = 49,830 (not 39,289). Opposition base is 27% larger than assumed. M4 formula target corrected to 3,606.", action:"RECALIBRATE: Development narrative + contested ward micro-penetration", color:"#fbbf24" },
  { n:8, sev:"MEDIUM",   title:"Bunt Voters 4.4× Undercounted: 5K → 24K", msg:"CORRECTED: Bunt = 24,851 (not 5,640). Massive uplift in BJP's core leadership community data.", action:"CONSOLIDATE: Bunt-Mogaveera unity convention with MLA+candidate", color:"#fbbf24" },
];

// ─── Utility ──────────────────────────────────────────────────────────────────
const clsCfg = (cls) => {
  if (cls.includes("STRONGHOLD"))                              return { c:"#f97316", bg:"rgba(249,115,22,0.15)",  label:"STRONGHOLD" };
  if (cls.includes("BJP STRONG") && !cls.includes("FAVOUR"))  return { c:"#fbbf24", bg:"rgba(251,191,36,0.12)",  label:"STRONG" };
  if (cls.includes("FAVOUR"))                                  return { c:"#4ade80", bg:"rgba(74,222,128,0.1)",   label:"FAVOURABLE" };
  if (cls.includes("CONTESTED") && cls.includes("BJP Lean"))  return { c:"#60a5fa", bg:"rgba(96,165,250,0.1)",   label:"CONTESTED" };
  if (cls.includes("Cong Lean"))                              return { c:"#a78bfa", bg:"rgba(167,139,250,0.12)", label:"CONG LEAN" };
  if (cls.includes("CONGRESS FAVOURABLE"))                    return { c:"#c084fc", bg:"rgba(192,132,252,0.12)", label:"CONG FVBL" };
  return { c:"#f43f5e", bg:"rgba(244,63,94,0.12)",  label:"CONG STRONG" };
};
const prioColor = (p) =>
  p==="CRITICAL"?"#ef4444":p==="HIGH"?"#f97316":p==="MEDIUM"?"#fbbf24":p==="WATCH"?"#22d3ee":"#475569";

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"dashboard",    label:"Dashboard",     icon:"⚡" },
  { id:"heatmap",      label:"Ward Heatmap",  icon:"🗺" },
  { id:"corrections",  label:"Corrections",   icon:"🔧" },
  { id:"community",    label:"Community",     icon:"👥" },
  { id:"drilldown",    label:"Ward Table",    icon:"📋" },
  { id:"insights",     label:"Top Insights",  icon:"🏆" },
  { id:"strategy",     label:"Strategy",      icon:"🎯" },
  { id:"simulator",    label:"Simulator",     icon:"⚙" },
];

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color="#f97316", corrected }) {
  return (
    <div style={{
      background:"rgba(255,255,255,0.03)", border:`1px solid ${corrected?"rgba(34,211,238,0.3)":"rgba(255,255,255,0.08)"}`,
      borderRadius:12, padding:"14px 16px", position:"relative",
    }}>
      {corrected && (
        <div style={{position:"absolute",top:8,right:8,fontSize:9,fontWeight:800,color:"#22d3ee",background:"rgba(34,211,238,0.15)",padding:"2px 6px",borderRadius:4}}>CORRECTED</div>
      )}
      <div style={{fontSize:10,color:"#64748b",marginBottom:5,fontWeight:600,letterSpacing:0.3}}>{label}</div>
      <div style={{fontSize:22,fontWeight:900,color,lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:10,color:"#475569",marginTop:4}}>{sub}</div>}
    </div>
  );
}

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
function DashboardTab() {
  const totalElectors = WARDS.reduce((s,w)=>s+w.electors,0);
  const bjpWards  = WARDS.filter(w=>w.cls.includes("BJP")).length;
  const congWards = WARDS.filter(w=>w.cls.includes("CONGRESS")).length;
  const contested = WARDS.filter(w=>w.cls.includes("CONTESTED")).length;
  const criticalWards = WARDS.filter(w=>w.priority==="CRITICAL").length;
  const avgPoll = (WARDS.reduce((s,w)=>s+w.poll,0)/WARDS.length).toFixed(1);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        <StatCard label="Total Registered Voters" value="2,46,960" sub="2025 voter list" color="#60a5fa"/>
        <StatCard label="Polled 2023" value="1,41,707" sub="57.4% constituency avg" color="#4ade80"/>
        <StatCard label="Non-Polled — TARGET POOL" value="1,05,253" sub="42.6% didn't vote" color="#ef4444"/>
        <StatCard label="BJP Wards" value={bjpWards} sub={`Strongholds + Strong + Favourable`} color="#f97316"/>
        <StatCard label="Congress Wards" value={congWards} sub="Strong + Favourable" color="#f43f5e"/>
        <StatCard label="Contested Wards" value={contested} sub="BJP Lean + Cong Lean" color="#fbbf24"/>
      </div>

      {/* Correction banner */}
      <div style={{background:"rgba(34,211,238,0.06)",border:"1px solid rgba(34,211,238,0.25)",borderRadius:12,padding:"12px 16px"}}>
        <div style={{fontSize:11,fontWeight:800,color:"#22d3ee",marginBottom:8}}>🔧 DATA CORRECTIONS APPLIED FROM CORRECTED.XLSX — 15 ERRORS FIXED</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
          {[
            "GSB: 19,817 → 40,581 (2× larger)",
            "Billava+Devadiga: 25,127 → 61,564 (2.45× larger)",
            "Bunt: 5,640 → 24,851 (4.4× larger)",
            "Brahmin/Multi-comm: 18,018 → 43,882",
            "Muslim community: 39,289 → 49,830",
            "Christian turnout: 47.6% → 52.4%",
            "Mangalorean Catholic: 34,005 → 29,755",
            "M4 formula typo fixed: 3,606 (not 185,920)",
          ].map((s,i)=>(
            <div key={i} style={{fontSize:10,color:"#67e8f9",display:"flex",gap:6}}>
              <span style={{color:"#22d3ee"}}>✓</span>{s}
            </div>
          ))}
        </div>
      </div>

      {/* Ward classification visual */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:12}}>Ward Classification — 38 Wards</div>
        <div style={{display:"flex",gap:3,height:36,borderRadius:8,overflow:"hidden"}}>
          {[
            { cls:"BJP STRONGHOLD", count:10, color:"#f97316" },
            { cls:"BJP STRONG",     count:11, color:"#fbbf24" },
            { cls:"BJP FAVOURABLE", count:3,  color:"#4ade80" },
            { cls:"CONTESTED",      count:6,  color:"#60a5fa" },
            { cls:"CONG FAVBL",     count:2,  color:"#a78bfa" },
            { cls:"CONG STRONG",    count:6,  color:"#f43f5e" },
          ].map(b=>(
            <div key={b.cls} style={{flex:b.count,background:b.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#000",transition:"flex 0.4s"}}
              title={`${b.cls}: ${b.count} wards`}>
              {b.count}
            </div>
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px 16px",marginTop:8}}>
          {[["#f97316","BJP Stronghold (10)"],["#fbbf24","BJP Strong (11)"],["#4ade80","BJP Favourable (3)"],["#60a5fa","Contested (6)"],["#a78bfa","Cong Favbl (2)"],["#f43f5e","Cong Strong (6)"]].map(([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#64748b"}}>
              <span style={{width:10,height:10,borderRadius:2,background:c,display:"inline-block"}}/>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* CORRECTED community sizes */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:12}}>✅ CORRECTED Community Voter Sizes (BJP OBC+GC Base)</div>
        {[
          { c:"Billava+Devadiga", old:25127, new:61564, color:"#f97316" },
          { c:"Brahmin/Multi-comm",old:18018,new:43882, color:"#fbbf24" },
          { c:"GSB",              old:19817, new:40581, color:"#fbbf24" },
          { c:"Bunt+Mogaveera",   old:24826, new:31935, color:"#f59e0b" },
          { c:"Bunt",             old:5640,  new:24851, color:"#f97316" },
        ].map(r=>(
          <div key={r.c} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}>
              <span style={{color:"#e2e8f0",fontWeight:600}}>{r.c}</span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:"#ef4444",textDecoration:"line-through",fontSize:10}}>{r.old.toLocaleString()}</span>
                <span style={{color:r.color,fontWeight:700}}>{r.new.toLocaleString()}</span>
              </div>
            </div>
            <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min(100,(r.new/70000)*100)}%`,background:r.color,borderRadius:3}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Summary scenarios */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {SCENARIOS.map(s=>(
          <div key={s.label} style={{background:`${s.color}10`,border:`1px solid ${s.color}33`,borderRadius:12,padding:14}}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:28,fontWeight:900,color:s.color,lineHeight:1}}>{s.prob}%</div>
            <div style={{fontSize:10,color:"#64748b",marginTop:6}}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HEATMAP TAB ──────────────────────────────────────────────────────────────
function HeatmapTab() {
  const [filter,    setFilter]    = useState("ALL");
  const [expanded,  setExpanded]  = useState(null);
  const [sortKey,   setSortKey]   = useState("wsi");

  const filters = ["ALL","STRONGHOLD","STRONG","FAVOURABLE","CONTESTED","WATCH"];
  const filtered = WARDS.filter(w => {
    if (filter==="ALL") return true;
    if (filter==="STRONGHOLD") return w.cls.includes("STRONGHOLD");
    if (filter==="STRONG")     return w.cls==="BJP STRONG";
    if (filter==="FAVOURABLE") return w.cls.includes("FAVOUR");
    if (filter==="CONTESTED")  return w.cls.includes("CONTESTED");
    if (filter==="WATCH")      return w.priority==="WATCH";
    return true;
  }).sort((a,b)=>b[sortKey]-a[sortKey]);

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {filters.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:"5px 12px",borderRadius:20,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,
              background:filter===f?"rgba(249,115,22,0.3)":"rgba(255,255,255,0.05)",
              color:filter===f?"#f97316":"#64748b",outline:filter===f?"1px solid rgba(249,115,22,0.5)":"1px solid transparent",
            }}>{f} {f!=="ALL"?`(${WARDS.filter(w=>{ if(f==="STRONGHOLD")return w.cls.includes("STRONGHOLD"); if(f==="STRONG")return w.cls==="BJP STRONG"; if(f==="FAVOURABLE")return w.cls.includes("FAVOUR"); if(f==="CONTESTED")return w.cls.includes("CONTESTED"); if(f==="WATCH")return w.priority==="WATCH"; return true;}).length})`:""}</button>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:10,color:"#64748b"}}>Sort:</span>
          {[["wsi","WSI"],["poll","Poll%"],["bjp","BJP%"],["margin","Margin"]].map(([k,l])=>(
            <button key={k} onClick={()=>setSortKey(k)} style={{padding:"3px 8px",borderRadius:6,border:"none",cursor:"pointer",fontSize:10,background:sortKey===k?"rgba(251,191,36,0.2)":"rgba(255,255,255,0.04)",color:sortKey===k?"#fbbf24":"#64748b"}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:8}}>
        {filtered.map(w=>{
          const cfg = clsCfg(w.cls);
          const isOpen = expanded===w.w;
          return (
            <div key={w.w}
              onClick={()=>setExpanded(isOpen?null:w.w)}
              style={{
                background:isOpen?cfg.bg:"rgba(255,255,255,0.025)",
                border:`1px solid ${isOpen?cfg.c+"80":"rgba(255,255,255,0.07)"}`,
                borderRadius:14,padding:"12px 14px",cursor:"pointer",
                transition:"all 0.2s",boxShadow:isOpen?`0 4px 20px ${cfg.c}20`:"none",
              }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:cfg.c}}>W{w.w} · {w.n}</div>
                  <div style={{fontSize:9,color:"#475569"}}>{w.electors.toLocaleString()} electors</div>
                </div>
                <span style={{fontSize:8,fontWeight:800,padding:"2px 6px",borderRadius:4,background:cfg.bg,color:cfg.c,border:`1px solid ${cfg.c}44`,whiteSpace:"nowrap"}}>{cfg.label}</span>
              </div>

              <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden",marginBottom:6}}>
                <div style={{width:`${Math.min(100,Math.abs(w.wsi))}%`,height:"100%",background:w.wsi>=65?cfg.c:w.wsi>=50?"#fbbf24":"#ef4444",borderRadius:2}}/>
              </div>

              <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
                <span style={{color:"#64748b"}}>Poll: <b style={{color:w.poll<55?"#ef4444":"#4ade80"}}>{w.poll}%</b></span>
                <span style={{color:"#64748b"}}>WSI: <b style={{color:w.wsi>=65?cfg.c:w.wsi>=50?"#fbbf24":"#ef4444"}}>{w.wsi}</b></span>
              </div>
              <div style={{fontSize:9,color:prioColor(w.priority),marginTop:4,fontWeight:700}}>
                {w.margin>=0?`+${w.margin.toFixed(0)}%`:w.margin.toFixed(0)+"%"} margin · {w.priority}
              </div>
              <div style={{fontSize:9,color:w.trend.includes("↑")?"#4ade80":w.trend.includes("↓")?"#ef4444":"#94a3b8",marginTop:2}}>{w.trend}</div>

              {isOpen && (
                <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:8}}>
                    {[
                      [`BJP ${w.bjp}%`,w.bjp>70],
                      [`H ${w.hindu}%`,w.hindu>65],
                      [`Poll ${w.poll}%`,w.poll>60],
                      [`BLO ${w.blo.toFixed(0)}%`,w.blo>57],
                    ].map(([l,ok])=>(
                      <span key={l} style={{fontSize:9,padding:"2px 6px",borderRadius:4,fontWeight:700,background:ok?"rgba(74,222,128,0.12)":"rgba(239,68,68,0.12)",color:ok?"#4ade80":"#f87171"}}>{l}</span>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginBottom:6,lineHeight:1.5}}><b style={{color:"#94a3b8"}}>WHY: </b>{w.why}</div>
                  <div style={{fontSize:10,color:"#fcd34d",marginBottom:6,lineHeight:1.5}}><b style={{color:"#94a3b8"}}>GAP: </b>{w.gap}</div>
                  <div style={{fontSize:10,color:"#6ee7b7",lineHeight:1.5}}><b style={{color:"#94a3b8"}}>ACTION: </b>{w.action}</div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:6,fontStyle:"italic"}}>{w.prediction}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CORRECTIONS TAB ─────────────────────────────────────────────────────────
function CorrectionsTab() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"rgba(34,211,238,0.06)",border:"1px solid rgba(34,211,238,0.25)",borderRadius:12,padding:"14px 16px"}}>
        <div style={{fontSize:12,fontWeight:800,color:"#22d3ee",marginBottom:4}}>🔧 15 Errors Corrected from BJP_Political_Intelligence_System_CORRECTED.xlsx</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>All corrections sourced from polled_voters_classified_v3 + non_polled_voters_classified_v3 + Voter_List_Community_Classified_FINAL. Green = corrected values.</div>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{background:"rgba(255,255,255,0.04)"}}>
              {["#","Field Corrected","Old Value ❌","New Value ✅","Strategic Impact"].map(h=>(
                <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,color:"#64748b",borderBottom:"1px solid rgba(255,255,255,0.08)",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CORRECTION_LOG.map((r,i)=>(
              <tr key={i} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
                <td style={{padding:"8px 10px",color:"#64748b",fontWeight:700}}>{i+1}</td>
                <td style={{padding:"8px 10px",color:"#e2e8f0",fontWeight:600,whiteSpace:"nowrap"}}>{r.field}</td>
                <td style={{padding:"8px 10px",color:"#f87171",textDecoration:"line-through",whiteSpace:"nowrap"}}>{r.old}</td>
                <td style={{padding:"8px 10px",color:"#4ade80",fontWeight:700,whiteSpace:"nowrap"}}>{r.new}</td>
                <td style={{padding:"8px 10px",color:"rgba(255,255,255,0.55)",fontSize:11,lineHeight:1.5}}>{r.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Before/After visual comparison */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#94a3b8",marginBottom:12}}>Before vs After — Key Community Voter Counts</div>
        {[
          { label:"Billava+Devadiga",    old:25127, new:61564, max:65000, color:"#f97316" },
          { label:"GSB",                 old:19817, new:40581, max:65000, color:"#fbbf24" },
          { label:"Brahmin/Multi-comm",  old:18018, new:43882, max:65000, color:"#fbbf24" },
          { label:"Bunt",                old:5640,  new:24851, max:65000, color:"#f97316" },
          { label:"Muslim Community",    old:39289, new:49830, max:65000, color:"#34d399" },
          { label:"Mangalorean Catholic",old:34005, new:29755, max:65000, color:"#60a5fa" },
        ].map(r=>(
          <div key={r.label} style={{marginBottom:14}}>
            <div style={{fontSize:11,color:"#e2e8f0",fontWeight:600,marginBottom:5}}>{r.label}</div>
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
              <span style={{fontSize:9,color:"#64748b",width:24}}>OLD</span>
              <div style={{flex:1,height:5,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${(r.old/r.max)*100}%`,height:"100%",background:"rgba(239,68,68,0.5)",borderRadius:2}}/>
              </div>
              <span style={{fontSize:10,color:"#ef4444",width:60,textAlign:"right",textDecoration:"line-through"}}>{r.old.toLocaleString()}</span>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:9,color:"#64748b",width:24}}>NEW</span>
              <div style={{flex:1,height:5,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${(r.new/r.max)*100}%`,height:"100%",background:r.color,borderRadius:2}}/>
              </div>
              <span style={{fontSize:10,color:r.color,width:60,textAlign:"right",fontWeight:700}}>{r.new.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMMUNITY TAB ───────────────────────────────────────────────────────────
function CommunityTab() {
  const [view, setView] = useState("caste");
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:6}}>
        {[["caste","Caste/Community"],["religion","Religion"],["gender","Gender"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{padding:"5px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:view===k?"rgba(249,115,22,0.2)":"rgba(255,255,255,0.05)",color:view===k?"#f97316":"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {view==="caste" && (
        <div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr style={{background:"rgba(255,255,255,0.04)"}}>
                  {["#","Community","Total","Polled","Non-Polled","Turnout%","Category","BJP Alignment","Note"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,color:"#64748b",borderBottom:"1px solid rgba(255,255,255,0.08)",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMMUNITY_DATA_CORRECTED.map((r,i)=>(
                  <tr key={r.c} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
                    <td style={{padding:"7px 10px",color:"#64748b",fontWeight:700}}>{i+1}</td>
                    <td style={{padding:"7px 10px",fontWeight:700}}>
                      <span style={{color:r.corrected?"#22d3ee":"#e2e8f0"}}>{r.c}</span>
                      {r.corrected && <span style={{fontSize:8,fontWeight:800,marginLeft:5,color:"#22d3ee",background:"rgba(34,211,238,0.15)",padding:"1px 4px",borderRadius:3}}>✓FIX</span>}
                    </td>
                    <td style={{padding:"7px 10px",color:"#e2e8f0",fontWeight:r.corrected?700:400}}>{r.total.toLocaleString()}</td>
                    <td style={{padding:"7px 10px",color:"#4ade80"}}>{r.polled.toLocaleString()}</td>
                    <td style={{padding:"7px 10px",color:"#f87171"}}>{(r.total-r.polled).toLocaleString()}</td>
                    <td style={{padding:"7px 10px",color:r.turnout>65?"#4ade80":r.turnout>58?"#fbbf24":"#f87171",fontWeight:700}}>{r.turnout.toFixed(1)}%</td>
                    <td style={{padding:"7px 10px",color:"#94a3b8"}}>{r.cat}</td>
                    <td style={{padding:"7px 10px",color:r.align.includes("STRONG")?"#4ade80":r.align.includes("SWING")?"#fbbf24":r.align.includes("OPP")?"#f87171":"#94a3b8",fontWeight:600,fontSize:10}}>{r.align}</td>
                    <td style={{padding:"7px 10px",color:"#475569",fontSize:9,maxWidth:200}}>{r.note||""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{fontSize:10,color:"rgba(34,211,238,0.6)",marginTop:8}}>✓FIX = value corrected from XLSX; data sourced from voter classification files</div>
        </div>
      )}

      {view==="religion" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {RELIGION_DATA.map(r=>(
            <div key={r.religion} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${r.corrected?"rgba(34,211,238,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:14}}>
              {r.corrected && <div style={{fontSize:9,fontWeight:800,color:"#22d3ee",marginBottom:6}}>✓ CORRECTED</div>}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:15,fontWeight:800,color:r.color}}>{r.religion}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{r.note}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
                {[["Total Voters",r.total.toLocaleString(),"#e2e8f0"],["Polled",r.polled.toLocaleString(),"#4ade80"],["Non-Polled",(r.total-r.polled).toLocaleString(),"#f87171"]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px"}}>
                    <div style={{fontSize:9,color:"#64748b"}}>{l}</div>
                    <div style={{fontSize:15,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{flex:1,height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden",marginRight:10}}>
                  <div style={{width:`${r.turnout}%`,height:"100%",background:r.color,borderRadius:4}}/>
                </div>
                <span style={{fontSize:13,fontWeight:800,color:r.color,minWidth:45}}>{r.turnout}%</span>
              </div>
              <div style={{fontSize:10,color:"#64748b",marginTop:6}}>BJP alignment: {r.bjp}</div>
            </div>
          ))}
        </div>
      )}

      {view==="gender" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            { rel:"Hindu",    male:76513, mT:61.0, female:83497, fT:60.7, gap:"Male>Female by 0.3%", note:"Hindu WOMEN turnout 60.7% — mobilise for +5% gain", color:"#f59e0b" },
            { rel:"Muslim",   male:22792, mT:48.6, female:22279, fT:51.2, gap:"Female>Male by 2.6%", note:"Muslim women vote MORE — Congress-aligned; intercept with welfare", color:"#34d399" },
            { rel:"Christian",male:18849, mT:50.8, female:22983, fT:53.6, gap:"Female>Male by 2.8% (CORRECTED)", note:"Christian women are SWING DRIVER — targeted welfare critical", color:"#60a5fa", corrected:true },
          ].map(g=>(
            <div key={g.rel} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${g.corrected?"rgba(34,211,238,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:14}}>
              {g.corrected && <div style={{fontSize:9,fontWeight:800,color:"#22d3ee",marginBottom:6}}>✓ CORRECTED — Turnout 47.6%→52.4%</div>}
              <div style={{fontSize:14,fontWeight:800,color:g.color,marginBottom:10}}>{g.rel}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {[["♂ Male",g.male,g.mT,"#93c5fd"],["♀ Female",g.female,g.fT,"#f0abfc"]].map(([l,v,t,c])=>(
                  <div key={l} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px"}}>
                    <div style={{fontSize:11,color:c,marginBottom:4}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>{v.toLocaleString()}</div>
                    <div style={{fontSize:13,fontWeight:800,color:t>=60?"#4ade80":t>=55?"#fbbf24":"#f87171"}}>{t}%</div>
                    <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden",marginTop:4}}>
                      <div style={{width:`${t}%`,height:"100%",background:c,borderRadius:2}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:g.color,fontWeight:700,marginBottom:4}}>{g.gap}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>{g.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WARD TABLE TAB ───────────────────────────────────────────────────────────
function WardTableTab() {
  const [sortKey, setSortKey] = useState("wsi");
  const [sortDir, setSortDir] = useState("desc");

  const sorted = useMemo(()=>
    [...WARDS].sort((a,b)=>{
      const va=a[sortKey]??0, vb=b[sortKey]??0;
      return sortDir==="desc"?vb-va:va-vb;
    }), [sortKey,sortDir]);

  const toggleSort = useCallback((k)=>{
    if (sortKey===k) setSortDir(d=>d==="desc"?"asc":"desc");
    else { setSortKey(k); setSortDir("desc"); }
  },[sortKey]);

  const cols = [
    {k:"w",label:"W#",w:"40px"},
    {k:"n",label:"Ward",w:"130px"},
    {k:"cls",label:"Class",w:"110px"},
    {k:"poll",label:"Poll%",w:"60px"},
    {k:"bjp",label:"BJP%",w:"58px"},
    {k:"margin",label:"Margin",w:"65px"},
    {k:"hindu",label:"Hindu%",w:"60px"},
    {k:"muslim",label:"Musl%",w:"55px"},
    {k:"chr",label:"Chr%",w:"52px"},
    {k:"blo",label:"BLO%",w:"55px"},
    {k:"wsi",label:"WSI",w:"50px"},
    {k:"priority",label:"Priority",w:"75px"},
  ];

  return (
    <div>
      <div style={{fontSize:10,color:"#64748b",marginBottom:10}}>Click column headers to sort · {WARDS.length} wards total</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{background:"rgba(255,255,255,0.04)"}}>
              {cols.map(c=>(
                <th key={c.k} onClick={()=>toggleSort(c.k)} style={{
                  padding:"8px 10px",textAlign:"left",cursor:"pointer",whiteSpace:"nowrap",minWidth:c.w,
                  color:sortKey===c.k?"#fbbf24":"#64748b",fontWeight:700,fontSize:10,letterSpacing:0.3,
                  borderBottom:"1px solid rgba(255,255,255,0.08)",
                }}>
                  {c.label} {sortKey===c.k?(sortDir==="desc"?"↓":"↑"):""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((w,i)=>{
              const cfg=clsCfg(w.cls);
              return (
                <tr key={w.w} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.02)"}}>
                  <td style={{padding:"7px 10px",color:"#64748b",fontWeight:700}}>{w.w}</td>
                  <td style={{padding:"7px 10px",color:"#e2e8f0",fontWeight:600}}>{w.n}</td>
                  <td style={{padding:"7px 10px"}}>
                    <span style={{fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:4,background:cfg.bg,color:cfg.c}}>{cfg.label}</span>
                  </td>
                  <td style={{padding:"7px 10px",color:w.poll<55?"#f87171":w.poll<60?"#fbbf24":"#4ade80",fontWeight:700}}>{w.poll}%</td>
                  <td style={{padding:"7px 10px",color:cfg.c,fontWeight:700}}>{w.bjp}%</td>
                  <td style={{padding:"7px 10px",color:w.margin>=0?"#4ade80":"#f87171",fontWeight:700}}>{w.margin>=0?"+":""}{w.margin.toFixed(0)}%</td>
                  <td style={{padding:"7px 10px",color:"#fbbf24"}}>{w.hindu}%</td>
                  <td style={{padding:"7px 10px",color:"#34d399"}}>{w.muslim}%</td>
                  <td style={{padding:"7px 10px",color:"#60a5fa"}}>{w.chr}%</td>
                  <td style={{padding:"7px 10px",color:w.blo<55?"#f87171":"#94a3b8"}}>{w.blo.toFixed(1)}%</td>
                  <td style={{padding:"7px 10px",color:w.wsi>=65?cfg.c:w.wsi>=50?"#fbbf24":"#ef4444",fontWeight:700}}>{w.wsi}</td>
                  <td style={{padding:"7px 10px"}}><span style={{fontSize:9,fontWeight:800,color:prioColor(w.priority)}}>{w.priority}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── INSIGHTS TAB ─────────────────────────────────────────────────────────────
function InsightsTab() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {INSIGHTS.map(ins=>(
        <div key={ins.n} style={{
          background:"rgba(255,255,255,0.025)",border:`1px solid ${ins.color}33`,
          borderRadius:14,padding:"15px 18px",display:"flex",gap:14,alignItems:"flex-start",
          borderLeft:`4px solid ${ins.color}`,
        }}>
          <div style={{fontSize:24,fontWeight:900,color:ins.color,minWidth:36,textAlign:"center",lineHeight:1.2}}>{ins.n}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
              <div style={{fontSize:13,fontWeight:800,color:"#f1f5f9"}}>{ins.title}</div>
              <span style={{fontSize:8,fontWeight:800,padding:"2px 7px",borderRadius:4,background:`${ins.color}20`,color:ins.color}}>{ins.sev}</span>
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",marginBottom:8,lineHeight:1.7}}>{ins.msg}</div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"4px 12px"}}>
              <span style={{fontSize:11,color:"#10b981"}}>→</span>
              <span style={{fontSize:11,fontWeight:600,color:"#6ee7b7"}}>{ins.action}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── STRATEGY TAB ─────────────────────────────────────────────────────────────
function StrategyTab() {
  const pillars = [
    { p:"P1 — MOBILISE",    color:"#ef4444",
      items:["Booth activation blitz: 3 agents/booth, personal contact with 50 BJP households. Raise stronghold turnout 55%→66%.","Transport & last-mile: Book vehicles for every booth. Priority: elderly, women, migrant workers. 3-4% turnout gap from transport.","Youth voter registration: 18-22 severely underregistered. Ward-level camps. Target: 5,000 new BJP-leaning youth voters.","Women's mobilisation: 'Har Ghar BJP'. Target women turnout 64%+. Christian women (53.6%) are key swing.",] },
    { p:"P2 — CONSOLIDATE",  color:"#8b5cf6",
      items:["Billava-Devadiga Alliance: CORRECTED 61,564 voters (was 25,127). Grand rally + BJP welfare scheme. Derebail belt stronghold.","Bunt-Mogaveera Convention: CORRECTED 24,851 Bunt (was 5,640). Organise united convention with BJP MLA+candidate.","GSB Brahmin Engagement: CORRECTED 40,581 voters (was 19,817). Cultural events, GSB Sabha, temple programmes.","Kharvi Community Outreach: Highest turnout (77.9%) of any OBC. Fisheries welfare + Kharvi Sangha linkage."] },
    { p:"P3 — PENETRATE",    color:"#22d3ee",
      items:["Christian Liaison: 1 BJP worker/Christian pocket. DEVELOPMENT narrative only — not Hindutva. Focus on Shivabagh, Valencia, Bejai.","Targeted Welfare: 'Coastal Christian Fishermen Welfare Fund' + 'St. Aloysius Education Support'. BJP-aligned Catholic faces.","Catholic Youth Engagement: Sports tournaments, skill dev. Build non-political relationships first. Convert social goodwill.","Candidate Selection Rule: In wards >25% Christian, candidate MUST have cross-community appeal."] },
    { p:"P4 — INSULATE",    color:"#f59e0b",
      items:["Anti-defection vigil: Senior mentor per booth. Daily check-in 30 days before election. Prevent Congress poaching.","Counter-narrative: Ward-specific development catalogue vs Congress failure narrative. Visual posters per ward.","Muslim Moderate Outreach: NOT about winning majority — target 8-10% in Bajal, Port, Hoige Bazar. Corrected M4 target: 3,606.","Eve-of-election intelligence: 48-hr rapid reporting. Real-time Congress voter mobilisation monitoring."] },
    { p:"P5 — DOMINATE",    color:"#10b981",
      items:["'Mangaluru Model' narrative: Position as Karnataka's development capital. Port, IT Hub, Road, Safety.","Ward Micro-Manifesto: 1-page 'Ward Promise Letter' with 5 specific deliverables. Door-to-door. Creates accountability.","Social Media Saturation: WhatsApp per booth group, YouTube ward videos, Instagram reels. Target 50,000+ touchpoints.","MLA Padayatra: Each at-risk ward gets minimum 3 senior visits in final 60 days."] },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {pillars.map(pillar=>(
        <div key={pillar.p} style={{background:"rgba(255,255,255,0.025)",border:`1px solid ${pillar.color}30`,borderRadius:14,padding:14}}>
          <div style={{fontSize:13,fontWeight:800,color:pillar.color,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:4,height:20,background:pillar.color,borderRadius:2,flexShrink:0}}/>
            {pillar.p}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
            {pillar.items.map((item,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 12px",borderLeft:`3px solid ${pillar.color}60`}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",lineHeight:1.55}}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SIMULATOR TAB ────────────────────────────────────────────────────────────
function SimulatorTab() {
  const [hr, setHr] = useState(62);
  const [mr, setMr] = useState(50);
  const [cr, setCr] = useState(53);
  const [hb, setHb] = useState(90);
  const [mb, setMb] = useState(6);
  const [cb, setCb] = useState(35);
  const [selectedWards, setSelectedWards] = useState(new Set(WARDS.map(w=>w.w)));

  const sw = WARDS.filter(w=>selectedWards.has(w.w));

  const result = useMemo(()=>{
    let bjp=0, inc=0, polled=0;
    sw.forEach(w=>{
      const hv=w.electors*(w.hindu/100), mv=w.electors*(w.muslim/100), cv=w.electors*(w.chr/100);
      const hp=hv*(hr/100), mp=mv*(mr/100), cp=cv*(cr/100);
      bjp += hp*(hb/100)+mp*(mb/100)+cp*(cb/100);
      inc += hp*(1-hb/100)+mp*(1-mb/100)+cp*(1-cb/100);
      polled += hp+mp+cp;
    });
    const total=bjp+inc;
    const bp=total>0?bjp/total*100:50;
    return {bjp,inc,bp,ip:100-bp,margin:bjp-inc,polled};
  },[sw,hr,mr,cr,hb,mb,cb]);

  const verdict = result.bp>55?{t:"BJP comfortable win",c:"#4ade80"}
    :result.bp>51?{t:"BJP narrow win",c:"#60a5fa"}
    :result.bp>49?{t:"Too close to call",c:"#fbbf24"}
    :result.bp>45?{t:"INC narrow win",c:"#f59e0b"}
    :{t:"INC comfortable win",c:"#ef4444"};

  const Slider=({label,val,min,max,color,set})=>(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
        <span style={{color:"#94a3b8"}}>{label}</span>
        <span style={{fontWeight:700,color}}>{val}%</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={val} onChange={e=>set(+e.target.value)} style={{width:"100%",accentColor:color}}/>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:8}}>Ward Selection</div>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          {[["All",()=>setSelectedWards(new Set(WARDS.map(w=>w.w)))],["Clear",()=>setSelectedWards(new Set())],["BJP Only",()=>setSelectedWards(new Set(WARDS.filter(w=>w.cls.includes("BJP")).map(w=>w.w)))]].map(([l,fn])=>(
            <button key={l} onClick={fn} style={{fontSize:10,padding:"4px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#cbd5e1",cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:3,maxHeight:120,overflowY:"auto",padding:8,background:"rgba(0,0,0,0.2)",borderRadius:8}}>
          {WARDS.map(w=>(
            <label key={w.w} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:selectedWards.has(w.w)?"#e2e8f0":"#475569",cursor:"pointer"}}>
              <input type="checkbox" checked={selectedWards.has(w.w)} onChange={e=>{const s=new Set(selectedWards);e.target.checked?s.add(w.w):s.delete(w.w);setSelectedWards(s);}}/>{w.n}
            </label>
          ))}
        </div>
        <div style={{fontSize:10,color:"#64748b",marginTop:6}}>{selectedWards.size} wards · {sw.reduce((a,w)=>a+w.electors,0).toLocaleString()} voters</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:12}}>Community Poll Rates</div>
          <Slider label="Hindu turnout %" val={hr} min={30} max={95} color="#f59e0b" set={setHr}/>
          <Slider label="Muslim turnout %" val={mr} min={20} max={90} color="#34d399" set={setMr}/>
          <Slider label="Christian turnout % (corrected 52.4%)" val={cr} min={20} max={90} color="#60a5fa" set={setCr}/>
        </div>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:12}}>Partisan Vote Lean</div>
          <Slider label="% Hindu → BJP" val={hb} min={60} max={99} color="#f59e0b" set={setHb}/>
          <Slider label="% Muslim → BJP (M4 target: 3,606)" val={mb} min={1} max={25} color="#34d399" set={setMb}/>
          <Slider label="% Christian → BJP" val={cb} min={15} max={65} color="#60a5fa" set={setCb}/>
        </div>
      </div>

      <div style={{background:`${verdict.c}10`,border:`1px solid ${verdict.c}44`,borderRadius:14,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>Predicted Outcome</div>
          <span style={{fontSize:12,fontWeight:800,padding:"4px 14px",borderRadius:8,background:verdict.c+"20",color:verdict.c}}>{verdict.t}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:12}}>
          <div><div style={{fontSize:10,color:"#64748b",marginBottom:3}}>BJP projected</div>
            <div style={{fontSize:28,fontWeight:900,color:"#60a5fa"}}>{Math.round(result.bjp).toLocaleString()}</div>
            <div style={{fontSize:11,color:"#64748b"}}>{result.bp.toFixed(1)}% valid votes</div>
          </div>
          <div><div style={{fontSize:10,color:"#64748b",marginBottom:3}}>INC projected</div>
            <div style={{fontSize:28,fontWeight:900,color:"#f87171"}}>{Math.round(result.inc).toLocaleString()}</div>
            <div style={{fontSize:11,color:"#64748b"}}>{result.ip.toFixed(1)}% valid votes</div>
          </div>
        </div>
        <div style={{height:28,borderRadius:6,background:"rgba(255,255,255,0.06)",overflow:"hidden",marginBottom:8,display:"flex"}}>
          <div style={{width:`${result.bp}%`,background:"linear-gradient(90deg,#1d4ed8,#3b82f6)",transition:"width 0.4s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>BJP {result.bp.toFixed(0)}%</div>
          <div style={{flex:1,background:"linear-gradient(90deg,#991b1b,#dc2626)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>INC {result.ip.toFixed(0)}%</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#64748b"}}>
          <span>Est. polled: {Math.round(result.polled).toLocaleString()}</span>
          <span style={{color:result.margin>0?"#4ade80":"#f87171",fontWeight:700}}>
            Margin: {result.margin>0?"+":""}{Math.round(result.margin).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BJPPoliticalIntelligence() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#04080f 0%,#090e1c 50%,#06111e 100%)",
      fontFamily:'"IBM Plex Mono", "Fira Code", monospace',
      color:"#e2e8f0",
    }}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 16px"}}>

        {/* Header */}
        <div style={{
          background:"linear-gradient(135deg,rgba(15,23,42,0.95),rgba(7,15,36,0.95))",
          border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:20,
          padding:"20px 24px",
          marginBottom:16,
          boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <span style={{background:"linear-gradient(135deg,#dc2626,#7f1d1d)",color:"#fff",fontSize:9,fontWeight:900,letterSpacing:2,padding:"3px 9px",borderRadius:5}}>BJP</span>
                <span style={{fontSize:18,fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.5px"}}>Political Intelligence System</span>
                <span style={{fontSize:8,fontWeight:700,color:"#22d3ee",background:"rgba(34,211,238,0.15)",padding:"2px 7px",borderRadius:4,border:"1px solid rgba(34,211,238,0.3)"}}>DATA CORRECTED</span>
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>
                Mangaluru City South · 38 wards · 2,46,960 electors · 15 corrections applied from CORRECTED.xlsx
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[{v:21,l:"BJP wards",c:"#f97316"},{v:6,l:"Contested",c:"#fbbf24"},{v:11,l:"Cong wards",c:"#f43f5e"},{v:"58%",l:"Win probability",c:"#22d3ee"}].map(s=>(
                <div key={s.l} style={{background:`${s.c}12`,border:`1px solid ${s.c}30`,borderRadius:12,padding:"8px 14px",textAlign:"center",minWidth:64}}>
                  <div style={{fontSize:20,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{display:"flex",gap:3,overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
                padding:"6px 14px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",whiteSpace:"nowrap",flexShrink:0,
                background:activeTab===t.id?"rgba(249,115,22,0.18)":"rgba(255,255,255,0.025)",
                color:activeTab===t.id?"#f97316":"rgba(255,255,255,0.38)",
                outline:activeTab===t.id?"1px solid rgba(249,115,22,0.45)":"1px solid rgba(255,255,255,0.06)",
                transition:"all 0.2s",
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{
          background:"rgba(9,14,28,0.95)",
          border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:16,
          padding:"20px 22px",
          boxShadow:"0 16px 48px rgba(0,0,0,0.4)",
        }}>
          {activeTab==="dashboard"   && <DashboardTab/>}
          {activeTab==="heatmap"     && <HeatmapTab/>}
          {activeTab==="corrections" && <CorrectionsTab/>}
          {activeTab==="community"   && <CommunityTab/>}
          {activeTab==="drilldown"   && <WardTableTab/>}
          {activeTab==="insights"    && <InsightsTab/>}
          {activeTab==="strategy"    && <StrategyTab/>}
          {activeTab==="simulator"   && <SimulatorTab/>}
        </div>
      </div>
    </div>
  );
}