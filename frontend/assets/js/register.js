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

const handleSubmit = (e) =>{
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

    //TODO: Aca se debe enviar el formulario a la API
    //TODO: Si la respuesta es exitosa, se debe redirigir a la pagina principal
    //TODO: Si la respuesta es erronea, se debe mostrar el mensaje de error


    console.log('Formulario enviado', nombreInput.value, legajoInput.value, emailInput.value, passwordInput.value);
    nombreInput.value = '';
    legajoInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';

    return true;
}

form.addEventListener('submit', handleSubmit);