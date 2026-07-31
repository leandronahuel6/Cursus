/**
 * reset-password.js
 *
 * Lógica exclusiva de la vista "Restablecer contraseña".
 * La validación de contraseña se delega a AuthCommon.
 */

const form                 = document.querySelector('#ResetForm');
const passwordInput        = document.querySelector('#password');
const passwordConfirmInput = document.querySelector('#password_confirmation');
const passwordError        = document.querySelector('#password-error');
const passwordConfirmError = document.querySelector('#password-confirmation-error');
const successMessage       = document.querySelector('#success-message');

const token    = form.dataset.token;
const loginUrl = form.dataset.loginUrl;
const email    = new URLSearchParams(window.location.search).get('email');

const handleSubmit = async (e) => {
    e.preventDefault();
    passwordError.textContent        = '';
    passwordConfirmError.textContent = '';
    successMessage.textContent       = '';
    successMessage.hidden            = true;

    const passwordValidationError = AuthCommon.validatePassword(passwordInput.value);
    if (passwordValidationError) {
        passwordError.textContent = passwordValidationError;
        passwordInput.focus();
        return;
    }

    if (passwordInput.value !== passwordConfirmInput.value) {
        passwordConfirmError.textContent = 'Las contraseñas no coinciden';
        passwordConfirmInput.focus();
        return;
    }

    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
            },
            body: JSON.stringify({
                token,
                email,
                password:              passwordInput.value,
                password_confirmation: passwordConfirmInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            passwordError.textContent = data.errors?.email?.[0] || data.message || 'Ocurrió un error';
            return;
        }

        successMessage.textContent = data.message + ' Te llevamos al login...';
        successMessage.hidden      = false;
        form.style.display         = 'none';

        setTimeout(() => {
            window.location.href = loginUrl;
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        passwordError.textContent = 'Error de conexión';
    }
};

form.addEventListener('submit', handleSubmit);
