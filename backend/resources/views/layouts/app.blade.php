<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title', 'Cursus - Asistente de Estudiantes')</title>
  <link rel="stylesheet" href="{{ asset('css/main.css') }}">
  <link rel="stylesheet" href="{{ asset('css/layout/sidebar.css') }}">
  <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">
  @stack('styles')
</head>

<body>
  <script>
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
      document.body.classList.add('sidebar-collapsed');
    }
  </script>
<div class="app">

  @include('partials.sidebar')

  <!-- Menú de perfil — fuera del sidebar para que sea visible en mobile -->
  <div class="profile-menu" id="profile-menu">
    <button class="profile-menu-item" onclick="window.openProfileModal()">
      <svg class="pmenu-ic" aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#user') }}"></use></svg>
      Perfil
    </button>
    <button class="profile-menu-item" onclick="window.openContactModal()">
      <svg class="pmenu-ic" aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#message-square') }}"></use></svg>
      Contacto
    </button>
    <div class="profile-menu-divider"></div>
    <div class="profile-menu-item profile-menu-switch-row" onclick="event.stopPropagation()">
      <span>Animaciones</span>
      <label class="ios-switch">
        <input type="checkbox" id="animaciones-toggle" data-animaciones-toggle>
        <span class="slider"></span>
      </label>
    </div>
    <div class="profile-menu-divider"></div>
    <button class="profile-menu-item" onclick="window.handleLogout()">
      <svg class="pmenu-ic" aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#log-out') }}"></use></svg>
      Cerrar Sesión
    </button>
  </div>

  <!-- ===================== MAIN ===================== -->
  <div class="main">

    <!-- Mobile header (Optional: Page specific or fallback) -->
    @yield('mobile-header')
    <button class="theme-toggle-btn theme-toggle-mobile" data-theme-toggle aria-label="Cambiar tema" title="Cambiar tema">
      <svg class="icon-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      <svg class="icon-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
    </button>

    <!-- Topbar (desktop) -->
    <header class="topbar">
      @yield('topbar-content')
      <button class="theme-toggle-btn theme-toggle-desktop" data-theme-toggle aria-label="Cambiar tema" title="Cambiar tema">
        <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>
    </header>

    <!-- Page Content -->
    <div class="page">
      @yield('content')
    </div>

  </div><!-- /main -->

  <!-- ======== BOTTOM NAV (mobile) ======== -->
  <nav class="bnav">
    <div class="bnav-row">
      <div class="bn {{ Request::routeIs('dashboard') ? 'on' : '' }}" onclick="location.href='{{ route('dashboard') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#layout-dashboard') }}"></use></svg>
        <span class="bn-lbl">Inicio</span>
      </div>
      <div class="bn {{ Request::routeIs('materias') ? 'on' : '' }}" onclick="location.href='{{ route('materias') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#library') }}"></use></svg>
        <span class="bn-lbl">Materias</span>
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
      <div class="bn {{ Request::routeIs('alertas') ? 'on' : '' }}" onclick="location.href='{{ route('alertas') }}'">
        <span class="bnav-icon-wrapper" style="position: relative; display: flex; align-items: center; justify-content: center;">
          <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#bell') }}"></use></svg>
          <span class="bn-badge" id="bnav-badge-count">0</span>
        </span>
        <span class="bn-lbl">Alertas</span>
      </div>
      <div class="bn {{ Request::routeIs('progreso') ? 'on' : '' }}" onclick="location.href='{{ route('progreso') }}'">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#trending-up') }}"></use></svg>
        <span class="bn-lbl">Progreso</span>
      </div>
      <div class="bn" id="bn-profile" onclick="window.toggleMobileProfileMenu(event)">
        <svg class="bn-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#user') }}"></use></svg>
        <span class="bn-lbl">Perfil</span>
      </div>
    </div>
  </nav>

</div><!-- /app -->

<!-- Modal de Contacto -->
<div class="contact-overlay" id="contact-overlay">
  <div class="contact-box">
    <div class="contact-header">
      <div class="contact-title">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 3h12v8H9l-3 2.5V11H2V3z" stroke="var(--brand)" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        Contacto
      </div>
      <button class="contact-close" onclick="window.closeContactModal()">✕</button>
    </div>
    <div class="contact-body">
      <p class="contact-subtitle">¿Encontraste un bug o tenés una sugerencia? Contanos y lo mejoramos.</p>
      <form id="contact-form" onsubmit="window.handleContactSubmit(event)">
        <div class="contact-field">
          <label for="contact-type">Tipo</label>
          <select id="contact-type" class="contact-input">
            <option value="bug">🐛 Bug / Error</option>
            <option value="mejora">💡 Sugerencia de mejora</option>
            <option value="otro">💬 Otro</option>
          </select>
        </div>
        <div class="contact-field">
          <label for="contact-subject">Asunto</label>
          <input type="text" id="contact-subject" class="contact-input" placeholder="Ej: El calendario no muestra el mes correcto" required>
        </div>
        <div class="contact-field">
          <label for="contact-body-msg">Descripción</label>
          <textarea id="contact-body-msg" class="contact-input contact-textarea" placeholder="Describí el problema o tu sugerencia con detalle..." required></textarea>
        </div>
        <div class="contact-footer">
          <button type="button" class="contact-btn-cancel" onclick="window.closeContactModal()">Cancelar</button>
          <button type="submit" class="contact-btn-send">Enviar mensaje</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Modal de Perfil -->
<div class="contact-overlay" id="profile-edit-overlay">
  <div class="contact-box">
    <div class="contact-header">
      <div class="contact-title">
        <img class="contact-title-ic" src="{{ asset('assets/icons/user.svg') }}" alt="Perfil" style="width: 16px; height: 16px; opacity: 0.9;">
        Editar perfil
      </div>
      <button class="contact-close" onclick="window.closeProfileModal()">✕</button>
    </div>
    <div class="contact-body">
      <p class="contact-subtitle">Actualizá tus datos personales.</p>
      <form id="profile-edit-form" onsubmit="window.handleProfileSubmit(event)">
        <div class="contact-field">
          <label for="profile-nombre">Nombre completo</label>
          <input type="text" id="profile-nombre" class="contact-input" placeholder="Ej: Juan Pérez" required>
          <span id="profile-nombre-error" class="error-message"></span>
        </div>
        <div class="contact-field">
          <label for="profile-legajo">Legajo</label>
          <input type="text" id="profile-legajo" class="contact-input" placeholder="Ej: 12345">
          <span id="profile-legajo-error" class="error-message"></span>
        </div>
        <div class="contact-field">
          <label for="profile-email">Email</label>
          <input type="email" id="profile-email" class="contact-input" placeholder="nombre@ejemplo.com" required>
          <span id="profile-email-error" class="error-message"></span>
        </div>
        <div class="contact-footer">
          <button type="button" class="contact-btn-cancel" onclick="window.closeProfileModal()">Cancelar</button>
          <button type="submit" class="contact-btn-send">Guardar cambios</button>
        </div>
        <button type="button" class="btn-change-pwd" onclick="window.openChangePasswordModal()">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
          </svg>
          Cambiar contraseña
        </button>
      </form>
    </div>
  </div>
</div>

<!-- Modal de Cambiar Contraseña -->
<div class="contact-overlay" id="change-password-overlay">
  <div class="contact-box">
    <div class="contact-header">
      <div class="contact-title">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="var(--brand)" stroke-width="1.4"/>
          <path d="M5 7V5a3 3 0 016 0v2" stroke="var(--brand)" stroke-width="1.4" stroke-linecap="round"/>
          <circle cx="8" cy="10.5" r="1" fill="var(--brand)"/>
        </svg>
        Cambiar contraseña
      </div>
      <button class="contact-close" onclick="window.closeChangePasswordModal()">✕</button>
    </div>
    <div class="contact-body">
      <form id="change-password-form" onsubmit="window.handleChangePasswordSubmit(event)">
        <div class="contact-field">
          <label for="cp-current">Contraseña actual</label>
          <input type="password" id="cp-current" class="contact-input" placeholder="••••••••" autocomplete="current-password">
          <span id="cp-current-error" class="error-message"></span>
        </div>
        <div class="contact-field">
          <label for="cp-new">Nueva contraseña</label>
          <input type="password" id="cp-new" class="contact-input" placeholder="••••••••" autocomplete="new-password">
          <span id="cp-new-error" class="error-message"></span>
        </div>
        <div class="contact-field">
          <label for="cp-confirm">Confirmar nueva contraseña</label>
          <input type="password" id="cp-confirm" class="contact-input" placeholder="••••••••" autocomplete="new-password">
          <span id="cp-confirm-error" class="error-message"></span>
        </div>
        <p id="cp-success" class="login-success-message" hidden></p>
        <div class="contact-footer">
          <button type="button" class="contact-btn-cancel" onclick="window.closeChangePasswordModal()">Cancelar</button>
          <button type="submit" class="contact-btn-send" id="cp-submit">Guardar cambios</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Scripts -->
<script src="{{ asset('js/theme.js') }}"></script>
<script src="{{ asset('js/animations.js') }}"></script>
<script src="{{ asset('js/celebracion.js') }}"></script>
<script src="{{ asset('js/shared/sidebar.js') }}"></script>
<script src="{{ asset('js/script.js') }}"></script>
<script src="{{ asset('js/profile.js') }}"></script>
@stack('scripts')

</body>
</html>
