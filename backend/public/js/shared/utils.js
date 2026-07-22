/**
 * @fileoverview Utilidades compartidas para toda la aplicación Cursus.
 * Funciones de formato de fecha, cálculo de alertas, debounce/throttle
 * y helpers de string. Se exportan como módulo y se exponen en
 * `window.CursusUtils` para compatibilidad legacy.
 * @module shared/utils
 */

'use strict';

// ── Date Formatting ─────────────────────────────────────────────────────────

export function todayDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateStr(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getDaysDifference(alertDateStr) {
  const today = new Date();
  const alertDate = new Date(alertDateStr + 'T00:00:00');
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dAlert = new Date(alertDate.getFullYear(), alertDate.getMonth(), alertDate.getDate());
  const diffTime = dAlert - dToday;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDateForDisplay(date) {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// ── Alert Calculation Helpers ───────────────────────────────────────────────

export const CATEGORY_DEFAULT_COLOR = {
  academic: '#2563eb',
  administrative: '#f97316',
  personal: '#10b981'
};

export const ALERT_COLOR_PALETTE = [
  '#2563eb',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6'
];

export function resolveAlertColor(alerta) {
  return alerta.color || CATEGORY_DEFAULT_COLOR[alerta.categoria] || '#2563eb';
}

export function categoriaIcon(categoria) {
  if (categoria === 'academic') return '📝';
  if (categoria === 'administrative') return '💼';
  if (categoria === 'personal') return '🎯';
  return '📌';
}

export function getAlertDateText(diffDays, fecha) {
  if (diffDays < 0) {
    return { text: `Vencido hace ${Math.abs(diffDays)} días`, cls: 'style="color: var(--red); font-weight: 600;"' };
  } else if (diffDays === 0) {
    return { text: 'Vence hoy 📅', cls: 'style="color: var(--red); font-weight: 600;"' };
  } else if (diffDays === 1) {
    return { text: 'Vence mañana ⏰', cls: 'style="color: var(--orange); font-weight: 600;"' };
  }
  return { text: `En ${diffDays} días (${formatDateStr(fecha)})`, cls: 'style="color: var(--t2);"' };
}

// ── Debounce / Throttle ─────────────────────────────────────────────────────

export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    const context = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(context, args);
    }, delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle = false;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      fn.apply(context, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

// ── String Helpers ──────────────────────────────────────────────────────────

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str || '';
  return str.slice(0, maxLen) + '...';
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : (plural || singular + 's');
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.CursusUtils = {
  todayDateStr,
  formatDateStr,
  getDaysDifference,
  formatDateForDisplay,
  CATEGORY_DEFAULT_COLOR,
  ALERT_COLOR_PALETTE,
  resolveAlertColor,
  categoriaIcon,
  getAlertDateText,
  debounce,
  throttle,
  capitalize,
  truncate,
  pluralize
};
