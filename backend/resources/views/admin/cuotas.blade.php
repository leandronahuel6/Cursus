@extends('layouts.app')

@section('title', 'Admin — Cuotas | Cursus')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/admin-alumnos.css') }}">
<link rel="stylesheet" href="{{ asset('css/admin-cuotas.css') }}">
@endpush

@section('topbar-content')
<span class="topbar-title">Administración — Cuotas</span>
@endsection

@section('content')
<div class="admin-cuotas-page">

  <!-- Cuota vigente + formulario para cambiarla -->
  <div class="ac-card">
    <div class="ac-card-header">
      <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#dollar-sign') }}"></use></svg>
      <h2 class="ac-card-title">Cuota mensual vigente</h2>
    </div>

    <div class="ac-vigente-row">
      <div class="ac-vigente-info">
        <div class="ac-monto" id="ac-monto-actual">—</div>
        <div class="ac-vigente-desde" id="ac-vigente-desde"></div>
      </div>
      <button class="ac-btn-edit" id="ac-btn-edit" onclick="window.acToggleForm()">
        <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#pencil') }}"></use></svg>
        Actualizar
      </button>
    </div>

    <!-- Formulario nuevo valor -->
    <form id="ac-form" class="ac-form" hidden onsubmit="window.acGuardarCuota(event)">
      <div class="ac-form-row">
        <div class="ac-field">
          <label for="ac-carrera">Carrera</label>
          <select id="ac-carrera" class="aa-input" required></select>
        </div>
        <div class="ac-field">
          <label for="ac-valor">Nuevo valor ($)</label>
          <input type="number" id="ac-valor" class="aa-input" min="0" step="0.01" placeholder="Ej: 5000" required>
        </div>
        <div class="ac-field">
          <label for="ac-desde">Vigente desde</label>
          <input type="date" id="ac-desde" class="aa-input" required>
        </div>
      </div>
      <div class="ac-form-actions">
        <button type="button" class="aa-btn-cancel" onclick="window.acToggleForm()">Cancelar</button>
        <button type="submit" class="aa-btn-search" id="ac-btn-guardar">Guardar</button>
      </div>
    </form>
  </div>

  <!-- Resumen del mes -->
  <div class="ac-card">
    <div class="ac-card-header">
      <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#users') }}"></use></svg>
      <h2 class="ac-card-title">Estado de pagos — <span id="ac-periodo-label">…</span></h2>
    </div>

    <div class="ac-stats-row">
      <div class="ac-stat">
        <div class="ac-stat-val" id="ac-stat-total">—</div>
        <div class="ac-stat-lbl">Alumnos</div>
      </div>
      <div class="ac-stat">
        <div class="ac-stat-val text-ok" id="ac-stat-pagaron">—</div>
        <div class="ac-stat-lbl">Pagaron</div>
      </div>
      <div class="ac-stat">
        <div class="ac-stat-val text-warn" id="ac-stat-pendientes">—</div>
        <div class="ac-stat-lbl">Pendientes</div>
      </div>
    </div>

    <!-- Filtro -->
    <div class="ac-filter-row">
      <button class="ac-filter-btn active" data-filter="todos" onclick="window.acFiltrar(this)">Todos</button>
      <button class="ac-filter-btn" data-filter="pagaron" onclick="window.acFiltrar(this)">Pagaron</button>
      <button class="ac-filter-btn" data-filter="pendientes" onclick="window.acFiltrar(this)">Pendientes</button>
    </div>

    <!-- Tabla alumnos -->
    <div class="ac-table-wrap" id="ac-table-wrap">
      <p class="ac-loading" id="ac-loading">Cargando…</p>
      <table class="aa-table" id="ac-table" hidden>
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Legajo</th>
            <th>Estado</th>
            <th>Fecha de pago</th>
          </tr>
        </thead>
        <tbody id="ac-tbody"></tbody>
      </table>
    </div>
  </div>

</div>
@endsection

@push('scripts')
<script src="{{ asset('js/admin-cuotas.js') }}"></script>
@endpush
