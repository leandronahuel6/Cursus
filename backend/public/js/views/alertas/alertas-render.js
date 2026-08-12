/**
 * @fileoverview Renderizado DOM para la página de Alertas y Vencimientos.
 *
 * Responsabilidades de este módulo:
 * - Renderizar la vista de lista/agenda de alertas clasificadas en grupos.
 * - Renderizar el banner de estado de cuota (usando clases CSS, sin inline styles).
 * - Renderizar el campo de monto de cuota vigente y el aviso de próxima cuota.
 * - Renderizar el historial de cuotas con sus acciones.
 * - Actualizar el badge de conteo de alertas en la navegación.
 * - Actualizar el estado visual de los botones del switcher de vista.
 * - Inicializar la paleta de swatches de color del formulario.
 *
 * Este módulo NO realiza fetching de datos. Recibe datos como parámetros
 * y manipula el DOM exclusivamente mediante clases CSS (Zero Inline Styles).
 *
 * @module views/alertas/alertas-render
 */

'use strict';

import {
  formatDateStr,
  getDaysDifference,
  resolveAlertColor,
  getAlertDateText,
} from '../../shared/utils.js';

import { spriteIcon } from '../../shared/sprite.js';

import { formatPeriodoCuota } from './alertas-data.js';

// ── Constantes ───────────────────────────────────────────────────────────────

/**
 * Mapa de categoría de alerta a ID de ícono en el sprite SVG.
 * @type {Record<string, string>}
 */
const CATEGORIA_ICON = {
  academic:       'graduation-cap',
  administrative: 'briefcase-business',
  personal:       'user',
  payment:        'banknote',
};

/**
 * Umbral de días para el grupo "Este mes / Próximos 30 días".
 * Las alertas con diffDays > 30 van al grupo "Más adelante".
 * @type {number}
 */
const SOON_THRESHOLD_DAYS = 30;

// ── Badge de navegación ──────────────────────────────────────────────────────

/**
 * Actualiza los badges de conteo en la barra de navegación
 * con la cantidad de alertas que vencen en los próximos 7 días.
 *
 * @param {Array<Object>} activeAlerts - Alertas activas (no completadas).
 * @returns {void}
 */
export function renderNavBadge(activeAlerts) {
  const badgeCount = activeAlerts.filter(a => getDaysDifference(a.fecha) <= 7).length;
  const navBadge  = document.getElementById('nav-badge-count');
  const bnavBadge = document.getElementById('bnav-badge-count');
  if (navBadge)  navBadge.textContent  = badgeCount;
  if (bnavBadge) bnavBadge.textContent = badgeCount;
}

// ── List View ────────────────────────────────────────────────────────────────

/**
 * Renderiza la vista de lista/agenda clasificando alertas en tres grupos:
 * - Urgentes: ≤ 7 días.
 * - Próximas: entre 8 y 30 días ("Este mes / Próximos 30 días").
 * - Más adelante: > 30 días.
 *
 * @param {Array<Object>} activeAlerts - Alertas activas (no completadas).
 * @returns {void}
 */
export function renderListView(activeAlerts) {
  const listUrgent = document.getElementById('list-urgent');
  const listSoon   = document.getElementById('list-soon');
  const listLater  = document.getElementById('list-later');

  if (!listUrgent || !listSoon || !listLater) return;

  listUrgent.innerHTML = '';
  listSoon.innerHTML   = '';
  listLater.innerHTML  = '';

  activeAlerts.forEach(alerta => {
    const diffDays = getDaysDifference(alerta.fecha);
    const card     = _createAlertCard(alerta, diffDays);

    if (diffDays <= 7) {
      listUrgent.appendChild(card);
    } else if (diffDays <= SOON_THRESHOLD_DAYS) {
      listSoon.appendChild(card);
    } else {
      listLater.appendChild(card);
    }
  });

  _checkGroupEmpty(listUrgent, 'No tienes alertas críticas para esta semana.');
  _checkGroupEmpty(listSoon,   'No hay vencimientos programados en los próximos 30 días.');
  _checkGroupEmpty(listLater,  'Sin vencimientos lejanos programados.');
}

/**
 * Muestra un mensaje vacío en un contenedor de grupo si no tiene tarjetas hijas.
 *
 * @param {HTMLElement} container - El contenedor del grupo de alertas.
 * @param {string} message - Mensaje a mostrar cuando el grupo está vacío.
 * @returns {void}
 */
function _checkGroupEmpty(container, message) {
  if (container.children.length === 0) {
    const empty = document.createElement('div');
    empty.className   = 'alert-group__empty';
    empty.textContent = message;
    container.appendChild(empty);
  }
}

/**
 * Crea un elemento DOM con la tarjeta visual de una alerta.
 * Los botones de acción usan atributos `data-js-action` y `data-alert-id`
 * para que el Event Delegation en `alertas-main.js` capture los eventos.
 *
 * @param {Object} alerta - Objeto de alerta con id, titulo, categoria, prioridad, fecha, color.
 * @param {number} diffDays - Días de diferencia desde hoy.
 * @returns {HTMLElement} El elemento div de la tarjeta.
 */
function _createAlertCard(alerta, diffDays) {
  const card = document.createElement('article');
  card.className = 'alert-item-card';

  const resolvedColor = resolveAlertColor(alerta);
  const dateInfo      = getAlertDateText(diffDays, alerta.fecha);
  const iconId        = CATEGORIA_ICON[alerta.categoria] || 'circle-alert';

  // ── Ícono de categoría
  const iconWrap = document.createElement('div');
  iconWrap.className = `alert-icon-wrap alert-icon-${alerta.categoria}`;
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.innerHTML = spriteIcon(iconId, { width: 20, height: 20 });

  // ── Información
  const info = document.createElement('div');
  info.className = 'alert-item-info';

  const titleEl = document.createElement('div');
  titleEl.className   = 'alert-item-card__title';
  titleEl.textContent = alerta.titulo;

  const descEl = document.createElement('div');
  descEl.className   = 'alert-item-card__desc';
  descEl.textContent = alerta.descripcion || '';

  // ── Meta (chip de color, badge de prioridad, badge de fecha)
  const meta = document.createElement('div');
  meta.className = 'alert-item-meta';

  const chip = document.createElement('span');
  chip.className = 'alert-color-chip';
  chip.setAttribute('aria-hidden', 'true');
  chip.setAttribute('title', 'Color de la alerta');
  // Inyectamos el color vía Custom Property (excepción válida para datos dinámicos)
  chip.style.setProperty('--chip-color', resolvedColor);

  const priorityBadge = document.createElement('span');
  priorityBadge.className   = `badge ${_priorityBadgeClass(alerta.prioridad)}`;
  priorityBadge.textContent = alerta.prioridad;

  // Badge de fecha con ícono SVG y clase modificadora según urgencia
  const dateBadge = document.createElement('span');
  dateBadge.className = `alert-date-badge ${dateInfo.cssClass}`;
  dateBadge.innerHTML = spriteIcon('timer', { width: 13, height: 13 }) + ` ${dateInfo.text}`;

  meta.appendChild(chip);
  meta.appendChild(priorityBadge);
  meta.appendChild(dateBadge);

  info.appendChild(titleEl);
  info.appendChild(descEl);
  info.appendChild(meta);

  // ── Acciones (completar / eliminar)
  const actions = document.createElement('div');
  actions.className = 'alert-item-actions';

  const btnComplete = document.createElement('button');
  btnComplete.type      = 'button';
  btnComplete.className = 'btn-alert-action btn-complete';
  btnComplete.title     = 'Marcar como Completado';
  btnComplete.setAttribute('aria-label', `Marcar "${alerta.titulo}" como completado`);
  btnComplete.dataset.jsAction = 'complete-alert';
  btnComplete.dataset.alertId  = alerta.id;
  btnComplete.innerHTML        = spriteIcon('check', { width: 15, height: 15 });

  const btnDelete = document.createElement('button');
  btnDelete.type      = 'button';
  btnDelete.className = 'btn-alert-action btn-delete';
  btnDelete.title     = 'Eliminar Alerta';
  btnDelete.setAttribute('aria-label', `Eliminar alerta "${alerta.titulo}"`);
  btnDelete.dataset.jsAction = 'delete-alert';
  btnDelete.dataset.alertId  = alerta.id;
  btnDelete.innerHTML        = spriteIcon('trash-2', { width: 15, height: 15 });

  actions.appendChild(btnComplete);
  actions.appendChild(btnDelete);

  card.appendChild(iconWrap);
  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

/**
 * Devuelve la clase BEM del badge de prioridad correspondiente al nivel dado.
 *
 * @param {string} prioridad - Nivel de prioridad ('alta', 'media', 'baja').
 * @returns {string} Clase CSS del badge.
 */
function _priorityBadgeClass(prioridad) {
  if (prioridad === 'alta')  return 'badge--danger';
  if (prioridad === 'media') return 'badge--warning';
  return 'badge--neutral';
}

// ── Cuota / Estado de Pago ───────────────────────────────────────────────────

/**
 * Renderiza el banner de estado de pago de la cuota del mes actual.
 * Aplica clases CSS modificadoras (`.alert--urgent`, `.alert--warn`, `.is-visible`)
 * en lugar de manipular estilos inline.
 *
 * @param {Object} estado - Estado de la cuota.
 * @param {boolean} estado.pagado - Si la cuota del mes ya fue pagada.
 * @param {string|null} estado.fecha_pago - Fecha del pago registrado.
 * @param {number} estado.dias_para_vencimiento - Días restantes hasta el día 15.
 * @param {string} estado.periodo - Período en formato YYYY-MM.
 * @param {number|null} [cuotaMontoVigente=null] - Monto vigente de la cuota.
 * @returns {void}
 */
export function renderEstadoPagoCuota(estado, cuotaMontoVigente = null) {
  const banner      = document.getElementById('cuota-pago-alert');
  const bannerTitle = document.getElementById('cuota-pago-alert-title');
  const bannerText  = document.getElementById('cuota-pago-alert-text');
  const info        = document.getElementById('cuota-pago-info');
  const btnPagar    = document.getElementById('btn-abrir-pago');

  if (!banner) return;

  if (estado.pagado) {
    banner.classList.remove('is-visible', 'alert--urgent', 'alert--warn');
    if (info)     info.textContent = `✓ Cuota de este mes pagada el ${formatDateStr(estado.fecha_pago)}.`;
    if (btnPagar) btnPagar.disabled = true;
    return;
  }

  if (btnPagar) btnPagar.disabled = false;
  if (info) info.textContent = 'Todavía no registraste el pago de este mes.';

  const urgente = estado.dias_para_vencimiento <= 3;

  banner.classList.remove('alert--urgent', 'alert--warn');
  banner.classList.add('is-visible', urgente ? 'alert--urgent' : 'alert--warn');

  if (bannerTitle) bannerTitle.textContent = urgente ? '¡Atención!' : 'Alerta de pago:';

  if (bannerText) {
    if (cuotaMontoVigente != null) {
      const montoConRecargo = (cuotaMontoVigente * 1.10).toLocaleString('es-AR', { minimumFractionDigits: 2 });
      bannerText.textContent = `Recordá que si el pago es luego del día 15 se debe pagar un 10% de recargo: $${montoConRecargo}.`;
    } else {
      bannerText.textContent = 'Recordá que si el pago es luego del día 15 se debe pagar un 10% de recargo.';
    }
  }
}

/**
 * Renderiza el campo de monto vigente de cuota y el aviso de próxima cuota.
 * Usa la clase `.is-visible` para mostrar/ocultar el aviso en vez de `style.display`.
 *
 * @param {Object} data - Respuesta de GET /api/cuotas.
 * @param {number|null} data.valor_mensual - Monto mensual vigente.
 * @param {Object|null} data.cuota_proxima - Próxima cuota programada (o null).
 * @returns {void}
 */
export function renderCuotaRecordatorio(data) {
  const input = document.getElementById('cuota-monto');
  if (!input) return;

  if (data.valor_mensual != null) {
    input.value = parseFloat(data.valor_mensual).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  }

  const proximaEl = document.getElementById('cuota-proxima-notice');
  if (!proximaEl) return;

  if (data.cuota_proxima) {
    const monto  = parseFloat(data.cuota_proxima.valor_mensual).toLocaleString('es-AR', { minimumFractionDigits: 2 });
    const partes = data.cuota_proxima.vigente_desde.split('T')[0].split('-');
    const fecha  = `${partes[2]}/${partes[1]}/${partes[0]}`;
    proximaEl.textContent = `A partir del ${fecha} la cuota será $${monto}`;
    proximaEl.classList.add('is-visible');
  } else {
    proximaEl.classList.remove('is-visible');
  }
}

// ── Historial de Cuotas ──────────────────────────────────────────────────────

/**
 * Genera el badge HTML de estado de un pago de cuota.
 *
 * @param {Object} pago - Objeto de pago con `estado` y `medio_pago`.
 * @returns {string} HTML del badge de estado.
 */
export function cuotaBadge(pago) {
  if (pago.estado === 'pagado') {
    const medio = pago.medio_pago === 'efectivo' ? ' (efectivo)' : '';
    return `<span class="badge badge--success">Pagó${medio}</span>`;
  }
  if (pago.estado === 'pendiente_efectivo') {
    return '<span class="badge badge--warning">Efectivo, a confirmar</span>';
  }
  return '<span class="badge badge--neutral">Pendiente</span>';
}

/**
 * Popula el selector de año del historial de cuotas.
 *
 * @param {number|string} anioActual - Año seleccionado actualmente.
 * @param {Array<number|string>} aniosDisponibles - Lista de años disponibles.
 * @returns {void}
 */
export function renderSelectorAnioHistorial(anioActual, aniosDisponibles) {
  const select = document.getElementById('cuota-historial-anio');
  if (!select) return;

  select.innerHTML = '';
  (aniosDisponibles || [anioActual]).forEach(a => {
    const opt = document.createElement('option');
    opt.value       = a;
    opt.textContent = `Ciclo ${a}`;
    select.appendChild(opt);
  });
  select.value = anioActual;
}

/**
 * Renderiza la lista de filas del historial de cuotas con sus acciones.
 * Los botones de acción usan atributos `data-js-action` y `data-periodo` / `data-id`
 * para que el Event Delegation en `alertas-main.js` procese los eventos.
 *
 * @param {Array<Object>} historialCuotas - Array de objetos de pago de cuota.
 * @returns {void}
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

    const montoExigible = pago.monto_exigible != null ? pago.monto_exigible : pago.monto_base;
    const fmtMonto      = (v) => '$' + parseFloat(v).toLocaleString('es-AR', { minimumFractionDigits: 2 });

    // Calcular el monto a mostrar (con indicadores de discrepancia)
    let montoHtml;
    if (pago.monto_declarado != null && pago.estado !== 'pendiente') {
      const declarado = fmtMonto(pago.monto_declarado);
      if (pago.coincide_monto === false) {
        const exigidoLabel = montoExigible != null ? fmtMonto(montoExigible) : '—';
        montoHtml = `<span class="chr-monto-discrepancia" title="Lo exigido era ${exigidoLabel}">${declarado} ✗</span>`;
      } else if (pago.coincide_monto === true) {
        montoHtml = `${declarado} ✓`;
      } else {
        montoHtml = declarado;
      }
    } else {
      montoHtml = montoExigible != null ? fmtMonto(montoExigible) : '—';
    }

    // Construir botones de acción sin onclick
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'chr-actions';

    if (pago.estado === 'pendiente') {
      const btnPagar = document.createElement('button');
      btnPagar.type      = 'button';
      btnPagar.className = 'btn btn--pay btn--sm';
      btnPagar.innerHTML = '<span>Registrar <span class="u-hidden-mobile">Pago</span></span>';
      btnPagar.dataset.jsAction = 'open-pago-modal';
      btnPagar.dataset.periodo  = pago.periodo;
      actionsWrap.appendChild(btnPagar);
    } else {
      const btnEditar = document.createElement('button');
      btnEditar.type        = 'button';
      btnEditar.className   = 'btn btn--secondary btn--sm';
      btnEditar.textContent = 'Editar';
      btnEditar.dataset.jsAction = 'open-pago-modal';
      btnEditar.dataset.periodo  = pago.periodo;
      actionsWrap.appendChild(btnEditar);
    }

    if (pago.tiene_comprobante) {
      const btnVer = document.createElement('button');
      btnVer.type        = 'button';
      btnVer.className   = 'btn btn--secondary btn--sm';
      btnVer.textContent = 'Ver comprobante';
      btnVer.dataset.jsAction = 'ver-comprobante';
      btnVer.dataset.pagoId   = pago.id;
      actionsWrap.appendChild(btnVer);
    }

    row.innerHTML = `
      <div class="chr-periodo">${formatPeriodoCuota(pago.periodo)}</div>
      ${cuotaBadge(pago)}
      <div class="chr-monto">${montoHtml}</div>
    `;
    row.appendChild(actionsWrap);
    list.appendChild(row);
  });
}

// ── View Toggle ──────────────────────────────────────────────────────────────

/**
 * Actualiza el estado visual de los botones y paneles de vista (lista/calendario).
 * Usa la clase `.hidden` del sistema global de utilidades en vez de `style.display`.
 *
 * @param {'list'|'calendar'} view - Vista activa.
 * @returns {void}
 */
export function updateViewToggle(view) {
  const btnList  = document.getElementById('btn-view-list');
  const btnCal   = document.getElementById('btn-view-calendar');
  const viewList = document.getElementById('view-list');
  const viewCal  = document.getElementById('view-calendar');

  if (!btnList || !btnCal || !viewList || !viewCal) return;

  const isList = view === 'list';

  btnList.classList.toggle('active', isList);
  btnList.setAttribute('aria-selected', String(isList));
  btnCal.classList.toggle('active',  !isList);
  btnCal.setAttribute('aria-selected', String(!isList));

  viewList.classList.toggle('hidden', !isList);
  viewCal.classList.toggle('hidden',  isList);
}

// ── Paleta de colores ────────────────────────────────────────────────────────

/**
 * Inicializa la paleta de swatches de color para el formulario de alertas.
 * Asigna roles ARIA y listeners de selección. Los colores de fondo de cada swatch
 * están definidos en CSS por selector de atributo (`data-color`).
 *
 * @param {string} defaultColor - Color hexadecimal a pre-seleccionar.
 * @returns {void}
 */
export function setupColorPalette(defaultColor) {
  const colorInput = document.getElementById('alert-color');
  const swatches   = Array.from(document.querySelectorAll('.alert-color-swatch'));
  if (!colorInput || swatches.length === 0) return;

  /**
   * Selecciona un color: actualiza el input oculto y los estados ARIA/CSS de los swatches.
   * @param {string} color - Color hexadecimal a seleccionar.
   */
  const selectColor = (color) => {
    const normalized = (color || '').toLowerCase();
    colorInput.value = normalized;

    swatches.forEach(swatch => {
      const isSelected = swatch.dataset.color.toLowerCase() === normalized;
      swatch.classList.toggle('selected', isSelected);
      swatch.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
  };

  swatches.forEach(swatch => {
    swatch.setAttribute('role',         'radio');
    swatch.setAttribute('aria-checked', 'false');
    swatch.addEventListener('click', () => selectColor(swatch.dataset.color));
  });

  selectColor(colorInput.value || defaultColor);
}

// ── Legacy Global Export ─────────────────────────────────────────────────────

window.AlertasRender = {
  renderNavBadge,
  renderListView,
  renderEstadoPagoCuota,
  renderCuotaRecordatorio,
  cuotaBadge,
  renderSelectorAnioHistorial,
  renderHistorialCuotas,
  updateViewToggle,
  setupColorPalette,
};
