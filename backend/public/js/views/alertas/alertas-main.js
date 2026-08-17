/**
 * @fileoverview Orquestador de la página de Alertas y Vencimientos.
 *
 * Responsabilidades de este módulo:
 * - Inicializar la página: cargar datos, configurar Event Delegation global.
 * - Coordinar los módulos data, render y calendar.
 * - Gestionar el estado centralizado de la página.
 * - Capturar TODOS los eventos del usuario mediante Event Delegation
 *   (atributos `data-js` y `data-js-action`) en lugar de `onclick` inline.
 * - Exponer funciones en `window.*` solo donde sea estrictamente necesario
 *   por compatibilidad con el sistema de modales de x-modal.
 *
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
  formatPeriodoCuota,
} from './alertas-data.js';

import {
  renderNavBadge,
  renderListView,
  renderEstadoPagoCuota,
  renderCuotaRecordatorio,
  renderHistorialCuotas,
  renderSelectorAnioHistorial,
  updateViewToggle,
  setupColorPalette,
} from './alertas-render.js';

import { renderCalendar, changeMonth } from './alertas-calendar.js';

import { todayDateStr, ALERT_COLOR_PALETTE, formatDateStr } from '../../shared/utils.js';

// ── Estado global ────────────────────────────────────────────────────────────

/**
 * Estado centralizado de la página de alertas y cuotas.
 * @type {Object}
 * @property {'list'|'calendar'} view - Vista activa.
 * @property {Array<Object>} alerts - Todas las alertas del alumno.
 * @property {Object} calendar - Sub-estado del calendario mensual.
 * @property {number} calendar.year - Año activo.
 * @property {number} calendar.month - Mes activo (0-indexed).
 * @property {string|null} calendar.selectedDate - Fecha seleccionada (YYYY-MM-DD).
 * @property {number|null} cuotaMontoVigente - Monto mensual vigente fijado por el admin.
 * @property {Array<Object>} historialCuotas - Cuotas del ciclo seleccionado.
 * @property {string|null} pagoPeriodo - Período YYYY-MM en el modal de pago.
 * @property {'transferencia'|'efectivo'} pagoMedio - Medio de pago activo.
 */
export const state = {
  view:    'list',
  alerts:  [],
  calendar: {
    year:         new Date().getFullYear(),
    month:        new Date().getMonth(),
    selectedDate: todayDateStr(),
  },
  cuotaMontoVigente: null,
  historialCuotas:   [],
  pagoPeriodo:       null,
  pagoMedio:         'transferencia',
  alertToDelete:     null,
  alertToEdit:       null,
};

// ── Inicialización ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await _loadAlertas();
  _updateUI();
  await _loadCuotaInfo();
  _loadHistorialCuotasView();

  // Valor por defecto del date picker
  const dateInput = document.getElementById('alert-date');
  if (dateInput) dateInput.value = todayDateStr();

  // Valor por defecto de la paleta de color
  const colorInput = document.getElementById('alert-color');
  if (colorInput) colorInput.value = ALERT_COLOR_PALETTE[0];
  setupColorPalette('alert-form', ALERT_COLOR_PALETTE[0]);

  // Refrescar info de cuota al volver al foco de la pestaña
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) _loadCuotaInfo();
  });

  // ── Event Delegation global ──────────────────────────────────────────────
  _setupEventDelegation();
  _setupFormListeners();
});

// ── Event Delegation ─────────────────────────────────────────────────────────

/**
 * Configura el Event Delegation global del documento para capturar
 * clics en todos los elementos interactivos de la página de alertas.
 * Detecta acciones mediante el atributo `data-js-action` o `data-js`.
 *
 * @returns {void}
 */
function _setupEventDelegation() {
  document.addEventListener('click', (e) => {
    const target = e.target;

    // ── Botones con data-js-action (generados dinámicamente por render) ──
    const actionEl = target.closest('[data-js-action]');
    if (actionEl) {
      const action = actionEl.dataset.jsAction;

      if (action === 'complete-alert') {
        _completeAlert(parseInt(actionEl.dataset.alertId, 10));
        return;
      }

      if (action === 'delete-alert') {
        state.alertToDelete = parseInt(actionEl.dataset.alertId, 10);
        document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'confirm-delete-alerta' } }));
        return;
      }

      if (action === 'edit-alert') {
        _openEditModal(parseInt(actionEl.dataset.alertId, 10));
        return;
      }

      if (action === 'open-pago-modal') {
        _openPagoModal(actionEl.dataset.periodo);
        return;
      }

      if (action === 'ver-comprobante') {
        _verMiComprobante(parseInt(actionEl.dataset.pagoId, 10));
        return;
      }
    }

    // ── Botones con data-js (estáticos en el Blade) ──────────────────────
    const jsEl = target.closest('[data-js]');
    if (jsEl) {
      const handler = jsEl.dataset.js;

      if (handler === 'switch-view') {
        _switchView(jsEl.dataset.view);
        return;
      }

      if (handler === 'change-month') {
        _changeMonth(parseInt(jsEl.dataset.direction, 10));
        return;
      }

      if (handler === 'open-pago-modal') {
        _openPagoModal();
        return;
      }

      if (handler === 'close-pago-modal') {
        _closePagoModal();
        return;
      }

      if (handler === 'confirmar-pago') {
        _confirmarPago();
        return;
      }

      if (handler === 'pago-medio-tab') {
        _pagoSeleccionarMedio(jsEl.dataset.medio);
        return;
      }
    }

    // ── Confirmar eliminación de alerta ──────────────────────────────────
    if (target.closest('#btn-confirm-delete-alerta')) {
      if (state.alertToDelete) {
        _deleteAlert(state.alertToDelete);
        document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'confirm-delete-alerta' } }));
        state.alertToDelete = null;
      }
      return;
    }

    // ── Cierre del banner de cuota ────────────────────────────────────────
    // Manejado por Event Delegation en banners.js
  });

  // ── Selector de año del historial (change event) ─────────────────────────
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-js="historial-anio-select"]');
    if (el) _loadHistorialCuotasView(el.value);
  });
}

/**
 * Configura los listeners de los formularios de la página.
 *
 * @returns {void}
 */
function _setupFormListeners() {
  const formAlerta = document.getElementById('alert-form');
  if (formAlerta) {
    formAlerta.addEventListener('submit', _handleAlertSubmit);
  }

  const formEditAlerta = document.getElementById('edit-alert-form');
  if (formEditAlerta) {
    formEditAlerta.addEventListener('submit', _handleEditSubmit);
  }
}

// ── Data loading ─────────────────────────────────────────────────────────────

/**
 * Carga todas las alertas del alumno desde la API y actualiza el estado.
 *
 * @returns {Promise<void>}
 */
async function _loadAlertas() {
  try {
    state.alerts = await fetchAlertas();
  } catch (e) {
    console.error('[alertas-main] Error cargando alertas:', e);
    state.alerts = [];
  }
}

/**
 * Carga el monto vigente de cuota y el estado de pago del mes actual.
 * Actualiza `state.cuotaMontoVigente` para que los cálculos de recargo sean correctos.
 *
 * @returns {Promise<void>}
 */
async function _loadCuotaInfo() {
  try {
    const cuotaData = await fetchCuotas();
    if (cuotaData.valor_mensual != null) {
      state.cuotaMontoVigente = parseFloat(cuotaData.valor_mensual);
    }
    renderCuotaRecordatorio(cuotaData);
  } catch (e) {
    console.error('[alertas-main] Error cargando cuota:', e);
  }

  try {
    const estadoPago = await fetchEstadoPagoCuota();
    state.pagoPeriodo = estadoPago.periodo;
    renderEstadoPagoCuota(estadoPago, state.cuotaMontoVigente);
  } catch (e) {
    console.error('[alertas-main] Error cargando estado de pago:', e);
  }
}

/**
 * Carga el historial de cuotas para un ciclo (año) y lo renderiza.
 *
 * @param {number|string} [anio] - Año del ciclo. Si se omite, usa el año actual.
 * @returns {Promise<void>}
 */
async function _loadHistorialCuotasView(anio) {
  const list = document.getElementById('cuota-historial-list');
  try {
    const data = await fetchHistorialCuotas(anio);
    state.historialCuotas = data.cuotas;
    renderSelectorAnioHistorial(data.anio, data.anios_disponibles);
    renderHistorialCuotas(state.historialCuotas);
  } catch (e) {
    console.error('[alertas-main] Error cargando historial de cuotas:', e);
    if (list) list.innerHTML = '<div class="chr-empty">No se pudo cargar el historial.</div>';
  }
}

// ── UI Update ─────────────────────────────────────────────────────────────────

/**
 * Actualiza toda la interfaz de alertas según el estado actual.
 *
 * @returns {void}
 */
function _updateUI() {
  // Ordenamiento optimista por fecha ascendente
  state.alerts.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  renderNavBadge(state.alerts.filter(a => !a.completada));
  updateViewToggle(state.view);

  if (state.view === 'list') {
    renderListView(state.alerts);
  } else {
    renderCalendar(state, state.alerts);
  }
}

// ── Acciones: Vista y Alertas ─────────────────────────────────────────────────

/**
 * Alterna entre la vista de lista y la de calendario.
 *
 * @param {'list'|'calendar'} viewType - Tipo de vista a activar.
 * @returns {void}
 */
function _switchView(viewType) {
  state.view = viewType;
  _updateUI();
}

/**
 * Marca una alerta como completada o la restaura de forma optimista y persiste en la API.
 *
 * @param {number} id - ID de la alerta.
 * @returns {Promise<void>}
 */
async function _completeAlert(id) {
  const alerta = state.alerts.find(a => a.id === id);
  if (!alerta) return;

  const newState = !alerta.completada;
  alerta.completada = newState;
  _updateUI();

  try {
    await updateAlerta(id, { completada: newState });
    const msg = newState ? 'Alerta completada.' : 'Alerta restaurada.';
    window.showToast(msg, 'success');
  } catch (e) {
    console.error('[alertas-main] Error al togglear alerta:', e);
    window.showToast('No se pudo actualizar el estado de la alerta.', 'error');
    alerta.completada = !newState; // rollback
    _updateUI();
  }
}

/**
 * Elimina una alerta de forma optimista y persiste en la API.
 *
 * @param {number} id - ID de la alerta.
 * @returns {Promise<void>}
 */
async function _deleteAlert(id) {
  state.alerts = state.alerts.filter(a => a.id !== id);
  _updateUI();

  try {
    await deleteAlerta(id);
    window.showToast('Alerta eliminada.', 'success');
  } catch (e) {
    console.error('[alertas-main] Error al eliminar alerta:', e);
    window.showToast('No se pudo eliminar la alerta.', 'error');
  }
}

/**
 * Procesa el envío del formulario de creación de alerta.
 *
 * @param {Event} event - El evento submit del formulario.
 * @returns {Promise<void>}
 */
async function _handleAlertSubmit(event) {
  event.preventDefault();

  const titulo    = document.getElementById('alert-title').value.trim();
  const descripcion = document.getElementById('alert-desc').value.trim();
  const categoria = document.getElementById('alert-type').value;
  const prioridad = document.getElementById('alert-priority').value;
  const fecha     = document.getElementById('alert-date').value;
  const color     = (document.getElementById('alert-color').value || '').trim();

  if (!titulo || !fecha) return;

  try {
    const nuevaAlerta = await createAlerta({
      titulo,
      categoria,
      prioridad,
      fecha,
      color,
      descripcion: descripcion || `Cargada manualmente para la fecha límite ${formatDateStr(fecha)}.`,
    });

    state.alerts.push(nuevaAlerta);
    _updateUI();

    // Resetear formulario
    document.getElementById('alert-title').value    = '';
    document.getElementById('alert-desc').value     = '';
    document.getElementById('alert-type').value     = 'academic';
    document.getElementById('alert-priority').value = 'alta';
    document.getElementById('alert-date').value     = todayDateStr();
    const colorInput = document.getElementById('alert-color');
    if (colorInput) colorInput.value = ALERT_COLOR_PALETTE[0];
    setupColorPalette('alert-form', ALERT_COLOR_PALETTE[0]);

    window.showToast('Alerta creada con éxito.', 'success');
  } catch (e) {
    console.error('[alertas-main] Error al crear alerta:', e);
    window.showToast('No se pudo guardar la alerta. Intentá de nuevo.', 'error');
  }
}

/**
 * Abre el modal de edición poblado con los datos de la alerta.
 *
 * @param {number} id - ID de la alerta a editar.
 * @returns {void}
 */
function _openEditModal(id) {
  const alerta = state.alerts.find(a => a.id === id);
  if (!alerta) return;

  state.alertToEdit = id;

  document.getElementById('edit-alert-title').value = alerta.titulo;
  document.getElementById('edit-alert-desc').value = alerta.descripcion || '';
  document.getElementById('edit-alert-type').value = alerta.categoria;
  document.getElementById('edit-alert-priority').value = alerta.prioridad;
  document.getElementById('edit-alert-date').value = alerta.fecha;
  
  // Setear color
  const colorToSet = alerta.color || ALERT_COLOR_PALETTE[0];
  setupColorPalette('edit-alert-form', colorToSet);

  document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'edit-alerta-modal' } }));
}

/**
 * Maneja el envío del formulario de edición.
 *
 * @param {Event} event - El evento submit del formulario.
 * @returns {Promise<void>}
 */
async function _handleEditSubmit(event) {
  event.preventDefault();

  if (!state.alertToEdit) return;

  const id = state.alertToEdit;
  const titulo    = document.getElementById('edit-alert-title').value.trim();
  const descripcion = document.getElementById('edit-alert-desc').value.trim();
  const categoria = document.getElementById('edit-alert-type').value;
  const prioridad = document.getElementById('edit-alert-priority').value;
  const fecha     = document.getElementById('edit-alert-date').value;
  const color     = (document.getElementById('edit-alert-color').value || '').trim();

  if (!titulo || !fecha) return;

  const data = { titulo, descripcion, categoria, prioridad, fecha, color };

  // Actualización optimista local
  const index = state.alerts.findIndex(a => a.id === id);
  if (index !== -1) {
    state.alerts[index] = { ...state.alerts[index], ...data };
    _updateUI();
  }

  document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'edit-alerta-modal' } }));

  try {
    await updateAlerta(id, data);
    window.showToast('Alerta actualizada con éxito.', 'success');
  } catch (e) {
    console.error('[alertas-main] Error al editar alerta:', e);
    window.showToast('No se pudo actualizar la alerta.', 'error');
    // En caso de error, podríamos recargar las alertas completas
    await _loadAlertas();
    _updateUI();
  }
}

// ── Acciones: Modal de Pago de Cuota ─────────────────────────────────────────

/**
 * Abre el modal de pago de cuota para un período dado.
 * Si el período ya tiene un pago declarado, lo pre-carga para edición.
 *
 * @param {string} [periodo] - Período YYYY-MM a pagar/editar. Si se omite, usa el actual.
 * @returns {void}
 */
function _openPagoModal(periodo) {
  state.pagoPeriodo = periodo || state.pagoPeriodo;

  const existente = state.historialCuotas.find(p => p.periodo === state.pagoPeriodo);
  const label     = state.pagoPeriodo ? formatPeriodoCuota(state.pagoPeriodo) : '';

  const periodoLabel = document.getElementById('pago-periodo-label');
  if (periodoLabel) periodoLabel.textContent = existente ? `Editar — ${label}` : label;

  const comprobante = document.getElementById('pago-comprobante');
  const recibo      = document.getElementById('pago-recibo');
  if (comprobante) comprobante.value = '';
  if (recibo)      recibo.value      = '';

  _pagoSeleccionarMedio(existente?.medio_pago === 'efectivo' ? 'efectivo' : 'transferencia');
  _pagoActualizarPreview();
  document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'pago-cuota-modal' } }));
}

/**
 * Cierra el modal de pago de cuota.
 *
 * @returns {void}
 */
function _closePagoModal() {
  document.dispatchEvent(new CustomEvent('modal:close', { detail: { id: 'pago-cuota-modal' } }));
}

/**
 * Activa la tab de medio de pago y muestra/oculta los campos correspondientes.
 * Usa `aria-selected` y el atributo `hidden` en lugar de `style.display`.
 *
 * @param {'transferencia'|'efectivo'} medio - Medio de pago seleccionado.
 * @returns {void}
 */
function _pagoSeleccionarMedio(medio) {
  state.pagoMedio = medio;

  document.querySelectorAll('.pago-medio-tab').forEach(tab => {
    const isActive = tab.dataset.medio === medio;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  const transFields = document.getElementById('pago-transferencia-fields');
  const efectFields = document.getElementById('pago-efectivo-fields');

  if (transFields) transFields.hidden = medio !== 'transferencia';
  if (efectFields) efectFields.hidden = medio !== 'efectivo';
}

/**
 * Actualiza el texto de preview de monto en el modal,
 * mostrando el importe con el 10% de recargo si aplica.
 *
 * @returns {void}
 */
function _pagoActualizarPreview() {
  const preview = document.getElementById('pago-monto-preview');
  if (!preview) return;

  if (state.cuotaMontoVigente == null) {
    preview.textContent = 'Recordá que si el pago es posterior al día 15 debés pagar un 10% más.';
    preview.classList.remove('con-recargo');
    return;
  }

  const montoFmt = (state.cuotaMontoVigente * 1.10).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  preview.textContent = `Recordá que si el pago es posterior al día 15 debés pagar un 10% más que sería: $${montoFmt}.`;
  preview.classList.remove('con-recargo');
}

/**
 * Confirma el pago de la cuota subiendo el comprobante o el recibo de efectivo.
 * Deshabilita el botón durante el proceso para evitar doble envío.
 *
 * @returns {Promise<void>}
 */
async function _confirmarPago() {
  if (!state.pagoPeriodo) {
    window.showToast('No se encontró el período a pagar.', 'error');
    return;
  }

  const btn = document.getElementById('pago-btn-confirmar');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

  try {
    const periodoSolicitado = state.pagoPeriodo;
    let resultado;

    if (state.pagoMedio === 'efectivo') {
      const reciboEl = document.getElementById('pago-recibo');
      const recibo   = reciboEl?.files[0];
      if (!recibo) {
        window.showToast('Adjuntá la foto del recibo de tesorería.', 'warn');
        return;
      }
      resultado = await pagarEfectivo(periodoSolicitado, recibo);
    } else {
      const comprobanteEl = document.getElementById('pago-comprobante');
      const comprobante   = comprobanteEl?.files[0];
      if (!comprobante) {
        window.showToast('Adjuntá el comprobante de la transferencia.', 'warn');
        return;
      }
      resultado = await subirComprobante(periodoSolicitado, comprobante);
    }

    _closePagoModal();
    await Promise.all([_loadCuotaInfo(), _loadHistorialCuotasView()]);

    const fueRedirigido = resultado?.periodo && resultado.periodo !== periodoSolicitado;
    if (fueRedirigido) {
      window.showToast(
        `El comprobante corresponde a ${formatPeriodoCuota(resultado.periodo)}: se registró el pago en ese período.`,
        'success'
      );
    } else {
      window.showToast(
        state.pagoMedio === 'efectivo'
          ? 'Pago en efectivo declarado. Quedará confirmado cuando la secretaría lo revise.'
          : 'Comprobante subido con éxito.',
        'success'
      );
    }
  } catch (e) {
    console.error('[alertas-main] Error al confirmar pago:', e);
    window.showToast(e.message || 'No se pudo registrar el pago. Intentá de nuevo.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar'; }
  }
}

/**
 * Abre el comprobante de un pago en una nueva pestaña del navegador.
 *
 * @param {number} id - ID del pago de cuota.
 * @returns {Promise<void>}
 */
async function _verMiComprobante(id) {
  try {
    const blob = await fetchComprobanteBlob(id);
    window.open(URL.createObjectURL(blob), '_blank');
  } catch (e) {
    console.error('[alertas-main] Error al abrir comprobante:', e);
    window.showToast('No se pudo abrir el comprobante.', 'error');
  }
}

// ── Navegación del calendario ─────────────────────────────────────────────────

/**
 * Navega el calendario al mes anterior o siguiente.
 *
 * @param {number} direction - -1 para atrás, +1 para adelante.
 * @returns {void}
 */
function _changeMonth(direction) {
  changeMonth(direction, state);
  renderCalendar(state, state.alerts);
}

// ── Legacy Global Export ─────────────────────────────────────────────────────
// Se exponen en window solo las funciones que el sistema x-modal
// o componentes Blade legacy necesitan invocar externamente.

window.openPagoModal   = _openPagoModal;
window.closePagoModal  = _closePagoModal;
window.pagoActualizarPreview = _pagoActualizarPreview;
