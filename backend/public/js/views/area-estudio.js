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
import { KanbanManager }               from './kanban.js';
import { toggleLofiPanel, changeLofiChannel } from './lofi-panel.js';
import { PomodoroSyncQueue }           from '../services/PomodoroSyncQueue.js';


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
    const { state, settings, ciclos, config } = snapshot;
    const presetActivo = config.preset_activo;

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
    if (psubEl) psubEl.textContent = `${faseTxt} · Sesión ${ciclos.ciclo_actual} de ${settings.sesiones_por_ciclo}`;

    // --- Progreso del Ring SVG ---
    const totalSec = fasePolimorfica ? fasePolimorfica.duracion(settings) : settings.tiempo_enfoque * 60;
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
        for (let i = 1; i <= settings.sesiones_por_ciclo; i++) {
            const dot = document.createElement('div');
            dot.className = `dot ${i < ciclos.ciclo_actual ? 'done' : ''}`;
            dotsContainer.appendChild(dot);
        }
    }

    // --- Log de sesiones ---
    const logList = document.getElementById('slog-list');
    const logHash = JSON.stringify(ciclos.log);
    
    if (logList && window._lastLogHash !== logHash) {
        window._lastLogHash = logHash;
        
        // Mapear nodos existentes por su hash interno para reutilizarlos de forma segura
        const existingNodes = {};
        Array.from(logList.children).forEach(child => {
            if (child._rowHash) existingNodes[child._rowHash] = child;
        });
        
        // Reconstruir la lista en el orden exacto del array
        ciclos.log.forEach(row => {
            const rowHash = JSON.stringify(row);
            let node = existingNodes[rowHash];
            
            if (!node) {
                node = document.createElement('div');
                node.className = 'slog-row';
                node._rowHash = rowHash;
                
                const warningIconHtml = row.status.isOffline 
                    ? `<svg class="slog-icon" style="color:#f59e0b; cursor:help; margin-left: 12px;" aria-label="Pendiente de sincronizar (Offline)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Pendiente de sincronizar (Offline)</title><path d="M12 12v4"/><path d="M12 20h.01"/><path d="M8.128 16.949A7 7 0 1 1 15.71 8h1.79a1 1 0 0 1 0 9h-1.642"/></svg>` 
                    : '';
                    
                let statusIconHtml = `<svg class="slog-icon"><use href="/assets/icons/sprite.svg#${row.status.icon}"></use></svg>`;
                if (row.status.isOffline) {
                    const paths = {
                        'check-check': '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
                        'check': '<path d="M20 6 9 17l-5-5"/>',
                        'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
                    };
                    statusIconHtml = `<svg class="slog-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[row.status.icon] || ''}</svg>`;
                }

                node.innerHTML = `
                  <span class="slog-t">${row.time}</span>
                  <span class="slog-d">${row.duration}</span>
                  ${warningIconHtml}
                  <span class="slog-ok ${row.status.class}">
                    ${statusIconHtml}
                    ${row.status.text}
                  </span>
                `;
            }
            
            logList.appendChild(node);
            delete existingNodes[rowHash];
        });
        
        // Eliminar los nodos que ya no están en ciclos.log
        Object.values(existingNodes).forEach(node => node.remove());
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
    if (focusSessionEl) focusSessionEl.textContent = `Sesión ${ciclos.ciclo_actual} de ${settings.sesiones_por_ciclo}`;

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
    const totalSec = fasePolimorfica ? fasePolimorfica.duracion(settings) : settings.tiempo_enfoque * 60;
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
        for (let i = 1; i <= settings.sesiones_por_ciclo; i++) {
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

    if (snapshot.state.fase_actual === 'enfoque') {
        openConfirm(
            'Vas a reiniciar tu sesión de enfoque actual. El tiempo acumulado se guardará en tu historial como sesión abandonada. ¿Deseas continuar?',
            () => {
                pomodoroService.reiniciarFase();
                showToast('Sesión de enfoque reiniciada', 'success');
            }
        );
    } else {
        // En descanso, reiniciar no tiene riesgo de pérdida de datos productivos
        pomodoroService.reiniciarFase();
        showToast('Descanso reiniciado', 'success');
    }
}

/**
 * Reinicia el ciclo completo de sesiones volviendo a la sesión 1.
 * Solicita confirmación para evitar pérdidas accidentales.
 */
function restartPomoCycle() {
    const snapshot = pomodoroService.obtenerSnapshot();
    const isEnfoque = snapshot.state.fase_actual === 'enfoque';
    
    const msg = isEnfoque 
        ? 'Vas a reiniciar el ciclo completo y volverás a la sesión 1. El tiempo acumulado de tu enfoque actual se guardará como sesión abandonada. ¿Deseas continuar?'
        : '¿Estás seguro de que deseas reiniciar el ciclo completo? Se perderá el progreso de tu ciclo actual y volverás a la sesión 1.';
        
    openConfirm(msg, () => {
        pomodoroService.reiniciarCiclo();
        showToast('Ciclo de sesiones reiniciado', 'success');
    });
}

/**
 * Salta la fase actual y avanza automáticamente a la siguiente.
 * Si la fase saltada era enfoque con progreso, notifica al backend.
 */
function skipPomo() {
    const snapshot = pomodoroService.obtenerSnapshot();
    
    if (snapshot.state.fase_actual === 'enfoque') {
        openConfirm(
            'Vas a saltar el resto de tu sesión de enfoque. El tiempo acumulado se guardará en tu historial como sesión completada parcialmente. ¿Deseas continuar?', 
            () => {
                pomodoroService.saltarFase();
                showToast('Fase de enfoque salteada', 'success');
            }
        );
    } else {
        // En descanso es común querer saltar la pausa si ya se quiere volver a estudiar
        pomodoroService.saltarFase();
        showToast('Descanso salteado', 'success');
    }
}

/**
 * Aplica un preset predefinido de tiempos del Pomodoro.
 * @param {'classic'|'deep'|'short'|'custom'} type - Nombre del preset a aplicar.
 */
function setPreset(type) {
    const snapshot = pomodoroService.obtenerSnapshot();
    if (snapshot.state.estado_reloj === 'corriendo') {
        showToast('Pausa el temporizador antes de cambiar de modo', 'warn');
        return;
    }

    const cicloActual = snapshot.ciclos.ciclo_actual;

    // Todos los presets predeterminados tienen 4 sesiones
    if (type !== 'custom' && cicloActual > 4) {
        openConfirm(
            `Atención: El preset que seleccionaste tiene un límite de 4 sesiones por ciclo, pero actualmente te encuentras en la sesión ${cicloActual}. Al aplicar este cambio, tu progreso del ciclo se reiniciará a la sesión 1. ¿Deseas continuar?`,
            () => {
                const aplicado = pomodoroService.aplicarPreset(type);
                if (aplicado) showToast(`Preset aplicado: ${type.toUpperCase()}`, 'success');
            }
        );
        return;
    }

    const aplicado = pomodoroService.aplicarPreset(type);
    if (aplicado) showToast(`Preset aplicado: ${type.toUpperCase()}`, 'success');
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
    const { config } = snapshot;
    
    // Configs generales
    const soundSelect = document.getElementById('custom-pomo-sound');
    if (soundSelect) soundSelect.value = config.sonido_alarma;

    const strictToggle = document.getElementById('pomo-strict-toggle');
    if (strictToggle) strictToggle.checked = config.modo_estricto;

    const playAlarmToggle = document.getElementById('pomo-play-alarm-toggle');
    if (playAlarmToggle) playAlarmToggle.checked = config.reproducir_alarma;

    const autoPlayToggle = document.getElementById('pomo-auto-play-toggle');
    if (autoPlayToggle) autoPlayToggle.checked = config.auto_reproduccion_fases;

    // Configs Modo P
    document.getElementById('custom-pomo-focus').value    = config.tiempo_enfoque;
    document.getElementById('custom-pomo-short').value    = config.descanso_corto;
    document.getElementById('custom-pomo-long').value     = config.descanso_largo;
    document.getElementById('custom-pomo-sessions').value = config.sesiones_por_ciclo;
    document.getElementById('custom-pomo-cycles').value   = config.ciclos_totales || 'infinite';

    const errorDiv = document.getElementById('pomo-validation-error');
    if (errorDiv) errorDiv.style.display = 'none';
    
    const btnSave = document.getElementById('btn-save-pomo');
    if (btnSave) {
        btnSave.disabled = false;
        btnSave.textContent = 'Aplicar Ajustes';
    }

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
async function saveCustomPomoSettings() {
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
    const playAlarmToggle = document.getElementById('pomo-play-alarm-toggle');
    const autoPlayToggle = document.getElementById('pomo-auto-play-toggle');

    const sonidoAlarma = soundSelect ? soundSelect.value : 'chime';
    const modoEstricto = strictToggle ? strictToggle.checked : false;
    const reproducirAlarma = playAlarmToggle ? playAlarmToggle.checked : true;
    const autoReproduccion = autoPlayToggle ? autoPlayToggle.checked : true;

    const btnSave = document.getElementById('btn-save-pomo');

    const snapshot = pomodoroService.obtenerSnapshot();
    const cicloActual = snapshot.ciclos.ciclo_actual;
    const presetActivo = snapshot.config.preset_activo;

    if (presetActivo === 'custom' && sessions < cicloActual) {
        openConfirm(
            `Atención: Estás reduciendo la cantidad de sesiones por ciclo a ${sessions}, pero actualmente te encuentras en la sesión ${cicloActual}. Al aplicar este cambio, tu progreso del ciclo se reiniciará a la sesión 1. ¿Deseas continuar?`,
            () => {
                _ejecutarSaveCustomPomoSettings(focus, short, long, sessions, cycles, sonidoAlarma, modoEstricto, reproducirAlarma, autoReproduccion, btnSave, errorDiv);
            }
        );
        return;
    }

    _ejecutarSaveCustomPomoSettings(focus, short, long, sessions, cycles, sonidoAlarma, modoEstricto, reproducirAlarma, autoReproduccion, btnSave, errorDiv);
}

async function _ejecutarSaveCustomPomoSettings(focus, short, long, sessions, cycles, sonidoAlarma, modoEstricto, reproducirAlarma, autoReproduccion, btnSave, errorDiv) {
    if (btnSave) {
        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';
    }

    try {
        await pomodoroService.guardarAjustesPersonalizados(
            { tiempo_enfoque: focus, descanso_corto: short, descanso_largo: long, sesiones_por_ciclo: sessions, ciclos_totales: cycles },
            { 
                sonido_alarma: sonidoAlarma, 
                modo_estricto: modoEstricto,
                reproducir_alarma: reproducirAlarma,
                auto_reproduccion_fases: autoReproduccion
            }
        );

        closeCustomPomoModal();
        const currentPreset = pomodoroService.obtenerSnapshot().config.preset_activo;
        if (currentPreset !== 'custom') {
            showToast('Ajustes guardados. Para ver las configuraciones aplicadas al "Modo Personalizado" pulse el "Botón P"', 'success');
        } else {
            showToast('Ajustes guardados con éxito', 'success');
        }
    } catch (e) {
        errorDiv.textContent = 'Error de red: No se pudieron guardar los ajustes.';
        errorDiv.style.display = 'block';
        if (btnSave) {
            btnSave.disabled = false;
            btnSave.textContent = 'Aplicar Ajustes';
        }
    }
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
    KanbanManager.setMateriaId(selectedMateriaId);
    
    if (!selectedMateriaId) {
        KanbanManager.updateTasks([]);
        bookmarks = [];
        renderBookmarks();
        return;
    }

    const localTasksData = JSON.parse(localStorage.getItem('cursus_tasks_v2') || '[]');

    // Cargar tareas desde la BD
    try {
        const dbTasks = await ApiService.getTareas(selectedMateriaId);
        const dbTasksMapped = dbTasks.map(t => {
            const localMatch = localTasksData.find(lt => String(lt.id) === String(t.id));
            return {
                id:          String(t.id),
                title:       t.titulo,
                column:      COLUMNA_DB_TO_UI[t.columna],
                dueDate:     t.fecha_vencimiento ? t.fecha_vencimiento.substring(0, 16) : '',
                orden:       t.orden,
                description: localMatch ? localMatch.description : '',
                subtasks:    localMatch ? localMatch.subtasks : [],
            };
        });
        KanbanManager.updateTasks(dbTasksMapped);
    } catch (e) {
        console.error('Error cargando tareas DB', e);
        KanbanManager.updateTasks([]);
    }

    // Cargar marcadores desde la BD
    try {
        const dbBookmarks = await ApiService.getMarcadores(selectedMateriaId);
        bookmarks = dbBookmarks.map(b => ({
            id:    String(b.id),
            url:   b.url,
            title: b.titulo,
        }));
    } catch (e) {
        console.error('Error cargando marcadores DB', e);
        bookmarks = [];
    }

    // RenderBookmarks
    renderBookmarks();
}

/** Persiste la lista de marcadores en LocalStorage (caché de respaldo). */
function saveBookmarksToLocal() {
    localStorage.setItem('cursus_bookmarks_v2', JSON.stringify(bookmarks));
}

/* ==========================================================================
   BÓVEDA DE MARCADORES
   ========================================================================== */

/**
 * Formatea una URL ingresada por el usuario.
 * Añade https:// por defecto, o http:// si detecta un entorno local.
 * @param {string} rawUrl 
 * @returns {string}
 */
function formatBookmarkUrl(rawUrl) {
    let url = rawUrl.trim();
    if (!url) return url;
    
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    
    // Regex simple para localhost, 127.x.x.x, 192.168.x.x, 10.x.x.x
    const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?(\/.*)?$/i.test(url);
    
    if (isLocal) {
        return 'http://' + url;
    }
    return 'https://' + url;
}

/**
 * Limpia un título redundante convirtiéndolo en null si es exactamente igual al dominio de la URL.
 * @param {string} title 
 * @param {string} url 
 * @returns {string|null}
 */
function cleanRedundantTitle(title, url) {
    if (!title) return null;
    let hostname = '';
    try { hostname = new URL(url).hostname.replace(/^www\./i, ''); } catch (_) {}
    if (hostname && title.toLowerCase() === hostname.toLowerCase()) {
        return null;
    }
    return title || null;
}

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
        
        let displayTitle = bm.title;
        if (!displayTitle) {
            displayTitle = hostname !== 'link' ? hostname.replace(/^www\./i, '') : bm.url;
        }

        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

        card.innerHTML = `
          <img class="bm-ic" src="${faviconUrl}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22%234f46e5%22><circle cx=%228%22 cy=%228%22 r=%226%22/></svg>'" alt="Logo">
          <div class="bm-inf">
            <div class="bm-name">${escapeHTML(displayTitle)}</div>
            <div class="bm-url">${escapeHTML(bm.url)}</div>
          </div>
          <div class="bm-edit-row">
            <input type="url" class="bm-edit-inp url" id="bm-edit-url-${bm.id}" value="${escapeHTML(bm.url)}" placeholder="ej. google.com">
            <input type="text" class="bm-edit-inp" id="bm-edit-title-${bm.id}" value="${escapeHTML(bm.title || '')}" placeholder="Título">
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
    let url     = urlInput.value.trim();
    const title = titleInput.value.trim();

    url = formatBookmarkUrl(url);

    if (!url) { showToast('Introduce una dirección URL válida', 'error'); return; }
    if (!selectedMateriaId) { showToast('Elegí una materia primero', 'warn'); return; }

    btnSave.disabled    = true;
    btnSave.textContent = 'Guardando...';

    const finalTitle = cleanRedundantTitle(title, url);

    ApiService.createMarcador(selectedMateriaId, url, finalTitle)
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
    const bm = bookmarks.find(b => b.id === id);
    if (!bm) return;

    // Repoblar inputs con la información real para revertir posibles cambios no guardados
    const titleInput = document.getElementById(`bm-edit-title-${id}`);
    const urlInput   = document.getElementById(`bm-edit-url-${id}`);
    if (titleInput) titleInput.value = bm.title || '';
    if (urlInput)   urlInput.value   = bm.url || '';

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
    let newUrl     = document.getElementById(`bm-edit-url-${id}`).value.trim();
    
    newUrl = formatBookmarkUrl(newUrl);
    if (!newUrl) { showToast('La URL no puede quedar vacía', 'error'); return; }

    const finalTitle = cleanRedundantTitle(newTitle, newUrl);

    const oldTitle = bm.title;
    const oldUrl   = bm.url;
    bm.title = finalTitle;
    bm.url   = newUrl;
    saveBookmarksToLocal();
    renderBookmarks();

    ApiService.updateMarcador(id, { url: newUrl, titulo: finalTitle })
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
        selectMateria(null);
        return;
    }

    const savedRaw = localStorage.getItem('cursus_selected_materia');
    if (!savedRaw || savedRaw === 'independiente') {
        selectMateria(null);
    } else {
        const saved = parseInt(savedRaw, 10);
        const savedValida = materiasCursando.find(m => m.id === saved);
        selectMateria(savedValida ? saved : null);
    }
}

/** Renderiza las opciones del dropdown de selección de materia. */
function renderMateriaDropdown() {
    const dropdown = document.getElementById('materia-dropdown');
    if (!dropdown) return;
    dropdown.innerHTML = '';

    // Elemento permanente para Estudio Independiente
    const indItem = document.createElement('div');
    indItem.className = `mat-dropdown-item ${selectedMateriaId === null ? 'active' : ''}`;
    indItem.innerHTML = `<span>Estudio Independiente</span>${selectedMateriaId === null ? '<span>✓</span>' : ''}`;
    indItem.onclick   = () => selectMateria(null);
    dropdown.appendChild(indItem);

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
    if (id === null) {
        localStorage.setItem('cursus_selected_materia', 'independiente');
    } else {
        localStorage.setItem('cursus_selected_materia', String(id));
    }

    const materia = id ? materiasCursando.find(m => m.id === id) : null;
    const nameEl  = document.getElementById('mat-selector-name');
    const badgeEl = document.getElementById('mat-selector-badge');
    const helpBtn = document.getElementById('btn-independiente-help');
    const mobNameEl = document.getElementById('mob-materia-name');
    const mobMetaEl = document.getElementById('mob-materia-meta');
    
    const nombreMostrar = materia ? materia.nombre : 'Estudio Independiente';
    
    if (nameEl)   nameEl.textContent   = nombreMostrar;
    if (mobNameEl) mobNameEl.textContent = nombreMostrar;
    if (mobMetaEl) mobMetaEl.textContent = materia ? `Nivel ${materia.nivel ?? '—'}` : '—';

    if (badgeEl) {
        if (materia) {
            badgeEl.textContent = 'CURSANDO';
            badgeEl.style.display = 'inline-block';
            if (helpBtn) helpBtn.style.display = 'none';
        } else {
            badgeEl.style.display = 'none';
            if (helpBtn) {
                helpBtn.style.display = 'flex';
                const tooltip = document.getElementById('tooltip-independiente-help');
                if (tooltip) {
                    if (materiasCursando.length === 0) {
                        tooltip.textContent = 'Las tareas y marcadores no están disponibles en "Estudio Independiente". Para usarlos, ve a "Mis Materias" y seleccioná "Cursar" en alguna materia.';
                    } else {
                        tooltip.textContent = 'Las tareas y marcadores no están disponibles en "Estudio Independiente". Seleccioná una de tus materias en este menú para usarlos.';
                    }
                }
            }
        }
    }

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
    try {
        const data = selectedMateriaId
            ? await ApiService.getMateriaResumen(selectedMateriaId)
            : await ApiService.getResumenIndependiente();
            
        const hoursEl = document.getElementById('chip-stat-hours');
        const pomosEl = document.getElementById('chip-stat-pomos');
        if (hoursEl) hoursEl.textContent = `${data.horas_semana}h`;
        if (pomosEl) pomosEl.textContent = data.sesiones_totales;

        // Sincronizar el servicio para que el Observer actualice el log del timer
        pomodoroService.sincronizarCiclosConBackend({
            sesiones_completadas_hoy: data.sesiones_hoy.length,
            // Revertir para que las sesiones más nuevas queden arriba (como en el modo local)
            log: data.sesiones_hoy.reverse().map(s => {
                let statusInfo = { text: 'Completada', class: 'status-completada', icon: 'check-check', isOffline: false };
                if (s.estado === 'completada_parcial') statusInfo = { text: 'Parcial', class: 'status-parcial', icon: 'check', isOffline: false };
                else if (s.estado === 'abandonada') statusInfo = { text: 'Abandonada', class: 'status-abandonada', icon: 'x', isOffline: false };
                
                return {
                    time:     s.hora,
                    duration: `${Math.floor(s.duracion_segundos / 60)}:00`,
                    status:   statusInfo,
                };
            }),
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

    const progressTasks = KanbanManager.tasks.filter(t => t.column === 'progress');
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
    const snapshot   = pomodoroService.obtenerSnapshot();
    const strictMode = snapshot.config.modo_estricto;
    if (strictMode && snapshot.state.estado_reloj === 'corriendo') {
        openConfirm(
            '¡Estás en modo estricto! Salir ahora interrumpirá tu concentración. El tiempo acumulado se guardará en tu historial como sesión abandonada. ¿Realmente quieres rendirte?',
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

/* Lofi player extraido a lofi-panel.js */
/** Navega a la tarea anterior en el carrusel del Modo Concentración. */
function prevFocusTask() {
    const progressTasks = KanbanManager.tasks.filter(t => t.column === 'progress');
    if (progressTasks.length <= 1) return;
    activeFocusTaskIndex = activeFocusTaskIndex <= 0 ? progressTasks.length - 1 : activeFocusTaskIndex - 1;
    updateFocusActiveGoal();
}

/** Navega a la tarea siguiente en el carrusel del Modo Concentración. */
function nextFocusTask() {
    const progressTasks = KanbanManager.tasks.filter(t => t.column === 'progress');
    if (progressTasks.length <= 1) return;
    activeFocusTaskIndex = (activeFocusTaskIndex + 1) >= progressTasks.length ? 0 : activeFocusTaskIndex + 1;
    updateFocusActiveGoal();
}

/**
 * Marca la tarea activa del Modo Concentración como completada (mueve a 'done').
 * Usa UI optimista con rollback en caso de error de red.
 */
function completeFocusActiveTask() {
    const progressTasks = KanbanManager.tasks.filter(t => t.column === 'progress');
    if (progressTasks.length === 0) return;
    const activeTask = progressTasks[activeFocusTaskIndex];
    if (!activeTask) return;

    const oldCol = activeTask.column;
    const taskId = activeTask.id;
    activeTask.column = 'done';
    KanbanManager.updateCounts();
    if (activeFocusTaskIndex >= progressTasks.length - 1 && activeFocusTaskIndex > 0) activeFocusTaskIndex--;
    updateFocusActiveGoal();

    ApiService.moveTarea(taskId, 'finalizado')
        .then(() => {
            KanbanManager.saveTasksToLocal();
            KanbanManager.renderKanban();
            showToast('¡Tarea completada con éxito! 🎉', 'success');
        })
        .catch(() => {
            activeTask.column = oldCol;
            KanbanManager.updateCounts();
            updateFocusActiveGoal();
            KanbanManager.renderKanban();
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
    const progressTasks = KanbanManager.tasks.filter(t => t.column === 'progress');
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
    const progressTasks = KanbanManager.tasks.filter(t => t.column === 'progress');
    if (progressTasks.length === 0) return;
    const activeTask = progressTasks[activeFocusTaskIndex];
    if (!activeTask || !activeTask.subtasks || !activeTask.subtasks[index]) return;

    activeTask.subtasks[index].completed = !activeTask.subtasks[index].completed;
    KanbanManager.saveTasksToLocal();
    KanbanManager.renderKanban();
    renderFocusSubtasks();

    ApiService.updateSubtareas(activeTask.id, activeTask.subtasks)
        .catch(() => {
            activeTask.subtasks[index].completed = !activeTask.subtasks[index].completed;
            KanbanManager.saveTasksToLocal();
            KanbanManager.renderKanban();
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
        const config = pomodoroService.obtenerSnapshot().config;
        if (config.reproducir_alarma) {
            playPomoAlarm(config.sonido_alarma);
        }
    });

    pomodoroService.addEventListener('pomo:sesionRegistradaBackend', () => {
        // Refrescar el resumen de la materia (stats, etc) en la vista activa
        if (selectedMateriaId) {
            loadMateriaResumen();
        }
    });

    // --- Inicializar el Servicio del Pomodoro (SSOT) ---
    pomodoroService.init(showToast);
    pomodoroService.sincronizarConfigDesdeBackend();

    // --- Configurar Tooltip de Ayuda para Estudio Independiente ---
    const btnIndependienteHelp = document.getElementById('btn-independiente-help');
    const tooltipIndependienteHelp = document.getElementById('tooltip-independiente-help');
    if (btnIndependienteHelp && tooltipIndependienteHelp) {
        btnIndependienteHelp.addEventListener('click', (e) => {
            e.stopPropagation();
            tooltipIndependienteHelp.style.display = tooltipIndependienteHelp.style.display === 'none' ? 'block' : 'none';
        });

        // Ocultar al hacer clic en cualquier otro lado
        document.addEventListener('click', () => {
            tooltipIndependienteHelp.style.display = 'none';
        });
        tooltipIndependienteHelp.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que clics dentro del tooltip lo cierren
        });
    }

    // --- Inicializar KanbanManager ---
    KanbanManager.init({
        selectedMateriaId: null,
        tasks: [],
        showToast,
        openConfirm,
        escapeHTML,
        reloadApp: loadAppState,
        updateFocusActiveGoal
    });

    // --- Inicializar cola offline de sesiones Pomodoro ---
    PomodoroSyncQueue.init();
    
    window.addEventListener('pomo:syncQueueChanged', (e) => {
        const count = e.detail.count;
        const ind = document.getElementById('offline-sync-indicator');
        if (ind) {
            ind.style.display = count > 0 ? 'inline-block' : 'none';
        }
        
        // Si la cola se vació después de tener items, refrescamos el log desde el backend
        if (count === 0 && window._hadPendingSync) {
            window._hadPendingSync = false;
            if (typeof pomodoroService !== 'undefined') {
                pomodoroService.marcarSesionesComoSincronizadas();
            }
            loadMateriaResumen(); // Re-renderiza las sesiones, marcándolas como "sincronizadas"
        } else if (count > 0) {
            window._hadPendingSync = true;
        }
    });
    // Forzar actualización inicial
    window.dispatchEvent(new CustomEvent('pomo:syncQueueChanged', {
        detail: { count: PomodoroSyncQueue.getPendingCount() }
    }));

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
        const snapshot = pomodoroService.obtenerSnapshot();
        const strictMode = snapshot.config.modo_estricto;
        
        // CORRECCIÓN: Solo aplicar la regla si el reloj corre Y estamos en fase de enfoque.
        const enEnfoqueCorriendo = snapshot.state.estado_reloj === 'corriendo' && snapshot.state.fase_actual === 'enfoque';

        if (document.hidden && strictMode && enEnfoqueCorriendo) {
            pomodoroService.registrarDistraccion();
            // Llamada al módulo de audio centralizado (SRP)
            playPomoAlarm('beep');
        } else if (!document.hidden && strictMode && enEnfoqueCorriendo) {
            const distractCount = pomodoroService.obtenerDistracciones();
            if (distractCount > 0) {
                showToast(`¡Atención! Te has distraído cambiando de pestaña. Distracciones: ${distractCount}. Mantén el enfoque.`, 'warn');
            }
        }
    });

    // Escuchar cambios de configuración para resetear distracciones si se apaga el modo estricto
    pomodoroService.addEventListener('pomo:estadoCambiado', () => {
        if (!pomodoroService.obtenerSnapshot().config.modo_estricto) {
            pomodoroService.reiniciarDistracciones();
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
