// Cursus - Módulo de Alertas y Vencimientos (persistido por usuario en la BD)

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CATEGORY_DEFAULT_COLOR = {
  academic: '#2563eb',
  administrative: '#f97316',
  personal: '#10b981'
};

const ALERT_COLOR_PALETTE = [
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


// Estado global de la aplicación
let state = {
  view: 'list', // list or calendar
  alerts: [],
  calendar: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: todayDateStr()
  },
  cuotaMontoVigente: null,
  historialCuotas: [],
  pagoPeriodo: null,
  pagoMedio: 'transferencia'
};

const MESES_CUOTA = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatPeriodoCuota(periodo) {
  const [y, m] = periodo.split('-');
  return `${MESES_CUOTA[parseInt(m, 10) - 1]} ${y}`;
}

// Inicialización de la página
document.addEventListener('DOMContentLoaded', async () => {
  await loadAlertas();
  updateUI();
  await loadRecordatorioCuota();
  loadEstadoPagoCuota();
  loadHistorialCuotas();

  const dateInput = document.getElementById('alert-date');
  if (dateInput) dateInput.value = todayDateStr();

  // Refrescar cuota si el admin la cambió mientras la pestaña estaba en segundo plano
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadRecordatorioCuota();
  });

  const colorInput = document.getElementById('alert-color');
  if (colorInput) colorInput.value = ALERT_COLOR_PALETTE[0];

  setupColorPalette();
});

function setupColorPalette() {
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

  selectColor(colorInput.value || ALERT_COLOR_PALETTE[0]);
}

async function loadAlertas() {
  try {
    const response = await fetch(`${API_BASE}/alertas`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar las alertas');
    state.alerts = await response.json();
  } catch (e) {
    console.error(e);
    state.alerts = [];
  }
}

// Carga el monto vigente fijado por el admin y lo muestra como solo lectura.
async function loadRecordatorioCuota() {
  const input = document.getElementById('cuota-monto');
  if (!input) return;

  try {
    const response = await fetch(`${API_BASE}/cuotas`, { headers: getAuthHeaders() });
    if (!response.ok) return;
    const data = await response.json();
    if (data.valor_mensual != null) {
      state.cuotaMontoVigente = parseFloat(data.valor_mensual);
      input.value = state.cuotaMontoVigente.toLocaleString('es-AR', { minimumFractionDigits: 2 });
    }

    const proximaEl = document.getElementById('cuota-proxima-notice');
    if (proximaEl) {
      if (data.cuota_proxima) {
        const monto  = parseFloat(data.cuota_proxima.valor_mensual).toLocaleString('es-AR', { minimumFractionDigits: 2 });
        const partes = data.cuota_proxima.vigente_desde.split('T')[0].split('-');
        const fecha  = `${partes[2]}/${partes[1]}/${partes[0]}`;
        proximaEl.textContent    = `A partir del ${fecha} la cuota será $${monto}`;
        proximaEl.style.display  = 'block';
      } else {
        proximaEl.style.display = 'none';
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// Aviso de pago de la cuota: aparece a partir del 1° de cada mes y desaparece
// recién cuando se registra el pago de ese mes (el backend resetea esto solo,
// no hace falta ningún cron: cada mes es un "período" nuevo sin pago todavía).
async function loadEstadoPagoCuota() {
  try {
    const response = await fetch(`${API_BASE}/pagos-cuota/estado`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudo cargar el estado de la cuota');
    const estado = await response.json();
    state.pagoPeriodo = estado.periodo;
    renderEstadoPagoCuota(estado);
  } catch (e) {
    console.error(e);
  }
}

function renderEstadoPagoCuota(estado) {
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

  // Mensaje fijo (no varía según los días restantes): recuerda siempre el
  // recargo del 10% con el monto ya calculado, para que quede claro cuánto
  // hay que pagar si se abona después del día 15.
  if (state.cuotaMontoVigente != null) {
    const montoConRecargo = (state.cuotaMontoVigente * 1.10).toLocaleString('es-AR', { minimumFractionDigits: 2 });
    bannerText.textContent = `Recordá que si el pago es luego del día 15 se debe pagar un 10% de recargo: $${montoConRecargo}.`;
  } else {
    bannerText.textContent = `Recordá que si el pago es luego del día 15 se debe pagar un 10% de recargo.`;
  }
}

// Carga el historial de UN ciclo (año) por vez — por default el actual, para
// no mostrarle de entrada 30 meses acumulados a alumnos con varios años de
// cursada. `anio` opcional para cambiar de ciclo desde el selector.
async function loadHistorialCuotas(anio) {
  try {
    const qs = anio ? `?anio=${encodeURIComponent(anio)}` : '';
    const response = await fetch(`${API_BASE}/pagos-cuota/historial${qs}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudo cargar el historial de cuotas');
    const data = await response.json();
    state.historialCuotas = data.cuotas;
    renderSelectorAnioHistorial(data.anio, data.anios_disponibles);
    renderHistorialCuotas();
  } catch (e) {
    console.error(e);
    const list = document.getElementById('cuota-historial-list');
    if (list) list.innerHTML = '<div class="chr-empty">No se pudo cargar el historial.</div>';
  }
}

function renderSelectorAnioHistorial(anioActual, aniosDisponibles) {
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

window.cambiarAnioHistorial = function(anio) {
  loadHistorialCuotas(anio);
};

function cuotaBadge(pago) {
  if (pago.estado === 'pagado') {
    const medio = pago.medio_pago === 'efectivo' ? ' (efectivo)' : '';
    return `<span class="aa-badge badge-aprobada">Pagó${medio}</span>`;
  }
  if (pago.estado === 'pendiente_efectivo') {
    return '<span class="aa-badge badge-regular">Efectivo, a confirmar</span>';
  }
  return '<span class="aa-badge badge-libre">Pendiente</span>';
}

function renderHistorialCuotas() {
  const list = document.getElementById('cuota-historial-list');
  if (!list) return;

  if (state.historialCuotas.length === 0) {
    list.innerHTML = '<div class="chr-empty">Todavía no hay cuotas generadas para este ciclo.</div>';
    return;
  }

  list.innerHTML = '';
  state.historialCuotas.forEach(pago => {
    const row = document.createElement('div');
    row.className = 'chr-row';

    const monto = pago.monto_exigible != null
      ? '$' + parseFloat(pago.monto_exigible).toLocaleString('es-AR', { minimumFractionDigits: 2 })
      : (pago.monto_base != null ? '$' + parseFloat(pago.monto_base).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '—');

    let acciones = '';
    if (pago.estado === 'pendiente') {
      acciones += `<button class="chr-btn-pagar" onclick="window.openPagoModal('${pago.periodo}')">Pagar</button>`;
    } else {
      // Ya declaró el pago (transferencia o efectivo) — permitir corregirlo
      // por si se equivocó de archivo, de fecha o de medio de pago.
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

window.verMiComprobante = async function(id) {
  try {
    const response = await fetch(`${API_BASE}/pagos-cuota/${id}/comprobante`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudo abrir el comprobante');
    const blob = await response.blob();
    window.open(URL.createObjectURL(blob), '_blank');
  } catch (e) {
    console.error(e);
    showToast('No se pudo abrir el comprobante.', 'error');
  }
};

window.pagoSeleccionarMedio = function(medio) {
  state.pagoMedio = medio;
  document.querySelectorAll('.pago-medio-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.medio === medio);
  });
  document.getElementById('pago-transferencia-fields').hidden = medio !== 'transferencia';
  document.getElementById('pago-efectivo-fields').hidden = medio !== 'efectivo';
};

// Mensaje fijo (no depende de la fecha elegida): mismo recordatorio del
// recargo que se muestra en el banner, para que quede claro al pagar o editar.
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

window.openPagoModal = function(periodo) {
  state.pagoPeriodo = periodo || state.pagoPeriodo;

  // Si ya había un pago declarado para este período (se está editando), se
  // precarga la fecha y el medio que había usado antes.
  const existente = state.historialCuotas.find(p => p.periodo === state.pagoPeriodo);
  const label = state.pagoPeriodo ? formatPeriodoCuota(state.pagoPeriodo) : '';
  document.getElementById('pago-periodo-label').textContent = existente ? `Editar — ${label}` : label;
  document.getElementById('pago-comprobante').value = '';
  document.getElementById('pago-recibo').value = '';
  window.pagoSeleccionarMedio(existente?.medio_pago === 'efectivo' ? 'efectivo' : 'transferencia');
  window.pagoActualizarPreview();
  document.getElementById('pago-cuota-modal').classList.add('open');
};

window.closePagoModal = function() {
  document.getElementById('pago-cuota-modal').classList.remove('open');
};

window.confirmarPago = async function() {
  if (!state.pagoPeriodo) {
    showToast('No se encontró el período a pagar.', 'error');
    return;
  }

  const btn = document.getElementById('pago-btn-confirmar');
  btn.disabled = true;
  btn.textContent = 'Guardando…';

  try {
    const formData = new FormData();

    let url;
    if (state.pagoMedio === 'efectivo') {
      const recibo = document.getElementById('pago-recibo').files[0];
      if (!recibo) {
        showToast('Adjuntá la foto del recibo de tesorería.', 'warn');
        return;
      }
      formData.append('recibo', recibo);
      url = `${API_BASE}/pagos-cuota/${state.pagoPeriodo}/efectivo`;
    } else {
      const comprobante = document.getElementById('pago-comprobante').files[0];
      if (!comprobante) {
        showToast('Adjuntá el comprobante de la transferencia.', 'warn');
        return;
      }
      formData.append('comprobante', comprobante);
      url = `${API_BASE}/pagos-cuota/${state.pagoPeriodo}/comprobante`;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'No se pudo registrar el pago');

    window.closePagoModal();
    await Promise.all([loadEstadoPagoCuota(), loadHistorialCuotas()]);

    showToast(
      state.pagoMedio === 'efectivo'
        ? 'Pago en efectivo declarado. Quedará confirmado cuando la secretaría lo revise.'
        : 'Comprobante subido con éxito.',
      'success'
    );
  } catch (e) {
    console.error(e);
    showToast(e.message || 'No se pudo registrar el pago. Intentá de nuevo.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar';
  }
};

// Alternador de vistas (Lista / Calendario)
window.switchView = function(viewType) {
  state.view = viewType;

  const btnList = document.getElementById('btn-view-list');
  const btnCal = document.getElementById('btn-view-calendar');
  const viewList = document.getElementById('view-list');
  const viewCal = document.getElementById('view-calendar');

  if (viewType === 'list') {
    btnList.classList.add('active');
    btnCal.classList.remove('active');
    viewList.style.display = 'flex';
    viewCal.style.display = 'none';
  } else {
    btnList.classList.remove('active');
    btnCal.classList.add('active');
    viewList.style.display = 'none';
    viewCal.style.display = 'block';
    renderCalendar();
  }
};

// Completar alerta individual
window.completeAlert = async function(id) {
  const alerta = state.alerts.find(a => a.id === id);
  if (alerta) alerta.completada = true;
  updateUI();

  try {
    await fetch(`${API_BASE}/alertas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ completada: true })
    });
    showToast('Alerta marcada como completada.', 'success');
  } catch (e) {
    console.error('No se pudo marcar la alerta como completada', e);
    showToast('No se pudo completar la alerta.', 'error');
  }
};

// Eliminar alerta individual
window.deleteAlert = async function(id) {
  state.alerts = state.alerts.filter(alerta => alerta.id !== id);
  updateUI();

  try {
    await fetch(`${API_BASE}/alertas/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    showToast('Alerta eliminada.', 'success');
  } catch (e) {
    console.error('No se pudo eliminar la alerta', e);
    showToast('No se pudo eliminar la alerta.', 'error');
  }
};

// Enviar formulario de carga de alertas
window.handleAlertSubmit = async function(event) {
  event.preventDefault();

  const titulo = document.getElementById('alert-title').value.trim();
  const categoria = document.getElementById('alert-type').value;
  const prioridad = document.getElementById('alert-priority').value;
  const fecha = document.getElementById('alert-date').value;
  const color = (document.getElementById('alert-color').value || '').trim();
  if (!titulo || !fecha) return;

  try {
    const response = await fetch(`${API_BASE}/alertas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        titulo,
        categoria,
        prioridad,
        fecha,
        color,
        descripcion: `Cargada manualmente para la fecha límite ${formatDateStr(fecha)}.`
      })
    });
    if (!response.ok) throw new Error('No se pudo crear la alerta');
    const nuevaAlerta = await response.json();
    state.alerts.push(nuevaAlerta);
    updateUI();

    document.getElementById('alert-title').value = '';
    document.getElementById('alert-type').value = 'academic';
    document.getElementById('alert-priority').value = 'alta';
    document.getElementById('alert-date').value = todayDateStr();
    const colorInput = document.getElementById('alert-color');
    if (colorInput) colorInput.value = ALERT_COLOR_PALETTE[0];
    setupColorPalette();

    showToast('Alerta creada con éxito.', 'success');
  } catch (e) {
    console.error(e);
    showToast('No se pudo guardar la alerta. Intentá de nuevo.', 'error');
  }
};

// Formatear fechas para mostrar en pantalla
function formatDateStr(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Calcular días de diferencia desde hoy (fecha real del sistema)
function getDaysDifference(alertDateStr) {
  const today = new Date();
  const alertDate = new Date(alertDateStr + 'T00:00:00');
  const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dAlert = new Date(alertDate.getFullYear(), alertDate.getMonth(), alertDate.getDate());

  const diffTime = dAlert - dToday;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Actualizar todo el UI
function updateUI() {
  const filteredAlerts = state.alerts.filter(alerta => !alerta.completada);

  // El badge de la navegación cuenta solo las alertas de esta semana (próximos 7 días),
  // que son las que más prioridad deberían tener.
  const badgeCount = filteredAlerts.filter(a => getDaysDifference(a.fecha) <= 7).length;
  const navBadge = document.getElementById('nav-badge-count');
  const bnavBadge = document.getElementById('bnav-badge-count');
  if (navBadge) navBadge.innerText = badgeCount;
  if (bnavBadge) bnavBadge.innerText = badgeCount;

  if (state.view === 'list') {
    renderListView(filteredAlerts);
  } else {
    renderCalendar();
  }

  const btnList = document.getElementById('btn-view-list');
  const btnCal = document.getElementById('btn-view-calendar');
  if (state.view === 'list') {
    btnList.classList.add('active');
    btnCal.classList.remove('active');
    document.getElementById('view-list').style.display = 'flex';
    document.getElementById('view-calendar').style.display = 'none';
  } else {
    btnList.classList.remove('active');
    btnCal.classList.add('active');
    document.getElementById('view-list').style.display = 'none';
    document.getElementById('view-calendar').style.display = 'block';
  }
}

// Renderizar la vista de agenda / lista
function renderListView(activeAlerts) {
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

function categoriaIcon(categoria) {
  if (categoria === 'academic') return '📝';
  if (categoria === 'administrative') return '💼';
  if (categoria === 'personal') return '🎯';
  return '📌';
}

// Crear elemento tarjeta de alerta HTML
function createAlertCardHTML(alerta, diffDays) {
  const card = document.createElement('div');
  card.className = 'alert-item-card';
  const resolvedColor = resolveAlertColor(alerta);

  let dateText = '';
  let dateClass = '';
  if (diffDays < 0) {
    dateText = `Vencido hace ${Math.abs(diffDays)} días`;
    dateClass = 'style="color: var(--red); font-weight: 600;"';
  } else if (diffDays === 0) {
    dateText = 'Vence hoy 📅';
    dateClass = 'style="color: var(--red); font-weight: 600;"';
  } else if (diffDays === 1) {
    dateText = 'Vence mañana ⏰';
    dateClass = 'style="color: var(--orange); font-weight: 600;"';
  } else {
    dateText = `En ${diffDays} días (${formatDateStr(alerta.fecha)})`;
    dateClass = 'style="color: var(--t2);"';
  }

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
        <span class="alert-date-badge" ${dateClass}>
          ⏱️ ${dateText}
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

// ==========================================
// LÓGICA DEL CALENDARIO MENSUAL
// ==========================================

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

window.changeMonth = function(direction) {
  state.calendar.month += direction;
  if (state.calendar.month < 0) {
    state.calendar.month = 11;
    state.calendar.year -= 1;
  } else if (state.calendar.month > 11) {
    state.calendar.month = 0;
    state.calendar.year += 1;
  }
  renderCalendar();
};

function renderCalendar() {
  const container = document.getElementById('calendar-days-container');
  if (!container) return;

  container.innerHTML = '';

  const year = state.calendar.year;
  const month = state.calendar.month;
  const today = new Date();

  document.getElementById('calendar-month-title').innerText = `${MONTH_NAMES[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  for (let i = firstDayIndex; i > 0; i--) {
    const dayVal = prevTotalDays - i + 1;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerText = dayVal;
    container.appendChild(cell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';

    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;

    const esHoy = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
    if (esHoy) {
      cell.classList.add('today');
      cell.innerHTML = `${day}<span class="calendar-day-today-tag">Hoy</span>`;
    } else {
      cell.innerText = day;
    }

    if (state.calendar.selectedDate === dateStr) {
      cell.classList.add('selected');
    }

    const dayAlerts = state.alerts.filter(a => a.fecha === dateStr && !a.completada);

    if (dayAlerts.length > 0) {
      cell.classList.add('has-alerts');

      const colors = dayAlerts.map(resolveAlertColor);
      const dayPaint = buildDaySplitBackground(colors);
      // Capa blanca suave para que el número del día se siga leyendo aunque el color sea intenso.
      cell.style.backgroundImage = `linear-gradient(rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.38)), ${dayPaint}`;
    }

    cell.onclick = (e) => {
      e.stopPropagation();
      const prevSelected = container.querySelector('.calendar-day-cell.selected');
      if (prevSelected) prevSelected.classList.remove('selected');

      cell.classList.add('selected');
      state.calendar.selectedDate = dateStr;

      toggleDayPopover(cell, dateStr, dayAlerts);
    };

    container.appendChild(cell);
  }

  const totalCells = container.children.length;
  const remainingCells = 42 - totalCells;
  for (let i = 1; i <= remainingCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerText = i;
    container.appendChild(cell);
  }
}

function resolveAlertColor(alerta) {
  return alerta.color || CATEGORY_DEFAULT_COLOR[alerta.categoria] || '#2563eb';
}

function buildDaySplitBackground(colors) {
  if (colors.length === 1) {
    return `linear-gradient(${colors[0]}, ${colors[0]})`;
  }

  const step = 100 / colors.length;
  const stops = colors
    .map((color, index) => {
      const start = (index * step).toFixed(3);
      const end = ((index + 1) * step).toFixed(3);
      return `${color} ${start}% ${end}%`;
    })
    .join(', ');

  return `conic-gradient(${stops})`;
}

// Al tocar un día con alertas, se abre un detalle anclado a esa misma celda
// (en vez de un cuadro fijo debajo de todo el calendario). Tocar de nuevo lo cierra.
function toggleDayPopover(cell, dateStr, dayAlerts) {
  const yaAbierto = cell.querySelector('.calendar-day-popover') !== null;

  document.querySelectorAll('.calendar-day-popover').forEach(p => p.remove());

  if (yaAbierto || dayAlerts.length === 0) return;

  const popover = document.createElement('div');
  popover.className = 'calendar-day-popover';
  popover.onclick = (e) => e.stopPropagation();

  let html = `<div class="calendar-day-popover-title">${formatDateStr(dateStr)}</div>`;
  dayAlerts.forEach(alerta => {
    html += `
      <div class="calendar-day-popover-item">
        <div class="alert-icon-wrap alert-icon-${alerta.categoria}" style="width: 26px; height: 26px; font-size: 13px;">
          ${categoriaIcon(alerta.categoria)}
        </div>
        <div class="calendar-day-popover-info">
          <div class="calendar-day-popover-titulo">${alerta.titulo}</div>
          <span class="alert-priority-badge alert-priority-${alerta.prioridad}" style="font-size: 8.5px; padding: 1px 5px;">${alerta.prioridad}</span>
        </div>
        <button class="btn-alert-action btn-complete" style="width: 24px; height: 24px; font-size: 10px;" onclick="event.stopPropagation(); window.completeAlert(${alerta.id})">✓</button>
      </div>
    `;
  });
  popover.innerHTML = html;
  cell.appendChild(popover);
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.calendar-day-cell')) {
    document.querySelectorAll('.calendar-day-popover').forEach(p => p.remove());
  }
});
