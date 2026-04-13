# Encuesta de Colaboradores Paracel — Proceso completo y resultados

**Proyecto:** Monitor de Impacto Social · Paracel S.A.  
**Período de implementación:** Abril 2026  
**Repositorio:** https://github.com/monitorimpactosocial/encuesta_colaboradores  
**Spreadsheet backend:** `1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c`

---

## 1. Contexto y objetivo

Paracel S.A. realiza una encuesta anual de caracterización sociodemográfica a sus colaboradores directos e indirectos (contratistas). La encuesta se venía realizando en papel o planillas Excel, con registros históricos de 2024 y 2025 sin sistematizar.

El objetivo del proyecto fue:

1. **Limpiar y armonizar** los datos históricos 2025 (987 registros en Excel).
2. **Diseñar e implementar** una aplicación web completa para capturar respuestas 2026 y administrar todo el ciclo de la encuesta.
3. **Publicar la aplicación** en Google Apps Script, con Google Sheets como base de datos, y el código fuente en GitHub.

---

## 2. Datos fuente: diagnóstico del Excel 2025

### Archivo original

| Atributo | Detalle |
|----------|---------|
| Archivo | `Encuestas logradas a Colaboradores Paracel 2025.xlsx` |
| Hoja principal | `Descarga` |
| Dimensiones | 988 filas × 191 columnas (incluyendo cabecera) |
| Registros efectivos | 987 respondentes |
| Columnas con datos | 36 de 191 (las restantes 155 estaban vacías) |

### Problemas encontrados por campo

#### Columnas vacías (0% de datos)
Las 155 columnas vacías representaban campos no capturados en la fase de recolección de datos de campo: `estado_civil`, `nivel_educativo`, `tipo_vivienda`, `n_hijos`, entre otras. Se confirmó que la ausencia era real (no un error de codificación) y se descartaron del dataset limpio.

#### Empresa contratista — 81 variantes de escritura
El campo más problemático. Los encuestadores registraban el nombre de cada empresa de forma libre, produciendo decenas de variantes para una misma entidad. Ejemplos:

| Variantes encontradas | Forma canónica |
|-----------------------|----------------|
| `JM CONSTRUCTORA`, `JM CONSTRUCCIONES`, `CONSTRUCTORA JM INGENIERIA`, `CONSTRUCTORA JM KUROSU & CIA S A` | `CONSTRUCTORA JM` |
| `RANCHO FORESTA`, `RANCHO FORERSTAL`, `RANCHO FOTESTAL` | `RANCHO FORESTAL` |
| `PROSEGUR SECURITY`, `PROSEGUR PARAGUAY` | `PROSEGUR` |
| `PLAN SUR`, `PLANSUR` | `PLANSUR` |
| `OAC MAQUINARIA`, `OAC MAQUINARIAS` | `OAC MAQUINARIAS` |

Se construyó un diccionario de normalización cubriendo las ~81 variantes identificadas, reduciendo a ~60 entidades canónicas.

#### Otros problemas de calidad

| Campo | Problema | Solución |
|-------|----------|----------|
| `tipo_colaborador` | `Directo (nómina Paracel)` vs `Directo` | Normalizar a `Directo` / `Indirecto` |
| `sexo` | `masculino`, `Masculino`, `MASCULINO` | Title Case estricto |
| `cargo` | mezcla de mayúsculas, abreviaturas, acentuación | Title Case + consolidación de variantes |
| `comunidad_indigena` | `si`, `sí`, `Si`, `yes`, `No`, `no` | → `Sí` / `No` canónico |
| `cedula` | guardado como float (ej. `4521830.0`) | → string entero sin decimales |
| `fecha_encuesta` | datetime con hora (`2025-03-15 00:00:00`) | → `YYYY-MM-DD` ISO 8601 |
| `edad` | valores negativos, valores > 80 | flags de calidad automáticos |
| `departamento_procedencia` | `Pdte. Hayes`, `Pdte.Hayes`, `Presidente Hayes` | diccionario de canonicalización |
| `distrito_procedencia` | `Asotey`, `Azotey` (mismo lugar) | diccionario de equivalencias |

### Dataset resultante

| Atributo | Detalle |
|----------|---------|
| Archivo | `data/ENCUESTA_COLABORADORES_LIMPIA_2025.csv` |
| Registros | 987 |
| Columnas | 31 (selección de las 36 con datos, normalizadas) |
| Formato | CSV UTF-8, fechas ISO 8601, cédulas como string |

---

## 3. Decisión de arquitectura: Google Apps Script

La alternativa inicial era una aplicación estática en GitHub Pages (HTML + CSS + JS + Chart.js), con datos publicados como CSV desde Google Sheets.

Esa versión fue descartada por las siguientes limitaciones:

| Limitación | Consecuencia |
|------------|-------------|
| Sin autenticación server-side | Cualquier persona con la URL accedía a los datos |
| Sin control de acceso por token | No es posible enviar un enlace único por respondente |
| Sin escritura al servidor | No se pueden recibir respuestas 2026 |
| Sin lógica de negocio | Validaciones y flags de calidad imposibles de garantizar |
| Sin auditoría | No hay trazabilidad de quién hizo qué y cuándo |

La arquitectura final implementa:

- **HtmlService** de Google Apps Script como servidor web
- **Google Sheets** como base de datos relacional ligera (10 hojas)
- **PropertiesService** para secretos y sesiones de usuario
- **MailApp** para el envío de correos con tokens únicos
- **SHA-256** (`Utilities.computeDigest`) para hashing de contraseñas y tokens

---

## 4. Arquitectura de la aplicación

### 4.1 Diagrama general

```
BROWSER                          APPS SCRIPT                     GOOGLE SHEETS
──────────────────────────────────────────────────────────────────────────────
Usuario admin/visor
  │
  ├─ login(user, pwd) ─────────► Auth.gs
  │                               └─ sha256(user|pwd)
  │                               └─ compara USUARIOS
  │                               └─ crea session_TOKEN en PropertiesService
  │◄─ {token, user} ──────────────────────────────────────────────────────────
  │
  ├─ getBootstrap(token) ──────► Admin.gs
  │◄─ {user, edition, config} ─
  │
  ├─ getDashboardSummary(token) ► Admin.gs
  │                               └─ lee BASE_ANALITICA (todos los registros)
  │                               └─ agrega: tipo, sexo, IPS, depts, salario...
  │◄─ {total, kpis, charts...} ─
  │
Respondente (enlace con token)
  │
  ├─ getSurveySchema(token) ───► Survey.gs
  │                               └─ valida token en INVITACIONES
  │                               └─ lee CUESTIONARIO (metadatos)
  │◄─ {sections, questions} ───
  │
  ├─ submitSurvey(token, data) ► Survey.gs
  │                               └─ valida token y campos obligatorios
  │                               └─ buildResponseRow_() → 11 quality flags
  │                               └─ append a RESPUESTAS
  │                               └─ marca token como "Usado"
  │                               └─ rebuildAnalytics() → BASE_ANALITICA + LONG
  │◄─ {ok, responseId} ────────
```

### 4.2 Hojas del Spreadsheet

| Hoja | Rol | Escritura | Lectura |
|------|-----|-----------|---------|
| `CONFIG` | Parámetros clave-valor (edición activa, nombre, etc.) | Admin | Bootstrap |
| `EDICIONES` | Control de años: 2024, 2025, 2026 y su estado | Admin | Bootstrap, survey |
| `USUARIOS` | Credenciales con hash SHA-256 | Admin | Auth |
| `CUESTIONARIO` | Definición de secciones y preguntas (metadatos) | Admin | Encuesta |
| `CATALOGOS` | Listas de opciones para análisis | Admin | Encuesta |
| `RESPUESTAS` | Base operativa wide (incluye PII) | Survey | Rebuild |
| `BASE_ANALITICA` | Copia sin PII de RESPUESTAS | Rebuild | Dashboard |
| `RESPUESTAS_LONG` | Formato long para Looker Studio | Rebuild | Externo |
| `INVITACIONES` | Tokens únicos por respondente y edición | Admin | Auth, survey |
| `AUDITORIA` | Log de todos los eventos del sistema | Automático | — |

---

## 5. Módulos del servidor (archivos .gs)

### Config.gs — Constantes globales

Define el objeto `APP_CFG` con:
- Nombres de todas las hojas (`SHEETS`)
- Horas de expiración de sesión (12 h) y de tokens de invitación (720 h = 30 días)
- Lista de campos PII excluidos de la base analítica
- Lista de campos `LONG_FIELDS` para el formato long

```javascript
var APP_CFG = {
  SHEETS: { CONFIG: 'CONFIG', USERS: 'USUARIOS', ... },
  SESSION_HOURS: 12,
  TOKEN_HOURS: 720,
  PII_FIELDS: ['nombre_completo', 'nombre_completo_raw', 'cedula', 'cedula_raw'],
  LONG_FIELDS: ['tipo_colaborador', 'sexo', 'edad', 'departamento_residencia', ...]
};
```

### Auth.gs — Autenticación

**`login(username, password)`**
1. Normaliza el nombre de usuario (minúsculas, sin espacios)
2. Busca el registro en la hoja USUARIOS
3. Computa `SHA-256(username + '|' + password)`
4. Compara con `password_hash` almacenado
5. Si coincide: genera un UUID como token de sesión, lo guarda en `PropertiesService` con timestamp de expiración, y devuelve `{token, user}`

**`validateSession_(token)`**
- Lee `session_{TOKEN}` de PropertiesService
- Verifica que no haya expirado (12 horas)
- Devuelve los datos del usuario

**`logout(token)`**
- Elimina la propiedad de sesión de PropertiesService
- Registra evento en AUDITORIA

### Utils.gs — Utilidades compartidas

| Función | Propósito |
|---------|-----------|
| `sha256Hex_(text)` | Hash SHA-256 en hexadecimal vía `Utilities.computeDigest` |
| `uuid_()` | UUID v4 vía `Utilities.getUuid()` |
| `normalizeText_(v)` | Trim + toLowerCase para comparaciones |
| `properCase_(v)` | Title Case con soporte de acentos |
| `upperKey_(v)` | UPPERCASE sin acentos para llaves de diccionario |
| `cleanIdNumber_(v)` | Elimina todo excepto dígitos (cédulas) |
| `respondentHash_(cedula)` | SHA-256(cédula), primeros 16 chars → ID anónimo |
| `getRowsAsObjects_(sheet)` | Convierte rango de Sheets en array de objetos `{header: value}` |
| `appendObjectRow_(sheet, obj)` | Agrega fila según objeto (alinea con cabecera) |
| `updateRowByNumber_(sheet, row, obj)` | Actualiza fila por número (usa `__rowNum`) |
| `ensureHeaders_(sheet, headers)` | Crea hoja si no existe y escribe cabecera |
| `auditLog_(actor, role, action, ...)` | Escribe evento en hoja AUDITORIA |
| `requireRole_(token, roles)` | Valida sesión + rol; lanza error si no autorizado |
| `activeEdition_()` | Retorna el `edition_id` de la edición con estado `Abierta` |

### Setup.gs — Inicialización del backend

**`runSetup()`** ← función sin argumentos para ejecutar desde el editor GAS
- Llama a `setupBackend("1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c")`
- Llama a `seedAll()` para poblar datos iniciales

**`setupBackend(spreadsheetId)`**
- Guarda el ID en `PropertiesService` (persistente entre ejecuciones)
- Llama `ensureHeaders_()` para las 10 hojas con todas sus columnas
- Llama `hashSeedUsers_()` para convertir contraseñas temporales en hashes

**`hashSeedUsers_()`**
- Lee todos los usuarios de la hoja USUARIOS
- Para cada usuario con `password_temporal` pero sin `password_hash`:
  - Calcula `SHA-256(username + '|' + password_temporal)`
  - Escribe el hash en `password_hash`
  - Borra `password_temporal`

### SeedCuestionario.gs — Datos iniciales

Provee `seedAll()` que ejecuta en orden:

1. **`seedConfig()`** — 6 pares clave-valor en CONFIG
2. **`seedEditions()`** — ediciones 2024 (cerrada), 2025 (cerrada), 2026 (abierta)
3. **`seedUsers()`** — usuarios `diego/456` (admin) y `user/123` (viewer) con contraseña temporal
4. **`seedQuestionnaire()`** — 26 preguntas en 8 secciones con `options_json`, `visible_if`, flags `pii` y `analytics`
5. **`seedCatalogs()`** — 19 departamentos, 12 bandas salariales, combustibles, tipos, sexos

Todas las funciones son idempotentes: verifican si el registro ya existe antes de insertar.

### Survey.gs — Lógica de la encuesta

**`getSurveySchema(token)`**
1. Valida el token de invitación en la hoja INVITACIONES
2. Lee la hoja CUESTIONARIO y la convierte en estructura de secciones/preguntas
3. Lee CATALOGOS para opciones adicionales
4. Devuelve `{editionId, invitation, sections, catalogs}`

**`submitSurvey(token, payload)`**
1. Valida token (no usado, no anulado)
2. Valida campos obligatorios contra el schema del cuestionario
3. Llama `buildResponseRow_()` para construir la fila completa
4. Agrega la fila a RESPUESTAS
5. Marca el token como "Usado" con timestamp
6. Llama `rebuildAnalytics()` para actualizar BASE_ANALITICA y RESPUESTAS_LONG
7. Registra evento en AUDITORIA

**`buildResponseRow_()` — 11 flags de calidad automáticos**

| Flag | Condición de activación |
|------|------------------------|
| `flag_obs` | Observación manual marcada |
| `flag_fecha_capturada_corrigida` | Fecha del payload difiere de la del servidor |
| `flag_edad_corregida_signo` | Edad ingresada como número negativo |
| `flag_edad_fuera_rango` | Edad < 15 o > 80 |
| `flag_duracion_atipica` | Tiempo de llenado < 2 min o > 180 min |
| `flag_falta_area_indirecto` | Tipo = Indirecto pero sin área informada |
| `flag_falta_empresa_indirecto` | Tipo = Indirecto pero sin empresa informada |
| `flag_directo_con_campos_indirectos` | Tipo = Directo pero con área/empresa de indirecto |
| `flag_pais_origen_inconsistente` | Dpto. ≠ "Otro país" pero se informó país de origen |
| `flag_etnia_inconsistente` | No pertenece a comunidad indígena pero informó etnia |
| `flag_salario_actual_faltante` | Campo de salario actual vacío |

**Estado de calidad:**
- `OK` → 0 flags activos
- `Revisar` → 1 o 2 flags activos
- `Crítico` → 3 o más flags activos

**Canonicalización de valores:**
Cada campo pasa por una función de estandarización antes de guardarse:

| Función | Aplica a |
|---------|----------|
| `canonicalSexo_()` | Normaliza a `Masculino` / `Femenino` |
| `canonicalArea_()` | Normaliza a `Forestal` / `Industrial` |
| `canonicalYesNo_()` | Normaliza a `Sí` / `No` |
| `canonicalDept_()` | 19 departamentos de Paraguay + "Otro país" |
| `canonicalDistrict_()` | Distritos con variantes ortográficas |
| `canonicalSalary_()` | 12 bandas salariales canónicas |
| `canonicalCompany_()` | Empresas contratistas (normalización por reglas) |
| `canonicalFuel_()` | Combustibles de cocina |

### Admin.gs — Panel de administración

**`getBootstrap(sessionToken)`** — carga rápida inicial
- Valida la sesión
- Retorna: appName, orgName, usuario, edición activa, config
- **No carga estadísticas** (separado para evitar latencia en el login)

**`getDashboardSummary(sessionToken)`** — métricas del tablero
Lee `BASE_ANALITICA` una sola vez y computa en memoria:

| Métrica | Cálculo |
|---------|---------|
| `total` | count(rows) |
| `directos` / `indirectos` | filter por tipo_colaborador |
| `conIpsPct` | % con descuento_ips_actual = "Sí" |
| `edadProm` | promedio de edad, excluyendo outliers (<15, >80) |
| `porEdicion` | countBy edicion, ordenado cronológico |
| `porTipo` | countBy tipo_colaborador |
| `porSexo` | countBy sexo |
| `porAreaIndirecto` | countBy sobre subconjunto de indirectos |
| `porDeptResidencia` | countBy + sort desc + slice(15) |
| `porIpsActual` | countBy descuento_ips_actual |
| `porSalario` | countBy + orden lógico de bandas |
| `porGrupoEdad` | countBy edad_grupo + orden 18-24 … 65+ |
| `porEstadoCalidad` | countBy estado_calidad |

**Otras funciones de Admin.gs:**

| Función | Descripción |
|---------|-------------|
| `listResponses(token, limit)` | Últimos N registros de BASE_ANALITICA, sin PII |
| `listUsers / saveUser` | CRUD de usuarios con hashing automático de contraseña |
| `listEditions / saveEdition` | CRUD de ediciones; al abrir una edición actualiza CONFIG |
| `listInvitations` | Lista todos los tokens con estado |
| `createInvitations` | Genera tokens SHA-256 únicos y URLs de encuesta |
| `sendInvitations` | Crea tokens + envía correo con MailApp |
| `updateConfig` | Upsert de pares clave-valor en CONFIG |
| `rebuildAnalytics` | Reconstruye BASE_ANALITICA (sin PII) y RESPUESTAS_LONG (formato long) |

---

## 6. Frontend SPA (Client.html)

La interfaz es una **Single Page Application** en JavaScript puro, sin frameworks. Usa `google.script.run` para llamar funciones del servidor.

### Flujo de navegación

```
doGet(e)
  │
  ├─ ?token=XXX  →  Survey flow
  │                  markInvitationOpened()
  │                  getSurveySchema()
  │                  renderSurvey()
  │
  └─ sin token   →  Panel flow
                     localStorage['session'] ?
                       Sí → getBootstrap() → renderPanel()
                       No → renderLogin()
```

### Función `call()` — wrapper de google.script.run

```javascript
function call(name, ...args){
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [name](...args);
  });
}
```

Convierte la API de callbacks de GAS en Promises, permitiendo `async/await` en todo el frontend.

### Cache de estadísticas

```javascript
const state = { statsCache: null, ... };

async function renderDashboard(view){
  if(!state.statsCache){
    state.statsCache = await call('getDashboardSummary', state.sessionToken);
  }
  // usa state.statsCache sin nueva llamada al servidor
}
```

Resultado: la primera visita al dashboard carga stats del servidor; re-visitar el tab es instantáneo.

### Skeleton loading

Mientras se cargan las estadísticas, se muestra un skeleton animado:

```css
.skel {
  background: linear-gradient(90deg, #e2eeec 25%, #cee4e0 50%, #e2eeec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.3s infinite;
}
```

### Flujo de la encuesta (respondente)

1. El respondente recibe un correo con `?token=XXXXXXXXXX`
2. `markInvitationOpened()` registra la apertura del enlace
3. `getSurveySchema()` carga las preguntas del CUESTIONARIO
4. El formulario se renderiza sección por sección
5. Cada cambio guarda un borrador en `localStorage` (autoguardado)
6. Las reglas `visible_if` se evalúan en tiempo real (`campo=valor`)
7. Al enviar: `submitSurvey()` valida en el servidor y bloquea el token

### Visibilidad condicional

```javascript
function evalVis(rule, values){
  if(!rule) return true;
  const [field, val] = rule.split('=');
  return String(values[field] || '') === val;
}
```

Ejemplos de reglas usadas:
- `tipo_colaborador=Indirecto` → muestra campos de área y empresa contratista
- `departamento_procedencia=Otro país` → muestra campo de país de origen
- `pertenece_comunidad_indigena=Sí` → muestra campo de etnia
- `combustible_cocina=Otro` → muestra campo libre de combustible
- `trabajaba_antes_paracel=Sí` → muestra salario y descuento IPS anterior

---

## 7. Dashboard — Diseño y gráficos

### Problema de rendimiento resuelto

| Antes | Después |
|-------|---------|
| `getBootstrap()` incluía todas las estadísticas | `getBootstrap()` solo devuelve usuario/config/edición |
| Panel bloqueado hasta que terminaba de contar ~1000 filas | Panel aparece en 1-2 segundos |
| Cambiar de tab re-renderizaba todo el panel (topbar incluido) | Tab click solo actualiza `#view` |
| Sin cache: cada visita al dashboard relanzaba la consulta | `state.statsCache` evita consultas repetidas |

### Métricas principales (KPI cards)

Cinco tarjetas con gradientes de color, cada una con su ícono:

| Card | Color | Valor |
|------|-------|-------|
| Total registros | Verde teal | `s.total` |
| Colaboradores directos | Índigo | `s.directos` |
| Colaboradores indirectos | Ámbar | `s.indirectos` |
| Cobertura IPS | Esmeralda | `s.conIpsPct` % |
| Edad promedio | Rosa | `s.edadProm` años |

### Gráficos con Chart.js 4.4.4

Chart.js se carga desde CDN al iniciar la página (`Index.html`), para que esté disponible cuando el dashboard renderice:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
```

#### Fila 1 — Tres donuts

| Gráfico | Variable | Colores |
|---------|----------|---------|
| Tipo de colaborador | `porTipo` | Teal / Índigo |
| Sexo | `porSexo` | Azul / Rosa |
| Cobertura IPS | `porIpsActual` | Esmeralda / Rojo |

Configuración clave:
- `cutout: '70%'` — anillo fino y elegante
- Tooltips con valor absoluto y porcentaje calculado en el cliente
- Leyenda debajo en tipografía pequeña

#### Fila 2 — Dos barras horizontales grandes

**Departamento de residencia**
- Top 15 departamentos ordenados por conteo descendente
- Gradiente de color teal de mayor a menor (`hsl(173..163, 79..63%, 38..48%)`)

**Salario actual**
- 12 bandas salariales en orden lógico (de menor a mayor)
- Etiquetas abreviadas para caber en el eje Y:
  - `"Más del salario mínimo y hasta 3 millones"` → `"Sal. mín. – 3M"`
  - `"Más de 3 millones y hasta 5 millones"` → `"3M – 5M"`
- Gradiente ámbar ascendente

#### Fila 3 — Dos gráficos de contexto

**Respuestas por edición** (barras verticales)
- Una barra por año: 2024, 2025, 2026
- Permite ver la evolución histórica de participación

**Grupo etario** (barras horizontales)
- Grupos: 18-24, 25-34, 35-44, 45-54, 55-64, 65+
- Ordenados cronológicamente

#### Destrucción y recreación de instancias

Cada instancia de Chart.js se registra en `CHARTS[id]`. Al cambiar de tab se destruyen todas:

```javascript
Object.keys(CHARTS).forEach(k => destroyChart(k));
```

Esto evita el error `"Canvas is already in use"` al volver al dashboard.

---

## 8. Gestión de invitaciones y tokens

### Generación del token

```javascript
var token = sha256Hex_(email + '|' + editionId + '|' + uuid_()).slice(0, 32);
```

- El token es SHA-256 de `email|edición|UUID` aleatorio, truncado a 32 caracteres
- Combina el correo, la edición y un UUID para garantizar unicidad
- Se almacena en la hoja INVITACIONES con su URL completa

### URL de encuesta

```
https://script.google.com/.../exec?token=a3f2b19e...
```

El parámetro `token` es leído por `App.gs → doGet(e)` y pasado al frontend via `serverContext`.

### Estados del ciclo de vida de una invitación

```
Generado → Enviado → Abierto → Usado
                              → Anulado (cancelación manual)
```

### Envío masivo con MailApp

```javascript
MailApp.sendEmail(email, subject, body);
```

- Límite de GAS: ~100 correos por día con cuenta Gmail, ~1500 con Workspace
- El campo `CONFIG.max_invites_per_batch` controla el límite por ejecución

---

## 9. Seguridad del sistema

| Mecanismo | Implementación |
|-----------|----------------|
| Hash de contraseñas | `SHA-256(username + '\|' + password)` vía `Utilities.computeDigest` |
| Sesiones de usuario | UUID aleatorio almacenado en PropertiesService con timestamp de expiración |
| Expiración de sesión | 12 horas desde el último login |
| Tokens de encuesta | SHA-256 de 32 chars, único por respondente × edición × UUID |
| Un uso por token | Estado `Usado` en INVITACIONES bloquea reenvío en `submitSurvey` |
| Control de rol | `requireRole_(token, ['admin'])` en cada función del servidor |
| Separación de PII | BASE_ANALITICA excluye `nombre_completo`, `cedula` y sus variantes raw |
| Anonimización | `respondente_id = SHA-256(cedula)[0:16]` — no reversible sin la cédula original |
| Auditoría | Cada acción (login, submit, admin) queda registrada en AUDITORIA |

---

## 10. Despliegue: paso a paso

### Requisitos previos

- Cuenta Google con acceso a Google Sheets y Apps Script
- Node.js instalado (para clasp)
- Repositorio clonado localmente

### Paso 1 — Instalar y autenticar clasp

```bash
npm install -g @google/clasp
clasp login
```

### Paso 2 — Configurar el proyecto

Copiar `.clasp.example.json` como `.clasp.json` y completar el `scriptId`:

```json
{
  "scriptId": "19QDNYXi5Kn_ZRjrROFIvkP6nqvlGkW3O8ZRRs7DM6W-MUwzfBHZh6lCO",
  "rootDir": "."
}
```

### Paso 3 — Subir el código al proyecto Apps Script

```bash
cd /ruta/a/encuesta_colaboradores
clasp push --force
```

### Paso 4 — Inicializar el backend

En el editor de Apps Script ([abrir aquí](https://script.google.com/u/0/home/projects/19QDNYXi5Kn_ZRjrROFIvkP6nqvlGkW3O8ZRRs7DM6W-MUwzfBHZh6lCO/edit)):

1. Seleccionar la función `runSetup` en el menú desplegable
2. Hacer clic en **▶ Ejecutar**
3. Aceptar los permisos solicitados (Sheets, Gmail)

Esto ejecuta en cadena:
- `setupBackend()` → crea 10 hojas con cabeceras
- `seedAll()` → carga cuestionario, catálogos, ediciones, usuarios
- `hashSeedUsers_()` → hashea contraseñas iniciales

### Paso 5 — Desplegar como Web App

1. **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Ejecutar como: **Yo (mi cuenta Google)**
4. Quién tiene acceso: **Cualquier usuario**
5. Copiar la URL generada (formato: `https://script.google.com/.../exec`)

### Paso 6 — Importar datos históricos 2025

1. En el Spreadsheet, ir a la hoja `RESPUESTAS`
2. **Archivo → Importar** → subir `data/ENCUESTA_COLABORADORES_LIMPIA_2025.csv`
3. Configurar: separador coma, no reemplazar hoja, agregar al final
4. Desde el panel admin → **↻ Recalcular base analítica**

---

## 11. Estructura final del repositorio

```
encuesta_colaboradores/
├── appsscript.json          # Manifiesto GAS (zona horaria, permisos, V8)
│
├── App.gs                   # doGet(): punto de entrada de la web app
├── Auth.gs                  # Login, sesiones, logout, validación de token
├── Config.gs                # APP_CFG: constantes, acceso al Spreadsheet
├── Utils.gs                 # UUID, SHA-256, normalización, CRUD genérico, auditoría
├── Setup.gs                 # setupBackend() + runSetup() (sin argumentos)
├── SeedCuestionario.gs      # seedAll(): datos iniciales de todas las hojas
├── Admin.gs                 # Dashboard, respuestas, usuarios, invitaciones, config
├── Survey.gs                # Schema, submit, flags de calidad, canonicalización
│
├── Index.html               # Plantilla GAS: incluye Styles + Chart.js + Client
├── Styles.html              # CSS completo: tokens, cards, charts, skeleton, responsive
├── Client.html              # SPA JavaScript: login, panel, dashboard, encuesta
│
├── .clasp.example.json      # Plantilla de configuración clasp
├── .gitignore               # Excluye .clasp.json, .clasprc.json, *.xlsx, CSV
│
├── data/
│   └── ENCUESTA_COLABORADORES_LIMPIA_2025.csv   # 987 registros (excluido del repo)
│
└── docs/
    ├── arquitectura.md               # Descripción técnica de la arquitectura
    └── proceso_y_resultados.md       # Este documento
```

---

## 12. Credenciales iniciales y cambio recomendado

| Usuario | Contraseña | Rol | Permisos |
|---------|-----------|-----|----------|
| `diego` | `456` | admin | Lectura + escritura + administración |
| `user`  | `123` | viewer | Solo lectura (dashboard y respuestas) |

> **Recomendación:** Cambiar ambas contraseñas desde el panel **Usuarios** después del primer acceso. El hash se recalcula automáticamente al guardar el nuevo valor.

---

## 13. Resultados

### Métricas del dataset 2025

| Indicador | Valor |
|-----------|-------|
| Total de registros | 987 |
| Columnas originales | 191 |
| Columnas con datos | 36 |
| Columnas en dataset limpio | 31 |
| Variantes de empresa normalizadas | ~81 → ~60 |
| Registros con cédula válida | ~95% |
| Registros con edad en rango (15-80) | ~97% |

### Funcionalidades entregadas

| Módulo | Funcionalidades |
|--------|----------------|
| **Autenticación** | Login SHA-256, sesión 12h, logout, roles admin/viewer |
| **Dashboard** | 5 KPIs, 3 donuts, 2 barras grandes, 2 barras contextuales, skeleton, cache |
| **Respuestas** | Tabla anonimizada últimos 200, badges de calidad, salarios abreviados |
| **Invitaciones** | Generación de tokens, envío masivo por correo, historial con estados |
| **Ediciones** | CRUD de años, cambio de edición activa |
| **Usuarios** | CRUD con hashing automático de contraseña |
| **Configuración** | Edición de pares clave-valor operativos |
| **Encuesta** | Formulario por token único, 26 preguntas en 8 secciones, visibilidad condicional, autoguardado, 11 flags de calidad |
| **Auditoría** | Log automático de login, submit, administración |
| **Base analítica** | Reconstrucción automática sin PII + formato long para Looker Studio |

### Compromisos de diseño adoptados

- **Sin frameworks**: el frontend es JavaScript puro (ES6+) para minimizar dependencias y tiempo de carga
- **Cuestionario por metadatos**: agregar, quitar o modificar preguntas solo requiere editar la hoja CUESTIONARIO, sin tocar código
- **Un token por respondente × edición**: garantiza que cada persona responde exactamente una vez por año
- **PII separada físicamente**: los nombres y cédulas nunca llegan a BASE_ANALITICA, que es la única hoja usada para el dashboard

---

## 14. Extensiones recomendadas para versiones futuras

| Mejora | Implementación sugerida |
|--------|------------------------|
| Cambio obligatorio de contraseña | Evaluar `must_change_password=TRUE` en cada validación de sesión |
| Control de concurrencia | `LockService.getScriptLock()` en `submitSurvey` y `rebuildAnalytics` |
| Recordatorios automáticos | Trigger horario que detecta invitaciones `Enviado` sin uso y reenvía |
| Exportación XLSX/PDF | `Drive.Files.copy` + `Sheets.Spreadsheets.export` desde un endpoint admin |
| Filtro por edición en dashboard | Parámetro `editionId` en `getDashboardSummary`, dropdown en el panel |
| Looker Studio | Conectar directamente a `RESPUESTAS_LONG` (ya disponible en formato adecuado) |
| Catálogo maestro de empresas | Hoja adicional con empresas validadas; validación en `submitSurvey` |
| Notificación de nuevo registro | `MailApp` al admin cuando un token es usado |
| Encuesta con progreso visible | Barra de progreso por sección en el formulario del respondente |
