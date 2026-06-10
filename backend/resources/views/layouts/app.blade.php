<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title', 'Cursus - Asistente de Estudiantes')</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/main.css') }}">
  @stack('styles')
</head>

<body>
<div class="app">

  <!-- ===================== SIDEBAR ===================== -->
  <aside class="sidebar">
    <div class="sb-logo">
      <div class="sb-logo-icon">📚</div>
      <div class="sb-logo-text">UTN Study<small>Tec. en Programación</small></div>
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
      <div class="nav-item {{ Request::routeIs('plan-estudios') ? 'active' : '' }}" onclick="location.href='{{ route('plan-estudios') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="13" r="1.5" fill="currentColor"/><circle cx="13" cy="8" r="1.5" fill="currentColor"/><path d="M4.5 8h2M9.5 4l2.5 3M9.5 12l2.5-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        Plan de Estudios
      </div>
      <div class="nav-item {{ Request::routeIs('horarios') ? 'active' : '' }}" onclick="location.href='{{ route('horarios') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7h6M5 10h4M5 5h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        Simulador de Horarios
      </div>
      <div class="nav-item {{ Request::routeIs('promedio') ? 'active' : '' }}" onclick="location.href='{{ route('promedio') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><path d="M2 12L5 8l3 2.5L11 5l3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Calculadora de Promedio
      </div>

      <div class="nav-group">Personal</div>
      <div class="nav-item {{ Request::routeIs('tramites') ? 'active' : '' }}" onclick="location.href='{{ route('tramites') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a4 4 0 014 4c0 2.5 1.2 3.5 1.5 4.5H2.5C2.8 9 4 8 4 5.5a4 4 0 014-4z" stroke="currentColor" stroke-width="1.4"/><path d="M6.5 10c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5" stroke="currentColor" stroke-width="1.3"/></svg>
        Trámites
        <span class="nav-badge">2</span>
      </div>
      <div class="nav-item {{ Request::routeIs('metricas') ? 'active' : '' }}" onclick="location.href='{{ route('metricas') }}'">
        <svg class="nav-ic" viewBox="0 0 16 16" fill="none"><path d="M8 3v5l3 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/></svg>
        Métricas
      </div>
    </nav>

    <div class="sb-user">
      <div class="sb-av">JP</div>
      <div>
        <div class="sb-uname">Juan Pérez</div>
        <div class="sb-uleg">Legajo 12345</div>
      </div>
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
      <div class="bn {{ Request::routeIs('tramites') ? 'on' : '' }}" onclick="location.href='{{ route('tramites') }}'">
        <span class="bn-ic">🔔</span>Trámites
        <span class="bn-badge">2</span>
      </div>
    </div>
  </nav>

</div><!-- /app -->

<!-- Scripts -->
<script src="{{ asset('js/script.js') }}"></script>
@stack('scripts')

</body>
</html>
