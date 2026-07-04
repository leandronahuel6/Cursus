@extends('layouts.app')

@section('title', 'Cursus - Área de Concentración')

@push('styles')
  <link rel="stylesheet" href="{{ asset('css/views/area-estudio.css') }}?v={{ filemtime(public_path('css/views/area-estudio.css')) }}">
  <link rel="stylesheet" href="{{ asset('css/views/area-estudio-focus.css') }}?v={{ filemtime(public_path('css/views/area-estudio-focus.css')) }}">
@endpush

@section('mobile-header')
<div class="mob-hdr">
  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
    <div style="display: flex; flex-direction: column;">
      <div class="mob-greet">Área de Estudio 🕑</div>
      <div class="mob-sub">
        <span>Gestión de tiempo y tareas</span>
        <span id="mob-materia-name" style="display: none;">—</span>
        <span class="badge b-reg" id="mob-materia-badge" style="display: none;">Regular</span>
        <span id="mob-materia-meta" style="display: none;">Cargando...</span>
      </div>
    </div>
  </div>
</div>
@endsection

@section('mobile-header-actions')
  <button class="btn-focus-mode-trigger btn-focus-mobile-hdr" onclick="window.enterFocusMode()" title="Entrar a Modo Concentración">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>
    <span>Concentración</span>
  </button>
@endsection

@section('topbar-content')
  <div class="topbar-title">Área de Estudio 🕑</div>
  <div class="tb-right">
    <button class="btn-focus-mode-trigger" onclick="window.enterFocusMode()" title="Entrar a Modo Concentración a pantalla completa">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></svg>
      <span>Modo Concentración</span>
    </button>
  </div>
@endsection

@section('content')
<!-- Materia Header -->
      <div class="mat-hdr">
        <div class="mat-ic">💻</div>
        <div class="mat-info mat-dropdown-wrap" id="mat-dropdown-wrap">
          <div class="mat-name mat-dropdown-trigger" id="mat-dropdown-trigger" onclick="toggleMateriaDropdown(event)">
            <span id="mat-selector-name">—</span>
            <span class="mat-dropdown-caret">▾</span>
          </div>
          <div class="mat-meta">
            <span class="badge b-cur" id="mat-selector-badge">Cursando</span>
            <span class="mat-yr">Tocá el nombre para cambiar de materia</span>
          </div>
          <!-- Selector de materia -->
          <div class="mat-dropdown" id="materia-dropdown"></div>
        </div>
        <div class="mat-chips">
          <div class="mat-chip">
            <div class="mat-chip-v" id="chip-stat-hours">—</div>
            <div class="mat-chip-l">esta semana</div>
          </div>
          <div class="mat-chip">
            <div class="mat-chip-v" id="chip-stat-pomos">—</div>
            <div class="mat-chip-l">🍅 totales</div>
          </div>
          {{-- Chip "online ahora" comentado: dato simulado, no real.
          <div class="mat-chip">
            <div class="mat-chip-v" id="chip-stat-online">4</div>
            <div class="mat-chip-l">online ahora</div>
          </div>
          --}}
        </div>
      </div>

      <!-- Split layout (Left content & Right content) -->
      <div class="split-v2">
        
        <!-- COLUMNA PRINCIPAL IZQUIERDA (Kanban + Marcadores Apilados) -->
        <div class="left-content">
          
          <!-- KANBAN SECTION -->
          <section class="kanban-section">
            <div class="sec-hd">
              <div class="sec-ttl">
                <span class="sec-ttl-ic">☑</span>
                Tablero de Tareas de esta materia
              </div>
            </div>

            <div class="kanban">
              
              <!-- Pendiente Column -->
              <div class="kbcol" id="col-pending" 
                   ondragover="allowDrop(event)" 
                   ondragleave="leaveDrop(event)" 
                   ondrop="dropCard(event, 'pending')">
                <div class="kbcol-hd">
                  <div class="kbcol-name"><div class="kbdot kd-p"></div>Pendiente</div>
                  <span class="kbcnt" id="cnt-pending">0</span>
                </div>
                <div class="kbcards" id="cards-pending"></div>
                <div id="add-form-container-pending"></div>
                <button class="kb-add" id="btn-add-pending" onclick="showInlineAddCardForm('pending')">+ Agregar tarea</button>
              </div>

              <!-- En Curso Column -->
              <div class="kbcol" id="col-progress" 
                   ondragover="allowDrop(event)" 
                   ondragleave="leaveDrop(event)" 
                   ondrop="dropCard(event, 'progress')">
                <div class="kbcol-hd">
                  <div class="kbcol-name"><div class="kbdot kd-c"></div>En Curso</div>
                  <span class="kbcnt" id="cnt-progress">0</span>
                </div>
                <div class="kbcards" id="cards-progress"></div>
                <div id="add-form-container-progress"></div>
                <button class="kb-add" id="btn-add-progress" onclick="showInlineAddCardForm('progress')">+ Agregar tarea</button>
              </div>

              <!-- Finalizado Column -->
              <div class="kbcol" id="col-done" 
                   ondragover="allowDrop(event)" 
                   ondragleave="leaveDrop(event)" 
                   ondrop="dropCard(event, 'done')">
                <div class="kbcol-hd">
                  <div class="kbcol-name"><div class="kbdot kd-f"></div>Finalizado</div>
                  <span class="kbcnt" id="cnt-done">0</span>
                </div>
                <div class="kbcards" id="cards-done"></div>
                <div id="add-form-container-done"></div>
                <button class="kb-add" id="btn-add-done" onclick="showInlineAddCardForm('done')">+ Agregar tarea</button>
              </div>

            </div>
          </section>

          <!-- BOVEDA DE MARCADORES -->
          <section class="marcadores-section">
            <div class="sec-hd">
              <div class="sec-ttl">
                <span class="sec-ttl-ic">🔗</span>
                Bóveda de Marcadores
              </div>
            </div>

            <div class="bmwrap">
              <div class="bm-form">
                <div class="bm-form-title">Agregar enlace útil</div>
                <div class="bm-row">
                  <input id="bm-url" class="bm-inp url" type="url" placeholder="https://..." required>
                  <input id="bm-title" class="bm-inp" type="text" placeholder="Título (opcional)">
                  <button class="bm-save" id="btn-bm-save" onclick="addBookmark()">Guardar</button>
                </div>
              </div>
              
              <div class="bm-list" id="bm-list">
                <!-- Se inyectan por JS -->
              </div>
            </div>
          </section>

        </div><!-- /left-content -->

        <!-- COLUMNA LATERAL DERECHA (Pomodoro + Compañeros Apilados) -->
        <div class="right-sidebar">
          
          <!-- POMODORO TIMER CARD -->
          <div class="focus-card">
            <div class="pomo-hd">
              <div class="pomo-hd-title">Temporizador Pomodoro</div>
              <div class="pomo-presets">
                <button class="pomo-preset-btn active" id="preset-classic" onclick="setPreset('classic')">25/5</button>
                <button class="pomo-preset-btn" id="preset-deep" onclick="setPreset('deep')">50/10</button>
                <button class="pomo-preset-btn" id="preset-short" onclick="setPreset('short')">15/3</button>
                <button class="pomo-preset-btn" id="preset-custom" onclick="setPreset('custom')">P</button>
              </div>
            </div>

            <div class="focus-body" style="position: relative;">
              <button id="pomo-restart-cycle-btn" onclick="restartPomoCycle()" style="position: absolute; top: 12px; left: 14px; background: none; border: none; cursor: pointer; font-size: 15px; color: rgba(255,255,255,.5); padding: 4px; transition: color .15s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.5)'" title="Reiniciar ciclo de sesiones (volver a la sesión 1)">⏮</button>
              <button id="pomo-settings-btn" onclick="openCustomPomoModal()" style="position: absolute; top: 12px; right: 14px; background: none; border: none; cursor: pointer; font-size: 15px; color: rgba(255,255,255,.5); padding: 4px; transition: color .15s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.5)'" title="Ajustes de pomodoro personalizado">⚙️</button>

              <!-- Progress Ring -->
              <div class="ring-wrap" id="ring-wrap">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <defs>
                    <linearGradient id="grd" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stop-color="#6366f1"/>
                      <stop offset="100%" stop-color="#c4b5fd"/>
                    </linearGradient>
                  </defs>
                  <circle class="r-bg" cx="70" cy="70" r="65"/>
                  <circle class="r-prog" cx="70" cy="70" r="65" id="rp" stroke-dasharray="408" stroke-dashoffset="0"/>
                </svg>
                <div class="ring-center">
                  <span class="ring-t" id="ptime">25:00</span>
                  <span class="ring-s" id="psub">Sesión 1 de 4</span>
                </div>
              </div>

              <!-- Controls -->
              <div class="pomo-ctrls">
                <button class="ctrl" onclick="resetPomo()" title="Reiniciar">⟳</button>
                <button class="ctrl play" id="play-btn" onclick="togglePomo()">▶</button>
                <button class="ctrl" onclick="skipPomo()" title="Saltear">⏭</button>
              </div>

              <!-- Progress Dots -->
              <div class="dots" id="pomo-dots">
                <!-- Se inyectan por JS -->
              </div>

              <!-- Session Log -->
              <div class="slog">
                <div class="slog-title">Sesiones completadas hoy</div>
                <div class="slog-list" id="slog-list">
                  <!-- Se inyectan por JS -->
                </div>
              </div>

            </div>
          </div><!-- /focus-card -->

          {{-- Panel "Estudiando ahora" comentado: compañeros simulados, no reales.
          <!-- SOCIAL PANEL / COMMUNITY -->
          <div class="community">
            <div class="cp-head">
              <div class="cp-ttl">
                <div class="live"></div>
                Estudiando ahora
              </div>
              <div class="cp-sub" id="social-active-count">4 activos en Programación II</div>
            </div>

            <div class="cp-list" id="social-list">
              <!-- Se inyecta por JS -->
            </div>

            <div class="cp-foot">
              💡 Tus compañeros están concentrados.<br>¡Buen momento para enfocar!
            </div>
          </div><!-- /community -->
          --}}

        </div><!-- /right-sidebar -->

      </div><!-- /split-v2 -->

<!-- 1. MODAL DETALLE DE TAREA --><div class="modal-overlay" id="task-modal">
  <div class="modal-box">
    <div class="modal-hdr">
      <div class="modal-title">
        <span>Columna: </span><span id="task-modal-col-name" style="color: var(--brand);">Pendiente</span>
      </div>
      <button class="modal-close" onclick="closeTaskModal()">✕</button>
    </div>
    <div class="modal-body">
      
      <!-- Título de la tarea -->
      <div class="modal-field">
        <label class="modal-label" for="task-modal-title">Título de la Tarea</label>
        <input type="text" id="task-modal-title" class="modal-input" placeholder="Título de la tarea">
      </div>

      <!-- Fecha de Vencimiento -->
      <div class="modal-field">
        <label class="modal-label" for="task-modal-due">Fecha de Vencimiento</label>
        <input type="datetime-local" id="task-modal-due" class="modal-input" onblur="handleDateAutocomplete(this)">
      </div>

      <!-- Descripción -->
      <div class="modal-field">
        <label class="modal-label" for="task-modal-desc">Descripción</label>
        <textarea id="task-modal-desc" class="modal-input modal-textarea" placeholder="Añadir una descripción más detallada..."></textarea>
      </div>

      <!-- Subtareas Checklist -->
      <div class="modal-field">
        <label class="modal-label">Subtareas (Checklist)</label>
        <div class="subtasks-wrap">
          <div class="subtasks-list" id="task-modal-subtasks-list">
            <!-- Inyectado por JS -->
          </div>
          <div class="subtask-add-row" id="subtask-add-form" style="display:none;">
            <input type="text" id="subtask-new-txt" class="modal-input" placeholder="Nombre de la subtarea" style="flex:1; padding: 4px 8px; font-size:12px;">
            <button class="btn-save" onclick="saveNewSubtask()" style="padding:4px 8px; font-size:11px;">Añadir</button>
            <button class="btn-cancel" onclick="hideSubtaskAddInput()" style="padding:4px 8px; font-size:11px;">✕</button>
          </div>
          <button class="subtask-add-btn" id="btn-show-subtask-add" onclick="showSubtaskAddInput()">+ Añadir una subtarea</button>
        </div>
      </div>

    </div>
    <div class="modal-foot">
      <button class="btn-danger" onclick="deleteTaskFromModal()" style="margin-right:auto;">Eliminar Tarea</button>
      <button class="btn-cancel" onclick="closeTaskModal()">Cancelar</button>
      <button class="btn-save" onclick="saveTaskDetails()">Guardar</button>
    </div>
  </div>
</div>

<!-- 2. MODAL CONFIGURACIÓN POMODORO PERSONALIZADO -->
<div class="modal-overlay" id="pomo-custom-modal">
  <div class="modal-box" style="max-width: 400px;">
    <div class="modal-hdr">
      <div class="modal-title">Ajustes Pomodoro Personalizado</div>
      <button class="modal-close" onclick="closeCustomPomoModal()">✕</button>
    </div>
    <div class="modal-body">
      
      <div class="modal-field">
        <label class="modal-label" for="custom-pomo-focus">Tiempo de Enfoque (minutos)</label>
        <input type="number" id="custom-pomo-focus" class="modal-input" min="1" max="90" step="1" value="25" required>
      </div>

      <div class="modal-field">
        <label class="modal-label" for="custom-pomo-short">Descanso Corto (minutos)</label>
        <input type="number" id="custom-pomo-short" class="modal-input" min="1" max="30" step="1" value="5" required>
      </div>

      <div class="modal-field">
        <label class="modal-label" for="custom-pomo-long">Descanso Largo (minutos)</label>
        <input type="number" id="custom-pomo-long" class="modal-input" min="5" max="60" step="1" value="20" required>
      </div>

      <div class="modal-field">
        <label class="modal-label" for="custom-pomo-sessions">Sesiones por Ciclo (Pomodoros)</label>
        <input type="number" id="custom-pomo-sessions" class="modal-input" min="1" max="8" step="1" value="4" required>
      </div>

      <div class="modal-field">
        <label class="modal-label" for="custom-pomo-cycles">Ciclos Totales</label>
        <select id="custom-pomo-cycles" class="modal-input">
          <option value="infinite">Bucle Infinito</option>
          <option value="1">1 Ciclo</option>
          <option value="2">2 Ciclos</option>
          <option value="3">3 Ciclos</option>
          <option value="4">4 Ciclos</option>
          <option value="5">5 Ciclos</option>
          <option value="6">6 Ciclos</option>
          <option value="7">7 Ciclos</option>
          <option value="8">8 Ciclos</option>
          <option value="9">9 Ciclos</option>
          <option value="10">10 Ciclos</option>
        </select>
      </div>

      <div class="modal-field">
        <label class="modal-label" for="custom-pomo-sound">Sonido de Alarma</label>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <select id="custom-pomo-sound" class="modal-input" style="flex: 1;">
            <option value="chime">Campana Clásica (Chime)</option>
            <option value="beep">Beep Digital (Retro)</option>
            <option value="zen">Campana Zen (Relajante)</option>
            <option value="none">Ninguno (Silencioso)</option>
          </select>
          <button type="button" class="btn-cancel" id="btn-test-sound" onclick="testSelectedSound()" style="padding: 10px 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.25rem; white-space: nowrap; border-radius: 6px;" title="Probar sonido">
            🔊 Probar
          </button>
        </div>
      </div>

      <div class="modal-field">
        <label class="modal-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
          <input type="checkbox" id="pomo-strict-toggle" style="width: 15px; height: 15px; cursor: pointer; margin: 0;">
          <span style="font-weight: 500; font-size: 13px; color: var(--t1);">🔒 Modo Estricto (Penaliza si cambias de pestaña o sales)</span>
        </label>
      </div>

      <div id="pomo-validation-error" style="color: var(--red); font-size:12px; font-weight:600; display:none;"></div>

    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeCustomPomoModal()">Cancelar</button>
      <button class="btn-save" onclick="saveCustomPomoSettings()">Aplicar Ajustes</button>
    </div>
  </div>
</div>


<!-- 3. MODAL GENERAL DE CONFIRMACIÓN -->
<div class="modal-overlay" id="confirm-modal">
  <div class="modal-box" style="max-width:350px;">
    <div class="modal-hdr">
      <div class="modal-title" id="confirm-title">Confirmación</div>
      <button class="modal-close" onclick="closeConfirmModal()">✕</button>
    </div>
    <div class="modal-body">
      <p id="confirm-text" style="font-size: 13px; color: var(--t2); line-height: 1.4;"></p>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeConfirmModal()">Cancelar</button>
      <button class="btn-danger" id="confirm-yes-btn">Confirmar</button>
    </div>
  </div>
</div>


<!-- 4. OVERLAY MODO CONCENTRACIÓN AESTHETIC -->
<div id="focus-mode-overlay">
  <!-- Botón de Salida Flotante -->
  <button class="focus-card-close-btn" onclick="window.exitFocusMode()" title="Salir del Modo Concentración">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>

  <!-- Contenedor del fondo animado -->
  <div id="focus-bg-container" class="theme-aurora"></div>
  
  <!-- Lienzo de partículas -->
  <canvas id="focus-canvas"></canvas>

  <!-- Tarjeta central con el reloj y controles -->
  <div class="focus-central-card">
    <div class="focus-phase-tabs-row">
      <div class="focus-phase-tabs">
        <button class="focus-phase-tab active" id="phase-tab-enfoque" onclick="window.changeFocusPhase('enfoque')">Pomodoro</button>
        <button class="focus-phase-tab" id="phase-tab-corto" onclick="window.changeFocusPhase('descanso_corto')">Recreo Corto</button>
        <button class="focus-phase-tab" id="phase-tab-largo" onclick="window.changeFocusPhase('descanso_largo')">Recreo Largo</button>
      </div>
    </div>
    
    <!-- Banner de Meta / Tarea Activa -->
    <div class="focus-goal-banner" id="focus-goal-banner">
      <span class="focus-goal-label">Enfocándote en:</span>
      <div class="focus-goal-title-wrapper" style="display: flex; align-items: center; gap: 0.5rem; justify-content: center; width: 100%;">
        <button class="focus-goal-nav-btn" id="focus-goal-prev-btn" onclick="window.prevFocusTask()" title="Tarea anterior" style="display: none;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="focus-goal-title" id="focus-goal-title">Ninguna tarea en curso</span>
        <button class="focus-goal-nav-btn" id="focus-goal-next-btn" onclick="window.nextFocusTask()" title="Siguiente tarea" style="display: none;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="focus-goal-complete-btn" id="focus-goal-complete-btn" onclick="window.completeFocusActiveTask()" title="Marcar tarea como completada" style="display: none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button class="focus-goal-complete-btn" id="focus-subtasks-toggle" onclick="window.toggleFocusSubtasksDrawer()" title="Ver checklist de subtareas" style="display: none; background: rgba(255,255,255,0.15); margin-left: 0.35rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- Cajón de Subtareas colapsable -->
    <div id="focus-subtasks-drawer" class="focus-subtasks-drawer">
      <div class="focus-subtasks-header">Checklist de Subtareas</div>
      <div id="focus-subtasks-list" class="focus-subtasks-list">
        <!-- Se inyecta por JS -->
      </div>
    </div>
    
    <!-- Anillo de progreso circular -->
    <div class="focus-timer-ring-wrapper">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle class="focus-timer-ring-bg" cx="110" cy="110" r="102"/>
        <circle class="focus-timer-ring-progress enfoque" cx="110" cy="110" r="102" id="focus-ring-progress" stroke-dasharray="640.88" stroke-dashoffset="0"/>
      </svg>
      <div class="focus-timer-clock">
        <span class="focus-time-display" id="focus-time-display">25:00</span>
        <span class="focus-phase-display" id="focus-phase-display">Enfoque</span>
        <span class="focus-session-display" id="focus-session-display">Sesión 1 de 4</span>
      </div>
    </div>

    <!-- Controles de reproducción -->
    <div class="focus-controls-row">
      <button class="focus-ctrl-btn" onclick="window.resetPomo()" title="Reiniciar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
      </button>
      <button class="focus-ctrl-btn play-pause" id="focus-play-btn" onclick="window.togglePomo()" title="Pausar/Reanudar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" id="focus-play-icon"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
      <button class="focus-ctrl-btn" onclick="window.skipPomo()" title="Saltear fase">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
      </button>
    </div>

    <!-- Puntos de progreso de sesión -->
    <div class="focus-dots-row" id="focus-dots"></div>
  </div>

  <!-- Barra flotante inferior de ajustes (Mixer & Themes) -->
  <div class="focus-bottom-bar">
    <!-- Selector de Temas -->
    <div class="focus-themes-wrapper">
      <button class="focus-theme-btn active" id="theme-btn-aurora" onclick="window.changeFocusTheme('aurora')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span>Aurora</span>
      </button>
      <button class="focus-theme-btn" id="theme-btn-rain" onclick="window.changeFocusTheme('rain')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><path d="M8 16v4M12 14v6M16 16v4"/></svg>
        <span>Lluvia</span>
      </button>
      <button class="focus-theme-btn" id="theme-btn-fire" onclick="window.changeFocusTheme('fire')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
        <span>Fogón</span>
      </button>
      <button class="focus-theme-btn" id="theme-btn-forest" onclick="window.changeFocusTheme('forest')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7H5l7 7Z"/><path d="m12 13 6-6H6l6 6Z"/><path d="m12 7 5-5H7l5 5Z"/><path d="M12 19v3"/></svg>
        <span>Bosque</span>
      </button>
      <button class="focus-theme-btn" id="theme-btn-ocean" onclick="window.changeFocusTheme('ocean')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6 0 1.2-.2 1.6-.6L6.2 3c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6L17.4 3c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6M2 12c.6 0 1.2-.2 1.6-.6l2.6-2.6c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6l2.6-2.6c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6M2 18c.6 0 1.2-.2 1.6-.6l2.6-2.6c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6l2.6-2.6c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6"/></svg>
        <span>Océano</span>
      </button>
    </div>

    <!-- Mezclador de Sonidos Ambientales -->
    <div class="focus-audio-mixer">
      <div class="focus-audio-control" id="mixer-control-rain">
        <span onclick="window.toggleRainAudio()" id="mixer-icon-rain" style="cursor: pointer; display: flex; align-items: center;" title="Encender/Apagar sonido de lluvia">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><path d="M8 16v4M12 14v6M16 16v4"/></svg>
        </span>
        <input type="range" id="focus-vol-rain" min="0" max="1" step="0.05" value="0" oninput="window.setRainVolume(this.value)">
      </div>
      <div class="focus-audio-control" id="mixer-control-fire">
        <span onclick="window.toggleFireAudio()" id="mixer-icon-fire" style="cursor: pointer; display: flex; align-items: center;" title="Encender/Apagar sonido de fogón">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
        </span>
        <input type="range" id="focus-vol-fire" min="0" max="1" step="0.05" value="0" oninput="window.setFireVolume(this.value)">
      </div>
      <div class="focus-audio-control" id="mixer-control-forest">
        <span onclick="window.toggleForestAudio()" id="mixer-icon-forest" style="cursor: pointer; display: flex; align-items: center;" title="Encender/Apagar sonido de bosque">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7H5l7 7Z"/><path d="m12 13 6-6H6l6 6Z"/><path d="m12 7 5-5H7l5 5Z"/><path d="M12 19v3"/></svg>
        </span>
        <input type="range" id="focus-vol-forest" min="0" max="1" step="0.05" value="0" oninput="window.setForestVolume(this.value)">
      </div>
      <div class="focus-audio-control" id="mixer-control-ocean">
        <span onclick="window.toggleOceanAudio()" id="mixer-icon-ocean" style="cursor: pointer; display: flex; align-items: center;" title="Encender/Apagar sonido de océano">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6 0 1.2-.2 1.6-.6L6.2 3c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6L17.4 3c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6M2 12c.6 0 1.2-.2 1.6-.6l2.6-2.6c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6l2.6-2.6c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6M2 18c.6 0 1.2-.2 1.6-.6l2.6-2.6c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6.6 0 1.2-.2 1.6-.6l2.6-2.6c.8-.8 2-.8 2.8 0l2.6 2.6c.4.4 1 .6 1.6.6"/></svg>
        </span>
        <input type="range" id="focus-vol-ocean" min="0" max="1" step="0.05" value="0" oninput="window.setOceanVolume(this.value)">
      </div>
    </div>

    <!-- Acciones de barra inferior -->
    <div class="focus-bottom-actions">
      <!-- Botón de Música Lofi -->
      <button class="focus-theme-btn" id="lofi-panel-toggle" onclick="window.toggleLofiPanel()" title="Música Lofi">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        <span>Música Lofi</span>
      </button>

      <!-- Botón de Pantalla Completa -->
      <button class="focus-theme-btn" id="focus-fullscreen-toggle" onclick="window.toggleFullscreen()" title="Pantalla Completa">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        <span id="focus-fullscreen-text">Pantalla Completa</span>
      </button>
    </div>
  </div>

  <!-- Panel de Música Lofi Lateral -->
  <div class="focus-lofi-panel" id="focus-lofi-panel">
    <div class="focus-lofi-header">
      <span class="focus-lofi-title">🎵 Reproductor Lofi</span>
      <button class="focus-lofi-close" onclick="window.toggleLofiPanel()" title="Cerrar panel">✕</button>
    </div>
    
    <div class="focus-lofi-body">
      <!-- Selector de canal/estación -->
      <div class="focus-lofi-select-wrapper">
        <label for="focus-lofi-select" class="focus-lofi-label">Estación:</label>
        <select id="focus-lofi-select" class="focus-lofi-select" onchange="window.changeLofiChannel(this.value)">
          <option value="3yH2Wo2SaIM">☕ Lofi Girl (Estudio)</option>
          <option value="Ru3rJJaqJl4">爵 Chillhop Radio (Jazz Beats)</option>
          <option value="jdIDQ1qGutE">🌌 Synthwave Radio (Retro)</option>
          <option value="DSmS_59twmU">☕ Cafe Music Bossa Nova</option>
        </select>
      </div>

      <!-- Iframe contenedor -->
      <div class="focus-lofi-video-container">
        <iframe id="focus-lofi-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    </div>
  </div>
</div>
@endsection

@push('scripts')
  <script src="{{ asset('js/views/pomo-ambient-synth.js') }}"></script>
  <script src="{{ asset('js/views/pomo-focus-canvas.js') }}"></script>
  <script src="{{ asset('js/views/area-estudio.js') }}?v={{ filemtime(public_path('js/views/area-estudio.js')) }}" type="module"></script>
@endpush
