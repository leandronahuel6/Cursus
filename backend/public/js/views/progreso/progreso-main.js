/**
 * @fileoverview Orquestador de la página de Mi Progreso.
 * Coordina los módulos data, charts y projection. Inicializa eventos,
 * gestiona el estado global y expone funciones legacy en window.
 * @module views/progreso/progreso-main
 */

'use strict';

import {
  TUP_PLAN,
  fetchMisMaterias,
  fetchProductividad,
  loadSimulationState,
  saveSimulationState,
  loadSubjectsFallback,
  saveSubjectsState
} from './progreso-data.js';

import {
  renderDonutChart,
  renderHeatmap,
  renderLineChart,
  renderHistoChart,
  renderWeeklyChart
} from './progreso-charts.js';

import {
  calculateRealAverage,
  calculateProjectedAverage,
  calculateImprovement,
  projectGraduation,
  generateSuggestedPath,
  buildFormulaText
} from './progreso-projection.js';

// ── Estado global ───────────────────────────────────────────────────────────

export const state = {
  currentTab: 'academic',
  subjects: {},
  simulation: {},
  pace: 2,
  productivity: null
};

// ── Inicialización ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadSubjectsState();
  loadSimState();

  const btnSave = document.getElementById('btn-save-progress');
  if (btnSave) btnSave.addEventListener('click', persistSimulation);

  updateUI();
});

// ── Data loading ────────────────────────────────────────────────────────────

async function loadSubjectsState() {
  try {
    const data = await fetchMisMaterias();
    state.subjects = {};
    data.forEach(m => {
      state.subjects[m.id] = {
        status: m.estado,
        grade: m.nota ? parseFloat(m.nota) : null
      };
    });
  } catch (e) {
    console.error('Error al cargar materias del backend, usando fallback local', e);
    const fallback = loadSubjectsFallback();
    if (fallback) {
      state.subjects = fallback;
    } else {
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
      saveSubjectsState(state.subjects);
    }
  }
}

function loadSimState() {
  const saved = loadSimulationState();
  state.simulation = saved.simulation;
  state.pace = saved.pace;

  TUP_PLAN.forEach(sub => {
    const isApproved = state.subjects[sub.id] && state.subjects[sub.id].status === 'aprobada';
    if (!isApproved) {
      if (!state.simulation[sub.id]) {
        const subReal = state.subjects[sub.id] || {};
        const isRegularOrCursando = subReal.status === 'regular' || subReal.status === 'cursando';
        state.simulation[sub.id] = { notaSimulada: 7, activa: isRegularOrCursando };
      }
    }
  });
}

function persistSimulation() {
  saveSimulationState(state.simulation, state.pace);
  window.showToast('¡Simulación guardada con éxito!', 'success');
}

// ── UI orchestration ────────────────────────────────────────────────────────

export function updateUI() {
  calculateAndRenderProjections();
  renderSimulationList();
  renderAcademicCharts();
}

function calculateAndRenderProjections() {
  const real = calculateRealAverage(state.subjects);
  const proj = calculateProjectedAverage(state.subjects, state.simulation);
  const imp = calculateImprovement(proj.avg, real.avg);
  const grad = projectGraduation(real.count, state.pace);
  const path = generateSuggestedPath(grad.semestersNeeded);

  document.getElementById('real-avg-val').textContent = real.avg.toFixed(2);
  document.getElementById('real-avg-lbl').textContent = `${real.count} de ${TUP_PLAN.length} aprobadas`;
  document.getElementById('leg-real-text').textContent = `${real.avg.toFixed(2)} Real`;

  document.getElementById('proj-avg-val').textContent = proj.avg.toFixed(2);
  document.getElementById('proj-avg-lbl').textContent = `Simulando ${proj.simulatedCount} final${proj.simulatedCount !== 1 ? 'es' : ''}`;
  document.getElementById('leg-proj-text').textContent = `${proj.avg.toFixed(2)} Proyectado`;

  document.getElementById('formula-text').textContent = buildFormulaText(real.sum, real.count, proj.simulatedSum, proj.simulatedCount);

  const improvementLabel = document.getElementById('improvement-label');
  if (imp.improved) {
    improvementLabel.textContent = `+${imp.diff.toFixed(2)} pts de mejora`;
    improvementLabel.className = 'improvement-badge plus';
  } else {
    improvementLabel.textContent = `${imp.diff.toFixed(2)} pts de caída`;
    improvementLabel.className = 'improvement-badge minus';
  }

  const pctReal = (real.avg / 10) * 100;
  const pctProj = (proj.avg / 10) * 100;
  document.getElementById('bar-real-fill').style.width = `${pctReal}%`;
  document.getElementById('bar-proj-fill').style.width = `${pctProj}%`;

  document.getElementById('m-remaining').textContent = `${grad.remainingCount} materia${grad.remainingCount !== 1 ? 's' : ''}`;
  document.getElementById('m-semesters').textContent = `${grad.semestersNeeded} cuatrimestre${grad.semestersNeeded !== 1 ? 's' : ''}`;
  document.getElementById('m-years').textContent = `${grad.yearsEstimated} año${grad.yearsEstimated !== 1.0 ? 's' : ''}`;

  document.getElementById('proj-grad-val').textContent = grad.gradDate;
  document.getElementById('proj-grad-lbl').textContent = `Ritmo: ${state.pace} por cuatrimestre`;
  document.getElementById('m-grad-date').textContent = grad.gradDate;

  renderSuggestedPath(path);
}

function renderSuggestedPath(semesterPath) {
  const container = document.getElementById('suggested-path-grid');
  container.innerHTML = '';

  const yearGroups = {};
  semesterPath.forEach(sem => {
    if (!yearGroups[sem.year]) yearGroups[sem.year] = [];
    yearGroups[sem.year].push(sem);
  });

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

        <label class="ios-switch ${!isRegularOrCursando ? 'switch-disabled' : ''}">
          <input type="checkbox"
                 ${switchChecked ? 'checked' : ''}
                 ${!isRegularOrCursando ? 'disabled' : ''}
                 onchange="toggleSubjectSim(${sub.id}, this.checked)">
          <span class="slider"></span>
        </label>

        <div class="sim-subject-info">
          <div class="sim-subject-name ${!isRegularOrCursando ? 'text-dim' : ''}">${sub.name}</div>
          <div class="sim-subject-badge ${subReal.status === 'regular' ? 'b-reg' : (subReal.status === 'cursando' ? 'b-cur' : 'b-lib')}">
            ${sub.code} · ${subReal.status.toUpperCase()}
          </div>
        </div>

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
    list.innerHTML = '<div style="text-align: center; color: var(--tm); padding: 20px; font-size: 13px;">🎉 ¡Felicitaciones! Has aprobado todas las materias.</div>';
  }
}

function renderAcademicCharts() {
  const approved = TUP_PLAN
    .filter(sub => state.subjects[sub.id] && state.subjects[sub.id].status === 'aprobada')
    .map(sub => ({ name: sub.name, code: sub.code, grade: state.subjects[sub.id].grade }));

  renderLineChart(approved);

  const grades = approved.map(a => a.grade);
  renderHistoChart(grades);
}

async function renderProductivityCharts() {
  if (!state.productivity) {
    try {
      state.productivity = await fetchProductividad();
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

// ── Window handlers (legacy) ────────────────────────────────────────────────

window.switchToTab = function(tabName) {
  state.currentTab = tabName;

  document.getElementById('tab-academic').classList.toggle('on', tabName === 'academic');
  document.getElementById('tab-productivity').classList.toggle('on', tabName === 'productivity');
  document.getElementById('panel-academic-view').style.display = tabName === 'academic' ? 'block' : 'none';
  document.getElementById('panel-productivity-view').style.display = tabName === 'productivity' ? 'block' : 'none';

  if (tabName === 'productivity') {
    renderProductivityCharts();
  } else {
    renderAcademicCharts();
  }
};

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
