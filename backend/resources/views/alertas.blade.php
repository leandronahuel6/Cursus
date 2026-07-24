@extends('layouts.app')

@section('title', 'Cursus - Alertas y Vencimientos')

@push('styles')
<link rel="stylesheet" href="{{ asset('css/views/alertas.css') }}">
@endpush

@section('mobile-header')
  <!-- Mobile Header -->
  <div class="mob-hdr">
    <div class="mob-greet">Alertas y Vencimientos 🔔</div>
    <div class="mob-sub">
      UTN Haedo · Agenda académica
    </div>
  </div>
@endsection

@section('topbar-content')
  <div class="topbar-title">Alertas y Vencimientos <span>🔔</span></div>
@endsection

@section('content')
  <!-- AVISO DE CUOTA SIN PAGAR (a partir del 1° de cada mes, hasta que se registre el pago) -->
  <div class="alert" id="cuota-pago-alert" style="display: none;">
    <div class="alert-dot" id="cuota-pago-alert-dot"></div>
    <div class="alert-txt">
      <strong id="cuota-pago-alert-title">Alerta de pago:</strong> <span id="cuota-pago-alert-text"></span>
    </div>
    <button class="alert-x" onclick="document.getElementById('cuota-pago-alert').style.display='none'">✕</button>
  </div>

  <div class="alertas-grid">
    
    <!-- COLUMNA IZQUIERDA: Agenda o Calendario -->
    <div class="col-left">
      
      <!-- Cambiador de Vistas -->
      <div class="view-switcher">
        <button class="view-btn active" id="btn-view-list" onclick="window.switchView('list')">Agenda / Lista</button>
        <button class="view-btn" id="btn-view-calendar" onclick="window.switchView('calendar')">Calendario Mensual</button>
      </div>

      <!-- VISTA DE LISTA (Agenda) -->
      <div id="view-list" class="alert-list-container">
        <div class="alert-group" id="group-urgent">
          <div class="alert-group-title">Esta Semana / Próximos 7 días</div>
          <div id="list-urgent" class="alert-group-content"></div>
        </div>

        <div class="alert-group" id="group-soon">
          <div class="alert-group-title">Siguientes semanas</div>
          <div id="list-soon" class="alert-group-content"></div>
        </div>

        <div class="alert-group" id="group-later">
          <div class="alert-group-title">Más adelante</div>
          <div id="list-later" class="alert-group-content"></div>
        </div>
      </div>

      <!-- VISTA DE CALENDARIO -->
      <div id="view-calendar" style="display: none;">
        <div class="calendar-card-wrap">
          <div class="calendar-nav-header">
            <button class="calendar-nav-btn" onclick="window.changeMonth(-1)">◀</button>
            <div class="calendar-month-title" id="calendar-month-title">Junio 2026</div>
            <button class="calendar-nav-btn" onclick="window.changeMonth(1)">▶</button>
          </div>
          
          <div class="calendar-weekdays-grid">
            <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
          </div>
          
          <div class="calendar-days-grid" id="calendar-days-container">
            <!-- Días renderizados dinámicamente. Si un día tiene alertas, al
                 tocarlo se abre un detalle anclado a la celda misma. -->
          </div>

        </div>
      </div>

    </div>

    <!-- COLUMNA DERECHA: Formulario -->
    <div class="col-right">

      <!-- RECORDATORIO DE CUOTA UNIVERSITARIA -->
      <div class="alert-form-card">
        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 4px; color: var(--t1); display: flex; align-items: center; gap: 6px;">
          <span>🎓</span> Cuota de la Universidad
        </h3>
        <p style="font-size: 11.5px; color: var(--t3); margin-bottom: 14px;">
          Monto vigente fijado por la institución.
        </p>
        <div class="alert-form-group">
          <label style="font-size: 11px; font-weight: 600; color: var(--t2);">Monto actual de la cuota</label>
          <div class="currency-input-wrap" style="pointer-events: none; opacity: 0.8;">
            <span class="currency-input-sign">$</span>
            <input type="text" id="cuota-monto" class="alert-form-input currency-input" readonly tabindex="-1" placeholder="—">
          </div>
        </div>
        <div id="cuota-proxima-notice" style="display:none; margin-bottom:10px; font-size:12px; color:#d97706; background:rgba(217,119,6,.08); border:1px solid rgba(217,119,6,.25); border-radius:6px; padding:6px 10px;"></div>
        <button type="button" class="btn-alert-submit" id="btn-abrir-pago" style="width: 100%; background: var(--green);" onclick="window.openPagoModal()">
          💳 Pagar
        </button>
        <div id="cuota-pago-info" style="margin-top: 10px; font-size: 11.5px; color: var(--t3);"></div>
      </div>

      <!-- FORMULARIO DE CARGA DE ALERTA -->
      <div class="alert-form-card">
        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 14px; color: var(--t1); display: flex; align-items: center; gap: 6px;">
          <span>➕</span> Nueva Alerta / Vencimiento
        </h3>
        <form id="alert-form" onsubmit="window.handleAlertSubmit(event)">
          <div class="alert-form-group">
            <label for="alert-title">Título del Vencimiento</label>
            <input type="text" id="alert-title" class="alert-form-input" placeholder="Ej: Parcial de Laboratorio II" required>
          </div>

          <div class="alert-form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label for="alert-type">Categoría</label>
              <select id="alert-type" class="alert-form-input" style="height: 35px;">
                <option value="academic">Académica</option>
                <option value="administrative">Administrativa</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div>
              <label for="alert-priority">Prioridad</label>
              <select id="alert-priority" class="alert-form-input" style="height: 35px;">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta" selected>Alta</option>
              </select>
            </div>
          </div>

          <div class="alert-form-group">
            <label for="alert-color">Color para pintar el día en calendario</label>
            <input type="hidden" id="alert-color" value="#2563eb">
            <div class="alert-color-palette" id="alert-color-palette" role="radiogroup" aria-label="Selector de color de alerta">
              <button type="button" class="alert-color-swatch selected" data-color="#2563eb" aria-label="Azul" title="Azul"></button>
              <button type="button" class="alert-color-swatch" data-color="#0ea5e9" aria-label="Celeste" title="Celeste"></button>
              <button type="button" class="alert-color-swatch" data-color="#14b8a6" aria-label="Turquesa" title="Turquesa"></button>
              <button type="button" class="alert-color-swatch" data-color="#22c55e" aria-label="Verde" title="Verde"></button>
              <button type="button" class="alert-color-swatch" data-color="#84cc16" aria-label="Lima" title="Lima"></button>
              <button type="button" class="alert-color-swatch" data-color="#eab308" aria-label="Amarillo" title="Amarillo"></button>
              <button type="button" class="alert-color-swatch" data-color="#f97316" aria-label="Naranja" title="Naranja"></button>
              <button type="button" class="alert-color-swatch" data-color="#ef4444" aria-label="Rojo" title="Rojo"></button>
              <button type="button" class="alert-color-swatch" data-color="#ec4899" aria-label="Rosa" title="Rosa"></button>
              <button type="button" class="alert-color-swatch" data-color="#8b5cf6" aria-label="Violeta" title="Violeta"></button>
            </div>
          </div>

          <div class="alert-form-group">
            <label for="alert-date">Fecha de Vencimiento</label>
            <input type="date" id="alert-date" class="alert-form-input" required>
          </div>

          <button type="submit" class="btn-alert-submit">
            💾 Programar Alerta
          </button>
        </form>
      </div>

    </div>

  </div>

  <!-- HISTORIAL DE CUOTAS: un registro por mes del ciclo marzo-diciembre -->
  <div class="cuota-historial-section">
    <div class="cuota-historial-card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <h3 style="margin-bottom:0;"><span>📋</span> Historial de cuotas</h3>
        <select id="cuota-historial-anio" class="alert-form-input" style="width:auto; height:32px;" onchange="window.cambiarAnioHistorial(this.value)"></select>
      </div>
      <div id="cuota-historial-list" class="cuota-historial-list" style="margin-top:12px;">
        <div class="chr-empty">Cargando historial…</div>
      </div>
    </div>
  </div>

  <!-- MODAL: REGISTRAR PAGO DE LA CUOTA -->
  <div class="grade-modal-overlay" id="pago-cuota-modal">
    <div class="grade-modal-box">
      <div class="grade-modal-header">Registrar pago — <span id="pago-periodo-label"></span></div>
      <div class="grade-modal-body">
        <div class="pago-medio-tabs">
          <button type="button" class="pago-medio-tab active" data-medio="transferencia" onclick="window.pagoSeleccionarMedio('transferencia')">Transferencia</button>
          <button type="button" class="pago-medio-tab" data-medio="efectivo" onclick="window.pagoSeleccionarMedio('efectivo')">Efectivo en tesorería</button>
        </div>

        <div id="pago-monto-preview" class="pago-monto-preview"></div>

        <div id="pago-transferencia-fields" class="pago-field">
          <label for="pago-comprobante">Comprobante de transferencia (imagen o PDF)</label>
          <input type="file" id="pago-comprobante" accept=".pdf,.jpg,.jpeg,.png">
        </div>

        <div id="pago-efectivo-fields" class="pago-field" hidden>
          <label for="pago-recibo">Foto del recibo de tesorería</label>
          <input type="file" id="pago-recibo" accept=".pdf,.jpg,.jpeg,.png">
          <p class="pago-efectivo-note">El pago en efectivo queda pendiente de confirmación por la secretaría contra el informe de tesorería.</p>
        </div>
      </div>
      <div class="grade-modal-footer">
        <button class="btn-modal-action cancel" onclick="window.closePagoModal()">Cancelar</button>
        <button class="btn-modal-action save" id="pago-btn-confirmar" onclick="window.confirmarPago()">Confirmar</button>
      </div>
    </div>
  </div>
@endsection

@push('scripts')
  <script type="module" src="{{ asset('js/views/alertas/alertas-main.js') }}"></script>
@endpush
