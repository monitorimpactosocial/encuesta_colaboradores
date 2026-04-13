# Encuesta de Colaboradores PARACEL

Aplicación web en **Google Apps Script** con backend en **Google Sheets**.
Diseño basado en las mejores prácticas de `materialidadV2`: persistencia, control de edición, trazabilidad, cuestionario por metadatos, tokenización de respondentes y base analítica separada.

## Recursos del proyecto

| Recurso | URL / ID |
|---------|----------|
| Google Sheet (backend) | [Abrir Spreadsheet](https://docs.google.com/spreadsheets/d/1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c/edit) |
| Spreadsheet ID | `1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c` |
| Apps Script | [Abrir proyecto GAS](https://script.google.com/u/0/home/projects/create?parent=1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c) |

## Credenciales iniciales

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `diego` | `456` | Administrador |
| `user`  | `123` | Visualizador |

> Las contraseñas se hashean con SHA-256 al ejecutar `setupBackend()`. Cambiarlas después del primer despliegue.

---

## Estructura del repositorio

```
├── appsscript.json      # Manifiesto GAS (zona horaria, permisos)
├── App.gs               # doGet: punto de entrada de la web app
├── Auth.gs              # Login, sesiones con token, logout
├── Config.gs            # Constantes, nombres de hojas, acceso al Spreadsheet
├── Utils.gs             # Utilidades: UUID, hash, normalización, CRUD genérico
├── Setup.gs             # setupBackend(): crea hojas, cabeceras, hashea usuarios
├── Admin.gs             # Panel admin: dashboard, respuestas, usuarios, invitaciones, config
├── Survey.gs            # Encuesta: schema, submit, flags de calidad, base analítica
├── Index.html           # Plantilla HTML (punto de entrada del frontend)
├── Styles.html          # CSS (incluido por Index.html)
├── Client.html          # SPA JavaScript (incluido por Index.html)
├── .clasp.example.json  # Plantilla para configurar clasp
├── data/
│   └── ENCUESTA_COLABORADORES_LIMPIA_2025.csv   # 987 registros limpios 2025
└── docs/
    └── arquitectura.md  # Descripción de la arquitectura
```

---

## Hojas del Spreadsheet backend

| Hoja | Propósito |
|------|-----------|
| `CONFIG` | Parámetros clave-valor (edición activa, etc.) |
| `EDICIONES` | Control de ediciones 2024, 2025, 2026 |
| `USUARIOS` | Usuarios del panel con hash de contraseña |
| `CUESTIONARIO` | Definición de secciones y preguntas (metadatos) |
| `CATALOGOS` | Catálogos de opciones (departamentos, empresas, etc.) |
| `RESPUESTAS` | Base operativa wide con todos los campos y flags |
| `BASE_ANALITICA` | Versión anonimizada (sin PII) para dashboard |
| `RESPUESTAS_LONG` | Formato long para Looker Studio y tablas dinámicas |
| `INVITACIONES` | Tokens únicos: estado de envío y uso |
| `AUDITORIA` | Trazabilidad de todas las acciones |

---

## Despliegue paso a paso

### 1. Preparar el Spreadsheet

El archivo `paracel_colaboradores_backend_seed.xlsx` (incluido en el paquete de implementación) contiene la estructura base con datos 2025 ya cargados. Súbalo a Google Drive y conviértalo a Google Sheets, **o use el spreadsheet existente** con ID `1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c`.

### 2. Crear el proyecto Apps Script

Opción A — **Editor web** (recomendado):
1. Abra el [editor de Apps Script](https://script.google.com/u/0/home/projects/create?parent=1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c)
2. Elimine el código de ejemplo
3. Cree un archivo por cada `.gs` de este repositorio
4. Copie el contenido de cada archivo
5. Cree los archivos HTML: `Index`, `Styles`, `Client` (sin extensión en GAS)

Opción B — **clasp** (para desarrollo):
```bash
npm install -g @google/clasp
clasp login
# Copiar .clasp.example.json → .clasp.json y poner el scriptId real
clasp push
```

### 3. Configurar el backend

En el editor de Apps Script, ejecute **una sola vez**:
```javascript
setupBackend("1hyEyDe_1TXjk2Jfs8dLFrGW3-7Z19hgX6lmlDbqdf4c")
```
Esto crea todas las hojas, cabeceras, y hashea las contraseñas iniciales.

### 4. Desplegar como Web App

1. **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Ejecutar como: **Yo (su cuenta)**
4. Quién tiene acceso: **Cualquier usuario**
5. Copiar la URL generada → es la URL pública de la app

### 5. Cargar datos históricos 2025

En el Spreadsheet, en la hoja `RESPUESTAS`, importe el archivo:
`data/ENCUESTA_COLABORADORES_LIMPIA_2025.csv`

Luego desde el panel admin ejecute **"Recalcular base analítica"** para poblar `BASE_ANALITICA` y `RESPUESTAS_LONG`.

---

## Funcionalidades

- **Login** con hash SHA-256 y sesión por token (12 h)
- **Dashboard** con KPIs y barras horizontales desde `BASE_ANALITICA`
- **Respuestas** (últimos 150, anonimizados)
- **Invitaciones** — genera tokens únicos y envía correos con `MailApp`
- **Ediciones** — gestión de años 2024, 2025, 2026
- **Usuarios** — CRUD con hash de contraseña
- **Configuración** — pares clave-valor en hoja `CONFIG`
- **Encuesta** — formulario por enlace único tokenizado, autoguardado local, visibilidad condicional
- **Flags de calidad** — 11 banderas automáticas por registro (n_flags, estado_calidad)
- **Base long** — reconstrucción automática en `RESPUESTAS_LONG`
- **Auditoría** — log de login, submit, administración en hoja `AUDITORIA`

---

## Monitor de Impacto Social · Paracel S.A. · 2026
