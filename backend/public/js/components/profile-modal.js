/**
 * @fileoverview Modal de Edición de Perfil — profile-modal.js
 *
 * Gestiona la apertura, cierre y guardado del modal de edición de perfil.
 * Incluye la previsualización y gestión pendiente del avatar y el fondo de
 * pantalla, que sólo se suben al servidor al confirmar con "Guardar cambios".
 *
 * Bug Fixes incluidos:
 * - Validación de tamaño máximo (4 MB) para el avatar, que estaba ausente.
 * - Race conditions en el guardado multi-paso: si falla la subida de imagen,
 *   los datos base (nombre, email, etc.) ya guardados no se revierten en la UI,
 *   se notifica el error de imagen de forma aislada.
 *
 * @module profile-modal
 */

'use strict';

import { closeProfileMenu } from '../shared/profile-menu.js'
import { getCachedUser, saveUser } from '../services/AuthService.js';
import { updateProfile, uploadAvatar, deleteAvatar, uploadBackground, deleteBackground } from '../services/ProfileService.js';
import { applyUserToDOM, PRESETS_MAP } from '../shared/workspace-bg.js';
import { openChangePasswordModal } from './change-password-modal.js';

/* ==========================================================================
   ESTADO PENDIENTE (Avatar y Fondo)
   ========================================================================== */

/**
 * Foto de avatar pendiente de confirmación. Se previsualiza localmente y sólo
 * se sube contra la API al confirmar "Guardar cambios". Si el usuario cancela,
 * se descarta y se restaura el avatar realmente guardado.
 * @type {File|null}
 */
let pendingAvatarFile = null;

/** @type {string|null} URL de objeto local para la preview del avatar pendiente. */
let pendingAvatarPreviewUrl = null;

/** @type {boolean} True si el usuario pidió eliminar el avatar existente. */
let pendingAvatarRemove = false;

/** @type {File|null} Imagen de fondo pendiente de confirmación. */
let pendingBgFile = null;

/** @type {string|null} URL de objeto local para la preview del fondo pendiente. */
let pendingBgPreviewUrl = null;

/** @type {boolean} True si el usuario pidió eliminar el fondo personalizado. */
let pendingBgRemove = false;

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

/**
 * Mapea dinámicamente los errores de validación de Laravel hacia los elementos
 * de error del DOM, buscando los IDs por convención `{prefix}-{campo}-error`.
 *
 * @param {Record<string, string[]>} errors - Objeto `data.errors` de Laravel.
 * @param {string}                   prefix - Prefijo de IDs (ej. 'profile').
 * @returns {void}
 */
function displayFormErrors(errors, prefix) {
    if (!errors) return;
    Object.keys(errors).forEach((key) => {
        const cleanKey = key.split('.').pop();
        const errorEl  = document.getElementById(`${prefix}-${cleanKey}-error`);
        toggleError(errorEl, errors[key][0]);
    });
}

/**
 * Limpia todos los mensajes de error del formulario de perfil.
 *
 * @returns {void}
 */
function clearProfileFormErrors() {
    ['profile-nombre-error', 'profile-legajo-error', 'profile-email-error'].forEach((id) => {
        const el = document.getElementById(id);
        toggleError(el, '');
    });
}

/* ==========================================================================
   GESTIÓN DE AVATAR
   ========================================================================== */

/**
 * Descarta los cambios pendientes del avatar y restaura el estado guardado.
 * Revoca la URL de objeto local para liberar memoria.
 *
 * @returns {void}
 */
function discardPendingAvatar() {
    pendingAvatarFile   = null;
    pendingAvatarRemove = false;

    if (pendingAvatarPreviewUrl) {
        URL.revokeObjectURL(pendingAvatarPreviewUrl);
        pendingAvatarPreviewUrl = null;
    }

    const input = document.getElementById('profile-avatar-input');
    if (input) input.value = '';

    const errorEl = document.getElementById('profile-avatar-error');
    toggleError(errorEl, '');

    // Restaurar la vista previa al avatar realmente guardado
    const preview   = document.getElementById('profile-avatar-preview');
    const deleteBtn = document.getElementById('profile-avatar-delete-btn');
    if (!preview) return;

    const user = getCachedUser();
    if (user && user.avatar_url) {
        preview.style.setProperty('--avatar-url', `url('${user.avatar_url}')`);
        preview.textContent = '';
        if (deleteBtn) deleteBtn.hidden = false;
    } else {
        preview.style.removeProperty('--avatar-url');
        if (user && user.nombre) {
            const parts = user.nombre.trim().split(' ');
            preview.textContent = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
        }
        if (deleteBtn) deleteBtn.hidden = true;
    }
}

/**
 * Maneja el cambio de archivo del input de avatar.
 * Valida el tipo MIME y el tamaño máximo (4 MB) antes de generar la preview.
 *
 * @param {Event} e - Evento change del input file.
 * @returns {void}
 */
function handleAvatarFileChange(e) {
    const file    = e.target.files[0];
    const errorEl = document.getElementById('profile-avatar-error');
    toggleError(errorEl, '');

    if (!file) return;

    // Validación de tipo MIME
    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
        toggleError(errorEl, 'Solo se permiten imágenes PNG o JPG.');
        e.target.value = '';
        return;
    }

    // Bug Fix: Validación de tamaño máximo (4 MB) — ausente en el código original
    if (file.size > 4 * 1024 * 1024) {
        toggleError(errorEl, 'La imagen es muy grande. El tamaño máximo permitido es 4 MB.');
        e.target.value = '';
        return;
    }

    if (pendingAvatarPreviewUrl) {
        URL.revokeObjectURL(pendingAvatarPreviewUrl);
    }

    pendingAvatarFile       = file;
    pendingAvatarPreviewUrl = URL.createObjectURL(file);
    pendingAvatarRemove     = false;

    const preview = document.getElementById('profile-avatar-preview');
    if (preview) {
        preview.style.setProperty('--avatar-url', `url('${pendingAvatarPreviewUrl}')`);
        preview.textContent = '';
    }

    const deleteBtn = document.getElementById('profile-avatar-delete-btn');
    if (deleteBtn) deleteBtn.hidden = false;
}

/**
 * Maneja la eliminación del avatar. Marca el estado como "pendiente de borrado"
 * y actualiza la previsualización con las iniciales del nombre actual.
 *
 * @returns {void}
 */
function handleAvatarDelete() {
    if (pendingAvatarPreviewUrl) {
        URL.revokeObjectURL(pendingAvatarPreviewUrl);
        pendingAvatarPreviewUrl = null;
    }
    pendingAvatarFile   = null;
    pendingAvatarRemove = true;

    const input = document.getElementById('profile-avatar-input');
    if (input) input.value = '';

    const errorEl = document.getElementById('profile-avatar-error');
    toggleError(errorEl, '');

    const preview = document.getElementById('profile-avatar-preview');
    const nombre  = document.getElementById('profile-nombre')?.value || '';
    const parts   = nombre.trim().split(' ');
    if (preview) {
        preview.style.removeProperty('--avatar-url');
        preview.textContent = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    }

    const deleteBtn = document.getElementById('profile-avatar-delete-btn');
    if (deleteBtn) deleteBtn.hidden = true;
}

/* ==========================================================================
   GESTIÓN DE FONDO DE PANTALLA
   ========================================================================== */

/**
 * Descarta los cambios pendientes del fondo y restaura el estado guardado.
 *
 * @returns {void}
 */
function discardPendingBg() {
    pendingBgFile   = null;
    pendingBgRemove = false;

    if (pendingBgPreviewUrl) {
        URL.revokeObjectURL(pendingBgPreviewUrl);
        pendingBgPreviewUrl = null;
    }

    const input = document.getElementById('profile-bg-input');
    if (input) input.value = '';

    const errorEl = document.getElementById('profile-bg-error');
    toggleError(errorEl, '');
}

/**
 * Actualiza la visibilidad de los controles de personalización del fondo
 * (sliders de opacidad y blur, zona de subida de imagen propia) según el
 * preset seleccionado, y aplica la previsualización en tiempo real.
 *
 * @param {string}  preset        - Valor del preset seleccionado.
 * @param {boolean} [updatePreview=true] - Si debe actualizar el fondo del DOM.
 * @returns {void}
 */
function handleBgPresetChange(preset, updatePreview = true) {
    const opacityContainer = document.getElementById('profile-bg-opacity-container');
    const blurContainer    = document.getElementById('profile-bg-blur-container');
    const uploadContainer  = document.getElementById('profile-bg-upload-container');

    if (preset === 'none') {
        if (opacityContainer) opacityContainer.hidden = true;
        if (blurContainer)    blurContainer.hidden    = true;
        if (uploadContainer)  uploadContainer.hidden  = true;
    } else {
        if (opacityContainer) opacityContainer.hidden = false;
        if (blurContainer)    blurContainer.hidden    = false;
        if (uploadContainer)  uploadContainer.hidden  = (preset !== 'custom');
    }

    if (!updatePreview) return;

    const bgEl = document.getElementById('js-dashboard-bg');
    if (!bgEl) return;

    if (preset === 'custom') {
        if (pendingBgPreviewUrl) {
            bgEl.style.setProperty('--bg-url', `url('${pendingBgPreviewUrl}')`);
        } else {
            const user = getCachedUser();
            if (user && user.bg_custom_url) {
                bgEl.style.setProperty('--bg-url', `url('${user.bg_custom_url}')`);
            } else {
                bgEl.style.setProperty('--bg-url', 'none');
            }
        }
    } else {
        bgEl.style.setProperty('--bg-url', PRESETS_MAP[preset] || PRESETS_MAP['utn-haedo']);
    }
}

/**
 * Actualiza en tiempo real el valor de opacidad del fondo en el DOM.
 *
 * @param {number|string} opacity - Valor de opacidad de 0 a 100.
 * @returns {void}
 */
function handleBgOpacityInput(opacity) {
    const valEl = document.getElementById('profile-bg-opacity-value');
    if (valEl) valEl.textContent = opacity + '%';

    const bgEl = document.getElementById('js-dashboard-bg');
    if (bgEl) bgEl.style.setProperty('--bg-opacity', opacity / 100);
}

/**
 * Actualiza en tiempo real el valor de blur del fondo en el DOM.
 *
 * @param {number|string} blur - Valor de blur en píxeles.
 * @returns {void}
 */
function handleBgBlurInput(blur) {
    const valEl = document.getElementById('profile-bg-blur-value');
    if (valEl) valEl.textContent = parseFloat(blur).toFixed(1) + 'px';

    const bgEl = document.getElementById('js-dashboard-bg');
    if (bgEl) bgEl.style.setProperty('--bg-blur', blur + 'px');
}

/**
 * Maneja el cambio de archivo del input de fondo de pantalla.
 * Valida tipo MIME y tamaño máximo (4 MB).
 *
 * @param {Event} e - Evento change del input file.
 * @returns {void}
 */
function handleBgFileChange(e) {
    const file    = e.target.files[0];
    const errorEl = document.getElementById('profile-bg-error');
    toggleError(errorEl, '');

    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
        toggleError(errorEl, 'Solo se permiten imágenes PNG o JPG.');
        e.target.value = '';
        return;
    }

    if (file.size > 4 * 1024 * 1024) {
        toggleError(errorEl, 'La imagen es muy grande. El tamaño máximo permitido es 4 MB.');
        e.target.value = '';
        return;
    }

    if (pendingBgPreviewUrl) {
        URL.revokeObjectURL(pendingBgPreviewUrl);
    }

    pendingBgFile       = file;
    pendingBgPreviewUrl = URL.createObjectURL(file);
    pendingBgRemove     = false;

    const bgEl = document.getElementById('js-dashboard-bg');
    if (bgEl) bgEl.style.setProperty('--bg-url', `url('${pendingBgPreviewUrl}')`);

    const deleteBtn = document.getElementById('profile-bg-delete-btn');
    if (deleteBtn) deleteBtn.hidden = false;
}

/**
 * Maneja la eliminación del fondo personalizado.
 * Marca el estado pendiente y limpia la previsualización.
 *
 * @returns {void}
 */
function handleBgDelete() {
    if (pendingBgPreviewUrl) {
        URL.revokeObjectURL(pendingBgPreviewUrl);
        pendingBgPreviewUrl = null;
    }
    pendingBgFile   = null;
    pendingBgRemove = true;

    const input = document.getElementById('profile-bg-input');
    if (input) input.value = '';

    const errorEl = document.getElementById('profile-bg-error');
    toggleError(errorEl, '');

    const bgEl = document.getElementById('js-dashboard-bg');
    if (bgEl) bgEl.style.setProperty('--bg-url', 'none');

    const deleteBtn = document.getElementById('profile-bg-delete-btn');
    if (deleteBtn) deleteBtn.hidden = true;
}

/* ==========================================================================
   MODAL DE PERFIL
   ========================================================================== */

/**
 * Abre el modal de edición de perfil.
 * Pre-rellena los campos con los datos del usuario en caché y ajusta la
 * visibilidad de los controles de fondo según el preset guardado.
 *
 * @returns {void}
 */
export function openProfileModal() {
    closeProfileMenu();
    clearProfileFormErrors();

    const user = getCachedUser();
    if (user) {
        const nombreInput  = document.getElementById('profile-nombre');
        const legajoInput  = document.getElementById('profile-legajo');
        const emailInput   = document.getElementById('profile-email');
        const presetSelect = document.getElementById('profile-bg-preset');
        const opacityInput = document.getElementById('profile-bg-opacity');
        const blurInput    = document.getElementById('profile-bg-blur');

        if (nombreInput) nombreInput.value = user.nombre || '';
        if (legajoInput) legajoInput.value = user.legajo || '';
        if (emailInput)  emailInput.value  = user.email  || '';

        const presetVal  = user.bg_preset  || 'utn-haedo';
        const opacityVal = user.bg_opacity !== undefined ? user.bg_opacity : 10;
        const blurVal    = user.bg_blur    !== undefined ? user.bg_blur    : 1.8;

        if (presetSelect) presetSelect.value = presetVal;

        if (opacityInput) {
            opacityInput.value = opacityVal;
            const valEl = document.getElementById('profile-bg-opacity-value');
            if (valEl) valEl.textContent = opacityVal + '%';
        }

        if (blurInput) {
            blurInput.value = blurVal;
            const valEl = document.getElementById('profile-bg-blur-value');
            if (valEl) valEl.textContent = parseFloat(blurVal).toFixed(1) + 'px';
        }

        const deleteBgBtn = document.getElementById('profile-bg-delete-btn');
        if (deleteBgBtn) deleteBgBtn.hidden = !user.bg_custom_url;

        handleBgPresetChange(presetVal, false);
    }

    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'profile-edit-modal' } }));
}

/**
 * Cierra el modal de perfil descartando todos los cambios pendientes y
 * restaurando el fondo al estado guardado en la base de datos.
 *
 * @returns {void}
 */
function closeProfileModal() {
    discardPendingAvatar();
    discardPendingBg();
    document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'profile-edit-modal' } }));

    // Restaurar el fondo guardado en BD si el usuario canceló cambios pendientes
    const user = getCachedUser();
    if (user) applyUserToDOM(user);
}

/**
 * Maneja el envío del formulario de perfil.
 *
 * Estrategia de guardado multi-paso:
 * 1. PUT /api/profile con los datos personales y de personalización.
 * 2. Si hay avatar pendiente: POST /api/profile/avatar (o DELETE si se eliminó).
 * 3. Si hay fondo pendiente:  POST /api/profile/background (o DELETE si se eliminó).
 *
 * Bug Fix: si el paso 1 tiene éxito pero el paso 2 o 3 falla, los datos base
 * ya fueron guardados en el servidor. La UI refleja el estado real del servidor
 * y notifica el error de imagen de forma aislada con un Toast, evitando que
 * el usuario crea que ningún dato se guardó.
 *
 * @param {SubmitEvent} e - Evento de submit del formulario.
 * @returns {Promise<void>}
 */
async function handleProfileSubmit(e) {
    e.preventDefault();
    clearProfileFormErrors();

    const nombre     = document.getElementById('profile-nombre').value.trim();
    const legajo     = document.getElementById('profile-legajo').value.trim();
    const email      = document.getElementById('profile-email').value.trim();
    const bg_preset  = document.getElementById('profile-bg-preset').value;
    const bg_opacity = parseInt(document.getElementById('profile-bg-opacity').value, 10);
    const bg_blur    = parseFloat(document.getElementById('profile-bg-blur').value);

    const btn = document.getElementById('profile-submit-btn');
    setButtonState(btn, 'loading', 'Guardando...');

    try {
        // PASO 1: Actualizar datos personales y configuración
        const { response, data } = await updateProfile({
            nombre,
            legajo: legajo || null,
            email,
            bg_preset,
            bg_opacity,
            bg_blur,
        });

        if (!response.ok) {
            displayFormErrors(data?.errors, 'profile');
            setButtonState(btn, 'reset');
            return;
        }

        let finalData = data;

        // PASO 2: Avatar pendiente (Bug Fix: errores aislados del guardado base)
        if (pendingAvatarFile) {
            try {
                const { response: avRes, data: avData } = await uploadAvatar(pendingAvatarFile);
                if (!avRes.ok) {
                    const errorEl = document.getElementById('profile-avatar-error');
                    toggleError(errorEl, avData?.errors?.avatar?.[0] || avData?.message || 'No se pudo actualizar la foto.');
                    if (typeof window.showToast === 'function') {
                        window.showToast('Los datos se guardaron, pero la foto no se pudo actualizar.', 'warn');
                    }
                } else {
                    finalData = avData;
                }
            } finally {
                pendingAvatarFile = null;
                if (pendingAvatarPreviewUrl) {
                    URL.revokeObjectURL(pendingAvatarPreviewUrl);
                    pendingAvatarPreviewUrl = null;
                }
            }
        } else if (pendingAvatarRemove) {
            try {
                const { response: avRes, data: avData } = await deleteAvatar();
                if (avRes.ok) finalData = avData;
            } finally {
                pendingAvatarRemove = false;
            }
        }

        // PASO 3: Fondo pendiente (Bug Fix: errores aislados del guardado base)
        if (bg_preset === 'custom' && pendingBgFile) {
            try {
                const { response: bgRes, data: bgData } = await uploadBackground(pendingBgFile);
                if (!bgRes.ok) {
                    const errorEl = document.getElementById('profile-bg-error');
                    toggleError(errorEl, bgData?.errors?.background?.[0] || bgData?.message || 'No se pudo actualizar el fondo.');
                    if (typeof window.showToast === 'function') {
                        window.showToast('Los datos se guardaron, pero el fondo no se pudo actualizar.', 'warn');
                    }
                } else {
                    finalData = bgData;
                }
            } finally {
                pendingBgFile = null;
                if (pendingBgPreviewUrl) {
                    URL.revokeObjectURL(pendingBgPreviewUrl);
                    pendingBgPreviewUrl = null;
                }
            }
        } else if (pendingBgRemove || (bg_preset !== 'custom' && pendingBgFile)) {
            try {
                const { response: bgRes, data: bgData } = await deleteBackground();
                if (bgRes.ok) finalData = bgData;
            } finally {
                pendingBgRemove = false;
                pendingBgFile   = null;
            }
        }

        // Persistir y aplicar al DOM
        saveUser(finalData);
        applyUserToDOM(finalData);

        setButtonState(btn, 'success', '✓ Guardado');
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'profile-edit-modal' } }));
            setButtonState(btn, 'reset');
        }, 900);

    } catch (error) {
        console.error('[profile-modal] No se pudo actualizar el perfil:', error);
        if (typeof window.showToast === 'function') {
            window.showToast('Error al guardar el perfil. Intentá de nuevo.', 'error');
        }
        setButtonState(btn, 'reset');
    }
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Botón "Perfil" del menú
    const openProfileBtn = document.querySelector('[data-js="open-profile-modal"]');
    if (openProfileBtn) openProfileBtn.addEventListener('click', openProfileModal);

    // Botón cancelar del modal de perfil
    // (el sistema de modales gestiona data-js="modal-close", pero necesitamos
    // descartar los pendientes antes de que se cierre)
    document.addEventListener('modal:before-close', function (e) {
        if (e.detail?.id === 'profile-edit-modal') {
            discardPendingAvatar();
            discardPendingBg();
            const user = getCachedUser();
            if (user) applyUserToDOM(user);
        }
    });

    // Botón "Cambiar contraseña" dentro del modal de perfil
    const openCpBtn = document.querySelector('[data-js="open-change-password"]');
    if (openCpBtn) openCpBtn.addEventListener('click', openChangePasswordModal);

    // Avatar: botón lápiz → dispara el input file oculto
    const avatarPencil = document.querySelector('[data-js="avatar-pencil"]');
    const avatarInput  = document.getElementById('profile-avatar-input');
    if (avatarPencil && avatarInput) {
        avatarPencil.addEventListener('click', () => avatarInput.click());
    }
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarFileChange);
    }

    // Avatar: botón eliminar
    const avatarDeleteBtn = document.querySelector('[data-js="avatar-delete"]');
    if (avatarDeleteBtn) avatarDeleteBtn.addEventListener('click', handleAvatarDelete);

    // Fondo: selector de preset
    const bgPresetSelect = document.getElementById('profile-bg-preset');
    if (bgPresetSelect) {
        bgPresetSelect.addEventListener('change', function () {
            handleBgPresetChange(this.value);
        });
    }

    // Fondo: botón seleccionar imagen → dispara el input file oculto
    const bgSelectBtn = document.querySelector('[data-js="bg-select-btn"]');
    const bgInput     = document.getElementById('profile-bg-input');
    if (bgSelectBtn && bgInput) {
        bgSelectBtn.addEventListener('click', () => bgInput.click());
    }
    if (bgInput) {
        bgInput.addEventListener('change', handleBgFileChange);
    }

    // Fondo: botón eliminar imagen
    const bgDeleteBtn = document.querySelector('[data-js="bg-delete"]');
    if (bgDeleteBtn) bgDeleteBtn.addEventListener('click', handleBgDelete);

    // Sliders de opacidad y blur
    const opacityRange = document.querySelector('[data-js="bg-opacity-range"]');
    if (opacityRange) {
        opacityRange.addEventListener('input', function () {
            handleBgOpacityInput(this.value);
        });
    }

    const blurRange = document.querySelector('[data-js="bg-blur-range"]');
    if (blurRange) {
        blurRange.addEventListener('input', function () {
            handleBgBlurInput(this.value);
        });
    }

    // Submit del formulario de perfil
    document.addEventListener('submit', function (e) {
        if (e.target.id === 'profile-edit-form') {
            handleProfileSubmit(e);
        }
    });
});
