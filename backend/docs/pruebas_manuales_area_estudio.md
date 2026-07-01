# Pruebas Manuales — Área de Estudio

## Lote 1: Refactorización Estructural y Patrones de Diseño

> **URL base:** `http://127.0.0.1:8000/area-estudio`
> **Objetivo:** Verificar que el comportamiento observable para el usuario es **exactamente idéntico** al anterior al monolito, mientras que los patrones de diseño internos han sido reemplazados.

---

## PRE-REQUISITO: Verificación de Carga de Módulos

### P0 — Carga sin errores de consola ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Confirmar que los módulos ES6 se resuelven correctamente en el navegador. |
| **Pasos** | 1. Abrir DevTools → pestaña **Console** y **Network**. 2. Navegar a `http://127.0.0.1:8000/area-estudio`. 3. Observar la consola y la pestaña Network. |
| **Resultado esperado** | ✅ Cero errores `404`, `SyntaxError` o `Failed to resolve module` en la consola. En Network, los tres módulos nuevos deben aparecer con status **200**: `PomodoroStates.js`, `ApiService.js`, `PomodoroStateService.js`. |
| **Troubleshooting** | Si hay `404` en los módulos: verificar que los archivos existan en `backend/public/js/models/` y `backend/public/js/services/`. Si hay `SyntaxError`: revisar la sintaxis del archivo indicado en el stack trace (línea exacta). |

---

## BLOQUE A: State Pattern — Máquina de Estados ✅

### A1 — Transición de Fase Enfoque → Descanso Corto (Sesiones 1-3)
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que la FaseEnfoque calcula correctamente la siguiente fase usando el State Pattern. |
| **Pre-condición** | Timer en estado inicial (Sesión 1, fase Enfoque). Preset "classic" activo (25/5/20 — 4 sesiones). |
| **Pasos** | 1. Verificar que el subtítulo del timer muestre `Enfoque · Sesión 1 de 4`. 2. Hacer clic en **Saltar** (confirmar). 3. Observar el timer y el subtítulo. |
| **Resultado esperado** | ✅ El timer cambia a `05:00`. El subtítulo muestra `Descanso Corto · Sesión 2 de 4`. El dot de sesión 1 se pinta como completado. El reloj arranca automáticamente. |
| **Edge case** | Repetir el Saltar para avanzar a Sesión 2 de enfoque → debe volver a Descanso Corto para Sesión 3. |
| **Troubleshooting** | Si el timer no cambia de fase: abrir Console → verificar que `pomo:faseCompletada` se emita correctamente (añadir temporalmente `pomodoroService.addEventListener('pomo:faseCompletada', console.log)` en la consola del navegador). |

### A2 — Transición de Fase Enfoque → Descanso LARGO (Sesión 4) ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que la FaseEnfoque transiciona a Descanso Largo en la última sesión y reinicia el contador. |
| **Pre-condición** | Timer mostrando `Enfoque · Sesión 4 de 4` (avanzar con Saltar hasta llegar). |
| **Pasos** | 1. Hacer clic en **Saltar** (confirmar). |
| **Resultado esperado** | ✅ Timer muestra `20:00`. Subtítulo muestra `Descanso Largo · Sesión 1 de 4`. Todos los dots reseteados. El reloj arranca automáticamente. |
| **Troubleshooting** | Si el ciclo no reinicia a Sesión 1: verificar en DevTools → Application → localStorage la clave `cursus_pomo_ciclos_v2`; el campo `ciclo_actual` debe ser `1` después del salto. |

### A3 — Transición de Descanso (Corto o Largo) → Enfoque ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que cualquier fase de descanso siempre vuelve a Enfoque. |
| **Pre-condición** | Timer en fase Descanso Corto o Largo. |
| **Pasos** | 1. Hacer clic en **Saltar** (confirmar). |
| **Resultado esperado** | ✅ Timer muestra el tiempo de enfoque configurado. Subtítulo muestra `Enfoque · Sesión X de Y`. |
| **Troubleshooting** | Si vuelve a la fase incorrecta: revisar `FaseDescansoCorto.siguiente()` y `FaseDescansoLargo.siguiente()` en `PomodoroStates.js`; ambos deben retornar `'enfoque'` incondicionalmente. |

---

## BLOQUE B: Observer Pattern — Desacoplamiento Timer / Focus Mode

### B1 — Sincronización del Timer Principal con el Modo Concentración ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que ambos paneles se actualizan de forma independiente sin el hack de `window.dispatchEvent(new Event('storage'))`. |
| **Pasos** | 1. Iniciar el timer (Play). 2. Hacer clic en **Modo Concentración**. 3. Observar el reloj en el overlay de pantalla completa durante 5-10 segundos. |
| **Resultado esperado** | ✅ El reloj del overlay muestra el mismo tiempo que el timer principal (con máximo 1 segundo de diferencia por el poll de 500 ms). Los dots y la fase se mantienen sincronizados. |
| **Troubleshooting** | Si el overlay no se actualiza: verificar en Console que el evento `pomo:tick` se dispare. Buscar `pomodoroService.addEventListener` en el Network tab para confirmar que el módulo cargó. |

### B2 — Cambio de Fase desde los Tabs del Modo Concentración ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que `changeFocusPhase()` llama a `pomodoroService.forzarFase()` y ambos paneles reflejan el cambio. |
| **Pasos** | 1. Abrir Modo Concentración con el timer corriendo. 2. Hacer clic en el tab **Descanso Corto**. 3. Cerrar el overlay y verificar el timer principal. |
| **Resultado esperado** | ✅ El timer principal también muestra la fase de Descanso Corto y el tiempo correspondiente. El reloj queda **pausado** (el usuario debe reanudar manualmente). |
| **Troubleshooting** | Si el timer principal no refleja el cambio: verificar que `pomo:estadoCambiado` se emite en `forzarFase()` y que el listener del DOMContentLoaded lo captura. |

### B3 — Ausencia del hack `window.dispatchEvent(new Event('storage'))` ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que ya no se usa el evento `storage` para comunicación intra-pestaña. |
| **Pasos** | 1. En DevTools Console: `window.addEventListener('storage', () => console.warn('STORAGE EVENT FIRED'))`. 2. Iniciar el timer, saltar fases, cambiar fase en overlay. |
| **Resultado esperado** | ✅ El warning **no aparece nunca** al interactuar normalmente en la misma pestaña. Solo debe aparecer si se abre una segunda pestaña y se modifica el timer desde allí. |
| **Troubleshooting** | Si el warning aparece en la misma pestaña: buscar en el código compilado cualquier ocurrencia de `dispatchEvent(new Event('storage'))` que no fue removida. |

---

## BLOQUE C: Time Deltas — Resistencia al Throttling

### C1 — Precisión del timer en pestaña activa ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el timer cuenta correctamente segundo a segundo. |
| **Pasos** | 1. Iniciar el timer con preset "short" (15 min). 2. Usar un cronómetro externo. 3. Verificar el tiempo después de 30 segundos reales. |
| **Resultado esperado** | ✅ El timer muestra exactamente `14:30` ± 1 segundo (la variación de 1 s es aceptable por la granularidad de 500 ms del poll). |
| **Troubleshooting** | Si hay deriva de > 2 segundos en 30 segundos: verificar `_iniciarTicker()` en `PomodoroStateService.js`. Los valores `_tickerInicioTs` y `_tickerInicioSeg` deben anclarse correctamente al inicio del periodo. |

### C2 — Recuperación tras cambiar de pestaña (throttling simulado) — EDGE CASE CRÍTICO ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el timer no pierde tiempo cuando el navegador aplica throttling en segundo plano. |
| **Pasos** | 1. Iniciar el timer con preset "short". 2. Navegar a otra pestaña (YouTube, Gmail, etc.) durante exactamente **15 segundos** reales (usar cronómetro). 3. Volver a la pestaña de Cursus. |
| **Resultado esperado** | ✅ El timer descontó exactamente 15 segundos (± 1 s). Con el motor de Time Deltas, el reloj "saltará" al tiempo correcto al volver a la pestaña, en lugar de haber perdido tiempo por el throttling. |
| **Comportamiento anterior (bug)** | ❌ Con `setInterval` decrementing 1s/tick, el timer habría perdido entre 5 y 14 segundos si Chrome aplicó throttling de 1 s entre ticks. |
| **Troubleshooting** | Si el timer descontó menos de 14 segundos: la lógica de Time Deltas no está funcionando. Verificar que `_tickerInicioTs` no se resetea al volver a la pestaña. También verificar que `visibilitychange` no pausa el ticker. |

### C3 — Auto-Pausa por ausencia prolongada (> 120 segundos) — EDGE CASE ✅ (Corregido)
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el timer aplica auto-pausa con descuento de 120 s al detectar ausencia > 2 minutos. |
| **Pre-condición** | Timer en estado 'corriendo'. |
| **Pasos** | 1. Iniciar el timer. 2. Verificar el tiempo actual (ej: `12:00`). 3. Modificar `timestamp_ultimo_cambio` en localStorage (clave `cursus_pomo_estado_v2`) para simular que pasaron 200 segundos: `let s = JSON.parse(localStorage.getItem('cursus_pomo_estado_v2')); s.timestamp_ultimo_cambio = Date.now() - 200000; localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(s))`. 4. Recargar la página (`F5`). |
| **Resultado esperado** | ✅ Aparece el toast de advertencia "Auto-Pausa: se detectó inactividad prolongada. Se descontaron 120 segundos." El timer muestra `10:00` (12:00 - 120 s = 10:00). El estado del reloj es 'pausado'. |
| **Troubleshooting** | Si no aparece el toast: revisar la rama `else` dentro del bloque `if (segundosAusente <= 120)` en `PomodoroStateService.init()`. Si el tiempo descontado es incorrecto: verificar que sea exactamente 120 s (no la diferencia real). |

### C4 — Expiración por abandono prolongado (> 4 horas) — EDGE CASE ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que una sesión de más de 4 horas de inactividad se reinicia automáticamente. |
| **Pasos** | 1. En Console: `let s = JSON.parse(localStorage.getItem('cursus_pomo_estado_v2')); s.timestamp_ultimo_cambio = Date.now() - (5 * 3600 * 1000); s.estado_reloj = 'corriendo'; localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(s))`. 2. Recargar la página. |
| **Resultado esperado** | ✅ Toast de advertencia "Sesión de estudio anterior expirada por inactividad (>4 hs)". Timer reiniciado a `25:00` en estado 'detenido'. |
| **Troubleshooting** | Si la sesión no expira: verificar en `init()` el cálculo `horasPasadas >= 4` y el valor de `timestamp_ultimo_cambio` en localStorage. |

---

## BLOQUE D: Repository Pattern — Capa de Red Aislada

### D1 — Creación de tarea (fetch delegado a ApiService) ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que la creación de tareas funciona exactamente igual pero ahora delega a `ApiService.createTarea()`. |
| **Pasos** | 1. Seleccionar una materia. 2. Hacer clic en **+ Añadir tarea** en la columna "Pendiente". 3. Escribir un título y presionar Enter. |
| **Resultado esperado** | ✅ La tarjeta aparece en la columna. Toast de éxito "Tarea agregada exitosamente". En DevTools → Network: se debe ver una petición `POST /api/tareas`. |
| **Troubleshooting** | Si aparece error: abrir Console → buscar `Error creando tarea`. Verificar que `ApiService.createTarea()` recibe los parámetros correctos (`materiaId`, `titulo`, `columna`). |

### D2 — Rollback visual del Drag & Drop en error de red ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el rollback visual del Kanban funciona al simular error de red. |
| **Pre-condición** | Tener al menos una tarea en la columna "Pendiente". |
| **Pasos** | 1. En `ApiService.js`, descomentar el bloque `reject(...)` en `mockFetch` (o forzar un error en `moveTarea` retornando `Promise.reject(...)`). 2. Arrastrar una tarjeta de "Pendiente" a "En Curso". |
| **Resultado esperado** | ✅ La tarjeta vuelve a su columna original con la animación de "shake" (clase `kb-error-shake`). Toast de error "Error moviendo tarea". |
| **Restauración** | Comentar nuevamente el `reject` en `mockFetch` y recargar. |
| **Troubleshooting** | Si la tarjeta no vuelve: verificar el bloque `.catch()` en `dropCard()` y que `dragOriginalCol` y `dragOriginalSibling` se capturen correctamente en `dragStart()`. |

### D3 — Ausencia de fetch directo en funciones del DOM ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que no quedan llamadas `fetch()` directas en `area-estudio.js`. |
| **Pasos** | 1. Abrir el archivo `backend/public/js/views/area-estudio.js`. 2. Buscar la cadena `fetch(` con Ctrl+F. |
| **Resultado esperado** | ✅ **Cero coincidencias** de `fetch(` en `area-estudio.js`. Todos los fetch deben estar exclusivamente en `ApiService.js`. |
| **Troubleshooting** | Si se encuentran coincidencias: cada llamada `fetch(` debe ser reemplazada por la función correspondiente de `ApiService`. |

---

## BLOQUE E: Funcionalidades de UI — Preservación de Comportamiento

### E1 — Presets del Pomodoro ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que los tres presets predefinidos aplican sus tiempos correctamente. |
| **Pasos** | 1. Hacer clic en **Deep Work** (preset). Verificar timer `50:00`. 2. Hacer clic en **Sprints** (short). Verificar `15:00`. 3. Hacer clic en **Clásico**. Verificar `25:00`. |
| **Resultado esperado** | ✅ Cada preset actualiza el timer al tiempo correcto y muestra el toast "Preset aplicado: NOMBRE". El preset activo queda marcado visualmente con la clase `active`. |
| **Edge case** | Intentar cambiar preset con el reloj corriendo → debe mostrar toast de advertencia "Pausa el temporizador antes de cambiar de modo". |

### E2 — Modal de Ajustes Personalizados y Validaciones ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que las validaciones de negocio del modal son correctas. |
| **Pasos** | 1. Clic en el botón de ajustes ⚙. 2. Intentar guardar con Enfoque = `5` y Descanso Corto = `5` (mismos minutos). 3. Observar el mensaje de error. 4. Corregir a Enfoque = `6` y guardar. |
| **Resultado esperado** | ✅ Paso 2: mensaje de error inline "Restricción: El descanso corto debe ser estrictamente menor que el tiempo de enfoque." Paso 4: modal se cierra, toast de éxito, timer muestra `06:00`. |
| **Troubleshooting** | Si el modal no valida: verificar la función `saveCustomPomoSettings()` en `area-estudio.js` y la condición `if (short >= focus)`. |

### E3 — Reinicio del Temporizador con sesión parcial ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que al Reiniciar con progreso parcial, el log muestra la entrada "⚠ Parcial". |
| **Pasos** | 1. Iniciar el timer y esperar 2+ minutos. 2. Clic en **Reiniciar** (confirmar). |
| **Resultado esperado** | ✅ Timer vuelve a `25:00`. En el log de sesiones aparece una fila con `⚠ Parcial` y la duración transcurrida en minutos. Toast "Temporizador reiniciado". |
| **Edge case** | Si el progreso fue < 1 minuto (elapsedMin = 0), NO debe aparecer entrada en el log. |
| **Troubleshooting** | Si no aparece el log parcial: verificar `_agregarLogParcial()` en `PomodoroStateService.js` y que `elapsedMin > 0` antes de llamarla. |

### E4 — Reiniciar Ciclo de Sesiones ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que reiniciar el ciclo vuelve a Sesión 1. |
| **Pasos** | 1. Avanzar a Sesión 3 (saltando 2 fases de enfoque). 2. Clic en el botón Reiniciar Ciclo (confirmar). |
| **Resultado esperado** | ✅ Subtítulo muestra `Enfoque · Sesión 1 de 4`. Dots de progreso reseteados. Timer muestra `25:00`. Toast "Ciclo de sesiones reiniciado". |

### E5 — Selector de Materia ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que cambiar de materia recarga el Kanban y los marcadores correctamente. |
| **Pasos** | 1. Seleccionar Materia A → verificar que el Kanban carga sus tareas. 2. Seleccionar Materia B → verificar que el Kanban muestra las tareas de B. |
| **Resultado esperado** | ✅ Cada cambio de materia dispara `loadAppState()` y `loadMateriaResumen()`. El nombre de la materia se actualiza en el header y en el dropdown. |

### E6 — Modo Estricto: detección de distracción ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el Modo Estricto detecta el cambio de pestaña y reproduce el beep de alerta. |
| **Pre-condición** | Activar Modo Estricto en el modal de ajustes. Iniciar el timer. |
| **Pasos** | 1. Cambiar a otra pestaña del navegador (con el timer corriendo). 2. Volver a Cursus. |
| **Resultado esperado** | ✅ Al volver: toast de advertencia mostrando la cantidad de distracciones detectadas. Al cambiar de pestaña: debe sonar el beep (si el audio está desbloqueado). |
| **Troubleshooting** | Si no suena el beep: el AudioContext puede estar suspendido por no haber interacción previa. Asegurarse de haber hecho clic en Play al menos una vez antes del test. |

### E7 — Modo Concentración: sincronía completa ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que el overlay funciona correctamente sin el monolito `updatePomoUI()`. |
| **Pasos** | 1. Iniciar el timer. 2. Abrir Modo Concentración. 3. Hacer clic en Pausar (desde el botón del overlay). 4. Cerrar el overlay. 5. Verificar el estado del timer principal. |
| **Resultado esperado** | ✅ Paso 3: reloj del overlay muestra el ícono de pausa y deja de contar. Paso 5: el timer principal también está pausado (botón ▶ visible, sin glow). |
| **Troubleshooting** | Si el timer principal no refleja la pausa: verificar que `togglePomo()` llama a `pomodoroService.pausar()` y que el evento `pomo:estadoCambiado` se emite y el listener lo captura. |

---

## BLOQUE F: LocalStorage — Integridad del Caché

### F1 — Recuperación de estado tras recarga rápida (< 120 s) ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que al recargar la página, el timer retoma desde el tiempo correcto. |
| **Pasos** | 1. Iniciar el timer. 2. Anotar el tiempo que muestra (ej: `22:45`). 3. Recargar la página inmediatamente (F5). |
| **Resultado esperado** | ✅ El timer retoma automáticamente desde aproximadamente `22:45` menos los segundos que tomó recargar la página. El reloj vuelve a correr solo. |
| **Troubleshooting** | Si el timer vuelve a `25:00`: verificar que `localStorage.getItem(LS_KEYS.ESTADO)` tiene el estado guardado y que `init()` lo procesa correctamente. |

### F2 — Clave de LocalStorage única declarada ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que no hay strings de claves de localStorage dispersos en `area-estudio.js`. |
| **Pasos** | 1. Abrir `area-estudio.js` y buscar `cursus_pomo_` con Ctrl+F. |
| **Resultado esperado** | ✅ Las únicas ocurrencias deben ser las importadas como `LS_KEYS.*` (ej: `LS_KEYS.SONIDO_ALARMA`, `LS_KEYS.MODO_ESTRICTO`). No debe haber strings literales del tipo `'cursus_pomo_estado_v2'` en `area-estudio.js`. |
| **Troubleshooting** | Si hay strings literales: reemplazarlos por sus constantes correspondientes del objeto `LS_KEYS` exportado desde `PomodoroStateService.js`. |

---

## BLOQUE G: Pruebas de Regresión General

### G1 — Flujo completo de la vista sin errores ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Smoke test completo de todas las funcionalidades visibles. |
| **Pasos** | 1. Seleccionar materia. 2. Crear una tarea en "Pendiente". 3. Arrastrarla a "En Curso". 4. Agregar un marcador. 5. Iniciar el Pomodoro. 6. Abrir Modo Concentración. 7. Cambiar tema a "Rain". 8. Marcar la tarea como completada desde el overlay. 9. Cerrar el overlay. |
| **Resultado esperado** | ✅ Cada paso funciona sin errores en Console y con el feedback visual correcto (toasts de éxito, actualizaciones del DOM). |

### G2 — Verificación de ausencia de `var` en los nuevos módulos ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Cumplir la directiva del skill `frontend-performance-expert`: prohibición absoluta de `var`. |
| **Pasos** | Buscar `var ` en cada uno de los cuatro archivos JS con Ctrl+F. |
| **Resultado esperado** | ✅ **Cero ocurrencias** de `var ` en `PomodoroStates.js`, `ApiService.js`, `PomodoroStateService.js` y `area-estudio.js`. |

### G3 — Documentación JSDoc completa ✅
| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que todas las funciones públicas tienen JSDoc en español. |
| **Pasos** | Revisar visualmente los tres módulos nuevos buscando funciones sin el bloque `/** ... */` precedente. |
| **Resultado esperado** | ✅ Cada función y clase exportada o pública tiene su bloque `/** @param @returns */` explicando el "por qué" técnico, no solo el "qué". |
