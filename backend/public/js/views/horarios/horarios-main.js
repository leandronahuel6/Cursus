/**
 * @fileoverview Orquestador de la página del Simulador de Horarios.
 * Coordina los módulos data, grid y drag. Inicializa eventos,
 * gestiona el estado global y expone funciones legacy en window.
 * @module views/horarios/horarios-main
 */

'use strict';

import {
  fetchAvailableSubjects,
  fetchScheduleState,
  syncSchedule,
  searchUser,
  fetchUserSchedule,
  loadPersonalActivities,
  savePersonalActivities,
  buildCodigo,
  getCommissionByTime,
  getAuthHeaders
} from './horarios-data.js';

import {
  renderTimeLabels,
  renderGridLines,
  renderAvailablePanels,
  renderBlocksOnTracks,
  populateTimeSelects,
  checkOverlaps,
  renderComparisonSidebar,
  exportToICS,
  timeToMin,
  minToTime,
  DAYS
} from './horarios-grid.js';

import {
  handleDragStart,
  clearDragData,
  setupDropZones,
  initBlockVerticalDrag,
  initBlockVerticalResize
} from './horarios-drag.js';

import { todayDateStr } from '../../shared/utils.js';

// ── Estado global ───────────────────────────────────────────────────────────

export let AVAILABLE_SUBJECTS = [];

export const schedState = {
  blocks: [],
  personalActivities: [],
  selectedBlockId: null,
  comparisonBlocks: [],
  comparisonUsers: [],
  currentVersion: 'A'
};

// ── Inicialización ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const printDateEl = document.getElementById('print-generated-date');
  if (printDateEl) {
    const today = new Date();
    printDateEl.textContent = today.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  schedState.personalActivities = loadPersonalActivities();

  await loadInitialData();
  renderAll();
  setupDropZones(onBlockDrop);
  setupEventListeners();
});

async function loadInitialData() {
  try {
    const data = await fetchAvailableSubjects();
    AVAILABLE_SUBJECTS = data
      .filter(m => m.estado === 'cursando')
      .map(m => ({ id: m.id, nombre: m.nombre, codigo: buildCodigo(m.nombre), nivel: `${m.nivel}° Año` }));
  } catch (e) {
    console.error(e);
    AVAILABLE_SUBJECTS = [];
  }

  try {
    const data = await fetchScheduleState();
    schedState.blocks = data.map(b => ({
      id: `b_${b.id}`,
      tipo: b.tipo,
      nombre: b.nombre,
      codigo: b.tipo === 'materia' ? buildCodigo(b.nombre) : null,
      materia_id: b.materia_id,
      dia: b.dia,
      inicio: b.inicio,
      fin: b.fin,
      color: b.color || null,
      version: b.version || 'A',
      comision: b.tipo === 'materia' ? getCommissionByTime(b.inicio) : 'Actividad Personal'
    }));
  } catch (e) {
    console.error(e);
    schedState.blocks = [];
  }
}

function renderAll() {
  renderTimeLabels();
  renderGridLines();
  renderAvailablePanels(AVAILABLE_SUBJECTS, schedState.personalActivities, handleDragStart);
  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  checkOverlaps(schedState.blocks);
}

function setupEventListeners() {
  document.getElementById('btn-add-activity').addEventListener('click', () => {
    const id = `p_${Date.now()}`;
    schedState.personalActivities.push({ id, nombre: 'Nueva Actividad' });
    savePersonalActivities(schedState.personalActivities);
    renderAvailablePanels(AVAILABLE_SUBJECTS, schedState.personalActivities, handleDragStart);
  });

  document.getElementById('editor-start-time').addEventListener('change', handleManualTimeChange);
  document.getElementById('editor-end-time').addEventListener('change', handleManualTimeChange);

  document.getElementById('editor-btn-delete-block').addEventListener('click', () => {
    if (schedState.selectedBlockId) deleteBlock(schedState.selectedBlockId);
  });

  document.getElementById('btn-clear-grid').addEventListener('click', () => {
    const ver = schedState.currentVersion || 'A';
    window.showCustomConfirm(
      'Vaciar Grilla',
      `¿Seguro que deseas vaciar toda tu grilla horaria semanal (Versión ${ver})? Esta acción no se puede deshacer.`,
      () => {
        schedState.blocks = schedState.blocks.filter(b => (b.version || 'A') !== ver);
        deselectBlock();
        renderAll();
      },
      'Vaciar',
      'btn-confirm-delete'
    );
  });

  document.getElementById('btn-save-schedule').addEventListener('click', handleSaveSchedule);

  document.getElementById('modal-start-time-select').addEventListener('change', (e) => {
    const startMin = timeToMin(e.target.value);
    const endSelect = document.getElementById('modal-end-time-select');
    const targetEndMin = startMin + 120;
    endSelect.value = targetEndMin <= 23 * 60 ? minToTime(targetEndMin) : '23:00';

    const tipo = document.getElementById('modal-item-type').value;
    if (tipo === 'materia') {
      document.getElementById('modal-commission-select').value = getCommissionByTime(e.target.value);
    }
  });
}

// ── Block lifecycle ─────────────────────────────────────────────────────────

function onBlockDrop(newBlock) {
  newBlock.version = schedState.currentVersion;
  schedState.blocks.push(newBlock);
  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  checkOverlaps(schedState.blocks);
  selectBlock(newBlock.id);
}

export function selectBlock(id) {
  schedState.selectedBlockId = id;
  document.querySelectorAll('.sched-time-block').forEach(div => {
    div.classList.toggle('selected', div.dataset.blockId === id);
  });

  const block = schedState.blocks.find(b => b.id === id);
  if (block) {
    const editor = document.getElementById('sched-manual-editor');
    editor.style.display = 'flex';

    document.getElementById('editor-selected-title').textContent = `${block.nombre} (${block.comision})`;
    document.getElementById('editor-selected-type').textContent = block.tipo.toUpperCase();
    document.getElementById('editor-selected-type').className = `editor-block-type-badge ${block.tipo === 'actividad' ? 'act' : ''}`;

    document.getElementById('editor-start-time').value = block.inicio;
    document.getElementById('editor-end-time').value = block.fin;

    const activeColor = block.color || (block.tipo === 'materia' ? '#4f46e5' : '#9333ea');
    document.querySelectorAll('.editor-color-picker .color-dot').forEach(dot => {
      if (dot.dataset.color === activeColor) {
        dot.classList.add('active');
        dot.style.borderColor = '#ffffff';
      } else {
        dot.classList.remove('active');
        dot.style.borderColor = 'transparent';
      }
    });
  }
}

function deselectBlock() {
  schedState.selectedBlockId = null;
  document.querySelectorAll('.sched-time-block').forEach(div => div.classList.remove('selected'));
  const editor = document.getElementById('sched-manual-editor');
  if (editor) editor.style.display = 'none';
}

function deleteBlock(id) {
  schedState.blocks = schedState.blocks.filter(b => b.id !== id);
  if (schedState.selectedBlockId === id) deselectBlock();
  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  checkOverlaps(schedState.blocks);
}

function handleManualTimeChange() {
  if (!schedState.selectedBlockId) return;
  const block = schedState.blocks.find(b => b.id === schedState.selectedBlockId);
  if (!block) return;

  const startVal = document.getElementById('editor-start-time').value;
  const endVal = document.getElementById('editor-end-time').value;
  const startMin = timeToMin(startVal);
  const endMin = timeToMin(endVal);
  const notif = document.getElementById('editor-notification-area');

  if (endMin <= startMin) {
    notif.textContent = '❌ Fin inválido';
    notif.style.color = '#dc2626';
    return;
  }

  notif.textContent = '';
  block.inicio = startVal;
  block.fin = endVal;

  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  checkOverlaps(schedState.blocks);
  if (block.tipo === 'materia') {
    checkAlternativeCommissions(block);
  }
}

// ── Save handler ────────────────────────────────────────────────────────────

async function handleSaveSchedule() {
  let conflicts = [];
  for (let d = 1; d <= 6; d++) {
    const dayBlocks = schedState.blocks.filter(b => b.dia === d);
    const dayName = DAYS.find(x => x.id === d).name;

    for (let i = 0; i < dayBlocks.length; i++) {
      for (let j = i + 1; j < dayBlocks.length; j++) {
        const b1 = dayBlocks[i];
        const b2 = dayBlocks[j];
        const s1 = timeToMin(b1.inicio);
        const e1 = timeToMin(b1.fin);
        const s2 = timeToMin(b2.inicio);
        const e2 = timeToMin(b2.fin);

        if (s1 < e2 && s2 < e1) {
          conflicts.push({
            diaName: dayName,
            n1: b1.nombre,
            n2: b2.nombre,
            h1: `${b1.inicio} hs a ${b1.fin} hs`,
            h2: `${b2.inicio} hs a ${b2.fin} hs`
          });
        }
      }
    }
  }

  if (conflicts.length > 0) {
    const c = conflicts[0];
    const errorMsg = `No se puede guardar el horario. Superposición horaria detectada el día ${c.diaName}: '${c.n1}' se cruza con '${c.n2}' entre las ${c.h1} y las ${c.h2}.`;

    const editor = document.getElementById('sched-manual-editor');
    editor.style.display = 'flex';
    document.getElementById('editor-selected-title').textContent = '⚠️ Superposición horaria';
    document.getElementById('editor-selected-type').textContent = 'ERROR';
    document.getElementById('editor-selected-type').className = 'editor-block-type-badge error';

    const notif = document.getElementById('editor-notification-area');
    notif.textContent = errorMsg;
    notif.style.color = '#dc2626';
    return;
  }

  const ver = schedState.currentVersion || 'A';
  window.showCustomConfirm(
    'Guardar Horario',
    `¿Deseas guardar los cambios en tu grilla horaria (Versión ${ver})?`,
    async () => {
      try {
        await syncSchedule(ver, schedState.blocks
          .filter(b => (b.version || 'A') === ver)
          .map(b => ({
            tipo: b.tipo,
            materia_id: b.tipo === 'materia' ? b.materia_id : null,
            titulo_actividad: b.tipo === 'actividad' ? b.nombre : null,
            dia_semana: b.dia,
            hora_inicio: b.inicio,
            hora_fin: b.fin,
            color: b.color || null
          }))
        );

        window.showToast('¡Horario semanal guardado con éxito!');
        deselectBlock();
      } catch (e) {
        console.error('No se pudo guardar el horario', e);
        window.showToast('No se pudo guardar el horario.', 'error');
      }
    },
    'Guardar',
    'btn-primary'
  );
}

// ── Modal handlers ──────────────────────────────────────────────────────────

window.openAddModal = function(itemId, tipo) {
  const modal = document.getElementById('add-block-modal');
  modal.style.display = 'flex';
  modal.querySelector('.sched-modal-title').textContent = 'Agregar a la grilla';
  const submitBtn = modal.querySelector('.sched-modal-ft button.btn-primary');
  submitBtn.textContent = 'Agregar a grilla';
  submitBtn.onclick = submitAddModal;

  document.getElementById('modal-item-id').value = itemId;
  document.getElementById('modal-item-type').value = tipo;

  let nombre = '';
  if (tipo === 'materia') {
    const sub = AVAILABLE_SUBJECTS.find(s => String(s.id) === String(itemId));
    nombre = sub ? sub.nombre : '';
    document.getElementById('modal-item-name').readOnly = true;
    document.getElementById('modal-item-name').className = 'modal-inp-readonly';
    document.getElementById('modal-commission-select').style.display = 'block';
    document.getElementById('modal-comm-lbl').style.display = 'block';
  } else {
    const act = schedState.personalActivities.find(a => a.id === itemId);
    nombre = act ? act.nombre : '';
    document.getElementById('modal-item-name').readOnly = false;
    document.getElementById('modal-item-name').className = 'modal-select';
    document.getElementById('modal-commission-select').style.display = 'none';
    document.getElementById('modal-comm-lbl').style.display = 'none';
  }

  document.getElementById('modal-item-name').value = nombre;
  populateTimeSelects();

  if (tipo === 'materia') {
    document.getElementById('modal-commission-select').value = getCommissionByTime('18:30');
  }
};

window.openEditModal = function(blockId) {
  const block = schedState.blocks.find(b => b.id === blockId);
  if (!block) return;

  const modal = document.getElementById('add-block-modal');
  modal.style.display = 'flex';
  modal.querySelector('.sched-modal-title').textContent = 'Editar actividad en grilla';
  const submitBtn = modal.querySelector('.sched-modal-ft button.btn-primary');
  submitBtn.textContent = 'Guardar cambios';
  submitBtn.onclick = function() { submitEditModal(blockId); };

  document.getElementById('modal-item-id').value = block.id;
  document.getElementById('modal-item-type').value = block.tipo;
  document.getElementById('modal-item-name').value = block.nombre;
  document.getElementById('modal-day-select').value = block.dia;

  if (block.tipo === 'materia') {
    document.getElementById('modal-item-name').readOnly = true;
    document.getElementById('modal-item-name').className = 'modal-inp-readonly';
    document.getElementById('modal-commission-select').style.display = 'block';
    document.getElementById('modal-comm-lbl').style.display = 'block';
    document.getElementById('modal-commission-select').value = block.comision;
  } else {
    document.getElementById('modal-item-name').readOnly = false;
    document.getElementById('modal-item-name').className = 'modal-select';
    document.getElementById('modal-commission-select').style.display = 'none';
    document.getElementById('modal-comm-lbl').style.display = 'none';
  }

  populateTimeSelects();
  document.getElementById('modal-start-time-select').value = block.inicio;
  document.getElementById('modal-end-time-select').value = block.fin;
};

window.closeAddModal = function() {
  document.getElementById('add-block-modal').style.display = 'none';
};

function submitAddModal() {
  const itemId = document.getElementById('modal-item-id').value;
  const tipo = document.getElementById('modal-item-type').value;
  const nombre = document.getElementById('modal-item-name').value;
  const dayId = parseInt(document.getElementById('modal-day-select').value);
  const startVal = document.getElementById('modal-start-time-select').value;
  const endVal = document.getElementById('modal-end-time-select').value;

  const startMin = timeToMin(startVal);
  const endMin = timeToMin(endVal);

  if (endMin <= startMin) {
    alert('La hora de fin debe ser posterior a la de inicio.');
    return;
  }

  let codigo = null;
  let materiaId = null;
  let comision = 'Actividad Personal';

  if (tipo === 'materia') {
    const sub = AVAILABLE_SUBJECTS.find(s => String(s.id) === String(itemId));
    codigo = sub ? sub.codigo : null;
    materiaId = sub ? sub.id : null;
    comision = document.getElementById('modal-commission-select').value;
  } else {
    const act = schedState.personalActivities.find(a => a.id === itemId);
    if (act) act.nombre = nombre;
  }

  const newBlock = {
    id: `block_${Date.now()}`,
    tipo,
    nombre,
    codigo,
    materia_id: materiaId,
    dia: dayId,
    inicio: startVal,
    fin: endVal,
    color: null,
    version: schedState.currentVersion,
    comision
  };

  schedState.blocks.push(newBlock);
  savePersonalActivities(schedState.personalActivities);
  renderAvailablePanels(AVAILABLE_SUBJECTS, schedState.personalActivities, handleDragStart);
  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  checkOverlaps(schedState.blocks);
  selectBlock(newBlock.id);
  window.closeAddModal();
}

window.submitAddModal = submitAddModal;

function submitEditModal(blockId) {
  const block = schedState.blocks.find(b => b.id === blockId);
  if (!block) return;

  const nombre = document.getElementById('modal-item-name').value;
  const dayId = parseInt(document.getElementById('modal-day-select').value);
  const startVal = document.getElementById('modal-start-time-select').value;
  const endVal = document.getElementById('modal-end-time-select').value;

  const startMin = timeToMin(startVal);
  const endMin = timeToMin(endVal);

  if (endMin <= startMin) {
    alert('La hora de fin debe ser posterior a la de inicio.');
    return;
  }

  block.nombre = nombre;
  block.dia = dayId;
  block.inicio = startVal;
  block.fin = endVal;

  if (block.tipo === 'materia') {
    block.comision = document.getElementById('modal-commission-select').value;
  }

  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  checkOverlaps(schedState.blocks);
  selectBlock(block.id);
  window.closeAddModal();
}

window.submitEditModal = submitEditModal;

// ── Inline block handlers ──────────────────────────────────────────────────

window.deleteBlockInline = function(id, event) {
  event.stopPropagation();
  deleteBlock(id);
};

window.deletePersonalActivityTemplate = function(id, event) {
  event.stopPropagation();
  const act = schedState.personalActivities.find(a => a.id === id);
  const nombre = act ? act.nombre : 'esta actividad';

  window.showCustomConfirm(
    'Eliminar Actividad',
    `¿Estás seguro de que deseas eliminar "${nombre}" de tu lista de plantillas disponibles?`,
    () => {
      schedState.personalActivities = schedState.personalActivities.filter(a => a.id !== id);
      savePersonalActivities(schedState.personalActivities);
      renderAvailablePanels(AVAILABLE_SUBJECTS, schedState.personalActivities, handleDragStart);
    }
  );
};

// ── Version switching ──────────────────────────────────────────────────────

window.switchVersion = function(version) {
  if (schedState.currentVersion === version) return;

  schedState.currentVersion = version;
  deselectBlock();

  document.querySelectorAll('.version-tabs .btn-version').forEach(btn => {
    if (btn.id === `btn-version-${version}` || btn.id === `mob-btn-version-${version}`) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const printBadge = document.getElementById('print-active-version-badge');
  if (printBadge) printBadge.textContent = `Versión ${version}`;

  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  checkOverlaps(schedState.blocks);
  window.showToast(`Cargada la Versión ${version}`, 'success');
};

// ── Color change ────────────────────────────────────────────────────────────

window.changeBlockColor = function(colorHex) {
  if (!schedState.selectedBlockId) return;

  const block = schedState.blocks.find(b => b.id === schedState.selectedBlockId);
  if (block) {
    block.color = colorHex;

    renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);

    document.querySelectorAll('.editor-color-picker .color-dot').forEach(dot => {
      if (dot.dataset.color === colorHex) {
        dot.classList.add('active');
        dot.style.borderColor = '#ffffff';
      } else {
        dot.classList.remove('active');
        dot.style.borderColor = 'transparent';
      }
    });

    window.showToast('Color de bloque actualizado', 'success');
  }
};

// ── Comparison ──────────────────────────────────────────────────────────────

window.searchCompareUser = async function() {
  const input = document.getElementById('compare-search-input');
  const searchVal = input.value.trim();
  const listArea = document.getElementById('compare-status-list');

  if (!searchVal) {
    alert('Ingresa un email o legajo para buscar.');
    return;
  }

  if (schedState.comparisonUsers.length >= 3) {
    alert('Límite alcanzado: solo puedes comparar con hasta 3 compañeros a la vez.');
    return;
  }

  listArea.innerHTML = '<span style="color: #60a5fa; font-size: 11.5px; padding: 4px 0;">Buscando compañero...</span>';

  try {
    const data = await searchUser(searchVal);

    if (data.length === 0) {
      renderComparisonSidebar(schedState.comparisonUsers);
      alert('Compañero no encontrado.');
      return;
    }

    const user = data[0];

    if (schedState.comparisonUsers.some(u => String(u.id) === String(user.id))) {
      renderComparisonSidebar(schedState.comparisonUsers);
      alert('Este compañero ya está agregado a la comparación.');
      return;
    }

    const presetColors = ['#4f46e5', '#10b981', '#f59e0b'];
    const usedColors = schedState.comparisonUsers.map(u => u.color);
    const color = presetColors.find(c => !usedColors.includes(c)) || '#f43f5e';

    const scheduleData = await fetchUserSchedule(user.id);

    schedState.comparisonUsers.push({ id: user.id, nombre: user.nombre, color });

    const newCompBlocks = scheduleData.bloques.map(b => ({
      id: `comp_${user.id}_${b.id}`,
      userId: user.id,
      userName: user.nombre,
      userColor: color,
      tipo: b.tipo,
      nombre: b.nombre,
      codigo: b.tipo === 'materia' ? buildCodigo(b.nombre) : null,
      materia_id: b.materia_id,
      dia: b.dia,
      inicio: b.inicio,
      fin: b.fin,
      version: b.version || 'A',
      comision: b.tipo === 'materia' ? getCommissionByTime(b.inicio) : 'Actividad Personal'
    }));

    schedState.comparisonBlocks.push(...newCompBlocks);

    input.value = '';
    renderComparisonSidebar(schedState.comparisonUsers);
    renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
    window.showToast(`Comparando horario con ${user.nombre}`, 'success');
  } catch (e) {
    console.error(e);
    renderComparisonSidebar(schedState.comparisonUsers);
    alert('Error al buscar o cargar el horario del compañero.');
  }
};

window.removeComparedUser = function(userId) {
  schedState.comparisonUsers = schedState.comparisonUsers.filter(u => String(u.id) !== String(userId));
  schedState.comparisonBlocks = schedState.comparisonBlocks.filter(b => String(b.userId) !== String(userId));

  renderComparisonSidebar(schedState.comparisonUsers);
  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  window.showToast('Compañero quitado de la comparación', 'info');
};

window.clearComparison = function() {
  schedState.comparisonUsers = [];
  schedState.comparisonBlocks = [];

  renderComparisonSidebar(schedState.comparisonUsers);
  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  window.showToast('Comparación desactivada', 'info');
};

// ── Export / Print ──────────────────────────────────────────────────────────

window.exportToICS = function() {
  exportToICS(schedState.blocks);
};

window.printSchedule = function() {
  window.print();
};

// ── UTN Presets ─────────────────────────────────────────────────────────────

const UTN_SCHEDULE_PRESETS = {
  M1A_1: [
    { nombre: 'Programación I', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'indigo' },
    { nombre: 'Matemática', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'emerald' },
    { nombre: 'Programación I', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'indigo' },
    { nombre: 'Arquitectura y Sistemas Operativos', dia: 4, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'purple' },
    { nombre: 'Organización Empresarial', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'amber' }
  ],
  M1B_1: [
    { nombre: 'Organización Empresarial', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'amber' },
    { nombre: 'Arquitectura y Sistemas Operativos', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'purple' },
    { nombre: 'Programación I', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'indigo' },
    { nombre: 'Matemática', dia: 4, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'emerald' },
    { nombre: 'Programación I', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'indigo' }
  ],
  M2_1: [
    { nombre: 'Inglés I', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'rose' },
    { nombre: 'Programación II', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'indigo' },
    { nombre: 'Probabilidad y Estadística', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'emerald' },
    { nombre: 'Programación II', dia: 4, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'indigo' },
    { nombre: 'Base de Datos I', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'sky' }
  ],
  M3_1: [
    { nombre: 'Programación III', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'indigo' },
    { nombre: 'Base de Datos II', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'sky' },
    { nombre: 'Inglés II', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'rose' },
    { nombre: 'Programación III', dia: 4, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'indigo' },
    { nombre: 'Metodología de Sistemas I', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'purple' }
  ],
  M4_1: [
    { nombre: 'Metodología de Sistemas II', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M4', color: 'purple' },
    { nombre: 'Programación IV', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M4', color: 'indigo' },
    { nombre: 'Programación IV', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M4', color: 'indigo' },
    { nombre: 'Introducción al Análisis de Datos', dia: 4, inicio: '08:30', fin: '10:30', comision: 'M4', color: 'sky' },
    { nombre: 'Legislación', dia: 4, inicio: '10:30', fin: '12:30', comision: 'M4', color: 'amber' },
    { nombre: 'Gestión de Desarrollo de Software', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M4', color: 'emerald' }
  ],
  N1_1: [
    { nombre: 'Organización Empresarial', dia: 1, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'amber' },
    { nombre: 'Programación I', dia: 2, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'indigo' },
    { nombre: 'Arquitectura y Sistemas Operativos', dia: 3, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'purple' },
    { nombre: 'Matemática', dia: 4, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'emerald' },
    { nombre: 'Programación I', dia: 5, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'indigo' }
  ],
  N3_1: [
    { nombre: 'Inglés II', dia: 1, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'rose' },
    { nombre: 'Base de Datos II', dia: 2, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'sky' },
    { nombre: 'Programación III', dia: 3, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'indigo' },
    { nombre: 'Metodología de Sistemas I', dia: 4, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'purple' },
    { nombre: 'Programación III', dia: 5, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'indigo' }
  ],
  M1A_2: [
    { nombre: 'Programación II', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'indigo' },
    { nombre: 'Probabilidad y Estadística', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'emerald' },
    { nombre: 'Programación II', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'indigo' },
    { nombre: 'Base de Datos I', dia: 4, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'sky' },
    { nombre: 'Inglés I', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M1A', color: 'rose' }
  ],
  M1B_2: [
    { nombre: 'Inglés I', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'rose' },
    { nombre: 'Base de Datos I', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'sky' },
    { nombre: 'Programación II', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'indigo' },
    { nombre: 'Probabilidad y Estadística', dia: 4, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'emerald' },
    { nombre: 'Programación II', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M1B', color: 'indigo' }
  ],
  M2_2: [
    { nombre: 'Inglés II', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'rose' },
    { nombre: 'Base de Datos II', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'sky' },
    { nombre: 'Programación III', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'indigo' },
    { nombre: 'Metodología de Sistemas I', dia: 4, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'purple' },
    { nombre: 'Programación III', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M2', color: 'indigo' }
  ],
  M3_2: [
    { nombre: 'Metodología de Sistemas II', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'purple' },
    { nombre: 'Programación IV', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'indigo' },
    { nombre: 'Programación IV', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'indigo' },
    { nombre: 'Introducción al Análisis de Datos', dia: 4, inicio: '08:30', fin: '10:30', comision: 'M3', color: 'sky' },
    { nombre: 'Legislación', dia: 4, inicio: '10:30', fin: '12:30', comision: 'M3', color: 'amber' },
    { nombre: 'Gestión de Desarrollo de Software', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M3', color: 'emerald' }
  ],
  M4_2: [
    { nombre: 'Metodología de Sistemas II', dia: 1, inicio: '08:30', fin: '12:30', comision: 'M4', color: 'purple' },
    { nombre: 'Programación IV', dia: 2, inicio: '08:30', fin: '12:30', comision: 'M4', color: 'indigo' },
    { nombre: 'Programación IV', dia: 3, inicio: '08:30', fin: '12:30', comision: 'M4', color: 'indigo' },
    { nombre: 'Introducción al Análisis de Datos', dia: 4, inicio: '08:30', fin: '10:30', comision: 'M4', color: 'sky' },
    { nombre: 'Legislación', dia: 4, inicio: '10:30', fin: '12:30', comision: 'M4', color: 'amber' },
    { nombre: 'Gestión de Desarrollo de Software', dia: 5, inicio: '08:30', fin: '12:30', comision: 'M4', color: 'emerald' }
  ],
  N1_2: [
    { nombre: 'Inglés I', dia: 1, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'rose' },
    { nombre: 'Programación II', dia: 2, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'indigo' },
    { nombre: 'Base de Datos I', dia: 3, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'sky' },
    { nombre: 'Probabilidad y Estadística', dia: 4, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'emerald' },
    { nombre: 'Programación II', dia: 5, inicio: '18:30', fin: '22:30', comision: 'N1', color: 'indigo' }
  ],
  N3_2: [
    { nombre: 'Metodología de Sistemas II', dia: 1, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'purple' },
    { nombre: 'Programación IV', dia: 2, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'indigo' },
    { nombre: 'Programación IV', dia: 3, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'indigo' },
    { nombre: 'Introducción al Análisis de Datos', dia: 4, inicio: '18:30', fin: '20:30', comision: 'N3', color: 'sky' },
    { nombre: 'Legislación', dia: 4, inicio: '20:30', fin: '22:30', comision: 'N3', color: 'amber' },
    { nombre: 'Gestión de Desarrollo de Software', dia: 5, inicio: '18:30', fin: '22:30', comision: 'N3', color: 'emerald' }
  ]
};

const THEME_NAME_TO_HEX = {
  indigo: '#4f46e5',
  purple: '#9333ea',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  sky: '#0ea5e9'
};

window.loadUTNPresetSchedule = function() {
  const select = document.getElementById('utn-presets-select');
  if (!select) return;

  const presetKey = select.value;
  if (!presetKey) return;

  const presetBlocks = UTN_SCHEDULE_PRESETS[presetKey];
  if (!presetBlocks) return;

  const selectOptionText = select.options[select.selectedIndex].text;

  window.showCustomConfirm(
    'Cargar Horario Oficial UTN',
    `¿Deseas cargar la plantilla oficial de "${selectOptionText}"? Esto vaciará todos los bloques de tu Versión ${schedState.currentVersion} actual.`,
    () => {
      schedState.blocks = schedState.blocks.filter(
        b => (b.version || 'A') !== schedState.currentVersion
      );

      presetBlocks.forEach((preset, idx) => {
        const matchedSub = AVAILABLE_SUBJECTS.find(
          s => s.nombre.toLowerCase().trim() === preset.nombre.toLowerCase().trim()
        );

        schedState.blocks.push({
          id: `preset-${presetKey}-${idx}-${Date.now()}`,
          materia_id: matchedSub ? matchedSub.id : null,
          nombre: preset.nombre,
          tipo: 'materia',
          codigo: matchedSub ? matchedSub.codigo : buildCodigo(preset.nombre),
          comision: preset.comision,
          dia: preset.dia,
          inicio: preset.inicio,
          fin: preset.fin,
          color: THEME_NAME_TO_HEX[preset.color] || preset.color,
          version: schedState.currentVersion
        });
      });

      deselectBlock();
      renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
      checkOverlaps(schedState.blocks);
      window.showToast(`Horario ${selectOptionText} cargado con éxito`, 'success');

      select.value = '';
    },
    'Cargar',
    'btn-primary'
  );

  select.value = '';
};

// ── Commission Alternative Suggester ────────────────────────────────────────

window.applyCommissionAlternative = function(subjectName, presetKey) {
  const presetBlocks = UTN_SCHEDULE_PRESETS[presetKey];
  if (!presetBlocks) return;

  schedState.blocks = schedState.blocks.filter(
    b => !(b.tipo === 'materia' && b.nombre.toLowerCase().trim() === subjectName.toLowerCase().trim() && (b.version || 'A') === schedState.currentVersion)
  );

  presetBlocks.forEach((preset, idx) => {
    const matchedSub = AVAILABLE_SUBJECTS.find(
      s => s.nombre.toLowerCase().trim() === preset.nombre.toLowerCase().trim()
    );

    schedState.blocks.push({
      id: `preset-${presetKey}-${idx}-${Date.now()}`,
      materia_id: matchedSub ? matchedSub.id : null,
      nombre: preset.nombre,
      tipo: 'materia',
      codigo: matchedSub ? matchedSub.codigo : buildCodigo(preset.nombre),
      comision: preset.comision,
      dia: preset.dia,
      inicio: preset.inicio,
      fin: preset.fin,
      color: preset.color,
      version: schedState.currentVersion
    });
  });

  deselectBlock();
  renderBlocksOnTracks(schedState.blocks, schedState.comparisonBlocks, schedState.currentVersion, schedState.selectedBlockId);
  checkOverlaps(schedState.blocks);
  window.showToast(`Comisión cambiada a ${presetKey.split('_')[0]} para resolver conflicto`, 'info');
};

export function checkAlternativeCommissions(block) {
  const notifArea = document.getElementById('editor-notification-area');
  if (!notifArea) return;

  if (!block || block.tipo !== 'materia') {
    notifArea.innerHTML = '';
    return;
  }

  const blockDiv = document.querySelector(`.sched-time-block[data-block-id="${block.id}"]`);
  if (!blockDiv || !blockDiv.classList.contains('overlap-conflict')) {
    notifArea.innerHTML = '';
    return;
  }

  const subjectName = block.nombre.toLowerCase().trim();
  const presetsWithSubject = [];

  for (const presetKey in UTN_SCHEDULE_PRESETS) {
    const blocksInPreset = UTN_SCHEDULE_PRESETS[presetKey];
    if (blocksInPreset.some(b => b.nombre.toLowerCase().trim() === subjectName)) {
      presetsWithSubject.push(presetKey);
    }
  }

  const otherBlocks = schedState.blocks.filter(
    b => !(b.tipo === 'materia' && b.nombre.toLowerCase().trim() === subjectName && (b.version || 'A') === schedState.currentVersion)
  );

  let foundAlternative = null;

  for (const presetKey of presetsWithSubject) {
    const presetBlocks = UTN_SCHEDULE_PRESETS[presetKey];
    const commissionName = presetBlocks[0].comision;

    if (block.comision === commissionName) continue;

    let hasConflict = false;

    for (const presetB of presetBlocks) {
      if (presetB.nombre.toLowerCase().trim() !== subjectName) continue;

      const s1 = timeToMin(presetB.inicio);
      const e1 = timeToMin(presetB.fin);

      for (const otherB of otherBlocks) {
        if (otherB.dia !== presetB.dia) continue;

        const s2 = timeToMin(otherB.inicio);
        const e2 = timeToMin(otherB.fin);

        if (s1 < e2 && s2 < e1) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) break;
    }

    if (!hasConflict) {
      foundAlternative = { key: presetKey, commission: commissionName };
      break;
    }
  }

  if (foundAlternative) {
    notifArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 4px 10px; border-radius: 6px; box-sizing: border-box;">
        <span style="color: #34d399; font-weight: bold; font-size: 11px; white-space: nowrap;">💡 Usar Com. ${foundAlternative.commission}:</span>
        <button onclick="applyCommissionAlternative('${block.nombre}', '${foundAlternative.key}')" style="background: #10b981; color: #fff; border: none; padding: 2px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; font-weight: bold; transition: background 0.15s; white-space: nowrap;">Cambiar</button>
      </div>
    `;
  } else {
    notifArea.innerHTML = '<span style="color: #ef4444; font-weight: 600; font-size: 11.5px;">⚠️ Solapado</span>';
  }
}

// ── Diálogo de confirmación personalizado ─────────────────────────────────

window.showCustomConfirm = function(title, message, onConfirm, confirmText = 'Eliminar', confirmClass = 'btn-confirm-delete') {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-confirm-backdrop';

  backdrop.innerHTML = `
    <div class="custom-confirm-card">
      <div class="custom-confirm-title">
        <span>⚠️</span>
        <span>${title}</span>
      </div>
      <div class="custom-confirm-body">${message}</div>
      <div class="custom-confirm-footer">
        <button class="btn-secondary" id="confirm-btn-cancel" style="padding: 7px 16px; border-radius: 8px; font-size: 13px;">Cancelar</button>
        <button class="${confirmClass}" id="confirm-btn-ok" style="padding: 7px 16px; border-radius: 8px; font-size: 13px;">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  setTimeout(() => backdrop.classList.add('show'), 10);

  const close = () => {
    backdrop.classList.remove('show');
    setTimeout(() => backdrop.remove(), 200);
  };

  backdrop.querySelector('#confirm-btn-cancel').addEventListener('click', close);
  backdrop.querySelector('#confirm-btn-ok').addEventListener('click', () => {
    onConfirm();
    close();
  });
};
