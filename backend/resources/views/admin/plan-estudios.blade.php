@extends('layouts.app')

@section('title', 'Admin — Plan de Estudios | Cursus')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/admin-alumnos.css') }}">
<link rel="stylesheet" href="{{ asset('css/admin-plan-estudios.css') }}">
@endpush

@section('mobile-header')
<div class="mob-hdr">
  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
    <div style="display: flex; flex-direction: column;">
      <div class="mob-greet" style="display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" style="fill: none; stroke: currentColor; stroke-width: 2; color: var(--brand); flex-shrink: 0;" aria-hidden="true">
          <use href="{{ asset('assets/icons/sprite.svg') }}#graduation-cap"></use>
        </svg>
        Plan de Estudios
      </div>
      <div class="mob-sub">Administración curricular</div>
    </div>
  </div>
</div>
@endsection

@section('topbar-content')
<span class="topbar-title" style="display: flex; align-items: center; gap: 10px;">
  <svg width="22" height="22" style="fill: none; stroke: currentColor; stroke-width: 2; color: var(--brand); flex-shrink: 0;" aria-hidden="true">
    <use href="{{ asset('assets/icons/sprite.svg') }}#graduation-cap"></use>
  </svg>
  Administración — Plan de Estudios
</span>
@endsection

@section('content')
<div class="admin-pe-page">

  <!-- Header con botón agregar -->
  <div class="pe-header">
    <div>
      <h2 class="pe-title">Tecnicatura Universitaria en Programación</h2>
      <p class="pe-subtitle" id="pe-subtitle">Cargando materias…</p>
    </div>
    <button class="aa-btn-search pe-btn-add" onclick="window.peAbrirModal()">
      + Nueva materia
    </button>
  </div>

  <!-- Tabla por año -->
  <div id="pe-anio-1" class="pe-anio-block">
    <div class="pe-anio-header">
      <span class="pe-anio-label">1° Año</span>
      <span class="pe-anio-count" id="pe-count-1"></span>
    </div>
    <div class="pe-table-wrap">
      <table class="aa-table">
        <thead><tr><th>Materia</th><th>Para cursar (Regular)</th><th>Para acreditar (Aprobada)</th><th></th></tr></thead>
        <tbody id="pe-tbody-1"></tbody>
      </table>
    </div>
  </div>

  <div id="pe-anio-2" class="pe-anio-block">
    <div class="pe-anio-header">
      <span class="pe-anio-label">2° Año</span>
      <span class="pe-anio-count" id="pe-count-2"></span>
    </div>
    <div class="pe-table-wrap">
      <table class="aa-table">
        <thead><tr><th>Materia</th><th>Para cursar (Regular)</th><th>Para acreditar (Aprobada)</th><th></th></tr></thead>
        <tbody id="pe-tbody-2"></tbody>
      </table>
    </div>
  </div>

</div>

<!-- Modal alta/edición -->
<div class="aa-confirm-overlay" id="pe-modal" onclick="if(event.target === this) window.peCerrarModal()" hidden>
  <div class="pe-modal-box">
    <div class="pe-modal-header">
      <h3 class="pe-modal-title" id="pe-modal-title">Nueva materia</h3>
      <button class="pe-modal-close" onclick="window.peCerrarModal()">
        <svg width="20" height="20" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#x"></use></svg>
      </button>
    </div>

    <form id="pe-form" onsubmit="window.peGuardar(event)">
      <input type="hidden" id="pe-id">

      <div class="pe-form-grid">
        <div class="pe-field" style="flex: 2;">
          <label for="pe-nombre">Nombre</label>
          <input type="text" id="pe-nombre" class="aa-input" placeholder="Ej: Programación V" required maxlength="255">
        </div>
        <div class="pe-field" style="flex: 1;">
          <label for="pe-nivel">Año</label>
          <div class="aa-select-wrapper">
            <select id="pe-nivel" class="aa-input" required>
              <option value="1">1° Año</option>
              <option value="2">2° Año</option>
            </select>
            <svg class="aa-select-chevron" width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#chevron-down"></use></svg>
          </div>
        </div>
      </div>

      <div class="pe-prereq-grid">
        <div class="pe-prereq-col">
          <div class="pe-prereq-label">Para cursar (Regular)</div>
          <div class="pe-prereq-list" id="pe-check-cursadas"></div>
        </div>
        <div class="pe-prereq-col">
          <div class="pe-prereq-label">Para acreditar (Aprobada)</div>
          <div class="pe-prereq-list" id="pe-check-aprobadas"></div>
        </div>
      </div>

      <div class="pe-form-actions">
        <button type="button" class="aa-btn-cancel" onclick="window.peCerrarModal()">Cancelar</button>
        <button type="submit" class="aa-btn-search" id="pe-btn-guardar">Guardar</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal confirmación eliminar -->
<div class="aa-confirm-overlay" id="pe-confirm-overlay" onclick="if(event.target === this) window.peCancelarEliminar()" hidden>
  <div class="aa-confirm-box">
    <div class="aa-confirm-icon">
      <svg width="24" height="24" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#trash-2"></use></svg>
    </div>
    <h3 class="aa-confirm-title">¿Eliminar materia?</h3>
    <p class="aa-confirm-msg" id="pe-confirm-msg"></p>
    <div class="aa-confirm-actions">
      <button class="aa-btn-cancel" onclick="window.peCancelarEliminar()">Cancelar</button>
      <button class="aa-btn-confirm-delete" id="pe-btn-confirm" onclick="window.peConfirmarEliminar()">Eliminar</button>
    </div>
  </div>
</div>

@endsection

@push('scripts')
<script src="{{ asset('js/admin-plan-estudios.js') }}"></script>
@endpush
