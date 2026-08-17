<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" id="color-scheme-meta" content="light">
  <title>@yield('title', 'Cursus - Asistente de Estudiantes')</title>
  <link rel="stylesheet" href="{{ asset('css/base/fonts.css') }}">
  <link rel="stylesheet" href="{{ asset('css/base/variables.css') }}">
  <link rel="stylesheet" href="{{ asset('css/base/reset.css') }}">
  <link rel="stylesheet" href="{{ asset('css/base/animations.css') }}">
  <link rel="stylesheet" href="{{ asset('css/layout/grid.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/alerts.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/badges.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/cards.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/stats.css') }}">
  <link rel="stylesheet" href="{{ asset('css/layout/app.css') }}">
  <link rel="stylesheet" href="{{ asset('css/layout/topbar.css') }}">
  <link rel="stylesheet" href="{{ asset('css/layout/mobile-nav.css') }}">
  <link rel="stylesheet" href="{{ asset('css/layout/sidebar.css') }}">
  <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">
  <link rel="stylesheet" href="{{ asset('css/components/pomo-float.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/toast.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/modals.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/forms.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/buttons.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/tabs.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/celebracion.css') }}">
  <link rel="stylesheet" href="{{ asset('css/base/utils.css') }}">
  @stack('styles')
</head>

<body hidden class="{{ Request::routeIs('admin.*') ? 'route-admin' : '' }}">
  <!-- FONDO PERSONALIZABLE DEL PANEL -->
  <div class="dashboard-bg" id="js-dashboard-bg"></div>

  <script>
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
      document.body.classList.add('sidebar-collapsed');
    }
  </script>
<div class="app">

  @include('partials.sidebar')

  <!-- Menú de perfil — fuera del sidebar para que sea visible en mobile -->
  <div class="profile-menu" id="profile-menu">
    <div class="profile-menu-header">
      <div class="pm-user-info">
        <div class="sb-av" id="pm-av">{{ $viewerInitials ?? '' }}</div>
        <div class="pm-user-details">
          <div class="pm-uname" id="pm-uname">{{ $viewerFullName ?? '' }}</div>
          <div class="pm-uleg" id="pm-uleg">{{ $viewerLegajo ? 'Legajo ' . $viewerLegajo : '' }}</div>
        </div>
      </div>
      <button class="pm-close-btn" data-js="pm-close" aria-label="Cerrar menú">
        <svg aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#x') }}"></use></svg>
      </button>
    </div>
    <button class="profile-menu-item" data-js="open-profile-modal">
      <svg class="pmenu-ic" aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#user') }}"></use></svg>
      Perfil
    </button>
    <button class="profile-menu-item" data-js="open-contact-modal">
      <svg class="pmenu-ic" aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#message-square') }}"></use></svg>
      Contacto
    </button>
    <button class="profile-menu-item" data-js="start-tour-btn">
      <svg class="pmenu-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
      </svg>
      Guía Rápida
    </button>
    <div class="profile-menu-divider"></div>
    <div class="profile-menu-item profile-menu-switch-row" data-prevent-close="true">
      <span>Animaciones</span>
      <label class="ios-switch">
        <input type="checkbox" id="animaciones-toggle" data-animaciones-toggle>
        <span class="slider"></span>
      </label>
    </div>
    <div class="profile-menu-item profile-menu-switch-row" data-prevent-close="true">
      <span>Widget Pomodoro</span>
      <label class="ios-switch">
        <input type="checkbox" id="global-widget-toggle">
        <span class="slider"></span>
      </label>
    </div>
    <div class="profile-menu-divider"></div>
    <button class="profile-menu-item" data-js="handle-logout">
      <svg class="pmenu-ic" aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#log-out') }}"></use></svg>
      Cerrar Sesión
    </button>
  </div>

  <!-- ===================== MAIN ===================== -->
  <div class="main">

    <!-- Mobile header (Centralizado) -->
    <header class="mob-hdr">
      <div class="mob-hdr-content">
        @yield('mobile-header-content')
      </div>
      <div class="mob-header-actions">
        @yield('mobile-header-actions')
        <button class="theme-toggle-btn theme-toggle-mobile" data-theme-toggle aria-label="Cambiar tema" title="Cambiar tema">
          <svg class="icon-sun" width="15" height="15"><use href="{{ asset('assets/icons/sprite.svg#sun') }}"></use></svg>
          <svg class="icon-moon" width="15" height="15"><use href="{{ asset('assets/icons/sprite.svg#moon') }}"></use></svg>
        </button>
        <div class="sb-av" id="bn-av" data-js="bn-av-trigger" title="Opciones de perfil">{{ $viewerInitials ?? '' }}</div>
      </div>
    </header>

    <!-- Topbar (desktop) -->
    <header class="topbar">
      @yield('topbar-content')
      <button class="theme-toggle-btn theme-toggle-desktop" data-theme-toggle aria-label="Cambiar tema" title="Cambiar tema">
        <svg class="icon-sun" width="18" height="18"><use href="{{ asset('assets/icons/sprite.svg#sun') }}"></use></svg>
        <svg class="icon-moon" width="18" height="18"><use href="{{ asset('assets/icons/sprite.svg#moon') }}"></use></svg>
      </button>
    </header>

    <!-- Page Content -->
    <div class="page">
      @yield('content')
    </div>

  </div><!-- /main -->

  <!-- ======== BOTTOM NAV (mobile) ======== -->
  <!-- Barra Admin (se muestra solo para admins vía CSS en mobile) -->
  <nav class="bnav admin-bnav">
    <div class="bnav-row">
      <div class="bn {{ Request::routeIs('admin.alumnos') ? 'on' : '' }}" onclick="location.href='{{ route('admin.alumnos') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#user') }}"></use></svg>
        <span class="bn-lbl">Alumnos</span>
      </div>
      <div class="bn {{ Request::routeIs('admin.cuotas') ? 'on' : '' }}" onclick="location.href='{{ route('admin.cuotas') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#wallet') }}"></use></svg>
        <span class="bn-lbl">Cuotas</span>
      </div>
      <div class="bn {{ Request::routeIs('admin.plan-estudios') ? 'on' : '' }}" onclick="location.href='{{ route('admin.plan-estudios') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#graduation-cap') }}"></use></svg>
        <span class="bn-lbl">Plan Estudios</span>
      </div>
      <div class="bn {{ !Request::routeIs('admin.*') ? 'on' : '' }}" id="btn-toggle-student-menu">
        <span class="bnav-icon-wrapper">
          <svg class="bn-ic" id="student-menu-caret" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#chevron-up') }}"></use></svg>
        </span>
        <span class="bn-lbl">Vista Alumno</span>
      </div>
    </div>

    <!-- Menú flotante de Vista Alumno (Se despliega sobre el menú admin) -->
    <div class="student-menu-popup" id="student-menu-popup">
      <div class="student-menu-popup-title">Menú Vista Alumno</div>
      <div class="student-menu-grid">
        <div class="sm-item {{ Request::routeIs('dashboard') ? 'on' : '' }}" onclick="location.href='{{ route('dashboard') }}'">
          <svg class="sm-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#layout-dashboard') }}"></use></svg>
          <span class="sm-lbl">Inicio</span>
        </div>
        <div class="sm-item {{ Request::routeIs('materias') ? 'on' : '' }}" onclick="location.href='{{ route('materias') }}'">
          <svg class="sm-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#library') }}"></use></svg>
          <span class="sm-lbl">Materias</span>
        </div>
        <div class="sm-item {{ Request::routeIs('area-estudio') ? 'on' : '' }}" onclick="location.href='{{ route('area-estudio') }}'">
          <svg class="sm-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#clock') }}"></use></svg>
          <span class="sm-lbl">Estudio</span>
        </div>
        <div class="sm-item {{ Request::routeIs('horarios') ? 'on' : '' }}" onclick="location.href='{{ route('horarios') }}'">
          <svg class="sm-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#calendar') }}"></use></svg>
          <span class="sm-lbl">Horarios</span>
        </div>
        <div class="sm-item {{ Request::routeIs('beneficios') ? 'on' : '' }}" onclick="location.href='{{ route('beneficios') }}'">
          <svg class="sm-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#gift') }}"></use></svg>
          <span class="sm-lbl">Beneficios</span>
        </div>
        <div class="sm-item {{ Request::routeIs('flashcards') ? 'on' : '' }}" onclick="location.href='{{ route('flashcards') }}'">
          <svg class="sm-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#book-copy') }}"></use></svg>
          <span class="sm-lbl">Flashcards</span>
        </div>
        <div class="sm-item {{ Request::routeIs('alertas') ? 'on' : '' }}" onclick="location.href='{{ route('alertas') }}'">
          <svg class="sm-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#bell') }}"></use></svg>
          <span class="sm-lbl">Alertas</span>
        </div>
        <div class="sm-item {{ Request::routeIs('progreso') ? 'on' : '' }}" onclick="location.href='{{ route('progreso') }}'">
          <svg class="sm-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#trending-up') }}"></use></svg>
          <span class="sm-lbl">Progreso</span>
        </div>
      </div>
    </div>
  </nav>

  <!-- Barra Alumno (se muestra para usuarios no-admins vía CSS en mobile) -->
  <nav class="bnav student-bnav">
    <div class="bnav-row">
      <div class="bn {{ Request::routeIs('dashboard') ? 'on' : '' }}" onclick="location.href='{{ route('dashboard') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#layout-dashboard') }}"></use></svg>
        <span class="bn-lbl">Inicio</span>
      </div>
      <div class="bn {{ Request::routeIs('materias') ? 'on' : '' }}" onclick="location.href='{{ route('materias') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#library') }}"></use></svg>
        <span class="bn-lbl">Mis Materias</span>
      </div>
      <div class="bn {{ Request::routeIs('area-estudio') ? 'on' : '' }}" onclick="location.href='{{ route('area-estudio') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#clock') }}"></use></svg>
        <span class="bn-lbl">Estudio</span>
      </div>
      <div class="bn {{ Request::routeIs('horarios') ? 'on' : '' }}" onclick="location.href='{{ route('horarios') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#calendar') }}"></use></svg>
        <span class="bn-lbl">Horarios</span>
      </div>
      <div class="bn {{ Request::routeIs('beneficios') ? 'on' : '' }}" onclick="location.href='{{ route('beneficios') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#gift') }}"></use></svg>
        <span class="bn-lbl">Beneficios</span>
      </div>
      <div class="bn {{ Request::routeIs('flashcards') ? 'on' : '' }}" onclick="location.href='{{ route('flashcards') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#book-copy') }}"></use></svg>
        <span class="bn-lbl">Flashcards</span>
      </div>
      <div class="bn {{ Request::routeIs('alertas') ? 'on' : '' }}" onclick="location.href='{{ route('alertas') }}'">
        <span class="bnav-icon-wrapper">
          <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#bell') }}"></use></svg>
          <span class="bn-badge" id="bnav-badge-count">0</span>
        </span>
        <span class="bn-lbl">Alertas</span>
      </div>
      <div class="bn {{ Request::routeIs('progreso') ? 'on' : '' }}" onclick="location.href='{{ route('progreso') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#trending-up') }}"></use></svg>
        <span class="bn-lbl">Progreso</span>
      </div>
    </div>
  </nav>

</div><!-- /app -->

{{-- ===================== MODAL DE CONTACTO ===================== --}}
<x-modal id="contact-modal" title="Contacto" icon="message-square" maxWidth="460px">
  <div class="modal-body">
    <p class="form-hint">¿Encontraste un bug o tenés una sugerencia? Contanos y lo mejoramos.</p>
    <form id="contact-form" class="form-body" novalidate>
      <div class="form-field">
        <label class="form-label" for="contact-type">Tipo</label>
        <x-custom-select id="contact-type">
          <option value="bug">🐛 Bug / Error</option>
          <option value="mejora">💡 Sugerencia de mejora</option>
          <option value="otro">💬 Otro</option>
        </x-custom-select>
      </div>
      <div class="form-field">
        <label class="form-label" for="contact-subject">Asunto</label>
        <input type="text" id="contact-subject" class="custom-input" placeholder="Ej: El calendario no muestra el mes correcto" required>
      </div>
      <div class="form-field">
        <label class="form-label" for="contact-body-msg">Descripción</label>
        <textarea id="contact-body-msg" class="custom-textarea" placeholder="Describí el problema o tu sugerencia con detalle..." required></textarea>
      </div>
    </form>
  </div>
  <div class="modal-foot">
    <button type="button" class="btn btn--cancel" data-js="modal-close">Cancelar</button>
    <button type="submit" form="contact-form" class="btn btn--primary" id="contact-submit-btn">Enviar mensaje</button>
  </div>
</x-modal>

{{-- ===================== MODAL DE PERFIL ===================== --}}
<x-modal id="profile-edit-modal" title="Editar perfil" icon="user" maxWidth="480px">
  <div class="modal-body">
    <p class="form-hint">Actualizá tus datos personales.</p>

    {{-- Avatar --}}
    <div class="profile-avatar-edit">
      <div class="profile-avatar-preview" id="profile-avatar-preview">{{ $viewerInitials ?? '' }}</div>
      <button type="button" class="profile-avatar-pencil" data-js="avatar-pencil" title="Cambiar foto de perfil">
        <svg width="13" height="13" aria-hidden="true" focusable="false">
          <use href="{{ asset('assets/icons/sprite.svg#square-pen') }}"></use>
        </svg>
      </button>
      <button type="button" class="profile-avatar-trash" id="profile-avatar-delete-btn" data-js="avatar-delete" title="Eliminar foto de perfil" hidden>
        <svg width="13" height="13" aria-hidden="true" focusable="false">
          <use href="{{ asset('assets/icons/sprite.svg#trash-2') }}"></use>
        </svg>
      </button>
      <input type="file" id="profile-avatar-input" accept="image/png,image/jpeg" hidden>
    </div>
    <span id="profile-avatar-error" class="error-message" aria-live="polite"></span>

    <form id="profile-edit-form" class="form-body" novalidate>
      <div class="form-field">
        <label class="form-label" for="profile-nombre">Nombre completo</label>
        <input type="text" id="profile-nombre" class="custom-input" placeholder="Ej: Juan Pérez" required>
        <span id="profile-nombre-error" class="error-message" aria-live="polite"></span>
      </div>
      <div class="form-field">
        <label class="form-label" for="profile-legajo">Legajo</label>
        <input type="text" id="profile-legajo" class="custom-input" placeholder="Ej: 12345">
        <span id="profile-legajo-error" class="error-message" aria-live="polite"></span>
      </div>
      <div class="form-field">
        <label class="form-label" for="profile-email">Email</label>
        <input type="email" id="profile-email" class="custom-input" placeholder="nombre@ejemplo.com" required>
        <span id="profile-email-error" class="error-message" aria-live="polite"></span>
      </div>

      <p class="form-section-title text-brand-bold">Personalización de Pantalla</p>

      <div class="form-field">
        <label class="form-label" for="profile-bg-preset">Fondo de Pantalla</label>
        <x-custom-select id="profile-bg-preset" data-js="bg-preset-select">
          <option value="none">Sin imagen (Fondo plano)</option>
          <option value="utn-haedo">Fondo UTN Haedo (Fachada - Defecto)</option>
          <option value="utn-building">Fondo UTN Haedo (Edificio)</option>
          <option value="study-cozy">Escritorio Cozy (Programación)</option>
          <option value="minecraft">Minecraft (Relajante)</option>
          <option value="lofi-room">Habitación Lo-Fi (Estilo de estudio)</option>
          <option value="custom">Subir imagen propia...</option>
        </x-custom-select>
      </div>

      <div class="form-field" id="profile-bg-upload-container" hidden>
        <div class="profile-bg-upload-row">
          <button type="button" class="btn btn--primary" data-js="bg-select-btn">Seleccionar imagen</button>
          <button type="button" class="btn btn--danger" id="profile-bg-delete-btn" data-js="bg-delete" hidden>Eliminar imagen</button>
        </div>
        <p class="form-hint">Tamaño máximo permitido: <strong>4 MB</strong> (Formatos: JPG, PNG).</p>
        <input type="file" id="profile-bg-input" accept="image/png,image/jpeg" hidden>
        <span id="profile-bg-error" class="error-message" aria-live="polite"></span>
      </div>

      <div class="form-field" id="profile-bg-opacity-container" hidden>
        <label class="form-label form-label--split" for="profile-bg-opacity">
          <span>Opacidad de la imagen</span>
          <span id="profile-bg-opacity-value" class="text-brand-bold">10%</span>
        </label>
        <input type="range" id="profile-bg-opacity" min="0" max="30" step="1" value="10" class="form-range" data-js="bg-opacity-range">
      </div>

      <div class="form-field" id="profile-bg-blur-container" hidden>
        <label class="form-label form-label--split" for="profile-bg-blur">
          <span>Desenfoque (Blur)</span>
          <span id="profile-bg-blur-value" class="text-brand-bold">1.8px</span>
        </label>
        <input type="range" id="profile-bg-blur" min="0" max="8" step="0.2" value="1.8" class="form-range" data-js="bg-blur-range">
      </div>
    </form>
  </div>
  <div class="modal-foot profile-modal-foot">
    <button type="button" class="btn btn--pay" data-js="open-change-password">
      <svg width="14" height="14" aria-hidden="true" focusable="false">
        <use href="{{ asset('assets/icons/sprite.svg#lock-keyhole') }}"></use>
      </svg>
      Cambiar contraseña
    </button>
    <div class="profile-modal-foot__actions">
      <button type="button" class="btn btn--cancel" data-js="modal-close">Cancelar</button>
      <button type="submit" form="profile-edit-form" class="btn btn--primary" id="profile-submit-btn">Guardar cambios</button>
    </div>
  </div>
</x-modal>

{{-- ===================== MODAL DE CAMBIAR CONTRASEÑA ===================== --}}
<x-modal id="change-password-modal" title="Cambiar contraseña" icon="lock-keyhole" maxWidth="460px">
  <div class="modal-body">
    <form id="change-password-form" class="form-body" novalidate>
      <div class="form-field">
        <label class="form-label" for="cp-current">Contraseña actual</label>
        <input type="password" id="cp-current" class="custom-input" placeholder="••••••••" autocomplete="current-password">
        <span id="cp-current-error" class="error-message" aria-live="polite"></span>
      </div>
      <div class="form-field">
        <label class="form-label" for="cp-new">Nueva contraseña</label>
        <input type="password" id="cp-new" class="custom-input" placeholder="••••••••" autocomplete="new-password">
        <span id="cp-new-error" class="error-message" aria-live="polite"></span>
      </div>
      <div class="form-field">
        <label class="form-label" for="cp-confirm">Confirmar nueva contraseña</label>
        <input type="password" id="cp-confirm" class="custom-input" placeholder="••••••••" autocomplete="new-password">
        <span id="cp-confirm-error" class="error-message" aria-live="polite"></span>
      </div>
      <p id="cp-success" class="form-success-message" hidden></p>
    </form>
  </div>
  <div class="modal-foot">
    <button type="button" class="btn btn--cancel" data-js="modal-close">Cancelar</button>
    <button type="submit" form="change-password-form" class="btn btn--primary" id="cp-submit">Guardar cambios</button>
  </div>
</x-modal>

<!-- Contenedor global de Toasts -->
<div class="toast-container" id="toast-container"></div>

<!-- Scripts -->
<script src="{{ asset('js/shared/theme.js') }}?v={{ filemtime(public_path('js/shared/theme.js')) }}"></script>
<script src="{{ asset('js/shared/animations.js') }}"></script>
<script src="{{ asset('js/shared/celebracion.js') }}"></script>
<script src="{{ asset('js/shared/sidebar.js') }}"></script>
<script src="{{ asset('js/shared/toast.js') }}"></script>
{{-- Profile.js ha sido vaciado y marcado como @deprecated. Sus responsabilidades --}}
{{-- fueron migradas a los nuevos módulos ES6 listados a continuación.            --}}
<script type="module" src="{{ asset('js/services/AuthService.js') }}"></script>
<script type="module" src="{{ asset('js/shared/workspace-bg.js') }}"></script>
<script type="module" src="{{ asset('js/shared/alerts-badge.js') }}"></script>
<script type="module" src="{{ asset('js/shared/profile-menu.js') }}"></script>
<script type="module" src="{{ asset('js/components/contact-modal.js') }}"></script>
<script type="module" src="{{ asset('js/components/change-password-modal.js') }}"></script>
<script type="module" src="{{ asset('js/components/profile-modal.js') }}"></script>
<script type="module" src="{{ asset('js/views/pomo-float.js') }}?v={{ filemtime(public_path('js/views/pomo-float.js')) }}"></script>
@if(Request::routeIs('dashboard') || Request::routeIs('area-estudio'))
<script src="{{ asset('js/views/onboarding.js') }}?v={{ filemtime(public_path('js/views/onboarding.js')) }}"></script>
@endif
<script src="{{ asset('js/shared/app-init.js') }}"></script>
<script type="module" src="{{ asset('js/components/modal.js') }}"></script>
@stack('scripts')

</body>
</html>
