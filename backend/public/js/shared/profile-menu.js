/**
 * @fileoverview Módulo de Menú de Perfil — profile-menu.js
 *
 * Gestiona la apertura y cierre del popup de menú de usuario (`#profile-menu`)
 * tanto en desktop (clic en `.sb-user`) como en mobile (clic en `#bn-av` y
 * el botón `[data-js="pm-close"]`).
 *
 * Delega todos los eventos mediante `addEventListener` localmente,
 * sin exponer ninguna función al objeto global `window`.
 *
 * @module profile-menu
 */

'use strict';

/* ==========================================================================
   ESTADO Y REFERENCIAS
   ========================================================================== */

/** @type {HTMLElement|null} */
const menu = document.getElementById('profile-menu');

/* ==========================================================================
   HELPERS INTERNOS
   ========================================================================== */

/**
 * Cierra el menú de perfil si está abierto, eliminando las clases
 * de estado del menú y del elemento disparador.
 *
 * @returns {void}
 */
function closeProfileMenu() {
    if (!menu || !menu.classList.contains('open')) return;
    menu.classList.remove('open');
    const userBtn = document.querySelector('.sb-user');
    if (userBtn) userBtn.classList.remove('menu-open');
}

/**
 * Alterna el estado abierto/cerrado del menú de perfil desktop.
 * Detiene la propagación del evento para que el handler global de
 * "clic fuera" no lo cierre inmediatamente.
 *
 * @param {MouseEvent} e - El evento de clic del disparador.
 * @returns {void}
 */
function toggleProfileMenu(e) {
    e.stopPropagation();
    if (!menu) return;
    const isOpen = menu.classList.toggle('open');
    const userBtn = e.currentTarget;
    if (userBtn) userBtn.classList.toggle('menu-open', isOpen);
}

/**
 * Alterna el estado abierto/cerrado del menú de perfil en mobile.
 * Comparte el mismo elemento `#profile-menu` pero con disparadores
 * distintos (`#bn-av` y `[data-js="pm-close"]`).
 *
 * @param {MouseEvent} e - El evento de clic del disparador.
 * @returns {void}
 */
function toggleMobileProfileMenu(e) {
    e.stopPropagation();
    if (!menu) return;
    menu.classList.toggle('open');
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // --- Disparador desktop: bloque .sb-user del sidebar ---
    const sbUser = document.querySelector('.sb-user');
    if (sbUser) {
        sbUser.addEventListener('click', toggleProfileMenu);
    }

    // --- Disparador mobile: avatar circular del header móvil ---
    // El elemento #bn-av ahora usa data-js="bn-av-trigger" para evitar inline events.
    const bnAv = document.querySelector('[data-js="bn-av-trigger"]');
    if (bnAv) {
        bnAv.addEventListener('click', toggleMobileProfileMenu);
    }

    // --- Botón cerrar del popup móvil ---
    const pmCloseBtn = document.querySelector('[data-js="pm-close"]');
    if (pmCloseBtn) {
        pmCloseBtn.addEventListener('click', toggleMobileProfileMenu);
    }

    // --- Cerrar al hacer clic fuera del menú ---
    document.addEventListener('click', function (e) {
        if (!menu || !menu.classList.contains('open')) return;

        const isInsideMenu  = menu.contains(e.target);
        const isUserTrigger = e.target.closest('.sb-user, #bn-av, [data-js="pm-close"]');

        if (!isInsideMenu && !isUserTrigger) {
            closeProfileMenu();
        }
    });

    // --- Elementos internos que previenen el cierre (ej. switches) ---
    const preventCloseItems = document.querySelectorAll('[data-prevent-close="true"]');
    preventCloseItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    // --- Botón Guía Rápida ---
    const startTourBtn = document.querySelector('[data-js="start-tour-btn"]');
    if (startTourBtn) {
        startTourBtn.addEventListener('click', function() {
            if (typeof window.startOnboardingTour === 'function' && window.location.pathname.endsWith('/dashboard')) {
                window.startOnboardingTour();
                closeProfileMenu();
            } else {
                window.location.href = '/dashboard?start_tour=true';
            }
        });
    }
});

/* ==========================================================================
   EXPORTACIONES
   ========================================================================== */

/**
 * Exportamos `closeProfileMenu` para que los módulos de modales puedan
 * cerrar el menú antes de abrir un modal sin necesitar acceso al objeto window.
 */
export { closeProfileMenu };
