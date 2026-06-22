const form = document.querySelector('#LoginForm');
const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

// "Recordarme" controla dónde se guarda la sesión:
// - Marcado  -> localStorage (sobrevive a cerrar el navegador, no vuelve a pedir datos)
// - Sin marcar -> sessionStorage (se pierde al cerrar la pestaña/navegador)
function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Si ya hay una sesión guardada (en cualquiera de los dos storages), no hace
// falta pedir los datos de nuevo: se valida el token y se entra directo.
(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) return;

    try {
        const response = await fetch('/api/user', {
            headers: { 'Authorization': 'Bearer ' + storedToken, 'Accept': 'application/json' }
        });
        if (response.ok) {
            window.location.href = '/dashboard';
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

    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    const rememberInput = document.querySelector('input[name="remember"]');

    const emailError = document.querySelector('#email-error');
    const passwordError = document.querySelector('#password-error');

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
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-CSRF-TOKEN": document.querySelector('input[name="_token"]').value
            },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // errores del backend (Laravel)
            if (data.errors?.email) {
                emailError.textContent = data.errors.email[0];
            }
            return;
        }

        console.log("LOGIN OK:", data);

        // Guardar token Sanctum y datos del usuario. Si "Recordarme" está
        // marcado, en localStorage (persiste); si no, en sessionStorage
        // (se borra al cerrar el navegador y la próxima vez pedirá login).
        const remember = rememberInput?.checked ?? false;
        const storage = remember ? localStorage : sessionStorage;
        const otherStorage = remember ? sessionStorage : localStorage;

        storage.setItem("token", data.token);
        storage.setItem("user", JSON.stringify(data.user));
        otherStorage.removeItem("token");
        otherStorage.removeItem("user");

        // limpiar inputs
        emailInput.value = '';
        passwordInput.value = '';

        // redirigir
        window.location.href = "/dashboard";

    } catch (error) {
        console.error("Error en login:", error);
    }
};

form.addEventListener('submit', handleSubmit);
