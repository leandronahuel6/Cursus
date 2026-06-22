@extends('layouts.app')

@section('title', 'Cursus - Área de Concentración')

@section('mobile-header')
  <div class="mob-hdr">
    <div class="mob-lbl">Área de Estudio</div>
    <div class="mob-name">Área de Estudio</div>
    <div class="mob-row">
      <span class="badge b-reg">Regular</span>
      <span style="font-size:11px;color:#6b7280">2° año · 2024</span>
    </div>
  </div>
@endsection

@section('topbar-content')
  <div class="breadcrumb">
    <a href="{{ route('dashboard') }}">Inicio</a>
    <span class="sep">›</span>
    <span class="cur">Área de Estudio</span>
  </div>
  <div class="tb-right">
    <button class="focus-btn" onclick="toggleFocus()">⊙ Modo concentración</button>
  </div>
@endsection

@section('content')
  <!-- Materia header -->
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
      <!-- Selector de materia (solo las que estoy cursando) -->
      <div class="mat-dropdown" id="materia-dropdown"></div>
    </div>
    <div class="mat-chips">
      <div class="mat-chip"><div class="mat-chip-v" id="chip-horas-semana">0h</div><div class="mat-chip-l">esta semana</div></div>
      <div class="mat-chip"><div class="mat-chip-v" id="chip-sesiones-totales">0</div><div class="mat-chip-l">🍅 totales</div></div>
      <div class="mat-chip"><div class="mat-chip-v">4</div><div class="mat-chip-l">online ahora</div></div>
    </div>
  </div>

  <!-- Split -->
  <div class="split">

    <!-- FOCUS CARD -->
    <div class="focus-card">
      <div class="ptabs">
        <div class="ptab on"  onclick="setMode(25,this)">🍅 Pomodoro · 25 min</div>
        <div class="ptab"     onclick="setMode(5,this)" >☕ Corto · 5 min</div>
        <div class="ptab"     onclick="setMode(15,this)">🧘 Largo · 15 min</div>
      </div>

      <div class="focus-body">

        <!-- Ring -->
        <div class="ring-wrap" id="ring-wrap">
          <svg width="176" height="176" viewBox="0 0 176 176">
            <defs>
              <linearGradient id="grd" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#c4b5fd"/>
              </linearGradient>
            </defs>
            <circle class="r-bg"   cx="88" cy="88" r="70"/>
            <circle class="r-prog" cx="88" cy="88" r="70" id="rp"/>
          </svg>
          <div class="ring-center">
            <span class="ring-t" id="ptime">25:00</span>
            <span class="ring-s" id="psub">Sesión 3 de 4</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="pomo-ctrls">
          <button class="ctrl" onclick="resetPomo()" title="Reiniciar">⟳</button>
          <button class="ctrl play" id="play-btn" onclick="togglePomo()">▶</button>
          <button class="ctrl" onclick="skipPomo()" title="Saltear">⏭</button>
        </div>

        <!-- Dots -->
        <div class="dots" id="dots">
          <div class="dot done"></div>
          <div class="dot done"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>

        <!-- Session log -->
        <div class="slog">
          <div class="slog-title">Sesiones completadas hoy</div>
          <div id="log-extra"></div>
        </div>

      </div>
    </div><!-- /focus-card -->

    <!-- COMMUNITY -->
    <div class="community">
      <div class="cp-head">
        <div class="cp-ttl">
          <div class="live"></div>
          Compañeros estudiando ahora
        </div>
        <div class="cp-sub">4 activos en Programación II</div>
      </div>

      <div class="cp-list">
        <div class="cp-user">
          <div class="cp-av" style="background:linear-gradient(135deg,#06b6d4,#0284c7)">LG</div>
          <div class="cp-inf">
            <div class="cp-name">Laura G.</div>
            <div class="cp-time">Hace 45 min</div>
          </div>
          <div class="cp-pom">🍅 × 2</div>
        </div>
        <div class="cp-user">
          <div class="cp-av" style="background:linear-gradient(135deg,#10b981,#059669)">MR</div>
          <div class="cp-inf">
            <div class="cp-name">Mateo R.</div>
            <div class="cp-time">Hace 18 min</div>
          </div>
          <div class="cp-pom">🍅 × 1</div>
        </div>
        <div class="cp-user">
          <div class="cp-av" style="background:linear-gradient(135deg,#f59e0b,#d97706)">AL</div>
          <div class="cp-inf">
            <div class="cp-name">Ana L.</div>
            <div class="cp-time">Hace 1h 12 min</div>
          </div>
          <div class="cp-pom">🍅 × 3</div>
        </div>
        <div class="cp-user">
          <div class="cp-av" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)">FM</div>
          <div class="cp-inf">
            <div class="cp-name">Franco M.</div>
            <div class="cp-time">Hace 5 min</div>
          </div>
          <div class="cp-pom">🍅 × 0</div>
        </div>
      </div>

      <div class="cp-foot">
        💡 Todos están estudiando en silencio.<br>Tu concentración también los motiva.
      </div>
    </div>

  </div><!-- /split -->

  <!-- Kanban + Marcadores -->
  <div>
    <div class="stabs">
      <div class="stab on" onclick="switchTab('kanban',this)">☑ Tareas de esta materia</div>
      <div class="stab"    onclick="switchTab('marcadores',this)">🔗 Marcadores</div>
    </div>

    <!-- KANBAN -->
    <div class="panel on" id="panel-kanban">
      <div class="kanban">

        <!-- Pendiente -->
        <div class="kbcol" id="col-pending"
          ondragover="allowDrop(event)"
          ondrop="dropCard(event,'pending')"
          ondragleave="leaveDrop(event)">
          <div class="kbcol-hd">
            <div class="kbcol-name"><div class="kbdot kd-p"></div>Pendiente</div>
            <span class="kbcnt" id="cnt-pending">3</span>
          </div>
          <div class="kbcards" id="cards-pending"></div>
          <button class="kb-add" onclick="addCard('pending')">+ Agregar tarea</button>
        </div>

        <!-- En Curso -->
        <div class="kbcol" id="col-progress"
          ondragover="allowDrop(event)"
          ondrop="dropCard(event,'progress')"
          ondragleave="leaveDrop(event)">
          <div class="kbcol-hd">
            <div class="kbcol-name"><div class="kbdot kd-c"></div>En Curso</div>
            <span class="kbcnt" id="cnt-progress">1</span>
          </div>
          <div class="kbcards" id="cards-progress"></div>
          <button class="kb-add" onclick="addCard('progress')">+ Agregar tarea</button>
        </div>

        <!-- Finalizado -->
        <div class="kbcol" id="col-done"
          ondragover="allowDrop(event)"
          ondrop="dropCard(event,'done')"
          ondragleave="leaveDrop(event)">
          <div class="kbcol-hd">
            <div class="kbcol-name"><div class="kbdot kd-f"></div>Finalizado</div>
            <span class="kbcnt" id="cnt-done">2</span>
          </div>
          <div class="kbcards" id="cards-done"></div>
          <button class="kb-add" onclick="addCard('done')">+ Agregar tarea</button>
        </div>

      </div>
    </div><!-- /kanban -->

    <!-- MARCADORES -->
    <div class="panel" id="panel-marcadores">
      <div class="bmwrap">
        <div class="bm-form">
          <div class="bm-form-title">Agregar marcador</div>
          <div class="bm-row">
            <input id="bm-url"   class="bm-inp url" type="url"  placeholder="https://...">
            <input id="bm-title" class="bm-inp"     type="text" placeholder="Título (opcional)">
            <button class="bm-save" onclick="addBookmark()">Guardar</button>
          </div>
        </div>
        <div class="bm-list" id="bm-list"></div>
      </div>
    </div><!-- /marcadores -->

  </div><!-- /tabs wrapper -->
@endsection

@push('scripts')
  <script src="{{ asset('js/area-estudio.js') }}"></script>
@endpush
