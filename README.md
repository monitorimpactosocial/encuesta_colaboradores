# Encuesta de Colaboradores Paracel
## Sistema de Gestión y Análisis · v2.0.0

Aplicación web estática para la gestión, distribución y análisis de la Encuesta de Colaboradores de Paracel S.A. Soporta los años **2024, 2025 y 2026**.

---

## Acceso

| Usuario    | Contraseña | Rol           |
|------------|-----------|---------------|
| `diego`    | `456`     | Administrador |
| `user`     | `123`     | Visualizador  |

---

## Estructura del proyecto

```
encuesta_colaboradores/
├── index.html              # Aplicación principal (dashboard + admin)
├── encuesta.html           # Formulario público para colaboradores
├── assets/
│   ├── css/styles.css      # Estilos (tema verde oscuro)
│   └── js/
│       ├── app.js          # Lógica principal (auth, dashboard, tablas, modales)
│       ├── questions.js    # Definición completa del cuestionario (8 secciones, 70 preguntas)
│       └── survey.js       # Lógica del formulario público
├── data/
│   └── ENCUESTA_COLABORADORES_LIMPIA_2025.csv  # Base limpia 2025 (987 registros)
└── README.md
```

---

## Funcionalidades

### Dashboard
- KPIs: total encuestados, % hombres/mujeres, directo/indirecto, edad promedio, IPS, área urbana
- 10 gráficos: sexo, tipo, área, edad, IPS, combustible, departamentos, salario, empresas, timeline
- Selector de año (2024/2025/2026)
- Botón de sincronización con Google Sheets

### Respuestas
- Tabla completa con búsqueda y filtros (tipo, sexo, área)
- Paginación (20 por página)
- Exportar a CSV

### Cuestionario (encuesta.html)
- 8 secciones, 70 preguntas
- Formulario multi-paso con barra de progreso
- Preguntas condicionales (se muestran según respuestas anteriores)
- Guardado automático de borrador
- Envío a Google Apps Script

### Colaboradores (admin)
- Lista de personas a encuestar
- Importar lista desde CSV (`ci, nombre, email, telefono, tipo, empresa`)
- Generar enlace único por persona
- Estado: Pendiente / Enviado / Completado

### Envío Masivo (admin)
- Plantilla de correo personalizable con variables `{{nombre}}`, `{{year}}`, `{{link}}`
- Vista previa del correo
- Envío a todos los pendientes (abre cliente de correo)
- Envío individual con enlace personalizado

### Usuarios (admin)
- Agregar/editar/eliminar usuarios
- Roles: Administrador / Visualizador

### Configuración (admin)
- URLs de Google Sheets por año
- URL de Google Apps Script
- Configuración de correo
- Exportar/importar respaldo JSON

---

## Integración con Google Sheets

### Paso 1: Preparar el Spreadsheet

Cree un Google Spreadsheet con pestañas: `2024`, `2025`, `2026`, `Colaboradores`.

Suba la base limpia `ENCUESTA_COLABORADORES_LIMPIA_2025.csv` a la pestaña `2025`.

### Paso 2: Publicar como CSV

Para conectar el dashboard:
1. Archivo → Publicar en la web
2. Seleccione la pestaña del año (ej: `2025`)
3. Formato: `Valores separados por comas (.csv)`
4. Copie la URL generada
5. Péguelo en Configuración → URL hoja 2025

### Paso 3: Configurar Apps Script (para recibir respuestas 2026)

1. En el Spreadsheet: Extensiones → Apps Script
2. Pegue este código:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var year = data.year || '2026';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(year);
    if (!sheet) sheet = ss.insertSheet(year);

    // Crear cabecera si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      var headers = Object.keys(data).filter(k => !k.startsWith('_'));
      sheet.appendRow(headers);
    }

    // Agregar fila con valores
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(h => data[h] !== undefined ? data[h] : '');
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Apps Script activo' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Implementar → Nueva implementación → Aplicación web
4. Acceso: **Cualquier persona**
5. Copie la URL y péguelo en Configuración → URL del Apps Script

---

## Despliegue en GitHub Pages

```bash
# En el directorio del proyecto:
git init
git add .
git commit -m "Initial release - Encuesta Colaboradores Paracel v2.0.0"
git branch -M main
git remote add origin https://github.com/monitorimpactosocial/encuesta_colaboradores.git
git push -u origin main
```

Luego en GitHub: Settings → Pages → Source: main → / (root) → Save.

**URL de la app**: `https://monitorimpactosocial.github.io/encuesta_colaboradores/`

---

## Enlace de encuesta para colaborador

Formato del enlace enviado por correo:
```
https://monitorimpactosocial.github.io/encuesta_colaboradores/encuesta.html?token=XXXXX
```

El token codifica `id:ci:year` en base64. Al abrirlo:
- El formulario se pre-rellena con los datos básicos del colaborador
- Al enviar, los datos van al Apps Script → Google Sheets
- El estado del colaborador cambia a "Completado"

---

## Datos limpios 2025

**Archivo**: `data/ENCUESTA_COLABORADORES_LIMPIA_2025.csv`

**Limpieza aplicada**:
- 987 registros, 31 columnas de datos válidos
- Normalización de nombres de empresas (81 → ~60 entidades únicas)
- Normalización de cargos (case-insensitive, variantes consolidadas)
- Normalización de sexo, tipo de colaborador, área de residencia
- Normalización de comunidad indígena (Sí/No)
- Formato estándar de fechas (YYYY-MM-DD)
- Cédulas como texto (sin decimales)
- Edades como enteros

**Empresas corregidas** (principales): `JM CONSTRUCTORA` → `CONSTRUCTORA JM`, `PROSEGUR SECURITY` → `PROSEGUR`, `PLAN SUR` → `PLANSUR`, `OAC MAQUINARIA` → `OAC MAQUINARIAS`, y otras.

---

## Monitor de Impacto Social · Paracel S.A. · 2026
