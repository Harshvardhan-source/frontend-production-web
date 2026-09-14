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

// File 3 "BJP Risk Ranking" — all 25 BJP-held wards, sorted by risk ratio
// (Polled-and-Unmapped pool ÷ 2023 win margin). This part has no religious/
// communal dimension — it's SIR roll-mapping risk vs historical margin.
export const SIR_RISK_RANKING = [
  { ward: 33, name: 'KADRI SOUTH', category: 'BJP Medium Margin', margin2023: 643, swing20182023: -7.9, polledUnmapped: 363, unpolledMapped: 99, riskRatio: 0.56, votesAtRisk: 64, turnoutIncreaseNeeded: 1.91, flag: 'CRITICAL' },
  { ward: 55, name: 'ATTAVARA', category: 'BJP Narrow Margin', margin2023: 423, swing20182023: 9.7, polledUnmapped: 207, unpolledMapped: 76, riskRatio: 0.49, votesAtRisk: 34, turnoutIncreaseNeeded: 0.94, flag: 'CRITICAL' },
  { ward: 36, name: 'PADAVU POORVA', category: 'BJP Narrow Margin', margin2023: 206, swing20182023: 9.4, polledUnmapped: 96, unpolledMapped: 23, riskRatio: 0.47, votesAtRisk: 15, turnoutIncreaseNeeded: 0.55, flag: 'CRITICAL' },
  { ward: 56, name: 'MANGALADEVI', category: 'BJP Narrow Margin', margin2023: 388, swing20182023: 0.8, polledUnmapped: 153, unpolledMapped: 39, riskRatio: 0.39, votesAtRisk: 25, turnoutIncreaseNeeded: 0.64, flag: 'CRITICAL' },
  { ward: 57, name: 'HOIGE BAZAR', category: 'BJP Medium Margin', margin2023: 674, swing20182023: -1.2, polledUnmapped: 233, unpolledMapped: 104, riskRatio: 0.35, votesAtRisk: 41, turnoutIncreaseNeeded: 1.18, flag: 'CRITICAL' },
  { ward: 31, name: 'BEJAI', category: 'BJP Medium Margin', margin2023: 937, swing20182023: 7, polledUnmapped: 269, unpolledMapped: 71, riskRatio: 0.29, votesAtRisk: 48, turnoutIncreaseNeeded: 0.98, flag: 'WATCH' },
  { ward: 30, name: 'KODIALBAIL', category: 'BJP Medium Margin', margin2023: 1338, swing20182023: 6.9, polledUnmapped: 335, unpolledMapped: 50, riskRatio: 0.25, votesAtRisk: 67, turnoutIncreaseNeeded: 0.85, flag: 'WATCH' },
  { ward: 28, name: 'MANNAGUDDA', category: 'BJP Stronghold', margin2023: 2894, swing20182023: 7.2, polledUnmapped: 708, unpolledMapped: 163, riskRatio: 0.24, votesAtRisk: 168, turnoutIncreaseNeeded: 2.11, flag: 'WATCH' },
  { ward: 25, name: 'Derebail (West)', category: 'BJP Medium Margin', margin2023: 1405, swing20182023: 14.3, polledUnmapped: 331, unpolledMapped: 61, riskRatio: 0.24, votesAtRisk: 66, turnoutIncreaseNeeded: 0.98, flag: 'WATCH' },
  { ward: 24, name: 'Derebail (South)', category: 'BJP Medium Margin', margin2023: 1424, swing20182023: 10.4, polledUnmapped: 324, unpolledMapped: 64, riskRatio: 0.23, votesAtRisk: 63, turnoutIncreaseNeeded: 0.85, flag: 'WATCH' },
  { ward: 35, name: 'PADAVU CENTRAL', category: 'BJP Medium Margin', margin2023: 1241, swing20182023: 8.1, polledUnmapped: 276, unpolledMapped: 70, riskRatio: 0.22, votesAtRisk: 49, turnoutIncreaseNeeded: 0.76, flag: 'WATCH' },
  { ward: 26, name: 'Derebail (South-west)', category: 'BJP Stronghold', margin2023: 2478, swing20182023: 14.3, polledUnmapped: 517, unpolledMapped: 72, riskRatio: 0.21, votesAtRisk: 111, turnoutIncreaseNeeded: 0.85, flag: 'WATCH' },
  { ward: 51, name: 'ALAPE UTTARA', category: 'BJP Medium Margin', margin2023: 753, swing20182023: 11.6, polledUnmapped: 155, unpolledMapped: 61, riskRatio: 0.21, votesAtRisk: 27, turnoutIncreaseNeeded: 0.65, flag: 'WATCH' },
  { ward: 42, name: 'DONGERKERY', category: 'BJP Stronghold', margin2023: 2105, swing20182023: -1.4, polledUnmapped: 404, unpolledMapped: 95, riskRatio: 0.19, votesAtRisk: 86, turnoutIncreaseNeeded: 1.25, flag: 'STABLE' },
  { ward: 49, name: 'KANKANADY', category: 'BJP Medium Margin', margin2023: 1343, swing20182023: 15.3, polledUnmapped: 253, unpolledMapped: 63, riskRatio: 0.19, votesAtRisk: 47, turnoutIncreaseNeeded: 0.85, flag: 'STABLE' },
  { ward: 27, name: 'BOLOOR', category: 'BJP Stronghold', margin2023: 1637, swing20182023: 7.7, polledUnmapped: 248, unpolledMapped: 95, riskRatio: 0.15, votesAtRisk: 53, turnoutIncreaseNeeded: 1.47, flag: 'STABLE' },
  { ward: 29, name: 'KAMBLA', category: 'BJP Stronghold', margin2023: 2122, swing20182023: 6.1, polledUnmapped: 315, unpolledMapped: 87, riskRatio: 0.15, votesAtRisk: 76, turnoutIncreaseNeeded: 1.59, flag: 'STABLE' },
  { ward: 37, name: 'MAROLI', category: 'BJP Medium Margin', margin2023: 1137, swing20182023: 15.5, polledUnmapped: 158, unpolledMapped: 52, riskRatio: 0.14, votesAtRisk: 29, turnoutIncreaseNeeded: 0.69, flag: 'STABLE' },
  { ward: 50, name: 'ALAPE DAKSHINA', category: 'BJP Medium Margin', margin2023: 1440, swing20182023: 7.4, polledUnmapped: 172, unpolledMapped: 37, riskRatio: 0.12, votesAtRisk: 35, turnoutIncreaseNeeded: 0.65, flag: 'STABLE' },
  { ward: 46, name: 'CANTONMENT', category: 'BJP Medium Margin', margin2023: 887, swing20182023: 4.6, polledUnmapped: 103, unpolledMapped: 50, riskRatio: 0.12, votesAtRisk: 20, turnoutIncreaseNeeded: 0.61, flag: 'STABLE' },
  { ward: 58, name: 'BOLAR', category: 'BJP Medium Margin', margin2023: 1078, swing20182023: 8.3, polledUnmapped: 124, unpolledMapped: 40, riskRatio: 0.11, votesAtRisk: 23, turnoutIncreaseNeeded: 0.59, flag: 'STABLE' },
  { ward: 41, name: 'CENTRAL', category: 'BJP Stronghold', margin2023: 1771, swing20182023: 1.5, polledUnmapped: 195, unpolledMapped: 34, riskRatio: 0.11, votesAtRisk: 46, turnoutIncreaseNeeded: 0.71, flag: 'STABLE' },
  { ward: 21, name: 'PADAVU', category: 'BJP Stronghold', margin2023: 2195, swing20182023: 3.7, polledUnmapped: 217, unpolledMapped: 74, riskRatio: 0.1, votesAtRisk: 45, turnoutIncreaseNeeded: 0.87, flag: 'STABLE' },
  { ward: 32, name: 'KADRI North', category: 'BJP Stronghold', margin2023: 2041, swing20182023: 11.9, polledUnmapped: 190, unpolledMapped: 45, riskRatio: 0.09, votesAtRisk: 41, turnoutIncreaseNeeded: 0.66, flag: 'STABLE' },
  { ward: 54, name: 'JEPPINAMUGER', category: 'BJP Medium Margin', margin2023: 1121, swing20182023: 1.6, polledUnmapped: 103, unpolledMapped: 69, riskRatio: 0.09, votesAtRisk: 19, turnoutIncreaseNeeded: 0.43, flag: 'STABLE' },
];

// File 3 "BJP Critical Wards" (defense) merged with "Congress Opportunity"
// (offense) — the same 5 wards, viewed from both sides.
export const SIR_CRITICAL_WARDS = [
  { name: 'KADRI SOUTH', category: 'BJP Medium Margin', margin2023Pct: '20.3%', margin2023Votes: 643, swing20182023: -7.9, bjpAtRiskVoters: 109, bjpVotesAtRisk: 64, bjpGotvPool: 99, bjpTurnoutIncreaseNeeded: 1.91, bjpAction: 'Re-mapping/resubmission drive for 363 Polled-but-Unmapped voters before roll freeze; GOTV among the 99 correctly-mapped-but-non-voting electors.', congressVotesToFlip: 644 },
  { name: 'ATTAVARA', category: 'BJP Narrow Margin', margin2023Pct: '9.9%', margin2023Votes: 423, swing20182023: 9.7, bjpAtRiskVoters: 62, bjpVotesAtRisk: 34, bjpGotvPool: 76, bjpTurnoutIncreaseNeeded: 0.94, bjpAction: 'Re-mapping/resubmission drive for 207 Polled-but-Unmapped voters before roll freeze; GOTV among the 76 correctly-mapped-but-non-voting electors.', congressVotesToFlip: 424 },
  { name: 'PADAVU POORVA', category: 'BJP Narrow Margin', margin2023Pct: '7.5%', margin2023Votes: 206, swing20182023: 9.4, bjpAtRiskVoters: 29, bjpVotesAtRisk: 15, bjpGotvPool: 23, bjpTurnoutIncreaseNeeded: 0.55, bjpAction: 'Re-mapping/resubmission drive for 96 Polled-but-Unmapped voters before roll freeze; GOTV among the 23 correctly-mapped-but-non-voting electors.', congressVotesToFlip: 207 },
  { name: 'MANGALADEVI', category: 'BJP Narrow Margin', margin2023Pct: '9.8%', margin2023Votes: 388, swing20182023: 0.8, bjpAtRiskVoters: 46, bjpVotesAtRisk: 25, bjpGotvPool: 39, bjpTurnoutIncreaseNeeded: 0.64, bjpAction: 'Re-mapping/resubmission drive for 153 Polled-but-Unmapped voters before roll freeze; GOTV among the 39 correctly-mapped-but-non-voting electors.', congressVotesToFlip: 389 },
  { name: 'HOIGE BAZAR', category: 'BJP Medium Margin', margin2023Pct: '17.5%', margin2023Votes: 674, swing20182023: -1.2, bjpAtRiskVoters: 70, bjpVotesAtRisk: 41, bjpGotvPool: 104, bjpTurnoutIncreaseNeeded: 1.18, bjpAction: 'Re-mapping/resubmission drive for 233 Polled-but-Unmapped voters before roll freeze; GOTV among the 104 correctly-mapped-but-non-voting electors.', congressVotesToFlip: 675 },
];

// File 3 "Congress Booth Targeting" (24 booths inside the 5 critical wards),
// merged with File 1's "SDPI Vote-Split Risk" (congressRiskTier/congressAction)
// and File 2's "Fragmentation Advantage" (bjpResourceGuidance) for the 10
// tracked Congress-leaning booths. BJP-heavy booths have no community-model
// overlay — those two files only modelled the already-Congress-leaning booths.
export const SIR_BOOTH_TARGETING = [
  { ward: 'KADRI SOUTH', booth: 57, totalVoters: 1386, bjpPct: '41.6%', congressPct: '56.8%', marginPp: -15.2, priority: 'Congress-leaning', congressRiskTier: 'MODERATE', congressAction: 'Monitor SDPI candidate strength locally; prepare consolidation messaging as contingency', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only' },
  { ward: 'KADRI SOUTH', booth: 61, totalVoters: 1425, bjpPct: '46.4%', congressPct: '51.2%', marginPp: -4.8, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only' },
  { ward: 'KADRI SOUTH', booth: 60, totalVoters: 1400, bjpPct: '72.6%', congressPct: '25.8%', marginPp: 46.9, priority: 'BJP-heavy' },
  { ward: 'KADRI SOUTH', booth: 59, totalVoters: 972, bjpPct: '76.0%', congressPct: '21.8%', marginPp: 54.2, priority: 'BJP-heavy' },
  { ward: 'ATTAVARA', booth: 242, totalVoters: 1008, bjpPct: '26.4%', congressPct: '73.1%', marginPp: -46.7, priority: 'Congress-leaning', congressRiskTier: 'LOWER RISK', congressAction: 'Standard consolidate/protect-turnout approach remains adequate', bjpResourceGuidance: 'Genuine persuasion target — allocate real spend' },
  { ward: 'ATTAVARA', booth: 221, totalVoters: 1018, bjpPct: '45.6%', congressPct: '53.1%', marginPp: -7.5, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only' },
  { ward: 'ATTAVARA', booth: 222, totalVoters: 1092, bjpPct: '48.9%', congressPct: '49.2%', marginPp: -0.3, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only' },
  { ward: 'ATTAVARA', booth: 152, totalVoters: 694, bjpPct: '59.2%', congressPct: '40.2%', marginPp: 19, priority: 'BJP-heavy' },
  { ward: 'ATTAVARA', booth: 243, totalVoters: 964, bjpPct: '59.6%', congressPct: '38.1%', marginPp: 21.5, priority: 'BJP-heavy' },
  { ward: 'ATTAVARA', booth: 153, totalVoters: 883, bjpPct: '66.7%', congressPct: '31.8%', marginPp: 35, priority: 'BJP-heavy' },
  { ward: 'ATTAVARA', booth: 151, totalVoters: 967, bjpPct: '73.6%', congressPct: '25.0%', marginPp: 48.6, priority: 'BJP-heavy' },
  { ward: 'PADAVU POORVA', booth: 36, totalVoters: 1558, bjpPct: '45.6%', congressPct: '52.4%', marginPp: -6.8, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only' },
  { ward: 'PADAVU POORVA', booth: 40, totalVoters: 1597, bjpPct: '47.2%', congressPct: '50.2%', marginPp: -3, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only' },
  { ward: 'PADAVU POORVA', booth: 37, totalVoters: 1049, bjpPct: '64.8%', congressPct: '32.4%', marginPp: 32.4, priority: 'BJP-heavy' },
  { ward: 'MANGALADEVI', booth: 147, totalVoters: 1071, bjpPct: '30.0%', congressPct: '68.8%', marginPp: -38.7, priority: 'Congress-leaning', congressRiskTier: 'LOWER RISK', congressAction: 'Standard consolidate/protect-turnout approach remains adequate', bjpResourceGuidance: 'Genuine persuasion target — allocate real spend' },
  { ward: 'MANGALADEVI', booth: 223, totalVoters: 809, bjpPct: '46.8%', congressPct: '52.0%', marginPp: -5.2, priority: 'Congress-leaning', congressRiskTier: 'EXTREME/HIGH', congressAction: 'Direct minority-consolidation campaign vs SDPI messaging — do not rely on generic GOTV', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only' },
  { ward: 'MANGALADEVI', booth: 224, totalVoters: 1048, bjpPct: '55.3%', congressPct: '43.3%', marginPp: 11.9, priority: 'BJP-heavy' },
  { ward: 'MANGALADEVI', booth: 227, totalVoters: 1018, bjpPct: '58.5%', congressPct: '39.8%', marginPp: 18.7, priority: 'BJP-heavy' },
  { ward: 'MANGALADEVI', booth: 228, totalVoters: 945, bjpPct: '65.3%', congressPct: '32.9%', marginPp: 32.4, priority: 'BJP-heavy' },
  { ward: 'MANGALADEVI', booth: 226, totalVoters: 1216, bjpPct: '68.5%', congressPct: '29.1%', marginPp: 39.4, priority: 'BJP-heavy' },
  { ward: 'HOIGE BAZAR', booth: 229, totalVoters: 1368, bjpPct: '39.6%', congressPct: '59.5%', marginPp: -19.9, priority: 'Congress-leaning', congressRiskTier: 'MODERATE', congressAction: 'Monitor SDPI candidate strength locally; prepare consolidation messaging as contingency', bjpResourceGuidance: 'Fragmentation-secured — protect turnout only' },
  { ward: 'HOIGE BAZAR', booth: 233, totalVoters: 1301, bjpPct: '55.7%', congressPct: '42.7%', marginPp: 13, priority: 'BJP-heavy' },
  { ward: 'HOIGE BAZAR', booth: 232, totalVoters: 1105, bjpPct: '59.7%', congressPct: '39.3%', marginPp: 20.4, priority: 'BJP-heavy' },
  { ward: 'HOIGE BAZAR', booth: 239, totalVoters: 1231, bjpPct: '60.0%', congressPct: '38.9%', marginPp: 21.1, priority: 'BJP-heavy' },
  { ward: 'HOIGE BAZAR', booth: 235, totalVoters: 932, bjpPct: '75.8%', congressPct: '23.0%', marginPp: 52.7, priority: 'BJP-heavy' },
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
  'This is a resource-allocation and turnout/persuasion planning exercise, not a voter-suppression plan: it does not recommend discouraging anyone from voting, covertly funding a spoiler candidate, or targeting any community with anything other than standard GOTV/persuasion outreach.',
];
