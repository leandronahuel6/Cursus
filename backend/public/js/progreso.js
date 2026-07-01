// Cursus - Módulo Unificado "Mi Progreso" (UTN Haedo TUP)

// Fecha del sistema: 12 de Junio de 2026
const SYSTEM_TODAY = new Date();

// Base de datos de materias de la Tecnicatura (TUP Plan 2024)
const TUP_PLAN = [
  { id: 1, name: 'Programación I', code: 'PROG1', level: 1, cuat: '1° Cuatrimestre' },
  { id: 2, name: 'Arquitectura y Sistemas Operativos', code: 'ASO', level: 1, cuat: '1° Cuatrimestre' },
  { id: 3, name: 'Matemática', code: 'MAT', level: 1, cuat: '1° Cuatrimestre' },
  { id: 4, name: 'Organización Empresarial', code: 'OE', level: 1, cuat: '1° Cuatrimestre' },
  { id: 5, name: 'Programación II', code: 'PROG2', level: 1, cuat: '2° Cuatrimestre' },
  { id: 6, name: 'Probabilidad y Estadística', code: 'EST', level: 1, cuat: '2° Cuatrimestre' },
  { id: 7, name: 'Base de Datos I', code: 'BD1', level: 1, cuat: '2° Cuatrimestre' },
  { id: 8, name: 'Inglés I', code: 'ING1', level: 1, cuat: '2° Cuatrimestre' },
  { id: 9, name: 'Programación III', code: 'PROG3', level: 2, cuat: '1° Cuatrimestre' },
  { id: 10, name: 'Base de Datos II', code: 'BD2', level: 2, cuat: '1° Cuatrimestre' },
  { id: 11, name: 'Metodología de Sistemas I', code: 'MS1', level: 2, cuat: '1° Cuatrimestre' },
  { id: 12, name: 'Inglés II', code: 'ING2', level: 2, cuat: '1° Cuatrimestre' },
  { id: 13, name: 'Programación IV', code: 'PROG4', level: 2, cuat: '2° Cuatrimestre' },
  { id: 14, name: 'Metodología de Sistemas II', code: 'MS2', level: 2, cuat: '2° Cuatrimestre' },
  { id: 15, name: 'Introducción al Análisis de Datos', code: 'IAD', level: 2, cuat: '2° Cuatrimestre' },
  { id: 16, name: 'Legislación', code: 'LEG', level: 2, cuat: '2° Cuatrimestre' },
  { id: 17, name: 'Gestión de Desarrollo de Software', code: 'GDS', level: 2, cuat: '2° Cuatrimestre' },
  { id: 18, name: 'Trabajo Final Integrador (TFI)', code: 'TFI', level: 2, cuat: 'Trabajo Final' }
];

// Estado global de la pantalla
let state = {
  currentTab: 'academic', // academic vs productivity
  subjects: {}, // cargado de materias reales: id -> { status, grade }
  simulation: {}, // id -> { notaSimulada, activa }
  pace: 2 // ritmo por cuatrimestre
};

// ================= CARGA Y GUARDADO DE ESTADOS =================

function init() {
  loadSubjectsState();
  loadSimulationState();
  
  // Registrar eventos
  const btnSave = document.getElementById('btn-save-progress');
  if (btnSave) {
    btnSave.addEventListener('click', saveSimulationState);
  }

  // Inicializar vistas y gráficos
  updateUI();
}

function loadSubjectsState() {
  const saved = localStorage.getItem('cursus_subjects_state');
  if (saved) {
    state.subjects = JSON.parse(saved);
  } else {
    // Estado inicial ficticio si no existe (estudiante en mitad del plan)
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
    // Guardar para que "Mis Materias" también lo use
    localStorage.setItem('cursus_subjects_state', JSON.stringify(state.subjects));
  }
}

function loadSimulationState() {
  const savedSim = localStorage.getItem('cursus_avg_simulation');
  if (savedSim) {
    try {
      const parsed = JSON.parse(savedSim);
      state.simulation = parsed.simulation || {};
      state.pace = parsed.pace || 2;
    } catch (e) {
      console.error('Error al cargar simulación', e);
    }
  }
  
  // Garantizar que toda materia no aprobada tenga una entrada en simulación
  TUP_PLAN.forEach(sub => {
    const isApproved = state.subjects[sub.id] && state.subjects[sub.id].status === 'aprobada';
    if (!isApproved) {
      if (!state.simulation[sub.id]) {
        // Inicializar por defecto
        const subReal = state.subjects[sub.id] || {};
        const isRegularOrCursando = subReal.status === 'regular' || subReal.status === 'cursando';
        state.simulation[sub.id] = {
          notaSimulada: 7,
          activa: isRegularOrCursando
        };
      }
    }
  });
}

function saveSimulationState() {
  localStorage.setItem('cursus_avg_simulation', JSON.stringify({
    simulation: state.simulation,
    pace: state.pace
  }));
  showToast('¡Simulación guardada con éxito!');
}

// ================= CONTROL DE PESTAÑAS =================

window.switchToTab = function(tabName) {
  state.currentTab = tabName;
  
  // Toggles de botones
  document.getElementById('tab-academic').classList.toggle('on', tabName === 'academic');
  document.getElementById('tab-productivity').classList.toggle('on', tabName === 'productivity');
  
  // Toggles de paneles
  document.getElementById('panel-academic-view').style.display = tabName === 'academic' ? 'block' : 'none';
  document.getElementById('panel-productivity-view').style.display = tabName === 'productivity' ? 'block' : 'none';
  
  // Redibujar gráficos si es necesario
  if (tabName === 'productivity') {
    renderProductivityCharts();
  } else {
    renderAcademicCharts();
  }
};

// ================= CÁLCULOS Y RENDERIZADO ACADÉMICO =================

function updateUI() {
  calculateAndRenderProjections();
  renderSimulationList();
  renderAcademicCharts();
}

function calculateAndRenderProjections() {
  // 1. Obtener aprobadas reales
  const approvedList = TUP_PLAN.filter(sub => state.subjects[sub.id] && state.subjects[sub.id].status === 'aprobada');
  const countReal = approvedList.length;
  const sumReal = approvedList.reduce((acc, sub) => acc + (state.subjects[sub.id].grade || 0), 0);
  const realAvg = countReal > 0 ? sumReal / countReal : 0;
  
  document.getElementById('real-avg-val').textContent = realAvg.toFixed(2);
  document.getElementById('real-avg-lbl').textContent = `${countReal} de ${TUP_PLAN.length} aprobadas`;
  document.getElementById('leg-real-text').textContent = `${realAvg.toFixed(2)} Real`;

  // 2. Calcular promedio proyectado
  let sumProj = sumReal;
  let countProj = countReal;
  let simulatedCount = 0;
  let simulatedSum = 0;

  TUP_PLAN.forEach(sub => {
    const isApproved = state.subjects[sub.id] && state.subjects[sub.id].status === 'aprobada';
    if (!isApproved) {
      const sim = state.simulation[sub.id];
      const subReal = state.subjects[sub.id] || {};
      const isRegularOrCursando = subReal.status === 'regular' || subReal.status === 'cursando';
      // Solo simular si es regular/cursando y el toggle está activo
      if (isRegularOrCursando && sim && sim.activa) {
        sumProj += sim.notaSimulada;
        simulatedSum += sim.notaSimulada;
        countProj++;
        simulatedCount++;
      }
    }
  });

  const projAvg = countProj > 0 ? sumProj / countProj : 0;
  document.getElementById('proj-avg-val').textContent = projAvg.toFixed(2);
  document.getElementById('proj-avg-lbl').textContent = `Simulando ${simulatedCount} final${simulatedCount !== 1 ? 'es' : ''}`;
  document.getElementById('leg-proj-text').textContent = `${projAvg.toFixed(2)} Proyectado`;

  // 3. Fórmula matemática
  const mathFormula = `P = (${sumReal.toFixed(1)} + ${simulatedSum > 0 ? simulatedSum : 'Σ Sim'}) / (${countReal} + ${simulatedCount})`;
  document.getElementById('formula-text').textContent = mathFormula;

  // 4. Mejora / Caída
  const diff = projAvg - realAvg;
  const improvementLabel = document.getElementById('improvement-label');
  if (diff >= 0) {
    improvementLabel.textContent = `+${diff.toFixed(2)} pts de mejora`;
    improvementLabel.className = 'improvement-badge plus';
  } else {
    improvementLabel.textContent = `${diff.toFixed(2)} pts de caída`;
    improvementLabel.className = 'improvement-badge minus';
  }

  // 5. Progreso visual comparativo
  const pctReal = (realAvg / 10) * 100;
  const pctProj = (projAvg / 10) * 100;
  document.getElementById('bar-real-fill').style.width = `${pctReal}%`;
  document.getElementById('bar-proj-fill').style.width = `${pctProj}%`;

  // 6. Proyección Académica (Ritmo)
  const remainingCount = TUP_PLAN.length - countReal;
  document.getElementById('m-remaining').textContent = `${remainingCount} materia${remainingCount !== 1 ? 's' : ''}`;
  
  const semestersNeeded = Math.ceil(remainingCount / state.pace);
  document.getElementById('m-semesters').textContent = `${semestersNeeded} cuatrimestre${semestersNeeded !== 1 ? 's' : ''}`;
  
  const yearsEstimated = (semestersNeeded / 2).toFixed(1);
  document.getElementById('m-years').textContent = `${yearsEstimated} año${parseFloat(yearsEstimated) !== 1.0 ? 's' : ''}`;

  // Egreso proyectado dinámico
  const currentMonth = SYSTEM_TODAY.getMonth(); // 5 = Junio
  const currentYear = SYSTEM_TODAY.getFullYear();
  let endMonth = 'Julio';
  let endYear = currentYear;

  if (currentMonth <= 6) {
    if (semestersNeeded % 2 === 1) {
      endMonth = 'Julio';
      endYear = currentYear + Math.floor((semestersNeeded - 1) / 2);
    } else {
      endMonth = 'Diciembre';
      endYear = currentYear + (semestersNeeded / 2) - 1;
    }
  } else {
    if (semestersNeeded % 2 === 1) {
      endMonth = 'Diciembre';
      endYear = currentYear + Math.floor((semestersNeeded - 1) / 2);
    } else {
      endMonth = 'Julio';
      endYear = currentYear + (semestersNeeded / 2);
    }
  }

  const gradDateText = `${endMonth} ${endYear}`;
  document.getElementById('proj-grad-val').textContent = gradDateText;
  document.getElementById('proj-grad-lbl').textContent = `Ritmo: ${state.pace} por cuatrimestre`;
  document.getElementById('m-grad-date').textContent = gradDateText;

  // 7. Generar Trayecto Sugerido
  renderSuggestedPath(semestersNeeded);
}

function renderSuggestedPath(semesters) {
  const container = document.getElementById('suggested-path-grid');
  container.innerHTML = '';

  const currentMonth = SYSTEM_TODAY.getMonth();
  const startYear = SYSTEM_TODAY.getFullYear();
  let currentSem = currentMonth <= 6 ? 1 : 2;

  let yearGroups = {};

  for (let i = 1; i <= semesters; i++) {
    let yearOffset = 0;
    let semLabel = '';
    
    if (currentSem === 1) {
      yearOffset = Math.floor((i - 1) / 2);
      semLabel = i % 2 === 1 ? `1°C` : `2°C`;
    } else {
      yearOffset = Math.floor(i / 2);
      semLabel = i % 2 === 1 ? `2°C` : `1°C`;
    }
    
    const year = startYear + yearOffset;
    const textLabel = `${semLabel} ${year}`;
    const isLast = (i === semesters);

    if (!yearGroups[year]) {
      yearGroups[year] = [];
    }

    yearGroups[year].push({
      num: i,
      label: textLabel,
      isLast: isLast
    });
  }

  Object.keys(yearGroups).sort().forEach(year => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'sug-year-group';
    
    const chipsContainer = document.createElement('div');
    chipsContainer.className = 'sug-chips-row';

    yearGroups[year].forEach(sem => {
      const chip = document.createElement('div');
      chip.className = `sug-chip ${sem.isLast ? 'active' : 'passed'}`;
      chip.innerHTML = `
        <span class="sug-chip-num">C${sem.num}</span>
        <span class="sug-chip-lbl">${sem.label}</span>
      `;
      chipsContainer.appendChild(chip);
    });

    const yearLabel = document.createElement('div');
    yearLabel.className = 'sug-year-lbl';
    yearLabel.textContent = `Año ${year}`;

    groupDiv.appendChild(chipsContainer);
    groupDiv.appendChild(yearLabel);
    container.appendChild(groupDiv);
  });
}

function renderSimulationList() {
  const list = document.getElementById('sim-subjects-list');
  list.innerHTML = '';

  let hasSubjects = false;

  TUP_PLAN.forEach(sub => {
    const subReal = state.subjects[sub.id] || {};
    const isApproved = subReal.status === 'aprobada';
    
    if (!isApproved) {
      hasSubjects = true;
      const sim = state.simulation[sub.id] || { notaSimulada: 7, activa: false };
      const isRegularOrCursando = subReal.status === 'regular' || subReal.status === 'cursando';
      const switchChecked = sim.activa && isRegularOrCursando;

      const item = document.createElement('div');
      item.className = `sim-row ${!isRegularOrCursando ? 'disabled' : ''}`;
      
      item.innerHTML = `
        <div class="sim-left-decor" style="background-color: ${isRegularOrCursando ? '#4F46E5' : '#9CA3AF'}"></div>
        
        <!-- Switch -->
        <label class="ios-switch ${!isRegularOrCursando ? 'switch-disabled' : ''}">
          <input type="checkbox" 
                 ${switchChecked ? 'checked' : ''} 
                 ${!isRegularOrCursando ? 'disabled' : ''} 
                 onchange="toggleSubjectSim(${sub.id}, this.checked)">
          <span class="slider"></span>
        </label>

        <!-- Meta -->
        <div class="sim-subject-info">
          <div class="sim-subject-name ${!isRegularOrCursando ? 'text-dim' : ''}">${sub.name}</div>
          <div class="sim-subject-badge ${subReal.status === 'regular' ? 'b-reg' : (subReal.status === 'cursando' ? 'b-cur' : 'b-lib')}">
            ${sub.code} · ${subReal.status.toUpperCase()}
          </div>
        </div>

        <!-- Stepper Nota -->
        <div class="grade-stepper ${!isRegularOrCursando ? 'stepper-disabled' : ''}">
          <button class="g-btn minus" ${!isRegularOrCursando ? 'disabled' : ''} onclick="adjustGrade(${sub.id}, -1)">-</button>
          <span class="g-val ${switchChecked ? 'active-grade' : ''}" id="grade-val-${sub.id}">${sim.notaSimulada}</span>
          <button class="g-btn plus" ${!isRegularOrCursando ? 'disabled' : ''} onclick="adjustGrade(${sub.id}, 1)">+</button>
        </div>

        ${!isRegularOrCursando ? '<div class="sim-tooltip">Regularizá o cursa la materia para poder simular su final</div>' : ''}
      `;
      list.appendChild(item);
    }
  });

  if (!hasSubjects) {
    list.innerHTML = `<div style="text-align: center; color: var(--tm); padding: 20px; font-size: 13px;">🎉 ¡Felicitaciones! Has aprobado todas las materias.</div>`;
  }
}

window.toggleSubjectSim = function(id, checked) {
  if (state.simulation[id]) {
    state.simulation[id].activa = checked;
    const valSpan = document.getElementById(`grade-val-${id}`);
    if (valSpan) {
      if (checked) valSpan.classList.add('active-grade');
      else valSpan.classList.remove('active-grade');
    }
    calculateAndRenderProjections();
  }
};

window.adjustGrade = function(id, direction) {
  const sim = state.simulation[id];
  if (sim) {
    if (!sim.activa) {
      sim.activa = true;
      renderSimulationList();
    }
    let next = sim.notaSimulada + direction;
    if (next >= 4 && next <= 10) {
      sim.notaSimulada = next;
      document.getElementById(`grade-val-${id}`).textContent = next;
      calculateAndRenderProjections();
    }
  }
};

window.adjustPace = function(direction) {
  let next = state.pace + direction;
  if (next >= 1 && next <= 5) {
    state.pace = next;
    document.getElementById('pace-value').textContent = next;
    calculateAndRenderProjections();
  }
};

// ================= DIBUJADO DE GRÁFICOS SVG =================

function renderAcademicCharts() {
  renderLineChart();
  renderHistoChart();
}

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getAuthHeaders() {
  return {
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + getStoredToken()
  };
}

async function renderProductivityCharts() {
  if (!state.productivity) {
    const token = getStoredToken();
    if (!token) return;
    try {
      const response = await fetch('/api/pomodoro/productividad', { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('No se pudo cargar la productividad');
      state.productivity = await response.json();
    } catch (e) {
      console.error('No se pudo cargar la productividad', e);
      return;
    }
  }

  const data = state.productivity;

  const streakNow = document.getElementById('prod-streak-now');
  if (streakNow) streakNow.textContent = `${data.racha_actual} día${data.racha_actual !== 1 ? 's' : ''}`;
  const streakBest = document.getElementById('prod-streak-best');
  if (streakBest) streakBest.textContent = `${data.racha_mejor} día${data.racha_mejor !== 1 ? 's' : ''}`;

  renderWeeklyChart(data.horas_por_dia || []);
  renderDonutChart(data.distribucion_materias || []);
  renderHeatmap(data.actividad || {});
  renderFocusInsights(data);
}

function renderFocusInsights(data) {
  const focusText = document.getElementById('prod-focus-hour-text');
  if (focusText) {
    focusText.innerHTML = data.hora_pico
      ? `Según tu racha e historial de concentración de los últimos días, tu hora más productiva es de <strong>${data.hora_pico} hs</strong>.`
      : 'Todavía no registramos suficientes sesiones de Pomodoro para estimar tu hora más productiva.';
  }

  const tipBody = document.getElementById('prod-tip-body');
  if (tipBody) {
    const materias = data.materias_cursando || [];
    if (data.promedio_diario > 0 && materias.length > 0) {
      const listado = materias.length > 1
        ? `${materias.slice(0, -1).map(m => `<em>${m}</em>`).join(', ')} y <em>${materias[materias.length - 1]}</em>`
        : `<em>${materias[0]}</em>`;
      tipBody.innerHTML = `Si mantenés el ritmo promedio de ${data.promedio_diario} horas diarias, seguí reforzando ${listado} en tus próximas sesiones de estudio.`;
    } else if (materias.length > 0) {
      tipBody.innerHTML = `Registrá sesiones de Pomodoro en ${materias.length > 1 ? 'tus materias en curso' : `<em>${materias[0]}</em>`} para ver acá tu ritmo de estudio.`;
    } else {
      tipBody.textContent = 'No tenés materias en curso registradas todavía.';
    }
  }
}

// 1. Gráfico de línea: Evolución del Promedio
function renderLineChart() {
  const container = document.getElementById('container-chart-line');
  if (!container) return;
  
  // Obtener aprobadas reales
  const approvedList = TUP_PLAN
    .filter(sub => state.subjects[sub.id] && state.subjects[sub.id].status === 'aprobada')
    .map(sub => ({
      name: sub.name,
      code: sub.code,
      grade: state.subjects[sub.id].grade
    }));

  if (approvedList.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--tm); padding: 40px 10px; font-size: 13px;">No hay materias aprobadas para graficar.</div>`;
    return;
  }

  // Calcular promedios progresivos
  let runningSum = 0;
  const data = approvedList.map((item, idx) => {
    runningSum += item.grade;
    return {
      label: item.code,
      name: item.name,
      grade: item.grade,
      avg: runningSum / (idx + 1)
    };
  });

  const width = container.clientWidth || 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const minGrade = 4;
  const maxGrade = 10;

  // Escalar puntos
  const getX = (index) => {
    if (data.length === 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * (width - 2 * paddingX);
  };
  const getY = (val) => {
    return height - paddingY - ((val - minGrade) / (maxGrade - minGrade)) * (height - 2 * paddingY);
  };

  // Crear elementos del path
  let pathD = '';
  let areaD = '';
  
  data.forEach((p, idx) => {
    const x = getX(idx);
    const y = getY(p.avg);
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${height - paddingY} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
    if (idx === data.length - 1) {
      areaD += ` L ${x} ${y} L ${x} ${height - paddingY} Z`;
    } else if (idx > 0) {
      areaD += ` L ${x} ${y}`;
    }
  });
  
  if (data.length === 1) {
    // Si hay un solo dato, no podemos dibujar una línea, solo el punto
    const x = getX(0);
    const y = getY(data[0].avg);
    pathD = `M ${x - 5} ${y} L ${x + 5} ${y}`;
    areaD = '';
  }

  // Ejes horizontales de referencia (notas 4, 7, 10)
  let axisLines = '';
  [4, 7, 10].forEach(g => {
    const y = getY(g);
    axisLines += `<line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="#f1f5f9" stroke-width="1" />
                  <text x="${paddingX - 10}" y="${y + 4}" fill="#94a3b8" font-size="10" font-weight="600" text-anchor="end">${g}</text>`;
  });

  // Nodos y etiquetas
  let nodes = '';
  let xLabels = '';
  data.forEach((p, idx) => {
    const x = getX(idx);
    const y = getY(p.avg);
    nodes += `<circle cx="${x}" cy="${y}" r="4.5" fill="#4F46E5" stroke="#ffffff" stroke-width="1.5" class="chart-point" data-index="${idx}" style="cursor: pointer;" />`;
    
    // Mostrar etiquetas de texto abajo si no son demasiadas
    if (data.length <= 8 || idx % Math.ceil(data.length / 8) === 0) {
      xLabels += `<text x="${x}" y="${height - 5}" fill="#94a3b8" font-size="9" font-weight="600" text-anchor="middle">${p.label}</text>`;
    }
  });

  const tooltip = document.getElementById('tooltip-chart-line');

  container.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#4F46E5" stop-opacity="0.00" />
        </linearGradient>
      </defs>
      ${axisLines}
      ${areaD ? `<path d="${areaD}" fill="url(#line-grad)" />` : ''}
      <path d="${pathD}" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${nodes}
      ${xLabels}
    </svg>
  `;

  // Controlar eventos del tooltip
  const points = container.querySelectorAll('.chart-point');
  points.forEach(point => {
    point.addEventListener('mouseenter', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      const item = data[idx];
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `<strong>${item.name}</strong><br>Nota: ${item.grade} | Promedio: ${item.avg.toFixed(2)}`;
      
      // Posicionar tooltip
      const rect = container.getBoundingClientRect();
      const ptX = getX(idx);
      const ptY = getY(item.avg);
      tooltip.style.left = `${ptX - tooltip.clientWidth / 2}px`;
      tooltip.style.top = `${ptY - 50}px`;
    });
    point.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

// 2. Gráfico de Barras: Histograma de Notas
function renderHistoChart() {
  const container = document.getElementById('container-chart-histo');
  if (!container) return;

  const approvedList = TUP_PLAN
    .filter(sub => state.subjects[sub.id] && state.subjects[sub.id].status === 'aprobada')
    .map(sub => state.subjects[sub.id].grade);

  if (approvedList.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--tm); padding: 40px 10px; font-size: 13px;">No hay calificaciones registradas.</div>`;
    return;
  }

  // Contar frecuencias para notas del 4 al 10
  const frequencies = { 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
  approvedList.forEach(grade => {
    if (frequencies[grade] !== undefined) frequencies[grade]++;
  });

  const width = container.clientWidth || 500;
  const height = 180;
  const paddingX = 30;
  const paddingY = 25;

  const maxFreq = Math.max(...Object.values(frequencies), 2); // mínimo escala 2

  const grades = [4, 5, 6, 7, 8, 9, 10];
  const colWidth = (width - 2 * paddingX) / grades.length;
  const barWidth = colWidth * 0.6;

  let bars = '';
  let labels = '';
  
  grades.forEach((g, idx) => {
    const freq = frequencies[g];
    const colCenterX = paddingX + idx * colWidth + colWidth / 2;
    const barHeight = (freq / maxFreq) * (height - 2 * paddingY);
    const barX = colCenterX - barWidth / 2;
    const barY = height - paddingY - barHeight;

    bars += `
      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="4" class="histo-bar" data-grade="${g}" data-freq="${freq}" style="cursor: pointer; transition: fill 0.15s;" />
      ${freq > 0 ? `<text x="${colCenterX}" y="${barY - 5}" fill="#1e293b" font-size="10" font-weight="700" text-anchor="middle">${freq}</text>` : ''}
    `;

    labels += `<text x="${colCenterX}" y="${height - 5}" fill="#94a3b8" font-size="10" font-weight="600" text-anchor="middle">Nota ${g}</text>`;
  });

  // Línea base
  const lineY = height - paddingY;
  const baseLine = `<line x1="${paddingX}" y1="${lineY}" x2="${width - paddingX}" y2="${lineY}" stroke="#e2e8f0" stroke-width="1.5" />`;

  container.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${baseLine}
      ${bars}
      ${labels}
    </svg>
  `;

  // Tooltip
  const tooltip = document.getElementById('tooltip-chart-histo');
  const barsElements = container.querySelectorAll('.histo-bar');
  barsElements.forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
      const g = e.target.getAttribute('data-grade');
      const f = e.target.getAttribute('data-freq');
      e.target.setAttribute('fill', '#1d4ed8'); // hover color
      
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `<strong>Calificación: ${g}</strong><br>${f} materia${f !== '1' ? 's' : ''}`;
      
      const rect = container.getBoundingClientRect();
      const barX = parseFloat(e.target.getAttribute('x'));
      const barY = parseFloat(e.target.getAttribute('y'));
      tooltip.style.left = `${barX + barWidth / 2 - tooltip.clientWidth / 2}px`;
      tooltip.style.top = `${barY - 45}px`;
    });
    
    bar.addEventListener('mouseleave', (e) => {
      e.target.setAttribute('fill', '#3b82f6');
      tooltip.style.opacity = '0';
    });
  });
}

// 3. Gráfico de Barras: Horas de concentración semanales
function renderWeeklyChart(horasPorDia) {
  const container = document.getElementById('container-chart-weekly');
  if (!container) return;

  // Horas estudiadas de Lunes a Domingo, traídas de las sesiones de Pomodoro reales
  const studyHours = (horasPorDia || []).map(d => ({ day: d.dia, hours: d.horas }));

  const totalMinutes = studyHours.reduce((acc, d) => acc + (d.hours * 60), 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = Math.round(totalMinutes % 60);
  document.getElementById('total-weekly-hours-lbl').textContent = `Total: ${totalH}h ${totalM}m`;

  const width = container.clientWidth || 500;
  const height = 180;
  const paddingX = 30;
  const paddingY = 25;

  const maxHours = Math.max(...studyHours.map(d => d.hours), 1);
  const colWidth = (width - 2 * paddingX) / studyHours.length;
  const barWidth = colWidth * 0.55;

  let bars = '';
  let labels = '';

  studyHours.forEach((d, idx) => {
    const colCenterX = paddingX + idx * colWidth + colWidth / 2;
    const barHeight = (d.hours / maxHours) * (height - 2 * paddingY);
    const barX = colCenterX - barWidth / 2;
    const barY = height - paddingY - barHeight;

    const formattedHours = d.hours >= 1 
      ? `${Math.floor(d.hours)}h ${Math.round((d.hours % 1) * 60)}m`
      : `${Math.round(d.hours * 60)}m`;

    bars += `
      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#10b981" rx="4" class="week-bar" data-day="${d.day}" data-hours="${formattedHours}" style="cursor: pointer; transition: fill 0.15s;" />
      ${d.hours > 0 ? `<text x="${colCenterX}" y="${barY - 5}" fill="#111827" font-size="9" font-weight="700" text-anchor="middle">${d.hours.toFixed(1)}h</text>` : ''}
    `;

    labels += `<text x="${colCenterX}" y="${height - 5}" fill="#94a3b8" font-size="10" font-weight="600" text-anchor="middle">${d.day}</text>`;
  });

  const baseLine = `<line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="#e2e8f0" stroke-width="1.5" />`;

  container.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${baseLine}
      ${bars}
      ${labels}
    </svg>
  `;

  // Tooltip
  const tooltip = document.getElementById('tooltip-chart-weekly');
  const barsElements = container.querySelectorAll('.week-bar');
  barsElements.forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
      const day = e.target.getAttribute('data-day');
      const hours = e.target.getAttribute('data-hours');
      e.target.setAttribute('fill', '#059669'); // hover color
      
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `<strong>${day}</strong>: ${hours}`;
      
      const barX = parseFloat(e.target.getAttribute('x'));
      const barY = parseFloat(e.target.getAttribute('y'));
      tooltip.style.left = `${barX + barWidth / 2 - tooltip.clientWidth / 2}px`;
      tooltip.style.top = `${barY - 45}px`;
    });
    
    bar.addEventListener('mouseleave', (e) => {
      e.target.setAttribute('fill', '#10b981');
      tooltip.style.opacity = '0';
    });
  });
}

// 4. Gráfico de Donut: Distribución de tiempo de estudio por materia
const DONUT_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

function renderDonutChart(distribucionMaterias) {
  const container = document.getElementById('container-chart-donut');
  const legendContainer = document.getElementById('donut-legend-container');
  if (!container || !legendContainer) return;

  // Distribución de horas de concentración por materia (últimos 30 días), desde la BD
  const distribution = (distribucionMaterias || []).map((d, idx) => ({
    name: d.materia,
    hours: d.horas,
    color: DONUT_COLORS[idx % DONUT_COLORS.length]
  }));

  if (distribution.length === 0) {
    container.innerHTML = '';
    legendContainer.innerHTML = '<div style="font-size:12.5px;color:var(--t3);">Todavía no hay sesiones de Pomodoro registradas por materia.</div>';
    return;
  }

  const total = distribution.reduce((acc, d) => acc + d.hours, 0);

  // Dibujar donut
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const cx = 100;
  const cy = 90;

  let currentOffset = 0;
  let circlesSvg = '';

  distribution.forEach(d => {
    const pct = d.hours / total;
    const strokeDash = pct * circumference;
    const strokeOffset = circumference - strokeDash + currentOffset;
    
    circlesSvg += `
      <circle cx="${cx}" cy="${cy}" r="${radius}" 
              fill="transparent" 
              stroke="${d.color}" 
              stroke-width="16" 
              stroke-dasharray="${circumference}" 
              stroke-dashoffset="${strokeOffset}" 
              transform="rotate(-90 ${cx} ${cy})"
              class="donut-segment"
              data-name="${d.name}"
              data-hours="${d.hours.toFixed(1)}h"
              style="transition: stroke-width 0.2s; cursor: pointer;" />
    `;
    currentOffset += strokeDash;
  });

  // Círculo central blanco para el "agujero"
  circlesSvg += `
    <circle cx="${cx}" cy="${cy}" r="${radius - 8}" fill="#ffffff" />
    <text x="${cx}" y="${cy - 2}" fill="#1e293b" font-size="14" font-weight="800" text-anchor="middle">${total.toFixed(1)} hs</text>
    <text x="${cx}" y="${cy + 12}" fill="#64748b" font-size="8" font-weight="700" text-anchor="middle">ESTUDIADAS</text>
  `;

  container.innerHTML = `
    <svg width="200" height="180" viewBox="0 0 200 180">
      ${circlesSvg}
    </svg>
  `;

  // Rellenar la leyenda
  legendContainer.innerHTML = '';
  distribution.forEach(d => {
    const pct = ((d.hours / total) * 100).toFixed(0);
    const row = document.createElement('div');
    row.className = 'donut-legend-row';
    row.innerHTML = `
      <div class="donut-legend-name">
        <div class="legend-color" style="background-color: ${d.color};"></div>
        <span>${d.name}</span>
      </div>
      <span class="donut-legend-pct">${pct}% (${d.hours.toFixed(1)}h)</span>
    `;
    legendContainer.appendChild(row);
  });

  // Interacción
  const segments = container.querySelectorAll('.donut-segment');
  segments.forEach(seg => {
    seg.addEventListener('mouseenter', (e) => {
      seg.setAttribute('stroke-width', '22');
    });
    seg.addEventListener('mouseleave', (e) => {
      seg.setAttribute('stroke-width', '16');
    });
  });
}

// 5. Heatmap de hábitos (últimos 45 días), con la cantidad real de Pomodoros por día
function renderHeatmap(actividad) {
  const grid = document.getElementById('activity-heatmap-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const dias = 45;
  const hoy = new Date();

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const cantidad = actividad[clave] || 0;

    let lvl = 0;
    if (cantidad >= 8) lvl = 4;
    else if (cantidad >= 5) lvl = 3;
    else if (cantidad >= 3) lvl = 2;
    else if (cantidad >= 1) lvl = 1;

    const day = document.createElement('div');
    day.className = 'heatmap-day';
    if (lvl > 0) {
      day.classList.add(`lvl-${lvl}`);
    }

    day.title = `${clave}: ${cantidad} pomodoro${cantidad !== 1 ? 's' : ''} completado${cantidad !== 1 ? 's' : ''}`;
    grid.appendChild(day);
  }
}

// ================= UTILIDADES =================

function showToast(message) {
  let toast = document.getElementById('avg-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'avg-toast';
    toast.className = 'avg-toast-box';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', init);
