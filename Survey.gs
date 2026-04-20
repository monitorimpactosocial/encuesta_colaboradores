
function getSurveySchema(token) {
  var invitation = token ? getInvitationByToken_(token) : null;
  if (token && !invitation) throw new Error('Token inválido.');
  if (invitation && invitation.estado === 'Usado') throw new Error('El enlace ya fue utilizado.');
  if (invitation && invitation.estado === 'Anulado') throw new Error('El enlace fue anulado.');
  return getSurveySchemaFromInvitation_(invitation);
}

function getSurveySchemaFromInvitation_(invitation) {
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.QUESTIONNAIRE)
    .sort(function(a, b) { return Number(a.question_order) - Number(b.question_order); });

  var sections = {};
  rows.forEach(function(r) {
    var sid = r.section_id;
    if (!sections[sid]) {
      sections[sid] = {
        id: sid,
        order: Number(r.section_order),
        label: r.section_label,
        questions: []
      };
    }
    sections[sid].questions.push({
      field: r.field_name,
      label: r.label,
      type: r.input_type,
      required: String(r.required).toUpperCase() === 'TRUE',
      options: jsonParse_(r.options_json || '[]', []),
      visibleIf: normalizeText_(r.visible_if),
      pii: String(r.contains_pii).toUpperCase() === 'TRUE',
      analytics: String(r.include_in_analytics).toUpperCase() === 'TRUE'
    });
  });

  return {
    editionId: invitation ? invitation.edition_id : activeEdition_(),
    invitation: invitation ? {
      email: invitation.email,
      nombre: invitation.nombre_destinatario,
      token: invitation.token
    } : null,
    sections: Object.keys(sections).map(function(k) { return sections[k]; }).sort(function(a,b){ return a.order - b.order; }),
    catalogs: buildClientCatalogs_()
  };
}

function buildClientCatalogs_() {
  var rows = getRowsAsObjects_(APP_CFG.SHEETS.CATALOGS);
  var out = {};
  rows.forEach(function(r) {
    if (!out[r.catalogo]) out[r.catalogo] = [];
    out[r.catalogo].push({ code: r.codigo, label: r.etiqueta });
  });
  return out;
}

function getInvitationByToken_(token) {
  token = normalizeText_(token);
  if (!token) return null;
  var sh = getSheet_(APP_CFG.SHEETS.INVITATIONS);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return null;

  var headers = getHeader_(sh);
  var tokenCol = headers.indexOf('token') + 1;
  if (tokenCol < 1) throw new Error('Hoja INVITACIONES sin columna token.');

  var finder = sh.getRange(2, tokenCol, lastRow - 1, 1)
    .createTextFinder(token)
    .matchEntireCell(true);
  var cell = finder.findNext();
  if (!cell) return null;
  var rowNum = cell.getRow();
  var values = sh.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = values[i]; });
  obj.__rowNum = rowNum;
  return obj;
}

function markInvitationOpened(token) {
  var inv = getInvitationByToken_(token);
  if (!inv) return { ok: false };
  if (!normalizeText_(inv.opened_at)) {
    inv.opened_at = nowIso_();
    if (!normalizeText_(inv.estado)) inv.estado = 'Abierto';
    updateRowByNumber_(APP_CFG.SHEETS.INVITATIONS, inv.__rowNum, inv);
  }
  return { ok: true };
}

function submitSurvey(token, payload) {
  var inv = getInvitationByToken_(token);
  if (!inv) throw new Error('Token inválido.');
  if (String(inv.estado) === 'Usado') throw new Error('La encuesta ya fue respondida con este enlace.');
  if (String(inv.estado) === 'Anulado') throw new Error('El enlace fue anulado.');

  var schema = getSurveySchemaFromInvitation_(inv);
  validatePayloadAgainstSchema_(schema.sections, payload || {});

  var row = buildResponseRow_(payload || {}, inv);
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    appendObjectRow_(APP_CFG.SHEETS.RESPONSES, row);

    inv.estado = 'Usado';
    inv.used_at = nowIso_();
    if (!normalizeText_(inv.opened_at)) inv.opened_at = nowIso_();
    updateRowByNumber_(APP_CFG.SHEETS.INVITATIONS, inv.__rowNum, inv);
  } catch (e) {
    throw new Error('Servidor ocupado. Por favor, intente enviar de nuevo en unos segundos.');
  } finally {
    lock.releaseLock();
  }

  rebuildAnalytics();
  auditLog_(inv.email || 'token:' + token, 'respondent', 'submit_survey', 'response', row.source_uuid, { edition: row.edicion });
  return { ok: true, responseId: row.source_uuid };
}

function validatePayloadAgainstSchema_(sections, payload) {
  var errors = [];
  sections.forEach(function(s) {
    s.questions.forEach(function(q) {
      if (q.visibleIf && !visibleByRule_(q.visibleIf, payload)) return;
      var value = payload[q.field];
      if (q.required && !normalizeText_(value)) errors.push(q.label);
    });
  });
  if (errors.length) throw new Error('Faltan campos obligatorios: ' + errors.join(', '));
}

function visibleByRule_(rule, payload) {
  rule = normalizeText_(rule);
  if (!rule) return true;
  var parts = rule.split('=');
  if (parts.length !== 2) return true;
  return normalizeText_(payload[parts[0]]) === normalizeText_(parts[1]);
}

function buildResponseRow_(payload, invitation) {
  var start = payload.__client_started_at ? new Date(payload.__client_started_at) : new Date();
  var end = new Date();
  var row = {
    obs: '',
    flag_obs: 'No',
    fecha_realizacion_raw: todayIso_(),
    fecha_encuesta_raw: todayIso_(),
    start_ts: start,
    end_ts: end,
    submission_ts: end,
    duracion_min: Math.round(((end.getTime() - start.getTime()) / 60000) * 100) / 100,
    edicion: invitation.edition_id || activeEdition_(),
    fecha_encuesta: Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    fecha_encuesta_capturada: Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    flag_fecha_capturada_corrigida: 'No',
    tipo_colaborador: normalizeText_(payload.tipo_colaborador),
    area_colaborador_indirecto_raw: normalizeText_(payload.area_colaborador_indirecto),
    area_colaborador_indirecto: canonicalArea_(payload.area_colaborador_indirecto),
    cargo_raw: normalizeText_(payload.cargo),
    cargo: properCase_(payload.cargo),
    nombre_completo_raw: normalizeText_(payload.nombre_completo),
    nombre_completo: properCase_(payload.nombre_completo),
    sexo: canonicalSexo_(payload.sexo),
    cedula_raw: normalizeText_(payload.cedula),
    cedula: cleanIdNumber_(payload.cedula),
    respondente_id: respondentHash_(payload.cedula),
    edad_raw: normalizeText_(payload.edad),
    edad: toNumberOrBlank_(payload.edad),
    flag_edad_corregida_signo: String(payload.edad).indexOf('-') === 0 ? 'Sí' : 'No',
    flag_edad_fuera_rango: 'No',
    edad_grupo: ageGroup_(payload.edad),
    departamento_procedencia_raw: normalizeText_(payload.departamento_procedencia),
    departamento_procedencia: canonicalDept_(payload.departamento_procedencia),
    pais_origen_raw: normalizeText_(payload.pais_origen),
    pais_origen: properCase_(payload.pais_origen),
    distrito_procedencia_raw: normalizeText_(payload.distrito_procedencia),
    distrito_procedencia: canonicalDistrict_(payload.distrito_procedencia),
    localidad_procedencia_raw: normalizeText_(payload.localidad_procedencia),
    localidad_procedencia: properCase_(payload.localidad_procedencia),
    departamento_residencia_raw: normalizeText_(payload.departamento_residencia),
    departamento_residencia: canonicalDept_(payload.departamento_residencia),
    distrito_residencia_raw: normalizeText_(payload.distrito_residencia),
    distrito_residencia: canonicalDistrict_(payload.distrito_residencia),
    localidad_residencia_raw: normalizeText_(payload.localidad_residencia),
    localidad_residencia: properCase_(payload.localidad_residencia),
    area_residencia: normalizeText_(payload.area_residencia),
    pertenece_comunidad_indigena: canonicalYesNo_(payload.pertenece_comunidad_indigena),
    etnia_raw: normalizeText_(payload.etnia),
    etnia: properCase_(payload.etnia),
    combustible_cocina_raw: normalizeText_(payload.combustible_cocina),
    combustible_cocina: canonicalFuel_(payload.combustible_cocina),
    combustible_cocina_otro: normalizeText_(payload.combustible_cocina_otro),
    trabajaba_antes_paracel: canonicalYesNo_(payload.trabajaba_antes_paracel),
    salario_anterior_banda_raw: normalizeText_(payload.salario_anterior_banda),
    salario_anterior_banda: canonicalSalary_(payload.salario_anterior_banda),
    salario_anterior_orden: salaryOrder_(payload.salario_anterior_banda),
    descuento_ips_anterior: canonicalYesNo_(payload.descuento_ips_anterior),
    salario_actual_banda_raw: normalizeText_(payload.salario_actual_banda),
    salario_actual_banda: canonicalSalary_(payload.salario_actual_banda),
    salario_actual_orden: salaryOrder_(payload.salario_actual_banda),
    descuento_ips_actual: canonicalYesNo_(payload.descuento_ips_actual),
    empresa_contratista_raw: normalizeText_(payload.empresa_contratista === 'Otra (especificar)' ? payload.empresa_contratista_otra : payload.empresa_contratista),
    empresa_contratista: canonicalCompany_(payload.empresa_contratista === 'Otra (especificar)' ? payload.empresa_contratista_otra : payload.empresa_contratista),
    source_id: '',
    source_uuid: uuid_(),
    source_status: 'submitted_via_app',
    source_version: 'webapp_v1',
    source_index: '',
    flag_duracion_atipica: 'No',
    flag_falta_area_indirecto: '',
    flag_falta_empresa_indirecto: '',
    flag_directo_con_campos_indirectos: '',
    flag_pais_origen_inconsistente: '',
    flag_etnia_inconsistente: '',
    flag_salario_actual_faltante: '',
    n_flags: 0,
    estado_calidad: 'OK'
  };

  row.flag_edad_fuera_rango = row.edad && (row.edad < 18 || row.edad > 80) ? 'Sí' : 'No';
  row.flag_duracion_atipica = row.duracion_min < 2 || row.duracion_min > 180 ? 'Sí' : 'No';
  row.flag_falta_area_indirecto = row.tipo_colaborador === 'Indirecto' && !row.area_colaborador_indirecto ? 'Sí' : 'No';
  row.flag_falta_empresa_indirecto = row.tipo_colaborador === 'Indirecto' && !row.empresa_contratista ? 'Sí' : 'No';
  row.flag_directo_con_campos_indirectos = row.tipo_colaborador === 'Directo' && (row.area_colaborador_indirecto || row.empresa_contratista) ? 'Sí' : 'No';
  row.flag_pais_origen_inconsistente = row.departamento_procedencia !== 'Otro país' && row.pais_origen ? 'Sí' : 'No';
  row.flag_etnia_inconsistente = row.pertenece_comunidad_indigena !== 'Sí' && row.etnia ? 'Sí' : 'No';
  row.flag_salario_actual_faltante = !row.salario_actual_banda ? 'Sí' : 'No';

  var flags = [
    row.flag_obs,row.flag_fecha_capturada_corrigida,row.flag_edad_corregida_signo,row.flag_edad_fuera_rango,
    row.flag_duracion_atipica,row.flag_falta_area_indirecto,row.flag_falta_empresa_indirecto,row.flag_directo_con_campos_indirectos,
    row.flag_pais_origen_inconsistente,row.flag_etnia_inconsistente,row.flag_salario_actual_faltante
  ];
  row.n_flags = flags.filter(function(x){ return x === 'Sí'; }).length;
  row.estado_calidad = row.n_flags === 0 ? 'OK' : (row.n_flags <= 2 ? 'Revisar' : 'Crítico');
  return row;
}

function toNumberOrBlank_(v) {
  var t = Number(normalizeText_(v));
  return isNaN(t) ? '' : t;
}

function ageGroup_(edad) {
  var n = Number(edad);
  if (isNaN(n)) return '';
  if (n <= 24) return '18-24';
  if (n <= 34) return '25-34';
  if (n <= 44) return '35-44';
  if (n <= 54) return '45-54';
  if (n <= 64) return '55-64';
  return '65+';
}

function canonicalYesNo_(v) {
  var t = upperKey_(v);
  if (t === 'SI' || t === 'SÍ') return 'Sí';
  if (t === 'NO') return 'No';
  return normalizeText_(v);
}

function canonicalSexo_(v) {
  var t = upperKey_(v);
  if (t === 'MASCULINO') return 'Masculino';
  if (t === 'FEMENINO') return 'Femenino';
  return properCase_(v);
}

function canonicalArea_(v) {
  var t = upperKey_(v);
  if (t === 'FORESTAL') return 'Forestal';
  if (t === 'INDUSTRIAL') return 'Industrial';
  return properCase_(v);
}

function canonicalFuel_(v) {
  var t = upperKey_(v);
  var map = {'GAS':'Gas','ELECTRICIDAD':'Electricidad','LENA':'Leña','LEÑA':'Leña','CARBON':'Carbón','NINGUNO (NO COCINA)':'Ninguno (no cocina)','OTRO':'Otro'};
  return map[t] || properCase_(v);
}

function canonicalSalary_(v) {
  var k = normalizeText_(v).toLowerCase();
  var map = {
    'menos del salario mínimo': 'Menos del salario mínimo',
    'menos del salario mínimo (menos de gs. 2.680.373)': 'Menos del salario mínimo',
    'salario mínimo': 'Salario mínimo',
    'salario mínimo (gs. 2.680.373)': 'Salario mínimo',
    'más del salario mínimo y hasta 3 millones': 'Más del salario mínimo y hasta 3 millones',
    'más de 3 millones y hasta 5 millones': 'Más de 3 millones y hasta 5 millones',
    'más de 5 millones y hasta 7 millones': 'Más de 5 millones y hasta 7 millones',
    'más de 7 millones y hasta 10 millones': 'Más de 7 millones y hasta 10 millones',
    'más de 10 millones y hasta 13 millones': 'Más de 10 millones y hasta 13 millones',
    'más de 13 millones y hasta 15 millones': 'Más de 13 millones y hasta 15 millones',
    'más de 15 millones y hasta 20 millones': 'Más de 15 millones y hasta 20 millones',
    'más de 20 millones y hasta 30 millones': 'Más de 20 millones y hasta 30 millones',
    'más de 30 millones': 'Más de 30 millones',
    'no informa': 'No informa',
    'no quiso dar información': 'No informa'
  };
  return map[k] || normalizeText_(v);
}

function salaryOrder_(v) {
  var m = canonicalSalary_(v);
  var map = {
    'Menos del salario mínimo':1,'Salario mínimo':2,'Más del salario mínimo y hasta 3 millones':3,
    'Más de 3 millones y hasta 5 millones':4,'Más de 5 millones y hasta 7 millones':5,
    'Más de 7 millones y hasta 10 millones':6,'Más de 10 millones y hasta 13 millones':7,
    'Más de 13 millones y hasta 15 millones':8,'Más de 15 millones y hasta 20 millones':9,
    'Más de 20 millones y hasta 30 millones':10,'Más de 30 millones':11,'No informa':99
  };
  return map[m] || '';
}

function canonicalDept_(v) {
  var t = upperKey_(v);
  var map = {
    'ALTO PARAGUAY':'Alto Paraguay','ALTO PARANA':'Alto Paraná','AMAMBAY':'Amambay','ASUNCION':'Asunción',
    'BOQUERON':'Boquerón','CAAGUAZU':'Caaguazú','CAAZAPA':'Caazapá','CANINDEYU':'Canindeyú',
    'CENTRAL':'Central','CONCEPCION':'Concepción','CORDILLERA':'Cordillera','GUAIRA':'Guairá',
    'ITAPUA':'Itapúa','MISIONES':'Misiones','OTRO PAIS':'Otro país','PARAGUARI':'Paraguarí',
    'PDTE. HAYES':'Presidente Hayes','PDTE.HAYES':'Presidente Hayes','PRESIDENTE HAYES':'Presidente Hayes',
    'SAN PEDRO':'San Pedro','NEEMBUCU':'Ñeembucú'
  };
  return map[t] || properCase_(v);
}

function canonicalDistrict_(v) {
  var t = upperKey_(v);
  var map = {
    'ASOTEY':'Azotey','AZOTEY':'Azotey','YVY YAU':'Yby Yaú',"YVY YA'U":'Yby Yaú','YVY YA U':'Yby Yaú','YBY YAU':'Yby Yaú','YVY JAU':'Yby Yaú',
    'SGTO JOSE FELIX LOPEZ':'Sargento José Félix López','SGTO. JOSE FELIX LOPEZ':'Sargento José Félix López',
    'JOSE FELIX LOPEZ':'Sargento José Félix López','SARGENTO JOSE FELIX LOPEZ':'Sargento José Félix López',
    'SANTANI':'San Estanislao','SAN ESTANISLAO':'San Estanislao','SAN PEDRO DEL YKUAMANDIYU':'San Pedro del Ycuamandiyú',
    'SAN PEDRO DEL YKUAMA':'San Pedro del Ycuamandiyú','PUENTESINO':'Puentesiño','BELEN':'Belén',
    'CONCEPCION':'Concepción','ASUNCION':'Asunción','ITAUGUA':'Itauguá','LAMBARE':'Lambaré','NEMBY':'Ñemby'
  };
  return map[t] || properCase_(v);
}

function canonicalCompany_(v) {
  var t = upperKey_(v).replace(/[^A-Z0-9/& ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.indexOf('TECNOFORESTAL') > -1) return 'TECNOFORESTAL';
  if (t === 'OAC MAQUINARIA' || t === 'OAC MAQUINARIAS') return 'OAC MAQUINARIAS';
  if (t.indexOf('LUSITANA') > -1) return 'LUSITANA';
  if (t.indexOf('MARIA EUGENIA') > -1 && t.indexOf('AGRO') > -1) return 'AGROGANADERA MARIA EUGENIA';
  if (['RANCHO FORESTAL','RANCHO FORESTA','RANCHO FORERSTAL','RANCHO FOTESTAL'].indexOf(t) > -1) return 'RANCHO FORESTAL';
  if (t === 'PLAN SUR' || t === 'PLANSUR') return 'PLANSUR';
  if (t.indexOf('PROSEGUR') > -1) return 'PROSEGUR';
  if (['CONSTRUCTORA JM','JM CONSTRUCTORA','JM CONSTRUCCIONES','CONSTRUCTORA JM INGENIERIA','CONSTRUCTORA JM/ELECTROMECANICA SAN RAFAEL','CONSTRUCTORA JM KUROSU & CIA S A'].indexOf(t) > -1) return 'CONSTRUCTORA JM';
  if (t.indexOf('BUREAU VERITAS') > -1) return 'BUREAU VERITAS';
  return t;
}
