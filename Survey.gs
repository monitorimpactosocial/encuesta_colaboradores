
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
    if (String(inv.estado) !== 'Usado' && String(inv.estado) !== 'Anulado') inv.estado = 'Abierto';
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
    inv = getInvitationByToken_(token);
    if (!inv) throw new Error('Token invalido.');
    if (String(inv.estado) === 'Usado') throw new Error('La encuesta ya fue respondida con este enlace.');
    if (String(inv.estado) === 'Anulado') throw new Error('El enlace fue anulado.');
    appendObjectRow_(APP_CFG.SHEETS.RESPONSES, row);

    inv.estado = 'Usado';
    inv.used_at = nowIso_();
    if (!normalizeText_(inv.opened_at)) inv.opened_at = nowIso_();
    updateRowByNumber_(APP_CFG.SHEETS.INVITATIONS, inv.__rowNum, inv);
  } catch (e) {
    if (e && e.message && (e.message.indexOf('ya fue respondida') > -1 || e.message.indexOf('anulado') > -1 || e.message.indexOf('Token invalido') > -1)) throw e;
    throw new Error('Servidor ocupado. Por favor, intente enviar de nuevo en unos segundos.');
  } finally {
    lock.releaseLock();
  }

  var analyticsUpdated = true;
  try {
    appendResponsesToAnalytics_([row]);
  } catch (analyticsErr) {
    analyticsUpdated = false;
    auditLog_('system', 'system', 'analytics_append_error', 'response', row.source_uuid, {
      edition: row.edicion,
      message: analyticsErr.message || String(analyticsErr)
    });
  }
  auditLog_(inv.email || 'token:' + token, 'respondent', 'submit_survey', 'response', row.source_uuid, {
    edition: row.edicion,
    analyticsUpdated: analyticsUpdated
  });
  return { ok: true, responseId: row.source_uuid, analyticsUpdated: analyticsUpdated };
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
    estado_civil: canonicalMarital_(payload.estado_civil),
    nivel_educativo: canonicalEducation_(payload.nivel_educativo),
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
    tipo_vivienda: canonicalHousing_(payload.tipo_vivienda),
    n_hijos: toNumberOrBlank_(payload.n_hijos),
    personas_hogar: toNumberOrBlank_(payload.personas_hogar),
    pertenece_comunidad_indigena: canonicalYesNo_(payload.pertenece_comunidad_indigena),
    etnia_raw: normalizeText_(payload.etnia),
    etnia: properCase_(payload.etnia),
    combustible_cocina_raw: normalizeText_(payload.combustible_cocina),
    combustible_cocina: canonicalFuel_(payload.combustible_cocina),
    combustible_cocina_otro: normalizeText_(payload.combustible_cocina_otro),
    medio_transporte: canonicalTransport_(payload.medio_transporte),
    trabajaba_antes_paracel: canonicalYesNo_(payload.trabajaba_antes_paracel),
    antiguedad_empresa_banda: canonicalTenure_(payload.antiguedad_empresa_banda),
    turno_trabajo: canonicalShift_(payload.turno_trabajo),
    salario_anterior_banda_raw: normalizeText_(payload.salario_anterior_banda),
    salario_anterior_banda: canonicalSalary_(payload.salario_anterior_banda),
    salario_anterior_orden: salaryOrder_(payload.salario_anterior_banda),
    descuento_ips_anterior: canonicalYesNo_(payload.descuento_ips_anterior),
    salario_actual_banda_raw: normalizeText_(payload.salario_actual_banda),
    salario_actual_banda: canonicalSalary_(payload.salario_actual_banda),
    salario_actual_orden: salaryOrder_(payload.salario_actual_banda),
    descuento_ips_actual: canonicalYesNo_(payload.descuento_ips_actual),
    empresa_contratista_raw: normalizeText_(payload.empresa_contratista),
    empresa_contratista: canonicalCompany_(payload.empresa_contratista),
    source_id: '',
    source_uuid: uuid_(),
    source_status: 'submitted_via_app',
    source_version: 'webapp_v2',
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
  if (t.indexOf('LOGIST') > -1 || t.indexOf('TRANSPORT') > -1 || t.indexOf('CHOFER') > -1 || t.indexOf('TRACTOR') > -1 || t.indexOf('MAQUIN') > -1) return 'LogÃ­stica y transporte';
  if (t.indexOf('SEGUR') > -1 || t.indexOf('VIGIL') > -1 || t.indexOf('PATRULL') > -1) return 'Seguridad';
  if (t.indexOf('SERVICIO') > -1 || t.indexOf('LIMPIE') > -1 || t.indexOf('MANTEN') > -1) return 'Servicios generales';
  if (t.indexOf('COCIN') > -1 || t.indexOf('ALIMENT') > -1) return 'AlimentaciÃ³n y cocina';
  if (t.indexOf('CONSTRU') > -1 || t.indexOf('OBRA') > -1 || t.indexOf('MONTA') > -1 || t.indexOf('ALBAN') > -1) return 'ConstrucciÃ³n y obras';
  if (t.indexOf('ADMIN') > -1 || t.indexOf('PROFES') > -1 || t.indexOf('AMBIENT') > -1 || t.indexOf('MEDIC') > -1 || t.indexOf('TECNIC') > -1) return 'Administrativo / profesional';
  if (t === 'OTRO') return 'Otro';
  return properCase_(v);
}

function canonicalFuel_(v) {
  var t = upperKey_(v);
  var map = {'GAS':'Gas','ELECTRICIDAD':'Electricidad','LENA':'Leña','LEÑA':'Leña','CARBON':'Carbón','NINGUNO (NO COCINA)':'Ninguno (no cocina)','OTRO':'Otro'};
  return map[t] || properCase_(v);
}

function canonicalMarital_(v) {
  var t = upperKey_(v);
  var map = {
    'SOLTERO':'Soltero/a',
    'SOLTERA':'Soltero/a',
    'CASADO':'Casado/a',
    'CASADA':'Casado/a',
    'UNION LIBRE':'UniÃ³n libre',
    'UNION DE HECHO':'UniÃ³n libre',
    'CONCUBINATO':'UniÃ³n libre',
    'SEPARADO':'Separado/a',
    'SEPARADA':'Separado/a',
    'DIVORCIADO':'Divorciado/a',
    'DIVORCIADA':'Divorciado/a',
    'VIUDO':'Viudo/a',
    'VIUDA':'Viudo/a',
    'PREFIERO NO RESPONDER':'Prefiero no responder'
  };
  return map[t] || properCase_(v);
}

function canonicalEducation_(v) {
  var t = upperKey_(v);
  var map = {
    'SIN ESCOLARIDAD':'Sin escolaridad',
    'PRIMARIA INCOMPLETA':'Primaria incompleta',
    'PRIMARIA COMPLETA':'Primaria completa',
    'SECUNDARIA INCOMPLETA':'Secundaria incompleta',
    'SECUNDARIA COMPLETA':'Secundaria completa',
    'TECNICO':'TÃ©cnico',
    'TECNICO SUPERIOR':'TÃ©cnico',
    'UNIVERSITARIO INCOMPLETO':'Universitario incompleto',
    'UNIVERSITARIA INCOMPLETA':'Universitario incompleto',
    'UNIVERSITARIO COMPLETO':'Universitario completo',
    'UNIVERSITARIA COMPLETA':'Universitario completo',
    'POSGRADO':'Posgrado'
  };
  return map[t] || properCase_(v);
}

function canonicalHousing_(v) {
  var t = upperKey_(v);
  var map = {
    'PROPIA':'Propia',
    'ALQUILADA':'Alquilada',
    'CEDIDA':'Cedida',
    'FAMILIAR':'Familiar',
    'OTRA':'Otra'
  };
  return map[t] || properCase_(v);
}

function canonicalTransport_(v) {
  var t = upperKey_(v);
  var map = {
    'A PIE':'A pie',
    'BICICLETA':'Bicicleta',
    'MOTO':'Moto',
    'AUTO':'Auto',
    'BUS':'Bus',
    'TRANSPORTE DE LA EMPRESA':'Transporte de la empresa',
    'TRANSPORTE PROVISTO POR LA EMPRESA':'Transporte de la empresa',
    'OTRO':'Otro'
  };
  return map[t] || properCase_(v);
}

function canonicalTenure_(v) {
  var t = upperKey_(v);
  var map = {
    'MENOS DE 6 MESES':'Menos de 6 meses',
    'DE 6 A 12 MESES':'De 6 a 12 meses',
    '1 A 2 ANOS':'1 a 2 aÃ±os',
    '1 A 2 AÃ‘OS':'1 a 2 aÃ±os',
    '3 A 5 ANOS':'3 a 5 aÃ±os',
    '3 A 5 AÃ‘OS':'3 a 5 aÃ±os',
    '6 A 10 ANOS':'6 a 10 aÃ±os',
    '6 A 10 AÃ‘OS':'6 a 10 aÃ±os',
    'MAS DE 10 ANOS':'MÃ¡s de 10 aÃ±os',
    'MAS DE 10 AÃ‘OS':'MÃ¡s de 10 aÃ±os',
    'MÃS DE 10 AÃ‘OS':'MÃ¡s de 10 aÃ±os'
  };
  return map[t] || normalizeText_(v);
}

function canonicalShift_(v) {
  var t = upperKey_(v);
  var map = {
    'ADMINISTRATIVO':'Administrativo',
    'DIURNO':'Diurno',
    'NOCTURNO':'Nocturno',
    'ROTATIVO':'Rotativo',
    'POR JORNADA / CAMPO':'Por jornada / campo'
  };
  return map[t] || properCase_(v);
}

function canonicalSalary_(v) {
  var k = normalizeText_(v).toLowerCase();
  var map = {
    'menos del salario mínimo': 'Menos del salario mínimo',
    '< sal. mínimo': 'Menos del salario mínimo',
    'sal. mínimo': 'Salario mínimo',
    'salario mínimo': 'Salario mínimo',
    'sal. mín. - 3m': 'Más del salario mínimo y hasta 3 millones',
    '3m - 5m': 'Más de 3 millones y hasta 5 millones',
    '5m - 7m': 'Más de 5 millones y hasta 7 millones',
    '7m - 10m': 'Más de 7 millones y hasta 10 millones',
    '10m - 13m': 'Más de 10 millones y hasta 13 millones',
    '13m - 15m': 'Más de 13 millones y hasta 15 millones',
    '15m - 20m': 'Más de 15 millones y hasta 20 millones',
    '20m - 30m': 'Más de 20 millones y hasta 30 millones',
    '> 30m': 'Más de 30 millones',
    'menos del salario mínimo (menos de gs. 2.680.373)': 'Menos del salario mínimo',
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
  return map[k] || properCase_(v);
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
  if (t.indexOf('GNF') > -1) return 'GNF';
  if (t.indexOf('FDE') > -1) return 'FDE';
  if (t.indexOf('INDEPENDIENTE') > -1) return 'INDEPENDIENTE';
  if (t.indexOf('RED FORESTAL') > -1) return 'RED FORESTAL';
  if (t.indexOf('TOCSA') > -1) return 'TOCSA';
  if (t.indexOf('ECOMIPA') > -1) return 'ECOMIPA';
  if (t.indexOf('FORMIGHIERI') > -1) return 'FORMIGHIERI';
  if (t.indexOf('CECON') > -1) return 'CECON';
  if (t.indexOf('DAF') > -1) return 'DAF';
  if (t.indexOf('HELITACTICA') > -1) return 'HELITACTICA';
  if (t.indexOf('FORESTADORA DEL ESTE') > -1) return 'FORESTADORA DEL ESTE';
  if (t.indexOf('LO DE GANSO') > -1) return 'LO DE GANSO';
  if (t.indexOf('SUDAMERIS') > -1) return 'SUDAMERIS BANK';
  if (t.indexOf('RANCHALES') > -1) return 'RANCHALES';
  if (t.indexOf('POR EL CHACO') > -1) return 'POR EL CHACO';
  if (t.indexOf('EFISA') > -1) return 'EFISA';
  if (t.indexOf('INFOMASTER') > -1) return 'INFOMASTER';
  if (t.indexOf('TECNOEDIL') > -1) return 'TECNOEDIL S A';
  if (t.indexOf('AGRAFOREST') > -1) return 'AGRAFOREST';
  if (t.indexOf('COPETROL') > -1) return 'COPETROL';
  if (t.indexOf('SACEEM') > -1) return 'SACEEM';
  if (t.indexOf('SJ GREEN') > -1) return 'SJ GREEN';
  if (t.indexOf('GANADERA VISTA ALEGRE') > -1) return 'GANADERA VISTA ALEGRE';
  if (t.indexOf('FRIGOR') > -1 && t.indexOf('FICO') > -1) return 'FRIGORIFICO CONCEPCION';
  return properCase_(t);
}
