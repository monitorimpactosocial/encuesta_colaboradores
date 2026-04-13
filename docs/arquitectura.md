# Arquitectura propuesta

## 1. Patrón general

- Frontend SPA en `HtmlService`
- Backend transaccional en Apps Script
- Persistencia primaria en Google Sheets
- Seguridad funcional por:
  - sesión con token para admin y visor
  - enlace único con token para respondente
  - hashing de contraseña
  - auditoría de eventos

## 2. Modelo de datos

### RESPUESTAS
Base operativa wide. Contiene datos limpios y banderas de calidad.

### BASE_ANALITICA
Derivada desde `RESPUESTAS`, excluye identificadores personales directos.

### RESPUESTAS_LONG
Derivada desde `RESPUESTAS`, útil para tablas dinámicas, Looker Studio y Apps Script.

### CUESTIONARIO
Gobierna secciones, orden, visibilidad condicional y opciones.

### INVITACIONES
Controla token, edición, estado de envío y uso del enlace.

### AUDITORIA
Traza login, administración, invitaciones y capturas.

## 3. Buenas prácticas incorporadas

- Cuestionario orientado por metadatos
- Rebuild explícito de base analítica
- Hashing de credenciales iniciales
- Edición activa configurable
- Separación entre base operativa y base para tablero
- Prevención de reuso del token de respondente
- Autoguardado local de borrador
- Visibilidad condicional por reglas simples `campo=valor`

## 4. Extensiones recomendadas

- Cambio obligatorio de contraseña en primer acceso
- Control de concurrencia con LockService
- Exportación XLSX/PDF desde panel
- Catálogo maestro de empresas y distritos con validación más estricta
- Tablero con gráficos SVG o Google Charts
- Recordatorios automáticos por trigger horario
