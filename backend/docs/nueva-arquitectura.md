# Nueva Arquitectura del Proyecto Cursus

## 1. Decisión de Assets: `public/` vs `resources/`

Se ha decidido **MANTENER los assets (CSS y JS) en el directorio `public/`** y servirlos de manera estática, en lugar de migrarlos a `resources/` para ser procesados por Vite.

**Justificación técnica:**

1. **Preservación de Lógica Global:** Gran parte de los scripts JS actuales (14 archivos) utilizan funciones expuestas globalmente (`window.handleCareerChange()`, `window.openContactModal()`, etc.). Migrar a módulos ES6 bajo el pipeline de Vite requeriría una reescritura masiva de la lógica y la forma en que se comunican las funciones, lo cual incrementa exponencialmente el riesgo de romper la funcionalidad actual.
2. **Compatibilidad con Prototipos:** Los prototipos estáticos en `prototypes/` dependen de la estructura relativa en `public/`. Si los assets se mueven y compilan, los prototipos estáticos se romperán o requerirán una configuración especial no deseada.
3. **Simplicidad del Stack:** El proyecto utiliza Vanilla JS y CSS nativo sin preprocesadores pesados ni dependencias complejas. La sobrecarga de usar un empaquetador como Vite no ofrece beneficios tangibles inmediatos en este contexto.
4. **Adopción Inmediata:** Fragmentar el código en `public/` mediante múltiples archivos `<link>` y `<script>` aprovecha las capacidades nativas de los navegadores modernos y permite una modularización efectiva sin cambiar las reglas del juego para el equipo de desarrollo.

---

## 2. Árbol de Directorios Modular

A continuación se detalla la nueva estructura propuesta, diseñada para respetar el Principio de Responsabilidad Única (SRP) y facilitar la colaboración.

### Estructura de Assets Públicos (`public/`)

```text
public/
├── css/
│   ├── base/               # Estilos fundamentales y reseteos
│   │   ├── fonts.css       # Declaraciones @font-face
│   │   ├── variables.css   # Variables globales de color, espaciado, sombras (:root)
│   │   └── reset.css       # Reseteo estándar de márgenes, box-sizing y estilos base de HTML/body
│   ├── layout/             # Estructura macro de la aplicación
│   │   ├── app.css         # Contenedores principales (.app, .main, .page)
│   │   ├── sidebar.css     # Barra lateral de navegación
│   │   ├── topbar.css      # Barra superior (breadcrumb, acciones rápidas)
│   │   └── mobile-nav.css  # Barra de navegación inferior para móviles
│   ├── components/         # Elementos de UI reutilizables
│   │   ├── buttons.css     # Estilos base de todos los botones
│   │   ├── cards.css       # Tarjetas de contenido, estadísticas
│   │   ├── modals.css      # Estilos compartidos para modales/overlays
│   │   ├── tabs.css        # Sistema de pestañas
│   │   ├── toast.css       # Notificaciones flotantes (sistema centralizado)
│   │   ├── filters.css     # Chips de filtrado y selectores
│   │   ├── forms.css       # Switches, inputs, textareas
│   │   └── pomo-float.css  # Widget flotante Pomodoro minimizable
│   └── views/              # Estilos ESPECÍFICOS para cada página
│       ├── welcome.css     # Estilos exclusivos de la landing page
│       ├── dashboard.css   # Panel principal (Inicio)
│       ├── area-estudio.css# Pomodoro, Kanban
│       ├── materias.css    # Árbol de correlatividades
│       ├── alertas.css     # Lista y calendario de alertas
│       ├── horarios.css    # Grilla del simulador de horarios
│       ├── progreso.css    # Gráficos (donut, heatmap)
│       └── auth.css        # Pantallas de login, registro, recuperación de contraseña
│
├── js/
│   ├── models/             # Modelos de dominio y máquinas de estado (ES6 Modules)
│   │   └── PomodoroStates.js # State Pattern: FaseEnfoque, FaseDescansoCorto, FaseDescansoLargo
│   ├── services/           # Servicios desacoplados de la UI (ES6 Modules)
│   │   ├── ApiService.js     # Repository Pattern: abstrae TODOS los fetch de la app
│   │   ├── PomodoroStateService.js # Observer/SSOT: estado canónico del Pomodoro + motor Time Deltas
│   │   └── PomodoroSyncQueue.js # Cola Offline: Sincronización en segundo plano de sesiones Pomodoro
│   ├── shared/             # Scripts transversales a toda la app
│   │   ├── api.js          # Utilidades para llamadas fetch al backend
│   │   ├── router.js       # Manejo de navegación/historial
│   │   ├── toast.js        # ★ Sistema centralizado de notificaciones (window.showToast)
│   │   ├── sidebar.js      # Lógica del menú lateral: colapso, tooltips y navegación activa
│   │   ├── utils.js        # Funciones auxiliares reutilizables: formato de fechas, cálculo de alertas próximas
│   │   ├── profile.js      # Menú de perfil de usuario: cambio de carrera, modal de contraseña, cierre de sesión
│   │   └── pomo-audio-player.js # Módulo de UI puro: sintetiza alarmas con Web Audio API. Importado por area-estudio.js y pomo-float.js.
│   └── views/              # Lógica específica por página (orquestadores)
│       ├── welcome.js      # Animaciones de la landing
│       ├── dashboard.js    # Lógica del panel de inicio
│       ├── area-estudio.js # Orquestador principal del Área de Estudio
│       ├── kanban.js       # Lógica separada del Tablero Kanban y Modal de Tareas
│       ├── lofi-panel.js   # Panel de ruido blanco y música Lo-Fi
│       ├── materias.js     # Interacciones del árbol de materias
│       ├── alertas/        # Lógica compleja de la página de alertas dividida
│       │   ├── alertas-data.js     # Manejo de datos y mocks
│       │   ├── alertas-render.js   # Pintado de HTML en DOM
│       │   ├── alertas-calendar.js # Renderizado del calendario visual
│       │   └── alertas-main.js     # Orquestación e inicialización
│       ├── horarios/       # Lógica del simulador
│       │   ├── horarios-data.js    # Datos de materias disponibles
│       │   ├── horarios-grid.js    # Construcción de la grilla
│       │   ├── horarios-drag.js    # Funcionalidad Drag & Drop
│       │   └── horarios-main.js    # Orquestación
│       ├── progreso/       # Gráficos y proyecciones
│       │   ├── progreso-data.js    # Obtención de datos simulados/reales
│       │   ├── progreso-charts.js  # Renderizado de SVG Donut y Heatmap
│       │   ├── progreso-projection.js# Fórmulas de proyección
│       │   └── progreso-main.js    # Orquestación
│       ├── login.js
│       ├── register.js
│       ├── forgot-password.js
│       └── reset-password.js
```

### Estructura de Vistas Blade (`resources/views/`)

```text
resources/views/
├── layouts/
│   └── app.blade.php           # Plantilla base. Ahora solo orquesta la carga de CSS modular y partials.
├── partials/                   # Fragmentos reutilizables de UI general
│   ├── sidebar.blade.php       # Navegación izquierda
│   ├── mobile-nav.blade.php    # Navegación inferior
│   ├── contact-modal.blade.php # Formulario de feedback
│   └── topbar/
│       ├── breadcrumb.blade.php
│       └── career-selector.blade.php
├── welcome/                    # La landing page descompuesta
│   ├── welcome.blade.php       # Layout principal de la landing + Hero
│   ├── _header.blade.php       # Barra superior de la landing
│   ├── _features.blade.php     # Cards de beneficios
│   ├── _demo-dashboard.blade.php # Demo visual de la interfaz
│   ├── _pricing.blade.php      # Tabla de precios
│   ├── _testimonials.blade.php # Reseñas
│   └── _footer.blade.php       # Enlaces al pie
├── dashboard.blade.php
├── area-estudio.blade.php
├── materias.blade.php
└── ... (resto de vistas)
```

---

## 4. Sistema Global de Toasts (`shared/toast.js` + `components/toast.css`)

El sistema de notificaciones flotantes está **centralizado en un único punto de verdad**:

| Capa                | Archivo                           | Responsabilidad                                                                     |
| ------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| **Lógica**          | `js/shared/toast.js`              | Define `window.showToast(message, type, duration)`. IIFE pattern, sin dependencias. |
| **Estilos**         | `css/components/toast.css`        | Clases BEM: `.toast`, `.toast__icon`, `.toast__message`, `.toast__close`.           |
| **Contenedor HTML** | `layouts/app.blade.php` línea 431 | `<div class="toast-container" id="toast-container">` — único en el DOM.             |

### Cómo consumirlo

```js
// En cualquier script (legacy o ES6 module):
window.showToast("Operación exitosa", "success");
window.showToast("Error al guardar", "error");
window.showToast("Atención", "warn");
window.showToast("Información", "info", 6000); // duración custom en ms
```

### Tipos soportados

| `type`    | Ícono Sprite      | ID en Sprite     | Color borde     |
| --------- | ----------------- | ---------------- | --------------- |
| `success` | `circle-check.svg`| `#circle-check`  | `var(--green)`  |
| `error`   | `circle-x.svg`    | `#circle-x`      | `var(--red)`    |
| `warn`    | `circle-alert.svg`| `#circle-alert`  | `var(--orange)` |
| `info`    | `info.svg`        | `#info`          | `var(--brand)`  |

### Regla de Oro

> **PROHIBIDO** definir funciones locales tipo `showToast`, `showXyzToast` o similares en ningún script de vista. Si una vista necesita mostrar una notificación, usa `window.showToast` directamente.

---

## 5. Patrones de Diseño Implementados (Lote 1 — Área de Estudio)

| Patrón                    | Módulo                                            | Descripción                                                                                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **State Pattern**         | `js/models/PomodoroStates.js`                     | Cada fase (Enfoque, DescansoCorto, DescansoLargo) es un objeto inmutable con sus propias reglas de duración y transición. Elimina todos los `if (fase === 'enfoque')` dispersos.                                                                                                                   |
| **Observer / Pub-Sub**    | `js/services/PomodoroStateService.js`             | Extiende `EventTarget`. Emite `pomo:tick`, `pomo:estadoCambiado`, `pomo:faseCompletada`. El Timer Principal, el Modo Concentración y el Widget Flotante se suscriben y renderizan de forma totalmente independiente.                                                                               |
| **Repository Pattern**    | `js/services/ApiService.js`                       | Abstrae TODOS los `fetch` de la vista. Ninguna función del DOM hace peticiones HTTP directamente. Retorna promesas limpias al llamador. Permite migrar de mock a real cambiando un único punto.                                                                                                    |
| **Time Deltas**           | `PomodoroStateService._iniciarTicker()`           | El tiempo restante se calcula como `Date.now() - tsInicio` en cada tick (500 ms). Inmune al throttling de navegadores en pestañas inactivas donde `setInterval` puede demorar 1+ segundo.                                                                                                          |
| **Singleton**             | `pomodoroService` (exportado)                     | Una única instancia del servicio para garantizar el SSOT. Consumidores (`pomo-float.js`, futuros módulos) deben importarlo directamente.                                                                                                                                                           |
| **SRP — Módulo de Audio** | `js/shared/pomo-audio-player.js`                  | Encapsula exclusivamente la síntesis de sonido con la Web Audio API. No conoce el estado del Pomodoro ni el DOM. Las vistas lo importan y lo activan al recibir el evento `pomo:faseCompletada`.                                                                                                   |
| **Web Locks API**         | `_registrarSesionConDedup()` en `area-estudio.js` | Sustituye el token de localStorage para la deduplicación multi-pestaña. `navigator.locks.request('cursus_pomo_dedup', { mode: 'exclusive' }, ...)` garantiza exclusión atómica: si N pestañas intentan registrar al mismo milisegundo, el navegador las encola y solo el líder realiza el `fetch`. |
| **Offline-First / Queue** | `js/services/PomodoroSyncQueue.js`                | Cola de sincronización local que retiene sesiones terminadas (localStorage) si el servidor falla o no hay conexión, reintentando automáticamente al volver a estar online sin bloquear la UI principal.                                                                                            |

---

## 6. Reglas de Oro Post-Refactorización

Para el equipo de desarrollo, estas son las nuevas normativas a cumplir al agregar código:

1. **PROHIBIDO el CSS Monolítico:** No agregues clases indiscriminadamente a `main.css`. Busca la capa correspondiente (`components/`, `layout/` o `views/`). Si es un estilo genérico de un botón, va en `buttons.css`. Si es un padding raro de la página "Materias", va en `materias.css`.
2. **Carga Bajo Demanda:** Las hojas de estilo de las vistas (`views/*.css`) y los scripts específicos (`views/*.js`) **SOLO** deben cargarse en el Blade de esa vista usando las directivas `@push('styles')` y `@push('scripts')`. No las coloques globalmente en el layout `app.blade.php`.
3. **JS Desacoplado:** Si un script supera las 200-300 líneas, es un síntoma de que mezcla responsabilidades. Separa la obtención de datos (API/Mocks), la manipulación del DOM (Render) y la inicialización (Main).
4. **Servicios y Modelos Globales:** Los módulos en `js/models/` y `js/services/` son reutilizables entre vistas. Futuras vistas que necesiten el Pomodoro (ej: `pomo-float.js`) deben importar `PomodoroStateService` directamente, no duplicar la lógica.
5. **Vistas Ligeras:** Ningún archivo `.blade.php` debe superar las 300 líneas. Si una vista tiene una sección muy larga, extráela a un partial usando `@include('partials.nombre')`.
6. **Cero Lógica en Plantillas:** Evita incrustar `<style>` o `<script>` directamente dentro de un archivo `.blade.php`. Esto impide el cacheo y fomenta el código espagueti.

¡Adherirse a estas reglas mantendrá el código limpio, veloz y fácil de escalar a largo plazo!
