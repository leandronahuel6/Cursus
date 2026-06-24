<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title', 'Cursus - Asistente de Estudiantes')</title>
  <link rel="stylesheet" href="{{ asset('css/main.css') }}">
  <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">
  @stack('styles')
</head>

<body>
<div class="app">

  <!-- ===================== SIDEBAR ===================== -->
  <aside class="sidebar">
    <div class="sb-logo">
      <div class="sb-logo-icon"><img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus"></div>
      <div class="sb-logo-text">Cursus<small>Tec. en Programación</small></div>
    </div>

    <nav class="sb-nav">
      <div class="nav-item {{ Request::routeIs('dashboard') ? 'active' : '' }}" onclick="location.href='{{ route('dashboard') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/></svg>
        Inicio
      </div>
      <div class="nav-item {{ Request::routeIs('materias') ? 'active' : '' }}" onclick="location.href='{{ route('materias') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h7M3 11h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        Mis Materias
      </div>
      <div class="nav-item {{ Request::routeIs('area-estudio') ? 'active' : '' }}" onclick="location.href='{{ route('area-estudio') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Área de Estudio
      </div>

      <div class="nav-group">Académico</div>
      <div class="nav-item {{ Request::routeIs('horarios') ? 'active' : '' }}" onclick="location.href='{{ route('horarios') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7h6M5 10h4M5 5h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        Simulador de Horarios
      </div>
      <div class="nav-item {{ Request::routeIs('beneficios') ? 'active' : '' }}" onclick="location.href='{{ route('beneficios') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none">
          <path d="M2.5 5.5h11v2H2.5v-2zm1.5-3h8v3h-8v-3zm-1 5h10v6a1 1 0 01-1 1h-8a1 1 0 01-1-1v-6z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M8 5.5v8.5" stroke="currentColor" stroke-width="1.4"/>
        </svg>
        Beneficios
      </div>
      <div class="nav-group">Personal</div>
      <div class="nav-item {{ Request::routeIs('alertas') ? 'active' : '' }}" onclick="location.href='{{ route('alertas') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4 4 0 014 4c0 2.5 1.2 3.5 1.5 4.5H2.5C2.8 9 4 8 4 5.5a4 4 0 014-4z" stroke="currentColor" stroke-width="1.4"/><path d="M6.5 10c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5" stroke="currentColor" stroke-width="1.3"/></svg>
        Alertas
        <span class="nav-badge" id="nav-badge-count">0</span>
      </div>
      <div class="nav-item {{ Request::routeIs('progreso') ? 'active' : '' }}" onclick="location.href='{{ route('progreso') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><path d="M2 12L5 8l3 2.5L11 5l3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Mi Progreso
      </div>
    </nav>

    <div class="sb-user" onclick="window.toggleProfileMenu(event)">
      <div class="sb-av" id="sb-av">{{ $viewerInitials ?? '' }}</div>
      <div>
        <div class="sb-uname" id="sb-uname">{{ $viewerFullName ?? '' }}</div>
        <div class="sb-uleg" id="sb-uleg">{{ $viewerLegajo ? 'Legajo ' . $viewerLegajo : '' }}</div>
      </div>
      <svg class="sb-user-caret" viewBox="0 0 10 6" fill="currentColor" width="10" height="10">
        <path d="M0 5l5-5 5 5H0z"/>
      </svg>
    </div>
  </aside>

  <!-- Menú de perfil — fuera del sidebar para que sea visible en mobile -->
  <div class="profile-menu" id="profile-menu">
    <button class="profile-menu-item" onclick="window.openProfileModal()">
      <img class="pmenu-ic" src="{{ asset('assets/icons/user.svg') }}" alt="Perfil">
      Perfil
    </button>
    <button class="profile-menu-item" onclick="window.openContactModal()">
      <img class="pmenu-ic" src="{{ asset('assets/icons/message-square.svg') }}" alt="Contacto">
      Contacto
    </button>
    <div class="profile-menu-divider"></div>
    <button class="profile-menu-item danger" onclick="window.handleLogout()">
      <svg class="pmenu-ic" viewBox="0 0 16 16" fill="none">
        <path d="M6 3H3v10h3M10 5l3 3-3 3M13 8H6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
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
        <img class="bn-ic" src="{{ asset('assets/icons/layout-dashboard.svg') }}" alt="Inicio">
        <span class="bn-lbl">Inicio</span>
      </div>
      <div class="bn {{ Request::routeIs('materias') ? 'on' : '' }}" onclick="location.href='{{ route('materias') }}'">
        <img class="bn-ic" src="{{ asset('assets/icons/book-copy.svg') }}" alt="Materias">
        <span class="bn-lbl">Materias</span>
      </div>
      <div class="bn {{ Request::routeIs('area-estudio') ? 'on' : '' }}" onclick="location.href='{{ route('area-estudio') }}'">
        <img class="bn-ic" src="{{ asset('assets/icons/timer.svg') }}" alt="Estudio">
        <span class="bn-lbl">Estudio</span>
      </div>
      <div class="bn {{ Request::routeIs('horarios') ? 'on' : '' }}" onclick="location.href='{{ route('horarios') }}'">
        <img class="bn-ic" src="{{ asset('assets/icons/calendar.svg') }}" alt="Horarios">
        <span class="bn-lbl">Horarios</span>
      </div>
      <div class="bn {{ Request::routeIs('beneficios') ? 'on' : '' }}" onclick="location.href='{{ route('beneficios') }}'">
        <img class="bn-ic" src="{{ asset('assets/icons/wallet.svg') }}" alt="Beneficios">
        <span class="bn-lbl">Beneficios</span>
      </div>
      <div class="bn {{ Request::routeIs('alertas') ? 'on' : '' }}" onclick="location.href='{{ route('alertas') }}'">
        <span class="bnav-icon-wrapper" style="position: relative; display: flex; align-items: center; justify-content: center;">
          <img class="bn-ic" src="{{ asset('assets/icons/bell.svg') }}" alt="Alertas">
          <span class="bn-badge" id="bnav-badge-count">0</span>
        </span>
        <span class="bn-lbl">Alertas</span>
      </div>
      <div class="bn {{ Request::routeIs('progreso') ? 'on' : '' }}" onclick="location.href='{{ route('progreso') }}'">
        <img class="bn-ic" src="{{ asset('assets/icons/chart-line.svg') }}" alt="Progreso">
        <span class="bn-lbl">Progreso</span>
      </div>
      <div class="bn" id="bn-profile" onclick="window.toggleMobileProfileMenu(event)">
        <img class="bn-ic" src="{{ asset('assets/icons/user.svg') }}" alt="Perfil">
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
<script src="{{ asset('js/script.js') }}"></script>
<script src="{{ asset('js/profile.js') }}"></script>
@stack('scripts')

</body>
</html>
