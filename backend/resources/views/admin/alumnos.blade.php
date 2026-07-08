@extends('layouts.app')

@section('title', 'Admin — Alumnos | Cursus')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/admin-alumnos.css') }}">
@endpush

@section('mobile-header')
<div class="mob-hdr">
  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
    <div style="display: flex; flex-direction: column;">
      <div class="mob-greet" style="display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" style="fill: none; stroke: currentColor; stroke-width: 2; color: var(--brand); flex-shrink: 0;" aria-hidden="true">
          <use href="{{ asset('assets/icons/sprite.svg') }}#user"></use>
        </svg>
        Gestión de Alumnos
      </div>
      <div class="mob-sub">Administración de cursada</div>
    </div>
  </div>
</div>
@endsection

@section('topbar-content')
<span class="topbar-title" style="display: flex; align-items: center; gap: 10px;">
  <svg width="22" height="22" style="fill: none; stroke: currentColor; stroke-width: 2; color: var(--brand); flex-shrink: 0;" aria-hidden="true">
    <use href="{{ asset('assets/icons/sprite.svg') }}#user"></use>
  </svg>
  Administración — Alumnos
</span>
@endsection

@section('content')
<div class="admin-alumnos-page">

  <!-- Buscador -->
  <div class="aa-search-card">
    <div class="aa-search-header">
      <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#search"></use></svg>
      <h2 class="aa-search-title">Buscar alumno por legajo</h2>
    </div>
    <form id="aa-form" onsubmit="window.aaBuscar(event)">
      <div class="aa-search-row">
        <input
          type="text"
          id="aa-legajo"
          class="aa-input"
          placeholder="Ej: 12345"
          maxlength="20"
          required
          autocomplete="off"
        >
        <button type="submit" class="aa-btn-search" id="aa-btn-search">
          Buscar
        </button>
      </div>
      <p id="aa-error" class="aa-error" hidden></p>
    </form>
  </div>

  <!-- Resultado -->
  <div id="aa-result" hidden>

    <!-- Header alumno -->
    <div class="aa-student-card">
      <div class="aa-student-header">
        <div class="aa-avatar" id="aa-av"></div>
        <div class="aa-student-info">
          <div class="aa-student-name" id="aa-nombre"></div>
          <div class="aa-student-meta">
            <span id="aa-legajo-txt"></span>
            <span class="aa-dot">·</span>
            <span id="aa-email"></span>
          </div>
        </div>
        <button class="aa-btn-delete" id="aa-btn-delete" onclick="window.aaEliminar()">
          <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#trash-2"></use></svg>
          Dar de baja
        </button>
      </div>

      <!-- Stats rápidas -->
      <div class="aa-stats-row">
        <div class="aa-stat">
          <div class="aa-stat-val" id="aa-stat-aprobadas">—</div>
          <div class="aa-stat-lbl">Aprobadas</div>
        </div>
        <div class="aa-stat">
          <div class="aa-stat-val" id="aa-stat-cursando">—</div>
          <div class="aa-stat-lbl">Cursando</div>
        </div>
        <div class="aa-stat">
          <div class="aa-stat-val" id="aa-stat-pendientes">—</div>
          <div class="aa-stat-lbl">Regulares</div>
        </div>
        <div class="aa-stat">
          <div class="aa-stat-val" id="aa-stat-pomodoro">—</div>
          <div class="aa-stat-lbl">Hs. Pomodoro</div>
        </div>
        <div class="aa-stat">
          <div class="aa-stat-val" id="aa-stat-cuota">—</div>
          <div class="aa-stat-lbl">Cuota {{ ucfirst(now()->locale('es')->isoFormat('MMMM')) }}</div>
        </div>
      </div>
    </div>

    <!-- Detalle materias -->
    <div class="aa-materias-card">
      <h3 class="aa-section-title">Materias</h3>
      <div class="aa-materias-table-wrap">
        <table class="aa-table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Año</th>
              <th>Estado</th>
              <th>Nota prom.</th>
            </tr>
          </thead>
          <tbody id="aa-materias-body">
          </tbody>
        </table>
      </div>
    </div>

  </div><!-- /aa-result -->



  <!-- Modal confirmación baja -->
  <div class="aa-confirm-overlay" id="aa-confirm-overlay" hidden>
    <div class="aa-confirm-box">
      <div class="aa-confirm-icon">
        <svg width="24" height="24" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#trash-2"></use></svg>
      </div>
      <h3 class="aa-confirm-title">¿Dar de baja al alumno?</h3>
      <p class="aa-confirm-msg" id="aa-confirm-msg"></p>
      <div class="aa-confirm-actions">
        <button class="aa-btn-cancel" onclick="window.aaCancelEliminar()">Cancelar</button>
        <button class="aa-btn-confirm-delete" id="aa-btn-confirm" onclick="window.aaConfirmarEliminar()">Eliminar</button>
      </div>
    </div>
  </div>

</div>
@endsection

@push('scripts')
<script src="{{ asset('js/admin-alumnos.js') }}"></script>
@endpush
