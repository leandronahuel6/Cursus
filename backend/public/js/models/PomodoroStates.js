/**
 * @fileoverview Módulo de la Máquina de Estados del Pomodoro (State Pattern).
 *
 * Define las tres fases del ciclo Pomodoro como objetos inmutables con sus
 * propias reglas de duración y transición. Esto elimina los condicionales
 * dispersos (`if (fase === 'enfoque') ...`) en favor de polimorfismo:
 * `ESTADOS_POMO[fase].duracion(settings)` en lugar de N bloques if/else.
 *
 * Cada fase implementa la misma interfaz de tres métodos:
 * - `duracion(settings)` → número de segundos totales de esta fase.
 * - `siguiente(ciclos, settings)` → clave de la próxima fase (puede mutar ciclos).
 * - `etiqueta()` → texto legible para mostrar en la UI.
 * - `colorClass()` → clase CSS del ring SVG en el Modo Concentración.
 *
 * @module PomodoroStates
 */

'use strict';

/* ==========================================================================
   FASE: ENFOQUE
   ========================================================================== */

/**
 * Fase activa de concentración (trabajo real).
 *
 * Es la única fase que incrementa el contador de ciclo y decide si la
 * siguiente pausa será corta o larga. Esta responsabilidad está aquí
 * y no en el service para respetar el Principio de Responsabilidad Única.
 */
class FaseEnfoque {
    /**
     * Devuelve la duración en segundos configurada para el enfoque.
     * @param {object} settings - Configuración activa del Pomodoro.
     * @param {number} settings.tiempo_enfoque - Minutos de enfoque.
     * @returns {number} Duración en segundos.
     */
    duracion(settings) {
        return settings.tiempo_enfoque * 60;
    }

    /**
     * Determina la siguiente fase y actualiza el estado del ciclo en consecuencia.
     *
     * Si el ciclo actual es el último de la sesión configurada, la siguiente
     * fase es un descanso largo y el ciclo se reinicia a 1. De lo contrario,
     * se avanza al siguiente ciclo y la pausa es corta.
     *
     * @param {object} ciclos - Estado mutable de los ciclos.
     * @param {number} ciclos.ciclo_actual - Número del ciclo en curso (1-indexado).
     * @param {object} settings - Configuración activa del Pomodoro.
     * @param {number} settings.sesiones_por_ciclo - Ciclos antes del descanso largo.
     * @returns {string} Clave de la fase siguiente ('descanso_corto' | 'descanso_largo').
     */
    siguiente(ciclos, settings) {
        if (ciclos.ciclo_actual < settings.sesiones_por_ciclo) {
            ciclos.ciclo_actual++;
            return 'descanso_corto';
        }
        ciclos.ciclo_actual = 1;
        return 'descanso_largo';
    }

    /** @returns {string} Etiqueta legible para la UI. */
    etiqueta() {
        return 'Enfoque';
    }

    /** @returns {string} Clase CSS para el color del ring SVG en Modo Concentración. */
    colorClass() {
        return 'enfoque';
    }
}

/* ==========================================================================
   FASE: DESCANSO CORTO
   ========================================================================== */

/**
 * Fase de pausa breve entre sesiones de enfoque.
 * El contador de ciclo ya fue incrementado por la fase de enfoque previa,
 * por lo que esta fase solo necesita retornar 'enfoque' como siguiente.
 */
class FaseDescansoCorto {
    /**
     * @param {object} settings
     * @param {number} settings.descanso_corto - Minutos de descanso corto.
     * @returns {number} Duración en segundos.
     */
    duracion(settings) {
        return settings.descanso_corto * 60;
    }

    /**
     * Al terminar el descanso corto siempre se regresa a enfoque.
     * No muta el estado de ciclos (fue actualizado en la fase de enfoque anterior).
     * @param {object} ciclos - No se muta en esta transición.
     * @param {object} settings - No es relevante en esta transición.
     * @returns {string} Siempre 'enfoque'.
     */
    siguiente(ciclos, settings) {
        return 'enfoque';
    }

    /** @returns {string} */
    etiqueta() {
        return 'Descanso Corto';
    }

    /** @returns {string} */
    colorClass() {
        return 'descanso-corto';
    }
}

/* ==========================================================================
   FASE: DESCANSO LARGO
   ========================================================================== */

/**
 * Fase de pausa extensa al completar un ciclo completo de sesiones.
 * El ciclo ya fue reiniciado a 1 por la fase de enfoque previa.
 */
class FaseDescansoLargo {
    /**
     * @param {object} settings
     * @param {number} settings.descanso_largo - Minutos de descanso largo.
     * @returns {number} Duración en segundos.
     */
    duracion(settings) {
        return settings.descanso_largo * 60;
    }

    /**
     * Al terminar el descanso largo siempre se regresa a enfoque.
     * @param {object} ciclos - No se muta en esta transición.
     * @param {object} settings - No es relevante en esta transición.
     * @returns {string} Siempre 'enfoque'.
     */
    siguiente(ciclos, settings) {
        return 'enfoque';
    }

    /** @returns {string} */
    etiqueta() {
        return 'Descanso Largo';
    }

    /** @returns {string} */
    colorClass() {
        return 'descanso-largo';
    }
}

/* ==========================================================================
   MAPA DE ESTADOS (SSOT del State Pattern)
   ========================================================================== */

/**
 * Mapa centralizado que asocia cada clave de fase (almacenada en localStorage
 * y en el estado interno del servicio) con su objeto de fase correspondiente.
 *
 * Uso: `ESTADOS_POMO['enfoque'].duracion(settings)` en lugar de
 * `if (fase === 'enfoque') return settings.tiempo_enfoque * 60`.
 *
 * Incluir una nueva fase en el futuro requiere únicamente:
 * 1. Crear la clase que implemente la interfaz de cuatro métodos.
 * 2. Añadir la entrada a este mapa.
 * El resto del código del servicio no necesita modificarse.
 *
 * @type {Object.<string, FaseEnfoque|FaseDescansoCorto|FaseDescansoLargo>}
 */
const ESTADOS_POMO = {
    enfoque:        new FaseEnfoque(),
    descanso_corto: new FaseDescansoCorto(),
    descanso_largo: new FaseDescansoLargo(),
};

export { ESTADOS_POMO };
