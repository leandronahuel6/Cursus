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
      <div class="sb-logo-text" id="sb-logo-text">
        Cursus
        @if(Auth::check() && Auth::user()->role === 'admin')
          <small style="color: #ef4444; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 9px; display: inline-flex; align-items: center; gap: 3px;">
            <span style="display: inline-block; width: 5px; height: 5px; background: #ef4444; border-radius: 50%;"></span>
            Panel Admin
          </small>
        @else
          <small>Tec. en Programación</small>
        @endif
      </div>
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

    <!-- Sección admin: visible solo si role === 'admin' (controlado por JS) -->
    <div class="nav-group" id="admin-nav-group" style="display:none">Administración</div>
    <div class="nav-item {{ Request::routeIs('admin.alumnos') ? 'active' : '' }}" id="admin-nav-alumnos" style="display:none" onclick="location.href='{{ route('admin.alumnos') }}'" title="Alumnos">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#user') }}"></use></svg>
      <span class="nav-text">Alumnos</span>
    </div>
    <div class="nav-item {{ Request::routeIs('admin.cuotas') ? 'active' : '' }}" id="admin-nav-cuotas" style="display:none" onclick="location.href='{{ route('admin.cuotas') }}'" title="Cuotas">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#wallet') }}"></use></svg>
      <span class="nav-text">Cuotas</span>
    </div>
    <div class="nav-item {{ Request::routeIs('admin.plan-estudios') ? 'active' : '' }}" id="admin-nav-plan" style="display:none" onclick="location.href='{{ route('admin.plan-estudios') }}'" title="Plan de Estudios">
      <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#graduation-cap') }}"></use></svg>
      <span class="nav-text">Plan de Estudios</span>
    </div>

    <!-- Toggle "Vista Alumno": solo visible para admins, colapsa los ítems de alumno -->
    <div class="nav-group nav-group-collapsible" id="sb-vista-alumno-toggle" style="display:none" onclick="window.toggleVistaAlumno()" title="Vista Alumno">
      <span>Vista Alumno</span>
      <svg class="va-chevron" id="va-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- Ítems de alumno: siempre visibles para usuarios normales, colapsables para admin -->
    <div id="sb-alumno-items">
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
      <div class="nav-item {{ Request::routeIs('flashcards') ? 'active' : '' }}" onclick="location.href='{{ route('flashcards') }}'" title="Flashcards">
        <svg class="nav-ic" aria-hidden="true"><use href="{{ asset('assets/icons/sprite.svg#book-copy') }}"></use></svg>
        <span class="nav-text">Flashcards</span>
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
