@extends('layouts.app')

@section('title', 'Admin — Cuotas | Cursus')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/admin/shared.css') }}">
<link rel="stylesheet" href="{{ asset('css/admin/cuotas.css') }}">
@endpush

@section('mobile-header')
<div class="mob-hdr">
  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
    <div style="display: flex; flex-direction: column;">
      <div class="mob-greet" style="display: flex; align-items: center; gap: 8px;">
        <svg width="20" height="20" style="fill: none; stroke: currentColor; stroke-width: 2; color: var(--brand); flex-shrink: 0;" aria-hidden="true">
          <use href="{{ asset('assets/icons/sprite.svg') }}#wallet"></use>
        </svg>
        Gestión de Cuotas
      </div>
      <div class="mob-sub">Administración arancelaria</div>
    </div>
  </div>
</div>
@endsection

@section('topbar-content')
<span class="topbar-title" style="display: flex; align-items: center; gap: 10px;">
  <svg width="22" height="22" style="fill: none; stroke: currentColor; stroke-width: 2; color: var(--brand); flex-shrink: 0;" aria-hidden="true">
    <use href="{{ asset('assets/icons/sprite.svg') }}#wallet"></use>
  </svg>
  Administración — Cuotas
</span>
@endsection

@section('content')
<div class="admin-cuotas-page">

  <!-- Cuota vigente + formulario para cambiarla -->
  <div class="ac-card">
    <div class="ac-card-header">
      <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#banknote"></use></svg>
      <h2 class="ac-card-title">Cuota mensual vigente</h2>
    </div>

    <div class="ac-vigente-row">
      <div class="ac-vigente-info">
        <div class="ac-monto" id="ac-monto-actual">—</div>
        <div class="ac-vigente-desde" id="ac-vigente-desde"></div>
        <div class="ac-proxima-notice" id="ac-proxima-notice" hidden></div>
      </div>
      <button class="ac-btn-edit" id="ac-btn-edit" onclick="window.acToggleForm()">
        <svg width="14" height="14" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#pen"></use></svg>
        Actualizar
      </button>
    </div>

    <!-- Formulario nuevo valor -->
    <form id="ac-form" class="ac-form" onsubmit="window.acGuardarCuota(event)">
      <div class="ac-form-inner">
      <div class="ac-form-row">
        <div class="ac-field">
          <label for="ac-carrera">Carrera</label>
          <div class="admin-select-wrapper">
            <select id="ac-carrera" class="admin-input" required></select>
            <svg class="admin-select-chevron" width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#chevron-down"></use></svg>
          </div>
        </div>
        <div class="ac-field">
          <label for="ac-valor">Nuevo valor ($)</label>
          <input type="number" id="ac-valor" class="admin-input" min="0" step="0.01" placeholder="Ej: 5000" required>
        </div>
        <div class="ac-field">
          <label for="ac-desde">Vigente desde</label>
          <input type="date" id="ac-desde" class="admin-input" required>
        </div>
      </div>
      <div class="ac-form-actions">
        <button type="button" class="admin-btn-cancel" onclick="window.acToggleForm()">Cancelar</button>
        <button type="submit" class="admin-btn-search" id="ac-btn-guardar">Guardar</button>
      </div>
      </div>
    </form>
  </div>

  <!-- Resumen del mes -->
  <div class="ac-card">
    <div class="ac-card-header">
      <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#users"></use></svg>
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
      <table class="admin-table" id="ac-table" hidden>
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

  <!-- Buscar alumno por legajo: historial completo de cuotas -->
  <div class="ac-card">
    <div class="ac-card-header">
      <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#search"></use></svg>
      <h2 class="ac-card-title">Historial de cuotas por alumno</h2>
    </div>

    <form id="ach-form" onsubmit="window.achBuscar(event)" style="display:flex; gap:10px; flex-wrap:wrap;">
      <input type="text" id="ach-legajo" class="admin-input" placeholder="Legajo del alumno" maxlength="20" required autocomplete="off" style="flex:1; min-width:160px;">
      <button type="submit" class="admin-btn-search" id="ach-btn-search">Buscar</button>
    </form>
    <p id="ach-error" class="admin-error" hidden></p>

    <div id="ach-result" hidden>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-top:10px;">
        <h3 class="ac-card-title" style="margin:0;" id="ach-nombre"></h3>
        <select id="ach-anio" class="admin-input" style="width:auto;" onchange="window.achCambiarAnio(this.value)"></select>
      </div>
      <div class="ac-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Estado</th>
              <th>Medio</th>
              <th>Monto exigible</th>
              <th>Monto pagado</th>
              <th>Fecha de pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="ach-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Pendientes de confirmar (efectivo) -->
  <div class="ac-card">
    <div class="ac-card-header">
      <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#banknote"></use></svg>
      <h2 class="ac-card-title">Pendientes de confirmar (efectivo)</h2>
    </div>
    <p style="font-size:12.5px; color:var(--text-muted); margin:-8px 0 0;">
      Alumnos que declararon un pago en efectivo. Confirmalos acá una vez que llegue el informe de tesorería.
    </p>
    <div id="ac-efectivo-list"><p class="ac-loading">Cargando…</p></div>
  </div>

  <!-- Deudores del ciclo -->
  <div class="ac-card">
    <div class="ac-card-header">
      <svg width="18" height="18" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#users"></use></svg>
      <h2 class="ac-card-title">Deudores del ciclo</h2>
    </div>
    <div class="admin-select-wrapper" style="max-width:260px;">
      <select id="ac-deudores-carrera" class="admin-input" onchange="window.cargarDeudores()">
        <option value="">Todas las carreras</option>
      </select>
      <svg class="admin-select-chevron" width="16" height="16" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#chevron-down"></use></svg>
    </div>
    <div class="ac-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Legajo</th>
            <th>Meses adeudados</th>
            <th>Períodos</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="ac-deudores-tbody"><tr><td colspan="5" class="admin-table-empty">Cargando…</td></tr></tbody>
      </table>
    </div>
  </div>

</div>

<!-- Modal confirmación de eliminar registro de pago -->
<div class="admin-confirm-overlay" id="ac-eliminar-overlay" hidden>
  <div class="admin-confirm-box">
    <div class="admin-confirm-icon">
      <svg width="24" height="24" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg') }}#trash-2"></use></svg>
    </div>
    <h3 class="admin-confirm-title">¿Eliminar este registro de pago?</h3>
    <p class="admin-confirm-msg">Vuelve a quedar pendiente. Usalo solo si el informe de tesorería contradice lo que muestra el sistema.</p>
    <div class="ac-field" style="text-align:left; margin-top:10px;">
      <label for="ac-eliminar-motivo">Motivo (opcional)</label>
      <input type="text" id="ac-eliminar-motivo" class="admin-input" placeholder="Ej: no figura en el informe de tesorería de julio">
    </div>
    <div class="admin-confirm-actions">
      <button class="admin-btn-cancel" onclick="window.acCancelarEliminar()">Cancelar</button>
      <button class="admin-btn-confirm-delete" id="ac-btn-confirmar-eliminar" onclick="window.acConfirmarEliminar()">Eliminar</button>
    </div>
  </div>
</div>
@endsection

@push('scripts')
<script src="{{ asset('js/views/admin/cuotas.js') }}"></script>
@endpush
