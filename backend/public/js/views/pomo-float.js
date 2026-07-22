/**
 * @fileoverview Widget Flotante del Pomodoro.
 *
 * Suscriptor del `PomodoroStateService` (Observer Pattern). Escucha los
 * eventos del dominio y actualiza exclusivamente el HTML del widget flotante.
 * NO gestiona su propio temporizador ni accede a la Web Audio API directamente.
 *
 * Responsabilidades:
 * 1. Suscribirse a `pomo:tick` y `pomo:estadoCambiado` para reflejar el estado.
 * 2. Suscribirse a `pomo:faseCompletada` para reproducir la alarma de audio.
 * 3. Delegar todos los controles al servicio de dominio (`pomodoroService`).
 * 4. Sincronizarse con otras pestañas escuchando el evento `storage`.
 * 5. Gestionar su propia UI (visibilidad, arrastre, minimizar, cerrar).
 *
 * Lo que este archivo NO hace:
 * - Manejar el temporizador directamente (responsabilidad de PomodoroStateService).
 * - Sintetizar audio (responsabilidad de pomo-audio-player.js).
 * - Realizar peticiones HTTP (responsabilidad de ApiService).
 *
 * @module pomo-float
 */

'use strict';

import { pomodoroService, LS_KEYS } from '../services/PomodoroStateService.js';
import { playPomoAlarm, unlockPomoAudio } from '../shared/pomo-audio-player.js';

/* ==========================================================================
   GUARDIA: No montar el widget en el Área de Estudio (tiene su propio UI)
   ========================================================================== */

if (window.location.pathname.includes('/area-estudio')) {
    // Si entramos al área de estudio, el widget nunca se muestra
} else {

/* ==========================================================================
   CREACIÓN E INYECCIÓN DEL WIDGET EN EL DOM
   ========================================================================== */

const widget = document.createElement('div');
widget.id        = 'pomo-floating-widget';
widget.className = 'pomo-float';

widget.innerHTML = `
    <div class="pomo-float__info" id="pomo-float-info" title="Mostrar/Ocultar controles">
        <span class="pomo-float__icon" id="pomo-float-icon">
            <svg width="18" height="18" aria-hidden="true"><use href="/assets/icons/sprite.svg#timer"></use></svg>
        </span>
        <span class="pomo-float__time" id="pomo-float-time">25:00</span>
        <span class="pomo-float__label" id="pomo-float-label">Enfoque</span>
        <span class="pomo-float__session" id="pomo-float-session"></span>
    </div>
    <div class="pomo-float__divider"></div>
    <div class="pomo-float__actions" id="pomo-float-actions">
        <button class="pomo-float__btn pomo-float__btn--play" id="pomo-float-play-btn" title="Pausar/Reanudar" aria-label="Pausar/Reanudar">
            <svg width="15" height="15" aria-hidden="true"><use href="/assets/icons/sprite.svg#play"></use></svg>
        </button>
        <button class="pomo-float__btn pomo-float__btn--nav" id="pomo-float-nav-btn" title="Ir a Área de Estudio" aria-label="Ir a Área de Estudio">
            <svg width="15" height="15" aria-hidden="true"><use href="/assets/icons/sprite.svg#move-right"></use></svg>
        </button>
        <button class="pomo-float__btn pomo-float__btn--min" id="pomo-float-min-btn" title="Minimizar" aria-label="Minimizar">
            <svg width="15" height="15" aria-hidden="true"><use href="/assets/icons/sprite.svg#minus"></use></svg>
        </button>
        <button class="pomo-float__btn pomo-float__btn--close" id="pomo-float-close-btn" title="Cerrar widget" aria-label="Cerrar widget">
            <svg width="15" height="15" aria-hidden="true"><use href="/assets/icons/sprite.svg#x"></use></svg>
        </button>
    </div>
`;

document.body.appendChild(widget);

/* ==========================================================================
   REFERENCIAS AL DOM DEL WIDGET
   ========================================================================== */

const playBtn       = document.getElementById('pomo-float-play-btn');
const navBtn        = document.getElementById('pomo-float-nav-btn');
const minBtn        = document.getElementById('pomo-float-min-btn');

const closeBtn      = document.getElementById('pomo-float-close-btn');
const infoWrapper   = document.getElementById('pomo-float-info');
const actionsWrapper = document.getElementById('pomo-float-actions');
const timeEl        = document.getElementById('pomo-float-time');
const labelEl       = document.getElementById('pomo-float-label');
const iconUseEl     = document.querySelector('#pomo-float-icon use');
const playUseEl     = document.querySelector('#pomo-float-play-btn use');
const sessionEl     = document.getElementById('pomo-float-session');

/* ==========================================================================
   ESTADO LOCAL DEL WIDGET (solo UI — sin lógica de dominio)
   ========================================================================== */

    // Eliminado el let widgetDismissed

/* ==========================================================================
   POSICIONAMIENTO PERSISTENTE Y ARRASTRE
   ========================================================================== */

const savedPos = localStorage.getItem('cursus_pomo_float_pos');
const tutorialShownInit = localStorage.getItem('cursus_pomo_widget_tutorial_shown') === 'true';

if (savedPos) {
    try {
        const pos = JSON.parse(savedPos);
        widget.style.top    = pos.top;
        widget.style.left   = pos.left;
        widget.style.bottom = 'auto';
        widget.style.right  = 'auto';
    } catch (_) {}
} else if (!tutorialShownInit) {
    // Si es la primera vez que se mostrará (no ha visto el tutorial ni guardado posición), centrarlo.
    // Asumimos dimensiones base del widget expandido (aprox 210px x 44px)
    const topPos = (window.innerHeight - 44) / 2;
    const leftPos = (window.innerWidth - 210) / 2;
    widget.style.top    = `${Math.max(0, topPos)}px`;
    widget.style.left   = `${Math.max(0, leftPos)}px`;
    widget.style.bottom = 'auto';
    widget.style.right  = 'auto';
}

_makeElementDraggable(widget, widget);

/* ==========================================================================
   RENDERIZADO DE LA UI DEL WIDGET
   ========================================================================== */

/**
 * Actualiza todos los elementos visuales del widget basándose en el snapshot.
 * @param {{state: object, settings: object, ciclos: object}} snapshot
 */
function _renderWidget(snapshot) {
    const { state, settings, ciclos, config } = snapshot;

    // Mostrar si estaba oculto
    if (widget.style.display === 'none') {
        widget.style.display = 'flex';
    }

    // --- Reloj ---
    const min     = Math.floor(state.tiempo_restante / 60);
    const sec     = state.tiempo_restante % 60;
    const newTime = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    if (timeEl.textContent !== newTime) {
        timeEl.textContent = newTime;
    }

    // --- Fase (label, ícono, clase de color) ---
    let phaseLabel = 'Enfoque';
    let phaseIcon  = 'timer';
    let phaseClass = 'pomo-float--enfoque';

    if (state.fase_actual === 'descanso_corto') {
        phaseLabel = 'D. Corto';
        phaseIcon  = 'coffee';
        phaseClass = 'pomo-float--corto';
    } else if (state.fase_actual === 'descanso_largo') {
        phaseLabel = 'D. Largo';
        phaseIcon  = 'bed';
        phaseClass = 'pomo-float--largo';
    }

    if (labelEl.textContent !== phaseLabel) {
        labelEl.textContent = phaseLabel;
        iconUseEl.setAttribute('href', `/assets/icons/sprite.svg#${phaseIcon}`);
        widget.classList.remove('pomo-float--enfoque', 'pomo-float--corto', 'pomo-float--largo');
        widget.classList.add(phaseClass);
    }

    // --- Sesión actual / total ---
    const sessionText = `${ciclos.ciclo_actual || 1}/${settings.sesiones_por_ciclo || 4}`;
    if (sessionEl.textContent !== sessionText) {
        sessionEl.textContent = sessionText;
    }

    // --- Botón Play/Pause ---
    const isRunning       = state.estado_reloj === 'corriendo';
    const playIcon        = isRunning ? 'pause' : 'play';
    const currentPlayHref = playUseEl.getAttribute('href') || '';
    if (!currentPlayHref.endsWith(`#${playIcon}`)) {
        playUseEl.setAttribute('href', `/assets/icons/sprite.svg#${playIcon}`);
        playBtn.title = isRunning ? 'Pausar' : 'Reanudar';
        playBtn.setAttribute('aria-label', playBtn.title);
    }
}

/**
 * Evalúa el snapshot del servicio y decide si el widget debe mostrarse u ocultarse.
 * El widget solo es visible cuando el reloj está activamente corriendo.
 * @param {{state: object, settings: object, ciclos: object}} snapshot
 */
function _sincronizarVisibilidad(snapshot) {
    let widgetVisible = localStorage.getItem('cursus_pomo_widget_visible') === 'true';
    const tutorialShown = localStorage.getItem('cursus_pomo_widget_tutorial_shown') === 'true';

    // Aparición Natural: si no vio el tutorial y el reloj no está detenido, activamos el widget
    if (!tutorialShown && snapshot.state.estado_reloj !== 'detenido') {
        widgetVisible = true;
        localStorage.setItem('cursus_pomo_widget_visible', 'true');
        
        // Disparar evento para que el menú de perfil global se entere (si está abierto)
        window.dispatchEvent(new Event('storage'));
    }

    if (!widgetVisible) {
        widget.classList.remove('is-visible');
        return;
    }

    widget.classList.add('is-visible');
    _renderWidget(snapshot);

    if (widgetVisible && !tutorialShown) {
        _mostrarTutorial();
    }
}

function _mostrarTutorial() {
    if (document.getElementById('pomo-widget-tutorial')) return;
    
    const tooltip = document.createElement('div');
    tooltip.id = 'pomo-widget-tutorial';
    tooltip.className = 'pomo-float__tutorial';
    tooltip.innerHTML = `
        <h4 class="pomo-float__tutorial-title">Tu Pomodoro te acompaña</h4>
        <p class="pomo-float__tutorial-text">
            Este widget te permite pausar o reanudar el tiempo desde cualquier página.<br><br>
            Para configurar tus ciclos o tiempos, debes ir al <b>Área de Estudio</b>.<br><br>
            Puedes ocultar/mostrar este widget en cualquier momento usando el switch en tu <b>Menú de Perfil</b>. También puedes ocultarlo pulsando la 'X'.
        </p>
        <button id="pomo-tutorial-ok" class="pomo-float__tutorial-btn" type="button">Entendido</button>
        <div class="pomo-float__tutorial-arrow"></div>
    `;
    
    widget.appendChild(tooltip);
    
    document.getElementById('pomo-tutorial-ok').addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar arrastre del widget
        localStorage.setItem('cursus_pomo_widget_tutorial_shown', 'true');
        tooltip.remove();
    });
}

/* ==========================================================================
   SUSCRIPCIONES AL OBSERVER (PomodoroStateService)
   ========================================================================== */

/**
 * `pomo:tick` — cada segundo mientras corre el reloj.
 * Solo actualiza el texto del tiempo para evitar renders innecesarios.
 */
pomodoroService.addEventListener('pomo:tick', (e) => {
    // Si no está visible, ni siquiera nos molestamos en sincronizar a cada segundo
    if (localStorage.getItem('cursus_pomo_widget_visible') !== 'true') return;
    _sincronizarVisibilidad(e.detail);
});

/**
 * `pomo:estadoCambiado` — al iniciar, pausar, detener o cambiar preset.
 * Redibujar todo el widget y reevaluar la visibilidad.
 */
pomodoroService.addEventListener('pomo:estadoCambiado', (e) => {
    _sincronizarVisibilidad(e.detail);
});

/**
 * `pomo:faseCompletada` — cuando una fase termina naturalmente.
 * El widget reproduce la alarma de audio (SRP: el servicio no conoce el audio).
 */
pomodoroService.addEventListener('pomo:faseCompletada', () => {
    const config = pomodoroService.obtenerSnapshot().config;
    if (config.reproducir_alarma) {
        playPomoAlarm(config.sonido_alarma);
    }
});

/* ==========================================================================
   INICIALIZACIÓN: Bootstrapping del servicio en páginas sin área-estudio
   ========================================================================== */

// Iniciar el servicio (lee localStorage, arranca ticker si es necesario, 
// y registra el listener interno de storage para sincronización multi-pestaña)
pomodoroService.init((msg, type) => {
    // Fallback de notificaciones para el Dashboard
    console.log(`[PomoFloat] ${type}: ${msg}`);
});

// Llamada inicial para pintar el estado cargado
_sincronizarVisibilidad(pomodoroService.obtenerSnapshot());

// Sincronizar configuración con el backend en segundo plano
pomodoroService.sincronizarConfigDesdeBackend();

/* ==========================================================================
   HANDLERS DE BOTONES
   ========================================================================== */

infoWrapper.addEventListener('click', () => {
    if (widget.classList.contains('pomo-float--minimized')) {
        widget.classList.remove('pomo-float--minimized');
        return;
    }
    actionsWrapper.classList.toggle('pomo-float__actions--visible');
});

playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const snapshot = pomodoroService.obtenerSnapshot();
    if (!snapshot) return;

    if (snapshot.state.estado_reloj === 'corriendo') {
        pomodoroService.pausar();
    } else {
        // Desbloquear AudioContext con el gesto del usuario antes de iniciar
        unlockPomoAudio();
        pomodoroService.iniciar();
    }
});

navBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = '/area-estudio';
});

minBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    actionsWrapper.classList.remove('pomo-float__actions--visible');
    widget.classList.add('pomo-float--minimized');
});

closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.setItem('cursus_pomo_widget_visible', 'false');
    widget.classList.remove('is-visible');
    window.dispatchEvent(new Event('storage')); // Notificar al menú de perfil global
});

/* ==========================================================================
   SINCRONIZACIÓN DEL SWITCH GLOBAL DE PERFIL
   ========================================================================== */

const globalWidgetToggle = document.getElementById('global-widget-toggle');
if (globalWidgetToggle) {
    // Estado inicial
    globalWidgetToggle.checked = localStorage.getItem('cursus_pomo_widget_visible') === 'true';

    // Al hacer clic en el switch
    globalWidgetToggle.addEventListener('change', (e) => {
        localStorage.setItem('cursus_pomo_widget_visible', e.target.checked ? 'true' : 'false');
        
        // Si el usuario lo enciende manualmente por primera vez, forzamos mostrar el tutorial
        if (e.target.checked && localStorage.getItem('cursus_pomo_widget_tutorial_shown') !== 'true') {
            _mostrarTutorial();
        }

        // Forzamos la actualización visual
        const snapshot = pomodoroService.obtenerSnapshot();
        _sincronizarVisibilidad(snapshot);
        
        // Notificar a otras pestañas
        window.dispatchEvent(new Event('storage'));
    });

    // Mantener el switch sincronizado si se cierra el widget con la "X" o se cambia en otra pestaña
    window.addEventListener('storage', () => {
        globalWidgetToggle.checked = localStorage.getItem('cursus_pomo_widget_visible') === 'true';
    });
}

/* ==========================================================================
   HELPERS DE ARRASTRE (Mouse + Touch)
   ========================================================================== */

/**
 * Habilita el arrastre libre del widget por la pantalla.
 * Persiste la posición final en localStorage para restaurarla en la próxima
 * carga. Distingue entre "arrastre real" y "clic simple" por desplazamiento.
 *
 * @param {HTMLElement} el     - El elemento a mover.
 * @param {HTMLElement} handle - El área de agarre (puede ser el mismo elemento).
 */
function _makeElementDraggable(el, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging    = false;
    let dragStartTime = 0;

    handle.onmousedown  = _dragStart;
    handle.ontouchstart = _dragStart;

    function _dragStart(e) {
        // No arrastrar si el clic fue en un botón de acción
        if (e.target.closest('.pomo-float__btn')) return;

        if (e.type === 'touchstart') {
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
        } else {
            pos3 = e.clientX;
            pos4 = e.clientY;
        }

        isDragging    = false;
        dragStartTime = Date.now();

        document.onmouseup   = _dragEnd;
        document.ontouchend  = _dragEnd;
        document.onmousemove = _dragMove;
        document.ontouchmove = _dragMove;
    }

    function _dragMove(e) {
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        if (Math.abs(clientX - pos3) > 5 || Math.abs(clientY - pos4) > 5) {
            isDragging = true;
        }
        if (!isDragging) return;
        if (e.type === 'touchmove') e.preventDefault();

        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        const padding = 10;
        let newTop  = el.offsetTop  - pos2;
        let newLeft = el.offsetLeft - pos1;
        const maxTop  = window.innerHeight - el.offsetHeight - padding;
        const maxLeft = window.innerWidth  - el.offsetWidth  - padding;

        if (newTop  < padding) newTop  = padding;
        if (newTop  > maxTop)  newTop  = maxTop;
        if (newLeft < padding) newLeft = padding;
        if (newLeft > maxLeft) newLeft = maxLeft;

        el.style.top    = newTop  + 'px';
        el.style.left   = newLeft + 'px';
        el.style.bottom = 'auto';
        el.style.right  = 'auto';
    }

    function _dragEnd(e) {
        document.onmouseup   = null;
        document.onmousemove = null;
        document.ontouchend  = null;
        document.ontouchmove = null;

        if (isDragging && Date.now() - dragStartTime > 150) {
            // Cancelar el click subsecuente para que el toggle no se active
            if (e) e.stopPropagation();
            const captureClick = (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                window.removeEventListener('click', captureClick, true);
            };
            window.addEventListener('click', captureClick, true);
            setTimeout(() => window.removeEventListener('click', captureClick, true), 50);
        }

        if (isDragging) {
            localStorage.setItem('cursus_pomo_float_pos', JSON.stringify({
                top:  el.style.top,
                left: el.style.left,
            }));
        }
    }
}

/* ==========================================================================
   EXPORTS GLOBALES — window.* para handlers inline de Blade
   ========================================================================== */

// Actualmente el widget no expone funciones a HTML inline de Blade.
// Si en el futuro se agrega un botón en el layout con onclick="...", registrar aquí:
// window.togglePomoFloat = () => { ... };

} // Fin de la guardia `if (!inAreaEstudio)`
