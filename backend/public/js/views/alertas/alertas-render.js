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

// ── Badge de navegación ─────────────────────────────────────────────────────

export function renderNavBadge(activeAlerts) {
  const badgeCount = activeAlerts.filter(a => getDaysDifference(a.fecha) <= 7).length;
  const navBadge = document.getElementById('nav-badge-count');
  const bnavBadge = document.getElementById('bnav-badge-count');
  if (navBadge) navBadge.innerText = badgeCount;
  if (bnavBadge) bnavBadge.innerText = badgeCount;
}

// ── List View ───────────────────────────────────────────────────────────────

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

// ── Cuota / Pago ────────────────────────────────────────────────────────────

export function renderEstadoPagoCuota(estado) {
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
  const urgente = dias <= 3;

  banner.style.display = 'flex';
  banner.style.background = urgente ? '#fef2f2' : '#fff7ed';
  banner.style.borderColor = urgente ? '#fecaca' : '#fcd9a0';
  banner.style.borderLeftColor = urgente ? 'var(--red)' : '#f97316';
  bannerTitle.textContent = urgente ? '⚠️ ¡Atención!' : 'Alerta de pago:';
  bannerTitle.style.color = urgente ? 'var(--red)' : '#92400e';

  const dot = document.getElementById('cuota-pago-alert-dot');
  if (dot) dot.style.background = urgente ? 'var(--red)' : '#f97316';

  if (dias < 0) {
    bannerText.textContent = 'Ya pasó el día 15: la cuota de este mes está vencida y puede tener recargos. Todavía no registraste el pago.';
  } else if (dias === 0) {
    bannerText.textContent = 'Hoy es el último día para pagar la cuota sin recargos.';
  } else if (urgente) {
    bannerText.textContent = `Quedan ${dias} día${dias !== 1 ? 's' : ''} para pagar la cuota sin recargos (vence el 15).`;
  } else {
    bannerText.textContent = 'Todavía no pagaste la cuota de este mes. Vence el día 15.';
  }
}

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

// ── View Toggle ─────────────────────────────────────────────────────────────

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
  updateViewToggle,
  setupColorPalette
};
