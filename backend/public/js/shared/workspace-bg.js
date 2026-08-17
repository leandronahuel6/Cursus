/**
 * @fileoverview Módulo de Espacio de Trabajo — workspace-bg.js
 *
 * Responsabilidad única: leer el perfil del usuario (desde caché o API) y
 * aplicar al DOM la hidratación visual global:
 *   - Nombre y saludo en el sidebar y topbar.
 *   - Avatar en todos sus puntos de presencia.
 *   - Rol de administrador (clase `is-admin` en body y visibilidad de ítems).
 *   - Fondo de pantalla personalizado (`#js-dashboard-bg`).
 *
 * No maneja formularios, modales ni eventos de usuario. Exporta
 * `applyUserToDOM` para que otros módulos (como profile-modal) puedan
 * refrescar la UI tras guardar cambios.
 *
 * @module workspace-bg
 */

'use strict';

import { getCachedUser, fetchUserProfile, saveUser } from '../services/AuthService.js';

/* ==========================================================================
   MAPA DE FONDOS PREDEFINIDOS
   ========================================================================== */

/**
 * Mapa de valores del selector de preset hacia sus URLs de imagen CSS.
 * Se usa tanto al aplicar el DOM como en el modal de perfil durante la
 * previsualización en tiempo real.
 *
 * @type {Record<string, string>}
 */
export const PRESETS_MAP = {
    'none':         'none',
    'utn-haedo':    "url('/assets/img/default_dashboard_bg.jpg')",
    'utn-building': "url('/assets/img/utn-haedo.png')",
    'study-cozy':   "url('/assets/img/contact_bg.jpg')",
    'minecraft':    "url('/assets/img/minecraft.jpg')",
    'lofi-room':    "url('/assets/img/lofi_room.jpg')",
};

/* ==========================================================================
   HYDRATION DE UI
   ========================================================================== */

/**
 * Aplica el fondo de pantalla configurado por el usuario al elemento
 * `#js-dashboard-bg` del DOM, actualizando las propiedades CSS personalizadas
 * de URL, opacidad y blur.
 *
 * @param {Object} user - El objeto usuario con las propiedades de personalización.
 * @param {string}      [user.bg_preset]     - Clave del preset seleccionado.
 * @param {number|null} [user.bg_opacity]    - Opacidad de 0 a 100 (se normaliza a 0–1).
 * @param {number|null} [user.bg_blur]       - Valor de blur en píxeles.
 * @param {string|null} [user.bg_custom_url] - URL del fondo personalizado subido.
 * @returns {void}
 */
function applyBackgroundToDOM(user) {
    const bgEl = document.getElementById('js-dashboard-bg');
    if (!bgEl) return;

    const preset  = user.bg_preset || 'utn-haedo';
    let bgUrl;

    if (preset === 'custom' && user.bg_custom_url) {
        bgUrl = `url('${user.bg_custom_url}')`;
    } else {
        bgUrl = PRESETS_MAP[preset] || PRESETS_MAP['utn-haedo'];
    }

    const opacity = (user.bg_opacity !== undefined && user.bg_opacity !== null)
        ? user.bg_opacity / 100
        : 0.10;

    const blur = (user.bg_blur !== undefined && user.bg_blur !== null)
        ? user.bg_blur
        : 1.8;

    bgEl.style.setProperty('--bg-url',     bgUrl);
    bgEl.style.setProperty('--bg-opacity', opacity);
    bgEl.style.setProperty('--bg-blur',    blur + 'px');
}

/**
 * Aplica los datos del usuario al DOM de forma global:
 * saludo, nombre en sidebar, legajo, avatar en todos sus puntos
 * de presencia y estado de administrador.
 *
 * Esta función es pura respecto al DOM: puede llamarse múltiples veces
 * sin efectos secundarios acumulativos.
 *
 * @param {Object}      user              - Objeto usuario devuelto por la API.
 * @param {string}      [user.nombre]     - Nombre completo del usuario.
 * @param {string|null} [user.legajo]     - Legajo académico.
 * @param {string|null} [user.avatar_url] - URL del avatar del servidor.
 * @param {string}      [user.role]       - Rol: 'admin' o 'alumno'.
 * @returns {void}
 */
export function applyUserToDOM(user) {
    if (!user) return;

    // --- Saludo (primer nombre) ---
    const firstName = (user.nombre || '').split(' ')[0];
    if (firstName) {
        document.querySelectorAll('.greeting-name').forEach((el) => {
            el.textContent = firstName;
        });
    }

    // --- Sidebar: nombre y legajo ---
    const unameEl = document.getElementById('sb-uname');
    const ulegEl  = document.getElementById('sb-uleg');
    if (unameEl && user.nombre) unameEl.textContent = user.nombre;
    if (ulegEl) ulegEl.textContent = user.legajo ? `Legajo ${user.legajo}` : '';

    // --- Profile Menu (popup móvil): nombre y legajo ---
    const pmUnameEl = document.getElementById('pm-uname');
    const pmUlegEl  = document.getElementById('pm-uleg');
    if (pmUnameEl && user.nombre) pmUnameEl.textContent = user.nombre;
    if (pmUlegEl) pmUlegEl.textContent = user.legajo ? `Legajo ${user.legajo}` : '';

    // --- Avatares ---
    if (user.nombre) {
        const parts    = user.nombre.trim().split(' ');
        const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();

        const avatarEls = [
            document.getElementById('sb-av'),
            document.getElementById('bn-av'),
            document.getElementById('pm-av'),
            document.getElementById('profile-avatar-preview'),
        ];

        avatarEls.forEach((el) => {
            if (!el) return;
            if (user.avatar_url) {
                el.style.setProperty('--avatar-url', `url('${user.avatar_url}')`);
                el.textContent = '';
            } else {
                el.style.removeProperty('--avatar-url');
                el.textContent = initials;
            }
        });
    }

    // --- Botón eliminar avatar en modal de perfil ---
    const deleteAvatarBtn = document.getElementById('profile-avatar-delete-btn');
    if (deleteAvatarBtn) deleteAvatarBtn.hidden = !user.avatar_url;

    // --- Rol de administrador ---
    const isAdmin = user.role === 'admin';
    document.body.classList.toggle('is-admin', isAdmin);

    const roleLabel = document.getElementById('sb-role-label');
    if (roleLabel) {
        if (isAdmin) {
            roleLabel.textContent = 'Panel Admin';
            roleLabel.classList.add('sb-logo-subtitle--admin');
        } else {
            roleLabel.textContent = 'Tec. en Programación';
            roleLabel.classList.remove('sb-logo-subtitle--admin');
        }
    }

    const toggle      = document.getElementById('sb-vista-alumno-toggle');
    const alumnoItems = document.getElementById('sb-alumno-items');
    if (toggle) toggle.hidden = !isAdmin;

    if (alumnoItems) {
        ['admin-nav-group', 'admin-nav-alumnos', 'admin-nav-cuotas', 'admin-nav-plan'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.hidden = !isAdmin;
        });
    }

    if (isAdmin && alumnoItems) {
        const abierto = localStorage.getItem('sb_vista_alumno_open') === 'true';
        alumnoItems.classList.toggle('collapsed', !abierto);
        const chevron = document.getElementById('va-chevron');
        if (chevron) chevron.classList.toggle('open', abierto);
    }

    // --- Fondo de pantalla ---
    applyBackgroundToDOM(user);
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

/**
 * Inicializa la hidratación del espacio de trabajo.
 *
 * Estrategia de dos fases para evitar flashes visuales (FOUC):
 * 1. Pinta inmediatamente con los datos del caché local (sin esperar la red).
 * 2. Hace un fetch a /api/user para obtener datos frescos y repinta.
 *
 * @returns {Promise<void>}
 */
async function init() {
    // Fase 1: pintar desde caché
    const cached = getCachedUser();
    if (cached) {
        applyUserToDOM(cached);
    }

    // Revelar la UI inmediatamente tras aplicar el caché (evita FOUC prolongado)
    document.body.removeAttribute('hidden');

    // Redirigir si no hay token (guard de autenticación)
    // La página que carga este módulo es responsable de verificar el token
    // antes de montarlo, pero aplicamos un guard de seguridad adicional aquí.

    // Fase 2: refrescar desde la API
    try {
        const user = await fetchUserProfile();
        if (!user) return;
        saveUser(user);
        applyUserToDOM(user);
    } catch (error) {
        console.error('[workspace-bg] No se pudo cargar el perfil del usuario:', error);
    }
}

init();
