/**
 * @fileoverview Módulo de gestión de tarjetas dentro de un mazo (sección Manage).
 *
 * Responsable de:
 *   - Abrir y cerrar la sección de gestión de tarjetas.
 *   - Cargar y renderizar la lista de tarjetas del mazo activo.
 *   - Manejar la creación, edición inline y eliminación de tarjetas.
 *   - Integrar la sugerencia de distractores por IA.
 *   - Gestionar la importación/exportación de mazos en formato JSON.
 *
 * @module ui/manage
 */

import {
    manageDeckId,
    setManageDeckId,
    editingCardId,
    setEditingCardId,
    currentDecks,
} from '../state.js';
import {
    fetchDeckCards,
    createCard,
    updateCard,
    deleteCard,
    importDeck,
    generateDistractors,
} from '../api.js';
import { escapeHtml, renderKatexInElement } from '../utils/helpers.js';
import { showCustomConfirm } from './modals.js';
import { loadDecks } from './decks.js';

// Referencias cacheadas a las secciones del DOM
const sectionDecks  = document.getElementById('section-decks');
const sectionManage = document.getElementById('section-manage');

// ==========================================================================
// NAVEGACIÓN A LA SECCIÓN DE GESTIÓN
// ==========================================================================

/**
 * Abre la sección de gestión de tarjetas para el mazo especificado.
 * Actualiza el título del encabezado y carga la lista de tarjetas.
 * @param {number} deckId   - ID del mazo a gestionar.
 * @param {string} deckName - Nombre del mazo (para mostrar en el encabezado).
 * @returns {Promise<void>}
 */
export async function openManageSection(deckId, deckName) {
    setManageDeckId(deckId);
    const titleEl = document.getElementById('manage-deck-name');
    if (titleEl) titleEl.textContent = `Gestionar Mazo: ${deckName}`;

    sectionDecks?.setAttribute('hidden', '');
    sectionManage?.removeAttribute('hidden');

    await loadManageCards();
}

/**
 * Cierra la sección de gestión y retorna a la vista de mazos, recargando la lista.
 * @returns {Promise<void>}
 */
export async function exitManageSection() {
    sectionManage?.setAttribute('hidden', '');
    sectionDecks?.removeAttribute('hidden');
    await loadDecks();
}

// ==========================================================================
// CARGA Y RENDERIZADO DE TARJETAS
// ==========================================================================

/**
 * Carga las tarjetas del mazo activo desde la API y renderiza la lista.
 * Muestra un indicador de carga mientras espera y un mensaje de error si falla.
 * @returns {Promise<void>}
 */
export async function loadManageCards() {
    const container = document.getElementById('manage-cards-list');
    if (!container) return;

    container.innerHTML = `
        <div class="manage-loader" role="status" aria-live="polite">
            Cargando tarjetas del mazo...
        </div>
    `;

    try {
        const cards = await fetchDeckCards(manageDeckId);
        const countEl = document.getElementById('manage-cards-count');
        if (countEl) countEl.textContent = String(cards.length);
        renderManageCards(cards);
    } catch (error) {
        console.error('[Flashcards] Error al cargar tarjetas de gestión:', error);
        container.innerHTML = `
            <div class="manage-error" role="alert">
                Error al cargar las tarjetas. Intenta recargar la página.
            </div>
        `;
    }
}

/**
 * Renderiza la lista de tarjetas del mazo en el contenedor de gestión.
 * Aplica KaTeX al renderizar el contenido matemático.
 * @param {import('../state.js').Card[]} cards - Lista de tarjetas a renderizar.
 * @returns {void}
 */
function renderManageCards(cards) {
    const container = document.getElementById('manage-cards-list');
    if (!container) return;

    if (cards.length === 0) {
        container.innerHTML = `
            <div class="empty-state empty-state--manage" role="status">
                Este mazo no tiene tarjetas añadidas aún. ¡Crea una en el formulario de la izquierda!
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();
    cards.forEach((card) => {
        fragment.appendChild(_buildCardListItem(card));
    });

    container.innerHTML = '';
    container.appendChild(fragment);

    // Renderizar KaTeX en toda la lista de una sola pasada
    renderKatexInElement(container);
}

/**
 * Construye el elemento DOM de un ítem de tarjeta en la lista de gestión.
 * Incluye la vista de lectura (Q/A + estadísticas) y el formulario de edición inline.
 * @param {import('../state.js').Card} card - Datos de la tarjeta.
 * @returns {HTMLElement} Elemento `<article class="card-list-item">` completo.
 */
function _buildCardListItem(card) {
    const totalAttempts = (card.correctas || 0) + (card.incorrectas || 0);
    const accuracy = totalAttempts > 0
        ? Math.round(((card.correctas || 0) / totalAttempts) * 100)
        : null;

    let accuracyClass = 'card-stat--none';
    let statsText = 'Sin repasos aún';
    if (accuracy !== null) {
        if (accuracy >= 75)     accuracyClass = 'card-stat--high';
        else if (accuracy >= 50) accuracyClass = 'card-stat--medium';
        else                     accuracyClass = 'card-stat--low';
        statsText = `Acierto: ${accuracy}% (🟢 ${card.correctas} | 🔴 ${card.incorrectas}) • Caja: ${card.caja || 1}`;
    }

    const article = document.createElement('article');
    article.className = 'card-list-item';
    article.id = `card-item-${card.id}`;

    // Vista de lectura
    const displayDiv = document.createElement('div');
    displayDiv.className = 'card-item__display';
    displayDiv.id = `card-display-${card.id}`;
    displayDiv.innerHTML = `
        <div class="card-item__qa">
            <div class="card-item__content">
                <div class="qa-block">
                    <div class="qa-block__label">Pregunta (Frente)</div>
                    <div class="qa-block__content">${escapeHtml(card.pregunta)}</div>
                </div>
                <div class="qa-block">
                    <div class="qa-block__label">Respuesta (Reverso)</div>
                    <div class="qa-block__content">${escapeHtml(card.respuesta)}</div>
                </div>
                <div class="card-item__stats">
                    <span class="card-stat ${accuracyClass}">${statsText}</span>
                </div>
            </div>
            <div class="card-item__actions" role="group" aria-label="Acciones de la tarjeta">
                <button class="btn-deck-icon"
                    data-action="start-edit-card"
                    data-card-id="${card.id}"
                    title="Editar tarjeta"
                    aria-label="Editar tarjeta">
                    <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/sprite.svg#pen"></use></svg>
                </button>
                <button class="btn-deck-icon btn-deck-icon--delete"
                    data-action="delete-card"
                    data-card-id="${card.id}"
                    title="Eliminar tarjeta"
                    aria-label="Eliminar tarjeta">
                    <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/sprite.svg#trash-2"></use></svg>
                </button>
            </div>
        </div>
    `;

    // Formulario de edición inline
    const editFormDiv = document.createElement('div');
    editFormDiv.className = 'card-edit-form';
    editFormDiv.id = `card-edit-form-${card.id}`;
    editFormDiv.setAttribute('hidden', '');
    editFormDiv.setAttribute('aria-label', 'Formulario de edición de tarjeta');
    editFormDiv.innerHTML = `
        <div class="form-group form-group--compact">
            <label for="edit-textarea-q-${card.id}" class="form-group__label">Pregunta (Frente)</label>
            <textarea
                id="edit-textarea-q-${card.id}"
                class="fc-input fc-input--textarea-compact"
                aria-required="true"
            >${escapeHtml(card.pregunta)}</textarea>
        </div>
        <div class="form-group form-group--compact">
            <label for="edit-textarea-a-${card.id}" class="form-group__label">Respuesta (Reverso)</label>
            <textarea
                id="edit-textarea-a-${card.id}"
                class="fc-input fc-input--textarea-compact"
                aria-required="true"
            >${escapeHtml(card.respuesta)}</textarea>
        </div>
        <div class="card-edit-form__distractors">
            <div class="distractors-header-row">
                <span class="distractors-header-row__label">Opciones incorrectas (Opcional)</span>
                <button type="button"
                    id="btn-edit-suggest-${card.id}"
                    class="btn-suggest-ai"
                    data-action="suggest-distractors-edit"
                    data-card-id="${card.id}"
                    aria-label="Sugerir opciones incorrectas con IA para esta tarjeta">
                    <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/sprite.svg#astroid"></use></svg>
                    <span>Sugerir con IA</span>
                </button>
            </div>
            <input type="text" id="edit-input-d1-${card.id}" class="fc-input fc-input--distractor"
                placeholder="Opción incorrecta 1"
                value="${escapeHtml(card.distractor_1 || '')}"
                aria-label="Opción incorrecta 1">
            <input type="text" id="edit-input-d2-${card.id}" class="fc-input fc-input--distractor"
                placeholder="Opción incorrecta 2"
                value="${escapeHtml(card.distractor_2 || '')}"
                aria-label="Opción incorrecta 2">
            <input type="text" id="edit-input-d3-${card.id}" class="fc-input fc-input--distractor"
                placeholder="Opción incorrecta 3"
                value="${escapeHtml(card.distractor_3 || '')}"
                aria-label="Opción incorrecta 3">
        </div>
        <div class="card-edit-form__actions">
            <button class="btn-card-cancel"
                data-action="cancel-edit-card"
                data-card-id="${card.id}">Cancelar</button>
            <button class="btn-card-save"
                data-action="save-edit-card"
                data-card-id="${card.id}">Guardar</button>
        </div>
    `;

    article.appendChild(displayDiv);
    article.appendChild(editFormDiv);
    return article;
}

// ==========================================================================
// EDICIÓN INLINE DE TARJETAS
// ==========================================================================

/**
 * Activa el formulario de edición inline de una tarjeta, ocultando la vista
 * de lectura. Si ya hay otra tarjeta en edición, la cancela primero.
 * @param {number} cardId - ID de la tarjeta a editar.
 * @returns {void}
 */
export function startEditCard(cardId) {
    if (editingCardId !== null) cancelEditCard(editingCardId);
    setEditingCardId(cardId);
    document.getElementById(`card-display-${cardId}`)?.setAttribute('hidden', '');
    document.getElementById(`card-edit-form-${cardId}`)?.removeAttribute('hidden');
    document.getElementById(`edit-textarea-q-${cardId}`)?.focus();
}

/**
 * Cancela la edición inline de una tarjeta y restaura la vista de lectura.
 * @param {number} cardId - ID de la tarjeta cuya edición se cancela.
 * @returns {void}
 */
export function cancelEditCard(cardId) {
    setEditingCardId(null);
    document.getElementById(`card-display-${cardId}`)?.removeAttribute('hidden');
    document.getElementById(`card-edit-form-${cardId}`)?.setAttribute('hidden', '');
}

/**
 * Guarda los cambios del formulario de edición inline y recarga la lista.
 * Valida que pregunta y respuesta no estén vacíos.
 * @param {number} cardId - ID de la tarjeta a actualizar.
 * @returns {Promise<void>}
 */
export async function saveEditCard(cardId) {
    const pregunta = document.getElementById(`edit-textarea-q-${cardId}`)?.value.trim();
    const respuesta = document.getElementById(`edit-textarea-a-${cardId}`)?.value.trim();
    const dist1 = document.getElementById(`edit-input-d1-${cardId}`)?.value.trim() || null;
    const dist2 = document.getElementById(`edit-input-d2-${cardId}`)?.value.trim() || null;
    const dist3 = document.getElementById(`edit-input-d3-${cardId}`)?.value.trim() || null;

    if (!pregunta || !respuesta) {
        showToast('Ambos campos (pregunta y respuesta) son requeridos.', 'error');
        return;
    }

    try {
        await updateCard(cardId, { pregunta, respuesta, distractor_1: dist1, distractor_2: dist2, distractor_3: dist3 });
        setEditingCardId(null);
        await loadManageCards();
        showToast('Tarjeta guardada con éxito.', 'success');
    } catch (error) {
        console.error('[Flashcards] Error al guardar tarjeta:', error);
        showToast('No se pudo guardar la tarjeta. Intenta de nuevo.', 'error');
    }
}

/**
 * Solicita confirmación y elimina permanentemente una tarjeta si el usuario acepta.
 * @param {number} cardId - ID de la tarjeta a eliminar.
 * @returns {Promise<void>}
 */
export async function handleDeleteCard(cardId) {
    const confirmed = await showCustomConfirm({
        title: '¿Eliminar tarjeta?',
        message: '¿Estás seguro de que quieres eliminar esta tarjeta? Esta acción no se puede deshacer.',
        acceptText: 'Eliminar',
        cancelText: 'Cancelar',
        isDestructive: true,
    });
    if (!confirmed) return;

    try {
        await deleteCard(cardId);
        await loadManageCards();
        showToast('Tarjeta eliminada con éxito.', 'success');
    } catch (error) {
        console.error('[Flashcards] Error al eliminar tarjeta:', error);
        showToast('No se pudo eliminar la tarjeta. Intenta de nuevo.', 'error');
    }
}

// ==========================================================================
// CREACIÓN DE TARJETA (FORMULARIO PRINCIPAL)
// ==========================================================================

/**
 * Maneja el envío del formulario de creación de nueva tarjeta.
 * Valida los campos, llama a la API y recarga la lista al finalizar.
 * @param {SubmitEvent} event - El evento de envío del formulario.
 * @returns {Promise<void>}
 */
export async function handleCreateCard(event) {
    event.preventDefault();
    const form = /** @type {HTMLFormElement} */ (event.target);

    const preguntaInput  = document.getElementById('card-input-question');
    const respuestaInput = document.getElementById('card-input-answer');
    const d1Input = document.getElementById('card-input-d1');
    const d2Input = document.getElementById('card-input-d2');
    const d3Input = document.getElementById('card-input-d3');
    const submitBtn = form.querySelector('.btn-add-card');

    if (!preguntaInput || !respuestaInput || !submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
        await createCard(manageDeckId, {
            pregunta:     preguntaInput.value.trim(),
            respuesta:    respuestaInput.value.trim(),
            distractor_1: d1Input?.value.trim() || null,
            distractor_2: d2Input?.value.trim() || null,
            distractor_3: d3Input?.value.trim() || null,
        });

        // Limpiar el formulario
        preguntaInput.value = '';
        respuestaInput.value = '';
        if (d1Input) d1Input.value = '';
        if (d2Input) d2Input.value = '';
        if (d3Input) d3Input.value = '';
        preguntaInput.focus();

        await loadManageCards();
        showToast('Tarjeta añadida con éxito.', 'success');
    } catch (error) {
        console.error('[Flashcards] Error al crear tarjeta:', error);
        showToast('No se pudo guardar la tarjeta. Intenta de nuevo.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Tarjeta';
    }
}

// ==========================================================================
// SUGERENCIA DE DISTRACTORES CON IA
// ==========================================================================

/**
 * Sugiere distractores con IA para el formulario de CREACIÓN de nueva tarjeta.
 * Lee los campos de pregunta y respuesta del formulario principal.
 * @returns {Promise<void>}
 */
export async function handleSuggestDistractors() {
    const qVal = document.getElementById('card-input-question')?.value.trim();
    const aVal = document.getElementById('card-input-answer')?.value.trim();

    if (!qVal || !aVal) {
        showToast('Por favor, escribe la Pregunta y la Respuesta primero.', 'error');
        return;
    }

    await _runDistractorSuggestion({
        btnId:    'btn-suggest-distractors',
        d1Id:     'card-input-d1',
        d2Id:     'card-input-d2',
        d3Id:     'card-input-d3',
        pregunta: qVal,
        respuesta: aVal,
    });
}

/**
 * Sugiere distractores con IA para el formulario de EDICIÓN de una tarjeta existente.
 * @param {number} cardId - ID de la tarjeta que se está editando.
 * @returns {Promise<void>}
 */
export async function handleEditSuggestDistractors(cardId) {
    const qVal = document.getElementById(`edit-textarea-q-${cardId}`)?.value.trim();
    const aVal = document.getElementById(`edit-textarea-a-${cardId}`)?.value.trim();

    if (!qVal || !aVal) {
        showToast('Por favor, escribe la Pregunta y la Respuesta primero.', 'error');
        return;
    }

    await _runDistractorSuggestion({
        btnId:    `btn-edit-suggest-${cardId}`,
        d1Id:     `edit-input-d1-${cardId}`,
        d2Id:     `edit-input-d2-${cardId}`,
        d3Id:     `edit-input-d3-${cardId}`,
        pregunta: qVal,
        respuesta: aVal,
    });
}

/**
 * Función privada reutilizable que ejecuta la petición de generación de distractores
 * con IA y rellena los campos de entrada indicados.
 * @param {Object} opts          - Opciones de la operación.
 * @param {string} opts.btnId    - ID del botón que lanzó la acción (para mostrar estado de carga).
 * @param {string} opts.d1Id     - ID del input del distractor 1.
 * @param {string} opts.d2Id     - ID del input del distractor 2.
 * @param {string} opts.d3Id     - ID del input del distractor 3.
 * @param {string} opts.pregunta - Texto de la pregunta.
 * @param {string} opts.respuesta - Texto de la respuesta correcta.
 * @returns {Promise<void>}
 */
async function _runDistractorSuggestion({ btnId, d1Id, d2Id, d3Id, pregunta, respuesta }) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>Generando... ⏳</span>';

    try {
        const currentDeck = currentDecks.find((d) => d.id === manageDeckId);
        const category    = currentDeck?.categoria ?? 'General';

        const data = await generateDistractors(pregunta, respuesta, category);

        if (document.getElementById(d1Id)) document.getElementById(d1Id).value = data.distractor_1 || '';
        if (document.getElementById(d2Id)) document.getElementById(d2Id).value = data.distractor_2 || '';
        if (document.getElementById(d3Id)) document.getElementById(d3Id).value = data.distractor_3 || '';

        showToast('¡Opciones incorrectas sugeridas con éxito! ✨', 'success');
    } catch (error) {
        console.error('[Flashcards] Error al generar distractores:', error);
        showToast('No se pudieron generar las opciones con IA. Inténtalo de nuevo.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

// ==========================================================================
// IMPORTACIÓN / EXPORTACIÓN JSON
// ==========================================================================

/**
 * Dispara el clic programático sobre el input de archivo oculto para iniciar
 * el flujo de importación de un mazo JSON.
 * @returns {void}
 */
export function triggerImportSelector() {
    document.getElementById('import-deck-file-input')?.click();
}

/**
 * Maneja la selección de un archivo JSON para importar como nuevo mazo.
 * Valida el formato del JSON antes de enviarlo a la API.
 * @param {Event} event - El evento `change` del input de archivo.
 * @returns {void}
 */
export function handleImportDeckFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.nombre || !data.cards || !Array.isArray(data.cards)) {
                showToast('El archivo JSON no tiene el formato de mazo compatible con Cursus.', 'error');
                return;
            }
            await importDeck(data);
            showToast('Mazo importado con éxito. ✨', 'success');
            loadDecks();
        } catch (err) {
            console.error('[Flashcards] Error al importar mazo:', err);
            showToast('No se pudo leer o importar el archivo JSON. Verifica su estructura.', 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

/**
 * Exporta las tarjetas de un mazo como un archivo JSON descargable.
 * Genera el archivo en el cliente usando Blob y URL.createObjectURL.
 * @param {number} deckId - ID del mazo a exportar.
 * @returns {Promise<void>}
 */
export async function handleExportDeck(deckId) {
    const deck = currentDecks.find((d) => d.id === deckId);
    if (!deck) return;

    try {
        const cards = await fetchDeckCards(deckId);
        const exportData = {
            nombre:      deck.nombre,
            descripcion: deck.descripcion,
            color:       deck.color,
            categoria:   deck.categoria,
            cards: cards.map((c) => ({
                pregunta:     c.pregunta,
                respuesta:    c.respuesta,
                distractor_1: c.distractor_1,
                distractor_2: c.distractor_2,
                distractor_3: c.distractor_3,
            })),
        };

        const blob     = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url      = URL.createObjectURL(blob);
        const anchor   = document.createElement('a');
        anchor.href     = url;
        anchor.download = `mazo-${deck.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        showToast('Mazo exportado con éxito. ✨', 'success');
    } catch (err) {
        console.error('[Flashcards] Error al exportar mazo:', err);
        showToast('Error al exportar el mazo.', 'error');
    }
}
