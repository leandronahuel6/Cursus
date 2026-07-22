@extends('layouts.app')

@section('title', 'Admin — Alumnos | Cursus')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/admin/shared.css') }}">
<link rel="stylesheet" href="{{ asset('css/admin/alumnos.css') }}">
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
          class="admin-input"
          placeholder="Ej: 12345"
          maxlength="20"
          required
          autocomplete="off"
        >
        <button type="submit" class="admin-btn-search" id="aa-btn-search">
          Buscar
        </button>
      </div>
      <p id="aa-error" class="aa-error" hidden></p>
    </form>
  </div>

  <!-- Directorio de Alumnos (Estado Vacío) -->
  <div class="aa-materias-card" id="aa-directory-card" style="margin-top: 1rem; margin-bottom: 1.5rem;">
    <div class="aa-search-header" style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
      <svg width="18" height="18" aria-hidden="true" style="color: var(--brand); fill: none; stroke: currentColor; stroke-width: 2;"><use href="{{ asset('assets/icons/sprite.svg') }}#users"></use></svg>
      <h2 class="aa-search-title" style="margin: 0; font-size: 1.1rem;">Directorio de Alumnos</h2>
    </div>
    <div class="aa-materias-table-wrap" style="max-height: 380px; overflow-y: auto;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Legajo</th>
            <th>Email</th>
            <th style="text-align: right;">Acción</th>
          </tr>
        </thead>
        <tbody id="aa-directory-body">
          <tr><td colspan="4" class="admin-table-empty">Cargando alumnos registrados...</td></tr>
        </tbody>
      </table>
    </div>
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
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="admin-btn-cancel" onclick="window.aaVolverAlDirectorio()" style="display: flex; align-items: center; gap: 6px; padding: 0.5rem 0.85rem; font-size: 0.82rem; font-weight: 600; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--t2); cursor: pointer; transition: all 0.2s;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;"><path d="m12 19-7-7 7-7M5 12h14"/></svg>
            Volver al directorio
          </button>
          <button class="aa-btn-delete" id="aa-btn-delete" onclick="window.aaEliminar()">
            <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#trash-2"></use></svg>
            Dar de baja
          </button>
        </div>
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
      <div class="aa-header-filters" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
        <h3 class="aa-section-title" style="margin-bottom: 0;">Materias</h3>
        <div class="aa-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="aa-filter-btn" data-filter="todas" onclick="window.aaFiltrarMaterias('todas')" style="background: var(--brand); color: white; border: none; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Todas</button>
          <button type="button" class="aa-filter-btn" data-filter="aprobada" onclick="window.aaFiltrarMaterias('aprobada')" style="background: var(--surface); color: var(--t2); border: 1px solid var(--border); padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Aprobadas</button>
          <button type="button" class="aa-filter-btn" data-filter="regular" onclick="window.aaFiltrarMaterias('regular')" style="background: var(--surface); color: var(--t2); border: 1px solid var(--border); padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Regulares</button>
          <button type="button" class="aa-filter-btn" data-filter="cursando" onclick="window.aaFiltrarMaterias('cursando')" style="background: var(--surface); color: var(--t2); border: 1px solid var(--border); padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Cursando</button>
          <button type="button" class="aa-filter-btn" data-filter="libre" onclick="window.aaFiltrarMaterias('libre')" style="background: var(--surface); color: var(--t2); border: 1px solid var(--border); padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">Libres</button>
        </div>
      </div>
      <div class="aa-materias-table-wrap">
        <table class="admin-table">
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
  <div class="admin-confirm-overlay" id="aa-confirm-overlay" hidden>
    <div class="admin-confirm-box">
      <div class="admin-confirm-icon">
        <svg width="24" height="24" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#trash-2"></use></svg>
      </div>
      <h3 class="admin-confirm-title">¿Dar de baja al alumno?</h3>
      <p class="admin-confirm-msg" id="aa-confirm-msg"></p>
      <div class="admin-confirm-actions">
        <button class="admin-btn-cancel" onclick="window.aaCancelEliminar()">Cancelar</button>
        <button class="admin-btn-confirm-delete" id="aa-btn-confirm" onclick="window.aaConfirmarEliminar()">Eliminar</button>
      </div>
    </div>
  </div>

</div>
@endsection

@push('scripts')
<script src="{{ asset('js/views/admin/alumnos.js') }}"></script>
@endpush
