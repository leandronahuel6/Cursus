{{--
    @fileoverview Layout base para las páginas públicas de landing (welcome y contacto).
    Carga una única vez: fuentes locales (fonts.css), variables globales (variables.css),
    reset, animaciones, estilos compartidos de landing (shared.css) y Lucide.
    Envuelve el contenido de cada vista en <main class="page"> para habilitar
    el scroll independiente con overflow-y:auto y height:100dvh.

    Partials incluidos:
      - partials/landing/header  → <header> de navegación
      - partials/landing/footer  → <footer> del sitio

    Uso en vistas hijas:
      @extends('layouts.landing')

      @section('title', 'Título de la página')
      @section('meta-description', 'Descripción SEO')

      @push('styles')
          <link rel="stylesheet" href="{{ asset('css/views/landing/mi-vista.css') }}">
      @endpush

      @section('content')
          ... contenido semántico de la vista ...
      @endsection

      @push('scripts')
          <script type="module" src="{{ asset('js/views/landing/mi-vista.js') }}"></script>
      @endpush
--}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    {{-- SEO y Open Graph --}}
    <meta name="description" content="@yield('meta-description', 'Cursus es el organizador académico y asistente de productividad definitivo para la UTN Regional Haedo.')">
    <meta name="keywords"    content="@yield('meta-keywords', 'Cursus, UTN Haedo, TUP, Tecnicatura Programación, Estudiantes, Pomodoro, Correlatividades')">
    <meta property="og:type"        content="website">
    <meta property="og:title"       content="@yield('title', 'Cursus - Tu Asistente Universitario UTN Haedo')">
    <meta property="og:description" content="@yield('meta-description', 'Organizá tu cursada, simulá tu promedio y gestioná tus tiempos.')">
    <meta property="og:image"       content="{{ asset('img/landing_hero.png') }}">

    {{-- Color Scheme (para controles nativos como <select>) --}}
    <meta name="color-scheme" id="color-scheme-meta" content="light">

    <title>@yield('title', 'Cursus - Tu Asistente Universitario UTN Haedo')</title>

    {{-- Favicon --}}
    <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">

    {{--
        Fuentes locales (Outfit @font-face .woff2).
        Importadas UNA SOLA VEZ aquí. Las vistas hijas no deben incluir
        <link> a Google Fonts CDN; fonts.css usa declaraciones @font-face locales.
    --}}
    <link rel="stylesheet" href="{{ asset('css/base/fonts.css') }}">

    {{--
        Variables CSS globales (Design Tokens): colores, tipografías, sombras.
        Importadas UNA SOLA VEZ aquí. Las vistas hijas NO deben redefinir
        estos tokens; son la única fuente de verdad global.
    --}}
    <link rel="stylesheet" href="{{ asset('css/base/variables.css') }}">

    {{-- Reset y Animaciones globales --}}
    <link rel="stylesheet" href="{{ asset('css/base/reset.css') }}">
    <link rel="stylesheet" href="{{ asset('css/base/animations.css') }}">

    {{-- Estilos compartidos del subsistema landing (header, footer, .page, etc.) --}}
    <link rel="stylesheet" href="{{ asset('css/views/landing/shared.css') }}">

    {{-- Estilos específicos de cada vista (inyectados con @push('styles')) --}}
    @stack('styles')

    {{--
        Lucide Icons — CDN de iconografía.
        Se carga en el <head> para que esté disponible cuando shared.js
        llame a lucide.createIcons() en DOMContentLoaded.
    --}}
    <script src="https://unpkg.com/lucide@latest" defer></script>
</head>
<body hidden>

    {{--
        Script inline de tema: resuelve el tema (claro/oscuro) ANTES de que el
        body se muestre, eliminando el "flash" de cambio de tema.
        El atributo `hidden` en <body> se quita por theme.js tras aplicar el tema.
        NO usa type="module" porque es un IIFE que debe ejecutarse sincrónicamente.
    --}}
    <script>
        (function () {
            var saved  = localStorage.getItem('theme');
            var prefer = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            var theme  = (saved === 'dark' || saved === 'light') ? saved : prefer;
            if (theme === 'dark') document.body.classList.add('dark-mode');
            var meta = document.getElementById('color-scheme-meta');
            if (meta) meta.setAttribute('content', theme);
            document.body.removeAttribute('hidden');
        })();
    </script>

    {{-- Blobs decorativos de fondo (fuera del .page para que sean position:fixed) --}}
    <div class="blob blob-1" aria-hidden="true"></div>
    <div class="blob blob-2" aria-hidden="true"></div>
    <div class="blob blob-3" aria-hidden="true"></div>

    {{-- Header de navegación principal --}}
    @include('partials.landing.header')

    {{--
        Contenedor principal con scroll independiente.
        - height: 100dvh (evita desborde por barra de URL móvil)
        - overflow-y: auto (el scroll ocurre aquí, no en window)
        - scrollbar-gutter: stable (en desktop, previene CLS al aparecer el scrollbar)
        Definido en css/views/landing/shared.css
    --}}
    <main class="page" id="js-page" data-route="{{ request()->route() ? request()->route()->getName() : 'unknown' }}">
        @yield('content')
        @include('partials.landing.footer')
    </main>

    {{--
        Botón Volver Arriba — compartido por todas las páginas landing.
        El JS en shared.js escucha el scroll de `.page` (no window).
    --}}
    <button id="scroll-top-btn" class="scroll-top-btn" aria-label="Volver al inicio de la página">
        <i data-lucide="arrow-up" aria-hidden="true"></i>
    </button>

    {{--
        Scripts base:
        1. theme.js  — IIFE sin módulos (manejo de tema y binding de botones toggle)
        2. shared.js — Módulo ES6: ScrollSpy, Reveal, scroll suave, cursor glow
    --}}
    <script src="{{ asset('js/shared/theme.js') }}"></script>
    <script type="module" src="{{ asset('js/views/landing/shared.js') }}"></script>

    {{-- Scripts específicos de cada vista --}}
    @stack('scripts')
</body>
</html>
