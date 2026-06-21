<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title', 'Cursus - Asistente de Estudiantes')</title>
  <link rel="stylesheet" href="{{ asset('css/main.css') }}">
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

    <!-- Menú de perfil (aparece hacia arriba al hacer clic) -->
    <div class="profile-menu" id="profile-menu">
      <button class="profile-menu-item" onclick="location.href='#'">
        <svg class="pmenu-ic" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.4"/>
          <path d="M8 1v1M8 14v1M1 8h1M14 8h1M2.9 2.9l.7.7M12.4 12.4l.7.7M2.9 13.1l.7-.7M12.4 3.6l.7-.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        Perfil
      </button>
      <button class="profile-menu-item" onclick="window.openContactModal()">
        <svg class="pmenu-ic" viewBox="0 0 16 16" fill="none">
          <path d="M2 3h12v8H9l-3 2.5V11H2V3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
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

  <!-- ===================== MAIN ===================== -->
  <div class="main">

    <!-- Mobile header (Optional: Page specific or fallback) -->
    @yield('mobile-header')

    <!-- Topbar (desktop) -->
    <header class="topbar">
      @yield('topbar-content')
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
        <span class="bn-ic">⊞</span>Inicio
      </div>
      <div class="bn {{ Request::routeIs('materias') ? 'on' : '' }}" onclick="location.href='{{ route('materias') }}'">
        <span class="bn-ic">📚</span>Materias
      </div>
      <div class="bn {{ Request::routeIs('area-estudio') ? 'on' : '' }}" onclick="location.href='{{ route('area-estudio') }}'">
        <span class="bn-ic">⏱</span>Estudio
      </div>
      <div class="bn {{ Request::routeIs('horarios') ? 'on' : '' }}" onclick="location.href='{{ route('horarios') }}'">
        <span class="bn-ic">☑️</span>Horarios
      </div>
      <div class="bn {{ Request::routeIs('alertas') ? 'on' : '' }}" onclick="location.href='{{ route('alertas') }}'">
        <span class="bn-ic">🔔</span>Alertas
        <span class="bn-badge" id="bnav-badge-count">0</span>
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

<!-- Scripts -->
<script src="{{ asset('js/script.js') }}"></script>
<script src="{{ asset('js/profile.js') }}"></script>
@stack('scripts')

</body>
</html>
