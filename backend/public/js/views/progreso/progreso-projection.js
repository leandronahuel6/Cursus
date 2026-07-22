/**
 * @fileoverview Fórmulas de proyección académica para Mi Progreso.
 * Cálculos de promedios reales vs proyectados, ritmo de carrera,
 * fecha estimada de egreso y sugerencia de trayecto.
 * Funciones puras sin efectos secundarios ni DOM.
 * @module views/progreso/progreso-projection
 */

'use strict';

import { TUP_PLAN } from './progreso-data.js';

/**
 * Calcula el promedio real basado en materias aprobadas.
 * @param {Object} subjects - Mapa id -> { status, grade }
 * @returns {{ avg: number, count: number, sum: number, approvedList: Array }}
 */
export function calculateRealAverage(subjects) {
  const approved = TUP_PLAN.filter(sub => subjects[sub.id] && subjects[sub.id].status === 'aprobada');
  const count = approved.length;
  const sum = approved.reduce((acc, sub) => acc + (subjects[sub.id].grade || 0), 0);
  const avg = count > 0 ? sum / count : 0;
  return { avg, count, sum, approvedList: approved };
}

/**
 * Calcula el promedio proyectado considerando simulación de finales.
 * @param {Object} subjects - Mapa id -> { status, grade }
 * @param {Object} simulation - Mapa id -> { notaSimulada, activa }
 * @returns {{ avg: number, count: number, simulatedCount: number, simulatedSum: number, sumProj: number }}
 */
export function calculateProjectedAverage(subjects, simulation) {
  const real = calculateRealAverage(subjects);
  let sumProj = real.sum;
  let countProj = real.count;
  let simulatedCount = 0;
  let simulatedSum = 0;

  TUP_PLAN.forEach(sub => {
    const isApproved = subjects[sub.id] && subjects[sub.id].status === 'aprobada';
    if (!isApproved) {
      const sim = simulation[sub.id];
      const subReal = subjects[sub.id] || {};
      const isRegularOrCursando = subReal.status === 'regular' || subReal.status === 'cursando';
      if (isRegularOrCursando && sim && sim.activa) {
        sumProj += sim.notaSimulada;
        simulatedSum += sim.notaSimulada;
        countProj++;
        simulatedCount++;
      }
    }
  });

  const avg = countProj > 0 ? sumProj / countProj : 0;
  return { avg, count: countProj, simulatedCount, simulatedSum, sumProj };
}

/**
 * Calcula la diferencia entre promedio proyectado y real.
 * @returns {{ diff: number, improved: boolean }}
 */
export function calculateImprovement(projAvg, realAvg) {
  const diff = projAvg - realAvg;
  return { diff, improved: diff >= 0 };
}

/**
 * Proyecta la fecha de egreso basada en el ritmo del usuario.
 * @param {number} approvedCount - Cantidad de materias aprobadas
 * @param {number} pace - Ritmo en materias por cuatrimestre
 * @returns {{ remainingCount: number, semestersNeeded: number, yearsEstimated: number, gradDate: string }}
 */
export function projectGraduation(approvedCount, pace) {
  const remainingCount = TUP_PLAN.length - approvedCount;
  const semestersNeeded = Math.ceil(remainingCount / pace);
  const yearsEstimated = (semestersNeeded / 2).toFixed(1);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

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

  return {
    remainingCount,
    semestersNeeded,
    yearsEstimated: parseFloat(yearsEstimated),
    gradDate: `${endMonth} ${endYear}`
  };
}

/**
 * Genera la estructura del trayecto sugerido semestre por semestre.
 * @param {number} semestersNeeded
 * @returns {Array<{ num: number, label: string, year: number, isLast: boolean }>}
 */
export function generateSuggestedPath(semestersNeeded) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const startYear = currentDate.getFullYear();
  const currentSem = currentMonth <= 6 ? 1 : 2;

  const path = [];
  for (let i = 1; i <= semestersNeeded; i++) {
    let yearOffset = 0;
    let semLabel = '';

    if (currentSem === 1) {
      yearOffset = Math.floor((i - 1) / 2);
      semLabel = i % 2 === 1 ? '1°C' : '2°C';
    } else {
      yearOffset = Math.floor(i / 2);
      semLabel = i % 2 === 1 ? '2°C' : '1°C';
    }

    path.push({
      num: i,
      label: `${semLabel} ${startYear + yearOffset}`,
      year: startYear + yearOffset,
      isLast: i === semestersNeeded
    });
  }

  return path;
}

/**
 * Construye la fórmula matemática como string para mostrar en pantalla.
 */
export function buildFormulaText(realSum, realCount, simulatedSum, simulatedCount) {
  const simPart = simulatedSum > 0 ? simulatedSum.toFixed(1) : 'Σ Sim';
  return `P = (${realSum.toFixed(1)} + ${simPart}) / (${realCount} + ${simulatedCount})`;
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.ProgresoProjection = {
  calculateRealAverage,
  calculateProjectedAverage,
  calculateImprovement,
  projectGraduation,
  generateSuggestedPath,
  buildFormulaText
};
