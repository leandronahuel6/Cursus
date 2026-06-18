const form = document.querySelector('#RegisterForm');


const nameValidation = (name) =>{
    if(name.length < 3){
        return 'El nombre debe tener al menos 3 caracteres';
    }
    if(name.length > 50){
        return 'El nombre debe tener menos de 50 caracteres';
    }
    return null;
}

const emailValidation = (email) =>{
    const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
    if(!emailRegex.test(email)){
        return 'El email debe tener un formato válido';
    }
    return null;
}

const passwordValidation = (password) =>{
    if(password.length < 8){
        return 'La contraseña debe tener al menos 8 caracteres';
    }
    return null;
}


const legajoValidation = (legajo) =>{
    if(!legajo){
        return 'Ingrese su número de legajo';
    }
    return null;
}

const handleSubmit = async (e) =>{
    e.preventDefault();

    const nombreInput = document.querySelector('#nombre');
    const legajoInput = document.querySelector('#legajo');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');

    const nombreError = document.querySelector('#nombre-error');
    const legajoError = document.querySelector('#legajo-error');
    const emailError = document.querySelector('#email-error');
    const passwordError = document.querySelector('#password-error');

    nombreError.textContent = nameValidation(nombreInput.value);
    legajoError.textContent = legajoValidation(legajoInput.value);
    emailError.textContent = emailValidation(emailInput.value);
    passwordError.textContent = passwordValidation(passwordInput.value);

    if(nombreError.textContent || legajoError.textContent || emailError.textContent || passwordError.textContent){
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombreInput.value,
                legajo: legajoInput.value,
                email: emailInput.value,
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            nombreError.textContent = data.errors?.nombre?.[0] || nombreError.textContent;
            legajoError.textContent = data.errors?.legajo?.[0] || legajoError.textContent;
            emailError.textContent = data.errors?.email?.[0] || emailError.textContent;
            passwordError.textContent = data.errors?.password?.[0] || passwordError.textContent;
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        nombreInput.value = '';
        legajoInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error en registro:', error);
        emailError.textContent = 'No se pudo completar el registro. Intentá nuevamente.';
    }
}

form.addEventListener('submit', handleSubmit);