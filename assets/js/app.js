/* =====================================================
   ENCUESTA COLABORADORES PARACEL
   Main Application Logic
   ===================================================== */

'use strict';

// ── CONSTANTS ──────────────────────────────────────────
const APP_VERSION = '2.0.0';
const STORAGE_KEY  = 'paracel_encuesta_app_v2';
const DRAFT_KEY    = 'paracel_encuesta_draft';
const CURRENT_YEAR = new Date().getFullYear();

// Chart.js defaults for dark theme
const CHART_COLORS = {
  green:   ['#22c55e','#16a34a','#4ade80','#166534','#15803d','#86efac'],
  mixed:   ['#22c55e','#38bdf8','#f59e0b','#a78bfa','#f87171','#34d399','#fb923c','#e879f9'],
  single:  '#22c55e',
  grid:    'rgba(255,255,255,0.05)',
  text:    '#9fcfab',
};

// ── APP STATE ──────────────────────────────────────────
let APP = {
  user:     null,   // { username, role: 'admin'|'viewer', displayName }
  year:     String(CURRENT_YEAR),
  data:     [],     // loaded survey rows
  loading:  false,
  charts:   {},     // chart instances keyed by id
  currentView: 'dashboard',
  colabPage:   1,
  respPage:    1,
  respSearch:  '',
  respFilters: {},
};

// ── PERSISTENCE ────────────────────────────────────────
function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultDB();
  } catch { return getDefaultDB(); }
}
function saveDB(db) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch(e) { console.warn('saveDB error', e); }
}
function getDefaultDB() {
  return {
    version: APP_VERSION,
    config: {
      sheetUrl2024: '',
      sheetUrl2025: '',
      sheetUrl2026: '',
      appsScriptUrl: '',
      emailjsServiceId: '',
      emailjsTemplateId: '',
      emailjsPublicKey: '',
      orgName: 'Paracel S.A.',
      logoUrl: '',
      activeYears: ['2025','2026'],
      sendFromEmail: '',
      emailSubject: 'Encuesta de Colaboradores Paracel {{year}}',
      emailBody: 'Estimado/a {{nombre}},\n\nLe invitamos a completar la Encuesta de Colaboradores Paracel {{year}}. Su participación es voluntaria y confidencial.\n\nAcceda aquí: {{link}}\n\nGracias.',
    },
    users: [
      { id: 'u1', username: 'diego',  password: '456', role: 'admin',  displayName: 'Diego Admin', email: '', active: true },
      { id: 'u2', username: 'user',   password: '123', role: 'viewer', displayName: 'Visualizador',email: '', active: true },
    ],
    colaboradores: [],  // { id, ci, nombre, sexo, tipo, email, telefono, empresa, area, year, status: 'pendiente'|'enviado'|'completado', sentAt, tokenLink }
    responses2024: [],
    responses2025: [],
    responses2026: [],
  };
}
let DB = loadDB();

// ── AUTH ───────────────────────────────────────────────
function login(username, password) {
  const user = DB.users.find(u =>
    u.active && u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) return false;
  APP.user = { username: user.username, role: user.role, displayName: user.displayName, id: user.id };
  sessionStorage.setItem('appUser', JSON.stringify(APP.user));
  return true;
}
function logout() {
  APP.user = null;
  sessionStorage.removeItem('appUser');
  showLogin();
}
function restoreSession() {
  try {
    const u = sessionStorage.getItem('appUser');
    if (u) { APP.user = JSON.parse(u); return true; }
  } catch {}
  return false;
}
function isAdmin() { return APP.user && APP.user.role === 'admin'; }

// ── INITIALIZATION ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (restoreSession()) {
    showApp();
  } else {
    showLogin();
  }
  setupLoginForm();
  setupNavigation();
  setupYearSelector();
  setupSyncButton();
  setupSidebarMobile();
});

function showLogin() {
  document.getElementById('view-login').style.display = 'flex';
  document.getElementById('app-shell').classList.remove('active');
}
function showApp() {
  document.getElementById('view-login').style.display = 'none';
  document.getElementById('app-shell').classList.add('active');
  applyRoleRestrictions();
  updateSidebarUser();
  populateYearSelector();
  navigateTo(APP.currentView || 'dashboard');
}

function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const err  = document.getElementById('login-error');
    if (login(user, pass)) {
      err.classList.remove('show');
      showApp();
    } else {
      err.textContent = 'Usuario o contraseña incorrectos.';
      err.classList.add('show');
    }
  });
  document.getElementById('btn-logout')?.addEventListener('click', logout);
}

function applyRoleRestrictions() {
  document.querySelectorAll('[data-admin-only]').forEach(el => {
    el.style.display = isAdmin() ? '' : 'none';
  });
}
function updateSidebarUser() {
  const u = APP.user;
  if (!u) return;
  document.getElementById('sidebar-user-name').textContent  = u.displayName || u.username;
  document.getElementById('sidebar-user-role').textContent  = u.role === 'admin' ? 'Administrador' : 'Visualizador';
  document.getElementById('sidebar-user-avatar').textContent = (u.displayName || u.username)[0].toUpperCase();
}

function populateYearSelector() {
  const sel = document.getElementById('year-select');
  if (!sel) return;
  const years = DB.config.activeYears.length ? DB.config.activeYears : ['2024','2025','2026'];
  sel.innerHTML = years.map(y => `<option value="${y}" ${y === APP.year ? 'selected' : ''}>${y}</option>`).join('');
}

function setupYearSelector() {
  const sel = document.getElementById('year-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    APP.year = sel.value;
    loadYearData().then(() => refreshCurrentView());
    toast(`Año ${APP.year} seleccionado`, 'info');
  });
}

function setupSyncButton() {
  document.getElementById('btn-sync')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync');
    btn.classList.add('spinning');
    btn.disabled = true;
    await loadYearData(true);
    btn.classList.remove('spinning');
    btn.disabled = false;
    toast('Datos sincronizados correctamente', 'success');
    refreshCurrentView();
  });
}

function setupSidebarMobile() {
  const toggle = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  const sidebar = document.getElementById('sidebar');
  toggle?.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); });
  overlay?.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); });
}

// ── NAVIGATION ─────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const view = el.dataset.view;
      // check admin restriction
      if (el.dataset.adminOnly && !isAdmin()) { toast('Acceso restringido', 'warning'); return; }
      navigateTo(view);
      // close mobile sidebar
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('show');
    });
  });
}

async function navigateTo(viewId) {
  // hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // show target
  const viewEl = document.getElementById('view-' + viewId);
  if (!viewEl) return;
  viewEl.classList.add('active');
  document.querySelector(`[data-view="${viewId}"]`)?.classList.add('active');
  APP.currentView = viewId;

  // Update header breadcrumb
  const titles = {
    dashboard:    'Dashboard',
    respuestas:   'Respuestas',
    colaboradores:'Colaboradores',
    emails:       'Envío Masivo',
    encuesta:     'Cuestionario',
    usuarios:     'Usuarios',
    config:       'Configuración',
    acerca:       'Acerca de',
  };
  document.getElementById('header-title').textContent = titles[viewId] || viewId;

  // lazy-load view data
  if (!APP.data.length) await loadYearData();
  await renderView(viewId);
}

async function renderView(viewId) {
  switch (viewId) {
    case 'dashboard':    renderDashboard();    break;
    case 'respuestas':   renderRespuestas();   break;
    case 'colaboradores':renderColaboradores(); break;
    case 'emails':       renderEmails();        break;
    case 'encuesta':     renderEncuesta();      break;
    case 'usuarios':     renderUsuarios();      break;
    case 'config':       renderConfig();        break;
    case 'acerca':       break;
  }
}
function refreshCurrentView() { renderView(APP.currentView); }

// ── DATA LOADING ───────────────────────────────────────
async function loadYearData(force = false) {
  const year = APP.year;
  const key  = `responses${year}`;
  const urlKey = `sheetUrl${year}`;
  const sheetUrl = DB.config[urlKey];

  // If we already have data in memory and not forced
  if (APP.data.length && !force) return;

  // First try to use locally stored responses
  APP.data = DB[key] || [];

  // Try to fetch from Google Sheets if URL is configured
  if (sheetUrl) {
    APP.loading = true;
    try {
      const rows = await fetchSheetData(sheetUrl);
      if (rows && rows.length) {
        APP.data = rows;
        DB[key]  = rows;
        saveDB(DB);
      }
    } catch(e) {
      console.warn('Could not fetch sheet data:', e);
    } finally {
      APP.loading = false;
    }
  }
}

async function fetchSheetData(url) {
  // Support two formats:
  // 1. Google Sheets published CSV: https://docs.google.com/spreadsheets/d/...output=csv
  // 2. Apps Script endpoint returning JSON
  if (url.includes('output=csv') || url.includes('.csv')) {
    const res  = await fetch(url);
    const text = await res.text();
    return parseCsv(text);
  } else if (url.includes('script.google.com') || url.includes('json')) {
    const res  = await fetch(url);
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data || []);
  }
  return null;
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim());
  return lines.slice(1).map(line => {
    const vals = csvSplitLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g,'').trim(); });
    return obj;
  });
}
function csvSplitLine(line) {
  const res = []; let cur = ''; let inQ = false;
  for (let c of line) {
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { res.push(cur); cur = ''; }
    else { cur += c; }
  }
  res.push(cur);
  return res;
}

// ── DASHBOARD ──────────────────────────────────────────
function renderDashboard() {
  const data = APP.data;
  if (!data.length) {
    document.getElementById('dashboard-kpis').innerHTML = renderEmptyKpis();
    document.getElementById('dashboard-charts').innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Sin datos para ${APP.year}</div><div class="empty-text">Configure la URL de Google Sheets en Configuración o cargue datos.</div></div>`;
    return;
  }

  renderKpis(data);
  renderDashboardCharts(data);
}

function renderEmptyKpis() {
  return Array(6).fill(0).map((_,i) => `
    <div class="kpi-card" style="--kpi-color: var(--color-primary)">
      <div class="kpi-label">Cargando...</div>
      <div class="kpi-value" style="color:var(--text-dim)">—</div>
    </div>`).join('');
}

function renderKpis(data) {
  const total = data.length;
  const masc  = data.filter(r => r.sexo === 'Masculino').length;
  const fem   = data.filter(r => r.sexo === 'Femenino').length;
  const direc = data.filter(r => r.tipo_colaborador === 'Directo').length;
  const indir = data.filter(r => r.tipo_colaborador === 'Indirecto').length;
  const conIps = data.filter(r => (r.ips_actual||'').toLowerCase().includes('sí') || r.ips_actual === 'Sí' || r.ips_actual === 'si').length;
  const edades = data.map(r => parseInt(r.edad)).filter(e => e > 0 && e < 100);
  const avgEdad = edades.length ? (edades.reduce((a,b)=>a+b,0)/edades.length).toFixed(1) : '—';
  const urbana  = data.filter(r => r.area_residencia === 'Urbana').length;
  const pctIps  = total ? Math.round(conIps/total*100) : 0;
  const pctUrb  = total ? Math.round(urbana/total*100) : 0;

  const kpis = [
    { label: 'Total Encuestados', value: total, sub: `Año ${APP.year}`, icon: '👥', color: 'var(--color-primary)' },
    { label: 'Hombres / Mujeres', value: `${masc} / ${fem}`, sub: `${total ? Math.round(masc/total*100) : 0}% masculino`, icon: '⚧', color: 'var(--color-blue)' },
    { label: 'Directo / Indirecto', value: `${direc} / ${indir}`, sub: `${total ? Math.round(direc/total*100) : 0}% directos`, icon: '🏢', color: 'var(--color-amber)' },
    { label: 'Edad Promedio', value: avgEdad, sub: 'años cumplidos', icon: '🎂', color: 'var(--color-purple)' },
    { label: 'Con IPS', value: `${pctIps}%`, sub: `${conIps} colaboradores`, icon: '🏥', color: 'var(--color-success)' },
    { label: 'Área Urbana', value: `${pctUrb}%`, sub: `${urbana} de ${total}`, icon: '🌆', color: 'var(--color-info)' },
  ];

  document.getElementById('dashboard-kpis').innerHTML = kpis.map(k => `
    <div class="kpi-card" style="--kpi-color:${k.color}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
      <div class="kpi-icon">${k.icon}</div>
    </div>`).join('');
}

function renderDashboardCharts(data) {
  destroyAllCharts();

  // Sexo
  renderDonut('chart-sexo', countBy(data,'sexo'), CHART_COLORS.mixed);

  // Tipo colaborador
  renderDonut('chart-tipo', countBy(data,'tipo_colaborador'), [CHART_COLORS.mixed[0], CHART_COLORS.mixed[1]]);

  // Área residencia
  renderDonut('chart-area', countBy(data,'area_residencia'), [CHART_COLORS.mixed[0], CHART_COLORS.mixed[3]]);

  // Grupos de edad
  const ageGroups = {'18-25':0,'26-35':0,'36-45':0,'46-55':0,'56+':0};
  data.forEach(r => {
    const age = parseInt(r.edad);
    if (age >= 18 && age <= 25)       ageGroups['18-25']++;
    else if (age <= 35)               ageGroups['26-35']++;
    else if (age <= 45)               ageGroups['36-45']++;
    else if (age <= 55)               ageGroups['46-55']++;
    else if (age > 55)                ageGroups['56+']++;
  });
  renderBar('chart-edad', Object.keys(ageGroups), Object.values(ageGroups), 'Cantidad');

  // Top Departamentos de residencia
  const deptos = countBy(data,'depto_residencia');
  const topDeptos = Object.entries(deptos).sort((a,b)=>b[1]-a[1]).slice(0,10);
  renderHBar('chart-deptos', topDeptos.map(d=>d[0]), topDeptos.map(d=>d[1]));

  // Top Empresas
  const emps = countBy(data.filter(r=>r.empresa_contratista), 'empresa_contratista');
  const topEmps = Object.entries(emps).sort((a,b)=>b[1]-a[1]).slice(0,10);
  renderHBar('chart-empresas', topEmps.map(e=>e[0]), topEmps.map(e=>e[1]));

  // Salario actual
  const salOrden = [
    'Menos del salario mínimo','Salario mínimo','Más del salario mínimo y hasta 3 millones',
    'Más de 3 millones y hasta 5 millones','Más de 5 millones y hasta 7 millones',
    'Más de 7 millones y hasta 10 millones','Más de 10 millones y hasta 13 millones',
    'Más de 13 millones y hasta 15 millones','Más de 15 millones y hasta 20 millones',
    'Más de 20 millones y hasta 30 millones','Más de 30 millones'
  ];
  const salMap = countBy(data.filter(r=>r.salario_actual && r.salario_actual !== 'No quiso dar información'),'salario_actual');
  const salLabels = salOrden.filter(s => salMap[s] > 0);
  const salVals   = salLabels.map(s => salMap[s] || 0);
  const shortSal  = salLabels.map(s => s.replace('Más del salario mínimo y hasta','> SM y hasta').replace('salario mínimo (Gs. 2.680.373)','Sal. Mínimo').replace('el salario mínimo (menos de Gs. 2.680.373)','el Sal. Mín.'));
  renderBar('chart-salario', shortSal, salVals, 'Colaboradores');

  // Combustible
  renderBar('chart-combustible',
    Object.keys(countBy(data,'combustible_cocina')),
    Object.values(countBy(data,'combustible_cocina')),
    'Cantidad'
  );

  // Timeline por fecha
  const byDate = {};
  data.forEach(r => {
    if (r.fecha_encuesta) {
      const d = r.fecha_encuesta.substring(0,10);
      byDate[d] = (byDate[d]||0) + 1;
    }
  });
  const sortedDates = Object.keys(byDate).sort();
  renderLine('chart-timeline', sortedDates, sortedDates.map(d=>byDate[d]));

  // IPS antes vs ahora
  const ipsAntes  = data.filter(r => r.ips_anterior === 'si' || r.ips_anterior === 'Sí').length;
  const ipsAhora  = data.filter(r => r.ips_actual === 'Sí' || r.ips_actual === 'si').length;
  const noAntes   = data.length - ipsAntes;
  const noAhora   = data.length - ipsAhora;
  renderBar('chart-ips', ['Antes de Paracel', 'Actualmente'],
    null, null, {
      datasets: [
        { label: 'Con IPS', data: [ipsAntes, ipsAhora], backgroundColor: 'rgba(34,197,94,0.8)', borderRadius: 4 },
        { label: 'Sin IPS', data: [noAntes, noAhora],   backgroundColor: 'rgba(248,113,113,0.5)', borderRadius: 4 },
      ]
    }
  );
}

// ── CHART HELPERS ──────────────────────────────────────
function destroyAllCharts() {
  Object.values(APP.charts).forEach(c => { try { c.destroy(); } catch {} });
  APP.charts = {};
}
function getCtx(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  return canvas.getContext('2d');
}

function baseChartOptions(overrides = {}) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: CHART_COLORS.text, font: { size: 11 }, padding: 14 } },
      tooltip: {
        backgroundColor: '#0f2216', borderColor: '#2d6040', borderWidth: 1,
        titleColor: '#e8f5ec', bodyColor: '#9fcfab', padding: 10, cornerRadius: 8,
      },
    },
    scales: {
      x: { ticks: { color: CHART_COLORS.text, font: { size: 10 } }, grid: { color: CHART_COLORS.grid } },
      y: { ticks: { color: CHART_COLORS.text, font: { size: 10 } }, grid: { color: CHART_COLORS.grid } },
    },
    ...overrides,
  };
}

function renderDonut(canvasId, countsObj, colors) {
  const ctx = getCtx(canvasId); if (!ctx) return;
  const labels = Object.keys(countsObj).filter(k=>k);
  const values = labels.map(k => countsObj[k]);
  APP.charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 0, borderRadius: 3 }]
    },
    options: {
      ...baseChartOptions({ scales: {} }),
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { color: CHART_COLORS.text, font: { size: 11 }, boxWidth: 12, padding: 10 } },
        tooltip: { backgroundColor: '#0f2216', borderColor: '#2d6040', borderWidth: 1, titleColor: '#e8f5ec', bodyColor: '#9fcfab', padding: 10, cornerRadius: 8 },
      }
    }
  });
}

function renderBar(canvasId, labels, values, datasetLabel, customConfig) {
  const ctx = getCtx(canvasId); if (!ctx) return;
  const conf = customConfig || {
    datasets: [{
      label: datasetLabel || 'Cantidad',
      data: values,
      backgroundColor: CHART_COLORS.green.map(c => c + 'cc'),
      borderRadius: 5, borderSkipped: false,
    }]
  };
  if (labels) conf.labels = labels;
  APP.charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: conf,
    options: {
      ...baseChartOptions(),
      plugins: {
        legend: { labels: { color: CHART_COLORS.text, font: { size: 11 } } },
        tooltip: { backgroundColor: '#0f2216', borderColor: '#2d6040', borderWidth: 1, titleColor: '#e8f5ec', bodyColor: '#9fcfab', padding: 10, cornerRadius: 8 },
      }
    }
  });
}

function renderHBar(canvasId, labels, values) {
  const ctx = getCtx(canvasId); if (!ctx) return;
  APP.charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Cantidad',
        data: values,
        backgroundColor: 'rgba(34,197,94,0.7)',
        borderRadius: 4,
      }]
    },
    options: {
      ...baseChartOptions({ indexAxis: 'y' }),
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#0f2216', borderColor: '#2d6040', borderWidth: 1, titleColor: '#e8f5ec', bodyColor: '#9fcfab', padding: 10, cornerRadius: 8 },
      }
    }
  });
}

function renderLine(canvasId, labels, values) {
  const ctx = getCtx(canvasId); if (!ctx) return;
  APP.charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Encuestas recibidas',
        data: values,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true, tension: 0.4,
        pointBackgroundColor: '#22c55e', pointRadius: 4,
      }]
    },
    options: baseChartOptions()
  });
}

function countBy(arr, field) {
  const res = {};
  arr.forEach(row => {
    const val = row[field];
    if (val) res[val] = (res[val]||0) + 1;
  });
  return res;
}

// ── RESPUESTAS TABLE ───────────────────────────────────
const RESP_PAGE_SIZE = 20;

function renderRespuestas() {
  const container = document.getElementById('view-respuestas');
  const data = APP.data;

  // Apply filters
  let filtered = applyRespFilters(data);
  const total  = filtered.length;
  const pages  = Math.ceil(total / RESP_PAGE_SIZE) || 1;
  APP.respPage = Math.min(APP.respPage, pages);
  const slice  = filtered.slice((APP.respPage-1)*RESP_PAGE_SIZE, APP.respPage*RESP_PAGE_SIZE);

  document.getElementById('resp-count').textContent = `${total} registros`;

  const tbody = document.getElementById('resp-tbody');
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty">Sin resultados para los filtros aplicados.</td></tr>`;
  } else {
    tbody.innerHTML = slice.map((row, idx) => {
      const salBadge = getSalarioBadge(row.salario_actual);
      return `<tr>
        <td>${(APP.respPage-1)*RESP_PAGE_SIZE + idx + 1}</td>
        <td class="td-name">${esc(row.nombre_apellido||'—')}</td>
        <td>${esc(row.cedula||'—')}</td>
        <td>${sexoBadge(row.sexo)}</td>
        <td>${row.edad||'—'}</td>
        <td>${tipoBadge(row.tipo_colaborador)}</td>
        <td>${esc(row.empresa_contratista||'—')}</td>
        <td>${salBadge}</td>
        <td>${ipsBadge(row.ips_actual)}</td>
      </tr>`;
    }).join('');
  }

  // Pagination
  renderPagination('resp-pagination', APP.respPage, pages, (p) => {
    APP.respPage = p;
    renderRespuestas();
  });
}

function applyRespFilters(data) {
  let d = [...data];
  if (APP.respSearch) {
    const q = APP.respSearch.toLowerCase();
    d = d.filter(r =>
      (r.nombre_apellido||'').toLowerCase().includes(q) ||
      (r.cedula||'').includes(q) ||
      (r.empresa_contratista||'').toLowerCase().includes(q)
    );
  }
  const f = APP.respFilters;
  if (f.tipo)  d = d.filter(r => r.tipo_colaborador === f.tipo);
  if (f.sexo)  d = d.filter(r => r.sexo === f.sexo);
  if (f.area)  d = d.filter(r => r.area_residencia === f.area);
  return d;
}

function setupRespFilters() {
  document.getElementById('resp-search')?.addEventListener('input', e => {
    APP.respSearch = e.target.value; APP.respPage = 1; renderRespuestas();
  });
  ['tipo','sexo','area'].forEach(f => {
    document.getElementById(`resp-filter-${f}`)?.addEventListener('change', e => {
      APP.respFilters[f] = e.target.value || null; APP.respPage = 1; renderRespuestas();
    });
  });
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);
}

function exportCsv() {
  const data = applyRespFilters(APP.data);
  if (!data.length) { toast('Sin datos para exportar','warning'); return; }
  const fields = Object.keys(data[0]);
  const lines  = [fields.join(','), ...data.map(r => fields.map(f => `"${(r[f]||'').replace(/"/g,'""')}"`).join(','))];
  downloadFile(lines.join('\n'), `encuesta_paracel_${APP.year}.csv`, 'text/csv;charset=utf-8;');
  toast('CSV exportado correctamente','success');
}

// ── COLABORADORES ──────────────────────────────────────
const COL_PAGE_SIZE = 25;

function renderColaboradores() {
  const list = DB.colaboradores.filter(c => !c.year || c.year === APP.year);
  const total = list.length;
  const pages = Math.ceil(total / COL_PAGE_SIZE) || 1;
  APP.colabPage = Math.min(APP.colabPage, pages);
  const slice = list.slice((APP.colabPage-1)*COL_PAGE_SIZE, APP.colabPage*COL_PAGE_SIZE);

  document.getElementById('colab-count').textContent = `${total} colaboradores`;

  const tbody = document.getElementById('colab-tbody');
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No hay colaboradores registrados para ${APP.year}. <a href="#" onclick="openColabModal()">Agregar uno</a>.</td></tr>`;
    return;
  }
  tbody.innerHTML = slice.map(c => `
    <tr>
      <td class="td-name">${esc(c.nombre)}</td>
      <td>${esc(c.ci)}</td>
      <td>${tipoBadge(c.tipo)}</td>
      <td>${esc(c.email||'—')}</td>
      <td>${esc(c.empresa||'—')}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.sentAt ? c.sentAt.substring(0,10) : '—'}</td>
      <td><div class="action-btns">
        <button class="btn btn-sm btn-secondary" onclick="openColabModal('${c.id}')">✏️</button>
        ${isAdmin() ? `<button class="btn btn-sm btn-amber" onclick="sendSingleEmail('${c.id}')">📧</button>
        <button class="btn btn-sm btn-danger" onclick="deleteColab('${c.id}')">🗑️</button>` : ''}
      </div></td>
    </tr>`).join('');

  renderPagination('colab-pagination', APP.colabPage, pages, (p) => {
    APP.colabPage = p;
    renderColaboradores();
  });
}

function openColabModal(id) {
  const c = id ? DB.colaboradores.find(x=>x.id===id) : null;
  const html = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nombre completo <span class="required">*</span></label>
        <input class="form-control" id="cm-nombre" value="${esc(c?.nombre||'')}" placeholder="Nombre y Apellido" required></div>
      <div class="form-group"><label class="form-label">Cédula de Identidad <span class="required">*</span></label>
        <input class="form-control" id="cm-ci" value="${esc(c?.ci||'')}" placeholder="Sin puntos ni guiones"></div>
      <div class="form-group"><label class="form-label">Correo electrónico</label>
        <input class="form-control" type="email" id="cm-email" value="${esc(c?.email||'')}" placeholder="correo@ejemplo.com"></div>
      <div class="form-group"><label class="form-label">Teléfono</label>
        <input class="form-control" id="cm-tel" value="${esc(c?.telefono||'')}" placeholder="0981 000000"></div>
      <div class="form-group"><label class="form-label">Tipo</label>
        <select class="form-control" id="cm-tipo">
          <option ${c?.tipo==='Directo'?'selected':''}>Directo</option>
          <option ${c?.tipo==='Indirecto'?'selected':''}>Indirecto</option>
        </select></div>
      <div class="form-group"><label class="form-label">Empresa contratista</label>
        <input class="form-control" id="cm-empresa" value="${esc(c?.empresa||'')}" placeholder="Nombre de empresa"></div>
      <div class="form-group"><label class="form-label">Año de encuesta</label>
        <select class="form-control" id="cm-year">
          ${(DB.config.activeYears||['2024','2025','2026']).map(y=>`<option value="${y}" ${(c?.year||APP.year)===y?'selected':''}>${y}</option>`).join('')}
        </select></div>
    </div>`;
  showModal(`${c ? 'Editar' : 'Agregar'} Colaborador`, html, [
    { text: 'Cancelar', class: 'btn-secondary', action: 'close' },
    { text: c ? 'Guardar' : 'Agregar', class: 'btn-primary', action: () => saveColab(c?.id) },
  ]);
}

function saveColab(id) {
  const nombre  = document.getElementById('cm-nombre').value.trim();
  const ci      = document.getElementById('cm-ci').value.trim();
  if (!nombre || !ci) { toast('Nombre y cédula son requeridos','warning'); return; }

  const obj = {
    id:       id || uid(),
    nombre, ci,
    email:    document.getElementById('cm-email').value.trim(),
    telefono: document.getElementById('cm-tel').value.trim(),
    tipo:     document.getElementById('cm-tipo').value,
    empresa:  document.getElementById('cm-empresa').value.trim(),
    year:     document.getElementById('cm-year').value,
    status:   id ? DB.colaboradores.find(c=>c.id===id)?.status : 'pendiente',
  };
  if (id) {
    const idx = DB.colaboradores.findIndex(c=>c.id===id);
    DB.colaboradores[idx] = { ...DB.colaboradores[idx], ...obj };
  } else {
    DB.colaboradores.push(obj);
  }
  saveDB(DB);
  closeModal();
  renderColaboradores();
  toast(`Colaborador ${id ? 'actualizado' : 'agregado'}`, 'success');
}

function deleteColab(id) {
  if (!confirm('¿Eliminar este colaborador?')) return;
  DB.colaboradores = DB.colaboradores.filter(c=>c.id!==id);
  saveDB(DB); renderColaboradores(); toast('Colaborador eliminado','success');
}

function importColabCSV() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.csv';
  input.onchange = async e => {
    const file = e.target.files[0];
    const text = await file.text();
    const rows = parseCsv(text);
    let added = 0;
    rows.forEach(r => {
      const ci = (r.ci || r.cedula || r.CI || r.Cedula || '').trim();
      const nombre = (r.nombre || r.nombre_apellido || r.Nombre || '').trim();
      if (!ci || !nombre) return;
      if (!DB.colaboradores.find(c=>c.ci===ci && c.year===APP.year)) {
        DB.colaboradores.push({
          id: uid(), ci, nombre,
          email: r.email || r.Email || '',
          telefono: r.telefono || r.Telefono || '',
          tipo: r.tipo_colaborador || r.tipo || 'Indirecto',
          empresa: r.empresa_contratista || r.empresa || '',
          year: APP.year,
          status: 'pendiente',
        });
        added++;
      }
    });
    saveDB(DB); renderColaboradores();
    toast(`${added} colaboradores importados`, 'success');
  };
  input.click();
}

function sendSingleEmail(id) {
  const c = DB.colaboradores.find(x=>x.id===id);
  if (!c?.email) { toast('El colaborador no tiene correo registrado','warning'); return; }
  const link = generateSurveyLink(c);
  const subject = interpolate(DB.config.emailSubject, { nombre: c.nombre, year: APP.year });
  const body    = interpolate(DB.config.emailBody,    { nombre: c.nombre, year: APP.year, link });
  const mailto  = `mailto:${c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank');
  c.status = 'enviado'; c.sentAt = new Date().toISOString();
  saveDB(DB); renderColaboradores();
  toast('Correo abierto en cliente de email','info');
}

function generateSurveyLink(c) {
  const base  = window.location.href.replace('index.html','').replace(/\/$/, '');
  const token = btoa(`${c.id}:${c.ci}:${APP.year}`);
  return `${base}/encuesta.html?token=${encodeURIComponent(token)}`;
}

// ── EMAILS (ENVÍO MASIVO) ──────────────────────────────
function renderEmails() {
  const all      = DB.colaboradores.filter(c=>c.year===APP.year);
  const pending  = all.filter(c=>c.status==='pendiente');
  const sent     = all.filter(c=>c.status==='enviado');
  const done     = all.filter(c=>c.status==='completado');
  const noEmail  = all.filter(c=>!c.email);

  document.getElementById('email-stats').innerHTML = `
    <div class="kpi-card" style="--kpi-color:var(--text-muted)">
      <div class="kpi-label">Total Colaboradores</div><div class="kpi-value">${all.length}</div>
    </div>
    <div class="kpi-card" style="--kpi-color:var(--color-warning)">
      <div class="kpi-label">Pendiente de envío</div><div class="kpi-value">${pending.length}</div>
    </div>
    <div class="kpi-card" style="--kpi-color:var(--color-info)">
      <div class="kpi-label">Enviados</div><div class="kpi-value">${sent.length}</div>
    </div>
    <div class="kpi-card" style="--kpi-color:var(--color-success)">
      <div class="kpi-label">Completados</div><div class="kpi-value">${done.length}</div>
    </div>
    <div class="kpi-card" style="--kpi-color:var(--color-danger)">
      <div class="kpi-label">Sin correo</div><div class="kpi-value">${noEmail.length}</div>
    </div>`;

  // Update template preview
  updateEmailPreview();
}

function updateEmailPreview() {
  const c = DB.colaboradores.find(x=>x.year===APP.year) || { nombre: 'Juan Pérez', ci: '1234567', id: 'demo' };
  const link = generateSurveyLink(c);
  document.getElementById('email-preview-subject').textContent = interpolate(DB.config.emailSubject, { nombre: c.nombre, year: APP.year });
  document.getElementById('email-preview-body').textContent    = interpolate(DB.config.emailBody,    { nombre: c.nombre, year: APP.year, link });
}

function sendMassEmail(target = 'pending') {
  const all   = DB.colaboradores.filter(c=>c.year===APP.year);
  const toSend = target === 'all' ? all.filter(c=>c.email) : all.filter(c=>c.status==='pendiente' && c.email);
  if (!toSend.length) { toast('No hay colaboradores para enviar','warning'); return; }

  // Open mailto with BCC for all
  const emails  = toSend.map(c=>c.email).join(',');
  const subject = interpolate(DB.config.emailSubject, { year: APP.year, nombre: 'colaborador/a' });
  const note    = '(Nota: Cada colaborador debe recibir un enlace individual. Use el botón individual para envíos personalizados.)';
  const body    = `${note}\n\n${interpolate(DB.config.emailBody, { year: APP.year, nombre: '[NOMBRE]', link: '[ENLACE INDIVIDUAL]' })}`;
  const mailto  = `mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto, '_blank');

  toSend.forEach(c => { c.status = 'enviado'; c.sentAt = new Date().toISOString(); });
  saveDB(DB);
  toast(`${toSend.length} correos abiertos en cliente de email`, 'success');
  renderEmails();
}

function setupEmailTemplateEditor() {
  const subj = document.getElementById('email-subj');
  const body = document.getElementById('email-body');
  if (subj) subj.value = DB.config.emailSubject;
  if (body) body.value = DB.config.emailBody;
  subj?.addEventListener('input', () => { DB.config.emailSubject = subj.value; saveDB(DB); updateEmailPreview(); });
  body?.addEventListener('input', () => { DB.config.emailBody    = body.value; saveDB(DB); updateEmailPreview(); });
}

// ── CUESTIONARIO PREVIEW ───────────────────────────────
function renderEncuesta() {
  // Already rendered statically, just show stats
  document.getElementById('encuesta-total-preg').textContent = QUESTIONS_SCHEMA.length;
  document.getElementById('encuesta-total-sec').textContent  = SECTIONS.length;
  document.getElementById('encuesta-link').href = `encuesta.html?year=${APP.year}&preview=1`;
}

// ── USERS MANAGEMENT ──────────────────────────────────
function renderUsuarios() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = DB.users.map(u => `
    <tr>
      <td class="td-name">${esc(u.displayName||u.username)}</td>
      <td>${esc(u.username)}</td>
      <td>${u.role === 'admin' ? '<span class="badge badge-amber">Admin</span>' : '<span class="badge badge-blue">Viewer</span>'}</td>
      <td>${esc(u.email||'—')}</td>
      <td>${u.active ? '<span class="badge badge-green">Activo</span>' : '<span class="badge badge-red">Inactivo</span>'}</td>
      <td class="action-btns">
        <button class="btn btn-sm btn-secondary" onclick="openUserModal('${u.id}')">✏️ Editar</button>
        ${u.id !== APP.user?.id ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">🗑️</button>` : ''}
      </td>
    </tr>`).join('');
}

function openUserModal(id) {
  const u = id ? DB.users.find(x=>x.id===id) : null;
  const html = `
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Nombre completo <span class="required">*</span></label>
        <input class="form-control" id="um-display" value="${esc(u?.displayName||'')}" placeholder="Nombre visible"></div>
      <div class="form-group"><label class="form-label">Usuario <span class="required">*</span></label>
        <input class="form-control" id="um-user" value="${esc(u?.username||'')}" placeholder="usuario"></div>
      <div class="form-group"><label class="form-label">${u ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
        <input class="form-control" type="password" id="um-pass" placeholder="${u ? '••••••' : 'Contraseña'}"></div>
      <div class="form-group"><label class="form-label">Rol</label>
        <select class="form-control" id="um-role">
          <option value="admin"  ${u?.role==='admin' ?'selected':''}>Administrador</option>
          <option value="viewer" ${u?.role==='viewer'?'selected':''}>Visualizador</option>
        </select></div>
      <div class="form-group"><label class="form-label">Correo electrónico</label>
        <input class="form-control" type="email" id="um-email" value="${esc(u?.email||'')}" placeholder="correo@ejemplo.com"></div>
      <div class="form-group"><label class="form-label">Estado</label>
        <select class="form-control" id="um-active">
          <option value="1" ${u?.active?'selected':''}>Activo</option>
          <option value="0" ${!u?.active?'selected':''}>Inactivo</option>
        </select></div>
    </div>`;
  showModal(`${u ? 'Editar' : 'Nuevo'} Usuario`, html, [
    { text: 'Cancelar', class: 'btn-secondary', action: 'close' },
    { text: u ? 'Guardar' : 'Crear', class: 'btn-primary', action: () => saveUser(u?.id) },
  ]);
}

function saveUser(id) {
  const display = document.getElementById('um-display').value.trim();
  const username = document.getElementById('um-user').value.trim().toLowerCase();
  const pass   = document.getElementById('um-pass').value;
  const role   = document.getElementById('um-role').value;
  const email  = document.getElementById('um-email').value.trim();
  const active = document.getElementById('um-active').value === '1';

  if (!display || !username) { toast('Nombre y usuario son requeridos','warning'); return; }
  if (!id && !pass)          { toast('La contraseña es requerida para nuevo usuario','warning'); return; }

  // Check duplicate username
  if (DB.users.find(u=>u.username===username && u.id!==id)) { toast('El nombre de usuario ya existe','danger'); return; }

  if (id) {
    const u = DB.users.find(x=>x.id===id);
    u.displayName = display; u.username = username; u.role = role; u.email = email; u.active = active;
    if (pass) u.password = pass;
  } else {
    DB.users.push({ id: uid(), displayName: display, username, password: pass, role, email, active });
  }
  saveDB(DB); closeModal(); renderUsuarios();
  toast(`Usuario ${id?'actualizado':'creado'}`, 'success');
}

function deleteUser(id) {
  if (id === APP.user?.id) { toast('No puedes eliminar tu propio usuario','warning'); return; }
  if (!confirm('¿Eliminar este usuario?')) return;
  DB.users = DB.users.filter(u=>u.id!==id);
  saveDB(DB); renderUsuarios(); toast('Usuario eliminado','success');
}

// ── CONFIGURATION ──────────────────────────────────────
function renderConfig() {
  const c = DB.config;
  const fields = ['sheetUrl2024','sheetUrl2025','sheetUrl2026','appsScriptUrl',
    'emailjsServiceId','emailjsTemplateId','emailjsPublicKey',
    'orgName','sendFromEmail'];
  fields.forEach(f => {
    const el = document.getElementById(`cfg-${f}`);
    if (el) el.value = c[f] || '';
  });

  const yearsEl = document.getElementById('cfg-activeYears');
  if (yearsEl) yearsEl.value = (c.activeYears||[]).join(',');

  document.getElementById('email-subj').value = c.emailSubject || '';
  document.getElementById('email-body').value = c.emailBody || '';
  updateEmailPreview();
}

function saveConfig() {
  const fields = ['sheetUrl2024','sheetUrl2025','sheetUrl2026','appsScriptUrl',
    'emailjsServiceId','emailjsTemplateId','emailjsPublicKey',
    'orgName','sendFromEmail'];
  fields.forEach(f => {
    const el = document.getElementById(`cfg-${f}`);
    if (el) DB.config[f] = el.value.trim();
  });
  const yearsEl = document.getElementById('cfg-activeYears');
  if (yearsEl) {
    DB.config.activeYears = yearsEl.value.split(',').map(y=>y.trim()).filter(Boolean);
  }
  DB.config.emailSubject = document.getElementById('email-subj').value;
  DB.config.emailBody    = document.getElementById('email-body').value;
  saveDB(DB);
  populateYearSelector();
  toast('Configuración guardada correctamente','success');
}

function exportBackup() {
  const json = JSON.stringify(DB, null, 2);
  downloadFile(json, `backup_paracel_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
  toast('Backup exportado','success');
}

function importBackup() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async e => {
    const file = e.target.files[0];
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!data.users || !data.config) throw new Error('Formato inválido');
      Object.assign(DB, data);
      saveDB(DB);
      toast('Backup restaurado correctamente. Recargando...','success');
      setTimeout(() => location.reload(), 1500);
    } catch { toast('Error al importar: formato inválido','danger'); }
  };
  input.click();
}

function clearYear2026() {
  if (!confirm('¿Borrar todos los datos de respuestas 2026? Esta acción no se puede deshacer.')) return;
  DB.responses2026 = [];
  saveDB(DB);
  if (APP.year === '2026') { APP.data = []; refreshCurrentView(); }
  toast('Datos 2026 eliminados','success');
}

// ── MODAL SYSTEM ───────────────────────────────────────
let modalCallback = null;

function showModal(title, bodyHtml, buttons = []) {
  const overlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody  = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');

  modalTitle.textContent = title;
  modalBody.innerHTML    = bodyHtml;
  modalFooter.innerHTML  = buttons.map((b, i) => `
    <button class="btn ${b.class}" data-btn-idx="${i}">${b.text}</button>`).join('');

  modalFooter.querySelectorAll('[data-btn-idx]').forEach(btn => {
    const idx = parseInt(btn.dataset.btnIdx);
    btn.addEventListener('click', () => {
      const action = buttons[idx].action;
      if (action === 'close') closeModal();
      else if (typeof action === 'function') action();
    });
  });

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

// Close on overlay click
document.addEventListener('click', e => {
  if (e.target.id === 'modal-overlay') closeModal();
  if (e.target.id === 'modal-close-btn') closeModal();
});

// ── PAGINATION HELPER ──────────────────────────────────
function renderPagination(containerId, current, total, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el || total <= 1) { if (el) el.innerHTML=''; return; }
  const pages = [];
  if (total <= 7) {
    for (let i=1; i<=total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i=Math.max(2,current-1); i<=Math.min(total-1,current+1); i++) pages.push(i);
    if (current < total-2) pages.push('...');
    pages.push(total);
  }
  el.innerHTML = `
    <span class="pagination-info">Página ${current} de ${total}</span>
    <div class="pagination-btns">
      <button class="page-btn" onclick="(${onPageChange.toString()})(${current-1})" ${current===1?'disabled':''}>‹</button>
      ${pages.map(p => p==='...' ? `<span class="page-btn" style="cursor:default">…</span>` :
        `<button class="page-btn ${p===current?'active':''}" onclick="(${onPageChange.toString()})(${p})">${p}</button>`
      ).join('')}
      <button class="page-btn" onclick="(${onPageChange.toString()})(${current+1})" ${current===total?'disabled':''}>›</button>
    </div>`;
}

// ── TOAST SYSTEM ───────────────────────────────────────
function toast(message, type = 'info', duration = 4000) {
  const icons = { success:'✅', warning:'⚠️', danger:'❌', error:'❌', info:'ℹ️' };
  const t = type === 'error' ? 'danger' : type;
  const id = uid();
  const el = document.createElement('div');
  el.className = `toast toast-${t}`;
  el.id = id;
  el.innerHTML = `
    <span class="toast-icon">${icons[t]||'ℹ️'}</span>
    <span class="toast-message">${esc(message)}</span>
    <button class="toast-close" onclick="dismissToast('${id}')">✕</button>`;
  document.getElementById('toast-container')?.appendChild(el);
  setTimeout(() => dismissToast(id), duration);
}
function dismissToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('leaving');
  setTimeout(() => el.remove(), 300);
}

// ── BADGE HELPERS ──────────────────────────────────────
function sexoBadge(v) {
  if (!v) return '—';
  return v === 'Masculino' ? `<span class="badge badge-blue">♂ Masculino</span>` : `<span class="badge badge-purple">♀ Femenino</span>`;
}
function tipoBadge(v) {
  if (!v) return '—';
  return v.includes('Directo') ? `<span class="badge badge-green">Directo</span>` : `<span class="badge badge-amber">Indirecto</span>`;
}
function ipsBadge(v) {
  if (!v) return '—';
  const yes = v === 'Sí' || v === 'si' || v.toLowerCase() === 'sí';
  return yes ? `<span class="badge badge-green">✓ IPS</span>` : `<span class="badge badge-red">✗ Sin IPS</span>`;
}
function getSalarioBadge(v) {
  if (!v) return '—';
  const s = v.toLowerCase();
  if (s.includes('mínimo') && !s.includes('más') && !s.includes('menos')) return `<span class="badge badge-amber">Sal. Mínimo</span>`;
  if (s.includes('más de 7') || s.includes('más de 10') || s.includes('más de 13') || s.includes('más de 15') || s.includes('más de 20') || s.includes('más de 30')) return `<span class="badge badge-green">${v.substring(0,24)}…</span>`;
  if (s.includes('menos del')) return `<span class="badge badge-red">< Sal. Mínimo</span>`;
  return `<span class="badge badge-gray">${v.substring(0,20)}…</span>`;
}
function statusBadge(status) {
  const map = {
    pendiente:  ['badge-gray',   '⏳ Pendiente'],
    enviado:    ['badge-blue',   '📧 Enviado'],
    completado: ['badge-green',  '✅ Completado'],
  };
  const [cls, label] = map[status] || ['badge-gray', status || '—'];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── UTILS ──────────────────────────────────────────────
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function uid() { return Math.random().toString(36).slice(2,11) + Date.now().toString(36); }
function interpolate(tmpl, vars) {
  return (tmpl||'').replace(/\{\{(\w+)\}\}/g, (_,k) => vars[k] !== undefined ? vars[k] : `{{${k}}}`);
}
function downloadFile(content, filename, mimeType) {
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(new Blob([content], { type: mimeType }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── INIT REMAINING SETUP ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupRespFilters();
  setupEmailTemplateEditor();

  // Colab buttons
  document.getElementById('btn-add-colab')?.addEventListener('click', () => openColabModal());
  document.getElementById('btn-import-colab')?.addEventListener('click', importColabCSV);
  document.getElementById('btn-send-pending')?.addEventListener('click', () => sendMassEmail('pending'));
  document.getElementById('btn-send-all')?.addEventListener('click', () => sendMassEmail('all'));

  // User buttons
  document.getElementById('btn-add-user')?.addEventListener('click', () => openUserModal());

  // Config
  document.getElementById('btn-save-config')?.addEventListener('click', saveConfig);
  document.getElementById('btn-export-backup')?.addEventListener('click', exportBackup);
  document.getElementById('btn-import-backup')?.addEventListener('click', importBackup);
  document.getElementById('btn-clear-2026')?.addEventListener('click', clearYear2026);

  // Modal close
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
});
