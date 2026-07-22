<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursus - Restablecer contraseña</title>
    <link rel="stylesheet" href="{{ asset('css/base/fonts.css') }}">
    <link rel="stylesheet" href="{{ asset('css/base/variables.css') }}">
    <link rel="stylesheet" href="{{ asset('css/base/reset.css') }}">
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">
</head>
<body>
    <main class="login-page">
        <div class="login-layout">
            <div class="login-form-side">
                <div class="login-logo">
                    <div class="login-logo-icon"><img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus"></div>
                    <div class="login-logo-text">
                        Cursus
                        <small>Tec. en Programación</small>
                    </div>
                </div>

                <div class="login-form-wrap">
                    <div class="login-form-header">
                        <h1>Restablecer contraseña</h1>
                        <p>Ingresá tu nueva contraseña para recuperar el acceso a tu cuenta.</p>
                    </div>

                    <form id="ResetForm" class="login-form" data-token="{{ $token }}" data-login-url="{{ route('login') }}">
                        <div class="login-field">
                            <label for="password">Nueva contraseña</label>
                            <input type="password" id="password" name="password" placeholder="••••••••" autocomplete="new-password" required>
                            <span id="password-error" class="error-message"></span>
                        </div>

                        <div class="login-field">
                            <label for="password_confirmation">Confirmar contraseña</label>
                            <input type="password" id="password_confirmation" name="password_confirmation" placeholder="••••••••" autocomplete="new-password" required>
                            <span id="password-confirmation-error" class="error-message"></span>
                        </div>

                        <button type="submit" class="login-submit">Cambiar contraseña</button>
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
    <script src="{{ asset('js/views/reset-password.js') }}"></script>
</body>
</html>
