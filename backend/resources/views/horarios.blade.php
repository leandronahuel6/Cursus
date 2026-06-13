@extends('layouts.app')

@section('title', 'Cursus - Simulador de Horarios')

@section('mobile-header')
  <div class="mob-hdr">
    <div class="mob-lbl">Académico</div>
    <div class="mob-row">
      <div class="mob-name">Simulador de Horarios</div>
      <div class="mob-tb-actions">
        <button class="btn-secondary btn-mob-action" onclick="document.getElementById('btn-clear-grid').click()">♻ Limpiar</button>
        <button class="btn-primary btn-mob-action" onclick="document.getElementById('btn-save-schedule').click()">💾 Guardar</button>
      </div>
    </div>
  </div>
@endsection

@section('topbar-content')
  <div class="breadcrumb">
    <a href="{{ route('dashboard') }}">Inicio</a>
    <span class="sep">›</span>
    <span class="cur">Simulador de Horarios</span>
  </div>
  <div class="tb-actions">
    <button class="btn-secondary" id="btn-clear-grid">♻ Limpiar Grilla</button>
    <button class="btn-primary" id="btn-save-schedule">💾 Guardar Horario</button>
  </div>
@endsection

@section('content')
  <!-- Double Column Area -->
  <div class="sched-main-split">
    
    <!-- LEFT SIDE: Available Elements (30% width) -->
    <div class="sched-sidebar-panel">
      <div class="sched-panel-section">
        <div class="sched-section-hd">
          <span>Materias Disponibles (A cursar)</span>
          <span class="sched-badge-count" id="count-available-subjects">6</span>
        </div>
        <div class="sched-draggable-list" id="list-available-subjects">
          <!-- Se poblará dinámicamente con JS -->
        </div>
      </div>

      <div class="sched-panel-section">
        <div class="sched-section-hd">
          <span>Mis Actividades Personales</span>
          <button class="btn-add-act" id="btn-add-activity">+ Nueva</button>
        </div>
        <div class="sched-draggable-list" id="list-available-activities">
          <!-- Se poblará dinámicamente con JS -->
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE: Weekly Grid (70% width) -->
    <div class="sched-timeline-container">
      <div class="sched-canvas-card">
        <div class="sched-weekly-grid">
          
          <!-- Grid Header (Days) -->
          <div class="grid-header-row">
            <div class="grid-hdr-cell time-col-hdr">Hora</div>
            <div class="grid-hdr-cell">Lunes</div>
            <div class="grid-hdr-cell">Martes</div>
            <div class="grid-hdr-cell">Miércoles</div>
            <div class="grid-hdr-cell">Jueves</div>
            <div class="grid-hdr-cell">Viernes</div>
            <div class="grid-hdr-cell">Sábado</div>
          </div>

          <!-- Grid Body (Time column and day columns) -->
          <div class="grid-body-row">
            
            <!-- Time Axis labels (08:00 to 22:00) -->
            <div class="grid-time-axis" id="grid-time-axis-labels">
              <!-- Se generará con JS -->
            </div>

            <!-- Day Columns (Lunes to Sábado) -->
            <div class="grid-day-cols-wrap">
              <!-- Columnas de fondo para las líneas de la grilla -->
              <div class="grid-bg-lines-container" id="grid-bg-lines">
                <!-- Grid lines horizontales -->
              </div>

              <!-- Columnas reales donde se soltarán los bloques -->
              <div class="grid-cols-interactive">
                <div class="grid-day-col" data-day-id="1" id="col-day-1"></div>
                <div class="grid-day-col" data-day-id="2" id="col-day-2"></div>
                <div class="grid-day-col" data-day-id="3" id="col-day-3"></div>
                <div class="grid-day-col" data-day-id="4" id="col-day-4"></div>
                <div class="grid-day-col" data-day-id="5" id="col-day-5"></div>
                <div class="grid-day-col" data-day-id="6" id="col-day-6"></div>
              </div>
            </div>

          </div><!-- /grid-body-row -->

        </div><!-- /sched-weekly-grid -->
      </div><!-- /sched-canvas-card -->

      <!-- Overlap Warning Banner (edit-time, persistent but hidden by default) -->
      <div class="sched-alert-banner" id="overlap-warning-banner" style="display: none;">
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">Superposición horaria detectada: Revisa tus bloques rojos.</span>
      </div>

      <!-- Contextual Floating Manual Editor Bar -->
      <div class="sched-editor-bar" id="sched-manual-editor" style="display: none;">
        <div class="editor-left">
          <span class="editor-block-title" id="editor-selected-title">Selección: Ninguno</span>
          <span class="editor-block-type-badge" id="editor-selected-type">MATERIA</span>
        </div>
        <div class="editor-center">
          <label class="editor-time-lbl">
            Inicio:
            <input type="time" class="editor-time-input" id="editor-start-time">
          </label>
          <label class="editor-time-lbl">
            Fin:
            <input type="time" class="editor-time-input" id="editor-end-time">
          </label>
          <button class="editor-btn-delete" id="editor-btn-delete-block" title="Eliminar bloque">🗑️ Eliminar</button>
        </div>
        <div class="editor-right" id="editor-notification-area">
          <!-- Zona dinámica para errores locales -->
        </div>
      </div>

    </div><!-- /timeline-container -->

  </div><!-- /sched-main-split -->

  <!-- Modal emergente para añadir bloque con precisión (cuando se hace clic en "+") -->
  <div class="sched-modal-backdrop" id="add-block-modal" style="display: none;">
    <div class="sched-modal-card">
      <div class="sched-modal-hd">
        <span class="sched-modal-title">Añadir a Horarios</span>
        <button class="sched-modal-close" onclick="closeAddModal()">✕</button>
      </div>
      <div class="sched-modal-body">
        <input type="hidden" id="modal-item-id">
        <input type="hidden" id="modal-item-type">
        
        <div class="modal-field">
          <label class="modal-lbl">Asignatura / Actividad:</label>
          <input type="text" class="modal-inp-readonly" id="modal-item-name" readonly>
        </div>

        <div class="modal-field-row">
          <div class="modal-field">
            <label class="modal-lbl">Día:</label>
            <select class="modal-select" id="modal-day-select">
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
            </select>
          </div>
          <div class="modal-field">
            <label class="modal-lbl" id="modal-comm-lbl">Comisión:</label>
            <select class="modal-select" id="modal-commission-select">
              <option value="Comisión 1 (Noche)">Comisión 1 (Noche)</option>
              <option value="Comisión 2 (Tarde)">Comisión 2 (Tarde)</option>
              <option value="Comisión 3 (Mañana)">Comisión 3 (Mañana)</option>
            </select>
          </div>
        </div>

        <div class="modal-field-row">
          <div class="modal-field">
            <label class="modal-lbl">Hora Inicio:</label>
            <select class="modal-select" id="modal-start-time-select">
              <!-- Se poblará con JS -->
            </select>
          </div>
          <div class="modal-field">
            <label class="modal-lbl">Hora Fin:</label>
            <select class="modal-select" id="modal-end-time-select">
              <!-- Se poblará con JS -->
            </select>
          </div>
        </div>

        <div class="sched-modal-ft">
          <button class="btn-secondary" onclick="closeAddModal()">Cancelar</button>
          <button class="btn-primary" onclick="submitAddModal()">Agregar a grilla</button>
        </div>
      </div>
    </div>
  </div>
@endsection

@push('scripts')
  <script src="{{ asset('js/horarios.js') }}"></script>
@endpush
