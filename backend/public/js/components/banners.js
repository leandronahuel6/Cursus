/**
 * @fileoverview Lógica centralizada para los Banners de Sistema.
 * @module components/banners
 */

'use strict';

export const SystemBanner = {
  /**
   * Muestra un banner y actualiza su contenido de forma segura.
   * 
   * @param {string} id - ID del elemento .system-banner en el DOM.
   * @param {string} type - Tipo de alerta ('info', 'warn', 'urgent').
   * @param {string} [title] - Título opcional, busca un nodo .system-banner__title o lo crea.
   * @param {string} [text] - Texto dinámico, inyectado en .system-banner__dynamic-text de forma segura.
   */
  show(id, type, title, text) {
    const banner = document.getElementById(id);
    if (!banner) return;

    // Actualizar tipo
    banner.classList.remove('system-banner--info', 'system-banner--warn', 'system-banner--urgent');
    if (type) {
      banner.classList.add(`system-banner--${type}`);
    }

    // Actualizar título (si existe o se provee)
    if (title) {
      let titleEl = banner.querySelector('.system-banner__title');
      if (titleEl) {
        titleEl.textContent = title;
      } else {
        const textContainer = banner.querySelector('.system-banner__text');
        if (textContainer) {
          titleEl = document.createElement('strong');
          titleEl.className = 'system-banner__title';
          titleEl.textContent = title;
          textContainer.prepend(titleEl);
        }
      }
    }

    // Actualizar texto dinámico sin destruir slots/enlaces estáticos
    if (text !== undefined && text !== null) {
      const textEl = banner.querySelector('.system-banner__dynamic-text');
      if (textEl) {
        textEl.textContent = text;
      }
    }

    banner.classList.add('is-visible');
  },

  /**
   * Oculta un banner específico.
   * 
   * @param {string} id - ID del elemento .system-banner en el DOM.
   */
  hide(id) {
    const banner = document.getElementById(id);
    if (banner) {
      banner.classList.remove('is-visible');
    }
  }
};

// Event Delegation Global para cerrar los banners
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-js-action="close-banner"]');
  if (btn) {
    const banner = btn.closest('.system-banner');
    if (banner) {
      banner.classList.remove('is-visible');
    }
  }
});
