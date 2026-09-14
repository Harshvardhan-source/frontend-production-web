/**
 * sirStrategyData.js — analytics extracted from three strategic analysis
 * workbooks (AC 203 Mangalore City South): BJP SIR-mapping risk ranking
 * (25 BJP-held wards), the 5 critical wards viewed from both BJP-defense and
 * Congress-opportunity sides, booth-level targeting inside those wards, and
 * a community vote-bank/fragmentation model.
 *
 * IMPORTANT — read before displaying any number from this file: every
 * community-vote-share figure here is a user-supplied PLANNING ASSUMPTION or
 * an illustrative estimate the analysis explicitly flagged as unverified
 * (see SIR_STRATEGY_ASSUMPTIONS below) — not a measured survey result or a
 * ward/booth-level population count. The source workbooks were explicit that
 * this is a resource-allocation and turnout/persuasion planning exercise,
 * not a voter-suppression plan: nothing here recommends discouraging anyone
 * from voting, targeting a community with anything other than standard
 * GOTV/persuasion outreach, or covertly funding a third party as a spoiler.
 */

export const SIR_STRATEGY_SUMMARY = {
  bjpHeldWardsAnalysed: 25,
  totalPolledUnmappedAtRisk: 6449,
  estimatedVotesAtRisk: 1297,
  turnoutIncreaseNeededPp: 0.94,
  criticalWardCount: 5,
};

// File 4 "Ward Priority Ranking" — ALL 38 wards (supersedes the earlier
// 25-BJP-held-ward-only ranking), ordered by recommended action priority.
// Tiers 1-3 carry the same margin/risk-ratio analysis as before; Tier 4 is
// the 13 wards with no 2023 result data available, ranked by PU% only. This
// part has no religious/communal dimension — it's SIR roll-mapping status
// vs historical margin.
export const SIR_RISK_RANKING = [
  { rank: 1, ward: 33, name: 'KADRI SOUTH', tier: 1, tierLabel: 'TIER 1 — Urgent', total: 906, polledMapped: 196, polledUnmapped: 363, unpolledMapped: 99, unpolledUnmapped: 248, puPct: 40.1, category: 'BJP Medium Margin', margin2023: 643, swing20182023: -7.9, riskRatio: 0.56, flag: 'CRITICAL' },
  { rank: 2, ward: 55, name: 'ATTAVARA', tier: 1, tierLabel: 'TIER 1 — Urgent', total: 573, polledMapped: 179, polledUnmapped: 207, unpolledMapped: 76, unpolledUnmapped: 111, puPct: 36.1, category: 'BJP Narrow Margin', margin2023: 423, swing20182023: 9.7, riskRatio: 0.49, flag: 'CRITICAL' },
  { rank: 3, ward: 36, name: 'PADAVU POORVA', tier: 1, tierLabel: 'TIER 1 — Urgent', total: 261, polledMapped: 46, polledUnmapped: 96, unpolledMapped: 23, unpolledUnmapped: 96, puPct: 36.8, category: 'BJP Narrow Margin', margin2023: 206, swing20182023: 9.4, riskRatio: 0.47, flag: 'CRITICAL' },
  { rank: 4, ward: 56, name: 'MANGALADEVI', tier: 1, tierLabel: 'TIER 1 — Urgent', total: 431, polledMapped: 158, polledUnmapped: 153, unpolledMapped: 39, unpolledUnmapped: 81, puPct: 35.5, category: 'BJP Narrow Margin', margin2023: 388, swing20182023: 0.8, riskRatio: 0.39, flag: 'CRITICAL' },
  { rank: 5, ward: 57, name: 'HOIGE BAZAR', tier: 1, tierLabel: 'TIER 1 — Urgent', total: 714, polledMapped: 200, polledUnmapped: 233, unpolledMapped: 104, unpolledUnmapped: 177, puPct: 32.6, category: 'BJP Medium Margin', margin2023: 674, swing20182023: -1.2, riskRatio: 0.35, flag: 'CRITICAL' },
  { rank: 6, ward: 31, name: 'BEJAI', tier: 2, tierLabel: 'TIER 2 — High', total: 646, polledMapped: 149, polledUnmapped: 269, unpolledMapped: 71, unpolledUnmapped: 157, puPct: 41.6, category: 'BJP Medium Margin', margin2023: 937, swing20182023: 7, riskRatio: 0.29, flag: 'WATCH' },
  { rank: 7, ward: 30, name: 'KODIALBAIL', tier: 2, tierLabel: 'TIER 2 — High', total: 721, polledMapped: 142, polledUnmapped: 335, unpolledMapped: 50, unpolledUnmapped: 194, puPct: 46.5, category: 'BJP Medium Margin', margin2023: 1338, swing20182023: 6.9, riskRatio: 0.25, flag: 'WATCH' },
  { rank: 8, ward: 25, name: 'Derebail (West)', tier: 2, tierLabel: 'TIER 2 — High', total: 750, polledMapped: 180, polledUnmapped: 331, unpolledMapped: 61, unpolledUnmapped: 178, puPct: 44.1, category: 'BJP Medium Margin', margin2023: 1405, swing20182023: 14.3, riskRatio: 0.24, flag: 'WATCH' },
  { rank: 9, ward: 28, name: 'MANNAGUDDA', tier: 2, tierLabel: 'TIER 2 — High', total: 1647, polledMapped: 261, polledUnmapped: 708, unpolledMapped: 163, unpolledUnmapped: 515, puPct: 43.0, category: 'BJP Stronghold', margin2023: 2894, swing20182023: 7.2, riskRatio: 0.24, flag: 'WATCH' },
  { rank: 10, ward: 24, name: 'Derebail (South)', tier: 2, tierLabel: 'TIER 2 — High', total: 749, polledMapped: 159, polledUnmapped: 324, unpolledMapped: 64, unpolledUnmapped: 202, puPct: 43.3, category: 'BJP Medium Margin', margin2023: 1424, swing20182023: 10.4, riskRatio: 0.23, flag: 'WATCH' },
  { rank: 11, ward: 35, name: 'PADAVU CENTRAL', tier: 2, tierLabel: 'TIER 2 — High', total: 694, polledMapped: 180, polledUnmapped: 276, unpolledMapped: 70, unpolledUnmapped: 168, puPct: 39.8, category: 'BJP Medium Margin', margin2023: 1241, swing20182023: 8.1, riskRatio: 0.22, flag: 'WATCH' },
  { rank: 12, ward: 26, name: 'Derebail (South-west)', tier: 2, tierLabel: 'TIER 2 — High', total: 1096, polledMapped: 193, polledUnmapped: 517, unpolledMapped: 72, unpolledUnmapped: 314, puPct: 47.2, category: 'BJP Stronghold', margin2023: 2478, swing20182023: 14.3, riskRatio: 0.21, flag: 'WATCH' },
  { rank: 13, ward: 51, name: 'ALAPE UTTARA', tier: 2, tierLabel: 'TIER 2 — High', total: 497, polledMapped: 169, polledUnmapped: 155, unpolledMapped: 61, unpolledUnmapped: 112, puPct: 31.2, category: 'BJP Medium Margin', margin2023: 753, swing20182023: 11.6, riskRatio: 0.21, flag: 'WATCH' },
  { rank: 14, ward: 42, name: 'DONGERKERY', tier: 3, tierLabel: 'TIER 3 — Standard', total: 1040, polledMapped: 243, polledUnmapped: 404, unpolledMapped: 95, unpolledUnmapped: 298, puPct: 38.8, category: 'BJP Stronghold', margin2023: 2105, swing20182023: -1.4, riskRatio: 0.19, flag: 'STABLE' },
  { rank: 15, ward: 49, name: 'KANKANADY', tier: 3, tierLabel: 'TIER 3 — Standard', total: 652, polledMapped: 164, polledUnmapped: 253, unpolledMapped: 63, unpolledUnmapped: 172, puPct: 38.8, category: 'BJP Medium Margin', margin2023: 1343, swing20182023: 15.3, riskRatio: 0.19, flag: 'STABLE' },
  { rank: 16, ward: 27, name: 'BOLOOR', tier: 3, tierLabel: 'TIER 3 — Standard', total: 655, polledMapped: 91, polledUnmapped: 248, unpolledMapped: 95, unpolledUnmapped: 221, puPct: 37.9, category: 'BJP Stronghold', margin2023: 1637, swing20182023: 7.7, riskRatio: 0.15, flag: 'STABLE' },
  { rank: 17, ward: 29, name: 'KAMBLA', tier: 3, tierLabel: 'TIER 3 — Standard', total: 794, polledMapped: 155, polledUnmapped: 315, unpolledMapped: 87, unpolledUnmapped: 237, puPct: 39.7, category: 'BJP Stronghold', margin2023: 2122, swing20182023: 6.1, riskRatio: 0.15, flag: 'STABLE' },
  { rank: 18, ward: 37, name: 'MAROLI', tier: 3, tierLabel: 'TIER 3 — Standard', total: 450, polledMapped: 132, polledUnmapped: 158, unpolledMapped: 52, unpolledUnmapped: 108, puPct: 35.1, category: 'BJP Medium Margin', margin2023: 1137, swing20182023: 15.5, riskRatio: 0.14, flag: 'STABLE' },
  { rank: 19, ward: 46, name: 'CANTONMENT', tier: 3, tierLabel: 'TIER 3 — Standard', total: 305, polledMapped: 88, polledUnmapped: 103, unpolledMapped: 50, unpolledUnmapped: 64, puPct: 33.8, category: 'BJP Medium Margin', margin2023: 887, swing20182023: 4.6, riskRatio: 0.12, flag: 'STABLE' },
  { rank: 20, ward: 50, name: 'ALAPE DAKSHINA', tier: 3, tierLabel: 'TIER 3 — Standard', total: 470, polledMapped: 150, polledUnmapped: 172, unpolledMapped: 37, unpolledUnmapped: 111, puPct: 36.6, category: 'BJP Medium Margin', margin2023: 1440, swing20182023: 7.4, riskRatio: 0.12, flag: 'STABLE' },
  { rank: 21, ward: 41, name: 'CENTRAL', tier: 3, tierLabel: 'TIER 3 — Standard', total: 455, polledMapped: 108, polledUnmapped: 195, unpolledMapped: 34, unpolledUnmapped: 118, puPct: 42.9, category: 'BJP Stronghold', margin2023: 1771, swing20182023: 1.5, riskRatio: 0.11, flag: 'STABLE' },
  { rank: 22, ward: 58, name: 'BOLAR', tier: 3, tierLabel: 'TIER 3 — Standard', total: 330, polledMapped: 105, polledUnmapped: 124, unpolledMapped: 40, unpolledUnmapped: 61, puPct: 37.6, category: 'BJP Medium Margin', margin2023: 1078, swing20182023: 8.3, riskRatio: 0.11, flag: 'STABLE' },
  { rank: 23, ward: 21, name: 'PADAVU', tier: 3, tierLabel: 'TIER 3 — Standard', total: 640, polledMapped: 178, polledUnmapped: 217, unpolledMapped: 74, unpolledUnmapped: 171, puPct: 33.9, category: 'BJP Stronghold', margin2023: 2195, swing20182023: 3.7, riskRatio: 0.1, flag: 'STABLE' },
  { rank: 24, ward: 32, name: 'KADRI North', tier: 3, tierLabel: 'TIER 3 — Standard', total: 489, polledMapped: 102, polledUnmapped: 190, unpolledMapped: 45, unpolledUnmapped: 152, puPct: 38.9, category: 'BJP Stronghold', margin2023: 2041, swing20182023: 11.9, riskRatio: 0.09, flag: 'STABLE' },
  { rank: 25, ward: 54, name: 'JEPPINAMUGER', tier: 3, tierLabel: 'TIER 3 — Standard', total: 359, polledMapped: 137, polledUnmapped: 103, unpolledMapped: 69, unpolledUnmapped: 50, puPct: 28.7, category: 'BJP Medium Margin', margin2023: 1121, swing20182023: 1.6, riskRatio: 0.09, flag: 'STABLE' },
  { rank: 26, ward: 44, name: 'NAVAYATH', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 253, polledMapped: 44, polledUnmapped: 128, unpolledMapped: 14, unpolledUnmapped: 67, puPct: 50.6, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 27, ward: 43, name: 'KUDROLI', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 157, polledMapped: 30, polledUnmapped: 79, unpolledMapped: 11, unpolledUnmapped: 37, puPct: 50.3, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 28, ward: 47, name: 'MILAGRIS', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 625, polledMapped: 168, polledUnmapped: 256, unpolledMapped: 58, unpolledUnmapped: 143, puPct: 41.0, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 29, ward: 59, name: 'JEPPU', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 392, polledMapped: 106, polledUnmapped: 156, unpolledMapped: 35, unpolledUnmapped: 95, puPct: 39.8, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 30, ward: 38, name: 'BENDUR', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 420, polledMapped: 100, polledUnmapped: 167, unpolledMapped: 51, unpolledUnmapped: 102, puPct: 39.8, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 31, ward: 39, name: 'FALNIR', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 301, polledMapped: 78, polledUnmapped: 116, unpolledMapped: 34, unpolledUnmapped: 73, puPct: 38.5, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 32, ward: 34, name: 'SHIVBHAG', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 598, polledMapped: 138, polledUnmapped: 225, unpolledMapped: 95, unpolledUnmapped: 140, puPct: 37.6, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 33, ward: 52, name: 'KANNUR', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 203, polledMapped: 77, polledUnmapped: 73, unpolledMapped: 18, unpolledUnmapped: 35, puPct: 36.0, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 34, ward: 40, name: 'COURT', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 342, polledMapped: 64, polledUnmapped: 116, unpolledMapped: 36, unpolledUnmapped: 126, puPct: 33.9, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 35, ward: 45, name: 'PORT', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 340, polledMapped: 131, polledUnmapped: 114, unpolledMapped: 40, unpolledUnmapped: 55, puPct: 33.5, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 36, ward: 48, name: 'VALENCIA', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 356, polledMapped: 102, polledUnmapped: 94, unpolledMapped: 62, unpolledUnmapped: 98, puPct: 26.4, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 37, ward: 53, name: 'BAJAL', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 380, polledMapped: 120, polledUnmapped: 96, unpolledMapped: 82, unpolledUnmapped: 82, puPct: 25.3, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
  { rank: 38, ward: 60, name: 'BENGRE', tier: 4, tierLabel: 'TIER 4 — PU-volume only', total: 378, polledMapped: 186, polledUnmapped: 77, unpolledMapped: 52, unpolledUnmapped: 63, puPct: 20.4, category: null, margin2023: null, swing20182023: null, riskRatio: null, flag: null },
];

export const SIR_RISK_RANKING_NOTES = [
  'TIER 1 (red) — the 5 CRITICAL BJP wards: narrowest margins, resolve mapping/resubmission before roll freeze.',
  'TIER 2 (amber) — the 8 WATCH BJP wards: comfortable now, but margin/PU pool could erode that cushion.',
  'TIER 3 (green) — the 12 STABLE BJP wards: routine roll-hygiene priority, not urgent.',
  'TIER 4 (grey) — the 13 wards outside the BJP-held analysis (no 2023 result data available), ranked by PU% only.',
];

// File 3 "BJP Critical Wards" + "Congress Opportunity", refined by File 5
// ("...Revised") to separate which of the 5 critical wards actually fit the
// minority-concentration thesis vs which don't — the source analysis
// explicitly excluded Kadri South from the demographic framing rather than
// force-fitting it, since it's Hindu-majority and its swing is unexplained
// by that theory.
export const SIR_CRITICAL_WARDS = [
  { name: 'KADRI SOUTH', category: 'BJP Medium Margin', minorityTier: 'VLOW', margin2023Pct: '20.3%', margin2023Votes: 643, swing20182023: -7.9, bjpAtRiskVoters: 109, bjpVotesAtRisk: 64, bjpGotvPool: 99, bjpTurnoutIncreaseNeeded: 1.91, riskType: 'Non-demographic (local/candidate factor)', bjpAction: 'Hindu-majority ward — NOT demographic. Investigate local/candidate factors; protect SIR-mapped Hindu base via GOTV (highest turnout-increase need of the 5, 1.91pp). Do not rely on minority outreach here.', congressVotesToFlip: 644, congressNote: 'Intentionally excluded from the demographic-frontier framing — needs a separate, non-demographic explanation.' },
  { name: 'ATTAVARA', category: 'BJP Narrow Margin', minorityTier: 'EXCELLENT', margin2023Pct: '9.9%', margin2023Votes: 423, swing20182023: 9.7, bjpAtRiskVoters: 62, bjpVotesAtRisk: 34, bjpGotvPool: 76, bjpTurnoutIncreaseNeeded: 0.94, riskType: 'Demographic frontier ward', bjpAction: "Minority-concentrated ward. BJP's path is maximising turnout in its own smaller Hindu pockets and correcting SIR mapping, while Congress-SDPI vote splitting among Muslim voters works passively in BJP's favour.", congressVotesToFlip: 424, congressNote: 'Booth 242 already 73% Congress — protect/maximise turnout there. If SDPI draws ~20% of the Muslim vote ward-wide, Congress needs to win back SDPI-leaning voters or make up the gap from near-even booths (221, 222) rather than assume the full minority vote is automatically Congress\'s.' },
  { name: 'PADAVU POORVA', category: 'BJP Narrow Margin', minorityTier: 'EXCELLENT', margin2023Pct: '7.5%', margin2023Votes: 206, swing20182023: 9.4, bjpAtRiskVoters: 29, bjpVotesAtRisk: 15, bjpGotvPool: 23, bjpTurnoutIncreaseNeeded: 0.55, riskType: 'Demographic frontier ward', bjpAction: 'Minority-concentrated ward. Same passive benefit from Congress-SDPI vote splitting; combine with SIR mapping correction (96 at-risk voters) and targeted GOTV in the BJP-leaning booth (37).', congressVotesToFlip: 207, congressNote: 'Smallest margin of the 4 (7.5pp) — most flippable on paper. Booths 36 and 40 already lean Congress; SDPI slippage matters more per vote given the thin margin.' },
  { name: 'MANGALADEVI', category: 'BJP Narrow Margin', minorityTier: 'EXCELLENT', margin2023Pct: '9.8%', margin2023Votes: 388, swing20182023: 0.8, bjpAtRiskVoters: 46, bjpVotesAtRisk: 25, bjpGotvPool: 39, bjpTurnoutIncreaseNeeded: 0.64, riskType: 'Demographic frontier ward', bjpAction: 'Minority-concentrated ward, flattest swing (+0.8pp) of the 4 — most fragile long-term. Same Congress-SDPI split dynamic; focus GOTV on booths 226/228 (BJP-leaning) and correct 153 at-risk voters.', congressVotesToFlip: 389, congressNote: 'Booth 147 is heavily Congress (69% vs 30%) — a base to protect, not grow. Booths 223/224 are the genuine swing targets; SDPI competition for the Muslim vote is the main threat to consolidating this ward fully.' },
  { name: 'HOIGE BAZAR', category: 'BJP Medium Margin', minorityTier: 'EXCELLENT', margin2023Pct: '17.5%', margin2023Votes: 674, swing20182023: -1.2, bjpAtRiskVoters: 70, bjpVotesAtRisk: 41, bjpGotvPool: 104, bjpTurnoutIncreaseNeeded: 1.18, riskType: 'Demographic frontier ward', bjpAction: 'Minority-concentrated AND declining swing (-1.2pp) — the most urgent of the 4 minority-ring wards. Correct 233 at-risk voters and mobilise the 104-voter GOTV pool before the next roll freeze.', congressVotesToFlip: 675, congressNote: 'Booth 229 heavily Congress (60% vs 40%). Declining BJP swing suggests the trend already favours Congress without extra effort — priority is defending against SDPI eating into that same booth.' },
];

// File 5 "Ward Demographic Profile" — all 38 wards, qualitative population
// tiers (EXCELLENT/STRONG/AVG/WEAK/VLOW, derived from the constituency's
// existing community-composition data, not a new count) cross-referenced
// with 2023 political status and SIR risk. Included so the vote-bank framing
// above can be checked against where it does and doesn't actually apply —
// the source analysis explicitly flags wards where the pattern breaks down.
export const SIR_WARD_DEMOGRAPHIC_PROFILE = [
  { ward: 21, name: 'PADAVU', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Stronghold', partyWon: 'BJP', margin2023Pct: '41.5%', swing20182023: 3.7, pu: 217, note: '' },
  { ward: 24, name: 'Derebail (South)', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '31.6%', swing20182023: 10.4, pu: 324, note: 'Second-ring minority ward — longer-term watch' },
  { ward: 25, name: 'Derebail (West)', hinduTier: 'STRONG', minorityTier: 'VLOW', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '33.7%', swing20182023: 14.3, pu: 331, note: '' },
  { ward: 26, name: 'Derebail (South-west)', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Stronghold', partyWon: 'BJP', margin2023Pct: '45.4%', swing20182023: 14.3, pu: 517, note: '' },
  { ward: 27, name: 'BOLOOR', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Stronghold', partyWon: 'BJP', margin2023Pct: '44.4%', swing20182023: 7.7, pu: 248, note: '' },
  { ward: 28, name: 'MANNAGUDDA', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Stronghold', partyWon: 'BJP', margin2023Pct: '60.5%', swing20182023: 7.2, pu: 708, note: '' },
  { ward: 29, name: 'KAMBLA', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Stronghold', partyWon: 'BJP', margin2023Pct: '62.5%', swing20182023: 6.1, pu: 315, note: '' },
  { ward: 30, name: 'KODIALBAIL', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '34.8%', swing20182023: 6.9, pu: 335, note: 'Second-ring minority ward — longer-term watch' },
  { ward: 31, name: 'BEJAI', hinduTier: 'AVG', minorityTier: 'VLOW', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '21.1%', swing20182023: 7, pu: 269, note: '' },
  { ward: 32, name: 'KADRI North', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Stronghold', partyWon: 'BJP', margin2023Pct: '45.8%', swing20182023: 11.9, pu: 190, note: '' },
  { ward: 33, name: 'KADRI SOUTH', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '20.3%', swing20182023: -7.9, pu: 363, note: 'CRITICAL — SIR risk / Congress opportunity ward' },
  { ward: 34, name: 'SHIVBHAG', hinduTier: 'VLOW', minorityTier: 'WEAK', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-4.8%', swing20182023: 6.5, pu: 225, note: '' },
  { ward: 35, name: 'PADAVU CENTRAL', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '19.5%', swing20182023: 8.1, pu: 276, note: 'Second-ring minority ward — longer-term watch' },
  { ward: 36, name: 'PADAVU POORVA', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Narrow Margin', partyWon: 'BJP', margin2023Pct: '7.5%', swing20182023: 9.4, pu: 96, note: 'CRITICAL — SIR risk / Congress opportunity ward' },
  { ward: 37, name: 'MAROLI', hinduTier: 'STRONG', minorityTier: 'VLOW', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '25.6%', swing20182023: 15.5, pu: 158, note: '' },
  { ward: 38, name: 'BENDUR', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-39.4%', swing20182023: -6.7, pu: 167, note: 'Congress base — minority-concentrated' },
  { ward: 39, name: 'FALNIR', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-34.0%', swing20182023: 10.7, pu: 116, note: 'Congress base — minority-concentrated' },
  { ward: 40, name: 'COURT', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-11.0%', swing20182023: -8, pu: 116, note: 'Congress base — minority-concentrated' },
  { ward: 41, name: 'CENTRAL', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Stronghold', partyWon: 'BJP', margin2023Pct: '58.6%', swing20182023: 1.5, pu: 195, note: '' },
  { ward: 42, name: 'DONGERKERY', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Stronghold', partyWon: 'BJP', margin2023Pct: '44.4%', swing20182023: -1.4, pu: 404, note: '' },
  { ward: 43, name: 'KUDROLI', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-41.2%', swing20182023: 1.5, pu: 79, note: 'Congress base — minority-concentrated' },
  { ward: 44, name: 'NAVAYATH', hinduTier: 'WEAK', minorityTier: 'VLOW', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-25.6%', swing20182023: -10.8, pu: 128, note: '' },
  { ward: 45, name: 'PORT', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-9.3%', swing20182023: -8.3, pu: 114, note: 'Congress base — minority-concentrated' },
  { ward: 46, name: 'CANTONMENT', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '29.1%', swing20182023: 4.6, pu: 103, note: 'Second-ring minority ward — longer-term watch' },
  { ward: 47, name: 'MILAGRIS', hinduTier: 'VLOW', minorityTier: 'AVG', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-21.9%', swing20182023: -7.6, pu: 256, note: '' },
  { ward: 48, name: 'VALENCIA', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-8.8%', swing20182023: -3.4, pu: 94, note: '' },
  { ward: 49, name: 'KANKANADY', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '25.2%', swing20182023: 15.3, pu: 253, note: '' },
  { ward: 50, name: 'ALAPE DAKSHINA', hinduTier: 'STRONG', minorityTier: 'VLOW', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '36.0%', swing20182023: 7.4, pu: 172, note: '' },
  { ward: 51, name: 'ALAPE UTTARA', hinduTier: 'WEAK', minorityTier: 'VLOW', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '15.7%', swing20182023: 11.6, pu: 155, note: '' },
  { ward: 52, name: 'KANNUR', hinduTier: 'EXCELLENT', minorityTier: 'VLOW', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-16.4%', swing20182023: -13.6, pu: 73, note: '' },
  { ward: 53, name: 'BAJAL', hinduTier: 'VLOW', minorityTier: 'VLOW', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-8.4%', swing20182023: 7.6, pu: 96, note: '' },
  { ward: 54, name: 'JEPPINAMUGER', hinduTier: 'VLOW', minorityTier: 'VLOW', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '22.4%', swing20182023: 1.6, pu: 103, note: '' },
  { ward: 55, name: 'ATTAVARA', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Narrow Margin', partyWon: 'BJP', margin2023Pct: '9.9%', swing20182023: 9.7, pu: 207, note: 'CRITICAL — SIR risk / Congress opportunity ward' },
  { ward: 56, name: 'MANGALADEVI', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Narrow Margin', partyWon: 'BJP', margin2023Pct: '9.8%', swing20182023: 0.8, pu: 153, note: 'CRITICAL — SIR risk / Congress opportunity ward' },
  { ward: 57, name: 'HOIGE BAZAR', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '17.5%', swing20182023: -1.2, pu: 233, note: 'CRITICAL — SIR risk / Congress opportunity ward' },
  { ward: 58, name: 'BOLAR', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'BJP Medium Margin', partyWon: 'BJP', margin2023Pct: '26.2%', swing20182023: 8.3, pu: 124, note: 'Second-ring minority ward — longer-term watch' },
  { ward: 59, name: 'JEPPU', hinduTier: 'VLOW', minorityTier: 'EXCELLENT', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-8.1%', swing20182023: -5.1, pu: 156, note: 'Congress base — minority-concentrated' },
  { ward: 60, name: 'BENGRE', hinduTier: 'VLOW', minorityTier: 'VLOW', category: 'Congress Won (BJP Lost)', partyWon: 'CONGRESS', margin2023Pct: '-25.0%', swing20182023: -38.7, pu: 77, note: 'Biggest 2018–2023 swing (-38.7pp) — NOT demographic-driven' },
];

// File 5 "Demographic Vote-Bank Model" — reality-checked against the actual
// 2023 result. The model's turnout-adjusted Congress estimate runs ~18%
// higher than Congress's real 2023 tally — flagged in the source as a
// calibration gap (uniform AC-wide turnout doesn't capture community-
// specific turnout variance), not evidence the input percentages are wrong.
// Treat the growth deltas as more robust than the absolute totals.
export const SIR_VOTE_POOL_MODEL = [
  { pool: 'Congress', raw2023: 122010, turnoutAdj2023: 78810, actual2023: 66641, raw2028: 130368, turnoutAdj2028: 84209, growth: 5398 },
  { pool: 'SDPI (Muslim slippage)', raw2023: 9657, turnoutAdj2023: 6238, actual2023: null, raw2028: 10318, turnoutAdj2028: 6665, growth: 427 },
  { pool: 'BJP / Others', raw2023: 120277, turnoutAdj2023: 77690, actual2023: 89921, raw2028: 128515, turnoutAdj2028: 83012, growth: 5322 },
];
export const SIR_VOTE_POOL_GAP_NOTE = "Turnout-adjusted 2023 Congress estimate (78,810) runs ~18% higher than Congress's actual 2023 tally (66,641) — most likely because this model applies one AC-wide turnout rate to all three communities rather than community-specific turnout, or because some assumed-Congress voters actually went elsewhere. Treat the growth columns as the most robust output; they're less sensitive to this base-level calibration gap than the absolute totals.";

export const SIR_HEADLINE_FINDINGS = [
  { title: 'The demographic thesis is real, but concentrated in specific wards, not AC-wide', body: 'All 6 wards where minority population is EXCELLENT tier (Bendur, Falnir, Court, Kudroli, Port, Jeppu) are already Congress-held. 4 more minority-concentrated wards (Attavara, Padavu Poorva, Mangaladevi, Hoige Bazar) are BJP-held by only narrow/medium margins — a strong double-confirmation from two independent angles.' },
  { title: 'Kadri South is the exception, and needs a different explanation', body: 'Kadri South is Hindu-majority (EXCELLENT tier), yet shows the sharpest anti-BJP swing (-7.9pp) of any ward in the AC. This is NOT a minority-vote story — something else is driving it (candidate/local issue, Hindu-vote softening, or SIR mapping backlog).' },
  { title: 'Not every Congress-won ward fits the demographic pattern', body: 'Of 13 Congress-won wards, only 6 are minority-concentrated. Valencia and Kannur are Hindu-majority tier yet Congress-held; Bengre (the biggest 2018→2023 swing ward, -38.7pp) is neither Hindu- nor minority-concentrated. Congress strength there is driven by other factors — resources should not be misallocated on a purely demographic assumption.' },
  { title: 'AC-wide, population growth alone gives only a modest net tilt', body: "The 2023→2028 population growth adds an estimated +5,398 Congress-leaning and +427 SDPI votes, versus +5,322 BJP/Others-leaning votes, AC-wide — a small pro-opposition edge, not a decisive one. The much larger Hindu population base means BJP still picks up a large share of new voters too." },
];

// File 3 "Congress Booth Targeting" (24 booths inside the 5 critical wards),
// merged with File 1's "SDPI Vote-Split Risk" (congressRiskTier/congressAction/
// flipsAt) and File 2's "Fragmentation Advantage" (bjpResourceGuidance/
// bjpExtraVotesNeeded) for the 10 tracked Congress-leaning booths. BJP-heavy
// booths have no community-model overlay — those two files only modelled the
// already-Congress-leaning booths.
export const SIR_BOOTH_TARGETING = [
  { ward: 'KADRI SOUTH', booth: 57, totalVoters: 1386, bjpPct: '41.6%', congressPct: '56.8%', marginPp: -15.2, priority: 'Congress-leaning', congressRiskTier: 'MODERATE', flipsAt: 'Flips at MID-range (~20%) leakage', congressAction: 'Monitor SDPI candidate strength locally; prepare consolidation messaging as contingency', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only', bjpExtraVotesNeeded: 0 },
  { ward: 'KADRI SOUTH', booth: 61, totalVoters: 1425, bjpPct: '46.4%', congressPct: '51.2%', marginPp: -4.8, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', flipsAt: 'Flips even at LOW-end (15%) leakage', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only', bjpExtraVotesNeeded: 0 },
  { ward: 'KADRI SOUTH', booth: 60, totalVoters: 1400, bjpPct: '72.6%', congressPct: '25.8%', marginPp: 46.9, priority: 'BJP-heavy' },
  { ward: 'KADRI SOUTH', booth: 59, totalVoters: 972, bjpPct: '76.0%', congressPct: '21.8%', marginPp: 54.2, priority: 'BJP-heavy' },
  { ward: 'ATTAVARA', booth: 242, totalVoters: 1008, bjpPct: '26.4%', congressPct: '73.1%', marginPp: -46.7, priority: 'Congress-leaning', congressRiskTier: 'LOWER RISK', flipsAt: 'Safe within assumed range', congressAction: 'Standard consolidate/protect-turnout approach remains adequate', bjpResourceGuidance: 'Genuine persuasion target — allocate real spend', bjpExtraVotesNeeded: 168 },
  { ward: 'ATTAVARA', booth: 221, totalVoters: 1018, bjpPct: '45.6%', congressPct: '53.1%', marginPp: -7.5, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', flipsAt: 'Flips even at LOW-end (15%) leakage', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only', bjpExtraVotesNeeded: 0 },
  { ward: 'ATTAVARA', booth: 222, totalVoters: 1092, bjpPct: '48.9%', congressPct: '49.2%', marginPp: -0.3, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', flipsAt: 'Flips even at LOW-end (15%) leakage', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only', bjpExtraVotesNeeded: 0 },
  { ward: 'ATTAVARA', booth: 152, totalVoters: 694, bjpPct: '59.2%', congressPct: '40.2%', marginPp: 19, priority: 'BJP-heavy' },
  { ward: 'ATTAVARA', booth: 243, totalVoters: 964, bjpPct: '59.6%', congressPct: '38.1%', marginPp: 21.5, priority: 'BJP-heavy' },
  { ward: 'ATTAVARA', booth: 153, totalVoters: 883, bjpPct: '66.7%', congressPct: '31.8%', marginPp: 35, priority: 'BJP-heavy' },
  { ward: 'ATTAVARA', booth: 151, totalVoters: 967, bjpPct: '73.6%', congressPct: '25.0%', marginPp: 48.6, priority: 'BJP-heavy' },
  { ward: 'PADAVU POORVA', booth: 36, totalVoters: 1558, bjpPct: '45.6%', congressPct: '52.4%', marginPp: -6.8, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', flipsAt: 'Flips even at LOW-end (15%) leakage', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only', bjpExtraVotesNeeded: 0 },
  { ward: 'PADAVU POORVA', booth: 40, totalVoters: 1597, bjpPct: '47.2%', congressPct: '50.2%', marginPp: -3, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', flipsAt: 'Flips even at LOW-end (15%) leakage', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only', bjpExtraVotesNeeded: 0 },
  { ward: 'PADAVU POORVA', booth: 37, totalVoters: 1049, bjpPct: '64.8%', congressPct: '32.4%', marginPp: 32.4, priority: 'BJP-heavy' },
  { ward: 'MANGALADEVI', booth: 147, totalVoters: 1071, bjpPct: '30.0%', congressPct: '68.8%', marginPp: -38.7, priority: 'Congress-leaning', congressRiskTier: 'LOWER RISK', flipsAt: 'Safe within assumed range', congressAction: 'Standard consolidate/protect-turnout approach remains adequate', bjpResourceGuidance: 'Genuine persuasion target — allocate real spend', bjpExtraVotesNeeded: 94 },
  { ward: 'MANGALADEVI', booth: 223, totalVoters: 809, bjpPct: '46.8%', congressPct: '52.0%', marginPp: -5.2, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', flipsAt: 'Flips even at LOW-end (15%) leakage', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only', bjpExtraVotesNeeded: 0 },
  { ward: 'MANGALADEVI', booth: 224, totalVoters: 1048, bjpPct: '55.3%', congressPct: '43.3%', marginPp: 11.9, priority: 'BJP-heavy' },
  { ward: 'MANGALADEVI', booth: 227, totalVoters: 1018, bjpPct: '58.5%', congressPct: '39.8%', marginPp: 18.7, priority: 'BJP-heavy' },
  { ward: 'MANGALADEVI', booth: 228, totalVoters: 945, bjpPct: '65.3%', congressPct: '32.9%', marginPp: 32.4, priority: 'BJP-heavy' },
  { ward: 'MANGALADEVI', booth: 226, totalVoters: 1216, bjpPct: '68.5%', congressPct: '29.1%', marginPp: 39.4, priority: 'BJP-heavy' },
  { ward: 'HOIGE BAZAR', booth: 229, totalVoters: 1368, bjpPct: '39.6%', congressPct: '59.5%', marginPp: -19.9, priority: 'Congress-leaning', congressRiskTier: 'MODERATE', flipsAt: 'Flips at MID-range (~20%) leakage', congressAction: 'Monitor SDPI candidate strength locally; prepare consolidation messaging as contingency', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only', bjpExtraVotesNeeded: 0 },
  { ward: 'HOIGE BAZAR', booth: 233, totalVoters: 1301, bjpPct: '55.7%', congressPct: '42.7%', marginPp: 13, priority: 'BJP-heavy' },
  { ward: 'HOIGE BAZAR', booth: 232, totalVoters: 1105, bjpPct: '59.7%', congressPct: '39.3%', marginPp: 20.4, priority: 'BJP-heavy' },
  { ward: 'HOIGE BAZAR', booth: 239, totalVoters: 1231, bjpPct: '60.0%', congressPct: '38.9%', marginPp: 21.1, priority: 'BJP-heavy' },
  { ward: 'HOIGE BAZAR', booth: 235, totalVoters: 932, bjpPct: '75.8%', congressPct: '23.0%', marginPp: 52.7, priority: 'BJP-heavy' },
];

// File 2 (BJP_Win_Strategy_Fragmentation_Analysis.xlsx) "Ward Prioritization
// Matrix" sheet — a consolidated defense+offense view per critical ward that
// was extracted separately from the other files but never surfaced in the UI.
export const SIR_WARD_PRIORITIZATION = [
  { ward: 'KADRI SOUTH', sirRiskFlag: 'CRITICAL', atRiskPoolPU: 363, fragmentationSecuredBooths: 2, genuineTargetBooths: 0, recommendation: 'Highest priority: resolve mapping/resubmission for 363 PU voters; both booths (57, 61) are fragmentation-secured — turnout protection only, no persuasion spend needed here.' },
  { ward: 'ATTAVARA', sirRiskFlag: 'CRITICAL', atRiskPoolPU: 207, fragmentationSecuredBooths: 2, genuineTargetBooths: 1, recommendation: 'High priority: resolve mapping for 207 PU voters; 2 of 3 tracked booths are fragmentation-secured, but booth 242 is a genuine hard target (~168 extra votes) — deprioritise unless resources allow.' },
  { ward: 'PADAVU POORVA', sirRiskFlag: 'CRITICAL', atRiskPoolPU: 96, fragmentationSecuredBooths: 2, genuineTargetBooths: 0, recommendation: 'High priority: resolve mapping for 96 PU voters; both tracked booths (36, 40) fragmentation-secured — turnout protection only.' },
  { ward: 'MANGALADEVI', sirRiskFlag: 'CRITICAL', atRiskPoolPU: 153, fragmentationSecuredBooths: 1, genuineTargetBooths: 1, recommendation: 'High priority: resolve mapping for 153 PU voters; booth 223 fragmentation-secured, booth 147 is a genuine hard target (~94 extra votes) — lower ROI, deprioritise unless resources allow.' },
  { ward: 'HOIGE BAZAR', sirRiskFlag: 'CRITICAL', atRiskPoolPU: 233, fragmentationSecuredBooths: 1, genuineTargetBooths: 0, recommendation: 'High priority: resolve mapping for 233 PU voters; tracked booth (229) fragmentation-secured — turnout protection only.' },
];
export const SIR_WARD_PRIORITIZATION_ACTION_PLAN = [
  'DEFENSE FIRST: mapping/resubmission drives in all 5 CRITICAL wards, before roll freeze — protects existing BJP margin and is unaffected by the fragmentation dynamic (it\'s about BJP\'s own voters staying on the roll).',
  'HOLD, DON\'T SPEND, in the 8 fragmentation-secured booths: a basic turnout-protection GOTV pass is enough; the Congress-SDPI split is already doing the persuasion work.',
  'REDIRECT freed-up persuasion budget: either into the 2 genuine hard-target booths (Attavara 242, Mangaladevi 147), or into the 6 WATCH-tier wards from the ward risk ranking (Bejai, Kodialbail, Mannagudda, Derebail West/South, Padavu Central) where no fragmentation cushion exists.',
  'MONITOR SDPI candidate strength each cycle: the fragmentation advantage is contingent on SDPI actually fielding and contesting seriously in these booths — if SDPI doesn\'t contest, the underlying Congress margin reappears and BJP would need real persuasion there after all.',
  'KEEP HINDU-CONSOLIDATION MESSAGING RUNNING CONSTITUENCY-WIDE regardless of the above — it\'s the only lever that grows BJP\'s total vote share rather than just its margin in a handful of booths.',
];

// Community population (constituency-wide, user-supplied) and the resulting
// modelled vote pool for each party under Low/Mid/High planning assumptions.
export const SIR_COMMUNITY_POPULATION = [
  { community: 'Hindu', pop2023: 159857, pop2028: 170807 },
  { community: 'Muslim', pop2023: 48285, pop2028: 51592 },
  { community: 'Christian', pop2023: 43802, pop2028: 46802 },
];
export const SIR_POPULATION_GROWTH_PCT = 6.85;

export const SIR_VOTE_BANK_CONGRESS = [
  { community: 'Hindu', pop2023: 159857, low2023: 39964, mid2023: 43961, high2023: 47957, compositionPctMid: 36.7, mid2028: 46972 },
  { community: 'Muslim (post-SDPI residual)', pop2023: 48285, low2023: 36214, mid2023: 38628, high2023: 41042, compositionPctMid: 32.2, mid2028: 41274 },
  { community: 'Christian', pop2023: 43802, low2023: 35042, mid2023: 37232, high2023: 39422, compositionPctMid: 31.1, mid2028: 39782 },
];
export const SIR_VOTE_BANK_CONGRESS_TOTAL = { pop2023: 251944, low2023: 111220, mid2023: 119820, high2023: 128421, mid2028: 128028, growthVotes: 8207, growthPct: 6.85 };

export const SIR_VOTE_BANK_BJP = [
  { community: 'Hindu (post-Congress residual)', pop2023: 159857, low2023: 111900, mid2023: 115896, high2023: 119893, compositionPctMid: 94.6, mid2028: 123835 },
  { community: 'Muslim', pop2023: 48285, low2023: 0, mid2023: 0, high2023: 0, compositionPctMid: 0, mid2028: 0 },
  { community: 'Christian', pop2023: 43802, low2023: 8760, mid2023: 6570, high2023: 4380, compositionPctMid: 5.4, mid2028: 7020 },
];
export const SIR_VOTE_BANK_BJP_TOTAL = { pop2023: 251944, low2023: 120660, mid2023: 122467, high2023: 124273, mid2028: 130855, growthVotes: 8389, growthPct: 6.85 };

// Every voting-behaviour figure below is a user-supplied planning assumption
// or an illustrative estimate the source workbook explicitly flagged as
// unverified — not a survey result or a measured count.
export const SIR_STRATEGY_ASSUMPTIONS = [
  { community: 'Muslim', splitsTo: 'Leaks to SDPI', low: 15, mid: 20, high: 25, basis: 'User-supplied planning assumption ("15-25%... slipped to SDPI"). Not sourced from a survey.' },
  { community: 'Muslim', splitsTo: 'Residual to Congress', low: 75, mid: 80, high: 85, basis: 'Derived: 100% minus SDPI leakage; none assumed to BJP per user framing.' },
  { community: 'Christian', splitsTo: 'To Congress', low: 80, mid: 85, high: 90, basis: 'Illustrative band added since no figure was supplied — user said Christians "favour Congress the most" with no number.' },
  { community: 'Hindu', splitsTo: 'To Congress', low: 25, mid: 27.5, high: 30, basis: 'User-supplied planning assumption ("Congress gets 25-30% from Hindu community"). Not sourced from a survey.' },
];

export const SIR_STRATEGY_CAVEATS = [
  'Population figures are user-supplied and not independently verified against Census/electoral-roll data.',
  'The model applies community vote-share assumptions to raw population, not to registered electors or projected turnout.',
  'No ward- or booth-level religious population data exists — the SDPI-leakage/fragmentation figures apply a constituency-wide assumption uniformly to every tracked booth, not a measured local count.',
  'The breakeven/fragmentation model assumes SDPI draws votes only from Congress\'s existing base in a booth, not from BJP or non-voters — if that assumption is wrong, real effects differ from what is modelled here.',
  'Data-quality note carried over from the original source file (not introduced by this analysis): the booth-level BJP%/Congress% figures shown do not always arithmetically reconcile with the raw BJP-votes/Congress-votes columns from the same sheet (e.g. booth 57: 433 BJP votes ÷ 1,386 total = 31.2%, not the 41.6% shown) — treat the percentages as the source file\'s own stated figures, not a value independently recomputed from the vote counts.',
  'This is a resource-allocation and turnout/persuasion planning exercise, not a voter-suppression plan: it does not recommend discouraging anyone from voting, covertly funding a spoiler candidate, or targeting any community with anything other than standard GOTV/persuasion outreach.',
];
