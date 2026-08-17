@extends('layouts.app')

@section('title', 'Cursus - Alertas y Vencimientos')

@push('styles')
  <link rel="stylesheet" href="{{ asset('css/components/banners.css') }}">
  <link rel="stylesheet" href="{{ asset('css/views/alertas/alertas-layout.css') }}">
  <link rel="stylesheet" href="{{ asset('css/views/alertas/alertas-list.css') }}">
  <link rel="stylesheet" href="{{ asset('css/views/alertas/alertas-calendar.css') }}">
  <link rel="stylesheet" href="{{ asset('css/views/alertas/alertas-form.css') }}">
  <link rel="stylesheet" href="{{ asset('css/views/alertas/alertas-cuotas.css') }}">
@endpush

@section('mobile-header-content')
  {{-- Mobile Header --}}
  <div class="mob-greet">Alertas y Vencimientos 🔔</div>
  <div class="mob-sub">UTN Haedo · Agenda académica</div>
@endsection

@section('topbar-content')
  <div class="topbar-title">Alertas y Vencimientos 🔔</div>
@endsection

@section('content')

  {{-- ── AVISO DE CUOTA SIN PAGAR ─────────────────────────────────────────── --}}
  {{-- Visible a partir del 1° de cada mes hasta que se registre el pago.      --}}
  <x-system-banner id="cuota-pago-alert" title="Alerta de pago:">
    <span class="system-banner__dynamic-text" id="cuota-pago-alert-text"></span>
  </x-system-banner>

  {{-- ── GRILLA PRINCIPAL (Izquierda: Lista/Calendario | Derecha: Formulario) ─ --}}
  <div class="alertas-grid">

    {{-- COLUMNA IZQUIERDA: Agenda o Calendario --}}
    <section class="col-left" aria-label="Agenda de alertas y vencimientos">

      {{-- Cambiador de Vistas --}}
      <div class="view-switcher" role="tablist" aria-label="Seleccionar vista">
        <button class="view-btn active"
                id="btn-view-list"
                type="button"
                role="tab"
                aria-selected="true"
                aria-controls="view-list"
                data-js="switch-view"
                data-view="list">Agenda / Lista</button>
        <button class="view-btn"
                id="btn-view-calendar"
                type="button"
                role="tab"
                aria-selected="false"
                aria-controls="view-calendar"
                data-js="switch-view"
                data-view="calendar">Calendario Mensual</button>
      </div>

      {{-- VISTA DE LISTA (Agenda) --}}
      <div id="view-list"
           class="alert-list-container"
           role="tabpanel"
           aria-labelledby="btn-view-list">
        
        <section class="alert-group" id="group-overdue">
          <h2 class="alert-group__title alert-group__title--overdue">Vencidas</h2>
          <div id="list-overdue" class="alert-group__content"></div>
        </section>

        <section class="alert-group" id="group-urgent">
          <h2 class="alert-group__title">Esta Semana / Próximos 7 días</h2>
          <div id="list-urgent" class="alert-group__content"></div>
        </section>

        <section class="alert-group" id="group-soon">
          <h2 class="alert-group__title">Este mes / Próximos 30 días</h2>
          <div id="list-soon" class="alert-group__content"></div>
        </section>

        <section class="alert-group" id="group-later">
          <h2 class="alert-group__title">Más adelante</h2>
          <div id="list-later" class="alert-group__content"></div>
        </section>

        <section class="alert-group" id="group-completed">
          <h2 class="alert-group__title alert-group__title--completed">Completadas</h2>
          <div id="list-completed" class="alert-group__content"></div>
        </section>
      </div>

      {{-- VISTA DE CALENDARIO MENSUAL --}}
      <div id="view-calendar"
           class="hidden"
           role="tabpanel"
           aria-labelledby="btn-view-calendar">
        <div class="calendar-card-wrap">
          <div class="calendar-nav-header">
            <button class="calendar-nav-btn"
                    type="button"
                    id="btn-prev-month"
                    aria-label="Mes anterior"
                    data-js="change-month"
                    data-direction="-1">
              <svg aria-hidden="true" focusable="false">
                <use href="{{ asset('assets/icons/sprite.svg#chevron-left') }}"></use>
              </svg>
            </button>
            <div class="calendar-month-title" id="calendar-month-title" aria-live="polite">Junio 2026</div>
            <button class="calendar-nav-btn"
                    type="button"
                    id="btn-next-month"
                    aria-label="Siguiente mes"
                    data-js="change-month"
                    data-direction="1">
              <svg aria-hidden="true" focusable="false">
                <use href="{{ asset('assets/icons/sprite.svg#chevron-right') }}"></use>
              </svg>
            </button>
          </div>

          <div class="calendar-weekdays-grid" aria-hidden="true">
            <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div>
            <div>Jue</div><div>Vie</div><div>Sáb</div>
          </div>

          {{-- Días renderizados dinámicamente por alertas-calendar.js --}}
          <div class="calendar-days-grid"
               id="calendar-days-container"
               role="grid"
               aria-label="Calendario de alertas">
          </div>
        </div>
      </div>

    </section>

    {{-- COLUMNA DERECHA: Formularios --}}
    <aside class="col-right" aria-label="Gestión de cuota y nueva alerta">

      {{-- RECORDATORIO DE CUOTA UNIVERSITARIA --}}
      <article class="alert-form-card">
        <header class="alert-form-card__header">
          <h3 class="alert-form-card__title">
            <svg aria-hidden="true" focusable="false">
              <use href="{{ asset('assets/icons/sprite.svg#banknote') }}"></use>
            </svg>
            Cuota de la Universidad
          </h3>
          <p class="alert-form-card__subtitle">Monto vigente fijado por la institución.</p>
        </header>

        <div class="form-body">
          <div class="data-display">
            <span class="form-label">Monto actual de la cuota</span>
            <div class="data-display__value-wrap">
              <span class="data-display__sign" aria-hidden="true">$</span>
              <strong class="data-display__value" id="cuota-monto">—</strong>
            </div>
          </div>

          {{-- Notice de próxima cuota (se controla desde JS) --}}
          <div id="cuota-proxima-notice" class="cuota-proxima-notice" role="status"></div>

          <button type="button"
                  class="btn btn--success btn--block"
                  id="btn-abrir-pago"
                  data-js="open-pago-modal">
            <span>Registrar <span class="u-hidden-mobile">Pago</span></span>
          </button>

          <p class="cuota-pago-info" id="cuota-pago-info" aria-live="polite"></p>
        </div>
      </article>

      {{-- FORMULARIO DE CARGA DE ALERTA --}}
      <article class="alert-form-card">
        <header class="alert-form-card__header">
          <h3 class="alert-form-card__title">
            <svg aria-hidden="true" focusable="false">
              <use href="{{ asset('assets/icons/sprite.svg#circle-alert') }}"></use>
            </svg>
            Nueva Alerta / Vencimiento
          </h3>
        </header>
        <form id="alert-form" data-js="form-alerta" class="form-body" novalidate>
          <div class="form-field">
            <label for="alert-title" class="form-label">Título del Vencimiento</label>
            <input type="text"
                   id="alert-title"
                   class="custom-input"
                   placeholder="Ej: Parcial de Laboratorio II"
                   required
                   autocomplete="off">
          </div>

          <div class="form-field">
            <label for="alert-desc" class="form-label">Descripción (opcional)</label>
            <textarea id="alert-desc"
                      name="alert_desc"
                      class="custom-textarea"
                      rows="3"
                      placeholder="Agregá detalles o recordatorios extra..."></textarea>
          </div>

          <div class="form-field-row">
            <div class="form-field">
              <label for="alert-type" class="form-label">Categoría</label>
              <x-custom-select id="alert-type" name="alert_type">
                <option value="academic">Académica</option>
                <option value="administrative">Administrativa</option>
                <option value="personal">Personal</option>
              </x-custom-select>
            </div>
            <div class="form-field">
              <label for="alert-priority" class="form-label">Prioridad</label>
              <x-custom-select id="alert-priority" name="alert_priority">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta" selected>Alta</option>
              </x-custom-select>
            </div>
          </div>

          <div class="form-field">
            <legend class="form-label">Color para pintar el día en calendario</legend>
            {{-- El input hidden almacena el valor HEX seleccionado --}}
            <input type="hidden" id="alert-color" value="#2563eb">
            <fieldset class="alert-color-palette" id="alert-color-palette">
              <button type="button" class="alert-color-swatch selected" data-color="#2563eb" aria-label="Azul"     title="Azul"></button>
              <button type="button" class="alert-color-swatch"          data-color="#0ea5e9" aria-label="Celeste"  title="Celeste"></button>
              <button type="button" class="alert-color-swatch"          data-color="#14b8a6" aria-label="Turquesa" title="Turquesa"></button>
              <button type="button" class="alert-color-swatch"          data-color="#22c55e" aria-label="Verde"    title="Verde"></button>
              <button type="button" class="alert-color-swatch"          data-color="#84cc16" aria-label="Lima"     title="Lima"></button>
              <button type="button" class="alert-color-swatch"          data-color="#eab308" aria-label="Amarillo" title="Amarillo"></button>
              <button type="button" class="alert-color-swatch"          data-color="#f97316" aria-label="Naranja"  title="Naranja"></button>
              <button type="button" class="alert-color-swatch"          data-color="#ef4444" aria-label="Rojo"     title="Rojo"></button>
              <button type="button" class="alert-color-swatch"          data-color="#ec4899" aria-label="Rosa"     title="Rosa"></button>
              <button type="button" class="alert-color-swatch"          data-color="#8b5cf6" aria-label="Violeta"  title="Violeta"></button>
            </fieldset>
          </div>

          <div class="form-field">
            <label for="alert-date" class="form-label">Fecha de Vencimiento</label>
            <input type="date" id="alert-date" class="custom-input" required>
          </div>

          <button type="submit" class="btn btn--primary btn--block"><span>Programar <span class="u-hidden-mobile">Alerta</span></span></button>
        </form>
      </article>

    </aside>
  </div>

  {{-- ── HISTORIAL DE CUOTAS ──────────────────────────────────────────────── --}}
  {{-- Un registro por mes del ciclo marzo-diciembre                           --}}
  <div class="cuota-historial-section">
    <div class="cuota-historial-card">
      <div class="cuota-historial-card__header">
        <h3 class="cuota-historial-card__title">
          <svg aria-hidden="true" focusable="false">
            <use href="{{ asset('assets/icons/sprite.svg#clipboard-clock') }}"></use>
          </svg>
          Historial de cuotas
        </h3>
        <x-custom-select id="cuota-historial-anio"
                         name="cuota_historial_anio"
                         data-js="historial-anio-select">
        </x-custom-select>
      </div>
      <div id="cuota-historial-list" class="cuota-historial-list">
        <div class="chr-empty">Cargando historial…</div>
      </div>
    </div>
  </div>

  {{-- ── MODAL: REGISTRAR PAGO DE LA CUOTA ──────────────────────────────── --}}
  <x-modal id="pago-cuota-modal" title="Registrar pago" icon="clipboard-clock">
    <div class="modal-body">
      <div>
        Período:
        <span id="pago-periodo-label" class="pago-periodo-label"></span>
      </div>

      <div class="pago-medio-tabs" role="tablist" aria-label="Medio de pago">
        <button type="button"
                class="pago-medio-tab active"
                id="tab-transferencia"
                role="tab"
                aria-selected="true"
                aria-controls="pago-transferencia-fields"
                data-medio="transferencia"
                data-js="pago-medio-tab">Transferencia</button>
        <button type="button"
                class="pago-medio-tab"
                id="tab-efectivo"
                role="tab"
                aria-selected="false"
                aria-controls="pago-efectivo-fields"
                data-medio="efectivo"
                data-js="pago-medio-tab">Efectivo en tesorería</button>
      </div>

      <div id="pago-monto-preview" class="pago-monto-preview" aria-live="polite"></div>

      <div id="pago-transferencia-fields"
           class="pago-field"
           role="tabpanel"
           aria-labelledby="tab-transferencia">
        <label for="pago-comprobante">Comprobante de transferencia (imagen o PDF)</label>
        <input type="file"
               id="pago-comprobante"
               class="custom-input"
               accept=".pdf,.jpg,.jpeg,.png"
               aria-describedby="pago-monto-preview">
      </div>

      <div id="pago-efectivo-fields"
           class="pago-field"
           role="tabpanel"
           aria-labelledby="tab-efectivo"
           hidden>
        <label for="pago-recibo">Foto del recibo de tesorería</label>
        <input type="file"
               id="pago-recibo"
               class="custom-input"
               accept=".pdf,.jpg,.jpeg,.png">
        <p class="pago-efectivo-note">El pago en efectivo queda pendiente de confirmación por la secretaría contra el informe de tesorería.</p>
      </div>
    </div>

    <div class="modal-foot">
      <button class="btn btn--cancel"
              type="button"
              id="btn-cancelar-pago"
              data-js="close-pago-modal">Cancelar</button>
      <button class="btn btn--primary"
              type="button"
              id="pago-btn-confirmar"
              data-js="confirmar-pago">Confirmar</button>
    </div>
  </x-modal>

  {{-- ── MODAL: ELIMINAR ALERTA ──────────────────────────────────────────── --}}
  <x-modal-confirm 
      id="confirm-delete-alerta" 
      title="¿Eliminar alerta?" 
      description="Esta acción no se puede deshacer." 
      type="danger" 
      confirm-id="btn-confirm-delete-alerta" 
  />

  {{-- ── MODAL: EDITAR ALERTA ──────────────────────────────────────────── --}}
  <x-modal id="edit-alerta-modal" title="Editar Alerta" icon="pen">
    <form id="edit-alert-form" data-js="form-edit-alerta" class="modal-body" novalidate>
      <div class="form-field">
        <label for="edit-alert-title" class="form-label">Título del Vencimiento</label>
        <input type="text" id="edit-alert-title" class="custom-input" required autocomplete="off">
      </div>

      <div class="form-field">
        <label for="edit-alert-desc" class="form-label">Descripción (opcional)</label>
        <textarea id="edit-alert-desc" name="edit_alert_desc" class="custom-textarea" rows="3"></textarea>
      </div>

      <div class="form-field-row">
        <div class="form-field">
          <label for="edit-alert-type" class="form-label">Categoría</label>
          <x-custom-select id="edit-alert-type" name="edit_alert_type">
            <option value="academic">Académica</option>
            <option value="administrative">Administrativa</option>
            <option value="personal">Personal</option>
          </x-custom-select>
        </div>
        <div class="form-field">
          <label for="edit-alert-priority" class="form-label">Prioridad</label>
          <x-custom-select id="edit-alert-priority" name="edit_alert_priority">
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </x-custom-select>
        </div>
      </div>

      <div class="form-field">
        <legend class="form-label">Color para pintar el día en calendario</legend>
        <input type="hidden" id="edit-alert-color" value="#2563eb">
        <fieldset class="alert-color-palette" id="edit-alert-color-palette">
          <button type="button" class="alert-color-swatch" data-color="#2563eb" aria-label="Azul" title="Azul"></button>
          <button type="button" class="alert-color-swatch" data-color="#0ea5e9" aria-label="Celeste" title="Celeste"></button>
          <button type="button" class="alert-color-swatch" data-color="#14b8a6" aria-label="Turquesa" title="Turquesa"></button>
          <button type="button" class="alert-color-swatch" data-color="#22c55e" aria-label="Verde" title="Verde"></button>
          <button type="button" class="alert-color-swatch" data-color="#84cc16" aria-label="Lima" title="Lima"></button>
          <button type="button" class="alert-color-swatch" data-color="#eab308" aria-label="Amarillo" title="Amarillo"></button>
          <button type="button" class="alert-color-swatch" data-color="#f97316" aria-label="Naranja" title="Naranja"></button>
          <button type="button" class="alert-color-swatch" data-color="#ef4444" aria-label="Rojo" title="Rojo"></button>
          <button type="button" class="alert-color-swatch" data-color="#ec4899" aria-label="Rosa" title="Rosa"></button>
          <button type="button" class="alert-color-swatch" data-color="#8b5cf6" aria-label="Violeta" title="Violeta"></button>
        </fieldset>
      </div>

      <div class="form-field">
        <label for="edit-alert-date" class="form-label">Fecha de Vencimiento</label>
        <input type="date" id="edit-alert-date" class="custom-input" required>
      </div>
    </form>
    
    <div class="modal-foot">
      <button type="button" class="btn btn--cancel" data-js="modal-close">Cancelar</button>
      <button type="submit" form="edit-alert-form" class="btn btn--primary"><span>Guardar <span class="u-hidden-mobile">Cambios</span></span></button>
    </div>
  </x-modal>

@endsection

@push('scripts')
  <script type="module" src="{{ asset('js/views/alertas/alertas-main.js') }}"></script>
@endpush
