@extends('layouts.auth')

@section('title', 'Registrarse | Cursus')

@section('content')
    <div class="login-form-header">
        <h1>Registrate</h1>
        <p>Registrate con tu correo institucional</p>
    </div>

    <form id="RegisterForm" class="login-form" action="#" method="post" novalidate>
        @csrf
        <div class="login-field">
            <label for="nombre">Nombre</label>
            <input type="text" id="nombre" name="nombre" placeholder="John Doe" autocomplete="username" required>
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
@endsection

@push('scripts')
    <script src="{{ asset('js/views/register.js') }}"></script>
@endpush
