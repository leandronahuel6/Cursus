<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursus - Restablecer contraseña</title>
</head>
<body>
    <main style="max-width: 400px; margin: 60px auto; font-family: sans-serif;">
        <h1>Restablecer contraseña</h1>
        <p>Ingresá tu nueva contraseña.</p>

        <form id="ResetForm">
            <div>
                <label for="password">Nueva contraseña</label><br>
                <input type="password" id="password" name="password" required>
                <span id="password-error" style="color: red; display: block;"></span>
            </div>
            <br>
            <div>
                <label for="password_confirmation">Confirmar contraseña</label><br>
                <input type="password" id="password_confirmation" name="password_confirmation" required>
            </div>
            <br>
            <button type="submit">Cambiar contraseña</button>
        </form>

        <p id="success-message" style="color: green;"></p>
    </main>

    <script>
        const form = document.querySelector('#ResetForm');
        const passwordInput = document.querySelector('#password');
        const passwordConfirmInput = document.querySelector('#password_confirmation');
        const passwordError = document.querySelector('#password-error');
        const successMessage = document.querySelector('#success-message');

        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const pathParts = window.location.pathname.split('/');
        const token = pathParts[pathParts.length - 1];

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            passwordError.textContent = '';
            successMessage.textContent = '';

            if (passwordInput.value.length < 8) {
                passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres';
                return;
            }

            if (passwordInput.value !== passwordConfirmInput.value) {
                passwordError.textContent = 'Las contraseñas no coinciden';
                return;
            }

            try {
                const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        token: token,
                        email: email,
                        password: passwordInput.value,
                        password_confirmation: passwordConfirmInput.value
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    passwordError.textContent = data.errors?.email?.[0] || data.message || 'Ocurrió un error';
                    return;
                }

                successMessage.textContent = data.message + ' Te llevamos al login...';
                form.style.display = 'none';

                setTimeout(() => {
                    window.location.href = "{{ route('login') }}";
                }, 2000);

            } catch (error) {
                console.error('Error:', error);
                passwordError.textContent = 'Error de conexión';
            }
        });
    </script>
</body>
</html>