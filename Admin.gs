
function getBootstrap(sessionToken) {
  var user = requireRole_(sessionToken, ['admin','viewer']);
  // Stats se cargan por separado (getDashboardSummary) para no bloquear el panel
  return {
    appName: APP_CFG.APP_NAME,
    orgName: APP_CFG.ORG_NAME,
    user: user,
    activeEdition: activeEdition_(),
    config: getConfigMap_()
  };
}

function getDashboardSummary(sessionToken, editionId) {
  requireRole_(sessionToken, ['admin','viewer']);
  var editionFilter = normalizeText_(editionId) || '';
  var cacheKey = 'dash_summary_' + getDashboardCacheVersion_() + '_' + (editionFilter || 'ALL');
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (cached) {
    return jsonParse_(cached, null) || {};
  }

  var allRows = getCombinedAnalyticRows_();
  var rows = editionFilter
    ? allRows.filter(function(r){ return normalizeText_(r.edicion) === editionFilter; })
    : allRows;
  var indirectos = rows.filter(function(r){ return r.tipo_colaborador === 'Indirecto'; });
  var directos   = rows.filter(function(r){ return r.tipo_colaborador === 'Directo'; });
  var conIps     = rows.filter(function(r){ return isYesLike_(r.descuento_ips_actual); }).length;
  var edades     = rows.map(function(r){ return Number(r.edad); }).filter(function(n){ return !isNaN(n) && n >= 15 && n <= 80; });
  var edadProm   = edades.length ? Math.round(edades.reduce(function(a,b){return a+b;},0) / edades.length * 10) / 10 : 0;

  var summary = {
    edicionFiltro: editionFilter || '',
    edicionesDisponibles: countBy_(allRows, 'edicion').sort(function(a,b){ return a.label.localeCompare(b.label); }),
    total:      rows.length,
    directos:   directos.length,
    indirectos: indirectos.length,
    conIpsPct:  rows.length ? Math.round(conIps * 100 / rows.length) : 0,
    edadProm:   edadProm,
    porEdicion:    countBy_(rows, 'edicion').sort(function(a,b){ return a.label.localeCompare(b.label); }),
    porTipo:       countBy_(rows, 'tipo_colaborador'),
    porSexo:       countBy_(rows, 'sexo'),
    porAreaIndirecto:   countBy_(indirectos, 'area_colaborador_indirecto'),
    porDeptResidencia:  countBy_(rows, 'departamento_residencia').sort(function(a,b){ return b.value-a.value; }).slice(0,15),
    porIpsActual:       countBy_(rows, 'descuento_ips_actual'),
    porSalario:         sortSalario_(countBy_(rows, 'salario_actual_banda')),
    porGrupoEdad:       sortGrupoEdad_(countBy_(rows, 'edad_grupo')),
    porEstadoCalidad:   countBy_(rows, 'estado_calidad')
  };

  cache.put(cacheKey, jsonStringify_(summary), 180);
  return summary;
}

function countBy_(rows, field) {
  var out = {};
  rows.forEach(function(r) {
    var k = normalizeText_(r[field]) || 'Sin dato';
    out[k] = (out[k] || 0) + 1;
  });
  return Object.keys(out).sort().map(function(k){ return { label: k, value: out[k] }; });
}

function isYesLike_(value) {
  var v = normalizeText_(value);
  if (!v) return false;
  var low = v.toLowerCase();
  if (low === 'si' || low === 'sí' || low === 'sÃ­' || low === 'yes' || low === 'true' || low === '1') return true;
  var key = upperKey_(v).replace(/[^A-Z0-9]/g, '');
  return key === 'SI' || key === 'YES' || key === 'TRUE' || key === '1';
}

function getDashboardCacheVersion_() {
  return PropertiesService.getScriptProperties().getProperty('DASH_CACHE_VERSION') || '1';
}

function bumpDashboardCacheVersion_() {
  PropertiesService.getScriptProperties().setProperty('DASH_CACHE_VERSION', String(Date.now()));
}

function sortSalario_(items) {
  var ord = {'menos del salario mínimo':1,'salario mínimo':2,
    'más del salario mínimo y hasta 3 millones':3,'más de 3 millones y hasta 5 millones':4,
    'más de 5 millones y hasta 7 millones':5,'más de 7 millones y hasta 10 millones':6,
    'más de 10 millones y hasta 13 millones':7,'más de 13 millones y hasta 15 millones':8,
    'más de 15 millones y hasta 20 millones':9,'más de 20 millones y hasta 30 millones':10,
    'más de 30 millones':11,'no informa':99};
  return items.sort(function(a,b){ return (ord[a.label.toLowerCase()]||50)-(ord[b.label.toLowerCase()]||50); });
}

function sortGrupoEdad_(items) {
  var ord = {'18-24':1,'25-34':2,'35-44':3,'45-54':4,'55-64':5,'65+':6};
  return items.sort(function(a,b){ return (ord[a.label]||99)-(ord[b.label]||99); });
}

function listResponses(sessionToken, limit) {
  requireRole_(sessionToken, ['admin','viewer']);
  limit = Number(limit || 200);
  var rows = getCombinedAnalyticRows_();
  rows.sort(function(a,b){ return String(b.submission_ts).localeCompare(String(a.submission_ts)); });
  var fields = [
    'edicion','fecha_encuesta','tipo_colaborador','sexo','edad',
    'departamento_residencia','salario_actual_banda','descuento_ips_actual',
    'empresa_contratista','estado_calidad','n_flags','respondente_id'
  ];
  return rows.slice(0, limit).map(function(r){
    var out = {};
    fields.forEach(function(f){ out[f] = r[f]; });
    return out;
  });
}

/**
 * Devuelve filas combinadas para analitica:
 * 1) snapshot embebido (historico, lectura rapida)
 * 2) filas live desde BASE_ANALITICA (respuestas nuevas)
 * La deduplicacion se hace por source_uuid y fallback por (edicion|respondente_id|fecha_encuesta).
 */
function getCombinedAnalyticRows_() {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'combined_analytic_' + getDashboardCacheVersion_();
  var cached = cache.get(cacheKey);
  if (cached) {
    return jsonParse_(cached, []) || [];
  }

  var snapRows = getEmbeddedSnapshotRows_();
  var liveRows = snapRows.length
    ? getRecentRowsAsObjects_(APP_CFG.SHEETS.ANALYTIC, getLiveTailLimit_())
    : getRowsAsObjects_(APP_CFG.SHEETS.ANALYTIC);
  var out = [];
  var seen = {};

  function addRow(r) {
    var key = normalizeText_(r.source_uuid);
    if (!key) key = [
      normalizeText_(r.edicion),
      normalizeText_(r.respondente_id),
      normalizeText_(r.fecha_encuesta)
    ].join('|');
    if (!key) key = 'row_' + String(out.length + 1);
    if (seen[key]) return;
    seen[key] = true;
    out.push(r);
  }

  snapRows.forEach(addRow);
  liveRows.forEach(addRow);
  cache.put(cacheKey, jsonStringify_(out), 120);
  return out;
}

function getLiveTailLimit_() {
  var raw = PropertiesService.getScriptProperties().getProperty('LIVE_TAIL_LIMIT');
  var n = Number(raw);
  return (!isNaN(n) && n > 0) ? n : 2500;
}

function getRecentRowsAsObjects_(sheetName, limit) {
  var sh = getSheet_(sheetName);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  var headers = getHeader_(sh);
  var dataRows = lastRow - 1;
  var take = Math.min(Math.max(Number(limit || dataRows), 1), dataRows);
  var startRow = lastRow - take + 1;
  var values = sh.getRange(startRow, 1, take, headers.length).getValues();

  return values.filter(function(row) {
    return row.join('') !== '';
  }).map(function(row, idx) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    obj.__rowNum = startRow + idx;
    return obj;
  });
}

/**
 * Lee CSV embebido en SnapshotData.html entre marcadores:
 * <!-- SNAPSHOT_CSV_BEGIN --> ... <!-- SNAPSHOT_CSV_END -->
 */
function getEmbeddedSnapshotRows_() {
  try {
    var raw = include('SnapshotData');
    var begin = '<!-- SNAPSHOT_CSV_BEGIN -->';
    var end = '<!-- SNAPSHOT_CSV_END -->';
    var i = raw.indexOf(begin);
    var j = raw.indexOf(end);
    if (i < 0 || j < 0 || j <= i) return [];
    var csv = raw.substring(i + begin.length, j).trim();
    if (!csv) return [];

    var matrix = Utilities.parseCsv(csv);
    if (!matrix || matrix.length < 2) return [];
    var headers = matrix[0].map(function(h){ return normalizeText_(h); });
    var rows = [];
    for (var r = 1; r < matrix.length; r++) {
      var row = matrix[r];
      if (!row || row.join('') === '') continue;
      var obj = {};
      for (var c = 0; c < headers.length; c++) obj[headers[c]] = row[c];
      rows.push(obj);
    }
    return rows;
  } catch (err) {
    return [];
  }
}

/**
 * Genera CSV listo para pegar en SnapshotData.html.
 * Uso: buildSnapshotCsv(sessionToken, '2026')
 */
function buildSnapshotCsv(sessionToken, editionId) {
  requireRole_(sessionToken, ['admin']);
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.ANALYTIC);
  var filter = normalizeText_(editionId);
  if (filter) rows = rows.filter(function(r){ return normalizeText_(r.edicion) === filter; });
  if (!rows.length) return '';

  var fields = [
    'submission_ts','edicion','fecha_encuesta','tipo_colaborador','sexo','edad','edad_grupo',
    'departamento_residencia','descuento_ips_actual','salario_actual_banda',
    'empresa_contratista','estado_calidad','n_flags','respondente_id','source_uuid'
  ];
  var lines = [];
  lines.push(fields.join(','));
  rows.forEach(function(r){
    var vals = fields.map(function(f){
      var v = normalizeText_(r[f]);
      if (v.indexOf('"') > -1) v = v.replace(/"/g, '""');
      if (/[",\n]/.test(v)) v = '"' + v + '"';
      return v;
    });
    lines.push(vals.join(','));
  });
  return lines.join('\n');
}

function listUsers(sessionToken) {
  requireRole_(sessionToken, ['admin']);
  return getRowsAsObjects_(APP_CFG.SHEETS.USERS).map(function(u){
    return {
      username: u.username,
      display_name: u.display_name,
      role: u.role,
      active: u.active,
      must_change_password: u.must_change_password,
      notes: u.notes
    };
  });
}

function saveUser(sessionToken, userData) {
  var actor = requireRole_(sessionToken, ['admin']);
  var username = normalizeText_(userData.username).toLowerCase();
  if (!username) throw new Error('username obligatorio');
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.USERS);
  var existing = rows.filter(function(r){ return normalizeText_(r.username).toLowerCase() === username; })[0];

  var record = existing ? existing : {
    username: username,
    display_name: '',
    role: 'viewer',
    password_hash: '',
    password_temporal: '',
    active: 'TRUE',
    must_change_password: 'TRUE',
    notes: ''
  };

  record.display_name = normalizeText_(userData.display_name) || username;
  record.role = normalizeText_(userData.role) || 'viewer';
  record.active = String(userData.active).toUpperCase() === 'FALSE' ? 'FALSE' : 'TRUE';
  record.must_change_password = String(userData.must_change_password).toUpperCase() === 'FALSE' ? 'FALSE' : 'TRUE';
  record.notes = normalizeText_(userData.notes);

  var newPwd = normalizeText_(userData.password_temporal);
  if (newPwd) {
    record.password_hash = sha256Hex_(username + '|' + newPwd);
    record.password_temporal = '';
  }

  if (existing) {
    updateRowByNumber_(APP_CFG.SHEETS.USERS, existing.__rowNum, record);
  } else {
    appendObjectRow_(APP_CFG.SHEETS.USERS, record);
  }
  auditLog_(actor.username, actor.role, 'save_user', 'user', username, { role: record.role, active: record.active });
  return { ok: true };
}

function listEditions(sessionToken) {
  requireRole_(sessionToken, ['admin','viewer']);
  return getRowsAsObjects_(APP_CFG.SHEETS.EDITIONS);
}

function saveEdition(sessionToken, editionData) {
  var actor = requireRole_(sessionToken, ['admin']);
  var id = normalizeText_(editionData.edition_id);
  if (!id) throw new Error('edition_id obligatorio');
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.EDITIONS);
  var existing = rows.filter(function(r){ return normalizeText_(r.edition_id) === id; })[0];
  var record = existing ? existing : {};
  record.edition_id = id;
  record.edition_name = normalizeText_(editionData.edition_name) || ('Edición ' + id);
  record.status = normalizeText_(editionData.status) || 'Cerrada';
  record.start_date = normalizeText_(editionData.start_date);
  record.end_date = normalizeText_(editionData.end_date);
  record.notes = normalizeText_(editionData.notes);

  if (existing) updateRowByNumber_(APP_CFG.SHEETS.EDITIONS, existing.__rowNum, record);
  else appendObjectRow_(APP_CFG.SHEETS.EDITIONS, record);

  if (record.status === 'Abierta') {
    var cfgRows = getRowsAsObjects_(APP_CFG.SHEETS.CONFIG);
    var activeRow = cfgRows.filter(function(r){ return r.clave === 'active_edition'; })[0];
    if (activeRow) {
      activeRow.valor = id;
      updateRowByNumber_(APP_CFG.SHEETS.CONFIG, activeRow.__rowNum, activeRow);
    }
  }
  auditLog_(actor.username, actor.role, 'save_edition', 'edition', id, record);
  return { ok: true };
}

function listInvitations(sessionToken, limit) {
  requireRole_(sessionToken, ['admin','viewer']);
  limit = Number(limit || 500);
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.INVITATIONS);
  rows.sort(function(a,b){
    return String(b.sent_at || b.opened_at || b.used_at || '').localeCompare(String(a.sent_at || a.opened_at || a.used_at || ''));
  });
  var fields = ['edition_id','email','estado','sent_at','opened_at','used_at','url_encuesta','token'];
  return rows.slice(0, limit).map(function(r){
    var out = {};
    fields.forEach(function(f){ out[f] = r[f]; });
    return out;
  });
}

function createInvitations(sessionToken, data) {
  var actor = requireRole_(sessionToken, ['admin']);
  var editionId = normalizeText_(data.edition_id) || activeEdition_();
  var emails = normalizeText_(data.emails).split(/[\n,;]+/).map(function(x){ return normalizeText_(x).toLowerCase(); }).filter(String);
  var created = [];
  emails.forEach(function(email) {
    var token = sha256Hex_(email + '|' + editionId + '|' + uuid_()).slice(0, 32);
    var url = getBaseUrl_() ? (getBaseUrl_() + '?token=' + encodeURIComponent(token)) : '';
    var row = {
      token: token,
      edition_id: editionId,
      email: email,
      nombre_destinatario: '',
      tipo_acceso: normalizeText_(data.tipo_acceso) || 'respondent',
      estado: 'Generado',
      url_encuesta: url,
      sent_at: '',
      opened_at: '',
      used_at: '',
      notes: normalizeText_(data.notes)
    };
    appendObjectRow_(APP_CFG.SHEETS.INVITATIONS, row);
    created.push(row);
  });
  auditLog_(actor.username, actor.role, 'create_invitations', 'invitation', editionId, { total: created.length });
  return created;
}

function sendInvitations(sessionToken, data) {
  var actor = requireRole_(sessionToken, ['admin']);
  var created = createInvitations(sessionToken, data);
  created.forEach(function(inv) {
    if (!inv.email) return;
    var subject = '[' + APP_CFG.ORG_NAME + '] Encuesta de colaboradores ' + inv.edition_id;
    var body = [
      'Estimado/a colaborador/a,',
      '',
      'Le compartimos el enlace único para completar la encuesta:',
      inv.url_encuesta || '(despliegue pendiente)',
      '',
      'Este enlace es personal y no debe reenviarse.',
      '',
      'Muchas gracias.'
    ].join('\n');
    MailApp.sendEmail(inv.email, subject, body);
  });

  var rows = getRowsAsObjects_(APP_CFG.SHEETS.INVITATIONS);
  rows.forEach(function(r) {
    var match = created.filter(function(c){ return c.token === r.token; })[0];
    if (match) {
      r.sent_at = nowIso_();
      r.estado = 'Enviado';
      updateRowByNumber_(APP_CFG.SHEETS.INVITATIONS, r.__rowNum, r);
    }
  });
  auditLog_(actor.username, actor.role, 'send_invitations', 'invitation', activeEdition_(), { total: created.length });
  return { ok: true, total: created.length };
}

function updateConfig(sessionToken, pairs) {
  var actor = requireRole_(sessionToken, ['admin']);
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.CONFIG);
  var byKey = {};
  rows.forEach(function(r){ byKey[r.clave] = r; });
  (pairs || []).forEach(function(p) {
    var key = normalizeText_(p.clave);
    if (!key) return;
    if (byKey[key]) {
      byKey[key].valor = normalizeText_(p.valor);
      byKey[key].descripcion = normalizeText_(p.descripcion || byKey[key].descripcion);
      updateRowByNumber_(APP_CFG.SHEETS.CONFIG, byKey[key].__rowNum, byKey[key]);
    } else {
      appendObjectRow_(APP_CFG.SHEETS.CONFIG, {
        clave: key,
        valor: normalizeText_(p.valor),
        descripcion: normalizeText_(p.descripcion)
      });
    }
  });
  auditLog_(actor.username, actor.role, 'update_config', 'config', '', { total: (pairs || []).length });
  return { ok: true };
}

function rebuildAnalytics() {
  var responseRows = getRowsAsObjects_(APP_CFG.SHEETS.RESPONSES);
  if (!responseRows.length) return { ok: true, rows: 0 };

  var responseHeaders = getHeader_(getSheet_(APP_CFG.SHEETS.RESPONSES));
  var analyticHeaders = responseHeaders.filter(function(h){ return APP_CFG.PII_FIELDS.indexOf(h) === -1; });
  var analyticData = [analyticHeaders].concat(responseRows.map(function(r) {
    return analyticHeaders.map(function(h){ return r[h]; });
  }));
  var shA = getSheet_(APP_CFG.SHEETS.ANALYTIC);
  shA.clearContents();
  shA.getRange(1,1,analyticData.length,analyticHeaders.length).setValues(analyticData);

  var longHeaders = ['edicion','fecha_encuesta','respondente_id','source_uuid','campo','valor'];
  var longRows = [];
  responseRows.forEach(function(r) {
    APP_CFG.LONG_FIELDS.forEach(function(f) {
      var value = r[f];
      if (value !== '' && value !== null && value !== undefined) {
        longRows.push([r.edicion, r.fecha_encuesta, r.respondente_id, r.source_uuid, f, value]);
      }
    });
  });
  var shL = getSheet_(APP_CFG.SHEETS.LONG);
  shL.clearContents();
  shL.getRange(1,1,1,longHeaders.length).setValues([longHeaders]);
  if (longRows.length) shL.getRange(2,1,longRows.length,longHeaders.length).setValues(longRows);
  bumpDashboardCacheVersion_();
  return { ok: true, rows: responseRows.length, longRows: longRows.length };
}
