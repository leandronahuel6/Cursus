// Cursus - Simulador de Horarios con Grilla Semanal (UTN Haedo)

// Rango del día: 08:00 a 23:00
const START_HOUR = 8;
const END_HOUR = 23;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 15 horas * 60 = 900 minutos
const PX_PER_HOUR = 48; // 1 hora = 48px
const PX_PER_MINUTE = PX_PER_HOUR / 60; // 1 min = 0.8px
const COLUMN_HEIGHT = TOTAL_MINUTES * PX_PER_MINUTE; // 900 * 0.8 = 720px

// Días de la semana (Lunes a Sábado)
const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' }
];

const API_BASE = '/api';

// Materias disponibles para agendar: se cargan desde la BD (ver loadAvailableSubjects()),
// filtradas a las que el usuario está cursando actualmente.
let AVAILABLE_SUBJECTS = [];

// Estado global
let schedState = {
  blocks: [], // [{ id, tipo, nombre, codigo, materia_id, dia, inicio, fin, comision }]
  personalActivities: [
    { id: 'p_work', nombre: 'Trabajo' },
    { id: 'p_gym', nombre: 'Gimnasio' }
  ],
  selectedBlockId: null
};

// Headers de autenticación (token Sanctum guardado por login.js, en
// localStorage si se marcó "Recordarme" o en sessionStorage si no)
function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

// Código corto para mostrar en las tarjetas, derivado del nombre real de la materia
// (no es un dato de la BD, es solo una transformación visual del nombre).
function buildCodigo(nombre) {
  return nombre
    .split(' ')
    .filter(palabra => palabra.length > 2)
    .map(palabra => palabra.slice(0, 3).toUpperCase())
    .join('')
    .slice(0, 8);
}

// Conversiones
function minToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMin(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getCommissionByTime(startVal) {
  const [h, m] = startVal.split(':').map(Number);
  if (h >= 8 && h < 12) {
    return 'Comisión 3 (Mañana)';
  } else if (h >= 12 && h < 18) {
    return 'Comisión 2 (Tarde)';
  } else {
    return 'Comisión 1 (Noche)';
  }
}

// Trae del backend las materias que el usuario está cursando actualmente
// (estado_historico = 'cursando'), únicas habilitadas para agendar en la grilla.
async function loadAvailableSubjects() {
  try {
    const response = await fetch(`${API_BASE}/mis-materias`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar las materias');
    const data = await response.json();
    AVAILABLE_SUBJECTS = data
      .filter(m => m.estado === 'cursando')
      .map(m => ({ id: m.id, nombre: m.nombre, codigo: buildCodigo(m.nombre), nivel: `${m.nivel}° Año` }));
  } catch (e) {
    console.error(e);
    AVAILABLE_SUBJECTS = [];
  }
}

// Trae del backend la grilla horaria ya guardada del usuario. Las plantillas de
// actividades personales (no son materias) siguen viviendo en localStorage.
async function loadScheduleState() {
  const savedActivities = localStorage.getItem('cursus_personal_activities');
  if (savedActivities) {
    try {
      const parsed = JSON.parse(savedActivities);
      if (Array.isArray(parsed)) schedState.personalActivities = parsed;
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const response = await fetch(`${API_BASE}/horarios`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudo cargar el horario guardado');
    const data = await response.json();
    schedState.blocks = data.map(b => ({
      id: `b_${b.id}`,
      tipo: b.tipo,
      nombre: b.nombre,
      codigo: b.tipo === 'materia' ? buildCodigo(b.nombre) : null,
      materia_id: b.materia_id,
      dia: b.dia,
      inicio: b.inicio,
      fin: b.fin,
      comision: b.tipo === 'materia' ? getCommissionByTime(b.inicio) : 'Actividad Personal'
    }));
  } catch (e) {
    console.error(e);
    schedState.blocks = [];
  }
}

function saveScheduleState() {
  localStorage.setItem('cursus_personal_activities', JSON.stringify(schedState.personalActivities));
}

// Generar etiquetas de la columna de Horas (08:00 a 23:00 con intervalos de 30 min)
function renderTimeLabels() {
  const container = document.getElementById('grid-time-axis-labels');
  container.innerHTML = '';
  
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    // Hora en punto
    const labelHour = document.createElement('div');
    labelHour.className = 'grid-time-lbl-cell';
    labelHour.style.height = `${PX_PER_HOUR / 2}px`;
    labelHour.innerHTML = `<span>${String(h).padStart(2, '0')}:00</span>`;
    container.appendChild(labelHour);

    // Media hora
    if (h < END_HOUR) {
      const labelHalf = document.createElement('div');
      labelHalf.className = 'grid-time-lbl-cell half-hour';
      labelHalf.style.height = `${PX_PER_HOUR / 2}px`;
      labelHalf.innerHTML = `<span>${String(h).padStart(2, '0')}:30</span>`;
      container.appendChild(labelHalf);
    }
  }
}

// Generar líneas de fondo horizontales (sólidas para horas, punteadas para medias horas)
function renderGridLines() {
  const container = document.getElementById('grid-bg-lines');
  container.innerHTML = '';

  const hoursCount = END_HOUR - START_HOUR + 1;
  for (let i = 0; i < hoursCount; i++) {
    // Línea de hora entera
    const lineHour = document.createElement('div');
    lineHour.className = 'grid-bg-line-hour';
    lineHour.style.top = `${i * PX_PER_HOUR}px`;
    container.appendChild(lineHour);

    // Línea de media hora
    if (i < hoursCount - 1) {
      const lineHalf = document.createElement('div');
      lineHalf.className = 'grid-bg-line-half';
      lineHalf.style.top = `${i * PX_PER_HOUR + 24}px`;
      container.appendChild(lineHalf);
    }
  }
}

// Dibujar materias y actividades disponibles
function renderAvailablePanels() {
  const subjectsList = document.getElementById('list-available-subjects');
  subjectsList.innerHTML = '';

  AVAILABLE_SUBJECTS.forEach(sub => {
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

    card.addEventListener('dragstart', handleDragStart);
    subjectsList.appendChild(card);
  });

  const actList = document.getElementById('list-available-activities');
  actList.innerHTML = '';

  schedState.personalActivities.forEach(act => {
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

    card.addEventListener('dragstart', handleDragStart);
    actList.appendChild(card);
  });
}

window.deletePersonalActivityTemplate = function(id, event) {
  event.stopPropagation();
  if (confirm('¿Estás seguro de que deseas eliminar esta actividad de la lista de plantillas?')) {
    schedState.personalActivities = schedState.personalActivities.filter(a => a.id !== id);
    saveScheduleState();
    renderAvailablePanels();
  }
};

// Drag & Drop HTML5
let dragData = null;
function handleDragStart(e) {
  dragData = {
    tipo: this.dataset.type,
    itemId: this.dataset.itemId,
    nombre: this.dataset.name,
    codigo: this.dataset.code || null
  };
  e.dataTransfer.effectAllowed = 'copy';
}

document.getElementById('btn-add-activity').addEventListener('click', () => {
  const id = `p_${Date.now()}`;
  schedState.personalActivities.push({ id: id, nombre: 'Nueva Actividad' });
  saveScheduleState();
  renderAvailablePanels();
});

// Configurar drop zones
function setupDropZones() {
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
      
      // Convertir PX a minutos desde 08:00
      let dropMin = Math.round(clickY / PX_PER_MINUTE) + START_HOUR * 60;
      
      // Snap magnético a 30 min
      dropMin = Math.round(dropMin / 30) * 30;
      if (dropMin < START_HOUR * 60) dropMin = START_HOUR * 60;
      if (dropMin > (END_HOUR - 2) * 60) dropMin = (END_HOUR - 2) * 60; // Máximo inicio 21:00 hs

      const inicioStr = minToTime(dropMin);
      const finStr = minToTime(dropMin + 120); // 2 horas default

      const newBlock = {
        id: `block_${Date.now()}`,
        tipo: dragData.tipo,
        nombre: dragData.nombre,
        codigo: dragData.codigo,
        materia_id: dragData.tipo === 'materia' ? dragData.itemId : null,
        dia: dayId,
        inicio: inicioStr,
        fin: finStr,
        comision: dragData.tipo === 'materia' ? getCommissionByTime(inicioStr) : 'Actividad Personal'
      };

      schedState.blocks.push(newBlock);
      renderBlocksOnTracks();
      checkOverlaps();
      selectBlock(newBlock.id);

      dragData = null;
    });
  });
}

// Modal de precisión para añadir bloque
// Modal de precisión para añadir bloque
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

  // Poblar selectores de hora
  populateTimeSelects();

  // Valores default de comisión basados en la hora default (18:30)
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

function populateTimeSelects() {
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

  // Valores default: 18:30 a 21:30
  startSelect.value = '18:30';
  endSelect.value = '21:30';
}

// Listener para ajustar automáticamente la hora fin a +2 horas al cambiar inicio
document.getElementById('modal-start-time-select').addEventListener('change', (e) => {
  const startMin = timeToMin(e.target.value);
  const endSelect = document.getElementById('modal-end-time-select');
  const targetEndMin = startMin + 120; // +2 horas
  
  if (targetEndMin <= END_HOUR * 60) {
    endSelect.value = minToTime(targetEndMin);
  } else {
    endSelect.value = minToTime(END_HOUR * 60);
  }

  // Ajustar comisión automáticamente según la hora seleccionada
  const tipo = document.getElementById('modal-item-type').value;
  if (tipo === 'materia') {
    document.getElementById('modal-commission-select').value = getCommissionByTime(e.target.value);
  }
});

window.submitAddModal = function() {
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
    // Si es actividad personal, renombrar la plantilla en la barra lateral
    const act = schedState.personalActivities.find(a => a.id === itemId);
    if (act) {
      act.nombre = nombre;
    }
  }

  const newBlock = {
    id: `block_${Date.now()}`,
    tipo: tipo,
    nombre: nombre,
    codigo: codigo,
    materia_id: materiaId,
    dia: dayId,
    inicio: startVal,
    fin: endVal,
    comision: comision
  };

  schedState.blocks.push(newBlock);
  saveScheduleState();
  renderAvailablePanels();
  renderBlocksOnTracks();
  checkOverlaps();
  selectBlock(newBlock.id);

  closeAddModal();
};

window.submitEditModal = function(blockId) {
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

  saveScheduleState();
  renderBlocksOnTracks();
  checkOverlaps();
  selectBlock(block.id);

  closeAddModal();
};

// Renderizar bloques verticalmente en la grilla semanal
function renderBlocksOnTracks() {
  // Limpiar columnas de días
  for (let d = 1; d <= 6; d++) {
    document.getElementById(`col-day-${d}`).innerHTML = '';
  }

  schedState.blocks.forEach(b => {
    const col = document.getElementById(`col-day-${b.dia}`);
    if (!col) return; // Por si es Domingo (id 7) y no está en la grilla

    const startMin = timeToMin(b.inicio);
    const endMin = timeToMin(b.fin);
    const durMin = endMin - startMin;

    // Calcular coordenadas Y absolutas
    const topPx = (startMin - START_HOUR * 60) * PX_PER_MINUTE;
    const heightPx = durMin * PX_PER_MINUTE;

    const blockDiv = document.createElement('div');
    blockDiv.className = `sched-time-block ${b.tipo === 'actividad' ? 'act' : ''} ${schedState.selectedBlockId === b.id ? 'selected' : ''}`;
    blockDiv.style.top = `${topPx}px`;
    blockDiv.style.height = `${heightPx}px`;
    blockDiv.dataset.blockId = b.id;

    blockDiv.innerHTML = `
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

    // Eventos de movimiento (Drag con Mouse)
    blockDiv.addEventListener('mousedown', e => {
      if (e.target.classList.contains('block-btn-delete-x') || e.target.classList.contains('resize-handle')) {
        return;
      }
      selectBlock(b.id);
      initBlockVerticalDrag(b.id, e);
    });

    // Eventos de redimensionamiento vertical (top & bottom handles)
    const topH = blockDiv.querySelector('.top-handle');
    const bottomH = blockDiv.querySelector('.bottom-handle');

    topH.addEventListener('mousedown', e => {
      e.stopPropagation();
      initBlockVerticalResize(b.id, 'top', e);
    });

    bottomH.addEventListener('mousedown', e => {
      e.stopPropagation();
      initBlockVerticalResize(b.id, 'bottom', e);
    });

    col.appendChild(blockDiv);
  });
}

// Seleccionar bloque
function selectBlock(id) {
  schedState.selectedBlockId = id;
  document.querySelectorAll('.sched-time-block').forEach(div => {
    if (div.dataset.blockId === id) {
      div.classList.add('selected');
    } else {
      div.classList.remove('selected');
    }
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
  }
}

function deselectBlock() {
  schedState.selectedBlockId = null;
  document.querySelectorAll('.sched-time-block').forEach(div => div.classList.remove('selected'));
  document.getElementById('sched-manual-editor').style.display = 'none';
}

window.deleteBlockInline = function(id, event) {
  event.stopPropagation();
  deleteBlock(id);
};

function deleteBlock(id) {
  schedState.blocks = schedState.blocks.filter(b => b.id !== id);
  if (schedState.selectedBlockId === id) deselectBlock();
  renderBlocksOnTracks();
  checkOverlaps();
}

// Escuchar cambios de la barra manual
document.getElementById('editor-start-time').addEventListener('change', handleManualTimeChange);
document.getElementById('editor-end-time').addEventListener('change', handleManualTimeChange);

function handleManualTimeChange() {
  if (!schedState.selectedBlockId) return;
  const block = schedState.blocks.find(b => b.id === schedState.selectedBlockId);
  if (block) {
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

    renderBlocksOnTracks();
    checkOverlaps();
  }
}

document.getElementById('editor-btn-delete-block').addEventListener('click', () => {
  if (schedState.selectedBlockId) deleteBlock(schedState.selectedBlockId);
});

// Desplazamiento vertical e inter-columna (arrastrar bloque con mouse)
function initBlockVerticalDrag(id, startEvent) {
  const block = schedState.blocks.find(b => b.id === id);
  if (!block) return;

  const blockDiv = document.querySelector(`.sched-time-block[data-block-id="${id}"]`);
  const startY = startEvent.clientY;
  const startX = startEvent.clientX;
  
  const initialStartMin = timeToMin(block.inicio);
  const initialEndMin = timeToMin(block.fin);
  const duration = initialEndMin - initialStartMin; // guardamos duración
  
  const startOffsetMin = startMinToOffset(initialStartMin);
  const dayColElements = Array.from(document.querySelectorAll('.grid-day-col'));
  
  function startMinToOffset(min) {
    return min - START_HOUR * 60;
  }

  function handleMouseMove(e) {
    // 1. Movimiento Vertical (Tiempo)
    const deltaY = e.clientY - startY;
    const deltaMin = Math.round(deltaY / PX_PER_MINUTE);
    
    let newOffset = startOffsetMin + deltaMin;
    // Snap magnético de 30 min
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

    // Ajustar visualmente en el DOM
    blockDiv.style.top = `${newOffset * PX_PER_MINUTE}px`;
    blockDiv.querySelector('.block-meta-row').textContent = block.comision; // actualizar texto si cambia

    // 2. Movimiento Horizontal (Cambio de Día)
    // Buscamos sobre qué columna de día está flotando el mouse actualmente
    let hoverDayId = block.dia;
    dayColElements.forEach(col => {
      const rect = col.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right) {
        hoverDayId = parseInt(col.dataset.dayId);
      }
    });

    if (hoverDayId !== block.dia) {
      block.dia = hoverDayId;
      // Mover el div al contenedor de la nueva columna para que sea visible de inmediato
      const targetCol = document.getElementById(`col-day-${hoverDayId}`);
      if (targetCol) {
        targetCol.appendChild(blockDiv);
      }
    }

    if (schedState.selectedBlockId === id) {
      document.getElementById('editor-start-time').value = block.inicio;
      document.getElementById('editor-end-time').value = block.fin;
    }

    checkOverlaps();
  }

  function handleMouseUp(e) {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    const distY = Math.abs(e.clientY - startY);
    const distX = Math.abs(e.clientX - startX);
    if (distX < 4 && distY < 4) {
      openEditModal(id);
    } else {
      renderBlocksOnTracks(); // Re-renderizado final
    }
  }

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

// Redimensionar bloque verticalmente (top y bottom handles)
function initBlockVerticalResize(id, handle, startEvent) {
  const block = schedState.blocks.find(b => b.id === id);
  if (!block) return;

  const blockDiv = document.querySelector(`.sched-time-block[data-block-id="${id}"]`);
  const startY = startEvent.clientY;
  const startMin = timeToMin(block.inicio);
  const endMin = timeToMin(block.fin);

  function handleMouseMove(e) {
    const deltaY = e.clientY - startY;
    const deltaMin = Math.round(deltaY / PX_PER_MINUTE);

    if (handle === 'top') {
      let newStart = startMin + deltaMin;
      newStart = Math.round(newStart / 30) * 30; // snap
      if (newStart < START_HOUR * 60) newStart = START_HOUR * 60;
      if (newStart >= endMin - 30) newStart = endMin - 30; // Min 30 min

      block.inicio = minToTime(newStart);

      if (block.tipo === 'materia') {
        block.comision = getCommissionByTime(block.inicio);
      }

      const topPx = (newStart - START_HOUR * 60) * PX_PER_MINUTE;
      const heightPx = (endMin - newStart) * PX_PER_MINUTE;
      blockDiv.style.top = `${topPx}px`;
      blockDiv.style.height = `${heightPx}px`;
      blockDiv.querySelector('.block-meta-row').textContent = block.comision;
    } else {
      let newEnd = endMin + deltaMin;
      newEnd = Math.round(newEnd / 30) * 30; // snap
      if (newEnd > END_HOUR * 60) newEnd = END_HOUR * 60;
      if (newEnd <= startMin + 30) newEnd = startMin + 30; // Min 30 min

      block.fin = minToTime(newEnd);

      const heightPx = (newEnd - startMin) * PX_PER_MINUTE;
      blockDiv.style.height = `${heightPx}px`;
    }

    if (schedState.selectedBlockId === id) {
      document.getElementById('editor-start-time').value = block.inicio;
      document.getElementById('editor-end-time').value = block.fin;
    }

    checkOverlaps();
  }

  function handleMouseUp() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    renderBlocksOnTracks();
  }

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

// Motor Anti-Superposición Semanal (En tiempo real y hover tooltips)
function checkOverlaps() {
  // Limpiar estados de colisión
  document.querySelectorAll('.sched-time-block').forEach(div => {
    div.classList.remove('overlap-conflict');
    div.querySelector('.block-overlap-indicator').style.display = 'none';
    div.removeAttribute('title');
  });

  let hasOverlap = false;

  // Escanear colisiones día por día
  for (let d = 1; d <= 6; d++) {
    const dayBlocks = schedState.blocks.filter(b => b.dia === d);

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

          // Marcar los divs conflictivos en pantalla
          document.querySelectorAll(`.sched-time-block[data-block-id="${b1.id}"], .sched-time-block[data-block-id="${b2.id}"]`)
            .forEach(div => {
              div.classList.add('overlap-conflict');
              div.querySelector('.block-overlap-indicator').style.display = 'block';
              
              // Tooltip flotante con detalles del conflicto al pasar el mouse
              const targetBlock = div.dataset.blockId === b1.id ? b2 : b1;
              div.setAttribute('title', `⚠️ Superposición: Se pisa con ${targetBlock.nombre} de ${targetBlock.inicio} a ${targetBlock.fin} hs.`);
            });
        }
      }
    }
  }

  // Mostrar el banner inferior
  const banner = document.getElementById('overlap-warning-banner');
  if (hasOverlap) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }

  return hasOverlap;
}

// Limpiar bloques del día activo
document.getElementById('btn-clear-grid').addEventListener('click', () => {
  // Para limpiar de forma lógica: limpia todos los bloques de la grilla
  const userConfirm = confirm('¿Seguro que deseas vaciar toda tu grilla horaria semanal?');
  if (userConfirm) {
    schedState.blocks = [];
    deselectBlock();
    renderBlocksOnTracks();
    checkOverlaps();
  }
});

// Guardar Horario completo
document.getElementById('btn-save-schedule').addEventListener('click', async () => {
  // 1. Validación estricta semanal
  // Buscamos cualquier conflicto en los 6 días
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
    
    // Mostrar en la barra del editor
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

  // 2. Advertencia de actividades huérfanas en el panel lateral
  const userConfirm = confirm('Atención: Tienes actividades en el panel inferior que no fueron ubicadas en ninguna pista. No se guardarán en tu cronograma. ¿Deseas continuar?');
  if (!userConfirm) return;

  // 3. Guardar la grilla en la base de datos (reemplaza todo el horario anterior)
  try {
    const response = await fetch(`${API_BASE}/horarios/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        blocks: schedState.blocks.map(b => ({
          tipo: b.tipo,
          materia_id: b.tipo === 'materia' ? b.materia_id : null,
          titulo_actividad: b.tipo === 'actividad' ? b.nombre : null,
          dia_semana: b.dia,
          hora_inicio: b.inicio,
          hora_fin: b.fin
        }))
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const editor = document.getElementById('sched-manual-editor');
      editor.style.display = 'flex';
      document.getElementById('editor-selected-title').textContent = '⚠️ No se pudo guardar';
      document.getElementById('editor-selected-type').textContent = 'ERROR';
      document.getElementById('editor-selected-type').className = 'editor-block-type-badge error';
      const notif = document.getElementById('editor-notification-area');
      notif.textContent = data.message || 'No se pudo guardar el horario.';
      notif.style.color = '#dc2626';
      return;
    }

    showToastConflict('¡Horario semanal guardado con éxito!');
    deselectBlock();
  } catch (e) {
    console.error('No se pudo guardar el horario', e);
  }
});

// Toast notification helper
function showToastConflict(message) {
  let toast = document.getElementById('sched-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sched-toast';
    toast.className = 'avg-toast-box';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Inicialización de la página
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadAvailableSubjects(), loadScheduleState()]);
  renderTimeLabels();
  renderGridLines();
  renderAvailablePanels();
  renderBlocksOnTracks();
  checkOverlaps();
  setupDropZones();
});
