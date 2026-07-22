/**
 * @fileoverview Capa de datos para la página de Alertas y Vencimientos.
 * Fetch/wrappers de API para CRUD de alertas, cuotas y pagos.
 * Exporta funciones como módulo y expone `window.AlertasData` para legacy.
 * @module views/alertas/alertas-data
 */

'use strict';

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

// ── Alertas CRUD ────────────────────────────────────────────────────────────

export async function fetchAlertas() {
  const response = await fetch(`${API_BASE}/alertas`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudieron cargar las alertas');
  return await response.json();
}

export async function createAlerta(data) {
  const response = await fetch(`${API_BASE}/alertas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('No se pudo crear la alerta');
  return await response.json();
}

export async function updateAlerta(id, data) {
  const response = await fetch(`${API_BASE}/alertas/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('No se pudo actualizar la alerta');
}

export async function deleteAlerta(id) {
  const response = await fetch(`${API_BASE}/alertas/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('No se pudo eliminar la alerta');
}

// ── Cuotas ──────────────────────────────────────────────────────────────────

export async function fetchCuotas() {
  const response = await fetch(`${API_BASE}/cuotas`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudieron cargar las cuotas');
  return await response.json();
}

export async function fetchEstadoPagoCuota() {
  const response = await fetch(`${API_BASE}/pagos-cuota/estado`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudo cargar el estado de la cuota');
  return await response.json();
}

export async function registrarPagoCuota(fechaPago) {
  const response = await fetch(`${API_BASE}/pagos-cuota`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ fecha_pago: fechaPago })
  });
  if (!response.ok) throw new Error('No se pudo registrar el pago');
  return await response.json();
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.AlertasData = {
  fetchAlertas,
  createAlerta,
  updateAlerta,
  deleteAlerta,
  fetchCuotas,
  fetchEstadoPagoCuota,
  registrarPagoCuota
};
