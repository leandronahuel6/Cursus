@extends('layouts.auth')

@section('title', 'Iniciar Sesión | Cursus')

@section('content')
    <div class="login-form-header">
        <h1>Iniciar sesión</h1>
        <p>Ingresá con tu correo institucional</p>
    </div>

    <form id="LoginForm" class="login-form" action="#" method="post" novalidate>
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
@endsection

@push('scripts')
    <script src="{{ asset('js/views/login.js') }}"></script>
@endpush
