<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contacto — Cursus UTN Haedo</title>
    <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">

    <!-- Google Fonts: Outfit -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- CSS / Estilos Premium -->
    <link rel="stylesheet" href="{{ asset('css/views/contacto.css') }}">
</head>
<body>



    <!-- HEADER / NAVBAR sticky -->
    <header class="landing-header">
        <a href="{{ route('welcome') }}" class="logo-wrap">
            <img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus Logo">
            <div class="logo-tx">
                Cursus
                <small>UTN Haedo</small>
            </div>
        </a>

        <nav class="landing-nav">
            <a href="{{ route('welcome') }}#que-es">Qué es</a>
            <a href="{{ route('welcome') }}#como-funciona">Cómo funciona</a>
            <a href="{{ route('welcome') }}#beneficios">Beneficios</a>
            <a href="{{ route('welcome') }}#faq">Preguntas</a>
            <a href="#" class="active">Contacto</a>
        </nav>

        <div class="landing-actions">
            <button data-theme-toggle class="theme-toggle-btn" aria-label="Cambiar tema">
                <i data-lucide="sun" class="icon-sun" style="width: 18px; height: 18px; stroke-width: 2.25;"></i>
                <i data-lucide="moon" class="icon-moon" style="width: 18px; height: 18px; stroke-width: 2.25;"></i>
            </button>
            @if (Route::has('login'))
                @auth
                    <a href="{{ url('/dashboard') }}" class="btn-register">Ir al Dashboard</a>
                @else
                    <a href="{{ route('login') }}" class="btn-login">Ingresar</a>
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="btn-register">Registrarse</a>
                    @endif
                @endauth
            @endif
        </div>
    </header>

    <!-- CONTAINER PRINCIPAL DE LA PÁGINA DE CONTACTO -->
    <main class="contact-page" style="--hero-bg-url: url('{{ asset('assets/img/contact_bg_page.png') }}');">
        <div class="contact-layout">
                <div class="contact-info">
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: var(--brand); display: block; margin-bottom: 12px;">Contacto</span>
                        <h1 class="contact-title">¿Tenés alguna consulta?</h1>
                        <p class="contact-desc">
                            Estamos acá para ayudarte. Si tenés dudas sobre el funcionamiento de la plataforma o sugerencias para mejorar Cursus, envianos un mensaje.
                        </p>
                    </div>

                <div class="contact-details">
                    <div class="contact-item">
                        <i data-lucide="map-pin" style="width: 20px; height: 20px; stroke-width: 2; color: var(--brand); flex-shrink: 0;"></i>
                        <span>UTN Regional Haedo — Haedo, Bs. As.</span>
                    </div>
                    <div class="contact-item">
                        <i data-lucide="mail" style="width: 20px; height: 20px; stroke-width: 2; color: var(--brand); flex-shrink: 0;"></i>
                        <span>soporte@cursus.utn.edu.ar</span>
                    </div>

                    <!-- Mapa de Google (Requisito examen) -->
                    <div style="margin-top: 25px; border-radius: var(--r); overflow: hidden; border: 1px solid var(--card-border); box-shadow: var(--card-shadow); height: 220px; width: 100%;">
                        <iframe src="https://maps.google.com/maps?q=UTN%20Facultad%20Regional%20Haedo,%20Par%C3%ADs%20532,%20Haedo&t=&z=16&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>
            </div>

            <!-- Formulario de Contacto -->
            <form class="contact-form" id="js-contact-form" onsubmit="event.preventDefault(); handleContactSubmit();">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label" for="contact-name">Nombre completo</label>
                        <input type="text" id="contact-name" class="form-input" placeholder="Juan Pérez">
                        <span class="error-lbl" id="err-name">Este campo es obligatorio</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="contact-email">Correo institucional</label>
                        <input type="email" id="contact-email" class="form-input" placeholder="usuario@alumnos.frh.utn.edu.ar">
                        <span class="error-lbl" id="err-email">Ingresá un correo institucional válido</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="contact-subject">Tipo de consulta</label>
                    <select id="contact-subject" class="form-select">
                        <option value="academica">Consulta Académica</option>
                        <option value="soporte">Soporte Técnico / Problemas</option>
                        <option value="arancel">Consulta Administrativa (Aranceles)</option>
                        <option value="sugerencia" selected>Sugerencia / Feedback</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="contact-msg">Mensaje</label>
                    <textarea id="contact-msg" class="form-textarea" placeholder="Escribí tu consulta aquí..."></textarea>
                    <span class="error-lbl" id="err-msg">Escribí un mensaje válido (mínimo 10 caracteres)</span>
                </div>

                <button type="submit" class="btn-submit">Enviar consulta</button>
            </form>
        </div>
    </main>

    <!-- FOOTER -->
    <footer class="landing-footer">
        <div class="footer-layout">
            <a href="{{ route('welcome') }}" class="footer-logo">
                <img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus" style="height: 30px; width: auto; border-radius: 6px;">
                <div class="footer-logo-tx">
                    Cursus
                    <small>UTN Haedo</small>
                </div>
            </a>
            <nav class="footer-nav">
                <a href="{{ route('welcome') }}#que-es">Qué es</a>
                <a href="{{ route('welcome') }}#como-funciona">Cómo funciona</a>
                <a href="{{ route('welcome') }}#beneficios">Beneficios</a>
                <a href="#">Contacto</a>
            </nav>
        </div>
        <div class="footer-bottom">
            <span>&copy; 2026 Cursus. Creado por alumnos para la comunidad de la UTN FRH.</span>
            <span>Tecnicatura Universitaria en Programación</span>
        </div>
    </footer>

    <!-- MODAL DE ÉXITO -->
    <div class="modal-overlay" id="js-success-modal">
        <div class="modal-box">
            <div class="modal-icon" style="display: flex; align-items: center; justify-content: center; color: var(--brand); margin-bottom: 16px;">
                <i data-lucide="mail-check" style="width: 50px; height: 50px; stroke-width: 1.5;"></i>
            </div>
            <h3 class="modal-title">¡Mensaje Enviado!</h3>
            <p class="modal-desc" id="js-modal-feedback-desc">
                Gracias por contactarte con Cursus. Hemos recibido tu sugerencia y nos pondremos en contacto a la brevedad en tu correo institucional.
            </p>
            <button class="btn-modal-close" onclick="closeSuccessModal()">Cerrar</button>
        </div>
    </div>

    <!-- Scripts de Lucide, theme compartido y lógica de contacto -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="{{ asset('js/shared/theme.js') }}"></script>
    <script src="{{ asset('js/views/contacto.js') }}"></script>
</body>
</html>
