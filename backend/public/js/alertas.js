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

// Estado global de la aplicación
let state = {
  view: 'list', // list or calendar
  alerts: [],
  calendar: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: todayDateStr()
  }
};

// Inicialización de la página
document.addEventListener('DOMContentLoaded', async () => {
  await loadAlertas();
  updateUI();
  loadRecordatorioCuota();
  loadEstadoPagoCuota();

  const dateInput = document.getElementById('alert-date');
  if (dateInput) dateInput.value = todayDateStr();
});

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

// Recordatorio personal de cuota: un único valor por usuario que se actualiza
// (nunca crea una alerta/registro nuevo cada mes, siempre pisa el mismo monto).
async function loadRecordatorioCuota() {
  const input = document.getElementById('cuota-monto');
  if (!input) return;

  try {
    const response = await fetch(`${API_BASE}/recordatorio-cuota`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudo cargar el recordatorio de cuota');
    const data = await response.json();
    if (data.monto !== null) input.value = data.monto;
  } catch (e) {
    console.error(e);
  }
}

window.handleCuotaSubmit = async function(event) {
  event.preventDefault();

  const monto = document.getElementById('cuota-monto').value;
  if (monto === '') return;

  try {
    const response = await fetch(`${API_BASE}/recordatorio-cuota`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ monto })
    });
    if (!response.ok) throw new Error('No se pudo guardar el monto');

    alert('¡Monto de la cuota actualizado!');
  } catch (e) {
    console.error(e);
    alert('No se pudo guardar el monto. Intentá de nuevo.');
  }
};

// Aviso de pago de la cuota: aparece a partir del 1° de cada mes y desaparece
// recién cuando se registra el pago de ese mes (el backend resetea esto solo,
// no hace falta ningún cron: cada mes es un "período" nuevo sin pago todavía).
async function loadEstadoPagoCuota() {
  try {
    const response = await fetch(`${API_BASE}/pagos-cuota/estado`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudo cargar el estado de la cuota');
    const estado = await response.json();
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

  if (dias < 0) {
    bannerText.textContent = `Ya pasó el día 15: la cuota de este mes está vencida y puede tener recargos. Todavía no registraste el pago.`;
  } else if (dias === 0) {
    bannerText.textContent = `Hoy es el último día para pagar la cuota sin recargos.`;
  } else if (urgente) {
    bannerText.textContent = `Quedan ${dias} día${dias !== 1 ? 's' : ''} para pagar la cuota sin recargos (vence el 15).`;
  } else {
    bannerText.textContent = `Todavía no pagaste la cuota de este mes. Vence el día 15.`;
  }
}

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
    alert('Elegí una fecha de pago.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/pagos-cuota`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fecha_pago: fecha })
    });
    if (!response.ok) throw new Error('No se pudo registrar el pago');

    const estado = await response.json();
    renderEstadoPagoCuota(estado);
    window.closePagoModal();
    alert('¡Pago registrado con éxito!');
  } catch (e) {
    console.error(e);
    alert('No se pudo registrar el pago. Intentá de nuevo.');
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
  } catch (e) {
    console.error('No se pudo marcar la alerta como completada', e);
  }
};

// Eliminar alerta individual
window.deleteAlert = async function(id) {
  state.alerts = state.alerts.filter(alerta => alerta.id !== id);
  updateUI();

  try {
    await fetch(`${API_BASE}/alertas/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  } catch (e) {
    console.error('No se pudo eliminar la alerta', e);
  }
};

// Enviar formulario de carga de alertas
window.handleAlertSubmit = async function(event) {
  event.preventDefault();

  const titulo = document.getElementById('alert-title').value.trim();
  const categoria = document.getElementById('alert-type').value;
  const prioridad = document.getElementById('alert-priority').value;
  const fecha = document.getElementById('alert-date').value;
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

    alert('¡Alerta programada con éxito!');
  } catch (e) {
    console.error(e);
    alert('No se pudo guardar la alerta. Intentá de nuevo.');
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
    cell.innerText = day;

    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;

    if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
      cell.classList.add('today');
    }

    if (state.calendar.selectedDate === dateStr) {
      cell.classList.add('selected');
    }

    const dayAlerts = state.alerts.filter(a => a.fecha === dateStr && !a.completada);

    if (dayAlerts.length > 0) {
      cell.classList.add('has-alerts');

      const dotsRow = document.createElement('div');
      dotsRow.className = 'calendar-dots-row';

      const categorias = [...new Set(dayAlerts.map(a => a.categoria))].slice(0, 3);
      categorias.forEach(cat => {
        const dot = document.createElement('div');
        dot.className = `dot dot-${cat}`;
        dotsRow.appendChild(dot);
      });
      cell.appendChild(dotsRow);
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
