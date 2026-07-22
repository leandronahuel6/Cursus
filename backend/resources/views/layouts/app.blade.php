<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" id="color-scheme-meta" content="light">
  <title>@yield('title', 'Cursus - Asistente de Estudiantes')</title>
  <link rel="stylesheet" href="{{ asset('css/main.css') }}?v={{ filemtime(public_path('css/main.css')) }}">
  <link rel="stylesheet" href="{{ asset('css/layout/sidebar.css') }}">
  <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">
  <link rel="stylesheet" href="{{ asset('css/components/pomo-float.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components/toast.css') }}">
  @stack('styles')
  <style>
    .dashboard-bg {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: var(--bg-url);
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: var(--bg-opacity);
        filter: grayscale(15%) blur(var(--bg-blur));
        z-index: -2;
        pointer-events: none;
        transition: opacity 0.3s, filter 0.3s, background-image 0.3s;
    }
    .contact-range {
        width: 100%;
        height: 6px;
        background: var(--card-border);
        border-radius: 3px;
        outline: none;
        accent-color: var(--brand);
        margin-top: 8px;
        cursor: pointer;
    }
  </style>
</head>

<body style="visibility:hidden" class="{{ Request::routeIs('admin.*') ? 'route-admin' : '' }}">
  <!-- FONDO PERSONALIZABLE DEL PANEL -->
  <div class="dashboard-bg" id="js-dashboard-bg" style="--bg-url: none; --bg-opacity: 0.10; --bg-blur: 1.8px;"></div>

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
      <button class="pm-close-btn" onclick="window.toggleMobileProfileMenu(event)" aria-label="Cerrar menú">
        <svg aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#x') }}"></use></svg>
      </button>
    </div>
    <button class="profile-menu-item" onclick="window.openProfileModal()">
      <svg class="pmenu-ic" aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#user') }}"></use></svg>
      Perfil
    </button>
    <button class="profile-menu-item" onclick="window.openContactModal()">
      <svg class="pmenu-ic" aria-hidden="true" width="16" height="16"><use href="{{ asset('assets/icons/sprite.svg#message-square') }}"></use></svg>
      Contacto
    </button>
    <button class="profile-menu-item" onclick="if(window.startOnboardingTour && window.location.pathname.endsWith('/dashboard')){ window.startOnboardingTour(); document.getElementById('profile-menu').classList.remove('open'); const userEl = document.querySelector('.sb-user'); if(userEl) userEl.classList.remove('menu-open'); } else { location.href='{{ route('dashboard') }}?start_tour=true'; }">
      <svg class="pmenu-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.9;">
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
      </svg>
      Guía Rápida
    </button>
    <div class="profile-menu-divider"></div>
    <div class="profile-menu-item profile-menu-switch-row" onclick="event.stopPropagation()">
      <span>Animaciones</span>
      <label class="ios-switch">
        <input type="checkbox" id="animaciones-toggle" data-animaciones-toggle>
        <span class="slider"></span>
      </label>
    </div>
    <div class="profile-menu-item profile-menu-switch-row" onclick="event.stopPropagation()" style="margin-top: 0;">
      <span>Widget Pomodoro</span>
      <label class="ios-switch">
        <input type="checkbox" id="global-widget-toggle">
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
    <div class="mob-header-actions">
      @yield('mobile-header-actions')
      <button class="theme-toggle-btn theme-toggle-mobile" data-theme-toggle aria-label="Cambiar tema" title="Cambiar tema">
        <svg class="icon-sun" width="15" height="15"><use href="{{ asset('assets/icons/sprite.svg#sun') }}"></use></svg>
        <svg class="icon-moon" width="15" height="15"><use href="{{ asset('assets/icons/sprite.svg#moon') }}"></use></svg>
      </button>
      <div class="sb-av" id="bn-av" onclick="window.toggleMobileProfileMenu(event)" style="cursor:pointer;" title="Opciones de perfil">{{ $viewerInitials ?? '' }}</div>
    </div>

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
      <div class="bn {{ !Request::routeIs('admin.*') ? 'on' : '' }}" id="btn-toggle-student-menu" onclick="toggleStudentMenu(event)">
        <span class="bnav-icon-wrapper" style="position: relative; display: flex; align-items: center; justify-content: center;">
          <svg class="bn-ic" style="transform: rotate(0deg); transition: transform 0.2s;" id="student-menu-caret" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#chevron-up') }}"></use></svg>
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.6; margin-right: 2px;"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        Editar perfil
      </div>
      <button class="contact-close" onclick="window.closeProfileModal()">✕</button>
    </div>
    <div class="contact-body">
      <p class="contact-subtitle">Actualizá tus datos personales.</p>
      <div class="profile-avatar-edit">
        <div class="profile-avatar-preview" id="profile-avatar-preview">{{ $viewerInitials ?? '' }}</div>
        <button type="button" class="profile-avatar-pencil" onclick="document.getElementById('profile-avatar-input').click()" title="Cambiar foto de perfil">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <button type="button" class="profile-avatar-trash" id="profile-avatar-delete-btn" onclick="window.handleAvatarDelete()" title="Eliminar foto de perfil" style="display:none;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"/></svg>
        </button>
        <input type="file" id="profile-avatar-input" accept="image/png,image/jpeg" style="display:none;" onchange="window.handleAvatarFileChange(event)">
      </div>
      <span id="profile-avatar-error" class="error-message" style="display:block; text-align:center; margin-bottom: 0.5rem;"></span>
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
        
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--brand); margin-top: 20px; margin-bottom: 12px; letter-spacing: 0.75px;">
          Personalización de Pantalla
        </div>
        
        <div class="contact-field">
          <label for="profile-bg-preset">Fondo de Pantalla</label>
          <select id="profile-bg-preset" class="contact-input" onchange="window.handleBgPresetChange(this.value)">
            <option value="none">Sin imagen (Fondo plano)</option>
            <option value="utn-haedo">Fondo UTN Haedo (Fachada - Defecto)</option>
            <option value="utn-building">Fondo UTN Haedo (Edificio)</option>
            <option value="study-cozy">Escritorio Cozy (Programación)</option>
            <option value="minecraft">Minecraft (Relajante)</option>
            <option value="lofi-room">Habitación Lo-Fi (Estilo de estudio)</option>
            <option value="custom">Subir imagen propia...</option>
          </select>
        </div>

        <div class="contact-field" id="profile-bg-upload-container" style="display: none; margin-top: 10px;">
          <div style="display: flex; gap: 10px; align-items: center;">
            <button type="button" class="profile-bg-select-btn" style="background: var(--brand); color: white; border: none; padding: 8px 16px; font-size: 13px; border-radius: 6px; width: auto; cursor: pointer;" onclick="document.getElementById('profile-bg-input').click()">
              Seleccionar imagen
            </button>
            <button type="button" class="contact-btn-cancel" id="profile-bg-delete-btn" style="background: #ef4444; color: white; border: none; padding: 8px 16px; font-size: 13px; border-radius: 6px; display: none; width: auto;" onclick="window.handleBgDelete()">
              Eliminar imagen
            </button>
          </div>
          <div style="font-size: 11px; color: var(--t3); margin-top: 6px;">
            Tamaño máximo permitido: <strong>4 MB</strong> (Formatos: JPG, PNG).
          </div>
          <input type="file" id="profile-bg-input" accept="image/png,image/jpeg" style="display:none;" onchange="window.handleBgFileChange(event)">
          <span id="profile-bg-error" class="error-message" style="display:block; margin-top: 6px;"></span>
        </div>

        <div class="contact-field" id="profile-bg-opacity-container" style="display: none;">
          <label for="profile-bg-opacity" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Opacidad de la imagen</span>
            <span id="profile-bg-opacity-value" style="font-weight: 600; color: var(--brand);">10%</span>
          </label>
          <input type="range" id="profile-bg-opacity" min="0" max="30" step="1" value="10" class="contact-range" oninput="window.handleBgOpacityInput(this.value)">
        </div>

        <div class="contact-field" id="profile-bg-blur-container" style="display: none;">
          <label for="profile-bg-blur" style="display: flex; justify-content: space-between; align-items: center;">
            <span>Desenfoque (Blur)</span>
            <span id="profile-bg-blur-value" style="font-weight: 600; color: var(--brand);">1.8px</span>
          </label>
          <input type="range" id="profile-bg-blur" min="0" max="8" step="0.2" value="1.8" class="contact-range" oninput="window.handleBgBlurInput(this.value)">
        </div>
        <div class="contact-footer">
          <button type="button" class="btn-change-pwd" onclick="window.openChangePasswordModal()">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
            </svg>
            Cambiar contraseña
          </button>
          <div class="contact-footer-actions">
            <button type="button" class="contact-btn-cancel" onclick="window.closeProfileModal()">Cancelar</button>
            <button type="submit" class="contact-btn-send">Guardar cambios</button>
          </div>
        </div>
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

<!-- Contenedor global de Toasts -->
<div class="toast-container" id="toast-container"></div>

<!-- Scripts -->
<script src="{{ asset('js/shared/theme.js') }}?v={{ filemtime(public_path('js/shared/theme.js')) }}"></script>
<script src="{{ asset('js/shared/animations.js') }}"></script>
<script src="{{ asset('js/shared/celebracion.js') }}"></script>
<script src="{{ asset('js/shared/sidebar.js') }}"></script>
<script src="{{ asset('js/shared/toast.js') }}"></script>
<script src="{{ asset('js/shared/profile.js') }}"></script>
<script type="module" src="{{ asset('js/views/pomo-float.js') }}?v={{ filemtime(public_path('js/views/pomo-float.js')) }}"></script>
@if(Request::routeIs('dashboard') || Request::routeIs('area-estudio'))
<script src="{{ asset('js/views/onboarding.js') }}?v={{ filemtime(public_path('js/views/onboarding.js')) }}"></script>
@endif
<script>
  function toggleStudentMenu(event) {
      if (event) event.stopPropagation();
      const popup = document.getElementById('student-menu-popup');
      const caret = document.getElementById('student-menu-caret');
      if (popup && caret) {
          popup.classList.toggle('open');
          if (popup.classList.contains('open')) {
              caret.style.transform = 'rotate(180deg)';
          } else {
              caret.style.transform = 'rotate(0deg)';
          }
      }
  }

  document.addEventListener('click', function(event) {
      const popup = document.getElementById('student-menu-popup');
      const caret = document.getElementById('student-menu-caret');
      const trigger = document.getElementById('btn-toggle-student-menu');
      if (popup && popup.classList.contains('open') && !popup.contains(event.target) && (!trigger || !trigger.contains(event.target))) {
          popup.classList.remove('open');
          if (caret) caret.style.transform = 'rotate(0deg)';
      }
  });
</script>
@stack('scripts')

</body>
</html>
