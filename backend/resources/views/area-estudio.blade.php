@extends('layouts.app')

@section('title', 'Cursus - Área de Concentración')

@push('styles')
  <link rel="stylesheet" href="{{ asset('css/views/area-estudio.css') }}">
@endpush

@section('mobile-header')
<div class="mob-hdr">
  <div class="mob-lbl">Área de Estudio 💻</div>
  <div class="mob-name">
    <span id="mob-materia-name">—</span>
    <span class="badge b-reg" id="mob-materia-badge">Regular</span>
    <span style="font-size:11px;color:#6b7280" id="mob-materia-meta">Cargando...</span>
  </div>
</div>
@endsection

@section('topbar-content')
<div class="breadcrumb">
        <a href="index.html">Inicio</a>
        <span class="sep">›</span>
        <span class="cur">Área de Estudio</span>
      </div>
      <div class="tb-right">
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
              <button id="pomo-settings-btn" onclick="openCustomPomoModal()" style="display:none; position: absolute; top: 12px; right: 14px; background: none; border: none; cursor: pointer; font-size: 15px; color: rgba(255,255,255,.5); padding: 4px; transition: color .15s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.5)'" title="Ajustes de pomodoro personalizado">⚙️</button>

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

<!-- Contenedor global de Toasts -->
<div class="toast-container" id="toast-container"></div>
@endsection

@push('scripts')
  <script src="{{ asset('js/views/area-estudio.js') }}" type="module"></script>
@endpush
