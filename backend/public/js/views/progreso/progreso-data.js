/**
 * @fileoverview Capa de datos para la página de Mi Progreso.
 * Fetch de materias del backend, gestión de estado de simulación
 * y persistencia en localStorage.
 * @module views/progreso/progreso-data
 */

'use strict';

const API_BASE = window.location.origin + '/api';

export const TUP_PLAN = [
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

export function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + getStoredToken(),
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

// ── API calls ───────────────────────────────────────────────────────────────

export async function fetchMisMaterias() {
  const response = await fetch(`${API_BASE}/mis-materias`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudieron cargar las materias');
  return await response.json();
}

export async function fetchProductividad() {
  const token = getStoredToken();
  if (!token) throw new Error('No autenticado');
  const response = await fetch('/api/pomodoro/productividad', { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudo cargar la productividad');
  return await response.json();
}

// ── State persistence ───────────────────────────────────────────────────────

export function loadSimulationState() {
  const savedSim = localStorage.getItem('cursus_avg_simulation');
  if (savedSim) {
    try {
      const parsed = JSON.parse(savedSim);
      return {
        simulation: parsed.simulation || {},
        pace: parsed.pace || 2
      };
    } catch (e) {
      console.error('Error al cargar simulación', e);
    }
  }
  return { simulation: {}, pace: 2 };
}

export function saveSimulationState(simulation, pace) {
  localStorage.setItem('cursus_avg_simulation', JSON.stringify({
    simulation,
    pace
  }));
}

export function loadSubjectsFallback() {
  const saved = localStorage.getItem('cursus_subjects_state');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }
  return null;
}

export function saveSubjectsState(subjects) {
  localStorage.setItem('cursus_subjects_state', JSON.stringify(subjects));
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.ProgresoData = {
  TUP_PLAN,
  fetchMisMaterias,
  fetchProductividad,
  loadSimulationState,
  saveSimulationState,
  loadSubjectsFallback,
  saveSubjectsState,
  getAuthHeaders,
  getStoredToken
};
