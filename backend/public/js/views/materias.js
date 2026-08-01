// Cursus - Módulo de Gestión de Materias y Correlativas (TUP Plan 2024)

const API_BASE = '/api';

// Plan de materias de la carrera, traído desde la base de datos (ver loadPlan())
let TUP_PLAN = [];

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

// Mapeo entre el estado que usa la UI ('disponible') y el que guarda la BD ('libre')
function estadoUiToDb(estadoUi) {
  return estadoUi === 'disponible' ? 'libre' : estadoUi;
}

function estadoDbToUi(estadoDb) {
  return estadoDb === 'libre' ? 'disponible' : estadoDb;
}

// Trae el plan de materias, correlatividades y el estado de cursada real del
// usuario autenticado desde el backend
async function loadPlan() {
  const response = await fetch(`${API_BASE}/mis-materias?carrera=${encodeURIComponent('Tecnicatura Universitaria en Programación')}`, {
    headers: getAuthHeaders()
  });
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

  state.subjects = {};
  data.forEach(m => {
    state.subjects[m.id] = {
      status: estadoDbToUi(m.estado),
      grade: m.nota ?? null,
      puede_cursar: m.puede_cursar,
      puede_aprobar: m.puede_aprobar
    };
  });
}

// Persiste en la BD el estado de cursada de una materia para el usuario actual
async function persistSubjectStatus(id, statusUi, grade) {
  try {
    const res = await fetch(`${API_BASE}/materias/${id}/estado`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado: estadoUiToDb(statusUi), nota: grade ?? null })
    });
    const data = await res.json();
    
    if (!res.ok) {
      if (data.conflictos && data.conflictos.length > 0) {
        if (window.openDependencyErrorModal) {
          window.openDependencyErrorModal(data.conflictos);
        }
      } else {
        if (window.showToast) window.showToast(data.message || 'La operación fue rechazada por el servidor.', 'error');
      }
      return false;
    }
    
    // Confiamos ciegamente en la Única Fuente de Verdad (Backend)
    // El servidor ya recalculó todas las correlatividades.
    data.forEach(sub => {
      state.subjects[sub.id] = { 
        status: sub.estado, 
        grade: sub.nota,
        puede_cursar: sub.puede_cursar,
        puede_aprobar: sub.puede_aprobar
      };
    });
    updateUI();
    return true;
  } catch (e) {
    console.error('No se pudo guardar el estado de la materia', e);
    return false;
  }
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


function statusBadgeClass(status) {
  const map = { disponible: 'badge--neutral', cursando: 'badge--info', regular: 'badge--warning', aprobada: 'badge--success', bloqueada: 'badge--danger' };
  return map[status] || 'badge--neutral';
}

function getStatusLabel(status) {
  if (status === 'bloqueada') return 'Bloqueada';
  const labels = {
    disponible: 'Disponible',
    cursando: 'Cursando',
    regular: 'Regular',
    aprobada: 'Aprobada'
  };
  return labels[status] || status;
}

function buildSubjectPrereqsHTML(sub) {
  if (sub.prereq.cursadas.length === 0 && sub.prereq.aprobadas.length === 0) {
    return '<p class="subject-info-empty">Esta materia no tiene correlativas previas.</p>';
  }

  let html = '<div class="sub-prereqs-info">';

  sub.prereq.cursadas.forEach(reqId => {
    const reqState = state.subjects[reqId];
    const isMet = reqState && (reqState.status === 'regular' || reqState.status === 'aprobada');
    html += `
      <div class="sub-prereq-item ${isMet ? 'met' : 'unmet'}">
        ${isMet ? '✓' : '🔒'} Cursar: ${getSubjectNameById(reqId)}
      </div>
    `;
  });

  sub.prereq.aprobadas.forEach(reqId => {
    const reqState = state.subjects[reqId];
    const isMet = reqState && reqState.status === 'aprobada';
    html += `
      <div class="sub-prereq-item ${isMet ? 'met' : 'unmet'}">
        ${isMet ? '✓' : '🔒'} Aprobar: ${getSubjectNameById(reqId)}
      </div>
    `;
  });

  html += '</div>';
  return html;
}

window.openSubjectInfoModal = function(sub, subState) {
  const modal = document.getElementById('subject-info-modal');
  const titleEl = document.getElementById('subject-info-modal-title');
  const bodyEl = document.getElementById('subject-info-modal-body');
  if (!modal || !titleEl || !bodyEl) return;

  const isLocked = !subState.puede_cursar;
  const statusClass = isLocked ? 'locked' : subState.status;
  const gradeHTML = (subState.status === 'aprobada' && subState.grade)
    ? `<span class="badge badge--success">Calificación: ${subState.grade}</span>`
    : '';

  titleEl.textContent = sub.name;
  bodyEl.innerHTML = `
    <div class="subject-info-meta">
      <span class="subject-info-code">TUP${sub.id}</span>
      <span class="badge ${statusBadgeClass(statusClass)}">${getStatusLabel(subState.status)}</span>
      ${gradeHTML}
    </div>
    <div class="subject-info-prereqs-title">Correlatividades</div>
    ${buildSubjectPrereqsHTML(sub)}
  `;

  modal.classList.add('open');
};

window.closeSubjectInfoModal = function() {
  const modal = document.getElementById('subject-info-modal');
  if (modal) modal.classList.remove('open');
};

// ===================== MODAL DE ERROR DE DEPENDENCIAS =====================
window.openDependencyErrorModal = function(conflictos) {
  const modal = document.getElementById('dependency-error-modal');
  const listEl = document.getElementById('dependency-error-list');
  
  if (!modal || !listEl) return;
  
  // Limpiar lista
  listEl.innerHTML = '';
  
  // Inyectar materias conflictivas
  conflictos.forEach(materia => {
    const li = document.createElement('li');
    li.textContent = materia;
    listEl.appendChild(li);
  });
  
  // Mostrar modal usando la clase .show (estándar en components/modals.css)
  modal.classList.add('show');
};

window.closeDependencyErrorModal = function() {
  const modal = document.getElementById('dependency-error-modal');
  if (modal) modal.classList.remove('show');
};

// Inicialización de la vista
document.addEventListener('DOMContentLoaded', async () => {
  await loadPlan();

  // Cerrar modal de detalle al hacer clic fuera o con Escape
  const subjectInfoModal = document.getElementById('subject-info-modal');
  if (subjectInfoModal) {
    subjectInfoModal.addEventListener('click', (e) => {
      if (e.target === subjectInfoModal) window.closeSubjectInfoModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeSubjectInfoModal();
  });

  // Si la URL tiene el hash '#plan', cambiar automáticamente a la pestaña del plan
  if (window.location.hash === '#plan' || window.location.search.includes('tab=plan')) {
    switchToTab('plan');
  } else {
    updateUI();
  }
});

// La función isSubjectLocked ha sido eliminada por completo. El frontend
// ahora confía 100% en las banderas booleanas calculadas por el servidor.

// Obtener el nombre de una materia por su ID
function getSubjectNameById(id) {
  const sub = TUP_PLAN.find(s => s.id === id);
  return sub ? sub.name : `Materia ${id}`;
}

// Cambiar estado de una materia
window.changeSubjectStatus = function(id, newStatus) {
  const sub = TUP_PLAN.find(s => s.id === id);
  const subState = state.subjects[id];
  if (!sub || !subState) return;
  
  // Si está bloqueada, no permitir cambiar
  if (!subState.puede_cursar && newStatus !== 'disponible') {
    showToast('Esta materia está bloqueada. Cumplí sus correlativas primero.', 'warn');
    return;
  }
  
  if (newStatus === 'aprobada') {
    // Abrir modal de notas
    activeModalSubjectId = id;
    document.getElementById('grade-modal-subject-title').innerText = `Registrar nota: ${sub.name}`;
    document.getElementById('grade-select').value = subState.grade || '8';
    document.getElementById('grade-modal').classList.add('open');
  } else {
    // Evitar múltiples clicks simultáneos en la misma materia
    if (subState.isFetching) return;
    subState.isFetching = true;

    // ACTUALIZACIÓN OPTIMISTA: 
    // Cambiamos el estado localmente de inmediato para dar feedback instantáneo al usuario sin latencia
    const originalStatus = subState.status;
    subState.status = newStatus;
    updateUI();

    // El servidor procesará y devolverá el árbol completo, destrabando las demás materias
    persistSubjectStatus(id, newStatus, null).then(success => {
      if (!success) {
        // Rollback en caso de fallo de red o validación (ej. HTTP 422)
        subState.status = originalStatus;
        updateUI();
        
        // Efecto visual: el botón falla y tiembla para darle feedback físico al usuario
        const btn = document.getElementById(`btn-${id}-${newStatus}`);
        if (btn && window.shakeApproveButton) {
          window.shakeApproveButton(btn);
        }
      }
      subState.isFetching = false;
    });
  }
};

// Feedback visual cuando se toca "Aprobar" estando solo regularizable (no aprobable)
window.shakeApproveButton = function(btn) {
  btn.classList.remove('shake');
  void btn.offsetWidth; // Forzar reflow para poder re-disparar la animación en clics seguidos
  btn.classList.add('shake');
};

// Cerrar modal de carga de notas
window.closeGradeModal = function(shouldSave) {
  const modal = document.getElementById('grade-modal');
  modal.classList.remove('open');

  if (shouldSave && activeModalSubjectId !== null) {
    const gradeVal = parseInt(document.getElementById('grade-select').value);
    const subState = state.subjects[activeModalSubjectId];
    
    if (subState && !subState.isFetching) {
      subState.isFetching = true;
      
      const originalStatus = subState.status;
      const originalGrade = subState.grade;
      
      // Actualización optimista
      subState.status = 'aprobada';
      subState.grade = gradeVal;
      updateUI();
      
      persistSubjectStatus(activeModalSubjectId, 'aprobada', gradeVal).then(success => {
        if (!success) {
          // Rollback
          subState.status = originalStatus;
          subState.grade = originalGrade;
          updateUI();
        }
        subState.isFetching = false;
      });
    }
  }
  activeModalSubjectId = null;
};

// La validación en cascada local (cascadeVerifications) ha sido eliminada.
// Ahora el Frontend confía 100% en la Única Fuente de Verdad (Backend).

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
          gradesSum += Number(subState.grade);
        }
      } else if (subState.status === 'cursando') {
        activeCount++;
      }
    }
  });
  
  const totalSubjects = TUP_PLAN.length; // 18 materias
  const progressPct = Math.round((approvedCount / totalSubjects) * 100);
  const avg = approvedCount > 0 ? (gradesSum / approvedCount).toFixed(2) : '0.00';
  
  const progressPctEl = document.getElementById('career-progress-pct');
  const averageEl = document.getElementById('career-average');
  const approvedCountEl = document.getElementById('career-approved-count');
  progressPctEl.innerText = `${progressPct}%`;
  averageEl.innerText = avg;
  approvedCountEl.innerText = `${approvedCount} / ${totalSubjects}`;
  progressPctEl.classList.remove('skel');
  averageEl.classList.remove('skel');
  approvedCountEl.classList.remove('skel');

  // Festejo único cuando se completa el 100% del plan (se vuelve a habilitar
  // si alguna materia se demueve y luego se vuelve a aprobar todo de nuevo).
  const FLAG_PLAN_COMPLETO = 'cursus_plan_completo_celebrado';
  if (totalSubjects > 0 && approvedCount === totalSubjects) {
    if (localStorage.getItem(FLAG_PLAN_COMPLETO) !== 'true') {
      localStorage.setItem(FLAG_PLAN_COMPLETO, 'true');
      if (window.celebrarPlanCompleto) window.celebrarPlanCompleto();
    }
  } else {
    localStorage.removeItem(FLAG_PLAN_COMPLETO);
  }
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
      if (state.currentFilter === 'bloqueada') return subState.status === 'bloqueada';
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
        const isLocked = subState.status === 'bloqueada';
        
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
        let badgeClass = subState.status;
        let statusText = subState.status;
        if (isLocked) {
          badgeClass = 'locked';
          statusText = 'Bloqueada';
        } else if (subState.status === 'disponible') {
          statusText = 'Disponible';
        }
        
        // Nota si está aprobada
        const gradeHTML = (subState.status === 'aprobada' && subState.grade) 
          ? `<span class="badge badge--success">Calificación: ${subState.grade}</span>` 
          : '';
          
        card.innerHTML = `
          <div class="sub-card-top">
            <div class="sub-code-row">
              <span class="sub-code">CÓDIGO: TUP${sub.id}</span>
              <span class="badge ${statusBadgeClass(badgeClass)}">${statusText}</span>
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
        const isLocked = !subState.puede_cursar;
        const lockedDisponible = false; // siempre se puede volver a "Disponible"
        const lockedCursando = !subState.puede_cursar;
        const lockedRegular = !subState.puede_cursar;
        const lockedAprobada = !subState.puede_aprobar;

        // Feedback visual si puede cursar pero aún no puede aprobar (efecto shake)
        const aprobarBloqueadaParcial = subState.puede_cursar && !subState.puede_aprobar;

        const node = document.createElement('div');
        let nodeClass = subState.status;
        
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
            <button id="btn-${sub.id}-disponible" class="btn-status-toggle ${!lockedDisponible && subState.status === 'disponible' ? 'active disponible' : ''}"
                    ${lockedDisponible ? 'disabled' : ''} onclick="event.stopPropagation(); window.changeSubjectStatus(${sub.id}, 'disponible')">Disponible</button>
            <button id="btn-${sub.id}-cursando" class="btn-status-toggle ${!lockedCursando && subState.status === 'cursando' ? 'active cursando' : ''}"
                    ${lockedCursando ? 'disabled' : ''} onclick="event.stopPropagation(); window.changeSubjectStatus(${sub.id}, 'cursando')">Cursar</button>
            <button id="btn-${sub.id}-regular" class="btn-status-toggle ${!lockedRegular && subState.status === 'regular' ? 'active regular' : ''}"
                    ${lockedRegular ? 'disabled' : ''} onclick="event.stopPropagation(); window.changeSubjectStatus(${sub.id}, 'regular')">Regular</button>
            <button id="btn-${sub.id}-aprobada" class="btn-status-toggle ${!lockedAprobada && subState.status === 'aprobada' ? 'active aprobada' : ''} ${aprobarBloqueadaParcial ? 'aprobar-bloqueada' : ''}"
                    ${lockedAprobada && !aprobarBloqueadaParcial ? 'disabled' : ''}
                    title="${aprobarBloqueadaParcial ? 'Podés regularizarla, pero todavía no podés aprobarla: faltan correlativas.' : ''}"
                    onclick="event.stopPropagation(); ${aprobarBloqueadaParcial ? `window.shakeApproveButton(this)` : `window.changeSubjectStatus(${sub.id}, 'aprobada')`}">Aprobar</button>
          </div>
        `;

        // Al hacer clic en la info del nodo (no en los botones), mostrar detalle en modal
        node.querySelector('.tree-node-info').onclick = () => {
          window.openSubjectInfoModal(sub, subState);
        };

        nodesContainer.appendChild(node);
      });
    }
  });
}
