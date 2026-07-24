/**
 * @fileoverview Renderizado DOM para la página de Alertas y Vencimientos.
 * Funciones puras que reciben datos y construyen HTML o manipulan el DOM.
 * No realiza fetching de datos.
 * @module views/alertas/alertas-render
 */

'use strict';

import {
  formatDateStr,
  getDaysDifference,
  resolveAlertColor,
  categoriaIcon,
  getAlertDateText
} from '../../shared/utils.js';

import { formatPeriodoCuota } from './alertas-data.js';

// ── Badge de navegación ─────────────────────────────────────────────────────

/**
 * Actualiza los badges de conteo en la barra de navegación
 * con la cantidad de alertas que vencen en los próximos 7 días.
 * @param {Array} activeAlerts - Alertas activas (no completadas).
 */
export function renderNavBadge(activeAlerts) {
  const badgeCount = activeAlerts.filter(a => getDaysDifference(a.fecha) <= 7).length;
  const navBadge = document.getElementById('nav-badge-count');
  const bnavBadge = document.getElementById('bnav-badge-count');
  if (navBadge) navBadge.innerText = badgeCount;
  if (bnavBadge) bnavBadge.innerText = badgeCount;
}

// ── List View ───────────────────────────────────────────────────────────────

/**
 * Renderiza la vista de lista/agenda clasificando alertas en tres grupos:
 * urgentes (≤7 días), próximas (≤20 días) y más adelante.
 * @param {Array} activeAlerts - Alertas activas (no completadas).
 */
export function renderListView(activeAlerts) {
  const listUrgent = document.getElementById('list-urgent');
  const listSoon = document.getElementById('list-soon');
  const listLater = document.getElementById('list-later');

  listUrgent.innerHTML = '';
  listSoon.innerHTML = '';
  listLater.innerHTML = '';

  activeAlerts.forEach(alerta => {
    const diffDays = getDaysDifference(alerta.fecha);
    const card = createAlertCardHTML(alerta, diffDays);

    if (diffDays <= 7) {
      listUrgent.appendChild(card);
    } else if (diffDays <= 20) {
      listSoon.appendChild(card);
    } else {
      listLater.appendChild(card);
    }
  });

  checkGroupEmpty(listUrgent, 'No tienes alertas críticas para esta semana.');
  checkGroupEmpty(listSoon, 'No hay vencimientos programados a mediano plazo.');
  checkGroupEmpty(listLater, 'Sin vencimientos lejanos programados.');
}

/**
 * Muestra un mensaje vacío en un contenedor de grupo si no tiene hijos.
 * @param {HTMLElement} container - El contenedor del grupo.
 * @param {string} message - Mensaje a mostrar cuando está vacío.
 */
function checkGroupEmpty(container, message) {
  if (container.children.length === 0) {
    const empty = document.createElement('div');
    empty.style.fontSize = '12px';
    empty.style.color = 'var(--tm)';
    empty.style.fontStyle = 'italic';
    empty.style.padding = '8px 14px';
    empty.innerText = message;
    container.appendChild(empty);
  }
}

/**
 * Crea un elemento DOM con la tarjeta visual de una alerta.
 * @param {Object} alerta - Objeto de alerta con id, titulo, categoria, prioridad, fecha, color.
 * @param {number} diffDays - Días de diferencia desde hoy.
 * @returns {HTMLElement} El elemento div de la tarjeta.
 */
function createAlertCardHTML(alerta, diffDays) {
  const card = document.createElement('div');
  card.className = 'alert-item-card';

  const resolvedColor = resolveAlertColor(alerta);
  const dateInfo = getAlertDateText(diffDays, alerta.fecha);

  card.innerHTML = `
    <div class="alert-icon-wrap alert-icon-${alerta.categoria}">
      ${categoriaIcon(alerta.categoria)}
    </div>
    <div class="alert-item-info">
      <div class="alert-item-title">${alerta.titulo}</div>
      <div class="alert-item-desc">${alerta.descripcion || ''}</div>
      <div class="alert-item-meta">
        <span class="alert-color-chip" style="background: ${resolvedColor};" title="Color de la alerta"></span>
        <span class="alert-priority-badge alert-priority-${alerta.prioridad}">${alerta.prioridad}</span>
        <span class="alert-date-badge" ${dateInfo.cls}>
          ⏱️ ${dateInfo.text}
        </span>
      </div>
    </div>
    <div class="alert-item-actions">
      <button class="btn-alert-action btn-complete" title="Marcar como Completado" onclick="window.completeAlert(${alerta.id})">✓</button>
      <button class="btn-alert-action btn-delete" title="Eliminar Alerta" onclick="window.deleteAlert(${alerta.id})">✕</button>
    </div>
  `;
  return card;
}

// ── Cuota / Estado de Pago ──────────────────────────────────────────────────

/**
 * Renderiza el banner de estado de pago de la cuota del mes actual.
 * Adapta el color y el mensaje según urgencia y si ya está pagada.
 * @param {Object} estado - { pagado, fecha_pago, dias_para_vencimiento, periodo }.
 * @param {number|null} cuotaMontoVigente - Monto vigente de la cuota (puede ser null).
 */
export function renderEstadoPagoCuota(estado, cuotaMontoVigente = null) {
  const banner = document.getElementById('cuota-pago-alert');
  const bannerTitle = document.getElementById('cuota-pago-alert-title');
  const bannerText = document.getElementById('cuota-pago-alert-text');
  const info = document.getElementById('cuota-pago-info');
  const btnPagar = document.getElementById('btn-abrir-pago');

  if (estado.pagado) {
    banner.style.display = 'none';
    if (info) info.textContent = `✓ Cuota de este mes pagada el ${formatDateStr(estado.fecha_pago)}.`;
    if (btnPagar) { btnPagar.disabled = true; btnPagar.style.opacity = '0.6'; }
    return;
  }

  if (btnPagar) { btnPagar.disabled = false; btnPagar.style.opacity = '1'; }
  if (info) info.textContent = 'Todavía no registraste el pago de este mes.';

  const dias = estado.dias_para_vencimiento;
  const urgente = dias <= 3; // vencido o a 3 días o menos del límite (día 15)

  banner.style.display = 'flex';
  banner.style.background = urgente ? '#fef2f2' : '#fff7ed';
  banner.style.borderColor = urgente ? '#fecaca' : '#fcd9a0';
  banner.style.borderLeftColor = urgente ? 'var(--red)' : '#f97316';
  bannerTitle.textContent = urgente ? '⚠️ ¡Atención!' : 'Alerta de pago:';
  bannerTitle.style.color = urgente ? 'var(--red)' : '#92400e';

  const dot = document.getElementById('cuota-pago-alert-dot');
  if (dot) dot.style.background = urgente ? 'var(--red)' : '#f97316';

  // Mensaje con recargo calculado si hay monto vigente disponible
  if (cuotaMontoVigente != null) {
    const montoConRecargo = (cuotaMontoVigente * 1.10).toLocaleString('es-AR', { minimumFractionDigits: 2 });
    bannerText.textContent = `Recordá que si el pago es luego del día 15 se debe pagar un 10% de recargo: $${montoConRecargo}.`;
  } else {
    bannerText.textContent = `Recordá que si el pago es luego del día 15 se debe pagar un 10% de recargo.`;
  }
}

/**
 * Renderiza el campo de monto vigente de cuota y el aviso de próxima cuota.
 * @param {Object} data - Respuesta de GET /api/cuotas { valor_mensual, cuota_proxima }.
 */
export function renderCuotaRecordatorio(data) {
  const input = document.getElementById('cuota-monto');
  if (!input) return;

  if (data.valor_mensual != null) {
    input.value = parseFloat(data.valor_mensual).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  }

  const proximaEl = document.getElementById('cuota-proxima-notice');
  if (proximaEl) {
    if (data.cuota_proxima) {
      const monto = parseFloat(data.cuota_proxima.valor_mensual).toLocaleString('es-AR', { minimumFractionDigits: 2 });
      const partes = data.cuota_proxima.vigente_desde.split('T')[0].split('-');
      const fecha = `${partes[2]}/${partes[1]}/${partes[0]}`;
      proximaEl.textContent = `A partir del ${fecha} la cuota será $${monto}`;
      proximaEl.style.display = 'block';
    } else {
      proximaEl.style.display = 'none';
    }
  }
}

// ── Historial de Cuotas ─────────────────────────────────────────────────────

/**
 * Genera el badge de estado de un pago de cuota.
 * @param {Object} pago - Objeto de pago con estado y medio_pago.
 * @returns {string} HTML del badge.
 */
export function cuotaBadge(pago) {
  if (pago.estado === 'pagado') {
    const medio = pago.medio_pago === 'efectivo' ? ' (efectivo)' : '';
    return `<span class="cuota-badge badge-success">Pagó${medio}</span>`;
  }
  if (pago.estado === 'pendiente_efectivo') {
    return '<span class="cuota-badge badge-warning">Efectivo, a confirmar</span>';
  }
  return '<span class="cuota-badge badge-muted">Pendiente</span>';
}

/**
 * Popula el selector de año del historial de cuotas.
 * @param {number|string} anioActual - Año seleccionado actualmente.
 * @param {Array<number|string>} aniosDisponibles - Lista de años disponibles.
 */
export function renderSelectorAnioHistorial(anioActual, aniosDisponibles) {
  const select = document.getElementById('cuota-historial-anio');
  if (!select) return;

  select.innerHTML = '';
  (aniosDisponibles || [anioActual]).forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = `Ciclo ${a}`;
    select.appendChild(opt);
  });
  select.value = anioActual;
}

/**
 * Renderiza la lista de filas del historial de cuotas con acciones por período.
 * @param {Array} historialCuotas - Array de objetos de pago de cuota.
 */
export function renderHistorialCuotas(historialCuotas) {
  const list = document.getElementById('cuota-historial-list');
  if (!list) return;

  if (historialCuotas.length === 0) {
    list.innerHTML = '<div class="chr-empty">Todavía no hay cuotas generadas para este ciclo.</div>';
    return;
  }

  list.innerHTML = '';
  historialCuotas.forEach(pago => {
    const row = document.createElement('div');
    row.className = 'chr-row';

    const monto = pago.monto_exigible != null
      ? '$' + parseFloat(pago.monto_exigible).toLocaleString('es-AR', { minimumFractionDigits: 2 })
      : (pago.monto_base != null
        ? '$' + parseFloat(pago.monto_base).toLocaleString('es-AR', { minimumFractionDigits: 2 })
        : '—');

    let acciones = '';
    if (pago.estado === 'pendiente') {
      acciones += `<button class="chr-btn-pagar" onclick="window.openPagoModal('${pago.periodo}')">Pagar</button>`;
    } else {
      // Ya declaró el pago (transferencia o efectivo): permitir corregirlo
      acciones += `<button onclick="window.openPagoModal('${pago.periodo}')">Editar</button>`;
    }
    if (pago.tiene_comprobante) {
      acciones += `<button onclick="window.verMiComprobante(${pago.id})">Ver comprobante</button>`;
    }

    row.innerHTML = `
      <div class="chr-periodo">${formatPeriodoCuota(pago.periodo)}</div>
      ${cuotaBadge(pago)}
      <div class="chr-monto">${monto}</div>
      <div class="chr-actions">${acciones}</div>
    `;
    list.appendChild(row);
  });
}

// ── View Toggle ─────────────────────────────────────────────────────────────

/**
 * Actualiza el estado visual de los botones y paneles de vista (lista/calendario).
 * @param {'list'|'calendar'} view - Vista activa.
 */
export function updateViewToggle(view) {
  const btnList = document.getElementById('btn-view-list');
  const btnCal = document.getElementById('btn-view-calendar');
  const viewList = document.getElementById('view-list');
  const viewCal = document.getElementById('view-calendar');

  if (view === 'list') {
    btnList.classList.add('active');
    btnCal.classList.remove('active');
    viewList.style.display = 'flex';
    viewCal.style.display = 'none';
  } else {
    btnList.classList.remove('active');
    btnCal.classList.add('active');
    viewList.style.display = 'none';
    viewCal.style.display = 'block';
  }
}

// ── Paleta de colores ───────────────────────────────────────────────────────

/**
 * Inicializa la paleta de swatches de color para el formulario de alertas.
 * Asigna roles ARIA y listeners de selección.
 * @param {string} defaultColor - Color hexadecimal a pre-seleccionar.
 */
export function setupColorPalette(defaultColor) {
  const colorInput = document.getElementById('alert-color');
  const swatches = Array.from(document.querySelectorAll('.alert-color-swatch'));
  if (!colorInput || swatches.length === 0) return;

  const selectColor = (color) => {
    const normalized = (color || '').toLowerCase();
    colorInput.value = normalized;

    swatches.forEach((swatch) => {
      const isSelected = swatch.dataset.color.toLowerCase() === normalized;
      swatch.classList.toggle('selected', isSelected);
      swatch.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
  };

  swatches.forEach((swatch) => {
    swatch.setAttribute('role', 'radio');
    swatch.setAttribute('aria-checked', 'false');

    swatch.addEventListener('click', () => {
      selectColor(swatch.dataset.color);
    });
  });

  selectColor(colorInput.value || defaultColor);
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.AlertasRender = {
  renderNavBadge,
  renderListView,
  renderEstadoPagoCuota,
  renderCuotaRecordatorio,
  cuotaBadge,
  renderSelectorAnioHistorial,
  renderHistorialCuotas,
  updateViewToggle,
  setupColorPalette
};
