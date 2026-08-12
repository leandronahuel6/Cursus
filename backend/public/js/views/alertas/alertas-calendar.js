/**
 * @fileoverview Calendario visual mensual para la página de Alertas.
 *
 * Responsabilidades de este módulo:
 * - Construir la grilla de días del mes activo.
 * - Marcar celdas con alertas usando gradientes CSS inyectados vía Custom Properties.
 * - Manejar la selección de celda mediante `outline` (sin alterar su color de fondo).
 * - Renderizar el popover de detalle de alertas.
 *
 * Este módulo NO realiza fetching de datos; recibe el estado y las alertas como parámetros.
 *
 * @module views/alertas/alertas-calendar
 */

'use strict'

import { formatDateStr, resolveAlertColor } from '../../shared/utils.js'

import { spriteIcon } from '../../shared/sprite.js'

// ── Constantes ───────────────────────────────────────────────────────────────

/** @type {string[]} Nombres de los meses en español. */
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/**
 * Mapa de categoría de alerta a ID de ícono en el sprite SVG.
 * @type {Record<string, string>}
 */
const CATEGORIA_ICON_MAP = {
  academic: 'graduation-cap',
  administrative: 'briefcase-business',
  personal: 'user',
  payment: 'banknote',
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Renderiza el calendario mensual completo en el contenedor del DOM.
 * Construye las celdas de los días anteriores, actuales y posteriores al mes.
 *
 * @param {Object} state - Estado centralizado de la página.
 * @param {Object} state.calendar - Sub-estado del calendario.
 * @param {number} state.calendar.year - Año activo.
 * @param {number} state.calendar.month - Mes activo (0-indexed).
 * @param {string|null} state.calendar.selectedDate - Fecha seleccionada en formato YYYY-MM-DD.
 * @param {Array<Object>} alerts - Todas las alertas (incluyendo completadas).
 * @returns {void}
 */
export function renderCalendar(state, alerts) {
  const container = document.getElementById('calendar-days-container')
  if (!container) return

  container.innerHTML = ''

  const { year, month } = state.calendar
  const today = new Date()

  const titleEl = document.getElementById('calendar-month-title')
  if (titleEl) titleEl.textContent = `${MONTH_NAMES[month]} ${year}`

  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const prevTotalDays = new Date(year, month, 0).getDate()

  // Días del mes anterior (padding inicial)
  for (let i = firstDayIndex; i > 0; i--) {
    container.appendChild(_buildOtherMonthCell(prevTotalDays - i + 1))
  }

  // Días del mes actual
  for (let day = 1; day <= totalDays; day++) {
    const paddedMonth = String(month + 1).padStart(2, '0')
    const paddedDay = String(day).padStart(2, '0')
    const dateStr = `${year}-${paddedMonth}-${paddedDay}`

    const isToday =
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()

    const dayAlerts = alerts.filter((a) => a.fecha === dateStr && !a.completada)
    const cell = _buildDayCell(
      day,
      dateStr,
      isToday,
      dayAlerts,
      state.calendar.selectedDate,
    )

    cell.addEventListener('click', (e) => {
      e.stopPropagation()
      _handleDayCellClick(cell, dateStr, dayAlerts, state, container)
    })

    container.appendChild(cell)
  }

  // Días del mes siguiente (padding final hasta 42 celdas)
  const totalCells = container.children.length
  const remaining = 42 - totalCells
  for (let i = 1; i <= remaining; i++) {
    container.appendChild(_buildOtherMonthCell(i))
  }
}

/**
 * Avanza o retrocede el mes en el estado del calendario.
 *
 * @param {number} direction - Dirección: -1 para atrás, +1 para adelante.
 * @param {Object} state - Estado centralizado de la página.
 * @returns {void}
 */
export function changeMonth(direction, state) {
  state.calendar.month += direction

  if (state.calendar.month < 0) {
    state.calendar.month = 11
    state.calendar.year -= 1
  } else if (state.calendar.month > 11) {
    state.calendar.month = 0
    state.calendar.year += 1
  }
}

// ── Constructores de celdas ──────────────────────────────────────────────────

/**
 * Crea una celda de día de otro mes (relleno).
 *
 * @param {number} dayNumber - Número de día a mostrar.
 * @returns {HTMLDivElement} Celda de día con clase `other-month`.
 */
function _buildOtherMonthCell(dayNumber) {
  const cell = document.createElement('div')
  cell.className = 'calendar-day-cell other-month'
  cell.setAttribute('aria-hidden', 'true')
  cell.textContent = dayNumber
  return cell
}

/**
 * Crea una celda de día del mes actual con su estado correspondiente.
 *
 * @param {number} day - Número del día.
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD.
 * @param {boolean} isToday - Indica si el día es el día de hoy.
 * @param {Array<Object>} dayAlerts - Alertas activas de este día.
 * @param {string|null} selectedDate - Fecha actualmente seleccionada.
 * @returns {HTMLDivElement} Celda configurada.
 */
function _buildDayCell(day, dateStr, isToday, dayAlerts, selectedDate) {
  const cell = document.createElement('div')
  cell.className = 'calendar-day-cell'
  cell.dataset.date = dateStr
  cell.setAttribute('role', 'gridcell')
  cell.setAttribute(
    'aria-label',
    `${day}${isToday ? ', hoy' : ''}${dayAlerts.length ? `, ${dayAlerts.length} alerta${dayAlerts.length > 1 ? 's' : ''}` : ''}`,
  )
  cell.setAttribute('tabindex', '0')

  if (isToday) {
    cell.classList.add('today')
    cell.innerHTML = `${day}<span class="calendar-day-today-tag" aria-hidden="true">Hoy</span>`
  } else {
    cell.textContent = day
  }

  if (selectedDate === dateStr) {
    cell.classList.add('selected')
  }

  if (dayAlerts.length > 0) {
    cell.classList.add('has-alerts')

    // Inyectar el gradiente de colores como Custom Property para que el CSS lo dibuje.
    // Esta es la excepción válida: datos dinámicos JS → CSS vía var().
    const gradient = _buildDaySplitBackground(dayAlerts.map(resolveAlertColor))
    cell.style.setProperty('--day-bg', gradient)

    // Dots de colores en la parte inferior de la celda
    cell.appendChild(_buildDotsRow(dayAlerts))
  }

  return cell
}

/**
 * Construye la fila de puntos de colores para indicar alertas en la celda.
 *
 * @param {Array<Object>} dayAlerts - Alertas del día.
 * @returns {HTMLDivElement} Contenedor con puntos de color.
 */
function _buildDotsRow(dayAlerts) {
  const dotsRow = document.createElement('div')
  dotsRow.className = 'calendar-dots-row'
  dotsRow.setAttribute('aria-hidden', 'true')

  dayAlerts.slice(0, 4).forEach((alerta) => {
    const dot = document.createElement('span')
    dot.className = 'dot'
    dot.style.setProperty('background', resolveAlertColor(alerta))
    dotsRow.appendChild(dot)
  })

  return dotsRow
}

// ── Gestión de selección y popover ───────────────────────────────────────────

/**
 * Maneja el clic en una celda del calendario:
 * actualiza la selección y abre/cierra el popover de detalle.
 *
 * @param {HTMLDivElement} cell - La celda clicada.
 * @param {string} dateStr - Fecha de la celda en formato YYYY-MM-DD.
 * @param {Array<Object>} dayAlerts - Alertas activas de este día.
 * @param {Object} state - Estado centralizado de la página.
 * @param {HTMLElement} container - Contenedor padre de la grilla.
 * @returns {void}
 */
function _handleDayCellClick(cell, dateStr, dayAlerts, state, container) {
  const alreadySelected = cell.classList.contains('selected')

  // Deseleccionar la celda anterior
  container.querySelectorAll('.calendar-day-cell.selected').forEach((c) => {
    c.classList.remove('selected')
  })

  // Cerrar todos los popovers abiertos
  document.querySelectorAll('.calendar-day-popover').forEach((p) => p.remove())

  // Si la misma celda se volvió a clicar (toggle) o no tiene alertas, no abrir popover
  if (alreadySelected) {
    state.calendar.selectedDate = null
    return
  }

  cell.classList.add('selected')
  state.calendar.selectedDate = dateStr

  if (dayAlerts.length > 0) {
    _openDayPopover(cell, dateStr, dayAlerts)
  }
}

/**
 * Abre el popover de detalle de alertas anclado a la celda.
 *
 * @param {HTMLDivElement} cell - La celda del día.
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD.
 * @param {Array<Object>} dayAlerts - Alertas del día a mostrar.
 * @returns {void}
 */
function _openDayPopover(cell, dateStr, dayAlerts) {
  const popover = document.createElement('div')
  popover.className = 'calendar-day-popover'
  popover.setAttribute('role', 'dialog')
  popover.setAttribute('aria-label', `Alertas del ${formatDateStr(dateStr)}`)

  // Evitar que el clic dentro del popover propague al document y lo cierre
  popover.addEventListener('click', (e) => e.stopPropagation())

  const title = document.createElement('div')
  title.className = 'calendar-day-popover__title'
  title.textContent = formatDateStr(dateStr)
  popover.appendChild(title)

  dayAlerts.forEach((alerta) => {
    popover.appendChild(_buildPopoverItem(alerta))
  })

  cell.appendChild(popover)
}

/**
 * Construye un elemento de lista dentro del popover para una alerta individual.
 *
 * @param {Object} alerta - Objeto de alerta con id, titulo, categoria, prioridad.
 * @returns {HTMLDivElement} Item del popover.
 */
function _buildPopoverItem(alerta) {
  const iconId = CATEGORIA_ICON_MAP[alerta.categoria] || 'circle-alert'

  const item = document.createElement('div')
  item.className = 'calendar-day-popover__item'

  const iconWrap = document.createElement('div')
  iconWrap.className = `alert-icon-wrap alert-icon-${alerta.categoria}`
  iconWrap.setAttribute('aria-hidden', 'true')
  iconWrap.innerHTML = spriteIcon(iconId)

  const info = document.createElement('div')
  info.className = 'calendar-day-popover__info'

  const tituloEl = document.createElement('div')
  tituloEl.className = 'calendar-day-popover__titulo'
  tituloEl.textContent = alerta.titulo

  const badge = document.createElement('span')
  badge.className = `alert-priority-badge alert-priority-${alerta.prioridad}`
  badge.textContent = alerta.prioridad

  info.appendChild(tituloEl)
  info.appendChild(badge)

  const btnComplete = document.createElement('button')
  btnComplete.type = 'button'
  btnComplete.className = 'btn-alert-action btn-complete'
  btnComplete.title = 'Marcar como Completado'
  btnComplete.setAttribute(
    'aria-label',
    `Marcar "${alerta.titulo}" como completado`,
  )
  btnComplete.dataset.jsAction = 'complete-alert'
  btnComplete.dataset.alertId = alerta.id
  btnComplete.innerHTML = spriteIcon('check')

  item.appendChild(iconWrap)
  item.appendChild(info)
  item.appendChild(btnComplete)

  return item
}

// ── Utilidades privadas ──────────────────────────────────────────────────────

/**
 * Construye el valor de fondo (gradiente) para una celda con múltiples alertas.
 * El resultado se inyecta como Custom Property `--day-bg` en la celda.
 *
 * @param {string[]} colors - Array de colores hexadecimales de las alertas.
 * @returns {string} Valor CSS del gradiente (conic o linear).
 */
function _buildDaySplitBackground(colors) {
  const overlay =
    'linear-gradient(rgba(255,255,255,.38), rgba(255,255,255,.38))'

  if (colors.length === 1) {
    return `${overlay}, linear-gradient(${colors[0]}, ${colors[0]})`
  }

  const step = 100 / colors.length
  const stops = colors
    .map((color, index) => {
      const start = (index * step).toFixed(3)
      const end = ((index + 1) * step).toFixed(3)
      return `${color} ${start}% ${end}%`
    })
    .join(', ')

  return `${overlay}, conic-gradient(${stops})`
}

// ── Cierre de popovers al clicar fuera ──────────────────────────────────────

document.addEventListener('click', (e) => {
  if (!e.target.closest('.calendar-day-cell')) {
    document
      .querySelectorAll('.calendar-day-popover')
      .forEach((p) => p.remove())
  }
})

// ── Cierre de popovers al presionar Escape ───────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document
      .querySelectorAll('.calendar-day-popover')
      .forEach((p) => p.remove())
  }
})

// ── Legacy Global Export ─────────────────────────────────────────────────────

window.AlertasCalendar = { renderCalendar, changeMonth }
