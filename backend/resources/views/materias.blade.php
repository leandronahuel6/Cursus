@extends('layouts.app')

@section('title', 'Cursus - Mis Materias y Plan de Estudios')

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
        <div class="prog-val" id="career-progress-pct">0%</div>
        <div class="prog-lbl">Avance de Carrera</div>
      </div>
    </div>

    <div class="progression-card">
      <div class="prog-icon">🎓</div>
      <div class="prog-info">
        <div class="prog-val" id="career-average">0.00</div>
        <div class="prog-lbl">Promedio General</div>
      </div>
    </div>

    <div class="progression-card">
      <div class="prog-icon">✓</div>
      <div class="prog-info">
        <div class="prog-val" id="career-approved-count">0 / 17</div>
        <div class="prog-lbl">Materias Aprobadas</div>
      </div>
    </div>
  </div>

  <!-- Selector de Subpestañas (Gestión vs Árbol) -->
  <div class="stabs" style="margin-bottom: 20px;">
    <div class="stab on" id="tab-manage" onclick="window.switchToTab('manage')">🎛️ Gestión de Cursada</div>
    <div class="stab" id="tab-plan" onclick="window.switchToTab('plan')">🗺️ Plan de Estudios</div>
  </div>

  <!-- ================= PESTAÑA: GESTIÓN DE CURSADA (árbol editable) ================= -->
  <div id="panel-manage-view">
    <div class="tree-container">
      <div class="tree-legend">
        <div class="legend-item"><div class="legend-color disponible"></div> Disponible / Cursar</div>
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
  <div id="panel-plan-view" style="display: none;">

    <!-- Filtros Rápidos -->
    <div class="filters-bar">
      <button class="filter-chip active" id="filter-all" onclick="window.setFilter('all')">Todas</button>
      <button class="filter-chip" id="filter-cursando" onclick="window.setFilter('cursando')">Cursando actualmente</button>
      <button class="filter-chip" id="filter-regular" onclick="window.setFilter('regular')">Regulares (Final Pendiente)</button>
      <button class="filter-chip" id="filter-aprobada" onclick="window.setFilter('aprobada')">Aprobadas</button>
      <button class="filter-chip" id="filter-bloqueada" onclick="window.setFilter('bloqueada')">Faltantes (Bloqueadas)</button>
    </div>

    <!-- Listado Agrupado por Niveles -->
    <div id="subjects-grouped-container">
      <!-- Cargado dinámicamente desde materias.js -->
    </div>

  </div>

  <!-- ===================== MODAL DE CALIFICACIONES ===================== -->
  <div class="grade-modal-overlay" id="grade-modal">
    <div class="grade-modal-box">
      <div class="grade-modal-header" id="grade-modal-subject-title">Registrar Calificación</div>
      <div class="grade-modal-body">
        <p style="font-size: 12px; color: var(--t3); line-height: 1.4;">
          Ingresa la nota definitiva obtenida en el examen final o promoción directa:
        </p>
        <div class="grade-select-wrapper">
          <label for="grade-select" style="font-size: 11px; font-weight: 600; color: var(--t2);">Calificación Final:</label>
          <select id="grade-select" class="grade-input-select" style="margin-top: 5px;">
            <option value="4">4 (Cuatro)</option>
            <option value="5">5 (Cinco)</option>
            <option value="6">6 (Seis)</option>
            <option value="7">7 (Siete)</option>
            <option value="8" selected>8 (Ocho)</option>
            <option value="9">9 (Nueve)</option>
            <option value="10">10 (Diez)</option>
          </select>
        </div>
      </div>
      <div class="grade-modal-footer">
        <button class="btn-modal-action cancel" onclick="window.closeGradeModal(false)">Cancelar</button>
        <button class="btn-modal-action save" onclick="window.closeGradeModal(true)">Guardar Nota</button>
      </div>
    </div>
  </div>
@endsection

@push('scripts')
  <script src="{{ asset('js/materias.js') }}"></script>
@endpush
