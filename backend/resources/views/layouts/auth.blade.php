<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Cursus')</title>
    <link rel="stylesheet" href="{{ asset('css/base/fonts.css') }}">
    <link rel="stylesheet" href="{{ asset('css/base/variables.css') }}">
    <link rel="stylesheet" href="{{ asset('css/base/reset.css') }}">
    <link rel="stylesheet" href="{{ asset('css/base/animations.css') }}">
    <link rel="stylesheet" href="{{ asset('css/components/forms.css') }}">
    <link rel="stylesheet" href="{{ asset('css/views/auth.css') }}">
    <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">
</head>
<body>
    <div class="login-layout">
        {{-- Columna izquierda: logo + formulario --}}
        <main class="login-form-side">
            <a href="{{ route('welcome') }}" class="login-logo" aria-label="Ir a la página principal de Cursus">
                <div class="login-logo-icon">
                    <img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus">
                </div>
                <div class="login-logo-text">
                    Cursus
                    <small>Tec. en Programación</small>
                </div>
            </a>

            <div class="login-form-wrap">
                {{-- Alertas globales: errores de validación y mensajes de sesión --}}
                @if ($errors->any())
                    <div class="auth-alert auth-alert--error" role="alert">
                        @foreach ($errors->all() as $error)
                            <p>{{ $error }}</p>
                        @endforeach
                    </div>
                @endif

                @if (session('status'))
                    <div class="auth-alert auth-alert--success" role="alert">
                        {{ session('status') }}
                    </div>
                @endif

                {{-- Contenido dinámico: formulario de cada vista hija --}}
                @yield('content')
            </div>
        </main>

        {{-- Columna derecha: imagen decorativa --}}
        <aside class="login-visual-side" aria-hidden="true">
            <div class="login-visual-content">
                <img
                    class="login-visual-img"
                    src="{{ asset('assets/img/login_bg.jpg') }}"
                    alt="UTN Facultad Regional Haedo"
                >
                <div class="login-visual-text">
                    <h3>Estudiá a tu propio ritmo 📝</h3>
                    <p>Organizá tus horarios, realizá el seguimiento de tus materias y optimizá tus sesiones de estudio en la UTN Haedo desde un solo lugar.</p>
                </div>
            </div>
        </aside>
    </div>

    {{-- Script compartido cargado antes que los scripts específicos de cada vista --}}
    <script src="{{ asset('js/views/auth-common.js') }}"></script>
    @stack('scripts')
</body>
</html>
