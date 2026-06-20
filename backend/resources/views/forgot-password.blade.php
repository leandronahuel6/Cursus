<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursus - Olvidé mi contraseña</title>
</head>
<body>
    <main style="max-width: 400px; margin: 60px auto; font-family: sans-serif;">
        <h1>Olvidé mi contraseña</h1>
        <p>Ingresá tu email y te mandamos un link para restablecer tu contraseña.</p>

        <form id="ForgotForm">
            <div>
                <label for="email">Email</label><br>
                <input type="email" id="email" name="email" required>
                <span id="email-error" style="color: red; display: block;"></span>
            </div>
            <br>
            <button type="submit">Enviar link</button>
        </form>

        <p id="success-message" style="color: green;"></p>
    </main>

    <script>
        const form = document.querySelector('#ForgotForm');
        const emailInput = document.querySelector('#email');
        const emailError = document.querySelector('#email-error');
        const successMessage = document.querySelector('#success-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            emailError.textContent = '';
            successMessage.textContent = '';

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
                emailInput.value = '';

            } catch (error) {
                console.error('Error:', error);
                emailError.textContent = 'Error de conexión';
            }
        });
    </script>
</body>
</html>