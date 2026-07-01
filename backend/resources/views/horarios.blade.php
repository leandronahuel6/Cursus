@extends('layouts.app')

@section('title', 'Cursus - Simulador de Horarios')

@section('mobile-header')
<div class="mob-hdr">
  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
    <div style="display: flex; flex-direction: column;">
      <div class="mob-greet">Simulador de Horarios 📅</div>
      <div class="mob-sub">Planificación del cuatrimestre</div>
    </div>
    <div class="version-tabs">
      <button class="btn-version active" id="mob-btn-version-A" onclick="switchVersion('A')">A</button>
      <button class="btn-version" id="mob-btn-version-B" onclick="switchVersion('B')">B</button>
    </div>
  </div>
</div>
@endsection

@section('mobile-header-actions')
<div class="horarios-mobile-hdr-actions" style="gap: 5px;">
  <button class="btn-rect-mobile btn-rect-mobile-hdr" onclick="exportToICS()" title="Exportar iCal">
    <span>📅 iCal</span>
  </button>
  <button class="btn-rect-mobile btn-rect-mobile-hdr" onclick="printSchedule()" title="Imprimir PDF">
    <span>🖨️ PDF</span>
  </button>
  <button class="btn-rect-mobile btn-rect-mobile-purple btn-rect-mobile-hdr" onclick="document.getElementById('btn-save-schedule').click()" title="Guardar Horario">
    <span>💾 Guardar</span>
  </button>
  <button class="btn-rect-mobile btn-rect-mobile-hdr" onclick="document.getElementById('btn-clear-grid').click()" title="Limpiar Grilla">
    <span>♻ Limpiar</span>
  </button>
</div>
@endsection

@section('topbar-content')
  <div class="topbar-title" style="display: flex; align-items: center; gap: 15px;">
    <span>Simulador de Horarios 📅</span>
    <div class="version-tabs">
      <button class="btn-version active" id="btn-version-A" onclick="switchVersion('A')">Versión A</button>
      <button class="btn-version" id="btn-version-B" onclick="switchVersion('B')">Versión B</button>
    </div>
  </div>
  <div class="tb-actions">
    <button class="btn-secondary" id="btn-export-ical" onclick="exportToICS()">📅 Exportar iCal</button>
    <button class="btn-secondary" id="btn-print-pdf" onclick="printSchedule()">🖨️ PDF / Imprimir</button>
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
          <span>Plantillas Oficiales UTN 🏫</span>
        </div>
        <div class="sched-compare-box">
          <select id="utn-presets-select" onchange="loadUTNPresetSchedule()">
            <option value="">📅 Elegir curso oficial...</option>
            <optgroup label="1° Cuatrimestre (Mañana)">
              <option value="M1A_1">1° Año M1A (1° Cuat.)</option>
              <option value="M1B_1">1° Año M1B (1° Cuat.)</option>
              <option value="M2_1">2° Año M2 (1° Cuat.)</option>
              <option value="M3_1">3° Año M3 (1° Cuat.)</option>
              <option value="M4_1">4° Año M4 (1° Cuat.)</option>
            </optgroup>
            <optgroup label="1° Cuatrimestre (Noche)">
              <option value="N1_1">1° Año N1 (1° Cuat.)</option>
              <option value="N3_1">3° Año N3 (1° Cuat.)</option>
            </optgroup>
            <optgroup label="2° Cuatrimestre (Mañana)">
              <option value="M1A_2">1° Año M1A (2° Cuat.)</option>
              <option value="M1B_2">1° Año M1B (2° Cuat.)</option>
              <option value="M2_2">2° Año M2 (2° Cuat.)</option>
              <option value="M3_2">3° Año M3 (2° Cuat.)</option>
              <option value="M4_2">4° Año M4 (2° Cuat.)</option>
            </optgroup>
            <optgroup label="2° Cuatrimestre (Noche - Rotativo)">
              <option value="N1_2">1° Año N1 (2° Cuat. - Rotativo)</option>
              <option value="N3_2">3° Año N3 (2° Cuat. - Rotativo)</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div class="sched-panel-section">
        <div class="sched-section-hd">
          <span>Materias Disponibles (A cursar)</span>
          <span class="sched-badge-count" id="count-available-subjects">0</span>
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

      <div class="sched-panel-section">
        <div class="sched-section-hd">
          <span>Comparar con Compañero 👥</span>
        </div>
        <div class="sched-compare-box">
          <div class="compare-input-group">
            <input type="text" id="compare-search-input" placeholder="Email o Legajo">
            <button id="btn-compare-search" onclick="searchCompareUser()">Buscar</button>
          </div>
          <div id="compare-status-list" style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.6); min-height: 20px;">
            <div style="color: rgba(255,255,255,0.45); padding: 4px 0;">Sin comparación activa</div>
          </div>
        </div>
      </div>

    </div>

    <!-- RIGHT SIDE: Weekly Grid (70% width) -->
    <div class="sched-timeline-container">
      <!-- Cabecera de impresión (oculta por defecto en pantalla) -->
      <div class="print-only-header">
        <div class="print-brand-row">
          <span class="print-logo">Cursus 🎓</span>
          <span class="print-subtitle">Simulador de Horarios UTN</span>
        </div>
        <div class="print-title-row">
          <h1>Planificación de Horarios Semanal</h1>
          <div class="print-badge" id="print-active-version-badge">Versión A</div>
        </div>
        <div class="print-info-row">
          <span><strong>Alumno:</strong> {{ Auth::user()->name ?? 'Estudiante UTN' }} ({{ Auth::user()->email ?? '' }})</span>
          <span><strong>Generado el:</strong> <span id="print-generated-date">30/06/2026</span></span>
        </div>
      </div>

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
        <div class="editor-center" style="gap: 12px;">
          <label class="editor-time-lbl">
            Inicio:
            <input type="time" class="editor-time-input" id="editor-start-time">
          </label>
          <label class="editor-time-lbl">
            Fin:
            <input type="time" class="editor-time-input" id="editor-end-time">
          </label>

          <!-- Paleta de colores -->
          <div class="editor-color-picker" style="display: flex; align-items: center; gap: 6px; margin: 0 10px; padding-left: 10px; border-left: 1px solid rgba(255,255,255,0.15);">
            <button class="color-dot" data-color="#4f46e5" onclick="changeBlockColor('#4f46e5')" style="width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid transparent; background-color: #4f46e5; cursor: pointer;"></button>
            <button class="color-dot" data-color="#9333ea" onclick="changeBlockColor('#9333ea')" style="width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid transparent; background-color: #9333ea; cursor: pointer;"></button>
            <button class="color-dot" data-color="#10b981" onclick="changeBlockColor('#10b981')" style="width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid transparent; background-color: #10b981; cursor: pointer;"></button>
            <button class="color-dot" data-color="#f43f5e" onclick="changeBlockColor('#f43f5e')" style="width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid transparent; background-color: #f43f5e; cursor: pointer;"></button>
            <button class="color-dot" data-color="#f59e0b" onclick="changeBlockColor('#f59e0b')" style="width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid transparent; background-color: #f59e0b; cursor: pointer;"></button>
            <button class="color-dot" data-color="#0ea5e9" onclick="changeBlockColor('#0ea5e9')" style="width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid transparent; background-color: #0ea5e9; cursor: pointer;"></button>
          </div>

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
