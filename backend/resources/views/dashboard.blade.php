@extends('layouts.app')

@section('title', 'Cursus - Inicio')

@php
  $dashboardNow = now()->locale('es');
  $userName = $viewerFirstName ?? 'Estudiante';
  $greeting = match (true) {
      (int) $dashboardNow->format('G') < 12 => 'Buen día',
      (int) $dashboardNow->format('G') < 20 => 'Buenas tardes',
      default => 'Buenas noches',
  };
  $formattedDate = ucfirst($dashboardNow->translatedFormat('l j \\d\\e F'));
@endphp

@section('mobile-header')
  <!-- Mobile header -->
  <div class="mob-hdr">
    <div class="mob-greet"><span id="greet-text-mob">{{ $greeting }}</span>, <span class="greeting-name">{{ $userName }}</span> 👋</div>
    <div class="mob-sub">
      {{ $formattedDate }}
      <span class="mob-stk skel" id="mob-racha">🔥 0 días</span>
    </div>
  </div>
@endsection

@section('topbar-content')
  <div class="topbar-title"><span id="greet-text-topbar">{{ $greeting }}</span>, <span class="greeting-name">{{ $userName }}</span> <span>👋</span></div>
  <button class="btn-primary" onclick="location.href='{{ route('area-estudio') }}'">▶ Empezar sesión</button>
@endsection

@section('content')
  <!-- Alert -->
  <div class="alert" id="js-alert" style="display:none;">
    <div class="alert-dot"></div>
    <div class="alert-txt">
      <strong>Alerta próxima:</strong> <span id="js-alert-text"></span> <a href="{{ route('alertas') }}" style="text-decoration: underline; font-weight: 600;">Ver alertas</a>
    </div>
    <button class="alert-x" onclick="document.getElementById('js-alert').remove()">✕</button>
  </div>

  <!-- Stats Grid -->
  <div class="stats">
    <div class="stat">
      <span class="stat-ic">⏱️</span>
      <div class="stat-val skel" id="stat-horas-semana">0h</div>
      <div class="stat-lbl">Horas esta semana</div>
    </div>
    <div class="stat">
      <span class="stat-ic">🔥</span>
      <div class="stat-val skel" id="stat-racha">0 días</div>
      <div class="stat-lbl">Racha actual</div>
    </div>
    <div class="stat">
      <span class="stat-ic">📚</span>
      <div class="stat-val skel" id="stat-materias-activas">0</div>
      <div class="stat-lbl">Materias activas</div>
    </div>
    <div class="stat">
      <span class="stat-ic">⚠️</span>
      <div class="stat-val skel" id="stat-tareas-pendientes">0</div>
      <div class="stat-lbl">Tareas pendientes</div>
    </div>
  </div>

  <!-- Dashboard Grid -->
  <div class="dash">

    <!-- LEFT COLUMN -->
    <div class="col left">

      <!-- Materias -->
      <div class="card">
        <div class="card-hd">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#4f46e5" stroke-width="1.4"/>
              <path d="M5 6h6M5 9h4" stroke="#4f46e5" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            Materias este cuatrimestre
          </div>
          <div class="card-link" onclick="location.href='{{ route('materias') }}'">Ver todas →</div>
        </div>
        <div class="card-body">
          <div class="mats-grid" id="mats-grid"></div>
        </div>
      </div>

      <!-- Tareas urgentes -->
      <div class="card">
        <div class="card-hd">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v5" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
              <circle cx="8" cy="12" r="1" fill="#f97316"/>
              <circle cx="8" cy="8" r="6.5" stroke="#f97316" stroke-width="1.4"/>
            </svg>
            Entregas próximas
          </div>
          <div class="card-link" onclick="location.href='{{ route('area-estudio') }}'">Ver Kanban →</div>
        </div>
        <div class="card-body" id="tareas-proximas-body"></div>
      </div>

    </div><!-- /left -->

    <!-- RIGHT COLUMN -->
    <div class="col right">

      <!-- Acceso rápido al Área de Estudio -->
      <div class="card study-card">

        <!-- Última materia estudiada -->
        <div class="study-hero">
          <div class="study-hero-icon">💻</div>
          <div>
            <div class="study-subject" id="study-hero-subject">—</div>
            <div class="study-sub" id="study-hero-sub">Sin sesiones hoy</div>
          </div>
        </div>

        <!-- CTA principal -->
        <div class="study-cta-wrap">
          <button class="study-cta" onclick="location.href='{{ route('area-estudio') }}'">
            ▶ Continuar estudiando →
          </button>
        </div>

        <!-- Sesiones de hoy -->
        <div class="study-sessions" id="study-sessions">
          <div class="ss-hdr">Sesiones de hoy</div>
          <div id="study-sessions-list">
            <div class="ss-empty" style="padding:10px 0;color:var(--t3);font-size:13px">Todavía no estudiaste hoy.</div>
          </div>
        </div>

        <!-- Estudiar otra materia -->
        <div class="study-others">
          <div class="so-hdr">Estudiar otra materia</div>
          <div id="study-others-list"></div>
        </div>

      </div>

      <!-- Heatmap -->
      <div class="card">
        <div class="hm-wrap">
          <div class="hm-top">
            <div class="hm-title">🗓️ Actividad — 13 semanas</div>
            <div class="hm-streak skel" id="hm-racha">🔥 0 días</div>
          </div>
          <div class="hm-grid" id="hm"></div>
          <div class="hm-leg">
            <span class="hm-lt">Menos</span>
            <div class="hm-sq l0"></div>
            <div class="hm-sq l1"></div>
            <div class="hm-sq l2"></div>
            <div class="hm-sq l3"></div>
            <span class="hm-lt">Más</span>
          </div>
        </div>
      </div>

    </div><!-- /right -->
  </div><!-- /dash -->
@endsection

@push('scripts')
  <script src="{{ asset('js/dashboard.js') }}"></script>
@endpush
