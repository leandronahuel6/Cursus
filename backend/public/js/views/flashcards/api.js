/**
 * @fileoverview Capa de abstracción para todas las comunicaciones con la API REST de Flashcards.
 *
 * Este módulo centraliza todos los llamados `fetch`. Ningún otro módulo debe
 * realizar peticiones HTTP directamente; siempre deben delegarlo a las
 * funciones exportadas desde aquí (Principio SRP / Separation of Concerns).
 *
 * Todas las funciones son asíncronas y lanzan un Error si el servidor
 * devuelve un status HTTP no exitoso, permitiendo que el llamador maneje
 * los errores con try/catch de forma uniforme.
 *
 * @module api
 */

import { activeToken } from './state.js';

/**
 * Construye los headers estándar de autorización para todas las peticiones a la API.
 * Excluye Content-Type para peticiones multipart/form-data (se añade en `generateDeckWithAI`).
 * @returns {Object} Objeto de headers HTTP.
 */
function getApiHeaders() {
    return {
        'Authorization': 'Bearer ' + activeToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
}

// ==========================================================================
// MATERIAS
// ==========================================================================

/**
 * Obtiene la lista de materias que el alumno está cursando actualmente.
 * @returns {Promise<Object[]>} Lista de materias con estado 'cursando'.
 * @throws {Error} Si la petición falla o el servidor devuelve un error.
 */
export async function fetchMateriasCursando() {
    const response = await fetch('/api/mis-materias', {
        headers: getApiHeaders(),
    });
    if (!response.ok) throw new Error('No se pudieron cargar las materias.');
    const data = await response.json();
    return data.filter((m) => m.estado === 'cursando');
}

// ==========================================================================
// MAZOS (DECKS)
// ==========================================================================

/**
 * Obtiene todos los mazos del usuario autenticado.
 * @returns {Promise<import('./state.js').Deck[]>} Lista de mazos.
 * @throws {Error} Si la petición falla.
 */
export async function fetchDecks() {
    const response = await fetch('/api/flashcards/decks', {
        method: 'GET',
        headers: getApiHeaders(),
    });
    if (!response.ok) {
        if (response.status === 401) {
            window.location.replace('/login');
        }
        throw new Error('Error al cargar mazos.');
    }
    return response.json();
}

/**
 * Obtiene todas las tarjetas de un mazo específico.
 * @param {number} deckId - ID del mazo a consultar.
 * @returns {Promise<import('./state.js').Card[]>} Lista de tarjetas.
 * @throws {Error} Si la petición falla.
 */
export async function fetchDeckCards(deckId) {
    const response = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
        method: 'GET',
        headers: getApiHeaders(),
    });
    if (!response.ok) throw new Error('No se pudieron obtener las tarjetas del mazo.');
    return response.json();
}

/**
 * Crea un nuevo mazo de estudio.
 * @param {Object} payload - Datos del nuevo mazo.
 * @param {string} payload.nombre        - Nombre del mazo.
 * @param {string|null} payload.descripcion - Descripción opcional.
 * @param {string} payload.color         - Clase de color seleccionada.
 * @param {string|null} payload.categoria - Categoría/carpeta del mazo.
 * @returns {Promise<import('./state.js').Deck>} El mazo recién creado.
 * @throws {Error} Si la petición falla.
 */
export async function createDeck(payload) {
    const response = await fetch('/api/flashcards/decks', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al crear el mazo.');
    return response.json();
}

/**
 * Actualiza los datos de un mazo existente.
 * @param {number} deckId - ID del mazo a actualizar.
 * @param {Object} payload - Campos a actualizar (misma forma que `createDeck`).
 * @returns {Promise<import('./state.js').Deck>} El mazo actualizado.
 * @throws {Error} Si la petición falla.
 */
export async function updateDeck(deckId, payload) {
    const response = await fetch(`/api/flashcards/decks/${deckId}`, {
        method: 'PUT',
        headers: getApiHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al actualizar el mazo.');
    return response.json();
}

/**
 * Elimina permanentemente un mazo y todas sus tarjetas asociadas.
 * @param {number} deckId - ID del mazo a eliminar.
 * @returns {Promise<void>}
 * @throws {Error} Si la petición falla.
 */
export async function deleteDeck(deckId) {
    const response = await fetch(`/api/flashcards/decks/${deckId}`, {
        method: 'DELETE',
        headers: getApiHeaders(),
    });
    if (!response.ok) throw new Error('Error al eliminar el mazo.');
}

/**
 * Importa un mazo desde un objeto JSON con formato compatible con Cursus.
 * @param {Object} data - Objeto JSON del mazo a importar.
 * @returns {Promise<import('./state.js').Deck>} El mazo importado.
 * @throws {Error} Si la petición falla.
 */
export async function importDeck(data) {
    const response = await fetch('/api/flashcards/decks/import', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al importar el mazo.');
    return response.json();
}

/**
 * Envía un archivo (PDF, DOCX, imagen, etc.) a la IA para generar un mazo automáticamente.
 * @param {FormData} formData - FormData con el archivo ('file'), la cantidad ('cantidad') y la categoría ('categoria').
 * @returns {Promise<import('./state.js').Deck>} El mazo generado por la IA.
 * @throws {Error} Si la generación falla. El `Error.message` contiene el mensaje del servidor.
 */
export async function generateDeckWithAI(formData) {
    const headers = getApiHeaders();
    // Eliminar Content-Type para que el navegador construya correctamente el boundary de multipart
    delete headers['Content-Type'];

    const response = await fetch('/api/flashcards/decks/generate-ia', {
        method: 'POST',
        headers,
        body: formData,
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Error en la generación con IA.');
    }
    return response.json();
}

// ==========================================================================
// TARJETAS (CARDS)
// ==========================================================================

/**
 * Crea una nueva tarjeta dentro de un mazo específico.
 * @param {number} deckId - ID del mazo destino.
 * @param {Object} payload - Datos de la tarjeta.
 * @param {string} payload.pregunta      - Texto de la pregunta.
 * @param {string} payload.respuesta     - Texto de la respuesta.
 * @param {string|null} payload.distractor_1 - Distractor 1 para examen.
 * @param {string|null} payload.distractor_2 - Distractor 2 para examen.
 * @param {string|null} payload.distractor_3 - Distractor 3 para examen.
 * @returns {Promise<import('./state.js').Card>} La tarjeta creada.
 * @throws {Error} Si la petición falla.
 */
export async function createCard(deckId, payload) {
    const response = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al crear la tarjeta.');
    return response.json();
}

/**
 * Actualiza el contenido de una tarjeta existente.
 * @param {number} cardId - ID de la tarjeta a actualizar.
 * @param {Object} payload - Datos a actualizar (pregunta, respuesta, distractores).
 * @returns {Promise<import('./state.js').Card>} La tarjeta actualizada.
 * @throws {Error} Si la petición falla.
 */
export async function updateCard(cardId, payload) {
    const response = await fetch(`/api/flashcards/cards/${cardId}`, {
        method: 'PUT',
        headers: getApiHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al actualizar la tarjeta.');
    return response.json();
}

/**
 * Elimina permanentemente una tarjeta.
 * @param {number} cardId - ID de la tarjeta a eliminar.
 * @returns {Promise<void>}
 * @throws {Error} Si la petición falla.
 */
export async function deleteCard(cardId) {
    const response = await fetch(`/api/flashcards/cards/${cardId}`, {
        method: 'DELETE',
        headers: getApiHeaders(),
    });
    if (!response.ok) throw new Error('Error al eliminar la tarjeta.');
}

/**
 * Registra en el backend el resultado de una tarjeta (correcto/incorrecto).
 * Esta función dispara la petición de forma asíncrona sin esperar la respuesta,
 * para no bloquear el flujo del estudio (fire-and-forget).
 * @param {number} cardId   - ID de la tarjeta evaluada.
 * @param {'correcto'|'incorrecto'} outcome - Resultado del intento.
 * @returns {void}
 */
export function submitCardResultFireAndForget(cardId, outcome) {
    fetch(`/api/flashcards/cards/${cardId}/resultado`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ resultado: outcome }),
    }).catch((err) => console.error('Error al reportar resultado de tarjeta:', err));
}

// ==========================================================================
// IA — GENERACIÓN DE DISTRACTORES
// ==========================================================================

/**
 * Genera automáticamente tres distractores (opciones incorrectas) para una tarjeta
 * usando la IA del servidor.
 * @param {string} pregunta  - Texto de la pregunta.
 * @param {string} respuesta - Texto de la respuesta correcta.
 * @param {string} categoria - Categoría/contexto del mazo para la IA.
 * @returns {Promise<{distractor_1: string, distractor_2: string, distractor_3: string}>}
 * @throws {Error} Si la petición falla. El `Error.message` contiene el mensaje del servidor.
 */
export async function generateDistractors(pregunta, respuesta, categoria) {
    const response = await fetch('/api/flashcards/cards/generate-distractors', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ pregunta, respuesta, categoria }),
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al generar distractores.');
    }
    return response.json();
}
