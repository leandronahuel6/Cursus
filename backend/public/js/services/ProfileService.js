/**
 * @fileoverview Servicio de Perfil de Usuario — ProfileService.
 *
 * Abstrae todas las operaciones HTTP relacionadas con el perfil del usuario
 * autenticado: datos personales, avatar, fondo de pantalla, contraseña
 * y mensajes de contacto.
 *
 * Principio de Responsabilidad Única: este módulo SÓLO conoce los endpoints
 * de la API de perfil. Ninguna función puede manipular el DOM ni emitir
 * eventos de UI. Retorna los datos crudos o lanza el error para que la capa
 * de UI aplique el rollback visual correspondiente.
 *
 * @module ProfileService
 */

'use strict';

import { getStoredToken } from './AuthService.js';

/* ==========================================================================
   INFRAESTRUCTURA INTERNA
   ========================================================================== */

/**
 * Wrapper autenticado para fetch.
 * Centraliza el token, los headers y el manejo de JSON vs FormData.
 * No inyecta Content-Type cuando el body es FormData: el browser lo gestiona.
 *
 * @param {string}      endpoint - URL relativa del endpoint.
 * @param {RequestInit} [options={}] - Opciones estándar de fetch.
 * @returns {Promise<{ response: Response, data: any }>} Respuesta cruda y
 *          datos parseados (null si el body está vacío, como en 204).
 * @throws {Error} Si no hay token disponible en el storage activo.
 */
async function apiFetch(endpoint, options = {}) {
    const token = getStoredToken();
    if (!token) {
        throw new Error('no-token');
    }

    const defaultHeaders = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token,
    };

    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(endpoint, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) },
    });

    let data = null;
    const text = await response.text().catch(() => '');
    if (text) {
        try {
            data = JSON.parse(text);
        } catch (_) {
            // El servidor devolvió un cuerpo no-JSON (ej. HTML de error 500).
            // Se registra en consola y se deja data = null para que el llamador
            // maneje el estado de error sin una excepción inesperada.
            console.warn(`[ProfileService] Respuesta no-JSON en ${endpoint}:`, text.substring(0, 200));
        }
    }

    return { response, data };
}

/* ==========================================================================
   PERFIL (DATOS PERSONALES)
   ========================================================================== */

/**
 * Actualiza los datos personales del perfil del usuario autenticado.
 *
 * @param {{ nombre: string, legajo: string|null, email: string, bg_preset: string, bg_opacity: number, bg_blur: number }} profileData
 *   Datos del formulario de perfil.
 * @returns {Promise<{ response: Response, data: Object }>}
 */
export function updateProfile(profileData) {
    return apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
}

/* ==========================================================================
   AVATAR
   ========================================================================== */

/**
 * Sube un nuevo archivo de avatar para el usuario autenticado.
 *
 * @param {File} file - El archivo de imagen a subir (PNG o JPEG, máx. 4 MB).
 * @returns {Promise<{ response: Response, data: Object }>}
 */
export function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiFetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
    });
}

/**
 * Elimina el avatar del usuario autenticado en el servidor.
 *
 * @returns {Promise<{ response: Response, data: Object }>}
 */
export function deleteAvatar() {
    return apiFetch('/api/profile/avatar', { method: 'DELETE' });
}

/* ==========================================================================
   FONDO DE PANTALLA PERSONALIZADO
   ========================================================================== */

/**
 * Sube un nuevo archivo de fondo de pantalla para el usuario autenticado.
 *
 * @param {File} file - El archivo de imagen a subir (PNG o JPEG, máx. 4 MB).
 * @returns {Promise<{ response: Response, data: Object }>}
 */
export function uploadBackground(file) {
    const formData = new FormData();
    formData.append('background', file);

    return apiFetch('/api/profile/background', {
        method: 'POST',
        body: formData,
    });
}

/**
 * Elimina el fondo de pantalla personalizado del usuario en el servidor.
 *
 * @returns {Promise<{ response: Response, data: Object }>}
 */
export function deleteBackground() {
    return apiFetch('/api/profile/background', { method: 'DELETE' });
}

/* ==========================================================================
   CONTRASEÑA
   ========================================================================== */

/**
 * Envía una solicitud de cambio de contraseña al servidor.
 *
 * @param {string} currentPassword    - Contraseña actual del usuario.
 * @param {string} newPassword        - Nueva contraseña deseada.
 * @param {string} passwordConfirmation - Confirmación de la nueva contraseña.
 * @returns {Promise<{ response: Response, data: Object }>}
 */
export function changePassword(currentPassword, newPassword, passwordConfirmation) {
    return apiFetch('/api/change-password', {
        method: 'PUT',
        body: JSON.stringify({
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: passwordConfirmation,
        }),
    });
}

/* ==========================================================================
   CONTACTO
   ========================================================================== */

/**
 * Envía un mensaje de contacto/feedback al equipo de soporte.
 *
 * @param {{ tipo: string, asunto: string, descripcion: string, remitente_nombre: string, remitente_email: string }} contactData
 *   Datos del formulario de contacto.
 * @returns {Promise<{ response: Response, data: Object }>}
 */
export function sendContactMessage(contactData) {
    return apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(contactData),
    });
}

/* ==========================================================================
   ALERTAS
   ========================================================================== */

/**
 * Obtiene la lista de alertas del usuario autenticado desde la API.
 * Utilizada por el módulo alerts-badge.js para el contador de la navegación.
 *
 * @returns {Promise<{ response: Response, data: Array }>}
 */
export function fetchAlertas() {
    return apiFetch('/api/alertas');
}
