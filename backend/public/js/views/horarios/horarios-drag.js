/**
 * @fileoverview Drag & Drop y manipulación de bloques en la grilla de Horarios.
 * Maneja el arrastre HTML5 para agregar bloques, y el arrastre con mouse
 * para mover y redimensionar bloques existentes dentro de la grilla.
 * @module views/horarios/horarios-drag
 */

'use strict';

import {
  START_HOUR,
  END_HOUR,
  TOTAL_MINUTES,
  PX_PER_MINUTE,
  minToTime,
  timeToMin
} from './horarios-grid.js';

import { getCommissionByTime } from './horarios-data.js';

// ── HTML5 Drag State ───────────────────────────────────────────────────────

export let dragData = null;

export function handleDragStart(e) {
  dragData = {
    tipo: this.dataset.type,
    itemId: this.dataset.itemId,
    nombre: this.dataset.name,
    codigo: this.dataset.code || null
  };
  e.dataTransfer.effectAllowed = 'copy';
}

export function clearDragData() {
  dragData = null;
}

// ── Drop Zones Setup ────────────────────────────────────────────────────────

export function setupDropZones(onBlockDrop) {
  const cols = document.querySelectorAll('.grid-day-col');
  cols.forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    col.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragData) return;

      const dayId = parseInt(col.dataset.dayId);
      const rect = col.getBoundingClientRect();
      const clickY = e.clientY - rect.top;

      let dropMin = Math.round(clickY / PX_PER_MINUTE) + START_HOUR * 60;
      dropMin = Math.round(dropMin / 30) * 30;
      if (dropMin < START_HOUR * 60) dropMin = START_HOUR * 60;
      if (dropMin > (END_HOUR - 2) * 60) dropMin = (END_HOUR - 2) * 60;

      const inicioStr = minToTime(dropMin);
      const finStr = minToTime(dropMin + 120);

      const newBlock = {
        id: `block_${Date.now()}`,
        tipo: dragData.tipo,
        nombre: dragData.nombre,
        codigo: dragData.codigo,
        materia_id: dragData.tipo === 'materia' ? dragData.itemId : null,
        dia: dayId,
        inicio: inicioStr,
        fin: finStr,
        color: null,
        version: null,
        comision: dragData.tipo === 'materia' ? getCommissionByTime(inicioStr) : 'Actividad Personal'
      };

      onBlockDrop(newBlock);
      dragData = null;
    });
  });
}

// ── Vertical Drag (Mouse) ──────────────────────────────────────────────────

export function initBlockVerticalDrag(block, startEvent, onDragUpdate, onDragEnd) {
  const blockDiv = document.querySelector(`.sched-time-block[data-block-id="${block.id}"]`);
  if (!blockDiv) return;

  const startY = startEvent.clientY;
  const startX = startEvent.clientX;

  const initialStartMin = timeToMin(block.inicio);
  const initialEndMin = timeToMin(block.fin);
  const duration = initialEndMin - initialStartMin;

  const startOffsetMin = initialStartMin - START_HOUR * 60;
  const dayColElements = Array.from(document.querySelectorAll('.grid-day-col'));

  function handleMouseMove(e) {
    const deltaY = e.clientY - startY;
    const deltaMin = Math.round(deltaY / PX_PER_MINUTE);

    let newOffset = startOffsetMin + deltaMin;
    newOffset = Math.round(newOffset / 30) * 30;

    if (newOffset < 0) newOffset = 0;
    if (newOffset + duration > TOTAL_MINUTES) newOffset = TOTAL_MINUTES - duration;

    const newStartMin = newOffset + START_HOUR * 60;
    const newEndMin = newStartMin + duration;

    block.inicio = minToTime(newStartMin);
    block.fin = minToTime(newEndMin);

    if (block.tipo === 'materia') {
      block.comision = getCommissionByTime(block.inicio);
    }

    blockDiv.style.top = `${newOffset * PX_PER_MINUTE}px`;
    const metaRow = blockDiv.querySelector('.block-meta-row');
    if (metaRow) metaRow.textContent = block.comision;

    let hoverDayId = block.dia;
    dayColElements.forEach(col => {
      const rect = col.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right) {
        hoverDayId = parseInt(col.dataset.dayId);
      }
    });

    if (hoverDayId !== block.dia) {
      block.dia = hoverDayId;
      const targetCol = document.getElementById(`col-day-${hoverDayId}`);
      if (targetCol) targetCol.appendChild(blockDiv);
    }

    onDragUpdate(block);
  }

  function handleMouseUp(e) {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    const distY = Math.abs(e.clientY - startY);
    const distX = Math.abs(e.clientX - startX);
    onDragEnd(block, distX < 4 && distY < 4);
  }

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

// ── Vertical Resize (Mouse) ─────────────────────────────────────────────────

export function initBlockVerticalResize(block, handle, startEvent, onResizeUpdate, onResizeEnd) {
  const blockDiv = document.querySelector(`.sched-time-block[data-block-id="${block.id}"]`);
  if (!blockDiv) return;

  const startY = startEvent.clientY;
  const startMin = timeToMin(block.inicio);
  const endMin = timeToMin(block.fin);

  function handleMouseMove(e) {
    const deltaY = e.clientY - startY;
    const deltaMin = Math.round(deltaY / PX_PER_MINUTE);

    if (handle === 'top') {
      let newStart = startMin + deltaMin;
      newStart = Math.round(newStart / 30) * 30;
      if (newStart < START_HOUR * 60) newStart = START_HOUR * 60;
      if (newStart >= endMin - 30) newStart = endMin - 30;

      block.inicio = minToTime(newStart);

      if (block.tipo === 'materia') {
        block.comision = getCommissionByTime(block.inicio);
      }

      const topPx = (newStart - START_HOUR * 60) * PX_PER_MINUTE;
      const heightPx = (endMin - newStart) * PX_PER_MINUTE;
      blockDiv.style.top = `${topPx}px`;
      blockDiv.style.height = `${heightPx}px`;
      const metaRow = blockDiv.querySelector('.block-meta-row');
      if (metaRow) metaRow.textContent = block.comision;
    } else {
      let newEnd = endMin + deltaMin;
      newEnd = Math.round(newEnd / 30) * 30;
      if (newEnd > END_HOUR * 60) newEnd = END_HOUR * 60;
      if (newEnd <= startMin + 30) newEnd = startMin + 30;

      block.fin = minToTime(newEnd);

      const heightPx = (newEnd - startMin) * PX_PER_MINUTE;
      blockDiv.style.height = `${heightPx}px`;
    }

    onResizeUpdate(block);
  }

  function handleMouseUp() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    onResizeEnd(block);
  }

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.HorariosDrag = {
  handleDragStart,
  clearDragData,
  setupDropZones,
  initBlockVerticalDrag,
  initBlockVerticalResize
};
