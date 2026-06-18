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
    <div class="mat-info">
      <div class="mat-name">Programación II</div>
      <div class="mat-meta">
        <span class="badge b-reg">Regular</span>
        <span class="mat-yr">2° año · Cursada 2024</span>
      </div>
    </div>
    <div class="mat-chips">
      <div class="mat-chip"><div class="mat-chip-v">8h</div><div class="mat-chip-l">esta semana</div></div>
      <div class="mat-chip"><div class="mat-chip-v">23</div><div class="mat-chip-l">🍅 totales</div></div>
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
          <div class="slog-row">
            <span class="slog-t">14:05</span>
            <span class="slog-d">25:00</span>
            <span class="slog-ok">✓ Completada</span>
          </div>
          <div class="slog-row">
            <span class="slog-t">14:35</span>
            <span class="slog-d">25:00</span>
            <span class="slog-ok">✓ Completada</span>
          </div>
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
          <div class="kbcards" id="cards-pending">
            <div class="kbcard" id="c1" draggable="true" ondragstart="dStart(event,'c1')" ondragend="dEnd(event)">
              <div class="kb-title">TP N°2 — Calculadora en C</div>
              <div class="kb-meta urg">⚠ Vence 5 jun</div>
              <button class="kb-del" onclick="delCard('c1')">✕</button>
            </div>
            <div class="kbcard" id="c2" draggable="true" ondragstart="dStart(event,'c2')" ondragend="dEnd(event)">
              <div class="kb-title">Práctica 4 — Recursividad</div>
              <div class="kb-meta">📅 Vence 15 jun</div>
              <button class="kb-del" onclick="delCard('c2')">✕</button>
            </div>
            <div class="kbcard" id="c3" draggable="true" ondragstart="dStart(event,'c3')" ondragend="dEnd(event)">
              <div class="kb-title">Leer cap. 7 — Punteros</div>
              <div class="kb-meta">Sin fecha</div>
              <button class="kb-del" onclick="delCard('c3')">✕</button>
            </div>
          </div>
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
          <div class="kbcards" id="cards-progress">
            <div class="kbcard" id="c4" draggable="true" ondragstart="dStart(event,'c4')" ondragend="dEnd(event)">
              <div class="kb-title">Ejercicios de repaso — Parcial 2</div>
              <div class="kb-meta">📅 Parcial el 20 jun</div>
              <button class="kb-del" onclick="delCard('c4')">✕</button>
            </div>
          </div>
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
          <div class="kbcards" id="cards-done">
            <div class="kbcard" id="c5" draggable="true" ondragstart="dStart(event,'c5')" ondragend="dEnd(event)" style="opacity:.55">
              <div class="kb-title" style="text-decoration:line-through;color:var(--t3)">TP N°1 — Hola Mundo y variables</div>
              <div class="kb-meta">✓ Entregado 10 may</div>
              <button class="kb-del" onclick="delCard('c5')">✕</button>
            </div>
            <div class="kbcard" id="c6" draggable="true" ondragstart="dStart(event,'c6')" ondragend="dEnd(event)" style="opacity:.55">
              <div class="kb-title" style="text-decoration:line-through;color:var(--t3)">Prácticas 1, 2 y 3</div>
              <div class="kb-meta">✓ Completadas</div>
              <button class="kb-del" onclick="delCard('c6')">✕</button>
            </div>
          </div>
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
        <div class="bm-list" id="bm-list">
          <div class="bm-item">
            <div class="bm-ic">🎥</div>
            <div class="bm-inf">
              <div class="bm-name">Tutorial punteros en C — YouTube</div>
              <div class="bm-url">https://youtube.com/watch?v=zuegQmMdy8M</div>
            </div>
            <a href="https://youtube.com/watch?v=zuegQmMdy8M" target="_blank" rel="noopener" class="bm-open">↗</a>
            <button class="bm-del" onclick="this.parentElement.remove()">✕</button>
          </div>
          <div class="bm-item">
            <div class="bm-ic">💬</div>
            <div class="bm-inf">
              <div class="bm-name">StackOverflow — diferencia malloc vs calloc</div>
              <div class="bm-url">https://stackoverflow.com/questions/1538420</div>
            </div>
            <a href="https://stackoverflow.com/questions/1538420" target="_blank" rel="noopener" class="bm-open">↗</a>
            <button class="bm-del" onclick="this.parentElement.remove()">✕</button>
          </div>
          <div class="bm-item">
            <div class="bm-ic">📄</div>
            <div class="bm-inf">
              <div class="bm-name">Apunte cátedra — Estructuras y Uniones</div>
              <div class="bm-url">https://drive.google.com/file/d/1xBz...</div>
            </div>
            <a href="#" class="bm-open">↗</a>
            <button class="bm-del" onclick="this.parentElement.remove()">✕</button>
          </div>
        </div>
      </div>
    </div><!-- /marcadores -->

  </div><!-- /tabs wrapper -->
@endsection

@push('scripts')
  <script src="{{ asset('js/area-estudio.js') }}"></script>
@endpush
