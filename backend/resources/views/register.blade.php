<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursus - Iniciar sesión</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">
</head>
<body>
    <main class="login-page">
        <div class="login-layout">
            <!-- Columna izquierda: formulario -->
            <div class="login-form-side">
                <div class="login-logo">
                    <div class="login-logo-icon"><img src="{{ asset('assets/img/Cursus logo.png') }}" alt="Cursus"></div>
                    <div class="login-logo-text">
                        Cursus
                        <small>Tec. en Programación</small>
                    </div>
                </div>
    
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
                <div class="login-visual-placeholder" aria-hidden="true"></div>
            </div>
        </div>
    </main>
    <script src="{{ asset('js/register.js') }}"></script>
</body>
</html>