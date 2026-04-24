
/**
 * SeedCuestionario.gs
 * Ejecutar DESPUÉS de setupBackend(spreadsheetId).
 *
 * Función principal:
 *   seedAll()   — pobla CONFIG, EDICIONES, USUARIOS, CUESTIONARIO y CATALOGOS de una sola vez.
 *
 * También disponibles de forma individual:
 *   seedConfig(), seedEditions(), seedUsers(), seedQuestionnaire(), seedCatalogs()
 */

/* ─────────────────────────────────────────────────────────
   seedAll — punto de entrada único
───────────────────────────────────────────────────────── */
function seedAll() {
  seedConfig();
  seedEditions();
  seedUsers();
  seedQuestionnaire();
  seedCatalogs();
  hashSeedUsers_();   // hashea las contraseñas temporales recién insertadas
  Logger.log('✅ seedAll() completado. Revise las hojas del Spreadsheet.');
}

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
function seedConfig() {
  var entries = [
    { clave: 'active_edition',        valor: '2026',                        descripcion: 'ID de la edición activa (controla qué año recibe respuestas)' },
    { clave: 'app_name',              valor: 'Encuesta de colaboradores',   descripcion: 'Nombre de la aplicación mostrado en la interfaz' },
    { clave: 'org_name',              valor: 'Paracel S.A.',                descripcion: 'Nombre de la organización' },
    { clave: 'sender_name',           valor: 'Monitor de Impacto Social',   descripcion: 'Nombre del remitente al enviar invitaciones por correo' },
    { clave: 'max_invites_per_batch', valor: '50',                          descripcion: 'Máximo de correos por ejecución (límite MailApp ~100/día)' },
    { clave: 'survey_instructions',   valor: 'Complete el formulario con sus datos. La información es confidencial y de uso estadístico interno.', descripcion: 'Texto de instrucciones mostrado al inicio de la encuesta' }
  ];

  var ss  = getBackendSpreadsheet_();
  var sh  = ss.getSheetByName(APP_CFG.SHEETS.CONFIG);
  var existing = getRowsAsObjects_(APP_CFG.SHEETS.CONFIG);
  var existingKeys = existing.map(function(r) { return normalizeText_(r.clave); });

  entries.forEach(function(e) {
    if (existingKeys.indexOf(normalizeText_(e.clave)) === -1) {
      sh.appendRow([e.clave, e.valor, e.descripcion]);
    }
  });
  Logger.log('✅ CONFIG: filas verificadas/insertadas.');
}

/* ─────────────────────────────────────────────────────────
   EDICIONES
───────────────────────────────────────────────────────── */
function seedEditions() {
  var editions = [
    { edition_id: '2024', edition_name: 'Edición 2024', status: 'Cerrada', start_date: '2024-01-01', end_date: '2024-12-31', notes: 'Datos históricos 2024' },
    { edition_id: '2025', edition_name: 'Edición 2025', status: 'Cerrada', start_date: '2025-01-01', end_date: '2025-12-31', notes: '987 respuestas importadas desde CSV' },
    { edition_id: '2026', edition_name: 'Edición 2026', status: 'Abierta', start_date: '2026-01-01', end_date: '2026-12-31', notes: 'Captura activa 2026' }
  ];

  var sh       = getBackendSpreadsheet_().getSheetByName(APP_CFG.SHEETS.EDITIONS);
  var existing = getRowsAsObjects_(APP_CFG.SHEETS.EDITIONS);
  var existingIds = existing.map(function(r) { return normalizeText_(r.edition_id); });

  editions.forEach(function(e) {
    if (existingIds.indexOf(normalizeText_(e.edition_id)) === -1) {
      sh.appendRow([e.edition_id, e.edition_name, e.status, e.start_date, e.end_date, e.notes]);
    }
  });
  Logger.log('✅ EDICIONES: filas verificadas/insertadas.');
}

/* ─────────────────────────────────────────────────────────
   USUARIOS  (contraseñas en campo temporal; hashSeedUsers_() las procesa)
───────────────────────────────────────────────────────── */
function seedUsers() {
  // username | display_name | role | password_hash | password_temporal | active | must_change_password | notes
  var users = [
    { username: 'diego', display_name: 'Diego (Administrador)', role: 'admin',  password_temporal: '456', active: 'TRUE', must_change_password: 'FALSE', notes: 'Cuenta administrador inicial' },
    { username: 'user',  display_name: 'Visualizador',          role: 'viewer', password_temporal: '123', active: 'TRUE', must_change_password: 'FALSE', notes: 'Cuenta visualizadora de sólo lectura' }
  ];

  var sh       = getBackendSpreadsheet_().getSheetByName(APP_CFG.SHEETS.USERS);
  var existing = getRowsAsObjects_(APP_CFG.SHEETS.USERS);
  var existingUsernames = existing.map(function(r) { return normalizeText_(r.username); });

  users.forEach(function(u) {
    if (existingUsernames.indexOf(normalizeText_(u.username)) === -1) {
      sh.appendRow([u.username, u.display_name, u.role, '', u.password_temporal, u.active, u.must_change_password, u.notes]);
    }
  });
  Logger.log('✅ USUARIOS: filas verificadas/insertadas. Ejecute hashSeedUsers_() si aún no se ejecutó (seedAll() ya lo hace).');
}

/* ─────────────────────────────────────────────────────────
   CUESTIONARIO  (reemplaza contenido existente)
───────────────────────────────────────────────────────── */
function seedQuestionnaire() {
  var depts = [
    'Alto Paraguay','Alto Paraná','Amambay','Asunción','Boquerón','Caaguazú','Caazapá',
    'Canindeyú','Central','Concepción','Cordillera','Guairá','Itapúa','Misiones',
    'Paraguarí','Presidente Hayes','San Pedro','Ñeembucú','Otro país'
  ];
  var salaries = [
    'Menos del salario mínimo','Salario mínimo',
    'Más del salario mínimo y hasta 3 millones','Más de 3 millones y hasta 5 millones',
    'Más de 5 millones y hasta 7 millones','Más de 7 millones y hasta 10 millones',
    'Más de 10 millones y hasta 13 millones','Más de 13 millones y hasta 15 millones',
    'Más de 15 millones y hasta 20 millones','Más de 20 millones y hasta 30 millones',
    'Más de 30 millones','No informa'
  ];
  var yn    = ['Sí','No'];
  var fuels = ['Gas','Electricidad','Leña','Carbón','Ninguno (no cocina)','Otro'];

  var districts = [
    'Concepción','Horqueta','Paso Barreto','Sargento José Félix López','Arroyito','Puentesiño','Loreto','Azotey',
    'Paso Horqueta','Belén','Bella Vista Norte','Yby Yaú','Asunción','San Lorenzo','Luque','Fernando de la Mora',
    'San Pedro','Santa Rosa del Aguaray','Pedro Juan Caballero','Ciudad del Este','Lambaré','Ñemby','Villa Elisa',
    'Capiatá','Itauguá','Caaguazú','Caazapá','Curuguaty','Natalio','San Estanislao','Coronel Oviedo',
    'Benjamín Aceval','Hernandarias','Bella Vista','Limpio','Nueva Germania','Hugua Ñandu','San Alfredo',
    'Vallemí','Encarnación'
  ];
  var indirectAreas = [
    'Forestal','Industrial','Logística y transporte','Seguridad','Servicios generales',
    'Alimentación y cocina','Construcción y obras','Administrativo / profesional','Otro'
  ];
  var companies = [
    'TECNOFORESTAL','OAC MAQUINARIAS','LUSITANA','AGROGANADERA MARIA EUGENIA','PROSEGUR','RANCHO FORESTAL',
    'CONSTRUCTORA JM','PLANSUR','GNF','FDE','BUREAU VERITAS','RED FORESTAL','TOCSA','ECOMIPA','FORMIGHIERI',
    'CECON','DAF','HELITACTICA','FORESTADORA DEL ESTE','LO DE GANSO','SUDAMERIS BANK','RANCHALES','POR EL CHACO',
    'EFISA','INFOMASTER','TECNOEDIL S A','AGRAFOREST','COPETROL','SACEEM','SJ GREEN','GANADERA VISTA ALEGRE',
    'FRIGORIFICO CONCEPCION','INDEPENDIENTE'
  ];
  var cargos = [
    'Ayudante de campo','Operador de maquinaria','Vigilante','Personal de campo','Operador','Chofer','Plantador',
    'Servicios generales','Auxiliar de campo','Operador de tractor','Cocinera','Ayudante de cocina',
    'Auxiliar administrativo','Asistente administrativo','Asistente forestal','Limpieza','Peón de campo','Mecánico',
    'Montador','Enfermero','Tractorista','Mantenimiento','Chofer de colectivo','Encargado de campo',
    'Patrullero','Oficial albañil','Electricista','Técnico de seguridad','Operador de pala cargadora',
    'Analista ambiental'
  ];
  var civilStatus = ['Soltero/a','Casado/a','Unión libre','Separado/a','Divorciado/a','Viudo/a','Prefiero no responder'];
  var education = [
    'Sin escolaridad','Primaria incompleta','Primaria completa','Secundaria incompleta','Secundaria completa',
    'Técnico','Universitario incompleto','Universitario completo','Posgrado'
  ];
  var housing = ['Propia','Alquilada','Cedida','Familiar','Otra'];
  var transport = ['A pie','Bicicleta','Moto','Auto','Bus','Transporte de la empresa','Otro'];
  var tenure = ['Menos de 6 meses','De 6 a 12 meses','1 a 2 años','3 a 5 años','6 a 10 años','Más de 10 años'];
  var shifts = ['Administrativo','Diurno','Nocturno','Rotativo','Por jornada / campo'];
  var ethnicGroups = ['Ava Guaraní','Mbya Guaraní','Nivaclé','Enxet','Sanapá','Ayoreo','Maká','Qom / Toba','Angaité','Otro'];

  // Columns: section_order | section_id | section_label | question_order | field_name | label |
  //          input_type | required | options_json | visible_if | contains_pii | include_in_analytics
  var rows = [
    // ── Sección 1: Identificación laboral ───────────────────────────────
    [1,'S1','Identificación laboral', 10,'tipo_colaborador',
      '¿Cómo está vinculado con Paracel? (Directo = empleado Paracel · Indirecto = empresa contratista)',
      'select', true, JSON.stringify(['Directo','Indirecto']),
      '', false, true],

    [1,'S1','Identificación laboral', 20,'area_colaborador_indirecto',
      'Área del contratista / empresa',
      'select_or_text', false, JSON.stringify(indirectAreas),
      'tipo_colaborador=Indirecto', false, true],

    [1,'S1','Identificación laboral', 30,'empresa_contratista',
      'Nombre de la empresa contratista principal',
      'select_or_text', true, JSON.stringify(companies),
      'tipo_colaborador=Indirecto', false, true],

    [1,'S1','Identificación laboral', 35,'empresa_contratista_otra',
      'Especifique el nombre de la empresa contratista',
      'text', true, '[]',
      'empresa_contratista=Otra (especificar)', false, true],

    [1,'S1','Identificación laboral', 40,'cargo',
      'Cargo o puesto',
      'select_or_text', true, JSON.stringify(cargos),
      '', false, true],

    [1,'S1','Identificación laboral', 45,'area_paracel',
      'Área de trabajo en Paracel',
      'select', true, JSON.stringify(indirectAreas),
      'tipo_colaborador=Directo', false, true],

    // ── Sección 2: Datos personales ─────────────────────────────────────
    [1,'S1','Identificación laboral', 50,'antiguedad_empresa_banda',
      'Tiempo trabajando en Paracel o con su contratista actual',
      'select', true, JSON.stringify(tenure),
      '', false, true],

    [1,'S1','Identificación laboral', 60,'turno_trabajo',
      'Turno o modalidad de trabajo',
      'select', true, JSON.stringify(shifts),
      '', false, true],

    [2,'S2','Datos personales', 10,'nombre_completo',
      'Nombre y apellido completo',
      'text', true, '[]',
      '', true, false],

    [2,'S2','Datos personales', 20,'sexo',
      'Sexo',
      'select', true, JSON.stringify(['Masculino','Femenino']),
      '', false, true],

    [2,'S2','Datos personales', 30,'cedula',
      'Número de cédula de identidad',
      'text', true, '[]',
      '', true, false],

    [2,'S2','Datos personales', 40,'edad',
      'Edad (años cumplidos al momento de la encuesta)',
      'number', true, '[]',
      '', false, true],

    // ── Sección 3: Procedencia ──────────────────────────────────────────
    [2,'S2','Datos personales', 50,'estado_civil',
      'Estado civil',
      'select', true, JSON.stringify(civilStatus),
      '', false, true],

    [2,'S2','Datos personales', 60,'nivel_educativo',
      'Nivel educativo alcanzado',
      'select', true, JSON.stringify(education),
      '', false, true],

    [3,'S3','Procedencia', 10,'departamento_procedencia',
      'Departamento de nacimiento',
      'select', true, JSON.stringify(depts),
      '', false, true],

    [3,'S3','Procedencia', 20,'pais_origen',
      'País de nacimiento (solo si es extranjero)',
      'text', false, '[]',
      'departamento_procedencia=Otro país', false, true],

    [3,'S3','Procedencia', 30,'distrito_procedencia',
      'Distrito de nacimiento',
      'select_or_text', true, JSON.stringify(districts),
      '', false, true],

    [3,'S3','Procedencia', 40,'localidad_procedencia',
      'Localidad / Compañía de nacimiento',
      'text', false, '[]',
      '', false, false],

    // ── Sección 4: Residencia actual ────────────────────────────────────
    [4,'S4','Residencia actual', 10,'departamento_residencia',
      'Departamento donde vive actualmente',
      'select', true, JSON.stringify(depts),
      '', false, true],

    [4,'S4','Residencia actual', 20,'distrito_residencia',
      'Distrito de residencia',
      'select_or_text', true, JSON.stringify(districts),
      '', false, true],

    [4,'S4','Residencia actual', 30,'localidad_residencia',
      'Localidad / Compañía de residencia',
      'text', false, '[]',
      '', false, false],

    [4,'S4','Residencia actual', 40,'area_residencia',
      'Área de residencia',
      'select', true, JSON.stringify(['Urbana','Rural']),
      '', false, true],

    // ── Sección 5: Comunidad indígena ───────────────────────────────────
    [5,'S5','Comunidad indígena', 10,'pertenece_comunidad_indigena',
      '¿Pertenece a alguna comunidad indígena?',
      'select', true, JSON.stringify(yn),
      '', false, true],

    [5,'S5','Comunidad indígena', 20,'etnia',
      'Etnia o pueblo indígena al que pertenece',
      'select_or_text', false, JSON.stringify(ethnicGroups),
      'pertenece_comunidad_indigena=Sí', false, true],

    // ── Sección 6: Condiciones del hogar ────────────────────────────────
    [6,'S6','Condiciones del hogar', 10,'tipo_vivienda',
      'Tipo de vivienda',
      'select', true, JSON.stringify(housing),
      '', false, true],

    [6,'S6','Condiciones del hogar', 15,'personas_hogar',
      'Cantidad de personas en el hogar',
      'number', true, '[]',
      '', false, true],

    [6,'S6','Condiciones del hogar', 18,'n_hijos',
      'Cantidad de hijos',
      'number', true, '[]',
      '', false, true],

    [6,'S6','Condiciones del hogar', 20,'combustible_cocina',
      'Combustible que usa principalmente para cocinar en su hogar',
      'select', true, JSON.stringify(fuels),
      '', false, true],

    [6,'S6','Condiciones del hogar', 30,'combustible_cocina_otro',
      'Especifique el otro combustible que usa',
      'text', false, '[]',
      'combustible_cocina=Otro', false, false],

    // ── Sección 7: Historial laboral anterior ───────────────────────────
    [6,'S6','Condiciones del hogar', 40,'medio_transporte',
      'Medio de transporte principal al trabajo',
      'select', true, JSON.stringify(transport),
      '', false, true],

    [7,'S7','Historial laboral anterior', 10,'trabajaba_antes_paracel',
      '¿Tenía trabajo antes de ingresar a Paracel?',
      'select', true, JSON.stringify(yn),
      '', false, true],

    [7,'S7','Historial laboral anterior', 20,'salario_anterior_banda',
      'Rango salarial en su trabajo anterior',
      'select', false, JSON.stringify(salaries),
      'trabajaba_antes_paracel=Sí', false, true],

    [7,'S7','Historial laboral anterior', 30,'descuento_ips_anterior',
      '¿Le descontaban IPS en su trabajo anterior?',
      'select', false, JSON.stringify(yn),
      'trabajaba_antes_paracel=Sí', false, true],

    // ── Sección 8: Situación laboral actual ─────────────────────────────
    [8,'S8','Situación laboral actual', 10,'salario_actual_banda',
      'Rango de su salario actual en Paracel',
      'select', true, JSON.stringify(salaries),
      '', false, true],

    [8,'S8','Situación laboral actual', 20,'descuento_ips_actual',
      '¿Le descuentan IPS actualmente?',
      'select', true, JSON.stringify(yn),
      '', false, true]
  ];

  var ss = getBackendSpreadsheet_();
  var sh = ss.getSheetByName(APP_CFG.SHEETS.QUESTIONNAIRE);
  if (sh.getLastRow() > 1) {
    sh.deleteRows(2, sh.getLastRow() - 1);
  }
  rows.forEach(function(r) { sh.appendRow(r); });
  Logger.log('✅ CUESTIONARIO: ' + rows.length + ' preguntas cargadas en ' + rows.length + ' filas.');
}

/* ─────────────────────────────────────────────────────────
   CATALOGOS  (referencia analítica; reemplaza contenido existente)
───────────────────────────────────────────────────────── */
function seedCatalogs() {
  var rows = [];

  // Departamentos
  ['Alto Paraguay','Alto Paraná','Amambay','Asunción','Boquerón','Caaguazú','Caazapá',
   'Canindeyú','Central','Concepción','Cordillera','Guairá','Itapúa','Misiones',
   'Paraguarí','Presidente Hayes','San Pedro','Ñeembucú','Otro país']
    .forEach(function(d, i) {
      rows.push(['departamento', String(i + 1).padStart(2, '0'), d]);
    });

  // Combustible para cocinar
  [['GAS','Gas'],['ELEC','Electricidad'],['LENA','Leña'],['CARBON','Carbón'],
   ['NINGUNO','Ninguno (no cocina)'],['OTRO','Otro']]
    .forEach(function(f) { rows.push(['combustible_cocina', f[0], f[1]]); });

  // Bandas salariales (en orden)
  [['01','Menos del salario mínimo'],['02','Salario mínimo'],
   ['03','Más del salario mínimo y hasta 3 millones'],['04','Más de 3 millones y hasta 5 millones'],
   ['05','Más de 5 millones y hasta 7 millones'],['06','Más de 7 millones y hasta 10 millones'],
   ['07','Más de 10 millones y hasta 13 millones'],['08','Más de 13 millones y hasta 15 millones'],
   ['09','Más de 15 millones y hasta 20 millones'],['10','Más de 20 millones y hasta 30 millones'],
   ['11','Más de 30 millones'],['99','No informa']]
    .forEach(function(s) { rows.push(['salario', s[0], s[1]]); });

  // Tipo de colaborador
  [['DIR','Directo'],['IND','Indirecto']]
    .forEach(function(t) { rows.push(['tipo_colaborador', t[0], t[1]]); });

  // Área (indirecto)
  [['FOR','Forestal'],['IND','Industrial']]
    .forEach(function(a) { rows.push(['area_indirecto', a[0], a[1]]); });

  // Sexo
  [['M','Masculino'],['F','Femenino']]
    .forEach(function(s) { rows.push(['sexo', s[0], s[1]]); });

  // Área de residencia
  [['URB','Urbana'],['RUR','Rural']]
    .forEach(function(a) { rows.push(['area_residencia', a[0], a[1]]); });

  // Empresas contratistas (Catálogo Maestro)
  [['TECNOFORESTAL','TECNOFORESTAL'],['OAC','OAC MAQUINARIAS'],['LUSITANA','LUSITANA'],
   ['AGRO','AGROGANADERA MARIA EUGENIA'],['RANCHO','RANCHO FORESTAL'],['PLANSUR','PLANSUR'],
   ['PROSEGUR','PROSEGUR'],['JM','CONSTRUCTORA JM'],['BUREAU','BUREAU VERITAS'],
   ['OTRA','Otra (especificar)']]
    .forEach(function(e) { rows.push(['empresa_contratista', e[0], e[1]]); });

  var ss = getBackendSpreadsheet_();
  var sh = ss.getSheetByName(APP_CFG.SHEETS.CATALOGS);
  if (sh.getLastRow() > 1) {
    sh.deleteRows(2, sh.getLastRow() - 1);
  }
  rows.forEach(function(r) { sh.appendRow(r); });
  Logger.log('✅ CATALOGOS: ' + rows.length + ' entradas cargadas.');
}
