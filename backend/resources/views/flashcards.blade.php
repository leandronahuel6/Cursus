@extends('layouts.app')

@section('title', 'Cursus - Flashcards de Estudio')

@push('styles')
<!-- KaTeX stylesheet para renderizado de ecuaciones matemáticas -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<link rel="stylesheet" href="{{ asset('css/views/flashcards.css') }}">
@endpush

@section('mobile-header')
<div class="mob-hdr">
  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
    <div style="display: flex; flex-direction: column;">
      <div class="mob-greet">Flashcards de Estudio 🧠</div>
      <div class="mob-sub">Mis mazos y repaso</div>
    </div>
  </div>
</div>
@endsection

@section('topbar-content')
    <div class="topbar-title">Flashcards de Estudio</div>
@endsection

@section('content')
<div class="fc-container">

    <!-- ==================== SECCIÓN 1: VISTA DE MAZOS (DECKS) ==================== -->
    <div id="section-decks" class="fade-in">
        <div class="fc-header">
            <div class="fc-title-group">
                <h1>Tus Mazos de Estudio</h1>
                <p>Crea paquetes de preguntas y respuestas para entrenar tu memoria activa.</p>
            </div>
            <div class="fc-header-actions">
                <button class="btn-create-deck" style="background: var(--surface); color: var(--t1); border: 1px solid var(--border); box-shadow: var(--sh);" onclick="triggerImportSelector()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M14 12l-4 4-4-4M10 4v12"/></svg>
                    Importar (.json)
                </button>
                <input type="file" id="import-deck-file-input" style="display: none;" accept=".json" onchange="handleImportDeckFile(event)">
                
                <button class="btn-create-deck" style="background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; border: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);" onclick="openAIDeckModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    Crear con IA ✨
                </button>

                <button class="btn-create-deck" onclick="openCreateDeckModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                    Nuevo Mazo
                </button>
            </div>
        </div>

        <div id="decks-container">
            <!-- Cargado de mazos dinámicamente agrupados por categoría -->
            <div style="text-align: center; padding: 3rem; color: var(--t3);" id="decks-loader">
                Cargando tus mazos...
            </div>
        </div>
    </div>


    <!-- ==================== SECCIÓN 2: ESTUDIO ACTIVO (CARRUSEL 3D & EXAMEN) ==================== -->
    <div id="section-study" class="fade-in" style="display: none;">
        <div class="study-layout">
            <div class="study-bar-header">
                <button class="btn-back-link" onclick="exitStudySession()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Volver a mazos
                </button>
                <div class="study-progress-info" id="study-progress-text">Tarjeta 0 de 0</div>
            </div>

            <div class="study-progress-container">
                <div class="study-progress-bar" id="study-progress-bar"></div>
            </div>

            <!-- Modo Tarjeta (3D Flip) -->
            <div class="study-card-wrapper" id="card-mode-wrapper">
                <div class="flip-card" id="flip-card" onclick="flipStudyCard()">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div style="position: absolute; top: 1.25rem; left: 1.5rem; display: flex; gap: 0.5rem; align-items: center;">
                                <span class="card-side-tag" style="position:static;">Pregunta</span>
                            </div>
                            <button class="btn-card-tts" onclick="speakCardText(event, 'card-question-text')" title="Escuchar pregunta">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                            </button>
                            <div class="card-text" id="card-question-text">¿Cargando pregunta?</div>
                            <div class="card-action-hint">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                Clic para ver la respuesta (o pulsa [Espacio])
                            </div>
                        </div>
                        <div class="flip-card-back">
                            <div style="position: absolute; top: 1.25rem; left: 1.5rem; display: flex; gap: 0.5rem; align-items: center;">
                                <span class="card-side-tag" style="position:static;">Respuesta</span>
                            </div>
                            <button class="btn-card-tts" onclick="speakCardText(event, 'card-answer-text')" title="Escuchar respuesta">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                            </button>
                            <div class="card-text" id="card-answer-text">¿Cargando respuesta?</div>
                            <div class="card-study-stats" id="card-study-stats">Sin repaso previo</div>
                            <div class="card-action-hint">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                Clic para ver la pregunta
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modo Examen (Múltiple Opción estilo Quizlet) -->
            <div class="exam-card-wrapper" id="exam-mode-wrapper" style="display: none; width: 100%; min-height: 380px; margin-bottom: 2rem;">
                <div class="summary-card" style="padding: 2.25rem; text-align: left; box-shadow: var(--sh-md); display: flex; flex-direction: column; justify-content: space-between; min-height: 380px; border-radius: var(--r-lg);">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <span class="card-side-tag" style="position:static; background: var(--brand-light); color: var(--brand); border-color: var(--brand-dim);">Examen</span>
                        </div>
                        <div class="card-text" id="exam-question-text" style="font-size: 1.25rem; margin-bottom: 1.5rem; max-height: 120px; overflow-y: auto; width: 100%; padding: 0;">¿Cargando pregunta?</div>
                    </div>
                    
                    <div id="exam-options-grid">
                        <!-- Botones inyectados dinámicamente -->
                    </div>
                    
                    <div style="display: none; justify-content: flex-end; margin-top: 1.5rem;" id="exam-next-action-wrapper">
                        <button class="btn-create-deck" style="padding: 0.65rem 1.25rem; font-size: 0.85rem;" onclick="proceedToNextExamCard()">
                            Continuar
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="flip-instruction-hint" id="flip-hint-message">
                💡 Haz clic o pulsa [Espacio] para revelarla antes de calificar.
            </div>

            <div class="study-controls" id="study-controls">
                <button class="btn-outcome btn-outcome-incorrect" onclick="submitCardResult('incorrecto')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                    <span>No lo sé</span>
                    <kbd class="key-hint">1</kbd>
                    <kbd class="key-hint">←</kbd>
                </button>
                <button class="btn-outcome btn-outcome-correct" onclick="submitCardResult('correcto')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
                    <span>Lo sé</span>
                    <kbd class="key-hint">2</kbd>
                    <kbd class="key-hint">→</kbd>
                </button>
            </div>
        </div>
    </div>


    <!-- ==================== SECCIÓN 3: RESUMEN DE SESIÓN ==================== -->
    <div id="section-summary" class="fade-in" style="display: none;">
        <div class="study-layout">
            <div class="summary-card">
                <div class="summary-icon-celebrate">🎉</div>
                <h2 id="summary-title">¡Mazo Completado!</h2>
                <p>Has repasado todas las tarjetas disponibles en este mazo.</p>

                <div class="circular-progress-wrapper">
                    <svg class="circular-progress">
                        <circle cx="75" cy="75" r="60" class="bg-circle"></circle>
                        <circle cx="75" cy="75" r="60" class="fg-circle" id="summary-circle-progress"></circle>
                    </svg>
                    <div class="percentage" id="summary-percentage-text">0%</div>
                </div>

                <div class="summary-stats-grid">
                    <div class="summary-stat-box">
                        <div class="summary-stat-val val-correct" id="summary-stat-correct">0</div>
                        <div class="summary-stat-lbl">Correctas</div>
                    </div>
                    <div class="summary-stat-box">
                        <div class="summary-stat-val val-incorrect" id="summary-stat-incorrect">0</div>
                        <div class="summary-stat-lbl">Incorrectas</div>
                    </div>
                    <div class="summary-stat-box">
                        <div class="summary-stat-val val-total" id="summary-stat-total">0</div>
                        <div class="summary-stat-lbl">Repasadas</div>
                    </div>
                </div>

                <div class="summary-feedback-box" id="summary-feedback-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    <span id="summary-feedback-text">¡Buen trabajo! Sigue practicando para consolidar tus conocimientos en este tema.</span>
                </div>

                <div class="summary-actions">
                    <button class="btn-summary-restart" onclick="restartStudySession()">
                        Estudiar de nuevo
                    </button>
                    <button class="btn-summary-back" onclick="exitSummaryToDecks()">
                        Volver a mis mazos
                    </button>
                </div>
            </div>
        </div>
    </div>


    <!-- ==================== SECCIÓN 4: GESTIÓN DE TARJETAS ==================== -->
    <div id="section-manage" class="fade-in" style="display: none;">
        <div class="manage-layout">
            <div class="fc-header" style="margin-bottom: 1.5rem;">
                <div class="fc-title-group">
                    <button class="btn-back-link" onclick="exitManageSection()" style="margin-bottom: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        Volver a mazos
                    </button>
                    <h1 id="manage-deck-name">Gestionar Mazo</h1>
                    <p>Agrega o elimina preguntas y respuestas rápidas. Soporta Markdown y fórmulas KaTeX con `$E=mc^2$` o `$$x^2$$`.</p>
                </div>
            </div>

            <div class="manage-grid">
                <!-- Formulario -->
                <div class="manage-form-card">
                    <h3>Añadir Tarjeta</h3>
                    <form id="add-card-form" onsubmit="handleCreateCard(event)">
                        <div class="form-group">
                            <label for="card-input-question">Pregunta (Frente)</label>
                            <textarea id="card-input-question" class="fc-input fc-textarea" placeholder="Escribe la pregunta... Usa $x^2$ para fórmulas." required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="card-input-answer">Respuesta (Reverso)</label>
                            <textarea id="card-input-answer" class="fc-input fc-textarea" placeholder="Escribe la respuesta... Usa `código` para resaltar." required></textarea>
                        </div>
                        <div style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; margin-bottom: 1.25rem;">
                            <div class="distractors-header-row">
                                <span style="font-size:0.85rem; font-weight:600; color:var(--t2);">Opciones incorrectas (Opcional)</span>
                                <button type="button" id="btn-suggest-distractors" onclick="handleSuggestDistractors()" style="background:var(--border-light); border:1px solid var(--border); border-radius:var(--r-sm); padding:0.25rem 0.6rem; font-size:0.75rem; font-weight:600; color:var(--brand); cursor:pointer; display:flex; align-items:center; gap:0.25rem; transition:all 0.2s;">
                                    <span>Sugerir con IA ✨</span>
                                </button>
                            </div>
                            <div class="form-group" style="margin-bottom:0.5rem;">
                                <input type="text" id="card-input-d1" class="fc-input" placeholder="Opción incorrecta 1" style="font-size:0.8rem; padding:0.5rem;">
                            </div>
                            <div class="form-group" style="margin-bottom:0.5rem;">
                                <input type="text" id="card-input-d2" class="fc-input" placeholder="Opción incorrecta 2" style="font-size:0.8rem; padding:0.5rem;">
                            </div>
                            <div class="form-group" style="margin-bottom:0.5rem;">
                                <input type="text" id="card-input-d3" class="fc-input" placeholder="Opción incorrecta 3" style="font-size:0.8rem; padding:0.5rem;">
                            </div>
                        </div>
                        <button type="submit" class="btn-add-card">Guardar Tarjeta</button>
                    </form>
                </div>

                <!-- Lista de tarjetas -->
                <div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem 0; color: var(--t1);">
                        Tarjetas del Mazo (<span id="manage-cards-count">0</span>)
                    </h3>
                    <div class="cards-list-container" id="manage-cards-list">
                        <!-- Carga dinámica con AJAX -->
                        <div style="text-align: center; padding: 2rem; color: var(--t3);">
                            Cargando tarjetas...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>

<!-- ==================== OVERLAY MODAL: NUEVO/EDITAR MAZO ==================== -->
<div class="fc-overlay" id="create-deck-modal" onclick="closeCreateDeckModalOnOverlay(event)">
    <div class="fc-modal-box">
        <div class="fc-modal-header">
            <div class="fc-modal-title" id="deck-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                <span id="deck-modal-title-text">Nuevo Mazo de Estudio</span>
            </div>
            <button class="fc-modal-close" onclick="closeCreateDeckModal()">✕</button>
        </div>
        <form id="create-deck-form" onsubmit="handleCreateDeck(event)">
            <input type="hidden" id="deck-edit-id" value="">
            <div class="fc-modal-body">
                <div class="form-group">
                    <label for="deck-input-name">Nombre del Mazo</label>
                    <input type="text" id="deck-input-name" class="fc-input" placeholder="Ej: Anatomía I, SQL Joins, Historia..." required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="deck-input-desc">Descripción (Opcional)</label>
                    <input type="text" id="deck-input-desc" class="fc-input" placeholder="Ej: Repaso examen segundo parcial..." autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="deck-select-category">Contenedor / Carpeta</label>
                    <select id="deck-select-category" class="fc-input" onchange="handleDeckSelectCategoryChange()">
                        <option value="General">General (Sin contenedor)</option>
                        <option value="__NEW__">+ Crear nuevo contenedor...</option>
                    </select>
                    <div id="new-category-input-wrapper" style="display: none; margin-top: 0.75rem;">
                        <label for="deck-input-category" style="font-size: 0.8rem; opacity: 0.85; margin-bottom: 0.25rem; display: block;">Nombre del nuevo contenedor</label>
                        <input type="text" id="deck-input-category" class="fc-input" placeholder="Ej: Programación, Matemáticas, Legislación..." autocomplete="off">
                    </div>
                </div>
                <div class="form-group">
                    <label>Estilo / Color de Mazo</label>
                    <div class="color-picker-grid" id="color-picker-grid">
                        <div class="color-option deck-color-indigo selected" data-color="indigo"></div>
                        <div class="color-option deck-color-emerald" data-color="emerald"></div>
                        <div class="color-option deck-color-rose" data-color="rose"></div>
                        <div class="color-option deck-color-amber" data-color="amber"></div>
                        <div class="color-option deck-color-violet" data-color="violet"></div>
                        <div class="color-option deck-color-cyan" data-color="cyan"></div>
                    </div>
                </div>
            </div>
            <div class="fc-modal-footer">
                <button type="button" class="btn-modal-cancel" onclick="closeCreateDeckModal()">Cancelar</button>
                <button type="submit" class="btn-modal-save" id="btn-deck-submit">Crear Mazo</button>
            </div>
        </form>
    </div>
</div>

<!-- ==================== OVERLAY MODAL: CREAR MAZO CON IA ==================== -->
<div class="fc-overlay" id="ai-deck-modal" onclick="closeAIDeckModalOnOverlay(event)">
    <div class="fc-modal-box" style="max-width: 440px;">
        <div class="fc-modal-header">
            <div class="fc-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                <span>Generar Mazo con IA ✨</span>
            </div>
            <button class="fc-modal-close" onclick="closeAIDeckModal()">✕</button>
        </div>
        <form id="ai-deck-form" onsubmit="handleAICreateDeck(event)" enctype="multipart/form-data">
            <div class="fc-modal-body">
                <p style="font-size: 0.85rem; color: var(--t3); margin: 0 0 1.2rem 0; line-height: 1.45;">
                    Sube un archivo de estudio (**PDF, Word, PowerPoint, Texto, Markdown o Imagen**) y nuestra IA analizará el contenido para extraer y generar automáticamente un mazo completo de preguntas y respuestas.
                </p>
                <div class="form-group">
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem;">
                        <label for="ai-deck-file" style="font-size: 0.85rem; font-weight: 600; color: var(--t2); margin: 0;">Seleccionar documento o imagen (.pdf, .docx, .pptx, .txt, .md, .jpg, .png)</label>
                        <div class="ai-help-tooltip-container" style="position: relative; display: inline-flex; align-items: center;">
                            <button type="button" id="btn-ai-help" onclick="toggleAIHelpTooltip(event)" aria-label="Información sobre documentos escaneados" style="background: none; border: none; padding: 0; cursor: pointer; color: var(--brand); display: flex; align-items: center; justify-content: center; opacity: 0.8; transition: opacity 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><use href="/assets/icons/sprite.svg#circle-question-mark"></use></svg>
                            </button>
                            <div id="ai-help-tooltip-content" class="ai-help-tooltip-content" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(5px); margin-bottom: 8px; width: 280px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-sm); padding: 0.75rem; font-size: 0.75rem; color: var(--t1); line-height: 1.4; box-shadow: var(--sh-md); opacity: 0; visibility: hidden; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); z-index: 2000; text-align: left; backdrop-filter: blur(8px);">
                                <strong style="display: block; margin-bottom: 0.25rem; color: var(--brand);">💡 Aviso sobre OCR</strong>
                                Asegúrate de subir documentos con texto seleccionable. Si tus apuntes son fotos o PDF/PPTX escaneados, por favor súbelos en <strong>formato de imagen (JPG/PNG)</strong> para que la IA pueda procesarlos correctamente.
                            </div>
                        </div>
                    </div>
                    <input type="file" id="ai-deck-file" name="file" accept=".pdf,.docx,.pptx,.txt,.md,.jpg,.jpeg,.png" required style="width: 100%; padding: 0.6rem; border: 2px dashed var(--border); border-radius: var(--r-sm); background: var(--border-light); font-size: 0.85rem; outline: none; cursor: pointer;">
                </div>
                <div class="form-group" style="margin-top: 1.25rem;">
                    <label for="ai-deck-cards-count" style="font-size: 0.85rem; font-weight: 600; color: var(--t2); display: block; margin-bottom: 0.4rem;">Cantidad de flashcards a generar</label>
                    <select id="ai-deck-cards-count" name="cantidad" class="fc-select">
                        <option value="5">5 tarjetas (Rápido)</option>
                        <option value="10" selected>10 tarjetas (Recomendado)</option>
                        <option value="15">15 tarjetas (Completo)</option>
                        <option value="20">20 tarjetas (Extenso)</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top: 1.25rem;">
                    <label for="ai-deck-select-category" style="font-size: 0.85rem; font-weight: 600; color: var(--t2); display: block; margin-bottom: 0.4rem;">Contenedor / Carpeta de destino</label>
                    <select id="ai-deck-select-category" class="fc-input" onchange="handleAIDeckSelectCategoryChange()" style="font-size: 0.85rem;">
                        <option value="__AUTO__">Auto-detectar con IA ✨</option>
                        <option value="General">General (Sin contenedor)</option>
                    </select>
                    <div id="ai-new-category-input-wrapper" style="display: none; margin-top: 0.75rem;">
                        <label for="ai-deck-input-category" style="font-size: 0.8rem; opacity: 0.85; margin-bottom: 0.25rem; display: block;">Nombre del nuevo contenedor</label>
                        <input type="text" id="ai-deck-input-category" class="fc-input" placeholder="Ej: Programación, Anatomía..." autocomplete="off">
                    </div>
                </div>
            </div>
            <div class="fc-modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; background: var(--border-light);">
                <button type="button" class="btn-modal-cancel" onclick="closeAIDeckModal()">Cancelar</button>
                <button type="submit" class="btn-modal-save" id="btn-ai-submit" style="background: linear-gradient(135deg, #4f46e5, #06b6d4);">Generar Mazo</button>
            </div>
        </form>
    </div>
</div>

<!-- ==================== OVERLAY: CARGANDO GENERACIÓN IA ==================== -->
<div class="fc-overlay" id="ai-loading-overlay" style="display: none; align-items: center; justify-content: center; z-index: 2000; background: rgba(11, 15, 25, 0.85); backdrop-filter: blur(8px);">
    <div style="text-align: center; color: white; max-width: 320px; padding: 2rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--r-lg); box-shadow: var(--sh-md);">
        <div class="ai-loader-spinner" style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #06b6d4; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 0.5rem;" id="ai-loading-title">Procesando archivo...</h3>
        <p style="font-size: 13px; color: var(--tm); line-height: 1.45;" id="ai-loading-text">La IA de Cursus está analizando tu documento para generar las flashcards.</p>
    </div>
</div>

<!-- ==================== OVERLAY MODAL: CONFIRMACIÓN PERSONALIZADA ==================== -->
<div class="fc-overlay" id="custom-confirm-modal" style="display: none; align-items: center; justify-content: center; z-index: 3000;">
    <div class="fc-modal-box" style="max-width: 400px; transform: scale(0.9); opacity: 0; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <div class="fc-modal-header" style="border-bottom: none; padding: 1.5rem 1.5rem 0.5rem 1.5rem;">
            <div class="fc-modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--t1); display: flex; align-items: center; gap: 0.6rem;">
                <span id="confirm-modal-icon-container"></span>
                <span id="confirm-modal-title-text">Confirmar acción</span>
            </div>
        </div>
        <div class="fc-modal-body" style="padding: 0.5rem 1.5rem 1.2rem 1.5rem;">
            <p id="confirm-modal-body-text" style="font-size: 0.88rem; color: var(--t3); margin: 0; line-height: 1.5;"></p>
        </div>
        <div class="fc-modal-footer" style="background: var(--border-light); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--border-light);">
            <button type="button" class="btn-modal-cancel" id="btn-confirm-cancel" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 600;">Cancelar</button>
            <button type="button" class="btn-modal-save" id="btn-confirm-accept" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: var(--r-sm); cursor: pointer; transition: all 0.2s;">Aceptar</button>
        </div>
    </div>
</div>

<!-- ==================== OVERLAY MODAL: SELECCIONAR MODO DE ESTUDIO ==================== -->
<div class="fc-overlay" id="study-mode-modal" onclick="closeStudyModeModalOnOverlay(event)">
    <div class="fc-modal-box" style="max-width: 420px;">
        <div class="fc-modal-header">
            <div class="fc-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Modo de Estudio
            </div>
            <button class="fc-modal-close" onclick="closeStudyModeModal()">✕</button>
        </div>
        <div class="fc-modal-body">
            <p style="font-size: 0.9rem; color: var(--t3); margin: 0 0 1.25rem 0;">Elige cómo quieres repasar las tarjetas de este mazo.</p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <label style="display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.85rem; border: 1px solid var(--brand); border-radius: var(--r); cursor: pointer; background: var(--border-light); transition: all 0.2s;" id="label-mode-all">
                    <input type="radio" name="study-mode-choice" value="all" checked style="margin-top: 0.25rem;">
                    <div>
                        <strong style="display: block; font-size: 0.9rem; color: var(--t1); margin-bottom: 0.15rem;">Estudiar Todo</strong>
                        <span style="font-size: 0.8rem; color: var(--t3);">Repasa todas las tarjetas del mazo mezcladas aleatoriamente.</span>
                    </div>
                </label>


                <label style="display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.85rem; border: 1px solid var(--border); border-radius: var(--r); cursor: pointer; transition: all 0.2s;" id="label-mode-exam">
                    <input type="radio" name="study-mode-choice" value="exam" style="margin-top: 0.25rem;">
                    <div>
                        <strong style="display: block; font-size: 0.9rem; color: var(--t1); margin-bottom: 0.15rem;">Modo Examen (Quizlet-style)</strong>
                        <span style="font-size: 0.8rem; color: var(--t3);">Cuestionario de opción múltiple de 4 opciones generado automáticamente.</span>
                    </div>
                </label>
            </div>

            <!-- Configuración de preguntas para Modo Examen -->
            <div id="exam-quantity-wrapper" style="display: none; margin-top: 1.25rem; padding: 0.85rem; border: 1px solid var(--border); border-radius: var(--r); background: var(--border-light);">
                <label for="exam-question-count" style="font-size: 0.85rem; font-weight: 600; color: var(--t2); display: block; margin-bottom: 0.4rem;">Cantidad de preguntas en el cuestionario</label>
                <select id="exam-question-count" class="fc-select">
                    <option value="all" selected>Todas las tarjetas del mazo</option>
                    <option value="5">5 preguntas</option>
                    <option value="10">10 preguntas</option>
                    <option value="15">15 preguntas</option>
                    <option value="20">20 preguntas</option>
                </select>
            </div>
        </div>
        <div class="fc-modal-footer">
            <button type="button" class="btn-modal-cancel" onclick="closeStudyModeModal()">Cancelar</button>
            <button type="button" class="btn-modal-save" onclick="confirmStudySessionStart()">Iniciar Estudio</button>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<!-- KaTeX JavaScript para compilar fórmulas matemáticas en el cliente -->
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
<!-- Canvas Confetti para celebrar al terminar el mazo -->
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
<script src="{{ asset('js/views/flashcards.js') }}"></script>
@endpush
