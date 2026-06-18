@extends('layouts.app')

@section('title', 'Cursus - Inicio')

@section('mobile-header')
  <!-- Mobile header -->
  <div class="mob-hdr">
    <div class="mob-greet">Buen día, <span class="greeting-name">Tiago</span> 👋</div>
    <div class="mob-sub">
      Miércoles 3 de junio
      <span class="mob-stk">🔥 8 días</span>
    </div>
  </div>
@endsection

@section('topbar-content')
  <div class="topbar-title">Buen día, <span class="greeting-name">Tiago</span> <span>👋</span></div>
  <div class="streak-chip">🔥 8 días de racha</div>
  <button class="btn-primary" onclick="location.href='{{ route('area-estudio') }}'">▶ Empezar sesión</button>
@endsection

@section('content')
  <!-- Alert -->
  <div class="alert" id="js-alert">
    <div class="alert-dot"></div>
    <div class="alert-txt">
      <strong>Alerta próxima:</strong> Pago de cuota de la carrera vence en 3 días (15 de junio). <a href="{{ route('alertas') }}" style="text-decoration: underline; font-weight: 600;">Ver alertas</a>
    </div>
    <button class="alert-x" onclick="document.getElementById('js-alert').remove()">✕</button>
  </div>

  <!-- Stats Grid -->
  <div class="stats">
    <div class="stat">
      <span class="stat-ic">⏱️</span>
      <div class="stat-val">12h 40m</div>
      <div class="stat-lbl">Horas esta semana</div>
    </div>
    <div class="stat">
      <span class="stat-ic">🔥</span>
      <div class="stat-val">8 días</div>
      <div class="stat-lbl">Racha actual</div>
    </div>
    <div class="stat">
      <span class="stat-ic">📚</span>
      <div class="stat-val">4</div>
      <div class="stat-lbl">Materias activas</div>
    </div>
    <div class="stat">
      <span class="stat-ic">⚠️</span>
      <div class="stat-val">5</div>
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
          <div class="mats-grid">

            <div class="mat" onclick="location.href='{{ route('area-estudio') }}'">
              <div class="mat-top">
                <div class="mat-name">Programación II</div>
                <span class="badge b-reg">Regular</span>
              </div>
              <div class="mat-bar"><div class="mat-fill" style="width:65%"></div></div>
              <div class="mat-ft">
                <span class="mat-h">8h esta semana</span>
                <span class="mat-ar">→</span>
              </div>
            </div>

            <div class="mat" onclick="location.href='{{ route('area-estudio') }}'">
              <div class="mat-top">
                <div class="mat-name">Análisis Matemático I</div>
                <span class="badge b-apr">Aprobada</span>
              </div>
              <div class="mat-bar"><div class="mat-fill" style="width:100%"></div></div>
              <div class="mat-ft">
                <span class="mat-h">Final rendido ✓</span>
                <span class="mat-ar">→</span>
              </div>
            </div>

            <div class="mat" onclick="location.href='{{ route('area-estudio') }}'">
              <div class="mat-top">
                <div class="mat-name">Laboratorio I</div>
                <span class="badge b-reg">Regular</span>
              </div>
              <div class="mat-bar"><div class="mat-fill" style="width:80%"></div></div>
              <div class="mat-ft">
                <span class="mat-h">3h esta semana</span>
                <span class="mat-ar">→</span>
              </div>
            </div>

            <div class="mat dim" onclick="location.href='{{ route('area-estudio') }}'">
              <div class="mat-top">
                <div class="mat-name">Estadística</div>
                <span class="badge b-cur">Cursando</span>
              </div>
              <div class="mat-bar"><div class="mat-fill" style="width:20%"></div></div>
              <div class="mat-ft">
                <span class="mat-h">1h esta semana</span>
              </div>
            </div>

          </div>
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
        <div class="card-body">

          <div class="task" onclick="location.href='{{ route('area-estudio') }}'">
            <div class="task-dot d-red"></div>
            <div class="task-inf">
              <div class="task-name">TP N°2 — Calculadora en C</div>
              <div class="task-sub">Programación II</div>
            </div>
            <div class="task-due urg">En 2 días</div>
          </div>

          <div class="task" onclick="location.href='{{ route('area-estudio') }}'">
            <div class="task-dot d-org"></div>
            <div class="task-inf">
              <div class="task-name">Informe de Laboratorio</div>
              <div class="task-sub">Laboratorio I</div>
            </div>
            <div class="task-due mid">En 5 días</div>
          </div>

          <div class="task" onclick="location.href='{{ route('area-estudio') }}'">
            <div class="task-dot d-ylw"></div>
            <div class="task-inf">
              <div class="task-name">Parcial domiciliario</div>
              <div class="task-sub">Estadística</div>
            </div>
            <div class="task-due">En 8 días</div>
          </div>

          <div class="task" onclick="location.href='{{ route('area-estudio') }}'">
            <div class="task-dot d-grn"></div>
            <div class="task-inf">
              <div class="task-name">Práctica 4 — Recursividad</div>
              <div class="task-sub">Programación II</div>
            </div>
            <div class="task-due">En 12 días</div>
          </div>

        </div>
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
            <div class="study-subject">Programación II</div>
            <div class="study-sub">Última sesión: hoy, 14:35 · 2 sesiones hoy</div>
          </div>
        </div>

        <!-- CTA principal -->
        <div class="study-cta-wrap">
          <button class="study-cta" onclick="location.href='{{ route('area-estudio') }}'">
            ▶ Continuar estudiando →
          </button>
          <div class="study-cta-meta">
            <div class="study-live-dot"></div>
            4 compañeros activos en esta materia ahora
          </div>
        </div>

        <!-- Sesiones de hoy -->
        <div class="study-sessions">
          <div class="ss-hdr">Sesiones de hoy</div>
          <div class="ss-item">
            <div class="ss-dot"></div>
            <div class="ss-info">
              <div class="ss-mat">Programación II</div>
              <div class="ss-time">14:05 — 14:30</div>
            </div>
            <div class="ss-dur">🍅 25 min</div>
          </div>
          <div class="ss-item">
            <div class="ss-dot"></div>
            <div class="ss-info">
              <div class="ss-mat">Programación II</div>
              <div class="ss-time">14:35 — 15:00</div>
            </div>
            <div class="ss-dur">🍅 25 min</div>
          </div>
          <div class="ss-total">Total hoy: 50 min · 🍅 × 2</div>
        </div>

        <!-- Estudiar otra materia -->
        <div class="study-others">
          <div class="so-hdr">Estudiar otra materia</div>
          <div class="so-item" onclick="location.href='{{ route('area-estudio') }}'">
            <span>📐 Análisis Matemático I</span><span>→</span>
          </div>
          <div class="so-item" onclick="location.href='{{ route('area-estudio') }}'">
            <span>🔬 Laboratorio I</span><span>→</span>
          </div>
          <div class="so-item" onclick="location.href='{{ route('area-estudio') }}'">
            <span>📊 Estadística</span><span>→</span>
          </div>
        </div>

      </div>

      <!-- Heatmap -->
      <div class="card">
        <div class="hm-wrap">
          <div class="hm-top">
            <div class="hm-title">🗓️ Actividad — 13 semanas</div>
            <div class="hm-streak">🔥 8 días</div>
          </div>
          <div class="hm-grid" id="hm"></div>
          <div class="hm-leg">
            <span class="hm-lt">Menos</span>
            <div class="hm-sq" style="background:#f3f4f6;border:1px solid #e5e7eb"></div>
            <div class="hm-sq" style="background:#c7d2fe"></div>
            <div class="hm-sq" style="background:#818cf8"></div>
            <div class="hm-sq" style="background:#4f46e5"></div>
            <span class="hm-lt">Más</span>
          </div>
        </div>
      </div>

    </div><!-- /right -->
  </div><!-- /dash -->
@endsection
