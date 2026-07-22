<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Cursus es el organizador académico y asistente de productividad definitivo para la Tecnicatura en Programación de la UTN Regional Haedo. Controlá tu promedio, correlatividades, cronómetro Pomodoro y cuotas en un solo lugar.">
    <meta name="keywords" content="Cursus, UTN Haedo, UTN, TUP, Tecnicatura Programación, Estudiantes, Pomodoro, Correlatividades, Autogestión, Campus Virtual, Universidad">
    
    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Cursus - Tu Asistente Universitario UTN Haedo">
    <meta property="og:description" content="Organizá tu cursada, simulá tu promedio, planificá tus correlativas y gestioná tus tiempos con el Pomodoro integrado. Diseñado por y para alumnos de la UTN.">
    <meta property="og:image" content="{{ asset('img/landing_hero.png') }}">
    
    <title>Cursus - Tu Asistente Universitario UTN Haedo</title>
    <link rel="stylesheet" href="{{ asset('css/main.css') }}">
    <link rel="icon" href="{{ asset('assets/icons/cursus-logo.svg') }}" type="image/svg+xml">
    <script src="https://unpkg.com/lucide@latest"></script>
    <link rel="stylesheet" href="{{ asset('css/views/welcome.css') }}">
</head>
<body>

    <!-- FONDO FIJO GLOBAL DE LA FACULTAD -->
    <div class="global-fixed-bg" style="--hero-bg-url: url('{{ asset('assets/img/inicio_nosotros.jpg') }}');"></div>

    <!-- BACKGROUND BLOBS FLOTANTES -->
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>

    <!-- MENÚ DE NAVEGACIÓN -->
    <header class="landing-header" id="js-header">
        <a href="#" class="logo-wrap">
            <img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus" style="height: 38px; width: auto; border-radius: 8px;">
            <div class="logo-tx">
                Cursus
                <small>UTN Haedo</small>
            </div>
        </a>

        <nav class="landing-nav">
            <a href="#que-es">Qué es</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#beneficios">Beneficios</a>
            <a href="#faq">Preguntas</a>
            <a href="{{ route('contacto') }}">Contacto</a>
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
                    <a href="{{ route('login') }}" class="btn-login">Iniciar sesión</a>
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="btn-register">Registrarse</a>
                    @endif
                @endauth
            @endif
        </div>
    </header>

    <!-- SECCIÓN HERO CON MINI-DASHBOARD INTERACTIVO -->
    <div class="hero-wrapper">
        <section class="hero-section">
        <div class="hero-info">
            <div class="badge-utn">Asistente Estudiantil</div>
            <h1 class="hero-title">Tu camino universitario, organizado en <span>un solo lugar</span></h1>
            <p class="hero-desc">
                Diseñado especialmente para la UTN Regional Haedo. Controlá tus materias, hacé seguimiento de tus correlativas, medí tu tiempo de estudio y visualizá tu fecha de egreso.
            </p>
            <div class="hero-btns">
                @auth
                    <a href="{{ url('/dashboard') }}" class="btn-hero-primary">Ir al Dashboard</a>
                @else
                    <a href="{{ route('register') }}" class="btn-hero-primary">Empezar gratis</a>
                @endauth
                <a href="#que-es" class="btn-hero-secondary">Ver funciones</a>
            </div>
        </div>
        <div class="hero-visual">
            <!-- MOCK DASHBOARD ESTÁTICO -->
            <div class="mock-dashboard">
                <div class="mock-hdr-dots">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                    <span class="mock-title">Cursus — Demo Interactiva 🧪</span>
                </div>
                <div class="mock-body" style="height: 350px;">
                    <!-- App-like Sidebar (Interactivo) -->
                    <div class="mock-sidebar" style="width: 75px; gap: 12px; padding: 16px 0;">
                        <div class="mock-sb-item active" data-mock-tab="inicio" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; cursor: pointer;">
                            <span>⊞</span>
                            <span style="font-size: 10px; font-weight: 500;">Inicio</span>
                        </div>
                        <div class="mock-sb-item" data-mock-tab="materias" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; color: #475569; cursor: pointer;">
                            <span>📚</span>
                            <span style="font-size: 10px; font-weight: 500;">Materias</span>
                        </div>
                        <div class="mock-sb-item" data-mock-tab="estudio" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; color: #475569; cursor: pointer;">
                            <span>⏱️</span>
                            <span style="font-size: 10px; font-weight: 500;">Estudio</span>
                        </div>
                        <div class="mock-sb-item" data-mock-tab="horarios" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; color: #475569; cursor: pointer;">
                            <span>📅</span>
                            <span style="font-size: 10px; font-weight: 500;">Horarios</span>
                        </div>
                        <div class="mock-sb-item" data-mock-tab="alertas" style="font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 3px; height: auto; width: 100%; color: #475569; cursor: pointer;">
                            <span>🔔</span>
                            <span style="font-size: 10px; font-weight: 500;">Alertas</span>
                        </div>
                    </div>
                    <div class="mock-main" style="padding: 16px; gap: 12px; overflow-y: auto;">
                        <!-- Mock App Topbar -->
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
                            <span style="font-size: 13px; font-weight: 800; color: var(--text-heading);" id="mock-user-welcome">Hola, Estudiante! 👋</span>
                            <span style="font-size: 10px; background: rgba(99, 102, 241, 0.1); color: var(--brand); padding: 3px 8px; border-radius: 10px; font-weight: 700;">TUP 2024</span>
                        </div>

                        <!-- VISTA: INICIO -->
                        <div class="mock-tab-content active" id="mock-tab-inicio" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Mock Widgets Layout -->
                            <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 10px;">
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <!-- Widget Progreso -->
                                    <div class="mock-widget" style="padding: 10px;">
                                        <div class="widget-title" style="font-size: 10px; margin-bottom: 6px;">📈 Progreso Académico</div>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="font-size: 15px; font-weight: 800; color: var(--brand);" id="mock-dash-avg">8.45 <span style="font-size: 10px; color: #64748b; font-weight: 500;">Promed.</span></div>
                                            <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px;">
                                                <div style="width: 35%; height: 100%; background: var(--brand); border-radius: 3px;" id="mock-dash-progress-bar"></div>
                                            </div>
                                            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted);" id="mock-dash-progress-text">35%</div>
                                        </div>
                                    </div>
                                    <!-- Widget Pomodoro -->
                                    <div class="mock-widget" style="padding: 10px; display: flex; align-items: center; justify-content: space-between;">
                                        <div>
                                            <div class="widget-title" style="font-size: 10px; margin-bottom: 4px;">⏱️ Enfoque Pomodoro</div>
                                            <div style="font-size: 16px; font-weight: 800; color: var(--text-heading);" id="mock-dash-pomodoro-timer">25:00</div>
                                        </div>
                                        <div style="font-size: 10px; background: #10b981; color: #fff; padding: 3px 8px; border-radius: 10px; font-weight: 700;" id="mock-dash-pomodoro-status">Estudiando</div>
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <!-- Widget Kanban/Tareas -->
                                    <div class="mock-widget" style="padding: 10px; height: 100%;">
                                        <div class="widget-title" style="font-size: 10px; margin-bottom: 6px;">📋 Entregas</div>
                                        <div style="display: flex; flex-direction: column; gap: 6px;">
                                            <div style="border-left: 2px solid #ef4444; background: #fee2e2; padding: 4px 6px; border-radius: 0 4px 4px 0; font-size: 11px; font-weight: 600; color: #991b1b;">
                                                TP Álgebra
                                            </div>
                                            <div style="border-left: 2px solid #f59e0b; background: #fef3c7; padding: 4px 6px; border-radius: 0 4px 4px 0; font-size: 11px; font-weight: 600; color: #92400e;">
                                                Proyecto BD
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Alerta Academica Widget -->
                            <div class="mock-widget" style="padding: 8px 10px; background: #eef2ff; border-color: rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 11px; font-weight: 600; color: var(--brand);">🔔 Vence cuota arancelaria: N° 4 Junio</span>
                                <span style="font-size: 11px; font-weight: 700; color: #ef4444;">$80.000</span>
                            </div>
                        </div>

                        <!-- VISTA: MATERIAS -->
                        <div class="mock-tab-content" id="mock-tab-materias" style="display: none; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-size: 12px; font-weight: 700; color: var(--text-heading);">Plan de Estudios (TUP)</span>
                                <span style="font-size: 10px; color: var(--brand); font-weight: 600;">Haz clic para aprobar:</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                                <div class="mock-subject-card approved" data-subject="prog1" style="border: 1px solid #10b981; background: rgba(16, 185, 129, 0.05); padding: 7px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 11px; font-weight: 700; color: var(--text-heading);">Prog. I</div>
                                    <div style="font-size: 10px; color: #10b981; font-weight: 600;" class="status">Aprobada (9)</div>
                                </div>
                                <div class="mock-subject-card approved" data-subject="lab1" style="border: 1px solid #10b981; background: rgba(16, 185, 129, 0.05); padding: 7px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 11px; font-weight: 700; color: var(--text-heading);">Laboratorio I</div>
                                    <div style="font-size: 10px; color: #10b981; font-weight: 600;" class="status">Aprobada (10)</div>
                                </div>
                                <div class="mock-subject-card approved" data-subject="spd" style="border: 1px solid #10b981; background: rgba(16, 185, 129, 0.05); padding: 7px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 11px; font-weight: 700; color: var(--text-heading);">Sist. Proc. Datos</div>
                                    <div style="font-size: 10px; color: #10b981; font-weight: 600;" class="status">Aprobada (8)</div>
                                </div>
                                <div class="mock-subject-card" data-subject="prog2" style="border: 1px solid var(--mock-border); background: var(--mock-widget-bg); padding: 7px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                                    <div style="font-size: 11px; font-weight: 700; color: var(--text-heading);">Prog. II</div>
                                    <div style="font-size: 10px; color: #ef4444; font-weight: 600;" class="status">Cursando</div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 11px; padding: 6px; background: rgba(99, 102, 241, 0.05); border-radius: 4px;">
                                <span style="font-weight: 600;">Promedio: <strong id="mock-subject-avg">9.00</strong></span>
                                <span style="font-weight: 600;">Progreso: <strong id="mock-subject-percent">75%</strong></span>
                            </div>
                        </div>

                        <!-- VISTA: ESTUDIO -->
                        <div class="mock-tab-content" id="mock-tab-estudio" style="display: none; flex-direction: column; gap: 10px; text-align: center; padding: 12px 0;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--text-heading);">Sesión de Enfoque Pomodoro</div>
                            <div style="font-size: 36px; font-weight: 800; color: var(--brand); font-family: monospace; letter-spacing: 1px; margin: 6px 0;" id="mock-pomo-timer">25:00</div>
                            <div style="display: flex; justify-content: center; gap: 12px;">
                                <button id="mock-pomo-play-btn" style="background: var(--brand); color: #fff; border: none; font-size: 11px; padding: 6px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">Iniciar</button>
                                <button id="mock-pomo-reset-btn" style="background: rgba(99,102,241,0.1); color: var(--brand); border: 1px solid rgba(99,102,241,0.2); font-size: 11px; padding: 6px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">Reiniciar</button>
                            </div>
                            <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px;" id="mock-pomo-desc">Haz clic en Iniciar para simular el temporizador Pomodoro.</div>
                        </div>

                        <!-- VISTA: HORARIOS -->
                        <div class="mock-tab-content" id="mock-tab-horarios" style="display: none; flex-direction: column; gap: 8px;">
                            <!-- Header de Simulación -->
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--mock-border); padding-bottom: 6px; margin-bottom: 4px;">
                                <div style="display: flex; gap: 6px; font-size: 10px;">
                                    <span style="background: var(--brand); color: #fff; padding: 2px 6px; border-radius: 3px; font-weight: 700; cursor: pointer;" id="mock-ver-a">Versión A</span>
                                    <span style="background: rgba(0,0,0,0.05); color: var(--text-muted); padding: 2px 6px; border-radius: 3px; font-weight: 700; cursor: pointer;" id="mock-ver-b">Versión B</span>
                                </div>
                                <span style="font-size: 10px; font-weight: 700; color: var(--text-heading); background: rgba(99,102,241,0.1); padding: 2px 6px; border-radius: 3px;">Curso N1_1 📅</span>
                            </div>
                            
                            <!-- Chips de Compañeros -->
                            <div style="display: flex; gap: 8px; font-size: 10px; margin-bottom: 4px;">
                                <span style="display: inline-flex; align-items: center; gap: 3px; color: #4f46e5; font-weight: 700;">
                                    <span style="width: 5px; height: 5px; border-radius: 50%; background: #4f46e5;"></span>Vos
                                </span>
                                <span style="display: inline-flex; align-items: center; gap: 3px; color: #10b981; font-weight: 700;" id="mock-compare-chip">
                                    <span style="width: 5px; height: 5px; border-radius: 50%; background: #10b981;"></span>Leandro (Comparando)
                                </span>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 6px;" id="mock-schedule-list">
                                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px; position: relative; overflow: hidden;">
                                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Lunes</span>
                                    <div style="display: flex; flex-direction: column; gap: 3px;">
                                        <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Programación II <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 22:30)</small></span>
                                        <!-- Solapamiento dashed overlay de Leandro -->
                                        <span id="mock-overlap-block" style="font-size: 10px; color: #047857; background: rgba(16, 185, 129, 0.1); border-left: 2px dashed #10b981; padding: 2px 6px; border-radius: 3px; font-weight: 700;">⚡ Solapamiento: Inglés I (Leandro)</span>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px;">
                                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Martes</span>
                                    <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Base de Datos I <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 21:30)</small></span>
                                </div>
                                <div style="display: grid; grid-template-columns: 55px 1fr; gap: 8px; align-items: center; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 8px; border-radius: 4px;">
                                    <span style="font-size: 11px; font-weight: 700; color: var(--brand);">Jueves</span>
                                    <span style="font-size: 11px; font-weight: 600; color: var(--text-heading);">Prob. y Estadística <small style="color:var(--text-muted); font-weight: 500;">(18:30 - 21:30)</small></span>
                                </div>
                            </div>

                            <!-- Clash Resolver Sugerencia -->
                            <div id="mock-clash-resolver-bar" style="display: flex; justify-content: space-between; align-items: center; background: #fffbeb; border: 1px solid #fef3c7; padding: 6px 8px; border-radius: 4px; margin-top: 4px;">
                                <span style="font-size: 10px; font-weight: 700; color: #b45309;">💡 Resolutor: Usar Com. N1-2 para Inglés I</span>
                                <button id="mock-resolve-btn" style="background: #f59e0b; color: #fff; border: none; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 700; cursor: pointer; transition: all 0.2s;">Resolver</button>
                            </div>
                        </div>

                        <!-- VISTA: ALERTAS -->
                        <div class="mock-tab-content" id="mock-tab-alertas" style="display: none; flex-direction: column; gap: 8px;">
                            <div style="font-size: 12px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px;">Notificaciones y Alertas</div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #fee2e2; border: 1px solid rgba(239,68,68,0.2); padding: 6px 10px; border-radius: 4px;" id="mock-alert-payment-card">
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-size: 11px; font-weight: 700; color: #ef4444;">Cuota Arancelaria N° 4</span>
                                        <span style="font-size: 10px; color: #7f1d1d; font-weight: 600;">Vence en 5 días • $80.000</span>
                                    </div>
                                    <button id="mock-pay-btn" style="background: #ef4444; color: #fff; border: none; font-size: 10px; padding: 3px 10px; border-radius: 8px; font-weight: 700; cursor: pointer;">Pagar</button>
                                </div>
                                <div style="display: flex; flex-direction: column; background: var(--mock-widget-bg); border: 1px solid var(--mock-border); padding: 6px 10px; border-radius: 4px;">
                                    <span style="font-size: 11px; font-weight: 700; color: #ea580c;">Inscripción a Finales</span>
                                    <span style="font-size: 10px; color: var(--text-muted);">Inscripciones abiertas en Autogestión hasta el 30/06.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>

    <!-- SECCIÓN PROPÓSITO (QUIÉNES SOMOS) -->
    <section class="section" id="que-es">
        <div class="purpose-section">
            <div class="purpose-visual" style="padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; border: none; background: transparent; box-shadow: none;">
                <img src="{{ asset('assets/img/lnicio.webp') }}" alt="Cursus Inicio" style="width: 100%; height: auto; border-radius: var(--r); box-shadow: 0 10px 25px rgba(0,0,0,0.03);">
            </div>
            <div class="purpose-text">
                <span class="section-lbl">Quiénes Somos</span>
                <h3>Creado por y para estudiantes</h3>
                <p>
                    Sabemos que planificar tu cursada en la UTN a veces se siente como una materia más. Entre correlativas cruzadas, fechas de finales y controlar las cuotas, es fácil perder el foco.
                </p>
                <p>
                    <span class="purpose-highlight">Cursus</span> nació en las aulas de la Regional Haedo con el propósito de simplificar tu vida académica. Queremos que te enfoques en lo que realmente importa: aprender y progresar en tu carrera, mientras nosotros nos encargamos de las alertas y la organización visual.
                </p>
            </div>
        </div>
    </section>

    <!-- SECCIÓN ESTADÍSTICAS (Cursus en cifras) -->
    <section class="section" style="padding: 0 5% 60px 5%;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; max-width: 1100px; margin: 0 auto; text-align: center;" class="steps-grid">
            <div style="background: var(--gray-card-bg); backdrop-filter: blur(8px); border: 1px solid var(--gray-card-border); border-radius: var(--r); padding: 30px; transition: all 0.3s;" class="step-card reveal">
                <div style="font-size: 40px; font-weight: 800; color: var(--brand); margin-bottom: 8px;">98%</div>
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-heading); margin: 0 0 6px 0;">Correlativas Cargadas</h4>
                <p style="font-size: 13px; color: var(--text-desc); line-height: 1.5; margin: 0;">Base de datos del Plan TUP 2024 cargada al completo con su respectivo régimen.</p>
            </div>
            <div style="background: var(--gray-card-bg); backdrop-filter: blur(8px); border: 1px solid var(--gray-card-border); border-radius: var(--r); padding: 30px; transition: all 0.3s;" class="step-card reveal">
                <div style="font-size: 40px; font-weight: 800; color: #10b981; margin-bottom: 8px;">100%</div>
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-heading); margin: 0 0 6px 0;">Gratis e Institucional</h4>
                <p style="font-size: 13px; color: var(--text-desc); line-height: 1.5; margin: 0;">Hecho sin fines de lucro para ayudar a organizar el trayecto académico de la FRH.</p>
            </div>
            <div style="background: var(--gray-card-bg); backdrop-filter: blur(8px); border: 1px solid var(--gray-card-border); border-radius: var(--r); padding: 30px; transition: all 0.3s;" class="step-card reveal">
                <div style="height: 48px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; color: #f59e0b;">
                    <i data-lucide="timer" style="width: 42px; height: 42px; stroke-width: 1.75;"></i>
                </div>
                <h4 style="font-size: 16px; font-weight: 700; color: var(--text-heading); margin: 0 0 6px 0;">Productividad Dirigida</h4>
                <p style="font-size: 13px; color: var(--text-desc); line-height: 1.5; margin: 0;">Centralización de apuntes, cronómetro de concentración y seguimiento semanal.</p>
            </div>
        </div>
    </section>

    <!-- SECCIÓN CÓMO FUNCIONA (PASO A PASO) -->
    <section class="section" id="como-funciona" style="padding-top: 60px;">
        <div class="section-header">
            <span class="section-lbl">Funcionamiento</span>
            <h2 class="section-title">¿Cómo funciona Cursus?</h2>
            <p class="section-desc">Poner en marcha tu semestre es cuestión de minutos. Seguí este camino simple:</p>
        </div>

        <div class="steps-grid">
            <div class="step-card">
                <div class="step-num">01</div>
                <div class="step-icon" style="color: var(--brand); display: flex; align-items: center; margin-bottom: 20px;">
                    <i data-lucide="user-plus" style="width: 32px; height: 32px; stroke-width: 1.75;"></i>
                </div>
                <h4 class="step-title">Registrate</h4>
                <p class="step-desc">Creá tu cuenta y accedé al plan de la Tecnicatura en Programación de la UTN Haedo.</p>
            </div>
            <div class="step-card">
                <div class="step-num">02</div>
                <div class="step-icon" style="color: var(--brand); display: flex; align-items: center; margin-bottom: 20px;">
                    <i data-lucide="book-open" style="width: 32px; height: 32px; stroke-width: 1.75;"></i>
                </div>
                <h4 class="step-title">Cargá tus materias</h4>
                <p class="step-desc">Indicá qué materias tenés aprobadas, cuáles estás cursando y cuáles tenés regularizadas.</p>
            </div>
            <div class="step-card">
                <div class="step-num">03</div>
                <div class="step-icon" style="color: var(--brand); display: flex; align-items: center; margin-bottom: 20px;">
                    <i data-lucide="timer" style="width: 32px; height: 32px; stroke-width: 1.75;"></i>
                </div>
                <h4 class="step-title">Estudiá enfocado</h4>
                <p class="step-desc">Usá el temporizador Pomodoro y el Kanban integrados para medir tus horas de estudio real.</p>
            </div>
            <div class="step-card">
                <div class="step-num">04</div>
                <div class="step-icon" style="color: var(--brand); display: flex; align-items: center; margin-bottom: 20px;">
                    <i data-lucide="trending-up" style="width: 32px; height: 32px; stroke-width: 1.75;"></i>
                </div>
                <h4 class="step-title">Medí tu progreso</h4>
                <p class="step-desc">Visualizá tus analíticas de promedio general, simulador de finales y tu fecha estimada de egreso.</p>
            </div>
        </div>
    </section>

    <!-- SECCIÓN BENEFICIOS -->
    <section class="section" id="beneficios">
        <div class="section-header">
            <span class="section-lbl">Beneficios</span>
            <h2 class="section-title">Diseñado para tu éxito académico</h2>
            <p class="section-desc">Cursus centraliza las herramientas académicas necesarias para potenciar tu rendimiento diario.</p>
        </div>

        <div class="benefits-grid">
            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="network" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Correlativas Inteligentes</h4>
                    <p class="benefit-desc">Consultá tu plan de estudios en un árbol gráfico interactivo. Cursus te avisa al instante qué materias tenés bloqueadas y cuáles podés cursar.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="calculator" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Simulador de Promedio</h4>
                    <p class="benefit-desc">Calculá tu promedio real de forma automática. Simulá notas hipotéticas en tus próximos finales para ver cómo impactan en tu desempeño general.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="check-square" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Área de Productividad</h4>
                    <p class="benefit-desc">Temporizador Pomodoro integrado con Kanban dinámico. Registrá tus horas y organizá tus trabajos prácticos en un solo espacio.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="bell" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Alertas y Aranceles</h4>
                    <p class="benefit-desc">Controlá los vencimientos de finales y alertas académicas. Si cursás una tecnicatura, simulá tus pagos y recibí avisos de aumentos de cuota.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="calendar" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Simulador de Horarios</h4>
                    <p class="benefit-desc">Grilla semanal interactiva. Organizá tu cuatrimestre arrastrando bloques, asigná colores temáticos y gestioná dos versiones de horario (A/B) de forma paralela.</p>
                </div>
            </div>

            <div class="benefit-card">
                <div class="benefit-icon-box">
                    <i data-lucide="users" style="width: 26px; height: 26px; stroke-width: 2;"></i>
                </div>
                <div class="benefit-info">
                    <h4 class="benefit-title">Plantillas y Comparación</h4>
                    <p class="benefit-desc">Cargá el horario oficial de tu curso UTN en 1 clic. Compará tu grilla con hasta 3 compañeros y resolvé solapamientos de comisión al instante con el asistente.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- SECCIÓN COMPARATIVA -->
    <section class="section" style="padding-top: 50px; padding-bottom: 60px;">
        <div class="section-header">
            <span class="section-lbl">Diferencias</span>
            <h2 class="section-title">¿Por qué usar Cursus si ya existe Autogestión y el Campus Virtual?</h2>
            <p class="section-desc">Autogestión y el Campus Virtual son los portales institucionales oficiales de la UTN Haedo para trámites y material académico. Cursus es tu organizador diario de cursada. Se complementan perfectamente:</p>
        </div>

        <div class="table-wrapper reveal" style="background: var(--gray-card-bg); backdrop-filter: blur(8px); border-radius: var(--r); border: 1px solid var(--gray-card-border); box-shadow: 0 10px 30px var(--card-shadow); padding: 10px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; color: var(--text-main); min-width: 600px;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--gray-card-border);">
                        <th style="padding: 16px 20px; font-weight: 700; color: var(--text-heading); width: 34%;">Características</th>
                        <th style="padding: 16px 20px; font-weight: 700; color: var(--text-desc); background: var(--table-th-bg);">Autogestión y Campus (UTN)</th>
                        <th style="padding: 16px 20px; font-weight: 700; color: var(--brand); background: var(--table-td-bg-cursus);">Cursus (Tu Asistente)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Inscripción oficial a cursadas y exámenes
                                <span class="tooltip-trigger" data-tooltip="Autogestión registra legalmente tus actas de materias. Cursus no reemplaza este registro, sino que te ayuda a planificarlo de forma interactiva.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #10b981; background: var(--table-td-bg-siu);">Sí (Es obligatorio y legal)</td>
                        <td style="padding: 16px 20px; color: var(--text-desc); background: var(--table-td-bg-cursus);">No (Debes inscribirte en Autogestión)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Árbol visual de correlatividades
                                <span class="tooltip-trigger" data-tooltip="Visualiza de forma interactiva el mapa de materias aprobadas y disponibles según el plan oficial TUP 2024.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Solo listados de texto plano)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Interactivo y en cascada)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Simulador de promedio y egreso
                                <span class="tooltip-trigger" data-tooltip="Calcula cómo afectará tu próxima nota a tu promedio y proyecta la fecha estimada en la que te graduarás.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (No calcula proyecciones)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Simula finales y fecha de egreso)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Cronómetro Pomodoro y tareas Kanban
                                <span class="tooltip-trigger" data-tooltip="Un espacio de estudio enfocado con temporizador y un tablero para organizar tus entregas de trabajos prácticos.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Los profesores casi nunca suben los temas)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Temporizador integrado con logs)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Controlador de cuotas y alertas
                                <span class="tooltip-trigger" data-tooltip="Lleva el control de tus cuotas arancelarias de la TUP y recibe notificaciones de vencimiento al instante.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (No avisa aranceles ni vencimientos)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Simulador de cuotas TUP)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Planificación en múltiples versiones (A/B)
                                <span class="tooltip-trigger" data-tooltip="Crea dos versiones independientes de horarios de cursada para comparar alternativas antes de inscribirte.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Solo muestra tu horario definitivo)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Dos borradores A/B independientes)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Coordinación en grupo (Comparación multiusuario)
                                <span class="tooltip-trigger" data-tooltip="Superpone los horarios de hasta 3 compañeros a la vez en tu grilla para encontrar huecos libres en común.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Debes coordinar con capturas por chat)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Superposición de hasta 3 compañeros)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--gray-card-border);">
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Resolutor de solapamientos (Clash Resolver)
                                <span class="tooltip-trigger" data-tooltip="Busca y sugiere comisiones sin conflicto de forma automática cuando se pisa una materia.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #ef4444; background: var(--table-td-bg-siu);">No (Solo da error al intentar inscribirte)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Sugiere y aplica comisiones viables)</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 20px; font-weight: 700; color: var(--text-heading);">
                            <div style="display: inline-flex; align-items: center; gap: 6px;">
                                Diseño moderno e inmediato
                                <span class="tooltip-trigger" data-tooltip="Accede de forma instantánea a tu información académica con una interfaz moderna, rápida y responsiva.">
                                    <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--text-desc); cursor: help;"></i>
                                </span>
                            </div>
                        </td>
                        <td style="padding: 16px 20px; color: #f59e0b; background: var(--table-td-bg-siu);">No (Requiere loguearse seguido, interfaz rígida)</td>
                        <td style="padding: 16px 20px; color: #10b981; font-weight: 600; background: var(--table-td-bg-cursus);">Sí (Carga instantánea, responsivo)</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- SECCIÓN TESTIMONIOS -->
    <section class="section" id="testimonios" style="padding-top: 40px; padding-bottom: 40px;">
        <div class="section-header">
            <span class="section-lbl">Comunidad</span>
            <h2 class="section-title">Lo que dicen otros alumnos</h2>
            <p class="section-desc">Cursus está ayudando a estudiantes de la UTN Haedo a simplificar su día a día. Esto es lo que nos comparten:</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto;" class="steps-grid">
            <div class="testimonial-card reveal">
                <div>
                    <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                    <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6; font-style: italic; margin: 0 0 20px 0;">"Organizar mi calendario de finales y el árbol de correlativas solía llevarme horas en Excel. Con Cursus es un clic y sé exactamente qué puedo cursar. Una salvación total."</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--card-border); padding-top: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">LM</div>
                    <div>
                        <h5 style="font-size: 13.5px; font-weight: 700; color: var(--text-heading); margin: 0;">Leandro Martínez</h5>
                        <p style="font-size: 11.5px; color: var(--text-desc); margin: 0;">Estudiante de TUP (2° Año)</p>
                    </div>
                </div>
            </div>

            <div class="testimonial-card reveal">
                <div>
                    <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                    <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6; font-style: italic; margin: 0 0 20px 0;">"El cronómetro Pomodoro integrado con el Kanban de entregas me ayudó a concentrarme de verdad para los parciales de Sintaxis y Análisis II. 100% recomendado."</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--card-border); padding-top: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">SF</div>
                    <div>
                        <h5 style="font-size: 13.5px; font-weight: 700; color: var(--text-heading); margin: 0;">Sofía Fernández</h5>
                        <p style="font-size: 11.5px; color: var(--text-desc); margin: 0;">Estudiante de TUP (3° Año)</p>
                    </div>
                </div>
            </div>

            <div class="testimonial-card reveal">
                <div>
                    <div style="color: #f59e0b; font-size: 16px; margin-bottom: 12px;">★★★★★</div>
                    <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6; font-style: italic; margin: 0 0 20px 0;">"Las alertas de vencimientos de cuotas y finales son geniales. Si cursás la tecnicatura con cuota como la TUP, te avisa los aumentos del arancel al instante. Muy práctico."</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--card-border); padding-top: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #ea580c, #d97706); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px;">TG</div>
                    <div>
                        <h5 style="font-size: 13.5px; font-weight: 700; color: var(--text-heading); margin: 0;">Tomás Gómez</h5>
                        <p style="font-size: 11.5px; color: var(--text-desc); margin: 0;">Estudiante de TUP (1° Año)</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- SECCIÓN PREGUNTAS FRECUENTES -->
    <section class="section" id="faq" style="padding-top: 60px;">
        <div class="section-header">
            <span class="section-lbl">FAQs</span>
            <h2 class="section-title">Preguntas Frecuentes</h2>
            <p class="section-desc">Resolvemos tus dudas principales sobre la plataforma Cursus.</p>
        </div>

        <div class="faq-container">
            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>¿Cursus es gratuita para todos los estudiantes de la UTN?</span>
                    <i data-lucide="chevron-down" class="faq-arrow"></i>
                </div>
                <div class="faq-answer">
                    <p>Sí, la plataforma es 100% gratuita para toda la comunidad académica. El desarrollo fue realizado por alumnos de la carrera con el único propósito de ayudar a los estudiantes a organizarse.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>¿Cómo se calculan mis correlatividades y materias disponibles?</span>
                    <i data-lucide="chevron-down" class="faq-arrow"></i>
                </div>
                <div class="faq-answer">
                    <p>Cursus tiene precargada la base de datos oficial de planes de estudio (por ejemplo, la Tecnicatura en Programación Plan 2024). Al indicar el estado de tus materias en la sección "Mis Materias", el sistema calcula automáticamente qué materias correlativas se habilitan o bloquean de forma recursiva.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>¿Necesito un correo institucional para registrarme?</span>
                    <i data-lucide="chevron-down" class="faq-arrow"></i>
                </div>
                <div class="faq-answer">
                    <p>Preferentemente sí, ya que está diseñado para centralizar la información institucional de la UTN FRH. Sin embargo, en el modo desarrollo se permite ingresar a explorar el dashboard para pruebas.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>¿Mis datos están seguros y guardados en la nube?</span>
                    <i data-lucide="chevron-down" class="faq-arrow"></i>
                </div>
                <div class="faq-answer">
                    <p>En el prototipo estático, tus datos se guardan en la memoria local de tu navegador (LocalStorage), por lo que no se pierden al recargar la página. En la versión integrada con Laravel, tu progreso se sincroniza con tu cuenta de usuario de forma segura.</p>
                </div>
            </div>
        </div>
    </section>



    <!-- FOOTER -->
    <footer class="landing-footer">
        <div class="footer-layout">
            <a href="#" class="footer-logo">
                <img src="{{ asset('assets/icons/cursus-logo.svg') }}" alt="Cursus" style="height: 30px; width: auto; border-radius: 6px;">
                <div class="footer-logo-tx">
                    Cursus
                    <small>UTN Haedo</small>
                </div>
            </a>
            <nav class="footer-nav">
                <a href="#que-es">Qué es</a>
                <a href="#como-funciona">Cómo funciona</a>
                <a href="#beneficios">Beneficios</a>
                <a href="{{ route('contacto') }}">Contacto</a>
            </nav>
        </div>
        <div class="footer-bottom">
            <span>&copy; 2026 Cursus. Creado por alumnos para la comunidad de la UTN FRH.</span>
            <span>Tecnicatura Universitaria en Programación</span>
        </div>
    </footer>



    <!-- BOTÓN VOLVER ARRIBA -->
    <button id="scroll-top-btn" class="scroll-top-btn" aria-label="Volver arriba">
        <i data-lucide="arrow-up"></i>
    </button>

    <!-- THEME TOGGLE SHARED -->
    <script src="{{ asset('js/shared/theme.js') }}"></script>
    <!-- SCRIPT DE LOGICA INTERACTIVA -->
    <script src="{{ asset('js/views/welcome.js') }}"></script>
</body>
</html>
