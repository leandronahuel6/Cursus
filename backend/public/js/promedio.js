// Cursus - Calculadora de Promedio (UTN Haedo)

// Fecha de simulación del sistema: 12 de Junio de 2026
const SYSTEM_TODAY = new Date(); 

// Materias aprobadas de base (Promedio Real = 7.20 con 12 materias aprobadas, Suma = 86.4)
const APPROVED_SUBJECTS_DEFAULT = [
  { id: 'mat1', nombre: 'Matemática I', nota: 6 },
  { id: 'prog1', nombre: 'Programación I', nota: 7 },
  { id: 'lab1', nombre: 'Laboratorio de Computación I', nota: 8 },
  { id: 'ing1', nombre: 'Inglés Técnico I', nota: 8 },
  { id: 'ing2', nombre: 'Inglés Técnico II', nota: 9 },
  { id: 'met', nombre: 'Metodología de la Investigación', nota: 7 },
  { id: 'org', nombre: 'Organización Contable y de la Empresa', nota: 7 },
  { id: 'oe', nombre: 'Organización Empresarial', nota: 7 },
  { id: 'lab3', nombre: 'Laboratorio de Computación III', nota: 8 },
  { id: 'civ', nombre: 'Elementos de Educación Cívica', nota: 6 },
  { id: 'ms', nombre: 'Metodología de Sistemas', nota: 7 },
  { id: 'leg', nombre: 'Legislación', nota: 6 }
];

// Materias no aprobadas (disponibles para simular o restantes)
const REMAINING_SUBJECTS_DEFAULT = [
  { id: 'sst', nombre: 'Sistemas de Procesamiento', codigo: 'SST', estado: 'regular', notaSimulada: 8, activa: true },
  { id: 'est', nombre: 'Estadística', codigo: 'EST', estado: 'regular', notaSimulada: 7, activa: true },
  { id: 'lab2', nombre: 'Laboratorio II', codigo: 'LAB2', estado: 'regular', notaSimulada: 9, activa: true },
  { id: 'mat2', nombre: 'Matemática II', codigo: 'MAT2', estado: 'libre', notaSimulada: 10, activa: false },
  { id: 'prog3', nombre: 'Programación III', codigo: 'PROG3', estado: 'libre', notaSimulada: 8, activa: false }
];

// Estado global de la simulación
let avgState = {
  approved: [...APPROVED_SUBJECTS_DEFAULT],
  remaining: [...REMAINING_SUBJECTS_DEFAULT],
  pace: 2 // ritmo por cuatrimestre
};

// Cargar estado inicial desde localStorage si existe
function loadState() {
  const saved = localStorage.getItem('cursus_avg_simulation');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.remaining) {
        // Combinar notas y estado activo guardados
        avgState.remaining.forEach(r => {
          const s = parsed.remaining.find(p => p.id === r.id);
          if (s) {
            r.notaSimulada = s.notaSimulada;
            r.activa = s.activa;
          }
        });
      }
      if (parsed.pace) {
        avgState.pace = parsed.pace;
      }
    } catch (e) {
      console.error('Error al cargar simulación desde localStorage', e);
    }
  }
}

// Guardar simulación en localStorage
function saveStateToLocal() {
  localStorage.setItem('cursus_avg_simulation', JSON.stringify({
    remaining: avgState.remaining.map(r => ({ id: r.id, notaSimulada: r.notaSimulada, activa: r.activa })),
    pace: avgState.pace
  }));
}

// Calcular promedios y proyecciones
function calculateProjections() {
  // 1. Promedio Real
  const sumReal = avgState.approved.reduce((acc, s) => acc + s.nota, 0);
  const countReal = avgState.approved.length;
  const realAvg = sumReal / countReal;
  
  document.getElementById('real-avg-val').textContent = realAvg.toFixed(2);
  document.getElementById('real-avg-lbl').textContent = `${countReal} materias aprobadas`;
  document.getElementById('leg-real-text').textContent = `${realAvg.toFixed(2)} Real`;

  // 2. Promedio Proyectado
  let sumProj = sumReal;
  let countProj = countReal;
  let simulatedCount = 0;

  avgState.remaining.forEach(s => {
    if (s.estado === 'regular' && s.activa) {
      sumProj += s.notaSimulada;
      countProj++;
      simulatedCount++;
    }
  });

  const projAvg = sumProj / countProj;
  document.getElementById('proj-avg-val').textContent = projAvg.toFixed(2);
  document.getElementById('proj-avg-lbl').textContent = `Simulando ${simulatedCount} final${simulatedCount !== 1 ? 'es' : ''}`;
  document.getElementById('leg-proj-text').textContent = `${projAvg.toFixed(2)} Proyectado`;

  // 3. Fórmula matemática
  // Formato: P = (SumaReal + ΣNotas) / (CountReal + N)
  // ej: P = (86.0 + 8 + 7 + 9) / (12 + 3)
  const sumSimulated = avgState.remaining.reduce((acc, s) => (s.estado === 'regular' && s.activa) ? acc + s.notaSimulada : acc, 0);
  const mathFormula = `P = (${sumReal.toFixed(1)} + ${sumSimulated > 0 ? sumSimulated : 'Σ Notas'}) / (${countReal} + ${simulatedCount})`;
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

  // 5. Rellenar barra de progreso comparativa
  // Rango 0-10 -> porcentaje
  const pctReal = (realAvg / 10) * 100;
  const pctProj = (projAvg / 10) * 100;
  document.getElementById('bar-real-fill').style.width = `${pctReal}%`;
  document.getElementById('bar-proj-fill').style.width = `${pctProj}%`;

  // 6. Proyección Académica (Ritmo)
  const totalRemaining = avgState.remaining.length;
  document.getElementById('m-remaining').textContent = `${totalRemaining} materia${totalRemaining !== 1 ? 's' : ''}`;
  
  const semestersNeeded = Math.ceil(totalRemaining / avgState.pace);
  document.getElementById('m-semesters').textContent = `${semestersNeeded} cuatrimestre${semestersNeeded !== 1 ? 's' : ''}`;
  
  const yearsEstimated = (semestersNeeded / 2).toFixed(1);
  document.getElementById('m-years').textContent = `${yearsEstimated} año${parseFloat(yearsEstimated) !== 1.0 ? 's' : ''}`;

  // Calcular egreso proyectado dinámicamente según la fecha actual
  const currentMonth = SYSTEM_TODAY.getMonth(); // 0-indexed (0=Enero, 5=Junio, 11=Diciembre)
  const currentYear = SYSTEM_TODAY.getFullYear();
  
  let endMonth = 'Julio';
  let endYear = currentYear;

  if (currentMonth <= 6) { // Enero a Julio (1er cuatrimestre en curso)
    if (semestersNeeded % 2 === 1) {
      endMonth = 'Julio';
      endYear = currentYear + Math.floor((semestersNeeded - 1) / 2);
    } else {
      endMonth = 'Diciembre';
      endYear = currentYear + (semestersNeeded / 2) - 1;
    }
  } else { // Agosto a Diciembre (2do cuatrimestre en curso)
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
  document.getElementById('proj-grad-lbl').textContent = `Ritmo: ${avgState.pace} por cuatrimestre`;
  document.getElementById('m-grad-date').textContent = gradDateText;

  // 7. Generar Trayecto Sugerido
  renderSuggestedPath(semestersNeeded);
}

// Dibujar trayecto sugerido (C1, C2, C3...)
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

  // Renderizar agrupados por año
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

// Dibujar lista de simulación en panel izquierdo
function renderSimulationList() {
  const list = document.getElementById('sim-subjects-list');
  list.innerHTML = '';

  avgState.remaining.forEach((s, index) => {
    const item = document.createElement('div');
    item.className = `sim-row ${s.estado === 'libre' ? 'disabled' : ''}`;
    
    // Controles si es regular, de lo contrario deshabilitado
    const isRegular = s.estado === 'regular';
    const switchChecked = s.activa && isRegular;

    item.innerHTML = `
      <div class="sim-left-decor" style="background-color: ${isRegular ? '#4F46E5' : '#9CA3AF'}"></div>
      
      <!-- iOS Switch -->
      <label class="ios-switch ${!isRegular ? 'switch-disabled' : ''}">
        <input type="checkbox" 
               ${switchChecked ? 'checked' : ''} 
               ${!isRegular ? 'disabled' : ''} 
               onchange="toggleSubjectSim('${s.id}', this.checked)">
        <span class="slider"></span>
      </label>

      <!-- Subject Meta -->
      <div class="sim-subject-info">
        <div class="sim-subject-name ${!isRegular ? 'text-dim' : ''}">${s.nombre}</div>
        <div class="sim-subject-badge ${isRegular ? 'b-reg' : 'b-lib'}">${s.codigo} · ${s.estado.toUpperCase()}</div>
      </div>

      <!-- Stepper Nota -->
      <div class="grade-stepper ${!isRegular ? 'stepper-disabled' : ''}">
        <button class="g-btn minus" ${!isRegular ? 'disabled' : ''} onclick="adjustGrade('${s.id}', -1)">-</button>
        <span class="g-val ${switchChecked ? 'active-grade' : ''}" id="grade-val-${s.id}">${s.notaSimulada}</span>
        <button class="g-btn plus" ${!isRegular ? 'disabled' : ''} onclick="adjustGrade('${s.id}', 1)">+</button>
      </div>

      <!-- Tooltip explicativo si está libre -->
      ${!isRegular ? '<div class="sim-tooltip">Regulariza la materia para poder simular su final</div>' : ''}
    `;

    list.appendChild(item);
  });
}

// Cambiar estado de toggle en una materia
window.toggleSubjectSim = function(id, checked) {
  const sub = avgState.remaining.find(s => s.id === id);
  if (sub && sub.estado === 'regular') {
    sub.activa = checked;
    
    // Cambiar color de la nota central
    const valSpan = document.getElementById(`grade-val-${id}`);
    if (valSpan) {
      if (checked) {
        valSpan.classList.add('active-grade');
      } else {
        valSpan.classList.remove('active-grade');
      }
    }

    calculateProjections();
  }
};

// Ajustar nota de stepper en una materia
window.adjustGrade = function(id, direction) {
  const sub = avgState.remaining.find(s => s.id === id);
  if (sub && sub.estado === 'regular') {
    // Si la materia no está activa en la simulación, la activamos al tocar el stepper
    if (!sub.activa) {
      sub.activa = true;
      renderSimulationList(); // Redibujar para que muestre el switch ON
    }

    let nextGrade = sub.notaSimulada + direction;
    if (nextGrade >= 4 && nextGrade <= 10) {
      sub.notaSimulada = nextGrade;
      document.getElementById(`grade-val-${id}`).textContent = nextGrade;
      calculateProjections();
    }
  }
};

// Ajustar ritmo de cursada (Pace)
window.adjustPace = function(direction) {
  let nextPace = avgState.pace + direction;
  if (nextPace >= 1 && nextPace <= 5) {
    avgState.pace = nextPace;
    document.getElementById('pace-value').textContent = nextPace;
    calculateProjections();
  }
};

// Inicialización de la página
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  
  // Dibujar UI inicial
  renderSimulationList();
  calculateProjections();

  // Escuchar botón de Guardar
  const saveBtn = document.getElementById('btn-save-progress');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveStateToLocal();
      
      // Mostrar Toast o aviso de éxito
      showToast('¡Progreso de simulación guardado con éxito!');
    });
  }
});

// Toast notification helper
function showToast(message) {
  // Crear toast si no existe
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
