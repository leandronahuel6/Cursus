/**
 * @fileoverview Capa de datos para la página de Alertas y Vencimientos.
 * Fetch/wrappers de API para CRUD de alertas, cuotas y pagos.
 * Exporta funciones como módulo ES6.
 * @module views/alertas/alertas-data
 */

'use strict';

const API_BASE = '/api';

/**
 * Devuelve las cabeceras de autenticación necesarias para las peticiones JSON.
 * @returns {Object} Cabeceras HTTP con Authorization Bearer.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

/**
 * Devuelve el token de autenticación sin el prefijo de Content-Type,
 * para usarse en peticiones multipart/FormData.
 * @returns {Object} Cabeceras HTTP con Authorization Bearer (sin Content-Type).
 */
function getAuthHeadersMultipart() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

// ── Alertas CRUD ────────────────────────────────────────────────────────────

/**
 * Obtiene todas las alertas del alumno autenticado.
 * @returns {Promise<Array>} Array de alertas.
 */
export async function fetchAlertas() {
  const response = await fetch(`${API_BASE}/alertas`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudieron cargar las alertas');
  return await response.json();
}

/**
 * Crea una nueva alerta en la API.
 * @param {Object} data - Datos de la alerta (titulo, categoria, prioridad, fecha, color, descripcion).
 * @returns {Promise<Object>} La alerta recién creada.
 */
export async function createAlerta(data) {
  const response = await fetch(`${API_BASE}/alertas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('No se pudo crear la alerta');
  return await response.json();
}

/**
 * Actualiza una alerta existente.
 * @param {number} id - ID de la alerta.
 * @param {Object} data - Campos a actualizar.
 * @returns {Promise<void>}
 */
export async function updateAlerta(id, data) {
  const response = await fetch(`${API_BASE}/alertas/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('No se pudo actualizar la alerta');
}

/**
 * Elimina una alerta por su ID.
 * @param {number} id - ID de la alerta.
 * @returns {Promise<void>}
 */
export async function deleteAlerta(id) {
  const response = await fetch(`${API_BASE}/alertas/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('No se pudo eliminar la alerta');
}

// ── Cuotas ──────────────────────────────────────────────────────────────────

/**
 * Obtiene el monto vigente de cuota fijado por el administrador.
 * @returns {Promise<Object>} { valor_mensual, cuota_proxima }.
 */
export async function fetchCuotas() {
  const response = await fetch(`${API_BASE}/cuotas`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudieron cargar las cuotas');
  return await response.json();
}

/**
 * Obtiene el estado de pago de la cuota del mes en curso.
 * @returns {Promise<Object>} { pagado, periodo, fecha_pago, dias_para_vencimiento }.
 */
export async function fetchEstadoPagoCuota() {
  const response = await fetch(`${API_BASE}/pagos-cuota/estado`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudo cargar el estado de la cuota');
  return await response.json();
}

/**
 * Obtiene el historial de cuotas del alumno para un ciclo (año).
 * @param {number|string} [anio] - Año del ciclo. Si se omite, devuelve el año actual.
 * @returns {Promise<Object>} { anio, anios_disponibles, cuotas: Array }.
 */
export async function fetchHistorialCuotas(anio) {
  const qs = anio ? `?anio=${encodeURIComponent(anio)}` : '';
  const response = await fetch(`${API_BASE}/pagos-cuota/historial${qs}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudo cargar el historial de cuotas');
  return await response.json();
}

/**
 * Sube el comprobante de transferencia para el pago de una cuota.
 * @param {string} periodo - Período en formato YYYY-MM (ej: "2026-07").
 * @param {File} file - Archivo del comprobante (imagen o PDF).
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function subirComprobante(periodo, file) {
  const formData = new FormData();
  formData.append('comprobante', file);

  const response = await fetch(`${API_BASE}/pagos-cuota/${periodo}/comprobante`, {
    method: 'POST',
    headers: getAuthHeadersMultipart(),
    body: formData
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'No se pudo registrar el pago');
  return data;
}

/**
 * Declara un pago en efectivo (queda pendiente de confirmación por secretaría).
 * @param {string} periodo - Período en formato YYYY-MM (ej: "2026-07").
 * @param {File} file - Foto del recibo de tesorería.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export async function pagarEfectivo(periodo, file) {
  const formData = new FormData();
  formData.append('recibo', file);

  const response = await fetch(`${API_BASE}/pagos-cuota/${periodo}/efectivo`, {
    method: 'POST',
    headers: getAuthHeadersMultipart(),
    body: formData
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'No se pudo registrar el pago en efectivo');
  return data;
}

/**
 * Obtiene el comprobante de un pago como Blob para visualizarlo.
 * @param {number} id - ID del pago de cuota.
 * @returns {Promise<Blob>} Blob del archivo comprobante.
 */
export async function fetchComprobanteBlob(id) {
  const response = await fetch(`${API_BASE}/pagos-cuota/${id}/comprobante`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('No se pudo abrir el comprobante');
  return await response.blob();
}

// ── Utilidades de dominio ──────────────────────────────────────────────────

const MESES_CUOTA = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Convierte un período "YYYY-MM" al formato legible "Mes Año".
 * @param {string} periodo - Período en formato "YYYY-MM".
 * @returns {string} Nombre del mes y año (ej: "Julio 2026").
 */
export function formatPeriodoCuota(periodo) {
  const [y, m] = periodo.split('-');
  return `${MESES_CUOTA[parseInt(m, 10) - 1]} ${y}`;
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.AlertasData = {
  fetchAlertas,
  createAlerta,
  updateAlerta,
  deleteAlerta,
  fetchCuotas,
  fetchEstadoPagoCuota,
  fetchHistorialCuotas,
  subirComprobante,
  pagarEfectivo,
  fetchComprobanteBlob,
  formatPeriodoCuota
};
