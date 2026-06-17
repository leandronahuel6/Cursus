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

        // guardar token Sanctum
        localStorage.setItem("token", data.token);

        // limpiar inputs
        emailInput.value = '';
        passwordInput.value = '';

        // redirigir
        window.location.href = "/dashboard";

    } catch (error) {
        console.error("Error en login:", error);
    }
};