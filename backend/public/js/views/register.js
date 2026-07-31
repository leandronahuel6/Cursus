/**
 * register.js
 *
 * Lógica exclusiva de la vista de registro.
 * Las validaciones de email y contraseña se delegan a AuthCommon.
 */

const form = document.querySelector('#RegisterForm');

const validateNombre = (nombre) => {
    if (nombre.length < 3)  return 'El nombre debe tener al menos 3 caracteres';
    if (nombre.length > 50) return 'El nombre debe tener menos de 50 caracteres';
    return null;
};

const validateLegajo = (legajo) => {
    if (!legajo)                  return 'Ingrese su número de legajo';
    if (!/^\d{5}$/.test(legajo)) return 'El legajo debe ser un número de 5 dígitos';
    return null;
};

const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreInput   = document.querySelector('#nombre');
    const legajoInput   = document.querySelector('#legajo');
    const emailInput    = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');

    const nombreError   = document.querySelector('#nombre-error');
    const legajoError   = document.querySelector('#legajo-error');
    const emailError    = document.querySelector('#email-error');
    const passwordError = document.querySelector('#password-error');

    nombreError.textContent   = validateNombre(nombreInput.value) || '';
    legajoError.textContent   = validateLegajo(legajoInput.value) || '';
    emailError.textContent    = AuthCommon.validateEmail(emailInput.value) || '';
    passwordError.textContent = AuthCommon.validatePassword(passwordInput.value) || '';

    if (nombreError.textContent || legajoError.textContent || emailError.textContent || passwordError.textContent) {
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
            },
            body: JSON.stringify({
                nombre:   nombreInput.value,
                legajo:   legajoInput.value,
                email:    emailInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.errors) {
                nombreError.textContent   = data.errors.nombre?.[0]   || '';
                legajoError.textContent   = data.errors.legajo?.[0]   || '';
                emailError.textContent    = data.errors.email?.[0]    || '';
                passwordError.textContent = data.errors.password?.[0] || '';
            }
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        nombreInput.value   = '';
        legajoInput.value   = '';
        emailInput.value    = '';
        passwordInput.value = '';

        window.location.href = '/dashboard';

    } catch (error) {
        console.error('Error en register:', error);
    }
};

form.addEventListener('submit', handleSubmit);
