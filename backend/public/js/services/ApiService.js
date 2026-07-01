/**
 * @fileoverview Capa de Red — Repository Pattern (ApiService).
 *
 * Abstrae TODA comunicación HTTP con el backend en funciones puras que retornan
 * Promesas. Ninguna función de este módulo puede manipular el DOM, emitir eventos
 * de UI ni conocer el estado de la aplicación.
 *
 * Responsabilidad única: enviar peticiones y devolver los datos crudos o lanzar
 * el error para que la capa de UI aplique el rollback visual correspondiente.
 *
 * Para migrar de mock a producción: reemplazar las llamadas a `mockFetch()`
 * por llamadas a `apiFetch()` en cada función. El resto del sistema no cambia.
 *
 * @module ApiService
 */

'use strict';

/** URL base de la API del backend Laravel. */
const API_BASE = '/api';

/* ==========================================================================
   INFRAESTRUCTURA INTERNA
   ========================================================================== */

/**
 * Construye los encabezados de autenticación Bearer para cada petición.
 * Lee el token de localStorage con fallback a sessionStorage para cubrir
 * sesiones de solo-pestaña que no persisten entre cierres del navegador.
 * @returns {Object.<string, string>} Headers listos para fetch.
 */
function getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
        'Content-Type':  'application/json',
        'Accept':         'application/json',
        'Authorization': 'Bearer ' + token,
    };
}

/**
 * Simula una petición HTTP asíncrona con delay realista (500 ms).
 *
 * Bloque de rechazo comentado intencionalmente para habilitar pruebas de
 * rollback visual sin afectar el flujo nominal. Para activar: descomentar
 * el bloque y volver a cargar la página.
 *
 * @param {string} url - Endpoint relativo de la petición.
 * @param {object} [options={}] - Opciones de la petición (method, body, etc.).
 * @returns {Promise<{success: boolean, data: object}>}
 */
function mockFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            /*
             * Para probar el flujo de rollback visual en el Kanban o Marcadores,
             * descomentar el siguiente bloque:
             *
             * reject({ success: false, message: 'Error de sincronización simulado.' });
             * return;
             */
            resolve({
                success: true,
                data: options.body ? JSON.parse(options.body) : {},
            });
        }, 500);
    });
}

/**
 * Ejecuta una petición real contra el backend Laravel.
 * Lanza un Error si la respuesta tiene status >= 400, para que el llamador
 * pueda capturarlo y ejecutar el rollback de UI correspondiente.
 *
 * @param {string} url - URL completa o relativa.
 * @param {object} [options={}] - Opciones de fetch (method, body, etc.). Los headers
 *        de autenticación se inyectan automáticamente.
 * @returns {Promise<any>} Respuesta parseada como JSON.
 * @throws {Error} Si la respuesta HTTP tiene status >= 400.
 */
async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        headers: getAuthHeaders(),
        ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
    return res.json();
}

/* ==========================================================================
   MATERIAS
   ========================================================================== */

/**
 * Obtiene la lista de materias en las que el alumno está inscripto.
 * Filtra por estado ('cursando') en la capa de UI para mantener esta función
 * genérica y reutilizable.
 * @returns {Promise<Array<{id: number, nombre: string, estado: string, nivel: number|null}>>}
 */
async function getMaterias() {
    return apiFetch('/api/mis-materias');
}

/**
 * Obtiene el resumen estadístico de sesiones Pomodoro de una materia.
 * Incluye horas acumuladas en la semana, total de sesiones y el log de hoy.
 * @param {number} materiaId - ID de la materia seleccionada actualmente.
 * @returns {Promise<{horas_semana: number, sesiones_totales: number, sesiones_hoy: Array}>}
 */
async function getMateriaResumen(materiaId) {
    return apiFetch(`${API_BASE}/materias/${materiaId}/pomodoro-resumen`);
}

/* ==========================================================================
   TAREAS (KANBAN)
   ========================================================================== */

/**
 * Obtiene todas las tareas de una materia desde la base de datos.
 * @param {number} materiaId - ID de la materia.
 * @returns {Promise<Array>} Array de objetos tarea con propiedades del backend.
 */
async function getTareas(materiaId) {
    return apiFetch(`${API_BASE}/tareas?materia_id=${materiaId}`);
}

/**
 * Crea una nueva tarea en la base de datos y retorna el objeto con su ID real.
 * El ID real de BD es necesario para operaciones posteriores (editar, eliminar).
 * @param {number} materiaId - ID de la materia.
 * @param {string} titulo - Título de la tarea.
 * @param {string} columna - Columna en formato backend ('pendiente'|'progreso'|'finalizado').
 * @returns {Promise<object>} Tarea creada con ID asignado por la BD.
 */
async function createTarea(materiaId, titulo, columna) {
    return apiFetch(`${API_BASE}/tareas`, {
        method: 'POST',
        body:   JSON.stringify({ materia_id: materiaId, titulo, columna }),
    });
}

/**
 * Actualiza los datos base de una tarea (título y/o fecha de vencimiento).
 * @param {string|number} id - ID de la tarea a actualizar.
 * @param {object} datos - Campos a actualizar. Ej: { titulo, fecha_vencimiento }.
 * @returns {Promise<object>}
 */
async function updateTarea(id, datos) {
    return apiFetch(`${API_BASE}/tareas/${id}`, {
        method: 'PUT',
        body:   JSON.stringify(datos),
    });
}

/**
 * Elimina una tarea permanentemente de la base de datos.
 * @param {string|number} id - ID de la tarea a eliminar.
 * @returns {Promise<object>}
 */
async function deleteTarea(id) {
    return apiFetch(`${API_BASE}/tareas/${id}`, { method: 'DELETE' });
}

/**
 * Mueve una tarea a otra columna del Kanban en la BD.
 * Se invoca desde el handler de Drag & Drop con UI optimista; en caso de
 * error, la UI debe ejecutar el rollback visual antes de mostrar el toast.
 * @param {string|number} id - ID de la tarea.
 * @param {string} columna - Nueva columna en formato backend.
 * @returns {Promise<object>}
 */
async function moveTarea(id, columna) {
    return apiFetch(`${API_BASE}/tareas/${id}`, {
        method: 'PUT',
        body:   JSON.stringify({ columna }),
    });
}

/* ==========================================================================
   SUBTAREAS
   ========================================================================== */

/**
 * Persiste el estado completo de las subtareas de una tarea en la BD.
 * Usa mockFetch porque la API real de subtareas aún no está implementada
 * en el backend (pendiente para un lote futuro).
 * @param {string|number} tareaId - ID de la tarea padre.
 * @param {Array<{id: string, text: string, completed: boolean}>} subtasks - Lista de subtareas.
 * @returns {Promise<object>}
 */
async function updateSubtareas(tareaId, subtasks) {
    return mockFetch(`/api/subtareas/${tareaId}`, {
        method: 'PUT',
        body:   JSON.stringify({ subtasks }),
    });
}

/* ==========================================================================
   MARCADORES
   ========================================================================== */

/**
 * Obtiene los marcadores guardados para una materia.
 * @param {number} materiaId - ID de la materia.
 * @returns {Promise<Array<{id: number, url: string, titulo: string|null}>>}
 */
async function getMarcadores(materiaId) {
    return apiFetch(`${API_BASE}/marcadores?materia_id=${materiaId}`);
}

/**
 * Crea un nuevo marcador en la base de datos.
 * El título puede ser nulo; el backend realizará el scraping del Open Graph.
 * @param {number} materiaId - ID de la materia.
 * @param {string} url - URL del recurso a guardar.
 * @param {string|null} titulo - Título opcional proporcionado por el usuario.
 * @returns {Promise<object>}
 */
async function createMarcador(materiaId, url, titulo) {
    return apiFetch(`${API_BASE}/marcadores`, {
        method: 'POST',
        body:   JSON.stringify({ materia_id: materiaId, url, titulo: titulo || null }),
    });
}

/**
 * Actualiza los datos de un marcador existente.
 * @param {string|number} id - ID del marcador.
 * @param {object} datos - Campos a actualizar. Ej: { url, titulo }.
 * @returns {Promise<object>}
 */
async function updateMarcador(id, datos) {
    return apiFetch(`${API_BASE}/marcadores/${id}`, {
        method: 'PUT',
        body:   JSON.stringify(datos),
    });
}

/**
 * Elimina un marcador permanentemente de la base de datos.
 * @param {string|number} id - ID del marcador a eliminar.
 * @returns {Promise<object>}
 */
async function deleteMarcador(id) {
    return apiFetch(`${API_BASE}/marcadores/${id}`, { method: 'DELETE' });
}

/* ==========================================================================
   SESIONES POMODORO
   ========================================================================== */

/**
 * Notifica al servidor que el usuario inicia una nueva sesión de enfoque.
 * Actualmente simulada; se conectará al endpoint real en un lote posterior.
 * @returns {Promise<object>}
 */
async function iniciarSesion() {
    return mockFetch('/api/sesiones/iniciar', { method: 'POST' });
}

/**
 * Notifica al servidor que el usuario reanuda una sesión pausada.
 * @returns {Promise<object>}
 */
async function reanudarSesion() {
    return mockFetch('/api/sesiones/reanudar', { method: 'POST' });
}

/**
 * Notifica al servidor que la sesión fue pausada por el usuario.
 * @returns {Promise<object>}
 */
async function pausarSesion() {
    return mockFetch('/api/sesiones/pausar', { method: 'POST' });
}

/**
 * Registra una sesión de enfoque completada exitosamente en la base de datos.
 * Esta es la única función del módulo que persiste un registro histórico real;
 * por eso usa apiFetch (petición real) en lugar de mockFetch.
 * @param {number} materiaId - ID de la materia activa al momento de completar.
 * @param {number} duracionSegundos - Duración de la sesión en segundos.
 * @returns {Promise<object>}
 */
async function registrarSesionCompletada(materiaId, duracionSegundos) {
    return apiFetch(`${API_BASE}/pomodoro/sesiones`, {
        method: 'POST',
        body:   JSON.stringify({ materia_id: materiaId, duracion_segundos: duracionSegundos }),
    });
}

/**
 * Registra una sesión de enfoque interrumpida antes de completarse.
 * Se invoca al Reiniciar o Saltar una fase de enfoque con progreso parcial.
 * @param {number} duracionMinutos - Minutos completados antes de la interrupción.
 * @returns {Promise<object>}
 */
async function registrarSesionParcial(duracionMinutos) {
    return mockFetch('/api/sesiones/finalizar', {
        method: 'POST',
        body:   JSON.stringify({ estado: 'completada_parcial', duracion: duracionMinutos }),
    });
}

/* ==========================================================================
   EXPORTACIÓN
   ========================================================================== */

export const ApiService = {
    getAuthHeaders,
    getMaterias,
    getMateriaResumen,
    getTareas,
    createTarea,
    updateTarea,
    deleteTarea,
    moveTarea,
    updateSubtareas,
    getMarcadores,
    createMarcador,
    updateMarcador,
    deleteMarcador,
    iniciarSesion,
    reanudarSesion,
    pausarSesion,
    registrarSesionCompletada,
    registrarSesionParcial,
};
