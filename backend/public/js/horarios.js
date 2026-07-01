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
  selectedBlockId: null,
  comparisonBlocks: [],
  comparisonUsers: [], // Array de compañeros agregados a la comparación
  currentVersion: 'A'
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
      color: b.color || null,
      version: b.version || 'A',
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

  const countBadge = document.getElementById('count-available-subjects');
  if (countBadge) {
    countBadge.textContent = String(AVAILABLE_SUBJECTS.length);
  }

  if (AVAILABLE_SUBJECTS.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sched-empty-note';
    empty.textContent = 'No tenes materias en estado cursando. Cambialas desde Mis Materias para poder agregarlas al horario.';
    subjectsList.appendChild(empty);
  }

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
  const act = schedState.personalActivities.find(a => a.id === id);
  const nombre = act ? act.nombre : 'esta actividad';
  
  showCustomConfirm(
    'Eliminar Actividad',
    `¿Estás seguro de que deseas eliminar "${nombre}" de tu lista de plantillas disponibles?`,
    () => {
      schedState.personalActivities = schedState.personalActivities.filter(a => a.id !== id);
      saveScheduleState();
      renderAvailablePanels();
    }
  );
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
        color: null,
        version: schedState.currentVersion,
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
    color: null,
    version: schedState.currentVersion,
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

  // Si no está definida la versión por defecto, usar 'A'
  if (!schedState.currentVersion) {
    schedState.currentVersion = 'A';
  }

  // Combinar bloques normales y de comparación para renderizar, filtrados por versión activa
  const normalBlocks = schedState.blocks
    .filter(b => (b.version || 'A') === schedState.currentVersion)
    .map(b => ({ ...b, isComparison: false }));
    
  const compBlocks = (schedState.comparisonBlocks || [])
    .filter(b => (b.version || 'A') === schedState.currentVersion)
    .map(b => ({ ...b, isComparison: true }));
    
  const allBlocks = [...normalBlocks, ...compBlocks];

  // Renderizar bloques reales
  allBlocks.forEach(b => {
    const col = document.getElementById(`col-day-${b.dia}`);
    if (!col) return; // Por si es Domingo (id 7) y no está en la grilla

    const startMin = timeToMin(b.inicio);
    const endMin = timeToMin(b.fin);
    const durMin = endMin - startMin;

    // Calcular coordenadas Y absolutas
    const topPx = (startMin - START_HOUR * 60) * PX_PER_MINUTE;
    const heightPx = durMin * PX_PER_MINUTE;

    const blockDiv = document.createElement('div');
    
    // Mapeo de color personalizado. `b.color` puede venir como código hex
    // (elegido a mano en el editor) o como nombre de tema (los presets del
    // curso oficial, ver UTN_SCHEDULE_PRESETS, guardan directamente el nombre).
    const colorMap = {
      '#4f46e5': 'indigo',
      '#9333ea': 'purple',
      '#10b981': 'emerald',
      '#f43f5e': 'rose',
      '#f59e0b': 'amber',
      '#0ea5e9': 'sky'
    };
    const colorNames = Object.values(colorMap);
    const rawColor = b.color || (b.tipo === 'materia' ? '#4f46e5' : '#9333ea');
    const colorName = colorNames.includes(rawColor)
      ? rawColor
      : (colorMap[rawColor] || (b.tipo === 'materia' ? 'indigo' : 'purple'));
    const colorClass = `theme-color-${colorName}`;

    let classes = `sched-time-block ${colorClass}`;
    if (b.tipo === 'actividad') classes += ' act';
    if (b.isComparison) classes += ' comparison';
    if (!b.isComparison && schedState.selectedBlockId === b.id) classes += ' selected';
    
    blockDiv.className = classes;
    blockDiv.style.top = `${topPx}px`;
    blockDiv.style.height = `${heightPx}px`;
    blockDiv.dataset.blockId = b.id;

    if (b.isComparison) {
      blockDiv.style.borderColor = b.userColor;
      blockDiv.style.background = `repeating-linear-gradient(45deg, transparent, transparent 4px, ${b.userColor}14 4px, ${b.userColor}14 8px)`;
      blockDiv.innerHTML = `
        <div class="block-content">
          <span class="block-code-row" style="color: ${b.userColor} !important; font-weight: 700;">${b.codigo || 'PERS'} (${b.userName})</span>
          <span class="block-title-row" style="color: var(--t1) !important;">${b.codigo ? b.nombre.replace('Computación ', '') : b.nombre}</span>
          <span class="block-meta-row" style="color: var(--t2) !important;">${b.inicio} - ${b.fin} hs</span>
        </div>
      `;
    } else {
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
    }

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

    // Actualizar paleta de colores activa en el editor flotante
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
    
    // Buscar alternativas si hay solapamiento
    checkAlternativeCommissions(block);
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
    checkAlternativeCommissions(block);
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
      if (schedState.selectedBlockId === id) {
        checkAlternativeCommissions(block);
      }
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
    if (schedState.selectedBlockId === id) {
      checkAlternativeCommissions(block);
    }
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
  const userConfirm = confirm(`¿Seguro que deseas vaciar toda tu grilla horaria semanal (Versión ${schedState.currentVersion || 'A'})?`);
  if (userConfirm) {
    schedState.blocks = schedState.blocks.filter(b => (b.version || 'A') !== (schedState.currentVersion || 'A'));
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
        version: schedState.currentVersion || 'A',
        blocks: schedState.blocks
          .filter(b => (b.version || 'A') === (schedState.currentVersion || 'A'))
          .map(b => ({
            tipo: b.tipo,
            materia_id: b.tipo === 'materia' ? b.materia_id : null,
            titulo_actividad: b.tipo === 'actividad' ? b.nombre : null,
            dia_semana: b.dia,
            hora_inicio: b.inicio,
            hora_fin: b.fin,
            color: b.color || null
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
  // Configurar fecha de generación para impresión
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

  await Promise.all([loadAvailableSubjects(), loadScheduleState()]);
  renderTimeLabels();
  renderGridLines();
  renderAvailablePanels();
  renderBlocksOnTracks();
  checkOverlaps();
  setupDropZones();
});

// Exportar a formato iCal (.ics) para Google Calendar u Outlook
window.exportToICS = function() {
  if (schedState.blocks.length === 0) {
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

  // Mapear días a RRULE y base de fechas (Lunes 29 de Junio de 2026 como base recurrente)
  const rruleDays = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' };
  const baseDays = { 1: '29', 2: '30', 3: '01', 4: '02', 5: '03', 6: '04' };
  const baseMonths = { 1: '06', 2: '06', 3: '07', 4: '07', 5: '07', 6: '07' };

  schedState.blocks.forEach(b => {
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
    icsLines.push(`DESCRIPTION:Sincronizado desde Cursus. Tipo: ${b.tipo === 'materia' ? 'Materia UTN' : 'Actividad Personal'}`);
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
  
  showToastConflict('¡Archivo iCal (.ics) descargado con éxito!');
};

// Imprimir y guardar en PDF
window.printSchedule = function() {
  window.print();
};

// Buscar y agregar usuario para comparar (Multiusuario)
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
    const response = await fetch(`${API_BASE}/horarios/buscar-usuario?search=${encodeURIComponent(searchVal)}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al buscar usuario');
    const data = await response.json();

    if (data.length === 0) {
      renderComparisonSidebar();
      alert('Compañero no encontrado.');
      return;
    }

    const user = data[0]; // Tomar la primera coincidencia

    // Verificar duplicado
    if (schedState.comparisonUsers.some(u => String(u.id) === String(user.id))) {
      renderComparisonSidebar();
      alert('Este compañero ya está agregado a la comparación.');
      return;
    }

    // Asignar color de slot disponible
    const presetColors = ['#4f46e5', '#10b981', '#f59e0b'];
    const usedColors = schedState.comparisonUsers.map(u => u.color);
    const color = presetColors.find(c => !usedColors.includes(c)) || '#f43f5e';

    // Cargar horario del compañero
    const scheduleResponse = await fetch(`${API_BASE}/horarios/compartido/${user.id}`, {
      headers: getAuthHeaders()
    });
    if (!scheduleResponse.ok) throw new Error('No se pudo cargar el horario');
    const scheduleData = await scheduleResponse.json();

    // Agregar usuario y sus bloques
    schedState.comparisonUsers.push({ id: user.id, nombre: user.nombre, color: color });

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
    renderComparisonSidebar();
    renderBlocksOnTracks();
    showToastConflict(`Comparando horario con ${user.nombre}`);
  } catch (e) {
    console.error(e);
    renderComparisonSidebar();
    alert('Error al buscar o cargar el horario del compañero.');
  }
};

// Renderizar la lista lateral de compañeros en comparación
function renderComparisonSidebar() {
  const container = document.getElementById('compare-status-list');
  if (!container) return;

  if (schedState.comparisonUsers.length === 0) {
    container.innerHTML = `<div style="color: rgba(255,255,255,0.45); padding: 4px 0;">Sin comparación activa</div>`;
    return;
  }

  let html = '';
  schedState.comparisonUsers.forEach(user => {
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

// Quitar compañero individualmente de la comparación
window.removeComparedUser = function(userId) {
  schedState.comparisonUsers = schedState.comparisonUsers.filter(u => String(u.id) !== String(userId));
  schedState.comparisonBlocks = schedState.comparisonBlocks.filter(b => String(b.userId) !== String(userId));

  renderComparisonSidebar();
  renderBlocksOnTracks();
  showToastConflict('Compañero quitado de la comparación');
};

// Limpiar toda la comparación
window.clearComparison = function() {
  schedState.comparisonUsers = [];
  schedState.comparisonBlocks = [];
  
  renderComparisonSidebar();
  renderBlocksOnTracks();
  showToastConflict('Comparación desactivada');
};

// Cambiar de Versión (A o B) de Horario
window.switchVersion = function(version) {
  if (schedState.currentVersion === version) return;
  
  schedState.currentVersion = version;
  deselectBlock();

  // Actualizar clases activas en los botones de versión (tanto desktop como mobile)
  document.querySelectorAll('.version-tabs .btn-version').forEach(btn => {
    if (btn.id === `btn-version-${version}` || btn.id === `mob-btn-version-${version}`) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Actualizar indicador de versión en cabecera de impresión
  const printBadge = document.getElementById('print-active-version-badge');
  if (printBadge) printBadge.textContent = `Versión ${version}`;

  renderBlocksOnTracks();
  checkOverlaps();
  showToastConflict(`Cargada la Versión ${version}`);
};

// Cambiar el color de un bloque seleccionado
window.changeBlockColor = function(colorHex) {
  if (!schedState.selectedBlockId) return;

  const block = schedState.blocks.find(b => b.id === schedState.selectedBlockId);
  if (block) {
    block.color = colorHex;
    
    // Guardar cambio de color en base de datos local temporal si aplica
    saveScheduleState();
    renderBlocksOnTracks();
    
    // Actualizar paleta activa
    document.querySelectorAll('.editor-color-picker .color-dot').forEach(dot => {
      if (dot.dataset.color === colorHex) {
        dot.classList.add('active');
        dot.style.borderColor = '#ffffff';
      } else {
        dot.classList.remove('active');
        dot.style.borderColor = 'transparent';
      }
    });
    
    showToastConflict('Color de bloque actualizado');
  }
};


// Diálogo de confirmación personalizado
window.showCustomConfirm = function(title, message, onConfirm) {
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
        <button class="btn-confirm-delete" id="confirm-btn-ok">Eliminar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(backdrop);
  
  // Animación de aparición
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

// ==========================================================================
// PRESETS DE HORARIOS OFICIALES UTN HAEDO (TECNICATURA EN PROGRAMACIÓN)
// ==========================================================================

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

// Los presets guardan el color como nombre de tema (ver arriba); acá se
// convierte a hex porque el resto de la app (editor manual, render de
// bloques) siempre trabaja con códigos hex para el color de un bloque.
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
  
  showCustomConfirm(
    'Cargar Horario Oficial UTN',
    `¿Deseas cargar la plantilla oficial de "${selectOptionText}"? Esto vaciará todos los bloques de tu Versión ${schedState.currentVersion} actual.`,
    () => {
      // 1. Filtrar y eliminar bloques correspondientes a la versión actual
      schedState.blocks = schedState.blocks.filter(
        b => (b.version || 'A') !== schedState.currentVersion
      );
      
      // 2. Generar bloques basados en el preset
      presetBlocks.forEach((preset, idx) => {
        // Tratar de enlazar con una materia disponible en AVAILABLE_SUBJECTS
        const matchedSub = AVAILABLE_SUBJECTS.find(
          s => s.nombre.toLowerCase().trim() === preset.nombre.toLowerCase().trim()
        );
        
        const newBlock = {
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
        };
        
        schedState.blocks.push(newBlock);
      });
      
      // 3. Deseleccionar, re-renderizar, guardar y notificar
      deselectBlock();
      renderBlocksOnTracks();
      checkOverlaps();
      saveScheduleState();
      showToastConflict(`Horario ${selectOptionText} cargado con éxito`);
      
      // Resetear visualmente el dropdown select
      select.value = "";
    }
  );
  
  // Limpiar selector si cancela
  select.value = "";
};

// ==========================================================================
// BUSCADOR AUTOMÁTICO DE ALTERNATIVAS SIN SOLAPAMIENTO (IDEA 4)
// ==========================================================================

window.applyCommissionAlternative = function(subjectName, presetKey) {
  const presetBlocks = UTN_SCHEDULE_PRESETS[presetKey];
  if (!presetBlocks) return;

  // 1. Filtrar todos los bloques de esta materia en la versión y grilla actual
  schedState.blocks = schedState.blocks.filter(
    b => !(b.tipo === 'materia' && b.nombre.toLowerCase().trim() === subjectName.toLowerCase().trim() && (b.version || 'A') === schedState.currentVersion)
  );

  // 2. Insertar los nuevos bloques de la comisión recomendada
  presetBlocks.forEach((preset, idx) => {
    const matchedSub = AVAILABLE_SUBJECTS.find(
      s => s.nombre.toLowerCase().trim() === preset.nombre.toLowerCase().trim()
    );

    const newBlock = {
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
    };

    schedState.blocks.push(newBlock);
  });

  // 3. Deseleccionar, re-renderizar, revisar colisiones y guardar
  deselectBlock();
  renderBlocksOnTracks();
  checkOverlaps();
  saveScheduleState();
  showToastConflict(`Comisión cambiada a ${presetKey.split('_')[0]} para resolver conflicto`);
};

window.checkAlternativeCommissions = function(block) {
  const notifArea = document.getElementById('editor-notification-area');
  if (!notifArea) return;

  if (!block || block.tipo !== 'materia') {
    notifArea.innerHTML = '';
    return;
  }

  // 1. Verificar si este bloque está marcado en colisión
  const blockDiv = document.querySelector(`.sched-time-block[data-block-id="${block.id}"]`);
  if (!blockDiv || !blockDiv.classList.contains('overlap-conflict')) {
    notifArea.innerHTML = '';
    return;
  }

  const subjectName = block.nombre.toLowerCase().trim();
  const presetsWithSubject = [];

  // Encontrar todas las comisiones en UTN_SCHEDULE_PRESETS que dicten esta materia
  for (const presetKey in UTN_SCHEDULE_PRESETS) {
    const blocksInPreset = UTN_SCHEDULE_PRESETS[presetKey];
    if (blocksInPreset.some(b => b.nombre.toLowerCase().trim() === subjectName)) {
      presetsWithSubject.push(presetKey);
    }
  }

  // Filtrar los demás bloques de la grilla para la simulación
  const otherBlocks = schedState.blocks.filter(
    b => !(b.tipo === 'materia' && b.nombre.toLowerCase().trim() === subjectName && (b.version || 'A') === schedState.currentVersion)
  );

  let foundAlternative = null;

  for (const presetKey of presetsWithSubject) {
    const presetBlocks = UTN_SCHEDULE_PRESETS[presetKey];
    const commissionName = presetBlocks[0].comision;

    // Omitir la comisión actual en conflicto
    if (block.comision === commissionName) continue;

    // Simular inserción de bloques
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

    // Si encontramos una comisión viable que no colisiona con el resto del horario
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
};
