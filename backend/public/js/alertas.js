// Cursus - Módulo de Alertas y Vencimientos (UTN Haedo)

// Definir fecha simulada del sistema: 12 de Junio de 2026
const SIMULATED_TODAY = new Date(2026, 5, 12); // 12/06/2026

// Estado global de la aplicación
let state = {
  career: 'TUP', // Default: Tecnicatura en Programación
  tuitionPaid: false,
  view: 'list', // list or calendar
  alerts: [],
  payments: [],
  calendar: {
    year: 2026,
    month: 5, // Junio (0-indexed)
    selectedDate: '2026-06-12'
  }
};

// Alertas por defecto (mock)
const DEFAULT_ALERTS = [
  {
    id: 'a1',
    category: 'payment',
    title: 'Pago Cuota Mensual N°4',
    description: 'Vencimiento cuota mensual regular ($80.000). Evita recargos abonando antes del 15.',
    date: '2026-06-15',
    priority: 'alta',
    completed: false
  },
  {
    id: 'a2',
    category: 'academic',
    title: 'Segundo Parcial - Programación II',
    description: 'Temas: Listas enlazadas, árboles, recursividad. Aula 302 a las 19:00 hs.',
    date: '2026-06-16',
    priority: 'alta',
    completed: false
  },
  {
    id: 'a3',
    category: 'academic',
    title: 'Entrega TP N°3 - Laboratorio II',
    description: 'Subir código al repositorio Git y subir informe PDF al aula virtual.',
    date: '2026-06-19',
    priority: 'alta',
    completed: false
  },
  {
    id: 'a4',
    category: 'administrative',
    title: 'Presentación de Libre Deuda',
    description: 'Fecha límite para entregar certificado de libre deuda en secretaría de alumnos.',
    date: '2026-06-23',
    priority: 'media',
    completed: false
  },
  {
    id: 'a5',
    category: 'academic',
    title: 'Inscripción a Finales (Turno Julio)',
    description: 'Apertura del sistema SIU Guaraní para inscripción a mesas de examen.',
    date: '2026-06-29',
    priority: 'alta',
    completed: false
  },
  {
    id: 'a6',
    category: 'administrative',
    title: 'Entrega de Planilla Médica (Apto Físico)',
    description: 'Presentar en el gimnasio o secretaría académica para actividades físicas.',
    date: '2026-07-05',
    priority: 'baja',
    completed: false
  }
];

// Historial de pagos por defecto (mock)
const DEFAULT_PAYMENTS = [
  { id: 'p1', title: 'Matrícula Anual 2026', date: '05/03/2026', amount: '$50.000' },
  { id: 'p2', title: 'Cuota 1 - Marzo', date: '12/03/2026', amount: '$75.000' },
  { id: 'p3', title: 'Cuota 2 - Abril', date: '10/04/2026', amount: '$75.000' },
  { id: 'p4', title: 'Cuota 3 - Mayo', date: '14/05/2026', amount: '$75.000' }
];

// Inicialización de la página
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initCareerDropdowns();
  updateUI();
  
  // Establecer fecha por defecto en el formulario de creación de alertas
  // Asegurar que sea en el rango de junio 2026
  document.getElementById('alert-date').value = '2026-06-15';
});

// Guardar y cargar estado en LocalStorage
function saveState() {
  localStorage.setItem('cursus_alerts_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('cursus_alerts_state');
  if (saved) {
    state = JSON.parse(saved);
  } else {
    // Si es la primera vez, cargar valores por defecto
    state.alerts = [...DEFAULT_ALERTS];
    state.payments = [...DEFAULT_PAYMENTS];
    state.career = 'TUP';
    state.tuitionPaid = false;
    state.view = 'list';
    saveState();
  }
}

// Inicializar selectores de carrera (sincronizar desktop y mobile)
function initCareerDropdowns() {
  const selectDesk = document.getElementById('career-select-desk');
  const selectMob = document.getElementById('career-select-mob');
  
  if (selectDesk) selectDesk.value = state.career;
  if (selectMob) selectMob.value = state.career;
}

// Handler para el cambio de carrera (desde TUP/TUSI a Ingenierías)
window.handleCareerChange = function(careerVal) {
  state.career = careerVal;
  
  // Sincronizar los dos selects
  const selectDesk = document.getElementById('career-select-desk');
  const selectMob = document.getElementById('career-select-mob');
  if (selectDesk) selectDesk.value = careerVal;
  if (selectMob) selectMob.value = careerVal;
  
  saveState();
  updateUI();
};

// Alternador de vistas (Lista / Calendario)
window.switchView = function(viewType) {
  state.view = viewType;
  saveState();
  
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

// Simular pago de cuota
window.simulatePayment = function() {
  if (state.tuitionPaid) return;
  
  state.tuitionPaid = true;
  
  // Agregar al historial de pagos
  const newPayment = {
    id: 'pay_' + Date.now(),
    title: 'Cuota 4 - Junio',
    date: '12/06/2026', // Fecha simulada de pago
    amount: '$80.000'
  };
  state.payments.unshift(newPayment);
  
  // Marcar la alerta de pago correspondiente como completada
  state.alerts = state.alerts.map(alert => {
    if (alert.category === 'payment' && alert.title.includes('Cuota Mensual N°4')) {
      return { ...alert, completed: true };
    }
    return alert;
  });
  
  saveState();
  updateUI();
  
  // Animación / Mensaje temporal
  alert('¡Pago de Cuota Procesado con Éxito!\nSe ha registrado en tu historial de pagos.');
};

// Completar alerta individual
window.completeAlert = function(id) {
  state.alerts = state.alerts.map(alert => {
    if (alert.id === id) {
      // Si completamos la cuota, también marcar pago como hecho
      if (alert.category === 'payment' && alert.title.includes('Cuota Mensual N°4')) {
        state.tuitionPaid = true;
        // Agregar al historial si no estaba
        if (!state.payments.some(p => p.title.includes('Cuota 4'))) {
          state.payments.unshift({
            id: 'pay_' + Date.now(),
            title: 'Cuota 4 - Junio',
            date: '12/06/2026',
            amount: '$80.000'
          });
        }
      }
      return { ...alert, completed: true };
    }
    return alert;
  });
  
  saveState();
  updateUI();
};

// Eliminar alerta individual
window.deleteAlert = function(id) {
  // Confirmar si es el pago y no está pagado
  const alertToDelete = state.alerts.find(a => a.id === id);
  if (alertToDelete && alertToDelete.category === 'payment' && !state.tuitionPaid) {
    if (!confirm('Esta alerta corresponde a la cuota obligatoria. ¿Deseas eliminar el recordatorio de todas formas?')) {
      return;
    }
  }
  
  state.alerts = state.alerts.filter(alert => alert.id !== id);
  saveState();
  updateUI();
};

// Enviar formulario de carga de alertas
window.handleAlertSubmit = function(event) {
  event.preventDefault();
  
  const title = document.getElementById('alert-title').value;
  const category = document.getElementById('alert-type').value;
  const priority = document.getElementById('alert-priority').value;
  const dateVal = document.getElementById('alert-date').value;
  
  const newAlert = {
    id: 'alert_' + Date.now(),
    category,
    title,
    description: `Cargada manualmente para la fecha límite ${formatDateStr(dateVal)}.`,
    date: dateVal,
    priority,
    completed: false
  };
  
  state.alerts.push(newAlert);
  saveState();
  updateUI();
  
  // Resetear formulario
  document.getElementById('alert-title').value = '';
  document.getElementById('alert-type').value = 'academic';
  document.getElementById('alert-priority').value = 'alta';
  document.getElementById('alert-date').value = '2026-06-15';
  
  alert('¡Alerta programada con éxito!');
};

// Formatear fechas para mostrar en pantalla
function formatDateStr(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Calcular días de diferencia desde la fecha simulada
function getDaysDifference(alertDateStr) {
  const alertDate = new Date(alertDateStr + 'T00:00:00');
  // Resetear horas para comparar días puros
  const dToday = new Date(SIMULATED_TODAY.getFullYear(), SIMULATED_TODAY.getMonth(), SIMULATED_TODAY.getDate());
  const dAlert = new Date(alertDate.getFullYear(), alertDate.getMonth(), alertDate.getDate());
  
  const diffTime = dAlert - dToday;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Comprobar si la carrera es arancelada (Tecnicatura) o gratuita
function isPaidCareer() {
  return state.career === 'TUP' || state.career === 'TUSI';
}

// Actualizar todo el UI
function updateUI() {
  const isPaid = isPaidCareer();
  
  // Mostrar u ocultar sección de cuota y de historial según la carrera
  const tuitionCard = document.getElementById('tuition-payment-card');
  const historyCard = document.getElementById('payment-history-card');
  const freeCard = document.getElementById('free-career-card');
  const increaseAlert = document.getElementById('fee-increase-alert');
  
  if (isPaid) {
    tuitionCard.style.display = 'block';
    historyCard.style.display = 'block';
    freeCard.style.display = 'none';
    increaseAlert.style.display = 'flex'; // Mostrar alerta de aumento
    
    // Actualizar estado visual de la tarjeta de cuota
    const statusBadge = document.getElementById('tuition-status-badge');
    const amountLabel = document.getElementById('tuition-amount-label');
    const dueLabel = document.getElementById('tuition-due-label');
    const payBtn = document.getElementById('btn-pay-tuition');
    
    // Si la alerta de pago del mes corriente se completó, la cuota está paga
    const paymentAlert = state.alerts.find(a => a.category === 'payment' && a.title.includes('Cuota Mensual N°4'));
    if (paymentAlert && paymentAlert.completed) {
      state.tuitionPaid = true;
    }
    
    if (state.tuitionPaid) {
      tuitionCard.className = 'payment-card-box paid';
      statusBadge.innerText = 'Cuota Pagada ✓';
      dueLabel.innerText = 'Abonada el 12/06/2026';
      payBtn.innerText = '✓ Pago Completo';
      payBtn.disabled = true;
      payBtn.style.opacity = '0.7';
    } else {
      tuitionCard.className = 'payment-card-box pending';
      statusBadge.innerText = 'Cuota Pendiente';
      dueLabel.innerText = 'Vence el 15 de Junio · Quedan 3 días';
      payBtn.innerText = '💳 Realizar Pago Directo';
      payBtn.disabled = false;
      payBtn.style.opacity = '1';
    }
    
    // Renderizar Historial de Pagos
    renderPaymentsHistory();
  } else {
    tuitionCard.style.display = 'none';
    historyCard.style.display = 'none';
    freeCard.style.display = 'block';
    increaseAlert.style.display = 'none'; // Las ingenierías no tienen aumento de cuota
  }
  
  // Filtrar y ordenar las alertas según la carrera actual
  // Si la carrera es gratuita, removemos la alerta de pago de cuota de la lista principal
  let filteredAlerts = state.alerts.filter(alert => !alert.completed);
  if (!isPaid) {
    filteredAlerts = filteredAlerts.filter(alert => alert.category !== 'payment' || !alert.title.includes('Cuota'));
  }
  
  // Renderizar contadores en la navegación
  const badgeCount = filteredAlerts.length;
  document.getElementById('nav-badge-count').innerText = badgeCount;
  document.getElementById('bnav-badge-count').innerText = badgeCount;
  
  // Renderizar la vista que corresponda
  if (state.view === 'list') {
    renderListView(filteredAlerts);
  } else {
    renderCalendar();
  }
  
  // Sincronizar switcher botones por si acaso
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

// Renderizar Historial de Pagos
function renderPaymentsHistory() {
  const container = document.getElementById('payments-history-list');
  container.innerHTML = '';
  
  state.payments.forEach(p => {
    const row = document.createElement('div');
    row.className = 'payment-history-row';
    row.innerHTML = `
      <div>
        <div class="pay-hist-title">${p.title}</div>
        <div class="pay-hist-date">${p.date}</div>
      </div>
      <div class="pay-hist-amount">${p.amount}</div>
    `;
    container.appendChild(row);
  });
}

// Renderizar la vista de agenda / lista
function renderListView(activeAlerts) {
  const listUrgent = document.getElementById('list-urgent');
  const listSoon = document.getElementById('list-soon');
  const listLater = document.getElementById('list-later');
  
  listUrgent.innerHTML = '';
  listSoon.innerHTML = '';
  listLater.innerHTML = '';
  
  // Agrupar por fecha
  activeAlerts.forEach(alert => {
    const diffDays = getDaysDifference(alert.date);
    const card = createAlertCardHTML(alert, diffDays);
    
    if (diffDays <= 7) {
      listUrgent.appendChild(card);
    } else if (diffDays <= 20) {
      listSoon.appendChild(card);
    } else {
      listLater.appendChild(card);
    }
  });
  
  // Mostrar placeholders vacíos si no hay alertas en un grupo
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

// Crear elemento tarjeta de alerta HTML
function createAlertCardHTML(alert, diffDays) {
  const card = document.createElement('div');
  card.className = 'alert-item-card';
  
  // Definir textos y clases según diferencia de días
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
    dateText = `En ${diffDays} días (${formatDateStr(alert.date)})`;
    dateClass = 'style="color: var(--t2);"';
  }
  
  // Selector de icono de categoría
  let catIcon = '📌';
  if (alert.category === 'academic') catIcon = '📝';
  if (alert.category === 'administrative') catIcon = '💼';
  if (alert.category === 'payment') catIcon = '💵';
  if (alert.category === 'personal') catIcon = '🎯';
  
  card.innerHTML = `
    <div class="alert-icon-wrap alert-icon-${alert.category}">
      ${catIcon}
    </div>
    <div class="alert-item-info">
      <div class="alert-item-title">${alert.title}</div>
      <div class="alert-item-desc">${alert.description}</div>
      <div class="alert-item-meta">
        <span class="alert-priority-badge alert-priority-${alert.priority}">${alert.priority}</span>
        <span class="alert-date-badge" ${dateClass}>
          ⏱️ ${dateText}
        </span>
      </div>
    </div>
    <div class="alert-item-actions">
      <button class="btn-alert-action btn-complete" title="Marcar como Completado" onclick="window.completeAlert('${alert.id}')">✓</button>
      <button class="btn-alert-action btn-delete" title="Eliminar Alerta" onclick="window.deleteAlert('${alert.id}')">✕</button>
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
  
  // Actualizar título del mes
  document.getElementById('calendar-month-title').innerText = `${MONTH_NAMES[month]} ${year}`;
  
  const firstDayIndex = new Date(year, month, 1).getDay(); // Domingo=0, Lunes=1...
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();
  
  // Días del mes anterior (relleno)
  for (let i = firstDayIndex; i > 0; i--) {
    const dayVal = prevTotalDays - i + 1;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerText = dayVal;
    container.appendChild(cell);
  }
  
  // Días del mes actual
  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    cell.innerText = day;
    
    // Armar string de fecha YYYY-MM-DD
    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
    
    // Comprobar si es "hoy" (12/06/2026)
    if (year === 2026 && month === 5 && day === 12) {
      cell.classList.add('today');
    }
    
    // Comprobar si está seleccionado
    if (state.calendar.selectedDate === dateStr) {
      cell.classList.add('selected');
    }
    
    // Buscar alertas activas no completadas para este día
    let dayAlerts = state.alerts.filter(a => a.date === dateStr && !a.completed);
    // Filtrar alerta de cuota si la carrera es gratis
    if (!isPaidCareer()) {
      dayAlerts = dayAlerts.filter(a => a.category !== 'payment' || !a.title.includes('Cuota'));
    }
    
    if (dayAlerts.length > 0) {
      cell.classList.add('has-alerts');
      
      // Crear puntitos de colores
      const dotsRow = document.createElement('div');
      dotsRow.className = 'calendar-dots-row';
      
      // Mostrar hasta 3 puntitos únicos de categorías
      const categories = [...new Set(dayAlerts.map(a => a.category))].slice(0, 3);
      categories.forEach(cat => {
        const dot = document.createElement('div');
        dot.className = `dot dot-${cat}`;
        dotsRow.appendChild(dot);
      });
      cell.appendChild(dotsRow);
    }
    
    // Click en el día
    cell.onclick = () => {
      // Remover selección anterior
      const prevSelected = container.querySelector('.calendar-day-cell.selected');
      if (prevSelected) prevSelected.classList.remove('selected');
      
      cell.classList.add('selected');
      state.calendar.selectedDate = dateStr;
      saveState();
      
      renderDayDetails(dateStr, dayAlerts);
    };
    
    container.appendChild(cell);
  }
  
  // Días del mes siguiente para completar la grilla
  const totalCells = container.children.length;
  const remainingCells = 42 - totalCells; // Grilla estándar de 6 filas
  for (let i = 1; i <= remainingCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerText = i;
    container.appendChild(cell);
  }
  
  // Renderizar detalles del día seleccionado actual
  let activeAlerts = state.alerts.filter(a => a.date === state.calendar.selectedDate && !a.completed);
  if (!isPaidCareer()) {
    activeAlerts = activeAlerts.filter(a => a.category !== 'payment' || !a.title.includes('Cuota'));
  }
  renderDayDetails(state.calendar.selectedDate, activeAlerts);
}

// Renderizar el bloque de detalles de alertas debajo del calendario
function renderDayDetails(dateStr, dayAlerts) {
  const label = document.getElementById('selected-day-label');
  const container = document.getElementById('day-detail-alerts-list');
  
  label.innerText = `Alertas del día: ${formatDateStr(dateStr)}`;
  container.innerHTML = '';
  
  if (dayAlerts.length === 0) {
    container.innerHTML = `<div class="day-detail-empty">Ninguna alerta programada para este día.</div>`;
    return;
  }
  
  dayAlerts.forEach(alert => {
    const alertRow = document.createElement('div');
    alertRow.className = 'alert-item-card';
    alertRow.style.padding = '10px';
    alertRow.style.boxShadow = 'none';
    alertRow.style.border = '1px solid var(--border-light)';
    
    let catIcon = '📌';
    if (alert.category === 'academic') catIcon = '📝';
    if (alert.category === 'administrative') catIcon = '💼';
    if (alert.category === 'payment') catIcon = '💵';
    if (alert.category === 'personal') catIcon = '🎯';
    
    alertRow.innerHTML = `
      <div class="alert-icon-wrap alert-icon-${alert.category}" style="width: 30px; height: 30px; font-size: 14px;">
        ${catIcon}
      </div>
      <div class="alert-item-info">
        <div class="alert-item-title" style="font-size: 13px;">${alert.title}</div>
        <div class="alert-item-meta">
          <span class="alert-priority-badge alert-priority-${alert.priority}" style="font-size: 8.5px; padding: 1px 5px;">${alert.priority}</span>
        </div>
      </div>
      <div class="alert-item-actions">
        <button class="btn-alert-action btn-complete" style="width: 26px; height: 26px; font-size: 10px;" onclick="window.completeAlert('${alert.id}')">✓</button>
      </div>
    `;
    container.appendChild(alertRow);
  });
}
