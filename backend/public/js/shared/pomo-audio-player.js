/**
 * @fileoverview Motor de Audio del Pomodoro (Web Audio API).
 *
 * Responsabilidad única: sintetizar y reproducir sonidos de alarma usando
 * la Web Audio API. Este módulo NO conoce el estado del Pomodoro, NO manipula
 * el DOM y NO realiza peticiones HTTP.
 *
 * Patrón: Módulo de UI aislado (SRP). Debe ser importado y orquestado por
 * los controladores de vista (`area-estudio.js`, `pomo-float.js`), que son
 * quienes escuchan los eventos del dominio (`pomo:faseCompletada`) y deciden
 * cuándo activar el audio.
 *
 * Uso recomendado:
 * ```js
 * import { playPomoAlarm, unlockPomoAudio } from '../shared/pomo-audio-player.js';
 *
 * // Desbloquear en el primer gesto del usuario (requisito de los navegadores)
 * btnPlay.addEventListener('click', () => unlockPomoAudio());
 *
 * // Reproducir al recibir el evento del servicio
 * pomodoroService.addEventListener('pomo:faseCompletada', (e) => {
 *     const config = pomodoroService.obtenerSnapshot().config;
 *     if (config.reproducir_alarma) {
 *         playPomoAlarm(config.sonido_alarma);
 *     }
 * });
 * ```
 *
 * @module pomo-audio-player
 */

'use strict';

/* ==========================================================================
   ESTADO INTERNO DEL CONTEXTO DE AUDIO
   ========================================================================== */

/**
 * Instancia compartida del AudioContext.
 * Se crea de forma diferida en el primer gesto del usuario para cumplir con
 * la política de autoplay de Chrome, Firefox y Safari modernos.
 * @type {AudioContext|null}
 */
let _audioCtx = null;

/* ==========================================================================
   API PÚBLICA
   ========================================================================== */

/**
 * Inicializa o reanuda el AudioContext.
 * **Debe llamarse dentro de un event listener de gesto del usuario** (click,
 * keydown, etc.) antes de invocar `playPomoAlarm` por primera vez.
 * Llamadas posteriores son no-op si el contexto ya está activo.
 *
 * @returns {AudioContext|null} El contexto activo, o null si la API no está disponible.
 */
export function unlockPomoAudio() {
    if (!_audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return null;
        _audioCtx = new AudioCtor();
    }
    if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
    }
    return _audioCtx;
}

/**
 * Reproduce la alarma del Pomodoro según el nombre de sonido configurado.
 * Si el AudioContext aún no fue desbloqueado por un gesto del usuario, la
 * función intenta un desbloqueo preventivo (que puede fallar silenciosamente
 * en navegadores estrictos, pero no arroja excepción).
 *
 * @param {'chime'|'beep'|'zen'|'none'} soundName - Identificador del sonido a reproducir.
 */
export function playPomoAlarm(soundName) {
    if (!soundName || soundName === 'none') return;

    const ctx = unlockPomoAudio();
    if (!ctx) return;

    try {
        if (soundName === 'chime')     _playChime(ctx);
        else if (soundName === 'beep') _playBeep(ctx);
        else if (soundName === 'zen')  _playZen(ctx);
    } catch (e) {
        // La Web Audio API puede lanzar en algunos entornos restringidos.
        // Fallar silenciosamente es preferible a romper la UI.
        console.warn('[pomo-audio-player] Error reproduciendo alarma:', e);
    }
}

/* ==========================================================================
   SINTETIZADORES PRIVADOS
   ========================================================================== */

/**
 * Chime de dos notas ascendentes (880 Hz → 1175 Hz).
 * Ideal para el fin de una sesión de enfoque.
 * @param {AudioContext} ctx
 */
function _playChime(ctx) {
    [880, 1175].forEach((freq, i) => {
        const start = ctx.currentTime + i * 0.16;
        const osc   = ctx.createOscillator();
        const gain  = ctx.createGain();
        osc.type            = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.75);
    });
}

/**
 * Tres beeps cortos y agudos (Si5 — 987.77 Hz).
 * Ideal para la alerta del Modo Estricto al cambiar de pestaña.
 * @param {AudioContext} ctx
 */
function _playBeep(ctx) {
    [0, 0.2, 0.4].forEach((delay) => {
        const start = ctx.currentTime + delay;
        const osc   = ctx.createOscillator();
        const gain  = ctx.createGain();
        osc.type            = 'square';
        osc.frequency.value = 987.77;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.01);
        gain.gain.setValueAtTime(0.08, start + 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.15);
    });
}

/**
 * Acorde zen de cuatro frecuencias armónicas (440 / 554 / 659 / 880 Hz).
 * Ideal para el fin de un periodo de descanso.
 * @param {AudioContext} ctx
 */
function _playZen(ctx) {
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc   = ctx.createOscillator();
        const gain  = ctx.createGain();
        osc.type            = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        const start = ctx.currentTime;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.05, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 1.8 - (i * 0.2));
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 2.0);
    });
}
