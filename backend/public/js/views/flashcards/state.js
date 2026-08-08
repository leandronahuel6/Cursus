/**
 * @fileoverview Estado global centralizado para el módulo Flashcards.
 *
 * Este módulo actúa como la única fuente de verdad (Single Source of Truth)
 * para toda la lógica de sesión, estudio y gestión de mazos. Ningún otro
 * módulo debe declarar variables de estado propias; deben importar y mutar
 * el objeto exportado desde aquí.
 *
 * @module state
 */

/**
 * @typedef {Object} Deck
 * @property {number}  id               - Identificador único del mazo.
 * @property {string}  nombre           - Nombre visible del mazo.
 * @property {string|null} descripcion  - Descripción opcional.
 * @property {string}  color            - Clase de color (ej. 'indigo').
 * @property {string|null} categoria    - Carpeta/categoría del mazo.
 * @property {number}  cards_count      - Cantidad de tarjetas.
 * @property {number|null} porcentaje_acierto - Porcentaje histórico de acierto.
 */

/**
 * @typedef {Object} Card
 * @property {number} id           - Identificador único de la tarjeta.
 * @property {string} pregunta     - Texto de la pregunta (frente).
 * @property {string} respuesta    - Texto de la respuesta (reverso).
 * @property {string|null} distractor_1 - Distractor opcional para modo examen.
 * @property {string|null} distractor_2 - Distractor opcional para modo examen.
 * @property {string|null} distractor_3 - Distractor opcional para modo examen.
 * @property {number} correctas    - Veces respondida correctamente.
 * @property {number} incorrectas  - Veces respondida incorrectamente.
 * @property {number} caja         - Caja del sistema Leitner.
 */

/**
 * @type {string|null} Token de autenticación JWT. Se obtiene de localStorage o sessionStorage.
 */
export const activeToken =
    localStorage.getItem('token') || sessionStorage.getItem('token');

/**
 * @type {Deck[]} Lista completa de mazos del usuario, cargada desde la API.
 */
export let currentDecks = [];

/**
 * @type {Deck|null} Mazo activo en la sesión de estudio actual.
 */
export let currentStudyDeck = null;

/**
 * @type {Card[]} Tarjetas de la sesión de estudio activa (ya barajadas/filtradas).
 */
export let currentStudyCards = [];

/**
 * @type {Card[]} Copia maestra del mazo completo, usada para generar distractores aleatorios.
 */
export let masterSessionCards = [];

/**
 * @type {number} Índice de la tarjeta actual dentro de `currentStudyCards`.
 */
export let currentStudyIndex = 0;

/**
 * @type {number} Contador de respuestas correctas en la sesión actual.
 */
export let currentSessionCorrect = 0;

/**
 * @type {number} Contador de respuestas incorrectas en la sesión actual.
 */
export let currentSessionIncorrect = 0;

/**
 * @type {Function|null} Referencia al listener de teclado activo, para poder removerlo correctamente.
 */
export let keyboardListener = null;

/**
 * @type {number|null} ID de la tarjeta que se está editando en la sección Gestionar. `null` si no hay edición activa.
 */
export let editingCardId = null;

/**
 * @type {number|null} ID del mazo seleccionado para iniciar una sesión de estudio.
 */
export let selectedDeckIdForStudy = null;

/**
 * @type {'all'|'exam'} Modo de estudio activo. 'all' = tarjetas 3D, 'exam' = opción múltiple.
 */
export let currentStudyMode = 'all';

/**
 * @type {Function|null} Función resolve de la Promise del modal de confirmación personalizado.
 */
export let confirmPromiseResolve = null;

/**
 * @type {number|null} ID del mazo que se está gestionando en la sección Manage.
 */
export let manageDeckId = null;

/**
 * @type {Object[]} Lista de materias en estado 'cursando', usada para poblar el selector de categorías.
 */
export let materiasCursandoFlashcards = [];

// ==========================================================================
// Setters — Mutadores explícitos del estado
// Permiten mantener el control sobre qué módulo puede cambiar qué estado.
// ==========================================================================

/** @param {Deck[]} decks */
export function setCurrentDecks(decks) { currentDecks = decks; }

/** @param {Deck|null} deck */
export function setCurrentStudyDeck(deck) { currentStudyDeck = deck; }

/** @param {Card[]} cards */
export function setCurrentStudyCards(cards) { currentStudyCards = cards; }

/** @param {Card[]} cards */
export function setMasterSessionCards(cards) { masterSessionCards = cards; }

/** @param {number} index */
export function setCurrentStudyIndex(index) { currentStudyIndex = index; }

/** @param {number} count */
export function setCurrentSessionCorrect(count) { currentSessionCorrect = count; }

/** @param {number} count */
export function setCurrentSessionIncorrect(count) { currentSessionIncorrect = count; }

/** @param {Function|null} listener */
export function setKeyboardListener(listener) { keyboardListener = listener; }

/** @param {number|null} id */
export function setEditingCardId(id) { editingCardId = id; }

/** @param {number|null} id */
export function setSelectedDeckIdForStudy(id) { selectedDeckIdForStudy = id; }

/** @param {'all'|'exam'} mode */
export function setCurrentStudyMode(mode) { currentStudyMode = mode; }

/** @param {Function|null} fn */
export function setConfirmPromiseResolve(fn) { confirmPromiseResolve = fn; }

/** @param {number|null} id */
export function setManageDeckId(id) { manageDeckId = id; }

/** @param {Object[]} materias */
export function setMateriasCursandoFlashcards(materias) { materiasCursandoFlashcards = materias; }

/**
 * Reinicia todos los contadores y el índice de la sesión de estudio activa.
 * Se llama al iniciar o reiniciar una sesión.
 * @returns {void}
 */
export function resetStudySession() {
    currentStudyIndex = 0;
    currentSessionCorrect = 0;
    currentSessionIncorrect = 0;
}
