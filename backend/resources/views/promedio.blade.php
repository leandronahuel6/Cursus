@extends('layouts.app')

@section('title', 'Cursus - Calculadora de Promedio')

@section('mobile-header')
  <div class="mob-hdr">
    <div class="mob-lbl">Académico</div>
    <div class="mob-name">Calculadora de Promedio</div>
  </div>
@endsection

@section('topbar-content')
  <div class="breadcrumb">
    <a href="{{ route('dashboard') }}">Inicio</a>
    <span class="sep">›</span>
    <span class="cur">Calculadora de Promedio</span>
  </div>
@endsection

@section('content')
  <!-- Stat Cards -->
  <div class="stats avg-stats">
    <div class="stat card-real-avg">
      <span class="stat-ic">🎓</span>
      <div>
        <div class="stat-title">Promedio Real</div>
        <div class="stat-val" id="real-avg-val">7.20</div>
        <div class="stat-lbl" id="real-avg-lbl">12 materias aprobadas</div>
      </div>
    </div>
    <div class="stat card-proj-avg">
      <span class="stat-ic">📊</span>
      <div>
        <div class="stat-title">Promedio Proyectado</div>
        <div class="stat-val" id="proj-avg-val">7.20</div>
        <div class="stat-lbl" id="proj-avg-lbl">Simulando 0 finales</div>
      </div>
    </div>
    <div class="stat card-proj-grad">
      <span class="stat-ic">📅</span>
      <div>
        <div class="stat-title">Egreso Proyectado</div>
        <div class="stat-val" id="proj-grad-val">Diciembre 2027</div>
        <div class="stat-lbl" id="proj-grad-lbl">Ritmo: 2 por cuatrimestre</div>
      </div>
    </div>
  </div>

  <!-- Dashboard Layout -->
  <div class="dash avg-dash">

    <!-- COLUMN LEFT: Simulation -->
    <div class="col left">
      <div class="card avg-card">
        <div class="card-hd dark-header">
          <div class="card-title">Simular notas hipotéticas en finales</div>
        </div>
        <div class="card-body">
          <div class="sim-list" id="sim-subjects-list">
            <!-- Se poblará dinámicamente con JS -->
          </div>

          <!-- Formula Card -->
          <div class="formula-container">
            <div class="formula-hd">
              <span class="formula-title">Fórmula de promedio proyectado</span>
              <span class="formula-math" id="formula-text">P = (86.4 + Σ Notas) / (12 + N)</span>
            </div>
            <div class="formula-body">
              <div class="formula-row">
                <span>Suma al promedio histórico</span>
                <span class="improvement-badge" id="improvement-label">+0.00 pts de mejora</span>
              </div>
              <!-- Barra de progreso comparativa -->
              <div class="comparison-bar-wrap">
                <div class="bar-base"></div>
                <div class="bar-real" id="bar-real-fill" style="width: 72%;"></div>
                <div class="bar-proj" id="bar-proj-fill" style="width: 72%;"></div>
              </div>
              <div class="bar-legend">
                <div class="leg-item"><span class="leg-dot real"></span><span id="leg-real-text">7.20 Real</span></div>
                <div class="leg-item"><span class="leg-dot proj"></span><span id="leg-proj-text">7.20 Proyectado</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- COLUMN RIGHT: Projections -->
    <div class="col right">
      <div class="card avg-card">
        <div class="card-hd dark-header">
          <div class="card-title">Proyección Académica</div>
        </div>
        <div class="card-body projection-body">
          <div class="pace-selector-wrap">
            <span class="pace-label">Aprobadas por cuatrimestre:</span>
            <div class="pace-stepper">
              <button class="pace-btn" onclick="adjustPace(-1)">-</button>
              <span class="pace-val" id="pace-value">2</span>
              <button class="pace-btn" onclick="adjustPace(1)">+</button>
            </div>
          </div>

          <div class="metrics-box">
            <div class="metric-row">
              <span class="m-lbl">Materias restantes:</span>
              <span class="m-val" id="m-remaining">8 materias</span>
            </div>
            <div class="metric-row">
              <span class="m-lbl">Cuatrimestres necesarios:</span>
              <span class="m-val" id="m-semesters">4 cuatrimestres</span>
            </div>
            <div class="metric-row">
              <span class="m-lbl">Años estimados:</span>
              <span class="m-val" id="m-years">2.0 años</span>
            </div>
            <hr class="metric-divider">
            <div class="metric-row highlight">
              <span class="m-lbl font-bold brand-color-text">EGRESO PROYECTADO:</span>
              <span class="m-val font-bold brand-color-text" id="m-grad-date">Diciembre 2027</span>
            </div>
          </div>

          <div class="sug-path-wrap">
            <span class="sug-path-title">Trayecto sugerido:</span>
            <div class="sug-path-grid" id="suggested-path-grid">
              <!-- Se poblará dinámicamente con JS -->
            </div>
          </div>

          <div style="margin-top: 24px; text-align: right;">
            <button class="btn-primary btn-save-avg" id="btn-save-progress">
              Guardar Progreso
            </button>
          </div>
        </div>
      </div>
    </div>

  </div><!-- /avg-dash -->
@endsection

@push('scripts')
  <script src="{{ asset('js/promedio.js') }}"></script>
@endpush
