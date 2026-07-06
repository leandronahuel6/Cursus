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
    <style>
        :root {
            --brand: #4f46e5;
            --brand-hover: #4338ca;
            --brand-light: #eef2ff;
            --brand-dim: #c7d2fe;
            --r: 12px;
            --r-sm: 8px;
            --r-lg: 16px;

            /* Light theme variables */
            --bg-color: #f8fafc;
            --text-main: #334155;
            --text-heading: #0f172a;
            --text-muted: #475569;
            --text-desc: #64748b;
            --card-bg: rgba(255, 255, 255, 0.7);
            --card-bg-hover: #ffffff;
            --card-border: rgba(226, 232, 240, 0.8);
            --card-shadow: rgba(0, 0, 0, 0.01);
            --header-bg: rgba(245, 247, 252, 0.8);
            --header-border: rgba(226, 232, 240, 0.8);
            --bg-input: #ffffff;
            --brand-gradient: linear-gradient(135deg, #5c4fe5 0%, #06b6d4 100%);
            --brand-gradient-hover: linear-gradient(135deg, #4f46e5 0%, #0891b2 100%);
            
            --hero-border: rgba(226, 232, 240, 0.8);
            --hero-img-opacity: 0.12;
        }

        body.dark-mode {
            /* Dark theme variables */
            --bg-color: #070a13;
            --text-main: #cbd5e1;
            --text-heading: #f8fafc;
            --text-muted: #94a3b8;
            --text-desc: #64748b;
            --card-bg: rgba(17, 24, 39, 0.75);
            --card-bg-hover: rgba(30, 41, 59, 0.9);
            --card-border: rgba(30, 41, 59, 0.8);
            --card-shadow: rgba(0, 0, 0, 0.15);
            --header-bg: rgba(7, 10, 19, 0.85);
            --header-border: rgba(30, 41, 59, 0.8);
            --bg-input: #1e293b;
            
            --hero-border: rgba(30, 41, 59, 0.8);
            --hero-img-opacity: 0.08;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
            transition: background-color 0.3s, color 0.3s;
        }

        /* BACKGROUND BLOBS FLOTANTES */


        /* HEADER */
        .landing-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 75px;
            background: var(--header-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--header-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 5%;
            z-index: 1000;
            transition: all 0.3s ease;
        }
        .logo-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: inherit;
        }
        .logo-wrap img {
            height: 36px;
            width: auto;
            border-radius: 8px;
        }
        .logo-tx {
            font-size: 19px;
            font-weight: 800;
            color: var(--text-heading);
            line-height: 1;
            display: flex;
            flex-direction: column;
        }
        .logo-tx small {
            font-size: 10px;
            color: var(--brand);
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }
        .landing-nav {
            display: flex;
            gap: 30px;
        }
        .landing-nav a {
            text-decoration: none;
            color: var(--text-muted);
            font-size: 14.5px;
            font-weight: 500;
            transition: color 0.2s;
        }
        .landing-nav a:hover, .landing-nav a.active {
            color: var(--brand);
        }
        .landing-actions {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .btn-login {
            text-decoration: none;
            color: var(--text-heading);
            font-size: 14.5px;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: var(--r-sm);
            transition: all 0.2s;
        }
        .btn-login:hover {
            background: var(--brand-light);
            color: var(--brand);
        }
        .btn-register {
            text-decoration: none;
            background: var(--brand-gradient);
            background-size: 200% 100%;
            background-position: left center;
            color: #fff !important;
            font-size: 14.5px;
            font-weight: 600;
            padding: 10px 22px;
            border-radius: 30px;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
            transition: all 0.3s;
            display: inline-block;
        }
        .btn-register:hover {
            background-position: right center;
            transform: translateY(-2px);
        }
        .theme-toggle-btn {
            background: rgba(255, 255, 255, 0.5);
            border: 1px solid var(--card-border);
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            transition: all 0.2s;
        }
        .theme-toggle-btn:hover {
            background: #ffffff;
            border-color: var(--brand);
        }
        .theme-toggle-btn .icon-sun { display: none; color: #f59e0b; }
        .theme-toggle-btn .icon-moon { display: block; color: #6366f1; }
        body.dark-mode .theme-toggle-btn .icon-sun { display: block; }
        body.dark-mode .theme-toggle-btn .icon-moon { display: none; }

        .contact-page {
            position: relative;
            overflow: hidden;
            padding: 130px 5% 80px 5%;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            background-color: var(--bg-color);
            box-sizing: border-box;
        }
        .contact-page::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: var(--hero-bg-url);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: var(--hero-img-opacity, 0.12);
            filter: grayscale(15%) blur(1.8px);
            z-index: 1;
        }
        .contact-layout {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 60px;
            background: var(--card-bg);
            backdrop-filter: blur(8px);
            border: 1px solid var(--card-border);
            border-radius: var(--r);
            padding: 60px;
            box-shadow: 0 10px 30px var(--card-shadow);
            max-width: 1100px;
            width: 100%;
            position: relative;
            z-index: 5;
        }
        .contact-info {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 24px;
        }
        .contact-title {
            font-size: 32px;
            font-weight: 800;
            color: var(--text-heading);
            margin-bottom: 12px;
        }
        .contact-desc {
            font-size: 15.5px;
            color: var(--text-muted);
            line-height: 1.6;
        }
        .contact-details {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 20px;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 14px;
            font-size: 15px;
            color: var(--text-muted);
        }
        .contact-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .form-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-muted);
        }
        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 12px 14px;
            border-radius: var(--r-sm);
            border: 1px solid var(--card-border);
            background: var(--bg-input);
            color: var(--text-heading);
            font-family: inherit;
            font-size: 14.5px;
            outline: none;
            box-sizing: border-box;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input::placeholder, .form-textarea::placeholder {
            color: #94a3b8;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            border-color: var(--brand);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .form-textarea {
            resize: vertical;
            min-height: 120px;
        }
        .btn-submit {
            background: var(--brand-gradient);
            background-size: 200% 100%;
            background-position: left center;
            color: #fff !important;
            font-family: inherit;
            font-weight: 600;
            font-size: 15px;
            padding: 12px 24px;
            border: none;
            border-radius: var(--r-sm);
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.2);
            transition: all 0.3s ease;
        }
        .btn-submit:hover {
            background-position: right center;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }

        /* ERRORES */
        .error-lbl {
            color: #ef4444;
            font-size: 11.5px;
            font-weight: 600;
            margin-top: 3px;
            display: none;
        }

        /* MODAL DE ÉXITO */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .modal-overlay.open {
            opacity: 1;
            pointer-events: auto;
        }
        .modal-box {
            background: var(--card-bg-hover);
            border: 1px solid var(--card-border);
            box-shadow: 0 20px 50px rgba(0,0,0,0.15);
            border-radius: var(--r);
            padding: 40px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        .modal-overlay.open .modal-box {
            transform: scale(1);
        }
        .modal-title {
            font-size: 20px;
            font-weight: 800;
            color: var(--text-heading);
            margin-bottom: 8px;
        }
        .modal-desc {
            font-size: 14.5px;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 24px;
        }
        .btn-modal-close {
            background: var(--brand);
            color: #fff;
            border: none;
            padding: 10px 24px;
            border-radius: var(--r-sm);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .btn-modal-close:hover {
            background: var(--brand-hover);
        }

        /* FOOTER */
        .landing-footer {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-top: 1px solid var(--card-border);
            padding: 40px 5% 30px 5%;
            z-index: 5;
            position: relative;
        }
        .footer-layout {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--card-border);
        }
        .footer-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: inherit;
        }
        .footer-logo img {
            height: 30px;
            width: auto;
            border-radius: 6px;
        }
        .footer-logo-tx {
            font-size: 16px;
            font-weight: 800;
            color: var(--text-heading);
            line-height: 1;
            display: flex;
            flex-direction: column;
        }
        .footer-logo-tx small {
            font-size: 9px;
            color: var(--brand);
            font-weight: 600;
            margin-top: 1px;
        }
        .footer-nav {
            display: flex;
            gap: 20px;
        }
        .footer-nav a {
            text-decoration: none;
            color: var(--text-muted);
            font-size: 13.5px;
            font-weight: 500;
            transition: color 0.2s;
        }
        .footer-nav a:hover {
            color: var(--brand);
        }
        .footer-bottom {
            max-width: 1200px;
            margin: 20px auto 0 auto;
            display: flex;
            justify-content: space-between;
            font-size: 12.5px;
            color: var(--text-desc);
            flex-wrap: wrap;
            gap: 10px;
        }

        /* RESPONSIVITY */
        @media (max-width: 900px) {
            .contact-layout {
                grid-template-columns: 1fr;
                padding: 40px;
                gap: 40px;
            }
        }
        @media (max-width: 768px) {
            .landing-nav {
                display: none;
            }
        }
        @media (max-width: 600px) {
            .form-row {
                grid-template-columns: 1fr;
            }
            .contact-layout {
                padding: 24px;
            }
        }
    </style>
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
            <button id="theme-toggle" class="theme-toggle-btn" aria-label="Cambiar tema">
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
    <main class="contact-page" style="--hero-bg-url: url('{{ asset('assets/img/contact_bg.png') }}');">
        <div class="contact-layout">
                <div class="contact-info">
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: var(--brand); display: block; margin-bottom: 12px;">Contacto</span>
                        <h1 class="contact-title">¿Tenés alguna consulta?</h1>
                        <p class="contact-desc" style="margin-bottom: 20px;">
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

    <!-- Scripts de Lucide y welcome.js -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        // Inicializar Iconos de Lucide
        lucide.createIcons();
    </script>
    <script src="{{ asset('js/welcome.js') }}"></script>
</body>
</html>
