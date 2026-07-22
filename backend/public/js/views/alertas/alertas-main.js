/**
 * @fileoverview Orquestador de la página de Alertas y Vencimientos.
 * Coordina los módulos data, render y calendar. Inicializa eventos
 * y maneja el pipeline datos → render.
 * @module views/alertas/alertas-main
 */

'use strict';

import {
  fetchAlertas,
  createAlerta,
  updateAlerta,
  deleteAlerta,
  fetchCuotas,
  fetchEstadoPagoCuota,
  registrarPagoCuota
} from './alertas-data.js';

import {
  renderNavBadge,
  renderListView,
  renderEstadoPagoCuota,
  renderCuotaRecordatorio,
  updateViewToggle,
  setupColorPalette
} from './alertas-render.js';

import { renderCalendar, changeMonth } from './alertas-calendar.js';

import { todayDateStr, ALERT_COLOR_PALETTE, formatDateStr } from '../../shared/utils.js';

// ── Estado global ───────────────────────────────────────────────────────────

export const state = {
  view: 'list',
  alerts: [],
  calendar: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: todayDateStr()
  }
};

// ── Inicialización ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadAlertas();
  updateUI();
  loadCuotaInfo();

  const dateInput = document.getElementById('alert-date');
  if (dateInput) dateInput.value = todayDateStr();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadCuotaInfo();
  });

  const colorInput = document.getElementById('alert-color');
  if (colorInput) colorInput.value = ALERT_COLOR_PALETTE[0];

  setupColorPalette(ALERT_COLOR_PALETTE[0]);
});

// ── Data loading ────────────────────────────────────────────────────────────

async function loadAlertas() {
  try {
    state.alerts = await fetchAlertas();
  } catch (e) {
    console.error(e);
    state.alerts = [];
  }
}

async function loadCuotaInfo() {
  try {
    const cuotaData = await fetchCuotas();
    renderCuotaRecordatorio(cuotaData);
  } catch (e) {
    console.error(e);
  }

  try {
    const estado = await fetchEstadoPagoCuota();
    renderEstadoPagoCuota(estado);
  } catch (e) {
    console.error(e);
  }
}

// ── UI Update ───────────────────────────────────────────────────────────────

export function updateUI() {
  const activeAlerts = state.alerts.filter(a => !a.completada);

  renderNavBadge(activeAlerts);
  updateViewToggle(state.view);

  if (state.view === 'list') {
    renderListView(activeAlerts);
  } else {
    renderCalendar(state, state.alerts);
  }
}

// ── Window handlers (legacy compatibility) ──────────────────────────────────

window.switchView = function(viewType) {
  state.view = viewType;
  updateUI();
};

window.completeAlert = async function(id) {
  const alerta = state.alerts.find(a => a.id === id);
  if (alerta) alerta.completada = true;
  updateUI();

  try {
    await updateAlerta(id, { completada: true });
    window.showToast('Alerta marcada como completada.', 'success');
  } catch (e) {
    console.error('No se pudo marcar la alerta como completada', e);
    window.showToast('No se pudo completar la alerta.', 'error');
  }
};

window.deleteAlert = async function(id) {
  state.alerts = state.alerts.filter(a => a.id !== id);
  updateUI();

  try {
    await deleteAlerta(id);
    window.showToast('Alerta eliminada.', 'success');
  } catch (e) {
    console.error('No se pudo eliminar la alerta', e);
    window.showToast('No se pudo eliminar la alerta.', 'error');
  }
};

window.handleAlertSubmit = async function(event) {
  event.preventDefault();

  const titulo = document.getElementById('alert-title').value.trim();
  const categoria = document.getElementById('alert-type').value;
  const prioridad = document.getElementById('alert-priority').value;
  const fecha = document.getElementById('alert-date').value;
  const color = (document.getElementById('alert-color').value || '').trim();
  if (!titulo || !fecha) return;

  try {
    const nuevaAlerta = await createAlerta({
      titulo,
      categoria,
      prioridad,
      fecha,
      color,
      descripcion: `Cargada manualmente para la fecha límite ${formatDateStr(fecha)}.`
    });

    state.alerts.push(nuevaAlerta);
    updateUI();

    document.getElementById('alert-title').value = '';
    document.getElementById('alert-type').value = 'academic';
    document.getElementById('alert-priority').value = 'alta';
    document.getElementById('alert-date').value = todayDateStr();
    const colorInput = document.getElementById('alert-color');
    if (colorInput) colorInput.value = ALERT_COLOR_PALETTE[0];
    setupColorPalette(ALERT_COLOR_PALETTE[0]);

    window.showToast('Alerta creada con éxito.', 'success');
  } catch (e) {
    console.error(e);
    window.showToast('No se pudo guardar la alerta. Intentá de nuevo.', 'error');
  }
};

window.openPagoModal = function() {
  document.getElementById('pago-fecha').value = todayDateStr();
  document.getElementById('pago-cuota-modal').classList.add('open');
};

window.closePagoModal = function() {
  document.getElementById('pago-cuota-modal').classList.remove('open');
};

window.confirmarPago = async function() {
  const fecha = document.getElementById('pago-fecha').value;
  if (!fecha) {
    window.showToast('Elegí una fecha de pago.', 'warn');
    return;
  }

  try {
    const estado = await registrarPagoCuota(fecha);
    renderEstadoPagoCuota(estado);
    window.closePagoModal();
    window.showToast('Pago registrado con éxito.', 'success');
  } catch (e) {
    console.error(e);
    window.showToast('No se pudo registrar el pago. Intentá de nuevo.', 'error');
  }
};

// Calendar navigation
window.changeMonth = function(direction) {
  changeMonth(direction, state);
  renderCalendar(state, state.alerts);
};
