window.handleContactSubmit = async function() {
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const subjectSelect = document.getElementById('contact-subject');
    const msgInput = document.getElementById('contact-msg');

    const errName = document.getElementById('err-name');
    const errEmail = document.getElementById('err-email');
    const errMsg = document.getElementById('err-msg');

    errName.style.display = 'none';
    errEmail.style.display = 'none';
    errMsg.style.display = 'none';

    let isValid = true;

    if (nameInput.value.trim() === '') {
        errName.style.display = 'block';
        isValid = false;
    }

    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailValue === '' || !emailRegex.test(emailValue)) {
        errEmail.textContent = 'Ingresá un correo electrónico válido';
        errEmail.style.display = 'block';
        isValid = false;
    }

    if (msgInput.value.trim().length < 10) {
        errMsg.style.display = 'block';
        isValid = false;
    }

    if (isValid) {
        const subjectVal = subjectSelect.value;
        const asunto = subjectSelect.options[subjectSelect.selectedIndex].text;

        try {
            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    tipo: subjectVal,
                    asunto: asunto,
                    descripcion: msgInput.value.trim(),
                    remitente_nombre: nameInput.value.trim(),
                    remitente_email: emailValue,
                })
            });
        } catch (_) { }

        const modalDesc = document.getElementById('js-modal-feedback-desc');

        if (subjectVal === 'academica') {
            modalDesc.textContent = `Hemos recibido tu Consulta Académica. Estudiantes avanzados y coordinadores del plan TUP 2024 responderán a la brevedad en tu correo ${emailValue}.`;
        } else if (subjectVal === 'soporte') {
            modalDesc.textContent = `Tu reporte de Soporte Técnico fue registrado. Nos pondremos en contacto contigo a ${emailValue} si necesitamos más detalles.`;
        } else if (subjectVal === 'arancel') {
            modalDesc.textContent = `Tu consulta sobre aranceles de cuotas fue derivada a administración de la Regional Haedo. Recibirás una respuesta en ${emailValue}.`;
        } else {
            modalDesc.textContent = `¡Gracias por tu sugerencia! Cursus crece gracias al feedback de los alumnos. Tomamos nota de tus comentarios para seguir mejorando.`;
        }

        const modal = document.getElementById('js-success-modal');
        modal.classList.add('open');

        nameInput.value = '';
        emailInput.value = '';
        msgInput.value = '';
        subjectSelect.selectedIndex = 3;
    }
};

window.closeSuccessModal = function() {
    const modal = document.getElementById('js-success-modal');
    modal.classList.remove('open');
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
});
