/**
 * @fileoverview Capa de datos para el simulador de Horarios.
 * Fetch/wrappers de API para materias, horarios guardados y
 * búsqueda de usuarios para comparación.
 * @module views/horarios/horarios-data
 */

'use strict';

const API_BASE = '/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

// ── Subject / Schedule API ──────────────────────────────────────────────────

export async function fetchAvailableSubjects() {
  const response = await fetch(`${API_BASE}/mis-materias`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudieron cargar las materias');
  return await response.json();
}

export async function fetchScheduleState() {
  const response = await fetch(`${API_BASE}/horarios`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudo cargar el horario guardado');
  return await response.json();
}

export async function syncSchedule(version, blocks) {
  const response = await fetch(`${API_BASE}/horarios/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version, blocks })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo guardar el horario');
  }
}

export async function searchUser(query) {
  const response = await fetch(`${API_BASE}/horarios/buscar-usuario?search=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Error al buscar usuario');
  return await response.json();
}

export async function fetchUserSchedule(userId) {
  const response = await fetch(`${API_BASE}/horarios/compartido/${userId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('No se pudo cargar el horario');
  return await response.json();
}

// ── Personal activities (localStorage) ──────────────────────────────────────

export function loadPersonalActivities() {
  try {
    const saved = localStorage.getItem('cursus_personal_activities');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [
    { id: 'p_work', nombre: 'Trabajo' },
    { id: 'p_gym', nombre: 'Gimnasio' }
  ];
}

export function savePersonalActivities(activities) {
  localStorage.setItem('cursus_personal_activities', JSON.stringify(activities));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function buildCodigo(nombre) {
  return nombre
    .split(' ')
    .filter(palabra => palabra.length > 2)
    .map(palabra => palabra.slice(0, 3).toUpperCase())
    .join('')
    .slice(0, 8);
}

export function getCommissionByTime(startVal) {
  const [h] = startVal.split(':').map(Number);
  if (h >= 8 && h < 12) return 'Comisión 3 (Mañana)';
  if (h >= 12 && h < 18) return 'Comisión 2 (Tarde)';
  return 'Comisión 1 (Noche)';
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.HorariosData = {
  fetchAvailableSubjects,
  fetchScheduleState,
  syncSchedule,
  searchUser,
  fetchUserSchedule,
  loadPersonalActivities,
  savePersonalActivities,
  buildCodigo,
  getCommissionByTime,
  getAuthHeaders
};
