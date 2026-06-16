// Cursus - Módulo de Gestión de Materias y Correlativas (TUP Plan 2024)

// Definición de las materias del Plan 2024 de la Tecnicatura en Programación
const TUP_PLAN = [
  { id: 1, level: 1, cuat: '1° Cuatrimestre', name: 'Programación I', prereq: { cursadas: [], aprobadas: [] } },
  { id: 2, level: 1, cuat: '1° Cuatrimestre', name: 'Arquitectura y Sistemas Operativos', prereq: { cursadas: [], aprobadas: [] } },
  { id: 3, level: 1, cuat: '1° Cuatrimestre', name: 'Matemática', prereq: { cursadas: [], aprobadas: [] } },
  { id: 4, level: 1, cuat: '1° Cuatrimestre', name: 'Organización Empresarial', prereq: { cursadas: [], aprobadas: [] } },
  { id: 5, level: 1, cuat: '2° Cuatrimestre', name: 'Programación II', prereq: { cursadas: [1, 2], aprobadas: [] } },
  { id: 6, level: 1, cuat: '2° Cuatrimestre', name: 'Probabilidad y Estadística', prereq: { cursadas: [3], aprobadas: [] } },
  { id: 7, level: 1, cuat: '2° Cuatrimestre', name: 'Base de Datos I', prereq: { cursadas: [1, 3], aprobadas: [] } },
  { id: 8, level: 1, cuat: '2° Cuatrimestre', name: 'Inglés I', prereq: { cursadas: [], aprobadas: [] } },
  { id: 9, level: 2, cuat: '1° Cuatrimestre', name: 'Programación III', prereq: { cursadas: [5, 7], aprobadas: [1] } },
  { id: 10, level: 2, cuat: '1° Cuatrimestre', name: 'Base de Datos II', prereq: { cursadas: [7], aprobadas: [1] } },
  { id: 11, level: 2, cuat: '1° Cuatrimestre', name: 'Metodología de Sistemas I', prereq: { cursadas: [5, 7], aprobadas: [1, 4] } },
  { id: 12, level: 2, cuat: '1° Cuatrimestre', name: 'Inglés II', prereq: { cursadas: [8], aprobadas: [] } },
  { id: 13, level: 2, cuat: '2° Cuatrimestre', name: 'Programación IV', prereq: { cursadas: [9, 10, 11], aprobadas: [5, 7] } },
  { id: 14, level: 2, cuat: '2° Cuatrimestre', name: 'Metodología de Sistemas II', prereq: { cursadas: [11], aprobadas: [4] } },
  { id: 15, level: 2, cuat: '2° Cuatrimestre', name: 'Introducción al Análisis de Datos', prereq: { cursadas: [10], aprobadas: [6, 7] } },
  { id: 16, level: 2, cuat: '2° Cuatrimestre', name: 'Legislación', prereq: { cursadas: [7], aprobadas: [4] } },
  { id: 17, level: 2, cuat: '2° Cuatrimestre', name: 'Gestión de Desarrollo de Software', prereq: { cursadas: [9, 10], aprobadas: [5, 7] } },
  { id: 18, level: 2, cuat: 'Trabajo Final', name: 'Trabajo Final Integrador (TFI)', prereq: { cursadas: [8, 9, 10, 11, 12], aprobadas: [1, 2, 3, 4, 5, 6, 7, 13, 14, 15, 16, 17] } }
];

// Estado del módulo
let state = {
  currentTab: 'manage', // manage or plan
  currentFilter: 'all', // all, cursando, regular, aprobada
  subjects: {} // Mapea id -> { status, grade }
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
  
  // Sincronizar badge de alertas desde localStorage por si cambió
  updateAlertsBadge();
}

function saveSubjectsState() {
  localStorage.setItem('cursus_subjects_state', JSON.stringify(state.subjects));
}

// Actualizar badge del sidebar y bottom nav de alertas
function updateAlertsBadge() {
  const savedAlertsState = localStorage.getItem('cursus_alerts_state');
  if (savedAlertsState) {
    const alertsState = JSON.parse(savedAlertsState);
    // Filtrar las no completadas
    let isPaid = alertsState.career === 'TUP' || alertsState.career === 'TUSI';
    let filteredAlerts = alertsState.alerts.filter(alert => !alert.completed);
    if (!isPaid) {
      filteredAlerts = filteredAlerts.filter(alert => alert.category !== 'payment' || !alert.title.includes('Cuota'));
    }
    const count = filteredAlerts.length;
    
    const countBadge = document.getElementById('nav-badge-count');
    const countBnav = document.getElementById('bnav-badge-count');
    if (countBadge) countBadge.innerText = count;
    if (countBnav) countBnav.innerText = count;
  }
}

// Inicialización de la vista
document.addEventListener('DOMContentLoaded', () => {
  loadSubjectsState();
  updateUI();
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
    renderPlanTree();
  }
};

// Configurar filtro rápido
window.setFilter = function(filterVal) {
  state.currentFilter = filterVal;
  
  // Resaltar chip activo
  const chips = ['all', 'cursando', 'regular', 'aprobada'];
  chips.forEach(c => {
    const chip = document.getElementById(`filter-${c}`);
    if (c === filterVal) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
  
  renderSubjectsList();
};

// Actualizar todo el UI
function updateUI() {
  calculateStats();
  renderSubjectsList();
  if (state.currentTab === 'plan') {
    renderPlanTree();
  }
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

// Renderizar lista interactiva en pestaña "Gestión de Cursada"
function renderSubjectsList() {
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
      return subState.status === state.currentFilter;
    });
    
    if (filtered.length > 0) {
      const block = document.createElement('div');
      block.className = 'level-block';
      
      block.innerHTML = `
        <div class="level-header-title">${levels[level]}</div>
        <div class="subjects-layout-grid" id="grid-level-${level}"></div>
      `;
      container.appendChild(block);
      
      const grid = document.getElementById(`grid-level-${level}`);
      
      filtered.forEach(sub => {
        const subState = state.subjects[sub.id];
        const isLocked = isSubjectLocked(sub);
        
        const card = document.createElement('div');
        card.className = `subject-item-card ${isLocked ? 'locked' : subState.status}`;
        
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
              <span class="sub-code">CÓDIGO: TUP${sub.id} · ${sub.cuat}</span>
              <span class="sub-status-badge ${statusBadgeClass}">${statusText}</span>
            </div>
            <div class="sub-title">${sub.name}</div>
            ${gradeHTML}
          </div>
          <div class="sub-card-bottom">
            ${prereqsHTML}
            <div class="status-buttons-row">
              <button class="btn-status-toggle ${!isLocked && subState.status === 'disponible' ? 'active disponible' : ''}" 
                      ${isLocked ? 'disabled' : ''} onclick="window.changeSubjectStatus(${sub.id}, 'disponible')">D</button>
              <button class="btn-status-toggle ${!isLocked && subState.status === 'cursando' ? 'active cursando' : ''}" 
                      ${isLocked ? 'disabled' : ''} onclick="window.changeSubjectStatus(${sub.id}, 'cursando')">Cursar</button>
              <button class="btn-status-toggle ${!isLocked && subState.status === 'regular' ? 'active regular' : ''}" 
                      ${isLocked ? 'disabled' : ''} onclick="window.changeSubjectStatus(${sub.id}, 'regular')">Regular</button>
              <button class="btn-status-toggle ${!isLocked && subState.status === 'aprobada' ? 'active aprobada' : ''}" 
                      ${isLocked ? 'disabled' : ''} onclick="window.changeSubjectStatus(${sub.id}, 'aprobada')">Aprobar</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    }
  });
}

// Renderizar el árbol/flujo del Plan de Estudios
function renderPlanTree() {
  const container = document.getElementById('plan-tree-levels-container');
  container.innerHTML = '';
  
  // Estructurarlo por Niveles y Cuatrimestres
  const flow = [
    { label: 'Nivel I — Primer Cuatrimestre', level: 1, cuat: '1° Cuatrimestre' },
    { label: 'Nivel I — Segundo Cuatrimestre', level: 1, cuat: '2° Cuatrimestre' },
    { label: 'Nivel II — Primer Cuatrimestre', level: 2, cuat: '1° Cuatrimestre' },
    { label: 'Nivel II — Segundo Cuatrimestre', level: 2, cuat: '2° Cuatrimestre' },
    { label: 'Integración Final', level: 2, cuat: 'Trabajo Final' }
  ];
  
  flow.forEach(f => {
    const levelSubjects = TUP_PLAN.filter(sub => sub.level === f.level && sub.cuat === f.cuat);
    
    if (levelSubjects.length > 0) {
      const block = document.createElement('div');
      block.className = 'tree-level-block';
      
      block.innerHTML = `
        <div class="tree-level-title">${f.label}</div>
        <div class="tree-nodes-list" id="tree-nodes-${f.level}-${f.cuat.replace(/\s+/g, '')}"></div>
      `;
      container.appendChild(block);
      
      const nodesContainer = document.getElementById(`tree-nodes-${f.level}-${f.cuat.replace(/\s+/g, '')}`);
      
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
          </div>
          <div class="tree-node-meta">${metaText}</div>
        `;
        
        // Al hacer clic en el nodo, explicar correlativas
        node.onclick = () => {
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
