/**
 * @fileoverview Módulo de renderizado de la vista de Mazos (Decks) del módulo Flashcards.
 *
 * Responsable de:
 *   - Renderizar la grilla de categorías colapsables y las tarjetas de mazo.
 *   - Gestionar la animación de acordeón de categorías (puramente via CSS Grid).
 *   - Implementar el efecto de cursor "glow" sobre las tarjetas.
 *   - Poblar los selectores de categoría en los modales.
 *   - Inicializar el selector de color del modal de mazo.
 *   - Gestionar el modo de estudio selector (UI).
 *
 * NO realiza llamadas a la API directamente; delega a `api.js`.
 * NO posee estado propio; lee y muta el estado de `state.js`.
 *
 * @module ui/decks
 */

import {
    currentDecks,
    materiasCursandoFlashcards,
    setCurrentDecks,
    setMateriasCursandoFlashcards,
    setSelectedDeckIdForStudy,
    setCurrentStudyMode,
} from '../state.js';
import { fetchDecks, fetchMateriasCursando } from '../api.js';
import { escapeHtml, getAccuracyClass, getAccuracyText } from '../utils/helpers.js';
import { openCreateDeckModal, openStudyModeModal, handleDeckSelectCategoryChange } from './modals.js';

// ==========================================================================
// CARGA DE DATOS
// ==========================================================================

/**
 * Carga las materias en curso del alumno desde la API y actualiza el estado global.
 * Si falla, deja el estado vacío silenciosamente para no bloquear la vista.
 * @returns {Promise<void>}
 */
export async function loadMateriasCursandoFlashcards() {
    try {
        const materias = await fetchMateriasCursando();
        setMateriasCursandoFlashcards(materias);
    } catch {
        setMateriasCursandoFlashcards([]);
    }
}

/**
 * Carga todos los mazos del usuario desde la API, actualiza el estado y
 * renderiza la vista de mazos. Muestra un mensaje de error si la carga falla.
 * @returns {Promise<void>}
 */
export async function loadDecks() {
    const container = document.getElementById('decks-container');
    try {
        const decks = await fetchDecks();
        setCurrentDecks(decks);
        renderDecks(decks);
    } catch (error) {
        console.error('[Flashcards] Error al cargar mazos:', error);
        container.innerHTML = `
            <div class="empty-state empty-state--error" role="alert">
                <p class="empty-state__desc">⚠️ Ocurrió un error al cargar tus mazos. Intenta recargar la página.</p>
            </div>
        `;
    }
}

// ==========================================================================
// RENDERIZADO DE LA GRILLA DE MAZOS
// ==========================================================================

/**
 * Construye y renderiza en el DOM la grilla completa de mazos agrupados por categoría.
 * También puebla los selectores de categoría de los modales de mazo e IA.
 * @param {import('../state.js').Deck[]} decks - Array de mazos a renderizar.
 * @returns {void}
 */
export function renderDecks(decks) {
    const container = document.getElementById('decks-container');

    if (decks.length === 0 && materiasCursandoFlashcards.length === 0) {
        container.innerHTML = `
            <div class="empty-state" role="status">
                <svg class="empty-state__icon" width="48" height="48" aria-hidden="true">
                    <use href="/assets/icons/sprite.svg#cards"></use>
                </svg>
                <h3 class="empty-state__title">No tienes mazos aún</h3>
                <p class="empty-state__desc">Crea tu primer mazo para agregar tarjetas de estudio y comenzar a repasar.</p>
                <button class="btn-create-deck" data-action="open-create-deck-modal">
                    <svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/sprite.svg#plus"></use></svg>
                    Crear Primer Mazo
                </button>
            </div>
        `;
        return;
    }

    // Agrupar mazos por categoría
    const groups = {};
    decks.forEach((deck) => {
        const cat = deck.categoria ? deck.categoria.trim() : 'General';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(deck);
    });

    // Poblar selectores de categoría en ambos modales
    _populateCategorySelectors(groups);

    // Renderizar grupos ordenados (General primero, luego alfabético)
    const sortedCats = Object.keys(groups).sort((a, b) => {
        if (a === 'General') return -1;
        if (b === 'General') return 1;
        return a.localeCompare(b);
    });

    const fragment = document.createDocumentFragment();
    sortedCats.forEach((cat) => {
        const group = _buildCategoryGroupElement(cat, groups[cat], groups);
        fragment.appendChild(group);
    });

    container.innerHTML = '';
    container.appendChild(fragment);

    // Inicializar efecto glow de cursor sobre cada tarjeta de mazo
    _initDeckCardGlowEffect(container);
}

/**
 * Construye el elemento DOM del grupo colapsable de una categoría.
 * @param {string} cat            - Nombre de la categoría.
 * @param {import('../state.js').Deck[]} catDecks - Mazos de esta categoría.
 * @param {Object} allGroups      - Todos los grupos (para lógica de acordeón).
 * @returns {HTMLElement} El elemento `<div class="category-group">` completo.
 */
function _buildCategoryGroupElement(cat, catDecks, allGroups) {
    const catId = 'cat-' + cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const isCollapsed = localStorage.getItem('collapsed_cat_' + catId) === 'true';

    const group = document.createElement('div');
    group.className = `category-group${isCollapsed ? ' category-group--collapsed' : ''}`;
    group.id = 'group-' + catId;

    // Header del acordeón (carpeta de archivo)
    const header = document.createElement('div');
    header.className = 'category-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', String(!isCollapsed));
    header.setAttribute('aria-controls', 'grid-' + catId);
    header.dataset.action = 'toggle-category';
    header.dataset.catId = catId;
    header.innerHTML = `
        <div class="category-header__info">
            <svg width="18" height="18" class="category-header__icon" aria-hidden="true">
                <use href="/assets/icons/sprite.svg#folder"></use>
            </svg>
            <span class="category-header__name">${escapeHtml(cat)}</span>
            <span class="category-header__count" aria-label="${catDecks.length} mazos">${catDecks.length}</span>
        </div>
        <svg class="category-chevron${isCollapsed ? ' category-chevron--collapsed' : ''}" width="16" height="16" aria-hidden="true">
            <use href="/assets/icons/sprite.svg#chevron-down"></use>
        </svg>
    `;

    // Wrapper del acordeón: category-body (grid) > category-body__inner (min-height:0)
    // Esta estructura es NECESARIA para que grid-template-rows: 0fr funcione correctamente.
    // El truco falla si el elemento al que se aplica grid-template-rows ES el contenido:
    // debe aplicarse al PADRE, y el HIJO directo debe tener min-height:0.
    const body = document.createElement('div');
    body.className = 'category-body';

    const inner = document.createElement('div');
    inner.className = 'category-body__inner';

    // Grilla de tarjetas (panel colapsable)
    const grid = document.createElement('div');
    grid.className = 'decks-grid';
    grid.id = 'grid-' + catId;
    grid.setAttribute('role', 'region');
    grid.setAttribute('aria-labelledby', 'header-' + catId);

    if (catDecks.length === 0) {
        grid.innerHTML = `
            <div class="empty-state empty-state--inline">
                <p class="empty-state__desc">Todavía no tienes mazos para esta materia.</p>
                <button class="btn-create-deck btn-create-deck--small"
                    data-action="open-create-deck-for-materia"
                    data-materia="${escapeHtml(cat)}">
                    <svg width="16" height="16" aria-hidden="true"><use href="/assets/icons/sprite.svg#plus"></use></svg>
                    Crear Mazo
                </button>
            </div>
        `;
    } else {
        catDecks.forEach((deck) => {
            grid.appendChild(_buildDeckCardElement(deck));
        });
    }

    inner.appendChild(grid);
    body.appendChild(inner);
    group.appendChild(header);
    group.appendChild(body);
    return group;
}

/**
 * Construye el elemento DOM de una tarjeta de mazo individual.
 * @param {import('../state.js').Deck} deck - Datos del mazo.
 * @returns {HTMLElement} El elemento `<article class="deck-card">` completo.
 */
function _buildDeckCardElement(deck) {
    const hasCards = deck.cards_count > 0;
    const accuracy = deck.porcentaje_acierto;
    const accuracyClass = getAccuracyClass(accuracy);
    const accuracyText = getAccuracyText(accuracy);

    const article = document.createElement('article');
    article.className = 'deck-card';
    article.id = `deck-card-${deck.id}`;
    article.setAttribute('aria-label', `Mazo: ${deck.nombre}`);

    article.innerHTML = `
        <div class="deck-card__glow deck-color-${deck.color || 'indigo'}" aria-hidden="true"></div>
        <div class="deck-card__info">
            <h3 class="deck-card__title">${escapeHtml(deck.nombre)}</h3>
            <p class="deck-card__desc">${deck.descripcion ? escapeHtml(deck.descripcion) : 'Sin descripción.'}</p>
            <div class="deck-card__stats" role="group" aria-label="Estadísticas del mazo">
                <div class="deck-stat-item" title="Cantidad de tarjetas">
                    <svg class="deck-stat-item__icon" aria-hidden="true">
                        <use href="/assets/icons/sprite.svg#cards"></use>
                    </svg>
                    <span>${deck.cards_count} ${deck.cards_count === 1 ? 'tarjeta' : 'tarjetas'}</span>
                </div>
                <span class="accuracy-badge ${accuracyClass}" aria-label="Porcentaje de acierto: ${accuracyText}">
                    ${escapeHtml(accuracyText)}
                </span>
            </div>
        </div>
        <div class="deck-card__actions" role="group" aria-label="Acciones del mazo ${escapeHtml(deck.nombre)}">
            <button class="btn-study"
                data-action="start-study"
                data-deck-id="${deck.id}"
                ${!hasCards ? 'disabled aria-disabled="true"' : ''}
                title="${hasCards ? 'Comenzar a estudiar' : 'Agrega tarjetas primero para estudiar'}">
                <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/sprite.svg#play"></use></svg>
                <span>Estudiar</span>
            </button>
            <button class="btn-deck-icon"
                data-action="open-edit-deck"
                data-deck-id="${deck.id}"
                title="Editar mazo"
                aria-label="Editar mazo ${escapeHtml(deck.nombre)}">
                <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/sprite.svg#pen"></use></svg>
            </button>
            <button class="btn-deck-icon"
                data-action="export-deck"
                data-deck-id="${deck.id}"
                title="Exportar mazo (JSON)"
                aria-label="Exportar mazo ${escapeHtml(deck.nombre)} como JSON">
                <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/sprite.svg#file-braces-corner"></use></svg>
            </button>
            <button class="btn-deck-icon"
                data-action="open-manage"
                data-deck-id="${deck.id}"
                data-deck-name="${escapeHtml(deck.nombre)}"
                title="Gestionar tarjetas"
                aria-label="Gestionar tarjetas del mazo ${escapeHtml(deck.nombre)}">
                <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/sprite.svg#cards"></use></svg>
            </button>
            <button class="btn-deck-icon btn-deck-icon--delete"
                data-action="delete-deck"
                data-deck-id="${deck.id}"
                title="Eliminar mazo"
                aria-label="Eliminar mazo ${escapeHtml(deck.nombre)}">
                <svg width="14" height="14" aria-hidden="true"><use href="/assets/icons/sprite.svg#trash-2"></use></svg>
            </button>
        </div>
    `;
    return article;
}

// ==========================================================================
// ACORDEÓN DE CATEGORÍAS (CSS Grid nativo — sin bloqueo del hilo)
// ==========================================================================

/**
 * Alterna el estado colapsado/expandido de un grupo de categoría.
 * La animación se realiza íntegramente en CSS mediante `grid-template-rows`.
 * El estado se persiste en `localStorage` para mantenerlo entre sesiones.
 * @param {string} catId - ID de la categoría (ej. 'cat-general').
 * @returns {void}
 */
export function toggleCategoryGroup(catId) {
    const group = document.getElementById('group-' + catId);
    const header = group?.querySelector('.category-header');
    const chevron = group?.querySelector('.category-chevron');
    if (!group || !header) return;

    const isCollapsed = group.classList.contains('category-group--collapsed');

    if (isCollapsed) {
        group.classList.remove('category-group--collapsed');
        chevron?.classList.remove('category-chevron--collapsed');
        header.setAttribute('aria-expanded', 'true');
        localStorage.setItem('collapsed_cat_' + catId, 'false');
    } else {
        group.classList.add('category-group--collapsed');
        chevron?.classList.add('category-chevron--collapsed');
        header.setAttribute('aria-expanded', 'false');
        localStorage.setItem('collapsed_cat_' + catId, 'true');
    }
}

// ==========================================================================
// EFECTO GLOW DE CURSOR
// ==========================================================================

/**
 * Adjunta listeners de `mousemove` a cada `.deck-card` dentro del contenedor
 * para actualizar las CSS Custom Properties `--mouse-x` y `--mouse-y` en tiempo real.
 * El efecto visual de gradiente radial que las consume vive en CSS.
 * @param {HTMLElement} container - Contenedor padre de las tarjetas.
 * @returns {void}
 */
function _initDeckCardGlowEffect(container) {
    container.querySelectorAll('.deck-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });
}

// ==========================================================================
// SELECTORES DE CATEGORÍA EN MODALES
// ==========================================================================

/**
 * Puebla los selectores `<select>` de categoría en los modales de mazo e IA
 * con las categorías existentes y las materias en curso del alumno.
 * @param {Object} groups - Mapa de categorías a arrays de mazos.
 * @returns {void}
 */
function _populateCategorySelectors(groups) {
    const materiaNombres = materiasCursandoFlashcards.map((m) => m.nombre);

    let materiasOptionsHtml = '';
    if (materiaNombres.length > 0) {
        materiasOptionsHtml += '<optgroup label="Mis materias en curso">';
        materiaNombres.forEach((nombre) => {
            materiasOptionsHtml += `<option value="${escapeHtml(nombre)}">${escapeHtml(nombre)}</option>`;
        });
        materiasOptionsHtml += '</optgroup>';
    }

    const distinctCategories = Object.keys(groups).filter(
        (cat) => cat !== 'General' && !materiaNombres.includes(cat),
    );

    // Modal de mazo manual
    const selectCategory = document.getElementById('deck-select-category');
    if (selectCategory) {
        const currentValue = selectCategory.value;
        let html = `<option value="General">General (Sin contenedor)</option>${materiasOptionsHtml}`;
        if (distinctCategories.length > 0) {
            html += '<optgroup label="Otros contenedores">';
            distinctCategories.forEach((cat) => {
                html += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
            });
            html += '</optgroup>';
        }
        html += `<option value="__NEW__">+ Crear nuevo contenedor...</option>`;
        selectCategory.innerHTML = html;
        if (currentValue && selectCategory.querySelector(`option[value="${CSS.escape(currentValue)}"]`)) {
            selectCategory.value = currentValue;
        }
    }

    // Modal de IA
    const aiSelectCategory = document.getElementById('ai-deck-select-category');
    if (aiSelectCategory) {
        const currentValue = aiSelectCategory.value;
        let html = `
            <option value="__AUTO__">Auto-detectar con IA ✨</option>
            <option value="General">General (Sin contenedor)</option>
            ${materiasOptionsHtml}
        `;
        if (distinctCategories.length > 0) {
            html += '<optgroup label="Otros contenedores">';
            distinctCategories.forEach((cat) => {
                html += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
            });
            html += '</optgroup>';
        }
        html += `<option value="__NEW__">+ Crear nuevo contenedor...</option>`;
        aiSelectCategory.innerHTML = html;
        if (currentValue && aiSelectCategory.querySelector(`option[value="${CSS.escape(currentValue)}"]`)) {
            aiSelectCategory.value = currentValue;
        }
    }
}

// ==========================================================================
// SELECTOR DE COLOR
// ==========================================================================

/**
 * Inicializa el selector de color (color picker) del modal de mazo.
 * Usa delegación de eventos sobre el contenedor para mayor eficiencia.
 * Gestiona los atributos ARIA `role="radio"` y `aria-checked`.
 * @returns {void}
 */
export function initColorPicker() {
    const picker = document.getElementById('color-picker-grid');
    if (!picker) return;

    picker.addEventListener('click', (e) => {
        const option = e.target.closest('.color-option');
        if (!option) return;

        picker.querySelectorAll('.color-option').forEach((opt) => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-checked', 'false');
        });
        option.classList.add('selected');
        option.setAttribute('aria-checked', 'true');
    });

    // Soporte de teclado para el radiogroup de colores
    picker.addEventListener('keydown', (e) => {
        const option = e.target.closest('.color-option');
        if (!option) return;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            option.click();
        }
    });
}

// ==========================================================================
// SELECTOR DE MODO DE ESTUDIO (UI)
// ==========================================================================

/**
 * Inicializa la UI del selector de modo de estudio (radio buttons de Estudiar Todo / Examen).
 * Actualiza los estilos de los labels según la selección y muestra/oculta el
 * selector de cantidad de preguntas para el Modo Examen.
 * @returns {void}
 */
export function initStudyModeSelector() {
    const rAll  = document.querySelector('input[name="study-mode-choice"][value="all"]');
    const rExam = document.querySelector('input[name="study-mode-choice"][value="exam"]');
    const lblAll  = document.getElementById('label-mode-all');
    const lblExam = document.getElementById('label-mode-exam');

    /**
     * Actualiza los estilos de los labels del selector de modo de estudio.
     * @param {HTMLElement|null} selected - El label del modo seleccionado actualmente.
     * @param {'all'|'exam'}     mode     - El modo de estudio seleccionado.
     */
    const updateUI = (selected, mode) => {
        [lblAll, lblExam].forEach((lbl) => {
            if (!lbl) return;
            lbl.classList.remove('study-mode-label--active');
        });
        if (selected) selected.classList.add('study-mode-label--active');

        const examQtyWrapper = document.getElementById('exam-quantity-wrapper');
        if (examQtyWrapper) {
            examQtyWrapper.classList.toggle('is-visible', mode === 'exam');
        }
    };

    if (rAll)  rAll.addEventListener('change', () => updateUI(lblAll, 'all'));
    if (rExam) rExam.addEventListener('change', () => updateUI(lblExam, 'exam'));
}

// ==========================================================================
// INICIO DE SESIÓN DE ESTUDIO (preparación del modal)
// ==========================================================================

/**
 * Prepara y abre el modal de selección de modo de estudio para un mazo dado.
 * Resetea la selección al modo 'all' antes de abrir.
 * @param {number} deckId - ID del mazo que se quiere estudiar.
 * @returns {void}
 */
export function startStudySession(deckId) {
    setSelectedDeckIdForStudy(deckId);

    // Resetear al modo 'all' por defecto
    const rAll = document.querySelector('input[name="study-mode-choice"][value="all"]');
    if (rAll) {
        rAll.checked = true;
        rAll.dispatchEvent(new Event('change'));
    }

    openStudyModeModal();
}

/**
 * Rellena los campos del modal de edición de mazo con los datos del mazo existente.
 * @param {number} deckId - ID del mazo a editar.
 * @returns {void}
 */
export function populateEditDeckModal(deckId) {
    const deck = currentDecks.find((d) => d.id === deckId);
    if (!deck) return;

    document.getElementById('deck-edit-id').value = deckId;
    document.getElementById('deck-input-name').value = deck.nombre;
    document.getElementById('deck-input-desc').value = deck.descripcion || '';

    const select  = document.getElementById('deck-select-category');
    const wrapper = document.getElementById('new-category-input-wrapper');

    if (select) {
        const cat       = deck.categoria || 'General';
        const hasOption = Array.from(select.options).some((opt) => opt.value === cat);

        if (!hasOption) {
            const opt = document.createElement('option');
            opt.value     = cat;
            opt.textContent = cat;
            select.insertBefore(opt, select.querySelector('option[value="__NEW__"]'));
        }
        select.value = cat;
        if (wrapper) wrapper.classList.remove('is-visible');
    }
    document.getElementById('deck-input-category').value = '';

    // Seleccionar el color en el picker
    const picker = document.getElementById('color-picker-grid');
    picker?.querySelectorAll('.color-option').forEach((opt) => {
        const isSelected = opt.dataset.color === (deck.color || 'indigo');
        opt.classList.toggle('selected', isSelected);
        opt.setAttribute('aria-checked', String(isSelected));
    });

    document.getElementById('deck-modal-title-text').textContent = 'Editar Mazo de Estudio';
    document.getElementById('btn-deck-submit').textContent = 'Guardar Cambios';
    // NOTA: openCreateDeckModal() se llama DESDE main.js DESPUÉS de populateEditDeckModal()
    // para garantizar que los datos estén cargados antes de que el modal sea visible.
}
