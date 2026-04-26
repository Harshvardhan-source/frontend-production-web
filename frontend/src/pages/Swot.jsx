<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BJP Political Intelligence Dashboard – 2023 Elections</title>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans:wght@300;400;600&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
  :root {
    --saffron: #FF6B0A;
    --saffron-dark: #CC4D00;
    --saffron-light: #FF8C3A;
    --green: #138808;
    --green-light: #1DB310;
    --navy: #0B0F2A;
    --navy-mid: #141936;
    --navy-light: #1E2545;
    --congress-red: #C62828;
    --gold: #FFD700;
    --silver: #A0AEC0;
    --text-primary: #F0F4FF;
    --text-secondary: #8899BB;
    --card-bg: rgba(20,25,54,0.95);
    --border: rgba(255,107,10,0.25);
    --strong: #00C851;
    --medium: #FFB800;
    --weak: #FF4444;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--navy);
    color: var(--text-primary);
    font-family: 'Noto Sans', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Animated background */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(255,107,10,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 20% 80%, rgba(19,136,8,0.06) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  .dashboard {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px 60px;
  }

  /* HEADER */
  .header {
    background: linear-gradient(135deg, var(--navy-mid) 0%, rgba(255,107,10,0.15) 100%);
    border-bottom: 3px solid var(--saffron);
    padding: 28px 40px 24px;
    margin: 0 -20px 40px;
    position: relative;
    overflow: hidden;
    animation: slideDown 0.6s ease-out;
  }
  .header::after {
    content: '🪷';
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 60px;
    opacity: 0.15;
  }
  .header-top {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 8px;
  }
  .bjp-badge {
    background: var(--saffron);
    color: white;
    font-family: 'Bebas Neue', cursive;
    font-size: 28px;
    letter-spacing: 3px;
    padding: 6px 18px;
    border-radius: 4px;
  }
  .header h1 {
    font-family: 'Rajdhani', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 1px;
  }
  .header-sub {
    font-size: 13px;
    color: var(--text-secondary);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  /* SUMMARY STATS BAR */
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
    margin-bottom: 36px;
    animation: fadeIn 0.8s ease-out 0.2s both;
  }
  .stat-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 18px 16px;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
  }
  .stat-card:hover { transform: translateY(-3px); border-color: var(--saffron); }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .stat-card.orange::before { background: var(--saffron); }
  .stat-card.green::before { background: var(--green); }
  .stat-card.red::before { background: var(--congress-red); }
  .stat-card.gold::before { background: var(--gold); }
  .stat-num {
    font-family: 'Bebas Neue', cursive;
    font-size: 42px;
    line-height: 1;
    margin-bottom: 4px;
  }
  .stat-num.orange { color: var(--saffron); }
  .stat-num.green { color: var(--green-light); }
  .stat-num.red { color: #FF6464; }
  .stat-num.gold { color: var(--gold); }
  .stat-label {
    font-size: 10px;
    color: var(--text-secondary);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-weight: 600;
  }

  /* NAV TABS */
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 28px;
    background: var(--navy-mid);
    border-radius: 10px;
    padding: 5px;
    border: 1px solid var(--border);
    animation: fadeIn 0.8s ease-out 0.3s both;
  }
  .tab {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: 'Rajdhani', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 1px;
    cursor: pointer;
    border-radius: 7px;
    transition: all 0.25s;
    text-transform: uppercase;
  }
  .tab:hover { color: var(--text-primary); background: rgba(255,107,10,0.1); }
  .tab.active {
    background: var(--saffron);
    color: white;
    box-shadow: 0 4px 14px rgba(255,107,10,0.35);
  }

  /* SECTIONS */
  .section { display: none; animation: fadeIn 0.4s ease-out; }
  .section.active { display: block; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

  /* SECTION HEADER */
  .section-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
  }
  .section-header h2 {
    font-family: 'Rajdhani', sans-serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .section-badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 20px;
  }

  /* POLITICAL SWOT */
  .swot-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 28px;
  }
  .swot-card {
    background: var(--card-bg);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .swot-card-header {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .swot-card-header.strength { background: rgba(0,200,81,0.18); color: #00C851; border-bottom: 2px solid #00C851; }
  .swot-card-header.weakness { background: rgba(255,68,68,0.15); color: #FF6464; border-bottom: 2px solid #FF4444; }
  .swot-card-header.opportunity { background: rgba(255,184,0,0.15); color: var(--gold); border-bottom: 2px solid var(--gold); }
  .swot-card-header.threat { background: rgba(198,40,40,0.2); color: #FF8080; border-bottom: 2px solid #C62828; }
  .swot-body { padding: 16px 20px; }
  .swot-point {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    align-items: flex-start;
  }
  .swot-point:last-child { border-bottom: none; }
  .swot-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
  .swot-content h4 {
    font-family: 'Rajdhani', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 3px;
  }
  .swot-content p { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
  .swot-metric {
    display: inline-block;
    font-family: 'Bebas Neue', cursive;
    font-size: 18px;
    color: var(--saffron);
    margin-right: 6px;
  }

  /* WARD ANALYSIS */
  .ward-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .filter-btn {
    padding: 8px 18px;
    border-radius: 20px;
    border: 1.5px solid;
    background: transparent;
    font-family: 'Rajdhani', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .filter-btn.strong-btn { border-color: var(--strong); color: var(--strong); }
  .filter-btn.strong-btn:hover, .filter-btn.strong-btn.active { background: var(--strong); color: #000; }
  .filter-btn.medium-btn { border-color: var(--medium); color: var(--medium); }
  .filter-btn.medium-btn:hover, .filter-btn.medium-btn.active { background: var(--medium); color: #000; }
  .filter-btn.weak-btn { border-color: var(--weak); color: var(--weak); }
  .filter-btn.weak-btn:hover, .filter-btn.weak-btn.active { background: var(--weak); color: white; }
  .filter-btn.all-btn { border-color: var(--silver); color: var(--silver); }
  .filter-btn.all-btn:hover, .filter-btn.all-btn.active { background: var(--silver); color: #000; }

  /* WARD TABLE */
  .ward-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--border); }
  .ward-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .ward-table th {
    background: rgba(255,107,10,0.15);
    color: var(--saffron);
    font-family: 'Rajdhani', sans-serif;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  .ward-table td {
    padding: 11px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: var(--text-primary);
    white-space: nowrap;
  }
  .ward-table tr:last-child td { border-bottom: none; }
  .ward-table tr:hover td { background: rgba(255,107,10,0.05); }

  .cat-badge {
    display: inline-block;
    font-family: 'Rajdhani', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 3px 10px;
    border-radius: 12px;
    text-transform: uppercase;
  }
  .cat-strong { background: rgba(0,200,81,0.15); color: var(--strong); border: 1px solid rgba(0,200,81,0.3); }
  .cat-medium { background: rgba(255,184,0,0.15); color: var(--medium); border: 1px solid rgba(255,184,0,0.3); }
  .cat-lost { background: rgba(255,68,68,0.15); color: var(--weak); border: 1px solid rgba(255,68,68,0.3); }
  .cat-narrow { background: rgba(255,200,0,0.1); color: #FFD700; border: 1px solid rgba(255,200,0,0.25); }

  .diff-pos { color: var(--strong); font-weight: 600; }
  .diff-neg { color: var(--weak); font-weight: 600; }

  .pbar-wrap { display: flex; align-items: center; gap: 8px; }
  .pbar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.08); flex: 1; min-width: 80px; }
  .pbar-fill { height: 100%; border-radius: 3px; background: var(--saffron); }
  .pbar-fill.cong { background: var(--congress-red); }

  /* MINORITY ANALYSIS */
  .minority-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
  }
  .minority-card {
    background: var(--card-bg);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .minority-header {
    padding: 14px 20px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .minority-header.muslim { background: rgba(0,102,204,0.2); color: #4DA6FF; border-bottom: 2px solid #0066CC; }
  .minority-header.christian { background: rgba(150,50,200,0.2); color: #CC88FF; border-bottom: 2px solid #9632C8; }
  .minority-body { padding: 14px; max-height: 480px; overflow-y: auto; }

  /* Custom scrollbar */
  .minority-body::-webkit-scrollbar { width: 4px; }
  .minority-body::-webkit-scrollbar-track { background: transparent; }
  .minority-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .booth-row {
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    transition: border-color 0.2s;
  }
  .booth-row:hover { border-color: var(--saffron); }
  .booth-row-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 6px;
  }
  .booth-name { font-weight: 600; font-size: 13px; color: var(--text-primary); }
  .booth-num { font-family: 'Bebas Neue', cursive; font-size: 14px; color: var(--saffron); }
  .booth-stats { display: flex; gap: 8px; font-size: 11px; }
  .mini-stat { padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .mini-stat.pct { background: rgba(255,107,10,0.15); color: var(--saffron); }
  .mini-stat.bjp-s { background: rgba(255,107,10,0.2); color: #FFB877; }
  .mini-stat.cong-s { background: rgba(198,40,40,0.2); color: #FF9999; }
  .booth-bar-wrap { display: flex; gap: 2px; height: 5px; border-radius: 3px; overflow: hidden; margin-top: 6px; }
  .booth-bar-bjp { background: var(--saffron); height: 100%; }
  .booth-bar-cong { background: var(--congress-red); height: 100%; }
  .booth-bar-oth { background: rgba(255,255,255,0.15); flex: 1; }

  .ward-tag {
    font-size: 10px;
    letter-spacing: 1px;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  /* Summary legend boxes at top of minority section */
  .minority-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
  .min-sum-box {
    background: var(--navy-light);
    border-radius: 8px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    text-align: center;
  }
  .min-sum-num {
    font-family: 'Bebas Neue', cursive;
    font-size: 36px;
    line-height: 1;
    margin-bottom: 4px;
  }
  .min-sum-label { font-size: 10px; color: var(--text-secondary); letter-spacing: 1.5px; text-transform: uppercase; }

  /* Category legend */
  .legend-row { display: flex; gap: 16px; margin-bottom: 20px; font-size: 12px; align-items: center; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }

  /* Pie chart SVG style */
  .charts-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .chart-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }
  .chart-card h3 {
    font-family: 'Rajdhani', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }
  .donut-wrap { position: relative; display: inline-block; }
  .donut-center {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
  .donut-val {
    font-family: 'Bebas Neue', cursive;
    font-size: 30px;
    line-height: 1;
    color: var(--text-primary);
  }
  .donut-sub { font-size: 9px; color: var(--text-secondary); letter-spacing: 1px; text-transform: uppercase; }
  .chart-legend { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
  .chart-leg-item { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
  .chart-leg-color { width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
  .chart-leg-label { display: flex; align-items: center; color: var(--text-secondary); }
  .chart-leg-val { font-weight: 600; color: var(--text-primary); }

  /* SEARCH */
  .search-wrap { position: relative; margin-bottom: 16px; }
  .search-input {
    width: 100%;
    max-width: 400px;
    background: var(--navy-light);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 16px 10px 38px;
    color: var(--text-primary);
    font-family: 'Noto Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input:focus { border-color: var(--saffron); }
  .search-input::placeholder { color: var(--text-secondary); }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 14px; }

  /* Responsive */
  @media (max-width: 900px) {
    .stats-bar { grid-template-columns: repeat(3, 1fr); }
    .swot-grid { grid-template-columns: 1fr; }
    .minority-grid { grid-template-columns: 1fr; }
    .charts-row { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .stats-bar { grid-template-columns: repeat(2, 1fr); }
    .tabs { flex-wrap: wrap; }
    .tab { flex: none; flex-basis: 48%; }
  }

  .hidden-row { display: none; }
</style>
</head>
<body>

<div class="header">
  <div class="dashboard">
    <div class="header-top">
      <div class="bjp-badge">BJP</div>
      <div>
        <h1>Political Intelligence Dashboard</h1>
        <div class="header-sub">Mangaluru City Corporation · 2023 State Elections · Booth-Level Analysis</div>
      </div>
    </div>
  </div>
</div>

<div class="dashboard">

  <!-- STATS BAR -->
  <div class="stats-bar">
    <div class="stat-card orange">
      <div class="stat-num orange">25</div>
      <div class="stat-label">Wards Won by BJP</div>
    </div>
    <div class="stat-card red">
      <div class="stat-num red">13</div>
      <div class="stat-label">Wards Won by Congress</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-num orange">56.1%</div>
      <div class="stat-label">Overall BJP Vote %</div>
    </div>
    <div class="stat-card red">
      <div class="stat-num red">42.0%</div>
      <div class="stat-label">Overall Congress Vote %</div>
    </div>
    <div class="stat-card green">
      <div class="stat-num green">2,46,952</div>
      <div class="stat-label">Total Registered Voters</div>
    </div>
    <div class="stat-card gold">
      <div class="stat-num gold">64.3%</div>
      <div class="stat-label">Overall Turnout</div>
    </div>
  </div>

  <!-- TABS -->
  <div class="tabs">
    <button class="tab active" onclick="showTab('political')">🏛️ Political SWOT</button>
    <button class="tab" onclick="showTab('wards')">📊 Ward Analysis</button>
    <button class="tab" onclick="showTab('minority')">🗺️ Demographic Dominance</button>
  </div>

  <!-- ===================== POLITICAL SWOT ===================== -->
  <div id="tab-political" class="section active">
    <div class="section-header">
      <h2>BJP Political SWOT Analysis</h2>
      <span class="section-badge" style="background:rgba(255,107,10,0.15);color:var(--saffron);border:1px solid rgba(255,107,10,0.3)">2023 Elections</span>
    </div>

    <!-- CHARTS ROW -->
    <div class="charts-row">
      <div class="chart-card">
        <h3>Ward Win Distribution</h3>
        <div class="donut-wrap">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <!-- BJP: 25/38 = 65.8% | Congress: 13/38 = 34.2% -->
            <!-- Circle circumference = 2*pi*45 = 282.7 -->
            <circle cx="65" cy="65" r="45" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18"/>
            <circle cx="65" cy="65" r="45" fill="none" stroke="var(--saffron)" stroke-width="18"
              stroke-dasharray="186 97" stroke-dashoffset="71" stroke-linecap="round"/>
            <circle cx="65" cy="65" r="45" fill="none" stroke="var(--congress-red)" stroke-width="18"
              stroke-dasharray="97 186" stroke-dashoffset="-116" stroke-linecap="round"/>
          </svg>
          <div class="donut-center">
            <div class="donut-val">25</div>
            <div class="donut-sub">BJP Wins</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="chart-leg-item">
            <span class="chart-leg-label"><span class="chart-leg-color" style="background:var(--saffron)"></span>BJP</span>
            <span class="chart-leg-val">25 (65.8%)</span>
          </div>
          <div class="chart-leg-item">
            <span class="chart-leg-label"><span class="chart-leg-color" style="background:var(--congress-red)"></span>Congress</span>
            <span class="chart-leg-val">13 (34.2%)</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Booth Strength Classification</h3>
        <div class="donut-wrap">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <!-- STRONG:8 MEDIUM:14 NARROW:3 LOST:13 total=38 -->
            <!-- circumference=282.7 STRONG=8/38*282.7=59.5 MEDIUM=14/38*282.7=104.2 NARROW=3/38*282.7=22.3 LOST=13/38*282.7=96.7 -->
            <circle cx="65" cy="65" r="45" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18"/>
            <circle cx="65" cy="65" r="45" fill="none" stroke="var(--strong)" stroke-width="18"
              stroke-dasharray="59.5 223.2" stroke-dashoffset="71" stroke-linecap="butt"/>
            <circle cx="65" cy="65" r="45" fill="none" stroke="var(--medium)" stroke-width="18"
              stroke-dasharray="104.2 178.5" stroke-dashoffset="11.5" stroke-linecap="butt"/>
            <circle cx="65" cy="65" r="45" fill="none" stroke="#FFD700" stroke-width="18"
              stroke-dasharray="22.3 260.4" stroke-dashoffset="-92.7" stroke-linecap="butt"/>
            <circle cx="65" cy="65" r="45" fill="none" stroke="var(--congress-red)" stroke-width="18"
              stroke-dasharray="96.7 186" stroke-dashoffset="-115" stroke-linecap="butt"/>
          </svg>
          <div class="donut-center">
            <div class="donut-val" style="font-size:22px">38</div>
            <div class="donut-sub">Wards</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="chart-leg-item"><span class="chart-leg-label"><span class="chart-leg-color" style="background:var(--strong)"></span>Strong Win</span><span class="chart-leg-val">8</span></div>
          <div class="chart-leg-item"><span class="chart-leg-label"><span class="chart-leg-color" style="background:var(--medium)"></span>Medium Win</span><span class="chart-leg-val">14</span></div>
          <div class="chart-leg-item"><span class="chart-leg-label"><span class="chart-leg-color" style="background:#FFD700"></span>Narrow Win</span><span class="chart-leg-val">3</span></div>
          <div class="chart-leg-item"><span class="chart-leg-label"><span class="chart-leg-color" style="background:var(--congress-red)"></span>Lost</span><span class="chart-leg-val">13</span></div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Polling Station Strength</h3>
        <div class="donut-wrap">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <!-- STRONG:33/38 AVG:5/38 -->
            <circle cx="65" cy="65" r="45" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18"/>
            <circle cx="65" cy="65" r="45" fill="none" stroke="var(--strong)" stroke-width="18"
              stroke-dasharray="245.8 36.9" stroke-dashoffset="71"/>
            <circle cx="65" cy="65" r="45" fill="none" stroke="var(--medium)" stroke-width="18"
              stroke-dasharray="36.9 245.8" stroke-dashoffset="-174.8"/>
          </svg>
          <div class="donut-center">
            <div class="donut-val">33</div>
            <div class="donut-sub">Strong PS</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="chart-leg-item"><span class="chart-leg-label"><span class="chart-leg-color" style="background:var(--strong)"></span>Strong Polling</span><span class="chart-leg-val">33 (87%)</span></div>
          <div class="chart-leg-item"><span class="chart-leg-label"><span class="chart-leg-color" style="background:var(--medium)"></span>Avg Polling</span><span class="chart-leg-val">5 (13%)</span></div>
        </div>
      </div>
    </div>

    <!-- SWOT GRID -->
    <div class="swot-grid">
      <!-- STRENGTHS -->
      <div class="swot-card">
        <div class="swot-card-header strength">💪 Strengths</div>
        <div class="swot-body">
          <div class="swot-point">
            <div class="swot-icon">🏆</div>
            <div class="swot-content">
              <h4>Dominant Ward Majority — <span class="swot-metric">25/38</span> Wards</h4>
              <p>BJP secured <strong>65.8%</strong> of all contested wards in Mangaluru MCC. Party commands majority across all zones including Derebail cluster and Padav cluster.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">📊</div>
            <div class="swot-content">
              <h4>Overall Vote Share Lead — <span class="swot-metric">+14.1%</span></h4>
              <p>BJP: <strong>56.13%</strong> vs Congress: <strong>42.04%</strong>. Total BJP votes: <strong>66,451</strong> versus Congress: <strong>89,998</strong> — however BJP wins more wards due to efficient vote distribution.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🔥</div>
            <div class="swot-content">
              <h4>8 Stronghold Wards — Lead >40%</h4>
              <p>Kambala (<span class="swot-metric">80.1%</span>), Central (<span class="swot-metric">78.2%</span>), Mannagudda (<span class="swot-metric">79.3%</span>), Boloor (<span class="swot-metric">71.3%</span>), Derebail Nairuthya (<span class="swot-metric">71.8%</span>), Kadri North (<span class="swot-metric">72.0%</span>), Dongarakery (<span class="swot-metric">71.3%</span>), Padav West (<span class="swot-metric">69.8%</span>).</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🗳️</div>
            <div class="swot-content">
              <h4>Strong Polling Infrastructure — <span class="swot-metric">33/38</span> Stations</h4>
              <p>87% of all polling stations classified as 'STRONG', indicating strong party presence, mobilization capacity, and booth management across the city.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🛕</div>
            <div class="swot-content">
              <h4>Hindu-majority Belt Dominance</h4>
              <p>BJP sweeps all Hindu-majority clusters: Derebail cluster (4 wards), Padav cluster (3 wards), Kadri cluster (2 wards), and all Boloor/Bolar corridor wards. Avg BJP% in Hindu-dominant wards: <span class="swot-metric">~65.8%</span>.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">📈</div>
            <div class="swot-content">
              <h4>High Voter Turnout in BJP Wards — <span class="swot-metric">64–73%</span></h4>
              <p>Boloor (72.98%), Alape South (69.99%), Padav West (70.94%) recorded highest turnouts — all BJP wins — suggesting strong grassroots mobilization in strongholds.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- WEAKNESSES -->
      <div class="swot-card">
        <div class="swot-card-header weakness">⚠️ Weaknesses</div>
        <div class="swot-body">
          <div class="swot-point">
            <div class="swot-icon">📉</div>
            <div class="swot-content">
              <h4>13 Lost Wards — Congress Lead <span class="swot-metric">-4.8% to -41.2%</span></h4>
              <p>Kudroli (<strong>−41.2%</strong>), Bendoor (<strong>−39.4%</strong>), Falnir (<strong>−34.0%</strong>), Bengre (<strong>−25.0%</strong>), Bunder (<strong>−25.6%</strong>) show heavy Congress dominance — all linked to Muslim-majority demographics.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🕌</div>
            <div class="swot-content">
              <h4>Zero Traction in Muslim-Majority Areas</h4>
              <p>In wards like Kudroli, Bengre, Bunder, Falnir, and Bendoor — where Muslim population exceeds 40–60% — BJP averages just <span class="swot-metric">~28–36%</span>. Congressional stranglehold with <strong>0 BJP gains</strong> in these booths.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">✝️</div>
            <div class="swot-content">
              <h4>Christian-Dominant Wards — Low BJP Vote</h4>
              <p>Falnir Booth 158 (96% Christian, BJP 12.5%), Jeppinamogar Booth 244 (96% Christian, BJP 14.7%), Bendoor Booth 167 (45% Christian, BJP 24.1%). Congress leads heavily in Christian-concentrated precincts.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">📌</div>
            <div class="swot-content">
              <h4>3 Narrow-Margin Wins — High Vulnerability</h4>
              <p>Attavara (<strong>+9.9%</strong>), Mangaladevi (<strong>+9.8%</strong>), Padav East (<strong>+7.5%</strong>) won with slim leads. Even a 5% swing can flip these to Congress in the next election cycle.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">📋</div>
            <div class="swot-content">
              <h4>5 Wards with Average Polling — Untapped Votes</h4>
              <p>Bendoor, Court, Falnir, Derebail South, Milagress have 'AVG' polling status. Low turnout in AVG stations means potential BJP votes being left unmobilized, especially in Derebail South (59.98% turnout, BJP wins).</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🔁</div>
            <div class="swot-content">
              <h4>Bajal Ward — Swing Seat Held by Congress</h4>
              <p>Bajal (Congress 52.9% vs BJP 44.5%, −11.4%) classified LOST despite STRONG polling. JDS factor: 94 JDS votes may have split pro-BJP vote. Winnable if JDS alliance formed.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- OPPORTUNITIES -->
      <div class="swot-card">
        <div class="swot-card-header opportunity">🚀 Opportunities</div>
        <div class="swot-body">
          <div class="swot-point">
            <div class="swot-icon">🤝</div>
            <div class="swot-content">
              <h4>JDS Alliance — Could Flip <span class="swot-metric">3–4</span> Wards</h4>
              <p>Bajal (94 JDS votes), Jeppu (15 JDS), Kannur (52 JDS) — combining JDS votes with BJP vote share would push BJP over Congress margin in these seats. Especially Bajal where combined BJP+JDS = <strong>45.9%</strong>.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🗓️</div>
            <div class="swot-content">
              <h4>Court Ward — Recoverable with Voter Drive</h4>
              <p>Court ward: only 48.8% turnout (lowest in constituency), BJP lost by −11.0%. If turnout increases to 65%, and BJP's base holds, estimated <strong>+350–400 net votes</strong> are accessible. Very winnable.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🌟</div>
            <div class="swot-content">
              <h4>Shivabagh & Valencia — Marginal Congress Wins</h4>
              <p>Shivabagh: Congress 51.6% vs BJP 46.7% (−4.8%). Valencia: Congress 53.5% vs BJP 44.6% (−8.9%). Both classified LOST with just 2,919–3,808 valid votes — very small margins, flippable.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">📱</div>
            <div class="swot-content">
              <h4>Derebail South — Strong BJP but Avg Polling</h4>
              <p>BJP already wins at 64.6% but polling status is AVG (59.98% turnout vs constituency avg 64.3%). Boosting turnout to 68% could add <strong>~250 additional BJP votes</strong> making it a medium-strength ward.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">👥</div>
            <div class="swot-content">
              <h4>Young Hindu Voter Mobilization in Narrow Wards</h4>
              <p>Attavara, Mangaladevi, Padav East have 15–20% Hindu youth non-participation estimated from voter roll. A targeted PVTG (first-time voter) campaign could double BJP's leads in these 3 wards.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🏗️</div>
            <div class="swot-content">
              <h4>Port Ward — 3 BJP Booths Already Won</h4>
              <p>Port ward classified LOST (−9.3%) but BJP won Booths 131, 208, 209, 210 in 2018. Target booth-level swing in Booths 148 and 149 (Muslim-heavy) with outreach to reduce margin.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- THREATS -->
      <div class="swot-card">
        <div class="swot-card-header threat">🛑 Threats</div>
        <div class="swot-body">
          <div class="swot-point">
            <div class="swot-icon">⚖️</div>
            <div class="swot-content">
              <h4>Unified Muslim–Christian Block — <span class="swot-metric">~28%</span> of Total Voters</h4>
              <p>Muslim-majority booths consistently deliver 85–95% Congress votes. If Muslim + Christian voters increase turnout from current ~67% to 80%, Congress can add <strong>~8,000–10,000 net votes</strong> citywide.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🔄</div>
            <div class="swot-content">
              <h4>Swing in 5 Congress-Won, "Strong" Polling Wards</h4>
              <p>Bengre, Bunder, Kannur, Jeppu, Port all have STRONG polling classification (high engagement) yet BJP lost. Congress is well-organized there. Consolidation risk: these wards could widen Congress lead.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">📊</div>
            <div class="swot-content">
              <h4>Congress Has Raw Vote Count Advantage — <span class="swot-metric">+23,547 Votes</span></h4>
              <p>Congress total: 89,998 vs BJP: 66,451. Congress's numerical vote surplus (concentration in fewer wards) means any electoral system change towards proportionality would hurt BJP significantly.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">🏙️</div>
            <div class="swot-content">
              <h4>Urban Demographic Shift — Bengre & Bunder Wards</h4>
              <p>Bengre (10,686 voters — highest in constituency) and Bunder are growing urban wards with increasing Muslim population density. BJP's vote share in Bengre: only <strong>36.4%</strong> with no clear pathway to recovery.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">⚡</div>
            <div class="swot-content">
              <h4>3 Narrow Wins Highly Vulnerable to Anti-Incumbency</h4>
              <p>Attavara (+9.9%), Mangaladevi (+9.8%), Padav East (+7.5%) — these wards with &lt;10% margin can easily flip. Any local governance dissatisfaction, or counter-mobilization, puts 3 seats at immediate risk.</p>
            </div>
          </div>
          <div class="swot-point">
            <div class="swot-icon">⬇️</div>
            <div class="swot-content">
              <h4>Low Booth Conversion in 3 War-Won Wards</h4>
              <p>Jeppu: 5 booths won, 2 lost. Kannur: 5 won, 2 lost. Bajal: LOST overall. Congress is making inroads into historically mixed wards. Continued booth-level losses indicate erosion of Hindu voter confidence in mixed zones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ===================== WARD ANALYSIS ===================== -->
  <div id="tab-wards" class="section">
    <div class="section-header">
      <h2>Ward-Level Numerical Analysis</h2>
      <span class="section-badge" style="background:rgba(0,200,81,0.15);color:var(--strong);border:1px solid rgba(0,200,81,0.3)">38 Wards</span>
    </div>

    <div class="legend-row">
      <div class="legend-item"><span class="legend-dot" style="background:var(--strong)"></span> Strong BJP (>40% lead)</div>
      <div class="legend-item"><span class="legend-dot" style="background:var(--medium)"></span> Medium BJP (15–40% lead)</div>
      <div class="legend-item"><span class="legend-dot" style="background:#FFD700"></span> Narrow BJP (&lt;15% lead)</div>
      <div class="legend-item"><span class="legend-dot" style="background:var(--weak)"></span> Congress Won</div>
    </div>

    <div class="ward-filters">
      <button class="filter-btn all-btn active" onclick="filterWards('all', this)">All Wards (38)</button>
      <button class="filter-btn strong-btn" onclick="filterWards('strong', this)">🔥 Strong BJP (8)</button>
      <button class="filter-btn medium-btn" onclick="filterWards('medium', this)">🟡 Medium BJP (14)</button>
      <button class="filter-btn" style="border-color:#FFD700;color:#FFD700" onclick="filterWards('narrow', this)">⚠️ Narrow BJP (3)</button>
      <button class="filter-btn weak-btn" onclick="filterWards('lost', this)">❌ Congress Won (13)</button>
    </div>

    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input type="text" class="search-input" placeholder="Search ward name..." oninput="searchWards(this.value)">
    </div>

    <div class="ward-table-wrap">
      <table class="ward-table" id="wardTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Ward Name</th>
            <th>Total Voters</th>
            <th>BJP Votes</th>
            <th>Congress Votes</th>
            <th>BJP %</th>
            <th>Congress %</th>
            <th>Lead / Deficit</th>
            <th>Margin</th>
            <th>Turnout</th>
            <th>Category</th>
            <th>PS Status</th>
            <th>Winner</th>
          </tr>
        </thead>
        <tbody id="wardTableBody">
        </tbody>
      </table>
    </div>
  </div>

  <!-- ===================== DEMOGRAPHIC DOMINANCE ===================== -->
  <div id="tab-minority" class="section">
    <div class="section-header">
      <h2>Demographic Dominance — Booth Level</h2>
      <span class="section-badge" style="background:rgba(100,100,255,0.15);color:#88AAFF;border:1px solid rgba(100,100,255,0.3)">Community Analysis</span>
    </div>

    <div class="minority-summary">
      <div class="min-sum-box">
        <div class="min-sum-num" style="color:#4DA6FF">15</div>
        <div class="min-sum-label">Muslim-Dominant Booths (&gt;50% Muslim voters)</div>
      </div>
      <div class="min-sum-box">
        <div class="min-sum-num" style="color:#CC88FF">23</div>
        <div class="min-sum-label">Christian-Dominant Booths (&gt;30% Christian voters)</div>
      </div>
      <div class="min-sum-box">
        <div class="min-sum-num" style="color:var(--weak)">~28%</div>
        <div class="min-sum-label">Est. Minority share of total electorate</div>
      </div>
      <div class="min-sum-box">
        <div class="min-sum-num" style="color:var(--saffron)">6/38</div>
        <div class="min-sum-label">Wards won by BJP despite minority presence (&gt;30%)</div>
      </div>
    </div>

    <div class="minority-grid">
      <!-- MUSLIM DOMINANCE -->
      <div class="minority-card">
        <div class="minority-header muslim">🕌 Muslim-Dominant Booths</div>
        <div class="minority-body" id="muslimBooths"></div>
      </div>
      <!-- CHRISTIAN DOMINANCE -->
      <div class="minority-card">
        <div class="minority-header christian">✝️ Christian-Dominant Booths</div>
        <div class="minority-body" id="christianBooths"></div>
      </div>
    </div>

    <!-- Ward-level minority summary table -->
    <div class="section-header" style="margin-top:12px">
      <h2 style="font-size:20px">Wards by Dominant Community & BJP Performance</h2>
    </div>
    <div class="ward-table-wrap">
      <table class="ward-table">
        <thead>
          <tr>
            <th>Ward</th>
            <th>Dominant Majority</th>
            <th>Muslim %</th>
            <th>Christian %</th>
            <th>BJP %</th>
            <th>Congress %</th>
            <th>BJP Lead</th>
            <th>Winner</th>
            <th>BJP Viability</th>
          </tr>
        </thead>
        <tbody id="minorityTableBody"></tbody>
      </table>
    </div>
  </div>

</div><!-- /dashboard -->

<script>
// ==================== DATA ====================
const wardData = [
  { ward: 'ATTAVARA', voters: 6626, bjp: 2279, cong: 1907, jds: 12, bjpPct: 54.29, congPct: 44.35, lead: 9.94, cat: 'NARROW', ps: 'STRONG', winner: 'BJP', turnout: 64.23 },
  { ward: 'ALAPE SOUTH', voters: 5712, bjp: 2746, cong: 1194, jds: 14, bjpPct: 67.05, congPct: 31.02, lead: 36.03, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 69.99 },
  { ward: 'ALAPE NORTH', voters: 7133, bjp: 2739, cong: 1952, jds: 14, bjpPct: 57.13, congPct: 41.39, lead: 15.74, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 67.1 },
  { ward: 'BAJAL', voters: 8173, bjp: 2406, cong: 3162, jds: 94, bjpPct: 44.54, congPct: 52.93, lead: -11.36, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 69.53 },
  { ward: 'BEJAI', voters: 7216, bjp: 2652, cong: 1690, jds: 14, bjpPct: 59.44, congPct: 38.33, lead: 21.11, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 61.49 },
  { ward: 'BENDOOR', voters: 5932, bjp: 999, cong: 2306, jds: 17, bjpPct: 29.4, congPct: 68.82, lead: -39.41, cat: 'LOST', ps: 'AVG', winner: 'CONGRESS', turnout: 56.89 },
  { ward: 'BENGRE', voters: 10686, bjp: 2693, cong: 4694, jds: 109, bjpPct: 36.37, congPct: 61.32, lead: -24.96, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 71.56 },
  { ward: 'BOLAR', voters: 6289, bjp: 2642, cong: 1460, jds: 9, bjpPct: 62.42, congPct: 36.21, lead: 26.21, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 65.41 },
  { ward: 'BOLOOR', voters: 5050, bjp: 2575, cong: 946, jds: 10, bjpPct: 71.31, congPct: 26.88, lead: 44.43, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 72.98 },
  { ward: 'BUNDER', voters: 5630, bjp: 1150, cong: 2329, jds: 29, bjpPct: 36.06, congPct: 61.71, lead: -25.65, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 63.3 },
  { ward: 'CENTRAL', voters: 4808, bjp: 2426, cong: 538, jds: 6, bjpPct: 78.22, congPct: 19.61, lead: 58.61, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 62.86 },
  { ward: 'CONTONMENT', voters: 5070, bjp: 1917, cong: 1112, jds: 9, bjpPct: 63.82, congPct: 34.71, lead: 29.11, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 60.11 },
  { ward: 'COURT', voters: 4766, bjp: 986, cong: 1313, jds: 6, bjpPct: 43.76, congPct: 54.8, lead: -11.03, cat: 'LOST', ps: 'AVG', winner: 'CONGRESS', turnout: 48.76 },
  { ward: 'DEREBAIL NAIRUTHYA', voters: 8457, bjp: 3946, cong: 1429, jds: 16, bjpPct: 71.76, congPct: 26.32, lead: 45.44, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 64.47 },
  { ward: 'DEREBAIL SOUTH', voters: 7504, bjp: 2923, cong: 1546, jds: 25, bjpPct: 64.63, congPct: 32.98, lead: 31.64, cat: 'MEDIUM', ps: 'AVG', winner: 'BJP', turnout: 59.98 },
  { ward: 'DEREBAIL WEST', voters: 6198, bjp: 2769, cong: 1370, jds: 14, bjpPct: 65.97, congPct: 32.31, lead: 33.66, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 67.36 },
  { ward: 'DONGARAKERY', voters: 7613, bjp: 3555, cong: 1068, jds: 13, bjpPct: 71.26, congPct: 26.82, lead: 44.44, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 62.2 },
  { ward: 'FALNIR', voters: 6373, bjp: 1116, cong: 2452, jds: 8, bjpPct: 32.07, congPct: 66.12, lead: -34.04, cat: 'LOST', ps: 'AVG', winner: 'CONGRESS', turnout: 58.84 },
  { ward: 'HOIGE BAZAR', voters: 5937, bjp: 2200, cong: 1583, jds: 10, bjpPct: 58.16, congPct: 40.69, lead: 17.47, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 65.03 },
  { ward: 'JEPPINAMOGAR', voters: 7227, bjp: 3038, cong: 1856, jds: 13, bjpPct: 60.47, congPct: 38.09, lead: 22.38, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 69.29 },
  { ward: 'JEPPU', voters: 7458, bjp: 2075, cong: 2362, jds: 15, bjpPct: 44.83, congPct: 52.9, lead: -8.07, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 60.31 },
  { ward: 'KADRI NORTH', voters: 6796, bjp: 3196, cong: 1165, jds: 11, bjpPct: 71.97, congPct: 26.13, lead: 45.84, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 65.5 },
  { ward: 'KADRI SOUTH', voters: 5183, bjp: 1851, cong: 1234, jds: 7, bjpPct: 59.17, congPct: 38.91, lead: 20.26, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 61.19 },
  { ward: 'KANKANADY', voters: 7452, bjp: 3289, cong: 1959, jds: 13, bjpPct: 61.71, congPct: 36.51, lead: 25.19, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 71.52 },
  { ward: 'KAMBALA', voters: 5471, bjp: 2768, cong: 573, jds: 6, bjpPct: 80.08, congPct: 17.58, lead: 62.49, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 62.06 },
  { ward: 'KANNUR', voters: 6929, bjp: 1807, cong: 2768, jds: 52, bjpPct: 40.63, congPct: 57.02, lead: -16.39, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 67.78 },
  { ward: 'KODIALBAIL', voters: 5908, bjp: 2543, cong: 1188, jds: 14, bjpPct: 66.41, congPct: 31.64, lead: 34.77, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 65.12 },
  { ward: 'KUDROLI', voters: 5552, bjp: 1024, cong: 2669, jds: 10, bjpPct: 28.95, congPct: 70.17, lead: -41.21, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 67.22 },
  { ward: 'MANGALADEVI', voters: 6107, bjp: 2180, cong: 1722, jds: 15, bjpPct: 54.08, congPct: 44.33, lead: 9.75, cat: 'NARROW', ps: 'STRONG', winner: 'BJP', turnout: 65.08 },
  { ward: 'MANNAGUDDA', voters: 7740, bjp: 3839, cong: 889, jds: 9, bjpPct: 79.25, congPct: 18.71, lead: 60.54, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 61.75 },
  { ward: 'MAROLI', voters: 6847, bjp: 2864, cong: 1597, jds: 15, bjpPct: 62.02, congPct: 36.42, lead: 25.6, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 64.84 },
  { ward: 'MILAGRESS', voters: 6738, bjp: 1467, cong: 2200, jds: 7, bjpPct: 38.13, congPct: 60.08, lead: -21.95, cat: 'LOST', ps: 'AVG', winner: 'CONGRESS', turnout: 55.36 },
  { ward: 'PADAV CENTRAL', voters: 9255, bjp: 3799, cong: 2498, jds: 16, bjpPct: 59.01, congPct: 39.54, lead: 19.47, cat: 'MEDIUM', ps: 'STRONG', winner: 'BJP', turnout: 68.85 },
  { ward: 'PADAV EAST', voters: 4204, bjp: 1388, cong: 1247, jds: 7, bjpPct: 52.5, congPct: 44.98, lead: 7.53, cat: 'NARROW', ps: 'STRONG', winner: 'BJP', turnout: 64.98 },
  { ward: 'PADAV WEST', voters: 7450, bjp: 3668, cong: 1496, jds: 23, bjpPct: 69.8, congPct: 28.26, lead: 41.53, cat: 'STRONG', ps: 'STRONG', winner: 'BJP', turnout: 70.94 },
  { ward: 'PORT', voters: 4295, bjp: 1254, cong: 1557, jds: 11, bjpPct: 44.71, congPct: 53.96, lead: -9.25, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 66.15 },
  { ward: 'SHIVABAGH', voters: 4751, bjp: 1400, cong: 1486, jds: 9, bjpPct: 46.74, congPct: 51.56, lead: -4.83, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 62.38 },
  { ward: 'VALENCIA', voters: 6416, bjp: 1829, cong: 1934, jds: 7, bjpPct: 44.64, congPct: 53.49, lead: -8.85, cat: 'LOST', ps: 'STRONG', winner: 'CONGRESS', turnout: 60.1 },
];

const muslimBooths = [
  { ward: 'BENGRE', booth: 99, voters: 1399, muslimPct: 99.9, bjpPct: 5.3, congPct: 91.8 },
  { ward: 'BENGRE', booth: 97, voters: 777, muslimPct: 100, bjpPct: 4.6, congPct: 92.5 },
  { ward: 'BENGRE', booth: 100, voters: 1285, muslimPct: 100, bjpPct: 7.9, congPct: 87.8 },
  { ward: 'BENGRE', booth: 98, voters: 1230, muslimPct: 100, bjpPct: 12.2, congPct: 84.6 },
  { ward: 'BUNDER', booth: 119, voters: 1080, muslimPct: 99.6, bjpPct: 0.9, congPct: 95.9 },
  { ward: 'BUNDER', booth: 118, voters: 883, muslimPct: 86.8, bjpPct: 17.2, congPct: 81.4 },
  { ward: 'BUNDER', booth: 112, voters: 628, muslimPct: 58.1, bjpPct: 87.3, congPct: 10.8 },
  { ward: 'COURT', booth: 142, voters: 1160, muslimPct: 56.4, bjpPct: 23.6, congPct: 75.7 },
  { ward: 'DONGARAKERI', booth: 111, voters: 731, muslimPct: 58.1, bjpPct: 31.3, congPct: 67.9 },
  { ward: 'DONGARAKERI', booth: 108, voters: 1257, muslimPct: 55.3, bjpPct: 85.3, congPct: 12.6 },
  { ward: 'JEPPU', booth: 241, voters: 1070, muslimPct: 55.5, bjpPct: 30.2, congPct: 68.3 },
  { ward: 'KANNUR', booth: 199, voters: 737, muslimPct: 92.7, bjpPct: 6.3, congPct: 91.0 },
  { ward: 'KANNUR', booth: 196, voters: 1546, muslimPct: 94.9, bjpPct: 5.8, congPct: 92.6 },
  { ward: 'KUDROLI', booth: 105, voters: 1120, muslimPct: 79.7, bjpPct: 19.3, congPct: 80.1 },
  { ward: 'MILAGRESS', booth: 165, voters: 1271, muslimPct: 51.7, bjpPct: 30.5, congPct: 67.2 },
];

const christianBooths = [
  { ward: 'FALNIR', booth: 158, voters: 515, christianPct: 96.1, bjpPct: 12.5, congPct: 85.7 },
  { ward: 'JEPPINAMOGAR', booth: 244, voters: 752, christianPct: 96.0, bjpPct: 14.7, congPct: 85.1 },
  { ward: 'BENDOOR', booth: 129, voters: 922, christianPct: 53.7, bjpPct: 32.3, congPct: 65.9 },
  { ward: 'BENDOOR', booth: 167, voters: 836, christianPct: 45.4, bjpPct: 24.1, congPct: 74.6 },
  { ward: 'BENDOOR', booth: 136, voters: 1154, christianPct: 46.7, bjpPct: 40.0, congPct: 58.5 },
  { ward: 'PADAV CENTRAL', booth: 41, voters: 1319, christianPct: 56.4, bjpPct: 34.7, congPct: 63.8 },
  { ward: 'JEPPU', booth: 156, voters: 948, christianPct: 38.9, bjpPct: 39.8, congPct: 58.6 },
  { ward: 'JEPPU', booth: 155, voters: 757, christianPct: 54.3, bjpPct: 47.4, congPct: 45.2 },
  { ward: 'JEPPU', booth: 154, voters: 785, christianPct: 43.5, bjpPct: 39.5, congPct: 59.3 },
  { ward: 'KADRI SOUTH', booth: 57, voters: 1386, christianPct: 41.3, bjpPct: 41.6, congPct: 56.8 },
  { ward: 'SHIVABAGH', booth: 135, voters: 1241, christianPct: 43.3, bjpPct: 46.7, congPct: 52.1 },
  { ward: 'FALNIR', booth: 168, voters: 874, christianPct: 54.8, bjpPct: 36.5, congPct: 60.9 },
  { ward: 'FALNIR', booth: 169, voters: 673, christianPct: 40.4, bjpPct: 49.3, congPct: 48.1 },
  { ward: 'VALENCIA', booth: 133, voters: 972, christianPct: 43.4, bjpPct: 23.4, congPct: 73.5 },
  { ward: 'VALENCIA', booth: 174, voters: 1329, christianPct: 31.8, bjpPct: 57.3, congPct: 41.6 },
  { ward: 'MILAGRESS', booth: 166, voters: 1143, christianPct: 33.3, bjpPct: 29.8, congPct: 68.7 },
  { ward: 'ALAPE NORTH', booth: 192, voters: 1034, christianPct: 39.8, bjpPct: 49.7, congPct: 48.7 },
  { ward: 'BEJAI', booth: 21, voters: 896, christianPct: 33.0, bjpPct: 54.3, congPct: 42.4 },
  { ward: 'BAJAL', booth: 208, voters: 500, christianPct: 31.7, bjpPct: 55.9, congPct: 43.5 },
  { ward: 'PADAV CENTRAL', booth: 42, voters: 1330, christianPct: 42.0, bjpPct: 49.0, congPct: 49.6 },
  { ward: 'DEREBAIL WEST', booth: 3, voters: 806, christianPct: 33.0, bjpPct: 58.2, congPct: 40.0 },
  { ward: 'KODIALBAIL', booth: 24, voters: 980, christianPct: 34.1, bjpPct: 55.3, congPct: 43.3 },
  { ward: 'MAROLI', booth: 50, voters: 1135, christianPct: 36.0, bjpPct: 60.7, congPct: 37.3 },
];

// Ward minority data
const wardMinorityData = [
  { ward: 'BENGRE', dominant: 'MUSLIM', muslimPct: '~65%', christianPct: '~5%', bjpPct: 36.37, congPct: 61.32, lead: -24.96, winner: 'CONGRESS', viability: 'Very Low' },
  { ward: 'KUDROLI', dominant: 'MUSLIM', muslimPct: '~55%', christianPct: '~3%', bjpPct: 28.95, congPct: 70.17, lead: -41.21, winner: 'CONGRESS', viability: 'None' },
  { ward: 'BENDOOR', dominant: 'MUSLIM+CHRISTIAN', muslimPct: '~35%', christianPct: '~35%', bjpPct: 29.4, congPct: 68.82, lead: -39.41, winner: 'CONGRESS', viability: 'None' },
  { ward: 'FALNIR', dominant: 'MUSLIM+CHRISTIAN', muslimPct: '~35%', christianPct: '~30%', bjpPct: 32.07, congPct: 66.12, lead: -34.04, winner: 'CONGRESS', viability: 'Low' },
  { ward: 'BUNDER', dominant: 'MUSLIM', muslimPct: '~55%', christianPct: '~5%', bjpPct: 36.06, congPct: 61.71, lead: -25.65, winner: 'CONGRESS', viability: 'Low' },
  { ward: 'KANNUR', dominant: 'MUSLIM', muslimPct: '~60%', christianPct: '~5%', bjpPct: 40.63, congPct: 57.02, lead: -16.39, winner: 'CONGRESS', viability: 'Low' },
  { ward: 'BAJAL', dominant: 'MIXED', muslimPct: '~25%', christianPct: '~10%', bjpPct: 44.54, congPct: 52.93, lead: -11.36, winner: 'CONGRESS', viability: 'Medium (with JDS alliance)' },
  { ward: 'JEPPU', dominant: 'MIXED', muslimPct: '~20%', christianPct: '~20%', bjpPct: 44.83, congPct: 52.9, lead: -8.07, winner: 'CONGRESS', viability: 'Medium' },
  { ward: 'VALENCIA', dominant: 'CHRISTIAN+MIXED', muslimPct: '~10%', christianPct: '~30%', bjpPct: 44.64, congPct: 53.49, lead: -8.85, winner: 'CONGRESS', viability: 'Medium' },
  { ward: 'SHIVABAGH', dominant: 'MIXED', muslimPct: '~15%', christianPct: '~25%', bjpPct: 46.74, congPct: 51.56, lead: -4.83, winner: 'CONGRESS', viability: 'High' },
  { ward: 'MILAGRESS', dominant: 'MIXED', muslimPct: '~20%', christianPct: '~20%', bjpPct: 38.13, congPct: 60.08, lead: -21.95, winner: 'CONGRESS', viability: 'Low' },
  { ward: 'PORT', dominant: 'MIXED', muslimPct: '~25%', christianPct: '~10%', bjpPct: 44.71, congPct: 53.96, lead: -9.25, winner: 'CONGRESS', viability: 'Medium' },
  { ward: 'COURT', dominant: 'MIXED', muslimPct: '~30%', christianPct: '~10%', bjpPct: 43.76, congPct: 54.8, lead: -11.03, winner: 'CONGRESS', viability: 'Medium (low turnout leverage)' },
  { ward: 'BEJAI', dominant: 'HINDU-DOMINANT', muslimPct: '~5%', christianPct: '~25%', bjpPct: 59.44, congPct: 38.33, lead: 21.11, winner: 'BJP', viability: 'Safe' },
  { ward: 'ALAPE NORTH', dominant: 'MIXED', muslimPct: '~5%', christianPct: '~30%', bjpPct: 57.13, congPct: 41.39, lead: 15.74, winner: 'BJP', viability: 'Safe' },
];

// ==================== RENDER FUNCTIONS ====================
function renderWardTable(filter = 'all', search = '') {
  const tbody = document.getElementById('wardTableBody');
  tbody.innerHTML = '';
  let i = 0;
  wardData.forEach(w => {
    const catKey = w.cat.toLowerCase() === 'medium' ? 'medium' :
                   w.cat.toLowerCase() === 'strong' ? 'strong' :
                   w.cat.toLowerCase() === 'narrow' ? 'narrow' : 'lost';
    const matchFilter = filter === 'all' || catKey === filter;
    const matchSearch = w.ward.toLowerCase().includes(search.toLowerCase());
    if (!matchFilter || !matchSearch) return;
    i++;
    const catClass = catKey === 'strong' ? 'cat-strong' : catKey === 'medium' ? 'cat-medium' : catKey === 'narrow' ? 'cat-narrow' : 'cat-lost';
    const leadClass = w.lead >= 0 ? 'diff-pos' : 'diff-neg';
    const leadStr = w.lead >= 0 ? `+${w.lead.toFixed(1)}%` : `${w.lead.toFixed(1)}%`;
    const winnerColor = w.winner === 'BJP' ? 'var(--saffron)' : 'var(--congress-red)';
    tr = `<tr>
      <td style="color:var(--text-secondary)">${i}</td>
      <td style="font-weight:600">${w.ward}</td>
      <td>${w.voters.toLocaleString()}</td>
      <td style="color:var(--saffron)">${w.bjp.toLocaleString()}</td>
      <td style="color:#FF8888">${w.cong.toLocaleString()}</td>
      <td>
        <div class="pbar-wrap">
          <div class="pbar"><div class="pbar-fill" style="width:${w.bjpPct}%"></div></div>
          <span style="color:var(--saffron);font-weight:600;min-width:42px">${w.bjpPct}%</span>
        </div>
      </td>
      <td>
        <div class="pbar-wrap">
          <div class="pbar"><div class="pbar-fill cong" style="width:${w.congPct}%"></div></div>
          <span style="color:#FF8888;font-weight:600;min-width:42px">${w.congPct}%</span>
        </div>
      </td>
      <td class="${leadClass}">${leadStr}</td>
      <td><span class="cat-badge ${catClass}">${w.cat}</span></td>
      <td style="color:var(--text-secondary)">${w.turnout}%</td>
      <td><span style="font-size:11px;color:var(--text-secondary);letter-spacing:1px;text-transform:uppercase">${w.ps}</span></td>
      <td><span style="font-weight:700;color:${winnerColor}">${w.winner}</span></td>
    </tr>`;
    tbody.innerHTML += tr;
  });
}

function filterWards(filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const search = document.querySelector('.search-input').value;
  renderWardTable(filter, search);
}

function searchWards(val) {
  const activeBtn = document.querySelector('.filter-btn.active');
  const filter = activeBtn ? activeBtn.textContent.includes('Strong') ? 'strong' :
    activeBtn.textContent.includes('Medium') ? 'medium' :
    activeBtn.textContent.includes('Narrow') ? 'narrow' :
    activeBtn.textContent.includes('Congress') ? 'lost' : 'all' : 'all';
  renderWardTable(filter, val);
}

function renderMuslimBooths() {
  const el = document.getElementById('muslimBooths');
  el.innerHTML = muslimBooths.map(b => `
    <div class="booth-row">
      <div class="ward-tag">${b.ward}</div>
      <div class="booth-row-top">
        <div class="booth-name">Booth #${b.booth}</div>
        <div class="booth-num">${b.voters.toLocaleString()} voters</div>
      </div>
      <div class="booth-stats">
        <span class="mini-stat pct">🕌 ${b.muslimPct.toFixed(0)}% Muslim</span>
        <span class="mini-stat bjp-s">BJP ${b.bjpPct.toFixed(1)}%</span>
        <span class="mini-stat cong-s">INC ${b.congPct.toFixed(1)}%</span>
      </div>
      <div class="booth-bar-wrap">
        <div class="booth-bar-bjp" style="width:${b.bjpPct}%"></div>
        <div class="booth-bar-cong" style="width:${b.congPct}%"></div>
        <div class="booth-bar-oth"></div>
      </div>
    </div>
  `).join('');
}

function renderChristianBooths() {
  const el = document.getElementById('christianBooths');
  el.innerHTML = christianBooths.map(b => `
    <div class="booth-row">
      <div class="ward-tag">${b.ward}</div>
      <div class="booth-row-top">
        <div class="booth-name">Booth #${b.booth}</div>
        <div class="booth-num">${b.voters.toLocaleString()} voters</div>
      </div>
      <div class="booth-stats">
        <span class="mini-stat" style="background:rgba(150,50,200,0.15);color:#CC88FF">✝️ ${b.christianPct.toFixed(0)}% Christian</span>
        <span class="mini-stat bjp-s">BJP ${b.bjpPct.toFixed(1)}%</span>
        <span class="mini-stat cong-s">INC ${b.congPct.toFixed(1)}%</span>
      </div>
      <div class="booth-bar-wrap">
        <div class="booth-bar-bjp" style="width:${b.bjpPct}%"></div>
        <div class="booth-bar-cong" style="width:${b.congPct}%"></div>
        <div class="booth-bar-oth"></div>
      </div>
    </div>
  `).join('');
}

function renderMinorityTable() {
  const tbody = document.getElementById('minorityTableBody');
  tbody.innerHTML = wardMinorityData.map(w => {
    const leadClass = w.lead >= 0 ? 'diff-pos' : 'diff-neg';
    const leadStr = w.lead >= 0 ? `+${w.lead.toFixed(1)}%` : `${w.lead.toFixed(1)}%`;
    const winColor = w.winner === 'BJP' ? 'var(--saffron)' : 'var(--congress-red)';
    const viabColor = w.viability === 'None' ? '#FF4444' : w.viability === 'Very Low' || w.viability === 'Low' ? '#FF9944' : w.viability === 'Medium' || w.viability.startsWith('Medium') ? '#FFD700' : w.viability === 'High' ? '#88FF88' : '#00C851';
    const domBg = w.dominant.includes('MUSLIM') ? 'rgba(0,100,200,0.15)' : w.dominant.includes('CHRISTIAN') ? 'rgba(150,50,200,0.15)' : w.dominant.includes('MIXED') ? 'rgba(100,100,100,0.15)' : 'rgba(200,130,0,0.12)';
    const domColor = w.dominant.includes('MUSLIM') ? '#4DA6FF' : w.dominant.includes('CHRISTIAN') ? '#CC88FF' : w.dominant.includes('MIXED') ? '#AAAAAA' : '#FFB877';
    return `<tr>
      <td style="font-weight:600">${w.ward}</td>
      <td><span style="background:${domBg};color:${domColor};padding:3px 8px;border-radius:10px;font-size:11px;font-weight:600;letter-spacing:0.5px">${w.dominant}</span></td>
      <td style="color:#4DA6FF">${w.muslimPct}</td>
      <td style="color:#CC88FF">${w.christianPct}</td>
      <td style="color:var(--saffron);font-weight:600">${w.bjpPct}%</td>
      <td style="color:#FF8888">${w.congPct}%</td>
      <td class="${leadClass}">${leadStr}</td>
      <td style="font-weight:700;color:${winColor}">${w.winner}</td>
      <td><span style="color:${viabColor};font-size:12px;font-weight:600">${w.viability}</span></td>
    </tr>`;
  }).join('');
}

function showTab(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  event.target.classList.add('active');
}

// Init
renderWardTable();
renderMuslimBooths();
renderChristianBooths();
renderMinorityTable();
</script>
</body>
</html>