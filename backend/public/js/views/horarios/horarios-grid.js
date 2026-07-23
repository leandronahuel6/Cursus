/**
 * @fileoverview Constructor de la grilla semanal para el simulador de Horarios.
 * Renderiza el eje de tiempo, líneas de fondo, paneles de materias/actividades
 * disponibles y los bloques en las columnas de días.
 * No realiza fetching de datos; recibe el estado como parámetro.
 * @module views/horarios/horarios-grid
 */

'use strict';

import { getCommissionByTime, buildCodigo } from './horarios-data.js';
import { selectBlock, checkAlternativeCommissions, schedState } from './horarios-main.js';
import { initBlockVerticalDrag, initBlockVerticalResize } from './horarios-drag.js';

// ── Constantes de layout ───────────────────────────────────────────────────

export const START_HOUR = 8;
export const END_HOUR = 23;
export const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
export const PX_PER_HOUR = 48;
export const PX_PER_MINUTE = PX_PER_HOUR / 60;
export const COLUMN_HEIGHT = TOTAL_MINUTES * PX_PER_MINUTE;

export const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' }
];

// ── Time axis ───────────────────────────────────────────────────────────────

export function renderTimeLabels() {
  const container = document.getElementById('grid-time-axis-labels');
  container.innerHTML = '';

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const labelHour = document.createElement('div');
    labelHour.className = 'grid-time-lbl-cell';
    labelHour.style.height = `${PX_PER_HOUR / 2}px`;
    labelHour.innerHTML = `<span>${String(h).padStart(2, '0')}:00</span>`;
    container.appendChild(labelHour);

    if (h < END_HOUR) {
      const labelHalf = document.createElement('div');
      labelHalf.className = 'grid-time-lbl-cell half-hour';
      labelHalf.style.height = `${PX_PER_HOUR / 2}px`;
      labelHalf.innerHTML = `<span>${String(h).padStart(2, '0')}:30</span>`;
      container.appendChild(labelHalf);
    }
  }
}

// ── Grid background lines ───────────────────────────────────────────────────

export function renderGridLines() {
  const container = document.getElementById('grid-bg-lines');
  container.innerHTML = '';

  const hoursCount = END_HOUR - START_HOUR + 1;
  for (let i = 0; i < hoursCount; i++) {
    const lineHour = document.createElement('div');
    lineHour.className = 'grid-bg-line-hour';
    lineHour.style.top = `${i * PX_PER_HOUR}px`;
    container.appendChild(lineHour);

    if (i < hoursCount - 1) {
      const lineHalf = document.createElement('div');
      lineHalf.className = 'grid-bg-line-half';
      lineHalf.style.top = `${i * PX_PER_HOUR + 24}px`;
      container.appendChild(lineHalf);
    }
  }
}

// ── Available subjects & activities panels ──────────────────────────────────

export function renderAvailablePanels(availableSubjects, personalActivities, onDragStart) {
  const subjectsList = document.getElementById('list-available-subjects');
  subjectsList.innerHTML = '';

  const countBadge = document.getElementById('count-available-subjects');
  if (countBadge) {
    countBadge.textContent = String(availableSubjects.length);
  }

  if (availableSubjects.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sched-empty-note';
    empty.textContent = 'No tenes materias en estado cursando. Cambialas desde Mis Materias para poder agregarlas al horario.';
    subjectsList.appendChild(empty);
  }

  availableSubjects.forEach(sub => {
    const card = document.createElement('div');
    card.className = 'sched-drag-card';
    card.draggable = true;
    card.dataset.type = 'materia';
    card.dataset.itemId = sub.id;
    card.dataset.name = sub.nombre;
    card.dataset.code = sub.codigo;

    card.innerHTML = `
      <div class="card-decor-bar"></div>
      <div class="card-info">
        <span class="card-name">${sub.nombre}</span>
        <span class="card-meta">${sub.codigo} | ${sub.nivel}</span>
      </div>
      <button class="card-btn-add" onclick="openAddModal('${sub.id}', 'materia')">+</button>
    `;

    card.addEventListener('dragstart', onDragStart);
    subjectsList.appendChild(card);
  });

  const actList = document.getElementById('list-available-activities');
  actList.innerHTML = '';

  personalActivities.forEach(act => {
    const card = document.createElement('div');
    card.className = 'sched-drag-card activity';
    card.draggable = true;
    card.dataset.type = 'actividad';
    card.dataset.itemId = act.id;
    card.dataset.name = act.nombre;

    card.innerHTML = `
      <div class="card-decor-bar act"></div>
      <div class="card-info">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 2px;">
          <span class="card-name" style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${act.nombre}</span>
          <button class="block-btn-delete-x" style="position: static; font-size: 13px; margin-right: 8px; opacity: 0.5;" onclick="deletePersonalActivityTemplate('${act.id}', event)">×</button>
        </div>
        <span class="card-meta">Haz clic en + para configurar y agregar</span>
      </div>
      <button class="card-btn-add" onclick="openAddModal('${act.id}', 'actividad')">+</button>
    `;

    card.addEventListener('dragstart', onDragStart);
    actList.appendChild(card);
  });
}

// ── Block rendering on tracks ───────────────────────────────────────────────

const COLOR_MAP = {
  '#4f46e5': 'indigo',
  '#9333ea': 'purple',
  '#10b981': 'emerald',
  '#f43f5e': 'rose',
  '#f59e0b': 'amber',
  '#0ea5e9': 'sky'
};

const COLOR_NAMES = Object.values(COLOR_MAP);

function resolveColorClass(block) {
  const rawColor = block.color || (block.tipo === 'materia' ? '#4f46e5' : '#9333ea');
  const colorName = COLOR_NAMES.includes(rawColor)
    ? rawColor
    : (COLOR_MAP[rawColor] || (block.tipo === 'materia' ? 'indigo' : 'purple'));
  return `theme-color-${colorName}`;
}

// ── Callback factories (DRY) ─────────────────────────────────────────────────

function createUpdateCallback() {
  return (updatedBlock) => {
    if (schedState.selectedBlockId === updatedBlock.id) {
      document.getElementById('editor-start-time').value = updatedBlock.inicio;
      document.getElementById('editor-end-time').value = updatedBlock.fin;
    }
    checkOverlaps(schedState.blocks);
  };
}

function createDragEndCallback() {
  return (updatedBlock, isClick) => {
    renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
    if (isClick) {
      window.openEditModal(updatedBlock.id);
    } else if (schedState.selectedBlockId === updatedBlock.id) {
      checkAlternativeCommissions(updatedBlock);
    }
  };
}

function createResizeEndCallback() {
  return (updatedBlock) => {
    renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
    if (schedState.selectedBlockId === updatedBlock.id) {
      checkAlternativeCommissions(updatedBlock);
    }
  };
}

// ── Block element creation ──────────────────────────────────────────────────

function buildComparisonHTML(b) {
  return `
    <div class="block-content">
      <span class="block-code-row" style="color: ${b.userColor} !important; font-weight: 700;">${b.codigo || 'PERS'} (${b.userName})</span>
      <span class="block-title-row" style="color: var(--t1) !important;">${b.codigo ? b.nombre.replace('Computación ', '') : b.nombre}</span>
      <span class="block-meta-row" style="color: var(--t2) !important;">${b.inicio} - ${b.fin} hs</span>
    </div>
  `;
}

function buildNormalBlockHTML(b) {
  return `
    <div class="resize-handle top-handle"></div>
    <div class="block-content">
      <span class="block-code-row">${b.codigo || 'PERS'}</span>
      <span class="block-title-row">${b.codigo ? b.nombre.replace('Computación ', '') : b.nombre}</span>
      <span class="block-meta-row">${b.comision}</span>
      <span class="block-overlap-indicator" style="display: none;">[SOLAPADO]</span>
    </div>
    <div class="resize-handle bottom-handle"></div>
    <button class="block-btn-delete-x" onclick="deleteBlockInline('${b.id}', event)">×</button>
  `;
}

function createBlockElement(b, selectedBlockId) {
  const startMin = timeToMin(b.inicio);
  const endMin = timeToMin(b.fin);
  const topPx = (startMin - START_HOUR * 60) * PX_PER_MINUTE;
  const heightPx = (endMin - startMin) * PX_PER_MINUTE;

  const blockDiv = document.createElement('div');
  const colorClass = resolveColorClass(b);

  let classes = `sched-time-block ${colorClass}`;
  if (b.tipo === 'actividad') classes += ' act';
  if (b.isComparison) classes += ' comparison';
  if (!b.isComparison && selectedBlockId === b.id) classes += ' selected';

  blockDiv.className = classes;
  blockDiv.style.top = `${topPx}px`;
  blockDiv.style.height = `${heightPx}px`;
  blockDiv.dataset.blockId = b.id;

  if (b.isComparison) {
    blockDiv.style.borderColor = b.userColor;
    blockDiv.style.background = `repeating-linear-gradient(45deg, transparent, transparent 4px, ${b.userColor}14 4px, ${b.userColor}14 8px)`;
    blockDiv.innerHTML = buildComparisonHTML(b);
  } else {
    blockDiv.innerHTML = buildNormalBlockHTML(b);
  }

  return blockDiv;
}

// ── Block interaction attachment ────────────────────────────────────────────

function attachDragInteraction(blockDiv, b) {
  blockDiv.addEventListener('mousedown', e => {
    if (e.target.classList.contains('block-btn-delete-x') || e.target.classList.contains('resize-handle')) return;
    const liveBlock = schedState.blocks.find(bb => bb.id === b.id);
    if (!liveBlock) return;
    selectBlock(liveBlock.id);
    initBlockVerticalDrag(liveBlock, e, createUpdateCallback(), createDragEndCallback());
  });
}

function attachResizeInteraction(blockDiv, b, handle) {
  const handleEl = blockDiv.querySelector(`.${handle}-handle`);
  if (!handleEl) return;

  handleEl.addEventListener('mousedown', e => {
    e.stopPropagation();
    const liveBlock = schedState.blocks.find(bb => bb.id === b.id);
    if (!liveBlock) return;
    initBlockVerticalResize(liveBlock, handle, e, createUpdateCallback(), createResizeEndCallback());
  });
}

// ── Block list preparation ──────────────────────────────────────────────────

function clearDayColumns() {
  for (let d = 1; d <= 6; d++) {
    const col = document.getElementById(`col-day-${d}`);
    if (col) col.innerHTML = '';
  }
}

function prepareAllBlocks(blocks, comparisonBlocks, version) {
  const v = version || 'A';

  const normalBlocks = blocks
    .filter(b => (b.version || 'A') === v)
    .map(b => ({ ...b, isComparison: false }));

  const compBlocks = (comparisonBlocks || [])
    .filter(b => (b.version || 'A') === v)
    .map(b => ({ ...b, isComparison: true }));

  return [...normalBlocks, ...compBlocks];
}

// ── Block render orchestrator ───────────────────────────────────────────────

export function renderBlocksOnTracks(blocks, comparisonBlocks, currentVersion, selectedBlockId) {
  clearDayColumns();

  const allBlocks = prepareAllBlocks(blocks, comparisonBlocks, currentVersion);

  allBlocks.forEach(b => {
    const col = document.getElementById(`col-day-${b.dia}`);
    if (!col) return;

    const blockDiv = createBlockElement(b, selectedBlockId);

    if (!b.isComparison) {
      attachDragInteraction(blockDiv, b);
      attachResizeInteraction(blockDiv, b, 'top');
      attachResizeInteraction(blockDiv, b, 'bottom');
    }

    col.appendChild(blockDiv);
  });
}

// ── Modal helpers ───────────────────────────────────────────────────────────

export function populateTimeSelects() {
  const startSelect = document.getElementById('modal-start-time-select');
  const endSelect = document.getElementById('modal-end-time-select');

  startSelect.innerHTML = '';
  endSelect.innerHTML = '';

  for (let min = START_HOUR * 60; min < END_HOUR * 60; min += 30) {
    const timeStr = minToTime(min);
    startSelect.innerHTML += `<option value="${timeStr}">${timeStr}</option>`;
  }

  for (let min = (START_HOUR + 1) * 60; min <= END_HOUR * 60; min += 30) {
    const timeStr = minToTime(min);
    endSelect.innerHTML += `<option value="${timeStr}">${timeStr}</option>`;
  }

  startSelect.value = '18:30';
  endSelect.value = '21:30';
}

// ── Time conversion utilities ───────────────────────────────────────────────

export function minToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeToMin(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// ── Overlap detection ───────────────────────────────────────────────────────

export function checkOverlaps(blocks) {
  document.querySelectorAll('.sched-time-block').forEach(div => {
    div.classList.remove('overlap-conflict');
    const indicator = div.querySelector('.block-overlap-indicator');
    if (indicator) indicator.style.display = 'none';
    div.removeAttribute('title');
  });

  let hasOverlap = false;

  for (let d = 1; d <= 6; d++) {
    const dayBlocks = blocks.filter(b => b.dia === d);

    for (let i = 0; i < dayBlocks.length; i++) {
      for (let j = i + 1; j < dayBlocks.length; j++) {
        const b1 = dayBlocks[i];
        const b2 = dayBlocks[j];

        const s1 = timeToMin(b1.inicio);
        const e1 = timeToMin(b1.fin);
        const s2 = timeToMin(b2.inicio);
        const e2 = timeToMin(b2.fin);

        if (s1 < e2 && s2 < e1) {
          hasOverlap = true;

          document.querySelectorAll(`.sched-time-block[data-block-id="${b1.id}"], .sched-time-block[data-block-id="${b2.id}"]`)
            .forEach(div => {
              div.classList.add('overlap-conflict');
              const indicator = div.querySelector('.block-overlap-indicator');
              if (indicator) indicator.style.display = 'block';
              const targetBlock = div.dataset.blockId === b1.id ? b2 : b1;
              div.setAttribute('title', `⚠️ Superposición: Se pisa con ${targetBlock.nombre} de ${targetBlock.inicio} a ${targetBlock.fin} hs.`);
            });
        }
      }
    }
  }

  const banner = document.getElementById('overlap-warning-banner');
  if (hasOverlap) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }

  return hasOverlap;
}

// ── Comparison sidebar ──────────────────────────────────────────────────────

export function renderComparisonSidebar(comparisonUsers) {
  const container = document.getElementById('compare-status-list');
  if (!container) return;

  if (comparisonUsers.length === 0) {
    container.innerHTML = '<div style="color: rgba(255,255,255,0.45); padding: 4px 0;">Sin comparación activa</div>';
    return;
  }

  let html = '';
  comparisonUsers.forEach(user => {
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background-color: ${user.color}; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0;"></span>
          <span style="font-weight: 550; color: var(--t1); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-size: 12px;" title="${user.nombre}">${user.nombre}</span>
        </div>
        <button onclick="removeComparedUser('${user.id}')" style="background: transparent; border: none; color: #f43f5e; cursor: pointer; padding: 2px 4px; font-weight: bold; font-size: 11.5px; transition: opacity 0.15s; flex-shrink: 0;">Quitar</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ── iCal Export ─────────────────────────────────────────────────────────────

export function exportToICS(blocks) {
  if (blocks.length === 0) {
    alert('No hay bloques en la grilla para exportar.');
    return;
  }

  let icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cursus//Simulador de Horarios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const rruleDays = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' };
  const baseDays = { 1: '29', 2: '30', 3: '01', 4: '02', 5: '03', 6: '04' };
  const baseMonths = { 1: '06', 2: '06', 3: '07', 4: '07', 5: '07', 6: '07' };

  blocks.forEach(b => {
    const dayCode = rruleDays[b.dia];
    const dayStr = baseDays[b.dia];
    const monthStr = baseMonths[b.dia];
    const yearStr = '2026';

    const startFormatted = b.inicio.replace(':', '') + '00';
    const endFormatted = b.fin.replace(':', '') + '00';

    const dtStart = `${yearStr}${monthStr}${dayStr}T${startFormatted}`;
    const dtEnd = `${yearStr}${monthStr}${dayStr}T${endFormatted}`;

    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:${b.id}@cursus.com`);
    icsLines.push(`DTSTAMP:${dtStamp}`);
    icsLines.push(`DTSTART:${dtStart}`);
    icsLines.push(`DTEND:${dtEnd}`);
    icsLines.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayCode}`);
    icsLines.push(`SUMMARY:${b.nombre}${b.codigo ? ' (' + b.comision + ')' : ''}`);
    icsLines.push('DESCRIPTION:Sincronizado desde Cursus. Tipo: ' + (b.tipo === 'materia' ? 'Materia UTN' : 'Actividad Personal'));
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');

  const icsString = icsLines.join('\r\n');
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'horario_cursus.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.HorariosGrid = {
  renderTimeLabels,
  renderGridLines,
  renderAvailablePanels,
  renderBlocksOnTracks,
  populateTimeSelects,
  checkOverlaps,
  renderComparisonSidebar,
  exportToICS,
  minToTime,
  timeToMin,
  PX_PER_MINUTE,
  PX_PER_HOUR,
  START_HOUR,
  END_HOUR,
  TOTAL_MINUTES
};
