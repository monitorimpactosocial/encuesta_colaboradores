/**
 * Nomina.gs
 * Gestión de la nómina 2026 de Paracel: seed, lookup por cédula,
 * e importación masiva de invitaciones desde la nómina.
 * Generado parcialmente por _build_nomina_gs.py
 */

/* ─── Datos embebidos ────────────────────────────────────────────────────────
   Fuente: Nomina_2024-2025-2026.xlsx → hoja "Nomina 2026"
   Columnas: cedula, apellidos, nombres, nombre_completo, genero, cargo,
             area, email, fecha_ingreso, edicion
──────────────────────────────────────────────────────────────────────────── */
var NOMINA_2026_DATA_ = [
  {"cedula": "2367212", "apellidos": "Chelala Orue", "nombres": "Latifi Riad", "nombre_completo": "Latifi Riad Chelala Orue", "genero": "F", "cargo": "DIRECTORA DE SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "latifi.chelala@paracel.com.py", "fecha_ingreso": "2020-04-15", "edicion": "2026"},
  {"cedula": "1551861", "apellidos": "Osuna Fratta", "nombres": "Mauricio", "nombre_completo": "Mauricio Osuna Fratta", "genero": "M", "cargo": "GERENTE DE PLANIFICACION Y ADMINISTRACION DE TIERRAS", "area": "FORESTAL", "email": "mauricio.osuna@paracel.com.py", "fecha_ingreso": "2020-06-25", "edicion": "2026"},
  {"cedula": "3281504", "apellidos": "Medina", "nombres": "Eliodoro Ramon", "nombre_completo": "Eliodoro Ramon Medina", "genero": "M", "cargo": "GERENTE DE FOMENTO FORESTAL", "area": "FORESTAL", "email": "eliodoro.medina@paracel.com.py", "fecha_ingreso": "2020-06-26", "edicion": "2026"},
  {"cedula": "3765073", "apellidos": "Gomez Riveros", "nombres": "Miguel Angel", "nombre_completo": "Miguel Angel Gomez Riveros", "genero": "M", "cargo": "SUPERVISOR DE FOMENTO FORESTAL", "area": "FORESTAL", "email": "miguel.gomez@paracel.com.py", "fecha_ingreso": "2020-09-01", "edicion": "2026"},
  {"cedula": "3246153", "apellidos": "Gill Ojeda", "nombres": "Emma Alejandra", "nombre_completo": "Emma Alejandra Gill Ojeda", "genero": "F", "cargo": "COORDINADORA DE GEOPROCESAMIENTO", "area": "FORESTAL", "email": "alejandra.gill@paracel.com.py", "fecha_ingreso": "2020-11-16", "edicion": "2026"},
  {"cedula": "4146034", "apellidos": "Villalba Pérez", "nombres": "Gisselle Magdalena", "nombre_completo": "Gisselle Magdalena Villalba Pérez", "genero": "F", "cargo": "GERENTE EJECUTIVA DE SUSTENTABILIDAD AMBIENTAL", "area": "AMBIENTAL", "email": "gisselle.villalba@paracel.com.py", "fecha_ingreso": "2020-12-14", "edicion": "2026"},
  {"cedula": "3870119", "apellidos": "Mendoza Jarolin", "nombres": "Gladys Noelia", "nombre_completo": "Gladys Noelia Mendoza Jarolin", "genero": "F", "cargo": "COORDINADORA DE SUSTENTABILIDAD SOCIAL", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "noelia.mendoza@paracel.com.py", "fecha_ingreso": "2021-03-02", "edicion": "2026"},
  {"cedula": "2023745", "apellidos": "Peralta Valiente", "nombres": "Liliana Elizabeth", "nombre_completo": "Liliana Elizabeth Peralta Valiente", "genero": "F", "cargo": "ANALISTA DE CUENTAS A PAGAR", "area": "FINANZAS", "email": "liliana.peralta@paracel.com.py", "fecha_ingreso": "2021-03-15", "edicion": "2026"},
  {"cedula": "4906264", "apellidos": "Galeano Fretes", "nombres": "Luz Maria", "nombre_completo": "Luz Maria Galeano Fretes", "genero": "F", "cargo": "GERENTE DE TALENTO HUMANO", "area": "TALENTO HUMANO", "email": "luz.galeano@paracel.com.py", "fecha_ingreso": "2021-03-22", "edicion": "2026"},
  {"cedula": "2509305", "apellidos": "Servín Avalos", "nombres": "Yrene Jazmin", "nombre_completo": "Yrene Jazmin Servín Avalos", "genero": "F", "cargo": "TÉCNICA SOCIAL DE CAMPO", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "yrene.servin@paracel.com.py", "fecha_ingreso": "2021-04-05", "edicion": "2026"},
  {"cedula": "4648305", "apellidos": "Ramirez Pastore", "nombres": "Carlos Agustin", "nombre_completo": "Carlos Agustin Ramirez Pastore", "genero": "M", "cargo": "COORDINADOR DE PLANIFICACIÓN FINANCIERA", "area": "FINANZAS", "email": "carlos.ramirez@paracel.com.py", "fecha_ingreso": "2021-04-12", "edicion": "2026"},
  {"cedula": "2626131", "apellidos": "Meza Ibarra", "nombres": "Rocio Maria Alina", "nombre_completo": "Rocio Maria Alina Meza Ibarra", "genero": "F", "cargo": "COORDINADORA DE ADMINISTRACIÓN Y CONTROL DE COSTOS", "area": "INGENIERIA", "email": "rocio.meza@paracel.com.py", "fecha_ingreso": "2021-07-12", "edicion": "2026"},
  {"cedula": "4647078", "apellidos": "Espinola Ferreira", "nombres": "Pablo Enrique", "nombre_completo": "Pablo Enrique Espinola Ferreira", "genero": "M", "cargo": "ESPECIALISTA FORESTAL", "area": "FORESTAL", "email": "pablo.espinola@paracel.com.py", "fecha_ingreso": "2021-07-26", "edicion": "2026"},
  {"cedula": "2977128", "apellidos": "Fankauser Martinez", "nombres": "Hugo Flaminio", "nombre_completo": "Hugo Flaminio Fankauser Martinez", "genero": "M", "cargo": "TÉCNICO DE CAMPO", "area": "AMBIENTAL", "email": "hugo.fankauser@paracel.com.py", "fecha_ingreso": "2021-08-09", "edicion": "2026"},
  {"cedula": "4512746", "apellidos": "Ocampo Ferreira", "nombres": "Karen Irene", "nombre_completo": "Karen Irene Ocampo Ferreira", "genero": "F", "cargo": "ASISTENTE ADMINISTRATIVA", "area": "FORESTAL", "email": "karen.ocampo@paracel.com.py", "fecha_ingreso": "2021-10-11", "edicion": "2026"},
  {"cedula": "4965800", "apellidos": "Palacios Gayoso", "nombres": "Alfonso Sebastian", "nombre_completo": "Alfonso Sebastian Palacios Gayoso", "genero": "M", "cargo": "ANALISTA DE LOGISTICA", "area": "LOGISTICA", "email": "alfonso.palacios@paracel.com.py", "fecha_ingreso": "2021-11-22", "edicion": "2026"},
  {"cedula": "3825065", "apellidos": "Ortiz Grabski", "nombres": "Camila", "nombre_completo": "Camila Ortiz Grabski", "genero": "F", "cargo": "COORDINADORA DE AREA DE CONSERVACION Y CARBONO", "area": "AMBIENTAL", "email": "camila.ortiz@paracel.com.py", "fecha_ingreso": "2022-01-03", "edicion": "2026"},
  {"cedula": "5125294", "apellidos": "Pereira Fleitas", "nombres": "Lucia Noemi", "nombre_completo": "Lucia Noemi Pereira Fleitas", "genero": "F", "cargo": "ANALISTA DE RECLUTAMIENTO & SELECCIÓN", "area": "TALENTO HUMANO", "email": "lucia.pereira@paracel.com.py", "fecha_ingreso": "2022-01-19", "edicion": "2026"},
  {"cedula": "6298471", "apellidos": "Cristaldo Coronel", "nombres": "Sandra Teresita", "nombre_completo": "Sandra Teresita Cristaldo Coronel", "genero": "F", "cargo": "ANALISTA FORESTAL", "area": "FORESTAL", "email": "sandra.cristaldo@paracel.com.py", "fecha_ingreso": "2022-02-07", "edicion": "2026"},
  {"cedula": "1479328", "apellidos": "De Giacomi Zaldivar", "nombres": "Octavio", "nombre_completo": "Octavio De Giacomi Zaldivar", "genero": "M", "cargo": "DIRECTOR DE TALENTO HUMANO & CULTURA", "area": "TALENTO HUMANO", "email": "octavio.degiacomi@paracel.com.py", "fecha_ingreso": "2022-02-14", "edicion": "2026"},
  {"cedula": "4360117", "apellidos": "Ayala Gonzalez", "nombres": "Angel Orlando", "nombre_completo": "Angel Orlando Ayala Gonzalez", "genero": "M", "cargo": "COORDINADOR DE ALMACENAMIENTO", "area": "COMPRAS", "email": "angel.ayala@paracel.com.py", "fecha_ingreso": "2022-03-14", "edicion": "2026"},
  {"cedula": "4452574", "apellidos": "Gonzalez Cubas", "nombres": "Perla Leticia", "nombre_completo": "Perla Leticia Gonzalez Cubas", "genero": "F", "cargo": "COORDINADORA ADMINISTRATIVA DE CENTRAL DE SERVICIOS", "area": "FORESTAL", "email": "perla.gonzalez@paracel.com.py", "fecha_ingreso": "2022-04-06", "edicion": "2026"},
  {"cedula": "3757658", "apellidos": "Niederberger Heilbrunn", "nombres": "Melanie", "nombre_completo": "Melanie Niederberger Heilbrunn", "genero": "F", "cargo": "ANALISTA DE NEGOCIOS Y ADMINISTRACION DE TIERRAS", "area": "FORESTAL", "email": "melanie.niederberger@paracel.com.py", "fecha_ingreso": "2022-06-01", "edicion": "2026"},
  {"cedula": "4387506", "apellidos": "Gonzalez Acosta", "nombres": "Osvaldo David", "nombre_completo": "Osvaldo David Gonzalez Acosta", "genero": "M", "cargo": "TÉCNICO SOCIAL DE CAMPO", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "osvaldo.gonzalez@paracel.com.py", "fecha_ingreso": "2022-06-01", "edicion": "2026"},
  {"cedula": "4430537", "apellidos": "Bobadilla Pérez", "nombres": "Rafael Agustín", "nombre_completo": "Rafael Agustín Bobadilla Pérez", "genero": "M", "cargo": "TÉCNICO SOCIAL DE CAMPO", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "rafael.bobadilla@paracel.com.py", "fecha_ingreso": "2022-06-01", "edicion": "2026"},
  {"cedula": "8994258", "apellidos": "Ferreira", "nombres": "Eder", "nombre_completo": "Eder Ferreira", "genero": "M", "cargo": "SUPERVISOR DE SILVICULTURA", "area": "FORESTAL", "email": "eder.ferreira@paracel.com.py", "fecha_ingreso": "2022-07-21", "edicion": "2026"},
  {"cedula": "8993557", "apellidos": "Ferraresso Conti", "nombres": "Jose Luiz", "nombre_completo": "Jose Luiz Ferraresso Conti", "genero": "M", "cargo": "GERENTE DE INVESTIGACIÓN & DESARROLLO", "area": "FORESTAL", "email": "jose.conti@paracel.com.py", "fecha_ingreso": "2022-08-01", "edicion": "2026"},
  {"cedula": "4889954", "apellidos": "Celabe González", "nombres": "Fiorella Mariel", "nombre_completo": "Fiorella Mariel Celabe González", "genero": "F", "cargo": "COORDINADORA AMBIENTAL DE DESEMPEÑO", "area": "AMBIENTAL", "email": "fiorella.celabe@paracel.com.py", "fecha_ingreso": "2022-08-12", "edicion": "2026"},
  {"cedula": "3176338", "apellidos": "Arce Benitez", "nombres": "Maglio Gustavo", "nombre_completo": "Maglio Gustavo Arce Benitez", "genero": "M", "cargo": "ESPECIALISTA EN TELECOMUNICACIONES", "area": "TI & DIGITAL", "email": "gustavo.arce@paracel.com.py", "fecha_ingreso": "2022-08-16", "edicion": "2026"},
  {"cedula": "3227094", "apellidos": "Duarte Gonzalez", "nombres": "Jose Nicolas", "nombre_completo": "Jose Nicolas Duarte Gonzalez", "genero": "M", "cargo": "COORDINADOR DE INSFRAESTRUCTURA SOCIAL", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "jose.duarte@paracel.com.py", "fecha_ingreso": "2022-09-06", "edicion": "2026"},
  {"cedula": "3986858", "apellidos": "Vera Ortiz", "nombres": "Rocio Magali", "nombre_completo": "Rocio Magali Vera Ortiz", "genero": "F", "cargo": "ESPECIALISTA DE CONTABILIDAD", "area": "FINANZAS", "email": "rocio.vera@paracel.com.py", "fecha_ingreso": "2022-09-07", "edicion": "2026"},
  {"cedula": "2354570", "apellidos": "Tabel Recalde", "nombres": "Alejandra Maria", "nombre_completo": "Alejandra Maria Tabel Recalde", "genero": "F", "cargo": "GERENTE DE ASUNTOS JURIDICOS & REGULATORIOS", "area": "FINANZAS", "email": "alejandra.tabel@paracel.com.py", "fecha_ingreso": "2022-09-19", "edicion": "2026"},
  {"cedula": "6327157", "apellidos": "Benega Risaldi", "nombres": "Aldo", "nombre_completo": "Aldo Benega Risaldi", "genero": "M", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "aldo.benega@paracel.com.py", "fecha_ingreso": "2022-10-04", "edicion": "2026"},
  {"cedula": "4306537", "apellidos": "Mendieta Zaracho", "nombres": "Susana Elizabeth", "nombre_completo": "Susana Elizabeth Mendieta Zaracho", "genero": "F", "cargo": "SUPERVISORA DE FOMENTO FORESTAL", "area": "FORESTAL", "email": "susana.mendieta@paracel.com.py", "fecha_ingreso": "2022-10-10", "edicion": "2026"},
  {"cedula": "5712317", "apellidos": "Duran Estigarribia", "nombres": "Luis Mariano", "nombre_completo": "Luis Mariano Duran Estigarribia", "genero": "M", "cargo": "DIRECTOR DE COMPRAS & CADENA DE SUMINISTROS", "area": "COMPRAS", "email": "mariano.duran@paracel.com.py", "fecha_ingreso": "2022-10-10", "edicion": "2026"},
  {"cedula": "6276555", "apellidos": "Aguilera Zarate", "nombres": "Luis Fernando", "nombre_completo": "Luis Fernando Aguilera Zarate", "genero": "M", "cargo": "ESPECIALISTA DE FITOPATOLOGIA", "area": "FORESTAL", "email": "luis.aguilera@paracel.com.py", "fecha_ingreso": "2022-11-01", "edicion": "2026"},
  {"cedula": "5223957", "apellidos": "Alfonso Faria", "nombres": "Arnaldo Ruben", "nombre_completo": "Arnaldo Ruben Alfonso Faria", "genero": "M", "cargo": "SUPERVISOR DE INFRAESTRUCTURA FORESTAL", "area": "FORESTAL", "email": "arnaldo.alfonso@paracel.com.py", "fecha_ingreso": "2022-11-01", "edicion": "2026"},
  {"cedula": "4431945", "apellidos": "Salomon Saldivar", "nombres": "Carlos Jose", "nombre_completo": "Carlos Jose Salomon Saldivar", "genero": "M", "cargo": "ASISTENTE DE GEOPROCESAMIENTO", "area": "FORESTAL", "email": "carlos.salomon@paracel.com.py", "fecha_ingreso": "2022-11-11", "edicion": "2026"},
  {"cedula": "5002746", "apellidos": "Huerta Benitez", "nombres": "Humberto Ramon", "nombre_completo": "Humberto Ramon Huerta Benitez", "genero": "M", "cargo": "SUPERVISOR DE SILVICULTURA", "area": "FORESTAL", "email": "humberto.huerta@paracel.com.py", "fecha_ingreso": "2022-11-11", "edicion": "2026"},
  {"cedula": "3933209", "apellidos": "Maldonado Gonzalez", "nombres": "Miguel Marcel", "nombre_completo": "Miguel Marcel Maldonado Gonzalez", "genero": "M", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "miguel.maldonado@paracel.com.py", "fecha_ingreso": "2022-11-11", "edicion": "2026"},
  {"cedula": "5054612", "apellidos": "Ortiz Almeida", "nombres": "Raul Andres", "nombre_completo": "Raul Andres Ortiz Almeida", "genero": "M", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "raul.ortiz@paracel.com.py", "fecha_ingreso": "2022-11-11", "edicion": "2026"},
  {"cedula": "6025822", "apellidos": "Aguirre Arguello", "nombres": "Dario Samuel", "nombre_completo": "Dario Samuel Aguirre Arguello", "genero": "M", "cargo": "ANALISTA DE SUMINISTROS FORESTALES", "area": "COMPRAS", "email": "dario.aguirre@paracel.com.py", "fecha_ingreso": "2022-12-09", "edicion": "2026"},
  {"cedula": "3399381", "apellidos": "Martínez Mieres", "nombres": "Nora Alcira", "nombre_completo": "Nora Alcira Martínez Mieres", "genero": "F", "cargo": "ESPECIALISTA DE AREA DE CONSERVACION", "area": "AMBIENTAL", "email": "nora.martinez@paracel.com.py", "fecha_ingreso": "2023-01-09", "edicion": "2026"},
  {"cedula": "4644119", "apellidos": "Ortiz Fernandez", "nombres": "Silvia Beatriz", "nombre_completo": "Silvia Beatriz Ortiz Fernandez", "genero": "F", "cargo": "ANALISTA DE DISEÑO", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "silvia.ortiz@paracel.com.py", "fecha_ingreso": "2023-02-06", "edicion": "2026"},
  {"cedula": "4351040", "apellidos": "Vazquez Centurion", "nombres": "Javier Adrian", "nombre_completo": "Javier Adrian Vazquez Centurion", "genero": "M", "cargo": "SUPERVISOR DE SILVICULTURA", "area": "FORESTAL", "email": "javier.vazquez@paracel.com.py", "fecha_ingreso": "2023-02-13", "edicion": "2026"},
  {"cedula": "2056240", "apellidos": "Guillen Benitez", "nombres": "Diego Ruben", "nombre_completo": "Diego Ruben Guillen Benitez", "genero": "M", "cargo": "GERENTE DE PLANIFICACION Y ANALISIS FINANCIERO", "area": "FINANZAS", "email": "diego.guillen@paracel.com.py", "fecha_ingreso": "2023-03-13", "edicion": "2026"},
  {"cedula": "9152595", "apellidos": "Chamorro", "nombres": "Iris Carolina", "nombre_completo": "Iris Carolina Chamorro", "genero": "F", "cargo": "COORDINADORA DE CERTIFICACIÓN FORESTAL", "area": "FORESTAL", "email": "iris.chamorro@paracel.com.py", "fecha_ingreso": "2023-03-13", "edicion": "2026"},
  {"cedula": "3569819", "apellidos": "Fretes Martinez", "nombres": "Jose Luis", "nombre_completo": "Jose Luis Fretes Martinez", "genero": "M", "cargo": "ANALISTA ADMNISTRATIVO DE TALENTO HUMANO", "area": "TALENTO HUMANO", "email": "jose.fretes@paracel.com.py", "fecha_ingreso": "2023-04-03", "edicion": "2026"},
  {"cedula": "1316929760", "apellidos": "Koch Martins", "nombres": "Iran", "nombre_completo": "Iran Koch Martins", "genero": "M", "cargo": "ESPECIALISTA EN OPERACIONES FORESTALES", "area": "FORESTAL", "email": "iran.koch@paracel.com.py", "fecha_ingreso": "2023-04-04", "edicion": "2026"},
  {"cedula": "2854902", "apellidos": "Goretta Gunsett", "nombres": "Natalia", "nombre_completo": "Natalia Goretta Gunsett", "genero": "F", "cargo": "ESPECIALISTA EN APLICACIONES CORPORATIVAS", "area": "TI & DIGITAL", "email": "natalia.goretta@paracel.com.py", "fecha_ingreso": "2023-04-17", "edicion": "2026"},
  {"cedula": "1731899", "apellidos": "Caire Britez", "nombres": "Cesar", "nombre_completo": "Cesar Caire Britez", "genero": "M", "cargo": "SUPERVISOR DE SEGURIDAD PATRIMONIAL (FORESTAL)", "area": "TALENTO HUMANO", "email": "cesar.caire@paracel.com.py", "fecha_ingreso": "2023-05-08", "edicion": "2026"},
  {"cedula": "9142251", "apellidos": "Kuchla", "nombres": "Wilian Jose", "nombre_completo": "Wilian Jose Kuchla", "genero": "M", "cargo": "GERENTE DE COSECHA Y DESARROLLO OPERATIVO", "area": "FORESTAL", "email": "wilian.kuchla@paracel.com.py", "fecha_ingreso": "2023-06-01", "edicion": "2026"},
  {"cedula": "4942337", "apellidos": "Fernandez Chamorro", "nombres": "Andres", "nombre_completo": "Andres Fernandez Chamorro", "genero": "M", "cargo": "SUPERVISOR DE PLANIFICACION FORESTAL", "area": "FORESTAL", "email": "andres.fernandez@paracel.com.py", "fecha_ingreso": "2023-06-06", "edicion": "2026"},
  {"cedula": "4994800", "apellidos": "Parra Ruiz Díaz", "nombres": "Andrea Carolina", "nombre_completo": "Andrea Carolina Parra Ruiz Díaz", "genero": "F", "cargo": "ANALISTA DE INFORMACIÓN AMBIENTAL", "area": "AMBIENTAL", "email": "andrea.parra@paracel.com.py", "fecha_ingreso": "2023-06-06", "edicion": "2026"},
  {"cedula": "4419558", "apellidos": "Narvaez Medina", "nombres": "Carolina Belen", "nombre_completo": "Carolina Belen Narvaez Medina", "genero": "F", "cargo": "TÉCNICA SOCIAL DE CAMPO", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "carolina.narvaez@paracel.com.py", "fecha_ingreso": "2023-07-04", "edicion": "2026"},
  {"cedula": "5470403", "apellidos": "Gonzalez Caceres", "nombres": "Eugenio", "nombre_completo": "Eugenio Gonzalez Caceres", "genero": "M", "cargo": "ESPECIALISTA EN SUELOS, NUTRICION Y MANEJO", "area": "FORESTAL", "email": "eugenio.gonzalez@paracel.com.py", "fecha_ingreso": "2023-07-04", "edicion": "2026"},
  {"cedula": "9133273", "apellidos": "Deganutti", "nombres": "Flavio", "nombre_completo": "Flavio Deganutti", "genero": "M", "cargo": "CEO", "area": "CEO", "email": "flavio.deganutti@paracel.com.py", "fecha_ingreso": "2023-07-10", "edicion": "2026"},
  {"cedula": "5285977", "apellidos": "Irala Vera", "nombres": "Patricia Belen", "nombre_completo": "Patricia Belen Irala Vera", "genero": "F", "cargo": "ESPECIALSITA DE CONTABILIDAD", "area": "FINANZAS", "email": "patricia.irala@paracel.com.py", "fecha_ingreso": "2023-07-17", "edicion": "2026"},
  {"cedula": "4425063", "apellidos": "Milillo Marinoni", "nombres": "Lia Fiorella", "nombre_completo": "Lia Fiorella Milillo Marinoni", "genero": "F", "cargo": "ESPECIALISTA EN COMUNICACIÓN", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "lia.milillo@paracel.com.py", "fecha_ingreso": "2023-08-01", "edicion": "2026"},
  {"cedula": "9215687", "apellidos": "Olmedo", "nombres": "Cristian Daniel", "nombre_completo": "Cristian Daniel Olmedo", "genero": "M", "cargo": "SUPERVISOR DE CERTIFICACIÓN FORESTAL", "area": "FORESTAL", "email": "cristian.olmedo@paracel.com.py", "fecha_ingreso": "2023-08-16", "edicion": "2026"},
  {"cedula": "4975591", "apellidos": "Godoy Britez", "nombres": "Sofia", "nombre_completo": "Sofia Godoy Britez", "genero": "F", "cargo": "ANALISTA AMBIENTAL", "area": "AMBIENTAL", "email": "sofia.godoy@paracel.com.py", "fecha_ingreso": "2023-09-04", "edicion": "2026"},
  {"cedula": "5315207", "apellidos": "Martinez Gimenez", "nombres": "Eliana Elizabeth", "nombre_completo": "Eliana Elizabeth Martinez Gimenez", "genero": "F", "cargo": "ANALISTA DE GEOPROCESAMIENTO", "area": "FORESTAL", "email": "eliana.martinez@paracel.com.py", "fecha_ingreso": "2023-09-18", "edicion": "2026"},
  {"cedula": "5445197", "apellidos": "Bogado Paredes", "nombres": "Jose Osmar", "nombre_completo": "Jose Osmar Bogado Paredes", "genero": "M", "cargo": "ESPECIALISTA EN BASIS", "area": "TI & DIGITAL", "email": "jose.bogado@paracel.com.py", "fecha_ingreso": "2023-09-18", "edicion": "2026"},
  {"cedula": "3268941", "apellidos": "Rando Urbieta Amigo", "nombres": "Fernando", "nombre_completo": "Fernando Rando Urbieta Amigo", "genero": "M", "cargo": "GERENTE DE INFRAESTRUCTURA", "area": "TI & DIGITAL", "email": "fernando.rando@paracel.com.py", "fecha_ingreso": "2023-10-02", "edicion": "2026"},
  {"cedula": "4826050", "apellidos": "Valiente", "nombres": "Ever Gustavo", "nombre_completo": "Ever Gustavo Valiente", "genero": "M", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "ever.valiente@paracel.com.py", "fecha_ingreso": "2023-10-09", "edicion": "2026"},
  {"cedula": "5598600", "apellidos": "Moreno", "nombres": "Lia Ramona", "nombre_completo": "Lia Ramona Moreno", "genero": "F", "cargo": "ASISTENTE DE CALIDAD FORESTAL", "area": "FORESTAL", "email": "lia.moreno@paracel.com.py", "fecha_ingreso": "2023-10-09", "edicion": "2026"},
  {"cedula": "9243062", "apellidos": "Fernandes", "nombres": "Hugo", "nombre_completo": "Hugo Fernandes", "genero": "M", "cargo": "DIRECTOR DE LOGISTICA", "area": "LOGISTICA", "email": "hugo.fernandes@paracel.com.py", "fecha_ingreso": "2023-11-06", "edicion": "2026"},
  {"cedula": "4302649", "apellidos": "Medina", "nombres": "Fatima Noelia", "nombre_completo": "Fatima Noelia Medina", "genero": "F", "cargo": "GERENTE DE COMPRAS FORESTALES", "area": "COMPRAS", "email": "fatima.medina@paracel.com.py", "fecha_ingreso": "2023-11-07", "edicion": "2026"},
  {"cedula": "2451140", "apellidos": "Acosta Melgarejo", "nombres": "Rut Elena", "nombre_completo": "Rut Elena Acosta Melgarejo", "genero": "F", "cargo": "ESPECIALISTA EN AUDITORIA", "area": "FINANZAS", "email": "rut.acosta@paracel.com.py", "fecha_ingreso": "2023-12-04", "edicion": "2026"},
  {"cedula": "9269957", "apellidos": "Facioli", "nombres": "Maria Eduarda", "nombre_completo": "Maria Eduarda Facioli", "genero": "F", "cargo": "ESPECIALISTA DE MEJORAMIENTO GENETICO", "area": "FORESTAL", "email": "maria.facioli@paracel.com.py", "fecha_ingreso": "2023-12-05", "edicion": "2026"},
  {"cedula": "4748497", "apellidos": "Pereira", "nombres": "Arnaldo Adrian", "nombre_completo": "Arnaldo Adrian Pereira", "genero": "M", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "arnaldo.pereira@paracel.com.py", "fecha_ingreso": "2024-01-08", "edicion": "2026"},
  {"cedula": "5178482", "apellidos": "Achon", "nombres": "Maria Jose", "nombre_completo": "Maria Jose Achon", "genero": "F", "cargo": "ESPECIALISTA DE ASUNTOS JURIDICOS", "area": "FINANZAS", "email": "maria.achon@paracel.com.py", "fecha_ingreso": "2024-01-08", "edicion": "2026"},
  {"cedula": "4405208", "apellidos": "Villamayor", "nombres": "Ruth María Elena", "nombre_completo": "Ruth María Elena Villamayor", "genero": "F", "cargo": "ESPECIALISTA EN MONITOREO AMBIENTAL", "area": "AMBIENTAL", "email": "ruth.villamayor@paracel.com.py", "fecha_ingreso": "2024-01-08", "edicion": "2026"},
  {"cedula": "4940706", "apellidos": "Lovera", "nombres": "Bruno Maximiliano", "nombre_completo": "Bruno Maximiliano Lovera", "genero": "M", "cargo": "ANALISTA AMBIENTAL", "area": "AMBIENTAL", "email": "bruno.lovera@paracel.com.py", "fecha_ingreso": "2024-01-08", "edicion": "2026"},
  {"cedula": "9149057", "apellidos": "Stein", "nombres": "Fabiano", "nombre_completo": "Fabiano Stein", "genero": "M", "cargo": "DIRECTOR FORESTAL", "area": "FORESTAL", "email": "fabiano.stein@paracel.com.py", "fecha_ingreso": "2024-02-01", "edicion": "2026"},
  {"cedula": "3979513", "apellidos": "Fretes Benitez", "nombres": "Monica Rocio", "nombre_completo": "Monica Rocio Fretes Benitez", "genero": "F", "cargo": "ANALISTA DE ASISTENCIA SOCIAL", "area": "TALENTO HUMANO", "email": "monica.fretes@paracel.com.py", "fecha_ingreso": "2024-02-05", "edicion": "2026"},
  {"cedula": "9269049", "apellidos": "Gavlik", "nombres": "Wevertton", "nombre_completo": "Wevertton Gavlik", "genero": "M", "cargo": "ESPECIALISTA DE DESARROLLO OPERACIONAL", "area": "FORESTAL", "email": "wevertton.gavlik@paracel.com.py", "fecha_ingreso": "2024-02-13", "edicion": "2026"},
  {"cedula": "9269516", "apellidos": "Fonseca Dolacio", "nombres": "Cícero Jorge", "nombre_completo": "Cícero Jorge Fonseca Dolacio", "genero": "M", "cargo": "ESPECIALISTA EN BIOMETRÍA Y PRODUCTIVIDAD", "area": "FORESTAL", "email": "cicero.dolacio@paracel.com.py", "fecha_ingreso": "2024-02-13", "edicion": "2026"},
  {"cedula": "36520989-2", "apellidos": "Giunti Neto", "nombres": "Carmeni Joao", "nombre_completo": "Carmeni Joao Giunti Neto", "genero": "M", "cargo": "GERENTE DE SILVICULTURA", "area": "FORESTAL", "email": "carmeni.giunti@paracel.com.py", "fecha_ingreso": "2024-03-18", "edicion": "2026"},
  {"cedula": "5344966", "apellidos": "Yeza González", "nombres": "Ada Rosa", "nombre_completo": "Ada Rosa Yeza González", "genero": "F", "cargo": "ANALISTA DE FOMENTO FORESTAL", "area": "FORESTAL", "email": "ada.yeza@paracel.com.py", "fecha_ingreso": "2024-04-16", "edicion": "2026"},
  {"cedula": "4805587", "apellidos": "Sanchez Zelaya", "nombres": "Claudia Carolina", "nombre_completo": "Claudia Carolina Sanchez Zelaya", "genero": "F", "cargo": "SUPERVISORA DE EIA & LICENCIAS", "area": "AMBIENTAL", "email": "carolina.sanchez@paracel.com.py", "fecha_ingreso": "2024-04-16", "edicion": "2026"},
  {"cedula": "2657281", "apellidos": "Dure Torres", "nombres": "Laura Ursulina", "nombre_completo": "Laura Ursulina Dure Torres", "genero": "F", "cargo": "GERENTE DE ADMINISTRACION Y CONTABILIDAD", "area": "FINANZAS", "email": "laura.dure@paracel.com.py", "fecha_ingreso": "2024-04-16", "edicion": "2026"},
  {"cedula": "4703816", "apellidos": "Cuandu Zorrilla", "nombres": "Laura Mariela", "nombre_completo": "Laura Mariela Cuandu Zorrilla", "genero": "F", "cargo": "TÉCNICA SOCIAL DE CAMPO", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "laura.cuandu@paracel.com.py", "fecha_ingreso": "2024-04-16", "edicion": "2026"},
  {"cedula": "6928480", "apellidos": "Meza Gimenez", "nombres": "Gregorio", "nombre_completo": "Gregorio Meza Gimenez", "genero": "M", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "gregorio.meza@paracel.com.py", "fecha_ingreso": "2024-04-16", "edicion": "2026"},
  {"cedula": "4692932", "apellidos": "Iriarte Rodas", "nombres": "Leticia Camila", "nombre_completo": "Leticia Camila Iriarte Rodas", "genero": "F", "cargo": "ANALISTA FORESTAL", "area": "FORESTAL", "email": "leticia.iriarte@paracel.com.py", "fecha_ingreso": "2024-05-06", "edicion": "2026"},
  {"cedula": "4423863", "apellidos": "Barrios Gonzalez", "nombres": "Bernardo David", "nombre_completo": "Bernardo David Barrios Gonzalez", "genero": "M", "cargo": "COORDINADOR DE COMPRAS CORPORATIVAS", "area": "COMPRAS", "email": "david.barrios@paracel.com.py", "fecha_ingreso": "2024-05-06", "edicion": "2026"},
  {"cedula": "3647255", "apellidos": "Moreno Mendez", "nombres": "Oscar Ignacio", "nombre_completo": "Oscar Ignacio Moreno Mendez", "genero": "M", "cargo": "ESPECIALISTA DE SOPORTE Y CONTROLES TI", "area": "TI & DIGITAL", "email": "oscar.moreno@paracel.com.py", "fecha_ingreso": "2024-05-16", "edicion": "2026"},
  {"cedula": "4511772", "apellidos": "Gamarra Benitez", "nombres": "Princesa Veridiana", "nombre_completo": "Princesa Veridiana Gamarra Benitez", "genero": "F", "cargo": "ANALISTA DE CONTROL DE COSTOS", "area": "FINANZAS", "email": "princesa.gamarra@paracel.com.py", "fecha_ingreso": "2024-06-03", "edicion": "2026"},
  {"cedula": "3730102", "apellidos": "Cuenca Alarcón", "nombres": "Julio José", "nombre_completo": "Julio José Cuenca Alarcón", "genero": "M", "cargo": "COORDINADOR DE SEGURIDAD CORPORATIVA", "area": "TALENTO HUMANO", "email": "julio.cuenca@paracel.com.py", "fecha_ingreso": "2024-06-17", "edicion": "2026"},
  {"cedula": "6284095", "apellidos": "Samudio", "nombres": "Felicia Salustania", "nombre_completo": "Felicia Salustania Samudio", "genero": "F", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "felicia.samudio@paracel.com.py", "fecha_ingreso": "2024-07-01", "edicion": "2026"},
  {"cedula": "4361292", "apellidos": "Caceres Gomez", "nombres": "Marcelo Gabriel", "nombre_completo": "Marcelo Gabriel Caceres Gomez", "genero": "M", "cargo": "ANALISTA DE COMPRAS", "area": "COMPRAS", "email": "marcelo.caceres@paracel.com.py", "fecha_ingreso": "2024-07-01", "edicion": "2026"},
  {"cedula": "9291521", "apellidos": "Martins Lima", "nombres": "Sara Santos", "nombre_completo": "Sara Santos Martins Lima", "genero": "F", "cargo": "COORDINADORA DE CONTROL Y COSTOS FORESTALES", "area": "FORESTAL", "email": "sara.santos@paracel.com.py", "fecha_ingreso": "2024-07-02", "edicion": "2026"},
  {"cedula": "6028295", "apellidos": "Gayozo Sanchez", "nombres": "Rafael", "nombre_completo": "Rafael Gayozo Sanchez", "genero": "M", "cargo": "ASISTENTE DE INVENTARIO Y CALIDAD FORESTAL", "area": "FORESTAL", "email": "rafael.gayoso@paracel.com.py", "fecha_ingreso": "2024-07-09", "edicion": "2026"},
  {"cedula": "6026596", "apellidos": "Zalazar", "nombres": "José Fernando", "nombre_completo": "José Fernando Zalazar", "genero": "M", "cargo": "ASISTENTE DE INVENTARIO Y CALIDAD FORESTAL", "area": "FORESTAL", "email": "jose.zalazar@paracel.com.py", "fecha_ingreso": "2024-07-09", "edicion": "2026"},
  {"cedula": "7149555", "apellidos": "Centurión Florenciano", "nombres": "Luis Enrique", "nombre_completo": "Luis Enrique Centurión Florenciano", "genero": "M", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "luis.centurion@paracel.com.py", "fecha_ingreso": "2024-08-05", "edicion": "2026"},
  {"cedula": "5425738", "apellidos": "Monges Cañete", "nombres": "Mary Laudelina", "nombre_completo": "Mary Laudelina Monges Cañete", "genero": "F", "cargo": "ESPECIALISTA DE INFRAESTRUCTURA SOCIAL", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "mary.monges@paracel.com.py", "fecha_ingreso": "2024-08-19", "edicion": "2026"},
  {"cedula": "4558930", "apellidos": "Guasp Velazquez", "nombres": "Tanya Elizabeth", "nombre_completo": "Tanya Elizabeth Guasp Velazquez", "genero": "F", "cargo": "ESPECIALISTA EN APLICACIONES CORPORATIVAS", "area": "TI & DIGITAL", "email": "tanya.guasp@paracel.com.py", "fecha_ingreso": "2024-09-02", "edicion": "2026"},
  {"cedula": "2461621", "apellidos": "Ledesma Ovelar", "nombres": "Sandra Patricia", "nombre_completo": "Sandra Patricia Ledesma Ovelar", "genero": "F", "cargo": "COORDINADORA DE IMPUESTOS", "area": "FINANZAS", "email": "sandra.ledesma@paracel.com.py", "fecha_ingreso": "2024-09-02", "edicion": "2026"},
  {"cedula": "7111506", "apellidos": "Aquino Lisboa", "nombres": "Gabriela Maria Celia", "nombre_completo": "Gabriela Maria Celia Aquino Lisboa", "genero": "F", "cargo": "ANALISTA DE COMPRAS CORPORATIVAS", "area": "COMPRAS", "email": "gabriela.aquino@paracel.com.py", "fecha_ingreso": "2024-09-10", "edicion": "2026"},
  {"cedula": "7119011", "apellidos": "Rodriguez Benitez", "nombres": "Liz Noelia", "nombre_completo": "Liz Noelia Rodriguez Benitez", "genero": "F", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "liz.rodriguez@paracel.com.py", "fecha_ingreso": "2024-09-16", "edicion": "2026"},
  {"cedula": "7162229", "apellidos": "Ibarra Gauto", "nombres": "Veronica Cecilia", "nombre_completo": "Veronica Cecilia Ibarra Gauto", "genero": "F", "cargo": "ESPECIALISTA DE COMUNICACIÓN", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "veronica.ibarra@paracel.com.py", "fecha_ingreso": "2024-10-01", "edicion": "2026"},
  {"cedula": "5906437", "apellidos": "Miskinich Riveros", "nombres": "Favio Raul Junior", "nombre_completo": "Favio Raul Junior Miskinich Riveros", "genero": "M", "cargo": "ASISTENTE DE INVENTARIO Y CALIDAD FORESTAL", "area": "FORESTAL", "email": "favio.miskinich@paracel.com.py", "fecha_ingreso": "2024-10-01", "edicion": "2026"},
  {"cedula": "3490793", "apellidos": "Duarte Guillen", "nombres": "Diego Fernando", "nombre_completo": "Diego Fernando Duarte Guillen", "genero": "M", "cargo": "ANALISTA DE CLIMATOLOGÍA", "area": "FORESTAL", "email": "diego.duarte@paracel.com.py", "fecha_ingreso": "2024-11-04", "edicion": "2026"},
  {"cedula": "4989621", "apellidos": "Gusto Cena", "nombres": "María Angela", "nombre_completo": "María Angela Gusto Cena", "genero": "F", "cargo": "ANALISTA DE CERTIFICACION FORESTAL", "area": "FORESTAL", "email": "maria.gusto@paracel.com.py", "fecha_ingreso": "2024-11-12", "edicion": "2026"},
  {"cedula": "4899383", "apellidos": "Fernandez González", "nombres": "Nilsa Rogelia", "nombre_completo": "Nilsa Rogelia Fernandez González", "genero": "F", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "nilsa.fernandez@paracel.com.py", "fecha_ingreso": "2024-11-20", "edicion": "2026"},
  {"cedula": "4429968", "apellidos": "Vazquéz  Martinez", "nombres": "Selena", "nombre_completo": "Selena Vazquéz  Martinez", "genero": "F", "cargo": "ANALISTA DE SERVICIOS DE TALENTO HUMANO", "area": "TALENTO HUMANO", "email": "selena.vazquez@paracel.com.py", "fecha_ingreso": "2024-12-02", "edicion": "2026"},
  {"cedula": "014593321-05", "apellidos": "Assumpção Junior", "nombres": "João", "nombre_completo": "João Assumpção Junior", "genero": "M", "cargo": "COORDINADOR DE SILVICULTURA", "area": "FORESTAL", "email": "joao.assumpcao@paracel.com.py", "fecha_ingreso": "2025-03-11", "edicion": "2026"},
  {"cedula": "0681096454-41", "apellidos": "Lima Santos", "nombres": "Lucas", "nombre_completo": "Lucas Lima Santos", "genero": "M", "cargo": "ASISTENTE ADMINISTRATIVO", "area": "FORESTAL", "email": "lucas.lima@paracel.com.py", "fecha_ingreso": "2025-05-19", "edicion": "2026"},
  {"cedula": "5932391", "apellidos": "Prieto Farias", "nombres": "Idalino Ezequiel", "nombre_completo": "Idalino Ezequiel Prieto Farias", "genero": "M", "cargo": "SUPERVISOR DE SEGURIDAD PATRIMONIAL", "area": "TALENTO HUMANO", "email": "idalino.prieto@paracel.com.py", "fecha_ingreso": "2025-06-09", "edicion": "2026"},
  {"cedula": "4691215", "apellidos": "Ramirez Ozorio", "nombres": "Adriana Elizabeth", "nombre_completo": "Adriana Elizabeth Ramirez Ozorio", "genero": "F", "cargo": "ANALISTA DE GEOPROCESAMIENTO", "area": "FORESTAL", "email": "adriana.ramirez@paracel.com.py", "fecha_ingreso": "2025-06-17", "edicion": "2026"},
  {"cedula": "6612954", "apellidos": "Valiente Garcia", "nombres": "Salma Carolina", "nombre_completo": "Salma Carolina Valiente Garcia", "genero": "F", "cargo": "ANALISTA DE CONTROL Y COSTOS FORESTALES", "area": "FORESTAL", "email": "salma.valiente@paracel.com.py", "fecha_ingreso": "2025-08-04", "edicion": "2026"},
  {"cedula": "5089175", "apellidos": "Rivarola Bobadilla", "nombres": "Ana Belen", "nombre_completo": "Ana Belen Rivarola Bobadilla", "genero": "F", "cargo": "ANALISTA DE DESARROLLO ORGANIZACIONAL Y BIENESTAR", "area": "TALENTO HUMANO", "email": "ana.rivarola@paracel.com.py", "fecha_ingreso": "2025-08-04", "edicion": "2026"},
  {"cedula": "1695267", "apellidos": "Rodriguez Jardim", "nombres": "Willian", "nombre_completo": "Willian Rodriguez Jardim", "genero": "M", "cargo": "GERENTE DE LOGISTICA DE MADERA", "area": "LOGISTICA", "email": "willian.jardim@paracel.com.py", "fecha_ingreso": "2025-08-12", "edicion": "2026"},
  {"cedula": "5065815", "apellidos": "Bruno Torres", "nombres": "Pedro Fabian", "nombre_completo": "Pedro Fabian Bruno Torres", "genero": "M", "cargo": "ASISTENTE ADMINISTRATIVO", "area": "FORESTAL", "email": "pedro.bruno@paracel.com.py", "fecha_ingreso": "2025-09-01", "edicion": "2026"},
  {"cedula": "1823951", "apellidos": "Benitez Ojeda", "nombres": "Cirilo Ramon", "nombre_completo": "Cirilo Ramon Benitez Ojeda", "genero": "M", "cargo": "GERENTE DE SEGURIDAD PATRIMONIAL", "area": "TALENTO HUMANO", "email": "cirilo.benitez@paracel.com.py", "fecha_ingreso": "2025-09-01", "edicion": "2026"},
  {"cedula": "6059573", "apellidos": "Vega Barua", "nombres": "Esteban Rene", "nombre_completo": "Esteban Rene Vega Barua", "genero": "M", "cargo": "ASISTENTE ADMINISTRATIVO", "area": "FORESTAL", "email": "esteban.vega@paracel.com.py", "fecha_ingreso": "2025-09-09", "edicion": "2026"},
  {"cedula": "7070923", "apellidos": "Fernández Ovelar", "nombres": "Luis Armando", "nombre_completo": "Luis Armando Fernández Ovelar", "genero": "M", "cargo": "ASISTENTE FORESTAL", "area": "FORESTAL", "email": "luis.fernandez@paracel.com.py", "fecha_ingreso": "2025-10-06", "edicion": "2026"},
  {"cedula": "5006327", "apellidos": "Cabrera Chamorro", "nombres": "Hugo David", "nombre_completo": "Hugo David Cabrera Chamorro", "genero": "M", "cargo": "ANALISTA DE CONTROL Y COSTOS FORESTALES", "area": "FORESTAL", "email": "hugo.cabrera@paracel.com.py", "fecha_ingreso": "2025-11-10", "edicion": "2026"},
  {"cedula": "5157299", "apellidos": "Gimenez Sosa", "nombres": "Arturo Damian", "nombre_completo": "Arturo Damian Gimenez Sosa", "genero": "M", "cargo": "ANALISTA DE GEOPROCESAMIENTO", "area": "FORESTAL", "email": "arturo.gimenez@paracel.com.py", "fecha_ingreso": "2025-11-17", "edicion": "2026"},
  {"cedula": "5087174", "apellidos": "Rojas Cardozo", "nombres": "Verena Mariel", "nombre_completo": "Verena Mariel Rojas Cardozo", "genero": "F", "cargo": "ASISTENTE ADMINISTRATIVA", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "verena.rojas@paracel.com.py", "fecha_ingreso": "2025-12-09", "edicion": "2026"},
  {"cedula": "4558501", "apellidos": "Carrera Ramirez", "nombres": "Graciela Beatriz", "nombre_completo": "Graciela Beatriz Carrera Ramirez", "genero": "F", "cargo": "ANALISTA ADMINISTRATIVA", "area": "TALENTO HUMANO", "email": "graciela.carrera@paracel.com.py", "fecha_ingreso": "2026-01-19", "edicion": "2026"},
  {"cedula": "4757958", "apellidos": "Cantero Vazquez", "nombres": "Jennifer Elizabeth", "nombre_completo": "Jennifer Elizabeth Cantero Vazquez", "genero": "F", "cargo": "ANALISTA DE COMPRAS FORESTALES", "area": "COMPRAS", "email": "jennifer.cantero@paracel.com.py", "fecha_ingreso": "2026-01-21", "edicion": "2026"},
  {"cedula": "5105418", "apellidos": "Cristaldo Zeballos", "nombres": "Pablo Efraín", "nombre_completo": "Pablo Efraín Cristaldo Zeballos", "genero": "M", "cargo": "OPERADOR DE CONTROL DE MONITOREO", "area": "TALENTO HUMANO", "email": "pablo.cristaldo@paracel.com.py", "fecha_ingreso": "2026-02-02", "edicion": "2026"},
  {"cedula": "6688392", "apellidos": "Aranda Silva", "nombres": "Esteban Daniel", "nombre_completo": "Esteban Daniel Aranda Silva", "genero": "M", "cargo": "OPERADOR DE CONTROL DE MONITOREO", "area": "TALENTO HUMANO", "email": "esteban.aranda@paracel.com.py", "fecha_ingreso": "2026-02-02", "edicion": "2026"},
  {"cedula": "7071798", "apellidos": "Bareiro Montiel", "nombres": "Jose Jaime", "nombre_completo": "Jose Jaime Bareiro Montiel", "genero": "M", "cargo": "OPERADOR DE CONTROL DE MONITOREO", "area": "TALENTO HUMANO", "email": "jose.bareiro@paracel.com.py", "fecha_ingreso": "2026-02-02", "edicion": "2026"},
  {"cedula": "4597138", "apellidos": "Olavarrieta Fretes", "nombres": "Cris Viviana", "nombre_completo": "Cris Viviana Olavarrieta Fretes", "genero": "F", "cargo": "ANALISTA DE COMPRAS CORPORATIVAS", "area": "COMPRAS", "email": "cris.olavarrieta@paracel.com.py", "fecha_ingreso": "2026-02-02", "edicion": "2026"},
  {"cedula": "3704196", "apellidos": "Meza Bogado", "nombres": "Diego Bernardo", "nombre_completo": "Diego Bernardo Meza Bogado", "genero": "M", "cargo": "ESPECIALISTA DE MONITOREO DE IMPACTOS", "area": "SUSTENTABILIDAD SOCIAL & COMUNICACIÓN", "email": "diego.meza@paracel.com.py", "fecha_ingreso": "2026-02-16", "edicion": "2026"},
  {"cedula": "5590392", "apellidos": "Fretes Sanchez", "nombres": "Cesar Rodrigo", "nombre_completo": "Cesar Rodrigo Fretes Sanchez", "genero": "M", "cargo": "ASISTENTE DE ALMACENAMIENTO", "area": "COMPRAS", "email": "cesar.fretes@paracel.com.py", "fecha_ingreso": "2026-03-09", "edicion": "2026"},
  {"cedula": "4817879", "apellidos": "Galeano Rodriguez", "nombres": "Maria Paz", "nombre_completo": "Maria Paz Galeano Rodriguez", "genero": "F", "cargo": "SUPERVISORA DE INVESTIGACION Y DESARROLLO", "area": "FORESTAL", "email": "maria.galeano@paracel.com.py", "fecha_ingreso": "2026-03-09", "edicion": "2026"},
  {"cedula": "5723799", "apellidos": "Talavera Lezcano", "nombres": "Moises Alejandro", "nombre_completo": "Moises Alejandro Talavera Lezcano", "genero": "M", "cargo": "ANALISTA DE CONTABILIDAD", "area": "FINANZAS", "email": "moises.talavera@paracel.com.py", "fecha_ingreso": "2026-04-20", "edicion": "2026"},
];

/* ─── seedNomina ─────────────────────────────────────────────────────────────
   Ejecutar una vez para poblar la hoja NOMINA en el Spreadsheet de backend.
   Idempotente: salta cédulas ya existentes.
──────────────────────────────────────────────────────────────────────────── */
function seedNomina() {
  syncHeaders_(APP_CFG.SHEETS.NOMINA, ['cedula','apellidos','nombres','nombre_completo','genero','cargo','area','email','fecha_ingreso','edicion']);
  var existing = getRowsAsObjects_(APP_CFG.SHEETS.NOMINA);
  var existingCedulas = {};
  existing.forEach(function(r){ existingCedulas[normalizeText_(r.cedula)] = true; });
  var inserted = 0;
  NOMINA_2026_DATA_.forEach(function(c) {
    if (existingCedulas[normalizeText_(c.cedula)]) return;
    appendObjectRow_(APP_CFG.SHEETS.NOMINA, c);
    inserted++;
  });
  Logger.log('seedNomina: ' + inserted + ' registros insertados (' + NOMINA_2026_DATA_.length + ' en fuente).');
  return { ok: true, inserted: inserted };
}

/* ─── lookupByCedula ─────────────────────────────────────────────────────────
   Pública: requiere token de invitación válido (no usado/anulado).
   Devuelve datos de prefill o null si no se encuentra la cédula.
──────────────────────────────────────────────────────────────────────────── */
function lookupByCedula(token, cedula) {
  var inv = getInvitationByToken_(token);
  if (!inv) throw new Error('Token inválido.');
  if (String(inv.estado) === 'Usado')   throw new Error('El enlace ya fue utilizado.');
  if (String(inv.estado) === 'Anulado') throw new Error('El enlace fue anulado.');

  cedula = normalizeText_(cedula);
  if (!cedula) return null;

  var rows = getRowsAsObjects_(APP_CFG.SHEETS.NOMINA);
  for (var i = 0; i < rows.length; i++) {
    if (normalizeText_(rows[i].cedula) === cedula) {
      return buildPrefill_(rows[i]);
    }
  }
  return null;
}

function buildPrefill_(row) {
  var genero = normalizeText_(row.genero).toUpperCase();
  var sexo = genero === 'F' ? 'Femenino' : (genero === 'M' ? 'Masculino' : '');

  var fechaIngreso = normalizeText_(row.fecha_ingreso);
  var antiguedad = '';
  if (fechaIngreso) {
    var y = Number(fechaIngreso.slice(0, 4));
    var m = Number(fechaIngreso.slice(5, 7));
    var now = new Date();
    var diffMonths = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
    if      (diffMonths <  6)  antiguedad = 'Menos de 6 meses';
    else if (diffMonths < 12)  antiguedad = 'De 6 a 12 meses';
    else if (diffMonths < 36)  antiguedad = '1 a 2 años';
    else if (diffMonths < 72)  antiguedad = '3 a 5 años';
    else if (diffMonths < 132) antiguedad = '6 a 10 años';
    else                       antiguedad = 'Más de 10 años';
  }

  return {
    tipo_colaborador:         'Directo',
    nombre_completo:          normalizeText_(row.nombre_completo),
    sexo:                     sexo,
    cargo:                    normalizeText_(row.cargo),
    area_paracel:             normalizeText_(row.area),
    antiguedad_empresa_banda: antiguedad,
    _source: 'nomina'
  };
}

/* ─── listNomina ─────────────────────────────────────────────────────────────
   Admin/viewer: devuelve lista de contactos de la nómina.
──────────────────────────────────────────────────────────────────────────── */
function listNomina(sessionToken) {
  requireRole_(sessionToken, ['admin','viewer']);
  return getRowsAsObjects_(APP_CFG.SHEETS.NOMINA).map(function(r) {
    return {
      cedula:          r.cedula,
      nombre_completo: r.nombre_completo,
      cargo:           r.cargo,
      area:            r.area,
      email:           r.email,
      edicion:         r.edicion
    };
  });
}

/* ─── createInvitationsFromNomina ────────────────────────────────────────────
   Admin: crea invitaciones para contactos de NOMINA.
   data = { edition_id, cedulas?: string[] }
   Si cedulas está vacío, procesa toda la nómina.
   Salta contactos sin email o con invitación ya existente para esa edición.
──────────────────────────────────────────────────────────────────────────── */
function createInvitationsFromNomina(sessionToken, data) {
  var actor = requireRole_(sessionToken, ['admin']);
  var editionId = normalizeText_(data && data.edition_id) || activeEdition_();
  var selectedCedulas = (data && Array.isArray(data.cedulas) && data.cedulas.length)
    ? data.cedulas.map(normalizeText_) : null;

  var contacts = getRowsAsObjects_(APP_CFG.SHEETS.NOMINA);
  if (selectedCedulas) {
    contacts = contacts.filter(function(c) {
      return selectedCedulas.indexOf(normalizeText_(c.cedula)) > -1;
    });
  }

  var existingInvs = getRowsAsObjects_(APP_CFG.SHEETS.INVITATIONS);
  var existingEmails = {};
  existingInvs.forEach(function(inv) {
    if (normalizeText_(inv.edition_id) === normalizeText_(editionId)) {
      existingEmails[normalizeText_(inv.email)] = true;
    }
  });

  var created = [];
  var skipped = 0;
  contacts.forEach(function(c) {
    var email = normalizeText_(c.email).toLowerCase();
    if (!email)               { skipped++; return; }
    if (existingEmails[email]){ skipped++; return; }

    var token = sha256Hex_(email + '|' + editionId + '|' + uuid_()).slice(0, 32);
    var url   = getBaseUrl_() ? (getBaseUrl_() + '?token=' + encodeURIComponent(token)) : '';
    var row   = {
      token:               token,
      edition_id:          editionId,
      email:               email,
      nombre_destinatario: normalizeText_(c.nombre_completo),
      cedula:              normalizeText_(c.cedula),
      tipo_acceso:         'respondent',
      estado:              'Generado',
      url_encuesta:        url,
      sent_at:             '',
      opened_at:           '',
      used_at:             '',
      notes:               'Nómina ' + normalizeText_(c.edicion)
    };
    row.__rowNum = appendObjectRow_(APP_CFG.SHEETS.INVITATIONS, row);
    existingEmails[email] = true;
    created.push(row);
  });

  auditLog_(actor.username, actor.role, 'create_invitations_from_nomina', 'invitation', editionId,
    { created: created.length, skipped: skipped });
  return { ok: true, created: created.length, skipped: skipped };
}

/* ─── sendInvitationsFromNomina ──────────────────────────────────────────────
   Admin: crea Y envía correos a los contactos de NOMINA.
──────────────────────────────────────────────────────────────────────────── */
function sendInvitationsFromNomina(sessionToken, data) {
  var actor = requireRole_(sessionToken, ['admin']);
  var createResult = createInvitationsFromNomina(sessionToken, data);
  var editionId = normalizeText_(data && data.edition_id) || activeEdition_();

  var invs = getRowsAsObjects_(APP_CFG.SHEETS.INVITATIONS);
  var toSend = invs.filter(function(inv) {
    return normalizeText_(inv.edition_id) === normalizeText_(editionId) &&
           normalizeText_(inv.estado) === 'generado' &&
           normalizeText_(inv.notes).indexOf('nomina') > -1;
  });

  var ts   = nowIso_();
  var sent = 0;
  toSend.forEach(function(inv) {
    if (!inv.email) return;
    var nombre  = inv.nombre_destinatario || 'colaborador/a';
    var subject = '[' + APP_CFG.ORG_NAME + '] Encuesta de colaboradores ' + inv.edition_id;
    var body    = 'Estimado/a ' + nombre + ',\n\n' +
      'Le invitamos a completar la encuesta anual de colaboradores ' + inv.edition_id + '.\n' +
      'Acceda a su enlace único:\n\n' +
      (inv.url_encuesta || '(URL no disponible)') + '\n\n' +
      'Al ingresar su cédula en el formulario, sus datos laborales se completarán automáticamente.\n\n' +
      'Este enlace es personal e intransferible.\n\n' +
      'Gracias,\nEquipo de Talento Humano — Paracel S.A.';
    try {
      MailApp.sendEmail(inv.email, subject, body);
      inv.sent_at = ts;
      inv.estado  = 'Enviado';
      updateRowByNumber_(APP_CFG.SHEETS.INVITATIONS, inv.__rowNum, inv);
      sent++;
    } catch(e) {
      auditLog_('system','system','send_email_error','invitation', inv.token,
        { email: inv.email, error: String(e.message) });
    }
  });

  auditLog_(actor.username, actor.role, 'send_invitations_from_nomina', 'invitation', editionId,
    { sent: sent });
  return { ok: true, created: createResult.created, skipped: createResult.skipped, sent: sent };
}
