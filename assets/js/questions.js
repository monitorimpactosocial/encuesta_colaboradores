/**
 * Encuesta de Colaboradores Paracel
 * Definición completa del cuestionario - todas las secciones y preguntas
 */

const DEPARTAMENTOS_PY = [
  'Asunción','Alto Paraguay','Alto Paraná','Amambay','Boquerón',
  'Caaguazú','Caazapá','Canindeyu','Central','Concepción',
  'Cordillera','Guairá','Itapúa','Misiones','Ñeembucú',
  'Paraguarí','Presidente Hayes','San Pedro','Otro país (especificar)'
];

const EMPRESAS_CONTRATISTAS = [
  'OAC MAQUINARIAS','TECNOFORESTAL','LUSITANA','AGROGANADERA MARIA EUGENIA',
  'RANCHO FORESTAL','PROSEGUR','CONSTRUCTORA JM','PLANSUR','GNF','FDE',
  'DAF','HELITACTICA','EL MEJOR','SUDAMERIS BANK','INFOMASTER',
  'BUREAU VERITAS','KUROSU & CIA','TECNOEDIL','RANCHALES','RED FORESTAL',
  'COPETROL','ASISMOE','TESACOM','PADDINGTON','RESOHL',
  'CSI INGENIEROS','INGENIERIA AMBIENTAL','MORADO EMPRENDIMIENTOS','Otra (especificar)'
];

const NIVELES_EDUCATIVOS = [
  'Sin instrucción','Educación inicial (jardín de infantes)',
  'Primaria incompleta','Primaria completa',
  'Secundaria incompleta','Secundaria completa',
  'Terciario/Técnico incompleto','Terciario/Técnico completo',
  'Universitario incompleto','Universitario completo',
  'Posgrado/Maestría/Doctorado'
];

const SECTORES_ECONOMICOS = [
  'Agropecuario, forestal, pesca','Minería','Industria manufacturera',
  'Electricidad, gas, agua','Construcción','Comercio',
  'Transporte y comunicaciones','Finanzas y seguros',
  'Servicios personales y sociales','Administración pública','Otro'
];

const QUESTIONS_SCHEMA = [
  // ============================================================
  // SECCIÓN 1: DATOS DEL COLABORADOR
  // ============================================================
  {
    section: 1,
    sectionTitle: 'Identificación del Colaborador/a',
    sectionIcon: '👤',
    id: 'tipo_colaborador',
    label: 'Tipo de colaborador/a',
    type: 'radio',
    options: ['Directo (nómina Paracel)', 'Indirecto'],
    required: true
  },
  {
    section: 1,
    id: 'area_colaborador',
    label: '¿En qué área trabaja?',
    help: 'Solo para colaboradores indirectos',
    type: 'radio',
    options: ['Industrial', 'Forestal'],
    condition: { field: 'tipo_colaborador', value: 'Indirecto' },
    required: false
  },
  {
    section: 1,
    id: 'empresa_contratista',
    label: '¿Cómo se llama la empresa contratista de Paracel en la que trabaja?',
    type: 'select',
    options: EMPRESAS_CONTRATISTAS,
    condition: { field: 'tipo_colaborador', value: 'Indirecto' },
    required: false
  },
  {
    section: 1,
    id: 'empresa_otro',
    label: 'Especifique la empresa contratista',
    type: 'text',
    condition: { field: 'empresa_contratista', value: 'Otra (especificar)' },
    required: false
  },
  {
    section: 1,
    id: 'cargo',
    label: 'Cargo para el que fue contratado/a',
    type: 'text',
    placeholder: 'Ej: Operador de Maquinaria',
    required: true
  },
  {
    section: 1,
    id: 'nombre_apellido',
    label: 'Nombre y Apellido del colaborador/a',
    type: 'text',
    placeholder: 'Nombre completo',
    required: true
  },
  {
    section: 1,
    id: 'sexo',
    label: 'Sexo',
    type: 'radio',
    options: ['Masculino', 'Femenino'],
    required: true
  },
  {
    section: 1,
    id: 'cedula',
    label: 'Número de Cédula de Identidad',
    type: 'text',
    placeholder: 'Sin puntos ni guiones',
    required: true
  },
  {
    section: 1,
    id: 'fecha_nacimiento',
    label: 'Fecha de Nacimiento',
    type: 'date',
    required: false
  },
  {
    section: 1,
    id: 'edad',
    label: 'Edad (en años cumplidos)',
    type: 'number',
    min: 18, max: 90,
    required: true
  },
  {
    section: 1,
    id: 'telefono',
    label: 'Teléfono de contacto',
    type: 'text',
    placeholder: 'Ej: 0981 000000',
    required: false
  },
  {
    section: 1,
    id: 'email',
    label: 'Correo electrónico',
    type: 'email',
    placeholder: 'correo@ejemplo.com',
    required: false
  },
  {
    section: 1,
    id: 'nacionalidad',
    label: 'Nacionalidad del colaborador/a',
    type: 'radio',
    options: ['Paraguaya', 'Brasileña', 'Argentina', 'Boliviana', 'Otra (especificar)'],
    required: false
  },
  {
    section: 1,
    id: 'fuente_reclutamiento',
    label: '¿Cuál es la fuente de reclutamiento o el canal por el cual se enteró de la vacante en Paracel?',
    type: 'radio',
    options: [
      'Recomendación de un familiar o amigo',
      'Aviso en redes sociales',
      'Bolsa de trabajo / Portal de empleo',
      'Radio o medios de comunicación',
      'Contacto directo con la empresa',
      'Feria de empleo',
      'Otra (especificar)'
    ],
    required: false
  },

  // ============================================================
  // SECCIÓN 2: PROCEDENCIA Y RESIDENCIA
  // ============================================================
  {
    section: 2,
    sectionTitle: 'Procedencia y Residencia',
    sectionIcon: '📍',
    id: 'depto_procedencia',
    label: '8.1.1 Departamento de procedencia',
    type: 'select',
    options: DEPARTAMENTOS_PY,
    required: true
  },
  {
    section: 2,
    id: 'pais_procedencia',
    label: 'Especificar país de origen',
    type: 'text',
    condition: { field: 'depto_procedencia', value: 'Otro país (especificar)' },
    required: false
  },
  {
    section: 2,
    id: 'distrito_procedencia',
    label: '8.1.2 Distrito de Procedencia',
    type: 'text',
    placeholder: 'Nombre del distrito',
    required: false
  },
  {
    section: 2,
    id: 'barrio_procedencia',
    label: '8.1.3 Barrio o Localidad de procedencia',
    type: 'text',
    placeholder: 'Nombre del barrio o localidad',
    required: false
  },
  {
    section: 2,
    id: 'depto_residencia',
    label: '8.2.1 Departamento de residencia actual',
    type: 'select',
    options: DEPARTAMENTOS_PY,
    required: true
  },
  {
    section: 2,
    id: 'pais_residencia',
    label: 'Especificar país de residencia',
    type: 'text',
    condition: { field: 'depto_residencia', value: 'Otro país (especificar)' },
    required: false
  },
  {
    section: 2,
    id: 'distrito_residencia',
    label: '8.2.2 Distrito de residencia actual',
    type: 'text',
    placeholder: 'Nombre del distrito',
    required: false
  },
  {
    section: 2,
    id: 'barrio_residencia',
    label: '8.2.3 Barrio o localidad de residencia actual',
    type: 'text',
    placeholder: 'Nombre del barrio o localidad',
    required: false
  },
  {
    section: 2,
    id: 'area_residencia',
    label: '9. Área de residencia actual',
    type: 'radio',
    options: ['Urbana', 'Rural'],
    required: true
  },
  {
    section: 2,
    id: 'comunidad_indigena',
    label: '10. ¿Pertenece a una comunidad indígena?',
    type: 'radio',
    options: ['Sí', 'No'],
    required: true
  },
  {
    section: 2,
    id: 'etnia',
    label: '11. ¿A qué etnia pertenece?',
    type: 'text',
    placeholder: 'Nombre de la etnia',
    condition: { field: 'comunidad_indigena', value: 'Sí' },
    required: false
  },

  // ============================================================
  // SECCIÓN 3: COMPOSICIÓN DEL HOGAR
  // ============================================================
  {
    section: 3,
    sectionTitle: 'Composición del Hogar',
    sectionIcon: '🏠',
    id: 'estado_civil',
    label: '14. ¿Cuál es el estado civil o conyugal?',
    type: 'radio',
    options: [
      'Soltero/a', 'Casado/a', 'Unión libre/concubinato',
      'Separado/a', 'Divorciado/a', 'Viudo/a'
    ],
    required: false
  },
  {
    section: 3,
    id: 'mujeres_hogar_infancia',
    label: '15A.1 Mujeres en infancia (0 a 4 años)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'mujeres_hogar_ninez',
    label: '15A.2 Mujeres en niñez y adolescencia (5 a 17 años)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'mujeres_hogar_juventud',
    label: '15A.3 Mujeres en juventud (18 a 29 años)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'mujeres_hogar_adultas',
    label: '15A.4 Mujeres adultas (30 a 64 años)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'mujeres_hogar_mayores',
    label: '15A.5 Mujeres adultas mayores (65 y más)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'hombres_hogar_infancia',
    label: '15B.1 Hombres en infancia (0 a 4 años)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'hombres_hogar_ninez',
    label: '15B.2 Hombres en niñez y adolescencia (5 a 17 años)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'hombres_hogar_juventud',
    label: '15B.3 Hombres en juventud (18 a 29 años)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'hombres_hogar_adultos',
    label: '15B.4 Hombres adultos (30 a 64 años)',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 3,
    id: 'hombres_hogar_mayores',
    label: '15B.5 Hombres adultos mayores (65 y más)',
    type: 'number', min: 0, max: 20,
    required: false
  },

  // ============================================================
  // SECCIÓN 4: CONDICIONES DE LA VIVIENDA
  // ============================================================
  {
    section: 4,
    sectionTitle: 'Condiciones de la Vivienda',
    sectionIcon: '🏡',
    id: 'tipo_vivienda',
    label: '16. Tipo de vivienda',
    type: 'radio',
    options: ['Casa', 'Apartamento / Departamento', 'Rancho / Precaria', 'Pieza en inquilinato', 'Otro'],
    required: false
  },
  {
    section: 4,
    id: 'piezas_hogar',
    label: '17a. ¿Cuántas piezas son de uso exclusivo del hogar?',
    type: 'number', min: 1, max: 30,
    required: false
  },
  {
    section: 4,
    id: 'dormitorios',
    label: '17b. De esas piezas, ¿cuántas se usan como dormitorios?',
    type: 'number', min: 0, max: 20,
    required: false
  },
  {
    section: 4,
    id: 'material_paredes',
    label: '18. ¿De qué material es la mayor parte de las paredes?',
    type: 'radio',
    options: ['Ladrillo / bloque', 'Madera', 'Adobe', 'Chapa / cartón', 'Otro'],
    required: false
  },
  {
    section: 4,
    id: 'material_piso',
    label: '19. ¿De qué material es la mayor parte del piso?',
    type: 'radio',
    options: ['Cemento / hormigón', 'Cerámico / mosaico', 'Madera', 'Tierra', 'Otro'],
    required: false
  },
  {
    section: 4,
    id: 'material_techo',
    label: '20. ¿De qué material es la mayor parte del techo?',
    type: 'radio',
    options: ['Teja / tejas', 'Chapa metálica', 'Losa de hormigón', 'Paja / palma', 'Otro'],
    required: false
  },
  {
    section: 4,
    id: 'acceso_agua',
    label: '21. ¿Tiene acceso a agua dentro de su terreno o propiedad?',
    type: 'radio',
    options: ['Sí', 'No'],
    required: false
  },
  {
    section: 4,
    id: 'fuente_agua',
    label: '22. El agua que utiliza en el hogar proviene de:',
    type: 'radio',
    options: [
      'ESSAP / empresa distribuidora', 'Junta de saneamiento / aguatería comunitaria',
      'Pozo artesiano', 'Pozo a balde / aljibe', 'Río / arroyo / laguna',
      'Camión cisterna', 'Otro'
    ],
    required: false
  },
  {
    section: 4,
    id: 'regularidad_agua',
    label: '23. ¿El servicio provee agua al hogar 24 horas?',
    type: 'radio',
    options: ['Sí, siempre', 'A veces', 'No, casi nunca'],
    required: false
  },
  {
    section: 4,
    id: 'agua_beber',
    label: '25. El agua que más beben en el hogar proviene de:',
    type: 'radio',
    options: ['La misma red del hogar', 'Agua embotellada / mineral', 'Otra fuente'],
    required: false
  },
  {
    section: 4,
    id: 'luz_electrica',
    label: '27. ¿Dispone de luz eléctrica?',
    type: 'radio',
    options: ['Sí', 'No'],
    required: false
  },
  {
    section: 4,
    id: 'tiene_banio',
    label: '28. ¿Tiene baño?',
    type: 'radio',
    options: ['Sí, dentro de la vivienda', 'Sí, fuera de la vivienda', 'No tiene'],
    required: false
  },
  {
    section: 4,
    id: 'desague',
    label: '29. Tipo de desagüe sanitario. El baño se desagua en:',
    type: 'radio',
    options: ['Red cloacal', 'Pozo ciego / letrina', 'Fosa séptica', 'Al aire libre / superficial', 'Otro'],
    required: false
  },
  {
    section: 4,
    id: 'pieza_cocina',
    label: '30. ¿Tiene pieza para cocinar?',
    type: 'radio',
    options: ['Sí', 'No'],
    required: false
  },
  {
    section: 4,
    id: 'combustible_cocina',
    label: '31. Para cocinar usa principalmente:',
    type: 'radio',
    options: ['Gas (GLP)', 'Electricidad', 'Leña', 'Carbón', 'Ninguno (no cocina)', 'Otro'],
    required: false
  },
  {
    section: 4,
    id: 'disposicion_basura',
    label: '32. ¿Cómo elimina habitualmente la basura?',
    type: 'radio',
    options: [
      'Servicio de recolección municipal', 'Enterrar / quemar', 'Arroja a la calle / campo',
      'Arroja al río o arroyo', 'Otra forma'
    ],
    required: false
  },
  {
    section: 4,
    id: 'tenencia_vivienda',
    label: '33. Su vivienda es:',
    type: 'radio',
    options: ['Propia y totalmente pagada', 'Propia en pagos', 'Alquilada', 'Prestada / cedida', 'Otra situación'],
    required: false
  },
  {
    section: 4,
    id: 'alquiler_monto',
    label: '33.2 ¿Cuánto paga de alquiler mensualmente? (en Gs.)',
    type: 'text',
    condition: { field: 'tenencia_vivienda', value: 'Alquilada' },
    required: false
  },
  {
    section: 4,
    id: 'tenencia_lote',
    label: '34. El lote o terreno donde está construida la vivienda es:',
    type: 'radio',
    options: ['Propio', 'Alquilado', 'Prestado / cedido', 'Ocupado (sin título)', 'Otro'],
    required: false
  },

  // ============================================================
  // SECCIÓN 5: TECNOLOGÍA Y BIENES DEL HOGAR
  // ============================================================
  {
    section: 5,
    sectionTitle: 'Tecnología y Bienes del Hogar',
    sectionIcon: '📱',
    id: 'tiene_computadora',
    label: '35.1 ¿El hogar cuenta con computador/notebook?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 5,
    id: 'tiene_tableta',
    label: '35.2 ¿El hogar cuenta con tableta o dispositivo similar?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 5,
    id: 'tiene_telefono_fijo',
    label: '35.3 ¿El hogar cuenta con teléfono de línea fija?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 5,
    id: 'tiene_celular',
    label: '35.4 ¿El hogar cuenta con teléfono celular?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 5,
    id: 'tipo_plan_celular',
    label: '36. El teléfono celular cuenta con:',
    type: 'radio',
    options: ['Plan pospago (plan mensual con saldo para llamada e internet)', 'Carga de saldo sin plan (minicarga ocasional)'],
    condition: { field: 'tiene_celular', value: 'Sí' },
    required: false
  },
  {
    section: 5,
    id: 'tiene_internet',
    label: '37. ¿En este hogar tienen internet?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 5,
    id: 'tipo_internet',
    label: '38. El tipo de conexión a internet es:',
    type: 'radio',
    options: ['Fibra óptica / cable', 'ADSL / teléfono', 'Datos móviles (4G/3G)', 'Wifi comunitario / vecino', 'Otro'],
    condition: { field: 'tiene_internet', value: 'Sí' },
    required: false
  },
  {
    section: 5,
    id: 'bienes_hogar',
    label: '39. ¿Con cuáles de los siguientes bienes cuenta el hogar? (marque todos los que correspondan)',
    type: 'checkbox',
    options: [
      'Heladera / refrigerador', 'Horno microondas', 'Televisor',
      'Termocalefón / calefón', 'Radio', 'Máquina lavarropas',
      'Video/DVD', 'Cocina a gas', 'TV cable / streaming',
      'Antena parabólica', 'Automóvil / camión / camioneta',
      'Acondicionador de aire', 'Horno eléctrico', 'Motocicleta', 'Cocina eléctrica'
    ],
    required: false
  },

  // ============================================================
  // SECCIÓN 6: EDUCACIÓN
  // ============================================================
  {
    section: 6,
    sectionTitle: 'Educación y Capacitación',
    sectionIcon: '🎓',
    id: 'capacitacion_previa',
    label: '40. ¿Realizó algún curso de capacitación antes de ingresar a Paracel/Contratistas?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 6,
    id: 'donde_capacitacion',
    label: '41. ¿Dónde realizó los cursos de capacitación?',
    type: 'radio',
    options: ['SNPP', 'Universidad / Instituto terciario', 'Empresa privada', 'Centro comunitario', 'Otro'],
    condition: { field: 'capacitacion_previa', value: 'Sí' },
    required: false
  },
  {
    section: 6,
    id: 'por_que_sin_capacitacion',
    label: '42. ¿Por qué no realizó cursos de capacitación?',
    type: 'radio',
    options: ['No había oferta en el lugar', 'Sin recursos económicos', 'Por trabajo / falta de tiempo', 'No lo consideró necesario', 'Otro'],
    condition: { field: 'capacitacion_previa', value: 'No' },
    required: false
  },
  {
    section: 6,
    id: 'sabe_leer',
    label: '43. ¿Sabe leer y escribir?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 6,
    id: 'nivel_educativo',
    label: '44. Nivel educativo del colaborador (Marcar el grado o curso más alto aprobado)',
    type: 'select',
    options: NIVELES_EDUCATIVOS,
    required: false
  },
  {
    section: 6,
    id: 'idioma_principal',
    label: '45. ¿Qué idioma habla la mayor parte del tiempo?',
    type: 'radio',
    options: ['Castellano', 'Guaraní', 'Jopara (mezcla guaraní/castellano)', 'Otro'],
    required: false
  },

  // ============================================================
  // SECCIÓN 7: FAMILIA, SALUD Y DISCAPACIDAD
  // ============================================================
  {
    section: 7,
    sectionTitle: 'Familia, Salud y Discapacidad',
    sectionIcon: '❤️',
    id: 'hijos_escolares',
    label: '46. ¿Tiene hijos en edad escolar?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 7,
    id: 'cantidad_hijos_escolares',
    label: '46.1 ¿Cuántos hijos tiene en edad escolar?',
    type: 'number', min: 1, max: 20,
    condition: { field: 'hijos_escolares', value: 'Sí' },
    required: false
  },
  {
    section: 7,
    id: 'asisten_escuela',
    label: '47. ¿Todos asisten a la escuela?',
    type: 'radio', options: ['Sí', 'No'],
    condition: { field: 'hijos_escolares', value: 'Sí' },
    required: false
  },
  {
    section: 7,
    id: 'por_que_no_escuela',
    label: '48. ¿Por qué no asiste/n a la escuela?',
    type: 'radio',
    options: ['Trabaja / necesita trabajar', 'Lejanía / acceso difícil', 'Discapacidad', 'Embarazo', 'Otra razón'],
    condition: { field: 'asisten_escuela', value: 'No' },
    required: false
  },
  {
    section: 7,
    id: 'discapacidad_hogar',
    label: '49. ¿Algún miembro del hogar cuenta con algún tipo de discapacidad?',
    type: 'radio', options: ['Sí', 'No'],
    required: false
  },
  {
    section: 7,
    id: 'tipo_discapacidad',
    label: '50. Tipo de discapacidad (marque todos los que correspondan)',
    type: 'checkbox',
    options: ['Intelectual', 'Auditiva', 'Visual', 'Psicosocial', 'Física', 'Otra'],
    condition: { field: 'discapacidad_hogar', value: 'Sí' },
    required: false
  },
  {
    section: 7,
    id: 'certificado_discapacidad',
    label: '52. ¿Cuenta con Certificado (carnet) de condición de discapacidad?',
    type: 'radio', options: ['Sí', 'No'],
    condition: { field: 'discapacidad_hogar', value: 'Sí' },
    required: false
  },
  {
    section: 7,
    id: 'salud_antes',
    label: '53. Antes de ingresar a Paracel, ¿tenía acceso a servicios de salud?',
    type: 'checkbox',
    options: ['No', 'Sí, en las USF / Puesto o Centro de Salud', 'Sí, Hospital Público', 'Sí, Hospital/Sanatorio Privado', 'Sí, IPS', 'Sí, Otro'],
    required: false
  },
  {
    section: 7,
    id: 'seguro_medico_actual',
    label: '54. Actualmente, ¿tiene algún seguro médico vigente?',
    type: 'checkbox',
    options: ['No tiene', 'Sí, en IPS', 'Sí, Seguro Privado Laboral', 'Sí, Seguro Privado Familiar', 'Sí, Sanidad Militar', 'Sí, Sanidad Policial', 'Sí, otro'],
    required: false
  },

  // ============================================================
  // SECCIÓN 8: SITUACIÓN LABORAL
  // ============================================================
  {
    section: 8,
    sectionTitle: 'Situación Laboral',
    sectionIcon: '💼',
    id: 'trabajaba_antes',
    label: '56. Antes de ingresar a Paracel/Contratistas, ¿estaba trabajando?',
    type: 'radio', options: ['Sí', 'No'],
    required: true
  },
  {
    section: 8,
    id: 'donde_trabajaba',
    label: '57. ¿Dónde estaba trabajando antes?',
    type: 'radio',
    options: [
      'Empresa privada formal', 'Empresa privada informal',
      'Empleado/a doméstico/a', 'Cuenta propia / independiente',
      'Empleado/a público', 'Otro'
    ],
    condition: { field: 'trabajaba_antes', value: 'Sí' },
    required: false
  },
  {
    section: 8,
    id: 'tipo_contrato_anterior',
    label: '58. Bajo qué tipo de contrato trabajó en su última ocupación',
    type: 'radio',
    options: ['Contrato indefinido', 'Contrato por temporada/zafra', 'Contrato por obra/proyecto', 'Sin contrato', 'Otro'],
    condition: { field: 'trabajaba_antes', value: 'Sí' },
    required: false
  },
  {
    section: 8,
    id: 'modalidad_cobro_anterior',
    label: '59. ¿Cómo era la modalidad de cobro/pago en su anterior trabajo?',
    type: 'radio',
    options: ['Mensual', 'Quincenal', 'Semanal', 'Por día', 'Por producción / destajo', 'Otro'],
    condition: { field: 'trabajaba_antes', value: 'Sí' },
    required: false
  },
  {
    section: 8,
    id: 'medio_pago_anterior',
    label: '60. ¿Cuál era el medio de pago en su anterior trabajo?',
    type: 'radio',
    options: ['Efectivo', 'Transferencia bancaria', 'Cheque', 'Otro'],
    condition: { field: 'trabajaba_antes', value: 'Sí' },
    required: false
  },
  {
    section: 8,
    id: 'salario_anterior',
    label: '61. ¿Cuánto (Gs.) ganaba mensualmente en su anterior trabajo? (sin descuentos)',
    type: 'radio',
    options: [
      'Menos del salario mínimo (menos de Gs. 2.680.373)',
      'Salario mínimo (Gs. 2.680.373)',
      'Más del salario mínimo y hasta 3 millones',
      'Más de 3 millones y hasta 5 millones',
      'Más de 5 millones y hasta 7 millones',
      'Más de 7 millones y hasta 10 millones',
      'Más de 10 millones y hasta 13 millones',
      'Más de 13 millones y hasta 15 millones',
      'Más de 15 millones y hasta 20 millones',
      'Más de 20 millones y hasta 30 millones',
      'Más de 30 millones'
    ],
    condition: { field: 'trabajaba_antes', value: 'Sí' },
    required: false
  },
  {
    section: 8,
    id: 'ips_anterior',
    label: '62. ¿Le descontaban IPS en su anterior trabajo?',
    type: 'radio', options: ['Sí', 'No'],
    condition: { field: 'trabajaba_antes', value: 'Sí' },
    required: false
  },
  {
    section: 8,
    id: 'horas_semana_anterior',
    label: '63. ¿Cuántas horas trabajaba a la semana?',
    type: 'number', min: 1, max: 100,
    condition: { field: 'trabajaba_antes', value: 'Sí' },
    required: false
  },
  {
    section: 8,
    id: 'sector_economico_anterior',
    label: '64. ¿En qué sector económico se desempeñaba?',
    type: 'select',
    options: SECTORES_ECONOMICOS,
    condition: { field: 'trabajaba_antes', value: 'Sí' },
    required: false
  },
  {
    section: 8,
    id: 'tiempo_en_paracel',
    label: '65. ¿Hace cuánto tiempo trabaja en Paracel/Contratistas?',
    type: 'radio',
    options: [
      'Menos de 3 meses', 'De 3 a 6 meses', 'De 6 meses a 1 año',
      'De 1 a 2 años', 'De 2 a 5 años', 'Más de 5 años'
    ],
    required: false
  },
  {
    section: 8,
    id: 'salario_actual',
    label: '66. ¿Cuánto (Gs.) gana actualmente al mes? (sin descuentos)',
    type: 'radio',
    options: [
      'Menos del salario mínimo (menos de Gs. 2.680.373)',
      'Salario mínimo (Gs. 2.680.373)',
      'Más del salario mínimo y hasta 3 millones',
      'Más de 3 millones y hasta 5 millones',
      'Más de 5 millones y hasta 7 millones',
      'Más de 7 millones y hasta 10 millones',
      'Más de 10 millones y hasta 13 millones',
      'Más de 13 millones y hasta 15 millones',
      'Más de 15 millones y hasta 20 millones',
      'Más de 20 millones y hasta 30 millones',
      'Más de 30 millones',
      'No quiso dar información'
    ],
    required: false
  },
  {
    section: 8,
    id: 'ips_actual',
    label: '67. ¿Le descuentan IPS actualmente?',
    type: 'radio', options: ['Sí', 'No'],
    required: true
  },
  {
    section: 8,
    id: 'medio_pago_actual',
    label: '68. Medio de pago actual',
    type: 'radio',
    options: ['Efectivo', 'Transferencia bancaria', 'Cheque', 'Otro'],
    required: false
  },
  {
    section: 8,
    id: 'area_trabajo_contratista',
    label: '70. ¿En qué área de la empresa contratista trabaja?',
    type: 'radio',
    options: ['Administración', 'Campo / Producción', 'Logística / Transporte', 'Seguridad', 'Servicios Generales', 'Técnico / Mantenimiento', 'Otro'],
    condition: { field: 'tipo_colaborador', value: 'Indirecto' },
    required: false
  }
];

// Helper: get sections array
const SECTIONS = [...new Set(QUESTIONS_SCHEMA.map(q => q.section))].map(secNum => {
  const firstQ = QUESTIONS_SCHEMA.find(q => q.section === secNum);
  return {
    number: secNum,
    title: firstQ.sectionTitle || `Sección ${secNum}`,
    icon: firstQ.sectionIcon || '📋',
    questions: QUESTIONS_SCHEMA.filter(q => q.section === secNum)
  };
});
