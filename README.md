# SISTEMA PRODUCCIÓN — Control de Avance de Labores (Deshierbo)

Sistema hermano de Sistema Sanidad, para el Área de Producción. Registra
avances de **Deshierbo con implemento** y **Deshierbo sin implemento**,
con mapas de avance, semáforo de rendimiento por sector y jefe automático.

Es un proyecto **independiente**: tiene su propia hoja de cálculo, su
propio backend de Apps Script y su propia carpeta de Drive. No comparte
datos con Sistema Sanidad.

## Diferencias clave frente a Sistema Sanidad

- **Labor**: solo dos opciones — "Deshierbo con implemento" y "Deshierbo
  sin implemento".
- **Jefe automático**: cada sector (`SECTORES`) tiene un `Jefe` asignado.
  Al elegir el sector en el formulario, el campo Jefe se autocompleta
  (solo lectura), no hace falta escribirlo.
- **Meta de rendimiento por sector**: cada sector tiene su propia meta en
  `Meta_HaJr` (por defecto 1.00 Ha/Jr para los 6 sectores). Se puede
  editar sector por sector directamente en la hoja `SECTORES`, sin tocar
  código.
- **Semáforo de rendimiento**: cada avance y cada consolidado muestran
  🟢 Verde (cumple o supera la meta), 🟡 Amarillo (cerca de la meta) o
  🔴 Rojo (por debajo de la meta). El umbral de "cerca de la meta" está
  en `CONFIGURACION` → `UMBRAL_AMARILLO` (0.85 = 85% de la meta).
- **Observación**: campo de texto libre y **opcional** en cada avance.
- **Mapa de avance**: igual que en Sanidad, obligatorio, se sube a Google
  Drive (carpeta `SISTEMA_PRODUCCION/MAPAS_AVANCE/<año>/<mes>/`).

## Sectores y jefes iniciales

| Sector | Zona | Jefe |
|---|---|---|
| O1E1, O1E2 | Olmos 1 | Jhovian |
| O2E1, O2E2 | Olmos 2 | Alindor |
| O3E1, O3E2 | Olmos 3 | Felipe |

## Instalación (igual que Sistema Sanidad, ver esa guía para el detalle
de cada clic)

1. Crea una hoja de cálculo llamada **`BD_SISTEMA_PRODUCCION`**.
2. Extensiones → Apps Script → pega `apps-script/Code.gs`.
3. Ejecuta `setupSistema()` una vez (autoriza permisos). Crea las hojas,
   los 6 sectores con su jefe y meta, los 2 tipos de labor de deshierbo,
   responsables de ejemplo, y la carpeta en Drive.
4. Implementar → Nueva implementación → Aplicación web → Ejecutar como
   "Yo" → Acceso "Cualquier usuario" → Implementar. Copia la URL `/exec`.
5. Pega esa URL en `js/api.js` (`CONFIG.API_URL`).
6. Sube el proyecto a un repositorio de GitHub (puede ser el mismo que
   Sanidad, en una carpeta distinta, o uno nuevo) y activa GitHub Pages.

## Estructura de Google Sheets

**LABORES**: `ID_LABOR, Fecha_Inicio, Responsable, Sector, Jefe, Labor, Descripcion, Estado, Fecha_Creacion, Usuario_Registro`

**AVANCES**: `ID_AVANCE, ID_LABOR, Fecha, Jornales, Hectareas, Jr_Ha, Ha_Jr, Meta_HaJr, Semaforo, Observacion, ID_MAPA, URL_MAPA, Fecha_Registro`

**SECTORES**: `ID_SECTOR, Sector, Zona, Jefe, Meta_HaJr, Activo`

**TIPOS_LABOR**: `ID_LABOR_TIPO, Labor, Activo` (Deshierbo con/sin implemento)

**RESPONSABLES**: `ID_RESPONSABLE, Nombre, Area, Activo`

**CONFIGURACION**: `Clave, Valor` (incluye `UMBRAL_AMARILLO`)

## Mantenimiento

- **Cambiar la meta de un sector**: edita `Meta_HaJr` en la hoja
  `SECTORES` para ese sector. Los avances futuros usarán la nueva meta;
  los avances ya guardados conservan la meta con la que se registraron
  (se guarda por avance, así el histórico no cambia retroactivamente).
- **Cambiar el jefe de un sector**: edita `Jefe` en `SECTORES`. Aplica
  para las próximas labores que se creen con ese sector.
- **Ajustar cuándo pasa a amarillo**: cambia `UMBRAL_AMARILLO` en
  `CONFIGURACION` (por ejemplo, 0.90 para exigir más cercanía a la meta).
