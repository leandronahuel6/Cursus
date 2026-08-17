/**
 * @fileoverview Modal de Contacto — contact-modal.js
 *
 * Gestiona la apertura del modal de contacto y el envío del formulario
 * de feedback al equipo de soporte.
 *
 * Bug Fix: elimina los setTimeout mágicos para el cierre post-envío y
 * delega el feedback visual al sistema centralizado `window.showToast`,
 * lo que elimina el falso bloqueo en conexiones rápidas y los posibles
 * race conditions si el usuario interacciona antes de que expire el timer.
 *
 * @module contact-modal
 */

'use strict';

import { closeProfileMenu } from '../shared/profile-menu.js';
import { getCachedUser } from '../services/AuthService.js';
import { sendContactMessage } from '../services/ProfileService.js';

/* ==========================================================================
   UTILIDADES DE BOTÓN (Estado visual)
   ========================================================================== */

/**
 * Gestiona el estado visual de un botón de envío mediante clases BEM.
 * Evita manipulaciones dispersas de `style` o `textContent` por los handlers.
 *
 * @param {HTMLButtonElement|null} btn   - El botón a gestionar.
 * @param {'loading'|'success'|'error'|'reset'} state - Estado deseado.
 * @param {string} [text] - Texto opcional a mostrar. Si se omite, usa el predeterminado del estado.
 * @returns {void}
 */
function setButtonState(btn, state, text) {
    if (!btn) return;
    btn.classList.remove('btn--success', 'btn--danger');

    switch (state) {
        case 'loading':
            btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
            btn.disabled    = true;
            btn.textContent = text || 'Enviando...';
            break;
        case 'success':
            btn.disabled    = false;
            btn.textContent = text || '✓ Éxito';
            btn.classList.add('btn--success');
            break;
        case 'error':
            btn.disabled    = false;
            btn.textContent = text || 'Error';
            btn.classList.add('btn--danger');
            break;
        case 'reset':
            btn.disabled    = false;
            btn.textContent = btn.dataset.originalText || text;
            delete btn.dataset.originalText;
            break;
    }
}

/* ==========================================================================
   MODAL DE CONTACTO
   ========================================================================== */

/**
 * Abre el modal de contacto disparando el evento del sistema de modales.
 * Cierra el menú de perfil si estaba abierto.
 *
 * @returns {void}
 */
function openContactModal() {
    closeProfileMenu();
    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'contact-modal' } }));
}

/**
 * Maneja el envío del formulario de contacto.
 *
 * Obtiene los datos del remitente desde el caché del usuario, construye
 * el payload y lo envía al servidor via `ProfileService.sendContactMessage`.
 *
 * Si el envío tiene éxito, cierra el modal y muestra un toast de confirmación.
 * Si falla, muestra un toast de error. En ambos casos el botón se restablece
 * de forma inmediata (sin setTimeout mágico).
 *
 * @param {SubmitEvent} e - Evento de submit del formulario.
 * @returns {Promise<void>}
 */
async function handleContactSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('contact-submit-btn');
    if (!btn) return;

    const cachedUser = getCachedUser();
    const remitenteNombre = cachedUser?.nombre || '';
    const remitenteEmail  = cachedUser?.email  || '';

    setButtonState(btn, 'loading', 'Enviando...');

    try {
        const { response } = await sendContactMessage({
            tipo:             document.getElementById('contact-type').value,
            asunto:           document.getElementById('contact-subject').value,
            descripcion:      document.getElementById('contact-body-msg').value,
            remitente_nombre: remitenteNombre,
            remitente_email:  remitenteEmail,
        });

        if (!response.ok) throw new Error('server-error');

        // Cerrar modal y dar feedback inmediato con el sistema centralizado de Toasts.
        document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'contact-modal' } }));
        e.target.reset();
        setButtonState(btn, 'reset');
        if (typeof window.showToast === 'function') {
            window.showToast('¡Mensaje enviado correctamente!', 'success');
        }
    } catch (_) {
        setButtonState(btn, 'reset');
        if (typeof window.showToast === 'function') {
            window.showToast('No se pudo enviar el mensaje. Intentá de nuevo.', 'error');
        }
    }
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Botón "Contacto" del menú de perfil
    const openContactBtn = document.querySelector('[data-js="open-contact-modal"]');
    if (openContactBtn) {
        openContactBtn.addEventListener('click', openContactModal);
    }

    // Submit del formulario de contacto (delegado al documento para compatibilidad
    // con el sistema de modales que puede recrear el DOM)
    document.addEventListener('submit', function (e) {
        if (e.target.id === 'contact-form') {
            handleContactSubmit(e);
        }
    });
});
