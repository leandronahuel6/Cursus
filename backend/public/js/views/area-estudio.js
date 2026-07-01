/**
 * @fileoverview Orquestador principal del Área de Estudio.
 *
 * Responsabilidades de este módulo:
 * 1. Suscribirse a `pomodoroService` (Observer) y renderizar la UI del
 *    Temporizador Principal y del Modo Concentración de forma independiente.
 * 2. Manejar eventos de usuario del Kanban, Marcadores y Modales, delegando
 *    la lógica de negocio a los servicios importados.
 * 3. Gestionar el Selector de Materia y la carga inicial de datos.
 * 4. Exponer las funciones necesarias en `window.*` para los handlers inline
 *    del HTML generado por Blade y por el propio código de renderizado dinámico.
 *
 * Lo que este archivo NO hace:
 * - Manejar el temporizador directamente (responsabilidad de PomodoroStateService).
 * - Realizar peticiones fetch directamente (responsabilidad de ApiService).
 * - Contener lógica de transición de fases (responsabilidad de PomodoroStates).
 *
 * @module area-estudio
 */

'use strict';

import { pomodoroService, LS_KEYS }    from '../services/PomodoroStateService.js';
import { ApiService }                  from '../services/ApiService.js';
import { ESTADOS_POMO }                from '../models/PomodoroStates.js';
import { playPomoAlarm, unlockPomoAudio } from '../shared/pomo-audio-player.js';

/* ==========================================================================
   CONSTANTES DE PRESENTACIÓN
   ========================================================================== */

/** Circunferencia del ring SVG del temporizador principal (r=65). */
const CIRC_PRINCIPAL = 2 * Math.PI * 65;

/** Circunferencia del ring SVG del Modo Concentración (r=102). */
const CIRC_FOCUS = 2 * Math.PI * 102;

/** Mapeo de columnas del backend a claves de la UI. */
const COLUMNA_DB_TO_UI = { pendiente: 'pending', progreso: 'progress', finalizado: 'done' };

/** Mapeo de claves de la UI a columnas del backend. */
const COLUMNA_UI_TO_DB = { pending: 'pendiente', progress: 'progreso', done: 'finalizado' };

/* ==========================================================================
   ESTADO LOCAL (Kanban, Marcadores, Materia)
   ========================================================================== */

/** Lista activa de tareas en memoria (espejo local de la BD). */
let tasks = [];

/** Lista activa de marcadores en memoria (espejo local de la BD). */
let bookmarks = [];

/** ID de la materia seleccionada actualmente. */
let selectedMateriaId = null;

/** Lista de materias en las que el alumno está cursando. */
let materiasCursando = [];

/* ==========================================================================
   SISTEMA DE AUDIO
   ========================================================================== */

/**
 * Prueba el sonido seleccionado en el modal de configuración del Pomodoro.
 * Se expone en window para ser llamada desde el botón inline del modal.
 * Delega la síntesis a `pomo-audio-player.js` (SRP).
 */
function testSelectedSound() {
    unlockPomoAudio();
    const select = document.getElementById('custom-pomo-sound');
    if (select) playPomoAlarm(select.value);
}

/* ==========================================================================
   SISTEMA DE TOASTS
   ========================================================================== */

/**
 * Muestra una notificación flotante de feedback al usuario.
 * @param {string} message - Texto del mensaje a mostrar.
 * @param {'error'|'success'|'warn'} [type='error'] - Tipo visual del toast.
 */
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'error')   icon = '❌';
    if (type === 'success') icon = '✅';
    if (type === 'warn')    icon = '⚠️';
    toast.innerHTML = `
      <span class="toast-ic">${icon}</span>
      <span>${message}</span>
      <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

/* ==========================================================================
   HELPER HTML
   ========================================================================== */

/**
 * Escapa caracteres especiales de HTML para prevenir XSS en contenido dinámico.
 * @param {string} str - Cadena a escapar.
 * @returns {string} Cadena segura para insertar en innerHTML.
 */
function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

/* ==========================================================================
   RENDERIZADO DEL POMODORO — Suscriptores del Observer
   ========================================================================== */

/**
 * Renderiza el panel del Temporizador Principal basado en el snapshot de estado.
 * Solo toca elementos del temporizador principal; NO conoce el Modo Concentración.
 * @param {{state: object, settings: object, ciclos: object, presetActivo: string}} snapshot
 */
function renderTimerPrincipal(snapshot) {
    const { state, settings, ciclos, presetActivo } = snapshot;

    // --- Reloj texto ---
    const min = Math.floor(state.tiempo_restante / 60);
    const sec = state.tiempo_restante % 60;
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const ptimeEl = document.getElementById('ptime');
    if (ptimeEl) ptimeEl.textContent = timeStr;

    // --- Subtítulo de fase y sesión ---
    const fasePolimorfica = ESTADOS_POMO[state.fase_actual];
    const faseTxt  = fasePolimorfica ? fasePolimorfica.etiqueta() : state.fase_actual;
    const psubEl   = document.getElementById('psub');
    if (psubEl) psubEl.textContent = `${faseTxt} · Sesión ${ciclos.ciclo_actual} de ${settings.sessionsPerCycle}`;

    // --- Progreso del Ring SVG ---
    const totalSec = fasePolimorfica ? fasePolimorfica.duracion(settings) : settings.focusTime * 60;
    const pct      = totalSec > 0 ? state.tiempo_restante / totalSec : 0;
    const rpEl     = document.getElementById('rp');
    if (rpEl) {
        rpEl.style.strokeDasharray  = CIRC_PRINCIPAL;
        rpEl.style.strokeDashoffset = CIRC_PRINCIPAL * (1 - pct);
    }

    // --- Glow del Ring y estado del botón Play ---
    const wrapEl   = document.getElementById('ring-wrap');
    const playBtnEl = document.getElementById('play-btn');
    if (state.estado_reloj === 'corriendo') {
        if (wrapEl)    wrapEl.classList.add('glow');
        if (playBtnEl) { playBtnEl.textContent = '⏸'; playBtnEl.classList.add('running'); }
    } else {
        if (wrapEl)    wrapEl.classList.remove('glow');
        if (playBtnEl) { playBtnEl.textContent = '▶'; playBtnEl.classList.remove('running'); }
    }

    // --- Tabs de presets activos ---
    document.querySelectorAll('.pomo-preset-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtnEl = document.getElementById('preset-' + presetActivo);
    if (activeBtnEl) activeBtnEl.classList.add('active');

    const settingsBtnEl = document.getElementById('pomo-settings-btn');
    if (settingsBtnEl) settingsBtnEl.style.display = 'inline-block';

    // --- Dots de progreso ---
    const dotsContainer = document.getElementById('pomo-dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 1; i <= settings.sessionsPerCycle; i++) {
            const dot = document.createElement('div');
            dot.className = `dot ${i < ciclos.ciclo_actual ? 'done' : ''}`;
            dotsContainer.appendChild(dot);
        }
    }

    // --- Log de sesiones ---
    const logList = document.getElementById('slog-list');
    if (logList) {
        logList.innerHTML = '';
        ciclos.log.forEach(row => {
            const div = document.createElement('div');
            div.className = 'slog-row';
            div.innerHTML = `
              <span class="slog-t">${row.time}</span>
              <span class="slog-d">${row.duration}</span>
              <span class="slog-ok">${row.status}</span>
            `;
            logList.appendChild(div);
        });
    }
}

/**
 * Renderiza el reloj y los controles del Modo Concentración basado en el snapshot.
 * Solo toca elementos del overlay de pantalla completa; NO conoce el timer principal.
 * @param {{state: object, settings: object, ciclos: object}} snapshot
 */
function renderFocusMode(snapshot) {
    const { state, settings, ciclos } = snapshot;
    const focusTimeEl = document.getElementById('focus-time-display');
    if (!focusTimeEl) return; // El overlay puede no estar en el DOM todavía

    const min             = Math.floor(state.tiempo_restante / 60);
    const sec             = state.tiempo_restante % 60;
    const timeStr         = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const fasePolimorfica = ESTADOS_POMO[state.fase_actual];
    const faseTxt         = fasePolimorfica ? fasePolimorfica.etiqueta() : state.fase_actual;

    focusTimeEl.textContent = timeStr;

    const focusPhaseEl = document.getElementById('focus-phase-display');
    if (focusPhaseEl) focusPhaseEl.textContent = faseTxt;

    const focusSessionEl = document.getElementById('focus-session-display');
    if (focusSessionEl) focusSessionEl.textContent = `Sesión ${ciclos.ciclo_actual} de ${settings.sessionsPerCycle}`;

    // --- Tabs de fase activa ---
    const tabEnfoque = document.getElementById('phase-tab-enfoque');
    const tabCorto   = document.getElementById('phase-tab-corto');
    const tabLargo   = document.getElementById('phase-tab-largo');
    if (tabEnfoque && tabCorto && tabLargo) {
        tabEnfoque.classList.remove('active');
        tabCorto.classList.remove('active');
        tabLargo.classList.remove('active');
        if (state.fase_actual === 'enfoque')        tabEnfoque.classList.add('active');
        else if (state.fase_actual === 'descanso_corto') tabCorto.classList.add('active');
        else if (state.fase_actual === 'descanso_largo') tabLargo.classList.add('active');
    }

    // --- Ring SVG del Focus Mode ---
    const totalSec = fasePolimorfica ? fasePolimorfica.duracion(settings) : settings.focusTime * 60;
    const pct      = totalSec > 0 ? state.tiempo_restante / totalSec : 0;
    const rpFocus  = document.getElementById('focus-ring-progress');
    if (rpFocus) {
        rpFocus.style.strokeDasharray  = CIRC_FOCUS;
        rpFocus.style.strokeDashoffset = CIRC_FOCUS * (1 - pct);
        rpFocus.setAttribute('class', `focus-timer-ring-progress ${fasePolimorfica ? fasePolimorfica.colorClass() : 'enfoque'}`);

        // Mejora visual: aplicar clase de fase al overlay usando el estado del payload
        const overlay = document.getElementById('focus-mode-overlay');
        if (overlay) {
            overlay.classList.remove('focus-phase-enfoque', 'focus-phase-corto', 'focus-phase-largo');
            if (state.fase_actual === 'enfoque')        overlay.classList.add('focus-phase-enfoque');
            else if (state.fase_actual === 'descanso_corto') overlay.classList.add('focus-phase-corto');
            else if (state.fase_actual === 'descanso_largo') overlay.classList.add('focus-phase-largo');
        }
    }

    // --- Dots de progreso en el overlay ---
    const focusDotsContainer = document.getElementById('focus-dots');
    if (focusDotsContainer) {
        focusDotsContainer.innerHTML = '';
        for (let i = 1; i <= settings.sessionsPerCycle; i++) {
            const dot = document.createElement('div');
            dot.className = `focus-dot ${i < ciclos.ciclo_actual ? 'done' : ''}`;
            focusDotsContainer.appendChild(dot);
        }
    }

    // --- Botón Play/Pause del overlay ---
    const focusPlayBtn = document.getElementById('focus-play-btn');
    if (focusPlayBtn) {
        if (state.estado_reloj === 'corriendo') {
            focusPlayBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="4" x2="18" y2="20"/><line x1="6" y1="4" x2="6" y2="20"/></svg>`;
            focusPlayBtn.title = 'Pausar';
        } else {
            focusPlayBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
            focusPlayBtn.title = 'Reanudar';
        }
    }
}



/* ==========================================================================
   CONTROLES DEL POMODORO — Handlers de Acciones del Usuario
   ========================================================================== */

/**
 * Alterna entre iniciar/reanudar y pausar el temporizador.
 * Desbloquea el contexto de audio (requiere gesto del usuario) antes de arrancar.
 * La vista únicamente invoca métodos de dominio del servicio; el servicio
 * se encarga internamente de comunicarse con el ApiService.
 */
function togglePomo() {
    const snapshot = pomodoroService.obtenerSnapshot();
    if (snapshot.state.estado_reloj === 'corriendo') {
        pomodoroService.pausar();
    } else {
        // Desbloquear el AudioContext con el gesto del usuario antes de iniciar
        // (delega al módulo de audio centralizado)
        unlockPomoAudio();
        pomodoroService.iniciar();
    }
}

/**
 * Reinicia el temporizador de la fase actual, registrando el progreso parcial si aplica.
 * Solicita confirmación al usuario antes de ejecutar para evitar pérdidas accidentales.
 * El servicio es responsable de comunicar el progreso parcial al ApiService.
 */
function resetPomo() {
    const snapshot = pomodoroService.obtenerSnapshot();
    if (snapshot.state.estado_reloj === 'detenido') return;

    openConfirm(
        '¿Desea reiniciar el temporizador actual? Se registrará el progreso parcial en el servidor.',
        () => {
            pomodoroService.reiniciarFase();
            showToast('Temporizador reiniciado', 'success');
        }
    );
}

/**
 * Reinicia el ciclo completo de sesiones volviendo a la sesión 1.
 * Solicita confirmación para evitar pérdidas accidentales.
 */
function restartPomoCycle() {
    openConfirm(
        '¿Desea reiniciar el ciclo de sesiones? Volverá a la sesión 1 y se perderá el progreso de la sesión actual.',
        () => {
            pomodoroService.reiniciarCiclo();
            showToast('Ciclo de sesiones reiniciado', 'success');
        }
    );
}

/**
 * Salta la fase actual y avanza automáticamente a la siguiente.
 * Si la fase saltada era enfoque con progreso, notifica al backend.
 */
function skipPomo() {
    openConfirm('¿Desea saltar la fase actual?', () => {
        pomodoroService.saltarFase();
        showToast('Fase salteada', 'success');
    });
}

/**
 * Aplica un preset predefinido de tiempos del Pomodoro.
 * @param {'classic'|'deep'|'short'|'custom'} type - Nombre del preset a aplicar.
 */
function setPreset(type) {
    const aplicado = pomodoroService.aplicarPreset(type);
    if (!aplicado) {
        showToast('Pausa el temporizador antes de cambiar de modo', 'warn');
        return;
    }
    showToast(`Preset aplicado: ${type.toUpperCase()}`, 'success');
}

/**
 * Abre el modal de ajustes personalizados del Pomodoro.
 * Bloquea si el reloj está corriendo para evitar cambios durante una sesión.
 */
function openCustomPomoModal() {
    const snapshot = pomodoroService.obtenerSnapshot();
    if (snapshot.state.estado_reloj === 'corriendo') {
        showToast('Pausa el temporizador antes de cambiar ajustes', 'warn');
        return;
    }
    const { settings } = snapshot;
    document.getElementById('custom-pomo-focus').value    = settings.focusTime;
    document.getElementById('custom-pomo-short').value    = settings.shortBreak;
    document.getElementById('custom-pomo-long').value     = settings.longBreak;
    document.getElementById('custom-pomo-sessions').value = settings.sessionsPerCycle;
    document.getElementById('custom-pomo-cycles').value   = settings.totalCycles || 'infinite';

    const savedSound = localStorage.getItem(LS_KEYS.SONIDO_ALARMA) || 'chime';
    const soundSelect = document.getElementById('custom-pomo-sound');
    if (soundSelect) soundSelect.value = savedSound;

    const strictToggle = document.getElementById('pomo-strict-toggle');
    if (strictToggle) strictToggle.checked = localStorage.getItem(LS_KEYS.MODO_ESTRICTO) === 'true';

    document.getElementById('pomo-validation-error').style.display = 'none';
    document.getElementById('pomo-custom-modal').classList.add('show');
}

/** Cierra el modal de ajustes personalizados del Pomodoro. */
function closeCustomPomoModal() {
    document.getElementById('pomo-custom-modal').classList.remove('show');
}

/**
 * Lee, valida y persiste la configuración personalizada del Pomodoro.
 * Muestra errores de validación inline sin cerrar el modal.
 */
function saveCustomPomoSettings() {
    const focus    = parseInt(document.getElementById('custom-pomo-focus').value);
    const short    = parseInt(document.getElementById('custom-pomo-short').value);
    const long     = parseInt(document.getElementById('custom-pomo-long').value);
    const sessions = parseInt(document.getElementById('custom-pomo-sessions').value);
    const cycleVal = document.getElementById('custom-pomo-cycles').value;
    const cycles   = cycleVal === 'infinite' ? null : parseInt(cycleVal);

    const errorDiv = document.getElementById('pomo-validation-error');
    errorDiv.style.display = 'none';

    // --- Validaciones de rango ---
    if (isNaN(focus) || focus < 1 || focus > 90) {
        errorDiv.textContent = 'El enfoque debe estar entre 1 y 90 minutos.';
        errorDiv.style.display = 'block';
        return;
    }
    if (isNaN(short) || short < 1 || short > 30) {
        errorDiv.textContent = 'El descanso corto debe estar entre 1 y 30 minutos.';
        errorDiv.style.display = 'block';
        return;
    }
    if (isNaN(long) || long < 5 || long > 60) {
        errorDiv.textContent = 'El descanso largo debe estar entre 5 y 60 minutos.';
        errorDiv.style.display = 'block';
        return;
    }
    if (isNaN(sessions) || sessions < 1 || sessions > 8) {
        errorDiv.textContent = 'Las sesiones por ciclo deben ser entre 1 y 8.';
        errorDiv.style.display = 'block';
        return;
    }

    // --- Restricciones de negocio ---
    if (short >= focus) {
        errorDiv.textContent = 'Restricción: El descanso corto debe ser estrictamente menor que el tiempo de enfoque.';
        errorDiv.style.display = 'block';
        return;
    }
    if (long < short) {
        errorDiv.textContent = 'Restricción: El descanso largo debe ser mayor o igual que el descanso corto.';
        errorDiv.style.display = 'block';
        return;
    }

    const soundSelect  = document.getElementById('custom-pomo-sound');
    const strictToggle = document.getElementById('pomo-strict-toggle');
    const sonidoAlarma = soundSelect ? soundSelect.value : 'chime';
    const modoEstricto = strictToggle ? strictToggle.checked : false;

    pomodoroService.guardarAjustesPersonalizados(
        { focusTime: focus, shortBreak: short, longBreak: long, sessionsPerCycle: sessions, totalCycles: cycles },
        sonidoAlarma,
        modoEstricto
    );

    closeCustomPomoModal();
    showToast('Ajustes personalizados aplicados con éxito', 'success');
}

/* ==========================================================================
   KANBAN — Estado y Carga de Datos
   ========================================================================== */

/**
 * Carga el estado completo de la aplicación (tareas y marcadores) desde la BD.
 * Los datos de LocalStorage actúan como caché complementaria para datos locales
 * (descripción, subtareas) que no están en el backend todavía.
 */
async function loadAppState() {
    if (!selectedMateriaId) {
        tasks     = [];
        bookmarks = [];
        renderKanban();
        renderBookmarks();
        return;
    }

    const localTasks = localStorage.getItem('cursus_tasks_v2');
    const savedLocalTasks = localTasks ? JSON.parse(localTasks) : [];

    // Cargar tareas desde la BD
    try {
        const dbTasks = await ApiService.getTareas(selectedMateriaId);
        tasks = dbTasks.map(t => {
            const localMatch = savedLocalTasks.find(lt => lt.id == t.id);
            return {
                id:          String(t.id),
                column:      COLUMNA_DB_TO_UI[t.columna] || 'pending',
                title:       t.titulo,
                dueDate:     t.fecha_vencimiento ? t.fecha_vencimiento.substring(0, 16) : '',
                description: localMatch ? localMatch.description : '',
                subtasks:    localMatch ? localMatch.subtasks : [],
            };
        });
    } catch (e) {
        console.error('Error cargando tareas DB', e);
        tasks = [];
    }

    // Cargar marcadores desde la BD
    try {
        const dbBookmarks = await ApiService.getMarcadores(selectedMateriaId);
        bookmarks = dbBookmarks.map(b => ({
            id:    String(b.id),
            url:   b.url,
            title: b.titulo || b.url,
        }));
    } catch (e) {
        console.error('Error cargando marcadores DB', e);
        bookmarks = [];
    }

    renderKanban();
    renderBookmarks();
}

/**
 * Persiste la lista de tareas actual en LocalStorage como caché local.
 * Solo guarda los campos que no están en la BD (descripción y subtareas).
 */
function saveTasksToLocal() {
    localStorage.setItem('cursus_tasks_v2', JSON.stringify(tasks));
}

/** Persiste la lista de marcadores en LocalStorage (caché de respaldo). */
function saveBookmarksToLocal() {
    localStorage.setItem('cursus_bookmarks_v2', JSON.stringify(bookmarks));
}

/* ==========================================================================
   KANBAN — Renderizado
   ========================================================================== */

/**
 * Renderiza las tres columnas del tablero Kanban con las tarjetas actuales.
 * Actualiza también el componente de meta activa del Modo Concentración.
 */
function renderKanban() {
    const cols = ['pending', 'progress', 'done'];
    cols.forEach(col => {
        const container = document.getElementById(`cards-${col}`);
        if (!container) return;
        container.innerHTML = '';
        const colTasks = tasks.filter(t => t.column === col);
        const cntEl    = document.getElementById(`cnt-${col}`);
        if (cntEl) cntEl.textContent = colTasks.length;

        colTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'kbcard';
            card.id        = task.id;
            card.draggable = true;

            card.addEventListener('dragstart', (e) => dragStart(e, task.id));
            card.addEventListener('dragend', dragEnd);
            card.addEventListener('click', (e) => {
                if (e.target.closest('.kb-del')) return;
                openTaskModal(task.id);
            });

            // --- Meta indicators (fecha y subtareas) ---
            let metaHtml = '';
            if (task.dueDate) {
                const [datePart, timePart] = task.dueDate.split('T');
                const [y, m, d] = datePart.split('-');
                const date       = new Date(y, m - 1, d);
                const currentYear = new Date().getFullYear();
                let dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                if (date.getFullYear() !== currentYear) dateStr += ` ${date.getFullYear()}`;
                if (timePart) dateStr += ` · ${timePart.substring(0, 5)}`;
                const today    = new Date(); today.setHours(0, 0, 0, 0);
                const isOverdue = date < today && task.column !== 'done';
                metaHtml += `
                  <div class="kb-meta ${isOverdue ? 'urg' : ''}">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 1v2M11 1v2M2 6h12"/></svg>
                    <span>Vence ${dateStr}</span>
                  </div>
                `;
            }
            if (task.subtasks && task.subtasks.length > 0) {
                const completed = task.subtasks.filter(s => s.completed).length;
                metaHtml += `
                  <div class="kb-meta">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="10" height="10" rx="1.5"/><path d="M6 8l1.5 1.5L10 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>Subtareas ${completed}/${task.subtasks.length}</span>
                  </div>
                `;
            }

            card.innerHTML = `
              <div class="kb-title">${escapeHTML(task.title)}</div>
              <div class="kb-meta-wrap">${metaHtml}</div>
              <button class="kb-del" title="Eliminar tarea">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h10M5 6v7a1 1 0 001 1h4a1 1 0 001-1V6M6 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5"/></svg>
              </button>
            `;
            card.querySelector('.kb-del').addEventListener('click', () => {
                openConfirm(`¿Desea eliminar la tarea "${task.title}"?`, () => deleteTask(task.id));
            });
            container.appendChild(card);
        });
    });
    if (typeof updateFocusActiveGoal === 'function') updateFocusActiveGoal();
}

/* ==========================================================================
   KANBAN — Creación Inline
   ========================================================================== */

/**
 * Muestra el formulario inline de creación rápida de tareas en una columna.
 * @param {string} col - Columna destino ('pending' | 'progress' | 'done').
 */
function showInlineAddCardForm(col) {
    cancelAllInlineForms();
    const container = document.getElementById(`add-form-container-${col}`);
    const btnAdd    = document.getElementById(`btn-add-${col}`);
    if (!container || !btnAdd) return;
    btnAdd.style.display = 'none';

    const form = document.createElement('div');
    form.className = 'kb-add-form';
    form.id        = `inline-form-${col}`;
    form.innerHTML = `
      <textarea class="kb-add-inp" id="inline-inp-${col}" placeholder="Introduce el título de la tarea..." required></textarea>
      <div class="kb-add-btns">
        <button class="kb-add-btn-save" onclick="window.saveInlineCard('${col}')">Añadir tarea</button>
        <button class="kb-add-btn-cancel" onclick="window.cancelInlineAddCard('${col}')">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>
        </button>
      </div>
    `;
    container.appendChild(form);

    const textarea = form.querySelector('textarea');
    textarea.focus();
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); saveInlineCard(col); }
    });
    // Guardado/cancelado implícito al perder foco (con delay para no pisar clics explícitos)
    textarea.addEventListener('blur', () => {
        setTimeout(() => {
            const activeEl = document.activeElement;
            if (activeEl && activeEl.closest(`#inline-form-${col}`)) return;
            if (textarea.value.trim()) saveInlineCard(col);
            else cancelInlineAddCard(col);
        }, 150);
    });
}

/**
 * Cancela y elimina el formulario inline de una columna específica.
 * @param {string} col - Columna del formulario a cancelar.
 */
function cancelInlineAddCard(col) {
    const form = document.getElementById(`inline-form-${col}`);
    if (form) form.remove();
    const btn = document.getElementById(`btn-add-${col}`);
    if (btn) btn.style.display = 'block';
}

/** Cancela todos los formularios inline activos en las tres columnas. */
function cancelAllInlineForms() {
    ['pending', 'progress', 'done'].forEach(col => cancelInlineAddCard(col));
}

/**
 * Guarda la tarjeta del formulario inline creando la tarea en la BD.
 * @param {string} col - Columna de destino.
 */
function saveInlineCard(col) {
    const input = document.getElementById(`inline-inp-${col}`);
    if (!input) return;
    const title = input.value.trim();
    if (!title) { cancelInlineAddCard(col); return; }
    if (!selectedMateriaId) { showToast('Elegí una materia primero', 'warn'); return; }

    cancelInlineAddCard(col);

    ApiService.createTarea(selectedMateriaId, title, COLUMNA_UI_TO_DB[col])
        .then(() => {
            loadAppState();
            showToast('Tarea agregada exitosamente', 'success');
        })
        .catch(() => showToast('Error creando tarea', 'error'));
}

/**
 * Elimina una tarea optimísticamente de la UI y luego sincroniza con la BD.
 * En caso de error de red, muestra un toast (no revierte el borrado local
 * porque el usuario ya confirmó la acción en el modal de confirmación previo).
 * @param {string} id - ID de la tarea a eliminar.
 */
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasksToLocal();
    renderKanban();

    ApiService.deleteTarea(id)
        .then(() => showToast('Tarea eliminada', 'success'))
        .catch(() => showToast('Error al eliminar la tarea en el servidor', 'error'));
}

/* ==========================================================================
   DRAG & DROP — Kanban con Optimistic UI y Rollback Visual
   ========================================================================== */

let dragId            = null;
let dragOriginalCol   = null;
let dragOriginalSibling = null;

/**
 * Inicia el drag de una tarjeta, guardando su posición original para rollback.
 * @param {DragEvent} e
 * @param {string} id - ID de la tarjeta arrastrada.
 */
function dragStart(e, id) {
    dragId = id;
    const card        = document.getElementById(id);
    const taskObj     = tasks.find(t => t.id === id);
    dragOriginalCol   = taskObj ? taskObj.column : null;
    dragOriginalSibling = card ? card.nextSibling : null;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (card) card.classList.add('dragging'); }, 0);
}

/** Limpia la clase visual de arrastre al soltar. */
function dragEnd(e) {
    e.target.classList.remove('dragging');
}

/** Permite el drop sobre una columna destino. */
function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add('over');
}

/** Limpia el estilo de hover al salir de la zona de drop. */
function leaveDrop(e) {
    e.currentTarget.classList.remove('over');
}

/**
 * Maneja el drop de una tarjeta en una columna destino con UI optimista y rollback.
 * @param {DragEvent} e
 * @param {string} col - Columna destino ('pending' | 'progress' | 'done').
 */
function dropCard(e, col) {
    e.preventDefault();
    e.currentTarget.classList.remove('over');
    if (!dragId) return;

    const card          = document.getElementById(dragId);
    const taskObj       = tasks.find(t => t.id === dragId);
    const cardsContainer = document.getElementById(`cards-${col}`);
    if (!card || !taskObj || !cardsContainer) return;

    // Mover en el DOM optimísticamente
    cardsContainer.appendChild(card);
    const oldCol  = taskObj.column;
    taskObj.column = col;
    updateCounts();

    const currentDragId = dragId;
    ApiService.moveTarea(currentDragId, COLUMNA_UI_TO_DB[col])
        .then(() => {
            saveTasksToLocal();
            renderKanban();
        })
        .catch(() => {
            // Rollback: devolver la tarjeta a su posición original
            taskObj.column = oldCol;
            updateCounts();
            const origContainer = document.getElementById(`cards-${oldCol}`);
            if (origContainer) {
                if (dragOriginalSibling && dragOriginalSibling.parentNode === origContainer) {
                    origContainer.insertBefore(card, dragOriginalSibling);
                } else {
                    origContainer.appendChild(card);
                }
            }
            card.classList.add('kb-error-shake');
            setTimeout(() => card.classList.remove('kb-error-shake'), 350);
            showToast('Error moviendo tarea', 'error');
        });

    dragId = null;
}

/** Actualiza los contadores numéricos de las tres columnas del Kanban. */
function updateCounts() {
    ['pending', 'progress', 'done'].forEach(col => {
        const el = document.getElementById(`cnt-${col}`);
        if (el) el.textContent = tasks.filter(t => t.column === col).length;
    });
}

/* ==========================================================================
   MODAL DE EDICIÓN DE TAREA
   ========================================================================== */

let currentEditingTaskId = null;
let subtasksTempList     = [];

/**
 * Abre el modal de edición de una tarea cargando sus datos actuales.
 * @param {string} id - ID de la tarea a editar.
 */
function openTaskModal(id) {
    currentEditingTaskId = id;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('task-modal-col-name').textContent = translateCol(task.column);
    document.getElementById('task-modal-title').value          = task.title;

    let dueStr = '';
    if (task.dueDate) {
        dueStr = task.dueDate.length === 10 ? task.dueDate + 'T00:00' : task.dueDate.substring(0, 16);
    }
    document.getElementById('task-modal-due').value  = dueStr;
    document.getElementById('task-modal-desc').value = task.description || '';

    subtasksTempList = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    renderModalSubtasks();
    hideSubtaskAddInput();
    document.getElementById('task-modal').classList.add('show');
}

/** Cierra el modal de edición de tarea y limpia el ID de edición activo. */
function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('show');
    currentEditingTaskId = null;
}

/**
 * Traduce la clave de columna a texto legible en español.
 * @param {string} col - Clave interna ('pending' | 'progress' | 'done').
 * @returns {string} Etiqueta legible.
 */
function translateCol(col) {
    const map = { pending: 'Pendiente', progress: 'En Curso', done: 'Finalizado' };
    return map[col] || col;
}

/**
 * Autocompleta la hora a 23:59 si el usuario seleccionó solo fecha sin hora.
 * @param {HTMLInputElement} input - El input datetime-local que disparó el evento.
 */
function handleDateAutocomplete(input) {
    if (!input.value) return;
    const parts = input.value.split('T');
    if (parts.length === 2 && parts[1] === '00:00') {
        input.value = `${parts[0]}T23:59:00`;
    }
}

/** Renderiza la lista de subtareas en el modal de edición de tarea. */
function renderModalSubtasks() {
    const list = document.getElementById('task-modal-subtasks-list');
    if (!list) return;
    list.innerHTML = '';
    subtasksTempList.forEach((sub, index) => {
        const item = document.createElement('div');
        item.className = 'subtask-item';
        item.innerHTML = `
          <input type="checkbox" class="subtask-chk" ${sub.completed ? 'checked' : ''} onchange="window.toggleSubtaskStatus(${index})">
          <span class="subtask-txt ${sub.completed ? 'done' : ''}" contenteditable="true" onblur="window.saveSubtaskText(${index}, this)" onkeydown="window.handleSubtaskEnter(event, ${index}, this)">${escapeHTML(sub.text)}</span>
          <div class="subtask-del" title="Eliminar subtarea" onclick="window.deleteSubtask(${index})">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h10M5 6v7a1 1 0 001 1h4a1 1 0 001-1V6M6 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5"/></svg>
          </div>
        `;
        list.appendChild(item);
    });
}

/**
 * Alterna el estado completado de una subtarea y sincroniza con la BD.
 * @param {number} index - Índice de la subtarea en la lista temporal.
 */
function toggleSubtaskStatus(index) {
    subtasksTempList[index].completed = !subtasksTempList[index].completed;
    renderModalSubtasks();
    saveTaskSubtasksStateOnly();
}

/**
 * Guarda el texto editado de una subtarea (llamado en onblur del contenteditable).
 * @param {number} index - Índice de la subtarea.
 * @param {HTMLElement} element - El elemento contenteditable.
 */
function saveSubtaskText(index, element) {
    const newText = element.textContent.trim();
    if (newText) {
        subtasksTempList[index].text = newText;
    } else {
        element.textContent = subtasksTempList[index].text;
    }
    saveTaskSubtasksStateOnly();
}

/**
 * Intercepta la tecla Enter en subtareas editables para confirmar sin nueva línea.
 * @param {KeyboardEvent} e
 * @param {number} index
 * @param {HTMLElement} element
 */
function handleSubtaskEnter(e, index, element) {
    if (e.key === 'Enter') { e.preventDefault(); element.blur(); }
}

/**
 * Elimina una subtarea de la lista temporal y sincroniza con la BD.
 * @param {number} index - Índice de la subtarea a eliminar.
 */
function deleteSubtask(index) {
    subtasksTempList.splice(index, 1);
    renderModalSubtasks();
    saveTaskSubtasksStateOnly();
}

/** Muestra el campo de entrada para agregar una nueva subtarea. */
function showSubtaskAddInput() {
    document.getElementById('subtask-add-form').style.display  = 'flex';
    document.getElementById('btn-show-subtask-add').style.display = 'none';
    const input = document.getElementById('subtask-new-txt');
    input.value = '';
    input.focus();
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewSubtask(); } };
}

/** Oculta el campo de entrada de nueva subtarea. */
function hideSubtaskAddInput() {
    document.getElementById('subtask-add-form').style.display      = 'none';
    document.getElementById('btn-show-subtask-add').style.display  = 'inline-flex';
}

/** Crea y guarda una nueva subtarea desde el input de adición. */
function saveNewSubtask() {
    const input = document.getElementById('subtask-new-txt');
    const text  = input.value.trim();
    if (!text) { hideSubtaskAddInput(); return; }
    subtasksTempList.push({ id: `s_${Date.now()}`, text, completed: false });
    renderModalSubtasks();
    hideSubtaskAddInput();
    saveTaskSubtasksStateOnly();
}

/**
 * Persiste el estado de las subtareas en la tarea en memoria y en la BD (optimista).
 * En caso de error de red, aplica rollback al estado anterior.
 */
function saveTaskSubtasksStateOnly() {
    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) return;

    const oldSubtasks  = JSON.parse(JSON.stringify(task.subtasks || []));
    task.subtasks      = JSON.parse(JSON.stringify(subtasksTempList));
    saveTasksToLocal();
    renderKanban();

    ApiService.updateSubtareas(task.id, task.subtasks)
        .catch(() => {
            task.subtasks      = oldSubtasks;
            subtasksTempList   = JSON.parse(JSON.stringify(oldSubtasks));
            saveTasksToLocal();
            renderKanban();
            renderModalSubtasks();
            showToast('Error sincronizando subtareas', 'error');
        });
}

/**
 * Guarda los campos base (título, fecha, descripción) de la tarea editada.
 * Aplica optimistic update con rollback si la petición falla.
 */
function saveTaskDetails() {
    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) return;

    const newTitle = document.getElementById('task-modal-title').value.trim();
    if (!newTitle) { showToast('El título de la tarea no puede estar vacío', 'error'); return; }

    const oldTitle   = task.title;
    const oldDueDate = task.dueDate;
    const oldDesc    = task.description;

    task.title       = newTitle;
    task.dueDate     = document.getElementById('task-modal-due').value;
    task.description = document.getElementById('task-modal-desc').value.trim();

    saveTasksToLocal();
    renderKanban();
    closeTaskModal();

    ApiService.updateTarea(task.id, { titulo: task.title, fecha_vencimiento: task.dueDate || null })
        .then(() => {
            loadAppState();
            showToast('Tarea actualizada exitosamente', 'success');
        })
        .catch(() => {
            task.title       = oldTitle;
            task.dueDate     = oldDueDate;
            task.description = oldDesc;
            saveTasksToLocal();
            renderKanban();
            showToast('Error actualizando tarea', 'error');
        });
}

/**
 * Elimina la tarea actualmente abierta en el modal, solicitando confirmación.
 */
function deleteTaskFromModal() {
    if (!currentEditingTaskId) return;
    openConfirm('¿Desea eliminar esta tarea de forma permanente?', () => {
        const id = currentEditingTaskId;
        closeTaskModal();
        deleteTask(id);
    });
}

/* ==========================================================================
   BÓVEDA DE MARCADORES
   ========================================================================== */

/** Renderiza la lista completa de marcadores. */
function renderBookmarks() {
    const container = document.getElementById('bm-list');
    if (!container) return;
    container.innerHTML = '';

    bookmarks.forEach(bm => {
        const card = document.createElement('div');
        card.className = 'bm-item';
        card.id        = 'bm-item-' + bm.id;

        let hostname = '';
        try { hostname = new URL(bm.url).hostname; } catch (_) { hostname = 'link'; }
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

        card.innerHTML = `
          <img class="bm-ic" src="${faviconUrl}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22%234f46e5%22><circle cx=%228%22 cy=%228%22 r=%226%22/></svg>'" alt="Logo">
          <div class="bm-inf">
            <div class="bm-name">${escapeHTML(bm.title || bm.url)}</div>
            <div class="bm-url">${escapeHTML(bm.url)}</div>
          </div>
          <div class="bm-edit-row">
            <input type="text" class="bm-edit-inp" id="bm-edit-title-${bm.id}" value="${escapeHTML(bm.title || '')}" placeholder="Título">
            <input type="url" class="bm-edit-inp url" id="bm-edit-url-${bm.id}" value="${escapeHTML(bm.url)}" placeholder="https://...">
            <div class="bm-edit-btns">
              <button class="bm-act-btn" onclick="window.saveBookmarkInlineEdit('${bm.id}')" title="Guardar">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8l3 3 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button class="bm-act-btn" onclick="window.cancelBookmarkInlineEdit('${bm.id}')" title="Cancelar">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>
              </button>
            </div>
          </div>
          <div class="bm-actions">
            <a class="bm-act-btn" href="${bm.url}" target="_blank" rel="noopener" title="Abrir enlace">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v4m0-4H8m4 0L6 10" stroke-linecap="round"/><circle cx="8" cy="8" r="6"/></svg>
            </a>
            <button class="bm-act-btn" onclick="window.startBookmarkInlineEdit('${bm.id}')" title="Editar marcador">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.5a1.5 1.5 0 012 2l-8 8L2 13l.5-3.5 8-8z"/></svg>
            </button>
            <button class="bm-act-btn del" onclick="window.deleteBookmark('${bm.id}')" title="Eliminar marcador">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h10M5 6v7a1 1 0 001 1h4a1 1 0 001-1V6M6 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5"/></svg>
            </button>
          </div>
        `;
        container.appendChild(card);
    });
}

/** Agrega un nuevo marcador leyendo los inputs del formulario de la bóveda. */
function addBookmark() {
    const urlInput = document.getElementById('bm-url');
    const titleInput = document.getElementById('bm-title');
    const btnSave    = document.getElementById('btn-bm-save');
    const url   = urlInput.value.trim();
    const title = titleInput.value.trim();

    if (!url) { showToast('Introduce una dirección URL válida', 'error'); return; }
    if (!selectedMateriaId) { showToast('Elegí una materia primero', 'warn'); return; }

    btnSave.disabled    = true;
    btnSave.textContent = 'Guardando...';

    ApiService.createMarcador(selectedMateriaId, url, title || null)
        .then(() => {
            loadAppState();
            urlInput.value   = '';
            titleInput.value = '';
            showToast('Marcador agregado con éxito', 'success');
        })
        .catch(() => showToast('Error al guardar marcador', 'error'))
        .finally(() => {
            btnSave.disabled    = false;
            btnSave.textContent = 'Guardar';
        });
}

/** Activa el modo de edición inline de un marcador. */
function startBookmarkInlineEdit(id) {
    const item = document.getElementById('bm-item-' + id);
    if (item) item.classList.add('editing');
}

/** Cancela la edición inline de un marcador y descarta los cambios. */
function cancelBookmarkInlineEdit(id) {
    const item = document.getElementById('bm-item-' + id);
    if (item) item.classList.remove('editing');
}

/**
 * Guarda los cambios de edición inline de un marcador con optimistic update y rollback.
 * @param {string} id - ID del marcador.
 */
function saveBookmarkInlineEdit(id) {
    const bm       = bookmarks.find(b => b.id === id);
    if (!bm) return;
    const newTitle = document.getElementById(`bm-edit-title-${id}`).value.trim();
    const newUrl   = document.getElementById(`bm-edit-url-${id}`).value.trim();
    if (!newUrl) { showToast('La URL no puede quedar vacía', 'error'); return; }

    const oldTitle = bm.title;
    const oldUrl   = bm.url;
    bm.title = newTitle;
    bm.url   = newUrl;
    saveBookmarksToLocal();
    renderBookmarks();

    ApiService.updateMarcador(id, { url: newUrl, titulo: newTitle })
        .then(() => {
            loadAppState();
            showToast('Marcador actualizado', 'success');
        })
        .catch(() => {
            bm.title = oldTitle;
            bm.url   = oldUrl;
            saveBookmarksToLocal();
            renderBookmarks();
            showToast('Error al actualizar marcador', 'error');
        });
}

/**
 * Elimina un marcador con remoción optimista y rollback en caso de error.
 * @param {string} id - ID del marcador a eliminar.
 */
function deleteBookmark(id) {
    const bm    = bookmarks.find(b => b.id === id);
    if (!bm) return;
    const index = bookmarks.indexOf(bm);
    bookmarks.splice(index, 1);
    saveBookmarksToLocal();
    renderBookmarks();

    ApiService.deleteMarcador(id)
        .then(() => {
            loadAppState();
            showToast('Marcador eliminado', 'success');
        })
        .catch(() => {
            bookmarks.splice(index, 0, bm);
            saveBookmarksToLocal();
            renderBookmarks();
            showToast('Error al eliminar marcador', 'error');
        });
}

/* ==========================================================================
   SELECTOR DE MATERIA
   ========================================================================== */

/** Carga la lista de materias del alumno y selecciona la última utilizada. */
async function loadMateriasCursando() {
    try {
        const data       = await ApiService.getMaterias();
        materiasCursando = data.filter(m => m.estado === 'cursando');
    } catch (e) {
        console.error(e);
        materiasCursando = [];
    }

    renderMateriaDropdown();

    if (materiasCursando.length === 0) {
        const nameEl  = document.getElementById('mat-selector-name');
        const badgeEl = document.getElementById('mat-selector-badge');
        if (nameEl)  nameEl.textContent  = 'Sin materias en curso';
        if (badgeEl) badgeEl.textContent = '—';
        selectedMateriaId = null;
        localStorage.removeItem('cursus_selected_materia');
        return;
    }

    const saved       = parseInt(localStorage.getItem('cursus_selected_materia'), 10);
    const savedValida = materiasCursando.find(m => m.id === saved);
    selectMateria(savedValida ? saved : materiasCursando[0].id);
}

/** Renderiza las opciones del dropdown de selección de materia. */
function renderMateriaDropdown() {
    const dropdown = document.getElementById('materia-dropdown');
    if (!dropdown) return;
    dropdown.innerHTML = '';

    if (materiasCursando.length === 0) {
        dropdown.innerHTML = `<div class="mat-dropdown-empty">No estás cursando ninguna materia. Anotate desde "Mis Materias" para poder estudiar acá.</div>`;
        return;
    }
    materiasCursando.forEach(m => {
        const item = document.createElement('div');
        item.className = `mat-dropdown-item ${m.id === selectedMateriaId ? 'active' : ''}`;
        item.innerHTML = `<span>${m.nombre}</span>${m.id === selectedMateriaId ? '<span>✓</span>' : ''}`;
        item.onclick   = () => selectMateria(m.id);
        dropdown.appendChild(item);
    });
}

/**
 * Abre o cierra el dropdown de selección de materia.
 * @param {Event} [e] - El evento de click (se detiene la propagación si existe).
 */
function toggleMateriaDropdown(e) {
    if (e) e.stopPropagation();
    document.getElementById('materia-dropdown').classList.toggle('open');
    document.getElementById('mat-dropdown-trigger').classList.toggle('open');
}

/** Cierra el dropdown de materia. */
function closeMateriaDropdown() {
    document.getElementById('materia-dropdown').classList.remove('open');
    document.getElementById('mat-dropdown-trigger').classList.remove('open');
}

/**
 * Selecciona una materia, actualiza la UI y recarga el estado de la aplicación.
 * @param {number} id - ID de la materia a seleccionar.
 */
function selectMateria(id) {
    selectedMateriaId = id;
    localStorage.setItem('cursus_selected_materia', String(id));

    const materia = materiasCursando.find(m => m.id === id);
    const nameEl  = document.getElementById('mat-selector-name');
    const mobNameEl = document.getElementById('mob-materia-name');
    const mobMetaEl = document.getElementById('mob-materia-meta');
    if (nameEl)   nameEl.textContent   = materia ? materia.nombre : '—';
    if (mobNameEl) mobNameEl.textContent = materia ? materia.nombre : '—';
    if (mobMetaEl) mobMetaEl.textContent = materia ? `Nivel ${materia.nivel ?? '—'}` : '—';

    // Limpiar stats mientras se carga el resumen real
    const hoursEl = document.getElementById('chip-stat-hours');
    const pomosEl = document.getElementById('chip-stat-pomos');
    if (hoursEl) hoursEl.textContent = '—';
    if (pomosEl) pomosEl.textContent = '—';

    renderMateriaDropdown();
    closeMateriaDropdown();
    loadAppState();
    loadMateriaResumen();
}

/**
 * Carga el resumen estadístico de Pomodoro de la materia seleccionada
 * y sincroniza el log de ciclos del servicio con los datos reales del backend.
 */
async function loadMateriaResumen() {
    if (!selectedMateriaId) return;
    try {
        const data    = await ApiService.getMateriaResumen(selectedMateriaId);
        const hoursEl = document.getElementById('chip-stat-hours');
        const pomosEl = document.getElementById('chip-stat-pomos');
        if (hoursEl) hoursEl.textContent = `${data.horas_semana}h`;
        if (pomosEl) pomosEl.textContent = data.sesiones_totales;

        // Sincronizar el servicio para que el Observer actualice el log del timer
        pomodoroService.sincronizarCiclosConBackend({
            sesiones_completadas_hoy: data.sesiones_hoy.length,
            log: data.sesiones_hoy.map(s => ({
                time:     s.hora,
                duration: `${Math.floor(s.duracion_segundos / 60)}:00`,
                status:   '✓ Completada',
            })),
        });
    } catch (e) {
        console.error('Error cargando resumen de materia', e);
    }
}

/* ==========================================================================
   MODO CONCENTRACIÓN — Lógica de Overlay
   ========================================================================== */

let activeFocusTaskIndex = 0;

/**
 * Actualiza la meta (tarea activa) mostrada en el panel del Modo Concentración.
 * Se llama automáticamente al renderizar el Kanban para mantener sincronía.
 */
function updateFocusActiveGoal() {
    const focusGoalTitle   = document.getElementById('focus-goal-title');
    const completeBtn      = document.getElementById('focus-goal-complete-btn');
    const subtasksToggleBtn = document.getElementById('focus-subtasks-toggle');
    const prevBtn          = document.getElementById('focus-goal-prev-btn');
    const nextBtn          = document.getElementById('focus-goal-next-btn');
    if (!focusGoalTitle) return;

    const progressTasks = tasks.filter(t => t.column === 'progress');
    if (progressTasks.length > 0) {
        if (activeFocusTaskIndex >= progressTasks.length) activeFocusTaskIndex = 0;
        const activeTask = progressTasks[activeFocusTaskIndex];
        focusGoalTitle.textContent = activeTask.title;
        focusGoalTitle.title       = activeTask.title;
        if (completeBtn)       completeBtn.style.display      = 'inline-flex';
        if (subtasksToggleBtn) subtasksToggleBtn.style.display = 'inline-flex';
        if (prevBtn) prevBtn.style.display = progressTasks.length > 1 ? 'inline-flex' : 'none';
        if (nextBtn) nextBtn.style.display = progressTasks.length > 1 ? 'inline-flex' : 'none';
        renderFocusSubtasks();
    } else {
        activeFocusTaskIndex       = 0;
        focusGoalTitle.textContent = 'Ninguna tarea en curso';
        focusGoalTitle.title       = '';
        if (completeBtn)       completeBtn.style.display       = 'none';
        if (subtasksToggleBtn) subtasksToggleBtn.style.display  = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        const drawer = document.getElementById('focus-subtasks-drawer');
        if (drawer) drawer.classList.remove('show');
    }
}

/**
 * Abre el overlay de Modo Concentración, carga volúmenes y tema guardados,
 * y fuerza un render del reloj y la meta activa.
 */
function enterFocusMode() {
    const overlay = document.getElementById('focus-mode-overlay');
    if (!overlay) return;

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Inicializar mezclador de sonido ambiente (volúmenes previos)
    const volRainEl   = document.getElementById('focus-vol-rain');
    const volFireEl   = document.getElementById('focus-vol-fire');
    const volForestEl = document.getElementById('focus-vol-forest');
    const volOceanEl  = document.getElementById('focus-vol-ocean');
    if (volRainEl)   { volRainEl.value   = window.pomoAmbientSynth.rainVol;   updateMixerIcon('rain',   window.pomoAmbientSynth.rainVol); }
    if (volFireEl)   { volFireEl.value   = window.pomoAmbientSynth.fireVol;   updateMixerIcon('fire',   window.pomoAmbientSynth.fireVol); }
    if (volForestEl) { volForestEl.value = window.pomoAmbientSynth.forestVol; updateMixerIcon('forest', window.pomoAmbientSynth.forestVol); }
    if (volOceanEl)  { volOceanEl.value  = window.pomoAmbientSynth.oceanVol;  updateMixerIcon('ocean',  window.pomoAmbientSynth.oceanVol); }

    const savedTheme = localStorage.getItem('cursus_pomo_focus_theme') || 'aurora';
    changeFocusTheme(savedTheme);
    updateFocusActiveGoal();

    // Forzar render inmediato del reloj sin esperar al próximo tick del servicio
    renderFocusMode(pomodoroService.obtenerSnapshot());

    showToast('Entrando en Modo Concentración ✨', 'success');
}

/**
 * Cierra el overlay de Modo Concentración.
 * En Modo Estricto con reloj corriendo, solicita confirmación y registra la falla.
 */
function exitFocusMode() {
    const strictMode = localStorage.getItem(LS_KEYS.MODO_ESTRICTO) === 'true';
    const snapshot   = pomodoroService.obtenerSnapshot();
    if (strictMode && snapshot.state.estado_reloj === 'corriendo') {
        openConfirm(
            '¡Estás en modo estricto! Salir ahora anulará tu ciclo de concentración actual y registrará una sesión fallida. ¿Realmente quieres rendirte?',
            () => {
                pomodoroService.reiniciarFase();
                performExitFocusMode();
            }
        );
        return;
    }
    performExitFocusMode();
}

/**
 * Ejecuta la animación de salida y limpia los recursos del Modo Concentración.
 */
function performExitFocusMode() {
    const overlay = document.getElementById('focus-mode-overlay');
    if (!overlay) return;

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log('Exit fullscreen error', err));
    }

    overlay.classList.add('leaving');
    setTimeout(() => {
        overlay.classList.remove('show', 'leaving');
        document.body.style.overflow = '';
        window.pomoAmbientSynth.stopAll();
        window.pomoFocusCanvas.stop();
        const lofiPanel  = document.getElementById('focus-lofi-panel');
        const lofiIframe = document.getElementById('focus-lofi-iframe');
        const lofiBtn    = document.getElementById('lofi-panel-toggle');
        if (lofiPanel)  lofiPanel.classList.remove('show');
        if (lofiBtn)    lofiBtn.classList.remove('active');
        if (lofiIframe) lofiIframe.src = '';
        showToast('Saliste del Modo Concentración', 'success');
    }, 400);
}

/**
 * Cambia el tema visual del fondo del Modo Concentración y activa el audio correspondiente.
 * @param {string} theme - Nombre del tema ('aurora'|'rain'|'fire'|'forest'|'ocean').
 */
function changeFocusTheme(theme) {
    const bgContainer = document.getElementById('focus-bg-container');
    if (!bgContainer) return;

    // Validación defensiva: si el tema guardado ya no es válido, restaurar a 'aurora'
    const validThemes = ['aurora', 'rain', 'fire', 'forest', 'ocean'];
    if (!validThemes.includes(theme)) {
        theme = 'aurora';
    }

    bgContainer.className = '';
    bgContainer.classList.add('theme-' + theme);
    localStorage.setItem('cursus_pomo_focus_theme', theme);

    document.querySelectorAll('.focus-theme-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('theme-btn-' + theme);
    if (activeBtn) activeBtn.classList.add('active');

    // Activar canvas de partículas y canal de audio del tema seleccionado
    const volKey = { rain: 'cursus_pomo_focus_vol_rain', fire: 'cursus_pomo_focus_vol_fire', forest: 'cursus_pomo_focus_vol_forest', ocean: 'cursus_pomo_focus_vol_ocean' };
    const defaults = { rain: 0.3, fire: 0.35, forest: 0.3, ocean: 0.3 };
    const setters  = { rain: setRainVolume, fire: setFireVolume, forest: setForestVolume, ocean: setOceanVolume };

    // Silenciar todos los canales y detener el canvas
    setRainVolume(0); setFireVolume(0); setForestVolume(0); setOceanVolume(0);
    window.pomoFocusCanvas.stop();

    if (['rain', 'fire', 'forest', 'ocean'].includes(theme)) {
        window.pomoFocusCanvas.start('focus-canvas', theme);
        const lastVol = parseFloat(localStorage.getItem(volKey[theme])) || defaults[theme];
        setters[theme](lastVol);
    }
}

/**
 * Establece el volumen de la lluvia y actualiza el sintetizador y el input range.
 * @param {number|string} val - Volumen entre 0 y 1.
 */
function setRainVolume(val) {
    const volume = parseFloat(val);
    window.pomoAmbientSynth.setRainVolume(volume);
    const input = document.getElementById('focus-vol-rain');
    if (input) input.value = volume;
    updateMixerIcon('rain', volume);
    if (volume > 0) { window.pomoAmbientSynth.startRain(); localStorage.setItem('cursus_pomo_focus_vol_rain', volume); }
    else              window.pomoAmbientSynth.stopRain();
}

/**
 * Establece el volumen del fuego.
 * @param {number|string} val
 */
function setFireVolume(val) {
    const volume = parseFloat(val);
    window.pomoAmbientSynth.setFireVolume(volume);
    const input = document.getElementById('focus-vol-fire');
    if (input) input.value = volume;
    updateMixerIcon('fire', volume);
    if (volume > 0) { window.pomoAmbientSynth.startFire(); localStorage.setItem('cursus_pomo_focus_vol_fire', volume); }
    else              window.pomoAmbientSynth.stopFire();
}

/**
 * Establece el volumen del bosque.
 * @param {number|string} val
 */
function setForestVolume(val) {
    const volume = parseFloat(val);
    window.pomoAmbientSynth.setForestVolume(volume);
    const input = document.getElementById('focus-vol-forest');
    if (input) input.value = volume;
    updateMixerIcon('forest', volume);
    if (volume > 0) { window.pomoAmbientSynth.startForest(); localStorage.setItem('cursus_pomo_focus_vol_forest', volume); }
    else              window.pomoAmbientSynth.stopForest();
}

/**
 * Establece el volumen del océano.
 * @param {number|string} val
 */
function setOceanVolume(val) {
    const volume = parseFloat(val);
    window.pomoAmbientSynth.setOceanVolume(volume);
    const input = document.getElementById('focus-vol-ocean');
    if (input) input.value = volume;
    updateMixerIcon('ocean', volume);
    if (volume > 0) { window.pomoAmbientSynth.startOcean(); localStorage.setItem('cursus_pomo_focus_vol_ocean', volume); }
    else              window.pomoAmbientSynth.stopOcean();
}

/** Alterna el audio de lluvia entre encendido y silenciado. */
function toggleRainAudio()   { setRainVolume(window.pomoAmbientSynth.rainVol     > 0 ? 0 : 0.3); }
/** Alterna el audio de fuego. */
function toggleFireAudio()   { setFireVolume(window.pomoAmbientSynth.fireVol     > 0 ? 0 : 0.35); }
/** Alterna el audio de bosque. */
function toggleForestAudio() { setForestVolume(window.pomoAmbientSynth.forestVol > 0 ? 0 : 0.3); }
/** Alterna el audio de océano. */
function toggleOceanAudio()  { setOceanVolume(window.pomoAmbientSynth.oceanVol   > 0 ? 0 : 0.35); }

/**
 * Actualiza el ícono del mezclador de audio para reflejar el estado muted/activo.
 * @param {'rain'|'fire'|'forest'|'ocean'} type - Tipo de canal de audio.
 * @param {number} volume - Volumen actual (0 = silenciado).
 */
function updateMixerIcon(type, volume) {
    const controlDiv = document.getElementById('mixer-control-' + type);
    if (!controlDiv) return;
    if (volume === 0) controlDiv.classList.add('muted');
    else              controlDiv.classList.remove('muted');
}

/**
 * Cambia la fase activa del Pomodoro desde los tabs del Modo Concentración.
 * Pausa el reloj para que el usuario lo reanude conscientemente.
 * @param {string} phase - Clave de la fase ('enfoque'|'descanso_corto'|'descanso_largo').
 */
function changeFocusPhase(phase) {
    pomodoroService.forzarFase(phase);
    const labels = { enfoque: 'Pomodoro', descanso_corto: 'Recreo Corto', descanso_largo: 'Recreo Largo' };
    showToast(`Cambiado a fase: ${labels[phase] || phase}`, 'success');
}

/* Lofi player */
let currentLofiVideoId = '3yH2Wo2SaIM';

/**
 * Abre o cierra el panel del reproductor Lofi en el Modo Concentración.
 */
function toggleLofiPanel() {
    const panel  = document.getElementById('focus-lofi-panel');
    const btn    = document.getElementById('lofi-panel-toggle');
    const iframe = document.getElementById('focus-lofi-iframe');
    if (!panel || !iframe) return;

    const isOpen = panel.classList.contains('show');
    if (isOpen) {
        panel.classList.remove('show');
        if (btn) btn.classList.remove('active');
        iframe.src = '';
    } else {
        panel.classList.add('show');
        if (btn) btn.classList.add('active');
        const select    = document.getElementById('focus-lofi-select');
        const videoId   = select ? select.value : currentLofiVideoId;
        const separator = videoId.includes('?') ? '&' : '?';
        iframe.src      = `https://www.youtube.com/embed/${videoId}${separator}enablejsapi=1&autoplay=1&mute=0`;
    }
}

/**
 * Cambia el canal del reproductor Lofi.
 * @param {string} videoId - ID del video de YouTube a cargar.
 */
function changeLofiChannel(videoId) {
    currentLofiVideoId = videoId;
    const panel  = document.getElementById('focus-lofi-panel');
    const iframe = document.getElementById('focus-lofi-iframe');
    if (!panel || !iframe) return;
    if (panel.classList.contains('show')) {
        const separator = videoId.includes('?') ? '&' : '?';
        iframe.src      = `https://www.youtube.com/embed/${videoId}${separator}enablejsapi=1&autoplay=1&mute=0`;
    }
}

/** Navega a la tarea anterior en el carrusel del Modo Concentración. */
function prevFocusTask() {
    const progressTasks = tasks.filter(t => t.column === 'progress');
    if (progressTasks.length <= 1) return;
    activeFocusTaskIndex = activeFocusTaskIndex <= 0 ? progressTasks.length - 1 : activeFocusTaskIndex - 1;
    updateFocusActiveGoal();
}

/** Navega a la tarea siguiente en el carrusel del Modo Concentración. */
function nextFocusTask() {
    const progressTasks = tasks.filter(t => t.column === 'progress');
    if (progressTasks.length <= 1) return;
    activeFocusTaskIndex = (activeFocusTaskIndex + 1) >= progressTasks.length ? 0 : activeFocusTaskIndex + 1;
    updateFocusActiveGoal();
}

/**
 * Marca la tarea activa del Modo Concentración como completada (mueve a 'done').
 * Usa UI optimista con rollback en caso de error de red.
 */
function completeFocusActiveTask() {
    const progressTasks = tasks.filter(t => t.column === 'progress');
    if (progressTasks.length === 0) return;
    const activeTask = progressTasks[activeFocusTaskIndex];
    if (!activeTask) return;

    const oldCol = activeTask.column;
    const taskId = activeTask.id;
    activeTask.column = 'done';
    updateCounts();
    if (activeFocusTaskIndex >= progressTasks.length - 1 && activeFocusTaskIndex > 0) activeFocusTaskIndex--;
    updateFocusActiveGoal();

    ApiService.moveTarea(taskId, 'finalizado')
        .then(() => {
            saveTasksToLocal();
            renderKanban();
            showToast('¡Tarea completada con éxito! 🎉', 'success');
        })
        .catch(() => {
            activeTask.column = oldCol;
            updateCounts();
            updateFocusActiveGoal();
            renderKanban();
            showToast('Error al completar la tarea', 'error');
        });
}

/** Abre o cierra el drawer de subtareas de la tarea activa en el Modo Concentración. */
function toggleFocusSubtasksDrawer() {
    const drawer = document.getElementById('focus-subtasks-drawer');
    if (!drawer) return;
    drawer.classList.toggle('show');
    if (drawer.classList.contains('show')) renderFocusSubtasks();
}

/** Renderiza las subtareas de la tarea activa en el panel del Modo Concentración. */
function renderFocusSubtasks() {
    const listContainer = document.getElementById('focus-subtasks-list');
    if (!listContainer) return;
    const progressTasks = tasks.filter(t => t.column === 'progress');
    if (progressTasks.length === 0) {
        listContainer.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:0.8rem;text-align:center;padding:0.5rem 0;">No hay tareas en curso</div>';
        return;
    }
    const activeTask = progressTasks[activeFocusTaskIndex];
    if (!activeTask || !activeTask.subtasks || activeTask.subtasks.length === 0) {
        listContainer.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:0.8rem;text-align:center;padding:0.5rem 0;">Esta tarea no tiene subtareas</div>';
        return;
    }
    listContainer.innerHTML = '';
    activeTask.subtasks.forEach((sub, index) => {
        const item = document.createElement('div');
        item.className = 'focus-subtask-item';
        item.innerHTML = `
          <input type="checkbox" class="focus-subtask-chk" ${sub.completed ? 'checked' : ''} onchange="window.toggleFocusSubtaskStatus(${index})">
          <span class="focus-subtask-txt ${sub.completed ? 'done' : ''}" onclick="window.toggleFocusSubtaskStatus(${index})">${escapeHTML(sub.text)}</span>
        `;
        listContainer.appendChild(item);
    });
}

/**
 * Alterna el estado completado de una subtarea desde el Modo Concentración.
 * @param {number} index - Índice de la subtarea.
 */
function toggleFocusSubtaskStatus(index) {
    const progressTasks = tasks.filter(t => t.column === 'progress');
    if (progressTasks.length === 0) return;
    const activeTask = progressTasks[activeFocusTaskIndex];
    if (!activeTask || !activeTask.subtasks || !activeTask.subtasks[index]) return;

    activeTask.subtasks[index].completed = !activeTask.subtasks[index].completed;
    saveTasksToLocal();
    renderKanban();
    renderFocusSubtasks();

    ApiService.updateSubtareas(activeTask.id, activeTask.subtasks)
        .catch(() => {
            activeTask.subtasks[index].completed = !activeTask.subtasks[index].completed;
            saveTasksToLocal();
            renderKanban();
            renderFocusSubtasks();
            showToast('Error sincronizando subtareas', 'error');
        });
}

/** Alterna el modo de pantalla completa del navegador. */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
            .catch(() => showToast('Error al activar pantalla completa', 'error'));
    } else {
        document.exitFullscreen();
    }
}

/* ==========================================================================
   MODAL DE CONFIRMACIÓN
   ========================================================================== */

let confirmCallback = null;

/**
 * Abre el modal de confirmación genérico con un texto y registra el callback a ejecutar.
 * @param {string} text - Texto de la pregunta de confirmación.
 * @param {Function} callback - Función a ejecutar si el usuario confirma.
 */
function openConfirm(text, callback) {
    confirmCallback = callback;
    document.getElementById('confirm-text').textContent = text;
    document.getElementById('confirm-modal').classList.add('show');
}

/** Cierra el modal de confirmación y limpia el callback registrado. */
function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('show');
    confirmCallback = null;
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {

    // --- Suscribirse a eventos del Observer ---
    // El Timer Principal y el Modo Concentración se actualizan de forma independiente.

    pomodoroService.addEventListener('pomo:tick', (e) => {
        renderTimerPrincipal(e.detail);
        renderFocusMode(e.detail);
    });

    pomodoroService.addEventListener('pomo:estadoCambiado', (e) => {
        renderTimerPrincipal(e.detail);
        renderFocusMode(e.detail);
    });

    pomodoroService.addEventListener('pomo:faseCompletada', () => {
        // 1. Reproducir alarma via módulo de audio centralizado (pomo-audio-player.js)
        const alarmSound = localStorage.getItem(LS_KEYS.SONIDO_ALARMA) || 'chime';
        playPomoAlarm(alarmSound);
    });

    pomodoroService.addEventListener('pomo:sesionRegistradaBackend', () => {
        // Refrescar el resumen de la materia (stats, etc) en la vista activa
        if (selectedMateriaId) {
            loadMateriaResumen();
        }
    });

    // --- Inicializar el Servicio del Pomodoro (SSOT) ---
    pomodoroService.init(showToast);

    // --- Botón de confirmación del modal genérico ---
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    if (confirmYesBtn) {
        confirmYesBtn.addEventListener('click', () => {
            if (confirmCallback) confirmCallback();
            closeConfirmModal();
        });
    }

    // --- Cerrar dropdown de materia al hacer clic fuera ---
    document.addEventListener('click', (e) => {
        const wrap = document.getElementById('mat-dropdown-wrap');
        if (wrap && !wrap.contains(e.target)) closeMateriaDropdown();
    });

    // --- Modo Estricto: detector de pérdida de foco ---
    document.addEventListener('visibilitychange', () => {
        const strictMode = localStorage.getItem(LS_KEYS.MODO_ESTRICTO) === 'true';
        const snapshot   = pomodoroService.obtenerSnapshot();
        
        // CORRECCIÓN: Solo aplicar la regla si el reloj corre Y estamos en fase de enfoque.
        const enEnfoqueCorriendo = snapshot.state.estado_reloj === 'corriendo' && snapshot.state.fase_actual === 'enfoque';

        if (document.hidden && strictMode && enEnfoqueCorriendo) {
            let distractCount = parseInt(sessionStorage.getItem('cursus_strict_distractions') || '0', 10);
            distractCount++;
            sessionStorage.setItem('cursus_strict_distractions', String(distractCount));
            // Llamada al módulo de audio centralizado (SRP)
            playPomoAlarm('beep');
        } else if (!document.hidden && strictMode && enEnfoqueCorriendo) {
            const distractCount = sessionStorage.getItem('cursus_strict_distractions') || '0';
            if (distractCount !== '0') {
                showToast(`¡Atención! Te has distraído cambiando de pestaña. Distracciones: ${distractCount}. Mantén el enfoque.`, 'warn');
                sessionStorage.setItem('cursus_strict_distractions', '0');
            }
        }
    });

    // --- Cambio de estado del fullscreen ---
    document.addEventListener('fullscreenchange', () => {
        const btn = document.getElementById('focus-fullscreen-toggle');
        if (!btn) return;
        btn.innerHTML = document.fullscreenElement ? '🔍 Salir Completa' : '📺 Pantalla Completa';
    });

    // --- Cargar materias y estado inicial ---
    await loadMateriasCursando();
});

/* ==========================================================================
   EXPORTS — window.* para handlers inline del HTML (Blade y dinámico)
   ========================================================================== */

// Controles del Pomodoro
window.togglePomo             = togglePomo;
window.resetPomo              = resetPomo;
window.restartPomoCycle       = restartPomoCycle;
window.skipPomo               = skipPomo;
window.setPreset              = setPreset;
window.openCustomPomoModal    = openCustomPomoModal;
window.closeCustomPomoModal   = closeCustomPomoModal;
window.saveCustomPomoSettings = saveCustomPomoSettings;
window.testSelectedSound      = testSelectedSound;

// Kanban
window.showInlineAddCardForm  = showInlineAddCardForm;
window.saveInlineCard         = saveInlineCard;
window.cancelInlineAddCard    = cancelInlineAddCard;
window.allowDrop              = allowDrop;
window.leaveDrop              = leaveDrop;
window.dropCard               = dropCard;
window.deleteTask             = deleteTask;

// Modal de Tarea
window.closeTaskModal         = closeTaskModal;
window.handleDateAutocomplete = handleDateAutocomplete;
window.saveNewSubtask         = saveNewSubtask;
window.hideSubtaskAddInput    = hideSubtaskAddInput;
window.showSubtaskAddInput    = showSubtaskAddInput;
window.deleteTaskFromModal    = deleteTaskFromModal;
window.saveTaskDetails        = saveTaskDetails;
window.toggleSubtaskStatus    = toggleSubtaskStatus;
window.saveSubtaskText        = saveSubtaskText;
window.handleSubtaskEnter     = handleSubtaskEnter;
window.deleteSubtask          = deleteSubtask;

// Marcadores
window.addBookmark              = addBookmark;
window.startBookmarkInlineEdit  = startBookmarkInlineEdit;
window.cancelBookmarkInlineEdit = cancelBookmarkInlineEdit;
window.saveBookmarkInlineEdit   = saveBookmarkInlineEdit;
window.deleteBookmark           = deleteBookmark;

// Selector de Materia
window.toggleMateriaDropdown  = toggleMateriaDropdown;

// Modal de Confirmación
window.closeConfirmModal      = closeConfirmModal;

// Modo Concentración
window.enterFocusMode          = enterFocusMode;
window.exitFocusMode           = exitFocusMode;
window.changeFocusTheme        = changeFocusTheme;
window.setRainVolume           = setRainVolume;
window.setFireVolume           = setFireVolume;
window.setForestVolume         = setForestVolume;
window.setOceanVolume          = setOceanVolume;
window.toggleRainAudio         = toggleRainAudio;
window.toggleFireAudio         = toggleFireAudio;
window.toggleForestAudio       = toggleForestAudio;
window.toggleOceanAudio        = toggleOceanAudio;
window.changeFocusPhase        = changeFocusPhase;
window.toggleLofiPanel         = toggleLofiPanel;
window.changeLofiChannel       = changeLofiChannel;
window.completeFocusActiveTask = completeFocusActiveTask;
window.prevFocusTask           = prevFocusTask;
window.nextFocusTask           = nextFocusTask;
window.toggleFocusSubtasksDrawer = toggleFocusSubtasksDrawer;
window.renderFocusSubtasks     = renderFocusSubtasks;
window.toggleFocusSubtaskStatus = toggleFocusSubtaskStatus;
window.toggleFullscreen        = toggleFullscreen;
