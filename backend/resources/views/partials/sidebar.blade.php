<!-- ===================== SIDEBAR ===================== -->
<aside class="sidebar" id="sidebar">
  <script>
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
      document.getElementById('sidebar').classList.add('collapsed');
    }
  </script>
  <div class="sb-logo">
    <a href="{{ route('dashboard') }}" class="sb-logo-link" id="sb-logo-link" title="Ir al inicio" aria-label="Ir al inicio">
      <div class="sb-logo-icon-wrapper">
        <img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus" class="sb-logo-img-default" id="sb-logo-img">
        <svg class="sb-logo-img-hover" aria-hidden="true" width="20" height="20">
          <use href="{{ asset('assets/icons/sprite.svg#panel-left-open') }}"></use>
        </svg>
      </div>
      <div class="sb-logo-text" id="sb-logo-text">Cursus<small>Tec. en Programación</small></div>
    </a>
    <button type="button" class="sb-toggle-btn" id="sb-toggle-btn" onclick="window.toggleSidebar(event)" aria-label="Cerrar barra lateral" title="Cerrar barra lateral">
      <svg class="sb-toggle-ic-default" aria-hidden="true" width="20" height="20">
        <use href="{{ asset('assets/icons/sprite.svg#panel-left') }}"></use>
      </svg>
      <svg class="sb-toggle-ic-hover" aria-hidden="true" width="20" height="20">
        <use href="{{ asset('assets/icons/sprite.svg#panel-left-close') }}"></use>
      </svg>
    </button>
  </div>

  <nav class="sb-nav" id="sb-nav">
    <div class="nav-item {{ Request::routeIs('dashboard') ? 'active' : '' }}" onclick="location.href='{{ route('dashboard') }}'" title="Inicio">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#layout-dashboard') }}"></use></svg>
      <span class="nav-text">Inicio</span>
    </div>
    <div class="nav-item {{ Request::routeIs('materias') ? 'active' : '' }}" onclick="location.href='{{ route('materias') }}'" title="Mis Materias">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#library') }}"></use></svg>
      <span class="nav-text">Mis Materias</span>
    </div>
    <div class="nav-item {{ Request::routeIs('area-estudio') ? 'active' : '' }}" onclick="location.href='{{ route('area-estudio') }}'" title="Área de Estudio">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#clock') }}"></use></svg>
      <span class="nav-text">Área de Estudio</span>
    </div>

    <div class="nav-group">Académico</div>
    <div class="nav-item {{ Request::routeIs('horarios') ? 'active' : '' }}" onclick="location.href='{{ route('horarios') }}'" title="Simulador de Horarios">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#calendar') }}"></use></svg>
      <span class="nav-text">Simulador de Horarios</span>
    </div>
    <div class="nav-item {{ Request::routeIs('beneficios') ? 'active' : '' }}" onclick="location.href='{{ route('beneficios') }}'" title="Beneficios">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#gift') }}"></use></svg>
      <span class="nav-text">Beneficios</span>
    </div>
    <div class="nav-group">Personal</div>
    <div class="nav-item {{ Request::routeIs('alertas') ? 'active' : '' }}" onclick="location.href='{{ route('alertas') }}'" title="Alertas">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#bell') }}"></use></svg>
      <span class="nav-text">Alertas</span>
      <span class="nav-badge" id="nav-badge-count">0</span>
    </div>
    <div class="nav-item {{ Request::routeIs('progreso') ? 'active' : '' }}" onclick="location.href='{{ route('progreso') }}'" title="Mi Progreso">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#trending-up') }}"></use></svg>
      <span class="nav-text">Mi Progreso</span>
    </div>
  </nav>

  <div class="sb-user" onclick="window.toggleProfileMenu(event)" title="Opciones de perfil">
    <div class="sb-av" id="sb-av">{{ $viewerInitials ?? '' }}</div>
    <div class="sb-user-info">
      <div class="sb-uname" id="sb-uname">{{ $viewerFullName ?? '' }}</div>
      <div class="sb-uleg" id="sb-uleg">{{ $viewerLegajo ? 'Legajo ' . $viewerLegajo : '' }}</div>
    </div>
    <svg class="sb-user-caret" aria-hidden="true" width="16" height="16">
      <use href="{{ asset('assets/icons/sprite.svg#chevron-up') }}"></use>
    </svg>
  </div>
</aside>
