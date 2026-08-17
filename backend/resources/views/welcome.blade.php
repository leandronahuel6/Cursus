{{--
    @fileoverview Vista principal de la landing page de Cursus.
    Extiende el layout base de landing (layouts/landing). No contiene
    etiquetas <html>, <head>, <body>, ni imports globales de scripts o CSS.

    Cambios arquitectónicos:
    - .global-fixed-bg eliminado (era un wrapper div inútil con style inline).
    - .hero-wrapper eliminado (DOM Flattening). Sus propiedades CSS fueron
      absorbidas por .hero-section en welcome.css.
    - Todo `style="..."` eliminado. Reemplazado por clases BEM en welcome.css.
    - Todos los `onclick="..."` eliminados. La lógica es manejada por welcome.js.
    - Los `data-lucide` SVGs no tienen width/height inline; controlados por CSS.
    - Atributos ARIA completos en componentes interactivos (mock tabs, FAQ).
--}}
@extends('layouts.landing')

@section('title', 'Cursus - Tu Asistente Universitario UTN Haedo')
@section('meta-description', 'Cursus es el organizador académico para la UTN Regional Haedo. Controlá correlatividades, promedio, Pomodoro y cuotas en un solo lugar.')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/views/landing/welcome.css') }}">
@endpush

@section('content')

    {{-- ══════════════════════════════════════════════════════════
         HERO — Sin .global-fixed-bg ni .hero-wrapper (DOM Flattening).
         Las props de hero-wrapper fueron absorbidas por .hero-section en CSS.
         ══════════════════════════════════════════════════════════ --}}
    <section class="hero-section" aria-labelledby="hero-title">
        <div class="hero-info">
            <span class="badge-utn">Asistente Estudiantil</span>
            <h1 class="hero-title" id="hero-title">
                Tu camino universitario, organizado en <span>un solo lugar</span>
            </h1>
            <p class="hero-desc">
                Diseñado especialmente para la UTN Regional Haedo. Controlá tus
                materias, hacé seguimiento de tus correlativas, medí tu tiempo de
                estudio y visualizá tu fecha de egreso.
            </p>
            <div class="hero-btns">
                @auth
                    <a href="{{ route('dashboard') }}" class="btn-hero-primary">Ir al Dashboard</a>
                @else
                    <a href="{{ route('register') }}" class="btn-hero-primary">Empezar gratis</a>
                @endauth
                <a href="#que-es" class="btn-hero-secondary">Ver funciones</a>
            </div>
        </div>

        {{-- ── MOCK DASHBOARD INTERACTIVO ──
             El sidebar actúa como tab list (role="tablist").
             Cada .mock-sb-item es un tab (role="tab") con aria-selected y aria-controls.
             Cada panel es un tabpanel (role="tabpanel") con aria-labelledby.
             Los botones Pomo y versiones A/B no tienen onclick; welcome.js
             enlaza todos los eventos con addEventListener.
        --}}
        <div class="hero-visual">
            <div class="mock-dashboard" aria-label="Demo interactiva de Cursus">
                {{-- Barra de títulos del mock --}}
                <div class="mock-hdr-dots" aria-hidden="true">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                    <span class="mock-title">Cursus — Demo Interactiva 🧪</span>
                </div>

                <div class="mock-body">

                    {{-- Sidebar como Tab List --}}
                    <nav
                        class="mock-sidebar"
                        role="tablist"
                        aria-label="Secciones del dashboard"
                        aria-orientation="vertical"
                    >
                        <button
                            class="mock-sb-item active"
                            role="tab"
                            id="tab-inicio"
                            aria-selected="true"
                            aria-controls="mock-tab-inicio"
                            tabindex="0"
                            data-mock-tab="inicio"
                        >
                            <span class="mock-sb-item__icon" aria-hidden="true">⊞</span>
                            <span class="mock-sb-item__label">Inicio</span>
                        </button>
                        <button
                            class="mock-sb-item"
                            role="tab"
                            id="tab-materias"
                            aria-selected="false"
                            aria-controls="mock-tab-materias"
                            tabindex="-1"
                            data-mock-tab="materias"
                        >
                            <span class="mock-sb-item__icon" aria-hidden="true">📚</span>
                            <span class="mock-sb-item__label">Materias</span>
                        </button>
                        <button
                            class="mock-sb-item"
                            role="tab"
                            id="tab-estudio"
                            aria-selected="false"
                            aria-controls="mock-tab-estudio"
                            tabindex="-1"
                            data-mock-tab="estudio"
                        >
                            <span class="mock-sb-item__icon" aria-hidden="true">⏱️</span>
                            <span class="mock-sb-item__label">Estudio</span>
                        </button>
                        <button
                            class="mock-sb-item"
                            role="tab"
                            id="tab-horarios"
                            aria-selected="false"
                            aria-controls="mock-tab-horarios"
                            tabindex="-1"
                            data-mock-tab="horarios"
                        >
                            <span class="mock-sb-item__icon" aria-hidden="true">📅</span>
                            <span class="mock-sb-item__label">Horarios</span>
                        </button>
                        <button
                            class="mock-sb-item"
                            role="tab"
                            id="tab-alertas"
                            aria-selected="false"
                            aria-controls="mock-tab-alertas"
                            tabindex="-1"
                            data-mock-tab="alertas"
                        >
                            <span class="mock-sb-item__icon" aria-hidden="true">🔔</span>
                            <span class="mock-sb-item__label">Alertas</span>
                        </button>
                    </nav>

                    {{-- Contenido principal del mock --}}
                    <div class="mock-main">
                        {{-- Topbar interna --}}
                        <div class="mock-dashboard__topbar" aria-hidden="true">
                            <span class="mock-dashboard__topbar-name" id="mock-user-welcome">Hola, Estudiante! 👋</span>
                            <span class="mock-dashboard__year-badge">TUP 2024</span>
                        </div>

                        {{-- ── PANEL: INICIO ── --}}
                        <div
                            class="mock-tab-panel"
                            id="mock-tab-inicio"
                            role="tabpanel"
                            aria-labelledby="tab-inicio"
                            tabindex="0"
                        >
                            <div class="mock-inicio__grid">
                                <div class="mock-inicio__col">
                                    {{-- Widget Progreso --}}
                                    <div class="mock-widget mock-widget--progress">
                                        <p class="widget-title">📈 Progreso Académico</p>
                                        <div class="mock-widget__progress-row">
                                            <div>
                                                <span class="mock-widget__avg" id="mock-dash-avg">
                                                    <span data-avg-value>8.45</span>
                                                </span>
                                                <span class="mock-widget__avg-label">Promed.</span>
                                            </div>
                                            <div class="mock-widget__progress-bar-track">
                                                <div
                                                    class="mock-widget__progress-bar-fill"
                                                    id="mock-dash-progress-bar"
                                                    data-progress-bar
                                                    role="progressbar"
                                                    aria-valuenow="35"
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                    aria-label="35% de materias aprobadas"
                                                ></div>
                                            </div>
                                            <span class="mock-widget__progress-pct" id="mock-dash-progress-text">35%</span>
                                        </div>
                                    </div>
                                    {{-- Widget Pomodoro (dashboard) --}}
                                    <div class="mock-widget mock-widget--pomo">
                                        <div>
                                            <p class="widget-title">⏱️ Enfoque Pomodoro</p>
                                            <span class="mock-widget__pomo-timer" id="mock-dash-pomodoro-timer">25:00</span>
                                        </div>
                                        <span class="mock-widget__pomo-status" id="mock-dash-pomodoro-status">Estudiando</span>
                                    </div>
                                </div>
                                {{-- Widget Entregas Kanban --}}
                                <div class="mock-widget mock-widget--kanban">
                                    <p class="widget-title">📋 Entregas</p>
                                    <ul class="mock-kanban-list">
                                        <li class="mock-kanban-task mock-kanban-task--urgent">TP Álgebra</li>
                                        <li class="mock-kanban-task mock-kanban-task--warning">Proyecto BD</li>
                                    </ul>
                                </div>
                            </div>
                            {{-- Alerta académica widget --}}
                            <div class="mock-widget mock-widget--alert" aria-live="polite">
                                <span class="mock-widget__alert-text">🔔 Vence cuota arancelaria: N° 4 Junio</span>
                                <span class="mock-widget__alert-amount">$80.000</span>
                            </div>
                        </div>

                        {{-- ── PANEL: MATERIAS ── --}}
                        <div
                            class="mock-tab-panel"
                            id="mock-tab-materias"
                            role="tabpanel"
                            aria-labelledby="tab-materias"
                            tabindex="0"
                            hidden
                        >
                            <div class="mock-subject-header">
                                <span class="mock-subject-header__title">Plan de Estudios (TUP)</span>
                                <span class="mock-subject-header__hint">Hacé clic para aprobar:</span>
                            </div>
                            <div class="mock-subjects-grid">
                                <button
                                    class="mock-subject-card mock-subject-card--approved"
                                    data-subject="prog1"
                                    aria-pressed="true"
                                    aria-label="Programación I — Aprobada"
                                >
                                    <span class="mock-subject-card__name">Prog. I</span>
                                    <span class="mock-subject-card__status">Aprobada (9)</span>
                                </button>
                                <button
                                    class="mock-subject-card mock-subject-card--approved"
                                    data-subject="lab1"
                                    aria-pressed="true"
                                    aria-label="Laboratorio I — Aprobada"
                                >
                                    <span class="mock-subject-card__name">Laboratorio I</span>
                                    <span class="mock-subject-card__status">Aprobada (10)</span>
                                </button>
                                <button
                                    class="mock-subject-card mock-subject-card--approved"
                                    data-subject="spd"
                                    aria-pressed="true"
                                    aria-label="Sistemas y Procesamiento de Datos — Aprobada"
                                >
                                    <span class="mock-subject-card__name">Sist. Proc. Datos</span>
                                    <span class="mock-subject-card__status">Aprobada (8)</span>
                                </button>
                                <button
                                    class="mock-subject-card"
                                    data-subject="prog2"
                                    aria-pressed="false"
                                    aria-label="Programación II — Cursando"
                                >
                                    <span class="mock-subject-card__name">Prog. II</span>
                                    <span class="mock-subject-card__status mock-subject-card__status--cursando">Cursando</span>
                                </button>
                            </div>
                            <div class="mock-subject-summary" aria-live="polite">
                                <span>Promedio: <strong id="mock-subject-avg">9.00</strong></span>
                                <span>Progreso: <strong id="mock-subject-percent">75%</strong></span>
                            </div>
                        </div>

                        {{-- ── PANEL: ESTUDIO (POMODORO) ── --}}
                        <div
                            class="mock-tab-panel mock-pomo-panel"
                            id="mock-tab-estudio"
                            role="tabpanel"
                            aria-labelledby="tab-estudio"
                            tabindex="0"
                            hidden
                        >
                            <p class="mock-pomo-panel__title">Sesión de Enfoque Pomodoro</p>
                            <div
                                class="mock-pomo-panel__timer"
                                id="mock-pomo-timer"
                                role="timer"
                                aria-label="Temporizador Pomodoro"
                                aria-live="off"
                            >25:00</div>
                            <div class="mock-pomo-panel__controls">
                                <button
                                    id="mock-pomo-play-btn"
                                    class="mock-pomo-btn mock-pomo-btn--play"
                                    aria-label="Iniciar temporizador Pomodoro"
                                    type="button"
                                >Iniciar</button>
                                <button
                                    id="mock-pomo-reset-btn"
                                    class="mock-pomo-btn mock-pomo-btn--reset"
                                    aria-label="Reiniciar temporizador"
                                    type="button"
                                >Reiniciar</button>
                            </div>
                            <p class="mock-pomo-panel__desc" id="mock-pomo-desc" aria-live="polite">
                                Hacé clic en Iniciar para simular el temporizador Pomodoro.
                            </p>
                        </div>

                        {{-- ── PANEL: HORARIOS ── --}}
                        <div
                            class="mock-tab-panel"
                            id="mock-tab-horarios"
                            role="tabpanel"
                            aria-labelledby="tab-horarios"
                            tabindex="0"
                            hidden
                        >
                            <div class="mock-schedule-header">
                                <div class="mock-schedule-versions">
                                    <button
                                        id="mock-ver-a"
                                        class="mock-version-btn mock-version-btn--active"
                                        type="button"
                                        aria-pressed="true"
                                    >Versión A</button>
                                    <button
                                        id="mock-ver-b"
                                        class="mock-version-btn mock-version-btn--inactive"
                                        type="button"
                                        aria-pressed="false"
                                    >Versión B</button>
                                </div>
                                <span class="mock-schedule-course-badge">Curso N1_1 📅</span>
                            </div>
                            <div class="mock-schedule-compare-chips" aria-hidden="true">
                                <span class="mock-compare-chip mock-compare-chip--self">
                                    <span class="mock-compare-chip__dot"></span>Vos
                                </span>
                                <span class="mock-compare-chip mock-compare-chip--other" id="mock-compare-chip">
                                    <span class="mock-compare-chip__dot"></span>Leandro (Comparando)
                                </span>
                            </div>
                            {{-- Lista de horarios (rebuilt por welcome.js al cambiar versión) --}}
                            <div class="mock-schedule-list" id="mock-schedule-list" aria-live="polite">
                                <div class="mock-schedule-row">
                                    <span class="mock-schedule-row__day">Lunes</span>
                                    <div class="mock-schedule-row__content">
                                        <span class="mock-schedule-row__subject">
                                            Programación II
                                            <small class="mock-schedule-row__time">(18:30 - 22:30)</small>
                                        </span>
                                        <span id="mock-overlap-block" class="mock-overlap-tag">
                                            ⚡ Solapamiento: Inglés I (Leandro)
                                        </span>
                                    </div>
                                </div>
                                <div class="mock-schedule-row">
                                    <span class="mock-schedule-row__day">Martes</span>
                                    <span class="mock-schedule-row__subject">
                                        Base de Datos I
                                        <small class="mock-schedule-row__time">(18:30 - 21:30)</small>
                                    </span>
                                </div>
                                <div class="mock-schedule-row">
                                    <span class="mock-schedule-row__day">Jueves</span>
                                    <span class="mock-schedule-row__subject">
                                        Prob. y Estadística
                                        <small class="mock-schedule-row__time">(18:30 - 21:30)</small>
                                    </span>
                                </div>
                            </div>
                            <div
                                class="mock-clash-resolver"
                                id="mock-clash-resolver-bar"
                                aria-live="polite"
                            >
                                <span class="mock-clash-resolver__text">💡 Resolutor: Usar Com. N1-2 para Inglés I</span>
                                <button
                                    id="mock-resolve-btn"
                                    class="mock-clash-resolver__btn"
                                    type="button"
                                    aria-label="Resolver solapamiento de horarios"
                                >Resolver</button>
                            </div>
                        </div>

                        {{-- ── PANEL: ALERTAS ── --}}
                        <div
                            class="mock-tab-panel"
                            id="mock-tab-alertas"
                            role="tabpanel"
                            aria-labelledby="tab-alertas"
                            tabindex="0"
                            hidden
                        >
                            <p class="mock-alerts-panel__title">Notificaciones y Alertas</p>
                            <div class="mock-alerts-list">
                                <div
                                    class="mock-alert-card mock-alert-card--payment"
                                    id="mock-alert-payment-card"
                                    aria-live="polite"
                                >
                                    <div>
                                        <span class="mock-alert-card__title">Cuota Arancelaria N° 4</span>
                                        <span class="mock-alert-card__desc">Vence en 5 días • $80.000</span>
                                    </div>
                                    <button
                                        id="mock-pay-btn"
                                        class="mock-pay-btn"
                                        type="button"
                                        aria-label="Marcar cuota como pagada"
                                    >Pagar</button>
                                </div>
                                <div class="mock-alert-card">
                                    <span class="mock-alert-card__title mock-alert-card__title--orange">Inscripción a Finales</span>
                                    <span class="mock-alert-card__desc mock-alert-card__desc--muted">
                                        Inscripciones abiertas en Autogestión hasta el 30/06.
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>{{-- /.mock-main --}}
                </div>{{-- /.mock-body --}}
            </div>{{-- /.mock-dashboard --}}
        </div>{{-- /.hero-visual --}}
    </section>

    {{-- ══════════════════════════════════════════════════════════
         SECCIÓN: PROPÓSITO (QUIÉNES SOMOS)
         ══════════════════════════════════════════════════════════ --}}
    <section class="section" id="que-es" aria-labelledby="purpose-heading">
        <div class="purpose-section reveal">
            <div class="purpose-visual">
                <img
                    src="{{ asset('assets/img/lnicio.webp') }}"
                    alt="Captura del panel de inicio de Cursus mostrando progreso académico"
                    width="560"
                    height="420"
                    loading="lazy"
                >
            </div>
            <div class="purpose-text">
                <span class="section-lbl">Quiénes Somos</span>
                <h2 id="purpose-heading">Creado por y para estudiantes</h2>
                <p>
                    Sabemos que planificar tu cursada en la UTN a veces se siente como una materia más.
                    Entre correlativas cruzadas, fechas de finales y controlar las cuotas, es fácil perder el foco.
                </p>
                <p>
                    <span class="purpose-highlight">Cursus</span> nació en las aulas de la Regional Haedo
                    con el propósito de simplificar tu vida académica. Queremos que te enfoques en lo que
                    realmente importa: aprender y progresar en tu carrera, mientras nosotros nos encargamos
                    de las alertas y la organización visual.
                </p>
            </div>
        </div>
    </section>

    {{-- ══════════════════════════════════════════════════════════
         SECCIÓN: ESTADÍSTICAS
         ══════════════════════════════════════════════════════════ --}}
    <section class="section" aria-label="Cursus en cifras">
        <div class="stats-grid">
            <article class="step-card reveal">
                <p class="stat-value">98%</p>
                <h3 class="stat-title">Correlativas Cargadas</h3>
                <p class="stat-desc">Base de datos del Plan TUP 2024 cargada al completo con su respectivo régimen.</p>
            </article>
            <article class="step-card reveal">
                <p class="stat-value stat-value--green">100%</p>
                <h3 class="stat-title">Gratis e Institucional</h3>
                <p class="stat-desc">Hecho sin fines de lucro para ayudar a organizar el trayecto académico de la FRH.</p>
            </article>
            <article class="step-card reveal">
                <div class="stat-icon-wrap" aria-hidden="true">
                    <i data-lucide="timer"></i>
                </div>
                <h3 class="stat-title">Productividad Dirigida</h3>
                <p class="stat-desc">Centralización de apuntes, cronómetro de concentración y seguimiento semanal.</p>
            </article>
        </div>
    </section>

    {{-- ══════════════════════════════════════════════════════════
         SECCIÓN: CÓMO FUNCIONA
         ══════════════════════════════════════════════════════════ --}}
    <section class="section" id="como-funciona" aria-labelledby="how-it-works-heading">
        <div class="section-header">
            <span class="section-lbl">Funcionamiento</span>
            <h2 class="section-title" id="how-it-works-heading">¿Cómo funciona Cursus?</h2>
            <p class="section-desc">Poner en marcha tu semestre es cuestión de minutos. Seguí este camino simple:</p>
        </div>
        <div class="steps-grid">
            <article class="step-card reveal">
                <span class="step-num" aria-hidden="true">01</span>
                <div class="step-icon" aria-hidden="true">
                    <i data-lucide="user-plus"></i>
                </div>
                <h3 class="step-title">Registrate</h3>
                <p class="step-desc">Creá tu cuenta y accedé al plan de la Tecnicatura en Programación de la UTN Haedo.</p>
            </article>
            <article class="step-card reveal">
                <span class="step-num" aria-hidden="true">02</span>
                <div class="step-icon" aria-hidden="true">
                    <i data-lucide="book-open"></i>
                </div>
                <h3 class="step-title">Cargá tus materias</h3>
                <p class="step-desc">Indicá qué materias tenés aprobadas, cuáles estás cursando y cuáles tenés regularizadas.</p>
            </article>
            <article class="step-card reveal">
                <span class="step-num" aria-hidden="true">03</span>
                <div class="step-icon" aria-hidden="true">
                    <i data-lucide="timer"></i>
                </div>
                <h3 class="step-title">Estudiá enfocado</h3>
                <p class="step-desc">Usá el temporizador Pomodoro y el Kanban integrados para medir tus horas de estudio real.</p>
            </article>
            <article class="step-card reveal">
                <span class="step-num" aria-hidden="true">04</span>
                <div class="step-icon" aria-hidden="true">
                    <i data-lucide="trending-up"></i>
                </div>
                <h3 class="step-title">Medí tu progreso</h3>
                <p class="step-desc">Visualizá tus analíticas de promedio general, simulador de finales y tu fecha estimada de egreso.</p>
            </article>
        </div>
    </section>

    {{-- ══════════════════════════════════════════════════════════
         SECCIÓN: BENEFICIOS
         ══════════════════════════════════════════════════════════ --}}
    <section class="section" id="beneficios" aria-labelledby="benefits-heading">
        <div class="section-header">
            <span class="section-lbl">Beneficios</span>
            <h2 class="section-title" id="benefits-heading">Diseñado para tu éxito académico</h2>
            <p class="section-desc">Cursus centraliza las herramientas académicas necesarias para potenciar tu rendimiento diario.</p>
        </div>
        <div class="benefits-grid">
            <article class="benefit-card reveal">
                <div class="benefit-icon-box" aria-hidden="true">
                    <i data-lucide="network"></i>
                </div>
                <div class="benefit-info">
                    <h3 class="benefit-title">Correlativas Inteligentes</h3>
                    <p class="benefit-desc">Consultá tu plan de estudios en un árbol gráfico interactivo. Cursus te avisa al instante qué materias tenés bloqueadas y cuáles podés cursar.</p>
                </div>
            </article>
            <article class="benefit-card reveal">
                <div class="benefit-icon-box" aria-hidden="true">
                    <i data-lucide="calculator"></i>
                </div>
                <div class="benefit-info">
                    <h3 class="benefit-title">Simulador de Promedio</h3>
                    <p class="benefit-desc">Calculá tu promedio real de forma automática. Simulá notas hipotéticas en tus próximos finales para ver cómo impactan en tu desempeño general.</p>
                </div>
            </article>
            <article class="benefit-card reveal">
                <div class="benefit-icon-box" aria-hidden="true">
                    <i data-lucide="check-square"></i>
                </div>
                <div class="benefit-info">
                    <h3 class="benefit-title">Área de Productividad</h3>
                    <p class="benefit-desc">Temporizador Pomodoro integrado con Kanban dinámico. Registrá tus horas y organizá tus trabajos prácticos en un solo espacio.</p>
                </div>
            </article>
            <article class="benefit-card reveal">
                <div class="benefit-icon-box" aria-hidden="true">
                    <i data-lucide="bell"></i>
                </div>
                <div class="benefit-info">
                    <h3 class="benefit-title">Alertas y Aranceles</h3>
                    <p class="benefit-desc">Controlá los vencimientos de finales y alertas académicas. Si cursás una tecnicatura, simulá tus pagos y recibí avisos de aumentos de cuota.</p>
                </div>
            </article>
            <article class="benefit-card reveal">
                <div class="benefit-icon-box" aria-hidden="true">
                    <i data-lucide="calendar"></i>
                </div>
                <div class="benefit-info">
                    <h3 class="benefit-title">Simulador de Horarios</h3>
                    <p class="benefit-desc">Grilla semanal interactiva. Organizá tu cuatrimestre arrastrando bloques, asigná colores temáticos y gestioná dos versiones de horario (A/B) de forma paralela.</p>
                </div>
            </article>
            <article class="benefit-card reveal">
                <div class="benefit-icon-box" aria-hidden="true">
                    <i data-lucide="users"></i>
                </div>
                <div class="benefit-info">
                    <h3 class="benefit-title">Plantillas y Comparación</h3>
                    <p class="benefit-desc">Cargá el horario oficial de tu curso UTN en 1 clic. Compará tu grilla con hasta 3 compañeros y resolvé solapamientos de comisión al instante con el asistente.</p>
                </div>
            </article>
        </div>
    </section>

    {{-- ══════════════════════════════════════════════════════════
         SECCIÓN: TABLA COMPARATIVA
         ══════════════════════════════════════════════════════════ --}}
    <section class="section" id="diferencias" aria-labelledby="compare-heading">
        <div class="section-header">
            <span class="section-lbl">Diferencias</span>
            <h2 class="section-title" id="compare-heading">¿Por qué usar Cursus si ya existe Autogestión y el Campus Virtual?</h2>
            <p class="section-desc">Autogestión y el Campus Virtual son los portales institucionales oficiales de la UTN Haedo para trámites y material académico. Cursus es tu organizador diario de cursada. Se complementan perfectamente:</p>
        </div>
        <div class="table-wrapper reveal">
            <div class="table-responsive">
                <table class="comparison-table" role="table" aria-label="Comparativa entre Autogestión y Cursus">
                <thead>
                    <tr>
                        <th scope="col">Características</th>
                        <th scope="col" class="col-siu">Autogestión y Campus (UTN)</th>
                        <th scope="col" class="col-cursus">Cursus (Tu Asistente)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Inscripción oficial a cursadas y exámenes
                                <span class="tooltip-trigger" data-tooltip="Autogestión registra legalmente tus actas de materias. Cursus no reemplaza este registro, sino que te ayuda a planificarlo de forma interactiva.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu has-feature">Sí (Es obligatorio y legal)</td>
                        <td class="col-cursus no-feature-neutral">No (Debes inscribirte en Autogestión)</td>
                    </tr>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Árbol visual de correlatividades
                                <span class="tooltip-trigger" data-tooltip="Visualiza de forma interactiva el mapa de materias aprobadas y disponibles según el plan oficial TUP 2024.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu no-feature">No (Solo listados de texto plano)</td>
                        <td class="col-cursus has-feature">Sí (Interactivo y en cascada)</td>
                    </tr>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Simulador de promedio y egreso
                                <span class="tooltip-trigger" data-tooltip="Calcula cómo afectará tu próxima nota a tu promedio y proyecta la fecha estimada en la que te graduarás.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu no-feature">No (No calcula proyecciones)</td>
                        <td class="col-cursus has-feature">Sí (Simula finales y fecha de egreso)</td>
                    </tr>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Cronómetro Pomodoro y tareas Kanban
                                <span class="tooltip-trigger" data-tooltip="Un espacio de estudio enfocado con temporizador y un tablero para organizar tus entregas de trabajos prácticos.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu no-feature">No (Los profesores casi nunca suben los temas)</td>
                        <td class="col-cursus has-feature">Sí (Temporizador integrado con logs)</td>
                    </tr>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Controlador de cuotas y alertas
                                <span class="tooltip-trigger" data-tooltip="Lleva el control de tus cuotas arancelarias de la TUP y recibe notificaciones de vencimiento al instante.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu no-feature">No (No avisa aranceles ni vencimientos)</td>
                        <td class="col-cursus has-feature">Sí (Simulador de cuotas TUP)</td>
                    </tr>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Planificación en múltiples versiones (A/B)
                                <span class="tooltip-trigger" data-tooltip="Crea dos versiones independientes de horarios de cursada para comparar alternativas antes de inscribirte.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu no-feature">No (Solo muestra tu horario definitivo)</td>
                        <td class="col-cursus has-feature">Sí (Dos borradores A/B independientes)</td>
                    </tr>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Coordinación en grupo (Comparación multiusuario)
                                <span class="tooltip-trigger" data-tooltip="Superpone los horarios de hasta 3 compañeros a la vez en tu grilla para encontrar huecos libres en común.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu no-feature">No (Debes coordinar con capturas por chat)</td>
                        <td class="col-cursus has-feature">Sí (Superposición de hasta 3 compañeros)</td>
                    </tr>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Resolutor de solapamientos (Clash Resolver)
                                <span class="tooltip-trigger" data-tooltip="Busca y sugiere comisiones sin conflicto de forma automática cuando se pisa una materia.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu no-feature">No (Solo da error al intentar inscribirte)</td>
                        <td class="col-cursus has-feature">Sí (Sugiere y aplica comisiones viables)</td>
                    </tr>
                    <tr>
                        <td class="col-feature">
                            <span class="table-feature-cell">
                                Diseño moderno e inmediato
                                <span class="tooltip-trigger" data-tooltip="Accede de forma instantánea a tu información académica con una interfaz moderna, rápida y responsiva.">
                                    <i data-lucide="help-circle" aria-label="Más información"></i>
                                </span>
                            </span>
                        </td>
                        <td class="col-siu partial-feature">No (Requiere loguearse seguido, interfaz rígida)</td>
                        <td class="col-cursus has-feature">Sí (Carga instantánea, responsivo)</td>
                    </tr>
                </tbody>
                </table>
            </div>
        </div>
    </section>

    {{-- ══════════════════════════════════════════════════════════
         SECCIÓN: TESTIMONIOS
         ══════════════════════════════════════════════════════════ --}}
    <section class="section" id="testimonios" aria-labelledby="testimonials-heading">
        <div class="section-header">
            <span class="section-lbl">Comunidad</span>
            <h2 class="section-title" id="testimonials-heading">Lo que dicen otros alumnos</h2>
            <p class="section-desc">Cursus está ayudando a estudiantes de la UTN Haedo a simplificar su día a día. Esto es lo que nos comparten:</p>
        </div>
        <div class="testimonials-grid">
            <article class="testimonial-card reveal">
                <div>
                    <p class="testimonial-stars" aria-label="5 estrellas">★★★★★</p>
                    <blockquote class="testimonial-quote">
                        "Organizar mi calendario de finales y el árbol de correlativas solía llevarme horas en Excel. Con Cursus es un clic y sé exactamente qué puedo cursar. Una salvación total."
                    </blockquote>
                </div>
                <footer class="testimonial-author">
                    <div class="testimonial-avatar testimonial-avatar--blue" aria-hidden="true">LM</div>
                    <div>
                        <p class="testimonial-author__name">Leandro Martínez</p>
                        <p class="testimonial-author__role">Estudiante de TUP (2° Año)</p>
                    </div>
                </footer>
            </article>
            <article class="testimonial-card reveal">
                <div>
                    <p class="testimonial-stars" aria-label="5 estrellas">★★★★★</p>
                    <blockquote class="testimonial-quote">
                        "El cronómetro Pomodoro integrado con el Kanban de entregas me ayudó a concentrarme de verdad para los parciales de Sintaxis y Análisis II. 100% recomendado."
                    </blockquote>
                </div>
                <footer class="testimonial-author">
                    <div class="testimonial-avatar testimonial-avatar--green" aria-hidden="true">SF</div>
                    <div>
                        <p class="testimonial-author__name">Sofía Fernández</p>
                        <p class="testimonial-author__role">Estudiante de TUP (3° Año)</p>
                    </div>
                </footer>
            </article>
            <article class="testimonial-card reveal">
                <div>
                    <p class="testimonial-stars" aria-label="5 estrellas">★★★★★</p>
                    <blockquote class="testimonial-quote">
                        "Las alertas de vencimientos de cuotas y finales son geniales. Si cursás la tecnicatura con cuota como la TUP, te avisa los aumentos del arancel al instante. Muy práctico."
                    </blockquote>
                </div>
                <footer class="testimonial-author">
                    <div class="testimonial-avatar testimonial-avatar--orange" aria-hidden="true">TG</div>
                    <div>
                        <p class="testimonial-author__name">Tomás Gómez</p>
                        <p class="testimonial-author__role">Estudiante de TUP (1° Año)</p>
                    </div>
                </footer>
            </article>
        </div>
    </section>

    {{-- ══════════════════════════════════════════════════════════
         SECCIÓN: FAQ (ACORDEÓN)
         Los .faq-question son <button> con aria-expanded gestionado por welcome.js.
         Sin onclick ni window.toggleFaq.
         ══════════════════════════════════════════════════════════ --}}
    <section class="section" id="faq" aria-labelledby="faq-heading">
        <div class="section-header">
            <span class="section-lbl">FAQs</span>
            <h2 class="section-title" id="faq-heading">Preguntas Frecuentes</h2>
            <p class="section-desc">Resolvemos tus dudas principales sobre la plataforma Cursus.</p>
        </div>
        <div class="faq-container">
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false" type="button">
                    <span>¿Cursus es gratuita para todos los estudiantes de la UTN?</span>
                    <i data-lucide="chevron-down" class="faq-arrow" aria-hidden="true"></i>
                </button>
                <div class="faq-answer">
                    <p>Sí, la plataforma es 100% gratuita para toda la comunidad académica. El desarrollo fue realizado por alumnos de la carrera con el único propósito de ayudar a los estudiantes a organizarse.</p>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false" type="button">
                    <span>¿Cómo se calculan mis correlatividades y materias disponibles?</span>
                    <i data-lucide="chevron-down" class="faq-arrow" aria-hidden="true"></i>
                </button>
                <div class="faq-answer">
                    <p>Cursus tiene precargada la base de datos oficial de planes de estudio (por ejemplo, la Tecnicatura en Programación Plan 2024). Al indicar el estado de tus materias en la sección "Mis Materias", el sistema calcula automáticamente qué materias correlativas se habilitan o bloquean de forma recursiva.</p>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false" type="button">
                    <span>¿Necesito un correo institucional para registrarme?</span>
                    <i data-lucide="chevron-down" class="faq-arrow" aria-hidden="true"></i>
                </button>
                <div class="faq-answer">
                    <p>Preferentemente sí, ya que está diseñado para centralizar la información institucional de la UTN FRH. Sin embargo, en el modo desarrollo se permite ingresar a explorar el dashboard para pruebas.</p>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false" type="button">
                    <span>¿Mis datos están seguros y guardados en la nube?</span>
                    <i data-lucide="chevron-down" class="faq-arrow" aria-hidden="true"></i>
                </button>
                <div class="faq-answer">
                    <p>En el prototipo estático, tus datos se guardan en la memoria local de tu navegador (LocalStorage), por lo que no se pierden al recargar la página. En la versión integrada con Laravel, tu progreso se sincroniza con tu cuenta de usuario de forma segura.</p>
                </div>
            </div>
        </div>
    </section>

@endsection

@push('scripts')
    <script type="module" src="{{ asset('js/views/landing/welcome.js') }}"></script>
@endpush
