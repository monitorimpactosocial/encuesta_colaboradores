
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function nowIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
}

function todayIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function uuid_() {
  return Utilities.getUuid();
}

function sha256Hex_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8);
  return bytes.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function jsonParse_(text, fallback) {
  try { return JSON.parse(text); } catch (err) { return fallback; }
}

function jsonStringify_(obj) {
  return JSON.stringify(obj || {});
}

function normalizeText_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

function removeAccents_(text) {
  return normalizeText_(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function upperKey_(value) {
  var t = removeAccents_(value).toUpperCase();
  return t;
}

function properCase_(value) {
  var t = normalizeText_(value).toLowerCase();
  if (!t) return '';
  var lowers = {de:1, del:1, la:1, las:1, los:1, y:1, da:1, do:1, dos:1, das:1};
  return t.split(' ').map(function(w) {
    return lowers[w] ? w : w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

function boolText_(v) {
  return v ? 'Sí' : 'No';
}

function cleanIdNumber_(value) {
  var t = normalizeText_(value).replace(/\D/g, '');
  return t || '';
}

function respondentHash_(cedula) {
  var clean = cleanIdNumber_(cedula);
  return clean ? sha256Hex_(clean).slice(0, 16) : '';
}

function columnMap_(headers) {
  var map = {};
  headers.forEach(function(h, i) { map[h] = i + 1; });
  return map;
}

var SHEET_CACHE_ = {};

function getSheet_(name) {
  if (SHEET_CACHE_[name]) return SHEET_CACHE_[name];
  var ss = getBackendSpreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('No existe la hoja: ' + name);
  SHEET_CACHE_[name] = sh;
  return sh;
}

function getHeader_(sheet) {
  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(x) { return normalizeText_(x); });
}

function getRowsAsObjects_(sheetName) {
  var sh = getSheet_(sheetName);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(h) { return normalizeText_(h); });
  return values.slice(1).filter(function(row) {
    return row.join('') !== '';
  }).map(function(row, idx) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    obj.__rowNum = idx + 2;
    return obj;
  });
}

function appendObjectRow_(sheetName, obj) {
  var sh = getSheet_(sheetName);
  var headers = getHeader_(sh);
  var row = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sh.appendRow(row);
  return sh.getLastRow();
}

function updateRowByNumber_(sheetName, rowNumber, obj) {
  var sh = getSheet_(sheetName);
  var headers = getHeader_(sh);
  var current = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  var row = headers.map(function(h, i) { return obj[h] !== undefined ? obj[h] : current[i]; });
  sh.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
}

function ensureHeaders_(sheetName, headers) {
  var ss = getBackendSpreadsheet_();
  var sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  var current = getHeader_(sh);
  var empty = current.length === 1 && current[0] === '';
  if (empty || sh.getLastRow() === 0) {
    sh.clear();
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

function syncHeaders_(sheetName, headers) {
  var sh = ensureHeaders_(sheetName, headers);
  var current = getHeader_(sh);
  var empty = current.length === 1 && current[0] === '';
  if (empty || !current.length) {
    sh.clear();
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    return headers.slice();
  }
  var missing = headers.filter(function(h) { return current.indexOf(h) === -1; });
  if (missing.length) {
    sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
    current = current.concat(missing);
  }
  return current;
}

/* ── Chunked CacheService helpers ───────────────────────
   CacheService limit: 100 KB per entry. For larger payloads we split the
   JSON into 90 KB slices, store them as key_0…key_N, plus key_n = count.
   TTL is set identically on all chunks so they expire together.
────────────────────────────────────────────────────────── */
var CHUNK_SIZE_ = 90000;

function putChunked_(cache, key, value, ttl) {
  try {
    var json = JSON.stringify(value);
    var n = Math.ceil(json.length / CHUNK_SIZE_);
    var items = {};
    items[key + '__n'] = String(n);
    for (var i = 0; i < n; i++) {
      items[key + '__' + i] = json.slice(i * CHUNK_SIZE_, (i + 1) * CHUNK_SIZE_);
    }
    cache.putAll(items, ttl);
  } catch (e) { /* silent – cache write failure is not fatal */ }
}

function getChunked_(cache, key) {
  try {
    var nStr = cache.get(key + '__n');
    if (!nStr) return null;
    var n = Number(nStr);
    var keys = [key + '__n'];
    for (var i = 0; i < n; i++) keys.push(key + '__' + i);
    var items = cache.getAll(keys);
    var parts = [];
    for (var j = 0; j < n; j++) {
      var part = items[key + '__' + j];
      if (!part) return null;
      parts.push(part);
    }
    return JSON.parse(parts.join(''));
  } catch (e) { return null; }
}

function auditLog_(actor, role, action, entity, entityId, payload) {
  try {
    appendObjectRow_(APP_CFG.SHEETS.AUDIT, {
      event_ts: nowIso_(),
      actor: actor || '',
      role: role || '',
      action: action || '',
      entity: entity || '',
      entity_id: entityId || '',
      payload_json: jsonStringify_(payload || {})
    });
  } catch (err) {
  }
}

function requireRole_(sessionToken, allowedRoles) {
  var user = validateSession_(sessionToken);
  if (!user) throw new Error('Sesión inválida o expirada.');
  if (allowedRoles.indexOf(user.role) === -1) throw new Error('Permiso insuficiente.');
  return user;
}

function activeEdition_() {
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.EDITIONS);
  var open = rows.filter(function(r) { return String(r.status).toLowerCase() === 'abierta'; });
  if (open.length) return open[0].edition_id;
  var cfg = getConfigMap_();
  return cfg.active_edition || '';
}

function getConfigMap_() {
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.CONFIG);
  var out = {};
  rows.forEach(function(r) { out[r.clave] = String(r.valor); });
  return out;
}
