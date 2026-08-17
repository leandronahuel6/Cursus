{{--
    @fileoverview Vista de la página de Contacto de Cursus.
    Extiende el layout base de landing (layouts/landing). No contiene
    etiquetas <html>, <head>, <body>, ni imports de scripts o CSS globales:
    todo eso es responsabilidad del layout.

    Reglas aplicadas:
    - Sin atributos style="" en el HTML.
    - Sin eventos inline (onsubmit, onclick). El JS usa addEventListener.
    - Clases de formulario de forms.css (.custom-input, .custom-textarea, .form-field, etc.)
    - ARIA completo en el modal (role, aria-modal, aria-labelledby, aria-describedby).
    - La variable --bg-url y el overlay de imagen están en contacto.css.
--}}
@extends('layouts.landing')

@section('title', 'Contacto — Cursus UTN Haedo')
@section('meta-description', 'Contactá al equipo de Cursus. Dudas académicas, soporte técnico o sugerencias: estamos acá para ayudarte.')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/components/forms.css') }}">
    <link rel="stylesheet" href="{{ asset('css/views/landing/contacto.css') }}">
@endpush

@section('content')

    <div class="contact-page-wrapper">
        <div class="contact-layout">

            {{-- ── INFORMACIÓN DE CONTACTO ── --}}
            <div class="contact-info">
                <div>
                    <span class="contact-section-lbl">Contacto</span>
                    <h1 class="contact-title">¿Tenés alguna consulta?</h1>
                    <p class="contact-desc">
                        Estamos acá para ayudarte. Si tenés dudas sobre el funcionamiento
                        de la plataforma o sugerencias para mejorar Cursus, envianos un mensaje.
                    </p>
                </div>

                <address class="contact-details" aria-label="Datos de contacto">
                    <div class="contact-item">
                        <i data-lucide="map-pin" class="contact-item__icon" aria-hidden="true"></i>
                        <span>UTN Regional Haedo — Haedo, Bs. As.</span>
                    </div>
                    <div class="contact-item">
                        <i data-lucide="mail" class="contact-item__icon" aria-hidden="true"></i>
                        <a href="mailto:soporte@cursus.utn.edu.ar">soporte@cursus.utn.edu.ar</a>
                    </div>
                </address>

                {{-- Mapa de Google --}}
                <div class="contact-map">
                    <iframe
                        src="https://maps.google.com/maps?q=UTN%20Facultad%20Regional%20Haedo,%20Par%C3%ADs%20532,%20Haedo&t=&z=16&ie=UTF8&iwloc=&output=embed"
                        title="Mapa de ubicación de UTN Regional Haedo"
                        allowfullscreen
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                        aria-label="Mapa de Google con la ubicación de UTN Regional Haedo"
                    ></iframe>
                </div>
            </div>

            {{-- ── FORMULARIO DE CONTACTO ── --}}
            {{--
                Sin atributo onsubmit. El evento submit es interceptado por
                contacto.js con addEventListener('submit', handleSubmit).
                aria-live="polite" en el contenedor de errores informa a
                lectores de pantalla cuando aparecen mensajes de error.
            --}}
            <form
                class="contact-form"
                id="js-contact-form"
                novalidate
                aria-label="Formulario de consulta"
            >
                <div class="form-field-row">
                    {{-- Nombre --}}
                    <div class="form-field">
                        <label class="form-label" for="contact-name">Nombre completo</label>
                        <input
                            type="text"
                            id="contact-name"
                            name="contact_name"
                            class="custom-input"
                            placeholder="Juan Pérez"
                            autocomplete="name"
                            aria-required="true"
                            aria-describedby="err-name"
                        >
                        <span
                            class="error-message"
                            id="err-name"
                            role="alert"
                            aria-live="polite"
                        ></span>
                    </div>

                    {{-- Email --}}
                    <div class="form-field">
                        <label class="form-label" for="contact-email">Correo institucional</label>
                        <input
                            type="email"
                            id="contact-email"
                            name="contact_email"
                            class="custom-input"
                            placeholder="usuario@alumnos.frh.utn.edu.ar"
                            autocomplete="email"
                            aria-required="true"
                            aria-describedby="err-email"
                        >
                        <span
                            class="error-message"
                            id="err-email"
                            role="alert"
                            aria-live="polite"
                        ></span>
                    </div>
                </div>

                {{-- Tipo de consulta (Blade Component x-custom-select) --}}
                <div class="form-field">
                    <label class="form-label" for="contact-subject">Tipo de consulta</label>
                    <x-custom-select id="contact-subject" name="contact_subject">
                        <option value="academica">Consulta Académica</option>
                        <option value="soporte">Soporte Técnico / Problemas</option>
                        <option value="arancel">Consulta Administrativa (Aranceles)</option>
                        <option value="sugerencia" selected>Sugerencia / Feedback</option>
                    </x-custom-select>
                </div>

                {{-- Mensaje --}}
                <div class="form-field">
                    <label class="form-label" for="contact-msg">Mensaje</label>
                    <textarea
                        id="contact-msg"
                        name="contact_msg"
                        class="custom-textarea"
                        placeholder="Escribí tu consulta aquí..."
                        aria-required="true"
                        aria-describedby="err-msg"
                        rows="5"
                    ></textarea>
                    <span
                        class="error-message"
                        id="err-msg"
                        role="alert"
                        aria-live="polite"
                    ></span>
                </div>

                <button type="submit" class="btn-submit">
                    <i data-lucide="send" aria-hidden="true"></i>
                    Enviar consulta
                </button>
            </form>

        </div>
    </div>

    {{-- ── MODAL DE ÉXITO ──
        Atributos ARIA requeridos para el patrón modal accesible:
        - role="dialog"       → indica que es un cuadro de diálogo
        - aria-modal="true"   → informa a AT que el contenido de fondo no es interactivo
        - aria-labelledby     → asocia el título del modal
        - aria-describedby    → asocia la descripción del modal
        Sin onclick. El cierre es manejado por contacto.js con data-js="modal-close".
    --}}
    <div
        class="modal-overlay"
        id="js-success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-success-title"
        aria-describedby="modal-success-desc"
        hidden
    >
        <div class="modal-box">
            <div class="modal-icon" aria-hidden="true">
                <i data-lucide="mail-check"></i>
            </div>
            <h2 class="modal-title" id="modal-success-title">¡Mensaje Enviado!</h2>
            <p class="modal-desc" id="modal-success-desc">
                Gracias por contactarte con Cursus. Hemos recibido tu sugerencia
                y nos pondremos en contacto a la brevedad en tu correo institucional.
            </p>
            <p class="modal-desc" id="js-modal-feedback-desc" aria-live="polite"></p>
            <button
                type="button"
                class="btn-modal-close"
                data-js="modal-close"
                aria-label="Cerrar este diálogo"
            >
                Cerrar
            </button>
        </div>
    </div>

@endsection

@push('scripts')
    <script type="module" src="{{ asset('js/views/landing/contacto.js') }}"></script>
@endpush
