/**
 * @fileoverview Controlador universal de modales para el módulo Flashcards.
 *
 * Gestiona la apertura, cierre y accesibilidad de todos los overlays y
 * modales de la vista: mazo, IA, confirmación, modo de estudio, y overlay
 * de carga de IA. Implementa:
 *   - Focus Trap: el foco del teclado queda atrapado dentro del modal abierto.
 *   - ARIA: gestiona `aria-expanded`, `aria-hidden`, `aria-modal` y `aria-live`.
 *   - Cierre con tecla [Escape].
 *
 * @module ui/modals
 */

import { confirmPromiseResolve, setConfirmPromiseResolve } from '../state.js'

// ==========================================================================
// FOCUS TRAP
// ==========================================================================

/** @type {HTMLElement|null} Elemento que tenía el foco antes de abrir el modal. */
let lastFocusedElement = null

/**
 * Obtiene todos los elementos focusables dentro de un contenedor dado.
 * @param {HTMLElement} container - El contenedor del modal.
 * @returns {HTMLElement[]} Array de elementos interactivos y focusables.
 */
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.closest('[hidden]'))
}

/**
 * Instala un listener de teclado que atrapa el foco [Tab] dentro del modal.
 * El listener se elimina automáticamente cuando el modal se cierra.
 * @param {HTMLElement} modalEl  - El elemento del modal (overlay).
 * @param {Function}    cleanup  - Función a llamar para remover el listener cuando cierra.
 * @returns {Function} La función handler del listener, para poder removerla.
 */
function installFocusTrap(modalEl, cleanup) {
  const handler = (e) => {
    if (e.key !== 'Tab') return
    const focusable = getFocusableElements(modalEl)
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
  modalEl.addEventListener('keydown', handler)
  return handler
}

// ==========================================================================
// MODAL GENÉRICO (OVERLAY CON CLASE .open)
// ==========================================================================

/**
 * Abre un modal estándar basado en clase `.fc-overlay` agregando `.open`.
 * Almacena el foco actual, instala el Focus Trap y mueve el foco al primer elemento interactivo.
 * @param {string} modalId - ID del elemento overlay del modal.
 * @returns {void}
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (!modal) return

  lastFocusedElement = document.activeElement
  modal.classList.add('open')
  modal.setAttribute('aria-hidden', 'false')

  // Mover el foco al primer elemento interactivo dentro del modal
  const focusable = getFocusableElements(modal)
  if (focusable.length > 0) {
    setTimeout(() => focusable[0].focus(), 50)
  }

  // Instalar Focus Trap y asociar su cleanup al cierre del modal
  const trapHandler = installFocusTrap(modal, () => {})
  modal._focusTrapHandler = trapHandler
}

/**
 * Cierra un modal estándar quitando la clase `.open`.
 * Restaura el foco al elemento que lo tenía antes de abrir el modal.
 * @param {string} modalId - ID del elemento overlay del modal.
 * @returns {void}
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (!modal) return

  modal.classList.remove('open')
  modal.setAttribute('aria-hidden', 'true')

  // Limpiar Focus Trap
  if (modal._focusTrapHandler) {
    modal.removeEventListener('keydown', modal._focusTrapHandler)
    modal._focusTrapHandler = null
  }

  // Restaurar foco
  if (lastFocusedElement) {
    lastFocusedElement.focus()
    lastFocusedElement = null
  }
}

/**
 * Manejador para cerrar un modal cuando el usuario hace clic en el overlay
 * (fuera del cuadro interno `.fc-modal-box`). Diseñado para usarse como
 * listener del evento `click` en el overlay.
 * @param {MouseEvent} event   - El evento de clic.
 * @param {string}     modalId - ID del overlay. Se cierra solo si el click fue en el overlay mismo.
 * @returns {void}
 */
export function closeModalOnOverlayClick(event, modalId) {
  if (event.target === document.getElementById(modalId)) {
    closeModal(modalId)
  }
}

// ==========================================================================
// MODAL DE CREACIÓN / EDICIÓN DE MAZO
// ==========================================================================

/**
 * Abre el modal de creación de nuevo mazo, reseteando todos sus campos.
 * @returns {void}
 */
export function openCreateDeckModal() {
  document.getElementById('deck-edit-id').value = ''
  document.getElementById('deck-input-name').value = ''
  document.getElementById('deck-input-desc').value = ''
  document.getElementById('deck-input-category').value = ''

  const select = document.getElementById('deck-select-category')
  if (select) select.value = 'General'
  const wrapper = document.getElementById('new-category-input-wrapper')
  if (wrapper) wrapper.classList.remove('is-visible')

  document.getElementById('deck-modal-title-text').textContent =
    'Nuevo Mazo de Estudio'
  document.getElementById('btn-deck-submit').textContent = 'Crear Mazo'

  openModal('create-deck-modal')
}

/**
 * Abre el modal de creación/edición de mazo sin resetear los campos
 * (usado para cuando los campos ya fueron poblados por populateEditDeckModal).
 * @returns {void}
 */
export function openEditDeckModal() {
  openModal('create-deck-modal')
}

/**
 * Cierra el modal de creación/edición de mazo y limpia su formulario.
 * @returns {void}
 */
export function closeCreateDeckModal() {
  closeModal('create-deck-modal')
  document.getElementById('create-deck-form').reset()
  document.getElementById('deck-input-category').value = ''

  const select = document.getElementById('deck-select-category')
  if (select) select.value = 'General'
  const wrapper = document.getElementById('new-category-input-wrapper')
  if (wrapper) wrapper.classList.remove('is-visible')

  document
    .querySelectorAll('.color-option')
    .forEach((opt) => opt.classList.remove('selected'))
  document
    .querySelector('.color-option[data-color="indigo"]')
    ?.classList.add('selected')
}

/**
 * Muestra/oculta el campo de nuevo contenedor según el valor del selector de categoría
 * del modal de mazo.
 * @returns {void}
 */
export function handleDeckSelectCategoryChange() {
  const select = document.getElementById('deck-select-category')
  const wrapper = document.getElementById('new-category-input-wrapper')
  const input = document.getElementById('deck-input-category')
  if (!select || !wrapper || !input) return

  if (select.value === '__NEW__') {
    wrapper.classList.add('is-visible')
    input.focus()
  } else {
    wrapper.classList.remove('is-visible')
    input.value = ''
  }
}

// ==========================================================================
// MODAL DE IA
// ==========================================================================

/**
 * Abre el modal de generación de mazos con IA, reseteando su estado.
 * @returns {void}
 */
export function openAIDeckModal() {
  const select = document.getElementById('ai-deck-select-category')
  if (select) select.value = '__AUTO__'
  const wrapper = document.getElementById('ai-new-category-input-wrapper')
  if (wrapper) wrapper.classList.remove('is-visible')
  document.getElementById('ai-deck-input-category').value = ''

  openModal('ai-deck-modal')
}

/**
 * Cierra el modal de generación de mazos con IA y resetea su formulario.
 * @returns {void}
 */
export function closeAIDeckModal() {
  closeModal('ai-deck-modal')
  document.getElementById('ai-deck-form').reset()

  const select = document.getElementById('ai-deck-select-category')
  if (select) select.value = '__AUTO__'
  const wrapper = document.getElementById('ai-new-category-input-wrapper')
  if (wrapper) wrapper.classList.remove('is-visible')
  document.getElementById('ai-deck-input-category').value = ''
}

/**
 * Muestra/oculta el campo de nuevo contenedor del modal de IA.
 * @returns {void}
 */
export function handleAIDeckSelectCategoryChange() {
  const select = document.getElementById('ai-deck-select-category')
  const wrapper = document.getElementById('ai-new-category-input-wrapper')
  const input = document.getElementById('ai-deck-input-category')
  if (!select || !wrapper || !input) return

  if (select.value === '__NEW__') {
    wrapper.classList.add('is-visible')
    input.focus()
  } else {
    wrapper.classList.remove('is-visible')
    input.value = ''
  }
}

// ==========================================================================
// MODAL DE MODO DE ESTUDIO
// ==========================================================================

/**
 * Abre el modal de selección de modo de estudio.
 * @returns {void}
 */
export function openStudyModeModal() {
  openModal('study-mode-modal')
}

/**
 * Cierra el modal de selección de modo de estudio.
 * @returns {void}
 */
export function closeStudyModeModal() {
  closeModal('study-mode-modal')
}

// ==========================================================================
// MODAL DE CONFIRMACIÓN PERSONALIZADO (Promise-based)
// ==========================================================================

/**
 * Muestra un modal de confirmación personalizado y devuelve una Promise que
 * resuelve a `true` (aceptado) o `false` (cancelado/cerrado).
 *
 * @param {Object}  options              - Configuración del modal.
 * @param {string}  options.title        - Título del modal.
 * @param {string}  options.message      - Mensaje descriptivo.
 * @param {string}  [options.acceptText='Confirmar'] - Texto del botón de aceptar.
 * @param {string}  [options.cancelText='Cancelar']  - Texto del botón de cancelar.
 * @param {boolean} [options.isDestructive=false]    - Si es true, el botón de aceptar se muestra en rojo.
 * @returns {Promise<boolean>} `true` si el usuario aceptó, `false` si canceló.
 */
export function showCustomConfirm({
  title,
  message,
  acceptText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-confirm-modal')
    const titleEl = document.getElementById('confirm-modal-title-text')
    const bodyEl = document.getElementById('confirm-modal-body-text')
    const btnCancel = document.getElementById('btn-confirm-cancel')
    const btnAccept = document.getElementById('btn-confirm-accept')
    const modalIcon = document.getElementById('confirm-modal-icon')

    titleEl.textContent = title
    bodyEl.textContent = message
    btnCancel.textContent = cancelText
    btnAccept.textContent = acceptText

    // Aplicar variante destructiva o estándar mediante clases BEM
    btnAccept.classList.toggle('btn-modal-save--destructive', isDestructive)
    btnAccept.classList.toggle('btn-modal-save--primary', !isDestructive)

    // Extraer dinámicamente la ruta base del SVG sprite para no romper el asset
    const svgBase =
      document
        .querySelector('.modal-icon-brand use')
        ?.getAttribute('href')
        ?.split('#')[0] || '/assets/icons/sprite.svg'

    // Actualizar icono y color según la variante
    const iconHref = isDestructive
      ? `${svgBase}#circle-alert`
      : `${svgBase}#circle-alert`
    modalIcon.innerHTML = `<use href="${iconHref}"></use>`
    modalIcon.classList.toggle('confirm-icon--destructive', isDestructive)
    modalIcon.classList.toggle('confirm-icon--primary', !isDestructive)

    setConfirmPromiseResolve(resolve)
    openModal('custom-confirm-modal')
  })
}

/**
 * Cierra el modal de confirmación personalizado y resuelve su Promise con el resultado dado.
 * @param {boolean} result - Resultado con el que resolver la Promise (`true` = aceptar).
 * @returns {void}
 */
export function closeCustomConfirm(result) {
  closeModal('custom-confirm-modal')
  if (confirmPromiseResolve) {
    confirmPromiseResolve(result)
    setConfirmPromiseResolve(null)
  }
}

// ==========================================================================
// OVERLAY DE CARGA IA
// ==========================================================================

/**
 * Muestra el overlay de carga durante la generación de mazo con IA.
 * Actualiza el título y texto del overlay para comunicar el estado al usuario.
 * @param {string} title - Título del estado actual de la generación.
 * @param {string} text  - Descripción detallada del estado actual.
 * @returns {void}
 */
export function showAILoadingOverlay(title, text) {
  const overlay = document.getElementById('ai-loading-overlay')
  if (!overlay) return
  document.getElementById('ai-loading-title').textContent = title
  document.getElementById('ai-loading-text').textContent = text
  overlay.classList.add('open')
  overlay.setAttribute('aria-hidden', 'false')
}

/**
 * Oculta el overlay de carga de IA con una pequeña transición de salida.
 * @returns {void}
 */
export function hideAILoadingOverlay() {
  const overlay = document.getElementById('ai-loading-overlay')
  if (!overlay) return
  overlay.classList.remove('open')
  overlay.setAttribute('aria-hidden', 'true')
}

// ==========================================================================
// TOOLTIP DE AYUDA IA
// ==========================================================================

/**
 * Alterna la visibilidad del tooltip de información sobre OCR en el modal de IA.
 * Se llama cuando el usuario hace clic en el botón de ayuda (?).
 * @param {Event} event - El evento de clic (se detiene la propagación para evitar cierre inmediato).
 * @returns {void}
 */
export function toggleAIHelpTooltip(event) {
  event.stopPropagation()
  const tooltip = document.getElementById('ai-help-tooltip-content')
  if (!tooltip) return
  const isShowing = tooltip.classList.toggle('show')
  document
    .getElementById('btn-ai-help')
    ?.setAttribute('aria-expanded', String(isShowing))
}

/**
 * Instala el listener global para cerrar el tooltip de IA al hacer clic fuera de él.
 * Se registra una única vez en la inicialización de la vista.
 * @returns {void}
 */
export function installAITooltipOutsideClickHandler() {
  document.addEventListener('click', (event) => {
    const tooltip = document.getElementById('ai-help-tooltip-content')
    const btn = document.getElementById('btn-ai-help')
    if (
      tooltip &&
      tooltip.classList.contains('show') &&
      btn &&
      !btn.contains(event.target) &&
      !tooltip.contains(event.target)
    ) {
      tooltip.classList.remove('show')
      btn.setAttribute('aria-expanded', 'false')
    }
  })
}

/**
 * Instala el listener global de tecla [Escape] para cerrar modales abiertos.
 * Cierra el modal más recientemente abierto al presionar la tecla.
 * @returns {void}
 */
export function installEscapeKeyHandler() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return

    // Cerrar el modal con mayor z-index que esté abierto
    const openModals = Array.from(document.querySelectorAll('.fc-overlay.open'))
    if (openModals.length === 0) return

    const topModal = openModals[openModals.length - 1]
    if (topModal) {
      closeModal(topModal.id)
      // Si es el confirm modal, cancelar su Promise
      if (topModal.id === 'custom-confirm-modal') {
        closeCustomConfirm(false)
      }
    }
  })
}
