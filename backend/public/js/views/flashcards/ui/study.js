/**
 * @fileoverview Motor de sesión de estudio activo del módulo Flashcards.
 *
 * Gestiona los dos modos de estudio disponibles:
 *   1. **Modo Tarjeta (3D Flip):** Flip card con animación 3D, controles de
 *      resultado (correcto/incorrecto) y atajos de teclado.
 *   2. **Modo Examen (Quizlet-style):** Cuestionario de opción múltiple con
 *      distractores reales o generados aleatoriamente.
 *
 * También gestiona:
 *   - La pantalla de resumen final con el progreso circular animado y confetti.
 *   - Las transiciones entre secciones (Mazos → Estudio → Resumen → Mazos).
 *
 * @module ui/study
 */

import {
    currentDecks,
    currentStudyCards,
    currentStudyIndex,
    currentSessionCorrect,
    currentSessionIncorrect,
    masterSessionCards,
    currentStudyMode,
    setCurrentStudyDeck,
    setCurrentStudyCards,
    setMasterSessionCards,
    setCurrentStudyIndex,
    setCurrentSessionCorrect,
    setCurrentSessionIncorrect,
    setCurrentStudyMode,
    selectedDeckIdForStudy,
    resetStudySession,
} from '../state.js';
import { fetchDeckCards, submitCardResultFireAndForget } from '../api.js';
import { shuffleArray, parseCardText, renderKatexInElement, speakCardText } from '../utils/helpers.js';
import { showCustomConfirm, closeStudyModeModal } from './modals.js';
import { loadDecks } from './decks.js';

// Referencias cacheadas a las secciones del DOM para evitar búsquedas repetidas
const sectionDecks   = document.getElementById('section-decks');
const sectionStudy   = document.getElementById('section-study');
const sectionSummary = document.getElementById('section-summary');

// ==========================================================================
// INICIO Y CONTROL DE SESIÓN
// ==========================================================================

/**
 * Lee el modo elegido en el modal, carga las tarjetas del mazo y activa la
 * vista de estudio. Llamado cuando el usuario confirma el modo de estudio.
 * @returns {Promise<void>}
 */
export async function confirmStudySessionStart() {
    const choiceInput = document.querySelector('input[name="study-mode-choice"]:checked');
    if (!choiceInput) return;

    const choice = /** @type {'all'|'exam'} */ (choiceInput.value);
    setCurrentStudyMode(choice);
    closeStudyModeModal();

    const deckId = selectedDeckIdForStudy;

    try {
        let cards = await fetchDeckCards(deckId);
        if (cards.length === 0) {
            showToast('Este mazo no tiene tarjetas para estudiar.', 'error');
            return;
        }

        const deck = currentDecks.find((d) => d.id === deckId);
        setCurrentStudyDeck(deck ?? null);
        setMasterSessionCards(cards); // Copia maestra para distractores

        cards = shuffleArray(cards);

        if (currentStudyMode === 'exam') {
            const limitSelect = document.getElementById('exam-question-count');
            if (limitSelect && limitSelect.value !== 'all') {
                const limit = parseInt(limitSelect.value, 10);
                if (!isNaN(limit)) cards = cards.slice(0, limit);
            }
        }

        setCurrentStudyCards(cards);
        resetStudySession();

        _transitionToSection(sectionDecks, sectionStudy);
        showStudyCard(0);

        if (currentStudyMode !== 'exam') {
            // Los atajos de teclado se activan desde main.js que inyecta los callbacks
            document.dispatchEvent(new CustomEvent('fc:enable-keyboard-shortcuts'));
        } else {
            document.dispatchEvent(new CustomEvent('fc:disable-keyboard-shortcuts'));
        }
    } catch (error) {
        console.error('[Flashcards] Error al iniciar sesión de estudio:', error);
        showToast('Error al iniciar sesión de estudio. Intenta de nuevo.', 'error');
    }
}

/**
 * Muestra la tarjeta de estudio en el índice dado, configurando el DOM
 * según el modo de estudio activo (tarjeta 3D o examen).
 * @param {number} index - Índice de la tarjeta a mostrar en `currentStudyCards`.
 * @returns {void}
 */
export function showStudyCard(index) {
    const card = currentStudyCards[index];
    if (!card) return;

    // Actualizar barra de progreso
    const progressPercent = (index / currentStudyCards.length) * 100;
    const progressBar = document.getElementById('study-progress-bar');
    const progressText = document.getElementById('study-progress-text');
    if (progressBar)  progressBar.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `Tarjeta ${index + 1} de ${currentStudyCards.length}`;

    if (currentStudyMode === 'exam') {
        _showExamCard(card);
    } else {
        _showFlipCard(card);
    }
}

// ==========================================================================
// MODO TARJETA 3D (FLIP)
// ==========================================================================

/**
 * Configura el DOM para mostrar una tarjeta en modo 3D Flip.
 * Resetea el estado de la tarjeta (sin voltear, sin sacudida) y carga el
 * contenido de pregunta y respuesta con soporte de KaTeX.
 * @param {import('../state.js').Card} card - Tarjeta a mostrar.
 * @returns {void}
 */
function _showFlipCard(card) {
    const cardModeWrapper = document.getElementById('card-mode-wrapper');
    const examModeWrapper = document.getElementById('exam-mode-wrapper');
    const studyControls   = document.getElementById('study-controls');
    const flipHintMessage = document.getElementById('flip-hint-message');

    cardModeWrapper?.removeAttribute('hidden');
    examModeWrapper?.setAttribute('hidden', '');
    studyControls?.removeAttribute('hidden');
    flipHintMessage?.removeAttribute('hidden');

    const flipCard = document.getElementById('flip-card');
    flipCard?.classList.remove('flipped', 'shake-incorrect');

    const qTextEl = document.getElementById('card-question-text');
    const aTextEl = document.getElementById('card-answer-text');

    if (qTextEl) {
        qTextEl.innerHTML = parseCardText(card.pregunta);
        renderKatexInElement(qTextEl);
    }
    if (aTextEl) {
        aTextEl.innerHTML = parseCardText(card.respuesta);
        renderKatexInElement(aTextEl);
    }

    // Estadísticas de la tarjeta
    const totalAttempts = (card.correctas || 0) + (card.incorrectas || 0);
    const cardAccuracy  = totalAttempts > 0
        ? Math.round(((card.correctas || 0) / totalAttempts) * 100)
        : null;
    const cardStatsEl = document.getElementById('card-study-stats');
    if (cardStatsEl) {
        cardStatsEl.textContent = cardAccuracy !== null
            ? `Historial: 🟢 ${card.correctas} | 🔴 ${card.incorrectas} (${cardAccuracy}% aciertos)`
            : 'Sin repaso previo';
    }

    // Resetear controles a estado "antes de voltear"
    if (studyControls) {
        studyControls.classList.remove('visible');
        if (document.activeElement && studyControls.contains(document.activeElement)) {
            document.activeElement.blur(); // Remueve el foco retenido antes de aplicar inert
        }
        studyControls.inert = true; // Bloquea teclado completamente (accesibilidad)
    }
    flipHintMessage?.classList.remove('hint-hidden');

    // Actualizar aria-label del flip card
    flipCard?.setAttribute('aria-label', 'Tarjeta. Presiona para ver la respuesta.');
}

/**
 * Voltea la tarjeta de estudio 3D. Si ya está volteada, muestra los controles
 * de resultado. Si no, los oculta.
 * @returns {void}
 */
export function flipStudyCard() {
    if (currentStudyMode === 'exam') return;
    const flipCard = document.getElementById('flip-card');
    if (!flipCard) return;

    flipCard.classList.toggle('flipped');
    const isFlipped = flipCard.classList.contains('flipped');

    const studyControls = document.getElementById('study-controls');
    if (studyControls) {
        studyControls.classList.toggle('visible', isFlipped);
        if (!isFlipped && document.activeElement && studyControls.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        studyControls.inert = !isFlipped; // Libera el bloqueo de foco
    }

    document.getElementById('flip-hint-message')?.classList.toggle('hint-hidden', isFlipped);

    // Actualizar ARIA
    flipCard.setAttribute('aria-label', isFlipped
        ? 'Tarjeta (respuesta visible). Presiona para volver al frente.'
        : 'Tarjeta. Presiona para ver la respuesta.');
}

/**
 * Registra el resultado de una tarjeta en modo Flip (correcto/incorrecto),
 * actualiza los contadores de sesión, aplica la animación de sacudida si
 * es incorrecto, y avanza a la siguiente tarjeta (o al resumen si es la última).
 * @param {'correcto'|'incorrecto'} outcome - El resultado del intento.
 * @returns {void}
 */
export function submitCardResult(outcome) {
    const card = currentStudyCards[currentStudyIndex];
    if (!card) return;

    if (outcome === 'correcto') {
        setCurrentSessionCorrect(currentSessionCorrect + 1);
    } else {
        setCurrentSessionIncorrect(currentSessionIncorrect + 1);
        // Animación de sacudida en tarjeta incorrecta
        const flipCard = document.getElementById('flip-card');
        if (flipCard) {
            flipCard.classList.add('shake-incorrect');
            setTimeout(() => flipCard.classList.remove('shake-incorrect'), 400);
        }
    }

    submitCardResultFireAndForget(card.id, outcome);

    const nextIndex = currentStudyIndex + 1;
    const delay = outcome === 'incorrecto' ? 450 : 100;

    setTimeout(() => {
        if (nextIndex < currentStudyCards.length) {
            setCurrentStudyIndex(nextIndex);
            showStudyCard(nextIndex);
        } else {
            document.getElementById('study-progress-bar').style.width = '100%';
            showSummarySession();
        }
    }, delay);
}

// ==========================================================================
// MODO EXAMEN (OPCIÓN MÚLTIPLE)
// ==========================================================================

/**
 * Configura el DOM para mostrar una tarjeta en modo Examen (opción múltiple).
 * Construye los botones de opciones dinámicamente con distractores reales o fallback.
 * @param {import('../state.js').Card} card - Tarjeta a mostrar en modo examen.
 * @returns {void}
 */
function _showExamCard(card) {
    const cardModeWrapper = document.getElementById('card-mode-wrapper');
    const examModeWrapper = document.getElementById('exam-mode-wrapper');
    const studyControls   = document.getElementById('study-controls');
    const flipHintMessage = document.getElementById('flip-hint-message');

    cardModeWrapper?.setAttribute('hidden', '');
    examModeWrapper?.removeAttribute('hidden');
    studyControls?.setAttribute('hidden', '');
    flipHintMessage?.setAttribute('hidden', '');

    // Cargar pregunta con KaTeX
    const qExamText = document.getElementById('exam-question-text');
    if (qExamText) {
        qExamText.innerHTML = parseCardText(card.pregunta);
        renderKatexInElement(qExamText);
    }

    // Ocultar botón "Continuar"
    const nextWrapper = document.getElementById('exam-next-action-wrapper');
    if (nextWrapper) nextWrapper.classList.remove('is-visible');

    // Construir las opciones: preferir distractores de la DB, fallback aleatorio
    const correctAnswer = card.respuesta;
    let options;

    if (card.distractor_1) {
        options = [correctAnswer, card.distractor_1, card.distractor_2, card.distractor_3];
    } else {
        const distractors = masterSessionCards
            .filter((c) => c.id !== card.id)
            .map((c) => c.respuesta);
        options = [correctAnswer, ...shuffleArray(distractors).slice(0, 3)];
    }
    options = shuffleArray(options);

    // Pintar botones en el grid de opciones
    const grid = document.getElementById('exam-options-grid');
    if (!grid) return;
    grid.innerHTML = '';

    options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-exam-option';
        btn.setAttribute('aria-label', `Opción ${idx + 1}`);
        btn.innerHTML = parseCardText(opt ?? '');
        renderKatexInElement(btn);

        // Usar delegación de datos en lugar de onclick inline
        btn.dataset.action = 'select-exam-option';
        btn.dataset.chosenAnswer = opt ?? '';
        btn.dataset.correctAnswer = correctAnswer;
        btn.dataset.cardId = String(card.id);

        grid.appendChild(btn);
    });
}

/**
 * Procesa la selección de una opción en el Modo Examen.
 * Deshabilita todos los botones, resalta la opción correcta e incorrecta,
 * actualiza los contadores y muestra el botón "Continuar".
 * @param {HTMLButtonElement} selectedBtn   - El botón de opción que el usuario seleccionó.
 * @param {string}            chosenAnswer  - Texto de la opción seleccionada.
 * @param {string}            correctAnswer - Texto de la respuesta correcta.
 * @param {number}            cardId        - ID de la tarjeta evaluada.
 * @returns {void}
 */
export function selectExamOption(selectedBtn, chosenAnswer, correctAnswer, cardId) {
    const grid = document.getElementById('exam-options-grid');
    const buttons = grid?.querySelectorAll('.btn-exam-option');
    if (!buttons) return;

    // Deshabilitar todas las opciones
    buttons.forEach((btn) => {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
    });

    const isCorrect = chosenAnswer === correctAnswer;
    selectedBtn.classList.add(isCorrect ? 'btn-exam-option--correct' : 'btn-exam-option--incorrect');
    selectedBtn.setAttribute('aria-pressed', 'true');

    if (isCorrect) {
        setCurrentSessionCorrect(currentSessionCorrect + 1);
        submitCardResultFireAndForget(cardId, 'correcto');
    } else {
        setCurrentSessionIncorrect(currentSessionIncorrect + 1);
        submitCardResultFireAndForget(cardId, 'incorrecto');

        // Resaltar la respuesta correcta
        buttons.forEach((btn) => {
            if (
                btn.innerText.trim() === correctAnswer.trim() ||
                btn.textContent.trim() === correctAnswer.trim()
            ) {
                btn.classList.add('btn-exam-option--correct');
            }
        });
    }

    // Mostrar botón "Continuar"
    const nextWrapper = document.getElementById('exam-next-action-wrapper');
    if (nextWrapper) nextWrapper.classList.add('is-visible');
}

/**
 * Avanza a la siguiente tarjeta en el Modo Examen.
 * Si ya no hay más, lleva al resumen final.
 * @returns {void}
 */
export function proceedToNextExamCard() {
    const nextIndex = currentStudyIndex + 1;
    setCurrentStudyIndex(nextIndex);

    if (nextIndex < currentStudyCards.length) {
        showStudyCard(nextIndex);
    } else {
        document.getElementById('study-progress-bar').style.width = '100%';
        showSummarySession();
    }
}

// ==========================================================================
// RESUMEN FINAL DE SESIÓN
// ==========================================================================

/**
 * Muestra la pantalla de resumen al finalizar todos los mazos de la sesión.
 * Anima el progreso circular (SVG), muestra feedback textual y lanza confetti
 * si el porcentaje de acierto supera el 75%.
 * @returns {void}
 */
export function showSummarySession() {
    document.dispatchEvent(new CustomEvent('fc:disable-keyboard-shortcuts'));

    _transitionToSection(sectionStudy, sectionSummary);

    const total          = currentStudyCards.length;
    const accuracyPercent = total > 0 ? Math.round((currentSessionCorrect / total) * 100) : 0;

    // Actualizar contadores
    document.getElementById('summary-stat-correct').textContent   = String(currentSessionCorrect);
    document.getElementById('summary-stat-incorrect').textContent = String(currentSessionIncorrect);
    document.getElementById('summary-stat-total').textContent     = String(total);
    document.getElementById('summary-percentage-text').textContent = `${accuracyPercent}%`;

    // Animar el círculo de progreso SVG
    const fgCircle = document.getElementById('summary-circle-progress');
    if (fgCircle) {
        const radius       = 60;
        const circumference = 2 * Math.PI * radius; // ≈ 377
        fgCircle.style.strokeDashoffset = String(circumference - (accuracyPercent / 100) * circumference);
    }

    // Feedback textual y de color según el resultado
    const feedbackEl  = document.getElementById('summary-feedback-text');
    const feedbackBox = document.getElementById('summary-feedback-box');
    if (feedbackEl && feedbackBox) {
        if (accuracyPercent === 100) {
            feedbackEl.textContent = '¡Increíble! Has dominado el 100% de este mazo. ¡Excelente retención!';
            feedbackBox.dataset.variant = 'success';
        } else if (accuracyPercent >= 70) {
            feedbackEl.textContent = '¡Muy buen rendimiento! Tienes claros la mayoría de los conceptos. Dale un repaso extra para la perfección.';
            feedbackBox.dataset.variant = 'info';
        } else {
            feedbackEl.textContent = 'Sigue repasando este mazo. La repetición espaciada te ayudará a consolidar estos temas complejos.';
            feedbackBox.dataset.variant = 'warning';
        }
    }

    // Confetti si el resultado es alto (y si las animaciones están habilitadas)
    if (accuracyPercent >= 75) {
        _triggerConfettiCelebration();
    }
}

// ==========================================================================
// NAVEGACIÓN ENTRE SECCIONES
// ==========================================================================

/**
 * Solicita confirmación al usuario para salir del estudio activo y, si acepta,
 * retorna a la vista de mazos y recarga la lista.
 * @returns {Promise<void>}
 */
export async function exitStudySession() {
    const confirmed = await showCustomConfirm({
        title: '¿Salir del estudio?',
        message: '¿Estás seguro de que deseas salir? El progreso no guardado de esta sesión se perderá.',
        acceptText: 'Salir',
        cancelText: 'Cancelar',
        isDestructive: true,
    });
    if (!confirmed) return;

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    document.dispatchEvent(new CustomEvent('fc:disable-keyboard-shortcuts'));
    _transitionToSection(sectionStudy, sectionDecks);
    await loadDecks();
}

/**
 * Reinicia la sesión de estudio barajando de nuevo las tarjetas actuales.
 * No recarga desde la API; reutiliza las tarjetas ya en memoria.
 * @returns {void}
 */
export function restartStudySession() {
    setCurrentStudyCards(shuffleArray(currentStudyCards));
    resetStudySession();

    _transitionToSection(sectionSummary, sectionStudy);
    showStudyCard(0);

    if (currentStudyMode !== 'exam') {
        document.dispatchEvent(new CustomEvent('fc:enable-keyboard-shortcuts'));
    }
}

/**
 * Sale de la pantalla de resumen y vuelve a la vista de mazos, recargando la lista.
 * @returns {Promise<void>}
 */
export async function exitSummaryToDecks() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    _transitionToSection(sectionSummary, sectionDecks);
    await loadDecks();
}

// ==========================================================================
// UTILIDADES INTERNAS
// ==========================================================================

/**
 * Oculta una sección y muestra otra en la vista de flashcards de una sola página.
 * Usa el atributo `hidden` para ser semánticamente correcto y accesible.
 * @param {HTMLElement|null} from - Sección a ocultar.
 * @param {HTMLElement|null} to   - Sección a mostrar.
 * @returns {void}
 */
function _transitionToSection(from, to) {
    if (from) {
        from.setAttribute('hidden', '');
    }
    if (to) {
        to.removeAttribute('hidden');
        // Reiniciar la animación fade-in forzando un reflow
        to.classList.remove('fade-in');
        void to.offsetWidth; // Reflow
        to.classList.add('fade-in');
    }
}

/**
 * Lanza la animación de confetti de celebración si la librería canvas-confetti
 * está disponible globalmente y las animaciones están habilitadas.
 * Respeta la preferencia del sistema `prefers-reduced-motion`.
 * @returns {void}
 */
function _triggerConfettiCelebration() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof window.animacionesHabilitadas === 'function' && !window.animacionesHabilitadas()) return;
    if (typeof confetti === 'undefined') return;

    const duration    = 3500;
    const animationEnd = Date.now() + duration;
    const defaults    = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1100 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
        const timeLeft     = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}

// ==========================================================================
// TEXT-TO-SPEECH (delegación al helper)
// ==========================================================================

/**
 * Proxy que expone la función de TTS del módulo de helpers para que el
 * delegador de eventos de main.js pueda llamarla sin importar helpers directamente.
 * @param {Event}  event     - Evento del clic.
 * @param {string} elementId - ID del elemento a leer.
 * @returns {void}
 */
export function handleSpeakCardText(event, elementId) {
    speakCardText(event, elementId);
}
