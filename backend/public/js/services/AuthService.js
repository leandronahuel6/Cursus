/**
 * @fileoverview Servicio de Autenticación — AuthService.
 *
 * Centraliza la lectura/escritura del token y del objeto usuario en
 * localStorage / sessionStorage, el cierre de sesión y la hidratación
 * inicial del perfil desde la API.
 *
 * Principio de Responsabilidad Única: este módulo SÓLO conoce la capa de
 * almacenamiento y el endpoint /api/user. Ninguna función puede manipular
 * el DOM ni emitir eventos de UI.
 *
 * @module AuthService
 */

'use strict';

/* ==========================================================================
   ALMACENAMIENTO LOCAL
   ========================================================================== */

/**
 * Devuelve el token de sesión almacenado.
 * Busca primero en localStorage (sesión persistente "Recordarme") y luego
 * en sessionStorage (sesión de solo-pestaña).
 *
 * @returns {string|null} El token Bearer o null si no existe.
 */
export function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/**
 * Devuelve el objeto usuario serializado en JSON almacenado en caché.
 * Busca primero en localStorage y luego en sessionStorage.
 *
 * @returns {string|null} La cadena JSON del usuario o null si no existe.
 */
export function getStoredUser() {
    return localStorage.getItem('user') || sessionStorage.getItem('user');
}

/**
 * Determina el storage activo según dónde esté guardado el token.
 * Permite que la escritura del usuario siempre ocurra en el mismo
 * storage que el token, evitando desincronización entre ambas claves.
 *
 * @returns {Storage} localStorage si hay token allí, sessionStorage en caso contrario.
 */
export function getActiveStorage() {
    return localStorage.getItem('token') ? localStorage : sessionStorage;
}

/**
 * Elimina el token y el objeto usuario tanto de localStorage como de
 * sessionStorage, limpiando completamente la sesión del cliente.
 *
 * @returns {void}
 */
export function clearStoredSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
}

/* ==========================================================================
   AUTENTICACIÓN
   ========================================================================== */

/**
 * Cierra la sesión del usuario.
 *
 * Intenta invalidar el token en el servidor mediante POST /api/logout.
 * Si la llamada remota falla (sin conexión o error de servidor), la sesión
 * local se limpia de todas formas para garantizar que el usuario pueda
 * salir del sistema en cualquier circunstancia.
 *
 * @returns {Promise<void>}
 */
export async function handleLogout() {
    const token = getStoredToken();
    try {
        if (token) {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/json',
                },
            });
        }
    } catch (_) {
        // Si falla la llamada remota, se cierra la sesión local igualmente.
    } finally {
        clearStoredSession();
        window.location.href = '/login';
    }
}

/* ==========================================================================
   PERFIL DE USUARIO
   ========================================================================== */

/**
 * Obtiene el perfil del usuario autenticado desde la API.
 *
 * Utiliza los headers de autenticación construidos con el token almacenado
 * en el storage activo. Devuelve el objeto usuario crudo para que el
 * llamador decida cómo procesarlo.
 *
 * Lanza un error si no hay token disponible o si la respuesta del servidor
 * no es exitosa (status >= 400).
 *
 * @returns {Promise<Object>} El objeto usuario devuelto por /api/user.
 * @throws {Error} Si el token no existe o la respuesta HTTP no es correcta.
 */
export async function fetchUserProfile() {
    const token = getStoredToken();
    if (!token) {
        throw new Error('no-token');
    }

    const response = await fetch('/api/user', {
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} en /api/user`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

/**
 * Persiste el objeto usuario en el storage activo (el que contiene el token).
 *
 * @param {Object} user - El objeto usuario a serializar y guardar.
 * @returns {void}
 */
export function saveUser(user) {
    getActiveStorage().setItem('user', JSON.stringify(user));
}

/**
 * Parsea y devuelve el objeto usuario desde el caché local.
 * Si el caché está corrupto o ausente, devuelve null sin lanzar excepción.
 *
 * @returns {Object|null} El objeto usuario parseado o null.
 */
export function getCachedUser() {
    const raw = getStoredUser();
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (_) {
        return null;
    }
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Delegar el evento de cierre de sesión al botón del menú de perfil
    const logoutBtn = document.querySelector('[data-js="handle-logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
});

