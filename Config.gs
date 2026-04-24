
var APP_CFG = {
  APP_NAME: 'Encuesta de colaboradores',
  ORG_NAME: 'Paracel S.A.',
  SHEETS: {
    CONFIG: 'CONFIG',
    USERS: 'USUARIOS',
    EDITIONS: 'EDICIONES',
    QUESTIONNAIRE: 'CUESTIONARIO',
    CATALOGS: 'CATALOGOS',
    RESPONSES: 'RESPUESTAS',
    ANALYTIC: 'BASE_ANALITICA',
    LONG: 'RESPUESTAS_LONG',
    INVITATIONS: 'INVITACIONES',
    AUDIT: 'AUDITORIA'
  },
  SESSION_HOURS: 12,
  TOKEN_HOURS: 24 * 30,
  PII_FIELDS: ['nombre_completo', 'nombre_completo_raw', 'cedula', 'cedula_raw'],
  LONG_FIELDS: [
    'tipo_colaborador','area_colaborador_indirecto','area_paracel','cargo','grupo_cargo','es_cargo_directivo','sexo','edad','edad_grupo',
    'estado_civil','nivel_educativo',
    'departamento_procedencia','pais_origen','distrito_procedencia','localidad_procedencia',
    'departamento_residencia','distrito_residencia','localidad_residencia','area_residencia',
    'pertenece_comunidad_indigena','etnia','tipo_vivienda','n_hijos','personas_hogar',
    'combustible_cocina','medio_transporte','trabajaba_antes_paracel','antiguedad_empresa_banda','turno_trabajo',
    'salario_anterior_banda','descuento_ips_anterior','salario_actual_banda','descuento_ips_actual',
    'empresa_contratista'
  ]
};

var BACKEND_SS_CACHE_ = null;
var BACKEND_SS_ID_CACHE_ = '';

function getBackendSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('BACKEND_SPREADSHEET_ID');
  if (!id) throw new Error('BACKEND_SPREADSHEET_ID no configurado. Ejecute setupBackend(spreadsheetId).');
  if (BACKEND_SS_CACHE_ && BACKEND_SS_ID_CACHE_ === id) return BACKEND_SS_CACHE_;
  BACKEND_SS_ID_CACHE_ = id;
  BACKEND_SS_CACHE_ = SpreadsheetApp.openById(id);
  return BACKEND_SS_CACHE_;
}

function getBaseUrl_() {
  return ScriptApp.getService().getUrl() || '';
}
