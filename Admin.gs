
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

// Campos mínimos para dashboard y tablas (evita leer/serializar columnas pesadas).
var ANALYTIC_MIN_FIELDS_ = [
  'submission_ts',
  'edicion',
  'fecha_encuesta',
  'tipo_colaborador',
  'area_colaborador_indirecto',
  'sexo',
  'edad',
  'edad_grupo',
  'departamento_residencia',
  'descuento_ips_actual',
  'salario_actual_banda',
  'empresa_contratista',
  'estado_calidad',
  'n_flags',
  'respondente_id',
  'source_uuid'
];

function getDashboardSummary(sessionToken) {
  requireRole_(sessionToken, ['admin','viewer']);
  var cacheKey = 'dash_summary_multi_all_' + getDashboardCacheVersion_();
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (cached) {
    return jsonParse_(cached, null) || {};
  }

  var allRows = getCombinedAnalyticRows_();
  var total = 0;
  var directos = 0;
  var indirectos = 0;
  var conIps = 0;
  var ipsAplicableTotal = 0;
  var calidadOk = 0;
  var calidadRevisar = 0;
  var calidadCritico = 0;
  var edadesSum = 0;
  var edadesCount = 0;
  var flagsSum = 0;

  var last7 = 0;
  var last30 = 0;
  var prev30 = 0;
  var minFecha = '';
  var maxFecha = '';
  var byMes = {};
  var byEmpresaIndirecto = {};
  var ipsByTipo = {};

  var perEditionAll = {};

  var byEdicionesAll = {};
  var byEdicion = {};
  var byTipo = {};
  var bySexo = {};
  var byAreaIndirecto = {};
  var byDeptResidencia = {};
  var byIpsActual = {};
  var bySalario = {};
  var byGrupoEdad = {};
  var byEstadoCalidad = {};

  var mTipo = {};
  var mSexo = {};
  var mDept = {};
  var mEmpresa = {};
  var mSalario = {};
  var mCalidad = {};

  function inc_(map, key) {
    map[key] = (map[key] || 0) + 1;
  }
  function incM_(map, ed, key) {
    if (!map[ed]) map[ed] = {};
    map[ed][key] = (map[ed][key] || 0) + 1;
  }

  function keyOf_(value) {
    return normalizeText_(value) || 'Sin dato';
  }

  function classifyCalidad_(value) {
    var t = keyOf_(value).toLowerCase();
    if (t === 'ok') return 'ok';
    if (t.indexOf('crit') > -1) return 'critico';
    if (t.indexOf('revis') > -1) return 'revisar';
    return t || 'sin dato';
  }

  function ymd_(value) {
    if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var t = normalizeText_(value);
    if (!t) return '';
    var m = t.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    // Intento de parseo como fecha
    var d = new Date(t);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    return '';
  }

  function parseYmdDate_(ymd) {
    var m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function monthKey_(ymd) {
    return ymd && ymd.length >= 7 ? ymd.slice(0, 7) : '';
  }

  function getEditionStats_(ed) {
    if (!perEditionAll[ed]) {
      perEditionAll[ed] = {
        edicion: ed,
        total: 0,
        directos: 0,
        indirectos: 0,
        conIps: 0,
        ipsAplicable: 0,
        ok: 0,
        revisar: 0,
        critico: 0,
        edadesSum: 0,
        edadesCount: 0,
        flagsSum: 0
      };
    }
    return perEditionAll[ed];
  }

  var now = new Date();
  var MS_DAY = 24 * 3600 * 1000;
  var start7 = new Date(now.getTime() - 7 * MS_DAY);
  var start30 = new Date(now.getTime() - 30 * MS_DAY);
  var start60 = new Date(now.getTime() - 60 * MS_DAY);

  allRows.forEach(function(r) {
    var ed = keyOf_(r.edicion);
    inc_(byEdicionesAll, ed);
    var edStats = getEditionStats_(ed);
    edStats.total++;

    var tipoAll = keyOf_(r.tipo_colaborador);
    if (tipoAll === 'Directo') edStats.directos++;
    if (tipoAll === 'Indirecto') edStats.indirectos++;

    var ipsAll = keyOf_(r.descuento_ips_actual);
    if (ipsAll !== 'no aplica' && ipsAll !== 'no aplica (justificado)' && ipsAll !== 'justificado' && ipsAll.indexOf('justificad') === -1 && ipsAll !== 'inactivo') {
      edStats.ipsAplicable++;
    }
    if (isYesLike_(ipsAll)) edStats.conIps++;

    var calAll = classifyCalidad_(r.estado_calidad);
    if (calAll === 'ok') edStats.ok++;
    else if (calAll === 'critico') edStats.critico++;
    else if (calAll === 'revisar') edStats.revisar++;

    var edadAll = Number(r.edad);
    if (!isNaN(edadAll) && edadAll >= 15 && edadAll <= 80) {
      edStats.edadesSum += edadAll;
      edStats.edadesCount++;
    }
    var nfAll = Number(r.n_flags);
    if (!isNaN(nfAll)) edStats.flagsSum += nfAll;

    total++;
    inc_(byEdicion, ed);

    var tipo = keyOf_(r.tipo_colaborador);
    inc_(byTipo, tipo);
    incM_(mTipo, ed, tipo);
    if (tipo === 'Directo') directos++;
    if (tipo === 'Indirecto') {
      indirectos++;
      inc_(byAreaIndirecto, keyOf_(r.area_colaborador_indirecto));
      var emp = keyOf_(r.empresa_contratista);
      inc_(byEmpresaIndirecto, emp);
      incM_(mEmpresa, ed, emp);
    }

    inc_(bySexo, keyOf_(r.sexo));
    incM_(mSexo, ed, keyOf_(r.sexo));
    var dept = keyOf_(r.departamento_residencia);
    inc_(byDeptResidencia, dept);
    incM_(mDept, ed, dept);

    var ips = keyOf_(r.descuento_ips_actual);
    inc_(byIpsActual, ips);
    var isAplicable = (ips !== 'no aplica' && ips !== 'no aplica (justificado)' && ips !== 'justificado' && ips.indexOf('justificad') === -1 && ips !== 'inactivo');
    if (isAplicable) ipsAplicableTotal++;
    if (isYesLike_(ips)) conIps++;

    var sal = keyOf_(r.salario_actual_banda);
    inc_(bySalario, sal);
    incM_(mSalario, ed, sal);

    inc_(byGrupoEdad, keyOf_(r.edad_grupo));
    var cal = classifyCalidad_(r.estado_calidad);
    inc_(byEstadoCalidad, keyOf_(r.estado_calidad));
    incM_(mCalidad, ed, cal);
    if (cal === 'ok') calidadOk++;
    else if (cal === 'critico') calidadCritico++;
    else if (cal === 'revisar') calidadRevisar++;

    var nf = Number(r.n_flags);
    if (!isNaN(nf)) flagsSum += nf;

    // IPS por tipo (tabla/figura adicional)
    if (!ipsByTipo[tipo]) ipsByTipo[tipo] = { tipo: tipo, conIps: 0, sinIps: 0, total: 0, aplicables: 0 };
    ipsByTipo[tipo].total++;
    if (isAplicable) {
       ipsByTipo[tipo].aplicables++;
       if (isYesLike_(ips)) ipsByTipo[tipo].conIps++;
       else ipsByTipo[tipo].sinIps++;
    }

    var edad = Number(r.edad);
    if (!isNaN(edad) && edad >= 15 && edad <= 80) {
      edadesSum += edad;
      edadesCount++;
    }

    // Serie temporal y ventanas recientes (usa fecha_encuesta preferentemente)
    var fecha = ymd_(r.fecha_encuesta) || ymd_(r.submission_ts);
    if (fecha) {
      if (!minFecha || fecha < minFecha) minFecha = fecha;
      if (!maxFecha || fecha > maxFecha) maxFecha = fecha;
      var mk = monthKey_(fecha);
      if (mk) inc_(byMes, mk);

      var d = parseYmdDate_(fecha);
      if (d) {
        if (d >= start7) last7++;
        if (d >= start30) last30++;
        else if (d >= start60) prev30++;
      }
    }
  });

  var edadProm = edadesCount ? Math.round((edadesSum / edadesCount) * 10) / 10 : 0;
  var flagsProm = total ? Math.round((flagsSum / total) * 10) / 10 : 0;
  var calidadOkPct = total ? Math.round(calidadOk * 100 / total) : 0;
  var delta30 = prev30 ? Math.round((last30 - prev30) * 100 / prev30) : (last30 ? 100 : 0);

  function mapToItems_(map) {
    return Object.keys(map).sort().map(function(k) { return { label: k, value: map[k] }; });
  }

  function topItems_(map, n, excludeLabels) {
    excludeLabels = excludeLabels || [];
    var items = mapToItems_(map)
      .filter(function(x){ return excludeLabels.indexOf(x.label) === -1; })
      .sort(function(a, b) { return b.value - a.value; });
    return items.slice(0, n || 10);
  }

  var serieMes = mapToItems_(byMes).sort(function(a, b) { return a.label.localeCompare(b.label); });
  if (serieMes.length > 18) serieMes = serieMes.slice(serieMes.length - 18);

  var editionStats = Object.keys(perEditionAll).map(function(k) {
    var st = perEditionAll[k];
    var edadP = st.edadesCount ? Math.round((st.edadesSum / st.edadesCount) * 10) / 10 : 0;
    var ipsPct = st.ipsAplicable ? Math.round(st.conIps * 100 / st.ipsAplicable) : 0;
    var okPct = st.total ? Math.round(st.ok * 100 / st.total) : 0;
    var flagsP = st.total ? Math.round((st.flagsSum / st.total) * 10) / 10 : 0;
    return {
      edicion: st.edicion,
      total: st.total,
      directos: st.directos,
      indirectos: st.indirectos,
      conIpsPct: ipsPct,
      calidadOkPct: okPct,
      edadProm: edadP,
      nFlagsProm: flagsP,
      ok: st.ok,
      revisar: st.revisar,
      critico: st.critico,
      conIps: st.conIps,
      ipsAplicable: st.ipsAplicable,
      edadesSum: st.edadesSum,
      edadesCount: st.edadesCount,
      flagsSum: st.flagsSum
    };
  }).sort(function(a, b) { return a.edicion.localeCompare(b.edicion); });

  var tipoPorEdicion = editionStats.map(function(s) {
    return { edicion: s.edicion, directos: s.directos, indirectos: s.indirectos, total: s.total };
  });

  var calidadPorEdicion = editionStats.map(function(s) {
    return { edicion: s.edicion, ok: s.ok, revisar: s.revisar, critico: s.critico, total: s.total };
  });

  var ipsPorTipo = Object.keys(ipsByTipo).map(function(k) { return ipsByTipo[k]; })
    .sort(function(a, b) { return a.tipo.localeCompare(b.tipo); });

  var summary = {
    edicionesDisponibles: mapToItems_(byEdicionesAll).sort(function(a,b){ return a.label.localeCompare(b.label); }),
    total:      total,
    directos:   directos,
    indirectos: indirectos,
    conIps:     conIps,
    ipsAplicable: ipsAplicableTotal,
    conIpsPct:  ipsAplicableTotal ? Math.round(conIps * 100 / ipsAplicableTotal) : 0,
    edadProm:   edadProm,
    calidadOkPct: calidadOkPct,
    calidadOk: calidadOk,
    calidadRevisar: calidadRevisar,
    calidadCritico: calidadCritico,
    nFlagsProm: flagsProm,
    last7: last7,
    last30: last30,
    prev30: prev30,
    delta30Pct: delta30,
    rangoFechas: { min: minFecha, max: maxFecha },
    serieMes: serieMes,
    editionStats: editionStats,
    tipoPorEdicion: tipoPorEdicion,
    calidadPorEdicion: calidadPorEdicion,
    ipsPorTipo: ipsPorTipo,
    topEmpresasIndirecto: topItems_(byEmpresaIndirecto, 12, ['Sin dato']),
    porEdicion:    mapToItems_(byEdicion).sort(function(a,b){ return a.label.localeCompare(b.label); }),
    porTipo:       mapToItems_(byTipo),
    porSexo:       mapToItems_(bySexo),
    porAreaIndirecto:   mapToItems_(byAreaIndirecto),
    porDeptResidencia:  mapToItems_(byDeptResidencia).sort(function(a,b){ return b.value-a.value; }).slice(0,15),
    porIpsActual:       mapToItems_(byIpsActual),
    porSalario:         sortSalario_(mapToItems_(bySalario)),
    porGrupoEdad:       sortGrupoEdad_(mapToItems_(byGrupoEdad)),
    porEstadoCalidad:   mapToItems_(byEstadoCalidad),
    multi: {
      tipo: mTipo,
      sexo: mSexo,
      dept: mDept,
      empresa: mEmpresa,
      salario: mSalario,
      calidad: mCalidad
    }
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

function getAnalyticHeaders_() {
  var responseHeaders = getHeader_(getSheet_(APP_CFG.SHEETS.RESPONSES));
  return responseHeaders.filter(function(h) { return APP_CFG.PII_FIELDS.indexOf(h) === -1; });
}

function appendResponsesToAnalytics_(responseRows) {
  responseRows = Array.isArray(responseRows) ? responseRows.filter(Boolean) : [];
  if (!responseRows.length) return { ok: true, rows: 0, longRows: 0 };

  var analyticHeaders = getAnalyticHeaders_();
  syncHeaders_(APP_CFG.SHEETS.ANALYTIC, analyticHeaders);
  var shA = getSheet_(APP_CFG.SHEETS.ANALYTIC);
  var analyticData = responseRows.map(function(r) {
    return analyticHeaders.map(function(h) { return r[h] !== undefined ? r[h] : ''; });
  });
  if (analyticData.length) {
    shA.getRange(shA.getLastRow() + 1, 1, analyticData.length, analyticHeaders.length).setValues(analyticData);
  }

  var longHeaders = ['edicion','fecha_encuesta','respondente_id','source_uuid','campo','valor'];
  syncHeaders_(APP_CFG.SHEETS.LONG, longHeaders);
  var shL = getSheet_(APP_CFG.SHEETS.LONG);
  var longRows = [];
  responseRows.forEach(function(r) {
    APP_CFG.LONG_FIELDS.forEach(function(f) {
      var value = r[f];
      if (value !== '' && value !== null && value !== undefined) {
        longRows.push([r.edicion, r.fecha_encuesta, r.respondente_id, r.source_uuid, f, value]);
      }
    });
  });
  if (longRows.length) {
    shL.getRange(shL.getLastRow() + 1, 1, longRows.length, longHeaders.length).setValues(longRows);
  }

  bumpDashboardCacheVersion_();
  return { ok: true, rows: analyticData.length, longRows: longRows.length };
}

/**
 * Devuelve filas combinadas para analitica:
 * 1) snapshot embebido (historico, lectura rapida)
 * 2) filas live desde BASE_ANALITICA (respuestas nuevas)
 * La deduplicacion se hace por source_uuid y fallback por (edicion|respondente_id|fecha_encuesta).
 */
function getCombinedAnalyticRows_() {
  // Importante: CacheService tiene límite ~100KB por key; serializar arrays grandes
  // termina siendo más costoso y muchas veces no se guarda. Se prioriza velocidad.
  var fields = ANALYTIC_MIN_FIELDS_;
  var liveRows = getRecentRowsAsObjects_(APP_CFG.SHEETS.ANALYTIC, null, fields);
  if (liveRows.length) return liveRows;
  return getEmbeddedSnapshotRows_(fields);

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

  // Prefiere filas live si hay overlap con snapshot (más campos / más actual).
  liveRows.forEach(addRow);
  snapRows.forEach(addRow);
  return out;
}

function getLiveTailLimit_() {
  return 500;
}

// =========================================================================
// SCRIPT DE CORRECCIÓN DE DATOS (Fase 2)
// =========================================================================

function patchIPSExceptions() {
  var ss = getBackendSpreadsheet_();
  var sheet = ss.getSheetByName(APP_CFG.SHEETS.RESPONSES);
  if(!sheet) throw new Error("No se encontro RESPUESTAS");
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var empIdx = headers.indexOf('empresa_contratista_raw');
  if (empIdx === -1) empIdx = headers.indexOf('empresa_contratista');
  var cargoIdx = headers.indexOf('cargo_raw');
  if (cargoIdx === -1) cargoIdx = headers.indexOf('cargo');
  var tipoIdx = headers.indexOf('tipo_colaborador');
  var ipsIdx = headers.indexOf('descuento_ips_actual');
  if (ipsIdx === -1) ipsIdx = headers.indexOf('ips_actual');
  var nombreIdx = headers.indexOf('nombre_completo');
  if (nombreIdx === -1) nombreIdx = headers.indexOf('nombre_completo_raw');
  
  if (empIdx === -1 || cargoIdx === -1 || tipoIdx === -1 || ipsIdx === -1) {
    throw new Error("Columnas no encontradas. Cabeceras: " + headers.join(", "));
  }
  
  var OVERRIDES = [
    { emp: "ARAMI", cargo: "Fumigador", val: "No aplica (Justificado)" },
    { emp: "ASISMOE", cargo: "Medicina Laboral", val: "No aplica (Justificado)" },
    { emp: "ASISMOE", cargo: "Médico Laboral", val: "No aplica (Justificado)" },
    { emp: "ASISMOE", cargo: "Enfermero", val: "No aplica (Justificado)" },
    { emp: "BUREAU VERITAS", cargo: "Auxiliar Administrativo", val: "Sí" },
    { emp: "BUREAU VERITAS PY SRL", cargo: "Ing. Civil", val: "No aplica (Justificado)" },
    { emp: "CONSTRUCTORA JM", cargo: "Propietario", val: "No aplica (Justificado)" },
    { emp: "CONSTRUCTORA JM", cargo: "Chofer", val: "Sí" },
    { emp: "CONSTRUCTORA JM INGENIERIA", cargo: "Directora de JM Constructora", val: "No aplica (Justificado)" },
    { emp: "CONSTRUCTORA JM/ELECTROMECANICA SAN RAFAEL", cargo: "Propietario", val: "No aplica (Justificado)" },
    { emp: "CSI INGENIEROS PARAGUAY", cargo: "Técnica Ambiental", val: "No aplica (Justificado)" },
    { emp: "DAF", cargo: "Cocinera Encargada", val: "No aplica (Justificado)" },
    { emp: "G.J.R. COMERCIAL", cargo: "Parte Administrativa", val: "No aplica (Justificado)" },
    { emp: "Galbon", cargo: "Paramédico", val: "No aplica (Justificado)" },
    { emp: "INFOMASTER", cargo: "Mantenimiento de Torre", val: "No aplica (Justificado)" },
    { emp: "INGENIERIA AMBIENTAL S.A.", cargo: "Directivo", val: "No aplica (Justificado)" },
    { emp: "LO DE GANSO", cargo: "Proveedor de Servicio", val: "No aplica (Justificado)" },
    { emp: "MORADO EMPREND", cargo: "Propietaria", val: "No aplica (Justificado)" }
  ];

  var NAMES_SI = [
    "EDGAR DAVID ARGUELLO PEREIRA", "ANICIA NOEMI GONZALEZ CENTURION", "RENATO RAMON GONZALEZ CENTURION",
    "WILSON DAVID BENITEZ FERNANDEZ", "ELBA MELGAREJO MORINIGO", "AGUSTIN ACOSTA BENITEZ",
    "ALDO JAVIER GONZALEZ", "HUGO OVELAR BUSTAMANTE", "RIOS COLMAN CRISTHIAN", "CRISTIAN ARIEL AVALOS CANO"
  ];

  var NAMES_NO_APLICA = [
    "DOLLY GRICELDA MENDEZ CANTERO", "ELIAS SANTOS GOMES JUNIOR", "EDSON FERREIRA DA SILVA",
    "WILFRIDO PEREZ", "MIRIAM CORDEIRO ISTORI", "MARIANO RAMON SALERMO RAMIREZ",
    "MARIA CELESTE GONZALEZ GONZALEZ", "OSCAR ARMANDO GAVILAN ROJAS", "ALFREDO ARIEL ARECO PEREZ",
    "CESAR ORLANDO SOSA CRISTALDO", "JENNER KARIM MEDINA GARCIA", "Marcos García",
    "JOSÉ ROLANDO CHAMORRO LESME", "AGACIR LUIS GIARETTA", "CRISTIAN GUSTAVO ALMEIDA BENITEZ",
    "JUAN BAUTISTA GIARETTA", "LUIS FELIPE ESPINOLA ZIMMERMAN", "orivaldo Almeida Cardoso",
    "WILLI KOLBACIUK SILVA", "PALACIOS FERREIRA LUIS ANTONIO", "TAMARA JACQUELINE RUIZ DEGIACOMI",
    "BLAS IGNACIO MACIEL VILLALBA", "CARLOS ENRIQUE BERNAL RIOS", "Gabriela Vera",
    "HUGO RICARDO CABRAL ISNARDI", "RUTH MARIA NIZ FLORENCIANI", "Adenilson Fagner Silva Pereira",
    "PERLA ORTIZ"
  ];
  
  function norm(str) {
    return String(str||'').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  
  var modCount = 0;
  for (var i = 1; i < data.length; i++) {
    var rEmp = norm(data[i][empIdx]);
    var rCargo = norm(data[i][cargoIdx]);
    var rName = nombreIdx > -1 ? norm(data[i][nombreIdx]) : '';
    
    var overrideValue = null;
    
    // Auto-justify Directos who don't have IPS
    if (rEmp.indexOf('paracel') > -1 || data[i][tipoIdx] === 'Directo') {
      var currentIps = norm(data[i][ipsIdx]);
      if (currentIps !== 'si') {
        overrideValue = 'No aplica (Justificado)';
      }
    }
    
    if (!overrideValue && rName) {
      for (var k = 0; k < NAMES_SI.length; k++) {
        if (rName.indexOf(norm(NAMES_SI[k])) > -1 || norm(NAMES_SI[k]).indexOf(rName) > -1) {
          overrideValue = "Sí";
          break;
        }
      }
      if (!overrideValue) {
        for (var k = 0; k < NAMES_NO_APLICA.length; k++) {
          if (rName.indexOf(norm(NAMES_NO_APLICA[k])) > -1 || norm(NAMES_NO_APLICA[k]).indexOf(rName) > -1) {
            overrideValue = "No aplica (Justificado)";
            break;
          }
        }
      }
    }

    if (!overrideValue) {
      for (var j = 0; j < OVERRIDES.length; j++) {
        var oEmp = norm(OVERRIDES[j].emp);
        var oCargo = norm(OVERRIDES[j].cargo);
        if (rEmp.indexOf(oEmp) > -1 && rCargo.indexOf(oCargo) > -1) {
          overrideValue = OVERRIDES[j].val;
          break;
        }
      }
    }
    
    if (overrideValue) {
      if (data[i][ipsIdx] !== overrideValue) {
        data[i][ipsIdx] = overrideValue;
        modCount++;
      }
    }
  }
  
  if (modCount > 0) {
    sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  }
  
  // Reconstruir los datos
  rebuildAnalytics();
  return "Se modificaron " + modCount + " registros.";
}

function getRecentRowsAsObjects_(sheetName, limit, fields) {
  var sh = getSheet_(sheetName);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  var dataRows = lastRow - 1;
  var take = Math.min(Math.max(Number(limit || dataRows), 1), dataRows);
  var startRow = lastRow - take + 1;

  var headers = getHeader_(sh);
  var colByHeader = {};
  headers.forEach(function(h, i) { colByHeader[h] = i + 1; });
  var pick = (fields && fields.length) ? fields : headers;

  // Si se solicita un subconjunto de campos, leer solo las columnas necesarias
  // (y en segmentos contiguos) para evitar traer toda la hoja.
  var spec = pick.map(function(h) { return { h: h, col: colByHeader[h] || 0 }; });
  var cols = spec.map(function(s) { return s.col; }).filter(function(c) { return c > 0; });
  if (!cols.length) return [];

  cols.sort(function(a, b) { return a - b; });
  var segments = [];
  cols.forEach(function(c) {
    var last = segments.length ? segments[segments.length - 1] : null;
    if (!last || c > last.end + 1) segments.push({ start: c, end: c });
    else last.end = c;
  });

  var segValues = segments.map(function(s) {
    return sh.getRange(startRow, s.start, take, s.end - s.start + 1).getValues();
  });

  var colMap = {};
  segments.forEach(function(s, segIdx) {
    for (var c = s.start; c <= s.end; c++) {
      colMap[c] = { segIdx: segIdx, offset: c - s.start };
    }
  });

  var out = [];
  for (var r = 0; r < take; r++) {
    var obj = {};
    var any = false;
    spec.forEach(function(s) {
      if (!s.col) { obj[s.h] = ''; return; }
      var m = colMap[s.col];
      var v = segValues[m.segIdx][r][m.offset];
      obj[s.h] = v;
      if (v !== '' && v !== null && v !== undefined) any = true;
    });
    if (!any) continue;
    obj.__rowNum = startRow + r;
    out.push(obj);
  }
  return out;
}

/**
 * Lee CSV embebido en SnapshotData.html entre marcadores:
 * <!-- SNAPSHOT_CSV_BEGIN --> ... <!-- SNAPSHOT_CSV_END -->
 */
function getEmbeddedSnapshotRows_(fields) {
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
    var idx = {};
    headers.forEach(function(h, i) { idx[h] = i; });
    var pick = (fields && fields.length) ? fields : headers;
    var rows = [];
    for (var r = 1; r < matrix.length; r++) {
      var row = matrix[r];
      if (!row || row.join('') === '') continue;
      var obj = {};
      pick.forEach(function(h) {
        var i = idx[h];
        obj[h] = (i === undefined) ? '' : row[i];
      });
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
    rows.forEach(function(r) {
      if (normalizeText_(r.edition_id) !== id && normalizeText_(r.status) === 'Abierta') {
        r.status = 'Cerrada';
        updateRowByNumber_(APP_CFG.SHEETS.EDITIONS, r.__rowNum, r);
      }
    });
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
  var fields = ['edition_id','email','estado','sent_at','opened_at','used_at','url_encuesta','token'];
  var rows = getRecentRowsAsObjects_(APP_CFG.SHEETS.INVITATIONS, limit, fields);
  rows.sort(function(a,b){
    return String(b.sent_at || b.opened_at || b.used_at || '').localeCompare(String(a.sent_at || a.opened_at || a.used_at || ''));
  });
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
    row.__rowNum = appendObjectRow_(APP_CFG.SHEETS.INVITATIONS, row);
    created.push(row);
  });
  auditLog_(actor.username, actor.role, 'create_invitations', 'invitation', editionId, { total: created.length });
  return created;
}

function sendInvitations(sessionToken, data) {
  var actor = requireRole_(sessionToken, ['admin']);
  var created = createInvitations(sessionToken, data);
  var ts = nowIso_();
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

  created.forEach(function(inv) {
    if (!inv.__rowNum) return;
    inv.sent_at = ts;
    inv.estado = 'Enviado';
    updateRowByNumber_(APP_CFG.SHEETS.INVITATIONS, inv.__rowNum, inv);
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
  try {
    var responseRows = getRowsAsObjects_(APP_CFG.SHEETS.RESPONSES);
    var analyticHeaders = getAnalyticHeaders_();
    var analyticData = responseRows.map(function(r) {
      return analyticHeaders.map(function(h){ return r[h]; });
    });
    var shA = getSheet_(APP_CFG.SHEETS.ANALYTIC);
    shA.clearContents();
    if (analyticHeaders.length) {
      shA.getRange(1,1,1,analyticHeaders.length).setValues([analyticHeaders]);
    }
    if (analyticData.length) {
      shA.getRange(2,1,analyticData.length,analyticHeaders.length).setValues(analyticData);
    }

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
  } catch (e) {
    throw new Error('Error al reconstruir la analítica: ' + e.message);
  }
}
