@extends('layouts.app')

@section('title', 'Cursus - Mi Progreso')

@push('styles')
<style>
    /* Estilos específicos para la página de Progreso y Gráficos SVG */
    .chart-card {
        background: var(--surface);
        border-radius: var(--r);
        border: 1px solid var(--border);
        padding: 20px;
        margin-top: 16px;
        box-shadow: var(--sh-sm);
    }
    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    .chart-title {
        font-size: 14px;
        font-weight: 700;
        color: var(--t1);
    }
    .chart-container {
        position: relative;
        width: 100%;
        height: 220px;
    }
    .svg-chart {
        width: 100%;
        height: 100%;
    }
    .chart-tooltip {
        position: absolute;
        background: #1e293b;
        color: #ffffff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 11px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        z-index: 10;
    }
    .chart-legend {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 12px;
        flex-wrap: wrap;
    }
    .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--t2);
    }
    .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
    }
    
    /* Layout de Productividad */
    .prod-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 20px;
        margin-top: 20px;
    }
    @media (max-width: 992px) {
        .prod-grid {
            grid-template-columns: 1fr;
        }
    }
    .stat-badge-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
    }
    .stat-badge-card {
        background: var(--brand-light);
        border: 1px solid var(--brand-dim);
        border-radius: var(--r-sm);
        padding: 14px;
        text-align: center;
    }
    .stat-badge-val {
        font-size: 24px;
        font-weight: 700;
        color: var(--brand);
        margin-bottom: 4px;
    }
    .stat-badge-lbl {
        font-size: 11px;
        font-weight: 600;
        color: var(--t2);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Heatmap de Actividad */
    .heatmap-wrap {
        margin-top: 16px;
    }
    .heatmap-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--t2);
        margin-bottom: 8px;
    }
    .heatmap-grid {
        display: grid;
        grid-template-columns: repeat(15, 1fr);
        gap: 4px;
    }
    .heatmap-day {
        aspect-ratio: 1;
        background-color: #f3f4f6;
        border-radius: 2px;
        cursor: pointer;
        transition: transform 0.1s;
    }
    .heatmap-day:hover {
        transform: scale(1.2);
        z-index: 2;
    }
    .heatmap-day.lvl-1 { background-color: #c7d2fe; }
    .heatmap-day.lvl-2 { background-color: #818cf8; }
    .heatmap-day.lvl-3 { background-color: #4f46e5; }
    .heatmap-day.lvl-4 { background-color: #312e81; }
    
    .donut-legend-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
    }
    .donut-legend-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        padding-bottom: 6px;
        border-bottom: 1px dashed var(--border);
    }
    .donut-legend-name {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--t1);
        font-weight: 500;
      }
    .donut-legend-pct {
        font-weight: 600;
        color: var(--t2);
    }
    
    /* Estilos para la tarjeta de tip/sugerencia de productividad */
    .tip-box {
        background-color: #faf5ff;
        border: 1px solid #e9d5ff;
        border-radius: var(--r-sm);
        padding: 12px;
    }
    .tip-box .tip-title {
        font-size: 12px;
        font-weight: 700;
        color: #7e22ce;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .tip-box .tip-body {
        font-size: 11.5px;
        color: #6b21a8;
        margin-top: 4px;
        line-height: 1.4;
    }
</style>
@endpush

@section('mobile-header')
<div class="mob-hdr">
  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
    <div style="display: flex; flex-direction: column;">
      <div class="mob-greet">Mi Progreso 📈</div>
      <div class="mob-sub">Estadísticas y rendimiento</div>
    </div>
  </div>
</div>
@endsection

@section('topbar-content')
  <div class="topbar-title">Mi Progreso 📈</div>
@endsection

@section('content')
  <!-- Stat Cards de Resumen -->
  <div class="stats avg-stats">
    <div class="stat card-real-avg">
      <span class="stat-ic">🎓</span>
      <div>
        <div class="stat-title">Promedio Real</div>
        <div class="stat-val" id="real-avg-val">0.00</div>
        <div class="stat-lbl" id="real-avg-lbl">0 materias aprobadas</div>
      </div>
    </div>
    <div class="stat card-proj-avg">
      <span class="stat-ic">📊</span>
      <div>
        <div class="stat-title">Promedio Proyectado</div>
        <div class="stat-val" id="proj-avg-val">0.00</div>
        <div class="stat-lbl" id="proj-avg-lbl">Simulando 0 finales</div>
      </div>
    </div>
    <div class="stat card-proj-grad">
      <span class="stat-ic">📅</span>
      <div>
        <div class="stat-title">Egreso Proyectado</div>
        <div class="stat-val" id="proj-grad-val">-</div>
        <div class="stat-lbl" id="proj-grad-lbl">Ritmo: 2 por cuatrimestre</div>
      </div>
    </div>
  </div>

  <!-- Selector de Subpestañas (Académico vs Productividad) -->
  <div class="stabs" style="margin-bottom: 20px; margin-top: 10px;">
    <div class="stab on" id="tab-academic" onclick="window.switchToTab('academic')">🎓 Rendimiento Académico</div>
    <div class="stab" id="tab-productivity" onclick="window.switchToTab('productivity')">⚡ Productividad de Estudio</div>
  </div>

  <!-- ================= PESTAÑA: RENDIMIENTO ACADÉMICO ================= -->
  <div id="panel-academic-view">
    <div class="dash avg-dash">

      <!-- COLUMNA IZQUIERDA: Simulador de Finales -->
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
                <span class="formula-math" id="formula-text">P = (0.0 + Σ Notas) / (0 + N)</span>
              </div>
              <div class="formula-body">
                <div class="formula-row">
                  <span>Suma al promedio histórico</span>
                  <span class="improvement-badge" id="improvement-label">+0.00 pts de mejora</span>
                </div>
                <!-- Barra de progreso comparativa -->
                <div class="comparison-bar-wrap">
                  <div class="bar-base"></div>
                  <div class="bar-real" id="bar-real-fill" style="width: 0%;"></div>
                  <div class="bar-proj" id="bar-proj-fill" style="width: 0%;"></div>
                </div>
                <div class="bar-legend">
                  <div class="leg-item"><span class="leg-dot real"></span><span id="leg-real-text">0.00 Real</span></div>
                  <div class="leg-item"><span class="leg-dot proj"></span><span id="leg-proj-text">0.00 Proyectado</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA: Proyección y Gráficos Académicos -->
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
                <span class="m-val" id="m-remaining">- materias</span>
              </div>
              <div class="metric-row">
                <span class="m-lbl">Cuatrimestres necesarios:</span>
                <span class="m-val" id="m-semesters">- cuatrimestres</span>
              </div>
              <div class="metric-row">
                <span class="m-lbl">Años estimados:</span>
                <span class="m-val" id="m-years">- años</span>
              </div>
              <hr class="metric-divider">
              <div class="metric-row highlight">
                <span class="m-lbl font-bold brand-color-text">EGRESO PROYECTADO:</span>
                <span class="m-val font-bold brand-color-text" id="m-grad-date">-</span>
              </div>
            </div>

            <div class="sug-path-wrap">
              <span class="sug-path-title">Trayecto sugerido:</span>
              <div class="sug-path-grid" id="suggested-path-grid">
                <!-- Se poblará dinámicamente con JS -->
              </div>
            </div>

            <!-- Botón de guardar progreso -->
            <div style="margin-top: 16px; text-align: right;">
              <button class="btn-primary btn-save-avg" id="btn-save-progress">
                Guardar Simulación
              </button>
            </div>
          </div>
        </div>

        <!-- Gráfico 1: Evolución del Promedio -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Evolución del Promedio General</span>
            <span class="stat-badge-lbl" style="color: var(--brand);">Histórico</span>
          </div>
          <div class="chart-container" id="container-chart-line">
            <div class="chart-tooltip" id="tooltip-chart-line"></div>
            <!-- SVG se dibuja dinámicamente -->
          </div>
        </div>

        <!-- Gráfico 2: Histograma de Notas -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Distribución de Calificaciones</span>
            <span class="stat-badge-lbl" style="color: var(--brand);">Finales</span>
          </div>
          <div class="chart-container" id="container-chart-histo">
            <div class="chart-tooltip" id="tooltip-chart-histo"></div>
            <!-- SVG se dibuja dinámicamente -->
          </div>
        </div>
      </div>

    </div><!-- /dash -->
  </div><!-- /panel-academic-view -->

  <!-- ================= PESTAÑA: PRODUCTIVIDAD Y ESTUDIO ================= -->
  <div id="panel-productivity-view" style="display: none;">
    <div class="prod-grid">
      
      <!-- PRODUCTIVIDAD COLUMNA IZQUIERDA: Horas y Racha -->
      <div class="col-left">
        <!-- Tarjetas rápidas de racha -->
        <div class="stat-badge-group">
          <div class="stat-badge-card">
            <div class="stat-badge-val" id="prod-streak-now">–</div>
            <div class="stat-badge-lbl">Racha Actual</div>
          </div>
          <div class="stat-badge-card">
            <div class="stat-badge-val" id="prod-streak-best">–</div>
            <div class="stat-badge-lbl">Mejor Racha</div>
          </div>
        </div>

        <!-- Gráfico 3: Horas Semanales -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Horas de Concentración (Últimos 7 días)</span>
            <span class="stat-badge-lbl" id="total-weekly-hours-lbl">Total: 0h 0m</span>
          </div>
          <div class="chart-container" id="container-chart-weekly">
            <div class="chart-tooltip" id="tooltip-chart-weekly"></div>
            <!-- SVG se dibuja dinámicamente -->
          </div>
        </div>

        <!-- Heatmap de hábitos de estudio -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Intensidad de Hábitos (Últimos 45 días)</span>
            <span class="stat-badge-lbl" style="color: var(--brand);">Pomodoros</span>
          </div>
          <div class="heatmap-wrap">
            <div class="heatmap-grid" id="activity-heatmap-grid">
              <!-- Se rellena con JS -->
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; color: var(--tm);">
              <span>Hace 45 días</span>
              <div style="display: flex; gap: 4px; align-items: center;">
                <span>Menos</span>
                <div class="heatmap-day" style="width: 10px; height: 10px; display: inline-block;"></div>
                <div class="heatmap-day lvl-1" style="width: 10px; height: 10px; display: inline-block;"></div>
                <div class="heatmap-day lvl-2" style="width: 10px; height: 10px; display: inline-block;"></div>
                <div class="heatmap-day lvl-3" style="width: 10px; height: 10px; display: inline-block;"></div>
                <div class="heatmap-day lvl-4" style="width: 10px; height: 10px; display: inline-block;"></div>
                <span>Más</span>
              </div>
              <span>Hoy</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PRODUCTIVIDAD COLUMNA DERECHA: Distribución y Proyecciones -->
      <div class="col-right">
        <!-- Gráfico 4: Donut Chart de Distribución -->
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">Distribución por Materia</span>
          </div>
          <div class="chart-container" id="container-chart-donut" style="height: 180px; display: flex; justify-content: center; align-items: center;">
            <!-- SVG Donut dibujado con JS -->
          </div>
          <div class="donut-legend-list" id="donut-legend-container">
            <!-- Se rellena con JS -->
          </div>
        </div>

        <!-- Tarjeta de Análisis de Hábitos -->
        <div class="chart-card" style="margin-top: 16px;">
          <div class="chart-title" style="margin-bottom: 12px;">Estimación de Enfoque</div>
          <p id="prod-focus-hour-text" style="font-size: 12.5px; color: var(--t2); line-height: 1.5; margin: 0 0 12px 0;">
            Cargando...
          </p>
          <div class="tip-box">
            <div class="tip-title">
              <span>💡 Tip de Rendimiento</span>
            </div>
            <div class="tip-body" id="prod-tip-body">
              Cargando...
            </div>
          </div>
        </div>
      </div>

    </div><!-- /prod-grid -->
  </div><!-- /panel-productivity-view -->
@endsection

@push('scripts')
  <script type="module" src="{{ asset('js/views/progreso/progreso-main.js') }}"></script>
@endpush
