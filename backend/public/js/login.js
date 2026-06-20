const form = document.querySelector('#LoginForm');
const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

const handleSubmit = async (e) => {
    e.preventDefault();

    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');

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

        // guardar token Sanctum y datos del usuario (para pintar el perfil sin esperar a la API)
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

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
