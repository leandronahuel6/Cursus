{{--
    @fileoverview Partial del Footer para el subsistema de landing.
    No contiene atributos style="" ni estilos inline. Toda la presentación
    está delegada a css/views/landing/shared.css (.landing-footer, .footer-nav, etc.).

    Incluido desde: resources/views/layouts/landing.blade.php (dentro de .page)
--}}
<footer class="landing-footer">
    <div class="footer-layout">

        {{-- Logo y marca --}}
        <a href="{{ route('welcome') }}" class="footer-logo" aria-label="Cursus — Inicio">
            <img
                src="{{ asset('assets/icons/cursus-logo.svg') }}"
                alt="Logo Cursus"
                width="30"
                height="30"
            >
            <span class="footer-logo-tx">
                Cursus
                <small>UTN Haedo</small>
            </span>
        </a>

        {{-- Navegación del footer --}}
        <nav class="footer-nav" aria-label="Navegación de pie de página">
            <a href="{{ route('welcome') }}#que-es">Qué es</a>
            <a href="{{ route('welcome') }}#como-funciona">Cómo funciona</a>
            <a href="{{ route('welcome') }}#beneficios">Beneficios</a>
            <a href="{{ route('welcome') }}#diferencias">Diferencias</a>
            <a href="{{ route('welcome') }}#testimonios">Comunidad</a>
            <a href="{{ route('welcome') }}#faq">FAQS</a>
            <a href="{{ route('contacto') }}">Contacto</a>
        </nav>

    </div>

    <div class="footer-bottom">
        <small>&copy; 2026 Cursus. Creado por alumnos para la comunidad de la UTN FRH.</small>
        <small>Tecnicatura Universitaria en Programación</small>
    </div>
</footer>
