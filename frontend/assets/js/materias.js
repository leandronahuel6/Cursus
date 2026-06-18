// Cursus - Módulo de Gestión de Materias y Correlativas (TUP Plan 2024)

const API_BASE = '/api';

// Plan de materias de la carrera, traído desde la base de datos (ver loadPlan())
let TUP_PLAN = [];

// Trae el plan de materias y correlatividades desde el backend
async function loadPlan() {
  const response = await fetch(`${API_BASE}/materias?carrera=${encodeURIComponent('Tecnicatura Universitaria en Programación')}`);
  if (!response.ok) {
    throw new Error('No se pudo cargar el plan de materias');
  }
  const data = await response.json();
  TUP_PLAN = data.map(m => ({
    id: m.id,
    level: m.nivel,
    name: m.nombre,
    prereq: { cursadas: m.prereq.cursadas, aprobadas: m.prereq.aprobadas }
  }));
}

// Estado del módulo
let state = {
  currentTab: 'manage', // manage (árbol editable) or plan (lista solo lectura)
  currentFilter: 'all', // all, cursando, regular, aprobada
  subjects: {}, // Mapea id -> { status, grade }
  collapsedLevels: {} // Mapea nivel -> true si está colapsado en el árbol
};

// Guardar nota temporalmente mientras se abre el modal
let activeModalSubjectId = null;

// Cargar o inicializar el estado en LocalStorage
function loadSubjectsState() {
  const saved = localStorage.getItem('cursus_subjects_state');
  if (saved) {
    state.subjects = JSON.parse(saved);
  } else {
    // Inicializar perfil simulado de estudiante de 2° año:
    // Aprobó varias de 1° año e hizo regular algunas otras. Está cursando de 2° año.
    TUP_PLAN.forEach(sub => {
      let status = 'disponible';
      let grade = null;

      if (sub.id === 1) { status = 'aprobada'; grade = 9; }
      else if (sub.id === 2) { status = 'aprobada'; grade = 8; }
      else if (sub.id === 3) { status = 'aprobada'; grade = 7; }
      else if (sub.id === 4) { status = 'aprobada'; grade = 8; }
      else if (sub.id === 8) { status = 'aprobada'; grade = 9; }
      else if (sub.id === 5) { status = 'regular'; }
      else if (sub.id === 6) { status = 'regular'; }
      else if (sub.id === 7) { status = 'regular'; }
      else if (sub.id === 9) { status = 'cursando'; }
      else if (sub.id === 10) { status = 'cursando'; }
      else if (sub.id === 11) { status = 'cursando'; }
      else if (sub.id === 12) { status = 'cursando'; }

      state.subjects[sub.id] = { status, grade };
    });
    saveSubjectsState();
  }
}

function saveSubjectsState() {
  localStorage.setItem('cursus_subjects_state', JSON.stringify(state.subjects));
}

// Inicialización de la vista
document.addEventListener('DOMContentLoaded', async () => {
  await loadPlan();
  loadSubjectsState();

  // Si la URL tiene el hash '#plan', cambiar automáticamente a la pestaña del plan
  if (window.location.hash === '#plan' || window.location.search.includes('tab=plan')) {
    switchToTab('plan');
  } else {
    updateUI();
  }
});

// Comprobar si una materia está bloqueada por correlativas
function isSubjectLocked(sub) {
  // 1. Validar cursadas obligatorias (deben estar al menos como "regular" o "aprobada")
  for (const reqId of sub.prereq.cursadas) {
    const reqState = state.subjects[reqId];
    if (!reqState || (reqState.status !== 'regular' && reqState.status !== 'aprobada')) {
      return true;
    }
  }

  // 2. Validar aprobadas obligatorias (deben estar como "aprobada")
  for (const reqId of sub.prereq.aprobadas) {
    const reqState = state.subjects[reqId];
    if (!reqState || reqState.status !== 'aprobada') {
      return true;
    }
  }

  return false;
}

// Obtener el nombre de una materia por su ID
function getSubjectNameById(id) {
  const sub = TUP_PLAN.find(s => s.id === id);
  return sub ? sub.name : `Materia ${id}`;
}

// Cambiar estado de una materia
window.changeSubjectStatus = function(id, newStatus) {
  const sub = TUP_PLAN.find(s => s.id === id);
  if (!sub) return;

  // Si está bloqueada, no permitir cambiar
  if (isSubjectLocked(sub) && newStatus !== 'disponible') {
    alert('Esta materia se encuentra bloqueada. Debes cumplir sus correlativas primero.');
    return;
  }

  if (newStatus === 'aprobada') {
    // Abrir modal de notas
    activeModalSubjectId = id;
    document.getElementById('grade-modal-subject-title').innerText = `Registrar nota: ${sub.name}`;
    document.getElementById('grade-select').value = '8';
    document.getElementById('grade-modal').classList.add('open');
  } else {
    // Cambiar estado directamente
    state.subjects[id].status = newStatus;
    state.subjects[id].grade = null;

    // Ejecutar verificación en cascada para bloquear materias que dependían de esta
    cascadeVerifications();
    saveSubjectsState();
    updateUI();
  }
};

// Cerrar modal de carga de notas
window.closeGradeModal = function(shouldSave) {
  const modal = document.getElementById('grade-modal');
  modal.classList.remove('open');

  if (shouldSave && activeModalSubjectId !== null) {
    const gradeVal = parseInt(document.getElementById('grade-select').value);

    state.subjects[activeModalSubjectId].status = 'aprobada';
    state.subjects[activeModalSubjectId].grade = gradeVal;

    cascadeVerifications();
    saveSubjectsState();
    updateUI();
  }
  activeModalSubjectId = null;
};

// Validación en cascada: si demoto una materia (ej: Programación I pasa de aprobada a disponible),
// debemos bajar de nivel automáticamente cualquier materia que requiera de ella.
function cascadeVerifications() {
  let changed = true;
  while (changed) {
    changed = false;
    TUP_PLAN.forEach(sub => {
      const subState = state.subjects[sub.id];
      if (subState.status !== 'disponible' && isSubjectLocked(sub)) {
        // La materia ya no cumple sus correlativas, bajar a disponible
        subState.status = 'disponible';
        subState.grade = null;
        changed = true;
      }
    });
  }
}

// Filtrado de pestañas superiores (Gestión vs Plan de Estudios)
window.switchToTab = function(tabName) {
  state.currentTab = tabName;

  const tabManage = document.getElementById('tab-manage');
  const tabPlan = document.getElementById('tab-plan');
  const panelManage = document.getElementById('panel-manage-view');
  const panelPlan = document.getElementById('panel-plan-view');

  if (tabName === 'manage') {
    tabManage.classList.add('on');
    tabPlan.classList.remove('on');
    panelManage.style.display = 'block';
    panelPlan.style.display = 'none';
  } else {
    tabManage.classList.remove('on');
    tabPlan.classList.add('on');
    panelManage.style.display = 'none';
    panelPlan.style.display = 'block';
  }
  calculateStats();
  renderActiveTab();
};

// Configurar filtro rápido
window.setFilter = function(filterVal) {
  state.currentFilter = filterVal;

  // Resaltar chip activo
  const chips = ['all', 'cursando', 'regular', 'aprobada', 'bloqueada'];
  chips.forEach(c => {
    const chip = document.getElementById(`filter-${c}`);
    if (c === filterVal) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  renderListView();
};

// Renderiza la vista correspondiente a la pestaña activa
function renderActiveTab() {
  if (state.currentTab === 'manage') {
    renderTreeView();
  } else {
    renderListView();
  }
}

// Actualizar todo el UI
function updateUI() {
  calculateStats();
  renderActiveTab();
}

// Calcular promedio y avances
function calculateStats() {
  let approvedCount = 0;
  let gradesSum = 0;
  let activeCount = 0;

  TUP_PLAN.forEach(sub => {
    const subState = state.subjects[sub.id];
    if (subState) {
      if (subState.status === 'aprobada') {
        approvedCount++;
        if (subState.grade) {
          gradesSum += subState.grade;
        }
      } else if (subState.status === 'cursando') {
        activeCount++;
      }
    }
  });

  const totalSubjects = TUP_PLAN.length; // 18 materias
  const progressPct = Math.round((approvedCount / totalSubjects) * 100);
  const avg = approvedCount > 0 ? (gradesSum / approvedCount).toFixed(2) : '0.00';

  document.getElementById('career-progress-pct').innerText = `${progressPct}%`;
  document.getElementById('career-average').innerText = avg;
  document.getElementById('career-approved-count').innerText = `${approvedCount} / ${totalSubjects}`;
}

// Renderizar lista de solo lectura en pestaña "Plan de Estudios"
function renderListView() {
  const container = document.getElementById('subjects-grouped-container');
  container.innerHTML = '';

  // Agrupar materias por nivel
  const levels = {
    1: 'Nivel I (Primer Año)',
    2: 'Nivel II (Segundo Año)'
  };

  Object.keys(levels).forEach(level => {
    const levelSubjects = TUP_PLAN.filter(sub => sub.level === parseInt(level));

    // Filtrar materias según el filtro activo
    const filtered = levelSubjects.filter(sub => {
      const subState = state.subjects[sub.id];
      if (state.currentFilter === 'all') return true;
      if (state.currentFilter === 'bloqueada') return isSubjectLocked(sub);
      return subState.status === state.currentFilter;
    });

    if (filtered.length > 0) {
      const isCollapsed = !!state.collapsedLevels[level];

      const block = document.createElement('div');
      block.className = 'level-block';

      block.innerHTML = `
        <div class="level-header-title">
          <span class="level-header-arrow">${isCollapsed ? '▸' : '▾'}</span> ${levels[level]}
        </div>
        <div class="subjects-layout-grid" id="grid-level-${level}" style="${isCollapsed ? 'display:none;' : ''}"></div>
      `;
      container.appendChild(block);

      // Click en el título: colapsar/expandir el nivel
      block.querySelector('.level-header-title').onclick = () => {
        state.collapsedLevels[level] = !isCollapsed;
        renderListView();
      };

      const grid = document.getElementById(`grid-level-${level}`);

      filtered.forEach(sub => {
        const subState = state.subjects[sub.id];
        const isLocked = isSubjectLocked(sub);

        // El TFI (y cualquier materia con muchas correlativas) necesita más alto que el resto
        const totalPrereqs = sub.prereq.cursadas.length + sub.prereq.aprobadas.length;
        const isExtraLong = totalPrereqs > 5;

        const card = document.createElement('div');
        card.className = `subject-item-card ${isLocked ? 'locked' : subState.status}${isExtraLong ? ' subject-item-card--tall' : ''}`;

        // Armar información de correlativas bloqueantes
        let prereqsHTML = '';
        if (sub.prereq.cursadas.length > 0 || sub.prereq.aprobadas.length > 0) {
          prereqsHTML += '<div class="sub-prereqs-info">';

          sub.prereq.cursadas.forEach(reqId => {
            const reqState = state.subjects[reqId];
            const isMet = reqState && (reqState.status === 'regular' || reqState.status === 'aprobada');
            prereqsHTML += `
              <div class="sub-prereq-item ${isMet ? 'met' : 'unmet'}">
                ${isMet ? '✓' : '🔒'} Cursar: ${getSubjectNameById(reqId)}
              </div>
            `;
          });

          sub.prereq.aprobadas.forEach(reqId => {
            const reqState = state.subjects[reqId];
            const isMet = reqState && reqState.status === 'aprobada';
            prereqsHTML += `
              <div class="sub-prereq-item ${isMet ? 'met' : 'unmet'}">
                ${isMet ? '✓' : '🔒'} Aprobar: ${getSubjectNameById(reqId)}
              </div>
            `;
          });

          prereqsHTML += '</div>';
        }

        // Badge de estado actual
        let statusBadgeClass = subState.status;
        let statusText = subState.status;
        if (isLocked) {
          statusBadgeClass = 'locked';
          statusText = 'Bloqueada';
        } else if (subState.status === 'disponible') {
          statusText = 'Disponible';
        }

        // Nota si está aprobada
        const gradeHTML = (subState.status === 'aprobada' && subState.grade)
          ? `<div class="sub-grade-badge">Calificación: ${subState.grade}</div>`
          : '';

        card.innerHTML = `
          <div class="sub-card-top">
            <div class="sub-code-row">
              <span class="sub-code">CÓDIGO: TUP${sub.id}</span>
              <span class="sub-status-badge ${statusBadgeClass}">${statusText}</span>
            </div>
            <div class="sub-title">${sub.name}</div>
            ${gradeHTML}
          </div>
          <div class="sub-card-bottom">
            ${prereqsHTML}
          </div>
        `;
        grid.appendChild(card);
      });
    }
  });
}

// Renderizar el árbol/flujo editable de "Gestión de Cursada"
function renderTreeView() {
  const container = document.getElementById('plan-tree-levels-container');
  container.innerHTML = '';

  // Estructurarlo por Niveles
  const flow = [
    { label: 'Nivel I', level: 1 },
    { label: 'Nivel II', level: 2 }
  ];

  flow.forEach(f => {
    const levelSubjects = TUP_PLAN.filter(sub => sub.level === f.level);

    if (levelSubjects.length > 0) {
      const isCollapsed = !!state.collapsedLevels[f.level];

      const block = document.createElement('div');
      block.className = 'tree-level-block';

      block.innerHTML = `
        <div class="tree-level-title">
          <span class="tree-level-arrow">${isCollapsed ? '▸' : '▾'}</span> ${f.label}
        </div>
        <div class="tree-nodes-list" id="tree-nodes-${f.level}" style="${isCollapsed ? 'display:none;' : ''}"></div>
      `;
      container.appendChild(block);

      // Click en el título: colapsar/expandir el nivel
      block.querySelector('.tree-level-title').onclick = () => {
        state.collapsedLevels[f.level] = !isCollapsed;
        renderTreeView();
      };

      const nodesContainer = document.getElementById(`tree-nodes-${f.level}`);

      levelSubjects.forEach(sub => {
        const subState = state.subjects[sub.id];
        const isLocked = isSubjectLocked(sub);

        const node = document.createElement('div');
        let nodeClass = subState.status;
        if (isLocked) nodeClass = 'bloqueada';

        node.className = `tree-node-card ${nodeClass}`;

        let metaText = '';
        if (subState.status === 'aprobada' && subState.grade) {
          metaText = `★ ${subState.grade}`;
        } else if (subState.status === 'cursando') {
          metaText = '✏️';
        } else if (subState.status === 'regular') {
          metaText = '📋';
        } else if (isLocked) {
          metaText = '🔒';
        }

        node.innerHTML = `
          <div class="tree-node-info">
            <span class="tree-node-code">TUP${sub.id}</span>
            <span class="tree-node-name">${sub.name}</span>
            <span class="tree-node-meta">${metaText}</span>
          </div>
          <div class="status-buttons-row">
            <button class="btn-status-toggle ${!isLocked && subState.status === 'disponible' ? 'active disponible' : ''}"
                    ${isLocked ? 'disabled' : ''} onclick="event.stopPropagation(); window.changeSubjectStatus(${sub.id}, 'disponible')">D</button>
            <button class="btn-status-toggle ${!isLocked && subState.status === 'cursando' ? 'active cursando' : ''}"
                    ${isLocked ? 'disabled' : ''} onclick="event.stopPropagation(); window.changeSubjectStatus(${sub.id}, 'cursando')">Cursar</button>
            <button class="btn-status-toggle ${!isLocked && subState.status === 'regular' ? 'active regular' : ''}"
                    ${isLocked ? 'disabled' : ''} onclick="event.stopPropagation(); window.changeSubjectStatus(${sub.id}, 'regular')">Regular</button>
            <button class="btn-status-toggle ${!isLocked && subState.status === 'aprobada' ? 'active aprobada' : ''}"
                    ${isLocked ? 'disabled' : ''} onclick="event.stopPropagation(); window.changeSubjectStatus(${sub.id}, 'aprobada')">Aprobar</button>
          </div>
        `;

        // Al hacer clic en la info del nodo (no en los botones), explicar correlativas
        node.querySelector('.tree-node-info').onclick = () => {
          let msg = `Materia: ${sub.name}\nEstado: ${subState.status.toUpperCase()}\n`;
          if (subState.grade) msg += `Calificación: ${subState.grade}\n`;

          if (sub.prereq.cursadas.length > 0 || sub.prereq.aprobadas.length > 0) {
            msg += `\nCorrelatividades para Cursar/Rendir:\n`;
            sub.prereq.cursadas.forEach(reqId => {
              const rState = state.subjects[reqId];
              const ok = rState && (rState.status === 'regular' || rState.status === 'aprobada');
              msg += ` - Cursada de ${getSubjectNameById(reqId)}: [${ok ? 'CUMPLIDO' : 'FALTA'}]\n`;
            });
            sub.prereq.aprobadas.forEach(reqId => {
              const rState = state.subjects[reqId];
              const ok = rState && rState.status === 'aprobada';
              msg += ` - Examen de ${getSubjectNameById(reqId)}: [${ok ? 'CUMPLIDO' : 'FALTA'}]\n`;
            });
          } else {
            msg += `\nEsta materia no tiene correlativas previas.`;
          }
          alert(msg);
        };

        nodesContainer.appendChild(node);
      });
    }
  });
}
