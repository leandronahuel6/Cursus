/**
 * @fileoverview Sistema Global de Toasts — Cursus
 * @module shared/toast
 *
 * Componente único y centralizado de notificaciones flotantes.
 * Se expone como `window.showToast` para compatibilidad total con scripts
 * clásicos (legacy) y módulos ES6 simultáneamente.
 *
 * Consumo:
 *   window.showToast('Mensaje', 'success');
 *   window.showToast('Error al guardar', 'error');
 *   window.showToast('Atención', 'warn');
 *   window.showToast('Información', 'info');
 *
 * Íconos: exclusivamente desde el Sprite SVG local.
 *   success → sprite.svg#circle-check
 *   error   → sprite.svg#circle-x
 *   warn    → sprite.svg#circle-alert
 *   info    → sprite.svg#info
 *
 * CSS: public/css/components/toast.css
 */

(function () {
  'use strict';

  /**
   * Mapa de configuración por tipo de toast.
   * Define el ícono SVG del sprite y el aria-label accesible.
   * @type {Object.<string, {icon: string, label: string}>}
   */
  const TOAST_CONFIG = {
    success: { icon: 'circle-check',  label: 'Éxito' },
    error:   { icon: 'circle-x',      label: 'Error' },
    warn:    { icon: 'circle-alert',  label: 'Advertencia' },
    info:    { icon: 'info',          label: 'Información' },
  };

  /** Duración por defecto en ms antes de auto-cerrar el toast. */
  const DEFAULT_DURATION = 4000;

  /**
   * Obtiene o crea el contenedor de toasts en el DOM.
   * Reutiliza el existente (inyectado por app.blade.php) si ya existe.
   * @returns {HTMLElement} El elemento contenedor de toasts.
   */
  function _getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Construye el HTML interno del toast usando el Sprite SVG.
   * @param {string} message - Texto del mensaje.
   * @param {string} iconId  - ID del ícono en el sprite (ej: 'check').
   * @param {string} label   - Texto alternativo accesible para el ícono.
   * @returns {string} HTML string del contenido del toast.
   */
  function _buildInnerHTML(message, iconId, label) {
    return `
      <svg class="toast__icon" aria-hidden="true" focusable="false">
        <use href="/assets/icons/sprite.svg#${iconId}"></use>
      </svg>
      <span class="toast__message">${message}</span>
      <button
        class="toast__close"
        type="button"
        aria-label="Cerrar notificación"
      >
        <svg width="14" height="14" aria-hidden="true" focusable="false">
          <use href="/assets/icons/sprite.svg#x"></use>
        </svg>
      </button>
    `;
  }

  /**
   * Cierra un toast con animación de salida y lo elimina del DOM.
   * @param {HTMLElement} toastEl - El elemento toast a eliminar.
   */
  function _dismissToast(toastEl) {
    if (!toastEl || !toastEl.parentNode) return;
    toastEl.style.animation = 'toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      if (toastEl.parentNode) toastEl.remove();
    }, 300);
  }

  /**
   * Muestra una notificación flotante tipo Toast en la esquina inferior-derecha.
   *
   * @param {string} message                          - Texto del mensaje a mostrar al usuario.
   * @param {'success'|'error'|'warn'|'info'} [type]  - Tipo visual. Determina color e ícono. Por defecto 'success'.
   * @param {number} [duration]                       - Duración en ms antes del auto-cierre. Por defecto 4000ms.
   * @returns {void}
   */
  function showToast(message, type, duration) {
    const resolvedType = (type && TOAST_CONFIG[type]) ? type : 'success';
    const resolvedDuration = (typeof duration === 'number' && duration > 0) ? duration : DEFAULT_DURATION;

    const config    = TOAST_CONFIG[resolvedType];
    const container = _getContainer();

    const toastEl = document.createElement('div');
    toastEl.className = `toast ${resolvedType}`;
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-label', `${config.label}: ${message}`);
    toastEl.innerHTML = _buildInnerHTML(message, config.icon, config.label);

    // Botón de cierre manual
    const closeBtn = toastEl.querySelector('.toast__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => _dismissToast(toastEl));
    }

    container.appendChild(toastEl);

    // Auto-cierre después de `resolvedDuration` ms
    setTimeout(() => _dismissToast(toastEl), resolvedDuration);
  }

  // ── Exposición global ──────────────────────────────────────────────────────
  // Se expone en window para compatibilidad con scripts legacy (sin import)
  // y módulos ES6 que usen window.showToast directamente.
  window.showToast = showToast;

}());
