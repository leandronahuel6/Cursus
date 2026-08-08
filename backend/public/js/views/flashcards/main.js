/**
 * @fileoverview Módulo principal y orquestador del módulo Flashcards.
 *
 * Punto de entrada único de la vista. Es el único archivo que:
 *   1. Ejecuta la inicialización en DOMContentLoaded.
 *   2. Registra TODOS los event listeners del módulo, usando una única estrategia
 *      de **delegación de eventos** sobre el documento y los contenedores raíz,
 *      en lugar de listeners individuales en cada elemento.
 *   3. Escucha los CustomEvents internos del módulo (ej. `fc:enable-keyboard-shortcuts`).
 *
 * Ningún otro módulo registra event listeners de click/submit directamente en elementos.
 * Toda interacción se acopla via atributos `data-action="..."` en el HTML.
 *
 * @module main
 */

import { activeToken, currentStudyMode } from './state.js';

// — Módulos de API y Estado
import { createDeck, updateDeck, deleteDeck, generateDeckWithAI } from './api.js';

// — Módulos de UI
import {
    loadDecks,
    loadMateriasCursandoFlashcards,
    renderDecks,
    toggleCategoryGroup,
    initColorPicker,
    initStudyModeSelector,
    startStudySession,
    populateEditDeckModal,
} from './ui/decks.js';
import {
    openCreateDeckModal,
    openEditDeckModal,
    closeCreateDeckModal,
    closeModal,
    closeModalOnOverlayClick,
    openAIDeckModal,
    closeAIDeckModal,
    closeStudyModeModal,
    showCustomConfirm,
    closeCustomConfirm,
    handleDeckSelectCategoryChange,
    handleAIDeckSelectCategoryChange,
    showAILoadingOverlay,
    hideAILoadingOverlay,
    toggleAIHelpTooltip,
    installAITooltipOutsideClickHandler,
    installEscapeKeyHandler,
} from './ui/modals.js';
import {
    confirmStudySessionStart,
    flipStudyCard,
    submitCardResult,
    selectExamOption,
    proceedToNextExamCard,
    exitStudySession,
    restartStudySession,
    exitSummaryToDecks,
    handleSpeakCardText,
} from './ui/study.js';
import {
    openManageSection,
    exitManageSection,
    handleCreateCard,
    handleDeleteCard,
    startEditCard,
    cancelEditCard,
    saveEditCard,
    handleSuggestDistractors,
    handleEditSuggestDistractors,
    triggerImportSelector,
    handleImportDeckFile,
    handleExportDeck,
} from './ui/manage.js';
import {
    enableKeyboardShortcuts,
    disableKeyboardShortcuts,
} from './utils/helpers.js';

// ==========================================================================
// FUNCIÓN GLOBAL DE TOAST (re-exportada para utils/helpers.js)
// ==========================================================================

/**
 * Expone globalmente el sistema de toasts para módulos que no pueden importarlo
 * directamente sin crear dependencias circulares.
 * @param {string} message - Mensaje a mostrar en el toast.
 * @param {'success'|'error'|'info'|'warning'} type - Tipo de toast.
 * @returns {void}
 */
export function showToastGlobal(message, type) {
    if (typeof showToast === 'function') showToast(message, type);
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Guardia de autenticación
    if (!activeToken) {
        window.location.replace('/login');
        return;
    }

    // Inicializar handlers globales de accesibilidad
    installAITooltipOutsideClickHandler();
    installEscapeKeyHandler();

    // Cargar datos iniciales en paralelo para reducir tiempo de espera
    await Promise.all([
        loadMateriasCursandoFlashcards(),
        loadDecks(),
    ]);

    // Inicializar componentes UI
    initColorPicker();
    initStudyModeSelector();

    // Registrar toda la delegación de eventos
    _registerEventDelegation();
    _registerCustomEventListeners();
});

// ==========================================================================
// DELEGACIÓN DE EVENTOS — ESTRATEGIA CENTRALIZADA
// ==========================================================================

/**
 * Registra todos los listeners de eventos del módulo usando delegación sobre
 * el `document`. Cada handler lee el atributo `data-action` del elemento más
 * cercano con ese atributo y ejecuta la acción correspondiente.
 *
 * También registra listeners especializados para formularios (submit),
 * overlays de modal (click en fondo), y elementos de input de archivo.
 * @returns {void}
 */
function _registerEventDelegation() {

    // — Click delegation global
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action  = target.dataset.action;
        const deckId  = target.dataset.deckId   ? parseInt(target.dataset.deckId, 10)  : null;
        const cardId  = target.dataset.cardId   ? parseInt(target.dataset.cardId, 10)  : null;

        switch (action) {
            // --- SECCIÓN MAZOS ---
            case 'open-create-deck-modal':
                openCreateDeckModal();
                break;
            case 'open-create-deck-for-materia':
                openCreateDeckModal();
                _preselectCategoryInModal('deck-select-category', target.dataset.materia);
                break;
            case 'open-ai-deck-modal':
                openAIDeckModal();
                break;
            case 'trigger-import-selector':
                triggerImportSelector();
                break;
            case 'toggle-category':
                toggleCategoryGroup(target.dataset.catId);
                break;
            case 'start-study':
                if (deckId) startStudySession(deckId);
                break;
            case 'open-edit-deck':
                if (deckId) {
                    e.stopPropagation();
                    populateEditDeckModal(deckId);
                    openEditDeckModal();
                }
                break;
            case 'export-deck':
                if (deckId) {
                    e.stopPropagation();
                    handleExportDeck(deckId);
                }
                break;
            case 'open-manage':
                if (deckId) openManageSection(deckId, target.dataset.deckName ?? '');
                break;
            case 'delete-deck':
                if (deckId) handleDeleteDeck(deckId);
                break;

            // --- MODAL MAZO ---
            case 'close-create-deck-modal':
                closeCreateDeckModal();
                break;

            // --- MODAL IA ---
            case 'close-ai-deck-modal':
                closeAIDeckModal();
                break;
            case 'toggle-ai-help-tooltip':
                toggleAIHelpTooltip(e);
                break;

            // --- MODAL MODO ESTUDIO ---
            case 'close-study-mode-modal':
                closeStudyModeModal();
                break;
            case 'confirm-study-start':
                confirmStudySessionStart();
                break;

            // --- MODAL CONFIRMACIÓN ---
            case 'confirm-cancel':
                closeCustomConfirm(false);
                break;
            case 'confirm-accept':
                closeCustomConfirm(true);
                break;

            // --- SECCIÓN ESTUDIO (FLIP) ---
            case 'flip-card':
                flipStudyCard();
                break;
            case 'submit-incorrect':
                submitCardResult('incorrecto');
                break;
            case 'submit-correct':
                submitCardResult('correcto');
                break;
            case 'exit-study':
                exitStudySession();
                break;
            case 'speak-card-text':
                handleSpeakCardText(e, target.dataset.targetId);
                break;

            // --- MODO EXAMEN ---
            case 'select-exam-option':
                selectExamOption(
                    target,
                    target.dataset.chosenAnswer,
                    target.dataset.correctAnswer,
                    parseInt(target.dataset.cardId, 10),
                );
                break;
            case 'proceed-next-exam':
                proceedToNextExamCard();
                break;

            // --- SECCIÓN RESUMEN ---
            case 'restart-study':
                restartStudySession();
                break;
            case 'exit-summary-to-decks':
                exitSummaryToDecks();
                break;

            // --- SECCIÓN GESTIÓN ---
            case 'exit-manage':
                exitManageSection();
                break;
            case 'start-edit-card':
                if (cardId) startEditCard(cardId);
                break;
            case 'cancel-edit-card':
                if (cardId) cancelEditCard(cardId);
                break;
            case 'save-edit-card':
                if (cardId) saveEditCard(cardId);
                break;
            case 'delete-card':
                if (cardId) handleDeleteCard(cardId);
                break;
            case 'suggest-distractors-new':
                handleSuggestDistractors();
                break;
            case 'suggest-distractors-edit':
                if (cardId) handleEditSuggestDistractors(cardId);
                break;

            default:
                break;
        }
    });

    // — Change delegation para selects
    document.addEventListener('change', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        switch (target.dataset.action) {
            case 'deck-category-change':
                handleDeckSelectCategoryChange();
                break;
            case 'ai-deck-category-change':
                handleAIDeckSelectCategoryChange();
                break;
            case 'import-deck-file':
                handleImportDeckFile(e);
                break;
        }
    });

    // — Submit delegation para formularios
    document.addEventListener('submit', (e) => {
        const form = /** @type {HTMLFormElement} */ (e.target);
        const action = form.dataset.action;
        if (!action) return;

        switch (action) {
            case 'create-deck-form':
                handleCreateOrUpdateDeck(e);
                break;
            case 'ai-deck-form':
                handleAICreateDeck(e);
                break;
            case 'add-card-form':
                handleCreateCard(e);
                break;
        }
    });

    // — Click en overlays para cerrar al hacer clic fuera del modal box
    const overlayIds = [
        'create-deck-modal',
        'ai-deck-modal',
        'study-mode-modal',
    ];
    overlayIds.forEach((id) => {
        document.getElementById(id)?.addEventListener('click', (e) => {
            closeModalOnOverlayClick(e, id);
        });
    });
}

// ==========================================================================
// CUSTOM EVENT LISTENERS (comunicación entre módulos)
// ==========================================================================

/**
 * Registra los listeners de CustomEvents emitidos por otros módulos
 * para orquestar comportamientos transversales como los atajos de teclado.
 * @returns {void}
 */
function _registerCustomEventListeners() {
    document.addEventListener('fc:enable-keyboard-shortcuts', () => {
        enableKeyboardShortcuts(flipStudyCard, submitCardResult);
    });

    document.addEventListener('fc:disable-keyboard-shortcuts', () => {
        disableKeyboardShortcuts();
    });
}

// ==========================================================================
// HANDLERS DE FORMULARIOS COMPLEJOS
// ==========================================================================

/**
 * Maneja el envío del formulario de creación o edición de un mazo.
 * Determina si es creación (POST) o edición (PUT) según el campo oculto `deck-edit-id`.
 * @param {SubmitEvent} event - El evento de envío del formulario.
 * @returns {Promise<void>}
 */
async function handleCreateOrUpdateDeck(event) {
    event.preventDefault();

    const deckId = document.getElementById('deck-edit-id')?.value;
    const nombre = document.getElementById('deck-input-name')?.value.trim();
    const descripcion = document.getElementById('deck-input-desc')?.value.trim() || null;
    const selectVal = document.getElementById('deck-select-category')?.value;
    const categoriaInput = document.getElementById('deck-input-category')?.value.trim();

    let categoria = null;
    if (selectVal === '__NEW__') {
        categoria = categoriaInput || null;
    } else if (selectVal !== 'General') {
        categoria = selectVal;
    }

    const selectedColorOpt = document.querySelector('.color-option.selected');
    const color = selectedColorOpt?.dataset.color ?? 'indigo';

    const saveBtn = document.getElementById('btn-deck-submit');
    const originalText = saveBtn?.textContent;
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = deckId ? 'Guardando...' : 'Creando...';
    }

    try {
        const payload = { nombre, descripcion, color, categoria };
        let result;

        if (deckId) {
            result = await updateDeck(parseInt(deckId, 10), payload);
        } else {
            result = await createDeck(payload);
        }

        closeCreateDeckModal();
        await loadDecks();

        // Al crear un nuevo mazo, redirigir directamente a Gestionar
        if (!deckId && result?.id) {
            openManageSection(result.id, result.nombre);
        }
    } catch (error) {
        console.error('[Flashcards] Error al procesar mazo:', error);
        showToast('No se pudo procesar el mazo. Intenta de nuevo.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
}

/**
 * Elimina un mazo previa confirmación del usuario.
 * @param {number} deckId - ID del mazo a eliminar.
 * @returns {Promise<void>}
 */
async function handleDeleteDeck(deckId) {
    const confirmed = await showCustomConfirm({
        title: '¿Eliminar mazo?',
        message: '¿Estás seguro de que quieres eliminar este mazo? Se eliminarán también todas sus tarjetas. Esta acción no se puede deshacer.',
        acceptText: 'Eliminar',
        cancelText: 'Cancelar',
        isDestructive: true,
    });
    if (!confirmed) return;

    try {
        await deleteDeck(deckId);
        await loadDecks();
        showToast('Mazo eliminado con éxito.', 'success');
    } catch (error) {
        console.error('[Flashcards] Error al eliminar mazo:', error);
        showToast('No se pudo eliminar el mazo. Intenta de nuevo.', 'error');
    }
}

/**
 * Maneja el envío del formulario de generación de mazo con IA.
 * Muestra el overlay de carga con fases simuladas para una UX premium,
 * y llama a `generateDeckWithAI` de la capa de API.
 * @param {SubmitEvent} event - El evento de envío del formulario.
 * @returns {Promise<void>}
 */
async function handleAICreateDeck(event) {
    event.preventDefault();

    const fileInput = document.getElementById('ai-deck-file');
    if (!fileInput?.files.length) {
        showToast('Por favor, selecciona un archivo.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const countInput = document.getElementById('ai-deck-cards-count');
    if (countInput) formData.append('cantidad', countInput.value);

    const selectVal    = document.getElementById('ai-deck-select-category')?.value;
    const newCatInput  = document.getElementById('ai-deck-input-category')?.value.trim();
    const category     = selectVal === '__NEW__' ? (newCatInput || '__AUTO__') : (selectVal || '__AUTO__');
    formData.append('categoria', category);

    closeAIDeckModal();

    // Fases de carga simuladas para dar feedback visual progresivo
    const phases = [
        { t: 0,     title: 'Subiendo archivo...',       text: 'Tu documento se está cargando en el servidor local.' },
        { t: 1500,  title: 'Procesando archivo...',     text: 'Analizando el documento o imagen subida.' },
        { t: 4000,  title: 'Analizando contenido...',   text: 'La IA de Cursus está leyendo y estructurando los conceptos principales.' },
        { t: 8500,  title: 'Diseñando flashcards...',   text: 'Redactando las mejores preguntas y respuestas académicas para ti.' },
        { t: 13000, title: 'Finalizando creación...', text: 'Guardando el mazo en la base de datos de tu panel.' },
    ];

    showAILoadingOverlay(phases[0].title, phases[0].text);
    const timers = phases.slice(1).map(({ t, title, text }) =>
        setTimeout(() => showAILoadingOverlay(title, text), t),
    );

    try {
        const createdDeck = await generateDeckWithAI(formData);
        timers.forEach((t) => clearTimeout(t));

        showToast('¡Mazo generado con IA con éxito! ✨', 'success');
        await loadDecks();
        hideAILoadingOverlay();

        // Abrir el modal de modo de estudio para el mazo recién creado
        startStudySession(createdDeck.id);
    } catch (error) {
        timers.forEach((t) => clearTimeout(t));
        hideAILoadingOverlay();
        showToast(error.message || 'No se pudo generar el mazo.', 'error');
        openAIDeckModal();
    }
}

// ==========================================================================
// HELPERS INTERNOS
// ==========================================================================

/**
 * Pre-selecciona una categoría en un `<select>` del modal si la opción existe.
 * @param {string} selectId   - ID del elemento `<select>`.
 * @param {string} value      - Valor de la opción a seleccionar.
 * @returns {void}
 */
function _preselectCategoryInModal(selectId, value) {
    if (!value) return;
    const select = document.getElementById(selectId);
    if (!select) return;
    const hasOption = select.querySelector(`option[value="${CSS.escape(value)}"]`);
    if (hasOption) {
        select.value = value;
        handleDeckSelectCategoryChange();
    }
}
