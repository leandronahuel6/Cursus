@extends('layouts.app')

@section('title', 'Cursus — Flashcards de Estudio')

{{-- ============================================================ --}}
{{-- CSS: KaTeX + estilos del módulo                              --}}
{{-- ============================================================ --}}
@push('styles')
{{-- KaTeX: renderizado de ecuaciones matemáticas (LaTeX) --}}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
{{-- Estilos del módulo Flashcards (archivo índice con @import de sub-módulos) --}}
<link rel="stylesheet" href="{{ asset('css/views/flashcards.css') }}">
@endpush

{{-- ============================================================ --}}
{{-- ENCABEZADO MOBILE                                            --}}
{{-- ============================================================ --}}
@section('mobile-header')
<div class="mob-hdr">
    <div class="mob-hdr__content">
        <div class="mob-greet">Flashcards de Estudio 🧠</div>
        <div class="mob-sub">Mis mazos y repaso</div>
    </div>
</div>
@endsection

{{-- ============================================================ --}}
{{-- TOPBAR                                                        --}}
{{-- ============================================================ --}}
@section('topbar-content')
<div class="topbar-title">Flashcards de Estudio 🧠</div>
@endsection

{{-- ============================================================ --}}
{{-- CONTENIDO PRINCIPAL                                          --}}
{{-- ============================================================ --}}
@section('content')
<div class="fc-container">

    {{-- ========================================================== --}}
    {{-- SECCIÓN 1: VISTA DE MAZOS (DECKS)                          --}}
    {{-- ========================================================== --}}
    <section id="section-decks" class="fade-in" aria-label="Mis mazos de estudio">
        <header class="fc-header">
            <div class="fc-title-group">
                <h1>Tus Mazos de Estudio</h1>
                <p>Crea paquetes de preguntas y respuestas para entrenar tu memoria activa.</p>
            </div>

            <div class="fc-header-actions" role="group" aria-label="Acciones de mazos">
                {{-- Importar mazo JSON (dispara el input oculto vía data-action) --}}
                <button class="btn-create-deck btn-create-deck--secondary" data-action="trigger-import-selector">
                    <svg width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#import"></use></svg>
                    Importar (.json)
                </button>
                {{-- Input de archivo oculto para importación; change event delegado desde main.js --}}
                <input
                    type="file"
                    id="import-deck-file-input"
                    accept=".json"
                    class="visually-hidden"
                    data-action="import-deck-file"
                    aria-label="Seleccionar archivo JSON para importar mazo"
                >

                {{-- Crear mazo con IA --}}
                <button class="btn-create-deck btn-create-deck--ai" data-action="open-ai-deck-modal">
                    <svg width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#astroid"></use></svg>
                    Crear con IA
                </button>

                {{-- Crear mazo manualmente --}}
                <button class="btn-create-deck" data-action="open-create-deck-modal">
                    <svg width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#plus"></use></svg>
                    Nuevo Mazo
                </button>
            </div>
        </header>

        {{-- Contenedor dinámico: cargado y renderizado por ui/decks.js --}}
        <div id="decks-container" role="status" aria-live="polite" aria-label="Lista de mazos">
            <div class="decks-loader">Cargando tus mazos...</div>
        </div>
    </section>

    {{-- ========================================================== --}}
    {{-- SECCIÓN 2: ESTUDIO ACTIVO (CARRUSEL 3D / EXAMEN)           --}}
    {{-- ========================================================== --}}
    <section id="section-study" class="fade-in" hidden aria-label="Sesión de estudio activa">
        <div class="study-layout">

            {{-- Barra superior: botón atrás + contador de progreso --}}
            <div class="study-bar-header">
                <button class="btn-back-link" data-action="exit-study" aria-label="Volver a la lista de mazos">
                    <svg width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#chevron-left"></use></svg>
                    Volver a mazos
                </button>
                <div class="study-progress-info" id="study-progress-text" role="status" aria-live="polite">Tarjeta 0 de 0</div>
            </div>

            {{-- Barra de progreso --}}
            <div class="study-progress-container" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Progreso de la sesión">
                <div class="study-progress-bar" id="study-progress-bar"></div>
            </div>

            {{-- ──── MODO TARJETA (FLIP 3D) ──── --}}
            <div class="study-card-wrapper" id="card-mode-wrapper">
                <div
                    class="flip-card"
                    id="flip-card"
                    role="button"
                    tabindex="0"
                    aria-label="Tarjeta de estudio. Presiona para ver la respuesta."
                    data-action="flip-card"
                >
                    <div class="flip-card-inner" aria-live="polite">
                        {{-- FRENTE: PREGUNTA --}}
                        <div class="flip-card-front" aria-label="Pregunta">
                            <div class="card-side-tag-wrapper">
                                <span class="card-side-tag">Pregunta</span>
                            </div>
                            {{-- TTS: stopPropagation via data-action; no onclick --}}
                            <button
                                class="btn-card-tts"
                                data-action="speak-card-text"
                                data-target-id="card-question-text"
                                title="Escuchar pregunta"
                                aria-label="Leer pregunta en voz alta"
                            >
                                <svg width="15" height="15" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#volume-2"></use></svg>
                            </button>
                            <div class="card-text" id="card-question-text" aria-live="polite">¿Cargando pregunta?</div>
                            <div class="card-action-hint" aria-hidden="true">
                                <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#rotate-cw"></use></svg>
                                Clic para ver la respuesta
                                <kbd class="key-hint">Espacio</kbd>
                            </div>
                        </div>

                        {{-- REVERSO: RESPUESTA --}}
                        <div class="flip-card-back" aria-label="Respuesta">
                            <div class="card-side-tag-wrapper">
                                <span class="card-side-tag">Respuesta</span>
                            </div>
                            <button
                                class="btn-card-tts"
                                data-action="speak-card-text"
                                data-target-id="card-answer-text"
                                title="Escuchar respuesta"
                                aria-label="Leer respuesta en voz alta"
                            >
                                <svg width="15" height="15" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#volume-2"></use></svg>
                            </button>
                            <div class="card-text" id="card-answer-text" aria-live="polite">¿Cargando respuesta?</div>
                            <div class="card-study-stats" id="card-study-stats" aria-label="Historial de repasos de esta tarjeta">Sin repaso previo</div>
                            <div class="card-action-hint" aria-hidden="true">
                                <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#rotate-cw"></use></svg>
                                Clic para ver la pregunta
                                <kbd class="key-hint">Espacio</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- ──── MODO EXAMEN (OPCIÓN MÚLTIPLE) ──── --}}
            <div class="exam-card-wrapper" id="exam-mode-wrapper" hidden aria-label="Modo examen">
                <div class="summary-card">
                    <div>
                        <div class="exam-card-header">
                            <span class="card-side-tag card-side-tag--exam">Examen</span>
                        </div>
                        <div class="card-text" id="exam-question-text" aria-live="polite">¿Cargando pregunta?</div>
                    </div>

                    {{-- Opciones de respuesta inyectadas por study.js --}}
                    <div
                        id="exam-options-grid"
                        role="group"
                        aria-label="Opciones de respuesta"
                        aria-live="polite"
                    ></div>

                    {{-- Botón Continuar (visible con clase is-visible) --}}
                    <div class="exam-next-action-wrapper" id="exam-next-action-wrapper" aria-live="polite">
                        <button class="btn-create-deck" data-action="proceed-next-exam">
                            Continuar
                            <svg width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#arrow-right"></use></svg>
                        </button>
                    </div>
                </div>
            </div>

            {{-- ──── CONTROLES DE RESULTADO (flip) y HINT ──── --}}
            <div class="study-actions-overlap-container">
                {{-- Hint: visible antes de voltear --}}
                <div class="flip-instruction-hint" id="flip-hint-message" role="status" aria-live="polite">
                    💡 Haz clic o pulsa [Espacio] para revelarla antes de calificar.
                </div>

                {{-- Controles correcto/incorrecto: visibles post-volteo --}}
                <div
                    class="study-controls"
                    id="study-controls" role="group" aria-label="Calificar tarjeta"
                >
                    <button
                        class="btn-outcome btn-outcome-incorrect"
                        data-action="submit-incorrect"
                        aria-label="No lo sabía (marcar como incorrecto). Atajo: tecla 1 o flecha izquierda"
                    >
                        <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#circle-alert"></use></svg>
                        <span>No lo sé</span>
                        <kbd class="key-hint">1</kbd>
                        <kbd class="key-hint">←</kbd>
                    </button>
                    <button
                        class="btn-outcome btn-outcome-correct"
                        data-action="submit-correct"
                        aria-label="Lo sabía (marcar como correcto). Atajo: tecla 2 o flecha derecha"
                    >
                        <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#circle-check"></use></svg>
                        <span>Lo sé</span>
                        <kbd class="key-hint">2</kbd>
                        <kbd class="key-hint">→</kbd>
                    </button>
                </div>
            </div>

        </div>
    </section>

    {{-- ========================================================== --}}
    {{-- SECCIÓN 3: RESUMEN DE SESIÓN                               --}}
    {{-- ========================================================== --}}
    <section id="section-summary" class="fade-in" hidden aria-label="Resumen de la sesión de estudio">
        <div class="study-layout">
            <div class="summary-card">
                <div class="summary-icon-celebrate" aria-hidden="true">🎉</div>
                <h2 id="summary-title">¡Mazo Completado!</h2>
                <p>Has repasado todas las tarjetas disponibles en este mazo.</p>

                {{-- Progreso circular SVG --}}
                <div class="circular-progress-wrapper" role="img" aria-labelledby="summary-percentage-text">
                    <svg class="circular-progress" viewBox="0 0 150 150" aria-hidden="true">
                        <circle cx="75" cy="75" r="60" class="bg-circle"></circle>
                        <circle cx="75" cy="75" r="60" class="fg-circle" id="summary-circle-progress"></circle>
                    </svg>
                    <div class="percentage" id="summary-percentage-text" aria-live="polite">0%</div>
                </div>

                {{-- Estadísticas numéricas --}}
                <dl class="summary-stats-grid">
                    <div class="summary-stat-box">
                        <dt class="summary-stat-lbl">Correctas</dt>
                        <dd class="summary-stat-val val-correct" id="summary-stat-correct">0</dd>
                    </div>
                    <div class="summary-stat-box">
                        <dt class="summary-stat-lbl">Incorrectas</dt>
                        <dd class="summary-stat-val val-incorrect" id="summary-stat-incorrect">0</dd>
                    </div>
                    <div class="summary-stat-box">
                        <dt class="summary-stat-lbl">Repasadas</dt>
                        <dd class="summary-stat-val val-total" id="summary-stat-total">0</dd>
                    </div>
                </dl>

                {{-- Feedback textual según resultado --}}
                <div class="summary-feedback-box" id="summary-feedback-box" role="status" aria-live="polite">
                    <svg width="20" height="20" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#info"></use></svg>
                    <span id="summary-feedback-text">¡Buen trabajo! Sigue practicando para consolidar tus conocimientos.</span>
                </div>

                {{-- Acciones del resumen --}}
                <div class="summary-actions">
                    <button class="btn-summary-restart" data-action="restart-study">
                        Estudiar de nuevo
                    </button>
                    <button class="btn-summary-back" data-action="exit-summary-to-decks">
                        Volver a mis mazos
                    </button>
                </div>
            </div>
        </div>
    </section>

    {{-- ========================================================== --}}
    {{-- SECCIÓN 4: GESTIÓN DE TARJETAS (MANAGE)                    --}}
    {{-- ========================================================== --}}
    <section id="section-manage" class="fade-in" hidden aria-label="Gestión de tarjetas del mazo">
        <div class="manage-layout">
            <header class="fc-header">
                <div class="fc-title-group">
                    <button class="btn-back-link" data-action="exit-manage" aria-label="Volver a la lista de mazos">
                        <svg width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#chevron-left"></use></svg>
                        Volver a mazos
                    </button>
                    <h1 id="manage-deck-name">Gestionar Mazo</h1>
                    <p>Agrega o elimina preguntas y respuestas. Soporta Markdown y fórmulas KaTeX con <code>$E=mc^2$</code> o <code>$$x^2$$</code>.</p>
                </div>
            </header>

            <div class="manage-grid">
                {{-- ── Formulario de creación de tarjeta ── --}}
                <div class="manage-form-card">
                    <h3>Añadir Tarjeta</h3>
                    {{-- data-action="add-card-form" usado por el delegador de submit en main.js --}}
                    <form id="add-card-form" data-action="add-card-form" novalidate>
                        <div class="form-group">
                            <label class="form-group__label" for="card-input-question">Pregunta (Frente)</label>
                            <textarea
                                id="card-input-question"
                                class="fc-input"
                                placeholder="Escribe la pregunta... Usa $x^2$ para fórmulas."
                                required
                                aria-required="true"
                            ></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-group__label" for="card-input-answer">Respuesta (Reverso)</label>
                            <textarea
                                id="card-input-answer"
                                class="fc-input"
                                placeholder="Escribe la respuesta... Usa `código` para resaltar."
                                required
                                aria-required="true"
                            ></textarea>
                        </div>

                        {{-- Distractores para Modo Examen --}}
                        <div class="card-edit-form__distractors">
                            <div class="distractors-header-row">
                                <span class="distractors-header-row__label">Opciones incorrectas (Opcional)</span>
                                <button
                                    type="button"
                                    id="btn-suggest-distractors"
                                    class="btn-suggest-ai"
                                    data-action="suggest-distractors-new"
                                    aria-label="Sugerir opciones incorrectas con IA"
                                >
                                    <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#astroid"></use></svg>
                                    <span>Sugerir con IA</span>
                                </button>
                            </div>
                            <input type="text" id="card-input-d1" class="fc-input fc-input--distractor" placeholder="Opción incorrecta 1" aria-label="Opción incorrecta 1">
                            <input type="text" id="card-input-d2" class="fc-input fc-input--distractor" placeholder="Opción incorrecta 2" aria-label="Opción incorrecta 2">
                            <input type="text" id="card-input-d3" class="fc-input fc-input--distractor" placeholder="Opción incorrecta 3" aria-label="Opción incorrecta 3">
                        </div>

                        <button type="submit" class="btn-add-card">Guardar Tarjeta</button>
                    </form>
                </div>

                {{-- ── Lista de tarjetas del mazo ── --}}
                <div>
                    <h3>
                        Tarjetas del Mazo (<span id="manage-cards-count">0</span>)
                    </h3>
                    <div
                        class="cards-list-container"
                        id="manage-cards-list"
                        role="list"
                        aria-label="Lista de tarjetas del mazo"
                        aria-live="polite"
                    >
                        <div class="manage-loader">Cargando tarjetas...</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

</div>{{-- /.fc-container --}}


{{-- ============================================================ --}}
{{-- MODAL: NUEVO / EDITAR MAZO                                   --}}
{{-- ============================================================ --}}
<div
    class="fc-overlay"
    id="create-deck-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="deck-modal-title"
    aria-hidden="true"
>
    <div class="fc-modal-box">
        <div class="fc-modal-header">
            <div class="fc-modal-title" id="deck-modal-title">
                <svg width="18" height="18" aria-hidden="true" class="modal-icon-brand"><use href="{{ asset('assets/icons/sprite.svg') }}#cards"></use></svg>
                <span id="deck-modal-title-text">Nuevo Mazo de Estudio</span>
            </div>
            <button class="fc-modal-close" data-action="close-create-deck-modal" aria-label="Cerrar modal">
                <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#x"></use></svg>
            </button>
        </div>

        {{-- data-action="create-deck-form" delegado por main.js en el evento submit --}}
        <form id="create-deck-form" data-action="create-deck-form" novalidate>
            <input type="hidden" id="deck-edit-id" value="">
            <div class="fc-modal-body">
                <div class="form-group">
                    <label class="form-group__label" for="deck-input-name">Nombre del Mazo</label>
                    <input
                        type="text"
                        id="deck-input-name"
                        class="fc-input"
                        placeholder="Ej: Anatomía I, SQL Joins, Historia..."
                        required
                        aria-required="true"
                        autocomplete="off"
                    >
                </div>
                <div class="form-group">
                    <label class="form-group__label" for="deck-input-desc">Descripción (Opcional)</label>
                    <input
                        type="text"
                        id="deck-input-desc"
                        class="fc-input"
                        placeholder="Ej: Repaso examen segundo parcial..."
                        autocomplete="off"
                    >
                </div>
                <div class="form-group">
                    <label class="form-group__label" for="deck-select-category">Contenedor / Carpeta</label>
                    <select
                        id="deck-select-category"
                        class="fc-input"
                        data-action="deck-category-change"
                    >
                        <option value="General">General (Sin contenedor)</option>
                        <option value="__NEW__">+ Crear nuevo contenedor...</option>
                    </select>

                    {{-- Campo de nombre del nuevo contenedor (slide CSS Grid) --}}
                    <div class="new-category-wrapper" id="new-category-input-wrapper">
                        <div>
                            <div class="new-category-input">
                                <label class="form-group__label" for="deck-input-category">Nombre del nuevo contenedor</label>
                                <input
                                    type="text"
                                    id="deck-input-category"
                                    class="fc-input"
                                    placeholder="Ej: Programación, Matemáticas..."
                                    autocomplete="off"
                                >
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form-group__label" id="deck-color-label">Estilo / Color de Mazo</div>
                    {{-- Radiogroup accesible para selección de color --}}
                    <div
                        class="color-picker-grid"
                        id="color-picker-grid"
                        role="radiogroup"
                        aria-labelledby="deck-color-label"
                    >
                        <div class="color-option deck-color-indigo selected" data-color="indigo" role="radio" aria-checked="true"  tabindex="0"  aria-label="Índigo"></div>
                        <div class="color-option deck-color-emerald"         data-color="emerald" role="radio" aria-checked="false" tabindex="-1" aria-label="Esmeralda"></div>
                        <div class="color-option deck-color-rose"            data-color="rose"    role="radio" aria-checked="false" tabindex="-1" aria-label="Rosa"></div>
                        <div class="color-option deck-color-amber"           data-color="amber"   role="radio" aria-checked="false" tabindex="-1" aria-label="Ámbar"></div>
                        <div class="color-option deck-color-violet"          data-color="violet"  role="radio" aria-checked="false" tabindex="-1" aria-label="Violeta"></div>
                        <div class="color-option deck-color-cyan"            data-color="cyan"    role="radio" aria-checked="false" tabindex="-1" aria-label="Cian"></div>
                    </div>
                </div>
            </div>
            <div class="fc-modal-footer">
                <button type="button" class="btn-modal-cancel" data-action="close-create-deck-modal">Cancelar</button>
                <button type="submit" class="btn-modal-save" id="btn-deck-submit">Crear Mazo</button>
            </div>
        </form>
    </div>
</div>


{{-- ============================================================ --}}
{{-- MODAL: GENERAR MAZO CON IA                                   --}}
{{-- ============================================================ --}}
<div
    class="fc-overlay"
    id="ai-deck-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="ai-deck-modal-title"
    aria-hidden="true"
>
    <div class="fc-modal-box">
        <div class="fc-modal-header">
            <div class="fc-modal-title" id="ai-deck-modal-title">
                <svg width="18" height="18" aria-hidden="true" class="modal-icon-brand"><use href="{{ asset('assets/icons/sprite.svg') }}#astroid"></use></svg>
                <span>Generar Mazo con IA</span>
            </div>
            <button class="fc-modal-close" data-action="close-ai-deck-modal" aria-label="Cerrar modal de IA">
                <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#x"></use></svg>
            </button>
        </div>

        {{-- data-action="ai-deck-form" delegado por main.js --}}
        <form id="ai-deck-form" data-action="ai-deck-form" enctype="multipart/form-data" novalidate>
            <div class="fc-modal-body">
                <p class="ai-modal-description">
                    Sube un archivo de estudio (<strong>PDF, Word, PowerPoint, Texto, Markdown o Imagen</strong>) y nuestra IA analizará el contenido para generar automáticamente un mazo completo de preguntas y respuestas.
                </p>

                <div class="form-group">
                    {{-- Etiqueta con botón de ayuda para tooltip OCR --}}
                    <div class="ai-file-label-row">
                        <label class="form-group__label" for="ai-deck-file">
                            Seleccionar documento o imagen (.pdf, .docx, .pptx, .txt, .md, .jpg, .png)
                        </label>
                        {{-- Botón de ayuda con tooltip CSS (no JS) --}}
                        <div class="ai-help-btn-wrapper">
                            <button
                                type="button"
                                id="btn-ai-help"
                                class="btn-ai-help-icon"
                                data-action="toggle-ai-help-tooltip"
                                aria-label="Información sobre documentos escaneados"
                                aria-expanded="false"
                                aria-controls="ai-help-tooltip-content"
                            >
                                <svg width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#circle-question-mark"></use></svg>
                            </button>
                            <div id="ai-help-tooltip-content" class="ai-help-tooltip-content" role="tooltip">
                                <strong class="ai-help-tooltip-content__heading">💡 Aviso sobre OCR</strong>
                                Asegúrate de subir documentos con texto seleccionable. Si tus apuntes son fotos o PDF/PPTX escaneados, súbelos en <strong>formato de imagen (JPG/PNG)</strong> para que la IA pueda procesarlos correctamente.
                            </div>
                        </div>
                    </div>
                    <input
                        type="file"
                        id="ai-deck-file"
                        name="file"
                        accept=".pdf,.docx,.pptx,.txt,.md,.jpg,.jpeg,.png"
                        required
                        aria-required="true"
                        class="fc-input fc-input--file"
                    >
                </div>

                <div class="form-group">
                    <label class="form-group__label" for="ai-deck-cards-count">Cantidad de flashcards a generar</label>
                    <select id="ai-deck-cards-count" name="cantidad" class="fc-select">
                        <option value="5">5 tarjetas (Rápido)</option>
                        <option value="10" selected>10 tarjetas (Recomendado)</option>
                        <option value="15">15 tarjetas (Completo)</option>
                        <option value="20">20 tarjetas (Extenso)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-group__label" for="ai-deck-select-category">Contenedor / Carpeta de destino</label>
                    <select
                        id="ai-deck-select-category"
                        class="fc-input"
                        data-action="ai-deck-category-change"
                    >
                        <option value="__AUTO__">Auto-detectar con IA ✨</option>
                        <option value="General">General (Sin contenedor)</option>
                    </select>

                    {{-- Campo de nuevo contenedor (slide CSS Grid) --}}
                    <div class="new-category-wrapper" id="ai-new-category-input-wrapper">
                        <div>
                            <div class="new-category-input">
                                <label class="form-group__label" for="ai-deck-input-category">Nombre del nuevo contenedor</label>
                                <input
                                    type="text"
                                    id="ai-deck-input-category"
                                    class="fc-input"
                                    placeholder="Ej: Programación, Anatomía..."
                                    autocomplete="off"
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="fc-modal-footer">
                <button type="button" class="btn-modal-cancel" data-action="close-ai-deck-modal">Cancelar</button>
                <button type="submit" class="btn-modal-save btn-modal-save--ai" id="btn-ai-submit">Generar Mazo</button>
            </div>
        </form>
    </div>
</div>


{{-- ============================================================ --}}
{{-- OVERLAY: CARGANDO GENERACIÓN IA                              --}}
{{-- ============================================================ --}}
<div
    class="fc-overlay ai-loading-overlay"
    id="ai-loading-overlay"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="ai-loading-title"
    aria-describedby="ai-loading-text"
    aria-hidden="true"
    aria-live="assertive"
>
    <div class="ai-loading-content">
        <div class="ai-loader-spinner" aria-hidden="true"></div>
        <h3 id="ai-loading-title">Procesando archivo...</h3>
        <p id="ai-loading-text">La IA de Cursus está analizando tu documento para generar las flashcards.</p>
    </div>
</div>


{{-- ============================================================ --}}
{{-- MODAL: CONFIRMACIÓN PERSONALIZADA (Promise-based)            --}}
{{-- ============================================================ --}}
<div
    class="fc-overlay"
    id="custom-confirm-modal"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title-text"
    aria-describedby="confirm-modal-body-text"
    aria-hidden="true"
>
    <div class="fc-modal-box fc-modal-box--confirm">
        <div class="fc-modal-header fc-modal-header--centered">
            <div class="confirm-icon-wrapper">
                <div class="confirm-icon" id="confirm-modal-icon-wrapper">
                    <svg id="confirm-modal-icon" width="24" height="24" aria-hidden="true"></svg>
                </div>
            </div>
            <p id="confirm-modal-title-text" class="confirm-modal-title">Confirmar acción</p>
        </div>
        <div class="fc-modal-body fc-modal-body--centered">
            <p id="confirm-modal-body-text"></p>
        </div>
        <div class="fc-modal-footer">
            <button
                type="button"
                class="btn-modal-cancel"
                id="btn-confirm-cancel"
                data-action="confirm-cancel"
            >Cancelar</button>
            <button
                type="button"
                class="btn-modal-save"
                id="btn-confirm-accept"
                data-action="confirm-accept"
            >Aceptar</button>
        </div>
    </div>
</div>


{{-- ============================================================ --}}
{{-- MODAL: SELECCIONAR MODO DE ESTUDIO                           --}}
{{-- ============================================================ --}}
<div
    class="fc-overlay"
    id="study-mode-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="study-mode-modal-title"
    aria-hidden="true"
>
    <div class="fc-modal-box fc-modal-box--study-mode">
        <div class="fc-modal-header">
            <div class="fc-modal-title" id="study-mode-modal-title">
                <svg width="18" height="18" aria-hidden="true" class="modal-icon-brand"><use href="{{ asset('assets/icons/sprite.svg') }}#book-open"></use></svg>
                Modo de Estudio
            </div>
            <button class="fc-modal-close" data-action="close-study-mode-modal" aria-label="Cerrar selector de modo de estudio">
                <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#x"></use></svg>
            </button>
        </div>

        <div class="fc-modal-body">
            <p class="study-mode-intro">Elige cómo quieres repasar las tarjetas de este mazo.</p>

            {{-- Radiogroup de modo de estudio --}}
            <fieldset class="study-mode-options" aria-label="Modo de estudio">
                <legend class="visually-hidden">Seleccionar modo de estudio</legend>

                <label
                    for="mode-choice-all"
                    class="study-mode-label study-mode-label--active"
                    id="label-mode-all"
                >
                    <input type="radio" id="mode-choice-all" name="study-mode-choice" value="all" checked>
                    <div>
                        <strong class="study-mode-label__name">Estudiar Todo</strong>
                        <span class="study-mode-label__desc">Repasa todas las tarjetas del mazo mezcladas aleatoriamente.</span>
                    </div>
                </label>

                <label
                    for="mode-choice-exam"
                    class="study-mode-label"
                    id="label-mode-exam"
                >
                    <input type="radio" id="mode-choice-exam" name="study-mode-choice" value="exam">
                    <div>
                        <strong class="study-mode-label__name">Modo Examen (Quizlet-style)</strong>
                        <span class="study-mode-label__desc">Cuestionario de opción múltiple de 4 opciones generado automáticamente.</span>
                    </div>
                </label>
            </fieldset>

            {{-- Configuración de preguntas para Modo Examen (slide CSS Grid) --}}
            <div class="exam-quantity-wrapper" id="exam-quantity-wrapper">
                <div>
                    <div class="exam-quantity-inner">
                        <label class="form-group__label" for="exam-question-count">Cantidad de preguntas en el cuestionario</label>
                        <select id="exam-question-count" class="fc-select">
                            <option value="all" selected>Todas las tarjetas del mazo</option>
                            <option value="5">5 preguntas</option>
                            <option value="10">10 preguntas</option>
                            <option value="15">15 preguntas</option>
                            <option value="20">20 preguntas</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="fc-modal-footer">
            <button type="button" class="btn-modal-cancel" data-action="close-study-mode-modal">Cancelar</button>
            <button type="button" class="btn-modal-save" data-action="confirm-study-start">Iniciar Estudio</button>
        </div>
    </div>
</div>

@endsection


{{-- ============================================================ --}}
{{-- SCRIPTS                                                       --}}
{{-- ============================================================ --}}
@push('scripts')
{{-- KaTeX: compilación de fórmulas matemáticas en el cliente --}}
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
{{-- Canvas Confetti: celebración al completar el mazo --}}
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
{{-- Módulo principal Flashcards (ES6 module — orquestador, no script global) --}}
<script type="module" src="{{ asset('js/views/flashcards/main.js') }}"></script>
@endpush


