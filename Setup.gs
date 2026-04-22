
/** Ejecutar desde el editor GAS para inicializar el backend con el Spreadsheet de Paracel */
function runSetup() {
  setupBackend('1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c');
  seedAll();
  Logger.log('✅ runSetup() completado. Ahora despliegue como Web App.');
}

function fixEverything() {
  syncHeaders_(APP_CFG.SHEETS.CONFIG, ['clave','valor','descripcion']);
  syncHeaders_(APP_CFG.SHEETS.EDITIONS, ['edition_id','edition_name','status','start_date','end_date','notes']);
  syncHeaders_(APP_CFG.SHEETS.USERS, ['username','display_name','role','password_hash','password_temporal','active','must_change_password','notes']);
  syncHeaders_(APP_CFG.SHEETS.QUESTIONNAIRE, ['section_order','section_id','section_label','question_order','field_name','label','input_type','required','options_json','visible_if','contains_pii','include_in_analytics']);
  syncHeaders_(APP_CFG.SHEETS.CATALOGS, ['catalogo','codigo','etiqueta']);
  syncHeaders_(APP_CFG.SHEETS.RESPONSES, ['es_cargo_directivo']);
  syncHeaders_(APP_CFG.SHEETS.LONG, ['edicion','fecha_encuesta','respondente_id','source_uuid','campo','valor']);
  syncHeaders_(APP_CFG.SHEETS.INVITATIONS, ['token','edition_id','email','nombre_destinatario','tipo_acceso','estado','url_encuesta','sent_at','opened_at','used_at','notes']);
  syncHeaders_(APP_CFG.SHEETS.AUDIT, ['event_ts','actor','role','action','entity','entity_id','payload_json']);
  
  // Create BASE_ANALITICA safely
  var ss = getBackendSpreadsheet_();
  var shA = ss.getSheetByName(APP_CFG.SHEETS.ANALYTIC) || ss.insertSheet(APP_CFG.SHEETS.ANALYTIC);
  
  seedQuestionnaire();
  seedCatalogs();
  rebuildAnalytics();
  Logger.log('✅ fixEverything() completado: Cuestionario, Catálogos y Base Analítica restaurados.');
}

function setupBackend(spreadsheetId) {
  if (!spreadsheetId) throw new Error('Debe proporcionar spreadsheetId.');
  PropertiesService.getScriptProperties().setProperty('BACKEND_SPREADSHEET_ID', spreadsheetId);

  syncHeaders_(APP_CFG.SHEETS.CONFIG, ['clave','valor','descripcion']);
  syncHeaders_(APP_CFG.SHEETS.EDITIONS, ['edition_id','edition_name','status','start_date','end_date','notes']);
  syncHeaders_(APP_CFG.SHEETS.USERS, ['username','display_name','role','password_hash','password_temporal','active','must_change_password','notes']);
  syncHeaders_(APP_CFG.SHEETS.QUESTIONNAIRE, ['section_order','section_id','section_label','question_order','field_name','label','input_type','required','options_json','visible_if','contains_pii','include_in_analytics']);
  syncHeaders_(APP_CFG.SHEETS.CATALOGS, ['catalogo','codigo','etiqueta']);
  syncHeaders_(APP_CFG.SHEETS.RESPONSES, [
    'obs','flag_obs','fecha_realizacion_raw','fecha_encuesta_raw','start_ts','end_ts','submission_ts','duracion_min','edicion',
    'fecha_encuesta','fecha_encuesta_capturada','flag_fecha_capturada_corrigida','tipo_colaborador','area_colaborador_indirecto_raw',
    'area_colaborador_indirecto','cargo_raw','cargo','es_cargo_directivo','nombre_completo_raw','nombre_completo','sexo','cedula_raw','cedula',
    'respondente_id','edad_raw','edad','flag_edad_corregida_signo','flag_edad_fuera_rango','edad_grupo',
    'estado_civil','nivel_educativo',
    'departamento_procedencia_raw','departamento_procedencia','pais_origen_raw','pais_origen','distrito_procedencia_raw',
    'distrito_procedencia','localidad_procedencia_raw','localidad_procedencia','departamento_residencia_raw',
    'departamento_residencia','distrito_residencia_raw','distrito_residencia','localidad_residencia_raw',
    'localidad_residencia','area_residencia','tipo_vivienda','n_hijos','personas_hogar',
    'pertenece_comunidad_indigena','etnia_raw','etnia','combustible_cocina_raw',
    'combustible_cocina','combustible_cocina_otro','medio_transporte','trabajaba_antes_paracel','antiguedad_empresa_banda','turno_trabajo','salario_anterior_banda_raw','salario_anterior_banda',
    'salario_anterior_orden','descuento_ips_anterior','salario_actual_banda_raw','salario_actual_banda','salario_actual_orden',
    'descuento_ips_actual','empresa_contratista_raw','empresa_contratista','source_id','source_uuid','source_status',
    'source_version','source_index','flag_duracion_atipica','flag_falta_area_indirecto','flag_falta_empresa_indirecto',
    'flag_directo_con_campos_indirectos','flag_pais_origen_inconsistente','flag_etnia_inconsistente','flag_salario_actual_faltante',
    'n_flags','estado_calidad'
  ]);
  ensureHeaders_(APP_CFG.SHEETS.ANALYTIC, []);
  syncHeaders_(APP_CFG.SHEETS.LONG, ['edicion','fecha_encuesta','respondente_id','source_uuid','campo','valor']);
  syncHeaders_(APP_CFG.SHEETS.INVITATIONS, ['token','edition_id','email','nombre_destinatario','tipo_acceso','estado','url_encuesta','sent_at','opened_at','used_at','notes']);
  syncHeaders_(APP_CFG.SHEETS.AUDIT, ['event_ts','actor','role','action','entity','entity_id','payload_json']);

  hashSeedUsers_();
  rebuildAnalytics();
  return { ok: true, spreadsheetId: spreadsheetId };
}

function hashSeedUsers_() {
  var users = getRowsAsObjects_(APP_CFG.SHEETS.USERS);
  users.forEach(function(u) {
    var hasHash = normalizeText_(u.password_hash);
    var tmp = normalizeText_(u.password_temporal);
    if (!hasHash && tmp) {
      var row = Object.assign({}, u);
      row.password_hash = sha256Hex_(normalizeText_(u.username) + '|' + tmp);
      row.password_temporal = '';
      updateRowByNumber_(APP_CFG.SHEETS.USERS, u.__rowNum, row);
    }
  });
}

function importConsolidatedCSV() {
  var files = DriveApp.getFilesByName('ENCUESTA_CONSOLIDADA_2024_2025.csv');
  if (!files.hasNext()) throw new Error('No se encontró el archivo ENCUESTA_CONSOLIDADA_2024_2025.csv en Google Drive. Asegúrese de que esté subido.');
  var file = files.next();
  var csvData = Utilities.parseCsv(file.getBlob().getDataAsString());
  
  var ss = getBackendSpreadsheet_();
  var sh = ss.getSheetByName(APP_CFG.SHEETS.RESPONSES);
  
  // Limpiar datos existentes (preserva cabecera)
  if (sh.getLastRow() > 1) {
    sh.deleteRows(2, sh.getLastRow() - 1);
  }
  
  var sheetHeaders = getHeader_(sh);
  var csvHeaders = (csvData[0] || []).map(function(h) { return normalizeText_(h); });
  var csvIndex = {};
  csvHeaders.forEach(function(h, i) { csvIndex[h] = i; });

  // Insertar datos alineando columnas por nombre para soportar nuevas columnas en RESPUESTAS
  var dataToInsert = csvData.slice(1).map(function(row) {
    return sheetHeaders.map(function(h) {
      var idx = csvIndex[h];
      return idx === undefined ? '' : row[idx];
    });
  });
  if (dataToInsert.length > 0) {
    sh.getRange(2, 1, dataToInsert.length, dataToInsert[0].length).setValues(dataToInsert);
  }
  
  Logger.log('✅ Importación exitosa: ' + dataToInsert.length + ' filas.');
  rebuildAnalytics();
  Logger.log('✅ Analítica recalculada.');
}
