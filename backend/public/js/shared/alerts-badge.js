/**
 * @fileoverview Módulo de Badge de Alertas — alerts-badge.js
 *
 * Actualiza el contador de alertas próximas (dentro de los próximos 7 días)
 * en los elementos de badge del sidebar y la barra de navegación inferior.
 *
 * Se inicializa automáticamente al cargar el DOM. No tiene dependencias de
 * estado global ni expone funciones al objeto `window`.
 *
 * @module alerts-badge
 */

'use strict';

import { fetchAlertas } from '../services/ProfileService.js';

/* ==========================================================================
   UTILIDADES PRIVADAS
   ========================================================================== */

/**
 * Calcula la cantidad de días entre hoy y una fecha dada.
 * Utiliza comparación a nivel de día (sin horas) para evitar
 * inconsistencias por diferencias de zona horaria.
 *
 * @param {string} fechaStr - Fecha en formato 'YYYY-MM-DD'.
 * @returns {number} Diferencia en días (positivo = en el futuro).
 */
function diasHastaAlerta(fechaStr) {
    const hoy = new Date();
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dHoy  = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const dFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    return Math.ceil((dFecha - dHoy) / (1000 * 60 * 60 * 24));
}

/* ==========================================================================
   BADGE
   ========================================================================== */

/**
 * Obtiene las alertas del usuario desde la API y actualiza el badge
 * numérico en el sidebar (`#nav-badge-count`) y en la barra inferior
 * móvil (`#bnav-badge-count`) con el conteo de alertas no completadas
 * cuya fecha de vencimiento es dentro de los próximos 7 días.
 *
 * Si ningún elemento badge existe en el DOM, la función retorna de
 * forma anticipada para no generar peticiones innecesarias.
 *
 * @returns {Promise<void>}
 */
async function updateAlertsBadge() {
    const navBadge  = document.getElementById('nav-badge-count');
    const bnavBadge = document.getElementById('bnav-badge-count');
    if (!navBadge && !bnavBadge) return;

    try {
        const { response, data: alertas } = await fetchAlertas();
        if (!response.ok || !Array.isArray(alertas)) return;

        const count = alertas.filter(
            (a) => !a.completada && diasHastaAlerta(a.fecha) <= 7
        ).length;

        if (navBadge)  navBadge.textContent  = count;
        if (bnavBadge) bnavBadge.textContent = count;
    } catch (error) {
        console.error('[alerts-badge] No se pudo cargar el contador de alertas:', error);
    }
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */

document.addEventListener('DOMContentLoaded', updateAlertsBadge);
