{{--
    @fileoverview Partial del Header de navegación para el subsistema de landing.
    Incluye: logo, navegación principal con fix CLS (data-text), botón de tema
    y botones de autenticación. Todos los iconos SVG carecen de atributos style=""
    o width/height inline; sus dimensiones son controladas por CSS en shared.css.

    Fix CLS en .landing-nav a:
    El pseudo-elemento ::after con content:attr(data-text) y visibility:hidden
    reserva el ancho del texto en negrita ANTES de que hover/active lo apliquen,
    evitando el desplazamiento de layout (CLS) al cambiar font-weight.

    Incluido desde: resources/views/layouts/landing.blade.php
--}}
<header class="landing-header" id="js-header">

    {{-- Logo --}}
    <a href="{{ route('welcome') }}" class="logo-wrap" aria-label="Cursus — Inicio">
        <img
            src="{{ asset('assets/icons/cursus-logo.svg') }}"
            alt="Logo Cursus"
            width="38"
            height="38"
        >
        <span class="logo-tx">
            Cursus
            <small>UTN Haedo</small>
        </span>
    </a>

    {{-- Overlay del Menú Móvil --}}
    <div class="landing-nav-overlay" id="landing-nav-overlay" aria-hidden="true"></div>

    {{-- Navegación principal --}}
    <nav class="landing-nav" id="landing-nav" aria-label="Navegación principal">
    <button type="button" class="landing-nav__close" id="mobile-nav-close" aria-label="Cerrar menú">
        <i data-lucide="x"></i>
    </button>
    <a href="{{ route('welcome') }}#que-es"         data-text="Qué es">Qué es</a>
        <a href="{{ route('welcome') }}#como-funciona"  data-text="Cómo funciona">Cómo funciona</a>
        <a href="{{ route('welcome') }}#beneficios"     data-text="Beneficios">Beneficios</a>
        <a href="{{ route('welcome') }}#diferencias"    data-text="Diferencias">Diferencias</a>
        <a href="{{ route('welcome') }}#testimonios"    data-text="Comunidad">Comunidad</a>
        <a href="{{ route('welcome') }}#faq"            data-text="FAQS">FAQS</a>
        <a href="{{ route('contacto') }}"               data-text="Contacto" class="{{ request()->routeIs('contacto') ? 'active-link' : '' }}">Contacto</a>
    </nav>

    {{-- Acciones --}}
    <div class="landing-actions">

        {{-- Botón toggle de tema --}}
        <button
            class="theme-toggle-btn"
            data-theme-toggle
            aria-label="Cambiar entre modo claro y oscuro"
            type="button"
        >
            {{-- Icono Sol (visible en modo oscuro) --}}
            <i data-lucide="sun"  class="icon-sun"  aria-hidden="true"></i>
            {{-- Icono Luna (visible en modo claro) --}}
            <i data-lucide="moon" class="icon-moon" aria-hidden="true"></i>
        </button>

        @auth
            <a href="{{ route('dashboard') }}" class="btn-register">
                Ir al Panel
            </a>
        @else
            <a href="{{ route('login') }}"    class="btn-login">Iniciar Sesión</a>
            <a href="{{ route('register') }}" class="btn-register">Registrarse</a>
        @endauth

        {{-- Botón Hamburguesa --}}
        <button 
            class="landing-header__toggle" 
            id="mobile-nav-toggle" 
            aria-controls="landing-nav" 
            aria-expanded="false" 
            aria-label="Abrir menú de navegación"
            type="button"
        >
            <i data-lucide="menu" class="icon-menu" aria-hidden="true"></i>
        </button>

    </div>
</header>
