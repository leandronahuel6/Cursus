/**
 * forgot-password.js
 *
 * Lógica exclusiva de la vista "Olvidé mi contraseña".
 * La validación de email se delega a AuthCommon.
 */

const form           = document.querySelector('#ForgotForm');
const emailInput     = document.querySelector('#email');
const emailError     = document.querySelector('#email-error');
const successMessage = document.querySelector('#success-message');

const handleSubmit = async (e) => {
    e.preventDefault();
    emailError.textContent    = '';
    successMessage.textContent = '';
    successMessage.hidden      = true;

    const validationError = AuthCommon.validateEmail(emailInput.value);
    if (validationError) {
        emailError.textContent = validationError;
        emailInput.focus();
        return;
    }

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
            },
            body: JSON.stringify({ email: emailInput.value })
        });

        const data = await response.json();

        if (!response.ok) {
            emailError.textContent = data.errors?.email?.[0] || data.message || 'Ocurrió un error';
            return;
        }

        successMessage.textContent = data.message;
        successMessage.hidden      = false;
        emailInput.value           = '';

    } catch (error) {
        console.error('Error:', error);
        emailError.textContent = 'Error de conexión';
    }
};

form.addEventListener('submit', handleSubmit);
