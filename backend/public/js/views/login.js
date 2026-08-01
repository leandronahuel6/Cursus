/**
 * login.js
 *
 * Lógica exclusiva de la vista de inicio de sesión.
 * Las validaciones compartidas (email, password) se delegan a AuthCommon,
 * cargado previamente por el layout auth.blade.php.
 */

const form = document.querySelector('#LoginForm');

// "Recordarme" controla dónde se guarda la sesión:
// - Marcado  -> localStorage (sobrevive a cerrar el navegador)
// - Sin marcar -> sessionStorage (se pierde al cerrar la pestaña/navegador)
function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Si ya hay una sesión guardada, valida el token y redirige directamente.
(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) return;

    try {
        const response = await fetch('/api/user', {
            headers: { 'Authorization': 'Bearer ' + storedToken, 'Accept': 'application/json' }
        });
        if (response.ok) {
            const user = await response.json();
            if (user.role === 'admin') {
                window.location.href = '/admin/alumnos';
            } else {
                window.location.href = '/dashboard';
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
        }
    } catch (error) {
        console.error('No se pudo validar la sesión guardada', error);
    }
})();

const handleSubmit = async (e) => {
    e.preventDefault();

    const emailInput    = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    const rememberInput = document.querySelector('input[name="remember"]');
    const emailError    = document.querySelector('#email-error');
    const passwordError = document.querySelector('#password-error');

    emailError.textContent    = AuthCommon.validateEmail(emailInput.value) || '';
    passwordError.textContent = AuthCommon.validatePassword(passwordInput.value) || '';

    if (emailError.textContent || passwordError.textContent) return;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value
            },
            body: JSON.stringify({
                email:    emailInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.message) {
                emailError.textContent    = data.message;
                passwordError.textContent = data.message;
            }
            return;
        }

        const remember      = rememberInput?.checked ?? false;
        const storage       = remember ? localStorage : sessionStorage;
        const otherStorage  = remember ? sessionStorage : localStorage;

        storage.setItem('token', data.token);
        storage.setItem('user', JSON.stringify(data.user));
        otherStorage.removeItem('token');
        otherStorage.removeItem('user');

        emailInput.value    = '';
        passwordInput.value = '';

        if (data.user.role === 'admin') {
            window.location.href = '/admin/alumnos';
        } else {
            window.location.href = '/dashboard';
        }

    } catch (error) {
        console.error('Error en login:', error);
    }
};

form.addEventListener('submit', handleSubmit);
