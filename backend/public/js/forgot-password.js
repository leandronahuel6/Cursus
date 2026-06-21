const form = document.querySelector('#ForgotForm');
const emailInput = document.querySelector('#email');
const emailError = document.querySelector('#email-error');
const successMessage = document.querySelector('#success-message');

const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

const handleSubmit = async (e) => {
    e.preventDefault();
    emailError.textContent = '';
    successMessage.textContent = '';
    successMessage.hidden = true;

    if (!emailInput.value) {
        emailError.textContent = 'Ingresá tu correo electrónico';
        emailInput.focus();
        return;
    }

    if (!emailRegex.test(emailInput.value)) {
        emailError.textContent = 'Ingresá un correo electrónico válido';
        emailInput.focus();
        return;
    }

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email: emailInput.value })
        });

        const data = await response.json();

        if (!response.ok) {
            emailError.textContent = data.errors?.email?.[0] || data.message || 'Ocurrió un error';
            return;
        }

        successMessage.textContent = data.message;
        successMessage.hidden = false;
        emailInput.value = '';

    } catch (error) {
        console.error('Error:', error);
        emailError.textContent = 'Error de conexión';
    }
};

form.addEventListener('submit', handleSubmit);
