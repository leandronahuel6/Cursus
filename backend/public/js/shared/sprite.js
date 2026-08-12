/**
 * @fileoverview Helper de iconografía SVG Sprite para Cursus.
 *
 * Provee una función centralizada para generar el markup `<svg><use>` del sprite
 * local, siguiendo las reglas de la guía `backend/docs/guia-uso-sprite.md`.
 *
 * Convenciones:
 * - Los íconos son `aria-hidden="true"` por defecto, ya que en la mayoría de
 *   los casos el contexto semántico está dado por el elemento padre (botón,
 *   enlace o texto adyacente).
 * - El tamaño por defecto es 16×16px; puede sobreescribirse vía CSS.
 * - La ruta del sprite puede configurarse llamando a `setSpriteUrl()` si la
 *   estructura de assets cambia.
 *
 * @module shared/sprite
 */

'use strict';

/** @type {string} Ruta pública al archivo sprite.svg. */
let _spriteUrl = '/assets/icons/sprite.svg';

/**
 * Configura la URL del sprite SVG. Llama a esta función en el bootstrap
 * si la ruta difiere de la predeterminada.
 *
 * @param {string} url - Ruta absoluta o relativa al archivo sprite.svg.
 * @returns {void}
 */
export function setSpriteUrl(url) {
  _spriteUrl = url;
}

/**
 * Genera el markup HTML de un ícono del sprite SVG.
 * Devuelve una cadena de texto lista para inyectar en `innerHTML`.
 *
 * @param {string} id - ID del símbolo en el sprite (equivale al nombre del archivo sin `.svg`).
 *   Ejemplos: `'check'`, `'trash-2'`, `'chevron-left'`.
 * @param {Object} [options={}] - Opciones adicionales.
 * @param {number} [options.width=16] - Ancho del ícono en píxeles.
 * @param {number} [options.height=16] - Alto del ícono en píxeles.
 * @param {string} [options.className=''] - Clases CSS adicionales para el `<svg>`.
 * @param {boolean} [options.decorative=true] - Si es `true`, añade `aria-hidden="true"`.
 * @param {string} [options.title=''] - Título accesible (solo si `decorative=false`).
 * @returns {string} Markup HTML del ícono SVG.
 *
 * @example
 * // Ícono decorativo básico
 * el.innerHTML = spriteIcon('check');
 *
 * @example
 * // Ícono con tamaño personalizado y clase
 * el.innerHTML = spriteIcon('trash-2', { width: 18, height: 18, className: 'icon-action' });
 *
 * @example
 * // Ícono significativo (no decorativo) con title
 * el.innerHTML = spriteIcon('bell', { decorative: false, title: 'Notificaciones' });
 */
export function spriteIcon(id, options = {}) {
  const {
    width     = 16,
    height    = 16,
    className = '',
    decorative = true,
    title      = '',
  } = options;

  const ariaAttrs = decorative
    ? 'aria-hidden="true" focusable="false"'
    : `role="img" aria-label="${title}"`;

  const classAttr = className ? ` class="${className}"` : '';

  return `<svg width="${width}" height="${height}"${classAttr} ${ariaAttrs}>` +
    (decorative ? '' : `<title>${title}</title>`) +
    `<use href="${_spriteUrl}#${id}"></use>` +
    `</svg>`;
}

/**
 * Crea un elemento `<svg>` DOM (no innerHTML) con referencia al sprite.
 * Útil cuando necesitás insertar el ícono vía `appendChild` para evitar
 * el parseo de HTML y mantener el rendimiento.
 *
 * @param {string} id - ID del símbolo en el sprite.
 * @param {Object} [options={}] - Mismas opciones que `spriteIcon`.
 * @param {number} [options.width=16]
 * @param {number} [options.height=16]
 * @param {string} [options.className='']
 * @param {boolean} [options.decorative=true]
 * @param {string} [options.title='']
 * @returns {SVGSVGElement} Elemento SVG listo para insertar en el DOM.
 */
export function createSpriteIcon(id, options = {}) {
  const {
    width      = 16,
    height     = 16,
    className  = '',
    decorative = true,
    title      = '',
  } = options;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width',  String(width));
  svg.setAttribute('height', String(height));

  if (decorative) {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable',   'false');
  } else {
    svg.setAttribute('role',       'img');
    svg.setAttribute('aria-label', title);

    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    titleEl.textContent = title;
    svg.appendChild(titleEl);
  }

  if (className) svg.setAttribute('class', className);

  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `${_spriteUrl}#${id}`);
  svg.appendChild(use);

  return svg;
}

// ── Legacy Global Export ─────────────────────────────────────────────────────
window.CursusSprite = { spriteIcon, createSpriteIcon, setSpriteUrl };
