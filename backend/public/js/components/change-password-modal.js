/**
 * @fileoverview Modal de Cambio de Contraseña — change-password-modal.js
 *
 * Gestiona la apertura, cierre y el envío del formulario de cambio de
 * contraseña. Realiza validación en el cliente antes de llamar a la API
 * para evitar round-trips innecesarios.
 *
 * @module change-password-modal
 */

'use strict';

import { changePassword } from '../services/ProfileService.js';

/* ==========================================================================
   UTILIDADES DE BOTÓN (Estado visual)
   ========================================================================== */

/**
 * Gestiona el estado visual de un botón de envío mediante clases BEM.
 *
 * @param {HTMLButtonElement|null} btn   - El botón a gestionar.
 * @param {'loading'|'success'|'error'|'reset'} state - Estado deseado.
 * @param {string} [text] - Texto opcional a mostrar en el botón.
 * @returns {void}
 */
function setButtonState(btn, state, text) {
    if (!btn) return;
    btn.classList.remove('btn--success', 'btn--danger');

    switch (state) {
        case 'loading':
            btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
            btn.disabled    = true;
            btn.textContent = text || 'Guardando...';
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

/**
 * Muestra u oculta un mensaje de error en el DOM.
 *
 * @param {HTMLElement|null} el - El elemento de error.
 * @param {string} msg - El mensaje a mostrar (vacío para ocultar).
 * @returns {void}
 */
function toggleError(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    if (msg) el.classList.add('is-visible');
    else el.classList.remove('is-visible');
}

/* ==========================================================================
   MODAL DE CAMBIO DE CONTRASEÑA
   ========================================================================== */

/**
 * Abre el modal de cambio de contraseña.
 * Resetea el formulario y limpia todos los mensajes de error y éxito
 * antes de abrir para garantizar un estado limpio en cada apertura.
 *
 * @returns {void}
 */
export function openChangePasswordModal() {
    const form = document.getElementById('change-password-form');
    if (form) form.reset();

    ['cp-current-error', 'cp-new-error', 'cp-confirm-error'].forEach((id) => {
        const el = document.getElementById(id);
        toggleError(el, '');
    });

    const successEl = document.getElementById('cp-success');
    if (successEl) {
        successEl.hidden      = true;
        successEl.textContent = '';
    }

    const submitBtn = document.getElementById('cp-submit');
    if (submitBtn) submitBtn.disabled = false;

    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'change-password-modal' } }));
}

/**
 * Cierra el modal de cambio de contraseña.
 *
 * @returns {void}
 */
function closeChangePasswordModal() {
    document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'change-password-modal' } }));
}

/**
 * Maneja el envío del formulario de cambio de contraseña.
 *
 * Realiza validación client-side (campo vacío, longitud mínima, confirmación)
 * antes de hacer la petición al servidor para evitar round-trips innecesarios.
 * Muestra los errores de validación de Laravel de forma dinámica.
 *
 * @param {SubmitEvent} e - Evento de submit del formulario.
 * @returns {Promise<void>}
 */
async function handleChangePasswordSubmit(e) {
    e.preventDefault();

    const current      = document.getElementById('cp-current');
    const newPwd       = document.getElementById('cp-new');
    const confirm      = document.getElementById('cp-confirm');
    const currentError = document.getElementById('cp-current-error');
    const newError     = document.getElementById('cp-new-error');
    const confirmError = document.getElementById('cp-confirm-error');
    const successEl    = document.getElementById('cp-success');
    const submitBtn    = document.getElementById('cp-submit');

    // Limpiar estado previo
    toggleError(currentError, '');
    toggleError(newError, '');
    toggleError(confirmError, '');
    if (successEl)    successEl.hidden           = true;

    // --- Validación client-side ---
    if (!current.value) {
        toggleError(currentError, 'Ingresá tu contraseña actual');
        current.focus();
        return;
    }
    if (newPwd.value.length < 8) {
        toggleError(newError, 'La nueva contraseña debe tener al menos 8 caracteres');
        newPwd.focus();
        return;
    }
    if (newPwd.value !== confirm.value) {
        toggleError(confirmError, 'Las contraseñas no coinciden');
        confirm.focus();
        return;
    }

    setButtonState(submitBtn, 'loading', 'Guardando...');

    try {
        const { response, data } = await changePassword(
            current.value,
            newPwd.value,
            confirm.value
        );

        if (!response.ok) {
            // Mapear errores de validación de Laravel hacia los campos del formulario
            if (data?.errors) {
                if (data.errors.current_password) {
                    toggleError(currentError, data.errors.current_password[0]);
                }
                if (data.errors.password) {
                    toggleError(newError, data.errors.password[0]);
                }
            } else if (currentError) {
                // Fallback al mensaje genérico del servidor
                toggleError(currentError, data?.message || 'Ocurrió un error');
            }
            setButtonState(submitBtn, 'reset', 'Guardar cambios');
            return;
        }

        // Éxito: mostrar mensaje y cerrar el modal
        if (successEl) {
            successEl.textContent = data?.message || 'Contraseña actualizada correctamente';
            successEl.hidden      = false;
        }

        const form = document.getElementById('change-password-form');
        if (form) form.reset();

        setButtonState(submitBtn, 'reset', 'Guardar cambios');

        if (typeof window.showToast === 'function') {
            window.showToast('Contraseña actualizada correctamente.', 'success');
        }

        // Cierre leve con un timeout acotado solo para que el usuario lea el mensaje
        setTimeout(closeChangePasswordModal, 1500);

    } catch (_) {
        toggleError(currentError, 'Error de conexión. Intentá de nuevo.');
        setButtonState(submitBtn, 'reset', 'Guardar cambios');
    }
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Botón "Cambiar contraseña" dentro del modal de perfil
    const openCpBtn = document.querySelector('[data-js="open-change-password"]');
    if (openCpBtn) {
        openCpBtn.addEventListener('click', openChangePasswordModal);
    }

    // Submit del formulario delegado al documento
    document.addEventListener('submit', function (e) {
        if (e.target.id === 'change-password-form') {
            handleChangePasswordSubmit(e);
        }
    });
});
