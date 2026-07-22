<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursus - Registrarse</title>
    <link rel="stylesheet" href="{{ asset('css/base/fonts.css') }}">
    <link rel="stylesheet" href="{{ asset('css/base/variables.css') }}">
    <link rel="stylesheet" href="{{ asset('css/base/reset.css') }}">
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">
    <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">
</head>
<body>
    <main class="login-page">
        <div class="login-layout">
            <!-- Columna izquierda: formulario -->
            <div class="login-form-side">
                <a href="{{ route('welcome') }}" class="login-logo" style="text-decoration: none; color: inherit; cursor: pointer;">
                    <div class="login-logo-icon"><img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus"></div>
                    <div class="login-logo-text">
                        Cursus
                        <small>Tec. en Programación</small>
                    </div>
                </a>
    
                <div class="login-form-wrap">
                    <div class="login-form-header">
                        <h1>Registrate</h1>
                        <p>Registrate con tu correo institucional</p>
                    </div>
    
                    <form id="RegisterForm" class="login-form" action="#" method="post" novalidate>
                        @csrf
                        <div class="login-field">
                            <label for="nombre">Nombre</label>
                            <input type="text" id="nombre" name="nombre" placeholder="Jhon Doe" autocomplete="username" required>
                            <span id="nombre-error" class="error-message"></span>
                        </div>
                        <div class="login-field">
                            <label for="legajo">Legajo</label>
                            <input type="text" id="legajo" name="legajo" placeholder="Ej: 12345" required>
                            <span id="legajo-error" class="error-message"></span>
                        </div>
                        <div class="login-field">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" placeholder="nombre@ejemplo.com" autocomplete="username" required>
                            <span id="email-error" class="error-message"></span>
                        </div>
                        <div class="login-field">
                            <label for="password">Contraseña</label>
                            <input type="password" id="password" name="password" placeholder="••••••••" autocomplete="current-password" required>
                            <span id="password-error" class="error-message"></span>
                        </div>
    
                        <button type="submit" class="login-submit">Registrarse</button>
                    </form>
    
                    <div class="login-divider"></div>
    
                    <p class="login-signup">
                        ¿Ya tenés una cuenta?
                        <a href="{{ route('login') }}">Iniciar sesión</a>
                    </p>
                </div>
            </div>
    
            <!-- Columna derecha: imagen decorativa -->
            <div class="login-visual-side">
                <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                    <img class="login-visual-img" src="{{ asset('assets/img/login_bg.jpg') }}" alt="UTN Facultad Regional Haedo">
                    <div style="position: absolute; bottom: 24px; left: 24px; right: 24px; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 18px; padding: 24px; border: 1px solid rgba(255, 255, 255, 0.08); color: white; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);">
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.2px;">Estudiá a tu propio ritmo 📝</h3>
                        <p style="margin: 8px 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.85); line-height: 1.5; font-weight: 400;">Organizá tus horarios, realizá el seguimiento de tus materias y optimizá tus sesiones de estudio en la UTN Haedo desde un solo lugar.</p>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <script src="{{ asset('js/views/register.js') }}"></script>
</body>
</html>