const form = document.querySelector('#LoginForm');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');

const emailError = document.querySelector('#email-error');
const passwordError = document.querySelector('#password-error');

const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

const handleSubmit = async (e) => {
    e.preventDefault();
    emailError.textContent = '';
    passwordError.textContent = '';

    if (!emailInput.value) {
        emailError.textContent = 'Ingrese un correo electrónico';
        return;
    }

    if (!emailRegex.test(emailInput.value)) {
        emailError.textContent = 'Ingrese un correo electrónico válido';
        emailInput.focus();
        return;
    }

    if (passwordInput.value.length < 8) {
        passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres';
        passwordInput.focus();
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            emailError.textContent = data.errors?.email?.[0] || 'No se pudo iniciar sesión';
            passwordError.textContent = data.errors?.password?.[0] || '';
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        emailInput.value = '';
        passwordInput.value = '';

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error en login:', error);
        passwordError.textContent = 'No se pudo iniciar sesión. Intentá nuevamente.';
    }
};

form.addEventListener('submit', handleSubmit);


