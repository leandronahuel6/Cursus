@extends('layouts.app')

@section('title', 'Cursus - Mis Materias y Plan de Estudios')

@push('styles')
  <link rel="stylesheet" href="{{ asset('css/views/materias.css') }}">
@endpush

@section('mobile-header')
  <!-- Mobile Header -->
  <div class="mob-hdr">
    <div class="mob-greet">Mis Materias 📚</div>
    <div class="mob-sub">UTN Haedo · Plan 2024</div>
  </div>
@endsection

@section('topbar-content')
  <div class="topbar-title">Mis Materias <span>📚</span></div>
@endsection

@section('content')
  <!-- TARJETAS DE PROGRESO / ESTADÍSTICAS -->
  <div class="progression-grid">
    <div class="progression-card">
      <div class="prog-icon">📈</div>
      <div class="prog-info">
        <div class="prog-val skel" id="career-progress-pct">0%</div>
        <div class="prog-lbl">Avance de Carrera</div>
      </div>
    </div>

    <div class="progression-card">
      <div class="prog-icon">🎓</div>
      <div class="prog-info">
        <div class="prog-val skel" id="career-average">0.00</div>
        <div class="prog-lbl">Promedio General</div>
      </div>
    </div>

    <div class="progression-card">
      <div class="prog-icon">✓</div>
      <div class="prog-info">
        <div class="prog-val skel" id="career-approved-count">0 / 17</div>
        <div class="prog-lbl">Materias Aprobadas</div>
      </div>
    </div>
  </div>

  <!-- Selector de Subpestañas (Gestión vs Árbol) -->
  <div class="stabs">
    <div class="stab on" id="tab-manage" data-action="switch-tab" data-tab="manage">🎛️ Gestión de Cursada</div>
    <div class="stab" id="tab-plan" data-action="switch-tab" data-tab="plan">🗺️ Plan de Estudios</div>
  </div>

  <!-- ================= PESTAÑA: GESTIÓN DE CURSADA (árbol editable) ================= -->
  <div id="panel-manage-view">
    <div class="tree-container">
      <div class="tree-legend">
        <div class="legend-item"><div class="legend-color disponible"></div> Disponible</div>
        <div class="legend-item"><div class="legend-color cursando"></div> Cursando</div>
        <div class="legend-item"><div class="legend-color regular"></div> Regular (Pendiente Final)</div>
        <div class="legend-item"><div class="legend-color aprobada"></div> Aprobada</div>
        <div class="legend-item"><div class="legend-color bloqueada"></div> Bloqueada (Faltan Correlativas)</div>
      </div>

      <div class="tree-flow-row" id="plan-tree-levels-container">
        <!-- Renderizado dinámicamente -->
      </div>
    </div>
  </div>

  <!-- ================= PESTAÑA: PLAN DE ESTUDIOS (solo lectura) ================= -->
  <div id="panel-plan-view" class="hidden">

    <!-- Filtros Rápidos -->
    <div class="filters-bar">
      <button class="filter-chip active" id="filter-all" data-action="set-filter" data-filter="all">Todas</button>
      <button class="filter-chip" id="filter-cursando" data-action="set-filter" data-filter="cursando">Cursando actualmente</button>
      <button class="filter-chip" id="filter-regular" data-action="set-filter" data-filter="regular">Regulares (Final Pendiente)</button>
      <button class="filter-chip" id="filter-aprobada" data-action="set-filter" data-filter="aprobada">Aprobadas</button>
      <button class="filter-chip" id="filter-bloqueada" data-action="set-filter" data-filter="bloqueada">Faltantes (Bloqueadas)</button>
    </div>

    <!-- Listado Agrupado por Niveles -->
    <div id="subjects-grouped-container">
      <!-- Cargado dinámicamente desde materias.js -->
    </div>

  </div>


  <!-- ===================== MODAL DE DETALLE DE MATERIA ===================== -->
  <div class="grade-modal-overlay" id="subject-info-modal" role="dialog" aria-modal="true" aria-labelledby="subject-info-modal-title">
    <div class="grade-modal-box subject-info-modal-box">
      <div class="grade-modal-header" id="subject-info-modal-title">Detalle de materia</div>
      <div class="grade-modal-body" id="subject-info-modal-body"></div>
      <div class="grade-modal-footer">
        <button class="btn-modal-action cancel" type="button" data-action="close-subject-info">Cerrar</button>
      </div>
    </div>
  </div>

  <!-- ===================== MODAL DE CALIFICACIONES ===================== -->
  <div class="grade-modal-overlay" id="grade-modal">
    <div class="grade-modal-box">
      <div class="grade-modal-header" id="grade-modal-subject-title">Registrar Calificación</div>
      <div class="grade-modal-body">
        <p class="grade-modal-desc">
          Ingresa la nota definitiva obtenida en el examen final o promoción directa:
        </p>
        <div class="grade-select-wrapper">
          <label for="grade-select" class="grade-modal-label">Calificación Final:</label>
          <select id="grade-select" class="grade-input-select mt-5">
            <option value="6">6 (Seis)</option>
            <option value="7">7 (Siete)</option>
            <option value="8" selected>8 (Ocho)</option>
            <option value="9">9 (Nueve)</option>
            <option value="10">10 (Diez)</option>
          </select>
        </div>
      </div>
      <div class="grade-modal-footer">
        <button class="btn-modal-action cancel" data-action="close-grade-modal" data-save="false">Cancelar</button>
        <button class="btn-modal-action save" data-action="close-grade-modal" data-save="true">Guardar Nota</button>
      </div>
    </div>
  </div>

  <!-- ===================== MODAL DE ERROR DE DEPENDENCIAS ===================== -->
  <div class="modal-overlay" id="dependency-error-modal" role="dialog" aria-modal="true" aria-labelledby="dependency-error-title" aria-describedby="dependency-error-desc" tabindex="-1">
    <div class="modal-box">
      <div class="modal-hdr">
        <div class="modal-title dependency-error-title-text" id="dependency-error-title">
          <svg aria-hidden="true" width="18" height="18"><use href="{{ asset('assets/icons/sprite.svg#circle-alert') }}"></use></svg>
          Acción Bloqueada
        </div>
        <button class="modal-close" data-action="close-dependency-error">
          <svg aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#x') }}"></use></svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="dependency-error-text">
          No puedes retroceder el estado de esta materia porque invalidaría tu progreso actual en las siguientes materias dependientes:
        </p>
        <ul id="dependency-error-list" class="dependency-error-list-styled">
          <!-- Items inyectados desde JS -->
        </ul>
        <p class="dependency-error-text-muted">
          Debes dar de baja estas materias avanzadas antes de poder deshacer esta.
        </p>
      </div>
      <div class="modal-foot">
        <button class="btn-cancel" data-action="close-dependency-error">Entendido</button>
      </div>
    </div>
  </div>
@endsection

@push('scripts')
  <script src="{{ asset('js/views/materias.js') }}"></script>
@endpush
