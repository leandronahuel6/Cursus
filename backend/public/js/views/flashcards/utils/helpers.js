/**
 * @fileoverview Funciones de utilidad reutilizables para el módulo Flashcards.
 *
 * Contiene helpers puros sin efectos secundarios (escape de HTML, parseo de
 * Markdown, barajado de arrays), así como las utilidades de experiencia de
 * usuario: atajos de teclado y síntesis de voz (Text-To-Speech).
 *
 * Al ser funciones puras y sin estado propio, son testables de forma aislada.
 *
 * @module utils/helpers
 */

import {
    currentStudyMode,
    keyboardListener,
    setKeyboardListener,
} from '../state.js';

// ==========================================================================
// UTILIDADES PURAS
// ==========================================================================

/**
 * Baraja un array de forma aleatoria usando el algoritmo Fisher-Yates.
 * No muta el array original; devuelve una copia.
 * @template T
 * @param {T[]} array - Array a barajar.
 * @returns {T[]} Nueva copia del array con los elementos en orden aleatorio.
 */
export function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Escapa caracteres especiales de HTML para prevenir XSS al inyectar
 * contenido generado por el usuario en innerHTML.
 * @param {string} text - Texto crudo potencialmente peligroso.
 * @returns {string} Texto con entidades HTML escapadas.
 */
export function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Escapa caracteres especiales para uso seguro dentro de atributos HTML
 * o literales de cadena en JavaScript embebido en strings de template.
 * @param {string} text - Texto a escapar.
 * @returns {string} Texto con caracteres de escape para JS.
 */
export function escapeJs(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

/**
 * Convierte texto con formato Markdown simplificado a HTML seguro.
 * Soporta bloques de código, código inline, negrita, cursiva y listas con viñetas.
 * Escapa el HTML primero para evitar inyecciones.
 *
 * @param {string} text - Texto en Markdown simplificado.
 * @returns {string} HTML listo para inyectar en el DOM vía innerHTML.
 */
export function parseCardText(text) {
    if (!text) return '';
    let escaped = escapeHtml(text);

    // Bloques de código (multilínea) con efecto terminal oscuro
    escaped = escaped.replace(
        /```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g,
        '<pre class="card-code-block"><code>$1</code></pre>',
    );

    // Código inline
    escaped = escaped.replace(
        /`([^`]+)`/g,
        '<code class="card-code-inline">$1</code>',
    );

    // Negrita (**texto**)
    escaped = escaped.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');

    // Cursiva (*texto*)
    escaped = escaped.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');

    // Listas con viñetas (procesadas línea a línea para semántica correcta)
    const lines = escaped.split('\n');
    let inList = false;
    const processedLines = [];

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- ')) {
            if (!inList) {
                processedLines.push('<ul class="card-list">');
                inList = true;
            }
            processedLines.push(`<li class="card-list__item">${trimmed.substring(2)}</li>`);
        } else {
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            processedLines.push(line);
        }
    });
    if (inList) processedLines.push('</ul>');

    escaped = processedLines.join('\n');

    // Saltos de línea a <br>
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
}

/**
 * Devuelve la clase de precisión BEM correspondiente al porcentaje de acierto.
 * @param {number|null} accuracy - Porcentaje de acierto (0–100) o null si no hay datos.
 * @returns {'accuracy-high'|'accuracy-medium'|'accuracy-low'|'accuracy-none'} Clase BEM.
 */
export function getAccuracyClass(accuracy) {
    if (accuracy === null) return 'accuracy-none';
    if (accuracy >= 80) return 'accuracy-high';
    if (accuracy >= 50) return 'accuracy-medium';
    return 'accuracy-low';
}

/**
 * Devuelve el texto descriptivo del porcentaje de acierto.
 * @param {number|null} accuracy - Porcentaje de acierto (0–100) o null si no hay datos.
 * @returns {string} Cadena de texto para mostrar al usuario.
 */
export function getAccuracyText(accuracy) {
    if (accuracy === null) return 'Sin datos';
    return `${accuracy}% aciertos`;
}

/**
 * Aplica KaTeX a un elemento del DOM si la librería está disponible en `window`.
 * Configurado para soportar delimitadores inline ($) y bloque ($$).
 * @param {HTMLElement} element - El elemento donde renderizar las fórmulas.
 * @returns {void}
 */
export function renderKatexInElement(element) {
    if (typeof window.renderMathInElement !== 'function') return;
    window.renderMathInElement(element, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
    });
}

// ==========================================================================
// ATAJOS DE TECLADO
// ==========================================================================

/**
 * @callback FlipCallback
 * @returns {void}
 */

/**
 * @callback SubmitResultCallback
 * @param {'correcto'|'incorrecto'} outcome - Resultado a registrar.
 * @returns {void}
 */

/**
 * Activa los atajos de teclado globales para la sesión de estudio 3D.
 * - [Espacio]: Voltea la tarjeta actual.
 * - [1] o [←]: Marca la tarjeta como incorrecta (solo si ya está volteada).
 * - [2] o [→]: Marca la tarjeta como correcta (solo si ya está volteada).
 *
 * Los atajos se bloquean automáticamente cuando el foco está en un campo
 * de texto (input, textarea o contenteditable) para evitar conflictos.
 * El listener se registra solo una vez; llamadas redundantes son ignoradas.
 *
 * @param {FlipCallback}         onFlip         - Función a llamar para voltear la tarjeta.
 * @param {SubmitResultCallback} onSubmitResult - Función a llamar para registrar el resultado.
 * @returns {void}
 */
export function enableKeyboardShortcuts(onFlip, onSubmitResult) {
    if (keyboardListener) return; // Ya registrado, evitar duplicados

    const handler = (e) => {
        // Bloquear atajos cuando el usuario escribe en un campo de texto
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        // En modo examen no hay atajos para evitar colisiones con la UI de opciones
        if (currentStudyMode === 'exam') return;

        const flipCard = document.getElementById('flip-card');
        if (!flipCard) return;

        if (e.code === 'Space') {
            e.preventDefault();
            onFlip();
        } else if ((e.code === 'Digit1' || e.code === 'ArrowLeft') && flipCard.classList.contains('flipped')) {
            onSubmitResult('incorrecto');
        } else if ((e.code === 'Digit2' || e.code === 'ArrowRight') && flipCard.classList.contains('flipped')) {
            onSubmitResult('correcto');
        }
    };

    document.addEventListener('keydown', handler);
    setKeyboardListener(handler);
}

/**
 * Desactiva y elimina el listener de atajos de teclado activo.
 * Es seguro llamarla múltiples veces; si no hay listener activo, no hace nada.
 * @returns {void}
 */
export function disableKeyboardShortcuts() {
    if (!keyboardListener) return;
    document.removeEventListener('keydown', keyboardListener);
    setKeyboardListener(null);
}

// ==========================================================================
// TEXT-TO-SPEECH (TTS)
// ==========================================================================

/**
 * Lee en voz alta el contenido de texto plano de un elemento del DOM,
 * ignorando el markup HTML y Markdown.
 * Cancela cualquier lectura activa antes de iniciar la nueva.
 *
 * @param {Event|null} event     - Evento del DOM que originó la acción (para detener propagación).
 * @param {string}     elementId - ID del elemento cuyo texto se leerá.
 * @returns {void}
 */
export function speakCardText(event, elementId) {
    if (event) event.stopPropagation(); // Evitar que el clic voltee la tarjeta

    if (!('speechSynthesis' in window)) {
        // Importación dinámica de showToast para evitar dependencia circular
        import('../main.js').then(({ showToastGlobal }) => {
            showToastGlobal('Tu navegador no soporta síntesis de voz.', 'error');
        });
        return;
    }

    window.speechSynthesis.cancel();

    const el = document.getElementById(elementId);
    if (!el) return;

    // Extraer texto plano eliminando fragmentos de Markdown y código
    const cleanText = el.innerText
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/[-*]\s+/g, '')
        .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';

    // Seleccionar la voz en español de mejor calidad disponible en el navegador
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find((v) => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    window.speechSynthesis.speak(utterance);
}
