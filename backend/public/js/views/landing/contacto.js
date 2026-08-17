/**
 * @fileoverview Módulo de lógica del formulario de contacto.
 * Gestiona la validación del formulario, la llamada a la API, la visualización
 * de errores y la apertura/cierre del modal de éxito.
 *
 * NO expone ninguna función al scope global (`window`).
 * Todos los eventos se registran con `addEventListener`.
 * La visibilidad de errores se controla con clases CSS, no con `.style.display`.
 *
 * @module landing/contacto
 */

'use strict';

import { initLanding } from './shared.js';

/* ============================================================
   HELPERS DE VISIBILIDAD (sin mutar .style directamente)
   ============================================================ */

/**
 * Muestra un elemento de error.
 * @param {HTMLElement|null} el - El elemento de error a mostrar.
 * @param {string} [msg] - Mensaje opcional para reemplazar el texto actual.
 * @returns {void}
 */
function showError(el, msg) {
    if (!el) return;
    if (msg) el.textContent = msg;
    el.classList.add('is-visible');
}

/**
 * Oculta un elemento de error.
 * @param {HTMLElement|null} el - El elemento de error a ocultar.
 * @returns {void}
 */
function hideError(el) {
    if (!el) return;
    el.classList.remove('is-visible');
}

/* ============================================================
   MODAL
   ============================================================ */

/**
 * Abre el modal de éxito, establece el foco dentro del modal y bloquea
 * la interacción con el resto del documento (aria-modal).
 *
 * @param {HTMLElement} modal - El elemento overlay del modal.
 * @returns {void}
 */
function openModal(modal) {
    modal.classList.add('open');
    // Mover el foco al título del modal para lectores de pantalla
    const title = modal.querySelector('.modal-title');
    if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus();
    }
}

/**
 * Cierra el modal de éxito y devuelve el foco al botón de submit.
 *
 * @param {HTMLElement} modal - El elemento overlay del modal.
 * @param {HTMLElement|null} returnFocusTo - Elemento al que devolver el foco.
 * @returns {void}
 */
function closeModal(modal, returnFocusTo) {
    modal.classList.remove('open');
    if (returnFocusTo) returnFocusTo.focus();
}

/* ============================================================
   MENSAJES DE FEEDBACK POR TIPO DE CONSULTA
   ============================================================ */

/**
 * Genera el mensaje de feedback del modal según el tipo de consulta.
 *
 * @param {string} type - El valor del select de tipo de consulta.
 * @param {string} email - El email del remitente.
 * @returns {string} El mensaje de feedback.
 */
function getFeedbackMessage(type, email) {
    const messages = {
        academica: `Hemos recibido tu Consulta Académica. Estudiantes avanzados y coordinadores del plan TUP 2024 responderán a la brevedad en tu correo ${email}.`,
        soporte:   `Tu reporte de Soporte Técnico fue registrado. Nos pondremos en contacto contigo a ${email} si necesitamos más detalles.`,
        arancel:   `Tu consulta sobre aranceles fue derivada a administración de la Regional Haedo. Recibirás una respuesta en ${email}.`,
    };
    return messages[type] ?? '¡Gracias por tu sugerencia! Cursus crece gracias al feedback de los alumnos. Tomamos nota de tus comentarios para seguir mejorando.';
}

/* ============================================================
   VALIDACIÓN
   ============================================================ */

/** @type {RegExp} Expresión regular para validación básica de email. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida todos los campos del formulario de contacto.
 * Muestra u oculta los mensajes de error según el estado de cada campo.
 *
 * @param {HTMLInputElement}  nameInput  - Campo de nombre.
 * @param {HTMLInputElement}  emailInput - Campo de email.
 * @param {HTMLTextAreaElement} msgInput - Campo de mensaje.
 * @param {HTMLElement}       errName   - Contenedor de error del nombre.
 * @param {HTMLElement}       errEmail  - Contenedor de error del email.
 * @param {HTMLElement}       errMsg    - Contenedor de error del mensaje.
 * @returns {boolean} `true` si el formulario es válido.
 */
function validateForm(nameInput, emailInput, msgInput, errName, errEmail, errMsg) {
    let valid = true;

    hideError(errName);
    hideError(errEmail);
    hideError(errMsg);

    if (!nameInput.value.trim()) {
        showError(errName, 'Este campo es obligatorio');
        valid = false;
    }

    const emailVal = emailInput.value.trim();
    if (!emailVal || !EMAIL_REGEX.test(emailVal)) {
        showError(errEmail, 'Ingresá un correo electrónico válido');
        valid = false;
    }

    if (msgInput.value.trim().length < 10) {
        showError(errMsg, 'Escribí un mensaje válido (mínimo 10 caracteres)');
        valid = false;
    }

    return valid;
}

/* ============================================================
   SUBMIT
   ============================================================ */

/**
 * Maneja el envío del formulario de contacto.
 * Valida los campos, llama a la API y abre el modal de éxito si todo es correcto.
 * En caso de error de red, el modal igual se muestra (UX optimista).
 *
 * @param {SubmitEvent} e - El evento de submit del formulario.
 * @returns {Promise<void>}
 */
async function handleSubmit(e) {
    e.preventDefault();

    const form       = /** @type {HTMLFormElement} */ (e.currentTarget);
    const nameInput  = form.querySelector('#contact-name');
    const emailInput = form.querySelector('#contact-email');
    const msgInput   = form.querySelector('#contact-msg');
    const errName    = form.querySelector('#err-name');
    const errEmail   = form.querySelector('#err-email');
    const errMsg     = form.querySelector('#err-msg');
    const submitBtn  = form.querySelector('[type="submit"]');

    // Obtener el valor del <x-custom-select> buscando el select nativo interno
    const selectEl  = form.querySelector('#contact-subject select, #contact-subject');
    const subjectVal = selectEl?.value ?? '';
    const subjectTxt = selectEl?.options?.[selectEl.selectedIndex]?.text ?? subjectVal;

    if (!validateForm(nameInput, emailInput, msgInput, errName, errEmail, errMsg)) return;

    const emailVal = emailInput.value.trim();
    const modal    = document.getElementById('js-success-modal');

    try {
        await fetch('/api/contact', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body:    JSON.stringify({
                tipo:              subjectVal,
                asunto:            subjectTxt,
                descripcion:       msgInput.value.trim(),
                remitente_nombre:  nameInput.value.trim(),
                remitente_email:   emailVal,
            }),
        });
    } catch (_) {
        // Error de red: continúa con la UX optimista
    }

    // Actualizar mensaje del modal
    const modalDesc = document.getElementById('js-modal-feedback-desc');
    if (modalDesc) {
        modalDesc.textContent = getFeedbackMessage(subjectVal, emailVal);
    }

    if (modal) openModal(modal);

    // Resetear formulario
    form.reset();
}

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initLanding();

    const form  = document.getElementById('js-contact-form');
    const modal = document.getElementById('js-success-modal');
    const closeBtn = document.querySelector('[data-js="modal-close"]');
    const submitBtn = form?.querySelector('[type="submit"]');

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => closeModal(modal, submitBtn));
    }

    // Cerrar modal con Escape
    if (modal) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('open')) {
                closeModal(modal, submitBtn);
            }
        });

        // Cerrar al hacer clic en el overlay (fuera del modal-box)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal, submitBtn);
        });
    }
});
