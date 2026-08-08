/**
 * @file modal.js
 * @description Sistema de Modales — Control de accesibilidad (A11y) y ciclo de vida.
 *
 * Responsabilidades:
 *  - Abrir/cerrar modales por ID mediante CustomEvents.
 *  - Focus Trap: mantiene el foco dentro del modal mientras está abierto.
 *  - Cierre por Escape.
 *  - Cierre por clic en el overlay oscuro.
 *  - Retorno de foco al elemento disparador al cerrar.
 *
 * Uso:
 *  Abrir:   document.dispatchEvent(new CustomEvent('modal:open',  { detail: { id: 'mi-modal' } }));
 *  Cerrar:  document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'mi-modal' } }));
 *
 * Alternativamente, desde HTML (solo para botones DENTRO de un modal abierto):
 *  <button data-js="modal-close">Cancelar</button>
 *
 * @module modal
 */

/** @type {HTMLElement|null} Elemento que tenía el foco antes de abrir el modal. */
let _triggerElement = null;

/** Selectores de elementos que pueden recibir foco para el Focus Trap. */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Devuelve todos los elementos enfocables dentro de un contenedor.
 *
 * @param {HTMLElement} container — El contenedor donde buscar.
 * @returns {HTMLElement[]}
 */
const getFocusableElements = (container) =>
  Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
    (el) => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]')
  );

/**
 * Abre un modal por ID, guarda el disparador y aplica Focus Trap.
 *
 * @param {string}           id       — ID del elemento overlay del modal.
 * @param {HTMLElement|null} trigger  — Elemento que disparó la apertura (para restaurar foco al cerrar).
 * @returns {void}
 */
const openModal = (id, trigger = null) => {
  const overlay = document.getElementById(id);
  if (!overlay) {
    console.warn(`[modal.js] No se encontró el modal con id="${id}".`);
    return;
  }

  // Guardar el disparador para restaurar foco al cerrar
  _triggerElement = trigger ?? document.activeElement;

  // Mostrar modal y bloquear scroll del contenedor principal
  overlay.classList.add('show');
  overlay.removeAttribute('hidden');
  const scrollContainer = document.querySelector('.page') || document.body;
  scrollContainer.classList.add('overflow-hidden');

  // Mover el foco al primer elemento enfocable dentro del modal
  const box = overlay.querySelector('[data-js="modal-box"]');
  if (box) {
    const focusable = getFocusableElements(box);
    if (focusable.length > 0) {
      // Si hay botón de cierre (X), es el primero; priorizar el de acción
      const primaryBtn = box.querySelector('[data-js="modal-confirm-action"]');
      (primaryBtn ?? focusable[0]).focus();
    }
  }
};

/**
 * Cierra un modal por ID y devuelve el foco al elemento disparador.
 *
 * @param {string} id — ID del elemento overlay del modal.
 * @returns {void}
 */
const closeModal = (id) => {
  const overlay = document.getElementById(id);
  if (!overlay) return;

  overlay.classList.remove('show');

  // Si no hay más modales abiertos, devolvemos el scroll al contenedor
  if (document.querySelectorAll('.modal-overlay.show').length === 0) {
    const scrollContainer = document.querySelector('.page') || document.body;
    scrollContainer.classList.remove('overflow-hidden');
  }

  // Restaurar foco al elemento que disparó la apertura
  if (_triggerElement && typeof _triggerElement.focus === 'function') {
    _triggerElement.focus();
    _triggerElement = null;
  }
};

/**
 * Cierra todos los modales visibles actualmente.
 *
 * @returns {void}
 */
const closeAllModals = () => {
  document.querySelectorAll('.modal-overlay.show').forEach((overlay) => {
    closeModal(overlay.id);
  });
};

/**
 * Manejador del Focus Trap para eventos keydown dentro de un modal.
 * Se aplica en el overlay y captura Tab y Shift+Tab para ciclar dentro.
 *
 * @param {KeyboardEvent} event
 * @returns {void}
 */
const handleFocusTrap = (event) => {
  const overlay = document.querySelector('.modal-overlay.show');
  if (!overlay) return;

  const box = overlay.querySelector('[data-js="modal-box"]');
  if (!box) return;

  const focusable = getFocusableElements(box);
  if (focusable.length === 0) return;

  const firstEl = focusable[0];
  const lastEl  = focusable[focusable.length - 1];

  if (event.key === 'Tab') {
    if (event.shiftKey) {
      // Shift+Tab: si el foco está en el primer elemento, saltar al último
      if (document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      }
    } else {
      // Tab: si el foco está en el último elemento, saltar al primero
      if (document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }
  }
};

/**
 * Manejador para delegación de clics en los triggers del modal.
 * Detecta: clic en overlay, botones data-js="modal-close".
 *
 * @param {MouseEvent} event
 * @returns {void}
 */
const handleDocumentClick = (event) => {
  // Clic en el overlay oscuro (fuera del modal-box)
  if (
    event.target.matches('[data-js="modal-overlay"]') &&
    event.target.classList.contains('modal-overlay')
  ) {
    closeModal(event.target.id);
    return;
  }

  // Clic en botón de cierre (X o Cancelar dentro de un modal)
  const closeBtn = event.target.closest('[data-js="modal-close"]');
  if (closeBtn) {
    const overlay = closeBtn.closest('.modal-overlay');
    if (overlay) {
      closeModal(overlay.id);
    }
    return;
  }
};

// ==============================
//  Inicialización
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  // Delegación de clics globales
  document.addEventListener('click', handleDocumentClick);

  // Focus Trap: captura Tab/Shift+Tab globalmente
  document.addEventListener('keydown', (event) => {
    // Escape cierra el modal visible
    if (event.key === 'Escape') {
      const visibleOverlay = document.querySelector('.modal-overlay.show');
      if (visibleOverlay) {
        closeModal(visibleOverlay.id);
      }
      return;
    }

    handleFocusTrap(event);
  });

  // API pública mediante CustomEvents
  document.addEventListener('modal:open', (event) => {
    const { id, trigger } = event.detail ?? {};
    if (id) openModal(id, trigger ?? null);
  });

  document.addEventListener('modal:close', (event) => {
    const { id } = event.detail ?? {};
    if (id) {
      closeModal(id);
    } else {
      closeAllModals();
    }
  });
});

// ==============================
//  Exportar API para uso programático (módulo ES6)
// ==============================
export { openModal, closeModal, closeAllModals };
