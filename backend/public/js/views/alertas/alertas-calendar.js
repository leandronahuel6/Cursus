/**
 * @fileoverview Calendario visual mensual para la página de Alertas.
 * Construye la grilla de días, maneja selección y popovers de detalle.
 * No realiza fetching de datos; recibe el estado y las alertas como parámetros.
 * @module views/alertas/alertas-calendar
 */

'use strict';

import {
  formatDateStr,
  resolveAlertColor,
  categoriaIcon
} from '../../shared/utils.js';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ── API pública ─────────────────────────────────────────────────────────────

export function renderCalendar(state, alerts) {
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

  // Previous month padding
  for (let i = firstDayIndex; i > 0; i--) {
    const dayVal = prevTotalDays - i + 1;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerText = dayVal;
    container.appendChild(cell);
  }

  // Current month days
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

    const dayAlerts = alerts.filter(a => a.fecha === dateStr && !a.completada);

    if (dayAlerts.length > 0) {
      cell.classList.add('has-alerts');

      const colors = dayAlerts.map(resolveAlertColor);
      const dayPaint = buildDaySplitBackground(colors);
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

  // Fill remaining cells to complete the grid
  const totalCells = container.children.length;
  const remainingCells = 42 - totalCells;
  for (let i = 1; i <= remainingCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerText = i;
    container.appendChild(cell);
  }
}

// ── Helpers internos ────────────────────────────────────────────────────────

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

// ── Month navigation ────────────────────────────────────────────────────────

export function changeMonth(direction, state) {
  state.calendar.month += direction;
  if (state.calendar.month < 0) {
    state.calendar.month = 11;
    state.calendar.year -= 1;
  } else if (state.calendar.month > 11) {
    state.calendar.month = 0;
    state.calendar.year += 1;
  }
}

// ── Document-level click to close popovers ──────────────────────────────────

document.addEventListener('click', (e) => {
  if (!e.target.closest('.calendar-day-cell')) {
    document.querySelectorAll('.calendar-day-popover').forEach(p => p.remove());
  }
});

// ── Legacy Global Export ────────────────────────────────────────────────────

window.AlertasCalendar = {
  renderCalendar,
  changeMonth
};
