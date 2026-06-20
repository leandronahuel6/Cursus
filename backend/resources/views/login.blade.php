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
                    <div class="login-logo-icon"><img src="{{ asset('img/Cursus logo.png') }}" alt="Cursus"></div>
                    <div class="login-logo-text">
                        Cursus
                        <small>Tec. en Programación</small>
                    </div>
                </div>
    
                <div class="login-form-wrap">
                    <div class="login-form-header">
                        <h1>Iniciar sesión</h1>
                        <p>Ingresá con tu correo institucional</p>
                    </div>
    
                    <form id="LoginForm" class="login-form" action="#" method="post" >
                        @csrf
                        <div class="login-field">
                            <label for="email">Usuario</label>
                            <input type="email" id="email" name="email" placeholder="nombre@ejemplo.com" autocomplete="username" required>
                            <span id="email-error" class="error-message"></span>
                        </div>
    
                        <div class="login-field">
                            <label for="password">Contraseña</label>
                            <input type="password" id="password" name="password" placeholder="••••••••" autocomplete="current-password" required>
                            <span id="password-error" class="error-message"></span>
                        </div>
    
                        <div class="login-options">
                            <label class="login-remember">
                                <input type="checkbox" name="remember">
                                <span>Recordarme</span>
                            </label>
                            <a href="{{ route('password.request') }}" class="login-forgot">¿Olvidaste tu contraseña?</a>
                        </div>
    
                        <button type="submit" class="login-submit">Iniciar sesión</button>
                    </form>
    
                    <div class="login-divider"></div>
    
                    <p class="login-signup">
                        ¿No tenés cuenta?
                        <a href="{{ route('register') }}">Registrate</a>
                    </p>

                    <p class="login-signup" style="margin-top: 8px;">
                        <a href="{{ route('dashboard') }}" style="color: var(--t3); font-weight: 400;">Entrar sin iniciar sesión (modo desarrollo) →</a>
                    </p>
                </div>
            </div>
    
            <!-- Columna derecha: imagen decorativa -->
            <div class="login-visual-side">
                <div class="login-visual-placeholder" aria-hidden="true"></div>
            </div>
        </div>
    </main>
    <script src="{{ asset('js/login.js') }}"></script>
</body>
</html>
