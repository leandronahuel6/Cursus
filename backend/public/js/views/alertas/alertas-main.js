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
  fetchHistorialCuotas,
  subirComprobante,
  pagarEfectivo,
  fetchComprobanteBlob,
  formatPeriodoCuota
} from './alertas-data.js';

import {
  renderNavBadge,
  renderListView,
  renderEstadoPagoCuota,
  renderCuotaRecordatorio,
  renderHistorialCuotas,
  renderSelectorAnioHistorial,
  updateViewToggle,
  setupColorPalette
} from './alertas-render.js';

import { renderCalendar, changeMonth } from './alertas-calendar.js';

import { todayDateStr, ALERT_COLOR_PALETTE, formatDateStr } from '../../shared/utils.js';

// ── Estado global ───────────────────────────────────────────────────────────

/**
 * Estado centralizado de la página de alertas y cuotas.
 * @type {Object}
 */
export const state = {
  view: 'list',
  alerts: [],
  calendar: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: todayDateStr()
  },
  /** Monto vigente de la cuota fijado por el admin. null si aún no se cargó. */
  cuotaMontoVigente: null,
  /** Array de pagos del historial del ciclo seleccionado. */
  historialCuotas: [],
  /** Período YYYY-MM actualmente seleccionado en el modal de pago. */
  pagoPeriodo: null,
  /** Medio de pago activo en el modal: 'transferencia' | 'efectivo'. */
  pagoMedio: 'transferencia'
};

// ── Inicialización ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadAlertas();
  updateUI();
  await loadCuotaInfo();
  loadHistorialCuotasView();

  const dateInput = document.getElementById('alert-date');
  if (dateInput) dateInput.value = todayDateStr();

  // Refrescar cuota si el admin la cambió mientras la pestaña estaba en segundo plano
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadCuotaInfo();
  });

  const colorInput = document.getElementById('alert-color');
  if (colorInput) colorInput.value = ALERT_COLOR_PALETTE[0];

  setupColorPalette(ALERT_COLOR_PALETTE[0]);
});

// ── Data loading ────────────────────────────────────────────────────────────

/**
 * Carga todas las alertas del alumno desde la API y actualiza el estado.
 * @returns {Promise<void>}
 */
async function loadAlertas() {
  try {
    state.alerts = await fetchAlertas();
  } catch (e) {
    console.error(e);
    state.alerts = [];
  }
}

/**
 * Carga el monto vigente de cuota y el estado de pago del mes actual.
 * Actualiza state.cuotaMontoVigente para que los renders de recargo sean correctos.
 * @returns {Promise<void>}
 */
async function loadCuotaInfo() {
  try {
    const cuotaData = await fetchCuotas();
    if (cuotaData.valor_mensual != null) {
      state.cuotaMontoVigente = parseFloat(cuotaData.valor_mensual);
    }
    renderCuotaRecordatorio(cuotaData);
  } catch (e) {
    console.error(e);
  }

  try {
    const estado = await fetchEstadoPagoCuota();
    state.pagoPeriodo = estado.periodo;
    renderEstadoPagoCuota(estado, state.cuotaMontoVigente);
  } catch (e) {
    console.error(e);
  }
}

/**
 * Carga el historial de cuotas para un ciclo (año) y lo renderiza.
 * @param {number|string} [anio] - Año del ciclo. Si se omite, usa el año actual.
 * @returns {Promise<void>}
 */
async function loadHistorialCuotasView(anio) {
  const list = document.getElementById('cuota-historial-list');

  try {
    const data = await fetchHistorialCuotas(anio);
    state.historialCuotas = data.cuotas;
    renderSelectorAnioHistorial(data.anio, data.anios_disponibles);
    renderHistorialCuotas(state.historialCuotas);
  } catch (e) {
    console.error(e);
    if (list) list.innerHTML = '<div class="chr-empty">No se pudo cargar el historial.</div>';
  }
}

// ── UI Update ───────────────────────────────────────────────────────────────

/**
 * Actualiza toda la interfaz de alertas según el estado actual.
 */
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

// ── Window handlers: Vista y Alertas ───────────────────────────────────────

/**
 * Alterna entre la vista de lista y la de calendario.
 * @param {'list'|'calendar'} viewType - Tipo de vista a activar.
 */
window.switchView = function(viewType) {
  state.view = viewType;
  updateUI();
};

/**
 * Marca una alerta como completada optimistamente y persiste en la API.
 * @param {number} id - ID de la alerta.
 */
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

/**
 * Elimina una alerta optimistamente y persiste en la API.
 * @param {number} id - ID de la alerta.
 */
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

/**
 * Procesa el envío del formulario de creación de alerta.
 * @param {Event} event - El evento submit del formulario.
 */
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

// ── Window handlers: Modal de Pago de Cuota ────────────────────────────────

/**
 * Abre el modal de pago de cuota para un período dado.
 * Si el período ya tiene un pago declarado, lo pre-carga para edición.
 * @param {string} [periodo] - Período YYYY-MM a pagar/editar. Si se omite usa el actual.
 */
window.openPagoModal = function(periodo) {
  state.pagoPeriodo = periodo || state.pagoPeriodo;

  // Si ya había un pago declarado para este período, pre-carga el medio usado
  const existente = state.historialCuotas.find(p => p.periodo === state.pagoPeriodo);
  const label = state.pagoPeriodo ? formatPeriodoCuota(state.pagoPeriodo) : '';

  document.getElementById('pago-periodo-label').textContent = existente
    ? `Editar — ${label}`
    : label;

  document.getElementById('pago-comprobante').value = '';
  document.getElementById('pago-recibo').value = '';

  window.pagoSeleccionarMedio(existente?.medio_pago === 'efectivo' ? 'efectivo' : 'transferencia');
  window.pagoActualizarPreview();
  document.getElementById('pago-cuota-modal').classList.add('open');
};

/**
 * Cierra el modal de pago de cuota.
 */
window.closePagoModal = function() {
  document.getElementById('pago-cuota-modal').classList.remove('open');
};

/**
 * Activa la tab de medio de pago (transferencia o efectivo) y
 * muestra/oculta los campos correspondientes.
 * @param {'transferencia'|'efectivo'} medio - Medio de pago seleccionado.
 */
window.pagoSeleccionarMedio = function(medio) {
  state.pagoMedio = medio;

  document.querySelectorAll('.pago-medio-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.medio === medio);
  });

  document.getElementById('pago-transferencia-fields').hidden = medio !== 'transferencia';
  document.getElementById('pago-efectivo-fields').hidden = medio !== 'efectivo';
};

/**
 * Actualiza el texto de preview de monto en el modal, mostrando el
 * importe con el 10% de recargo si se aplica después del día 15.
 */
window.pagoActualizarPreview = function() {
  const preview = document.getElementById('pago-monto-preview');
  if (!preview) return;

  if (state.cuotaMontoVigente == null) {
    preview.textContent = 'Recordá que si el pago es posterior al día 15 debés pagar un 10% más.';
    return;
  }

  const montoFmt = (state.cuotaMontoVigente * 1.10).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  preview.classList.remove('con-recargo');
  preview.textContent = `Recordá que si el pago es posterior al día 15 debés pagar un 10% más que sería: $${montoFmt}.`;
};

/**
 * Confirma el pago de la cuota subiendo el comprobante o el recibo de efectivo.
 * Maneja tanto el endpoint de transferencia como el de efectivo.
 * @returns {Promise<void>}
 */
window.confirmarPago = async function() {
  if (!state.pagoPeriodo) {
    window.showToast('No se encontró el período a pagar.', 'error');
    return;
  }

  const btn = document.getElementById('pago-btn-confirmar');
  btn.disabled = true;
  btn.textContent = 'Guardando…';

  try {
    if (state.pagoMedio === 'efectivo') {
      const recibo = document.getElementById('pago-recibo').files[0];
      if (!recibo) {
        window.showToast('Adjuntá la foto del recibo de tesorería.', 'warn');
        return;
      }
      await pagarEfectivo(state.pagoPeriodo, recibo);
    } else {
      const comprobante = document.getElementById('pago-comprobante').files[0];
      if (!comprobante) {
        window.showToast('Adjuntá el comprobante de la transferencia.', 'warn');
        return;
      }
      await subirComprobante(state.pagoPeriodo, comprobante);
    }

    window.closePagoModal();

    // Refresca tanto el banner de estado como el historial completo
    await Promise.all([loadCuotaInfo(), loadHistorialCuotasView()]);

    window.showToast(
      state.pagoMedio === 'efectivo'
        ? 'Pago en efectivo declarado. Quedará confirmado cuando la secretaría lo revise.'
        : 'Comprobante subido con éxito.',
      'success'
    );
  } catch (e) {
    console.error(e);
    window.showToast(e.message || 'No se pudo registrar el pago. Intentá de nuevo.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar';
  }
};

/**
 * Abre el comprobante de un pago en una nueva pestaña del navegador.
 * @param {number} id - ID del pago de cuota.
 * @returns {Promise<void>}
 */
window.verMiComprobante = async function(id) {
  try {
    const blob = await fetchComprobanteBlob(id);
    window.open(URL.createObjectURL(blob), '_blank');
  } catch (e) {
    console.error(e);
    window.showToast('No se pudo abrir el comprobante.', 'error');
  }
};

/**
 * Cambia el año del selector del historial de cuotas y recarga los datos.
 * @param {number|string} anio - Año del ciclo seleccionado.
 */
window.cambiarAnioHistorial = function(anio) {
  loadHistorialCuotasView(anio);
};

// ── Calendar navigation ─────────────────────────────────────────────────────

/**
 * Navega el calendario al mes anterior o siguiente.
 * @param {number} direction - -1 para atrás, +1 para adelante.
 */
window.changeMonth = function(direction) {
  changeMonth(direction, state);
  renderCalendar(state, state.alerts);
};
