@extends('layouts.auth')

@section('title', 'Olvidé mi Contraseña | Cursus')

@section('content')
    <div class="login-form-header">
        <h1>Olvidé mi contraseña</h1>
        <p>Ingresá tu email y te mandamos un link para restablecer tu contraseña.</p>
    </div>

    <form id="ForgotForm" class="login-form" novalidate>
        @csrf
        <div class="login-field">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="nombre@ejemplo.com" autocomplete="email" required>
            <span id="email-error" class="error-message"></span>
        </div>

        <button type="submit" class="login-submit">Enviar link</button>
    </form>

    <p id="success-message" class="form-success-message" hidden></p>

    <div class="login-divider"></div>

    <p class="login-signup">
        ¿Recordaste tu contraseña?
        <a href="{{ route('login') }}">Volver al inicio de sesión</a>
    </p>
@endsection

@push('scripts')
    <script src="{{ asset('js/views/forgot-password.js') }}"></script>
@endpush
