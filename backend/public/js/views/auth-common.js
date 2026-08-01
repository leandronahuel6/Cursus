/**
 * auth-common.js
 *
 * Módulo compartido para las vistas de autenticación.
 * Expone utilidades de validación reutilizables bajo el namespace global
 * `AuthCommon`, evitando duplicación entre login.js, register.js,
 * forgot-password.js y reset-password.js.
 */

const AuthCommon = (() => {
    /** Expresión regular canónica para validación de email. */
    const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

    /**
     * Valida el formato de un email.
     * @param {string} value
     * @returns {string|null} Mensaje de error o null si es válido.
     */
    const validateEmail = (value) => {
        if (!value) return 'Ingresá tu correo electrónico';
        if (!emailRegex.test(value)) return 'El email debe tener un formato válido';
        return null;
    };

    /**
     * Valida que la contraseña cumpla la longitud mínima requerida.
     * @param {string} value
     * @returns {string|null} Mensaje de error o null si es válida.
     */
    const validatePassword = (value) => {
        if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
        return null;
    };

    return { emailRegex, validateEmail, validatePassword };
})();
