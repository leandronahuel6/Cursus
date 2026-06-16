const form = document.querySelector('#LoginForm');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');

const emailError = document.querySelector('#email-error');
const passwordError = document.querySelector('#password-error');

const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;



const handleSubmit = (e) =>{
    e.preventDefault();
    emailError.textContent = '';
    passwordError.textContent = '';


    if(!emailInput.value) {
        emailError.textContent = 'Ingrese un correo electrónico';
        return;
    }
    if(!emailRegex.test(emailInput.value)){
        emailError.textContent = 'Ingrese un correo electrónico válido';
        emailInput.focus();
        return;
    }

    if(passwordInput.value.length < 8){
        passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres';
        passwordInput.focus();
        return;
    }

    //Todo: Aca se debe enviar el formulario a la API
    //TODO: Si la respuesta es exitosa, se debe redirigir a la pagina principal
    //TODO: Si la respuesta es erronea, se debe mostrar el mensaje de error


    
    console.log('Formulario enviado', emailInput.value, passwordInput.value);
    emailInput.value = '';
    passwordInput.value = '';


    
    return true;
}


