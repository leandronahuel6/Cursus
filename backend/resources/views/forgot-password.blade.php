<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursus - Olvidé mi contraseña</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">
</head>
<body>
    <main class="login-page">
        <div class="login-layout">
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
                        <h1>Olvidé mi contraseña</h1>
                        <p>Ingresá tu email y te mandamos un link para restablecer tu contraseña.</p>
                    </div>

                    <form id="ForgotForm" class="login-form">
                        <div class="login-field">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" placeholder="nombre@ejemplo.com" autocomplete="email" required>
                            <span id="email-error" class="error-message"></span>
                        </div>

                        <button type="submit" class="login-submit">Enviar link</button>
                    </form>

                    <p id="success-message" class="login-success-message" hidden></p>

                    <div class="login-divider"></div>

                    <p class="login-signup">
                        ¿Recordaste tu contraseña?
                        <a href="{{ route('login') }}">Volver al inicio de sesión</a>
                    </p>
                </div>
            </div>

            <div class="login-visual-side">
                <div class="login-visual-placeholder" aria-hidden="true"></div>
            </div>
        </div>
    </main>
    <script src="{{ asset('js/forgot-password.js') }}"></script>
</body>
</html>
