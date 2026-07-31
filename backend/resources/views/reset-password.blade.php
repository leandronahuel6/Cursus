@extends('layouts.auth')

@section('title', 'Restablecer Contraseña | Cursus')

@section('content')
    <div class="login-form-header">
        <h1>Restablecer contraseña</h1>
        <p>Ingresá tu nueva contraseña para recuperar el acceso a tu cuenta.</p>
    </div>

    <form id="ResetForm" class="login-form" data-token="{{ $token }}" data-login-url="{{ route('login') }}" novalidate>
        @csrf
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

    <p id="success-message" class="form-success-message" hidden></p>

    <div class="login-divider"></div>

    <p class="login-signup">
        ¿Recordaste tu contraseña?
        <a href="{{ route('login') }}">Volver al inicio de sesión</a>
    </p>
@endsection

@push('scripts')
    <script src="{{ asset('js/views/reset-password.js') }}"></script>
@endpush
