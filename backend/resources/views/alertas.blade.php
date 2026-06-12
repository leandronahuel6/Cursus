@extends('layouts.app')

@section('title', 'Cursus - Alertas y Vencimientos')

@section('mobile-header')
  <!-- Mobile Header -->
  <div class="mob-hdr">
    <div class="mob-greet">Alertas y Vencimientos 🔔</div>
    <div class="mob-sub">
      UTN Haedo · Agenda académica
    </div>
    <!-- Selector carrera mobile -->
    <div class="career-selector-wrap" style="margin-top: 10px;">
      <span>Carrera:</span>
      <select class="career-select" id="career-select-mob" onchange="window.handleCareerChange(this.value)">
        <option value="TUP">Tec. en Programación (Paga)</option>
        <option value="TUSI">Tec. en Sistemas (Paga)</option>
        <option value="AERO">Ing. Aeronáutica (Gratuita)</option>
        <option value="MECA">Ing. Mecánica (Gratuita)</option>
        <option value="ELEC">Ing. Electrónica (Gratuita)</option>
        <option value="IND">Ing. Industrial (Gratuita)</option>
        <option value="FERRO">Ing. Ferroviaria (Gratuita)</option>
        <option value="LGT">Lic. en Gestión Tecnológica (Gratuita)</option>
      </select>
    </div>
  </div>
@endsection

@section('topbar-content')
  <div class="topbar-title">Alertas y Vencimientos <span>🔔</span></div>
  <div class="career-selector-wrap">
    <span>Carrera:</span>
    <select class="career-select" id="career-select-desk" onchange="window.handleCareerChange(this.value)">
      <option value="TUP">Tecnicatura en Programación (Paga)</option>
      <option value="TUSI">Tecnicatura en Sistemas (Paga)</option>
      <option value="AERO">Ingeniería Aeronáutica (Gratuita)</option>
      <option value="MECA">Ingeniería Mecánica (Gratuita)</option>
      <option value="ELEC">Ingeniería Electrónica (Gratuita)</option>
      <option value="IND">Ingeniería Industrial (Gratuita)</option>
      <option value="FERRO">Ingeniería Ferroviaria (Gratuita)</option>
      <option value="LGT">Licenciatura en Gestión Tecnológica (Gratuita)</option>
    </select>
  </div>
  <div class="streak-chip">🔥 8 días de racha</div>
@endsection

@section('content')
  <!-- AVISO DE AUMENTO DE CUOTA (Simulado vía email) -->
  <div class="alert" id="fee-increase-alert" style="display: none; background: #fffbeb; border: 1px solid #fef3c7;">
    <div class="alert-dot" style="background: var(--yellow);"></div>
    <div class="alert-txt" style="color: #92400e;">
      <strong>Aviso de la administración (Vía Email):</strong> Se informa que a partir del próximo mes, la cuota de las carreras aranceladas se reajustará a <strong>$95.000</strong>.
    </div>
    <button class="alert-x" onclick="document.getElementById('fee-increase-alert').remove()" style="color: #b45309;">✕</button>
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
            <!-- Días renderizados dinámicamente -->
          </div>

          <!-- Detalles del día seleccionado -->
          <div class="day-detail-box">
            <div class="day-detail-title" id="selected-day-label">Selecciona un día para ver sus alertas</div>
            <div id="day-detail-alerts-list">
              <div class="day-detail-empty">Ninguna alerta programada para este día.</div>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- COLUMNA DERECHA: Pagos y Formularios -->
    <div class="col-right">
      
      <!-- TARJETA DE CUOTA (Solo para Tecnicaturas) -->
      <div class="payment-card-box pending" id="tuition-payment-card" style="display: block;">
        <div class="pay-tag" id="tuition-status-badge">Cuota Pendiente</div>
        <div class="pay-amount" id="tuition-amount-label">$80.000</div>
        <div class="pay-due" id="tuition-due-label">Vence el 15 de este mes · Quedan 3 días</div>
        <button class="btn-pay-action" id="btn-pay-tuition" onclick="window.simulatePayment()">
          💳 Realizar Pago Directo
        </button>
      </div>

      <!-- Mensaje para Ingenierías gratuitas -->
      <div class="card" id="free-career-card" style="display: none; padding: 20px; border-left: 4px solid var(--green); margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 4px; color: var(--green);">Carrera No Arancelada</h3>
        <p style="font-size: 12px; color: var(--t3);">
          Estás cursando una Ingeniería o Licenciatura en la UTN Regional Haedo. Estas carreras son completamente gratuitas y no registran cuotas mensuales.
        </p>
      </div>

      <!-- HISTORIAL DE PAGOS (Solo para Tecnicaturas) -->
      <div class="card payment-history-card" id="payment-history-card" style="display: block;">
        <div class="card-hd">
          <div class="card-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M1 8a7 7 0 1114 0A7 7 0 011 8z" stroke="var(--brand)" stroke-width="1.5"/>
              <path d="M8 4v4l2.5 1.5" stroke="var(--brand)" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Historial de Pagos
          </div>
        </div>
        <div class="card-body">
          <div class="payment-history-container" id="payments-history-list">
            <!-- Cargado dinámicamente -->
          </div>
        </div>
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
                <option value="payment">Pago</option>
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
@endsection

@push('scripts')
  <script src="{{ asset('js/alertas.js') }}"></script>
@endpush
